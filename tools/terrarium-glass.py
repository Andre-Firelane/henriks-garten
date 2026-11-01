# Glaswände im Reptilienhaus und im Aquarium, neu gezeichnet: durchgehende schmale Rahmen oben und unten, die an den
# Kachelgrenzen nahtlos aneinanderstoßen (die Bilder benachbarter Kacheln überlappen sich mit genau denselben Linien),
# dazwischen durchsichtiges Glas. Für jede Wand die große Fassung (hd/), die Handy-Fassung (hd2/) und die kleine (assets/).
#   hutwall_terrarium_*: große Glasterrarien (Schlangen, Leguane), dunkler Rahmen
#   hutwall_terrarium_raised_*: Spinnen-Terrarium auf einem Sockel (unten RAISE hoch Holz, darüber Glas); _back: die
#     hinteren Scheiben ohne Sockel, das Spiel zeichnet sie um RAISE höher (siehe addFence)
#   hutwall_tank_*: Wassertanks (Piranha-Becken, Aquarium), blauer Rahmen
# Dazu je ein Eckpfosten. Außerdem der Boden der Halle (floor_reptiles): 3×3 Platten je Kachel, die Fugen laufen über die
# Kachelränder weiter.
# Aufruf (nach tools/hd-sprites.py bzw. npm run sprites, die die alten Bilder schreiben): python tools/terrarium-glass.py
# RAISE muss zu raise des Spinnen-Terrariums in src/world/levels.js passen.
import numpy as np
from PIL import Image

HD = 4  # Faktor der großen Fassung
W = 64 * HD  # Bildbreite (eine Kachel)
RAISE = 28  # Höhe des Sockels (Welt-Pixel)
X0, X1 = 56, 200  # waagerechte Ausdehnung einer Wand (große Fassung), wie bisher; Nachbarn überlappen sich
PANE_X0, PANE_X1 = 64, 192  # genau eine Kachelbreite (die Nachbarkachel liegt 128 Pixel weiter)
FRAME_DARK = (46, 40, 34)  # Terrarien: dunkler Rahmen
FRAME_TANK = (70, 104, 140)  # Wassertanks: blauer Rahmen
PANE_TERRARIUM = (190, 214, 200, 52)  # leicht grünliches Glas
PANE_TANK = (164, 192, 205, 86)  # Glas mit Wasser dahinter, wie bisher
CABINET = (92, 66, 46)  # Holz des Sockels
OUTLINE = (34, 24, 18)

# Wände: Glas-Höhe und Bildhöhe (Welt-Pixel); die Kachelmitte liegt immer 20 Pixel über dem unteren Bildrand
WALLS = {
    'hutwall_terrarium': dict(glass=98, height=128, frame=FRAME_DARK, pane=PANE_TERRARIUM),
    'hutwall_terrarium_raised': dict(glass=72, height=132, frame=FRAME_DARK, pane=PANE_TERRARIUM, cabinet=RAISE),
    'hutwall_terrarium_raised_back': dict(glass=72, height=104, frame=FRAME_DARK, pane=PANE_TERRARIUM),
    'hutwall_tank': dict(glass=130, height=160, frame=FRAME_TANK, pane=PANE_TANK),
}


def shade(c, k):
    return tuple(min(255, max(0, round(v * k))) for v in c)


def wall(side, glass, height, frame, pane, cabinet=0):
    H = height * HD
    a = np.zeros((H, W, 4), np.float64)
    center = H - 20 * HD
    slope = 0.5 if side == 'x' else -0.5
    for x in range(X0, X1 + 1):
        bottom = center + 5 + slope * (x - 128)  # Unterkante (wie die bisherigen Wände)
        b = int(round(bottom))
        if cabinet:
            top_c = b - cabinet * HD
            a[top_c:b, x, :3] = CABINET
            a[top_c:b, x, 3] = 255
            a[top_c:top_c + 5, x, :3] = shade(CABINET, 1.35)  # helle Kante oben
            a[b - 5:b, x, :3] = shade(CABINET, 0.6)  # Schatten unten
            a[b - 2:b, x, :3] = OUTLINE
            b = top_c
        t = b - glass * HD
        # Glas: nur auf genau einer Kachelbreite (PANE_X0..PANE_X1), sonst wäre es dort, wo sich die Bilder benachbarter
        # Kacheln überlappen, doppelt (hellere Streifen); die Rahmen sind undurchsichtig und dürfen sich überlappen
        if PANE_X0 <= x < PANE_X1:
            a[t:b, x, :3] = pane[:3]
            a[t:b, x, 3] = pane[3]
        # Rahmen unten (12 Pixel) und oben (8 Pixel), mit heller Oberkante und dunkler Außenlinie
        a[b - 12:b, x, :3] = frame
        a[b - 12:b, x, 3] = 255
        a[b - 12:b - 9, x, :3] = shade(frame, 1.5)
        a[b - 2:b, x, :3] = OUTLINE
        a[t:t + 8, x, :3] = frame
        a[t:t + 8, x, 3] = 255
        a[t + 2:t + 4, x, :3] = shade(frame, 1.6)
        a[t:t + 2, x, :3] = OUTLINE
        a[t + 7:t + 8, x, :3] = shade(frame, 0.7)
    # ein schwacher, schräger Lichtschein auf dem Glas (kurze Spiegelung), in jeder Kachel gleich
    for x in range(84, 112):
        bottom = center + 5 + slope * (x - 128) - cabinet * HD
        mid = bottom - glass * HD * 0.55 - (x - 84) * 1.6
        for y in range(int(mid - 14), int(mid + 14)):
            if 0 <= y < H and 0 < a[y, x, 3] < 200:
                k = 1 - abs(y - mid) / 14
                a[y, x, :3] = a[y, x, :3] * (1 - 0.35 * k) + 255 * 0.35 * k
                a[y, x, 3] = min(255, a[y, x, 3] + 30 * k)
    return a


def post(glass, height, frame, cabinet=0):
    H = height * HD
    a = np.zeros((H, W, 4), np.float64)
    bottom = H - 20 * HD + 5
    top = bottom - (glass + cabinet) * HD
    a[top:bottom, 122:134, :3] = frame
    a[top:bottom, 122:134, 3] = 255
    a[top:bottom, 125:128, :3] = shade(frame, 1.5)
    a[top:bottom, 122:124, :3] = OUTLINE
    a[top:bottom, 132:134, :3] = OUTLINE
    a[top:top + 2, 122:134, :3] = OUTLINE
    return a


def floor():
    # Raute 256×128: u, v von 0 bis 1 entlang der Kachelkanten; 3×3 Platten, die Fugen am Rand nur zur Hälfte (die
    # andere Hälfte liegt in der Nachbarkachel)
    rng = np.random.default_rng(7)
    h = W // 2
    y, x = np.mgrid[0:h, 0:W].astype(float) + 0.5
    u = (x - W / 2) / W + y / h
    v = y / h - (x - W / 2) / W
    inside = (u >= -0.004) & (u <= 1.004) & (v >= -0.004) & (v <= 1.004)
    a = np.zeros((h, W, 4), np.float64)
    base = np.array([196, 158, 108], float)
    tint = rng.uniform(0.9, 1.06, (3, 3))
    i = np.clip((u * 3).astype(int), 0, 2)
    j = np.clip((v * 3).astype(int), 0, 2)
    k = tint[i, j][..., None]
    fu, fv = u * 3 - i, v * 3 - j  # Lage in der Platte (0..1)
    light = 1 + (0.5 - fu) * 0.08 + (0.5 - fv) * 0.08  # oben links etwas heller
    noise = rng.normal(1, 0.035, (h, W))[..., None]
    a[..., :3] = base * k * light[..., None] * noise
    g = 0.02  # halbe Fugenbreite (in Kachelkanten-Längen)
    du = np.abs(u * 3 - np.round(u * 3)) / 3
    dv = np.abs(v * 3 - np.round(v * 3)) / 3
    grout = (du < g) | (dv < g)
    a[grout, :3] = (104, 72, 48)
    edge = ((du < g * 1.6) | (dv < g * 1.6)) & ~grout
    a[edge, :3] = a[edge, :3] * 0.85
    a[..., 3] = np.where(inside, 255, 0)
    return a


def save(a, name):
    im = Image.fromarray(np.clip(a, 0, 255).round().astype(np.uint8), 'RGBA')
    im.save(f'public/assets/hd/{name}.png')
    im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(f'public/assets/hd2/{name}.png', optimize=True)
    im.resize((im.width // HD, im.height // HD), Image.LANCZOS).save(f'public/assets/{name}.png')
    print(name, im.size)


for name, d in WALLS.items():
    for side in ('x', 'y'):
        save(wall(side, **d), f'{name}_{side}')
    save(post(d['glass'], d['height'], d['frame'], d.get('cabinet', 0)), f'post_{name}')
save(floor(), 'floor_reptiles')
