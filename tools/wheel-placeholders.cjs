// Platzhalter für das Riesenrad im Tierpark (bis die echten Bilder da sind): Gerüst, Rad und Gondel einfach gezeichnet
// (doppelt so groß wie im Spiel, dort mit 0,5 skaliert), dazu die sitzenden Besucher (Oberkörper aus dem ersten Frame
// von visitor1 … visitor8, wie sie in der Gondel zu sehen sind). Alles mit dem endgültigen Dateinamen in public/assets,
// dazu eine Kopie zum Überarbeiten in Riesenrad-Sprites/.
// Aufruf: node tools/wheel-placeholders.cjs, danach python tools/make-webp.py .  (ONLY=name: nur dieses eine Bild)
const { PNG } = require('pngjs');
const fs = require('fs');

const A = 'public/assets/';
const EXPORT = 'Riesenrad-Sprites/';
const ONLY = process.env.ONLY ?? null;
fs.mkdirSync(EXPORT, { recursive: true });

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const canvas = (w, h) => {
  const p = new PNG({ width: w, height: h });
  p.data.fill(0);
  return p;
};
function dot(p, x, y, c) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= p.width || y >= p.height) return;
  const i = (y * p.width + x) * 4;
  const [r, g, b] = hex(c);
  p.data[i] = r; p.data[i + 1] = g; p.data[i + 2] = b; p.data[i + 3] = 255;
}
const rect = (p, x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) dot(p, x, y, c); };
const disc = (p, cx, cy, r, c) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) dot(p, x, y, c); };
const ring = (p, cx, cy, r0, r1, c) => {
  for (let y = cy - r1; y <= cy + r1; y++) for (let x = cx - r1; x <= cx + r1; x++) {
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (d <= r1 * r1 && d >= r0 * r0) dot(p, x, y, c);
  }
};
// dicke Linie
function line(p, x0, y0, x1, y1, w, c) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= n; i++) disc(p, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, w / 2, c);
}
// dunkler Umriss um alles Gezeichnete
function outline(p, c = '#3b2a20', r = 2) {
  const solid = (x, y) => x >= 0 && y >= 0 && x < p.width && y < p.height && p.data[(y * p.width + x) * 4 + 3] > 0;
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

const IMAGES = {
  // Rad: 300×300, Mitte = Nabe; Gondeln hängen am Kreis mit Radius 136 (im Spiel 68)
  wheel_ring: () => {
    const p = canvas(300, 300);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      line(p, 150, 150, 150 + Math.cos(a) * 136, 150 + Math.sin(a) * 136, 3, '#f3f3f3');
    }
    ring(p, 150, 150, 130, 140, '#e8483f');
    ring(p, 150, 150, 56, 62, '#e8483f');
    for (let i = 0; i < 16; i++) {
      const a = ((i + 0.5) / 16) * Math.PI * 2;
      disc(p, 150 + Math.cos(a) * 135, 150 + Math.sin(a) * 135, 4, '#ffe14d'); // Lämpchen
    }
    disc(p, 150, 150, 16, '#9aa7b3');
    disc(p, 150, 150, 7, '#5d6d7e');
    return outline(p);
  },
  // Gerüst: 240×300, Nabe bei (120, 40), Boden unten (Fußpunkt in der Mitte unten)
  wheel_stand: () => {
    const p = canvas(240, 300);
    line(p, 30, 270, 120, 40, 10, '#6c7a89');
    line(p, 210, 270, 120, 40, 10, '#6c7a89');
    line(p, 64, 180, 176, 180, 6, '#6c7a89');
    disc(p, 120, 40, 12, '#5d6d7e');
    rect(p, 14, 268, 226, 292, '#c98a4b'); // Plattform
    rect(p, 14, 268, 226, 274, '#e0a868');
    for (let x = 30; x < 226; x += 28) rect(p, x, 274, x + 2, 292, '#a86f38');
    return outline(p);
  },
  // Gondel: 80×72, oben in der Mitte der Aufhänger; hell, damit sie im Spiel eingefärbt werden kann
  wheel_gondola: () => {
    const p = canvas(80, 72);
    rect(p, 38, 0, 42, 6, '#9aa7b3'); // Aufhänger
    for (let y = 4; y < 12; y++) { const w = 8 + (y - 4) * 3.8; rect(p, Math.round(40 - w), y, Math.round(40 + w), y + 1, '#f2f2f2'); } // flaches Dach
    rect(p, 8, 12, 12, 48, '#d8d8d8'); // Stangen (dazwischen ein großes Fenster: dort sieht man den Fahrgast)
    rect(p, 68, 12, 72, 48, '#d8d8d8');
    for (let y = 48; y < 70; y++) { const w = 34 - Math.max(0, y - 62) * 1.5; rect(p, Math.round(40 - w), y, Math.round(40 + w), y + 1, '#f7f7f7'); } // Korb
    rect(p, 6, 52, 74, 55, '#c8c8c8');
    return outline(p);
  },
};

const write = (file, png) => fs.writeFileSync(file, PNG.sync.write(png));
for (const [name, make] of Object.entries(IMAGES)) {
  if (ONLY && ONLY !== name) continue;
  const png = make();
  write(`${A}${name}.png`, png);
  write(`${EXPORT}${name}.png`, png);
}

// sitzende Besucher: Oberkörper (Frame 0, die oberen 66 Pixel) aus visitor1 … visitor8
for (let n = 1; n <= 8; n++) {
  const name = `visitor${n}_sit`;
  if (ONLY && ONLY !== name) continue;
  const src = PNG.sync.read(fs.readFileSync(`${A}visitor${n}.png`));
  const out = canvas(72, 66);
  for (let y = 0; y < 66; y++) for (let x = 0; x < 72; x++) {
    const i = (y * src.width + x) * 4;
    const o = (y * 72 + x) * 4;
    for (let k = 0; k < 4; k++) out.data[o + k] = src.data[i + k];
  }
  write(`${A}${name}.png`, out);
  write(`${EXPORT}${name}.png`, out);
}
console.log('Riesenrad-Platzhalter geschrieben.');
