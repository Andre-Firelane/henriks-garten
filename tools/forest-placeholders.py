"""Aufruf: python tools/forest-placeholders.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Platzhalter für den aufgepeppten Wald (bis echte Bilder da sind), gezeichnet wie die der Wiese (tools/sprite_draw.py),
mit dem endgültigen Dateinamen in allen Auflösungen; Vorlagen zum Nachmalen in Wald-Sprites/Neu.
Dazu abgeleitete Bilder: fließendes Waldwasser (Dschungelfluss umgefärbt), Moos-Boden (Waldboden umgefärbt), Wasserfall
und Felsklippe (Kopien der Dschungelbilder, damit der Wald das Dschungel-Paket nicht laden muss).
Bilder, für die es schon echte gibt (ART in tools/forest-art.py), schreibt es nur noch als Vorlage.
ONLY=name: nur dieses eine Bild."""
import os, re, math, random, shutil
import numpy as np
from PIL import Image, ImageDraw
import sprite_draw
from sprite_draw import A, OUT, Pic, dark, light, wanted

sprite_draw.EXPORT = 'Wald-Sprites/Neu'
sprite_draw.SKIP = set(re.findall(r"'(\w+)':", open('tools/forest-art.py', encoding='utf-8').read()))  # schon echte Bilder (nur noch Vorlage)

rnd = random.Random(11)
STONE = (138, 134, 124, 255)
MOSS = (96, 138, 54, 255)
MOSS2 = (132, 172, 72, 255)
LEAF = (58, 104, 50, 255)
LEAF2 = (80, 128, 60, 255)
BARK = (112, 78, 50, 255)
WOOD = (150, 98, 58, 255)
WOOD2 = (176, 122, 72, 255)


def moss_on(p, pts):
    """Moospolster mit hellen Tupfen"""
    p.poly(pts, MOSS, ow=0.6)
    xs = [x for x, _ in pts]
    ys = [y for _, y in pts]
    n = 0
    while n < int((max(xs) - min(xs)) * 0.6):
        x = rnd.uniform(min(xs) + 2, max(xs) - 2)
        y = rnd.uniform(min(ys) + 1, max(ys) - 1)
        if inside(x, y, pts) and inside(x - 1.5, y, pts) and inside(x + 1.5, y, pts) and inside(x, y - 1.5, pts) and inside(x, y + 1.5, pts):
            p.ell(x, y, 1.2, 0.8, MOSS2, ol=False)
        n += 1


def inside(x, y, pts):
    """liegt der Punkt im Vieleck?"""
    hit = False
    for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            hit = not hit
    return hit


# bemooster Baumstumpf mit Jahresringen und zwei Pilzen. Fuß bei (20, 34)
def stump():
    p = Pic(40, 40)
    p.poly([(7, 18), (7, 32), (12, 35), (28, 35), (33, 32), (33, 18)], BARK)
    for x in (11, 17, 24, 29):
        p.line([(x, 21), (x + 0.5, 33)], dark(BARK, 0.75), 0.5, ol=False)
    p.ell(20, 18, 13, 5, (214, 172, 112, 255), ol=dark(BARK))
    for r in (9, 6, 3):
        p.ell(20, 18, r, r * 0.38, (214, 172, 112, 255), ol=(170, 124, 72, 255), ow=0.35)
    moss_on(p, [(7, 24), (12, 22), (16, 26), (14, 32), (7, 31)])
    for x, y in [(30, 33), (34, 34)]:
        p.line([(x, y), (x, y - 3)], (236, 226, 200, 255), 0.9)
        p.ell(x, y - 4, 2.4, 1.6, (196, 70, 50, 255), ow=0.4)
    p.shadow(20, 34, 16, 4.5)
    p.save('forest_stump')


# bemooster liegender Stamm (entlang tx, Schnittfläche vorne rechts). Fuß bei (32, 38)
def mossy_log():
    p = Pic(64, 48)
    p.shadow(32, 38, 28, 7)
    a, b = (12, 20), (48, 38)  # Mitte der Enden
    r = 7
    p.poly([(a[0] - 2, a[1] - r), (b[0] - 2, b[1] - r), (b[0] + 2, b[1] + r - 1), (a[0] + 2, a[1] + r - 1)], BARK)
    for t in (0.25, 0.5, 0.75):
        x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
        p.line([(x - 1, y - 4), (x + 4, y + 3)], dark(BARK, 0.75), 0.5, ol=False)
    moss_on(p, [(a[0] - 2, a[1] - r), (b[0] - 2, b[1] - r), (b[0], b[1] - 2), (36, 30), (26, 27), (16, 21), (a[0], a[1] - 2)])
    p.ell(b[0], b[1], 5.5, r, (214, 172, 112, 255), ol=dark(BARK))
    for k in (3.8, 2):
        p.ell(b[0], b[1], k * 0.8, k, (214, 172, 112, 255), ol=(170, 124, 72, 255), ow=0.35)
    p.save('forest_mossy_log')


def leaves(p, cx, cy, n=4, col=LEAF2, size=5):
    for i in range(n):
        side = -1 if i % 2 else 1
        x = cx + side * rnd.uniform(1, 4)
        p.poly([(x, cy), (x + side * size, cy - 3), (x + side * size * 1.4, cy - 0.5), (x + side * size * 0.6, cy + 1)], col, ow=0.5)


# Glockenblumen (blau, hängende Glocken). Fuß bei (20, 24)
def bluebells():
    p = Pic(40, 32)
    p.shadow(20, 25, 13, 3)
    leaves(p, 20, 25, 5)
    for x0, h, bend in [(12, 15, 4), (21, 19, 5), (28, 14, 3)]:
        top = (x0 + bend, 25 - h)
        p.line([(x0, 25), (x0 + bend * 0.3, 25 - h * 0.6), top], (90, 140, 70, 255), 0.6)
        for i in range(3):
            t = 0.45 + i * 0.22
            x = x0 + bend * t * 1.1
            y = 25 - h * (0.6 + t * 0.4) + 2
            p.poly([(x - 1.6, y), (x + 1.6, y), (x + 2.2, y + 3.6), (x - 2.2, y + 3.6)], (96, 120, 220, 255), ow=0.4)
    p.save('forest_bluebells')


# Fingerhut (hohe lila Blütenstände). Fuß bei (20, 40)
def foxglove():
    p = Pic(40, 48)
    p.shadow(20, 41, 12, 3)
    leaves(p, 20, 41, 6, size=7)
    for x, h in [(15, 30), (24, 34)]:
        p.line([(x, 41), (x, 41 - h)], (90, 140, 70, 255), 0.8)
        for i in range(7):
            y = 41 - h + 3 + i * 3.4
            side = -1 if i % 2 else 1
            p.ell(x + side * 1.6, y, 2, 1.6, (186, 96, 190, 255), ol=(120, 50, 130, 255), ow=0.4)
            p.ell(x + side * 1.8, y + 0.5, 0.6, 0.5, (245, 210, 245, 255), ol=False)
        p.ell(x, 41 - h + 1, 1, 1.4, (120, 170, 90, 255), ow=0.3)
    p.save('forest_foxglove')


def star_flowers(name, petal, center, ol):
    p = Pic(40, 32)
    p.shadow(20, 25, 13, 3)
    leaves(p, 20, 25, 6, size=4)
    for x, y in [(11, 19), (19, 14), (27, 18), (16, 22), (25, 23), (31, 21)]:
        p.line([(x, y), (x + 0.5, y + 5)], (90, 140, 70, 255), 0.5, ol=False)
        for i in range(5):
            a = i / 5 * math.tau - math.pi / 2
            p.ell(x + math.cos(a) * 1.8, y + math.sin(a) * 1.3, 1.5, 1.1, petal, ol=ol, ow=0.3)
        p.ell(x, y, 0.8, 0.7, center, ol=False)
    p.save(name)


# Holunder (weiße Dolden) bzw. Haselstrauch (Nüsse): mittelgroße Sträucher. Fuß bei (32, 56)
def shrub(name, col, fruit):
    p = Pic(64, 64)
    p.shadow(32, 56, 24, 6)
    p.line([(30, 56), (28, 44)], BARK, 1.2)
    p.line([(34, 56), (37, 44)], BARK, 1.2)
    for cx, cy, r in [(18, 40, 12), (46, 40, 12), (32, 30, 15), (22, 26, 10), (42, 25, 10), (32, 44, 13)]:
        p.ell(cx, cy, r, r * 0.82, col)
    for cx, cy, r in [(26, 24, 6), (40, 22, 5), (20, 36, 5)]:
        p.ell(cx, cy, r, r * 0.7, light(col, 0.18), ol=False)
    for _ in range(9):
        x, y = rnd.uniform(12, 52), rnd.uniform(18, 48)
        if fruit == 'umbel':
            for i in range(7):
                a = i / 7 * math.tau
                p.ell(x + math.cos(a) * 1.8, y + math.sin(a) * 0.9, 0.9, 0.7, (246, 240, 214, 255), ol=False)
            p.ell(x, y, 0.9, 0.7, (236, 226, 180, 255), ol=False)
        else:
            for dx in (-1.4, 1.4):
                p.ell(x + dx, y, 1.5, 1.7, (176, 128, 70, 255), ol=(110, 74, 40, 255), ow=0.4)
            p.poly([(x - 2.6, y - 1.2), (x + 2.6, y - 1.2), (x, y - 3.2)], (120, 160, 80, 255), ol=False)
    p.save(name)


# Höhle: Felswand mit dunklem Eingang, oben Moos. Fuß bei (96, 140)
def cave():
    p = Pic(192, 160)
    p.shadow(96, 140, 86, 14)
    wall = (126, 120, 110, 255)
    p.poly([(8, 140), (4, 96), (18, 52), (52, 22), (96, 12), (140, 22), (174, 52), (188, 96), (184, 140), (96, 150)], wall)
    for cx, cy, rx, ry in [(40, 60, 26, 20), (150, 64, 26, 22), (96, 34, 40, 20), (24, 112, 18, 24), (168, 112, 18, 24)]:
        p.ell(cx, cy, rx, ry, light(wall, 0.08), ol=dark(wall, 0.75), ow=0.6)
    shade = Image.new('RGBA', p.im.size)  # rechte Hälfte im Schatten (darübergelegt, nicht ersetzt)
    ImageDraw.Draw(shade).polygon(p.pts([(96, 150), (96, 12), (140, 22), (174, 52), (188, 96), (184, 140)]), fill=(0, 0, 0, 40))
    shade.putalpha(Image.fromarray(np.minimum(np.asarray(shade.getchannel('A')), np.asarray(p.im.getchannel('A')))))
    p.im.alpha_composite(shade)
    p.poly([(62, 146), (60, 104), (72, 78), (96, 68), (120, 78), (132, 104), (130, 146), (96, 152)], (34, 30, 36, 255), ol=dark(wall, 0.5), ow=1.4)
    p.poly([(70, 146), (70, 108), (80, 88), (96, 82), (112, 88), (122, 108), (122, 146), (96, 150)], (18, 16, 22, 255), ol=False)
    moss_on(p, [(18, 54), (52, 22), (96, 12), (140, 22), (174, 54), (150, 50), (130, 44), (110, 34), (88, 38), (66, 34), (44, 48)])
    for x, y, r in [(46, 140, 7), (148, 142, 8), (60, 148, 4), (136, 150, 5)]:
        p.ell(x, y, r, r * 0.7, light(wall, 0.12))
    p.save('forest_cave')


# Hochstand: vier Pfosten, Plattform mit kleiner Kanzel und Dach, Leiter vorne. Fuß bei (40, 160), Plattform bei y = 88
def stand():
    p = Pic(80, 176)
    p.shadow(40, 158, 30, 9)
    pole = (120, 84, 52, 255)
    for x0, x1, top in [(20, 24, 84), (56, 60, 84)]:  # hintere Pfosten
        p.line([(x0, 150), (x1, top)], dark(pole, 0.85), 2)
    p.poly([(10, 92), (40, 78), (70, 92), (40, 106)], WOOD2)  # Plattform
    p.poly([(10, 92), (40, 106), (40, 110), (10, 96)], dark(WOOD2, 0.75), ol=False)
    p.poly([(40, 106), (70, 92), (70, 96), (40, 110)], dark(WOOD2, 0.65), ol=False)
    # Kanzel hinten (Rück- und Seitenwände) und Dach
    p.poly([(12, 92), (12, 62), (40, 48), (40, 78)], dark(WOOD, 0.9))
    p.poly([(40, 78), (40, 48), (68, 62), (68, 92)], dark(WOOD, 0.8))
    p.poly([(4, 64), (40, 40), (76, 64), (40, 50)], (90, 104, 70, 255))
    p.poly([(4, 64), (40, 50), (76, 64), (76, 68), (40, 54), (4, 68)], dark((90, 104, 70, 255), 0.7), ol=False)
    for x0, x1 in [(14, 12), (66, 68)]:  # vordere Pfosten
        p.line([(x0, 160 - 6), (x1, 92)], pole, 2.2)
    p.line([(10, 92), (10, 80)], WOOD2, 1)  # Geländer vorne (niedrig, Henrik steht dahinter)
    p.line([(70, 92), (70, 80)], WOOD2, 1)
    p.line([(10, 82), (40, 96), (70, 82)], WOOD2, 1)
    # Leiter vom Boden zur Plattform
    for dx in (-6, 6):
        p.line([(40 + dx, 160), (40 + dx * 0.8, 104)], WOOD2, 1.4)
    for y in range(110, 160, 8):
        k = (y - 104) / 56
        w = 6 * (0.8 + 0.2 * k)
        p.line([(40 - w, y), (40 + w, y)], WOOD2, 1, ol=dark(WOOD2, 0.6))
    p.save('forest_stand')


# Fledermaus (Wolfsnacht, an der Höhle): zwei Flügelstellungen
def bats():
    for i, up in enumerate((True, False)):
        p = Pic(20, 12)
        body = (60, 50, 70, 255)
        wing = (80, 66, 92, 255)
        if up:
            p.poly([(10, 7), (2, 1), (4, 6), (1, 8), (8, 8)], wing, ow=0.4)
            p.poly([(10, 7), (18, 1), (16, 6), (19, 8), (12, 8)], wing, ow=0.4)
        else:
            p.poly([(10, 6), (2, 10), (4, 7), (1, 6), (8, 5)], wing, ow=0.4)
            p.poly([(10, 6), (18, 10), (16, 7), (19, 6), (12, 5)], wing, ow=0.4)
        p.ell(10, 6.5, 2.2, 2.6, body, ow=0.4)
        p.poly([(8.6, 4.4), (9.2, 2.6), (9.8, 4.2)], body, ol=False)
        p.poly([(10.2, 4.2), (10.8, 2.6), (11.4, 4.4)], body, ol=False)
        p.save(f'forest_bat{i}')


# kleiner Singvogel (Rotkehlchen, schaut nach links): sitzend und im Flug mit zwei Flügelstellungen
def birds():
    back, breast, beak = (122, 96, 70, 255), (230, 120, 60, 255), (60, 50, 40, 255)
    p = Pic(16, 14)
    p.poly([(11, 9), (15, 12), (14, 13), (10, 11)], dark(back, 0.85), ow=0.4)
    p.ell(9, 9, 4.6, 3.6, back, ow=0.5)
    p.ell(6.5, 9.5, 2.8, 2.6, breast, ol=False)
    p.ell(5.5, 6, 2.6, 2.4, back, ow=0.5)
    p.ell(4.6, 6.8, 1.6, 1.4, breast, ol=False)
    p.poly([(3.2, 6), (1.2, 6.5), (3.2, 7)], beak, ol=False)
    p.ell(4.8, 5.4, 0.55, 0.55, (20, 20, 20, 255), ol=False)
    p.line([(8, 12.4), (8, 13.6)], beak, 0.4, ol=False)
    p.line([(10, 12.4), (10, 13.6)], beak, 0.4, ol=False)
    p.save('forest_bird')
    for i, up in enumerate((True, False)):
        f = Pic(18, 14)
        f.poly([(12, 8), (17, 7), (16, 9), (12, 9.5)], dark(back, 0.85), ow=0.4)
        f.ell(9, 8.5, 4.6, 2.8, back, ow=0.5)
        f.ell(7, 9.4, 2.6, 1.6, breast, ol=False)
        f.ell(5, 7, 2.3, 2.1, back, ow=0.5)
        f.ell(4.2, 7.8, 1.3, 1.1, breast, ol=False)
        f.poly([(2.8, 7), (1, 7.4), (2.8, 7.8)], beak, ol=False)
        f.ell(4.4, 6.4, 0.5, 0.5, (20, 20, 20, 255), ol=False)
        wing = [(7, 8), (12, 8), (11, 1.5), (8, 2.5)] if up else [(7, 9), (12, 9), (12, 13.5), (8.5, 13)]
        f.poly(wing, light(back, 0.15), ow=0.4)
        f.save(f'forest_bird_fly{i}')


# umgestürzter Baumstamm als Brücke über zwei Kacheln Wasser (entlang ty: hinten oben rechts der Wurzelteller, vorne
# unten links die Schnittfläche); die Bildmitte liegt über der Mitte der Brücke. Entlang tx wird er gespiegelt
def log_bridge():
    p = Pic(128, 88)
    dx, dy = -0.894, 0.447  # entlang ty
    nx, ny = 0.447, 0.894  # quer dazu (nach vorne unten)
    back, front = (107, 22), (21, 66)
    P = lambda c, k: (c[0] + nx * k, c[1] + ny * k)
    p.shadow(64, 52, 46, 10)
    p.ell(back[0] + 6, back[1] - 3, 14, 13, (74, 52, 36, 255))  # Wurzelteller
    for i in range(8):
        a = i / 8 * math.tau
        p.line([(back[0] + 6, back[1] - 3), (back[0] + 6 + math.cos(a) * 15, back[1] - 3 + math.sin(a) * 14)], (58, 40, 26, 255), 1, ol=False)
    p.poly([P(back, -8), P(front, -8), P(front, 8), P(back, 8)], (122, 84, 52, 255))
    p.line([P(back, -4.5), P(front, -4.5)], (154, 112, 72, 255), 2, ol=False)  # Lichtkante oben
    for t in [i / 11 for i in range(1, 11)]:  # Rindenfurchen
        c = (back[0] + (front[0] - back[0]) * t, back[1] + (front[1] - back[1]) * t)
        p.line([P(c, -2), P((c[0] + 3, c[1] + 2), 5)], (88, 60, 38, 255), 0.6, ol=False)
    for t in (0.15, 0.4, 0.62, 0.85):  # Moospolster oben
        c = (back[0] + (front[0] - back[0]) * t, back[1] + (front[1] - back[1]) * t)
        cx, cy = P(c, -6)
        p.ell(cx, cy, 7, 3, MOSS, ow=0.5)
        p.ell(cx - 1.5, cy - 0.8, 2, 1, MOSS2, ol=False)
    p.ell(front[0], front[1], 7, 9, (214, 172, 112, 255), ol=(74, 52, 36, 255), ow=1.2)  # Schnittfläche
    for k in (5, 2.6):
        p.ell(front[0], front[1], k * 0.78, k, (214, 172, 112, 255), ol=(170, 124, 72, 255), ow=0.35)
    p.save('forest_log_bridge')


# Felsen im Fluss: zwei, drei nasse Steine, unten dunkel und glänzend. Fuß bei (32, 40)
def river_rock():
    p = Pic(64, 52)
    for cx, cy, rx, ry in [(25, 33, 11, 9), (41, 35, 9, 7), (33, 28, 12, 10)]:
        p.ell(cx, cy, rx, ry, STONE, ow=0.8)
        p.ell(cx - rx * 0.3, cy - ry * 0.45, rx * 0.4, ry * 0.22, light(STONE, 0.4), ol=False)  # Glanz
    # nach unten hin nass und dunkler (weich), unter der Wasserlinie abgeschnitten
    a = np.asarray(p.im).astype(float)
    ys = np.arange(a.shape[0])[:, None] / 8
    k = np.clip((ys - 28) / 10, 0, 1) * 0.45
    a[..., :3] *= (1 - k)[..., None]
    a[..., 2] += k[:, 0][:, None] * 18
    a[int(41 * 8):, :, 3] = 0
    p.im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    p.save('forest_river_rock')


# Schaum um einen Felsen im Fluss (flach auf dem Wasser, eine Kachel): zwei Bilder im Wechsel
def foam():
    from PIL import ImageFilter
    for i in range(2):
        name = f'forest_foam{i}'
        if not wanted(name):
            continue
        w, h, k = 80, 44, 8
        r = random.Random(20 + i)
        im = Image.new('RGBA', (w * k, h * k))
        d = ImageDraw.Draw(im)
        for _ in range(70):  # Schaumbläschen auf einem Ring um die Mitte, hinten dünner
            a = r.uniform(0, math.tau)
            rr = r.uniform(0.75, 1.15)
            x = w / 2 + math.cos(a) * 26 * rr
            y = h / 2 + 2 + math.sin(a) * 13 * rr
            s = r.uniform(1.2, 3.2) * (0.6 if math.sin(a) < 0 else 1)
            d.ellipse([(x - s) * k, (y - s * 0.6) * k, (x + s) * k, (y + s * 0.6) * k], fill=(255, 255, 255, r.randint(170, 240)))
        im = im.filter(ImageFilter.GaussianBlur(k * 0.4))
        sprite_draw.save_all(im, name, w, h)


# Holzbrücke über den Fluss, wie sie das Spiel zeichnet (drawBridges in GardenScene, bridgeStyle 'wood'): drei Kacheln
# entlang tx, Deck im Bogen, Pfosten und Geländer hinten und vorne. Nur als Vorlage zum Nachmalen (Wald-Sprites/Neu);
# im Spiel wird sie weiter gezeichnet
def wood_bridge():
    hexc = lambda v: ((v >> 16) & 255, (v >> 8) & 255, v & 255, 255)
    C = {'plank': [hexc(0xb58553), hexc(0xa0703f)], 'edge': hexc(0x5e3d22), 'post': hexc(0x8a5a32), 'cap': hexc(0xb58553),
         'rail': hexc(0xa8763f), 'slat': hexc(0x9a6a38), 'dark': hexc(0x2b1d14)}
    n, step = 3, 0.125
    arch = min(14, 3 + n * 2.5)
    ox, oy = 42, 32
    def pt(u, v, h=0):
        lift = math.sin(math.pi * u / n) * arch
        return (ox + (u - v) * 32, oy + (u + v) * 16 - lift - h)
    p = Pic(148, 104)
    us = [i * step for i in range(int(n / step))]
    for i, u in enumerate(us):
        q = [pt(u, 0), pt(u + step, 0), pt(u + step, 1), pt(u, 1)]
        p.poly(q, C['plank'][i % 2], ol=False)
        p.line([q[0], q[3]], C['edge'], 0.5, ol=False)
    for u in us:
        a, b = pt(u, 1), pt(u + step, 1)
        p.poly([a, b, (b[0], b[1] + 3), (a[0], a[1] + 3)], C['edge'], ol=False)
    for v in (0, 1):  # erst das hintere, dann das vordere Geländer
        for u in [k * 0.5 for k in range(int(n / 0.5) + 1)]:
            a, b = pt(u, v, 0), pt(u, v, 13)
            p.line([a, (b[0], b[1] - 1)], C['dark'], 4, ol=False)
            p.line([a, b], C['post'], 2, ol=False)
            p.rect(b[0] - 1, b[1] - 1, b[0] + 2, b[1] + 1, C['cap'], ol=False)
        rail = lambda h: [pt(k * step, v, h) for k in range(int(n / step) + 1)]
        p.line(rail(12), C['dark'], 4, ol=False)
        p.line(rail(12), C['rail'], 2, ol=False)
        p.line(rail(6), C['dark'], 3, ol=False)
        p.line(rail(6), C['slat'], 1.5, ol=False)
    sprite_draw.SKIP.add('wood_bridge')  # nur die Vorlage, keine Spieldatei
    p.save('wood_bridge')


# ---- abgeleitete Bilder ----
def recolor_tile(src, dst, target, detail=1.0, keep=0.0, sizes=OUT):
    """Helligkeit des Vorbilds (um ihren Mittelwert) auf eine Farbe legen; keep: Anteil der Originalfarbe"""
    if not wanted(dst):
        return
    for sub in sizes:
        path = os.path.join(A, sub, src + '.png')
        if not os.path.exists(path):
            continue
        a = np.asarray(Image.open(path).convert('RGBA')).astype(float)
        lum = 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
        avg = lum[a[..., 3] > 128].mean()
        k = np.clip(1 + (lum / avg - 1) * detail, 0.5, 1.4)[..., None]
        out = a.copy()
        out[..., :3] = np.clip(np.array(target) * k * (1 - keep) + a[..., :3] * keep, 0, 255)
        Image.fromarray(out.astype(np.uint8), 'RGBA').save(os.path.join(A, sub, dst + '.png'), optimize=True)
    print(dst)


def moss_patches():
    """Moospolster: weiche, unregelmäßige Flecken, flach auf dem Boden (über die Kachelränder hinaus)"""
    from PIL import ImageFilter
    for i in range(2):
        name = f'forest_moss{i}'
        if not wanted(name):
            continue
        w, h, k = 96, 48, 8
        r = random.Random(5 + i)
        mask = Image.new('L', (w * k, h * k))
        d = ImageDraw.Draw(mask)
        for _ in range(9):
            cx, cy = r.uniform(0.25, 0.75) * w, r.uniform(0.35, 0.65) * h
            rx, ry = r.uniform(10, 20), r.uniform(5, 9)
            d.ellipse([(cx - rx) * k, (cy - ry) * k, (cx + rx) * k, (cy + ry) * k], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(k * 2.2)).point(lambda v: min(255, int(v * 1.6)))
        m = np.asarray(mask).astype(float) / 255
        yy, xx = np.mgrid[0:h * k, 0:w * k]
        noise = np.zeros_like(m)
        for _ in range(140):  # helle und dunkle Tupfen (Moosköpfchen)
            x0, y0, rr = r.uniform(0, w * k), r.uniform(0, h * k), r.uniform(1, 3) * k
            noise += np.exp(-(((xx - x0) ** 2) + ((yy - y0) ** 2) * 3) / (rr * rr)) * r.choice((-1, 1))
        base = np.array((92, 132, 50), float)
        col = np.clip(base[None, None] * (1 + 0.22 * np.clip(noise, -1, 1)[..., None]), 0, 255)
        im = Image.fromarray(np.dstack([col, m * 235]).astype(np.uint8), 'RGBA')
        sprite_draw.save_all(im, name, w, h)


def copies():
    """Wasserfall und Felsklippe wie im Dschungel (eigene Namen fürs Wald-Paket)"""
    for src, dst in [('waterfall', 'forest_waterfall'), ('cliff', 'forest_cliff')]:
        if not wanted(dst):
            continue
        for sub in OUT:
            path = os.path.join(A, sub, src + '.png')
            if os.path.exists(path):
                shutil.copyfile(path, os.path.join(A, sub, dst + '.png'))
        print(dst)


for make in [stump, mossy_log, bluebells, foxglove, bats, birds, log_bridge, river_rock, foam, wood_bridge, cave, stand]:
    make()
star_flowers('forest_anemones', (250, 250, 244, 255), (240, 200, 60, 255), (170, 170, 160, 255))
star_flowers('forest_violets', (150, 96, 206, 255), (250, 220, 90, 255), (90, 50, 130, 255))
shrub('forest_elder', LEAF, 'umbel')
shrub('forest_hazel', LEAF2, 'nuts')
for i in range(4):  # fließendes Wasser: klares, blaugrünes Waldwasser (nur in alter Größe, wie der Dschungelfluss)
    recolor_tile(f'jungle_flow{i}', f'forest_flow{i}', (70, 128, 168), detail=1.1)
moss_patches()
copies()
