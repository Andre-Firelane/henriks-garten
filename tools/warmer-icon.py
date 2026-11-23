"""Platzhalter-Bild der Wärmflasche (Eiswelt, Walross): rote Gummiflasche mit Rippen, Hals und Verschluss, darüber zwei
Dampfkringel. Gezeichnet in 256 x 256, gespeichert als public/assets/warmer.png (64 x 64).
Aufruf: python tools/warmer-icon.py"""
from PIL import Image, ImageDraw, ImageFilter

S = 256
img = Image.new('RGBA', (S, S))
d = ImageDraw.Draw(img)
OUT = (70, 20, 20, 255)
# Körper (leicht schräg gezeichnet wäre schöner; Platzhalter gerade)
d.rounded_rectangle([58, 92, 198, 236], radius=34, fill=(214, 58, 52, 255), outline=OUT, width=7)
# Schultern und Hals
d.polygon([(84, 96), (172, 96), (150, 66), (106, 66)], fill=(214, 58, 52, 255), outline=OUT)
d.line([(84, 96), (106, 66)], fill=OUT, width=7)
d.line([(172, 96), (150, 66)], fill=OUT, width=7)
d.rectangle([108, 44, 148, 70], fill=(196, 48, 44, 255), outline=OUT, width=6)
# Verschluss
d.rounded_rectangle([100, 24, 156, 50], radius=8, fill=(240, 196, 70, 255), outline=OUT, width=6)
# Rippen
for y in range(120, 220, 18):
    d.line([(82, y), (174, y)], fill=(236, 110, 100, 255), width=6)
# Glanz
d.rounded_rectangle([74, 108, 92, 200], radius=8, fill=(250, 160, 150, 200))
# Dampf
steam = Image.new('RGBA', (S, S))
ds = ImageDraw.Draw(steam)
for x0 in (180, 210):
    ds.arc([x0 - 20, 8, x0 + 8, 44], 200, 40, fill=(255, 255, 255, 230), width=7)
    ds.arc([x0 - 12, 34, x0 + 16, 70], 20, 220, fill=(255, 255, 255, 230), width=7)
steam = steam.filter(ImageFilter.GaussianBlur(1.2))
img.alpha_composite(steam)
img.resize((64, 64), Image.LANCZOS).save('public/assets/warmer.png')
print('ok')
