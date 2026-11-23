"""Aufruf: python tools/bamboo-placeholders.py          Platzhalter zeichnen (große Fassung) und alle Größen erzeugen
        python tools/bamboo-placeholders.py --from-hd  nur die kleinen Fassungen aus public/assets/hd/ neu erzeugen
                                                       (z. B. nachdem Andre die Bilder in hd/ überarbeitet hat)
Platzhalter für den neuen Bambuswald (docs/plan-bambuswald.md): Glaswand des Glaspavillons auf der Affeninsel (aus dem
Glastor), Teehaus (3×3 Kacheln), Stehtisch, Teetasse (in der Hand der Besucher) und geharkter Kies des Zen-Gartens.
Gezeichnet in der großen Fassung (4× so groß wie im Spiel, wie public/assets/hd/), daraus hd2/ (2×) und die Spielgröße.
Kopien zum Überarbeiten: Claude-Sprites/Dschungel und Bambuswald (Eckpfosten: Claude-Sprites/Zaunpfosten). Größe und Fußpunkt müssen beim Überarbeiten gleich bleiben.
Danach: python tools/make-webp.py ."""
import math
import os
import shutil
import sys
from PIL import Image, ImageDraw

A = 'public/assets'
OUT_COPY = 'Claude-Sprites/Dschungel und Bambuswald'
LINE = (60, 36, 18, 255)
W4 = 6  # Linienbreite in der großen Fassung

# key: (Breite, Höhe in Spielgröße, Fuß y in Spielgröße)
SIZES = {
    'teahouse': (208, 216, 164),
    'tea_table': (40, 48, 42),
    'zen_gravel': (64, 32, 16),
}
# Teetasse: Gegenstand in doppelter Auflösung (wie das Eis), nur eine Fassung
CUP = (24, 24)


def canvas(key):
    w, h, _ = SIZES[key]
    im = Image.new('RGBA', (w * 4, h * 4), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im), w * 4, h * 4, SIZES[key][2] * 4


def poly(d, pts, fill, width=W4):
    d.polygon([tuple(map(round, p)) for p in pts], fill=fill, outline=LINE, width=width)


def ell(d, cx, cy, rx, ry, fill, width=W4):
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=fill, outline=LINE, width=width)


def glow(im, cx, cy, r, color):
    g = Image.new('RGBA', im.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    for i in range(8, 0, -1):
        rr = r * i / 8
        gd.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=color[:3] + (int(color[3] * (1 - i / 9)),))
    im.alpha_composite(g)


def teahouse():
    """Teehaus auf 3×3 Kacheln: Holzveranda, rote Wände mit Papierfenstern, dunkles geschwungenes Dach, zwei Lampions.
    Fußpunkt: Mitte der Grundfläche."""
    im, d, W, H, F = canvas('teahouse')
    cx = W / 2
    # Grundfläche: halbe Breite 96, halbe Höhe 48 (Spielgröße) bei 3 Kacheln
    def dia(k, lift=0):
        hw, hh = 96 * 4 * k, 48 * 4 * k
        y = F - lift
        return [(cx, y - hh), (cx + hw, y), (cx, y + hh), (cx - hw, y)]
    # Veranda (Holz), etwas erhöht
    top = dia(0.92, 24)
    base = dia(0.92, 0)
    poly(d, [base[3], base[2], top[2], top[3]], (122, 80, 44, 255))
    poly(d, [base[2], base[1], top[1], top[2]], (100, 64, 34, 255))
    poly(d, top, (176, 124, 70, 255))
    for i in range(1, 8):  # Dielen
        s = i / 8
        a = (top[3][0] + (top[0][0] - top[3][0]) * s, top[3][1] + (top[0][1] - top[3][1]) * s)
        b = (top[2][0] + (top[1][0] - top[2][0]) * s, top[2][1] + (top[1][1] - top[2][1]) * s)
        d.line((a, b), fill=(140, 96, 52, 255), width=3)
    # Wände (nur die beiden vorderen sind zu sehen)
    wall_h = 44 * 4
    wb = dia(0.6, 24)
    wt = [(x, y - wall_h) for x, y in wb]
    red, red2 = (184, 58, 44, 255), (150, 44, 34, 255)
    poly(d, [wb[3], wb[2], wt[2], wt[3]], red)
    poly(d, [wb[2], wb[1], wt[1], wt[2]], red2)
    # Papierfenster (Shoji) und die Tür mit Vorhang
    def on_face(p, q, s, t, h0, h1):
        """Viereck auf einer Wand zwischen p und q (unten), von s bis t entlang, h0 bis h1 hoch."""
        a = (p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s)
        b = (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
        return [(a[0], a[1] - h0), (b[0], b[1] - h0), (b[0], b[1] - h1), (a[0], a[1] - h1)]
    paper = (246, 236, 208, 255)
    for s, t in [(0.1, 0.36), (0.64, 0.9)]:
        q = on_face(wb[3], wb[2], s, t, 40, 136)
        poly(d, q, paper, 5)
        for k in (1 / 3, 2 / 3):
            d.line(((q[0][0] + (q[1][0] - q[0][0]) * k, q[0][1] + (q[1][1] - q[0][1]) * k), (q[3][0] + (q[2][0] - q[3][0]) * k, q[3][1] + (q[2][1] - q[3][1]) * k)), fill=(150, 110, 70, 255), width=3)
        mid = ((q[0][0] + q[3][0]) / 2, (q[0][1] + q[3][1]) / 2)
        mid2 = ((q[1][0] + q[2][0]) / 2, (q[1][1] + q[2][1]) / 2)
        d.line((mid, mid2), fill=(150, 110, 70, 255), width=3)
    # Tür auf der rechten Wand: dunkler Eingang mit Stoffvorhang (Noren)
    door = on_face(wb[2], wb[1], 0.36, 0.64, 0, 150)
    poly(d, door, (58, 40, 32, 255), 5)
    noren = on_face(wb[2], wb[1], 0.38, 0.62, 80, 146)
    poly(d, noren, (46, 92, 140, 255), 4)
    for k in (1 / 3, 2 / 3):
        a = (noren[0][0] + (noren[1][0] - noren[0][0]) * k, noren[0][1] + (noren[1][1] - noren[0][1]) * k)
        d.line((a, (a[0], a[1] - 60)), fill=(30, 60, 96, 255), width=4)
    # Eckpfosten
    for p in (wb[3], wb[2], wb[1]):
        d.rectangle((p[0] - 8, p[1] - wall_h, p[0] + 8, p[1]), fill=(92, 52, 32, 255), outline=LINE, width=4)
    # Dach: Walmdach mit hochgezogenen Ecken
    rb = dia(0.98, 24 + wall_h - 8)
    peak = (cx, rb[0][1] - 4 + (rb[2][1] - rb[0][1]) / 2 - 150)
    slate, slate2, slate3 = (74, 82, 98, 255), (58, 64, 78, 255), (92, 100, 116, 255)
    # Traufe etwas hochgebogen: die Ecken links, rechts und vorne liegen höher
    left, front, right = (rb[3][0] - 10, rb[3][1] - 22), (rb[2][0], rb[2][1] - 6), (rb[1][0] + 10, rb[1][1] - 22)
    back = (rb[0][0], rb[0][1] - 10)
    poly(d, [left, front, peak], slate)
    poly(d, [front, right, peak], slate2)
    poly(d, [left, back, peak], slate3, 4)
    poly(d, [back, right, peak], slate3, 4)
    poly(d, [left, front, peak], slate)
    poly(d, [front, right, peak], slate2)
    # Ziegelreihen
    for i in range(1, 6):
        s = i / 6
        for a, b in ((left, front), (front, right)):
            p = (a[0] + (peak[0] - a[0]) * s, a[1] + (peak[1] - a[1]) * s)
            q = (b[0] + (peak[0] - b[0]) * s, b[1] + (peak[1] - b[1]) * s)
            d.line((p, q), fill=(44, 50, 62, 255), width=3)
    d.line((front, peak), fill=(40, 44, 54, 255), width=8)
    # goldene Spitze und Lampions an den vorderen Ecken
    ell(d, peak[0], peak[1] - 6, 10, 10, (232, 182, 44, 255), 4)
    for p in (left, right):
        x, y = p[0] + (14 if p is left else -14), p[1] + 54
        d.line(((x, p[1] + 6), (x, y - 20)), fill=LINE, width=3)
        glow(im, x, y, 40, (255, 160, 80, 110))
        ell(d, x, y, 15, 19, (220, 56, 44, 255), 4)
        d.line(((x - 13, y), (x + 13, y)), fill=(150, 30, 24, 255), width=3)
    return im


def tea_table():
    """Stehtisch: runde Holzplatte auf einem Bein, darauf eine Teekanne und zwei Becher."""
    im, d, W, H, F = canvas('tea_table')
    cx = W / 2
    ell(d, cx, F - 2, 40, 14, (0, 0, 0, 60), 0)
    poly(d, [(cx - 22, F), (cx + 22, F), (cx + 14, F - 14), (cx - 14, F - 14)], (92, 58, 34, 255), 4)
    d.rectangle((cx - 8, 66, cx + 8, F - 12), fill=(122, 80, 44, 255), outline=LINE, width=4)
    ell(d, cx, 66, 62, 24, (150, 100, 56, 255))
    ell(d, cx, 60, 62, 24, (186, 132, 78, 255))
    # Teekanne
    ell(d, cx - 12, 48, 18, 14, (88, 130, 96, 255), 4)
    d.line(((cx + 4, 46), (cx + 16, 38)), fill=LINE, width=6)
    ell(d, cx - 12, 34, 6, 4, (88, 130, 96, 255), 3)
    # Becher
    for x, y in ((cx + 24, 58), (cx - 34, 66)):
        d.rectangle((x - 7, y - 12, x + 7, y), fill=(240, 232, 214, 255), outline=LINE, width=3)
        ell(d, x, y - 12, 7, 3, (120, 160, 80, 255), 2)
    return im


def tea_cup():
    """Teetasse in der Hand (doppelte Auflösung wie das Eis): grüner Becher mit Dampf."""
    w, h = CUP
    im = Image.new('RGBA', (w * 8, h * 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = w * 4
    for i, x in enumerate((cx - 20, cx + 14)):
        pts = [(x + math.sin(t / 3 + i) * 8, 70 - t * 6) for t in range(10)]
        d.line(pts, fill=(255, 255, 255, 150), width=7, joint='curve')
    poly(d, [(cx - 44, 96), (cx + 44, 96), (cx + 34, 176), (cx - 34, 176)], (120, 170, 96, 255), 8)
    ell(d, cx, 96, 44, 12, (196, 220, 150, 255), 8)
    d.line(((cx - 40, 130), (cx + 38, 130)), fill=(90, 136, 72, 255), width=6)
    return im


def zen_gravel():
    """Geharkter Kies (Bodenkachel): helle Steinchen mit Rillen entlang einer Kachelrichtung, die an den Rändern in die
    Nachbarkachel weiterlaufen."""
    im, d, W, H, F = canvas('zen_gravel')
    cx, cy = W / 2, H / 2
    poly(d, [(cx, 0), (W, cy), (cx, H), (0, cy)], (214, 208, 192, 255), 0)
    # Kachelachsen: u entlang tx (nach rechts unten), v entlang ty (nach links unten), je -0.5 … 0.5
    def pt(u, v):
        return (cx + (u - v) * W / 2, cy + (u + v) * H / 2)
    n = 6
    for k in range(n):
        v = -0.5 + (k + 0.5) / n
        d.line((pt(-0.5, v), pt(0.5, v)), fill=(176, 168, 150, 255), width=10)
        d.line((pt(-0.5, v + 0.035), pt(0.5, v + 0.035)), fill=(236, 232, 220, 255), width=4)
    # ein paar dunkle Steinchen
    import random
    rnd = random.Random(7)
    for _ in range(40):
        u, v = rnd.uniform(-0.48, 0.48), rnd.uniform(-0.48, 0.48)
        x, y = pt(u, v)
        d.ellipse((x - 3, y - 2, x + 3, y + 2), fill=(150, 144, 130, 255))
    # außerhalb der Raute nichts
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).polygon([(cx, 0), (W, cy), (cx, H), (0, cy)], fill=255)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def glass_pieces():
    """Glaswand (glass_x, glass_y) = das Glastor in allen drei Größen; Eckpfosten (nur Spielgröße) wie das Holz der Rahmen."""
    for key in ('x', 'y'):
        for sub in ('', 'hd/', 'hd2/'):
            shutil.copyfile(f'{A}/{sub}gate_glass_{key}.png', f'{A}/{sub}glass_{key}.png')
    im = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((29, 8, 34, 58), fill=(196, 110, 52, 255), outline=(70, 36, 16, 255), width=1)
    d.line((31, 10, 31, 56), fill=(226, 150, 86, 255), width=1)
    im.save(f'{A}/post_glass.png')


def save_sizes(key, big):
    big.save(f'{A}/hd/{key}.png')
    w, h = big.size
    big.resize((w // 2, h // 2), Image.LANCZOS).save(f'{A}/hd2/{key}.png')
    big.resize((w // 4, h // 4), Image.LANCZOS).save(f'{A}/{key}.png')
    os.makedirs(OUT_COPY, exist_ok=True)
    big.save(f'{OUT_COPY}/{key}.png')


if __name__ == '__main__':
    if '--from-hd' in sys.argv:
        for key in ('zen_gravel',):
            save_sizes(key, Image.open(f'{A}/hd/{key}.png').convert('RGBA'))
    else:
        for key, fn in (('zen_gravel', zen_gravel),):  # Teehaus und Stehtisch: Andres Bilder (tools/teahouse-sprites.py)
            save_sizes(key, fn())
        cup = tea_cup()
        cup.resize(CUP, Image.LANCZOS).save(f'{A}/tea_cup.png')
        os.makedirs(OUT_COPY, exist_ok=True)
        cup.save(f'{OUT_COPY}/tea_cup.png')
        glass_pieces()
    print('fertig')
