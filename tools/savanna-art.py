"""Aufruf: python tools/savanna-art.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Echte Bilder für die Savanne an die Stelle der Platzhalter setzen (Vorlagen: Savanne-Sprites/Neu, siehe
tools/art_place.py). JPGs auf weißem Grund werden freigestellt."""
from art_place import install

REF = 'Savanne-Sprites/Neu'  # Platzhalter aus tools/savanna-placeholders.py
ART = {
    # Elefantenfriedhof
    'savanna_skull': 'Sprites/Elefantenschädel.jpg',
    'savanna_ribs': 'Sprites/Elefantenrippen.jpg',
    'savanna_pelvis': 'Sprites/Elefantenknochen1.jpg',
    'savanna_bones': 'Sprites/Elefantenknochen2.jpg',
}
install(ART, REF, lambda n: n)

# Andres Fassungen der nachgezeichneten Bilder (Sprites/scenario-assets-savanne-und-felsen), im Rahmen der Zeichnungen aus
# tools/redrawn-sprites.py bzw. tools/savanna-placeholders.py (Vorlagen in Neue-Sprites)
SRC2 = 'Sprites/scenario-assets-savanne-und-felsen'
ART2 = {'savanna_bush': 3, 'savanna_bush_rain': 4, 'savanna_kopje': 5, 'savanna_rock0': 6, 'savanna_rock1': 7, 'savanna_rock2': 8,
        'savanna_rock3': 9, 'savanna_rock4': 10, 'savanna_termite': 11}
install(ART2, 'Neue-Sprites', lambda n: f'{SRC2}/Wald_neu{"" if n == 0 else f"-{n}"}.png')
