// Japanmakak (Asien): sitzt meist in der heißen Quelle (nur Kopf und Schultern schauen heraus). Selten springt er heraus
// und rennt wie wild durch die Gegend – nur dann kann man ihn mit dem Lasso fangen. Nach kurzer Zeit springt er zurück
// ins warme Wasser. Wer ihn aus der Quelle fischen will (Werkzeug in der Nähe), vor dem taucht er kurz ab.
// Im Gehege: badet, läuft ab und zu herum und klettert auf den kleinen Kletterbaum.
import Phaser from 'phaser';
import Animal, { SPRITE_SINK } from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { HOT_SPRINGS, HOT_SPRING_TILES, charAt, objectAt } from '../world/map.js';

const BATH_TIME = [18, 35]; // so lange sitzt er in der Quelle (frei), bis er wieder herausrennt
const RUN_TIME = [10, 16]; // so lange rennt er draußen herum
const RUN_SPEED = 92; // schneller als der Spieler (80)
const RUN_TURN = [0.4, 0.9]; // so oft schlägt er einen Haken
const RUN_RANGE = 7; // weiter als so viele Kacheln von der Quelle entfernt dreht er um
const JUMP_TIME = 0.6; // Sprung in die Quelle bzw. heraus
const JUMP_HEIGHT = 22;
const DIVE_DIST = 95; // so nah mit einem Werkzeug im Einsatz (oder 35 ohne): er taucht ab
const DIVE_TIME = 3;
const PEN_BATH = [15, 30];
const PEN_OUT = [8, 16];
const CLIMB_TIME = [5, 9];
const CLIMB_LIFT = 26; // so hoch sitzt er oben auf dem Kletterbaum
const BATH_ORIGIN_Y = 66 / 72; // Wasserlinie im Bild „macaque_bath“

export default class Macaque extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'macaque');
    this.phase = 'bath'; // bath | jump | run | climb | walk (im Gehege)
    this.timer = Phaser.Math.FloatBetween(5, BATH_TIME[1]);
    this.dive = 0;
    this.lift = 0;
  }

  // Wasser-Kacheln der passenden Quelle: im Gehege die eigene, frei seine Heimatquelle (es gibt mehrere)
  springTiles() {
    if (this.state === 'penned') return HOT_SPRING_TILES.filter((t) => this.enclosure?.tileSet.has(t.tx + ',' + t.ty));
    const wild = HOT_SPRINGS.filter((g) => !this.scene.isPenTile(g[0].tx, g[0].ty));
    if (!wild.length) return [];
    if (this.home == null || !wild[this.home]) {
      // Heimatquelle: die, in der gerade die wenigsten Affen baden
      const count = (i) => this.scene.animals.filter((a) => a !== this && a.species === 'macaque' && a.state === 'wild' && a.home === i).length;
      this.home = wild.map((g, i) => i).sort((u, v) => count(u) - count(v))[0];
    }
    return wild[this.home];
  }

  // ein freier Badeplatz (nicht dort, wo schon ein anderer Affe sitzt)
  bathSpot() {
    const others = this.scene.animals.filter((a) => a !== this && a.species === 'macaque' && a.phase === 'bath').map((a) => worldToTile(a.x, a.y));
    const tiles = this.springTiles();
    const free = tiles.filter((t) => !others.some((o) => o.tx === t.tx && o.ty === t.ty));
    const t = Phaser.Utils.Array.GetRandom(free.length ? free : tiles);
    if (!t) return null;
    const p = tileToWorld(t.tx, t.ty);
    return { x: p.x + Phaser.Math.Between(-8, 8), y: p.y + Phaser.Math.Between(-3, 3) };
  }

  // gleich in der Quelle (beim Erscheinen)
  placeInSpring() {
    const p = this.bathSpot();
    if (p) {
      this.x = p.x;
      this.y = p.y;
    }
    this.phase = 'bath';
  }

  inSpring() {
    const { tx, ty } = worldToTile(this.x, this.y);
    return charAt(tx, ty) === 'h';
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'run';
  }

  canFeed() {
    return super.canFeed() && this.phase === 'walk';
  }

  // Sprung von hier nach "to" (in die Quelle oder heraus)
  jumpTo(to, then) {
    this.phase = 'jump';
    this.jump = { from: { x: this.x, y: this.y }, to, t: 0, then };
    this.faceX = Math.sign(to.x - this.x) || this.faceX;
    this.faceY = Math.sign(to.y - this.y) || this.faceY;
  }

  // ein Platz an Land direkt neben der Quelle
  shoreSpot() {
    const tiles = this.springTiles();
    const spots = [];
    for (const t of tiles) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const p = tileToWorld(t.tx + dx, t.ty + dy);
        if (charAt(t.tx + dx, t.ty + dy) !== 'h' && !this.blocked(p.x, p.y)) spots.push(p);
      }
    }
    spots.sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y));
    return spots[Math.min(spots.length - 1, Phaser.Math.Between(0, 4))] ?? null;
  }

  // Land darf er beim Rennen nicht durchs Wasser abkürzen (nur springen); folgt er dem Spieler, läuft er überall mit
  // (auch durchs heiße Wasser), sonst bleibt er am Ufer hängen
  blocked(x, y) {
    if (this.state === 'following') return false;
    if (this.phase !== 'jump' && this.phase !== 'bath') {
      const { tx, ty } = worldToTile(x, y);
      if (charAt(tx, ty) === 'h') return true;
    }
    return super.blocked(x, y);
  }

  update(dt, player) {
    if (this.state === 'wild' || this.state === 'penned') this.updateMacaque(dt, player);
    else {
      this.phase = 'walk';
      this.lift = 0;
    }
    super.update(dt, player);
  }

  updateMacaque(dt, player) {
    this.timer -= dt;
    if (this.phase === 'jump') {
      const j = this.jump;
      j.t = Math.min(1, j.t + dt / JUMP_TIME);
      this.x = j.from.x + (j.to.x - j.from.x) * j.t;
      this.y = j.from.y + (j.to.y - j.from.y) * j.t;
      this.lift = Math.sin(j.t * Math.PI) * JUMP_HEIGHT;
      if (j.t >= 1) {
        this.lift = 0;
        j.then();
      }
      return;
    }
    if (this.phase === 'bath') {
      // aus der Quelle fischen? Er taucht ab
      this.dive = Math.max(0, this.dive - dt);
      const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
      const toolOut = this.scene.tool?.active;
      if (this.state === 'wild' && !this.dive && (d < 35 || (toolOut && d < DIVE_DIST))) {
        this.dive = DIVE_TIME;
        this.scene.macaqueDives(this);
      }
      if (this.timer <= 0 && !this.dive) {
        const to = this.shoreSpot();
        if (to) this.jumpTo(to, () => this.leaveSpring());
        else this.timer = 5;
      }
      return;
    }
    if (this.phase === 'climb') {
      if (this.timer <= 0) {
        this.lift = 0;
        this.phase = 'walk';
        this.timer = Phaser.Math.FloatBetween(...PEN_OUT) / 2;
        this.pickWander();
      }
      return;
    }
    if (this.timer <= 0) {
      // zurück in die Quelle
      const to = this.bathSpot();
      if (to) this.jumpTo(to, () => this.enterSpring());
      else this.timer = 3;
    }
  }

  leaveSpring() {
    if (this.state === 'penned') {
      this.phase = 'walk';
      this.timer = Phaser.Math.FloatBetween(...PEN_OUT);
    } else {
      this.phase = 'run';
      this.timer = Phaser.Math.FloatBetween(...RUN_TIME);
      this.runTurn = 0;
    }
    this.pickWander();
  }

  enterSpring() {
    this.phase = 'bath';
    this.timer = Phaser.Math.FloatBetween(...(this.state === 'penned' ? PEN_BATH : BATH_TIME));
    this.dirX = 0;
    this.dirY = 0;
  }

  // nah an der Quelle bleiben: zu weit weg, dann zurück in ihre Richtung
  springCenter() {
    const tiles = this.springTiles();
    if (!tiles.length) return null;
    const c = tiles.reduce((s, t) => ({ tx: s.tx + t.tx / tiles.length, ty: s.ty + t.ty / tiles.length }), { tx: 0, ty: 0 });
    return tileToWorld(c.tx, c.ty);
  }

  updateFree(dt, player) {
    if (this.phase === 'bath' || this.phase === 'jump' || this.phase === 'climb') return false;
    if (this.phase === 'run' && this.state === 'wild') {
      // wie wild: schnell, mit vielen Haken, immer in der Nähe der Quelle
      this.runTurn -= dt;
      if (this.runTurn <= 0) {
        this.runTurn = Phaser.Math.FloatBetween(...RUN_TURN);
        const c = this.springCenter();
        let angle = Math.random() * Math.PI * 2;
        if (c && Math.hypot(c.x - this.x, (c.y - this.y) * 2) > RUN_RANGE * 32) angle = Math.atan2(c.y - this.y, c.x - this.x) + Phaser.Math.FloatBetween(-0.6, 0.6);
        this.dirX = Math.cos(angle);
        this.dirY = Math.sin(angle);
      }
      const step = RUN_SPEED * dt;
      const moved = this.move(this.dirX * step, this.dirY * step);
      if (!moved) this.runTurn = 0;
      return moved;
    }
    // im Gehege: ab und zu auf den Kletterbaum
    if (this.state === 'penned' && Math.random() < dt * 0.06) {
      const tree = this.nearTree();
      if (tree) {
        this.jumpTo(tree, () => {
          this.phase = 'climb';
          this.lift = CLIMB_LIFT;
          this.timer = Phaser.Math.FloatBetween(...CLIMB_TIME);
        });
        return false;
      }
    }
    return super.updateFree(dt, player);
  }

  // Kletterbaum im eigenen Gehege (Platz direkt davor, wo er hinaufspringt)
  nearTree() {
    for (const { tx, ty } of this.enclosure?.tiles ?? []) {
      if (objectAt(tx, ty)?.key === 'climb_tree') {
        const p = tileToWorld(tx, ty);
        return { x: p.x, y: p.y + 2 };
      }
    }
    return null;
  }

  // eingezogen: gleich ab in die Quelle des Geheges
  enterPen() {
    super.enterPen();
    this.placeInSpring();
    this.timer = Phaser.Math.FloatBetween(...PEN_BATH);
  }

  catch() {
    this.phase = 'walk';
    this.lift = 0;
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.lift = 0;
    if (state === 'wild' || state === 'penned') {
      this.placeInSpring();
      this.timer = Phaser.Math.FloatBetween(3, state === 'penned' ? PEN_BATH[1] : BATH_TIME[1]);
    } else this.phase = 'walk';
  }

  render(moving) {
    const bathing = (this.phase === 'bath') && (this.state === 'wild' || this.state === 'penned');
    if (!bathing) {
      if (this.sprite.texture.key !== this.kind.texture) this.sprite.setTexture(this.kind.texture, 0).setOrigin(0.5, this.kind.originY);
      super.render(moving && this.phase !== 'climb');
      this.sprite.setVisible(true);
      if (this.lift) this.sprite.setPosition(this.sprite.x, this.sprite.y - this.lift);
      if (this.phase === 'climb') this.sprite.setDepth(this.y + 4); // oben auf dem Baum vor dessen Krone
      this.shadow.setVisible(this.phase !== 'climb');
      return;
    }
    // in der Quelle: nur Kopf und Schultern, abgetaucht gar nicht zu sehen
    if (this.sprite.texture.key !== 'macaque_bath') this.sprite.setTexture('macaque_bath', 0).setOrigin(0.5, BATH_ORIGIN_Y);
    const f = this.kind.frames;
    this.sprite.setFrame(this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft);
    const bob = Math.sin(this.scene.time.now / 700 + this.x) * 0.8;
    this.sprite.setPosition(this.x, this.y + bob).setAngle(0).setDepth(this.y).setVisible(this.dive <= 0);
    this.shadow.setVisible(false);
  }
}
