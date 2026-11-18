// Nilpferd (Savanne bei Starkregen): treibt im Wasserloch, von ihm sieht man nur die obere Kopfhälfte ("hippo_water").
// Ab und zu klettert es ans Ufer und grast dort eine Weile. Kommt man ihm an Land zu nah, trottet es zurück ins Wasser.
// Fangen nur an Land und mit etwas Abstand zum Wasser, mit dem Lasso. Im Nilpferdbecken wechselt es wie das Krokodil
// zwischen Teich und Ufer (siehe Crocodile.js).
import Phaser from 'phaser';
import Animal from './Animal.js';
import Crocodile from './Crocodile.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { KOI_WATER, SHORE_TILES, charAt } from '../world/map.js';

const WATER_ORIGIN_Y = 40 / 44; // Wasserlinie im Bild "hippo_water"
const HIPPO_SCALE = 0.65; // etwas größer als die anderen Tiere (0.5), an Land und im Wasser
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
const WATER_LINE = 40; // Zeile der Wasserlinie im Wasser-Bild (Bildhöhe 44)
const FOAM_STEP = 4; // Schaumkante: etwa alle so viele Pixel (im Bild) ein Schaumbläschen
const waterSpan = new Map(); // je Bild und Blickrichtung: wie breit der Körper an der Wasserlinie ist

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
    return { water: WATER_TIME, land: LAND_TIME, landMin: LAND_MIN, scale: HIPPO_SCALE };
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
    this.sprite.stop().setFlipX(false).setTexture(this.waterTexture(), 0).setOrigin(0.5, WATER_ORIGIN_Y).setScale(this.times().scale);
    this.shadow.setVisible(false);
  }

  // links und rechts, wo der Körper die Wasserlinie schneidet (in Bildpixeln von der Mitte aus); einmal je Bild ermittelt
  waterSpan() {
    const key = this.sprite.texture.key;
    const frame = this.sprite.frame.name;
    const id = `${key}:${frame}`;
    if (!waterSpan.has(id)) {
      const w = this.sprite.frame.width;
      const solid = (x) => (this.scene.textures.getPixelAlpha(x, WATER_LINE - 1, key, frame) ?? 0) > 64;
      let l = 0;
      while (l < w && !solid(l)) l++;
      let r = w - 1;
      while (r > l && !solid(r)) r--;
      waterSpan.set(id, l < r ? { l: l - w / 2, r: r + 1 - w / 2 } : { l: -12, r: 12 });
    }
    return waterSpan.get(id);
  }

  // schaumige Kante, wo der Körper aus dem Wasser schaut (sonst wirkt der gerade Bildrand abgehackt): eine Reihe
  // heller, leicht wabernder Bläschen über der Schnittkante
  drawFoam() {
    this.foam ??= this.scene.add.graphics();
    const g = this.foam.clear();
    const { l, r } = this.waterSpan();
    const t = this.scene.time.now / 1000;
    const w = r - l;
    // Bläschen ungleich groß und unregelmäßig verteilt, zu den Enden hin kleiner; dunklerer Schatten darunter, weiß darüber
    const n = Math.max(4, Math.round((w + 6) / FOAM_STEP));
    const bubbles = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const taper = 0.45 + 0.55 * Math.sin(Math.PI * u);
      const x = l - 3 + u * (w + 6) + Math.sin(i * 5.3) * 1.4 + Math.sin(t * 1.3 + i * 2.1) * 0.7;
      const y = -0.5 + Math.sin(i * 7.1) * 0.6 + Math.sin(t * 2.4 + i * 1.7) * 0.4;
      const rad = (1.2 + Math.abs(Math.sin(i * 3.7)) * 1.1 + Math.sin(t * 3.1 + i * 2.3) * 0.25) * taper;
      bubbles.push([x, y, rad]);
    }
    g.fillStyle(0x9fc4cc, 0.3);
    for (const [x, y, rad] of bubbles) g.fillEllipse(x, y + 0.9, rad * 2.4, rad * 1.6);
    g.fillStyle(0xffffff, 0.55);
    for (const [x, y, rad] of bubbles) g.fillEllipse(x, y, rad * 2.2, rad * 1.4);
    g.fillStyle(0xffffff, 0.6);
    for (const [x, y, rad] of bubbles) g.fillEllipse(x - rad * 0.3, y - rad * 0.25, rad * 1.1, rad * 0.7); // Glanz
    // ein paar lose Spritzer daneben, die langsam auf- und abtauchen
    for (let k = 0; k < 4; k++) {
      const a = Math.sin(t * 0.9 + k * 2.6);
      if (a < 0) continue;
      const side = k % 2 ? r + 3 + k : l - 3 - k;
      g.fillStyle(0xffffff, 0.45 * a).fillEllipse(side + Math.sin(t + k) * 1.5, 1.5 + (k % 3), 2.2, 1.4);
    }
    g.setPosition(this.sprite.x, this.sprite.y).setScale(this.sprite.scaleX).setDepth(this.sprite.depth + 0.01);
    g.setAlpha(this.sprite.alpha).setVisible(this.sprite.visible);
  }

  destroy() {
    this.foam?.destroy();
    super.destroy();
  }

  render(moving) {
    if (!this.inWater()) {
      this.foam?.setVisible(false);
      if (this.sprite.texture.key === this.waterTexture()) this.useBagLook();
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
