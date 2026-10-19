// Pfau (Asien): stolziert überall herum und ist scheu wie das Zebra. Kommt man zu nah, rennt er weg – und manchmal
// (FLY_CHANCE) fliegt er sogar ganz davon. Ab und zu bleibt er stehen und schlägt ein Rad: dann ist er so stolz, dass er
// nicht flieht, und man kann ihn mit der Hand oder dem Kescher fangen. Im Tierpark läuft er frei herum (kein Gehege)
// und schlägt dort auch Rad – die Besucher bleiben bei ihm stehen.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { blockedAt, footTiles } from '../world/collision.js';
import { ENCLOSURES, NEAR_PATH, buildingAt, inPen, isGate } from '../world/map.js';

const DISPLAY_EVERY = [7, 14]; // so oft schlägt er ein Rad (Sekunden, in denen er nicht flieht)
const DISPLAY_TIME = [3.5, 5]; // so lange zeigt er es
const FLY_CHANCE = 1 / 3; // so oft fliegt er ganz davon, statt nur wegzurennen
const FLY_MS = 1400;

export default class Peacock extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'peacock');
    this.wheel = false;
    this.displayIn = Phaser.Math.FloatBetween(...DISPLAY_EVERY);
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.wheel && !this.flying;
  }

  canDespawn() {
    return !this.flying;
  }

  // scheu wie das Zebra; beim Rad-Schlagen flieht er nicht. Beginnt eine Flucht, fliegt er vielleicht ganz davon
  shouldFlee(player) {
    if (this.wheel || this.flying) return false;
    const was = this.fleeing;
    const flee = super.shouldFlee(player);
    if (flee && !was && Math.random() < FLY_CHANCE) {
      this.flyAway(player);
      return false;
    }
    return flee;
  }

  updateFree(dt, player) {
    if (this.flying) return false;
    if (this.wheel) {
      this.wheelTime -= dt;
      if (this.wheelTime <= 0) {
        this.wheel = false;
        this.displayIn = Phaser.Math.FloatBetween(...DISPLAY_EVERY);
        this.pickWander();
      }
      return false;
    }
    const moved = super.updateFree(dt, player);
    if (!this.fleeing && !this.flying) {
      this.displayIn -= dt;
      if (this.displayIn <= 0) {
        this.wheel = true;
        this.wheelTime = Phaser.Math.FloatBetween(...DISPLAY_TIME);
        this.faceY = 1; // zum Betrachter hin
      }
    }
    return moved;
  }

  // auffliegen und verschwinden
  flyAway(player) {
    this.flying = true;
    this.wheel = false;
    const dir = Math.sign(this.x - player.x) || 1;
    this.faceX = dir;
    this.faceY = -1;
    this.render(false);
    this.scene.tweens.add({ targets: this.sprite, x: this.sprite.x + dir * 90, y: this.sprite.y - 130, alpha: 0, duration: FLY_MS, ease: 'Quad.easeIn' });
    this.scene.tweens.add({ targets: this.shadow, alpha: 0, scale: 0.4, duration: FLY_MS * 0.6 });
    this.scene.time.delayedCall(FLY_MS, () => {
      if (this.scene.animals.includes(this)) this.scene.despawn(this);
    });
    this.scene.peacockFlew?.(this);
  }

  // im Tierpark frei unterwegs: überall, nur nicht in Gehege, Häuser und Tore
  isFree() {
    return this.state === 'penned' && !!this.enclosure?.free;
  }

  blocked(x, y) {
    if (!this.isFree()) return super.blocked(x, y);
    if (blockedAt(x, y, this.kind.footW, 3)) return true;
    // nur in der Nähe der Wege (nicht in die hintersten Ecken), nicht in Gehege, Häuser und Tore
    return footTiles(x, y, this.kind.footW, 3).some(({ tx, ty }) => !NEAR_PATH.has(tx + ',' + ty) || inPen(tx, ty) || isGate(tx, ty) || buildingAt(tx, ty));
  }

  render(moving) {
    if (this.flying && this.sprite.alpha < 1) return; // im Flug bewegt ihn der Tween
    const key = this.wheel ? `${this.baseTexture()}_wheel` : this.lookTexture();
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key, this.sprite.frame.name);
    super.render(this.wheel ? false : moving);
  }

  catch() {
    this.wheel = false;
    super.catch();
  }

  restore(state) {
    this.wheel = false;
    this.flying = false;
    super.restore(state);
    // im Tierpark gehört er zu den freilaufenden Pfauen
    if (state === 'penned') this.enclosure = ENCLOSURES.find((e) => e.free && e.species?.includes('peacock')) ?? this.enclosure;
  }
}
