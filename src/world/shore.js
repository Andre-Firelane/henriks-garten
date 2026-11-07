// Uferstreifen: wo Gras ans Wasser grenzt, liegt ein schmaler Streifen Sand, Kies oder heller Schlamm (je nach Boden).
// Für jede Kachel am Wasser wird ein eigenes, halb durchsichtiges Bild erzeugt und über den Boden gemalt (unter dem
// Wasser bzw. den abgerundeten Wasserecken). Die Form folgt dem echten Wasserrand samt Rundungen (siehe roundedTiles.js),
// das Muster (Körnung, Kiesel, Flecken) hängt an der Weltposition, damit es über die Kachelgrenzen hinweg weiterläuft.
import Phaser from 'phaser';
import { CORNER, charAt, outerWaterCorners, outerLandCorners } from './map.js';
import { TILE_W, TILE_H } from './iso.js';
import { shrinkTexture } from './hd.js';

const RES = 2; // Bildschärfe (die Bodenflächen werden höchstens doppelt so fein gemalt, siehe bakeGround)
const ROUND = 0.45; // wie in roundedTiles.js
const WATER = '~owh≈BEŜƬƫř0'; // Wasser (auch unter Brücken und Felsen im Fluss) und Schlamm
const REACH = 1; // so weit (Kacheln) über die Kachel hinaus wird nach Wasser gesucht
const GRID = 20; // Abstands-Raster je Kachel
const BLEED = 0.04; // so weit (Kacheln) malt jede Kachel über ihren Rand: das Muster hängt an der Welt, die Überlappung fällt nicht auf

// Uferart nach dem Boden der Landkachel (Anfang des Bildnamens)
const STYLE_OF = [
  ['sgrass', 'savanna'], ['sdry', 'savanna'],
  ['fgrass', 'gravel'],
  ['agrass', 'pebbles'],
  ['jgrass', 'jungle'],
  ['grass', 'sand'],
];

// width: Breite des Streifens (Kacheln); base/wet: Farbe trocken bzw. direkt am Wasser; stones: Anteil Kiesel
const STYLES = {
  sand: { width: 0.42, base: [212, 192, 140], wet: [160, 140, 98], grain: 14, stones: 0.12, stone: [150, 140, 120] },
  gravel: { width: 0.36, base: [118, 108, 90], wet: [84, 78, 66], grain: 8, stones: 0.85, stone: [158, 152, 138] },
  savanna: { width: 0.44, base: [158, 118, 76], wet: [108, 76, 46], grain: 16, stones: 0.06, stone: [170, 150, 120], mottle: 22 },
  pebbles: { width: 0.32, base: [150, 142, 124], wet: [110, 104, 92], grain: 8, stones: 0.9, stone: [196, 192, 182] },
  jungle: { width: 0.36, base: [138, 106, 68], wet: [92, 70, 46], grain: 10, stones: 0.15, stone: [120, 112, 98], mottle: 14 },
};

export function shoreStyle(groundKey) {
  if (typeof groundKey !== 'string') return null;
  const hit = STYLE_OF.find(([prefix]) => groundKey.startsWith(prefix));
  return hit ? hit[1] : null;
}

const isWaterChar = (c) => c !== undefined && c !== ' ' && WATER.includes(c);

// Liegt der Punkt (in Kachelkoordinaten der Welt) im Wasser? Abgerundete Wasserecken sind Land, abgerundete Landecken Wasser
function waterAt(A, B) {
  const tx = Math.floor(A), ty = Math.floor(B);
  const c = charAt(tx, ty);
  if (c === undefined || c === ' ') return false;
  const water = isWaterChar(c);
  const mask = water ? ('~owh≈'.includes(c) ? outerWaterCorners(tx, ty) : 0) : outerLandCorners(tx, ty);
  return cut(A - tx, B - ty, mask) ? !water : water;
}

// liegt (a, b) in einer abgerundeten Ecke? (wie in roundedTiles.js)
function cut(a, b, mask) {
  if (!mask) return false;
  for (const [bit, ca, cb] of [[CORNER.top, 0, 0], [CORNER.right, 1, 0], [CORNER.bottom, 1, 1], [CORNER.left, 0, 1]]) {
    if (!(mask & bit)) continue;
    const da = (a - ca) * (ca ? -1 : 1), db = (b - cb) * (cb ? -1 : 1);
    if (da < ROUND && db < ROUND && Math.hypot(ROUND - da, ROUND - db) > ROUND) return true;
  }
  return false;
}

// Abstand zum Wasser auf einem Raster über der Kachel (samt Rand), gemerkt nach der Umgebung
const distCache = new Map();
function distanceGrid(tx, ty) {
  let sig = '';
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = tx + dx, y = ty + dy;
    const c = charAt(x, y);
    const w = isWaterChar(c);
    sig += (w ? 'W' + ('~owh≈'.includes(c) ? outerWaterCorners(x, y) : 0) : 'L' + outerLandCorners(x, y)) + ',';
  }
  if (distCache.has(sig)) return distCache.get(sig);
  // Randpunkte des Wassers (Wasserzellen mit einem Land-Nachbarn) in der Umgebung
  const S = 24, lo = -REACH, n = Math.round((1 + 2 * REACH) * S);
  const cell = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) cell[j * n + i] = waterAt(tx + lo + (i + 0.5) / S, ty + lo + (j + 0.5) / S) ? 1 : 0;
  const edge = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    if (!cell[j * n + i]) continue;
    if ((i > 0 && !cell[j * n + i - 1]) || (i < n - 1 && !cell[j * n + i + 1]) || (j > 0 && !cell[(j - 1) * n + i]) || (j < n - 1 && !cell[(j + 1) * n + i])) {
      edge.push(lo + (i + 0.5) / S, lo + (j + 0.5) / S);
    }
  }
  const m = GRID + 1, M = 0.25; // Raster von -M bis 1+M
  const grid = new Float32Array(m * m).fill(9);
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
    const a = -M + (i / GRID) * (1 + 2 * M), b = -M + (j / GRID) * (1 + 2 * M);
    let best = 9;
    for (let k = 0; k < edge.length; k += 2) {
      const da = edge[k] - a, db = edge[k + 1] - b;
      const d = da * da + db * db;
      if (d < best) best = d;
    }
    grid[j * m + i] = Math.max(0, Math.sqrt(best) - 0.5 / S);
  }
  const result = edge.length ? { grid, m, M } : null;
  distCache.set(sig, result);
  return result;
}

function distAt({ grid, m, M }, a, b) {
  const fi = Math.min(m - 1.001, Math.max(0, ((a + M) / (1 + 2 * M)) * GRID));
  const fj = Math.min(m - 1.001, Math.max(0, ((b + M) / (1 + 2 * M)) * GRID));
  const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
  const g = (x, y) => grid[y * m + x];
  return (g(i, j) * (1 - u) + g(i + 1, j) * u) * (1 - v) + (g(i, j + 1) * (1 - u) + g(i + 1, j + 1) * u) * v;
}

// fester Zufall je Gitterpunkt und weiches Rauschen
const hash = (x, y, s = 0) => {
  let h = (Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663) ^ Math.imul(s + 1, 83492791)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
function noise(x, y, s) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const top = hash(x0, y0, s) * (1 - sx) + hash(x0 + 1, y0, s) * sx;
  const bot = hash(x0, y0 + 1, s) * (1 - sx) + hash(x0 + 1, y0 + 1, s) * sx;
  return top * (1 - sy) + bot * sy;
}

// nächster Kiesel (ein Kiesel je Zelle, Größe ST Kacheln): Abstand zur Mitte relativ zum Radius, Mitte, Farbe
const ST = 0.075;
function pebble(A, B) {
  const ci = Math.floor(A / ST), cj = Math.floor(B / ST);
  let best = null;
  for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) {
    const r = ST * (0.35 + 0.3 * hash(i, j, 3));
    const px = (i + 0.2 + 0.6 * hash(i, j, 1)) * ST, py = (j + 0.2 + 0.6 * hash(i, j, 2)) * ST;
    // etwas länglich (auf dem Boden), daher in a+b-Richtung gestreckt
    const da = A - px, db = B - py;
    const e = Math.hypot((da + db) * 0.6, (da - db) * 0.85) / r;
    if (e < 1 && (!best || e < best.e)) best = { e, px, py, shade: hash(i, j, 4), keep: hash(i, j, 5), da, db, r };
  }
  return best;
}

const mix = (c0, c1, t) => [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t];
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

let serial = 0;

// Bild des Uferstreifens für diese Kachel (groundKey: Boden darunter, bestimmt die Uferart) oder null, wenn kein Ufer
export function shoreTexture(scene, tx, ty, groundKey) {
  const style = STYLES[shoreStyle(groundKey)];
  if (!style) return null;
  let near = false;
  for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (isWaterChar(charAt(tx + dx, ty + dy))) near = true;
  if (!near) return null;
  const dg = distanceGrid(tx, ty);
  if (!dg) return null;

  const w = TILE_W * RES, h = TILE_H * RES;
  const key = `shore_${serial++}`;
  const tex = scene.textures.createCanvas(key, w, h);
  const img = tex.context.createImageData(w, h);
  const d = img.data;
  let any = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = (x + 0.5 - w / 2) / (w / 2), py = (y + 0.5) / (h / 2);
      const a = (px + py) / 2, b = (py - px) / 2;
      if (a < -BLEED || b < -BLEED || a > 1 + BLEED || b > 1 + BLEED) continue; // außerhalb der Raute (etwas darüber hinaus, sonst feine Nahtlinien)
      const A = tx + a, B = ty + b;
      if (waterAt(A, B)) continue;
      const dist = distAt(dg, a, b);
      // Breite schwankt sanft entlang des Ufers
      const width = style.width * (0.7 + 0.6 * noise(A * 1.6, B * 1.6, 7));
      if (dist > width + 0.05) continue;
      let alpha = 1 - smooth(width - 0.09, width + 0.03, dist + (noise(A * 9, B * 9, 8) - 0.5) * 0.08);
      // trocken -> nass zum Wasser hin
      let col = mix(style.base, style.wet, 1 - smooth(0.01, 0.1, dist));
      const g = (hash(Math.floor(A * 90), Math.floor(B * 90), 9) - 0.5) * style.grain;
      if (style.mottle) {
        const mo = (noise(A * 5, B * 5, 10) - 0.5) * style.mottle;
        col = col.map((v) => v + mo);
      }
      col = col.map((v) => v + g);
      if (style.stones) {
        const p = pebble(A, B);
        if (p && p.keep < style.stones) {
          // Kiesel fallen am äußeren Rand einzeln weg statt auszublenden
          const pd = distAt(dg, p.px - tx, p.py - ty);
          if (pd < width * (0.8 + 0.4 * p.shade)) {
            const lit = 1 + 0.25 * (-(p.da + p.db) / p.r) * 0.5; // oben hell, unten dunkel
            const base = style.stone.map((v) => v * (0.82 + 0.3 * p.shade) * lit);
            const wet = 1 - 0.25 * (1 - smooth(0.01, 0.1, pd));
            const rim = p.e > 0.8 ? 0.82 : 1;
            col = base.map((v) => v * wet * rim);
            alpha = Math.max(alpha, 1);
          }
        }
      }
      if (alpha <= 0.01) continue;
      const o = (y * w + x) * 4;
      d[o] = Math.max(0, Math.min(255, col[0]));
      d[o + 1] = Math.max(0, Math.min(255, col[1]));
      d[o + 2] = Math.max(0, Math.min(255, col[2]));
      d[o + 3] = Math.round(alpha * 255);
      any = true;
    }
  }
  if (!any) {
    scene.textures.remove(key);
    return null;
  }
  tex.context.putImageData(img, 0, 0);
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  shrinkTexture(tex, RES); // so groß anzeigen wie eine normale Kachel
  return key;
}

// nach dem Malen des Bodens: die Bilder werden nicht mehr gebraucht
export function removeShoreTextures(scene, keys) {
  for (const k of keys) if (scene.textures.exists(k)) scene.textures.remove(k);
}
