// Bilder fürs Versteck: der Tiger schaut mit halbem Gesicht aus dem Bambus (tiger_peek), der Orang-Utan sitzt oben
// in der Baumkrone (orangutan_tree). Beide aus den freigestellten Sprites, verkleinert, mit Laub davor.
// Aufruf: node tools/tree-peeks.cjs   (nach npm run cutout für Sprites/Tiger.png und Sprites/Orang Utan sitzt und frisst.png)
const { PNG } = require('pngjs');
const fs = require('fs');

const read = (f) => PNG.sync.read(fs.readFileSync(f));

// Ausschnitt (x0..x1, y0..y1) flächengemittelt auf w x h verkleinern
function shrink(src, x0, y0, x1, y1, w, h) {
  const out = new PNG({ width: w, height: h });
  const fx = (x1 - x0) / w, fy = (y1 - y0) / h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = Math.floor(y0 + y * fy); sy < Math.floor(y0 + (y + 1) * fy); sy++) {
      for (let sx = Math.floor(x0 + x * fx); sx < Math.floor(x0 + (x + 1) * fx); sx++) {
        const i = (sy * src.width + sx) * 4;
        const al = src.data[i + 3];
        r += src.data[i] * al; g += src.data[i + 1] * al; b += src.data[i + 2] * al; a += al; n++;
      }
    }
    const o = (y * w + x) * 4;
    if (a) { out.data[o] = r / a; out.data[o + 1] = g / a; out.data[o + 2] = b / a; }
    out.data[o + 3] = n ? Math.round(a / n) : 0;
  }
  // halbdurchsichtige Ränder: entweder ganz oder gar nicht (Pixel-Look)
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = out.data[i] > 110 ? 255 : 0;
  return out;
}

function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const s = (y * src.width + x) * 4;
    if (!src.data[s + 3]) continue;
    const dx = ox + x, dy = oy + y;
    if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue;
    const d = (dy * dst.width + dx) * 4;
    for (let k = 0; k < 4; k++) dst.data[d + k] = src.data[s + k];
  }
}

// Laub (Bambusblätter bzw. Baumblätter) als Ellipsen mit dunklem Rand
function leaves(dst, list, dark, light) {
  const ink = [43, 29, 20];
  const fill = (cx, cy, rx, ry, col) => {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      if (x < 0 || y < 0 || x >= dst.width || y >= dst.height) continue;
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      const i = (y * dst.width + x) * 4;
      dst.data[i] = col[0]; dst.data[i + 1] = col[1]; dst.data[i + 2] = col[2]; dst.data[i + 3] = 255;
    }
  };
  for (const [x, y, rx, ry] of list) fill(x, y, rx + 1, ry + 1, ink);
  for (const [x, y, rx, ry] of list) fill(x, y, rx, ry, dark);
  for (const [x, y, rx, ry] of list) fill(x - 1, y - 1, rx * 0.55, ry * 0.45, light);
}

// Tiger und weißer Tiger: Kopf aus der Vorderansicht (nach rechts unten), untere Hälfte vom Bambus verdeckt
// Ausschnitt um den Kopf (x, y der oberen linken Ecke, 128 x 128 Pixel im freigestellten Bild)
for (const [file, outName, hx, hy] of [['Sprites/Tiger.png', 'tiger_peek', 138, 166], ['Sprites/Tiger2.png', 'tiger2_peek', 146, 168]]) {
  const t = read(file);
  const head = shrink(t, hx, hy, hx + 128, hy + 128, 50, 50);
  const out = new PNG({ width: 64, height: 64 });
  blit(out, head, 7, 1);
  leaves(out, [[6, 47, 9, 4], [20, 52, 10, 4], [36, 50, 11, 4], [52, 53, 10, 4], [60, 45, 6, 3], [28, 58, 12, 4], [48, 59, 10, 3], [10, 57, 9, 3]], [79, 138, 50], [122, 184, 74]);
  fs.writeFileSync(`public/assets/${outName}.png`, PNG.sync.write(out));
}

// Orang-Utan: sitzend (erstes Bild von "sitzt und frisst"), unten Laub der Baumkrone
{
  const o = read('Sprites/Orang Utan sitzt und frisst.png');
  // Umriss des ersten Bilds suchen
  let x0 = 1e9, x1 = 0, y0 = 1e9, y1 = 0;
  for (let y = 0; y < o.height; y++) for (let x = 0; x < 280; x++) {
    if (o.data[(y * o.width + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  const h = 50, w = Math.round(((x1 - x0) / (y1 - y0)) * h);
  const fig = shrink(o, x0, y0, x1 + 1, y1 + 1, w, h);
  const out = new PNG({ width: 64, height: 64 });
  blit(out, fig, Math.round((64 - w) / 2), 6);
  leaves(out, [[6, 52, 8, 4], [18, 57, 10, 4], [32, 55, 9, 3], [46, 57, 10, 4], [58, 52, 7, 4], [26, 61, 10, 3], [42, 62, 9, 2]], [44, 114, 50], [90, 168, 76]);
  fs.writeFileSync('public/assets/orangutan_tree.png', PNG.sync.write(out));
}
console.log('ok');
