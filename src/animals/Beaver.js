// Biber (Wald, am Fluss): sitzen geschäftig an den angenagten Bäumen am Ufer und nagen, dass die Späne fliegen. Ab und zu
// wechselt einer zu einem anderen Baum – über den Fluss schwimmt er dabei (nur Kopf und Rücken schauen heraus).
// Fangen kann man sie nicht: Im Biberdamm ist ein Loch (siehe BeaverDam.js). Steckt Henrik einen großen Stock hinein, freuen
// sich die Biber, und einer kommt freiwillig mit (GardenScene.fixDam: er folgt sofort wie ein gefangenes Tier).
// Im Gehege (Teich im Tierpark) läuft er herum wie jedes andere Tier.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { worldToTile } from '../world/iso.js';
import { charAt } from '../world/map.js';

const GNAW_TIME = [6, 14]; // so lange nagt er an einem Baum
const CHIP_EVERY = [0.4, 1.1]; // so oft fliegt ein Span
const MOVE_SPEED = 24; // zum nächsten Baum (gemütlich)
const RIPPLE_EVERY = 0.5; // beim Schwimmen: Wellenringe
const GNAW_ORIGIN = [45 / 96, 69 / 72]; // Animation "beaver_gnaw": Mitte des Bibers (das Holz liegt rechts davor) und seine Füße
const SWIM_ORIGIN_Y = 44 / 60; // Bild "beaver_swim" (Wasserlinie, siehe tools/beaver-swim.py)
const CHIP_COLOR = 0xe2c48c;
const OWN_LOOKS = ['beaver_swim']; // eigene Bilder (Laufen und Knabbern sind Animationen aus SPECIES, die wechselt Animal.render)

const inWater = (x, y) => {
  const { tx, ty } = worldToTile(x, y);
  return '~ř'.includes(charAt(tx, ty));
};

export default class Beaver extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'beaver');
    this.mode = 'move';
    this.spot = null;
    this.timer = 0;
    this.chipTime = 0;
    this.rippleTime = 0;
  }

  // fangen geht nur über den Damm (er kommt dann von selbst)
  canBeCaughtNow() {
    return false;
  }

  // die Biber wohnen fest am Fluss (BeaverDam hält ihre Zahl)
  canDespawn() {
    return false;
  }

  // gleich an diesem Platz sitzen und nagen
  sitAt(spot) {
    this.spot = spot;
    this.x = spot.x;
    this.y = spot.y;
    this.startGnaw();
  }

  startGnaw() {
    this.mode = 'gnaw';
    this.timer = Phaser.Math.FloatBetween(...GNAW_TIME);
    this.faceX = this.spot.face;
    this.faceY = 1;
  }

  goTo(spot) {
    this.spot = spot;
    this.mode = 'move';
  }

  // die anderen freuen sich
  cheer() {
    this.popHeart();
    this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 6, duration: 160, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.mode === 'gnaw') {
      this.chipTime -= dt;
      if (this.chipTime <= 0) {
        this.chipTime = Phaser.Math.FloatBetween(...CHIP_EVERY);
        this.chip();
      }
      this.timer -= dt;
      if (this.timer <= 0) {
        const next = this.scene.beaverDam?.freeSpot(this);
        if (next && next !== this.spot) this.goTo(next);
        else this.timer = Phaser.Math.FloatBetween(...GNAW_TIME);
      }
      return false;
    }
    const target = this.spot;
    if (!target) return false;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (this.mode === 'move' && d < 2) {
      this.x = target.x;
      this.y = target.y;
      this.startGnaw();
      return false;
    }
    // geradewegs hin, auch durchs Wasser (Biber schwimmen) – ohne Kollision, die Wege sind kurz
    const step = Math.min(d, MOVE_SPEED * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    if (Math.abs(dx) > d * 0.3) this.faceX = Math.sign(dx);
    if (Math.abs(dy) > d * 0.3) this.faceY = Math.sign(dy);
    if (inWater(this.x, this.y)) {
      this.rippleTime -= dt;
      if (this.rippleTime <= 0) {
        this.rippleTime = RIPPLE_EVERY;
        this.ripple();
      }
    }
    return true;
  }

  render(moving) {
    if (this.state === 'wild' && this.mode === 'gnaw') {
      if (this.sprite.anims.currentAnim?.key !== 'beaver_gnaw' || !this.sprite.anims.isPlaying) {
        this.sprite.play({ key: 'beaver_gnaw', startFrame: Phaser.Math.Between(0, this.scene.anims.get('beaver_gnaw').frames.length - 1) });
      }
      const left = this.faceX < 0; // gespiegelt: die Mitte des Bibers liegt dann auf der anderen Seite des Rahmens
      this.sprite.setOrigin(left ? 1 - GNAW_ORIGIN[0] : GNAW_ORIGIN[0], GNAW_ORIGIN[1]).setFlipX(left).setScale(0.5);
      this.shadow.setVisible(true);
      this.placeSprite(false);
      return;
    }
    if ((this.state === 'wild' || this.state === 'following') && inWater(this.x, this.y)) { // folgt er durchs Wasser, schwimmt er
      this.showStill('beaver_swim', SWIM_ORIGIN_Y);
      this.sprite.setFlipX(this.faceX < 0);
      this.shadow.setVisible(false);
      this.placeSprite(false);
      return;
    }
    if (OWN_LOOKS.includes(this.sprite.texture.key)) {
      this.sprite.stop();
      this.sprite.setFlipX(false);
      this.sprite.setTexture(this.kind.texture, 0).setOrigin(0.5, this.kind.originY).setScale(0.5);
    }
    this.shadow.setVisible(true);
    super.render(moving);
  }

  // ein Holzspan fliegt vom Stamm
  chip() {
    const scene = this.scene;
    const x = this.x + this.faceX * 13;
    const y = this.y - 12;
    const c = scene.add.rectangle(x, y, 2.2, 1.4, CHIP_COLOR).setDepth(this.y + 1).setAngle(Phaser.Math.Between(0, 180));
    const dx = this.faceX * -Phaser.Math.FloatBetween(4, 14);
    scene.tweens.add({ targets: c, x: x + dx, duration: 520 });
    scene.tweens.add({ targets: c, y: y - 6, duration: 180, ease: 'Quad.easeOut', yoyo: false, onComplete: () => scene.tweens.add({ targets: c, y: this.y + Phaser.Math.FloatBetween(0, 4), angle: c.angle + 120, duration: 340, ease: 'Quad.easeIn' }) });
    scene.tweens.add({ targets: c, alpha: 0, delay: 1400, duration: 500, onComplete: () => c.destroy() });
  }

  ripple() {
    const r = this.scene.add.ellipse(this.x, this.y + 1, 14, 5).setStrokeStyle(1, 0xffffff, 0.7).setDepth(this.y - 1);
    this.scene.tweens.add({ targets: r, scale: 2, alpha: 0, duration: 800, ease: 'Quad.easeOut', onComplete: () => r.destroy() });
  }
}
