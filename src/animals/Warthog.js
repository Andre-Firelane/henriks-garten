// Warzenschwein (Savanne in der Trockenzeit): grast neben seinem Erdloch. Kommt man näher, flitzt es mit hochgestelltem
// Schwanz ins Loch. Nach einer Weile kommt es wieder heraus, aber nur kurz – und nur, wenn man nicht direkt davorsteht.
// Fangen also: mit dem Lasso in etwas Abstand vor dem Loch lauern.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';

const SEE_DIST = 110; // so nah darf man beim ersten Mal kommen, dann flitzt es ins Loch
const TOO_CLOSE = 55; // steht man näher am Loch, bleibt es drin (und flieht sofort, wenn es draußen ist)
const IN_TIME = [8, 15]; // so lange bleibt es im Loch ...
const OUT_TIME = [3.5, 5.5]; // ... und so kurz kommt es danach heraus
const ALERT_TIME = 1; // erschrickt es, bleibt es erst so lange stehen (Sekunden), dann flitzt es ins Loch
const GRAZE_R = 45; // so weit grast es vom Loch weg
const HOLE_ORIGIN_Y = 26 / 40; // Mitte des Lochs im Bild "warthog_hole"
const GRUNT_DIST = 500; // so weit hört man es grunzen, ...
const GRUNT_VOLUME = 0.5; // ... ganz nah so laut

export default class Warthog extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'warthog');
    this.mode = 'out';
    this.shy = false; // nach dem ersten Verstecken kommt es nur noch kurz heraus
  }

  // das eigene Erdloch: dort, wo es draußen zum ersten Mal steht
  makeHole() {
    const { tx, ty } = worldToTile(this.x, this.y);
    this.home = tileToWorld(tx, ty);
    this.hole = this.scene.add.image(this.home.x, this.home.y, 'warthog_hole').setOrigin(0.5, HOLE_ORIGIN_Y).setScale(0.6).setDepth(this.home.y - 4);
    this.leash = { x: this.home.x, y: this.home.y, r: GRAZE_R };
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.mode !== 'in';
  }

  canDespawn() {
    return this.mode === 'in';
  }

  blocked(x, y) {
    if (this.state === 'wild' && this.mode === 'run') return false; // geradewegs ins Loch
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (!this.hole) this.makeHole();
    const h = this.home;
    const fromHole = Math.hypot(player.x - h.x, (player.y - h.y) * 2);
    const fromMe = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
    if (this.mode === 'in') {
      this.modeTime -= dt;
      if (this.modeTime > 0) return false;
      if (fromHole < TOO_CLOSE) {
        this.modeTime = 1; // steht jemand direkt davor: noch drin bleiben
        return false;
      }
      // kurz herausschauen
      this.mode = 'out';
      this.modeTime = Phaser.Math.FloatBetween(...OUT_TIME);
      this.x = h.x + Phaser.Math.Between(-6, 6);
      this.y = h.y + Phaser.Math.Between(2, 5);
      this.pickWander();
      return false;
    }
    if (this.mode === 'out') {
      this.modeTime = (this.modeTime ?? Infinity) - dt;
      const scared = this.shy ? fromMe < TOO_CLOSE : fromMe < SEE_DIST;
      if (scared || (this.shy && this.modeTime <= 0)) {
        this.mode = 'alert';
        this.modeTime = ALERT_TIME;
        this.faceX = Math.sign(player.x - this.x) || this.faceX; // schaut erschrocken her
        this.grunt(fromMe); // grunzt beim Erschrecken
      } else return super.updateFree(dt, { x: Infinity, y: Infinity }); // grast (an der Leine beim Loch)
    }
    if (this.mode === 'alert') {
      this.modeTime -= dt;
      if (this.modeTime > 0) return false; // steht kurz still – Zeit fürs Lasso
      this.mode = 'run';
    }
    // ins Loch flitzen
    const dx = h.x - this.x;
    const dy = h.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) {
      this.mode = 'in';
      this.shy = true;
      this.modeTime = Phaser.Math.FloatBetween(...IN_TIME);
      return false;
    }
    this.fleeing = true;
    const step = Math.min(d, this.kind.fleeSpeed * dt);
    const moved = this.move((dx / d) * step, (dy / d) * step);
    this.fleeing = false;
    return moved;
  }

  // Schweine-Grunzen (wie beim Bauernhof-Event), je näher, desto lauter
  grunt(dist) {
    const scene = this.scene;
    if (dist > GRUNT_DIST || !scene.cache.audio.exists('animal_pig')) return;
    scene.sound.play('animal_pig', { volume: GRUNT_VOLUME * (1 - dist / GRUNT_DIST), detune: Phaser.Math.Between(-250, -50) });
  }

  render(moving) {
    const hidden = this.state === 'wild' && this.mode === 'in';
    this.sprite.setVisible(!hidden);
    this.shadow.setVisible(!hidden);
    super.render(moving);
    // flitzt mit hochgestelltem Schwanz: etwas schneller wippend
    if (this.state === 'wild' && this.mode === 'run') this.sprite.setAngle(Math.sin(this.scene.time.now / 40) * 4);
  }

  catch() {
    this.mode = 'out';
    this.leash = null;
    this.removeHole();
    super.catch();
  }

  removeHole() {
    const hole = this.hole;
    this.hole = null;
    if (hole) this.scene.tweens.add({ targets: hole, alpha: 0, duration: 1500, onComplete: () => hole.destroy() });
  }

  destroy() {
    this.hole?.destroy();
    this.hole = null;
    super.destroy();
  }

  restore(state) {
    super.restore(state);
    this.mode = 'out';
    this.shy = false;
  }
}
