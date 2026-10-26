// Schneidet die vier Ansichten aus den gemalten Figuren in Sprites/ aus,
// verkleinert sie und legt sie als Spritesheets in public/assets/ ab.
// Aufruf: npm run characters

import { PNG } from 'pngjs';
import fs from 'node:fs';
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
  // Katze 2 (seltener Skin, schwarz-weiß getigert): gleicher Maßstab und Aufbau wie die normale Katze
  { src: 'Sprites/Katze2.png', out: 'cat2.png', frameW: 72, frameH: 80, feetY: 76, scale: 0.214, stripShadow: true },
  { src: 'Sprites/Katze2 schlafend.png', out: 'cat2_sleep.png', frameW: 56, frameH: 60, feetY: 56, scale: 0.214, stripShadow: true },
  { src: 'Sprites/Katze2 frisst.png', out: 'cat2_eat.png', frameW: 72, frameH: 80, feetY: 76, scale: 0.175, grid: [2, 2], stripShadow: true },
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
  { src: 'Sprites/Panda frisst.png', out: 'panda_eat.png', frameW: 88, frameH: 96, feetY: 92, scale: PANDA_SCALE, copyMirror: { 3: 2 } },
  // Japanmakak (Asien): laufend und badend (in der heißen Quelle, mit Handtuch), gleicher Maßstab; beide Rückansichten
  // schauen nach rechts, daher oben-links = oben-rechts gespiegelt. Freigestellt mit npm run cutout
  { src: 'Sprites/Affe.png', out: 'macaque.png', frameW: 72, frameH: 72, feetY: 68, scale: MACAQUE_SCALE, copyMirror: { 3: 2 } },
  { src: 'Sprites/Affe badet.png', out: 'macaque_bath.png', frameW: 72, frameH: 72, feetY: 66, scale: MACAQUE_SCALE, copyMirror: { 3: 2 } },
  { src: 'Sprites/Flamingo.png', out: 'flamingo.png', frameW: 88, frameH: 108, feetY: 104, figureH: 96 },
  { src: 'Sprites/Flamingo fliegend.png', out: 'flamingo_fly.png', frameW: 104, frameH: 100, feetY: 96, figureH: 88, byComponents: true }, // Flügel reichen in die Nachbarspalten
  { src: 'Sprites/Flamingo Baby.png', out: 'flamingo_baby.png', frameW: 88, frameH: 108, feetY: 104, figureH: 96 },
  // Tiger (Asien): laufend und fressend, gleicher Maßstab
  { src: 'Sprites/Tiger.png', out: 'tiger.png', frameW: 96, frameH: 80, feetY: 76, scale: 0.28 },
  { src: 'Sprites/Tiger frisst.png', out: 'tiger_eat.png', frameW: 96, frameH: 80, feetY: 76, scale: 0.28 },
  // weißer Tiger (seltene Variante): gleicher Aufbau und Maßstab
  { src: 'Sprites/Tiger2.png', out: 'tiger2.png', frameW: 96, frameH: 80, feetY: 76, scale: 0.28 },
  { src: 'Sprites/Tiger2 frisst.png', out: 'tiger2_eat.png', frameW: 96, frameH: 80, feetY: 76, scale: 0.28 },
  // Orang-Utan: auf allen Vieren und sitzend beim Fressen (das sitzende Bild nimmt er auch oben im Baum, siehe tree-peeks.cjs)
  { src: 'Sprites/Orang Utan.png', out: 'orangutan.png', frameW: 88, frameH: 88, feetY: 84, scale: 0.28 },
  { src: 'Sprites/Orang Utan sitzt und frisst.png', out: 'orangutan_eat.png', frameW: 88, frameH: 88, feetY: 84, scale: 0.28 },
  // Flanschen-Männchen (seltene Variante): gleiches Format und gleicher Maßstab
  { src: 'Sprites/Orang Utan2.png', out: 'orangutan2.png', frameW: 88, frameH: 88, feetY: 84, scale: 0.28 },
  { src: 'Sprites/Orang Utan2 sitzt und frisst.png', out: 'orangutan2_eat.png', frameW: 88, frameH: 88, feetY: 84, scale: 0.28 },
  // Pfau mit Rad und ohne (bei Pfau.png ist das Rad der Vorderansichten weggeschnitten, siehe tools/peacock-cut.cjs)
  { src: 'Sprites/Pfau Rad.png', out: 'peacock_wheel.png', frameW: 96, frameH: 96, feetY: 92, scale: 0.32 },
  { src: 'Sprites/Pfau.png', out: 'peacock.png', frameW: 96, frameH: 96, feetY: 92, scale: 0.32 },
  // weißer Pfau (seltene Variante): Rad der Vorderansichten mit dem blauen Pfau als Schablone weggeschnitten (tools/peacock2-cut.cjs)
  { src: 'Sprites/Pfau2 Rad.png', out: 'peacock2_wheel.png', frameW: 96, frameH: 96, feetY: 92, scale: 0.32 },
  { src: 'Sprites/Pfau2.png', out: 'peacock2.png', frameW: 96, frameH: 96, feetY: 92, scale: 0.32 },
  // Savanne, Wetterphasen: freigestellt mit npm run cutout und tools/savanna-cut.cjs
  // Schuhschnabel (Reiher-Skin bei Starkregen): stehend und fliegend (ohne Beine) wie der Reiher
  { src: 'Sprites/Schuhschnabel.png', out: 'shoebill.png', frameW: 88, frameH: 108, feetY: 104, figureH: 100, stripShadow: true },
  { src: 'Sprites/Schuschnabel fliegend.png', out: 'shoebill_fly.png', frameW: 96, frameH: 92, feetY: 88, figureH: 84, stripShadow: true, byComponents: true },
  // Albino-Krokodil (seltener Skin bei Starkregen): wie das Krokodil
  { src: 'Sprites/Krokodil2.png', out: 'croc_albino.png', frameW: 72, frameH: 92, feetY: 88, scale: 0.29 },
  { src: 'Sprites/Krokodil2 Wasser.png', out: 'croc_albino_water.png', frameW: 64, frameH: 44, feetY: 40, figureH: 34, grid: [2, 2] }, // ... im Wasser (wie croc_water)
  // Lungenfisch (Fisch-Skin): im Bild nach rechts, nach links, auftauchend, springend – im Sheet wie beim Fisch:
  // auftauchend, rechts, links, springend
  { src: 'Sprites/Lungenfisch.png', out: 'lungfish.png', frameW: 84, frameH: 64, feetY: 60, figureH: 56, order: [2, 0, 1, 3] },
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
function prepare({ src, out, frameW, frameH, feetY, figureH, scale: fixedScale, stripShadow = false, byComponents = false, grid = null, mirror = [], copyMirror = {}, order = null }) {
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
    const bw = (b.x1 - b.x0 + 1) * scale;
    const bh = (b.y1 - b.y0 + 1) * scale;
    const offX = i * frameW + Math.round((frameW - bw) / 2);
    const offY = Math.round(feetY - bh);
    drawScaled(sheet, img, b, scale, offX, offY, (sx, sy) => owner[sy * W + sx] === i); // Teile anderer Figuren ausblenden
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
  // Hauptfigur läuft nach unten-rechts (nach links wird im Spiel gespiegelt); gleiche Höhe und Füße wie hero.png
  { src: 'Animation/Character_Walking.png', out: 'hero_walk.png', cols: 5, rows: 2, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  // Hauptfigur läuft nach oben-rechts (Rückansicht; nach links wird gespiegelt)
  { src: 'Animation/Character_Walking_Back.png', out: 'hero_walk_back.png', cols: 5, rows: 3, count: 13, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  // Hauptfigur steht (Blick nach unten-rechts, atmet und blinzelt)
  { src: 'Animation/Character_Idle.png', out: 'hero_idle.png', cols: 5, rows: 8, count: 38, frameW: 88, frameH: 116, feetY: 112, figureH: 108 },
  // Löwe liegend (ein Bild, Kopf nach rechts; nach links spiegelt das Spiel). Maßstab 0,23, damit die Mähne
  // so groß ist wie beim stehenden Löwen: schlafend 184 Pixel hoch, aufmerksam 242
  { src: 'Sprites/Löwe schlafend.png', out: 'lion_sleep.png', cols: 1, rows: 1, frameW: 108, frameH: 52, feetY: 48, figureH: 42.3 },
  { src: 'Sprites/Löwe aufmerksam.png', out: 'lion_alert.png', cols: 1, rows: 1, frameW: 108, frameH: 64, feetY: 60, figureH: 55.7 },
  { src: 'Sprites/Löwe2 schläft.png', out: 'lion2_sleep.png', cols: 1, rows: 1, frameW: 108, frameH: 52, feetY: 48, figureH: 42.3 },
  { src: 'Sprites/Löwe2 aufmerksam.png', out: 'lion2_alert.png', cols: 1, rows: 1, frameW: 108, frameH: 64, feetY: 60, figureH: 55.7 },
  // Wasserflugzeug (Schnellreise im Dschungel), ein Bild
  { src: 'Sprites/Wasserflugzeug.png', out: 'seaplane.png', cols: 1, rows: 1, frameW: 240, frameH: 140, feetY: 136, figureH: 128 },
];

function prepareGrid({ src, out, cols, rows, count = cols * rows, frameW, frameH, feetY, figureH }) {
  const img = PNG.sync.read(fs.readFileSync(path.resolve(src)));
  const { width: W, height: H, data } = img;
  const cw = W / cols;
  const ch = H / rows;

  // gemeinsamer Rahmen der sichtbaren Pixel, in Zellkoordinaten
  const box = { x0: cw, x1: 0, y0: ch, y1: 0 };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] <= 20) continue;
      const cx = x % cw;
      const cy = y % ch;
      box.x0 = Math.min(box.x0, cx);
      box.x1 = Math.max(box.x1, cx);
      box.y0 = Math.min(box.y0, cy);
      box.y1 = Math.max(box.y1, cy);
    }
  }

  const scale = figureH / (box.y1 - box.y0 + 1);
  const bw = (box.x1 - box.x0 + 1) * scale;
  const bh = (box.y1 - box.y0 + 1) * scale;
  const sheet = new PNG({ width: frameW * count, height: frameH });
  for (let i = 0; i < count; i++) {
    const ox = (i % cols) * cw;
    const oy = Math.floor(i / cols) * ch;
    const b = { x0: ox + box.x0, x1: ox + box.x1, y0: oy + box.y0, y1: oy + box.y1 };
    drawScaled(sheet, img, b, scale, i * frameW + Math.round((frameW - bw) / 2), Math.round(feetY - bh), () => true);
  }
  if (bw > frameW) console.warn(`${src}: Figur ist breiter als der Frame (${bw.toFixed(0)} > ${frameW})`);

  writeSheet(out, sheet);
  console.log(`${out}: ${count} Frames à ${frameW}x${frameH}, Maßstab ${scale.toFixed(3)}`);
}

// ONLY=hero_jungle.png,canoe.png: nur diese Bilder neu erzeugen
const ONLY = process.env.ONLY?.split(',');
CHARACTERS.filter((c) => !ONLY || ONLY.includes(c.out)).forEach(prepare);
ANIMATIONS.filter((c) => !ONLY || ONLY.includes(c.out)).forEach(prepareGrid);
