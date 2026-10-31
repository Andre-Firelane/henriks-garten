// Krake (Riff): tarnt sich – fast durchsichtig liegt sie auf dem Meeresboden und bewegt sich kaum. Kommt man näher,
// wird sie vor Schreck sichtbar und versucht wegzuschwimmen (etwas langsamer als der Taucher). Erwischt man sie nicht
// schnell genug mit dem Kescher, verschwindet sie in einer Tintenwolke, die sich langsam auflöst.
// Gefangen schwimmt sie wie die Riff-Fische hinter Henrik her (an Land im Beutel) und zieht ins Krakenbecken im Aquarium.
import Phaser from 'phaser';
import ReefFish from './ReefFish.js';

const CAMO_ALPHA = 0.36; // so durchsichtig ist sie getarnt (noch gut zu entdecken) ...
const CAMO_SHIMMER = 0.1; // ... und flimmert dabei langsam etwas auf und ab, damit sie ins Auge fällt
const SEEN_ALPHA = 0.9; // ... und so deutlich, wenn sie flieht
const NOTICE_DIST = 95; // so nah darf man kommen, dann schwimmt sie los
const CALM_DIST = 190; // ist man wieder so weit weg, tarnt sie sich wieder
const ESCAPE_TIME = 3.5; // so lange hat man Zeit, sie zu keschern – dann ist sie in der Tinte verschwunden
const DRIFT = [3, 7]; // Sekunden zwischen zwei kleinen Bewegungen am Boden
const DRIFT_STEP = 6; // ... und so weit (Pixel)
const REST_H = 15; // Bildmitte so hoch über dem Boden: sie liegt auf dem Sand
const SWIM_H = 24; // beim Schwimmen etwas höher
const TANK_HEIGHT = [15, 34]; // im Becken bleibt sie unten
const SCALE = 0.5; // Bild 72 × 72
const INK_TIME = 5000; // so lange braucht die Tintenwolke, bis sie sich aufgelöst hat (Millisekunden)

export default class Octopus extends ReefFish {
  constructor(scene, x, y) {
    super(scene, x, y, 0, null, 'octopus');
    this.variant = undefined; // nur eine Art
    this.mode = 'camo';
    this.h = REST_H;
    this.driftIn = Phaser.Math.FloatBetween(...DRIFT);
    this.look = CAMO_ALPHA;
  }

  swimFrame() {
    const f = this.kind.swimFrames;
    return this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
  }

  swimScale() {
    return SCALE;
  }

  heights() {
    return this.inTank() ? TANK_HEIGHT : [REST_H, REST_H];
  }

  canDespawn() {
    return this.state !== 'wild' || this.mode === 'camo';
  }

  shouldFlee() {
    return false; // fliehen regelt sie selbst (siehe updateFree)
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
    if (this.mode === 'camo') {
      if (d < NOTICE_DIST) {
        this.mode = 'flee';
        this.escape = ESCAPE_TIME;
        return false;
      }
      // fast reglos: ab und zu ein kleines Stück über den Boden
      this.h += (REST_H - this.h) * Math.min(1, dt * 2);
      this.driftIn -= dt;
      if (this.driftIn > 0) return false;
      this.driftIn = Phaser.Math.FloatBetween(...DRIFT);
      const a = Math.random() * Math.PI * 2;
      return this.move(Math.cos(a) * DRIFT_STEP, Math.sin(a) * DRIFT_STEP * 0.5);
    }
    // auf der Flucht: weg vom Taucher, bis die Zeit um ist – dann Tinte und weg
    this.escape -= dt;
    if (this.escape <= 0) return this.inkAway();
    if (d > CALM_DIST) {
      this.mode = 'camo';
      return false;
    }
    this.h += (SWIM_H - this.h) * Math.min(1, dt * 3);
    return this.flee(dt, player);
  }

  // Tintenwolke: dunkle Kleckse, die sich ausbreiten und langsam auflösen; die Krake ist danach fort
  inkAway() {
    const scene = this.scene;
    const x = this.x;
    const y = this.y - this.h;
    for (let i = 0; i < 9; i++) {
      const puff = scene.add
        .ellipse(x + Phaser.Math.Between(-10, 10), y + Phaser.Math.Between(-6, 6), Phaser.Math.Between(10, 18), Phaser.Math.Between(8, 14), i % 3 ? 0x1c1a2c : 0x2c2840, 0.8)
        .setDepth(this.y + 20);
      scene.tweens.add({
        targets: puff,
        x: puff.x + Phaser.Math.Between(-22, 22),
        y: puff.y + Phaser.Math.Between(-16, 8),
        scale: Phaser.Math.FloatBetween(2.6, 3.8),
        alpha: 0,
        duration: INK_TIME * Phaser.Math.FloatBetween(0.8, 1.1),
        ease: 'Sine.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
    scene.inkEscape?.(this);
    scene.despawn(this);
    return false;
  }

  restore(state) {
    super.restore(state);
    this.h = state === 'penned' ? TANK_HEIGHT[0] : REST_H;
  }

  enterPen() {
    super.enterPen();
    this.h = TANK_HEIGHT[0];
  }

  render(moving) {
    super.render(moving);
    if (this.state !== 'wild') {
      this.sprite.setAlpha(1);
      return;
    }
    // getarnt fast unsichtbar (ohne Schatten), auf der Flucht deutlich zu sehen
    const shimmer = Math.sin(this.scene.time.now / 700 + this.x) * CAMO_SHIMMER;
    const goal = this.mode === 'camo' ? CAMO_ALPHA + shimmer : SEEN_ALPHA;
    this.look += (goal - this.look) * 0.08;
    this.sprite.setAlpha(this.look);
    this.shadow.setVisible(this.mode !== 'camo');
  }
}
