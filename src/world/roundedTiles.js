// Bodenkacheln mit abgerundeten Ecken (für Wasser am Ufer). Die Textur wird beim ersten Gebrauch
// aus der normalen Kachel erzeugt: Pixel außerhalb der Rundung werden durchsichtig, darunter liegt Gras.
import Phaser from 'phaser';
import { CORNER } from './map.js';

const ROUND = 0.45; // Radius der Rundung in Kachelbreiten (0 = spitz, 0.5 = halbe Kante)

// Rauten-Ecken in Kachel-Koordinaten (a entlang tx, b entlang ty, beide 0..1)
const CORNERS = [
  [CORNER.top, 0, 0],
  [CORNER.right, 1, 0],
  [CORNER.bottom, 1, 1],
  [CORNER.left, 0, 1],
];

export function roundedTexture(scene, key, mask) {
  const newKey = `${key}_round${mask}`;
  if (scene.textures.exists(newKey)) return newKey;

  const src = scene.textures.get(key).getSourceImage();
  const w = src.width;
  const h = src.height;
  const tex = scene.textures.createCanvas(newKey, w, h);
  tex.context.drawImage(src, 0, 0);
  const img = tex.context.getImageData(0, 0, w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Pixelmitte in Kachel-Koordinaten umrechnen (obere Rautenspitze liegt bei x = w/2, y = 0)
      const px = (x + 0.5 - w / 2) / (w / 2);
      const py = (y + 0.5) / (h / 2);
      const a = (px + py) / 2;
      const b = (py - px) / 2;
      for (const [bit, ca, cb] of CORNERS) {
        if (!(mask & bit)) continue;
        const sa = ca ? -1 : 1;
        const sb = cb ? -1 : 1;
        const da = (a - ca) * sa; // Abstand von der Ecke nach innen
        const db = (b - cb) * sb;
        if (da < ROUND && db < ROUND && Math.hypot(ROUND - da, ROUND - db) > ROUND) img.data[(y * w + x) * 4 + 3] = 0;
      }
    }
  }
  tex.context.putImageData(img, 0, 0);
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return newKey;
}
