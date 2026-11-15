"""Ansichten aus einem generierten Bild mit weißem Hintergrund einzeln freistellen (für "Tiersprites Test" und die
Standbilder der seltenen Varianten, siehe tools/rare-static.py).
Aufruf: python tools/cutout-views.py <Quelle> <Ziel-Präfix> <Faktor oder hHöhe> [Ansichten 2|4] [Stichwörter]
  Ansichten: 2 (links/oben vorne, rechts/unten hinten) oder 4 (unten-rechts, unten-links, oben-rechts, oben-links)
  Stichwörter (mit Komma): schatten, schatten-grau (graue/weiße Tiere), wasser (badender Affe), beiwerk (lose Teile
  wie Bambus behalten), loecher (eingeschlossenen Hintergrund zwischen den Beinen entfernen), alle (alle Ansichten als
  <Präfix>_v0.png ... statt _vorne/_hinten)
Nur von außen zusammenhängendes Weiß wird durchsichtig (cremeweiße Wolle bleibt), Krümel/Grasbüschel weg."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, prefix, size = sys.argv[1], sys.argv[2], sys.argv[3]
# size: Faktor (z. B. 0.25) oder Zielhöhe der Vorderansicht (z. B. h201); nviews: 2 (vorne, hinten) oder
# 4 (unten-rechts, unten-links, oben-rechts, oben-links -> exportiert werden 1. als vorne und 3. als hinten)
nviews = int(sys.argv[4]) if len(sys.argv) > 4 else 2
# 5. Argument, Stichwörter mit Komma: 'schatten' (grauer Bodenschatten zählt zum Hintergrund), 'schatten-grau'
# (für graue/weiße Tiere wie den Silberfuchs: Schatten nur farbloses Mittelgrau, Hintergrund erst ab 245),
# 'wasser' (Wasserfläche samt Wellenlinien weg, wie beim badenden Affen), 'beiwerk' (lose Teile behalten),
# 'loecher' (eingeschlossenen Hintergrund z. B. zwischen Beinen entfernen; nur wenn nötig, sonst trifft es Glanzpunkte)
flags = set(sys.argv[5].split(',')) if len(sys.argv) > 5 else set()
mode = 'schatten-grau' if 'schatten-grau' in flags else ''
shadow = bool(flags & {'schatten', 'schatten-grau'})
rgb = np.array(Image.open(src).convert('RGB')).astype(float)
H, W, _ = rgb.shape
mn = rgb.min(2)
sat = rgb.max(2) - mn

def flood(bglike):
    m = Image.fromarray(np.where(bglike, 0, 255).astype(np.uint8)).copy()
    for x in range(0, W, 8):
        for y in (0, H - 1):
            if m.getpixel((x, y)) == 0: ImageDraw.floodfill(m, (x, y), 128)
    for y in range(0, H, 8):
        for x in (0, W - 1):
            if m.getpixel((x, y)) == 0: ImageDraw.floodfill(m, (x, y), 128)
    return np.array(m) == 128

bg = flood(mn > (245 if mode == 'schatten-grau' else 232))
if shadow:
    if mode == 'schatten-grau':
        cand = (sat <= 3) & (mn >= 160) & (mn <= 225)
    else:
        # Schatten ist eine gleichmäßige Fläche: häufigsten Grauton direkt am Hintergrund suchen, nur den (±10) zulassen
        ring = (np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0) & ~bg
        grey = ring & (sat <= 12) & (mn >= 150) & (mn <= 225)
        tone = np.bincount(mn[grey].astype(int), minlength=256).argmax() if grey.any() else 190
        print('Schattenton', tone)
        cand = (sat <= 9) & (np.abs(mn - tone) <= 10)
    # Schatten nur über breite Hintergrundflächen erreichbar: dünne weiße Linien (Schnurrhaare) zählen dafür nicht,
    # sonst läuft der Hintergrund an ihnen entlang in helles, graues Fell (Schnauze)
    wide = np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))) > 0
    bg |= flood(wide | cand) & (wide | cand)
    if 'wasser' in flags:
        # Wasserfläche (wie Schatten) samt weißer Wellenlinien darauf: Weiß darf hier über die Wasserfläche erreicht werden
        water = wide | cand | (mn > 232)
        bg |= flood(water) & water
if 'loecher' in flags:
    # eingeschlossener Hintergrund (z. B. zwischen Beinen): fast weiße Flächen ab 20 px, überwiegend von Dunklem umgeben
    holes = Image.fromarray((((mn >= 245) & ~bg) * 255).astype(np.uint8)).copy()
    harr = np.array(holes)
    while True:
        ys, xs = np.where(harr == 255)
        if not len(xs): break
        ImageDraw.floodfill(holes, (int(xs[0]), int(ys[0])), 100)
        harr = np.array(holes)
        region = harr == 100
        if region.sum() >= 20:
            # Ring 2 px um die Fläche: Löcher zwischen Beinen höchstens ~48 % hell, Glanzstellen ab ~55 % (gemessen am Storch)
            ring = (np.array(Image.fromarray((region * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0) & ~region
            if (mn[ring] > 200).mean() < 0.5: bg |= region
        harr[region] = 1
        holes = Image.fromarray(harr).copy()
if shadow:
    # Schattenreste am Umriss (Übergang Schatten -> Pfote): graue, farblose Randpixel nach und nach abtragen
    for _ in range(3):
        band = (np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0) & ~bg
        bg |= band & (sat <= 8) & (mn >= 110) & (mn <= 240)
near = np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
edge = near & ~bg
a = np.where(bg, 0.0, 1.0)
# Randpixel: Anteil Figur aus dem Abstand zu Weiß, Farbe gegen Weiß entmischen
dist = (255 - mn[edge]) / 255
a[edge] = np.clip(dist / 0.35, 0.2, 1)
col = rgb.copy()
ae = a[edge][:, None]
col[edge] = np.clip((rgb[edge] - 255 * (1 - ae)) / ae, 0, 255)

# zusammenhängende Teile finden (leicht verbunden), die zwei größten sind die Ansichten
# dünne Striche (Grasbüschel) lösen sich durch Öffnen ab; die Figur behält danach ihre Originalpixel (siehe keep)
fig = Image.fromarray(((a > 0) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7)).copy()
arr = np.array(fig)
parts, label = [], 1
while label < 250:
    ys, xs = np.where(arr == 255)
    if not len(xs): break
    ImageDraw.floodfill(fig, (int(xs[0]), int(ys[0])), label)
    arr = np.array(fig)
    parts.append(((arr == label).sum(), label))
    label += 1
parts.sort(reverse=True)
views = []
for _, lab in parts[:nviews]:
    # Originalpixel nahe am geöffneten Teil behalten (feine Umrisse der Figur bleiben, abgelöste Halme nicht)
    keep = np.array(Image.fromarray(((arr == lab) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    keep &= a > 0
    # danach ohne Vergrößerung: kleine, abgetrennte Stücke (unter 2 % der Figur) weg
    # (nur kräftige Pixel zählen, sonst verbinden weiche Randpixel die Halme mit der Figur)
    sub = Image.fromarray(((keep & (a > 0.6)) * 255).astype(np.uint8)).copy()
    sarr, slab, sizes = np.array(sub), 1, []
    while slab < 250:
        ys, xs = np.where(sarr == 255)
        if not len(xs): break
        ImageDraw.floodfill(sub, (int(xs[0]), int(ys[0])), slab)
        sarr = np.array(sub)
        sizes.append(((sarr == slab).sum(), slab))
        slab += 1
    big = max(s for s, _ in sizes)
    core = np.isin(sarr, [l for s, l in sizes if s >= 0.02 * big])
    keep &= np.array(Image.fromarray((core * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    ys, xs = np.where(keep & (a > 0))
    views.append((xs.mean(), keep, xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
if 'beiwerk' in flags:
    # lose Teile (z. B. Bambus am Boden) behalten und der Ansicht zuordnen, die waagerecht am nächsten liegt
    taken = np.zeros_like(a, dtype=bool)
    for v in views: taken |= v[1]
    rest = Image.fromarray((((a > 0.6) & ~taken) * 255).astype(np.uint8)).copy()
    rarr, rl = np.array(rest), 1
    while rl < 250:
        ys, xs = np.where(rarr == 255)
        if not len(xs): break
        ImageDraw.floodfill(rest, (int(xs[0]), int(ys[0])), rl)
        rarr = np.array(rest)
        piece = rarr == rl
        rl += 1
        if piece.sum() < 80: continue
        py, px = np.where(piece)
        k = min(range(len(views)), key=lambda j: 0 if views[j][2] <= px.mean() <= views[j][4] else min(abs(px.mean() - views[j][2]), abs(px.mean() - views[j][4])))
        grow = (np.array(Image.fromarray((piece * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0) & (a > 0)
        cx, keep, x0, y0, x1, y1 = views[k]
        keep = keep | grow
        views[k] = (cx, keep, min(x0, px.min()), min(y0, py.min()), max(x1, px.max() + 2), max(y1, py.max() + 2))
# links = vorne, rechts = hinten; liegen zwei Ansichten übereinander (wie Biber), dann oben = vorne
if nviews == 2 and len(views) == 2 and min(v[5] for v in views) <= max(v[3] for v in views) + 5:
    views.sort(key=lambda v: v[3])
else:
    views.sort(key=lambda v: v[0])
pick = [(views[0], 'vorne'), (views[1 if nviews == 2 else 2], 'hinten')]
if 'alle' in flags:  # alle Ansichten in Bildreihenfolge (v0, v1, ...), für die Spiel-Standbilder (siehe make_static.py)
    pick = [(v, f'v{i}') for i, v in enumerate(views)]
fv = views[0]
factor = float(size[1:]) / (fv[5] - fv[3]) if size.startswith('h') else float(size)
for (_, keep, x0, y0, x1, y1), side in pick:
    al = np.where(keep, a, 0)
    img = Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), 'RGBA').crop((x0, y0, x1, y1))
    img = img.resize((round(img.width * factor), round(img.height * factor)), Image.LANCZOS)
    out = f'{prefix}_{side}.png'
    img.save(out)
    print(out, img.size, f'(Quelle {x1 - x0}x{y1 - y0})')
