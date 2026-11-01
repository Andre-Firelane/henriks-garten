// Jaguar (Dschungel, bei jedem Wetter; selten als Panther): schläft oben in einem Urwaldbaum, zu sehen ist nur sein
// Schwanz, der unter der Krone herunterhängt und pendelt. Ab und zu springt er herunter und rennt schnell auf seiner
// festen Route zu einem anderen Baum (und beim nächsten Mal auf derselben Route zurück), klettert hinauf und schläft
// wieder. Durch Dickicht rennt er einfach hindurch: steht es gerade, raschelt es und kleine Blätter fliegen.
// Fangen nur unten mit dem Lasso – am leichtesten, wenn man seine Route kennt und ihm auflauert.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile, TILE_W } from '../world/iso.js';
import { JUNGLE_TREES, MAP_W, MAP_H, charAt, inHut } from '../world/map.js';

const SLEEP = [25, 45]; // so lange schläft er oben im Baum
const ROUTE_LEN = [7, 14]; // so viele Kacheln liegen die beiden Bäume seiner Route auseinander
const BEND = 0.18; // so stark ist die Route gebogen (Anteil der Länge, zur Seite)
const RUN_SPEED = 115; // Welt-Pixel pro Sekunde (Henrik: 80)
const JUMP_TIME = 0.55; // herunterspringen ...
const CLIMB_TIME = 0.9; // ... und hinaufklettern
const PERCH_UP = 82; // so hoch liegt er oben im Baum (über dem Fuß des Baums)
const AT_TREE = { x: 14, y: 6 }; // Platz am Stamm (unten), dort springt er herunter bzw. klettert hinauf
const TAIL_AT = { x: 14, up: 80 }; // dort hängt der Schwanz aus der Krone (am Ast über AT_TREE)
const TAIL_ORIGIN = [26 / 48, 3 / 48]; // Ansatz im Bild des Schwanzes (tools/jaguar-tail.py), dort hängt er am Ast
const TAIL_SWING = 4; // Grad, so weit pendelt er zusätzlich (die Animation schwingt schon selbst)
const BLOCKS = ['~', 'Ŕ', 'Ŵ', 'Ŝ', ' ']; // darüber rennt er nicht (Wasser, Felsklippe, Wasserfall, Steg)
const RUSTLE_EVERY = 0.12; // Sekunden zwischen zwei Blätter-Schauern im Dickicht
const LEAVES = 4; // Blätter je Schauer

export default class Jaguar extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'jaguar');
    this.mode = 'tree'; // wild: 'tree' → 'down' → 'run' → 'up' → 'tree'
    this.lift = 0;
    this.time = 0;
    this.tail = scene.add.sprite(x, y, 'jaguar_tail_idle', 0).setOrigin(...TAIL_ORIGIN).setScale(0.5).setVisible(false);
    this.rustleIn = 0;
  }

  // ein Jaguar oben in einem Baum mit seiner Route zu einem zweiten Baum; gibt ihn zurück
  static spawnInTree(scene) {
    const route = Jaguar.pickRoute(scene);
    if (!route) return [];
    const a = scene.createAnimal('jaguar', route.from.x, route.from.y);
    a.route = route;
    a.dir = 1; // 1: von from nach to, -1 zurück
    a.sleepAt(route.from);
    a.time = Phaser.Math.FloatBetween(5, SLEEP[1]); // nicht alle sofort
    return [a];
  }

  // zwei Urwaldbäume im passenden Abstand, dazwischen ein gebogener Weg nur über Land
  static pickRoute(scene) {
    const busy = new Set(scene.animals.flatMap((a) => [a.tree, a.route?.from.tree, a.route?.to.tree]).filter(Boolean).map((t) => `${t.tx},${t.ty}`));
    const trees = Phaser.Utils.Array.Shuffle(JUNGLE_TREES.filter((t) => !busy.has(`${t.tx},${t.ty}`)));
    for (const a of trees) {
      const others = Phaser.Utils.Array.Shuffle(trees.filter((b) => b !== a && Math.hypot(b.tx - a.tx, b.ty - a.ty) >= ROUTE_LEN[0] && Math.hypot(b.tx - a.tx, b.ty - a.ty) <= ROUTE_LEN[1]));
      for (const b of others) {
        const from = Jaguar.treeSpot(a);
        const to = Jaguar.treeSpot(b);
        for (const side of Phaser.Utils.Array.Shuffle([1, -1])) {
          const route = { from, to, bend: side * BEND };
          if (Jaguar.routeFree(route)) return route;
        }
      }
    }
    return null;
  }

  static treeSpot(t) {
    const p = tileToWorld(t.tx, t.ty);
    return { tree: t, x: p.x + AT_TREE.x, y: p.y + AT_TREE.y, base: p };
  }

  // Punkt auf der Route (k von 0 bis 1): Bogen von from nach to
  static routeAt(r, k) {
    const dx = r.to.x - r.from.x;
    const dy = r.to.y - r.from.y;
    const len = Math.hypot(dx, dy * 2);
    const side = Math.sin(k * Math.PI) * r.bend * len;
    return { x: r.from.x + dx * k - (dy * 2 / len) * side, y: r.from.y + dy * k + (dx / len) * side * 0.5 };
  }

  static routeFree(r) {
    const len = Math.hypot(r.to.x - r.from.x, (r.to.y - r.from.y) * 2);
    const steps = Math.ceil(len / (TILE_W / 4));
    for (let i = 1; i < steps; i++) {
      const p = Jaguar.routeAt(r, i / steps);
      const { tx, ty } = worldToTile(p.x, p.y);
      if (tx < 1 || ty < 1 || tx >= MAP_W - 1 || ty >= MAP_H - 1) return false;
      if (BLOCKS.includes(charAt(tx, ty)) || inHut(tx, ty, 1)) return false;
    }
    return true;
  }

  sleepAt(spot) {
    this.mode = 'tree';
    this.spot = spot;
    this.x = spot.x;
    this.y = spot.y;
    this.lift = PERCH_UP;
    this.time = Phaser.Math.FloatBetween(...SLEEP);
  }

  canBeCaughtNow() {
    return this.state === 'wild' && (this.mode === 'run' || (this.mode !== 'tree' && this.lift < 30));
  }

  canDespawn() {
    return this.mode === 'tree';
  }

  shouldFlee() {
    return false;
  }

  // auf seiner Route rennt er durch Dickicht und Gebüsch hindurch
  blocked(x, y) {
    if (this.state === 'wild') return false;
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') {
      this.lift = 0;
      return super.updateFree(dt, player);
    }
    if (!this.route) {
      // nach dem Laden ohne Route: eine neue suchen, sonst einfach hier im Baum bleiben
      this.route = Jaguar.pickRoute(this.scene);
      this.dir = 1;
      if (this.route) this.sleepAt(this.route.from);
      return false;
    }
    this.time -= dt;
    const r = this.route;
    if (this.mode === 'tree') {
      if (this.time > 0) return false;
      this.mode = 'down';
      this.time = JUMP_TIME;
      return false;
    }
    if (this.mode === 'down') {
      this.faceY = 1; // springt nach vorne herunter
      this.lift = PERCH_UP * Math.max(0, this.time / JUMP_TIME) ** 2;
      if (this.time > 0) return true; // mit der Laufanimation
      this.mode = 'run';
      this.k = 0;
      this.len = Math.hypot(r.to.x - r.from.x, r.to.y - r.from.y) * (1 + Math.abs(r.bend));
      return false;
    }
    if (this.mode === 'run') {
      this.k = Math.min(1, this.k + (RUN_SPEED * dt) / this.len);
      const p = Jaguar.routeAt(r, this.dir > 0 ? this.k : 1 - this.k);
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      if (Math.abs(dx) > 0.05) this.faceX = Math.sign(dx);
      if (Math.abs(dy) > Math.abs(dx) * 0.3) this.faceY = Math.sign(dy);
      this.x = p.x;
      this.y = p.y;
      this.rustle(dt);
      if (this.k >= 1) {
        this.mode = 'up';
        this.time = CLIMB_TIME;
        this.spot = this.dir > 0 ? r.to : r.from; // klettert am Zielbaum hinauf
      }
      return true;
    }
    if (this.mode === 'up') {
      this.faceY = -1; // klettert am Stamm hinauf (Laufanimation von hinten)
      this.lift = PERCH_UP * (1 - Math.max(0, this.time / CLIMB_TIME));
      if (this.time > 0) return true;
      const end = this.dir > 0 ? r.to : r.from;
      this.dir = -this.dir; // nächstes Mal auf derselben Route zurück
      this.sleepAt(end);
    }
    return false;
  }

  // im Dickicht (solange es steht): es raschelt, kleine Blätter fliegen
  rustle(dt) {
    this.rustleIn -= dt;
    if (this.rustleIn > 0) return;
    const thicket = this.scene.thicket;
    const { tx, ty } = worldToTile(this.x, this.y);
    const key = `${tx},${ty}`;
    if (!thicket?.images.has(key) || thicket.stage(key) === 0) return;
    this.rustleIn = RUSTLE_EVERY;
    const img = thicket.images.get(key);
    if (!img.shaking) {
      img.shaking = true;
      this.scene.tweens.add({ targets: img, angle: { from: -4, to: 4 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => { img.setAngle(0); img.shaking = false; } });
    }
    for (let i = 0; i < LEAVES; i++) {
      const leaf = this.scene.add
        .ellipse(this.x + Phaser.Math.Between(-10, 10), this.y - Phaser.Math.Between(8, 26), 4, 2, Phaser.Utils.Array.GetRandom([0x3f8a2c, 0x5aa83a, 0x2f6e22]))
        .setAngle(Phaser.Math.Between(0, 180))
        .setDepth(this.y + 2);
      this.scene.tweens.add({
        targets: leaf,
        x: leaf.x + Phaser.Math.Between(-22, 22),
        y: leaf.y + Phaser.Math.Between(-18, 6),
        angle: leaf.angle + Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: Phaser.Math.Between(450, 750),
        ease: 'Quad.easeOut',
        onComplete: () => leaf.destroy(),
      });
    }
  }

  catch() {
    this.mode = null;
    this.lift = 0;
    this.route = null;
    this.tail.setVisible(false);
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.lift = 0;
    if (state !== 'wild') this.mode = null;
  }

  destroy() {
    this.tail.destroy();
    super.destroy();
  }

  render(moving) {
    super.render(moving);
    const wild = this.state === 'wild';
    const inTree = wild && this.mode === 'tree';
    // oben im Baum: unsichtbar in der Krone, nur der Schwanz hängt heraus und pendelt
    this.sprite.setVisible(!inTree);
    this.shadow.setVisible(!inTree && this.lift < PERCH_UP * 0.5);
    const tailKey = `${this.skin ?? 'jaguar'}_tail_idle`;
    if (inTree && this.spot) {
      const b = this.spot.base;
      const t = this.scene.time.now / 1000;
      // pendelt wie in der Steh-Animation (an zufälliger Stelle beginnen)
      if (this.tail.anims.currentAnim?.key !== tailKey && this.scene.anims.exists(tailKey)) {
        this.tail.play({ key: tailKey, startFrame: Phaser.Math.Between(0, this.scene.anims.get(tailKey).frames.length - 1) });
      }
      this.tail
        .setVisible(true)
        .setPosition(b.x + TAIL_AT.x, b.y - TAIL_AT.up)
        .setAngle(Math.sin(t * 1.1 + this.x) * TAIL_SWING)
        .setDepth(b.y + 1);
    } else this.tail.setVisible(false);
    if (!wild || !this.lift || inTree) return;
    this.sprite.setY(this.sprite.y - this.lift);
    if (this.lift > 30) this.sprite.setDepth(this.spot ? this.spot.base.y + 1 : this.y); // am Stamm vor der Krone
  }
}
