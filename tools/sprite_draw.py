"""Zeichnen von Platzhalter-Bildern (für tools/meadow-placeholders.py und tools/forest-placeholders.py): Formen mit
dunkler Kontur und weichem Schatten in 8-facher Größe, gespeichert in allen Auflösungen: public/assets (alte Größe),
hd/ (4-fach), hd2/ (2-fach); dazu eine Kopie in EXPORT (4-fach, Vorlage zum Nachmalen).
SKIP: Bilder, für die es schon echte gibt – die landen nur noch in EXPORT. ONLY=name (Umgebung): nur dieses Bild."""
import os
from PIL import Image, ImageDraw, ImageFilter

A = 'public/assets'
S = 8  # gezeichnet in 8-facher Größe, dann verkleinert (glatte Kanten)
SHADOW = (20, 40, 10, 70)
OUT = {'': 1, 'hd': 4, 'hd2': 2}
EXPORT = None  # Ordner für die Vorlagen (setzt das aufrufende Skript)
SKIP = set()


def dark(c, k=0.55):
    return tuple(int(v * k) for v in c[:3]) + tuple(c[3:])


def light(c, k=0.35):
    return tuple(int(v + (255 - v) * k) for v in c[:3]) + tuple(c[3:])


def wanted(name):
    return os.environ.get('ONLY') in (None, name)


def save_all(im, name, w, h, outs=OUT):
    """fertiges Bild (8-fach oder größer) in alle Auflösungen schreiben"""
    if not wanted(name):
        return
    for sub, f in outs.items():
        small = im.resize((w * f, h * f), Image.LANCZOS)
        if name not in SKIP:
            os.makedirs(os.path.join(A, sub), exist_ok=True)
            small.save(os.path.join(A, sub, name + '.png'), optimize=True)
        if sub == 'hd' and EXPORT:
            os.makedirs(EXPORT, exist_ok=True)
            small.save(os.path.join(EXPORT, name + '.png'), optimize=True)
    print(name, w, 'x', h)


class Pic:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w * S, h * S))
        self.d = ImageDraw.Draw(self.im)

    def pts(self, pts):
        return [(x * S, y * S) for x, y in pts]

    def ell(self, cx, cy, rx, ry, fill, ol=True, ow=1):
        box = [(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S]
        if ol:
            o = ow * S
            self.d.ellipse([box[0] - o, box[1] - o, box[2] + o, box[3] + o], fill=dark(fill) if ol is True else ol)
        self.d.ellipse(box, fill=fill)

    def poly(self, pts, fill, ol=True, ow=1):
        if ol:
            self.d.line(self.pts(pts + pts[:1]), fill=dark(fill) if ol is True else ol, width=int(ow * 2 * S), joint='curve')
        self.d.polygon(self.pts(pts), fill=fill)

    def line(self, pts, col, w=1, ol=True):
        if ol:
            self.d.line(self.pts(pts), fill=dark(col) if ol is True else ol, width=int((w + 1.6) * S), joint='curve')
            for x, y in (pts[0], pts[-1]):
                r = (w + 1.6) / 2
                self.d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=dark(col) if ol is True else ol)
        self.d.line(self.pts(pts), fill=col, width=int(w * S), joint='curve')

    def rect(self, x0, y0, x1, y1, fill, ol=True):
        self.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], fill, ol)

    def shadow(self, cx, cy, rx, ry):
        """weicher Schatten am Fuß (unter allem, was schon gezeichnet ist)"""
        sh = Image.new('L', self.im.size)
        ImageDraw.Draw(sh).ellipse([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S], fill=255)
        sh = sh.filter(ImageFilter.GaussianBlur(S * 1.5)).point(lambda v: v * SHADOW[3] // 255)
        under = Image.new('RGBA', self.im.size, SHADOW[:3] + (0,))
        under.putalpha(sh)
        under.alpha_composite(self.im)
        self.im = under
        self.d = ImageDraw.Draw(self.im)

    def save(self, name):
        save_all(self.im, name, self.w, self.h)
