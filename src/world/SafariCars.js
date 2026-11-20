// Besucherautos in der Safari (Tierpark, siehe docs/plan-safari.md und safariCars in levels.js): Sie kommen hinten durch die
// Einfahrt, fahren die Piste langsam ab, halten an jeder Haltebucht eine Weile und verlassen die Safari vorne rechts.
// Das Bild ist das Safariauto (Sprites/Safariauto.webp, freigestellt mit tools/safari-jeep-cut.py) in zwei Ansichten:
// von vorne fährt es ungespiegelt nach unten links (ty wächst), gespiegelt nach unten rechts (tx wächst); von hinten
// ungespiegelt nach oben rechts (ty fällt), gespiegelt nach oben links (tx fällt).
// Steht ein Tier vor dem Auto, wartet es (höchstens MAX_WAIT, dann fährt es vorsichtig weiter). Henrik hält kein Auto
// auf und läuft einfach hindurch. Die Autos öffnen die Tore wie Henrik (walkers, siehe updateGate in GardenScene).
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';

const SPEED = 34; // Pixel pro Sekunde: gemütliches Schritttempo
const EVERY = [12, 28]; // so oft kommt ein neues Auto (Sekunden) ...
const MAX_CARS = 2; // ... höchstens so viele zugleich
const FIRST = [2, 6]; // das erste kommt bald nach dem Ankommen
const STOP_TIME = [3, 6]; // so lange hält es an einer Haltebucht
const FRONT = 'safari_jeep_front';
const BACK = 'safari_jeep_back';
const SCALE = 0.48; // Größe (das Bild ist 200 Pixel breit)
const ORIGIN_Y = 0.82; // Mitte der Grundfläche im Bild (nicht die Unterkante der Räder): so fährt das Auto mittig auf der Piste
const LOOK_AHEAD = 40; // so weit vor dem Auto schaut es nach Tieren ...
const BLOCK_R = 24; // ... in diesem Umkreis (y doppelt gezählt, wie Kacheln)
const MAX_WAIT = 6; // so lange wartet es höchstens auf ein Tier
const GAP = 150; // Abstand zum Auto davor
const FADE = 40; // auf so vielen Pixeln an Ein- und Ausfahrt ein- bzw. ausblenden
const SHADOW_ALPHA = 0.43; // wie beim Auto zur Schnellreise
const TINTS = [0xffffff, 0xcfe3ff, 0xffe2c4]; // leichte Farbtöne, damit nicht lauter gleiche Autos fahren

export default class SafariCars {
  constructor(scene, def) {
    this.scene = scene;
    this.makeTexture();
    // Fahrspur als Strecke in Welt-Pixeln; je Abschnitt, ob er nach rechts unten führt (dann gespiegelt)
    this.points = def.route.map(({ tx, ty }) => tileToWorld(tx, ty));
    // je Abschnitt: Ansicht und Spiegelung nach der Fahrtrichtung
    this.looks = def.route.slice(1).map((p, i) => {
      const q = def.route[i];
      if (p.ty > q.ty) return { key: FRONT, flip: false };
      if (p.tx > q.tx) return { key: FRONT, flip: true };
      if (p.ty < q.ty) return { key: BACK, flip: false };
      return { key: BACK, flip: true };
    });
    this.lengths = [0];
    for (let i = 1; i < this.points.length; i++) this.lengths.push(this.lengths[i - 1] + Phaser.Math.Distance.BetweenPoints(this.points[i - 1], this.points[i]));
    this.total = this.lengths[this.lengths.length - 1];
    this.stops = def.stops.map(({ tx, ty }) => this.project(tileToWorld(tx, ty))).sort((a, b) => a - b);
    this.cars = [];
    this.timer = Phaser.Math.FloatBetween(...FIRST);
  }

  // das Safariauto ohne Anhänger als eigenes Bild (in voller Auflösung) samt Schatten
  // Schatten der beiden Ansichten (aus dem Umriss, wie beim Auto zur Schnellreise)
  makeTexture() {
    const scene = this.scene;
    this.shadows = {};
    for (const key of [FRONT, BACK]) this.shadows[key] = scene.carShadow(key, '__BASE');
    const h = scene.textures.getFrame(FRONT, '__BASE').cutHeight;
    this.shadowOriginY = (h * ORIGIN_Y) / scene.textures.getFrame(this.shadows[FRONT], '__BASE').cutHeight;
  }

  // Strecke bis zum Punkt der Fahrspur, der p am nächsten liegt
  project(p) {
    let best = { d: Infinity, s: 0 };
    for (let i = 1; i < this.points.length; i++) {
      const a = this.points[i - 1];
      const b = this.points[i];
      const len = this.lengths[i] - this.lengths[i - 1];
      const t = Phaser.Math.Clamp(((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (len * len), 0, 1);
      const d = Math.hypot(a.x + (b.x - a.x) * t - p.x, a.y + (b.y - a.y) * t - p.y);
      if (d < best.d) best = { d, s: this.lengths[i - 1] + len * t };
    }
    return best.s;
  }

  // Punkt auf der Fahrspur nach s Pixeln und ob das Auto dort gespiegelt ist
  at(s) {
    let i = 1;
    while (i < this.lengths.length - 1 && this.lengths[i] < s) i++;
    const a = this.points[i - 1];
    const b = this.points[i];
    const t = Phaser.Math.Clamp((s - this.lengths[i - 1]) / (this.lengths[i] - this.lengths[i - 1]), 0, 1);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ...this.looks[i - 1] };
  }

  spawn() {
    const scene = this.scene;
    const scale = SCALE;
    const tint = Phaser.Utils.Array.GetRandom(TINTS);
    const shadow = scene.add.image(0, 0, this.shadows[FRONT]).setOrigin(0.5, this.shadowOriginY).setScale(scale).setAlpha(0);
    const sprite = scene.add.image(0, 0, FRONT).setOrigin(0.5, ORIGIN_Y).setScale(scale).setTint(tint).setAlpha(0);
    this.cars.push({ s: 0, sprite, shadow, stop: 0, pause: 0, wait: 0 });
  }

  // Steht ein Tier (oder ein anderes Auto) direkt vor dem Auto?
  blocked(car, p) {
    const dir = this.at(Math.min(this.total, car.s + LOOK_AHEAD));
    if (this.cars.some((c) => c !== car && c.s > car.s && c.s - car.s < GAP)) return 'car';
    const animals = this.scene.animals ?? [];
    return animals.some((a) => a.state !== 'following' && a.sprite?.visible && Math.hypot(a.x - dir.x, (a.y - dir.y) * 2) < BLOCK_R && Math.hypot(a.x - p.x, (a.y - p.y) * 2) > 4) ? 'animal' : null;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = Phaser.Math.FloatBetween(...EVERY);
      const last = this.cars[this.cars.length - 1];
      if (this.cars.length < MAX_CARS && (!last || last.s > GAP * 1.5)) this.spawn();
    }
    for (const car of [...this.cars]) {
      const p = this.at(car.s);
      if (car.pause > 0) car.pause -= dt;
      else {
        const why = this.blocked(car, p);
        if (why === 'animal') car.wait += dt;
        if (!why || (why === 'animal' && car.wait > MAX_WAIT)) {
          car.s += SPEED * dt;
          if (!why) car.wait = 0;
        }
        // Haltebucht: eine Weile stehen bleiben (die Besucher schauen)
        if (car.stop < this.stops.length && car.s >= this.stops[car.stop]) {
          car.stop++;
          car.pause = Phaser.Math.FloatBetween(...STOP_TIME);
        }
      }
      if (car.s >= this.total) {
        car.sprite.destroy();
        car.shadow.destroy();
        this.cars.splice(this.cars.indexOf(car), 1);
        continue;
      }
      const q = this.at(car.s);
      const alpha = Math.min(1, car.s / FADE, (this.total - car.s) / FADE);
      if (car.sprite.texture.key !== q.key) {
        car.sprite.setTexture(q.key);
        car.shadow.setTexture(this.shadows[q.key]);
      }
      car.sprite.setPosition(q.x, q.y).setFlipX(q.flip).setDepth(q.y).setAlpha(alpha);
      car.shadow.setPosition(q.x, q.y).setFlipX(q.flip).setDepth(q.y - 1).setAlpha(alpha * SHADOW_ALPHA);
      car.x = q.x;
      car.y = q.y;
    }
  }

  // Punkte, an denen die Autos gerade sind (für die Tore, die sich vor ihnen öffnen)
  walkers() {
    return this.cars.filter((c) => c.x !== undefined).map((c) => ({ x: c.x, y: c.y }));
  }
}
