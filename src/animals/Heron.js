// Fischreiher: fliegt in regelmäßigen Abständen über die Karte. Manche landen an einer Uferstelle,
// stehen dort etwa 30 Sekunden (nur dann kann man sie fangen) und fliegen danach weiter.
// Die Szene startet die Überflüge (siehe updateHerons in GardenScene); hier steckt der Flug selbst.
import Phaser from 'phaser';
import Animal from './Animal.js';

const FLY_SPEED = 110; // Welt-Pixel pro Sekunde
const ALTITUDE = 70; // Flughöhe über dem Schatten
const GLIDE = 140; // auf dieser Strecke gleitet er beim Landen hinunter bzw. steigt beim Abflug auf
const STAND_TIME = [25, 35]; // so lange bleibt ein gelandeter Reiher stehen
const FLY_ORIGIN_Y = 0.5;

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
    if (this.state === 'penned') return super.updateFree(dt, player); // stakst im Gehege herum

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

  takeOff() {
    this.phase = 'leaving';
    this.start = { x: this.x, y: this.y };
    this.target = this.scene.heronExitPoint(this.x, this.y);
  }

  render(moving) {
    if (this.state !== 'wild' || this.phase === 'landed') {
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
    this.sprite.setDepth(this.altitude > 20 ? 200000 + this.y : this.y);
    this.shadow.setPosition(this.x, this.y);
    this.shadow.setScale(1 - (this.altitude / ALTITUDE) * 0.4);
    this.shadow.setDepth(this.y - 0.5);
  }
}
