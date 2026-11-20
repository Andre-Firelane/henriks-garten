"""Safariauto (Sprites/Safariauto.webp, Bildschirmfoto: weiße Karte mit dunklem Rand) freistellen und in zwei Bilder fürs
Spiel teilen: safari_jeep_front (links im Bild, fährt nach unten links) und safari_jeep_back (rechts, fährt nach oben
rechts). Weißer Hintergrund und der gemalte graue Schatten fallen weg (den Schatten zeichnet das Spiel selbst, siehe
SafariCars.js). Beide Bilder gleich groß, das Auto unten mittig.
Aufruf: python tools/safari-jeep-cut.py   (braucht Pillow und numpy)"""
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SRC = 'Sprites/Safariauto.webp'
OUT = 'public/assets/{}.png'
CARD = (30, 18, 987, 322)  # weiße Karte im Bildschirmfoto (ohne den dunklen Rand)
WIDTH = 200  # so breit wird jedes Auto (im Spiel halb so groß gezeigt)

img = Image.open(SRC).convert('RGB').crop(CARD)
a = np.asarray(img).astype(int)
H, W = a.shape[:2]
mn, mx = a.min(2), a.max(2)
# Hintergrund: fast weiß oder hellgrau ohne Farbe (der Schatten), vom Rand aus erreichbar
cand = (mn >= 140) & (mx - mn <= 34)
bg = np.zeros((H, W), bool)
q = deque((x, y) for x in range(W) for y in (0, H - 1))
q.extend((x, y) for y in range(H) for x in (0, W - 1))
while q:
    x, y = q.popleft()
    if bg[y, x] or not cand[y, x]:
        continue
    bg[y, x] = True
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < W and 0 <= ny < H and not bg[ny, nx]:
            q.append((nx, ny))
alpha = np.where(bg, 0, 255).astype(np.uint8)
m = Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
out = Image.fromarray(a.astype(np.uint8), 'RGB').convert('RGBA')
out.putalpha(m)

# die beiden Autos: links und rechts der Mitte, je auf ihren Umriss beschnitten
half = W // 2
parts = {}
for name, box in (('safari_jeep_front', (0, 0, half, H)), ('safari_jeep_back', (half, 0, W, H))):
    p = out.crop(box)
    parts[name] = p.crop(p.getbbox())
k = WIDTH / max(p.width for p in parts.values())
cw = WIDTH
ch = round(max(p.height for p in parts.values()) * k)
for name, p in parts.items():
    p = p.resize((round(p.width * k), round(p.height * k)), Image.LANCZOS)
    canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    canvas.paste(p, ((cw - p.width) // 2, ch - p.height), p)
    canvas.save(OUT.format(name))
    print('ok', OUT.format(name), canvas.size)
