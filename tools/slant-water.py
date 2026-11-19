"""Aufruf: python tools/slant-water.py <Bild> <Rahmenbreite> <Steigung> [Richtungen]   (danach python tools/make-webp.py .)
Schneidet die Wasserkante eines fertigen "im Wasser"-Bilds (gerade abgeschnitten) nachträglich schräg im Iso-Winkel: das
vordere Ende des Tiers bleibt, wie es ist, zum hinteren Ende hin taucht es immer tiefer ein (die Kante steigt um
Steigung × Abstand), leicht nach unten gewölbt. Für Bilder ohne Einzelansichten (Nilpferd, Biber); neue Tiere schneidet
tools/static-sheet.py --schraeg gleich schräg.
Richtungen: je Rahmen +1 (vorne rechts, z. B. Blick nach unten rechts oder Rücken nach oben links) oder -1 (vorne links),
mit Komma; ohne Angabe: +1,-1,-1,+1 (unten-rechts, unten-links, oben-rechts, oben-links).
So entstanden: hippo_water und hippo2_water (64, 0.15), beaver_swim und beaver2_swim (80, 0.2, +1)."""
import sys
import numpy as np
from PIL import Image

path, fw, slope = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
dirs = [int(d) for d in sys.argv[4].split(',')] if len(sys.argv) > 4 else [1, -1, -1, 1]
a = np.array(Image.open(path).convert('RGBA'))
h, w = a.shape[:2]
for i in range(w // fw):
    f = a[:, i * fw:(i + 1) * fw]
    solid = f[..., 3] > 96
    cols = np.where(solid.any(0))[0]
    if not len(cols):
        continue
    bottom = max(np.where(solid[:, c])[0].max() for c in cols)  # gerade Kante bisher
    xl, xr = cols.min(), cols.max()
    d = dirs[i % len(dirs)]
    xs = np.arange(fw)
    behind = np.clip((xr - xs) if d > 0 else (xs - xl), 0, None)  # Abstand vom vorderen Ende
    u = np.clip((xs - (xl + xr) / 2) / max(1, (xr - xl) / 2), -1, 1)
    edge = bottom + 0.5 - slope * behind + slope * 0.12 * (xr - xl) / 2 * (1 - u * u)
    ys = np.arange(h)[:, None]
    keep = np.clip(edge[None, :] - ys + 0.5, 0, 1)
    f[..., 3] = (f[..., 3] * keep).astype(np.uint8)
Image.fromarray(a).save(path)
print(path, 'schräg', slope)
