"""Neue Fischarten freistellen: die Vorlagen (webp, weißer Hintergrund) mit tools/remove-background.js freistellen
und Bilder mit mehreren Fischen (eine Zeile je Art: auftauchend, rechts, links, springend) in einzelne Bilder zerlegen.
Ergebnis: Sprites/<Art>.png im selben Format wie Sprites/Fisch.png (1024x572, eine Art je Bild).
Aufruf: python tools/fish-cut.py   (braucht Pillow und numpy), danach npm run characters"""
import os
import subprocess
import tempfile
import numpy as np
from PIL import Image

# Vorlage -> Arten von oben nach unten
SHEETS = {
    'Sprites/Fische1.webp': ['Barsch', 'Hecht', 'Karpfen', 'Wels'],
    'Sprites/Fische2.webp': ['Rotauge', 'Schleie', 'Äsche', 'Stör'],
    'Sprites/Fisch Wald.webp': ['Forelle'],
}

tmp = tempfile.mkdtemp()
for src, names in SHEETS.items():
    png = os.path.join(tmp, 'in.png')
    cut = os.path.join(tmp, 'cut.png')
    Image.open(src).convert('RGBA').save(png)
    subprocess.run(['node', 'tools/remove-background.js', png, cut], check=True)
    img = Image.open(cut)
    rgba = np.asarray(img)
    a = rgba[:, :, 3]
    W, H = img.size
    n = len(names)
    # Trennlinien zwischen den Zeilen: dort, wo am wenigsten sichtbar ist (Spritzer und Blasen berühren die Nachbarzeile)
    cover = (a > 20).sum(1)
    cuts = [0]
    for k in range(1, n):
        lo, hi = H * k // n - 40, H * k // n + 40
        cuts.append(lo + int(np.argmin(cover[lo:hi])))
    cuts.append(H)
    # zusammenhängende Flächen: jede gehört ganz zu der Zeile, in der ihr Mittelpunkt liegt
    label = np.full((H, W), -1, np.int32)
    vis = a > 0
    row_of = np.zeros((H, W), np.int8)
    for sy, sx in zip(*np.nonzero(vis)):
        if label[sy, sx] >= 0:
            continue
        stack, pix = [(sy, sx)], []
        label[sy, sx] = 1
        while stack:
            y, x = stack.pop()
            pix.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < H and 0 <= nx < W and vis[ny, nx] and label[ny, nx] < 0:
                    label[ny, nx] = 1
                    stack.append((ny, nx))
        ys = [y for y, _ in pix]
        cy = sum(ys) / len(ys)
        # große Flächen, die über eine Trennlinie reichen (Fisch + Spritzer der Nachbarzeile): pixelweise trennen
        r = sum(1 for c in cuts[1:-1] if cy >= c)
        for y, x in pix:
            row_of[y, x] = r if len(pix) < 3000 else sum(1 for c in cuts[1:-1] if y >= c)
    bands = []
    for r in range(n):
        mask = vis & (row_of == r)
        ys = np.nonzero(mask.any(1))[0]
        bands.append((ys[0], ys[-1], mask))
    for (y0, y1, mask), name in zip(bands, names):
        part = rgba.copy()
        part[~mask] = 0
        out = Image.new('RGBA', (W, 572), (0, 0, 0, 0))
        h = y1 - y0 + 1
        top = max(0, 230 - h)  # wie bei Sprites/Fisch.png: Unterkante etwa bei y=230
        out.paste(Image.fromarray(part[y0 : y1 + 1]), (0, top))
        out.save(f'Sprites/{name}.png')
        print(f'Sprites/{name}.png: Zeilen {y0}-{y1}')

# Lungenfisch (neu): im dritten und vierten Bild alles unter Wasser abschneiden (Schnittlinie knapp unter dem Wasserstrich
# bzw. dem Schaum, Punkte x,y) und im dritten Bild das weiße Wasser zwischen Körper und Wasserlinie durchsichtig machen
png = os.path.join(tmp, 'in.png')
cut = os.path.join(tmp, 'cut.png')
Image.open('Sprites/Lungenfisch neu.webp').convert('RGBA').save(png)
subprocess.run(['node', 'tools/remove-background.js', png, cut], check=True)
a = np.array(Image.open(cut))
WATERLINES = [
    [(520, 229), (560, 229), (600, 235), (640, 239), (680, 237), (720, 230), (745, 221), (770, 221)],
    [(771, 248), (870, 242), (1023, 232)],
]
for pts in WATERLINES:
    xs, ys = zip(*pts)
    for x in range(xs[0], xs[-1] + 1):
        a[int(round(np.interp(x, xs, ys))):, x, 3] = 0
f = a[205:245, 520:771]
mn, mx = f[..., :3].min(2), f[..., :3].max(2)
f[(mn > 232) & (mx - mn < 24), 3] = 0
Image.fromarray(a).save('Sprites/Lungenfisch neu.png')
print('Sprites/Lungenfisch neu.png')
