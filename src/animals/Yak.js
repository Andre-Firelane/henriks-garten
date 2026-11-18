// Yak (Bambuswald, auf der Hochebene): eine kleine Herde grast um den Steinhaufen herum (an der Leine, siehe
// world/YakHerd.js). Fangen lassen sich die Yaks so nicht. Legt Henrik einen Salzstein auf den Steinhaufen, trottet
// genau ein Yak herbei und leckt daran (lick). Henrik hat dann die Bürste in der Hand: nach dreimal Bürsten folgt es ihm.
// Bürstet er es nicht, trottet es nach einer Weile zurück zur Herde – der Salzstein ist aufgeleckt.
// Im Gehege grast es und steht viel herum.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { worldToTile } from '../world/iso.js';
import { charAt } from '../world/map.js';

export const BRUSHES_NEEDED = 3;
const LICK_TIME = 25; // so lange leckt es am Salzstein
const WALK_SPEED = 26; // so gemächlich trottet es zum Steinhaufen

export default class Yak extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'yak');
    this.lick = null; // { spot, phase: 'walk' | 'lick', time }
    this.brushed = 0;
  }

  canBeCaughtNow() {
    return false; // nur durch Bürsten (siehe brush)
  }

  shouldFlee() {
    return false;
  }

  // nicht in die heiße Quelle (die gehört den Affen)
  blocked(x, y) {
    const { tx, ty } = worldToTile(x, y);
    if (charAt(tx, ty) === 'h') return true;
    return super.blocked(x, y);
  }

  // die Herde hält YakHerd vollzählig; der allgemeine Spawner nimmt sie nicht weg
  canDespawn() {
    return false;
  }

  // zum Steinhaufen trotten und am Salzstein lecken
  comeLick(spot) {
    this.lick = { spot, phase: 'walk', time: LICK_TIME + 30 }; // zum Hinlaufen etwas mehr Zeit
    this.brushed = 0;
    this.leash = null;
  }

  licking() {
    return this.state === 'wild' && this.lick?.phase === 'lick';
  }

  // einmal bürsten; gibt zurück, ob es jetzt mitkommt
  brush() {
    this.brushed++;
    this.lick.time = Math.max(this.lick.time, 6); // beim Bürsten bleibt es noch ein bisschen
    // ein paar Fellflocken fliegen
    for (let i = 0; i < 6; i++) {
      const f = this.scene.add.circle(this.x + Phaser.Math.Between(-14, 14), this.y - Phaser.Math.Between(14, 30), Phaser.Math.FloatBetween(1.5, 2.5), this.skin === 'yak2' ? 0xe8dcc4 : 0x4a3e36, 0.9).setDepth(this.y + 2);
      this.scene.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-10, 10), y: f.y + Phaser.Math.Between(8, 18), alpha: 0, duration: 600, onComplete: () => f.destroy() });
    }
    this.scene.tweens.add({ targets: this.sprite, scaleY: { from: 0.47, to: 0.5 }, duration: 180, ease: 'Quad.easeOut' });
    return this.brushed >= BRUSHES_NEEDED;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild' || !this.lick) return super.updateFree(dt, player);
    const l = this.lick;
    l.time -= dt;
    if (l.time <= 0) {
      this.scene.yakHerd?.lickEnded(this); // aufgeleckt: zurück zur Herde
      return false;
    }
    if (l.phase === 'walk') {
      const dx = l.spot.x - this.x;
      const dy = l.spot.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) {
        l.phase = 'lick';
        l.time = LICK_TIME;
        this.faceX = l.spot.face;
        this.faceY = -1;
        return false;
      }
      const step = Math.min(d, WALK_SPEED * dt);
      const x0 = this.x;
      const y0 = this.y;
      this.move((dx / d) * step, (dy / d) * step);
      // auf dem Weg nicht an Felsen oder am Steinhaufen hängen bleiben: kommt es nicht richtig näher (nur seitlich
      // daran entlang), läuft es einfach hindurch – es ist ja nur ein kurzer Weg
      if (Math.hypot(l.spot.x - this.x, l.spot.y - this.y) > d - step * 0.7) {
        this.x = x0 + (dx / d) * step;
        this.y = y0 + (dy / d) * step;
        if (Math.abs(dx) > d * 0.3) this.faceX = Math.sign(dx);
        if (Math.abs(dy) > d * 0.3) this.faceY = Math.sign(dy);
      }
      return true;
    }
    return false;
  }

  // zurück zur Herde (an die Leine)
  release(leash) {
    this.lick = null;
    this.brushed = 0;
    this.leash = leash;
    this.pickWander();
  }

  catch() {
    this.lick = null;
    this.leash = null;
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.lick = null;
  }

  enterPen() {
    super.enterPen();
    this.lick = null;
    this.leash = null;
  }
}
