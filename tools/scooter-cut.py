"""E-Roller im Tierpark aus Andres Bildern auf Grün ausschneiden (Sprites/E-Roller.webp leer, Sprites/E-Roller besetzt.webp
mit Henrik; je vier Ansichten nebeneinander in der Reihenfolge unten rechts, unten links, oben rechts, oben links).

Nur das helle Hintergrundgrün verschwindet (der Roller selbst ist dunkelgrün); an den Kanten weich und ohne grünen
Schimmer. Ergebnis: Bildstreifen mit 4 Bildern wie bei der Spielfigur, je FRAME × FRAME (170), Fußpunkt (Unterkante der Räder)
FOOT px über dem Rand:
  public/assets/scooter.png        mit Henrik (beim Fahren)
  public/assets/scooter_empty.png  leer (abgestellt)
  public/assets/scooter_icon.png   ein Bild davon (Symbol in der Werkzeugleiste)
dazu Kopien in Roller-Sprites/ und jede Ansicht einzeln in voller Größe in Roller-Sprites/einzeln/.
Aufruf: python tools/scooter-cut.py  (danach python tools/make-webp.py .)
"""
import os

import numpy as np
from PIL import Image

FRAME, FOOT = 170, 6
RIDER_H = 134  # Henrik mit Helm auf dem Roller, vom Helm bis zur Unterkante der Räder (zu Fuß ist die Figur 108 hoch)
SOURCES = {'scooter': 'Sprites/E-Roller besetzt.webp', 'scooter_empty': 'Sprites/E-Roller.webp'}
NAMES = ['1_unten_rechts', '2_unten_links', '3_oben_rechts', '4_oben_links']  # Reihenfolge wie FRAME in src/player/Player.js


def cut_green(path):
    a = np.array(Image.open(path).convert('RGB')).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lead = g - np.maximum(r, b)
    # helles Hintergrundgrün (g um 235, Vorsprung um 170): ganz weg; Kantenpixel (Mischung mit dem Roller): halb
    alpha = np.clip((150 - lead) / 70, 0, 1)
    alpha[g < 120] = 1  # dunkles Grün (Roller, Schatten im Bild) bleibt immer
    rgb = a.copy()
    spill = (lead > 0) & (alpha < 1)
    rgb[..., 1] = np.where(spill, np.maximum(r, b) + (g - np.maximum(r, b)) * alpha * 0.4, g)  # grünen Schimmer an Kanten dämpfen
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')


def views(path, count=4):
    """Die Ansichten nebeneinander: getrennt an den breitesten leeren Spalten."""
    im = cut_green(path)
    al = np.array(im)[..., 3]
    filled = (al > 60).sum(0) > 0
    runs = []
    x = 0
    while x < len(filled):
        if filled[x]:
            x0 = x
            while x < len(filled) and filled[x]:
                x += 1
            runs.append([x0, x])
        x += 1
    while len(runs) > count:  # kleinste Lücke schließen (Teile derselben Figur)
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = gaps.index(min(gaps))
        runs[i:i + 2] = [[runs[i][0], runs[i + 1][1]]]
    out = []
    for x0, x1 in runs:
        part = im.crop((x0, 0, x1, im.height))
        out.append(part.crop(part.getbbox()))
    return out


def main():
    os.makedirs('Roller-Sprites/einzeln', exist_ok=True)
    rider = views(SOURCES['scooter'])
    scale = RIDER_H / max(v.height for v in rider)
    for name, src in SOURCES.items():
        parts = rider if name == 'scooter' else views(src)
        sheet = Image.new('RGBA', (FRAME * 4, FRAME))
        for n, img in enumerate(parts):
            img.save(f'Roller-Sprites/einzeln/{name}_{NAMES[n]}.png')
            small = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
            sheet.alpha_composite(small, (n * FRAME + (FRAME - small.width) // 2, max(0, FRAME - FOOT - small.height)))
        sheet.save(f'public/assets/{name}.png')
        sheet.save(f'Roller-Sprites/{name}.png')
        if name == 'scooter_empty':
            icon = sheet.crop((0, 0, FRAME, FRAME))
            icon.crop(icon.getbbox()).save('public/assets/scooter_icon.png')  # ohne leeren Rand
        print(name, len(parts), 'Ansichten, Maßstab', round(scale, 3))


if __name__ == '__main__':
    main()
