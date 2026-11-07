"""Aufruf: python tools/redrawn-sprites.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Andres Bilder im Stil der übrigen Spielbilder nachgezeichnet (tools/sprite_draw.py: flache Flächen, dunkle Kontur, helle
Oberseite, dunklere Schattenseite), weil die Vorlagen zu fein gezeichnet sind:
- Felsen (Sprites/Felsen1.jpg, Felsen2.jpg, Felsen Kollage.jpg, Runde Steine.jpg): Wald bemooster Felshaufen und runde
  Steine; Savanne Felsgruppe und fünf einzelne Felsen
- Elefantenfriedhof (Sprites/Elefantenschädel.jpg, Elefantenrippen.jpg, Elefantenknochen1.jpg, Elefantenknochen2.jpg):
  Schädel mit Stoßzähnen, Rippen, Becken, Beinknochen
Mit dem endgültigen Dateinamen in allen Auflösungen; Vorlagen zum Nachmalen in Neue-Sprites.
ONLY=name: nur dieses eine Bild."""
import math, re, random
import sprite_draw
from sprite_draw import Pic, dark, light

sprite_draw.EXPORT = 'Neue-Sprites'
# Bilder, für die es schon Andres Fassung gibt (tools/savanna-art.py, tools/forest-art.py): nur noch Vorlage
sprite_draw.SKIP = set(re.findall(r"'(\w+)':", open('tools/savanna-art.py', encoding='utf-8').read() + open('tools/forest-art.py', encoding='utf-8').read()))

GREY = (140, 134, 124, 255)  # Wald
PEBBLE = (168, 160, 146, 255)  # runde Steine (heller, wärmer)
SAND = (170, 148, 122, 255)  # Savanne
MOSS = (96, 138, 54, 255)
MOSS2 = (132, 172, 72, 255)
DUST = (214, 190, 150, 255)
BONE = (232, 222, 196, 255)
DIRT = (150, 128, 96, 255)


def smooth(pts, n=2):
    """Ecken abrunden (Chaikin): jede Kante wird an einem und drei Vierteln geteilt"""
    for _ in range(n):
        out = []
        for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
            out += [(x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25), (x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75)]
        pts = out
    return pts


def block(p, cx, by, w, h, col, cap=None, seed=0):
    """Felsbrocken: unten bei by, w breit, h hoch, nach oben schmaler, die Oberkante schräg und unregelmäßig; Ecken leicht
    abgerundet; helle Oberseite, dunklere rechte Seite, ein Riss. cap: Polster auf der Oberseite (Moos oder Staub)"""
    r = random.Random(seed)
    j = lambda v, k=1.6: v + r.uniform(-k, k)
    tw = w * r.uniform(0.62, 0.8)  # Breite oben
    tilt = r.uniform(-0.18, 0.18) * h  # Oberkante schräg
    peak = cx + r.uniform(-0.15, 0.15) * w
    top = by - h
    lip = h * 0.3
    L, R = cx - w / 2, cx + w / 2
    tl, tr = (j(peak - tw / 2), top + tilt + 2), (j(peak + tw / 2), top - tilt + 2)
    outline = [(j(L + 1), by), (j(cx), by + 1.5), (j(R - 1), by - 0.5), (R + 1, j(by - h * 0.45)), (tr[0] + 1.5, tr[1] + lip * 0.6), tr,
               (j(peak + tw * 0.1), j(top + 0.5)), tl, (tl[0] - 1.5, tl[1] + lip * 0.6), (L - 1, j(by - h * 0.4))]
    p.poly(smooth(outline, 1), col, ow=0.9)
    # Licht von oben links: helle Facette links oben, dunkle Facette rechts, dazwischen die Grundfarbe
    ridge = (peak + tw * 0.08, top + lip * 1.3)  # Grat, an dem die Flächen zusammenstoßen
    lit = [tl, (peak + tw * 0.1, top + 0.5), ridge, (L + 1, by - h * 0.42)]
    p.poly(smooth(lit, 1), light(col, 0.2), ol=False)
    side = [(peak + tw * 0.1, top + 0.5), tr, (R + 1, by - h * 0.45), (R - 1, by - 0.5), (cx + w * 0.22, by + 1), ridge]
    p.poly(smooth(side, 1), dark(col, 0.84), ol=False)
    p.line([(peak + tw * 0.1, top + 1), ridge, (cx + w * 0.1, by)], dark(col, 0.7), 0.45, ol=False)  # Kante
    if cap == DUST:  # feiner Staub auf den oberen Flächen
        for _ in range(int(w * 0.8)):
            x, y = r.uniform(peak - tw * 0.4, peak + tw * 0.4), r.uniform(top + 2, top + lip * 1.2)
            p.ell(x, y, r.uniform(0.4, 0.9), 0.4, light(DUST, 0.1), ol=False)
    elif cap:  # Moospolster obenauf
        mid = [(tl[0] + 1, tl[1] + 1), (peak + tw * 0.1, top + 1.5), (tr[0] - 1, tr[1] + 1), (tr[0], tr[1] + lip * 0.5), (peak + tw * r.uniform(0, 0.2), top + lip * 1.05), (tl[0], tl[1] + lip * 0.55)]
        p.poly(smooth(mid, 1), cap, ow=0.5)
        for _ in range(int(w / 5)):
            x, y = r.uniform(peak - tw * 0.35, peak + tw * 0.35), r.uniform(top + 3, top + lip * 0.7)
            p.ell(x, y, 1.1, 0.7, light(cap, 0.25), ol=False)
    x0 = peak + r.uniform(-tw * 0.3, tw * 0.05)
    p.line([(x0, top + lip * 1.2), (x0 + r.uniform(-2, 2), top + h * 0.65), (x0 + r.uniform(-1, 3), by - 2)], dark(col, 0.6), 0.5, ol=False)


def stone(p, cx, cy, rx, ry, col):
    """runder Stein: unten dunkler, oben ein Glanz und etwas Staub"""
    p.ell(cx, cy, rx, ry, col, ow=0.9)
    p.ell(cx + rx * 0.15, cy + ry * 0.3, rx * 0.85, ry * 0.6, dark(col, 0.86), ol=False)
    p.ell(cx - rx * 0.25, cy - ry * 0.3, rx * 0.45, ry * 0.3, light(col, 0.3), ol=False)
    p.ell(cx + rx * 0.2, cy - ry * 0.45, rx * 0.25, ry * 0.12, DUST, ol=False)


# Wald: bemooster Felshaufen (nach Felsen1). Fuß bei (32, 47)
def forest_pile():
    p = Pic(64, 56)
    p.shadow(32, 47, 28, 6)
    block(p, 34, 40, 26, 28, GREY, MOSS, 1)
    block(p, 17, 47, 20, 20, GREY, MOSS, 2)
    block(p, 48, 47, 20, 24, GREY, MOSS, 3)
    block(p, 31, 51, 18, 12, GREY, MOSS, 4)
    p.save('forest_boulder')


# Wald: drei runde Steine (nach Runde Steine). Fuß bei (32, 47)
def forest_round():
    p = Pic(64, 56)
    p.shadow(32, 47, 26, 6)
    stone(p, 20, 36, 12, 10, PEBBLE)
    stone(p, 44, 34, 13, 10, PEBBLE)
    stone(p, 33, 42, 15, 11, PEBBLE)
    p.save('forest_boulder2')


# Savanne: Felsgruppe (nach Felsen2), staubig statt bemoost. Fuß bei (64, 82)
def kopje():
    p = Pic(128, 96)
    p.shadow(64, 82, 54, 11)
    block(p, 66, 66, 44, 46, SAND, DUST, 11)
    block(p, 34, 74, 32, 34, SAND, DUST, 12)
    block(p, 96, 77, 36, 34, SAND, DUST, 13)
    block(p, 64, 86, 30, 20, SAND, DUST, 14)
    block(p, 22, 86, 22, 14, SAND, None, 15)
    p.save('savanna_kopje')


# Savanne: einzelne Felsen (nach der Felsen-Kollage), alle im Rahmen 64 x 56, Fuß bei (32, 49)
def slabs():
    p = Pic(64, 56)
    p.shadow(32, 49, 26, 6)
    for cx, by, w, seed in [(24, 44, 30, 21), (42, 49, 28, 22)]:
        block(p, cx, by, w, 9, SAND, DUST, seed)
    p.save('savanna_rock0')


def cluster():
    p = Pic(64, 56)
    p.shadow(32, 49, 26, 6)
    block(p, 30, 40, 20, 26, SAND, DUST, 31)
    block(p, 44, 45, 20, 22, SAND, DUST, 32)
    block(p, 18, 48, 14, 12, SAND, None, 33)
    block(p, 36, 51, 16, 12, SAND, DUST, 34)
    p.save('savanna_rock1')


def stepped():
    p = Pic(64, 56)
    p.shadow(32, 49, 28, 6)
    block(p, 32, 51, 48, 12, SAND, DUST, 41)
    block(p, 32, 42, 34, 12, SAND, DUST, 42)
    block(p, 32, 33, 18, 12, SAND, DUST, 43)
    p.save('savanna_rock2')


def tall():
    p = Pic(64, 56)
    p.shadow(32, 49, 18, 5)
    block(p, 32, 50, 28, 40, SAND, DUST, 51)
    block(p, 44, 51, 10, 10, SAND, None, 52)
    p.save('savanna_rock3')


def rubble():
    p = Pic(64, 56)
    p.shadow(32, 49, 22, 5)
    block(p, 30, 46, 18, 12, SAND, DUST, 61)
    block(p, 42, 49, 12, 8, SAND, None, 62)
    block(p, 20, 50, 10, 6, SAND, None, 63)
    for x, y in [(48, 51), (14, 52), (36, 52)]:
        p.ell(x, y, 1.8, 1.2, SAND, ow=0.4)
    p.save('savanna_rock4')


def bone(p, a, b, w):
    """Röhrenknochen von a nach b: Schaft und an beiden Enden zwei Knubbel"""
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy) or 1
    nx, ny = -dy / n, dx / n
    knobs = [(x + s * nx * w * 0.55, y + s * ny * w * 0.55) for x, y in (a, b) for s in (1, -1)]
    for x, y in knobs:
        p.ell(x, y, w * 0.75, w * 0.7, BONE, ow=0.7)
    p.line([a, b], BONE, w, ol=dark(BONE, 0.45))
    p.line([(a[0] + nx * w * 0.2, a[1] + ny * w * 0.2), (b[0] + nx * w * 0.2, b[1] + ny * w * 0.2)], dark(BONE, 0.88), w * 0.35, ol=False)
    for x, y in knobs:  # Knubbel über dem Schaft
        p.ell(x, y, w * 0.62, w * 0.58, BONE, ol=False)


def spots(p, r, x0, x1, y0, y1, n):
    """Erdflecken auf den Knochen"""
    for _ in range(n):
        p.ell(r.uniform(x0, x1), r.uniform(y0, y1), r.uniform(0.6, 1.4), r.uniform(0.4, 0.9), DIRT, ol=False)


def tusk(p, base, length, height, w):
    """gebogener Stoßzahn: dick an der Wurzel, spitz am Ende, nach oben gebogen"""
    top, bottom = [], []
    for i in range(15):
        t = i / 14
        cx = base[0] - t * length
        cy = base[1] - math.sin(t * math.pi * 0.62) * height - t * t * height * 0.35
        ww = w * (1 - t) + 0.5
        top.append((cx, cy - ww))
        bottom.append((cx + ww * 0.4, cy + ww))
    p.poly(top + bottom[::-1], (242, 234, 212, 255), ow=0.8)
    p.line([(x + 0.6, y + 1.2) for x, y in top[1:-2]], dark(BONE, 0.9), 0.5, ol=False)


# Elefantenschädel mit zwei Stoßzähnen (nach Elefantenschädel.jpg). Fuß bei (40, 57)
def skull():
    p = Pic(80, 64)
    p.shadow(42, 57, 32, 6)
    tusk(p, (46, 52), 36, 30, 3.6)  # hinterer Stoßzahn
    head = [(34, 54), (30, 42), (34, 28), (44, 18), (58, 15), (70, 20), (76, 32), (74, 44), (66, 52), (54, 56)]
    p.poly(smooth(head, 2), BONE, ow=1)
    p.poly(smooth([(58, 15), (70, 20), (76, 32), (74, 44), (66, 52), (60, 40), (62, 26)], 1), dark(BONE, 0.88), ol=False)
    p.poly(smooth([(44, 20), (56, 17), (60, 26), (52, 30), (44, 28)], 1), light(BONE, 0.35), ol=False)
    p.ell(56, 32, 5, 4.5, (70, 58, 46, 255), ol=dark(BONE, 0.5), ow=0.6)  # Augenhöhle
    p.ell(40, 40, 4.5, 3.6, (70, 58, 46, 255), ol=dark(BONE, 0.5), ow=0.6)  # Nasenöffnung
    p.line([(64, 22), (66, 30), (63, 36)], dark(BONE, 0.6), 0.5, ol=False)  # Riss
    p.poly(smooth([(54, 54), (66, 52), (70, 58), (58, 60)], 1), BONE, ow=0.8)  # Unterkiefer
    spots(p, random.Random(71), 40, 72, 22, 50, 7)
    tusk(p, (40, 54), 34, 34, 4)  # vorderer Stoßzahn
    p.save('savanna_skull')


# Rippen: Wirbelsäule im Bogen, darunter gebogene Rippen (nach Elefantenrippen.jpg). Fuß bei (44, 57)
def ribs():
    p = Pic(88, 64)
    p.shadow(44, 57, 36, 6)
    spine = [(14 + i * 6.2, 16 + (i - 5) ** 2 * 0.28) for i in range(11)]
    for k, (x, y) in enumerate(spine[1:-1]):  # Rippen (hinten kleiner)
        reach = 34 - k * 1.4
        pts = [(x - 2 + math.sin(t * 1.4) * 9 - t * 6, y + t * reach) for t in [j / 10 for j in range(11)]]
        p.line(pts, BONE, 2.2, ol=dark(BONE, 0.45))
    p.line(spine, BONE, 4, ol=dark(BONE, 0.45))
    for x, y in spine:  # Wirbel
        p.poly([(x - 2.5, y), (x - 1, y - 5), (x + 1.5, y - 5), (x + 2.5, y)], BONE, ow=0.6)
        p.ell(x, y, 2.6, 2.2, light(BONE, 0.2), ow=0.5)
    spots(p, random.Random(72), 16, 72, 14, 40, 6)
    p.save('savanna_ribs')


# Becken mit zwei Löchern und einem Oberschenkelknochen (nach Elefantenknochen1.jpg). Fuß bei (32, 46)
def pelvis():
    p = Pic(64, 52)
    p.shadow(32, 46, 24, 5)
    bone(p, (40, 34), (56, 44), 3.2)  # Oberschenkel
    for side in (-1, 1):
        wing = [(32, 34), (32 + side * 4, 22), (32 + side * 12, 12), (32 + side * 20, 14), (32 + side * 22, 26), (32 + side * 14, 36), (32 + side * 8, 44)]
        p.poly(smooth(wing, 2), BONE if side < 0 else dark(BONE, 0.92), ow=0.9)
        p.ell(32 + side * 12, 26, 3.6, 4.6, (70, 58, 46, 255), ol=dark(BONE, 0.5), ow=0.5)  # Loch
    p.poly(smooth([(28, 20), (36, 20), (37, 36), (32, 42), (27, 36)], 1), light(BONE, 0.2), ow=0.8)  # Kreuzbein
    for y in (24, 29, 34):
        p.line([(29, y), (35, y)], dark(BONE, 0.6), 0.5, ol=False)
    spots(p, random.Random(73), 12, 52, 14, 40, 6)
    p.save('savanna_pelvis')


# Beinknochen: langer Knochen schräg, ein kurzer darüber, ein Wirbel (nach Elefantenknochen2.jpg). Fuß bei (28, 35)
def leg_bones():
    p = Pic(56, 40)
    p.shadow(28, 35, 22, 4)
    bone(p, (12, 34), (44, 10), 3.6)
    bone(p, (14, 18), (28, 30), 2.6)
    p.ell(42, 32, 4.2, 3, BONE, ow=0.7)  # Wirbel
    p.ell(42, 30, 1.5, 2.6, BONE, ow=0.5)
    p.ell(42, 32, 1.4, 1.1, dark(BONE, 0.6), ol=False)
    spots(p, random.Random(74), 14, 44, 12, 32, 4)
    p.save('savanna_bones')


for make in [forest_pile, forest_round, kopje, slabs, cluster, stepped, tall, rubble]:  # Knochen (skull …): vorerst Andres Bilder (tools/savanna-art.py)
    make()
