"""Zoo-Mobil-Animationen aus Andres Videos auf Grün (Animation/Zooauto *.mp4, 640 × 640, 24 Bilder/s).

- Grün wird durchsichtig (weiche Kanten, ohne grünen Schimmer).
- Staub hinter den Rädern und Rauch am Auspuff: alles, was außerhalb der Umrisse des ersten Bilds liegt (das erste Bild
  ist sauber), wird weggeschnitten – die Umrisse wandern mit, wenn das Auto auf und ab wippt.
- Stehen von vorne: das Dach wabert im Video wie ein Tuch. Der Bereich ums Dach wird in jedem Bild durch den aus dem
  ersten Bild ersetzt (mitgewippt), so bleibt es starr.
- Gleicher Maßstab und Fußpunkt wie die Standbilder (public/assets/kart.png, 220 × 200, Räder 10 px über dem Rand).
  Von vorne fährt das Auto im Video nach unten links; die Spielfigur-Animationen schauen nach rechts (nach links wird im
  Spiel gespiegelt), deshalb werden diese Bilder gespiegelt.
Ergebnis: public/assets/kart_walk.png, kart_walk_back.png, kart_idle.png (Bildstreifen, mehrere Reihen) und Kopien in
Fahrzeug-Sprites/.
Aufruf: python tools/kart-anim.py  (danach python tools/make-webp.py .)
"""
import subprocess
import json

import numpy as np
from PIL import Image

FRAME_W, FRAME_H, FOOT = 220, 200, 10
PER_ROW = 18  # höchstens 18 × 220 = 3960 Pixel breit
VIDEOS = [
    # Ausgabe, Video, jedes wievielte Bild, spiegeln, Dach starr
    ('kart_walk', 'Animation/Zooauto fährt vorne.mp4', 2, True, False),
    ('kart_walk_back', 'Animation/Zooauto fährt hinten.mp4', 1, False, False),
    ('kart_idle', 'Animation/Zooauto idle vorne.mp4', 2, True, True),
]
ROOF_BOX = (225, 120, 455, 242)  # Dach im ersten Bild von "idle vorne" (x0, y0, x1, y1 im 640er Video)
ROOF_GROW = 24  # so weit um das Dach herum wird ersetzt (das wabernde Tuch steht weiter über)


def read(path):
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                                      '-of', 'json', path], capture_output=True, check=True).stdout)['streams'][0]
    w, h = info['width'], info['height']
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def key(frame):
    rgb = frame.astype(np.int32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lead = g - np.maximum(r, b)
    alpha = np.clip((90 - lead) / 65, 0, 1)
    out = np.zeros(frame.shape[:2] + (4,), np.float32)
    out[..., 0] = r
    out[..., 1] = np.where(lead > 0, np.maximum(r, b), g)  # ohne Grünstich
    out[..., 2] = b
    out[..., 3] = alpha
    return out


def grow(mask, n):
    m = mask.copy()
    for _ in range(n):
        m[1:] |= m[:-1].copy()
        m[:-1] |= m[1:].copy()
        m[:, 1:] |= m[:, :-1].copy()
        m[:, :-1] |= m[:, 1:].copy()
    return m


def shift(a, dy):
    out = np.zeros_like(a)
    if dy > 0:
        out[dy:] = a[:-dy]
    elif dy < 0:
        out[:dy] = a[-dy:]
    else:
        out[:] = a
    return out


def bounce(alpha, ref, rows):
    """Wie weit das Auto in diesem Bild gegenüber dem ersten nach unten (+) bzw. oben (−) gewippt ist."""
    y0, y1 = rows
    best, err = 0, None
    for dy in range(-8, 9):
        e = np.abs(alpha[y0:y1] - shift(ref, dy)[y0:y1]).sum()
        if err is None or e < err:
            best, err = dy, e
    return best


def process(frames, step, roof):
    keyed = [key(f) for f in frames[::step]]
    ref = keyed[0]
    ref_a = ref[..., 3]
    solid = ref_a > 0.5
    ys, xs = np.where(solid)
    top, bottom = ys.min(), ys.max()
    rows = (int(top + (bottom - top) * 0.4), int(top + (bottom - top) * 0.75))  # Motorhaube und Seite: dort wackelt nichts
    zone = None
    if roof:
        x0, y0, x1, y1 = ROOF_BOX
        roof_mask = np.zeros_like(solid)
        roof_mask[y0:y1, x0:x1] = solid[y0:y1, x0:x1]
        zone = grow(roof_mask, ROOF_GROW)
        zone[y1:] = False
    out = []
    for i, k in enumerate(keyed):
        dy = 0 if i == 0 else bounce(k[..., 3], ref_a, rows)
        keep = grow(shift(solid, dy), 2)  # Umrisse des ersten Bilds (mitgewippt), etwas großzügiger
        k = k.copy()
        k[..., 3] *= keep
        if zone is not None:
            z = shift(zone, dy)
            k[z] = shift(ref, dy)[z]
        out.append(k)
    return out, (top, bottom, xs.min(), xs.max())


def to_image(k):
    return Image.fromarray(np.dstack([np.clip(k[..., :3], 0, 255), k[..., 3:] * 255]).astype(np.uint8), "RGBA")


def main():
    still = np.array(Image.open('public/assets/kart.png'))[..., 3]
    # Höhe des Autos im Standbild (Bild 1 = unten links, Bild 3 = oben rechts)
    heights = {}
    for i in (1, 2):
        ys = np.where(still[:, i * FRAME_W:(i + 1) * FRAME_W] > 128)[0]
        heights[i] = ys.max() - ys.min() + 1
    for name, src, step, mirror, roof in VIDEOS:
        frames, (top, bottom, left, right) = process(read(src), step, roof)
        target = heights[2] if 'back' in name else heights[1]
        scale = target / (bottom - top + 1)
        cx = (left + right) / 2
        n = len(frames)
        rows_n = (n + PER_ROW - 1) // PER_ROW
        sheet = Image.new('RGBA', (FRAME_W * min(n, PER_ROW), FRAME_H * rows_n))
        for i, k in enumerate(frames):
            img = to_image(k)
            w, h = img.size
            img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
            if mirror:
                img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                ox = FRAME_W / 2 - (w - cx) * scale
            else:
                ox = FRAME_W / 2 - cx * scale
            oy = FRAME_H - FOOT - bottom * scale
            cell = Image.new('RGBA', (FRAME_W, FRAME_H))
            cell.alpha_composite(img.crop((max(0, -round(ox)), max(0, -round(oy)), max(0, -round(ox)) + FRAME_W, max(0, -round(oy)) + FRAME_H)), (max(0, round(ox)), max(0, round(oy))))
            sheet.alpha_composite(cell, ((i % PER_ROW) * FRAME_W, (i // PER_ROW) * FRAME_H))
        sheet.save(f'public/assets/{name}.png')
        sheet.save(f'Fahrzeug-Sprites/{name}.png')
        print(f'{name}: {n} Bilder, Maßstab {scale:.3f}')


if __name__ == '__main__':
    main()
