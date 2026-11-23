// Nilpferd (Savanne bei Starkregen): treibt im Wasserloch, von ihm sieht man nur die obere Kopfhälfte ("hippo_water").
// Ab und zu klettert es ans Ufer und grast dort eine Weile. Kommt man ihm an Land zu nah, trottet es zurück ins Wasser.
// Fangen nur an Land und mit etwas Abstand zum Wasser, mit dem Lasso. Im Nilpferdbecken wechselt es wie das Krokodil
// zwischen Teich und Ufer (siehe Crocodile.js).
import Phaser from 'phaser';
import Animal from './Animal.js';
import Crocodile from './Crocodile.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { KOI_WATER, SHORE_TILES, charAt } from '../world/map.js';
import { drawWaterFoam, waterEdge } from './waterFoam.js';

const WATER_ORIGIN_Y = 40 / 44; // Wasserlinie im Bild "hippo_water"
const HIPPO_SCALE = 0.65; // etwas größer als die anderen Tiere (0.5), an Land und im Wasser
const PYGMY_SCALE = 0.8; // das Zwergflusspferd (Skin hippo2) ist um so viel kleiner
const WATER_TIME = [10, 18]; // so lange treibt es im Wasser ...
const LAND_TIME = [14, 22]; // ... und so lange grast es am Ufer
const LAND_MIN = 5; // so lange bleibt es mindestens an Land, auch wenn man ihm nahe kommt (Zeit zum Fangen)
const DRIFT_SPEED = 6; // langsames Treiben
const SHORE_RANGE = 220; // so weit sucht es sich ein Ufer zum Herausklettern ...
const SHORE_PICK = 24; // ... und nimmt eins der nächsten (höchstens so viel weiter weg als das allernächste)
const SHORE_SWIM = 1.5; // zum Ufer schwimmt es etwas schneller als beim Treiben
const SHORE_TIMEOUT = 12; // kommt es nicht ans Ufer heran, klettert es trotzdem hinaus
const GRAZE_RANGE = 50; // so weit grast es vom Ufer weg
const CATCH_GAP = 24; // so weit muss es vom Wasser weg sein, damit man es fangen kann
const BACK_TIMEOUT = 8; // kommt es nicht zum Ufer zurück, springt es trotzdem ins Wasser
const CALL_EVERY = [15, 30]; // so oft grunzt es (Sekunden) ...
const CALL_VOLUME = 0.45; // ... ganz nah so laut
const FOAM_STEP = 5; // Schaumkante: etwa alle so viele Pixel (im Bild) ein Schaumbläschen ...
const FOAM_SIZE = 0.7; // ... so groß (der Kopf ist kleiner als der Elch)

export default class Hippo extends Crocodile {
  // species: Tiere, die sich genauso verhalten (Tapir, siehe Tapir.js); die Zeiten und die Größe kommen von times()
  constructor(scene, allAnimals, species = 'hippo') {
    super(scene, allAnimals, species);
    this.mode = 'water';
    this.modeTime = Phaser.Math.FloatBetween(2, this.times().water[1]);
    this.unplaced = true; // erst beim ersten Bild ins Wasserloch (die Szene setzt die Position nach dem Erzeugen)
  }

  // irgendwo im wilden Wasserloch
  placeInWater() {
    const t = Phaser.Utils.Array.GetRandom(KOI_WATER);
    if (!t) return;
    const p = tileToWorld(t.tx, t.ty);
    this.x = p.x;
    this.y = p.y;
    this.drift = null;
  }

  // so lange treibt es im Wasser bzw. grast an Land, so groß ist es (Unterarten ändern das)
  times() {
    return { water: WATER_TIME, land: LAND_TIME, landMin: LAND_MIN, scale: HIPPO_SCALE * (this.skin === 'hippo2' ? PYGMY_SCALE : 1) };
  }

  inWater() {
    return (this.state === 'wild' && this.mode === 'water') || (this.state === 'penned' && !this.onLand);
  }

  canDespawn() {
    return this.mode === 'water';
  }

  canBeCaughtNow() {
    if (this.state !== 'wild' || this.mode === 'water') return false;
    const w = this.shore?.water;
    return !w || Math.hypot(this.x - w.x, (this.y - w.y) * 2) > CATCH_GAP;
  }

  blocked(x, y) {
    if (this.state === 'wild') {
      if (this.mode === 'water') {
        const { tx, ty } = worldToTile(x, y);
        return charAt(tx, ty) !== '~';
      }
      return Animal.prototype.blocked.call(this, x, y);
    }
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.unplaced) {
      this.unplaced = false;
      this.placeInWater();
    }
    this.modeTime -= dt;
    // ab und zu ein Grunzen aus dem Wasserloch (je näher, desto lauter)
    this.callIn = (this.callIn ?? Phaser.Math.FloatBetween(4, CALL_EVERY[1])) - dt;
    if (this.callIn <= 0) {
      this.callIn = Phaser.Math.FloatBetween(...CALL_EVERY);
      const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
      const call = `animal_${this.species}`; // Grunzen des Nilpferds bzw. Fiepen des Tapirs
      if (d < 600 && this.scene.cache.audio.exists(call)) this.scene.sound.play(call, { volume: CALL_VOLUME * (1 - d / 600), detune: Phaser.Math.Between(-150, 150) });
    }
    if (this.mode === 'water') {
      if (this.modeTime <= 0) {
        // erst zum nächsten Ufer schwimmen, dann dort herausklettern (nicht irgendwo im Wasserloch auftauchen)
        this.target ??= this.wildShore();
        if (!this.target) {
          this.modeTime = Phaser.Math.FloatBetween(...this.times().water);
        } else {
          const w = this.target.water;
          const tx = w.x - this.x;
          const ty = w.y - this.y;
          const td = Math.hypot(tx, ty);
          if (td < 4 || this.modeTime < -SHORE_TIMEOUT || !this.move((tx / td) * DRIFT_SPEED * SHORE_SWIM * dt, (ty / td) * DRIFT_SPEED * SHORE_SWIM * dt)) {
            this.climbOut(this.target);
          }
          return false;
        }
      }
      // langsam durchs Wasser treiben
      if (!this.drift || Math.hypot(this.drift.x - this.x, this.drift.y - this.y) < 3) {
        const { tx, ty } = worldToTile(this.x, this.y);
        const near = KOI_WATER.filter((t) => Math.abs(t.tx - tx) <= 2 && Math.abs(t.ty - ty) <= 2);
        const t = Phaser.Utils.Array.GetRandom(near);
        this.drift = t ? tileToWorld(t.tx, t.ty) : { x: this.x, y: this.y };
      }
      const dx = this.drift.x - this.x;
      const dy = this.drift.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      if (!this.move((dx / d) * DRIFT_SPEED * dt, (dy / d) * DRIFT_SPEED * dt)) this.drift = null;
      return false;
    }
    if (this.mode === 'land') {
      this.landTime = (this.landTime ?? 0) + dt;
      if (this.modeTime <= 0 || (this.landTime >= this.times().landMin && this.shouldFlee(player))) this.mode = 'back';
      else return Animal.prototype.updateFree.call(this, dt, player); // grast am Ufer (an der Leine)
    }
    // zurück ins Wasser: zum Ufer trotten und hineinspringen
    const b = this.shore;
    const dx = b.land.x - this.x;
    const dy = b.land.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 4 || this.modeTime < -BACK_TIMEOUT) {
      this.x = b.water.x;
      this.y = b.water.y;
      this.mode = 'water';
      this.modeTime = Phaser.Math.FloatBetween(...this.times().water);
      this.leash = null;
      this.fleeing = false;
      this.useWaterLook();
      this.splash();
      return false;
    }
    const step = Math.min(d, (this.fleeing ? this.kind.fleeSpeed : this.kind.speed) * dt);
    return this.move((dx / d) * step, (dy / d) * step);
  }

  // wildes Wasserloch: eins der nächsten Ufer (falls eins in der Nähe ist); nicht nearestShore, das gilt im Becken (Crocodile.js)
  wildShore() {
    const dist = (s) => Math.hypot(s.water.x - this.x, s.water.y - this.y);
    const near = SHORE_TILES.map((s) => ({ land: tileToWorld(s.tx, s.ty), water: tileToWorld(s.water.tx, s.water.ty) })).filter((s) => dist(s) < SHORE_RANGE);
    if (!near.length) return null;
    const min = Math.min(...near.map(dist));
    return Phaser.Utils.Array.GetRandom(near.filter((s) => dist(s) <= min + SHORE_PICK));
  }

  // an diesem Ufer herausklettern
  climbOut(s) {
    this.target = null;
    this.splash();
    this.shore = s;
    this.x = s.land.x;
    this.y = s.land.y;
    this.mode = 'land';
    this.landTime = 0;
    this.modeTime = Phaser.Math.FloatBetween(...this.times().land);
    this.leash = { x: s.land.x, y: s.land.y, r: GRAZE_RANGE };
    this.faceX = Math.sign(s.land.x - s.water.x) || this.faceX;
    this.faceY = Math.sign(s.land.y - s.water.y) || this.faceY;
    this.useBagLook();
    this.pickWander();
  }

  catch() {
    this.mode = 'land';
    this.leash = null;
    super.catch();
  }

  restore(state) {
    super.restore(state);
    if (state === 'wild') {
      this.mode = 'water';
      this.target = null;
      this.unplaced = true;
      this.useWaterLook();
    } else {
      this.unplaced = false;
    }
  }

  // an Land (auch gefangen und im Gehege am Ufer): groß wie ein Nilpferd
  useBagLook() {
    super.useBagLook();
    this.sprite.setScale(this.baby ? 0.3 : this.times().scale);
  }

  // im Wasser: nur die obere Kopfhälfte (Zwergflusspferd: hippo2_water, umgefärbt mit tools/recolor.js)
  waterTexture() {
    return this.texSkin ? `${this.texSkin}_water` : `${this.species}_water`;
  }

  useWaterLook() {
    this.sprite.stop().setFlipX(false).setTexture(this.waterTexture(), 0).setOrigin(0.5, this.waterOriginY()).setScale(this.times().scale);
    this.shadow.setVisible(false);
  }

  // Wasserlinie im Wasser-Bild (Anteil der Bildhöhe); der Tapir hat ein höheres Bild (schräge Kante, siehe Tapir.js)
  waterOriginY() {
    return WATER_ORIGIN_Y;
  }

  // schaumige Kante, wo der Körper aus dem Wasser schaut (sonst wirkt der Bildrand abgehackt): helle, leicht wabernde
  // Bläschen entlang der schrägen Schnittkante (siehe waterFoam.js)
  drawFoam() {
    this.foam ??= this.scene.add.graphics();
    drawWaterFoam(this.foam, this.scene, this.sprite, waterEdge(this.scene, this.sprite, this.waterOriginY(), FOAM_STEP), { size: FOAM_SIZE });
  }

  destroy() {
    this.foam?.destroy();
    super.destroy();
  }

  render(moving) {
    if (!this.inWater()) {
      this.foam?.setVisible(false);
      if (this.sprite.texture.key === this.waterTexture()) this.useBagLook();
      // Größe auch an Land stimmig halten (z. B. Zwergflusspferd, schon an Land geladen); nicht während eines Tweens (Streicheln)
      else if (!this.baby && !this.scene.tweens.isTweening(this.sprite)) this.sprite.setScale(this.times().scale);
      Animal.prototype.render.call(this, moving);
      return;
    }
    if (this.sprite.texture.key !== this.waterTexture()) this.useWaterLook();
    const f = this.kind.frames;
    this.sprite.setFrame(this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft);
    const bob = Math.sin(this.scene.time.now / 400 + this.x) * 1;
    this.sprite.setVisible(true).setScale(this.times().scale).setAngle(0);
    this.sprite.setPosition(this.x, this.y + 4 + bob);
    this.sprite.setDepth(this.y);
    this.drawFoam();
  }
}
