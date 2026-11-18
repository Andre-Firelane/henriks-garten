// Weiche Übergänge zwischen Bodenarten (Bodenzonen mit soft in levels.js, z. B. Moor und Laub im Wald): jede Kachel
// liegt ganz mit einem Boden im gebackenen Boden. Am Rand einer Zone bekommt sie dazu ein eigenes, halb durchsichtiges
// Bild mit dem jeweils anderen Boden, dessen Deckkraft dem Anteil des Zonenbodens folgt (zoneWeight in map.js): so
// verläuft der Übergang über mehrere Kacheln, in welligen Buchten statt entlang der Rautenkanten. Wasser bleibt frei.
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

// stärkste weiche Zone an einem Punkt: { zone, w }
function strongest(zones, A, B) {
  let best = null;
  for (const z of zones) {
    const w = zoneWeight(z, A, B);
    if (!best || w > best.w) best = { zone: z, w };
  }
  return best;
}

// Übergangsbild für die Kachel (oder null, wenn hier nichts zu überblenden ist)
export function blendTexture(scene, tx, ty) {
  const zones = LEVEL.grounds?.filter((z) => z.soft);
  if (!zones?.length) return null;
  // schneller Test an Ecken und Mitte: liegt hier überall derselbe Boden?
  const probe = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]].map(([a, b]) => strongest(zones, tx + a, ty + b).w);
  if (probe.every((w) => w < 0.003) || probe.every((w) => w > 0.997)) return null;
  const own = groundZoneAt(tx, ty); // Boden, mit dem die Kachel gebacken ist
  // Anteil auf dem Raster über der Kachel
  const grid = new Float32Array((GX + 1) * (GY + 1));
  const gzone = new Array((GX + 1) * (GY + 1));
  for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
    const px = (i / GX) * 2 - 1, py = (j / GY) * 2;
    const s = strongest(zones, tx + (px + py) / 2, ty + (py - px) / 2);
    grid[j * (GX + 1) + i] = s.w;
    gzone[j * (GX + 1) + i] = s.zone;
  }
  const w = TILE_W * RES, h = TILE_H * RES;
  const key = `blend_${serial++}`;
  const tex = scene.textures.createCanvas(key, w, h);
  const img = tex.context.createImageData(w, h);
  const d = img.data;
  const base = pixelsOf(scene, variant(LEVEL.grass, tx, ty));
  const pics = new Map(); // Bodenbild je Zone
  let any = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = (x + 0.5 - w / 2) / (w / 2), py = (y + 0.5) / (h / 2);
      const a = (px + py) / 2, b = (py - px) / 2;
      if (a < -BLEED || b < -BLEED || a > 1 + BLEED || b > 1 + BLEED) continue;
      if (waterAt(tx + a, ty + b)) continue;
      // Anteil: weich zwischen den Rasterpunkten
      const gx = ((x + 0.5) / w) * GX, gy = ((y + 0.5) / h) * GY;
      const i0 = Math.min(GX - 1, Math.floor(gx)), j0 = Math.min(GY - 1, Math.floor(gy));
      const fx = gx - i0, fy = gy - j0;
      const at = (i, j) => grid[j * (GX + 1) + i];
      const m = (at(i0, j0) * (1 - fx) + at(i0 + 1, j0) * fx) * (1 - fy) + (at(i0, j0 + 1) * (1 - fx) + at(i0 + 1, j0 + 1) * fx) * fy;
      // darüber kommt der jeweils andere Boden
      const alpha = own ? 1 - m : m;
      if (alpha < 0.01) continue;
      let pic = base;
      if (!own) {
        const z = gzone[Math.round(gy) * (GX + 1) + Math.round(gx)];
        if (!pics.has(z)) pics.set(z, pixelsOf(scene, variant(z.ground, tx, ty)));
        pic = pics.get(z);
      }
      // gleiche Stelle im Bild der anderen Bodenkachel (Rautenkoordinaten, etwas vom Rand weg)
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
