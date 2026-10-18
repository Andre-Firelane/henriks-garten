// Giraffe (Savanne): läuft gemächlich herum und geht ab und zu zu einer Akazie in der Nähe, um mit gestrecktem Hals
// davon zu fressen – draußen wie im Gehege. Das Fressen ist nur zum Anschauen: gefangen (gefüttert) wird sie genauso wie sonst.
import Phaser from 'phaser';
import Animal, { SPRITE_SINK } from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { objectAt } from '../world/map.js';

const EAT_CHANCE = 0.35; // so oft geht sie statt einer Pause zu einem Baum
const EAT_CHANCE_PEN = 0.6; // im Gehege öfter: dort hat sie ja ihre eigenen Akazien
const TREE_RANGE = 4; // so viele Kacheln weit sucht sie nach einer Akazie
const EAT_TIME = [5, 9]; // so lange frisst sie
const WALK_TIMEOUT = 12; // kommt sie nicht an den Baum, lässt sie es bleiben
// Beim Fressen steht sie schräg vor dem Baum und schaut zu ihm hin. Ihr Maul ist im Bild "giraffe_eat" etwa
// 18 Pixel seitlich und 82 Pixel über den Füßen; die Akazienkrone beginnt etwa 51 Pixel über dem Stammfuß.
// So landet das Maul vorne unten an der Krone:
const STAND_X = 32; // so weit seitlich ...
const STAND_FRONT = 18; // ... und so weit vor dem Stamm steht sie beim Fressen
// Fress-Bilder wie beim Laufen: unten-rechts, unten-links, oben-rechts, oben-links
const EAT_ORIGIN_Y = 176 / 180;

export default class Giraffe extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'giraffe');
    this.eating = null; // { tree, spot, phase: 'walk' | 'eat', time }
  }

  pickWander() {
    this.eating = null;
    const chance = this.state === 'penned' ? EAT_CHANCE_PEN : EAT_CHANCE;
    if (this.state !== 'following' && Math.random() < chance) {
      const tree = this.nearestAcacia();
      if (tree) {
        // Platz schräg vor dem Stamm, auf der Seite, von der sie kommt
        const side = Math.sign(this.x - tree.x) || 1;
        const spot = { x: tree.x + side * STAND_X, y: tree.y + STAND_FRONT };
        this.eating = { tree, spot, phase: 'walk', time: WALK_TIMEOUT };
        this.dirX = 0;
        this.dirY = 0;
        this.wanderTime = WALK_TIMEOUT + EAT_TIME[1];
        return;
      }
    }
    super.pickWander();
  }

  // die nächste Akazie im Umkreis (Mitte der Kachel), oder null
  nearestAcacia() {
    const { tx, ty } = worldToTile(this.x, this.y);
    let best = null;
    for (let dy = -TREE_RANGE; dy <= TREE_RANGE; dy++) {
      for (let dx = -TREE_RANGE; dx <= TREE_RANGE; dx++) {
        if (objectAt(tx + dx, ty + dy)?.key !== 'acacia') continue;
        const p = tileToWorld(tx + dx, ty + dy);
        const d = Math.hypot(p.x - this.x, (p.y - this.y) * 2);
        if (!best || d < best.d) best = { x: p.x, y: p.y, d };
      }
    }
    return best;
  }

  updateFree(dt, player) {
    const eat = this.eating;
    if (!eat || this.state === 'following') return super.updateFree(dt, player);
    eat.time -= dt;
    if (eat.phase === 'walk') {
      const dx = eat.spot.x - this.x;
      const dy = eat.spot.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) {
        eat.phase = 'eat';
        eat.time = Phaser.Math.FloatBetween(...EAT_TIME);
        this.faceX = Math.sign(eat.tree.x - this.x) || this.faceX;
        this.faceY = eat.tree.y < this.y ? -1 : 1;
        return false;
      }
      if (eat.time <= 0) {
        super.pickWander();
        this.eating = null;
        return false;
      }
      const step = Math.min(d, this.kind.speed * dt);
      const angle = Math.atan2(dy, dx);
      for (const turn of [0, 0.5, -0.5, 1, -1]) {
        if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) return true;
      }
      // kommt nicht an den Platz vor dem Baum (verstellt): dann lässt sie es, sonst wäre das Maul nicht an der Krone
      this.eating = null;
      super.pickWander();
      return false;
    }
    if (eat.time <= 0) {
      this.eating = null;
      super.pickWander();
    }
    return false;
  }

  startFeed() {
    this.eating = null;
  }

  catch() {
    this.eating = null;
    super.catch();
  }

  restore(state) {
    this.eating = null;
    super.restore(state);
  }

  render(moving) {
    if (this.eating?.phase !== 'eat' || this.state === 'following') {
      if (this.sprite.texture.key !== this.kind.texture) this.sprite.setTexture(this.kind.texture, 0).setOrigin(0.5, this.kind.originY);
      super.render(moving);
      return;
    }
    if (this.sprite.texture.key !== 'giraffe_eat') this.sprite.setTexture('giraffe_eat', 0).setOrigin(0.5, EAT_ORIGIN_Y);
    this.sprite.setFrame(this.faceY > 0 ? (this.faceX < 0 ? 1 : 0) : this.faceX > 0 ? 2 : 3);
    this.sprite.setPosition(this.x, this.y + SPRITE_SINK);
    this.sprite.setAngle(0);
    this.shadow.setPosition(this.x, this.y);
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 0.5);
  }
}
