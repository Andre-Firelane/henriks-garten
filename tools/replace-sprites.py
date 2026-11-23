"""Aufruf: python tools/replace-sprites.py <Ordner> [Namensanfang, z. B. toy_]   (braucht Pillow)
Überarbeitete Bilder von Andre (freigestellte PNGs, z. B. aus scenario-assets) an die Stelle von Claudes Bildern setzen:
MAP sagt, welche Datei welches Bild im Spiel ersetzt. Jedes neue Bild wird auf seinen Umriss zugeschnitten und so in die
alten Bilder gesetzt, dass es den Umriss des alten ausfüllt (Seitenverhältnis bleibt) und unten mittig dort steht, wo das
alte stand – so bleiben Größe und Fußpunkt im Spiel gleich (Symbole: mittig). Das gilt für alle vorhandenen Fassungen
(public/assets, hd/, hd2/). Die Originale kommen nach Sprites/Andre/<key>.png, Claudes Fassung verschwindet aus
Claude-Sprites. Danach: python tools/make-webp.py ."""
import glob
import os
import shutil
import sys
from PIL import Image

A = 'public/assets'
# je Ordner: Datei → Bild im Spiel. scenario-assets (7): Blätter, Bäume, Stupa und Eicheln waren schon vorher im Spiel;
# die Spielzeuge wurden erst am 23.11.2026 eingesetzt (python tools/replace-sprites.py "…/scenario-assets (7)" toy_)
SETS = {}
SETS['scenario-assets (7)'] = {
    'Wald_neu-2.png': 'leaf_branch', 'Wald_neu-3.png': 'leaf_bush', 'Wald_neu-4.png': 'leaf_bush_bare', 'Wald_neu-5.png': 'stupa',
    'Wald_neu-6.png': 'toy_cat_basket', 'Wald_neu-7.png': 'toy_climb_ropes', 'Wald_neu-8.png': 'toy_hay_bale',
    'Wald_neu-9.png': 'toy_lianas', 'Wald_neu-10.png': 'toy_prey_sack', 'Wald_neu-11.png': 'toy_salt_lick',
    'Wald_neu-12.png': 'toy_scratch_post', 'Wald_neu-13.png': 'toy_slide', 'Wald_neu-14.png': 'toy_straw_nest',
    'Wald_neu-15.png': 'toy_sun_rock', 'Wald_neu-16.png': 'toy_swing_rings', 'Wald_neu-17.png': 'toy_termite_mound',
    'Wald_neu-18.png': 'toy_tree_platform', 'Wald_neu-19.png': 'toy_woodpile', 'Wald_neu-20.png': 'toy_yarn_ball',
    'Wald_neu-21.png': 'acorns', 'Wald_neu-22.png': 'forest_birch', 'Wald_neu-23.png': 'forest_bogtree',
    'Wald_neu-24.png': 'forest_bogtree2', 'Wald_neu-25.png': 'forest_oak', 'Wald_neu-26.png': 'ball',
    'Wald_neu-27.png': 'bonus_binoculars', 'Wald_neu-28.png': 'bonus_heartRain', 'Wald_neu-29.png': 'charm_bait',
    'Wald_neu-30.png': 'charm_bigCage', 'Wald_neu-31.png': 'charm_teddy', 'Wald_neu-32.png': 'drum',
}
# Werkzeuge (22.11.2026): Hand, Laterne, Lasso, Kescher, Angel
SETS['scenario-assets (8)'] = {
    'Wald_neu.png': 'hand', 'Wald_neu-2.png': 'lantern', 'Wald_neu-3.png': 'lasso', 'Wald_neu-4.png': 'net', 'Wald_neu-5.png': 'rod',
}
# Bilder, die es bisher nur klein gab: dazu die großen Fassungen hd/ (4×) und hd2/ (2×) anlegen (und in src/world/hd.js
# eintragen), damit Andres Zeichnung scharf bleibt
MAKE_HD = {'hand', 'lantern', 'lasso', 'net', 'rod'}
# Symbole und Dinge in der Hand: mittig statt unten ausrichten
CENTER = {'bonus_binoculars', 'bonus_heartRain', 'charm_bait', 'charm_bigCage', 'charm_teddy', 'drum', 'ball', 'hand', 'lantern', 'lasso', 'net', 'rod'}


def content(im):
    """Bild ohne den fast unsichtbaren Hauch am Rand, auf den Umriss zugeschnitten."""
    im = im.convert('RGBA')
    alpha = im.getchannel('A').point(lambda v: 0 if v < 24 else v)
    im.putalpha(alpha)
    return im.crop(alpha.getbbox())


def place(new, old_path, center, scale=1, out_path=None):
    """scale/out_path: aus dem kleinen Bild eine große Fassung (scale-mal so groß) nach out_path machen"""
    old = Image.open(old_path).convert('RGBA')
    box = old.getchannel('A').point(lambda v: 0 if v < 24 else 255).getbbox() or (0, 0, old.width, old.height)
    if scale != 1:
        old = Image.new('RGBA', (old.width * scale, old.height * scale), (0, 0, 0, 0))
        box = tuple(v * scale for v in box)
    bw, bh = box[2] - box[0], box[3] - box[1]
    k = min(bw / new.width, bh / new.height)
    w, h = max(1, round(new.width * k)), max(1, round(new.height * k))
    img = new.resize((w, h), Image.LANCZOS)
    out = Image.new('RGBA', old.size, (0, 0, 0, 0))
    x = round((box[0] + box[2]) / 2 - w / 2)
    y = round((box[1] + box[3]) / 2 - h / 2) if center else box[3] - h
    out.alpha_composite(img, (x, y))
    out.save(out_path or old_path)


src_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
MAP = SETS[os.path.basename(os.path.normpath(src_dir))]
# optional: nur Bilder, deren Name so anfängt (z. B. toy_)
if len(sys.argv) > 2:
    MAP = {n: k for n, k in MAP.items() if k.startswith(sys.argv[2])}
os.makedirs('Sprites/Andre', exist_ok=True)
for name, key in MAP.items():
    src = os.path.join(src_dir, name)
    if not os.path.exists(src):
        print('fehlt:', src)
        continue
    new = content(Image.open(src))
    small = os.path.join(A, key + '.png')
    if key in MAKE_HD and not os.path.exists(os.path.join(A, 'hd', key + '.png')):
        place(new, small, key in CENTER, 4, os.path.join(A, 'hd', key + '.png'))
        place(new, small, key in CENTER, 2, os.path.join(A, 'hd2', key + '.png'))
        place(new, small, key in CENTER)
        paths = [small, 'hd', 'hd2']
    else:
        paths = [p for p in (small, os.path.join(A, 'hd', key + '.png'), os.path.join(A, 'hd2', key + '.png')) if os.path.exists(p)]
        for p in paths:
            place(new, p, key in CENTER)
    shutil.copy(src, os.path.join('Sprites/Andre', key + '.png'))
    for old in glob.glob(f'Claude-Sprites/*/{key}.png'):
        os.remove(old)
    print(f'{key}: {len(paths)} Fassung(en)')
