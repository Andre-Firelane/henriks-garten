// Leuchtnacht (Event im Dschungel, docs/plan-leuchtnacht.md): es wird Nacht. Unter Büschen und Pflanzen leuchten kleine
// Pilze türkis bis grün und pulsieren langsam; die Pfeilgiftfrösche sitzen am Wasser und leuchten in ihrer Farbe (siehe
// DartFrog.js), mit dem Froschglas aus der Kiste fängt man sie (GardenScene.updateDartFrogs). Eine Überlagerung über
// der laufenden Map wie der Glühwürmchen-Abend (Fireflies.js), nichts wird neu geladen. Pilze sind nur Bild.
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';
import { MAP_W, MAP_H, buildingAt, charAt, inPen, isBlocked } from './map.js';
import { NIGHT_DEPTH } from '../animals/Wolf.js';
import { glowTexture } from './Fireflies.js';

const NIGHT = 0x081a24; // tiefes Nachtblau mit etwas Grün
const NIGHT_ALPHA = 0.72;
const FADE_MS = 1800;
const PLANTS = 'nqľfḟḢĎJk'; // neben diesen Pflanzen (Büsche, Farne, Dickicht, Bäume) wachsen die Leuchtpilze
const SPOTS = 220; // so viele Pilzgruppen (über die ganze Karte verteilt, auch im Wald an den Seiten)
// Kacheln vor einer Stelle (näher am Betrachter): steht dort etwas, verdeckt es die Stelle (auch für die Frösche)
export const FRONT = [];
// steht hier etwas Hohes (Baum, Busch, Hütte …)? Wasser zählt nicht, es ist flach
export const isTall = (tx, ty) => isBlocked(tx, ty) && charAt(tx, ty) !== '~';
for (let dy = 0; dy <= 4; dy++) for (let dx = 0; dx <= 4; dx++) if (dx || dy) FRONT.push([dx, dy]);
// für die Pilze: verdeckt nur, was auf dem Bildschirm wirklich darüber steht – ein Ding ein paar Kacheln davor (näher
// am Betrachter) steht unter der Stelle; sein Bild reicht seitlich side (|dx − dy|) und nach oben up (dx + dy) Kacheln
// weit (Urwaldbaum 96 × 160, Mangrove 96 × 112, Dickicht 64 × 64, Busch 56 × 44). Vorher galt für alles ein Feld von
// 4 × 4 Kacheln: im Wald gab es dann kaum Pilze, nur am Ufer
const PILZ_COVER = { J: [1, 9], Ṁ: [1, 6], Ď: [1, 3] };
const PILZ_COVER_OTHER = [0, 2];
const pilzCovered = (tx, ty) => {
  for (let dy = 0; dy <= 9; dy++) {
    for (let dx = 0; dx <= 9; dx++) {
      if (!dx && !dy) continue;
      const x = tx + dx;
      const y = ty + dy;
      if (!isTall(x, y)) continue;
      if (buildingAt(x, y)) {
        if (dx <= 4 && dy <= 4) return true; // Hütten wie bisher
        continue;
      }
      const [side, up] = PILZ_COVER[charAt(x, y)] ?? PILZ_COVER_OTHER;
      if (Math.abs(dx - dy) <= side && dx + dy <= up) return true;
    }
  }
  return false;
};
const PILZ_COLORS = [0x5cf2d6, 0x7dff9a, 0x48d8ff, 0xb0ff6a];

export default class GlowNight {
  constructor(scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    this.dark = scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width * 4, cam.height * 4, NIGHT, 0).setScrollFactor(0).setDepth(NIGHT_DEPTH);
    scene.tweens.add({ targets: this.dark, fillAlpha: NIGHT_ALPHA, duration: FADE_MS });
    const glow = glowTexture(scene);
    this.spots = [];
    for (const t of Phaser.Utils.Array.Shuffle(plantEdges()).slice(0, SPOTS)) {
      const p = tileToWorld(t.tx + Phaser.Math.FloatBetween(-0.3, 0.3), t.ty + Phaser.Math.FloatBetween(-0.3, 0.3));
      const color = Phaser.Utils.Array.GetRandom(PILZ_COLORS);
      const halo = scene.add.image(p.x, p.y - 3, glow).setBlendMode(Phaser.BlendModes.ADD).setTint(color).setScale(Phaser.Math.FloatBetween(0.6, 0.9), 0.45).setAlpha(0).setDepth(NIGHT_DEPTH + 1);
      // zwei, drei kleine Hüte
      const caps = Array.from({ length: Phaser.Math.Between(2, 3) }, () => {
        const dx = Phaser.Math.FloatBetween(-9, 9);
        const dy = Phaser.Math.FloatBetween(-2, 2);
        const r = Phaser.Math.FloatBetween(2, 3.4);
        return scene.add.ellipse(p.x + dx, p.y + dy - r, r * 2.4, r * 1.4, color, 0).setDepth(NIGHT_DEPTH + 2);
      });
      this.spots.push({ halo, caps, phase: Math.random() * 10, speed: Phaser.Math.FloatBetween(0.6, 1.2) });
    }
    this.time = 0;
  }

  // wie dunkel es gerade ist (0 bis 1, für die Lichthöfe der Frösche beim Ein- und Ausblenden)
  get level() {
    return this.dark.fillAlpha / NIGHT_ALPHA;
  }

  update(dt) {
    this.time += dt;
    const k = this.level;
    for (const s of this.spots) {
      const pulse = 0.6 + Math.sin(this.time * s.speed + s.phase) * 0.4;
      s.halo.setAlpha(k * (0.35 + pulse * 0.45));
      for (const c of s.caps) c.setFillStyle(c.fillColor, k * (0.55 + pulse * 0.45));
    }
  }

  // Event vorbei: es wird wieder hell
  destroy() {
    const scene = this.scene;
    const objs = this.spots.flatMap((s) => [s.halo, ...s.caps]);
    scene.tweens.add({ targets: this.dark, fillAlpha: 0, duration: FADE_MS });
    scene.tweens.add({ targets: objs, alpha: 0, duration: FADE_MS });
    scene.time.delayedCall(FADE_MS + 100, () => [this.dark, ...objs].forEach((o) => o.destroy()));
    this.spots = [];
  }
}

// freie Kacheln direkt neben Pflanzen (nicht in Gehegen)
function plantEdges() {
  const out = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (isBlocked(tx, ty) || inPen(tx, ty)) continue;
      // nicht hinter Bäumen und Büschen (die Pilze liegen über der Dunkelheit und schienen sonst auf den Kronen)
      if (pilzCovered(tx, ty)) continue; // (Urwaldbäume sind hoch: bis 4 Kacheln davor)
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => PLANTS.includes(charAt(tx + dx, ty + dy)))) out.push({ tx, ty });
    }
  }
  return out;
}
