"""Aufruf: python tools/expedition-charms.py   (danach python tools/make-webp.py .)
Platzhalter-Bilder der Expeditions-Glücksbringer (bis es gemalte gibt): public/assets/charm_<id>.png, 128 Pixel hoch wie
die anderen Glücksbringer (tools/charm-icons.py); dazu eine Kopie in Expeditions-Sprites/ zum Neuzeichnen.
- bigCage: Gitterkäfig mit Holzrahmen
- bait: Futterschale mit Obst
- teddy: Stoffteddy"""
import shutil
from PIL import Image, ImageDraw

A = 'public/assets'
EXPORT = 'Expeditions-Sprites'
SIZE = 128
K = 2  # doppelt so groß zeichnen, dann verkleinern (weiche Kanten)
LINE = '#3a2414'


def canvas():
    return Image.new('RGBA', (SIZE * K, SIZE * K), (0, 0, 0, 0))


def done(im, name):
    im = im.resize((SIZE, SIZE), Image.LANCZOS)
    im.save(f'{A}/charm_{name}.png')
    shutil.copy(f'{A}/charm_{name}.png', f'{EXPORT}/charm_{name}.png')
    print('charm_' + name)


def big_cage():
    c = canvas()
    d = ImageDraw.Draw(c)
    x0, y0, x1, y1 = 34, 52, 222, 226
    d.rounded_rectangle([x0, y0, x1, y1], radius=10, fill=(248, 230, 192, 255), outline=LINE, width=7)
    for i in range(1, 7):
        x = x0 + i * (x1 - x0) / 7
        d.line([(x, y0 + 14), (x, y1 - 14)], fill='#7a7a7a', width=6)
    for y in (y0, y1 - 22):
        d.rounded_rectangle([x0 - 8, y, x1 + 8, y + 22], radius=6, fill='#a8662e', outline=LINE, width=6)
    d.rounded_rectangle([108, 22, 148, 56], radius=10, outline=LINE, width=7)  # Griff
    return c


def bait():
    """Futterschale mit Obst (lockt die Tiere an)"""
    c = canvas()
    d = ImageDraw.Draw(c)
    for box, col in [([54, 88, 118, 152], '#e8483f'), ([138, 88, 202, 152], '#f4c43a'), ([96, 70, 160, 134], '#e8483f'), ([70, 110, 130, 170], '#7cc04a'), ([126, 110, 186, 170], '#ff9a2a')]:
        d.ellipse(box, fill=col, outline=LINE, width=6)
        d.ellipse([box[0] + 12, box[1] + 10, box[0] + 26, box[1] + 22], fill=(255, 255, 255, 160))
    d.line([(128, 72), (134, 52)], fill='#6b4224', width=7)  # Stiel
    d.ellipse([134, 44, 164, 62], fill='#5fae4a', outline=LINE, width=4)  # Blatt
    d.chord([28, 96, 228, 236], 0, 180, fill='#a8662e', outline=LINE, width=7)  # Schale
    d.rounded_rectangle([24, 156, 232, 176], radius=9, fill='#c98a4a', outline=LINE, width=6)  # Rand
    return c


def teddy():
    c = canvas()
    d = ImageDraw.Draw(c)
    fur, light = '#b8743a', '#e8b878'
    def blob(box, col=fur):
        d.ellipse(box, fill=col, outline=LINE, width=6)
    blob([62, 22, 108, 68])  # Ohren
    blob([148, 22, 194, 68])
    blob([74, 34, 96, 56], light)
    blob([160, 34, 182, 56], light)
    blob([52, 116, 204, 236])  # Bauch
    blob([28, 132, 80, 184])  # Arme
    blob([176, 132, 228, 184])
    blob([60, 196, 116, 246])  # Füße
    blob([140, 196, 196, 246])
    blob([92, 146, 164, 210], light)
    blob([62, 34, 194, 150])  # Kopf
    blob([100, 92, 156, 138], light)  # Schnauze
    d.ellipse([118, 98, 138, 114], fill=LINE)  # Nase
    d.ellipse([96, 74, 110, 88], fill=LINE)  # Augen
    d.ellipse([146, 74, 160, 88], fill=LINE)
    d.arc([112, 104, 144, 128], 20, 160, fill=LINE, width=4)
    return c


done(big_cage(), 'bigCage')
done(bait(), 'bait')
done(teddy(), 'teddy')
