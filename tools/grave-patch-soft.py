"""Aufruf: python tools/grave-patch-soft.py   (braucht Pillow)
Dunkler Boden des Elefantenfriedhofs für die Expedition (savanna_grave_patch_soft): Das Original endet rechts hart, weil es
in der Savanne am Kartenrand liegt. Auf der kleinen Expeditions-Map liegt es mitten im Gelände – hier läuft es ringsum weich
aus (Rand nach innen geschoben und verwischt). Schreibt die normale und die HD-Fassung; danach tools/make-webp.py laufen lassen."""
from PIL import Image, ImageChops, ImageFilter

A = 'public/assets'
for sub, k in [('', 1), ('hd/', 2)]:
    im = Image.open(f'{A}/{sub}savanna_grave_patch.png').convert('RGBA')
    a = im.getchannel('A')
    # Rand verkleinern (auf halber Größe, das geht schneller) und dann weich verwischen
    small = a.resize((a.width // 2, a.height // 2))
    for _ in range(6 * k):
        small = small.filter(ImageFilter.MinFilter(5))
    eroded = small.resize(a.size)
    soft = eroded.filter(ImageFilter.GaussianBlur(26 * k))
    im.putalpha(ImageChops.darker(a, soft))
    im.save(f'{A}/{sub}savanna_grave_patch_soft.png')
    print(sub or 'normal', im.size)
