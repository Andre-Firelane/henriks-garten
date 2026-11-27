"""Schlafbilder der Tiere im Gehege (Sprites/<Tier> schläft.webp) als Spritesheets <key>_sleep.png in public/assets/.
Vorher je Bild freistellen (V = "Tiersprites Test/views"):
  python tools/cutout-views.py "Sprites/Reh schläft.webp" "$V/deer_sleep" 1 4 schatten,loecher,alle
  (ebenso Reh2 -> stag, Antilope -> antelope, Okapi -> okapi, Tanuki -> tanuki mit "schatten";
   Schaf -> sheep, Schaf2 -> sheep2, Zebra -> zebra, Rentier -> reindeer, Wolf -> wolf mit "schatten-grau";
   Pinguin -> penguin mit "schatten", danach den bläulichen Schatten (173,181,187) vom Rand her weg)
Aufruf: python tools/sleep-sheets.py   (danach python tools/make-webp.py .)

Maßstab: wie das Grundbild der Art. Gemessen wird die Figur in dessen erstem Bild (unten-rechts): die liegende Figur
bekommt dieselbe Breite mal FAKTOR (der liegende Körper ist etwa so lang wie der stehende); beim Pinguin, der sich auf
den Bauch legt, ist die liegende Breite so groß wie die stehende Höhe. Rahmen so hoch wie beim Grundbild, Fußlinie
gleich (dann passt kind.originY), breiter falls nötig."""
import numpy as np
from PIL import Image, ImageOps

V = 'Tiersprites Test/views'
A = 'public/assets'
# key: (Rahmenbreite, Rahmenhöhe des Grundbilds, Maß ('w' Breite / 'h' Höhe des Grundbilds), Faktor,
#       Ansichten unten-rechts, unten-links, oben-rechts, oben-links als (Index, gespiegelt))
STD = [(0, False), (1, False), (2, False), (3, False)]
SHEETS = {
    'deer': (72, 96, 'w', 1.0, STD),
    'stag': (80, 112, 'w', 1.0, STD),
    'sheep': (80, 88, 'w', 1.0, STD),
    'sheep2': (80, 88, 'w', 1.3, [(1, False), (2, False), (0, False), (0, True)]),  # im Bild 2x2 angeordnet
    'antelope': (72, 100, 'w', 1.0, STD),
    'zebra': (80, 104, 'w', 1.0, STD),
    'okapi': (80, 104, 'w', 1.0, STD),
    'penguin': (72, 80, 'h', 0.92, [(0, True), (0, False), (2, False), (2, True)]),  # beide vorderen schauen nach links
    'reindeer': (92, 128, 'w', 1.0, STD),
    'tanuki': (72, 72, 'w', 1.05, STD),
    'wolf': (80, 80, 'w', 1.4, STD),
}


def bbox(img, thr=76):
    a = np.array(img)[..., 3] > thr
    ys, xs = np.where(a)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


for key, (FW, FH, mode, fac, order) in SHEETS.items():
    base = Image.open(f'{A}/{key}.png').convert('RGBA').crop((0, 0, FW, FH))
    bx0, by0, bx1, by1 = bbox(base)
    foot = by1  # Fußlinie wie beim Grundbild
    views = []
    for i, mirror in order:
        v = Image.open(f'{V}/{key}_sleep_v{i}.png').convert('RGBA')
        v = v.crop(bbox(v, 8))
        views.append(ImageOps.mirror(v) if mirror else v)
    target = (bx1 - bx0 if mode == 'w' else by1 - by0) * fac
    k = target / views[0].width
    smalls = [v.resize((max(1, round(v.width * k)), max(1, round(v.height * k))), Image.LANCZOS) for v in views]
    fw = max(FW, max(s.width for s in smalls) + 2)
    fw += fw % 2
    sheet = Image.new('RGBA', (fw * 4, FH))
    for n, s in enumerate(smalls):
        sheet.alpha_composite(s, (n * fw + (fw - s.width) // 2, max(0, foot - s.height)))
    sheet.save(f'{A}/{key}_sleep.png')
    print(f'{key}_sleep.png', fw, FH, 'Figur', smalls[0].size, 'Grundbild', (bx1 - bx0, by1 - by0))
