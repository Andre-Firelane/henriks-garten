// Leben im Wald (Angaben in levels.js): Schaum um die Felsen im Fluss (ř), Moospolster auf dem Boden (moss: Anteil der
// Graskacheln), einzelne Bienen
// schwirren von Blume zu Blume (bees: wie viele), kleine Vögel fliegen von Baum zu Baum (birds: wie viele), in der
// Wolfsnacht flattern ab und zu Fledermäuse aus der Höhle (bats: Kachel der Höhle) und verschwinden im Zickzack über dem
// Wald. Nur Deko: man fängt sie nicht.
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';
import { LEVEL, MAP_W, MAP_H, charAt } from './map.js';
import { isActive } from './events.js';
import { NIGHT_DEPTH } from '../animals/Wolf.js';

const EVERY = [4, 10]; // Sekunden bis zum nächsten Schwarm
const SWARM = [1, 3]; // so viele auf einmal
const CAVE_UP = 30; // Eingang der Höhle über ihrem Fuß
const FLIGHT = [3.5, 5.5]; // so lange fliegt eine, bis sie verschwunden ist
const FLAP = 0.09; // Sekunden je Flügelbild
const FLOWERS = 'fgḃƒȁṽ'; // hier landen die Bienen
const BEE_SPEED = 45; // Pixel pro Sekunde
const BEE_HOVER = [1, 3.5]; // so lange summt sie über einer Blüte
const BEE_REACH = 7; // so weit (Kacheln) fliegt sie zur nächsten Blume
const BEE_HEIGHT = 12;
const BEE_SCALE = 0.6; // kleiner als die Bienen am Bienenkorb der Wiese
const MOSS_DEPTH = -99995; // flach auf dem Boden, unter allem, was steht
const FOAM_DEPTH = -99989; // auf dem Wasser, unter den Felsen
const FOAM_MS = 260; // so oft wechselt das Schaumbild
const FOAM_SCALE = 0.7; // Schaumkranz eng um den Felsen
const FLECK_EVERY = 0.35; // Sekunden: so oft löst sich an einem Felsen eine Schaumflocke
const FLECK_DRIFT = [40, 70]; // so weit treibt sie flussabwärts (Pixel), bis sie verschwunden ist
const CROWN = { D: 58, P: 52, T: 56 }; // so hoch über dem Fuß sitzt ein Vogel in der Krone (Laubbaum, Tanne, Apfelbaum)
const BIRD_SIT = [3, 9]; // so lange sitzt ein Vogel, bevor er weiterfliegt
const BIRD_REACH = 8; // so weit (Kacheln) fliegt er zum nächsten Baum
const BIRD_SPEED = 120; // Pixel pro Sekunde
const BIRD_SHY = 50; // kommt Henrik dem Baum so nah (Kachel-Proportionen), fliegt er auf
const BIRD_FLAP = 0.08; // Sekunden je Flügelbild

export default class ForestLife {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this.cave = LEVEL.bats ? tileToWorld(LEVEL.bats.tx, LEVEL.bats.ty) : null;
    this.timer = Phaser.Math.FloatBetween(1, EVERY[0]);
    this.bats = [];
    this.flowers = [];
    for (let ty = 1; ty < MAP_H - 1; ty++) for (let tx = 1; tx < MAP_W - 1; tx++) if (FLOWERS.includes(charAt(tx, ty))) this.flowers.push({ tx, ty });
    this.bees = this.flowers.length ? Array.from({ length: LEVEL.bees ?? 0 }, () => this.newBee()) : [];
    if (LEVEL.moss) this.placeMoss(LEVEL.moss);
    this.foams = this.placeFoam();
    // Bäume im Inneren (nicht am Kartenrand), auf denen Vögel sitzen können
    this.trees = [];
    for (let ty = 2; ty < MAP_H - 2; ty++) for (let tx = 2; tx < MAP_W - 2; tx++) if (CROWN[charAt(tx, ty)]) this.trees.push({ tx, ty, up: CROWN[charAt(tx, ty)], ...tileToWorld(tx, ty) });
    this.birds = this.trees.length ? Array.from({ length: LEVEL.birds ?? 0 }, () => this.newBird()) : [];
  }

  newBird() {
    const img = this.scene.add.image(0, 0, 'forest_bird');
    const b = { img };
    this.perch(b, Phaser.Utils.Array.GetRandom(this.trees));
    return b;
  }

  // auf einem Baum landen: irgendwo vorne in der Krone
  perch(b, tree) {
    b.tree = tree;
    b.flying = false;
    b.wait = Phaser.Math.FloatBetween(...BIRD_SIT);
    b.x = tree.x + Phaser.Math.Between(-10, 10);
    b.y = tree.y - tree.up + Phaser.Math.Between(-8, 8);
    b.img.setTexture('forest_bird').setOrigin(0.5, 1).setPosition(b.x, b.y).setDepth(tree.y + 1);
  }

  // zu einem anderen Baum in der Nähe fliegen (im Bogen)
  flyOff(b) {
    const near = this.trees.filter((t) => t !== b.tree && Math.abs(t.tx - b.tree.tx) <= BIRD_REACH && Math.abs(t.ty - b.tree.ty) <= BIRD_REACH);
    const to = Phaser.Utils.Array.GetRandom(near.length ? near : this.trees);
    const end = { x: to.x + Phaser.Math.Between(-10, 10), y: to.y - to.up + Phaser.Math.Between(-8, 8) };
    const dist = Math.hypot(end.x - b.x, end.y - b.y);
    Object.assign(b, { flying: true, from: { x: b.x, y: b.y }, to: end, next: to, t: 0, dur: Math.max(0.6, dist / BIRD_SPEED), arc: Math.min(50, 12 + dist * 0.15) });
    b.img.setOrigin(0.5, 0.6).setFlipX(end.x > b.x); // das Bild schaut nach links
  }

  updateBird(b, dt, night) {
    b.img.setVisible(!night);
    if (night) return;
    if (!b.flying) {
      b.wait -= dt;
      const p = this.scene.player;
      if (b.wait <= 0 || Math.hypot(p.x - b.tree.x, (p.y - b.tree.y) * 2) < BIRD_SHY) this.flyOff(b);
      else if (Math.random() < dt * 0.4) b.img.setFlipX(!b.img.flipX); // schaut sich um
      return;
    }
    b.t += dt;
    const k = Math.min(1, b.t / b.dur);
    b.x = b.from.x + (b.to.x - b.from.x) * k;
    b.y = b.from.y + (b.to.y - b.from.y) * k - Math.sin(Math.PI * k) * b.arc;
    b.img.setTexture(Math.floor(b.t / BIRD_FLAP) % 2 ? 'forest_bird_fly1' : 'forest_bird_fly0').setPosition(b.x, b.y).setDepth(Math.max(b.tree.y, b.next.y) + 200);
    if (k >= 1) this.perch(b, b.next);
  }

  // Schaum um jeden Felsen im Fluss; die Flocken treiben flussabwärts (zum Wasser weiter unten im Fluss, tx + ty größer)
  placeFoam() {
    const foams = [];
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        if (charAt(tx, ty) !== 'ř') continue;
        const p = tileToWorld(tx, ty);
        const img = this.scene.add.image(p.x, p.y + 1, 'forest_foam0').setDepth(FOAM_DEPTH);
        let down = { tx: tx + 1, ty: ty + 1 };
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (charAt(tx + dx, ty + dy) === '~' && dx + dy > down.tx - tx + down.ty - ty - 0.5) down = { tx: tx + dx, ty: ty + dy };
        const d = tileToWorld(down.tx, down.ty);
        const len = Math.hypot(d.x - p.x, d.y - p.y) || 1;
        foams.push({ img, x: p.x, y: p.y, dir: { x: (d.x - p.x) / len, y: (d.y - p.y) / len }, fleck: Math.random() * FLECK_EVERY, phase: Math.random() * 10 });
      }
    }
    return foams;
  }

  updateFoam(dt) {
    const frame = Math.floor((this.time * 1000) / FOAM_MS);
    for (const f of this.foams) {
      f.img.setTexture((frame + Math.round(f.phase)) % 2 ? 'forest_foam1' : 'forest_foam0');
      f.img.setScale(FOAM_SCALE * (1 + Math.sin(this.time * 3 + f.phase) * 0.05), FOAM_SCALE * (1 + Math.cos(this.time * 2.6 + f.phase) * 0.06));
      f.fleck -= dt;
      if (f.fleck > 0 || !f.img.visible) continue;
      f.fleck = FLECK_EVERY * Phaser.Math.FloatBetween(0.6, 1.4);
      const side = Phaser.Math.FloatBetween(-9, 9);
      const x = f.x + f.dir.x * 6 - f.dir.y * side;
      const y = f.y + f.dir.y * 6 + f.dir.x * side * 0.5;
      const drift = Phaser.Math.Between(...FLECK_DRIFT);
      const fleck = this.scene.add.ellipse(x, y, Phaser.Math.FloatBetween(3, 6), Phaser.Math.FloatBetween(1.5, 3), 0xffffff, 0.85).setDepth(FOAM_DEPTH);
      this.scene.tweens.add({ targets: fleck, x: x + f.dir.x * drift, y: y + f.dir.y * drift, alpha: 0, scaleX: 0.4, duration: Phaser.Math.Between(900, 1500), onComplete: () => fleck.destroy() });
    }
  }

  // Moospolster auf freiem Gras abseits der Wege, fest pro Kachel verteilt (jedes Mal an denselben Stellen)
  placeMoss(amount) {
    const path = (tx, ty) => [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => charAt(tx + dx, ty + dy) === '#'));
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        if (charAt(tx, ty) !== '.' || path(tx, ty)) continue;
        const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
        if ((h % 1000) / 1000 >= amount) continue;
        const p = tileToWorld(tx + ((h >>> 10) % 40) / 100 - 0.2, ty + ((h >>> 16) % 40) / 100 - 0.2);
        this.scene.add.image(p.x, p.y, `forest_moss${(h >>> 4) % 2}`).setFlipX(!!((h >>> 7) % 2)).setDepth(MOSS_DEPTH);
      }
    }
  }

  newBee() {
    const f = Phaser.Utils.Array.GetRandom(this.flowers);
    const p = tileToWorld(f.tx, f.ty);
    const img = this.scene.add.image(p.x, p.y - BEE_HEIGHT, 'bee').setScale(BEE_SCALE);
    return { img, f, x: p.x, y: p.y, target: null, wait: Phaser.Math.FloatBetween(...BEE_HOVER), phase: Math.random() * 10 };
  }

  // eine Biene: über der Blüte summen, dann zur nächsten Blume in der Nähe; nachts (Wolfsnacht) schlafen sie
  updateBee(b, dt, night) {
    b.img.setVisible(!night);
    if (night) return;
    if (!b.target) {
      b.wait -= dt;
      if (b.wait <= 0) {
        const near = this.flowers.filter((f) => f !== b.f && Math.abs(f.tx - b.f.tx) <= BEE_REACH && Math.abs(f.ty - b.f.ty) <= BEE_REACH);
        b.f = Phaser.Utils.Array.GetRandom(near.length ? near : this.flowers);
        b.target = tileToWorld(b.f.tx + Phaser.Math.FloatBetween(-0.2, 0.2), b.f.ty + Phaser.Math.FloatBetween(-0.2, 0.2));
      }
    } else {
      const dx = b.target.x - b.x, dy = b.target.y - b.y;
      const dist = Math.hypot(dx, dy);
      const step = Math.min(dist, BEE_SPEED * dt);
      if (dist > 0) {
        b.x += (dx / dist) * step;
        b.y += (dy / dist) * step;
        if (Math.abs(dx) > 0.5) b.img.setFlipX(dx > 0);
      }
      if (dist < 1) {
        b.target = null;
        b.wait = Phaser.Math.FloatBetween(...BEE_HOVER);
      }
    }
    const t = this.time + b.phase;
    const buzz = b.target ? Math.sin(t * 14) * 3 : Math.sin(t * 9) * 2; // im Flug zickzack, über der Blüte kleine Kreise
    b.img.setPosition(b.x + buzz, b.y - BEE_HEIGHT + Math.cos(t * 11) * 1.5).setDepth(b.y + 1);
  }

  update(dt) {
    this.time += dt;
    const night = isActive('wolves');
    this.updateFoam(dt);
    for (const b of this.bees) this.updateBee(b, dt, night);
    for (const b of this.birds) this.updateBird(b, dt, night);
    if (this.cave && night) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = Phaser.Math.FloatBetween(...EVERY);
        for (let i = Phaser.Math.Between(...SWARM); i > 0; i--) this.bats.push(this.newBat());
      }
    }
    for (const b of [...this.bats]) {
      b.t += dt;
      const k = b.t / b.dur;
      if (k >= 1) {
        b.img.destroy();
        this.bats.splice(this.bats.indexOf(b), 1);
        continue;
      }
      // aus dem Eingang hinaus, dann im Zickzack immer höher und weiter weg; am Ende verblassen
      const x = this.cave.x + b.dx * k * k + Math.sin(b.t * b.wiggle) * 14 * k;
      const y = this.cave.y - CAVE_UP - b.rise * k + Math.cos(b.t * b.wiggle * 1.3) * 6;
      b.img.setPosition(x, y).setFlipX(b.dx < 0).setAlpha(Math.min(1, (1 - k) * 4));
      b.img.setTexture(Math.floor(b.t / FLAP) % 2 ? 'forest_bat1' : 'forest_bat0');
    }
  }

  newBat() {
    const img = this.scene.add.image(this.cave.x, this.cave.y - CAVE_UP, 'forest_bat0').setDepth(NIGHT_DEPTH + 1);
    return { img, t: 0, dur: Phaser.Math.FloatBetween(...FLIGHT), dx: Phaser.Math.Between(-420, 420), rise: Phaser.Math.Between(140, 260), wiggle: Phaser.Math.FloatBetween(5, 9) };
  }
}
