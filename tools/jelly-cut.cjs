// Qualle: nach npm run cutout -- "Sprites/Qualle.jpg" "Sprites/Qualle.png" bleiben das Weiß zwischen den Tentakeln
// (von außen nicht erreichbar) und der bunte Schimmer am Boden stehen. Unterhalb des Schirms (ab BELL_Y) wird alles
// sehr Helle entfernt; die Tentakel sind kräftiger gefärbt und bleiben.
// Aufruf: node tools/jelly-cut.cjs [Datei]   (ohne Angabe Sprites/Qualle.png; für die Goldqualle Sprites/Qualle2.png; danach npm run characters)
const { PNG } = require('pngjs');
const fs = require('fs');

const FILE = process.argv[2] ?? 'Sprites/Qualle.png';
const BELL_Y = 232; // Unterkante der Schirme im Bild
const LIGHT = 175; // so hell muss der dunkelste Farbkanal sein, damit der Pixel als Hintergrund bzw. Schimmer gilt
const GLOW_Y = 440; // darunter liegt der Schimmer am Boden: dort schon ab GLOW_LIGHT entfernen
const GLOW_LIGHT = 125;

const p = PNG.sync.read(fs.readFileSync(FILE));
const { width: W, height: H, data: d } = p;
let n = 0;
for (let y = BELL_Y; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (d[i + 3] && Math.min(d[i], d[i + 1], d[i + 2]) > (y > GLOW_Y ? GLOW_LIGHT : LIGHT)) {
      d[i + 3] = 0;
      n++;
    }
  }
}
fs.writeFileSync(FILE, PNG.sync.write(p));
console.log(`${FILE}: ${n} helle Pixel entfernt`);
