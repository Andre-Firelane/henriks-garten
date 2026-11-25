"""Spritesheet (4 Ansichten) einer neuen Tierart aus einzeln freigestellten Ansichten (tools/cutout-views.py), ohne
Vorlage einer Grundart (dafür siehe tools/rare-static.py): alle Ansichten mit demselben Faktor, so dass die erste
Ansicht HÖHE Pixel hoch ist (höchstens so breit wie der Rahmen), mittig, Füße auf der Linie FUSS (von oben).
Aufruf: python tools/static-sheet.py <frameW> <frameH> <Höhe> <Fuß> <Ziel> v0.png v1.png v2.png v3.png
  (Reihenfolge unten-rechts, unten-links, oben-rechts, oben-links)
  --wasser <frameW> <frameH> <Wasserlinie> <Anteil> <Ziel>  (vor den Ansichten): dazu ein Bild "im Wasser" wie
  hippo_water: nur der obere Anteil der Figur um den Kopf herum, unten an der Wasserlinie abgeschnitten. Ist es so breit
  wie der Rahmen (Elch), bleibt die ganze Breite: abgeschnitten wird dann nur unten.
  --schraeg <Steigung> (nach --wasser): bei voller Breite schneidet die Wasserkante schräg im Iso-Winkel (0.5), wie der Körper
  in der Ansicht steht; das Wasser-Bild muss dann unter der Wasserlinie Platz für das tiefere vordere Ende haben.
Danach python tools/make-webp.py .

So entstanden (V = "Tiersprites Test/views", A = public/assets):
  python tools/cutout-views.py Sprites/Tapir.webp $V/tapir 1 4 schatten-grau,loecher,alle   (ebenso Tapir2)
  python tools/cutout-views.py Sprites/Okapi.webp $V/okapi 1 4 schatten,loecher,alle   (ebenso Okapi2)
  python tools/static-sheet.py 96 88 74 84 $A/tapir.png --wasser 64 44 40 0.42 $A/tapir_water.png $V/tapir_v0.png ... _v3.png
  python tools/static-sheet.py 80 104 90 100 $A/okapi.png $V/okapi_v0.png ... _v3.png
  python tools/cutout-views.py Sprites/Tanuki.webp $V/tanuki 1 4 schatten,loecher,alle   (ebenso Tanuki2)
  python tools/static-sheet.py 72 72 56 68 $A/tanuki.png $V/tanuki_v0.png ... _v3.png   (ebenso tanuki2)
  python tools/cutout-views.py Sprites/Yak.webp $V/yak 1 4 schatten,loecher,alle   (ebenso Yak2; _v3 = _v2 gespiegelt)
  python tools/static-sheet.py 112 104 92 100 $A/yak.png $V/yak_v0.png ... _v3.png   (ebenso yak2)
  python tools/cutout-views.py Sprites/Schneeleopard.webp $V/snowleopard 1 4 schatten,loecher,alle
  python tools/static-sheet.py 88 80 64 76 $A/snowleopard.png $V/snowleopard_v0.png ... _v3.png
  python tools/cutout-views.py Sprites/Elch.webp $V/elk 1 2 schatten,loecher,alle   (ebenso Elch2.webp -> elk2: grau ist normal, braun selten; zwei Ansichten,
    gespiegelt zu vier: _d0 = _v0 gespiegelt, _d1 = _v0, _d2 = _v1, _d3 = _v1 gespiegelt; Reste vom weißen Hintergrund weg)
  python tools/static-sheet.py 128 128 112 124 $A/elk.png --wasser 128 112 72 0.6 $A/elk_water.png --schraeg 0.5 $V/elk_d0.png ... _d3.png
  python tools/cutout-views.py Sprites/Igel.webp $V/hedgehog 1 4 schatten,loecher,alle   (ebenso Igel2 -> hedgehog2)
  python tools/static-sheet.py 80 64 50 60 $A/hedgehog.png $V/hedgehog_v0.png _v3 _v2 _v1   (Apfel-Igel: Höhe 56 wegen des Apfels)
  Eiswelt (alle mit cutout-views.py ... 1 4 schatten-grau,loecher,alle; Nebenbilder mit der Höhe, die derselbe Faktor
  wie beim Grundbild ergibt):
  Eisbär.webp -> polarbear: 152 148 124 144; Eisbär wartet.webp -> polarbear_wait: 152 148 109 144;
    EIsbär schläft.webp -> polarbear_sleep: 152 148 90 144 (volle Größe statt scale 0.75 im Spiel, Platz für die Rückansicht)
  Walross.webp -> walrus: 136 128 108 123; Walross schläft.webp -> walrus_sleep: 136 128 77 123 (volle Größe)
  Rentier.webp -> reindeer: 92 128 114 123 (etwas größer als früher 100); Polarfuchs.webp -> arcticfox: 72 72 56 68
  Rentier2.webp -> reindeer2 (weiß, großes Geweih): 92 128 122 123 (Körper so groß wie beim Rentier, nur das Geweih größer)
  Polarwolf.webp -> arcticwolf: 80 80 68 76; Polarwolf heult.webp -> arcticwolf_howl: 80 80 69 76
  Papageientaucher.webp -> puffin: 64 68 55 63 (_v3 gespiegelt); Papageientaucher fliegt.webp -> puffin_fly: 84 78 47 76
    (_v1 und _v3 gespiegelt: dort schaute der Schnabel nach rechts)
  Schneeeule.webp -> snowowl: 72 80 68 76 (so groß wie der Hase); Schneehase.webp -> snowhare: 76 82 68 76 (größer statt scale 0.68 im Spiel)
  Schneeeule fliegt.webp -> snowowl_fly: 88 76 46 72, nur die Vorderansicht _v1 (die anderen passen nicht zusammen):
    _d0 = _v1, _d1 = _v1 gespiegelt, Reihenfolge _d0 _d1 _d0 _d1"""
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
SLANT = 0.0
if args[0] == '--schraeg':  # Wasserkante schräg im Iso-Winkel (nur bei voller Breite, siehe unten)
    SLANT = float(args[1])
    args = args[2:]
# Richtung der schrägen Kante je Ansicht (unten-rechts, unten-links, oben-rechts, oben-links): +1 vorne rechts tiefer
SLANT_DIR = [1, -1, -1, 1]
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
        if WW >= FW:  # so breit wie der Rahmen (Elch): seitlich nichts abschneiden, nur unten an der Wasserlinie
            # --schraeg: die Kante folgt dem Körper, der schräg in der Iso-Ansicht steht (das vordere Ende taucht tiefer
            # ein), leicht nach unten gewölbt wie der vordere Rand eines Ovals; die Mitte bleibt auf der Wasserlinie
            cols = np.where(a.any(0))[0]
            cx, hw = (cols.min() + cols.max()) / 2, max(1, (cols.max() - cols.min()) / 2)
            xs = np.arange(s.width)
            u = np.clip((xs - cx) / hw, -1, 1)
            edge = cut + SLANT_DIR[i % 4] * SLANT * (xs - cx) + SLANT * 0.12 * hw * (1 - u * u) if SLANT else np.full(s.width, float(cut))
            arr = np.array(s)
            ys = np.arange(s.height)[:, None]
            keep = np.clip(edge[None, :] - ys + 0.5, 0, 1)  # eine Zeile weicher Übergang
            arr[..., 3] = (arr[..., 3] * keep).astype(np.uint8)
            bottom = int(np.ceil(edge.max())) + 1
            part = Image.fromarray(arr).crop((0, top, s.width, min(s.height, bottom)))
            res.alpha_composite(part, (i * WW + round((WW - s.width) / 2), LINE - (cut - top)))
            continue
        x0 = round(cx - (WW - 4) / 2)
        part = s.crop((x0, top, x0 + WW - 4, cut))
        res.alpha_composite(part, (i * WW + 2, LINE - part.height))
    res.save(wout)
    print(wout, res.size)
