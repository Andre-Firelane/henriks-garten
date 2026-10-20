// Zierfisch im Aquarium: schwimmt im Wassertank herum, in wechselnder Höhe, und lässt ab und zu Bläschen aufsteigen.
// Reine Deko – keine Tierart, nicht fangbar, wird nicht gespeichert oder gezählt (siehe drawTanks in GardenScene).
import Phaser from 'phaser';
import { tileToWorld } from '../world/iso.js';

// Bild und Bilder für "nach rechts" / "nach links" (vorhandene Spritesheets)
const LOOKS = [
  ['fish', 1, 2],
  ['fish2', 1, 2], // Wels
  ['koi1', 0, 1],
  ['koi2', 0, 1],
  ['koi3', 0, 1],
];
const SPEED = [10, 22]; // Pixel pro Sekunde
const SCALE = [0.22, 0.35];
const HEIGHT = [6, 30]; // so hoch über dem Boden schwimmt er (Wasser reicht bis zur Wandhöhe)
const BUBBLE_EVERY = [3, 9];

export default class TankFish {
  // tank: Gebäude im Stil "tank" (tx0..tx1, ty0..ty1 sind die Wände; geschwommen wird innen)
  constructor(scene, tank) {
    this.scene = scene;
    this.tank = tank;
    const [key, right, left] = Phaser.Utils.Array.GetRandom(LOOKS);
    this.frames = { right, left };
    this.sprite = scene.add.sprite(0, 0, key, right).setOrigin(0.5, 0.6).setScale(Phaser.Math.FloatBetween(...SCALE));
    this.pos = this.randomSpot();
    this.h = Phaser.Math.FloatBetween(...HEIGHT);
    this.speed = Phaser.Math.FloatBetween(...SPEED);
    this.pickTarget();
    this.bubbleIn = Phaser.Math.FloatBetween(...BUBBLE_EVERY);
    this.phase = Math.random() * 10;
    this.render();
  }

  // zufällige Stelle im Tankinneren (Kachel-Koordinaten, mit etwas Abstand zum Glas)
  randomSpot() {
    const t = this.tank;
    return { tx: Phaser.Math.FloatBetween(t.tx0 + 0.75, t.tx1 - 0.75), ty: Phaser.Math.FloatBetween(t.ty0 + 0.75, t.ty1 - 0.75) };
  }

  pickTarget() {
    this.target = this.randomSpot();
    this.targetH = Phaser.Math.FloatBetween(...HEIGHT);
  }

  update(dt) {
    this.phase += dt;
    const a = tileToWorld(this.pos.tx, this.pos.ty);
    const b = tileToWorld(this.target.tx, this.target.ty);
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d < 2) {
      this.pickTarget();
    } else {
      const k = Math.min(1, (this.speed * dt) / d);
      this.pos.tx += (this.target.tx - this.pos.tx) * k;
      this.pos.ty += (this.target.ty - this.pos.ty) * k;
      if (Math.abs(b.x - a.x) > 0.5) this.faceRight = b.x > a.x;
    }
    this.h += (this.targetH - this.h) * Math.min(1, dt * 0.6);
    this.bubbleIn -= dt;
    if (this.bubbleIn <= 0) {
      this.bubbleIn = Phaser.Math.FloatBetween(...BUBBLE_EVERY);
      this.bubble();
    }
    this.render();
  }

  render() {
    const p = tileToWorld(this.pos.tx, this.pos.ty);
    const bob = Math.sin(this.phase * 2.2) * 1.2;
    this.sprite.setFrame(this.faceRight ? this.frames.right : this.frames.left);
    this.sprite.setPosition(p.x, p.y - this.h + bob);
    this.sprite.setDepth(p.y + 0.5); // unter der Wasseroberfläche dieser Kachel (siehe drawTanks)
  }

  // Bläschen steigen bis zur Wasseroberfläche und zerplatzen
  bubble() {
    const p = tileToWorld(this.pos.tx, this.pos.ty);
    const x = this.sprite.x + (this.faceRight ? 6 : -6);
    const y = this.sprite.y - 3;
    const b = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(1.2, 2.2), 0xd8f2ff, 0.85).setStrokeStyle(1, 0x2f7fbf).setDepth(p.y + 0.55);
    this.scene.tweens.add({ targets: b, y: p.y - 38, x: x + Phaser.Math.Between(-3, 3), duration: 900 + this.h * 25, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
  }
}
