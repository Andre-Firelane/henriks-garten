// Hyänen (Savanne in der Trockenzeit): ein Rudel versteckt sich irgendwo; man sieht es nicht, aber ab und zu hört man es
// kichern (dazu eine kurze Meldung, falls man ohne Ton spielt). Streut man dann Knochen aus (Werkzeug aus der Hütte),
// kommen 2 bis 3 Hyänen vom Kartenrand angelaufen und fressen. Solange sie fressen, fängt man sie mit dem Lasso; danach
// laufen sie wieder weg. Liegen die Knochen schon, wenn das Rudel kichert, kommt es gleich.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tr } from '../i18n.js';

const RUN_SPEED = 70; // so schnell kommen sie angelaufen und laufen wieder weg
const SCARED_SPEED = 115; // so schnell rennen sie davon, wenn eine aus dem Rudel gefangen wird (schneller als der Spieler)
const EAT_TIME = [9, 12]; // so lange fressen sie an den Knochen
const HEARD_TIME = 30000; // nach dem Kichern so lange (ms) in der Nähe: jetzt Knochen streuen
const COME_DELAY = 2500; // so lange nach dem Streuen, bis sie auftauchen (ms)
const PACK = [2, 3];
const COME_FROM = 420; // so weit von den Knochen tauchen sie auf
const LAUGH_VOLUME = 0.6;

export default class Hyena extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'hyena');
    this.mode = null; // 'come' → 'eat' → 'leave' (vom Rudel gesteuert); im Gehege null
  }

  // zum Knochenhaufen laufen; spot: Platz am Haufen, food: Mitte des Haufens (dorthin schaut sie)
  goEat(spot, food) {
    this.mode = 'come';
    this.spot = spot;
    this.food = food;
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.mode === 'eat';
  }

  canDespawn() {
    return false; // das Rudel schickt sie weg
  }

  blocked(x, y) {
    if (this.state === 'wild' && this.mode) return false; // laufen geradewegs (auch vom Kartenrand herein)
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild' || !this.mode) return super.updateFree(dt, player);
    if (this.mode === 'eat') {
      this.eatTime -= dt;
      if (this.eatTime <= 0) {
        this.setEating(false);
        this.mode = 'leave';
        this.spot = this.scene.heronExitPoint(this.x, this.y); // weg vom Haufen zum Kartenrand
      }
      return false;
    }
    const dx = this.spot.x - this.x;
    const dy = this.spot.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) {
      if (this.mode === 'leave') {
        this.scene.despawn(this);
        return false;
      }
      this.mode = 'eat';
      this.eatTime = Phaser.Math.FloatBetween(...EAT_TIME);
      this.faceX = Math.sign(this.food.x - this.x) || this.faceX;
      this.faceY = Math.sign(this.food.y - this.y) || 1;
      this.setEating(true);
      return false;
    }
    const step = Math.min(d, (this.scared ? SCARED_SPEED : RUN_SPEED) * dt);
    return this.move((dx / d) * step, (dy / d) * step);
  }

  // eine aus dem Rudel wurde gefangen: die anderen lassen die Knochen liegen und rennen davon (siehe catchAnimal)
  scatter() {
    if (this.state !== 'wild' || !this.mode) return;
    this.setEating(false);
    this.mode = 'leave';
    this.scared = true;
    this.spot = this.scene.heronExitPoint(this.x, this.y);
  }

  catch() {
    this.mode = null;
    this.setEating(false);
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.mode = null;
  }
}

// das versteckte Rudel in der Savanne (nur in der Trockenzeit, siehe updateHyenas in GardenScene)
export class HyenaPack {
  constructor(scene, cfg) {
    this.scene = scene;
    this.every = cfg.every;
    this.laughIn = Phaser.Math.FloatBetween(8, cfg.every[0]);
    this.heardUntil = 0;
    this.bones = null; // { x, y, img }
    this.pack = []; // Hyänen, die gerade kommen, fressen oder gehen
  }

  update(dt) {
    this.pack = this.pack.filter((h) => h.state === 'wild' && this.scene.animals.includes(h));
    // sind alle satt (weg oder gefangen), sind auch die Knochen aufgefressen
    if (this.called && !this.pack.length && this.bones && this.scene.time.now > this.calledAt + COME_DELAY + 1000) this.removeBones();
    if (this.called && !this.pack.length && this.scene.time.now > this.calledAt + COME_DELAY + 1000) this.called = false;
    this.laughIn -= dt;
    if (this.laughIn > 0 || this.called) return;
    this.laughIn = Phaser.Math.FloatBetween(...this.every);
    this.laugh();
  }

  laugh() {
    const scene = this.scene;
    if (scene.cache.audio.exists('hyena_laugh')) scene.sound.play('hyena_laugh', { volume: LAUGH_VOLUME, detune: Phaser.Math.Between(-100, 100) });
    this.heardUntil = Date.now() + HEARD_TIME;
    if (this.bones) {
      scene.showToast(tr('🦴 Die Hyänen kichern – sie haben die Knochen gerochen und kommen!', '🦴 The hyenas are giggling – they smelled the bones and are coming!'));
      this.call();
    } else {
      scene.showToast(tr('🦴 Hyänen kichern ganz in der Nähe! Streu schnell Knochen aus der Hütte – dann kommen sie.', '🦴 Hyenas are giggling nearby! Quickly scatter bones from the hut – then they will come.'));
    }
  }

  // Knochen an diese Stelle streuen (Werkzeug "Knochen"); kichern sie gerade, kommen sie
  dropBones(x, y) {
    if (this.called) return false;
    this.removeBones();
    const img = this.scene.add.image(x, y, 'bone_pile').setOrigin(0.5, 26 / 40).setScale(0.6).setDepth(y - 2);
    this.bones = { x, y, img };
    if (Date.now() < this.heardUntil) this.call();
    else this.scene.showToast(tr('🦴 Die Knochen liegen bereit. Hörst du die Hyänen kichern, kommen sie hierher.', '🦴 The bones are ready. When you hear the hyenas giggle, they will come here.'));
    return true;
  }

  call() {
    if (this.called || !this.bones) return;
    this.called = true;
    this.calledAt = this.scene.time.now;
    const b = this.bones;
    this.scene.time.delayedCall(COME_DELAY, () => {
      if (!this.bones || !this.scene.sys.isActive()) return;
      // aus einer zufälligen Richtung, knapp außerhalb des Blickfelds
      const dir = Math.random() * Math.PI * 2;
      const from = { x: b.x + Math.cos(dir) * COME_FROM, y: b.y + (Math.sin(dir) * COME_FROM) / 2 };
      const n = Phaser.Math.Between(...PACK);
      for (let i = 0; i < n; i++) {
        const h = this.scene.createAnimal('hyena', from.x + Phaser.Math.Between(-20, 20), from.y + Phaser.Math.Between(-10, 10));
        h.life = Infinity;
        h.herd = this; // ein Rudel: fängt man eine, rennen die anderen weg
        h.rollSkin('wild');
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
        h.goEat({ x: b.x + Math.cos(a) * 18, y: b.y + Math.sin(a) * 9 }, b);
        this.pack.push(h);
      }
    });
  }

  removeBones() {
    const img = this.bones?.img;
    this.bones = null;
    if (img) this.scene.tweens.add({ targets: img, alpha: 0, duration: 800, onComplete: () => img.destroy() });
  }

  destroy() {
    this.bones?.img.destroy();
    this.bones = null;
    for (const h of this.pack) if (h.state === 'wild') this.scene.despawn(h);
  }
}
