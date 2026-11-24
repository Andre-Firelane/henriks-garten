"""Aufruf: python tools/stall-cut.py   (braucht Pillow)
Stall im Tierpark aus Sprites/Stall.png (freigestellt aus Sprites/Stall.webp, als PNG gespeichert, mit
npm run cutout -- <png> Sprites/Stall.png): auf den Umriss zuschneiden und so verkleinern, dass die Scheune 2 × 3 Kacheln
bedeckt (Giebelseite 2 Kacheln, Längsseite mit Tor 3 Kacheln). Schreibt public/assets/stall.png und die großen Fassungen
in hd/ (4×) und hd2/ (2×). Fußpunkt (unterste Ecke der Grundfläche) und Schild auf dem Dach: siehe Ausgabe, steht auch in
drawStable (GardenScene). Danach: python tools/make-webp.py ."""
import os
from PIL import Image

A = 'public/assets'
SRC = 'Sprites/Stall.png'
SCALE = 0.31  # Original → Spielgröße (Giebelseite im Original 210 Pixel breit, 2 Kacheln = 64)
FOOT = (478, 655)  # unterste Ecke der Grundfläche im Original
SIGN = (586, 355)  # Mitte des Schilds auf dem Dach im Original

im = Image.open(SRC).convert('RGBA')
box = im.getchannel('A').getbbox()
im = im.crop(box)
w, h = round(im.width * SCALE), round(im.height * SCALE)
im.resize((w * 4, h * 4), Image.LANCZOS).save(os.path.join(A, 'hd', 'stall.png'))
im.resize((w * 2, h * 2), Image.LANCZOS).save(os.path.join(A, 'hd2', 'stall.png'))
im.resize((w, h), Image.LANCZOS).save(os.path.join(A, 'stall.png'))
print('Größe', w, h, 'ORIGIN', round((FOOT[0] - box[0]) / (box[2] - box[0]), 3), round((FOOT[1] - box[1]) / (box[3] - box[1]), 3),
      'SCHILD', round((SIGN[0] - FOOT[0]) * SCALE, 1), round((SIGN[1] - FOOT[1]) * SCALE, 1))
