"""Schneemobil mit Anhänger (Schnellreise in der Eiswelt des Tierparks, Bild von Andre: Sprites/Schneemobil.webp vor
weißem Hintergrund) freistellen und wie das Zoo-Auto ablegen: public/assets/car_snow.png (240 × 140, gleiche Lage und
Größe wie car_zoo.png, damit Grundfläche und Einsteigen passen), dazu hd/ (4-fach) und hd2/ (2-fach) und als webp.
Der hellgraue gemalte Schatten unter dem Fahrzeug wird zu einem weichen, halb durchsichtigen dunklen Schatten.
Aufruf: python tools/snowmobile-cut.py   (braucht Pillow und numpy)
"""
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SRC = 'Sprites/Schneemobil.webp'
SMALL = 'public/assets/car_zoo.png'  # Vorlage für Lage und Größe
KEY = 'car_snow'

a = np.asarray(Image.open(SRC).convert('RGB')).astype(int)
H, W = a.shape[:2]
mn, mx = a.min(2), a.max(2)
neutral = (mx - mn <= 10) & (mn >= 185)  # Hintergrund und hellgrauer Schatten
bg = np.zeros((H, W), bool)
q = deque((x, y) for x in range(W) for y in (0, H - 1))
q.extend((x, y) for y in range(H) for x in (0, W - 1))
while q:
    x, y = q.popleft()
    if bg[y, x] or not neutral[y, x]:
        continue
    bg[y, x] = True
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < W and 0 <= ny < H and not bg[ny, nx]:
            q.append((nx, ny))
body = np.where(bg, 0, 255).astype(np.uint8)
body_m = Image.fromarray(body).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
rgba = Image.fromarray(a.astype(np.uint8), 'RGB').convert('RGBA')
rgba.putalpha(body_m)
# Schatten: wie dunkel der Hintergrund dort war (weiß = 0, hellgrau = etwas Schatten)
shade = np.clip((250 - mn) * 3.2, 0, 150) * bg
sh = Image.new('RGBA', (W, H), (24, 40, 56, 0))
sh.putalpha(Image.fromarray(shade.astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)))
full = Image.alpha_composite(sh, rgba)

small = Image.open(SMALL).convert('RGBA')
box = small.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox()  # Umriss des Autos
fbox = rgba.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox()  # Umriss des Schneemobils (ohne Schatten)
src = full.crop(fbox)
for factor, folder in ((1, ''), (4, 'hd/'), (2, 'hd2/')):
    w, h = (box[2] - box[0]) * factor, (box[3] - box[1]) * factor
    out = Image.new('RGBA', (small.width * factor, small.height * factor))
    out.alpha_composite(src.resize((w, h), Image.LANCZOS), (box[0] * factor, box[1] * factor))
    out.save(f'public/assets/{folder}{KEY}.png')
    out.save(f'public/assets/webp/{folder}{KEY}.webp', quality=92)
    print(folder or '1x', out.size)
