// Riff-Fische: schneidet die Fische aus dem Raster in "Sprites/Riff Fische.png" (6 × 4, nach npm run cutout) aus und legt
// sie als Spritesheet public/assets/reeffish.png ab: je Art zwei Bilder (nach rechts, nach links), 96 × 64 Pixel.
// Alle Fische behalten ihre Größe zueinander (ein gemeinsamer Maßstab).
// Aufruf: node tools/reef-fish.cjs
const { PNG } = require('pngjs');
const fs = require('fs');

const SRC = 'Sprites/Riff Fische.png';
const OUT = 'public/assets/reeffish.png';
const COLS = 6, ROWS = 4;
const FW = 96, FH = 64; // Bildgröße im Spritesheet
const MAX_W = 88, MAX_H = 56; // so groß darf der größte Fisch werden
// Blickrichtung im Original je Rasterfeld (Zeile für Zeile): R nach rechts, L nach links, - doppelt (weggelassen)
const FACING = [
  'RRRLLR',
  '-RR-RR', // Clownfisch und Falterfisch gibt es schon in der ersten Zeile
  'RRLLLL',
  'RRRLRL',
];

const p = PNG.sync.read(fs.readFileSync(SRC));
const W = p.width, H = p.height, d = p.data;
const cw = W / COLS, ch = H / ROWS;
const fish = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const f = FACING[r][c];
  if (f === '-') continue;
  // Umriss des Fischs im Feld (alles Sichtbare)
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = Math.floor(r * ch); y < Math.floor((r + 1) * ch); y++) {
    for (let x = Math.floor(c * cw); x < Math.floor((c + 1) * cw); x++) {
      if (d[(y * W + x) * 4 + 3] < 40) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  fish.push({ x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1, left: f === 'L' });
}
const scale = Math.min(...fish.map((f) => Math.min(MAX_W / f.w, MAX_H / f.h)));

// Bildausschnitt verkleinern (Mittelwert der Pixel, Farbe nach Deckkraft gewichtet), wahlweise gespiegelt
function shrink(f, flip) {
  const w = Math.round(f.w * scale), h = Math.round(f.h * scale);
  const out = new Float64Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = Math.floor(y / scale); sy < Math.floor((y + 1) / scale); sy++) {
      for (let sx = Math.floor(x / scale); sx < Math.floor((x + 1) / scale); sx++) {
        const i = ((f.y0 + sy) * W + f.x0 + sx) * 4;
        const al = d[i + 3];
        r += d[i] * al; g += d[i + 1] * al; b += d[i + 2] * al; a += al; n++;
      }
    }
    const o = (y * w + (flip ? w - 1 - x : x)) * 4;
    if (a) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; }
    out[o + 3] = n ? a / n : 0;
  }
  return { w, h, px: out };
}

const sheet = new PNG({ width: FW * fish.length * 2, height: FH });
fish.forEach((f, k) => {
  // Bild 2k schaut nach rechts, 2k+1 nach links
  for (const [slot, flip] of [[0, f.left], [1, !f.left]]) {
    const s = shrink(f, flip);
    const ox = (k * 2 + slot) * FW + Math.round((FW - s.w) / 2);
    const oy = Math.round((FH - s.h) / 2);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const i = (y * s.w + x) * 4, o = ((oy + y) * sheet.width + ox + x) * 4;
      for (let c = 0; c < 4; c++) sheet.data[o + c] = Math.round(s.px[i + c]);
    }
  }
});
fs.writeFileSync(OUT, PNG.sync.write(sheet));
console.log(`${OUT}: ${fish.length} Arten, je 2 Bilder à ${FW}x${FH}, Maßstab ${scale.toFixed(3)}`);
