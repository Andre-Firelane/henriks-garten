"""Sucht in Tier-Videos (Greenscreen) den kürzesten Ausschnitt, der nahtlos im Kreis läuft (ein Schrittzyklus), damit die
Spritesheets nur einen Loop enthalten statt mehrerer. Ergebnis ist ein range [von, bis] für tools/prepare-characters.js.

Aufruf: python tools/find-loop.py [--in von bis] video1.mp4 video2.mp4 ...
  --in: nur innerhalb dieser Bilder suchen (z. B. der bisherige range, wenn der Rest des Videos unbrauchbar ist)

Vorgehen: alle Bilder klein (96x96) einlesen, Hintergrund (Randfarbe und kräftiges Grün) schwarz, dann für jedes Paar von
Bildern i, j die mittlere Farbabweichung D[i, j]. Ein Ausschnitt i..j-1 läuft nahtlos, wenn Bild j fast genauso aussieht wie
Bild i: dann ist der Sprung vom letzten Bild zurück zum ersten wie ein normaler Schritt. Die Naht wird relativ zum typischen
Unterschied zweier aufeinanderfolgender Bilder gemessen (1,0 = so glatt wie ein normaler Schritt; gilt bis NAHT als nahtlos).
Unter den nahtlosen Längen gewinnt die kürzeste; eine längere nur, wenn ihre Naht deutlich besser ist (ein halber Schritt-
zyklus sieht dem ganzen oft ähnlich, dann lieber der ganze).
"""
import subprocess
import sys
import numpy as np

S = 96
NAHT = 1.0
MIN_LEN = 10


def frames_of(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={S}:{S}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    f = np.frombuffer(raw, np.uint8).reshape(-1, S, S, 3).astype(np.float32)
    edge = np.concatenate([f[0, 0], f[0, -1], f[0, :, 0], f[0, :, -1]])
    border = np.median(edge, 0)
    fg = (np.linalg.norm(f - border, axis=-1) > 60) & ((f[..., 1] - np.maximum(f[..., 0], f[..., 2])) <= 60)
    return f * fg[..., None]


def distances(f):
    flat = f.reshape(len(f), -1)
    return np.stack([np.abs(flat - row).mean(1) for row in flat])


def find_loop(D):
    """(Länge, Start, Naht) des besten Loops oder None; Start relativ zu D"""
    m = len(D)
    adj = np.median([D[k, k + 1] for k in range(m - 1)]) + 1e-6
    best = None
    for p in range(MIN_LEN, m):
        for i in range(m - p):
            seam = D[i, i + p] / adj
            # echte Bewegung im Ausschnitt (kein Stillstand): weit größer als die Naht
            spread = D[i, i:i + p].max()
            if seam > NAHT or spread < 3 * D[i, i + p]:
                continue
            score = seam + 0.01 * p
            if best is None or score < best[0]:
                best = (score, p, i, seam)
    return best and best[1:]


def main():
    args = sys.argv[1:]
    lo = hi = None
    if args[:1] == ['--in']:
        lo, hi, args = int(args[1]), int(args[2]), args[3:]
    for path in args:
        f = frames_of(path)
        a = lo or 0
        b = len(f) - 1 if hi is None else hi
        loop = find_loop(distances(f[a:b + 1]))
        if loop:
            p, i, seam = loop
            print(f'{path}: {len(f)} Bilder -> range: [{a + i}, {a + i + p - 1}] ({p} Bilder, Naht {seam:.2f})')
        else:
            print(f'{path}: {len(f)} Bilder -> kein nahtloser Loop (dann ganz lassen, ggf. loopBlend)')


if __name__ == '__main__':
    main()
