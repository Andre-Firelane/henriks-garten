// Schneidet die vier Ansichten aus den gemalten Figuren in Sprites/ aus,
// verkleinert sie und legt sie als Spritesheets in public/assets/ ab.
// Aufruf: npm run characters

import { PNG } from 'pngjs';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

// frameW/frameH/feetY müssen zu den Werten in src/scenes/BootScene.js und den Figuren-Klassen passen.
// Reihenfolge der Ansichten steht als Kommentar dabei (Original von links nach rechts).
// Maßstab der Kuh (wie farm_cow.png), damit sie beim Fressen gleich groß bleibt
// Maßstab des Pandas (laufend und sitzend gleich groß)
const PANDA_SCALE = 0.3;
// Maßstab des Japanmakaken (laufend und badend gleich groß)
const MACAQUE_SCALE = 0.27;
const COW_SCALE = 0.36;
// Maßstab des Wolfs (laufend, heulend und fressend gleich groß)
const WOLF_SCALE = 0.213;
// Maßstab des Nilpferds (an Land und schwimmend gleich groß) und der Hyäne (laufend und fressend)
const CAT2_SCALE = 0.275; // Perserkatze (Katze 2): Laufen, Fressen und Schlafen im selben Maßstab
const HIPPO_SCALE = 0.3;
const HYENA_SCALE = 0.25;
// Maßstab des Brüllaffen (laufend, springend und fressend gleich groß) und des Kanus (leer und mit Henrik darin)
const HOWLER_SCALE = 0.25;
const CANOE_SCALE = 0.57;
const CHARACTERS = [
  // unten-rechts, unten-links, oben-rechts, oben-links
  { src: 'Sprites/Main Character.png', out: 'hero.png', frameW: 72, frameH: 116, feetY: 112, figureH: 108 },
  // Kleidung je Gebiet (gleiche Maße wie oben); freigestellt mit npm run cutout
  { src: 'Sprites/Charakter Wald.png', out: 'hero_forest.png', frameW: 72, frameH: 116, feetY: 112, figureH: 108 },
  { src: 'Sprites/Charakter Savanne.png', out: 'hero_savanna.png', frameW: 72, frameH: 116, feetY: 112, figureH: 108 },
  { src: 'Sprites/Charakter Asien.png', out: 'hero_asia.png', frameW: 72, frameH: 116, feetY: 112, figureH: 108 },
  { src: 'Sprites/Charakter Riff.png', out: 'hero_swim.png', frameW: 72, frameH: 116, feetY: 112, figureH: 110 }, // im Taucheranzug (Unterwasserwelt)
  // Seepferdchen (Riff): im Bild unten-links, unten-rechts, oben-links, oben-links – die ersten drei gespiegelt ergibt die übliche Reihenfolge
  { src: 'Sprites/Seepferdchen.png', out: 'seahorse.png', frameW: 48, frameH: 64, feetY: 60, figureH: 56, mirror: [0, 1, 2], stripShadow: true },
  // Krake (Riff): unten-rechts, unten-links, oben-rechts, oben-links
  { src: 'Sprites/Krake.png', out: 'octopus.png', frameW: 72, frameH: 72, feetY: 68, figureH: 60, stripShadow: true },
  // Meeresschildkröte (Riff): unten-rechts, unten-links, oben-rechts, oben-links (turtle_net: dieselbe im Fischernetz, Bild kommt noch)
  { src: 'Sprites/Unterseeschildkröte.png', out: 'turtle.png', frameW: 112, frameH: 88, feetY: 84, figureH: 76, stripShadow: true },
  // Rochen und Mantarochen (Riff): im Bild schwimmen die ersten beiden nach unten-links, die anderen nach oben-rechts.
  // Die Schwänze ragen in die Nachbarbilder, daher nach zusammenhängenden Teilen getrennt; Bild 0 und 3 gespiegelt
  // ergibt unten-rechts, unten-links, oben-rechts, oben-links
  { src: 'Sprites/Rochen.png', out: 'ray.png', frameW: 112, frameH: 80, feetY: 76, figureH: 66, byComponents: true, mirror: [0, 3] }, // ohne stripShadow: der Rochen selbst ist grau
  { src: 'Sprites/Rochen2.png', out: 'ray2.png', frameW: 112, frameH: 80, feetY: 76, figureH: 66, byComponents: true, mirror: [0, 3] }, // ohne stripShadow: der Rochen selbst ist grau
  // Qualle (Riff, Event): die zweite Vorderansicht hat kein Gesicht – unten-links ist daher die gespiegelte erste;
  // freigestellt mit npm run cutout und tools/jelly-cut.cjs; die Goldqualle (seltene Variante) genauso
  { src: 'Sprites/Qualle.png', out: 'jellyfish.png', frameW: 64, frameH: 96, feetY: 92, figureH: 88, copyMirror: { 1: 0 } },
  { src: 'Sprites/Qualle2.png', out: 'jellyfish2.png', frameW: 64, frameH: 96, feetY: 92, figureH: 88, copyMirror: { 1: 0 } },
  // unten-rechts, unten-links, oben-rechts, oben-links
  { src: 'Sprites/Schaf.png', out: 'sheep.png', frameW: 80, frameH: 88, feetY: 84, figureH: 72 },
  // Schaf beim Grasen (Kopf unten); gleicher Maßstab wie oben (0,243). Freigestellt mit npm run cutout
  { src: 'Sprites/Schaf fressend.png', out: 'sheep_eat.png', frameW: 80, frameH: 88, feetY: 84, figureH: 61.2 },
  // unten-rechts, unten-links, oben-rechts, oben-links; der gemalte graue Bodenschatten wird entfernt
  { src: 'Sprites/Katze.png', out: 'cat.png', frameW: 72, frameH: 80, feetY: 76, figureH: 60, stripShadow: true },
  // Katze schlafend (eingerollt, auf dem Kratzbaum); gleicher Maßstab wie oben (0,214). Freigestellt mit npm run cutout
  { src: 'Sprites/Katze schlafend.png', out: 'cat_sleep.png', frameW: 56, frameH: 60, feetY: 56, figureH: 54.3, stripShadow: true },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout
  { src: 'Sprites/Reh.png', out: 'deer.png', frameW: 72, frameH: 96, feetY: 92, figureH: 84 },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout (höher wegen des Geweihs)
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout
  { src: 'Sprites/Frosch.png', out: 'frog.png', frameW: 56, frameH: 52, feetY: 48, figureH: 44 },
  // seltener blauer Frosch mit bunten Punkten: gleiches Format und gleicher Maßstab
  { src: 'Sprites/Frosch2.png', out: 'frog2.png', frameW: 56, frameH: 52, feetY: 48, scale: 0.167 },
  // Maulwurf im Erdhügel (wild) und zu Fuß (gefangen); jeweils unten-rechts, unten-links, oben-rechts, oben-links
  { src: 'Sprites/Maulwurf.png', out: 'mole_mound.png', frameW: 64, frameH: 52, feetY: 48, figureH: 44 },
  { src: 'Sprites/Maulwurf2.png', out: 'mole.png', frameW: 56, frameH: 52, feetY: 48, figureH: 44 },
  // Fischreiher stehend und fliegend; stehend: freigestellt mit npm run cutout -- ... 627,410 906,410 (Löcher zwischen den Beinen)
  { src: 'Sprites/Fischreier.png', out: 'heron.png', frameW: 88, frameH: 108, feetY: 104, figureH: 100 },
  { src: 'Sprites/Fischreier Flug.png', out: 'heron_fly.png', frameW: 96, frameH: 92, feetY: 88, figureH: 84 },
  { src: 'Sprites/Hirsch.png', out: 'stag.png', frameW: 80, frameH: 112, feetY: 108, figureH: 100 },
  // auftauchen, nach rechts, nach links, Sprung; freigestellt mit npm run cutout
  { src: 'Sprites/Fisch.png', out: 'fish.png', frameW: 84, frameH: 64, feetY: 60, figureH: 56 },
  // Wels (seltener Skin des Fischs): gleiches Format, etwas größer als der Fisch
  { src: 'Sprites/Fisch2.png', out: 'fish2.png', frameW: 84, frameH: 64, feetY: 60, scale: 0.39, mirror: [0] }, // Auftauchen: Kopf in dieselbe Richtung wie beim Fisch
  // unten-rechts, unten-links, oben-links, oben-rechts; freigestellt mit npm run cutout
  { src: 'Sprites/Fisch Beutel.png', out: 'fishbag.png', frameW: 64, frameH: 76, feetY: 72, figureH: 64 },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout
  { src: 'Sprites/Eichhörnchen.png', out: 'squirrel.png', frameW: 56, frameH: 60, feetY: 56, figureH: 52 },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout.
  // Der Schwanz der 3. Figur ragt in die Spalten der 2., daher nach zusammenhängenden Flächen trennen
  { src: 'Sprites/Fuchs.png', out: 'fox.png', frameW: 72, frameH: 72, feetY: 68, figureH: 64, byComponents: true },
  // Fuchs schlafend (eingerollt). Im Bild schauen 1. und 2. Figur beide nach links, 3. und 4. beide nach oben links:
  // 1. und 3. werden gespiegelt. Gleicher Maßstab wie oben (0,210). Freigestellt mit npm run cutout
  // Wolf (Wald, Event Wolfsnacht): laufend, heulend (Schriftzug im Bild vorher entfernt) und fressend. Beim Fressen gibt es
  // nur Vorderansichten: die erste, gespiegelt für links, und ebenso für die Rückansichten (Bild 2 = Spiegelbild von 1)
  // Gnu (Savanne, Event Große Wanderung): freigestellt mit npm run cutout und tools/gnu-cut.cjs
  { src: 'Sprites/Gnu.png', out: 'gnu.png', frameW: 88, frameH: 96, feetY: 92, figureH: 80, stripShadow: true },
  { src: 'Sprites/Wolf.png', out: 'wolf.png', frameW: 80, frameH: 80, feetY: 76, figureH: 70 },
  { src: 'Sprites/Wolf heult.png', out: 'wolf_howl.png', frameW: 80, frameH: 80, feetY: 76, scale: WOLF_SCALE },
  { src: 'Sprites/Wolf frisst.png', out: 'wolf_eat.png', frameW: 80, frameH: 80, feetY: 76, scale: WOLF_SCALE, copyMirror: { 1: 0, 2: 1, 3: 0 } },
  // schwarzer Wolf (seltener Skin, immer ein ganzes Rudel): gleiche Posen und gleicher Maßstab; beim Heulen Schriftzug vorher entfernt
  { src: 'Sprites/Wolf2.png', out: 'wolf2.png', frameW: 80, frameH: 80, feetY: 76, scale: WOLF_SCALE },
  { src: 'Sprites/Wolf2 heult.png', out: 'wolf2_howl.png', frameW: 80, frameH: 80, feetY: 76, scale: WOLF_SCALE },
  { src: 'Sprites/Wolf2 frisst.png', out: 'wolf2_eat.png', frameW: 80, frameH: 80, feetY: 76, scale: WOLF_SCALE, copyMirror: { 1: 0, 2: 1, 3: 0 } },
  { src: 'Sprites/Fuchs schlafend.png', out: 'fox_sleep.png', frameW: 56, frameH: 44, feetY: 41, figureH: 39.5, mirror: [0, 2] },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout (hoch wegen der Hörner)
  { src: 'Sprites/Antilope.png', out: 'antelope.png', frameW: 72, frameH: 100, feetY: 96, figureH: 88 },
  // unten-rechts, unten-links, oben-rechts, oben-links; freigestellt mit npm run cutout (viel größer als die anderen Tiere)
  { src: 'Sprites/Giraffe.png', out: 'giraffe.png', frameW: 104, frameH: 168, feetY: 164, figureH: 156 },
  // Giraffe frisst (Kopf hoch in die Akazie): unten-rechts, unten-links (falsch herum gemalt, wird gespiegelt), oben-rechts, oben-links.
  // Etwas kleiner als die laufende Giraffe (0,40 statt 0,47), sonst wirkt sie neben der Akazie zu groß. Freigestellt mit npm run cutout
  { src: 'Sprites/Giraffe frisst.png', out: 'giraffe_eat.png', frameW: 96, frameH: 180, feetY: 176, figureH: 172, mirror: [1] },
  // Zebra stehend und trinkend (Kopf unten); gleicher Maßstab für beide: 92/328 Pixel, beim Trinken ist die Figur 212 statt 328 hoch
  { src: 'Sprites/Zebra.png', out: 'zebra.png', frameW: 80, frameH: 104, feetY: 100, figureH: 92 },
  { src: 'Sprites/Zebra trinkt.png', out: 'zebra_drink.png', frameW: 80, frameH: 104, feetY: 100, figureH: 59.5 },
  // Erdmännchen stehend und eingegraben (Erdloch ist im Bild); gleicher Maßstab: 52/310 Pixel, eingegraben 156 statt 310 hoch.
  // Stehend freigestellt mit npm run cutout -- ... 636,367 885,367 (Lücken zwischen den Beinen)
  { src: 'Sprites/Erdmännchen.png', out: 'meerkat.png', frameW: 40, frameH: 56, feetY: 52, figureH: 52 },
  { src: 'Sprites/Erdmännchen eingegraben.png', out: 'meerkat_hole.png', frameW: 48, frameH: 32, feetY: 30, figureH: 26.2 },
  // Löwe stehend; die Rückansichten berühren sich am Schwanz, daher nach zusammenhängenden Flächen trennen.
  // Freigestellt mit npm run cutout -- ... 659,336 866,336 127,340 423,340 169,350 379,350 (Lücken zwischen den Beinen)
  { src: 'Sprites/Löwe.png', out: 'lion.png', frameW: 72, frameH: 96, feetY: 92, figureH: 88, byComponents: true },
  { src: 'Sprites/Löwe2.png', out: 'lion2.png', frameW: 72, frameH: 96, feetY: 92, figureH: 88, byComponents: true }, // Schwarzmähnen-Löwe (seltener Skin)
  // Krokodil an Land (unten-rechts, unten-links, oben-rechts, oben-links) und im Wasser (nur der Kopf schaut heraus;
  // im Bild als 2×2-Raster). Gleicher Maßstab 0,273: an Land 84/308 Pixel, im Wasser samt Wellen 132 Pixel hoch
  { src: 'Sprites/Krokodil.png', out: 'croc.png', frameW: 72, frameH: 92, feetY: 88, figureH: 84 },
  { src: 'Sprites/Krokodil Wasser.png', out: 'croc_water.png', frameW: 64, frameH: 44, feetY: 40, figureH: 36, grid: [2, 2] },
  // Koi beim Auftauchen (Maul offen, Wellen drumherum), drei Farbmuster; im Bild als 2×2-Raster:
  // unten-rechts, unten-links, oben-rechts, oben-links. Freigestellt mit npm run cutout
  { src: 'Sprites/Koi1.png', out: 'koi1.png', frameW: 88, frameH: 52, feetY: 49, figureH: 46, grid: [2, 2] },
  { src: 'Sprites/Koi2.png', out: 'koi2.png', frameW: 88, frameH: 52, feetY: 49, figureH: 46, grid: [2, 2] },
  { src: 'Sprites/Koi3.png', out: 'koi3.png', frameW: 88, frameH: 52, feetY: 49, figureH: 46, grid: [2, 2] },
  // Autos für die Schnellreise (an den Hütten und im Tierpark), je als 2×2-Raster. Im Tierpark-Bild sind zwei Autos:
  // Bild 0 grün (steht auf der Wiese), Bild 1 sandfarben (Tierpark). Freigestellt mit npm run cutout
  { src: 'Sprites/Auto Tierpark.png', out: 'car_park.png', frameW: 240, frameH: 140, feetY: 136, figureH: 132, grid: [2, 2] },
  { src: 'Sprites/Auto Wald.png', out: 'car_forest.png', frameW: 240, frameH: 140, feetY: 136, figureH: 132, grid: [2, 2] },
  { src: 'Sprites/Auto Savanne.png', out: 'car_savanna.png', frameW: 240, frameH: 140, feetY: 136, figureH: 132, grid: [2, 2] },
  { src: 'Sprites/Auto Asien.png', out: 'car_asia.png', frameW: 240, frameH: 140, feetY: 136, figureH: 132, grid: [2, 2] },
  // dasselbe rot-weiße Bild noch einmal als "koi": daraus kommt das Tierbild in der Anzeige
  { src: 'Sprites/Koi2.png', out: 'koi.png', frameW: 88, frameH: 52, feetY: 49, figureH: 46, grid: [2, 2] },
  // Fress-Bilder (Kopf unten, am Futter im Tierpark): gleicher Frame und gleicher Maßstab wie das jeweilige Laufbild
  // (scale statt figureH; Katze und Reh sind im Bild größer gemalt, daher kleiner). Freigestellt mit npm run cutout
  { src: 'Sprites/Antilope frisst.png', out: 'antelope_eat.png', frameW: 72, frameH: 100, feetY: 96, scale: 0.255 },
  // Oryx-Antilope (seltener Skin der Antilope, lange gerade Hörner): gleiches Format wie die Antilope
  { src: 'Sprites/Antilope2.png', out: 'antelope2.png', frameW: 72, frameH: 100, feetY: 96, scale: 0.25 },
  { src: 'Sprites/Antilope2 frisst.png', out: 'antelope2_eat.png', frameW: 72, frameH: 100, feetY: 96, scale: 0.25 },
  { src: 'Sprites/Fuchs frisst.png', out: 'fox_eat.png', frameW: 72, frameH: 72, feetY: 68, scale: 0.21, byComponents: true },
  { src: 'Sprites/Hirsch frisst.png', out: 'stag_eat.png', frameW: 80, frameH: 112, feetY: 108, scale: 0.292 },
  // Katze im 2×2-Raster
  { src: 'Sprites/Katze frisst.png', out: 'cat_eat.png', frameW: 72, frameH: 80, feetY: 76, scale: 0.175, grid: [2, 2], stripShadow: true },
  // Katze 2 (seltener Skin, weiße Perserkatze mit Schleife): ohne stripShadow, sonst verschwindet das helle Fell.
  // Freigestellt mit tools/cutout-white.py (weißes Fell vor weißem Hintergrund; npm run cutout würde das Fell mitnehmen).
  // Fressen: dasselbe Bild wie beim Laufen (es gibt kein eigenes Fress-Bild)
  { src: 'Sprites/Katze2 neu.png', out: 'cat2.png', frameW: 72, frameH: 80, feetY: 76, scale: CAT2_SCALE },
  { src: 'Sprites/Katze2 schlafend neu.png', out: 'cat2_sleep.png', frameW: 88, frameH: 60, feetY: 56, scale: CAT2_SCALE },
  { src: 'Sprites/Katze2 neu.png', out: 'cat2_eat.png', frameW: 72, frameH: 80, feetY: 76, scale: CAT2_SCALE },
  // Löwe: die 2. Figur steht aufrecht statt zu fressen, dafür die 1. gespiegelt
  { src: 'Sprites/Löwe frisst.png', out: 'lion_eat.png', frameW: 72, frameH: 96, feetY: 92, scale: 0.283, byComponents: true, copyMirror: { 1: 0 } },
  { src: 'Sprites/Löwe2 frisst.png', out: 'lion2_eat.png', frameW: 72, frameH: 96, feetY: 92, scale: 0.283, byComponents: true, copyMirror: { 1: 0 } },
  // Reh im 2×2-Raster: oben die Vorderansichten; unten zwei Seitenansichten nach rechts statt Rückansichten,
  // daher oben-rechts = Bild 3, oben-links = Bild 3 gespiegelt
  { src: 'Sprites/Reh frisst.png', out: 'deer_eat.png', frameW: 72, frameH: 96, feetY: 92, scale: 0.235, grid: [2, 2], copyMirror: { 3: 2 } },
  // Besucher im Tierpark (Kinder, etwas kleiner als die Spielfigur): unten-rechts, unten-links, oben-rechts, oben-links.
  // Freigestellt mit npm run cutout
  { src: 'Sprites/Besucher 1.png', out: 'visitor1.png', frameW: 72, frameH: 116, feetY: 112, figureH: 100 },
  { src: 'Sprites/Besucher 2.png', out: 'visitor2.png', frameW: 72, frameH: 116, feetY: 112, figureH: 100 },
  { src: 'Sprites/Besucher 3.png', out: 'visitor3.png', frameW: 72, frameH: 116, feetY: 112, figureH: 100 },
  { src: 'Sprites/Besucher 4.png', out: 'visitor4.png', frameW: 72, frameH: 116, feetY: 112, figureH: 100 },
  { src: 'Sprites/Besucher 5.png', out: 'visitor5.png', frameW: 72, frameH: 116, feetY: 112, figureH: 100 },
  { src: 'Sprites/Besucher 6.png', out: 'visitor6.png', frameW: 72, frameH: 116, feetY: 112, figureH: 100 },
  { src: 'Sprites/Besucher 7.png', out: 'visitor7.png', frameW: 72, frameH: 116, feetY: 112, figureH: 100 },
  { src: 'Sprites/Besucher 8.png', out: 'visitor8.png', frameW: 72, frameH: 116, feetY: 112, figureH: 100 },
  // Reittiere (Event): Henrik auf Esel (Wiese), Pferd (Wald), Elefant (Savanne), Wasserbüffel (Asien), je in der Kleidung
  // der Welt. Gleicher Frame für alle; die Größe so, dass Henrik auf allen etwa gleich groß aussieht. Freigestellt mit npm run cutout
  { src: 'Sprites/Character Esel.png', out: 'ride_meadow.png', frameW: 160, frameH: 230, feetY: 224, figureH: 132 },
  { src: 'Sprites/Character Pferd.png', out: 'ride_forest.png', frameW: 160, frameH: 230, feetY: 224, figureH: 150 },
  { src: 'Sprites/Character Elefant.png', out: 'ride_savanna.png', frameW: 160, frameH: 230, feetY: 224, figureH: 196 },
  { src: 'Sprites/Character Wasserbüffel.png', out: 'ride_asia.png', frameW: 160, frameH: 230, feetY: 224, figureH: 160 },
  // Flamingo (Event „Flamingo-Flug“): stehend wie der Reiher, fliegend, und das graue Küken (Tierbabys). Freigestellt mit npm run cutout
  // Bauernhof-Event: Kuh, Schwein, Ziege im Format des Schafs (80x88, Füße bei 84). Beide Rückansichten schauen im Bild
  // nach rechts, daher oben-links = oben-rechts gespiegelt. Fress-Bild nur für die Kuh; Schwein und Ziege grasen im
  // normalen Bild. Freigestellt mit npm run cutout
  // Kuh: die 3. Ansicht ist im Bild größer gemalt, daher für beide Rückansichten die 4. (oben-links gespiegelt, oben-rechts
  // wieder zurückgespiegelt); fester Maßstab, damit sie etwas größer als das Schaf ist
  // im Bild schauen beide Vorderansichten nach rechts: unten-links = unten-rechts gespiegelt
  { src: 'Sprites/Kuh.png', out: 'farm_cow.png', frameW: 96, frameH: 88, feetY: 84, scale: COW_SCALE, mirror: [3], copyMirror: { 2: 3, 1: 0 } },
  { src: 'Sprites/Kuh frisst.png', out: 'farm_cow_eat.png', frameW: 96, frameH: 88, feetY: 84, scale: COW_SCALE, mirror: [3], copyMirror: { 2: 3 } },
  { src: 'Sprites/Schwein.png', out: 'farm_pig.png', frameW: 80, frameH: 88, feetY: 84, figureH: 50, copyMirror: { 3: 2 } },
  { src: 'Sprites/Schwein.png', out: 'farm_pig_eat.png', frameW: 80, frameH: 88, feetY: 84, figureH: 50, copyMirror: { 3: 2 } },
  { src: 'Sprites/Ziege.png', out: 'farm_goat.png', frameW: 80, frameH: 88, feetY: 84, figureH: 58, copyMirror: { 3: 2 } },
  { src: 'Sprites/Ziege.png', out: 'farm_goat_eat.png', frameW: 80, frameH: 88, feetY: 84, figureH: 58, copyMirror: { 3: 2 } },
  // Eisverkäuferin am Eiswagen (Eisstand-Event), Format wie die Besucher. Freigestellt mit npm run cutout
  { src: 'Sprites/Eisverkäuferin.png', out: 'icecream_seller.png', frameW: 72, frameH: 116, feetY: 112, figureH: 100 },
  // Panda (Asien): laufend und sitzend mit Bambus, gleicher Maßstab; beide Rückansichten schauen nach rechts,
  // daher oben-links = oben-rechts gespiegelt. Freigestellt mit npm run cutout
  { src: 'Sprites/Panda.png', out: 'panda.png', frameW: 88, frameH: 96, feetY: 92, scale: PANDA_SCALE * 1.2, copyMirror: { 3: 2 } }, // laufend etwas größer
  { src: 'Sprites/Panda frisst.png', out: 'panda_eat.png', frameW: 88, frameH: 96, feetY: 92, scale: PANDA_SCALE * 1.1, copyMirror: { 3: 2 } }, // so groß wie panda_idle
  // Japanmakak (Asien): laufend und badend (in der heißen Quelle, mit Handtuch), gleicher Maßstab; beide Rückansichten
  // schauen nach rechts, daher oben-links = oben-rechts gespiegelt. Freigestellt mit npm run cutout
  { src: 'Sprites/Affe.png', out: 'macaque.png', frameW: 72, frameH: 72, feetY: 68, scale: MACAQUE_SCALE, copyMirror: { 3: 2 } },
  { src: 'Sprites/Affe badet.png', out: 'macaque_bath.png', frameW: 72, frameH: 72, feetY: 66, scale: MACAQUE_SCALE, copyMirror: { 3: 2 } },
  { src: 'Sprites/Flamingo.png', out: 'flamingo.png', frameW: 88, frameH: 108, feetY: 104, figureH: 96 },
  { src: 'Sprites/Flamingo fliegend.png', out: 'flamingo_fly.png', frameW: 104, frameH: 100, feetY: 96, figureH: 88, byComponents: true }, // Flügel reichen in die Nachbarspalten
  { src: 'Sprites/Flamingo Baby.png', out: 'flamingo_baby.png', frameW: 88, frameH: 108, feetY: 104, figureH: 96 },
  // Tiger (Asien): laufend und fressend, gleicher Maßstab
  // Tiger 1,3 * 0,85 = 1,1-mal so groß wie zuerst (passt besser zum Kopf, der aus dem Bambus schaut); Rahmen 120x104, Fußlinie 99/104
  { src: 'Sprites/Tiger.png', out: 'tiger.png', frameW: 120, frameH: 104, feetY: 99, scale: 0.3094 },
  { src: 'Sprites/Tiger frisst.png', out: 'tiger_eat.png', frameW: 120, frameH: 104, feetY: 99, scale: 0.3094 },
  // weißer Tiger (seltene Variante): gleicher Aufbau und Maßstab
  { src: 'Sprites/Tiger2.png', out: 'tiger2.png', frameW: 120, frameH: 104, feetY: 99, scale: 0.3094 },
  { src: 'Sprites/Tiger2 frisst.png', out: 'tiger2_eat.png', frameW: 120, frameH: 104, feetY: 99, scale: 0.3094 },
  // Orang-Utan: auf allen Vieren und sitzend beim Fressen (das sitzende Bild nimmt er auch oben im Baum, siehe tree-peeks.cjs)
  { src: 'Sprites/Orang Utan.png', out: 'orangutan.png', frameW: 88, frameH: 88, feetY: 84, scale: 0.28 },
  { src: 'Sprites/Orang Utan sitzt und frisst.png', out: 'orangutan_eat.png', frameW: 88, frameH: 88, feetY: 84, scale: 0.308 },
  // Flanschen-Männchen (seltene Variante): gleiches Format und gleicher Maßstab
  { src: 'Sprites/Orang Utan2.png', out: 'orangutan2.png', frameW: 88, frameH: 88, feetY: 84, scale: 0.28 },
  { src: 'Sprites/Orang Utan2 sitzt und frisst.png', out: 'orangutan2_eat.png', frameW: 88, frameH: 88, feetY: 84, scale: 0.308 },
  // Pfau mit Rad und ohne (bei Pfau.png ist das Rad der Vorderansichten weggeschnitten, siehe tools/peacock-cut.cjs)
  { src: 'Sprites/Pfau Rad.png', out: 'peacock_wheel.png', frameW: 96, frameH: 96, feetY: 92, scale: 0.32 },
  // stehend etwas kleiner als das Rad: so groß wie der laufende Pfau (Video), vorher 0,32 und damit ca. 20 % zu groß
  { src: 'Sprites/Pfau.png', out: 'peacock.png', frameW: 96, frameH: 96, feetY: 92, scale: 0.265 },
  // weißer Pfau (seltene Variante): Rad der Vorderansichten mit dem blauen Pfau als Schablone weggeschnitten (tools/peacock2-cut.cjs)
  { src: 'Sprites/Pfau2 Rad.png', out: 'peacock2_wheel.png', frameW: 96, frameH: 96, feetY: 92, scale: 0.32 },
  // Rückansichten (nach oben, dafür gibt es noch kein Video) auf 82 %: sonst größer als der blaue Pfau von hinten
  { src: 'Sprites/Pfau2.png', out: 'peacock2.png', frameW: 96, frameH: 96, feetY: 92, scale: 0.32, viewScale: { 2: 0.82, 3: 0.82 } },
  // Savanne, Wetterphasen: freigestellt mit npm run cutout und tools/savanna-cut.cjs
  // Schuhschnabel (Reiher-Skin bei Starkregen): stehend und fliegend (ohne Beine) wie der Reiher
  { src: 'Sprites/Schuhschnabel.png', out: 'shoebill.png', frameW: 88, frameH: 108, feetY: 104, figureH: 100, stripShadow: true },
  { src: 'Sprites/Schuschnabel fliegend.png', out: 'shoebill_fly.png', frameW: 96, frameH: 92, feetY: 88, figureH: 84, stripShadow: true, byComponents: true },
  // Albino-Krokodil (seltener Skin bei Starkregen): wie das Krokodil
  { src: 'Sprites/Krokodil2.png', out: 'croc_albino.png', frameW: 72, frameH: 92, feetY: 88, scale: 0.29 },
  { src: 'Sprites/Krokodil2 Wasser.png', out: 'croc_albino_water.png', frameW: 64, frameH: 44, feetY: 40, figureH: 34, grid: [2, 2] }, // ... im Wasser (wie croc_water)
  // Lungenfisch (Fisch-Skin): gemalt wie der Fisch (auftauchend, rechts, links, springend); in der Vorlage etwas größer
  // gezeichnet, darum kleinerer Maßstab: im Spiel so groß wie der Fisch
  { src: 'Sprites/Lungenfisch.png', out: 'lungfish.png', frameW: 84, frameH: 64, feetY: 60, scale: 0.32 },
  // Nilpferd (Starkregen): unten-rechts, unten-links, oben-rechts, oben-links; im Wasser nur die obere Kopfhälfte (gleicher Maßstab)
  { src: 'Sprites/Nilpferd.png', out: 'hippo.png', frameW: 96, frameH: 88, feetY: 84, scale: HIPPO_SCALE }, // ohne stripShadow: das Nilpferd selbst ist grau (Schatten: savanna-cut)
  { src: 'Sprites/Nilpferd Wasser.png', out: 'hippo_water.png', frameW: 64, frameH: 44, feetY: 40, scale: HIPPO_SCALE },
  // Hyäne (Trockenzeit): laufend und mit dem Knochen fressend, gleich groß
  { src: 'Sprites/Hyäne.png', out: 'hyena.png', frameW: 80, frameH: 80, feetY: 76, scale: HYENA_SCALE, stripShadow: true },
  { src: 'Sprites/Hyäne frisst.png', out: 'hyena_eat.png', frameW: 80, frameH: 80, feetY: 76, scale: HYENA_SCALE, stripShadow: true },
  // Warzenschwein (Trockenzeit)
  { src: 'Sprites/Warzenschwein.png', out: 'warthog.png', frameW: 80, frameH: 88, feetY: 84, figureH: 72, stripShadow: true },
  // Geier (Trockenzeit): beide stehenden Vorderansichten schauen nach rechts, beide Rückansichten nach links –
  // unten-links und oben-rechts sind gespiegelt. Fliegend: die Rückansichten schauen beide nach links
  { src: 'Sprites/Geier.png', out: 'vulture.png', frameW: 88, frameH: 108, feetY: 104, scale: 0.24, stripShadow: true, copyMirror: { 1: 0, 2: 3 } },
  { src: 'Sprites/Geier fliegend.png', out: 'vulture_fly.png', frameW: 96, frameH: 92, feetY: 88, figureH: 80, stripShadow: true, byComponents: true, copyMirror: { 2: 3 } },
  // Dschungel: freigestellt mit npm run cutout und tools/jungle-cut.cjs
  { src: 'Sprites/Charakter Dschungel.png', out: 'hero_jungle.png', frameW: 72, frameH: 116, feetY: 112, figureH: 108 },
  // Brüllaffe: im Bild nach links, nach rechts, Rückansicht nach links oben, nach rechts oben – im Sheet wie üblich
  // unten-rechts, unten-links, oben-rechts, oben-links. Fressend: von vorne sitzend, seitlich sitzend (nach rechts),
  // zweimal stehend nach rechts (oben-links ist davon das Spiegelbild)
  { src: 'Sprites/Brüllaffe.png', out: 'howler.png', frameW: 88, frameH: 88, feetY: 84, scale: HOWLER_SCALE, order: [1, 0, 3, 2] },
  // springend: beide Vorderansichten greifen nach rechts (unten-links ist das Spiegelbild), Rückansichten nach links oben, rechts oben
  { src: 'Sprites/Brüllaffe springt.png', out: 'howler_jump.png', frameW: 88, frameH: 88, feetY: 84, scale: HOWLER_SCALE, byComponents: true, copyMirror: { 1: 0 }, order: [0, 1, 3, 2] },
  { src: 'Sprites/Brüllaffe frisst.png', out: 'howler_eat.png', frameW: 88, frameH: 88, feetY: 84, scale: HOWLER_SCALE, copyMirror: { 3: 2 }, order: [1, 0, 2, 3] },
  // Schlange und Vogelspinne (Dschungel, Reptilienhaus), je zwei Farben (die zweite ist ein seltener Skin). Im Bild:
  // unten-rechts, unten-links, dann zweimal von hinten nach links oben – oben-rechts ist bei der Schlange das Spiegelbild
  { src: 'Sprites/Schlange.png', out: 'snake.png', frameW: 72, frameH: 72, feetY: 68, scale: 0.24, copyMirror: { 3: 2 }, order: [0, 1, 3, 2] },
  { src: 'Sprites/Schlange2.png', out: 'snake2.png', frameW: 72, frameH: 72, feetY: 68, scale: 0.24, copyMirror: { 3: 2 }, order: [0, 1, 3, 2] },
  { src: 'Sprites/Vogelspinne.png', out: 'tarantula.png', frameW: 64, frameH: 64, feetY: 60, scale: 0.21, order: [0, 1, 3, 2] },
  { src: 'Sprites/Vogelspinne2.png', out: 'tarantula2.png', frameW: 64, frameH: 64, feetY: 60, scale: 0.21, order: [0, 1, 3, 2] },
  // Ara (Dschungel) und der seltene blau-gelbe Ara: sitzend (im Bild nach rechts, links, Rücken nach links oben, rechts oben)
  // und fliegend (aufrecht gemalt, das Spiel neigt ihn in Flugrichtung; die Rückansichten schauen beide nach rechts oben)
  { src: 'Sprites/Ara.png', out: 'macaw.png', frameW: 64, frameH: 80, feetY: 76, scale: 0.165, order: [0, 1, 3, 2] },
  { src: 'Sprites/Ara2.png', out: 'macaw2.png', frameW: 64, frameH: 80, feetY: 76, scale: 0.165, order: [0, 1, 3, 2] },
  { src: 'Sprites/Ara fliegend.png', out: 'macaw_fly.png', frameW: 88, frameH: 80, feetY: 76, scale: 0.165, byComponents: true, copyMirror: { 3: 2 } },
  { src: 'Sprites/Ara2 fliegend.png', out: 'macaw2_fly.png', frameW: 88, frameH: 80, feetY: 76, scale: 0.165, byComponents: true, copyMirror: { 3: 2 } },
  // roter Panda (Glühwürmchen-Abend): laufend und sitzend, im Bild nach links, rechts, Rücken nach links oben, rechts oben
  { src: 'Sprites/Roter Panda.png', out: 'redpanda.png', frameW: 72, frameH: 72, feetY: 68, scale: 0.24, order: [1, 0, 3, 2] },
  { src: 'Sprites/Roter panda sitzt.png', out: 'redpanda_sit.png', frameW: 72, frameH: 72, feetY: 68, scale: 0.24, order: [1, 0, 3, 2] },
  // Gibbon (Dschungel, bei Nebel): wie der Brüllaffe laufend, springend (beide Vorderansichten nach rechts, unten-links ist
  // das Spiegelbild) und mit der Banane
  { src: 'Sprites/Gibbon.png', out: 'gibbon.png', frameW: 88, frameH: 88, feetY: 84, scale: HOWLER_SCALE },
  { src: 'Sprites/Gibbon springt.png', out: 'gibbon_jump.png', frameW: 88, frameH: 88, feetY: 84, scale: HOWLER_SCALE, byComponents: true, copyMirror: { 1: 0 }, order: [0, 1, 3, 2] },
  { src: 'Sprites/Gibbon frisst.png', out: 'gibbon_eat.png', frameW: 88, frameH: 88, feetY: 84, scale: HOWLER_SCALE },
  // Kanu leer und mit Henrik darin (die vierte Ansicht ist das Spiegelbild der dritten)
  { src: 'Sprites/Kanu.png', out: 'canoe.png', frameW: 144, frameH: 152, feetY: 148, scale: CANOE_SCALE, copyMirror: { 3: 2 } },
  { src: 'Sprites/Kanu besetzt.png', out: 'canoe_hero.png', frameW: 144, frameH: 152, feetY: 148, scale: CANOE_SCALE, copyMirror: { 3: 2 } },
];

// Figuren anhand leerer Spalten trennen (Standard)
function figuresByColumns(W, H, alpha) {
  const used = [];
  for (let x = 0; x < W; x++) {
    let any = false;
    for (let y = 0; y < H && !any; y++) any = alpha(x, y) > 20;
    used.push(any);
  }
  const runs = [];
  let start = -1;
  used.forEach((u, x) => {
    if (u && start < 0) start = x;
    if (!u && start >= 0) {
      runs.push([start, x - 1]);
      start = -1;
    }
  });
  if (start >= 0) runs.push([start, W - 1]);
  const figures = runs.filter(([a, b]) => b - a > 50);
  if (figures.length !== 4) return null;
  const owner = new Int8Array(W * H).fill(-1);
  figures.forEach(([x0, x1], f) => {
    for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) owner[y * W + x] = f;
  });
  return owner;
}

// Figuren als zusammenhängende Flächen trennen: für Bilder, in denen sich Figuren überlappen
// (z. B. ein Schwanz, der in die Spalten der Nachbarfigur ragt). Die 4 größten Flächen sind die Figuren,
// kleine Teile (Spritzer, Fellspitzen) gehören zur Figur, in deren Nähe sie liegen.
function figuresByComponents(W, H, alpha) {
  const label = new Int32Array(W * H).fill(-1);
  const comps = [];
  for (let start = 0; start < W * H; start++) {
    if (label[start] >= 0 || alpha(start % W, Math.floor(start / W)) <= 20) continue;
    const id = comps.length;
    const c = { id, size: 0, x0: W, x1: 0, y0: H, y1: 0 };
    const stack = [start];
    label[start] = id;
    while (stack.length) {
      const p = stack.pop();
      const x = p % W;
      const y = (p - x) / W;
      c.size++;
      c.x0 = Math.min(c.x0, x);
      c.x1 = Math.max(c.x1, x);
      c.y0 = Math.min(c.y0, y);
      c.y1 = Math.max(c.y1, y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const q = ny * W + nx;
          if (label[q] < 0 && alpha(nx, ny) > 20) {
            label[q] = id;
            stack.push(q);
          }
        }
      }
    }
    comps.push(c);
  }
  const main = [...comps].sort((a, b) => b.size - a.size).slice(0, 4);
  if (main.length < 4) return null;
  main.sort((a, b) => a.x0 + a.x1 - (b.x0 + b.x1)); // von links nach rechts
  const figOf = new Map(main.map((c, f) => [c.id, f]));
  const MARGIN = 30;
  for (const c of comps) {
    if (figOf.has(c.id)) continue;
    const cx = (c.x0 + c.x1) / 2;
    const cy = (c.y0 + c.y1) / 2;
    const f = main.findIndex((m) => cx >= m.x0 - MARGIN && cx <= m.x1 + MARGIN && cy >= m.y0 - MARGIN && cy <= m.y1 + MARGIN);
    if (f >= 0) figOf.set(c.id, f);
  }
  const owner = new Int8Array(W * H).fill(-1);
  for (let p = 0; p < W * H; p++) if (label[p] >= 0 && figOf.has(label[p])) owner[p] = figOf.get(label[p]);
  // fast durchsichtige Randpixel der jeweils angrenzenden Figur zuordnen (weiche Kanten)
  const edge = owner.slice();
  for (let p = 0; p < W * H; p++) {
    if (owner[p] >= 0 || alpha(p % W, Math.floor(p / W)) === 0) continue;
    for (const q of [p - 1, p + 1, p - W, p + W]) if (q >= 0 && q < W * H && owner[q] >= 0) edge[p] = owner[q];
  }
  return edge;
}

// Ansichten, die im Raster liegen (cols × rows, zeilenweise gelesen), zu einer Reihe nebeneinander umlegen
function gridToRow(img, cols, rows) {
  const cw = Math.floor(img.width / cols);
  const ch = Math.floor(img.height / rows);
  const row = new PNG({ width: cw * cols * rows, height: ch });
  for (let i = 0; i < cols * rows; i++) {
    const sx = (i % cols) * cw;
    const sy = Math.floor(i / cols) * ch;
    PNG.bitblt(img, row, sx, sy, cw, ch, i * cw, 0);
  }
  return row;
}

// grid: [cols, rows], falls die vier Ansichten im Raster statt nebeneinander liegen;
// mirror: Nummern der Figuren, die falsch herum gemalt sind und gespiegelt werden;
// scale: fester Maßstab statt figureH (z. B. gleich groß wie das Laufbild); copyMirror: { Ziel: Quelle } – Bild Ziel
// wird durch das gespiegelte Bild Quelle ersetzt (falls eine Ansicht fehlt); order: [Figur für Bild 0, 1, 2, 3], falls
// die Ansichten im Original anders angeordnet sind (z. B. der Lungenfisch: auftauchend, rechts, links, springend)
// viewScale: { Ansicht: Faktor } einzelne Ansichten kleiner oder größer (z. B. eine zu groß gemalte Rückansicht)
function prepare({ src, out, frameW, frameH, feetY, figureH, scale: fixedScale, stripShadow = false, byComponents = false, grid = null, mirror = [], copyMirror = {}, order = null, viewScale = {} }) {
  let img = PNG.sync.read(fs.readFileSync(path.resolve(src)));
  if (grid) img = gridToRow(img, ...grid);
  const { width: W, height: H, data } = img;

  // Hellgraue, ungesättigte Pixel sind der gemalte Schatten: das Spiel zeichnet seinen eigenen
  if (stripShadow) {
    for (let i = 0; i < data.length; i += 4) {
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      if (max - min < 16 && min > 140 && max < 235) data[i + 3] = 0;
    }
  }
  const alpha = (x, y) => data[(y * W + x) * 4 + 3];

  // owner[Pixel] = Nummer der Figur, zu der der Pixel gehört (-1: keine)
  const owner = byComponents ? figuresByComponents(W, H, alpha) : figuresByColumns(W, H, alpha);
  if (!owner) throw new Error(`${src}: konnte keine 4 Figuren finden`);

  const boxes = [0, 1, 2, 3].map(() => ({ x0: W, x1: 0, y0: H, y1: 0 }));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const f = owner[y * W + x];
      if (f < 0 || alpha(x, y) <= 20) continue; // Größe nur aus sichtbaren Pixeln
      const b = boxes[f];
      b.x0 = Math.min(b.x0, x);
      b.x1 = Math.max(b.x1, x);
      b.y0 = Math.min(b.y0, y);
      b.y1 = Math.max(b.y1, y);
    }
  }

  const scale = fixedScale ?? figureH / Math.max(...boxes.map((b) => b.y1 - b.y0 + 1));
  const sheet = new PNG({ width: frameW * 4, height: frameH });

  boxes.forEach((b, i) => {
    const s = scale * (viewScale[i] ?? 1);
    const bw = (b.x1 - b.x0 + 1) * s;
    const bh = (b.y1 - b.y0 + 1) * s;
    const offX = i * frameW + Math.round((frameW - bw) / 2);
    const offY = Math.round(feetY - bh);
    drawScaled(sheet, img, b, s, offX, offY, (sx, sy) => owner[sy * W + sx] === i); // Teile anderer Figuren ausblenden
    if (mirror.includes(i)) mirrorFrame(sheet, i * frameW, frameW);
    if (bw > frameW) console.warn(`${src}: Figur ${i} ist breiter als der Frame (${bw.toFixed(0)} > ${frameW})`);
    if (bh > feetY + 0.5) console.warn(`${src}: Figur ${i} ist höher als der Frame (${bh.toFixed(0)} > ${feetY})`);
  });
  for (const [dst, from] of Object.entries(copyMirror)) {
    for (let y = 0; y < frameH; y++) {
      for (let x = 0; x < frameW; x++) {
        const a = (y * sheet.width + from * frameW + x) * 4;
        const b = (y * sheet.width + dst * frameW + frameW - 1 - x) * 4;
        for (let c = 0; c < 4; c++) sheet.data[b + c] = sheet.data[a + c];
      }
    }
  }

  if (order) {
    const before = Buffer.from(sheet.data);
    order.forEach((from, to) => {
      for (let y = 0; y < frameH; y++) before.copy(sheet.data, (y * sheet.width + to * frameW) * 4, (y * sheet.width + from * frameW) * 4, (y * sheet.width + (from + 1) * frameW) * 4);
    });
  }

  writeSheet(out, sheet);
  console.log(`${out}: 4 Frames à ${frameW}x${frameH}, Maßstab ${scale.toFixed(3)}`);
}

// Ausschnitt "b" des Bildes verkleinert bei (offX, offY) ins Sheet zeichnen; keep(x, y) wählt die Pixel aus.
// Flächenmittelung mit vormultipliziertem Alpha: glatte Kanten ohne dunkle Ränder
function drawScaled(sheet, img, b, scale, offX, offY, keep) {
  const { width: W, data } = img;
  const bw = (b.x1 - b.x0 + 1) * scale;
  const bh = (b.y1 - b.y0 + 1) * scale;
  const step = 1 / scale;
  for (let ty = 0; ty < Math.ceil(bh); ty++) {
    for (let tx = 0; tx < Math.ceil(bw); tx++) {
      const sx0 = b.x0 + tx * step;
      const sy0 = b.y0 + ty * step;
      let r = 0, g = 0, bl = 0, a = 0, n = 0;
      for (let sy = Math.floor(sy0); sy < Math.max(Math.floor(sy0 + step), Math.floor(sy0) + 1); sy++) {
        for (let sx = Math.floor(sx0); sx < Math.max(Math.floor(sx0 + step), Math.floor(sx0) + 1); sx++) {
          if (sx > b.x1 || sy > b.y1) continue;
          const k = (sy * W + sx) * 4;
          const al = keep(sx, sy) ? data[k + 3] / 255 : 0;
          r += data[k] * al;
          g += data[k + 1] * al;
          bl += data[k + 2] * al;
          a += al;
          n++;
        }
      }
      if (n === 0 || a === 0) continue;
      const dx = offX + tx;
      const dy = offY + ty;
      if (dx < 0 || dy < 0 || dx >= sheet.width || dy >= sheet.height) continue;
      const o = (dy * sheet.width + dx) * 4;
      sheet.data[o] = r / a;
      sheet.data[o + 1] = g / a;
      sheet.data[o + 2] = bl / a;
      sheet.data[o + 3] = (a / n) * 255;
    }
  }
}

// Frame ab Spalte x0 (Breite w) waagerecht spiegeln
function mirrorFrame(sheet, x0, w) {
  for (let y = 0; y < sheet.height; y++) {
    for (let x = 0; x < w / 2; x++) {
      const a = (y * sheet.width + x0 + x) * 4;
      const b = (y * sheet.width + x0 + w - 1 - x) * 4;
      for (let c = 0; c < 4; c++) [sheet.data[a + c], sheet.data[b + c]] = [sheet.data[b + c], sheet.data[a + c]];
    }
  }
}

function writeSheet(out, sheet) {
  const file = path.resolve('public/assets', out);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(sheet));
}

// Animationen: Bilder liegen im Raster (cols × rows gleich große Zellen), gelesen zeilenweise von links nach rechts;
// count: Anzahl der Bilder, falls die letzten Zellen leer sind.
// Alle Bilder bekommen denselben Maßstab und Versatz (gemeinsamer Rahmen über alle Zellen), damit die Figur nicht zittert.
const ANIMATIONS = [
  // Hauptfigur läuft nach unten-rechts (nach links wird im Spiel gespiegelt); gleiche Höhe und Füße wie hero.png.
  // Alternative: Animation/Character_Walking2.png (cols: 4, rows: 2; dann frameRate 11 in BootScene.js)
  { src: 'Animation/Character_Walking.png', out: 'hero_walk.png', cols: 5, rows: 2, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  // Hauptfigur läuft nach oben-rechts (Rückansicht; nach links wird gespiegelt)
  { src: 'Animation/Character_Walking_Back.png', out: 'hero_walk_back.png', cols: 5, rows: 3, count: 13, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  // Frosch hüpft (Blick nach rechts): Bild 0-2 sitzen, 3-9 ducken, 10-14 Flug, 15-18 landen (der zweite Sprung im
  // Original wird nicht gebraucht). Im Flug ist er im Bild selbst angehoben, die Füße bleiben bei feetY = Boden.
  // Sitzend so groß wie frog.png (44); höherer Rahmen für den Sprung, Fußlinie im selben Verhältnis wie dort (48/52)
  // Von hinten (Blick nach oben-rechts): 0-2 sitzen, 3-8 ducken, 9-14 Flug, 15-17 landen. Im Original 1,17-mal so groß
  // gemalt wie von vorne, daher so verkleinert, dass er sitzend gleich groß ist (Maßstab 0,168 statt 0,197)
  { src: 'Animation/Frosch_hüpft_hinten.png', out: 'frog_hop_back.png', cols: 5, rows: 4, count: 18, frameW: 56, frameH: 78, feetY: 72, figureH: 56.5 },
  { src: 'Animation/Frosch_hüpft_vorne.png', out: 'frog_hop.png', cols: 5, rows: 8, count: 19, frameW: 56, frameH: 78, feetY: 72, figureH: 62 },
  // Blauer Frosch (frog2) hüpft, von vorne und hinten; im Original sitzend so groß wie der grüne, daher derselbe Maßstab.
  // Vorne: 0-4 sitzen, 5-8 ducken, 9-14 Flug, 15-17 landen; hinten: 0-9 sitzen, 10-16 ducken, 17-23 Flug, 24-28 landen
  { src: 'Animation/Frosch2_hüpft_vorne.png', out: 'frog2_hop.png', cols: 5, rows: 4, count: 18, scale: 0.197, frameW: 56, frameH: 78, feetY: 72 },
  { src: 'Animation/Frosch2_hüpft_hinten.png', out: 'frog2_hop_back.png', cols: 5, rows: 7, count: 32, scale: 0.168, frameW: 56, frameH: 78, feetY: 72 },
  // Frosch sitzt (atmet, blinzelt, quakt), von vorne und hinten: steht im Original genau wie im ersten Sprung-Bild,
  // daher mit Rahmen und Maßstab der Sprung-Sheets (kein Versatz beim Wechsel zwischen Sitzen und Springen)
  { src: 'Animation/Frosch_idle_vorne.png', out: 'frog_idle.png', cols: 5, rows: 4, boxOf: 'frog_hop.png', frameW: 56, frameH: 78, feetY: 72 },
  { src: 'Animation/Frosch_idle_hinten.png', out: 'frog_idle_back.png', cols: 5, rows: 4, boxOf: 'frog_hop_back.png', frameW: 56, frameH: 78, feetY: 72 },
  // Wald-Kleidung (Pfadfinder) läuft, von vorne und von hinten
  { src: 'Animation/Character_Wald_läuft_vorne.png', out: 'hero_forest_walk.png', cols: 5, rows: 2, dropGreen: true, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  { src: 'Animation/Character_Wald_läuft_hinten.png', out: 'hero_forest_walk_back.png', cols: 5, rows: 4, count: 17, dropGreen: true, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  // ... und steht (blinzelt, schaut sich um), von vorne und von hinten
  { src: 'Animation/Character_Wald_idle_vorne.png', out: 'hero_forest_idle.png', cols: 5, rows: 3, count: 13, dropGreen: true, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  { src: 'Animation/Character_Wald_idle_hinten.png', out: 'hero_forest_idle_back.png', cols: 5, rows: 8, count: 36, dropGreen: true, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  // Safari-Kleidung (Savanne): läuft und steht, von vorne und hinten, wie die Wald-Kleidung
  { src: 'Animation/Character_Savanne_läuft_vorne.png', out: 'hero_savanna_walk.png', cols: 5, rows: 8, dropGreen: true, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  { src: 'Animation/Character_Savanne_läuft_hinten.png', out: 'hero_savanna_walk_back.png', cols: 5, rows: 4, count: 18, dropGreen: true, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  { src: 'Animation/Character_Savanne_idle_vorne.png', out: 'hero_savanna_idle.png', cols: 5, rows: 4, count: 16, dropGreen: true, steady: true, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  { src: 'Animation/Character_Savanne_idle_hinten.png', out: 'hero_savanna_idle_back.png', cols: 5, rows: 8, dropGreen: true, steady: true, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  // Hauptfigur steht (Blick nach unten-rechts, atmet und blinzelt)
  { src: 'Animation/Character_Idle.png', out: 'hero_idle.png', cols: 5, rows: 8, count: 38, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  // Reh läuft nach unten-rechts bzw. oben-rechts (nach links spiegelt das Spiel); gleiche Höhe und Füße wie deer.png
  { src: 'Animation/Reh_laufen_vorne.png', out: 'deer_walk.png', cols: 5, rows: 3, count: 11, frameW: 72, frameH: 96, feetY: 92, figureH: 84 },
  { src: 'Animation/Reh_laufen_hinten.png', out: 'deer_walk_back.png', cols: 5, rows: 2, frameW: 72, frameH: 96, feetY: 92, figureH: 84 },
  // Hirsch (Reh2, seltene Variante des Rehs) steht, von vorne und hinten; Maße wie stag.png. Von hinten ist er im
  // Original kleiner gemalt, daher fester Maßstab: Rumpf 1,1-mal so breit wie beim Reh, wie bei den Standbildern
  { src: 'Animation/Reh2_idle_vorne.png', out: 'stag_idle.png', cols: 5, rows: 5, count: 21, scale: 0.392, frameW: 80, frameH: 112, feetY: 108 },
  { src: 'Animation/Reh2_idle_hinten.png', out: 'stag_idle_back.png', cols: 5, rows: 4, scale: 0.5, frameW: 80, frameH: 112, feetY: 108 },
  // Reiher fliegt (Flügelschlag), nach unten-rechts bzw. oben-rechts. Fliegende Figuren hängen an ihrer Mitte
  // (Origin 0,5): Rahmen so, dass der Vogel mittig sitzt; derselbe Maßstab für beide, mit ausgebreiteten Flügeln etwa
  // so groß wie heron_fly.png
  { src: 'Animation/Reiher_fliegt_vorne.png', out: 'heron_flap.png', cols: 5, rows: 2, scale: 0.289, frameW: 96, frameH: 96, feetY: 92 },
  { src: 'Animation/Reiher_fliegt_hinten.png', out: 'heron_flap_back.png', cols: 5, rows: 2, scale: 0.289, frameW: 96, frameH: 96, feetY: 89 },
  // Reiher steht (schaut sich um, öffnet den Schnabel), von vorne und hinten; gleiche Höhe und Füße wie heron.png
  { src: 'Animation/Reiher_idle_vorne.png', out: 'heron_idle.png', cols: 5, rows: 5, count: 21, frameW: 88, frameH: 108, feetY: 104, figureH: 100 },
  { src: 'Animation/Reiher_idle_hinten.png', out: 'heron_idle_back.png', cols: 5, rows: 7, count: 32, frameW: 88, frameH: 108, feetY: 104, figureH: 100 },
  // Schaf läuft und steht, von vorne (unten-rechts) und hinten (oben-rechts). Im Original gleich groß gemalt, daher ein
  // gemeinsamer Maßstab: das höchste Bild so hoch wie sheep.png (72)
  { src: 'Animation/Schaf_läuft_vorne.png', out: 'sheep_walk.png', cols: 5, rows: 2, scale: 0.28, frameW: 80, frameH: 88, feetY: 84 },
  { src: 'Animation/Schaf_läuft_hinten.png', out: 'sheep_walk_back.png', cols: 5, rows: 2, scale: 0.28, frameW: 80, frameH: 88, feetY: 84 },
  { src: 'Animation/Schaf_idle_vorne.png', out: 'sheep_idle.png', cols: 5, rows: 4, scale: 0.28, frameW: 80, frameH: 88, feetY: 84 },
  { src: 'Animation/Schaf_idle_hinten.png', out: 'sheep_idle_back.png', cols: 5, rows: 5, count: 24, scale: 0.28, frameW: 80, frameH: 88, feetY: 84 },
  // Katze läuft und steht, von vorne (unten-rechts) und hinten (oben-rechts). Im Original gleich groß gemalt, daher ein
  // gemeinsamer Maßstab: das höchste Bild etwa so hoch wie cat.png (60)
  { src: 'Animation/Katze_läuft_vorne.png', out: 'cat_walk.png', cols: 5, rows: 2, scale: 0.245, frameW: 72, frameH: 80, feetY: 76 },
  { src: 'Animation/Katze_läuft_hinten.png', out: 'cat_walk_back.png', cols: 5, rows: 3, count: 13, scale: 0.245, frameW: 72, frameH: 80, feetY: 76 },
  { src: 'Animation/Katze_idle_vorne.png', out: 'cat_idle.png', cols: 5, rows: 2, scale: 0.245, frameW: 72, frameH: 80, feetY: 76 },
  { src: 'Animation/Katze_idle_hinten.png', out: 'cat_idle_back.png', cols: 5, rows: 4, scale: 0.245, frameW: 72, frameH: 80, feetY: 76 },
  // Glöckchen-Katze (cat2, seltene Variante) läuft, von vorne und hinten; im selben Maßstab wie die Katze passt sie genau
  // zu ihren Standbildern (cat2.png). Hinten sind die ersten drei Bilder im Original zu dunkel (eingeblendet)
  { src: 'Animation/Katze2_läuft_vorne.png', out: 'cat2_walk.png', cols: 5, rows: 3, count: 11, scale: 0.245, frameW: 72, frameH: 80, feetY: 76 },
  { src: 'Animation/Katze2_idle_vorne.png', out: 'cat2_idle.png', cols: 5, rows: 2, scale: 0.245, frameW: 72, frameH: 80, feetY: 76 },
  { src: 'Animation/Katze2_idle_hinten.png', out: 'cat2_idle_back.png', cols: 5, rows: 4, scale: 0.245, frameW: 72, frameH: 80, feetY: 76 },
  { src: 'Animation/Katze2_läuft_hinten.png', out: 'cat2_walk_back.png', cols: 5, rows: 2, evenBrightness: true, scale: 0.245, frameW: 72, frameH: 80, feetY: 76 },
  // Esel mit Henrik (Reittier Wiese) läuft und steht, von vorne und hinten; Maße wie ride_meadow.png. Im Original klein
  // und gleich groß gemalt, daher ein gemeinsamer Maßstab (fast 1:1)
  { src: 'Animation/Esel_läuft_vorne.png', out: 'ride_meadow_walk.png', cols: 5, rows: 2, scale: 0.96, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Esel_läuft_hinten.png', out: 'ride_meadow_walk_back.png', cols: 5, rows: 4, count: 16, scale: 0.96, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Esel_idle_vorne.png', out: 'ride_meadow_idle.png', cols: 5, rows: 5, count: 21, scale: 0.96, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Edel_ide_hinten.png', out: 'ride_meadow_idle_back.png', cols: 5, rows: 4, scale: 0.96, frameW: 160, frameH: 230, feetY: 224 },
  // Pferd mit Henrik (Reittier Wald) läuft und steht, von vorne und hinten; Maße wie ride_forest.png, gemeinsamer Maßstab
  { src: 'Animation/Pferd_läuft_vorne.png', out: 'ride_forest_walk.png', cols: 5, rows: 2, scale: 0.96, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Pferd_läuft_hinten.png', out: 'ride_forest_walk_back.png', cols: 5, rows: 7, count: 31, scale: 0.96, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Pferd_idle_front.png', out: 'ride_forest_idle.png', cols: 5, rows: 5, count: 21, scale: 0.96, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Pferd_idle_back.png', out: 'ride_forest_idle_back.png', cols: 5, rows: 2, scale: 0.96, frameW: 160, frameH: 230, feetY: 224 },
  // Elefant mit Henrik (Reittier Savanne) läuft und steht, von vorne und hinten; Maße wie ride_savanna.png, gemeinsamer Maßstab
  { src: 'Animation/Elefant_läuft_vorne.png', out: 'ride_savanna_walk.png', cols: 5, rows: 3, count: 14, scale: 0.614, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Elefant_läuft_hinten.png', out: 'ride_savanna_walk_back.png', cols: 5, rows: 6, count: 26, scale: 0.614, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Elefant_idle_vorne.png', out: 'ride_savanna_idle.png', cols: 5, rows: 4, steady: true, scale: 0.614, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Elefant_idle_hinten.png', out: 'ride_savanna_idle_back.png', cols: 5, rows: 5, count: 21, steady: true, scale: 0.614, frameW: 160, frameH: 230, feetY: 224 },
  // Reh steht (schaut sich um, blinzelt), ebenso von vorne und hinten
  { src: 'Animation/Reh_idle_vorne.png', out: 'deer_idle.png', cols: 5, rows: 4, frameW: 72, frameH: 96, feetY: 92, figureH: 84 },
  { src: 'Animation/Reh_idle_hinten.png', out: 'deer_idle_back.png', cols: 5, rows: 3, count: 14, frameW: 72, frameH: 96, feetY: 92, figureH: 84 },
  // Eichhörnchen rennt (Seitenansicht nach rechts). Im Original wechselt die Richtung: die Bilder nach links werden gespiegelt,
  // die zwei frontalen Wendebilder (10, 23) weggelassen.
  // Rennen und Sitzen aneinander angeglichen: Höhen so, dass der Kopf gleich groß ist (im Original ist der Kopf beim
  // Sitzen 1,2-mal so groß), Sättigung auf denselben Mittelwert (0,62; vorher 0,67 bzw. 0,58)
  { src: 'Animation/EIchhörnchen_laufen_vorne.png', out: 'squirrel_run.png', cols: 5, rows: 6, count: 29, skip: [10, 23], mirror: [11, 12, 13, 14, 24, 25, 26, 27], dropGreen: true, saturate: 0.93, frameW: 64, frameH: 60, feetY: 56, figureH: 50 },
  // Eichhörnchen sitzt und schaut sich um (Blick nach rechts)
  { src: 'Animation/Eichhörnchen_idle_vorne.png', out: 'squirrel_idle.png', cols: 5, rows: 5, count: 21, dropGreen: true, saturate: 1.07, frameW: 64, frameH: 60, feetY: 56, figureH: 43 },
  // Fuchs läuft nach unten-rechts bzw. oben-rechts (nach links spiegelt das Spiel); gleiche Höhe und Füße wie fox.png
  { src: 'Animation/Fuchs_läuft_vorne.png', out: 'fox_walk.png', cols: 5, rows: 2, dropGreen: true, frameW: 72, frameH: 72, feetY: 68, figureH: 64 },
  { src: 'Animation/Fuchs_läuft_hinten.png', out: 'fox_walk_back.png', cols: 5, rows: 5, count: 24, dropGreen: true, frameW: 72, frameH: 72, feetY: 68, figureH: 64 },
  // Fuchs steht, von vorne und von hinten (schaut sich um, blinzelt, wedelt mit dem Schwanz)
  { src: 'Animation/Fuchs_idle_vorne.png', out: 'fox_idle.png', cols: 5, rows: 4, dropGreen: true, frameW: 72, frameH: 72, feetY: 68, figureH: 64 },
  { src: 'Animation/Fuchs_idle_hinten.png', out: 'fox_idle_back.png', cols: 5, rows: 4, dropGreen: true, frameW: 72, frameH: 72, feetY: 68, figureH: 64 },
  // Löwe liegend (ein Bild, Kopf nach rechts; nach links spiegelt das Spiel). Maßstab 0,23, damit die Mähne
  // so groß ist wie beim stehenden Löwen: schlafend 184 Pixel hoch, aufmerksam 242
  { src: 'Sprites/Löwe schlafend.png', out: 'lion_sleep.png', cols: 1, rows: 1, frameW: 108, frameH: 52, feetY: 48, figureH: 42.3 },
  { src: 'Sprites/Löwe aufmerksam.png', out: 'lion_alert.png', cols: 1, rows: 1, frameW: 108, frameH: 64, feetY: 60, figureH: 55.7 },
  { src: 'Sprites/Löwe2 schläft.png', out: 'lion2_sleep.png', cols: 1, rows: 1, frameW: 108, frameH: 52, feetY: 48, figureH: 42.3 },
  { src: 'Sprites/Löwe2 aufmerksam.png', out: 'lion2_alert.png', cols: 1, rows: 1, frameW: 108, frameH: 64, feetY: 60, figureH: 55.7 },
  // Savanne: Maßstab je Bogen so, dass die Figur so hoch ist wie im Standbild (Median aller Bilder); ragt sie oben
  // hinaus, etwas kleiner. Breitere Figuren bekommen breitere Bilder (die Mitte bleibt die Mitte)
  // Antilope: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Antilope_läuft_vorne.mp4', out: 'antelope_walk.png', scale: 0.693, frameW: 72, frameH: 100, feetY: 96 }, // Video
  { src: 'Animation/Antilope_läuft_hinten.png', out: 'antelope_walk_back.png', cols: 5, rows: 4, count: 18, scale: 0.335, frameW: 72, frameH: 100, feetY: 96 },
  { src: 'Animation/Antilope_idle_vorne.png', out: 'antelope_idle.png', cols: 5, rows: 8, steady: true, scale: 0.278, frameW: 72, frameH: 100, feetY: 96 },
  { src: 'Animation/Antilope_idle_hinten.png', out: 'antelope_idle_back.png', cols: 5, rows: 8, steady: true, scale: 0.282, frameW: 72, frameH: 100, feetY: 96 },
  // Oryx-Antilope: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Antilope2_läuft_vorne.png', out: 'antelope2_walk.png', cols: 5, rows: 7, count: 32, scale: 0.329, frameW: 72, frameH: 100, feetY: 96 },
  { src: 'Animation/Antilope2_läuft_hinten.png', out: 'antelope2_walk_back.png', cols: 5, rows: 2, scale: 0.333, frameW: 72, frameH: 100, feetY: 96 },
  { src: 'Animation/Antilope2_idle_vorne.png', out: 'antelope2_idle.png', cols: 5, rows: 4, steady: true, scale: 0.339, frameW: 72, frameH: 100, feetY: 96 },
  { src: 'Animation/Antilope2_idle_hinten.png', out: 'antelope2_idle_back.png', cols: 5, rows: 3, count: 12, steady: true, scale: 0.336, frameW: 72, frameH: 100, feetY: 96 },
  // Zebra: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Zebra_läuft_vorne.mp4', out: 'zebra_walk.png', scale: 0.74, frameW: 80, frameH: 104, feetY: 100 }, // Video
  { src: 'Animation/Zebra_läuft_hinten.mp4', out: 'zebra_walk_back.png', scale: 0.74, frameW: 80, frameH: 104, feetY: 100 }, // Video
  { src: 'Animation/Zebra_idle_vorne.png', out: 'zebra_idle.png', cols: 5, rows: 8, steady: true, scale: 0.288, frameW: 80, frameH: 104, feetY: 100 },
  { src: 'Animation/Zebra_idle_hinten.png', out: 'zebra_idle_back.png', cols: 5, rows: 8, steady: true, scale: 0.287, frameW: 80, frameH: 104, feetY: 100 },
  // Schoko-Zebra: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Zebra2_läuft_vorne.png', out: 'zebra2_walk.png', cols: 5, rows: 2, scale: 0.384, frameW: 80, frameH: 104, feetY: 100 },
  { src: 'Animation/Zebra2_läuft_hinten.png', out: 'zebra2_walk_back.png', cols: 5, rows: 2, scale: 0.289, frameW: 80, frameH: 104, feetY: 100 },
  { src: 'Animation/Zebra2_idle_vorne.png', out: 'zebra2_idle.png', cols: 5, rows: 8, steady: true, scale: 0.288, frameW: 80, frameH: 104, feetY: 100 },
  { src: 'Animation/Zebra2_idle_hinten.png', out: 'zebra2_idle_back.png', cols: 5, rows: 8, steady: true, scale: 0.287, frameW: 80, frameH: 104, feetY: 100 },
  // Giraffe: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Giraffe_läuft_vorne.png', out: 'giraffe_walk.png', cols: 5, rows: 3, count: 11, scale: 0.639, frameW: 106, frameH: 168, feetY: 164 },
  { src: 'Animation/Giraffe_läuft_hinten.png', out: 'giraffe_walk_back.png', cols: 5, rows: 2, scale: 0.629, frameW: 104, frameH: 168, feetY: 164 },
  { src: 'Animation/Giraffe_idlie_vorne.png', out: 'giraffe_idle.png', cols: 5, rows: 4, scale: 0.631, frameW: 114, frameH: 168, feetY: 164 },
  { src: 'Animation/Giraffe_idle_hinten.png', out: 'giraffe_idle_back.png', cols: 5, rows: 8, count: 39, scale: 0.639, frameW: 128, frameH: 168, feetY: 164 },
  // Löwe: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Löwe_läuft_vorne.png', out: 'lion_walk.png', cols: 5, rows: 2, scale: 0.287, frameW: 74, frameH: 96, feetY: 92 },
  { src: 'Animation/Löwe_läuft_hinten.png', out: 'lion_walk_back.png', cols: 5, rows: 2, scale: 0.286, frameW: 72, frameH: 96, feetY: 92 },
  { src: 'Animation/Löwe_idle_vorne.png', out: 'lion_idle.png', cols: 5, rows: 5, count: 21, scale: 0.288, frameW: 78, frameH: 96, feetY: 92 },
  { src: 'Animation/Löwe_idle_hinten.png', out: 'lion_idle_back.png', cols: 5, rows: 4, scale: 0.286, frameW: 74, frameH: 96, feetY: 92 },
  // Schwarzmähnen-Löwe: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Löwe2_läuft_vorne.png', out: 'lion2_walk.png', cols: 5, rows: 3, count: 12, scale: 0.289, frameW: 74, frameH: 96, feetY: 92 },
  { src: 'Animation/Löwe2_läuft_hinten.png', out: 'lion2_walk_back.png', cols: 5, rows: 2, scale: 0.279, frameW: 72, frameH: 96, feetY: 92 },
  { src: 'Animation/Löwe2_idle_vorne.png', out: 'lion2_idle.png', cols: 5, rows: 4, count: 18, scale: 0.290, frameW: 82, frameH: 96, feetY: 92 },
  { src: 'Animation/Löwe2_idle_hinten.png', out: 'lion2_idle_back.png', cols: 5, rows: 8, scale: 0.277, frameW: 72, frameH: 96, feetY: 92 },
  // Erdmännchen: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Erdmännchen_läuft_vorne.png', out: 'meerkat_walk.png', cols: 5, rows: 2, scale: 0.153, frameW: 40, frameH: 56, feetY: 52 },
  { src: 'Animation/Erdmännchen_läuft_hinten.png', out: 'meerkat_walk_back.png', cols: 5, rows: 3, count: 12, scale: 0.154, frameW: 40, frameH: 56, feetY: 52 },
  { src: 'Animation/Erdmännchen_idle_vorne.png', out: 'meerkat_idle.png', cols: 5, rows: 4, scale: 0.165, frameW: 40, frameH: 56, feetY: 52 },
  { src: 'Animation/Erdmännchen_idle_hinten.png', out: 'meerkat_idle_back.png', cols: 5, rows: 8, steady: true, scale: 0.158, frameW: 40, frameH: 56, feetY: 52 },
  // Krokodil: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Krokodil_läuft_vorne.png', out: 'croc_walk.png', cols: 5, rows: 2, alignFeet: 6, scale: 0.234, frameW: 72, frameH: 104, feetY: 88 },
  { src: 'Animation/Krokodil_läuft_hinten.png', out: 'croc_walk_back.png', cols: 5, rows: 8, alignFeet: 6, scale: 0.31, frameW: 112, frameH: 156, feetY: 120 }, // dünner gezeichnet als im Stehen: größer, in höherem Bild; Füße auf der Linie, der Schwanz hängt darunter
  { src: 'Animation/Krokodil_idle_vorne.png', out: 'croc_idle.png', cols: 5, rows: 8, steady: true, scale: 0.234, frameW: 72, frameH: 92, feetY: 88 },
  { src: 'Animation/Krokodil_idle_hinten.png', out: 'croc_idle_back.png', cols: 5, rows: 8, steady: true, scale: 0.258, frameW: 72, frameH: 92, feetY: 88 },
  // Albino-Krokodil: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Krokodil2_läuft_vorne.png', out: 'croc_albino_walk.png', cols: 5, rows: 3, count: 11, alignFeet: 6, scale: 0.237, frameW: 86, frameH: 104, feetY: 88 },
  { src: 'Animation/Krokodil2_läuft_hinten.png', out: 'croc_albino_walk_back.png', cols: 5, rows: 3, count: 12, alignFeet: 6, scale: 0.238, frameW: 76, frameH: 104, feetY: 88 },
  { src: 'Animation/Krokodil2_idle_vorne.png', out: 'croc_albino_idle.png', cols: 5, rows: 8, steady: true, scale: 0.228, frameW: 78, frameH: 92, feetY: 88 },
  { src: 'Animation/Krokodil2_idle_hinten.png', out: 'croc_albino_idle_back.png', cols: 5, rows: 3, steady: true, scale: 0.241, frameW: 72, frameH: 92, feetY: 88 },
  // Nilpferd: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Nilpferd_läuft_vorne.png', out: 'hippo_walk.png', cols: 5, rows: 3, count: 14, steady: true, alignFeet: true, scale: 0.252, frameW: 96, frameH: 88, feetY: 84 },
  { src: 'Animation/Nilpferd_läuft_hinten.png', out: 'hippo_walk_back.png', cols: 5, rows: 3, count: 11, steady: true, alignFeet: true, scale: 0.252, frameW: 96, frameH: 88, feetY: 84 },
  { src: 'Animation/Nilpferd_idle_vorne.png', out: 'hippo_idle.png', cols: 5, rows: 8, count: 37, scale: 0.306, frameW: 96, frameH: 88, feetY: 84 },
  { src: 'Animation/Nilpferd_idlie_hinten.png', out: 'hippo_idle_back.png', cols: 5, rows: 3, degreen: 'all', scale: 0.288, frameW: 96, frameH: 88, feetY: 84 },
  // Hyäne: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Hyäne_läuft_vorne.mp4', out: 'hyena_walk.png', scale: 0.9, frameW: 80, frameH: 80, feetY: 76 }, // Video
  { src: 'Animation/Hyäne_läuft_hinten.mp4', out: 'hyena_walk_back.png', scale: 0.9, frameW: 80, frameH: 80, feetY: 76 }, // Video
  { src: 'Animation/Hyäne_idle_vorne.mp4', out: 'hyena_idle.png', scale: 0.18, frameW: 80, frameH: 80, feetY: 76 }, // Video
  { src: 'Animation/Hyäne_idle_hinten.mp4', out: 'hyena_idle_back.png', scale: 0.18, frameW: 80, frameH: 80, feetY: 76 }, // Video
  // Gnu: Laufen und Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild)
  { src: 'Animation/Gnu_läuft_vorne.png', out: 'gnu_walk.png', cols: 5, rows: 3, scale: 0.262, frameW: 88, frameH: 96, feetY: 92 },
  { src: 'Animation/Gnu_läuft_hinten.png', out: 'gnu_walk_back.png', cols: 5, rows: 3, scale: 0.252, frameW: 88, frameH: 96, feetY: 92 },
  { src: 'Animation/Gnu_idle_vorne.png', out: 'gnu_idle.png', cols: 5, rows: 8, steady: true, scale: 0.246, frameW: 88, frameH: 96, feetY: 92 },
  { src: 'Animation/Gnu_idle_hinten.png', out: 'gnu_idle_back.png', cols: 5, rows: 8, steady: true, scale: 0.252, frameW: 88, frameH: 96, feetY: 92 },
  // Geier: Stehen, von vorne und hinten (Maßstab: so groß wie das Standbild; fliegend noch ohne Animation)
  { src: 'Animation/Geier_idle_vorne.png', out: 'vulture_idle.png', cols: 5, rows: 8, count: 38, scale: 0.195, frameW: 88, frameH: 108, feetY: 104 },
  { src: 'Animation/Geier_idle_hinten.png', out: 'vulture_idle_back.png', cols: 5, rows: 7, count: 32, scale: 0.192, frameW: 88, frameH: 108, feetY: 104 },
  // Schuhschnabel (Reiher-Skin): Stehen, von vorne und hinten
  { src: 'Animation/Schuhschnabel_idle_vorne.png', out: 'shoebill_idle.png', cols: 5, rows: 8, degreen: 'all', steady: true, scale: 0.318, frameW: 88, frameH: 108, feetY: 104 },
  { src: 'Animation/Schuhschnabel_idle_hinten.png', out: 'shoebill_idle_back.png', cols: 5, rows: 8, degreen: 'all', steady: true, scale: 0.320, frameW: 88, frameH: 108, feetY: 104 },
  // Zebra trinkt, Giraffe frisst (Maßstab wie das Standbild dazu); Geier und Schuhschnabel fliegen (Fläche wie das Flugbild)
  { src: 'Animation/Zebra_trinkt_vorne.png', out: 'zebra_drinking.png', cols: 5, rows: 8, count: 38, degreen: true, steady: true, scale: 0.359, frameW: 80, frameH: 104, feetY: 100 },
  { src: 'Animation/Zebra_trinkt_hinten.png', out: 'zebra_drinking_back.png', cols: 5, rows: 8, count: 39, degreen: true, steady: true, scale: 0.374, frameW: 80, frameH: 104, feetY: 100 },
  { src: 'Animation/Zebra2_trinkt_vorne.png', out: 'zebra2_drinking.png', cols: 5, rows: 8, count: 38, degreen: true, steady: true, scale: 0.359, frameW: 80, frameH: 104, feetY: 100 },
  { src: 'Animation/Zebra2_trinkt_hinten.png', out: 'zebra2_drinking_back.png', cols: 5, rows: 8, count: 39, degreen: true, steady: true, scale: 0.374, frameW: 80, frameH: 104, feetY: 100 },
  { src: 'Animation/Giraffe_frisst_vorne.png', out: 'giraffe_eating.png', cols: 5, rows: 5, count: 21, scale: 0.538, frameW: 108, frameH: 180, feetY: 176 },
  { src: 'Animation/Giraffe_frisst_hinten.png', out: 'giraffe_eating_back.png', cols: 5, rows: 2, scale: 0.815, frameW: 106, frameH: 180, feetY: 176 },
  { src: 'Animation/Geier_fliegt_vorne.png', out: 'vulture_flap.png', cols: 5, rows: 8, steady: true, scale: 0.288, frameW: 126, frameH: 108, feetY: 104 },
  { src: 'Animation/Geier_fliegt_hinten.png', out: 'vulture_flap_back.png', cols: 5, rows: 8, count: 37, steady: true, mirror: [...Array(37).keys()], scale: 0.288, frameW: 96, frameH: 100, feetY: 96 }, // im Original nach links: gespiegelt
  { src: 'Animation/Schuhschnabel_fliegt_vorne.png', out: 'shoebill_flap.png', cols: 5, rows: 8, degreen: 'all', scale: 0.247, frameW: 96, frameH: 92, feetY: 88 },
  { src: 'Animation/Schuhschnabel_fliegt_hinten.png', out: 'shoebill_flap_back.png', cols: 5, rows: 8, degreen: 'all', mirror: [...Array(40).keys()], scale: 0.247, frameW: 96, frameH: 92, feetY: 88 }, // im Original nach links: gespiegelt
  // Warzenschwein: Laufen und Stehen; Flamingo: Stehen und Fliegen (Maßstab wie Standbild bzw. Flugbild)
  { src: 'Animation/Warzenschwein_läuft_vorne.png', out: 'warthog_walk.png', cols: 5, rows: 2, steady: true, scale: 0.258, frameW: 80, frameH: 88, feetY: 84 },
  { src: 'Animation/Warzenschwein_läuft_hinten.png', out: 'warthog_walk_back.png', cols: 5, rows: 7, count: 33, scale: 0.259, frameW: 80, frameH: 88, feetY: 84 },
  { src: 'Animation/Warzenschwein_idle_vorne.png', out: 'warthog_idle.png', cols: 5, rows: 7, scale: 0.260, frameW: 80, frameH: 88, feetY: 84 },
  { src: 'Animation/Warzenschwein_idle_hinten.png', out: 'warthog_idle_back.png', cols: 5, rows: 4, scale: 0.265, frameW: 80, frameH: 88, feetY: 84 },
  { src: 'Animation/Flamingo_idle_vorne.png', out: 'flamingo_idle.png', cols: 5, rows: 8, count: 36, scale: 0.332, frameW: 88, frameH: 108, feetY: 104 },
  { src: 'Animation/Flamingo_idle_hinten.png', out: 'flamingo_idle_back.png', cols: 5, rows: 8, count: 38, scale: 0.328, frameW: 88, frameH: 108, feetY: 104 },
  { src: 'Animation/Flamingo_fliegt_vorne.png', out: 'flamingo_flap.png', cols: 5, rows: 4, count: 16, steady: true, scale: 0.279, frameW: 104, frameH: 100, feetY: 96 },
  { src: 'Animation/Flamingo_fliegt_hinten.png', out: 'flamingo_flap_back.png', cols: 5, rows: 9, count: 41, steady: true, scale: 0.279, frameW: 104, frameH: 100, feetY: 96 },
  // Tiere aus Videos (MP4 vor Greenscreen, vorne nach unten-rechts, hinten nach oben-rechts). Die Tiere füllen in den
  // Videos etwa gleich viel vom Bild aus: je Tierart ein Maßstab bezogen auf die Videogröße (128 bzw. 640 Pixel), so dass
  // das Laufen von vorne so groß ist wie das Standbild; Sitzen und Liegen sind dadurch von selbst niedriger. Einzelne
  // Videos sind anders gezoomt, dort ist der Maßstab angepasst (Tiger steht hinten, Panda läuft hinten, Orang-Utan2)
  // Bambuswald: Panda, Roter Panda (nur von vorne, schaut im Video nach links), Tiger, Pfau, Japanmakak
  { src: 'Animation/Panda_läuft_vorne.mp4', out: 'panda_walk.png', scale: 0.883, frameW: 88, frameH: 96, feetY: 92 },
  { src: 'Animation/Panda_läuft_hinten.mp4', out: 'panda_walk_back.png', scale: 0.218, frameW: 88, frameH: 96, feetY: 92 },
  // Panda sitzt und frisst Bambus (= Stehen): die ersten 13 Bilder zoomen heran (Panda wächst), daher erst ab Bild 13;
  // im Video sinkt er langsam ab und steigt wieder (5 Pixel), daher stabilize. Etwas größer als zuerst (Höhe 80)
  { src: 'Animation/Panda_idle.webm', out: 'panda_idle.png', range: [13, 106], stabilize: true, scale: 0.79, frameW: 88, frameH: 96, feetY: 92 },
  { src: 'Animation/RoterPanda_läuft_vorne.mp4', out: 'redpanda_walk.png', mirror: 'all', scale: 0.69, frameW: 72, frameH: 72, feetY: 68 },
  { src: 'Animation/Tiger_läuft_vorne.mp4', out: 'tiger_walk.png', scale: 0.1945, frameW: 120, frameH: 104, feetY: 99 },
  { src: 'Animation/Tiger_läuft_hinten.mp4', out: 'tiger_walk_back.png', scale: 0.9724, frameW: 120, frameH: 104, feetY: 99 },
  { src: 'Animation/Tiger_idle_vorne.mp4', out: 'tiger_idle.png', scale: 0.9724, frameW: 120, frameH: 104, feetY: 99 },
  { src: 'Animation/Tiger_idle_hinten.mp4', out: 'tiger_idle_back.png', scale: 0.2497, frameW: 120, frameH: 104, feetY: 99 },
  { src: 'Animation/Tiger2_läuft_vorne.mp4', out: 'tiger2_walk.png', scale: 0.989, frameW: 120, frameH: 104, feetY: 99 },
  { src: 'Animation/Tiger2_läuft_hinten.mp4', out: 'tiger2_walk_back.png', scale: 0.989, frameW: 120, frameH: 104, feetY: 99 },
  { src: 'Animation/Tiger2_idle_vorne.mp4', out: 'tiger2_idle.png', scale: 0.1978, frameW: 120, frameH: 104, feetY: 99 },
  { src: 'Animation/Tiger2_idle_hinten.mp4', out: 'tiger2_idle_back.png', scale: 0.989, frameW: 120, frameH: 104, feetY: 99 },
  // nach vorne etwas kleiner (89 %), sonst größer als der stehende Pfau
  { src: 'Animation/Pfau_läuft_vorne.mp4', out: 'peacock_walk.png', scale: 0.83, frameW: 96, frameH: 96, feetY: 92 },
  // von hinten: ein Ausschnitt, der sauber im Kreis läuft
  { src: 'Animation/Pfau_läuft_hinten.mp4', out: 'peacock_walk_back.png', range: [23, 95], scale: 0.93, frameW: 96, frameH: 96, feetY: 92 },
  { src: 'Animation/Pfau2_läuft_vorne.mp4', out: 'peacock2_walk.png', scale: 0.93, frameW: 96, frameH: 96, feetY: 92 },
  // Japanmakak sitzt (Einzelbilder, für das Stehen): im Original 1,39-mal so groß gemalt wie der stehende (Gesicht),
  // daher so verkleinert, dass er zum Laufen passt (sitzend ca. 60 hoch); von hinten schaut er nach links: gespiegelt
  { src: 'Sprites/Japanmakak_sitzt_vorne.png', out: 'macaque_sit.png', cols: 1, rows: 1, scale: 0.388, frameW: 72, frameH: 72, feetY: 68 },
  { src: 'Sprites/Japanmakak_sitzt_hinten.png', out: 'macaque_sit_back.png', cols: 1, rows: 1, mirror: 'all', scale: 0.388, frameW: 72, frameH: 72, feetY: 68 },
  { src: 'Animation/Japanmakak_läuft_vorne.mp4', out: 'macaque_walk.png', range: [3, 32], scale: 0.653, frameW: 72, frameH: 72, feetY: 68 },
  // von hinten: ab Bild 38 dreht er sich im Video um (dann von vorne); Bilder 8-31 laufen nahtlos im Kreis.
  // 10 % größer als vorne, sonst wirkt er von hinten kleiner (gleiche Fläche wie von vorne)
  { src: 'Animation/Japanmakak_läuft_hinten.mp4', out: 'macaque_walk_back.png', range: [8, 31], scale: 0.718, frameW: 72, frameH: 72, feetY: 68 },
  // Spielfigur im Bambuswald (Kleidung Asien), Höhe wie die anderen Kleidungen (108); gemeinsamer Maßstab für alle vier.
  // Laufen: Ausschnitte, die nahtlos im Kreis laufen
  { src: 'Animation/Character_bambuswald_läuft_vorne.mp4', out: 'hero_asia_walk.png', range: [26, 69], scale: 0.31, frameW: 88, frameH: 116, feetY: 112 },
  // von hinten (neue Fassung): ein ganzer Doppelschritt, nur vom letzten Bild zurück zum ersten fehlt eins: ein Zwischenbild
  { src: 'Animation/Chatacter_bambuswald_läuft_hinten.mp4', out: 'hero_asia_walk_back.png', loopBlend: 1, scale: 0.31, frameW: 88, frameH: 116, feetY: 112 },
  { src: 'Animation/Character_bambuswald_idle_vorne.mp4', out: 'hero_asia_idle.png', scale: 0.31, frameW: 88, frameH: 116, feetY: 112 },
  { src: 'Animation/Character_bambuswald_idle_hinten.mp4', out: 'hero_asia_idle_back.png', scale: 0.31, frameW: 88, frameH: 116, feetY: 112 },
  // Wasserbüffel mit Henrik (Reittier Asien), Maße wie ride_asia.png (Höhe 160)
  { src: 'Animation/Wasserbüffel_läuft_vorne.mp4', out: 'ride_asia_walk.png', range: [8, 34], scale: 0.444, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Wasserbüffel_läuft_hinten.mp4', out: 'ride_asia_walk_back.png', range: [9, 29], scale: 0.444, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Wasserbüffel_idle_vorne.mp4', out: 'ride_asia_idle.png', scale: 0.444, frameW: 160, frameH: 230, feetY: 224 },
  { src: 'Animation/Wasserbüffel_idle_hinten.mp4', out: 'ride_asia_idle_back.png', scale: 0.444, frameW: 160, frameH: 230, feetY: 224 },
  // Dschungel: Orang-Utan und Orang-Utan mit Backenwülsten (orangutan2); Sitzen nur von vorne, Winken etwas breiter (Arm).
  // 10 % größer als zuerst, daher Rahmen 96x96 (Fußlinie 92/96, fast wie orangutan.png mit 84/88)
  { src: 'Animation/Orangutan_läuft_vorne.mp4', out: 'orangutan_walk.png', scale: 0.99, frameW: 96, frameH: 96, feetY: 92 },
  // Sprung von Baum zu Baum: das Video zeigt zwei Sprünge, gebraucht wird der erste (ducken, abspringen, fliegen mit
  // ausgestreckten Armen, landen); breiterer Rahmen für die ausgestreckten Arme. Die Bilder folgen dem Sprung (Orangutan.js)
  { src: 'Animation/Orangutan_sprung.mp4', out: 'orangutan_jump.png', range: [14, 53], scale: 0.99, frameW: 112, frameH: 96, feetY: 92 },
  // dasselbe für den Orang-Utan mit Backenwülsten (ein Sprung im Video)
  { src: 'Animation/Orangutan2_sprung.mp4', out: 'orangutan2_jump.png', range: [12, 50], scale: 0.99, frameW: 112, frameH: 96, feetY: 92 },
  { src: 'Animation/Orangutan_läuft_hinten.mp4', out: 'orangutan_walk_back.png', scale: 0.99, frameW: 96, frameH: 96, feetY: 92 },
  // Sitzen und Winken: im Video dunkler und matter als das Laufen (Fell Helligkeit 148 statt ca. 170), daher angeglichen
  { src: 'Animation/Orangutan_idle_vorne.mp4', out: 'orangutan_idle.png', saturate: 1.18, brightness: 1.16, scale: 0.198, frameW: 96, frameH: 96, feetY: 92 },
  // Winken: nur der Teil mit erhobener Hand (er winkt im Baum nur kurz); etwas kleiner, damit er so groß ist wie beim Sitzen
  // offsetX: Körper genau dort, wo er beim Sitzen sitzt (der erhobene Arm verschiebt ihn sonst im Rahmen)
  { src: 'Animation/Orangutan_winkt.mp4', out: 'orangutan_wave.png', range: [14, 94], saturate: 1.05, brightness: 1.14, scale: 0.891, offsetX: -9, frameW: 112, frameH: 96, feetY: 92 },
  { src: 'Animation/Urangutan2_läuft_vorne.mp4', out: 'orangutan2_walk.png', scale: 0.2233, frameW: 96, frameH: 96, feetY: 92 },
  { src: 'Animation/Oranutan2_läuft_hinten.mp4', out: 'orangutan2_walk_back.png', scale: 0.99, frameW: 96, frameH: 96, feetY: 92 },
  // ab Bild 28 fällt ihm etwas aus der Hand bis weit unter die Füße: unterhalb der Füße (Zeile 490) abgeschnitten
  { src: 'Animation/Orangutan2_idle_vorne.mp4', out: 'orangutan2_idle.png', clipBelow: 490, scale: 0.2024, frameW: 96, frameH: 96, feetY: 92 },
  { src: 'Animation/Orangutan2_winken.mp4', out: 'orangutan2_wave.png', range: [8, 55], scale: 0.792, offsetX: -4, frameW: 112, frameH: 96, feetY: 92 },
  // Zooauto mit Anhänger (Schnellreise, in allen Gebieten): ein Bild, Fahrtrichtung unten-links wie bisher Bild 0/1 der
  // alten Autos, so hoch wie diese. Quelle freigestellt mit npm run cutout, danach der warm-graue Bodenschatten
  // (ca. 199,183,172) in der unteren Hälfte entfernt
  { src: 'Sprites/Zooauto.png', out: 'car_zoo.png', cols: 1, rows: 1, frameW: 240, frameH: 140, feetY: 136, figureH: 131 },
  // Zoo-Boot (Schnellreise im Riff), ersetzt das Pixel-Boot boat.png aus make-sprites. Höher als dieses (Kabine, Kran),
  // daher Rahmen 240x160; der Rumpf liegt unten so weit über dem Ankerpunkt wie bisher (25 von 160 wie 21 von 140 ...).
  // Quelle freigestellt mit npm run cutout -- Sprites/Boot.jpg Sprites/Boot.png 840,110 775,180 895,180 780,90 777,91
  // 750,105 765,105 720,120 756,120 724,150 885,150 913,184 901,195 809,77 (Lücken am Kran), dann Bodenschatten entfernt
  { src: 'Sprites/Boot.png', out: 'boat_zoo.png', cols: 1, rows: 1, frameW: 240, frameH: 160, feetY: 130, figureH: 127 },
  // Wasserflugzeug (Schnellreise im Dschungel), ein Bild; neue Fassung im Zoo-Stil. Quelle freigestellt mit npm run cutout --
  // "Sprites/Wasserflugzeug neu.jpg" "Sprites/Wasserflugzeug neu.png" 336,160 337,176 352,176 (Lücke unter dem Flügel), Schatten entfernt
  { src: 'Sprites/Wasserflugzeug neu.png', out: 'seaplane.png', cols: 1, rows: 1, frameW: 240, frameH: 140, feetY: 136, figureH: 128 },
];

// skip: Bilder weglassen (Nummern im Raster); mirror: Bilder, die in die andere Richtung schauen, waagerecht spiegeln ('all': alle);
// dropGreen: grüne Reste vom Freistellen entfernen; saturate: Farbsättigung mal diesen Faktor (Helligkeit bleibt);
// boxOf: Rahmen und Maßstab eines anderen Eintrags übernehmen (out), wenn die Figur im Original an derselben Stelle steht
// (z. B. Sitzen und Springen): dann springt sie beim Wechsel zwischen den Animationen nicht;
// scale: fester Maßstab statt figureH (z. B. damit eine Variante genauso groß wird wie das Original);
// evenBrightness: zu dunkle Bilder (z. B. eingeblendet wie im Video) auf die Helligkeit der übrigen anheben;
// degreen: Grünstich und Grashalme weg (Zebra trinkt); steady: Flimmern dämpfen (siehe steadyFrames); alignFeet: Füße jedes Bilds auf die Fußlinie (siehe prepareGrid).
// Statt eines Spritesheets geht auch ein Video (.mp4) vor Greenscreen: dann ohne cols/rows, jedes Videobild ist ein Bild (siehe readVideo);
// range: [von, bis] nur diese Bilder (z. B. ein Ausschnitt eines Videos, der sauber im Kreis läuft);
// stabilize: Wackeln der Kamera ausgleichen (siehe stabilizeFrames); brightness: Helligkeit mal diesen Faktor;
// clipBelow: alles unterhalb dieser Zeile (in der Zelle) weg, z. B. was der Figur herunterfällt und unter ihren Füßen landet
function loadGrid({ src, cols, rows, count, range, skip = [], mirror = [], dropGreen = false, saturate = 1, brightness = 1, evenBrightness = false, steady = false, degreen = false, stabilize = false, clipBelow }) {
  const video = /\.(mp4|mov|webm)$/i.test(src);
  const img = video ? readVideo(src) : PNG.sync.read(fs.readFileSync(path.resolve(src)));
  if (video) [cols, rows] = [img.frames, 1];
  count ??= cols * rows;
  const { width: W, height: H, data } = img;
  const cw = W / cols;
  const ch = H / rows;
  const frames = [...Array(count).keys()].filter((i) => !skip.includes(i) && (!range || (i >= range[0] && i <= range[1])));
  if (mirror === 'all') mirror = frames; // alle Bilder schauen in die falsche Richtung

  if (dropGreen) {
    for (let k = 0; k < data.length; k += 4) if (data[k + 1] > data[k] + 10 && data[k + 1] > data[k + 2]) data[k + 3] = 0;
  }
  if (saturate !== 1) {
    for (let k = 0; k < data.length; k += 4) {
      const mx = Math.max(data[k], data[k + 1], data[k + 2]);
      for (let c = 0; c < 3; c++) data[k + c] = Math.max(0, Math.min(255, Math.round(mx - (mx - data[k + c]) * saturate)));
    }
  }
  if (clipBelow !== undefined) {
    for (let k = 0; k < data.length; k += 4) if (Math.floor(k / 4 / W) % ch > clipBelow) data[k + 3] = 0;
  }
  if (brightness !== 1) {
    for (let k = 0; k < data.length; k += 4) for (let c = 0; c < 3; c++) data[k + c] = Math.min(255, Math.round(data[k + c] * brightness));
  }
  if (degreen) {
    // grünstichiges Fell grau machen (Helligkeit bleibt), kräftig grüne Halme entfernen; türkises Wasser bleibt
    for (let k = 0; k < data.length; k += 4) {
      const [r, g, b] = [data[k], data[k + 1], data[k + 2]];
      if (!data[k + 3] || g <= r || g <= b) continue;
      // degreen: 'all' (kein Wasser im Bild, z. B. Schuhschnabel): jedes Grün wird grau
      if (degreen === 'all' || Math.max(r, g, b) - Math.min(r, g, b) <= 40) data[k] = data[k + 1] = data[k + 2] = Math.round((r + g + b) / 3);
      else if (b < g * 0.7) data[k + 3] = 0;
    }
  }
  if (steady) steadyFrames(img, cols, cw, ch, frames);
  if (evenBrightness) {
    // mittlere Helligkeit (hellster Farbanteil) der deckenden Pixel je Bild; Ziel ist der Median aller Bilder
    const cells = frames.map((i) => ({ ox: (i % cols) * cw, oy: Math.floor(i / cols) * ch }));
    const mean = cells.map(({ ox, oy }) => {
      let v = 0;
      let n = 0;
      for (let y = oy; y < oy + ch; y++) {
        for (let x = ox; x < ox + cw; x++) {
          const k = (y * W + x) * 4;
          if (data[k + 3] < 250) continue;
          v += Math.max(data[k], data[k + 1], data[k + 2]);
          n++;
        }
      }
      return n ? v / n : 0;
    });
    const target = [...mean].sort((a, b) => a - b)[Math.floor(mean.length / 2)];
    cells.forEach(({ ox, oy }, f) => {
      const gain = mean[f] ? target / mean[f] : 1;
      if (Math.abs(gain - 1) < 0.05) return;
      for (let y = oy; y < oy + ch; y++) {
        for (let x = ox; x < ox + cw; x++) {
          const k = (y * W + x) * 4;
          for (let c = 0; c < 3; c++) data[k + c] = Math.min(255, Math.round(data[k + c] * gain));
        }
      }
    });
  }
  if (stabilize) stabilizeFrames(img, cols, cw, ch, frames);
  // Spiegeln innerhalb der Zelle
  for (const i of mirror) {
    const ox = (i % cols) * cw;
    const oy = Math.floor(i / cols) * ch;
    for (let y = oy; y < oy + ch; y++) {
      for (let x = 0; x < cw / 2; x++) {
        const a = (y * W + ox + x) * 4;
        const b = (y * W + ox + cw - 1 - x) * 4;
        for (let c = 0; c < 4; c++) [data[a + c], data[b + c]] = [data[b + c], data[a + c]];
      }
    }
  }

  // gemeinsamer Rahmen der sichtbaren Pixel aller verwendeten Bilder, in Zellkoordinaten
  const box = { x0: cw, x1: 0, y0: ch, y1: 0 };
  for (const i of frames) {
    const ox = (i % cols) * cw;
    const oy = Math.floor(i / cols) * ch;
    for (let cy = 0; cy < ch; cy++) {
      for (let cx = 0; cx < cw; cx++) {
        if (data[((oy + cy) * W + ox + cx) * 4 + 3] <= 20) continue;
        box.x0 = Math.min(box.x0, cx);
        box.x1 = Math.max(box.x1, cx);
        box.y0 = Math.min(box.y0, cy);
        box.y1 = Math.max(box.y1, cy);
      }
    }
  }

  return { img, cw, ch, frames, box, cols };
}

// Video vor Greenscreen als Bilderreihe (alle Bilder nebeneinander, wie ein Spritesheet mit einer Zeile), freigestellt.
// Braucht ffmpeg/ffprobe (im PATH). Hintergrund sind zwei Farben, die das Skript selbst findet: die Farbe am Bildrand und
// das kräftige Grün (manche Videos haben einen Kasten in kräftigem Grün um die Figur und außen einen anderen Grünton
// oder Grau). Was einer der beiden Farben oder einer Mischung daraus nahe ist, wird durchsichtig, Übergänge halb.
// Grüne Teile der Figur (Blätter) bleiben, solange sie sich deutlich vom Hintergrund unterscheiden. Am Rand der Figur
// wird der grüne Schimmer entfernt (Grün höchstens so stark wie Rot oder Blau)
const KEY_NEAR = 45; // so nah an einer Hintergrundfarbe: ganz durchsichtig
const KEY_FAR = 100; // ab so weit weg: ganz Figur
function readVideo(src) {
  const file = path.resolve(src);
  const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file])
    .toString().trim().split(',').map(Number);
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
  const frames = Math.floor(raw.length / (w * h * 3));
  const at = (f, x, y) => ((f * h + y) * w + x) * 3;

  // Hintergrundfarben: Median am Rand des ersten Bilds und häufigstes kräftiges, helles Grün (der Rand kann selbst
  // ein dunkleres Grün sein)
  const edge = [];
  for (let x = 0; x < w; x++) edge.push(at(0, x, 0), at(0, x, h - 1));
  for (let y = 0; y < h; y++) edge.push(at(0, 0, y), at(0, w - 1, y));
  const median = (c) => edge.map((s) => raw[s + c]).sort((p, q) => p - q)[edge.length >> 1];
  const border = [median(0), median(1), median(2)];
  const counts = new Map();
  for (let s = 0; s < w * h * 3; s += 3) {
    const [r, g, b] = [raw[s], raw[s + 1], raw[s + 2]];
    if (g < 200 || g - Math.max(r, b) < 120) continue;
    const q = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    counts.set(q, (counts.get(q) ?? 0) + 1);
  }
  let top = null;
  for (const [q, c] of counts) if (!top || c > top[1]) top = [q, c];
  const key = top ? [((top[0] >> 10) << 3) + 4, (((top[0] >> 5) & 31) << 3) + 4, ((top[0] & 31) << 3) + 4] : border;

  // Abstand einer Farbe zur Strecke zwischen den beiden Hintergrundfarben (deckt auch Mischpixel an der Kastenkante ab)
  const d = key.map((v, c) => border[c] - v);
  const dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
  const dist = (r, g, b) => {
    const p = [r - key[0], g - key[1], b - key[2]];
    const t = dd ? Math.max(0, Math.min(1, (p[0] * d[0] + p[1] * d[1] + p[2] * d[2]) / dd)) : 0;
    return Math.hypot(p[0] - t * d[0], p[1] - t * d[1], p[2] - t * d[2]);
  };

  // Hintergrund ist, was vom Bildrand aus zusammenhängend erreichbar ist (wie ein Farbeimer von außen): Farben innerhalb
  // der Figur bleiben, auch wenn sie dem Randton ähneln (graues Fell neben grauem Rand). Eingeschlossene Lücken
  // (zwischen den Beinen) werden nur am kräftigen Grün erkannt, das in keinem Fell vorkommt
  const img = new PNG({ width: w * frames, height: h });
  const d0 = new Float32Array(w * h);
  const seen = new Uint8Array(w * h);
  for (let f = 0; f < frames; f++) {
    seen.fill(0);
    const stack = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = at(f, x, y);
        const k = (y * img.width + f * w + x) * 4;
        d0[y * w + x] = dist(raw[s], raw[s + 1], raw[s + 2]);
        img.data[k] = raw[s];
        img.data[k + 1] = raw[s + 1];
        img.data[k + 2] = raw[s + 2];
        const dk = Math.hypot(raw[s] - key[0], raw[s + 1] - key[1], raw[s + 2] - key[2]);
        img.data[k + 3] = dk <= KEY_NEAR ? 0 : dk >= KEY_FAR ? 255 : Math.round((255 * (dk - KEY_NEAR)) / (KEY_FAR - KEY_NEAR));
        if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && d0[y * w + x] < KEY_FAR) {
          seen[y * w + x] = 1;
          stack.push(y * w + x);
        }
      }
    }
    while (stack.length) {
      const p = stack.pop();
      const x = p % w;
      const y = (p - x) / w;
      const dp = d0[p];
      const ka = (y * img.width + f * w + x) * 4 + 3;
      img.data[ka] = Math.min(img.data[ka], dp <= KEY_NEAR ? 0 : Math.round((255 * (dp - KEY_NEAR)) / (KEY_FAR - KEY_NEAR)));
      if (dp > KEY_NEAR) continue; // halb durchsichtiger Rand der Figur: nicht weiter hinein
      for (const q of [x > 0 && p - 1, x < w - 1 && p + 1, y > 0 && p - w, y < h - 1 && p + w]) {
        if (q === false || seen[q] || d0[q] >= KEY_FAR) continue;
        seen[q] = 1;
        stack.push(q);
      }
    }
  }
  // grüner Schimmer: nur am Rand der Figur (halb durchsichtig oder nah an Durchsichtigem), innen bleibt Grün grün
  const A = (x, y) => img.data[(y * img.width + x) * 4 + 3];
  for (let y = 0; y < h; y++) {
    for (let X = 0; X < img.width; X++) {
      const k = (y * img.width + X) * 4;
      if (!img.data[k + 3]) continue;
      const x = X % w;
      // bis zu zwei Pixel vom Rand (Mischpixel aus der Videokompression liegen oft eine Reihe tiefer)
      let edgy = img.data[k + 3] < 255;
      for (let dy = -2; dy <= 2 && !edgy; dy++) {
        for (let dx = -2; dx <= 2 && !edgy; dx++) {
          if (x + dx < 0 || x + dx >= w || y + dy < 0 || y + dy >= h) continue;
          edgy = A(X + dx, y + dy) < 255;
        }
      }
      if (edgy) img.data[k + 1] = Math.min(img.data[k + 1], Math.max(img.data[k], img.data[k + 2]));
    }
  }
  img.frames = frames;
  return img;
}

// Wackeln ausgleichen (Panda frisst: die Figur sinkt im Video langsam ab und steigt wieder): jedes Bild wird so verschoben,
// dass sein unterer Teil (untere 45 %: Körper, Beine, Boden) möglichst genau auf dem des mittleren Bilds liegt.
// Kopf und Arme, die sich wirklich bewegen, liegen darüber und zählen nicht mit
function stabilizeFrames(img, cols, cw, ch, frames, R = 8) {
  const { width: W, data } = img;
  const cell = (i) => [(i % cols) * cw, Math.floor(i / cols) * ch];
  const get = (src, i, x, y) => {
    if (x < 0 || y < 0 || x >= cw || y >= ch) return [0, 0];
    const [ox, oy] = cell(i);
    const k = ((oy + y) * W + ox + x) * 4;
    return [src[k + 3], ((src[k] + src[k + 1] + src[k + 2]) / 3) * (src[k + 3] / 255)];
  };
  const src = Uint8Array.from(data);
  const ref = frames[frames.length >> 1];
  const y0 = Math.round(ch * 0.55);
  for (const i of frames) {
    let best = { dx: 0, dy: 0, e: Infinity };
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        let e = 0;
        for (let y = y0; y < ch && e < best.e; y++) {
          for (let x = 0; x < cw; x++) {
            const p = get(src, ref, x, y);
            const q = get(src, i, x + dx, y + dy);
            e += Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
          }
        }
        if (e < best.e) best = { dx, dy, e };
      }
    }
    if (!best.dx && !best.dy) continue;
    const [ox, oy] = cell(i);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const k = ((oy + y) * W + ox + x) * 4;
        const sx = x + best.dx;
        const sy = y + best.dy;
        if (sx < 0 || sy < 0 || sx >= cw || sy >= ch) {
          data[k + 3] = 0;
          continue;
        }
        const j = ((oy + sy) * W + ox + sx) * 4;
        for (let c = 0; c < 4; c++) data[k + c] = src[j + c];
      }
    }
  }
}

// Flimmern dämpfen: die KI zeichnet Streifen und Flecken in jedem Bild etwas anders, im Stehen flimmert das.
// Jedes Bild wird mit den zwei Bildern davor und danach gemischt, aber nur in 16x16-Blöcken, die sich im Groben
// kaum ändern (Kopf und Schwanz, die sich wirklich bewegen, bleiben scharf). Die Bilder laufen im Kreis.
function steadyFrames(img, cols, cw, ch, frames, B = 16, T = 18, R = 2) {
  const { width: W, data } = img;
  const n = frames.length;
  const at = (f, x, y) => (((Math.floor(frames[f] / cols) * ch + y) * W + (frames[f] % cols) * cw + x) * 4);
  const bw = Math.floor(cw / B);
  const bh = Math.floor(ch / B);
  // grobe Helligkeit je Block (durchsichtig zählt als dunkel)
  const coarse = frames.map((_, f) => {
    const g = new Float32Array(bw * bh);
    for (let y = 0; y < bh * B; y++) {
      for (let x = 0; x < bw * B; x++) {
        const k = at(f, x, y);
        g[Math.floor(y / B) * bw + Math.floor(x / B)] += ((data[k] + data[k + 1] + data[k + 2]) / 3) * (data[k + 3] / 255);
      }
    }
    return g.map((v) => v / (B * B));
  });
  const src = Uint8Array.from(data);
  for (let f = 0; f < n; f++) {
    for (let y = 0; y < bh * B; y++) {
      for (let x = 0; x < bw * B; x++) {
        const k = at(f, x, y);
        if (src[k + 3] <= 200) continue;
        const b = Math.floor(y / B) * bw + Math.floor(x / B);
        let r = src[k], g = src[k + 1], bl = src[k + 2], wsum = 1;
        for (let d = -R; d <= R; d++) {
          if (!d) continue;
          const o = (f + d + n) % n;
          const j = at(o, x, y);
          if (src[j + 3] <= 200) continue;
          const w = Math.max(0, 1 - Math.abs(coarse[f][b] - coarse[o][b]) / T) * (1 - Math.abs(d) / (R + 1));
          r += src[j] * w;
          g += src[j + 1] * w;
          bl += src[j + 2] * w;
          wsum += w;
        }
        data[k] = Math.round(r / wsum);
        data[k + 1] = Math.round(g / wsum);
        data[k + 2] = Math.round(bl / wsum);
      }
    }
  }
}

const MAX_SHEET_W = 4096;

function prepareGrid(entry) {
  const { src, out, frameW, frameH, feetY, boxOf } = entry;
  const { img, cw, ch, frames, box: ownBox, cols } = loadGrid(entry);
  const ref = boxOf && ANIMATIONS.find((a) => a.out === boxOf);
  if (boxOf && !ref) throw new Error(`${out}: boxOf ${boxOf} nicht gefunden`);
  const box = ref ? loadGrid(ref).box : ownBox;
  const scale = entry.scale ?? (ref ? ref.figureH : entry.figureH) / (box.y1 - box.y0 + 1);
  const bw = (box.x1 - box.x0 + 1) * scale;
  const bh = (box.y1 - box.y0 + 1) * scale;
  // höchstens 4096 Pixel breit (größere Texturen kann manches Handy nicht laden): sonst mehrere Reihen
  // loopBlend: so viele Zwischenbilder am Ende, die vom letzten zum ersten Bild überblenden (fehlt dem Video ein Bild
  // zur sauberen Schleife, wird der Sprung zurück zum Anfang so zu normalen Schritten)
  const blend = entry.loopBlend ?? 0;
  const total = frames.length + blend;
  const perRow = Math.min(total, Math.floor(MAX_SHEET_W / frameW));
  const sheet = new PNG({ width: frameW * perRow, height: frameH * Math.ceil(total / perRow) });
  frames.forEach((i, n) => {
    const ox = (i % cols) * cw;
    const oy = Math.floor(i / cols) * ch;
    const b = { x0: ox + box.x0, x1: ox + box.x1, y0: oy + box.y0, y1: oy + box.y1 };
    const fx = (n % perRow) * frameW;
    const fy = Math.floor(n / perRow) * frameH;
    // alignFeet: jedes Bild so verschieben, dass sein unterster Pixel auf der Fußlinie steht (die KI lässt die Figur
    // sonst von Bild zu Bild etwas auf und ab hüpfen). Eine Zahl statt true: unterste Zeile mit einem so breiten Stück
    // Figur (in Pixeln im Spiel), dünne Schwanzspitzen darunter zählen nicht (Krokodil von hinten)
    let lift = 0;
    if (entry.alignFeet) {
      const minRun = entry.alignFeet === true ? 1 : entry.alignFeet / scale;
      let bottom = -1;
      for (let y = b.y1; y >= b.y0 && bottom < 0; y--) {
        let run = 0;
        for (let x = b.x0; x <= b.x1; x++) {
          run = img.data[(y * img.width + x) * 4 + 3] > 20 ? run + 1 : 0;
          if (run >= minRun) {
            bottom = y;
            break;
          }
        }
      }
      if (bottom >= 0) lift = Math.round((b.y1 - bottom) * scale);
    }
    // offsetX: Figur im Rahmen waagerecht verschieben (z. B. damit der Körper beim Winken dort sitzt, wo er beim Sitzen sitzt)
    drawScaled(sheet, img, b, scale, fx + Math.round((frameW - bw) / 2) + (entry.offsetX ?? 0), fy + Math.round(feetY - bh) + lift, () => true);
  });
  if (bw > frameW) console.warn(`${src}: Figur ist breiter als der Frame (${bw.toFixed(0)} > ${frameW})`);
  const at = (n) => [(n % perRow) * frameW, Math.floor(n / perRow) * frameH];
  for (let j = 1; j <= blend; j++) {
    const t = j / (blend + 1);
    const [ax, ay] = at(frames.length - 1);
    const [bx, by] = at(0);
    const [cx, cy] = at(frames.length - 1 + j);
    for (let y = 0; y < frameH; y++) {
      for (let x = 0; x < frameW; x++) {
        const p = ((ay + y) * sheet.width + ax + x) * 4;
        const q = ((by + y) * sheet.width + bx + x) * 4;
        const o = ((cy + y) * sheet.width + cx + x) * 4;
        // mit vormultipliziertem Alpha mischen, sonst bekommen halb durchsichtige Ränder dunkle Säume
        const pa = (sheet.data[p + 3] / 255) * (1 - t);
        const qa = (sheet.data[q + 3] / 255) * t;
        const a = pa + qa;
        if (!a) continue;
        for (let c = 0; c < 3; c++) sheet.data[o + c] = Math.round((sheet.data[p + c] * pa + sheet.data[q + c] * qa) / a);
        sheet.data[o + 3] = Math.round(a * 255);
      }
    }
  }

  writeSheet(out, sheet);
  console.log(`${out}: ${total} Frames à ${frameW}x${frameH}, Maßstab ${scale.toFixed(3)}`);
}

// ONLY=hero_jungle.png,canoe.png: nur diese Bilder neu erzeugen
const ONLY = process.env.ONLY?.split(',');
CHARACTERS.filter((c) => !ONLY || ONLY.includes(c.out)).forEach(prepare);
ANIMATIONS.filter((c) => !ONLY || ONLY.includes(c.out)).forEach(prepareGrid);
