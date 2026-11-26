"""Animationen des Hundeschlittens (Reittier Eiswelt) aus Andres Greenscreen-Videos:
  Animation/Character Hundeschlitten läuft vorne.mp4   -> public/assets/ride_ice_walk.png       (gespiegelt: nach unten rechts)
  Animation/Character Hundeschlitten läuft hinten.mp4  -> public/assets/ride_ice_walk_back.png  (nach oben rechts)
  Animation/Character Hundeschlitten idle vorne.mp4    -> public/assets/ride_ice_idle.png
  Animation/Character Hundeschlitten idle hinten.mp4   -> public/assets/ride_ice_idle_back.png
Gleiches Format wie das Standbild ride_ice.png (tools/dogsled-cut.py): Bilder 464 × 250, Henriks Stiefel (Boden unter den
Kufen) in der Bildmitte bei FEET_Y, die Hunde laufen voraus. Der Player spiegelt um die Bildmitte, Henrik bleibt also stehen.

Kleinste Loops (tools/find-loop.py): Laufen vorne 12 Bilder (ein Galoppsprung, Bild 10 und 22 gleich), hinten 20
(nach 10 Bildern stehen die Hinterbeine anders), 24 fps. Stehen läuft im Spiel vor und zurück (yoyo, siehe BootScene),
daher nur ein kurzes ruhiges Stück: 8 Bilder, jedes 2. (12 fps, VIDEO_HALF).
Freistellen: kräftiges Grün weg, der dunklere grüne Schatten wird halb durchsichtiges Blaugrau wie beim Standbild.
Ragt ein Bild aus dem Rahmen (z. B. der Kopf oben), bricht das Skript ab statt abzuschneiden.
Aufruf: python tools/dogsled-anim.py   (danach python tools/make-webp.py .)
"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

FRAME_W, FRAME_H, FEET_Y = 464, 250, 186  # wie ride_ice.png
MAX_SHEET_W = 4096  # breiter laden manche Handys nicht: sonst mehrere Reihen
KEY_G = 253  # Grün des Hintergrunds
SHADOW = np.array([40, 60, 95])
SHADOW_MAX = 0.42  # so deckend wird der dunkelste gemalte Schatten

# out: (Video, range [von, bis], jedes n-te Bild, Maßstab, Anker = Boden unter Henriks Stiefeln im Video, spiegeln)
# Maßstab: Henrik (Kapuze bis Stiefel) so groß wie im Standbild (vorne 103, hinten 125 px)
DECK = 14  # Stiefel stehen so hoch über dem Boden (im Bild, wie DECK in dogsled-cut.py)
JOBS = {
    'ride_ice_walk': ('läuft vorne', (10, 21), 1, 0.69, (420, 304), True),
    'ride_ice_walk_back': ('läuft hinten', (12, 31), 1, 0.77, (165, 350), False),
    'ride_ice_idle': ('idle vorne', (36, 51), 2, 0.69, (420, 300), True),
    'ride_ice_idle_back': ('idle hinten', (70, 85), 2, 0.77, (167, 343), False),
}


def frames_of(path):
    w = h = 560
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)


def cut(f):
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    rb = np.maximum(r, b)
    gd = g - rb  # wie grün
    # Figur: deckend bis gd 25, bis gd 70 auslaufend (Mischpixel am Rand)
    a_fig = np.clip((70 - gd) / 45, 0, 1)
    # Schatten: grüne Pixel, die dunkler sind als der Hintergrund
    a_sh = np.where(gd > 40, np.clip((KEY_G - 20 - g) / 110, 0, 1) * SHADOW_MAX, 0)
    # grünen Schimmer am Rand der Figur entfernen (innen bleibt Grün, z. B. am Rucksack)
    edge = np.array(Image.fromarray(((a_fig < 1) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    col = f.copy()
    col[..., 1] = np.where(edge, np.minimum(g, rb + 6), g)
    a = np.maximum(a_fig, a_sh)
    t = np.where(a > 0, a_fig / np.maximum(a, 1e-6), 0)[..., None]
    col = col * t + SHADOW * (1 - t)
    return np.dstack([col, a * 255]).clip(0, 255).astype(np.uint8)


for out, (name, (start, end), every, scale, (ax, ay), flip) in JOBS.items():
    video = frames_of(f'Animation/Character Hundeschlitten {name}.mp4')
    picks = list(range(start, end + 1, every))
    frames = []
    for i in picks:
        img = Image.fromarray(cut(video[i]), 'RGBA')
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        x0 = ax * scale
        if flip:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
            x0 = img.width - x0
        frame = Image.new('RGBA', (FRAME_W, FRAME_H))
        ox, oy = round(FRAME_W / 2 - x0), round(FEET_Y - (ay + DECK / scale) * scale)
        # Inhalt (ohne fast durchsichtigen Schatten) muss ganz in den Rahmen passen
        al = np.array(img)[..., 3]
        ys, xs = np.nonzero(al > 8)
        top, bottom, left, right = ys.min() + oy, ys.max() + oy, xs.min() + ox, xs.max() + ox
        if top < 0 or left < 0 or bottom >= FRAME_H or right >= FRAME_W:
            sys.exit(f'{out} Bild {i}: ragt aus dem Rahmen (oben {top}, unten {bottom}, links {left}, rechts {right})')
        frame.alpha_composite(img, (ox, oy)) if ox >= 0 and oy >= 0 else frame.paste(img, (ox, oy), img)
        frames.append(frame)
    per_row = min(len(frames), MAX_SHEET_W // FRAME_W)
    rows = -(-len(frames) // per_row)
    sheet = Image.new('RGBA', (FRAME_W * per_row, FRAME_H * rows))
    for n, fr in enumerate(frames):
        sheet.paste(fr, ((n % per_row) * FRAME_W, (n // per_row) * FRAME_H))
    sheet.save(f'public/assets/{out}.png', optimize=True)
    print(f'{out}: {len(frames)} Bilder ({per_row} je Reihe, {rows} Reihen), Maßstab {scale}')
