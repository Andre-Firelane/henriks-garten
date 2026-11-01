// Ameisenbär (Dschungel, bei jedem Wetter): scheu wie das Zebra, rennt weg und lässt sich sonst nur mit dem Lasso fangen.
// Ab und zu geht er zu einem Urwaldbaum, richtet sich auf, stützt die Vorderpfoten an den Stamm und schleckt Ameisen.
// Solange er frisst, flieht er nicht und lässt sich durch Berühren fangen. Durch Dickicht läuft er einfach hindurch
// (siehe kind.thicket). Im Gehege geht er genauso zu den Bäumen dort.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, TILE_W } from '../world/iso.js';
import { JUNGLE_TREES, charAt } from '../world/map.js';

const EAT_EVERY = [15, 35]; // Sekunden zwischen zwei Gängen zum Baum
const EAT_TIME = [6, 10]; // so lange schleckt er Ameisen
const WALK_TIMEOUT = 25; // wer bis dahin nicht am Baum ist, gibt auf
const TREE_RANGE = 12; // so viele Kacheln weit sucht er einen Baum
const AT_TREE = { x: 24, y: 2 }; // Platz neben dem Stamm (rechts oder links davon), die Pfoten liegen dann am Stamm
const EAT_ORIGIN_Y = 76 / 80; // Füße im Bild "anteater_eat" (aufgerichtet, nach links)

export default class Anteater extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'anteater');
    this.eatAt = this.now() + Phaser.Math.FloatBetween(5, EAT_EVERY[1]);
    this.trip = null; // { spot, face, endAt } auf dem Weg zum Baum bzw. beim Fressen
    this.eating = false;
  }

  now() {
    return this.scene.time.now / 1000;
  }

  // beim Fressen auch durch Berühren fangbar
  canBeCaughtWith(tool) {
    if (tool === 'touch') return this.state === 'wild' && this.eating;
    return super.canBeCaughtWith(tool);
  }

  shouldFlee(player) {
    if (this.eating) {
      this.fleeing = false;
      return false;
    }
    return super.shouldFlee(player);
  }

  // Bäume in Reichweite: draußen die Urwaldbäume, im Gehege die im eigenen Gehege
  trees() {
    if (this.state === 'penned') return (this.enclosure?.tiles ?? []).filter(({ tx, ty }) => charAt(tx, ty) === 'J');
    return JUNGLE_TREES;
  }

  // ein Platz neben einem nahen Baum, an dem er stehen kann
  startTrip(now) {
    const spots = [];
    for (const t of this.trees()) {
      const c = tileToWorld(t.tx, t.ty);
      const d = Math.hypot(c.x - this.x, (c.y - this.y) * 2) / TILE_W;
      if (d > TREE_RANGE) continue;
      for (const side of [1, -1]) {
        const spot = { x: c.x + side * AT_TREE.x, y: c.y + AT_TREE.y };
        if (!this.blocked(spot.x, spot.y)) spots.push({ spot, face: -side, d });
      }
    }
    this.eatAt = now + Phaser.Math.FloatBetween(...EAT_EVERY);
    if (!spots.length) return;
    spots.sort((a, b) => a.d - b.d);
    const pick = Phaser.Utils.Array.GetRandom(spots.slice(0, 4));
    this.trip = { spot: pick.spot, face: pick.face, endAt: now + WALK_TIMEOUT };
  }

  endTrip(now) {
    this.trip = null;
    this.eating = false;
    this.eatAt = now + Phaser.Math.FloatBetween(...EAT_EVERY);
    this.pickWander();
  }

  updateFree(dt, player) {
    if (this.state !== 'wild' && this.state !== 'penned') {
      this.trip = null;
      this.eating = false;
      return super.updateFree(dt, player);
    }
    const now = this.now();
    if (!this.trip && now >= this.eatAt) this.startTrip(now);
    const t = this.trip;
    if (!t) return super.updateFree(dt, player);
    if (now >= t.endAt) {
      this.endTrip(now);
      return super.updateFree(dt, player);
    }
    if (this.eating) return false;
    // auf dem Weg zum Baum: bemerkt er Henrik, rennt er weg (und versucht es später noch einmal)
    if (super.shouldFlee(player)) {
      this.endTrip(now);
      return this.flee(dt, player);
    }
    const dx = t.spot.x - this.x;
    const dy = t.spot.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) {
      this.eating = true;
      this.faceX = t.face;
      t.endAt = now + Phaser.Math.FloatBetween(...EAT_TIME);
      return false;
    }
    const step = Math.min(d, this.kind.speed * dt);
    const angle = Math.atan2(dy, dx);
    for (const turn of [0, 0.5, -0.5, 1, -1]) {
      if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) return true;
    }
    return false;
  }

  startFeed() {
    this.trip = null;
    this.eating = false;
  }

  catch() {
    this.trip = null;
    this.eating = false;
    super.catch();
  }

  render(moving) {
    // am Baum: aufgerichtet, die Vorderpfoten am Stamm (das Bild schaut nach links, nach rechts gespiegelt)
    if (this.eating) {
      this.showStill('anteater_eat', EAT_ORIGIN_Y);
      this.sprite.setFlipX(this.faceX > 0);
      this.placeSprite(false);
      return;
    }
    if (this.sprite.texture.key === 'anteater_eat') this.sprite.setFlipX(false).setTexture(this.kind.texture, 0).setOrigin(0.5, this.kind.originY);
    super.render(moving);
  }
}
