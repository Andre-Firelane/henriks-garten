"""Symbole der Boni (Kisten-Karten, Meldungen, Anzeige oben links): public/assets/bonus_<id>.png, SIZE × SIZE Pixel,
zusammengesetzt aus Bildern, die es im Spiel schon gibt (Tiere, Reittier, Kescher, Lasso, Hochstand, Jeep mit Anhänger), die Trommel aus
Expeditions-Sprites/Trommel.png; Herzen und Fernglas sind gezeichnet. Wie die Glücksbringer-Bilder (tools/charm-icons.py) – nur die Teile, ohne Hintergrund.
Aufruf: python tools/bonus-icons.py [Namen …]   (danach python tools/make-webp.py . für Handy und Tablet)"""
from PIL import Image, ImageDraw

SIZE = 128
A = 'public/assets'


def trimmed(path, frame=None):
    """Bild (bzw. Einzelbild frame = (Breite, Höhe, Nummer) eines Spritesheets) auf seinen sichtbaren Teil zugeschnitten;
    path in public/assets, mit / davor relativ zum Projekt (z. B. die gemalten Vorlagen in Expeditions-Sprites/)"""
    im = Image.open(path[1:] if path.startswith('/') else f'{A}/{path}').convert('RGBA')
    if frame:
        w, h, i = frame
        im = im.crop((w * i, 0, w * (i + 1), h))
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox())


def fit(im, box):
    """so groß wie möglich in box (Breite, Höhe), Seitenverhältnis bleibt"""
    k = min(box[0] / im.width, box[1] / im.height)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def canvas():
    return Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))


def place(c, im, cx, bottom):
    """unten mittig bei (cx, bottom) einsetzen"""
    c.alpha_composite(im, (round(cx - im.width / 2), round(bottom - im.height)))


def single(path, frame=None, pad=6):
    c = canvas()
    im = fit(trimmed(path, frame), (SIZE - 2 * pad, SIZE - 2 * pad))
    place(c, im, SIZE / 2, SIZE - (SIZE - im.height) / 2)
    return c


def more_animals():
    # kleine Herde: Giraffe hinten, Zebra und Antilope davor
    c = canvas()
    place(c, fit(trimmed('giraffe.png', (104, 168, 0)), (70, 92)), 44, 92)
    place(c, fit(trimmed('zebra.png', (80, 104, 0)), (62, 60)), 84, 112)
    place(c, fit(trimmed('antelope.png', (72, 100, 0)), (54, 56)), 40, 124)
    return c


def tools_everywhere():
    # Kescher und Lasso nebeneinander (Bonus der Erkundung)
    c = canvas()
    place(c, fit(trimmed('hd/net.png'), (70, 110)), 42, 120) # große Fassungen: Andres Werkzeug-Bilder
    place(c, fit(trimmed('hd/lasso.png'), (70, 80)), 88, 118)
    return c


def heart(d, cx, cy, r, fill):
    d.ellipse((cx - r, cy - r, cx, cy), fill=fill, outline='#7a1f3a', width=3)
    d.ellipse((cx, cy - r, cx + r, cy), fill=fill, outline='#7a1f3a', width=3)
    d.polygon([(cx - r + 1, cy - r / 2 + 3), (cx + r - 1, cy - r / 2 + 3), (cx, cy + r)], fill=fill, outline='#7a1f3a')
    # Rand unten nachziehen (das Dreieck überdeckt die Kreise)
    d.line([(cx - r + 1, cy - r / 2 + 4), (cx, cy + r)], fill='#7a1f3a', width=3)
    d.line([(cx + r - 1, cy - r / 2 + 4), (cx, cy + r)], fill='#7a1f3a', width=3)
    d.ellipse((cx - r / 2 - 4, cy - r + 6, cx - r / 2 + 6, cy - r + 14), fill=(255, 255, 255, 170))


def heart_rain():
    # drei Herzen, die herunterfallen
    big = Image.new('RGBA', (SIZE * 2, SIZE * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    heart(d, 74, 70, 36, '#ff7aa8')
    heart(d, 186, 104, 30, '#ff5a8c')
    heart(d, 120, 176, 44, '#ff4f7f')
    return big.resize((SIZE, SIZE), Image.LANCZOS)


def binoculars():
    """Fernglas: zwei Rohre mit Steg, große Linsen nach vorn (doppelt so groß gezeichnet, dann verkleinert)"""
    k = 2
    big = Image.new('RGBA', (SIZE * k, SIZE * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    line = '#2b1d14'
    for cx in (78, 178):
        d.rounded_rectangle([cx - 36, 70, cx + 36, 196], radius=22, fill='#4a3a30', outline=line, width=6)
        d.rounded_rectangle([cx - 30, 70, cx + 30, 104], radius=14, fill='#6b5a4c', outline=line, width=5)
        d.ellipse([cx - 40, 160, cx + 40, 236], fill='#3a2c24', outline=line, width=6)
        d.ellipse([cx - 28, 172, cx + 28, 224], fill='#7cc4e8', outline=line, width=4)
        d.ellipse([cx - 16, 180, cx - 2, 194], fill=(255, 255, 255, 210))
    d.rounded_rectangle([110, 108, 146, 150], radius=8, fill='#8a6a4c', outline=line, width=5)
    d.ellipse([116, 84, 140, 108], fill='#b48a5c', outline=line, width=4)
    return big.resize((SIZE, SIZE), Image.LANCZOS)


ICONS = {
    'moreAnimals': more_animals,
    'ride': lambda: single('ride_meadow.png', (160, 230, 0)),
    'toolsEverywhere': tools_everywhere, # nur Erkundung
    'stands': lambda: single('forest_stand.png'), # nur Erkundung
    'binoculars': binoculars, # inzwischen Andres Bild (Sprites/Andre, tools/replace-sprites.py): nicht neu erzeugen
    'bigWagon': lambda: single('car_zoo.png', (240, 140, 0)),
    'bigCatch': lambda: single('hd/lasso.png'),
    'heartRain': heart_rain, # ebenso
    'eventCall': lambda: single('/Expeditions-Sprites/Trommel.png'), # gemalte Trommel
}

# optional: nur diese Symbole neu machen, z. B. python tools/bonus-icons.py bigCatch toolsEverywhere
import sys
for name, make in ICONS.items():
    if sys.argv[1:] and name not in sys.argv[1:]:
        continue
    make().save(f'{A}/bonus_{name}.png')
    print('bonus_' + name)
