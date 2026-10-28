"""Gehweg im Tierpark (park_path): Verbundpflaster, gezeichnet statt aus der KI-Vorlage (die war treppig/pixelig).
Aufruf: python tools/park-path.py <Ausgabe.png>   (wird von tools/hd-sprites.py mit aufgerufen)
Nahtlos: jeder Pixel wird in Kachelkoordinaten (u, v) umgerechnet, das Muster wiederholt sich in u und v."""
import numpy as np, sys
from PIL import Image
F = 4; W, H = 64 * F, 32 * F; SS = 3
ROWS, COLS = 4, 2            # Steinreihen (entlang v) und Steine je Reihe (entlang u), Reihen um einen halben Stein versetzt
GROUT = 1.0 * F               # Fugenbreite in Pixeln
RADIUS = 1.0 * F              # Eckenrundung
STONE = np.array([200, 182, 158]); GROUT_C = np.array([150, 128, 110])
rng = np.random.default_rng(7)
tint = rng.uniform(-12, 12, (ROWS, COLS))       # jeder Stein etwas heller oder dunkler
warm = rng.uniform(-5, 5, (ROWS, COLS))
ys, xs = np.mgrid[0:H * SS, 0:W * SS] / SS
u = (ys / (H / 2) + (xs - W / 2) / (W / 2)) / 2
v = (ys / (H / 2) - (xs - W / 2) / (W / 2)) / 2
edge = np.hypot(W / 2, H / 2)  # Länge einer Kachelkante in Pixeln
row = np.floor(np.mod(v, 1) * ROWS).astype(int) % ROWS
uu = np.mod(u + (row % 2) * 0.5 / COLS, 1)
col = np.floor(uu * COLS).astype(int) % COLS
lu = (uu * COLS - col - 0.5) * edge / COLS     # Lage im Stein (Pixel), Mitte = 0
lv = (np.mod(v, 1) * ROWS - row - 0.5) * edge / ROWS
hu, hv = edge / COLS / 2 - GROUT / 2, edge / ROWS / 2 - GROUT / 2
qx, qy = np.abs(lu) - (hu - RADIUS), np.abs(lv) - (hv - RADIUS)
sdf = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - RADIUS  # <0: im Stein
inside = np.clip(-sdf / 1.2 + 0.5, 0, 1)
# Licht von oben links: Kante oben/links heller, unten/rechts dunkler
bevel = np.clip(1 + sdf / (1.6 * F), 0, 1) * np.clip(-sdf, 0, 1)
light = -(lu / hu + lv / hv) / 2               # -1..1 über den Stein
shade = 1 + 0.04 * light + bevel * 0.07 * np.sign(-(lu + lv))
noise = np.repeat(np.repeat(rng.normal(0, 1, (H * SS // 6 + 1, W * SS // 6 + 1)), 6, 0), 6, 1)[:H * SS, :W * SS]
stone = (STONE + tint[row, col][..., None] + np.stack([warm[row, col], 0 * warm[row, col], -warm[row, col]], -1)) * shade[..., None] + noise[..., None] * 3
img = stone * inside[..., None] + GROUT_C * (1 - inside[..., None])
d = np.abs(xs + 0.5 - W / 2) / (W / 2) + np.abs(ys + 0.5 - H / 2) / (H / 2)
alpha = np.clip((1.04 - d) * W / 2, 0, 1) * 255
out = np.dstack([np.clip(img, 0, 255), alpha]).reshape(H, SS, W, SS, 4).mean((1, 3))
Image.fromarray(out.round().astype(np.uint8), 'RGBA').save(sys.argv[1])
