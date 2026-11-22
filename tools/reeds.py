"""Schilf (reeds, Teiche im Tierpark): Büschel aus schmalen, gebogenen Blättern und Rohrkolben, gezeichnet statt aus der
KI-Vorlage (die war eckig/klotzig). Gleiche Box und gleicher Fußpunkt wie vorher (64 x 64, originY 52/64 in map.js).
Aufruf: python tools/reeds.py [Ordner]   (ohne Ordner: public/assets, hd/ (4-fach) und hd2/ (2-fach); wird von
tools/hd-sprites.py mit aufgerufen). Danach python tools/make-webp.py .
Gezeichnet in 32-facher Größe (8 × HD), dann verkleinert: glatte Kanten."""
import math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter

W = H = 64        # Spielgröße
S = 32            # Zeichenmaßstab
FOOT = (34, 54)   # Fußpunkt des Büschels (Spielpixel), etwas unter originY, damit die Halme im Boden stecken
INK = (56, 40, 24, 255)
SHADOW = (20, 40, 10, 70)
LEAF = [(98, 140, 52), (116, 158, 60), (134, 174, 70)]   # hinten dunkler, vorne heller
STALK = (122, 150, 64)
CATTAIL = (124, 74, 38)
OW = 0.55         # Konturbreite (Spielpixel)


def bez(p0, p1, p2, t):
    a = (1 - t) ** 2; b = 2 * (1 - t) * t; c = t * t
    return a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]


def ribbon(p0, p1, p2, w0, w1, extra=0.0, n=40):
    """Umriss eines gebogenen Bands von p0 (Breite w0) über p1 nach p2 (Breite w1); extra: rundum dicker (Kontur)"""
    left, right = [], []
    for i in range(n + 1):
        t = i / n
        x, y = bez(p0, p1, p2, t)
        dx, dy = (bez(p0, p1, p2, min(t + 0.01, 1))[0] - bez(p0, p1, p2, max(t - 0.01, 0))[0],
                  bez(p0, p1, p2, min(t + 0.01, 1))[1] - bez(p0, p1, p2, max(t - 0.01, 0))[1])
        l = math.hypot(dx, dy) or 1
        nx, ny = -dy / l, dx / l
        w = (w0 + (w1 - w0) * t) / 2 + extra
        left.append((x + nx * w, y + ny * w)); right.append((x - nx * w, y - ny * w))
    tip = bez(p0, p1, p2, 1)
    if extra:  # Spitze der Kontur etwas über das Blatt hinaus
        dx, dy = tip[0] - bez(p0, p1, p2, 0.97)[0], tip[1] - bez(p0, p1, p2, 0.97)[1]
        l = math.hypot(dx, dy) or 1
        tip = (tip[0] + dx / l * extra, tip[1] + dy / l * extra)
    return left + [tip] + right[::-1]


def light(c, k):
    return tuple(int(v + (255 - v) * k) for v in c[:3]) + (255,)


def dark(c, k):
    return tuple(int(v * k) for v in c[:3]) + (255,)


def sc(pts):
    return [(x * S, y * S) for x, y in pts]


def leaf(d, base, lean, height, bend, width, col):
    """Blatt: unten breit, nach oben spitz, biegt zur Seite (lean) und hängt an der Spitze über (bend)"""
    p0 = base
    p2 = (base[0] + lean, base[1] - height + bend)
    p1 = (base[0] + lean * 0.25, base[1] - height * 0.85)
    d.polygon(sc(ribbon(p0, p1, p2, width, 0, OW)), fill=INK)
    d.polygon(sc(ribbon(p0, p1, p2, width, 0)), fill=col + (255,))
    # Mittelrippe als heller Streifen auf der Lichtseite (oben links)
    q0 = (p0[0] - width * 0.18, p0[1]); q1 = (p1[0] - width * 0.15, p1[1]); q2 = p2
    d.polygon(sc(ribbon(q0, q1, q2, width * 0.3, 0)), fill=light(col, 0.28))


def cattail(d, base, lean, height, size):
    """Halm mit Rohrkolben: dünner, leicht gebogener Stängel, oben der braune Kolben und eine feine Spitze"""
    top = (base[0] + lean, base[1] - height)
    mid = (base[0] + lean * 0.2, base[1] - height * 0.55)
    sw = 1.25
    d.polygon(sc(ribbon(base, mid, top, sw, sw * 0.8, OW)), fill=INK)
    d.polygon(sc(ribbon(base, mid, top, sw, sw * 0.8)), fill=STALK + (255,))
    # Richtung am oberen Ende
    dx, dy = top[0] - bez(base, mid, top, 0.95)[0], top[1] - bez(base, mid, top, 0.95)[1]
    l = math.hypot(dx, dy); ux, uy = dx / l, dy / l
    kl, kw = 7.0 * size, 3.0 * size  # Kolben: Länge, Breite
    k0 = (top[0] - ux * 1.0, top[1] - uy * 1.0)
    k1 = (k0[0] + ux * kl, k0[1] + uy * kl)
    spike = (k1[0] + ux * 3.2 * size, k1[1] + uy * 3.2 * size)
    # feine Spitze über dem Kolben
    d.line(sc([k1, spike]), fill=INK, width=int(0.9 * S))
    d.line(sc([k1, spike]), fill=STALK + (255,), width=int(0.4 * S))
    # Kolben als Kapsel (Linie mit runden Enden)
    for w, c in [(kw + 2 * OW, INK), (kw, CATTAIL + (255,))]:
        d.line(sc([k0, k1]), fill=c, width=int(w * S))
        for p in (k0, k1):
            r = w / 2 * S
            d.ellipse([p[0] * S - r, p[1] * S - r, p[0] * S + r, p[1] * S + r], fill=c)
    # Licht: heller Streifen links, Schatten rechts
    nx, ny = -uy, ux
    off = kw * 0.22
    a = (k0[0] - nx * off, k0[1] - ny * off); b = (k1[0] - nx * off, k1[1] - ny * off)
    d.line(sc([a, b]), fill=light(CATTAIL, 0.3), width=int(kw * 0.32 * S))
    a = (k0[0] + nx * off * 1.3, k0[1] + ny * off * 1.3); b = (k1[0] + nx * off * 1.3, k1[1] + ny * off * 1.3)
    d.line(sc([a, b]), fill=dark(CATTAIL, 0.8), width=int(kw * 0.25 * S))


def draw():
    im = Image.new('RGBA', (W * S, H * S))
    # weicher Schatten am Boden
    sh = Image.new('L', im.size)
    ImageDraw.Draw(sh).ellipse([(FOOT[0] - 17) * S, (FOOT[1] - 3.2) * S, (FOOT[0] + 17) * S, (FOOT[1] + 3.2) * S], fill=255)
    sh = sh.filter(ImageFilter.GaussianBlur(1.2 * S))
    im.paste(Image.new('RGBA', im.size, SHADOW), (0, 0), sh.point(lambda v: v * SHADOW[3] // 255))
    d = ImageDraw.Draw(im)
    r = random.Random(4)
    fx, fy = FOOT
    # hintere Blätter (dunkel)
    for x, lean, h, bend in [(-9, -9, 26, 5), (-3, -4, 32, 3), (4, 5, 33, 4), (10, 10, 25, 6), (0, 1, 36, 2)]:
        leaf(d, (fx + x, fy), lean, h, bend, 3.6, LEAF[0])
    # Rohrkolben (verschieden hoch, leicht geneigt)
    for x, lean, h, size in [(-6, -3.5, 33, 0.95), (-1, -0.5, 41, 1.0), (4, 2.5, 37, 1.0), (8, 5, 30, 0.9), (-10, -6, 26, 0.85)]:
        cattail(d, (fx + x, fy + 0.5), lean, h, size)
    # mittlere Blätter
    for x, lean, h, bend in [(-12, -13, 20, 7), (-5, -7, 27, 6), (2, 3, 29, 5), (9, 11, 22, 6), (13, 14, 16, 5)]:
        leaf(d, (fx + x, fy + 0.5), lean, h, bend, 3.4, LEAF[1])
    # vordere, kurze Blätter (hell)
    for x, lean, h, bend in [(-14, -10, 13, 4), (-7, -5, 17, 4), (-1, 2, 19, 3), (6, 8, 15, 4), (12, 10, 11, 3)]:
        leaf(d, (fx + x, fy + 1), lean, h, bend, 3.2, LEAF[2])
    return im


def save(out_dir=None):
    big = draw()
    outs = {'': 1, 'hd': 4, 'hd2': 2}
    if out_dir:
        for sub, f in outs.items():
            p = os.path.join(out_dir, sub); os.makedirs(p, exist_ok=True)
            big.resize((W * f, H * f), Image.LANCZOS).save(os.path.join(p, 'reeds.png'), optimize=True)
        return
    for sub, f in outs.items():
        big.resize((W * f, H * f), Image.LANCZOS).save(os.path.join('public/assets', sub, 'reeds.png'), optimize=True)
    print('reeds', W, 'x', H)


if __name__ == '__main__':
    save(sys.argv[1] if len(sys.argv) > 1 else None)
