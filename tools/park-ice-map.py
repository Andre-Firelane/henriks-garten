# Eiswelt im Tierpark (park4, siehe docs/plan-eiswelt.md): zeichnet die Karte des Abschnitts in ihre eigene
# Kartentabelle PARK_ICE_ROWS in src/world/levels.js (44 × 39 Kacheln). Kann beliebig oft laufen.
#
#   python tools/park-ice-map.py
#
# Aufbau: die Polarhalle steht groß in der Mitte (mit der großen Treppe hinunter zur Unterwasser-Scheibe), ein schmaler
# Rundweg (1 Kachel) führt um sie herum, außen liegen die Gehege. Gehege werden als Flächen (Vereinigung von Rechtecken)
# angegeben; ihre Zäune ergeben sich von selbst (alle Kacheln rund um die Fläche). Die Lagen hier müssen zu den Angaben
# der Eiswelt-Gehege (PARK_PENS) und von LEVELS.park4 in levels.js passen (Kacheln des Abschnitts).
#
# Zeichen: ṩ Füller (verschneite Tanne, ganze Kachel fest), ǩ Ǩ Glasfassade, ǯ Ʒ niedriges Glas, [ ] hoher Zaun, G Tor, # Weg (in der Halle
# Holzsteg), w Wasser im Gehege, Ɵ Ȟ Ȓ ȓ Schneefelsen, Ê Eisblock, Ṗ verschneite Tanne, U Fuchsbau, F Futterautomat,
# W Wegweiser, X Übergang ins Zentrum
import random
import sys

W, H = 44, 39  # Breite und Höhe des Abschnitts

g = [['.'] * W for _ in range(H)]
PAIRS = ['[]', 'ǩǨ', 'ǯƷ']  # Zaunarten: entlang tx, entlang ty (hoher Zaun, Glasfassade, niedriges Glas)
WALLS = ''.join(PAIRS)
rnd = random.Random(7)


def put(x, y, c):
    g[y][x] = c


def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            g[y][x] = c


def items(s):
    # "x,y,c x,y,c ..." (c ein Zeichen)
    for part in s.split():
        x, y, c = part.split(',')
        put(int(x), int(y), c)


def area(*rects, minus=()):
    tiles = set()
    for x0, y0, x1, y1 in rects:
        tiles |= {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}
    return tiles - set(minus)


def fence(tiles, along_x, along_y):
    # Zaun rund um die Fläche (alle 8 Nachbarn); entlang ty (oben/unten Zaun, links/rechts keiner) along_y, sonst along_x
    ring = set()
    for x, y in tiles:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                t = (x + dx, y + dy)
                if t not in tiles:
                    ring.add(t)
    for x, y in ring:
        if g[y][x] in WALLS:  # (gemeinsame Wand mit einem anderen Gehege)
            continue
        put(x, y, '?')
    for x, y in ring:
        if g[y][x] != '?':
            continue
        f = lambda t: t in ring or g[t[1]][t[0]] in WALLS + '?'
        vert = (f((x, y - 1)) or f((x, y + 1))) and not (f((x - 1, y)) or f((x + 1, y)))
        put(x, y, along_y if vert else along_x)
    return ring


def fix_axes():
    # nach allen Zäunen: Richtung jedes Zaunstücks neu bestimmen (gemeinsame Wände, Ecken)
    for y in range(H):
        for x in range(W):
            c = g[y][x]
            pair = next((p for p in PAIRS if c in p), None)
            if not pair:
                continue
            isf = lambda xx, yy: 0 <= xx < W and 0 <= yy < H and g[yy][xx] in WALLS + 'G'
            vert = (isf(x, y - 1) or isf(x, y + 1)) and not (isf(x - 1, y) or isf(x + 1, y))
            put(x, y, pair[1] if vert else pair[0])


# ---- Rand: Füller ringsum, links der Übergang ins Zentrum (Zeilen 24 und 25) ----
rect(0, 0, W - 1, 0, 'ṩ')
rect(0, H - 1, W - 1, H - 1, 'ṩ')
rect(0, 0, 0, H - 1, 'ṩ')
rect(W - 1, 0, W - 1, H - 1, 'ṩ')

# ---- Polarhalle in der Mitte (Glas, innen 18 × 16 Kacheln), Ecken abgerundet ----
hall = area((13, 10, 30, 25), minus=[(30, 10), (13, 25), (30, 25)])
fence(hall, 'ǩ', 'Ǩ')  # Glasfassade ohne Holz
# Pinguinbecken in der Halle: oben links (teilt sich die Hallenwand), Pflegertür rechts
penguins = area((13, 10, 22, 18))
fence(penguins, 'ǯ', 'Ʒ')  # niedriges Glas
put(23, 15, 'G')  # Pflegertür
rect(13, 10, 18, 15, 'w')
rect(13, 16, 15, 17, 'w')
items('20,10,Ȓ 19,17,ȓ 17,17,Ê 21,12,ȓ 20,15,Ê 22,18,Ȓ')
# Holzsteg: vom Eingang unten hinauf, quer vor der Pinguin-Scheibe
rect(13, 20, 26, 21, '#')
rect(20, 22, 21, 25, '#')
# große Treppe hinunter zur Unterwasser-Scheibe (2×2 Kacheln, Bild stairs_ice; die Kacheln sind Übergänge)
rect(22, 24, 23, 25, '#')
# Felsen und Tannen für Papageitaucher und Schneeeulen (frei in der Halle)
items('26,11,Ɵ 29,12,Ṗ 24,16,Ȟ 28,15,Ȓ 26,18,ȓ 29,19,Ṗ 25,23,Ȟ 28,22,Ṗ 14,23,Ṗ 16,24,Ȓ 17,22,ȓ 28,24,ȓ 24,12,Ȓ 30,16,Ṗ')

# ---- schmaler Rundweg um die Halle; vom Eingang links herüber (2 breit) ----
for r in [
    (0, 24, 10, 25),  # vom Übergang zum Rundweg
    (11, 8, 11, 27),  # links
    (11, 8, 32, 8),  # oben
    (32, 8, 32, 27),  # rechts
    (11, 27, 32, 27),  # unten, dort der Halleneingang
]:
    rect(*r, '#')
put(0, 24, 'X')
put(0, 25, 'X')
put(20, 26, 'G')  # Lamellenvorhang der Halle
put(21, 26, 'G')

# ---- Gehege rundherum ----
# Polarwölfe oben links
wolves = area((2, 2, 9, 9))
fence(wolves, '[', ']')
put(10, 8, 'G')
items('3,3,Ȟ 8,2,Ṗ 4,7,ȓ 7,5,Ȓ 2,9,Ṗ 8,9,ȓ 5,5,Ṗ')
# Polarfüchse links unter den Wölfen, mit Bau
foxes = area((2, 11, 9, 16))
fence(foxes, '[', ']')
put(10, 14, 'G')
items('5,13,U 2,11,Ṗ 9,16,ȓ 3,16,Ȓ 8,12,Ṗ')
# Schneehasen oben, links von der Mitte
hares = area((11, 2, 19, 6))
fence(hares, '[', ']')
put(16, 7, 'G')
items('11,2,Ṗ 19,2,ȓ 14,5,Ȓ 18,6,Ṗ')
# Robben & Walrosse oben rechts: langes Becken, rechts der Kiesstrand (L-Form)
seals = area((21, 2, 41, 6), (34, 7, 41, 14))
fence(seals, '[', ']')
rect(21, 2, 33, 6, 'w')
rect(34, 2, 37, 9, 'w')
put(33, 12, 'G')
items('27,3,Ê 24,5,Ê 40,4,Ȓ 41,13,ȓ 39,9,Ȓ 35,13,ȓ')
# Eisbären unten rechts: Tundra mit Badebecken, vorne ein Wassergraben (Pflegertor mit Lücke im Graben)
bears = area((22, 29, 41, 36), (34, 21, 41, 28))
fence(bears, '[', ']')
rect(22, 29, 33, 29, 'w')
rect(34, 21, 34, 29, 'w')
put(27, 28, 'G')
put(27, 29, '.')
rect(37, 31, 40, 34, 'w')
items('30,32,Ȟ 39,23,Ȓ 36,27,ȓ 24,35,Ṗ 41,26,Ṗ 33,36,Ê 27,32,ȓ 35,34,Ȓ')
# Rentiere unten links: weite Tundra
reindeer = area((2, 29, 20, 36))
fence(reindeer, '[', ']')
put(8, 28, 'G')
rect(8, 26, 8, 27, '#')
items('5,31,Ṗ 11,30,Ȓ 16,34,Ṗ 19,30,ȓ 3,36,ȓ 8,34,ȓ 13,33,Ṗ')

fix_axes()

# ---- Platz am Eingang (Futterautomat, Wegweiser, Schneemobil) ----
put(7, 22, 'F')
put(9, 23, 'W')


# verstreute Tannen und Felsen auf freiem Schnee, nicht direkt an Wegen, Toren oder Zäunen
def free_spot(x, y):
    if g[y][x] != '.':
        return False
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if g[y + dy][x + dx] not in '.ṩṖȒȓ':
                return False
    return True


keep_clear = area((1, 18, 10, 27), (33, 16, 42, 19))  # Platz am Eingang (Schneemobil mit Anhänger) und Budenplatz rechts
pens = hall | wolves | foxes | hares | seals | bears | reindeer
spots = [(x, y) for y in range(1, H - 1) for x in range(1, W - 1) if free_spot(x, y) and (x, y) not in keep_clear and (x, y) not in pens]
rnd.shuffle(spots)
for x, y in spots[:14]:
    if free_spot(x, y):
        put(x, y, rnd.choice('ṖṖṖȒȓ'))

rows = [''.join(r) for r in g]
assert all(len(r) == W for r in rows)
assert '?' not in ''.join(rows)

path = 'src/world/levels.js'
src = open(path, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in src else '\n'
i = src.index('const PARK_ICE_ROWS = [')
j = src.index('];', i)
src = src[:i] + 'const PARK_ICE_ROWS = [' + nl + ''.join(f"  '{r}',{nl}" for r in rows) + src[j:]
open(path, 'w', encoding='utf-8', newline='').write(src)
sys.stdout.reconfigure(encoding='utf-8')
print('   ' + ''.join(str(x % 10) for x in range(W)))
for y, r in enumerate(rows):
    print(f'{y:2d} {r}')
