// Logo freistellen: Sprites/Logo.jpg (weißer Hintergrund) → public/assets/logo.png mit Transparenz.
// Aufruf: npm run logo
//
// Der weiße Hintergrund wird vom Bildrand aus entfernt (helle, ungesättigte Pixel). Dabei verschwindet auch der weiße
// Sticker-Rand des Logos, denn er ist genauso weiß wie der Hintergrund – er wird danach als weicher weißer Rand um alles
// Übrige neu gezeichnet, dazu ein leichter Schatten. Zum Schluss wird auf das Logo zugeschnitten und verkleinert.

import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import fs from 'node:fs';

const INPUT = 'Sprites/Logo.jpg';
const OUTPUT = 'public/assets/logo.png';
const MIN_LIGHT = 214; // so hell (dunkelster Farbkanal) muss Hintergrund sein ...
const MAX_SATURATION = 26; // ... und so wenig farbig (Unterschied hellster/dunkelster Kanal)
const BORDER = 9; // Breite des neuen weißen Rands (Pixel im Original)
const SHADOW = 5; // so weit fällt der Schatten nach unten
const MARGIN = 4; // Rand um das zugeschnittene Logo
const OUT_W = 720; // Breite des fertigen Bilds

const img = jpeg.decode(fs.readFileSync(INPUT), { useTArray: true });
const { width: W, height: H, data } = img;

// 1. Hintergrund: vom Rand aus erreichbare helle, ungesättigte Pixel
const bg = new Uint8Array(W * H);
const isLight = (p) => {
  const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
  return Math.min(r, g, b) >= MIN_LIGHT && Math.max(r, g, b) - Math.min(r, g, b) <= MAX_SATURATION;
};
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const p = stack.pop();
  if (bg[p] || !isLight(p)) continue;
  bg[p] = 1;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}

// 2. Abstand jedes Hintergrund-Pixels zum Logo (für den weichen weißen Rand und den Schatten)
const R = BORDER + SHADOW + 2;
const dist = new Float32Array(W * H).fill(Infinity);
const logo = [];
for (let p = 0; p < W * H; p++) if (!bg[p]) logo.push(p);
// nur Logo-Pixel am Rand des Logos brauchen wir als Quelle
const edge = logo.filter((p) => {
  const x = p % W, y = (p / W) | 0;
  return (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
});
const shadowDist = new Float32Array(W * H).fill(Infinity);
for (const p of edge) {
  const x0 = p % W, y0 = (p / W) | 0;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const x = x0 + dx, y = y0 + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const q = y * W + x;
      if (!bg[q]) continue;
      const d = Math.hypot(dx, dy);
      if (d < dist[q]) dist[q] = d;
      const ds = Math.hypot(dx, dy - SHADOW);
      if (ds < shadowDist[q]) shadowDist[q] = ds;
    }
  }
}

// 3. Ausgabe im Originalformat: Logo, weißer Rand (weich auslaufend), darunter ein leichter Schatten
const full = new PNG({ width: W, height: H });
for (let p = 0; p < W * H; p++) {
  const o = p * 4;
  if (!bg[p]) {
    full.data[o] = data[o]; full.data[o + 1] = data[o + 1]; full.data[o + 2] = data[o + 2]; full.data[o + 3] = 255;
    continue;
  }
  const white = Math.max(0, Math.min(1, BORDER + 0.5 - dist[p]));
  const shadow = Math.max(0, Math.min(1, BORDER + 0.5 - shadowDist[p])) * 0.35;
  const a = white + shadow * (1 - white);
  if (a <= 0) continue;
  const c = a ? (255 * white + 43 * shadow * (1 - white)) / a : 0; // Schatten dunkelbraun (#2b1d14)
  full.data[o] = c; full.data[o + 1] = a ? (255 * white + 29 * shadow * (1 - white)) / a : 0; full.data[o + 2] = a ? (255 * white + 20 * shadow * (1 - white)) / a : 0;
  full.data[o + 3] = Math.round(a * 255);
}

// 4. Zuschneiden und verkleinern (Mittelwert über die Quellpixel, gewichtet mit der Deckkraft)
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (full.data[(y * W + x) * 4 + 3] > 8) {
  x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
}
x0 = Math.max(0, x0 - MARGIN); y0 = Math.max(0, y0 - MARGIN); x1 = Math.min(W - 1, x1 + MARGIN); y1 = Math.min(H - 1, y1 + MARGIN);
const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
const k = Math.min(1, OUT_W / cw);
const ow = Math.round(cw * k), oh = Math.round(ch * k);
const out = new PNG({ width: ow, height: oh });
for (let y = 0; y < oh; y++) {
  for (let x = 0; x < ow; x++) {
    const sx0 = x0 + x / k, sy0 = y0 + y / k, sx1 = x0 + (x + 1) / k, sy1 = y0 + (y + 1) / k;
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = Math.floor(sy0); sy < Math.ceil(sy1); sy++) {
      for (let sx = Math.floor(sx0); sx < Math.ceil(sx1); sx++) {
        const o = (sy * W + sx) * 4;
        const al = full.data[o + 3];
        r += full.data[o] * al; g += full.data[o + 1] * al; b += full.data[o + 2] * al; a += al; n++;
      }
    }
    const o = (y * ow + x) * 4;
    out.data[o] = a ? r / a : 0; out.data[o + 1] = a ? g / a : 0; out.data[o + 2] = a ? b / a : 0; out.data[o + 3] = n ? a / n : 0;
  }
}
fs.writeFileSync(OUTPUT, PNG.sync.write(out));
console.log(`${OUTPUT}: ${ow}x${oh} (aus ${cw}x${ch})`);
