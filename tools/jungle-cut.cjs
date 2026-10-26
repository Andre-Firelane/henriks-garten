// Nacharbeit für die Dschungel-Bilder nach npm run cutout (Sprites/<Name>.png aus der .jpg): der gemalte Boden unter
// den Brüllaffen (graue Fläche, Kiesel, Blätter), Blätter neben der Spielfigur und dem Kanu, der graue Schatten unter
// dem Kanu und das eingeschlossene Weiß zwischen den Schwimmern des Wasserflugzeugs kommen weg.
// Aufruf: node tools/jungle-cut.cjs  (nach npm run cutout, danach ONLY=... npm run characters)
const { PNG } = require('pngjs');
const fs = require('fs');

const MIN_PART = 1500; // so viele Pixel hat ein Teil mindestens, das zur Figur gehört
const sat = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);
// grünliche Blätter (das Fell ist neutral schwarz-grau, die Kleidung der Spielfigur dunkel olivgrün)
const leaf = (r, g, b) => g > r + 8 && Math.max(r, g, b) > 70;
// heller, wenig bunter Boden, Kiesel und Schatten
const ground = (r, g, b) => Math.min(r, g, b) > 120 && sat(r, g, b) < 45;
const JOBS = {
  Brüllaffe: (r, g, b) => leaf(r, g, b) || ground(r, g, b),
  'Brüllaffe springt': (r, g, b) => ground(r, g, b),
  // die Banane ist innen fast weiß: Boden nur unten bei den Füßen
  'Brüllaffe frisst': (r, g, b, x, y) => leaf(r, g, b) || (y > 360 && ground(r, g, b)),
  'Charakter Dschungel': (r, g, b) => g > r + 18 && Math.max(r, g, b) > 120,
  'Kanu besetzt': (r, g, b) => (g > r + 18 && Math.max(r, g, b) > 100) || (sat(r, g, b) < 14 && Math.min(r, g, b) > 70 && Math.max(r, g, b) < 215),
  Kanu: (r, g, b) => sat(r, g, b) < 14 && Math.min(r, g, b) > 70 && Math.max(r, g, b) < 215, // Schatten unter dem Rumpf
  Wasserflugzeug: (r, g, b) => Math.min(r, g, b) > 236 && sat(r, g, b) < 10, // Weiß zwischen Schwimmern und Streben
  // Schlange und Vogelspinne (je zwei Farben): Boden, Kiesel und Blätter; die grüne Schlange nur den Boden (sie ist selbst grün)
  Schlange: (r, g, b) => leaf(r, g, b) || ground(r, g, b),
  Schlange2: (r, g, b) => ground(r, g, b),
  Vogelspinne: (r, g, b) => leaf(r, g, b) || ground(r, g, b),
  Vogelspinne2: (r, g, b) => leaf(r, g, b) || ground(r, g, b),
  // roter Panda (laufend und sitzend): grauer Boden, Kiesel und Blätter nur unten (Gesicht und Ohren sind weiß)
  'Roter Panda': (r, g, b, x, y) => leaf(r, g, b) || (y > 340 && ground(r, g, b)),
  'Roter panda sitzt': (r, g, b, x, y) => leaf(r, g, b) || (y > 340 && ground(r, g, b)),
  // Gibbon (laufend, springend, fressend): Boden und Blätter unten (das Gesicht hat einen weißen Kranz); beim Fressen
  // steht unter jedem eine eigene Bodenkachel – alles unterhalb der Figuren weg
  Gibbon: (r, g, b, x, y) => leaf(r, g, b) || (y > 340 && ground(r, g, b)) || (y > 240 && Math.min(r, g, b) > 236 && sat(r, g, b) < 12), // dazu das Weiß zwischen Armen und Beinen
  'Gibbon springt': (r, g, b, x, y) => y > 380 && ground(r, g, b),
  'Gibbon frisst': (r, g, b, x, y) => y > 376,
  // Aras (rot und blau-gelb, sitzend und fliegend): nur der graue Schatten unten (das Gesicht ist weiß)
  Ara: (r, g, b, x, y) => y > 380 && ground(r, g, b),
  'Ara fliegend': (r, g, b, x, y) => y > 380 && ground(r, g, b),
  Ara2: (r, g, b, x, y) => y > 380 && ground(r, g, b),
  'Ara2 fliegend': (r, g, b, x, y) => y > 380 && ground(r, g, b),
};

for (const [name, cut] of Object.entries(JOBS)) {
  const file = `Sprites/${name}.png`;
  const p = PNG.sync.read(fs.readFileSync(file));
  const { width: W, height: H, data: d } = p;
  let n = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (!d[i + 3]) continue;
      if (cut(d[i], d[i + 1], d[i + 2], x, y)) {
        d[i + 3] = 0;
        n++;
      }
    }
  }
  // einzelne Reste (Krümel, Kanten der Blätter): Pixel mit weniger als 3 sichtbaren Nachbarn weg
  const a = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[(y * W + x) * 4 + 3]);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!a(x, y)) continue;
        let k = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && a(x + dx, y + dy) > 20) k++;
        if (k < 3) d[(y * W + x) * 4 + 3] = 0;
      }
    }
  }
  // kleine, freistehende Teile (Blätter am Boden, Kiesel): alles, was nicht an einer großen Fläche hängt, weg
  const seen = new Uint8Array(W * H);
  for (let start = 0; start < W * H; start++) {
    if (seen[start] || d[start * 4 + 3] <= 20) continue;
    const part = [start];
    seen[start] = 1;
    for (let k = 0; k < part.length; k++) {
      const x = part[k] % W, y = (part[k] - x) / W;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, j = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[j] || d[j * 4 + 3] <= 20) continue;
        seen[j] = 1;
        part.push(j);
      }
    }
    if (part.length < MIN_PART) for (const j of part) d[j * 4 + 3] = 0;
  }
  fs.writeFileSync(file, PNG.sync.write(p));
  console.log(`${file}: ${n} Pixel entfernt`);
}
