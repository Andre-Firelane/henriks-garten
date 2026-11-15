"""E-Roller-Animationen aus Andres Videos auf Grün (Animation/Roller fährt vorne|hinten.mp4, 640 × 640, 24 Bilder/s).

- Hintergrundgrün und der grüne Bodenschatten werden durchsichtig (der Roller ist nur leicht grün), Kanten weich.
- Fahrtwind-Striche hinter dem Roller: es bleibt nur das größte zusammenhängende Stück (Henrik mit Roller).
- Gleicher Maßstab und Fußpunkt wie die Standbilder (public/assets/scooter.png, 170 × 170, Räder 6 px über dem Rand).
  Von vorne fährt der Roller im Video nach unten links; die Spielfigur-Animationen schauen nach rechts (nach links wird
  im Spiel gespiegelt), deshalb wird diese Ansicht gespiegelt. Von hinten fährt er nach oben rechts (bleibt so).
Ergebnis: public/assets/scooter_walk.png und scooter_walk_back.png (170 × 170, ggf. mehrere gleich volle Reihen) und Kopien in
Roller-Sprites/.
Aufruf: python tools/scooter-anim.py  (danach python tools/make-webp.py .)
"""
import json
import subprocess
from collections import deque

import numpy as np
from PIL import Image

FRAME, FOOT = 170, 6
MAX_W = 4096  # breitere Bilder kann manches Handy nicht laden: dann mehrere Reihen, alle gleich voll (keine leeren Felder,
# die würde Phaser als unsichtbare Bilder mit abspielen)
VIDEOS = [
    # Ausgabe, Video, spiegeln, Bild im Standbild-Streifen (zum Maßstab: 0 unten rechts, 2 oben rechts)
    ('scooter_walk', 'Animation/Roller fährt vorne.mp4', True, 0),
    ('scooter_walk_back', 'Animation/Roller fährt hinten.mp4', False, 2),
]


def read(path):
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                                      '-of', 'json', path], capture_output=True, check=True).stdout)['streams'][0]
    w, h = info['width'], info['height']
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def key(frame):
    a = frame.astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lead = g - np.maximum(r, b)
    # nach dem Vorsprung von Grün: Hintergrund und grüner Bodenschatten (Vorsprung über 80) weg, der Roller (dunkles,
    # nur leicht grünes Grau, Vorsprung um 20–35) bleibt
    alpha = np.clip((80 - lead) / 45, 0, 1)
    rgb = a.astype(np.float32)
    spill = (lead > 0) & (alpha < 1)
    rgb[..., 1] = np.where(spill, np.maximum(r, b) + (g - np.maximum(r, b)) * alpha * 0.4, g)
    return np.dstack([rgb, alpha])


def largest_part(alpha):
    """Maske des größten zusammenhängenden Stücks (mit etwas Rand), damit Fahrtwind-Striche wegfallen."""
    solid = alpha > 0.5
    h, w = solid.shape
    seen = np.zeros_like(solid)
    best = None
    for y0, x0 in zip(*np.nonzero(solid)):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)])
        seen[y0, x0] = True
        pts = []
        while q:
            y, x = q.popleft()
            pts.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        if best is None or len(pts) > len(best):
            best = pts
    keep = np.zeros_like(solid)
    ys, xs = np.array(best).T
    keep[ys, xs] = True
    for _ in range(2):  # weiche Kanten behalten
        keep[1:] |= keep[:-1].copy()
        keep[:-1] |= keep[1:].copy()
        keep[:, 1:] |= keep[:, :-1].copy()
        keep[:, :-1] |= keep[:, 1:].copy()
    return keep


def main():
    still = np.array(Image.open('public/assets/scooter.png'))[..., 3]
    for name, src, mirror, ref in VIDEOS:
        frames = [key(f) for f in read(src)]
        for k in frames:
            k[..., 3] *= largest_part(k[..., 3])
        ys, xs = np.nonzero(frames[0][..., 3] > 0.5)
        top, bottom, left, right = ys.min(), ys.max(), xs.min(), xs.max()
        sy = np.nonzero(still[:, ref * FRAME:(ref + 1) * FRAME] > 128)[0]
        scale = (sy.max() - sy.min() + 1) / (bottom - top + 1)  # so hoch wie das Standbild in dieser Richtung
        cx = (left + right) / 2
        n = len(frames)
        rows = -(-n * FRAME // MAX_W)
        while n % rows:  # gleich viele Bilder je Reihe: notfalls eine Reihe mehr
            rows += 1
        per_row = n // rows
        sheet = Image.new('RGBA', (FRAME * per_row, FRAME * rows))
        for i, k in enumerate(frames):
            img = Image.fromarray(np.dstack([np.clip(k[..., :3], 0, 255), k[..., 3:] * 255]).astype(np.uint8), 'RGBA')
            w, h = img.size
            img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
            ox = FRAME / 2 - ((w - cx) if mirror else cx) * scale
            if mirror:
                img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            oy = FRAME - FOOT - bottom * scale
            cell = Image.new('RGBA', (FRAME, FRAME))
            cx0, cy0 = max(0, -round(ox)), max(0, -round(oy))
            cell.alpha_composite(img.crop((cx0, cy0, cx0 + FRAME, cy0 + FRAME)), (max(0, round(ox)), max(0, round(oy))))
            sheet.alpha_composite(cell, ((i % per_row) * FRAME, (i // per_row) * FRAME))
        sheet.save(f'public/assets/{name}.png')
        sheet.save(f'Roller-Sprites/{name}.png')
        print(f'{name}: {n} Bilder in {rows} Reihe(n) zu {per_row}, Maßstab {scale:.3f}')


if __name__ == '__main__':
    main()
