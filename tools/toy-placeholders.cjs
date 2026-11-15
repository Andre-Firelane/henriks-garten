// Platzhalter für das Spielzeug der zweiten Ausbaustufe (src/world/toys.js): vorhandene Bilder als Vorlage (from),
// umgefärbt (color) bzw. kopiert, mit dem endgültigen Namen toy_<name>.png in allen Auflösungen (public/assets, hd/,
// hd2/), dazu die große Fassung zum Überarbeiten in Spielzeug-Sprites/.
// Aufruf: node tools/toy-placeholders.cjs, danach python tools/make-webp.py .  (ONLY=melons,slide: nur diese – sonst
// werden alle neu geschrieben, also nicht mehr für Spielsachen aufrufen, für die es schon echte Bilder gibt)
const { PNG } = require('pngjs');
const fs = require('fs');

const A = 'public/assets/';
const EXPORT = 'Spielzeug-Sprites/';
const ONLY = process.env.ONLY?.split(',') ?? null;

// Vorlagen und Farben wie in src/world/toys.js (dort steht auch, welches Gehege was bekommt)
const src = fs.readFileSync('src/world/toys.js', 'utf8');
const TOYS = [...src.matchAll(/^\s+(\w+): \{ char: '.', .*?from: '(\w+)', color: (null|'#[0-9a-f]{6}') \}/gm)].map((m) => ({
  id: m[1],
  from: m[2],
  color: m[3] === 'null' ? null : m[3].slice(1, -1),
}));

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// Bild auf eine Farbe legen: die Helligkeit des Vorbilds (um ihren Mittelwert) bleibt als Struktur erhalten
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

fs.mkdirSync(EXPORT, { recursive: true });
let n = 0;
for (const t of TOYS) {
  if (ONLY && !ONLY.includes(t.id)) continue;
  for (const dir of ['', 'hd/', 'hd2/']) {
    const from = `${A}${dir}${t.from}.png`;
    if (!fs.existsSync(from)) continue;
    const p = PNG.sync.read(fs.readFileSync(from));
    const out = t.color ? recolor(p, t.color) : p;
    fs.writeFileSync(`${A}${dir}toy_${t.id}.png`, PNG.sync.write(out));
    if (dir === 'hd/') fs.writeFileSync(`${EXPORT}toy_${t.id}.png`, PNG.sync.write(out));
  }
  n++;
}
console.log(`${n} Spielzeug-Platzhalter geschrieben.`);
