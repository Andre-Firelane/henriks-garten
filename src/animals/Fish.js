// Fische: In den wilden Teichen steigen ab und zu Blasen auf, danach taucht ein Fisch kurz auf.
// Nur solange er oben ist, kann man ihn mit dem Kescher fangen; danach taucht er woanders wieder auf.
// Gefangen wird er zum Beutel und folgt dem Spieler. Am Fischteich wird er freigelassen und schwimmt dort;
// ab und zu taucht er ab, und bevor er wieder auftaucht, blubbert es wie draußen.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { FISH_SPOTS, FISHPOND_TILES, LEVEL, isFishpond, enclosureAt, accepts } from '../world/map.js';
import { footTiles } from '../world/collision.js';

// Bilder im Spritesheet "fish"
const FISH_FRAME = { peek: 0, right: 1, left: 2, jump: 3 };
const FISH_ORIGIN_Y = 60 / 64;
const WATER_SCALE = 0.38; // so groß im Wasser (Beutel und andere Tiere: 0.5)
const LUNGFISH_WATERLINE = 40; // Lungenfisch: bis zu dieser Höhe im Bild (von 64) schaut er aus dem Wasser

const HIDDEN_TIME = [2, 6]; // so lange ist nichts zu sehen
const BUBBLE_TIME = [1, 3]; // so lange blubbert es, bevor er auftaucht
const UP_TIME = [2, 4]; // so lange bleibt er oben
const PEEK_TIME = 0.25; // kurzes Auf- und Abtauchen
const HOME_DIST = 50; // so nah muss der Beutel an den Fischteich, damit der Fisch hineinspringt
const POND_SWIM = [4, 10]; // im Teich: so lange schwimmt er sichtbar ...
const POND_UNDER = [3, 6]; // ... und so lange ist er abgetaucht (die letzten BUBBLE_LEAD Sekunden blubbert es)
const BUBBLE_LEAD = 1.8;

// Phasen im wilden Teich: hidden → bubbling → rising → up → sinking → hidden
const SURFACED = ['rising', 'up', 'sinking'];

export default class Fish extends Animal {
  // allFish: alle Fische, damit nicht zwei an derselben Stelle auftauchen; species: für Wassertiere, die davon erben (Krokodil)
  constructor(scene, allFish, species = 'fish') {
    super(scene, 0, 0, species);
    this.allFish = allFish;
    this.useWaterLook();
    this.setPhase('hidden', Phaser.Math.FloatBetween(0.5, 4));
  }

  useWaterLook() {
    this.sprite.setTexture(this.waterTexture(), FISH_FRAME.right).setOrigin(0.5, FISH_ORIGIN_Y); // mit Skin: Wels, Lungenfisch
    this.shadow.setVisible(false);
  }

  // im Schlamm (Savanne in der Trockenzeit): der Lungenfisch schaut mit dem Kopf aus dem Schlamm ("lungfish_mud")
  inMud() {
    return this.state === 'wild' && LEVEL.fishIn === '≈';
  }

  waterTexture() {
    const base = this.baseTexture();
    return this.inMud() && this.scene.textures.exists(`${base}_mud`) ? `${base}_mud` : base;
  }

  useBagLook() {
    this.sprite.setCrop(); // im Beutel ganz (im Wasser ist der Lungenfisch unten abgeschnitten, siehe render)
    this.sprite.setTexture(this.kind.bagTexture, this.kind.frames.downRight).setOrigin(0.5, this.kind.originY).setScale(0.5);
    this.sprite.setVisible(true);
    this.shadow.setVisible(true);
  }

  setPhase(phase, time) {
    this.phase = phase;
    this.phaseTime = time;
  }

  // Eine freie Uferstelle aussuchen, an der gerade kein anderer Fisch ist
  pickSpot() {
    const used = this.allFish.filter((f) => f !== this && f.phase !== 'hidden').map((f) => f.spot);
    const free = FISH_SPOTS.filter((s) => !used.includes(s));
    this.spot = Phaser.Utils.Array.GetRandom(free.length ? free : FISH_SPOTS);
    const p = tileToWorld(this.spot.tx, this.spot.ty);
    this.x = p.x + Phaser.Math.Between(-8, 8);
    this.y = p.y + Phaser.Math.Between(-3, 3);
  }

  canDespawn() {
    return this.phase === 'hidden';
  }

  canBeCaughtNow() {
    return this.state === 'wild' && SURFACED.includes(this.phase);
  }

  updateFree(dt) {
    if (this.state === 'penned') {
      if (this.species === 'fish') this.updateDive(dt);
      return super.updateFree(dt, null); // schwimmt im Fischteich herum
    }
    this.phaseTime -= dt;
    if (this.phase === 'bubbling') {
      this.bubbleTimer -= dt;
      if (this.bubbleTimer <= 0) {
        this.spawnBubble();
        this.bubbleTimer = Phaser.Math.FloatBetween(0.2, 0.45);
      }
    }
    if (this.phaseTime > 0) return false;

    switch (this.phase) {
      case 'hidden':
        this.pickSpot();
        this.bubbleTimer = 0;
        this.setPhase('bubbling', Phaser.Math.FloatBetween(...BUBBLE_TIME));
        break;
      case 'bubbling':
        this.faceX = Math.random() < 0.5 ? -1 : 1;
        this.setPhase('rising', PEEK_TIME);
        this.splash();
        break;
      case 'rising':
        this.setPhase('up', Phaser.Math.FloatBetween(...UP_TIME));
        break;
      case 'up':
        this.setPhase('sinking', PEEK_TIME);
        break;
      default:
        this.splash();
        this.setPhase('hidden', Phaser.Math.FloatBetween(...HIDDEN_TIME));
    }
    return false;
  }

  // Im Teich: abtauchen, unter Wasser weiterschwimmen, kurz vor dem Auftauchen Blasen
  updateDive(dt) {
    this.dive ??= { under: false, time: Phaser.Math.FloatBetween(...POND_SWIM), bubble: 0 };
    const d = this.dive;
    d.time -= dt;
    if (d.under && d.time < BUBBLE_LEAD) {
      d.bubble -= dt;
      if (d.bubble <= 0) {
        this.spawnBubble();
        d.bubble = Phaser.Math.FloatBetween(0.2, 0.45);
      }
    }
    if (d.time > 0) return;
    this.splash();
    d.under = !d.under;
    d.time = Phaser.Math.FloatBetween(...(d.under ? POND_UNDER : POND_SWIM));
    d.bubble = 0;
  }

  // Der Beutel ist angekommen, wenn er nah genug an einem Teich ist, der diese Art aufnimmt
  arrivedHome() {
    const home = FISHPOND_TILES.find(({ tx, ty }) => {
      const e = enclosureAt(tx, ty);
      if (e && !accepts(e, this.species)) return false;
      const p = tileToWorld(tx, ty);
      return Math.hypot(this.x - p.x, (this.y - p.y) * 2) < HOME_DIST;
    });
    if (home) this.enclosure = enclosureAt(home.tx, home.ty);
    return !!home;
  }

  // Im Fischteich bleibt er im Wasser
  blocked(x, y) {
    if (this.state !== 'penned') return false;
    return !footTiles(x, y, this.kind.footW, 2).every(({ tx, ty }) => isFishpond(tx, ty));
  }

  catch() {
    super.catch();
    this.useBagLook();
  }

  restore(state) {
    super.restore(state);
    if (state === 'following') this.useBagLook();
  }

  enterPen() {
    // in den Teich des eigenen Geheges (falls es eins gibt), sonst irgendeinen
    const own = FISHPOND_TILES.filter(({ tx, ty }) => this.enclosure && enclosureAt(tx, ty) === this.enclosure);
    const t = Phaser.Utils.Array.GetRandom(own.length ? own : FISHPOND_TILES);
    const p = tileToWorld(t.tx, t.ty);
    this.x = p.x;
    this.y = p.y;
    this.useWaterLook();
    this.splash();
    super.enterPen();
  }

  render(moving) {
    if (this.state === 'following') {
      super.render(moving);
      return;
    }

    if (this.sprite.texture.key !== this.waterTexture()) this.useWaterLook(); // Skin erst nach dem Erzeugen gewürfelt
    let frame = this.faceX > 0 ? FISH_FRAME.right : FISH_FRAME.left;
    let visible = !(this.state === 'penned' && this.dive?.under);
    if (this.state === 'wild') {
      visible = SURFACED.includes(this.phase);
      if (this.phase !== 'up') frame = FISH_FRAME.peek;
    }
    // sanftes Schaukeln auf dem Wasser
    const bob = Math.sin(this.scene.time.now / 250 + this.x) * 1;
    this.sprite.setVisible(visible);
    this.sprite.setFrame(frame);
    if (this.species === 'fish') this.sprite.setScale(WATER_SCALE); // im Wasser etwas kleiner (passend zu den anderen Tieren)
    // der Lungenfisch ist von der Seite gemalt: im Wasser schaut nur sein oberer Teil heraus, der Rest ist unter der Wasserlinie
    if (this.skin === 'lungfish' && !this.inMud()) this.sprite.setCrop(0, 0, this.sprite.frame.width, LUNGFISH_WATERLINE);
    else if (this.sprite.isCropped) this.sprite.setCrop();
    // abgeschnitten: die Wasserlinie dorthin, wo sonst der Bauch ist
    const sink = this.sprite.isCropped ? (60 - LUNGFISH_WATERLINE) * this.sprite.scaleY : 0;
    this.sprite.setPosition(this.x, this.y + 4 + bob + sink);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
  }

  spawnBubble() {
    const x = this.x + Phaser.Math.Between(-10, 10);
    const y = this.y + Phaser.Math.Between(-3, 3);
    const bubble = this.scene.add
      .circle(x, y, Phaser.Math.FloatBetween(1.5, 3), this.inMud() ? 0x8a6a44 : 0xd8f2ff, 0.9) // im Schlamm braune Blasen
      .setStrokeStyle(1, this.inMud() ? 0x4a3420 : 0x2f7fbf)
      .setDepth(y + 1);
    this.scene.tweens.add({
      targets: bubble,
      y: y - Phaser.Math.Between(6, 12),
      scale: 1.5,
      alpha: 0,
      duration: Phaser.Math.Between(500, 800),
      ease: 'Quad.easeOut',
      onComplete: () => bubble.destroy(),
    });
  }

  // Kleiner Ring auf dem Wasser beim Auf- und Abtauchen
  splash() {
    const ring = this.scene.add
      .ellipse(this.x, this.y + 2, 16, 6)
      .setStrokeStyle(1.5, this.inMud() ? 0x5a4028 : 0xffffff, 0.9)
      .setDepth(this.y - 1);
    this.scene.tweens.add({
      targets: ring,
      scale: 2,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}
