// Walross (Eiswelt, Tag und Nacht): liegt am Kiesstrand bzw. an der Eiskante, robbt ab und zu ein Stück und döst immer
// wieder ein (walrus_sleep, 💤). Flieht nicht. Fangen (docs/plan-eiswelt.md): einem dösenden Walross die Wärmflasche
// anlegen (WarmerTool, warmWalrus in GardenScene) – es wacht auf und hat Hunger (Muschel in der Sprechblase, HUNGRY_TIME
// lang, dann döst es wieder). Mit 2 Muscheln (Kescher an den Blubberstellen, siehe IceCatch.js) füttert Henrik es, dann
// kommt es mit. Ist es gerade wach (ohne Hunger), muss man nur kurz warten, bis es döst.
import Phaser from 'phaser';
import Animal from './Animal.js';

const AWAKE_TIME = [8, 16]; // so lange ist es wach ...
const DOZE_TIME = [14, 26]; // ... und so lange döst es
const SNORE_EVERY = 2.4; // so oft steigt beim Dösen ein 💤 auf
const WARM_TIME = 1.2; // so lange (Sekunden) wärmt die Flasche, bis es aufwacht
const HUNGRY_TIME = 150; // so lange (Sekunden) bleibt es danach wach und hungrig
const WISH_EVERY = 3; // so oft zeigt es dabei die Muschel
const SIZE = 0.5; // (Bild in voller Größe, 1,28-fach wie früher bei 0,64: ein Koloss, aber scharf)
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
    this.hungry = 0; // > 0: wach und hungrig (Restzeit in Sekunden)
  }

  shouldFlee() {
    return false;
  }

  // gefangen wird es nur übers Füttern (feedWalrus in IceCatch.js), nie über ein Werkzeug
  canBeCaughtNow() {
    return this.state === 'wild' && this.hungry > 0;
  }

  canDespawn() {
    return !this.warming && !this.hungry;
  }

  // die Wärmflasche wird angelegt: kurz warm werden (Dampf, Herzchen), dann wacht es hungrig auf
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
    if (this.state === 'penned') return this.updatePen(dt, player);
    if (this.state !== 'wild') return super.updateFree(dt, player);
    this.home ??= { x: this.x, y: this.y };
    if (this.warming) {
      this.warming -= dt;
      if (this.warming <= 0) {
        this.warming = 0;
        this.dozing = false;
        this.hungry = HUNGRY_TIME;
        this.wishIn = 0.4;
        this.onWarm?.();
      }
      return false;
    }
    if (this.hungry > 0) {
      // wach und hungrig: zeigt immer wieder die Muschel, robbt dabei nicht weg
      this.hungry -= dt;
      this.wishIn -= dt;
      if (this.wishIn <= 0) {
        this.wishIn = WISH_EVERY;
        const t = this.scene.add.text(this.x + 20 * this.faceX, this.y - 62, '🐚', { fontSize: '15px', backgroundColor: '#ffffffd0', padding: { x: 3, y: 2 }, resolution: 4 }).setOrigin(0.5).setDepth(100000).setAlpha(0);
        this.scene.tweens.add({ targets: t, alpha: 1, y: t.y - 6, duration: 300, yoyo: true, hold: 1600, onComplete: () => t.destroy() });
      }
      if (this.hungry <= 0) {
        this.hungry = 0;
        this.dozing = true; // nichts bekommen: döst wieder ein
        this.phaseLeft = Phaser.Math.FloatBetween(...DOZE_TIME);
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

  // im Becken (Tierpark): döst wie draußen immer wieder am Strand, wach robbt es herum
  updatePen(dt, player) {
    this.phaseLeft -= dt;
    if (this.phaseLeft <= 0) {
      this.dozing = !this.dozing;
      this.phaseLeft = Phaser.Math.FloatBetween(...(this.dozing ? DOZE_TIME : AWAKE_TIME));
    }
    if (!this.dozing) return super.updateFree(dt, player);
    this.snoreIn -= dt;
    if (this.snoreIn <= 0) {
      this.snoreIn = SNORE_EVERY;
      const t = this.scene.add.text(this.x + 18, this.y - 58, '💤', { fontSize: '14px', resolution: 4 }).setOrigin(0.5).setDepth(100000).setAlpha(0.9);
      this.scene.tweens.add({ targets: t, y: t.y - 14, x: t.x + 6, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
    }
    return false;
  }

  get sleepy() {
    return (this.state === 'wild' && (this.dozing || this.warming)) || (this.state === 'penned' && this.dozing);
  }

  // dösend: Standbild walrus_sleep statt Animation
  animKey(moving) {
    return this.sleepy ? null : super.animKey(moving);
  }

  render(moving) {
    super.render(moving);
    this.sprite.setScale(this.baby ? 0.35 : SIZE);
    const sleepy = this.sleepy;
    const f = this.kind.frames;
    const frame = this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
    if (sleepy) this.sprite.setTexture('walrus_sleep', frame).setFlipX(false);
    else if (this.sprite.texture.key === 'walrus_sleep') this.sprite.setTexture('walrus', frame);
  }
}
