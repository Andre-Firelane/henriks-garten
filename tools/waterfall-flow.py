# Wasserfall (Dschungel): aus dem ersten Bild von waterfall.png eine ruhige Animation machen. Die drei Bilder der
# Vorlage sind verschiedene Ausschnitte (Felsen und Wasserstrang springen hin und her, das Bild zappelt). Stattdessen
# bleibt alles wie im ersten Bild, nur der Wasserstrang wandert in FRAMES Schritten einmal ganz nach unten (rundum,
# oben kommt wieder herein, was unten verschwindet); der Schaum unten bleibt stehen.
# Aufruf (nach tools/hd-sprites.py bzw. npm run sprites): python tools/waterfall-flow.py
import numpy as np
from PIL import Image

FRAMES = 6  # Bilder der Animation (siehe GardenScene: Wasserfall)
FILES = ['public/assets/hd/waterfall.png', 'public/assets/hd2/waterfall.png', 'public/assets/waterfall.png']


def flow(path):
    a = np.asarray(Image.open(path).convert('RGBA')).copy()
    h, w = a.shape[:2]
    fw = round(h * 128 / 160)  # Bildbreite (Bilder 128 x 160); so lässt sich das Skript auch erneut ausführen
    frame = a[:, :fw].copy()
    f = frame.astype(int)
    op = f[..., 3] > 128
    blue = (f[..., 2] > f[..., 0] + 40) & op
    cols = np.nonzero(blue.sum(0) > h * 0.4)[0]
    x0, x1 = cols.min(), cols.max() + 1
    rows = np.nonzero(blue[:, x0:x1].sum(1) > (x1 - x0) * 0.5)[0]
    white = (f[..., 0] > 220) & (f[..., 1] > 220) & (f[..., 2] > 220) & op
    foam = np.nonzero(white[:, x0:x1].sum(1) > (x1 - x0) * 0.15)[0]
    # nur das Innere des Strangs wandert (oberer Rand mit dem hellen Wulst und der Schaum bleiben stehen)
    y0 = rows.min() + max(3, h // 25)
    y1 = foam.min() if len(foam) else rows.max()
    band = frame[y0:y1, x0:x1].astype(float)
    # nahtlos machen: das untere Stück wird über das obere geblendet, dann wiederholt sich das Muster ohne Kante
    n = y1 - y0
    k = n // 4
    period = n - k
    t = (np.arange(k) / k)[:, None, None]
    seamless = band[:period].copy()
    seamless[:k] = band[:k] * t + band[period:] * (1 - t)
    out = np.zeros((h, fw * FRAMES, 4), dtype=np.uint8)
    for i in range(FRAMES):
        img = frame.copy()
        shift = round(i * period / FRAMES)
        idx = (np.arange(n) - shift) % period
        img[y0:y1, x0:x1] = np.clip(seamless[idx], 0, 255).astype(np.uint8)
        out[:, i * fw:(i + 1) * fw] = img
    Image.fromarray(out, 'RGBA').save(path)
    print(f'{path}: {FRAMES} Bilder, Wasser x {x0}-{x1}, y {y0}-{y1}')


for p in FILES:
    flow(p)
