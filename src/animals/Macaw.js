// Ara (Dschungel): lebt paarweise in den Bäumen am Flussufer. Ab und zu fliegt das Paar ans andere Ufer: hoch aus der
// Krone, über dem Fluss im Tiefflug dicht übers Wasser, dann wieder hinauf in einen Uferbaum drüben. Nur im Tiefflug
// fängt man einen mit dem Kescher – am besten vom Kanu aus, wenn man vorausahnt, wohin sie fliegen. Bei Starkregen
// sitzen sie nur in den Bäumen und fliegen nicht.
// In der Voliere sitzt er auf Bäumen und Sitzstangen und fliegt von Platz zu Platz.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { LEVEL, MAP_W, MAP_H, charAt, inPen, isBlocked, objectAt } from '../world/map.js';

const PERCH_UP = { J: 98, Ṁ: 62 }; // so hoch sitzt er in der Krone (Urwaldbaum, Mangrove)
const SHORE_RANGE = 3; // Uferbäume: höchstens so viele Kacheln vom Fluss entfernt
const PERCH_TIME = [10, 20]; // so lange sitzt das Paar, dann fliegt es ans andere Ufer
const FLY_SPEED = 75; // Welt-Pixel pro Sekunde
const LOW = 10; // so tief fliegen sie über dem Wasser ...
const CRUISE = 48; // über Land (Ufer, Insel) fliegen sie höher – dort kommt man nicht heran
export const CATCH_LOW = 22; // ... und bis zu dieser Höhe erwischt man sie mit dem Kescher
const DIVE = 0.3; // Anteil des Flugs, auf dem sie hinunter- bzw. wieder hinaufgleiten
const PARTNER_DELAY = 0.45; // so viel später (Sekunden) fliegt der zweite hinterher
const FOLLOW_UP = 20; // folgt er Henrik, fliegt er so hoch hinter ihm her
const HIGH_DEPTH = 98990; // hoch in der Luft vor allen Bäumen
const PEN_FLY_EVERY = [8, 16]; // in der Voliere: so oft fliegt er eine kurze Strecke
const PEN_ALTITUDE = 26;
const PEN_FLY_SPEED = 55;
// Sitzplätze in der Voliere je Objekt: [Versatz zur Seite, Höhe über dem Boden] (Urwaldbaum: in der Krone, Sitzstange:
// oberer und unterer Querbalken, Mangrove: in der Krone)
const PEN_SEATS = {
  jungle_tree: [[-12, 96], [12, 92], [0, 100]],
  peacock_perch: [[-8, 32], [9, 21]],
  mangrove: [[-10, 60], [10, 58]],
};
const PEN_SIT = [5, 12]; // so lange sitzt er, dann fliegt er zu einem anderen Platz
const PEN_ARC = 18; // so viel höher fliegt er zwischen zwei Plätzen

export default class Macaw extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'macaw');
    this.altitude = 0;
    this.phase = null; // wild: 'perch' → 'fly' → 'perch'
  }

  // Uferbäume (Urwaldbäume und Mangroven nah am Fluss), mit der Seite des Flusses (Nord- bzw. Südufer)
  static shoreTrees() {
    const center = []; // Mitte des Flusses je Spalte
    for (let tx = 0; tx < MAP_W; tx++) {
      const ys = [];
      for (let ty = 0; ty < MAP_H; ty++) if (charAt(tx, ty) === '~' && ty > 8) ys.push(ty);
      center[tx] = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null;
    }
    const list = [];
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        const c = charAt(tx, ty);
        if (!PERCH_UP[c] || inPen(tx, ty) || center[tx] == null) continue;
        let near = false;
        for (let dy = -SHORE_RANGE; dy <= SHORE_RANGE && !near; dy++) for (let dx = -SHORE_RANGE; dx <= SHORE_RANGE && !near; dx++) near = charAt(tx + dx, ty + dy) === '~' && ty + dy > 8;
        if (near) list.push({ tx, ty, up: PERCH_UP[c], side: ty < center[tx] ? 'n' : 's' });
      }
    }
    return list;
  }

  // ein Paar in einen Uferbaum setzen; gibt die beiden zurück
  static spawnPair(scene) {
    const trees = Macaw.shoreTrees();
    const tree = Phaser.Utils.Array.GetRandom(trees);
    if (!tree) return [];
    const pair = { members: [] };
    return [0, 1].map((i) => {
      const a = scene.createAnimal('macaw', 0, 0);
      a.pair = pair;
      a.troop = pair; // zählt beim Spawner als ein Platz
      pair.members.push(a);
      a.perchIn(tree, i);
      a.perchTime = Phaser.Math.FloatBetween(...PERCH_TIME);
      return a;
    });
  }

  // in der Krone sitzen (i: zweiter des Paars etwas daneben)
  perchIn(tree, i = this.pair?.members.indexOf(this) ?? 0) {
    this.tree = tree;
    const p = tileToWorld(tree.tx, tree.ty);
    this.x = p.x + (i ? 12 : -10);
    this.y = p.y + (i ? 2 : 0);
    this.altitude = tree.up;
    this.phase = 'perch';
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'fly' && this.altitude <= CATCH_LOW && !this.fled;
  }

  canDespawn() {
    return this.phase === 'perch';
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild') return false; // fliegt
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return this.updatePen(dt, player);
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.phase === 'perch') {
      // der erste des Paars entscheidet, wann es losgeht; der zweite folgt ihm
      if (this.pair && this.pair.members[0] !== this) return false;
      if (LEVEL.season === 'rain') return false; // bei Starkregen bleiben sie sitzen
      this.perchTime -= dt;
      if (this.perchTime <= 0) this.flyAcross();
      return false;
    }
    if (this.phase === 'wait') {
      this.wait -= dt;
      if (this.wait <= 0) this.phase = 'fly';
      return false;
    }
    if (this.phase !== 'fly') return false;
    const f = this.flight;
    f.done = Math.min(f.total, f.done + FLY_SPEED * (this.fled ? 2 : 1) * dt); // erschrocken doppelt so schnell
    const t = f.done / f.total;
    this.x = f.from.x + (f.to.x - f.from.x) * t;
    this.y = f.from.y + (f.to.y - f.from.y) * t;
    // Höhe: aus der Krone hinunter, über Wasser im Tiefflug, über Land höher, am Ende wieder hinauf in die Krone drüben
    const ease = (k) => k * k * (3 - 2 * k);
    const { tx, ty } = worldToTile(this.x, this.y);
    const water = charAt(tx, ty) === '~' || charAt(tx, ty) === 'Ŝ';
    f.cruise = (f.cruise ?? f.fromUp) + ((water ? LOW : CRUISE) - (f.cruise ?? f.fromUp)) * Math.min(1, dt * 3);
    this.altitude = t < DIVE ? f.fromUp + (f.cruise - f.fromUp) * ease(t / DIVE) : t > 1 - DIVE ? f.cruise + (f.toUp - f.cruise) * ease((t - 1 + DIVE) / DIVE) : f.cruise;
    if (t >= 1) {
      if (this.fled) return this.scene.despawn(this), false; // der Partner wurde gefangen: er ist auf und davon
      this.perchIn(f.tree);
      this.perchTime = Phaser.Math.FloatBetween(...PERCH_TIME);
    }
    return true;
  }

  // das Paar fliegt zusammen zu einem Uferbaum auf der anderen Seite
  flyAcross(away = false) {
    const trees = Macaw.shoreTrees();
    const other = trees.filter((t) => t.side !== this.tree?.side);
    const pick = away
      ? [...trees].sort((a, b) => Math.hypot(b.tx - this.tree.tx, b.ty - this.tree.ty) - Math.hypot(a.tx - this.tree.tx, a.ty - this.tree.ty))[0]
      : Phaser.Utils.Array.GetRandom(other.length ? other : trees);
    if (!pick) return;
    const birds = this.pair ? this.pair.members.filter((a) => a.state === 'wild') : [this];
    birds.forEach((a, i) => {
      const to = tileToWorld(pick.tx, pick.ty);
      to.x += i ? 12 : -10;
      to.y += i ? 2 : 0;
      const from = { x: a.x, y: a.y };
      a.flight = { from, to, tree: pick, fromUp: a.altitude, toUp: pick.up, done: 0, total: Math.max(1, Math.hypot(to.x - from.x, to.y - from.y)) };
      a.faceX = Math.sign(to.x - from.x) || a.faceX;
      a.faceY = Math.sign(to.y - from.y) || a.faceY;
      a.phase = i ? 'wait' : 'fly';
      a.wait = PARTNER_DELAY * i;
    });
    this.scene.macawCall?.(this);
  }

  // in der Voliere: sitzt nur auf Bäumen und Sitzstangen (PEN_SEATS) und fliegt ab und zu zu einem anderen freien
  // Platz. Gibt es keinen Sitzplatz (mehr), wie früher: am Boden herumhüpfen und kurze Strecken fliegen
  updatePen(dt, player) {
    const seats = this.penSeats();
    if (!seats.length) return this.updatePenGround(dt, player);
    const f = this.penFlight;
    if (!f) {
      // noch kein Platz (gerade eingezogen, geladen): gleich auf einen freien setzen
      if (!this.seat || !seats.some((t) => t.key === this.seat.key)) {
        const free = this.freeSeats(seats);
        if (!free.length) return this.updatePenGround(dt, player);
        this.sitOn(Phaser.Utils.Array.GetRandom(free));
      }
      this.x = this.seat.x;
      this.y = this.seat.y;
      this.altitude = this.seat.up;
      this.penFlyIn = (this.penFlyIn ?? Phaser.Math.FloatBetween(2, PEN_SIT[1])) - dt;
      if (this.penFlyIn > 0) return false;
      this.penFlyIn = Phaser.Math.FloatBetween(...PEN_SIT);
      const free = this.freeSeats(seats).filter((t) => Math.hypot(t.x - this.x, t.y - this.y) > 20);
      const to = Phaser.Utils.Array.GetRandom(free);
      if (!to) return false;
      const from = this.seat;
      this.sitOn(to); // gleich reservieren, damit kein anderer dorthin fliegt
      this.penFlight = { from: { x: from.x, y: from.y, up: from.up }, to, done: 0, total: Math.max(1, Math.hypot(to.x - from.x, to.y - from.y)) };
      return false;
    }
    // im Bogen von Platz zu Platz (Höhe von Sitz zu Sitz, dazwischen etwas höher)
    f.done = Math.min(f.total, f.done + PEN_FLY_SPEED * dt);
    const k = f.done / f.total;
    this.x = f.from.x + (f.to.x - f.from.x) * k;
    this.y = f.from.y + (f.to.y - f.from.y) * k;
    this.altitude = f.from.up + (f.to.up - f.from.up) * k + Math.sin(k * Math.PI) * PEN_ARC;
    this.faceX = Math.sign(f.to.x - f.from.x) || this.faceX;
    this.faceY = Math.sign(f.to.y - f.from.y) || this.faceY;
    if (k >= 1) this.penFlight = null;
    return true;
  }

  // Sitzplätze in der eigenen Voliere (Bäume und Sitzstangen, je Objekt ein paar Plätze)
  penSeats() {
    const e = this.enclosure;
    if (!e) return [];
    const seats = []; // jedes Mal neu (nach einem Ausbau kommen Plätze dazu)
    for (const { tx, ty } of e.tiles) {
      const spots = PEN_SEATS[objectAt(tx, ty)?.key];
      if (!spots) continue;
      const p = tileToWorld(tx, ty);
      spots.forEach(([dx, up], i) => seats.push({ key: `${tx},${ty},${i}`, x: p.x + dx, y: p.y + 2, up }));
    }
    return seats;
  }

  freeSeats(seats) {
    const taken = new Set(this.scene.animals.filter((a) => a !== this && a.species === 'macaw' && a.state === 'penned' && a.seat).map((a) => a.seat.key));
    return seats.filter((t) => !taken.has(t.key));
  }

  sitOn(seat) {
    this.seat = seat;
    // Blick vom Stamm weg (zur Seite, auf der er sitzt), meist nach vorne
    this.faceY = 1;
  }

  // ohne Sitzplätze: herumhüpfen, ab und zu eine kurze Strecke fliegen
  updatePenGround(dt, player) {
    this.seat = null;
    const f = this.penFlight;
    if (!f) {
      this.altitude = 0;
      this.penFlyIn = (this.penFlyIn ?? Phaser.Math.FloatBetween(2, PEN_FLY_EVERY[1])) - dt;
      if (this.penFlyIn > 0) return super.updateFree(dt, player);
      this.penFlyIn = Phaser.Math.FloatBetween(...PEN_FLY_EVERY);
      const spots = (this.enclosure?.tiles ?? []).filter(({ tx, ty }) => !isBlocked(tx, ty) && this.enclosure.tileSet.has(tx + ',' + ty));
      const t = Phaser.Utils.Array.GetRandom(spots);
      if (t) {
        const to = tileToWorld(t.tx, t.ty);
        this.penFlight = { from: { x: this.x, y: this.y, up: 0 }, to: { ...to, up: 0 }, done: 0, total: Math.max(1, Math.hypot(to.x - this.x, to.y - this.y)) };
      }
      return false;
    }
    f.done = Math.min(f.total, f.done + PEN_FLY_SPEED * dt);
    const k = f.done / f.total;
    this.x = f.from.x + (f.to.x - f.from.x) * k;
    this.y = f.from.y + (f.to.y - f.from.y) * k;
    this.altitude = Math.sin(k * Math.PI) * PEN_ALTITUDE;
    this.faceX = Math.sign(f.to.x - f.from.x) || this.faceX;
    this.faceY = Math.sign(f.to.y - f.from.y) || this.faceY;
    if (k >= 1) {
      this.penFlight = null;
      this.altitude = 0;
      this.pickWander();
    }
    return true;
  }

  flying() {
    return (this.state === 'wild' && this.phase === 'fly') || (this.state === 'penned' && !!this.penFlight);
  }

  render(moving) {
    const follow = this.state === 'following'; // folgt Henrik: fliegt hinter ihm her
    const fly = this.flying() || follow;
    const altitude = follow ? FOLLOW_UP : this.altitude;
    const base = this.baseTexture();
    // Flügelschlag-Animation (Video) für die Blickrichtung, sonst das Flugbild
    const flaps = this.skin ? this.kind.skinFlyAnims?.[this.skin] : this.kind.flyAnims;
    const flap = fly && flaps && (this.faceY > 0 ? flaps.down : flaps.up);
    const flapping = flap && this.scene.anims.exists(flap);
    // gelandet: zurück aufs normale Bild, damit die Sitz-Animation greift
    if (!fly && flaps && Object.values(flaps).includes(this.sprite.texture.key)) this.showStill(base);
    if (flapping) {
      if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== flap) this.sprite.play(flap);
      this.sprite.setFlipX(this.faceX < 0);
      this.placeSprite(false);
    } else {
      const key = fly ? `${base}_fly` : base;
      if (fly) {
        this.sprite.stop();
        if (this.sprite.texture.key !== key && this.scene.textures.exists(key)) this.sprite.setTexture(key, this.sprite.frame.name);
      } else this.useLook(key); // eine laufende Sitz-Animation weiterlaufen lassen (sonst startet sie jedes Bild neu)
      super.render(moving && !fly && !altitude);
      // im Flug immer die Vorderansicht nach rechts (Bild 1), nach links gespiegelt – auch beim Flug nach oben
      if (fly) this.sprite.setFrame(0).setFlipX(this.faceX < 0);
      else if (!this.sprite.anims.isPlaying) this.sprite.setFlipX(false);
    }
    this.shadow.setVisible(fly || !altitude); // oben in der Krone ohne Schatten am Boden
    if (!altitude && !fly) return;
    // in der Luft bzw. oben in der Krone: höher gezeichnet; im Flug mit Flügelschlag-Wippen
    const bob = fly && !flapping ? Math.sin(this.scene.time.now / 90) * 1.5 : 0; // Flügelschlag-Wippen (ohne Animation)
    this.sprite.setY(this.sprite.y - altitude + bob);
    this.sprite.setAngle(0); // im Flug aufrecht (wie gemalt)
    this.sprite.setDepth(altitude > 30 && fly && this.state !== 'penned' ? HIGH_DEPTH : this.y + 2); // in der Voliere unter dem Netz
    this.shadow.setScale(1 - Math.min(0.6, altitude / 160));
  }

  catch() {
    this.altitude = 0;
    this.phase = null;
    const mate = this.pair?.members.find((a) => a !== this && a.state === 'wild');
    if (this.pair) this.pair.members.splice(this.pair.members.indexOf(this), 1);
    this.pair = null;
    this.troop = null;
    super.catch();
    // der andere erschrickt und fliegt weit weg – ihn fängt man nicht mehr (sonst fängt man zu viele), er verschwindet
    if (mate) {
      mate.fled = true;
      if (mate.phase !== 'fly') mate.flyAcross(true);
    }
  }

  restore(state) {
    super.restore(state);
    this.altitude = 0;
    this.phase = null;
    this.penFlight = null;
    this.seat = null;
  }
}

