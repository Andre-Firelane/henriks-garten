# Platzhalter: Steinklotz als Sitzgelegenheit im Raum an der Unterwasser-Scheibe (Tierpark, Eiswelt). Grauer Granit mit
# abgerundeten Kanten, weichem Licht von oben links und feiner Körnung; passt in jede Richtung (keine Lehne).
# Gezeichnet wird in 8-facher Größe und dann verkleinert (glatte Kanten); dazu die großen Fassungen für hd/ und hd2/.
#
#   python tools/stone-seat-ice.py   → public/assets/(hd/, hd2/)seat_stone_ice.png und dieselben als webp
import random
from PIL import Image, ImageDraw, ImageFilter

KEY = 'seat_stone_ice'
W, H = 64, 48  # Größe im Spiel
FOOT_Y = 38  # Kachelmitte im Bild (originY 38/48)
S = 8  # Zeichengröße
rnd = random.Random(3)

img = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))


def pt(u, v, z):
    # u entlang tx, v entlang ty (in Kacheln, 0 = Kachelmitte), z Höhe in Pixeln (Spielgröße) → Punkt im großen Bild
    return ((W / 2 + (u - v) * 32) * S, (FOOT_Y + (u + v) * 16 - z) * S)


def layer():
    return Image.new('RGBA', img.size, (0, 0, 0, 0))


U0, U1, V0, V1, Z = -0.38, 0.38, -0.26, 0.26, 15
R = 0  # (Kanten: nur ein heller Streifen oben)

# weicher Schatten
sh = layer()
ImageDraw.Draw(sh).polygon([pt(U0 - 0.06, V0 - 0.02, 0), pt(U1 + 0.1, V0 - 0.02, 0), pt(U1 + 0.1, V1 + 0.1, 0), pt(U0 - 0.06, V1 + 0.1, 0)], fill=(10, 20, 30, 110))
img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4 * S)))


def face(points, top_color, bottom_color, axis_pts):
    # Fläche mit Verlauf von top_color (bei axis_pts[0]) nach bottom_color (bei axis_pts[1])
    mask = layer()
    ImageDraw.Draw(mask).polygon(points, fill=(255, 255, 255, 255))
    grad = layer()
    gd = ImageDraw.Draw(grad)
    (x0, y0), (x1, y1) = axis_pts
    steps = 64
    xs = [p[0] for p in points]
    for i in range(steps):
        k = i / (steps - 1)
        c = tuple(int(top_color[j] + (bottom_color[j] - top_color[j]) * k) for j in range(3)) + (255,)
        y = y0 + (y1 - y0) * k
        gd.rectangle([min(xs) - 4, y - (abs(y1 - y0) / steps) - 2, max(xs) + 4, y + 2], fill=c)
    out = layer()
    out.paste(grad, (0, 0), mask)
    img.alpha_composite(out)


# linke Seite (vorne links, im Schatten), rechte Seite (vorne rechts, mittel), Oberseite (hell)
left = [pt(U0, V1, 0), pt(U1, V1, 0), pt(U1, V1, Z), pt(U0, V1, Z)]
right = [pt(U1, V0, 0), pt(U1, V1, 0), pt(U1, V1, Z), pt(U1, V0, Z)]
top = [pt(U0, V0, Z), pt(U1, V0, Z), pt(U1, V1, Z), pt(U0, V1, Z)]
face(left, (118, 126, 135), (82, 89, 97), (pt(0, V1, Z), pt(0, V1, 0)))
face(right, (150, 158, 166), (108, 116, 124), (pt(U1, 0, Z), pt(U1, 0, 0)))
# abgerundete Kante zwischen den Seiten
face(top, (196, 202, 208), (168, 175, 182), (pt(U0, V0, Z), pt(U1, V1, Z)))
# runde obere Kanten: heller Streifen
d = ImageDraw.Draw(img)
d.line([pt(U0, V1, Z), pt(U1, V1, Z), pt(U1, V0, Z)], fill=(218, 224, 230, 255), width=int(0.9 * S), joint='curve')
d.line([pt(U1, V1, Z), pt(U1, V1, 0)], fill=(160, 168, 176, 255), width=int(0.6 * S))

# Körnung des Granits (feine helle und dunkle Punkte) auf allen Flächen
grain = layer()
gd = ImageDraw.Draw(grain)
mask = layer()
md = ImageDraw.Draw(mask)
for poly in (left, right, top):
    md.polygon(poly, fill=(255, 255, 255, 255))
x0, y0 = pt(U0, V0, Z)[0], pt(U0, V0, Z)[1]
for _ in range(1400):
    x = rnd.uniform(pt(U0, V1, 0)[0], pt(U1, V0, 0)[0])
    y = rnd.uniform(pt(0, V0, Z)[1] - 10 * S, pt(0, V1 + 0.3, 0)[1])
    r = rnd.uniform(0.12, 0.3) * S
    c = rnd.choice([(235, 238, 242, 45), (60, 66, 74, 40), (40, 44, 50, 35), (250, 250, 250, 30)])
    gd.ellipse([x - r, y - r, x + r, y + r], fill=c)
clipped = layer()
clipped.paste(grain, (0, 0), mask)
img.alpha_composite(clipped)
# untere Kante dunkel (steht schwer auf dem Boden)
d.line([pt(U0, V1, 0), pt(U1, V1, 0), pt(U1, V0, 0)], fill=(54, 60, 68, 255), width=int(1.2 * S))

# Fassungen: hd (4×), hd2 (2×), normal (1×), jeweils als png und webp
for sub, f in (('hd/', 4), ('hd2/', 2), ('', 1)):
    out = img.resize((W * f, H * f), Image.LANCZOS)
    out.save(f'public/assets/{sub}{KEY}.png')
    out.save(f'public/assets/webp/{sub}{KEY}.webp', quality=92)
print('ok')
