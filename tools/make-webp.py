"""Aufruf: python tools/make-webp.py .   (braucht Pillow)
WebP-Fassungen der Spielbilder für Handy und Tablet nach public/assets/webp/ schreiben: alle PNGs aus public/assets,
public/assets/hd (HD-Bilder des Tablets) und public/assets/hd2 (die des Handys), Qualität 90, Transparenz verlustfrei
(keine Säume zwischen den Bildern eines Spritesheets). Nur Bilder, deren WebP fehlt oder älter als das PNG ist, werden
neu geschrieben. Das Spiel lädt diese Fassungen auf Handy und Tablet (siehe webpUrl in src/scenes/BootScene.js); der
Build bricht ab, wenn eine fehlt, und warnt, wenn eine veraltet ist (vite.config.js). Nach neuen oder geänderten
Sprites also dieses Skript laufen lassen."""
import sys, os
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
A = os.path.join(ROOT, 'public/assets')
OUT = os.path.join(A, 'webp')
QUALITY = 90

done = skipped = 0
before = after = 0
for sub in ['', 'hd', 'hd2']:
    src_dir = os.path.join(A, sub)
    out_dir = os.path.join(OUT, sub)
    os.makedirs(out_dir, exist_ok=True)
    for name in sorted(os.listdir(src_dir)):
        if not name.endswith('.png'):
            continue
        src = os.path.join(src_dir, name)
        out = os.path.join(out_dir, name[:-4] + '.webp')
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
            skipped += 1
            continue
        im = Image.open(src)
        im = im.convert('RGBA') if im.mode in ('P', 'LA', 'RGBA', 'PA') or 'transparency' in im.info else im.convert('RGB')
        im.save(out, 'WEBP', quality=QUALITY, alpha_quality=100, method=5)
        before += os.path.getsize(src)
        after += os.path.getsize(out)
        done += 1

print(f'{done} WebP neu ({before / 1048576:.1f} MB PNG -> {after / 1048576:.1f} MB WebP), {skipped} schon aktuell')
