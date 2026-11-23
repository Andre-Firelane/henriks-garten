"""Aufruf: python tools/teahouse-sprites.py
Andres Teehaus und Stehtisch (Sprites/Teehaus.png, Sprites/Teehaus TIsch.png, schon freigestellt) ins Spiel bringen:
zuschneiden, auf Spielgröße bringen und als public/assets/<key>.png, hd/ (4×) und hd2/ (2×) speichern. Gibt Größe,
Fußpunkt (originY) und beim Teehaus die Lampions (Pixel neben bzw. über dem Fußpunkt) aus – die Angaben für
props/teaHouse in src/world/levels.js und ţ in src/world/map.js. Danach: python tools/make-webp.py .

Teehaus: die Plattform im Bild ist etwas zu steil und schief für die Kacheln (Kanten links 0,589, rechts 0,543 statt 0,5).
Darum wird das Bild erst senkrecht geschert und gestaucht (senkrechte Linien bleiben senkrecht), so dass beide Kanten
genau 0,5 fallen; dann füllt die Plattform genau die 3×3 Kacheln (192 Spielpixel breit)."""
import numpy as np
from PIL import Image

A = 'public/assets'


def write(key, im, w, h):
    im.resize((w * 4, h * 4), Image.LANCZOS).save(f'{A}/hd/{key}.png')
    im.resize((w * 2, h * 2), Image.LANCZOS).save(f'{A}/hd2/{key}.png')
    im.resize((w, h), Image.LANCZOS).save(f'{A}/{key}.png')


def bottom_slopes(im, x0, x1, xm):
    """Steigung der Unterkante links (x0 … xm) und rechts (xm … x1)."""
    al = np.asarray(im)[:, :, 3] > 40
    low = lambda x: np.nonzero(al[:, x])[0].max()
    return (low(xm - 50) - low(x0 + 4)) / (xm - 50 - x0 - 4), (low(x1 - 4) - low(xm + 50)) / (x1 - 4 - xm - 50)


# --- Teehaus ---
im = Image.open('Sprites/Teehaus.png').convert('RGBA')
X0, X1, CX = 106, 920, 513  # linke und rechte Ecke der Plattform, Mitte
sl, sr = bottom_slopes(im, X0, X1, CX)
k = -(sl + sr) / 2          # Scherung: beide Kanten gleich steil
m = 0.5 / (sl + k)          # Stauchung: genau 0,5
# Ausgabe (x, y) nimmt das Eingabepixel (x, y / m - k·(x - CX))
im = im.transform(im.size, Image.AFFINE, (1, 0, 0, -k, 1 / m, k * CX), resample=Image.BICUBIC)
al = np.asarray(im)[:, :, 3] > 40
ys, xs = np.nonzero(al)
front = ys.max()                       # vordere Ecke unten = vorderste Kachelecke
foot = front - (X1 - X0) / 2 * 0.5     # Mitte der Grundfläche
half = max(CX - xs.min(), xs.max() - CX)
top = ys.min()
im = im.crop((CX - half, top, CX + half, front + 1))
s = 192 / (X1 - X0)
w, h = round(im.width * s), round(im.height * s)
write('teahouse', im, w, h)
lamps = [(72, 470), (952, 470)]
fy = (foot - top) * s
print(f'teahouse: {w}x{h}, originY {round(fy)} / {h}, Kanten vorher {sl:.3f} {sr:.3f}',
      [(round((x - CX) * s), round(((470 + k * (x - CX)) * m - foot) * s)) for x, _ in lamps])

# --- Stehtisch ---
im = Image.open('Sprites/Teehaus TIsch.png').convert('RGBA').crop((512 - 334, 119, 512 + 334, 924))
s = 0.048  # Tischplatte 665 px = 32 Spielpixel
w, h = round(im.width * s), round(im.height * s)
write('tea_table', im, w, h)
print(f'tea_table: {w}x{h}, originY {round((905 - 119) * h / im.height)} / {h}')
