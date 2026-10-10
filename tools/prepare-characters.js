// Schneidet die vier Ansichten aus den gemalten Figuren in Sprites/ aus,
// verkleinert sie und legt sie als Spritesheets in public/assets/ ab.
// Aufruf: npm run characters

import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';

// frameW/frameH/feetY müssen zu den Werten in src/scenes/BootScene.js und den Figuren-Klassen passen.
// Reihenfolge der Ansichten steht als Kommentar dabei (Original von links nach rechts).
const CHARACTERS = [
  // unten-rechts, unten-links, oben-rechts, oben-links
  { src: 'Sprites/Main Character.png', out: 'hero.png', frameW: 72, frameH: 116, feetY: 112, figureH: 108 },
  // unten-rechts, unten-links, oben-rechts, oben-links
  { src: 'Sprites/Schaf.png', out: 'sheep.png', frameW: 80, frameH: 88, feetY: 84, figureH: 72 },
  // unten-rechts, unten-links, oben-rechts, oben-links; der gemalte graue Bodenschatten wird entfernt
  { src: 'Sprites/Katze.png', out: 'cat.png', frameW: 72, frameH: 80, feetY: 76, figureH: 60, stripShadow: true },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout
  { src: 'Sprites/Reh.png', out: 'deer.png', frameW: 72, frameH: 96, feetY: 92, figureH: 84 },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout (höher wegen des Geweihs)
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout
  { src: 'Sprites/Frosch.png', out: 'frog.png', frameW: 56, frameH: 52, feetY: 48, figureH: 44 },
  // Maulwurf im Erdhügel (wild) und zu Fuß (gefangen); jeweils unten-rechts, unten-links, oben-rechts, oben-links
  { src: 'Sprites/Maulwurf.png', out: 'mole_mound.png', frameW: 64, frameH: 52, feetY: 48, figureH: 44 },
  { src: 'Sprites/Maulwurf2.png', out: 'mole.png', frameW: 56, frameH: 52, feetY: 48, figureH: 44 },
  // Fischreiher stehend und fliegend; stehend: freigestellt mit npm run cutout -- ... 627,410 906,410 (Löcher zwischen den Beinen)
  { src: 'Sprites/Fischreier.png', out: 'heron.png', frameW: 88, frameH: 108, feetY: 104, figureH: 100 },
  { src: 'Sprites/Fischreier Flug.png', out: 'heron_fly.png', frameW: 96, frameH: 92, feetY: 88, figureH: 84 },
  { src: 'Sprites/Hirsch.png', out: 'stag.png', frameW: 80, frameH: 112, feetY: 108, figureH: 100 },
  // auftauchen, nach rechts, nach links, Sprung; freigestellt mit npm run cutout
  { src: 'Sprites/Fisch.png', out: 'fish.png', frameW: 84, frameH: 64, feetY: 60, figureH: 56 },
  // unten-rechts, unten-links, oben-links, oben-rechts; freigestellt mit npm run cutout
  { src: 'Sprites/Fisch Beutel.png', out: 'fishbag.png', frameW: 64, frameH: 76, feetY: 72, figureH: 64 },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout
  { src: 'Sprites/Eichhörnchen.png', out: 'squirrel.png', frameW: 56, frameH: 60, feetY: 56, figureH: 52 },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout.
  // Der Schwanz der 3. Figur ragt in die Spalten der 2., daher nach zusammenhängenden Flächen trennen
  { src: 'Sprites/Fuchs.png', out: 'fox.png', frameW: 72, frameH: 72, feetY: 68, figureH: 64, byComponents: true },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout (hoch wegen der Hörner)
  { src: 'Sprites/Antilope.png', out: 'antelope.png', frameW: 72, frameH: 100, feetY: 96, figureH: 88 },
];

// Figuren anhand leerer Spalten trennen (Standard)
function figuresByColumns(W, H, alpha) {
  const used = [];
  for (let x = 0; x < W; x++) {
    let any = false;
    for (let y = 0; y < H && !any; y++) any = alpha(x, y) > 20;
    used.push(any);
  }
  const runs = [];
  let start = -1;
  used.forEach((u, x) => {
    if (u && start < 0) start = x;
    if (!u && start >= 0) {
      runs.push([start, x - 1]);
      start = -1;
    }
  });
  if (start >= 0) runs.push([start, W - 1]);
  const figures = runs.filter(([a, b]) => b - a > 50);
  if (figures.length !== 4) return null;
  const owner = new Int8Array(W * H).fill(-1);
  figures.forEach(([x0, x1], f) => {
    for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) owner[y * W + x] = f;
  });
  return owner;
}

// Figuren als zusammenhängende Flächen trennen: für Bilder, in denen sich Figuren überlappen
// (z. B. ein Schwanz, der in die Spalten der Nachbarfigur ragt). Die 4 größten Flächen sind die Figuren,
// kleine Teile (Spritzer, Fellspitzen) gehören zur Figur, in deren Nähe sie liegen.
function figuresByComponents(W, H, alpha) {
  const label = new Int32Array(W * H).fill(-1);
  const comps = [];
  for (let start = 0; start < W * H; start++) {
    if (label[start] >= 0 || alpha(start % W, Math.floor(start / W)) <= 20) continue;
    const id = comps.length;
    const c = { id, size: 0, x0: W, x1: 0, y0: H, y1: 0 };
    const stack = [start];
    label[start] = id;
    while (stack.length) {
      const p = stack.pop();
      const x = p % W;
      const y = (p - x) / W;
      c.size++;
      c.x0 = Math.min(c.x0, x);
      c.x1 = Math.max(c.x1, x);
      c.y0 = Math.min(c.y0, y);
      c.y1 = Math.max(c.y1, y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const q = ny * W + nx;
          if (label[q] < 0 && alpha(nx, ny) > 20) {
            label[q] = id;
            stack.push(q);
          }
        }
      }
    }
    comps.push(c);
  }
  const main = [...comps].sort((a, b) => b.size - a.size).slice(0, 4);
  if (main.length < 4) return null;
  main.sort((a, b) => a.x0 + a.x1 - (b.x0 + b.x1)); // von links nach rechts
  const figOf = new Map(main.map((c, f) => [c.id, f]));
  const MARGIN = 30;
  for (const c of comps) {
    if (figOf.has(c.id)) continue;
    const cx = (c.x0 + c.x1) / 2;
    const cy = (c.y0 + c.y1) / 2;
    const f = main.findIndex((m) => cx >= m.x0 - MARGIN && cx <= m.x1 + MARGIN && cy >= m.y0 - MARGIN && cy <= m.y1 + MARGIN);
    if (f >= 0) figOf.set(c.id, f);
  }
  const owner = new Int8Array(W * H).fill(-1);
  for (let p = 0; p < W * H; p++) if (label[p] >= 0 && figOf.has(label[p])) owner[p] = figOf.get(label[p]);
  // fast durchsichtige Randpixel der jeweils angrenzenden Figur zuordnen (weiche Kanten)
  const edge = owner.slice();
  for (let p = 0; p < W * H; p++) {
    if (owner[p] >= 0 || alpha(p % W, Math.floor(p / W)) === 0) continue;
    for (const q of [p - 1, p + 1, p - W, p + W]) if (q >= 0 && q < W * H && owner[q] >= 0) edge[p] = owner[q];
  }
  return edge;
}

function prepare({ src, out, frameW, frameH, feetY, figureH, stripShadow = false, byComponents = false }) {
  const img = PNG.sync.read(fs.readFileSync(path.resolve(src)));
  const { width: W, height: H, data } = img;

  // Hellgraue, ungesättigte Pixel sind der gemalte Schatten: das Spiel zeichnet seinen eigenen
  if (stripShadow) {
    for (let i = 0; i < data.length; i += 4) {
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      if (max - min < 16 && min > 140 && max < 235) data[i + 3] = 0;
    }
  }
  const alpha = (x, y) => data[(y * W + x) * 4 + 3];

  // owner[Pixel] = Nummer der Figur, zu der der Pixel gehört (-1: keine)
  const owner = byComponents ? figuresByComponents(W, H, alpha) : figuresByColumns(W, H, alpha);
  if (!owner) throw new Error(`${src}: konnte keine 4 Figuren finden`);

  const boxes = [0, 1, 2, 3].map(() => ({ x0: W, x1: 0, y0: H, y1: 0 }));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const f = owner[y * W + x];
      if (f < 0 || alpha(x, y) <= 20) continue; // Größe nur aus sichtbaren Pixeln
      const b = boxes[f];
      b.x0 = Math.min(b.x0, x);
      b.x1 = Math.max(b.x1, x);
      b.y0 = Math.min(b.y0, y);
      b.y1 = Math.max(b.y1, y);
    }
  }

  const scale = figureH / Math.max(...boxes.map((b) => b.y1 - b.y0 + 1));
  const sheet = new PNG({ width: frameW * 4, height: frameH });

  // Flächenmittelung mit vormultipliziertem Alpha: glatte Kanten ohne dunkle Ränder
  boxes.forEach((b, i) => {
    const bw = (b.x1 - b.x0 + 1) * scale;
    const bh = (b.y1 - b.y0 + 1) * scale;
    const offX = i * frameW + Math.round((frameW - bw) / 2);
    const offY = Math.round(feetY - bh);
    const step = 1 / scale;
    for (let ty = 0; ty < Math.ceil(bh); ty++) {
      for (let tx = 0; tx < Math.ceil(bw); tx++) {
        const sx0 = b.x0 + tx * step;
        const sy0 = b.y0 + ty * step;
        let r = 0, g = 0, bl = 0, a = 0, n = 0;
        for (let sy = Math.floor(sy0); sy < Math.max(Math.floor(sy0 + step), Math.floor(sy0) + 1); sy++) {
          for (let sx = Math.floor(sx0); sx < Math.max(Math.floor(sx0 + step), Math.floor(sx0) + 1); sx++) {
            if (sx > b.x1 || sy > b.y1) continue;
            const k = (sy * W + sx) * 4;
            const al = owner[sy * W + sx] === i ? data[k + 3] / 255 : 0; // Teile anderer Figuren ausblenden
            r += data[k] * al;
            g += data[k + 1] * al;
            bl += data[k + 2] * al;
            a += al;
            n++;
          }
        }
        if (n === 0 || a === 0) continue;
        const dx = offX + tx;
        const dy = offY + ty;
        if (dx < 0 || dy < 0 || dx >= sheet.width || dy >= sheet.height) continue;
        const o = (dy * sheet.width + dx) * 4;
        sheet.data[o] = r / a;
        sheet.data[o + 1] = g / a;
        sheet.data[o + 2] = bl / a;
        sheet.data[o + 3] = (a / n) * 255;
      }
    }
    if (bw > frameW) console.warn(`${src}: Figur ${i} ist breiter als der Frame (${bw.toFixed(0)} > ${frameW})`);
  });

  const file = path.resolve('public/assets', out);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(sheet));
  console.log(`${out}: 4 Frames à ${frameW}x${frameH}, Maßstab ${scale.toFixed(3)}`);
}

CHARACTERS.forEach(prepare);
