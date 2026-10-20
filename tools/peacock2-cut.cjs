// Weißer Pfau ohne Rad: das Rad lässt sich beim weißen Pfau nicht an der Farbe erkennen (alles weiß). Weil das Bild
// genauso aufgebaut ist wie das des blauen Pfaus, dient der fertig zugeschnittene blaue Pfau (Sprites/Pfau.png, siehe
// peacock-cut.cjs) als Schablone: in den Vorderansichten bleibt oberhalb von TAIL_Y nur, was auch dort zu sehen ist.
// Das Krönchen kommt (wie beim blauen) aus der eigenen Rückansicht, lose Reste werden entfernt.
// Aufruf: node tools/peacock2-cut.cjs   (nach npm run cutout -- "Sprites/Pfau2.jpg" "Sprites/Pfau2.png" 658,365 866,365)
const { PNG } = require('pngjs');
const fs = require('fs');
const TAIL_Y = 350; // darunter: Beine und Schwanz bleiben ganz
const SHRINK = 3; // Schablone etwas enger (der blaue Pfau hat einen breiten Rand)
const FRONTS = [[0, 272], [272, 535]];
const mask = PNG.sync.read(fs.readFileSync('Sprites/Pfau.png'));
const p = PNG.sync.read(fs.readFileSync('Sprites/Pfau2.png'));
const W = p.width, H = p.height, d = p.data;
const opaque = (img, x, y) => img.data[(y * W + x) * 4 + 3] > 20;

// oberster Punkt einer Figur im Streifen x0..x1 und die Mitte dort
function topOf(img, x0, x1) {
  for (let y = 0; y < H; y++) {
    const xs = [];
    for (let x = x0; x < x1; x++) if (opaque(img, x, y)) xs.push(x);
    if (xs.length) return { y, x: Math.round(xs.reduce((s, v) => s + v, 0) / xs.length) };
  }
  return null;
}

// Höhe des Krönchens: ab der obersten Zeile, bis die Figur breiter als die Krönchen-Stängel wird (dort beginnt der Kopf)
function crestHeight(img, x0, x1, top) {
  for (let y = top.y; y < top.y + 60; y++) {
    let n = 0;
    for (let x = top.x - 30; x <= top.x + 30; x++) if (x >= x0 && x < x1 && opaque(img, x, y)) n++;
    if (n > 26) return y - top.y;
  }
  return 30;
}

// Krönchen der Rückansicht
const back = topOf(p, 535, 790);
const backH = crestHeight(p, 535, 790, back);
const crest = [];
for (let y = back.y; y < back.y + backH; y++) for (let x = back.x - 24; x <= back.x + 24; x++) {
  const i = (y * W + x) * 4;
  if (d[i + 3] > 20) crest.push([x - back.x, y - back.y, d[i], d[i + 1], d[i + 2], d[i + 3]]);
}

for (const [x0, x1] of FRONTS) {
  // Schablone: nur behalten, was der zugeschnittene blaue Pfau hier auch hat (um SHRINK Pixel enger)
  const inMask = (x, y) => {
    for (let k = -SHRINK; k <= SHRINK; k++) if (!opaque(mask, x + k, y) || !opaque(mask, x, y + k)) return false;
    return true;
  };
  const top = topOf(mask, x0, x1);
  const frontH = crestHeight(mask, x0, x1, top);
  for (let y = 0; y < TAIL_Y; y++) for (let x = x0; x < x1; x++) {
    if (y < top.y + frontH) continue; // Krönchen-Bereich: kommt gleich aus der Rückansicht
    if (!inMask(x, y)) d[(y * W + x) * 4 + 3] = 0;
  }
  // Krönchen: an der Stelle des blauen Krönchens das weiße aus der Rückansicht, unten bündig auf dem Kopf
  for (let y = 0; y < top.y + frontH; y++) for (let x = x0; x < x1; x++) d[(y * W + x) * 4 + 3] = 0;
  const shift = top.y + frontH - (back.y + backH);
  for (const [dx, dy, r, g, b, a] of crest) {
    const i = ((back.y + dy + shift) * W + top.x + dx) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
  }
  // nur das größte zusammenhängende Stück behalten (keine losen Federreste); das Krönchen gehört dazu
  const comp = new Int32Array(W * H).fill(-1);
  const sizes = [];
  for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) {
    const s = y * W + x;
    if (comp[s] >= 0 || d[s * 4 + 3] < 20) continue;
    const id = sizes.length;
    let n = 0;
    const st = [s];
    comp[s] = id;
    while (st.length) {
      const c = st.pop(); n++;
      const cx = c % W, cy = (c - cx) / W;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < x0 || nx >= x1 || ny < 0 || ny >= H) continue;
        const m = ny * W + nx;
        if (comp[m] < 0 && d[m * 4 + 3] >= 20) { comp[m] = id; st.push(m); }
      }
    }
    sizes.push(n);
  }
  const big = sizes.indexOf(Math.max(...sizes));
  for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) {
    const s = y * W + x;
    if (comp[s] >= 0 && comp[s] !== big) d[s * 4 + 3] = 0;
  }
}
fs.writeFileSync('Sprites/Pfau2.png', PNG.sync.write(p));
console.log('ok');
