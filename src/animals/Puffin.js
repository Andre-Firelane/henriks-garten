// Papageitaucher (Eiswelt, nur tagsüber): eine Kolonie auf den kleinen Felsinseln im Fjord (Schneefelsen Ɵ/Ȟ mitten im
// Wasser – dort kommt Henrik nicht hin). Jeder sitzt eine Weile oben auf einem Inselfelsen, fliegt dann aufs Meer
// hinaus (puffin_fly) und kommt zurück. Nur ab und zu (VISIT_CHANCE) fliegt einer stattdessen ans Ufer hinüber, landet
// neben einem Vogelfelsen am Fjordufer und steht dort ein paar Sekunden – nur jetzt fängt man ihn mit dem Kescher. Danach
// fliegt er zurück auf seine Insel. Er flieht nicht; wer den Moment verpasst, wartet auf den nächsten Besuch.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { MAP_W, MAP_H, charAt, isBlocked, inPen, LEVEL } from '../world/map.js';

const ROCKS = { Ɵ: { lift: 36, dx: 14 }, Ȟ: { lift: 30, dx: 6 } }; // Vogelfelsen: so hoch sitzt er oben drauf
const PERCH_TIME = [8, 16]; // so lange sitzt er auf seinem Inselfelsen ...
const AWAY_TIME = [5, 10]; // ... ist auf dem Meer ...
const LANDED_TIME = 5; // ... bzw. steht am Ufer (fangbar)
const VISIT_CHANCE = 0.3; // so oft fliegt er statt aufs Meer ans Ufer hinüber
const FLY_TIME = 2.2; // so lange dauert ein Flug
const FLY_ARC = 60; // so hoch steigt er dabei zusätzlich
const SEA_DIST = 420; // so weit fliegt er hinaus (Welt-Pixel)

// Vogelfelsen: Inselfelsen (rundum Wasser, unerreichbar) und Uferfelsen am Wasser; freie Uferkacheln neben den
// Uferfelsen (dort landet er beim Besuch); einmal je Karte
let cacheFor = null;
let islets = [];
let landings = [];
function colony() {
  if (cacheFor === LEVEL) return;
  cacheFor = LEVEL;
  islets = [];
  const shore = [];
  landings = [];
  const near = (tx, ty, r, test) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (test(tx + dx, ty + dy)) return true;
    return false;
  };
  const water = (x, y) => charAt(x, y) === '~';
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      const c = charAt(tx, ty);
      if (!ROCKS[c] || inPen(tx, ty)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => water(tx + dx, ty + dy))) islets.push({ tx, ty, c });
      else if (near(tx, ty, 2, water)) shore.push({ tx, ty, c });
    }
  }
  if (!islets.length) islets = shore; // (Karte ohne Inselfelsen: dann eben auf den Uferfelsen)
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (charAt(tx, ty) !== '.' || isBlocked(tx, ty)) continue;
      if (near(tx, ty, 1, (x, y) => shore.some((r) => r.tx === x && r.ty === y)) && near(tx, ty, 2, water)) landings.push({ tx, ty });
    }
  }
}

// Platz oben auf einem Felsen: Bodenpunkt und Höhe
function rockSeat(rock) {
  const p = tileToWorld(rock.tx, rock.ty);
  const def = ROCKS[rock.c];
  return { x: p.x + def.dx + Phaser.Math.Between(-10, 10), y: p.y + 3, h: def.lift };
}

export default class Puffin extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'puffin');
    this.mode = null; // perch | fly | away | landed
    this.left = 0;
    this.fly = null; // { from: {x, y, h}, to: {x, y, h}, t, then }
    this.lift = 0; // so hoch über seinem Bodenpunkt (oben auf dem Felsen)
    this.home = null; // sein Inselfelsen
  }

  // erscheinen: am Ufer bei den Vogelfelsen (setzt sich gleich auf seinen Inselfelsen)
  static spawnTiles() {
    colony();
    return landings;
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.mode === 'landed';
  }

  canDespawn() {
    return this.mode !== 'landed';
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild') return false;
    return super.blocked(x, y);
  }

  // auf den eigenen Inselfelsen setzen (ohne Flug, beim Erscheinen)
  sitHome() {
    colony();
    this.home ??= Phaser.Utils.Array.GetRandom(islets);
    if (!this.home) return false;
    const seat = rockSeat(this.home);
    this.x = seat.x;
    this.y = seat.y;
    this.lift = seat.h;
    this.mode = 'perch';
    this.left = Phaser.Math.FloatBetween(2, PERCH_TIME[1]);
    this.faceY = 1;
    return true;
  }

  // losfliegen; then: was nach der Ankunft kommt ('perch', 'away' oder 'landed')
  startFly(to, then) {
    this.fly = { from: { x: this.x, y: this.y, h: this.lift }, to, t: 0, then };
    this.mode = 'fly';
    this.faceX = to.x < this.x ? -1 : 1;
    this.faceY = to.y < this.y ? -1 : 1;
  }

  flyHome() {
    this.startFly(rockSeat(this.home), 'perch');
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (!this.mode && !this.sitHome()) return false;
    if (this.fly) {
      this.fly.t += dt / FLY_TIME;
      const k = Math.min(1, this.fly.t);
      const { from, to } = this.fly;
      this.x = from.x + (to.x - from.x) * k;
      this.y = from.y + (to.y - from.y) * k;
      this.lift = from.h + (to.h - from.h) * k + Math.sin(Math.PI * k) * FLY_ARC;
      if (k >= 1) {
        this.mode = this.fly.then;
        this.lift = to.h;
        this.fly = null;
        this.left = Phaser.Math.FloatBetween(...(this.mode === 'perch' ? PERCH_TIME : this.mode === 'away' ? AWAY_TIME : [LANDED_TIME, LANDED_TIME]));
        this.faceY = 1;
      }
      return true;
    }
    this.left -= dt;
    if (this.left > 0) return false;
    if (this.mode === 'perch') {
      colony();
      const spot = Math.random() < VISIT_CHANCE && Phaser.Utils.Array.GetRandom(landings);
      if (spot) {
        // Besuch am Ufer: landen neben einem Vogelfelsen
        const p = tileToWorld(spot.tx, spot.ty);
        this.startFly({ x: p.x + Phaser.Math.Between(-8, 8), y: p.y + Phaser.Math.Between(-4, 4), h: 0 }, 'landed');
      } else {
        // aufs Meer hinaus (vom Felsen weg, zum Rand der Karte hin)
        const c = tileToWorld(MAP_W / 2, MAP_H / 2);
        const a = Math.atan2(this.y - c.y, this.x - c.x) + Phaser.Math.FloatBetween(-0.6, 0.6);
        this.startFly({ x: this.x + Math.cos(a) * SEA_DIST, y: this.y + Math.sin(a) * SEA_DIST * 0.5, h: 40 }, 'away');
      }
    } else {
      this.flyHome(); // vom Meer bzw. vom Ufer zurück auf die Insel
    }
    return false;
  }

  catch() {
    this.mode = null;
    this.fly = null;
    this.lift = 0;
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.mode = null;
    this.fly = null;
    this.lift = 0;
  }

  render(moving) {
    super.render(moving);
    if (this.state !== 'wild') {
      if (this.sprite.texture.key === 'puffin_fly') this.sprite.setTexture('puffin', this.faceX < 0 ? 1 : 0);
      this.sprite.setAlpha(1).setVisible(true);
      return;
    }
    const away = this.mode === 'away';
    this.sprite.setVisible(!away);
    this.shadow.setVisible(!away && !this.lift);
    const f = this.kind.frames;
    const frame = this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
    if (this.fly) {
      const k = Math.min(1, this.fly.t);
      this.sprite.setTexture('puffin_fly', frame).setFlipX(false);
      // aufs Meer: weit draußen ausblenden; vom Meer zurück: einblenden
      const fade = this.fly.then === 'away' ? 1 - Math.max(0, k - 0.7) / 0.3 : this.fly.from.h === 40 ? Math.min(1, k / 0.3) : 1;
      this.sprite.setAlpha(fade);
    } else {
      if (this.sprite.texture.key === 'puffin_fly') this.sprite.setTexture('puffin', frame);
      this.sprite.setAlpha(1);
    }
    if (this.lift) this.sprite.setY(this.sprite.y - this.lift).setDepth(this.y + 60); // oben auf dem Felsen bzw. in der Luft
  }
}
