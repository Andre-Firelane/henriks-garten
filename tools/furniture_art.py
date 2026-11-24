"""Gemalte Möbelbilder (Sprites/Möbel/) statt der gezeichneten Körper aus tools/furniture-sprites.py.
Wird von furniture-sprites.py benutzt: dort entsteht je Ansicht weiter das gezeichnete Bild (Größe, Fußpunkt, Schatten,
Trophäen-Plätze, Schwimmraum). Gibt es hier ein Bild für die Ansicht, wird es in den Umriss des gezeichneten Körpers
eingepasst und auf dessen Schatten gesetzt. Fehlende Ansichten: gespiegelt (mirror) oder weiter gezeichnet (nicht in ART).
Schreibtische und Regale: Holz auf die Farbe des Stils umgefärbt (wood). Eiswelt-Möbel bleiben gezeichnet."""
import colorsys
import numpy as np
from PIL import Image, ImageFilter, ImageOps

SRC = 'Sprites/Möbel/'

# Teppiche aus einem Bild (weißer Grund): Ausschnitt (x0, y0, x1, y1) in Sprites/Möbel/Teppiche.webp
RUGS = {
    'office_rug': (5, 165, 355, 370),
    'rug_asia': (350, 150, 680, 360),
    'rug_forest': (680, 150, 1000, 360),
    'rug_meadow': (5, 540, 355, 770),
    'rug_ice': (340, 545, 675, 780),
    'rug_savanna': (670, 540, 1005, 775),
}


def V(src, mirror=False, wood=None, fit='box', snow=False, stone=False):
    return dict(src=src, mirror=mirror, wood=wood, fit=fit, snow=snow, stone=stone)


def four(a, b, c=None, d=None, **kw):
    """vier Ansichten aus zwei bis vier Bildern; fehlende gespiegelt"""
    return [V(a, **kw), V(b, **kw), V(c, **kw) if c else V(a, True, **kw), V(d, **kw) if d else V(b, True, **kw)]


ART = {
    'office_sofa': [V('Sofa 0'), V('Sofa 0', True), V('Sofa 2'), V('Sofa 2', True)],
    'office_armchair': [V('Sessel 1', True), V('Sessel 1'), V('Sessel 3', True), V('Sessel 3')],
    'office_table': [V('Tisch', fit='uniform')],
    'office_monstera': [V('Monstera', fit='uniform')],
    'computer_desk': [V('Computer 1'), V('Computer 1', True), V('Computer 2'), V('Computer 2', True)],
    'office_rug': [V('rug:office_rug'), V('rug:office_rug', True)],
    'trophy_plinth': [V('Sockel')],
    'trophy_case': [V('Vitrine')],
    'aquarium': [V('Aquarium 0'), V('Aquarium 1')],
    'bed_savanna': [V('Himmelbett 0'), V('Himmelbett 0', True), V('Himmelbett 2'), V('Himmelbett 2', True)],
    'bed_jungle': [V('Haengematte 0'), V('Haengematte 0', True)],
    'stove_meadow': [V('Kachelofen 0'), V('Kachelofen 1'), V('Kachelofen 2'), V('Kachelofen 3')],
    'fireplace_forest': [V('Kamin 0'), V('Kamin 0', True), V('Kamin 2', stone=True), V('Kamin 2', True, stone=True)],
    'drums_savanna': [V('Trommelecke 0'), V('Trommelecke 1'), V('Trommelecke 0', True), V('Trommelecke 1', True)],
    'fountain_asia': [V('Zimmerbrunnen 0'), V('Zimmerbrunnen 1'), V('Zimmerbrunnen 2'), V('Zimmerbrunnen 2', True, fit='uniform')],
    'tree_jungle': [V('Baum mit Ara 0', fit='uniform'), V('Baum mit Ara 1', fit='uniform'), V('Baum mit Ara 2', fit='uniform'), V('Baum mit Ara 0', True, fit='uniform')],
    'igloo_ice': [V('Iglu 0'), V('Iglu 0', True), V('Iglu 2'), V('Iglu 2', True)],
    'plant_meadow': [V('Pflanze Wiese', fit='uniform')],
    'plant_forest': [V('Pflanze Wald', fit='uniform')],
    'plant_savanna': [V('Pflanze Savanne', fit='uniform')],
    'plant_asia': [V('Pflanze Bambuswald', fit='uniform')],
    'plant_jungle': [V('Pflanze Dschungel', fit='uniform')],
    'plant_ice': [V('Pflanze Eiswelt', fit='uniform', snow=True)],
}
for st in ('asia', 'forest', 'meadow', 'ice', 'savanna'):
    ART[f'rug_{st}'] = [V(f'rug:rug_{st}'), V(f'rug:rug_{st}', True)]
# Schreibtische: gemalt sind nur Ansicht 1 und 2 (Schubladen links bzw. von hinten); 0 und 3 gespiegelt (der Unterschrank
# steht dann immer hinten). Asien (niedriger Lacktisch) und Eiswelt bleiben gezeichnet.
for st, kind in (('meadow', 'hell'), ('forest', 'dunkel'), ('savanna', 'hell'), ('jungle', 'dunkel')):
    a, b = f'Schreibtisch {kind} 1', f'Schreibtisch {kind} 2'
    ART[f'desk_{st}'] = [V(a, True, wood=st), V(a, wood=st), V(b, wood=st), V(b, True, wood=st)]
# Regale: gemalt nur von vorn; Ansicht 1 gespiegelt, Rückseiten (2, 3) gezeichnet
for st, src in (('asia', 'Regal rot'), ('forest', 'Regal mittel'), ('savanna', 'Regal mittel'), ('meadow', 'Regal hell'), ('jungle', 'Regal hell')):
    ART[f'shelf_{st}'] = [V(src, wood=st), V(src, True, wood=st)]

_cache = {}


def clean(img):
    """Schein und Schleier um die Bilder weg (halbdurchsichtige graue Ränder)"""
    a = np.asarray(img.getchannel('A')).astype(np.float32)
    a = np.clip((a - 120) * 255 / 130, 0, 255).astype(np.uint8)
    img = img.copy()
    img.putalpha(Image.fromarray(a))
    return img.crop(img.getbbox())


def rug_source(key):
    im = Image.open(SRC + 'Teppiche.webp').convert('RGB').crop(RUGS[key])
    arr = np.asarray(im).astype(np.float32)
    # weißer Grund: vom Rand her zusammenhängende helle Fläche (sonst bliebe die cremefarbene Mitte nicht stehen)
    light = arr.min(axis=2) > 222
    filled = Image.fromarray((light * 255).astype(np.uint8)).copy()  # Flutfüllung vom Rand her (copy: eigener Speicher)
    from PIL import ImageDraw
    w, h = filled.size
    for x in range(0, w, 4):
        for y in (0, h - 1):
            if filled.getpixel((x, y)) == 255:
                ImageDraw.floodfill(filled, (x, y), 128)
    for y in range(0, h, 4):
        for x in (0, w - 1):
            if filled.getpixel((x, y)) == 255:
                ImageDraw.floodfill(filled, (x, y), 128)
    inside = Image.fromarray(np.where(np.asarray(filled) == 128, 0, 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(inside, (w // 2, h // 2), 128)  # nur der Teppich in der Mitte (keine Fransen der Nachbarn)
    outside = np.asarray(inside) != 128
    a = Image.fromarray(np.where(outside, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(a)
    return out.crop(out.getbbox())


def source(name):
    if name not in _cache:
        if name.startswith('rug:'):
            _cache[name] = rug_source(name[4:])
        else:
            _cache[name] = clean(Image.open(SRC + name + '.png').convert('RGBA'))
    return _cache[name]


def hsv_arrays(arr):
    rgb = arr[..., :3] / 255.0
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    d = mx - mn + 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0)
    return h, s, mx


def recolor_wood(img, target):
    """Holz (braun-orange) auf die Holzfarbe des Stils: Farbton und Sättigung vom Ziel, Helligkeit im Verhältnis"""
    arr = np.asarray(img).astype(np.float32)
    h, s, v = hsv_arrays(arr)
    opaque = arr[..., 3] > 128
    m = opaque & (h > 8) & (h < 40) & (s > 0.3) & (v > 0.18)
    # Bücher und Dosen sind klein: nur große zusammenhängende Holzflächen zählen (weich ausgeweitet)
    mk = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    mk = np.asarray(mk.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
    mean = arr[m][:, :3].mean(axis=0)
    th, ts, tv = colorsys.rgb_to_hsv(*(np.array(target[:3]) / 255.0))
    mh, ms, mv = colorsys.rgb_to_hsv(*(mean / 255.0))
    # neue Farbe: Helligkeit v * tv/mv, Sättigung s * ts/ms, Farbton um (th - mh) verschoben
    nv = np.clip(v * (tv / mv), 0, 1)
    ns = np.clip(s * (ts / max(ms, 1e-3)), 0, 1)
    nh = ((h / 360 + (th - mh)) % 1.0) * 6
    i = np.floor(nh).astype(int) % 6
    f = nh - np.floor(nh)
    p, q, t = nv * (1 - ns), nv * (1 - ns * f), nv * (1 - ns * (1 - f))
    choices = [(nv, t, p), (q, nv, p), (p, nv, t), (p, q, nv), (t, p, nv), (nv, p, q)]
    out = np.zeros(arr.shape[:2] + (3,), np.float32)
    for k, (r, g, b) in enumerate(choices):
        sel = i == k
        out[sel] = np.stack([r[sel], g[sel], b[sel]], axis=1)
    out *= 255
    res = arr.copy()
    res[..., :3] = arr[..., :3] * (1 - mk[..., None]) + out * mk[..., None]
    return Image.fromarray(np.clip(res, 0, 255).astype(np.uint8))


def stone_back(img):
    """Kamin von hinten: die blaugrauen Bretter in das warme Grau der Feldsteine"""
    arr = np.asarray(img).astype(np.float32)
    h, s, v = hsv_arrays(arr)
    m = (arr[..., 3] > 0) & (h > 170) & (h < 260) & (s > 0.08)
    lum = arr[..., :3].mean(axis=2)
    warm = np.stack([lum * 1.04, lum * 0.98, lum * 0.92], axis=2) * 0.95
    res = arr.copy()
    res[m, :3] = warm[m]
    return Image.fromarray(np.clip(res, 0, 255).astype(np.uint8))


def add_snow(img):
    """Schnee auf den Ästen der Tanne: helle Kappe unter jeder Oberkante des Grüns"""
    arr = np.asarray(img).astype(np.float32)
    h, s, v = hsv_arrays(arr)
    green = (arr[..., 3] > 128) & (h > 60) & (h < 170) & (s > 0.2)
    H, W = green.shape
    band = max(3, int(H * 0.028))
    # Oberkante: Grün, darüber (ein paar Punkte) kein Grün
    above = np.zeros_like(green)
    gap = max(2, band // 2)
    above[gap:] = ~green[:-gap]
    edge = green & above
    snow = np.zeros_like(green)
    rnd = np.random.RandomState(7)
    wav = (np.sin(np.arange(W) / (W * 0.03)) * 0.5 + 0.5 + rnd.rand(W) * 0.3)
    depth = (band * (0.7 + wav)).astype(int)
    ys, xs = np.nonzero(edge)
    for y, x in zip(ys, xs):
        snow[y:y + depth[x], x] = True
    snow &= green | (arr[..., 3] > 128) & (v < 0.35) & ~(h < 40)
    snow &= arr[..., 3] > 128
    # Topf nicht: nur im oberen Teil (über dem Topfrand, grob: wo es Grün in der Zeile gibt)
    rows = green.any(axis=1)
    snow &= rows[:, None]
    sm = Image.fromarray((snow * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    sm = np.asarray(sm).astype(np.float32) / 255
    yy = np.arange(H)[:, None] / H
    shade = np.clip(1.0 - (np.arange(W)[None, :] / W) * 0.12, 0.85, 1)  # rechts etwas dunkler
    col = np.stack([238 * shade + 0 * yy, 245 * shade + 0 * yy, 252 * shade + 0 * yy], axis=2)
    res = arr.copy()
    res[..., :3] = arr[..., :3] * (1 - sm[..., None]) + col * sm[..., None]
    # Umriss unter dem Schnee bleibt: wo der Schnee an Transparenz grenzt, dunkle Kante
    return Image.fromarray(np.clip(res, 0, 255).astype(np.uint8))


def object_box(obj):
    a = obj.getchannel('A').point(lambda x: 255 if x > 60 else 0)
    return a.getbbox()


def fitted(view, obj, wood_hex=None):
    """das gemalte Bild in den Umriss des gezeichneten Körpers (obj: gezeichnet, ohne Schatten) einpassen"""
    src = source(view['src'])
    if view['wood'] and wood_hex:
        src = recolor_wood(src, wood_hex)
    if view['stone']:
        src = stone_back(src)
    if view['snow']:
        src = add_snow(src)
    if view['mirror']:
        src = ImageOps.mirror(src)
    x0, y0, x1, y1 = object_box(obj)
    bw, bh = x1 - x0, y1 - y0
    if view['fit'] == 'uniform':  # gleich in beide Richtungen, unten mittig (Pflanzen, Baum)
        k = ((bw / src.width) * (bh / src.height)) ** 0.5
        w, h = round(src.width * k), round(src.height * k)
        x, y = round((x0 + x1) / 2 - w / 2), y1 - h
    else:
        w, h, x, y = bw, bh, x0, y0
    im = src.resize((max(1, w), max(1, h)), Image.LANCZOS)
    # ragt das Bild über die Fläche hinaus (oben oder seitlich), wird die Fläche größer: pad = (seitlich je, oben)
    px = max(0, -x, x + w - obj.width)
    pt = max(0, -y)
    layer = Image.new('RGBA', (obj.width + 2 * px, obj.height + pt), (0, 0, 0, 0))
    layer.alpha_composite(im, (x + px, y + pt))
    return layer, (src.width / src.height) / (bw / bh), (px, pt)


def front_layer(id, painted):
    """vordere Ebene (über Fischen bzw. Plaketten) aus dem gemalten Bild"""
    arr = np.asarray(painted).astype(np.float32)
    h, s, v = hsv_arrays(arr)
    op = arr[..., 3] > 0
    if id == 'aquarium':
        # Holzrahmen und Deckel ganz, das Glas als leichter Schleier über den Fischen
        wood = op & (h < 36) & (s > 0.3) & (v < 0.62)
        wood = np.asarray(Image.fromarray((wood * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
        glass = op & (h > 170) & (h < 230) & (s > 0.15)
        alpha = np.where(wood & op, arr[..., 3], np.where(glass, arr[..., 3] * 0.28, 0))
    else:  # Vitrine: der vordere Pfosten in der Mitte ganz, sonst das Glas als Schleier
        H, W = op.shape
        cx = W / 2
        xs = np.arange(W)[None, :]
        post = np.abs(xs - cx) < W * 0.025
        rows = np.nonzero(op.any(axis=1))[0]
        top, bot = rows[0], rows[-1]
        # zwischen Deckel und Sockel (grob 18 % bis 70 % der Höhe)
        yy = np.arange(H)[:, None]
        body = (yy > top + (bot - top) * 0.17) & (yy < top + (bot - top) * 0.7)
        metal = op & (s < 0.25)
        alpha = np.where(body & post & metal, arr[..., 3], np.where(body & op, arr[..., 3] * 0.22, 0))
    out = painted.copy()
    out.putalpha(Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8)))
    return out if out.getbbox() else None
