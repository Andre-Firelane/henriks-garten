"""Aufruf: python tools/plateau-hd.py .   (braucht Pillow und numpy)
Glatte (nicht pixelige) Bilder für die Hochebene im Bambuswald: Stange der Gebetsfahnen, Stupa, Salzstein (am Boden und
in der Hand) und Bürste. Gezeichnet in 8-facher Größe, verkleinert nach public/assets (Grundgröße, wie die alten
Pixel-Sprites aus tools/make-sprites.js: gleiche Maße und Fußpunkte), hd (4-fach) und hd2 (2-fach).
Danach tools/make-webp.py laufen lassen. Die Bilder stehen in HD (src/world/hd.js)."""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
A = os.path.join(ROOT, 'public/assets')
S = 8  # Zeichenmaßstab
INK = (52, 36, 28, 255)
SHADOW = (20, 40, 10, 70)


def canvas(w, h):
    return Image.new('RGBA', (w * S, h * S), (0, 0, 0, 0))


def P(*pts):
    return [(x * S, y * S) for x, y in pts]


def layer(img, draw_fn, mask=None):
    """auf einer eigenen Ebene zeichnen; mit mask nur innerhalb dieser Form (Schattierungen)"""
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(lay))
    if mask is not None:
        a = np.asarray(lay).copy()
        a[..., 3] = (a[..., 3].astype(int) * (np.asarray(mask) > 0)).astype(np.uint8)
        lay = Image.fromarray(a)
    img.alpha_composite(lay)


def mask_of(size, draw_fn):
    m = Image.new('L', size, 0)
    draw_fn(ImageDraw.Draw(m))
    return m


def outline(img, width=1.2):
    """Kontur um alles Gezeichnete (wie die übrigen HD-Bilder)"""
    a = np.asarray(img)[..., 3]
    m = Image.fromarray(((a > 40) * 255).astype(np.uint8))
    grown = m.filter(ImageFilter.MaxFilter(int(width * S) // 2 * 2 + 1))
    ring = Image.new('RGBA', img.size, INK)
    ring.putalpha(grown)
    ring.alpha_composite(img)
    return ring


def shadow(img, cx, cy, rx, ry):
    s = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(s).ellipse(P((cx - rx, cy - ry), (cx + rx, cy + ry)), fill=SHADOW)
    s.alpha_composite(img)
    return s


def save(img, name, w, h):
    for sub, f in [('', 1), ('hd2', 2), ('hd', 4)]:
        out = img.resize((w * f, h * f), Image.LANCZOS)
        out.save(os.path.join(A, sub, name + '.png'))
        print(os.path.join(sub, name + '.png'), out.size)


# Stange der Gebetsfahnen: Holz mit Maserung, oben ein goldener Knauf und ein Büschel Stoff; Fuß bei (8, 60)
def prayer_pole():
    w, h = 16, 64
    img = canvas(w, h)
    pole = lambda d, fill: d.rounded_rectangle(P((6.6, 7), (9.6, 60.5)), radius=0.8 * S, fill=fill)
    layer(img, lambda d: pole(d, (138, 100, 62, 255)))
    m = mask_of(img.size, lambda d: pole(d, 255))
    layer(img, lambda d: d.rectangle(P((6.6, 7), (7.5, 61)), fill=(176, 134, 88, 255)), m)
    layer(img, lambda d: d.rectangle(P((8.7, 7), (9.6, 61)), fill=(102, 72, 44, 255)), m)
    for y in (18, 31, 44):
        layer(img, lambda d, y=y: d.line(P((7.9, y), (8.2, y + 4)), fill=(96, 66, 40, 255), width=S // 3), m)
    # Stoffbüschel unter dem Knauf (die fünf Farben)
    for i, c in enumerate([(58, 111, 208), (244, 244, 238), (216, 58, 46), (58, 160, 74), (240, 200, 58)]):
        x = 4.6 + i * 1.6
        layer(img, lambda d, x=x, c=c: d.polygon(P((x, 7.5), (x + 1.6, 7.5), (x + 1.2 + (i - 2) * 0.25, 13), (x + 0.3 + (i - 2) * 0.25, 13)), fill=c + (255,)))
    layer(img, lambda d: d.ellipse(P((5.6, 2.2), (10.6, 7.4)), fill=(232, 186, 70, 255)))
    layer(img, lambda d: d.ellipse(P((6.6, 3), (8.4, 4.8)), fill=(255, 238, 170, 255)))
    img = outline(img, 0.9)
    return shadow(img, 8.5, 60, 4.5, 1.6), w, h


# kleine weiße Stupa (Chörten): Stufensockel, Kuppel, rotes Band, goldene Spitze mit Ringen; Fuß bei (24, 72)
def stupa():
    w, h = 48, 80
    img = canvas(w, h)
    WHITE, LIGHT, SHADE = (236, 236, 232, 255), (252, 252, 250, 255), (196, 202, 212, 255)
    for (x0, y0, x1, y1) in [(6, 62, 42, 72), (9, 54, 39, 62.5), (12, 47, 36, 54.5)]:
        box = lambda d, f, x0=x0, y0=y0, x1=x1, y1=y1: d.rounded_rectangle(P((x0, y0), (x1, y1)), radius=0.6 * S, fill=f)
        layer(img, lambda d, box=box: box(d, WHITE))
        m = mask_of(img.size, lambda d, box=box: box(d, 255))
        layer(img, lambda d, x0=x0, y0=y0, y1=y1: d.rectangle(P((x0, y0), (x0 + 3, y1)), fill=LIGHT), m)
        layer(img, lambda d, x1=x1, y0=y0, y1=y1: d.rectangle(P((x1 - 5, y0), (x1, y1)), fill=SHADE), m)
        layer(img, lambda d, x0=x0, x1=x1, y0=y0: d.rectangle(P((x0, y0), (x1, y0 + 0.8)), fill=LIGHT), m)
    layer(img, lambda d: d.rectangle(P((12, 47), (36, 49)), fill=(184, 64, 46, 255)))
    dome = lambda d, f: d.ellipse(P((13, 31), (35, 50)), fill=f)
    layer(img, lambda d: dome(d, WHITE))
    m = mask_of(img.size, lambda d: dome(d, 255))
    layer(img, lambda d: d.ellipse(P((25, 33), (40, 54)), fill=SHADE), m)
    layer(img, lambda d: d.ellipse(P((15, 33), (24, 42)), fill=LIGHT), m)
    layer(img, lambda d: d.rectangle(P((19, 28), (29, 32.5)), fill=WHITE))
    layer(img, lambda d: d.rectangle(P((26, 28), (29, 32.5)), fill=SHADE))
    spire = lambda d, f: d.polygon(P((20, 28.5), (28, 28.5), (25.6, 11.5), (22.4, 11.5)), fill=f)
    layer(img, lambda d: spire(d, (216, 168, 56, 255)))
    m = mask_of(img.size, lambda d: spire(d, 255))
    layer(img, lambda d: d.rectangle(P((24.6, 10), (29, 29)), fill=(176, 128, 36, 255)), m)
    for y in (25.5, 22, 18.5, 15):
        layer(img, lambda d, y=y: d.line(P((19, y), (29, y)), fill=(150, 108, 30, 255), width=max(1, S // 2)), m)
    layer(img, lambda d: d.ellipse(P((21.6, 7.6), (26.4, 12.4)), fill=(244, 204, 80, 255)))
    layer(img, lambda d: d.ellipse(P((22.6, 8.4), (24, 9.8)), fill=(255, 245, 200, 255)))
    img = outline(img, 1.0)
    return shadow(img, 24, 72, 19, 3.5), w, h


# Salzstein: rosa Kristallbrocken mit Facetten und Glanzpunkten
def salt_crystal(w, h, ox, oy, k):
    img = canvas(w, h)
    T = lambda *pts: P(*[(ox + x * k, oy + y * k) for x, y in pts])
    layer(img, lambda d: d.polygon(T((5, 20), (8, 10), (15, 5), (24, 7), (28, 16), (25, 23), (11, 24)), fill=(220, 146, 154, 255)))
    layer(img, lambda d: d.polygon(T((8, 11), (15, 6), (23, 8), (18, 13), (10, 14)), fill=(248, 206, 210, 255)))
    layer(img, lambda d: d.polygon(T((18, 13), (23, 8), (27, 16), (24, 21), (19, 19)), fill=(190, 110, 120, 255)))
    layer(img, lambda d: d.polygon(T((10, 14), (18, 13), (19, 19), (12, 21)), fill=(234, 170, 176, 255)))
    layer(img, lambda d: d.polygon(T((6, 19), (10, 14), (12, 21), (11, 23.5)), fill=(206, 128, 138, 255)))
    for (x, y, r) in [(13.5, 9.5, 0.9), (21, 11, 0.7), (16, 16, 0.5)]:
        layer(img, lambda d, x=x, y=y, r=r: d.ellipse(T((x - r, y - r), (x + r, y + r)), fill=(255, 255, 255, 255)))
    return outline(img, 0.8 * k)


def salt_stone():
    img = salt_crystal(32, 28, 0, 0, 1)
    return shadow(img, 16, 23, 12, 3), 32, 28


def salt_tool():
    return salt_crystal(64, 64, 2, 8, 2), 64, 64


# Bürste fürs Yak-Fell: Holzrücken mit Lederschlaufe, darunter helle Borsten
def brush():
    w, h = 64, 64
    img = canvas(w, h)
    for i, x in enumerate(np.arange(14, 51, 1.5)):
        c = (238, 224, 186, 255) if i % 2 else (214, 196, 150, 255)
        layer(img, lambda d, x=x, c=c: d.line(P((x, 33), (x + (x - 32) * 0.08, 46)), fill=c, width=int(1.1 * S)))
    back = lambda d, f: d.ellipse(P((10, 21), (54, 39)), fill=f)
    layer(img, lambda d: back(d, (170, 112, 62, 255)))
    m = mask_of(img.size, lambda d: back(d, 255))
    layer(img, lambda d: d.ellipse(P((12, 21), (46, 32)), fill=(202, 140, 82, 255)), m)
    layer(img, lambda d: d.ellipse(P((18, 23), (34, 27)), fill=(228, 170, 108, 255)), m)
    layer(img, lambda d: d.rounded_rectangle(P((18, 25), (46, 29.5)), radius=S, fill=(110, 66, 38, 255)))
    layer(img, lambda d: d.line(P((19, 25.8), (45, 25.8)), fill=(146, 92, 56, 255), width=S // 2))
    return outline(img, 1.0), w, h


for name, fn in [('prayer_pole', prayer_pole), ('stupa', stupa), ('salt_stone', salt_stone), ('salttool', salt_tool), ('brush', brush)]:
    img, w, h = fn()
    save(img, name, w, h)
