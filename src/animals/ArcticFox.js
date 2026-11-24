// Polarfuchs (Eiswelt, Tag und Nacht): weiß im Schnee – sehen kann man ihn nicht, nur seine Pfotenspuren. Sie beginnen
// irgendwo, führen an ein, zwei Felsen oder Tannen vorbei und enden mitten im Schnee: dort sitzt er. Stellt Henrik die
// Laterne in der Nähe des Spurendes ab, leuchten im Licht zwei Augen auf (und schwach der Fuchs selbst) – dann fängt man
// ihn mit dem Kescher. Kein Wegrennen, kein Zeitdruck. Spuren wie beim Schneeleoparden (SnowLeopard.js), Laterne wie
// beim Elch (Elk.js). Im Gehege ist er ein ganz normales Tier.
import Phaser from 'phaser';
import Fox from './Fox.js';
import { pawTexture } from './Wolf.js';
import { glowTexture } from '../world/Fireflies.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { MAP_W, MAP_H, charAt, inPen, isBlocked } from '../world/map.js';

const LIGHT_DIST = 70; // so nah (Kachel-Proportionen, y doppelt) muss die abgestellte Laterne am Fuchs stehen
const SHOW_ALPHA = 0.55; // so deutlich ist er im Laternenlicht zu sehen (weiß im Schnee) ...
const EYE_COLOR = 0xd8ff8a; // ... und so leuchten seine Augen ...
const EYE_W = 2.5; // ... so groß (Welt-Pixel, etwa wie die gemalten Augen) ...
const EYE_H = 1.5;
const GLOW_SCALE = 0.11; // weicher Schein um jedes Auge (Bild der Glühwürmchen)
const GLOW_ALPHA = 0.85;
const BLINK_EVERY = [2.5, 5]; // ... so oft blinzeln sie ...
const BLINK_TIME = 0.14; // ... so kurz
// Lage der Augen im Bild (von den Füßen aus, ausgemessen in arcticfox.png): nach rechts unten bzw. links unten schauend
const EYES = { 1: [[10, -38.5], [18, -41.5]], [-1]: [[-11, -38.5], [-19, -41.5]] }; // (Halbprofil: das hintere Auge sitzt höher)
const TRACK_STEP = 0.55; // Abstand der Abdrücke (Kacheln; kleiner als beim Schneeleoparden)
const TRACK_START = [8, 13]; // so weit (Kacheln) vom Versteck beginnt die Spur
const TRACK_VIA = [1, 2]; // an so vielen Felsen oder Tannen führt sie vorbei
const TRACK_TINT = 0x4a6282;
const TRACK_ALPHA = 0.7;
const TRACK_DEPTH = -99989;
const VIA_CHARS = 'ȒȞƟÊṖ'; // Felsen, Eisblöcke und Tannen, an denen die Spur vorbeiführt
const SPOT_AWAY = 9; // so weit (Kacheln) weg von Henrik sucht er sich ein Versteck

// (Bilder: der Silberfuchs aufgehellt, tools/arctic-fox.py; im Gehege schläft er wie der Fuchs, siehe Fox.js)
export default class ArcticFox extends Fox {
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

  // zwei leuchtende Augen im Laternenlicht: klein und mandelförmig wie die gemalten Augen, ein heller Kern mit einem
  // feinen dunklen Rand (sonst sähe man sie am Tag auf dem Schnee nicht) und ein weicher Schein darum; ab und zu
  // blinzeln sie
  showEyes(on) {
    if (on && !this.eyes) {
      const scene = this.scene;
      const glow = (i) => scene.add.image(0, 0, glowTexture(scene)).setTint(EYE_COLOR).setBlendMode(Phaser.BlendModes.ADD).setScale(GLOW_SCALE).setData({ i, glow: true });
      const eye = (i) => scene.add.ellipse(0, 0, EYE_W, EYE_H, 0xe4ff8c, 1).setStrokeStyle(0.4, 0x3d5a1c, 0.5).setData({ i });
      const shine = (i) => scene.add.circle(0, 0, 0.35, 0xffffff, 1).setData({ i, shine: true });
      this.eyes = [glow(0), glow(1), eye(0), eye(1), shine(0), shine(1)];
      for (const e of this.eyes) {
        const to = e.getData('glow') ? GLOW_ALPHA : 1;
        e.setAlpha(0);
        scene.tweens.add({ targets: e, alpha: to, duration: 700 });
      }
      this.blinkIn = Phaser.Math.FloatBetween(...BLINK_EVERY);
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
    // wild: sitzt still (Standbild statt Steh-Animation, darauf sind die Augen ausgemessen); nur im Laternenlicht schwach
    // zu sehen, dazu die Augen
    const f = this.kind.frames;
    this.sprite.stop().setFlipX(false);
    this.sprite.setTexture(this.kind.texture, this.faceX < 0 ? f.downLeft : f.downRight).setOrigin(0.5, this.kind.originY);
    this.sprite.setVisible(this.lit).setAlpha(SHOW_ALPHA);
    this.shadow.setVisible(false);
    this.showEyes(this.lit);
    if (this.eyes) {
      const at = EYES[this.faceX < 0 ? -1 : 1];
      // blinzeln: kurz zu (flach)
      this.blinkIn -= this.scene.game.loop.delta / 1000;
      if (this.blinkIn < -BLINK_TIME) this.blinkIn = Phaser.Math.FloatBetween(...BLINK_EVERY);
      const open = this.blinkIn < 0 ? 0.15 : 1;
      for (const e of this.eyes) {
        const [dx, dy] = at[e.getData('i')];
        // (das Bild ist verkleinert gezeichnet; die Mitte des gemalten Auges liegt einen halben Bildpunkt weiter)
        const x = this.sprite.x + (dx + 0.5) * Math.abs(this.sprite.scaleX);
        const y = this.sprite.y + (dy + 0.5) * this.sprite.scaleY;
        const k = e.getData('glow') ? GLOW_SCALE : 1;
        e.setPosition(e.getData('shine') ? x + 0.4 : x, e.getData('shine') ? y - 0.3 : y).setScale(k, k * (e.getData('glow') ? Math.max(open, 0.5) : open)).setDepth(this.sprite.depth + (e.getData('glow') ? 0.4 : 0.5));
        if (e.getData('shine')) e.setVisible(open === 1);
      }
    }
  }

  destroy() {
    this.clearTracks();
    this.showEyes(false);
    super.destroy();
  }
}
