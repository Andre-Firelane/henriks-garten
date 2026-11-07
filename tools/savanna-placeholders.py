"""Aufruf: python tools/savanna-placeholders.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Platzhalter für die aufgepeppte Savanne (bis echte Bilder da sind), gezeichnet wie die von Wiese und Wald
(tools/sprite_draw.py), mit dem endgültigen Dateinamen in allen Auflösungen; Vorlagen zum Nachmalen in Savanne-Sprites/Neu.
Je Wetterphase eigene Bilder, wo sich etwas ändert (_rain: Starkregen, _dry: Trockenzeit; siehe objectKeys in levels.js).
ONLY=name: nur dieses eine Bild."""
import math, re, random
import numpy as np
from PIL import Image
import sprite_draw
from sprite_draw import Pic, dark, light

sprite_draw.EXPORT = 'Savanne-Sprites/Neu'
sprite_draw.SKIP = set(re.findall(r"'(\w+)':", open('tools/savanna-art.py', encoding='utf-8').read()))  # schon echte Bilder (nur noch Vorlage)

rnd = random.Random(21)
BARK = (110, 80, 54, 255)
ROCK = (178, 150, 116, 255)
CLAY = (176, 104, 64, 255)
BONE = (236, 226, 200, 255)


# hohes Gras: ein Büschel langer, gebogener Halme. Fuß bei (32, 48); Farben je Wetterphase
def tall_grass(name, cols, tips=None):
    r = random.Random(4)
    p = Pic(64, 56)
    p.shadow(32, 48, 22, 5)
    blades = []
    for i in range(22):
        x = 32 + r.uniform(-18, 18)
        h = r.uniform(26, 44) * (1 - abs(x - 32) / 60)
        lean = r.uniform(-8, 8) + (x - 32) * 0.35
        blades.append((x, h, lean, r.choice(cols)))
    for x, h, lean, col in sorted(blades, key=lambda b: -b[1]):
        tip = (x + lean, 48 - h)
        p.poly([(x - 1.6, 48), (x + 1.6, 48), (x + lean * 0.5 + 0.6, 48 - h * 0.55), tip, (x + lean * 0.5 - 0.6, 48 - h * 0.55)], col, ow=0.5)
        if tips:
            p.ell(tip[0], tip[1] + 2, 1.2, 2.6, tips, ol=False)
    p.save(name)


# Busch der Savanne: rundliche Blattballen auf kurzen Ästen. Fuß bei (28, 40); flowers: Blüten (Starkregen)
def bush(name, col, flowers=None):
    r = random.Random(8)
    p = Pic(56, 48)
    p.shadow(28, 40, 20, 5)
    p.line([(27, 40), (24, 30)], BARK, 1)
    p.line([(29, 40), (33, 30)], BARK, 1)
    for cx, cy, rx in [(16, 30, 9), (40, 30, 9), (28, 22, 11), (21, 20, 7), (36, 21, 7), (28, 32, 10)]:
        p.ell(cx, cy, rx, rx * 0.72, col)
        p.ell(cx - rx * 0.3, cy - rx * 0.25, rx * 0.4, rx * 0.25, light(col, 0.18), ol=False)
    if flowers:
        for _ in range(9):
            x, y = r.uniform(12, 44), r.uniform(15, 36)
            for i in range(5):
                a = i / 5 * math.tau
                p.ell(x + math.cos(a) * 1.3, y + math.sin(a) * 1, 1.1, 0.9, flowers, ol=False)
            p.ell(x, y, 0.6, 0.6, (250, 230, 120, 255), ol=False)
    p.save(name)


# trockener Strauch, im Starkregen frisch ausgetrieben: das vorhandene dry_bush mit grünen Blättchen
def shrub_rain():
    name = 'savanna_shrub_rain'
    if not sprite_draw.wanted(name):
        return
    base = Image.open(f'{sprite_draw.A}/hd/dry_bush.png').convert('RGBA')  # 4-fach, wie wir zeichnen (8-fach: hochskalieren)
    w, h = base.width // 4, base.height // 4
    p = Pic(w, h)
    p.im.alpha_composite(base.resize(p.im.size, Image.LANCZOS))
    r = random.Random(3)
    a = np.asarray(base.resize((w, h)).getchannel('A'))
    pts = [(x, y) for y in range(h) for x in range(w) if a[y, x] > 200 and y < h * 0.75]
    for x, y in r.sample(pts, min(26, len(pts))):
        p.ell(x + 0.5, y + 0.5, 1.6, 1.1, r.choice([(96, 160, 70, 255), (120, 180, 80, 255)]), ow=0.3)
    p.save(name)


# Termitenhügel: hoher, rotbrauner Lehmbau mit Türmchen. Fuß bei (20, 64)
def termite():
    p = Pic(40, 72)
    p.shadow(20, 64, 15, 4)
    p.poly([(6, 64), (8, 40), (12, 22), (16, 8), (20, 4), (23, 10), (26, 26), (28, 18), (31, 22), (32, 42), (34, 64)], CLAY)
    p.poly([(20, 64), (20, 6), (23, 10), (26, 26), (28, 18), (31, 22), (32, 42), (34, 64)], dark(CLAY, 0.85), ol=False)
    for y in range(14, 62, 6):
        p.line([(10 + (64 - y) * 0.05, y), (14, y + 1)], dark(CLAY, 0.7), 0.5, ol=False)
    for x, y in [(15, 30), (24, 44), (12, 52)]:
        p.ell(x, y, 1.4, 1.8, dark(CLAY, 0.45), ol=False)
    p.save('savanna_termite')


# Elefantenfriedhof: nur Rahmen für die echten Bilder (Sprites/Elefanten*.jpg, Felsen1.jpg, siehe tools/savanna-art.py):
# ein heller Fleck in der Größe, die das Bild im Spiel bekommt, mit Schatten am Fuß
def frame(name, w, h, col):
    p = Pic(w, h)
    p.ell(w / 2, h * 0.52, w * 0.42, h * 0.38, col)
    p.shadow(w / 2, h * 0.84, w * 0.4, h * 0.1)
    p.save(name)


# dunkler, trostloser Boden des Elefantenfriedhofs: der trockene Savannenboden graubraun und dunkler (2-fache Kacheln,
# nur als Baustein für grave_patch)
def grave_tiles():
    out = []
    for i in range(3):
        a = np.asarray(Image.open(f'{sprite_draw.A}/hd2/sdry{i}.png').convert('RGBA')).astype(float)
        lum = 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
        k = np.clip(lum / lum[a[..., 3] > 128].mean(), 0.6, 1.4)[..., None]
        a[..., :3] = np.clip(np.array((118, 104, 88)) * (1 + (k - 1) * 1.3), 0, 255)
        out.append(Image.fromarray(a.astype(np.uint8), 'RGBA'))
    return out


# Boden des Elefantenfriedhofs als ein großer, flacher Fleck mit weichem, unregelmäßigem Rand (liegt über dem normalen
# Boden, siehe gravePatch in levels.js): aus den dunklen Bodenkacheln (grave_tiles) zusammengesetzt. Bildmitte über
# der Kachel aus gravePatch in levels.js (33, 4.5); rx/ry: Halbmesser in Kacheln zur Kartenmitte hin. Der Friedhof liegt in
# der Ecke oben rechts: zum rechten (tx) und oberen Kartenrand (ty) hin läuft der Boden nicht aus, sondern reicht bis an
# die Kante (edge_u, edge_v: so weit liegt der Kartenrand von der Mitte, in Kacheln). Halbe HD-Auflösung (2-fach, siehe
# SCALE in hd.js)
GRAVE_PATCH = {'rx': 5.8, 'ry': 5.4, 'w': 780, 'h': 410, 'edge_u': 39.5 - 33, 'edge_v': -0.5 - 4.5}


def grave_patch():
    from PIL import ImageFilter
    name = 'savanna_grave_patch'
    if not sprite_draw.wanted(name):
        return
    f = 2
    W, H = GRAVE_PATCH['w'] * f, GRAVE_PATCH['h'] * f
    tiles = grave_tiles()  # 128 x 64 (2-fach)
    im = Image.new('RGBA', (W, H))
    r = random.Random(9)
    n = 10
    for tyy in range(-n, n + 1):
        for txx in range(-n, n + 1):
            x = W / 2 + (txx - tyy) * 32 * f
            y = H / 2 + (txx + tyy) * 16 * f
            t = tiles[r.randrange(3)]
            im.alpha_composite(t, (int(x - t.width / 2), int(y - t.height / 2)))
    # weiche, leicht wellige Ellipse in Kachel-Koordinaten, nur zur Kartenmitte hin (links: u < 0, unten: v > 0);
    # zur Ecke hin voll bis an den Kartenrand, dort scharf abgeschnitten wie die Karte
    ys, xs = np.mgrid[0:H, 0:W]
    a = (xs - W / 2) / (32 * f)
    b = (ys - H / 2) / (16 * f)
    u, v = (a + b) / 2, (b - a) / 2
    ang = np.arctan2(v, u)
    wobble = 1 + 0.08 * np.sin(ang * 3 + 0.7) + 0.05 * np.sin(ang * 7 + 2.1)
    d = np.hypot(np.minimum(u, 0) / GRAVE_PATCH['rx'], np.maximum(v, 0) / GRAVE_PATCH['ry']) / wobble
    alpha = np.clip((1 - d) / 0.28, 0, 1)
    alpha = alpha * alpha * (3 - 2 * alpha)
    alpha[(u > GRAVE_PATCH['edge_u']) | (v < GRAVE_PATCH['edge_v'])] = 0
    out = np.asarray(im).astype(float)
    out[..., 3] = out[..., 3] * alpha
    big = Image.fromarray(out.astype(np.uint8))
    import os
    for sub, k in {'': 1, 'hd': 2, 'hd2': 1}.items():
        big.resize((GRAVE_PATCH['w'] * k, GRAVE_PATCH['h'] * k), Image.LANCZOS).save(os.path.join(sprite_draw.A, sub, name + '.png'), optimize=True)
    if sprite_draw.EXPORT:
        big.save(os.path.join(sprite_draw.EXPORT, name + '.png'), optimize=True)
    print(name, GRAVE_PATCH['w'], 'x', GRAVE_PATCH['h'])


tall_grass('savanna_tallgrass', [(176, 168, 82, 255), (156, 160, 70, 255), (196, 180, 96, 255)], tips=(214, 196, 120, 255))
tall_grass('savanna_tallgrass_rain', [(98, 156, 62, 255), (120, 172, 70, 255), (84, 138, 56, 255)])
tall_grass('savanna_tallgrass_dry', [(214, 186, 116, 255), (198, 168, 100, 255), (226, 200, 132, 255)], tips=(236, 214, 150, 255))
bush('savanna_bush', (104, 138, 66, 255))
bush('savanna_bush_rain', (88, 150, 64, 255), flowers=(236, 120, 170, 255))
shrub_rain()
termite()
frame('savanna_skull', 80, 64, BONE)
frame('savanna_ribs', 88, 64, BONE)
frame('savanna_pelvis', 64, 52, BONE)
frame('savanna_bones', 56, 40, BONE)
grave_patch()
