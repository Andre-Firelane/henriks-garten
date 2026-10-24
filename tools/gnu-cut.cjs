// Gnu: nach npm run cutout -- "Sprites/Gnu.jpg" "Sprites/Gnu.png" bleiben das Weiß zwischen den Beinen (von außen nicht
// erreichbar) und der dunklere graue Bodenschatten stehen. Beides wird im unteren Bildteil entfernt; das Gnu selbst ist
// bläulich grau (etwas gesättigt), die Hufe sind dunkel und bleiben. Aufruf: node tools/gnu-cut.cjs (danach npm run characters)
const { PNG } = require('pngjs');
const fs = require('fs');

const FILE = 'Sprites/Gnu.png';
const LEGS_Y = 300; // darunter: Weiß zwischen den Beinen
const SHADOW_Y = 360; // darunter: grauer Bodenschatten

const p = PNG.sync.read(fs.readFileSync(FILE));
const { width: W, height: H, data: d } = p;
let n = 0;
for (let y = LEGS_Y; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (!d[i + 3]) continue;
    const max = Math.max(d[i], d[i + 1], d[i + 2]);
    const min = Math.min(d[i], d[i + 1], d[i + 2]);
    const white = min > 215 && max - min < 20;
    const shadow = y > SHADOW_Y && min > 90 && max - min < 14;
    if (white || shadow) {
      d[i + 3] = 0;
      n++;
    }
  }
}
fs.writeFileSync(FILE, PNG.sync.write(p));
console.log(`${FILE}: ${n} Pixel entfernt`);
