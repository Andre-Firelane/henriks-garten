"""Aufruf: python tools/deco-stand.py   (braucht Pillow)
Deko-Laden im Tierpark aus Sprites/Dekoladen.png (freigestellt aus Sprites/Dekoladen.webp, als PNG gespeichert, mit
npm run cutout -- <png> Sprites/Dekoladen.png 600,440 520,430 700,470 870,470 820,440 260,480 330,320 900,520 790,295
  795,479 734,446 256,514 849,377 874,354 805,380 707,363 262,579 351,332
– die Punkte liegen in eingeschlossenen Hintergrundflächen: unter dem Dach, zwischen Pfosten und Hängepflanzen, im
Rohrbogen, zwischen den Blättern): auf den Umriss zuschneiden und so verkleinern, dass der Stand
etwa 2×2 Kacheln bedeckt. Schreibt public/assets/deco_stand.png und die großen Fassungen in hd/ (4×) und hd2/ (2×).
Fußpunkt (Mitte der 2×2 Kacheln) im Bild: siehe ORIGIN, steht auch in drawDecoShop (GardenScene).
Danach: python tools/make-webp.py ."""
import os
from PIL import Image

A = 'public/assets'
SRC = 'Sprites/Dekoladen.png'
SCALE = 0.155  # Original → Spielgröße (die Grundfläche ist im Original gut 860 Pixel breit, 2 Kacheln = 128)
FOOT = (530, 770)  # Mitte der Grundfläche im Original

im = Image.open(SRC).convert('RGBA')
box = im.getchannel('A').getbbox()
im = im.crop(box)
w, h = round(im.width * SCALE), round(im.height * SCALE)
im.resize((w * 4, h * 4), Image.LANCZOS).save(os.path.join(A, 'hd', 'deco_stand.png'))
im.resize((w * 2, h * 2), Image.LANCZOS).save(os.path.join(A, 'hd2', 'deco_stand.png'))
im.resize((w, h), Image.LANCZOS).save(os.path.join(A, 'deco_stand.png'))
print('Größe', w, h, 'ORIGIN', round((FOOT[0] - box[0]) / (box[2] - box[0]), 3), round((FOOT[1] - box[1]) / (box[3] - box[1]), 3))
