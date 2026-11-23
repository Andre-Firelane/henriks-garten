// Walross (Eiswelt, Tag und Nacht): liegt am Kiesstrand bzw. an der Eiskante, robbt ab und zu ein Stück und döst immer
// wieder ein (walrus_sleep, 💤). Flieht nicht. Fangen: einem dösenden Walross die Wärmflasche anlegen (WarmerTool,
// warmWalrus in GardenScene) – es wird warm und kommt mit. Ist es gerade wach, muss man nur kurz warten.
import Phaser from 'phaser';
import Animal from './Animal.js';

const AWAKE_TIME = [8, 16]; // so lange ist es wach ...
const DOZE_TIME = [14, 26]; // ... und so lange döst es
const SNORE_EVERY = 2.4; // so oft steigt beim Dösen ein 💤 auf
const WARM_TIME = 1.2; // so lange (Sekunden) wärmt die Flasche, bis es mitkommt
const SIZE = 0.64; // deutlich größer als die anderen Tiere (0,5): ein Walross ist ein Koloss
const RANGE = 110; // so weit darf es sich vom Platz entfernen, an dem es erschienen ist (Kachel-Proportionen, y doppelt)

export default class Walrus extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'walrus');
    this.sprite.setScale(SIZE);
    this.dozing = Math.random() < 0.5;
    this.phaseLeft = Phaser.Math.FloatBetween(...(this.dozing ? DOZE_TIME : AWAKE_TIME));
    this.snoreIn = Math.random() * SNORE_EVERY;
    this.home = null;
    this.warming = 0;
  }

  shouldFlee() {
    return false;
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.dozing;
  }

  canDespawn() {
    return !this.warming;
  }

  // die Wärmflasche wird angelegt: kurz warm werden (Dampf, Herzchen), dann fängt die Szene es
  warm(done) {
    if (this.warming) return;
    this.warming = WARM_TIME;
    this.onWarm = done;
    for (let i = 0; i < 4; i++) {
      const t = this.scene.add.text(this.x + Phaser.Math.Between(-24, 24), this.y - 50, i % 2 ? '♨️' : '💗', { fontSize: '13px', resolution: 4 }).setOrigin(0.5).setDepth(100000).setAlpha(0);
      this.scene.tweens.add({ targets: t, alpha: { from: 0, to: 1 }, y: t.y - 22, delay: i * 220, duration: 700, yoyo: true, onComplete: () => t.destroy() });
    }
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    this.home ??= { x: this.x, y: this.y };
    if (this.warming) {
      this.warming -= dt;
      if (this.warming <= 0) {
        this.warming = 0;
        this.onWarm?.(); // (noch dösend: so lässt es sich fangen)
        this.dozing = false;
      }
      return false;
    }
    this.phaseLeft -= dt;
    if (this.phaseLeft <= 0) {
      this.dozing = !this.dozing;
      this.phaseLeft = Phaser.Math.FloatBetween(...(this.dozing ? DOZE_TIME : AWAKE_TIME));
    }
    if (this.dozing) {
      this.snoreIn -= dt;
      if (this.snoreIn <= 0) {
        this.snoreIn = SNORE_EVERY;
        const t = this.scene.add.text(this.x + 18, this.y - 58, '💤', { fontSize: '14px', resolution: 4 }).setOrigin(0.5).setDepth(100000).setAlpha(0.9);
        this.scene.tweens.add({ targets: t, y: t.y - 14, x: t.x + 6, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
      }
      return false;
    }
    // wach: robbt gemächlich herum, aber nicht weit weg von seinem Platz
    if (Math.hypot(this.x - this.home.x, (this.y - this.home.y) * 2) > RANGE) {
      const a = Math.atan2(this.home.y - this.y, this.home.x - this.x);
      this.dirX = Math.cos(a);
      this.dirY = Math.sin(a);
    }
    return super.updateFree(dt, player);
  }

  render(moving) {
    super.render(moving);
    this.sprite.setScale(this.baby ? 0.45 : SIZE);
    const sleepy = this.state === 'wild' && (this.dozing || this.warming);
    const f = this.kind.frames;
    const frame = this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
    if (sleepy) this.sprite.setTexture('walrus_sleep', frame).setFlipX(false);
    else if (this.sprite.texture.key === 'walrus_sleep') this.sprite.setTexture('walrus', frame);
  }
}
