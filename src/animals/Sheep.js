// Schaf: läuft gemütlich herum und senkt in regelmäßigen Abständen den Kopf zum Grasen – draußen wie auf der Weide.
// Am Fangen ändert das nichts.
import Phaser from 'phaser';
import Animal from './Animal.js';

const GRAZE_EVERY = [6, 12]; // Sekunden zwischen zwei Grasepausen
const GRAZE_TIME = [3, 6]; // so lange grast es

export default class Sheep extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'sheep');
    this.grazing = false;
    this.grazeTime = Phaser.Math.FloatBetween(1, GRAZE_EVERY[1]); // nicht alle gleichzeitig
  }

  updateFree(dt, player) {
    if (this.state === 'following' || this.state === 'trapped') {
      this.grazing = false;
      return super.updateFree(dt, player);
    }
    this.grazeTime -= dt;
    if (this.grazing) {
      if (this.grazeTime <= 0 || this.shouldFlee(player)) {
        this.grazing = false;
        this.grazeTime = Phaser.Math.FloatBetween(...GRAZE_EVERY);
        this.pickWander();
      }
      return false;
    }
    if (this.grazeTime <= 0) {
      this.grazing = true;
      this.grazeTime = Phaser.Math.FloatBetween(...GRAZE_TIME);
      return false;
    }
    return super.updateFree(dt, player);
  }

  catch() {
    this.grazing = false;
    super.catch();
  }

  render(moving) {
    const key = this.grazing ? 'sheep_eat' : this.kind.texture;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key, this.sprite.frame.name);
    super.render(moving);
  }
}
