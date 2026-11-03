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

def coeffs(dst, src):
    # Koeffizienten für Image.PERSPECTIVE: bildet Ausgabe-Punkte (dst) auf Quell-Punkte (src) ab
    A, b = [], []
    for (x, y), (u, v) in zip(dst, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        b += [u, v]
    return np.linalg.solve(np.array(A, float), np.array(b, float)).tolist()

def iso_bed(key, empty, sleep, src_feet, feet):
    # Himmelbett aufs Iso-Raster ziehen (gespiegelt): eine Verformung, bei der senkrechte Linien senkrecht bleiben (die
    # Pfosten kippen nicht), so gewählt, dass die vier Bettfüße möglichst genau auf den Bodenpunkten (feet, Welt-Pixel um
    # die Mitte der Bett-Kachel) landen. Gibt Größe und Ankerpunkt (Kachelmitte als Bruchteil des Bilds) aus.
    S = np.array(src_feet, float)
    D = np.array(feet, float)
    Sc, Dc = S - S.mean(0), D - D.mean(0)
    # x' = a*x ; y' = c*x + k*y (kleinste Quadrate)
    a = (Sc[:, 0] @ Dc[:, 0]) / (Sc[:, 0] @ Sc[:, 0])
    (c, k), *_ = np.linalg.lstsq(Sc, Dc[:, 1], rcond=None)
    M = np.array([[a, 0], [c, k]])
    print(key, 'Füße landen bei', np.round(Sc @ M.T + D.mean(0), 1).tolist())
    src_box = np.array([[0, 0], [1024, 0], [1024, 572], [0, 572]], float)
    # Ausdehnung des Ergebnisses aus dem sichtbaren Teil der Quelle
    bb = empty.getchannel('A').getbbox()
    vis = np.array([[1024 - bb[2], bb[1]], [1024 - bb[0], bb[1]], [1024 - bb[0], bb[3]], [1024 - bb[2], bb[3]]], float)
    w = (vis - S.mean(0)) @ M.T + D.mean(0)
    xmin, ymin = np.floor(w.min(0)) - 2
    xmax, ymax = np.ceil(w.max(0)) + 2
    Mi = np.linalg.inv(M)
    for f, d in ((1, 'public/assets'), (4, 'public/assets/hd'), (2, 'public/assets/hd2')):
        W, H = int((xmax - xmin) * f), int((ymax - ymin) * f)
        # Ausgabe-Pixel (X, Y) -> Welt (X/f + xmin, Y/f + ymin) -> Quelle
        A = Mi / f
        off = S.mean(0) + Mi @ (np.array([xmin, ymin]) - D.mean(0))
        coef = (A[0, 0], A[0, 1], off[0], A[1, 0], A[1, 1], off[1])
        for suffix, im in (('', empty), ('_sleep', sleep)):
            im.transpose(Image.FLIP_LEFT_RIGHT).transform((W, H), Image.AFFINE, coef, Image.BICUBIC).save(f'{d}/{key}{suffix}.png')
    print(key, [int(xmax - xmin), int(ymax - ymin)], 'Anker', round(-xmin / (xmax - xmin), 4), round(-ymin / (ymax - ymin), 4))

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

# Himmelbett: gespiegelt, damit es längs an der Wand gegenüber der Tür steht (Kopfende hinten); Füße in der Quelle nach
# dem Spiegeln: Kopfende an der Wand, Kopfende vorne, Fußende an der Wand, Fußende vorne. Ziel: 0,85 x 1,7 Kacheln,
# an die Wand (tx - 0,45) und hinten bis ty - 0,4 (in Welt-Pixeln: x = (a - b) * 32, y = (a + b) * 16)
iso = lambda a, b: ((a - b) * 32, (a + b) * 16)
bed_empty = clear_white('Sprites/Bett Savanne.png')
bed_sleep = clear_white('Sprites/Bett Savanne schläft.png')
bed_sleep.paste(bed_empty.crop((465, 195, 540, 258)), (465, 195))  # gemaltes „zzz“ weg (gespiegelt sähe es aus wie „sss“; die Zs steigen im Spiel auf)
iso_bed('hut_bed_savanna', bed_empty, bed_sleep,
        [(1024 - 464, 325), (1024 - 225, 435), (1024 - 812, 445), (1024 - 573, 555)],
        [iso(-0.45, -0.4), iso(0.4, -0.4), iso(-0.45, 1.3), iso(0.4, 1.3)])
save('hut_bed_jungle', hammock('Sprites/Bet Dschungel.png'), hammock('Sprites/Bett Dchnungel schläft.png'), 100)
def flat_bed(key, empty, sleep, src_feet, center, scale, head, angle=0, mirror=True):
    # Bett, das schon schräg gemalt ist (Stockbett): höchstens gespiegelt (mirror), um angle Grad gedreht (um die Mitte der
    # Füße; wie in Bildprogrammen: negativ = gegen den Uhrzeigersinn) und gleichmäßig verkleinert, nicht verzerrt. Die Mitte der vier Bettfüße (src_feet, nach dem
    # Spiegeln) landet bei center (Welt-Pixel um die Mitte der Bett-Kachel).
    # Gibt Größe, Ankerpunkt (Kachelmitte als Bruchteil des Bilds) und die Lage des Kopfkissens (head) im Spiel aus.
    fx, fy = np.array(src_feet, float).mean(0)
    flip = lambda im: im.transpose(Image.FLIP_LEFT_RIGHT) if mirror else im
    empty, sleep = (flip(im).rotate(-angle, Image.BICUBIC, center=(fx, fy)) for im in (empty, sleep))
    t = np.radians(-angle)  # das Kopfkissen dreht mit (Bildkoordinaten: y nach unten)
    hx, hy = head[0] - fx, head[1] - fy
    head = (fx + hx * np.cos(t) + hy * np.sin(t), fy - hx * np.sin(t) + hy * np.cos(t))
    b1, b2 = empty.getchannel('A').getbbox(), sleep.getchannel('A').getbbox()
    box = (min(b1[0], b2[0]), min(b1[1], b2[1]), max(b1[2], b2[2]), max(b1[3], b2[3]))
    w, h = (box[2] - box[0]) * scale, (box[3] - box[1]) * scale
    ox, oy = (fx - box[0]) * scale - center[0], (fy - box[1]) * scale - center[1]  # Kachelmitte im Bild
    for f, d in ((1, 'public/assets'), (4, 'public/assets/hd'), (2, 'public/assets/hd2')):
        for suffix, im in (('', empty), ('_sleep', sleep)):
            im.crop(box).resize((round(w * f), round(h * f)), Image.LANCZOS).save(f'{d}/{key}{suffix}.png')
    print(key, [round(w), round(h)], 'Anker', round(ox / w, 4), round(oy / h, 4),
          'Kopf', [round((head[0] - fx) * scale + center[0]), round((head[1] - fy) * scale + center[1])])

# Stockbett der Forschungsstation (Eiswelt): schon in der richtigen Perspektive gemalt (Kopfende hinten rechts, längs an
# der Wand gegenüber der Tür), daher weder gespiegelt noch gedreht oder verzerrt, nur verkleinert. Füße in der Quelle (der
# hintere links ist verdeckt: aus den drei anderen ergänzt); ihre Mitte kommt dorthin, wo beim Himmelbett die Mitte der
# Grundfläche liegt
foot = np.array([iso(-0.45, -0.4), iso(0.4, -0.4), iso(-0.45, 1.3), iso(0.4, 1.3)]).mean(0)
flat_bed('hut_bed_ice', clear_white('Sprites/Bett Eis.png'), clear_white('Sprites/Bett Eis schläft.png'),
         [(420, 700), (175, 600), (805, 520), (560, 420)], foot, 0.129, (660, 405), mirror=False)
