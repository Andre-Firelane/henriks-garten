// Krokodil (Savanne): verhält sich wie der Fisch – in den Wasserlöchern steigen Blasen auf, dann taucht kurz der Kopf auf.
// Nur solange es oben ist, kann man es fangen, und zwar mit dem Lasso. Gefangen läuft es an Land hinterher,
// im Krokodilteich schwimmt es dann im Wasser.
import Phaser from 'phaser';
import Animal from './Animal.js';
import Fish from './Fish.js';

const WATER_ORIGIN_Y = 40 / 44; // Wasserlinie im Bild "croc_water"
const SURFACED = ['rising', 'up', 'sinking'];

export default class Crocodile extends Fish {
  constructor(scene, allAnimals) {
    super(scene, allAnimals, 'crocodile');
  }

  // im Wasser: nur der Kopf schaut heraus
  useWaterLook() {
    this.sprite.setTexture('croc_water', 0).setOrigin(0.5, WATER_ORIGIN_Y).setScale(0.5);
    this.shadow.setVisible(false);
  }

  // an Land (gefangen): läuft auf allen vieren hinterher
  useBagLook() {
    this.sprite.setTexture(this.kind.texture, this.kind.frames.downRight).setOrigin(0.5, this.kind.originY).setScale(0.5);
    this.sprite.setVisible(true);
    this.shadow.setVisible(true);
  }

  // taucht mal mit dem Kopf zu uns, mal von uns weg auf
  pickSpot() {
    super.pickSpot();
    this.faceY = Math.random() < 0.6 ? 1 : -1;
  }

  render(moving) {
    if (this.state === 'following') {
      Animal.prototype.render.call(this, moving);
      return;
    }
    const f = this.kind.frames;
    this.sprite.setFrame(
      this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft,
    );
    // beim Auf- und Abtauchen schiebt sich der Kopf aus dem Wasser bzw. hinein
    let grow = 1;
    if (this.state === 'wild') {
      if (this.phase === 'rising') grow = 1 - this.phaseTime / 0.25;
      if (this.phase === 'sinking') grow = this.phaseTime / 0.25;
    }
    const bob = Math.sin(this.scene.time.now / 300 + this.x) * 1;
    this.sprite.setVisible(this.state !== 'wild' || SURFACED.includes(this.phase));
    this.sprite.setScale(0.5, 0.5 * Phaser.Math.Clamp(grow, 0.1, 1));
    this.sprite.setPosition(this.x, this.y + 3 + bob);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
  }
}
