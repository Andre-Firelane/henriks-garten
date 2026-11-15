"""Zoo-Mobil (Fahrzeug im Tierpark) aus Andres Bildern auf Grün ausschneiden.

Quelle: Sprites/Zoo Mobil.webp (leer) und Sprites/Zoo Mobil besetzt.webp (mit Henrik), je zwei Ansichten
nebeneinander: links von vorne (Nase nach unten links), rechts von hinten (Nase nach oben rechts).
Ergebnis: Bildstreifen mit 4 Bildern wie bei der Spielfigur (unten rechts, unten links, oben rechts, oben links;
die fehlenden Richtungen gespiegelt), je FRAME_W × FRAME_H, Fußpunkt unten in der Mitte (FOOT px über dem Rand):
  public/assets/kart.png        mit Henrik (beim Fahren)
  public/assets/kart_empty.png  leer (geparkt)
  public/assets/kart_icon.png   ein Bild davon (Symbol in der Werkzeugleiste)
dazu Kopien in Fahrzeug-Sprites/.
Aufruf: python tools/kart-cut.py  (danach python tools/make-webp.py .)
"""
import os
import sys
from PIL import Image

SRC = 'Sprites'
FRAME_W, FRAME_H = 220, 200
FOOT = 10  # so viele Pixel unter dem Fußpunkt (Unterkante der Räder) bleiben im Bild
FIT = 0.92  # so viel der Bildbreite füllt das Fahrzeug


def cut_green(im):
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            lead = g - max(r, b)
            if lead > 90:
                px[x, y] = (0, 0, 0, 0)  # Grün: weg
            elif lead > 25:
                # Rand: halb durchsichtig und ohne grünen Schimmer
                alpha = int(255 * (90 - lead) / 65)
                px[x, y] = (r, max(r, b), b, alpha)
            elif lead > 0:
                px[x, y] = (r, max(r, b), b, a)  # leichter Grünstich an Kanten
    return im


def views(path):
    im = cut_green(Image.open(path))
    w, h = im.size
    # Trennlinie: die leerste Spalte im mittleren Drittel (zwischen den beiden Wagen)
    alpha = im.getchannel('A').load()
    filled = [sum(1 for y in range(h) if alpha[x, y] > 40) for x in range(w)]
    cut = min(range(w // 3, 2 * w // 3), key=lambda x: (filled[x], abs(x - w // 2)))
    out = []
    for x0, x1 in ((0, cut), (cut, w)):
        part = im.crop((x0, 0, x1, h))
        out.append(part.crop(part.getbbox()))
    return out  # [von vorne (unten links), von hinten (oben rechts)]


def frames(front, back, scale):
    sheet = Image.new('RGBA', (FRAME_W * 4, FRAME_H), (0, 0, 0, 0))
    flip = Image.Transpose.FLIP_LEFT_RIGHT
    # Reihenfolge wie FRAME in Player.js: downRight 0, downLeft 1, upRight 2, upLeft 3
    for i, img in enumerate([front.transpose(flip), front, back, back.transpose(flip)]):
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        x = i * FRAME_W + (FRAME_W - img.width) // 2
        y = FRAME_H - FOOT - img.height
        sheet.alpha_composite(img, (x, max(0, y)))
    return sheet


def main():
    empty = views(os.path.join(SRC, 'Zoo Mobil.webp'))
    full = views(os.path.join(SRC, 'Zoo Mobil besetzt.webp'))
    widest = max(v.width for v in empty + full)
    tallest = max(v.height for v in empty + full)
    scale = min(FRAME_W * FIT / widest, (FRAME_H - FOOT) / tallest)  # alle gleich groß
    os.makedirs('Fahrzeug-Sprites', exist_ok=True)
    # jede Ansicht einzeln in voller Größe (zum Überarbeiten): Fahrzeug-Sprites/einzeln/
    os.makedirs('Fahrzeug-Sprites/einzeln', exist_ok=True)
    flip = Image.Transpose.FLIP_LEFT_RIGHT
    for name, (front, back) in (('kart', full), ('kart_leer', empty)):
        for view, img in (('1_unten_rechts', front.transpose(flip)), ('2_unten_links', front), ('3_oben_rechts', back), ('4_oben_links', back.transpose(flip))):
            img.save(f'Fahrzeug-Sprites/einzeln/{name}_{view}.png')
    for name, (front, back) in (('kart', full), ('kart_empty', empty)):
        sheet = frames(front, back, scale)
        sheet.save(f'public/assets/{name}.png')
        sheet.save(f'Fahrzeug-Sprites/{name}.png')
        if name == 'kart_empty':
            sheet.crop((FRAME_W, 0, FRAME_W * 2, FRAME_H)).save('public/assets/kart_icon.png')  # Symbol (Werkzeugleiste)
    print('Zoo-Mobil ausgeschnitten, Maßstab', round(scale, 3), file=sys.stderr)


if __name__ == '__main__':
    main()
