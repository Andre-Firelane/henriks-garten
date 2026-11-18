"""Aufruf: python tools/moor-oak-placeholders.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Platzhalter für Moor und Eichenhain im Süden des Walds (bis echte Bilder da sind), gezeichnet wie die übrigen
Wald-Platzhalter (tools/sprite_draw.py), mit dem endgültigen Dateinamen in allen Auflösungen; Vorlagen zum Nachmalen
in Wald-Sprites/Neu.
Moor: Birke, Wollgras, Holzsteg (über den Tümpeln), knorrige Moorbäume im Wasser, Moorboden und dunkles Moorwasser.
Eichenhain: große Eiche, Laubhaufen (Versteck der Igel), Pilzkreis, Laubboden und Schlamm der Wildschwein-Suhle.
Boden und Wasser sind umgefärbte Kacheln des Waldbodens (fgrass), des Wassers und des Schlamms der Savanne.
ONLY=name: nur dieses eine Bild."""
import os, math, random
import numpy as np
from PIL import Image, ImageDraw
import sprite_draw
from sprite_draw import A, OUT, Pic, dark, light, wanted

sprite_draw.EXPORT = 'Wald-Sprites/Neu'

rnd = random.Random(23)
BARK = (112, 78, 50, 255)
BIRCH = (236, 232, 222, 255)
BIRCH_LEAF = (124, 168, 72, 255)
OAK_LEAF = (86, 120, 52, 255)
OAK_AUTUMN = (196, 132, 54, 255)
WOOD = (150, 108, 70, 255)


# Laubbüschel wie bei den vorhandenen Bäumen (dark_tree): dunkle Kontur, dunkler Grund, oben links heller, ein Glanzlicht,
# kurze dunkle Blattstriche. pal: (dunkel, mittel, hell, Glanz)
OUTLINE = (40, 30, 20, 255)
GREEN = ((46, 72, 44, 255), (72, 108, 60, 255), (112, 144, 74, 255), (138, 164, 90, 255))
OLIVE = ((70, 82, 40, 255), (108, 120, 56, 255), (150, 156, 72, 255), (178, 180, 96, 255))
OCHRE = ((120, 78, 34, 255), (178, 122, 50, 255), (214, 164, 76, 255), (236, 196, 110, 255))


def clump(p, cx, cy, r, pal, dashes=7):
    """Laubbüschel mit gewelltem Rand: Kreis aus kleinen Buckeln, oben links Licht, feine Blatttupfer"""
    dk, md, lt, gl = pal
    n = 9
    off = rnd.uniform(0, math.tau)
    bumps = [(cx + math.cos(off + i / n * math.tau) * r * 0.66, cy + math.sin(off + i / n * math.tau) * r * 0.56, r * rnd.uniform(0.34, 0.42)) for i in range(n)]
    bumps.append((cx, cy, r * 0.72))
    ow = 1.1
    for x, y, q in bumps:  # Kontur (alle Buckel etwas größer in Konturfarbe), dann die Fläche
        p.ell(x, y, q + ow, (q + ow) * 0.86, OUTLINE, ol=False)
    for x, y, q in bumps:
        p.ell(x, y, q, q * 0.86, dk, ol=False)
    for x, y, q in bumps:  # Licht von oben links: obere Buckel heller
        k = ((cx - x) + (cy - y)) / r  # >0: oben links
        if k > -0.35:
            p.ell(x - q * 0.12, y - q * 0.16, q * 0.78, q * 0.64, md, ol=False)
        if k > 0.25:
            p.ell(x - q * 0.2, y - q * 0.26, q * 0.48, q * 0.38, lt, ol=False)
    p.ell(cx - r * 0.12, cy - r * 0.16, r * 0.5, r * 0.4, md, ol=False)
    p.ell(cx - r * 0.26, cy - r * 0.3, r * 0.26, r * 0.2, lt, ol=False)
    for _ in range(int(r * 2.2)):  # feine Blatttupfer
        a = rnd.uniform(0, math.tau)
        d = math.sqrt(rnd.random()) * r * 0.8
        x, y = cx + math.cos(a) * d, cy + math.sin(a) * d * 0.8
        k = ((cx - x) + (cy - y)) / r
        col = gl if k > 0.3 else lt if k > -0.1 else md
        p.ell(x, y, 0.7, 0.45, col, ol=False)
    for _ in range(dashes + int(r * 0.5)):  # kurze dunkle Blattstriche
        a = rnd.uniform(0, math.tau)
        d = rnd.uniform(0.2, 0.75) * r
        x, y = cx + math.cos(a) * d, cy + math.sin(a) * d * 0.8
        p.line([(x - 0.9, y + 0.3), (x + 0.9, y - 0.3)], dk, 0.5, ol=False)


# Birke: schlanker weißer Stamm (rechts im Schatten, unten dunkle rissige Borke, schwarze Querstreifen), dünne Äste,
# lockere hellgrüne Krone aus kleineren Büscheln wie bei der Eiche. Fuß bei (32, 92)
BIRCH_PAL = ((82, 118, 52, 255), (122, 162, 72, 255), (164, 196, 98, 255), (196, 220, 128, 255))
BIRCH_PAL2 = ((70, 104, 46, 255), (106, 146, 64, 255), (146, 182, 86, 255), (180, 208, 116, 255))


def birch():
    p = Pic(64, 104)
    p.shadow(32, 92, 15, 4.2)
    WHITE = (238, 234, 224, 255)
    # Stamm
    p.poly([(29, 93), (29.6, 60), (30.4, 40), (33.6, 40), (34.4, 60), (35.4, 93)], WHITE, ol=OUTLINE, ow=0.9)
    p.poly([(33, 92), (33.2, 60), (33.4, 42), (33.6, 42), (34.4, 60), (35.2, 92)], (196, 192, 184, 255), ol=False)  # Schatten rechts
    p.poly([(29.2, 93), (29.4, 84), (31, 86), (32.4, 82), (34, 85), (35.2, 83), (35.4, 93)], (70, 62, 56, 255), ol=False)  # dunkle Borke unten
    for y in (82, 88):
        p.line([(30, y), (31.5, y + 2), (30.5, y + 4)], (40, 34, 30, 255), 0.4, ol=False)
    for y in (46, 51, 55, 60, 65, 69, 74, 78):  # schwarze Querstreifen (Lentizellen)
        w = rnd.uniform(1.4, 3)
        x = rnd.choice((29.8, 34.2 - w, 31.2))
        p.poly([(x, y), (x + w, y - 0.4), (x + w, y + 0.6), (x, y + 1)], (36, 32, 30, 255), ol=False)
    # dünne Äste in die Krone
    for pts in [[(31, 58), (25, 50), (20, 44)], [(33.5, 54), (40, 46), (45, 40)], [(32, 44), (30, 32)]]:
        p.line(pts, WHITE, 0.9, ol=OUTLINE)
    # Krone: locker, hinten zuerst; kleine Lücken lassen Äste durchscheinen
    back = [(32, 14, 9, BIRCH_PAL), (22, 22, 9, BIRCH_PAL2), (42, 20, 9, BIRCH_PAL), (30, 28, 10, BIRCH_PAL)]
    front = [(18, 36, 9, BIRCH_PAL), (46, 34, 9, BIRCH_PAL2), (32, 40, 8, BIRCH_PAL), (24, 46, 6, BIRCH_PAL2), (42, 44, 6, BIRCH_PAL)]
    for cx, cy, r, pal in back + front:
        clump(p, cx, cy, r, pal, dashes=4)
    for _ in range(14):  # einzelne Blätter am Rand: die Krone wirkt luftig
        a = rnd.uniform(0, math.tau)
        x, y = 32 + math.cos(a) * rnd.uniform(17, 22), 30 + math.sin(a) * rnd.uniform(16, 20)
        p.ell(x, y, 1.3, 0.9, BIRCH_PAL[2], ol=OUTLINE, ow=0.35)
    p.save('forest_birch')


# Eiche: dicker, kurzer Stamm mit Wurzelanläufen, weit ausladende Äste, breite Krone aus vielen Büscheln (ein paar schon
# herbstlich), Eicheln. Fuß bei (56, 116)
def oak():
    p = Pic(112, 128)
    p.shadow(56, 116, 36, 8)
    # Stamm: links heller, rechts im Schatten, Rindenfurchen, Wurzelanläufe
    p.poly([(44, 118), (47, 104), (49, 80), (46, 70), (66, 70), (63, 80), (65, 104), (69, 118)], BARK, ol=OUTLINE, ow=1.1)
    p.poly([(47, 117), (50, 102), (51, 80), (49, 72), (54, 72), (54, 116)], light(BARK, 0.16), ol=False)
    p.poly([(60, 116), (60, 74), (64, 72), (62, 82), (63, 104), (66, 117)], dark(BARK, 0.78), ol=False)
    for x0, bend in [(52, -1), (56, 1), (59, -1), (62, 1)]:
        p.line([(x0, 78), (x0 + bend, 92), (x0, 112)], dark(BARK, 0.62), 0.5, ol=False)
    for a, b in [((45, 116), (34, 121)), ((68, 116), (79, 121)), ((55, 118), (54, 124)), ((62, 118), (66, 123))]:
        p.line([a, b], BARK, 2.4, ol=OUTLINE)
    p.ell(57, 94, 2.2, 3, dark(BARK, 0.5), ol=False)  # Astloch
    # Äste zur Krone
    for pts in [[(52, 76), (40, 66), (26, 62)], [(60, 76), (72, 64), (88, 60)], [(56, 74), (56, 50)]]:
        p.line(pts, BARK, 2.6, ol=OUTLINE)
    # Krone: hintere Büschel zuerst, dann die vorderen, unteren
    back = [(56, 16, 15, GREEN), (36, 24, 15, GREEN), (78, 24, 15, OLIVE), (22, 40, 15, GREEN), (92, 40, 14, GREEN), (56, 32, 18, GREEN)]
    mid = [(36, 46, 18, OLIVE), (76, 46, 18, GREEN), (16, 58, 13, GREEN), (98, 58, 13, OCHRE), (56, 52, 17, GREEN)]
    front = [(30, 66, 15, GREEN), (82, 66, 15, GREEN), (56, 68, 14, OLIVE)]
    for cx, cy, r, pal in back + mid + front:
        clump(p, cx, cy, r, pal)
    for _ in range(12):  # Eicheln
        x, y = rnd.uniform(16, 96), rnd.uniform(26, 74)
        p.ell(x, y + 0.6, 1.5, 1.9, (176, 132, 70, 255), ol=OUTLINE, ow=0.4)
        p.ell(x, y - 0.9, 1.8, 1, (112, 80, 44, 255), ol=False)
    p.save('forest_oak')


# alter, knorriger Moorbaum, der halb aus dem Wasser ragt: verdrehter Stamm mit Astlöchern und Moos, krumme Äste mit
# hängenden Bartflechten, Wurzelbögen, die aus dem Wasser kommen, Wellenringe am Fuß. leaves: ein paar dunkle Laubbüschel
# (sonst kahl). Fuß bei (48, 104)
def bogtree(name, leaves, seed):
    r = random.Random(seed)
    p = Pic(96, 128)
    WET = (70, 58, 44, 255)
    OLD = (104, 88, 70, 255)
    LICHEN = (196, 206, 176, 255)
    MOSSY = (104, 132, 58, 255)
    # Wurzelbögen (hinten), die Enden tauchen ins Wasser
    for x0, x1, h in [(24, 40, 9), (56, 74, 10), (32, 46, 6), (60, 68, 5)]:
        p.line([(x0, 107), (x0 + (x1 - x0) * 0.3, 106 - h), (x0 + (x1 - x0) * 0.7, 105 - h * 0.8), (x1, 104)], WET, 3, ol=OUTLINE)
        p.line([(x0 + (x1 - x0) * 0.3, 105 - h), (x0 + (x1 - x0) * 0.62, 104 - h * 0.8)], light(WET, 0.2), 0.8, ol=False)
    # Stamm: leicht schief und verdreht, unten dick
    trunk = [(36, 106), (39, 92), (37, 80), (41, 66), (39, 54), (44, 44), (52, 44), (54, 56), (58, 68), (56, 82), (60, 94), (62, 106)]
    p.poly(trunk, OLD, ol=OUTLINE, ow=1.1)
    p.poly([(40, 104), (42, 92), (40, 80), (44, 66), (42, 54), (46, 46), (48, 46), (47, 60), (48, 80), (47, 104)], light(OLD, 0.14), ol=False)
    p.poly([(54, 104), (55, 92), (53, 80), (55, 68), (52, 54), (54, 56), (58, 68), (56, 82), (60, 94), (60, 104)], dark(OLD, 0.75), ol=False)
    for pts in [[(42, 100), (45, 88), (43, 76), (47, 64)], [(50, 100), (52, 86), (50, 72), (52, 60)]]:  # Drehwuchs
        p.line(pts, dark(OLD, 0.6), 0.6, ol=False)
    for x, y, rx, ry in [(48, 74, 3, 4.5), (44, 90, 2, 2.6)]:  # Astlöcher
        p.ell(x, y, rx, ry, dark(OLD, 0.35), ol=dark(OLD, 0.55), ow=0.6)
    for pts in [[(38, 96), (44, 92), (46, 98), (40, 102)], [(52, 62), (56, 60), (57, 66), (53, 68)]]:  # Moos
        p.poly(pts, MOSSY, ol=dark(MOSSY, 0.6), ow=0.4)
    # krumme Äste
    branches = [[(44, 46), (36, 34), (22, 30), (14, 20)], [(50, 46), (60, 32), (72, 28), (82, 16)], [(47, 44), (46, 26), (52, 12)],
                [(40, 62), (28, 58), (20, 50)], [(56, 60), (68, 56), (76, 48)]]
    if not leaves:  # kahl: Äste etwas anders geknickt
        branches = [[(x + r.uniform(-2, 2), y + r.uniform(-2, 2)) for x, y in br] for br in branches]
    for br in branches:
        p.line(br, OLD, 2.4 if len(br) > 3 else 1.8, ol=OUTLINE)
        tip = br[-1]
        p.line([tip, (tip[0] + r.uniform(-5, 5), tip[1] - r.uniform(3, 6))], OLD, 1, ol=OUTLINE)
    if leaves:
        dark_pal = ((40, 60, 40, 255), (62, 90, 54, 255), (92, 120, 66, 255), (118, 142, 80, 255))
        for cx, cy, rr in [(16, 22, 9), (80, 18, 10), (52, 12, 8), (22, 50, 7), (74, 48, 7)]:
            clump(p, cx, cy, rr, dark_pal, dashes=4)
    # hängende Bartflechten an den Ästen
    for br in branches:
        for t in (0.45, 0.8):
            (xa, ya), (xb, yb) = br[1], br[-1]
            x, y = xa + (xb - xa) * t, ya + (yb - ya) * t
            n = r.uniform(5, 10)
            p.line([(x, y + 1), (x + r.uniform(-1.5, 1.5), y + n * 0.6), (x + r.uniform(-1, 1), y + n)], LICHEN, 0.9, ol=dark(LICHEN, 0.6))
    # Wasser am Fuß: dunkler Saum und helle Wellenringe
    p.ell(48, 106, 16, 3.2, (40, 56, 52, 150), ol=False)
    for rx, ry, a in [(18, 4, 200), (25, 6, 120)]:
        box = [(48 - rx) * 8, (106 - ry) * 8, (48 + rx) * 8, (106 + ry) * 8]
        p.d.arc(box, 0, 180, fill=(200, 214, 210, a), width=8)
        p.d.arc(box, 200, 340, fill=(200, 214, 210, a // 2), width=6)
    p.save(name)


# Wollgras: grüne Halme mit weißen Wattebäuschen. Fuß bei (20, 25)
def cottongrass():
    p = Pic(40, 32)
    p.shadow(20, 25, 13, 3)
    for _ in range(9):
        x = rnd.uniform(10, 30)
        p.line([(x, 25), (x + rnd.uniform(-3, 3), 25 - rnd.uniform(5, 9))], (120, 150, 70, 255), 0.5, ol=False)
    for x, h in [(11, 13), (16, 18), (21, 15), (26, 19), (30, 12)]:
        top = (x + rnd.uniform(-1.5, 1.5), 25 - h)
        p.line([(x, 25), top], (110, 140, 70, 255), 0.5)
        p.ell(top[0], top[1] - 1, 2.6, 2.2, (250, 250, 246, 255), ol=(186, 186, 176, 255), ow=0.4)
        p.ell(top[0] - 0.7, top[1] - 1.8, 1, 0.8, (255, 255, 255, 255), ol=False)
    p.save('forest_cottongrass')


# Laubhaufen: ein richtiger, gewölbter Haufen aus orangen, roten, gelben und braunen Blättern (darin verstecken sich die
# Igel): oben links im Licht, unten rechts im Schatten, am Rand stehen Blätter und ein Zweig heraus, ein paar liegen
# daneben. Fuß bei (28, 40)
def leafpile():
    p = Pic(56, 48)
    cx, base, rx, h = 28, 40, 21, 21
    p.shadow(cx + 2, base, 24, 5.5)
    LEAVES = [(214, 124, 48), (190, 72, 40), (226, 176, 70), (162, 102, 52), (204, 104, 44), (232, 150, 60)]

    def leaf(x, y, r, col, t, ow=0.35):
        p.poly([(x + math.cos(t) * r, y + math.sin(t) * r * 0.6), (x + math.cos(t + 1.9) * r * 0.48, y + math.sin(t + 1.9) * r * 0.4),
                (x - math.cos(t) * r, y - math.sin(t) * r * 0.6), (x + math.cos(t - 1.9) * r * 0.48, y + math.sin(t - 1.9) * r * 0.4)],
               col + (255,), ol=dark(col + (255,), 0.5), ow=ow)
        p.line([(x - math.cos(t) * r * 0.7, y - math.sin(t) * r * 0.42), (x + math.cos(t) * r * 0.7, y + math.sin(t) * r * 0.42)],
               dark(col + (255,), 0.7), 0.25, ol=False)

    # lose Blätter am Boden (hinter und neben dem Haufen)
    for _ in range(7):
        x = cx + rnd.choice((-1, 1)) * rnd.uniform(rx - 2, rx + 5)
        leaf(x, base + rnd.uniform(-2.5, 1.5), rnd.uniform(1.6, 2.2), rnd.choice(LEAVES), rnd.uniform(0, math.pi))
    # Umriss: Kuppel über einer flachen Grundellipse
    top = [(cx + rx * math.cos(a), base - 1 - h * math.sin(a) ** 0.85) for a in [i / 24 * math.pi for i in range(25)]]
    bottom = [(cx - rx * math.cos(a), base - 1 + 3.5 * math.sin(a)) for a in [i / 12 * math.pi for i in range(1, 12)]]
    dome = top + bottom
    p.poly(dome, (112, 62, 30, 255), ol=OUTLINE, ow=1.1)  # dunkler Grund zwischen den Blättern
    # Blätter auf der Kuppel: von hinten oben nach vorne unten, vorne größer; Farbe nach Licht
    pts = []
    edge = lambda u: base - 1 - h * max(0, 1 - u * u) ** 0.5 ** 0.85  # Oberkante der Kuppel
    while len(pts) < 300:  # gleichmäßig über die ganze Fläche
        u = rnd.uniform(-0.97, 0.97)
        y = rnd.uniform(base - 1 - h, base + 2)
        if y < edge(u) + 1.2:
            continue
        v = (base - y) / h  # 0 unten, 1 oben
        pts.append((y, cx + u * rx, v, u))
    for i in range(34):  # Blätter auf dem Rand: der Umriss wird gezackt
        u = -0.98 + 1.96 * i / 33
        pts.append((edge(u) + 0.8, cx + u * rx, (base - edge(u)) / h, u))
    for y, x, v, u in sorted(pts):
        light_k = 0.45 + 0.4 * v - 0.3 * u  # oben links heller
        col = rnd.choice(LEAVES)
        col = tuple(max(0, min(255, int(c * (0.72 + 0.45 * light_k)))) for c in col)
        leaf(x, y, rnd.uniform(2.4, 3.4) * (1.1 - 0.2 * v), col, rnd.uniform(0, math.pi))
    # am Rand herausstehende Blätter und ein Zweig
    for a in [0.35, 0.9, 1.6, 2.3, 2.8]:
        x, y = cx + rx * math.cos(a) * 1.02, base - 1 - h * math.sin(a) ** 0.85 * 1.04
        leaf(x, y, 2.4, rnd.choice(LEAVES), a + math.pi / 2)
    p.line([(cx + 5, base - h + 4), (cx + 9, base - h - 1), (cx + 12, base - h - 2)], (110, 78, 50, 255), 0.5, ol=dark((110, 78, 50, 255), 0.5))
    p.save('forest_leafpile')


# Pilzkreis: kleine rote Fliegenpilze im Ring, liegt flach um die Kachelmitte (32, 22)
def toadstools():
    p = Pic(64, 40)
    p.ell(32, 22, 20, 9, (70, 110, 46, 90), ol=False)
    spots = sorted([(32 + math.cos(a) * 18, 22 + math.sin(a) * 8) for a in [i / 11 * math.tau + rnd.uniform(-0.15, 0.15) for i in range(11)]], key=lambda q: q[1])
    for x, y in spots:
        s = rnd.uniform(0.8, 1.15)
        p.line([(x, y), (x, y - 3.5 * s)], (240, 232, 210, 255), 1.1 * s)
        p.ell(x, y - 4 * s, 2.8 * s, 1.9 * s, (204, 54, 42, 255), ow=0.45)
        p.ell(x - 0.8 * s, y - 4.6 * s, 0.5, 0.35, (255, 250, 240, 255), ol=False)
        p.ell(x + 1 * s, y - 4.1 * s, 0.4, 0.3, (255, 250, 240, 255), ol=False)
    p.save('forest_toadstools')


# Holzsteg (eine Kachel, liegt flach über dem Moorwasser): Bretter quer, Nagelköpfe an den Enden
def boardwalk():
    p = Pic(64, 32)
    def q(u, v):  # u entlang tx, v entlang ty, je 0..1
        return (32 + (u - v) * 32, (u + v) * 16)
    m = 0  # ganze Kachel breit: so schließen die Stege in beiden Richtungen aneinander an
    n = 6
    for i in range(n):
        u0, u1 = i / n + 0.01, (i + 1) / n - 0.01
        col = WOOD if i % 2 else light(WOOD, 0.1)
        p.poly([q(u0, m), q(u1, m), q(u1, 1 - m), q(u0, 1 - m)], col, ol=dark(WOOD, 0.55), ow=0.35)
    for v in (0.08, 0.92):
        for u in (0.08, 0.92):
            x, y = q(u, v)
            p.ell(x, y, 1, 0.6, dark(WOOD, 0.45), ol=False)
    sprite_draw.save_all(p.im, 'forest_boardwalk', 64, 32)


# ---- Boden: umgefärbte Kacheln ----
def recolor(src, dst, target, detail=1.0, keep=0.0, flecks=None, seed=0):
    """Helligkeit des Vorbilds auf eine Farbe legen; flecks: [(Farbe, Anzahl, Größe)] kleine Tupfen obendrauf"""
    if not wanted(dst):
        return
    for sub, f in OUT.items():
        path = os.path.join(A, sub, src + '.png')
        if not os.path.exists(path):
            continue
        a = np.asarray(Image.open(path).convert('RGBA')).astype(float)
        lum = 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
        avg = lum[a[..., 3] > 128].mean()
        k = np.clip(1 + (lum / avg - 1) * detail, 0.5, 1.4)[..., None]
        out = a.copy()
        out[..., :3] = np.clip(np.array(target) * k * (1 - keep) + a[..., :3] * keep, 0, 255)
        im = Image.fromarray(out.astype(np.uint8), 'RGBA')
        if flecks:
            r = random.Random(seed)
            d = ImageDraw.Draw(im)
            h, w = a.shape[:2]
            for col, count, size in flecks:
                for _ in range(count):
                    x, y = r.uniform(0.1, 0.9) * w, r.uniform(0.1, 0.9) * h
                    if abs(x - w / 2) / (w / 2) + abs(y - h / 2) / (h / 2) > 0.85:
                        continue  # nur innerhalb der Raute
                    s = size * f * r.uniform(0.7, 1.2)
                    d.ellipse([x - s, y - s * 0.55, x + s, y + s * 0.55], fill=col)
        os.makedirs(os.path.join(A, sub), exist_ok=True)
        im.save(os.path.join(A, sub, dst + '.png'), optimize=True)
        if sub == 'hd':
            im.save(os.path.join(sprite_draw.EXPORT, dst + '.png'), optimize=True)
    print(dst)


for make in [birch, oak, cottongrass, leafpile, toadstools, boardwalk]:
    make()
bogtree('forest_bogtree', True, 31)
bogtree('forest_bogtree2', False, 37)
os.makedirs(sprite_draw.EXPORT, exist_ok=True)
LEAVES = [((206, 116, 46, 255), 7, 1.6), ((184, 70, 38, 255), 4, 1.5), ((222, 172, 68, 255), 5, 1.4), ((128, 86, 46, 255), 4, 1.5)]
for i in range(3):
    # Moorboden: olivgelbes Gras mit rötlichem Torfmoos
    recolor(f'fgrass{i}', f'forest_moor{i}', (128, 130, 70), detail=1.1, keep=0.15, flecks=[((150, 70, 60, 255), 3 + i, 1.8), ((168, 160, 96, 255), 4, 1.2)], seed=40 + i)
    # Laubboden: braun mit bunten Blättern
    recolor(f'fgrass{i}', f'forest_leaves{i}', (150, 112, 62), detail=1.0, keep=0.1, flecks=LEAVES, seed=60 + i)
recolor('water', 'forest_moor_water', (56, 78, 72), detail=1.2)  # dunkles, stilles Moorwasser
recolor('mud', 'forest_mud', (104, 76, 50), detail=1.1)  # Suhle
