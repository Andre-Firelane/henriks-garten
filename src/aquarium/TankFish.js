// Zierfische im Aquarium: kleine Fische in Seitenansicht (Bild "minifish"), die im hohen Wassertank in allen Höhen
// hin und her schweben und ab und zu Bläschen aufsteigen lassen. Schwarmfische (Neonsalmler, Guppys, Clownfische)
// ziehen in kleinen Gruppen gemeinsam umher. Reine Deko – keine Tierart, nicht fangbar, wird nicht gespeichert.
import Phaser from 'phaser';
import { tileToWorld } from '../world/iso.js';

// Arten im Bild "minifish" (je zwei Bilder: nach rechts, nach links) und wie viele zusammen schwimmen
const KINDS = [
  { frame: 0, group: [4, 7] }, // Neonsalmler
  { frame: 1, group: [2, 3] }, // Clownfisch
  { frame: 2, group: [1, 2] }, // Paletten-Doktorfisch
  { frame: 3, group: [1, 2] }, // Gelber Doktorfisch
  { frame: 4, group: [1, 2] }, // Skalar
  { frame: 5, group: [3, 5] }, // Guppy
];
const SPEED = [8, 16]; // Pixel pro Sekunde
export const SWIM_HEIGHT = [12, 104]; // so hoch über dem Boden schweben sie (das Wasser reicht bis knapp unter den Rand)
const BUBBLE_EVERY = [4, 12];
const SPREAD = 0.45; // so weit (Kacheln) verteilen sich Schwarmfische um den gemeinsamen Punkt
const SPREAD_UP = 10; // ... und so weit in der Höhe

// ein Schwarm (oder ein einzelner Fisch) mit gemeinsamem Ziel
class School {
  constructor(tank) {
    this.tank = tank;
    this.pos = this.randomSpot();
    this.h = Phaser.Math.FloatBetween(...SWIM_HEIGHT);
    this.speed = Phaser.Math.FloatBetween(...SPEED);
    this.pickTarget();
  }

  randomSpot() {
    const t = this.tank;
    return { tx: Phaser.Math.FloatBetween(t.tx0 + 0.9, t.tx1 - 0.9), ty: Phaser.Math.FloatBetween(t.ty0 + 0.9, t.ty1 - 0.9) };
  }

  pickTarget() {
    this.target = this.randomSpot();
    this.targetH = Phaser.Math.FloatBetween(...SWIM_HEIGHT);
  }

  update(dt) {
    const a = tileToWorld(this.pos.tx, this.pos.ty);
    const b = tileToWorld(this.target.tx, this.target.ty);
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d < 2) this.pickTarget();
    else {
      const k = Math.min(1, (this.speed * dt) / d);
      this.pos.tx += (this.target.tx - this.pos.tx) * k;
      this.pos.ty += (this.target.ty - this.pos.ty) * k;
      if (Math.abs(b.x - a.x) > 0.5) this.faceRight = b.x > a.x;
    }
    this.h += (this.targetH - this.h) * Math.min(1, dt * 0.5);
  }
}

class TankFish {
  constructor(scene, school, frame) {
    this.scene = scene;
    this.school = school;
    this.frame = frame;
    this.offset = { tx: Phaser.Math.FloatBetween(-SPREAD, SPREAD), ty: Phaser.Math.FloatBetween(-SPREAD, SPREAD), h: Phaser.Math.FloatBetween(-SPREAD_UP, SPREAD_UP) };
    this.sprite = scene.add.sprite(0, 0, 'minifish', frame * 2).setOrigin(0.5);
    this.phase = Math.random() * 10;
    this.lag = Phaser.Math.FloatBetween(0.6, 1.4); // jeder schwimmt ein wenig anders hinterher
    this.pos = { ...school.pos };
    this.bubbleIn = Phaser.Math.FloatBetween(...BUBBLE_EVERY);
  }

  update(dt) {
    this.phase += dt;
    const s = this.school;
    const t = this.school.tank;
    // dem Schwarm folgen, mit eigenem Abstand; im Tank bleiben
    const goal = {
      tx: Phaser.Math.Clamp(s.pos.tx + this.offset.tx, t.tx0 + 0.7, t.tx1 - 0.7),
      ty: Phaser.Math.Clamp(s.pos.ty + this.offset.ty, t.ty0 + 0.7, t.ty1 - 0.7),
    };
    const k = Math.min(1, dt * 1.5 * this.lag);
    const dx = goal.tx - this.pos.tx;
    const dy = goal.ty - this.pos.ty;
    this.pos.tx += dx * k;
    this.pos.ty += dy * k;
    const sx = (dx - dy) * 32; // Bewegung auf dem Bildschirm (links/rechts)
    if (Math.abs(sx) > 0.3) this.faceRight = sx > 0;
    else if (s.faceRight !== undefined) this.faceRight = s.faceRight;
    const h = Phaser.Math.Clamp(s.h + this.offset.h, SWIM_HEIGHT[0], SWIM_HEIGHT[1]);
    const p = tileToWorld(this.pos.tx, this.pos.ty);
    const bob = Math.sin(this.phase * 2.4) * 1.5;
    this.sprite.setFrame(this.frame * 2 + (this.faceRight ? 0 : 1));
    this.sprite.setPosition(p.x, p.y - h + bob);
    this.sprite.setDepth(p.y + 0.5); // zwischen Rückwand und vorderer Glasscheibe (siehe drawTanks)
    this.bubbleIn -= dt;
    if (this.bubbleIn <= 0) {
      this.bubbleIn = Phaser.Math.FloatBetween(...BUBBLE_EVERY);
      this.bubble(p);
    }
  }

  // Bläschen steigen bis zur Wasseroberfläche
  bubble(p) {
    const x = this.sprite.x + (this.faceRight ? 7 : -7);
    const y = this.sprite.y - 2;
    const b = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(1, 1.8), 0xd8f2ff, 0.8).setStrokeStyle(1, 0x2f7fbf).setDepth(p.y + 0.55);
    const top = p.y - SWIM_HEIGHT[1] - 8;
    this.scene.tweens.add({ targets: b, y: top, x: x + Phaser.Math.Between(-3, 3), duration: (y - top) * 30, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
  }
}

// alle Zierfische eines Tanks: ein paar Schwärme und Einzelgänger, bis etwa n Fische zusammenkommen
export function stockTank(scene, tank, n) {
  const schools = [];
  const fish = [];
  while (fish.length < n) {
    const kind = Phaser.Utils.Array.GetRandom(KINDS);
    const school = new School(tank);
    schools.push(school);
    const size = Math.min(n - fish.length, Phaser.Math.Between(...kind.group));
    for (let i = 0; i < size; i++) fish.push(new TankFish(scene, school, kind.frame));
  }
  return { update: (dt) => { for (const s of schools) s.update(dt); for (const f of fish) f.update(dt); }, count: fish.length };
}
