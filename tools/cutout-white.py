"""Weiße Figur vor reinweißem Hintergrund freistellen: nur neutral-weiße Pixel (der Hintergrund ist exakt grau-neutral,
das Fell leicht warm getönt), die vom Rand aus erreichbar sind. Kanten bekommen weiche Übergänge.
Aufruf: python tools/cutout-white.py "public/assets/Katze2.jpg" "Sprites/Katze2 neu.png"   (braucht Pillow und numpy)"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGB')).astype(int)
H, W = a.shape[:2]
mn, mx = a.min(2), a.max(2)
cand = (mn >= 249) & (mx - mn <= 4)
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
# kleine Inseln (JPEG-Rauschen) entfernen, Kante leicht weich
m = Image.fromarray(alpha).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
out = Image.fromarray(a.astype(np.uint8), 'RGB').convert('RGBA')
out.putalpha(m)
out.save(dst)
print('ok', dst)
