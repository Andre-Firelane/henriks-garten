# Werkzeug-Bild „Fisch“ für die Robben in der Eiswelt (public/assets/herring.png, 64 x 64 wie die anderen Gegenstände,
# halb so groß angezeigt): der obere der beiden Fische aus Sprites/Fisch Icon.png (freigestellt mit npm run cutout).
# Aufruf: python tools/ice-items.py
from collections import deque

import numpy as np
from PIL import Image

SIZE = 64
im = Image.open('Sprites/Fisch Icon.png').convert('RGBA')
arr = np.asarray(im).copy()
a = arr[..., 3] > 20
H, W = a.shape
# zusammenhängende Teile: die beiden Fische sind die größten, der obere ist der erste
label = np.zeros((H, W), int)
sizes = [0]
for y0, x0 in zip(*np.nonzero(a)):
    if label[y0, x0]:
        continue
    n = len(sizes)
    label[y0, x0] = n
    todo, k = deque([(y0, x0)]), 0
    while todo:
        y, x = todo.popleft()
        k += 1
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < H and 0 <= nx < W and a[ny, nx] and not label[ny, nx]:
                label[ny, nx] = n
                todo.append((ny, nx))
    sizes.append(k)
fishes = sorted(range(1, len(sizes)), key=lambda i: -sizes[i])[:2]
top = min(fishes, key=lambda i: np.nonzero(label == i)[0].min())
arr[..., 3] = np.where(label == top, arr[..., 3], 0)
fish = Image.fromarray(arr)
fish = fish.crop(fish.getbbox())
f = (SIZE - 4) / max(fish.size)
fish = fish.resize((round(fish.width * f), round(fish.height * f)), Image.LANCZOS)
out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
out.alpha_composite(fish, ((SIZE - fish.width) // 2, (SIZE - fish.height) // 2))
out.save('public/assets/herring.png')
print('public/assets/herring.png', out.size)
