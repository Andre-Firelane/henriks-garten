// Besucher im Tierpark: kommen an einem Ausgang an, laufen auf den Wegen zu Gehegen mit Tieren, bleiben davor stehen
// und schauen, füttern ab und zu und gehen nach ein paar Gehegen wieder. Wie viele kommen, hängt von den Tieren ab
// (siehe src/world/visitors.js). Besucher sind nicht fest: sie laufen nur auf dem Wegnetz.
import Phaser from 'phaser';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { ENCLOSURES } from '../world/map.js';
import { SPRITE_SINK } from '../animals/Animal.js';
import { isActive } from '../world/events.js';
import { MAX_BUYS, RIDE_CHANCE, SHOP_CHANCE, WHEEL, shopDef } from '../world/shops.js';
import { LEVEL, LEVEL_ID } from '../world/map.js';
import { BABY_BONUS, HOUSE_VISITORS, parkCap, heartSpecies, arrivalInterval, buildPathGrid, findRoute, maxVisitors, parkScore, penScore } from '../world/visitors.js';

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
// Eiswagen-Event und feste Buden (src/world/shops.js): wer eine Sorte noch nicht hatte, geht mit dieser Wahrscheinlichkeit
// hin (beim Ankommen bzw. nach einem Gehege); dort wartet er kurz, bekommt seinen Snack (Herzen) und trägt ihn eine
// Weile in der Hand. Feste Buden: SHOP_CHANCE, Eiswagen-Event: ICE_CHANCE.
const ICE_CHANCE = 0.6;
const BUY_TIME = [2, 3.5];
const WALK_IN = 6; // Mini-Tutorial: so viele Felder vor der Bude taucht der erste Kunde auf (siehe sendToShop)
const EAT_TIME = [40, 70]; // so lange hält er den Snack, dann ist er aufgegessen
const QUEUE_PATIENCE = 90; // Riesenrad: so lange (Sekunden) wartet er höchstens, dann geht er weiter
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
    this.had = new Set(); // Sorten, die er schon gekauft hat
    this.bought = 0;
    this.shop = null; // Bude, zu der er gerade geht bzw. an der er wartet
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
    if (this.phase === 'ride') return; // sitzt im Riesenrad (die Gondel zeigt ihn)
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
    } else if (this.phase === 'queue') {
      // am Riesenrad angestellt: warten, bis unten eine Gondel frei ist (siehe FerrisWheel); zu lange, dann weiter
      this.timer -= dt;
      this.faceTowards(LEVEL.wheelSlot);
      if (this.timer <= 0) {
        this.rode = true; // nicht gleich wieder anstellen
        this.next();
      }
    } else if (this.phase === 'buy') {
      // an der Bude: warten, dann gibt es den Snack
      this.timer -= dt;
      this.faceTowards(this.shop?.at);
      if (this.timer <= 0) {
        this.takeItem(this.shop?.kind ?? 'icecream');
        this.shop = null;
        this.crowd.release(this);
        if (!this.crowd.sendToPen(this)) this.crowd.sendHome(this);
      }
    }
    if (this.itemSprite) {
      this.itemTime -= dt;
      if (this.itemTime <= 0) {
        this.itemSprite.destroy(); // aufgegessen
        this.itemSprite = null;
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

  // Snack bekommen: Herzen (je eins kurz nacheinander), und der Snack kommt in die Hand (statt eines alten)
  takeItem(kind) {
    const def = shopDef(kind);
    this.had.add(kind);
    this.bought++;
    for (let i = 0; i < def.hearts; i++) this.scene.time.delayedCall(250 * i, () => this.popHeart());
    this.scene.addHearts(def.hearts, kind);
    this.itemSprite?.destroy();
    this.itemSprite = this.scene.add.image(this.x, this.y, Phaser.Utils.Array.GetRandom(def.items)).setScale(0.5).setOrigin(0.5, 1);
    this.itemTime = Phaser.Math.FloatBetween(...EAT_TIME);
  }

  faceTowards(t) {
    if (!t) return;
    const p = tileToWorld(t.tx, t.ty);
    this.faceX = Math.sign(p.x - this.x) || this.faceX;
    this.faceY = Math.sign(p.y - this.y) || this.faceY;
  }

  // Riesenrad: einsteigen (die Figur verschwindet, die Gondel zeigt seinen Oberkörper)
  boardWheel() {
    this.rideSpot = this.spot;
    this.crowd.release(this);
    this.phase = 'ride';
    for (const o of [this.sprite, this.shadow, this.itemSprite]) o?.setVisible(false);
  }

  // ... nach einer Runde wieder aussteigen, dort wo er gewartet hat: Herzen, dann weiter zu den Gehegen
  leaveWheel() {
    this.rode = true;
    const p = this.rideSpot ? this.crowd.standPoint(this.rideSpot) : { x: this.x, y: this.y };
    this.rideSpot = null;
    this.x = p.x;
    this.y = p.y;
    for (const o of [this.sprite, this.shadow, this.itemSprite]) o?.setVisible(true);
    this.phase = 'walk';
    this.route = [];
    for (let i = 0; i < WHEEL.hearts; i++) this.scene.time.delayedCall(250 * i, () => this.popHeart());
    this.scene.addHearts(WHEEL.hearts, WHEEL.id);
    if (!this.crowd.sendToPen(this)) this.crowd.sendHome(this);
  }

  // am Ziel angekommen: an der Bude bzw. am Riesenrad anstellen oder am Gehege stehen bleiben und schauen
  arrive() {
    if (this.goal === 'ride') {
      this.goal = null;
      this.phase = 'queue';
      this.timer = QUEUE_PATIENCE;
      return;
    }
    if (this.goal === 'shop') {
      this.goal = null;
      this.phase = 'buy';
      this.timer = Phaser.Math.FloatBetween(...BUY_TIME);
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
    if (this.crowd.maybeShop(this)) return; // erst noch etwas an einer Bude holen
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
    // Snack in der Hand: vorne seitlich auf Handhöhe, von hinten gesehen hinter dem Körper
    if (this.itemSprite) this.itemSprite.setPosition(this.x + this.faceX * 8, this.y - hop - 14).setDepth(this.y + (this.faceY > 0 ? 0.2 : -0.2));
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
    this.gone = true;
    this.sprite.destroy();
    this.shadow.destroy();
    this.itemSprite?.destroy();
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
    this.max = maxVisitors(this.score, HOUSE_VISITORS[LEVEL_ID] ?? parkCap(LEVEL_ID)); // in Aquarium und Reptilienhaus eigene Obergrenze, mit Riesenrad mehr
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

  // Buden dieses Abschnitts, zu denen Besucher gehen können: die festen und (solange das Event läuft) der Eiswagen
  shopList() {
    const list = (this.grid.shops ?? []).map((s) => ({ ...s, chance: SHOP_CHANCE }));
    if (isActive('icecream') && this.grid.ice?.length) list.push({ id: 'event', kind: 'icecream', at: LEVEL.iceStand, spots: this.grid.ice, chance: ICE_CHANCE });
    return list;
  }

  // ab und zu zu einer Bude, deren Sorte er noch nicht hatte, bzw. (einmal) zum Riesenrad (statt zum nächsten Gehege)
  maybeShop(v) {
    if (this.maybeRide(v)) return true;
    if (v.bought >= MAX_BUYS) return false;
    const shops = Phaser.Utils.Array.Shuffle(this.shopList().filter((s) => !v.had.has(s.kind)));
    for (const s of shops) if (Math.random() < s.chance && this.goToShop(v, s)) return true;
    return false;
  }

  // gerade gebaut: gleich kauft jemand dort ein – der Besucher, der der Bude am nächsten an einem Gehege steht, sonst
  // ein neuer vom Ausgang. id: Bauplatz bzw. 'event' (Eiswagen)
  sendToShop(id) {
    const shop = this.shopList().find((s) => s.id === id);
    if (!shop || this.visitors.some((v) => v.shop?.id === id)) return;
    const stand = tileToWorld(shop.at.tx, shop.at.ty);
    const dist = (v) => Math.hypot(v.x - stand.x, v.y - stand.y);
    const v = this.visitors.filter((u) => !u.had.has(shop.kind) && u.phase === 'look').sort((a, b) => dist(a) - dist(b))[0];
    if (v) {
      this.release(v);
      if (!this.goToShop(v, shop) && !this.sendToPen(v)) this.sendHome(v);
      return;
    }
    // sonst ein neuer, vom Ausgang am nächsten bei der Bude (damit er nicht ewig unterwegs ist)
    const exit = [...this.grid.exits].sort((u, w) => dist(tileToWorld(u.tx, u.ty)) - dist(tileToWorld(w.tx, w.ty)))[0];
    if (!exit) return;
    const p = tileToWorld(exit.tx, exit.ty);
    const fresh = new Visitor(this.scene, this, p.x, p.y, this.pickLook());
    this.visitors.push(fresh);
    fresh.sprite.setAlpha(0);
    this.scene.tweens.add({ targets: fresh.sprite, alpha: 1, duration: 500 });
    if (!this.goToShop(fresh, shop)) return this.remove(fresh);
    // nicht den ganzen Weg vom Ausgang laufen: ein paar Felder vor der Bude auftauchen
    const skip = fresh.route.length - WALK_IN;
    if (skip > 0) {
      const p = fresh.route[skip - 1];
      fresh.x = p.x;
      fresh.y = p.y;
      fresh.route = fresh.route.slice(skip);
    }
  }

  // Riesenrad: wer noch nicht gefahren ist, stellt sich ab und zu an
  maybeRide(v) {
    if (!this.scene.wheel || v.rode || !this.grid.wheel?.length || Math.random() > RIDE_CHANCE) return false;
    return this.goToShop(v, { id: 'wheel', kind: 'wheel', at: LEVEL.wheelSlot, spots: this.grid.wheel }, 'ride');
  }

  // nächster Fahrgast fürs Riesenrad: wer am längsten ansteht
  nextRider() {
    return this.visitors.filter((v) => v.phase === 'queue').sort((a, b) => a.timer - b.timer)[0] ?? null;
  }

  // zur Bude (bzw. zum Riesenrad: goal 'ride') laufen, an einen freien Platz davor; false, wenn es keinen gibt
  goToShop(v, shop, goal = 'shop') {
    const free = shop.spots.filter((s) => !s.taken);
    if (!free.length) return false;
    const set = new Set(free.map((s) => s.tx + ',' + s.ty));
    const route = findRoute(this.grid, v.tile, (tx, ty) => set.has(tx + ',' + ty));
    if (!route) return false;
    const end = route.length ? route[route.length - 1] : v.tile;
    const spot = free.find((s) => s.tx === end.tx && s.ty === end.ty);
    spot.taken = v;
    v.spot = spot;
    v.shop = goal === 'shop' ? shop : null;
    v.goal = goal;
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
    if (this.maybeShop(v)) return; // erst zu einer Bude
    if (!this.sendToPen(v)) this.remove(v);
  }

  // Mini-Tutorial: an diesem Gehege soll immer jemand stehen (sonst wirkt der Hinweis "sieh zu, wie die Besucher deine
  // Schafe mögen" seltsam, solange der Park noch fast leer ist). Fehlt einer, taucht er sanft an einem freien Platz auf
  ensureAt(e, n = 1) {
    if (this.visitors.filter((v) => v.pen === e && v.phase !== 'leave').length >= n) return;
    const spots = (this.grid.spots.get(e) ?? []).filter((s) => !s.taken);
    if (!spots.length) return;
    const v = this.placeAtPen({ e, spots }, false);
    v.sprite.setAlpha(0);
    this.scene.tweens.add({ targets: v.sprite, alpha: 1, duration: 500 });
  }

  // Besucher direkt an einen freien Platz stellen (beim Betreten des Parks); partial: schon eine Weile dort (nicht alle
  // gehen gleichzeitig weiter). Gibt den Besucher zurück
  placeAtPen(o = this.pickPen(null), partial = true) {
    if (!o) return null;
    const spot = Phaser.Utils.Array.GetRandom(o.spots);
    const p = this.standPoint(spot);
    const v = new Visitor(this.scene, this, p.x, p.y, this.pickLook());
    this.visitors.push(v);
    spot.taken = v;
    v.spot = spot;
    v.pen = o.e;
    v.arrive();
    if (!partial) return v;
    // nicht alle gleichzeitig weitergehen; Herzen nur noch für die restliche Zeit
    const k = Math.random();
    v.timer *= k;
    v.heartsLeft = Math.round(v.heartsLeft * k);
    v.heartAt = v.timer * 0.75;
    v.heartStep = v.heartAt / Math.max(1, v.heartsLeft);
    return v;
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
    if (v.phase === 'ride') this.scene.wheel?.drop(v);
    this.visitors.splice(this.visitors.indexOf(v), 1);
    this.scene.tweens.add({ targets: [v.sprite, v.shadow, v.itemSprite].filter(Boolean), alpha: 0, duration: 400, onComplete: () => v.destroy() });
  }
}
