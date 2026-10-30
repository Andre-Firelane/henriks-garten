"""Aufruf: python tools/hd-sprites.py .   (braucht Pillow und numpy)
Überarbeitete Wald-, Wiesen- und Tierpark-Sprites in 4-facher Auflösung nach public/assets/hd/ schreiben.
Größe, Fußpunkt und Schatten kommen von den alten Pixel-Sprites (Kopien in Wald-Sprites/, Wiese-Sprites/, Tierpark-Sprites/)."""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from collections import deque

ROOT = sys.argv[1]
F = 4
A = os.path.join(ROOT, 'public/assets')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(A, 'hd')
WALD = os.path.join(A, 'scenario-assets')
WIESE = os.path.join(A, 'scenario-assets-wiese')
PARK = os.path.join(A, 'scenario-assets-tierpark')  # + 1, 2, ... (Lieferungen)
OLD = {'forest': os.path.join(ROOT, 'Wald-Sprites'), 'meadow': os.path.join(ROOT, 'Wiese-Sprites'), 'park': os.path.join(ROOT, 'Tierpark-Sprites'),
       'savanna': os.path.join(ROOT, 'Savanne-Sprites'), 'asia': os.path.join(ROOT, 'Bambuswald-Sprites'),
       'reef': os.path.join(ROOT, 'Riff-Sprites'), 'jungle': os.path.join(ROOT, 'Dschungel-Sprites'),
       'aquarium': os.path.join(ROOT, 'Aquarium-Sprites'), 'reptiles': os.path.join(ROOT, 'Reptilienhaus-Sprites')}
SHADOW = (20, 40, 10, 70)

wald = lambda n: f'{WALD}/Wald_neu-{n}.png'
wiese = lambda n: f'{WIESE}/Wald_neu{"" if n == 0 else f"-{n}"}.png'
park = lambda n, batch=1: f'{PARK}{batch}/Wald_neu{"" if n == 0 else f"-{n}"}.png'
park2 = lambda n: park(n, 2)
sav = lambda n: f'{A}/scenario-assets-savanne/Wald_neu{"" if n == 0 else f"-{n}"}.png'
bam = lambda n: f'{A}/scenario-assets-bambus/Wald_neu{"" if n == 0 else f"-{n}"}.png'
riff = lambda n: f'{A}/scenario-assets-riff/Wald_neu{"" if n == 0 else f"-{n}"}.png'
dsch = lambda n: f'{A}/scenario-assets-dschungel/Wald_neu{"" if n == 0 else f"-{n}"}.png'
aqua = lambda n: f'{A}/scenario-assets-Aquarium/Wald_neu{"" if n == 0 else f"-{n}"}.png'
rept = lambda n: f'{A}/scenario-assets-reptilienhaus/Wald_neu{"" if n == 0 else f"-{n}"}.png'

# Boden-Kacheln: Gruppen bekommen denselben mittleren Farbton
TILES = [
    {'forest_path': wald(17)}, {'fgrass0': wald(18), 'fgrass1': wald(19), 'fgrass2': wald(20)}, {'planks_forest': wald(4)},
    {'grass0': wiese(5), 'grass1': wiese(6), 'grass2': wiese(7)}, {'path': wiese(14)}, {'soil': wiese(19)},
    {'water': wiese(21)}, {'planks': wiese(15)},
]
OBJS = {
    'post_hutwall_forest': wald(3), 'pine': wald(5), 'mushroom': wald(6), 'log': wald(7), 'hutwall_forest_y': wald(8),
    'hutwall_forest_x': wald(9), 'hutroof_forest': wald(10), 'hut_desk_forest': wald(11), 'hut_shelf_forest': wald(12),
    'hut_plant_forest': wald(13), 'hut_chair_forest': wald(14), 'gate_door_forest_y': wald(15), 'gate_door_forest_x': wald(16),
    'dark_bush': wald(21), 'fern': wald(23), 'dark_tree': wald(24),
    'hut_plant_meadow': wiese(10), 'hutroof_meadow': wiese(11), 'hutwall_meadow_x': wiese(12), 'hutwall_meadow_y': wiese(13),
    'post_hutwall_meadow': wiese(16), 'rock': wiese(17), 'signpost_post': wiese(18), 'flowers_yellow': wiese(2), 'tree': wiese(20),
    'gate_door_meadow_x': wiese(3), 'gate_door_meadow_y': wiese(4), 'hut_chair_meadow': wiese(8), 'hut_desk_meadow': wiese(9),
    'flowers_red': wiese(0), 'hut_shelf_meadow': wald(12), 'bush': f'{A}/Busch Wiese.png',
}
STRETCH = {'hutroof_forest', 'hutroof_meadow'}


def old(key):
    for d in OLD.values():
        if os.path.exists(f'{d}/{key}.png'):
            return Image.open(f'{d}/{key}.png').convert('RGBA')
    raise FileNotFoundError(key)


def crop(im):
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())


def place(new, orig, stretch=False, shadow=SHADOW, solid=255, axis='x'):
    """new in die opake Box des alten Bilds (vergrößert) setzen, unten mittig; der alte Schatten bleibt (weichgezeichnet).
    shadow=None: jeder Pixel mit Deckkraft 70 ist Schatten (im Tierpark gibt es auch andere Schattenfarben)."""
    big = orig.resize((orig.width * F, orig.height * F), Image.NEAREST)
    out = Image.new('RGBA', big.size)
    if shadow is None:
        a = np.asarray(big)
        sh = a[..., 3] == 70
        if sh.any():
            col = tuple(int(v) for v in np.median(a[sh][:, :3], 0)) + (70,)
            mask = Image.fromarray(np.where(sh, 255, 0).astype(np.uint8)).filter(ImageFilter.GaussianBlur(F / 2))
            out.paste(Image.new('RGBA', big.size, col), (0, 0), mask.point(lambda v: v * 70 // 255))
    else:
        mask = Image.new('L', big.size)
        mask.putdata([255 if p == shadow else 0 for p in big.getdata()])
        mask = mask.filter(ImageFilter.GaussianBlur(F / 2))
        out.paste(Image.new('RGBA', big.size, shadow), (0, 0), mask.point(lambda v: v * shadow[3] // 255))
    x0, y0, x1, y1 = big.getchannel('A').point(lambda v: 255 if v >= solid and v != 70 else 0).getbbox()
    bw, bh = x1 - x0, y1 - y0
    if stretch == 'ends':
        # Zäune und Wände: linkes und rechtes Ende (Pfosten) einzeln auf die alten Enden ziehen. Nur in die Box gestreckt
        # stehen die Pfosten der KI-Bilder etwas anders hoch, dann treffen sie sich nicht mit dem Nachbarteil
        a = np.asarray(big)[..., 3]
        dst = side_ends((a >= solid) & (a != 70))
        src = side_ends(np.asarray(new)[..., 3] > 200)
        out.alpha_composite(new.transform(big.size, Image.PERSPECTIVE, perspective(src, dst), Image.BICUBIC))
        return same_ends(out, dst[0][0], dst[2][0], axis) if axis else out  # Tore: nur die Enden (sie haben keine Pfosten)
    if stretch:
        w, h = bw, bh
    else:
        s = min(bw / new.width, bh / new.height)
        w, h = max(1, round(new.width * s)), max(1, round(new.height * s))
    out.alpha_composite(new.resize((w, h), Image.LANCZOS), (x0 + (bw - w) // 2, y1 - h))
    return out


def same_ends(im, l, r, axis):
    """Ein Wand- oder Zaunteil ist breiter als ein Kachelschritt (32 × 16 Pixel): sein Ende liegt über dem Anfang des
    Nachbarteils. Das verdeckte Ende wird eine genaue Kopie des vorne liegenden (die KI malt beide Enden verschieden,
    sonst sieht man dort eine doppelte, versetzte Kante). Vorne liegt das Teil weiter unten: bei _x rechts, also gilt
    dessen linkes Ende; bei _y links, also dessen rechtes Ende."""
    sx, sy = 32 * F, 16 * F
    ov = int(round(r - l - sx))
    if ov <= 0:
        return im
    l, r = int(round(l)), int(round(r))
    if axis == 'x':
        band = im.crop((l, 0, l + ov, im.height))
        x, dy = r - ov, sy
    else:
        band = im.crop((r - ov, 0, r, im.height))
        x, dy = l, sy  # (bei _y liegt das linke Ende tiefer)
    out = im.copy()
    out.paste(Image.new('RGBA', (ov, im.height)), (x, 0))
    out.alpha_composite(band.transform(band.size, Image.AFFINE, (1, 0, 0, 0, 1, -dy), Image.NEAREST), (x, 0))
    return out


def side_ends(mask, band=0.08):
    """oberer und unterer Punkt am linken und rechten Ende (in einem schmalen Streifen am Rand)"""
    ys, xs = np.nonzero(mask)
    l, r = xs.min(), xs.max()
    w = max(2, (r - l) * band)
    left, right = ys[xs <= l + w], ys[xs >= r - w]
    return [(l, left.min()), (l, left.max() + 1), (r + 1, right.min()), (r + 1, right.max() + 1)]


def tile_crop(im):
    # nur kräftig gefärbte Pixel zählen (eine Kachel hat einen hellen Hintergrund)
    a = np.asarray(im).astype(int)
    sat = a[..., :3].max(2) - a[..., :3].min(2)
    ys, xs = np.nonzero((a[..., 3] > 24) & (sat > 40))
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def diamond(w, h):
    y, x = np.mgrid[0:h, 0:w]
    d = np.abs(x + 0.5 - w / 2) / (w / 2) + np.abs(y + 0.5 - h / 2) / (h / 2)
    return np.clip((1.04 - d) * w / 2, 0, 1)  # leicht größer als die Raute, damit keine Fugen bleiben


def tile(new, inset=0.07):
    # Umriss der KI-Kachel abschneiden (sonst dunkle Gitterlinien), Rautenform 64x32 (vergrößert)
    w, h = new.size
    r = new.crop((round(w * inset), round(h * inset), round(w * (1 - inset)), round(h * (1 - inset)))).resize((64 * F, 32 * F), Image.LANCZOS)
    a = np.asarray(r).astype(np.float64)
    a[..., 3] = diamond(64 * F, 32 * F) * 255
    return a


def blur(a, sigma):
    r = int(sigma * 3)
    k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sigma * sigma))
    k /= k.sum()
    a = np.apply_along_axis(lambda v: np.convolve(np.pad(v, r, mode='edge'), k, 'valid'), 0, a)
    return np.apply_along_axis(lambda v: np.convolve(np.pad(v, r, mode='edge'), k, 'valid'), 1, a)


def flatten(arrs, sigma=5 * F):
    """Helligkeitsverläufe glätten (sonst Schachbrettmuster); Varianten einer Gruppe bekommen denselben Mittelwert."""
    masks = [(a[..., 3] > 127).astype(np.float64) for a in arrs]
    target = sum((a[..., :3] * m[..., None]).sum((0, 1)) for a, m in zip(arrs, masks)) / sum(m.sum() for m in masks)
    out = []
    for a, m in zip(arrs, masks):
        bm = np.maximum(blur(m, sigma), 1e-6)
        res = a.copy()
        for c in range(3):
            local = blur(a[..., c] * m, sigma) / bm
            res[..., c] = a[..., c] * target[c] / np.maximum(local, 1)
        res[..., :3] = np.clip(res[..., :3], 0, 255)
        out.append(Image.fromarray(res.round().astype(np.uint8), 'RGBA'))
    return out


def strip_ground(im):
    # Grasfleck unter dem Wegweiser-Pfosten entfernen
    a = np.asarray(im).copy()
    r, g, b = (a[..., i].astype(int) for i in range(3))
    a[(np.arange(a.shape[0])[:, None] > a.shape[0] * 0.9) & (g > r) & (g >= b)] = 0
    return crop(Image.fromarray(a, 'RGBA'))


def cut_cage(path):
    im = Image.open(path).convert('RGBA')
    W, H = im.size
    px = im.load()

    def bg(p, y):
        r, g, b, _ = p
        return min(r, g, b) > 225 or (y > H * 0.55 and g >= r - 4 and g - b > 12)  # weiß oder Wiese unter dem Käfig

    seen = bytearray(W * H)
    q = deque([(x, y) for x in range(W) for y in (0, H - 1)] + [(x, y) for y in range(H) for x in (0, W - 1)])
    while q:
        x, y = q.popleft()
        i = y * W + x
        if seen[i] or not bg(px[x, y], y):
            continue
        seen[i] = 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and not seen[ny * W + nx]:
                q.append((nx, ny))
    comp = [0] * (W * H)
    best, best_n, cid = 0, 0, 0
    for sy in range(H):
        for sx in range(W):
            i = sy * W + sx
            if seen[i] or comp[i]:
                continue
            cid += 1
            n, st = 0, [(sx, sy)]
            comp[i] = cid
            while st:
                x, y = st.pop()
                n += 1
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    j = ny * W + nx
                    if 0 <= nx < W and 0 <= ny < H and not seen[j] and not comp[j]:
                        comp[j] = cid
                        st.append((nx, ny))
            if n > best_n:
                best, best_n = cid, n
    for y in range(H):
        for x in range(W):
            p = px[x, y]
            if comp[y * W + x] != best or min(p[:3]) > 225 or (y > H * 0.75 and p[0] - p[2] > 18):  # auch beige Steinchen
                px[x, y] = (0, 0, 0, 0)
    src = im.copy().load()
    for y in range(2, H - 2):
        for x in range(2, W - 2):
            r, g, b, a = src[x, y]
            if not a or all(src[x + dx, y + dy][3] for dx in (-2, 0, 2) for dy in (-2, 0, 2)):
                continue
            al = max(255 - r, 255 - g, 255 - b) / 255
            if al <= 0.02:
                px[x, y] = (0, 0, 0, 0)
                continue
            al = min(1, al * 1.6)
            f = lambda c: max(0, min(255, round(255 - (255 - c) / al)))
            px[x, y] = (f(r), f(g), f(b), round(255 * al))
    return crop(im)


def cage_shadow(cage, orig):
    # Falle: weicher Schatten in Käfigform statt des alten (der Käfig war früher von vorne gezeichnet)
    big = orig.resize((orig.width * F, orig.height * F), Image.NEAREST)
    x0, y0, x1, y1 = big.getchannel('A').point(lambda v: 255 if v == 255 else 0).getbbox()
    bw, bh = x1 - x0, y1 - y0
    s = min(bw / cage.width, bh / cage.height)
    w, h = round(cage.width * s), round(cage.height * s)
    cr = cage.resize((w, h), Image.LANCZOS)
    px, py = x0 + (bw - w) // 2, y1 - h
    out = Image.new('RGBA', big.size)
    m = Image.new('L', big.size)
    m.paste(cr.getchannel('A'), (px + 3 * F // 2, py + 2 * F))
    m = m.filter(ImageFilter.GaussianBlur(F)).point(lambda v: min(70, v))
    out.paste(Image.new('RGBA', big.size, SHADOW[:3] + (255,)), (0, 0), m)
    out.alpha_composite(cr, (px, py))
    return out


os.makedirs(OUT, exist_ok=True)
for group in TILES:
    for k, t in zip(group, flatten([tile(tile_crop(Image.open(p).convert('RGBA'))) for p in group.values()])):
        t.save(f'{OUT}/{k}.png')
for k, p in OBJS.items():
    new = crop(Image.open(p).convert('RGBA'))
    if k == 'signpost_post':
        new = strip_ground(new)
    place(new, old(k), k in STRETCH).save(f'{OUT}/{k}.png')
cage_shadow(cut_cage(f'{WALD}/Käfig.jpg'), old('trap')).save(f'{OUT}/trap.png')

# ---- Tierpark (die Bilder gelten in allen Welten, in denen sie vorkommen) ----
PARK_TILES = [
    {'agrass0': park(3), 'agrass1': park(4), 'agrass2': park(5)}, {'asia_water0': park(7), 'asia_water1': park(8), 'asia_water2': park(9)},
    {'fishpond0': park(25), 'fishpond1': park(26)}, {'hotspring': park(48)},
    {'jgrass0': park2(0), 'jgrass1': park2(2), 'jgrass2': park2(3)},  # park_path: gezeichnet (tools/park-path.py), siehe unten
    # Savannen-Sand: die anderen beiden KI-Kacheln wurden zu Hügeln (gekachelt sieht man Streifen), deshalb nur die flache, gespiegelt und gedreht
    {'sgrass0': park2(27), 'sgrass1': (park2(27), Image.FLIP_LEFT_RIGHT), 'sgrass2': (park2(27), Image.ROTATE_180)},
]
PARK_OBJS = {
    'acacia': 0, 'acacia_bare': 2, 'bamboo': 10, 'boulder': 11, 'build_planks': 12, 'build_stakes': 13, 'cat_tree': 14, 'cherry_tree': 17,
    'climb_tree': 18, 'den': 19, 'den_sand': 20, 'dry_bush': 21, 'feeder': 22, 'fountain': 28, 'hammock': 43, 'hay_rack': 44,
    'hay_shelter': 45, 'heliconia': 46, 'hibiscus': 47, 'icecream_stand': 55, 'icecream2': 56, 'icecream3': 57,
}
PARK_OBJS = {k: park(n) for k, n in PARK_OBJS.items()} | {k: park2(n) for k, n in {
    'jungle_plant': 4, 'jungle_tree': 5, 'lion_rock': 6, 'nest_box': 9, 'office_armchair': 12, 'office_chair': 13, 'office_desk': 14,
    'office_plant_monstera': 15, 'office_plant_strelitzia': 16, 'office_rug': 17, 'office_sofa': 18, 'office_table': 19, 'parkfood': 21,
    'peacock_perch': 22, 'reeds': 23, 'stone_lantern': 28, 'sun_rock': 29, 'tall_grass': 30, 'tire_swing': 33, 'torii': 34, 'toy_ball': 35,
    'tuft': 36}.items()} | {'icecream': f'{A}/Icecream Pink.png'}
# Zäune, Tore, Wände genau in die alte Form strecken (sonst passen die Pfosten nicht aneinander); _x = Nummer, _y = Nummer + 1
PARK_SIDES = {'chain': 15, 'fence': 23, 'gate_chain': 29, 'gate_door_office': 31, 'gate_glass': 33, 'gate_glassflap': 35, 'gate_net': 37,
              'gate_tall': 39, 'gate': 41, 'hutwall_cathouse': 51, 'hutwall_office': 53}
PARK_SIDES = {k: (park(n), park(n + 1)) for k, n in PARK_SIDES.items()} | {k: (park2(n), park2(n + 1)) for k, n in {'mesh': 7, 'net': 10, 'tall': 31}.items()}
# Dächer und Gebäude: die vier Ecken auf die alten Ecken ziehen; sie sind schon groß, deshalb ein kleinerer Faktor
PARK_BIG = {'hutroof_cathouse': (park(49), 2), 'hutroof_office': (park(50), 2), 'aquarium_facade': (park(6), 1), 'reptile_facade': (park2(24), 1)}
# Glasscheiben wieder durchsichtig wie bei den alten Bildern (Deckkraft)
GLASS = {'gate_glass': 150, 'gate_glassflap': 150, 'gate_door_office': 200, 'hutwall_office': 130, 'hutwall_cathouse': 110}


def alpha_crop(im):
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 200 else 0).getbbox())


def glass(im, alpha):
    a = np.asarray(im).copy()
    r, g, b = (a[..., i].astype(int) for i in range(3))
    pane = (b > r + 20) & (b > 160)
    white = np.minimum(np.minimum(r, g), b) > 238
    a[..., 3] = np.where(pane, np.minimum(a[..., 3], alpha), np.where(white, np.minimum(a[..., 3], 210), a[..., 3]))
    return Image.fromarray(a, 'RGBA')


def corners(mask):
    ys, xs = np.nonzero(mask)
    l, r, t, b = xs.min(), xs.max(), ys.min(), ys.max()
    return [(l, ys[xs <= l + 1].mean()), (xs[ys <= t + 1].mean(), t), (r, ys[xs >= r - 1].mean()), (xs[ys >= b - 1].mean(), b)]


def warp(new, orig, f):
    """new so verzerren, dass linke, obere, rechte und untere Ecke auf denen des alten Bilds liegen."""
    dst = [(x * f, y * f) for x, y in corners(np.asarray(orig)[..., 3] > 200)]
    src = corners(np.asarray(new)[..., 3] > 200)
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
    c = np.linalg.solve(np.array(m, float), np.array([v for p in src for v in p], float))
    return new.transform((orig.width * f, orig.height * f), Image.PERSPECTIVE, tuple(c), Image.BICUBIC)


def perspective(src, dst):
    """Koeffizienten für Image.PERSPECTIVE: Punkte dst (Ausgabe) -> src (Vorlage)."""
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
    return tuple(np.linalg.solve(np.array(m, float), np.array([v for p in src for v in p], float)))


def light_parts(im, n, lum=150):
    """die n größten zusammenhängenden hellen Flächen (Steinplatten) als Masken"""
    a = np.asarray(im).astype(int)
    light = (a[..., 3] > 200) & (a[..., :3].mean(2) > lum)
    H, W = light.shape
    lab = np.zeros((H, W), int)
    parts = []
    for y0, x0 in zip(*np.nonzero(light)):
        if lab[y0, x0]:
            continue
        lab[y0, x0] = len(parts) + 1
        q, px = deque([(y0, x0)]), []
        while q:
            y, x = q.popleft()
            px.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < H and 0 <= nx < W and light[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = len(parts) + 1
                    q.append((ny, nx))
        parts.append(np.array(px))
    return sorted(parts, key=len)[-n:]


def office_floor(path, grout=2.5, lum=150):
    """Büroboden: die KI-Vorlage hat vier schief liegende Platten und keine Fuge am Rand. Jede Platte (nur ihre Oberseite)
    kommt genau in ein Viertel der Kachel, dazwischen und am Rand gerade Fugen, damit die Kacheln aneinander passen."""
    im = alpha_crop(Image.open(path).convert('RGBA'))
    a = np.asarray(im)
    stones = []
    for px in light_parts(im, 4, lum):
        ys, xs = px[:, 0], px[:, 1]
        t = (xs[ys == ys.min()].mean(), ys.min())
        l = (xs.min(), ys[xs <= xs.min() + 2].min())
        r = (xs.max(), ys[xs >= xs.max() - 2].min())
        b = (l[0] + r[0] - t[0], l[1] + r[1] - t[1])  # Oberseite ist ein Parallelogramm (die Seitenkante zählt nicht)
        c = np.mean([t, l, r, b], 0)
        stones.append([tuple(c + (np.array(p) - c) * 0.92) for p in (t, r, b, l)])  # Rand der Platte weglassen
    stones.sort(key=lambda q: (np.mean([p[1] for p in q]), np.mean([p[0] for p in q])))  # oben, links, rechts, unten
    W, H = 64 * F, 32 * F
    cx, cy = W / 2, H / 2
    quarters = [((cx, 0), (cx * 1.5, cy / 2), (cx, cy), (cx / 2, cy / 2)), ((cx / 2, cy / 2), (cx, cy), (cx / 2, cy * 1.5), (0, cy)),
                ((cx * 1.5, cy / 2), (W, cy), (cx * 1.5, cy * 1.5), (cx, cy)), ((cx, cy), (cx * 1.5, cy * 1.5), (cx, H), (cx / 2, cy * 1.5))]
    dark = np.median(a[(a[..., 3] > 200) & (a[..., :3].mean(2) < min(90, lum - 15))][:, :3], 0)
    k = 1 - grout / (cx / 2 * cy / 2 / np.hypot(cx / 2, cy / 2))  # Viertel um "grout" Pixel nach innen
    means = []
    layers = []
    for src, quad in zip(stones, quarters):
        qc = np.mean(quad, 0)
        dst = [tuple(qc + (np.array(p) - qc) * k) for p in quad]
        layer = np.asarray(im.transform((W, H), Image.PERSPECTIVE, perspective(src, dst), Image.BICUBIC)).astype(np.float64)
        mask = Image.new('L', (W, H))
        ImageDraw.Draw(mask).polygon(dst, fill=255)
        layers.append((layer, np.asarray(mask.filter(ImageFilter.GaussianBlur(0.7))) / 255))
        means.append(layer[layers[-1][1] > 0.99][:, :3].mean(0))
    target = np.mean(means, 0)
    o = np.zeros((H, W, 4))
    o[..., :3] = dark * 0.6 + target * 0.4  # Fuge etwas heller als die Umrisse der Vorlage
    for (l, m), mean in zip(layers, means):
        stone = np.clip(l[..., :3] * target / mean, 0, 255)  # alle Platten gleich hell (sonst Schachbrett)
        o[..., :3] = o[..., :3] * (1 - m[..., None]) + stone * m[..., None]
    o[..., 3] = diamond(W, H) * 255
    return Image.fromarray(o.round().astype(np.uint8), 'RGBA')


office_floor(park(27)).save(f'{OUT}/floor_office.png')
for group in PARK_TILES:
    srcs = []
    for p in group.values():
        if isinstance(p, tuple) and p[1] == 'inset':
            srcs.append(tile(alpha_crop(Image.open(p[0]).convert('RGBA')), p[2]))
            continue
        turn = isinstance(p, tuple)  # (Bild, Spiegelung/Drehung) für eine weitere Variante
        im = Image.open(p[0] if turn else p).convert('RGBA')
        srcs.append(tile(alpha_crop(im.transpose(p[1]) if turn else im)))
    for k, t in zip(group, flatten(srcs)):
        t.save(f'{OUT}/{k}.png')
# Regen-Gras im Dschungel: das neue Gras, um so viel dunkler wie das alte Regen-Gras war
rain = np.array([0.885, 0.880, 0.906])
for i in range(3):
    a = np.asarray(Image.open(f'{OUT}/jgrass{i}.png')).astype(np.float64)
    a[..., :3] = np.clip(a[..., :3] * rain, 0, 255)
    Image.fromarray(a.round().astype(np.uint8), 'RGBA').save(f'{OUT}/jgrass_rain{i}.png')
def dehalo(im):
    # grauer Schein um die Pflanze (halb durchsichtig, kaum gefärbt) entfernen
    a = np.asarray(im).copy()
    c = a[..., :3].astype(int)
    a[(a[..., 3] < 230) & (c.max(2) - c.min(2) < 25) & (c.mean(2) > 110)] = 0
    return Image.fromarray(a, 'RGBA')


HALO = {'office_plant_strelitzia'}
for k, p in PARK_OBJS.items():
    new = Image.open(p).convert('RGBA')
    place(crop(dehalo(new) if k in HALO else new), old(k), shadow=None, solid=200).save(f'{OUT}/{k}.png')
for k, paths in PARK_SIDES.items():
    for side, p in zip('xy', paths):
        im = place(crop(Image.open(p).convert('RGBA')), old(f'{k}_{side}'), 'ends', shadow=None, solid=200, axis=None if k.startswith('gate') else side)
        (glass(im, GLASS[k]) if k in GLASS else im).save(f'{OUT}/{k}_{side}.png')
for k, (p, f) in PARK_BIG.items():
    warp(Image.open(p).convert('RGBA'), old(k), f).save(f'{OUT}/{k}.png')

# ---- Savanne ----
SAV_TILES = [
    {'mud': sav(13)}, {'planks_savanna': sav(14)}, {'savanna_path': sav(15)},
    # ein Teil der KI-Kacheln wurde zu Hügeln (gekachelt sieht man Streifen): nur die flachen, gespiegelt und gedreht
    {'sdry0': sav(16), 'sdry1': sav(18), 'sdry2': (sav(16), Image.ROTATE_180)},
    {'sgrass_rain0': sav(19), 'sgrass_rain1': (sav(19), Image.FLIP_LEFT_RIGHT), 'sgrass_rain2': (sav(19), Image.ROTATE_180)},
]
SAV_OBJS = {'bone': 0, 'food': 3, 'hut_chair_savanna': 6, 'hut_desk_savanna': 7, 'hut_plant_savanna': 8, 'hut_shelf_savanna': 9}
SAV_SIDES = {'gate_door_savanna': 4, 'hutwall_savanna': 11}


def bone_pile(bone, orig):
    # Knochenhaufen aus mehreren einzelnen Knochen (die KI-Vorlage passte nicht), flach liegend, mit weichem Schatten
    W, H = orig.width * F, orig.height * F
    out = Image.new('RGBA', (W, H))
    shadow = Image.new('L', (W, H))
    bones = []
    for ang, size, x, y in ((25, 0.50, 0.42, 0.62), (-40, 0.46, 0.60, 0.60), (80, 0.40, 0.30, 0.55), (-10, 0.44, 0.55, 0.45), (55, 0.38, 0.70, 0.48)):
        b = bone.resize((round(W * size), round(W * size * bone.height / bone.width)), Image.LANCZOS).rotate(ang, Image.BICUBIC, expand=True)
        b = b.resize((b.width, round(b.height * 0.6)), Image.LANCZOS)  # flach auf dem Boden (Iso-Ansicht)
        px, py = round(W * x - b.width / 2), round(H * y - b.height / 2)
        shadow.paste(255, (px + F, py + 2 * F), b.getchannel('A'))
        bones.append((b, px, py))
    out.paste(Image.new('RGBA', (W, H), SHADOW[:3] + (255,)), (0, 0), shadow.filter(ImageFilter.GaussianBlur(F)).point(lambda v: v * 70 // 255))
    for b, px, py in bones:
        out.alpha_composite(b, (px, py))
    return out


for group in SAV_TILES:
    srcs = []
    for p in group.values():
        turn = isinstance(p, tuple)
        im = Image.open(p[0] if turn else p).convert('RGBA')
        srcs.append(tile(alpha_crop(im.transpose(p[1]) if turn else im)))
    for k, t in zip(group, flatten(srcs)):
        t.save(f'{OUT}/{k}.png')
for k, n in SAV_OBJS.items():
    place(crop(Image.open(sav(n)).convert('RGBA')), old(k), shadow=None, solid=200).save(f'{OUT}/{k}.png')
for k, n in SAV_SIDES.items():
    for side, m in (('x', n), ('y', n + 1)):
        place(crop(Image.open(sav(m)).convert('RGBA')), old(f'{k}_{side}'), 'ends', shadow=None, solid=200, axis=None if k.startswith('gate') else side).save(f'{OUT}/{k}_{side}.png')
warp(Image.open(sav(10)).convert('RGBA'), old('hutroof_savanna'), 2).save(f'{OUT}/hutroof_savanna.png')
bone_pile(crop(Image.open(sav(0)).convert('RGBA')), old('bone_pile')).save(f'{OUT}/bone_pile.png')

# ---- Bambuswald ----
for k, t in zip(('asia_path', 'planks_asia'), (flatten([tile(alpha_crop(Image.open(bam(n)).convert('RGBA')))])[0] for n in (0, 15))):
    t.save(f'{OUT}/{k}.png')
BAM_OBJS = {'hut_chair_asia': 4, 'hut_chest_small': 5, 'hut_desk_asia': 6, 'hut_plant_asia': 7, 'hut_shelf_asia': 8, 'jar': 12, 'jar_glow': 13,
            'koifood': 14}
for k, n in BAM_OBJS.items():
    place(crop(Image.open(bam(n)).convert('RGBA')), old(k), shadow=None, solid=200).save(f'{OUT}/{k}.png')
for k, n in {'gate_door_asia': 2, 'hutwall_asia': 10}.items():
    for side, m in (('x', n), ('y', n + 1)):
        place(crop(Image.open(bam(m)).convert('RGBA')), old(f'{k}_{side}'), 'ends', shadow=None, solid=200, axis=None if k.startswith('gate') else side).save(f'{OUT}/{k}_{side}.png')
warp(Image.open(bam(9)).convert('RGBA'), old('hutroof_asia'), 2).save(f'{OUT}/hutroof_asia.png')

# ---- Riff ----
RIFF_TILES = [{'reef_sand0': riff(16), 'reef_sand1': riff(17), 'reef_sand2': riff(18)}, {'reef_algae': riff(3)}, {'reef_dark': riff(9)},
              {'reef_gravel': riff(12)}, {'reef_path': riff(14)}, {'reef_seagrass': riff(19)}]
for group in RIFF_TILES:
    for k, t in zip(group, flatten([tile(alpha_crop(Image.open(p).convert('RGBA'))) for p in group.values()])):
        t.save(f'{OUT}/{k}.png')
RIFF_OBJS = {'reef_anemone': 4, 'reef_brain': 5, 'reef_brain2': 6, 'reef_branch': 7, 'reef_branch2': 8, 'reef_fan': 10,
             'reef_fan2': 11, 'reef_kelp': 13, 'reef_rock': 15, 'reef_starfish': 20, 'reef_tube': 21, 'reef_tube2': 22, 'scissors': 23,
             'shell': 24, 'tank_rock': 25}
for k, n in RIFF_OBJS.items():
    place(crop(dehalo(Image.open(riff(n)).convert('RGBA'))), old(k), shadow=None, solid=200).save(f'{OUT}/{k}.png')
# Werkzeug-Sack im Riff: orangefarbener Packsack mit Kescher (freigestellt mit npm run cutout -- "Sprites/Riff Sack.jpg"
# "Sprites/Riff Sack.png" 500,165 625,415 630,430: Lücken im Griff und hinter dem Riemen)
place(crop(Image.open(os.path.join(ROOT, 'Sprites/Riff Sack.png')).convert('RGBA')), old('anchor_sack'), shadow=None, solid=200).save(f'{OUT}/anchor_sack.png')
# Zoo-U-Boot (Schnellreise im Riff): wird groß gezeigt (scale 1.5), daher auch in HD; ein Bild, gleiche Lage wie boat_zoo.png
place(crop(Image.open(os.path.join(ROOT, 'Sprites/Unterseeboot.png')).convert('RGBA')), Image.open(f'{A}/boat_zoo.png').convert('RGBA'), shadow=None, solid=200).save(f'{OUT}/boat_zoo.png')


def boat_sheet(new, orig):
    # Boot (Schnellreise im Riff): Bildstreifen mit zwei gleichen Bildern zu 240x140, schon groß genug (keine HD-Fassung)
    out = Image.new('RGBA', orig.size)
    fw = orig.width // 2
    x0, y0, x1, y1 = orig.crop((0, 0, fw, orig.height)).getchannel('A').point(lambda v: 255 if v > 200 else 0).getbbox()
    s = min((x1 - x0) / new.width, (y1 - y0) / new.height)
    b = new.resize((round(new.width * s), round(new.height * s)), Image.LANCZOS)
    for f in range(2):
        out.alpha_composite(b, (f * fw + x0 + (x1 - x0 - b.width) // 2, y1 - b.height))
    return out


boat_sheet(crop(dehalo(Image.open(riff(2)).convert('RGBA'))), old('boat')).save(f'{A}/boat.png')

# ---- Dschungel ---- (Kanu und Kanu-Symbol sind schon groß genug; die KI-Flussbilder sahen aus wie Gras, der Fluss bleibt)
for k, n in (('jungle_dock', 14), ('jungle_path', 19), ('planks_jungle', 22)):
    flatten([tile(alpha_crop(Image.open(dsch(n)).convert('RGBA')))])[0].save(f'{OUT}/{k}.png')
DSCH_OBJS = {'banana': 0, 'cliff': 4, 'hut_chair_jungle': 7, 'hut_desk_jungle': 8, 'hut_plant_jungle': 9, 'hut_shelf_jungle': 10,
             'machete': 20, 'mangrove': 21, 'thicket': 23, 'thicket_cut': 24, 'thicket_small': 25}
for k, n in DSCH_OBJS.items():
    place(crop(dehalo(Image.open(dsch(n)).convert('RGBA'))), old(k), shadow=None, solid=200).save(f'{OUT}/{k}.png')
for k, n in {'gate_door_jungle': 5, 'hutwall_jungle': 12}.items():
    for side, m in (('x', n), ('y', n + 1)):
        place(crop(Image.open(dsch(m)).convert('RGBA')), old(f'{k}_{side}'), 'ends', shadow=None, solid=200, axis=None if k.startswith('gate') else side).save(f'{OUT}/{k}_{side}.png')
warp(Image.open(dsch(11)).convert('RGBA'), old('hutroof_jungle'), 2).save(f'{OUT}/hutroof_jungle.png')


def waterfall(new, orig, fw=128):
    # Vorlage: Fels | Wasser | Fels | Wasser | Fels | Wasser | Fels; jedes der drei Bilder (Animation) zeigt einen Wasserstrang
    # mit den Felsen links und rechts davon, gestreckt auf die Form der alten Bilder. Der dunkle Schein drumherum kommt weg.
    a = np.asarray(new).copy()
    a[a[..., 3] < 200] = 0
    new = Image.fromarray(a, 'RGBA')
    b = np.asarray(new).astype(int)
    op = b[..., 3] > 0
    water = ((b[..., 2] > b[..., 0] + 40) & op).sum(0) > op.sum(0) * 0.5
    xs = [x for x in range(new.width) if op[:, x].any()]
    segs = []
    for x in xs:
        if segs and segs[-1][0] == water[x] and segs[-1][2] == x - 1:
            segs[-1][2] = x
        else:
            segs.append([water[x], x, x])
    segs = [sg for sg in segs if sg[2] - sg[1] > 3]
    rocks = [sg for sg in segs if not sg[0]]
    ys = np.nonzero(op.any(1))[0]
    out = Image.new('RGBA', (orig.width * F, orig.height * F))
    for i in range(3):
        x0, y0, x1, y1 = orig.crop((i * fw, 0, (i + 1) * fw, orig.height)).getchannel('A').getbbox()
        trim = 0 if i == 0 else 12  # Rand des Nachbar-Wassers nicht mitnehmen
        part = new.crop((rocks[i][1] + trim, ys.min(), rocks[i + 1][2] + 1 - (12 if i < 2 else 0), ys.max() + 1))
        out.alpha_composite(part.resize(((x1 - x0) * F, (y1 - y0) * F), Image.LANCZOS), ((i * fw + x0) * F, y0 * F))
    return out


waterfall(Image.open(dsch(26)).convert('RGBA'), old('waterfall')).save(f'{OUT}/waterfall.png')

# ---- Aquarium ----
office_floor(aqua(6), lum=50).save(f'{OUT}/floor_aquarium.png')  # vier dunkle Platten: wie der Büroboden neu zusammengesetzt
flatten([tile(alpha_crop(Image.open(aqua(3)).convert('RGBA')), 0.03)])[0].save(f'{OUT}/aq_path.png')  # Mosaik: nur den Umriss weg
for k, n in {'aq_bench': 0, 'aq_lamp': 2, 'aq_statue': 4, 'coral': 5}.items():
    place(crop(dehalo(Image.open(aqua(n)).convert('RGBA'))), old(k), shadow=None, solid=200).save(f'{OUT}/{k}.png')
# Seegras und Schatzkiste im Becken (eigene Lieferung): der dunkle Schein um die Figur fällt weg
for k, name in {'seaweed': 'Seegras', 'tank_chest': 'Kiste'}.items():
    new = np.asarray(Image.open(f'{A}/scenario-assets-Aquarium/{name}.png').convert('RGBA')).copy()
    new[new[..., 3] < 200] = 0
    place(crop(Image.fromarray(new, 'RGBA')), old(k), shadow=None, solid=200).save(f'{OUT}/{k}.png')


def lamp_glow(im, color=(255, 242, 176), alpha=65):
    # warmer Schein um den Quallenschirm (wie bei der alten Lampe): rund, nach außen weich auslaufend, hinter der Lampe
    a = np.asarray(im)
    pink = (a[..., 0] > 200) & (a[..., 2] > 180) & (a[..., 3] > 200)
    ys, xs = np.nonzero(pink)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    head = (xs.max() - xs.min()) / 2  # ab dem Schirmrand klingt der Schein aus
    r = head + 13 * F
    yy, xx = np.mgrid[0:im.height, 0:im.width]
    t = np.clip((r - np.hypot(xx - cx, yy - cy)) / (r - head), 0, 1)
    glow = np.zeros((im.height, im.width, 4), np.uint8)
    glow[..., :3] = color
    glow[..., 3] = (t ** 1.2 * alpha).round().astype(np.uint8)
    out = Image.fromarray(glow, 'RGBA')
    out.alpha_composite(im)
    return out


lamp_glow(Image.open(f'{OUT}/aq_lamp.png')).save(f'{OUT}/aq_lamp.png')

# ---- Reptilienhaus ----
flatten([tile(alpha_crop(Image.open(rept(0)).convert('RGBA')), 0.035)])[0].save(f'{OUT}/floor_reptiles.png')  # 3x3 Platten
flatten([tile(alpha_crop(Image.open(rept(9)).convert('RGBA')))])[0].save(f'{OUT}/terrarium_floor.png')


def no_haze(im, below=160):
    # halb durchsichtiger heller Schleier (hinter dem Spinnennetz) weg, die Fäden bleiben
    a = np.asarray(im).copy()
    a[a[..., 3] < below] = 0
    return Image.fromarray(a, 'RGBA')


def pale_glass(im, alpha):
    # fast weißes, leicht grünliches Glas (Terrarium) durchsichtig machen; das helle Holz ist wärmer und bleibt
    a = np.asarray(im).copy()
    c = a[..., :3].astype(int)
    pane = (c.min(2) > 190) & (c.max(2) - c.min(2) < 35) & (c[..., 1] >= c[..., 0] - 8)
    a[..., 3] = np.where(pane, np.minimum(a[..., 3], alpha), a[..., 3])
    return Image.fromarray(a, 'RGBA')


for k, n in {'post_hutwall_reptiles': 6, 'post_hutwall_terrarium': 7, 'spider_web': 8}.items():
    new = Image.open(rept(n)).convert('RGBA')
    place(crop(no_haze(new) if k == 'spider_web' else new), old(k), shadow=None, solid=200).save(f'{OUT}/{k}.png')
for k, n in {'hutwall_reptiles': 2, 'hutwall_terrarium': 4}.items():
    for side, m in (('x', n), ('y', n + 1)):
        im = place(crop(Image.open(rept(m)).convert('RGBA')), old(f'{k}_{side}'), 'ends', shadow=None, solid=200, axis=None if k.startswith('gate') else side)
        (pale_glass(im, 95) if k == 'hutwall_terrarium' else im).save(f'{OUT}/{k}_{side}.png')  # Terrarienscheiben durchsichtig
for k, n in {'hutwall_aquarium': 7, 'hutwall_tank': 9}.items():
    for side, m in (('x', n), ('y', n + 1)):
        im = place(crop(Image.open(aqua(m)).convert('RGBA')), old(f'{k}_{side}'), 'ends', shadow=None, solid=200, axis=None if k.startswith('gate') else side)
        (glass(im, 90) if k == 'hutwall_tank' else im).save(f'{OUT}/{k}_{side}.png')  # Beckenscheiben durchsichtig wie vorher
import subprocess
subprocess.run([sys.executable, os.path.join(ROOT, 'tools/park-path.py'), f'{OUT}/park_path.png'], check=True)
print('ok', len(os.listdir(OUT)))
subprocess.run([sys.executable, os.path.join(ROOT, 'tools/hd-phone.py')], check=True, cwd=ROOT)  # Handy-Fassung (hd2/)
