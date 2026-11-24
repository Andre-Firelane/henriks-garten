"""Polarfuchs aus dem Silberfuchs (fox2) aufgehellt (Andre, 24.11.2026; so gibt es Laufen und Stehen ohne neue Videos).
Heller werden nur die grauen Fellflächen: Umriss, Augen (mit einem dunklen Ring drumherum) und die weißen Stellen bleiben,
die Schatten direkt am Weiß (Brust, Kinn, Schwanzspitze) bleiben grau.
Aufruf: python tools/arctic-fox.py   (danach python tools/make-webp.py .)
  fox2.png -> arcticfox.png, fox2_eat -> arcticfox_eat, fox2_walk(_back) -> arcticfox_walk(_back),
  fox2_idle(_back) -> arcticfox_idle(_back), fox2_sleep -> arcticfox_sleep (eingerollt)
Das frühere Standbild (Sprites/Polarfuchs.webp) liegt weiter in "Tiersprites Test/views"."""
import numpy as np
from PIL import Image, ImageFilter

A = 'public/assets/'
SUFFIXES = ['', '_eat', '_walk', '_walk_back', '_idle', '_idle_back', '_sleep']
LO, HI = 150, 235  # graues Fell (Helligkeit 55 … 150) wird auf LO … HI gestreckt
KEEP_WHITE = 0.9  # so viel weniger aufgehellt werden die Schatten am Weiß
EYE_RING = 1  # so viele Pixel dunkler Rand um die Augen bleiben


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def grow(mask, r):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))).astype(float) / 255


def soft(mask, r):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255


def lighten(im, eyes=True):
    a = np.asarray(im.convert('RGBA')).astype(float)
    rgb = a[..., :3]
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    sat = rgb.max(2) - rgb.min(2)
    solid = a[..., 3] > 200
    # graues Fell: nicht ganz dunkel (Umriss), nicht schon hell (Weiß), wenig Farbe (die Augen sind braun)
    w = smooth(lum, 44, 60) * (1 - smooth(lum, 150, 190)) * (1 - smooth(sat, 22, 40))
    white = (lum > 195) & solid
    w *= 1 - KEEP_WHITE * np.clip(soft(grow(white, 1), 1.2) * 1.6, 0, 1)
    eye = (sat > 28) & (lum < 140) & solid
    if not eyes:  # eingerollt hat das Bild keinen eigenen Umriss, nur dunkles Fell am Rand: der Rand bleibt dunkler
        shrink = lambda n: np.asarray(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(n))) > 0
        w *= 1 - 0.85 * (solid & ~shrink(3)) - 0.4 * (shrink(3) & ~shrink(5))  # 1 Pixel kräftig, der zweite halb
    if eyes:  # (schlafend sind die Augen zu: sonst hielte er die cremefarbenen Haare für Augen)
        w *= 1 - grow(eye, EYE_RING) * (lum < 110)
    t = (np.clip(lum, 55, 150) - 55) / (150 - 55)
    new = rgb + (LO + t * (HI - LO) - lum)[..., None]
    new = new * np.array([0.985, 0.995, 1.0]) + np.array([0, 0, 3])  # ein Hauch kühler wie der Schnee
    a[..., :3] = np.clip(rgb * (1 - w[..., None]) + new * w[..., None], 0, 255)
    return Image.fromarray(a.astype(np.uint8))


for s in SUFFIXES:
    out = lighten(Image.open(f'{A}fox2{s}.png'), eyes=s != '_sleep')
    out.save(f'{A}arcticfox{s}.png')
    print(f'arcticfox{s}', out.size)
