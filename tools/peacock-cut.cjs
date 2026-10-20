// Aufruf: node tools/peacock-cut.cjs "Sprites/Pfau.png" "Sprites/Pfau.png" (nach npm run cutout -- "Sprites/Pfau.jpg" "Sprites/Pfau.png" 658,365 866,365)
// Pfau ohne Rad: bei den Vorderansichten (linke Bildhälfte) das aufgefächerte Rad wegschneiden.
// Behalten: der blaue Körper samt Hals und Kopf (größtes zusammenhängendes Blau), ein Rand darum (Umriss, Flügel,
// Schnabel), und alles unterhalb von TAIL_Y (Beine und der normale Schwanz unter dem Rad).
const { PNG } = require('pngjs');
const fs = require('fs');
const [inp, out, tailY = '335', grow = '7'] = process.argv.slice(2);
const p = PNG.sync.read(fs.readFileSync(inp));
const W = p.width, H = p.height, d = p.data;
const TAIL_Y = Number(tailY), GROW = Number(grow);
const blue = (i) => d[i + 3] > 128 && d[i + 2] > 120 && d[i + 2] > d[i + 1] + 35 && d[i] < 110;
// größte zusammenhängende blaue Fläche (Körper) in einem Bildstreifen
function body(x0, x1) {
  const seen = new Uint8Array(W * H);
  let best = [];
  for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) {
    const s = y * W + x;
    if (seen[s] || !blue(s * 4)) continue;
    const q = [s], part = [];
    seen[s] = 1;
    while (q.length) {
      const c = q.pop(); part.push(c);
      const cx = c % W, cy = (c - cx) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < x0 || nx >= x1 || ny < 0 || ny >= H) continue;
        const n = ny * W + nx;
        if (!seen[n] && blue(n * 4)) { seen[n] = 1; q.push(n); }
      }
    }
    if (part.length > best.length) best = part;
  }
  let top = H, sumX = 0, n = 0;
  for (const c of best) top = Math.min(top, Math.floor(c / W));
  for (const c of best) if (Math.floor(c / W) < top + 12) { sumX += c % W; n++; }
  return { best, top, hx: Math.round(sumX / n) };
}
// Krönchen der Rückansicht (sauber vor weißem Hintergrund): Pixel über dem Kopf
const back = body(535, 790);
const crest = [];
for (let y = Math.max(0, back.top - 45); y < back.top + 3; y++) for (let x = back.hx - 24; x <= back.hx + 24; x++) {
  const i = (y * W + x) * 4;
  if (d[i + 3] > 20) crest.push([x - back.hx, y - back.top, d[i], d[i + 1], d[i + 2], d[i + 3]]);
}
const crests = [];
for (const [x0, x1] of [[0, 272], [272, 535]]) {
  const { best } = body(x0, x1);
  // Rand dazu (Umriss, Flügel, Schnabel, Augen, Krönchen)
  const keep = new Uint8Array(W * H);
  for (const c of best) keep[c] = 1;
  for (let k = 0; k < GROW; k++) {
    const add = [];
    for (let y = 1; y < H - 1; y++) for (let x = x0 + 1; x < x1 - 1; x++) {
      const s = y * W + x;
      if (keep[s] || d[s * 4 + 3] < 20) continue;
      if (keep[s - 1] || keep[s + 1] || keep[s - W] || keep[s + W]) add.push(s);
    }
    for (const s of add) keep[s] = 1;
  }
  // Krönchen und Kopf liegen über dem Rad und sind blau: schon drin. Flügel (braun) hängt am Körper: mit wachsen lassen
  for (let k = 0; k < 14; k++) {
    const add = [];
    for (let y = 1; y < H - 1; y++) for (let x = x0 + 1; x < x1 - 1; x++) {
      const s = y * W + x, i = s * 4;
      if (keep[s] || d[i + 3] < 20) continue;
      const brown = d[i] > d[i + 2] + 20 && d[i] > 90 && d[i + 1] > 60 && d[i + 1] < d[i] && Math.abs(d[i] - d[i + 1]) < 70;
      if (brown && (keep[s - 1] || keep[s + 1] || keep[s - W] || keep[s + W])) add.push(s);
    }
    for (const s of add) keep[s] = 1;
  }
  // das Krönchen kommt später aus der Rückansicht (das hier ist mit den Federn des Rads verwoben)
  const { top, hx } = body(x0, x1);
  crests.push({ top, hx });
  for (let y = 0; y < Math.min(H, TAIL_Y); y++) for (let x = x0; x < x1; x++) {
    const s = y * W + x;
    if (!keep[s] && d[s * 4 + 3]) d[s * 4 + 3] = 0, (keep[s] = 2); // 2: weggeschnitten
  }
  // Löcher im Körper (Augen, Glanzpunkte) wieder füllen: weggeschnittene Pixel, die nicht von außen erreichbar sind
  const outside = new Uint8Array(W * H);
  const q = [];
  for (let x = x0; x < x1; x++) for (const y of [0, H - 1]) q.push(y * W + x);
  for (let y = 0; y < H; y++) for (const x of [x0, x1 - 1]) q.push(y * W + x);
  for (const s of q) outside[s] = 1;
  while (q.length) {
    const c = q.pop();
    const cx = c % W, cy = (c - cx) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < x0 || nx >= x1 || ny < 0 || ny >= H) continue;
      const n = ny * W + nx;
      if (!outside[n] && (d[n * 4 + 3] < 20)) { outside[n] = 1; q.push(n); }
    }
  }
  for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) {
    const s = y * W + x;
    if (keep[s] === 2 && !outside[s]) d[s * 4 + 3] = 255;
  }
  // nur das größte zusammenhängende Stück behalten (keine losen Federreste)
  const comp = new Int32Array(W * H).fill(-1);
  const sizes = [];
  for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) {
    const s = y * W + x;
    if (comp[s] >= 0 || d[s * 4 + 3] < 20) continue;
    const id = sizes.length; let n = 0; const st = [s]; comp[s] = id;
    while (st.length) {
      const c = st.pop(); n++;
      const cx = c % W, cy = (c - cx) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
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
for (const { top, hx } of crests) {
  for (const [dx, dy, r, g, bl, al] of crest) {
    if (dy >= 0) continue; // nur oberhalb des Kopfs
    const i = ((top + dy) * W + hx + dx) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = bl; d[i + 3] = al;
  }
}
fs.writeFileSync(out, PNG.sync.write(p));
console.log('ok');
