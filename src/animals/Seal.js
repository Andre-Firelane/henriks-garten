// Robbe (Eiswelt): schwimmt am Ufer entlang, nur der Kopf schaut aus dem Wasser (nachts auch in den Eislöchern).
// Kommt Henrik näher, taucht sie weiter auf, schaut ihn erwartungsvoll an und wünscht sich etwas: einen Fisch oder einen
// Ball (Blase über dem Kopf) – und bleibt dabei, auch wenn man weggeht, um es zu holen. Wirft man ihr genau das zu (TreatTool), schnappt sie es und folgt Henrik; mit dem anderen
// schüttelt sie den Kopf. Kommt man ihr zu nah, taucht sie ab und ein Stück weiter wieder auf.
// Bilder: im Wasser seal.png mit Wasserring unten (beim Schwimmen schaut nur der obere Teil des Kopfs heraus: tiefer
// gesetzt und an der Wasserlinie abgeschnitten wie beim Nilpferd), aufgetaucht wippt sie (seal_swim_idle); an Land
// liegt sie (seal_lie) bzw. robbt (seal_walk, siehe kind.anims).
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { LEVEL, MAP_W, MAP_H, charAt, isBlocked } from '../world/map.js';
import { game } from '../state.js';

const FEET_Y = 84; // Fußlinie im Bild (Unterkante des Wasserrings) ...
const WATER_Y = 76; // ... Wasserlinie (darunter ist nur noch der Ring) ...
const TOP = 4; // ... und Oberkante des Kopfs
const LOW = 0.4; // beim Schwimmen schaut so viel von ihr aus dem Wasser (der Kopf bis knapp unter die Schnauze)
const RISE_SPEED = 2.2; // so schnell taucht sie auf bzw. ein
const NOTICE = 170; // so nah (Kachel-Proportionen) heran: sie taucht auf und wünscht sich etwas ...
const LEAVE = 230; // ... so weit weg: sie schwimmt weiter
const TOO_CLOSE = 42; // so nah: sie taucht ab und woanders wieder auf
const AWAY = [2.5, 4]; // so lange (Sekunden) bleibt sie dann unter Wasser
const SWIM_RANGE = 5; // so viele Kacheln weit schwimmt sie am Ufer entlang
const SHAKE = 0.7; // so lange schüttelt sie den Kopf
const WISHES = ['herring', 'sealball'];
const WATER_ORIGIN_Y = FEET_Y / 88; // Fußlinie in den Bildern im Wasser (seal, seal_swim_idle)
const PEEK_ANIM = 'seal_swim_idle';
const LAND_HEAD = { x: 16, y: 24 }; // an Land: so weit vorne und über den Füßen liegt ihre Nase (Ball nach dem Fang)

// Wasser direkt am Ufer (eine begehbare Kachel daneben): dort schwimmt sie. Einmal je Karte berechnet
let shoreFor = null;
let shore = [];
function shoreWater() {
  if (shoreFor !== LEVEL) {
    shoreFor = LEVEL;
    shore = [];
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        if (charAt(tx, ty) !== '~') continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !isBlocked(tx + dx, ty + dy))) shore.push({ tx, ty });
      }
    }
  }
  return shore;
}

export default class Seal extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'seal');
    this.rise = LOW;
    this.mode = 'swim'; // 'swim', 'peek' (aufgetaucht, wünscht sich etwas), 'under' (abgetaucht)
    this.wish = Phaser.Utils.Array.GetRandom(WISHES); // was sie sich wünscht: bleibt, bis man es ihr zuwirft
    this.shake = 0;
    this.time = Math.random() * 10;
    this.target = null;
    this.bubble = scene.add.container(0, 0).setVisible(false);
    const g = scene.add.graphics();
    g.fillStyle(0xfff8e6, 0.95).fillRoundedRect(-13, -13, 26, 22, 8).lineStyle(1.5, 0x5a4a3a, 0.9).strokeRoundedRect(-13, -13, 26, 22, 8);
    g.fillStyle(0xfff8e6, 0.95).fillTriangle(-4, 8, 4, 8, 0, 14);
    this.bubbleIcon = scene.add.image(0, -2, 'herring').setScale(0.3);
    this.bubble.add([g, this.bubbleIcon]);
  }

  static shoreTiles() {
    return shoreWater();
  }

  // wild schwimmt sie nur im Wasser
  blocked(x, y) {
    if (this.state !== 'wild') return super.blocked(x, y);
    const { tx, ty } = worldToTile(x, y);
    return charAt(tx, ty) !== '~';
  }

  // fangen nur mit dem, was sie sich gerade wünscht, und nur aufgetaucht
  canBeCaughtWith(tool) {
    return this.state === 'wild' && this.mode === 'peek' && this.rise > 0.8 && tool === this.wish;
  }

  // das andere bekommen: Kopf schütteln (der Wunsch bleibt)
  refuse(tool) {
    if (this.state === 'wild' && this.mode === 'peek' && tool !== this.wish) this.shake = SHAKE;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    this.time += dt;
    const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
    if (this.mode === 'under') {
      this.rise = Math.max(0, this.rise - dt * RISE_SPEED * 2);
      this.awayIn -= dt;
      if (this.awayIn <= 0) this.resurface(player);
      return false;
    }
    if (d < TOO_CLOSE) {
      this.mode = 'under';
      this.awayIn = Phaser.Math.FloatBetween(...AWAY);
      this.splash();
      return false;
    }
    if (this.mode === 'swim' && d < NOTICE) {
      this.mode = 'peek';
      if (!game.seenSpecies.includes('seal')) {
        game.seenSpecies.push('seal'); // ab jetzt steht der Tipp im Tierbuch
        this.scene.markNew?.('seen:seal');
      }
    } else if (this.mode === 'peek' && d > LEAVE) {
      this.mode = 'swim'; // der Wunsch bleibt: kommt Henrik mit dem Richtigen zurück, will sie noch dasselbe
    }
    if (this.mode === 'peek') {
      // schaut Henrik erwartungsvoll an (immer mit dem Gesicht, nur nach links oder rechts zu ihm hin)
      this.rise = Math.min(1, this.rise + dt * RISE_SPEED);
      if (Math.abs(player.x - this.x) > 4) this.faceX = Math.sign(player.x - this.x);
      this.faceY = 1;
      return false;
    }
    this.rise = Math.max(LOW, this.rise - dt * RISE_SPEED);
    return this.swim(dt);
  }

  // langsam am Ufer entlang zu einem anderen Uferplatz in der Nähe
  swim(dt) {
    if (!this.target || Math.hypot(this.target.x - this.x, this.target.y - this.y) < 3 || this.wanderTime <= 0) {
      const { tx, ty } = worldToTile(this.x, this.y);
      const near = shoreWater().filter((t) => Math.abs(t.tx - tx) <= SWIM_RANGE && Math.abs(t.ty - ty) <= SWIM_RANGE);
      const t = Phaser.Utils.Array.GetRandom(near);
      this.target = t ? tileToWorld(t.tx, t.ty) : null;
      this.wanderTime = Phaser.Math.FloatBetween(4, 9);
    }
    this.wanderTime -= dt;
    if (!this.target) return false;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const step = this.kind.speed * dt;
    if (!this.move((dx / len) * step, (dy / len) * step)) this.target = null;
    return true;
  }

  // nach dem Abtauchen ein Stück weiter wieder auftauchen (nicht direkt neben Henrik)
  resurface(player) {
    const { tx, ty } = worldToTile(this.x, this.y);
    const spots = shoreWater().filter((t) => {
      const p = tileToWorld(t.tx, t.ty);
      return Math.abs(t.tx - tx) <= SWIM_RANGE + 2 && Math.abs(t.ty - ty) <= SWIM_RANGE + 2 && Math.hypot(p.x - player.x, (p.y - player.y) * 2) > NOTICE * 0.6;
    });
    const t = Phaser.Utils.Array.GetRandom(spots);
    if (t) Object.assign(this, tileToWorld(t.tx, t.ty));
    this.mode = 'swim';
    this.target = null;
  }

  // gefangen: schnappt den Fisch bzw. balanciert den Ball kurz auf der Nase, dann folgt sie
  catch() {
    const wish = this.wish;
    super.catch();
    this.mode = 'swim';
    this.wish = null;
    this.rise = 1;
    if (wish === 'sealball') {
      const ball = this.scene.add.image(this.x, this.y, 'ball').setScale(0.5);
      this.noseBall = { img: ball, t: 0 };
    }
  }

  // im Wasser: Standbild (Blickrichtung wie sonst) bzw. aufgetaucht die Wipp-Animation (immer von vorne)
  waterLook() {
    const s = this.sprite;
    const peek = this.mode === 'peek' && this.scene.anims.exists(PEEK_ANIM);
    if (peek) {
      if (s.anims.currentAnim?.key !== PEEK_ANIM || !s.anims.isPlaying) s.play(PEEK_ANIM);
      s.setFlipX(this.faceX < 0);
    } else {
      s.stop();
      const fr = this.kind.frames;
      s.setFlipX(false).setTexture('seal', this.faceY > 0 ? (this.faceX < 0 ? fr.downLeft : fr.downRight) : this.faceX > 0 ? fr.upRight : fr.upLeft);
    }
    s.setOrigin(0.5, WATER_ORIGIN_Y);
    this.placeSprite(false);
  }

  render(moving) {
    const wild = this.state === 'wild';
    if (wild) this.waterLook();
    else {
      // an Land: von den Wasserbildern zurück auf die liegende Robbe (robben übernimmt Animal.render)
      const key = this.sprite.texture.key;
      if (key === 'seal' || key === PEEK_ANIM) this.sprite.stop().setFlipX(false).setTexture(this.kind.texture, 0).setOrigin(0.5, this.kind.originY);
      if (this.sprite.isCropped) this.sprite.setCrop();
      super.render(moving);
    }
    // eintauchen: tiefer setzen und unter der Wasserlinie abschneiden (aufgetaucht mit dem gemalten Wasserring)
    const sink = wild ? (1 - this.rise) * (WATER_Y - TOP) : 0;
    const bob = wild ? Math.sin(this.time * 2.4) * 0.8 : 0;
    this.sprite.y += sink * 0.5 + bob;
    const f = this.sprite.frame;
    if (wild && sink > 0.5) this.sprite.setCrop(0, 0, f.width, Math.max(0, WATER_Y - sink));
    else if (wild && this.sprite.isCropped) this.sprite.setCrop();
    this.sprite.setVisible(!wild || this.rise > 0.02);
    this.shadow.setVisible(!wild);
    // Kopfschütteln
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - this.scene.game.loop.delta / 1000);
      this.sprite.setAngle(Math.sin(this.shake * 40) * 9);
    }
    // Wunsch-Blase über dem Kopf (an Land liegt sie: Kopf niedriger und vorne)
    const top = wild ? this.sprite.y + (TOP - FEET_Y) * 0.5 : this.sprite.y - LAND_HEAD.y;
    const show = wild && this.mode === 'peek' && this.rise > 0.8 && !!this.wish;
    this.bubble.setVisible(show);
    if (show) {
      this.bubbleIcon.setTexture(this.wish === 'herring' ? 'herring' : 'ball').setScale(this.wish === 'herring' ? 0.3 : 0.5);
      this.bubble.setPosition(this.sprite.x, top - 14 + Math.sin(this.time * 3) * 1.5).setDepth(this.sprite.depth + 1000);
    }
    // Ball auf der Nase (nach dem Fang), hüpft ein paarmal und verschwindet
    const b = this.noseBall;
    if (b) {
      b.t += this.scene.game.loop.delta / 1000;
      b.img.setPosition(this.sprite.x + this.faceX * (wild ? 6 : LAND_HEAD.x), top - 4 - Math.abs(Math.sin(b.t * 7)) * 6).setDepth(this.sprite.depth + 1).setAngle(b.t * 200);
      if (b.t > 1.8) {
        b.img.destroy();
        this.noseBall = null;
      }
    }
  }

  destroy() {
    super.destroy();
    this.bubble.destroy();
    this.noseBall?.img.destroy();
  }
}
