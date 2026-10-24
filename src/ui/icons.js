// Kleine Tierbilder für die Anzeige (HUD, Meldungen, Wegweiser) statt Tiernamen.
// Ein Bild ist ein Ausschnitt aus dem Spritesheet der Tierart (Bildgrößen wie in BootScene).
const SHEETS = {
  // Bildbreite, Bildhöhe, Anzahl Bilder im Sheet (je Zeile), welches Bild gezeigt wird (und die Datei, falls sie anders heißt,
  // und die Zahl der Zeilen bei Rastern)
  sheep: [80, 88, 4, 0],
  cat: [72, 80, 4, 0],
  deer: [72, 96, 4, 0],
  stag: [80, 112, 4, 0],
  fish: [84, 64, 4, 1], // Fisch nach rechts schwimmend
  koi: [88, 52, 4, 0], // rot-weißer Koi
  hero: [72, 116, 4, 0], // die Spielfigur (Tierpark auf der Weltkarte)
  squirrel: [56, 60, 4, 0],
  fox: [72, 72, 4, 0],
  frog: [56, 52, 4, 0],
  mole: [56, 52, 4, 0],
  heron: [88, 108, 4, 0],
  flamingo: [88, 108, 4, 0],
  panda: [88, 96, 4, 0],
  tiger: [96, 80, 4, 0],
  orangutan: [88, 88, 4, 0],
  peacock: [96, 96, 4, 0],
  macaque: [72, 72, 4, 0],
  antelope: [72, 100, 4, 0],
  zebra: [80, 104, 4, 0],
  meerkat: [40, 56, 4, 0],
  lion: [72, 96, 4, 0],
  crocodile: [72, 92, 4, 0, 'croc'],
  giraffe: [104, 168, 4, 0],
  reeffish: [96, 64, 12, 0, 'reeffish', 4], // Riff-Fische: der Clownfisch steht für alle (Raster: 12 Bilder je Zeile, 4 Zeilen)
  seahorse: [48, 64, 4, 0],
  octopus: [72, 72, 4, 0],
  turtle: [112, 88, 4, 0],
  jellyfish: [64, 96, 4, 0],
  ray: [112, 80, 4, 0],
  wolf: [80, 80, 4, 0],
  gnu: [88, 96, 4, 0],
  butterfly: [64, 64, 3, 0, 'butterfly', 12], // Schmetterlinge: der orange steht für alle (Raster: 3 Bilder je Zeile, 12 Zeilen)
};

// HTML für ein Tierbild; size in em (passt sich der Schriftgröße drumherum an)
export function animalIcon(species, size = 2.6) {
  const [w, h, count, frame, file = species, rows = 1] = SHEETS[species];
  const k = size / h;
  const style = [
    `width:${(w * k).toFixed(3)}em`,
    `height:${size}em`,
    `background-image:url(assets/${file}.png)`,
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
    `background-image:url(assets/${file}.png)`,
    `background-size:${(w * count * k).toFixed(3)}em ${(h * rows * k).toFixed(3)}em`,
    `background-position:${(-w * frame * k).toFixed(3)}em 0`,
  ].join(';');
  return `<span class="animal-box" style="width:${size}em;height:${size}em"><span class="animal" style="${style}"></span></span>`;
}

export function animalIcons(list, size) {
  return list.map((s) => animalIcon(s, size)).join('');
}
