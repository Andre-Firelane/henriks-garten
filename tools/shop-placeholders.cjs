// Platzhalter für die festen Buden im Tierpark: die Snacks in der Hand, einfach gezeichnet (bis die echten Bilder da sind).
// Bude und Verkäufer (Eisstand bzw. Eisverkäuferin mit gedrehtem Farbton) nur noch mit ONLY=<sorte>_stand bzw. _seller –
// die echten Bilder kommen aus tools/stand-cut.py und npm run characters. Alle mit dem endgültigen
// Dateinamen, in allen Auflösungen (public/assets, hd/, hd2/), dazu eine Kopie zum Überarbeiten in Buden-Sprites/.
// Aufruf: node tools/shop-placeholders.cjs, danach python tools/make-webp.py .  (ONLY=name: nur dieses eine Bild – sonst werden alle neu geschrieben,
// also nicht mehr aufrufen, sobald echte Bilder da sind)
const { PNG } = require('pngjs');
const fs = require('fs');

const A = 'public/assets/';
const EXPORT = 'Buden-Sprites/';
const ONLY = process.env.ONLY ?? null;

// Farbton drehen (nur bunte Pixel; Grau, Weiß und Schwarz bleiben)
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hsl2rgb(h, s, l) {
  if (!s) return [l * 255, l * 255, l * 255];
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
}
function shiftHue(src, deg) {
  const out = new PNG({ width: src.width, height: src.height });
  for (let i = 0; i < src.data.length; i += 4) {
    let [r, g, b] = [src.data[i], src.data[i + 1], src.data[i + 2]];
    const [h, s, l] = rgb2hsl(r, g, b);
    if (s > 0.18) [r, g, b] = hsl2rgb((h + deg / 360 + 1) % 1, s, l);
    out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b; out.data[i + 3] = src.data[i + 3];
  }
  return out;
}

// Snack in der Hand: auf 96×144 gezeichnet (große Fassung), verkleinert auf 48×72 und 24×36
function canvas(w, h) {
  const p = new PNG({ width: w, height: h });
  p.data.fill(0);
  return p;
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function dot(p, x, y, c) {
  if (x < 0 || y < 0 || x >= p.width || y >= p.height) return;
  const i = (Math.floor(y) * p.width + Math.floor(x)) * 4;
  const [r, g, b] = hex(c);
  p.data[i] = r; p.data[i + 1] = g; p.data[i + 2] = b; p.data[i + 3] = 255;
}
function rect(p, x0, y0, x1, y1, c) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) dot(p, x, y, c);
}
function disc(p, cx, cy, r, c) {
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) dot(p, x, y, c);
}
function ring(p, cx, cy, r0, r1, c) {
  for (let y = cy - r1; y <= cy + r1; y++) for (let x = cx - r1; x <= cx + r1; x++) {
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (d <= r1 * r1 && d >= r0 * r0) dot(p, x, y, c);
  }
}
// Umriss: dunkler Rand um alles Gezeichnete (wie bei den anderen Sprites)
function outline(p, c = '#3b2a20') {
  const solid = (x, y) => x >= 0 && y >= 0 && x < p.width && y < p.height && p.data[(y * p.width + x) * 4 + 3] > 0;
  const add = [];
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    if (solid(x, y)) continue;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9 && solid(x + dx, y + dy)) { add.push([x, y]); dy = 9; break; }
  }
  for (const [x, y] of add) dot(p, x, y, c);
  return p;
}
// verkleinern: Mittelwert über k×k Pixel (mit Alpha)
function shrink(p, k) {
  const out = new PNG({ width: p.width / k, height: p.height / k });
  for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) {
      const i = ((y * k + dy) * p.width + x * k + dx) * 4;
      const w = p.data[i + 3];
      r += p.data[i] * w; g += p.data[i + 1] * w; b += p.data[i + 2] * w; a += w;
    }
    const o = (y * out.width + x) * 4;
    out.data[o] = a ? r / a : 0; out.data[o + 1] = a ? g / a : 0; out.data[o + 2] = a ? b / a : 0; out.data[o + 3] = a / (k * k);
  }
  return out;
}

const SNACKS = {
  popcorn: () => {
    const p = canvas(96, 144);
    for (let i = 0; i < 6; i++) rect(p, 24 + i * 8, 64, 32 + i * 8, 136, i % 2 ? '#ffffff' : '#e23b3b'); // Tüte rot-weiß
    for (const [x, y] of [[30, 58], [42, 50], [54, 52], [66, 58], [36, 44], [60, 42], [48, 38], [26, 66], [70, 66]]) disc(p, x, y, 9, '#fff3c4');
    for (const [x, y] of [[40, 56], [56, 46], [64, 60]]) disc(p, x, y, 4, '#f5c542');
    return outline(p);
  },
  lemonade: () => {
    const p = canvas(96, 144);
    rect(p, 56, 14, 62, 70, '#4fb3e8'); // Strohhalm
    for (let y = 60; y < 136; y++) {
      const w = 22 - Math.floor((y - 60) / 8);
      rect(p, 48 - w, y, 48 + w, y + 1, y < 72 ? '#ffffff' : '#ffe14d'); // Becher mit Limonade
    }
    disc(p, 34, 64, 9, '#a8e05a'); // Zitronenscheibe
    return outline(p);
  },
  cottoncandy: () => {
    const p = canvas(96, 144);
    rect(p, 45, 70, 51, 138, '#f3e6c8'); // Stiel
    for (const [x, y, r] of [[48, 44, 26], [30, 54, 16], [66, 54, 16], [40, 26, 14], [58, 28, 14]]) disc(p, x, y, r, '#ffa6d2');
    for (const [x, y] of [[38, 40], [58, 50], [48, 22]]) disc(p, x, y, 6, '#ffd1e8');
    return outline(p);
  },
  pretzel: () => {
    const p = canvas(96, 144);
    ring(p, 34, 76, 9, 19, '#b36a2a');
    ring(p, 62, 76, 9, 19, '#b36a2a');
    ring(p, 48, 100, 10, 22, '#b36a2a');
    for (const [x, y] of [[30, 62], [64, 64], [40, 114], [58, 112], [48, 82]]) disc(p, x, y, 2, '#ffffff'); // Salz
    return outline(p);
  },
};

// Farbton je Bude (Eisstand → ...)
const HUES = { popcorn: 150, lemonade: 60, cottoncandy: -40, pretzel: 100 };

const write = (file, png) => {
  fs.mkdirSync(require('path').dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png));
};
const read = (file) => PNG.sync.read(fs.readFileSync(file));
fs.mkdirSync(EXPORT, { recursive: true });

for (const [kind, hue] of Object.entries(HUES)) {
  // Bude und Verkäufer gibt es inzwischen als echte Bilder (tools/stand-cut.py, npm run characters): nur noch auf Wunsch
  const stand = `${kind}_stand`;
  if (ONLY === stand) {
    for (const dir of ['', 'hd/', 'hd2/']) write(`${A}${dir}${stand}.png`, shiftHue(read(`${A}${dir}icecream_stand.png`), hue));
    write(`${EXPORT}${stand}.png`, read(`${A}hd/${stand}.png`));
  }
  const seller = `${kind}_seller`;
  if (ONLY === seller) {
    write(`${A}${seller}.png`, shiftHue(read(`${A}icecream_seller.png`), hue));
    write(`${EXPORT}${seller}.png`, read(`${A}${seller}.png`));
  }
  if (!ONLY || ONLY === kind) {
    const big = SNACKS[kind]();
    write(`${A}hd/${kind}.png`, big);
    write(`${A}hd2/${kind}.png`, shrink(big, 2));
    write(`${A}${kind}.png`, shrink(big, 4));
    write(`${EXPORT}${kind}.png`, big);
  }
}
console.log('Buden-Platzhalter geschrieben.');
