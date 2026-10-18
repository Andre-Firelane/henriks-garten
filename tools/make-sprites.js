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
const meshX = meshFence();
const netX = netFence();
// Gemeinsame Geometrie der Zaunstücke entlang der tx-Achse (Kachelmitte bei 32/44)
const ZA = [16, 36];
const ZB = [48, 52];
const chainX = chainFence();
const chainGateX = chainGate();
const glassDoorX = glassDoor(false);
const glassFlapX = glassDoor(true);
const netGateX = netGate();
// Wildzaun der Savanne: höher, daher 16 Pixel nach unten versetzt (siehe tallFence)
const TALL_DY = 16;
const TA = [ZA[0], ZA[1] + TALL_DY];
const TB = [ZB[0], ZB[1] + TALL_DY];
const tallX = tallFence();
const tallGateX = tallGate();
// Tierarten mit Fußspur-Bild (muss vor dem sprites-Objekt stehen)
// ---------- Begehbare Hütten ----------
// Wände laufen wie die Zäune durch die Mitten der Randkacheln (Fläche 64x80, Kachelmitte bei 32/60).
const HUT_A = [16, 52];
const HUT_B = [48, 68];
const HUT_H = 44; // Wandhöhe
const HUT_STYLES = {
  meadow: { wall: '#c8935a', dark: '#8a5a30', light: '#e0b07a', cap: '#7a4e2d' },
  forest: { wall: '#8a5a30', dark: '#4f3422', light: '#a8743f', cap: '#3f2a1a' },
  savanna: { wall: '#d4bc84', dark: '#a08a58', light: '#e8d8a8', cap: '#8a6a40' },
  asia: { wall: '#c0392b', dark: '#7a1e18', light: '#e05a48', cap: '#2b2b2b' },
  // Katzenhaus im Tierpark: große Glasfronten in einem hellen Holzrahmen, damit man die Katzen von außen sieht
  cathouse: { wall: '#bfe4f0', dark: '#a8743f', light: '#f4ead8', cap: '#8a5a30', glass: true },
};

// Wandstück entlang tx (die Version entlang ty ist gespiegelt); door: Tür statt Wand
function hutWall(style, door = false) {
  const s = HUT_STYLES[style];
  const a = HUT_A, b = HUT_B, H = HUT_H;
  const up = ([x, y], h) => [x, y - h];
  const at = (t, h) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - h];
  const w = new Canvas(64, 80);
  w.poly([a, b, up(b, H), up(a, H)], hex(s.wall, s.glass ? 95 : 255)); // Glas ist durchsichtig
  for (let y = 0; y < 80; y++) {
    for (let x = 0; x < 64; x++) {
      const h = a[1] + (x - a[0]) * 0.5 - y; // Höhe über der Grundlinie
      if (style === 'meadow' && x % 6 === 0) w.paint(x, y, hex(s.dark)); // senkrechte Bretter
      if (style === 'meadow' && x % 6 === 1) w.paint(x, y, hex(s.light));
      if (style === 'forest') {
        const p = ((Math.floor(h) % 8) + 8) % 8; // runde, liegende Stämme
        w.paint(x, y, hex(p === 0 ? '#2f1e12' : p <= 2 ? '#6b4224' : p <= 5 ? s.wall : s.light));
      }
      if (style === 'savanna' && x % 16 === 0) w.paint(x, y, hex(s.dark)); // Nähte der Plane
      if (s.glass) {
        // Rahmen: Sockel, senkrechte Sprossen und ein Querholz; dazwischen große Scheiben mit Lichtreflex
        const sprosse = (((x - a[0]) % 16) + 16) % 16 < 2;
        if (h < 6 || sprosse || (h > 24 && h < 27)) w.paint(x, y, hex(sprosse ? s.light : '#e8dcc4'));
        else if ((x + Math.floor(h)) % 11 === 0 && h > 30) w.paint(x, y, hex('#ffffff', 160)); // Spiegelung
      }
      if (style === 'asia' && (h < 4 || (h > 14 && h < 30 && x % 16 > 3 && x % 16 < 13))) {
        w.paint(x, y, hex(h < 4 ? '#5a1810' : '#f2e2c0')); // Sockel und Papierfenster
      }
    }
  }
  w.poly([up(a, H), up(b, H), up(b, H - 3), up(a, H - 3)], hex(s.cap)); // obere Kante
  const o = new Canvas(64, 80);
  o.draw(w, 0, 0);
  if (door) {
    // Tür in der Mitte des Wandstücks
    const [x0, y0] = at(0.2, 0);
    const [x1, y1] = at(0.8, 0);
    const D = 34;
    o.poly([[x0, y0], [x1, y1], [x1, y1 - D], [x0, y0 - D]], hex(style === 'asia' ? '#2b2b2b' : '#6b4224'));
    o.poly([[x0 + 2, y0 - 2], [x1 - 2, y1 - 2], [x1 - 2, y1 - D + 3], [x0 + 2, y0 - D + 3]], hex(style === 'asia' ? '#c8962a' : '#a8743f'));
    const [kx, ky] = at(0.7, 16);
    o.rect(kx - 1, ky - 1, 2, 2, hex('#e8b84a')); // Türknauf
  }
  o.outline(INK);
  const c = new Canvas(64, 80);
  c.line(a[0], a[1] + 1, b[0], b[1] + 1, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

function hutPost(style) {
  const s = HUT_STYLES[style];
  const o = new Canvas(64, 80);
  const [x, y] = [32, 60];
  o.rect(x - 3, y - HUT_H - 2, 6, HUT_H + 3, hex(s.dark));
  o.rect(x - 3, y - HUT_H - 2, 2, HUT_H + 3, hex(s.light));
  o.outline(INK);
  return o;
}

// Dach über der ganzen Hütte (5x4 Kacheln): Walmdach, Stil wie die alten Hütten.
// Ankerpunkt: die obere Ecke der Grundfläche liegt im Bild bei (HUT_ROOF_OX, HUT_ROOF_OY).
const HUT_ROOF_OX = 184;
const HUT_ROOF_OY = 100;
function hutRoof(style, A = 5, B = 4, ov = 0.25) {
  const W = 384, Hc = 310;
  const P = (a, b, h = 0) => [HUT_ROOF_OX + (a - b) * 32, HUT_ROOF_OY + (a + b) * 16 - h];
  const H = HUT_H + 2;
  const R = style === 'asia' ? 46 : style === 'cathouse' ? 18 : 40; // Dachhöhe über der Traufe (Katzenhaus flach, damit man hineinsieht)
  // ov: Überstand in Kacheln
  const E = { t: P(-ov, -ov, H), r: P(A + ov, -ov, H), b: P(A + ov, B + ov, H), l: P(-ov, B + ov, H) };
  const R1 = P(B / 2, B / 2, H + R);
  const R2 = P(A - B / 2, B / 2, H + R);
  const colors = {
    meadow: ['#9c3a28', '#c8553d', '#e07a5f', '#7a2a1c'],
    forest: ['#4f3c2c', '#6b5340', '#8a6e50', '#3f2f22'],
    savanna: ['#b8a26c', '#dccb96', '#efe2b8', '#a08a58'],
    asia: ['#323b42', '#3f4a52', '#55636c', '#262e33'],
    cathouse: ['#3f6a8a', '#4f84a8', '#6aa0c4', '#2f5068'],
  }[style].map((c) => hex(c));
  const [back, front, lightC, line] = colors;
  const r = new Canvas(W, Hc);
  r.poly([E.t, E.r, R2, R1], back); // hintere Fläche
  r.poly([E.t, E.l, R1], back);
  r.poly([E.l, E.b, R2, R1], front); // vordere Fläche
  r.poly([E.r, E.b, R2], lightC); // Seite in der Sonne
  // Ziegelreihen bzw. Nähte parallel zur Traufe
  for (let y = 0; y < Hc; y++) for (let x = 0; x < W; x++) {
    if (style === 'savanna' ? (x * 50 + y * 32) % 640 < 30 : (((Math.floor(y - 0.5 * x) % 7) + 7) % 7) === 0) r.paint(x, y, line);
  }
  for (const [p, q] of [[E.l, R1], [E.b, R2], [E.t, R1], [E.r, R2], [R1, R2]]) r.line(p[0], p[1], q[0], q[1], line); // Grate
  r.line(E.l[0], E.l[1], E.b[0], E.b[1], line);
  r.line(E.b[0], E.b[1], E.r[0], E.r[1], line);
  if (style === 'forest') {
    for (const [mx, my, rr] of [[150, 160, 10], [200, 180, 8], [250, 150, 9], [120, 140, 7], [220, 120, 7]]) {
      r.ellipse(mx, my, rr, rr * 0.6, hex('#5f8a3a'), true);
      r.ellipse(mx - 1, my - 1, rr * 0.5, rr * 0.3, hex('#7aa84c'), true);
    }
  }
  const o = new Canvas(W, Hc);
  o.draw(r, 0, 0);
  if (style === 'asia') {
    // hochgezogene Ecken und goldene Spitze
    for (const [p, dx] of [[E.l, -1], [E.b, 0], [E.r, 1]]) {
      o.poly([[p[0] - 8 * (dx || 1), p[1] + 2], [p[0] + dx * 8, p[1] - 10], [p[0] + 8 * (dx || -1), p[1] + 2]], hex('#3f4a52'));
      o.rect(p[0] + dx * 8 - 1, p[1] - 12, 3, 3, hex('#e8b84a'));
    }
    const mx = (R1[0] + R2[0]) / 2, my = (R1[1] + R2[1]) / 2;
    o.rect(mx - 1, my - 18, 3, 18, hex('#c8962a'));
    for (const dy of [5, 10, 15]) o.rect(mx - 3, my - dy, 7, 2, hex('#e8b84a'));
  }
  if (style === 'savanna') {
    o.rect(R2[0] - 1, R2[1] - 16, 2, 16, hex('#6e4c2e')); // Fähnchen
    o.poly([[R2[0] + 1, R2[1] - 16], [R2[0] + 13, R2[1] - 12], [R2[0] + 1, R2[1] - 8]], hex('#3f8a3f'));
  }
  if (style === 'meadow') {
    // kleiner Schornstein
    o.rect(R1[0] + 20, R1[1] - 6, 10, 18, hex('#8a6a5a'));
    o.rect(R1[0] + 19, R1[1] - 8, 12, 3, hex('#5a4a40'));
  }
  o.outline(INK);
  return o;
}

// Kasten in Iso-Ansicht: Grundfläche a x b Kacheln um (cx, cy), Höhe h; Farben oben, links vorne, rechts vorne
function isoBox(o, cx, cy, a, b, h, top, left, right) {
  const P = (u, v, z = 0) => [cx + (u - v) * 32, cy + (u + v) * 16 - z];
  const [u0, u1, v0, v1] = [-a / 2, a / 2, -b / 2, b / 2];
  o.poly([P(u0, v1), P(u1, v1), P(u1, v1, h), P(u0, v1, h)], hex(left));
  o.poly([P(u1, v0), P(u1, v1), P(u1, v1, h), P(u1, v0, h)], hex(right));
  o.poly([P(u0, v0, h), P(u1, v0, h), P(u1, v1, h), P(u0, v1, h)], hex(top));
  return P;
}

// Schreibtisch mit Papieren und Lampe; Kachelmitte bei (32, 44)
function hutDesk() {
  const o = new Canvas(64, 64);
  const P = isoBox(o, 32, 44, 0.8, 0.5, 18, '#c8935a', '#8a5a30', '#a8743f');
  o.poly([P(-0.2, -0.15, 18.5), P(0.15, -0.15, 18.5), P(0.15, 0.1, 18.5), P(-0.2, 0.1, 18.5)], hex('#f4f0e0')); // Papier
  o.line(...P(-0.15, -0.05, 19), ...P(0.1, -0.05, 19), hex('#8a8a8a'));
  const [lx, ly] = P(0.3, -0.1, 18);
  o.rect(lx - 1, ly - 8, 2, 8, hex('#4a4a4a')); // Lampe
  o.poly([[lx - 5, ly - 8], [lx + 5, ly - 8], [lx + 2, ly - 13], [lx - 2, ly - 13]], hex('#3f8a3f'));
  o.outline(INK);
  return o;
}

// hoher Schrank mit zwei Türen; Kachelmitte bei (32, 80)
function hutCupboard() {
  const o = new Canvas(64, 96);
  const P = isoBox(o, 32, 80, 0.7, 0.45, 50, '#a8743f', '#8a5a30', '#6e4424');
  const [x0, y0] = P(-0.35, 0.225, 6);
  const [x1, y1] = P(0.35, 0.225, 6);
  o.line(x0, y0, x0, y0 - 40, hex('#5a3a20'));
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  o.line(mx, my, mx, my - 40, hex('#5a3a20')); // Türspalt
  o.rect(mx - 3, my - 22, 2, 2, hex('#e8b84a'));
  o.rect(mx + 2, my - 22 + 1, 2, 2, hex('#e8b84a'));
  o.outline(INK);
  return o;
}

// große Holzkiste mit Eisenbeschlägen; small: kleinere Kiste (Insel-Station). Kachelmitte bei (32, 44)
function hutChest(small = false) {
  const o = new Canvas(64, 64);
  const k = small ? 0.75 : 1;
  const P = isoBox(o, 32, 44, 0.75 * k, 0.5 * k, 22 * k, '#b07a42', '#8a5a30', '#6e4424');
  for (const t of [-0.25, 0.25]) {
    const u = t * 0.75 * k;
    o.line(...P(u, 0.25 * k, 0), ...P(u, 0.25 * k, 22 * k), hex('#5a5a5a')); // Eisenbänder
    o.line(...P(u, -0.25 * k, 22 * k), ...P(u, 0.25 * k, 22 * k), hex('#5a5a5a'));
  }
  o.line(...P(-0.375 * k, 0.25 * k, 12 * k), ...P(0.375 * k, 0.25 * k, 12 * k), hex('#5a3a20')); // Deckelspalt
  const [lx, ly] = P(0, 0.25 * k, 12 * k);
  o.rect(lx - 2, ly - 2, 4, 5, hex('#e8b84a')); // Schloss
  o.outline(INK);
  return o;
}

// ---------- Haupthaus im Tierpark: modern, große Glasfassaden zwischen Holzbalken ----------
// Wände sind höher als bei den Hütten (64 statt 44): Fläche 64x100, Kachelmitte bei 32/80 (20 Pixel über dem Rand)
const OFFICE_H = 64;
function officeWall(door = false) {
  const a = [16, 72], b = [48, 88], H = OFFICE_H;
  const at = (t, h) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - h];
  const o = new Canvas(64, 100);
  // Glas (durchscheinend), darin schräge Spiegelungen
  o.poly([a, b, [b[0], b[1] - H], [a[0], a[1] - H]], hex('#9fd0e4', 120));
  for (let y = 0; y < 100; y++) {
    for (let x = a[0]; x <= b[0]; x++) {
      const h = a[1] + (x - a[0]) * 0.5 - y; // Höhe über der Grundlinie
      if (h < 0 || h > H) continue;
      if ((x * 2 + Math.floor(h)) % 19 < 2 && h > 10 && h < H - 8) o.set(x, y, hex('#ffffff', 90));
    }
  }
  // Sockel (Anthrazit), Querriegel aus Holz unter der Decke, schmaler Kämpfer aus Metall
  const band = (h0, h1, c) => o.poly([at(0, h0), at(1, h0), at(1, h1), at(0, h1)], hex(c));
  band(0, 4, '#3a3f44');
  band(H - 6, H, '#c8935a');
  band(H - 6, H - 5, '#8a5a30');
  band(38, 39, '#5a646c');
  // senkrechte Holzbalken (Brettschichtholz) an den Rändern und in der Mitte
  for (const t of [0, 0.5, 1]) {
    const [x0, y0] = at(t, 0);
    o.rect(Math.round(x0) - 2, Math.round(y0) - H, 4, H, hex('#c8935a'));
    o.rect(Math.round(x0) - 2, Math.round(y0) - H, 1, H, hex('#e0b07a'));
    o.rect(Math.round(x0) + 1, Math.round(y0) - H, 1, H, hex('#8a5a30'));
  }
  if (door) {
    // Glastür mit zwei Flügeln, Holzrahmen und langen Griffen
    const [x0, y0] = at(0.12, 0);
    const [x1, y1] = at(0.88, 0);
    const D = 46;
    o.poly([[x0, y0], [x1, y1], [x1, y1 - D], [x0, y0 - D]], hex('#cfeaf4', 170));
    o.poly([[x0, y0 - D], [x1, y1 - D], [x1, y1 - D - 3], [x0, y0 - D - 3]], hex('#8a5a30'));
    const [mx, my] = at(0.5, 0);
    o.rect(Math.round(mx) - 1, Math.round(my) - D, 2, D, hex('#8a5a30'));
    o.rect(Math.round(mx) - 4, Math.round(my) - 30, 2, 14, hex('#3a3f44'));
    o.rect(Math.round(mx) + 2, Math.round(my) - 29, 2, 14, hex('#3a3f44'));
  }
  o.outline(INK);
  const c = new Canvas(64, 100);
  c.line(a[0], a[1] + 1, b[0], b[1] + 1, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Eckbalken
function officePost() {
  const o = new Canvas(64, 100);
  const [x, y] = [32, 80];
  o.rect(x - 3, y - OFFICE_H - 1, 6, OFFICE_H + 2, hex('#c8935a'));
  o.rect(x - 3, y - OFFICE_H - 1, 2, OFFICE_H + 2, hex('#e0b07a'));
  o.rect(x + 2, y - OFFICE_H - 1, 1, OFFICE_H + 2, hex('#8a5a30'));
  o.outline(INK);
  return o;
}

// Flachdach mit Holzblende, begrünt, mit Oberlichtern; Grundfläche A x B Kacheln.
// Ankerpunkt (obere Ecke der Grundfläche): siehe officeRoofAnchor, muss zu ROOF_ANCHOR in GardenScene passen
function officeRoofAnchor(A, B, ov) {
  const OX = Math.round((B + 2 * ov) * 32 + 8);
  const OY = Math.round(OFFICE_H + 8 + 2 * ov * 16 + 8);
  const W = Math.round(OX + (A + 2 * ov) * 32 + 8);
  const Hc = Math.round(OY + (A + B + 2 * ov) * 16 + 12);
  return { OX, OY, W, Hc };
}
function officeRoof(A, B, ov = 0.3) {
  const { OX, OY, W, Hc } = officeRoofAnchor(A, B, ov);
  const P = (a, b, h = 0) => [OX + (a - b) * 32, OY + (a + b) * 16 - h];
  const H = OFFICE_H + 1;
  const T = 7; // Dicke der Holzblende
  const o = new Canvas(W, Hc);
  const E = (h) => ({ t: P(-ov, -ov, h), r: P(A + ov, -ov, h), b: P(A + ov, B + ov, h), l: P(-ov, B + ov, h) });
  const lo = E(H), hi = E(H + T);
  // Blende vorne links und vorne rechts
  o.poly([lo.l, lo.b, hi.b, hi.l], hex('#b8834c'));
  o.poly([lo.b, lo.r, hi.r, hi.b], hex('#d29c62'));
  for (let k = 1; k < T; k += 3) {
    o.line(lo.l[0], lo.l[1] - k, lo.b[0], lo.b[1] - k, hex('#a8743f'));
    o.line(lo.b[0], lo.b[1] - k, lo.r[0], lo.r[1] - k, hex('#c08a50'));
  }
  // Dachfläche: Gründach (Sedum) mit Kiesrand
  o.poly([hi.t, hi.r, hi.b, hi.l], hex('#9a9a92'));
  const inset = (u, v) => P(u, v, H + T);
  const g = 0.35;
  o.poly([inset(-ov + g, -ov + g), inset(A + ov - g, -ov + g), inset(A + ov - g, B + ov - g), inset(-ov + g, B + ov - g)], hex('#6f8f4a'));
  for (let y = 0; y < Hc; y++) {
    for (let x = 0; x < W; x++) {
      if (o.alpha(x, y) === 0) continue;
      const r = rand();
      const [cr, cg] = [o.d[(y * W + x) * 4], o.d[(y * W + x) * 4 + 1]];
      if (cg > cr + 20) {
        if (r < 0.12) o.set(x, y, hex('#86a85a'));
        else if (r < 0.18) o.set(x, y, hex('#5a7a3a'));
        else if (r < 0.2) o.set(x, y, hex('#e8d26a')); // kleine Blüten
      } else if (r < 0.2) o.set(x, y, hex('#b0b0a8'));
    }
  }
  // Oberlichter: Glasstreifen über dem Raum
  for (const a0 of [A * 0.22, A * 0.5, A * 0.78]) {
    const q = [inset(a0 - 0.35, B * 0.25), inset(a0 + 0.35, B * 0.25), inset(a0 + 0.35, B * 0.75), inset(a0 - 0.35, B * 0.75)];
    o.poly(q, hex('#cfeaf4'));
    o.line(...q[0], ...q[3], hex('#8a5a30'));
    o.line(...q[1], ...q[2], hex('#8a5a30'));
    o.line(...inset(a0, B * 0.25), ...inset(a0, B * 0.75), hex('#ffffff'));
  }
  o.outline(INK);
  return o;
}

// heller Steinboden mit Fugen
function officeFloor() {
  return tile((x, y) => {
    const k = y - 0.5 * x;
    const l = y + 0.5 * x;
    if (((k % 16) + 16) % 16 < 1 || ((l % 16) + 16) % 16 < 1) return hex('#b8b4aa');
    return rand() < 0.08 ? hex('#dcd8cc') : hex('#e6e2d6');
  });
}

// großer Schreibtisch über drei Kacheln (entlang tx) mit drei Monitoren, Bildschirme zur Kamera; Kachelmitte bei (96, 72)
function officeDesk() {
  const o = new Canvas(192, 96);
  const P = isoBox(o, 96, 72, 2.6, 0.7, 18, '#d8b07a', '#3a3f44', '#555c63');
  // Holzkante vorne
  o.poly([P(-1.3, 0.35, 18), P(1.3, 0.35, 18), P(1.3, 0.35, 15), P(-1.3, 0.35, 15)], hex('#b8834c'));
  // Monitore: Fuß, Hals und Bildschirm mit Diagrammen
  const screens = [
    ['#2f6a9a', (sx, sy) => { for (let k = 0; k < 5; k++) o.rect(sx + 3 + k * 4, sy + 13 - k * 2, 3, 3 + k * 2, hex('#7ad07a')); }],
    ['#244f75', (sx, sy) => { for (let k = 0; k < 18; k++) o.set(sx + 3 + k, sy + 10 - Math.round(Math.sin(k / 2.5) * 4), hex('#f2c24a')); o.rect(sx + 3, sy + 3, 8, 2, hex('#e8eef4')); }],
    ['#2f6a9a', (sx, sy) => { o.circle(sx + 9, sy + 9, 5, hex('#e8483f')); o.ellipse(sx + 9, sy + 9, 5, 5, hex('#7ad07a'), true); o.rect(sx + 16, sy + 5, 6, 2, hex('#e8eef4')); o.rect(sx + 16, sy + 9, 5, 2, hex('#e8eef4')); }],
  ];
  screens.forEach(([bg, draw], i) => {
    const u = -0.85 + i * 0.85;
    const [fx, fy] = P(u, -0.1, 18);
    o.rect(Math.round(fx) - 4, Math.round(fy) - 1, 8, 2, hex('#2b2b2b'));
    o.rect(Math.round(fx) - 1, Math.round(fy) - 8, 2, 8, hex('#3a3a3a'));
    // Bildschirm parallel zur Tischkante (leicht schräg wie die Kanten entlang tx)
    const w = 26, h = 18;
    const sx = Math.round(fx) - w / 2, sy = Math.round(fy) - 8 - h;
    o.poly([[sx, sy], [sx + w, sy + w / 2], [sx + w, sy + w / 2 + h], [sx, sy + h]], hex('#2b2b2b'));
    o.poly([[sx + 2, sy + 2], [sx + w - 2, sy + w / 2], [sx + w - 2, sy + w / 2 + h - 3], [sx + 2, sy + h - 1]], hex(bg));
    draw(sx, sy + 2);
  });
  // Tastatur, Maus, Kaffeetasse
  o.poly([P(-0.3, 0.12, 18.5), P(0.3, 0.12, 18.5), P(0.3, 0.27, 18.5), P(-0.3, 0.27, 18.5)], hex('#e8e8e0'));
  const [mx, my] = P(0.45, 0.2, 18);
  o.rect(Math.round(mx), Math.round(my) - 2, 3, 2, hex('#e8e8e0'));
  const [cx, cy] = P(-0.9, 0.2, 18);
  o.rect(Math.round(cx) - 2, Math.round(cy) - 5, 5, 5, hex('#f4f4f4'));
  o.rect(Math.round(cx) - 1, Math.round(cy) - 5, 3, 1, hex('#6b4224'));
  o.outline(INK);
  return o;
}

// Bürostuhl hinter dem Tisch (schaut zu den Monitoren, die Lehne ist hinten); Kachelmitte bei (32, 44)
function officeChair() {
  const o = new Canvas(96, 64);
  const cx = 48 - 22, cy = 44 + 11; // mittig hinter den Tisch gerückt (Richtung Kamera)
  const P = (u, v, z = 0) => [cx + (u - v) * 32, cy + (u + v) * 16 - z];
  // Lehne hinten (v = -0.18)
  // gepolsterte, oben abgerundete Lehne (blau, damit man sie hinter den Monitoren als Stuhl erkennt)
  o.poly([P(-0.17, -0.18, 14), P(0.17, -0.18, 14), P(0.17, -0.18, 28), P(0.1, -0.18, 31), P(-0.1, -0.18, 31), P(-0.17, -0.18, 28)], hex('#3f78b0'));
  o.poly([P(-0.12, -0.17, 17), P(0.12, -0.17, 17), P(0.12, -0.17, 27), P(-0.12, -0.17, 27)], hex('#5a96cc'));
  for (const u of [-0.2, 0.2]) o.line(...P(u, -0.05, 12), ...P(u, -0.05, 19), hex('#2b2b2b')); // Armlehnen
  // Fuß mit Rollen, Gasfeder, Sitz
  for (const [u, v] of [[-0.2, 0], [0.2, 0], [0, -0.2], [0, 0.2]]) o.line(...P(0, 0, 2), ...P(u, v, 1), hex('#3a3a3a'));
  o.line(...P(0, 0, 2), ...P(0, 0, 11), hex('#5a5a5a'));
  o.poly([P(-0.18, -0.16, 12), P(0.18, -0.16, 12), P(0.18, 0.18, 12), P(-0.18, 0.18, 12)], hex('#2f5f8a'));
  o.poly([P(-0.18, 0.18, 12), P(0.18, 0.18, 12), P(0.18, 0.18, 10), P(-0.18, 0.18, 10)], hex('#244a6a'));
  o.outline(INK);
  const c = new Canvas(96, 64);
  c.ellipse(cx, cy + 1, 10, 4, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// ---------- Haupthaus: Zimmerpflanzen und Sitzecke ----------
// Quader im Raum: u entlang tx, v entlang ty (in Kacheln, relativ zur Kachelmitte), z Höhe; sichtbar sind oben,
// vorne links (v = v1) und vorne rechts (u = u1)
function roomBox(o, P, [u0, u1], [v0, v1], [z0, z1], top, left, right) {
  o.poly([P(u0, v1, z0), P(u1, v1, z0), P(u1, v1, z1), P(u0, v1, z1)], hex(left));
  o.poly([P(u1, v0, z0), P(u1, v1, z0), P(u1, v1, z1), P(u1, v0, z1)], hex(right));
  o.poly([P(u0, v0, z1), P(u1, v0, z1), P(u1, v1, z1), P(u0, v1, z1)], hex(top));
}

// große Zimmerpflanze im hellen Topf: Monstera (breite, geschlitzte Blätter) oder Strelitzie (hohe Paddelblätter).
// Kachelmitte bei (32, 84)
function officePlant(kind) {
  const o = new Canvas(64, 96);
  const x = 32, y = 84;
  // runder Topf: weiß (Monstera) bzw. Beton (Strelitzie)
  const [potC, potL, potD] = kind === 'monstera' ? ['#f2f0ea', '#ffffff', '#c8c4b8'] : ['#9a9a92', '#b8b8b0', '#7a7a72'];
  o.rect(x - 9, y - 16, 18, 15, hex(potC));
  o.ellipse(x, y - 1, 9, 3.5, hex(potC));
  o.rect(x - 9, y - 16, 3, 15, hex(potL));
  o.rect(x + 6, y - 16, 3, 15, hex(potD));
  o.ellipse(x, y - 16, 9, 3.5, hex(potD));
  o.ellipse(x, y - 16.5, 7.5, 2.5, hex('#5a3a20')); // Erde
  if (kind === 'monstera') {
    // Stiele und große, herzförmige Blätter mit Schlitzen
    const leaves = [[-14, -30, 1], [13, -32, -1], [-6, -44, 1], [8, -48, -1], [0, -36, 1], [-16, -46, 1], [16, -44, -1]];
    for (const [dx, dy] of leaves) o.line(x, y - 17, x + dx * 0.8, y + dy + 4, hex('#3f6a2a'));
    for (const [dx, dy, dir] of leaves) {
      const cx = x + dx, cy = y + dy;
      o.ellipse(cx, cy, 9, 7, hex('#2f6a32'));
      o.ellipse(cx - dir * 2, cy - 2, 5, 3.5, hex('#3f8a42'), true);
      for (const k of [-4, 0, 4]) o.line(cx, cy, cx + dir * 9, cy + k, hex('#1f4a22')); // Schlitze zum Rand
      o.line(cx - dir * 7, cy + 1, cx + dir * 3, cy - 1, hex('#5aa85a')); // Mittelrippe
    }
  } else {
    // Strelitzie: hohe Stiele mit langen, schmalen Blättern, dazu eine orange-blaue Blüte
    const leaves = [[-12, -62], [-4, -70], [6, -66], [14, -56], [-16, -48], [12, -44]];
    for (const [dx, dy] of leaves) {
      const ex = x + dx * 0.55, ey = y + dy + 18;
      o.line(x + dx * 0.15, y - 17, ex, ey, hex('#4f7a3a'));
      // Blatt als lange Ellipse entlang des Stiels
      for (let t = 0; t <= 1; t += 0.05) {
        const px = ex + (x + dx - ex) * t, py = ey + (y + dy - ey) * t;
        const w = Math.sin(t * Math.PI) * 4;
        o.line(px - w, py, px + w, py, hex(t < 0.5 ? '#3f7a3a' : '#4f9a4a'));
      }
      o.line(ex, ey, x + dx, y + dy, hex('#2f5a2a'));
    }
    const [bx, by] = [x - 2, y - 52];
    o.poly([[bx - 6, by + 2], [bx + 4, by], [bx + 2, by + 3]], hex('#3f5a8a'));
    for (const [dx, dy] of [[0, -5], [3, -7], [5, -4]]) o.line(bx, by, bx + dx, by + dy, hex('#f08a2c'));
  }
  o.outline(INK);
  const c = new Canvas(64, 96);
  c.ellipse(x, y, 11, 4, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Sofa an der linken Wand über zwei Kacheln (entlang ty); gesetzt auf die vordere Kachel. Kachelmitte bei (56, 68)
function officeSofa() {
  const o = new Canvas(112, 80);
  const P = (u, v, z = 0) => [56 + (u - v) * 32, 68 + (u + v) * 16 - z];
  const U = [-0.85, -0.08], V = [-1.45, 0.45];
  const fabric = ['#9aa6ac', '#7a868c', '#8a969c'];
  roomBox(o, P, [U[0], U[0] + 0.22], V, [8, 27], '#aab6bc', '#7a868c', '#8a969c'); // Lehne an der Wand
  roomBox(o, P, U, [V[0], V[0] + 0.2], [8, 17], ...fabric); // Armlehne hinten
  roomBox(o, P, [U[0], U[1]], V, [2, 11], '#b4c0c6', '#7a868c', '#8a969c'); // Sitz
  roomBox(o, P, [U[0] + 0.22, U[1]], [-1.2, -0.48], [11, 13], '#c4ced2', '#9aa6ac', '#a8b4ba'); // zwei Sitzkissen
  roomBox(o, P, [U[0] + 0.22, U[1]], [-0.42, 0.22], [11, 13], '#c4ced2', '#9aa6ac', '#a8b4ba');
  // Holzfüße
  for (const [u, v] of [[U[1] - 0.05, V[1] - 0.05], [U[1] - 0.05, V[0] + 0.05]]) o.rect(...P(u, v, 2).map(Math.round), 2, 3, hex('#8a5a30'));
  // bunte Zierkissen an der Lehne
  for (const [v, c] of [[-1.0, '#e8b84a'], [-0.05, '#c8603d']]) {
    const [kx, ky] = P(U[0] + 0.3, v, 18);
    o.poly([[kx - 7, ky - 3], [kx + 5, ky - 9], [kx + 7, ky], [kx - 5, ky + 5]], hex(c));
  }
  roomBox(o, P, U, [V[1] - 0.2, V[1]], [8, 17], ...fabric); // Armlehne vorne
  o.outline(INK);
  const c = new Canvas(112, 80);
  c.poly([P(U[0], V[0], 0), P(U[1] + 0.05, V[0], 0), P(U[1] + 0.05, V[1] + 0.05, 0), P(U[0], V[1] + 0.05, 0)], SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// runder Couchtisch aus Holz mit Zeitschriften, Tasse und Blumenvase; zwischen die zwei Kacheln gerückt.
// Kachelmitte bei (40, 52)
function officeCoffeeTable() {
  const o = new Canvas(80, 60);
  const P = (u, v, z = 0) => [40 + (u - v) * 32, 52 + (u + v) * 16 - z];
  const [cx, cy] = P(0, -0.5, 0);
  o.rect(Math.round(cx) - 2, Math.round(cy) - 11, 4, 11, hex('#6b4224')); // Fuß
  o.ellipse(cx, cy, 8, 3, hex('#6b4224'));
  o.ellipse(cx, cy - 12, 18, 9, hex('#a8743f')); // Platte
  o.ellipse(cx, cy - 13, 17, 8, hex('#d29c62'));
  o.ellipse(cx - 4, cy - 15, 7, 3, hex('#e0b07a'), true);
  // Zeitschriften
  o.poly([[cx - 12, cy - 13], [cx - 4, cy - 17], [cx + 1, cy - 14], [cx - 7, cy - 10]], hex('#4f84b8'));
  o.poly([[cx - 10, cy - 14], [cx - 3, cy - 18], [cx + 2, cy - 15], [cx - 5, cy - 11]], hex('#f2e2c0'));
  o.line(cx - 8, cy - 14, cx - 2, cy - 17, hex('#c8553d'));
  // Tasse
  o.rect(Math.round(cx) + 5, Math.round(cy) - 18, 4, 4, hex('#f4f4f4'));
  o.rect(Math.round(cx) + 5, Math.round(cy) - 18, 4, 1, hex('#6b4224'));
  // Vase mit Blume
  o.rect(Math.round(cx) - 1, Math.round(cy) - 20, 3, 6, hex('#3f8a9a'));
  o.line(cx, cy - 20, cx - 1, cy - 26, hex('#3f7a2a'));
  o.circle(cx - 1, cy - 27, 2, hex('#e8483f'));
  o.outline(INK);
  const c = new Canvas(80, 60);
  c.ellipse(cx, cy, 15, 5, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Sessel gegenüber dem Sofa (Lehne rechts, schaut zum Tisch); zwischen die zwei Kacheln gerückt. Kachelmitte bei (40, 52)
function officeArmchair() {
  const o = new Canvas(80, 60);
  const P = (u, v, z = 0) => [40 + (u - v) * 32, 52 + (u + v) * 16 - z];
  const V = [-0.85, -0.15], U = [-0.25, 0.32];
  roomBox(o, P, U, [V[0], V[0] + 0.14], [6, 16], '#d8986a', '#a8603d', '#b8704a'); // Armlehne hinten
  roomBox(o, P, U, V, [2, 10], '#e0a070', '#a8603d', '#b8704a'); // Sitz
  roomBox(o, P, [U[0] + 0.05, U[1] - 0.18], [V[0] + 0.14, V[1] - 0.14], [10, 12], '#ecb488', '#c07850', '#c8805a'); // Kissen
  roomBox(o, P, [U[1] - 0.18, U[1]], V, [10, 26], '#d8986a', '#a8603d', '#b8704a'); // Lehne
  roomBox(o, P, U, [V[1] - 0.14, V[1]], [6, 16], '#d8986a', '#a8603d', '#b8704a'); // Armlehne vorne
  for (const [u, v] of [[U[0] + 0.03, V[1] - 0.03], [U[1] - 0.03, V[1] - 0.03]]) o.rect(...P(u, v, 2).map(Math.round), 2, 3, hex('#6b4224'));
  o.outline(INK);
  const c = new Canvas(80, 60);
  c.poly([P(U[0], V[0], 0), P(U[1] + 0.05, V[0], 0), P(U[1] + 0.05, V[1] + 0.05, 0), P(U[0], V[1] + 0.05, 0)], SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Teppich unter der Sitzecke (liegt flach auf dem Boden); Kachelmitte bei (80, 30)
function officeRug() {
  const o = new Canvas(160, 84);
  const P = (u, v) => [80 + (u - v) * 32, 30 + (u + v) * 16];
  const U = [-0.95, 1.5], V = [-0.55, 1.45];
  const quad = (a, b, c) => o.poly([P(U[0] + a, V[0] + a), P(U[1] - a, V[0] + a), P(U[1] - a, V[1] - a), P(U[0] + a, V[1] - a)], hex(c));
  quad(0, 0, '#c8603d'); // Rand
  quad(0.1, 0.1, '#f2e2c0');
  quad(0.18, 0.18, '#d8784a');
  // Rautenmuster
  for (let u = U[0] + 0.45; u < U[1] - 0.3; u += 0.5) {
    for (let v = V[0] + 0.45; v < V[1] - 0.3; v += 0.5) {
      const [x, y] = P(u, v);
      o.poly([[x, y - 4], [x + 8, y], [x, y + 4], [x - 8, y]], hex('#f2e2c0'));
      o.poly([[x, y - 2], [x + 4, y], [x, y + 2], [x - 4, y]], hex('#3f8a9a'));
    }
  }
  return o;
}

const PRINT_KINDS = ['sheep', 'mole', 'cat', 'frog', 'heron', 'fish', 'antelope', 'giraffe', 'deer', 'stag', 'fox', 'squirrel', 'zebra', 'meerkat', 'lion', 'crocodile'];
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
  'trap.png': trap(),
  'hand.png': hand(),
  // Savanne (hinten angehängt, damit sich der Zufall der älteren Grafiken nicht verschiebt)
  'sgrass0.png': savannaGrass(0),
  'sgrass1.png': savannaGrass(1),
  'sgrass2.png': savannaGrass(2),
  'savanna_path.png': savannaPath(),
  'acacia.png': acacia(),
  'boulder.png': boulder(),
  'dry_bush.png': dryBush(),
  'tuft.png': tuft(),
  'food.png': food(),
  // Gehege der Wiese: Holzboden, Kratzbaum, Gitterzaun der Voliere, Tor quer, Fußspuren und Torschilder
  'planks.png': planksTile(),
  'cat_tree.png': catTree(),
  'mesh_x.png': meshX,
  'mesh_y.png': meshX.flipped(),
  'gate_y.png': gate().flipped(),
  ...Object.fromEntries(PRINT_KINDS.map((k) => [`print_${k}.png`, printImage(k)])),
  'esign_pasture.png': enclosureSign(['sheep', 'mole']),
  'esign_cats.png': enclosureSign(['cat']),
  'esign_pond.png': enclosureSign(['frog', 'fish']),
  'esign_aviary.png': enclosureSign(['heron']),
  // Netz-Zaun der Voliere (entlang tx bzw. ty)
  'net_x.png': netX,
  'net_y.png': netX.flipped(),
  // Maschendraht (Teich), Eckpfosten je Zaunart, Tore je Gehege
  'chain_x.png': chainX,
  'chain_y.png': chainX.flipped(),
  'post_wood.png': fencePost('wood'),
  'post_mesh.png': fencePost('mesh'),
  'post_net.png': fencePost('net'),
  'post_chain.png': fencePost('chain'),
  'gate_chain_x.png': chainGateX,
  'gate_chain_y.png': chainGateX.flipped(),
  'gate_glass_x.png': glassDoorX,
  'gate_glass_y.png': glassDoorX.flipped(),
  'gate_glassflap_x.png': glassFlapX, // mittlerer Türflügel mit Katzenklappe
  'gate_glassflap_y.png': glassFlapX.flipped(),
  'gate_net_x.png': netGateX,
  'gate_net_y.png': netGateX.flipped(),
  // Savannengehege: hoher Wildzaun, großes Tor, Schild
  'tall_x.png': tallX,
  'tall_y.png': tallX.flipped(),
  'post_tall.png': fencePost('tall'),
  'gate_tall_x.png': tallGateX,
  'gate_tall_y.png': tallGateX.flipped(),
  'esign_savanna.png': enclosureSign(['antelope', 'zebra', 'giraffe']),
  // Wald: Hirschgehege, Fuchsbau, Voliere; Erdhöhle für den Fuchsbau
  'esign_deerpark.png': enclosureSign(['deer', 'stag']),
  'esign_foxden.png': enclosureSign(['fox']),
  'esign_forestaviary.png': enclosureSign(['squirrel', 'heron']),
  'den.png': foxDen(),
  // Erdmännchen: Torschild und sandfarbener Bau
  'esign_meerkat.png': enclosureSign(['meerkat']),
  'den_sand.png': foxDen(true),
  'esign_lion.png': enclosureSign(['lion']),
  'esign_crocodile.png': enclosureSign(['crocodile']),
  // Asien (hinten angehängt, damit sich der Zufall der älteren Grafiken nicht verschiebt)
  'agrass0.png': asiaGrass(0),
  'agrass1.png': asiaGrass(1),
  'agrass2.png': asiaGrass(2),
  'asia_path.png': asiaPath(),
  'asia_water0.png': asiaWater(0),
  'asia_water1.png': asiaWater(1),
  'asia_water2.png': asiaWater(2),
  'hotspring.png': hotSpring(),
  'bamboo.png': bamboo(),
  'tall_grass.png': tallGrass(),
  'jungle_tree.png': jungleTree(),
  'cherry_tree.png': cherryTree(),
  'sun_rock.png': sunRock(),
  'stone_lantern.png': stoneLantern(),
  'torii.png': torii(),
  // Koi: Fischfutter (Werkzeug), Fußspur-Tafel und Torschild für den Koi-Teich
  'koifood.png': koiFood(),
  'print_koi.png': printImage('koi'),
  'esign_koi.png': enclosureSign(['koi']),
  // leeres Torschild: die Tierbilder legt das Spiel darauf (siehe enclosureSigns in GardenScene)
  'esign_board.png': enclosureSign([]),
  // Pflaster im Tierpark
  'park_path.png': parkPath(),
  // Wegweiser-Pfosten ohne Bretter: die schrägen Bretter zeichnet das Spiel (siehe drawSignBoards)
  'signpost_post.png': signpostPost(),
  // begehbare Hütten: Wände, Eckpfosten, Tür und Dach je Stil, dazu die Möbel
  'hutwall_meadow_x.png': hutWall('meadow'),
  'hutwall_meadow_y.png': hutWall('meadow').flipped(),
  'post_hutwall_meadow.png': hutPost('meadow'),
  'gate_door_meadow_x.png': hutWall('meadow', true),
  'gate_door_meadow_y.png': hutWall('meadow', true).flipped(),
  'hutroof_meadow.png': hutRoof('meadow'),
  'hutwall_forest_x.png': hutWall('forest'),
  'hutwall_forest_y.png': hutWall('forest').flipped(),
  'post_hutwall_forest.png': hutPost('forest'),
  'gate_door_forest_x.png': hutWall('forest', true),
  'gate_door_forest_y.png': hutWall('forest', true).flipped(),
  'hutroof_forest.png': hutRoof('forest'),
  'hutwall_savanna_x.png': hutWall('savanna'),
  'hutwall_savanna_y.png': hutWall('savanna').flipped(),
  'post_hutwall_savanna.png': hutPost('savanna'),
  'gate_door_savanna_x.png': hutWall('savanna', true),
  'gate_door_savanna_y.png': hutWall('savanna', true).flipped(),
  'hutroof_savanna.png': hutRoof('savanna'),
  'hutwall_asia_x.png': hutWall('asia'),
  'hutwall_asia_y.png': hutWall('asia').flipped(),
  'post_hutwall_asia.png': hutPost('asia'),
  'gate_door_asia_x.png': hutWall('asia', true),
  'gate_door_asia_y.png': hutWall('asia', true).flipped(),
  'hutroof_asia.png': hutRoof('asia'),
  // Katzenhaus im Tierpark: Glaswände, Dach ohne Überstand
  'hutwall_cathouse_x.png': hutWall('cathouse'),
  'hutwall_cathouse_y.png': hutWall('cathouse').flipped(),
  'post_hutwall_cathouse.png': hutPost('cathouse'),
  'hutroof_cathouse.png': hutRoof('cathouse', 5, 4, 0),
  'hut_chest_small.png': hutChest(true),
  // Tierpark: Futterautomat und Futtersack
  'feeder.png': feederSprite(),
  'parkfood.png': parkFood(),
  'hut_desk_meadow.png': hutDeskStyled('meadow'),
  'hut_chair_meadow.png': hutChair('meadow'),
  'hut_plant_meadow.png': hutPlant('meadow'),
  'hut_shelf_meadow.png': hutShelf('meadow'),
  'hut_desk_forest.png': hutDeskStyled('forest'),
  'hut_chair_forest.png': hutChair('forest'),
  'hut_plant_forest.png': hutPlant('forest'),
  'hut_shelf_forest.png': hutShelf('forest'),
  'hut_desk_savanna.png': hutDeskStyled('savanna'),
  'hut_chair_savanna.png': hutChair('savanna'),
  'hut_plant_savanna.png': hutPlant('savanna'),
  'hut_shelf_savanna.png': hutShelf('savanna'),
  'hut_desk_asia.png': hutDeskStyled('asia'),
  'hut_chair_asia.png': hutChair('asia'),
  'hut_plant_asia.png': hutPlant('asia'),
  'hut_shelf_asia.png': hutShelf('asia'),
  'planks_forest.png': hutFloor('forest'),
  'planks_savanna.png': hutFloor('savanna'),
  'planks_asia.png': hutFloor('asia'),
  // Haupthaus im Tierpark (9 x 8 Kacheln)
  'hutwall_office_x.png': officeWall(),
  'hutwall_office_y.png': officeWall().flipped(),
  'post_hutwall_office.png': officePost(),
  'gate_door_office_x.png': officeWall(true),
  'gate_door_office_y.png': officeWall(true).flipped(),
  'hutroof_office.png': officeRoof(9, 8),
  'floor_office.png': officeFloor(),
  'office_desk.png': officeDesk(),
  'office_chair.png': officeChair(),
  'office_plant_monstera.png': officePlant('monstera'),
  'office_plant_strelitzia.png': officePlant('strelitzia'),
  'office_sofa.png': officeSofa(),
  'office_table.png': officeCoffeeTable(),
  'office_armchair.png': officeArmchair(),
  'office_rug.png': officeRug(),
};

// Offene Hand: der Platz an der Hütte, an dem man das getragene Werkzeug ablegt ("Hände frei")
function hand() {
  const skin = hex('#f2c89a');
  const shade = hex('#d9a26f');
  const o = new Canvas(64, 64);
  // vier Finger mit runden Kuppen (der mittlere am längsten)
  for (const [x, top] of [[20, 16], [27, 11], [34, 12], [41, 17]]) {
    o.rect(x, top + 3, 6, 30 - top, skin);
    o.circle(x + 3, top + 3, 3, skin);
    o.line(x + 5, top + 4, x + 5, 33, shade); // Schatten an der rechten Fingerseite
  }
  // Handfläche
  o.ellipse(33, 41, 14, 13, skin);
  o.ellipse(35, 45, 9, 7, shade);
  o.ellipse(34, 43, 8, 6, skin);
  // Daumen schräg nach links
  o.poly([[20, 40], [9, 29], [13, 25], [24, 34]], skin);
  o.circle(11, 27, 3, skin);
  o.line(21, 36, 12, 28, shade);
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.draw(o, 0, 0);
  return c;
}

// ---------- Savanne ----------

// Trockenes, gelbliches Gras mit dürren Halmen
function savannaGrass(variant) {
  const c = tile(() => {
    const r = rand();
    return r < 0.08 ? hex('#b89a52') : r < 0.15 ? hex('#e6d08c') : hex('#d4bb72');
  });
  for (let n = 0; n < 9 + variant * 4; n++) {
    const x = randInt(6, 57);
    const y = randInt(4, 28);
    if (!inDiamond(x, y) || !inDiamond(x, y - 2)) continue;
    c.paint(x, y, hex('#9c7e3e'));
    c.paint(x, y - 1, hex('#b8984c'));
    c.paint(x + (rand() < 0.5 ? -1 : 1), y - 2, hex('#ecdca0'));
  }
  // ein paar rötliche Erdflecken
  if (variant === 2) {
    for (let n = 0; n < 4; n++) {
      const x = randInt(14, 48);
      const y = randInt(9, 23);
      c.paint(x, y, hex('#c08a58'));
      c.paint(x + 1, y, hex('#b07a4a'));
    }
  }
  return c;
}

// Rote Erde
function savannaPath() {
  const c = tile(() => {
    const r = rand();
    return r < 0.1 ? hex('#a8603a') : r < 0.16 ? hex('#d8956a') : hex('#c47a4c');
  });
  for (let n = 0; n < 7; n++) {
    const x = randInt(8, 55);
    const y = randInt(5, 26);
    c.paint(x, y, hex('#8a4a2a'));
    c.paint(x + 1, y, hex('#e0a87a'));
  }
  return c;
}

// Schirmakazie: dünner, gegabelter Stamm und flache, breite Krone.
// Um den Faktor S vergrößert gezeichnet (Stammfuß bei (64, 116)), damit fressende Giraffen an die Krone reichen
function acacia() {
  const S = 1.3;
  const X = (x) => 64 + (x - 48) * S;
  const Y = (y) => 116 - (87 - y) * S;
  const o = new Canvas(128, 128);
  // Stamm mit zwei Ästen
  for (let k = -3; k <= 3; k++) {
    const col = k < -1 ? hex('#8a6440') : k <= 0 ? hex('#6e4c2e') : hex('#563a22');
    o.line(X(48) + k, Y(86), X(47) + k, Y(60), col);
    o.line(X(47) + k, Y(62), X(34) + k, Y(40), col);
    o.line(X(47) + k, Y(62), X(62) + k, Y(41), col);
  }
  o.line(X(40), Y(50), X(26), Y(42), hex('#6e4c2e'));
  o.line(X(56), Y(50), X(70), Y(43), hex('#6e4c2e'));
  // flache Krone in Schichten, unten dunkler
  o.ellipse(X(48), Y(37), 42 * S, 11 * S, hex('#4f6a26'));
  o.ellipse(X(47), Y(34), 39 * S, 9 * S, hex('#66852f'));
  o.ellipse(X(44), Y(31), 30 * S, 6 * S, hex('#7f9c3c'));
  o.ellipse(X(38), Y(29), 14 * S, 3.5 * S, hex('#9cb650'));
  o.ellipse(X(60), Y(30), 10 * S, 3 * S, hex('#9cb650'));
  // Blattbüschel als Sprenkel
  for (let n = 0; n < 70; n++) {
    const x = Math.round(X(randInt(8, 88)));
    const y = Math.round(Y(randInt(26, 46)));
    o.paint(x, y, rand() < 0.5 ? hex('#3f5820') : hex('#a8c25a'));
  }
  o.outline(INK);
  return withShadow(128, 128, 64, 116, 36, 7, o);
}

// Großer Felsbrocken mit einem kleinen Stein daneben; Kachelmitte bei (32, 46)
function boulder() {
  const o = new Canvas(64, 56);
  o.ellipse(30, 32, 23, 16, hex('#8c7658'));
  o.ellipse(28, 29, 20, 13, hex('#a68e6c'), true);
  o.ellipse(23, 24, 11, 7, hex('#c2ab86'), true);
  o.ellipse(20, 21, 5, 3, hex('#d8c4a0'), true);
  o.line(34, 22, 38, 32, hex('#6e5c44'));
  o.line(38, 32, 36, 40, hex('#6e5c44'));
  o.line(18, 36, 26, 38, hex('#6e5c44'));
  o.ellipse(51, 42, 8, 6, hex('#8c7658'));
  o.ellipse(50, 40.5, 6, 4, hex('#a68e6c'), true);
  o.outline(hex('#3b3226'));
  return withShadow(64, 56, 33, 46, 26, 6, o);
}

// Trockener Strauch: dürre Zweige mit ein paar olivgrünen Blättchen; Mitte bei (24, 33)
function dryBush() {
  const o = new Canvas(48, 40);
  const twigs = [[-16, -10], [-11, -18], [-4, -22], [4, -21], [12, -17], [17, -9], [-8, -6], [9, -5]];
  for (const [dx, dy] of twigs) {
    o.line(24, 32, 24 + dx, 32 + dy, hex('#7a5a36'));
    o.line(24 + dx * 0.6, 32 + dy * 0.6, 24 + dx * 0.6 + (dx > 0 ? 4 : -4), 32 + dy * 0.6 - 4, hex('#8a6a42'));
  }
  for (const [dx, dy] of twigs) {
    o.ellipse(24 + dx, 31 + dy, 2.5, 1.8, hex('#8a8a3a'));
    o.set(24 + dx - 1, 30 + dy, hex('#b0ac56'));
  }
  o.outline(hex('#3a2a18'));
  return withShadow(48, 40, 24, 33, 13, 4, o);
}

// Büschel aus trockenem Gras (nur Deko, man kann hindurchlaufen); Mitte bei (16, 18)
function tuft() {
  const o = new Canvas(32, 24);
  for (const [dx, h, col] of [[-6, 8, '#a88a40'], [-3, 11, '#c8a850'], [0, 13, '#e0c878'], [3, 10, '#c8a850'], [6, 7, '#a88a40'], [-1, 9, '#b8984c']]) {
    o.line(16 + dx * 0.3, 19, 16 + dx, 19 - h, hex(col));
  }
  o.outline(hex('#6a5428'));
  return o;
}

// Ranger-Zelt: Leinwandzelt mit hochgerollter Vorderplane, gleiche Grundfläche und Bildgröße wie die Hütten
// Grünfutter: gebundenes Bündel Akazienzweige (Gegenstand in doppelter Auflösung)
function food() {
  const o = new Canvas(64, 64);
  // Zweige von unten (gebunden) fächerförmig nach oben
  const tips = [[14, 14], [24, 8], [34, 6], [44, 10], [52, 18], [20, 26], [46, 28]];
  for (const [x, y] of tips) {
    o.line(32, 56, x, y, hex('#7a5a36'));
    o.line(33, 56, x + 1, y, hex('#5e4228'));
  }
  // Blätter: kleine Büschel an den Zweigen, dunkel unten, hell oben
  for (const [x, y] of tips) {
    for (let t = 0.25; t <= 1; t += 0.25) {
      const lx = Math.round(32 + (x - 32) * t);
      const ly = Math.round(56 + (y - 56) * t);
      o.ellipse(lx - 3, ly, 3.5, 2.2, hex('#4f7a2a'));
      o.ellipse(lx + 3, ly - 1, 3.5, 2.2, hex('#66932f'));
    }
    o.ellipse(x, y, 4, 3, hex('#7fae3c'));
    o.ellipse(x - 1, y - 1, 2, 1.5, hex('#a8d05a'));
  }
  // Schnur, die das Bündel zusammenhält
  o.rect(27, 46, 11, 3, hex('#d8b07a'));
  o.rect(27, 46, 11, 1, hex('#efd2a0'));
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.draw(o, 0, 0);
  return c;
}

// ---------- Gehege der Wiese ----------

// Holzboden (Bretter entlang der tx-Achse, Fugen passen über die Kachelgrenzen)
function planksTile() {
  return tile((x, y) => {
    const k = y - 0.5 * x;
    const m = ((k % 6) + 6) % 6;
    if (m < 1) return hex('#7a4e2d');
    const board = Math.floor(k / 6);
    const base = [hex('#c8935a'), hex('#b8834c'), hex('#d29c62')][((board % 3) + 3) % 3];
    return rand() < 0.06 ? hex('#a8743f') : base;
  });
}

// Kratzbaum: Sisalstamm mit zwei Plüsch-Ebenen und Spielball; Fuß bei (24, 72)
function catTree() {
  const o = new Canvas(48, 80);
  o.ellipse(24, 72, 16, 6, hex('#a8957a')); // Bodenplatte
  o.ellipse(24, 70.5, 15, 5, hex('#c9b28a'), true);
  // Sisalstamm
  o.rect(20, 26, 8, 46, hex('#d8c08a'));
  for (let y = 27; y < 71; y += 3) o.rect(20, y, 8, 1, hex('#b89c62'));
  o.rect(20, 26, 2, 46, hex('#e8d4a4'));
  // untere Ebene mit Spielball an einer Schnur
  o.ellipse(24, 50, 15, 5, hex('#8a7a8a'));
  o.ellipse(24, 48.5, 14, 4, hex('#a898a8'), true);
  o.line(37, 51, 37, 60, hex('#6a5a4a'));
  o.circle(37, 62, 2.5, hex('#e8483f'));
  // obere Ebene: weiches Kissen
  o.ellipse(24, 26, 16, 6, hex('#8a7a8a'));
  o.ellipse(24, 24, 15, 5, hex('#b8a8b8'), true);
  o.ellipse(21, 23, 6, 2, hex('#d8c8d8'), true);
  o.outline(INK);
  return withShadow(48, 80, 24, 73, 17, 5, o);
}

// Hoher Gitterzaun der Voliere entlang der tx-Achse (gleiche Grundlinie wie der Zaun); Kachelmitte bei (32, 44)
function meshFence() {
  const a = [16, 36];
  const b = [48, 52];
  const H = 32;
  // Drahtgitter zwischen den Pfosten (eigene Ebene ohne dicke Kontur)
  const mesh = new Canvas(64, 64);
  mesh.poly([[a[0], a[1] - 1], [b[0], b[1] - 1], [b[0], b[1] - H], [a[0], a[1] - H]], hex('#c8d0d8', 30));
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const u = x - a[0];
      const v = y - (a[1] + u * 0.5);
      const p = (((Math.round(u + v * 1.2) % 6) + 6) % 6) === 0 || (((Math.round(u - v * 1.2) % 6) + 6) % 6) === 0;
      if (p) mesh.paint(x, y, hex('#9aa4ae', 220));
    }
  }
  // Pfosten und Oberkante
  const o = new Canvas(64, 64);
  for (let k = 0; k < 2; k++) o.line(a[0], a[1] - H + k, b[0], b[1] - H + k, k === 0 ? hex('#c8935a') : hex('#8a5a30'));
  for (const [x, y] of [a, b]) {
    o.rect(x - 2, y - H - 2, 4, H + 3, hex('#b07a42'));
    o.rect(x - 2, y - H - 2, 1, H + 3, hex('#d29c62'));
    o.rect(x + 1, y - H - 2, 1, H + 3, hex('#8a5a30'));
  }
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.line(a[0], a[1] + 1, b[0], b[1] + 1, SHADOW);
  c.draw(mesh, 0, 0);
  c.draw(o, 0, 0);
  return c;
}

// Fußspuren (und beim Fisch ein Umriss, weil Fische keine Füße haben).
// Gezeichnet in einem Raster von etwa -20..20 um die Mitte (cx, cy), skaliert mit s.
function drawPrint(kind, c, cx, cy, s, col = hex('#5a3a22')) {
  const E = (x, y, rx, ry) => c.ellipse(cx + x * s, cy + y * s, Math.max(0.7, rx * s), Math.max(0.7, ry * s), col);
  // dicker Strich aus aneinandergereihten Kreisen; r0 am Anfang, r1 am Ende
  const stroke = (x0, y0, x1, y1, r0, r1 = r0) => {
    for (let t = 0; t <= 1; t += 0.05) E(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r0 + (r1 - r0) * t, r0 + (r1 - r0) * t);
  };
  const ray = (x, y, deg, len, r0, r1) => {
    const a = (deg * Math.PI) / 180;
    stroke(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, r0, r1);
    return [x + Math.cos(a) * len, y + Math.sin(a) * len];
  };
  switch (kind) {
    case 'sheep': // Paarhufer: zwei Hufhälften
      for (const side of [-1, 1]) {
        E(side * 6, 5, 5, 10);
        E(side * 5.5, -5, 3.8, 7);
        E(side * 4.5, -12, 2.2, 3);
      }
      break;
    case 'mole': // breite Grabhand mit fünf Krallen
      E(0, 6, 10, 8);
      for (let i = 0; i < 5; i++) {
        const [tx, ty] = ray(0, 4, -160 + i * 35, 13, 3, 2);
        E(tx, ty, 1.4, 1.4);
      }
      break;
    case 'cat': // großer Ballen und vier Zehen, keine Krallenspuren
      E(0, 9, 8, 6);
      E(-5, 11, 4, 4.5);
      E(5, 11, 4, 4.5);
      for (const [x, y] of [[-11, -2], [-4, -9], [4, -9], [11, -2]]) E(x, y, 3.4, 4.4);
      break;
    case 'frog': // lange, dünne Finger mit runden Haftscheiben
      E(0, 9, 4.5, 4);
      for (const deg of [-150, -112, -68, -30]) {
        const [tx, ty] = ray(0, 8, deg, 17, 1.4, 1.1);
        E(tx, ty, 2.6, 2.6);
      }
      break;
    case 'heron': // drei lange Zehen nach vorne, eine nach hinten
      E(0, 6, 2.6, 2.6);
      for (const deg of [-128, -90, -52]) ray(0, 6, deg, 21, 1.6, 0.8);
      ray(0, 6, 90, 11, 1.6, 0.8);
      break;
    case 'antelope': // schmale, spitze Hufhälften (Paarhufer, zum schnellen Laufen)
      for (const side of [-1, 1]) {
        E(side * 3.5, 6, 3.4, 9);
        E(side * 3.2, -3, 2.6, 7);
        E(side * 2.6, -10, 1.6, 4);
      }
      break;
    case 'giraffe': // große, runde Hufhälften
      for (const side of [-1, 1]) {
        E(side * 8, 4, 7.5, 12);
        E(side * 7, -7, 5.5, 6);
      }
      break;
    case 'deer': // zwei schmale Hufhälften, vorne spitz
      for (const side of [-1, 1]) {
        E(side * 4.5, 6, 4, 9.5);
        E(side * 4, -4, 3, 7);
        E(side * 3.2, -11, 1.8, 3.5);
      }
      break;
    case 'stag': // wie beim Reh, größer, dahinter zwei kleine Afterklauen
      for (const side of [-1, 1]) {
        E(side * 6, 3, 5.5, 11);
        E(side * 5.2, -8, 4, 7);
        E(side * 4.2, -15, 2.2, 3.2);
        E(side * 7.5, 17, 1.8, 1.8);
      }
      break;
    case 'fox': // vier schmale Zehen mit Krallen und ein kleiner Ballen
      E(0, 7, 6, 5);
      E(0, 11, 3, 2);
      for (const [x, y] of [[-7, -4], [-2.5, -10], [2.5, -10], [7, -4]]) {
        E(x, y, 2.6, 3.6);
        E(x * 1.15, y - 5.5, 0.9, 1.4); // Kralle
      }
      break;
    case 'squirrel': // lange, dünne Finger mit spitzen Krallen
      E(0, 9, 4.5, 4);
      for (const deg of [-150, -110, -70, -30]) {
        const [tx, ty] = ray(0, 8, deg, 13, 1.7, 1.1);
        ray(tx, ty, deg, 4, 0.9, 0.5); // Kralle
      }
      break;
    case 'zebra': { // Unpaarhufer wie das Pferd: ein einziger runder Huf, hinten offen, innen der Strahl
      for (let a = -200; a <= 20; a += 6) {
        const r = (a * Math.PI) / 180;
        E(Math.cos(r) * 10, Math.sin(r) * 12 + 1, 3, 3);
      }
      stroke(0, -3, -4, 10, 1.6, 1.1);
      stroke(0, -3, 4, 10, 1.6, 1.1);
      break;
    }
    case 'meerkat': // vier Zehen mit langen Grabkrallen
      E(0, 8, 5.5, 5);
      for (const deg of [-140, -105, -75, -40]) {
        const [tx, ty] = ray(0, 6, deg, 8, 2.4, 1.8);
        ray(tx, ty, deg, 7, 1.1, 0.5); // lange Kralle
      }
      break;
    case 'lion': // wie eine riesige Katzenpfote: großer Ballen, vier Zehen, keine Krallenspuren
      E(0, 9, 9, 7);
      E(-6, 12, 4.5, 5);
      E(6, 12, 4.5, 5);
      for (const [x, y] of [[-12, -3], [-4.5, -10.5], [4.5, -10.5], [12, -3]]) E(x, y, 3.8, 5);
      break;
    case 'crocodile': // fünf gespreizte Zehen mit Krallen und die Schleifspur des Schwanzes
      E(0, 2, 6, 5);
      for (const deg of [-165, -125, -90, -55, -15]) {
        const [tx, ty] = ray(0, 1, deg, 9, 2, 1.4);
        ray(tx, ty, deg, 4, 0.9, 0.5);
      }
      stroke(-16, 16, 0, 13, 1.4, 1.4);
      stroke(0, 13, 16, 16, 1.4, 1.4);
      break;
    case 'koi': // Koi: wie beim Fisch, keine Füße
    case 'fish': { // Fischumriss mit Wellen darunter
      E(-3, -2, 12, 6.5);
      c.poly([[cx + 7 * s, cy - 2 * s], [cx + 18 * s, cy - 9 * s], [cx + 18 * s, cy + 5 * s]], col);
      c.ellipse(cx - 10 * s, cy - 3.5 * s, Math.max(0.7, 1.4 * s), Math.max(0.7, 1.4 * s), hex('#f2e2c0'));
      for (const x of [-14, -2, 10]) {
        stroke(x - 4, 13, x, 11, 1, 1);
        stroke(x, 11, x + 4, 13, 1, 1);
      }
      break;
    }
  }
}

// Große Fußspur für die Anzeige-Tafel (doppelte Auflösung, 48x48)
function printImage(kind) {
  const c = new Canvas(48, 48);
  drawPrint(kind, c, 24, 25, 1);
  return c;
}

// Holzschild für das Gehegetor mit den Fußspuren der erlaubten Tiere (doppelte Auflösung)
function enclosureSign(kinds) {
  const o = new Canvas(96, 72);
  o.rect(5, 12, 86, 56, hex('#a8743f'));
  o.rect(5, 12, 86, 3, hex('#c8935a'));
  o.rect(10, 18, 76, 45, hex('#e8c48a'));
  for (const x of [9, 85]) o.rect(x, 14, 3, 3, hex('#5e5a54')); // Nägel
  // Schnüre, an denen es am Zaun hängt
  o.line(18, 12, 26, 0, hex('#6a5a4a'));
  o.line(78, 12, 70, 0, hex('#6a5a4a'));
  o.outline(INK);
  const step = 76 / kinds.length;
  const size = kinds.length === 1 ? 1 : kinds.length === 2 ? 0.82 : 0.6;
  kinds.forEach((k, i) => drawPrint(k, o, 10 + step * (i + 0.5), 40, size));
  return o;
}

// Netz-Zaun der Voliere entlang der tx-Achse: dünne Stangen mit geknotetem Seilnetz, oben durchhängend
function netFence() {
  const a = [16, 36];
  const b = [48, 52];
  const H = 32;
  const sag = (u) => 3 * Math.sin((Math.PI * u) / (b[0] - a[0])); // so weit hängt das obere Seil durch
  const net = new Canvas(64, 64);
  for (let y = 0; y < 64; y++) {
    for (let x = a[0]; x <= b[0]; x++) {
      const u = x - a[0];
      const v = y - (a[1] + u * 0.5); // Höhe über der Grundlinie (negativ = oben)
      if (v > 0 || v < -H + sag(u)) continue;
      const k1 = (((Math.round(u + v * 1.4) % 7) + 7) % 7) === 0;
      const k2 = (((Math.round(u - v * 1.4) % 7) + 7) % 7) === 0;
      if (k1 && k2) net.set(x, y, hex('#8a7a5a')); // Knoten
      else if (k1 || k2) net.set(x, y, hex('#d8c89a', 230));
    }
  }
  const o = new Canvas(64, 64);
  // oberes Halteseil
  for (let u = 0; u <= b[0] - a[0]; u++) o.set(a[0] + u, a[1] + u * 0.5 - H + sag(u), hex('#7a6a4a'));
  // dünne Stangen
  for (const [x, y] of [a, b]) {
    o.rect(x - 1, y - H - 3, 2, H + 4, hex('#7a5a3a'));
    o.set(x - 1, y - H - 3, hex('#a8845a'));
  }
  const c = new Canvas(64, 64);
  c.line(a[0], a[1] + 1, b[0], b[1] + 1, SHADOW);
  c.draw(net, 0, 0);
  c.draw(o, 0, 0);
  return c;
}

// Fläche zwischen den Enden in Höhe h0..h1 über der Grundlinie mit einem Muster füllen
function fillPanel(c, h0, h1, colorAt) {
  for (let y = 0; y < 64; y++) {
    for (let x = ZA[0]; x <= ZB[0]; x++) {
      const u = x - ZA[0];
      const v = ZA[1] + u * 0.5 - y; // Höhe über der Grundlinie
      if (v < h0 || v > h1) continue;
      const col = colorAt(u, v);
      if (col) c.set(x, y, col);
    }
  }
}

// Dichter Maschendrahtzaun (Teich): Metallpfosten, Oberrohr und feines Rautengeflecht
function chainFence() {
  const H = 22;
  const mesh = new Canvas(64, 64);
  fillPanel(mesh, 1, H, (u, v) => {
    const k1 = (((Math.round(u + v * 1.3) % 3) + 3) % 3) === 0;
    const k2 = (((Math.round(u - v * 1.3) % 3) + 3) % 3) === 0;
    return k1 || k2 ? hex('#b8c0c8', 235) : hex('#d8e0e8', 50);
  });
  const o = new Canvas(64, 64);
  for (let k = 0; k < 2; k++) o.line(ZA[0], ZA[1] - H + k, ZB[0], ZB[1] - H + k, k === 0 ? hex('#c8d0d8') : hex('#7a828a'));
  for (const [x, y] of [ZA, ZB]) {
    o.rect(x - 1, y - H - 1, 3, H + 2, hex('#8a9298'));
    o.rect(x - 1, y - H - 1, 1, H + 2, hex('#c0c8d0'));
  }
  o.outline(hex('#3a4046'));
  const c = new Canvas(64, 64);
  c.line(ZA[0], ZA[1] + 1, ZB[0], ZB[1] + 1, SHADOW);
  c.draw(mesh, 0, 0);
  c.draw(o, 0, 0);
  return c;
}

// Tor aus Maschendraht mit Metallrahmen
function chainGate() {
  const H = 21;
  const mesh = new Canvas(64, 64);
  fillPanel(mesh, 2, H - 1, (u, v) => {
    const k1 = (((Math.round(u + v * 1.3) % 3) + 3) % 3) === 0;
    const k2 = (((Math.round(u - v * 1.3) % 3) + 3) % 3) === 0;
    return k1 || k2 ? hex('#b8c0c8', 235) : null;
  });
  const o = new Canvas(64, 64);
  for (const h of [1, H]) for (let k = 0; k < 2; k++) o.line(ZA[0], ZA[1] - h + k, ZB[0], ZB[1] - h + k, k === 0 ? hex('#c8d0d8') : hex('#7a828a'));
  for (const [x, y] of [[ZA[0] + 1, ZA[1] + 0.5], [ZB[0] - 1, ZB[1] - 0.5], [32, 44]]) o.rect(Math.round(x) - 1, Math.round(y) - H, 2, H, hex('#8a9298'));
  o.outline(hex('#3a4046'));
  const c = new Canvas(64, 64);
  c.line(ZA[0], ZA[1] + 1, ZB[0], ZB[1] + 1, SHADOW);
  c.draw(mesh, 0, 0);
  c.draw(o, 0, 0);
  return c;
}

// Glastür für das Katzenhaus: Holzrahmen, Glasscheiben mit Spiegelung und eine kleine Katzenklappe
// withFlap: mit Katzenklappe (nur der mittlere Flügel)
function glassDoor(withFlap) {
  const H = 32; // so hoch wie die Gitterwände
  const glass = new Canvas(64, 64);
  fillPanel(glass, 2, H - 2, (u, v) => {
    if ((u + Math.round(v * 0.8)) % 13 === 4 || (u + Math.round(v * 0.8)) % 13 === 5) return hex('#ffffff', 200); // Spiegelung
    return hex('#bfe6f5', 150);
  });
  // Katzenklappe unten in der Mitte
  if (withFlap) fillPanel(glass, 2, 9, (u, v) => (u >= 12 && u <= 20 ? (v >= 8 || u === 12 || u === 20 ? hex('#5e3a20') : hex('#8a6a4a')) : null));
  const o = new Canvas(64, 64);
  const at = (t, h) => [Math.round(ZA[0] + (ZB[0] - ZA[0]) * t), Math.round(ZA[1] + (ZB[1] - ZA[1]) * t - h)];
  for (const h of [1, H, 16]) {
    const [x0, y0] = at(0, h);
    const [x1, y1] = at(1, h);
    for (let k = 0; k < 2; k++) o.line(x0, y0 + k, x1, y1 + k, k === 0 ? hex('#c8935a') : hex('#8a5a30'));
  }
  for (const t of [0, 1]) {
    const [x, y] = at(t, 0);
    o.rect(x - 1, y - H - 1, 3, H + 2, hex('#a8743f'));
  }
  const [hx, hy] = at(0.82, 15);
  o.rect(hx, hy, 2, 2, hex('#f0c040')); // Türgriff
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.line(ZA[0], ZA[1] + 1, ZB[0], ZB[1] + 1, SHADOW);
  c.draw(glass, 0, 0);
  c.draw(o, 0, 0);
  return c;
}

// Großes Tor der Voliere: so hoch wie das Netz, Holzrahmen mit Strebe und Netz darin
function netGate() {
  const H = 32;
  const net = new Canvas(64, 64);
  fillPanel(net, 2, H - 2, (u, v) => {
    const k1 = (((Math.round(u + v * 1.4) % 7) + 7) % 7) === 0;
    const k2 = (((Math.round(u - v * 1.4) % 7) + 7) % 7) === 0;
    return k1 && k2 ? hex('#8a7a5a') : k1 || k2 ? hex('#d8c89a', 230) : null;
  });
  const o = new Canvas(64, 64);
  const at = (t, h) => [Math.round(ZA[0] + (ZB[0] - ZA[0]) * t), Math.round(ZA[1] + (ZB[1] - ZA[1]) * t - h)];
  for (const h of [2, H]) {
    const [x0, y0] = at(0, h);
    const [x1, y1] = at(1, h);
    for (let k = 0; k < 2; k++) o.line(x0, y0 + k, x1, y1 + k, k === 0 ? hex('#c8935a') : hex('#8a5a30'));
  }
  for (const t of [0.03, 0.97]) {
    const [x, y] = at(t, 0);
    o.rect(x - 1, y - H, 2, H, hex('#a8743f'));
  }
  const [dx0, dy0] = at(0.05, 3);
  const [dx1, dy1] = at(0.95, H - 1);
  for (let k = 0; k < 2; k++) o.line(dx0, dy0 + k, dx1, dy1 + k, k === 0 ? hex('#c8935a') : hex('#8a5a30'));
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.line(ZA[0], ZA[1] + 1, ZB[0], ZB[1] + 1, SHADOW);
  c.draw(net, 0, 0);
  c.draw(o, 0, 0);
  return c;
}

// Eckpfosten (steht in der Kachelmitte), passend zur Zaunart
function fencePost(kind) {
  const o = new Canvas(64, 64);
  const [x, y] = [32, 44];
  if (kind === 'wood') {
    o.rect(x - 2, y - 18, 4, 19, hex('#b07a42'));
    o.rect(x - 2, y - 18, 1, 19, hex('#d29c62'));
    o.rect(x + 1, y - 18, 1, 19, hex('#8a5a30'));
    o.rect(x - 2, y - 18, 4, 1, hex('#e0b07a'));
    o.outline(INK);
  } else if (kind === 'mesh') {
    o.rect(x - 2, y - 34, 4, 35, hex('#b07a42'));
    o.rect(x - 2, y - 34, 1, 35, hex('#d29c62'));
    o.rect(x + 1, y - 34, 1, 35, hex('#8a5a30'));
    o.outline(INK);
  } else if (kind === 'tall') {
    // eigene, höhere Fläche (siehe tallFence)
    const t = new Canvas(64, 80);
    t.rect(x - 3, 60 - 42, 6, 43, hex('#8a6440'));
    t.rect(x - 3, 60 - 42, 2, 43, hex('#a8845a'));
    t.rect(x + 2, 60 - 42, 1, 43, hex('#5e4228'));
    t.rect(x - 3, 60 - 42, 6, 1, hex('#c8a47a'));
    t.outline(INK);
    return t;
  } else if (kind === 'net') {
    o.rect(x - 1, y - 35, 2, 36, hex('#7a5a3a'));
    o.set(x - 1, y - 35, hex('#a8845a'));
  } else {
    o.rect(x - 1, y - 23, 3, 24, hex('#8a9298'));
    o.rect(x - 1, y - 23, 1, 24, hex('#c0c8d0'));
    o.outline(hex('#3a4046'));
  }
  return o;
}

// Hoher Wildzaun (Savanne): dicke Holzpfähle mit gespannten Drähten, oben ein Balken.
// Höher als die anderen Zäune, daher auf einer 80 Pixel hohen Fläche (Kachelmitte bei 32/60).
function tallFence() {
  const H = 42;
  const o = new Canvas(64, 80);
  // Drähte
  for (const h of [6, 14, 22, 30]) o.line(TA[0], TA[1] - h, TB[0], TB[1] - h, hex('#9aa0a6'));
  // oberer Balken
  for (let k = 0; k < 3; k++) o.line(TA[0], TA[1] - H + 3 + k, TB[0], TB[1] - H + 3 + k, k === 0 ? hex('#c8a47a') : k === 1 ? hex('#a8845a') : hex('#6e4c2e'));
  for (const [x, y] of [TA, TB]) {
    o.rect(x - 3, y - H, 6, H + 1, hex('#8a6440'));
    o.rect(x - 3, y - H, 2, H + 1, hex('#a8845a'));
    o.rect(x + 2, y - H, 1, H + 1, hex('#5e4228'));
  }
  o.outline(INK);
  const c = new Canvas(64, 80);
  c.line(TA[0], TA[1] + 1, TB[0], TB[1] + 1, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Großes Tor im Wildzaun: Holzrahmen so hoch wie der Zaun, Strebe und Drahtgitter
function tallGate() {
  const H = 42;
  const mesh = new Canvas(64, 80);
  for (let y = 0; y < 80; y++) {
    for (let x = TA[0]; x <= TB[0]; x++) {
      const u = x - TA[0];
      const v = TA[1] + u * 0.5 - y;
      if (v < 2 || v > H - 2) continue;
      const k1 = (((Math.round(u + v * 1.3) % 6) + 6) % 6) === 0;
      const k2 = (((Math.round(u - v * 1.3) % 6) + 6) % 6) === 0;
      if (k1 || k2) mesh.set(x, y, hex('#a8b0b6', 220));
    }
  }
  const o = new Canvas(64, 80);
  const at = (t, h) => [Math.round(TA[0] + (TB[0] - TA[0]) * t), Math.round(TA[1] + (TB[1] - TA[1]) * t - h)];
  for (const h of [2, H / 2, H]) {
    const [x0, y0] = at(0, h);
    const [x1, y1] = at(1, h);
    for (let k = 0; k < 2; k++) o.line(x0, y0 + k, x1, y1 + k, k === 0 ? hex('#c8a47a') : hex('#6e4c2e'));
  }
  for (const t of [0.03, 0.97]) {
    const [x, y] = at(t, 0);
    o.rect(x - 1, y - H, 3, H, hex('#8a6440'));
  }
  const [dx0, dy0] = at(0.05, 3);
  const [dx1, dy1] = at(0.95, H / 2 - 1);
  for (let k = 0; k < 2; k++) o.line(dx0, dy0 + k, dx1, dy1 + k, k === 0 ? hex('#c8a47a') : hex('#6e4c2e'));
  o.outline(INK);
  const c = new Canvas(64, 80);
  c.line(TA[0], TA[1] + 1, TB[0], TB[1] + 1, SHADOW);
  c.draw(mesh, 0, 0);
  c.draw(o, 0, 0);
  return c;
}

// Kleine Erdhöhle (Fuchsbau): Erdhügel mit dunklem Eingang, Wurzeln und Grasbüscheln; Mitte bei (32, 44)
// sand: sandfarbene Variante für die Savanne (Erdmännchenbau)
function foxDen(sand = false) {
  const o = new Canvas(64, 56);
  o.ellipse(32, 36, 26, 15, hex(sand ? '#a8844e' : '#6b4a2c')); // Erdhügel
  o.ellipse(30, 32, 22, 11, hex(sand ? '#c8a46a' : '#8a6440'), true);
  o.ellipse(26, 28, 11, 5, hex(sand ? '#e0c48c' : '#a8845a'), true);
  o.ellipse(36, 41, 11, 8, hex('#2a1a10')); // Eingang
  o.ellipse(36, 42, 8, 5.5, hex('#120a06'), true);
  // Wurzeln über dem Eingang
  o.line(26, 34, 30, 38, hex('#4e3220'));
  o.line(44, 33, 41, 38, hex('#4e3220'));
  o.line(35, 32, 36, 36, hex('#4e3220'));
  // Steine und Gras am Rand
  o.ellipse(13, 41, 3, 2, hex('#8a8a80'));
  o.ellipse(52, 43, 2.5, 1.8, hex('#8a8a80'));
  for (const [x, y] of [[18, 25], [44, 24], [32, 21], [10, 36], [55, 37]]) {
    o.line(x, y, x - 2, y - 4, hex('#4f8a2f'));
    o.line(x, y, x + 1, y - 5, hex('#66a23a'));
    o.line(x, y, x + 3, y - 3, hex('#4f8a2f'));
  }
  o.outline(INK);
  return withShadow(64, 56, 32, 48, 27, 5, o);
}

// ---------- Asien ----------

// sattes, moosiges Gras; Variante 2 mit ein paar Kirschblütenblättern
function asiaGrass(variant) {
  const base = hex('#5fae4a');
  const light = hex('#78c45c');
  const dark = hex('#4c963c');
  const c = tile(() => {
    const r = rand();
    return r < 0.09 ? dark : r < 0.15 ? light : base;
  });
  const blades = variant === 0 ? 9 : 13;
  for (let n = 0; n < blades; n++) {
    const x = randInt(6, 57);
    const y = randInt(4, 28);
    if (!inDiamond(x, y) || !inDiamond(x, y - 2)) continue;
    c.paint(x, y, hex('#3a7a2f'));
    c.paint(x, y - 1, hex('#4a8c36'));
    c.paint(x + (rand() < 0.5 ? -1 : 1), y - 2, hex('#9cd870'));
  }
  if (variant === 2) {
    for (let n = 0; n < 4; n++) {
      const x = randInt(12, 50);
      const y = randInt(8, 24);
      c.paint(x, y, hex('#f6b8d0'));
      c.paint(x + 1, y, hex('#ffd8e6'));
    }
  }
  return c;
}

// Weg aus hellen Trittsteinen mit Moos in den Fugen
function asiaPath() {
  const c = tile(() => (rand() < 0.15 ? hex('#6f8a4a') : hex('#7d965a')));
  const stones = [[16, 16, 9, 5], [32, 9, 9, 4.5], [48, 16, 9, 5], [32, 23, 10, 5], [22, 10, 5, 3], [42, 22, 5, 3]];
  for (const [x, y, rx, ry] of stones) {
    c.ellipse(x, y, rx, ry, hex('#9a9488'), true);
    c.ellipse(x - 1, y - 1, rx - 1.5, ry - 1.2, hex('#bdb6a6'), true);
    c.ellipse(x - 2.5, y - 1.8, rx * 0.4, ry * 0.35, hex('#d6d0c0'), true);
  }
  return c;
}

// Wasser des Koi-Teichs: dunkleres Grünblau, Variante 1 mit Seerosenblättern, Variante 2 mit Lotusblüte
function asiaWater(variant) {
  const c = tile(() => (rand() < 0.06 ? hex('#2f7f9c') : hex('#3b8fae')));
  for (let n = 0; n < 5; n++) {
    const x = randInt(10, 50);
    const y = randInt(6, 25);
    for (let i = 0; i < randInt(3, 6); i++) c.paint(x + i, y, hex('#7fc8de'));
  }
  if (variant > 0) {
    const pads = variant === 1 ? [[22, 13], [41, 20]] : [[30, 17]];
    for (const [x, y] of pads) {
      c.ellipse(x, y, 6, 3.5, hex('#2f7a2f'), true);
      c.ellipse(x - 1, y - 0.5, 4.5, 2.5, hex('#4f9c3c'), true);
      c.line(x, y, x + 5, y - 1, hex('#3b8fae'));
    }
    if (variant === 2) {
      // Lotusblüte
      c.ellipse(30, 14, 3, 2, hex('#e888b0'), true);
      c.ellipse(29, 13, 1.5, 1.5, hex('#ffd0e4'), true);
      c.paint(30, 12, hex('#ffe680'));
    }
  }
  return c;
}

// heiße Quelle: milchig türkises Wasser mit hellen Schlieren (der Dampf kommt im Spiel dazu)
function hotSpring() {
  const c = tile(() => (rand() < 0.1 ? hex('#7fcfc6') : hex('#94dcd2')));
  for (let n = 0; n < 7; n++) {
    const x = randInt(8, 52);
    const y = randInt(6, 25);
    for (let i = 0; i < randInt(3, 7); i++) c.paint(x + i, y, hex('#d8f6f0'));
  }
  return c;
}

// Bambus: ein Büschel hoher Halme mit Knoten und schmalen Blättern; Fuß bei (24, 118)
function bamboo() {
  const o = new Canvas(48, 128);
  const stalks = [[14, 22], [20, 8], [27, 14], [33, 4], [38, 26]];
  for (const [x, top] of stalks) {
    o.rect(x, top, 4, 118 - top, hex('#6aa83a'));
    o.rect(x, top, 1, 118 - top, hex('#a6d468'));
    o.rect(x + 3, top, 1, 118 - top, hex('#3f7a2a'));
    for (let y = top + 10; y < 116; y += 13) o.rect(x - 1, y, 6, 2, hex('#4a8a30')); // Knoten
  }
  // Blätter: schmale, schräg hängende Ellipsen oben
  for (let n = 0; n < 26; n++) {
    const [x, top] = stalks[n % stalks.length];
    const y = top + randInt(4, 50);
    const dir = rand() < 0.5 ? -1 : 1;
    for (let i = 0; i < 9; i++) {
      o.paint(x + 2 + dir * (2 + i), y + Math.floor(i / 2), i < 6 ? hex('#3f8a2a') : hex('#5aa83a'));
      o.paint(x + 2 + dir * (2 + i), y + Math.floor(i / 2) + 1, hex('#2f6a22'));
    }
  }
  o.outline(INK);
  return withShadow(48, 128, 24, 118, 14, 4, o);
}

// hohes Gras (Versteck): dichte, lange Halme, man kann hindurchgehen; Fuß bei (32, 40)
function tallGrass() {
  const o = new Canvas(64, 48);
  for (let n = 0; n < 46; n++) {
    const x = randInt(8, 56);
    const base = 40 - Math.abs(x - 32) * 0.25 + randInt(-2, 2);
    const h = randInt(18, 30);
    const lean = (rand() * 2 - 1) * 6;
    const col = [hex('#4f8a2f'), hex('#5f9c36'), hex('#76b244')][n % 3];
    o.line(x, base, Math.round(x + lean), Math.round(base - h), col);
    o.paint(Math.round(x + lean), Math.round(base - h), hex('#b8e07a'));
  }
  o.outline(hex('#2f5a1f'));
  return o;
}

// hoher Dschungelbaum: langer Stamm mit Brettwurzeln und Lianen, große dunkle Krone; Fuß bei (48, 150)
function jungleTree() {
  const o = new Canvas(96, 160);
  o.rect(42, 64, 12, 86, hex('#6b5a48'));
  o.rect(42, 64, 3, 86, hex('#8a7660'));
  o.rect(51, 64, 3, 86, hex('#4f4234'));
  // Brettwurzeln
  o.poly([[42, 128], [30, 151], [42, 151]], hex('#5e4e3e'));
  o.poly([[54, 128], [66, 151], [54, 151]], hex('#4f4234'));
  o.poly([[46, 136], [44, 153], [52, 153], [50, 136]], hex('#6b5a48'));
  foliage(
    o,
    [
      [48, 40, 26],
      [24, 52, 16],
      [72, 52, 16],
      [32, 26, 16],
      [64, 26, 16],
      [48, 16, 14],
      [48, 60, 16],
    ],
    ['#1f5a2a', '#2c7232', '#3f8a3c', '#5aa84c'],
  );
  // Lianen
  for (const [x, len] of [[30, 34], [60, 44], [40, 26]]) {
    o.line(x, 60, x + 1, 60 + len, hex('#3f7a2a'));
    for (let y = 64; y < 60 + len; y += 6) o.paint(x + (y % 12 ? 1 : -1), y, hex('#5aa83a'));
  }
  o.outline(INK);
  return withShadow(96, 160, 48, 150, 28, 8, o);
}

// Kirschbaum: wie der Apfelbaum, aber mit rosa Blüten; Fuß bei (32, 82)
function cherryTree() {
  const o = new Canvas(64, 96);
  o.rect(29, 56, 6, 26, hex('#5a3a30'));
  o.rect(29, 56, 2, 26, hex('#7a5246'));
  o.line(32, 60, 20, 48, hex('#5a3a30'));
  o.line(32, 58, 44, 46, hex('#5a3a30'));
  foliage(
    o,
    [
      [32, 34, 19],
      [17, 44, 12],
      [47, 44, 12],
      [23, 24, 12],
      [41, 24, 12],
      [32, 15, 10],
    ],
    ['#c25a86', '#e07ca4', '#f2a6c4', '#ffd6e6'],
  );
  for (let n = 0; n < 16; n++) o.paint(randInt(14, 50), randInt(12, 52), hex('#ffffff'));
  o.outline(INK);
  const c = withShadow(64, 96, 32, 82, 20, 7, o);
  // ein paar Blütenblätter am Boden
  for (let n = 0; n < 8; n++) c.paint(randInt(14, 50), randInt(78, 88), hex('#f6b8d0'));
  return c;
}

// flacher, sonnenwarmer Felsen zum Sonnen; Fuß bei (40, 40)
function sunRock() {
  const o = new Canvas(80, 48);
  o.ellipse(40, 32, 34, 13, hex('#9a8e7a'));
  o.ellipse(39, 29, 31, 10, hex('#bfb29a'), true);
  o.ellipse(34, 26, 20, 5, hex('#dcd0b6'), true);
  o.ellipse(30, 25, 9, 2, hex('#f2e8cc'), true);
  o.line(52, 30, 60, 35, hex('#7a6e5c'));
  o.line(20, 33, 28, 35, hex('#7a6e5c'));
  o.outline(hex('#3b3226'));
  return withShadow(80, 48, 40, 40, 34, 6, o);
}

// Steinlaterne; Fuß bei (16, 50)
function stoneLantern() {
  const o = new Canvas(32, 56);
  const stone = hex('#a8a296');
  const light = hex('#c8c2b4');
  o.rect(8, 44, 16, 6, stone); // Sockel
  o.rect(8, 44, 16, 2, light);
  o.rect(13, 30, 6, 14, stone); // Säule
  o.rect(13, 30, 2, 14, light);
  o.rect(9, 26, 14, 4, stone);
  o.rect(10, 16, 12, 10, hex('#8a8478')); // Lichtkasten
  o.rect(13, 18, 6, 6, hex('#ffd86a')); // Licht
  o.rect(14, 19, 2, 2, hex('#fff2b8'));
  o.poly([[4, 16], [16, 7], [28, 16]], stone); // Dach
  o.line(4, 16, 28, 16, light);
  o.rect(15, 3, 3, 4, stone); // Knauf
  o.outline(INK);
  return withShadow(32, 56, 16, 50, 9, 3, o);
}

// rotes Tor (Torii) quer über dem Weg: der Weg läuft entlang ty, das Tor steht entlang tx.
// Kachelmitte bei (64, 100); die Pfosten stehen auf den Nachbarkacheln links oben und rechts unten.
function torii() {
  const o = new Canvas(128, 128);
  const P1 = [32, 84];
  const P2 = [96, 116];
  const red = hex('#d63a2a');
  const beam = (dy, ext, thick, col) => {
    for (let k = 0; k < thick; k++) {
      o.line(P1[0] - ext, P1[1] - dy - ext / 2 + k, P2[0] + ext, P2[1] - dy + ext / 2 + k, col);
    }
  };
  // Pfosten mit schwarzem Fuß
  for (const [x, y] of [P1, P2]) {
    o.rect(x - 3, y - 66, 7, 66, red);
    o.rect(x - 3, y - 66, 2, 66, hex('#f06a50'));
    o.rect(x + 2, y - 66, 2, 66, hex('#a82a1e'));
    o.rect(x - 4, y - 7, 9, 7, hex('#2b2b2b'));
  }
  beam(50, 6, 4, red); // untere Querlatte (nuki)
  beam(64, 14, 5, red); // obere Querlatte (shimaki)
  beam(70, 18, 4, hex('#2b2b2b')); // schwarzer Deckbalken (kasagi)
  // nach oben geschwungene Enden des Deckbalkens
  o.line(P1[0] - 18, P1[1] - 79, P1[0] - 22, P1[1] - 84, hex('#2b2b2b'));
  o.line(P2[0] + 18, P2[1] - 61, P2[0] + 22, P2[1] - 66, hex('#2b2b2b'));
  // Namenstafel in der Mitte
  o.rect(61, 100 - 64 - 12, 6, 12, hex('#2b2b2b'));
  o.rect(62, 100 - 64 - 11, 4, 10, hex('#e8b84a'));
  o.outline(INK);
  const c = new Canvas(128, 128);
  for (const [x, y] of [P1, P2]) c.ellipse(x + 1, y, 7, 2.5, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Fischfutter: kleine Papiertüte mit roter Aufschrift, oben offen, bunte Futterflocken (doppelte Auflösung)
function koiFood() {
  const o = new Canvas(64, 64);
  o.poly([[18, 22], [46, 22], [50, 58], [14, 58]], hex('#e8d4a8')); // Tüte
  o.poly([[18, 22], [46, 22], [47, 30], [17, 30]], hex('#d4bc8c')); // umgeknickter Rand
  o.rect(14, 56, 36, 2, hex('#c8b080'));
  o.circle(32, 42, 8, hex('#d63a2a')); // roter Kreis mit Fisch
  o.ellipse(31, 42, 5, 2.5, hex('#ffffff'));
  o.poly([[35, 42], [39, 39], [39, 45]], hex('#ffffff'));
  // Flocken, die oben herausschauen
  for (const [x, y, c] of [[22, 19, '#f08a2c'], [27, 17, '#e8483f'], [32, 19, '#f2c84a'], [37, 16, '#f08a2c'], [42, 19, '#e8483f'], [30, 14, '#f2c84a']]) {
    o.rect(x, y, 4, 3, hex(c));
  }
  o.outline(INK);
  return o;
}

// Pfosten des Wegweisers ohne Bretter (gleicher Ankerpunkt wie signpost: Fuß bei (40, 60)), mit Kappe
function signpostPost() {
  const o = new Canvas(80, 64);
  o.rect(38, 4, 4, 57, hex('#8a5a30'));
  o.rect(38, 4, 1, 57, hex('#a8743f'));
  o.rect(37, 2, 6, 3, hex('#6e4424'));
  o.outline(INK);
  const c = new Canvas(80, 64);
  c.ellipse(40, 60, 9, 2.5, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Pflaster im Tierpark: helle Steine im Verband entlang der Iso-Achsen. Das Muster wiederholt sich alle 64 Pixel
// entlang beider Achsen, so passen benachbarte Kacheln nahtlos aneinander.
function parkPath() {
  const S = 16; // Steingröße entlang der Achsen
  const shades = ['#bcb6a8', '#aca698', '#c8c2b2', '#b2ac9e'];
  return tile((x, y) => {
    const a = x + 2 * y; // entlang tx
    let b = 2 * y - x; // entlang ty
    const ca = Math.floor(a / S);
    b += (((ca % 2) + 2) % 2) * (S / 2); // Reihen versetzt wie bei Pflastersteinen
    const cb = Math.floor(b / S);
    const ma = ((a % S) + S) % S;
    const mb = ((b % S) + S) % S;
    if (ma < 2 || mb < 2) return hex('#8e887c'); // Fugen
    if (ma < 4 || mb < 4) return hex('#d8d2c2'); // helle Kante oben links
    const k = (((ca % 4) + 4) % 4) * 4 + (((cb % 4) + 4) % 4);
    return hex(shades[(k * 7 + 3) % shades.length]);
  });
}

// Futterautomat im Tierpark: Holzkasten auf einem Pfosten, oben ein Fenster mit Körnern, unten die Ausgabeklappe,
// vorne ein Pfoten-Schild. Kachelmitte bei (32, 52)
function feederSprite() {
  const o = new Canvas(64, 64);
  o.rect(29, 34, 6, 18, hex('#8a5a30')); // Pfosten
  o.rect(29, 34, 2, 18, hex('#a8743f'));
  const P = isoBox(o, 32, 36, 0.55, 0.4, 26, '#c8935a', '#a8743f', '#8a5a30');
  // Fenster mit Körnern
  const [wx, wy] = P(-0.27, 0.2, 22);
  o.poly([[wx + 3, wy + 1], [wx + 15, wy + 7], [wx + 15, wy + 15], [wx + 3, wy + 9]], hex('#cfe8f0'));
  for (const [dx, dy, c] of [[5, 7, '#e8b84a'], [8, 9, '#c8962a'], [11, 11, '#e8b84a'], [6, 9, '#f2d27a'], [12, 13, '#c8962a'], [9, 12, '#e8b84a']]) o.rect(wx + dx, wy + dy, 2, 2, hex(c));
  // Ausgabeklappe
  const [kx, ky] = P(-0.05, 0.2, 6);
  o.poly([[kx - 3, ky - 1], [kx + 5, ky + 3], [kx + 5, ky + 7], [kx - 3, ky + 3]], hex('#5a3a20'));
  // Dach
  o.poly([...[P(-0.33, -0.25, 26), P(0.33, -0.25, 26), P(0.33, 0.25, 26), P(-0.33, 0.25, 26)].map(([x, y]) => [x, y]), [32, 4]], hex('#c8553d'));
  o.line(...P(-0.33, 0.25, 26), 32, 4, hex('#9c3a28'));
  o.line(...P(0.33, 0.25, 26), 32, 4, hex('#e07a5f'));
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.ellipse(32, 52, 12, 4, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Futtersack (Werkzeug, doppelte Auflösung): Jutesack mit Körnern, oben zugebunden
function parkFood() {
  const o = new Canvas(64, 64);
  o.ellipse(32, 42, 18, 16, hex('#c8a46a'));
  o.ellipse(29, 38, 11, 10, hex('#dcbd84'), true);
  o.poly([[24, 24], [40, 24], [36, 30], [28, 30]], hex('#b08850'));
  o.rect(26, 22, 12, 3, hex('#8a5a30')); // Schnur
  for (const [x, y] of [[30, 14], [34, 16], [28, 18], [36, 12], [32, 19]]) o.rect(x, y, 3, 3, hex('#e8b84a')); // Körner
  for (let k = 0; k < 4; k++) o.line(20 + k * 7, 36, 23 + k * 7, 54, hex('#b08850')); // Webmuster
  o.outline(INK);
  return o;
}

// ---------- Einrichtung der Hütten, je Gebiet passend zu den Wänden ----------
// Holz, Polster und Akzent je Gebiet (als Funktion statt Konstante, damit es schon im sprites-Objekt gilt)
function furnitureStyle(style) {
  return {
    meadow: { top: '#d29c62', left: '#8a5a30', right: '#a8743f', cushion: '#c8553d', cushion2: '#f2e2c0', accent: '#3f8a3f' },
    forest: { top: '#8a5a30', left: '#3f2a1a', right: '#5a3a22', cushion: '#5f7a3a', cushion2: '#7a9a4c', accent: '#e8b84a' },
    savanna: { top: '#e0c890', left: '#a08a58', right: '#c0a670', cushion: '#7a7a3a', cushion2: '#a8a860', accent: '#c8553d' },
    asia: { top: '#2b2b2b', left: '#7a1e18', right: '#a02a20', cushion: '#c0392b', cushion2: '#e8b84a', accent: '#e8b84a' },
  }[style];
}

// Schreibtisch an der hinteren Wand; Kachelmitte bei (32, 44)
function hutDeskStyled(style) {
  const s = furnitureStyle(style);
  const o = new Canvas(64, 64);
  const P = isoBox(o, 32, 40, 0.85, 0.45, 18, s.top, s.left, s.right); // etwas an die Wand gerückt
  // Schublade vorne
  const [dx, dy] = P(-0.3, 0.225, 14);
  o.poly([[dx, dy], [dx + 14, dy + 7], [dx + 14, dy + 11], [dx, dy + 4]], hex(s.right));
  o.rect(Math.round(dx) + 6, Math.round(dy) + 5, 2, 2, hex('#e8b84a'));
  if (style === 'asia') {
    // Papier mit Schriftzeichen, Pinsel und Tuschestein
    o.poly([P(-0.3, -0.12, 18.5), P(0.05, -0.12, 18.5), P(0.05, 0.12, 18.5), P(-0.3, 0.12, 18.5)], hex('#f4ead8'));
    o.line(...P(-0.25, 0, 19), ...P(0, 0, 19), hex('#2b2b2b'));
    o.line(...P(0.15, -0.1, 19), ...P(0.32, 0.05, 21), hex('#8a5a30'));
    const [ix, iy] = P(0.25, -0.12, 19);
    o.rect(Math.round(ix), Math.round(iy), 3, 2, hex('#1a1a1a'));
  } else {
    o.poly([P(-0.3, -0.15, 18.5), P(0.05, -0.15, 18.5), P(0.05, 0.1, 18.5), P(-0.3, 0.1, 18.5)], hex('#f4f0e0')); // Papier bzw. Karte
    if (style === 'savanna') o.line(...P(-0.25, -0.1, 19), ...P(0, 0.05, 19), hex('#c8553d')); // Route auf der Karte
    else o.line(...P(-0.25, -0.05, 19), ...P(0, -0.05, 19), hex('#8a8a8a'));
    const [lx, ly] = P(0.3, -0.1, 18);
    if (style === 'forest') {
      // Laterne
      o.rect(lx - 3, ly - 9, 6, 9, hex('#3f3f3f'));
      o.rect(lx - 2, ly - 8, 4, 6, hex('#f2c24a'));
      o.rect(lx - 1, ly - 11, 2, 2, hex('#3f3f3f'));
    } else if (style === 'savanna') {
      // Fernglas
      o.rect(lx - 4, ly - 5, 3, 5, hex('#3f3f3f'));
      o.rect(lx + 1, ly - 5, 3, 5, hex('#3f3f3f'));
      o.rect(lx - 1, ly - 4, 2, 2, hex('#5a5a5a'));
    } else {
      o.rect(lx - 1, ly - 8, 2, 8, hex('#4a4a4a')); // Lampe
      o.poly([[lx - 5, ly - 8], [lx + 5, ly - 8], [lx + 2, ly - 13], [lx - 2, ly - 13]], hex(s.accent));
    }
  }
  o.outline(INK);
  return o;
}

// Stuhl vor dem Schreibtisch, die Lehne zur Kamera; Kachelmitte bei (32, 44)
function hutChair(style) {
  const s = furnitureStyle(style);
  const o = new Canvas(64, 64);
  const cx = 32 + 15, cy = 44 - 8; // zum Tisch hin gerückt (Richtung hintere Wand)
  const P = (u, v, z = 0) => [cx + (u - v) * 32, cy + (u + v) * 16 - z];
  for (const [u, v] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) o.line(...P(u, v, 0), ...P(u, v, 10), hex(s.left)); // Beine
  o.poly([P(-0.17, -0.17, 10), P(0.17, -0.17, 10), P(0.17, 0.17, 10), P(-0.17, 0.17, 10)], hex(s.top)); // Sitz
  o.poly([P(-0.12, -0.12, 11), P(0.12, -0.12, 11), P(0.12, 0.12, 11), P(-0.12, 0.12, 11)], hex(s.cushion)); // Kissen
  // Lehne an der Seite zur Kamera (v = +0.17)
  if (style === 'savanna') {
    // Safari-Stuhl mit Stoffbespannung
    o.poly([P(-0.17, 0.17, 12), P(0.17, 0.17, 12), P(0.17, 0.17, 26), P(-0.17, 0.17, 26)], hex(s.cushion));
    o.line(...P(-0.17, 0.17, 19), ...P(0.17, 0.17, 19), hex(s.cushion2));
    for (const u of [-0.17, 0.17]) o.line(...P(u, 0.17, 0), ...P(u, 0.17, 27), hex(s.left));
  } else {
    for (const u of [-0.17, 0.17]) o.line(...P(u, 0.17, 0), ...P(u, 0.17, 27), hex(s.left));
    o.poly([P(-0.17, 0.17, 22), P(0.17, 0.17, 22), P(0.17, 0.17, 27), P(-0.17, 0.17, 27)], hex(style === 'asia' ? s.left : s.right));
    if (style === 'asia') o.line(...P(-0.17, 0.17, 27), ...P(0.17, 0.17, 27), hex(s.accent));
    else for (const u of [-0.06, 0.06]) o.line(...P(u, 0.17, 11), ...P(u, 0.17, 22), hex(s.right));
  }
  o.outline(INK);
  const c = new Canvas(64, 64);
  c.ellipse(cx, cy + 1, 10, 4, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Zimmerpflanze in der Ecke: Geranie (Wiese), Farn (Wald), Aloe (Savanne), Bonsai (Asien); Kachelmitte bei (32, 60)
function hutPlant(style) {
  const o = new Canvas(64, 80);
  const x = 32, y = 60 - 9; // in die Ecke gerückt
  const pot = { meadow: ['#c8603d', '#e07a5f'], forest: ['#6b4224', '#8a5a30'], savanna: ['#b8784a', '#d8986a'], asia: ['#3f6a9a', '#e8eef4'] }[style];
  if (style === 'asia') {
    // flache Schale mit Bonsai
    o.poly([[x - 11, y - 6], [x + 11, y - 6], [x + 8, y], [x - 8, y]], hex(pot[0]));
    o.line(x - 9, y - 4, x + 9, y - 4, hex(pot[1]));
    o.line(x, y - 6, x - 2, y - 14, hex('#6b4224'));
    o.line(x - 2, y - 14, x + 4, y - 20, hex('#6b4224'));
    o.line(x - 1, y - 6, x - 3, y - 14, hex('#5a3a20'));
    for (const [px, py, r] of [[x - 7, y - 16, 6], [x + 7, y - 22, 7], [x - 1, y - 26, 6]]) {
      o.ellipse(px, py, r, r * 0.55, hex('#3f7a3a'));
      o.ellipse(px - 1, py - 1, r * 0.6, r * 0.3, hex('#5f9a4c'), true);
    }
  } else {
    // Topf (im Wald ein Holzeimer)
    o.poly([[x - 7, y - 12], [x + 7, y - 12], [x + 5, y], [x - 5, y]], hex(pot[0]));
    o.rect(x - 8, y - 13, 16, 3, hex(pot[1]));
    if (style === 'forest') for (const yy of [y - 8, y - 3]) o.line(x - 6, yy, x + 6, yy, hex('#3f3f3f')); // Eisenreifen
    if (style === 'meadow') {
      for (const [dx, dy] of [[-8, -10], [8, -10], [-4, -16], [5, -17], [0, -12], [-10, -6], [10, -6]]) o.ellipse(x + dx, y - 12 + dy, 5, 3.5, hex('#3f8a3a'));
      for (const [dx, dy] of [[-6, -18], [6, -19], [0, -24], [-10, -13], [10, -14]]) {
        o.circle(x + dx, y - 12 + dy, 2.6, hex('#e8483f'));
        o.set(x + dx - 1, y - 13 + dy, hex('#ff9a8c'));
      }
    } else if (style === 'forest') {
      // Farnwedel: Bögen mit Fiederblättchen
      for (const dir of [-1, -0.4, 0.4, 1]) {
        for (let t = 0; t <= 1; t += 0.06) {
          const px = x + dir * 15 * t, py = y - 13 - 22 * Math.sin(t * Math.PI * 0.55) + 8 * t * t;
          o.set(px, py, hex('#3f7a2a'));
          if (t > 0.15) {
            o.set(px - 1, py - 2, hex('#5f9a3c'));
            o.set(px + 1, py - 2, hex('#5f9a3c'));
            o.set(px, py + 1, hex('#2f5a20'));
          }
        }
      }
      o.line(x, y - 13, x, y - 32, hex('#3f7a2a'));
      for (let k = 0; k < 6; k++) {
        o.set(x - 1, y - 16 - k * 3, hex('#5f9a3c'));
        o.set(x + 1, y - 17 - k * 3, hex('#5f9a3c'));
      }
    } else {
      // Aloe: spitze, fleischige Blätter
      for (const [dx, h] of [[-11, 14], [-6, 22], [0, 28], [6, 23], [11, 15], [-3, 18], [3, 19]]) {
        o.poly([[x + dx * 0.3 - 2, y - 13], [x + dx * 0.3 + 2, y - 13], [x + dx, y - 13 - h]], hex(h > 20 ? '#6a9a5a' : '#5a8a4a'));
        o.line(x + dx * 0.3, y - 13, x + dx * 0.9, y - 13 - h * 0.85, hex('#8ab87a'));
      }
    }
  }
  o.outline(INK);
  const c = new Canvas(64, 80);
  c.ellipse(x, y, 10, 3.5, SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Breites Wandregal an der hinteren Wand (darin liegen die Werkzeuge), steht auf dem Boden und ist nicht höher als
// die Hüttenwand: oben hängen Kescher und Lasso, unten stehen Dosen, ein Futterglas und eine Falle.
// Kachelmitte bei (64, 80)
function hutShelf(style) {
  const s = furnitureStyle(style);
  const o = new Canvas(128, 96);
  const V = -0.86; // Rückwand kurz vor der Hüttenwand
  const P = (u, v, z = 0) => [64 + (u - v) * 32, 80 + (u + v) * 16 - z];
  const U0 = -0.5, U1 = 0.72;
  const D = 0.26; // Tiefe der Bretter
  const TOP = 42; // knapp unter der Oberkante der Wand (44)
  // Rückwand mit Brettern (in der Savanne Bambus mit Knoten)
  o.poly([P(U0, V, 0), P(U1, V, 0), P(U1, V, TOP), P(U0, V, TOP)], hex(s.right));
  for (let u = U0 + 0.15; u < U1; u += 0.15) o.line(...P(u, V, 0), ...P(u, V, TOP), hex(s.left));
  if (style === 'savanna') o.line(...P(U0, V, 32), ...P(U1, V, 32), hex(s.top));
  // Seitenwangen bis zum Boden und drei Bretter
  for (const u of [U0, U1]) o.poly([P(u, V, 0), P(u, V + D, 0), P(u, V + D, TOP), P(u, V, TOP)], hex(s.left));
  for (const z of [3, 20, TOP]) {
    o.poly([P(U0, V, z), P(U1, V, z), P(U1, V + D, z), P(U0, V + D, z)], hex(s.top));
    o.poly([P(U0, V + D, z), P(U1, V + D, z), P(U1, V + D, z - 2), P(U0, V + D, z - 2)], hex(s.left));
  }
  // unten: Dosen, ein Glas mit Futter und eine Falle
  for (const [u, c, h] of [[-0.38, '#c8553d', 9], [-0.24, '#e8b84a', 7], [-0.1, '#cfe8f0', 11]]) {
    const [x, y] = P(u, V + D / 2, 3);
    o.rect(Math.round(x) - 3, Math.round(y) - h, 6, h, hex(c));
    o.rect(Math.round(x) - 3, Math.round(y) - h, 6, 2, hex('#ffffff', 110));
  }
  {
    const [x, y] = P(-0.1, V + D / 2, 3); // Körner im Glas
    for (const [dx, dy] of [[-1, -3], [1, -4], [0, -6]]) o.rect(Math.round(x) + dx, Math.round(y) + dy, 2, 2, hex('#c8962a'));
  }
  {
    const [x, y] = P(0.42, V + D / 2, 3);
    o.rect(Math.round(x) - 8, Math.round(y) - 9, 16, 9, hex('#9a9a9a'));
    for (let k = -7; k <= 7; k += 3) o.line(Math.round(x) + k, Math.round(y) - 9, Math.round(x) + k, Math.round(y) - 1, hex('#5a5a5a'));
    o.line(Math.round(x) - 8, Math.round(y) - 9, Math.round(x) + 7, Math.round(y) - 9, hex('#5a5a5a'));
  }
  // oben rechts: Lasso, aufgerollt an einem Haken, mit Schlinge
  {
    const [x, y] = P(0.4, V + 0.04, 31);
    o.rect(Math.round(x) - 1, Math.round(y) - 10, 2, 3, hex('#4a4a4a')); // Haken
    for (const [r, c] of [[8, '#8a5a30'], [6.5, '#d8b070'], [5, '#a8743f']]) o.ellipse(x, y, r, r * 0.8, hex(c));
    o.ellipse(x, y, 3, 2.4, hex(s.right)); // innen sieht man die Rückwand
    o.line(x + 5, y + 5, x + 7, y + 10, hex('#a8743f')); // loses Ende
  }
  // oben links: Kescher mit Netzbeutel, der Stiel steht vorne auf dem Boden
  {
    const [hx, hy] = P(-0.2, V + 0.08, 36);
    o.line(hx + 5, hy + 6, hx + 12, hy + 38, hex('#8a5a30')); // Stiel
    o.line(hx + 6, hy + 6, hx + 13, hy + 38, hex('#c8935a'));
    o.poly([[hx - 8, hy], [hx + 8, hy], [hx + 3, hy + 13], [hx - 3, hy + 13]], hex('#e8e8e0')); // Netzbeutel
    for (let k = -7; k <= 7; k += 3) o.line(hx + k, hy, hx + k * 0.35, hy + 13, hex('#a8a8a0'));
    o.line(hx - 6, hy + 6, hx + 6, hy + 6, hex('#a8a8a0'));
    o.ellipse(hx, hy, 9, 3.5, hex('#4a4a4a')); // Ring
    o.ellipse(hx, hy, 7, 2.2, hex('#e8e8e0'));
  }
  if (style === 'asia') for (const u of [U0, U1]) {
    const [x, y] = P(u, V, TOP);
    o.rect(Math.round(x) - 1, Math.round(y) - 2, 3, 3, hex(s.accent)); // goldene Ecken
  }
  o.outline(INK);
  // Schatten auf dem Boden vor dem Regal
  const c = new Canvas(128, 96);
  c.poly([P(U0, V, 0), P(U1, V, 0), P(U1, V + D + 0.08, 0), P(U0, V + D + 0.08, 0)], SHADOW);
  c.draw(o, 0, 0);
  return c;
}

// Boden in den Hütten: dunkle Dielen (Wald), Bastmatte (Savanne), Tatami (Asien)
function hutFloor(style) {
  return tile((x, y) => {
    const k = y - 0.5 * x; // Linien entlang tx
    const l = y + 0.5 * x; // Linien entlang ty
    if (style === 'forest') {
      const m = ((k % 6) + 6) % 6;
      if (m < 1) return hex('#2f1e12');
      const base = [hex('#7a4e2d'), hex('#6b4224'), hex('#845533')][((Math.floor(k / 6) % 3) + 3) % 3];
      return rand() < 0.06 ? hex('#5a3a20') : base;
    }
    if (style === 'savanna') {
      const a = (((Math.floor(k / 3) + Math.floor(l / 3)) % 2) + 2) % 2; // Flechtmuster
      return rand() < 0.05 ? hex('#b8a26c') : a ? hex('#e0c890') : hex('#cfb47a');
    }
    // Tatami: Strohgrün mit dunklen Kanten
    const m = ((k % 16) + 16) % 16;
    if (m < 1) return hex('#3f4a2a');
    return rand() < 0.3 ? hex('#c8c88a') : ((Math.floor(l) % 2) + 2) % 2 ? hex('#bcbc7a') : hex('#c4c482');
  });
}

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
