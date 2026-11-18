"""Futterstrauch (Dschungel) und Blätterzweig, gezeichnet: dunkelgrüner Busch, aus dem helle Zweige mit frischen
Blättern ragen (die bricht Henrik ab, um Tapir und Okapi zu füttern, siehe src/world/LeafBushes.js).
  leaf_bush.png       voller Strauch (64 x 72, HD 256 x 288)
  leaf_bush_bare.png  abgeerntet: nur noch abgebrochene Stummel, wächst nach
  leaf_branch.png     der Zweig in der Hand (64 x 64, wie das Grünfutter)
Aufruf: python tools/leaf-bush.py   (danach python tools/make-webp.py .)
Gezeichnet in 4-facher Größe (= HD-Bild), das kleine Bild ist davon verkleinert."""
import math
import random
from PIL import Image, ImageDraw, ImageFilter

F = 4
OUTLINE = (30, 42, 24, 255)
# gedämpft wie die anderen Dschungelpflanzen (Sättigung um 0,4, siehe jungle_plant, hibiscus); die frischen Zweige nur
# etwas heller und gelblicher, damit man sie erkennt, ohne dass sie herausstechen
BUSH = [(52, 70, 40), (64, 86, 50), (78, 102, 60), (96, 120, 72)]  # dunkel ... hell
LEAF = [(86, 116, 60), (108, 140, 74), (136, 164, 96)]  # frische Blätter
STEM = (112, 72, 40)
STEM_DARK = (70, 44, 24)


def leaf(d, cx, cy, ang, length, width, col, light):
    """spitzes Blatt: Umriss, Fläche, Mittelrippe; ang in Grad (0 = nach rechts)"""
    a = math.radians(ang)
    ux, uy = math.cos(a), math.sin(a)
    px, py = -uy, ux
    pts = []
    for i in range(13):
        t = i / 12
        w = math.sin(math.pi * t) ** 0.8 * width
        pts.append((cx + ux * length * t + px * w, cy + uy * length * t + py * w))
    for i in range(12, -1, -1):
        t = i / 12
        w = math.sin(math.pi * t) ** 0.8 * width
        pts.append((cx + ux * length * t - px * w, cy + uy * length * t - py * w))
    d.polygon(pts, fill=OUTLINE)
    inner = [(cx + (x - cx) * 0.86 + ux * length * 0.07, cy + (y - cy) * 0.86 + uy * length * 0.07) for x, y in pts]
    d.polygon(inner, fill=col + (255,))
    # helle Hälfte oben
    half = inner[: len(inner) // 2]
    d.polygon([(cx + ux * length * 0.07, cy + uy * length * 0.07)] + half, fill=light + (255,)) if py < 0 else None
    d.line([(cx + ux * length * 0.1, cy + uy * length * 0.1), (cx + ux * length * 0.8, cy + uy * length * 0.8)], fill=OUTLINE[:3] + (200,), width=F)


def twig(d, x0, y0, ang, length, n_leaves, rnd, stub=False):
    """Zweig mit Blättern (oder nur ein abgebrochener Stummel)"""
    a = math.radians(ang)
    L = length * (0.28 if stub else 1)
    x1, y1 = x0 + math.cos(a) * L, y0 + math.sin(a) * L
    d.line([(x0, y0), (x1, y1)], fill=OUTLINE, width=int(5 * F))
    d.line([(x0, y0), (x1, y1)], fill=STEM + (255,), width=int(3 * F))
    if stub:
        # Bruchstelle: heller Splitter oben
        d.ellipse([x1 - 2.2 * F, y1 - 2.2 * F, x1 + 2.2 * F, y1 + 2.2 * F], fill=OUTLINE)
        d.ellipse([x1 - 1.3 * F, y1 - 1.3 * F, x1 + 1.3 * F, y1 + 1.3 * F], fill=(214, 178, 120, 255))
        return
    for i in range(n_leaves):
        t = 0.35 + 0.65 * i / max(1, n_leaves - 1)
        lx, ly = x0 + math.cos(a) * L * t, y0 + math.sin(a) * L * t
        side = 1 if i % 2 else -1
        la = ang + side * rnd.uniform(40, 62)
        if i == n_leaves - 1:
            la = ang + rnd.uniform(-10, 10)
        col = LEAF[rnd.randrange(2)]
        leaf(d, lx, ly, la, rnd.uniform(9, 11.5) * F, rnd.uniform(3.2, 3.9) * F, col, LEAF[2])


def bush_body(d, cx, cy, rnd, sparse=False):
    """runder Busch aus vielen Blattbüscheln, oben heller"""
    blobs = []
    for _ in range(34):
        ang = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(0, 1) ** 0.6
        x = cx + math.cos(ang) * r * 19 * F
        y = cy + math.sin(ang) * r * 12 * F - 3 * F
        s = rnd.uniform(7, 10) * F
        blobs.append((y, x, s))
    blobs.sort()
    for y, x, s in blobs:
        d.ellipse([x - s - F, y - s - F, x + s + F, y + s + F], fill=OUTLINE)
    for y, x, s in blobs:
        shade = 0 if y > cy + 4 * F else 1 if y > cy - 2 * F else 2
        if sparse: shade = max(0, shade - 1)
        d.ellipse([x - s, y - s, x + s, y + s], fill=BUSH[shade] + (255,))
        d.ellipse([x - s * 0.55 - s * 0.25, y - s * 0.55 - s * 0.3, x + s * 0.55 - s * 0.25, y + s * 0.55 - s * 0.3], fill=BUSH[shade + 1] + (255,))


def make_bush(bare):
    W, H = 64 * F, 72 * F
    im = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(im)
    rnd = random.Random(7)
    cx, cy = W / 2, 50 * F
    # Bodenschatten
    sh = Image.new('RGBA', (W, H))
    ImageDraw.Draw(sh).ellipse([cx - 24 * F, cy + 6 * F, cx + 24 * F, cy + 16 * F], fill=(20, 40, 10, 80))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(2 * F)))
    # Zweige hinten (ragen oben heraus), dann der Busch, dann ein Zweig vorne
    twigs = [(-12, -8, -116, 22, 4), (1, -12, -88, 26, 5), (13, -6, -62, 21, 4)]
    for dx, dy, ang, length, n in twigs:
        twig(d, cx + dx * F, cy + dy * F, ang, length * F, n, rnd, stub=bare)
    bush_body(d, cx, cy, rnd, sparse=bare)
    if not bare:
        twig(d, cx - 6 * F, cy - 2 * F, -160, 13 * F, 3, rnd)
        # ein paar helle Blätter auf dem Busch: er sieht frisch aus
        for _ in range(6):
            leaf(d, cx + rnd.uniform(-16, 14) * F, cy + rnd.uniform(-12, 2) * F, rnd.uniform(-160, -20), 9 * F, 3 * F, LEAF[1], LEAF[2])
    else:
        twig(d, cx - 4 * F, cy - 2 * F, -150, 22 * F, 0, rnd, stub=True)
    return im


def make_branch():
    W = 64 * F
    im = Image.new('RGBA', (W, W))
    d = ImageDraw.Draw(im)
    rnd = random.Random(3)
    twig(d, 10 * F, 54 * F, -42, 46 * F, 7, rnd)
    return im


def save(im, name, w, h):
    im.save(f'public/assets/hd/{name}.png')
    small = im.resize((w, h), Image.LANCZOS)
    a = small.getchannel('A').point(lambda v: 0 if v < 40 else min(255, round(v * 1.15)))
    small.putalpha(a)
    small.save(f'public/assets/{name}.png')
    im.resize((w * 2, h * 2), Image.LANCZOS).save(f'public/assets/hd2/{name}.png')
    print(name, small.size)


save(make_bush(False), 'leaf_bush', 64, 72)
save(make_bush(True), 'leaf_bush_bare', 64, 72)
save(make_branch(), 'leaf_branch', 64, 64)
