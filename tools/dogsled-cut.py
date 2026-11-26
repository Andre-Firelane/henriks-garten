"""Hundeschlitten (Reittier Eiswelt) aus Andres Bild freistellen: Sprites/Hundeschlitten.webp (2 × 2 Ansichten auf Weiß,
oben zweimal nach unten links, unten nach oben rechts und oben links; hellblauer Schatten auf dem Schnee).

Weiß und der hellblaue Schatten verschwinden, soweit sie vom Rand aus erreichbar sind (das weiße Fell der Huskys ist
umrandet und bleibt). Ergebnis:
  Sprites/Hundeschlitten.png                    freigestellt (Quelle für npm run characters -> public/assets/ride_ice.png)
  Tiersprites Test/Charakter_Eis_Hundeschlitten_vorne.png / _hinten.png   einzelne Ansichten in voller Größe
Aufruf: python tools/dogsled-cut.py  (danach node tools/prepare-characters.js ride_ice.png)
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = 'Sprites/Hundeschlitten.webp'
OUT = 'Sprites/Hundeschlitten.png'
VIEWS = 'Tiersprites Test/Charakter_Eis_Hundeschlitten'

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
lab = Image.fromarray(np.where(bglike & ~bg, 255, 0).astype(np.uint8)).copy()
for y0 in range(0, H, 2):
    for x0 in range(0, W, 2):
        if lab.getpixel((x0, y0)) != 255: continue
        ImageDraw.floodfill(lab, (x0, y0), 100)
        arr = np.array(lab)
        comp = arr == 100
        c = rgb[comp].mean(0)
        if comp.sum() >= 60 and ((c[2] - c[0] >= 5) or (c.min() >= 225 and c[0] - c[2] <= 9)): bg |= comp
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
import sys
sys.setrecursionlimit(10000)
from collections import deque
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

# einzelne Ansichten: oben links (nach unten links = vorne), unten links (nach oben rechts = hinten)
for name, box in (('vorne', (0, 0, W // 2, H // 2)), ('hinten', (0, H // 2, W // 2, H))):
    part = img.crop(box)
    part.crop(part.getbbox()).save(f'{VIEWS}_{name}.png')

# Spritesheet public/assets/ride_ice.png: 4 Bilder (unten rechts, unten links, oben rechts, oben links wie FRAME in
# Player.js). Anders als bei den anderen Reittieren liegt der Fußpunkt nicht unter der Bildmitte, sondern unter Henrik
# (er steht hinten auf den Kufen): so sitzen Werkzeuge und Fangbereich bei ihm, die Hunde laufen voraus.
# ANCHOR: Boden unter Henriks Stiefeln in der Quelle (Stiefel auf dem Deck + Höhe der Kufen)
SCALE = 0.48  # Henrik (Kapuze bis Stiefel) etwa 104 hoch wie zu Fuß (108)
FRAME_W, FRAME_H, FEET_Y = 464, 230, 166  # FEET_Y/FRAME_H = Ursprung in Player.js
DECK = 30
views = {  # Bild: (Ausschnitt der Quelle, Anker, spiegeln)
    0: ((0, 0, W // 2, H // 2), (570, 230 + DECK), True),
    1: ((0, 0, W // 2, H // 2), (570, 230 + DECK), False),
    2: ((0, H // 2, W // 2, H), (172, 662 + DECK), False),
    3: ((W // 2, H // 2, W, H), (1192, 660 + DECK), False),
}
sheet = Image.new('RGBA', (FRAME_W * 4, FRAME_H))
for i, (box, (ax, ay), flip) in views.items():
    part = img.crop(box)
    bx0, by0, bx1, by1 = part.getbbox()
    part = part.crop((bx0, by0, bx1, by1))
    ax, ay = ax - box[0] - bx0, ay - box[1] - by0
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
