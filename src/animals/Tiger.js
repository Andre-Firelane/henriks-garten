// Tiger (Asien): streift als dunkler Schemen durch den Bambus – so kann man ihn nicht fangen. Steht man mit dem Ball
// still davor (oder rollt ihn mit der Aktionstaste hin, siehe rollBall in GardenScene), wird er neugierig: sein Gesicht
// schaut aus dem Bambus. Ein paar Sekunden später kommt er heraus und spielt eine Weile neben dem Ball – dann kann man
// ihn mit dem Lasso fangen. Danach verschwindet er wieder im Bambus.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { TIGER_ZONE } from '../world/map.js';

const PROWL_SPEED = 16; // gemächliches Streifen durch den Bambus
const PROWL_RANGE = 3; // so viele Kacheln weit sucht er sich sein nächstes Ziel
const PROWL_ALPHA = 0.4; // so deutlich sieht man den Schemen
const CURIOUS_TIME = 3; // so lange schaut er neugierig aus dem Bambus
const PLAY_TIME = 40; // so lange spielt er draußen am Ball (Zeit genug, das Lasso zu holen)
const PEEK_UP = 6; // das Gesicht sitzt etwas über dem Boden

export default class Tiger extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'tiger');
    this.phase = 'prowl';
    this.target = null;
  }

  // wilde Tiger beginnen irgendwo im Bambus (siehe spawnOne)
  placeInZone() {
    if (!TIGER_ZONE.length) return;
    const t = Phaser.Utils.Array.GetRandom(TIGER_ZONE);
    Object.assign(this, tileToWorld(t.tx, t.ty));
  }

  isProwling() {
    return this.state === 'wild' && this.phase === 'prowl';
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'play';
  }

  canDespawn() {
    return this.isProwling();
  }

  shouldFlee() {
    return false; // er ist neugierig, nicht scheu
  }

  // als Schemen geht er mitten durch den Bambus
  blocked(x, y) {
    return this.isProwling() ? false : super.blocked(x, y);
  }

  // vom Ball angelockt: erst neugierig schauen, dann herauskommen
  lure(ball) {
    this.phase = 'curious';
    this.phaseTime = CURIOUS_TIME;
    this.ball = ball;
    this.faceX = Math.sign(ball.x - this.x) || 1;
    this.faceY = 1;
    this.peek = this.scene.add.image(this.x, this.y - PEEK_UP, `${this.baseTexture()}_peek`).setOrigin(0.5, 60 / 64).setScale(0.5).setAlpha(0);
    this.peek.setFlipX(this.faceX < 0).setDepth(this.y + 40); // vor dem Bambus, damit man das Gesicht sieht
    this.question = this.scene.add
      .text(this.x + 10, this.y - PEEK_UP - 34, '?', { fontFamily: 'Trebuchet MS, Arial', fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#2b1d14', strokeThickness: 3, resolution: 4 })
      .setOrigin(0.5)
      .setDepth(100000);
    this.scene.tweens.add({ targets: this.peek, alpha: 1, duration: 400 });
    this.scene.tweens.add({ targets: this.question, y: this.question.y - 4, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  clearPeek() {
    for (const o of [this.peek, this.question]) {
      if (!o) continue;
      this.scene.tweens.killTweensOf(o);
      o.destroy();
    }
    this.peek = null;
    this.question = null;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.phase === 'prowl') return this.prowl(dt);
    this.phaseTime -= dt;
    if (this.phase === 'curious') {
      if (this.phaseTime <= 0) this.comeOut();
      return false;
    }
    // draußen am Ball: schaut zum Ball und bleibt sitzen
    if (this.ball) {
      this.faceX = Math.sign(this.ball.x - this.x) || this.faceX;
      this.faceY = Math.sign(this.ball.y - this.y) || this.faceY;
    }
    if (this.phaseTime <= 0) this.goBack();
    return false;
  }

  // von Bambuskachel zu Bambuskachel streifen
  prowl(dt) {
    if (!this.target || Math.hypot(this.target.x - this.x, this.target.y - this.y) < 3) {
      const near = TIGER_ZONE.filter((t) => {
        const p = tileToWorld(t.tx, t.ty);
        return Math.hypot(p.x - this.x, (p.y - this.y) * 2) < PROWL_RANGE * 64;
      });
      const t = Phaser.Utils.Array.GetRandom(near.length ? near : TIGER_ZONE);
      if (!t) return false;
      this.target = tileToWorld(t.tx, t.ty);
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = Math.min(d, PROWL_SPEED * dt);
    return this.move((dx / d) * step, (dy / d) * step);
  }

  // aus dem Bambus heraus, neben den Ball
  comeOut() {
    this.clearPeek();
    // auf der anderen Seite des Balls als der Spieler (nicht auf ihm drauf)
    const p = this.scene.player;
    const a = Math.atan2(this.ball.y - p.y, this.ball.x - p.x);
    const ahead = { x: this.ball.x + Math.cos(a) * 26, y: this.ball.y + Math.sin(a) * 13 };
    const spot = !super.blocked(ahead.x, ahead.y) ? ahead : this.scene.freeSpotNear(ahead.x, ahead.y, 20) ?? ahead;
    this.x = spot.x;
    this.y = spot.y;
    this.phase = 'play';
    this.phaseTime = PLAY_TIME;
    this.scene.tigerOut(this);
  }

  // zurück in den Bambus (der Ball bleibt nicht liegen)
  goBack() {
    const home = [...TIGER_ZONE]
      .map((t) => tileToWorld(t.tx, t.ty))
      .sort((p, q) => Math.hypot(p.x - this.x, p.y - this.y) - Math.hypot(q.x - this.x, q.y - this.y))[0];
    if (home) Object.assign(this, home);
    this.phase = 'prowl';
    this.target = null;
    this.scene.tigerBack(this);
    this.ball = null;
  }

  render(moving) {
    super.render(moving);
    const prowl = this.isProwling();
    const curious = this.state === 'wild' && this.phase === 'curious';
    // im Bambus nur ein dunkler Schemen, beim neugierigen Schauen nur das Gesicht
    if (prowl) this.sprite.setTintFill(0x1a140e);
    else this.sprite.clearTint();
    this.sprite.setAlpha(prowl ? PROWL_ALPHA : 1).setVisible(!curious);
    this.shadow.setVisible(!prowl && !curious);
  }

  catch() {
    this.clearPeek();
    this.phase = null;
    super.catch();
  }

  restore(state) {
    this.clearPeek();
    super.restore(state);
    this.phase = state === 'wild' ? 'prowl' : null;
  }

  destroy() {
    this.clearPeek();
    super.destroy();
  }
}
