"""Aufruf: python tools/snow-rocks.py .   (braucht Pillow und numpy)
Verschneite Felsen für die Hochebene im Bambuswald: Felsen aus anderen Gebieten (Savanne, Wald, Dschungel) werden in
kühles Granitgrau umgefärbt, Moos wird zu Schnee, und auf alle Oberkanten legt sich eine Schneekappe. Für alle drei
Auflösungen (public/assets, hd, hd2); danach tools/make-webp.py laufen lassen."""
import sys, os
import numpy as np
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
A = os.path.join(ROOT, 'public/assets')
# neues Bild: Vorlage
ROCKS = {
    'snow_kopje': 'savanna_kopje',
    'snow_rocks0': 'forest_boulder',
    'snow_rocks1': 'forest_boulder2',
    'snow_pair': 'savanna_rock1',
    'snow_spire': 'savanna_rock3',
    'snow_rubble': 'savanna_rock4',
    'snow_stack': 'cliff',
    'snow_lionrock': 'lion_rock',
    'snow_cairn': 'savanna_rock2',
}
# Teile abschneiden (Anteile von Breite und Höhe): rechts von x (leicht gerundet), oberhalb von y; die Schnittkante
# bekommt eine neue Kontur. Beim Löwenfelsen: die überstehende Spitze der oberen Platte
CUT = {'snow_lionrock': (0.655, 0.44)}
SNOW = np.array([244, 247, 250], float)
SNOW_SHADE = np.array([206, 218, 230], float)
GRANITE = np.array([150, 158, 170], float)


def snowy(img, scale):
    a = np.asarray(img.convert('RGBA')).astype(float)
    rgb, al = a[..., :3], a[..., 3]
    h, w = al.shape
    lum = rgb @ [0.299, 0.587, 0.114]
    solid = al > 200
    outline = solid & (lum < 70)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    moss = solid & (g > r + 12) & (g > b + 12)
    # umfärben: Helligkeit behalten, Farbe zum Granitgrau ziehen (die Kontur bleibt dunkel)
    body = solid & ~outline
    # mittlere Helligkeit des Felsens auf ein mittleres Grau bringen, damit sich der Schnee abhebt
    norm = 118.0 / max(1.0, lum[body].mean()) if body.any() else 1.0
    grey = (lum * norm / 150.0)[..., None] * GRANITE
    rgb[body] = rgb[body] * norm * 0.15 + grey[body] * 0.85
    rgb[outline] = rgb[outline] * 0.3 + np.array([48, 52, 60], float) * 0.7  # Kontur schiefergrau statt braun
    # Schnee: unter jeder Oberkante (durchsichtig oder Kontur darüber) ein paar Pixel tief; die Dicke schwankt weich
    thick = max(2, round(6 * scale))
    wave = (np.sin(np.arange(w) / (3.0 * scale) * 1.3) * 0.3 + np.sin(np.arange(w) / (5.0 * scale) * 0.7) * 0.25 + 0.75)
    snow = np.zeros_like(solid)
    # Kanten, auf denen Schnee liegen bleibt: die Umrisslinie oben und eher waagerechte Konturen im Felsen (senkrechte
    # Risse nicht, sonst laufen weiße Streifen an ihnen herunter)
    s = max(1, round(scale))
    od = outline.copy()
    for k in range(1, s + 1):
        od[k:] |= outline[:-k]
        od[:-k] |= outline[k:]
    flat = outline.copy()
    for dx in (2 * s, -2 * s):
        flat &= np.roll(od, dx, axis=1)
    for x in range(w):
        t = max(1, round(thick * wave[x]))
        run = 0
        for y in range(h):
            if not solid[y, x]:
                run = t
            elif flat[y, x]:
                run = t + 1
            elif outline[y, x]:
                pass
            elif run > 0:
                snow[y, x] = True
                run -= 1
    # nur auf eher hellen (nach oben bzw. zum Licht zeigenden) Flächen, damit Unterseiten frei bleiben
    snow &= lum > np.percentile(lum[body], 25) if body.any() else snow
    snow |= moss
    # unterste Schneereihe leicht bläulich (Schatten unter der Kappe)
    below = np.zeros_like(snow)
    below[:-1] = snow[:-1] & ~snow[1:] & body[1:]
    rgb[snow] = SNOW
    rgb[below] = SNOW_SHADE
    a[..., :3] = rgb
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


def cut(img, fx, fy, scale):
    a = np.asarray(img).astype(float)
    h, w = a.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w]
    edge = w * fx + w * 0.035 * np.sin(np.pi * np.clip(ys / (h * fy), 0, 1))  # Nase rund statt gerade
    gone = (xs > edge) & (ys < h * fy)
    a[gone, 3] = 0
    # neue Kontur: deckende Pixel direkt links neben der Schnittkante
    t = max(1, round(1.5 * scale))
    near = (xs > edge - t) & (xs <= edge) & (ys < h * fy) & (a[..., 3] > 0)
    inside = np.roll(a[..., 3], 3 * t, axis=1) > 128  # nur, wo links daneben noch Fels ist (sonst bleibt ein Zacken stehen)
    a[near & ~inside, 3] = 0
    near &= inside
    a[near, :3] = [48, 52, 60]
    a[near, 3] = 255
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


for new, src in ROCKS.items():
    base = Image.open(os.path.join(A, src + '.png'))
    for sub in ['', 'hd', 'hd2']:
        p = os.path.join(A, sub, src + '.png')
        if not os.path.exists(p):
            continue
        img = Image.open(p)
        out = snowy(img, img.width / base.width)
        if new in CUT:
            out = cut(out, *CUT[new], img.width / base.width)
        out.save(os.path.join(A, sub, new + '.png'))
        print(os.path.join(sub, new + '.png'), out.size)
