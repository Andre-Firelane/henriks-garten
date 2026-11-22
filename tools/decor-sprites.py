"""Aufruf: python tools/decor-sprites.py   (braucht Pillow und Node für tools/remove-background.js)
Neue Deko-Bilder (Liste: Deko-Sprites/LIESMICH.txt) aus Sprites/ ins Spiel bringen: Hintergrund freistellen (weiß, wie
npm run cutout), auf den Umriss zuschneiden, auf die Spielgröße bringen und als public/assets/<key>.png sowie hd/ (4×)
und hd2/ (2×) speichern; danach die WebP-Fassungen (tools/make-webp.py). Bilder, die noch fehlen, werden übersprungen.
Gibt je Teil Größe und Fußpunkt (originY) aus – die Angaben für DECOR in src/world/decor.js."""
import os
import subprocess
import sys
from PIL import Image

A = 'public/assets'
SRC = 'Sprites'
TMP = os.path.join('Sprites', '_decor_tmp')

# Datei in Sprites/ → (key, Breite im Spiel in Pixeln, Fuß: so viele Pixel über dem untersten Punkt steht die Kachelmitte)
# Eine Kachel ist 64 Pixel breit (Raute); schmale Dinge (Laterne) bleiben schmaler, flache füllen die Raute.
# Breiten wie die Platzhalter (tools/decor-placeholders.py), damit die Teile gleich groß bleiben.
ITEMS = {
    'Parklaterne': ('park_lantern', 24, 3),
    'Wegsteine': ('stepping_stones', 64, 16),
    'Hecke': ('hedge', 64, 16),
    'Blumenbogen': ('flower_arch', 64, 12),
    'Lichterkette': ('lantern_post', 40, 2),
    'Goldener Brunnen': ('golden_fountain', 72, 18),
    'Pavillon': ('pavilion', 128, 52),  # 2×2 Kacheln: Fuß = Mitte der Grundfläche
    'Schneemann': ('snowman', 40, 2),
    'Anker': ('anchor', 48, 6),
}


def source(name):
    for ext in ('.webp', '.png', '.jpg', '.jpeg'):
        p = os.path.join(SRC, name + ext)
        if os.path.exists(p):
            return p
    return None


def cut_out(path):
    """Bild mit Transparenz; auf Weiß gelieferte Bilder stellt tools/remove-background.js frei."""
    im = Image.open(path)
    if im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] < 255:
        return im
    os.makedirs(TMP, exist_ok=True)
    src = os.path.join(TMP, 'in.png')
    out = os.path.join(TMP, 'out.png')
    im.convert('RGB').save(src)
    subprocess.run(['node', 'tools/remove-background.js', src, out], check=True, capture_output=True)
    return Image.open(out).convert('RGBA')


done = 0
for name, (key, width, foot) in ITEMS.items():
    path = source(name)
    if not path:
        print(f'fehlt noch: {SRC}/{name}')
        continue
    im = cut_out(path)
    # fast unsichtbare Pixel (Hauch am Rand mancher Bilder) weg, sonst schneidet der Umriss zu groß zu
    alpha = im.getchannel('A').point(lambda v: 0 if v < 24 else v)
    im.putalpha(alpha)
    im = im.crop(alpha.getbbox())
    w = width
    h = round(im.height * width / im.width)
    im.resize((w * 4, h * 4), Image.LANCZOS).save(os.path.join(A, 'hd', key + '.png'))
    im.resize((w * 2, h * 2), Image.LANCZOS).save(os.path.join(A, 'hd2', key + '.png'))
    im.resize((w, h), Image.LANCZOS).save(os.path.join(A, key + '.png'))
    print(f'{name}: {key} {w}x{h}, originY: {h - foot} / {h}')
    done += 1

if os.path.isdir(TMP):
    for f in os.listdir(TMP):
        os.remove(os.path.join(TMP, f))
    os.rmdir(TMP)
if done:
    subprocess.run([sys.executable, 'tools/make-webp.py', '.'], check=True)
print(f'{done} Bild(er) verarbeitet')
