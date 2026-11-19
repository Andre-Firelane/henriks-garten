// Igel (Wald, vor allem im Eichenhain): sitzt wild versteckt in einem Laubhaufen (ɫ) – man sieht ihn nicht, aber ab und
// zu raschelt der Haufen (er wackelt, ein paar Blätter fliegen heraus). Legt Henrik Eicheln daneben (aus der Eiche
// geschüttelt, siehe placeAcorns in GardenScene), schnuppert er kurz und kommt heraus, trippelt hin und frisst sie. Danach schnüffelt er noch
// eine Weile in der Nähe herum und kriecht dann zurück in seinen Haufen. Solange er draußen ist, fängt man ihn mit dem
// Kescher oder durch Berühren. Gefangen, folgend und im Gehege ist er ein normales kleines Tier.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { LEVEL, MAP_W, MAP_H, charAt, enclosureAt } from '../world/map.js';

const RUSTLE_EVERY = [3, 7]; // so oft raschelt der Haufen, in dem er sitzt (Sekunden) ...
const RUSTLE_NEAR = 520; // ... aber nur, wenn Henrik so nah ist (Welt-Pixel, Höhe doppelt gezählt)
const NUT_RANGE = 70; // so nah müssen die Eicheln an seinem Haufen liegen
const SNIFF_TIME = 1.6; // so lange raschelt es noch, bevor er herauskommt
const TRIP_SPEED = 26; // Trippeln zu den Eicheln und zurück
const EAT_TIME = [7, 10]; // so lange frisst er
const ROAM_TIME = [10, 16]; // so lange schnüffelt er danach noch herum
const ROAM_RANGE = 40; // ... so weit um die Stelle mit den Eicheln
const LEAF_COLORS = [0xd67c30, 0xbe4828, 0xe2b046, 0xa26632];
// im Gehege: so lange trippelt er herum, dann kriecht er in einen Laubhaufen seines Geheges und bleibt so lange darin
const PEN_ROAM = [12, 25];
const PEN_HIDE = [8, 16];
const PEN_WALK_TIMEOUT = 16; // kommt er nicht hin, versucht er es später wieder
const OUT_SPOTS = [[0, 12], [-14, 7], [14, 7], [-14, -7], [14, -7]]; // hier kommt er wieder heraus (frei, neben dem Haufen)

// alle Laubhaufen der Karte (einmal je Szene)
export function leafPiles(scene) {
  if (scene._leafPiles?.level === LEVEL) return scene._leafPiles.list;
  const list = [];
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) if (charAt(tx, ty) === 'ɫ') list.push({ tx, ty, ...tileToWorld(tx, ty) });
  scene._leafPiles = { level: LEVEL, list };
  return list;
}

export default class Hedgehog extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'hedgehog');
    this.phase = 'hidden';
    this.pile = null;
    this.rustleIn = Phaser.Math.FloatBetween(1, RUSTLE_EVERY[1]);
    this.sprite.setVisible(false); // versteckt von Anfang an (sonst blitzt er ein Bild lang auf)
    this.shadow.setVisible(false);
  }

  // in einen freien Laubhaufen (in dem noch kein anderer Igel sitzt); false, wenn keiner frei ist
  hideSomewhere() {
    const taken = new Set(this.scene.animals.filter((a) => a !== this && a.species === 'hedgehog' && a.pile).map((a) => a.pile));
    const free = leafPiles(this.scene).filter((p) => !taken.has(p));
    const pile = Phaser.Utils.Array.GetRandom(free);
    if (!pile) return false;
    this.hideIn(pile);
    return true;
  }

  hideIn(pile) {
    this.pile = pile;
    this.phase = 'hidden';
    this.x = pile.x;
    this.y = pile.y;
    this.nuts = null;
  }

  isHidden() {
    return this.state === 'wild' && this.phase === 'hidden';
  }

  canDespawn() {
    return this.isHidden();
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase !== 'hidden' && this.phase !== 'sniff';
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return this.updatePen(dt, player);
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (!this.pile && !this.hideSomewhere()) return false;
    const near = Math.hypot(player.x - this.x, (player.y - this.y) * 2) < RUSTLE_NEAR;
    if (this.phase === 'hidden') {
      // Eicheln neben seinem Haufen? Dann schnuppern (es raschelt kräftig) und gleich herauskommen
      const nuts = this.scene.pickups.find((p) => p.tool === 'acorns' && !p.collected && !p.claimed && Math.hypot(p.x - this.pile.x, (p.y - this.pile.y) * 2) < NUT_RANGE);
      if (nuts) {
        nuts.claimed = true;
        this.nuts = nuts;
        this.phase = 'sniff';
        this.phaseTime = SNIFF_TIME;
        this.rustle(true);
        return false;
      }
      this.rustleIn -= dt;
      if (this.rustleIn <= 0) {
        this.rustleIn = Phaser.Math.FloatBetween(...RUSTLE_EVERY);
        if (near) this.rustle(false);
      }
      return false;
    }
    if (this.phase === 'sniff') {
      this.phaseTime -= dt;
      if (this.phaseTime > 0) return false;
      this.phase = 'out'; // aus dem Haufen heraus, zu den Eicheln
    }
    if (this.phase === 'out') {
      if (this.nuts.collected) return this.goHome(); // Henrik hat die Eicheln wieder aufgehoben
      const spot = { x: this.nuts.x - Math.sign(this.nuts.x - this.pile.x || 1) * 8, y: this.nuts.y };
      if (this.tripTo(spot, dt)) return true;
      this.phase = 'eat';
      this.phaseTime = Phaser.Math.FloatBetween(...EAT_TIME);
      this.faceX = Math.sign(this.nuts.x - this.x) || this.faceX;
      return false;
    }
    if (this.phase === 'eat') {
      this.phaseTime -= dt;
      this.eatBob = (this.eatBob ?? 0) + dt;
      if (this.phaseTime > 0 && !this.nuts.collected) return false;
      if (!this.nuts.collected) this.scene.eatAcorns?.(this.nuts);
      this.phase = 'roam';
      this.phaseTime = Phaser.Math.FloatBetween(...ROAM_TIME);
      this.leash = { x: this.x, y: this.y, r: ROAM_RANGE };
      this.pickWander();
      return false;
    }
    if (this.phase === 'roam') {
      this.phaseTime -= dt;
      if (this.phaseTime <= 0) return this.goHome();
      return super.updateFree(dt, player);
    }
    if (this.phase === 'home') {
      if (this.tripTo(this.pile, dt)) return true;
      this.hideIn(this.pile);
      this.rustle(false);
      return false;
    }
    return false;
  }

  // Im Gehege: herumtrippeln → zu einem freien Laubhaufen des Geheges → darin verstecken (raschelt ab und zu) → heraus
  updatePen(dt, player) {
    const c = this.penPile;
    this.penTime = (this.penTime ?? Phaser.Math.FloatBetween(4, PEN_ROAM[1])) - dt;
    if (!c) {
      if (this.penTime > 0) return super.updateFree(dt, player);
      this.penTime = Phaser.Math.FloatBetween(...PEN_ROAM);
      const pile = this.penPileFree();
      if (pile) {
        this.penPile = { pile, phase: 'walk' };
        this.penTime = PEN_WALK_TIMEOUT;
      }
      return false;
    }
    if (c.phase === 'walk') {
      if (this.penTime <= 0) return this.leavePile(false);
      if (this.tripTo(c.pile, dt)) return true;
      c.phase = 'in';
      this.pile = c.pile;
      this.penTime = Phaser.Math.FloatBetween(...PEN_HIDE);
      this.rustleIn = Phaser.Math.FloatBetween(...RUSTLE_EVERY);
      this.rustle(false);
      return false;
    }
    // im Haufen: ab und zu raschelt es, dann kommt er wieder heraus
    this.rustleIn -= dt;
    if (this.rustleIn <= 0) {
      this.rustleIn = Phaser.Math.FloatBetween(...RUSTLE_EVERY);
      this.rustle(false);
    }
    if (this.penTime <= 0) return this.leavePile(true);
    return false;
  }

  // ein Laubhaufen im eigenen Gehege, in dem gerade kein anderer Igel sitzt (oder null)
  penPileFree() {
    if (!this.enclosure) return null;
    const taken = this.scene.animals.filter((a) => a !== this && a.penPile).map((a) => a.penPile.pile);
    const piles = leafPiles(this.scene).filter((p) => enclosureAt(p.tx, p.ty) === this.enclosure && !taken.includes(p));
    return Phaser.Utils.Array.GetRandom(piles) ?? null;
  }

  // aus dem Haufen heraus (out: er saß drin – raschelt und steht dann neben dem Haufen)
  leavePile(out) {
    const c = this.penPile;
    this.penPile = null;
    this.penTime = Phaser.Math.FloatBetween(...PEN_ROAM);
    if (out && c) {
      this.rustle(false);
      const spot = OUT_SPOTS.find(([dx, dy]) => !this.blocked(c.pile.x + dx, c.pile.y + dy)) ?? [0, 12];
      this.x = c.pile.x + spot[0];
      this.y = c.pile.y + spot[1];
      this.faceY = 1;
    }
    this.pile = null;
    this.pickWander();
    return false;
  }

  goHome() {
    this.phase = 'home';
    this.leash = null;
    return false;
  }

  // ein Stück trippeln (ohne Hindernisse: der Weg zwischen Haufen und Nüssen ist kurz); false, wenn angekommen
  tripTo(p, dt) {
    const dx = p.x - this.x, dy = p.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return false;
    const step = Math.min(d, TRIP_SPEED * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    if (Math.abs(dx) > d * 0.3) this.faceX = Math.sign(dx);
    if (Math.abs(dy) > d * 0.3) this.faceY = Math.sign(dy);
    return true;
  }

  // der Haufen wackelt, ein paar Blätter fliegen heraus (strong: mehr Blätter, beim Schnuppern an den Eicheln)
  rustle(strong) {
    const scene = this.scene;
    scene.sway?.shake(this.pile.tx, this.pile.ty);
    const n = strong ? 7 : 3;
    for (let i = 0; i < n; i++) {
      const leaf = scene.add.ellipse(this.pile.x + Phaser.Math.Between(-10, 10), this.pile.y - Phaser.Math.Between(8, 16), 4, 2.4, Phaser.Utils.Array.GetRandom(LEAF_COLORS)).setDepth(this.pile.y + 1);
      scene.tweens.add({
        targets: leaf,
        x: leaf.x + Phaser.Math.Between(-18, 18),
        y: leaf.y - Phaser.Math.Between(6, 14),
        angle: Phaser.Math.Between(-180, 180),
        duration: 350,
        ease: 'Quad.easeOut',
        yoyo: false,
        onComplete: () => scene.tweens.add({ targets: leaf, y: leaf.y + 14, alpha: 0, duration: 500, ease: 'Quad.easeIn', onComplete: () => leaf.destroy() }),
      });
    }
  }

  render(moving) {
    const hidden = this.isHidden() || (this.state === 'wild' && this.phase === 'sniff') || (this.state === 'penned' && this.penPile?.phase === 'in');
    this.sprite.setVisible(!hidden);
    this.shadow.setVisible(!hidden);
    if (hidden) return;
    super.render(moving);
    // beim Fressen nickt er mit dem Kopf
    if (this.state === 'wild' && this.phase === 'eat') this.sprite.setAngle(Math.sin((this.eatBob ?? 0) * 9) * 4 * this.faceX);
  }

  // im Laubhaufen kann man ihn nicht füttern
  canFeed() {
    return super.canFeed() && !this.penPile;
  }

  catch() {
    super.catch();
    this.penPile = null;
    this.pile = null;
    this.leash = null;
    this.phase = 'caught';
  }

  restore(state) {
    this.penPile = null;
    this.penTime = undefined;
    super.restore(state);
    if (state === 'wild') {
      this.pile = null;
      this.phase = 'hidden';
    }
  }
}
