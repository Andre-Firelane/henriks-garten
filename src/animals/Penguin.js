// Pinguin (Eiswelt): watschelt in kleinen Gruppen umher, aber immer nah am Wasser (höchstens zwei Kacheln davon weg,
// siehe NEAR_WATER). Kommt man ihm zu nah, hüpft er mit einem Bauchplatscher ins nächste Wasser und ist weg. Aus etwas
// Abstand fängt man ihn mit dem Lasso (es reicht weiter als SCARE); dann springen die anderen aus seiner Gruppe vor
// Schreck ins Wasser. Beim Laufen schwankt er leicht hin und her. Nachts ist das Meer zwischen den Inseln zugefroren:
// dann bleibt er am offenen Meer am Kartenrand.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { NEAR_WATER, charAt } from '../world/map.js';

const SCARE = 55; // so nah (Kachel-Proportionen) heran: er springt ins Wasser (das Lasso reicht bis etwa 100)
const JUMP_RANGE = 3; // so viele Kacheln weit sucht er das nächste Wasser
const JUMP_TIME = 0.55; // Dauer des Sprungs (Sekunden)
const JUMP_UP = 12; // so hoch springt er
const BELLY = 75; // so weit kippt er dabei nach vorne auf den Bauch (Grad)
const WADDLE = 7; // so weit kippt er ohne Lauf-Animation beim Watscheln hin und her (Grad) ...
const SWAY = 4; // ... und so weit mit (die Animation watschelt schon selbst)
const GROUP = 120; // so nah (Kachel-Proportionen) stehen die Pinguine einer Gruppe: wird einer gefangen, springen sie
const SCARED = [0.15, 0.6]; // ... nacheinander nach so vielen Sekunden ins Wasser
const CALL_EVERY = [20, 45]; // so oft ruft ein Pinguin (Sekunden) ...
const CALL_HEAR = 500; // ... so weit (Kachel-Proportionen) ist es zu hören ...
const CALL_VOLUME = 0.4; // ... und ganz nah so laut
const SPLASH_VOLUME = 0.35; // Platscher beim Sprung ins Wasser

// Kacheln am Wasser als Set (für blocked), neu aufgebaut, sobald die Karte eine andere ist
let nearWaterList = null;
let nearWaterSet = null;
function nearWater(tx, ty) {
  if (nearWaterList !== NEAR_WATER) {
    nearWaterList = NEAR_WATER;
    nearWaterSet = new Set(NEAR_WATER.map((t) => t.tx + ',' + t.ty));
  }
  return nearWaterSet.has(tx + ',' + ty);
}

export default class Penguin extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'penguin');
    this.jump = null; // { from, to, t } während des Sprungs ins Wasser
    this.scaredIn = null; // Sekunden, bis er vor Schreck ins Wasser springt (ein Pinguin der Gruppe wurde gefangen)
  }

  // gefangen: die anderen aus der Gruppe springen erschrocken ins Wasser
  catch() {
    super.catch();
    for (const a of this.scene.animals) {
      if (a === this || a.species !== 'penguin' || a.state !== 'wild' || a.jump || a.scaredIn !== null) continue;
      if (Math.hypot(a.x - this.x, (a.y - this.y) * 2) < GROUP) a.scaredIn = Phaser.Math.FloatBetween(...SCARED);
    }
  }

  // wild bleibt er am Wasser: Kacheln weiter weg gelten als versperrt (steht er selbst schon weiter weg, z. B. als Teil
  // einer Gruppe dort erschienen, darf er überallhin, sonst käme er nicht mehr vom Fleck)
  blocked(x, y) {
    if (super.blocked(x, y)) return true;
    if (this.state !== 'wild') return false;
    const here = worldToTile(this.x, this.y);
    if (!nearWater(here.tx, here.ty)) return false;
    const { tx, ty } = worldToTile(x, y);
    return !nearWater(tx, ty);
  }

  // mitten im Sprung erwischt ihn auch das Lasso nicht mehr
  canBeCaughtWith(tool) {
    return !this.jump && super.canBeCaughtWith(tool);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.jump) return this.updateJump(dt);
    this.call(dt, player);
    if (this.scaredIn !== null) {
      this.scaredIn -= dt;
      if (this.scaredIn <= 0) {
        this.scaredIn = null;
        if (this.startJump()) return true;
      }
    }
    if (Math.hypot(player.x - this.x, (player.y - this.y) * 2) < SCARE && this.startJump()) return true;
    return super.updateFree(dt, player);
  }

  // ab und zu ein Ruf (je näher, desto lauter)
  call(dt, player) {
    this.callIn = (this.callIn ?? Phaser.Math.FloatBetween(3, CALL_EVERY[1])) - dt;
    if (this.callIn > 0) return;
    this.callIn = Phaser.Math.FloatBetween(...CALL_EVERY);
    const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
    if (d < CALL_HEAR && this.scene.cache.audio.exists('animal_penguin')) this.scene.sound.play('animal_penguin', { volume: CALL_VOLUME * (1 - d / CALL_HEAR), detune: Phaser.Math.Between(-200, 200) });
  }

  // zu nah: mit einem Satz ins nächste Wasser (ohne Wasser in der Nähe bleibt er stehen)
  startJump() {
    let best = null;
    const { tx: hx, ty: hy } = worldToTile(this.x, this.y);
    for (let dy = -JUMP_RANGE; dy <= JUMP_RANGE; dy++) {
      for (let dx = -JUMP_RANGE; dx <= JUMP_RANGE; dx++) {
        if (charAt(hx + dx, hy + dy) !== '~') continue;
        const p = tileToWorld(hx + dx, hy + dy);
        const d = Math.hypot(p.x - this.x, (p.y - this.y) * 2);
        if (!best || d < best.d) best = { x: p.x, y: p.y, d };
      }
    }
    if (!best) return false;
    this.jump = { from: { x: this.x, y: this.y }, to: best, t: 0 };
    if (Math.abs(best.x - this.x) > 1) this.faceX = Math.sign(best.x - this.x);
    if (Math.abs(best.y - this.y) > 1) this.faceY = Math.sign(best.y - this.y);
    return true;
  }

  updateJump(dt) {
    const j = this.jump;
    j.t = Math.min(1, j.t + dt / JUMP_TIME);
    this.x = j.from.x + (j.to.x - j.from.x) * j.t;
    this.y = j.from.y + (j.to.y - j.from.y) * j.t;
    if (j.t >= 1 && !j.done) {
      j.done = true;
      this.splash();
      if (this.scene.cache.audio.exists('animal_fish')) this.scene.sound.play('animal_fish', { volume: SPLASH_VOLUME, detune: -200 }); // Platscher
      this.sprite.setVisible(false);
      this.shadow.setVisible(false);
      this.scene.despawn(this);
    }
    return true;
  }

  // beim Sprung hebt er ab und kippt auf den Bauch; beim Laufen schwankt er hin und her (ohne Lauf-Animation stärker)
  placeSprite(wobble) {
    super.placeSprite(wobble);
    if (this.jump) {
      const t = this.jump.t;
      this.sprite.y -= Math.sin(Math.PI * t) * JUMP_UP;
      this.sprite.setAngle(this.faceX * BELLY * Math.min(1, t * 1.6));
      this.shadow.setScale(1 - Math.sin(Math.PI * t) * 0.4);
      return;
    }
    if (this.walkTime > 0) this.sprite.setAngle(Math.sin(this.walkTime * this.kind.stepRate) * (this.animSet() ? SWAY : WADDLE));
  }
}
