"""Aufruf: python tools/hd-phone.py   (nach tools/hd-sprites.py; braucht Pillow)
Handy-Fassung der großen Bilder: public/assets/hd/ halb so groß nach public/assets/hd2/ (ein Viertel des Speichers).
Faktoren wie in src/world/hd.js: dort 4-fach -> hier 2-fach; 2-fach -> 1-fach; 1-fach bleibt."""
import os, re
from PIL import Image

SRC, OUT = 'public/assets/hd', 'public/assets/hd2'
# Faktoren aus hd.js lesen (SCALE = { key: f, ... }), sonst HD_SCALE
js = open('src/world/hd.js', encoding='utf-8').read()
HD_SCALE = int(re.search(r'HD_SCALE = (\d+)', js).group(1))
SCALE = {k: int(v) for k, v in re.findall(r'(\w+): (\d+)', re.search(r'const SCALE = \{([^}]*)\}', js).group(1))}

os.makedirs(OUT, exist_ok=True)
for name in sorted(os.listdir(SRC)):
    if not name.endswith('.png'):
        continue
    f = SCALE.get(name[:-4], HD_SCALE)
    phone = max(1, f // 2)
    im = Image.open(f'{SRC}/{name}')
    if phone != f:
        im = im.resize((im.width * phone // f, im.height * phone // f), Image.LANCZOS)
    im.save(f'{OUT}/{name}', optimize=True)
print('ok', len(os.listdir(OUT)))
