// Papageitaucher (Eiswelt, nur tagsüber): eine Kolonie auf den kleinen Felsinseln im Fjord (Schneefelsen Ɵ/Ȟ mitten im
// Wasser – dort kommt Henrik nicht hin). Jeder sitzt eine Weile oben auf einem Inselfelsen, fliegt dann aufs Meer
// hinaus (puffin_fly) und kommt zurück. Nur ab und zu (VISIT_CHANCE) fliegt einer stattdessen ans Ufer hinüber, landet
// neben einem Vogelfelsen am Fjordufer und steht dort ein paar Sekunden – nur jetzt fängt man ihn mit dem Kescher. Danach
// fliegt er zurück auf seine Insel. Er flieht nicht; wer den Moment verpasst, wartet auf den nächsten Besuch.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { MAP_W, MAP_H, charAt, isBlocked, inPen, LEVEL } from '../world/map.js';
import { inHall, resetHallFlight, updateHallFlight } from './hallFlight.js';
import { isActive } from '../world/events.js';
// Papageitaucher-Zug (Event, docs/plan-papageitaucher.md): Gruppen fliegen vom Meer zu den Felsformationen am Rand der
// Karte (LEVEL.puffinRocks, siehe arriveFromSea); dort sitzen sie oben, und oft fliegt einer an den Fuß des Felsens und
// steht länger (EVENT_LANDED). Ist das Event vorbei, fliegen sie aufs Meer hinaus und sind fort (mode 'gone').

const ROCKS = { Ɵ: { lift: 36, dx: 14 }, Ȟ: { lift: 30, dx: 6 } }; // Vogelfelsen: so hoch sitzt er oben drauf
const PERCH_TIME = [8, 16]; // so lange sitzt er auf seinem Inselfelsen ...
const AWAY_TIME = [5, 10]; // ... ist auf dem Meer ...
const LANDED_TIME = 5; // ... bzw. steht am Ufer (fangbar)
const VISIT_CHANCE = 0.3; // so oft fliegt er statt aufs Meer ans Ufer hinüber ...
const VISIT_CHANCE_SMALL = 0.5; // ... auf den kleinen Expeditions-Maps
const NEAR_LANDINGS = 6; // er landet an einem dieser Uferplätze, die Henrik am nächsten sind
const dist = (t, player) => {
  const p = tileToWorld(t.tx, t.ty);
  return Math.hypot(p.x - player.x, (p.y - player.y) * 2);
};
const FLY_TIME = 2.2; // so lange dauert ein Flug
const FLY_ARC = 60; // so hoch steigt er dabei zusätzlich
const SEA_DIST = 420; // so weit fliegt er hinaus (Welt-Pixel)
const FLY_ANIM = 'puffin_fly_anim'; // Flügelschlag (Video, Seitenansicht nach rechts)
// Papageitaucher-Zug: so lange steht einer am Fuß des Felsens (fangbar; sonst LANDED_TIME), so oft fliegt er dorthin
// bzw. kurz aufs Meer, statt sitzen zu bleiben, und so lange sitzt er sonst oben
const EVENT_LANDED = [10, 12];
const EVENT_VISIT = 0.5;
const EVENT_AWAY = 0.15;
const EVENT_PERCH = [4, 9];
// gefangen: fliegt hinter dem Spieler her, solange der läuft (wie alle Vögel); bleibt er stehen, landet er
const FOLLOW_LIFT = 22; // so hoch
const FOLLOW_CLIMB = 4; // so schnell steigt bzw. sinkt er

// Felsformationen des Events: je Gruppe die Felsen und die freien Uferkacheln daneben (dort landen sie); einmal je Karte
let rocksFor = null;
let formations = [];
const AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
export function puffinFormations() {
  if (rocksFor === LEVEL) return formations;
  rocksFor = LEVEL;
  const water = (x, y) => charAt(x, y) === '~';
  formations = (LEVEL.puffinRocks ?? []).map((group) => {
    const rocks = group.map(([tx, ty]) => ({ tx, ty, c: charAt(tx, ty) })).filter((r) => ROCKS[r.c]);
    const spots = [];
    for (const r of rocks) {
      for (const [dx, dy] of AROUND) {
        const tx = r.tx + dx;
        const ty = r.ty + dy;
        if (charAt(tx, ty) !== '.' || isBlocked(tx, ty) || spots.some((t) => t.tx === tx && t.ty === ty)) continue;
        if (AROUND.some(([ex, ey]) => water(tx + ex, ty + ey) || water(tx + 2 * ex, ty + 2 * ey))) spots.push({ tx, ty });
      }
    }
    return { rocks, spots };
  }).filter((f) => f.rocks.length && f.spots.length);
  return formations;
}

// Vogelfelsen: Inselfelsen (rundum Wasser, unerreichbar) und Uferfelsen am Wasser; freie Uferkacheln neben den
// Uferfelsen (dort landet er beim Besuch); einmal je Karte
let cacheFor = null;
let islets = [];
let landings = [];
function colony() {
  if (cacheFor === LEVEL) return;
  cacheFor = LEVEL;
  islets = [];
  const shore = [];
  landings = [];
  const near = (tx, ty, r, test) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (test(tx + dx, ty + dy)) return true;
    return false;
  };
  const water = (x, y) => charAt(x, y) === '~';
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      const c = charAt(tx, ty);
      if (!ROCKS[c] || inPen(tx, ty)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => water(tx + dx, ty + dy))) islets.push({ tx, ty, c });
      else if (near(tx, ty, 2, water)) shore.push({ tx, ty, c });
    }
  }
  if (!islets.length) islets = shore; // (Karte ohne Inselfelsen: dann eben auf den Uferfelsen)
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (charAt(tx, ty) !== '.' || isBlocked(tx, ty)) continue;
      if (near(tx, ty, 1, (x, y) => shore.some((r) => r.tx === x && r.ty === y)) && near(tx, ty, 2, water)) landings.push({ tx, ty });
    }
  }
}

// Platz oben auf einem Felsen: Bodenpunkt und Höhe
function rockSeat(rock) {
  const p = tileToWorld(rock.tx, rock.ty);
  const def = ROCKS[rock.c];
  return { x: p.x + def.dx + Phaser.Math.Between(-10, 10), y: p.y + 3, h: def.lift };
}

export default class Puffin extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'puffin');
    this.mode = null; // perch | fly | away | landed
    this.left = 0;
    this.fly = null; // { from: {x, y, h}, to: {x, y, h}, t, then }
    this.lift = 0; // so hoch über seinem Bodenpunkt (oben auf dem Felsen)
    this.home = null; // sein Inselfelsen
    this.formation = null; // Papageitaucher-Zug: seine Felsformation am Rand (sonst null)
    this.followLift = 0; // folgt er dem Spieler: so hoch fliegt er gerade
  }

  // Papageitaucher-Zug: draußen auf dem Meer erscheinen und (nach delay Sekunden, damit eine Gruppe nicht im Gleichschritt
  // ankommt) zur Felsformation f fliegen
  arriveFromSea(f, delay = 0) {
    this.formation = f;
    this.home = Phaser.Utils.Array.GetRandom(f.rocks);
    const seat = rockSeat(this.home);
    const c = tileToWorld(MAP_W / 2, MAP_H / 2);
    const a = Math.atan2(seat.y - c.y, seat.x - c.x) + Phaser.Math.FloatBetween(-0.5, 0.5);
    this.x = seat.x + Math.cos(a) * SEA_DIST;
    this.y = seat.y + Math.sin(a) * SEA_DIST * 0.5;
    this.lift = 40;
    this.mode = 'away';
    this.left = delay;
  }

  // vom Felsen weg aufs Meer hinaus (then: 'away' kommt wieder, 'gone' ist fort)
  flySea(then) {
    const c = tileToWorld(MAP_W / 2, MAP_H / 2);
    const a = Math.atan2(this.y - c.y, this.x - c.x) + Phaser.Math.FloatBetween(-0.6, 0.6);
    this.startFly({ x: this.x + Math.cos(a) * SEA_DIST, y: this.y + Math.sin(a) * SEA_DIST * 0.5, h: 40 }, then);
  }

  // erscheinen: am Ufer bei den Vogelfelsen (setzt sich gleich auf seinen Inselfelsen)
  static spawnTiles() {
    colony();
    return landings;
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.mode === 'landed';
  }

  canDespawn() {
    return this.mode !== 'landed';
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild') return false;
    return super.blocked(x, y);
  }

  // auf den eigenen Inselfelsen setzen (ohne Flug, beim Erscheinen)
  sitHome() {
    colony();
    this.home ??= Phaser.Utils.Array.GetRandom(islets);
    if (!this.home) return false;
    const seat = rockSeat(this.home);
    this.x = seat.x;
    this.y = seat.y;
    this.lift = seat.h;
    this.mode = 'perch';
    this.left = Phaser.Math.FloatBetween(2, PERCH_TIME[1]);
    this.faceY = 1;
    return true;
  }

  // losfliegen; then: was nach der Ankunft kommt ('perch', 'away' oder 'landed')
  startFly(to, then) {
    this.fly = { from: { x: this.x, y: this.y, h: this.lift }, to, t: 0, then };
    this.mode = 'fly';
    this.faceX = to.x < this.x ? -1 : 1;
    this.faceY = to.y < this.y ? -1 : 1;
  }

  flyHome() {
    this.startFly(rockSeat(this.home), 'perch');
  }

  updateFree(dt, player) {
    if (inHall(this)) return updateHallFlight(this, dt, () => super.updateFree(dt, player)); // Polarhalle im Tierpark
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (!this.mode && !this.sitHome()) return false;
    if (this.fly) {
      this.fly.t += dt / FLY_TIME;
      const k = Math.min(1, this.fly.t);
      const { from, to } = this.fly;
      this.x = from.x + (to.x - from.x) * k;
      this.y = from.y + (to.y - from.y) * k;
      this.lift = from.h + (to.h - from.h) * k + Math.sin(Math.PI * k) * FLY_ARC;
      if (k >= 1) {
        this.mode = this.fly.then;
        this.lift = to.h;
        this.fly = null;
        const ev = !!this.formation || !!this.scene.expPuffins?.(); // (Papageitaucher-Zug, auch als Event-Karte der Expedition: kürzer oben, länger am Fuß)
        this.left = Phaser.Math.FloatBetween(...(this.mode === 'perch' ? (ev ? EVENT_PERCH : PERCH_TIME) : this.mode === 'away' ? AWAY_TIME : ev ? EVENT_LANDED : [LANDED_TIME, LANDED_TIME]));
        this.faceY = 1;
      }
      return true;
    }
    if (this.mode === 'gone') return false;
    if (this.formation) return this.updateEvent(dt);
    this.left -= dt;
    if (this.left > 0) return false;
    if (this.mode === 'perch') {
      colony();
      // Besuch am Ufer: an einem der Plätze nahe bei Henrik (sonst landet er oft dort, wo man gerade nicht ist, und man
      // sieht nur das Hin und Her zwischen Meer und Inselfelsen); auf den kleinen Expeditions-Maps öfter
      const near = [...landings].sort((a, b) => dist(a, player) - dist(b, player)).slice(0, NEAR_LANDINGS);
      const chance = this.scene.expPuffins?.() ? EVENT_VISIT + 0.2 : LEVEL.expedition ? VISIT_CHANCE_SMALL : VISIT_CHANCE; // (Event-Karte: noch öfter)
      const spot = Math.random() < chance && Phaser.Utils.Array.GetRandom(near);
      if (spot) {
        // Besuch am Ufer: landen neben einem Vogelfelsen
        const p = tileToWorld(spot.tx, spot.ty);
        this.startFly({ x: p.x + Phaser.Math.Between(-8, 8), y: p.y + Phaser.Math.Between(-4, 4), h: 0 }, 'landed');
      } else {
        // aufs Meer hinaus (vom Felsen weg, zum Rand der Karte hin)
        const c = tileToWorld(MAP_W / 2, MAP_H / 2);
        const a = Math.atan2(this.y - c.y, this.x - c.x) + Phaser.Math.FloatBetween(-0.6, 0.6);
        this.startFly({ x: this.x + Math.cos(a) * SEA_DIST, y: this.y + Math.sin(a) * SEA_DIST * 0.5, h: 40 }, 'away');
      }
    } else {
      this.flyHome(); // vom Meer bzw. vom Ufer zurück auf die Insel
    }
    return false;
  }

  // Papageitaucher-Zug: sitzt oben auf seiner Formation, fliegt oft an deren Fuß (dort fangbar), selten kurz aufs Meer;
  // nach dem Event fliegt er fort
  updateEvent(dt) {
    if (!isActive('puffins')) {
      this.flySea('gone');
      return false;
    }
    this.left -= dt;
    if (this.left > 0) return false;
    if (this.mode === 'perch') {
      const r = Math.random();
      if (r < EVENT_VISIT) {
        const spot = Phaser.Utils.Array.GetRandom(this.formation.spots);
        const p = tileToWorld(spot.tx, spot.ty);
        this.startFly({ x: p.x + Phaser.Math.Between(-6, 6), y: p.y + Phaser.Math.Between(-3, 3), h: 0 }, 'landed');
      } else if (r < EVENT_VISIT + EVENT_AWAY) this.flySea('away');
      else this.left = Phaser.Math.FloatBetween(...EVENT_PERCH);
      return false;
    }
    this.home = Phaser.Utils.Array.GetRandom(this.formation.rocks); // vom Meer bzw. vom Fuß zurück auf einen Felsen
    this.flyHome();
    return false;
  }

  catch() {
    this.formation = null;
    this.mode = null;
    this.fly = null;
    this.lift = 0;
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.mode = null;
    this.fly = null;
    this.lift = 0;
    this.formation = null;
    resetHallFlight(this);
  }

  // fliegt gerade (draußen oder in der Polarhalle)?
  get flying() {
    if (this.state === 'following') return this.followLift > 0;
    if (inHall(this) && this.hallUp) return !!this.hallFlight;
    return this.state === 'wild' && !!this.fly;
  }

  // Flugbild: Flügelschlag-Animation in Seitenansicht (nach rechts gemalt, nach links gespiegelt); ohne sie das Standbild
  showFly(frame) {
    const s = this.sprite;
    if (this.scene.anims.exists(FLY_ANIM)) {
      if (!s.anims.isPlaying || s.anims.currentAnim?.key !== FLY_ANIM) s.play(FLY_ANIM).setOrigin(0.5, this.kind.originY);
      s.setFlipX(this.faceX < 0);
    } else s.setTexture('puffin_fly', frame).setFlipX(false);
  }

  render(moving) {
    const f = this.kind.frames;
    const frame = this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
    if (this.state === 'following') {
      const dt = this.scene.game.loop.delta / 1000;
      const target = moving && !this.baby ? FOLLOW_LIFT : 0; // Küken fliegen noch nicht
      this.followLift += (target - this.followLift) * Math.min(1, dt * FOLLOW_CLIMB);
      if (this.followLift < 0.5) this.followLift = 0;
    } else this.followLift = 0;
    const flying = this.flying;
    // gelandet: vom Flugbild zurück aufs Standbild (die Steh-Animation startet Animal.render)
    if (!flying && (this.sprite.texture.key === FLY_ANIM || this.sprite.texture.key === 'puffin_fly')) this.showStill('puffin');
    if (flying) {
      this.showFly(frame);
      this.placeSprite(false);
    } else super.render(moving);
    if (inHall(this) && this.hallUp) {
      // in der Polarhalle: oben auf einem Felsen bzw. im Flug zum nächsten
      this.sprite.setAlpha(1).setVisible(true);
      this.sprite.setY(this.sprite.y - this.hallUp).setDepth(this.y + 60);
      this.shadow.setVisible(!!this.hallFlight);
      return;
    }
    if (this.state !== 'wild') {
      this.sprite.setAlpha(1).setVisible(true);
      if (this.followLift) this.sprite.setY(this.sprite.y - this.followLift - Math.sin(this.scene.time.now / 140) * 1.5); // fliegt hinter dem Spieler her
      return;
    }
    const away = this.mode === 'away' || this.mode === 'gone';
    this.sprite.setVisible(!away);
    this.shadow.setVisible(!away && !this.lift);
    if (this.fly) {
      const k = Math.min(1, this.fly.t);
      // aufs Meer: weit draußen ausblenden; vom Meer zurück: einblenden
      const fade = this.fly.then === 'away' || this.fly.then === 'gone' ? 1 -Math.max(0, k - 0.7) / 0.3 : this.fly.from.h === 40 ? Math.min(1, k / 0.3) : 1;
      this.sprite.setAlpha(fade);
    } else this.sprite.setAlpha(1);
    if (this.lift) this.sprite.setY(this.sprite.y - this.lift).setDepth(this.y + 60); // oben auf dem Felsen bzw. in der Luft
  }
}
