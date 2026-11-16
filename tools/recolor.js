// Seltene Skins durch Umfärben: graue Töne eines fertigen Spritesheets (Weiß bis Schwarz) werden auf eine Farbskala
// umgelegt, farbige Stellen (Augen, Nase, Zunge) bleiben. Aufruf: npm run recolor (ONLY=zebra2.png,...: nur diese)
// Nach `npm run characters` erneut ausführen, wenn sich die Ausgangsbilder geändert haben.
// darkOnly: nur das dunkle, farblose Fell umfärben (unter below, darüber über fade weich auslaufend), Weiß und die
// bräunlichen Umrisse und Pupillen (Sättigung über sat) bleiben (früher für den weinroten Panda)
import { PNG } from 'pngjs';
import fs from 'node:fs';

// Ausgangsbild → umgefärbtes Bild, Farbskala von hell (Weiß) über mittel nach dunkel (Schwarz)
const JOBS = [
  // Schoko-Zebra: Streifen schokobraun, das Weiß cremefarben
  { from: 'zebra', to: 'zebra2', light: [250, 240, 222], mid: [120, 72, 40], dark: [40, 20, 10] },
  { from: 'zebra_drink', to: 'zebra2_drink', light: [250, 240, 222], mid: [120, 72, 40], dark: [40, 20, 10] },
  // Zwergflusspferd im Wasser (obere Kopfhälfte): das graue Nilpferd dunkel schiefergrau, die rosa Ohren bleiben
  { from: 'hippo_water', to: 'hippo2_water', light: [150, 140, 152], mid: [74, 66, 78], dark: [22, 18, 26] },
  // (früher auch der weinrote Panda; die seltene Panda-Variante hat jetzt eigene Bilder: Sprites/Panda2.webp, tools/rare-static.py)
];
const ONLY = process.env.ONLY?.split(',');
const MAX_SATURATION = 40; // stärker farbige Pixel bleiben, wie sie sind

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

for (const { from, to, light, mid, dark, darkOnly } of JOBS) {
  if (ONLY && !ONLY.includes(`${to}.png`)) continue;
  const png = PNG.sync.read(fs.readFileSync(`public/assets/${from}.png`));
  const d = png.data;
  for (let o = 0; o < d.length; o += 4) {
    if (!d[o + 3]) continue;
    const r = d[o], g = d[o + 1], b = d[o + 2];
    if (darkOnly) {
      const lum = (r + g + b) / 3;
      if (Math.max(r, g, b) - Math.min(r, g, b) > darkOnly.sat || lum >= darkOnly.below + darkOnly.fade) continue;
      const c = mix(dark, mid, Math.min(1, lum / darkOnly.below));
      const w = lum < darkOnly.below ? 1 : 1 - (lum - darkOnly.below) / darkOnly.fade;
      [d[o], d[o + 1], d[o + 2]] = mix([r, g, b], c, w);
      continue;
    }
    if (Math.max(r, g, b) - Math.min(r, g, b) > MAX_SATURATION) continue;
    const l = (r + g + b) / 3 / 255; // 1 = Weiß, 0 = Schwarz
    const c = l >= 0.5 ? mix(mid, light, (l - 0.5) * 2) : mix(dark, mid, l * 2);
    [d[o], d[o + 1], d[o + 2]] = c;
  }
  fs.writeFileSync(`public/assets/${to}.png`, PNG.sync.write(png));
  console.log(`${to}.png aus ${from}.png`);
}
