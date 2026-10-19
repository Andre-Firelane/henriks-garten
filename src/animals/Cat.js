// Katze: draußen wie jedes andere Tier. Im Katzenhaus springt sie ab und zu auf einen freien Kratzbaum,
// rollt sich auf dem Kissen oben zusammen und schläft (Zzz); danach springt sie wieder herunter.
import Phaser from 'phaser';
import Animal, { SPRITE_SINK } from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { objectAt } from '../world/map.js';

const ROAM_TIME = [8, 16]; // so lange läuft sie im Katzenhaus herum, bevor sie auf einen Kratzbaum will
const SLEEP_TIME = [12, 22]; // so lange schläft sie oben
const WALK_TIMEOUT = 10; // kommt sie nicht an den Kratzbaum, versucht sie es später wieder
const CUSHION = 47; // Höhe des Kissens oben auf dem Kratzbaum über dem Boden (Bild "cat_tree")
// Plätze rund um den Stamm, von denen sie hinauf- und wieder hinunterspringt (der erste freie wird genommen)
const JUMP_SPOTS = [[0, 14], [-20, 10], [20, 10], [-20, -10], [20, -10]];
const JUMP_MS = 280;
const ZZZ_EVERY = 1.2;
const SLEEP_ORIGIN_Y = 56 / 60; // Bild "cat_sleep"

export default class Cat extends Animal {
  constructor(scene, x, y, allAnimals) {
    super(scene, x, y, 'cat');
    this.allAnimals = allAnimals;
    this.lift = 0; // Höhe über dem Boden (beim Sprung und oben auf dem Kratzbaum)
  }

  // Kratzbäume im eigenen Gehege, auf denen gerade keine andere Katze ist
  freeTrees() {
    const a = this.enclosure?.area;
    if (!a) return [];
    const taken = this.allAnimals.filter((c) => c !== this && c.tree).map((c) => c.tree.key);
    const trees = [];
    for (const { tx, ty } of this.enclosure.tiles) {
      { // nur Kacheln, die wirklich zum Gehege gehören (auch bei L-Formen)
        if (objectAt(tx, ty)?.key !== 'cat_tree' || taken.includes(`${tx},${ty}`)) continue;
        trees.push({ key: `${tx},${ty}`, ...tileToWorld(tx, ty) });
      }
    }
    return trees;
  }

  updateFree(dt, player) {
    if (this.state !== 'penned') return super.updateFree(dt, player);
    this.penTime = (this.penTime ?? Phaser.Math.FloatBetween(2, ROAM_TIME[1])) - dt;
    if (this.jumping) return false;

    if (this.sleeping) {
      this.zzzTime -= dt;
      if (this.zzzTime <= 0) {
        this.spawnZ();
        this.zzzTime = ZZZ_EVERY;
      }
      if (this.penTime <= 0) this.jumpDown();
      return false;
    }

    if (!this.tree) {
      if (this.penTime > 0) return super.updateFree(dt, player);
      const trees = this.freeTrees();
      if (!trees.length) {
        this.penTime = Phaser.Math.FloatBetween(...ROAM_TIME);
        return super.updateFree(dt, player);
      }
      trees.sort((p, q) => Math.hypot(p.x - this.x, p.y - this.y) - Math.hypot(q.x - this.x, q.y - this.y));
      for (const t of trees) {
        const spot = JUMP_SPOTS.find(([dx, dy]) => !this.blocked(t.x + dx, t.y + dy));
        if (spot) {
          this.tree = { ...t, front: { x: t.x + spot[0], y: t.y + spot[1] } };
          break;
        }
      }
      this.penTime = this.tree ? WALK_TIMEOUT : Phaser.Math.FloatBetween(...ROAM_TIME);
      if (!this.tree) return super.updateFree(dt, player);
    }

    // zum Platz vor dem Kratzbaum laufen
    const t = this.tree;
    const dx = t.front.x - this.x;
    const dy = t.front.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) {
      this.jumpUp();
      return false;
    }
    if (this.penTime <= 0) {
      this.tree = null;
      this.penTime = Phaser.Math.FloatBetween(...ROAM_TIME);
      return false;
    }
    const step = Math.min(d, this.kind.speed * dt);
    return this.move((dx / d) * step, (dy / d) * step);
  }

  jumpUp() {
    const t = this.tree;
    this.jumping = true;
    this.faceY = 1;
    this.scene.tweens.add({
      targets: this,
      x: t.x,
      y: t.y + 1, // knapp vor dem Kratzbaum, damit sie über ihm gezeichnet wird
      lift: CUSHION,
      duration: JUMP_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.jumping = false;
        this.sleeping = true;
        this.zzzTime = ZZZ_EVERY;
        this.penTime = Phaser.Math.FloatBetween(...SLEEP_TIME);
      },
    });
  }

  jumpDown() {
    const t = this.tree;
    this.sleeping = false;
    this.jumping = true;
    this.scene.tweens.add({
      targets: this,
      x: t.front.x,
      y: t.front.y,
      lift: 0,
      duration: JUMP_MS,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.jumping = false;
        this.tree = null;
        this.penTime = Phaser.Math.FloatBetween(...ROAM_TIME);
        this.pickWander();
      },
    });
  }

  spawnZ() {
    const x = this.x + this.faceX * 8;
    const y = this.y - this.lift - 18;
    const z = this.scene.add
      .text(x, y, 'z', { fontFamily: 'Trebuchet MS, Arial', fontSize: '10px', fontStyle: 'bold', color: '#ffffff', stroke: '#2b1d14', strokeThickness: 3, resolution: 4 })
      .setOrigin(0.5)
      .setDepth(100000);
    this.scene.tweens.add({
      targets: z,
      x: x + this.faceX * 6,
      y: y - 14,
      scale: 1.4,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.easeOut',
      onComplete: () => z.destroy(),
    });
  }

  // auf dem Kratzbaum (oder im Sprung) kommt sie nicht zum Futter
  canFeed() {
    return super.canFeed() && !this.sleeping && !this.jumping && !this.tree;
  }

  // aufräumen, falls sie mitten im Schlaf oder Sprung aus dem Gehege geholt wird
  resetPen() {
    this.scene.tweens.killTweensOf(this);
    this.tree = null;
    this.sleeping = false;
    this.jumping = false;
    this.lift = 0;
    this.penTime = undefined;
  }

  catch() {
    this.resetPen();
    super.catch();
  }

  restore(state) {
    this.resetPen();
    super.restore(state);
  }

  render(moving) {
    if (!this.sleeping) {
      if (this.sprite.texture.key !== this.lookTexture()) this.sprite.setTexture(this.lookTexture(), 0).setOrigin(0.5, this.kind.originY);
      super.render(moving);
      // beim Sprung angehoben, der Schatten bleibt am Boden
      if (this.lift) this.sprite.setPosition(this.sprite.x, this.sprite.y - this.lift);
      this.shadow.setVisible(!this.lift);
      return;
    }
    // eingerollt oben auf dem Kissen
    const sleep = `${this.baseTexture()}_sleep`; // cat_sleep bzw. cat2_sleep
    if (this.sprite.texture.key !== sleep) this.sprite.setTexture(sleep, 0).setOrigin(0.5, SLEEP_ORIGIN_Y);
    const f = this.kind.frames;
    this.sprite.setFrame(this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft);
    this.sprite.setPosition(this.x, this.y - this.lift + SPRITE_SINK);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
    this.shadow.setVisible(false);
  }
}
