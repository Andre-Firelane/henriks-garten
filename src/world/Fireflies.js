// Glühwürmchen-Abend (Event im Bambuswald): es wird Abend – das Licht wird dämmrig, die Steinlaternen und das rote Tor
// leuchten warm, und überall schweben Glühwürmchen. Mit dem Glas aus der Hütte fängt man sie (siehe FireflyJar.js);
// mit 3 im Glas leuchtet es und lockt die roten Pandas aus den Kirschbäumen (siehe RedPanda.js).
// Glühwürmchen sind keine Tiere: sie werden nicht gezählt und nicht gespeichert.
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';
import { MAP_W, MAP_H, charAt, inPen, isBlocked } from './map.js';
import { NIGHT_DEPTH } from '../animals/Wolf.js';

const DUSK = 0x1c1640; // Dämmerungsblau
const DUSK_ALPHA = 0.5;
const FLIES = 36; // so viele Glühwürmchen schweben gleichzeitig
const FLY_HEIGHT = [10, 34]; // so hoch über dem Boden
const FLY_ROAM = 26; // so weit kreisen sie um ihren Platz
const RESPAWN_MS = 3000; // gefangene tauchen nach so langer Zeit woanders wieder auf
const RED_PANDAS = 2; // so viele rote Pandas sitzen gleichzeitig in den Kirschbäumen
const REFILL_DELAY = 15; // nach einem Fang kommt erst nach so vielen Sekunden ein neuer dazu
const LANTERN_UP = 30; // Höhe des Lichts über dem Fuß der Steinlaterne
const TORII_UP = 86; // ... und über dem Fuß des roten Tors
// Lichtschein auf dem Boden: auf dem Boden unter allen Figuren (sonst leuchtet er über Tiere und Spieler, die darin stehen),
// damit auch unter der Dämmerung; die halb deckt ihn ab, daher doppelt so stark
const POOL_DEPTH = -98000;
const POOL_ALPHA = 0.7; // mal Dämmerung

export default class FireflyEvening {
  constructor(scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    this.dark = scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width * 4, cam.height * 4, DUSK, 0).setScrollFactor(0).setDepth(NIGHT_DEPTH);
    scene.tweens.add({ targets: this.dark, fillAlpha: DUSK_ALPHA, duration: 1500 });
    const glow = glowTexture(scene);
    // warmes Licht der Steinlaternen und des roten Tors (flackert leicht)
    this.lights = [];
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const c = charAt(tx, ty);
        if (c !== 'l' && c !== 'I') continue;
        const p = tileToWorld(tx, ty);
        const big = c === 'I';
        const img = scene.add.image(p.x, p.y - (big ? TORII_UP : LANTERN_UP), glow).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffb050).setScale(big ? 1.4 : 1.1).setAlpha(0).setDepth(NIGHT_DEPTH + 1);
        const pool = scene.add.ellipse(p.x, p.y + 2, big ? 90 : 60, big ? 30 : 20, 0xffc070, 0).setBlendMode(Phaser.BlendModes.ADD).setDepth(POOL_DEPTH);
        this.lights.push({ img, pool, phase: Math.random() * 10, big });
      }
    }
    this.flies = Array.from({ length: FLIES }, () => this.newFly(glow));
    this.time = 0;
    this.pandaIn = 0;
  }

  // ein Glühwürmchen an einem freien Platz (nicht in Gehegen, nicht am Rand)
  newFly(glow) {
    let t;
    for (let i = 0; i < 30; i++) {
      t = { tx: Phaser.Math.Between(2, MAP_W - 3), ty: Phaser.Math.Between(2, MAP_H - 3) };
      if (!isBlocked(t.tx, t.ty) && !inPen(t.tx, t.ty)) break;
    }
    const p = tileToWorld(t.tx + Phaser.Math.FloatBetween(-0.4, 0.4), t.ty + Phaser.Math.FloatBetween(-0.4, 0.4));
    const halo = this.scene.add.image(0, 0, glow ?? glowTexture(this.scene)).setBlendMode(Phaser.BlendModes.ADD).setTint(0xd8ff70).setScale(0.32).setDepth(NIGHT_DEPTH + 2);
    const core = this.scene.add.circle(0, 0, 1.3, 0xffffd0).setDepth(NIGHT_DEPTH + 3);
    return { x0: p.x, y0: p.y, h: Phaser.Math.FloatBetween(...FLY_HEIGHT), phase: Math.random() * 20, speed: Phaser.Math.FloatBetween(0.4, 0.8), halo, core, x: p.x, y: p.y };
  }

  // Glühwürmchen fangen, für die hit(f) zutrifft (f.x/f.y: Punkt am Boden unter ihm); gibt die Anzahl zurück
  catchWhere(hit) {
    let n = 0;
    for (const f of this.flies) {
      if (f.gone || !hit(f)) continue;
      f.gone = true;
      f.halo.setVisible(false);
      f.core.setVisible(false);
      n++;
      this.scene.time.delayedCall(RESPAWN_MS, () => {
        if (!this.flies.includes(f)) return;
        f.halo.destroy();
        f.core.destroy();
        this.flies[this.flies.indexOf(f)] = this.newFly();
      });
    }
    return n;
  }

  update(dt) {
    this.time += dt;
    for (const l of this.lights) {
      const flicker = 0.85 + Math.sin(this.time * 7 + l.phase) * 0.06 + Math.sin(this.time * 13 + l.phase * 2) * 0.04;
      l.img.setAlpha(this.dark.fillAlpha * 1.5 * flicker);
      l.pool.setFillStyle(0xffc070, this.dark.fillAlpha * POOL_ALPHA * flicker);
    }
    for (const f of this.flies) {
      if (f.gone) continue;
      const t = this.time * f.speed + f.phase;
      f.x = f.x0 + Math.sin(t) * FLY_ROAM + Math.sin(t * 2.3) * 6;
      f.y = f.y0 + Math.cos(t * 0.8) * FLY_ROAM * 0.5;
      const y = f.y - f.h - Math.sin(t * 3) * 3;
      const blink = 0.45 + Math.max(0, Math.sin(t * 2.7)) * 0.55;
      f.halo.setPosition(f.x, y).setAlpha(blink * 0.8);
      f.core.setPosition(f.x, y).setAlpha(0.6 + blink * 0.4);
    }
    // rote Pandas in den Kirschbäumen (gefangene werden ersetzt)
    this.pandaIn -= dt;
    if (this.pandaIn <= 0) {
      this.pandaIn = 2;
      const wild = this.scene.animals.filter((a) => a.species === 'redpanda' && a.state === 'wild').length;
      // gerade einer gefangen: erst etwas später ein neuer (in einem anderen Baum, siehe RedPanda.placeInTree)
      if (wild < (this.lastWild ?? wild)) {
        this.lastWild = wild;
        this.pandaIn = REFILL_DELAY;
        return;
      }
      this.lastWild = RED_PANDAS;
      for (let i = wild; i < RED_PANDAS; i++) {
        const a = this.scene.createAnimal('redpanda', 0, 0);
        a.life = Infinity;
        if (!a.placeInTree()) this.scene.despawn(a);
      }
    }
  }

  // Event vorbei: es wird wieder hell, die roten Pandas sind fort
  destroy() {
    const scene = this.scene;
    for (const a of [...scene.animals]) if (a.species === 'redpanda' && a.state === 'wild') scene.despawn(a);
    const fade = [this.dark, ...this.lights.flatMap((l) => [l.img, l.pool]), ...this.flies.flatMap((f) => [f.halo, f.core])];
    scene.tweens.add({ targets: this.dark, fillAlpha: 0, duration: 1500 });
    scene.tweens.add({ targets: fade.filter((o) => o !== this.dark), alpha: 0, duration: 1500 });
    scene.time.delayedCall(1600, () => fade.forEach((o) => o.destroy()));
    this.flies = [];
    this.lights = [];
  }
}

// weicher, heller Lichtfleck (wird eingefärbt)
function glowTexture(scene) {
  const key = 'firefly_glow';
  if (scene.textures.exists(key)) return key;
  const size = 64;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}
export { glowTexture };
