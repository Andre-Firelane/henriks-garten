"""Aufruf: python tools/planks-seamless.py <key> [Anzahl Fugen]   (braucht Pillow und numpy)
Bodenkachel mit Planken (z. B. planks_jungle, der Holzsteg der Tropenhalle) so verformen, dass die Fugen an der
Nachbarkachel genau weiterlaufen: Die Planken liegen entlang tx; quer dazu (entlang ty) werden die Fugen gesucht und
stückweise gleichmäßig auf (i + c) / Anzahl verschoben (c: möglichst nah an der alten Lage), dazwischen wird gestreckt bzw. gestaucht.
Jede Fuge wird dabei über die ganze Plankenlänge verfolgt (im Bild läuft sie leicht schräg) und gerade gezogen, sonst
knicken die Fugen an der Kachelgrenze. Die Kachelkante liegt
dann mitten in einer Planke, die an der Nachbarkachel nahtlos weitergeht.
Arbeitet auf der großen Fassung (public/assets/hd/<key>.png, das Original kommt vorher nach Sprites/Original/<key>.png)
und erzeugt daraus hd2/ und die Spielgröße. Danach: python tools/make-webp.py ."""
import os
import shutil
import sys
import numpy as np
from PIL import Image

A = 'public/assets'
key = sys.argv[1]
N = int(sys.argv[2]) if len(sys.argv) > 2 else None

src = f'{A}/hd/{key}.png'
os.makedirs('Sprites/Original', exist_ok=True)
keep = f'Sprites/Original/{key}.png'
if not os.path.exists(keep):
    shutil.copyfile(src, keep)
im = np.array(Image.open(keep).convert('RGBA')).astype(float)
H, W = im.shape[:2]
cx, cy = W / 2, H / 2


def to_uv(x, y):
    dx, dy = x - cx, y - cy
    return (dx / cx + dy / cy) / 2 + 0.5, (dy / cy - dx / cx) / 2 + 0.5  # u entlang tx, v entlang ty, je 0 … 1


def to_xy(u, v):
    a, b = u - 0.5, v - 0.5
    return cx + (a - b) * cx, cy + (a + b) * cy


# Helligkeit quer zu den Planken (gemittelt über die Mitte der Plankenlänge)
S = 400
vs = (np.arange(S) + 0.5) / S
prof = np.zeros(S)
for u in np.linspace(0.2, 0.8, 40):
    x, y = to_xy(u, vs)
    xi = np.clip(x.astype(int), 0, W - 1)
    yi = np.clip(y.astype(int), 0, H - 1)
    prof += im[yi, xi, :3].sum(1)
prof /= 40
# Fugen: deutlich dunkler als die Umgebung (lokale Minima, Abstand mindestens 1/12)
smooth = np.convolve(prof, np.ones(5) / 5, mode='same')
base = np.convolve(prof, np.ones(41) / 41, mode='same')
cand = [i for i in range(8, S - 8) if smooth[i] == smooth[i - 6:i + 7].min() and smooth[i] < base[i] - 25]
gaps = []
for i in cand:
    if not gaps or i - gaps[-1] > S / 12:
        gaps.append(i)
gaps = [g / S for g in gaps]
n = N or len(gaps)
print('Fugen bei', [round(g, 3) for g in gaps], '->', n, 'gleichmaessige')
gaps = gaps[:n]
# stückweise linear: Rand 0 und 1 bleiben, Fuge i -> (i + c) / n; c so, dass sich die Fugen möglichst wenig bewegen
c = float(np.clip(np.mean([g * n - i for i, g in enumerate(gaps)]), 0.1, 0.9))
src_pts = [0.0, *gaps, 1.0]
dst_pts = [0.0, *[(i + c) / n for i in range(n)], 1.0]

# jede Fuge über die Plankenlänge verfolgen (sie läuft im Bild leicht schräg oder krumm): je Abschnitt entlang u die
# dunkelste Stelle nahe der Fuge, dann eine Gerade v = a + b·u hindurch. So werden die Fugen beim Verformen gerade.
lines = []
for g in gaps:
    us, gv = [], []
    for u in np.linspace(0.04, 0.96, 24):
        vv = np.linspace(max(0.0, g - 0.06), min(1.0, g + 0.06), 60)
        x, y = to_xy(np.full_like(vv, u), vv)
        xi = np.clip(x.astype(int), 0, W - 1)
        yi = np.clip(y.astype(int), 0, H - 1)
        if im[yi, xi, 3].min() < 200:
            continue  # (außerhalb der Raute)
        br = np.convolve(im[yi, xi, :3].sum(1), np.ones(3) / 3, mode='same')
        us.append(u)
        gv.append(vv[int(np.argmin(br[1:-1])) + 1])
    b_, a_ = np.polyfit(us, gv, 1)
    lines.append((a_, b_))
print('Fugen (Anfang, Ende):', [(round(a_, 3), round(a_ + b_, 3)) for a_, b_ in lines])

ys, xs = np.mgrid[0:H, 0:W]
u, v = to_uv(xs + 0.5, ys + 0.5)
src = [np.zeros_like(u)] + [a_ + b_ * u for a_, b_ in lines] + [np.ones_like(u)]
dst = [0.0] + [(i + c) / n for i in range(n)] + [1.0]
v_in = np.zeros_like(v)
for k in range(len(dst) - 1):
    seg = (v >= dst[k]) & (v <= dst[k + 1])
    t = (v - dst[k]) / (dst[k + 1] - dst[k])
    v_in = np.where(seg, src[k] + t * (src[k + 1] - src[k]), v_in)
x_in, y_in = to_xy(u, v_in)
x_in = np.clip(x_in - 0.5, 0, W - 1)
y_in = np.clip(y_in - 0.5, 0, H - 1)
# bilinear
x0 = np.floor(x_in).astype(int); y0 = np.floor(y_in).astype(int)
x1 = np.minimum(x0 + 1, W - 1); y1 = np.minimum(y0 + 1, H - 1)
fx = (x_in - x0)[..., None]; fy = (y_in - y0)[..., None]
out = (im[y0, x0] * (1 - fx) * (1 - fy) + im[y0, x1] * fx * (1 - fy) + im[y1, x0] * (1 - fx) * fy + im[y1, x1] * fx * fy)
out[..., 3] = im[..., 3]  # Umriss der Raute bleibt genau
big = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')
big.save(f'{A}/hd/{key}.png')
big.resize((W // 2, H // 2), Image.LANCZOS).save(f'{A}/hd2/{key}.png')
big.resize((W // 4, H // 4), Image.LANCZOS).save(f'{A}/{key}.png')
print('fertig')
