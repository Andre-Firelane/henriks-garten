"""Spritesheet (4 Ansichten) einer neuen Tierart aus einzeln freigestellten Ansichten (tools/cutout-views.py), ohne
Vorlage einer Grundart (dafür siehe tools/rare-static.py): alle Ansichten mit demselben Faktor, so dass die erste
Ansicht HÖHE Pixel hoch ist (höchstens so breit wie der Rahmen), mittig, Füße auf der Linie FUSS (von oben).
Aufruf: python tools/static-sheet.py <frameW> <frameH> <Höhe> <Fuß> <Ziel> v0.png v1.png v2.png v3.png
  (Reihenfolge unten-rechts, unten-links, oben-rechts, oben-links)
  --wasser <frameW> <frameH> <Wasserlinie> <Anteil> <Ziel>  (vor den Ansichten): dazu ein Bild "im Wasser" wie
  hippo_water: nur der obere Anteil der Figur um den Kopf herum, unten an der Wasserlinie abgeschnitten.
Danach python tools/make-webp.py .

So entstanden (V = "Tiersprites Test/views", A = public/assets):
  python tools/cutout-views.py Sprites/Tapir.webp $V/tapir 1 4 schatten-grau,loecher,alle   (ebenso Tapir2)
  python tools/cutout-views.py Sprites/Okapi.webp $V/okapi 1 4 schatten,loecher,alle   (ebenso Okapi2)
  python tools/static-sheet.py 96 88 74 84 $A/tapir.png --wasser 64 44 40 0.42 $A/tapir_water.png $V/tapir_v0.png ... _v3.png
  python tools/static-sheet.py 80 104 90 100 $A/okapi.png $V/okapi_v0.png ... _v3.png"""
import sys
import numpy as np
from PIL import Image

args = sys.argv[1:]
FW, FH, TH, FOOT, out = int(args[0]), int(args[1]), int(args[2]), int(args[3]), args[4]
args = args[5:]
water = None
if args[0] == '--wasser':
    water = (int(args[1]), int(args[2]), int(args[3]), float(args[4]), args[5])
    args = args[6:]
views = [Image.open(p).convert('RGBA') for p in args]
k = TH / views[0].height
k = min(k, *[(FW - 2) / v.width for v in views])
sheet = Image.new('RGBA', (FW * len(views), FH))
smalls = []
for i, v in enumerate(views):
    w, h = max(1, round(v.width * k)), max(1, round(v.height * k))
    small = v.resize((w, h), Image.LANCZOS)
    smalls.append(small)
    sheet.alpha_composite(small, (i * FW + round((FW - w) / 2), FOOT - h))
sheet.save(out)
print(out, sheet.size)

if water:
    WW, WH, LINE, share, wout = water
    res = Image.new('RGBA', (WW * len(smalls), WH))
    for i, s in enumerate(smalls):
        a = np.array(s)[..., 3] > 76
        ys = np.where(a.any(1))[0]
        top = ys.min()
        cut = top + round((ys.max() - top) * share)
        # Kopf: Mitte der Pixel in den obersten Zeilen (Ohren), das Fenster ist so breit wie der Rahmen
        head = a[top:top + max(3, round((cut - top) * 0.35))]
        cx = np.where(head.any(0))[0].mean()
        x0 = round(cx - (WW - 4) / 2)
        part = s.crop((x0, top, x0 + WW - 4, cut))
        res.alpha_composite(part, (i * WW + 2, LINE - part.height))
    res.save(wout)
    print(wout, res.size)
