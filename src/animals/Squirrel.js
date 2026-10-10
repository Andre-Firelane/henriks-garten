// Eichhörnchen: sitzt meistens oben auf seinem Baum und kommt ab und zu für ein paar Sekunden herunter.
// Nur unten kann man es fangen. Ist der Spieler nah am Baum, bleibt es oben: man muss etwas Abstand
// halten, lauern und schnell hinlaufen, wenn es herunterkommt.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { SQUIRREL_TREES } from '../world/map.js';

const UP_TIME = [4, 9]; // so lange sitzt es oben (zufällig)
const GROUND_TIME = [2.5, 4]; // so lange bleibt es unten
const CLIMB_TIME = 0.7; // Dauer des Kletterns rauf oder runter
const SHY_DIST = 80; // ist der Spieler näher am Baum, kommt es nicht herunter
const CROWN_Y = 52; // so hoch über dem Stammfuß sitzt es in der Krone
const LOOK_TIME = [0.6, 1.4]; // unten schaut es sich in diesem Rhythmus um

// Phasen in der Wildnis: up → down → ground → climb → up
export default class Squirrel extends Animal {
  // allAnimals: damit nicht zwei Eichhörnchen auf demselben Baum wohnen
  constructor(scene, allAnimals) {
    super(scene, 0, 0, 'squirrel');
    this.allAnimals = allAnimals;
    this.pickTree();
    this.setPhase('up', Phaser.Math.FloatBetween(1, UP_TIME[1]));
  }

  pickTree() {
    const used = this.allAnimals.filter((a) => a !== this && a.tree).map((a) => a.tree);
    const free = SQUIRREL_TREES.filter((t) => !used.includes(t));
    this.tree = Phaser.Utils.Array.GetRandom(free.length ? free : SQUIRREL_TREES);
    const foot = tileToWorld(this.tree.tx, this.tree.ty);
    const ground = tileToWorld(this.tree.ground.tx, this.tree.ground.ty);
    this.crownPos = { x: foot.x + 6, y: foot.y - CROWN_Y };
    // unten sitzt es zwischen Stamm und freiem Platz, etwas näher am Platz
    this.groundPos = { x: foot.x + (ground.x - foot.x) * 0.6, y: foot.y + (ground.y - foot.y) * 0.6 };
    this.treeY = foot.y;
    this.x = this.crownPos.x;
    this.y = this.crownPos.y;
  }

  setPhase(phase, time) {
    this.phase = phase;
    this.phaseTime = time;
  }

  canDespawn() {
    return this.phase === 'up';
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'ground';
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return super.updateFree(dt, player); // läuft im Gehege herum

    this.phaseTime -= dt;
    switch (this.phase) {
      case 'up':
        this.x = this.crownPos.x;
        this.y = this.crownPos.y;
        if (this.phaseTime <= 0) {
          const foot = tileToWorld(this.tree.tx, this.tree.ty);
          const near = Math.hypot(player.x - foot.x, (player.y - foot.y) * 2) < SHY_DIST;
          // Spieler zu nah: noch etwas oben bleiben und später erneut schauen
          if (near) this.phaseTime = 0.5;
          else this.setPhase('down', CLIMB_TIME);
        }
        return false;
      case 'down':
      case 'climb': {
        const t = 1 - Math.max(0, this.phaseTime) / CLIMB_TIME;
        const [from, to] = this.phase === 'down' ? [this.crownPos, this.groundPos] : [this.groundPos, this.crownPos];
        this.x = from.x + (to.x - from.x) * t;
        this.y = from.y + (to.y - from.y) * t;
        this.faceY = this.phase === 'down' ? 1 : -1;
        if (this.phaseTime <= 0) {
          if (this.phase === 'down') {
            this.setPhase('ground', Phaser.Math.FloatBetween(...GROUND_TIME));
            this.lookTime = 0;
          } else {
            this.setPhase('up', Phaser.Math.FloatBetween(...UP_TIME));
          }
        }
        return true;
      }
      default: // ground: sitzt und schaut sich um
        this.x = this.groundPos.x;
        this.y = this.groundPos.y;
        this.lookTime -= dt;
        if (this.lookTime <= 0) {
          this.faceX = Math.random() < 0.5 ? -1 : 1;
          this.faceY = 1;
          this.lookTime = Phaser.Math.FloatBetween(...LOOK_TIME);
        }
        if (this.phaseTime <= 0) this.setPhase('climb', CLIMB_TIME);
        return false;
    }
  }

  render(moving) {
    super.render(moving);
    if (this.state !== 'wild') {
      this.shadow.setVisible(true);
      return;
    }
    // Am Baum wird es vor der Krone gezeichnet; nur unten hat es einen Schatten
    const onGround = this.phase === 'ground';
    this.shadow.setVisible(onGround);
    if (!onGround) this.sprite.setDepth(this.treeY + 1);
  }

  restore(state) {
    super.restore(state);
    if (state === 'wild') this.setPhase('up', Phaser.Math.FloatBetween(1, UP_TIME[1]));
  }
}
