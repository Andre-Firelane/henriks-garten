// Biberdamm im Wald (Angaben: LEVEL.beavers in levels.js). Der Damm liegt quer über dem Fluss und hat ein Loch, durch das
// Wasser schießt. Im Wald liegen große Stöcke (sticks): mit der Aktionstaste hebt Henrik einen auf (das getragene Werkzeug
// steckt er so lange ein) und steckt ihn am Damm ins Loch. Dann ist der Damm dicht, die Biber freuen sich und einer kommt
// mit (siehe GardenScene.fixDam). Nach einer Weile spült der Fluss wieder einen Ast heraus – das Loch ist wieder da.
// Außerdem hält der Damm die Biber-Kolonie vollzählig: sie sitzen an den angenagten Bäumen (ƀ), neue kommen aus der Burg (Ƅ).
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';
import { blockedAt } from './collision.js';
import { MAP_W, MAP_H, charAt } from './map.js';

const DAM_ORIGIN = [64 / 128, 52 / 88]; // Kachelmitte der mittleren Dammkachel im Bild
const HOLE_UP = 4; // das Loch liegt so hoch über der Kachelmitte
const DAM_DIST = 105; // so nah (Kachel-Proportionen, y doppelt) muss man am Loch stehen, um den Stock hineinzustecken
const STICK_DIST = 30; // so nah muss man an einem Stock stehen, um ihn aufzuheben
const STICK_ORIGIN = [28 / 56, 21 / 28];
const STICK_BACK = 20; // so lange (Sekunden), bis ein verbauter Stock wieder an seinem Platz liegt
const STICK_DROPPED = 3; // ... ein nicht verbauter (weggelegt, anderes Werkzeug genommen)
const REOPEN = [60, 120]; // so lange bleibt der Damm dicht
const SPRAY_EVERY = 0.07;
const CHECK_EVERY = 3; // so oft wird die Kolonie aufgefüllt
const SPOT_SIDES = [
  { dx: -17, dy: 7, face: 1 },
  { dx: 17, dy: 7, face: -1 },
  { dx: -17, dy: -5, face: 1 },
  { dx: 17, dy: -5, face: -1 },
];

export default class BeaverDam {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
    const c = tileToWorld(cfg.dam.tx, cfg.dam.ty);
    this.img = scene.add.image(c.x, c.y, 'forest_beaver_dam_hole').setOrigin(...DAM_ORIGIN).setDepth(c.y);
    this.hole = { x: c.x, y: c.y - HOLE_UP };
    this.open = true;
    this.reopen = 0;
    this.spray = 0;
    this.check = 0;
    this.carried = null;
    this.sticks = cfg.sticks.map(([tx, ty]) => {
      const p = tileToWorld(tx, ty);
      const img = scene.add.image(p.x, p.y, 'forest_stick').setOrigin(...STICK_ORIGIN).setDepth(p.y - 2);
      return { x: p.x, y: p.y, img, present: true, back: 0 };
    });
    // Nageplätze neben den angenagten Bäumen, Burg
    this.spots = [];
    this.lodge = null;
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const ch = charAt(tx, ty);
        if (ch === 'Ƅ') this.lodge = tileToWorld(tx, ty);
        if (ch !== 'ƀ') continue;
        const t = tileToWorld(tx, ty);
        // je Baum bis zu zwei Plätze (links und rechts), damit immer einer frei ist und die Biber ab und zu wechseln
        const sides = SPOT_SIDES.filter((s) => !blockedAt(t.x + s.dx, t.y + s.dy, 7, 3));
        for (const face of [1, -1]) {
          const side = sides.find((s) => s.face === face);
          if (side) this.spots.push({ x: t.x + side.dx, y: t.y + side.dy, face: side.face });
        }
      }
    }
  }

  wild() {
    return this.scene.animals.filter((a) => a.species === 'beaver' && a.state === 'wild');
  }

  // Kolonie auffüllen; first: beim Betreten sitzen sie schon an ihren Bäumen, später kommen neue aus der Burg
  fill(first = false) {
    const have = this.wild().length;
    for (let i = have; i < Math.min(this.cfg.count, this.spots.length); i++) {
      const spot = this.freeSpot(null, true);
      if (!spot) return;
      const from = first || !this.lodge ? spot : { x: this.lodge.x + 10, y: this.lodge.y + 6 };
      const b = this.scene.createAnimal('beaver', from.x, from.y);
      if (first) b.sitAt(spot);
      else {
        b.goTo(spot);
        b.sprite.setAlpha(0);
        this.scene.tweens.add({ targets: b.sprite, alpha: 1, duration: 600 });
      }
    }
  }

  // freier Nageplatz (nicht von einem anderen wilden Biber besetzt oder angesteuert)
  // fresh: für einen neuen Biber lieber einen Baum, an dem noch keiner nagt
  freeSpot(self, fresh = false) {
    const others = this.wild().filter((a) => a !== self);
    const used = others.map((a) => a.spot);
    let free = this.spots.filter((s) => !used.includes(s));
    const lonely = free.filter((s) => used.every((u) => !u || Math.hypot(u.x - s.x, u.y - s.y) > 50));
    if (fresh && lonely.length) free = lonely;
    return free.length ? Phaser.Utils.Array.GetRandom(free) : null;
  }

  // nächster Stock in Reichweite (oder null)
  stickNear(p) {
    return this.sticks.find((s) => s.present && Math.hypot(p.x - s.x, (p.y - s.y) * 2) < STICK_DIST) ?? null;
  }

  // steht man nah genug am Loch?
  nearHole(p) {
    return this.open && Math.hypot(p.x - this.hole.x, (p.y - this.hole.y) * 2) < DAM_DIST;
  }

  // nächster liegender Stock (für die Hinweisblase)
  closestStick(p, max) {
    let best = null;
    let bestD = max;
    for (const s of this.sticks) {
      if (!s.present) continue;
      const d = Math.hypot(p.x - s.x, (p.y - s.y) * 2);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  takeStick(stick) {
    stick.present = false;
    stick.img.setVisible(false);
    this.carried = stick;
  }

  // der Stock wurde nicht verbaut (anderes Werkzeug genommen): er liegt bald wieder an seinem Platz
  stickDropped() {
    if (!this.carried) return;
    this.carried.back = STICK_DROPPED;
    this.carried = null;
  }

  // Stock ins Loch: der Damm ist dicht
  plug() {
    if (this.carried) this.carried.back = STICK_BACK;
    this.carried = null;
    this.open = false;
    this.reopen = Phaser.Math.FloatBetween(...REOPEN);
    this.img.setTexture('forest_beaver_dam');
    this.scene.tweens.add({ targets: this.img, scaleY: { from: 0.94, to: 1 }, duration: 260, ease: 'Back.easeOut' });
  }

  // der Fluss spült einen Ast heraus: das Loch ist wieder da (der Ast treibt flussabwärts davon)
  breakOpen() {
    this.open = true;
    this.img.setTexture('forest_beaver_dam_hole');
    const s = this.scene.add.image(this.hole.x, this.hole.y + 4, 'forest_stick').setScale(0.6).setDepth(this.hole.y + 20);
    this.scene.tweens.add({ targets: s, x: s.x - 70, y: s.y + 35, angle: 40, alpha: 0, duration: 3200, ease: 'Sine.easeIn', onComplete: () => s.destroy() });
  }

  update(dt) {
    if (this.open) {
      this.spray -= dt;
      if (this.spray <= 0) {
        this.spray = SPRAY_EVERY;
        this.sprayDrop();
      }
    } else {
      this.reopen -= dt;
      if (this.reopen <= 0) this.breakOpen();
    }
    for (const s of this.sticks) {
      if (s.present || s === this.carried || s.back <= 0) continue;
      s.back -= dt;
      if (s.back <= 0) {
        s.present = true;
        s.img.setVisible(true).setAlpha(0);
        this.scene.tweens.add({ targets: s.img, alpha: 1, duration: 500 });
      }
    }
    this.check -= dt;
    if (this.check <= 0) {
      this.check = CHECK_EVERY;
      this.fill();
    }
  }

  // Wasser schießt durchs Loch flussabwärts (nach links unten)
  sprayDrop() {
    const scene = this.scene;
    const x = this.hole.x + Phaser.Math.FloatBetween(-6, 6);
    const y = this.hole.y + Phaser.Math.FloatBetween(-2, 2);
    const d = scene.add.circle(x, y, Phaser.Math.FloatBetween(0.8, 1.6), 0xe6f6ff, 0.9).setDepth(this.img.depth + 1);
    scene.tweens.add({
      targets: d,
      x: x - Phaser.Math.FloatBetween(10, 20),
      y: y + Phaser.Math.FloatBetween(8, 14),
      alpha: 0,
      duration: Phaser.Math.Between(450, 700),
      ease: 'Quad.easeIn',
      onComplete: () => d.destroy(),
    });
  }
}
