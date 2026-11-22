"""Hohes Tor (gate_tall_x / gate_tall_y, Raubtiergehege): Holzrahmen mit Milchglas, gezeichnet statt aus der KI-Vorlage
(die war in die alte Pixelform gezogen, der flache Riegel hatte dadurch Treppenstufen, das Glas war fleckig).
Pfosten, Fußpunkt und Bildgröße wie vorher (64 x 80, HD 256 x 320), damit es an tall_x / tall_y anschließt.
Aufruf: python tools/gate-tall.py   (schreibt public/assets, hd/ (4-fach), hd2/ (2-fach); wird von tools/hd-sprites.py
mit aufgerufen). Danach python tools/make-webp.py .
Gezeichnet in 4-facher HD-Größe, dann verkleinert: glatte Kanten."""
import os
from PIL import Image, ImageDraw, ImageFilter

W, H = 256, 320  # HD-Größe
S = 4            # Zeichenmaßstab
INK = (56, 40, 24, 255)
WOOD = (156, 96, 50)
SHADOW = (20, 40, 10, 70)
GLASS = (234, 241, 246, 238)
OW = 2.2          # Konturbreite (HD-Pixel)

# Geometrie (HD-Pixel), gemessen am bisherigen Bild: Mitte, Breite, Oberkante und Fuß der beiden Pfosten
GEOM = {
    'gate_tall_x': {'l': (71, 20, 35, 213), 'r': (190, 19, 99, 274)},   # links hinten, rechts vorne
    'gate_tall_y': {'l': (65, 19, 99, 272), 'r': (185, 20, 37, 213)},   # links vorne, rechts hinten
}
RAILS = [(16, 11), (92, 10), (166, 11)]  # Querriegel: Höhe über dem Boden (Mitte), Dicke


def light(c, k):
    return tuple(int(v + (255 - v) * k) for v in c[:3]) + (255,)


def dark(c, k):
    return tuple(int(v * k) for v in c[:3]) + (255,)


def sc(pts):
    return [(x * S, y * S) for x, y in pts]


def draw(g):
    (xl, wl, tl, bl), (xr, wr, tr, br) = g['l'], g['r']
    front_right = br > bl  # der tiefere Pfosten steht vorne

    def P(u, h):  # Punkt auf der Zaunebene: u = 0 linker, 1 rechter Pfosten; h = Höhe über dem Boden
        return xl + u * (xr - xl), bl + u * (br - bl) - h

    im = Image.new('RGBA', (W * S, H * S))
    # Schatten: schmaler weicher Streifen am Fuß
    sh = Image.new('L', im.size)
    ImageDraw.Draw(sh).line(sc([P(0, -3), P(1, -3)]), fill=255, width=7 * S)
    sh = sh.filter(ImageFilter.GaussianBlur(3 * S))
    im.paste(Image.new('RGBA', im.size, SHADOW), (0, 0), sh.point(lambda v: v * SHADOW[3] // 255))
    d = ImageDraw.Draw(im)

    u0, u1 = 0.04, 0.96  # Glas und Riegel reichen bis in die Pfosten hinein
    lo, hi = RAILS[0][0], RAILS[-1][0]
    # Milchglas: halbdurchsichtig, oben etwas heller, schräge Lichtstreifen
    glass = Image.new('RGBA', im.size)
    gd = ImageDraw.Draw(glass)
    pane = sc([P(u0, lo), P(u1, lo), P(u1, hi), P(u0, hi)])
    gd.polygon(pane, fill=GLASS)
    mask = Image.new('L', im.size)
    ImageDraw.Draw(mask).polygon(pane, fill=255)
    streaks = Image.new('RGBA', im.size)
    sd = ImageDraw.Draw(streaks)
    for u, h, w in [(0.18, 150, 9), (0.27, 150, 4), (0.62, 150, 8), (0.7, 150, 3)]:
        a, b = P(u, h), P(u + 0.22, h - 120)
        sd.line(sc([a, b]), fill=(255, 255, 255, 120), width=int(w * S))
    glass.alpha_composite(Image.composite(streaks, Image.new('RGBA', im.size), mask))
    im.alpha_composite(glass)
    d = ImageDraw.Draw(im)

    def bar(a, b, thick, col):
        """gerader Holzbalken von a nach b (Mitte), thick dick: Kontur, Holz, heller Streifen oben"""
        d.line(sc([a, b]), fill=INK, width=int((thick + 2 * OW) * S))
        d.line(sc([a, b]), fill=col + (255,), width=int(thick * S))
        off = thick * 0.22
        d.line(sc([(a[0], a[1] - off), (b[0], b[1] - off)]), fill=light(col, 0.22), width=int(thick * 0.35 * S))

    # Querriegel
    for h, t in RAILS:
        bar(P(0.02, h), P(0.98, h), t, WOOD)
    # Schrägstrebe im unteren Feld (gerade, vom unteren Riegel am Scharnier zum mittleren am Schloss)
    hinge_u = 0.0 if front_right else 1.0
    lock_u = 1.0 - hinge_u
    a, b = P(abs(hinge_u - 0.06), lo + 4), P(abs(lock_u - 0.06), RAILS[1][0] - 3)
    bar(a, b, 8, dark(WOOD, 0.92)[:3])
    # Riegel-Schloss: kleiner Metallbügel am mittleren Riegel nahe dem Schloss-Pfosten
    lx, ly = P(abs(lock_u - 0.1), RAILS[1][0])
    d.rounded_rectangle([(lx - 5) * S, (ly - 7) * S, (lx + 5) * S, (ly + 7) * S], radius=2 * S, fill=INK)
    d.rounded_rectangle([(lx - 3) * S, (ly - 5) * S, (lx + 3) * S, (ly + 5) * S], radius=1.5 * S, fill=(150, 156, 160, 255))
    d.line([(lx - 1.5) * S, (ly - 3) * S, (lx - 1.5) * S, (ly + 3) * S], fill=(200, 206, 210, 255), width=int(1.2 * S))

    def post(x, w, top, foot):
        """runder Holzpfosten: Kontur, Holz, helle linke und dunkle rechte Seite, ovale Schnittfläche oben"""
        cap = w * 0.28
        d.rounded_rectangle([(x - w / 2 - OW) * S, (top - OW) * S, (x + w / 2 + OW) * S, (foot + OW) * S], radius=int(w * 0.3 * S), fill=INK)
        d.rounded_rectangle([(x - w / 2) * S, top * S, (x + w / 2) * S, foot * S], radius=int(w * 0.25 * S), fill=WOOD + (255,))
        d.rectangle([(x + w * 0.18) * S, (top + cap) * S, (x + w / 2 - 1) * S, (foot - 3) * S], fill=dark(WOOD, 0.8))
        d.rectangle([(x - w / 2 + 2) * S, (top + cap) * S, (x - w * 0.18) * S, (foot - 3) * S], fill=light(WOOD, 0.18))
        # Maserung
        for k, y0 in enumerate(range(int(top + 22), int(foot - 18), 34)):
            xx = x - w * 0.05 + (k % 2) * 3
            d.line([xx * S, y0 * S, xx * S, (y0 + 14) * S], fill=dark(WOOD, 0.72), width=int(1.1 * S))
        # Hirnholz oben
        d.ellipse([(x - w / 2) * S, (top - cap) * S, (x + w / 2) * S, (top + cap) * S], fill=INK)
        d.ellipse([(x - w / 2 + OW) * S, (top - cap + OW) * S, (x + w / 2 - OW) * S, (top + cap - OW) * S], fill=light(WOOD, 0.32))
        d.ellipse([(x - w / 4) * S, (top - cap / 2.4) * S, (x + w / 4) * S, (top + cap / 2.4) * S], outline=dark(WOOD, 0.85), width=int(1.0 * S))

    posts = [g['l'], g['r']]
    posts.sort(key=lambda p: p[3])  # hinten zuerst
    for x, w, top, foot in posts:
        post(x, w, top, foot)
    return im


def main():
    for name, g in GEOM.items():
        big = draw(g)
        for sub, f in {'': 1, 'hd': 4, 'hd2': 2}.items():
            big.resize((W * f // 4, H * f // 4), Image.LANCZOS).save(os.path.join('public/assets', sub, name + '.png'), optimize=True)
        print(name, W // 4, 'x', H // 4)


if __name__ == '__main__':
    main()
