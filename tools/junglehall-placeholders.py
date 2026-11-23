"""Aufruf: python tools/junglehall-placeholders.py          Platzhalter zeichnen (große Fassung) und alle Größen erzeugen
        python tools/junglehall-placeholders.py --from-hd  nur die kleinen Fassungen aus public/assets/hd/ neu erzeugen
                                                           (z. B. nachdem Andre die Bilder in hd/ überarbeitet hat)
Platzhalter für die Tropenhalle (docs/plan-dschungel.md): Eingang mit Lamellenvorhang (gate_curtain_x, gate_curtain_y, aus
dem Glastor: statt der Scheiben senkrechte Plastikstreifen) und der Obstteller auf einem Pfosten (fruit_plate), auf dem die
Schmetterlinge sitzen, und ein großer Strauch mit riesigen Blättern (jungle_shrub, aus jungle_plant).
Gezeichnet in der großen Fassung (4× so groß wie im Spiel, wie public/assets/hd/), daraus hd2/ (2×) und die Spielgröße.
Kopien zum Überarbeiten: Claude-Sprites/Dschungel und Bambuswald. Größe und Fußpunkt müssen beim Überarbeiten gleich bleiben.
Danach: python tools/make-webp.py ."""
import os
import sys
from PIL import Image, ImageDraw

A = 'public/assets'
OUT_COPY = 'Claude-Sprites/Dschungel und Bambuswald'
LINE = (60, 36, 18, 255)


def curtain(axis):
    """Lamellenvorhang: Rahmen des Glastors, die Scheiben (hellblau) werden zu senkrechten, halb durchsichtigen Streifen
    mit dunkleren Kanten; der mittlere Querbalken bleibt als Stange oben am Vorhang nicht stehen (er wird zu Streifen)."""
    im = Image.open(f'{A}/hd/gate_glass_{axis}.png').convert('RGBA')
    px = im.load()
    w, h = im.size
    wood = lambda r, g, b: r > g + 25 and g > b  # Holz des Rahmens (braun bzw. orange)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 40 or wood(r, g, b) or (r < 90 and g < 70):
                continue
            if b > 180 and r > 120:  # Glas: hellblau bis weiß
                k = x % 20
                if k in (0, 1):
                    px[x, y] = (120, 150, 160, 200)  # Kante eines Streifens
                elif k in (2, 3):
                    px[x, y] = (255, 255, 255, 170)  # Glanz
                else:
                    px[x, y] = (210, 232, 236, 120)
    return im


def fruit_plate():
    """Obstteller auf einem Holzpfosten: flacher Teller mit Orangenhälften, Bananenstücken und einer Melonenscheibe.
    Fußpunkt: Kachelmitte bei y = 56 (Spielgröße)."""
    W, H, F = 256, 256, 224
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = W / 2
    d.ellipse((cx - 30, F - 10, cx + 30, F + 10), fill=(0, 0, 0, 60))
    d.rectangle((cx - 9, 96, cx + 9, F), fill=(122, 80, 44, 255), outline=LINE, width=5)
    d.line(((cx - 3, 100), (cx - 3, F - 4)), fill=(160, 112, 66, 255), width=4)
    # Teller
    d.ellipse((cx - 70, 76, cx + 70, 120), fill=(176, 120, 70, 255), outline=LINE, width=6)
    d.ellipse((cx - 58, 74, cx + 58, 108), fill=(214, 168, 112, 255), outline=LINE, width=4)
    # Melonenscheibe
    d.pieslice((cx - 52, 52, cx + 4, 104), 180, 360, fill=(80, 160, 70, 255), outline=LINE, width=4)
    d.pieslice((cx - 46, 58, cx - 2, 98), 180, 360, fill=(232, 82, 84, 255))
    for x in (cx - 34, cx - 24, cx - 14):
        d.ellipse((x - 2, 70, x + 2, 74), fill=(40, 30, 20, 255))
    # Orangenhälften
    for ox, oy in ((cx + 20, 80), (cx + 40, 90)):
        d.ellipse((ox - 18, oy - 12, ox + 18, oy + 12), fill=(240, 150, 40, 255), outline=LINE, width=4)
        d.ellipse((ox - 12, oy - 8, ox + 12, oy + 8), fill=(255, 196, 90, 255))
        for k in range(6):
            import math
            t = k * math.pi / 3
            d.line(((ox, oy), (ox + math.cos(t) * 11, oy + math.sin(t) * 7)), fill=(240, 160, 60, 255), width=2)
    # Bananenstücke
    for bx, by in ((cx - 20, 96), (cx + 2, 100)):
        d.ellipse((bx - 10, by - 7, bx + 10, by + 7), fill=(250, 226, 120, 255), outline=LINE, width=3)
        d.ellipse((bx - 4, by - 3, bx + 4, by + 3), fill=(236, 206, 100, 255))
    return im


def big_shrub():
    """Großer Strauch mit riesigen Blättern (Ǫ): aus der kleinen großblättrigen Bodenpflanze (jungle_plant), viele Kopien
    groß, gedreht und hinten dunkler übereinander. 128 × 128 (Spielgröße), Fußpunkt y = 116."""
    from PIL import ImageEnhance
    leaf = Image.open(f'{A}/hd/jungle_plant.png').convert('RGBA')
    leaf = leaf.crop(leaf.getbbox())
    W, H, F = 512, 512, 464
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((W / 2 - 150, F - 26, W / 2 + 150, F + 26), fill=(0, 0, 0, 55))
    # (Versatz x, Fuß y über F, Größe, Drehung, Helligkeit), hinten zuerst
    parts = [(-110, 120, 1.7, 28, 0.62), (110, 120, 1.7, -28, 0.62), (0, 170, 1.9, 0, 0.66),
             (-130, 40, 1.9, 34, 0.8), (130, 40, 1.9, -34, 0.8), (-60, 90, 2.1, 14, 0.86), (60, 90, 2.1, -14, 0.86),
             (-70, 0, 2.2, 20, 1.0), (70, 0, 2.2, -20, 1.0), (0, 30, 2.4, 0, 1.06)]
    for dx, up, k, rot, light in parts:
        part = leaf.resize((int(leaf.width * k), int(leaf.height * k)), Image.LANCZOS)
        part = ImageEnhance.Brightness(part).enhance(light)
        part = part.rotate(rot, resample=Image.BICUBIC, expand=True)
        x = int(W / 2 + dx - part.width / 2)
        y = int(F - up - part.height + 48)
        im.alpha_composite(part, (max(0, x), max(0, y)))
    return im


def save_sizes(key, big):
    big.save(f'{A}/hd/{key}.png')
    w, h = big.size
    big.resize((w // 2, h // 2), Image.LANCZOS).save(f'{A}/hd2/{key}.png')
    big.resize((w // 4, h // 4), Image.LANCZOS).save(f'{A}/{key}.png')
    os.makedirs(OUT_COPY, exist_ok=True)
    big.save(f'{OUT_COPY}/{key}.png')


KEYS = ('gate_curtain_x', 'gate_curtain_y', 'jungle_shrub')  # (den Obstteller hat Andre gezeichnet: tools/fruit-plate.py)

if __name__ == '__main__':
    if '--from-hd' in sys.argv:
        for key in KEYS:
            save_sizes(key, Image.open(f'{A}/hd/{key}.png').convert('RGBA'))
    else:
        save_sizes('gate_curtain_x', curtain('x'))
        save_sizes('gate_curtain_y', curtain('y'))
        save_sizes('jungle_shrub', big_shrub())
    print('fertig')
