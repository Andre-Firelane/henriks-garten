# Jaguar: aus der Steh-Animation (jaguar_idle.png, der Körper steht still, der Schwanz schwingt nach oben) den Schwanz
# ausschneiden und umdrehen: so hängt er im Baum aus der Krone herunter und pendelt genauso (jaguar_tail_idle.png).
# Für den Panther (nur Standbilder) dieselben Bilder schwarz eingefärbt (panther_tail_idle.png).
# Aufruf (nach npm run characters): python tools/jaguar-tail.py
# Die Lage des Ansatzes im Bild (BASE) steht auch in src/animals/Jaguar.js (TAIL_ORIGIN).
import numpy as np
from PIL import Image

FW, FH = 104, 96  # Bildgröße der Steh-Animation
COUNT = 85  # Bilder darin
CUT = 48  # ausgeschnittenes Stück: links oben CUT×CUT
BASE = (31, 41)  # dort setzt der Schwanz am Rücken an (im Bild der Steh-Animation)

sheet = np.asarray(Image.open('public/assets/jaguar_idle.png').convert('RGBA'))
cols = sheet.shape[1] // FW
y, x = np.mgrid[0:CUT, 0:CUT]
# nur der Schwanz: links oberhalb des Rückens (der Kopf beginnt weiter rechts)
mask = ((x < 46) & (y < 39)) | ((x < 27) & (y < 45))
frames = []
for i in range(COUNT):
    fx, fy = (i % cols) * FW, (i // cols) * FH
    f = sheet[fy:fy + CUT, fx:fx + CUT].copy()
    f[~mask] = 0
    frames.append(f[::-1])  # umgedreht: hängt herunter
out = np.concatenate(frames, axis=1)
Image.fromarray(out, 'RGBA').save('public/assets/jaguar_tail_idle.png')
# Panther: schwarz (Helligkeit bleibt als leichte Schattierung)
dark = out.copy().astype(float)
lum = dark[..., :3].mean(2, keepdims=True)
dark[..., :3] = 22 + lum * 0.22
Image.fromarray(dark.round().astype(np.uint8), 'RGBA').save('public/assets/panther_tail_idle.png')
print('ok', COUNT, 'Bilder', CUT, 'x', CUT, 'Ansatz nach dem Umdrehen bei', (BASE[0], CUT - 1 - BASE[1]))
