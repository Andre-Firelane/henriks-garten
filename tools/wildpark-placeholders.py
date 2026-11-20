"""Aufruf: python tools/wildpark-placeholders.py   (braucht Pillow; danach python tools/make-webp.py .)
Platzhalter für den Wildpark im Tierpark (siehe docs/plan-wildpark.md), bis echte Bilder da sind: der Torbogen über
dem großen Tor (zwei Pfosten, schräger Querbalken, darauf eine leere schräge Tafel). Die Tafel liegt isometrisch in
der Richtung des Zauns; den Schriftzug („Wildpark“ bzw. „Wildlife Park“) schreibt das Spiel darauf, schräg wie auf den
Wegweisern (signLabel in GardenScene). Gezeichnet wie die übrigen Wald-Platzhalter (tools/sprite_draw.py), in allen
Auflösungen; Vorlage zum Nachmalen in Wald-Sprites/Neu.

wildpark_arch (128 x 176): steht über zwei Torkacheln in einem Zaun entlang ty. Fußpunkt (Mitte zwischen den beiden
Kacheln) bei (64, 156); der hintere Pfosten steht 32 rechts und 16 höher, der vordere 32 links und 16 tiefer. Mitte
der Tafel bei (64, 44), also 112 Pixel über dem Fußpunkt; sie steigt 1 Pixel je 2 Pixel nach rechts.
ONLY=name: nur dieses eine Bild."""
import sprite_draw
from sprite_draw import Pic, dark, light, save_all

sprite_draw.EXPORT = 'Wald-Sprites/Neu'

WOOD = (128, 86, 52, 255)
WOOD_DARK = (96, 62, 36, 255)
BOARD = (196, 150, 96, 255)
BOARD_EDGE = (110, 72, 40, 255)
SLOPE = -0.5  # Richtung des Zauns entlang ty im Bild: 2 Pixel nach rechts, 1 Pixel nach oben

W, H = 128, 176
AX, AY = 64, 156  # Fußpunkt: Mitte zwischen den beiden Torkacheln
POST_H = 92


def post(p, x, y):
    """runder Holzpfosten vom Boden (x, y) nach oben, mit Kappe"""
    p.rect(x - 4, y - POST_H, x + 4, y, WOOD)
    p.line([(x - 1.5, y - POST_H + 4), (x - 1.5, y - 3)], light(WOOD), w=1.2, ol=False)  # Licht von links
    p.ell(x, y - POST_H, 5, 2.5, light(WOOD, 0.2))


def arch():
    p = Pic(W, H)
    back = (AX + 32, AY - 16)
    front = (AX - 32, AY + 16)
    p.shadow(back[0], back[1], 7, 3)
    p.shadow(front[0], front[1], 7, 3)
    post(p, *back)
    # Querbalken von Pfosten zu Pfosten (schräg wie die Torkacheln), etwas überstehend
    top = POST_H - 6
    bx0, by0 = back[0] + 8, back[1] - top - 4
    bx1, by1 = front[0] - 8, front[1] - top + 4
    p.line([(bx0, by0), (bx1, by1)], WOOD, w=7)
    p.line([(bx0, by0 - 2), (bx1, by1 - 2)], light(WOOD, 0.25), w=1.5, ol=False)
    # Tafel über dem Balken, schräg in derselben Richtung (isometrisch), auf zwei Stützen
    cx, cy = AX, (by0 + by1) / 2 - 26  # Mitte der Tafel
    HW, HH = 42, 11  # halbe Breite (waagrecht gemessen), halbe Höhe
    sl = lambda x, y: (x, y + SLOPE * (x - cx))  # Punkt der flachen Tafel -> schräg
    beam_y = lambda x: by0 + (by1 - by0) * (x - bx0) / (bx1 - bx0)
    for sx in (-26, 26):
        x, y = sl(cx + sx, cy + HH)
        p.line([(x, y - 2), (x, beam_y(x) - 2)], WOOD_DARK, w=3)
    p.poly([sl(cx - HW, cy - HH), sl(cx + HW, cy - HH), sl(cx + HW, cy + HH), sl(cx - HW, cy + HH)], BOARD_EDGE)
    p.poly([sl(cx - HW + 3, cy - HH + 3), sl(cx + HW - 3, cy - HH + 3), sl(cx + HW - 3, cy + HH - 3), sl(cx - HW + 3, cy + HH - 3)], BOARD, ol=False)
    for gy in (-HH + 5, HH - 5):  # Holzmaserung
        p.line([sl(cx - HW + 5, cy + gy), sl(cx + HW - 5, cy + gy)], dark(BOARD, 0.9), w=0.6, ol=False)
    for nx in (-HW + 3, HW - 3):  # Nägel in den Ecken
        for ny in (-HH + 3, HH - 3):
            x, y = sl(cx + nx, cy + ny)
            p.ell(x, y, 1, 1, (70, 60, 50, 255), ol=False)
    post(p, *front)  # vorderer Pfosten vor dem Balken
    save_all(p.im, 'wildpark_arch', W, H)


arch()
