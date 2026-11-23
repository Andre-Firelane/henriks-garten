// Die Karte des aktuellen Levels. Die Level selbst stehen in levels.js; setLevel() wechselt.
// Alle exportierten Werte zeigen immer auf das aktuelle Level.
import { LEVELS } from './levels.js';
import { game } from '../state.js';
import { TILE_W, TILE_H, tileToWorld, worldToTile } from './iso.js';
import { tr } from '../i18n.js';
import { currentSeason, firstSeason } from './season.js';
import { storyAt } from '../story/story.js';
import { sideHere, sideOverrides } from './sideMaps.js';
import { PEN_TOYS, TOYS, toyKey } from './toys.js';
import { DECOR, decorByChar, decorTiles, giveDecor, designablePen, ensureDecor } from './decor.js';
import { slotsIn, boothTiles } from './shops.js';

// leere Bauplätze (Buden, Riesenrad) erst ab Mavis Buden-Aufgabe zeigen – vorher lenken sie nur ab
export const slotsShown = () => storyAt('stands');

// ≈: ausgetrocknetes Wasserloch (Schlamm, Savanne in der Trockenzeit; dort steckt der Lungenfisch)
// w: Teich in der Voliere (sieht aus wie Wasser, ist aber kein wilder Teich mit Fischen); ',' Holzboden;
// h: heiße Quelle (Asien); B, E: Bogenbrücke über den Teich (darunter Wasser); Ŝ: Bootssteg (Dschungel, darunter Wasser)
// ɨ: zugefrorenes Meer (Eiswelt bei Nacht, begehbar); ȸ ȹ: Zaun über einem Bach (Wildpark im Tierpark)
// ŝ ĉ ṗ ķ ẋ: Sonnenblumen, Mais, Kürbisse, Kohl und Vogelscheuche auf dem Acker (Wiese)
// ≠: Sandpiste der Safari im Tierpark (dort fahren die Besucherautos; kein Weg für Fußgänger, die Tiere laufen darüber)
// ẑ: geharkter Kies im Zen-Garten am Teehaus (Bambuswald im Tierpark; man geht nicht darüber)
const GROUND = { 'ẑ': 'zen_gravel', '≠': 'savanna_path', 'ȸ': 'water', 'ȹ': 'water', '≈': 'mud', '=': 'soil', '~': 'water', o: 'fishpond', w: 'water', ',': 'planks', h: 'hotspring', B: 'water', E: 'water', Ƭ: 'water', ƫ: 'water', ř: 'water', ǒ: 'water', 0: 'water', Ŝ: 'water', ɨ: 'sea_ice', ŝ: 'soil', ĉ: 'soil', ṗ: 'soil', ķ: 'soil', ẋ: 'soil' }; // 0: Springbrunnen im See
const PATH_CHARS = '#GXI';
// Boden in den Hütten je Gebiet (sonst Holzdielen)
const HUT_FLOOR = { forest: 'planks_forest', savanna: 'planks_savanna', asia: 'planks_asia', jungle: 'planks_jungle', ice: 'planks_ice', office: 'floor_office', aquarium: 'floor_aquarium', tank: 'tank_floor', reptiles: 'floor_reptiles', terrarium: 'terrarium_floor', terrarium_raised: 'terrarium_floor' }; // Weg, Tor, Übergang und das Tor über dem Weg (Torii) liegen auf dem Weg-Boden

// Objekte: Textur, Ankerpunkt (Kachelmitte im Bild) und ob man dagegen läuft.
// hitbox: nur ein Kreis mit diesem Radius um die Kachelmitte ist fest (z. B. der Baumstamm); ohne hitbox die ganze Kachel.
export const OBJECTS = {
  T: { key: 'tree', originY: 82 / 96, solid: true, hitbox: 12 },
  b: { key: 'bush', originY: 33 / 40, solid: true, hitbox: 4 }, // Büsche und Sträucher: nur ein kleiner Kern ist fest, sonst bleibt man hängen
  r: { key: 'rock', originY: 18 / 24, solid: true, hitbox: 12 },
  // sway: wiegt sich, wenn man hindurchläuft (siehe Sway.js)
  f: { key: 'flowers_red', originY: 22 / 32, solid: false, sway: 4 },
  g: { key: 'flowers_yellow', originY: 22 / 32, solid: false, sway: 4 },
  P: { key: 'pine', originY: 100 / 112, solid: true, hitbox: 12 },
  D: { key: 'dark_tree', originY: 90 / 104, solid: true, hitbox: 12 },
  k: { key: 'dark_bush', originY: 36 / 44, solid: true, hitbox: 4 },
  L: { key: 'log', originY: 44 / 64, solid: true },
  n: { key: 'fern', originY: 24 / 32, solid: false, sway: 5 },
  m: { key: 'mushroom', originY: 18 / 24, solid: false },
  // Zäune: fence = Zaunart und Richtung (x = entlang tx, y = entlang ty), siehe addFence in GardenScene
  '-': { key: 'fence_x', originY: 44 / 64, solid: true, fence: { kind: 'wood', axis: 'x' } },
  '|': { key: 'fence_y', originY: 44 / 64, solid: true, fence: { kind: 'wood', axis: 'y' } },
  S: { key: 'sign_fish', originY: 54 / 56, solid: true },
  W: { key: 'signpost_post', originY: 60 / 64, solid: true, hitbox: 5 }, // Wegweiser: die schrägen Bretter zeichnet die Szene (drawSignBoards); fest ist nur der dünne Pfosten
  // Savanne
  A: { key: 'acacia', originY: 116 / 128, solid: true, hitbox: 12 },
  Ǎ: { key: 'acacia_bare', originY: 116 / 128, solid: true, hitbox: 12 }, // kahle Akazie (Geier-Voliere; in der Trockenzeit sind alle Akazien kahl)
  R: { key: 'boulder', originY: 46 / 56, solid: true, hitbox: 18 },
  v: { key: 'dry_bush', originY: 33 / 40, solid: true, hitbox: 4 },
  y: { key: 'tuft', originY: 18 / 24, solid: false },
  // Gehege: Kratzbaum, hoher Gitterzaun der Voliere (entlang tx bzw. ty)
  C: { key: 'cat_tree', originY: 73 / 80, solid: true, hitbox: 10 },
  _: { key: 'mesh_x', originY: 44 / 64, solid: true, fence: { kind: 'mesh', axis: 'x' } },
  '!': { key: 'mesh_y', originY: 44 / 64, solid: true, fence: { kind: 'mesh', axis: 'y' } },
  // Netz der Voliere (entlang tx bzw. ty)
  '^': { key: 'net_x', originY: 44 / 64, solid: true, fence: { kind: 'net', axis: 'x' } },
  ';': { key: 'net_y', originY: 44 / 64, solid: true, fence: { kind: 'net', axis: 'y' } },
  // Glaswand (Glaspavillon auf der Affeninsel im Tierpark; Bild wie das Glastor), entlang tx bzw. ty
  ǧ: { key: 'glass_x', originY: 44 / 64, solid: true, fence: { kind: 'glass', axis: 'x' } },
  Ǧ: { key: 'glass_y', originY: 44 / 64, solid: true, fence: { kind: 'glass', axis: 'y' } },
  // Stehtisch am Teehaus (Bambuswald im Tierpark): dort trinken die Besucher ihren Tee
  ţ: { key: 'tea_table', originY: 38 / 39, solid: true, hitbox: 8 },
  // dichter Maschendraht (Teich)
  '{': { key: 'chain_x', originY: 44 / 64, solid: true, fence: { kind: 'chain', axis: 'x' } },
  '}': { key: 'chain_y', originY: 44 / 64, solid: true, fence: { kind: 'chain', axis: 'y' } },
  // Füller im Gehege-Streifen hinter dem Kartenrand: sperren die ganze Kachel (ohne hitbox), damit niemand
  // zwischen den Gehegen hinter den Rand gelangt
  1: { key: 'tree', originY: 82 / 96, solid: true },
  2: { key: 'pine', originY: 100 / 112, solid: true },
  3: { key: 'dry_bush', originY: 33 / 40, solid: true },
  4: { key: 'bush', originY: 33 / 40, solid: true }, // niedrige Füller rechts neben den Gehegen, damit man hineinsieht
  5: { key: 'dark_bush', originY: 36 / 44, solid: true },
  6: { key: 'bamboo', originY: 118 / 128, solid: true }, // Bambus als Füller (Asien)
  // Erdhöhle im Fuchsbau
  U: { key: 'den', originY: 44 / 56, solid: true, hitbox: 16 },
  // Erdmännchenbau (Savanne, sandfarben)
  u: { key: 'den_sand', originY: 44 / 56, solid: true, hitbox: 16 },
  // begehbare Hütte: Wände wie Zäune (Bild je Stil, siehe addFence). Einrichtung passend zum Gebiet
  // (styled: Bild <key>_<Stil der Hütte>): Schreibtisch, Stuhl, Zimmerpflanze und Wandregal mit den Werkzeugen
  M: { key: 'hutwall_x', originY: 60 / 80, solid: true, fence: { kind: 'hut', axis: 'x' } },
  N: { key: 'hutwall_y', originY: 60 / 80, solid: true, fence: { kind: 'hut', axis: 'y' } },
  p: { key: 'hut_desk', styled: true, originY: 44 / 64, solid: true, hitbox: 14 },
  j: { key: 'hut_chair', styled: true, originY: 44 / 64, solid: true, hitbox: 8 },
  Ƀ: { key: 'hut_bed', styled: true, originY: 1, solid: true, bed: true }, // Bett: ausruhen, danach ist das Wetter eine Phase weiter (Savanne, Dschungel); Lage siehe BED_LOOK in GardenScene
  ɓ: { invisible: true, solid: true }, // zweite Kachel unter einem Bett (das Bett liegt über zwei Kacheln)
  a: { key: 'hut_plant', styled: true, originY: 60 / 80, solid: true, hitbox: 10 },
  // Regal an der Wand: nicht fest (die Wand dahinter hält auf), weiter hinten gezeichnet, damit man davor steht
  c: { key: 'hut_shelf', styled: true, originY: 80 / 96, solid: false, depthShift: -14, chest: true, peak: [0.79, 0.26] }, // peak: obere Mitte des Schranks im Bild (Pfeil im Mini-Tutorial, siehe tools/shelves.py)
  // kleine Werkzeug-Kiste (Teichinsel in Asien): steht neben der Bogenbrücke und wird vor deren Geländer gezeichnet
  e: { key: 'hut_chest_small', originY: 44 / 64, solid: true, hitbox: 10, chest: true, depthShift: 30 },
  // Haupthaus im Tierpark: großer Schreibtisch über drei Kacheln (Y in der Mitte, V daneben: unsichtbar, aber fest)
  // und Bürostuhl dahinter
  Y: { key: 'office_desk', originY: 72 / 96, solid: true, computer: true }, // Hauptrechner: hier startet man Events
  V: { invisible: true, solid: true },
  z: { key: 'office_chair', originY: 44 / 64, solid: true, hitbox: 8 },
  // Zimmerpflanzen (corner: rücken im Bild in die Ecke zwischen den Wänden) und Sitzecke: Sofa über zwei Kacheln
  // (d vorne, V dahinter), Couchtisch, Sessel und Teppich (floor: liegt flach auf dem Boden)
  Z: { key: 'office_plant_monstera', originY: 84 / 96, solid: true, hitbox: 8, corner: true },
  s: { key: 'office_plant_strelitzia', originY: 84 / 96, solid: true, hitbox: 8, corner: true },
  d: { key: 'office_sofa', originY: 68 / 80, solid: true },
  i: { key: 'office_table', originY: 52 / 60, solid: true, hitbox: 12 },
  x: { key: 'office_armchair', originY: 52 / 60, solid: true, hitbox: 12 },
  t: { key: 'office_rug', originY: 30 / 84, solid: false, floor: true },
  // Pandagehege: Reifenschaukel und Spielball
  7: { key: 'tire_swing', originY: 84 / 96, solid: true, hitbox: 10 },
  8: { key: 'toy_ball', originY: 26 / 32, solid: false },
  // Ausstattung ausgebauter Gehege: Unterstand mit Heu, Futterkrippe, Schilf (begehbar), Springbrunnen, Nistkasten
  '@': { key: 'hay_shelter', originY: 96 / 112, solid: true, hitbox: 14 },
  '&': { key: 'hay_rack', originY: 52 / 64, solid: true, hitbox: 10 },
  '%': { key: 'reeds', originY: 52 / 64, solid: false, sway: 6 },
  0: { key: 'fountain', originY: 64 / 80, solid: true, hitbox: 12 },
  // Baustelle vor dem Ausbau: Pflöcke mit Absperrband, Bretterstapel (begehbar, nur ein Hinweis)
  ':': { key: 'build_stakes', originY: 52 / 64, solid: false },
  '<': { key: 'build_planks', originY: 52 / 64, solid: false },
  $: { key: 'lion_rock', originY: 104 / 128, solid: false }, // großer Löwenfelsen (begehbar: man klettert drüber)
  '*': { key: 'nest_box', originY: 84 / 96, solid: true, hitbox: 6 },
  9: { key: 'climb_tree', originY: 84 / 96, solid: true, hitbox: 9 }, // Kletterbaum im Affengehege
  F: { key: 'feeder', originY: 52 / 64, solid: true, hitbox: 10, feeder: true }, // Futterautomat im Tierpark
  // Asien
  '+': { key: 'peacock_perch', originY: 84 / 96, solid: true, hitbox: 6 }, // hohe Sitzstange (Pfauengehege)
  // Aquarium: Fassade am Rand des Tierparks (großes Bild, ragt über den Kartenrand; die Kachelmitte ist die Tür)
  // ganz hinten (gleich über dem Boden): hinter der Fassade liegt nur der Kartenrand, alles auf der Karte steht davor
  '`': { key: 'aquarium_facade', originX: 760 / 1296, originY: 680 / 752, solid: false, noCull: true, depthFixed: -99000 },
  // Deko in den Wassertanks
  '(': { key: 'seaweed', originY: 100 / 112, solid: false },
  ')': { key: 'coral', originY: 52 / 64, solid: false },
  '?': { key: 'tank_rock', originY: 52 / 64, solid: false },
  '/': { key: 'shell', originY: 52 / 64, solid: false },
  '"': { key: 'tank_chest', originY: 52 / 64, solid: false },
  // Unterwasserwelt (Riff): Korallen, Riesentang, Seesterne, Anemonen, Felsen am Rand und der Sack am Anker (Werkzeuge)
  ü: { key: 'reef_branch', originY: 80 / 92, solid: true, hitbox: 8 },
  Ü: { key: 'reef_fan', originY: 88 / 100, solid: true, hitbox: 6 },
  ö: { key: 'reef_brain', originY: 50 / 64, solid: true, hitbox: 12 },
  ä: { key: 'reef_tube', originY: 60 / 72, solid: true, hitbox: 8 },
  // dieselben in anderen Farben: blaue Astkoralle, rote Fächerkoralle, rosa Hirnkoralle, gelbe Röhrenkoralle
  û: { key: 'reef_branch2', originY: 80 / 92, solid: true, hitbox: 8 },
  Û: { key: 'reef_fan2', originY: 88 / 100, solid: true, hitbox: 6 },
  ô: { key: 'reef_brain2', originY: 50 / 64, solid: true, hitbox: 12 },
  â: { key: 'reef_tube2', originY: 60 / 72, solid: true, hitbox: 8 },
  ß: { key: 'reef_kelp', originY: 168 / 180, solid: true, hitbox: 4 },
  '§': { key: 'reef_starfish', originY: 36 / 48, solid: false, floor: true },
  '°': { key: 'reef_anemone', originY: 52 / 64, solid: false },
  Ö: { key: 'reef_rock', originY: 66 / 84, solid: true },
  // Aquarium-Halle: Quallen-Lampe, Delfin-Statue auf dem Sockel, Bank
  Ł: { key: 'aq_lamp', originY: 104 / 112, solid: true, hitbox: 4 },
  Ś: { key: 'aq_statue', originY: 112 / 128, solid: true, hitbox: 18 },
  Ɓ: { key: 'aq_bench', originY: 48 / 64, solid: true, hitbox: 10 },
  Ä: { key: 'anchor_sack', originY: 64 / 80, solid: true, hitbox: 10, chest: true, chestName: tr('Sack', 'bag') },
  H: { key: 'hammock', originY: 76 / 88, solid: true, hitbox: 10 }, // Hängematte mit Blätternest (Orang-Utan-Gehege)
  Q: { key: 'bamboo', originY: 118 / 128, solid: true, hitbox: 10 },
  q: { key: 'tall_grass', originY: 40 / 48, solid: false }, // hohes Gras: man geht hindurch (Versteck)
  J: { key: 'jungle_tree', originY: 150 / 160, solid: true, hitbox: 14 },
  K: { key: 'cherry_tree', originY: 82 / 96, solid: true, hitbox: 10 },
  O: { key: 'sun_rock', originY: 40 / 48, solid: true, hitbox: 20 },
  l: { key: 'stone_lantern', originY: 58 / 64, solid: true, hitbox: 8 },
  I: { key: 'torii', originY: 100 / 128, solid: false }, // rotes Tor über dem Weg
  // Hochebene im Bambuswald: Stange der Gebetsfahnen (die Leinen: PrayerFlags.js), Steinhaufen (dort legt man den
  // Salzstein für die Yaks ab), großer verschneiter Felsen (Liegeplatz des Schneeleoparden), kleine Stupa
  Ƨ: { key: 'prayer_pole', originY: 60 / 64, solid: true, hitbox: 4 },
  Ƈ: { key: 'snow_cairn', originY: 49 / 56, solid: true, hitbox: 12 },
  Ɵ: { key: 'snow_lionrock', originY: 104 / 128, solid: true, hitbox: 30 },
  Ṗ: { key: 'snow_pine', originY: 100 / 112, solid: true, hitbox: 12 }, // verschneite Tanne (Taiga in der Eiswelt; Platzhalter aus tools/ice-placeholders2.py)
  Ʃ: { key: 'stupa', originY: 72 / 80, solid: true, hitbox: 14 },
  // verschneite Felsen (aus Felsen anderer Gebiete, tools/snow-rocks.py): große Felsgruppe, Felsen in mehreren Formen,
  // Geröll (begehbar), Steinstapel
  Ȟ: { key: 'snow_kopje', originY: 82 / 96, solid: true, hitbox: 24 },
  Ȓ: { key: 'snow_rocks0', variants: ['snow_rocks0', 'snow_rocks1', 'snow_pair', 'snow_spire'], originY: 49 / 56, solid: true, hitbox: 14 },
  ȓ: { key: 'snow_rubble', originY: 49 / 56, solid: false },
  Ȩ: { key: 'snow_stack', originY: 84 / 96, solid: true },
  // Bogenbrücken: B entlang ty, E entlang tx; gezeichnet werden sie am Stück (siehe drawBridges in GardenScene)
  B: { solid: false, bridge: 'y' },
  E: { solid: false, bridge: 'x' },
  // umgestürzter Baumstamm als Brücke (Wald): Ƭ entlang ty, ƫ entlang tx; flach, ohne Geländer
  Ƭ: { solid: false, bridge: 'y', log: true },
  ƫ: { solid: false, bridge: 'x', log: true },
  ř: { key: 'forest_river_rock', originY: 40 / 52, solid: true }, // Felsen im Fluss (darunter fließt Wasser, Schaum: ForestLife.js)
  // alter, knorriger Baum, der halb aus dem Moorwasser ragt (darunter Wasser); zwei Formen: mit wenig Laub und kahl
  ǒ: { key: 'forest_bogtree', variants: ['forest_bogtree', 'forest_bogtree2'], originY: 104 / 128, solid: true, hitbox: 12 },
  // Dschungel: Bootssteg (liegt flach über dem Wasser, begehbar), Dickicht (fest, bis man es mit der Machete wegschlägt;
  // es wächst wieder nach, siehe Thicket.js und thicketBlock), Felsklippe und Wasserfall (oben links in der Ecke)
  Ŝ: { key: 'jungle_dock', originY: 0.5, solid: false, floor: true },
  Ď: { key: 'thicket', originY: 52 / 64, solid: false, thicket: true },
  Ŕ: { key: 'cliff', originY: 84 / 96, solid: true },
  Ŵ: { key: 'waterfall', originY: 150 / 160, solid: true, waterfall: true },
  Ṁ: { key: 'mangrove', originY: 100 / 112, solid: true, hitbox: 12 }, // Mangrove am Ufer (Stelzwurzeln)
  ľ: { key: 'jungle_plant', originY: 40 / 48, solid: false }, // großblättrige Bodenpflanze (begehbar)
  Ǫ: { key: 'jungle_shrub', originY: 116 / 128, solid: true, hitbox: 18 }, // großer Strauch mit riesigen Blättern (Tropenhalle)
  ǫ: { key: 'fruit_plate', originY: 56 / 64, solid: true, hitbox: 6 }, // Obstteller auf einem Pfosten (Tropenhalle im Tierpark: dort sitzen die Schmetterlinge)
  ẅ: { key: 'spider_web', originY: 58 / 64, solid: false }, // Spinnennetz zwischen zwei Zweigen (Vogelspinnen-Terrarium)
  // große Blumen (später fliegen Kolibris zu ihnen): Helikonie und Hibiskus
  Ḣ: { key: 'heliconia', originY: 88 / 96, solid: true, hitbox: 6, bigFlower: true },
  ḟ: { key: 'hibiscus', originY: 64 / 72, solid: true, hitbox: 8, bigFlower: true },
  // Eiswelt: Eisfelsen und Eisblock
  ê: { key: 'ice_rock', originY: 18 / 24, solid: true, hitbox: 12 },
  Ê: { key: 'ice_block', originY: 46 / 56, solid: true, hitbox: 18 },
  // Wiese: Trauerweide, Feldpflanzen, bunte Blumen, Pusteblumen (pusten beim Durchlaufen, siehe MeadowLife.js),
  // Bienenkorb, Vogelhäuschen, Dorfbrunnen, Bank, Holzstapel, Briefkasten, Wäscheleine, Heuballen, Windmühle (ihre
  // Flügel zeichnet MeadowLife.js; die Kacheln ringsum sind V)
  Ẇ: { key: 'willow', originY: 100 / 112, solid: true, hitbox: 10 },
  ŝ: { key: 'sunflowers', originY: 72 / 84, solid: false, sway: 7 },
  ĉ: { key: 'corn', originY: 72 / 84, solid: false, sway: 6 },
  ṗ: { key: 'pumpkins', originY: 24 / 32, solid: false },
  ķ: { key: 'cabbages', originY: 24 / 32, solid: false },
  ẋ: { key: 'scarecrow', originY: 80 / 88, solid: true, hitbox: 6 },
  ḇ: { key: 'flowers_blue', originY: 22 / 32, solid: false, sway: 4 },
  ṕ: { key: 'flowers_purple', originY: 22 / 32, solid: false, sway: 4 },
  ẃ: { key: 'flowers_white', originY: 22 / 32, solid: false, sway: 4 },
  ḋ: { key: 'dandelion', originY: 24 / 32, solid: false, sway: 5, dandelion: true },
  ƅ: { key: 'beehive', originY: 42 / 48, solid: true, hitbox: 8 },
  ḅ: { key: 'birdhouse', originY: 58 / 64, solid: true, hitbox: 5 },
  ẘ: { key: 'meadow_well', originY: 72 / 88, solid: true, hitbox: 16 },
  ƃ: { key: 'meadow_bench', originY: 38 / 48, solid: true, hitbox: 10 },
  ŧ: { key: 'woodpile', originY: 40 / 48, solid: true, hitbox: 14 },
  ṁ: { key: 'mailbox', originY: 44 / 48, solid: true, hitbox: 5 },
  ŵ: { key: 'clothesline', originY: 58 / 80, solid: true, hitbox: 6 },
  ĥ: { key: 'hay_bale', originY: 34 / 40, solid: true, hitbox: 14 },
  Ẁ: { key: 'windmill', originY: 184 / 200, solid: true, windmill: true },
  // Wald: bemooste Felsen, Stümpfe und Stämme, mittelgroße Sträucher, Waldblumen, Höhle (die Kacheln ringsum sind V),
  // Hochstand (stand: man steigt mit der Aktionstaste hinauf, siehe GardenScene)
  Ɍ: { key: 'forest_boulder', variants: ['forest_boulder', 'forest_boulder2'], originY: 47 / 56, solid: true, hitbox: 18 },
  Ț: { key: 'forest_stump', originY: 34 / 40, solid: true, hitbox: 11 },
  Ŀ: { key: 'forest_mossy_log', originY: 38 / 48, solid: true, hitbox: 14 },
  ḩ: { key: 'forest_elder', originY: 56 / 64, solid: true, hitbox: 6, sway: 2 },
  ḫ: { key: 'forest_hazel', originY: 56 / 64, solid: true, hitbox: 6, sway: 2 },
  ḃ: { key: 'forest_bluebells', originY: 25 / 32, solid: false, sway: 5 },
  ƒ: { key: 'forest_foxglove', originY: 41 / 48, solid: false, sway: 6 },
  ȁ: { key: 'forest_anemones', originY: 25 / 32, solid: false, sway: 4 },
  ṽ: { key: 'forest_violets', originY: 25 / 32, solid: false, sway: 4 },
  Ĉ: { key: 'forest_cave', originY: 140 / 160, solid: true },
  Ħ: { key: 'forest_stand', originY: 158 / 176, solid: true, stand: true },
  // Biber am Fluss: angenagter Baum (dort sitzen sie und nagen, siehe Beaver.js) und Biberburg
  ƀ: { key: 'forest_gnawed_tree', originY: 74 / 80, solid: true, hitbox: 6, sway: 2 },
  Ƅ: { key: 'forest_beaver_lodge', originY: 46 / 56, solid: true, hitbox: 22 },
  // Moor (Süden des Walds): Birke, Wollgras (Schilf: %, Steg über den Tümpeln: Ŝ mit eigenem Bild, siehe levels.js);
  // Eichenhain: große Eiche, Laubhaufen (Versteck der Igel), Pilzkreis (Platzhalter: tools/moor-oak-placeholders.py)
  Ɋ: { key: 'forest_birch', originY: 92 / 104, solid: true, hitbox: 8, sway: 2 },
  ẉ: { key: 'forest_cottongrass', originY: 25 / 32, solid: false, sway: 5 },
  Ø: { key: 'forest_oak', originY: 116 / 128, solid: true, hitbox: 16, sway: 0.6 }, // wackelt beim Eichelnschütteln (shakeOak)
  ɫ: { key: 'forest_leafpile', originY: 40 / 48, solid: true, hitbox: 10, sway: 3 }, // raschelt, wenn ein Igel darin sitzt (Hedgehog.js)
  ọ: { key: 'forest_toadstools', originY: 22 / 40, solid: false },
  ʬ: { key: 'wallow', originY: 0.5, solid: false, floor: true }, // Schlammloch im Gehege: dort suhlen sich die Wildschweine (Boar.js)
  // Savanne: hohes Gras, Busch, Felsgruppe, Termitenhügel, Elefantenfriedhof (Bilder je Wetterphase: objectKeys in levels.js)
  ƚ: { key: 'savanna_tallgrass', originY: 48 / 56, solid: false, sway: 6 },
  Ƙ: { key: 'savanna_bush', originY: 40 / 48, solid: true, hitbox: 5, sway: 2 },
  Ʀ: { key: 'savanna_kopje', originY: 82 / 96, solid: true, hitbox: 24 },
  Ţ: { key: 'savanna_termite', originY: 64 / 72, solid: true, hitbox: 9 },
  Ș: { key: 'savanna_skull', originY: 57 / 64, solid: true, hitbox: 14 },
  ƭ: { key: 'savanna_pelvis', originY: 46 / 52, solid: true, hitbox: 10 },
  Ʊ: { key: 'savanna_bones', originY: 35 / 40, solid: false },
  Ʋ: { key: 'savanna_rock0', variants: ['savanna_rock0', 'savanna_rock1', 'savanna_rock2', 'savanna_rock3', 'savanna_rock4'], originY: 49 / 56, solid: true, hitbox: 14 }, // Felsen in mehreren Formen
  Ʈ: { key: 'savanna_ribs', originY: 57 / 64, solid: true, hitbox: 14 },
  // hoher Wildzaun (Savanne), Bild 80 Pixel hoch
  '[': { key: 'tall_x', originY: 60 / 80, solid: true, fence: { kind: 'tall', axis: 'x' } },
  ']': { key: 'tall_y', originY: 60 / 80, solid: true, fence: { kind: 'tall', axis: 'y' } },
  // dieselben Zäune über einem Bach (darunter Wasser, siehe GROUND): ȸ Wildzaun, ȹ Holzzaun, beide entlang tx
  ȸ: { key: 'tall_x', originY: 60 / 80, solid: true, fence: { kind: 'tall', axis: 'x' } },
  ȹ: { key: 'fence_x', originY: 44 / 64, solid: true, fence: { kind: 'wood', axis: 'x' } },
};
// Spielzeug und Deko ausgebauter Gehege (ⓐ …, siehe src/world/toys.js)
for (const [id, t] of Object.entries(TOYS)) OBJECTS[t.char] = { key: t.key ?? toyKey(id), originY: t.originY, solid: t.solid, hitbox: t.hitbox, toy: id };
// selbst gesetzte Deko im Tierpark (❶ …, siehe src/world/decor.js)
// (große Deko über 2×2 Kacheln: unsichtbar, ihr Bild zeichnet die Szene in der Mitte der Grundfläche; die übrigen Kacheln: V)
for (const [id, d] of Object.entries(DECOR)) OBJECTS[d.char] = { key: d.key, originY: d.originY, solid: d.solid, hitbox: d.hitbox, sway: d.sway, floor: d.floor, decor: id, invisible: !!d.size };

export let LEVEL_ID;
export let LEVEL;
export let MAP_W;
export let MAP_H;
export let START;
// Gehege: { id, name, area (Innenfläche), species (erlaubte Tierarten, null = alle), gates, sign (Schild-Kachel) }
export let ENCLOSURES;
export let TOOL_SPOTS;
export let EXITS;
export let GATE_TILES; // { tx, ty, vertical }: vertical = Tor in einem Zaun entlang ty
export let FISHPOND_TILES;
export let FISH_SPOTS; // Stellen, an denen wilde Fische auftauchen
export let KOI_WATER; // Wasser des wilden Koi-Teichs (alle Kacheln, nicht im Gehege)
export let NEAR_WATER; // freie Kacheln höchstens 2 Kacheln von einem wilden Teich entfernt (für Frösche)
export let HOT_SPRING_TILES; // heiße Quellen (dort baden die Japanmakaken)
export let HOT_SPRINGS; // dieselben, nach zusammenhängenden Quellen getrennt: [[{ tx, ty }, ...], ...]
export let NEAR_BAMBOO; // freie Kacheln höchstens 2 Kacheln von Bambus oder hohem Gras (für Pandas)
export let NEAR_PATH; // freie Kacheln höchstens 3 Kacheln neben einem Weg (Set "tx,ty"): dort laufen freilaufende Tiere (Pfauen)
export let NEAR_PATH_TILES; // dieselben als Liste (zum Verteilen)
export let JUNGLE_TREES; // Urwaldbäume (nicht am Kartenrand, Krone nicht verdeckt): dort sitzen die Orang-Utans oben in der Krone
export let TIGER_ZONE; // Bambus und hohes Gras im Bambuswald (nicht am Kartenrand): dort streift der Tiger als Schemen
export let NEAR_TREES; // freie Kacheln höchstens 2 Kacheln von einem Baum entfernt (für Giraffen)
export let SHORE_TILES; // Uferplätze an wilden Teichen zum Trinken: { tx, ty, water: { tx, ty } } (für Zebras)
export let PEN_SHORE_TILES; // dasselbe an den Teichen in Gehegen (Zebras im Gehege)
// Grundfläche des Autos (Schnellreise): Strecke vom Vorderrad links unten bis zum Anhänger rechts oben (Welt-Pixel)
export let CAR_BODY = null;
export let CAR_BODIES = []; // alle Autos des Levels (das erste ist CAR_BODY; dazu LEVEL.extraCars)
const CAR_HALF_WIDTH = 10; // so weit neben dieser Strecke ist es noch fest (mal Größe des Autos; dazu kommen die Füße der Figur)
export let BRIDGES; // Bogenbrücken: { axis: 'x' | 'y', at: feste Spalte bzw. Zeile, from, to: erste und letzte Kachel }
export let SQUIRREL_TREES; // Bäume, auf denen Eichhörnchen wohnen können: { tx, ty, ground: { tx, ty } }
let ROWS;

const tilesWith = (ch) => ROWS.flatMap((row, ty) => [...row].flatMap((c, tx) => (c === ch ? [{ tx, ty }] : [])));

// Biom eines Gebiets: Expeditions-Camp und -Maps gehören zu ihrer Welt (Tiere, Gehege, seltene Varianten, Ladepakete)
export const biomeOf = (id = LEVEL_ID) => LEVELS[id]?.expedition ?? id;

export function setLevel(id) {
  LEVEL_ID = id;
  // Wetterphase (Savanne, Dschungel): die Angaben der Phase ersetzen die normalen (Tiere, Boden, Geräusch ...), siehe season.js
  const base = LEVELS[id];
  const season = base.seasons ? currentSeason(id) : 'normal';
  LEVEL = base.seasons?.[season] ? { ...base, ...base.seasons[season], season } : { ...base, season: base.seasons ? firstSeason(id) : 'normal' };
  // Expeditions-Map: Wetter und Tierliste wurden für diesen Besuch gewürfelt (siehe planMap in expedition.js); das Wetter
  // ändert nur Aussehen und Geräusche (looks), nicht das Gelände
  if (base.expedition && !base.camp) {
    // hinter einem Durchgang der großen Map (sideMaps.js): Wetter und Tiere wie dort
    const side = sideHere(id);
    const r = game.expedition?.map === id ? game.expedition : null;
    const weather = side?.season ?? r?.season ?? 'normal';
    LEVEL = { ...base, ...(base.looks?.[weather] ?? {}), season: weather, home: r?.home ?? {} };
    if (side) LEVEL = { ...LEVEL, ...sideOverrides(base, side) };
    if (weather !== 'dry') delete LEVEL.gatherAt; // am letzten Wasserloch drängen sich die Tiere nur in der Trockenzeit
  }
  ROWS = LEVEL.rows;
  // ... und ihre Kartenstücke (größere Teiche im Regen, Schlamm in der Trockenzeit): { tx, ty, rows }
  for (const u of LEVEL.mapPatches ?? []) {
    ROWS = ROWS.map((row, y) => {
      const patch = u.rows[y - u.ty];
      return patch === undefined ? row : row.slice(0, u.tx) + patch + row.slice(u.tx + patch.length);
    });
  }
  // freigeschaltete Teile (z. B. das Flamingo-Gehege) über die Karte legen: { id, tx, ty, rows }
  for (const u of LEVEL.unlocks ?? []) {
    if (!game.unlocked.includes(u.id)) continue;
    ROWS = ROWS.map((row, y) => {
      const patch = u.rows[y - u.ty];
      return patch === undefined ? row : row.slice(0, u.tx) + patch + row.slice(u.tx + patch.length);
    });
  }
  // Kartenstücke, die nur unter einer Bedingung dazukommen (when(game)), z. B. der fünfte Käfig im Expeditions-Camp
  for (const u of LEVEL.runPatches ?? []) {
    if (!u.when(game)) continue;
    ROWS = ROWS.map((row, y) => {
      const patch = u.rows[y - u.ty];
      return patch === undefined ? row : row.slice(0, u.tx) + patch + row.slice(u.tx + patch.length);
    });
  }
  // Bauplätze für Buden: leer stehen dort Baupflöcke, eine gebaute Bude ist fest (ihr Bild zeichnet GardenScene)
  const put = (tx, ty, c) => (ROWS = ROWS.map((row, y) => (y === ty ? row.slice(0, tx) + c + row.slice(tx + 1) : row)));
  const shown = slotsShown();
  // aufgestellte Buden: fest; passt ihr Platz nicht mehr (Umbau), kommen sie in die Bauen-Leiste (Buden von den früheren
  // Bauplätzen stehen, wo sie immer standen)
  for (const s of slotsIn(id)) {
    const tiles = boothTiles(s);
    if (s.legacy || tiles.every((t) => ROWS[t.ty]?.[t.tx] === '.')) tiles.forEach((t) => put(t.tx, t.ty, 'V'));
    else game.booths[s.id] = { level: id, stored: true };
  }
  // Riesenrad: Wiese freiräumen; gebaut sind die 2×2 Kacheln fest, sonst Baupflöcke
  const w = LEVEL.wheelSlot;
  if (w && (game.builds?.[w.id] || shown)) {
    for (let ty = w.clear.ty0; ty <= w.clear.ty1; ty++) for (let tx = w.clear.tx0; tx <= w.clear.tx1; tx++) put(tx, ty, '.');
    if (game.builds?.[w.id]) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(w.tx + dx, w.ty + dy, 'V');
    else put(w.tx, w.ty, ':');
  }
  // Gehege vor dem Ausbau: Innenzaun bzw. ohne die Ausstattung, die erst der Ausbau bringt (basic in levels.js).
  // Baustellen-Hinweise (Pflöcke, Bretter) stehen nur im Abschnitt, der erst mit dem Ausbau dazukommt – nicht dort,
  // wo die Tiere schon laufen. Gehege ohne neuen Abschnitt bekommen keine.
  for (const e of LEVEL.enclosures ?? []) {
    if (!e.basic || isUpgraded(e)) continue;
    const full = ROWS.map((r) => [...r]);
    const rows = ROWS.map((r) => [...r]);
    for (const [tx, ty, c] of e.basic) rows[ty][tx] = c === ':' || c === '<' ? '.' : c;
    if (e.seed && !e.pond && !e.free) {
      const before = floodRows(rows, e.seed);
      const after = floodRows(full, e.seed);
      if (before && after) {
        const fenced = new Set(e.basic.filter(([, , c]) => OBJECTS[c]?.fence).map(([tx, ty]) => tx + ',' + ty));
        const extra = [...after].map((k) => k.split(',').map(Number)).map(([tx, ty]) => ({ tx, ty })).filter(({ tx, ty }) => !before.has(tx + ',' + ty) && !fenced.has(tx + ',' + ty) && rows[ty][tx] === '.');
        if (extra.length) {
          const cx = extra.reduce((sum, t) => sum + t.tx, 0) / extra.length;
          const cy = extra.reduce((sum, t) => sum + t.ty, 0) / extra.length;
          extra.sort((p, q) => Math.hypot(p.tx - cx, p.ty - cy) - Math.hypot(q.tx - cx, q.ty - cy));
          rows[extra[0].ty][extra[0].tx] = ':';
          const second = extra.find((t) => Math.abs(t.tx - extra[0].tx) + Math.abs(t.ty - extra[0].ty) >= 2);
          if (second) rows[second.ty][second.tx] = '<';
        }
      }
    }
    ROWS = rows.map((r) => r.join(''));
  }
  // ausgebaute Gehege: Spielzeug und Deko auf freie Kacheln im Gehege (noch nicht gebaute Gehege ausgenommen)
  DECOR_RETURNED = 0;
  for (const e of LEVEL.enclosures ?? []) {
    if (!PEN_TOYS[e.id] || !isUpgraded(e) || !e.seed || e.free || e.pond) continue;
    if (e.unlock && !game.unlocked.includes(e.unlock)) continue;
    // toysAt: feste Plätze (z. B. im Wildpark auf der Lichtung, sonst landen sie in einer abgelegenen Ecke)
    if (e.toysAt) {
      const rows = ROWS.map((r) => [...r]);
      PEN_TOYS[e.id].forEach((id, i) => {
        const at = e.toysAt[i];
        if (at) rows[at.ty][at.tx] = TOYS[id].char;
      });
      ROWS = rows.map((r) => r.join(''));
    } else if (designablePen(e)) {
      // gestaltbares Gehege: Spielzeug dort, wo es gespeichert ist (man kann es umstellen); beim ersten Mal wie bisher
      // verteilt und gemerkt. Passt ein Platz nicht mehr (Umbau), kommt das Spielzeug in die Deko-Taste
      ensureDecor(); // (neues Spiel: die Deko-Daten gibt es erst ab hier)
      const saved = game.decor.toys[e.id];
      if (saved) {
        game.decor.toys[e.id] = saved.filter((t) => {
          const ok = !!TOYS[t.id] && ROWS[t.ty]?.[t.tx] === '.';
          if (ok) ROWS[t.ty] = ROWS[t.ty].slice(0, t.tx) + TOYS[t.id].char + ROWS[t.ty].slice(t.tx + 1);
          else returnToy(t);
          return ok;
        });
      } else {
        const out = [];
        ROWS = placeToys(ROWS, e.seed, PEN_TOYS[e.id], out, !!e.moat);
        game.decor.toys[e.id] = out;
      }
    } else ROWS = placeToys(ROWS, e.seed, PEN_TOYS[e.id], null, !!e.moat);
  }
  // selbst gesetzte Deko (nur Tierpark): nur auf Rasen; was dort nicht mehr passt (z. B. nach einem Umbau), wandert zurück
  // in die Deko-Taste (DECOR_RETURNED zählt mit, die Szene zeigt einen Hinweis)
  if (game.decor?.placed?.[id]?.length) {
    game.decor.placed[id] = game.decor.placed[id].filter((d) => {
      const tiles = DECOR[d.id] ? decorTiles(d) : [];
      const ok = tiles.length > 0 && tiles.every((t) => ROWS[t.ty]?.[t.tx] === '.' && !reservedAt(t.tx, t.ty));
      if (ok) tiles.forEach((t, i) => (ROWS[t.ty] = ROWS[t.ty].slice(0, t.tx) + (i ? 'V' : DECOR[d.id].char) + ROWS[t.ty].slice(t.tx + 1)));
      else returnDecor(d);
      return ok;
    });
  }
  MAP_W = Math.max(...ROWS.map((r) => r.length));
  MAP_H = ROWS.length;
  START = LEVEL.start;
  TOOL_SPOTS = LEVEL.toolSpots;
  EXITS = LEVEL.exits;
  // Mittellinie der Grundfläche (Auto und Anhänger): von vorne links nach hinten rechts, mitten zwischen Vorder- und Hinterkante;
  // größere Autos haben eine längere Grundfläche
  const body = (car) => {
    const c = tileToWorld(car.tx, car.ty);
    const k = car.scale ?? 1;
    return { ax: c.x - 38 * k, ay: c.y - 15 * k, bx: c.x + 42 * k, by: c.y - 33 * k, hw: CAR_HALF_WIDTH * k };
  };
  CAR_BODIES = LEVEL.car ? [LEVEL.car, ...(LEVEL.extraCars ?? [])].map(body) : [];
  CAR_BODY = CAR_BODIES[0] ?? null;
  const beyondGate = (tx, ty, dy) => {
    while (charAt(tx, ty) === 'G') ty += dy;
    return charAt(tx, ty);
  };
  const isFence = (c) => !!OBJECTS[c]?.fence;
  GATE_TILES = tilesWith('G').map((t) => {
    const up = beyondGate(t.tx, t.ty - 1, -1);
    const down = beyondGate(t.tx, t.ty + 1, 1);
    let vertical = '|!;}]N'.includes(up) || '|!;}]N'.includes(down);
    // Zaun (auch ein Eckstück) über oder unter dem Tor, links und rechts aber keiner: das Tor sitzt in einer senkrechten
    // Zaunlinie (z. B. bei runden Gehegen, wo neben dem Tor gleich die Ecke kommt)
    const left = charAt(t.tx - 1, t.ty);
    const right = charAt(t.tx + 1, t.ty);
    if (!vertical && (isFence(up) || isFence(down)) && !isFence(left) && !isFence(right) && left !== 'G' && right !== 'G') vertical = true;
    return { ...t, vertical };
  });
  // Ältere Level haben noch ein einziges Gehege (pen) für alle Tiere
  const all = LEVEL.enclosures ?? (LEVEL.pen ? [{ id: 'pen', name: tr('Gehege', 'Enclosure'), area: LEVEL.pen, species: null }] : []);
  const list = all.filter((e) => (!e.unlock || game.unlocked.includes(e.unlock)) && (!e.when || e.when(game))); // noch nicht gebaute Gehege fehlen
  const claimed = new Set();
  ENCLOSURES = list.map((e) => {
    // Kacheln der Innenfläche: entweder ein Rechteck (area) oder alles, was vom Startpunkt (seed) aus erreichbar ist,
    // ohne über Zaun, Wand oder Tor zu gehen. So sind auch L-Formen und unregelmäßige Gehege möglich.
    // free: freilaufende Tiere (z. B. Pfauen) – ein "Gehege" ohne Fläche, Zaun und Schild, nur zum Zählen
    // pond: Teich ohne Zaun (Koi) – das Gehege ist das zusammenhängende Wasser samt Brücke ab dem Startpunkt
    // shore (Teich ohne Zaun): dazu das Ufer so viele Kacheln breit, ohne Wege (dort hüpfen z. B. die Frösche)
    let tiles = e.free ? [] : e.pond ? floodChars(e.seed, 'oE') : e.seed ? floodPen(e.seed, !!e.moat) : rectTiles(e.area);
    if (e.pond && e.shore) tiles = withShore(tiles, e.shore);
    // jede Kachel gehört nur einem Gehege: das zuerst genannte behält sie (z. B. der Teich auf der Lichtung im Wildpark,
    // dessen Fläche sonst auch zum Wildpark zählen würde)
    tiles = tiles.filter(({ tx, ty }) => !claimed.has(tx + ',' + ty));
    const tileSet = new Set(tiles.map(({ tx, ty }) => tx + ',' + ty));
    for (const k of tileSet) claimed.add(k);
    const a = e.area ?? (e.free ? { tx0: 0, tx1: 0, ty0: 0, ty1: 0 } : {
      tx0: Math.min(...tiles.map((t) => t.tx)),
      tx1: Math.max(...tiles.map((t) => t.tx)),
      ty0: Math.min(...tiles.map((t) => t.ty)),
      ty1: Math.max(...tiles.map((t) => t.ty)),
    });
    // Tore liegen im Zaun direkt neben der Innenfläche
    // (gateTiles: nur diese, z. B. das große Tor des Wildparks, nicht die Tore der Gehege darin)
    const gates = GATE_TILES.filter(({ tx, ty }) =>
      e.gateTiles ? e.gateTiles.some((g) => g.tx === tx && g.ty === ty) : [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => tileSet.has(tx + dx + ',' + (ty + dy))),
    );
    // Schild hängt am Zaunstück direkt vor dem ersten Torflügel (signSide: 'right' = hinter dem letzten)
    const right = e.signSide === 'right';
    const g = right ? gates[gates.length - 1] : gates[0];
    const d = right ? 1 : -1;
    // ohne Tor (Teich ohne Zaun): eigener Platz fürs Schild (signAt, auf einem Pfosten)
    const sign = e.noSign ? null : e.signAt ?? (e.species && g ? (g.vertical ? { tx: g.tx, ty: g.ty + d } : { tx: g.tx + d, ty: g.ty }) : null);
    return { ...e, area: a, tiles, tileSet, gates, sign };
  });
  // Deko in einem Gehege, das keine Deko erlaubt (z. B. ein später freigeschaltetes Gehege): zurück in die Deko-Taste
  if (game.decor?.placed?.[id]?.length) {
    game.decor.placed[id] = game.decor.placed[id].filter((d) => {
      const pens = decorTiles(d).map((t) => anyPenAt(t.tx, t.ty));
      if (pens.every((pen) => !pen || pen.decor || (designablePen(pen) && DECOR[d.id]?.pen))) return true;
      decorTiles(d).forEach((t) => setTileChar(t.tx, t.ty, '.'));
      returnDecor(d);
      return false;
    });
  }
  FISHPOND_TILES = tilesWith('o');
  // Wasser in den wilden Teichen direkt am begehbaren Ufer, damit man sie mit dem Kescher erreicht
  KOI_WATER = tilesWith('~').filter(({ tx, ty }) => !inPen(tx, ty));
  // (Trockenzeit in der Savanne: im Schlamm des ausgetrockneten Wasserlochs, fishIn in levels.js)
  FISH_SPOTS = tilesWith(LEVEL.fishIn ?? '~').filter(({ tx, ty }) =>
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !isBlocked(tx + dx, ty + dy)),
  );
  NEAR_WATER = freeTilesNear('~');
  NEAR_TREES = freeTilesNear('ATPD');
  NEAR_BAMBOO = freeTilesNear('Qq');
  NEAR_PATH_TILES = [];
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      if (isBlocked(tx, ty) || inPen(tx, ty) || isGate(tx, ty) || buildingAt(tx, ty, 1) || EXITS.some((e) => Math.abs(e.tx - tx) + Math.abs(e.ty - ty) < 3)) continue;
      let near = false;
      for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3 && !near; dx++) near = '#I'.includes(charAt(tx + dx, ty + dy)) && !buildingAt(tx + dx, ty + dy);
      if (near) NEAR_PATH_TILES.push({ tx, ty });
    }
  }
  NEAR_PATH = new Set(NEAR_PATH_TILES.map(({ tx, ty }) => tx + ',' + ty));
  const crownTrees = tilesWith('J').filter(({ tx, ty }) => tx > 0 && ty > 0 && tx < MAP_W - 1 && ty < MAP_H - 1 && !inPen(tx, ty));
  // (gibt es kaum Bäume mit ganz freier Krone, reicht es, wenn kein anderer Urwaldbaum davorsteht)
  const clear = crownTrees.filter(({ tx, ty }) => !crownHidden(tx, ty, true));
  JUNGLE_TREES = clear.length >= 3 ? clear : crownTrees.filter(({ tx, ty }) => !crownHidden(tx, ty));
  TIGER_ZONE = ['Q', 'q']
    .flatMap(tilesWith)
    .filter(({ tx, ty }) => tx > 0 && ty > 0 && tx < MAP_W - 1 && ty < MAP_H - 1 && !inPen(tx, ty))
    .filter(({ tx, ty }) => [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].some(([dx, dy]) => charAt(tx + dx, ty + dy) === 'Q')); // nur, wo Bambus wächst
  HOT_SPRING_TILES = tilesWith('h');
  HOT_SPRINGS = [];
  const seen = new Set();
  for (const t of HOT_SPRING_TILES) {
    if (seen.has(t.tx + ',' + t.ty)) continue;
    const group = [];
    const todo = [t];
    seen.add(t.tx + ',' + t.ty);
    while (todo.length) {
      const c = todo.pop();
      group.push(c);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = c.tx + dx + ',' + (c.ty + dy);
        if (!seen.has(k) && charAt(c.tx + dx, c.ty + dy) === 'h') {
          seen.add(k);
          todo.push({ tx: c.tx + dx, ty: c.ty + dy });
        }
      }
    }
    HOT_SPRINGS.push(group);
  }
  // Brücken: zusammenhängende Kacheln derselben Brückenart in einer Linie
  BRIDGES = [];
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const c = charAt(tx, ty);
      const axis = OBJECTS[c]?.bridge;
      const log = !!OBJECTS[c]?.log;
      if (axis === 'y' && charAt(tx, ty - 1) !== c) {
        let end = ty;
        while (charAt(tx, end + 1) === c) end++;
        BRIDGES.push({ axis: 'y', at: tx, from: ty, to: end, log });
      }
      if (axis === 'x' && charAt(tx - 1, ty) !== c) {
        let end = tx;
        while (charAt(end + 1, ty) === c) end++;
        BRIDGES.push({ axis: 'x', at: ty, from: tx, to: end, log });
      }
    }
  }
  SHORE_TILES = [];
  PEN_SHORE_TILES = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (isBlocked(tx, ty) || exitAt(tx, ty)) continue;
      const pen = inPen(tx, ty);
      const w = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => charAt(tx + dx, ty + dy) === (pen ? 'w' : '~'));
      if (w) (pen ? PEN_SHORE_TILES : SHORE_TILES).push({ tx, ty, water: { tx: tx + w[0], ty: ty + w[1] } });
    }
  }
  // Bäume im Inneren mit einem freien Platz davor (bevorzugt vorne, damit man das Eichhörnchen sieht)
  SQUIRREL_TREES = [...tilesWith('P'), ...tilesWith('D'), ...tilesWith('T')].flatMap(({ tx, ty }) => {
    if (tx < 2 || ty < 2 || tx > MAP_W - 3 || ty > MAP_H - 3) return [];
    const free = [[1, 0], [0, 1], [-1, 0], [0, -1]]
      .map(([dx, dy]) => ({ tx: tx + dx, ty: ty + dy }))
      .find((t) => !isBlocked(t.tx, t.ty) && !inPen(t.tx, t.ty) && !exitAt(t.tx, t.ty));
    return free ? [{ tx, ty, ground: free }] : [];
  });
}

// Freie Kacheln im Inneren (nicht im Gehege, kein Übergang), höchstens 2 Kacheln von einem der Zeichen entfernt
function freeTilesNear(chars) {
  const tiles = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (isBlocked(tx, ty) || inPen(tx, ty) || exitAt(tx, ty)) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) near = chars.includes(charAt(tx + dx, ty + dy));
      if (near) tiles.push({ tx, ty });
    }
  }
  return tiles;
}

// Deko: zurück in die Deko-Taste (beim Aufbau der Karte, wenn sie nicht mehr passt)
export let DECOR_RETURNED = 0;
function returnDecor(d) {
  if (DECOR[d.id]) giveDecor(d.id);
  DECOR_RETURNED++;
}
function returnToy(t) {
  if (TOYS[t.id]) giveDecor('toy:' + t.id);
  DECOR_RETURNED++;
}

// Fläche eines Geheges, das erst später entsteht (unlocks, noch nicht freigeschaltet): dort darf keine Deko stehen.
// Reserviert ist das Rechteck um alle Kacheln, die sich beim Freischalten ändern (das Kartenstück selbst reicht oft über
// Wege und Rasen, die bleiben, wie sie sind)
const unlockBoxes = new WeakMap();
function unlockBox(u) {
  if (unlockBoxes.has(u)) return unlockBoxes.get(u);
  let box = null;
  u.rows.forEach((r, dy) => [...r].forEach((c, dx) => {
    const tx = u.tx + dx;
    const ty = u.ty + dy;
    if (c === charAt(tx, ty) || charAt(tx, ty) === ' ') return;
    box = box
      ? { tx0: Math.min(box.tx0, tx), tx1: Math.max(box.tx1, tx), ty0: Math.min(box.ty0, ty), ty1: Math.max(box.ty1, ty) }
      : { tx0: tx, tx1: tx, ty0: ty, ty1: ty };
  }));
  unlockBoxes.set(u, box);
  return box;
}
const openUnlocks = () => (LEVEL.unlocks ?? []).filter((u) => !game.unlocked.includes(u.id)).map(unlockBox).filter(Boolean);
export function reservedAt(tx, ty) {
  return openUnlocks().some((b) => tx >= b.tx0 && tx <= b.tx1 && ty >= b.ty0 && ty <= b.ty1);
}
// alle Kacheln dieser Flächen (zum Einfärben im Setzen-Modus)
export function reservedTiles() {
  const out = [];
  for (const b of openUnlocks()) for (let ty = b.ty0; ty <= b.ty1; ty++) for (let tx = b.tx0; tx <= b.tx1; tx++) if (charAt(tx, ty) !== ' ') out.push({ tx, ty });
  return out;
}

// Gehege an dieser Kachel, auch offene Bereiche (Wildpark, Safari, Streichelzoo), die enclosureAt nicht zählt
export function anyPenAt(tx, ty) {
  const key = tx + ',' + ty;
  return ENCLOSURES.find((e) => e.tileSet.has(key)) ?? null;
}

// Deko live setzen bzw. wegnehmen (ohne die Karte neu aufzubauen): das Zeichen der Kachel tauschen
export function setTileChar(tx, ty, c) {
  if (!ROWS[ty] || tx < 0 || tx >= ROWS[ty].length) return;
  ROWS[ty] = ROWS[ty].slice(0, tx) + c + ROWS[ty].slice(tx + 1);
}
export { decorByChar };

export function charAt(tx, ty) {
  return ROWS[ty]?.[tx] ?? '.';
}

// Gehegeausbau: ist das Gehege ausgebaut? Wie viele Tiere passen hinein (ohne Babys)?
// Der Gehegeausbau ist vorerst abgeschaltet (PEN_UPGRADES): alle Gehege gelten von Anfang an als ausgebaut (mehr Plätze,
// Ausstattung, Spielzeug), am Computer und am Gehegeschild gibt es keinen Ausbau. Die frei setzbare Deko soll ihn
// ersetzen (docs/plan-deko.md). Die Angaben dazu (slots/quota vorher, basic, upgrade) bleiben in levels.js stehen.
export const PEN_UPGRADES = false;
export function isUpgraded(e) {
  return !PEN_UPGRADES || !!game.penLevel[e.id];
}

// Spielzeug in ein Gehege stellen (rows: Kartenzeilen, seed: eine Kachel im Gehege, list: Spielzeug-Namen). Nur auf Gras
// (.), dessen Nachbarn alle im Gehege liegen (nicht am Zaun oder Tor), das erste möglichst mittig, jedes weitere mit
// möglichst viel Abstand zu den anderen. Gibt die neuen Zeilen zurück.
// out: dort landen die Plätze { id, tx, ty } (gestaltbare Gehege merken sie sich)
// moat: Wasser und Brücken begrenzen das Gehege (Insel)
function placeToys(rows, seed, list, out = null, moat = false) {
  const grid = rows.map((r) => [...r]);
  const inside = new Set([seed.tx + ',' + seed.ty]);
  const todo = [seed];
  while (todo.length && inside.size < 4000) {
    const t = todo.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tx = t.tx + dx;
      const ty = t.ty + dy;
      const c = grid[ty]?.[tx];
      if (inside.has(tx + ',' + ty) || c === undefined || c === ' ' || c === 'G' || OBJECTS[c]?.fence) continue;
      if (moat && (GROUND[c] === 'fishpond' || OBJECTS[c]?.bridge)) continue;
      inside.add(tx + ',' + ty);
      todo.push({ tx, ty });
    }
  }
  const tiles = [...inside].map((k) => k.split(',').map(Number));
  const cx = tiles.reduce((s, [tx]) => s + tx, 0) / tiles.length;
  const cy = tiles.reduce((s, [, ty]) => s + ty, 0) / tiles.length;
  // lieber nicht am Zaun (alle Nachbarn im Gehege); ist innen kein Platz mehr, auch dort (kleine Gehege wie das Katzenhaus)
  const grass = tiles.filter(([tx, ty]) => grid[ty][tx] === '.');
  const inner = (tx, ty) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!inside.has(tx + dx + ',' + (ty + dy))) return false;
    return true;
  };
  const picked = [];
  for (const id of list) {
    let best = null;
    let bestScore = -Infinity;
    for (const [tx, ty] of grass) {
      if (picked.some(([px, py]) => Math.max(Math.abs(px - tx), Math.abs(py - ty)) <= 1)) continue; // eine Kachel Abstand
      const mid = Math.hypot(tx - cx, ty - cy);
      const apart = picked.length ? Math.min(...picked.map(([px, py]) => Math.hypot(px - tx, py - ty))) : 0;
      const score = (inner(tx, ty) ? 1000 : 0) + apart - mid * (picked.length ? 0.5 : 1) + (tx * 7 + ty * 13) % 5 * 0.01; // fest, aber nicht immer dieselbe Seite
      if (score > bestScore) {
        bestScore = score;
        best = [tx, ty];
      }
    }
    if (!best) break;
    picked.push(best);
    grid[best[1]][best[0]] = TOYS[id].char;
    out?.push({ id, tx: best[0], ty: best[1] });
  }
  return grid.map((r) => r.join(''));
}
// Tierarten, die sich ein Kontingent teilen
const QUOTA_OF = {}; // Tierart → Art, deren Plätze sie mitbenutzt (bisher keine)
export const quotaKey = (species) => QUOTA_OF[species] ?? species;
// Kontingente eines Geheges: in gemeinsamen Gehegen je Tierart eigene Plätze (quota: { Art: [vorher, ausgebaut] }),
// sonst alle zusammen (slots, key null). i: 0 vor, 1 nach dem Ausbau (Standard: wie es gerade ist)
export function penQuotas(e, i = isUpgraded(e) ? 1 : 0) {
  if (e.quota) return Object.entries(e.quota).map(([key, n]) => ({ key, cap: n[i] }));
  return e.slots ? [{ key: null, cap: e.slots[i] }] : [];
}
export function hasSlots(e) {
  return !!(e.slots || e.quota);
}
export function penCapacity(e, i) {
  const q = penQuotas(e, i);
  return q.length ? q.reduce((s, x) => s + x.cap, 0) : Infinity;
}
// Kosten des nächsten Ausbaus: der erste 40 Herzen, jeder weitere 10 mehr
export function upgradeCost() {
  return 40 + 10 * game.upgrades;
}

// Das Gehege, zu dessen Innenfläche diese Kachel gehört (oder null). Offene Bereiche (open, z. B. der Wildpark: Rehe
// und Elche laufen dort frei) zählen nicht als Gehege: Besucher, Deko, E-Roller usw. behandeln sie wie den übrigen Park.
export function enclosureAt(tx, ty) {
  const key = tx + ',' + ty;
  return ENCLOSURES.find((e) => !e.open && e.tileSet.has(key)) ?? null;
}

// Zuhause der Tiere an dieser Kachel: wie enclosureAt, aber samt offener Bereiche (dort bleiben ihre Tiere drin)
export function homeAt(tx, ty) {
  const key = tx + ',' + ty;
  return ENCLOSURES.find((e) => e.tileSet.has(key)) ?? null;
}

function rectTiles(a) {
  const tiles = [];
  for (let ty = a.ty0; ty <= a.ty1; ty++) for (let tx = a.tx0; tx <= a.tx1; tx++) tiles.push({ tx, ty });
  return tiles;
}

// alle Kacheln, die man vom Startpunkt aus erreicht, ohne Zaun, Wand oder Tor zu überqueren
// Innenfläche eines Geheges in einem Zeilen-Raster (wie floodPen): Set "tx,ty", oder null, wenn es nicht geschlossen ist
function floodRows(rows, seed) {
  const seen = new Set([seed.tx + ',' + seed.ty]);
  const todo = [seed];
  while (todo.length) {
    const t = todo.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { tx: t.tx + dx, ty: t.ty + dy };
      const key = n.tx + ',' + n.ty;
      const c = rows[n.ty]?.[n.tx];
      if (seen.has(key) || c === undefined || c === ' ' || c === 'G' || OBJECTS[c]?.fence) continue;
      seen.add(key);
      todo.push(n);
      if (seen.size > 600) return null;
    }
  }
  return seen;
}

// zusammenhängende Kacheln aus diesen Zeichen ab seed (z. B. das Wasser eines Teichs ohne Zaun)
// Teich samt Ufer: alle Kacheln bis zu n Schritte vom Wasser, ohne Wege, Zäune und Tore
function withShore(water, n) {
  const seen = new Set(water.map(({ tx, ty }) => tx + ',' + ty));
  const tiles = [...water];
  let ring = water;
  for (let i = 0; i < n; i++) {
    const next = [];
    for (const t of ring) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const m = { tx: t.tx + dx, ty: t.ty + dy };
        const key = m.tx + ',' + m.ty;
        const c = charAt(m.tx, m.ty);
        if (seen.has(key) || c === undefined || c === ' ' || PATH_CHARS.includes(c) || OBJECTS[c]?.fence || OBJECTS[c]?.bridge) continue;
        seen.add(key);
        next.push(m);
      }
    }
    tiles.push(...next);
    ring = next;
  }
  return tiles;
}

function floodChars(seed, chars) {
  const seen = new Set([seed.tx + ',' + seed.ty]);
  const tiles = [];
  const todo = [seed];
  while (todo.length) {
    const t = todo.pop();
    tiles.push(t);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { tx: t.tx + dx, ty: t.ty + dy };
      const key = n.tx + ',' + n.ty;
      if (seen.has(key) || !chars.includes(charAt(n.tx, n.ty))) continue;
      seen.add(key);
      todo.push(n);
    }
  }
  return tiles;
}

// Steht ein Urwaldbaum so davor (etwas weiter unten auf dem Bildschirm, fast genau darunter), dass seine Krone die Krone
// dieses Baums verdeckt? Dann sähe man einen Orang-Utan darin nicht. strict: auch direkt benachbarte Bäume und andere hohe
// Dinge (Bambus, Eichen, Kiefern …) zählen – auf den kleinen Maps stehen Bäume und Bambushaine zufällig verstreut, oft dicht
// beieinander. CROWN_COVER: bis zu welcher Summe dx + dy ein Objekt davor die Krone (gut 100 Pixel hoch) noch verdeckt
const CROWN_COVER = { J: 7, Q: 3, Ø: 3, A: 3, Ǎ: 3, Ʋ: 3, P: 2, D: 2, ǒ: 2, Ħ: 3 };
function crownHidden(tx, ty, strict = false) {
  for (let dx = -1; dx <= 7; dx++) for (let dy = -1; dy <= 7; dy++) {
    const sum = dx + dy;
    if (sum < (strict ? 1 : 2) || Math.abs(dx - dy) > 1) continue;
    const c = charAt(tx + dx, ty + dy);
    if (c === 'J' && sum <= 7) return true;
    if (strict && sum <= (CROWN_COVER[c] ?? 0)) return true;
  }
  return false;
}

// moat: auch Wasser und Brücken begrenzen das Gehege (Insel im Teich, z. B. die Affeninsel)
function floodPen(seed, moat = false) {
  const seen = new Set([seed.tx + ',' + seed.ty]);
  const tiles = [];
  const todo = [seed];
  while (todo.length) {
    const t = todo.pop();
    tiles.push(t);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { tx: t.tx + dx, ty: t.ty + dy };
      const key = n.tx + ',' + n.ty;
      if (seen.has(key) || n.tx < 0 || n.ty < 0 || n.tx >= MAP_W || n.ty >= MAP_H) continue;
      const c = charAt(n.tx, n.ty);
      if (c === 'G' || OBJECTS[c]?.fence || (moat && (GROUND[c] === 'fishpond' || OBJECTS[c]?.bridge))) continue;
      seen.add(key);
      todo.push(n);
      if (tiles.length > 2000) throw new Error(`Gehege bei ${seed.tx},${seed.ty} ist nicht geschlossen`); // (die Safari hat rund 900 Kacheln)
    }
  }
  return tiles;
}

// Freilaufende Tiere (Gehege mit free): Kacheln nahe den Wegen (NEAR_PATH); mit within nur darin (Schmetterlinge der
// Tropenhalle), sonst nicht in der Tropenhalle (Pfauen im Bambuswald)
const inRect = (r, tx, ty) => !!r && tx >= r.tx0 && tx <= r.tx1 && ty >= r.ty0 && ty <= r.ty1;
export function inFreeArea(e, tx, ty) {
  if (!NEAR_PATH.has(tx + ',' + ty)) return false;
  return e?.within ? inRect(e.within, tx, ty) : !inRect(LEVEL.jungleHall, tx, ty);
}
export function freeAreaTiles(e) {
  return NEAR_PATH_TILES.filter(({ tx, ty }) => inFreeArea(e, tx, ty));
}
// Liegt die Kachel in der Tropenhalle (unter dem Glasdach, samt Wänden)?
export function inJungleHall(tx, ty) {
  return inRect(LEVEL.jungleHall, tx, ty);
}

// Liegt die Kachel in irgendeinem Gehege?
export function inPen(tx, ty) {
  return !!enclosureAt(tx, ty);
}

// Sperrfläche für wilde Tiere (LEVEL.noWild, z. B. die eingezäunten Felder auf der Wiese)
export function noWildAt(tx, ty) {
  return (LEVEL.noWild ?? []).some((z) => tx >= z.tx0 && tx <= z.tx1 && ty >= z.ty0 && ty <= z.ty1);
}

// Kachel in einem Gehege oder direkt daneben (dort sollen keine wilden Tiere erscheinen)
export function nearEnclosure(tx, ty) {
  if (inHut(tx, ty, 1)) return true; // auch an und in der Hütte erscheinen keine wilden Tiere
  for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) if (enclosureAt(tx - dx, ty - dy)) return true;
  return false;
}

// Begehbare Gebäude des Levels: die Hütte und weitere (z. B. das Katzenhäuschen im Tierpark)
export function buildings() {
  return [LEVEL.hut, ...(LEVEL.buildings ?? [])].filter(Boolean);
}

// Das Gebäude, in dem diese Kachel liegt (samt Wänden), mit margin Kacheln Rand drumherum
export function buildingAt(tx, ty, margin = 0) {
  return buildings().find((h) => tx >= h.tx0 - margin && tx <= h.tx1 + margin && ty >= h.ty0 - margin && ty <= h.ty1 + margin) ?? null;
}

// Terrarium auf einem Sockel (Gebäude mit raise, z. B. die Vogelspinnen im Reptilienhaus): so viel höher liegt sein Inneres
// (Boden, Pflanzen, Tiere) an dieser Kachel, sonst 0
export function raiseAt(tx, ty) {
  const h = buildingAt(tx, ty);
  return h?.raise && tx > h.tx0 && tx < h.tx1 && ty > h.ty0 && ty < h.ty1 ? h.raise : 0;
}

// Vordere Wandkacheln eines Terrariums auf einem Sockel: dort liegt zwischen dem erhöhten Boden und der Wand noch ein
// Streifen Boden auf Sockelhöhe (sonst sieht man dort den Boden davor durchscheinen, z. B. Rasen in der Tropenhalle).
// Gibt { raise, key } zurück oder null
export function raisedEdgeFloor(tx, ty) {
  const h = buildingAt(tx, ty);
  if (!h?.raise) return null;
  const front = (ty === h.ty1 && tx > h.tx0 && tx <= h.tx1) || (tx === h.tx1 && ty > h.ty0 && ty <= h.ty1);
  return front ? { raise: h.raise, key: HUT_FLOOR[h.style] ?? 'planks' } : null;
}

// Liegt die Kachel in der Hütte bzw. einem Gebäude (samt Wänden)?
export function inHut(tx, ty, margin = 0) {
  return !!buildingAt(tx, ty, margin);
}

// Darf diese Tierart in dieses Gehege?
export function accepts(enclosure, species) {
  return !enclosure.species || enclosure.species.includes(species);
}

export function isGate(tx, ty) {
  return charAt(tx, ty) === 'G';
}

export function isFishpond(tx, ty) {
  return charAt(tx, ty) === 'o';
}

export function exitAt(tx, ty) {
  return EXITS.find((e) => e.tx === tx && e.ty === ty) ?? null;
}

// Kachel des Wegnetzes (für die Besucher): Weg des Gebiets oder einer Bodenzone, oder eine Brücke (nicht der Baumstamm)
export function isWalkway(tx, ty) {
  const g = groundAt(tx, ty);
  if (g === LEVEL.path || (g && g === groundZoneAt(tx, ty, true)?.path)) return true;
  const o = OBJECTS[charAt(tx, ty)];
  return !!(o?.bridge && !o.log);
}

export function groundAt(tx, ty) {
  const c = charAt(tx, ty);
  let house = buildingAt(tx, ty);
  // unter den Glaswänden eines Wassertanks bzw. eines Terrariums auf einem Sockel: Boden der Halle drumherum (der Sand
  // bzw. die Erde liegt nur innen)
  if ((house?.style === 'tank' || house?.raise) && (tx === house.tx0 || tx === house.tx1 || ty === house.ty0 || ty === house.ty1)) {
    house = buildings().find((b) => b !== house && tx >= b.tx0 && tx <= b.tx1 && ty >= b.ty0 && ty <= b.ty1) ?? house;
  }
  if (house?.pathFloor && PATH_CHARS.includes(c)) return house.pathFloor; // eigener Weg im Gebäude (Mosaik im Aquarium)
  if (house) return HUT_FLOOR[house.style] ?? 'planks'; // die ganze Hütte hat Holzboden, auch unter Wänden und Tür
  // Bodenzone mit eigenem Weg (z. B. Waldweg im Wildpark des Tierparks), sonst der Weg des Gebiets
  if (PATH_CHARS.includes(c)) return groundZoneAt(tx, ty, true)?.path ?? LEVEL.path;
  // ein Wegweiser mitten auf dem Weg (rundum Weg) steht auf Pflaster statt auf einer einzelnen Graskachel
  if (c === 'W' && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => PATH_CHARS.includes(charAt(tx + dx, ty + dy)))) return groundZoneAt(tx, ty, true)?.path ?? LEVEL.path;
  const g = GROUND[c];
  if (g && LEVEL.groundKeys?.[c]) return LEVEL.groundKeys[c]; // eigenes Bild des Gebiets (z. B. Schlamm der Suhle im Wald)
  // eigenes Teichwasser des Gehege, der Bodenzone bzw. des Gebiets (z. B. Koi-Teich mit Seerosen, Moorwasser), fest pro Kachel verteilt
  const water = enclosureAt(tx, ty)?.water ?? groundZoneAt(tx, ty, true)?.water ?? LEVEL.water;
  if (g === 'fishpond' && !water) return (tx + ty) % 2 ? 'fishpond0' : 'fishpond1';
  if ((g === 'water' || g === 'fishpond') && water) return water[(((tx * 73856093) ^ (ty * 19349663)) >>> 0) % water.length];
  if (g === 'sea_ice' && LEVEL.seaIce) return LEVEL.seaIce[(((tx * 73856093) ^ (ty * 19349663)) >>> 0) % LEVEL.seaIce.length]; // Varianten der Eisfläche
  if (g) return g;
  return grassAt(tx, ty);
}

// Gras in drei Varianten, fest pro Kachel verteilt
export function grassAt(tx, ty) {
  const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  const n = h % 10;
  // im Tierpark hat jedes Gehege und jeder Randstreifen den Boden seiner Welt; im Wald haben Moor und Eichenhain ihren eigenen
  const zone = groundZoneAt(tx, ty);
  const grass = enclosureAt(tx, ty)?.ground ?? zone?.ground ?? LEVEL.grass;
  // Flecken anderer Böden (Riff: Kies, Seegras, Algen ...): je Art eine weiche Fleckenkarte, fest pro Kachel
  for (const [i, p] of (LEVEL.patches ?? []).entries()) if (patchNoise(tx, ty, i) > 1 - p.amount) return p.ground;
  return grass[n < 6 ? 0 : n < 9 ? 1 : 2];
}

// Bodenzone an dieser Kachel (LEVEL.grounds: Rechteck area, Boden ground, optional Teichwasser water). soft: so viele
// Kacheln breit geht der Boden weich in den drumherum über (siehe zoneWeight und groundBlend.js); die Kachel selbst
// gehört zur Zone, wenn in ihrer Mitte mehr als die Hälfte Zonenboden liegt.
// hard: nur das Rechteck (für das Wasser, sonst wäre ein Tümpel am Rand gefleckt)
export function groundZoneAt(tx, ty, hard = false) {
  return LEVEL.grounds?.find((z) => {
    const a = z.area;
    if (!z.soft || hard) return tx >= a.tx0 && tx <= a.tx1 && ty >= a.ty0 && ty <= a.ty1;
    return zoneWeight(z, tx + 0.5, ty + 0.5) >= 0.5;
  });
}

// Anteil des Zonenbodens an einem Punkt (A, B in Kacheln, gebrochen): 1 tief in der Zone, 0 weit draußen; dazwischen
// ein weicher Übergang soft Kacheln breit um den Rand des Rechtecks, dessen Lage nach einer Fleckenkarte schwankt
// (Buchten statt gerader Linien)
export function zoneWeight(z, A, B) {
  const a = z.area;
  let d = Math.min(A - a.tx0, a.tx1 + 1 - A, B - a.ty0, a.ty1 + 1 - B); // Abstand zum Rand, innen positiv
  if (!z.soft) return d >= 0 ? 1 : 0;
  d += (patchNoise(A, B, 9) - 0.5) * z.soft * 1.3 + (patchNoise(A * 2.7, B * 2.7, 10) - 0.5) * z.soft * 0.4;
  const t = Math.max(0, Math.min(1, d / z.soft + 0.5));
  return t * t * (3 - 2 * t);
}

// weiches Rauschen zwischen 0 und 1 (Gitter alle 4 Kacheln, dazwischen weich überblendet); layer: eigene Karte je Fleckenart
function patchNoise(tx, ty, layer) {
  const at = (x, y) => (((x * 73856093) ^ (y * 19349663) ^ ((layer + 1) * 83492791)) >>> 0) % 1000 / 1000;
  const gx = tx / 4, gy = ty / 4;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
  const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
  return top * (1 - sy) + bottom * sy;
}

// Wasserecken, die nach außen ins Land ragen (beide angrenzenden Nachbarn sind kein Wasser derselben Art).
// Bitmaske der Rauten-Ecken: 1 oben, 2 rechts, 4 unten, 8 links. 0 heißt: nichts abrunden.
export const CORNER = { top: 1, right: 2, bottom: 4, left: 8 };
export function outerWaterCorners(tx, ty) {
  const c = charAt(tx, ty);
  if (!'~owh≈ɨ'.includes(c)) return 0;
  // unter der Brücke geht das Wasser weiter; Schlamm und das letzte Wasserloch darin gehen ineinander über (Trockenzeit)
  // Wasser rundet auch zum Schlamm hin ab (darunter liegt dann Schlamm, siehe cornerGroundAt), Schlamm nicht zum Wasser hin.
  // Zugefrorenes Meer (Eiswelt bei Nacht) rundet zum Schnee hin ab; zum offenen Wasser hin rundet das Eis selbst ab wie
  // ein Ufer (siehe outerLandCorners)
  const land = (x, y) => charAt(x, y) !== c && !(c === '~' && 'BEŜƬƫřǒ'.includes(charAt(x, y))) && !(c === '≈' && charAt(x, y) === '~') && !(c === 'ɨ' && charAt(x, y) === '~');
  // Nachbarn an den Kanten: oben links (tx-1), oben rechts (ty-1), unten rechts (tx+1), unten links (ty+1)
  const ul = land(tx - 1, ty), ur = land(tx, ty - 1), dr = land(tx + 1, ty), dl = land(tx, ty + 1);
  return (ul && ur ? CORNER.top : 0) | (ur && dr ? CORNER.right : 0) | (dr && dl ? CORNER.bottom : 0) | (dl && ul ? CORNER.left : 0);
}

// Ecken einer Landkachel, die ins Wasser ragen (beide Nachbarn an der Ecke und der schräge sind Wasser): nur in Gebieten
// mit roundShore (Dschungel, Eiswelt). Die Kachel wird dort abgerundet, darunter liegt Wasser (siehe GardenScene).
// In der Eiswelt bei Nacht zählt das zugefrorene Meer für den Schnee wie Wasser (darunter liegt dann Eis)
export function outerLandCorners(tx, ty) {
  if (!LEVEL.roundShore) return 0;
  const c = charAt(tx, ty);
  if (c === ' ' || '~owh≈BEŜƬƫřǒ'.includes(c)) return 0;
  const water = (x, y) => isShoreWater(c, charAt(x, y));
  const ul = water(tx - 1, ty), ur = water(tx, ty - 1), dr = water(tx + 1, ty), dl = water(tx, ty + 1);
  return (ul && ur && water(tx - 1, ty - 1) ? CORNER.top : 0) | (ur && dr && water(tx + 1, ty - 1) ? CORNER.right : 0)
    | (dr && dl && water(tx + 1, ty + 1) ? CORNER.bottom : 0) | (dl && ul && water(tx - 1, ty + 1) ? CORNER.left : 0);
}

// Unbefestigte Wege (Erde, Sand, Schnee): ihre Ecken werden zum Gras hin abgerundet, ebenso Grasecken, die in den Weg ragen.
// Gepflasterte Wege (Tierpark, Aquarium, Trittsteine im Bambuswald) bleiben eckig
const SOFT_PATHS = ['path', 'forest_path', 'savanna_path', 'jungle_path', 'snow_path', 'reef_path'];
const isSoftPath = (tx, ty) => charAt(tx, ty) !== ' ' && !buildingAt(tx, ty) && SOFT_PATHS.includes(groundAt(tx, ty));
// einfacher Boden (Gras, Schnee, Sand ...), kein Wasser, keine Hütte, kein Weg
const isPlainGround = (tx, ty) => {
  const c = charAt(tx, ty);
  return c !== undefined && c !== ' ' && !buildingAt(tx, ty) && !GROUND[c] && !PATH_CHARS.includes(c) && groundAt(tx, ty) === grassAt(tx, ty);
};
const EDGE = [[CORNER.top, [-1, 0], [0, -1], [-1, -1]], [CORNER.right, [0, -1], [1, 0], [1, -1]], [CORNER.bottom, [1, 0], [0, 1], [1, 1]], [CORNER.left, [0, 1], [-1, 0], [-1, 1]]];

// Ecken einer Wegkachel, die ins Gras ragen (beide Nachbarn an der Ecke sind einfacher Boden); darunter liegt Gras
export function pathOuterCorners(tx, ty) {
  if (!isSoftPath(tx, ty)) return 0;
  let mask = 0;
  for (const [bit, [ax, ay], [bx, by]] of EDGE) if (isPlainGround(tx + ax, ty + ay) && isPlainGround(tx + bx, ty + by)) mask |= bit;
  return mask;
}

// Ecken einer Graskachel, die in einen unbefestigten Weg ragen (beide Nachbarn und der schräge sind Weg): { mask, under }
export function grassPathCorners(tx, ty) {
  if (!isPlainGround(tx, ty)) return null;
  let mask = 0, under = null;
  for (const [bit, [ax, ay], [bx, by], [dx, dy]] of EDGE) {
    if (isSoftPath(tx + ax, ty + ay) && isSoftPath(tx + bx, ty + by) && isSoftPath(tx + dx, ty + dy)) {
      mask |= bit;
      under ??= groundAt(tx + ax, ty + ay);
    }
  }
  return mask ? { mask, under } : null;
}

// Liegt neben einer Landkachel (c) hier Wasser, zu dem hin sie abgerundet wird? (Eis nur zum offenen Wasser hin)
export function isShoreWater(c, n) {
  return n === '~' || n === 'ř' || n === 'ǒ' || (n === 'ɨ' && c !== 'ɨ'); // ř: Felsen im Fluss, ǒ: Moorbaum (darunter Wasser)
}

// Boden unter den abgerundeten Ecken einer Wasserkachel: Schlamm, wenn das Wasser im Schlammloch liegt (Trockenzeit),
// Eis am zugefrorenen Meer (Eiswelt bei Nacht), sonst Gras
export function cornerGroundAt(tx, ty) {
  if (charAt(tx, ty) === '~') {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if ('≈ɨ'.includes(charAt(tx + dx, ty + dy))) return groundAt(tx + dx, ty + dy);
  }
  return grassAt(tx, ty);
}

// Richtung eines Zaunstücks oder Tors an dieser Kachel ('x', 'y') oder null
export function fenceAxisAt(tx, ty) {
  const fence = objectAt(tx, ty)?.fence;
  if (fence) return fence.axis;
  const gate = GATE_TILES.find((g) => g.tx === tx && g.ty === ty);
  return gate ? (gate.vertical ? 'y' : 'x') : null;
}

// Liegt dieser Punkt im Wasser so nah an einer Brücke, dass die Brücke darüber gezeichnet werden muss? (Koi, die
// neben oder unter der Brücke auftauchen, sollen unter dem Brückendeck bleiben)
export function underBridge(x, y) {
  if (!BRIDGES?.length) return false;
  const a = x / (TILE_W / 2);
  const b = y / (TILE_H / 2);
  const txf = (a + b) / 2;
  const tyf = (b - a) / 2;
  return BRIDGES.some((br) => {
    const [along, cross] = br.axis === 'y' ? [tyf, txf] : [txf, tyf];
    return along >= br.from - 0.7 && along <= br.to + 0.7 && cross >= br.at - 1.6 && cross <= br.at + 1.2;
  });
}

// Höhe des Brückenbogens (Höchststand) je nach Länge der Brücke
export function bridgeArch(b) {
  if (b.log) return 6; // Baumstamm: man steigt nur kurz auf den Stamm
  return Math.min(14, 3 + (b.to - b.from + 1) * 2.5);
}

// So hoch steht man an dieser Stelle auf einer Bogenbrücke (0 = nicht auf einer Brücke)
export function bridgeLift(x, y) {
  if (!BRIDGES?.length) return 0;
  const a = x / (TILE_W / 2);
  const b = y / (TILE_H / 2);
  const txf = (a + b) / 2;
  const tyf = (b - a) / 2;
  for (const br of BRIDGES) {
    const [along, cross] = br.axis === 'y' ? [tyf, txf] : [txf, tyf];
    if (cross < br.at || cross >= br.at + 1 || along < br.from || along >= br.to + 1) continue;
    const t = (along - br.from) / (br.to + 1 - br.from);
    return Math.sin(Math.PI * t) * bridgeArch(br);
  }
  return 0;
}

export function objectAt(tx, ty) {
  return OBJECTS[charAt(tx, ty)] ?? null;
}

// Ist genau dieser Punkt fest? Wie isBlocked, aber Bäume und Büsche sind nur um den Stamm herum fest.
// wade: durch Wasser waten (Wasserbüffel beim Reittier-Event in Asien)
// trample: über kleine Büsche laufen (Elefant beim Reittier-Event in der Savanne; die Randbüsche bleiben fest)
const SMALL_BUSHES = 'vbk';
// zusätzliche Hindernisse eines Events (z. B. der Gnu-Strom bei der Großen Wanderung): at(x, y) gibt true, wo es fest ist
export const eventBlock = { at: null };
// Dickicht (Dschungel): at(tx, ty) gibt true, solange es an dieser Kachel dicht ist (die Szene setzt es, siehe Thicket.js);
// ohne Szene (beim Aufbau der Karte) ist alles Dickicht dicht
export const thicketBlock = { at: null };
// Eisschollen (Eiswelt): at(x, y) gibt true, wo gerade eine Scholle schwimmt (die Szene setzt es, siehe Floes.js)
export const floeFloor = { at: null };

// floe: auf Eisschollen laufen (nur Henrik)
export function isBlockedPoint(x, y, wade = false, trample = false, thicket = false, floe = false) {
  if (eventBlock.at?.(x, y)) return true;
  if (floe && floeFloor.at?.(x, y)) return false;
  if (CAR_BODIES.some((b) => nearSegment(x, y, b) < b.hw)) return true;
  const { tx, ty } = worldToTile(x, y);
  if (wade && charAt(tx, ty) === '~') return false;
  if (trample && SMALL_BUSHES.includes(charAt(tx, ty))) return false;
  if (thicket && charAt(tx, ty) === 'Ď') return false;
  const obj = objectAt(tx, ty);
  if (obj?.fence) return fenceBlocksPoint(x, y, tx, ty, obj.fence);
  const hitbox = obj?.hitbox;
  if (!hitbox) return isBlocked(tx, ty);
  const c = tileToWorld(tx, ty);
  return Math.hypot(x - c.x, (y - c.y) * 2) < hitbox; // Abstand in Kachel-Proportionen
}

// Zaun: fest ist nur ein Streifen entlang der gezeichneten Zaunlinie durch die Kachelmitte (FENCE_HALF Kachel zu jeder
// Seite), und nur die Hälften, die zu einem Nachbarzaun führen – wie addFence in GardenScene sie zeichnet. So ragt an
// Ecken nichts über den sichtbaren Zaun hinaus. Der Streifen (gut 14 Pixel) ist dicker als ein Schritt pro Bild, damit
// niemand hindurchschlüpft.
const FENCE_HALF = 0.25;

function fenceBlocksPoint(x, y, tx, ty, { kind, axis }) {
  const a = x / (TILE_W / 2);
  const b = y / (TILE_H / 2);
  const u = (a + b) / 2 - tx; // 0 … 1 entlang tx
  const v = (b - a) / 2 - ty; // 0 … 1 entlang ty
  const joins = (dx, dy, ax) => {
    const other = fenceAxisAt(tx + dx, ty + dy);
    return !!other && (axis === ax || other === ax || objectAt(tx + dx, ty + dy)?.fence?.kind === kind);
  };
  let xl = joins(-1, 0, 'x');
  let xr = joins(1, 0, 'x');
  let yu = joins(0, -1, 'y');
  let yd = joins(0, 1, 'y');
  if (!xl && !xr && !yu && !yd) {
    // einzelnes Stück: ganz entlang seiner Richtung
    if (axis === 'x') xl = xr = true;
    else yu = yd = true;
  }
  const nearV = Math.abs(v - 0.5) < FENCE_HALF;
  const nearU = Math.abs(u - 0.5) < FENCE_HALF;
  if (nearU && nearV) return true; // Pfosten in der Mitte
  if (nearV && ((xl && u < 0.5) || (xr && u > 0.5))) return true;
  if (nearU && ((yu && v < 0.5) || (yd && v > 0.5))) return true;
  return false;
}

// Abstand eines Punkts von der Strecke a–b
export function nearSegment(x, y, { ax, ay, bx, by }) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
}

// Nur Gelände sperrt (Kartenrand, Wasser, Hütte), keine Objekte wie Felsen, Büsche oder Bäume
export function isTerrainBlocked(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  return '~owHh '.includes(charAt(tx, ty));
}

// Urwaldbäume, an deren Fuß man herankommt (zu Fuß vom Start aus, Dickicht lässt sich freischlagen, mit Kanu auch übers
// Wasser): nur dort setzen sich Brüllaffen hin – sonst könnte man sie nie mit einer Banane herunterlocken.
// Einmal je Level berechnet (beim ersten Aufruf nach setLevel)
let reachCache = null;
const LURE_REACH = 55; // so nah (Welt-Pixel) muss man dem Fuß des Baums kommen (die Banane liegt vor einem)
export function reachableJungleTrees() {
  if (reachCache?.rows === ROWS) return reachCache.trees;
  const land = (tx, ty) => !isBlocked(tx, ty) || charAt(tx, ty) === 'Ď';
  const pass = (tx, ty) => land(tx, ty) || (!!LEVEL.boat && charAt(tx, ty) === '~');
  const s = { tx: Math.round(START?.tx ?? 0), ty: Math.round(START?.ty ?? 0) };
  const seen = new Set([s.tx + ',' + s.ty]);
  const todo = [s];
  const reached = [];
  while (todo.length) {
    const t = todo.pop();
    if (land(t.tx, t.ty)) reached.push(tileToWorld(t.tx, t.ty));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { tx: t.tx + dx, ty: t.ty + dy };
      const k = n.tx + ',' + n.ty;
      if (n.tx < 0 || n.ty < 0 || n.tx >= MAP_W || n.ty >= MAP_H || seen.has(k) || !pass(n.tx, n.ty)) continue;
      seen.add(k);
      todo.push(n);
    }
  }
  const trees = JUNGLE_TREES.filter((t) => {
    const f = tileToWorld(t.tx, t.ty);
    return reached.some((w) => Math.hypot(w.x - f.x, w.y - f.y) < LURE_REACH);
  });
  reachCache = { rows: ROWS, trees: trees.length ? trees : JUNGLE_TREES };
  return reachCache.trees;
}

export function isBlocked(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  const c = charAt(tx, ty);
  if ('~owHẑ '.includes(c)) return true; // Leerzeichen: außerhalb der Karte (nichts zu sehen, z. B. neben dem Tierpark)
  if (c === 'Ď') return thicketBlock.at ? thicketBlock.at(tx, ty) : true;
  return objectAt(tx, ty)?.solid ?? false;
}

// Kanu (Dschungel): fährt nur auf dem Fluss; Stege, Ufer und das Wasserflugzeug halten es auf
export function isBoatBlockedPoint(x, y) {
  if (CAR_BODIES.some((b) => nearSegment(x, y, b) < b.hw)) return true;
  const { tx, ty } = worldToTile(x, y);
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  return charAt(tx, ty) !== '~';
}

setLevel('park');
