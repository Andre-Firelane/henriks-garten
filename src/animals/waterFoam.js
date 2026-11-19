// Schaumkante für Tiere, die halb im Wasser schwimmen (Elch, Tapir, Nilpferd, Biber): eine Reihe heller, leicht
// wabernder Bläschen genau dort, wo der Körper aus dem Wasser schaut. Die Wasserkante ist in den Bildern schräg im
// Iso-Winkel geschnitten (tools/static-sheet.py --schraeg, tools/slant-water.py); sie wird je Bild einmal aus den
// Bildpunkten gelesen: je Spalte der unterste sichtbare Punkt. Spalten, die gar nicht bis ans Wasser reichen
// (Geweihspitzen, Ohren), fallen weg.
const EDGE_SPAN = 0.42; // so weit (Anteil der Bildhöhe) über dem tiefsten Punkt zählt eine Spalte noch zur Kante
const edges = new Map(); // je Bild und Ausschnitt: Punkte der Wasserkante

// Punkte der Wasserkante (Bildpixel, relativ zum Ursprung des Bilds bei originY), etwa alle step Pixel
export function waterEdge(scene, sprite, originY, step = 6) {
  const key = sprite.texture.key;
  const frame = sprite.frame.name;
  const id = `${key}:${frame}:${step}`;
  if (!edges.has(id)) {
    const { width: w, height: h } = sprite.frame;
    const bottom = [];
    for (let x = 0; x < w; x += 2) {
      let y = h - 1;
      while (y >= 0 && (scene.textures.getPixelAlpha(x, y, key, frame) ?? 0) <= 96) y--;
      if (y >= 0) bottom.push({ x, y });
    }
    const low = bottom.length ? Math.max(...bottom.map((p) => p.y)) : 0;
    const edge = bottom.filter((p) => p.y > low - h * EDGE_SPAN);
    const pts = [];
    const every = Math.max(1, Math.round(step / 2));
    for (let i = 0; i < edge.length; i += every) pts.push({ x: edge[i].x - w / 2, y: edge[i].y - h * originY });
    if (edge.length > 1) pts.push({ x: edge[edge.length - 1].x - w / 2, y: edge[edge.length - 1].y - h * originY });
    edges.set(id, pts);
  }
  return edges.get(id);
}

// Bläschen entlang der Punkte zeichnen (g: Graphics des Tiers); size: Größe der Bläschen (1 = wie beim Elch)
export function drawWaterFoam(g, scene, sprite, pts, { alpha = 1, size = 1 } = {}) {
  g.clear();
  const n = pts.length;
  if (!n || alpha <= 0.01) return;
  const t = scene.time.now / 1000;
  const flip = sprite.flipX ? -1 : 1;
  const bubbles = pts.map((p, i) => {
    const u = n > 1 ? i / (n - 1) : 0.5;
    const taper = 0.45 + 0.55 * Math.sin(Math.PI * u);
    const x = p.x * flip + Math.sin(i * 5.3) * 1.4 + Math.sin(t * 1.3 + i * 2.1) * 0.7;
    const y = p.y + 0.5 + Math.sin(i * 7.1) * 0.6 + Math.sin(t * 2.4 + i * 1.7) * 0.4;
    const r = (1.8 + Math.abs(Math.sin(i * 3.7)) * 1.6 + Math.sin(t * 3.1 + i * 2.3) * 0.35) * taper * size;
    return [x, y, r];
  });
  g.fillStyle(0x9fc4cc, 0.3);
  for (const [x, y, r] of bubbles) g.fillEllipse(x, y + 1.3, r * 2.4, r * 1.6);
  g.fillStyle(0xffffff, 0.55);
  for (const [x, y, r] of bubbles) g.fillEllipse(x, y, r * 2.2, r * 1.4);
  g.fillStyle(0xffffff, 0.6);
  for (const [x, y, r] of bubbles) g.fillEllipse(x - r * 0.3, y - r * 0.25, r * 1.1, r * 0.7); // Glanz
  g.setPosition(sprite.x, sprite.y).setScale(sprite.scaleX, sprite.scaleY).setDepth(sprite.depth + 0.01).setAlpha(alpha * sprite.alpha).setVisible(sprite.visible);
}
