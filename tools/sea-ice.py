# Zugefrorenes Meer der Eiswelt (nachts, Kachel ɨ): helle, glatte Eisfläche statt umgefärbtem Wasser, in drei Varianten
# (sea_ice0..2, siehe seaIce in levels.js). Rautenform wie die Wasserkachel (water.png), in public/assets (64 x 32),
# hd/ (4-fach) und hd2/ (2-fach). Zur Kante hin bleibt alles ruhig, damit die Kacheln ohne Nähte aneinanderpassen.
# Aufruf: python tools/sea-ice.py
import math
import random
from PIL import Image, ImageDraw, ImageFilter

W, H = 64, 32
MASK = {1: 'public/assets/water.png', 2: 'public/assets/hd2/water.png', 4: 'public/assets/hd/water.png'}
BASE = (220, 239, 250)  # überall gleich (keine Verläufe, keine Tönung je Variante: sonst sieht man die Kacheln)


def tile(variant, f):
    rnd = random.Random(variant * 7919 + 13)
    k = f * 4  # Kantenglättung
    w, h = W * k, H * k
    img = Image.new('RGBA', (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = BASE + (255,)
    d = ImageDraw.Draw(img, 'RGBA')
    inner = lambda x, y: abs(x / w - 0.5) * 2 + abs(y / h - 0.5) * 2 < 0.72  # nicht zu nah an der Kante
    # Glanz: zwei, drei breite, weiche Streifen schräg über das Eis
    gloss = Image.new('RGBA', (w, h), (255, 255, 255, 0))  # durchsichtiges Weiß: beim Weichzeichnen kein grauer Rand
    g = ImageDraw.Draw(gloss)
    for _ in range(rnd.randint(2, 3)):
        x0 = rnd.uniform(0.1, 0.7) * w
        y0 = rnd.uniform(0.25, 0.6) * h
        g.line([(x0, y0), (x0 + w * 0.25, y0 - h * 0.25)], fill=(255, 255, 255, 150), width=round(k * rnd.uniform(1.5, 3)))
    img.alpha_composite(gloss.filter(ImageFilter.GaussianBlur(k * 1.2)))
    # Raureif: ein paar sehr helle Flecken
    for _ in range(6):
        x, y = rnd.uniform(0.2, 0.8) * w, rnd.uniform(0.25, 0.75) * h
        if inner(x, y):
            r = rnd.uniform(0.4, 1.0) * k
            d.ellipse([x - r * 2, y - r, x + r * 2, y + r], fill=(250, 253, 255, 160))
    # feine Risse (nur in der Mitte): ein Zickzack mit einem kleinen Seitenast
    if variant != 1:
        x, y = rnd.uniform(0.35, 0.5) * w, rnd.uniform(0.35, 0.5) * h
        pts = [(x, y)]
        for _ in range(4):
            a = rnd.uniform(-0.6, 0.6) + (0.45 if variant == 0 else -0.45)
            x, y = x + math.cos(a) * 3.2 * k, y + math.sin(a) * 1.6 * k
            if not inner(x, y):
                break
            pts.append((x, y))
        if len(pts) > 1:
            d.line(pts, fill=(150, 190, 215, 170), width=max(1, round(k * 0.35)))
            mx, my = pts[len(pts) // 2]
            d.line([(mx, my), (mx + 1.5 * k, my + 1.4 * k)], fill=(150, 190, 215, 140), width=max(1, round(k * 0.3)))
    # Rautenform genau wie die Wasserkachel derselben Auflösung (scharfer Rand, sonst sieht man Nähte zwischen den Kacheln)
    img = img.resize((W * f, H * f), Image.LANCZOS)
    img.putalpha(Image.open(MASK[f]).getchannel('A'))
    return img


for variant in range(3):
    for d, f in (('public/assets', 1), ('public/assets/hd', 4), ('public/assets/hd2', 2)):
        tile(variant, f).save(f'{d}/sea_ice{variant}.png')
    print(f'sea_ice{variant}')
