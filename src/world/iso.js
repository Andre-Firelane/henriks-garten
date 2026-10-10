// Umrechnung zwischen Kachel-Koordinaten (tx, ty) und Welt-Pixeln.
// tx wächst nach unten rechts, ty nach unten links.

export const TILE_W = 64;
export const TILE_H = 32;

// Mittelpunkt einer Kachel in Welt-Pixeln
export function tileToWorld(tx, ty) {
  return {
    x: ((tx - ty) * TILE_W) / 2,
    y: ((tx + ty) * TILE_H) / 2 + TILE_H / 2,
  };
}

// Welche Kachel liegt unter einem Welt-Punkt?
export function worldToTile(x, y) {
  const a = x / (TILE_W / 2);
  const b = y / (TILE_H / 2);
  return {
    tx: Math.floor((a + b) / 2),
    ty: Math.floor((b - a) / 2),
  };
}
