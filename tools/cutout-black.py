"""Generiertes Animations-Raster mit schwarzem Hintergrund freistellen (wie die Giraffe ohne Flecken).
Aufruf: python tools/cutout-black.py <Quelle.jpg/png> <Ziel.png> <Spalten> <Zeilen> <Anzahl>
Nur das von außen zusammenhängende Schwarz wird durchsichtig (dunkle Umrisse und Hufe bleiben), am Rand weich; je Zelle
bleibt nur das größte zusammenhängende Stück (Wasserzeichen, Krümel weg). Danach in tools/prepare-characters.js eintragen.

So entstanden (Giraffe2, Augen bei "läuft vorne" vorher angeglichen):
  python tools/cutout-black.py "Animation/Giraffe2 läuft vorne augen.png" Animation/Giraffe2_läuft_vorne.png 5 3 11
  python tools/cutout-black.py "Animation/Giraffe2 läuft hinten.jpg" Animation/Giraffe2_läuft_hinten.png 5 2 10
  python tools/cutout-black.py "Animation/Giraffe2 idle vorne.jpg" Animation/Giraffe2_idle_vorne.png 5 4 20
  python tools/cutout-black.py "Animation/Giraffe2 idle hinten.jpg" Animation/Giraffe2_idle_hinten.png 5 8 39
  python tools/cutout-black.py "Animation/Giraffe2 frisst vorne.jpg" Animation/Giraffe2_frisst_vorne.png 5 5 21
  python tools/cutout-black.py "Animation/Giraffe2 frisst hinten.jpg" Animation/Giraffe2_frisst_hinten.png 5 2 10"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
cols, rows, count = map(int, sys.argv[3:6])
rgb = np.array(Image.open(src).convert('RGB')).astype(float)
H, W, _ = rgb.shape
cw, ch = W / cols, H / rows
mx = rgb.max(2)

# Hintergrund: Flutfüllung von den Rändern aus über alles, was fast schwarz ist
m = Image.fromarray(np.where(mx < 22, 0, 255).astype(np.uint8)).copy()
for x in range(0, W, 16):
    for y in (0, H - 1):
        if m.getpixel((x, y)) == 0: ImageDraw.floodfill(m, (x, y), 128)
for y in range(0, H, 16):
    for x in (0, W - 1):
        if m.getpixel((x, y)) == 0: ImageDraw.floodfill(m, (x, y), 128)
bg = np.array(m) == 128
near = np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
edge = near & ~bg
a = np.where(bg, 0.0, 1.0)
a[edge] = np.clip((mx[edge] - 8) / 30, 0.25, 1)

# je Zelle nur das größte Stück
for i in range(count):
    c, r = i % cols, i // cols
    sl = (slice(int(r * ch), int((r + 1) * ch)), slice(int(c * cw), int((c + 1) * cw)))  # lückenlos aneinander
    fig = Image.fromarray(((a[sl] > 0) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).copy()
    arr, best, label = np.array(fig), None, 1
    while label < 250:
        ys, xs = np.where(arr == 255)
        if not len(xs): break
        ImageDraw.floodfill(fig, (int(xs[0]), int(ys[0])), label)
        arr = np.array(fig)
        size = (arr == label).sum()
        if best is None or size > best[0]: best = (size, label)
        label += 1
    if best: a[sl] = np.where(arr == best[1], a[sl], 0)
# leere Zellen hinter dem letzten Bild ganz durchsichtig
for i in range(count, cols * rows):
    c, r = i % cols, i // cols
    a[int(r * ch):int((r + 1) * ch), int(c * cw):int((c + 1) * cw)] = 0

# Farbe am Rand gegen Schwarz entmischen
col = np.where(a[..., None] > 0.01, np.clip(rgb / np.maximum(a[..., None], 0.01), 0, 255), 0)
col[~edge] = rgb[~edge]
img = Image.fromarray(np.dstack([col, a * 255]).astype(np.uint8), 'RGBA')
# glatte Zellgrößen (prepare-characters.js rechnet mit ganzen Zellen): rechts und unten durchsichtig auffüllen
full = Image.new('RGBA', (-(-W // cols) * cols, -(-H // rows) * rows))
full.paste(img, (0, 0))
full.save(out)
print(out, f'{count} Bilder')
