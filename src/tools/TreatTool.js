// Fisch und Ball für die Robben (Eiswelt): werden im Bogen geworfen wie das Lasso (gleiche Reichweite, genau in
// Laufrichtung). Trifft der Wurf eine Robbe, die sich genau das wünscht, schnappt sie ihn und folgt Henrik (siehe
// Seal.js); trifft er eine, die sich das andere wünscht, schüttelt sie den Kopf. Daneben geworfen: es platscht ins
// Wasser bzw. fällt in den Schnee – nach WAIT Sekunden kann man noch einmal werfen.
import ZoneTool from './ZoneTool.js';
import { charAt } from '../world/map.js';
import { worldToTile } from '../world/iso.js';

const FLY = 0.55; // so lange (Sekunden) fliegt er
const WAIT = 2; // so lange dauert ein Wurf samt Pause, bis man wieder werfen kann
const ARC = 26; // so hoch fliegt er im Bogen
const ITEMS = { herring: { key: 'herring', scale: 0.32 }, sealball: { key: 'ball', scale: 0.5 } };
const AIM_ANGLE = (35 * Math.PI) / 180; // Auto-Aim: so weit darf man auf dem Bildschirm danebenliegen ...
const AIM_NEAR = 0.35; // ... und die Robbe so viel näher ...
const AIM_FAR = 1.5; // ... bzw. weiter weg sein als die normale Wurfweite

export default class TreatTool extends ZoneTool {
  constructor(scene, player, id) {
    // getroffen ist, was im Augenblick der Landung (FLY) nah genug an der Landestelle ist
    super(scene, player, { id, reach: 70, radius: 26, duration: WAIT, catchFrom: FLY / WAIT - 0.02, catchTo: FLY / WAIT + 0.06, maxCatch: 1, aim: true });
    this.item = ITEMS[id];
    this.sprite = scene.add.image(0, 0, this.item.key).setScale(this.item.scale);
    this.landed = false;
  }

  // Auto-Aim: wirft man ungefähr in Richtung einer aufgetauchten Robbe (höchstens AIM_ANGLE daneben, nicht zu nah und
  // nicht zu weit), landet der Wurf genau bei ihr; sonst wie das Lasso geradeaus in Laufrichtung
  zoneAhead() {
    const ahead = super.zoneAhead();
    const p = this.player;
    // Richtung auf dem Bildschirm (so sieht man sie; mit WASD liegt man höchstens 22,5 Grad daneben), Abstand in
    // Kachel-Proportionen (wie die Wurfweite)
    const ax = ahead.x - p.x;
    const ay = ahead.y - p.y;
    const along = Math.hypot(ax, ay * 2);
    let best = null;
    for (const a of this.scene.animals) {
      if (a.species !== 'seal' || a.state !== 'wild' || a.mode !== 'peek') continue;
      const dx = a.x - p.x;
      const dy = a.y - p.y;
      const d = Math.hypot(dx, dy * 2);
      if (d < along * AIM_NEAR || d > along * AIM_FAR) continue;
      const angle = Math.acos(Math.max(-1, Math.min(1, (dx * ax + dy * ay) / (Math.hypot(dx, dy) * Math.hypot(ax, ay)))));
      if (angle <= AIM_ANGLE && (!best || angle < best.angle)) best = { a, angle };
    }
    return best ? { x: best.a.x, y: best.a.y } : ahead;
  }

  // getroffen: nur nah an der Landestelle (nicht unterwegs wie beim Lasso), in Kachel-Proportionen
  zoneDistance(a) {
    return Math.hypot(a.x - this.zone.x, (a.y - this.zone.y) * 2);
  }

  use() {
    if (!super.use()) return false;
    this.landed = false;
    return true;
  }

  update(dt) {
    super.update(dt);
    // gelandet und nichts gefangen: eine Robbe in der Nähe reagiert (Kopfschütteln), sonst platscht es bzw. fällt es hin
    if (this.active && !this.landed && this.progress > this.catchTo) {
      this.landed = true;
      if (!this.caughtCount) this.miss();
    }
  }

  miss() {
    const z = this.zone;
    const seal = this.scene.animals.find((a) => a.species === 'seal' && a.state === 'wild' && this.zoneDistance(a) < this.radius * 1.5);
    seal?.refuse?.(this.id);
    const { tx, ty } = worldToTile(z.x, z.y);
    if (charAt(tx, ty) === '~') {
      const ring = this.scene.add.ellipse(z.x, z.y, 12, 5).setStrokeStyle(1.5, 0xffffff, 0.9).setDepth(z.y);
      this.scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
      if (this.scene.cache.audio.exists('animal_fish')) this.scene.sound.play('animal_fish', { volume: 0.25, detune: 300 });
    }
  }

  draw() {
    const p = this.player;
    const t = this.active ? this.time : Infinity;
    if (t < FLY) {
      // im Bogen von der Hand zur Landestelle
      const h = this.hand();
      const k = t / FLY;
      const x = h.x + (this.zone.x - h.x) * k;
      const y = h.y + (this.zone.y - h.y) * k - Math.sin(Math.PI * k) * ARC;
      this.sprite.setVisible(true).setPosition(x, y).setAngle(k * 360 * (this.id === 'herring' ? 1 : 2)).setDepth(Math.max(p.y, this.zone.y) + 1);
      return;
    }
    if (this.active) {
      // danach ist er weg (gefangen oder ins Wasser gefallen); bis zum nächsten Wurf liegt keiner in der Hand
      this.sprite.setVisible(false);
      return;
    }
    this.sprite.setVisible(true).setAngle(0);
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  destroy() {
    this.sprite.destroy();
  }
}
