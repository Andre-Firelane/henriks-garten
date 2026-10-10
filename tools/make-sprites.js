// Erzeugt alle Pixel-Art-Grafiken des Spiels als PNG-Dateien.
// Aufruf: npm run sprites
// Optional: PREVIEW=pfad/zu/preview.png erzeugt zusätzlich eine vergrößerte Übersicht.

import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('public/assets');
fs.mkdirSync(OUT, { recursive: true });

// ---------- Hilfsfunktionen ----------

function hex(c, a = 255) {
  c = c.replace('#', '');
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16), a];
}

// Fester Zufallsgenerator, damit die Grafiken bei jedem Lauf gleich aussehen
let seed = 1234567;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function randInt(min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  alpha(x, y) {
    return this.inside(x, y) ? this.d[(y * this.w + x) * 4 + 3] : 0;
  }
  set(x, y, c) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!this.inside(x, y)) return;
    const i = (y * this.w + x) * 4;
    const sa = c[3] / 255;
    const da = this.d[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa === 0) return;
    for (let k = 0; k < 3; k++) {
      this.d[i + k] = (c[k] * sa + this.d[i + k] * da * (1 - sa)) / oa;
    }
    this.d[i + 3] = oa * 255;
  }
  // Nur auf bereits gemalte Pixel zeichnen (für Schattierungen)
  paint(x, y, c) {
    if (this.alpha(Math.floor(x), Math.floor(y)) > 0) this.set(x, y, c);
  }
  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  ellipse(cx, cy, rx, ry, c, onlyPaint = false) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) onlyPaint ? this.paint(x, y, c) : this.set(x, y, c);
      }
    }
  }
  circle(cx, cy, r, c, onlyPaint = false) {
    this.ellipse(cx, cy, r, r, c, onlyPaint);
  }
  line(x0, y0, x1, y1, c) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 0 : s / steps;
      this.set(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), c);
    }
  }
  // Umrandet alle sichtbaren Pixel mit einer 1px-Kontur
  outline(c) {
    const mask = new Uint8Array(this.w * this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) mask[y * this.w + x] = this.alpha(x, y) > 100 ? 1 : 0;
    const at = (x, y) => (x >= 0 && y >= 0 && x < this.w && y < this.h ? mask[y * this.w + x] : 0);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (at(x, y)) continue;
        if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) this.set(x, y, c);
      }
    }
  }
  draw(src, ox, oy, flip = false) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const sx = flip ? src.w - 1 - x : x;
        const i = (y * src.w + sx) * 4;
        if (src.d[i + 3] === 0) continue;
        this.set(ox + x, oy + y, [src.d[i], src.d[i + 1], src.d[i + 2], src.d[i + 3]]);
      }
    }
  }
  // Gefülltes Vieleck (Punkte als [x, y]); onlyPaint: nur auf bereits gemalte Pixel
  poly(points, c, onlyPaint = false) {
    const ys = points.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      for (let x = 0; x < this.w; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i];
          const [xj, yj] = points[j];
          if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) onlyPaint ? this.paint(x, y, c) : this.set(x, y, c);
      }
    }
  }
  flipped() {
    const c = new Canvas(this.w, this.h);
    c.draw(this, 0, 0, true);
    return c;
  }
  scaled(f) {
    const c = new Canvas(this.w * f, this.h * f);
    for (let y = 0; y < c.h; y++) {
      for (let x = 0; x < c.w; x++) {
        const i = (Math.floor(y / f) * this.w + Math.floor(x / f)) * 4;
        const o = (y * c.w + x) * 4;
        for (let k = 0; k < 4; k++) c.d[o + k] = this.d[i + k];
      }
    }
    return c;
  }
  save(file) {
    const png = new PNG({ width: this.w, height: this.h });
    png.data = Buffer.from(this.d);
    fs.writeFileSync(file, PNG.sync.write(png));
  }
}

const SHADOW = [20, 40, 10, 70];
const INK = hex('#2b1d14');

// ---------- Bodenfliesen (64x32 Rauten) ----------

const TW = 64;
const TH = 32;

function inDiamond(x, y) {
  if (y < 0 || y >= TH) return false;
  const yy = y < TH / 2 ? y : TH - 1 - y;
  const half = 2 * (yy + 1);
  return x >= TW / 2 - half && x < TW / 2 + half;
}

function tile(colorAt) {
  const c = new Canvas(TW, TH);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) if (inDiamond(x, y)) c.set(x, y, colorAt(x, y));
  return c;
}

function grassTile(variant) {
  const base = hex('#7cc04a');
  const light = hex('#93d35b');
  const dark = hex('#67a83c');
  const c = tile(() => {
    const r = rand();
    return r < 0.07 ? dark : r < 0.13 ? light : base;
  });
  // Grashalme
  const blades = variant === 0 ? 10 : 14;
  for (let n = 0; n < blades; n++) {
    const x = randInt(6, 57);
    const y = randInt(4, 28);
    if (!inDiamond(x, y) || !inDiamond(x, y - 2)) continue;
    c.paint(x, y, hex('#4f8a2f'));
    c.paint(x, y - 1, hex('#5e9c36'));
    c.paint(x + (rand() < 0.5 ? -1 : 1), y - 2, hex('#a8e06a'));
  }
  // kleine Wiesenblümchen
  if (variant === 2) {
    for (let n = 0; n < 3; n++) {
      const x = randInt(12, 50);
      const y = randInt(8, 24);
      const col = n % 2 ? hex('#ffffff') : hex('#ffe26a');
      c.paint(x, y, col);
      c.paint(x + 1, y, col);
    }
  }
  return c;
}

function pathTile() {
  const base = hex('#dcbb7e');
  const c = tile(() => {
    const r = rand();
    return r < 0.08 ? hex('#c9a466') : r < 0.14 ? hex('#ead39d') : base;
  });
  for (let n = 0; n < 7; n++) {
    const x = randInt(8, 55);
    const y = randInt(5, 26);
    c.paint(x, y, hex('#b08c56'));
    c.paint(x + 1, y, hex('#a07e4a'));
    c.paint(x, y - 1, hex('#f2e0b4'));
  }
  return c;
}

function soilTile() {
  // Furchen als globales Muster, damit benachbarte Fliesen nahtlos passen
  return tile((x, y) => {
    const k = (((x + 2 * y) % 16) + 16) % 16;
    if (k < 4) return hex('#6b4224');
    if (k === 4) return hex('#a3703f');
    return rand() < 0.08 ? hex('#7a4e2b') : hex('#8c5a32');
  });
}

function waterTile() {
  const c = tile((x, y) => {
    const r = rand();
    return r < 0.06 ? hex('#3f8fcf') : hex('#4ea3dc');
  });
  for (let n = 0; n < 6; n++) {
    const x = randInt(10, 50);
    const y = randInt(6, 25);
    const len = randInt(3, 6);
    for (let i = 0; i < len; i++) c.paint(x + i, y, hex('#8fd2f5'));
    c.paint(x + 1, y - 1, hex('#d8f2ff'));
  }
  return c;
}

// Fischteich: türkiseres Wasser mit Seerosen, in zwei Varianten
function fishpondTile(variant) {
  const c = tile(() => (rand() < 0.06 ? hex('#2f9fb0') : hex('#3fb3c4')));
  for (let n = 0; n < 4; n++) {
    const x = randInt(12, 50);
    const y = randInt(7, 24);
    for (let i = 0; i < 4; i++) c.paint(x + i, y, hex('#9ee3ec'));
  }
  const pads = variant ? [[22, 12], [42, 20]] : [[30, 18]];
  for (const [x, y] of pads) {
    c.ellipse(x, y, 6, 3.5, hex('#3f8a2f'), true);
    c.ellipse(x - 1, y - 0.5, 4.5, 2.5, hex('#5fae3c'), true);
    c.line(x, y, x + 5, y - 1, hex('#3fb3c4')); // Kerbe im Blatt
  }
  if (variant) {
    c.rect(41, 18, 3, 2, hex('#f29ac0'));
    c.set(42, 17, hex('#ffd1e6'));
  }
  return c;
}

// ---------- Objekte ----------

// Laub aus mehreren Kreisen, mit Licht von oben links
function foliage(c, blobs, colors) {
  const [dark, mid, light, highlight] = colors.map((s) => hex(s));
  for (const [x, y, r] of blobs) c.circle(x, y, r, dark);
  for (const [x, y, r] of blobs) c.circle(x - 1.5, y - 2.5, r - 2, mid, true);
  for (const [x, y, r] of blobs) if (r > 7) c.circle(x - 3.5, y - 5, r - 6, light, true);
  for (const [x, y, r] of blobs) if (r > 10) c.circle(x - 4.5, y - 6.5, r - 9, highlight, true);
  // Blätter-Struktur
  for (let n = 0; n < blobs.length * 10; n++) {
    const [bx, by, br] = blobs[n % blobs.length];
    const x = Math.round(bx + (rand() * 2 - 1) * br * 0.8);
    const y = Math.round(by + (rand() * 2 - 1) * br * 0.8);
    c.paint(x, y, rand() < 0.5 ? dark : light);
    c.paint(x + 1, y, mid);
  }
}

function withShadow(w, h, sx, sy, rx, ry, obj) {
  const c = new Canvas(w, h);
  c.ellipse(sx, sy, rx, ry, SHADOW);
  c.draw(obj, 0, 0);
  return c;
}

function tree() {
  const o = new Canvas(64, 96);
  // Stamm
  o.rect(28, 56, 8, 26, hex('#7a4e2d'));
  o.rect(28, 56, 2, 26, hex('#996339'));
  o.rect(34, 56, 2, 26, hex('#5e3a20'));
  o.rect(26, 79, 3, 3, hex('#7a4e2d'));
  o.rect(35, 80, 3, 2, hex('#5e3a20'));
  foliage(
    o,
    [
      [32, 34, 20],
      [17, 44, 13],
      [47, 44, 13],
      [23, 24, 13],
      [41, 24, 13],
      [32, 50, 13],
      [32, 15, 11],
    ],
    ['#2f7a35', '#3f9440', '#58ad4c', '#7cc85e'],
  );
  // ein paar Äpfel
  for (const [x, y] of [[20, 40], [42, 30], [36, 48], [27, 28]]) {
    o.rect(x, y, 3, 3, hex('#d8382f'));
    o.set(x, y, hex('#ff8a7a'));
  }
  o.outline(INK);
  return withShadow(64, 96, 32, 82, 20, 7, o);
}

function bush() {
  const o = new Canvas(48, 40);
  foliage(
    o,
    [
      [24, 18, 11],
      [13, 24, 8],
      [35, 24, 8],
      [24, 27, 9],
    ],
    ['#2f7a35', '#3f9440', '#58ad4c', '#7cc85e'],
  );
  for (const [x, y] of [[17, 22], [29, 17], [32, 27], [22, 29]]) {
    o.rect(x, y, 2, 2, hex('#e85d8a'));
  }
  o.outline(INK);
  return withShadow(48, 40, 24, 33, 15, 5, o);
}

function flowers(petal, petalLight, second) {
  const o = new Canvas(40, 32);
  const spots = [[8, 20], [16, 15], [24, 21], [31, 16], [19, 25], [12, 27], [28, 27]];
  spots.forEach(([x, y], i) => {
    const h = randInt(4, 7);
    o.line(x, y, x, y - h, hex('#3f8a2f'));
    o.set(x + 1, y - 2, hex('#5fae3c'));
    o.set(x - 1, y - 3, hex('#5fae3c'));
    const col = i % 3 === 2 ? hex(second) : hex(petal);
    const top = y - h - 1;
    o.rect(x - 1, top - 1, 3, 3, col);
    o.set(x, top - 2, col);
    o.set(x, top + 2, col);
    o.set(x - 2, top, col);
    o.set(x + 2, top, col);
    o.set(x - 1, top - 1, hex(petalLight));
    o.set(x, top, hex('#f5b52a'));
  });
  o.outline(hex('#2f4f1f'));
  return o;
}

function rock() {
  const o = new Canvas(32, 24);
  o.ellipse(16, 14, 11, 7.5, hex('#7d7c72'));
  o.ellipse(15, 12.5, 9.5, 6, hex('#9c9b90'), true);
  o.ellipse(12.5, 10.5, 5, 3, hex('#bdbcb1'), true);
  o.set(19, 15, hex('#6a695f'));
  o.set(20, 15, hex('#6a695f'));
  o.set(8, 14, hex('#6a695f'));
  o.outline(hex('#3b3a33'));
  return withShadow(32, 24, 16, 19, 12, 4, o);
}

// Zaunstück entlang der tx-Achse; Kachelmitte liegt bei (32, 44)
function fence() {
  const o = new Canvas(64, 64);
  const a = [16, 36];
  const b = [48, 52];
  for (const h of [6, 13]) {
    o.line(a[0], a[1] - h, b[0], b[1] - h, hex('#c8935a'));
    o.line(a[0], a[1] - h + 1, b[0], b[1] - h + 1, hex('#a8743f'));
    o.line(a[0], a[1] - h + 2, b[0], b[1] - h + 2, hex('#8a5a30'));
  }
  for (const [x, y] of [a, b]) {
    o.rect(x - 2, y - 18, 4, 19, hex('#b07a42'));
    o.rect(x - 2, y - 18, 1, 19, hex('#d29c62'));
    o.rect(x + 1, y - 18, 1, 19, hex('#8a5a30'));
    o.rect(x - 2, y - 18, 4, 1, hex('#e0b07a'));
  }
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.line(a[0], a[1] + 1, b[0], b[1] + 1, SHADOW);
  c.line(a[0], a[1] + 2, b[0], b[1] + 2, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// ---------- Alles erzeugen ----------

// Torflügel entlang der tx-Achse, gleiche Geometrie wie der Zaun
function gate() {
  const o = new Canvas(64, 64);
  const a = [16, 36];
  const b = [48, 52];
  const at = (t, h) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t - h)];
  // senkrechte Latten
  for (let t = 0.06; t < 1; t += 0.125) {
    const [x, y] = at(t, 0);
    o.rect(x - 1, y - 17, 3, 16, hex('#e6c48e'));
    o.rect(x + 1, y - 17, 1, 16, hex('#c49a62'));
  }
  // Querbalken oben und unten
  for (const h of [3, 16]) {
    const [x0, y0] = at(0, h);
    const [x1, y1] = at(1, h);
    for (let k = 0; k < 3; k++) o.line(x0, y0 + k, x1, y1 + k, k === 0 ? hex('#f2d9a8') : k === 1 ? hex('#d6a86a') : hex('#a8743f'));
  }
  // Diagonale Strebe
  const [dx0, dy0] = at(0.04, 4);
  const [dx1, dy1] = at(0.96, 15);
  for (let k = 0; k < 2; k++) o.line(dx0, dy0 + k, dx1, dy1 + k, k === 0 ? hex('#d6a86a') : hex('#a8743f'));
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.line(a[0], a[1] + 1, b[0], b[1] + 1, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Kescher (doppelte Auflösung, wird im Spiel halb so groß angezeigt). Stielende unten links bei (6, 58)
function net() {
  const cx = 42, cy = 16, rx = 17, ry = 9; // Ring, leicht schräg von oben gesehen
  const inRing = (x, y, sx, sy) => ((x + 0.5 - cx) / sx) ** 2 + ((y + 0.5 - cy) / sy) ** 2 <= 1;

  // Netzbeutel, der unter dem Ring durchhängt
  const bag = new Canvas(64, 64);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const inBag = inRing(x, y, rx - 1, ry - 1) || (y > cy && ((x + 0.5 - (cx + 3)) / 13) ** 2 + ((y + 0.5 - (cy + 6)) / 15) ** 2 <= 1);
      if (!inBag) continue;
      const mesh = (x + y) % 4 === 0 || (((x - y) % 4) + 4) % 4 === 0;
      bag.set(x, y, mesh ? hex('#f4f4ee', 230) : hex('#ffffff', 60));
    }
  }
  bag.outline(hex('#8f9a8a'));

  // Stiel und Ring
  const o = new Canvas(64, 64);
  for (let k = -1; k <= 1; k++) o.line(6 + k, 58, 29 + k, 24, k < 0 ? hex('#c8935a') : k === 0 ? hex('#a8743f') : hex('#7a4e2d'));
  o.rect(4, 55, 5, 5, hex('#5e3a20')); // Griff
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      if (inRing(x, y, rx, ry) && !inRing(x, y, rx - 2.5, ry - 2.5)) o.set(x, y, y < cy ? hex('#c49a62') : hex('#8a5a30'));
    }
  }
  o.outline(INK);

  const c = new Canvas(64, 64);
  c.draw(bag, 0, 0);
  c.draw(o, 0, 0);
  return c;
}

// Aufgerolltes Lasso (doppelte Auflösung)
function lasso() {
  const o = new Canvas(64, 64);
  const ring = (cx, cy, rx, ry, col) => {
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const outer = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
        const inner = ((x + 0.5 - cx) / (rx - 3)) ** 2 + ((y + 0.5 - cy) / (ry - 3)) ** 2;
        if (outer <= 1 && inner > 1) o.set(x, y, y < cy ? hex('#e3c07f') : col);
      }
    }
  };
  // drei Windungen, leicht versetzt
  ring(30, 30, 22, 17, hex('#b98a4a'));
  ring(32, 32, 20, 15, hex('#a8793c'));
  ring(34, 34, 18, 13, hex('#c9995a'));
  // herabhängendes Seilende mit Knoten
  for (let k = 0; k < 3; k++) o.line(48 + k, 42, 54 + k, 60, k === 1 ? hex('#c9995a') : hex('#8a5a30'));
  o.rect(52, 58, 6, 4, hex('#8a5a30'));
  // Seilstruktur: kleine schräge Striche
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if ((x + 2 * y) % 6 === 0) o.paint(x, y, hex('#8a5a30'));
  o.outline(INK);
  return o;
}

// Werkzeughütte auf 2x2 Kacheln, nach vorne rechts offen. Mitte der Grundfläche bei (72, 90)
// style: 'meadow' (Bretter und rote Ziegel) oder 'log' (dicke Baumstämme und bemoostes Schindeldach)
function shed(style = 'meadow') {
  const rustic = style === 'log';
  const cx = 72, cy = 90;
  const H = 40; // Wandhöhe
  const R = 28; // Dachhöhe über der Wand
  const L = [cx - 64, cy], T = [cx, cy - 32], Rt = [cx + 64, cy], B = [cx, cy + 32];
  const up = ([x, y], h) => [x, y - h];
  const ridgeBack = [cx - 32, cy - 16 - H - R];
  const ridgeFront = [cx + 32, cy + 16 - H - R];

  const o = new Canvas(144, 128);
  // Rückseitige Dachfläche (größtenteils verdeckt)
  o.poly([up(T, H), up(Rt, H), ridgeFront, ridgeBack], hex(rustic ? '#4f3c2c' : '#a8432f'));
  // Linke Wand (eigene Ebene, damit das Muster nur auf der Wand landet)
  const wall = new Canvas(144, 128);
  wall.poly([L, B, up(B, H), up(L, H)], hex('#b07a42'));
  if (rustic) {
    // waagerechte, runde Stämme: Höhe über der Grundlinie bestimmt den Stamm und die Schattierung
    const LOG = 8;
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 144; x++) {
        const h = L[1] + (x - L[0]) * 0.5 - y;
        const p = ((Math.floor(h) % LOG) + LOG) % LOG;
        const col = p === 0 ? '#3a2414' : p <= 2 ? '#6b4224' : p <= 4 ? '#8a5a30' : p <= 6 ? '#a8743f' : '#7a4e2d';
        wall.paint(x, y, hex(col));
      }
    }
    o.draw(wall, 0, 0);
    // Stammenden an den Ecken
    for (let h = LOG / 2; h < H; h += LOG) {
      for (const P of [L, B]) {
        o.ellipse(P[0], P[1] - h, 3.5, 4, hex('#d8b07a'));
        o.ellipse(P[0], P[1] - h, 1.5, 2, hex('#a8743f'));
      }
    }
  } else {
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 144; x++) {
        if (x % 6 === 0) wall.paint(x, y, hex('#8a5a30'));
        else if (x % 6 === 1) wall.paint(x, y, hex('#c8935a'));
      }
    }
    wall.poly([L, B, up(B, 4), up(L, 4)], hex('#7a4e2d'), true); // Sockel
    o.draw(wall, 0, 0);
  }
  // Offene Vorderseite: dunkles Inneres mit Regal
  o.poly([B, Rt, up(Rt, H), up(B, H)], hex('#3a2414'));
  o.poly([up(B, 18), up(Rt, 18), up(Rt, 21), up(B, 21)], hex('#a8743f'));
  for (const [x, h, col] of [[cx + 14, 21, '#9aa0a8'], [cx + 24, 21, '#c49a62'], [cx + 40, 21, '#6aa84f']]) {
    const y = cy + 32 - (x - cx) / 2 - h;
    o.rect(x - 3, y - 7, 6, 7, hex(col)); // Töpfe und Kisten auf dem Regal
  }
  // Pfosten und Querbalken der Öffnung (im Wald dicke Stämme)
  const postW = rustic ? 6 : 3;
  const postCol = hex(rustic ? '#8a5a30' : '#c8935a');
  for (const P of [B, Rt]) o.rect(P[0] - (P === Rt ? postW : 0), P[1] - H, postW, H + 1, postCol);
  if (rustic) for (const P of [B, Rt]) o.rect(P[0] - (P === Rt ? postW : 0) + 1, P[1] - H, 2, H + 1, hex('#a8743f'));
  o.poly([up(B, H - postW), up(Rt, H - postW), up(Rt, H), up(B, H)], postCol);
  // Giebel über der Öffnung
  o.poly([up(B, H), up(Rt, H), ridgeFront], hex(rustic ? '#7a4e2d' : '#b07a42'));
  o.poly([up(B, H), up(Rt, H), ridgeFront], hex(rustic ? '#8a5a30' : '#c8935a'), true);
  // Vordere Dachfläche: rote Ziegel bzw. dunkle, bemooste Holzschindeln
  const roof = [[L[0] - 4, L[1] - H + 2], [B[0], B[1] - H + 4], ridgeFront, [ridgeBack[0] - 4, ridgeBack[1]]];
  const tiles = new Canvas(144, 128);
  tiles.poly(roof, hex(rustic ? '#6b5340' : '#c8553d'));
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 144; x++) {
      const k = (((Math.floor(y - 0.5 * x) % 7) + 7) % 7);
      if (k === 0) tiles.paint(x, y, hex(rustic ? '#3f2f22' : '#9c3a28'));
      else if (k === 1) tiles.paint(x, y, hex(rustic ? '#8a6e50' : '#e07a5f'));
      else if (rustic && (x * 7 + Math.floor(y - 0.5 * x) * 3) % 11 === 0) tiles.paint(x, y, hex('#4f3c2c')); // Schindelfugen
    }
  }
  if (rustic) {
    // Moosflecken
    for (const [mx, my, r] of [[30, 50, 6], [55, 62, 5], [44, 38, 4], [78, 44, 5], [20, 62, 4]]) {
      tiles.ellipse(mx, my, r, r * 0.6, hex('#5f8a3a'), true);
      tiles.ellipse(mx - 1, my - 1, r * 0.5, r * 0.3, hex('#7aa84c'), true);
    }
  }
  tiles.line(roof[2][0], roof[2][1], roof[3][0], roof[3][1], hex(rustic ? '#a8865e' : '#e89a7f')); // First
  o.draw(tiles, 0, 0);
  o.outline(INK);

  const c = new Canvas(144, 128);
  c.poly([[L[0] - 4, L[1] + 2], [T[0], T[1]], [Rt[0] + 4, Rt[1] + 2], [B[0], B[1] + 6]], SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Holzschild mit Fisch; Fuß des Pfostens bei (20, 54)
function signFish() {
  const o = new Canvas(40, 56);
  o.rect(18, 26, 4, 29, hex('#8a5a30'));
  o.rect(18, 26, 1, 29, hex('#a8743f'));
  o.rect(3, 6, 34, 22, hex('#c8935a'));
  o.rect(3, 6, 34, 2, hex('#e0b07a'));
  o.rect(3, 26, 34, 2, hex('#8a5a30'));
  // Fisch auf dem Schild
  o.ellipse(18, 17, 9, 5.5, hex('#f08a3c'));
  o.ellipse(16, 15.5, 5, 2.5, hex('#ffb070'), true);
  o.poly([[26, 17], [33, 11], [33, 23]], hex('#e0702a'));
  o.rect(12, 15, 2, 2, hex('#2b1d14'));
  o.outline(INK);
  const c = new Canvas(40, 56);
  c.ellipse(20, 54, 8, 2.5, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// ---------- Wald ----------

function forestGrass(variant) {
  const c = tile(() => {
    const r = rand();
    return r < 0.1 ? hex('#3f7a2c') : r < 0.16 ? hex('#5f9c40') : hex('#4c8a34');
  });
  // Laub und Moos
  for (let n = 0; n < 10 + variant * 4; n++) {
    const x = randInt(8, 55);
    const y = randInt(5, 26);
    const col = [hex('#8a6a30'), hex('#b07a3a'), hex('#c8923f'), hex('#2f6a26')][randInt(0, 3)];
    c.paint(x, y, col);
    c.paint(x + 1, y, col);
  }
  for (let n = 0; n < 8; n++) {
    const x = randInt(6, 57);
    const y = randInt(4, 28);
    c.paint(x, y, hex('#2f6326'));
    c.paint(x, y - 1, hex('#3f7a2c'));
  }
  return c;
}

function forestPath() {
  const c = tile(() => {
    const r = rand();
    return r < 0.1 ? hex('#8a6c44') : r < 0.16 ? hex('#b39467') : hex('#9e7f55');
  });
  for (let n = 0; n < 8; n++) {
    const x = randInt(8, 55);
    const y = randInt(5, 26);
    c.paint(x, y, hex('#6e5434'));
    c.paint(x + 1, y, hex('#c8923f'));
  }
  return c;
}

// Tanne aus drei Stufen; Fuß des Stamms bei (32, 100)
function pine() {
  const o = new Canvas(64, 112);
  o.rect(29, 84, 6, 17, hex('#6b4224'));
  o.rect(29, 84, 2, 17, hex('#8a5a30'));
  // Spitze, linker Rand, Unterkante, rechter Rand jeder Stufe (von unten nach oben)
  const tiers = [
    [32, 40, 6, 92, 58],
    [32, 22, 10, 72, 54],
    [32, 6, 15, 50, 49],
  ];
  for (const [tipX, tipY, left, baseY, right] of tiers) {
    const t = new Canvas(64, 112);
    t.poly([[tipX, tipY], [right + 2, baseY], [tipX, baseY + 4], [left - 2, baseY]], hex('#2f6b3a'));
    for (let y = 0; y < 112; y++) {
      for (let x = 0; x < 64; x++) {
        if (x > tipX + 1) t.paint(x, y, hex('#245a30'));
        else if (x < tipX - 6 && (x + y) % 5 === 0) t.paint(x, y, hex('#4a8a4a'));
      }
    }
    for (let x = left; x < right; x += 6) t.paint(x, baseY - 1, hex('#1f4a28')); // Zweigspitzen
    o.draw(t, 0, 0);
  }
  o.outline(INK);
  return withShadow(64, 112, 32, 100, 18, 6, o);
}

// Dunkler, dichter Laubbaum; Fuß des Stamms bei (32, 90)
function darkTree() {
  const o = new Canvas(64, 104);
  o.rect(28, 62, 8, 29, hex('#5e3a20'));
  o.rect(28, 62, 2, 29, hex('#7a4e2d'));
  o.rect(34, 62, 2, 29, hex('#4a2e18'));
  o.rect(25, 87, 4, 4, hex('#5e3a20'));
  o.rect(35, 88, 4, 3, hex('#4a2e18'));
  foliage(
    o,
    [
      [32, 38, 22],
      [15, 50, 13],
      [49, 50, 13],
      [21, 26, 14],
      [43, 26, 14],
      [32, 56, 14],
      [32, 14, 12],
    ],
    ['#1f5a2a', '#2c6e34', '#3f8442', '#5a9c52'],
  );
  o.outline(INK);
  return withShadow(64, 104, 32, 90, 22, 7, o);
}

// Dichter Waldbusch mit Blaubeeren; Mitte bei (28, 36)
function darkBush() {
  const o = new Canvas(56, 44);
  foliage(
    o,
    [
      [28, 20, 12],
      [15, 26, 9],
      [41, 26, 9],
      [28, 30, 10],
      [20, 16, 8],
      [37, 16, 8],
    ],
    ['#1f5a2a', '#2c6e34', '#3f8442', '#5a9c52'],
  );
  for (const [x, y] of [[19, 24], [33, 19], [37, 29], [25, 31], [28, 14]]) {
    o.rect(x, y, 2, 2, hex('#4a5ad8'));
    o.set(x, y, hex('#8a9af0'));
  }
  o.outline(INK);
  return withShadow(56, 44, 28, 36, 18, 6, o);
}

// Umgestürzter Stamm entlang der tx-Achse (gleiche Geometrie wie der Zaun), Kachelmitte bei (32, 44)
function log() {
  const o = new Canvas(64, 64);
  const a = [14, 35];
  const b = [50, 53];
  for (let k = -5; k <= 5; k++) {
    const col = k < -2 ? hex('#a8743f') : k < 2 ? hex('#8a5a30') : hex('#6b4224');
    o.line(a[0], a[1] - 6 + k, b[0], b[1] - 6 + k, col);
  }
  // Rindenstriche
  for (let t = 0.1; t < 0.95; t += 0.14) {
    const x = Math.round(a[0] + (b[0] - a[0]) * t);
    const y = Math.round(a[1] + (b[1] - a[1]) * t) - 6;
    o.line(x, y - 4, x + 3, y - 2, hex('#5e3a20'));
  }
  // Schnittfläche vorne mit Jahresringen
  o.ellipse(b[0], b[1] - 6, 4, 6, hex('#e0b07a'));
  o.ellipse(b[0], b[1] - 6, 2.5, 4, hex('#c8935a'));
  o.ellipse(b[0], b[1] - 6, 1, 1.5, hex('#a8743f'));
  // etwas Moos oben
  for (let t = 0.2; t < 0.7; t += 0.08) {
    const x = Math.round(a[0] + (b[0] - a[0]) * t);
    const y = Math.round(a[1] + (b[1] - a[1]) * t) - 11;
    o.rect(x, y, 3, 2, hex('#5f9c40'));
  }
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.line(a[0], a[1] + 1, b[0], b[1] + 1, SHADOW);
  c.line(a[0], a[1] + 2, b[0], b[1] + 2, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Farn; Mitte bei (20, 24)
function fern() {
  const o = new Canvas(40, 32);
  const fronds = [[-18, -5], [-13, -13], [-5, -19], [5, -19], [13, -13], [18, -5], [-8, -8], [8, -8]];
  for (const [dx, dy] of fronds) {
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // leicht gebogener Wedel mit Fiederblättchen
      const x = Math.round(20 + dx * t);
      const y = Math.round(26 + dy * t + 5 * t * t);
      o.rect(x, y, 2, 1, hex('#3f8a3a'));
      if (i % 2 === 0 && i > 0 && i < steps) {
        const s = Math.round(3 * (1 - t)) + 1; // Blättchen werden zur Spitze kleiner
        o.rect(x - s, y - 1, s, 1, hex('#5fae4c'));
        o.rect(x + 2, y - 1, s, 1, hex('#4f9c40'));
      }
    }
  }
  o.outline(hex('#1f4a1f'));
  return o;
}

// Zwei Fliegenpilze; Mitte bei (12, 18)
function mushroom() {
  const o = new Canvas(24, 24);
  for (const [x, y, s] of [[9, 18, 1], [16, 19, 0.75]]) {
    o.rect(x - 1, y - 5 * s, 3, 5 * s, hex('#f4ecd8'));
    o.ellipse(x + 0.5, y - 5 * s, 5 * s, 3.5 * s, hex('#d8382f'));
    o.set(x - 1, y - 6 * s, hex('#ffffff'));
    o.set(x + 2, y - 5 * s - 1, hex('#ffffff'));
  }
  o.outline(INK);
  return o;
}

// Wegweiser mit drei Pfeilbrettern; Fuß des Pfostens bei (24, 60)
// Die Bretter sind breit genug für eine Beschriftung, die das Spiel darüberlegt
// (Brettmitten relativ zum Fuß: oben +13/-47, Mitte -13/-33, unten +13/-19; siehe GardenScene)
function signpost() {
  const o = new Canvas(80, 64);
  o.rect(38, 4, 4, 57, hex('#8a5a30'));
  o.rect(38, 4, 1, 57, hex('#a8743f'));
  const board = (y, toRight, len) => {
    const x0 = toRight ? 40 : 40 - len;
    const x1 = toRight ? 40 + len : 40;
    const tip = toRight ? x1 + 6 : x0 - 6;
    const base = toRight ? x0 : x1; // Seite am Pfosten
    const end = toRight ? x1 : x0; // Seite mit der Pfeilspitze
    o.poly([[base, y], [end, y], [tip, y + 5], [end, y + 10], [base, y + 10]], hex('#e0b57a'));
    o.rect(Math.min(x0, x1) + 1, y + 1, len - 2, 1, hex('#f2d4a0'));
    o.rect(Math.min(x0, x1) + 1, y + 9, len - 2, 1, hex('#b8874c'));
  };
  board(8, true, 26);
  board(22, false, 26);
  board(36, true, 26);
  o.outline(INK);
  const c = new Canvas(80, 64);
  c.ellipse(40, 60, 9, 2.5, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Falle: Käfig mit Karotte als Köder (doppelte Auflösung). Boden bei (32, 52).
function trap() {
  const o = new Canvas(64, 56);
  o.rect(6, 46, 52, 7, hex('#8a5a30')); // Bodenbrett
  o.rect(6, 46, 52, 2, hex('#a8743f'));
  o.rect(8, 18, 48, 3, hex('#7a8088')); // Deckel
  o.rect(8, 18, 48, 1, hex('#aab0b8'));
  for (let x = 8; x <= 54; x += 6) o.rect(x, 18, 2, 29, hex('#6a7078')); // Gitterstäbe
  o.rect(8, 32, 48, 2, hex('#6a7078')); // Querstab
  // Karotte obendrauf
  o.poly([[24, 16], [40, 12], [40, 18]], hex('#f08a2c'));
  o.line(30, 15, 31, 17, hex('#c86a1a'));
  o.line(35, 14, 36, 16, hex('#c86a1a'));
  for (const [dx, dy] of [[0, -4], [3, -5], [2, -2]]) o.line(40, 15, 40 + dx, 15 + dy, hex('#4f9c40'));
  o.outline(INK);
  const c = new Canvas(64, 56);
  c.ellipse(32, 52, 26, 4, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

const fenceX = fence();
const sprites = {
  'grass0.png': grassTile(0),
  'grass1.png': grassTile(1),
  'grass2.png': grassTile(2),
  'path.png': pathTile(),
  'soil.png': soilTile(),
  'water.png': waterTile(),
  'tree.png': tree(),
  'bush.png': bush(),
  'flowers_red.png': flowers('#e8483f', '#ff9a8c', '#f2f2f2'),
  'flowers_yellow.png': flowers('#f5d142', '#fff3a8', '#c77ce8'),
  'rock.png': rock(),
  'fence_x.png': fenceX,
  'fence_y.png': fenceX.flipped(),
  'gate_x.png': gate(),
  'shed.png': shed(),
  'sign_fish.png': signFish(),
  'fishpond0.png': fishpondTile(0),
  'fishpond1.png': fishpondTile(1),
  'net.png': net(),
  'lasso.png': lasso(),
  // Wald (hinten angehängt, damit sich der Zufall der älteren Grafiken nicht verschiebt)
  'fgrass0.png': forestGrass(0),
  'fgrass1.png': forestGrass(1),
  'fgrass2.png': forestGrass(2),
  'forest_path.png': forestPath(),
  'pine.png': pine(),
  'dark_tree.png': darkTree(),
  'dark_bush.png': darkBush(),
  'log.png': log(),
  'fern.png': fern(),
  'mushroom.png': mushroom(),
  'signpost.png': signpost(),
  'shed_log.png': shed('log'),
  'trap.png': trap(),
};

for (const [name, canvas] of Object.entries(sprites)) {
  canvas.save(path.join(OUT, name));
  console.log(`  ${name}  (${canvas.w}x${canvas.h})`);
}

if (process.env.PREVIEW) {
  const list = Object.values(sprites);
  const w = list.reduce((s, c) => s + c.w + 8, 8);
  const h = Math.max(...list.map((c) => c.h)) + 16;
  const p = new Canvas(w, h);
  p.rect(0, 0, w, h, hex('#7cc04a'));
  let x = 8;
  for (const c of list) {
    p.draw(c, x, 8);
    x += c.w + 8;
  }
  p.scaled(3).save(process.env.PREVIEW);
  console.log(`Vorschau: ${process.env.PREVIEW}`);
}
