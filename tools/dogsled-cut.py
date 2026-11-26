"""Hundeschlitten (Reittier Eiswelt) aus Andres Bild freistellen: Sprites/Hundeschlitten.webp (2 × 2 Ansichten auf Weiß,
oben zweimal nach unten links, unten nach oben rechts und oben links; hellblauer Schatten auf dem Schnee).

Weiß und der hellblaue Schatten verschwinden, soweit sie vom Rand aus erreichbar sind (das weiße Fell der Huskys ist
umrandet und bleibt). Ergebnis:
  Sprites/Hundeschlitten.png                    freigestellt (Quelle für npm run characters -> public/assets/ride_ice.png)
  Tiersprites Test/Charakter_Eis_Hundeschlitten_vorne.png / _hinten.png   einzelne Ansichten in voller Größe
Aufruf: python tools/dogsled-cut.py  (danach python tools/make-webp.py .)
        python tools/dogsled-cut.py idle   stehender Schlitten, Hunde liegen (Sprites/Hundeschlitten idle.webp): nur
        freistellen und nach Tiersprites Test/Charakter_Eis_Hundeschlitten_idle_vorne/_hinten.png, noch kein Spritesheet
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

VARIANT = sys.argv[1] if len(sys.argv) > 1 else ''
NAME = f'Hundeschlitten {VARIANT}' if VARIANT else 'Hundeschlitten'
SRC = f'Sprites/{NAME}.webp'
OUT = f'Sprites/{NAME}.png'
VIEWS = 'Tiersprites Test/Charakter_Eis_Hundeschlitten' + (f'_{VARIANT}' if VARIANT else '')

rgb = np.array(Image.open(SRC).convert('RGB')).astype(int)
H, W, _ = rgb.shape
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
mn = rgb.min(2)
white = mn > 228
shadow = (b - r >= 12) & (b - r <= 60) & (r > 150) & (b > 190)  # hellblauer Schatten (um 181, 199, 212)
bglike = white | shadow

m = Image.fromarray(np.where(bglike, 0, 255).astype(np.uint8)).copy()
for x in range(0, W, 4):
    for y in (0, H - 1):
        if m.getpixel((x, y)) == 0: ImageDraw.floodfill(m, (x, y), 128)
for y in range(0, H, 4):
    for x in (0, W - 1):
        if m.getpixel((x, y)) == 0: ImageDraw.floodfill(m, (x, y), 128)
# Weißinseln im Schatten (Lichtflecken) gehören auch zum Hintergrund: mehrfach nachfluten, solange sie am Hintergrund liegen
bg = np.array(m) == 128
for _ in range(3):
    grown = np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    bg = bg | (grown & bglike)

# eingeschlossene Lücken (zwischen Zugleinen, unter den Kufen, zwischen den Beinen): hellblauer Schatten oder reines
# Weiß; das Fell der Huskys ist wärmer (um 248, 240, 232) und bleibt
# Bereiche des Schlittens samt Henrik in der Quelle (x0, y0, x1, y1), je Viertel; die Hunde liegen außerhalb
SLED = [(390, 0, 688, 300), (1030, 0, 1376, 300), (0, 560, 390, 768), (1060, 540, 1376, 768)]
lab = Image.fromarray(np.where(bglike & ~bg, 255, 0).astype(np.uint8)).copy()
for y0 in range(0, H, 2):
    for x0 in range(0, W, 2):
        if lab.getpixel((x0, y0)) != 255: continue
        ImageDraw.floodfill(lab, (x0, y0), 100)
        arr = np.array(lab)
        comp = arr == 100
        c = rgb[comp].mean(0)
        n = comp.sum()
        if n >= 60 and ((c[2] - c[0] >= 5) or (c.min() >= 225 and c[0] - c[2] <= 9)): bg |= comp
        # rosa getöntes Weiß (das Holz spiegelt sich, z. B. unter der Sitzfläche): nur im Bereich des Schlittens, denn das
        # weiße Fell der Huskys hat stellenweise denselben Ton
        elif n >= 20 and c.min() >= 215 and c[1] - c[2] <= 4 and c[0] - c[1] >= 6:
            yy, xx = np.nonzero(comp)
            if any(x0_ <= xx.mean() < x1_ and y0_ <= yy.mean() < y1_ for x0_, y0_, x1_, y1_ in SLED): bg |= comp
        lab.paste(1, mask=Image.fromarray((comp * 255).astype(np.uint8)))

# Kanten weich: Pixel am Hintergrund werden je nach Helligkeit durchsichtig
alpha = np.where(bg, 0, 255).astype(float)
edge = (np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0) & ~bg
light = mn.astype(float)
alpha[edge] = np.clip((250 - light[edge]) / 90, 0.25, 1) * 255

# kleine Krümel (Schneebrocken, Reste) entfernen: nur große zusammenhängende Teile behalten
solid = Image.fromarray((alpha > 40).astype(np.uint8) * 255)
lab = np.array(solid)
keep = np.zeros_like(lab, dtype=bool)
seen = np.zeros_like(lab, dtype=bool)
ys, xs = np.nonzero(lab)
for y0, x0 in zip(ys, xs):
    if seen[y0, x0]: continue
    q = deque([(y0, x0)]); seen[y0, x0] = True; comp = []
    while q:
        y, x = q.popleft(); comp.append((y, x))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and lab[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    if len(comp) > 400:
        for y, x in comp: keep[y, x] = True
alpha[~keep] = 0

# der gemalte Schatten bleibt als halb durchsichtiges Blaugrau (auf Weiß sähe er aus wie im Bild); das Spiel zeichnet
# unter dem Schlitten keinen eigenen Schatten (MOUNT_SHADOW in src/player/Player.js)
SHADOW = np.array([40, 60, 95])
sh = bg & (rgb[..., 2] >= rgb[..., 0] - 3)
sh_alpha = np.where(sh, np.clip((250 - mn) / (250 - SHADOW.min()), 0, 1) * 255, 0)
sh_alpha[sh_alpha < 12] = 0
col = np.where((alpha > 0)[..., None], rgb, SHADOW)
alpha = np.maximum(alpha, sh_alpha)

out = np.dstack([col, alpha]).astype(np.uint8)
img = Image.fromarray(out, 'RGBA')
img.save(OUT)

# Ansichten nicht starr an der Bildmitte trennen (Pfoten und Schatten reichen darüber): jedes zusammenhängende Teil
# gehört zu dem Viertel, in dem seine Mitte liegt (0 oben links, 1 oben rechts, 2 unten links, 3 unten rechts)
quad = np.full((H, W), -1, dtype=np.int8)
solid = alpha > 0
seen = np.zeros_like(solid)
for y0, x0 in zip(*np.nonzero(solid)):
    if seen[y0, x0]: continue
    q = deque([(y0, x0)]); seen[y0, x0] = True; comp = []
    while q:
        y, x = q.popleft(); comp.append((y, x))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and solid[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    cy, cx = np.mean(comp, axis=0)
    ys_, xs_ = zip(*comp)
    quad[list(ys_), list(xs_)] = (cy >= H / 2) * 2 + (cx >= W / 2)

def view(q):
    v = out.copy()
    v[quad != q, 3] = 0
    v = Image.fromarray(v, 'RGBA')
    return v.crop(v.getbbox()), v.getbbox()

# einzelne Ansichten: oben links (nach unten links = vorne), unten links (nach oben rechts = hinten)
for name, q in (('vorne', 0), ('hinten', 2)):
    view(q)[0].save(f'{VIEWS}_{name}.png')
if VARIANT:
    print('fertig', OUT, 'und', VIEWS + '_vorne/_hinten.png')
    sys.exit()

# Spritesheet public/assets/ride_ice.png: 4 Bilder (unten rechts, unten links, oben rechts, oben links wie FRAME in
# Player.js). Anders als bei den anderen Reittieren liegt der Fußpunkt nicht unter der Bildmitte, sondern unter Henrik
# (er steht hinten auf den Kufen): so sitzen Werkzeuge und Fangbereich bei ihm, die Hunde laufen voraus.
# ANCHOR: Boden unter Henriks Stiefeln in der Quelle (Stiefel auf dem Deck + Höhe der Kufen)
SCALE = 0.48  # Henrik (Kapuze bis Stiefel) etwa 104 hoch wie zu Fuß (108)
FRAME_W, FRAME_H, FEET_Y = 464, 250, 186  # FEET_Y/FRAME_H = Ursprung in Player.js
DECK = 30
views = {  # Bild: (Viertel der Quelle, Anker, spiegeln)
    0: (0, (570, 230 + DECK), True),
    1: (0, (570, 230 + DECK), False),
    2: (2, (172, 662 + DECK), False),
    3: (3, (1192, 660 + DECK), False),
}
sheet = Image.new('RGBA', (FRAME_W * 4, FRAME_H))
for i, (qi, (ax, ay), flip) in views.items():
    part, (bx0, by0, _, _) = view(qi)
    ax, ay = ax - bx0, ay - by0
    part = part.resize((round(part.width * SCALE), round(part.height * SCALE)), Image.LANCZOS)
    ax, ay = ax * SCALE, ay * SCALE
    if flip:
        part = part.transpose(Image.FLIP_LEFT_RIGHT)
        ax = part.width - ax
    x, y = round(i * FRAME_W + FRAME_W / 2 - ax), round(FEET_Y - ay)
    if x < i * FRAME_W or x + part.width > (i + 1) * FRAME_W or y < 0 or y + part.height > FRAME_H:
        print(f'Bild {i} ragt aus dem Frame: x {x - i * FRAME_W}..{x - i * FRAME_W + part.width}, y {y}..{y + part.height}')
    sheet.alpha_composite(part, (x, y))
sheet.save('public/assets/ride_ice.png')
print('fertig', OUT, 'und public/assets/ride_ice.png')
