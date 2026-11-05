// Leben auf der Wiese (Angaben in levels.js): Seerosen auf den Seen, Enten, die herumschwimmen und auffliegen, wenn
// Henrik zu nah kommt, Bienen um die Bienenkörbe, die Flügel der Windmühle und Pusteblumen,
// die beim Durchlaufen ihre Samen verlieren (und später nachwachsen). Alles nur Deko: nichts davon fängt man oder zählt.
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';
import { LEVEL, MAP_W, MAP_H, charAt } from './map.js';

const FLOOR = -99990; // flach auf dem Wasser (wie der Steg)
const SAILS_UP = 118; // Nabe der Windmühlenflügel über dem Fuß der Mühle
const SAILS_SPEED = 22; // Grad pro Sekunde
const BEES = 3; // je Bienenkorb
const DUCK_SPEED = 9; // Pixel pro Sekunde beim Schwimmen
const DUCK_FLY_SPEED = 95;
const DUCK_SHY = 55; // so nah (Kachel-Proportionen) darf Henrik kommen, dann fliegt die Ente auf
const DUCK_WAIT = [1.5, 5]; // so lange treibt sie, bevor sie weiterschwimmt
const REGROW_MS = 30000; // so lange, bis eine Pusteblume wieder Samen hat
const SEEDS = 10;

export default class MeadowLife {
  constructor(scene, sway) {
    this.scene = scene;
    this.time = 0;
    for (const [tx, ty] of LEVEL.lilies ?? []) {
      const p = tileToWorld(tx, ty);
      scene.add.image(p.x + Phaser.Math.Between(-6, 6), p.y + Phaser.Math.Between(-3, 3), 'lily_pads').setFlipX(Math.random() < 0.5).setDepth(FLOOR);
    }
    this.sails = [];
    this.bees = [];
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const c = charAt(tx, ty);
        if (c !== 'Ẁ' && c !== 'ƅ') continue;
        const p = tileToWorld(tx, ty);
        if (c === 'Ẁ') this.sails.push(scene.add.image(p.x, p.y - SAILS_UP, 'windmill_sails').setDepth(p.y + 1).setAngle(Math.random() * 90));
        else for (let i = 0; i < BEES; i++) this.bees.push(this.newBee(p));
      }
    }
    this.ducks = (LEVEL.ducks ?? []).flatMap((pond) => {
      pond.tiles = waterNear(pond.tx, pond.ty, pond.r);
      return Array.from({ length: pond.n }, () => this.newDuck(pond));
    });
    if (sway) sway.onTouch = (plant) => plant.obj.dandelion && this.blow(plant);
  }

  newBee(hive) {
    const img = this.scene.add.image(hive.x, hive.y, 'bee');
    return { hive, img, rx: Phaser.Math.Between(18, 42), ry: Phaser.Math.Between(8, 18), a: Phaser.Math.FloatBetween(0.6, 1.3), b: Phaser.Math.FloatBetween(1.1, 2.1), phase: Math.random() * 10 };
  }

  newDuck(pond) {
    const t = Phaser.Utils.Array.GetRandom(pond.tiles);
    const p = tileToWorld(t.tx, t.ty);
    const img = this.scene.add.image(p.x, p.y, 'duck').setOrigin(0.5, 16 / 20);
    return { pond, img, x: p.x, y: p.y, state: 'swim', wait: Phaser.Math.FloatBetween(...DUCK_WAIT), target: null, phase: Math.random() * 10 };
  }

  update(dt) {
    this.time += dt;
    for (const s of this.sails) s.angle += SAILS_SPEED * dt;
    for (const b of this.bees) {
      const t = this.time + b.phase;
      const x = b.hive.x + Math.cos(t * b.a) * b.rx + Math.sin(t * b.b * 1.7) * 6;
      const y = b.hive.y + Math.sin(t * b.b) * b.ry;
      const h = 14 + Math.sin(t * 3.1) * 5;
      b.img.setFlipX(-Math.sin(t * b.a) * b.a > 0).setPosition(x, y - h).setDepth(y + 1);
    }
    for (const d of this.ducks) this.updateDuck(d, dt);
  }

  updateDuck(d, dt) {
    const p = this.scene.player;
    if (d.state === 'swim') {
      if (Math.hypot(p.x - d.x, (p.y - d.y) * 2) < DUCK_SHY) return this.takeOff(d);
      if (!d.target) {
        d.wait -= dt;
        if (d.wait <= 0) {
          const t = Phaser.Utils.Array.GetRandom(d.pond.tiles);
          d.target = tileToWorld(t.tx + Phaser.Math.FloatBetween(-0.3, 0.3), t.ty + Phaser.Math.FloatBetween(-0.3, 0.3));
        }
      } else {
        const dx = d.target.x - d.x, dy = d.target.y - d.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) {
          d.target = null;
          d.wait = Phaser.Math.FloatBetween(...DUCK_WAIT);
        } else {
          const step = Math.min(dist, DUCK_SPEED * dt);
          d.x += (dx / dist) * step;
          d.y += (dy / dist) * step;
          if (Math.abs(dx) > 0.5) d.img.setFlipX(dx > 0); // das Bild schaut nach links
        }
      }
      const bob = Math.sin((this.time + d.phase) * 2.2) * 0.6;
      d.img.setPosition(d.x, d.y + bob).setDepth(d.y);
      return;
    }
    // im Flug: im Bogen zum Ziel, Flügel schlagen
    d.t += dt;
    const k = Math.min(1, d.t / d.dur);
    d.x = d.from.x + (d.to.x - d.from.x) * k;
    d.y = d.from.y + (d.to.y - d.from.y) * k;
    const h = Math.sin(Math.PI * k) * d.arc + 6 * (1 - k);
    d.img.setTexture(Math.floor(d.t / 0.12) % 2 ? 'duck_fly1' : 'duck_fly0').setPosition(d.x, d.y - h).setDepth(d.y + 200);
    if (k >= 1) {
      d.state = 'swim';
      d.wait = Phaser.Math.FloatBetween(...DUCK_WAIT);
      d.img.setTexture('duck').setOrigin(0.5, 16 / 20);
      this.ripple(d.x, d.y);
    }
  }

  // die Ente fliegt auf: zum anderen See, falls es einen gibt, sonst ans andere Ende ihres Sees
  takeOff(d) {
    const ponds = (LEVEL.ducks ?? []).filter((pond) => pond !== d.pond);
    const pond = ponds.length ? Phaser.Utils.Array.GetRandom(ponds) : d.pond;
    const p = this.scene.player;
    const far = [...pond.tiles].sort((a, b) => {
      const pa = tileToWorld(a.tx, a.ty), pb = tileToWorld(b.tx, b.ty);
      return Math.hypot(pb.x - p.x, pb.y - p.y) - Math.hypot(pa.x - p.x, pa.y - p.y);
    }).slice(0, 4);
    const t = Phaser.Utils.Array.GetRandom(far);
    const to = tileToWorld(t.tx, t.ty);
    const dist = Math.hypot(to.x - d.x, to.y - d.y);
    Object.assign(d, { state: 'fly', pond, from: { x: d.x, y: d.y }, to, t: 0, dur: Math.max(1.2, dist / DUCK_FLY_SPEED), arc: Math.min(70, 24 + dist * 0.15), target: null });
    d.img.setOrigin(0.5, 0.6).setFlipX(to.x > d.x);
    this.ripple(d.x, d.y);
  }

  // kleiner Wasserring, wo eine Ente auffliegt oder landet
  ripple(x, y) {
    const ring = this.scene.add.ellipse(x, y, 10, 4).setStrokeStyle(1, 0xe0f4ff, 0.8).setDepth(FLOOR + 1);
    this.scene.tweens.add({ targets: ring, scaleX: 3, scaleY: 3, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
  }

  // Pusteblume angestoßen: die Samen fliegen davon, nach einer Weile wächst sie nach
  blow(plant) {
    if (plant.blown) return;
    plant.blown = true;
    const { img } = plant;
    img.setTexture('dandelion_blown');
    for (let i = 0; i < SEEDS; i++) {
      const x = img.x + Phaser.Math.Between(-9, 9);
      const y = img.y - Phaser.Math.Between(12, 20);
      const seed = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(0.8, 1.4), 0xffffff, 0.95).setDepth(img.y + 40);
      this.scene.tweens.add({
        targets: seed,
        x: x + Phaser.Math.Between(25, 75) * (plant.dir ?? 1),
        y: y - Phaser.Math.Between(20, 55),
        alpha: 0,
        duration: Phaser.Math.Between(1600, 3000),
        ease: 'Sine.easeOut',
        onComplete: () => seed.destroy(),
      });
    }
    this.scene.time.delayedCall(REGROW_MS, () => {
      if (!img.active) return;
      img.setTexture('dandelion');
      plant.blown = false;
    });
  }
}

// Wasser eines Sees: alle Kacheln '~' höchstens r Kacheln von der Mitte
function waterNear(cx, cy, r) {
  const tiles = [];
  for (let ty = cy - r; ty <= cy + r; ty++) for (let tx = cx - r; tx <= cx + r; tx++) if (charAt(tx, ty) === '~' && Math.hypot(tx - cx, ty - cy) <= r) tiles.push({ tx, ty });
  return tiles;
}

