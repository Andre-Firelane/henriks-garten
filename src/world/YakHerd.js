// Yak-Herde auf der Hochebene im Bambuswald (Angaben: LEVEL.yaks in levels.js). Die Yaks grasen an der Leine um den
// Steinhaufen (Ƈ) herum; fangen lassen sie sich so nicht. Irgendwo auf der Hochebene liegt ein Salzstein (an einer der
// Stellen in salt, immer nur einer): mit der Aktionstaste hebt Henrik ihn auf (das getragene Werkzeug steckt er so lange
// ein) und legt ihn auf den Steinhaufen. Dann trottet genau ein Yak herbei und leckt daran, und Henrik hat die Bürste
// in der Hand: nach dreimal Bürsten kommt es mit (siehe Yak.js und GardenScene.brushYak). Bürstet er nicht, ist der
// Salzstein nach einer Weile aufgeleckt und das Yak trottet zurück. Danach liegt woanders ein neuer Salzstein.
// Wilde Yaks werden nicht gespeichert: beim Betreten grast die Herde wieder vollzählig.
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';
import { blockedAt } from './collision.js';
import { MAP_W, MAP_H, charAt, isBlocked } from './map.js';

const LEASH = 150; // so weit (Kachel-Proportionen, y doppelt) grasen sie um den Steinhaufen
const SALT_DIST = 30; // so nah muss man am Salzstein stehen, um ihn aufzuheben
const CAIRN_DIST = 60; // ... und so nah am Steinhaufen, um ihn abzulegen
const BRUSH_DIST = 44; // ... und so nah am leckenden Yak, um es zu bürsten
const SALT_ORIGIN = [16 / 32, 23 / 28];
const SALT_ON_CAIRN = 30; // so hoch über dem Fuß des Steinhaufens liegt der Salzstein
const SALT_BACK = 5; // so lange (Sekunden), bis nach dem Aufschlecken ein neuer Salzstein woanders liegt
const SALT_DROPPED = 3; // ... ein weggelegter (anderes Werkzeug genommen) wieder an seinem Platz
const CHECK_EVERY = 4; // so oft wird die Herde aufgefüllt

export default class YakHerd {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
    let cairn = null;
    for (let ty = 0; ty < MAP_H && !cairn; ty++) for (let tx = 0; tx < MAP_W; tx++) if (charAt(tx, ty) === 'Ƈ') cairn = { tx, ty };
    this.cairn = tileToWorld(cairn.tx, cairn.ty);
    this.leash = { x: this.cairn.x, y: this.cairn.y, r: LEASH };
    // Platz vor dem Steinhaufen, an dem das Yak leckt (face: Blickrichtung zum Steinhaufen)
    this.lickSpot = [{ x: -22, y: 11, face: 1 }, { x: 22, y: 11, face: -1 }, { x: 0, y: 16, face: 1 }]
      .map((o) => ({ x: this.cairn.x + o.x, y: this.cairn.y + o.y, face: o.face }))
      .find((p) => !blockedAt(p.x, p.y, 10, 4)) ?? { x: this.cairn.x, y: this.cairn.y + 16, face: 1 };
    this.spots = cfg.salt.filter(([tx, ty]) => charAt(tx, ty) === '.' && !isBlocked(tx, ty)).map(([tx, ty]) => tileToWorld(tx, ty));
    this.salt = null; // { x, y, img }: liegt irgendwo
    this.carried = null; // Henrik trägt ihn (die Stelle, an der er lag)
    this.onCairn = null; // Bild auf dem Steinhaufen
    this.licker = null; // das Yak, das gerade leckt bzw. herbeitrottet
    this.saltIn = 0;
    this.check = CHECK_EVERY;
    this.lastSpot = null;
    this.placeSalt();
  }

  wild() {
    return this.scene.animals.filter((a) => a.species === 'yak' && a.state === 'wild');
  }

  // Herde auffüllen; first: beim Betreten grasen sie schon um den Steinhaufen, später kommen neue sanft dazu
  fill(first = false) {
    const count = typeof this.cfg.count === 'function' ? this.cfg.count() : this.cfg.count; // (Expedition: so viele wie noch frei)
    for (let i = this.wild().length; i < count; i++) {
      const p = this.freePoint();
      if (!p) return;
      const a = this.scene.createAnimal('yak', p.x, p.y);
      a.rollSkin('wild'); // selten der gefleckte Yak
      a.leash = this.leash;
      if (!first) {
        a.sprite.setAlpha(0);
        this.scene.tweens.add({ targets: a.sprite, alpha: 1, duration: 800 });
      }
    }
  }

  // freier Platz in der Nähe des Steinhaufens
  freePoint() {
    for (let n = 0; n < 40; n++) {
      const a = Math.random() * Math.PI * 2;
      const r = Phaser.Math.FloatBetween(30, LEASH * 0.8);
      const x = this.cairn.x + Math.cos(a) * r;
      const y = this.cairn.y + (Math.sin(a) * r) / 2;
      if (!blockedAt(x, y, 14, 5)) return { x, y };
    }
    return null;
  }

  // einen neuen Salzstein hinlegen (nicht dort, wo der letzte lag)
  placeSalt(at = null) {
    const choices = this.spots.filter((s) => s !== this.lastSpot);
    const spot = at ?? Phaser.Utils.Array.GetRandom(choices.length ? choices : this.spots);
    if (!spot) return;
    this.lastSpot = spot;
    const img = this.scene.add.image(spot.x, spot.y, 'salt_stone').setOrigin(...SALT_ORIGIN).setDepth(spot.y - 2);
    this.salt = { x: spot.x, y: spot.y, img, spot };
  }

  saltNear(p) {
    return !!this.salt && Math.hypot(p.x - this.salt.x, (p.y - this.salt.y) * 2) < SALT_DIST;
  }

  nearCairn(p) {
    return !this.onCairn && Math.hypot(p.x - this.cairn.x, (p.y - this.cairn.y) * 2) < CAIRN_DIST;
  }

  // das leckende Yak, wenn man nah genug dran steht (oder null)
  lickerNear(p) {
    const y = this.licker;
    return y?.licking() && Math.hypot(p.x - y.x, (p.y - y.y) * 2) < BRUSH_DIST ? y : null;
  }

  takeSalt() {
    this.carried = this.salt.spot;
    this.salt.img.destroy();
    this.salt = null;
  }

  // nicht abgelegt (anderes Werkzeug genommen): er liegt bald wieder an seinem Platz
  saltDropped() {
    if (!this.carried) return;
    const spot = this.carried;
    this.carried = null;
    this.scene.time.delayedCall(SALT_DROPPED * 1000, () => !this.salt && !this.onCairn && this.placeSalt(spot));
  }

  // Salzstein auf den Steinhaufen: das nächste Yak trottet herbei; gibt es zurück (oder null)
  putOnCairn() {
    this.carried = null;
    this.onCairn = this.scene.add.image(this.cairn.x, this.cairn.y - SALT_ON_CAIRN, 'salt_stone').setOrigin(...SALT_ORIGIN).setDepth(this.cairn.y + 1);
    this.scene.tweens.add({ targets: this.onCairn, y: { from: this.onCairn.y - 10, to: this.onCairn.y }, duration: 260, ease: 'Bounce.easeOut' });
    const c = this.cairn;
    const yak = this.wild().filter((a) => !a.lick).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
    if (yak) {
      this.licker = yak;
      yak.comeLick(this.lickSpot);
    }
    return yak ?? null;
  }

  // aufgeleckt (nicht gebürstet): das Yak trottet zurück zur Herde
  lickEnded(yak) {
    yak.release(this.leash);
    this.saltGone();
    this.scene.yakLickEnded?.();
  }

  // gebürstet und mitgekommen
  caught() {
    this.saltGone();
  }

  // der Salzstein auf dem Steinhaufen ist weg: bald liegt woanders ein neuer
  saltGone() {
    this.licker = null;
    if (this.onCairn) {
      const img = this.onCairn;
      this.scene.tweens.add({ targets: img, alpha: 0, scale: 0.5, duration: 500, onComplete: () => img.destroy() });
    }
    this.onCairn = null;
    this.saltIn = SALT_BACK;
  }

  update(dt) {
    if (this.saltIn > 0) {
      this.saltIn -= dt;
      if (this.saltIn <= 0 && !this.salt && !this.carried && !this.onCairn) this.placeSalt();
    }
    this.check -= dt;
    if (this.check <= 0) {
      this.check = CHECK_EVERY;
      this.fill();
    }
  }
}
