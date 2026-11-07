"""Echte Bilder an die Stelle der Platzhalter setzen (für tools/meadow-art.py und tools/forest-art.py): jedes Bild kommt
in die Box des Platzhalters (4-fach), unten mittig, so groß es hineinpasst; der weiche Schatten des Platzhalters bleibt.
So bleiben Größe und Fußpunkt (originY in map.js) gleich."""
import os
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

A = 'public/assets'
F = 4
OUT = {'': 1, 'hd': 4, 'hd2': 2}
HOLE = 400  # eingeschlossene weiße Flächen ab so vielen Pixeln (im Originalbild) werden auch durchsichtig


def cutout_white(im):
    """weißen Hintergrund (vom Rand aus erreichbar, fast weiß und farblos) durchsichtig machen, Kante leicht weich"""
    a = np.asarray(im.convert('RGB')).astype(int)
    h, w = a.shape[:2]
    cand = (a.min(2) >= 232) & (a.max(2) - a.min(2) <= 14)
    bg = np.zeros((h, w), bool)
    q = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    while q:
        x, y = q.popleft()
        if bg[y, x] or not cand[y, x]:
            continue
        bg[y, x] = True
        q.extend((nx, ny) for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if 0 <= nx < w and 0 <= ny < h and not bg[ny, nx])
    # eingeschlossene weiße Flächen (z. B. ein Loch im Knochen) ab HOLE Pixeln auch; kleine Lichter bleiben
    seen = bg.copy()
    for y0, x0 in zip(*np.nonzero(cand & ~bg)):
        if seen[y0, x0]:
            continue
        comp = []
        q = deque([(x0, y0)])
        seen[y0, x0] = True
        while q:
            x, y = q.popleft()
            comp.append((y, x))
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and cand[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((nx, ny))
        if len(comp) >= HOLE:
            ys, xs = np.array(comp).T
            bg[ys, xs] = True
    m = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(m)
    return out


def crop(im):
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())


def place(new, ref, center=False, shrink=1):
    a = np.asarray(ref)
    shadow = (a[..., 3] < 100) & (a[..., 0] < 60) & (a[..., 1] < 80)  # weicher dunkelgrüner Schatten
    body = (a[..., 3] > 150) & ~shadow
    ys, xs = np.nonzero(body)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    k = min((x1 - x0) / new.width, (y1 - y0) / new.height) * shrink  # shrink: kleiner als der Platzhalter (Fuß bleibt)
    new = new.resize((max(1, round(new.width * k)), max(1, round(new.height * k))), Image.LANCZOS)
    out = Image.fromarray(np.where(shadow[..., None], a, 0).astype(np.uint8), 'RGBA')
    x = round((x0 + x1 - new.width) / 2)
    y = round((y0 + y1 - new.height) / 2) if center else y1 - new.height
    out.alpha_composite(new, (x, y))
    return out


def pieces(path, min_share=0.02):
    """einzelne Teile eines Sammelbilds (z. B. mehrere Felsen auf weißem Grund): freigestellt, nach Lage geordnet
    (zeilenweise von oben links); winzige Krümel (unter min_share der größten Fläche) fallen weg"""
    im = Image.open(path)
    im = cutout_white(im) if path.lower().endswith('.jpg') else im.convert('RGBA')
    small = 4  # Flächen auf einem verkleinerten Bild suchen (schneller)
    a = np.asarray(im.getchannel('A').resize((im.width // small, im.height // small))) > 60
    h, w = a.shape
    seen = np.zeros_like(a)
    boxes = []
    for y0, x0 in zip(*np.nonzero(a)):
        if seen[y0, x0]:
            continue
        q = deque([(x0, y0)])
        seen[y0, x0] = True
        xs, ys = [], []
        while q:
            x, y = q.popleft()
            xs.append(x)
            ys.append(y)
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1), (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and a[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((nx, ny))
        boxes.append((len(xs), (min(xs) * small, min(ys) * small, (max(xs) + 1) * small, (max(ys) + 1) * small), (xs, ys)))
    big = max(b[0] for b in boxes)
    boxes = [b for b in boxes if b[0] >= big * min_share]
    boxes.sort(key=lambda b: (round(b[1][1] / (im.height / 3)), b[1][0]))  # grob zeilenweise, dann von links
    out = []
    for _, box, (xs, ys) in boxes:
        # nur die eigene Fläche (ohne Ecken der Nachbarn im selben Rechteck)
        m = np.zeros((h, w), np.uint8)
        m[ys, xs] = 255
        mask = Image.fromarray(m).resize(im.size, Image.NEAREST).filter(ImageFilter.MaxFilter(2 * small + 1))
        part = im.copy()
        part.putalpha(Image.fromarray(np.minimum(np.asarray(im.getchannel('A')), np.asarray(mask))))
        out.append(part.crop(box))
    return out


def install(art, ref_dir, src, center=(), prepare=None, shrink=None, refs=None):
    """alle Bilder aus art ({Name: Nummer, Pfad oder fertiges Bild}) einbauen; prepare(name, bild) kann ein Bild vorher
    bearbeiten; shrink: {Name: Faktor} für Bilder, die kleiner als ihr Platzhalter sein sollen; refs: {Name: Name des
    Platzhalters}, wenn ein Bild den Rahmen eines anderen nimmt (z. B. mehrere Felsen in der Größe eines Platzhalters)"""
    for key, n in art.items():
        if os.environ.get('ONLY') not in (None, key):
            continue
        ref = Image.open(f'{ref_dir}/{(refs or {}).get(key, key)}.png').convert('RGBA')
        if isinstance(n, Image.Image):
            new = n
        else:
            path = src(n)
            new = Image.open(path)
            new = cutout_white(new) if path.lower().endswith('.jpg') else new.convert('RGBA')
        new = crop(new)
        if prepare:
            new = prepare(key, new)
        big = place(new, ref, key in center, (shrink or {}).get(key, 1))
        w, h = big.width // F, big.height // F
        for sub, f in OUT.items():
            big.resize((w * f, h * f), Image.LANCZOS).save(os.path.join(A, sub, key + '.png'), optimize=True)
        print(key, w, 'x', h)
