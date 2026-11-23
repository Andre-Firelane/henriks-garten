// Polarfuchs (Eiswelt, Tag und Nacht): weiß im Schnee – sehen kann man ihn nicht, nur seine Pfotenspuren. Sie beginnen
// irgendwo, führen an ein, zwei Felsen oder Tannen vorbei und enden mitten im Schnee: dort sitzt er. Stellt Henrik die
// Laterne in der Nähe des Spurendes ab, leuchten im Licht zwei Augen auf (und schwach der Fuchs selbst) – dann fängt man
// ihn mit dem Kescher. Kein Wegrennen, kein Zeitdruck. Spuren wie beim Schneeleoparden (SnowLeopard.js), Laterne wie
// beim Elch (Elk.js). Im Gehege ist er ein ganz normales Tier.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { pawTexture } from './Wolf.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { MAP_W, MAP_H, charAt, inPen, isBlocked } from '../world/map.js';

const LIGHT_DIST = 70; // so nah (Kachel-Proportionen, y doppelt) muss die abgestellte Laterne am Fuchs stehen
const SHOW_ALPHA = 0.55; // so deutlich ist er im Laternenlicht zu sehen (weiß im Schnee) ...
const EYE_COLOR = 0xd8ff8a; // ... und so leuchten seine Augen
// Lage der Augen im Bild (von den Füßen aus, ausgemessen in arcticfox.png): nach rechts unten bzw. links unten schauend
const EYES = { 1: [[9, -36], [17, -34]], [-1]: [[-10, -38], [1, -38]] };
const TRACK_STEP = 0.55; // Abstand der Abdrücke (Kacheln; kleiner als beim Schneeleoparden)
const TRACK_START = [8, 13]; // so weit (Kacheln) vom Versteck beginnt die Spur
const TRACK_VIA = [1, 2]; // an so vielen Felsen oder Tannen führt sie vorbei
const TRACK_TINT = 0x4a6282;
const TRACK_ALPHA = 0.7;
const TRACK_DEPTH = -99989;
const VIA_CHARS = 'ȒȞƟÊṖ'; // Felsen, Eisblöcke und Tannen, an denen die Spur vorbeiführt
const SPOT_AWAY = 9; // so weit (Kacheln) weg von Henrik sucht er sich ein Versteck

export default class ArcticFox extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'arcticfox');
    this.spot = null; // Kachel des Verstecks (Ende der Spur)
    this.lit = false; // im Laternenlicht: Augen leuchten, fangbar
    this.tracks = [];
    this.eyes = null;
  }

  // freies Versteck im Schnee suchen (Tundra bevorzugt, weg von Henrik) und die Spur dorthin legen
  hideSomewhere(away) {
    const ok = (tx, ty) => charAt(tx, ty) === '.' && !isBlocked(tx, ty) && !inPen(tx, ty);
    const tundra = this.scene.groundTiles?.('tundra') ?? [];
    let list = tundra.filter(({ tx, ty }) => ok(tx, ty) && (!away || Math.hypot(tx - away.tx, ty - away.ty) > SPOT_AWAY));
    if (!list.length) {
      list = [];
      for (let ty = 2; ty < MAP_H - 2; ty++) for (let tx = 2; tx < MAP_W - 2; tx++) if (ok(tx, ty) && (!away || Math.hypot(tx - away.tx, ty - away.ty) > SPOT_AWAY)) list.push({ tx, ty });
    }
    const spot = Phaser.Utils.Array.GetRandom(list);
    if (!spot) return false;
    this.spot = spot;
    const p = tileToWorld(spot.tx, spot.ty);
    this.x = p.x;
    this.y = p.y;
    this.faceX = Math.random() < 0.5 ? -1 : 1;
    this.faceY = 1;
    this.lit = false;
    this.layTracks();
    return true;
  }

  // Pfotenspur: von irgendwo an ein, zwei Felsen oder Tannen vorbei bis zum Versteck (dort endet sie)
  layTracks() {
    this.clearTracks();
    const end = this.spot;
    const starts = [];
    const vias = [];
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        const d = Math.hypot(tx - end.tx, ty - end.ty);
        if (VIA_CHARS.includes(charAt(tx, ty)) && d > 3 && d < TRACK_START[1]) vias.push({ tx, ty, d });
        if (!isBlocked(tx, ty) && charAt(tx, ty) === '.' && d >= TRACK_START[0] && d <= TRACK_START[1]) starts.push({ tx, ty });
      }
    }
    const start = Phaser.Utils.Array.GetRandom(starts);
    if (!start) return;
    const total = Math.hypot(end.tx - start.tx, end.ty - start.ty);
    const between = vias.filter((v) => Math.hypot(v.tx - start.tx, v.ty - start.ty) < total && v.d < total);
    const n = Math.min(between.length, Phaser.Math.Between(...TRACK_VIA));
    const via = Phaser.Utils.Array.Shuffle(between).slice(0, n).sort((a, b) => b.d - a.d);
    const pts = [start, ...via.map((v) => ({ tx: v.tx + 0.6, ty: v.ty + 0.6 })), { tx: end.tx, ty: end.ty }];
    const prints = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = Math.hypot(b.tx - a.tx, b.ty - a.ty) || 1;
      const steps = Math.max(1, Math.round(len / TRACK_STEP));
      const wob = Phaser.Math.FloatBetween(-0.7, 0.7);
      for (let k = 0; k < steps; k++) {
        const t = k / steps;
        const bend = Math.sin(Math.PI * t) * wob;
        prints.push({
          tx: a.tx + (b.tx - a.tx) * t - ((b.ty - a.ty) / len) * bend,
          ty: a.ty + (b.ty - a.ty) * t + ((b.tx - a.tx) / len) * bend,
          dir: Math.atan2(b.ty - a.ty, b.tx - a.tx),
        });
      }
    }
    prints.forEach(({ tx, ty, dir }, i) => {
      if (isBlocked(Math.round(tx), Math.round(ty))) return; // auf Felsen keine Abdrücke
      const p = tileToWorld(tx, ty);
      const e = tileToWorld(tx + Math.cos(dir), ty + Math.sin(dir));
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      const side = i % 2 ? 2.5 : -2.5;
      const img = this.scene.add.image(p.x + Math.cos(a + Math.PI / 2) * side, p.y + Math.sin(a + Math.PI / 2) * side, pawTexture(this.scene));
      img.setRotation(a + Math.PI / 2).setScale(0.4, 0.3).setTint(TRACK_TINT).setAlpha(TRACK_ALPHA).setDepth(TRACK_DEPTH);
      this.tracks.push(img);
    });
  }

  clearTracks() {
    for (const t of this.tracks) t.destroy();
    this.tracks = [];
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.lit;
  }

  canDespawn() {
    return !this.lit;
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild') return false; // sitzt still in seinem Versteck
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (!this.spot && !this.hideSomewhere(worldToTile(player.x, player.y))) return false;
    const l = this.scene.lantern; // nur die abgestellte Laterne lockt ihn (nicht die in der Hand)
    this.lit = !!l && Math.hypot(l.x - this.x, (l.y - this.y) * 2) < LIGHT_DIST;
    if (this.lit && l) this.faceX = l.x < this.x ? -1 : 1;
    this.faceY = 1; // schaut immer nach vorn (die Augen sieht man nur von vorn)
    return false;
  }

  // zwei leuchtende Punkte (Augen im Laternenlicht)
  showEyes(on) {
    if (on && !this.eyes) {
      // auf hellem Schnee: leuchtend gelbgrün mit dunklem Rand (sonst sähe man sie am Tag nicht)
      const eye = (i) => this.scene.add.circle(0, 0, 2, EYE_COLOR, 1).setStrokeStyle(1, 0x1d2a1a, 1).setData('i', i);
      const halo = (i) => this.scene.add.circle(0, 0, 4.5, EYE_COLOR, 0.45).setBlendMode(Phaser.BlendModes.ADD).setData('i', i);
      this.eyes = [halo(0), halo(1), eye(0), eye(1)];
      for (const e of this.eyes) {
        const to = e.radius > 3 ? 0.45 : 1;
        e.setAlpha(0);
        this.scene.tweens.add({ targets: e, alpha: to, duration: 600 });
      }
    }
    if (!on && this.eyes) {
      for (const e of this.eyes) e.destroy();
      this.eyes = null;
    }
  }

  catch() {
    this.clearTracks();
    this.showEyes(false);
    this.spot = null;
    this.lit = false;
    this.sprite.setAlpha(1);
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.spot = null;
    this.clearTracks();
  }

  enterPen() {
    super.enterPen();
    this.spot = null;
  }

  render(moving) {
    const hidden = this.state === 'wild';
    super.render(moving);
    if (!hidden) {
      this.sprite.setVisible(true).setAlpha(1);
      this.shadow.setVisible(true);
      this.showEyes(false);
      return;
    }
    // wild: nur im Laternenlicht schwach zu sehen, dazu die Augen
    this.sprite.setVisible(this.lit).setAlpha(SHOW_ALPHA);
    this.shadow.setVisible(false);
    this.showEyes(this.lit);
    if (this.eyes) {
      const at = EYES[this.faceX < 0 ? -1 : 1];
      for (const e of this.eyes) {
        const [dx, dy] = at[e.getData('i')];
        e.setPosition(this.sprite.x + dx * Math.abs(this.sprite.scaleX), this.sprite.y + dy * this.sprite.scaleY).setDepth(this.sprite.depth + 0.5); // (das Bild ist verkleinert gezeichnet)
      }
    }
  }

  destroy() {
    this.clearTracks();
    this.showEyes(false);
    super.destroy();
  }
}
