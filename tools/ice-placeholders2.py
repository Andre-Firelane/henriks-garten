"""Platzhalter der Eiswelt (docs/plan-eiswelt.md):
- snow_pine: verschneite Tanne (Taiga am Rand der Tundra), aus der Tanne (hd/pine.png) mit Schnee auf den Ästen und am Fuß
- glacier0..2: Gletscher-Boden wie das zugefrorene Meer (sea_ice), aber bläulicher und mit Spalten
Je in public/assets (1-fach), hd2/ (2-fach) und hd/ (4-fach). Aufruf: python tools/ice-placeholders2.py"""
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

A = 'public/assets'


def save3(img, name):
    img.save(f'{A}/hd/{name}.png')
    img.resize((img.width // 2, img.height // 2), Image.LANCZOS).save(f'{A}/hd2/{name}.png')
    img.resize((img.width // 4, img.height // 4), Image.LANCZOS).save(f'{A}/{name}.png')


def snow_pine():
    src = Image.open(f'{A}/hd/pine.png').convert('RGBA')
    a = np.array(src).astype(float)
    H, W = a.shape[:2]
    op = a[..., 3] > 128
    lum = 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
    green = op & (a[..., 1] > a[..., 0] + 8)  # Nadeln (nicht Stamm, nicht Kontur)
    # dunkle Linien: deutlich dunkler als die Umgebung (die Schattenseite ist insgesamt dunkel, zählt aber nicht)
    local = np.array(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(float)
    dark = op & (lum < local - 12)
    snow = np.zeros((H, W), bool)
    # 1) obere Kante der Silhouette: in jeder Spalte die ersten Nadel-Pixel unter der Kontur
    for x in range(W):
        ys = np.nonzero(green[:, x])[0]
        if len(ys):
            y0 = ys[0]
            snow[y0:y0 + 9, x] = green[y0:y0 + 9, x]
    # 2) unter den inneren dunklen Linien (Unterkante der höheren Astreihe): dort liegt Schnee auf der Reihe darunter
    inner = dark & ~np.array(Image.fromarray((~op).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(13))).astype(bool)
    for dy in range(2, 9):
        sh = np.zeros_like(inner)
        sh[dy:] = inner[:-dy]
        snow |= sh & green
    # weiche Ränder, etwas Unruhe
    m = Image.fromarray((snow * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))
    m = np.array(m).astype(float) / 255 * green
    m = np.clip(m * 1.6, 0, 1)
    out = a.copy()
    # Nadeln etwas kühler und dunkler (Winter)
    out[green, 0] *= 0.85
    out[green, 2] = np.minimum(255, out[green, 2] * 1.1 + 6)
    shade = (lum / 255)[..., None]
    snowc = np.array([236, 243, 250]) * (0.82 + 0.18 * shade)
    out[..., :3] = out[..., :3] * (1 - m[..., None]) + snowc * m[..., None]
    img = Image.fromarray(out.astype(np.uint8))
    # Schnee am Fuß (unter den Stamm gelegt)
    base = Image.new('RGBA', img.size)
    d = ImageDraw.Draw(base)
    ys = np.nonzero(op.any(1))[0]
    yb = ys[-1]
    d.ellipse([W / 2 - 62, yb - 22, W / 2 + 62, yb + 12], fill=(232, 240, 248, 255), outline=(170, 190, 210, 255), width=3)
    base = base.filter(ImageFilter.GaussianBlur(1))
    base.alpha_composite(img)
    save3(base, 'snow_pine')


def glacier(v):
    base = Image.open(f'{A}/hd/sea_ice{v}.png').convert('RGBA')
    w, h = base.size
    arr = np.array(base).astype(float)
    # bläulicher als das Meereis
    arr[..., 0] *= 0.84
    arr[..., 1] *= 0.94
    img = Image.fromarray(arr.astype(np.uint8))
    rnd = random.Random(900 + v)
    lines = Image.new('RGBA', (w, h))
    d = ImageDraw.Draw(lines)
    # Spalten: kurze, leicht geknickte Linien quer (in Fließrichtung), weg von den Kanten
    for _ in range(v):  # glacier0 ohne, glacier1 mit einer, glacier2 mit zwei Spalten (sonst wirkt es wie Wellen)
        cx, cy = rnd.uniform(w * 0.3, w * 0.7), rnd.uniform(h * 0.3, h * 0.7)
        L = rnd.uniform(30, 60)
        pts = []
        for i in range(5):
            t = i / 4 - 0.5
            pts.append((cx + t * L, cy - t * L * 0.5 + rnd.uniform(-3, 3)))
        d.line(pts, fill=(70, 120, 170, 200), width=4)
        d.line([(x, y - 3) for x, y in pts], fill=(250, 254, 255, 160), width=2)
    lines = lines.filter(ImageFilter.GaussianBlur(0.8))
    img.alpha_composite(lines)
    img.putalpha(base.split()[3])
    save3(img, f'glacier{v}')


snow_pine()
for v in range(3):
    glacier(v)
print('ok')
