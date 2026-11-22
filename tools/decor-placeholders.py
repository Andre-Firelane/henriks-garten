"""Aufruf: python tools/decor-placeholders.py          Platzhalter zeichnen (große Fassung) und alle Größen erzeugen
        python tools/decor-placeholders.py --from-hd  nur die kleinen Fassungen aus public/assets/hd/ neu erzeugen
                                                      (z. B. nachdem Andre die Bilder in hd/ überarbeitet hat)
Platzhalter für die neue Deko aus Schritt 8 (docs/plan-deko.md): einfach gezeichnet in der großen Fassung (4× so groß wie
im Spiel, wie public/assets/hd/), daraus hd2/ (2×) und die Spielgröße. Kopien zum Überarbeiten: Claude-Sprites/Deko.
Größe und Fußpunkt (FOOT: Kachelmitte bzw. Mitte der Grundfläche) müssen beim Überarbeiten gleich bleiben.
Danach: python tools/make-webp.py ."""
import math
import os
import shutil
import sys
from PIL import Image, ImageDraw

A = 'public/assets'
OUT_COPY = 'Claude-Sprites/Deko'
LINE = (60, 36, 18, 255)
W4 = 6  # Linienbreite in der großen Fassung

# key: (Breite, Höhe in Spielgröße, Fuß y in Spielgröße)
SIZES = {
    'park_lantern': (24, 64, 61),
    'stepping_stones': (64, 32, 16),
    'hedge': (64, 56, 40),
    'golden_fountain': (72, 80, 62),
}


def canvas(key):
    w, h, _ = SIZES[key]
    im = Image.new('RGBA', (w * 4, h * 4), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im), w * 4, h * 4, SIZES[key][2] * 4


def ell(d, cx, cy, rx, ry, fill, width=W4):
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=fill, outline=LINE, width=width)


def poly(d, pts, fill, width=W4):
    d.polygon([tuple(map(round, p)) for p in pts], fill=fill, outline=LINE, width=width)


def thick(d, pts, color, width):
    """Linie mit dunkler Kontur."""
    d.line([tuple(map(round, p)) for p in pts], fill=LINE, width=width + 8, joint='curve')
    d.line([tuple(map(round, p)) for p in pts], fill=color, width=width, joint='curve')


def glow(im, cx, cy, r, color):
    g = Image.new('RGBA', im.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    for i in range(8, 0, -1):
        rr = r * i / 8
        gd.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=color[:3] + (int(color[3] * (1 - i / 9)),))
    im.alpha_composite(g)


def park_lantern():
    im, d, W, H, F = canvas('park_lantern')
    cx = W // 2
    glow(im, cx, 60, 46, (255, 220, 120, 120))
    poly(d, [(cx - 22, F), (cx + 22, F), (cx + 14, F - 22), (cx - 14, F - 22)], (52, 56, 66, 255))
    d.rectangle((cx - 7, 92, cx + 7, F - 20), fill=(52, 56, 66, 255), outline=LINE, width=W4)
    d.rectangle((cx - 22, 40, cx + 22, 90), fill=(255, 214, 110, 255), outline=LINE, width=W4)
    d.line((cx, 40, cx, 90), fill=(52, 56, 66, 255), width=4)
    poly(d, [(cx - 30, 42), (cx + 30, 42), (cx, 12)], (52, 56, 66, 255))
    poly(d, [(cx - 16, 92), (cx + 16, 92), (cx + 10, 100), (cx - 10, 100)], (52, 56, 66, 255))
    return im


def stepping_stones():
    im, d, W, H, F = canvas('stepping_stones')
    for x, y, rx, ry in [(70, 62, 30, 15), (130, 46, 28, 14), (176, 74, 32, 15), (112, 92, 30, 14)]:
        ell(d, x, y + 4, rx, ry, (120, 116, 108, 255))
        ell(d, x, y, rx, ry, (176, 170, 158, 255))
        d.arc((x - rx * 0.6, y - ry * 0.7, x + rx * 0.3, y), 190, 300, fill=(215, 210, 198, 255), width=4)
    return im


def hedge():
    im, d, W, H, F = canvas('hedge')
    c = (W / 2, F)
    a = (c[0] - 64, c[1] - 32)
    b = (c[0] + 64, c[1] + 32)
    t = (-26, 13)
    up = 92
    def p(q, s=1, u=0):
        return (q[0] + t[0] * s, q[1] + t[1] * s - u)
    poly(d, [p(a), p(b), p(b, 1, up), p(a, 1, up)], (72, 132, 60, 255))          # Seite zur Kamera
    poly(d, [p(b), p(b, -1), p(b, -1, up), p(b, 1, up)], (56, 110, 50, 255))   # Ende
    poly(d, [p(a, 1, up), p(b, 1, up), p(b, -1, up), p(a, -1, up)], (112, 172, 82, 255))  # oben
    for i in range(14):
        s = (i * 37 % 100) / 100
        q = (a[0] + (b[0] - a[0]) * s + t[0], a[1] + (b[1] - a[1]) * s + t[1] - 20 - (i * 53 % 60))
        d.ellipse((q[0] - 5, q[1] - 4, q[0] + 5, q[1] + 4), fill=(96, 158, 72, 255))
    return im


def flower_arch():
    im, d, W, H, F = canvas('flower_arch')
    c = (W / 2, F)
    a = (c[0] - 70, c[1] - 35)
    b = (c[0] + 70, c[1] + 35)
    top = 160
    white = (246, 241, 230, 255)
    thick(d, [a, (a[0], a[1] - top)], white, 12)
    curve = []
    for i in range(21):
        s = i / 20
        x = a[0] + (b[0] - a[0]) * s
        y = a[1] + (b[1] - a[1]) * s - top - math.sin(math.pi * s) * 60
        curve.append((x, y))
    thick(d, curve, white, 12)
    thick(d, [b, (b[0], b[1] - top)], white, 12)
    for i, (x, y) in enumerate(curve[1:-1] + [(a[0], a[1] - top * k) for k in (0.3, 0.6)] + [(b[0], b[1] - top * k) for k in (0.4, 0.75)]):
        d.ellipse((x - 11, y - 8, x + 11, y + 8), fill=(84, 140, 64, 255))
        if i % 2 == 0:
            ell(d, x + 4, y - 4, 8, 8, (214, 64, 86, 255), 3)
    return im


def lantern_post():
    im, d, W, H, F = canvas('lantern_post')
    cx = W // 2
    d.rectangle((cx - 8, 40, cx + 8, F), fill=(150, 98, 52, 255), outline=LINE, width=W4)
    d.rectangle((cx - 70, 40, cx + 70, 54), fill=(150, 98, 52, 255), outline=LINE, width=W4)
    for side in (-1, 1):
        pts = [(cx + side * (10 + 56 * s), 54 + math.sin(math.pi * s) * 40) for s in [i / 10 for i in range(11)]]
        d.line(pts, fill=LINE, width=3)
        for j, s in enumerate((0.25, 0.55, 0.85)):
            x = cx + side * (10 + 56 * s)
            y = 54 + math.sin(math.pi * s) * 40 + 14
            col = [(226, 74, 66, 255), (246, 196, 64, 255), (82, 150, 214, 255)][(j + (side > 0)) % 3]
            glow(im, x, y, 20, col[:3] + (90,))
            ell(d, x, y, 10, 13, col, 4)
    return im


def golden_fountain():
    im, d, W, H, F = canvas('golden_fountain')
    cx = W // 2
    ell(d, cx, F + 6, 130, 54, (150, 146, 138, 255))
    ell(d, cx, F - 4, 130, 54, (196, 190, 178, 255))
    ell(d, cx, F - 8, 104, 40, (110, 172, 222, 255))
    d.rectangle((cx - 18, 140, cx + 18, F - 10), fill=(196, 190, 178, 255), outline=LINE, width=W4)
    ell(d, cx, 140, 40, 14, (196, 190, 178, 255))
    for side in (-1, 1):
        pts = [(cx + side * 50 * s, 120 + 90 * s * s - 30 * s) for s in [i / 10 for i in range(11)]]
        d.line(pts, fill=(170, 214, 240, 255), width=6)
    ell(d, cx, 104, 30, 30, (232, 182, 44, 255))
    ell(d, cx - 18, 78, 10, 10, (232, 182, 44, 255), 4)   # Ohren: eine goldene Tierfigur (Bär)
    ell(d, cx + 18, 78, 10, 10, (232, 182, 44, 255), 4)
    ell(d, cx, 104, 30, 30, (232, 182, 44, 255))
    d.ellipse((cx - 12, 92, cx - 4, 100), fill=LINE)
    d.ellipse((cx + 4, 92, cx + 12, 100), fill=LINE)
    d.arc((cx - 10, 100, cx + 10, 116), 20, 160, fill=LINE, width=4)
    d.ellipse((cx - 22, 84, cx - 12, 92), fill=(255, 236, 150, 255))
    return im


def pavilion():
    im, d, W, H, F = canvas('pavilion')
    cx = W / 2
    rx, ry, up = 180, 90, 210
    posts = [(cx + rx * math.cos(a), F + ry * math.sin(a)) for a in [math.pi * (0.125 + i / 4) for i in range(8)]]
    floor = [(cx + (rx + 26) * math.cos(a), F + (ry + 13) * math.sin(a)) for a in [math.pi * (0.125 + i / 4) for i in range(8)]]
    poly(d, [(x, y + 18) for x, y in floor], (150, 108, 70, 255))
    poly(d, floor, (204, 164, 112, 255))
    back = [p for p in posts if p[1] < F]
    front = [p for p in posts if p[1] >= F]
    for x, y in back:
        d.rectangle((x - 8, y - up, x + 8, y), fill=(246, 241, 230, 255), outline=LINE, width=W4)
    # Bank in der Mitte
    poly(d, [(cx - 60, F - 10), (cx + 60, F - 10), (cx + 60, F - 34), (cx - 60, F - 34)], (170, 110, 60, 255))
    d.rectangle((cx - 60, F - 70, cx + 60, F - 48), fill=(170, 110, 60, 255), outline=LINE, width=W4)
    for x, y in front:
        d.rectangle((x - 8, y - up, x + 8, y), fill=(246, 241, 230, 255), outline=LINE, width=W4)
    eave = [(x, y - up) for x, y in floor]
    apex = (cx, F - up - 170)
    for i in range(8):
        p, q = eave[i], eave[(i + 1) % 8]
        if (p[1] + q[1]) / 2 >= F - up - 20 or i in (4, 5, 6):
            poly(d, [p, q, apex], (64, 140, 128, 255) if i % 2 else (86, 166, 150, 255))
    poly(d, [(x, y) for x, y in eave[0:4]] + [(x, y + 16) for x, y in reversed(eave[0:4])], (246, 241, 230, 255), 4)
    ell(d, apex[0], apex[1] - 6, 10, 10, (232, 182, 44, 255), 4)
    return im


def snowman():
    im, d, W, H, F = canvas('snowman')
    cx = W // 2
    snow = (246, 250, 255, 255)
    ell(d, cx, F - 52, 58, 50, snow)
    ell(d, cx, F - 140, 42, 38, snow)
    ell(d, cx, F - 206, 32, 30, snow)
    d.line((cx - 40, F - 150, cx - 76, F - 186), fill=(110, 72, 40, 255), width=6)
    d.line((cx + 40, F - 150, cx + 74, F - 180), fill=(110, 72, 40, 255), width=6)
    d.rectangle((cx - 40, F - 182, cx + 40, F - 168), fill=(206, 56, 56, 255), outline=LINE, width=4)
    d.rectangle((cx + 14, F - 172, cx + 28, F - 136), fill=(206, 56, 56, 255), outline=LINE, width=4)
    poly(d, [(cx, F - 206), (cx + 34, F - 200), (cx, F - 196)], (238, 132, 40, 255), 3)
    for ex in (-12, 12):
        d.ellipse((cx + ex - 4, F - 222, cx + ex + 4, F - 214), fill=LINE)
    for by in (-150, -128, -60, -36):
        d.ellipse((cx - 4, F + by - 4, cx + 4, F + by + 4), fill=LINE)
    return im


def anchor():
    im, d, W, H, F = canvas('anchor')
    iron = (74, 80, 92, 255)
    ell(d, W / 2, F - 4, 70, 20, (150, 118, 80, 255))  # Erdhügel
    top = (W / 2 + 16, 40)
    foot = (W / 2 - 8, F - 24)
    thick(d, [top, foot], iron, 14)
    thick(d, [(top[0] - 46, top[1] + 26), (top[0] + 42, top[1] + 20)], iron, 12)
    ell(d, top[0] + 2, top[1] - 16, 16, 16, (0, 0, 0, 0), 10)
    arc = [(foot[0] + 64 * math.cos(a), foot[1] - 30 + 34 * math.sin(a)) for a in [math.pi * (0.05 + 0.9 * i / 12) for i in range(13)]]
    thick(d, arc, iron, 12)
    for p in (arc[0], arc[-1]):
        poly(d, [(p[0] - 12, p[1] + 4), (p[0] + 12, p[1] + 4), (p[0], p[1] - 22)], iron, 4)
    rope = [(top[0] + 18 * math.sin(i * 0.9), top[1] + 30 + i * 9) for i in range(12)]
    d.line(rope, fill=(176, 136, 86, 255), width=8)
    return im


# Blumenbogen, Lampionpfosten, Pavillon, Schneemann und Anker hat Andre gezeichnet (tools/decor-sprites.py) – ihre
# Zeichnungen hier bleiben nur zum Nachsehen, sie werden nicht mehr erzeugt (sonst überschrieben sie Andres Bilder)
DRAW = {'park_lantern': park_lantern, 'stepping_stones': stepping_stones, 'hedge': hedge, 'golden_fountain': golden_fountain}


def small_versions(key):
    w, h, _ = SIZES[key]
    big = Image.open(os.path.join(A, 'hd', key + '.png')).convert('RGBA')
    big.resize((w * 2, h * 2), Image.LANCZOS).save(os.path.join(A, 'hd2', key + '.png'))
    big.resize((w, h), Image.LANCZOS).save(os.path.join(A, key + '.png'))


from_hd = '--from-hd' in sys.argv
os.makedirs(OUT_COPY, exist_ok=True)
for key, draw in DRAW.items():
    if not from_hd:
        draw().save(os.path.join(A, 'hd', key + '.png'))
        shutil.copy(os.path.join(A, 'hd', key + '.png'), os.path.join(OUT_COPY, key + '.png'))
    small_versions(key)
    w, h, f = SIZES[key]
    print(f'{key}: {w}x{h}, Fuß {f}/{h}')
