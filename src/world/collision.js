import { worldToTile } from './iso.js';
import { isBlockedPoint } from './map.js';

// Die Kacheln unter den vier Rändern der Füße (halbe Breite fw, halbe Höhe fh) an Position x/y
export function footTiles(x, y, fw, fh) {
  return [
    [x - fw, y],
    [x + fw, y],
    [x, y - fh],
    [x, y + fh],
  ].map(([px, py]) => worldToTile(px, py));
}

// Stehen die Füße an Position x/y auf etwas Festem? wade: Wasser ist begehbar (Wasserbüffel)
export function blockedAt(x, y, fw, fh, wade = false) {
  return [
    [x - fw, y],
    [x + fw, y],
    [x, y - fh],
    [x, y + fh],
  ].some(([px, py]) => isBlockedPoint(px, py, wade));
}
