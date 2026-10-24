// Schmetterling (Wiese): flattert in vielen Farben (variant = Zeile im Spritesheet "butterfly") über die Wiese und setzt
// sich ab und zu auf eine Blume. Kommt man ihm im Flug zu nah, flattert er davon; auf der Blume sitzt er still – dann
// erwischt man ihn am leichtesten mit dem Kescher.
// Im Tierpark gibt es kein Gehege: er flattert frei in der Nähe der Wege herum (wie die Pfaue) und setzt sich dort auf
// Blumen; die Besucher bleiben stehen und bewundern ihn (siehe Visitor.lookForPeacock).
import Phaser from 'phaser';
import Animal from './Animal.js';
import { worldToTile, tileToWorld } from '../world/iso.js';
import { ENCLOSURES, LEVEL, MAP_W, MAP_H, NEAR_PATH, NEAR_PATH_TILES, buildingAt, charAt, inPen } from '../world/map.js';

export const BUTTERFLY_KINDS = 12; // so viele Farben hat das Spritesheet (je 3 Bilder: offen, halb, fast zu)
const SCALE = 0.42; // Bild 64 × 64
const FLY_H = [16, 40]; // so hoch flattert er über dem Boden ...
const SIT_H = 9; // ... und so hoch sitzt er auf der Blüte
const FOLLOW_H = 26; // hinter Henrik her
const SPEED = [20, 30]; // gemütliches Flattern (Pixel pro Sekunde)
const ROAM = 4; // so viele Kacheln weit sucht er sich sein nächstes Ziel im Flug
const FLY_TIME = [5, 11]; // so lange flattert er, bevor er sich eine Blume sucht ...
const SIT_TIME = [4, 8]; // ... und so lange sitzt er darauf
const FLOWER_RANGE = 7; // so weit (Kacheln) sucht er nach einer Blume
// im Tierpark sitzt er öfter und länger (damit die Besucher ihn bewundern können) und sucht weiter nach Blumen
const PARK_FLY_TIME = [3, 7];
const PARK_SIT_TIME = [8, 16];
const PARK_FLOWER_RANGE = 14;
const FLAP_RATE = 14; // Flügelschläge im Flug (Bilder pro Sekunde)
const SIT_FLAP = [0, 0, 0, 1, 2, 2, 2, 1]; // auf der Blüte: langsam auf und zu
const FLY_FLAP = [0, 1, 2, 1];

const FLOWERS = 'fg';
let flowerCache = { level: null, tiles: [] };

// Blumen dieses Gebiets (im Tierpark nur nahe den Wegen und nicht in Gehegen, damit die Besucher sie sehen)
export function flowerTiles() {
  if (flowerCache.level === LEVEL) return flowerCache.tiles;
  const tiles = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (!FLOWERS.includes(charAt(tx, ty))) continue;
      if (inPen(tx, ty)) continue;
      tiles.push({ tx, ty });
    }
  }
  flowerCache = { level: LEVEL, tiles };
  return tiles;
}

export default class Butterfly extends Animal {
  constructor(scene, x, y, variant) {
    super(scene, x, y, 'butterfly');
    this.variant = Number.isInteger(variant) ? variant : Phaser.Math.Between(0, BUTTERFLY_KINDS - 1);
    this.h = Phaser.Math.FloatBetween(...FLY_H);
    this.phase = Math.random() * 10;
    this.sprite.setOrigin(0.5, 0.5);
    this.shadow.setAlpha(0.5);
    this.startFlying();
  }

  // im Tierpark: frei unterwegs (zählt zum "Gehege" ohne Fläche, siehe levels.js)
  isFree() {
    return this.state === 'penned' && !!this.enclosure?.free;
  }

  // auf der Blüte sitzend: so lässt er sich am leichtesten keschern; die Besucher bewundern ihn
  get sitting() {
    return this.mode === 'sit';
  }

  startFlying() {
    this.mode = 'fly';
    this.modeTime = Phaser.Math.FloatBetween(...(this.isFree() ? PARK_FLY_TIME : FLY_TIME));
    this.target = null;
  }

  // Ziel im Flug: irgendwo in der Nähe (im Tierpark nahe den Wegen)
  pickTarget() {
    if (this.isFree()) {
      const near = NEAR_PATH_TILES.filter((t) => Math.abs(t.tx - this.tile().tx) <= ROAM && Math.abs(t.ty - this.tile().ty) <= ROAM);
      const t = Phaser.Utils.Array.GetRandom(near.length ? near : NEAR_PATH_TILES);
      this.target = t ? tileToWorld(t.tx, t.ty) : { x: this.x, y: this.y };
    } else {
      const { tx, ty } = this.tile();
      const ntx = Phaser.Math.Clamp(tx + Phaser.Math.Between(-ROAM, ROAM), 2, MAP_W - 3);
      const nty = Phaser.Math.Clamp(ty + Phaser.Math.Between(-ROAM, ROAM), 2, MAP_H - 3);
      this.target = tileToWorld(ntx, nty);
    }
    this.targetH = Phaser.Math.FloatBetween(...FLY_H);
    this.speed = Phaser.Math.FloatBetween(...SPEED);
  }

  tile() {
    return worldToTile(this.x, this.y);
  }

  // eine Blume in der Nähe zum Hinsetzen (oder null)
  findFlower() {
    const { tx, ty } = this.tile();
    const r = this.isFree() ? PARK_FLOWER_RANGE : FLOWER_RANGE;
    const near = flowerTiles().filter((t) => Math.abs(t.tx - tx) <= r && Math.abs(t.ty - ty) <= r && (!this.isFree() || NEAR_PATH.has(t.tx + ',' + t.ty)));
    const taken = this.scene.animals.filter((a) => a !== this && a.species === 'butterfly' && a.flower).map((a) => a.flower);
    const free = near.filter((t) => !taken.some((f) => f.tx === t.tx && f.ty === t.ty));
    return free.length ? Phaser.Utils.Array.GetRandom(free) : null;
  }

  // fliegt über alles hinweg, nur nicht über den Kartenrand; im Tierpark nicht über die Häuser (seine Ziele liegen nahe den Wegen)
  blocked(x, y) {
    if (this.state === 'following') return false;
    const { tx, ty } = worldToTile(x, y);
    if (tx < 1 || ty < 1 || tx > MAP_W - 2 || ty > MAP_H - 2 || charAt(tx, ty) === ' ') return true;
    if (this.isFree()) return !!buildingAt(tx, ty);
    return false;
  }

  // nur im Flug scheu; auf der Blüte bleibt er sitzen
  shouldFlee(player) {
    if (this.sitting) return false;
    return super.shouldFlee(player);
  }

  updateFree(dt, player) {
    this.phase += dt;
    if (this.state === 'wild' && this.shouldFlee(player)) {
      this.mode = 'fly';
      this.flower = null;
      this.h += (FLY_H[1] - this.h) * Math.min(1, dt * 2); // nach oben weg
      return this.flee(dt, player);
    }
    this.modeTime -= dt;
    if (this.mode === 'sit') {
      if (this.modeTime <= 0) {
        this.flower = null;
        this.startFlying();
      }
      return false;
    }
    if (this.mode === 'fly' && this.modeTime <= 0) {
      const f = this.findFlower();
      if (f) {
        this.mode = 'land';
        this.flower = f;
        this.target = tileToWorld(f.tx, f.ty);
        this.targetH = SIT_H;
      } else {
        this.modeTime = Phaser.Math.FloatBetween(...FLY_TIME) / 2;
      }
    }
    if (!this.target || (this.mode === 'fly' && Math.hypot(this.target.x - this.x, this.target.y - this.y) < 4)) this.pickTarget();
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    this.h += (this.targetH - this.h) * Math.min(1, dt * (this.mode === 'land' ? 2 : 0.8));
    if (this.mode === 'land' && d < 2) {
      this.mode = 'sit';
      this.modeTime = Phaser.Math.FloatBetween(...(this.isFree() ? PARK_SIT_TIME : SIT_TIME));
      this.h = SIT_H;
      return false;
    }
    // im Zickzack: die Richtung schwankt beim Flattern
    const wobble = Math.sin(this.phase * 3.1) * 0.9;
    const a = Math.atan2(dy, dx) + (this.mode === 'land' && d < 30 ? 0 : wobble);
    const step = Math.min(d, (this.speed ?? SPEED[0]) * dt);
    const moved = this.move(Math.cos(a) * step, Math.sin(a) * step);
    if (!moved) {
      this.flower = null;
      this.startFlying();
    }
    return moved;
  }

  catch() {
    this.flower = null;
    this.startFlying();
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.flower = null;
    this.startFlying();
    // im Tierpark gehört er zu den freien Schmetterlingen
    if (state === 'penned') this.enclosure = ENCLOSURES.find((e) => e.free && e.species?.includes('butterfly')) ?? this.enclosure;
  }

  enterPen() {
    super.enterPen();
    this.flower = null;
    this.startFlying();
  }

  render() {
    this.phase ??= 0;
    if (this.state === 'following') {
      this.phase += 1 / 60;
      this.h += (FOLLOW_H - this.h) * 0.05;
    }
    const flap = this.sitting ? SIT_FLAP[Math.floor(this.phase * 3) % SIT_FLAP.length] : FLY_FLAP[Math.floor(this.phase * FLAP_RATE) % FLY_FLAP.length];
    const look = this.skin ?? this.kind.texture;
    if (this.sprite.texture.key !== look) this.sprite.setTexture(look).setOrigin(0.5, 0.5);
    this.sprite.setFrame(this.variant * 3 + flap);
    this.sprite.setScale(SCALE * (this.baby ? 0.6 : 1));
    const bob = this.sitting ? 0 : Math.sin(this.phase * 5) * 2.5;
    this.sprite.setPosition(this.x, this.y - this.h + bob).setAngle(this.sitting ? 0 : this.faceX * 10 + Math.sin(this.phase * 4) * 6);
    this.sprite.setDepth(this.y + 2); // vor der Blume, auf der er sitzt
    this.shadow.setVisible(true).setPosition(this.x, this.y).setScale(Math.max(0.35, 1 - this.h * 0.02)).setDepth(this.y - 0.5);
  }
}
