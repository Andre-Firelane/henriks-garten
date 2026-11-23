"""Aufruf: python tools/tall-fence-straighten.py
Hoher Wildzaun entlang tx (tall_x): die Seile fielen zwischen den Pfosten steiler ab als die Kachelkante (gut 0,6 statt
0,5), dadurch saßen sie am nächsten Pfosten tiefer als ihre Fortsetzung, und der Zaun wirkte geknickt. Hier wird nur der
Bereich zwischen den beiden Pfosten (Spalten X0 … X1 der HD-Fassung) geschert, so dass die Seile genau mit 0,5 fallen;
die Pfosten bleiben, wo sie sind. Daraus werden hd2/ und die Spielgröße neu erzeugt. Nur einmal auf das Original
anwenden! Danach: python tools/make-webp.py ."""
from PIL import Image

A = 'public/assets'
X0, X1 = 81, 171      # zwischen linkem und rechtem Pfosten (HD-Pixel)
SHIFT = 9             # so viel höher müssen die Seile am rechten Ende liegen
c = SHIFT / (X1 - X0)

im = Image.open(f'{A}/hd/tall_x.png').convert('RGBA')
W, H = im.size
mid = im.crop((X0, 0, X1 + 1, H))
# Ausgabe (x, y) nimmt das Eingabepixel (x, y + c·x): rechts weiter oben
mid = mid.transform(mid.size, Image.AFFINE, (1, 0, 0, c, 1, 0), resample=Image.BICUBIC)
out = im.copy()
out.paste(Image.new('RGBA', mid.size, (0, 0, 0, 0)), (X0, 0))
out.alpha_composite(mid, (X0, 0))
# die Pfosten wieder darüber (falls die Seile hineinragen): Spalten außerhalb unverändert aus dem Original
out.paste(im.crop((0, 0, X0, H)), (0, 0))
out.paste(im.crop((X1 + 1, 0, W, H)), (X1 + 1, 0))
out.save(f'{A}/hd/tall_x.png')
out.resize((W // 2, H // 2), Image.LANCZOS).save(f'{A}/hd2/tall_x.png')
out.resize((W // 4, H // 4), Image.LANCZOS).save(f'{A}/tall_x.png')
print('fertig')
