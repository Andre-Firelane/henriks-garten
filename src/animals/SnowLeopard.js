// Schneeleopard (Bambuswald, Hochebene; selten): döst oben auf einem der großen verschneiten Felsen (Ɵ). Sehen kann man
// ihn erst aus der Nähe – vorher verraten ihn nur seine Pfotenspuren im Schnee. Sie beginnen irgendwo auf der Hochebene
// und führen an ein, zwei Felsen vorbei zu seinem Felsen (jedes Mal anders). Wer ihnen folgt, findet ihn schlafend
// (💤) und kann ihn mit dem Lasso fangen. Ein Felsen, auf dem gerade einer gefangen wurde, bleibt eine Weile leer.
// Im Gehege streift er herum.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { pawTexture } from './Wolf.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { MAP_W, MAP_H, charAt, inPen, isBlocked } from '../world/map.js';

const LIFT = 36; // so hoch über dem Fuß des Felsens liegt er (auf der unteren Felsstufe)
const ON_ROCK_X = 16; // ... etwas rechts von der Mitte (links ragt die obere Platte auf)
const REVEAL = 190; // so nah (Kachel-Proportionen, y doppelt) muss man kommen, um ihn zu sehen
const SNORE_EVERY = 2.6; // so oft steigt ein 💤 auf
const TRACK_STEP = 0.7; // Abstand der Abdrücke (Kacheln)
const TRACK_START = [9, 14]; // so weit (Kacheln) vom Felsen beginnt die Spur
const TRACK_VIA = [1, 2]; // an so vielen anderen Felsen führt sie vorbei
const TRACK_TINT = 0x5d7088;
const TRACK_ALPHA = 0.55;
const TRACK_DEPTH = -99989; // über der Schneedecke (SnowCover), unter allem anderen
const ROCK_REST = 300; // von einem Felsen, auf dem gerade einer gefangen wurde, kommt so lange (Sekunden) keiner
const ROCK_CHARS = 'ȒȞȨƟ'; // Felsen, an denen die Spur vorbeiführt

export default class SnowLeopard extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'snowleopard');
    this.rock = null;
    this.revealed = false;
    this.tracks = [];
  }

  // die großen Felsen (nicht im Gehege)
  static rocks() {
    const list = [];
    for (let ty = 1; ty < MAP_H - 1; ty++) for (let tx = 1; tx < MAP_W - 1; tx++) if (charAt(tx, ty) === 'Ɵ' && !inPen(tx, ty)) list.push({ tx, ty });
    return list;
  }

  // auf einen freien Felsen legen (nicht zu nah an away) und die Spur dorthin legen; gibt zurück, ob einer frei war
  lieDownSomewhere(away) {
    const now = this.scene.time.now;
    const recent = (this.scene.leopardCaughtAt ?? []).filter((r) => r.until > now);
    this.scene.leopardCaughtAt = recent;
    const free = SnowLeopard.rocks().filter((r) => !recent.some((u) => u.tx === r.tx && u.ty === r.ty));
    const far = free.filter((r) => !away || Math.hypot(r.tx - away.tx, r.ty - away.ty) > 8);
    const rock = Phaser.Utils.Array.GetRandom(far.length ? far : free);
    if (!rock) return false;
    this.rock = rock;
    const p = tileToWorld(rock.tx, rock.ty);
    this.x = p.x + ON_ROCK_X;
    this.y = p.y + 4; // knapp vor dem Fuß des Felsens: dort trifft ihn das Lasso, gezeichnet wird er oben drauf
    this.faceX = Math.random() < 0.5 ? -1 : 1;
    this.faceY = 1;
    this.revealed = false;
    this.snoreIn = 0;
    this.layTracks();
    return true;
  }

  // Pfotenspur: von irgendwo auf der Hochebene an ein, zwei Felsen vorbei bis zum Felsen, auf dem er liegt
  layTracks() {
    this.clearTracks();
    const end = this.rock;
    const snow = (tx, ty) => (this.scene.snowCover?.amount(tx, ty) ?? 1) > 0.5;
    const starts = [];
    const vias = [];
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        const d = Math.hypot(tx - end.tx, ty - end.ty);
        if (ROCK_CHARS.includes(charAt(tx, ty)) && d > 3 && d < TRACK_START[1]) vias.push({ tx, ty, d });
        if (!isBlocked(tx, ty) && charAt(tx, ty) === '.' && snow(tx, ty) && d >= TRACK_START[0] && d <= TRACK_START[1]) starts.push({ tx, ty });
      }
    }
    const start = Phaser.Utils.Array.GetRandom(starts);
    if (!start) return;
    // Felsen unterwegs: zwischen Anfang und Ende, nach Entfernung zum Ende sortiert (die Spur kommt ihm immer näher)
    const between = vias.filter((v) => Math.hypot(v.tx - start.tx, v.ty - start.ty) < Math.hypot(end.tx - start.tx, end.ty - start.ty) && v.d < Math.hypot(start.tx - end.tx, start.ty - end.ty));
    const n = Math.min(between.length, Phaser.Math.Between(...TRACK_VIA));
    const via = Phaser.Utils.Array.Shuffle(between).slice(0, n).sort((a, b) => b.d - a.d);
    // an Felsen vorbei: neben ihnen her (eine halbe Kachel daneben), nicht mitten hindurch
    const pts = [start, ...via.map((v) => ({ tx: v.tx + 0.6, ty: v.ty + 0.6 })), { tx: end.tx + 0.7, ty: end.ty + 0.7 }];
    const prints = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = Math.hypot(b.tx - a.tx, b.ty - a.ty);
      const steps = Math.max(1, Math.round(len / TRACK_STEP));
      const wob = Phaser.Math.FloatBetween(-0.6, 0.6); // leicht geschwungen
      for (let k = 0; k < steps; k++) {
        const t = k / steps;
        const bend = Math.sin(Math.PI * t) * wob;
        const tx = a.tx + (b.tx - a.tx) * t - ((b.ty - a.ty) / len) * bend;
        const ty = a.ty + (b.ty - a.ty) * t + ((b.tx - a.tx) / len) * bend;
        prints.push({ tx, ty, dir: Math.atan2(b.ty - a.ty, b.tx - a.tx) });
      }
    }
    prints.forEach(({ tx, ty, dir }, i) => {
      if (isBlocked(Math.round(tx), Math.round(ty)) || !snow(tx, ty)) return; // auf Felsen und ohne Schnee keine Abdrücke
      const p = tileToWorld(tx, ty);
      const e = tileToWorld(tx + Math.cos(dir), ty + Math.sin(dir));
      const a = Math.atan2(e.y - p.y, e.x - p.x); // Laufrichtung auf dem Bildschirm
      const side = i % 2 ? 3 : -3;
      const img = this.scene.add.image(p.x + Math.cos(a + Math.PI / 2) * side, p.y + Math.sin(a + Math.PI / 2) * side, pawTexture(this.scene));
      img.setRotation(a + Math.PI / 2).setScale(0.42, 0.3).setTint(TRACK_TINT).setAlpha(TRACK_ALPHA).setDepth(TRACK_DEPTH);
      this.tracks.push(img);
    });
  }

  clearTracks() {
    for (const t of this.tracks) t.destroy();
    this.tracks = [];
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.revealed;
  }

  canDespawn() {
    return !this.revealed;
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild') return false; // liegt still auf dem Felsen
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (!this.rock && !this.lieDownSomewhere(worldToTile(player.x, player.y))) return false;
    if (!this.revealed && Math.hypot(player.x - this.x, (player.y - this.y) * 2) < REVEAL) {
      this.revealed = true;
      this.sprite.setAlpha(0);
      this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 700 });
    }
    if (this.revealed) {
      this.snoreIn -= dt;
      if (this.snoreIn <= 0) {
        this.snoreIn = SNORE_EVERY;
        this.snore();
      }
    }
    return false;
  }

  // ein 💤 steigt auf
  snore() {
    const t = this.scene.add.text(this.x + 10, this.y - LIFT - 28, '💤', { fontSize: '14px', resolution: 4 }).setOrigin(0.5).setDepth(100000).setAlpha(0.9);
    this.scene.tweens.add({ targets: t, y: t.y - 14, x: t.x + 6, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
  }

  catch() {
    if (this.state === 'wild' && this.rock) (this.scene.leopardCaughtAt ??= []).push({ ...this.rock, until: this.scene.time.now + ROCK_REST * 1000 });
    this.clearTracks();
    // springt vom Felsen herunter, vor den Felsen
    this.rock = null;
    this.sprite.setAlpha(1);
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.rock = null;
    this.clearTracks();
  }

  enterPen() {
    super.enterPen();
    this.rock = null;
  }

  render(moving) {
    const onRock = this.state === 'wild' && !!this.rock;
    this.sprite.setVisible(!onRock || this.revealed);
    this.shadow.setVisible(!onRock);
    super.render(moving);
    if (onRock) this.sprite.setY(this.sprite.y - LIFT);
  }

  destroy() {
    this.clearTracks();
    super.destroy();
  }
}
