// Kleine Tierbilder für die Anzeige (HUD, Meldungen, Wegweiser) statt Tiernamen.
// Ein Bild ist ein Ausschnitt aus dem Spritesheet der Tierart (Bildgrößen wie in BootScene).
const SHEETS = {
  // Bildbreite, Bildhöhe, Anzahl Bilder im Sheet, welches Bild gezeigt wird
  sheep: [80, 88, 4, 0],
  cat: [72, 80, 4, 0],
  deer: [72, 96, 4, 0],
  stag: [80, 112, 4, 0],
  fish: [84, 64, 4, 1], // Fisch nach rechts schwimmend
  squirrel: [56, 60, 4, 0],
  fox: [72, 72, 4, 0],
  frog: [56, 52, 4, 0],
  mole: [56, 52, 4, 0],
  heron: [88, 108, 4, 0],
  antelope: [72, 100, 4, 0],
  zebra: [80, 104, 4, 0],
  meerkat: [40, 56, 4, 0],
  giraffe: [104, 168, 4, 0],
};

// HTML für ein Tierbild; size in em (passt sich der Schriftgröße drumherum an)
export function animalIcon(species, size = 2.6) {
  const [w, h, count, frame] = SHEETS[species];
  const k = size / h;
  const style = [
    `width:${(w * k).toFixed(3)}em`,
    `height:${size}em`,
    `background-image:url(assets/${species}.png)`,
    `background-size:${(w * count * k).toFixed(3)}em ${size}em`,
    `background-position:${(-w * frame * k).toFixed(3)}em 0`,
  ].join(';');
  return `<span class="animal" style="${style}"></span>`;
}

export function animalIcons(list, size) {
  return list.map((s) => animalIcon(s, size)).join('');
}
