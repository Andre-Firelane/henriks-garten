// Rentier (Eiswelt, docs/plan-eiswelt.md): wilde Herde, die ständig auf ihrem festen Rundweg durch die Tundra trabt,
// schneller als Henrik – hinterherlaufen bringt nichts (wie beim Jaguar). Den Pfad sieht man an den Trampelspuren im
// Schnee, die im Kreis verlaufen. Wer still am Pfad steht, wird nicht bemerkt, die Herde trabt dicht vorbei: Lasso.
// Läuft Henrik auf die Herde zu, schreckt sie auf, weicht aus und trabt danach wieder auf ihrem Pfad weiter. Wird eines
// gefangen, rennen die anderen davon (wie bei den Antilopen). Keine Glocken: es sind wilde Tiere.
// Findet sich kein Platz für einen Rundweg, verhält sich die Herde wie die Antilopen.
import Phaser from 'phaser';
import Antelope from './Antelope.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { MAP_W, MAP_H, isBlocked, inPen } from '../world/map.js';

const RUN_SPEED = 60; // Welt-Pixel pro Sekunde auf dem Pfad (Henrik: 80; läuft er hinterher, schreckt er sie auf)
const LOOP_R = [9, 14]; // Halbachsen des Rundwegs (Kacheln) ...
const LOOP_POINTS = 28; // ... aus so vielen Punkten ...
const LOOP_JITTER = 0.15; // ... die etwas vom Oval abweichen ...
const LOOP_SNAP = 2; // ... und auf eine freie Kachel höchstens so weit (Kacheln) daneben rücken
const LOOP_TRIES = 120;
const LOOP_MIN = 0.45; // notfalls bis auf diesen Anteil der Größe kleiner
const LOOP_SEARCH = 16; // passt dort kein Rundweg hin: Mitte auf einer Tundra-Kachel höchstens so weit weg (Kacheln)
const LOOP_SKIP = 3; // so viele einzelne Hindernisse (Stein, Baum) darf der Pfad streifen – darüber trabt die Herde hinweg
const GAP = 26; // so weit (Welt-Pixel, entlang des Pfads) laufen die Tiere hintereinander
const SIDE = 9; // so weit weichen sie seitlich vom Pfad ab
const SPOOK_DIST = 60; // läuft Henrik so nah an eines heran, schreckt die Herde auf (Kachel-Proportionen, y doppelt)
const ALARM_TIME = 1; // so lange flieht sie dann (kurz, danach trabt sie wieder auf ihrem Pfad)
const CATCH_UP = 1.35; // so viel schneller als RUN_SPEED holt eines auf, das hinter seinem Platz ist
const PATCH_EVERY = 46; // Trampelspuren: so oft (Welt-Pixel entlang des Pfads) ein Stück Spur ...
const PATCH_GAP = 0.3; // ... von denen so viele fehlen (der Pfad muss nicht durchgängig sein)
const PATCH_RES = 2; // das Bild der Spur ist so viel feiner gezeichnet (scharf auch beim Hineinzoomen)
const TRAIL_DEPTH = -99989; // wie die Spuren von Fuchs und Schneeleopard: über der Schneedecke, unter allem anderen

export default class Reindeer extends Antelope {
  constructor(scene, x, y, allAnimals) {
    super(scene, x, y, allAnimals, 'reindeer');
    this.slot = this.herd.count ?? 0; // Platz in der Reihe
    this.herd.count = this.slot + 1;
    this.side = Phaser.Math.FloatBetween(-SIDE, SIDE);
  }

  // frei für den Pfad? (keine Hindernisse, nicht im Gehege, nicht am Rand)
  static free(tx, ty) {
    const x = Math.floor(tx);
    const y = Math.floor(ty);
    return x > 1 && y > 1 && x < MAP_W - 2 && y < MAP_H - 2 && !isBlocked(x, y) && !inPen(x, y);
  }

  // Rundweg um die Stelle, an der die Herde erscheint (oder in der Nähe, am liebsten in der Tundra): ein unregelmäßiges
  // Oval auf freien Kacheln. Die Herde trabt dann von selbst dorthin
  makeLoop() {
    const h = this.herd;
    const start = worldToTile(this.x, this.y);
    const tundra = (this.scene.groundTiles?.('tundra') ?? []).filter(({ tx, ty }) => Math.hypot(tx - start.tx, ty - start.ty) < LOOP_SEARCH);
    for (let i = 0; i < LOOP_TRIES; i++) {
      const shrink = 1 - (i / LOOP_TRIES) * (1 - LOOP_MIN);
      const rx = Phaser.Math.FloatBetween(...LOOP_R) * shrink;
      const ry = Phaser.Math.FloatBetween(...LOOP_R) * shrink;
      const c = i < LOOP_TRIES / 4 || !tundra.length ? start : Phaser.Utils.Array.GetRandom(tundra);
      const cx = c.tx + Phaser.Math.FloatBetween(-rx, rx) * 0.6;
      const cy = c.ty + Phaser.Math.FloatBetween(-ry, ry) * 0.6;
      const turn = Math.random() * Math.PI;
      const pts = [];
      for (let k = 0; k < LOOP_POINTS; k++) {
        const a = (k / LOOP_POINTS) * Math.PI * 2;
        const j = 1 + Phaser.Math.FloatBetween(-LOOP_JITTER, LOOP_JITTER);
        const ox = Math.cos(a) * rx * j;
        const oy = Math.sin(a) * ry * j;
        const pt = Reindeer.snap(cx + ox * Math.cos(turn) - oy * Math.sin(turn), cy + ox * Math.sin(turn) + oy * Math.cos(turn));
        if (!pt) break;
        pts.push(pt);
      }
      if (pts.length < LOOP_POINTS) continue;
      // jede Strecke in kleinen Schritten prüfen: nur ein paar einzelne Hindernisse, nie zwei hintereinander (Wasser)
      let skips = 0;
      let ok = true;
      for (let k = 0; k < pts.length && ok; k++) {
        const a = pts[k];
        const b = pts[(k + 1) % pts.length];
        const n = Math.max(2, Math.ceil(Math.hypot(b.tx - a.tx, b.ty - a.ty) * 2));
        let last = true;
        for (let t = 1; t <= n && ok; t++) {
          const free = Reindeer.free(a.tx + ((b.tx - a.tx) * t) / n, a.ty + ((b.ty - a.ty) * t) / n);
          if (!free && (!last || ++skips > LOOP_SKIP)) ok = false;
          last = free;
        }
      }
      if (!ok) continue;
      const world = pts.map(({ tx, ty }) => tileToWorld(tx, ty));
      const lens = world.map((p, k) => {
        const q = world[(k + 1) % world.length];
        return Math.hypot(q.x - p.x, q.y - p.y);
      });
      h.loop = { pts: world, lens, length: lens.reduce((s, l) => s + l, 0), dir: Math.random() < 0.5 ? 1 : -1, t0: this.now() - Math.random() * 30 };
      this.drawTrail();
      return;
    }
    h.loop = false; // kein Platz: wie die Antilopen
  }

  // freie Kachel bei (tx, ty) oder in der Nähe (Mitte der Kachel), sonst null
  static snap(tx, ty) {
    if (Reindeer.free(tx, ty)) return { tx, ty };
    for (let r = 1; r <= LOOP_SNAP; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = Math.floor(tx) + dx;
          const y = Math.floor(ty) + dy;
          if (Reindeer.free(x, y)) return { tx: x + 0.5, ty: y + 0.5 };
        }
      }
    }
    return null;
  }

  // Punkt auf dem Pfad nach s Welt-Pixeln (läuft im Kreis) und die Richtung dort
  pointAt(s) {
    const l = this.herd.loop;
    s = ((s % l.length) + l.length) % l.length;
    for (let k = 0; k < l.pts.length; k++) {
      if (s <= l.lens[k] || k === l.pts.length - 1) {
        const a = l.pts[k];
        const b = l.pts[(k + 1) % l.pts.length];
        const t = Math.min(1, s / l.lens[k]);
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: (b.x - a.x) / l.lens[k], dy: (b.y - a.y) / l.lens[k] };
      }
      s -= l.lens[k];
    }
    return l.pts[0];
  }

  // Trampelspuren: kurze Stücke (plattgetretener Streifen mit Hufabdrücken) entlang des Pfads, mit Lücken. Ein Bild für
  // alle Stücke (tracksTexture), jedes Stück in Laufrichtung gedreht
  drawTrail() {
    const l = this.herd.loop;
    const scene = this.scene;
    const key = tracksTexture(scene);
    const box = scene.add.container(0, 0).setDepth(TRAIL_DEPTH);
    for (let s = Math.random() * PATCH_EVERY; s < l.length; s += PATCH_EVERY) {
      if (Math.random() < PATCH_GAP) continue;
      const p = this.pointAt(s);
      const img = scene.add.image(p.x, p.y, key, Phaser.Math.Between(0, 2)).setScale(1 / PATCH_RES);
      // Richtung auf dem Bildschirm; flach gedrückt wie der Boden (Kacheln halb so hoch wie breit)
      img.setRotation(Math.atan2(p.dy, p.dx)).setFlipY(Math.random() < 0.5);
      box.add(img);
    }
    this.herd.trail = box;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    const scattering = this.updateScatter(dt, player);
    if (scattering !== null) return scattering;
    const h = this.herd;
    if (h.loop === undefined) this.makeLoop();
    if (!h.loop) return super.updateFree(dt, player);
    const now = this.now();
    // nur wer sich bewegt, wird bemerkt
    if (player.moving && Math.hypot(this.x - player.x, (this.y - player.y) * 2) < SPOOK_DIST) h.alarm = now + ALARM_TIME;
    if (now < (h.alarm ?? 0)) {
      this.fleeing = true;
      return this.flee(dt, player);
    }
    this.fleeing = false;
    // Platz auf dem Pfad: alle laufen gemeinsam, jedes mit seinem Abstand in der Reihe
    const l = h.loop;
    const p = this.pointAt((now - l.t0) * RUN_SPEED * l.dir - this.slot * GAP * l.dir);
    const tx = p.x - p.dy * this.side;
    const ty = p.y + p.dx * this.side * 0.5;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.5) return false;
    const step = Math.min(d, RUN_SPEED * CATCH_UP * dt);
    if (!this.move((dx / d) * step, (dy / d) * step)) {
      this.x += (dx / d) * step; // (der Pfad selbst ist frei; nur nach einer Flucht kann etwas dazwischen sein)
      this.y += (dy / d) * step;
    }
    return true;
  }

  // wild rennt es (auf dem Rundweg, auf der Flucht), gefangen, folgend und im Gehege läuft es
  animKey(moving) {
    const anims = this.animSet(); // (das weiße Rentier rennt mit seinen eigenen Videos)
    if (!moving || this.state !== 'wild' || !anims?.runDown) return super.animKey(moving);
    return this.faceY > 0 ? anims.runDown : anims.runUp;
  }

  // Rennen: Tempo der Animation am Tempo auf dem Pfad messen (nicht am Gehtempo kind.speed, sonst wirbeln die Beine)
  render(moving) {
    super.render(moving);
    if (this.sprite.anims.isPlaying && this.sprite.anims.currentAnim?.key.includes('_run')) {
      this.sprite.anims.timeScale = Phaser.Math.Clamp(Math.pow((this.moveSpeed ?? RUN_SPEED) / RUN_SPEED, 0.6), 0.7, 1.8);
    }
  }

  // die Trampelspuren verschwinden mit dem letzten Tier der Herde
  dropTrail() {
    const g = this.herd?.trail;
    if (!g || this.scene.animals.some((a) => a !== this && a.herd === this.herd && a.state === 'wild')) return;
    this.herd.trail = null;
    const scene = this.scene;
    scene.tweens.add({ targets: g, alpha: 0, duration: 1500, onComplete: () => g.destroy() });
  }

  catch() {
    super.catch();
    this.dropTrail();
  }

  destroy() {
    this.dropTrail();
    super.destroy();
  }
}

// Bild für ein Stück Trampelspur (3 Varianten nebeneinander, PATCH_RES-fach fein): heller Streifen, Hufabdrücke links
// und rechts, an den Enden auslaufend
function tracksTexture(scene) {
  const key = 'reindeer_tracks';
  if (scene.textures.exists(key)) return key;
  const k = PATCH_RES;
  const W = 60;
  const H = 22;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let v = 0; v < 3; v++) {
    const ox = v * W;
    for (let i = 0; i < 6; i++) g.fillStyle(0x9fb4ca, 0.12).fillEllipse((ox + W / 2) * k, (H / 2) * k, (W - 6 - i * 7) * k, (11 - i) * k);
    for (let x = 6, n = 0; x < W - 6; x += 7 + Math.random() * 3, n++) {
      const fade = Math.min(1, x / 14, (W - x) / 14);
      for (const side of [-1, 1]) {
        const y = H / 2 + side * (n % 2 ? 2.5 : 5) + (Math.random() - 0.5) * 2;
        const hx = ox + x + (Math.random() - 0.5) * 2;
        g.fillStyle(0x6a7f96, 0.6 * fade).fillEllipse((hx - 1.4) * k, y * k, 2.4 * k, 1.8 * k).fillEllipse((hx + 1.4) * k, y * k, 2.4 * k, 1.8 * k);
      }
    }
  }
  g.generateTexture(key, 3 * W * k, H * k);
  g.destroy();
  const tex = scene.textures.get(key);
  for (let v = 0; v < 3; v++) tex.add(v, 0, v * W * k, 0, W * k, H * k);
  return key;
}
