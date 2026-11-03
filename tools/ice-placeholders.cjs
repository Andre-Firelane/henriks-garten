// Platzhalter für die Eiswelt (bis die echten Bilder da sind): vorhandene Bilder umgefärbt bzw. kopiert, jeweils schon mit
// dem endgültigen Dateinamen, in allen Auflösungen, die es vom Vorbild gibt (public/assets, hd/, hd2/).
// Aufruf: node tools/ice-placeholders.cjs  (ONLY=name: nur dieses eine Bild – sonst werden alle neu geschrieben,
// also nicht mehr aufrufen, sobald echte Bilder da sind)
const { PNG } = require('pngjs');
const fs = require('fs');

const DIRS = ['public/assets/', 'public/assets/hd/', 'public/assets/hd2/'];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// Bild auf eine Farbe legen: die Helligkeit des Vorbilds (um ihren Mittelwert) bleibt als feine Struktur erhalten;
// detail: wie stark (0 = einfarbig)
function recolor(p, color, detail) {
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
    const k = Math.max(0.55, Math.min(1.25, 1 + (lum(i) / avg - 1) * detail));
    out.data[i] = Math.min(255, cr * k);
    out.data[i + 1] = Math.min(255, cg * k);
    out.data[i + 2] = Math.min(255, cb * k);
    out.data[i + 3] = p.data[i + 3];
  }
  return out;
}

const copy = (p) => p;
// Schneehügel: flacher, weißer Hügel, oben links hell, unten rechts bläulich, mit weichem Rand (Größe wie das Vorbild)
function mound(src) {
  const { width: w, height: h } = src;
  const out = new PNG({ width: w, height: h });
  const cx = w / 2;
  const cy = h * 0.62;
  const rx = w * 0.44;
  const ry = h * 0.36;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d >= 1 || y > cy + ry * 0.55) continue; // unten flach abgeschnitten (liegt auf dem Boden)
      const light = Math.max(0, Math.min(1, 0.75 - dx * 0.25 - dy * 0.45));
      const i = (y * w + x) * 4;
      out.data[i] = 205 + 50 * light;
      out.data[i + 1] = 220 + 35 * light;
      out.data[i + 2] = 238 + 17 * light;
      out.data[i + 3] = Math.round(255 * Math.min(1, (1 - d) * 4));
    }
  }
  return out;
}
// Ziel: [Vorbild, Umfärbung]
const IMAGES = {
  // Boden: Schnee (drei Varianten), festgetretener Schneeweg, Polarmeer (das zugefrorene Meer: tools/sea-ice.py)
  snow0: ['jgrass0', (p) => recolor(p, '#edf3f9', 0.18)],
  snow1: ['jgrass1', (p) => recolor(p, '#e8f0f8', 0.2)],
  snow2: ['jgrass2', (p) => recolor(p, '#f2f6fb', 0.18)],
  snow_path: ['jungle_path', (p) => recolor(p, '#c9d5e1', 0.3)],
  ice_water0: ['water', (p) => recolor(p, '#2d6290', 0.35)],
  ice_water1: ['water', (p) => recolor(p, '#336d98', 0.45)],
  // Eisfelsen, Eisblock, Schneewehe
  ice_rock: ['rock', (p) => recolor(p, '#a9bccd', 0.6)],
  ice_block: ['boulder', (p) => recolor(p, '#c4e8f8', 0.5)],
  snow_drift: ['tuft', mound], // weicher Schneehügel in der Größe des Grasbüschels
  // Forschungsstation: vorerst die Wände der Savannen-Hütte, umgefärbt zu Metall (Dach und Regal: tools/research-station.py);
  // Einrichtung wie dort, ohne Pflanze (das Stockbett: tools/beds.py)
  hutwall_ice_x: ['hutwall_savanna_x', (p) => recolor(p, '#a3b1be', 0.55)],
  hutwall_ice_y: ['hutwall_savanna_y', (p) => recolor(p, '#a3b1be', 0.55)],
  post_hutwall_ice: ['post_hutwall_savanna', (p) => recolor(p, '#7f8d9a', 0.5)],
  gate_door_ice_x: ['gate_door_savanna_x', (p) => recolor(p, '#8796a4', 0.7)],
  gate_door_ice_y: ['gate_door_savanna_y', (p) => recolor(p, '#8796a4', 0.7)],
  planks_ice: ['planks_savanna', (p) => recolor(p, '#8e99a4', 0.45)], // Boden aus Riffelblech
  hut_desk_ice: ['hut_desk_savanna', copy],
  hut_chair_ice: ['hut_chair_savanna', copy],
};

for (const [name, [src, make]] of Object.entries(IMAGES)) {
  if (process.env.ONLY && process.env.ONLY !== name) continue;
  for (const dir of DIRS) {
    if (!fs.existsSync(dir + src + '.png')) continue;
    const p = make(PNG.sync.read(fs.readFileSync(dir + src + '.png')));
    fs.writeFileSync(dir + name + '.png', PNG.sync.write(p));
    console.log(`${dir}${name}.png: ${p.width} × ${p.height}`);
  }
}
