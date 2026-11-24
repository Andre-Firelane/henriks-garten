// Schaf und die anderen Hoftiere (Kuh, Schwein, Ziege): laufen gemütlich herum und senken in regelmäßigen Abständen den
// Kopf zum Grasen – draußen wie im Streichelzoo. Am Fangen ändert das nichts.
import Phaser from 'phaser';
import Animal from './Animal.js';

const GRAZE_EVERY = [6, 12]; // Sekunden zwischen zwei Grasepausen
const GRAZE_TIME = [3, 6]; // so lange grast es

export default class Sheep extends Animal {
  constructor(scene, x, y, species = 'sheep') {
    super(scene, x, y, species);
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

  // beim Streicheln nicht grasen (siehe Animal.petStill)
  petStill() {
    this.grazing = false;
    super.petStill();
  }

  startFeed() {
    this.grazing = false;
  }

  setEating(on) {
    this.grazing = on;
  }

  catch() {
    this.grazing = false;
    super.catch();
  }

  // beim Grasen das Standbild
  animKey(moving) {
    return this.grazing ? null : super.animKey(moving);
  }

  // Grasen: das Fress-Bild (mit Skin dessen, z. B. sheep2_eat), sonst das Bild der Art
  grazeTexture() {
    return this.eatTexture() ?? `${this.baseTexture()}_eat`;
  }

  render(moving) {
    const key = this.grazing ? this.grazeTexture() : this.baseTexture();
    // eine laufende Animation setzt ihr Bild selbst (siehe Animal.render)
    const onAnim = !this.grazing && Object.values(this.animSet() ?? {}).includes(this.sprite.texture.key);
    if (this.sprite.texture.key !== key && !onAnim) {
      const skinAnims = Object.values(this.kind.skinAnims ?? {}).flatMap((s) => Object.values(s));
      const fromAnim = [...Object.values(this.kind.anims ?? {}), ...skinAnims].includes(this.sprite.texture.key);
      this.sprite.stop().setFlipX(false);
      this.sprite.setTexture(key, fromAnim ? 0 : this.sprite.frame.name);
    }
    super.render(moving);
  }
}
