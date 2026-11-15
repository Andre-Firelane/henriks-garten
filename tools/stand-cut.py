"""Buden (feste Buden im Tierpark) aus Andres Bildern auf Weiß freistellen.

Quelle: Sprites/Bude <Sorte>.webp, 1024 × 1024, gleiche Vorlage wie der Eisstand (halbiert passen Höhe und Fußpunkt genau
zu public/assets/hd/icecream_stand.png). Weiß und heller grauer Bodenschatten, die vom Rand aus erreichbar sind, werden
durchsichtig; der Schatten bleibt als halbdurchsichtiger dunkler Fleck. Ergebnis: <sorte>_stand.png in public/assets/hd
(512), hd2 (256) und public/assets (128), dazu eine Kopie in Buden-Sprites/.
Aufruf: python tools/stand-cut.py  (danach python tools/make-webp.py .)
"""
import os
from collections import deque

import numpy as np
from PIL import Image

STANDS = {  # Ausgabe: Quelle
    'popcorn_stand': 'Sprites/Bude Popcorn.webp',
    'pretzel_stand': 'Sprites/Bude Brezeln.webp',
    'lemonade_stand': 'Sprites/Bude Limonade.webp',
    'cottoncandy_stand': 'Sprites/Bude Zuckerwatte.webp',
}
MAX_SATURATION = 28  # wie tools/remove-background.js: so bunt darf Hintergrund bzw. Schatten höchstens sein
MIN_LIGHTNESS = 150
WHITE = 246  # ab hier ganz durchsichtig
SHADOW_RGB = (20, 40, 10)  # Farbe der Schatten im Spiel
SHADOW_MAX = 120  # Deckkraft des dunkelsten Schattens


def cut(path):
    rgb = np.array(Image.open(path).convert('RGB')).astype(np.int32)
    h, w, _ = rgb.shape
    mx, mn = rgb.max(2), rgb.min(2)
    light = (mx - mn < MAX_SATURATION) & (mn > MIN_LIGHTNESS)
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        q.extend([(0, x), (h - 1, x)])
    for y in range(h):
        q.extend([(y, 0), (y, w - 1)])
    while q:
        y, x = q.popleft()
        if y < 0 or x < 0 or y >= h or x >= w or bg[y, x] or not light[y, x]:
            continue
        bg[y, x] = True
        q.extend([(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)])
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = rgb
    out[..., 3] = 255
    lum = rgb.mean(2)
    shade = np.clip((WHITE - lum) / (WHITE - MIN_LIGHTNESS), 0, 1)
    out[bg, 0], out[bg, 1], out[bg, 2] = SHADOW_RGB
    out[bg, 3] = (shade[bg] * SHADOW_MAX).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def main():
    os.makedirs('Buden-Sprites', exist_ok=True)
    for name, src in STANDS.items():
        big = cut(src)
        hd = big.resize((512, 512), Image.LANCZOS)
        hd.save(f'public/assets/hd/{name}.png')
        hd.save(f'Buden-Sprites/{name}.png')
        big.resize((256, 256), Image.LANCZOS).save(f'public/assets/hd2/{name}.png')
        big.resize((128, 128), Image.LANCZOS).save(f'public/assets/{name}.png')
    print('Buden freigestellt:', ', '.join(STANDS))


if __name__ == '__main__':
    main()
