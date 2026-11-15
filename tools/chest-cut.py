"""Schatztruhe (Kisten mit Karten, siehe src/world/LuckWorld.js) vor Grün freistellen: aus public/assets/Schatztruhe.webp
(4 Ansichten nebeneinander) die beiden mit dem Schloss nach vorn als treasure_chest0/1 (PNG und WebP). Grün und der grüne
Schlagschatten werden durchsichtig (den Schatten zeichnet das Spiel selbst), grüner Saum an den Kanten wird entfärbt.
Aufruf: python tools/chest-cut.py   (braucht Pillow und numpy)"""
import numpy as np
from PIL import Image

H_OUT = 96  # Höhe im Spiel: doppelt so groß gezeichnet (Anzeige halb so groß)
src = np.asarray(Image.open('public/assets/Schatztruhe.webp').convert('RGB')).astype(int)
r, g, b = src[..., 0], src[..., 1], src[..., 2]
green = (g > r + 25) & (g > b + 25)
alpha = np.where(green, 0, 255).astype(np.uint8)
rgb = src.copy()
rgb[..., 1] = np.minimum(g, np.maximum(r, b) + 10)  # grünen Saum entfärben
img = Image.fromarray(rgb.astype(np.uint8), 'RGB').convert('RGBA')
img.putalpha(Image.fromarray(alpha))
for i, (x0, x1) in enumerate([(0, 270), (270, 520)]):
    part = img.crop((x0, 0, x1, img.height))
    part = part.crop(part.getbbox())
    w = round(part.width * H_OUT / part.height)
    part = part.resize((w, H_OUT), Image.LANCZOS)
    part.save(f'public/assets/treasure_chest{i}.png')
    part.save(f'public/assets/webp/treasure_chest{i}.webp', quality=90)
    print(f'treasure_chest{i}', part.size)
