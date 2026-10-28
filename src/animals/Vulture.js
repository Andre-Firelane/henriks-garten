// Geier (Savanne in der Trockenzeit): fliegt heran, kreist eine Weile über einer kahlen Akazie (man sieht seinen Schatten
// über den Boden ziehen) und landet dann oben in der Krone. Solange er dort sitzt, fängt man ihn mit dem Kescher
// (vom Stamm aus). Nach einer Weile fliegt er weiter. In der Voliere verhält er sich wie der Reiher (siehe Heron.js).
import Phaser from 'phaser';
import Heron from './Heron.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { charAt, isBlocked } from '../world/map.js';

const FLY_SPEED = 110; // wie der Reiher
const ALTITUDE = 70;
const CIRCLE_R = 90; // Radius des Kreisens um den Baum
const CIRCLE_TIME = [6, 10]; // so lange kreist er, bevor er landet
const CIRCLE_SPEED = 0.9; // Umdrehungen ... im Bogenmaß pro Sekunde
// Sitzplatz auf dem linken Ast der kahlen Akazie, vom Fuß des Baums aus (der Landeplatz liegt 3 Pixel vor dem Stamm)
const PERCH_H = 62; // so hoch ...
const PERCH_X = -24; // ... und so weit links
const PEN_PERCH_EVERY = [6, 14]; // in der Voliere: so oft fliegt er auf einen der kahlen Bäume ...
const PEN_PERCH_TIME = [10, 20]; // ... und so lange sitzt er dort

export default class Vulture extends Heron {
  constructor(scene, x, y) {
    super(scene, x, y, 'vulture');
  }

  // vom Kartenrand heran, dann über dem Baum kreisen und auf seinem linken Ast landen; tree: Landeplatz vor dem Stamm
  startCircle(from, tree) {
    const perch = { x: tree.x + PERCH_X, y: tree.y };
    this.startFlight(from, perch, true);
    this.perch = perch;
    this.phase = 'approach';
    this.circleTime = Phaser.Math.FloatBetween(...CIRCLE_TIME);
    this.angle = Math.random() * Math.PI * 2;
  }

  // in der Voliere: ab und zu auf eine der kahlen Akazien fliegen und dort eine Weile sitzen
  updatePerch(dt, player) {
    if (this.perched) {
      this.perchTime -= dt;
      if (this.perchTime > 0) return false;
      // hinunter auf einen freien Platz neben dem Baum
      this.perched = false;
      const { tx, ty } = worldToTile(this.x, this.y);
      const free = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => ({ tx: tx + dx, ty: ty + dy })).find((t) => !isBlocked(t.tx, t.ty) && this.enclosure?.tileSet.has(t.tx + ',' + t.ty));
      if (free) Object.assign(this, tileToWorld(free.tx, free.ty));
      this.pickWander();
      return false;
    }
    if (this.toPerch && !this.penFlight) {
      this.toPerch = false;
      this.perched = true;
      this.perchTime = Phaser.Math.FloatBetween(...PEN_PERCH_TIME);
      return false;
    }
    if (!this.penFlight && !this.baby) {
      this.perchIn = (this.perchIn ?? Phaser.Math.FloatBetween(2, PEN_PERCH_EVERY[1])) - dt;
      const trees = (this.enclosure?.tiles ?? []).filter(({ tx, ty }) => charAt(tx, ty) === 'Ǎ');
      if (this.perchIn <= 0 && trees.length) {
        this.perchIn = Phaser.Math.FloatBetween(...PEN_PERCH_EVERY);
        const taken = this.scene.animals.filter((a) => a !== this && a.species === 'vulture' && (a.perched || a.toPerch)).map((a) => a.perchTile);
        const t = Phaser.Utils.Array.GetRandom(trees.filter((t) => !taken.includes(t)));
        if (t) {
          const p = tileToWorld(t.tx, t.ty);
          this.perchTile = t;
          this.toPerch = true;
          this.penFlight = { from: { x: this.x, y: this.y }, to: { x: p.x + PERCH_X, y: p.y + 3 }, done: 0 };
        }
      }
    }
    return super.updateFree(dt, player);
  }

  restore(state) {
    this.perched = false;
    this.toPerch = false;
    super.restore(state);
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return this.updatePerch(dt, player);
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.phase === 'approach' || this.phase === 'circle') {
      this.altitude = ALTITUDE;
      if (this.phase === 'approach') {
        // zum Kreis über dem Baum
        const tx = this.perch.x + Math.cos(this.angle) * CIRCLE_R;
        const ty = this.perch.y + (Math.sin(this.angle) * CIRCLE_R) / 2;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const d = Math.hypot(dx, dy);
        const step = FLY_SPEED * dt;
        if (d <= step) this.phase = 'circle';
        else {
          this.x += (dx / d) * step;
          this.y += (dy / d) * step;
          this.faceX = Math.sign(dx) || this.faceX;
          this.faceY = Math.sign(dy) || this.faceY;
        }
        return false;
      }
      // kreisen
      this.angle += CIRCLE_SPEED * dt;
      const nx = this.perch.x + Math.cos(this.angle) * CIRCLE_R;
      const ny = this.perch.y + (Math.sin(this.angle) * CIRCLE_R) / 2;
      this.faceX = Math.sign(nx - this.x) || this.faceX;
      this.faceY = Math.sign(ny - this.y) || this.faceY;
      this.x = nx;
      this.y = ny;
      this.circleTime -= dt;
      if (this.circleTime <= 0) {
        this.phase = 'flying'; // hinunter in die Krone (siehe Heron)
        this.start = { x: this.x, y: this.y };
      }
      return false;
    }
    const r = super.updateFree(dt, player);
    if (this.phase === 'flying' && this.land) this.altitude = Math.max(this.altitude, PERCH_H); // landet oben im Baum, nicht am Boden
    return r;
  }

  render(moving) {
    super.render(moving);
    if ((this.state === 'wild' && this.phase === 'landed') || (this.state === 'penned' && this.perched)) {
      // oben in der Krone, vor dem Baum; der Schatten am Boden fällt weg
      this.sprite.setPosition(this.x, this.y - PERCH_H);
      this.sprite.setDepth(this.y + 2);
      this.shadow.setVisible(false);
    } else {
      this.shadow.setVisible(true);
    }
  }
}
