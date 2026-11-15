"""Zooauto (Schnellreise) in hoher Auflösung: wird im Spiel vergrößert gezeigt (scale 1.26), das 240 × 140 große Bild
war dabei unscharf. Aus Sprites/Zooauto.png (1024 × 572) entsteht dasselbe Bild in 4-facher (hd/) und 2-facher (hd2/,
Handy) Größe, genau so gelegt wie public/assets/car_zoo.png (gleiche Umrisse, gleicher Fußpunkt).
Aufruf: python tools/car-hd.py  (danach python tools/make-webp.py .)
"""
from PIL import Image

SRC = 'Sprites/Zooauto.png'
SMALL = 'public/assets/car_zoo.png'

small = Image.open(SMALL).convert('RGBA')
box = small.getchannel('A').point(lambda a: 255 if a > 128 else 0).getbbox()
src = Image.open(SRC).convert('RGBA')
src = src.crop(src.getchannel('A').point(lambda a: 255 if a > 128 else 0).getbbox())
for factor, folder in ((4, 'hd'), (2, 'hd2')):
    w, h = (box[2] - box[0]) * factor, (box[3] - box[1]) * factor
    out = Image.new('RGBA', (small.width * factor, small.height * factor))
    out.alpha_composite(src.resize((w, h), Image.LANCZOS), (box[0] * factor, box[1] * factor))
    out.save(f'public/assets/{folder}/car_zoo.png')
    print(folder, out.size, 'Auto', (w, h))
