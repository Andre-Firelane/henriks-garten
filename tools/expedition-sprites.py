"""Aufruf: python tools/expedition-sprites.py   (danach python tools/hd-phone.py und python tools/make-webp.py .; hd-phone
schreibt alle Handy-Bilder neu – unveränderte danach mit git checkout zurücksetzen)
Bilder der Expedition aus den gemalten Vorlagen in Expeditions-Sprites/ (Zelt, Tafel, Lagerfeuer, Trommel):
- Zelt.png  -> public/assets/exp_tent.png (Spielgröße, ZELT_W breit, unten 4 Pixel Rand) und hd/ (4-fach)
- Tafel.png -> public/assets/exp_board.png (Spielgröße, TAFEL_W breit) und hd/ (4-fach); gibt aus, wo das Brett liegt
               (für BOARD in src/scenes/GardenScene.js: dort zeichnet das Spiel den Weg der Expedition hinein)
- das Symbol des Bonus "Event-Ruf" kommt aus Trommel.png (siehe tools/bonus-icons.py)
Die Vorlagen haben einen durchsichtigen Hintergrund; sie werden auf den sichtbaren Teil zugeschnitten."""
from PIL import Image

SRC = 'Expeditions-Sprites'
A = 'public/assets'
HD = 4
ZELT_W = 200  # so breit ist das Zelt im Spiel (es steht auf 3 × 3 Kacheln)
TAFEL_W = 140  # so breit ist die Tafel im Spiel (mit Pfosten)
PAD = 4  # durchsichtiger Rand unten (Fußpunkt etwas über dem Bildrand)


def trimmed(path):
    im = Image.open(path).convert('RGBA')
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox())


def save(im, name, width):
    """in Spielgröße (width breit) und HD-fach so groß, unten PAD Pixel Rand; gibt den Faktor Vorlage -> Spiel zurück"""
    for sub, k in [('', 1), ('hd/', HD)]:
        w = width * k
        h = round(im.height * w / im.width)
        out = Image.new('RGBA', (w, h + PAD * k), (0, 0, 0, 0))
        out.alpha_composite(im.resize((w, h), Image.LANCZOS), (0, 0))
        out.save(f'{A}/{sub}{name}.png')
    return width / im.width


tent = trimmed(f'{SRC}/Zelt.png')
save(tent, 'exp_tent', ZELT_W)
print('exp_tent', ZELT_W, round(tent.height * ZELT_W / tent.width) + PAD)

board = trimmed(f'{SRC}/Tafel.png')
k = save(board, 'exp_board', TAFEL_W)
# das Brett: Zeilen, die fast die ganze Breite füllen (die Pfosten sind schmal)
a = board.getchannel('A')
rows = [y for y in range(board.height) if sum(1 for x in range(0, board.width, 4) if a.getpixel((x, y)) > 128) * 4 > board.width * 0.8]
cols = [x for x in range(board.width) if a.getpixel((x, (rows[0] + rows[-1]) // 2)) > 128]
print('exp_board', TAFEL_W, round(board.height * k) + PAD,
      'Brett:', {'x0': round(cols[0] * k), 'y0': round(rows[0] * k), 'x1': round(cols[-1] * k), 'y1': round(rows[-1] * k)})

# Symbole für die Auswahl auf der Weltkarte (128 × 128): Erkundung = Hochstand, Expedition = Zelt mit Lagerfeuer davor
ICON = 128


def fit(im, box):
    k = min(box[0] / im.width, box[1] / im.height)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def icon(parts, name):
    c = Image.new('RGBA', (ICON, ICON), (0, 0, 0, 0))
    for im, cx, bottom in parts:
        c.alpha_composite(im, (round(cx - im.width / 2), round(bottom - im.height)))
    c.save(f'{A}/{name}.png')
    print(name)


stand = fit(trimmed(f'{A}/forest_stand.png'), (116, 116))
icon([(stand, ICON / 2, ICON - (ICON - stand.height) / 2)], 'trip_explore')


def campfire():
    """gemaltes Lagerfeuer (Expeditions-Sprites/Lagerfeuer.png)"""
    return trimmed(f'{SRC}/Lagerfeuer.png')

def trimmed_im(im):
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox())


icon([(fit(tent, (112, 98)), 70, 100), (fit(campfire(), (50, 54)), 32, 124)], 'trip_expedition')

# Lagerfeuer im Spiel (Camp und Glücksbringer "Lagerfeuer"): campfire.png wie der frühere gezeichnete Platzhalter 56 × 60
# (das Spiel zeigt es halb so groß, Fußpunkt bei 90 % der Höhe) und hd/ (4-fach)
for sub, f in [('', 1), ('hd/', HD)]:
    c = Image.new('RGBA', (56 * f, 60 * f), (0, 0, 0, 0))
    im = fit(campfire(), (52 * f, 54 * f))
    c.alpha_composite(im, (round((56 * f - im.width) / 2), round(57 * f - im.height)))
    c.save(f'{A}/{sub}campfire.png')
print('campfire')

# auch in den Export-Ordner: die Spielbilder der Expedition (Lagerfeuer, Zelt, Tafel, Symbole der Weltkarte)
for name in ('campfire', 'trip_explore', 'trip_expedition', 'exp_tent', 'exp_board'):
    Image.open(f'{A}/{name}.png').save(f'{SRC}/{name}.png')
print('Export:', SRC)
