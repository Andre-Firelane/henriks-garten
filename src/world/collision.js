import { worldToTile } from './iso.js';
import { isBlockedPoint, isBoatBlockedPoint } from './map.js';

// Die Kacheln unter den vier Rändern der Füße (halbe Breite fw, halbe Höhe fh) an Position x/y
export function footTiles(x, y, fw, fh) {
  return [
    [x - fw, y],
    [x + fw, y],
    [x, y - fh],
    [x, y + fh],
  ].map(([px, py]) => worldToTile(px, py));
}

// Stehen die Füße an Position x/y auf etwas Festem? wade: Wasser ist begehbar (Wasserbüffel),
// trample: kleine Büsche sind begehbar (Elefant)
export function blockedAt(x, y, fw, fh, wade = false, trample = false) {
  return [
    [x - fw, y],
    [x + fw, y],
    [x, y - fh],
    [x, y + fh],
  ].some(([px, py]) => isBlockedPoint(px, py, wade, trample));
}

// Kanu: liegt ein Rand des Boots (halbe Länge fw, halbe Breite fh) nicht mehr auf dem Fluss?
export function boatBlockedAt(x, y, fw, fh) {
  return [
    [x - fw, y],
    [x + fw, y],
    [x, y - fh],
    [x, y + fh],
  ].some(([px, py]) => isBoatBlockedPoint(px, py));
}
