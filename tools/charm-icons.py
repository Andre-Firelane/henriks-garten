"""Glücksbringer- und Boost-Symbole aus den gemalten Bildern (weißer Hintergrund, Bodenschatten, Glitzer) freistellen
und klein für das Spiel ablegen: public/assets/charm_<id>.png und boost.png, höchstens SIZE Pixel (die Symbole sind im
Spiel höchstens etwa 48 CSS-Pixel groß, das reicht auch für Tablet-Bildschirme mit dreifacher Pixeldichte).
Aufruf: python tools/charm-icons.py   (danach python tools/make-webp.py . für Handy und Tablet)
Boost: Stoppuhr und Blitz liegen im Bild getrennt; der Blitz wird oben rechts an die Stoppuhr gesetzt, leicht überlappend."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SIZE = 128
CHARMS = {
    'cheapReroll': 'Sprites/Glückswürfel.webp',
    'swift': 'Sprites/Flinke Schuhe.webp',
    'rareLuck': 'Sprites/Sternschnuppe.png',
    'chestRadar': 'Sprites/Kistenkompass.webp',
    'campfire': 'Sprites/Lagerfeuer.webp',
    'longEvents': 'Sprites/Festtags-Glocke.webp',
    'clover': 'Sprites/Kleeblatt.webp',
    'hourglass': 'Sprites/Sanduhr.webp',
    'piggy': 'Sprites/Sparschwein.png',
}


def cutout(path):
    """RGBA-Bild ohne Hintergrund und Bodenschatten, dazu die Teile (zusammenhängende Flächen), größte zuerst."""
    rgb = np.array(Image.open(path).convert('RGB')).astype(float)
    H, W, _ = rgb.shape
    mn = rgb.min(2)
    sat = rgb.max(2) - mn
    # Hintergrund: von außen erreichbares Helles (auch der zarte Schein um Glocke und Sanduhr) und der graue Schatten
    light = (mn > 214) | ((sat < 14) & (mn > 150))
    m = Image.fromarray(np.where(light, 0, 255).astype(np.uint8)).copy()  # copy: sonst schreibgeschützt, floodfill wirkt nicht
    for x in range(0, W, 4):
        for y in (0, H - 1):
            if m.getpixel((x, y)) == 0: ImageDraw.floodfill(m, (x, y), 128)
    for y in range(0, H, 4):
        for x in (0, W - 1):
            if m.getpixel((x, y)) == 0: ImageDraw.floodfill(m, (x, y), 128)
    bg = np.array(m) == 128
    # weicher Rand: Randpixel teilweise durchsichtig, Farbe gegen Weiß entmischt
    near = np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    edge = near & ~bg
    a = np.where(bg, 0.0, 1.0)
    a[edge] = np.clip((255 - mn[edge]) / 255 / 0.35, 0.15, 1)
    col = rgb.copy()
    ae = a[edge][:, None]
    col[edge] = np.clip((rgb[edge] - 255 * (1 - ae)) / ae, 0, 255)
    # Teile: Glitzer und Staub sind klein, die Figur (oder Stoppuhr und Blitz) groß
    solid = Image.fromarray(((a > 0.5) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    lab = solid.copy()  # (MinFilter/MaxFilter liefern schon ein neues, beschreibbares Bild)
    arr = np.array(lab)
    parts, n = [], 1
    while n < 250:
        ys, xs = np.where(arr == 255)
        if not len(xs): break
        ImageDraw.floodfill(lab, (int(xs[0]), int(ys[0])), n)
        arr = np.array(lab)
        parts.append(arr == n)
        n += 1
    parts.sort(key=lambda p: -p.sum())
    img = Image.fromarray(np.dstack([col, a * 255]).astype(np.uint8), 'RGBA')
    return img, parts


def only(img, masks):
    """nur diese Teile behalten (etwas aufgeweitet, damit der weiche Rand bleibt), zugeschnitten"""
    keep = np.zeros(masks[0].shape, bool)
    for p in masks: keep |= p
    keep = np.array(Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    arr = np.array(img)
    arr[~keep, 3] = 0
    out = Image.fromarray(arr, 'RGBA')
    return out.crop(out.getchannel('A').getbbox())


def small(img):
    k = SIZE / max(img.size)
    return img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)


for cid, src in CHARMS.items():
    img, parts = cutout(src)
    big = parts[0].sum()
    # alles, was mindestens ein Fünftel so groß ist wie das größte Teil (z. B. der zweite Würfel), sonst nur die Figur
    out = small(only(img, [p for p in parts if p.sum() >= big * 0.2]))
    out.save(f'public/assets/charm_{cid}.png')
    print(f'charm_{cid}.png', out.size)

# Boost: Stoppuhr (größtes Teil) und Blitz (zweitgrößtes), Blitz oben rechts leicht über die Stoppuhr gesetzt
img, parts = cutout('Sprites/Boost.png')
watch = only(img, [parts[0]])
bolt = only(img, [parts[1]])
bolt = bolt.resize((round(bolt.width * 0.85), round(bolt.height * 0.85)), Image.LANCZOS)
ox = round(watch.width - bolt.width * 0.62)  # Blitz ragt rechts etwas heraus ...
oy = 0
wy = round(bolt.height * 0.38)  # ... und oben: die Stoppuhr sitzt so weit tiefer
canvas = Image.new('RGBA', (max(watch.width, ox + bolt.width), wy + watch.height), (0, 0, 0, 0))
canvas.alpha_composite(watch, (0, wy))
canvas.alpha_composite(bolt, (ox, oy))
out = small(canvas.crop(canvas.getchannel('A').getbbox()))
out.save('public/assets/boost.png')
print('boost.png', out.size)
