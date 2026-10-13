// Krokodil (Savanne): verhält sich wie der Fisch – in den Wasserlöchern steigen Blasen auf, dann taucht kurz der Kopf auf.
// Nur solange es oben ist, kann man es fangen, und zwar mit dem Lasso. Gefangen läuft es an Land hinterher,
// im Krokodilteich schwimmt es dann im Wasser und kommt ab und zu heraus, um am Ufer herumzulaufen.
import Phaser from 'phaser';
import Animal from './Animal.js';
import Fish from './Fish.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { enclosureAt, isBlocked, isFishpond } from '../world/map.js';

const WATER_ORIGIN_Y = 40 / 44; // Wasserlinie im Bild "croc_water"
const SURFACED = ['rising', 'up', 'sinking'];
const SWIM_TIME = [10, 20]; // im Krokodilteich: so lange schwimmt es ...
const LAND_TIME = [8, 15]; // ... und so lange läuft es am Ufer herum
const BACK_TIMEOUT = 8; // findet es nicht zurück zum Ufer, springt es trotzdem hinein

export default class Crocodile extends Fish {
  constructor(scene, allAnimals) {
    super(scene, allAnimals, 'crocodile');
  }

  // Uferplätze im eigenen Gehege: freie Kachel direkt neben dem Teich (land) und die Wasserkachel daneben (water)
  shoreSpots() {
    const { tx, ty } = worldToTile(this.x, this.y);
    const pen = enclosureAt(tx, ty);
    if (!pen) return [];
    const a = pen.area;
    const spots = [];
    for (let y = a.ty0; y <= a.ty1; y++) {
      for (let x = a.tx0; x <= a.tx1; x++) {
        if (isBlocked(x, y)) continue;
        const w = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => isFishpond(x + dx, y + dy));
        if (w) spots.push({ land: tileToWorld(x, y), water: tileToWorld(x + w[0], y + w[1]) });
      }
    }
    return spots;
  }

  nearestShore() {
    const spots = this.shoreSpots();
    spots.sort((p, q) => Math.hypot(p.land.x - this.x, p.land.y - this.y) - Math.hypot(q.land.x - this.x, q.land.y - this.y));
    return spots[0] ?? null;
  }

  updateFree(dt, player) {
    if (this.state !== 'penned') return super.updateFree(dt, player);
    this.penTime = (this.penTime ?? Phaser.Math.FloatBetween(3, SWIM_TIME[1])) - dt;
    if (!this.onLand) {
      if (this.penTime > 0) return super.updateFree(dt, player); // schwimmt im Teich
      // ans Ufer klettern
      const shore = this.nearestShore();
      if (!shore) {
        this.penTime = Phaser.Math.FloatBetween(...SWIM_TIME);
        return false;
      }
      this.splash();
      this.x = shore.land.x;
      this.y = shore.land.y;
      this.onLand = true;
      this.backTo = null;
      this.penTime = Phaser.Math.FloatBetween(...LAND_TIME);
      this.faceX = Math.sign(shore.land.x - shore.water.x) || this.faceX;
      this.faceY = Math.sign(shore.land.y - shore.water.y) || this.faceY;
      this.useBagLook();
      this.pickWander();
      return false;
    }
    if (this.penTime > 0) return Animal.prototype.updateFree.call(this, dt, player); // läuft am Ufer herum
    // zurück ins Wasser: zum nächsten Uferplatz laufen und hineinspringen
    this.backTo ??= this.nearestShore();
    const b = this.backTo;
    const dx = b ? b.land.x - this.x : 0;
    const dy = b ? b.land.y - this.y : 0;
    const d = Math.hypot(dx, dy);
    if (!b || d < 3 || this.penTime < -BACK_TIMEOUT) {
      const water = b ? b.water : this.nearestShore()?.water;
      if (water) {
        this.x = water.x;
        this.y = water.y;
      }
      this.onLand = false;
      this.penTime = Phaser.Math.FloatBetween(...SWIM_TIME);
      this.useWaterLook();
      this.splash();
      this.pickWander();
      return false;
    }
    const step = Math.min(d, this.kind.speed * dt);
    return this.move((dx / d) * step, (dy / d) * step);
  }

  // an Land gelten die normalen Regeln (im Gehege bleiben, nicht ins Wasser laufen), im Wasser die des Fischs
  blocked(x, y) {
    if (this.state === 'penned' && this.onLand) return Animal.prototype.blocked.call(this, x, y);
    return super.blocked(x, y);
  }

  catch() {
    this.onLand = false;
    super.catch();
  }

  // im Wasser: nur der Kopf schaut heraus
  useWaterLook() {
    this.sprite.setTexture('croc_water', 0).setOrigin(0.5, WATER_ORIGIN_Y).setScale(0.5);
    this.shadow.setVisible(false);
  }

  // an Land (gefangen): läuft auf allen vieren hinterher
  useBagLook() {
    this.sprite.setTexture(this.kind.texture, this.kind.frames.downRight).setOrigin(0.5, this.kind.originY).setScale(0.5);
    this.sprite.setVisible(true);
    this.shadow.setVisible(true);
  }

  // taucht mal mit dem Kopf zu uns, mal von uns weg auf
  pickSpot() {
    super.pickSpot();
    this.faceY = Math.random() < 0.6 ? 1 : -1;
  }

  render(moving) {
    if (this.state === 'following' || (this.state === 'penned' && this.onLand)) {
      Animal.prototype.render.call(this, moving);
      return;
    }
    const f = this.kind.frames;
    this.sprite.setFrame(
      this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft,
    );
    // beim Auf- und Abtauchen schiebt sich der Kopf aus dem Wasser bzw. hinein
    let grow = 1;
    if (this.state === 'wild') {
      if (this.phase === 'rising') grow = 1 - this.phaseTime / 0.25;
      if (this.phase === 'sinking') grow = this.phaseTime / 0.25;
    }
    const bob = Math.sin(this.scene.time.now / 300 + this.x) * 1;
    this.sprite.setVisible(this.state !== 'wild' || SURFACED.includes(this.phase));
    this.sprite.setScale(0.5, 0.5 * Phaser.Math.Clamp(grow, 0.1, 1));
    this.sprite.setPosition(this.x, this.y + 3 + bob);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
  }
}
