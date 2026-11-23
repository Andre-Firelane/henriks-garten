// Weiche Übergänge zwischen Bodenarten (Bodenzonen mit soft in levels.js, z. B. Moor und Laub im Wald): jede Kachel
// liegt ganz mit einem Boden im gebackenen Boden. Am Rand einer Zone bekommt sie dazu ein eigenes, halb durchsichtiges
// Bild mit dem jeweils anderen Boden, dessen Deckkraft dem Anteil des Zonenbodens folgt (zoneWeight in map.js): so
// verläuft der Übergang über mehrere Kacheln, in welligen Buchten statt entlang der Rautenkanten. Wasser bleibt frei.
// Stoßen zwei Zonen aneinander (Kiesstrand an Tundra, Moor an Laub), mischen sich ihre Böden ebenso weich; überlappen
// sie, liegt die zuerst genannte oben (sharesAt).
// Gemalt wird es wie der Uferstreifen mit dem Boden (bakeGround), danach werden die Bilder nicht mehr gebraucht.
import Phaser from 'phaser';
import { LEVEL, charAt, groundAt, groundZoneAt, zoneWeight } from './map.js';
import { TILE_W, TILE_H } from './iso.js';
import { shrinkTexture } from './hd.js';
import { waterAt } from './shore.js';

const RES = 2; // Bildschärfe (wie der Uferstreifen)
const BLEED = 0.04; // so weit (Kacheln) malt jede Kachel über ihren Rand
const GX = 16, GY = 8; // Raster, auf dem der Anteil berechnet wird (dazwischen weich überblendet)
const EDGE = 0.04; // Abstand zum Rand der Bodenkachel beim Abtasten (dort ist sie halb durchsichtig)

let serial = 0;
const pixelCache = new Map();

// Bildpunkte einer Bodenkachel (einmal ausgelesen)
function pixelsOf(scene, key) {
  if (pixelCache.has(key)) return pixelCache.get(key);
  const src = scene.textures.get(key).getSourceImage();
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0);
  const px = { w: c.width, h: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data };
  pixelCache.set(key, px);
  return px;
}

// Bodenbild einer Bodenart an dieser Kachel (dieselbe Variante wie grassAt in map.js)
function variant(list, tx, ty) {
  const n = (((tx * 73856093) ^ (ty * 19349663)) >>> 0) % 10;
  return list[n < 6 ? 0 : n < 9 ? 1 : 2];
}

// Böden der weichen Zonen: Zonen mit demselben Boden (z. B. zwei Rechtecke Laub) zählen als einer
function softGrounds() {
  const zones = LEVEL.grounds?.filter((z) => z.soft && z.ground);
  if (!zones?.length) return null;
  const byKey = new Map();
  for (const z of zones) {
    const k = z.ground.join();
    if (!byKey.has(k)) byKey.set(k, { ground: z.ground, zones: [] });
    byKey.get(k).zones.push(z);
  }
  return [...byKey.values()];
}

// Anteile der Böden an einem Punkt (in out, Länge grounds + 1; der letzte ist der Grundboden des Gebiets): jeder Zonenboden
// wiegt so viel wie seine stärkste Zone (zoneWeight). Die Böden liegen in der Reihenfolge von LEVEL.grounds übereinander,
// der erste obenauf (wie bei groundZoneAt): überlappen sich zwei Zonen (Gletscher über der Tundra), deckt die erste die
// zweite zu; stoßen sie nur aneinander (Kiesstrand an Tundra), gehen sie weich ineinander über statt hart. Mit nur einer
// Zone in der Nähe ist das genau ihr Anteil gegen den Grundboden.
function sharesAt(grounds, A, B, out) {
  let rest = 1;
  for (let i = 0; i < grounds.length; i++) {
    let w = 0;
    for (const z of grounds[i].zones) w = Math.max(w, zoneWeight(z, A, B));
    out[i] = w * rest;
    rest *= 1 - w;
  }
  out[grounds.length] = rest;
  return out;
}

// Übergangsbild für die Kachel (oder null, wenn hier nichts zu überblenden ist)
export function blendTexture(scene, tx, ty) {
  const grounds = softGrounds();
  if (!grounds) return null;
  const n = grounds.length + 1; // Zonenböden und der Grundboden
  // Boden, mit dem die Kachel gebacken ist (Index in grounds, n - 1 = Grundboden)
  const ownZone = groundZoneAt(tx, ty);
  let own = ownZone?.ground ? grounds.findIndex((g) => g.zones.includes(ownZone)) : n - 1;
  if (own < 0) own = n - 1;
  // schneller Test an Ecken und Mitte: liegt hier überall nur der eigene Boden?
  const tmp = new Float32Array(n);
  const probe = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]].map(([a, b]) => sharesAt(grounds, tx + a, ty + b, tmp)[own]);
  if (probe.every((v) => v > 0.997)) return null;
  // Anteile auf dem Raster über der Kachel
  const grid = new Float32Array((GX + 1) * (GY + 1) * n);
  for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
    const px = (i / GX) * 2 - 1, py = (j / GY) * 2;
    sharesAt(grounds, tx + (px + py) / 2, ty + (py - px) / 2, tmp);
    grid.set(tmp, (j * (GX + 1) + i) * n);
  }
  const w = TILE_W * RES, h = TILE_H * RES;
  const key = `blend_${serial++}`;
  const tex = scene.textures.createCanvas(key, w, h);
  const img = tex.context.createImageData(w, h);
  const d = img.data;
  const pics = []; // Bodenbild je Boden (der Grundboden zuletzt), erst wenn gebraucht
  const picOf = (k) => (pics[k] ??= pixelsOf(scene, variant(k === n - 1 ? LEVEL.grass : grounds[k].ground, tx, ty)));
  const sh = new Float32Array(n);
  let any = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = (x + 0.5 - w / 2) / (w / 2), py = (y + 0.5) / (h / 2);
      const a = (px + py) / 2, b = (py - px) / 2;
      if (a < -BLEED || b < -BLEED || a > 1 + BLEED || b > 1 + BLEED) continue;
      if (waterAt(tx + a, ty + b)) continue;
      // Anteile: weich zwischen den Rasterpunkten
      const gx = ((x + 0.5) / w) * GX, gy = ((y + 0.5) / h) * GY;
      const i0 = Math.min(GX - 1, Math.floor(gx)), j0 = Math.min(GY - 1, Math.floor(gy));
      const fx = gx - i0, fy = gy - j0;
      const c00 = (j0 * (GX + 1) + i0) * n, c10 = c00 + n, c01 = c00 + (GX + 1) * n, c11 = c01 + n;
      for (let k = 0; k < n; k++) sh[k] = (grid[c00 + k] * (1 - fx) + grid[c10 + k] * fx) * (1 - fy) + (grid[c01 + k] * (1 - fx) + grid[c11 + k] * fx) * fy;
      // darüber kommen die anderen Böden, gemischt nach ihren Anteilen
      const alpha = 1 - sh[own];
      if (alpha < 0.01) continue;
      // gleiche Stelle im Bild der anderen Bodenkacheln (Rautenkoordinaten, etwas vom Rand weg)
      const ca = Math.min(1 - EDGE, Math.max(EDGE, a)), cb = Math.min(1 - EDGE, Math.max(EDGE, b));
      let r = 0, g = 0, bl = 0, al = 0;
      for (let k = 0; k < n; k++) {
        if (k === own || sh[k] < 0.002) continue;
        const pic = picOf(k);
        const sx = Math.min(pic.w - 1, Math.floor(((ca - cb + 1) / 2) * pic.w));
        const sy = Math.min(pic.h - 1, Math.floor(((ca + cb) / 2) * pic.h));
        const s = (sy * pic.w + sx) * 4;
        const f = sh[k] / alpha;
        r += pic.data[s] * f;
        g += pic.data[s + 1] * f;
        bl += pic.data[s + 2] * f;
        al += pic.data[s + 3] * f;
      }
      const o = (y * w + x) * 4;
      d[o] = r;
      d[o + 1] = g;
      d[o + 2] = bl;
      d[o + 3] = Math.round(alpha * al);
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

// weiches Rauschen (Wert 0..1) für den Rand der Suhle
function wobble(A, B) {
  const at = (x, y) => (((x * 73856093) ^ (y * 19349663) ^ 51234577) >>> 0) % 1000 / 1000;
  const x0 = Math.floor(A * 2), y0 = Math.floor(B * 2), fx = A * 2 - x0, fy = B * 2 - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
}

const MUD_REACH = 0.75; // so weit (Kacheln) läuft der Schlamm weich ins Land aus

// Schlamm (≈) mit weichem Rand statt Ufer (LEVEL.noMudShore, Suhle im Wald): über die Landkacheln daneben (und die
// abgerundeten Ecken der Schlammkacheln) läuft der Schlamm in welligen Flecken aus
export function mudTexture(scene, tx, ty) {
  if (!LEVEL.noMudShore) return null;
  const mud = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (charAt(tx + dx, ty + dy) === '≈') mud.push([tx + dx, ty + dy]);
  if (!mud.length) return null;
  const pic = pixelsOf(scene, groundAt(mud[0][0], mud[0][1]));
  const w = TILE_W * RES, h = TILE_H * RES;
  const key = `blend_${serial++}`;
  const tex = scene.textures.createCanvas(key, w, h);
  const img = tex.context.createImageData(w, h);
  const d = img.data;
  let any = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = (x + 0.5 - w / 2) / (w / 2), py = (y + 0.5) / (h / 2);
      const a = (px + py) / 2, b = (py - px) / 2;
      if (a < -BLEED || b < -BLEED || a > 1 + BLEED || b > 1 + BLEED) continue;
      const A = tx + a, B = ty + b;
      let dist = 9;
      for (const [mx, my] of mud) {
        const ex = Math.max(mx - A, 0, A - mx - 1), ey = Math.max(my - B, 0, B - my - 1);
        dist = Math.min(dist, Math.hypot(ex, ey));
      }
      const t = Math.max(0, Math.min(1, (dist + (wobble(A, B) - 0.5) * 0.5) / MUD_REACH));
      const alpha = 1 - t * t * (3 - 2 * t);
      if (alpha < 0.01) continue;
      const ca = Math.min(1 - EDGE, Math.max(EDGE, a)), cb = Math.min(1 - EDGE, Math.max(EDGE, b));
      const sx = Math.min(pic.w - 1, Math.floor(((ca - cb + 1) / 2) * pic.w));
      const sy = Math.min(pic.h - 1, Math.floor(((ca + cb) / 2) * pic.h));
      const s = (sy * pic.w + sx) * 4;
      const o = (y * w + x) * 4;
      d[o] = pic.data[s];
      d[o + 1] = pic.data[s + 1];
      d[o + 2] = pic.data[s + 2];
      d[o + 3] = Math.round(alpha * pic.data[s + 3]);
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
  shrinkTexture(tex, RES);
  return key;
}

// nach dem Malen des Bodens: ausgelesene Bodenbilder vergessen
export function clearBlendCache() {
  pixelCache.clear();
}
