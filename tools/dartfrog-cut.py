"""Pfeilgiftfrosch (Leuchtnacht im Dschungel): weißen Hintergrund und den gemalten blaugrauen Bodenschatten entfernen.
Aufruf: python tools/dartfrog-cut.py   (liest Sprites/Pfeilgiftfrosch.webp, schreibt Sprites/Pfeilgiftfrosch.png)"""
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

a = np.asarray(Image.open('Sprites/Pfeilgiftfrosch.webp').convert('RGB')).astype(int)
H, W = a.shape[:2]
mn, mx = a.min(2), a.max(2)
# Hintergrund: fast weiß; Schatten: hell und kaum gesättigt (der Frosch ist kräftig blau oder fast schwarz)
cand = ((mn >= 235) & (mx - mn <= 12)) | ((mn > 120) & (mx - mn < 45) & (mx < 250))
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
m = Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
out = Image.fromarray(a.astype(np.uint8), 'RGB').convert('RGBA')
out.putalpha(m)
out.save('Sprites/Pfeilgiftfrosch.png')
print('ok')
