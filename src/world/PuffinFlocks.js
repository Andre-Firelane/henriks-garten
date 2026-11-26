// Papageitaucher-Zug (Event in der Eiswelt, docs/plan-papageitaucher.md): ab und zu zieht ein Schwarm hoch über die Karte,
// quer durchs Bild, mit kleinen Schatten auf dem Boden. Nur Kulisse: keine Tiere, nicht fangbar, nicht gespeichert.
import Phaser from 'phaser';

const EVERY = [7, 14]; // Sekunden zwischen zwei Schwärmen
const BIRDS = [5, 9]; // so viele Vögel je Schwarm
const SPEED = [110, 150]; // Welt-Pixel je Sekunde
const HEIGHT = 150; // so hoch fliegen sie (Abstand Vogel – Schatten)
const DEPTH = 98400; // über Bäumen und Tieren, unter Dach, Wetter und Beschriftungen
const SHADOW_DEPTH = -99940; // flach auf dem Boden
const FLY_ANIM = 'puffin_fly_anim';

export default class PuffinFlocks {
  constructor(scene) {
    this.scene = scene;
    this.flocks = [];
    this.next = Phaser.Math.FloatBetween(1, 4);
  }

  // ein Schwarm quer durch den sichtbaren Ausschnitt (von links nach rechts oder umgekehrt, leicht schräg)
  spawn() {
    const scene = this.scene;
    if (!scene.anims.exists(FLY_ANIM)) return;
    const view = scene.cameras.main.worldView;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const slope = Phaser.Math.FloatBetween(-0.35, 0.35);
    const y0 = view.y + view.height * Phaser.Math.FloatBetween(0.2, 0.8);
    const x0 = dir > 0 ? view.x - 120 : view.right + 120;
    const speed = Phaser.Math.FloatBetween(...SPEED);
    const birds = Array.from({ length: Phaser.Math.Between(...BIRDS) }, (_, i) => {
      // lockere Formation: hintereinander, etwas versetzt
      const dx = -dir * (i * Phaser.Math.FloatBetween(22, 34));
      const dy = Phaser.Math.FloatBetween(-26, 26);
      const scale = Phaser.Math.FloatBetween(0.3, 0.36); // kleiner als ein Papageitaucher am Boden: sie fliegen hoch
      const img = scene.add.sprite(x0 + dx, y0 + dy - HEIGHT, FLY_ANIM).setScale(scale).setFlipX(dir < 0).setDepth(DEPTH).setAlpha(0);
      img.play({ key: FLY_ANIM, startFrame: Phaser.Math.Between(0, 10) });
      img.anims.timeScale = Phaser.Math.FloatBetween(0.9, 1.15);
      const shadow = scene.add.ellipse(x0 + dx, y0 + dy, 16, 5, 0x1c3550, 0.16).setDepth(SHADOW_DEPTH);
      return { img, shadow, x: x0 + dx, y: y0 + dy, bob: Math.random() * 6 };
    });
    this.flocks.push({ birds, vx: dir * speed, vy: dir * speed * slope * 0.5, t: 0, life: (view.width + 480) / speed });
  }

  update(dt) {
    this.next -= dt;
    if (this.next <= 0) {
      this.next = Phaser.Math.FloatBetween(...EVERY);
      this.spawn();
    }
    for (const f of this.flocks) {
      f.t += dt;
      const fade = Math.min(1, f.t / 0.8, (f.life - f.t) / 0.8);
      for (const b of f.birds) {
        b.x += f.vx * dt;
        b.y += f.vy * dt;
        const wave = Math.sin(f.t * 2 + b.bob) * 4;
        b.img.setPosition(b.x, b.y - HEIGHT + wave).setAlpha(Math.max(0, fade));
        b.shadow.setPosition(b.x, b.y).setAlpha(Math.max(0, fade));
      }
    }
    for (const f of this.flocks.filter((f) => f.t >= f.life)) this.remove(f);
  }

  remove(f) {
    for (const b of f.birds) {
      b.img.destroy();
      b.shadow.destroy();
    }
    this.flocks.splice(this.flocks.indexOf(f), 1);
  }

  // Event vorbei: die Schwärme, die gerade fliegen, ziehen noch zu Ende, neue kommen nicht
  destroy() {
    for (const f of [...this.flocks]) this.remove(f);
  }
}
