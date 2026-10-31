// Piranha (Dschungel, nur bei Starkregen): im Fluss ziehen Schwärme als wirbelnde dunkle Schatten knapp unter der
// Wasseroberfläche ihre Kreise. Fangen kann man sie nur mit der Angel vom Kanu aus (siehe RodTool.js), einen pro Biss.
// Gefangen kommen sie in eine Transportbox (im Kanu liegt sie hinten im Boot, siehe Boat.js) und ziehen im Tierpark ins
// Becken im Reptilienhaus. Dort schwimmen sie wie die Riff-Fische (Seitenansicht, wackelnde Schwanzflosse).
import Phaser from 'phaser';
import ReefFish from './ReefFish.js';
import { LEVEL, MAP_W, MAP_H, charAt } from '../world/map.js';
import { tileToWorld, worldToTile } from '../world/iso.js';

const SCHOOL_SIZE = [3, 5]; // so viele Piranhas in einem Schwarm
const RADIUS = [7, 20]; // so weit kreisen sie um die Mitte des Schwarms (Pixel, waagerecht; senkrecht halb so weit)
const TURN = [1.4, 2.6]; // so schnell (Bogenmaß pro Sekunde), gegen oder mit dem Uhrzeigersinn
const WOBBLE = 4; // Radius schwankt um so viel (wirbelt)
const SHADOW_TINT = 0x10221c; // dunkler Schatten im trüben Wasser
const SHADOW_ALPHA = 0.5;
const MIN_RIVER = 40; // nur Wasser ab so vielen Kacheln (der Fluss, nicht das Becken am Wasserfall)
const SCHOOL_GAP = 6; // Kacheln Abstand zwischen zwei Schwärmen

// Kacheln mitten im Fluss (ringsum Wasser), einmal je Level berechnet
let riverCache = null;
function riverMiddle() {
  if (riverCache?.level === LEVEL) return riverCache.tiles;
  const water = (tx, ty) => tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H && charAt(tx, ty) === '~';
  const seen = new Set();
  const tiles = [];
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      if (!water(tx, ty) || seen.has(tx + ',' + ty)) continue;
      const group = [];
      const todo = [[tx, ty]];
      seen.add(tx + ',' + ty);
      while (todo.length) {
        const [x, y] = todo.pop();
        group.push([x, y]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = x + dx + ',' + (y + dy);
          if (!seen.has(k) && water(x + dx, y + dy)) {
            seen.add(k);
            todo.push([x + dx, y + dy]);
          }
        }
      }
      if (group.length < MIN_RIVER) continue;
      for (const [x, y] of group) {
        let inner = true;
        for (let dy = -1; dy <= 1 && inner; dy++) for (let dx = -1; dx <= 1 && inner; dx++) inner = water(x + dx, y + dy);
        if (inner) tiles.push({ tx: x, ty: y });
      }
    }
  }
  riverCache = { level: LEVEL, tiles };
  return tiles;
}

export default class Piranha extends ReefFish {
  constructor(scene, x, y, school = null) {
    super(scene, x, y, 0, null, 'piranha');
    this.school = school ?? { x, y, ...worldToTile(x, y), members: [] };
    this.school.members.push(this);
    this.angle = Math.random() * Math.PI * 2;
    this.radius = Phaser.Math.FloatBetween(...RADIUS);
    this.turn = Phaser.Math.FloatBetween(...TURN) * (Math.random() < 0.5 ? -1 : 1);
    this.h = 0;
  }

  // ein Schwarm mitten im Fluss, nicht zu nah an anderen Schwärmen
  static spawnSchool(scene) {
    const others = scene.animals.filter((a) => a.species === 'piranha' && a.state === 'wild').map((a) => a.school);
    const free = riverMiddle().filter((t) => others.every((s) => Math.hypot(s.tx - t.tx, s.ty - t.ty) >= SCHOOL_GAP));
    const t = Phaser.Utils.Array.GetRandom(free);
    if (!t) return [];
    const c = tileToWorld(t.tx, t.ty);
    const school = { x: c.x, y: c.y, tx: t.tx, ty: t.ty, members: [] };
    const n = Phaser.Math.Between(...SCHOOL_SIZE);
    const group = [];
    for (let i = 0; i < n; i++) {
      const a = new Piranha(scene, c.x, c.y, school);
      scene.animals.push(a);
      group.push(a);
    }
    return group;
  }

  // wild: noch im Schwarm im Fluss
  wildInRiver() {
    return this.state === 'wild';
  }

  // nur mit der Angel (RodTool), nicht durch Berühren oder den Kescher
  canBeCaughtNow() {
    return false;
  }

  shouldFlee() {
    return false;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    this.phase += dt;
    // im Kreis um die Mitte des Schwarms, der Radius wirbelt leicht
    this.angle += this.turn * dt;
    const r = this.radius + Math.sin(this.phase * 1.7) * WOBBLE;
    const x = this.school.x + Math.cos(this.angle) * r;
    const y = this.school.y + (Math.sin(this.angle) * r) / 2;
    const vx = x - this.x;
    if (Math.abs(vx) > 0.05) this.faceX = Math.sign(vx);
    this.faceY = 1;
    this.x = x;
    this.y = y;
    this.h = 0;
    return true;
  }

  render(moving) {
    // im Kanu liegt die Box hinten im Boot (Boat.js): die folgenden Piranhas selbst sind dann nicht zu sehen
    if (this.state === 'following' && this.scene.boat?.riding) {
      this.sprite.setVisible(false);
      this.shadow.setVisible(false);
      return;
    }
    this.sprite.setVisible(true);
    super.render(moving);
    if (this.state === 'wild') {
      // wirbelnde Schatten im trüben Fluss, ohne Schatten am Grund
      this.sprite.setTintFill(SHADOW_TINT).setAlpha(SHADOW_ALPHA);
      this.shadow.setVisible(false);
    } else {
      this.sprite.clearTint().setAlpha(1);
    }
  }

  catch() {
    this.school.members.splice(this.school.members.indexOf(this), 1);
    this.sprite.clearTint().setAlpha(1);
    super.catch();
  }

  // nach dem Laden ohne Schwarm: ein eigener an der gespeicherten Stelle
  restore(state) {
    super.restore(state);
    if (state === 'wild' && !this.school?.members.includes(this)) {
      const { tx, ty } = worldToTile(this.x, this.y);
      this.school = { x: this.x, y: this.y, tx, ty, members: [this] };
    }
  }
}
