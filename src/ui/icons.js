// Kleine Tierbilder für die Anzeige (HUD, Meldungen, Wegweiser) statt Tiernamen.
// Ein Bild ist ein Ausschnitt aus dem Spritesheet der Tierart (Bildgrößen wie in BootScene).
const SHEETS = {
  // Bildbreite, Bildhöhe, Anzahl Bilder im Sheet (je Zeile), welches Bild gezeigt wird (und die Datei, falls sie anders heißt,
  // und die Zahl der Zeilen bei Rastern)
  sheep: [80, 88, 4, 0],
  cow: [96, 88, 4, 0, 'farm_cow'], // Hoftiere im Streichelzoo (Bilder heißen farm_<Art>)
  pig: [80, 88, 4, 0, 'farm_pig'],
  goat: [80, 88, 4, 0, 'farm_goat'],
  cat: [72, 80, 4, 0],
  deer: [72, 96, 4, 0],
  stag: [80, 112, 4, 0],
  fish: [84, 64, 4, 1], // Fisch nach rechts schwimmend
  koi: [88, 52, 4, 0], // rot-weißer Koi
  hero: [72, 116, 4, 0], // die Spielfigur (Tierpark auf der Weltkarte)
  squirrel: [56, 60, 4, 0],
  fox: [72, 72, 4, 0],
  beaver: [80, 60, 4, 0],
  frog: [56, 52, 4, 0],
  heron: [88, 108, 4, 0],
  flamingo: [88, 108, 4, 0],
  panda: [88, 96, 4, 0],
  tiger: [120, 104, 4, 0],
  orangutan: [88, 88, 4, 0],
  peacock: [96, 96, 4, 0],
  macaque: [72, 72, 4, 0],
  howler: [88, 88, 4, 0],
  gibbon: [88, 88, 4, 0],
  anteater: [104, 72, 4, 0],
  iguana: [96, 56, 4, 0],
  jaguar: [104, 96, 4, 0],
  gorilla: [104, 96, 4, 0],
  panther: [104, 96, 4, 0],
  iguana2: [96, 56, 4, 0],
  snake: [72, 72, 4, 0],
  macaw: [64, 80, 4, 0],
  toucan: [64, 80, 4, 0],
  tarantula: [64, 64, 4, 0, 'tarantula2'], // die dünnbeinige goldene Spinne (die pelzige Vogelspinne ist eine Fellfarbe, animals/coats.js)
  antelope: [72, 100, 4, 0],
  zebra: [80, 104, 4, 0],
  meerkat: [40, 56, 4, 0],
  lion: [72, 96, 4, 0],
  crocodile: [72, 92, 4, 0, 'croc'],
  giraffe: [104, 168, 4, 0],
  reeffish: [96, 64, 12, 0, 'reeffish', 4], // Riff-Fische: der Clownfisch steht für alle (Raster: 12 Bilder je Zeile, 4 Zeilen)
  seahorse: [48, 64, 4, 0],
  piranha: [96, 64, 2, 0],
  octopus: [72, 72, 4, 0],
  turtle: [112, 88, 4, 0],
  jellyfish: [64, 96, 4, 0],
  ray: [112, 80, 4, 0],
  wolf: [80, 80, 4, 0],
  // seltene Varianten (eigene Bilder, gleiche Maße wie die Art; z. B. für die Kisten-Karten in world/LuckWorld.js)
  cat2: [72, 80, 4, 0],
  frog2: [56, 52, 4, 0],
  antelope2: [72, 100, 4, 0],
  zebra2: [80, 104, 4, 0],
  lion2: [72, 96, 4, 0],
  tiger2: [120, 104, 4, 0],
  peacock2: [96, 96, 4, 0],
  orangutan2: [88, 88, 4, 0],
  wolf2: [80, 80, 4, 0],
  macaw2: [64, 80, 4, 0],
  ray2: [112, 80, 4, 0],
  jellyfish2: [64, 96, 4, 0],
  croc_albino: [72, 92, 4, 0],
  snake2: [72, 72, 4, 0],
  tarantula2: [64, 64, 4, 0],
  sheep2: [80, 88, 4, 0],
  heron2: [88, 108, 4, 0],
  fox2: [72, 72, 4, 0],
  squirrel2: [56, 60, 4, 0],
  beaver2: [80, 60, 4, 0],
  macaque2: [72, 72, 4, 0],
  giraffe2: [104, 168, 4, 0],
  panda2: [88, 96, 4, 0],
  octopus2: [72, 72, 4, 0],
  anteater2: [104, 72, 4, 0],
  meerkat2: [40, 56, 4, 0],
  vulture2: [88, 108, 4, 0],
  gorilla2: [104, 96, 4, 0],
  hyena2: [80, 80, 4, 0],
  hippo2: [96, 88, 4, 0],
  warthog2: [80, 88, 4, 0],
  toucan2: [64, 80, 4, 0],
  penguin2: [72, 80, 4, 0],
  seal2: [96, 72, 4, 0],
  seahorse2: [48, 64, 4, 0],
  turtle2: [112, 88, 4, 0],
  gnu: [88, 96, 4, 0],
  hippo: [96, 88, 4, 0],
  tapir: [96, 88, 4, 0],
  tapir2: [96, 88, 4, 0],
  okapi: [80, 104, 4, 0],
  okapi2: [80, 104, 4, 0],
  elk: [128, 128, 4, 0],
  elk2: [128, 128, 4, 0],
  hedgehog: [80, 64, 4, 0],
  hedgehog2: [80, 64, 4, 0],
  boar: [104, 96, 4, 0],
  boar2: [120, 96, 1, 0, 'boar2_icon'], // Bache mit Frischlingen (eigenes Bild nur für die Anzeige; im Spiel dasselbe Bild wie das Wildschwein)
  redpanda: [72, 72, 4, 0],
  tanuki: [72, 72, 4, 0],
  tanuki2: [72, 72, 4, 0],
  yak: [112, 104, 4, 0],
  yak2: [112, 104, 4, 0],
  snowleopard: [88, 80, 4, 0],
  hyena: [80, 80, 4, 0],
  warthog: [80, 88, 4, 0],
  vulture: [88, 108, 4, 0],
  penguin: [72, 80, 4, 0], // Eiswelt (auf der Weltkarte)
  snowhare: [56, 60, 4, 0], // neue Eiswelt-Tiere
  arcticfox: [72, 72, 4, 0],
  arcticwolf: [80, 80, 4, 0],
  snowowl: [56, 64, 4, 0],
  reindeer: [80, 112, 4, 0],
  walrus: [104, 100, 4, 0],
  polarbear: [112, 104, 4, 0],
  puffin: [48, 52, 4, 0],
  seal: [72, 88, 4, 1],
  butterfly: [64, 64, 3, 0, 'butterfly', 12], // Schmetterlinge: der orange steht für alle (Raster: 3 Bilder je Zeile, 12 Zeilen)
};

// Bilder, die erst im Spiel entstehen (Fellfarben, animals/coats.js): Schlüssel → Adresse (data:-URL)
const URLS = {};
const sheetUrl = (file) => URLS[file] ?? `assets/${file}.png`;

// ein im Spiel erzeugtes Bild anmelden (Spritesheet als data:-URL; Bildbreite, Bildhöhe, Anzahl Bilder; gezeigt wird das erste)
export function registerAnimalIcon(key, url, w, h, count) {
  SHEETS[key] = [w, h, count, 0, key];
  URLS[key] = url;
}

// gibt es für diesen Schlüssel (Tierart oder Skin) ein eigenes Bild?
export const hasAnimalIcon = (key) => !!SHEETS[key];

// HTML für ein Tierbild; size in em (passt sich der Schriftgröße drumherum an)
export function animalIcon(species, size = 2.6) {
  const [w, h, count, frame, file = species, rows = 1] = SHEETS[species];
  const k = size / h;
  const style = [
    `width:${(w * k).toFixed(3)}em`,
    `height:${size}em`,
    `background-image:url(${sheetUrl(file)})`,
    `background-size:${(w * count * k).toFixed(3)}em ${(size * rows).toFixed(3)}em`,
    `background-position:${(-w * frame * k).toFixed(3)}em 0`,
  ].join(';');
  return `<span class="animal" style="${style}"></span>`;
}

// Tierbild in einem quadratischen Feld (size em): breite und hohe Tiere passen gleichermaßen hinein
export function animalIconSquare(species, size = 3) {
  const [w, h, count, frame, file = species, rows = 1] = SHEETS[species];
  const k = size / Math.max(w, h);
  const style = [
    `width:${(w * k).toFixed(3)}em`,
    `height:${(h * k).toFixed(3)}em`,
    `background-image:url(${sheetUrl(file)})`,
    `background-size:${(w * count * k).toFixed(3)}em ${(h * rows * k).toFixed(3)}em`,
    `background-position:${(-w * frame * k).toFixed(3)}em 0`,
  ].join(';');
  return `<span class="animal-box" style="width:${size}em;height:${size}em"><span class="animal" style="${style}"></span></span>`;
}

// Tierbild auf seinen sichtbaren Teil zugeschnitten, in einem quadratischen Feld (size em): so sind alle Tiere gleich groß,
// egal wie viel leeren Rand ihr Bild hat (z. B. Zähler der Expedition). Den Rand misst das Bild einmal selbst aus; bis dahin
// kommt animalIconSquare, und onReady() wird aufgerufen, sobald der Zuschnitt bekannt ist (dann neu zeichnen)
const VISIBLE = {}; // Art → sichtbarer Bereich im Einzelbild { x, y, w, h } (in Bildpunkten des Spritesheets)
const measuring = {};
export function animalIconFit(species, size = 2, onReady = null) {
  const box = VISIBLE[species];
  if (!box) {
    measureVisible(species, onReady);
    return animalIconSquare(species, size);
  }
  const [w, h, count, frame, file = species, rows = 1] = SHEETS[species];
  const k = size / Math.max(box.w, box.h);
  const style = [
    `width:${(box.w * k).toFixed(3)}em`,
    `height:${(box.h * k).toFixed(3)}em`,
    `background-image:url(${sheetUrl(file)})`,
    `background-size:${(w * count * k).toFixed(3)}em ${(h * rows * k).toFixed(3)}em`,
    `background-position:${(-(w * frame + box.x) * k).toFixed(3)}em ${(-box.y * k).toFixed(3)}em`,
  ].join(';');
  return `<span class="animal-box" style="width:${size}em;height:${size}em"><span class="animal" style="${style}"></span></span>`;
}

function measureVisible(species, onReady) {
  if (measuring[species]) {
    if (onReady) measuring[species].push(onReady);
    return;
  }
  measuring[species] = onReady ? [onReady] : [];
  const [w, h, count, frame, file = species] = SHEETS[species];
  const img = new Image();
  img.onload = () => {
    const scale = img.naturalWidth / (w * count); // (falls das Bild größer gespeichert ist als im Spritesheet angegeben)
    const c = document.createElement('canvas');
    c.width = Math.round(w * scale);
    c.height = Math.round(h * scale);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, w * frame * scale, 0, w * scale, h * scale, 0, 0, c.width, c.height);
    const a = ctx.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (a[(y * c.width + x) * 4 + 3] < 24) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    VISIBLE[species] = x1 < 0 ? { x: 0, y: 0, w, h } : { x: x0 / scale, y: y0 / scale, w: (x1 - x0 + 1) / scale, h: (y1 - y0 + 1) / scale };
    for (const f of measuring[species]) f();
  };
  img.src = sheetUrl(file);
}

export function animalIcons(list, size) {
  return list.map((s) => animalIcon(s, size)).join('');
}
