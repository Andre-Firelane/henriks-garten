// Das Lasso: wird weit nach vorne geworfen, die Schlinge zieht sich am Ziel zu.
// Die Fangzone liegt so weit weg, dass scheue Tiere (Rehe) noch nicht fliehen (nur Arten mit 'lasso' in catchWith).
import ZoneTool from './ZoneTool.js';

const FLY = 0.3; // Anteil des Wurfs, in dem die Schlinge fliegt
const HOLD = 0.65; // bis hierhin liegt sie am Ziel und zieht sich zu, danach wird sie eingeholt
const ROPE_DARK = 0x4a2e17;
const ROPE_LIGHT = 0xd9b072;

export default class Lasso extends ZoneTool {
  constructor(scene, player) {
    // reach 70 = etwa 100 in Kachel-Abstand, also weiter weg als die Fluchtdistanz der Rehe (70)
    // maxCatch 1: ein Wurf fängt nur ein Tier, auch wenn eine ganze Herde in der Schlinge steht
    // aim: fliegt genau in die Richtung, in die man gerade läuft (bzw. zuletzt gelaufen ist)
    super(scene, player, { id: 'lasso', reach: 70, radius: 34, duration: 0.75, catchFrom: FLY, catchTo: HOLD, maxCatch: 1, aim: true });
    this.coil = scene.add.image(0, 0, 'lasso').setScale(0.4);
    this.rope = scene.add.graphics();
  }

  draw() {
    const p = this.player;
    const h = this.hand();

    // Aufgerolltes Lasso an der Hüfte (auf der anderen Seite als die Hand), beim Werfen ist es draußen
    this.coil.setVisible(!this.active);
    this.coil.setPosition(p.x - p.faceX * 9, p.sprite.y - 14 - p.handLift);
    this.coil.setScale(0.4 * p.faceX, 0.4);
    this.coil.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));

    this.rope.clear();
    if (!this.active) return;

    // Wo ist die Schlinge gerade, und wie groß ist sie?
    const t = this.progress;
    const z = this.zone;
    let k; // 0 = an der Hand, 1 = am Ziel
    let r;
    if (t < FLY) {
      const f = t / FLY;
      k = 1 - (1 - f) * (1 - f);
      r = this.radius * (0.4 + 0.6 * f);
    } else if (t < HOLD) {
      const f = (t - FLY) / (HOLD - FLY);
      k = 1;
      r = this.radius * (1 - 0.45 * f); // zuziehen
    } else {
      const f = (t - HOLD) / (1 - HOLD);
      k = 1 - f * f;
      r = this.radius * 0.55 * (1 - 0.7 * f);
    }
    const cx = h.x + (z.x - h.x) * k;
    const cy = h.y + (z.y - h.y) * k;

    // Seil von der Hand zum nächsten Punkt der Schlinge
    const dx = h.x - cx;
    const dy = (h.y - cy) * 2;
    const d = Math.hypot(dx, dy) || 1;
    const ex = cx + (dx / d) * r;
    const ey = cy + ((dy / d) * r) / 2;

    for (const [width, color] of [[4, ROPE_DARK], [2, ROPE_LIGHT]]) {
      this.rope.lineStyle(width, color, 1);
      this.rope.lineBetween(h.x, h.y, ex, ey);
      this.rope.strokeEllipse(cx, cy, r * 2, r);
    }
    this.rope.setDepth(Math.max(p.y, cy) + 0.3);
  }

  destroy() {
    this.coil.destroy();
    this.rope.destroy();
  }
}
