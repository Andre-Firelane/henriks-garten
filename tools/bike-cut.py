"""Fahrrad im Tierpark aus Andres Bildern auf Weiß ausschneiden (Sprites/Fahrrad.webp leer, Sprites/Fahrrad besetzt.webp
mit Henrik; je zwei Ansichten nebeneinander, 1024 × 572).

Weiß verschwindet überall, auch zwischen den Speichen (alle reinweißen Flächen, nicht nur die am Rand; Shirt und Augen
sind nicht reinweiß). Ergebnis: Bildstreifen mit 4 Bildern wie bei der Spielfigur (unten rechts, unten links, oben rechts,
oben links; die fehlenden Richtungen gespiegelt), je FRAME × FRAME, Fußpunkt (Unterkante der Räder) FOOT px über dem Rand:
  public/assets/bike.png        mit Henrik (beim Fahren)
  public/assets/bike_empty.png  leer (abgestellt)
  public/assets/bike_icon.png   ein Bild davon (Symbol in der Werkzeugleiste)
dazu Kopien in Fahrrad-Sprites/ und jede Ansicht einzeln in voller Größe in Fahrrad-Sprites/einzeln/.
Aufruf: python tools/bike-cut.py  (danach python tools/make-webp.py .)
"""
import os
from collections import deque

import numpy as np
from PIL import Image

FRAME, FOOT = 140, 6
RIDER_H = 112  # Henrik auf dem Rad, vom Kopf bis zur Unterkante der Räder (die Figur zu Fuß ist 108 hoch)
EMPTY_SIZE = 0.75  # das leere Rad ist im Bild größer gezeichnet: so viel kleiner, damit es gleich groß ist wie mit Henrik
# Ansichten im Bild (links, rechts) → Richtung; "flip" = gespiegelt ergibt die andere Seite
VIEWS = {
    'bike': {'down_right': 0, 'up_left': 1},  # mit Henrik: vorne fährt es nach unten rechts, hinten nach oben links
    'bike_empty': {'down_right': 0, 'up_right': 1},  # leer: hinten nach oben rechts
}
SOURCES = {'bike': 'Sprites/Fahrrad besetzt.webp', 'bike_empty': 'Sprites/Fahrrad.webp'}
ORDER = ['down_right', 'down_left', 'up_right', 'up_left']  # wie FRAME in src/player/Player.js
OTHER = {'down_right': 'down_left', 'down_left': 'down_right', 'up_right': 'up_left', 'up_left': 'up_right'}
NAMES = {'down_right': '1_unten_rechts', 'down_left': '2_unten_links', 'up_right': '3_oben_rechts', 'up_left': '4_oben_links'}


def cut_white(path):
    a = np.array(Image.open(path).convert('RGB')).astype(np.int32)
    h, w, _ = a.shape
    white = (a.min(2) >= 238) & (a.max(2) - a.min(2) < 14)
    # zusammenhängende weiße Flächen: am Rand immer Hintergrund, eingeschlossen nur, wenn reinweiß (zwischen den Speichen)
    gone = np.zeros((h, w), bool)
    seen = np.zeros((h, w), bool)
    for y0 in range(h):
        for x0 in range(w):
            if not white[y0, x0] or seen[y0, x0]:
                continue
            q = deque([(y0, x0)])
            seen[y0, x0] = True
            pts = []
            while q:
                y, x = q.popleft()
                pts.append((y, x))
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            ys, xs = np.array(pts).T
            border = ys.min() == 0 or xs.min() == 0 or ys.max() == h - 1 or xs.max() == w - 1
            if border or np.median(a[ys, xs].min(1)) >= 250:  # Median: die weichen Kantenpixel zählen nicht mit
                gone[ys, xs] = True
    # Kanten: helle Pixel direkt neben dem Weggenommenen halb durchsichtig (weicher Übergang statt weißem Saum)
    near = gone.copy()
    for _ in range(2):
        near[1:] |= near[:-1].copy()
        near[:-1] |= near[1:].copy()
        near[:, 1:] |= near[:, :-1].copy()
        near[:, :-1] |= near[:, 1:].copy()
    alpha = np.full((h, w), 255.0)
    edge = near & ~gone & (a.min(2) > 180)
    alpha[edge] = np.clip((255 - a.min(2)[edge]) / 75 * 255, 0, 255)
    alpha[gone] = 0
    out = np.dstack([a, alpha]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def views(path):
    im = cut_white(path)
    al = np.array(im)[..., 3]
    w = im.width
    filled = (al > 40).sum(0)
    cut = min(range(w // 3, 2 * w // 3), key=lambda x: (filled[x], abs(x - w // 2)))  # leerste Spalte zwischen den Ansichten
    out = []
    for x0, x1 in ((0, cut), (cut, w)):
        part = im.crop((x0, 0, x1, im.height))
        out.append(part.crop(part.getbbox()))
    return out


def main():
    os.makedirs('Fahrrad-Sprites/einzeln', exist_ok=True)
    flip = Image.Transpose.FLIP_LEFT_RIGHT
    rider = views(SOURCES['bike'])
    scale = RIDER_H / rider[0].height
    for name, mapping in VIEWS.items():
        parts = rider if name == 'bike' else views(SOURCES[name])
        k = scale if name == 'bike' else scale * EMPTY_SIZE
        frames = {}
        for direction, i in mapping.items():
            frames[direction] = parts[i]
            frames[OTHER[direction]] = parts[i].transpose(flip)
        sheet = Image.new('RGBA', (FRAME * 4, FRAME))
        for n, direction in enumerate(ORDER):
            img = frames[direction]
            img.save(f'Fahrrad-Sprites/einzeln/{name}_{NAMES[direction]}.png')
            small = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)
            sheet.alpha_composite(small, (n * FRAME + (FRAME - small.width) // 2, max(0, FRAME - FOOT - small.height)))
        sheet.save(f'public/assets/{name}.png')
        sheet.save(f'Fahrrad-Sprites/{name}.png')
        if name == 'bike_empty':
            icon = sheet.crop((0, 0, FRAME, FRAME))
            icon.crop(icon.getbbox()).save('public/assets/bike_icon.png')  # ohne leeren Rand, sonst ist es in der Leiste winzig
        print(name, 'Maßstab', round(k, 3))


if __name__ == '__main__':
    main()
