// Eisschollen in der Eiswelt (nur am Tag, siehe floes in levels.js). Fähren treiben langsam zwischen dem Festland und den
// Inseln hin und her und liegen an beiden Ufern ein paar Sekunden an: dann läuft Henrik einfach hinüber (auf einer Scholle
// ist das Wasser begehbar, siehe floeFloor) und fährt mit. Kein Geschick nötig – die Kante der Scholle hält ihn auf wie
// ein Ufer, ins Wasser fallen kann er nicht; schlimmstenfalls wartet er kurz auf die nächste Fahrt. Tiere, die ihm folgen,
// stehen während der Fahrt mit auf der Scholle (siehe seat). Dazu treiben kleine Schollen zur Zierde über das offene Meer.
import Phaser from 'phaser';
import { tileToWorld, worldToTile } from './iso.js';
import { LEVEL, charAt, floeFloor } from './map.js';
import { blockedAt } from './collision.js';

const TILE = Math.hypot(32, 32); // eine Kachel in Kachel-Proportionen (Abstand mit doppelter Höhe, wie überall)
const FOOT = 8; // so weit reichen Henriks Füße von seiner Mitte (in Kachel-Proportionen): so weit innen hält ihn die Fahrt
const RIM = 5; // so dick ist die Scholle (Pixel unter der Oberfläche)
const DEPTH = -99980; // flach auf dem Wasser: über dem Boden, unter allem, was steht
const RES = 2; // Bilder in doppelter Auflösung (halb so groß angezeigt)

export default class Floes {
  constructor(scene) {
    this.scene = scene;
    const cfg = LEVEL.floes;
    this.time = Date.now() / 1000; // der Takt hängt an der Uhr: nach einem Gebietswechsel sind die Fähren nicht wieder am Anfang
    this.ferries = cfg.ferries.map((f, i) => this.make(f.from, f.to, cfg.r, `floe_ferry${i}`, { ...f, wait: cfg.wait, travel: cfg.travel }));
    this.drifts = (cfg.drift ?? []).map((f, i) => this.make(f.from, f.to, f.r, `floe_drift${i}`, f));
    for (const f of this.drifts) f.img.setDepth(DEPTH - 1);
    this.carrier = null; // die Fähre, auf der Henrik gerade fährt (nur während der Fahrt, nicht beim Anliegen)
    floeFloor.at = (x, y) => this.ferries.some((f) => inside(f, x, y, 0));
    scene.events.once('shutdown', () => (floeFloor.at = null));
    this.place(0);
  }

  make(from, to, r, key, opts) {
    const a = tileToWorld(...from);
    const b = tileToWorld(...to);
    const rad = r * TILE;
    const img = this.scene.add.image(a.x, a.y, floeTexture(this.scene, key, rad)).setScale(1 / RES).setDepth(DEPTH);
    img.setOrigin(0.5, (rad / 2 + 2) / (img.height / RES)); // Mitte der Oberfläche
    return { a, b, r: rad, img, x: a.x, y: a.y, moving: false, ...opts };
  }

  // Lage aller Schollen zur Zeit this.time; gibt zurück, wie weit sich die Fähre mit Henrik bewegt hat
  place(dt) {
    this.time += dt;
    for (const f of this.ferries) {
      // anliegen am Festland, hinüber, anliegen an der Insel, zurück
      const round = 2 * (f.wait + f.travel);
      const t = (((this.time + (f.shift ?? 0)) % round) + round) % round;
      let k;
      if (t < f.wait) k = 0;
      else if (t < f.wait + f.travel) k = Phaser.Math.Easing.Sine.InOut((t - f.wait) / f.travel);
      else if (t < 2 * f.wait + f.travel) k = 1;
      else k = 1 - Phaser.Math.Easing.Sine.InOut((t - 2 * f.wait - f.travel) / f.travel);
      f.moving = k > 0 && k < 1;
      f.dx = f.a.x + (f.b.x - f.a.x) * k - f.x;
      f.dy = f.a.y + (f.b.y - f.a.y) * k - f.y;
      f.x += f.dx;
      f.y += f.dy;
    }
    for (const f of this.drifts) {
      const k = (1 - Math.cos(((this.time % f.period) / f.period) * Math.PI * 2)) / 2;
      f.x = f.a.x + (f.b.x - f.a.x) * k;
      f.y = f.a.y + (f.b.y - f.a.y) * k;
    }
    // leichtes Schaukeln (nur das Bild)
    for (const [i, f] of [...this.ferries, ...this.drifts].entries()) f.img.setPosition(f.x, f.y + Math.sin(this.time * 1.6 + i) * 0.8);
  }

  update(dt) {
    this.place(dt);
    const p = this.scene.player;
    // Henrik steht auf einer fahrenden Fähre (mit der Mitte über dem Wasser): er fährt mit
    const { tx, ty } = worldToTile(p.x, p.y);
    const onWater = charAt(tx, ty) === '~';
    this.carrier = onWater ? this.ferries.find((f) => f.moving && inside(f, p.x, p.y, 0)) ?? null : null;
    const f = this.carrier;
    if (f) {
      p.x += f.dx;
      p.y += f.dy;
      // so weit innen, dass die Füße auf der Scholle bleiben
      const ox = p.x - f.x;
      const oy = (p.y - f.y) * 2;
      const d = Math.hypot(ox, oy);
      const max = f.r - FOOT;
      if (d > max) {
        p.x = f.x + (ox / d) * max;
        p.y = f.y + (oy / d) * max * 0.5;
      }
      p.trail = [{ x: p.x, y: p.y }]; // die Tiere stehen mit auf der Scholle (seat), danach folgen sie von hier
    } else if (blockedAt(p.x, p.y, 7, 3, false, false, false, true)) {
      // mit einem Fuß über dem Wasser stehen geblieben, als die Fähre ablegte: ein Schritt zurück an Land
      this.scene.unstickPlayer();
    }
  }

  // Platz für das i-te folgende Tier auf der Scholle, auf der Henrik fährt: im Halbkreis hinter ihm
  seat(i) {
    const f = this.carrier;
    const p = this.scene.player;
    const back = Math.atan2((p.y - f.y) * 2, p.x - f.x) + Math.PI;
    const a = back + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.9;
    const d = f.r * 0.5;
    return { x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d * 0.5 };
  }
}

// liegt der Punkt auf der Scholle (margin: so viel weiter innen)?
function inside(f, x, y, margin) {
  return Math.hypot(x - f.x, (y - f.y) * 2) < f.r - margin;
}

// Bild einer Scholle: unregelmäßige, flache Eisplatte (Rautenperspektive: halb so hoch wie breit) mit einer dunkleren
// Kante darunter und einem Schatten im Wasser; jede Scholle hat ihre eigene Form
function floeTexture(scene, key, r) {
  if (scene.textures.exists(key)) return key;
  const w = Math.ceil(r * 2 + 8);
  const h = Math.ceil(r + RIM + 10);
  const tex = scene.textures.createCanvas(key, w * RES, h * RES);
  const ctx = tex.getContext();
  ctx.scale(RES, RES);
  const cx = w / 2;
  const cy = r / 2 + 2;
  let seed = [...key].reduce((n, c) => n * 31 + c.charCodeAt(0), 7);
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const n = 11;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.25;
    const k = 0.86 + rnd() * 0.14;
    return [Math.cos(a) * r * k, Math.sin(a) * r * k * 0.5];
  });
  const shape = (dy, grow = 0) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](cx + x * (1 + grow), cy + y * (1 + grow) + dy));
    ctx.closePath();
  };
  // Schatten im Wasser, Kante, Oberfläche
  ctx.fillStyle = 'rgba(10, 40, 70, 0.28)';
  shape(RIM + 3, 0.06);
  ctx.fill();
  ctx.fillStyle = '#8fb9d6';
  shape(RIM);
  ctx.fill();
  const g = ctx.createLinearGradient(0, cy - r / 2, 0, cy + r / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#dcebf5');
  ctx.fillStyle = g;
  shape(0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 165, 200, 0.7)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // ein paar feine Risse und Schneeflecken
  ctx.strokeStyle = 'rgba(150, 190, 220, 0.6)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    const x = cx + (rnd() - 0.5) * r;
    const y = cy + (rnd() - 0.5) * r * 0.4;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * r * 0.5, y + (rnd() - 0.5) * r * 0.2);
    ctx.stroke();
  }
  tex.refresh();
  return key;
}
