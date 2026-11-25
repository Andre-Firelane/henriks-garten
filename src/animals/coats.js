// Fellfarben ohne eigene Bilder: die Spritesheets einer Art (bzw. eines Skins) werden im Spiel umgefärbt, und zwar nur
// das Fell. Welche Bildpunkte Fell sind, sagt eine Maske je Tier (z. B. beim Schaf: hell und fast farblos; bei der Katze:
// kräftiges Orange); Gesicht, Ohren, Hufe, Hörner, Flecken, Halsband und Konturen bleiben, wie sie sind. Die Helligkeit
// jedes Fellpunkts wird auf eine neue Farbskala (Schatten- bis Lichtfarbe) übertragen, so bleibt die Fellstruktur erhalten.
// Alle Animationen kommen so mit, und es gibt nichts zusätzlich herunterzuladen. Nur natürliche Farben!
// Erzeugt wird eine Farbe erst, wenn ein Tier sie bekommt (ensureCoat), und zwar in kleinen Stücken zwischen den Bildern
// des Spiels; vorab nur das kleine Bild für Tierbuch und Meldungen (makeCoatIcons). Plan und Seltenheitstabellen: docs/plan-sammeln.md
import { tr } from '../i18n.js';
import { registerAnimalIcon } from '../ui/icons.js';

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

// Masken: wie sehr ein Bildpunkt Fell ist (0 bis 1); v Helligkeit, s Sättigung (HSV, 0 bis 1), h Farbton in Grad
const light = (v, s) => smooth(0.48, 0.64, v) * (1 - smooth(0.24, 0.3, s)); // hell und fast farblos (Wolle, weißes Fell)
// Schafwolle: wie light, nur dürfen rötliche Schatten (unten am Bauch, vor allem von hinten) etwas kräftiger sein; Ohren und
// Beine sind noch kräftiger, das Gesicht hat einen anderen Farbton (um 31°)
const wool = (v, s, h) => {
  const pink = 1 - smooth(22, 28, h);
  return smooth(0.48, 0.64, v) * (1 - ((1 - pink) * smooth(0.24, 0.3, s) + pink * smooth(0.3, 0.35, s)));
};
// kräftig gefärbt in einem Farbtonbereich (Orange, Braun); sehr dunkle Stellen (Augen, Nase, Hufe) nicht
// (Farbtöne über 300° zählen als negativ, so reicht ein Bereich auch über Rot hinweg, z. B. -24 bis 42)
const warm = (h0, h1, smin = 0.25, vmin = 0.3) => (v, s, h) => {
  const hd = h > 300 ? h - 360 : h;
  return smooth(smin - 0.06, smin + 0.04, s) * smooth(vmin - 0.08, vmin + 0.05, v) * smooth(h0 - 4, h0 + 2, hd) * (1 - smooth(h1 - 2, h1 + 4, hd));
};
// Reh und Hirsch: nur das kräftige Fell (das blassere rosa Innenohr und die helle Schnauze bleiben), dazu der rotbraune Rand
// und die dunklen Hufe
const fawn = warm(-24, 42, 0.42, 0.14);
const colored = (v, s) => smooth(0.3, 0.45, s) * smooth(0.3, 0.45, v); // alles Farbige (goldene Spinne), nicht die dunklen Konturen
const allButEyes = (v, s) => (s > 0.45 && v > 0.24 ? 0 : 1); // die pelzige Vogelspinne ganz, nur farbige Augen nicht

// Wie die Helligkeit auf die Farbskala kommt: wool = fest wie beim Schaf (1 = Grundwolle); sonst aus dem Standbild der
// Vorlage gemessen (lo/hi: dunkelste bzw. hellste Fellpunkte, ohne die äußersten Ausreißer)
const WOOL_LUMA = luma(248, 240, 219);

// Bilder einer Vorlage (Grundname + diese Endungen), die mit umgefärbt werden
const SHEETS = {
  sheep: ['', '_eat', '_walk', '_walk_back', '_idle', '_idle_back'],
  cat: ['', '_eat', '_sleep', '_walk', '_walk_back', '_idle', '_idle_back'],
  deer: ['', '_eat', '_walk', '_walk_back', '_idle', '_idle_back'],
  giraffe: ['', '_eat', '_walk', '_walk_back', '_idle', '_idle_back', '_eating', '_eating_back'],
  yak2: ['', '_walk', '_walk_back', '_idle', '_idle_back'],
  snake: ['', '_walk', '_walk_back', '_idle'],
  spider: ['', '_walk', '_walk_back'],
};

// Gruppen gleicher Umfärbung: Vorlage (from), Bilder, Maske, Messung und wie weit über die Lichtfarbe hinaus (tMax)
const G = {
  sheep: { from: 'sheep', sheets: SHEETS.sheep, mask: wool, range: 'wool', tMax: 1.2 },
  ram: { from: 'sheep2', sheets: SHEETS.sheep, mask: wool, range: 'wool', tMax: 1.2 },
  cat: { from: 'cat', sheets: SHEETS.cat, mask: warm(14, 44), tMax: 1.15 },
  bellcat: { from: 'cat2', sheets: SHEETS.cat, mask: light, tMax: 1.15 },
  deer: { from: 'deer', sheets: SHEETS.deer, mask: fawn, tMax: 1.15 },
  stag: { from: 'stag', sheets: SHEETS.deer, mask: fawn, tMax: 1.15 },
  giraffe: { from: 'giraffe', sheets: SHEETS.giraffe, mask: warm(16, 52, 0.2, 0.3), tMax: 1.15 },
  yak: { from: 'yak2', sheets: SHEETS.yak2, mask: light, tMax: 1.15 },
  snake: { from: 'snake', sheets: SHEETS.snake, mask: warm(2, 42, 0.32, 0.13), tMax: 1.15 }, // auch die dunklen Orangetöne an den Bändern (sonst bleibt ein rotbrauner Saum)
  spider: { from: 'tarantula2', sheets: SHEETS.spider, mask: colored, tMax: 1.1, hiCut: 0.01, loCut: 0.02 },
  fur: { from: 'tarantula', sheets: SHEETS.spider, mask: allButEyes, tMax: 1.3, hiCut: 0.005, loCut: 0.02, anims: { walkDown: 'tarantula_walk', walkUp: 'tarantula_walk_back' } },
};

// Farbskalen [Schatten, Licht]
const R = {
  grey: [[124, 122, 126], [204, 202, 204]],
  moorit: [[128, 80, 52], [204, 156, 116]],
  choc: [[80, 54, 40], [152, 114, 88]],
  black: [[44, 40, 44], [116, 110, 114]],
};

// Fellfarben je Tierart: id (= Name der neuen Bilder), Gruppe (g), Farbskala (ramp; null: unverändert kopiert, z. B. die
// pelzige Vogelspinne unter eigenem Namen) und die Angaben wie in SKINS (share: Anteil an den Fängen, das Grundbild hat
// kind.baseShare; common: keine Meldung „selten“, gilt nur für die bisherige seltene Gestalt und ihre Farben nicht)
const f = (de, en) => tr(de, en);
export const COATS = {
  sheep: [
    { id: 'sheep_grey', g: G.sheep, ramp: R.grey, name: f('graues Schaf', 'grey sheep'), neuter: true, share: 16, baby: 0.08, common: true },
    { id: 'sheep_moorit', g: G.sheep, ramp: R.moorit, name: f('braunes Schaf', 'brown sheep'), neuter: true, share: 11, baby: 0.05, common: true },
    { id: 'sheep_choc', g: G.sheep, ramp: R.choc, name: f('Schoko-Schaf', 'chocolate sheep'), neuter: true, share: 7, baby: 0.03, common: true },
    { id: 'sheep_black', g: G.sheep, ramp: R.black, name: f('schwarzes Schaf', 'black sheep'), neuter: true, share: 5, baby: 0.02, common: true },
    { id: 'sheep2_grey', g: G.ram, ramp: R.grey, name: f('grauer Widder', 'grey ram'), male: true, share: 4, baby: 0.01 },
    { id: 'sheep2_brown', g: G.ram, ramp: R.moorit, name: f('brauner Widder', 'brown ram'), male: true, share: 3, baby: 0.01 },
    { id: 'sheep2_black', g: G.ram, ramp: R.black, name: f('schwarzer Widder', 'black ram'), male: true, share: 2, baby: 0.005 },
  ],
  cat: [
    { id: 'cat_grey', g: G.cat, ramp: [[70, 70, 78], [205, 205, 210]], name: f('grau getigerte Katze', 'grey tabby cat'), share: 16, baby: 0.08, common: true },
    { id: 'cat_brown', g: G.cat, ramp: [[72, 50, 34], [196, 158, 112]], name: f('braun getigerte Katze', 'brown tabby cat'), share: 12, baby: 0.06, common: true },
    { id: 'cat_cream', g: G.cat, ramp: [[168, 128, 92], [252, 232, 198]], name: f('cremefarbene Katze', 'cream cat'), share: 6, baby: 0.03, common: true },
    { id: 'cat_black', g: G.cat, ramp: [[34, 32, 38], [104, 100, 108]], name: f('schwarze Katze', 'black cat'), share: 4, baby: 0.02, common: true },
    { id: 'cat2_cream', g: G.bellcat, ramp: [[190, 156, 116], [252, 236, 210]], name: f('cremefarbene Glöckchen-Katze', 'cream bell cat'), share: 4, baby: 0.01 },
    { id: 'cat2_blue', g: G.bellcat, ramp: [[104, 108, 122], [200, 204, 214]], name: f('blaugraue Glöckchen-Katze', 'blue-grey bell cat'), share: 3, baby: 0.01 },
    { id: 'cat2_red', g: G.bellcat, ramp: [[176, 98, 52], [246, 190, 140]], name: f('rote Glöckchen-Katze', 'red bell cat'), share: 2, baby: 0.005 },
    { id: 'cat2_black', g: G.bellcat, ramp: [[40, 38, 44], [120, 116, 124]], name: f('schwarze Glöckchen-Katze', 'black bell cat'), share: 1, baby: 0.005 },
  ],
  deer: [
    { id: 'deer_dark', g: G.deer, ramp: [[58, 36, 24], [146, 98, 64]], name: f('dunkelbraunes Reh', 'dark brown deer'), neuter: true, share: 16, baby: 0.08, common: true },
    { id: 'deer_light', g: G.deer, ramp: [[150, 108, 70], [232, 196, 150]], name: f('hellbraunes Reh', 'light brown deer'), neuter: true, share: 10, baby: 0.05, common: true },
    { id: 'deer_black', g: G.deer, ramp: [[34, 30, 30], [98, 88, 84]], name: f('schwarzes Reh', 'black deer'), neuter: true, share: 4, baby: 0.02, common: true },
    // ein Rehkitz ist nie ein Hirsch (baby 0)
    { id: 'stag_dark', g: G.stag, ramp: [[58, 36, 24], [146, 98, 64]], name: f('dunkelbrauner Hirsch', 'dark brown stag'), male: true, share: 2, baby: 0 },
    { id: 'stag_light', g: G.stag, ramp: [[150, 108, 70], [232, 196, 150]], name: f('hellbrauner Hirsch', 'light brown stag'), male: true, share: 1.5, baby: 0 },
    { id: 'stag_black', g: G.stag, ramp: [[34, 30, 30], [98, 88, 84]], name: f('schwarzer Hirsch', 'black stag'), male: true, share: 0.5, baby: 0 },
  ],
  giraffe: [
    { id: 'giraffe_net', g: G.giraffe, ramp: [[70, 26, 16], [250, 214, 150]], name: f('Netzgiraffe', 'reticulated giraffe'), share: 20, baby: 0.1, common: true },
  ],
  yak: [
    { id: 'yak2_gold', g: G.yak, ramp: [[150, 104, 48], [236, 198, 128]], name: f('goldener Yak', 'golden yak'), male: true, share: 4, baby: 0.01 },
    { id: 'yak2_brown', g: G.yak, ramp: [[96, 66, 46], [188, 146, 106]], name: f('brauner Yak', 'brown yak'), male: true, share: 2.5, baby: 0.01 },
    { id: 'yak2_grey', g: G.yak, ramp: [[116, 114, 114], [208, 206, 204]], name: f('grauer Yak', 'grey yak'), male: true, share: 1.5, baby: 0.005 },
  ],
  snake: [
    { id: 'snake_anery', g: G.snake, ramp: [[70, 70, 76], [196, 196, 200]], name: f('graue Schlange', 'grey snake'), share: 17, baby: 0, common: true },
    { id: 'snake_caramel', g: G.snake, ramp: [[130, 86, 30], [236, 196, 110]], name: f('Karamell-Schlange', 'caramel snake'), share: 13, baby: 0, common: true },
  ],
  // Spinne: das Grundbild ist die dünnbeinige goldene Spinne (tarantula2), die pelzige Vogelspinne ist die seltene Gestalt
  tarantula: [
    { id: 'tarantula_green', g: G.spider, ramp: [[40, 80, 24], [200, 230, 110]], name: f('grüne Spinne', 'green spider'), share: 16, baby: 0, common: true },
    { id: 'tarantula_rust', g: G.spider, ramp: [[80, 28, 16], [220, 130, 80]], name: f('rotbraune Spinne', 'red-brown spider'), share: 12, baby: 0, common: true },
    { id: 'tarantula_brown', g: G.spider, ramp: [[60, 40, 24], [200, 160, 110]], name: f('braune Spinne', 'brown spider'), share: 10, baby: 0, common: true },
    { id: 'tarantula_pale', g: G.spider, ramp: [[150, 130, 70], [255, 250, 215]], name: f('hellgelbe Spinne', 'pale yellow spider'), share: 7, baby: 0, common: true },
    { id: 'tarantula_fur', g: G.fur, ramp: null, name: f('Vogelspinne', 'tarantula'), share: 8, baby: 0 },
    { id: 'tarantula_fur_brown', g: G.fur, ramp: [[40, 26, 20], [150, 104, 72]], name: f('braune Vogelspinne', 'brown tarantula'), share: 3, baby: 0 },
    { id: 'tarantula_fur_rust', g: G.fur, ramp: [[52, 20, 16], [170, 80, 52]], name: f('rotbraune Vogelspinne', 'red-brown tarantula'), share: 2, baby: 0 },
    { id: 'tarantula_fur_grey', g: G.fur, ramp: [[38, 38, 42], [150, 150, 156]], name: f('graue Vogelspinne', 'grey tarantula'), share: 1.2, baby: 0 },
    { id: 'tarantula_fur_blue', g: G.fur, ramp: [[20, 24, 48], [80, 100, 170]], name: f('kobaltblaue Vogelspinne', 'cobalt blue tarantula'), share: 0.8, baby: 0 },
  ],
};
const BY_ID = new Map(Object.values(COATS).flat().map((c) => [c.id, c]));
export const isCoat = (id) => BY_ID.has(id);

// HSV eines Bildpunkts: [Helligkeit, Sättigung, Farbton in Grad]
function hsv(r, g, b) {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [max / 255, max ? d / max : 0, h];
}

function pixelsOf(textures, key) {
  const img = textures.get(key).getSourceImage();
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx, data: ctx.getImageData(0, 0, canvas.width, canvas.height) };
}

// Helligkeitsbereich des Fells (aus dem Standbild der Vorlage, einmal je Gruppe)
const ranges = new Map();
function rangeOf(textures, g) {
  if (g.range === 'wool') return [0.62 * WOOL_LUMA, WOOL_LUMA];
  if (ranges.has(g)) return ranges.get(g);
  const d = pixelsOf(textures, g.from).data.data;
  const vals = [];
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 200) continue;
    const [v, s, h] = hsv(d[i], d[i + 1], d[i + 2]);
    if (g.mask(v, s, h) > 0.5) vals.push(luma(d[i], d[i + 1], d[i + 2]));
  }
  vals.sort((a, b) => a - b);
  const lo = vals[Math.floor(vals.length * (g.loCut ?? 0.025))] ?? 0;
  const hi = Math.max(lo + 10, vals[Math.max(0, vals.length - 1 - Math.floor(vals.length * (g.hiCut ?? 0.01)))] ?? 255);
  const r = [lo, hi];
  ranges.set(g, r);
  return r;
}

// Bildpunkte (RGBA) ab Stelle i umfärben, bis die Zeit um ist (until, performance.now); gibt die nächste Stelle zurück
function recolorPart(data, coat, [lo, hi], i, until) {
  const { mask, tMax } = coat.g;
  const [shade, light] = coat.ramp;
  for (let n = 0; i < data.length; i += 4) {
    if (++n % 2048 === 0 && performance.now() > until) return i;
    if (!data[i + 3]) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const [v, s, h] = hsv(r, g, b);
    const w = mask(v, s, h);
    if (!w) continue;
    const t = Math.min(tMax, Math.max(0, (luma(r, g, b) - lo) / (hi - lo)));
    for (let c = 0; c < 3; c++) {
      const x = Math.min(255, Math.max(0, shade[c] + (light[c] - shade[c]) * t));
      data[i + c] = Math.round(data[i + c] * (1 - w) + x * w);
    }
  }
  return i;
}

// ---- Umfärben in kleinen Stücken ----
// Ein Bild auf einmal umzufärben dauert am Tablet bis zu einer halben Sekunde (Giraffe) und ließe das Spiel hängen. Darum
// steht jedes Bild in einer Warteschlange und wird zwischen den Bildern des Spiels jeweils nur BUDGET_MS lang bearbeitet.
// Eine Fellfarbe gilt erst als fertig (coatReady), wenn alle ihre Bilder da sind; bis dahin zeigt das Tier die Grundfarbe.
// Die fertigen Bilder kommen wie alle anderen erst beim Malen auf die Grafikkarte (lazyGpu, siehe gpuTextures.js).
// Ein Stück je Bild des Spiels (nach dem Malen), nicht pausenlos: mit setTimeout(0) allein lief die Warteschlange mehrmals
// zwischen zwei Bildern, und zusammen mit dem Nachladen im Hintergrund ruckelte das Tablet nach „Weiterspielen“ mit vielen
// Fellfarben im Tierpark eine halbe Minute lang (am Tablet darum auch weniger Zeit je Stück)
const BUDGET_MS = matchMedia('(pointer: coarse)').matches ? 3 : 5;
const nextFrame = () => requestAnimationFrame(() => setTimeout(pump, 0));
const jobs = []; // { textures, anims, coat, src, key, icon } – Bilder der Tiere vor den Bildchen fürs Tierbuch
const queued = new Set(); // Schlüssel in der Warteschlange
const pending = new Map(); // Fellfarbe → so viele Bilder fehlen noch
const started = new Set(); // Fellfarben, die schon ein Tier hatte (bekommen später geladene Vorlagen nachgereicht)
let pumping = false;
export const coatJobs = () => jobs.length; // (für die Diagnose, siehe diag.js)

function enqueue(job) {
  if (queued.has(job.key)) return;
  queued.add(job.key);
  if (job.icon) jobs.push(job);
  else {
    const firstIcon = jobs.findIndex((j) => j.icon);
    jobs.splice(firstIcon < 0 ? jobs.length : firstIcon, 0, job);
    pending.set(job.coat.id, (pending.get(job.coat.id) ?? 0) + 1);
  }
  if (!pumping) {
    pumping = true;
    nextFrame();
  }
}

function pump() {
  const until = performance.now() + BUDGET_MS;
  while (jobs.length && performance.now() < until) {
    const job = jobs[0];
    if (!job.data) Object.assign(job, pixelsOf(job.textures, job.src), { i: 0, range: job.coat.ramp ? rangeOf(job.textures, job.coat.g) : null });
    const len = job.data.data.length;
    job.i = job.coat.ramp ? recolorPart(job.data.data, job.coat, job.range, job.i, until) : len;
    if (job.i < len) break;
    jobs.shift();
    queued.delete(job.key);
    finish(job);
  }
  if (jobs.length) nextFrame();
  else pumping = false;
}

function finish(job) {
  const { textures, anims, coat, src, key, canvas, ctx, data } = job;
  if (coat.ramp) ctx.putImageData(data, 0, 0);
  const frame = textures.get(src).get(0);
  if (job.icon) {
    // als PNG verpacken läuft im Hintergrund (toBlob), nicht im Spiel
    canvas.toBlob((blob) => blob && registerAnimalIcon(coat.id, URL.createObjectURL(blob), frame.width, frame.height, Math.round(canvas.width / frame.width)));
    return;
  }
  pending.set(coat.id, pending.get(coat.id) - 1);
  if (textures.exists(key)) return;
  canvas.lazyGpu = true;
  const tex = textures.addSpriteSheet(key, canvas, { frameWidth: frame.width, frameHeight: frame.height });
  Object.assign(tex.customData, textures.get(src).customData);
  const anim = anims.get(src);
  if (anim && !anims.exists(key)) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: anim.frameRate, repeat: anim.repeat, yoyo: anim.yoyo });
}

// alle Bilder einer Fellfarbe in die Warteschlange (sobald ein Tier sie bekommt; jedes Bild nur einmal). Die Animationen
// der Vorlage werden mit gleichem Tempo übernommen. Fehlt eine Vorlage noch (wird im Hintergrund geladen), kommt sie,
// sobald sie da ist (makeCoatIcons nach jedem geladenen Paket)
export function ensureCoat(scene, id) {
  const coat = BY_ID.get(id);
  const textures = scene?.textures;
  if (!coat || !textures) return;
  const { from, sheets } = coat.g;
  if (!textures.exists(from)) return;
  started.add(id);
  for (const end of sheets) {
    const src = from + end;
    const key = id + end;
    if (!textures.exists(key) && textures.exists(src)) enqueue({ textures, anims: scene.anims, coat, src, key });
  }
}

// sind alle (schon ladbaren) Bilder dieser Fellfarbe fertig?
export function coatReady(scene, id) {
  return !pending.get(id) && !!scene?.textures?.exists(id);
}

// kleine Bilder (Standbild) aller Fellfarben für Tierbuch, Meldungen, Wünsche und Kisten-Karten (BootScene.setupAssets;
// nach jedem geladenen Paket, jede Farbe nur einmal, sobald ihre Vorlage geladen ist). Dabei bekommen schon benutzte
// Fellfarben ihre eben geladenen Vorlagen (z. B. die Laufbilder des Widders) nachgereicht
const iconDone = new Set();
export function makeCoatIcons(scene) {
  for (const id of started) ensureCoat(scene, id);
  for (const coat of BY_ID.values()) {
    if (iconDone.has(coat.id) || !scene.textures.exists(coat.g.from)) continue;
    iconDone.add(coat.id);
    enqueue({ textures: scene.textures, anims: scene.anims, coat, src: coat.g.from, key: `icon:${coat.id}`, icon: true });
  }
}

// Animationen einer Fellfarbe (für kind.skinAnims): die der Vorlage, nur mit den Namen der neuen Bilder
export function coatAnims(coat, kind) {
  const { from } = coat.g;
  const anims = coat.g.anims ?? (from === kind.texture ? kind.anims : kind.skinAnims?.[from]);
  if (!anims) return null;
  return Object.fromEntries(Object.entries(anims).map(([k, v]) => [k, coat.id + v.slice(from.length)]));
}
