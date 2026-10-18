// Schaf: läuft gemütlich herum und senkt in regelmäßigen Abständen den Kopf zum Grasen – draußen wie auf der Weide.
// Am Fangen ändert das nichts.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { isActive } from '../world/events.js';

const GRAZE_EVERY = [6, 12]; // Sekunden zwischen zwei Grasepausen
const GRAZE_TIME = [3, 6]; // so lange grast es
// Bauernhof-Event: freie Schafe sehen reihum aus wie Kuh, Schwein oder Ziege (verhalten sich aber weiter wie Schafe).
// Wer so gefangen wird, behält das Aussehen für immer; nach dem Event sind die freien wieder Schafe.
const FARM_LOOKS = ['cow', 'pig', 'goat'];
let farmCounter = 0;

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

  // Bauernhof-Event: welches Tier das Schaf spielt (oder null). Gefangene behalten es, freie nur während des Events
  farmLook() {
    if (this.state !== 'wild') return this.farm ?? null; // gefangen, in der Falle oder im Gehege: bleibt, wie es ist
    if (!isActive('farm')) return (this.farm = null);
    this.farm ??= FARM_LOOKS[farmCounter++ % FARM_LOOKS.length];
    return this.farm;
  }

  render(moving) {
    const farm = this.farmLook();
    const key = farm ? `farm_${farm}${this.grazing ? '_eat' : ''}` : this.grazing ? 'sheep_eat' : this.kind.texture;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key, this.sprite.frame.name);
    super.render(moving);
  }
}
