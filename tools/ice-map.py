"""Eiswelt-Karte (46 x 64) erzeugen: oben Meer mit zwei kleinen Inseln, Küste mit Forschungsstation und Schneemobil,
rechts der Fjord (vom offenen Meer bis zum Gletscher) mit Vogelfelsen an den Ufern, unten die Tundra mit der Taiga
(verschneite Tannen) am Rand.
Aufruf: python tools/ice-map.py [Vorschau.png]  -> gibt die Zeilen für ICE_ROWS in src/world/levels.js aus
(danach von Hand nachbessern ist erlaubt; das Skript ist nur der Startpunkt). Plan: docs/plan-eiswelt.md"""
import sys, math, random

W, H = 46, 64
R = random.Random(46064)
g = [['.'] * W for _ in range(H)]

def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = c

# Meer oben (Zeilen 0 bis 16) und Streifen an den Seiten neben der Küste
for y in range(0, 17):
    for x in range(W):
        g[y][x] = '~'
for y in range(17, 30):
    for x in (0, 1, 2):
        g[y][x] = '~'
for y in range(17, 36):
    for x in (43, 44, 45):
        g[y][x] = '~'

# zwei kleine Inseln (unregelmäßige Ellipsen), Südufer bis Zeile 12
def island(cx, cy, rx, ry):
    for y in range(H):
        for x in range(W):
            a = math.atan2(y - cy, x - cx)
            wob = 1 + 0.12 * math.sin(3 * a + cx) + 0.07 * math.cos(5 * a + cy)
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= wob * wob:
                g[y][x] = '.'
island(9, 7.5, 6.2, 4.6)
island(36, 7.5, 6.2, 4.6)

# Nordküste des Festlands etwas unregelmäßig
for x in range(3, 43):
    if R.random() < 0.18:
        g[17][x] = '~'

# Fjord: vom Meer rechts (Spalte 45) nach links bis zur Gletscherwand, Zeilen 30 bis 35, Ufer leicht gewellt
for x in range(24, W):
    top = 30 + (1 if math.sin(x * 0.7) > 0.6 else 0)
    bot = 35 - (1 if math.cos(x * 0.55) > 0.7 else 0)
    for y in range(top, bot + 1):
        g[y][x] = '~'
# Gletscher am Ende des Fjords: begehbare Eisfläche (Bodenzone glacier in levels.js), an der Abbruchkante zum Wasser
# ein paar Eisblöcke
GLACIER = (13, 23, 27, 38)  # tx0, tx1, ty0, ty1
for y in (29, 31, 32, 34, 35):
    g[y][23] = 'Ê'

# Station (wie bisher, gleiche Kacheln) und Regal davor
hut = ['MMMMM', 'NɃ,,N', 'Nɓ,,G', 'MMMMM']
for j, row in enumerate(hut):
    for i, c in enumerate(row):
        g[19 + j][19 + i] = c
g[23][21] = 'c'

# Wege
def path(points):
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        for x in range(min(x0, x1), max(x0, x1) + 1):
            for y in range(min(y0, y1), max(y0, y1) + 1):
                if g[y][x] in '.ê':
                    g[y][x] = '#'
path([(24, 21), (24, 18), (9, 18), (9, 17)])     # zur Fähre auf Insel A
path([(24, 18), (36, 18), (36, 17)])             # zur Fähre auf Insel B
path([(24, 21), (24, 26), (10, 26), (10, 42)])   # am Gletscher vorbei in die Tundra
path([(10, 42), (32, 42), (32, 38)])             # zu den Vogelfelsen am Südufer
path([(9, 12), (9, 9)])                          # Inseln: von der Fähre zur Kiste
path([(36, 12), (36, 9)])

# Vogelfelsen: große Felsen am Nord- und Südufer des Fjords, einer als Felsinsel im Wasser
for x, y, c in [(27, 29, 'Ɵ'), (33, 29, 'Ȟ'), (39, 29, 'Ɵ'), (28, 36, 'Ȟ'), (36, 36, 'Ɵ'), (41, 36, 'Ȟ'), (31, 33, 'Ɵ'), (36, 33, 'Ȟ'), (41, 32, 'Ɵ')]:  # die drei im Wasser: Felsinseln der Papageitaucher
    g[y][x] = c

# Kisten
for x, y in [(8, 7), (37, 7), (10, 50), (34, 39)]:
    g[y][x] = 'e'

# Taiga am unteren Rand: dichte verschneite Tannen (Ṗ), nach oben lockerer; an den Seiten Felsen, Eisblöcke und Tannen
for y in range(36, H):
    for x in range(W):
        if g[y][x] != '.':
            continue
        fromBottom = H - 1 - y
        side = min(x, W - 1 - x)
        if fromBottom <= 1 or (fromBottom <= 4 and R.random() < 0.75 - fromBottom * 0.12):
            g[y][x] = 'Ṗ'
        elif side == 0 or (side == 1 and R.random() < 0.55):
            g[y][x] = R.choice('ȒȒÊêṖṖ')
for y in range(30, 36):
    for x in (0, 1):
        if g[y][x] == '.':
            g[y][x] = R.choice('ȒÊ')

# Tundra: verstreute Felsen, Geröll, Eissteine (nicht auf und direkt neben Wegen)
def free(x, y):
    return all(g[yy][xx] == '.' for yy in range(y - 1, y + 2) for xx in range(x - 1, x + 2) if 0 <= xx < W and 0 <= yy < H)
for c, n in [('Ȓ', 18), ('ȓ', 22), ('ê', 10), ('Ê', 3), ('Ɵ', 2), ('Ṗ', 16)]:
    k = 0
    while k < n:
        x, y = R.randrange(3, W - 3), R.randrange(39, H - 6)
        if free(x, y):
            g[y][x] = c
            k += 1
# Küste: ein paar Eissteine und Eisblöcke
for c, n in [('ê', 10), ('Ê', 4)]:
    k = 0
    while k < n:
        x, y = R.randrange(4, 42), R.randrange(19, 29)
        if free(x, y) and not (17 <= x <= 25 and 18 <= y <= 24) and not (GLACIER[0] <= x <= GLACIER[1] and GLACIER[2] <= y <= GLACIER[3]):
            g[y][x] = c
            k += 1
# Inseln
for c, n in [('ê', 4), ('Ê', 2)]:
    for cx in (9, 36):
        k = 0
        while k < n:
            x, y = R.randrange(cx - 5, cx + 6), R.randrange(4, 11)
            if free(x, y):
                g[y][x] = c
                k += 1

rows = [''.join(r) for r in g]
for r in rows:
    print(f"  '{r}',")

if len(sys.argv) > 1:
    from PIL import Image, ImageDraw
    col = {'~': (40, 90, 150), '.': (235, 240, 245), '#': (190, 170, 130), 'Ê': (150, 200, 230), 'ê': (170, 210, 235),
           'Ɵ': (90, 90, 95), 'Ṗ': (40, 90, 60), 'Ȟ': (110, 110, 115), 'Ȓ': (130, 130, 135), 'ȓ': (175, 175, 180), 'e': (200, 60, 60), 'c': (200, 60, 60)}
    S = 10
    im = Image.new('RGB', (W * S, H * S))
    d = ImageDraw.Draw(im)
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            fill = col.get(c, (230, 150, 40))
            if c == '.' and GLACIER[0] <= x <= GLACIER[1] and GLACIER[2] <= y <= GLACIER[3]:
                fill = (180, 215, 240)  # Gletscher
            elif c == '.' and (y >= 36 or (x <= 20 and y >= 26)):
                fill = (200, 210, 190)  # Tundra-Zone
            d.rectangle([x * S, y * S, x * S + S - 1, y * S + S - 1], fill=fill)
    im.save(sys.argv[1])
