"""Aufruf: python tools/beaver-swim.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Biber schwimmt: aus dem Biber-Sprite (Sprites/Biber.png, erste Figur = Vorderansicht nach rechts) geschnitten. Unter der
Wasserlinie verschwindet der Körper (ein schmaler Streifen bleibt blau getönt und halb durchsichtig sichtbar), darüber
eine helle Wellenlinie und eine kleine Bugwelle hinter dem Kopf.
Ergebnis: public/assets/beaver_swim.png, 80 x 60 wie beaver.png (gleicher Maßstab 0.12), Wasserlinie bei y = WATER_Y.
Dazu eine große Fassung zum Nachmalen: Tiersprites Test/Biber_schwimmt_vorne.png"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = 'Sprites/Biber.png'
OUT = 'public/assets/beaver_swim.png'
EXPORT = 'Tiersprites Test/Biber_schwimmt_vorne.png'
FRAME_W, FRAME_H = 80, 60
SCALE = 0.12  # wie beaver.png (tools/prepare-characters.js)
WATER_Y = 44  # Wasserlinie im Bild (Fußpunkt fürs Spiel: SWIM_ORIGIN_Y in Beaver.js)
CUT = 0.58  # Wasserlinie bei diesem Anteil der Figurenhöhe (unter der Schnauze)
UNDER = 0.07  # so viel (Anteil der Figurenhöhe) bleibt unter Wasser schwach sichtbar
WATER = (120, 176, 200)

row = Image.open(SRC).convert('RGBA')
a = np.asarray(row)[:, :, 3]
cols = np.nonzero(a.max(0) > 20)[0]
# erste Figur: bis zur ersten Lücke zwischen den Figuren
gap = np.nonzero(np.diff(cols) > 5)[0]
x1 = cols[gap[0]] + 1 if len(gap) else cols[-1] + 1
fig = row.crop((cols[0], 0, x1, row.height))
fig = fig.crop(fig.getbbox())
W, H = fig.size

wl = int(H * CUT)
under = int(H * UNDER)
arr = np.asarray(fig).astype(float)
out = arr.copy()
# unter der Wasserlinie: erst blau getönt und blasser, dann ganz weg
for y in range(wl, H):
    if y < wl + under:
        k = 1 - (y - wl) / under
        out[y, :, :3] = out[y, :, :3] * 0.45 + np.array(WATER) * 0.55
        out[y, :, 3] *= 0.45 * k
    else:
        out[y, :, 3] = 0
fig = Image.fromarray(out.astype('uint8'))
fig = fig.crop((0, 0, W, wl + under))

# Wellen: helle Linie an der Wasserlinie, wo der Körper durchs Wasser geht, und eine Bugwelle hinter dem Kopf (links)
body = np.nonzero(arr[wl - 2, :, 3] > 40)[0]
bx0, bx1 = (body.min(), body.max()) if len(body) else (0, W)
pad = int(W * 0.25)
canvas = Image.new('RGBA', (W + pad * 2, wl + under + pad), (0, 0, 0, 0))
canvas.alpha_composite(fig, (pad, 0))
d = ImageDraw.Draw(canvas)
lw = max(3, W // 70)
cy = wl
d.ellipse([pad + bx0 - W * 0.06, cy - H * 0.035, pad + bx1 + W * 0.06, cy + H * 0.05], outline=(236, 248, 255, 150), width=max(2, lw - 1))
for i, (dx, dy) in enumerate([(0.22, 0.06), (0.36, 0.1)]):
    d.line([(pad + bx0, cy), (pad + bx0 - W * dx, cy - H * dy)], fill=(236, 248, 255, 170 - i * 50), width=lw)
    d.line([(pad + bx0, cy + H * 0.02), (pad + bx0 - W * dx, cy + H * (dy + 0.04))], fill=(236, 248, 255, 170 - i * 50), width=lw)
canvas = canvas.filter(ImageFilter.SMOOTH)
canvas.crop(canvas.getbbox()).save(EXPORT, optimize=True)

# ins Spiel: verkleinern, Wasserlinie auf WATER_Y, waagrecht mittig (wie die Figur in beaver.png)
small = canvas.resize((round(canvas.width * SCALE), round(canvas.height * SCALE)), Image.LANCZOS)
frame = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
fx = round(FRAME_W / 2 - (pad + W / 2) * SCALE)
fy = round(WATER_Y - wl * SCALE)
frame.alpha_composite(small, (fx, fy)) if fx >= 0 and fy >= 0 else frame.paste(small, (fx, fy), small)
frame.save(OUT, optimize=True)
print(OUT, FRAME_W, 'x', FRAME_H, '| Wasserlinie', WATER_Y)
