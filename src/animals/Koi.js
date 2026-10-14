// Koi (Asien): im Koi-Teich sieht man nur ihre bunten Schatten unter Wasser – so kann man sie nicht fangen.
// Streut man am Ufer Fischfutter (siehe feedKoi in GardenScene), schwimmen die Koi in der Nähe herbei, tauchen mit
// offenem Maul auf und schnappen. Für ein paar Sekunden kann man sie dann keschern.
// Gefangen werden sie wie Fische zum Beutel; im Koi-Teich-Gehege tauchen sie auch ohne Futter regelmäßig auf.
// Jeder Koi hat eines von drei Farbmustern (variant) – welches, sieht man erst beim Fangen richtig.
import Phaser from 'phaser';
import Animal from './Animal.js';
import Fish from './Fish.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { KOI_WATER, FISHPOND_TILES, enclosureAt, accepts } from '../world/map.js';

// Farbmuster: Bild, Farbe des Schattens unter Wasser, Name in der Meldung beim Fangen
export const KOI_VARIANTS = {
  koi1: { color: 0xf08a2c, name: 'goldener Koi mit schwarzen Flecken' },
  koi2: { color: 0xe8503a, name: 'rot-weißer Koi' },
  koi3: { color: 0xf4f4f4, name: 'weißer Koi mit rotem Punkt' },
};

const SWIM_SPEED = 14; // gemächliches Kreisen unter Wasser
const CALL_SPEED = 70; // zum Futter eilen sie
const CALL_TIMEOUT = 12; // wer bis dahin nicht am Futter ist, gibt auf
const SNAP_TIME = [4, 6]; // so lange schnappen sie oben (nur dann kann man sie keschern)
const POND_UP_EVERY = [5, 12]; // im Gehege: so oft tauchen sie von selbst auf ...
const POND_UP_TIME = [2.5, 4]; // ... und so lange bleiben sie oben
const SWIM_RANGE = 4; // so viele Kacheln weit sucht sich ein Koi sein nächstes Ziel
const HOME_DIST = 50; // so nah muss der Beutel an den Koi-Teich, damit der Koi hineinspringt
const ORIGIN_Y = 0.63; // Wasserlinie im Bild
// Bilder im Spritesheet: unten-rechts, unten-links, oben-rechts, oben-links
const FRAMES = { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 };

export default class Koi extends Fish {
  constructor(scene, allFish, variant) {
    super(scene, allFish, 'koi');
    this.variant = KOI_VARIANTS[variant] ? variant : Phaser.Utils.Array.GetRandom(Object.keys(KOI_VARIANTS));
    // bunter Schatten unter Wasser
    this.blob = scene.add.ellipse(0, 0, 24, 9, KOI_VARIANTS[this.variant].color, 0.7).setDepth(-99999);
    this.useWaterLook();
    this.phase = 'swim';
    this.phaseTime = 0;
    this.target = null;
  }

  // wilde Koi beginnen an einer zufälligen Stelle im Teich (siehe spawnOne)
  placeRandom() {
    if (!KOI_WATER.length) return;
    const t = Phaser.Utils.Array.GetRandom(KOI_WATER);
    const p = tileToWorld(t.tx, t.ty);
    this.x = p.x;
    this.y = p.y;
  }

  useWaterLook() {
    if (!this.variant) return; // wird im Konstruktor gleich noch einmal aufgerufen
    this.sprite.setTexture(this.variant, FRAMES.downRight).setOrigin(0.5, ORIGIN_Y).setScale(0.5);
    this.shadow.setVisible(false);
  }

  // Wasserkacheln, in denen dieser Koi schwimmt: im Gehege dessen Teich, sonst der wilde Koi-Teich
  waterTiles() {
    if (this.state === 'penned') return FISHPOND_TILES.filter(({ tx, ty }) => enclosureAt(tx, ty) === this.enclosure);
    return KOI_WATER;
  }

  inWater(x, y) {
    const { tx, ty } = worldToTile(x, y);
    return this.waterTiles().some((t) => t.tx === tx && t.ty === ty);
  }

  // nächstes Ziel: eine Wasserkachel in der Nähe, die man auf gerader Linie durchs Wasser erreicht
  pickTarget() {
    const { tx, ty } = worldToTile(this.x, this.y);
    const near = this.waterTiles().filter((t) => Math.abs(t.tx - tx) <= SWIM_RANGE && Math.abs(t.ty - ty) <= SWIM_RANGE);
    for (let i = 0; i < 12 && near.length; i++) {
      const t = Phaser.Utils.Array.GetRandom(near);
      const p = tileToWorld(t.tx, t.ty);
      p.x += Phaser.Math.Between(-10, 10);
      p.y += Phaser.Math.Between(-4, 4);
      let ok = true;
      for (let k = 1; k <= 8 && ok; k++) ok = this.inWater(this.x + ((p.x - this.x) * k) / 8, this.y + ((p.y - this.y) * k) / 8);
      if (ok) return p;
    }
    return null;
  }

  // Futter im Wasser bei spot: herbeischwimmen und dort auftauchen
  call(spot) {
    if (this.state === 'following' || this.phase === 'up') return;
    let x = spot.x + Phaser.Math.Between(-22, 22);
    let y = spot.y + Phaser.Math.Between(-9, 9);
    if (!this.inWater(x, y)) ({ x, y } = spot);
    this.callSpot = { x, y };
    this.phase = 'called';
    this.phaseTime = CALL_TIMEOUT;
  }

  surface(time) {
    this.phase = 'up';
    this.phaseTime = time;
    this.faceX = Math.random() < 0.5 ? -1 : 1;
    this.faceY = Math.random() < 0.75 ? 1 : -1; // meistens mit dem Maul zu uns
    this.splash();
  }

  sink() {
    this.splash();
    this.phase = 'swim';
    this.target = null;
    this.phaseTime = this.state === 'penned' ? Phaser.Math.FloatBetween(...POND_UP_EVERY) : 0;
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'up';
  }

  canDespawn() {
    return this.phase === 'swim';
  }

  // auf dieses Ziel zuschwimmen; true, wenn es angekommen ist
  swimTo(p, speed, dt) {
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = speed * dt;
    if (d <= step) {
      this.x = p.x;
      this.y = p.y;
      return true;
    }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    if (Math.abs(dx) > d * 0.2) this.faceX = Math.sign(dx);
    return false;
  }

  updateFree(dt) {
    this.phaseTime -= dt;
    switch (this.phase) {
      case 'up':
        if (this.phaseTime <= 0) this.sink();
        return false;
      case 'called':
        if (this.swimTo(this.callSpot, CALL_SPEED, dt)) this.surface(Phaser.Math.FloatBetween(...SNAP_TIME));
        else if (this.phaseTime <= 0) this.sink();
        return false;
      default:
        // im Gehege ab und zu von selbst auftauchen
        if (this.state === 'penned' && this.phaseTime <= 0) {
          this.surface(Phaser.Math.FloatBetween(...POND_UP_TIME));
          return false;
        }
        if (!this.target) this.target = this.pickTarget();
        if (this.target && this.swimTo(this.target, SWIM_SPEED, dt)) this.target = null;
        return false;
    }
  }

  // Der Beutel ist angekommen, wenn er nah genug an einem Teich in einem Gehege für Koi ist
  arrivedHome() {
    const home = FISHPOND_TILES.find(({ tx, ty }) => {
      const e = enclosureAt(tx, ty);
      if (!e || !accepts(e, this.species)) return false;
      const p = tileToWorld(tx, ty);
      return Math.hypot(this.x - p.x, (this.y - p.y) * 2) < HOME_DIST;
    });
    if (home) this.enclosure = enclosureAt(home.tx, home.ty);
    return !!home;
  }

  enterPen() {
    const tiles = FISHPOND_TILES.filter(({ tx, ty }) => enclosureAt(tx, ty) === this.enclosure);
    const t = Phaser.Utils.Array.GetRandom(tiles);
    const p = tileToWorld(t.tx, t.ty);
    this.x = p.x;
    this.y = p.y;
    this.useWaterLook();
    Animal.prototype.enterPen.call(this);
    this.surface(POND_UP_TIME[1]); // zur Begrüßung einmal auftauchen
  }

  catch() {
    super.catch(); // wird zum Beutel
    this.phase = null;
    this.blob.setVisible(false);
    this.scene.showToast(`Ein ${KOI_VARIANTS[this.variant].name}!`);
  }

  restore(state) {
    super.restore(state);
    if (state !== 'following') {
      this.useWaterLook();
      this.phase = 'swim';
      this.phaseTime = state === 'penned' ? Phaser.Math.FloatBetween(...POND_UP_EVERY) : 0;
    }
  }

  destroy() {
    this.blob.destroy();
    super.destroy();
  }

  render(moving) {
    if (this.state === 'following') {
      this.blob.setVisible(false);
      Animal.prototype.render.call(this, moving);
      return;
    }
    const up = this.phase === 'up';
    // unter Wasser: nur der bunte Schatten, leicht schwankend
    const wobble = Math.sin(this.scene.time.now / 400 + this.x) * 1.5;
    this.blob.setVisible(!up).setPosition(this.x, this.y + wobble * 0.3);
    this.blob.setScale(1 + Math.sin(this.scene.time.now / 300 + this.y) * 0.06, 1);
    this.sprite.setVisible(up);
    if (!up) return;
    // oben: schnappt mit offenem Maul und schaukelt auf dem Wasser
    this.sprite.setFrame(
      this.faceY > 0 ? (this.faceX < 0 ? FRAMES.downLeft : FRAMES.downRight) : this.faceX > 0 ? FRAMES.upRight : FRAMES.upLeft,
    );
    const snap = Math.sin(this.scene.time.now / 90) * 0.04;
    this.sprite.setScale(0.5, 0.5 * (1 + snap));
    this.sprite.setPosition(this.x, this.y + Math.sin(this.scene.time.now / 250 + this.x));
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
  }
}
