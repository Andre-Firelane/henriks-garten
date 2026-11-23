"""Platzhalter-Böden der Eiswelt (docs/plan-eiswelt.md): Tundra (tundra0..2: Schnee mit Flecken aus Moos, Flechten und
braunem Gras) und Kiesstrand der Walrosse (ice_beach0..2: grauer Kies mit etwas Schnee). Rautenform wie snow0, in
public/assets (64 x 32), hd2/ (2-fach) und hd/ (4-fach); gezeichnet in hd und verkleinert. Flecken bleiben weg von den
Kanten, damit die Kacheln nahtlos aneinanderpassen.
Aufruf: python tools/ice-grounds.py"""
import random
from PIL import Image, ImageDraw, ImageFilter

A = 'public/assets'


def diamond_ok(x, y, w, h, margin):
    return abs(x - w / 2) / (w / 2) + abs(y - h / 2) / (h / 2) < 1 - margin


def tundra(v):
    base = Image.open(f'{A}/hd/snow{v}.png').convert('RGBA')
    w, h = base.size
    rnd = random.Random(400 + v)
    spots = Image.new('RGBA', (w, h))
    d = ImageDraw.Draw(spots)
    colors = [(122, 128, 82), (138, 120, 86), (104, 118, 78), (160, 140, 96), (150, 96, 70)]
    for _ in range(18):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        if not diamond_ok(x, y, w, h, 0.28):
            continue
        c = rnd.choice(colors)
        for _ in range(rnd.randint(3, 7)):
            dx, dy = rnd.gauss(0, 9), rnd.gauss(0, 4)
            r = rnd.uniform(3, 8)
            d.ellipse([x + dx - r, y + dy - r / 2, x + dx + r, y + dy + r / 2], fill=c + (rnd.randint(110, 170),))
    spots = spots.filter(ImageFilter.GaussianBlur(1.2))
    out = base.copy()
    out.alpha_composite(spots)
    a = base.split()[3]
    out.putalpha(a)
    return out


def beach(v):
    base = Image.open(f'{A}/hd/snow{v}.png').convert('RGBA')
    w, h = base.size
    rnd = random.Random(700 + v)
    img = Image.new('RGBA', (w, h), (150, 146, 140, 255))
    d = ImageDraw.Draw(img)
    for _ in range(900):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        r = rnd.uniform(1.5, 4.5)
        g = rnd.randint(105, 185)
        d.ellipse([x - r, y - r / 1.6, x + r, y + r / 1.6], fill=(g, g - 3, g - 8, 255))
    snow = Image.new('RGBA', (w, h))
    ds = ImageDraw.Draw(snow)
    for _ in range(10):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        if not diamond_ok(x, y, w, h, 0.3):
            continue
        r = rnd.uniform(6, 14)
        ds.ellipse([x - r, y - r / 2, x + r, y + r / 2], fill=(240, 244, 248, 200))
    img.alpha_composite(snow.filter(ImageFilter.GaussianBlur(2)))
    img.putalpha(base.split()[3])
    return img


for v in range(3):
    for name, fn in (('tundra', tundra), ('ice_beach', beach)):
        hd = fn(v)
        hd.save(f'{A}/hd/{name}{v}.png')
        hd.resize((hd.width // 2, hd.height // 2), Image.LANCZOS).save(f'{A}/hd2/{name}{v}.png')
        hd.resize((hd.width // 4, hd.height // 4), Image.LANCZOS).save(f'{A}/{name}{v}.png')
        print(name, v)
