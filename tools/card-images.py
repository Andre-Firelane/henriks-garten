"""Bilder der seltenen Tiere für die Kisten-Karten: die Vorderansicht aus der großen Vorlage, freigestellt und auf
SIZE Pixel verkleinert (public/assets/card_<skin>.png). Die Spiel-Sprites sind dafür zu klein (auf der Karte 3- bis
4-fach vergrößert, unscharf neben den Glücksbringer-Bildern).
Aufruf: python tools/card-images.py <Ordner mit freigestellten Ansichten>   (danach python tools/make-webp.py .)
Die Ansichten (Name_v0.png ...) entstehen mit tools/cutout-views.py ... alle (siehe tools/rare-static.py); Vorlagen, die
schon freigestellt sind (PNG mit Transparenz), nimmt das Skript direkt: dort die Ansicht oben links.
Neue Kartenbilder auch in CARD_SKINS in src/world/LuckWorld.js eintragen."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SIZE = 176
V = sys.argv[1]

# Skin: 'view:<Datei im Ansichten-Ordner ohne .png>' oder 'png:<freigestellte Vorlage in Sprites/>'
CARDS = {
    'cat2': 'png:Katze2 neu.png', 'stag': 'png:Hirsch.png', 'antelope2': 'png:Antilope2.png', 'croc_albino': 'png:Krokodil2.png',
    'tiger2': 'png:Tiger2.png', 'peacock2': 'png:Pfau2.png', 'orangutan2': 'png:Orang Utan2.png', 'frog2': 'png:Frosch2.png',
    'jellyfish2': 'png:Qualle2.png', 'wolf2': 'png:Wolf2.png', 'lion2': 'png:Löwe2.png', 'iguana2': 'png:Leguan2.png',
    'panther': 'png:Jaguar2.png', 'macaw2': 'png:Ara2.png', 'snake2': 'png:Schlange2.png', 'tarantula2': 'png:Vogelspinne2.png',
    'ray2': 'png:Rochen2.png', 'gibbon': 'png:Gibbon.png', 'octopus2': 'png:Krake2.png',
    'sheep2': 'view:sheep2_v0', 'heron2': 'view:heron2_v0', 'fox2': 'view:fox2_v0', 'squirrel2': 'view:squirrel2_v0',
    'beaver2': 'view:beaver2_v0', 'macaque2': 'view:macaque2_v0',
    'anteater2': 'view:anteater2_v0', 'meerkat2': 'view:meerkat2_v0', 'vulture2': 'view:vulture2_norock_v0',
    'gorilla2': 'view:gorilla2_v0', 'hyena2': 'view:hyena2_v0', 'hippo2': 'view:hippo2_v0', 'panda2': 'view:panda2_v0',
    'penguin2': 'view:penguin2_v0', 'seal2': 'view:seal2_v0', 'seahorse2': 'view:seahorse2_v1', 'toucan2': 'view:toucan2_v0',
    'turtle2': 'view:turtle2_v0', 'warthog2': 'view:warthog2_v0',
    'tapir2': 'view:tapir2_v0', 'okapi2': 'view:okapi2_v0', 'tanuki2': 'view:tanuki2_v0', 'yak2': 'view:yak2_v0',
}


def first_view(path):
    """aus einer freigestellten Vorlage mit mehreren Ansichten die oben links (große Teile, kleine Krümel weg)"""
    im = Image.open(path).convert('RGBA')
    solid = Image.fromarray(((np.array(im)[..., 3] > 128) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5)).copy()
    arr = np.array(solid)
    parts, n = [], 1
    while n < 250:
        ys, xs = np.where(arr == 255)
        if not len(xs): break
        ImageDraw.floodfill(solid, (int(xs[0]), int(ys[0])), n)
        arr = np.array(solid)
        m = arr == n
        ys, xs = np.where(m)
        parts.append((m.sum(), xs.mean(), ys.mean(), m))
        n += 1
    big = max(p[0] for p in parts)
    views = [p for p in parts if p[0] >= big * 0.25]
    _, _, _, mask = min(views, key=lambda p: p[1] + p[2])  # oben links
    keep = np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
    a = np.array(im)
    a[~keep, 3] = 0
    out = Image.fromarray(a, 'RGBA')
    return out.crop(out.getchannel('A').getbbox())


for skin, src in CARDS.items():
    kind, name = src.split(':', 1)
    img = first_view(f'Sprites/{name}') if kind == 'png' else Image.open(f'{V}/{name}.png').convert('RGBA')
    img = img.crop(img.getchannel('A').getbbox())
    k = SIZE / max(img.size)
    img = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    img.save(f'public/assets/card_{skin}.png')
    print(f'card_{skin}.png', img.size)
