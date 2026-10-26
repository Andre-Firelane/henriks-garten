// Roter Panda (Glühwürmchen-Abend im Bambuswald): sitzt oben in einem Kirschblütenbaum und kommt nicht von selbst
// herunter. Steht ein leuchtendes Glas vor seinem Baum (siehe GlowJar in tools/FireflyJar.js), klettert er neugierig
// herunter und setzt sich daneben – dann fängt man ihn durch Berühren. Nach einer Weile klettert er wieder hinauf.
// Im Pandagehege läuft er herum und klettert ab und zu für eine Weile auf den Kirschbaum.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { MAP_W, MAP_H, charAt, inPen, isBlocked } from '../world/map.js';

const CROWN_UP = 50; // Höhe der Krone über dem Fuß des Kirschbaums
const LURE_DIST = 70; // so nah muss das leuchtende Glas vor dem Baum stehen
const CLIMB_MS = 1100; // so lange klettert er herunter bzw. hinauf
const DOWN_TIME = 20; // so lange sitzt er unten beim Glas
const PEN_CLIMB_EVERY = [30, 60]; // im Gehege: so oft klettert er auf den Kirschbaum ...
const PEN_TREE_TIME = [8, 14]; // ... und so lange bleibt er oben

export default class RedPanda extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'redpanda');
    this.phase = null; // wild: 'tree' → 'climb' → 'down' → 'up' → 'tree'; im Gehege null bzw. 'tree'
  }

  // Kirschbäume (nicht am Kartenrand); wild: nicht im Gehege, im Gehege: nur die eigenen
  static trees(scene, pen = null) {
    const list = [];
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        if (charAt(tx, ty) !== 'K') continue;
        if (pen ? !pen.tileSet.has(tx + ',' + ty) : inPen(tx, ty)) continue;
        list.push({ tx, ty });
      }
    }
    return list;
  }

  // in einen freien Kirschbaum setzen; gibt zurück, ob einer frei war
  placeInTree() {
    const taken = this.scene.animals.filter((a) => a !== this && a.species === 'redpanda' && a.tree).map((a) => a.tree);
    const free = RedPanda.trees(this.scene).filter((t) => !taken.some((u) => u.tx === t.tx && u.ty === t.ty));
    const tree = Phaser.Utils.Array.GetRandom(free);
    if (!tree) return false;
    this.climbInto(tree);
    return true;
  }

  climbInto(tree) {
    this.tree = tree;
    const p = tileToWorld(tree.tx, tree.ty);
    this.x = p.x;
    this.y = p.y + 3; // knapp vor dem Stamm
    this.phase = 'tree';
    this.showInTree();
  }

  showInTree() {
    this.peek ??= this.scene.add.image(0, 0, 'redpanda_tree').setOrigin(0.5, 0.8).setScale(0.5);
    this.peek.setPosition(this.x, this.y - CROWN_UP).setDepth(this.y + 2).setVisible(true).setFlipX(Math.random() < 0.5);
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'down';
  }

  canDespawn() {
    return this.phase === 'tree';
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild') return false; // er bewegt sich nur am Baum entlang
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return this.updatePen(dt, player);
    if (this.phase === 'tree') {
      // leuchtendes Glas vor dem Baum? Dann neugierig herunterklettern
      const jar = this.scene.pickups.find((p) => p.tool === 'glowjar' && !p.collected && Math.hypot(p.x - this.x, (p.y - this.y) * 2) < LURE_DIST);
      if (jar) this.climbDown(jar);
      return false;
    }
    if (this.phase === 'down') {
      this.phaseTime -= dt;
      if (this.phaseTime <= 0) this.climbUp();
    }
    return false;
  }

  climbDown(jar) {
    this.phase = 'climb';
    this.peek.setVisible(false);
    // setzt sich zwischen Baum und Glas
    const to = { x: this.x + (jar.x - this.x) * 0.45, y: this.y + (jar.y - this.y) * 0.45 + 2 };
    this.faceX = Math.sign(jar.x - this.x) || 1;
    this.faceY = 1;
    this.climbY = CROWN_UP;
    this.scene.tweens.add({
      targets: this,
      climbY: 0,
      duration: CLIMB_MS,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.state !== 'wild') return;
        this.scene.tweens.add({ targets: this, x: to.x, y: to.y, duration: 400 });
        this.phase = 'down';
        this.phaseTime = DOWN_TIME;
        this.setEating(true); // sitzt neben dem Glas
      },
    });
  }

  climbUp() {
    this.phase = 'up';
    this.setEating(false);
    const p = tileToWorld(this.tree.tx, this.tree.ty);
    this.scene.tweens.add({ targets: this, x: p.x, y: p.y + 3, duration: 400 });
    this.scene.tweens.add({
      targets: this,
      climbY: CROWN_UP,
      delay: 400,
      duration: CLIMB_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.state === 'wild') this.climbInto(this.tree);
      },
    });
  }

  // im Gehege: herumlaufen, ab und zu auf den Kirschbaum klettern
  updatePen(dt, player) {
    if (this.phase === 'tree') {
      this.phaseTime -= dt;
      if (this.phaseTime > 0) return false;
      // wieder herunter: auf einen freien Platz neben dem Baum
      this.phase = null;
      this.peek?.setVisible(false);
      const free = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => ({ tx: this.tree.tx + dx, ty: this.tree.ty + dy })).find((t) => !isBlocked(t.tx, t.ty) && this.enclosure?.tileSet.has(t.tx + ',' + t.ty));
      if (free) Object.assign(this, tileToWorld(free.tx, free.ty));
      this.tree = null;
      this.pickWander();
      return false;
    }
    this.climbIn = (this.climbIn ?? Phaser.Math.FloatBetween(3, PEN_CLIMB_EVERY[1])) - dt;
    if (this.climbIn <= 0 && this.enclosure) {
      this.climbIn = Phaser.Math.FloatBetween(...PEN_CLIMB_EVERY);
      const taken = this.scene.animals.filter((a) => a !== this && a.species === 'redpanda' && a.tree).map((a) => a.tree);
      const t = Phaser.Utils.Array.GetRandom(RedPanda.trees(this.scene, this.enclosure).filter((t) => !taken.some((u) => u.tx === t.tx && u.ty === t.ty)));
      if (t) {
        this.climbInto(t);
        this.phaseTime = Phaser.Math.FloatBetween(...PEN_TREE_TIME);
        return false;
      }
    }
    return super.updateFree(dt, player);
  }

  catch() {
    this.scene.tweens.killTweensOf(this);
    this.setEating(false);
    this.phase = null;
    this.tree = null;
    this.climbY = 0;
    this.peek?.setVisible(false);
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.phase = null;
    this.tree = null;
    this.peek?.setVisible(false);
  }

  enterPen() {
    super.enterPen();
    this.phase = null;
    this.tree = null;
  }

  // beim Speichern: nicht oben im Baum (der Stamm ist fest), sondern daneben
  savedSpot() {
    if (!this.tree) return null;
    const { tx, ty } = worldToTile(this.x, this.y);
    return tileToWorld(tx + 1, ty);
  }

  render(moving) {
    const up = this.phase === 'tree';
    this.sprite.setVisible(!up);
    this.shadow.setVisible(!up);
    super.render(moving && !this.climbY);
    if (this.climbY) this.sprite.setY(this.sprite.y - this.climbY); // am Stamm
  }

  destroy() {
    this.peek?.destroy();
    super.destroy();
  }
}
