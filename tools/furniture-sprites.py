"""Aufruf: python tools/furniture-sprites.py   (braucht Pillow; danach tools/hd-phone.py und tools/make-webp.py .)
Möbel fürs Haupthaus (docs/plan-haupthaus.md), gezeichnet als isometrische Körper: Quader, Zylinder, Blätter.
Jedes Teil steht auf einer Grundfläche W × D Kacheln (W entlang tx = u, D entlang ty = v) und schaut nach +u (im Bild nach
rechts unten). Ansichten: views 4 = alle vier Richtungen (0: rechts unten, 1: links unten, 2: links oben, 3: rechts oben;
bei 1 und 3 sind W und D getauscht), 2 = zwei (0 und 1), 1 = nur eine. Das Licht kommt immer von links oben.
Der Fußpunkt (Mitte der Grundfläche) liegt waagrecht genau in der Bildmitte.
Ausgabe: public/assets/hd/fn_<id>_<Ansicht>.png (4-fach), public/assets/fn_<id>_<Ansicht>.png (einfach) und
src/world/furnitureArt.js (Größe, Fußpunkt, Trophäen-Plätze je Ansicht)."""
import json, math, os, random
from PIL import Image, ImageChops, ImageDraw, ImageFilter

HD = 4  # wie HD_SCALE in src/world/hd.js
SS = 2  # Überabtastung (Kanten glätten)
K = HD * SS  # Bildpunkte je alter Bildpunkt beim Zeichnen
TW, TH = 32, 16  # halbe Kachelbreite und -höhe (alte Bildpunkte)
LINE = 0.55  # Umriss (alte Bildpunkte)


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def mul(c, k):
    return tuple(max(0, min(255, int(round(v * k)))) for v in c[:3]) + (c[3],)


def mix(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(4))


def C(c):
    return hexc(c) if isinstance(c, str) else c


# ---------------------------------------------------------------- Grundformen (in Kachel-Koordinaten u, v; Höhe z in Bildpunkten)

class Prim:
    after = None  # Zierteile: gleich nach diesem Teil zeichnen
    front = False  # vordere Ebene (Glas, Kanten): liegt im Spiel über den Trophäen-Plaketten, siehe render


def fr(p):
    p.front = True
    return p

    def moved(self, f):
        raise NotImplementedError


class Box(Prim):
    def __init__(self, u0, v0, z0, u1, v1, z1, col, top=None, grain=0, soft=False, line=True, alpha=255):
        self.b = [min(u0, u1), min(v0, v1), z0, max(u0, u1), max(v0, v1), z1]
        self.col, self.topc, self.grain, self.soft, self.line, self.alpha = C(col), C(top) if top else None, grain, soft, line, alpha

    def moved(self, f):
        (a, b), (c, d) = f(self.b[0], self.b[1]), f(self.b[3], self.b[4])
        n = Box(a, b, self.b[2], c, d, self.b[5], self.col, self.topc, self.grain, self.soft, self.line, self.alpha)
        return n

    def draw(self, cv):
        if self.soft:  # Polster: auf eigener Ebene zeichnen, dann die Umrisse abrunden
            layer = Canvas((cv.x0, cv.y0, cv.x1, cv.y1))
            self.draw_box(layer)
            a = layer.img.getchannel('A')
            r = 1.1 * K
            a = a.filter(ImageFilter.GaussianBlur(r)).point(lambda x: max(0, min(255, (x - 100) * 4)))
            layer.img.putalpha(ImageChops.multiply(a, layer.img.getchannel('A').filter(ImageFilter.MaxFilter(3))))
            cv.img.alpha_composite(layer.img)
            return
        self.draw_box(cv)

    def draw_box(self, cv):
        u0, v0, z0, u1, v1, z1 = self.b
        col = self.col[:3] + (self.alpha,)
        top = (self.topc or mul(col, 1.08))[:3] + (self.alpha,)
        P = cv.P
        left = [P(u0, v1, z0), P(u1, v1, z0), P(u1, v1, z1), P(u0, v1, z1)]  # Seite +v (links unten im Bild)
        right = [P(u1, v0, z0), P(u1, v1, z0), P(u1, v1, z1), P(u1, v0, z1)]  # Seite +u (rechts unten)
        tp = [P(u0, v0, z1), P(u1, v0, z1), P(u1, v1, z1), P(u0, v1, z1)]
        h = z1 - z0
        if h > 0.01:
            cv.face(left, mul(col, 0.86), mul(col, 0.74))
            cv.face(right, mul(col, 0.68), mul(col, 0.58))
        cv.face(tp, top, mul(top, 0.94))
        if self.grain:
            rnd = random.Random(int(u0 * 97 + v0 * 31 + z1))
            along_u = (u1 - u0) >= (v1 - v0)
            for i in range(self.grain):
                t = (i + 0.5 + rnd.uniform(-0.3, 0.3)) / self.grain
                if along_u:
                    v = v0 + (v1 - v0) * t
                    cv.line([P(u0 + 0.04, v, z1), P(u1 - 0.04, v, z1)], mul(top, 0.86), 0.35)
                else:
                    u = u0 + (u1 - u0) * t
                    cv.line([P(u, v0 + 0.04, z1), P(u, v1 - 0.04, z1)], mul(top, 0.86), 0.35)
        if self.soft:  # Polster: heller Schimmer oben, weiche Kante vorn
            cv.line([P(u0 + 0.03, v1, z1), P(u1, v1, z1), P(u1, v0 + 0.03, z1)], mul(top, 1.18), 0.9)
        if self.line:
            oc = mul(col, 0.42)[:3] + (min(255, self.alpha + 60),)
            outline = [P(u0, v0, z1), P(u1, v0, z1), P(u1, v0, z0), P(u1, v1, z0), P(u0, v1, z0), P(u0, v1, z1)] if h > 0.01 else tp
            cv.line(outline + [outline[0]], oc, LINE)
            if h > 0.01:
                cv.line([P(u0, v1, z1), P(u1, v1, z1), P(u1, v0, z1)], mul(oc, 1.15), LINE * 0.6)
                cv.line([P(u1, v1, z1), P(u1, v1, z0)], mul(oc, 1.15), LINE * 0.6)


class Cyl(Prim):
    """senkrechter Zylinder (Topf, Bein, runder Tisch); taper: oben um so viel schmaler (Anteil)"""

    def __init__(self, u, v, r, z0, z1, col, top=None, taper=0.0, line=True, rim=None):
        self.u, self.v, self.r, self.z0, self.z1, self.col = u, v, r, z0, z1, C(col)
        self.topc, self.taper, self.line, self.rim = C(top) if top else None, taper, line, C(rim) if rim else None
        self.b = [u - r, v - r, z0, u + r, v + r, z1]

    def moved(self, f):
        u, v = f(self.u, self.v)
        return Cyl(u, v, self.r, self.z0, self.z1, self.col, self.topc, self.taper, self.line, self.rim)

    def draw(self, cv):
        cx, cy0 = cv.P(self.u, self.v, self.z0)
        _, cy1 = cv.P(self.u, self.v, self.z1)
        rx0, ry0 = self.r * TW * math.sqrt(2), self.r * TH * math.sqrt(2)
        rx1, ry1 = rx0 * (1 - self.taper), ry0 * (1 - self.taper)
        # Seite: von links (hell) nach rechts (dunkel)
        side = []
        n = 24
        for i in range(n + 1):
            a = math.pi * i / n
            side.append((cx - rx0 * math.cos(a), cy0 + ry0 * math.sin(a)))
        for i in range(n + 1):
            a = math.pi * (1 - i / n)
            side.append((cx - rx1 * math.cos(a), cy1 + ry1 * math.sin(a)))
        cv.face_h(side, mul(self.col, 0.95), mul(self.col, 0.6), cx - rx0, cx + rx0)
        top = self.topc or mul(self.col, 1.1)
        cv.ellipse(cx, cy1, rx1, ry1, top)
        if self.rim:
            cv.ellipse_line(cx, cy1, rx1, ry1, self.rim, 1.0)
        if self.line:
            oc = mul(self.col, 0.42)
            cv.line(side + [side[0]], oc, LINE)
            cv.ellipse_line(cx, cy1, rx1, ry1, oc, LINE * 0.7)


class Custom(Prim):
    """frei gezeichnet: fn(cv, P) mit P(u, v, z) schon gedreht; b: Hülle zum Sortieren"""

    def __init__(self, b, fn, rot=None):
        self.b, self.fn = list(b), fn

    def moved(self, f):
        (a, b), (c, d) = f(self.b[0], self.b[1]), f(self.b[3], self.b[4])
        n = Custom([min(a, c), min(b, d), self.b[2], max(a, c), max(b, d), self.b[5]], self.fn)
        n.f = f
        return n

    def draw(self, cv):
        f = getattr(self, 'f', lambda u, v: (u, v))

        def P(u, v, z):
            a, b = f(u, v)
            return cv.P(a, b, z)

        self.fn(cv, P)


class Decal(Prim):
    """Bild auf einer Seite eines Quaders (local: 'u+', 'u-', 'v+', 'v-'), nur sichtbar, wenn die Seite zur Kamera zeigt.
    quad(P) gibt die Punkte zurück; fn(cv, P) zeichnet darauf (P schon gedreht)"""

    def __init__(self, side, b, fn):
        self.side, self.b, self.fn = side, list(b), fn

    def moved(self, f):
        n = Custom.moved(self, f)
        d = Decal(self.side, n.b, self.fn)
        d.f = f
        return d

    def draw(self, cv):
        f = getattr(self, 'f', lambda u, v: (u, v))
        nu, nv = {'u+': (1, 0), 'u-': (-1, 0), 'v+': (0, 1), 'v-': (0, -1)}[self.side]
        a0, b0 = f(0, 0)
        a1, b1 = f(nu, nv)
        if (a1 - a0) <= 0.5 and (b1 - b0) <= 0.5:
            return  # Seite zeigt von der Kamera weg

        def P(u, v, z):
            a, b = f(u, v)
            return cv.P(a, b, z)

        self.fn(cv, P)


# ---------------------------------------------------------------- Leinwand

class Canvas:
    def __init__(self, bounds):
        self.x0, self.y0, self.x1, self.y1 = bounds
        self.w, self.h = int(math.ceil((self.x1 - self.x0) * K)), int(math.ceil((self.y1 - self.y0) * K))
        self.img = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img, 'RGBA')

    def P(self, u, v, z):
        return ((u - v) * TW, (u + v) * TH - z)

    def px(self, p):
        return ((p[0] - self.x0) * K, (p[1] - self.y0) * K)

    def poly(self, pts, col):
        self.d.polygon([self.px(p) for p in pts], fill=col)

    def line(self, pts, col, w):
        self.d.line([self.px(p) for p in pts], fill=col, width=max(1, int(round(w * K))), joint='curve')

    def _grad(self, pts, c0, c1, horiz, a, b):
        xs = [self.px(p) for p in pts]
        x0, y0 = int(max(0, min(p[0] for p in xs) - 2)), int(max(0, min(p[1] for p in xs) - 2))
        x1, y1 = int(min(self.w, max(p[0] for p in xs) + 3)), int(min(self.h, max(p[1] for p in xs) + 3))
        if x1 <= x0 or y1 <= y0:
            return
        mask = Image.new('L', (x1 - x0, y1 - y0), 0)
        ImageDraw.Draw(mask).polygon([(p[0] - x0, p[1] - y0) for p in xs], fill=255)
        g = Image.new('RGBA', mask.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(g)
        if horiz:
            lo, hi = (a - self.x0) * K - x0, (b - self.x0) * K - x0
            span = max(1, hi - lo)
            for x in range(g.width):
                gd.line([(x, 0), (x, g.height)], fill=mix(c0, c1, min(1, max(0, (x - lo) / span))))
        else:
            span = max(1, g.height)
            for y in range(g.height):
                gd.line([(0, y), (g.width, y)], fill=mix(c0, c1, y / span))
        g.putalpha(ImageChops.multiply(g.getchannel('A'), mask))
        self.img.alpha_composite(g, (x0, y0))

    def face(self, pts, c0, c1):
        self._grad(pts, c0, c1, False, 0, 0)

    def face_h(self, pts, c0, c1, a, b):
        self._grad(pts, c0, c1, True, a, b)

    def ellipse(self, cx, cy, rx, ry, col):
        x, y = self.px((cx, cy))
        self.d.ellipse([x - rx * K, y - ry * K, x + rx * K, y + ry * K], fill=col)

    def ellipse_line(self, cx, cy, rx, ry, col, w):
        x, y = self.px((cx, cy))
        self.d.ellipse([x - rx * K, y - ry * K, x + rx * K, y + ry * K], outline=col, width=max(1, int(w * K)))


# ---------------------------------------------------------------- Sortieren (hinten zuerst)

def behind(a, b, e=1e-6):
    A, B = a.b, b.b
    if A[3] <= B[0] + e:
        return True
    if B[3] <= A[0] + e:
        return False
    if A[4] <= B[1] + e:
        return True
    if B[4] <= A[1] + e:
        return False
    if A[5] <= B[2] + e:
        return True
    if B[5] <= A[2] + e:
        return False
    return (A[0] + A[3] + A[1] + A[4]) < (B[0] + B[3] + B[1] + B[4])


def screen_box(p):
    # Hülle im Bild als Sechseck: Bereiche von x = u - v, u + v - z/16 und u + v (für Ober- und Unterkante)
    u0, v0, z0, u1, v1, z1 = p.b
    return (u0 - v1, u1 - v0, u0 + v0 - z1 / TH, u1 + v1 - z0 / TH, u0 - z1 / TW, u1 - z0 / TW, v0 - z1 / TW, v1 - z0 / TW)


def overlap(a, b, e=1e-6):
    return all(a[k] < b[k + 1] - e and b[k] < a[k + 1] - e for k in (0, 2, 4, 6))


def order(prims):
    base = [p for p in prims if p.after is None]
    rest = [p for p in prims if p.after is not None]
    n = len(base)
    before = {i: set() for i in range(n)}
    boxes = [screen_box(p) for p in base]
    for i in range(n):
        for j in range(n):
            if i != j and overlap(boxes[i], boxes[j]) and behind(base[i], base[j]) and not behind(base[j], base[i]):
                before[j].add(i)
    out, done = [], set()
    while len(done) < n:  # (out enthält auch die Zierteile: nicht danach zählen)
        ready = [i for i in range(n) if i not in done and before[i] <= done]
        if not ready:  # Kreis: das hinterste nehmen
            ready = [min((i for i in range(n) if i not in done), key=lambda i: sum(base[i].b[:2]) + sum(base[i].b[3:5]))]
        i = min(ready, key=lambda i: (base[i].b[0] + base[i].b[3] + base[i].b[1] + base[i].b[4], base[i].b[2]))
        done.add(i)
        out.append(base[i])
        out += [r for r in rest if r.after is base[i]]
    return out


# ---------------------------------------------------------------- Ansichten

def rotator(k, W, D):
    if k == 0:
        return lambda u, v: (u, v)
    if k == 1:
        return lambda u, v: (D - v, u)
    if k == 2:
        return lambda u, v: (W - u, D - v)
    return lambda u, v: (v, W - u)


def render(item, k, split=False):
    """Bild einer Ansicht; split: die vorderen Teile (front) in ein eigenes Bild (gleiche Größe und gleicher Fußpunkt),
    damit die Trophäen-Plaketten dazwischen liegen. Gibt (Bild, vorderes Bild oder None, Drehung) zurück"""
    W, D = item['size']
    f = rotator(k, W, D)
    prims = []
    for p in item['parts']():
        q = p.moved(f)
        if p.after is not None:
            q.after = p.after
        q.front = p.front
        q.src = p
        prims.append(q)
    for q in prims:  # Zierteile an ihr gedrehtes Teil hängen
        if q.after is not None:
            q.after = next(x for x in prims if x.src is q.after)
    w, d = (W, D) if k % 2 == 0 else (D, W)
    cu, cv_ = w / 2, d / 2
    # Hülle im Bild
    xs, ys = [], []
    for p in prims:
        u0, v0, z0, u1, v1, z1 = p.b
        for u in (u0, u1):
            for v in (v0, v1):
                for z in (z0, z1):
                    xs.append((u - v) * TW)
                    ys.append((u + v) * TH - z)
    ax, ay = (cu - cv_) * TW, (cu + cv_) * TH
    pad = 6
    half = max(ax - min(xs), max(xs) - ax) + pad
    bounds = (ax - half, min(ys) - pad - item.get('extra_top', 0), ax + half, max(ys) + pad)
    cv = Canvas(bounds)
    shadow(cv, w, d, item.get('shadow', 0.9))
    fcv = Canvas(bounds) if split else None
    for p in order(prims):
        p.draw(fcv if split and p.front else cv)
    big = cv.img.resize((cv.w // SS, cv.h // SS), Image.LANCZOS)
    front = fcv.img.resize((fcv.w // SS, fcv.h // SS), Image.LANCZOS) if split else None
    box = big.getbbox()
    if front is not None and front.getbbox():
        fb = front.getbbox()
        box = (0, min(box[1], fb[1]), big.width, max(box[3], fb[3]))
    big = trim(big, ax, ay, bounds, box)
    if front is not None:
        front = front.crop((0, box[1], front.width, box[3])) if front.getbbox() else None  # (nichts vorn: kein Bild)
    return big, front, f


def shadow(cv, w, d, k):
    if not k:
        return
    m = Image.new('L', (cv.w, cv.h), 0)
    md = ImageDraw.Draw(m)
    i = 0.06
    pts = [cv.px(cv.P(u, v, 0)) for u, v in ((i, i), (w - i, i), (w - i, d - i), (i, d - i))]
    md.polygon(pts, fill=int(70 * k))
    m = m.filter(ImageFilter.GaussianBlur(3 * K))
    sh = Image.new('RGBA', (cv.w, cv.h), (40, 30, 20, 255))
    sh.putalpha(m)
    cv.img.alpha_composite(sh)


def trim(img, ax, ay, bounds, bb=None):
    # oben und unten leere Zeilen weg (waagrecht bleibt der Fußpunkt in der Mitte)
    bb = bb or img.getbbox()
    if not bb:
        return img
    top, bottom = bb[1], bb[3]
    img = img.crop((0, top, img.width, bottom))
    img.info['oy'] = (ay - bounds[1]) * HD - top
    img.info['ox'] = img.width / 2
    return img


# ---------------------------------------------------------------- Bausteine

def legs(u0, v0, u1, v1, z1, col, t=0.07, inset=0.0):
    i = inset
    return [Box(u, v, 0, u + t, v + t, z1, col) for u in (u0 + i, u1 - i - t) for v in (v0 + i, v1 - i - t)]


def leaf(cv, P, base, ang, elev, length, width, col, rib=True, droop=0.25, tilt=0.0):
    """ein Blatt: von base (u, v, z) in Richtung ang (Grundriss, Bogenmaß), Steigung elev; Länge in Kacheln"""
    u, v, z = base
    pts_l, pts_r, mid = [], [], []
    n = 10
    for i in range(n + 1):
        t = i / n
        du, dv = math.cos(ang) * length * t, math.sin(ang) * length * t
        dz = (math.sin(elev) * t - droop * t * t) * length * 45
        w = width * math.sin(math.pi * min(1, t * 1.05)) ** 0.8
        nu, nv = -math.sin(ang) * w, math.cos(ang) * w
        c = P(u + du, v + dv, z + dz)
        a = P(u + du + nu, v + dv + nv, z + dz + tilt * w * 30)
        b = P(u + du - nu, v + dv - nv, z + dz - tilt * w * 30)
        pts_l.append(a)
        pts_r.append(b)
        mid.append(c)
    shape = pts_l + pts_r[::-1]
    cv.poly(shape, col)
    cv.poly(pts_l + mid[::-1], mul(col, 1.12))
    cv.line(shape + [shape[0]], mul(col, 0.55), LINE * 0.7)
    if rib:
        cv.line(mid, mul(col, 1.3), LINE * 0.6)


def blob(cv, P, c, r, col, n=14, seed=0):
    """Laubbüschel: Kreis aus kleinen Kreisen (im Bild), hell oben links"""
    x, y = P(*c)
    rnd = random.Random(seed)
    for i in range(n):
        a = rnd.uniform(0, math.tau)
        d = rnd.uniform(0, r * 0.7)
        rr = r * rnd.uniform(0.35, 0.55)
        px, py = x + math.cos(a) * d * 1.2, y + math.sin(a) * d * 0.9
        shade = 0.8 + 0.4 * (1 - (py - y + r) / (2 * r)) * 0.8 + 0.25 * (1 - (px - x + r) / (2 * r)) * 0.6
        cv.ellipse(px, py, rr, rr * 0.9, mul(col, shade))


def books(u, v0, v1, z, depth, rnd, colors, h=(9, 13), lean=True):
    """Bücherreihe auf einem Brett: Rücken zeigen nach +u"""
    out, vv = [], v0
    while vv < v1 - 0.06:
        t = rnd.uniform(0.05, 0.09)
        hh = rnd.uniform(*h)
        if vv + t > v1:
            break
        out.append(Box(u - depth, vv, z, u, vv + t, z + hh, rnd.choice(colors), line=True))
        vv += t + rnd.uniform(0, 0.015)
        if rnd.random() < 0.12:
            vv += 0.08
    return out


# ---------------------------------------------------------------- Stile

STYLES = {
    'office': dict(wood='#c79a64', dark='#6b4a2e', metal='#4b5059', cloth='#8e9db1', accent='#de7b3b', pot='#ecebe6', leaf='#4f8a3c'),
    'meadow': dict(wood='#dcae72', dark='#9a6b3c', metal='#7d7466', cloth='#d65a4c', accent='#f2e6c9', pot='#c86e45', leaf='#5c9a3c'),
    'forest': dict(wood='#8a5d38', dark='#5a3a22', metal='#55524c', cloth='#6f8a46', accent='#c9a45c', pot='#7d776c', leaf='#3f7a3a'),
    'savanna': dict(wood='#c08a4c', dark='#7a5228', metal='#6b5a45', cloth='#d0703c', accent='#e8cf8f', pot='#b9693d', leaf='#7a9a3e'),
    'asia': dict(wood='#7e2e24', dark='#2e2422', metal='#3a3330', cloth='#c9b46a', accent='#d9c27a', pot='#3e6382', leaf='#5f9a46'),
    'jungle': dict(wood='#c7a061', dark='#8a6532', metal='#5a5040', cloth='#3f8a5a', accent='#e5823b', pot='#8e5c3a', leaf='#2f8a3e'),
    'ice': dict(wood='#a9b5c0', dark='#5e6b78', metal='#7e8b97', cloth='#3d72aa', accent='#e2702c', pot='#5d6c7a', leaf='#3d6e52'),
}


def S(style, k):
    return hexc(STYLES[style][k])


# ---------------------------------------------------------------- Möbel

def desk(style, computer=False):
    s = STYLES[style]
    rnd = random.Random(style)

    def parts():
        W, D = 1, 2
        u0, u1, v0, v1 = 0.18, 0.86, 0.1, 1.9
        top = 21
        p = []
        if style in ('office',) or computer:
            # zwei Seitenwangen, Platte
            p += [Box(u0, v0, 0, u1, v0 + 0.08, top - 2, s['metal']), Box(u0, v1 - 0.08, 0, u1, v1, top - 2, s['metal'])]
            p += [Box(u0 + 0.05, v0 + 0.08, top - 9, u0 + 0.1, v1 - 0.08, top - 3, s['metal'])]  # Blende hinten
        elif style == 'asia':
            p += [Box(u0 + 0.04, v0 + 0.04, 0, u1 - 0.04, v0 + 0.14, 4, s['dark']), Box(u0 + 0.04, v1 - 0.14, 0, u1 - 0.04, v1 - 0.04, 4, s['dark'])]
            top = 12  # niedriger Schreibtisch zum Knien
            p += [Box(u0 + 0.1, v0 + 0.08, 4, u1 - 0.1, v0 + 0.14, top - 2, s['wood']), Box(u0 + 0.1, v1 - 0.14, 4, u1 - 0.1, v1 - 0.08, top - 2, s['wood'])]
        else:
            # Schubladenblock rechts, zwei Beine links
            p += legs(u0 + 0.02, v0 + 0.02, u1 - 0.02, v0 + 0.5, top - 2, s['dark'], 0.08)[:0]
            p += [Box(u0 + 0.02, v0 + 0.03, 0, u0 + 0.1, v0 + 0.11, top - 2, s['dark']), Box(u1 - 0.1, v0 + 0.03, 0, u1 - 0.02, v0 + 0.11, top - 2, s['dark'])]
            blk = Box(u0 + 0.04, v1 - 0.6, 0, u1 - 0.02, v1 - 0.03, top - 2, s['wood'])
            p.append(blk)
            for i, (a, b) in enumerate(((1, 8), (9, 17))):
                dr = Box(u1 - 0.02, v1 - 0.55, a, u1 + 0.005, v1 - 0.08, b - 1, mul(S(style, 'wood'), 1.06), line=True)
                dr.after = blk
                p.append(dr)
                kn = Box(u1 + 0.005, v1 - 0.34, (a + b) / 2 - 1.2, u1 + 0.02, v1 - 0.28, (a + b) / 2 + 0.6, s['dark'], line=False)
                kn.after = dr
                p.append(kn)
        p.append(Box(u0, v0, top - 2.5, u1, v1, top, s['wood'] if style != 'ice' else '#dfe6ec', grain=0 if style in ('ice', 'office') else 4))
        tz = top
        if computer:
            # drei Bildschirme, Tastatur
            for i, (vc, ang) in enumerate(((0.55, 0), (1.0, 0), (1.45, 0))):
                st = Box(0.34, vc - 0.04, tz, 0.4, vc + 0.04, tz + 4, '#3a3d44')
                scr = Box(0.3, vc - 0.21, tz + 4, 0.36, vc + 0.21, tz + 19, '#2b2f37')
                p += [st, scr]
                colors = [('#2a5a7a', '#7fd08a'), ('#26476e', '#f2c14e'), ('#244a6a', '#f07a6a')][i]

                def screen(cv, P, vc=vc, colors=colors, i=i):
                    q = [P(0.361, vc - 0.18, tz + 5.5), P(0.361, vc + 0.18, tz + 5.5), P(0.361, vc + 0.18, tz + 17.5), P(0.361, vc - 0.18, tz + 17.5)]
                    cv.poly(q, hexc(colors[0]))
                    if i == 0:
                        for k in range(4):
                            cv.line([P(0.362, vc - 0.14, tz + 15.5 - k * 2.6), P(0.362, vc - 0.14 + 0.06 * (k % 3 + 2), tz + 15.5 - k * 2.6)], hexc(colors[1]), 0.8)
                    elif i == 1:
                        pts = [P(0.362, vc - 0.15 + 0.3 * t / 12, tz + 11 + 4 * math.sin(t / 12 * math.tau)) for t in range(13)]
                        cv.line(pts, hexc(colors[1]), 0.9)
                    else:
                        cv.poly([P(0.362, vc - 0.12, tz + 8), P(0.362, vc - 0.12, tz + 14), P(0.362, vc - 0.02, tz + 14), P(0.362, vc - 0.02, tz + 8)], hexc(colors[1]))
                        for k in range(3):
                            cv.line([P(0.362, vc + 0.02, tz + 14 - k * 2.5), P(0.362, vc + 0.14, tz + 14 - k * 2.5)], hexc('#cfe3f0'), 0.7)

                dc = Decal('u+', [0.36, vc - 0.2, tz + 5, 0.37, vc + 0.2, tz + 18], screen)
                dc.after = scr
                p.append(dc)
            p.append(Box(0.58, 0.75, tz, 0.72, 1.25, tz + 1.2, '#e9e9ee'))  # Tastatur
            p.append(Box(0.6, 1.4, tz, 0.7, 1.48, tz + 1.2, '#e9e9ee'))  # Maus
            p.append(Box(0.62, 1.62, tz, 0.78, 1.8, tz + 0.6, '#f5f2e8'))  # Zettel
        else:
            # Dinge auf dem Tisch je Stil
            if style == 'ice':
                p.append(Box(0.3, 0.3, tz, 0.55, 0.8, tz + 9, '#4a5561'))  # Funkgerät
                p.append(Box(0.6, 1.1, tz, 0.78, 1.6, tz + 0.8, '#f5f2e8'))
                p.append(Cyl(0.45, 1.6, 0.06, tz, tz + 5, '#e2702c'))
            elif style == 'asia':
                p.append(Box(0.45, 0.4, tz, 0.75, 0.9, tz + 0.6, '#f3ecd8'))  # Papier
                p.append(Box(0.5, 1.2, tz, 0.62, 1.32, tz + 2, '#2a2a2a'))  # Tuschstein
                p.append(Cyl(0.4, 1.6, 0.07, tz, tz + 6, '#2f4a3a'))
            else:
                p += books(0.42, 0.25, 0.6, tz, 0.26, rnd, ['#a8443a', '#3e6a8a', '#d9b44a', '#5a7a3a'], h=(6, 9))
                p.append(Box(0.55, 1.0, tz, 0.78, 1.4, tz + 0.7, '#f5f2e8'))  # Papier
                lamp_c = s['accent'] if style != 'meadow' else '#c94a3f'
                p.append(Cyl(0.38, 1.65, 0.07, tz, tz + 1.2, '#3a3a3a'))
                p.append(Box(0.37, 1.64, tz + 1, 0.39, 1.66, tz + 10, '#3a3a3a', line=False))
                p.append(Cyl(0.42, 1.62, 0.1, tz + 9, tz + 13, lamp_c, taper=0.4))
        return p

    return parts


def chair(style):
    s = STYLES[style]

    def parts():
        seat = 11
        p = []
        if style == 'office':
            p.append(Cyl(0.5, 0.5, 0.26, 0, 1.5, '#3a3d44', top='#4a4e57'))
            p.append(Cyl(0.5, 0.5, 0.04, 1.5, seat - 2, '#8a8f98'))
            p.append(Box(0.26, 0.26, seat - 2, 0.76, 0.74, seat, '#3d6aa8', soft=True))
            p.append(Box(0.2, 0.3, seat, 0.27, 0.7, seat + 15, '#3d6aa8', soft=True))
            return p
        if style == 'asia':
            # Bodenstuhl (passt zum niedrigen Schreibtisch): Sitzfläche am Boden, Kissen, schräge Lehne
            p.append(Box(0.2, 0.2, 0, 0.8, 0.8, 3, s['wood'], grain=3))
            p.append(Box(0.26, 0.26, 3, 0.78, 0.74, 5.5, '#c9b46a', soft=True))
            p.append(Box(0.2, 0.2, 3, 0.28, 0.8, 18, s['wood']))
            p.append(Box(0.21, 0.32, 6, 0.27, 0.68, 16, s['dark']))
            return p
        legc, seatc = s['dark'], s['wood']
        if style == 'ice':
            legc, seatc = '#6e7b88', '#3d72aa'
        p += legs(0.26, 0.26, 0.76, 0.74, seat - 1.5, legc, 0.06)
        p.append(Box(0.24, 0.24, seat - 1.5, 0.78, 0.76, seat, s['wood'] if style != 'ice' else '#9aa7b3', grain=3 if style not in ('ice',) else 0))
        if style in ('meadow', 'savanna', 'jungle', 'forest'):
            cush = {'meadow': '#d65a4c', 'savanna': '#d0703c', 'jungle': '#3f8a5a', 'forest': '#6f8a46'}[style]
            p.append(Box(0.3, 0.3, seat, 0.72, 0.7, seat + 1.8, cush, soft=True))
        if style == 'ice':
            p.append(Box(0.28, 0.28, seat, 0.74, 0.72, seat + 2, seatc, soft=True))
        # Lehne hinten (u klein)
        back = seat + (18 if style != 'asia' else 12)
        p += [Box(0.24, 0.24, seat, 0.3, 0.3, back, legc), Box(0.24, 0.7, seat, 0.3, 0.76, back, legc)]
        if style == 'jungle':  # Rattan: Lehne als Geflecht
            p.append(Box(0.24, 0.3, seat + 3, 0.29, 0.7, back - 1, '#d8b878'))
        elif style == 'asia':
            p.append(Box(0.24, 0.3, back - 4, 0.3, 0.7, back, s['wood']))
            p.append(Box(0.25, 0.46, seat, 0.29, 0.54, back - 4, s['wood']))
        elif style == 'ice':
            p.append(Box(0.24, 0.3, seat + 5, 0.3, 0.7, back, seatc, soft=True))
        else:
            for k in range(3 if style != 'savanna' else 2):
                z = seat + 6 + k * 5 if style != 'savanna' else seat + 8 + k * 7
                p.append(Box(0.24, 0.3, z, 0.3, 0.7, z + 2.5, s['wood']))
        return p

    return parts


def shelf(style):
    s = STYLES[style]
    rnd = random.Random('shelf' + style)

    def parts():
        u0, u1, v0, v1 = 0.12, 0.5, 0.08, 1.92
        h = 58
        frame = s['wood'] if style != 'ice' else '#9aa7b3'
        p = [Box(u0, v0 + 0.07, 0, u0 + 0.05, v1 - 0.07, h - 2.5, mul(hexc(frame) if isinstance(frame, str) else frame, 0.8))]  # Rückwand
        p += [Box(u0, v0, 0, u1, v0 + 0.07, h - 2.5, frame), Box(u0, v1 - 0.07, 0, u1, v1, h - 2.5, frame)]
        levels = [0, 19, 38]
        for z in levels:
            p.append(Box(u0 + 0.05, v0 + 0.07, z, u1, v1 - 0.07, z + 2.2, frame))
        p.append(Box(u0, v0, h - 2.5, u1 + 0.02, v1, h, frame))
        bcol = {'office': ['#4a6a8a', '#d9b44a', '#a8443a', '#e9e6df'], 'meadow': ['#c94a3f', '#e0b14a', '#6a8a3a', '#f2e6c9'],
                'forest': ['#6a4a2a', '#4a6a3a', '#a8643a', '#c9a45c'], 'savanna': ['#c1582c', '#e0b060', '#7a5a2a', '#8a3a2a'],
                'asia': ['#c9b46a', '#2a2a2a', '#a83a2a', '#e8e0c8'], 'jungle': ['#3f8a5a', '#e5823b', '#d9b44a', '#7a4a2a'],
                'ice': ['#3d72aa', '#e2702c', '#e8eef2', '#55626e']}[style]
        for i, z in enumerate(levels):
            zz = z + 2.2
            if (i + len(style)) % 3 == 1:
                # Gläser bzw. Vasen
                for k, vv in enumerate((0.35, 0.75, 1.2, 1.6)):
                    if rnd.random() < 0.8:
                        p.append(Cyl(u0 + 0.22, vv, 0.08, zz, zz + rnd.uniform(7, 11), rnd.choice(bcol), top=None))
            else:
                p += books(u1 - 0.04, v0 + 0.1, v1 - 0.12, zz, 0.26, rnd, bcol, h=(11, 15))
        return p

    return parts


def plant(style):
    s = STYLES[style]

    def parts():
        pot = Cyl(0.5, 0.5, 0.22, 0, 11, s['pot'], taper=-0.15, rim=mul(S(style, 'pot'), 1.15))
        soil = Cyl(0.5, 0.5, 0.2, 10.5, 11, '#4a3424', line=False)
        p = [pot, soil]
        kind = {'office': 'monstera', 'meadow': 'flowers', 'forest': 'fern', 'savanna': 'aloe', 'asia': 'bonsai', 'jungle': 'banana', 'ice': 'pine'}[style]
        p.append(Custom([0.0, 0.0, 11, 1.0, 1.0, 60], foliage(kind, s)))
        return p

    return parts


def foliage(kind, s, seed=3):
    leafc = hexc(s['leaf'])

    def fn(cv, P):
        rnd = random.Random(kind + str(seed))
        base = (0.5, 0.5, 11)
        if kind in ('monstera', 'banana', 'fern', 'aloe', 'strelitzia'):
            n = {'monstera': 9, 'banana': 7, 'fern': 16, 'aloe': 14, 'strelitzia': 9}[kind]
            leaves = []
            for i in range(n):
                ang = i / n * math.tau + rnd.uniform(-0.3, 0.3)
                if kind == 'monstera':
                    L, wdt, el, dr = rnd.uniform(0.6, 0.78), 0.2, rnd.uniform(0.8, 1.2), 0.5
                elif kind == 'banana':
                    L, wdt, el, dr = rnd.uniform(0.7, 0.9), 0.14, rnd.uniform(1.0, 1.3), 0.55
                elif kind == 'fern':
                    L, wdt, el, dr = rnd.uniform(0.5, 0.7), 0.09, rnd.uniform(0.6, 1.0), 0.45
                elif kind == 'aloe':
                    L, wdt, el, dr = rnd.uniform(0.38, 0.52), 0.065, rnd.uniform(1.0, 1.35), 0.15
                else:
                    L, wdt, el, dr = rnd.uniform(0.6, 0.75), 0.07, rnd.uniform(1.2, 1.4), 0.2
                leaves.append((ang, L, wdt, el, dr))
            # hinten zuerst: Blätter, deren Spitze weiter hinten liegt (kleines u + v)
            leaves.sort(key=lambda t: math.cos(t[0]) + math.sin(t[0]))
            for ang, L, wdt, el, dr in leaves:
                depth = (math.cos(ang) + math.sin(ang)) / 2.8 + 0.5
                c = mul(leafc, 0.75 + 0.45 * depth)
                if kind == 'aloe':
                    c = mul(hexc('#7aa07a'), 0.8 + 0.4 * depth)
                leaf(cv, P, base, ang, el, L, wdt, c, droop=dr)
            if kind == 'strelitzia':
                for ang in (0.6, 2.4):
                    tip = (0.5 + math.cos(ang) * 0.1, 0.5 + math.sin(ang) * 0.1, 50)
                    cv.line([P(0.5, 0.5, 14), P(*tip)], hexc('#4f7a3a'), 0.9)
                    x, y = P(*tip)
                    cv.poly([(x - 1, y), (x + 9, y - 3), (x + 2, y + 1)], hexc('#f08a2a'))
                    cv.poly([(x + 1, y - 1), (x + 5, y - 9), (x + 4, y - 1)], hexc('#3d5fb0'))
        elif kind == 'flowers':
            for i in range(14):
                ang = i / 14 * math.tau
                leaf(cv, P, base, ang, 0.9, 0.36, 0.06, mul(leafc, 0.9 + 0.2 * math.sin(ang)), droop=0.3)
            heads = []
            for i in range(11):
                a = rnd.uniform(0, math.tau)
                r = rnd.uniform(0, 0.2)
                heads.append((0.5 + math.cos(a) * r, 0.5 + math.sin(a) * r, 26 + rnd.uniform(0, 10)))
            heads.sort(key=lambda h: h[0] + h[1])
            for h in heads:
                x, y = P(*h)
                cv.line([P(0.5, 0.5, 12), (x, y)], mul(leafc, 0.8), 0.6)
                col = hexc(rnd.choice(['#e04a4a', '#f2c64a', '#f5f0f0', '#c060c0']))
                for k in range(5):
                    b = k / 5 * math.tau
                    cv.ellipse(x + math.cos(b) * 2.6, y + math.sin(b) * 2.0, 2.3, 1.9, col)
                cv.ellipse(x, y, 1.4, 1.2, hexc('#f5c842'))
        elif kind == 'bonsai':
            trunk = [P(0.5, 0.5, 11), P(0.45, 0.55, 20), P(0.56, 0.48, 27), P(0.5, 0.5, 33)]
            cv.line(trunk, hexc('#5a3a26'), 2.6)
            cv.line([P(0.56, 0.48, 27), P(0.7, 0.4, 31)], hexc('#5a3a26'), 1.6)
            for c, r, sd in (((0.45, 0.58, 34), 9, 1), ((0.72, 0.4, 32), 7, 2), ((0.55, 0.5, 40), 8, 3)):
                blob(cv, P, c, r, leafc, seed=sd)
        elif kind == 'pine':
            cv.line([P(0.5, 0.5, 11), P(0.5, 0.5, 46)], hexc('#5a3a26'), 2)
            for i in range(5):
                z = 16 + i * 6.5
                r = 0.34 - i * 0.055
                x, y = P(0.5, 0.5, z)
                xt, yt = P(0.5, 0.5, z + 11)
                rx = r * TW * 1.4
                col = mul(leafc, 0.85 + i * 0.06)
                cv.poly([(x - rx, y), (xt, yt), (x + rx, y), (x, y + rx * 0.35)], col)
                cv.poly([(x - rx, y), (xt, yt), (x, y + rx * 0.35)], mul(col, 1.15))
                cv.line([(x - rx * 0.8, y + 0.5), (x, y + rx * 0.3), (x + rx * 0.8, y + 0.5)], hexc('#f4f8fb'), 1.2)  # Schnee
    return fn


def sofa(cloth='#8e9db1', legc='#3a2e26', arm=True):
    def parts():
        u0, u1, v0, v1 = 0.18, 0.88, 0.06, 1.94
        seat = 10
        p = legs(u0 + 0.05, v0 + 0.05, u1 - 0.05, v1 - 0.05, 3, legc, 0.07)
        p.append(Box(u0, v0, 3, u1, v1, seat - 2, mul(hexc(cloth), 0.92)))
        # zwei Sitzkissen
        p.append(Box(u0 + 0.18, v0 + 0.16, seat - 2, u1, 1.0, seat + 1, cloth, soft=True))
        p.append(Box(u0 + 0.18, 1.0, seat - 2, u1, v1 - 0.16, seat + 1, cloth, soft=True))
        # Lehne hinten, Armlehnen
        p.append(Box(u0, v0, seat - 2, u0 + 0.22, v1, seat + 15, cloth, soft=True))
        if arm:
            p.append(Box(u0 + 0.22, v0, seat - 2, u1, v0 + 0.17, seat + 6, cloth, soft=True))
            p.append(Box(u0 + 0.22, v1 - 0.17, seat - 2, u1, v1, seat + 6, cloth, soft=True))
        # Zierkissen
        p.append(Box(u0 + 0.2, 0.3, seat + 1, u0 + 0.3, 0.62, seat + 8, '#e07a4a', soft=True))
        p.append(Box(u0 + 0.2, 1.4, seat + 1, u0 + 0.3, 1.72, seat + 8, '#f2c14e', soft=True))
        return p

    return parts


def armchair(cloth='#d9773a'):
    def parts():
        u0, u1, v0, v1 = 0.14, 0.86, 0.14, 0.86
        seat = 9
        p = [Box(u0, v0, 0, u1, v1, seat - 2, mul(hexc(cloth), 0.9))]
        p.append(Box(u0 + 0.2, v0 + 0.16, seat - 2, u1, v1 - 0.16, seat + 1.5, cloth, soft=True))
        p.append(Box(u0, v0, seat - 2, u0 + 0.2, v1, seat + 13, cloth, soft=True))
        p.append(Box(u0 + 0.2, v0, seat - 2, u1, v0 + 0.16, seat + 5, cloth, soft=True))
        p.append(Box(u0 + 0.2, v1 - 0.16, seat - 2, u1, v1, seat + 5, cloth, soft=True))
        return p

    return parts


def coffee_table():
    def parts():
        p = [Cyl(0.5, 0.5, 0.1, 0, 2, '#6b4a2e'), Cyl(0.5, 0.5, 0.05, 2, 10, '#7a5232')]
        p.append(Cyl(0.5, 0.5, 0.33, 10, 12, '#b07a48', top='#c48c56'))

        def deco(cv, P):
            cv.poly([P(0.38, 0.4, 12.1), P(0.6, 0.36, 12.1), P(0.64, 0.5, 12.1), P(0.42, 0.54, 12.1)], hexc('#f3efe4'))
        d = Custom([0.3, 0.3, 12, 0.7, 0.7, 12.2], deco)
        p.append(d)
        p.append(Cyl(0.56, 0.62, 0.05, 12, 18, '#5a8aa8', top='#7aaac8'))

        def flower(cv, P):
            cv.line([P(0.56, 0.62, 17), P(0.55, 0.6, 24)], hexc('#4f7a3a'), 0.6)
            x, y = P(0.55, 0.6, 24)
            for k in range(5):
                b = k / 5 * math.tau
                cv.ellipse(x + math.cos(b) * 1.7, y + math.sin(b) * 1.4, 1.6, 1.4, hexc('#e04a4a'))
            cv.ellipse(x, y, 1, 0.9, hexc('#f5c842'))
        p.append(Custom([0.5, 0.55, 18, 0.62, 0.68, 26], flower))
        return p

    return parts


def rug():
    def parts():
        def fn(cv, P):
            a, b = 0.12, 1.88
            outer = [P(a, a, 0.3), P(b, a, 0.3), P(b, b, 0.3), P(a, b, 0.3)]
            cv.poly(outer, hexc('#c8693c'))
            m = 0.12
            cv.line([P(a + m, a + m, 0.31), P(b - m, a + m, 0.31), P(b - m, b - m, 0.31), P(a + m, b - m, 0.31), P(a + m, a + m, 0.31)], hexc('#f0d9a8'), 1.1)
            m2 = 0.2
            cv.line([P(a + m2, a + m2, 0.31), P(b - m2, a + m2, 0.31), P(b - m2, b - m2, 0.31), P(a + m2, b - m2, 0.31), P(a + m2, a + m2, 0.31)], hexc('#8a3a24'), 0.6)
            for i in range(4):
                for j in range(4):
                    cu, cvv = 0.52 + i * 0.32, 0.52 + j * 0.32
                    d = 0.08
                    cv.poly([P(cu - d, cvv, 0.32), P(cu, cvv - d, 0.32), P(cu + d, cvv, 0.32), P(cu, cvv + d, 0.32)], hexc('#2f6f78' if (i + j) % 2 else '#f0d9a8'))
            cv.line(outer + [outer[0]], hexc('#7a3a20'), 0.6)
            for t in range(13):  # Fransen vorn
                v = a + (b - a) * t / 12
                cv.line([P(b, v, 0.3), P(b + 0.05, v, 0.3)], hexc('#f0e2c0'), 0.5)
        return [Custom([0, 0, 0, 2, 2, 0.4], fn)]

    return parts


def bed(style):
    s = STYLES[style]

    def parts():
        # Kopfende hinten (u klein), Fußende vorn; Grundfläche 2 (u) × 1 (v)
        u0, u1, v0, v1 = 0.08, 1.92, 0.12, 0.88
        p = []
        if style == 'jungle':
            # Hängematte zwischen zwei Pfosten
            post = s['wood']
            p += [Box(0.08, 0.42, 0, 0.18, 0.58, 34, post), Box(1.82, 0.42, 0, 1.92, 0.58, 34, post)]

            def ham(cv, P):
                n = 20
                top_l, top_r, bot = [], [], []
                for i in range(n + 1):
                    t = i / n
                    u = 0.18 + (1.82 - 0.18) * t
                    sag = 22 - 16 * math.sin(math.pi * t)
                    w = 0.3 * math.sin(math.pi * t) ** 0.6
                    top_l.append(P(u, 0.5 - w, sag + 3 * math.sin(math.pi * t)))
                    top_r.append(P(u, 0.5 + w, sag + 3 * math.sin(math.pi * t)))
                    bot.append(P(u, 0.5, sag - 2))
                cv.poly(top_l + top_r[::-1], hexc('#5f8a4a'))
                cv.poly(top_r + bot[::-1], hexc('#4a7038'))
                for k in range(1, 6):
                    cv.line([top_l[k * 3], top_r[k * 3]], hexc('#e5823b'), 0.8)
                cv.line(top_l, hexc('#2f4a26'), 0.6)
                cv.line(top_r, hexc('#2f4a26'), 0.6)
                cv.line([P(0.18, 0.5, 30), top_l[0]], hexc('#d8c08a'), 0.6)
                cv.line([P(1.82, 0.5, 30), top_r[-1]], hexc('#d8c08a'), 0.6)
            h = Custom([0.18, 0.15, 4, 1.82, 0.85, 30], ham)
            p.append(h)
            return p
        frame = s['wood'] if style != 'ice' else '#7e8b97'
        p += legs(u0, v0, u1, v1, 6, mul(hexc(frame) if isinstance(frame, str) else frame, 0.8), 0.08)
        p.append(Box(u0, v0, 4, u1, v1, 9, frame))
        p.append(Box(u0 + 0.12, v0 + 0.04, 9, u1 - 0.04, v1 - 0.04, 13, '#f3f1ea', soft=True))  # Matratze
        blanket = {'savanna': '#d0703c', 'ice': '#3d72aa'}[style]
        p.append(Box(0.75, v0 + 0.02, 12, u1 - 0.02, v1 - 0.02, 14.5, blanket, soft=True))
        stripe = Box(1.2, v0 + 0.01, 13.8, 1.35, v1 - 0.01, 14.6, '#e8cf8f' if style == 'savanna' else '#e8eef2', line=False)
        stripe.after = p[-1]
        p.append(stripe)
        p.append(Box(u0 + 0.18, v0 + 0.14, 13, u0 + 0.5, v1 - 0.14, 17, '#fbfaf6', soft=True))  # Kissen
        p.append(Box(u0, v0, 4, u0 + 0.1, v1, 24, frame))  # Kopfteil
        p.append(Box(u1 - 0.08, v0, 4, u1, v1, 15, frame))  # Fußteil
        if style == 'ice':
            # Stockbett: obere Liege
            for (a, b) in ((u0, v0), (u0, v1 - 0.08), (u1 - 0.08, v0), (u1 - 0.08, v1 - 0.08)):
                p.append(Box(a, b, 4, a + 0.08, b + 0.08, 50, '#6e7b88'))
            p.append(Box(u0 + 0.08, v0, 30, u1 - 0.08, v1, 34, frame))
            p.append(Box(u0 + 0.12, v0 + 0.04, 34, u1 - 0.12, v1 - 0.04, 37.5, '#f3f1ea', soft=True))
            p.append(Box(0.75, v0 + 0.02, 36.5, u1 - 0.12, v1 - 0.02, 39, '#e2702c', soft=True))
            p.append(Box(u0 + 0.18, v0 + 0.14, 37, u0 + 0.5, v1 - 0.14, 41, '#fbfaf6', soft=True))
        if style == 'savanna':
            # Pfosten mit Moskitonetz
            for (a, b) in ((u0, v0), (u0, v1 - 0.06), (u1 - 0.06, v0), (u1 - 0.06, v1 - 0.06)):
                p.append(Box(a, b, 4, a + 0.06, b + 0.06, 52, frame))

            # Rahmen oben und ein Stoffhimmel mit Volant
            p += [Box(u0, v0, 50, u1, v0 + 0.06, 52, frame), Box(u0, v1 - 0.06, 50, u1, v1, 52, frame)]
            p += [Box(u0, v0 + 0.06, 50, u0 + 0.06, v1 - 0.06, 52, frame), Box(u1 - 0.06, v0 + 0.06, 50, u1, v1 - 0.06, 52, frame)]
            p.append(Box(u0 - 0.02, v0 - 0.02, 52, u1 + 0.02, v1 + 0.02, 53.5, '#f1e4c4', soft=True))
            p.append(Box(u0 - 0.02, v0 - 0.02, 47, u1 + 0.02, v1 + 0.02, 50, '#e3c98f', line=True))
        return p

    return parts


def trophy_case():
    def parts():
        wood, dark = '#7a5232', '#5a3a22'
        p = [Box(0.18, 0.18, 0, 0.82, 0.82, 12, wood)]
        p.append(Box(0.2, 0.2, 12, 0.8, 0.8, 13, '#efe6d2'))  # Boden unten
        p.append(Box(0.2, 0.2, 33, 0.8, 0.8, 34, (230, 240, 248, 190)))  # Glasboden oben
        p.append(Box(0.18, 0.18, 13, 0.21, 0.21, 58, '#e6eef4', line=False))  # Pfosten hinten
        # vorn: Holzkante unten, Metallkante am Glasboden, Glas, die drei vorderen Pfosten
        p += [fr(Box(0.2, 0.76, 13, 0.8, 0.8, 17.5, dark)), fr(Box(0.76, 0.2, 13, 0.8, 0.76, 17.5, dark))]
        p += [fr(Box(0.2, 0.775, 34, 0.8, 0.8, 37, '#c9d3da')), fr(Box(0.775, 0.2, 34, 0.8, 0.775, 37, '#c9d3da'))]
        p.append(fr(Box(0.18, 0.18, 13, 0.82, 0.82, 58, (205, 228, 240, 255), alpha=60)))
        for (a, b) in ((0.18, 0.79), (0.79, 0.18), (0.79, 0.79)):
            p.append(fr(Box(a, b, 13, a + 0.03, b + 0.03, 58, '#e6eef4', line=False)))
        p.append(fr(Box(0.16, 0.16, 58, 0.84, 0.84, 62, wood)))  # (vorn: liegt über dem Glas)
        return p

    return parts


def trophy_plinth():
    def parts():
        stone = '#e4e0d8'
        return [Box(0.2, 0.2, 0, 0.8, 0.8, 5, '#cfcac0'), Box(0.3, 0.3, 5, 0.7, 0.7, 30, stone), Box(0.24, 0.24, 30, 0.76, 0.76, 34, '#cfcac0')]

    return parts


def trophy_shelf():
    def parts():
        u0, u1, v0, v1 = 0.12, 0.42, 0.1, 1.9
        wood = '#7a5232'
        p = [Box(u0, v0 + 0.07, 0, u0 + 0.05, v1 - 0.07, 51, '#5a3a22')]
        p += [Box(u0, v0, 0, u1, v0 + 0.07, 51, wood), Box(u0, v1 - 0.07, 0, u1, v1, 51, wood)]
        for z in (0, 26):
            p.append(Box(u0 + 0.05, v0 + 0.07, z, u1, v1 - 0.07, z + 2.5, wood))
            p.append(fr(Box(u1 - 0.03, v0 + 0.07, z + 2.5, u1, v1 - 0.07, z + 5.5, '#6b4628')))  # Kante vorn (verdeckt den Fuß der Plaketten)
        p.append(Box(u0, v0, 51, u1 + 0.02, v1, 54, wood))
        return p

    return parts


# ---------------------------------------------------------------- große Stücke (Aquarium und je Gebiet eins)

def stones(cv, P, face, a0, a1, z0, z1, at, rnd, cols, n=26, rmin=0.06, rmax=0.11):
    """Feldsteine auf einer Seite: face 'u' (Seite u = at, a = v) oder 'v' (Seite v = at, a = u); Mörtel darunter"""
    pts = []
    for i in range(n):
        a = rnd.uniform(a0 + 0.03, a1 - 0.03)
        z = rnd.uniform(z0 + 2, z1 - 2)
        pts.append((a, z))
    pts.sort(key=lambda t: -t[1])
    for a, z in pts:
        r = rnd.uniform(rmin, rmax)
        hz = r * 45 * rnd.uniform(0.55, 0.8)
        ring = []
        for k in range(10):
            t = k / 10 * math.tau
            aa = a + math.cos(t) * r * rnd.uniform(0.85, 1.0)
            zz = z + math.sin(t) * hz * rnd.uniform(0.85, 1.0)
            aa = min(a1, max(a0, aa))
            zz = min(z1, max(z0, zz))
            ring.append(P(at, aa, zz) if face == 'u' else P(aa, at, zz))
        col = hexc(rnd.choice(cols))
        cv.poly(ring, col)
        cv.line(ring + [ring[0]], mul(col, 0.6), 0.5)
        hl = ring[6:9]
        cv.line(hl, mul(col, 1.2), 0.6)


def stove_meadow():
    rnd = random.Random('stove')

    def parts():
        p = []
        body = Box(0.15, 0.1, 4, 0.85, 0.95, 46, '#5f9a78')
        p += [Box(0.12, 0.07, 0, 0.88, 0.98, 4, '#b9a58a'), body, Box(0.12, 0.07, 46, 0.88, 0.98, 50, '#e8e2d2'), Box(0.22, 0.2, 50, 0.78, 0.85, 57, '#5f9a78'), Box(0.2, 0.18, 57, 0.8, 0.87, 59, '#e8e2d2')]

        def grid(side):
            def fn(cv, P):
                for z in range(10, 46, 8):
                    a, b = ((0.85, 0.1, z), (0.85, 0.95, z)) if side == 'u+' else ((0.15, 0.95, z), (0.85, 0.95, z))
                    cv.line([P(*a), P(*b)], hexc('#d8eadc'), 0.5)
                for i in range(1, 5):
                    t = i / 5
                    a, b = ((0.85, 0.1 + 0.85 * t, 4), (0.85, 0.1 + 0.85 * t, 46)) if side == 'u+' else ((0.15 + 0.7 * t, 0.95, 4), (0.15 + 0.7 * t, 0.95, 46))
                    cv.line([P(*a), P(*b)], hexc('#d8eadc'), 0.5)
            return fn
        for side in ('u+', 'v+'):
            t = Decal(side, [0.15, 0.1, 4, 0.86, 0.96, 46], grid(side))
            t.after = body
            p.append(t)

        def door(cv, P):
            q = [P(0.851, 0.38, 10), P(0.851, 0.68, 10), P(0.851, 0.68, 22), P(0.851, 0.53, 26), P(0.851, 0.38, 22)]
            cv.poly(q, hexc('#2a1c14'))
            inner = [P(0.852, 0.42, 11), P(0.852, 0.64, 11), P(0.852, 0.64, 20), P(0.852, 0.53, 23), P(0.852, 0.42, 20)]
            cv.poly(inner, hexc('#f08a2a'))
            cv.poly([P(0.853, 0.46, 11), P(0.853, 0.6, 11), P(0.853, 0.56, 17), P(0.853, 0.5, 19)], hexc('#ffd35a'))
            cv.line(q + [q[0]], hexc('#3a2a1e'), 0.8)
        d = Decal('u+', [0.85, 0.36, 10, 0.86, 0.7, 26], door)
        d.after = body
        p.append(d)
        # Ofenbank mit Kissen und Strickkorb
        p += legs(0.2, 1.0, 0.8, 1.9, 11, '#8a5a32', 0.07)
        p.append(Box(0.18, 0.98, 11, 0.82, 1.92, 13.5, '#c48a52', grain=3))
        p.append(Box(0.22, 1.02, 13.5, 0.78, 1.6, 16, '#d65a4c', soft=True))
        p.append(Cyl(0.55, 1.75, 0.13, 13.5, 20, '#c9a066', top='#5a3a22'))

        def yarn(cv, P):
            for (u, v, z, c) in ((0.5, 1.72, 21, '#e06a9a'), (0.6, 1.8, 20.5, '#6a9ae0'), (0.56, 1.7, 23, '#f2d34a')):
                x, y = P(u, v, z)
                cv.ellipse(x, y, 2.8, 2.6, hexc(c))
                cv.line([(x - 2, y - 1), (x + 2, y + 1)], mul(hexc(c), 0.7), 0.4)
            x, y = P(0.6, 1.72, 24)
            cv.line([(x - 4, y - 5), (x + 2, y + 1)], hexc('#c9b08a'), 0.6)
            cv.line([(x + 3, y - 5), (x - 1, y + 1)], hexc('#c9b08a'), 0.6)
        p.append(Custom([0.42, 1.6, 20, 0.7, 1.9, 28], yarn))
        return p

    return parts


def fireplace_forest():
    rnd = random.Random('fire')
    cols = ['#8d8a84', '#a39f96', '#7a756c', '#9a8f7e', '#b0a89a', '#857a6a']

    def parts():
        p = []
        body = Box(0.1, 0.1, 0, 0.62, 1.9, 44, '#6e6a62')
        p.append(Box(0.62, 0.45, 0, 0.95, 1.55, 2.5, '#9a958c'))  # Herdplatte davor
        p.append(body)

        def front(cv, P):
            r = random.Random('fire1')
            stones(cv, P, 'u', 0.1, 1.9, 0, 44, 0.62, r, cols, n=60)
            stones(cv, P, 'v', 0.1, 0.62, 0, 44, 1.9, r, cols, n=18)
            arch = [P(0.621, 0.6, 2), P(0.621, 1.4, 2), P(0.621, 1.4, 20)] + [P(0.621, 1.0 + 0.4 * math.cos(t / 10 * math.pi), 20 + 7 * math.sin(t / 10 * math.pi)) for t in range(11)] + [P(0.621, 0.6, 20)]
            cv.poly(arch, hexc('#1e1612'))
            # Holzscheite und Flammen
            cv.line([P(0.622, 0.75, 4), P(0.622, 1.25, 6)], hexc('#6a4428'), 2.4)
            cv.line([P(0.622, 0.8, 6), P(0.622, 1.2, 4)], hexc('#7a5232'), 2.4)
            for (a, h, c) in ((0.88, 12, '#e8622a'), (1.0, 16, '#f08a2a'), (1.12, 11, '#e8622a'), (0.95, 10, '#ffd35a'), (1.05, 11, '#ffd35a')):
                cv.poly([P(0.623, a - 0.08, 6), P(0.623, a + 0.08, 6), P(0.623, a + 0.02, 6 + h * 0.6), P(0.623, a, 6 + h), P(0.623, a - 0.03, 6 + h * 0.5)], hexc(c))
        f = Decal('u+', [0.62, 0.1, 0, 0.63, 1.9, 44], front)
        f.after = body
        p.append(f)
        # Sims, Kamin, Geweih
        p.append(Box(0.1, 0.05, 44, 0.72, 1.95, 47.5, '#7a5232', grain=3))
        chim = Box(0.12, 0.5, 47.5, 0.45, 1.5, 82, '#6e6a62')
        p.append(chim)

        def upper(cv, P):
            r = random.Random('fire2')
            stones(cv, P, 'u', 0.5, 1.5, 47.5, 82, 0.45, r, cols, n=30)
            stones(cv, P, 'v', 0.12, 0.45, 47.5, 82, 1.5, r, cols, n=10)
            # Holzschild mit Geweih
            pl = [P(0.452, 0.88, 58), P(0.452, 1.12, 58), P(0.452, 1.12, 66), P(0.452, 0.88, 66)]
            cv.poly(pl, hexc('#7a5232'))
            cv.line(pl + [pl[0]], hexc('#4a3020'), 0.6)
            c = hexc('#e8dcc0')
            for sgn in (-1, 1):
                base = (0.452, 1.0 + sgn * 0.05, 63)
                pts = [P(*base), P(0.452, 1.0 + sgn * 0.2, 70), P(0.452, 1.0 + sgn * 0.3, 78)]
                cv.line(pts, c, 1.5)
                for (v, z, dv, dz) in ((0.14, 67, 0.02, 7), (0.22, 72, 0.08, 5), (0.27, 76, 0.1, 2)):
                    cv.line([P(0.452, 1.0 + sgn * v, z), P(0.452, 1.0 + sgn * (v + dv), z + dz)], c, 1.1)
        u = Decal('u+', [0.45, 0.5, 47.5, 0.46, 1.5, 82], upper)
        u.after = chim
        p.append(u)
        p.append(Box(0.1, 0.45, 82, 0.47, 1.55, 85, '#5e5a52'))
        p.append(Cyl(0.8, 1.7, 0.08, 0, 9, '#4a4a4a'))  # Feuerbesteck
        p.append(Box(0.78, 0.2, 0, 0.92, 0.42, 6, '#8a5a32', grain=2))  # Holzscheite
        return p

    return parts


def drums_savanna():
    def parts():
        p = []

        def fur(cv, P):
            pts = []
            for i in range(28):
                t = i / 28 * math.tau
                r = 0.78 + 0.08 * math.sin(t * 5) + 0.05 * math.sin(t * 3 + 1)
                pts.append(P(1 + math.cos(t) * r, 1 + math.sin(t) * r * 0.85, 0.3))
            cv.poly(pts, hexc('#d9b56a'))
            rnd = random.Random('fur')
            for i in range(26):
                a, b = rnd.uniform(0.35, 1.65), rnd.uniform(0.4, 1.6)
                if (a - 1) ** 2 + ((b - 1) / 0.85) ** 2 > 0.5:
                    continue
                x, y = P(a, b, 0.31)
                cv.ellipse(x, y, 2.6, 1.6, hexc('#5a3a1e'))
                cv.ellipse(x, y, 1.4, 0.8, hexc('#b07a3a'))
            cv.line(pts + [pts[0]], hexc('#a8843e'), 0.5)
        p.append(Custom([0.1, 0.1, 0, 1.9, 1.9, 0.4], fur))
        for (u0, v0, c) in ((0.25, 0.3, '#d0703c'), (0.25, 0.95, '#c94a3a'), (0.85, 0.25, '#e0a040')):
            p.append(Box(u0, v0, 0.4, u0 + 0.45, v0 + 0.5, 5, c, soft=True))
        for (u, v, s_) in ((1.2, 1.3, 1.0), (1.55, 0.85, 0.8), (0.95, 1.6, 0.7)):
            p.append(Cyl(u, v, 0.09 * s_, 0, 9 * s_, '#7a4a24', taper=-0.4))
            p.append(Cyl(u, v, 0.17 * s_, 9 * s_, 20 * s_, '#9a5a2c', top='#efe0c0', taper=-0.15, rim=hexc('#5a3018')))

            def rope(cv, P, u=u, v=v, s_=s_):
                for k in range(7):
                    t = -0.6 + k * 0.2
                    a = P(u + math.cos(t + 0.8) * 0.17 * s_, v + math.sin(t + 0.8) * 0.17 * s_, 19 * s_)
                    b = P(u + math.cos(t + 0.9) * 0.09 * s_, v + math.sin(t + 0.9) * 0.09 * s_, 9 * s_)
                    cv.line([a, b], hexc('#e8d6a0'), 0.4)
            r = Custom([u - 0.18 * s_, v - 0.18 * s_, 9 * s_, u + 0.18 * s_, v + 0.18 * s_, 20 * s_], rope)
            r.after = p[-1]
            p.append(r)
        return p

    return parts


def fountain_asia():
    def parts():
        p = [Cyl(0.55, 0.55, 0.36, 0, 9, '#8a8c86', top='#6a8fa8', rim=hexc('#a9aba4'))]

        def water(cv, P):
            x, y = P(0.55, 0.55, 9.1)
            cv.ellipse(x, y, 0.3 * TW * 1.41, 0.3 * TH * 1.41, hexc('#7fb3cf'))
            cv.ellipse_line(x + 2, y + 1, 5, 2.5, hexc('#d6ecf6'), 0.5)
            cv.ellipse_line(x + 2, y + 1, 9, 4.5, (214, 236, 246, 160), 0.4)
        w = Custom([0.25, 0.25, 9, 0.85, 0.85, 9.2], water)
        w.after = p[0]
        p.append(w)
        rnd = random.Random('pebbles')
        for i in range(9):
            a = rnd.uniform(0, math.tau)
            p.append(Cyl(0.55 + math.cos(a) * 0.42, 0.55 + math.sin(a) * 0.42, 0.05, 0, 2.5, rnd.choice(['#c9c4b8', '#9a958c', '#e0dbd0']), line=False))
        # Bambusrohr: Pfosten hinten, schräges Rohr zur Schale, Wasserstrahl
        p.append(Cyl(0.14, 0.2, 0.05, 0, 30, '#a8b45a', top='#d8d890'))
        p.append(Cyl(0.24, 0.14, 0.04, 0, 22, '#9aa84e', top='#d8d890'))

        def pipe(cv, P):
            a, b = P(0.14, 0.2, 27), P(0.42, 0.45, 20)
            cv.line([a, b], hexc('#8a9a42'), 2.4)
            cv.line([a, b], hexc('#b8c46a'), 1.2)
            for t in (0.35, 0.7):
                x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
                cv.ellipse(x, y, 1.4, 1.4, hexc('#6a7a30'))
            cv.line([b, (b[0] + 1, b[1] + 3), P(0.48, 0.5, 9.3)], (200, 230, 245, 230), 0.9)
            x, y = P(0.48, 0.5, 9.3)
            cv.ellipse_line(x, y, 3, 1.5, hexc('#e8f6fc'), 0.5)
        p.append(Custom([0.12, 0.14, 9, 0.5, 0.5, 30], pipe))
        for z in (8, 16, 24):  # Knoten am Pfosten
            p.append(Cyl(0.14, 0.2, 0.055, z, z + 1, '#7a8a36', line=False))
        p.append(Custom([0.7, 0.05, 2, 1.0, 0.35, 30], foliage('fern', STYLES['asia'], seed=5) if False else (lambda cv, P: [leaf(cv, P, (0.85, 0.2, 2), a, 1.1, 0.3, 0.05, mul(hexc('#5f9a46'), 0.9 + 0.1 * i % 2), droop=0.2) for i, a in enumerate((2.0, 2.6, 3.3, 3.9, 4.6, 1.4))])))
        return p

    return parts


def tree_jungle():
    def parts():
        p = [Cyl(0.5, 0.55, 0.3, 0, 14, '#8e5c3a', taper=-0.12, rim=hexc('#a8744a')), ]
        p.append(Cyl(0.5, 0.55, 0.28, 13.5, 14, '#4a3424', line=False))

        def tree(cv, P):
            trunk = [P(0.5, 0.55, 14), P(0.45, 0.6, 30), P(0.52, 0.52, 48), P(0.5, 0.55, 64)]
            cv.line(trunk, hexc('#6a4a2e'), 4.2)
            cv.line(trunk, hexc('#8a6440'), 2.0)
            cv.line([P(0.47, 0.58, 40), P(0.3, 0.75, 56)], hexc('#6a4a2e'), 2.2)
            cv.line([P(0.52, 0.52, 46), P(0.72, 0.4, 60)], hexc('#6a4a2e'), 2.2)
            for c, r, sd in (((0.3, 0.8, 60), 16, 1), ((0.75, 0.35, 62), 15, 2), ((0.5, 0.55, 72), 18, 3), ((0.38, 0.45, 70), 13, 4), ((0.62, 0.68, 66), 14, 5)):
                blob(cv, P, c, r, hexc('#3f8a3a'), n=22, seed=sd)
        p.append(Custom([0.0, 0.05, 14, 1.0, 1.1, 92], tree))
        # Sitzstange mit Ara
        p.append(Cyl(0.5, 1.5, 0.16, 0, 2, '#5a4030', top='#6a4a36'))
        p.append(Cyl(0.5, 1.5, 0.025, 2, 40, '#8a6440'))
        p.append(Box(0.47, 1.3, 40, 0.53, 1.7, 42, '#8a6440'))

        def parrot(cv, P):
            x, y = P(0.5, 1.52, 42)
            body = [(x - 3, y - 2), (x + 3, y - 2), (x + 4, y - 9), (x + 1, y - 15), (x - 3, y - 13), (x - 4, y - 7)]
            cv.poly([(x - 1, y - 2), (x + 2, y - 2), (x + 1, y + 13), (x - 1, y + 12)], hexc('#2f6ac0'))  # Schwanz
            cv.poly(body, hexc('#d8302a'))
            cv.poly([(x + 1, y - 4), (x + 4, y - 7), (x + 3, y - 12), (x, y - 9)], hexc('#2f6ac0'))  # Flügel
            cv.poly([(x + 1, y - 7), (x + 3.5, y - 8.5), (x + 3, y - 11), (x + 0.5, y - 9.5)], hexc('#f2c64a'))
            cv.ellipse(x - 1, y - 16, 3.6, 3.4, hexc('#d8302a'))
            cv.ellipse(x - 2.4, y - 16.5, 1.8, 1.6, hexc('#f4f0ea'))
            cv.ellipse(x - 2.6, y - 16.8, 0.6, 0.6, hexc('#1a1a1a'))
            cv.poly([(x - 4, y - 17), (x - 7, y - 15.5), (x - 5, y - 13.5), (x - 3.5, y - 15)], hexc('#2a2a2a'))
            cv.line(body + [body[0]], hexc('#8a1a16'), 0.5)
            cv.line([(x - 2, y - 2), (x - 2, y)], hexc('#5a5a5a'), 0.6)
            cv.line([(x + 1, y - 2), (x + 1, y)], hexc('#5a5a5a'), 0.6)
        p.append(Custom([0.45, 1.45, 42, 0.55, 1.6, 62], parrot))
        return p

    return parts


def igloo_ice():
    def parts():
        cu, cvv, R, H = 1.0, 1.0, 0.86, 40

        def dome(cv, P):
            n = 22
            for i in range(n):
                phi = i / n * math.pi / 2
                r = R * math.cos(phi)
                z = H * math.sin(phi)
                ring = [P(cu + r * math.cos(t / 40 * math.tau), cvv + r * math.sin(t / 40 * math.tau), z) for t in range(40)]
                xs = [q[0] for q in ring]
                cv.face_h(ring, mul(hexc('#f4f8fb'), 1.0 - 0.02 * (n - i) / n), mul(hexc('#b9cad8'), 1.0 + 0.1 * i / n), min(xs), max(xs))
            # Fugen: Ringe (vordere Hälfte) und versetzte senkrechte Fugen
            for i in range(1, 6):
                phi = i / 6 * math.pi / 2
                r, z = R * math.cos(phi), H * math.sin(phi)
                arc = [P(cu + r * math.cos(t), cvv + r * math.sin(t), z) for t in [(-0.25 + k / 20 * 1.5) * math.pi for k in range(21)]]
                cv.line(arc, hexc('#9fb4c6'), 0.6)
                for k in range(7):
                    t = (-0.2 + (k + (i % 2) * 0.5) / 6 * 1.4) * math.pi
                    phi2 = (i + 1) / 6 * math.pi / 2
                    a = P(cu + r * math.cos(t), cvv + r * math.sin(t), z)
                    b = P(cu + R * math.cos(phi2) * math.cos(t), cvv + R * math.cos(phi2) * math.sin(t), H * math.sin(phi2))
                    cv.line([a, b], hexc('#a9bccd'), 0.5)
            # Eingang nach +u mit warmem Licht (nur, wenn er zur Kamera zeigt)
            if P(cu + R, cvv, 0)[1] <= P(cu, cvv, 0)[1]:
                return
            arch = [P(cu + R * math.cos(t) * 1.001, cvv + R * math.sin(t) * 1.001, 0) for t in (-0.32, 0.32)]
            top = [P(cu + R * math.cos(t) * math.cos(0.55), cvv + R * math.sin(t) * math.cos(0.55), H * math.sin(0.55) * (1 - abs(t) * 1.4)) for t in [0.32 - k * 0.064 for k in range(11)]]
            hole = [arch[0], arch[1]] + top[::-1][::-1]
            hole = [arch[1]] + top + [arch[0]]
            cv.poly(hole, hexc('#3a2a24'))
            x, y = P(cu + R * 0.9, cvv, 6)
            cv.ellipse(x, y, 7, 6, (255, 190, 90, 150))
            cv.ellipse(x, y + 1, 4, 3.5, (255, 220, 140, 200))
        p = [Custom([cu - R, cvv - R, 0, cu + R, cvv + R, H], dome)]
        # Fell und Kissen vor dem Eingang, Bücher, Laterne
        p.append(Box(1.7, 0.7, 0, 1.98, 1.3, 1.5, '#e8e2d6', soft=True))
        p.append(Box(1.72, 0.78, 1.5, 1.95, 1.08, 5, '#3d72aa', soft=True))
        p.append(Box(1.78, 1.12, 1.5, 1.93, 1.26, 4, '#e2702c'))
        p.append(Box(1.79, 1.13, 4, 1.92, 1.25, 6, '#f2e6c9'))
        p.append(Cyl(1.75, 1.72, 0.07, 0, 8, '#5d6c7a', top='#ffd98a'))
        return p

    return parts


def aquarium():
    """großes Becken bis zum Boden (Andre: man soll die Fische gut sehen): schmaler Sockel, Wasser von fast unten bis oben"""
    def parts():
        p = [Box(0.18, 0.06, 0, 0.84, 1.94, 4, '#3a3836')]  # Sockel
        p.append(Box(0.2, 0.08, 4, 0.24, 1.92, 52, '#1f4a66'))  # Rückwand
        p.append(Box(0.24, 0.08, 4, 0.82, 1.92, 8, '#a8936a', grain=6))  # Kies
        p.append(Cyl(0.42, 1.45, 0.13, 8, 15, '#8a8c86', taper=0.4))  # Stein
        p.append(Cyl(0.4, 0.55, 0.09, 8, 12, '#9a8f7e', taper=0.3))

        def plants(cv, P):
            for (u, v, n, c, h) in ((0.34, 0.32, 6, '#3f8a3a', 0.4), (0.33, 1.0, 5, '#5aa04a', 0.32), (0.32, 1.7, 7, '#2f7a4a', 0.44)):
                for k in range(n):
                    ang = (k / n) * math.pi - math.pi / 2  # nur nach vorn und zur Seite, nicht durchs Glas hinten
                    leaf(cv, P, (u, v, 8), ang, 1.5, h, 0.035, mul(hexc(c), 0.85 + 0.25 * (k % 2)), droop=0.06)
        p.append(Custom([0.24, 0.12, 8, 0.6, 1.88, 46], plants))
        p.append(fr(Box(0.22, 0.08, 8, 0.82, 1.92, 48, (90, 170, 215, 255), alpha=90, line=False)))  # Wasser
        p.append(fr(Box(0.2, 0.06, 4, 0.84, 1.94, 52, (220, 240, 250, 255), alpha=25)))  # Glas
        for (a, b) in ((0.81, 0.06), (0.81, 1.91), (0.2, 1.91)):
            p.append(fr(Box(a, b, 4, a + 0.03, b + 0.03, 52, '#2a2826', line=False)))
        p.append(fr(Box(0.18, 0.04, 52, 0.86, 1.96, 54.5, '#3a3836')))  # Deckel
        return p

    return parts


# Schwimmraum der Fische (u, v, z) im Aquarium
SWIM = {'aquarium': (0.34, 0.25, 13, 0.76, 1.75, 44)}


# Trophäen-Plätze (u, v, z: Mitte der Plakette), werden je Ansicht ins Bild umgerechnet
SLOTS = {
    'trophy_plinth': [(0.5, 0.5, 43)],
    'trophy_case': [(0.5, 0.5, 21), (0.5, 0.5, 42)],  # eine je Etage
    'trophy_shelf': [(0.3, 0.55, 10), (0.3, 1.45, 10), (0.3, 0.55, 36), (0.3, 1.45, 36)],
}

ITEMS = {}


def add(id, parts, size, views):
    ITEMS[id] = {'parts': parts, 'size': size, 'views': views}


add('computer_desk', desk('office', computer=True), (1, 2), 4)
add('office_sofa', sofa(), (1, 2), 4)
add('office_armchair', armchair(), (1, 1), 4)
add('office_table', coffee_table(), (1, 1), 1)
add('office_chair', chair('office'), (1, 1), 4)
add('office_rug', rug(), (2, 2), 2)
add('office_monstera', plant('office'), (1, 1), 1)
add('office_strelitzia', lambda: [Cyl(0.5, 0.5, 0.2, 0, 12, '#3a3d44', taper=-0.1, rim=hexc('#5a5e66')), Cyl(0.5, 0.5, 0.18, 11.5, 12, '#4a3424', line=False), Custom([0, 0, 12, 1, 1, 60], foliage('strelitzia', STYLES['office']))], (1, 1), 1)
for st in ('meadow', 'forest', 'savanna', 'asia', 'jungle', 'ice'):
    add(f'desk_{st}', desk(st), (1, 2), 4)
    add(f'chair_{st}', chair(st), (1, 1), 4)
    add(f'shelf_{st}', shelf(st), (1, 2), 4)
    add(f'plant_{st}', plant(st), (1, 1), 1)
add('bed_savanna', bed('savanna'), (2, 1), 4)
add('bed_jungle', bed('jungle'), (2, 1), 2)
add('bed_ice', bed('ice'), (2, 1), 4)
add('trophy_plinth', trophy_plinth(), (1, 1), 1)
add('trophy_case', trophy_case(), (1, 1), 1)
add('trophy_shelf', trophy_shelf(), (1, 2), 4)
add('aquarium', aquarium(), (1, 2), 2)
add('stove_meadow', stove_meadow(), (1, 2), 4)
add('fireplace_forest', fireplace_forest(), (1, 2), 4)
add('drums_savanna', drums_savanna(), (2, 2), 4)
add('fountain_asia', fountain_asia(), (1, 1), 4)
add('tree_jungle', tree_jungle(), (1, 2), 4)
add('igloo_ice', igloo_ice(), (2, 2), 4)


def main(only=None):
    meta = {}
    os.makedirs('public/assets/hd', exist_ok=True)
    for id, item in ITEMS.items():
        if only and id not in only:
            continue
        arts = []
        for k in range(item['views']):
            has_slots = id in SLOTS and (k < 2 or item['views'] == 1)  # (von hinten: keine Plaketten)
            img, front, f = render(item, k, split=has_slots or id in SWIM)
            key = f'fn_{id}_{k}'
            for kk, im in ((key, img), (key + '_f', front)):
                if im is None:
                    continue
                im.save(f'public/assets/hd/{kk}.png', optimize=True)
                if kk == key and front is not None:  # einfache Fassung (Katalog-Bildchen): beide Ebenen zusammen
                    im = im.copy()
                    im.alpha_composite(front)
                small = im.resize((max(1, round(im.width / HD)), max(1, round(im.height / HD))), Image.LANCZOS)
                small.save(f'public/assets/{kk}.png', optimize=True)
            w, h = img.width / HD, img.height / HD
            ox, oy = img.info['ox'] / HD, img.info['oy'] / HD
            W, D = item['size']
            wk, dk = (W, D) if k % 2 == 0 else (D, W)
            ax, ay = (wk / 2 - dk / 2) * TW, (wk / 2 + dk / 2) * TH
            slots = []
            swim = {}
            if id in SWIM:  # Schwimmraum in dieser Ansicht (Kacheln, Höhe) und der Fußpunkt (Bildpunkte), siehe GardenScene
                u0, v0, z0, u1, v1, z1 = SWIM[id]
                (a0, b0), (a1, b1) = f(u0, v0), f(u1, v1)
                swim = {'swim': [round(min(a0, a1), 3), round(min(b0, b1), 3), z0, round(max(a0, a1), 3), round(max(b0, b1), 3), z1], 'anchor': [ax, ay]}
            for (u, v, z) in (SLOTS[id] if has_slots else []):
                a, b = f(u, v)
                slots.append([round((a - b) * TW - ax, 1), round((a + b) * TH - z - ay, 1)])
            arts.append({'w': round(w, 2), 'h': round(h, 2), 'ox': round(ox, 2), 'oy': round(oy, 2), **({'slots': slots} if slots else {}), **({'front': True} if front is not None else {}), **swim})
        meta[id] = {'size': list(item['size']), 'views': item['views'], 'art': arts}
        print(id, item['views'], [f"{a['w']:.0f}x{a['h']:.0f}" for a in arts])
    if only:
        return meta
    js = ('// Erzeugt von tools/furniture-sprites.py – nicht von Hand ändern.\n'
          '// Möbel im Haupthaus: Grundfläche [u, v] in Ansicht 0, Zahl der Ansichten, je Ansicht Bildgröße, Fußpunkt (Bildpunkte)\n'
          '// und Plätze der Trophäen-Plaketten (vom Fußpunkt aus); front: vordere Ebene fn_<id>_<Ansicht>_f über den Plaketten.\n'
          f'export const FURNITURE_ART = {json.dumps(meta, separators=(",", ":"))};\n')
    open('src/world/furnitureArt.js', 'w', encoding='utf-8').write(js)


if __name__ == '__main__':
    import sys
    main(sys.argv[1:] or None)
