// Schlange und Vogelspinne (Dschungel): verstecken sich im Dickicht. Schlägt Henrik ein Dickicht weg, schreckt manchmal
// eines davon auf (siehe GardenScene.thicketCut) und flieht zum nächsten Dickicht, um im Unterholz zu verschwinden.
// Solange es flieht, fängt man es mit dem Kescher; erreicht es das Dickicht, ist es weg.
// Im Reptilienhaus krabbeln bzw. schlängeln sie im Terrarium herum.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';

const HIDE_RANGE = 6; // so viele Kacheln weit sucht es ein Dickicht zum Verstecken
const FLEE_TIME = 4; // ohne Dickicht in der Nähe: so lange flieht es, dann ist es im Laub verschwunden
const FREEZE_TIME = 1; // so lange bleibt es nach dem Aufschrecken erst wie erstarrt stehen

export default class Critter extends Animal {
  // ein aufgeschrecktes Tier an Kachel tx/ty: flieht zum nächsten dichten Dickicht (nicht dem gerade geschlagenen)
  startle(tx, ty) {
    const thicket = this.scene.thicket;
    const spots = thicket ? [...thicket.images.keys()].map((k) => k.split(',').map(Number)).filter(([x, y]) => (x !== tx || y !== ty) && thicket.stage(x + ',' + y) === 2 && Math.hypot(x - tx, y - ty) <= HIDE_RANGE) : [];
    spots.sort((p, q) => Math.hypot(p[0] - tx, p[1] - ty) - Math.hypot(q[0] - tx, q[1] - ty));
    // vom Spieler weg, wenn möglich (das nächste Versteck, das nicht hinter ihm liegt)
    const p = this.scene.player;
    const away = spots.find(([x, y]) => {
      const t = tileToWorld(x, y);
      return (t.x - this.x) * (this.x - p.x) + (t.y - this.y) * (this.y - p.y) * 4 >= 0;
    }) ?? spots[0];
    this.hideAt = away ? tileToWorld(away[0], away[1]) : null;
    this.phase = 'flee';
    this.freeze = FREEZE_TIME;
    this.fleeTime = FLEE_TIME;
    this.fleeing = true;
    if (!this.hideAt) {
      const a = Math.atan2(this.y - p.y, this.x - p.x);
      this.dirX = Math.cos(a);
      this.dirY = Math.sin(a) * 0.5;
    }
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'flee';
  }

  canDespawn() {
    return this.phase !== 'flee';
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild') return false; // es huscht durchs Unterholz
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.phase !== 'flee') return false;
    if (this.freeze > 0) {
      this.freeze -= dt; // erst erstarrt (dann schon fangbar), dann huscht es los
      return false;
    }
    const speed = this.kind.fleeSpeed * dt;
    let dx, dy;
    if (this.hideAt) {
      dx = this.hideAt.x - this.x;
      dy = this.hideAt.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 4) return this.hide(), false;
      dx /= d;
      dy /= d;
    } else {
      this.fleeTime -= dt;
      if (this.fleeTime <= 0) return this.hide(), false;
      dx = this.dirX;
      dy = this.dirY;
    }
    this.faceX = Math.sign(dx) || this.faceX;
    this.faceY = Math.sign(dy) || this.faceY;
    this.x += dx * speed;
    this.y += dy * speed;
    return true;
  }

  // im Unterholz verschwunden
  hide() {
    this.phase = 'hidden';
    this.fleeing = false;
    this.scene.critterHidden?.(this);
  }

  render(moving) {
    super.render(moving);
    // flach am Boden: kein Hüpfen, nur ein leichtes Schlängeln bzw. Trippeln
    this.sprite.setAngle(moving ? Math.sin(this.walkTime * (this.species === 'snake' ? 9 : 22)) * (this.species === 'snake' ? 4 : 2) : 0);
  }

  catch() {
    this.phase = null;
    this.fleeing = false;
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.phase = null;
  }
}

// zufällig eine der beiden Arten
export function randomCritter() {
  return Phaser.Utils.Array.GetRandom(['snake', 'tarantula']);
}
