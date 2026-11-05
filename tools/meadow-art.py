"""Aufruf: python tools/meadow-art.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Echte Bilder für die Wiese (Sprites/scenario-assets-wiese neu) an die Stelle der Platzhalter setzen: jedes Bild kommt in
die Box des Platzhalters (Wiese-Sprites/Neu, 4-fach), unten mittig, so groß es hineinpasst; der weiche Schatten des
Platzhalters bleibt. So bleiben Größe und Fußpunkt (originY in map.js) gleich. Schreibt public/assets (alte Größe),
hd/ (4-fach) und hd2/ (2-fach)."""
import os
import numpy as np
from PIL import Image

A = 'public/assets'
SRC = 'Sprites/scenario-assets-wiese neu'
REF = 'Wiese-Sprites/Neu'  # Platzhalter aus tools/meadow-placeholders.py
F = 4
OUT = {'': 1, 'hd': 4, 'hd2': 2}

src = lambda n: f'{SRC}/Wald_neu{"" if n == 0 else f"-{n}"}.png'
ART = {
    'bee': 0, 'beehive': 2, 'birdhouse': 3, 'cabbages': 4, 'clothesline': 5, 'corn': 6, 'dandelion_blown': 8, 'duck': 10,
    'duck_fly0': 11, 'duck_fly1': 12, 'hay_bale': 16, 'lily_pads': 17, 'mailbox': 18, 'meadow_bench': 19, 'meadow_well': 21,
    'pumpkins': 22, 'scarecrow': 23, 'sunflowers': 24, 'willow': 25, 'windmill': 26, 'windmill_sails': 27, 'woodpile': 28,
}
CENTER = {'windmill_sails'}  # mittig statt unten (dreht sich um die Bildmitte)


def crop(im):
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())


def place(new, ref, center=False):
    a = np.asarray(ref)
    shadow = (a[..., 3] < 100) & (a[..., 0] < 60) & (a[..., 1] < 80)  # weicher dunkelgrüner Schatten
    body = (a[..., 3] > 150) & ~shadow
    ys, xs = np.nonzero(body)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    k = min((x1 - x0) / new.width, (y1 - y0) / new.height)
    new = new.resize((max(1, round(new.width * k)), max(1, round(new.height * k))), Image.LANCZOS)
    out = Image.fromarray(np.where(shadow[..., None], a, 0).astype(np.uint8), 'RGBA')
    x = round((x0 + x1 - new.width) / 2)
    y = round((y0 + y1 - new.height) / 2) if center else y1 - new.height
    out.alpha_composite(new, (x, y))
    return out


for key, n in ART.items():
    if os.environ.get('ONLY') not in (None, key):
        continue
    ref = Image.open(f'{REF}/{key}.png').convert('RGBA')
    big = place(crop(Image.open(src(n)).convert('RGBA')), ref, key in CENTER)
    w, h = big.width // F, big.height // F
    for sub, f in OUT.items():
        big.resize((w * f, h * f), Image.LANCZOS).save(os.path.join(A, sub, key + '.png'), optimize=True)
    print(key, w, 'x', h)
