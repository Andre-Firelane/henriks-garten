# Glasfassade ohne Holz (Polarhalle im Tierpark, Eiswelt): hohe, klare Scheiben in schmalen hellen Metallrahmen, dazu
# Eckpfosten und eine Glastür (zwei Flügel). Außerdem dieselbe Art niedrig für das Pinguinbecken in der Halle.
# Maße wie die übrigen Wandstücke: 64 Pixel breit, ein Stück reicht von x 16 bis 48 (eine Kachelkante), die Kachelmitte
# liegt 20 Pixel über dem unteren Bildrand. Gezeichnet in 8-facher Größe und verkleinert; Fassungen für hd/ und hd2/.
#
#   python tools/glass-facade.py
#   → glasswall_x/_y, post_glasswall, gate_glassdoor_x/_y (64×100) und glasslow_x/_y, post_glasslow, gate_glasslow_x/_y
#     (64×64) in public/assets/(hd/, hd2/) und als webp
from PIL import Image, ImageDraw

S = 8
GLASS = (196, 232, 246, 60)
GLASS_DOOR = (176, 220, 240, 95)
SHINE = (255, 255, 255, 80)
SILL = (132, 148, 162, 255)
FRAME = (198, 210, 220, 255)
FRAME_HI = (236, 242, 246, 255)
MULLION = (176, 190, 202, 255)


def save(img, key, w, h):
    for sub, f in (('hd/', 4), ('hd2/', 2), ('', 1)):
        out = img.resize((w * f, h * f), Image.LANCZOS)
        out.save(f'public/assets/{sub}{key}.png')
        out.save(f'public/assets/webp/{sub}{key}.webp', quality=92)


def ends(axis, cy):
    # untere Enden des Stücks (links, rechts) in Spielpixeln
    return ((16, cy - 8), (48, cy + 8)) if axis == 'x' else ((16, cy + 8), (48, cy - 8))


def piece(axis, h, wall, door=False):
    cy = h - 20
    img = Image.new('RGBA', (64 * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, 'RGBA')
    (x0, y0), (x1, y1) = ends(axis, cy)
    P = lambda t, z: ((x0 + (x1 - x0) * t) * S, (y0 + (y1 - y0) * t - z) * S)
    quad = lambda t0, t1, z0, z1, fill: d.polygon([P(t0, z0), P(t1, z0), P(t1, z1), P(t0, z1)], fill=fill)
    # Scheibe(n)
    quad(0, 1, 0, wall, GLASS_DOOR if door else GLASS)
    # Glanz: zwei schräge helle Streifen
    for t, w in ((0.18, 0.08), (0.34, 0.04), (0.66, 0.07)):
        d.polygon([P(t, wall * 0.92), P(t + w, wall * 0.92), P(t + w - 0.12, wall * 0.25), P(t - 0.12, wall * 0.25)], fill=SHINE)
    # Rahmen: Sockel unten, Balken oben, Sprosse in der Mitte (bei der Tür: zwei Flügel mit Griffen und Oberlicht)
    lw = lambda px: max(1, int(px * S))
    d.line([P(0, 1), P(1, 1)], fill=SILL, width=lw(3))
    d.line([P(0, wall), P(1, wall)], fill=FRAME, width=lw(2.4))
    d.line([P(0, wall + 0.8), P(1, wall + 0.8)], fill=FRAME_HI, width=lw(0.9))
    if door:
        d.line([P(0, wall * 0.8), P(1, wall * 0.8)], fill=FRAME, width=lw(1.6))
        d.line([P(0.5, 0), P(0.5, wall * 0.8)], fill=FRAME, width=lw(2))
        for t in (0.04, 0.96):
            d.line([P(t, 0), P(t, wall)], fill=FRAME, width=lw(1.8))
        for t in (0.44, 0.56):
            d.line([P(t, wall * 0.36), P(t, wall * 0.5)], fill=(90, 104, 118, 255), width=lw(1.4))
    else:
        d.line([P(0.5, 0), P(0.5, wall)], fill=MULLION, width=lw(1.4))
    return img


def post(h, wall):
    cy = h - 20
    img = Image.new('RGBA', (64 * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([30.4 * S, (cy - wall - 1.5) * S, 33.6 * S, (cy + 1) * S], fill=FRAME)
    d.rectangle([30.4 * S, (cy - wall - 1.5) * S, 31.3 * S, (cy + 1) * S], fill=FRAME_HI)
    d.rectangle([32.8 * S, (cy - wall - 1.5) * S, 33.6 * S, (cy + 1) * S], fill=(150, 164, 176, 255))
    return img


for name, h, wall, door_key in (('glasswall', 100, 66, 'gate_glassdoor'), ('glasslow', 64, 30, 'gate_glasslow')):
    for axis in ('x', 'y'):
        save(piece(axis, h, wall), f'{name}_{axis}', 64, h)
        save(piece(axis, h, wall, door=True), f'{door_key}_{axis}', 64, h)
    save(post(h, wall), f'post_{name}', 64, h)
print('ok')
