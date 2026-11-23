"""Aufruf: python tools/fruit-plate.py   (braucht Pillow und numpy)
Andres Obstteller (Sprites/Obstteller.png, schwarzer Hintergrund mit warmem Schein) ins Spiel bringen: freistellen,
zuschneiden und als fruit_plate in public/assets/ (Spielgröße 64 × 64, Fuß bei y 56), hd/ (4×) und hd2/ (2×) speichern.
Das Original kommt nach Sprites/Andre/fruit_plate.png. Danach: python tools/make-webp.py .

Freistellen: Der Schein wird zur Figur hin heller (bis etwa 100), die dunkle Umrandung der Figur ist wieder dunkler. Darum
zählt erst alles Helle (> 110) als Figur, dazu ein Rand so breit wie die Umrandung (11 Pixel); eingeschlossene Löcher
(Kerne der Melone) werden gefüllt, die Kante weich."""
import os
import shutil
import numpy as np
from PIL import Image, ImageFilter

A = 'public/assets'
SRC = 'Sprites/Obstteller.png'
GAME_W, GAME_H, FOOT = 64, 64, 56  # Leinwand und Fußpunkt im Spiel (wie der Platzhalter)
PLATE_W = 36  # so breit ist der Teller im Spiel

rgb = np.array(Image.open(SRC).convert('RGB')).astype(float)
bright = rgb.max(2) > 110
mask = Image.fromarray((bright * 255).astype(np.uint8))
mask = mask.filter(ImageFilter.MaxFilter(23))  # Umrandung dazu (11 Pixel nach außen)
# Löcher füllen: Flutfüllung des Hintergrunds von den Ecken aus, alles andere ist Figur
bg = mask.copy()
from PIL import ImageDraw
ImageDraw.floodfill(bg, (0, 0), 128)
m = np.array(bg)
alpha = np.where(m == 128, 0, 255).astype(np.uint8)
alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2)))
out = np.dstack([rgb.astype(np.uint8), alpha])
im = Image.fromarray(out, 'RGBA')
im = im.crop(im.getbbox())
k = PLATE_W / im.width
w, h = round(im.width * k), round(im.height * k)
os.makedirs('Sprites/Andre', exist_ok=True)
shutil.copyfile(SRC, 'Sprites/Andre/fruit_plate.png')
for sub, f in (('hd/', 4), ('hd2/', 2), ('', 1)):
    canvas = Image.new('RGBA', (GAME_W * f, GAME_H * f), (0, 0, 0, 0))
    part = im.resize((w * f, h * f), Image.LANCZOS)
    canvas.alpha_composite(part, ((GAME_W * f - part.width) // 2, FOOT * f - part.height))
    canvas.save(f'{A}/{sub}fruit_plate.png')
# Höhe der Tellerfläche über dem Fuß (für PLATE_H in src/animals/Butterfly.js): oberste Zeile, in der der Teller am
# breitesten ist
a = np.array(im.resize((w * 4, h * 4)))[:, :, 3] > 128
widths = a.sum(1)
top = int(np.argmax(widths))
print(f'Teller {w} × {h} im Spiel, Tellerfläche {(h * 4 - top) / 4:.0f} Pixel über dem Fuß')
