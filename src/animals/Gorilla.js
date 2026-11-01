// Gorilla (Dschungel, nur bei Nebel, nur auf der Lichtung unten rechts hinter dem Dickicht): eine Gruppe streift langsam
// über die Lichtung. Trommelt Henrik dort auf seiner Trommel, kommt einer und stellt sich vor ihn: das Trommel-Duell
// (siehe DrumTool.js). Gewinnt Henrik, kommt der Gorilla mit; sonst geht er zurück zur Gruppe.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { LEVEL, isBlocked } from '../world/map.js';

const COME_SPEED = 1.6; // zum Duell etwas zügiger als beim Herumstreifen
const SIZE = 0.58; // etwas größer gezeichnet als die anderen Tiere (0,5): die Videos sind klein, größer erzeugt wären sie unscharf

export default class Gorilla extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'gorilla');
    this.sprite.setScale(SIZE);
    this.mode = 'roam'; // wild: 'roam' (herumstreifen), 'come' (zum Duell), 'duel', 'leave' (zurück zur Gruppe)
  }

  // freie Kacheln der Lichtung (LEVEL.gorillas)
  static clearingTiles() {
    const z = LEVEL.gorillas;
    const list = [];
    if (!z) return list;
    for (let ty = z.ty0; ty <= z.ty1; ty++) for (let tx = z.tx0; tx <= z.tx1; tx++) if (!isBlocked(tx, ty)) list.push({ tx, ty });
    return list;
  }

  // ein Gorilla auf einer freien Stelle der Lichtung (nicht direkt neben einem anderen)
  static spawnOnClearing(scene) {
    const others = scene.animals.filter((a) => a.species === 'gorilla' && a.state === 'wild');
    const tiles = Gorilla.clearingTiles().filter(({ tx, ty }) => others.every((o) => Math.hypot(tileToWorld(tx, ty).x - o.x, tileToWorld(tx, ty).y - o.y) > 40));
    const t = Phaser.Utils.Array.GetRandom(tiles);
    if (!t) return [];
    const p = tileToWorld(t.tx, t.ty);
    const a = scene.createAnimal('gorilla', p.x, p.y);
    a.home();
    return [a];
  }

  // an der Leine in der Mitte der Lichtung
  home() {
    const z = LEVEL.gorillas;
    if (!z) return;
    const c = tileToWorld((z.tx0 + z.tx1) / 2, (z.ty0 + z.ty1) / 2);
    this.leash = { x: c.x, y: c.y, r: z.r ?? 130 };
  }

  // gefangen wird er nur durch das gewonnene Trommel-Duell (DrumTool ruft scene.catchAnimal)
  canBeCaughtNow() {
    return false;
  }

  shouldFlee() {
    return false;
  }

  canDespawn() {
    return this.mode === 'roam';
  }

  // zum Duell kommen: an den Platz spot (vor Henrik), dort stehen bleiben
  comeTo(spot) {
    this.mode = 'come';
    this.spot = spot;
  }

  // Duell vorbei, nicht gewonnen: zurück zur Gruppe
  leave() {
    this.mode = 'leave';
    this.spot = this.leash ? { x: this.leash.x + Phaser.Math.Between(-40, 40), y: this.leash.y + Phaser.Math.Between(-15, 15) } : null;
  }

  // Trommeln beginnen: aufrichten, dann durchgehend auf die Brust trommeln (bis stopDrum)
  startDrum() {
    this.drum = 'in';
    this.playDrum('gorilla_drum_in');
    this.sprite.once('animationcomplete-gorilla_drum_in', () => {
      if (this.drum === 'in') {
        this.drum = 'loop';
        this.playDrum('gorilla_drum_loop');
      }
    });
  }

  // aufhören: wieder auf alle viere, danach die Steh-Animation
  stopDrum() {
    if (!this.drum || this.drum === 'out') return;
    this.drum = 'out';
    this.playDrum('gorilla_drum_out');
    this.sprite.once('animationcomplete-gorilla_drum_out', () => {
      if (this.drum === 'out') this.drum = null;
    });
  }

  playDrum(key) {
    if (!this.scene.anims.exists(key)) return;
    this.sprite.play(key);
    const feetY = this.sprite.texture.customData.feetY;
    this.sprite.setOrigin(0.5, feetY ? feetY / this.sprite.frame.height : this.kind.originY);
  }

  // ein Schlag (zum Zählen): ein kleiner Ring vor der Brust
  beat() {
    const ring = this.scene.add.ellipse(this.x, this.sprite.y - 22, 10, 6).setStrokeStyle(1.5, 0xffffff, 0.8).setDepth(this.y + 1);
    this.scene.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.mode === 'duel') {
      this.faceX = Math.sign(player.x - this.x) || this.faceX;
      this.faceY = 1;
      return false;
    }
    if (this.mode === 'come' || this.mode === 'leave') {
      const to = this.spot;
      if (!to) {
        this.mode = 'roam';
        return false;
      }
      const dx = to.x - this.x;
      const dy = to.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) {
        if (this.mode === 'come') this.mode = 'duel';
        else {
          this.mode = 'roam';
          this.pickWander();
        }
        return false;
      }
      const step = Math.min(d, this.kind.speed * COME_SPEED * dt);
      const angle = Math.atan2(dy, dx);
      for (const turn of [0, 0.5, -0.5, 1, -1]) {
        if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) return true;
      }
      return false;
    }
    return super.updateFree(dt, player);
  }

  catch() {
    this.drum = null;
    this.mode = null;
    this.leash = null;
    super.catch();
  }

  render(moving) {
    // beim Trommeln die Trommel-Animation (nach links gespiegelt), sonst wie alle Tiere
    if (this.drum && this.state === 'wild') {
      this.sprite.setFlipX(this.faceX < 0).setScale(this.baby ? 0.3 : SIZE);
      this.placeSprite(false);
      return;
    }
    // nach dem Trommeln zurück aufs normale Bild, dann greift wieder die Steh- bzw. Laufanimation
    if (this.sprite.texture.key === 'gorilla_drum') this.sprite.stop().setFlipX(false).setTexture(this.baseTexture(), 0).setOrigin(0.5, this.kind.originY);
    super.render(moving);
    this.sprite.setScale(this.baby ? 0.3 : SIZE);
  }
}
