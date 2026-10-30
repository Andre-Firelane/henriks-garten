// Schwanzflosse wackeln lassen: macht aus jedem Fischbild eines Spritesheets (Seitenansicht, Bilder abwechselnd nach
// rechts und links) WAG_FRAMES Bilder, in denen der hintere Teil hin und her schlägt. Der Körper bleibt, wie er ist;
// das Schwanzende wird abwechselnd kürzer (schlägt zur Seite, vom Betrachter weg oder zu ihm hin) und biegt sich leicht
// auf und ab. Neue Bildnummer = altes Bild * WAG_FRAMES + Schritt.
// Aufruf: node tools/fish-wag.cjs (nach tools/reef-fish.cjs bzw. npm run sprites)
const { PNG } = require('pngjs');
const fs = require('fs');

const WAG_FRAMES = 4;
const SHEETS = [
  // Riff-Fische: 22 Arten, je nach rechts und links (tools/reef-fish.cjs); weich gezeichnet, daher weich abgetastet
  { src: 'public/assets/reeffish.png', out: 'public/assets/reeffish_swim.png', fw: 96, fh: 64, count: 44, tail: 0.36, squash: 0.3, bend: 3.5, smooth: true },
  // Zierfische (Pixel-Art aus make-sprites.js): 6 Arten, je nach rechts und links; scharfe Pixel, nur ganze Pixel
  { src: 'public/assets/minifish.png', out: 'public/assets/minifish_swim.png', fw: 20, fh: 16, count: 12, tail: 0.38, squash: 0.25, bend: 1, smooth: false },
];
const MAX_W = 4096; // breiter laden manche Handys nicht

function wag({ src, out, fw, fh, count, tail, squash, bend, smooth }) {
  const img = PNG.sync.read(fs.readFileSync(src));
  const perRowIn = Math.floor(img.width / fw);
  const total = count * WAG_FRAMES;
  const perRow = Math.min(total, Math.floor(MAX_W / fw));
  const sheet = new PNG({ width: perRow * fw, height: Math.ceil(total / perRow) * fh });
  const at = (f) => [(f % perRowIn) * fw, Math.floor(f / perRowIn) * fh];
  // Farbe an (x, y) im Bild f (mit vormultipliziertem Alpha), außerhalb durchsichtig
  const sample = (ox, oy, x, y) => {
    if (!smooth) {
      const xi = Math.round(x);
      const yi = Math.round(y);
      if (xi < 0 || yi < 0 || xi >= fw || yi >= fh) return [0, 0, 0, 0];
      const k = ((oy + yi) * img.width + ox + xi) * 4;
      const a = img.data[k + 3] / 255;
      return [img.data[k] * a, img.data[k + 1] * a, img.data[k + 2] * a, a];
    }
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const acc = [0, 0, 0, 0];
    for (const [dx, dy, w] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
      const xi = x0 + dx;
      const yi = y0 + dy;
      if (xi < 0 || yi < 0 || xi >= fw || yi >= fh || !w) continue;
      const k = ((oy + yi) * img.width + ox + xi) * 4;
      const a = img.data[k + 3] / 255;
      for (let c = 0; c < 3; c++) acc[c] += img.data[k + c] * a * w;
      acc[3] += a * w;
    }
    return acc;
  };

  for (let f = 0; f < count; f++) {
    const [ox, oy] = at(f);
    const right = f % 2 === 0; // nach rechts: Schwanz links
    // Umriss des Fischs
    let x0 = fw;
    let x1 = -1;
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        if (img.data[((oy + y) * img.width + ox + x) * 4 + 3] < 40) continue;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
      }
    }
    if (x1 < 0) continue;
    const len = x1 - x0 + 1;
    const pivot = right ? x0 + len * tail : x1 - len * tail; // ab hier nach hinten schwingt der Schwanz
    const back = right ? x0 : x1; // Schwanzende
    for (let s = 0; s < WAG_FRAMES; s++) {
      const phi = (s / WAG_FRAMES) * Math.PI * 2;
      const k = 1 - squash * (0.5 + 0.5 * Math.sin(phi)); // Schwanz kürzer: schlägt zur Seite
      const lift = bend * Math.cos(phi); // ... und biegt sich auf und ab
      const n = f * WAG_FRAMES + s;
      const dx0 = (n % perRow) * fw;
      const dy0 = Math.floor(n / perRow) * fh;
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          let sx = x;
          let sy = y;
          const behind = right ? x < pivot : x > pivot;
          if (behind) {
            const u = Math.min(1, Math.abs(x - pivot) / Math.abs(back - pivot)); // 0 am Körper, 1 am Schwanzende
            sx = pivot + (x - pivot) / k;
            sy = y - lift * u * u;
          }
          const [r, g, b, a] = sample(ox, oy, sx, sy);
          if (a <= 0) continue;
          const o = ((dy0 + y) * sheet.width + dx0 + x) * 4;
          sheet.data[o] = Math.round(r / a);
          sheet.data[o + 1] = Math.round(g / a);
          sheet.data[o + 2] = Math.round(b / a);
          sheet.data[o + 3] = Math.round(Math.min(1, a) * 255);
        }
      }
    }
  }
  fs.writeFileSync(out, PNG.sync.write(sheet));
  console.log(`${out}: ${total} Bilder à ${fw}x${fh} (${perRow} je Zeile)`);
}

SHEETS.forEach(wag);
