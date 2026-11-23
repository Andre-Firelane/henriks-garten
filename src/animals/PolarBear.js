// Eisbär (Eiswelt, nur nachts; siehe spawn in levels.js unter ice.seasons.night): streift über das zugefrorene Meer und
// hält Abstand zu Henrik (langsamer als er, aber so kommt man nicht an ihn heran). Wirft Henrik einen Fisch an ein
// Eisloch (dropBearBait in GardenScene, aus TreatTool), trottet der Eisbär dorthin, setzt sich vor das Loch und lauert
// (polarbear_wait) – jetzt flieht er nicht mehr. Wirft man ihm dann noch einen Fisch zu, schnappt er ihn und folgt
// Henrik. Nach LURK_TIME gibt er auf und streift weiter.
import Phaser from 'phaser';
import Animal from './Animal.js';

const SIZE = 0.75; // deutlich größer als die anderen Tiere (0,5)
const LURK_TIME = 90; // so lange (Sekunden) lauert er am Eisloch
const TO_BAIT_SPEED = 1.6; // so viel schneller als sonst trottet er zum Fisch
const ARRIVED = 10; // so nah am Fisch: angekommen

export default class PolarBear extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'polarbear');
    this.sprite.setScale(SIZE);
    this.lurk = null; // { until, faceX }
  }

  canBeCaughtNow() {
    return this.state === 'wild' && !!this.lurk;
  }

  canDespawn() {
    return !this.lurk && this.scene.bearBait?.bear !== this;
  }

  shouldFlee(player) {
    if (this.lurk || this.scene.bearBait?.bear === this) return false;
    return super.shouldFlee(player);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    const now = this.scene.time.now / 1000;
    if (this.lurk) {
      this.faceX = this.lurk.faceX;
      this.faceY = 1;
      if (now >= this.lurk.until) this.lurk = null;
      return false;
    }
    // liegt ein Fisch am Eisloch und holt ihn noch kein anderer: hin
    const bait = this.scene.bearBait;
    if (bait && (!bait.bear || bait.bear === this || !this.scene.animals.includes(bait.bear))) {
      bait.bear = this;
      const dx = bait.x - this.x;
      const dy = bait.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < ARRIVED) {
        this.lurk = { until: now + LURK_TIME, faceX: bait.hole.x < this.x ? -1 : 1 };
        this.scene.bearArrived?.(this);
        return false;
      }
      const step = Math.min(d, this.kind.speed * TO_BAIT_SPEED * dt);
      this.faceX = dx < 0 ? -1 : 1;
      this.faceY = dy < 0 ? -1 : 1;
      if (!this.move((dx / d) * step, (dy / d) * step)) {
        // etwas im Weg: einfach hinübergehen (das Eis ist frei; es geht nur um Steine am Rand)
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
      }
      return true;
    }
    return super.updateFree(dt, player);
  }

  catch() {
    this.lurk = null;
    super.catch();
  }

  render(moving) {
    super.render(moving);
    this.sprite.setScale(this.baby ? 0.4 : SIZE);
    const f = this.kind.frames;
    const frame = this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
    if (this.state === 'wild' && this.lurk) this.sprite.setTexture('polarbear_wait', frame).setFlipX(false);
    else if (this.sprite.texture.key === 'polarbear_wait') this.sprite.setTexture('polarbear', frame);
  }
}
