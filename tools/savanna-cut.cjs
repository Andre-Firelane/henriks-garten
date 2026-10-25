// Nacharbeit für die Tiere der Savannen-Wetterphasen nach npm run cutout (Sprites/<Name>.png aus der .jpg):
// eingeschlossenes Weiß zwischen den Beinen, gemalte Schatten, der Fels unter dem Geier und die Beine des fliegenden
// Schuhschnabels kommen weg. Dazu entsteht "Nilpferd Wasser.png": die obere Hälfte der vier Köpfe (schwimmend im Wasserloch).
// Aufruf: node tools/savanna-cut.cjs  (danach npm run characters)
const { PNG } = require('pngjs');
const fs = require('fs');

const sat = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);
const JOBS = {
  // Fels und Zweige unter den Füßen (ab y 378), Weiß zwischen den Beinen
  Geier: { clear: [[0, 378, 1024, 572]], white: 300 },
  Hyäne: { white: 280 },
  'Hyäne frisst': { white: 280, whiteMin: 238 }, // der Knochen ist cremeweiß: nur reines Weiß weg
  Schuhschnabel: { white: 300 },
  // fliegend ohne Beine: vorne unter dem Bauch, hinten zwischen den Flügeln
  'Schuschnabel fliegend': { clear: [[0, 372, 512, 572], [585, 385, 705, 572], [815, 385, 945, 572]], white: 300 },
  Warzenschwein: { white: 300 },
  Nilpferd: { white: 330, shadow: { y: 392, sat: 9, min: 90 } }, // Schatten nur unten bei den Füßen (das Nilpferd ist grau)
  // grauer Schatten unter dem Fisch (der Fisch selbst ist grünlich)
  Lungenfisch: { shadow: { y: 220, sat: 10, min: 80 }, white: 150 },
  // Albino-Krokodil: der Schatten ist reines Grau, das Krokodil leicht rosa
  Krokodil2: { shadow: { y: 150, sat: 9, min: 80, max: 215 } },
};

for (const [name, job] of Object.entries(JOBS)) {
  const file = `Sprites/${name}.png`;
  const p = PNG.sync.read(fs.readFileSync(file));
  const { width: W, height: H, data: d } = p;
  let n = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (!d[i + 3]) continue;
      const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
      const cleared = (job.clear ?? []).some(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1);
      const white = job.white != null && y > job.white && Math.min(r, g, b) > (job.whiteMin ?? 222) && sat(r, g, b) < 18;
      const s = job.shadow;
      const shadow = s && y > s.y && sat(r, g, b) < s.sat && Math.min(r, g, b) > s.min && Math.max(r, g, b) < (s.max ?? 235);
      if (cleared || white || shadow) {
        d[i + 3] = 0;
        n++;
      }
    }
  }
  fs.writeFileSync(file, PNG.sync.write(p));
  console.log(`${file}: ${n} Pixel entfernt`);
}

// Nilpferd im Wasser: obere Kopfhälfte (Ohren, Augen, Nasenlöcher) der vier Ansichten, nebeneinander mit Abstand,
// unten bündig (dort ist die Wasserlinie)
{
  const src = PNG.sync.read(fs.readFileSync('Sprites/Nilpferd.png'));
  const HEADS = [
    [140, 160, 275, 255], // unten-rechts
    [288, 160, 425, 255], // unten-links
    [625, 160, 760, 240], // oben-rechts (von hinten)
    [770, 160, 905, 240], // oben-links
  ];
  const out = new PNG({ width: 1024, height: 200 });
  HEADS.forEach(([x0, y0, x1, y1], k) => {
    const ox = 40 + k * 250;
    const oy = 150 - (y1 - y0);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * src.width + x) * 4;
        const o = ((oy + y - y0) * out.width + ox + x - x0) * 4;
        for (let c = 0; c < 4; c++) out.data[o + c] = src.data[i + c];
      }
    }
  });
  fs.writeFileSync('Sprites/Nilpferd Wasser.png', PNG.sync.write(out));
  console.log('Sprites/Nilpferd Wasser.png: 4 Köpfe');
}
