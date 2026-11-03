# Werkzeug-Regale vor den Hütten (hut_shelf_<Stil>): offener Schrank, freigestellt mit npm run cutout. Das Holzregal steht
# in allen Welten, in der Eiswelt das Metallregal. Das Bild wird gespiegelt (die offene Seite zeigt nach links unten, vom
# Haus weg) und so groß wie das frühere Brett-Regal (512 x 384 in hd/): gleich breit, unten an derselben Stelle (dessen
# sichtbarer Teil reichte von x 257 bis 465, unten bis 336), dann ein Stück nach hinten gerückt, bis es an der Wand steht.
# Ausgabe in public/assets (128 x 96), hd/ und hd2/.
# Aufruf: python tools/shelves.py
from PIL import Image

SW, SH = 512, 384
LEFT, RIGHT, BOTTOM = 257, 465, 336
WALL = 0.35  # so viele Kacheln weiter nach hinten (eine Kachel: 128 x 64 in hd/)
SHELVES = {
    'Sprites/Regal Holz.png': ['meadow', 'forest', 'savanna', 'asia', 'jungle'],
    'Sprites/Regal Eis.png': ['ice'],
}


def shelf(src, size):
    im = Image.open(src).convert('RGBA').transpose(Image.FLIP_LEFT_RIGHT)
    im = im.crop(im.getbbox())
    f = (RIGHT - LEFT) / im.width
    im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    out = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    out.alpha_composite(im, (round(LEFT + WALL * 128), round(BOTTOM - im.height - WALL * 64)))
    return out.resize(size, Image.LANCZOS)


for src, styles in SHELVES.items():
    for d, size in (('public/assets', (128, 96)), ('public/assets/hd', (512, 384)), ('public/assets/hd2', (256, 192))):
        img = shelf(src, size)
        for style in styles:
            img.save(f'{d}/hut_shelf_{style}.png')
    print(src, styles)
