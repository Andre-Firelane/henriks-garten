// Besucher im Tierpark: kommen an einem Ausgang an, laufen auf den Wegen zu Gehegen mit Tieren, bleiben davor stehen
// und schauen, füttern ab und zu und gehen nach ein paar Gehegen wieder. Wie viele kommen, hängt von den Tieren ab
// (siehe src/world/visitors.js). Besucher sind nicht fest: sie laufen nur auf dem Wegnetz.
import Phaser from 'phaser';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { ENCLOSURES } from '../world/map.js';
import { SPRITE_SINK } from '../animals/Animal.js';
import { isActive } from '../world/events.js';
import { LEVEL } from '../world/map.js';
import { BABY_BONUS, heartSpecies, arrivalInterval, buildPathGrid, findRoute, maxVisitors, parkScore, penScore } from '../world/visitors.js';

const LOOKS = 8; // Besucher-Bilder visitor1 ... visitor8
const FRAMES = { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 };
const ORIGIN_Y = 112 / 116;
const SPEED = [34, 44]; // Pixel pro Sekunde
const LOOK_TIME = [6, 10]; // Sekunden vor einem Gehege, dazu mehr bei Gehegen mit vielen seltenen Tieren
const VISITS = [2, 4]; // so viele Gehege schaut sich ein Besucher an, bevor er geht
const FEED_CHANCE = 0.25; // so oft füttert er am Ende des Schauens
const PEN_FEED_PAUSE = 40; // Sekunden, bevor dasselbe Gehege wieder gefüttert wird
const SPREAD = 8; // so weit stehen und laufen Besucher neben der Kachelmitte (damit sie sich nicht überlagern)
const SCORE_EVERY = 3; // Sekunden zwischen zwei Neuberechnungen der Anziehung
// Eisstand-Event: wer noch kein Eis hatte, geht mit dieser Wahrscheinlichkeit zum Eiswagen (beim Ankommen bzw. nach
// einem Gehege); dort wartet er kurz, bekommt sein Eis (ein Herz) und trägt es eine Weile in der Hand
const ICE_CHANCE = 0.6;
const ICE_BUY_TIME = [2, 3.5];
const ICE_EAT_TIME = [40, 70]; // so lange hält er das Eis, dann ist es aufgegessen
const ICE_LOOKS = ['icecream', 'icecream2', 'icecream3'];
const ICE_HEARTS = 2; // so viele Herzen bringt jedes verkaufte Eis
// Freilaufende Pfauen (und Schmetterlinge, die auf einer Blüte sitzen): kommt ein Besucher an einem vorbei, bleibt er kurz stehen und schaut; meist gibt es ein Herz
// (immer, wenn der Pfau gerade ein Rad schlägt). Jeden Pfau schaut er sich nur einmal an.
const PEACOCK_WATCH_DIST = 56;
const PEACOCK_WATCH_TIME = [2.5, 4];
const PEACOCK_HEART_CHANCE = 0.6;
// Bewunderungsherzen: jeder Besucher gibt beim Stehenbleiben vor einem Gehege mit Tieren genau ein Herz
// (mehr Herzen gibt es nur durch mehr Besucher, also durch mehr und seltenere Tiere)

export class Visitor {
  constructor(scene, crowd, x, y, look) {
    this.scene = scene;
    this.crowd = crowd;
    this.look = look;
    this.x = x;
    this.y = y;
    this.faceX = 1;
    this.faceY = 1;
    this.speed = Phaser.Math.FloatBetween(...SPEED);
    this.side = Phaser.Math.FloatBetween(-SPREAD, SPREAD); // eigene Spur auf dem Weg
    this.visitsLeft = Phaser.Math.Between(...VISITS);
    this.walkTime = Math.random() * 10;
    this.route = [];
    this.spot = null; // reservierter Aussichtsplatz
    this.pen = null;
    this.phase = 'walk';
    this.timer = 0;
    this.shadow = scene.add.ellipse(x, y, 22, 7, 0x14320a, 0.3);
    this.sprite = scene.add.sprite(x, y, `visitor${look}`, FRAMES.downRight).setOrigin(0.5, ORIGIN_Y).setScale(0.5);
  }

  get tile() {
    return worldToTile(this.x, this.y);
  }

  // Kacheln in Weltpunkte, auf der eigenen Spur (quer zum Weg leicht versetzt)
  setRoute(tiles, end = null) {
    this.route = tiles.map((t) => {
      const p = tileToWorld(t.tx, t.ty);
      return { x: p.x + this.side, y: p.y + this.side * 0.25 };
    });
    if (end && this.route.length) this.route[this.route.length - 1] = end;
    else if (end) this.route.push(end);
  }

  update(dt) {
    let moving = false;
    if (this.phase === 'walk') this.lookForPeacock(dt);
    if (this.phase === 'watch') {
      // vor einem freilaufenden Pfau: kurz schauen, dann weiter
      const pc = this.watching;
      this.timer -= dt;
      if (pc?.sprite?.active) this.faceX = Math.sign(pc.x - this.x) || this.faceX;
      if (this.heartPending && this.timer <= this.heartAt) {
        this.heartPending = false;
        this.popHeart();
        this.scene.addHearts(1, this.watching?.species ?? 'peacock');
      }
      if (this.timer <= 0) {
        this.watching = null;
        this.phase = 'walk';
      }
    } else if (this.phase === 'walk' || this.phase === 'leave') {
      const target = this.route[0];
      if (!target) {
        if (this.phase === 'leave') return this.crowd.remove(this);
        this.arrive();
      } else {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const d = Math.hypot(dx, dy);
        const step = this.speed * dt;
        if (d <= step) {
          this.x = target.x;
          this.y = target.y;
          this.route.shift();
        } else {
          this.x += (dx / d) * step;
          this.y += (dy / d) * step;
        }
        if (Math.abs(dx) > 0.5) this.faceX = Math.sign(dx);
        if (Math.abs(dy) > 0.5) this.faceY = Math.sign(dy);
        moving = true;
      }
    } else if (this.phase === 'look') {
      this.timer -= dt;
      this.glanceTimer -= dt;
      if (this.glanceTimer <= 0) {
        // kurz zur Seite schauen, dann wieder ins Gehege
        this.glanceTimer = Phaser.Math.FloatBetween(2, 5);
        if (Math.random() < 0.35) this.faceX = -this.faceX;
        else this.faceTowardsPen();
      }
      // Bewunderungsherzen, gleichmäßig über die Zeit vor dem Gehege verteilt
      while (this.heartsLeft > 0 && this.timer <= this.heartAt) {
        this.heartsLeft--;
        this.heartAt -= this.heartStep;
        this.popHeart();
        this.scene.addHearts(1, heartSpecies(this.scene.animals, this.pen));
      }
      if (this.timer <= 0) {
        if (Math.random() < FEED_CHANCE) this.crowd.feed(this);
        this.next();
      }
    } else if (this.phase === 'buy') {
      // am Eiswagen: warten, dann gibt es das Eis
      this.timer -= dt;
      this.faceTowards(LEVEL.iceStand);
      if (this.timer <= 0) {
        this.takeIce();
        this.crowd.release(this);
        if (!this.crowd.sendToPen(this)) this.crowd.sendHome(this);
      }
    }
    if (this.iceSprite) {
      this.iceTime -= dt;
      if (this.iceTime <= 0) {
        this.iceSprite.destroy(); // aufgegessen
        this.iceSprite = null;
      }
    }
    this.walkTime += moving ? dt : 0;
    this.render(moving);
  }

  // unterwegs: steht ein freilaufender Pfau in der Nähe, den er noch nicht angeschaut hat? Dann stehen bleiben
  lookForPeacock(dt) {
    this.peacockCheck = (this.peacockCheck ?? Math.random() * 0.5) - dt;
    if (this.peacockCheck > 0) return;
    this.peacockCheck = 0.5;
    const pc = this.scene.animals.find(
      (a) => (a.species === 'peacock' || (a.species === 'butterfly' && a.sitting)) && a.enclosure?.free && a.state === 'penned' && !this.seenPeacocks?.has(a) && Math.hypot(a.x - this.x, (a.y - this.y) * 2) < PEACOCK_WATCH_DIST,
    );
    if (!pc) return;
    (this.seenPeacocks ??= new Set()).add(pc);
    this.watching = pc;
    this.phase = 'watch';
    this.timer = Phaser.Math.FloatBetween(...PEACOCK_WATCH_TIME);
    this.heartAt = this.timer / 2;
    this.heartPending = pc.wheel || Math.random() < PEACOCK_HEART_CHANCE;
    this.faceY = Math.sign(pc.y - this.y) || this.faceY;
  }

  // Eis bekommen: Herzen, und das Eis kommt in die Hand
  takeIce() {
    this.ice = true;
    this.popHeart();
    this.scene.time.delayedCall(250, () => this.popHeart()); // zweites Herz kurz danach
    this.scene.addHearts(ICE_HEARTS, 'icecream');
    this.iceSprite = this.scene.add.image(this.x, this.y, Phaser.Utils.Array.GetRandom(ICE_LOOKS)).setScale(0.5).setOrigin(0.5, 1);
    this.iceTime = Phaser.Math.FloatBetween(...ICE_EAT_TIME);
  }

  faceTowards(t) {
    if (!t) return;
    const p = tileToWorld(t.tx, t.ty);
    this.faceX = Math.sign(p.x - this.x) || this.faceX;
    this.faceY = Math.sign(p.y - this.y) || this.faceY;
  }

  // am Ziel angekommen: am Eiswagen anstellen bzw. am Gehege stehen bleiben und schauen
  arrive() {
    if (this.goal === 'ice') {
      this.goal = null;
      this.phase = 'buy';
      this.timer = Phaser.Math.FloatBetween(...ICE_BUY_TIME);
      return;
    }
    this.phase = 'look';
    const score = penScore(this.scene.animals, this.pen);
    this.timer = Phaser.Math.FloatBetween(...LOOK_TIME) + Math.min(8, score);
    this.glanceTimer = Phaser.Math.FloatBetween(2, 5);
    // ein Herz für dieses Gehege, nach einem Viertel der Zeit
    // während der Tierbabys gibt es an Gehegen mit Babys mehr Herzen (die Kleinen sind so süß)
    const babies = this.scene.animals.some((a) => a.baby && a.enclosure === this.pen);
    const bonus = Math.floor(BABY_BONUS) + (Math.random() < BABY_BONUS % 1 ? 1 : 0); // 2,5 im Schnitt: 2 oder 3
    this.heartsLeft = score > 0 ? 1 + (babies ? bonus : 0) : 0;
    this.heartStep = (this.timer * 0.75) / Math.max(1, this.heartsLeft);
    this.heartAt = this.timer * 0.75;
    this.faceTowardsPen();
  }

  faceTowardsPen() {
    if (!this.spot) return;
    const p = tileToWorld(this.spot.look.tx, this.spot.look.ty);
    this.faceX = Math.sign(p.x - this.x) || this.faceX;
    this.faceY = Math.sign(p.y - this.y) || this.faceY;
  }

  // zum nächsten Gehege oder, wenn genug gesehen, nach Hause
  next() {
    this.crowd.release(this);
    if (this.crowd.maybeIce(this)) return; // erst noch ein Eis holen
    this.visitsLeft--;
    if (this.visitsLeft > 0 && this.crowd.sendToPen(this)) return;
    this.crowd.sendHome(this);
  }

  render(moving) {
    this.sprite.setFrame(this.faceY > 0 ? (this.faceX < 0 ? FRAMES.downLeft : FRAMES.downRight) : this.faceX > 0 ? FRAMES.upRight : FRAMES.upLeft);
    const phase = this.walkTime * 9;
    const hop = moving ? Math.abs(Math.sin(phase)) * 2 : 0;
    this.sprite.setPosition(this.x, this.y - hop + SPRITE_SINK);
    this.sprite.setAngle(moving ? Math.sin(phase) * 2 : 0);
    this.shadow.setPosition(this.x, this.y);
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 0.5);
    // Eis in der Hand: vorne seitlich auf Handhöhe, von hinten gesehen hinter dem Körper
    if (this.iceSprite) this.iceSprite.setPosition(this.x + this.faceX * 8, this.y - hop - 14).setDepth(this.y + (this.faceY > 0 ? 0.2 : -0.2));
  }

  // Bewunderungsherz über dem Kopf (rosa, wie im Zähler oben)
  popHeart() {
    const heart = this.scene.add
      .text(this.x, this.y - 50, '♥', { fontFamily: 'Arial', fontSize: '16px', color: '#ff6fa8', stroke: '#ffffff', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(100000);
    this.scene.tweens.add({ targets: heart, y: heart.y - 16, alpha: 0, duration: 1100, ease: 'Quad.easeOut', onComplete: () => heart.destroy() });
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
    this.iceSprite?.destroy();
  }
}

// Alle Besucher im Park: Ankunft, Ziele, Plätze und Füttern
export class VisitorCrowd {
  constructor(scene) {
    this.scene = scene;
    this.grid = buildPathGrid();
    this.visitors = [];
    this.lastFed = new Map(); // Gehege -> Spielzeit des letzten Fütterns
    this.time = 0;
    this.updateScore();
    this.arrivalTimer = Phaser.Math.FloatBetween(0.3, 1) * arrivalInterval(this.score);
    // beim Ankommen ist der Park nicht leer: ein Teil der Besucher steht schon an den Gehegen
    for (let i = 0; i < Math.floor(this.max / 2); i++) this.placeAtPen();
  }

  updateScore() {
    this.score = parkScore(this.scene.animals);
    this.max = maxVisitors(this.score);
    this.scoreTimer = SCORE_EVERY;
    // sind neue Tiere eingezogen, kommt der nächste Besucher entsprechend früher
    this.arrivalTimer = Math.min(this.arrivalTimer ?? Infinity, arrivalInterval(this.score));
  }

  update(dt) {
    this.time += dt;
    this.scoreTimer -= dt;
    if (this.scoreTimer <= 0) this.updateScore();
    this.arrivalTimer -= dt;
    if (this.arrivalTimer <= 0) {
      this.arrivalTimer = arrivalInterval(this.score) * Phaser.Math.FloatBetween(0.7, 1.3);
      if (this.visitors.length < this.max) this.arriveAtExit();
    }
    for (const v of [...this.visitors]) v.update(dt);
  }

  // ein noch nicht getragenes Aussehen, sonst irgendeins
  pickLook() {
    const used = new Set(this.visitors.map((v) => v.look));
    const free = [...Array(LOOKS).keys()].map((i) => i + 1).filter((n) => !used.has(n));
    return Phaser.Utils.Array.GetRandom(free.length ? free : [...Array(LOOKS).keys()].map((i) => i + 1));
  }

  // Gehege mit Tieren und freiem Platz, gewichtet nach Anziehung (nicht das, an dem er gerade war)
  pickPen(except) {
    const options = ENCLOSURES.map((e) => ({ e, w: penScore(this.scene.animals, e), spots: (this.grid.spots.get(e) ?? []).filter((s) => !s.taken) }))
      .filter((o) => o.w > 0 && o.spots.length && o.e !== except);
    if (!options.length) return null;
    let r = Math.random() * options.reduce((s, o) => s + o.w, 0);
    for (const o of options) if ((r -= o.w) <= 0) return o;
    return options[options.length - 1];
  }

  // Platz an einem Gehege reservieren und hinlaufen
  sendToPen(v) {
    const from = v.tile;
    const o = this.pickPen(v.pen);
    if (!o) return false;
    // der nächste freie Platz an diesem Gehege
    const free = new Set(o.spots.map((s) => s.tx + ',' + s.ty));
    const route = findRoute(this.grid, from, (tx, ty) => free.has(tx + ',' + ty));
    if (!route) return false;
    const end = route.length ? route[route.length - 1] : from;
    const spot = o.spots.find((s) => s.tx === end.tx && s.ty === end.ty);
    spot.taken = v;
    v.spot = spot;
    v.pen = o.e;
    v.phase = 'walk';
    v.setRoute(route, this.standPoint(spot));
    return true;
  }

  // Stehplatz in der Kachel: etwas versetzt, damit auch Nachbarn nicht übereinander stehen
  standPoint(spot) {
    const p = tileToWorld(spot.tx, spot.ty);
    const h = ((spot.tx * 73856093) ^ (spot.ty * 19349663)) >>> 0;
    return { x: p.x + ((h % 17) - 8), y: p.y + (((h >> 5) % 7) - 3) };
  }

  release(v) {
    if (v.spot) v.spot.taken = null;
    v.spot = null;
  }

  // Eisstand-Event: ab und zu (wer noch keins hatte) zum Eiswagen statt zum nächsten Gehege
  maybeIce(v) {
    if (v.ice || !isActive('icecream') || Math.random() > ICE_CHANCE) return false;
    const free = this.grid.ice.filter((s) => !s.taken);
    if (!free.length) return false;
    const set = new Set(free.map((s) => s.tx + ',' + s.ty));
    const route = findRoute(this.grid, v.tile, (tx, ty) => set.has(tx + ',' + ty));
    if (!route) return false;
    const end = route.length ? route[route.length - 1] : v.tile;
    const spot = free.find((s) => s.tx === end.tx && s.ty === end.ty);
    spot.taken = v;
    v.spot = spot;
    v.goal = 'ice';
    v.phase = 'walk';
    v.setRoute(route, this.standPoint(spot));
    return true;
  }

  sendHome(v) {
    const exits = new Set(this.grid.exits.map((t) => t.tx + ',' + t.ty));
    const route = findRoute(this.grid, v.tile, (tx, ty) => exits.has(tx + ',' + ty));
    v.phase = 'leave';
    v.setRoute(route ?? []);
  }

  // neuer Besucher an einem zufälligen Ausgang
  arriveAtExit() {
    const exit = Phaser.Utils.Array.GetRandom(this.grid.exits);
    if (!exit) return;
    const p = tileToWorld(exit.tx, exit.ty);
    const v = new Visitor(this.scene, this, p.x, p.y, this.pickLook());
    this.visitors.push(v);
    v.sprite.setAlpha(0);
    this.scene.tweens.add({ targets: v.sprite, alpha: 1, duration: 500 });
    if (this.maybeIce(v)) return; // erst zum Eiswagen
    if (!this.sendToPen(v)) this.remove(v);
  }

  // Besucher direkt an einen freien Platz stellen (beim Betreten des Parks)
  placeAtPen() {
    const o = this.pickPen(null);
    if (!o) return;
    const spot = Phaser.Utils.Array.GetRandom(o.spots);
    const p = this.standPoint(spot);
    const v = new Visitor(this.scene, this, p.x, p.y, this.pickLook());
    this.visitors.push(v);
    spot.taken = v;
    v.spot = spot;
    v.pen = o.e;
    v.arrive();
    // nicht alle gleichzeitig weitergehen; Herzen nur noch für die restliche Zeit
    const k = Math.random();
    v.timer *= k;
    v.heartsLeft = Math.round(v.heartsLeft * k);
    v.heartAt = v.timer * 0.75;
    v.heartStep = v.heartAt / Math.max(1, v.heartsLeft);
  }

  // Futter ins Gehege werfen, wenn dort gerade Tiere fressen können (nicht zu oft dasselbe Gehege)
  feed(v) {
    const e = v.pen;
    if (!e || this.time - (this.lastFed.get(e) ?? -Infinity) < PEN_FEED_PAUSE) return;
    if (this.scene.feedEnclosure(e, v) > 0) {
      this.lastFed.set(e, this.time);
    }
  }

  remove(v) {
    this.release(v);
    this.visitors.splice(this.visitors.indexOf(v), 1);
    this.scene.tweens.add({ targets: [v.sprite, v.shadow, v.iceSprite].filter(Boolean), alpha: 0, duration: 400, onComplete: () => v.destroy() });
  }
}
