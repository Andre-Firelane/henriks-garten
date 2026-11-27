// Schneehase (Eiswelt, docs/plan-eiswelt.md): hat einen Bau mit 2–3 Löchern, die unterirdisch verbunden sind, und
// hoppelt in der Nähe herum. Kommt Henrik näher, flitzt er ins nächste offene Loch und kommt nach einer Weile aus einem
// anderen wieder heraus (dem, das am weitesten von Henrik weg ist). Henrik schiebt offene Löcher mit der Aktionstaste zu
// (closeHole, über IceCatch.js); das letzte bleibt immer offen. Beim Herauskommen schaut er erst ein paar Sekunden
// schnuppernd heraus (fangbar). Ist nur noch ein Loch offen, kommt er dort heraus, auch wenn Henrik danebensteht.
// Fangen: Hand oder Kescher (draußen oder beim Herausschauen).
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { MAP_W, MAP_H, charAt, isBlocked, inPen } from '../world/map.js';
import { GHOST_ALPHA, GHOST_DEPTH, isCovered, outlineTexture } from '../world/Boat.js';

const HOLES = [2, 3]; // so viele Löcher hat ein Bau
const HOLE_DIST = [3, 5]; // so weit (Kacheln) liegen die anderen Löcher vom ersten weg
const HOLE_GAP = 2.5; // ... und mindestens so weit voneinander
const SEE_DIST = 95; // so nah darf Henrik kommen, dann flitzt er ins Loch (Kachel-Proportionen, y doppelt)
const IN_TIME = [4, 7]; // so lange bleibt er im Bau
const PEEK_TIME = 3.5; // so lange schaut er heraus, bevor er weiterhoppelt oder wieder abtaucht
const GRAZE_R = 80; // so weit hoppelt er vom Loch weg, aus dem er kam
const PEEK_SHOW = 0.6; // so viel (von oben) sieht man vom Hasen, wenn er aus dem Loch schaut
const GROUND_SEARCH = 6; // so weit (Kacheln) sucht er Boden für den Bau, wenn er auf Eis steht
const HOLE_DEPTH = -4; // Löcher liegen flach auf dem Boden (unter dem Hasen)
const HOLE_RES = 3; // Loch-Bilder so viel feiner gezeichnet (siehe ensureTextures)
const GHOST_CHECK = 0.2; // so oft (Sekunden) wird geprüft, ob ein Baum Loch oder Hasen verdeckt (dann scheint die Kontur durch)

// Bilder für Loch und zugeschobenes Loch (gezeichnet, Platzhalter), HOLE_RES-fach fein, damit sie beim Hineinzoomen
// scharf bleiben
function ensureTextures(scene) {
  if (scene.textures.exists('hare_hole')) return;
  const k = HOLE_RES;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const e = (color, x, y, w, h) => g.fillStyle(color, 1).fillEllipse(x * k, y * k, w * k, h * k);
  // offen: Schneewall, dunkles Loch
  e(0xdfe9f4, 16, 9, 30, 15);
  e(0xffffff, 16, 7.5, 26, 11);
  e(0x45556b, 16, 9, 17, 8);
  e(0x27323f, 16, 9.8, 12, 5.5);
  g.generateTexture('hare_hole', 32 * k, 18 * k);
  g.clear();
  // zu: kleiner Schneehaufen
  e(0xc9d7e6, 16, 12, 30, 12);
  e(0xeef4fb, 16, 9, 24, 13);
  e(0xffffff, 13, 6.5, 12, 6);
  g.generateTexture('hare_hole_closed', 32 * k, 18 * k);
  g.destroy();
  for (const key of ['hare_hole', 'hare_hole_closed']) scene.textures.get(key).customData.hd = k; // (Kontur gleich dick wie sonst)
}

export default class SnowHare extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'snowhare');
    this.mode = 'out'; // 'out' → 'run' (ins Loch) → 'in' → 'peek' → 'out'
    this.holes = null; // [{ x, y, open, img }]
    this.at = null; // Loch, an dem er gerade ist (beim Herausschauen bzw. Hineinflitzen)
  }

  // der Bau: das erste Loch, wo er zum ersten Mal steht, die anderen in der Nähe auf freien Kacheln
  makeBurrow() {
    ensureTextures(this.scene);
    // nur auf normalem Schneeboden, nie auf Eisflächen (zugefrorenes Meer, Schollen): steht er dort, zieht der Bau auf
    // die nächste passende Kachel
    const here = worldToTile(this.x, this.y);
    let first = SnowHare.ground(here.tx, here.ty) ? here : null;
    for (let r = 1; r <= GROUND_SEARCH && !first; r++) {
      for (let dy = -r; dy <= r && !first; dy++) for (let dx = -r; dx <= r && !first; dx++) if (SnowHare.ground(here.tx + dx, here.ty + dy)) first = { tx: here.tx + dx, ty: here.ty + dy };
    }
    if (!first) {
      this.holes = [];
      this.scene.despawn?.(this); // weit und breit kein Boden für einen Bau
      return;
    }
    const p0 = tileToWorld(first.tx, first.ty);
    this.x = p0.x;
    this.y = p0.y;
    const tiles = [first];
    const want = Phaser.Math.Between(...HOLES);
    for (let i = 0; i < 60 && tiles.length < want; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Phaser.Math.FloatBetween(...HOLE_DIST);
      const tx = Math.round(first.tx + Math.cos(a) * r);
      const ty = Math.round(first.ty + Math.sin(a) * r);
      if (!SnowHare.ground(tx, ty)) continue;
      if (tiles.some((t) => Math.hypot(t.tx - tx, t.ty - ty) < HOLE_GAP)) continue;
      tiles.push({ tx, ty });
    }
    this.holes = tiles.map(({ tx, ty }) => {
      const p = tileToWorld(tx, ty);
      const img = this.scene.add.image(p.x, p.y, 'hare_hole').setScale(1 / HOLE_RES).setDepth(p.y + HOLE_DEPTH);
      // Kontur, die durch Bäume scheint, wenn einer das Loch verdeckt
      const ghost = this.scene.add.image(p.x, p.y, outlineTexture(this.scene, 'hare_hole')).setScale(1 / HOLE_RES).setDepth(GHOST_DEPTH).setAlpha(0);
      return { x: p.x, y: p.y, open: true, img, ghost };
    });
    this.at = this.holes[0];
    this.leash = { x: this.at.x, y: this.at.y, r: GRAZE_R };
  }

  // Kachel für ein Loch: frei, normaler Boden (kein Eis), nicht am Rand, nicht im Gehege
  static ground(tx, ty) {
    return tx >= 2 && ty >= 2 && tx <= MAP_W - 3 && ty <= MAP_H - 3 && charAt(tx, ty) === '.' && !isBlocked(tx, ty) && !inPen(tx, ty);
  }

  openHoles() {
    return this.holes?.filter((h) => h.open) ?? [];
  }

  // Loch mit der Aktionstaste zuschieben (nicht das letzte offene, nicht das, aus dem er gerade schaut)
  canClose(h) {
    return h.open && this.openHoles().length > 1 && !(this.mode === 'peek' && this.at === h);
  }

  closeHole(h) {
    if (!this.canClose(h)) return false;
    h.open = false;
    h.img.setTexture('hare_hole_closed');
    h.ghost.setTexture(outlineTexture(this.scene, 'hare_hole_closed'));
    this.scene.tweens.add({ targets: h.img, scaleY: { from: 0.4 / HOLE_RES, to: 1 / HOLE_RES }, duration: 220, ease: 'Back.easeOut' });
    return true;
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.mode !== 'in' && this.mode !== 'run';
  }

  canDespawn() {
    return this.mode === 'in';
  }

  // im Bau (Fernglas: Bild über dem Loch, LuckWorld.binocularTargets)
  unseen() {
    return this.state === 'wild' && this.mode === 'in';
  }

  blocked(x, y) {
    if (this.state === 'wild' && this.mode === 'run') return false; // geradewegs ins Loch
    return super.blocked(x, y);
  }

  dist(a, b) {
    return Math.hypot(a.x - b.x, (a.y - b.y) * 2);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (!this.holes) this.makeBurrow();
    if (!this.holes.length) return false; // kein Bau möglich (verschwindet gerade)
    const fromMe = this.dist(player, this);
    if (this.mode === 'in') {
      this.modeTime -= dt;
      if (this.modeTime > 0) return false;
      // herauskommen: aus dem offenen Loch, das am weitesten von Henrik weg ist
      const open = this.openHoles();
      const h = open.reduce((b, o) => (this.dist(player, o) > this.dist(player, b) ? o : b), open[0]);
      this.at = h;
      this.x = h.x;
      this.y = h.y + 2;
      this.mode = 'peek';
      this.modeTime = PEEK_TIME;
      this.faceX = Math.sign(player.x - this.x) || this.faceX;
      this.faceY = 1;
      return false;
    }
    if (this.mode === 'peek') {
      this.modeTime -= dt;
      this.faceX = Math.sign(player.x - this.x) || this.faceX; // schnuppert in Henriks Richtung
      if (this.modeTime > 0) return false;
      if (fromMe < SEE_DIST) {
        // Henrik ist noch da: wieder hinein (ist nur dieses Loch offen, kommt er gleich wieder hier heraus)
        this.mode = 'in';
        this.modeTime = Phaser.Math.FloatBetween(...IN_TIME);
        return false;
      }
      this.mode = 'out';
      this.leash = { x: this.at.x, y: this.at.y, r: GRAZE_R };
      this.pickWander();
      return false;
    }
    if (this.mode === 'out') {
      if (fromMe >= SEE_DIST) return super.updateFree(dt, { x: Infinity, y: Infinity }); // hoppelt herum (an der Leine)
      this.mode = 'run';
      this.scene.hareHid?.(this);
    }
    // ins nächste offene Loch flitzen
    const open = this.openHoles();
    const h = open.reduce((b, o) => (this.dist(this, o) < this.dist(this, b) ? o : b), open[0]);
    const dx = h.x - this.x;
    const dy = h.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) {
      this.at = h;
      this.mode = 'in';
      this.modeTime = Phaser.Math.FloatBetween(...IN_TIME);
      return false;
    }
    this.fleeing = true;
    const step = Math.min(d, (this.kind.fleeSpeed ?? 110) * dt);
    const moved = this.move((dx / d) * step, (dy / d) * step);
    this.fleeing = false;
    return moved;
  }

  render(moving) {
    const hidden = this.state === 'wild' && this.mode === 'in';
    this.sprite.setVisible(!hidden);
    this.shadow.setVisible(!hidden);
    super.render(moving);
    // schaut aus dem Loch: nur der obere Teil (unten abgeschnitten, ins Loch gesenkt), leicht wippend (schnuppert)
    const peek = this.state === 'wild' && this.mode === 'peek';
    if (peek) {
      const fr = this.sprite.frame;
      this.sprite.setCrop(0, 0, fr.width, fr.height * PEEK_SHOW);
      this.sprite.y = this.y + fr.height * (1 - PEEK_SHOW) * this.sprite.scaleY * 0.8 + Math.sin(this.scene.time.now / 120) * 0.6;
      this.shadow.setVisible(false);
      this.cropped = true;
    } else if (this.cropped) {
      this.sprite.setCrop();
      this.cropped = false;
    }
    this.updateGhosts(hidden);
  }

  // Konturen durch Bäume: für die Löcher und den Hasen selbst (draußen und beim Herausschauen), nur wenn wirklich etwas
  // davor steht (isCovered, wie beim Kanu)
  updateGhosts(hidden) {
    const scene = this.scene;
    const wild = this.state === 'wild';
    if (wild && !hidden && !this.ghost) this.ghost = scene.add.sprite(0, 0, outlineTexture(scene, 'snowhare')).setDepth(GHOST_DEPTH).setAlpha(0);
    this.ghostIn = (this.ghostIn ?? 0) - scene.game.loop.delta / 1000;
    const check = this.ghostIn <= 0;
    if (check) {
      this.ghostIn = GHOST_CHECK;
      for (const h of this.holes ?? []) h.ghost?.setAlpha(isCovered(scene, h.img) ? GHOST_ALPHA : 0);
    }
    if (!this.ghost) return;
    const key = this.sprite.texture.key;
    if (!wild || hidden || !key.startsWith('snowhare')) {
      this.ghost.setAlpha(0);
      return;
    }
    const sp = this.sprite;
    // Kontur zum gerade gezeigten Bild (Standbild oder Animation: Hoppeln, Stehen)
    const outline = outlineTexture(scene, key);
    if (this.ghost.texture.key !== outline) this.ghost.setTexture(outline);
    this.ghost.setFrame(sp.frame.name).setOrigin(sp.originX, sp.originY).setScale(sp.scaleX, sp.scaleY).setFlipX(sp.flipX).setPosition(sp.x, sp.y).setAngle(sp.angle);
    if (this.cropped) this.ghost.setCrop(0, 0, sp.frame.width, sp.frame.height * PEEK_SHOW);
    else this.ghost.setCrop();
    if (check) this.ghostShown = isCovered(scene, sp);
    this.ghost.setAlpha(this.ghostShown ? GHOST_ALPHA : 0);
  }

  dropGhost() {
    this.ghost?.destroy();
    this.ghost = null;
  }

  catch() {
    this.mode = 'out';
    this.leash = null;
    this.removeBurrow();
    super.catch();
  }

  removeBurrow() {
    for (const h of this.holes ?? []) {
      h.ghost.destroy();
      this.scene.tweens.add({ targets: h.img, alpha: 0, duration: 1500, onComplete: () => h.img.destroy() });
    }
    this.holes = [];
    this.dropGhost();
  }

  destroy() {
    for (const h of this.holes ?? []) {
      h.img.destroy();
      h.ghost.destroy();
    }
    this.holes = [];
    this.dropGhost();
    super.destroy();
  }

  restore(state) {
    super.restore(state);
    this.mode = 'out';
  }
}
