// Stellt eine Figur vor hellem Hintergrund frei und speichert sie als PNG mit Transparenz.
// Aufruf: npm run cutout -- "Sprites/Reh.jpg" "Sprites/Reh.png"
// Eingeschlossene Hintergrund-Löcher (z. B. zwischen den Beinen) zusätzlich mit Punkten darin angeben:
//         npm run cutout -- "Sprites/Fischreier.jpg" "Sprites/Fischreier.png" 627,410 906,410
//
// Entfernt werden helle, ungesättigte Pixel (Weiß und grauer Bodenschatten), die vom Bildrand aus
// erreichbar sind. Helle Stellen innerhalb der Figur (z. B. weißes Fell) bleiben erhalten,
// solange die Umrandung sie vom Hintergrund trennt.

import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import fs from 'node:fs';

const [input, output, ...holes] = process.argv.slice(2);
if (!input || !output) {
  console.error('Aufruf: npm run cutout -- <eingabe.jpg|png> <ausgabe.png> [x,y für eingeschlossene Löcher ...]');
  process.exit(1);
}

const buf = fs.readFileSync(input);
const img = /\.jpe?g$/i.test(input) ? jpeg.decode(buf, { useTArray: true }) : PNG.sync.read(buf);
const { width: W, height: H } = img;
const data = Buffer.from(img.data);

const MAX_SATURATION = 28; // Unterschied zwischen hellstem und dunkelstem Farbkanal
const MIN_LIGHTNESS = 150; // dunkler gilt nicht mehr als Hintergrund oder Schatten

function isBackground(i) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < MAX_SATURATION && min > MIN_LIGHTNESS;
}

// Flutfüllung vom Rand aus
const bg = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
for (const h of holes) {
  const [hx, hy] = h.split(',').map(Number);
  stack.push(hy * W + hx);
}
while (stack.length) {
  const p = stack.pop();
  if (bg[p] || !isBackground(p * 4)) continue;
  bg[p] = 1;
  const x = p % W;
  const y = (p - x) / W;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}

// Kantenpixel direkt am Hintergrund sind Mischfarben aus Umrandung und Weiß:
// je heller, desto durchsichtiger, und die Farbe wird von Weiß befreit
const isEdge = (p) => {
  const x = p % W;
  return (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || bg[p - W] || bg[p + W];
};

const out = new PNG({ width: W, height: H });
for (let p = 0; p < W * H; p++) {
  const i = p * 4;
  if (bg[p]) continue; // bleibt durchsichtig
  let r = data[i], g = data[i + 1], b = data[i + 2];
  let a = 255;
  if (isEdge(p)) {
    const min = Math.min(r, g, b);
    a = Math.max(0, Math.min(255, Math.round(((255 - min) / 255) * 255 * 1.6)));
    if (a > 0 && a < 255) {
      const f = 255 / a;
      r = Math.max(0, Math.min(255, Math.round(255 - (255 - r) * f)));
      g = Math.max(0, Math.min(255, Math.round(255 - (255 - g) * f)));
      b = Math.max(0, Math.min(255, Math.round(255 - (255 - b) * f)));
    }
  }
  out.data[i] = r;
  out.data[i + 1] = g;
  out.data[i + 2] = b;
  out.data[i + 3] = a;
}

fs.writeFileSync(output, PNG.sync.write(out));
console.log(`Freigestellt: ${output} (${W}x${H})`);
