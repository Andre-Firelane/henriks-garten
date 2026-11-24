"""Angelfische (docs/plan-angeln.md): schneidet die 30 Arten aus "Sprites/Fische neu 1-3.webp" (weißer Hintergrund,
Namen darunter) aus und legt sie als Spritesheet public/assets/freshfish.png ab: je Art zwei Bilder (nach rechts, nach
links), FW x FH Pixel (doppelte Auflösung, im Spiel halb so groß gezeigt), Zeile für Zeile zu je SHEET_COLS Bildern.
Reihenfolge = FRESH_FISH in src/world/fishing.js. Große Fische bleiben etwas größer als kleine (SIZE_KEEP).
Danach: node tools/fish-wag.cjs (Schwanzflosse wackeln lassen -> freshfish_swim.png).
Aufruf: python tools/freshwater-fish.py   (braucht Pillow und numpy)"""
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

OUT = 'public/assets/freshfish.png'
FW, FH = 192, 128
MAX_W, MAX_H = 180, 116
SHEET_COLS = 20  # 20 x 192 = 3840 (breiter laden manche Handys nicht)
SIZE_KEEP = 0.4  # 0: alle gleich lang, 1: echte Längen zueinander

# (Blatt, Zeile, Spalte) in der Reihenfolge von FRESH_FISH; Zeilen/Spalten wie von bands() gefunden
ORDER = [
    ('carp', 1, 0, 0), ('tench', 1, 0, 1), ('roach', 1, 0, 2), ('goldfish', 1, 0, 3),
    ('perch', 1, 1, 0), ('chub', 1, 1, 1), ('eel', 1, 1, 2), ('trout', 1, 1, 3),
    ('grayling', 1, 2, 0), ('pike', 1, 2, 1), ('wels', 1, 2, 2), ('sturgeon', 1, 2, 3),
    ('crucian', 1, 3, 0), ('loach', 1, 3, 1),
    ('jewel', 2, 0, 0), ('lungfish', 2, 0, 1), ('sharptooth', 2, 0, 2), ('nileperch', 2, 0, 3), ('tigerfish', 2, 2, 1),
    ('peacockbass', 3, 0, 0), ('pacu', 3, 0, 1), ('arowana', 3, 0, 2), ('arapaima', 3, 0, 3),
    ('electriceel', 3, 1, 1), ('char', 3, 1, 3),
    ('cod', 3, 2, 0), ('salmon', 3, 2, 1), ('lumpsucker', 3, 2, 2), ('halibut', 3, 2, 3),
    ('polarcod', 3, 3, 2),
]


def runs(v):
    out, s = [], None
    for i, x in enumerate(v):
        if x and s is None:
            s = i
        if not x and s is not None:
            out.append((s, i - 1))
            s = None
    if s is not None:
        out.append((s, len(v) - 1))
    return out


def background(a):
    return (a.min(2) >= 230) & (a.max(2) - a.min(2) <= 15)


def bands(a):
    """Fisch-Zeilen (ohne die Namenszeilen) und darin die Fische als Spaltenbereiche."""
    fg = ~background(a)
    out = []
    for y0, y1 in runs(fg.sum(1) > 0):
        if y1 - y0 < 35:
            continue  # Namenszeile
        y1 = min(y1, y0 + 100)  # Blatt 3: der Name hängt an der Dorsch-Zeile
        prof = fg[y0:y1 + 1].sum(0)
        cols = []
        for c in runs(prof > 0):
            if cols and c[0] - cols[-1][1] < 14:
                cols[-1] = (cols[-1][0], c[1])
            else:
                cols.append(c)
        # zu breite Bereiche (zwei Fische berühren sich fast, Wels und Stör): an der dünnsten Stelle in der Mitte teilen
        split = []
        for x0, x1 in cols:
            if x1 - x0 > 420:
                mid = (x0 + x1) // 2
                cut = mid - 80 + int(np.argmin(prof[mid - 80:mid + 80]))
                split += [(x0, cut), (cut + 1, x1)]
            else:
                split.append((x0, x1))
        out.append((y0, y1, split))
    return out


def cut(a, y0, y1, x0, x1):
    """Fisch freistellen: Weiß, das vom Rand des Ausschnitts erreichbar ist, wird durchsichtig."""
    pad = 4
    y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
    y1, x1 = min(a.shape[0] - 1, y1 + pad), min(a.shape[1] - 1, x1 + pad)
    c = a[y0:y1 + 1, x0:x1 + 1]
    H, W = c.shape[:2]
    cand = background(c)
    bg = np.zeros((H, W), bool)
    q = deque([(x, y) for x in range(W) for y in (0, H - 1)] + [(x, y) for y in range(H) for x in (0, W - 1)])
    while q:
        x, y = q.popleft()
        if bg[y, x] or not cand[y, x]:
            continue
        bg[y, x] = True
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H and not bg[ny, nx] and cand[ny, nx]:
                q.append((nx, ny))
    # abgetrennte Stückchen (Bartelspitze des Nachbarfischs) weg: nur Teile ab 3 % des größten behalten
    seen = np.zeros((H, W), int)
    parts = []
    for sy in range(H):
        for sx in range(W):
            if bg[sy, sx] or seen[sy, sx]:
                continue
            n = len(parts) + 1
            seen[sy, sx] = n
            q, size = deque([(sx, sy)]), 0
            while q:
                x, y = q.popleft()
                size += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < W and 0 <= ny < H and not bg[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = n
                        q.append((nx, ny))
            parts.append(size)
    keep = [i + 1 for i, s in enumerate(parts) if s >= max(parts) * 0.03]
    bg |= ~np.isin(seen, keep)
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    img = Image.fromarray(c.astype(np.uint8), 'RGB').convert('RGBA')
    img.putalpha(alpha)
    return img.crop(img.getbbox())


sheets = {i: np.asarray(Image.open(f'Sprites/Fische neu {i}.webp').convert('RGB')).astype(int) for i in (1, 2, 3)}
found = {i: bands(a) for i, a in sheets.items()}
fish = []
for name, s, r, c in ORDER:
    y0, y1, cols = found[s][r]
    x0, x1 = cols[c]
    fish.append((name, cut(sheets[s], y0, y1, x0, x1)))

longest = max(img.width for _, img in fish)
frames = []
for name, img in fish:
    rel = (img.width / longest) ** SIZE_KEEP
    k = min(MAX_W * rel / img.width, MAX_H / img.height)
    small = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    frames += [small, small.transpose(Image.FLIP_LEFT_RIGHT)]  # Vorlage schaut nach rechts

rows = -(-len(frames) // SHEET_COLS)
sheet = Image.new('RGBA', (FW * SHEET_COLS, FH * rows), (0, 0, 0, 0))
for n, f in enumerate(frames):
    ox = (n % SHEET_COLS) * FW + (FW - f.width) // 2
    oy = (n // SHEET_COLS) * FH + (FH - f.height) // 2
    sheet.alpha_composite(f, (ox, oy))
sheet.save(OUT)
print(f'{OUT}: {len(fish)} Arten, je 2 Bilder à {FW}x{FH}')
