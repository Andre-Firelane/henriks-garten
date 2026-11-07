"""Aufruf: python tools/beaver-placeholders.py   (braucht Pillow; danach python tools/make-webp.py .)
Platzhalter für die Biber im Wald (bis echte Bilder da sind), gezeichnet wie die übrigen Wald-Platzhalter
(tools/sprite_draw.py); Vorlagen zum Nachmalen in Wald-Sprites/Neu.
- forest_beaver_dam / forest_beaver_dam_hole: Damm quer über den Fluss (3 Kacheln entlang tx), mit und ohne Loch
- forest_stick: großer Stock zum Aufheben, forest_gnawed_tree: angenagter Baum, forest_beaver_lodge: Biberburg (Asthaufen)
- forest_dark_soil: dunkle Erde unter der Biberburg (aus forest_path abgeleitet)
ONLY=name: nur dieses eine Bild."""
import math, os, random, re
from PIL import Image, ImageOps
import sprite_draw
from sprite_draw import Pic, dark, light, save_all, wanted

sprite_draw.EXPORT = 'Wald-Sprites/Neu'
sprite_draw.SKIP = set(re.findall(r"'(\w+)':", open('tools/forest-art.py', encoding='utf-8').read()))  # schon echte Bilder (nur noch Vorlage)

rnd = random.Random(7)
FUR = (128, 82, 46, 255)
FUR2 = (156, 108, 64, 255)
TAIL = (78, 62, 52, 255)
TEETH = (236, 156, 46, 255)
BLACK = (34, 26, 22, 255)
WOOD = (120, 84, 50, 255)
WOOD2 = (150, 106, 62, 255)
FRESH = (226, 196, 140, 255)
MUD = (96, 72, 48, 255)
LEAF = (80, 128, 60, 255)
WATER = (120, 176, 200, 255)


def tail(p, cx, cy, rx, ry):
    p.ell(cx, cy, rx, ry, TAIL)
    for i in range(-2, 3):
        x = cx + i * rx / 3
        p.line([(x - 1.5, cy - ry * 0.6), (x + 1.5, cy + ry * 0.6)], dark(TAIL, 0.8), 0.4, ol=False)


def beaver_front():
    """3/4 von vorne, Blick nach rechts"""
    p = Pic(64, 48)
    tail(p, 13, 39, 9, 3.6)
    p.ell(24, 41, 4, 2.4, dark(FUR, 0.8))  # Hinterfuß
    p.ell(30, 32, 15, 11, FUR)
    p.ell(33, 36, 8, 6, FUR2, ol=False)  # Bauch
    p.ell(44, 41, 3, 2, dark(FUR, 0.8))  # Vorderfuß
    p.ell(46, 25, 9, 8, FUR)
    p.ell(41, 18, 2.4, 2.2, dark(FUR, 0.8))  # Ohr
    p.ell(52, 28, 4.5, 3.6, FUR2)  # Schnauze
    p.ell(55.5, 26.5, 1.6, 1.2, BLACK, ol=False)
    p.ell(48, 23, 1.3, 1.3, BLACK, ol=False)
    p.ell(48.4, 22.6, 0.4, 0.4, (255, 255, 255, 255), ol=False)
    p.rect(51.5, 31, 54.5, 34.5, TEETH, ol=dark(TEETH))
    p.line([(53, 31), (53, 34.5)], dark(TEETH), 0.3, ol=False)
    p.shadow(30, 44, 20, 3.5)
    return p


def beaver_back():
    """von hinten, läuft nach rechts oben"""
    p = Pic(64, 48)
    p.ell(30, 31, 15, 11, FUR)
    p.ell(44, 22, 8, 7, FUR)
    p.ell(40, 16, 2.2, 2, dark(FUR, 0.8))
    p.ell(48, 17, 2.2, 2, dark(FUR, 0.8))
    p.ell(22, 41, 4, 2.4, dark(FUR, 0.8))
    p.ell(38, 41, 4, 2.4, dark(FUR, 0.8))
    tail(p, 20, 40, 10, 4)
    p.shadow(30, 44, 20, 3.5)
    return p


def beaver_gnaw(chew):
    """sitzt aufgerecht auf dem Schwanz und nagt nach rechts; chew: Kopf ein Stück vor"""
    p = Pic(64, 48)
    tail(p, 15, 42, 10, 3.2)
    p.ell(28, 41, 4, 2.2, dark(FUR, 0.8))
    p.poly([(18, 40), (16, 28), (22, 17), (32, 14), (38, 22), (38, 36), (32, 42)], FUR)
    p.ell(30, 30, 6, 9, FUR2, ol=False)
    hx, hy = (41, 16) if chew else (39.5, 17)
    p.ell(hx, hy, 8, 7, FUR)
    p.ell(hx - 4, hy - 7, 2.2, 2, dark(FUR, 0.8))
    p.ell(hx + 6, hy + 2, 4, 3.2, FUR2)
    p.ell(hx + 9, hy + 1, 1.5, 1.1, BLACK, ol=False)
    p.ell(hx + 2, hy - 2, 1.2, 1.2, BLACK, ol=False)
    p.rect(hx + 5.5, hy + 4.5, hx + 8.5, hy + (8.5 if chew else 7.5), TEETH, ol=dark(TEETH))
    p.ell(39, 25, 3, 2.2, dark(FUR, 0.85))  # Vorderpfoten am Stamm
    p.ell(40, 29, 3, 2.2, dark(FUR, 0.85))
    p.shadow(28, 44, 18, 3.2)
    return p


def beaver_swim():
    """schwimmt nach rechts: Rücken und Kopf über der Wasserlinie (y = 36), dahinter eine Bugwelle"""
    p = Pic(64, 48)
    for i, (x, w) in enumerate([(8, 7), (16, 9)]):
        p.line([(x, 38 + i), (x + w, 36.5)], (236, 248, 255, 200), 0.7, ol=False)
        p.line([(x, 34.5 - i), (x + w, 36)], (236, 248, 255, 200), 0.7, ol=False)
    p.ell(30, 36, 12, 4, FUR)
    p.ell(44, 32, 7.5, 6, FUR)
    p.ell(40, 26.5, 2, 1.8, dark(FUR, 0.8))
    p.ell(49.5, 34, 4, 3, FUR2)
    p.ell(53, 33, 1.4, 1, BLACK, ol=False)
    p.ell(46, 30, 1.2, 1.2, BLACK, ol=False)
    # alles unter der Wasserlinie halb durchsichtig blau
    w = p.im.size[0]
    line = int(36.5 * sprite_draw.S)
    under = p.im.crop((0, line, w, p.im.size[1]))
    tint = Image.new('RGBA', under.size, WATER[:3] + (0,))
    a = under.getchannel('A').point(lambda v: v * 35 // 100)
    tint.putalpha(a)
    p.im.paste(tint, (0, line))
    p.ell(30, 38, 18, 2.2, (236, 248, 255, 150), ol=False)
    return p


def sheet(frames, name, w, h):
    if not wanted(name):
        return
    S = sprite_draw.S
    im = Image.new('RGBA', (w * S * len(frames), h * S))
    for i, f in enumerate(frames):
        im.paste(f, (i * w * S, 0))
    save_all(im, name, w * len(frames), h)


def mirror(p):
    return ImageOps.mirror(p.im)


def stick_line(p, a, b, col, w):
    p.line([a, b], col, w)
    # helle Schnittfläche an einem Ende
    p.ell(b[0], b[1], w * 0.55, w * 0.55, FRESH, ol=dark(col, 0.7), ow=0.3)


# Damm: Bild 128 x 88, die mittlere Kachel (Kachelmitte) liegt bei (64, 52). Er liegt entlang tx (rechts unten) über 3 Kacheln
DAM_W, DAM_H, DAM_CX, DAM_CY = 128, 88, 64, 52


def along(t, up=0, side=0):
    """Punkt auf dem Damm: t von -1.5 bis 1.5 Kacheln entlang tx, up Pixel nach oben, side quer (entlang ty)"""
    return (DAM_CX + t * 32 - side * 16, DAM_CY + t * 16 + side * 8 - up)


def dam(hole):
    p = Pic(DAM_W, DAM_H)
    gap = (-0.22, 0.22)  # Loch in der Mitte (in Kacheln)
    pieces = [(-1.55, gap[0]), (gap[1], 1.55)] if hole else [(-1.55, 1.55)]
    for t0, t1 in pieces:
        # Schlammwall
        p.poly([along(t0, 0, -0.6), along(t1, 0, -0.6), along(t1, 0, 0.6), along(t1, 12, 0.3), along(t0, 12, 0.3), along(t0, 12, -0.3), along(t0, 0, -0.6)], MUD)
    r = random.Random(3)
    for _ in range(90):
        t = r.uniform(-1.5, 1.5)
        if hole and gap[0] - 0.08 < t < gap[1] + 0.08:
            continue
        L = r.uniform(0.25, 0.5)
        ta, tb = max(-1.55, t - L / 2), min(1.55, t + L / 2)
        if hole and ta < gap[1] and tb > gap[0]:
            if t < 0:
                tb = gap[0] - 0.02
            else:
                ta = gap[1] + 0.02
        up = r.uniform(3, 16)
        side = r.uniform(-0.5, 0.5)
        a = along(ta, up + r.uniform(-3, 3), side)
        b = along(tb, up + r.uniform(-3, 3), side)
        stick_line(p, a, b, r.choice([WOOD, WOOD2, dark(WOOD2, 0.85)]), r.uniform(1.4, 2.2))
    if hole:
        # Wasser schießt durch das Loch (nach vorne unten)
        p.poly([along(gap[0], 4, 0), along(gap[1], 4, 0), along(gap[1] + 0.05, -2, 0.9), along(gap[0] - 0.05, -2, 0.9)], WATER, ol=False)
        for i in range(5):
            x0, y0 = along(gap[0] + (gap[1] - gap[0]) * (i + 0.5) / 5, 1, 0)
            p.line([(x0, y0), (x0 - 7, y0 + 5)], (236, 248, 255, 255), 0.7, ol=False)
    else:
        # frisch eingesetzter Stock (hell) mit Schlamm
        p.poly([along(gap[0] - 0.05, 0, -0.6), along(gap[1] + 0.05, 0, -0.6), along(gap[1] + 0.05, 12, 0.3), along(gap[0] - 0.05, 12, 0.3)], MUD)
        stick_line(p, along(gap[0] - 0.2, 7, 0.05), along(gap[1] + 0.25, 12, 0.05), FRESH, 2.4)
        p.ell(*along(0.05, 9, 0.1), 2.2, 1.2, LEAF)
    return p


def stick():
    p = Pic(56, 28)
    p.line([(6, 20), (48, 9)], WOOD2, 2.6)
    p.line([(30, 14), (38, 5)], WOOD2, 1.4)
    p.line([(18, 17), (14, 9)], WOOD2, 1.2)
    p.ell(48, 9, 1.4, 1.4, FRESH, ol=dark(WOOD2), ow=0.3)
    for x, y in [(38, 4), (35, 6), (14, 8)]:
        p.ell(x, y, 2.6, 1.6, LEAF)
    p.shadow(28, 21, 20, 3)
    return p


def gnawed_tree():
    """angenagter Baum: Stamm mit Sanduhr-Kerbe, Späne am Fuß, kleine Krone. Fuß bei (24, 74)"""
    p = Pic(48, 80)
    bark = (104, 76, 52, 255)
    p.poly([(18, 74), (18, 56), (21, 50), (21, 46), (18, 40), (18, 22), (30, 22), (30, 40), (27, 46), (27, 50), (30, 56), (30, 74)], bark)
    p.poly([(20, 56), (22.5, 50), (22.5, 46), (20, 41), (28, 41), (25.5, 46), (25.5, 50), (28, 56)], FRESH, ol=(170, 130, 80, 255), ow=0.4)
    for x, y in [(12, 75), (34, 76), (16, 78), (31, 72), (38, 74), (9, 72)]:
        p.ell(x, y, 1.8, 0.9, FRESH, ol=(170, 130, 80, 255), ow=0.3)
    for cx, cy, r in [(24, 16, 12), (15, 20, 8), (33, 20, 8), (24, 8, 8)]:
        p.ell(cx, cy, r, r * 0.8, (66, 116, 56, 255))
    for cx, cy in [(20, 12), (28, 16), (17, 19), (31, 9)]:
        p.ell(cx, cy, 3, 2, light((66, 116, 56, 255), 0.25), ol=False)
    p.shadow(24, 74, 14, 3.5)
    return p


def lodge():
    """Biberburg: ein Haufen aufgeschichteter Äste (ohne Schlamm, er liegt auf dunkler Erde: forest_dark_soil). Fuß bei (40, 46)"""
    p = Pic(80, 56)
    r = random.Random(5)
    # von unten nach oben schichten: unten dunkler und breiter, oben heller und schmaler (Kuppel)
    layers = 9
    for i in range(layers):
        k = i / (layers - 1)
        y = 46 - k * 26
        half = 32 * math.sqrt(max(0.0, 1 - k * k)) + 3
        col = dark(WOOD, 0.7 + 0.3 * k)
        col2 = dark(WOOD2, 0.7 + 0.3 * k)
        for _ in range(int(6 + half * 0.45)):
            cx = 40 + r.uniform(-half, half)
            cy = y + r.uniform(-2.5, 2.5)
            a = r.uniform(-0.6, 0.6) + (0 if r.random() < 0.7 else math.pi / 2 * r.choice([-0.5, 0.5]))
            L = r.uniform(7, 14)
            dx, dy = math.cos(a) * L / 2, math.sin(a) * L / 4
            stick_line(p, (cx - dx, cy - dy), (cx + dx, cy + dy), r.choice([col, col2]), r.uniform(1.3, 2.0))
    p.shadow(40, 48, 32, 5)
    return p


SOIL_W, SOIL_H = 96, 48  # dunkler Erdfleck (alte Größe): flaches Oval, Mitte = Kachelmitte der Burg


def dark_soil():
    """dunkle Erde unter der Biberburg: ein weiches Oval (Rand fließend ins Gras) aus dem stark abgedunkelten Waldweg.
    Liegt als eigenes Bild flach auf dem Gras (siehe GardenScene, Zeichen Ƅ), in allen Auflösungen"""
    import numpy as np
    from PIL import ImageFilter
    for sub, f in sprite_draw.OUT.items():
        path = Image.open(os.path.join(sprite_draw.A, sub, 'forest_path.png')).convert('RGBA')
        # Mitte der Wegkachel (dort ist sie ganz deckend) als Muster kacheln
        pw, ph = path.size
        patch = path.crop((pw * 3 // 8, ph * 3 // 8, pw * 5 // 8, ph * 5 // 8))
        W, H = SOIL_W * f, SOIL_H * f
        im = Image.new('RGBA', (W, H))
        for y in range(0, H, patch.height):
            for x in range(0, W, patch.width):
                im.paste(patch, (x, y))
        a = np.asarray(im).astype(float)
        a[..., 0] *= 0.5
        a[..., 1] *= 0.48
        a[..., 2] *= 0.46
        # weiches Oval mit leicht unregelmäßigem Rand
        ys, xs = np.mgrid[0:H, 0:W]
        ang = np.arctan2((ys - H / 2) * 2, xs - W / 2)
        wobble = 1 + 0.06 * np.sin(ang * 3 + 0.7) + 0.04 * np.sin(ang * 5 + 2.1)
        d = np.hypot((xs - W / 2) / (W * 0.46), (ys - H / 2) / (H * 0.46)) / wobble
        alpha = np.clip((1 - d) / 0.28, 0, 1)
        a[..., 3] = 255 * alpha ** 1.2
        im = Image.fromarray(a.astype('uint8'))
        im = im.filter(ImageFilter.GaussianBlur(f * 0.4))
        im.save(os.path.join(sprite_draw.A, sub, 'forest_dark_soil.png'), optimize=True)
        if sub == 'hd':
            im.save(os.path.join(sprite_draw.EXPORT, 'forest_dark_soil.png'), optimize=True)
    print('forest_dark_soil', SOIL_W, 'x', SOIL_H)


# das Grundbild (beaver) kommt jetzt aus Sprites/Biber.webp (siehe tools/prepare-characters.js)
# Knabbern kommt jetzt aus Animation/Biber knabbert.webm (siehe tools/prepare-characters.js)
# Schwimmen kommt jetzt aus dem Biber-Sprite (tools/beaver-swim.py)
dam(True).save('forest_beaver_dam_hole')
dam(False).save('forest_beaver_dam')
stick().save('forest_stick')
gnawed_tree().save('forest_gnawed_tree')
lodge().save('forest_beaver_lodge')
if wanted('forest_dark_soil'):
    dark_soil()
