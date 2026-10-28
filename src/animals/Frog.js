// Frosch: hüpft in regelmäßigen Abständen auf einem kleinen Kreis um seinen Platz herum.
// Ist der nächste Punkt auf dem Kreis versperrt (Wasser, Baum …), dreht er um.
import Phaser from 'phaser';
import Animal from './Animal.js';

const HOP_EVERY = 1.2; // Sekunden zwischen zwei Sprüngen
const HOP_TIME = 0.35; // Dauer eines Sprungs
const HOP_HEIGHT = 8; // so hoch springt er
const CIRCLE_R = 22; // Radius des Kreises
const STEPS = 8; // Sprünge für eine ganze Runde
// Sprung-Bilder je Aussehen (grün bzw. Skin), von vorne und hinten (siehe tools/prepare-characters.js): sitzen, ducken,
// Flug, landen (Bilder von, bis). Im Flug ist der Frosch im Bild selbst angehoben, er wird dann nicht zusätzlich
// hochgesetzt. Dazwischen sitzt er: mit Sitz-Animation (kind.anims, wie bei den anderen Tieren), sonst auf dem Sitzbild
const HOP_SHEETS = {
  frog: {
    down: { key: 'frog_hop', sit: 0, crouch: [3, 9], air: [10, 14], land: [15, 18] },
    up: { key: 'frog_hop_back', sit: 0, crouch: [3, 8], air: [9, 14], land: [15, 17] },
  },
  frog2: { // Sitzbild vorne: Bild 3 (in 0 und 1 blinzelt er)
    down: { key: 'frog2_hop', sit: 3, crouch: [5, 8], air: [9, 14], land: [15, 17] },
    up: { key: 'frog2_hop_back', sit: 0, crouch: [10, 16], air: [17, 23], land: [24, 28] },
  },
};
const CROUCH_TIME = 0.3; // so lange duckt er sich vor dem Absprung
const LAND_TIME = 0.25; // so lange dauert das Landen

export default class Frog extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'frog');
    this.center = { x, y };
    this.step = Phaser.Math.Between(0, STEPS - 1);
    this.turn = Math.random() < 0.5 ? 1 : -1; // Richtung im oder gegen den Uhrzeigersinn
    this.hopTimer = Phaser.Math.FloatBetween(0, HOP_EVERY); // nicht alle gleichzeitig
    this.hopT = -1; // < 0: gerade kein Sprung
    this.jump = 0;
    this.sinceLand = Infinity; // Zeit seit der letzten Landung
    Object.assign(this, this.circlePoint(this.step));
  }

  // Punkt auf dem Kreis (flach gedrückt wie die Kacheln)
  circlePoint(step) {
    const a = (step / STEPS) * Math.PI * 2;
    return { x: this.center.x + Math.cos(a) * CIRCLE_R, y: this.center.y + (Math.sin(a) * CIRCLE_R) / 2 };
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return super.updateFree(dt, player); // im Gehege hüpft er frei herum

    this.sinceLand += dt;
    // laufender Sprung
    if (this.hopT >= 0) {
      this.hopT += dt;
      const t = Math.min(1, this.hopT / HOP_TIME);
      this.x = this.from.x + (this.to.x - this.from.x) * t;
      this.y = this.from.y + (this.to.y - this.from.y) * t;
      this.jump = Math.sin(Math.PI * t) * HOP_HEIGHT;
      if (t >= 1) {
        this.hopT = -1;
        this.sinceLand = 0;
      }
      return false;
    }

    this.hopTimer -= dt;
    if (this.hopTimer > 0) return false;
    this.hopTimer = HOP_EVERY;

    // nächster Punkt auf dem Kreis; versperrt: umdrehen; auch dort versperrt: sitzen bleiben
    let next = this.step + this.turn;
    let target = this.circlePoint(next);
    if (this.blocked(target.x, target.y)) {
      this.turn = -this.turn;
      next = this.step + this.turn;
      target = this.circlePoint(next);
      if (this.blocked(target.x, target.y)) return false;
    }
    this.step = (next + STEPS) % STEPS;
    this.from = { x: this.x, y: this.y };
    this.to = target;
    this.hopT = 0;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    if (Math.abs(dx) > 0.5) this.faceX = Math.sign(dx);
    if (Math.abs(dy) > 0.5) this.faceY = Math.sign(dy);
    return false;
  }

  // Sprung-Sheet für Aussehen und Blickrichtung, oder null
  hopSheet() {
    const set = HOP_SHEETS[this.skin ?? 'frog'];
    const s = set && (this.faceY > 0 ? set.down : set.up);
    return s && this.scene.textures.exists(s.key) ? s : null;
  }

  // Bild aus dem Sprung-Sheet: in der Wildnis passend zum Stand des Sprungs, im Sitzen ohne Sitz-Animation das Sitzbild;
  // sonst null (dann wie die anderen Tiere: Sitz-Animation, im Gehege und beim Folgen die Sprung-Animation beim Laufen)
  hopFrame(moving) {
    const s = this.hopSheet();
    if (!s) return null;
    const span = ([a, b], t) => a + Math.min(b - a, Math.floor(Math.max(0, t) * (b - a + 1)));
    if (this.state === 'wild') {
      if (this.hopT >= 0) return span(s.air, this.hopT / HOP_TIME);
      if (this.sinceLand < LAND_TIME) return span(s.land, this.sinceLand / LAND_TIME);
      if (this.hopTimer < CROUCH_TIME) return span(s.crouch, 1 - this.hopTimer / CROUCH_TIME);
    }
    if (!moving && !this.animSet()?.idleDown) return s.sit;
    return null;
  }

  render(moving) {
    const frame = this.hopFrame(moving);
    if (frame !== null) {
      const key = this.hopSheet().key;
      this.sprite.stop();
      if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
      this.sprite.setFrame(frame).setFlipX(this.faceX < 0);
      this.placeSprite(false);
      // Schatten bleibt am Boden und wird beim Sprung kleiner
      if (this.state === 'wild') this.shadow.setScale((this.baby ? 0.6 : 1) * (1 - this.jump / 20));
      return;
    }
    super.render(moving);
    if (this.state !== 'wild') return;
    // Sprung ohne Sprung-Bilder: Frosch hebt ab, Schatten bleibt am Boden und wird kleiner
    this.sprite.y -= this.jump;
    this.shadow.setScale((this.baby ? 0.6 : 1) * (1 - this.jump / 20));
  }
}
