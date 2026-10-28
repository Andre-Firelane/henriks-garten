// Platzhalter für die Wetterphasen der Savanne (bis die echten Bilder da sind): vorhandene Bilder umgefärbt oder einfach
// gezeichnet, jeweils schon mit dem endgültigen Dateinamen und Raster (Bildgröße und Anzahl wie im Kommentar).
// Aufruf: node tools/season-placeholders.cjs  (überschreibt nur Dateien, die noch Platzhalter sind: ONLY=name für eine)
const { PNG } = require('pngjs');
const fs = require('fs');

const DIR = 'public/assets/';
const read = (f) => PNG.sync.read(fs.readFileSync(DIR + f + '.png'));
const write = (f, p) => {
  fs.writeFileSync(DIR + f + '.png', PNG.sync.write(p));
  console.log(`${DIR}${f}.png: ${p.width} × ${p.height}`);
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// Graustufen-Helligkeit des Bilds auf eine Farbe legen (dunkel → dunkle Farbe, hell → helle); mix: wie viel vom Original bleibt
function tint(p, color, { mix = 0.15, light = 1 } = {}) {
  const [cr, cg, cb] = hex(color);
  const out = new PNG({ width: p.width, height: p.height });
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
function draw(w, h, shade) {
  const p = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = shade(x, y);
      if (!c) continue;
      const i = (y * w + x) * 4;
      [p.data[i], p.data[i + 1], p.data[i + 2], p.data[i + 3]] = [c[0], c[1], c[2], c[3] ?? 255];
    }
  }
  return p;
}

// Risse im Boden (für trockene Erde und Schlamm): dunkle Linien, fest pro Bild
function cracks(p, seed, color, alpha) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const [cr, cg, cb] = hex(color);
  for (let n = 0; n < 3; n++) {
    let x = rnd() * p.width;
    let y = rnd() * p.height;
    let a = rnd() * Math.PI * 2;
    for (let k = 0; k < 18; k++) {
      a += (rnd() - 0.5) * 1.2;
      x += Math.cos(a) * 1.5;
      y += Math.sin(a) * 0.8;
      const xi = Math.round(x), yi = Math.round(y);
      if (xi < 0 || yi < 0 || xi >= p.width || yi >= p.height) break;
      const i = (yi * p.width + xi) * 4;
      if (!p.data[i + 3]) continue;
      p.data[i] = p.data[i] * (1 - alpha) + cr * alpha;
      p.data[i + 1] = p.data[i + 1] * (1 - alpha) + cg * alpha;
      p.data[i + 2] = p.data[i + 2] * (1 - alpha) + cb * alpha;
    }
  }
  return p;
}

const JOBS = {
  // (die Tiere selbst sind schon echte Bilder, siehe tools/prepare-characters.js und tools/savanna-cut.cjs)
  // Lungenfisch im Schlamm (Trockenzeit): wie lungfish, unten im Schlamm steckend (4 Bilder 84 × 64); nur der Bauch
  // steckt drin, Augen und Maul schauen heraus
  lungfish_mud: () => {
    const p = read('lungfish');
    for (let y = 0; y < p.height; y++) {
      for (let x = 0; x < p.width; x++) {
        const i = (y * p.width + x) * 4;
        const u = (x % 84) - 42;
        const mound = (u / 24) ** 2 + ((y - 60) / 7) ** 2 < 1; // Schlammhügel, aus dem er herausschaut
        if (y > p.height * 0.8 && p.data[i + 3]) [p.data[i], p.data[i + 1], p.data[i + 2]] = [92, 66, 40];
        else if (mound && y > 55) [p.data[i], p.data[i + 1], p.data[i + 2], p.data[i + 3]] = [104, 76, 48, 255];
      }
    }
    return p;
  },
  // ... sein Erdloch: 1 Bild 64 × 40 (Mitte des Lochs bei 32/26)
  warthog_hole: () =>
    draw(64, 40, (x, y) => {
      const d = ((x - 32) / 26) ** 2 + ((y - 26) / 10) ** 2;
      const hole = ((x - 32) / 16) ** 2 + ((y - 27) / 6) ** 2;
      if (hole < 1) return [36, 24, 16];
      if (d < 1) return [150, 112, 70];
      return null;
    }),
  // Glühwürmchen-Abend im Bambuswald: das leuchtende Glas (64 × 64 wie jar); der rote Panda hat echte Bilder
  // (npm run characters), sein Bild in der Krone erzeugt tools/jungle-placeholders.cjs (redpanda_tree)
  jar_glow: () => {
    const p = read('jar');
    for (let i = 0; i < p.data.length; i += 4) {
      if (!p.data[i + 3]) continue;
      const [r, g, b] = p.data.slice(i, i + 3);
      if (b > r + 20) [p.data[i], p.data[i + 1], p.data[i + 2]] = [255, 210 + (g - r) / 4, 90 + (b - r) / 3]; // das blaue Glas leuchtet warmgelb
    }
    return p;
  },
  // Landschaft
  acacia_bare: () => {
    // kahle, knorrige Akazie (128 × 128, Fuß wie bei acacia): der Stamm der Akazie, oben statt Laub verzweigte Äste
    // Schatten am Boden (Fuß bei 64/116 wie bei der Akazie)
    const p = draw(128, 128, (x, y) => (((x - 64) / 30) ** 2 + ((y - 116) / 8) ** 2 < 1 ? [60, 46, 24, 70] : null));
    const line = (x0, y0, x1, y1, w) => {
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
        for (let dy = -w; dy <= w; dy++) for (let dx = -w; dx <= w; dx++) {
          const xi = Math.round(x + dx), yi = Math.round(y + dy);
          if (xi < 0 || yi < 0 || xi >= p.width || yi >= p.height || dx * dx + dy * dy > w * w + 0.5) continue;
          const i = (yi * p.width + xi) * 4;
          const edge = dx * dx + dy * dy > (w - 1) * (w - 1);
          [p.data[i], p.data[i + 1], p.data[i + 2], p.data[i + 3]] = edge ? [58, 38, 24, 255] : [118, 84, 54, 255];
        }
      }
    };
    let s = 3;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const branch = (x, y, a, len, w) => {
      if (len < 5 || w < 1) return;
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len * 0.8;
      line(x, y, x1, y1, w);
      branch(x1, y1, a - 0.5 - rnd() * 0.4, len * 0.68, w - 1);
      branch(x1, y1, a + 0.5 + rnd() * 0.4, len * 0.68, w - 1);
    };
    line(64, 116, 62, 92, 4); // krummer Stamm
    line(62, 92, 66, 78, 4);
    branch(66, 78, -Math.PI / 2 - 0.6, 26, 3);
    branch(66, 78, -Math.PI / 2 + 0.65, 28, 3);
    branch(63, 90, -Math.PI / 2 - 1.2, 14, 2); // tiefer Seitenast
    return p;
  },
  sgrass_rain0: () => tint(read('sgrass0'), '#7fa046', { mix: 0.3 }), // Boden bei Starkregen: 64 × 32 (wie sgrass0..2)
  sgrass_rain1: () => tint(read('sgrass1'), '#78993f', { mix: 0.3 }),
  sgrass_rain2: () => tint(read('sgrass2'), '#86a64c', { mix: 0.3 }),
  sdry0: () => cracks(tint(read('sgrass0'), '#c9a874', { mix: 0.2 }), 11, '#7a5a34', 0.6), // trockener Boden: 64 × 32
  sdry1: () => cracks(tint(read('sgrass1'), '#c2a06c', { mix: 0.2 }), 23, '#7a5a34', 0.6),
  sdry2: () => cracks(tint(read('sgrass2'), '#ceae7a', { mix: 0.2 }), 37, '#7a5a34', 0.6),
  // Schlamm im ausgetrockneten Wasserloch: 64 × 32 (Raute wie die Bodenkacheln)
  mud: () =>
    cracks(
      draw(64, 32, (x, y) => {
        if (Math.abs(x + 0.5 - 32) / 32 + Math.abs(y + 0.5 - 16) / 16 > 1.06) return null; // bis an den Rand, sonst sieht man Fugen
        const n = ((x * 73856093) ^ (y * 19349663)) >>> 0;
        const k = 0.9 + (n % 20) / 100;
        return [104 * k, 76 * k, 48 * k];
      }),
      5,
      '#3a2818',
      0.8,
    ),
  // Knochen (Werkzeug in doppelter Auflösung, 64 × 64 wie food) und der Knochenhaufen auf dem Boden (1 Bild 64 × 40)
  bone: () =>
    draw(64, 64, (x, y) => {
      const u = x - 32, v = y - 32;
      const a = (u + v) / Math.SQRT2, b = (u - v) / Math.SQRT2; // schräg
      const knob = (c) => Math.hypot(a - c, b - 5) < 6 || Math.hypot(a - c, b + 5) < 6;
      if ((Math.abs(a) < 18 && Math.abs(b) < 4) || knob(-18) || knob(18)) return [242, 234, 214];
      if ((Math.abs(a) < 19 && Math.abs(b) < 5.5) || knob(-19.5) || knob(19.5)) return [150, 132, 110];
      return null;
    }),
  bone_pile: () =>
    draw(64, 40, (x, y) => {
      const bones = [[20, 26, 0.3], [40, 28, -0.4], [32, 22, 0.9]];
      for (const [cx, cy, r] of bones) {
        const u = x - cx, v = (y - cy) * 2;
        const a = u * Math.cos(r) + v * Math.sin(r), b = -u * Math.sin(r) + v * Math.cos(r);
        if ((Math.abs(a) < 11 && Math.abs(b) < 3) || Math.hypot(Math.abs(a) - 11, Math.abs(b) - 3) < 3.2) return [236, 226, 204];
      }
      return null;
    }),
};

const only = process.env.ONLY;
for (const [name, job] of Object.entries(JOBS)) if (!only || only === name) write(name, job());
