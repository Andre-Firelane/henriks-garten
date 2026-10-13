// Fischreiher: fliegt in regelmäßigen Abständen über die Karte. Manche landen an einer Uferstelle,
// stehen dort etwa 30 Sekunden (nur dann kann man sie fangen) und fliegen danach weiter.
// Die Szene startet die Überflüge (siehe updateHerons in GardenScene); hier steckt der Flug selbst.
// In der Voliere fliegt er ab und zu eine kurze Strecke zu einer anderen Stelle.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { isBlocked } from '../world/map.js';

const FLY_SPEED = 110; // Welt-Pixel pro Sekunde
const ALTITUDE = 70; // Flughöhe über dem Schatten
const GLIDE = 140; // auf dieser Strecke gleitet er beim Landen hinunter bzw. steigt beim Abflug auf
const STAND_TIME = [25, 35]; // so lange bleibt ein gelandeter Reiher stehen
const FLY_ORIGIN_Y = 0.5;
const PEN_FLY_EVERY = [10, 20]; // in der Voliere: Sekunden zwischen zwei kurzen Flügen
const PEN_FLY_SPEED = 60; // gemächlicher als beim Überflug
const PEN_ALTITUDE = 26; // so hoch fliegt er höchstens (unter dem Netz)
const PEN_MIN_DIST = 50; // so weit soll der Flug mindestens gehen

// Phasen: flying (zum Ziel) → landed → leaving (zum Kartenrand); ohne Landung: flying direkt zum Rand
export default class Heron extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'heron');
    this.altitude = 0;
    this.gone = false; // true: ist aus der Karte hinausgeflogen, die Szene entfernt ihn
  }

  // Überflug starten: von "from" nach "to"; land = true heißt, er bleibt bei "to" stehen
  startFlight(from, to, land) {
    this.x = from.x;
    this.y = from.y;
    this.start = { ...from };
    this.target = to;
    this.land = land;
    this.phase = 'flying';
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'landed';
  }

  // Der Spawner entfernt ihn nie; er verschwindet, indem er wegfliegt
  canDespawn() {
    return false;
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return this.updatePen(dt, player);

    if (this.phase === 'landed') {
      this.altitude = 0;
      this.standTime -= dt;
      if (this.standTime <= 0) this.takeOff();
      return false;
    }

    // Fliegen zum Ziel
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = FLY_SPEED * dt;
    if (d <= step) {
      this.x = this.target.x;
      this.y = this.target.y;
      if (this.phase === 'flying' && this.land) {
        this.phase = 'landed';
        this.standTime = Phaser.Math.FloatBetween(...STAND_TIME);
      } else {
        this.gone = true;
      }
      return false;
    }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    if (Math.abs(dx) > d * 0.2) this.faceX = Math.sign(dx);
    if (Math.abs(dy) > d * 0.2) this.faceY = Math.sign(dy);

    // Höhe: beim Landen hinuntergleiten, beim Abflug aufsteigen
    const flown = Math.hypot(this.x - this.start.x, this.y - this.start.y);
    if (this.phase === 'flying' && this.land) this.altitude = Math.min(ALTITUDE, (d / GLIDE) * ALTITUDE);
    else if (this.phase === 'leaving') this.altitude = Math.min(ALTITUDE, (flown / GLIDE) * ALTITUDE);
    else this.altitude = ALTITUDE;
    return false;
  }

  // In der Voliere: herumstaksen, ab und zu kurz zu einer anderen Stelle fliegen
  updatePen(dt, player) {
    const f = this.penFlight;
    if (!f) {
      this.penFlyTime = (this.penFlyTime ?? Phaser.Math.FloatBetween(3, PEN_FLY_EVERY[1])) - dt;
      if (this.penFlyTime > 0) return super.updateFree(dt, player);
      this.penFlyTime = Phaser.Math.FloatBetween(...PEN_FLY_EVERY);
      const to = this.penLandingSpot();
      if (to) this.penFlight = { from: { x: this.x, y: this.y }, to, done: 0 };
      return false;
    }
    const total = Math.hypot(f.to.x - f.from.x, f.to.y - f.from.y);
    f.done = Math.min(total, f.done + PEN_FLY_SPEED * dt);
    const k = f.done / total;
    this.x = f.from.x + (f.to.x - f.from.x) * k;
    this.y = f.from.y + (f.to.y - f.from.y) * k;
    this.altitude = Math.sin(k * Math.PI) * PEN_ALTITUDE;
    this.faceX = Math.sign(f.to.x - f.from.x) || this.faceX;
    this.faceY = Math.sign(f.to.y - f.from.y) || this.faceY;
    if (k >= 1) {
      this.penFlight = null;
      this.altitude = 0;
      this.pickWander();
    }
    return false;
  }

  // freie Stelle in der eigenen Voliere, nicht zu nah
  penLandingSpot() {
    const a = this.enclosure?.area;
    if (!a) return null;
    const spots = [];
    for (let ty = a.ty0; ty <= a.ty1; ty++) {
      for (let tx = a.tx0; tx <= a.tx1; tx++) {
        if (isBlocked(tx, ty)) continue;
        const p = tileToWorld(tx, ty);
        if (Math.hypot(p.x - this.x, p.y - this.y) >= PEN_MIN_DIST && this.enclosureFullyAt(p.x, p.y) === this.enclosure) spots.push(p);
      }
    }
    return spots.length ? Phaser.Utils.Array.GetRandom(spots) : null;
  }

  restore(state) {
    this.penFlight = null;
    this.altitude = 0;
    super.restore(state);
  }

  takeOff() {
    this.phase = 'leaving';
    this.start = { x: this.x, y: this.y };
    this.target = this.scene.heronExitPoint(this.x, this.y);
  }

  render(moving) {
    const penFlying = this.state === 'penned' && this.penFlight;
    if (!penFlying && (this.state !== 'wild' || this.phase === 'landed')) {
      // stehend (auch beim Folgen und im Gehege)
      if (this.sprite.texture.key !== this.kind.texture) this.sprite.setTexture(this.kind.texture).setOrigin(0.5, this.kind.originY);
      super.render(moving);
      this.shadow.setScale(1);
      return;
    }
    // fliegend: hoch über allem, mit Flügelschlag-Wippen; der Schatten bleibt am Boden
    if (this.sprite.texture.key !== this.kind.flyTexture) this.sprite.setTexture(this.kind.flyTexture).setOrigin(0.5, FLY_ORIGIN_Y);
    const f = this.kind.frames;
    this.sprite.setFrame(
      this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft,
    );
    const flap = Math.sin(this.scene.time.now / 120) * 2;
    this.sprite.setPosition(this.x, this.y - this.altitude - 20 + flap);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.altitude > 20 && !penFlying ? 200000 + this.y : this.y);
    this.shadow.setPosition(this.x, this.y);
    this.shadow.setScale(1 - (this.altitude / ALTITUDE) * 0.4);
    this.shadow.setDepth(this.y - 0.5);
  }
}
