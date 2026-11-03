# Dach der Forschungsstation in der Eiswelt (Platzhalter, bis ein gemaltes Bild da ist; das Regal: tools/shelves.py): flaches Metalldach über der
# Grundfläche der Hütte (5 x 4 Kacheln), vorne eine Blechkante, oben die Sternwarte (Kuppel mit Teleskop, gemalt) und
# zwei Lüftungskästen. Gleiches Format wie hutroof_savanna (384 x 310, obere Ecke der Grundfläche bei 184, 100), in
# public/assets (einfach), hd/ (doppelt, siehe SCALE in src/world/hd.js) und hd2/ (einfach).
# Aufruf: python tools/research-station.py
from PIL import Image, ImageDraw

W, H = 384, 310
TX, TY = 184, 100  # obere Ecke der Grundfläche
RISE = 54  # so hoch liegt das Dach über dem Boden (Oberkante der Wände)
EAVE = 1.05  # Dachüberstand
EDGE = 7  # Dicke der Blechkante
SS = 4  # Kantenglättung: so viel größer zeichnen


def roof(scale):
    k = scale * SS
    img = Image.new('RGBA', (W * k, H * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    P = lambda x, y: (x * k, y * k)

    # Grundfläche: 5 Kacheln entlang tx (je 32, 16), 4 entlang ty (je -32, 16)
    t = (TX, TY - RISE)
    r = (TX + 160, TY + 80 - RISE)
    b = (TX + 32, TY + 144 - RISE)
    l = (TX - 128, TY + 64 - RISE)
    cx = (t[0] + r[0] + b[0] + l[0]) / 4
    cy = (t[1] + r[1] + b[1] + l[1]) / 4
    t, r, b, l = [(cx + (x - cx) * EAVE, cy + (y - cy) * EAVE) for x, y in (t, r, b, l)]
    down = lambda p, h=EDGE: (p[0], p[1] + h)

    # Blechkante vorne (links dunkler, rechts heller), Dachfläche
    d.polygon([P(*l), P(*b), P(*down(b)), P(*down(l))], fill=(92, 104, 118, 255))
    d.polygon([P(*b), P(*r), P(*down(r)), P(*down(b))], fill=(124, 137, 150, 255))
    d.polygon([P(*t), P(*r), P(*b), P(*l)], fill=(176, 189, 201, 255))
    # Blechbahnen: Fugen parallel zu t-r
    for i in range(1, 8):
        f = i / 8
        a = (t[0] + (l[0] - t[0]) * f, t[1] + (l[1] - t[1]) * f)
        e = (r[0] + (b[0] - r[0]) * f, r[1] + (b[1] - r[1]) * f)
        d.line([P(*a), P(*e)], fill=(150, 163, 176, 255), width=max(1, k))
    # helle Kante hinten, dunkle Umrisse
    d.line([P(*l), P(*t), P(*r)], fill=(214, 224, 233, 255), width=2 * k)
    d.line([P(*down(l)), P(*down(b)), P(*down(r))], fill=(52, 60, 70, 255), width=k)
    d.line([P(*l), P(*b), P(*r)], fill=(70, 80, 92, 255), width=k)
    # Schnee auf dem Dach: ein paar weiche Flecken
    for sx, sy, rx in ((cx - 70, cy + 2, 22), (cx + 60, cy + 6, 16), (cx - 10, cy + 38, 18)):
        d.ellipse([P(sx - rx, sy - rx / 2), P(sx + rx, sy + rx / 2)], fill=(240, 246, 251, 230))

    # Lüftungskästen
    def box(x, y, w, h, z):
        top = [(x, y - z), (x + w, y + w / 2 - z), (x + w - h, y + w / 2 + h / 2 - z), (x - h, y + h / 2 - z)]
        d.polygon([P(*top[3]), P(*top[2]), P(top[2][0], top[2][1] + z), P(top[3][0], top[3][1] + z)], fill=(98, 110, 124, 255))
        d.polygon([P(*top[2]), P(*top[1]), P(top[1][0], top[1][1] + z), P(top[2][0], top[2][1] + z)], fill=(128, 141, 154, 255))
        d.polygon([P(*p) for p in top], fill=(160, 172, 184, 255), outline=(70, 80, 92, 255))

    box(cx + 70, cy - 4, 16, 12, 9)
    box(cx - 96, cy + 4, 14, 10, 7)

    # Sternwarte (Sprites/Teleskop Eis.png, freigestellt mit npm run cutout) hinten auf dem Dach: die Mitte des Sockels
    # steht bei kx, ky, mit einem weichen Schatten darunter
    kx, ky = cx - 6, cy - 14
    d.ellipse([P(kx - 34, ky - 15), P(kx + 30, ky + 3)], fill=(90, 102, 116, 110))
    tel = Image.open('Sprites/Teleskop Eis.png').convert('RGBA')
    tel = tel.crop(tel.getbbox())
    f = TELESCOPE_W * k / tel.width
    tel = tel.resize((round(tel.width * f), round(tel.height * f)), Image.LANCZOS)
    img.alpha_composite(tel, (round(kx * k - TELESCOPE_BASE[0] * f), round(ky * k - TELESCOPE_BASE[1] * f)))
    return img.resize((W * scale, H * scale), Image.LANCZOS)


TELESCOPE_W = 92  # so breit ist die Sternwarte auf dem Dach (samt Rohr)
TELESCOPE_BASE = (312, 676)  # Mitte des Sockels unten im zugeschnittenen Bild


for path, scale in (('public/assets/hutroof_ice.png', 1), ('public/assets/hd/hutroof_ice.png', 2), ('public/assets/hd2/hutroof_ice.png', 1)):
    roof(scale).save(path)
    print(path)
