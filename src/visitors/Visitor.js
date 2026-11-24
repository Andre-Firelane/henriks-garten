// Besucher im Tierpark: kommen an einem Ausgang an, laufen auf den Wegen zu Gehegen mit Tieren, bleiben davor stehen
// und schauen, füttern ab und zu und gehen nach ein paar Gehegen wieder. Wie viele kommen, hängt von den Tieren ab
// (siehe src/world/visitors.js). Besucher sind nicht fest: sie laufen nur auf dem Wegnetz.
import Phaser from 'phaser';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { ENCLOSURES, objectAt, inJungleHall } from '../world/map.js';
import { SPRITE_SINK } from '../animals/Animal.js';
import { isActive } from '../world/events.js';
import { tr } from '../i18n.js';
import { isPark } from '../world/levels.js';
import { MAX_WISH_WALKERS, WISH_CHANCE, WISH_TALK_DIST, openWishes, thanksLine, wishIcon, wishKey, wishLine, wishSlotFree } from '../world/wishes.js';
import { MAX_BUYS, RIDE_CHANCE, SHOP_CHANCE, TEA, TEA_CHANCE, TEA_TIME, WHEEL, shopDef } from '../world/shops.js';
import { LEVEL, LEVEL_ID } from '../world/map.js';
import { BABY_BONUS, HOUSE_VISITORS, parkCap, heartSpecies, arrivalInterval, buildPathGrid, findRoute, maxVisitors, parkScore, penScore } from '../world/visitors.js';

const FRIEND_SAY_CHANCE = 0.6; // so oft nennt ein Besucher den Tierfreund beim Namen
const LOOKS = 8; // Besucher-Bilder visitor1 ... visitor8
const FRAMES = { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 };
const ORIGIN_Y = 112 / 116;
const SPEED = [34, 44]; // Pixel pro Sekunde
const LOOK_TIME = [6, 10]; // Sekunden vor einem Gehege, dazu mehr bei Gehegen mit vielen seltenen Tieren
const VISITS = [2, 4]; // so viele Gehege schaut sich ein Besucher an, bevor er geht
const FEED_CHANCE = 0.25; // so oft füttert er am Ende des Schauens
const PEN_FEED_PAUSE = 40; // Sekunden, bevor dasselbe Gehege wieder gefüttert wird
// Koi-Teich (Bambuswald): wer auf der Brücke steht, füttert oft die Koi (sie kommen herbei), das bringt ein Herz mehr
const KOI_FEED_CHANCE = 0.6;
const KOI_FEED_DELAY = 1500; // Millisekunden nach dem Ankommen
const KOI_FEED_PAUSE = 12; // Sekunden, bevor wieder jemand die Koi füttert
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
// Tropenhalle: so oft (Sekunden) prüft ein stehender Besucher, ob sich ein Schmetterling auf ihn setzt, so wahrscheinlich
// passiert es dann, so nah (Welt-Pixel) muss einer flattern, und so viele Herzen gibt es dafür
const BUTTERFLY_CHECK = 6;
const BUTTERFLY_CHANCE = 0.18;
const BUTTERFLY_REACH = 160;
const BUTTERFLY_HEARTS = 2;
const PEACOCK_WATCH_TIME = [2.5, 4];
const PEACOCK_HEART_CHANCE = 0.6;
// Bewunderungsherzen: jeder Besucher gibt beim Stehenbleiben vor einem Gehege mit Tieren genau ein Herz
// (mehr Herzen gibt es nur durch mehr Besucher, also durch mehr und seltenere Tiere)
// Streichelzoo (petting in levels.js): der Besucher geht durchs Tor hinein, sucht sich ein Tier aus, das gerade frei ist,
// geht hin und streichelt es (das Tier bleibt stehen und schaut ihn an). Jedes Streicheln bringt ein Herz; er streichelt
// PETS Tiere nacheinander, also doppelt so viele Herzen wie beim Anschauen
const PETS = 2;
const PET_TIME = [4, 6.5]; // Sekunden Streicheln
const PET_GAP = 15; // so weit (Pixel) steht er neben dem Tier
// Besucherwünsche (src/world/wishes.js): angesprochen bleibt er kurz stehen und erzählt; beim großen Moment am Gehege
// springt er vor Freude, es regnet Herzen, dann schaut er noch eine Weile wie jeder Besucher
const WISH_CHAT_TIME = 3; // Sekunden stehen bleiben beim Ansprechen
const WISH_EXTRA_VISITS = 2; // Wunsch-Besucher bleiben etwas länger im Park (damit man sie findet)
const CHEER_TIME = 4; // Sekunden Freude am Zaun
const CHEER_JUMPS = 4; // so viele Freudensprünge
const CHEER_JUMP_H = 9; // so hoch (Pixel)
const HEART_RAIN = 14; // so viele Herzen regnen herab
const THANK_MARGIN = 40; // so weit außerhalb des Bildes taucht der Besucher auf

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
    this.wish = null; // Wunsch-Besucher: diese Tierart wünscht er sich (noch nicht angesprochen)
    this.wishSkin = null; // ... bzw. diese seltene Variante davon
    this.wishEl = null; // ... die Blase dazu (HTML über dem Bild)
    this.chatTimer = 0; // angesprochen: so lange bleibt er noch stehen
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
    if (this.phase === 'ride') return this.placeWish(); // sitzt im Riesenrad (die Gondel zeigt ihn)
    let moving = false;
    if (this.chatTimer > 0) {
      // angesprochen: stehen bleiben und Henrik anschauen
      this.chatTimer -= dt;
      const p = this.scene.player;
      this.faceX = Math.sign(p.x - this.x) || this.faceX;
      this.faceY = Math.sign(p.y - this.y) || this.faceY;
      this.render(false);
      return;
    }
    if (this.phase === 'cheer') {
      // großer Moment am Gehege: Freudensprünge, dann schaut er wie jeder Besucher
      this.timer -= dt;
      this.cheerT = (this.cheerT ?? 0) + dt;
      this.faceTowardsPen();
      if (this.timer <= 0) {
        this.phase = 'walk';
        this.cheerT = 0;
        if (this.pen?.petting) {
          this.petsLeft = 2;
          if (!this.crowd.goPet(this)) this.next();
        } else if (this.spot) this.arrive();
        else this.next();
      }
      this.render(false);
      return;
    }
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
      if (this.goal === 'pet' && !this.crowd.canKeepPetting(this, this.petAnimal)) return this.crowd.petNext(this);
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
      this.butterflyVisit(dt);
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
    } else if (this.phase === 'pet') {
      // im Streichelzoo: streicheln, nach der halben Zeit ein Herz, dann zum nächsten Tier
      const a = this.petAnimal;
      if (!this.crowd.canKeepPetting(this, a)) return this.crowd.petNext(this);
      this.timer -= dt;
      this.faceX = Math.sign(a.x - this.x) || this.faceX;
      this.faceY = Math.sign(a.y - this.y) || this.faceY;
      this.stroke = (this.stroke ?? 0) + dt;
      if (this.heartPending && this.timer <= this.heartAt) {
        this.heartPending = false;
        for (let i = 0; i < this.petHearts; i++) this.scene.time.delayedCall(250 * i, () => !this.gone && this.popHeart());
        this.scene.addHearts(this.petHearts, a.species);
      }
      if (this.timer <= 0) {
        this.petsLeft--;
        this.crowd.petNext(this);
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
      // an der Bude: warten, dann gibt es den Snack (im Teehaus: am Stehtisch den Tee trinken, dann gibt es Herzen)
      this.timer -= dt;
      this.faceTowards(this.spot?.table ?? this.shop?.at);
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
    this.placeWish();
  }

  // --- Besucherwünsche ---

  // er wünscht sich diese Tierart: Blase mit dem Tier und einem Herz über dem Kopf. accepted: der Wunsch ist schon
  // angenommen (die Blase bleibt bis zum Schluss als Erkennungszeichen, ansprechen kann man ihn nicht mehr)
  setWish(species, accepted = false, skin = null) {
    this.clearWish();
    this.wish = species;
    this.wishSkin = skin ?? null;
    this.wishAccepted = accepted;
    this.wishEl = document.createElement('div');
    this.wishEl.className = `wish-bubble${skin ? ' rare' : ''}`;
    this.wishEl.innerHTML = `${wishIcon(species, skin, 1.8)}<span class="wish-heart">♥</span>`;
    document.body.append(this.wishEl);
  }

  clearWish() {
    this.wishEl?.remove();
    this.wishEl = null;
    this.wish = null;
    this.wishSkin = null;
    this.wishAccepted = false;
  }

  // noch nicht angesprochener Wunsch (dafür gilt die Obergrenze der angenommenen Wünsche)
  get wishOpen() {
    return !!this.wish && !this.wishAccepted;
  }

  // Blase mitführen; noch nicht angesprochene sind versteckt, solange schon genug Wünsche angenommen sind (und alle,
  // während er im Riesenrad sitzt)
  placeWish() {
    const el = this.wishEl;
    if (!el) return;
    const show = (this.wishAccepted || wishSlotFree()) && this.phase !== 'ride' && this.chatTimer <= 0;
    if (show !== el.classList.contains('show')) el.classList.toggle('show', show);
    if (!show) return;
    const cam = this.scene.cameras.main;
    const z = this.scene.scale.zoom;
    // auf ganze Bildpunkte gerundet, sonst zappelt die Blase beim Laufen und Mitscrollen
    el.style.left = `${Math.round((this.x - cam.worldView.x) * cam.zoom * z)}px`;
    el.style.top = `${Math.round((this.y - 58 - cam.worldView.y) * cam.zoom * z)}px`;
  }

  // angesprochen: er erzählt von seinem Wunsch und bleibt kurz stehen; die Blase bleibt
  tellWish() {
    const species = this.wish;
    this.wishAccepted = true;
    this.chatTimer = WISH_CHAT_TIME;
    this.say(wishLine(species, this.wishSkin));
    return species;
  }

  // großer Moment am Gehege: springen, Herzregen, "Ein Fuchs! Danke!"
  cheer(wish) {
    this.phase = 'cheer';
    this.timer = CHEER_TIME;
    this.cheerT = 0;
    this.faceTowardsPen();
    this.say(thanksLine(wish.species, wish.skin));
    this.heartRain();
  }

  heartRain() {
    for (let i = 0; i < HEART_RAIN; i++) {
      this.scene.time.delayedCall(i * 130, () => {
        if (this.gone) return;
        const x = this.x + Phaser.Math.Between(-34, 34);
        const y = this.y - Phaser.Math.Between(70, 95);
        const heart = this.scene.add
          .text(x, y, '♥', { fontFamily: 'Arial', fontSize: `${Phaser.Math.Between(12, 18)}px`, color: '#ff6fa8', stroke: '#ffffff', strokeThickness: 3 })
          .setOrigin(0.5)
          .setDepth(100000);
        this.scene.tweens.add({ targets: heart, y: y + Phaser.Math.Between(40, 60), x: x + Phaser.Math.Between(-8, 8), alpha: { from: 1, to: 0 }, duration: 1300, ease: 'Sine.easeIn', onComplete: () => heart.destroy() });
      });
    }
  }

  // unterwegs: steht ein freilaufender Pfau in der Nähe, den er noch nicht angeschaut hat? Dann stehen bleiben
  // steht er in der Tropenhalle (siehe JungleHall.js)?
  inJungleHall() {
    const { tx, ty } = worldToTile(this.x, this.y);
    return inJungleHall(tx, ty);
  }

  // Tropenhalle: ab und zu setzt sich ein Schmetterling auf einen Besucher, der gerade vor einem Gehege steht
  butterflyVisit(dt) {
    this.butterflyCheck = (this.butterflyCheck ?? Phaser.Math.FloatBetween(2, BUTTERFLY_CHECK)) - dt;
    if (this.butterflyCheck > 0 || this.butterfly) return;
    this.butterflyCheck = BUTTERFLY_CHECK;
    if (this.timer < 6 || Math.random() > BUTTERFLY_CHANCE || !this.inJungleHall()) return;
    const b = this.scene.animals.find((a) => a.species === 'butterfly' && a.enclosure?.within && a.mode === 'fly' && !a.visitor && Math.hypot(a.x - this.x, (a.y - this.y) * 2) < BUTTERFLY_REACH);
    if (b?.landOn(this)) this.butterfly = b;
  }

  // der Schmetterling sitzt jetzt auf ihm: er bleibt so lange stehen, freut sich und gibt zwei Herzen
  butterflyLanded(b, time) {
    this.timer = Math.max(this.timer, time + 1);
    this.scene.time.delayedCall(700, () => {
      if (this.gone) return;
      this.say('🦋');
      for (let i = 0; i < BUTTERFLY_HEARTS; i++) this.scene.time.delayedCall(300 * i, () => !this.gone && this.popHeart());
      this.scene.addHearts(BUTTERFLY_HEARTS, 'butterfly');
    });
    this.scene.time.delayedCall((time + 1) * 1000, () => (this.butterfly = null));
  }

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
    const def = kind === TEA.id ? TEA : shopDef(kind);
    this.had.add(kind);
    this.bought++;
    for (let i = 0; i < def.hearts; i++) this.scene.time.delayedCall(250 * i, () => this.popHeart());
    this.scene.addHearts(def.hearts, kind);
    if (kind === TEA.id) {
      // ausgetrunken: die Tasse bleibt am Tisch
      this.itemSprite?.destroy();
      this.itemSprite = null;
      return;
    }
    if (!def.items?.length) return; // (Blumen & Andenken: nichts in der Hand)
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
    if (this.goal === 'thank') {
      // Wunsch erfüllt: am Zaun freuen (die Herzen gibt die Szene, siehe wishThanked)
      this.goal = null;
      this.cheer(this.thanks);
      this.crowd.thanked(this);
      return;
    }
    if (this.goal === 'petenter') {
      // am Tor des Streichelzoos: jetzt ein Tier aussuchen
      this.goal = null;
      if (!this.crowd.goPet(this)) this.next();
      return;
    }
    if (this.goal === 'pet') {
      this.goal = null;
      this.phase = 'pet';
      this.timer = Phaser.Math.FloatBetween(...PET_TIME);
      this.heartAt = this.timer / 2;
      this.heartPending = true;
      // während der Tierbabys: ein Baby zu streicheln bringt mehr Herzen (wie an den anderen Gehegen)
      const bonus = Math.floor(BABY_BONUS) + (Math.random() < BABY_BONUS % 1 ? 1 : 0);
      this.petHearts = 1 + (this.petAnimal?.baby ? bonus : 0);
      return;
    }
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
      if (this.shop?.kind === TEA.id) {
        // Teehaus: gleich mit der Tasse in der Hand am Stehtisch, eine Weile trinken
        this.timer = Phaser.Math.FloatBetween(...TEA_TIME);
        this.itemSprite?.destroy();
        this.itemSprite = this.scene.add.image(this.x, this.y, TEA.items[0]).setScale(0.5).setOrigin(0.5, 1);
        this.itemTime = Infinity;
      }
      return;
    }
    this.phase = 'look';
    const score = penScore(this.scene.animals, this.pen);
    this.timer = Phaser.Math.FloatBetween(...LOOK_TIME) + Math.min(8, score);
    this.glanceTimer = Phaser.Math.FloatBetween(2, 5);
    // ein Herz für dieses Gehege, nach einem Viertel der Zeit
    // während der Tierbabys gibt es an Gehegen mit Babys mehr Herzen (die Kleinen sind so süß)
    const babies = this.scene.animals.some((a) => a.baby && a.enclosure === this.pen);
    const bonus = Math.floor(BABY_BONUS) + (Math.random() < BABY_BONUS % 1 ? 1 : 0); // im Schnitt BABY_BONUS: abgerundet oder eins mehr
    this.heartsLeft = score > 0 ? 1 + (babies ? bonus : 0) : 0;
    this.heartStep = (this.timer * 0.75) / Math.max(1, this.heartsLeft);
    this.heartAt = this.timer * 0.75;
    // Laternenabend im Bambuswald: die Besucher sind verzaubert und geben ein Herz mehr
    if (LEVEL.lanterns && isActive('lanterns') && this.heartsLeft > 0) {
      this.heartsLeft++;
      this.heartStep = (this.timer * 0.75) / this.heartsLeft;
    }
    // Sprühnebel in der Tropenhalle: wer gerade dort schaut, staunt und gibt ein Herz mehr (siehe JungleHall.js)
    if (this.scene.jungleHall?.misty && this.heartsLeft > 0 && this.inJungleHall()) {
      this.heartsLeft++;
      this.heartStep = (this.timer * 0.75) / this.heartsLeft;
    }
    // Tierfreund ab Stufe 3 (siehe src/world/friends.js): die Besucher kennen ihn, rufen seinen Namen und geben ein Herz mehr
    const friend = this.scene.friendIn?.(this.pen);
    if (friend && friend.level >= 3 && score > 0) {
      this.heartsLeft++;
      this.heartStep = (this.timer * 0.75) / this.heartsLeft;
      if (Math.random() < FRIEND_SAY_CHANCE) this.scene.time.delayedCall(Phaser.Math.Between(400, 1600), () => !this.gone && this.say(tr(`Guck mal, da ist ${friend.bond.name}!`, `Look, there’s ${friend.bond.name}!`)));
    }
    this.faceTowardsPen();
    if (this.crowd.koiBridge(this) && Math.random() < KOI_FEED_CHANCE) {
      this.scene.time.delayedCall(KOI_FEED_DELAY, () => !this.gone && this.phase === 'look' && this.crowd.feedKoi(this));
    }
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
    let hop = moving ? Math.abs(Math.sin(phase)) * 2 : 0;
    // Freudensprünge (in der ersten Hälfte der Freude)
    const jumpT = this.phase === 'cheer' ? this.cheerT : 0;
    if (jumpT > 0 && jumpT < CHEER_JUMPS * 0.5) hop = Math.abs(Math.sin((jumpT / 0.5) * Math.PI)) * CHEER_JUMP_H;
    this.sprite.setPosition(this.x, this.y - hop + SPRITE_SINK);
    // beim Streicheln sanft vor- und zurückneigen
    const stroke = this.phase === 'pet' ? Math.sin((this.stroke ?? 0) * 5) * 3 * this.faceX : 0;
    this.sprite.setAngle(moving ? Math.sin(phase) * 2 : stroke);
    this.shadow.setPosition(this.x, this.y);
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 0.5);
    // Snack in der Hand: vorne seitlich auf Handhöhe, von hinten gesehen hinter dem Körper
    if (this.itemSprite) this.itemSprite.setPosition(this.x + this.faceX * 8, this.y - hop - 14).setDepth(this.y + (this.faceY > 0 ? 0.2 : -0.2));
  }

  // kurze Sprechblase über dem Kopf (Tierfreunde ab Stufe 3)
  say(text) {
    const bubble = this.scene.add
      .text(this.x, this.y - 56, text, { fontFamily: 'Trebuchet MS, Arial', fontSize: '10px', fontStyle: 'bold', color: '#2b1d14', backgroundColor: '#fff8e6', padding: { x: 5, y: 3 }, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(100000);
    this.scene.tweens.add({ targets: bubble, y: bubble.y - 6, alpha: { from: 1, to: 0 }, delay: 2600, duration: 600, onComplete: () => bubble.destroy() });
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
    this.clearWish();
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
    this.thanking = null; // Wunsch, dessen Besucher gerade zum Gehege läuft (immer nur einer)
    scene.events.once('shutdown', () => this.visitors.forEach((v) => v.clearWish())); // Blasen sind HTML
    this.updateScore();
    this.arrivalTimer = Phaser.Math.FloatBetween(0.3, 1) * arrivalInterval(this.score);
    // beim Ankommen ist der Park nicht leer: ein Teil der Besucher steht schon an den Gehegen
    for (let i = 0; i < Math.floor(this.max / 2); i++) this.placeAtPen();
  }

  updateScore() {
    this.score = parkScore(this.scene.animals);
    this.max = maxVisitors(this.score, HOUSE_VISITORS[LEVEL_ID] ?? parkCap(LEVEL_ID)); // in Aquarium und Reptilienhaus eigene Obergrenze, mit Riesenrad mehr
    this.scoreTimer = SCORE_EVERY;
    this.pruneWishes();
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
    const options = ENCLOSURES.map((e) => ({ e, w: penScore(this.scene.animals, e), spots: e.petting ? this.petEntries(e) : (this.grid.spots.get(e) ?? []).filter((s) => !s.taken) }))
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
    if (o.e.petting) return this.sendToPetting(v, o.e);
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
    if (v.petAnimal?.petted === v) v.petAnimal.petted = null;
    v.petAnimal = null;
    if (v.goal === 'pet' || v.goal === 'petenter') v.goal = null;
  }

  // --- Streichelzoo ---

  // Tiere, die ein Besucher gerade streicheln darf: im Gehege, frei (kein anderer Besucher, kein Futter, kein
  // Spielzeug) und am Boden (keine Katze oben auf dem Kratzbaum)
  pettable(e) {
    const inside = this.grid.pets?.get(e)?.inside;
    if (!inside) return [];
    return this.scene.animals.filter((a) => {
      if (a.state !== 'penned' || a.enclosure !== e || a.petted || a.feed || a.play || a.tree || a.jumping || a.sleeping || !a.sprite?.active) return false;
      const t = worldToTile(a.x, a.y);
      return inside.has(t.tx + ',' + t.ty);
    });
  }

  // für pickPen: ein Eintrag je freiem Tier, abzüglich der Besucher, die schon auf dem Weg hinein sind
  petEntries(e) {
    const busy = this.visitors.filter((v) => v.pen === e && v.goal === 'petenter').length;
    return this.pettable(e).slice(busy);
  }

  // zum Tor des Streichelzoos laufen; dort sucht er sich ein Tier aus (arrive, goal 'petenter')
  sendToPetting(v, e) {
    const pet = this.grid.pets.get(e);
    const gates = new Set(pet.gates.map((g) => g.tx + ',' + g.ty));
    const route = findRoute(this.grid, v.tile, (tx, ty) => gates.has(tx + ',' + ty));
    if (!route) return false;
    v.pen = e;
    v.petsLeft = PETS;
    v.goal = 'petenter';
    v.phase = 'walk';
    v.setRoute(route);
    return true;
  }

  // ein freies Tier im Streichelzoo aussuchen (eins der nächsten) und hingehen; false, wenn keins frei ist
  goPet(v) {
    const e = v.pen;
    const pet = this.grid.pets.get(e);
    if (!pet) return false;
    const free = this.pettable(e).sort((a, b) => Math.hypot(a.x - v.x, a.y - v.y) - Math.hypot(b.x - v.x, b.y - v.y));
    for (const a of free.slice(0, 4)) {
      const at = worldToTile(a.x, a.y);
      const route = findRoute(this.grid, v.tile, (tx, ty) => pet.inside.has(tx + ',' + ty) && Math.max(Math.abs(tx - at.tx), Math.abs(ty - at.ty)) <= 1);
      if (!route) continue;
      // neben dem Tier stehen, auf der Seite, von der er kommt
      const side = v.x < a.x ? -1 : 1;
      a.petted = v;
      v.petAnimal = a;
      v.goal = 'pet';
      v.phase = 'walk';
      v.setRoute(route, { x: a.x + side * PET_GAP, y: a.y + 3 });
      return true;
    }
    return false;
  }

  // darf er das Tier weiter streicheln bzw. weiter dorthin gehen?
  canKeepPetting(v, a) {
    return !!a && a.petted === v && a.state === 'penned' && a.enclosure === v.pen && !!a.sprite?.active;
  }

  // fertig mit einem Tier (oder es ist weg): das nächste, sonst weiter zum nächsten Gehege
  petNext(v) {
    const a = v.petAnimal;
    if (a?.petted === v) a.petted = null;
    v.petAnimal = null;
    v.goal = null;
    v.phase = 'walk';
    v.route = [];
    if (v.petsLeft > 0 && this.goPet(v)) return;
    v.next();
  }

  // Buden dieses Abschnitts, zu denen Besucher gehen können: die festen und (solange das Event läuft) der Eiswagen
  shopList() {
    const list = (this.grid.shops ?? []).map((s) => ({ ...s, chance: s.kind === TEA.id ? TEA_CHANCE : SHOP_CHANCE }));
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
    this.maybeWish(v);
    if (this.maybeShop(v)) return; // erst zu einer Bude
    if (!this.sendToPen(v)) this.remove(v);
  }

  // Mini-Tutorial: an diesem Gehege soll immer jemand stehen (sonst wirkt der Hinweis "sieh zu, wie die Besucher deine
  // Schafe mögen" seltsam, solange der Park noch fast leer ist). Fehlt einer, taucht er sanft an einem freien Platz auf
  ensureAt(e, n = 1) {
    if (this.visitors.filter((v) => v.pen === e && v.phase !== 'leave').length >= n) return;
    if (e.petting) {
      const v = this.placePetting(e, false);
      if (!v) return;
      v.sprite.setAlpha(0);
      this.scene.tweens.add({ targets: v.sprite, alpha: 1, duration: 500 });
      return;
    }
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
    if (o.e.petting) return this.placePetting(o.e, partial);
    const spot = Phaser.Utils.Array.GetRandom(o.spots);
    const p = this.standPoint(spot);
    const v = new Visitor(this.scene, this, p.x, p.y, this.pickLook());
    this.visitors.push(v);
    spot.taken = v;
    v.spot = spot;
    v.pen = o.e;
    v.arrive();
    if (!partial) return v;
    this.maybeWish(v);
    // nicht alle gleichzeitig weitergehen; Herzen nur noch für die restliche Zeit
    const k = Math.random();
    v.timer *= k;
    v.heartsLeft = Math.round(v.heartsLeft * k);
    v.heartAt = v.timer * 0.75;
    v.heartStep = v.heartAt / Math.max(1, v.heartsLeft);
    return v;
  }

  // Besucher direkt neben ein freies Tier im Streichelzoo stellen, er streichelt schon (partial: schon eine Weile)
  placePetting(e, partial) {
    const a = Phaser.Utils.Array.GetRandom(this.pettable(e));
    if (!a) return null;
    const side = Math.random() < 0.5 ? -1 : 1;
    const v = new Visitor(this.scene, this, a.x + side * PET_GAP, a.y + 3, this.pickLook());
    this.visitors.push(v);
    v.pen = e;
    v.petsLeft = partial ? Phaser.Math.Between(1, PETS) : PETS;
    a.petted = v;
    v.petAnimal = a;
    v.goal = 'pet';
    v.arrive();
    if (partial) {
      v.timer *= Math.random();
      v.heartPending = v.timer > v.heartAt;
    }
    return v;
  }

  // --- Besucherwünsche (src/world/wishes.js) ---

  // ab und zu ist ein Besucher ein Wunsch-Besucher (nur im Tierpark, solange noch ein Wunsch angenommen werden kann)
  maybeWish(v) {
    if (!isPark(LEVEL_ID) || !wishSlotFree() || Math.random() > WISH_CHANCE) return;
    const walkers = this.visitors.filter((u) => u.wishOpen);
    if (walkers.length >= MAX_WISH_WALKERS) return;
    const taken = new Set([...walkers.map((u) => wishKey(u.wish, u.wishSkin)), ...openWishes().map((w) => wishKey(w.species, w.skin))]);
    const wish = this.scene.pickWish?.(taken);
    if (!wish) return;
    v.setWish(wish.species, false, wish.skin);
    v.visitsLeft += WISH_EXTRA_VISITS;
  }

  // Wünsche, die inzwischen erfüllt sind (das Tier ist schon da), lösen sich auf
  pruneWishes() {
    for (const v of this.visitors) if (v.wishOpen && !this.scene.wishValid?.(v.wish, undefined, v.wishSkin)) v.clearWish();
  }

  // Wunsch-Besucher, den Henrik gerade ansprechen kann (der nächste)
  wishNear(p) {
    if (!wishSlotFree()) return null;
    let best = null;
    let bestD = WISH_TALK_DIST;
    for (const v of this.visitors) {
      if (!v.wishOpen || v.gone || v.phase === 'ride') continue;
      const d = Math.hypot(v.x - p.x, (v.y - p.y) * 2);
      if (d < bestD) {
        best = v;
        bestD = d;
      }
    }
    return best;
  }

  // angesprochen: der Wunsch wird angenommen (Wunschkarte), sein Aussehen gemerkt
  acceptWish(v) {
    if (!v?.wish || !wishSlotFree()) return null;
    const skin = v.wishSkin;
    const species = v.tellWish();
    openWishes().push({ species, ...(skin ? { skin } : {}), look: v.look, done: false });
    return species;
  }

  // großer Moment: Henrik ist am Gehege e mit der gewünschten Art. Der Besucher (mit gemerktem Aussehen) taucht knapp
  // außerhalb des Bildes auf dem Weg auf, läuft zum Zaun und freut sich. Gibt zurück, ob es geklappt hat
  thank(wish, e, near) {
    if (this.thanking) return false;
    const grid = this.grid;
    // Ziel: ein Platz am Zaun (der freie nächste bei Henrik), im Streichelzoo das Tor; sonst ein Weg nahe beim Tier
    const p0 = this.scene.player;
    const dist = (t) => {
      const p = tileToWorld(t.tx, t.ty);
      return Math.hypot(p.x - p0.x, (p.y - p0.y) * 2);
    };
    let spot = null;
    let targets;
    if (e.petting) targets = grid.pets.get(e)?.gates ?? [];
    else {
      const spots = grid.spots.get(e) ?? [];
      targets = spots.filter((s) => !s.taken);
      if (!targets.length) targets = spots;
    }
    if (!targets.length) {
      const at = worldToTile(near.x, near.y);
      targets = [...grid.walk].map((k) => k.split(',').map(Number)).filter(([tx, ty]) => Math.max(Math.abs(tx - at.tx), Math.abs(ty - at.ty)) <= 4).map(([tx, ty]) => ({ tx, ty }));
    }
    if (!targets.length) return false;
    const target = [...targets].sort((a, b) => dist(a) - dist(b))[0];
    if (!e.petting && grid.spots.get(e)?.includes(target) && !target.taken) spot = target;
    // vom Ziel aus rückwärts bis zur ersten Wegkachel außerhalb des Bildes
    const view = this.scene.cameras.main.worldView;
    const outside = (tx, ty) => {
      const p = tileToWorld(tx, ty);
      return p.x < view.x - THANK_MARGIN || p.x > view.right + THANK_MARGIN || p.y < view.y - THANK_MARGIN || p.y - 60 > view.bottom + THANK_MARGIN;
    };
    let route = findRoute(grid, target, outside);
    let fade = false;
    if (route) route = [...route.reverse(), { tx: target.tx, ty: target.ty }]; // erste Kachel: außerhalb des Bildes
    else {
      // ganz kleiner Bereich (alles im Bild): vom nächsten Ausgang, sonst direkt am Ziel, sanft eingeblendet
      const exits = new Set(grid.exits.map((t) => t.tx + ',' + t.ty));
      const back = grid.exits.length ? findRoute(grid, target, (tx, ty) => exits.has(tx + ',' + ty)) : null;
      route = back ? [...back.reverse(), { tx: target.tx, ty: target.ty }] : [];
      fade = true;
    }
    const start = route.length > 1 ? route[0] : target;
    const sp = tileToWorld(start.tx, start.ty);
    const v = new Visitor(this.scene, this, sp.x, sp.y, wish.look);
    this.visitors.push(v);
    if (fade) {
      v.sprite.setAlpha(0);
      this.scene.tweens.add({ targets: v.sprite, alpha: 1, duration: 500 });
    }
    v.pen = e;
    v.thanks = wish;
    v.setWish(wish.species, true, wish.skin); // wiederzuerkennen an seiner Blase
    v.goal = 'thank';
    v.phase = 'walk';
    v.visitsLeft = 1; // nach diesem Gehege geht er
    if (spot) {
      spot.taken = v;
      v.spot = spot;
    }
    v.setRoute(route.length > 1 ? route.slice(1) : [], spot ? this.standPoint(spot) : null);
    this.thanking = wish;
    return true;
  }

  // der Wunsch-Besucher hat sich gefreut (bzw. ist vorher verschwunden: done false, dann kommt er beim nächsten Mal)
  thanked(v, done = true) {
    if (done) this.scene.wishThanked?.(v.thanks);
    v.thanks = null;
    this.thanking = null;
  }

  // steht er auf einer Brücke über einem Koi-Teich (und schaut den Koi zu)?
  koiBridge(v) {
    return !!(v.pen?.pond && v.pen.species?.includes('koi') && v.spot && objectAt(v.spot.tx, v.spot.ty)?.bridge);
  }

  // Koi von der Brücke aus füttern: ein Herz mehr (nicht zu oft hintereinander)
  feedKoi(v) {
    const e = v.pen;
    if (this.time - (this.lastFed.get(e) ?? -Infinity) < KOI_FEED_PAUSE) return;
    if (!this.scene.visitorFeedKoi?.(v)) return;
    this.lastFed.set(e, this.time);
    v.timer = Math.max(v.timer, 5); // noch etwas zuschauen, wie sie schnappen
    v.popHeart();
    this.scene.addHearts(1, 'koi');
  }

  // Futter ins Gehege werfen, wenn dort gerade Tiere fressen können (nicht zu oft dasselbe Gehege).
  // Im Streichelzoo (und Katzenhaus) nie: dort wird nur gestreichelt, sonst laufen alle Tiere zum Futter
  feed(v) {
    const e = v.pen;
    if (!e || e.petting || this.time - (this.lastFed.get(e) ?? -Infinity) < PEN_FEED_PAUSE) return;
    if (this.scene.feedEnclosure(e, v) > 0) {
      this.lastFed.set(e, this.time);
    }
  }

  remove(v) {
    v.clearWish();
    if (v.thanks) this.thanked(v, false);
    this.release(v);
    if (v.phase === 'ride') this.scene.wheel?.drop(v);
    this.visitors.splice(this.visitors.indexOf(v), 1);
    this.scene.tweens.add({ targets: [v.sprite, v.shadow, v.itemSprite].filter(Boolean), alpha: 0, duration: 400, onComplete: () => v.destroy() });
  }
}
