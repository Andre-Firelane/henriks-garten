// Platzhalter für den Dschungel (bis die echten Bilder da sind): vorhandene Bilder umgefärbt oder einfach gezeichnet,
// jeweils schon mit dem endgültigen Dateinamen und Format (Größe im Kommentar).
// Aufruf: node tools/jungle-placeholders.cjs  (ONLY=name: nur dieses eine Bild – sonst werden alle neu geschrieben,
// also nicht mehr aufrufen, sobald echte Bilder da sind)
const { PNG } = require('pngjs');
const fs = require('fs');

const DIR = 'public/assets/';
const read = (f) => PNG.sync.read(fs.readFileSync(DIR + f + '.png'));
const write = (f, p) => {
  fs.writeFileSync(DIR + f + '.png', PNG.sync.write(p));
  console.log(`${DIR}${f}.png: ${p.width} × ${p.height}`);
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const blank = (w, h) => new PNG({ width: w, height: h });

// Helligkeit des Bilds auf eine Farbe legen; mix: wie viel vom Original bleibt
function tint(p, color, { mix = 0.15, light = 1 } = {}) {
  const [cr, cg, cb] = hex(color);
  const out = blank(p.width, p.height);
  for (let i = 0; i < p.data.length; i += 4) {
    const [r, g, b, a] = p.data.slice(i, i + 4);
    const l = Math.min(1.25, ((0.3 * r + 0.59 * g + 0.11 * b) / 160) * light);
    out.data[i] = Math.min(255, cr * l * (1 - mix) + r * mix);
    out.data[i + 1] = Math.min(255, cg * l * (1 - mix) + g * mix);
    out.data[i + 2] = Math.min(255, cb * l * (1 - mix) + b * mix);
    out.data[i + 3] = a;
  }
  return out;
}

// gezeichnetes Bild: shade(x, y) gibt [r, g, b, a] oder null
function draw(w, h, shade, into = blank(w, h)) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = shade(x, y);
      if (!c) continue;
      over(into, x, y, c);
    }
  }
  return into;
}

// ein Pixel mit Deckkraft darüberlegen
function over(p, x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= p.width || y >= p.height) return;
  const i = (y * p.width + x) * 4;
  const k = a / 255;
  const ka = p.data[i + 3] / 255;
  const out = k + ka * (1 - k);
  if (!out) return;
  p.data[i] = (r * k + p.data[i] * ka * (1 - k)) / out;
  p.data[i + 1] = (g * k + p.data[i + 1] * ka * (1 - k)) / out;
  p.data[i + 2] = (b * k + p.data[i + 2] * ka * (1 - k)) / out;
  p.data[i + 3] = out * 255;
}

// Bild src an dx/dy auf dst legen (mit Transparenz), optional gespiegelt
function paste(dst, src, dx, dy, flip = false) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const i = (y * src.width + (flip ? src.width - 1 - x : x)) * 4;
      if (src.data[i + 3]) over(dst, dx + x, dy + y, [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]]);
    }
  }
  return dst;
}

// Rauschen, fest pro Pixel
const noise = (x, y, s = 1) => ((((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0) % 1000) / 1000;

const JOBS = {
  // Boden: 64 × 32 (Raute wie die anderen Bodenkacheln)
  jgrass0: () => tint(read('agrass0'), '#2f9a26', { mix: 0.18, light: 1.05 }),
  jgrass1: () => tint(read('agrass1'), '#2a8e22', { mix: 0.18, light: 1.05 }),
  jgrass2: () => tint(read('agrass2'), '#38a42c', { mix: 0.18, light: 1.05 }),
  jgrass_rain0: () => tint(read('agrass0'), '#26801f', { mix: 0.18, light: 0.95 }), // nasser Boden bei Starkregen
  jgrass_rain1: () => tint(read('agrass1'), '#22761c', { mix: 0.18, light: 0.95 }),
  jgrass_rain2: () => tint(read('agrass2'), '#2c8a24', { mix: 0.18, light: 0.95 }),
  jungle_path: () => tint(read('savanna_path'), '#86603a', { mix: 0.25 }), // Trampelpfad aus Erde
  jungle_water0: () => tint(read('water'), '#4c8466', { mix: 0.35 }), // Fluss: grünlich-trüb
  jungle_water1: () => tint(read('water'), '#55906c', { mix: 0.35, light: 1.05 }),
  // Bootssteg: Bretter über dem Wasser, 64 × 32 (Raute), flach
  jungle_dock: () =>
    draw(64, 32, (x, y) => {
      const u = (x + 0.5 - 32) / 32, v = (y + 0.5 - 16) / 16;
      if (Math.abs(u) + Math.abs(v) > 0.86) return null;
      const a = (x / 2 + y) % 8; // Bretter quer zur Kachel
      const k = 0.85 + noise(x, y) * 0.2;
      if (a < 1) return [70, 48, 28];
      return [150 * k, 108 * k, 66 * k];
    }),
  // Dickicht 64 × 64 (Fuß bei 32/52): dichtes Gestrüpp aus Büschen und Farnen; der junge Busch und der Stumpf danach
  thicket: () => {
    const p = blank(64, 64);
    const bush = tint(read('dark_bush'), '#2f6a24', { mix: 0.25 });
    const bush2 = tint(read('bush'), '#3c7a2a', { mix: 0.3 });
    const fern = tint(read('fern'), '#4a8a30', { mix: 0.3 });
    paste(p, bush, 0, 10);
    paste(p, bush, 10, 4, true);
    paste(p, bush2, 14, 20);
    paste(p, fern, 0, 30);
    paste(p, fern, 26, 30, true);
    return p;
  },
  thicket_small: () => {
    const p = blank(64, 64);
    const fern = tint(read('fern'), '#4f9234', { mix: 0.3 });
    const bush = tint(read('bush'), '#4a8a30', { mix: 0.3 });
    paste(p, bush, 14, 22);
    paste(p, fern, 10, 30);
    return p;
  },
  thicket_cut: () =>
    draw(64, 64, (x, y) => {
      // ein paar Stümpfe und Blätter am Boden
      for (const [cx, cy] of [[22, 48], [36, 52], [44, 46], [30, 44]]) {
        const d = ((x - cx) / 3) ** 2 + ((y - cy) / 2) ** 2;
        if (d < 1) return y < cy ? [168, 132, 80] : [110, 76, 42];
        if (Math.abs(x - cx) < 3 && y > cy && y < cy + 4) return [96, 66, 36];
      }
      if (((x - 32) / 22) ** 2 + ((y - 50) / 7) ** 2 < 1 && noise(x, y, 4) < 0.18) return [70, 120, 44];
      return null;
    }),
  // Felsklippe am Kartenrand: 64 × 96 (Fuß bei 32/84), zwei Felsen übereinander
  cliff: () => {
    const p = blank(64, 96);
    const rock = tint(read('boulder'), '#7a786e', { mix: 0.25 });
    paste(p, rock, 0, 4);
    paste(p, rock, 0, 34, true);
    return p;
  },
  // Wasserfall: 3 Bilder 128 × 160 (Fuß bei 64/150): Felsen links und rechts, dazwischen fällt das Wasser in das Becken
  waterfall: () => {
    const p = blank(128 * 3, 160);
    // die drei Bilder nebeneinander
    for (let f = 0; f < 3; f++) {
      const frame = draw(128, 160, (x, y) => {
        const rockL = x < 34 + Math.sin(y / 9) * 5 && y > 6;
        const rockR = x > 94 + Math.sin(y / 11 + 2) * 5 && y > 10;
        if ((rockL || rockR) && y < 150) {
          const k = 0.75 + noise(x >> 2, y >> 2, 7) * 0.35;
          return [118 * k, 114 * k, 104 * k];
        }
        if (x >= 30 && x <= 98 && y < 146) {
          const streak = noise(x >> 1, Math.floor((y + f * 11) / 6), 3);
          const light = streak > 0.7 ? [236, 246, 250] : streak > 0.35 ? [178, 214, 226] : [120, 176, 196];
          return [...light, 235];
        }
        if (y >= 138 && y < 158 && ((x - 64) / 52) ** 2 + ((y - 148) / 10) ** 2 < 1) return noise(x, y + f * 5, 9) > 0.4 ? [248, 252, 255, 230] : [200, 228, 238, 200];
        return null;
      });
      paste(p, frame, f * 128, 0);
    }
    return p;
  },
  // Fluss in Bewegung: 4 Bilder 64 × 32 (Raute), helle Streifen wandern mit der Strömung (entlang tx); das Muster
  // wiederholt sich je Kachel, damit an den Kanten keine Nähte entstehen
  ...Object.fromEntries([0, 1, 2, 3].map((f) => [`jungle_flow${f}`, () => {
    const p = tint(read('water'), '#4c8466', { mix: 0.35 });
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4;
        if (!p.data[i + 3]) continue;
        // Lage in der Kachel (Kachel-Koordinaten, -0,5 .. 0,5)
        const u = ((x + 0.5 - 32) / 32 + (y + 0.5 - 16) / 16) / 2;
        const v = ((y + 0.5 - 16) / 16 - (x + 0.5 - 32) / 32) / 2;
        const wave = 2 * u - f / 4 + 0.18 * Math.sin(2 * Math.PI * 2 * v);
        const fr = wave - Math.floor(wave);
        const gate = Math.cos(2 * Math.PI * 3 * v + 1.3 * Math.sin(2 * Math.PI * u)) > 0.15; // nur Stücke, keine durchgehenden Linien
        if (fr < 0.09 && gate) {
          p.data[i] = Math.min(255, p.data[i] + 46);
          p.data[i + 1] = Math.min(255, p.data[i + 1] + 50);
          p.data[i + 2] = Math.min(255, p.data[i + 2] + 44);
        } else if (fr > 0.5 && fr < 0.56 && !gate) {
          p.data[i] = Math.max(0, p.data[i] - 14);
          p.data[i + 1] = Math.max(0, p.data[i + 1] - 12);
          p.data[i + 2] = Math.max(0, p.data[i + 2] - 10);
        }
      }
    }
    return p;
  }])),
  // Mangrove am Ufer: 96 × 112 (Fuß bei 48/100): dichte Krone auf gebogenen Stelzwurzeln
  mangrove: () =>
    draw(96, 112, (x, y) => {
      if (((x - 48) / 40) ** 2 + ((y - 40) / 30) ** 2 < 1) {
        const k = 0.75 + noise(x >> 2, y >> 2, 11) * 0.4 - (y - 40) / 160;
        return [44 * k, 104 * k, 46 * k];
      }
      // Stelzwurzeln: Bögen vom Stamm nach außen
      for (const s of [-30, -18, -7, 7, 18, 30]) {
        const t = (y - 62) / 38; // 0 oben am Stamm, 1 am Boden
        if (t < 0 || t > 1) continue;
        const cx = 48 + s * Math.sin(t * Math.PI / 2);
        if (Math.abs(x - cx) < 2.2) return [96, 70, 44];
      }
      if (Math.abs(x - 48) < 4 && y > 55 && y < 75) return [104, 76, 48];
      if (((x - 48) / 38) ** 2 + ((y - 100) / 7) ** 2 < 1) return [30, 50, 26, 70]; // Schatten
      return null;
    }),
  // große Blumen: Helikonie (64 × 96, Fuß bei 32/88) mit roten Hängeblüten und Hibiskus (64 × 72, Fuß bei 32/64)
  heliconia: () =>
    draw(64, 96, (x, y) => {
      // Blüten: gestaffelte rot-gelbe Zacken an einem Stängel
      for (const [cx, cy, d] of [[30, 22, 1], [36, 32, -1], [29, 42, 1], [35, 52, -1]]) {
        const u = (x - cx) * d, v = y - cy;
        if (u > -2 && u < 12 && Math.abs(v - u * 0.35) < 3 - u * 0.2) return u > 8 ? [250, 210, 60] : [214, 40, 40];
      }
      if (Math.abs(x - 32) < 1.5 && y > 16 && y < 88) return [60, 110, 40];
      // große Blätter unten
      for (const [cx, cy, a] of [[18, 70, -0.6], [46, 68, 0.6], [32, 78, 0]]) {
        const u = (x - cx) * Math.cos(a) + (y - cy) * Math.sin(a), v = -(x - cx) * Math.sin(a) + (y - cy) * Math.cos(a);
        if ((u / 6) ** 2 + (v / 18) ** 2 < 1) return v < 0 ? [70, 140, 52] : [52, 112, 40];
      }
      if (((x - 32) / 20) ** 2 + ((y - 88) / 5) ** 2 < 1) return [30, 50, 26, 70];
      return null;
    }),
  hibiscus: () =>
    draw(64, 72, (x, y) => {
      // große Blüten mit fünf Blättern und gelbem Stempel
      for (const [cx, cy, c] of [[22, 22, [232, 56, 92]], [44, 28, [240, 96, 60]], [30, 40, [226, 48, 80]]]) {
        const d = Math.hypot(x - cx, (y - cy) * 1.2);
        const a = Math.atan2(y - cy, x - cx);
        if (d < 2) return [250, 220, 80];
        if (d < 8 + 2 * Math.cos(a * 5)) return d < 4 ? [150, 20, 40] : c;
      }
      if (((x - 32) / 26) ** 2 + ((y - 44) / 20) ** 2 < 1) {
        const k = 0.8 + noise(x >> 1, y >> 1, 13) * 0.35;
        return [50 * k, 120 * k, 46 * k];
      }
      if (((x - 32) / 22) ** 2 + ((y - 64) / 5) ** 2 < 1) return [30, 50, 26, 70];
      return null;
    }),
  // Machete (doppelte Auflösung wie die Werkzeuge, 64 × 64): Griff unten, Klinge nach oben
  machete: () =>
    draw(64, 64, (x, y) => {
      const bend = ((46 - y) / 40) ** 2 * 6; // leicht gebogen
      if (y >= 46 && y <= 60 && Math.abs(x - 30) <= 3) return y % 4 === 0 ? [60, 36, 20] : [104, 66, 36]; // Griff
      if (y >= 43 && y < 46 && Math.abs(x - 30) <= 6) return [80, 80, 86]; // Parierstück
      if (y >= 6 && y < 43) {
        const c = 30 + bend;
        const w = 4 + (y > 12 ? 1 : 0);
        if (x >= c - w && x <= c + w) return x > c + w - 2 ? [250, 252, 255] : [190, 196, 204];
      }
      return null;
    }),
  // Kanu (doppelte Auflösung, 128 × 64; Mitte bei 64/40): längs nach rechts unten, gespiegelt nach links unten
  canoe: () =>
    draw(128, 64, (x, y) => {
      const a = Math.atan2(16, 32);
      const u = (x - 64) * Math.cos(a) + (y - 40) * Math.sin(a);
      const v = -(x - 64) * Math.sin(a) + (y - 40) * Math.cos(a);
      const len = 58, wid = 13;
      const d = (u / len) ** 2 + (v / wid) ** 2;
      if (d > 1) return null;
      const inner = (u / (len - 6)) ** 2 + (v / (wid - 4)) ** 2 < 1;
      if (inner) return v < 0 ? [92, 58, 30] : [124, 80, 42]; // innen
      return v > 2 ? [96, 56, 26] : [176, 112, 58]; // Bordwand
    }),
  // Wasserflugzeug (Schnellreise, 1 Bild 240 × 140 wie die Autos; Fuß bei 120/136)
  seaplane: () =>
    draw(240, 140, (x, y) => {
      // Schwimmer
      for (const cy of [128, 112]) if (((x - 120) / 70) ** 2 + ((y - cy) / 5) ** 2 < 1) return [70, 70, 76];
      if ((x === 90 || x === 150) && y > 92 && y < 128) return [60, 60, 66]; // Streben
      // Rumpf
      if (((x - 116) / 74) ** 2 + ((y - 82) / 14) ** 2 < 1) return y < 78 ? [236, 236, 240] : y < 86 ? [204, 50, 44] : [214, 214, 220];
      if (x > 170 && x < 190 && y > 58 && y < 82 && x - 170 > (82 - y) * 0.6) return [204, 50, 44]; // Leitwerk
      if (((x - 92) / 12) ** 2 + ((y - 74) / 7) ** 2 < 1) return [120, 170, 210]; // Fenster
      // Flügel quer darüber
      if (y > 60 && y < 67 && x > 40 && x < 200) return [228, 228, 232];
      if (x > 38 && x < 44 && y > 70 && y < 94) return [60, 60, 66]; // Propeller
      return null;
    }),
};

// roter Panda oben im Kirschbaum: Kopf und Oberkörper der sitzenden Vorderansicht (redpanda_sit.png, Bild 1), 72 × 44
JOBS.redpanda_tree = () => {
  const src = read('redpanda_sit');
  const p = blank(72, 44);
  PNG.bitblt(src, p, 72, 4, 72, 44, 0, 0);
  return p;
};
// Bild des Kanus für die Werkzeugleiste: das erste Bild aus canoe.png (aus den echten Bildern, npm run characters)
JOBS.canoe_icon = () => {
  const src = read('canoe');
  const p = blank(144, 152);
  PNG.bitblt(src, p, 0, 0, 144, 152, 0, 0);
  return p;
};

// Fischerhütte im Stil 'jungle': Kopien der Savannen-Hütte, grünlich wie Bambus und Palmblätter
for (const k of ['hutwall_x', 'hutwall_y', 'gate_door_x', 'gate_door_y']) {
  const [base, axis] = [k.slice(0, -2), k.slice(-1)];
  JOBS[`${base}_jungle_${axis}`] = () => tint(read(`${base}_savanna_${axis}`), '#8a9a5a', { mix: 0.45 });
}
JOBS.post_hutwall_jungle = () => tint(read('post_hutwall_savanna'), '#8a9a5a', { mix: 0.45 });
JOBS.hutroof_jungle = () => tint(read('hutroof_savanna'), '#6f8a3c', { mix: 0.4 });
JOBS.planks_jungle = () => tint(read('planks_savanna'), '#9a8456', { mix: 0.4 });
for (const k of ['hut_desk', 'hut_chair', 'hut_plant', 'hut_shelf']) JOBS[`${k}_jungle`] = () => tint(read(`${k}_savanna`), '#8a9060', { mix: 0.55 });

// diese Bilder zeichnet inzwischen tools/make-sprites.js (im Stil der übrigen Grafiken)
for (const k of ['hutwall_jungle_x', 'hutwall_jungle_y', 'post_hutwall_jungle', 'gate_door_jungle_x', 'gate_door_jungle_y', 'hutroof_jungle', 'planks_jungle', 'hut_desk_jungle', 'hut_chair_jungle', 'hut_plant_jungle', 'hut_shelf_jungle', 'canoe', 'seaplane', 'howler', 'jgrass0', 'jgrass1', 'jgrass2', 'jgrass_rain0', 'jgrass_rain1', 'jgrass_rain2', 'jungle_path', 'jungle_water0', 'jungle_water1', 'thicket', 'thicket_small', 'thicket_cut', 'cliff', 'waterfall', 'mangrove', 'heliconia', 'hibiscus', 'jungle_flow0', 'jungle_flow1', 'jungle_flow2', 'jungle_flow3']) delete JOBS[k];

const only = process.env.ONLY;
for (const [name, job] of Object.entries(JOBS)) if (!only || only === name) write(name, job());
