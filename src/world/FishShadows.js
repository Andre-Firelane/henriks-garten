// Fischschatten (docs/plan-angeln.md): In Wiese, Wald, Savanne, Dschungel und Eiswelt ziehen ein paar dunkle Fischschatten im
// Wasser am Ufer ihre Kreise. Man sieht nur, ob einer klein oder groß ist, nicht welche Art (alle Schatten haben dieselbe
// Form). Kleine Fische kommen oft als kleiner Schwarm (wie die Piranhas): mehrere Schatten kreisen um dieselbe Stelle, jeder
// Biss holt einen heraus, der Rest bleibt, bis der Schwarm leer ist. Große Fische sind allein. Nach einer Weile tauchen sie
// ab und anderswo wieder auf. Mit der Angel (RodTool) wirft man nach ihnen aus.
// Ein Eintrag in list ist eine Stelle (Einzelfisch oder Schwarm): x, y ist die Mitte, members die einzelnen Schatten.
import Phaser from 'phaser';
import { LEVEL, MAP_W, MAP_H, charAt, inPen, isBlocked } from './map.js';
import { tileToWorld } from './iso.js';
import { BIG_CHANCE, BIG_SCALE, canFishHere } from './fishing.js';

const COUNT = 5; // so viele Stellen gleichzeitig (Expedition: EXP_COUNT)
const EXP_COUNT = 3;
const ICE_COUNT = 2; // Eis-Expedition bei Nacht: Wasser gibt es nur in den kleinen Eislöchern – höchstens so viele Stellen, je Loch
// höchstens eine und ohne Schwärme (sonst wimmelte es in den paar Löchern von Fischen)
const SCHOOL_CHANCE = 0.5; // so oft sind kleine Fische ein Schwarm ...
const SCHOOL_SIZE = [2, 4]; // ... aus so vielen
const LIFE = [25, 50]; // so lange bleibt eine Stelle, dann tauchen sie ab
const AWAY = [3, 8]; // so lange dauert es, bis eine neue auftaucht
const FADE = 800; // ms
const SCALE = 0.13; // Bild 192 × 128
const ALPHA = 0.5;
const TINT = 0x0f2630;
const SILHOUETTE = 0; // Form des Schattens: immer dasselbe Bild (der Karpfen), damit es nichts verrät
const CIRCLE = [5, 11]; // so weit kreist ein einzelner um seine Stelle (Pixel)
const SCHOOL_CIRCLE = [6, 16]; // ... und die eines Schwarms um dessen Mitte
const TURN = [0.35, 0.7]; // Bogenmaß pro Sekunde
const SCHOOL_TURN = [0.9, 1.6]; // ein Schwarm wirbelt schneller
const WOBBLE = 3; // der Radius im Schwarm schwankt um so viel
const GAP = 4; // Kacheln Abstand zwischen zwei Stellen

export default class FishShadows {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.spots = canFishHere() ? this.findSpots() : [];
    if (!this.spots.length) return;
    const n = Math.min(LEVEL.expedition ? EXP_COUNT : COUNT, LEVEL.expedition && LEVEL.iceHoles ? ICE_COUNT : Infinity);
    for (let i = 0; i < n; i++) this.spawn(true);
  }

  // Wasser direkt am begehbaren Ufer (nicht in Gehegen); in der Savanne in der Trockenzeit bleibt nur das letzte Wasserloch
  findSpots() {
    const out = [];
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        if (charAt(tx, ty) !== '~' || inPen(tx, ty)) continue;
        const shore = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => !isBlocked(tx + dx, ty + dy) && !inPen(tx + dx, ty + dy));
        if (shore) out.push({ tx, ty, shore: tileToWorld(tx + shore[0], ty + shore[1]) }); // shore: Uferkachel daneben (zum Testen)
      }
    }
    return out;
  }

  member(x, y, scale, school) {
    const sprite = this.scene.add.image(x, y, 'freshfish', SILHOUETTE * 2).setTintFill(TINT).setAlpha(0).setScale(scale);
    this.scene.tweens.add({ targets: sprite, alpha: ALPHA, duration: FADE });
    const circle = school ? SCHOOL_CIRCLE : CIRCLE;
    const turn = school ? SCHOOL_TURN : TURN;
    return { sprite, angle: Math.random() * Math.PI * 2, r: Phaser.Math.FloatBetween(...circle), turn: Phaser.Math.FloatBetween(...turn), phase: Math.random() * 10 };
  }

  spawn(now = false) {
    const free = this.spots.filter((s) => this.list.every((f) => Math.hypot(f.tx - s.tx, f.ty - s.ty) >= GAP && (this.holeOf(s) < 0 || this.holeOf(f) !== this.holeOf(s))));
    // kein freier Platz: in den Eislöchern nicht noch einen dazu (später nochmal versuchen), sonst wie bisher irgendwo
    if (!free.length && LEVEL.iceHoles) {
      this.scene.time.delayedCall(Phaser.Math.FloatBetween(...AWAY) * 1000, () => {
        if (this.scene.fishShadows === this && !this.destroyed) this.spawn();
      });
      return null;
    }
    const spot = Phaser.Utils.Array.GetRandom(free.length ? free : this.spots);
    const c = tileToWorld(spot.tx, spot.ty);
    const big = Math.random() < BIG_CHANCE;
    const n = !big && this.holeOf(spot) < 0 && Math.random() < SCHOOL_CHANCE ? Phaser.Math.Between(...SCHOOL_SIZE) : 1;
    const dir = Math.random() < 0.5 ? -1 : 1; // ein Schwarm kreist gemeinsam in eine Richtung
    const members = [];
    for (let i = 0; i < n; i++) {
      const m = this.member(c.x, c.y, SCALE * (big ? BIG_SCALE : 1), n > 1);
      m.turn *= n > 1 ? dir : Math.random() < 0.5 ? -1 : 1;
      members.push(m);
    }
    const f = { tx: spot.tx, ty: spot.ty, spot, x: c.x, y: c.y, big, members, life: Phaser.Math.FloatBetween(...LIFE) * (now ? Math.random() + 0.3 : 1), hooked: false, gone: false };
    this.list.push(f);
    return f;
  }

  // Eisloch (Index in LEVEL.iceHoles), in dem diese Kachel liegt; sonst -1 (anderes Wasser)
  holeOf(t) {
    return (LEVEL.iceHoles ?? []).findIndex(([hx, hy]) => t.tx >= hx && t.tx <= hx + 1 && t.ty >= hy && t.ty <= hy + 1);
  }

  // nächste Stelle, die man von hier aus erreicht (Abstand mit doppeltem y wie überall)
  nearest(x, y, reach) {
    let best = null;
    for (const f of this.list) {
      if (f.gone) continue;
      const d = Math.hypot(f.x - x, (f.y - y) * 2);
      if (d < reach && (!best || d < best.d)) best = { f, d };
    }
    return best?.f ?? null;
  }

  // ein Fisch ist gefangen: im Schwarm verschwindet einer, sonst die ganze Stelle
  take(f) {
    if (f.members.length > 1) {
      const m = f.members.pop();
      this.scene.tweens.add({ targets: m.sprite, alpha: 0, duration: 150, onComplete: () => m.sprite.destroy() });
      f.hooked = false;
      return;
    }
    this.remove(f, true);
  }

  // abtauchen (Zeit um oder leer gefangen); eine neue Stelle kommt später woanders
  remove(f, caught = false) {
    if (f.gone) return;
    f.gone = true;
    this.list.splice(this.list.indexOf(f), 1);
    for (const m of f.members) this.scene.tweens.add({ targets: m.sprite, alpha: 0, duration: caught ? 150 : FADE, onComplete: () => m.sprite.destroy() });
    this.scene.time.delayedCall(Phaser.Math.FloatBetween(...AWAY) * 1000, () => {
      if (this.scene.fishShadows === this && !this.destroyed) this.spawn();
    });
  }

  update(dt) {
    for (const f of [...this.list]) {
      if (!f.hooked) {
        f.life -= dt;
        if (f.life <= 0) {
          this.remove(f);
          continue;
        }
      }
      const c = tileToWorld(f.tx, f.ty);
      for (const m of f.members) {
        if (!f.hooked) m.angle += m.turn * dt;
        m.phase += dt;
        const r = m.r + (f.members.length > 1 ? Math.sin(m.phase * 1.7) * WOBBLE : 0);
        const x = c.x + Math.cos(m.angle) * r;
        const y = c.y + (Math.sin(m.angle) * r) / 2;
        const vx = -Math.sin(m.angle) * m.turn; // Schwimmrichtung (Ableitung der Kreisbahn)
        m.sprite.setPosition(x, y).setFlipX(vx < 0).setDepth(y - 2);
      }
      // die Pose zielt auf den ersten Schatten (beim Einzelfisch genau auf ihn, im Schwarm in die Mitte des Wirbels)
      const lead = f.members[0];
      f.x = f.members.length > 1 ? c.x : lead.sprite.x;
      f.y = f.members.length > 1 ? c.y : lead.sprite.y;
    }
  }

  destroy() {
    this.destroyed = true;
    for (const f of this.list) for (const m of f.members) m.sprite.destroy();
    this.list = [];
  }
}
