"""Aufruf: python tools/meadow-art.py   (braucht Pillow und numpy; danach python tools/make-webp.py .)
Echte Bilder für die Wiese (Sprites/scenario-assets-wiese neu) an die Stelle der Platzhalter setzen: jedes Bild kommt in
die Box des Platzhalters (Wiese-Sprites/Neu, 4-fach), unten mittig, so groß es hineinpasst; der weiche Schatten des
Platzhalters bleibt. So bleiben Größe und Fußpunkt (originY in map.js) gleich. Schreibt public/assets (alte Größe),
hd/ (4-fach) und hd2/ (2-fach)."""
from art_place import install

SRC = 'Sprites/scenario-assets-wiese neu'
REF = 'Wiese-Sprites/Neu'  # Platzhalter aus tools/meadow-placeholders.py

src = lambda n: n if isinstance(n, str) else f'{SRC}/Wald_neu{"" if n == 0 else f"-{n}"}.png'
ART = {
    'bee': 0, 'beehive': 2, 'birdhouse': 3, 'cabbages': 4, 'clothesline': 5, 'corn': 6, 'dandelion_blown': 8, 'duck': 10,
    'duck_fly0': 11, 'duck_fly1': 12, 'hay_bale': 16, 'lily_pads': 17, 'mailbox': 18, 'meadow_bench': 19, 'meadow_well': 21,
    'pumpkins': 22, 'scarecrow': 23, 'sunflowers': 24, 'windmill': 26, 'windmill_sails': 27, 'woodpile': 28,
    'willow': 'Sprites/Trauerweide.jpg',  # einzeln nachgeliefert (JPG auf weißem Grund, wird freigestellt)
}
CENTER = {'windmill_sails'}  # mittig statt unten (dreht sich um die Bildmitte)

install(ART, REF, src, CENTER)
