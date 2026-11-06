"""Aufruf: python tools/meadow-placeholders.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Platzhalter für die aufgepeppte Wiese (bis echte Bilder da sind): einfach gezeichnet im Stil der Wiese (Kontur, weiche
Schatten), jeweils schon mit dem endgültigen Dateinamen in allen Auflösungen: public/assets (alte Größe), hd/ (4-fach),
hd2/ (2-fach). Die bunten Blumen sind die roten Blumen umgefärbt.
Die Platzhalter in Wiese-Sprites/Neu sind die Vorlage für tools/meadow-art.py (Größe, Fußpunkt, Schatten der echten
Bilder); Bilder, für die es schon echte gibt (ART in tools/meadow-art.py), schreibt dieses Skript nur noch dorthin.
ONLY=name: nur dieses eine Bild."""
import os, re, math, random
import numpy as np
from PIL import Image, ImageDraw
import sprite_draw
from sprite_draw import A, S, OUT, Pic, dark, light

sprite_draw.EXPORT = 'Wiese-Sprites/Neu'  # die neuen Bilder zum Nachmalen auch hier (4-fach, wie hd/)
sprite_draw.SKIP = set(re.findall(r"'(\w+)':", re.search(r'ART = \{(.*?)\}', open('tools/meadow-art.py', encoding='utf-8').read(), re.S).group(1)))
EXPORT = sprite_draw.EXPORT


rnd = random.Random(7)
LEAF = (86, 140, 58, 255)
LEAF2 = (112, 166, 70, 255)
LEAF3 = (64, 112, 48, 255)
WOOD = (150, 98, 58, 255)
WOOD2 = (176, 122, 72, 255)
STRAW = (232, 196, 96, 255)


# Trauerweide: Stamm, Krone und lange hängende Zweige bis fast zum Boden. Fuß bei (48, 100)
def willow():
    p = Pic(96, 112)
    strands = [(x, rnd.uniform(0, 1)) for x in range(10, 88, 5)]
    for x, r in strands:  # hintere Zweige (dunkler)
        p.poly([(x - 3, 30), (x + 3, 30), (x + 2 + r * 2, 78 + r * 10), (x - 1 + r, 82 + r * 10)], LEAF3)
    p.poly([(43, 101), (53, 101), (51, 60), (56, 40), (50, 42), (47, 56), (42, 44), (38, 46), (45, 62)], (122, 86, 56, 255))
    p.ell(48, 34, 38, 24, LEAF3)
    p.ell(48, 30, 34, 21, LEAF)
    for cx, cy, rx in [(30, 30, 14), (50, 22, 16), (66, 30, 14), (40, 36, 12), (58, 36, 12)]:
        p.ell(cx, cy, rx, rx * 0.7, LEAF2, ol=False)
    for x, r in strands:  # vordere Zweige; in der Mitte kürzer, damit man den Stamm sieht
        if 36 < x < 60:
            bottom = 54 + r * 6
        else:
            bottom = 74 + r * 14
        col = LEAF if r < 0.5 else LEAF2
        p.poly([(x - 2.5, 36), (x + 2.5, 36), (x + 1.5 + r * 2, bottom), (x + r, bottom + 4), (x - 1.5, bottom)], col)
        for y in range(42, int(bottom), 7):
            p.ell(x + 0.5 + (y % 2), y, 1.4, 2.4, light(col, 0.25), ol=False)
    p.shadow(48, 100, 36, 9)
    p.save('willow')


def sunflower_head(p, x, y, r):
    for i in range(14):
        a = i / 14 * math.tau
        p.ell(x + math.cos(a) * r * 0.95, y + math.sin(a) * r * 0.85, r * 0.42, r * 0.42, (250, 204, 40, 255), ol=(170, 118, 20, 255), ow=0.6)
    p.ell(x, y, r * 0.58, r * 0.55, (110, 70, 34, 255))
    for i in range(6):
        a = i / 6 * math.tau
        p.ell(x + math.cos(a) * r * 0.3, y + math.sin(a) * r * 0.28, 0.6, 0.6, (70, 42, 20, 255), ol=False)


# Sonnenblumen: drei Stück pro Kachel. Fuß bei (32, 72)
def sunflowers():
    p = Pic(64, 84)
    for x, y, h in [(18, 70, 54), (46, 68, 58), (32, 76, 50)]:
        p.line([(x, y), (x + 1, y - h / 2), (x, y - h)], (78, 132, 50, 255), 2)
        for side, k in [(-1, 0.35), (1, 0.55)]:
            ly = y - h * k
            p.poly([(x, ly), (x + side * 9, ly - 6), (x + side * 13, ly - 2), (x + side * 7, ly + 2)], LEAF2)
        sunflower_head(p, x, y - h, 7.5)
    p.shadow(32, 72, 26, 7)
    p.save('sunflowers')


# Mais: drei Stängel mit langen Blättern und Kolben. Fuß bei (32, 72)
def corn():
    p = Pic(64, 84)
    for x, y, h in [(20, 70, 60), (44, 68, 64), (32, 76, 56)]:
        p.line([(x, y), (x, y - h)], (110, 150, 60, 255), 2.4)
        for i, k in enumerate([0.25, 0.45, 0.65, 0.82]):
            side = -1 if i % 2 else 1
            ly = y - h * k
            p.poly([(x, ly), (x + side * 8, ly - 7), (x + side * 16, ly - 2), (x + side * 9, ly - 3)], LEAF2 if i % 2 else LEAF)
        p.ell(x + 3, y - h * 0.55, 2.6, 6, (240, 206, 80, 255))
        p.poly([(x + 1, y - h * 0.48), (x + 5, y - h * 0.48), (x + 4, y - h * 0.6)], LEAF, ol=False)
        p.line([(x - 2, y - h), (x, y - h - 6), (x + 2, y - h)], (214, 180, 96, 255), 1)
    p.shadow(32, 72, 26, 7)
    p.save('corn')


# Kürbisse auf dem Acker (zwei mit Ranke). Fuß bei (24, 24)
def pumpkins():
    p = Pic(48, 32)
    p.line([(6, 22), (14, 18), (26, 20), (40, 16)], (90, 140, 56, 255), 1)
    for lx, ly in [(9, 16), (31, 14), (42, 20)]:
        p.ell(lx, ly, 4, 2.6, LEAF2)
    for x, y, r in [(16, 22, 8), (33, 24, 6)]:
        o = (232, 128, 34, 255)
        p.ell(x, y, r, r * 0.72, o)
        p.ell(x - r * 0.45, y, r * 0.5, r * 0.66, light(o, 0.12), ol=(170, 80, 20, 255), ow=0.5)
        p.ell(x + r * 0.45, y, r * 0.5, r * 0.66, light(o, 0.12), ol=(170, 80, 20, 255), ow=0.5)
        p.ell(x, y, r * 0.42, r * 0.7, light(o, 0.25), ol=(170, 80, 20, 255), ow=0.5)
        p.line([(x, y - r * 0.7), (x + 1, y - r * 0.7 - 3)], (90, 110, 50, 255), 1.4)
    p.shadow(24, 25, 18, 5)
    p.save('pumpkins')


# Kohlköpfe auf dem Acker. Fuß bei (24, 24)
def cabbages():
    p = Pic(48, 32)
    for x, y, r in [(14, 20, 7), (32, 18, 6.5), (24, 26, 7)]:
        for i in range(6):
            a = i / 6 * math.tau
            p.ell(x + math.cos(a) * r * 0.7, y + math.sin(a) * r * 0.35, r * 0.55, r * 0.45, (110, 170, 90, 255), ow=0.6)
        p.ell(x, y - 1, r * 0.62, r * 0.55, (176, 214, 130, 255), ow=0.6)
        p.ell(x - 1, y - 2, r * 0.3, r * 0.25, (210, 236, 170, 255), ol=False)
    p.shadow(24, 25, 18, 5)
    p.save('cabbages')


# Vogelscheuche: Pfahl, Querlatte mit Hemd, Kopf aus Sack mit Strohhut. Fuß bei (24, 80)
def scarecrow():
    p = Pic(48, 88)
    p.line([(24, 80), (24, 30)], WOOD, 2.4)
    p.line([(7, 44), (41, 44)], WOOD, 2)
    shirt = (196, 70, 60, 255)
    p.poly([(10, 41), (38, 41), (35, 50), (31, 49), (31, 66), (17, 66), (17, 49), (13, 50)], shirt)
    for x in (20, 24, 28):  # Karomuster
        p.line([(x, 43), (x, 65)], dark(shirt, 0.75), 0.8, ol=False)
    p.line([(17, 55), (31, 55)], dark(shirt, 0.75), 0.8, ol=False)
    p.rect(17, 64, 31, 68, (90, 110, 160, 255))
    for x in (8, 40):  # Stroh an den Ärmeln
        for d in (-2, 0, 2):
            p.line([(x, 44), (x + (-3 if x < 24 else 3), 46 + d)], STRAW, 0.8, ol=False)
    p.ell(24, 33, 7, 7.5, (214, 186, 130, 255))
    p.ell(21.5, 32, 1, 1, (60, 40, 30, 255), ol=False)
    p.ell(26.5, 32, 1, 1, (60, 40, 30, 255), ol=False)
    p.line([(21, 36), (24, 37.5), (27, 36)], (60, 40, 30, 255), 0.6, ol=False)
    p.ell(24, 27, 13, 3.5, STRAW)
    p.poly([(17, 27), (19, 18), (29, 18), (31, 27)], STRAW)
    p.rect(18, 24, 30, 26, (170, 60, 50, 255), ol=False)
    p.shadow(24, 80, 10, 4)
    p.save('scarecrow')


# Wäscheleine zwischen zwei Pfosten (schräg entlang tx) mit Wäsche. Fuß bei (48, 58)
def clothesline():
    p = Pic(96, 80)
    a, b = (27, 48), (69, 69)
    h = 34
    p.shadow(48, 60, 28, 8)
    p.line([a, (a[0], a[1] - h)], WOOD, 2.2)
    top_a, top_b = (a[0], a[1] - h + 2), (b[0], b[1] - h + 2)
    sag = lambda t: (top_a[0] + (top_b[0] - top_a[0]) * t, top_a[1] + (top_b[1] - top_a[1]) * t + math.sin(math.pi * t) * 5)
    p.line([sag(t / 10) for t in range(11)], (240, 240, 230, 255), 0.6, ol=(120, 120, 110, 255))
    clothes = [(0.15, (90, 150, 220, 255), 'shirt'), (0.38, (240, 236, 220, 255), 'sheet'), (0.62, (230, 110, 120, 255), 'shirt'), (0.82, (250, 210, 80, 255), 'sock')]
    for t, col, kind in clothes:
        x, y = sag(t)
        if kind == 'shirt':
            p.poly([(x - 5, y), (x + 5, y + 2.5), (x + 7, y + 6), (x + 4, y + 6), (x + 4, y + 14), (x - 4, y + 11), (x - 4, y + 4), (x - 7, y + 2)], col)
        elif kind == 'sheet':
            p.poly([(x - 6, y - 1.5), (x + 6, y + 1.5), (x + 6, y + 17), (x - 6, y + 14)], col)
        else:
            p.poly([(x - 2, y), (x + 2, y + 1), (x + 2, y + 8), (x + 5, y + 10), (x + 4, y + 12), (x - 2, y + 9)], col)
        p.ell(x, y + 0.5, 0.8, 1.2, (200, 160, 90, 255), ol=False)
    p.line([b, (b[0], b[1] - h)], WOOD, 2.2)
    p.save('clothesline')


# Briefkasten auf einem Pfosten. Fuß bei (12, 44)
def mailbox():
    p = Pic(24, 48)
    p.shadow(12, 44, 6, 2.5)
    p.line([(12, 44), (12, 26)], WOOD, 2.2)
    box = (70, 120, 180, 255)
    p.poly([(4, 26), (4, 18), (6, 14), (18, 14), (20, 18), (20, 26)], box)
    p.ell(12, 18, 7, 2.5, light(box, 0.2), ol=False)
    p.rect(9, 20, 15, 21.5, (40, 60, 90, 255), ol=False)
    p.line([(20, 24), (20, 12), (23, 12)], (220, 60, 50, 255), 0.8)
    p.save('mailbox')


# Holzstapel: Scheite übereinander, Stirnseiten zur Kamera. Fuß bei (32, 40)
def woodpile():
    p = Pic(64, 48)
    p.shadow(32, 40, 26, 7)
    rows = [(38, [12, 22, 32, 42, 52]), (30, [17, 27, 37, 47]), (22, [22, 32, 42]), (14, [27, 37])]
    for y, xs in rows:
        p.poly([(xs[0] - 4, y - 4), (xs[0] - 9, y - 9), (xs[-1] - 5, y - 9), (xs[-1], y - 4)], (130, 86, 52, 255))
        for x in xs:
            p.ell(x, y, 5, 4.6, (226, 186, 128, 255), ol=(110, 72, 40, 255))
            p.ell(x, y, 2.8, 2.5, (206, 160, 100, 255), ol=False)
            p.ell(x, y, 0.8, 0.7, (170, 120, 70, 255), ol=False)
    p.save('woodpile')


# runder Heuballen (liegt, Stirnseite mit Spirale nach rechts vorne). Fuß bei (24, 34)
def hay_bale():
    p = Pic(48, 40)
    p.shadow(24, 34, 20, 6)
    p.poly([(8, 32), (6, 14), (22, 6), (34, 10), (34, 34)], (214, 176, 84, 255))
    for y in range(10, 32, 4):
        p.line([(8, y + 6), (30, y)], (190, 150, 60, 255), 0.6, ol=False)
    p.ell(34, 22, 9, 12, STRAW)
    for r in (7, 4.5, 2):
        p.ell(34, 22, r * 0.75, r, light(STRAW, 0.1), ol=(190, 150, 60, 255), ow=0.5)
    p.save('hay_bale')


# Windmühle: Turm mit Dach (die Flügel drehen sich, eigenes Bild windmill_sails). Fuß bei (64, 184), Nabe bei (64, 66)
def windmill():
    p = Pic(128, 200)
    p.shadow(64, 182, 46, 13)
    wall = (232, 222, 200, 255)
    p.poly([(36, 184), (44, 72), (84, 72), (92, 184)], wall)
    p.poly([(64, 184), (64, 72), (84, 72), (92, 184)], dark(wall, 0.88), ol=False)
    for y in range(90, 182, 12):
        p.line([(40 + (184 - y) * 0.07, y), (88 - (184 - y) * 0.07, y)], dark(wall, 0.8), 0.5, ol=False)
    p.poly([(55, 184), (55, 166), (59, 161), (69, 161), (73, 166), (73, 184)], (120, 74, 44, 255))
    p.ell(64, 120, 5, 6, (90, 140, 190, 255), ol=(110, 72, 40, 255))
    p.line([(64, 114), (64, 126)], (110, 72, 40, 255), 0.8, ol=False)
    p.ell(54, 96, 3.5, 4, (90, 140, 190, 255), ol=(110, 72, 40, 255))
    roof = (176, 70, 52, 255)
    p.poly([(36, 76), (64, 34), (92, 76)], roof)
    p.poly([(64, 34), (92, 76), (64, 76)], dark(roof, 0.85), ol=False)
    p.ell(64, 76, 28, 4, dark(roof, 0.9))
    p.save('windmill')

    s = Pic(160, 160)
    c = (80, 80)
    for i in range(4):
        a = i * math.tau / 4 + math.pi / 4
        ux, uy = math.cos(a), math.sin(a)
        vx, vy = -uy, ux
        P = lambda u, v: (c[0] + ux * u + vx * v, c[1] + uy * u + vy * v)
        p_sail = [P(14, 1), P(74, 1), P(74, 14), P(14, 10)]
        s.poly(p_sail, (238, 232, 214, 255), ol=(120, 90, 60, 255), ow=0.8)
        for u in range(20, 75, 9):
            s.line([P(u, 1), P(u, 13 * (u / 74) + 1)], (150, 112, 74, 255), 0.6, ol=False)
        s.line([P(4, 0), P(76, 0)], WOOD, 1.6)
    s.ell(80, 80, 5, 5, (110, 72, 40, 255))
    s.save('windmill_sails')


# Bienenkorb aus Stroh auf einem Holzbock. Fuß bei (16, 42)
def beehive():
    p = Pic(32, 48)
    p.shadow(16, 42, 12, 3.5)
    p.line([(7, 42), (7, 34)], WOOD, 1.4)
    p.line([(25, 42), (25, 34)], WOOD, 1.4)
    p.rect(3, 32, 29, 35, WOOD2)
    for i, (y, rx) in enumerate([(29, 12), (24, 11.5), (19, 10), (14.5, 8), (11, 5)]):
        p.ell(16, y, rx, 3.4, STRAW if i % 2 else light(STRAW, 0.12), ow=0.6)
    p.ell(16, 29, 3, 2, (60, 40, 20, 255), ol=False)
    p.save('beehive')


# Pusteblumen (und eine gelbe Löwenzahnblüte); dandelion_blown: nur noch die Stängel. Fuß bei (20, 24)
def dandelions():
    for blown in (False, True):
        p = Pic(40, 32)
        p.shadow(20, 25, 12, 3)
        for lx, ly, side in [(14, 24, -1), (24, 25, 1), (19, 25, 1)]:
            p.poly([(lx, ly), (lx + side * 6, ly - 3), (lx + side * 4, ly - 1), (lx + side * 7, ly - 1), (lx + side * 2, ly + 1)], LEAF2, ow=0.6)
        for x, y, h in [(13, 24, 16), (22, 25, 20), (28, 24, 13)]:
            p.line([(x, y), (x + 0.5, y - h)], (110, 160, 80, 255), 0.7)
            if blown:
                p.ell(x + 0.5, y - h, 1.3, 1.3, (150, 170, 100, 255), ol=False)
                continue
            for i in range(16):
                a = i / 16 * math.tau
                p.line([(x + 0.5, y - h), (x + 0.5 + math.cos(a) * 4.5, y - h + math.sin(a) * 4.5)], (250, 250, 250, 200), 0.4, ol=False)
                p.ell(x + 0.5 + math.cos(a) * 4.8, y - h + math.sin(a) * 4.8, 0.7, 0.7, (255, 255, 255, 255), ol=False)
            p.ell(x + 0.5, y - h, 1.2, 1.2, (200, 200, 180, 255), ol=False)
        if not blown:
            p.line([(17, 25), (16, 16)], (110, 160, 80, 255), 0.7)
            p.ell(16, 15, 2.6, 2.2, (250, 210, 40, 255), ol=(190, 140, 20, 255), ow=0.5)
        p.save('dandelion_blown' if blown else 'dandelion')


# Vogelhäuschen auf einem Pfahl. Fuß bei (16, 58)
def birdhouse():
    p = Pic(32, 64)
    p.shadow(16, 58, 7, 2.5)
    p.line([(16, 58), (16, 28)], WOOD, 2)
    box = (200, 150, 96, 255)
    p.poly([(8, 32), (8, 18), (24, 18), (24, 32)], box)
    p.poly([(16, 18), (24, 18), (24, 32), (16, 32)], dark(box, 0.88), ol=False)
    p.ell(16, 24, 2.4, 2.4, (50, 30, 20, 255), ol=False)
    p.line([(16, 29), (16, 31)], WOOD, 0.8)
    roof = (60, 110, 70, 255)
    p.poly([(5, 20), (16, 9), (27, 20)], roof)
    p.save('birdhouse')


# Dorfbrunnen: runder Steinrand, Pfosten mit Dach, Eimer am Seil. Fuß bei (32, 72)
def well():
    p = Pic(64, 88)
    p.shadow(32, 72, 26, 9)
    stone = (170, 170, 160, 255)
    p.poly([(10, 58), (10, 70), (32, 78), (54, 70), (54, 58)], stone, ol=False)
    p.ell(32, 70, 22, 8, dark(stone, 0.8))
    p.rect(10, 58, 54, 70, stone, ol=False)
    for y in (62, 66):
        for x in range(12, 54, 8):
            p.ell(x + (4 if y == 66 else 0), y, 3.6, 1.8, light(stone, 0.12), ol=dark(stone, 0.7), ow=0.4)
    p.ell(32, 58, 22, 8, light(stone, 0.15))
    p.ell(32, 58, 17, 5.6, (50, 90, 120, 255), ol=dark(stone, 0.6))
    p.line([(13, 60), (13, 24)], WOOD, 2)
    p.line([(51, 60), (51, 24)], WOOD, 2)
    p.line([(13, 32), (51, 32)], WOOD2, 1.4)
    p.line([(30, 32), (30, 46)], (200, 190, 160, 255), 0.5, ol=False)
    p.poly([(26, 46), (34, 46), (33, 53), (27, 53)], (120, 90, 60, 255), ow=0.6)
    roof = (150, 80, 56, 255)
    p.poly([(4, 28), (32, 10), (60, 28), (52, 30), (32, 18), (12, 30)], roof)
    p.save('meadow_well')


# Holzbank (entlang tx, mit Lehne hinten). Fuß bei (32, 38)
def bench():
    p = Pic(64, 48)
    p.shadow(32, 38, 22, 7)
    ux, uy = 0.894, 0.447  # entlang tx
    P = lambda u, v, h: (32 + ux * u - ux * v, 36 + uy * u + uy * v - h)  # v quer (nach hinten oben: entlang -ty)
    for u in (-17, 17):
        for v in (-4, 3):
            p.line([P(u, v, 0), P(u, v, 8)], dark(WOOD, 0.8), 1.4)
        p.line([P(u, -4, 8), P(u, -5, 20)], dark(WOOD, 0.8), 1.4)
    for i, h in enumerate((15, 19)):
        p.poly([P(-20, -5, h), P(20, -5, h), P(20, -5, h + 3), P(-20, -5, h + 3)], WOOD2, ow=0.6)
    for v in (-4, -1, 2):
        p.poly([P(-20, v, 8), P(20, v, 8), P(20, v + 2.6, 8), P(-20, v + 2.6, 8)], WOOD2, ow=0.5)
    p.save('meadow_bench')


# Holzsteg (flach über dem Wasser, eine ganze Kachel; Bretter quer). Kachel 64 x 32
def dock():
    p = Pic(64, 34)
    top, right, bottom, left = (32, 0), (64, 16), (32, 32), (0, 16)
    p.poly([left, bottom, (32, 34), (0, 18)], dark(WOOD, 0.7), ol=False)
    p.poly([bottom, right, (64, 18), (32, 34)], dark(WOOD, 0.6), ol=False)
    p.poly([top, right, bottom, left], WOOD2, ol=False)
    for i in range(1, 8):  # Fugen zwischen den Brettern (quer zur Laufrichtung entlang ty)
        t = i / 8
        a = (top[0] + (left[0] - top[0]) * t, top[1] + (left[1] - top[1]) * t)
        b = (right[0] + (bottom[0] - right[0]) * t, right[1] + (bottom[1] - right[1]) * t)
        p.line([a, b], dark(WOOD2, 0.7), 0.5, ol=False)
    for i in range(8):
        t = (i + 0.5) / 8
        a = (top[0] + (left[0] - top[0]) * t, top[1] + (left[1] - top[1]) * t)
        b = (right[0] + (bottom[0] - right[0]) * t, right[1] + (bottom[1] - right[1]) * t)
        p.line([(a[0] + (b[0] - a[0]) * 0.1, a[1] + (b[1] - a[1]) * 0.1), (a[0] + (b[0] - a[0]) * 0.12, a[1] + (b[1] - a[1]) * 0.12)], dark(WOOD2, 0.6), 0.6, ol=False)
    p.save('meadow_dock')


# Seerosenblätter (flach auf dem Wasser), eins mit Blüte
def lily_pads():
    p = Pic(48, 24)
    pad = (80, 150, 70, 255)
    for x, y, r, notch in [(14, 12, 8, 0.4), (32, 8, 6, 2.2), (34, 17, 5, 4.0)]:
        pts = []
        for i in range(25):
            a = notch + 0.35 + i / 24 * (math.tau - 0.7)
            pts.append((x + math.cos(a) * r, y + math.sin(a) * r * 0.5))
        p.poly([(x, y)] + pts, pad, ow=0.5)
        p.ell(x - r * 0.3, y - r * 0.12, r * 0.25, r * 0.1, light(pad, 0.25), ol=False)
    for i in range(6):
        a = i / 6 * math.tau
        p.ell(14 + math.cos(a) * 2.6, 9 + math.sin(a) * 1.4, 2.2, 1.6, (246, 170, 200, 255), ol=(200, 100, 140, 255), ow=0.4)
    p.ell(14, 8.5, 1.4, 1, (250, 220, 90, 255), ol=False)
    p.save('lily_pads')


# Ente (schaut nach links): schwimmend und im Flug (zwei Flügelstellungen)
def ducks():
    body, head = (150, 116, 80, 255), (40, 120, 70, 255)
    p = Pic(28, 20)
    p.ell(15, 13, 9, 4.8, body)
    p.poly([(21, 11), (27, 8), (24, 13)], dark(body, 0.8), ow=0.6)
    p.ell(16, 11.5, 5, 2.4, light(body, 0.2), ol=False)
    p.ell(7, 6.5, 3.6, 3.4, head)
    p.rect(5, 9.5, 9, 10.5, (240, 240, 230, 255), ol=False)
    p.poly([(4, 6.5), (0.5, 7.5), (4, 8.5)], (240, 190, 50, 255), ow=0.5)
    p.ell(6.5, 5.5, 0.7, 0.7, (20, 20, 20, 255), ol=False)
    # Wasserlinie: unten abgeschnitten, kleines Kräuseln
    a = np.asarray(p.im).copy()
    a[16 * S:, :, 3] = 0
    p.im = Image.fromarray(a)
    p.d = ImageDraw.Draw(p.im)
    p.line([(4, 16), (26, 16)], (220, 240, 250, 200), 0.6, ol=False)
    p.save('duck')
    for i, up in enumerate((True, False)):
        f = Pic(36, 28)
        f.ell(19, 15, 10, 4.5, body)
        f.poly([(27, 14), (34, 12), (30, 17)], dark(body, 0.8), ow=0.6)
        f.ell(8, 12, 3.6, 3.4, head)
        f.poly([(5, 12), (1, 13), (5, 14)], (240, 190, 50, 255), ow=0.5)
        f.ell(7.5, 11, 0.7, 0.7, (20, 20, 20, 255), ol=False)
        wing = [(15, 14), (25, 14), (28, 2), (20, 4)] if up else [(15, 15), (25, 15), (26, 26), (19, 24)]
        f.poly(wing, light(body, 0.15), ow=0.6)
        f.save(f'duck_fly{i}')


# Biene (winzig, fliegt um die Bienenkörbe)
def insects():
    p = Pic(12, 10)
    p.ell(4, 2.6, 2.2, 2, (230, 240, 255, 230), ol=(150, 170, 200, 255), ow=0.3)
    p.ell(7, 2.6, 2.2, 2, (230, 240, 255, 230), ol=(150, 170, 200, 255), ow=0.3)
    p.ell(6, 6, 4, 3, (250, 200, 40, 255), ow=0.5)
    for x in (5, 7.5):
        p.line([(x, 3.3), (x, 8.7)], (40, 30, 20, 255), 0.9, ol=False)
    p.save('bee')


# Blumen in neuen Farben: die roten Blumen umgefärbt (Blüten = rote Pixel), in allen Auflösungen
def recolored_flowers():
    targets = {'flowers_blue': (90, 140, 240), 'flowers_purple': (176, 100, 220), 'flowers_white': (248, 246, 240)}
    for name, col in targets.items():
        if os.environ.get('ONLY') not in (None, name):
            continue
        for sub in OUT:
            src = os.path.join(A, sub, 'flowers_red.png')
            a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
            r, g, b = a[..., 0], a[..., 1], a[..., 2]
            red = (r > g + 40) & (r > b + 40)
            lum = (0.3 * r + 0.59 * g + 0.11 * b) / 110  # Helligkeit der roten Blüte (Mitte etwa 1)
            k = np.clip(lum, 0.45, 1.25)[..., None] * (0.82 if col[0] > 240 else 1)
            out = a.copy()
            out[..., :3] = np.where(red[..., None], np.clip(np.array(col) * k, 0, 255), a[..., :3])
            Image.fromarray(out.astype(np.uint8), 'RGBA').save(os.path.join(A, sub, name + '.png'), optimize=True)
            if sub == 'hd':
                Image.fromarray(out.astype(np.uint8), 'RGBA').save(os.path.join(EXPORT, name + '.png'), optimize=True)
        print(name)


for make in [willow, sunflowers, corn, pumpkins, cabbages, scarecrow, clothesline, mailbox, woodpile, hay_bale, windmill, beehive,
             dandelions, birdhouse, well, bench, dock, lily_pads, ducks, insects, recolored_flowers]:
    make()
