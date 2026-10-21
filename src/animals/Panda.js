// Panda (Asien): lebt in der Nähe von Bambus und hohem Gras, läuft dort herum oder setzt sich hin und frisst.
// Fangen: mit Grünfutter (siehe feedAnimal in GardenScene). Der Haken: Kommt man mit ihm nah an Bambus oder hohem Gras
// vorbei, verlässt er die Schlange, setzt sich dorthin und frisst – erst nach SNACK_LOCK Sekunden lässt er sich wieder
// mit Futter locken.
import Phaser from 'phaser';
import Animal, { SPRITE_SINK } from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { charAt, isBlocked } from '../world/map.js';

const BAMBOO = 'Qq'; // Bambus und hohes Gras
const SIT_CHANCE = 0.45; // so oft setzt er sich statt einer Pause an einen Bambus
const SIT_TIME = [6, 12]; // so lange frisst er (frei oder im Gehege)
const RANGE = 4; // so viele Kacheln weit sucht er nach Bambus
const HOME_DIST = 6; // weiter weg vom Bambus läuft er zurück
const SNACK_REACH = 1; // beim Folgen: Bambus so viele Kacheln neben ihm lockt ihn weg
const SNACK_LOCK = 10; // so lange lässt er sich danach nicht mit Futter locken
const SNACK_GRACE = 10; // nach einem Fang so lange Zeit, die Pandas vom Bambus wegzulocken (gilt für alle Pandas)
const WALK_TIMEOUT = 10;
const EAT_ORIGIN_Y = 92 / 96;

export default class Panda extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'panda');
    this.sit = null; // { spot, food, phase: 'walk' | 'eat', time }
    this.snackLock = 0;
    this.grace = 0;
  }

  // Bambus oder hohes Gras in der Nähe: Kachel davon und ein freier Sitzplatz daneben (oder null)
  findBamboo(range) {
    const { tx, ty } = worldToTile(this.x, this.y);
    let best = null;
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (!BAMBOO.includes(charAt(tx + dx, ty + dy))) continue;
        // hohes Gras ist begehbar: dort setzt er sich mitten hinein; an Bambus daneben
        const food = { tx: tx + dx, ty: ty + dy };
        const places = charAt(food.tx, food.ty) === 'q' ? [food] : [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([ax, ay]) => ({ tx: food.tx + ax, ty: food.ty + ay }));
        for (const pl of places) {
          if (isBlocked(pl.tx, pl.ty)) continue;
          const p = tileToWorld(pl.tx, pl.ty);
          if (this.state === 'penned' && this.enclosureFullyAt(p.x, p.y) !== this.enclosure) continue;
          const d = Math.hypot(p.x - this.x, (p.y - this.y) * 2);
          if (!best || d < best.d) best = { spot: p, food: tileToWorld(food.tx, food.ty), d };
        }
      }
    }
    return best;
  }

  sitDown(target, time = WALK_TIMEOUT) {
    this.sit = { spot: target.spot, food: target.food, phase: 'walk', time };
    this.dirX = 0;
    this.dirY = 0;
  }

  pickWander() {
    this.sit = null;
    if (this.state === 'wild' || this.state === 'penned') {
      const near = this.findBamboo(RANGE);
      if (near && Math.random() < SIT_CHANCE) return this.sitDown(near);
      // zu weit weg vom Bambus: zurück in seine Nähe
      if (this.state === 'wild' && !this.findBamboo(HOME_DIST)) {
        const far = this.findBamboo(12);
        if (far) return this.sitDown(far, WALK_TIMEOUT * 2);
      }
    }
    super.pickWander();
  }

  // gefangen und hinterher: kommt man nah an Bambus vorbei, läuft er weg und frisst
  update(dt, player) {
    this.snackLock = Math.max(0, this.snackLock - dt);
    this.grace = Math.max(0, this.grace - dt);
    if (this.state === 'following' && this.grace <= 0) {
      const near = this.findBamboo(SNACK_REACH);
      if (near) this.scene.pandaSnack(this, near);
    }
    super.update(dt, player);
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.snackLock <= 0;
  }

  // nimmt Futter erst nach der Pause wieder an (für den Hinweis beim Füttern)
  isSnacking() {
    return this.state === 'wild' && this.snackLock > 0;
  }

  // aus der Schlange zum Bambus: frisst und lässt sich SNACK_LOCK Sekunden nicht locken
  snack(target) {
    this.state = 'wild';
    this.snackLock = SNACK_LOCK;
    this.sitDown(target);
  }

  updateFree(dt, player) {
    const sit = this.sit;
    if (!sit || this.state === 'following') return super.updateFree(dt, player);
    sit.time -= dt;
    if (sit.phase === 'walk') {
      const dx = sit.spot.x - this.x;
      const dy = sit.spot.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 3 || sit.time <= 0) {
        sit.phase = 'eat';
        sit.time = Math.max(Phaser.Math.FloatBetween(...SIT_TIME), this.snackLock);
        this.faceX = Math.sign(sit.food.x - this.x) || this.faceX;
        this.faceY = 1; // beim Fressen immer von vorne zu sehen (nur seitlich zum Futter gedreht)
        return false;
      }
      const step = Math.min(d, this.kind.speed * 1.4 * dt);
      const angle = Math.atan2(dy, dx);
      for (const turn of [0, 0.5, -0.5, 1, -1]) {
        if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) return true;
      }
      return false;
    }
    // nach dem Snack bleibt er sitzen, bis man ihn wieder füttert (frei) bzw. die Zeit um ist (im Gehege)
    if (sit.time <= 0 && !(this.state === 'wild' && this.snackLock > 0)) {
      this.sit = null;
      super.pickWander();
    }
    return false;
  }

  startFeed() {
    this.sit = null;
  }

  catch() {
    this.sit = null;
    this.snackLock = 0;
    // Schonfrist für alle Pandas, auch die, die schon hinterherlaufen: sonst läuft einer weg, wenn man einen
    // fängt, der gerade im Gras sitzt
    for (const a of this.scene.animals) if (a.species === 'panda') a.grace = Math.max(a.grace ?? 0, SNACK_GRACE);
    this.grace = SNACK_GRACE;
    super.catch();
  }

  restore(state) {
    this.sit = null;
    super.restore(state);
  }

  render(moving) {
    const eating = this.sit?.phase === 'eat' && this.state !== 'following';
    const key = eating ? 'panda_eat' : this.lookTexture();
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key, this.sprite.frame.name).setOrigin(0.5, eating ? EAT_ORIGIN_Y : this.kind.originY);
    if (!eating) return super.render(moving);
    const f = this.kind.frames;
    this.sprite.setFrame(this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft);
    this.sprite.setPosition(this.x, this.y + SPRITE_SINK);
    this.sprite.setAngle(0);
    this.shadow.setPosition(this.x, this.y);
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 0.5);
  }
}
