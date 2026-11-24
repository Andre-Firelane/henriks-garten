# Eiswelt im Tierpark (park4, siehe docs/plan-eiswelt.md): zeichnet den Abschnitt rechts neben dem Zentrum in die
# ganze Tierpark-Karte (PARK_ROWS in src/world/levels.js, Zeilen 24 bis 58, Spalten 56 bis 95). Kann beliebig oft laufen:
# die Zeilen werden vorher auf ihre 56 Zeichen (das Zentrum) gekürzt.
#
#   python tools/park-ice-map.py
#
# Aufbau: die Polarhalle steht in der Mitte (mit der großen Treppe hinunter zur Unterwasser-Scheibe), ein geschwungener
# Rundweg führt um sie herum, außen liegen die Gehege in unregelmäßigen Formen. Gehege werden als Flächen (Vereinigung
# von Rechtecken) angegeben; ihre Zäune ergeben sich von selbst (alle Kacheln rund um die Fläche).
#
# Zeichen: ṩ Füller (verschneite Tanne, ganze Kachel fest), ǩ Ǩ Glasfassade, ǯ Ʒ niedriges Glas, [ ] hoher Zaun, G Tor, # Weg (in der Halle
# Holzsteg), w Wasser im Gehege, Ɵ Ȟ Ȓ ȓ Schneefelsen, Ê Eisblock, Ṗ verschneite Tanne, U Fuchsbau, F Futterautomat,
# W Wegweiser, X Übergang ins Zentrum
import random
import re
import sys

W, H = 40, 35  # Breite und Höhe des Abschnitts
X0, Y0 = 56, 24  # Lage in der ganzen Karte

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


# ---- Rand: Füller ringsum, links der Übergang ins Zentrum (Zeilen 22 und 23) ----
rect(0, 0, W - 1, 0, 'ṩ')
rect(0, H - 1, W - 1, H - 1, 'ṩ')
rect(0, 0, 0, H - 1, 'ṩ')
rect(W - 1, 0, W - 1, H - 1, 'ṩ')

# ---- Polarhalle in der Mitte (Glas), Ecken abgerundet ----
hall = area((14, 10, 25, 20), minus=[(25, 10), (14, 20), (25, 20)])
fence(hall, 'ǩ', 'Ǩ')  # Glasfassade ohne Holz
# Pinguinbecken in der Halle: die linke Hälfte (teilt sich die Hallenwand), Pflegertür rechts
penguins = area((14, 10, 20, 15))
fence(penguins, 'ǯ', 'Ʒ')  # niedriges Glas
put(21, 13, 'G')  # Pflegertür
rect(14, 10, 17, 13, 'w')
rect(14, 14, 15, 14, 'w')
items('19,10,Ȓ 18,15,ȓ 16,15,Ê 20,11,ȓ 19,13,Ê')
# Holzsteg: vom Eingang unten hinauf, quer vor der Pinguin-Scheibe
rect(19, 19, 20, 20, '#')
rect(14, 17, 22, 18, '#')
# große Treppe hinunter zur Unterwasser-Scheibe (2×2 Kacheln, Bild stairs_ice; die Kacheln sind Übergänge)
rect(21, 19, 22, 20, '#')
# Felsen und Tannen für Papageitaucher und Schneeeulen (frei in der Halle)
items('24,11,Ɵ 23,15,Ȟ 25,13,Ṗ 22,10,Ȓ 24,19,Ȟ 25,17,Ṗ 14,19,Ṗ 16,20,Ȓ 17,19,ȓ 23,17,ȓ')

# ---- Rundweg um die Halle, mit Biegungen; vom Eingang links herüber ----
for r in [
    (0, 22, 9, 23),  # vom Übergang zum Rundweg
    (9, 7, 10, 16), (10, 16, 11, 24),  # links (knickt nach rechts)
    (9, 6, 18, 7), (18, 5, 29, 6),  # oben (mit Stufe)
    (28, 6, 29, 22),  # rechts
    (10, 23, 20, 24), (19, 22, 29, 23),  # unten (mit Stufe), dort der Halleneingang
]:
    rect(*r, '#')
put(0, 22, 'X')
put(0, 23, 'X')
put(19, 21, 'G')  # Lamellenvorhang der Halle
put(20, 21, 'G')

# ---- Gehege rundherum ----
# Polarwölfe oben links (großes L)
wolves = area((2, 2, 7, 4), (2, 5, 6, 9))
fence(wolves, '[', ']')
put(7, 7, 'G')
rect(8, 7, 8, 7, '#')
items('3,3,Ȟ 6,3,Ṗ 4,7,ȓ 5,5,Ȓ 2,9,Ṗ 6,9,ȓ')
# Polarfüchse links unter den Wölfen, mit Bau
foxes = area((2, 11, 6, 15))
fence(foxes, '[', ']')
put(7, 13, 'G')
rect(8, 13, 8, 13, '#')
items('4,13,U 2,11,Ṗ 6,15,ȓ 3,15,Ȓ')
# Schneehasen oben in der Mitte
hares = area((12, 2, 16, 3), (11, 3, 13, 3))
fence(hares, '[', ']')
put(15, 4, 'G')
items('12,2,Ṗ 16,2,ȓ')
# Robben & Walrosse oben rechts: lang gezogenes Becken mit Kiesstrand rechts (L-Form)
seals = area((20, 2, 30, 3), (31, 2, 37, 10), (33, 11, 37, 12))
fence(seals, '[', ']')
rect(20, 2, 30, 3, 'w')
rect(31, 2, 34, 7, 'w')
put(35, 2, 'w')
put(31, 8, 'w')
put(30, 9, 'G')
items('25,2,Ê 36,4,Ȓ 37,9,ȓ 35,11,Ȓ 33,9,ȓ')
# Eisbären unten rechts: Tundra mit Badebecken, vorne ein Wassergraben (Pflegertor mit Lücke im Graben)
bears = area((22, 27, 37, 32), (32, 18, 37, 26))
fence(bears, '[', ']')
rect(22, 27, 31, 27, 'w')
rect(32, 18, 32, 27, 'w')
put(26, 26, 'G')
put(26, 27, '.')
rect(26, 25, 26, 25, '#')
rect(34, 29, 36, 31, 'w')
items('29,30,Ȟ 35,21,Ȓ 33,26,ȓ 24,31,Ṗ 37,24,Ṗ 31,32,Ê 27,29,ȓ')
# Rentiere unten links: weite Tundra
reindeer = area((2, 27, 20, 32), (13, 26, 20, 26))
fence(reindeer, '[', ']')
put(8, 26, 'G')
rect(8, 25, 8, 25, '#')
items('5,29,Ṗ 11,28,Ȓ 16,31,Ṗ 19,28,ȓ 3,32,ȓ 8,31,ȓ')

fix_axes()

# ---- Platz am Eingang (Futterautomat, Wegweiser, Schneemobil) und Deko zwischen Weg und Halle ----
put(7, 20, 'F')
put(8, 21, 'W')
# verstreute Tannen und Felsen auf freiem Schnee, nicht direkt an Wegen, Toren oder Zäunen
def free_spot(x, y):
    if g[y][x] != '.':
        return False
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if g[y + dy][x + dx] not in '.ṩṖȒȓ':
                return False
    return True


keep_clear = area((1, 17, 8, 21), (34, 13, 37, 16))  # Platz am Eingang (Schneemobil mit Anhänger) und Budenplatz rechts
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
i = src.index('const PARK_ROWS = [')
j = src.index('];', i)
block = src[i:j]
lines = block.split('\n')
# Zeilen der Karte: jede beginnt mit Leerzeichen und einem '
row_idx = [k for k, l in enumerate(lines) if re.match(r"^\s+'", l)]
assert len(row_idx) == 98, len(row_idx)
for y in range(H):
    k = row_idx[Y0 + y]
    m = re.match(r"^(\s+)'(.*)',(\r?)$", lines[k])
    indent, row, cr = m.group(1), m.group(2), m.group(3)
    row = row[:X0]
    assert len(row) == X0, (Y0 + y, len(row))
    lines[k] = f"{indent}'{row}{rows[y]}',{cr}"
src = src[:i] + '\n'.join(lines) + src[j:]
open(path, 'w', encoding='utf-8', newline='').write(src)
sys.stdout.reconfigure(encoding='utf-8')
for y, r in enumerate(rows):
    print(f'{y:2d} {r}')
