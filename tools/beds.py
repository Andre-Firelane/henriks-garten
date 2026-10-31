"""Aufruf: python tools/beds.py   (braucht Pillow und numpy)
Betten in den Hütten (Savanne: Himmelbett, Dschungel: Hängematte), je leer und mit dem schlafenden Henrik (_sleep).
Quellen freigestellt mit npm run cutout; beim Himmelbett ist der weiße Hintergrund zwischen den Vorhängen entfernt, bei der Hängematte sind die beiden Bäume, die Äste, Pflanzen und der Rucksack
weggeschnitten (nur die Hängematte mit Seilen bleibt). Beide Fassungen eines Betts bekommen denselben Ausschnitt, damit
sie beim Einschlafen genau übereinanderliegen. Ausgabe: public/assets (Breite W), hd (4-fach), hd2 (2-fach, Handy)."""
from collections import deque
import numpy as np
from PIL import Image

def hammock(path):
    a = np.asarray(Image.open(path).convert('RGBA')).copy()
    H, W = a.shape[:2]
    yy, xx = np.mgrid[:H, :W]
    a[:, :226, 3] = 0  # linker Baum
    a[:, 836:, 3] = 0  # rechter Baum
    a[:125, :, 3] = 0  # Äste oben
    a[300:, 800:, 3] = 0  # Rucksack und Stammfuß rechts
    a[:170, 815:, 3] = 0  # Astrest oben rechts
    a[(xx < 330) & (yy > 334 + (xx - 246) * 0.56), 3] = 0  # Pflanzkorb und Wurzel links (unter der Hängematte)
    a[290:, :246, 3] = 0
    a[480:, 700:, 3] = 0  # Wurzel rechts unten
    c = a[..., :3].astype(int)
    a[(c.min(2) > 225) & (a[..., 3] > 0), 3] = 0  # weiße Reste zwischen den Seilen
    return keep_big(a)

def keep_big(a):
    H, W = a.shape[:2]
    m = a[..., 3] > 24
    lab = np.zeros((H, W), int); sizes = [0]
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]: continue
        n = len(sizes); lab[y0, x0] = n; q = deque([(y0, x0)]); k = 0
        while q:
            y, x = q.popleft(); k += 1
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; q.append((ny, nx))
        sizes.append(k)
    keep = [i for i, s in enumerate(sizes) if i and s >= 0.02 * max(sizes)]
    a[~np.isin(lab, keep)] = 0
    return Image.fromarray(a, 'RGBA')

def clear_white(path, thr=245, min_area=50):
    # weißer Hintergrund, der zwischen Vorhängen und Pfosten eingeschlossen ist (die cremefarbenen Vorhänge bleiben)
    a = np.asarray(Image.open(path).convert('RGBA')).copy()
    H, W = a.shape[:2]
    c = a[..., :3].astype(int)
    w = (c.min(2) > thr) & (a[..., 3] > 0)
    seen = np.zeros_like(w)
    for y0, x0 in zip(*np.nonzero(w)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; reg = []
        while q:
            y, x = q.popleft(); reg.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < H and 0 <= nx < W and w[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if len(reg) >= min_area:
            ys, xs = zip(*reg); a[ys, xs, 3] = 0
    return Image.fromarray(a, 'RGBA')

def save(key, empty, sleep, width):
    box = np.array(empty.getchannel('A').getbbox())
    b2 = np.array(sleep.getchannel('A').getbbox())
    box = (min(box[0], b2[0]), min(box[1], b2[1]), max(box[2], b2[2]), max(box[3], b2[3]))
    for suffix, im in (('', empty), ('_sleep', sleep)):
        im = im.crop(box)
        h = round(im.height * width / im.width)
        for d, f in (('public/assets', 1), ('public/assets/hd', 4), ('public/assets/hd2', 2)):
            im.resize((width * f, h * f), Image.LANCZOS).save(f'{d}/{key}{suffix}.png')
    print(key, width, h)

save('hut_bed_savanna', clear_white('Sprites/Bett Savanne.png'), clear_white('Sprites/Bett Savanne schläft.png'), 104)
save('hut_bed_jungle', hammock('Sprites/Bet Dschungel.png'), hammock('Sprites/Bett Dchnungel schläft.png'), 100)
