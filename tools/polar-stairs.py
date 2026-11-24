# Platzhalter: große Treppe in der Polarhalle (Tierpark, Eiswelt) hinunter zur Unterwasser-Scheibe. Liegt flach im Boden
# über 2×2 Kacheln (Raute 128×64); Stufen führen nach hinten in die Tiefe (je weiter hinten, desto dunkler), ringsum ein
# Rand aus Eis mit Glanz. Gezeichnet in 8-facher Größe und verkleinert (glatte Kanten); dazu die Fassungen für hd/ und hd2/.
#
#   python tools/polar-stairs.py   → public/assets/(hd/, hd2/)stairs_ice.png und dieselben als webp
from PIL import Image, ImageDraw, ImageFilter

KEY = 'stairs_ice'
W, H = 128, 64
S = 8
STEPS = 8
img = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)


def pt(u, v):
    # u: entlang tx (0..1, nach rechts unten), v: entlang ty (0..1, nach links unten) → Punkt im großen Bild
    return ((W / 2 + (u - v) * W / 2) * S, ((u + v) * H / 2) * S)


def quad(u0, v0, u1, v1, fill):
    d.polygon([pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1)], fill=fill)


def mix(a, b, k):
    return tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3)) + (255,)


# Eisrand: außen hell, innen etwas bläulicher (weicher Übergang in Streifen)
for i in range(12):
    k = i / 11
    e = 0.12 * k
    quad(e * 0.6, e * 0.6, 1 - e * 0.6, 1 - e * 0.6, mix((226, 240, 248), (170, 205, 226), k))
# Öffnung mit Stufen: die Stufen laufen entlang tx, man geht nach hinten (kleines v) hinunter
U0, U1, V0, V1 = 0.12, 0.88, 0.1, 0.92
for i in range(STEPS):
    v0 = V0 + (V1 - V0) * i / STEPS
    v1 = V0 + (V1 - V0) * (i + 1) / STEPS
    k = (i + 1) / STEPS  # vorne hell, hinten dunkel
    riser = mix((10, 26, 46), (96, 138, 170), k ** 1.3)
    tread = mix((24, 48, 74), (176, 208, 228), k ** 1.2)
    quad(U0, v0, U1, v1, riser)
    quad(U0, v0 + (v1 - v0) * 0.42, U1, v1, tread)
    # Stufenkante mit Glanz
    d.line([pt(U0, v0 + (v1 - v0) * 0.42), pt(U1, v0 + (v1 - v0) * 0.42)], fill=mix((60, 90, 120), (235, 245, 252), k), width=int(0.7 * S))
# Seitenwangen (links im Schatten, rechts im Licht)
quad(U0 - 0.05, V0, U0, V1, (110, 150, 182, 255))
quad(U1, V0, U1 + 0.05, V1, (200, 226, 240, 255))
# dunkler Schlund ganz hinten, weich auslaufend
sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
ImageDraw.Draw(sh).polygon([pt(U0, V0), pt(U1, V0), pt(U1, V0 + 0.14), pt(U0, V0 + 0.14)], fill=(4, 14, 28, 230))
img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(3 * S)))
# Geländer: dünne Metallstangen an beiden Seiten
for u in (U0 - 0.03, U1 + 0.03):
    d.line([pt(u, V0 + 0.05), pt(u, V1 - 0.02)], fill=(225, 235, 242, 255), width=int(0.8 * S))

for sub, f in (('hd/', 4), ('hd2/', 2), ('', 1)):
    out = img.resize((W * f, H * f), Image.LANCZOS)
    out.save(f'public/assets/{sub}{KEY}.png')
    out.save(f'public/assets/webp/{sub}{KEY}.webp', quality=92)
print('ok')
