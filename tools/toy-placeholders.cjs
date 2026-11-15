// Platzhalter für Spielzeug und Deko ausgebauter Gehege (src/world/toys.js): from = vorhandenes Bild als Vorlage,
// umgefärbt (color) bzw. kopiert; from 'draw' = hier einfach gezeichnet (DRAW, Größe im Spiel × 4). Alles mit dem
// endgültigen Namen toy_<name>.png in allen Auflösungen (public/assets, hd/, hd2/), dazu die große Fassung zum Überarbeiten
// in Spielzeug-Sprites/.
// Aufruf: node tools/toy-placeholders.cjs, danach python tools/make-webp.py .  (ONLY=melons,slide: nur diese – sonst
// werden alle neu geschrieben, also nicht mehr für Spielsachen aufrufen, für die es schon echte Bilder gibt)
const { PNG } = require('pngjs');
const fs = require('fs');

const A = 'public/assets/';
const EXPORT = 'Spielzeug-Sprites/';
const ONLY = process.env.ONLY?.split(',') ?? null;

const src = fs.readFileSync('src/world/toys.js', 'utf8');
const TOYS = [...src.matchAll(/^\s+(\w+): \{ char: '.', .*?from: '(\w+)', color: (null|'#[0-9a-f]{6}') \}/gm)].map((m) => ({
  id: m[1],
  from: m[2],
  color: m[3] === 'null' ? null : m[3].slice(1, -1),
}));

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// ---- Umfärben (Vorlage) ----
function recolor(p, color, detail = 0.6) {
  const [cr, cg, cb] = hex(color);
  const lum = (i) => 0.3 * p.data[i] + 0.59 * p.data[i + 1] + 0.11 * p.data[i + 2];
  let sum = 0;
  let n = 0;
  for (let i = 0; i < p.data.length; i += 4) {
    if (p.data[i + 3] < 128) continue;
    sum += lum(i);
    n++;
  }
  const avg = sum / Math.max(1, n) || 1;
  const out = new PNG({ width: p.width, height: p.height });
  for (let i = 0; i < p.data.length; i += 4) {
    const k = Math.max(0.35, Math.min(1.4, 1 + (lum(i) / avg - 1) * detail * 1.6));
    out.data[i] = Math.min(255, cr * k);
    out.data[i + 1] = Math.min(255, cg * k);
    out.data[i + 2] = Math.min(255, cb * k);
    out.data[i + 3] = p.data[i + 3];
  }
  return out;
}

// ---- Zeichnen (große Fassung) ----
const canvas = (w, h) => {
  const p = new PNG({ width: w, height: h });
  p.data.fill(0);
  return p;
};
function dot(p, x, y, c, a = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= p.width || y >= p.height) return;
  const i = (y * p.width + x) * 4;
  const [r, g, b] = hex(c);
  p.data[i] = r; p.data[i + 1] = g; p.data[i + 2] = b; p.data[i + 3] = a;
}
const rect = (p, x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) dot(p, x, y, c); };
const ellipse = (p, cx, cy, rx, ry, c, a = 255) => {
  for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) dot(p, x, y, c, a);
};
const disc = (p, cx, cy, r, c) => ellipse(p, cx, cy, r, r, c);
function line(p, x0, y0, x1, y1, w, c) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= n; i++) disc(p, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, w / 2, c);
}
function ring(p, cx, cy, r0, r1, c) {
  for (let y = cy - r1; y <= cy + r1; y++) for (let x = cx - r1; x <= cx + r1; x++) {
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (d <= r1 * r1 && d >= r0 * r0) dot(p, x, y, c);
  }
}
// dunkler Umriss (wie die anderen Sprites); Bodenschatten erst danach (ohne Umriss)
function outline(p, c = '#3b2a20', r = 3) {
  const solid = (x, y) => x >= 0 && y >= 0 && x < p.width && y < p.height && p.data[(y * p.width + x) * 4 + 3] > 200;
  const add = [];
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    if (solid(x, y)) continue;
    let hit = false;
    for (let dy = -r; dy <= r && !hit; dy++) for (let dx = -r; dx <= r && !hit; dx++) if (dx * dx + dy * dy <= r * r && solid(x + dx, y + dy)) hit = true;
    if (hit) add.push([x, y]);
  }
  for (const [x, y] of add) dot(p, x, y, c);
  return p;
}
function shadow(p, cx, cy, rx, ry) {
  const s = canvas(p.width, p.height);
  ellipse(s, cx, cy, rx, ry, '#14280a', 70);
  for (let i = 0; i < p.data.length; i += 4) if (p.data[i + 3] > 0) for (let k = 0; k < 4; k++) s.data[i + k] = p.data[i + k];
  return s;
}

// Größe im Spiel × 4; der Fußpunkt (originY in toys.js) liegt jeweils unten in der Mitte
const DRAW = {
  // Wollknäuel 24 × 24, Fuß 20/24
  yarn_ball: () => {
    const p = canvas(96, 96);
    disc(p, 46, 50, 28, '#e86a92');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      line(p, 46 - Math.cos(a) * 26, 50 - Math.sin(a) * 18, 46 + Math.cos(a) * 26, 50 + Math.sin(a) * 18, 3, '#c94d77');
    }
    ring(p, 46, 50, 14, 17, '#f59ab5');
    line(p, 70, 64, 88, 78, 4, '#e86a92'); // loser Faden
    return shadow(outline(p), 48, 80, 34, 9);
  },
  // Katzenkörbchen 40 × 32, Fuß 26/32
  cat_basket: () => {
    const p = canvas(160, 128);
    ellipse(p, 80, 72, 70, 34, '#b77b3f');
    for (let x = 18; x < 150; x += 12) line(p, x, 56, x - 6, 98, 3, '#9a6331');
    ellipse(p, 80, 60, 56, 22, '#7aa8d8'); // Kissen
    ellipse(p, 80, 56, 44, 15, '#a3c4e8');
    return shadow(outline(p), 80, 104, 70, 14);
  },
  // Kratzbürste am Pfosten 32 × 48, Fuß 44/48
  scratch_post: () => {
    const p = canvas(128, 192);
    rect(p, 54, 30, 74, 176, '#8a5a30'); // Pfosten
    rect(p, 36, 166, 92, 180, '#6e4524'); // Fuß
    rect(p, 40, 60, 54, 130, '#5c3d22'); // Bürste
    for (let y = 62; y < 128; y += 5) line(p, 40, y, 26, y + 2, 3, '#d9b46a');
    disc(p, 64, 30, 12, '#a06a38');
    return shadow(outline(p), 64, 178, 40, 10);
  },
  // Rutsche 64 × 80, Fuß 76/80: links die Leiter, oben die Plattform, nach rechts unten die Rutschfläche
  slide: () => {
    const p = canvas(256, 320);
    line(p, 40, 300, 70, 110, 10, '#7a4e2a'); // Leiter
    line(p, 90, 300, 112, 110, 10, '#7a4e2a');
    for (let y = 130; y < 300; y += 28) line(p, 72 - (y - 110) * 0.16, y, 108 - (y - 110) * 0.12, y, 6, '#9a6a3a');
    rect(p, 60, 96, 140, 116, '#c98a4b'); // Plattform
    line(p, 64, 96, 64, 60, 6, '#7a4e2a'); // Geländer
    line(p, 136, 96, 136, 60, 6, '#7a4e2a');
    line(p, 64, 62, 136, 62, 6, '#7a4e2a');
    for (let t = 0; t < 1; t += 0.01) { // Rutschfläche (rot), leicht gebogen
      const x = 136 + t * 104;
      const y = 108 + t * 176 - Math.sin(t * Math.PI) * 30;
      line(p, x, y, x, y + 22, 3, t < 0.98 ? '#e04b4b' : '#e04b4b');
    }
    line(p, 136, 104, 240, 280, 4, '#ff8a80');
    return shadow(outline(p), 140, 302, 110, 16);
  },
  // Salzleckstein auf einem Holzpfosten 32 × 48, Fuß 44/48
  salt_lick: () => {
    const p = canvas(128, 192);
    rect(p, 56, 80, 72, 176, '#8a5a30');
    rect(p, 30, 46, 98, 92, '#f2eee6'); // Salzblock
    rect(p, 30, 46, 98, 56, '#ffffff');
    for (let i = 0; i < 6; i++) disc(p, 40 + i * 10, 70 + (i % 2) * 8, 3, '#d8d2c6');
    return shadow(outline(p), 64, 178, 36, 9);
  },
  // Lianen an einem hohen Pfosten 48 × 96, Fuß 92/96
  lianas: () => {
    const p = canvas(192, 384);
    rect(p, 86, 40, 106, 372, '#6b4524'); // Stamm
    line(p, 20, 50, 172, 50, 10, '#6b4524'); // Querbalken
    for (const [x, len] of [[34, 210], [62, 260], [134, 230], [160, 180]]) {
      for (let y = 54; y < 54 + len; y += 2) dot(p, x + Math.sin(y / 18) * 6, y, '#4f8a2f') || line(p, x + Math.sin(y / 18) * 6, y, x + Math.sin(y / 18) * 6 + 1, y, 5, '#4f8a2f');
      for (let y = 70; y < 54 + len; y += 26) ellipse(p, x + 8 + Math.sin(y / 18) * 6, y, 9, 5, '#79b544'); // Blätter
    }
    return shadow(outline(p), 96, 370, 70, 14);
  },
  // Kletterseile: Gerüst mit hängenden Seilen 64 × 80, Fuß 76/80
  climb_ropes: () => {
    const p = canvas(256, 320);
    line(p, 30, 304, 52, 40, 12, '#7a4e2a');
    line(p, 226, 304, 204, 40, 12, '#7a4e2a');
    line(p, 44, 44, 212, 44, 12, '#7a4e2a');
    for (const x of [80, 128, 176]) {
      line(p, x, 48, x + 4, 250, 6, '#d9b46a');
      for (let y = 80; y < 250; y += 34) ellipse(p, x + 2, y, 7, 5, '#b8924a'); // Knoten
    }
    return shadow(outline(p), 128, 306, 110, 14);
  },
  // runder Heuballen 40 × 40, Fuß 36/40 (liegt auf der Seite, Stirnseite mit Spirale)
  hay_bale: () => {
    const p = canvas(160, 160);
    rect(p, 30, 50, 120, 136, '#e3c158');
    ellipse(p, 30, 93, 22, 43, '#d9b247');
    ellipse(p, 120, 93, 26, 43, '#f0d478');
    for (let r = 6; r < 40; r += 8) ring(p, 120, 93, r, r + 2, '#c99b33');
    for (let x = 40; x < 116; x += 9) line(p, x, 54, x + 4, 132, 2, '#cfa840');
    line(p, 70, 50, 70, 136, 4, '#a4472f'); // Schnur
    return shadow(outline(p), 80, 142, 64, 12);
  },
  // Strohnest 40 × 32, Fuß 26/32 (flach auf dem Boden)
  straw_nest: () => {
    const p = canvas(160, 128);
    ellipse(p, 80, 76, 70, 30, '#d9b247');
    ellipse(p, 80, 70, 44, 16, '#a9862e');
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      line(p, 80 + Math.cos(a) * 44, 74 + Math.sin(a) * 18, 80 + Math.cos(a + 0.4) * 68, 76 + Math.sin(a + 0.4) * 28, 2, i % 2 ? '#f0d478' : '#c99b33');
    }
    return shadow(outline(p), 80, 104, 70, 12);
  },
  // Schaukelringe an einem Gestell 48 × 80, Fuß 76/80
  swing_rings: () => {
    const p = canvas(192, 320);
    line(p, 20, 304, 40, 40, 10, '#7a4e2a');
    line(p, 172, 304, 152, 40, 10, '#7a4e2a');
    line(p, 30, 44, 162, 44, 10, '#7a4e2a');
    for (const [x, y] of [[70, 150], [122, 190]]) {
      line(p, x, 48, x, y - 22, 3, '#c9a36b');
      ring(p, x, y, 16, 23, '#e04b4b');
    }
    return shadow(outline(p), 96, 306, 82, 12);
  },
};

// verkleinern (Mittelwert über k × k Pixel, mit Alpha)
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

const write = (file, png) => fs.writeFileSync(file, PNG.sync.write(png));
fs.mkdirSync(EXPORT, { recursive: true });
let n = 0;
for (const t of TOYS) {
  if (ONLY && !ONLY.includes(t.id)) continue;
  if (t.from === 'draw') {
    if (!DRAW[t.id]) throw new Error(`keine Zeichnung für ${t.id}`);
    const big = DRAW[t.id]();
    write(`${A}hd/toy_${t.id}.png`, big);
    write(`${A}hd2/toy_${t.id}.png`, shrink(big, 2));
    write(`${A}toy_${t.id}.png`, shrink(big, 4));
    write(`${EXPORT}toy_${t.id}.png`, big);
    n++;
    continue;
  }
  for (const dir of ['', 'hd/', 'hd2/']) {
    const from = `${A}${dir}${t.from}.png`;
    if (!fs.existsSync(from)) continue;
    const p = PNG.sync.read(fs.readFileSync(from));
    const out = t.color ? recolor(p, t.color) : p;
    write(`${A}${dir}toy_${t.id}.png`, out);
    if (dir === 'hd/') write(`${EXPORT}toy_${t.id}.png`, out);
  }
  n++;
}
console.log(`${n} Spielzeug-Platzhalter geschrieben.`);
