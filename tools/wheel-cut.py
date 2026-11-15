"""Riesenrad aus Andres Bildern (Sprites/Riesenrad Rad.png, Gerüst.png, Gondel.png, 1024 × 1024 mit Transparenz) in die
Spiel-Formate bringen (doppelt so groß wie im Spiel, siehe src/world/FerrisWheel.js):
  wheel_ring.png    300 × 300, Nabe in der Mitte, Außenkreis Radius 140 (die Gondeln hängen bei 136); kreisrund gestreckt,
                    damit es sich ohne Eiern dreht
  wheel_stand.png   300 × 300, Nabe (Kugel oben) bei (150, 40), Boden unten
  wheel_gondola.png GONDOLA_W breit, Aufhänger oben in der Mitte; das Fenster wird ausgeschnitten (dort sieht man den Fahrgast)
Aufruf: python tools/wheel-cut.py  (danach python tools/make-webp.py .)
"""
from collections import deque

import numpy as np
from PIL import Image

SRC = 'Sprites/Riesenrad '
OUT = 'public/assets/'
GONDOLA_W = 80
STAND_HUB = (511, 110)  # Mitte der Kugel oben im Gerüst-Bild
STAND_GROUND = 932  # Unterkante des Sockels


def ring():
    im = Image.open(SRC + 'Rad.png').convert('RGBA')
    im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 128 else 0).getbbox())
    out = Image.new('RGBA', (300, 300))
    out.alpha_composite(im.resize((280, 280), Image.LANCZOS), (10, 10))
    out.save(OUT + 'wheel_ring.png')


def stand():
    im = Image.open(SRC + 'Gerüst.png').convert('RGBA')
    s = 260 / (STAND_GROUND - STAND_HUB[1])
    small = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    out = Image.new('RGBA', (300, 300))
    out.alpha_composite(small, (round(150 - STAND_HUB[0] * s), round(40 - STAND_HUB[1] * s)))
    out.save(OUT + 'wheel_stand.png')


def gondola():
    im = Image.open(SRC + 'Gondel.png').convert('RGBA')
    a = np.array(im)
    h, w = a.shape[:2]
    rgb = a[..., :3].astype(int)
    light = (rgb.min(2) > 185) & (rgb.max(2) - rgb.min(2) < 45)  # helles Glas (samt Spiegelungen)
    seed = (461, 512)  # Mitte des Fensters
    hole = np.zeros((h, w), bool)
    q = deque([seed])
    while q:
        y, x = q.popleft()
        if y < 0 or x < 0 or y >= h or x >= w or hole[y, x] or not light[y, x]:
            continue
        hole[y, x] = True
        q.extend([(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)])
    a[hole, 3] = 0
    ys, xs = np.where(hole)
    im = Image.fromarray(a, 'RGBA')
    box = im.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox()
    im = im.crop(box)
    s = GONDOLA_W / im.width
    im = im.resize((GONDOLA_W, round(im.height * s)), Image.LANCZOS)
    im.save(OUT + 'wheel_gondola.png')
    top, bottom = (ys.min() - box[1]) * s, (ys.max() - box[1]) * s
    print(f'Gondel {im.width}×{im.height}, Fenster von {top:.0f} bis {bottom:.0f} px unter dem Aufhänger')


ring()
stand()
gondola()
