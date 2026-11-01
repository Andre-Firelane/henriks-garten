# Gorilla: die gemalten Bodeninseln (Moos, Erde, Blätter, Steinchen) unter den Figuren entfernen (nach npm run cutout).
# Von außen her wird alles weggenommen, was grünlich oder hell-warm (Erde) ist; die Gorillas selbst sind dunkelbraun bzw.
# kühl grau und bleiben stehen. Danach fallen kleine, abgetrennte Reste (Steinchen, Blattränder) weg.
# Aufruf: python tools/gorilla-cut.py   (liest und schreibt Sprites/Gorilla.png)
import numpy as np
from PIL import Image
from collections import deque

FEET_ZONE = 320  # unterhalb dieser Zeile (im Bild) liegt der graue Schatten der Bodeninseln

im = np.asarray(Image.open('Sprites/Gorilla.png').convert('RGBA')).copy()
H, W = im.shape[:2]
r, g, b, a = [im[..., i].astype(int) for i in range(4)]
lum = (r + g + b) / 3
green = (g > r + 3) & (g >= b - 4)
earth = (lum > 105) & (r >= b + 2)
# grauer Schatten unten auf der Bodeninsel (die Gorillas haben dort eine dunkle Umrisslinie, die Füllung stoppt daran)
ys = np.arange(H)[:, None]
shadow = (abs(r - b) < 12) & (abs(g - r) < 12) & (lum > 60) & (lum < 200) & (ys > FEET_ZONE)
cand = (green | earth | shadow) & (a > 0)
gone = a == 0
q = deque(zip(*np.nonzero(gone)))
seen = gone.copy()
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and cand[ny, nx]:
            seen[ny, nx] = True
            q.append((ny, nx))
im[seen, 3] = 0
# eingeschlossene weiße Reste des Hintergrunds (zwischen Armen und Beinen)
im[(lum > 232) & (abs(r - b) < 14) & (np.arange(H)[:, None] > 280), 3] = 0  # (die Lichtpunkte in den Augen bleiben)
# kleine Inseln entfernen
alive = im[..., 3] > 0
lab = np.zeros((H, W), int)
sizes = [0]
n = 0
for sy, sx in zip(*np.nonzero(alive)):
    if lab[sy, sx]:
        continue
    n += 1
    cnt = 0
    q = deque([(sy, sx)])
    lab[sy, sx] = n
    while q:
        y, x = q.popleft()
        cnt += 1
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and alive[ny, nx] and not lab[ny, nx]:
                lab[ny, nx] = n
                q.append((ny, nx))
    sizes.append(cnt)
sizes = np.array(sizes)
small = sizes[lab] < 3000
im[alive & small, 3] = 0
Image.fromarray(im, 'RGBA').save('Sprites/Gorilla.png')
print('ok')
