// Frosch: hüpft in regelmäßigen Abständen auf einem kleinen Kreis um seinen Platz herum.
// Ist der nächste Punkt auf dem Kreis versperrt (Wasser, Baum …), dreht er um.
import Phaser from 'phaser';
import Animal from './Animal.js';

const HOP_EVERY = 1.2; // Sekunden zwischen zwei Sprüngen
const HOP_TIME = 0.35; // Dauer eines Sprungs
const HOP_HEIGHT = 8; // so hoch springt er
const CIRCLE_R = 22; // Radius des Kreises
const STEPS = 8; // Sprünge für eine ganze Runde

export default class Frog extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'frog');
    this.center = { x, y };
    this.step = Phaser.Math.Between(0, STEPS - 1);
    this.turn = Math.random() < 0.5 ? 1 : -1; // Richtung im oder gegen den Uhrzeigersinn
    this.hopTimer = Phaser.Math.FloatBetween(0, HOP_EVERY); // nicht alle gleichzeitig
    this.hopT = -1; // < 0: gerade kein Sprung
    this.jump = 0;
    Object.assign(this, this.circlePoint(this.step));
  }

  // Punkt auf dem Kreis (flach gedrückt wie die Kacheln)
  circlePoint(step) {
    const a = (step / STEPS) * Math.PI * 2;
    return { x: this.center.x + Math.cos(a) * CIRCLE_R, y: this.center.y + (Math.sin(a) * CIRCLE_R) / 2 };
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return super.updateFree(dt, player); // im Gehege hüpft er frei herum

    // laufender Sprung
    if (this.hopT >= 0) {
      this.hopT += dt;
      const t = Math.min(1, this.hopT / HOP_TIME);
      this.x = this.from.x + (this.to.x - this.from.x) * t;
      this.y = this.from.y + (this.to.y - this.from.y) * t;
      this.jump = Math.sin(Math.PI * t) * HOP_HEIGHT;
      if (t >= 1) this.hopT = -1;
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

  render(moving) {
    super.render(moving);
    if (this.state !== 'wild') return;
    // Sprung: Frosch hebt ab, Schatten bleibt am Boden und wird kleiner
    this.sprite.setPosition(this.x, this.y - this.jump);
    this.shadow.setScale((this.baby ? 0.6 : 1) * (1 - this.jump / 20));
  }
}
