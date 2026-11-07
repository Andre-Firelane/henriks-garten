"""Aufruf: python tools/forest-art.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Echte Bilder für den Wald (Sprites/scenario-assets-wald) an die Stelle der Platzhalter setzen (Vorlagen: Wald-Sprites/Neu,
siehe tools/art_place.py). Beim umgestürzten Stamm wird der Wurzelteller am hinteren Ende abgeschnitten.
Die Holzbrücke (Sprites/Brücke Wald.png) wird in zwei Bilder geteilt: vorderes Geländer und der Rest (siehe unten)."""
import math, os
from collections import deque
import numpy as np
from PIL import Image, ImageDraw
from art_place import A, F, OUT, crop, install

SRC = 'Sprites/scenario-assets-wald'
REF = 'Wald-Sprites/Neu'  # Platzhalter aus tools/forest-placeholders.py

src = lambda n: n if isinstance(n, str) else f'{SRC}/Wald_neu{"" if n == 0 else f"-{n}"}.png'
ART = {
    'forest_bat0': 0, 'forest_bat1': 2, 'forest_bird': 3, 'forest_bird_fly0': 4, 'forest_bird_fly1': 5,
    'forest_cave': 'Sprites/Höhle.jpg', 'forest_elder': 8, 'forest_foxglove': 9, 'forest_hazel': 10, 'forest_log_bridge': 11, 'forest_moss0': 12,
    'forest_moss1': 13, 'forest_mossy_log': 14, 'forest_river_rock': 15, 'forest_stand': 16, 'forest_stump': 17,
}
REFS = {}

SHRINK = {'forest_cave': 0.75}  # die Höhle etwas kleiner als der Platzhalter
CUT = (0.796, 0.248)  # Stamm: hier (Anteil von Breite und Höhe) quer zur Stammachse abschneiden, dahinter liegt der Wurzelteller
AXIS = (0.892, -0.452)  # Richtung der Stammachse (nach hinten oben rechts)


def prepare(key, im):
    if key != 'forest_log_bridge':
        return im
    a = np.asarray(im).copy()
    h, w = a.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w]
    along = (xs - CUT[0] * w) * AXIS[0] + (ys - CUT[1] * h) * AXIS[1]
    a[along > 0, 3] = 0
    edge = (along > -6) & (along <= 0) & (a[..., 3] > 0)  # dunkle Kontur an der Schnittkante
    a[edge, :3] = (62, 36, 22)
    return Image.fromarray(a)


install(ART, REF, src, prepare=prepare, shrink=SHRINK, refs=REFS)
# Felsen: Andres Fassungen der Zeichnungen aus tools/redrawn-sprites.py (Vorlagen in Neue-Sprites)
SRC2 = 'Sprites/scenario-assets-savanne-und-felsen'
install({'forest_boulder': 0, 'forest_boulder2': 2}, 'Neue-Sprites', lambda n: f'{SRC2}/Wald_neu{"" if n == 0 else f"-{n}"}.png')


# Holzbrücke (drei Kacheln entlang tx): so breit eingepasst, dass die Enden genau auf der gezeichneten Brücke
# (Vorlage Wald-Sprites/Neu/wood_bridge.png, Maße wie wood_bridge() in tools/forest-placeholders.py) liegen. Das vordere
# Geländer kommt in ein eigenes Bild, damit Henrik auf der Brücke dahinter steht (siehe drawBridges in GardenScene).
# Getrennt wird nach Flächen zwischen den dunklen Konturen: was ganz im Streifen vor der Vorderkante bis BRIDGE_RAIL
# darüber liegt (Pfosten, Handläufe, Plankenstücke dazwischen), ist vorne; das übrige Deck reicht weiter nach hinten.
# BRIDGE_TOP: so viel Platz oben (alte Größe)
BRIDGE = {'src': 'Sprites/Brücke Wald.png', 'ref': f'{REF}/wood_bridge.png', 'len': 3, 'ox': 42, 'oy': 32}
BRIDGE_TOP = 2
BRIDGE_RAIL = 30
DARK = 80  # dunkler als das: Kontur


def bridge():
    if os.environ.get('ONLY') not in (None, 'forest_bridge'):
        return
    ref = Image.open(BRIDGE['ref']).convert('RGBA')
    new = crop(Image.open(BRIDGE['src']).convert('RGBA'))
    a = np.asarray(ref)
    ys, xs = np.nonzero(a[..., 3] > 150)
    x0, x1, y1 = xs.min(), xs.max() + 1, ys.max() + 1
    k = (x1 - x0) / new.width
    new = new.resize((round(new.width * k), round(new.height * k)), Image.LANCZOS)
    top = BRIDGE_TOP * F
    full = Image.new('RGBA', (ref.width, ref.height + top))
    full.alpha_composite(new, (int(x0), int(y1 + top - new.height)))
    # Streifen des vorderen Geländers: zwischen Vorderkante (etwas darunter) und BRIDGE_RAIL darüber
    n, arch = BRIDGE['len'], min(14, 3 + BRIDGE['len'] * 2.5)
    def pt(u, v, h):
        lift = math.sin(math.pi * min(max(u, 0), n) / n) * arch
        return ((BRIDGE['ox'] + (u - v) * 32) * F, (BRIDGE['oy'] + BRIDGE_TOP + (u + v) * 16 - lift - h) * F)
    us = [-0.2 + i * 0.05 for i in range(int((n + 0.4) / 0.05) + 1)]
    mask = Image.new('L', full.size)
    ImageDraw.Draw(mask).polygon([pt(u, 1, BRIDGE_RAIL) for u in us] + [pt(u, 1, -5) for u in reversed(us)], fill=255)
    band = np.asarray(mask) > 0
    rgba = np.asarray(full)
    lum = rgba[..., :3].astype(int) @ np.array([30, 59, 11]) // 100
    light = (rgba[..., 3] > 128) & (lum > DARK)
    m = np.zeros(band.shape, bool)
    seen = np.zeros(band.shape, bool)
    hgt, wid = band.shape
    for y0 in range(hgt):
        for x0 in range(wid):
            if not light[y0, x0] or seen[y0, x0]:
                continue
            comp = []
            q = deque([(x0, y0)])
            seen[y0, x0] = True
            while q:
                x, y = q.popleft()
                comp.append((y, x))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < wid and 0 <= ny < hgt and light[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((nx, ny))
            ys_, xs_ = np.array(comp).T
            if band[ys_, xs_].mean() > 0.97:
                m[ys_, xs_] = True
    # die Konturen um die vorderen Flächen gehören dazu
    grow = m.copy()
    for _ in range(3 * F // 2):
        g = grow.copy()
        g[1:] |= grow[:-1]; g[:-1] |= grow[1:]; g[:, 1:] |= grow[:, :-1]; g[:, :-1] |= grow[:, 1:]
        grow = g
    m |= grow & band & (rgba[..., 3] > 0) & ~light
    front = rgba.copy()
    front[~m, 3] = 0
    back = rgba.copy()
    back[m, 3] = 0
    w, h = full.width // F, full.height // F
    for name, im in [('forest_bridge', back), ('forest_bridge_front', front)]:
        img = Image.fromarray(im)
        for sub, f in OUT.items():
            img.resize((w * f, h * f), Image.LANCZOS).save(os.path.join(A, sub, name + '.png'), optimize=True)
        print(name, w, 'x', h)


bridge()
