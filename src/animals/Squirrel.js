// Eichhörnchen: sitzt meistens oben auf seinem Baum und kommt ab und zu für ein paar Sekunden herunter.
// Nur unten kann man es fangen. Ist der Spieler nah am Baum, bleibt es oben: man muss etwas Abstand
// halten, lauern und schnell hinlaufen, wenn es herunterkommt.
// In der Voliere flitzt es herum und klettert ab und zu auf einen der Bäume dort, sitzt eine Weile oben und kommt wieder herunter.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { SQUIRREL_TREES, objectAt } from '../world/map.js';

const UP_TIME = [4, 9]; // so lange sitzt es oben (zufällig)
const GROUND_TIME = [2.5, 4]; // so lange bleibt es unten
const CLIMB_TIME = 0.7; // Dauer des Kletterns rauf oder runter
const SHY_DIST = 80; // ist der Spieler näher am Baum, kommt es nicht herunter
const CROWN_Y = 52; // so hoch über dem Stammfuß sitzt es in der Krone
const LOOK_TIME = [0.6, 1.4]; // unten schaut es sich in diesem Rhythmus um
const PEN_ROAM = [5, 12]; // in der Voliere: so lange flitzt es herum ...
const PEN_UP = [6, 12]; // ... und so lange sitzt es oben im Baum
const PEN_WALK_TIMEOUT = 8; // kommt es nicht an den Baum, versucht es es später wieder
const TREE_KEYS = ['pine', 'dark_tree', 'tree'];
// Plätze rund um den Stamm, von denen es hinaufklettert (der erste freie wird genommen)
const CLIMB_SPOTS = [[0, 14], [-18, 9], [18, 9], [-18, -9], [18, -9]];

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
    if (this.state === 'penned') return this.updatePen(dt, player);

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

  // In der Voliere: herumflitzen → zu einem Baum laufen → hinaufklettern → oben sitzen → hinunter
  updatePen(dt, player) {
    const c = this.penClimb;
    this.penTime = (this.penTime ?? Phaser.Math.FloatBetween(2, PEN_ROAM[1])) - dt;
    if (!c) {
      if (this.penTime > 0) return super.updateFree(dt, player);
      this.penTime = Phaser.Math.FloatBetween(...PEN_ROAM);
      const tree = this.penTree();
      if (tree) {
        this.penClimb = { ...tree, phase: 'walk' };
        this.penTime = PEN_WALK_TIMEOUT;
      }
      return false;
    }
    if (c.phase === 'walk') {
      const dx = c.ground.x - this.x;
      const dy = c.ground.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) {
        c.phase = 'climb';
        this.penTime = CLIMB_TIME;
        return false;
      }
      if (this.penTime <= 0) {
        this.penClimb = null;
        this.penTime = Phaser.Math.FloatBetween(...PEN_ROAM);
        return false;
      }
      const step = Math.min(d, this.kind.speed * dt);
      return this.move((dx / d) * step, (dy / d) * step);
    }
    if (c.phase === 'climb' || c.phase === 'down') {
      const t = 1 - Math.max(0, this.penTime) / CLIMB_TIME;
      const [from, to] = c.phase === 'climb' ? [c.ground, c.crown] : [c.crown, c.ground];
      this.x = from.x + (to.x - from.x) * t;
      this.y = from.y + (to.y - from.y) * t;
      this.faceY = c.phase === 'down' ? 1 : -1;
      if (this.penTime <= 0) {
        if (c.phase === 'climb') {
          c.phase = 'up';
          this.penTime = Phaser.Math.FloatBetween(...PEN_UP);
          this.lookTime = 0;
        } else {
          this.penClimb = null;
          this.penTime = Phaser.Math.FloatBetween(...PEN_ROAM);
          this.pickWander();
        }
      }
      return true;
    }
    // oben im Baum: umschauen
    this.x = c.crown.x;
    this.y = c.crown.y;
    this.lookTime -= dt;
    if (this.lookTime <= 0) {
      this.faceX = Math.random() < 0.5 ? -1 : 1;
      this.faceY = 1;
      this.lookTime = Phaser.Math.FloatBetween(...LOOK_TIME);
    }
    if (this.penTime <= 0) {
      c.phase = 'down';
      this.penTime = CLIMB_TIME;
    }
    return false;
  }

  // ein Baum in der eigenen Voliere, auf dem gerade kein anderes Eichhörnchen sitzt, mit freiem Platz am Stamm
  penTree() {
    const a = this.enclosure?.area;
    if (!a) return null;
    const taken = this.allAnimals.filter((s) => s !== this && s.penClimb).map((s) => s.penClimb.key);
    const trees = [];
    for (const { tx, ty } of this.enclosure.tiles) {
      { // nur Kacheln, die wirklich zum Gehege gehören (auch bei L-Formen)
        const key = `${tx},${ty}`;
        if (!TREE_KEYS.includes(objectAt(tx, ty)?.key) || taken.includes(key)) continue;
        const foot = tileToWorld(tx, ty);
        const spot = CLIMB_SPOTS.find(([dx, dy]) => !this.blocked(foot.x + dx, foot.y + dy));
        if (!spot) continue;
        trees.push({
          key,
          treeY: foot.y,
          ground: { x: foot.x + spot[0], y: foot.y + spot[1] },
          crown: { x: foot.x + 6, y: foot.y - CROWN_Y },
        });
      }
    }
    trees.sort((p, q) => Math.hypot(p.ground.x - this.x, p.ground.y - this.y) - Math.hypot(q.ground.x - this.x, q.ground.y - this.y));
    return trees[0] ?? null;
  }

  render(moving) {
    super.render(moving);
    const c = this.state === 'penned' ? this.penClimb : null;
    if (c && c.phase !== 'walk') {
      // am Baum vor der Krone, ohne Schatten
      this.shadow.setVisible(false);
      this.sprite.setDepth(c.treeY + 1);
      return;
    }
    if (this.state !== 'wild') {
      this.shadow.setVisible(true);
      return;
    }
    // Am Baum wird es vor der Krone gezeichnet; nur unten hat es einen Schatten
    const onGround = this.phase === 'ground';
    this.shadow.setVisible(onGround);
    if (!onGround) this.sprite.setDepth(this.treeY + 1);
  }

  canFeed() {
    return super.canFeed() && !this.penClimb; // erst, wenn es wieder unten ist
  }

  catch() {
    this.penClimb = null;
    super.catch();
  }

  restore(state) {
    this.penClimb = null;
    this.penTime = undefined;
    super.restore(state);
    if (state === 'wild') this.setPhase('up', Phaser.Math.FloatBetween(1, UP_TIME[1]));
  }
}
