"""Spiel-Standbild (4 Ansichten) einer seltenen Variante aus einzeln freigestellten Ansichten (tools/cutout-views.py):
jede Ansicht so groß wie die Figur im Original-Bild derselben Ansicht, mittig, Füße auf derselben Höhe.
Aufruf: python tools/rare-static.py <Original-Sheet> <frameW> <frameH> <Ziel> v0.png v1.png v2.png v3.png
  ('m:x.png' = gespiegelt; Reihenfolge unten-rechts, unten-links, oben-rechts, oben-links). Danach python tools/make-webp.py .
  Hat das Original weniger Bilder (z. B. anteater_eat), entsprechend weniger Ansichten angeben.

So entstanden (V = "Tiersprites Test/views", A = public/assets):
  python tools/cutout-views.py Sprites/Schaf2.webp $V/sheep2 1 2 alle
  python tools/cutout-views.py "Sprites/Schaf2 frisst.webp" $V/sheep2_eat 1 2 alle   (Grasbüschel am Bein vorher weiß übermalt)
  python tools/cutout-views.py Sprites/Reiher2.webp $V/heron2 1 2 loecher,alle
  python tools/cutout-views.py "Sprites/Reiher2 fliegt.webp" $V/heron2_fly 1 4 loecher,alle
  python tools/cutout-views.py Sprites/Fuchs2.webp $V/fox2 1 4 schatten-grau,alle
  python tools/cutout-views.py "Sprites/Fuchs2 frisst.webp" $V/fox2_eat 1 4 schatten-grau,alle
  python tools/cutout-views.py Sprites/Eichhörnchen2.webp $V/squirrel2 1 4 schatten,alle
  python tools/cutout-views.py Sprites/Biber2.webp $V/beaver2 1 2 schatten,alle
  python tools/cutout-views.py Sprites/Affe2.webp $V/macaque2 1 4 schatten,alle
  python tools/cutout-views.py "Sprites/Affe2 badet.webp" $V/macaque2_bath 1 4 schatten,wasser,alle
  python tools/rare-static.py $A/sheep.png 80 88 $A/sheep2.png $V/sheep2_v0.png m:$V/sheep2_v0.png $V/sheep2_v1.png m:$V/sheep2_v1.png
  (ebenso sheep_eat, heron, beaver mit gespiegelten Ansichten; heron_fly 96x92, fox, fox_eat, squirrel 56x60, macaque,
  macaque_bath mit v0..v3)
fox2_sleep: aus fox_sleep umgefärbt (tools/rare-static.py --fox-sleep); beaver2_swim: tools/beaver-swim.py mit der
gespiegelten Nutria-Vorderansicht (SCALE 0.115)."""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps

# --scharf (vor allen anderen Angaben): nach dem Verkleinern nachschärfen, für feine Vorlagen in kleinen Bildern
# (Fetzenfisch, 48 x 64), die sonst neben der Pixel-Art der Grundart verschwommen wirken
SHARP = sys.argv[1] == '--scharf'
if SHARP: del sys.argv[1]
if sys.argv[1] == '--fox-sleep':
    # Silberfuchs schläft: rotes und oranges Fell des schlafenden Fuchses dunkelgrau (Helligkeitsverlauf bleibt)
    im = np.array(Image.open('public/assets/fox_sleep.png').convert('RGBA')).astype(float)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    sat = im[..., :3].max(2) - im[..., :3].min(2)
    orange = (r > g) & (g >= b - 10) & (sat > 40)
    v = 40 + (0.3 * r + 0.59 * g + 0.11 * b) * 0.42
    for c, t in enumerate([0.97, 1.0, 1.05]): im[..., c] = np.where(orange, np.clip(v * t, 0, 255), im[..., c])
    Image.fromarray(im.astype(np.uint8), 'RGBA').save('public/assets/fox2_sleep.png')
    sys.exit()
orig, FW, FH, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
srcs = sys.argv[5:]  # meist 4 Ansichten; weniger, wenn das Original weniger Bilder hat (z. B. anteater_eat: 1)
O = Image.open(orig).convert('RGBA')
res = Image.new('RGBA', (FW * len(srcs), FH))
for i, s in enumerate(srcs):
    mirror = s.startswith('m:')
    v = Image.open(s[2:] if mirror else s).convert('RGBA')
    if mirror: v = ImageOps.mirror(v)
    a = np.array(O.crop((i * FW, 0, i * FW + FW, FH)))[..., 3] > 76
    ys = np.where(a.any(1))[0]
    th, bottom = ys.max() - ys.min() + 1, ys.max() + 1
    k = min(th / v.height, (FW - 2) / v.width)  # so hoch wie das Original, höchstens so breit wie der Rahmen
    w, h = max(1, round(v.width * k)), max(1, round(v.height * k))
    small = v.resize((w, h), Image.LANCZOS)
    if SHARP:
        # Farben nachschärfen (Alpha bleibt), halbdurchsichtige Randpixel kräftiger: klarere Umrisse wie Pixel-Art
        rgb = small.convert('RGB').filter(ImageFilter.UnsharpMask(radius=0.8, percent=80, threshold=2))
        alpha = small.getchannel('A').point(lambda x: 0 if x < 50 else min(255, round(x * 1.2)))
        small = Image.merge('RGBA', (*rgb.split(), alpha))
    res.alpha_composite(small, (i * FW + round((FW - w) / 2), bottom - h))
res.save(out)
print(out, 'fertig')
