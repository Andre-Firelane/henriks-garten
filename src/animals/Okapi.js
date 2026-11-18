// Okapi (Dschungel): scheu, aber neugierig. Kommt Henrik nah, rennt es ein Stück weg, bleibt dann stehen und schaut
// sich nach ihm um. Mit jedem Mal wird es mutiger: beim ersten Mal rennt es immer weg, spätestens beim dritten Mal bleibt
// es stehen (kein Zufall, der ein Kind fünfmal hintereinander leer ausgehen lässt). Steht es, füttert man es mit einem
// Blätterzweig vom Futterstrauch (siehe LeafBushes.js), dann läuft es mit (GardenScene.feedLeaves).
// Im Gehege läuft es herum wie jedes andere Tier.
import Phaser from 'phaser';
import Animal from './Animal.js';

const FLEE_TIME = [1.2, 1.8]; // so lange rennt es höchstens am Stück weg ...
const LOOK_TIME = [1.2, 2]; // ... dann bleibt es so lange stehen und schaut sich um
const SHY = [1, 2]; // so oft rennt es weg, bevor es stehen bleibt (zufällig je Tier)

export default class Okapi extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'okapi');
    this.shy = Phaser.Math.Between(...SHY);
    this.fled = 0; // so oft ist es schon weggerannt
    this.fleeLeft = 0;
    this.lookLeft = 0;
  }

  // (die eigene Flucht steuert updateFree)
  shouldFlee() {
    return false;
  }

  facePlayer(player) {
    this.faceX = Math.sign(player.x - this.x) || this.faceX;
    this.faceY = Math.sign(player.y - this.y) || this.faceY;
    this.dirX = 0;
    this.dirY = 0;
  }

  // mutig genug, um stehen zu bleiben?
  brave() {
    return this.fled >= this.shy;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    const d = Math.hypot(this.x - player.x, (this.y - player.y) * 2);
    if (this.fleeing) {
      this.fleeLeft -= dt;
      if (this.fleeLeft > 0 && d < this.kind.fleeDist * 1.8) return this.flee(dt, player);
      // stehen bleiben und umschauen: beim nächsten Mal ist es mutiger
      this.fleeing = false;
      this.fled++;
      this.lookLeft = Phaser.Math.FloatBetween(...LOOK_TIME);
      this.facePlayer(player);
      return false;
    }
    if (this.lookLeft > 0) {
      this.lookLeft -= dt;
      this.facePlayer(player);
      if (this.lookLeft <= 0) this.pickWander();
      return false;
    }
    if (d < this.kind.fleeDist) {
      if (!this.brave()) {
        this.fleeing = true;
        this.fleeLeft = Phaser.Math.FloatBetween(...FLEE_TIME);
        return this.flee(dt, player);
      }
      this.facePlayer(player); // mutig: bleibt stehen und schaut Henrik neugierig an
      return false;
    }
    return super.updateFree(dt, player);
  }

  // fangen (füttern) nur, solange es nicht wegrennt
  canBeCaughtNow() {
    return this.state === 'wild' && !this.fleeing;
  }
}
