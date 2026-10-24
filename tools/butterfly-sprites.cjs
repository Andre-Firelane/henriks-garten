// Schmetterlinge (Platzhalter, bis echte Bilder da sind): 12 Farben, je 3 Flügelstellungen (offen, halb, fast zu),
// leicht von oben gesehen. Ergebnis: public/assets/butterfly.png (Raster: 3 Bilder je Zeile, eine Zeile je Farbe).
// Aufruf: node tools/butterfly-sprites.cjs
const { PNG } = require('pngjs');
const fs = require('fs');

const F = 64; // Bildgröße
const SS = 4; // Kantenglättung: so viele Abtastpunkte je Richtung
// Farben: Flügel, Rand, Flecken (Rand oder Flecken null = keine)
const KINDS = [
  ['#f08a1c', '#2a1a10', '#ffffff'], // Monarch: orange mit schwarzem Rand und weißen Punkten
  ['#2f7de0', '#10203a', null], // Morpho: leuchtend blau
  ['#f6dc3a', null, '#e08a20'], // Zitronenfalter
  ['#f7f4ea', '#3a3a3a', '#3a3a3a'], // Kohlweißling
  ['#2a2228', '#2a2228', '#e8402a'], // Admiral: schwarz mit roten Flecken
  ['#b8402c', '#4a2018', '#3a78d8'], // Tagpfauenauge: rotbraun mit blauen Augen
  ['#f49ac8', '#a04878', '#ffffff'], // rosa
  ['#5cc45a', '#1e5a28', '#e8f8a0'], // grün
  ['#9a62d8', '#3a1e60', '#f0d0ff'], // lila
  ['#f4d24a', '#1e1a14', '#1e1a14'], // Schwalbenschwanz: gelb mit schwarzen Streifen
  ['#3ad0c8', '#0e4a4a', '#ffffff'], // türkis
  ['#c27a38', '#4a2a10', '#f6e0a0'], // braun-orange
];
const OPEN = [1, 0.55, 0.16]; // Flügelbreite je Bild

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const png = new PNG({ width: F * OPEN.length, height: F * KINDS.length });

// Farbe eines Punkts (u: waagerecht von der Körpermitte, v: senkrecht; in Bildpixeln) oder null
function shade(u, v, open, [wing, edge, spot]) {
  // Körper
  if (Math.abs(u) < 1.6 && v > -9 && v < 11) return [40, 30, 28];
  if (Math.hypot(u, v + 11) < 2.6) return [40, 30, 28]; // Kopf
  // Fühler
  for (const s of [-1, 1]) {
    const t = (v + 12) / -8; // 0 am Kopf, 1 an der Spitze
    if (t > 0 && t < 1 && Math.abs(u - s * (1 + t * 5)) < 0.7) return [40, 30, 28];
    if (Math.hypot(u - s * 6.2, v + 20.5) < 1.3) return [40, 30, 28];
  }
  if (u === 0) return null;
  const x = Math.abs(u) / open; // Flügel zusammengeklappt: schmaler
  // Vorderflügel (oben, größer) und Hinterflügel (unten)
  const fore = ((x - 13) / 13) ** 2 + ((v + 5) / 10) ** 2;
  const hind = ((x - 10) / 10) ** 2 + ((v - 8) / 8) ** 2;
  const d = Math.min(fore, hind);
  if (d > 1 || x < 1.5) return null;
  if (edge && d > 0.62) return hex(edge);
  if (spot) {
    if (fore < 1 && Math.hypot(x - 16, v + 7) < 3.2) return hex(spot);
    if (hind < 1 && Math.hypot(x - 11, v - 9) < 2.2) return hex(spot);
  }
  const c = hex(wing);
  const k = 0.86 + 0.14 * (1 - d); // zur Mitte etwas heller
  return c.map((n) => Math.min(255, n * k));
}

KINDS.forEach((kind, row) => {
  OPEN.forEach((open, col) => {
    for (let py = 0; py < F; py++) {
      for (let px = 0; px < F; px++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let sy = 0; sy < SS; sy++) {
          for (let sx = 0; sx < SS; sx++) {
            const u = px + (sx + 0.5) / SS - F / 2;
            const v = py + (sy + 0.5) / SS - F / 2;
            const c = shade(u, v, open, kind);
            if (!c) continue;
            r += c[0]; g += c[1]; b += c[2]; a++;
          }
        }
        if (!a) continue;
        const i = ((row * F + py) * png.width + col * F + px) * 4;
        png.data[i] = r / a;
        png.data[i + 1] = g / a;
        png.data[i + 2] = b / a;
        png.data[i + 3] = (255 * a) / (SS * SS);
      }
    }
  });
});
fs.writeFileSync('public/assets/butterfly.png', PNG.sync.write(png));
console.log(`public/assets/butterfly.png: ${KINDS.length} Farben × ${OPEN.length} Bilder`);
