// Die Level (Biome). Jede Zeile ist eine Reihe Kacheln (ty), jedes Zeichen eine Kachel (tx).
//
// Boden:   .  Gras     #  Weg     =  Acker     ~  Wasser
//          X  Übergang in ein anderes Level (siehe exits; nur noch zwischen den Abschnitten des Tierparks)
// Objekte:
//          T  Apfelbaum   b  Busch        r  Stein
//          f  rote Blumen g  gelbe Blumen
//          P  Tanne       D  dunkler Laubbaum   k  dichter Busch   L  umgestürzter Stamm
//          n  Farn        m  Pilze
//          A  Akazie      R  großer Felsbrocken   v  trockener Strauch   y  Grasbüschel (Deko)
//          -  Zaun (entlang tx)   |  Zaun (entlang ty)
//          _  Gitterwand (tx)     !  Gitterwand (ty)      ^  Netz (tx)   ;  Netz (ty)
//          {  Maschendraht (tx)   }  Maschendraht (ty)
//          [  Wildzaun (tx)       ]  Wildzaun (ty)        (hoher Zaun der Savanne)
//          U  Erdhöhle (Fuchsbau)   u  Erdmännchenbau
//          C  Kratzbaum   ,  Holzboden   w  Teich in einem Gehege (keine wilden Fische)
//          G  Tor zum Gehege (auf Weg, öffnet sich beim Durchgehen)
//          M  Hüttenwand (tx)  N  Hüttenwand (ty)  s  Schrank  p  Schreibtisch  c  Werkzeug-Kiste  e  kleine Kiste (siehe hut, chests)
//          Ƀ  Bett in der Hütte (ausruhen: das Wetter springt eine Phase weiter)   ɓ  zweite Kachel unter dem Bett
//          o  Fischteich (hierhin bringt man gefangene Fische)   S  Schild am Fischteich
//          W  Wegweiser
//          1  Laubbaum   2  Tanne   3  trockener Strauch   (dichte Füller im Gehege-Streifen hinter dem oberen Kartenrand)
//          Q  Bambus     q  hohes Gras (Versteck)   J  Dschungelbaum   K  Kirschbaum   O  Sonnenfelsen
//          l  Steinlaterne   I  rotes Tor (Torii) über dem Weg   h  heiße Quelle   B  Brücke über den Teich
//          4  Busch      5  dichter Busch   6  Bambus (Füller)   (niedrige Füller rechts neben den Gehegen, damit sie die Tiere nicht verdecken)
// Riff:   ü  Astkoralle   Ü  Fächerkoralle   ö  Hirnkoralle   ä  Röhrenkoralle   (û Û ô â: dieselben in anderen Farben)   ß  Riesentang   §  Seestern
//          °  Anemone mit Clownfisch   Ö  Riff-Felsen (Rand)   Ä  Werkzeug-Sack   /  Muschel   ?  Steine
// Aquarium: Ł  Quallen-Lampe   Ś  Delfin-Statue   Ɓ  Bank
// Eiswelt: ê  Eisfelsen   Ê  Eisblock   ɨ  zugefrorenes Meer (nachts, siehe freezeSea)
// Wiese:  Ẇ  Trauerweide   ŝ  Sonnenblumen   ĉ  Mais   ṗ  Kürbisse   ķ  Kohl   ẋ  Vogelscheuche (alle fünf auf dem Acker)
//          ḇ  blaue Blumen   ṕ  lila Blumen   ẃ  weiße Blumen   ḋ  Pusteblumen   ƅ  Bienenkorb   ḅ  Vogelhäuschen
//          ẘ  Dorfbrunnen   ƃ  Bank   ŧ  Holzstapel   ṁ  Briefkasten   ŵ  Wäscheleine   ĥ  Heuballen   Ẁ  Windmühle (V ringsum)
//          Ŝ  Steg (wie im Dschungel, Bild über objectKeys)
// Wald:   Ɍ  bemooster Felsbrocken   Ț  Baumstumpf   Ŀ  bemooster Stamm   ḩ  Holunder   ḫ  Haselstrauch
//          ḃ  Glockenblumen   ƒ  Fingerhut   ȁ  Buschwindröschen   ṽ  Veilchen   Ĉ  Höhle (V ringsum)   Ħ  Hochstand
//          Ŕ Ŵ  Felskante und Wasserfall wie im Dschungel (Bilder über objectKeys)
//          Ƭ ƫ  umgestürzter Baumstamm als Brücke über den Fluss (entlang ty bzw. tx)   ř  Felsen im Fluss (Schaum drumherum)
//          ƀ  angenagter Baum (Biber)   Ƅ  Biberburg
// Savanne: ƚ  hohes Gras   Ƙ  Busch   Ʀ  Felsgruppe   Ţ  Termitenhügel   Ʋ  Fels
//          Ș ƭ Ʈ Ʊ  Elefantenfriedhof (Schädel, Becken, Rippen, Beinknochen; dazu kahle Bäume Ǎ, dunkler Boden: gravePatch)
//          (hohes Gras, Busch und trockener Strauch sehen je Wetterphase anders aus, siehe objectKeys in savanna.seasons)

import { tr } from '../i18n.js';
import { EXPEDITION_LEVELS } from './expeditionMaps.js';

// Savanne in der normalen Phase; Starkregen und Trockenzeit leiten ihre Karten daraus ab (siehe savanna.seasons)
const SAVANNA_ROWS = [
  'AvvvvvvRvA.vvvvvRvAvvvvvvRƲǍƲƲƲƲƲƲRƲǍƲƲƲ',
  'R...................#..................Ʋ',
  'v.y.....v..y.....y..#....Ʋ......Ǎ....Ʋ.Ʋ',
  'v.....vŢ......y..y..#.........Ʊ........Ʋ',
  'v.........y..v..ƚƚ..#...ƚƚ..v....Ș..Ʊ..Ʋ',
  'v..............ƚƚƚv.#..ƚƚƚƚ............Ʋ',
  'v.v..........v......#.y........Ʈ...ƭ...Ǎ',
  'v.....~~.~~........y#........Ʋ.......Ǎ.R',
  'v....~~~~~~....y....#.............Ʋ....Ʋ',
  'A.....~~~~~~y.......#.Ƙ...v............Ʋ',
  'R..v.~~~~~~..y......#y.v.........Ƙ.....Ʋ',
  'v.......~~......Ry.y#......v..v..A...y.Ʋ',
  'v......y.....vy...y.#..Ʋ.....Ƙ.......Ţ.v',
  'v....y.....y........#..........Ʋ........',
  'v.v.......v..Ţ......#..................v',
  'v.v.......ƚƚ.....R..#............ƚƚ..y.A',
  'v.....Ʀ..ƚƚƚƚ....Ƙy.#.y.....Ţ...ƚƚƚƚ...R',
  'v.yv....AƲ.R........#...A........y.....v',
  'A...................#.............v.yA.v',
  'v##############################........v',
  'v..........#.MMMMM..#..................v',
  'v..........#.NɃ,aN..#...v..Ƙ..R....Ʀ...v',
  'v...y.y....#.Nɓ,,G###.....A...Ʋ..y.....v',
  'v...R......##MMMMM..#...............R..v',
  'v.......v..###.c....#...vv.A...y.......A',
  'v..........##....yy.#..................R',
  'v..y.......##.......#...............ƚƚ.v',
  'A....A.....~~....v..#..R...........yƚƚƚv',
  'R.........~~~~~.....#........~~~~~.A...v',
  'v.........~~~~~.....#.......~~~~~~..y..v',
  'v.........~~~~~.....#..v...~~~~~~~~.y..v',
  'v...R.....~~~~~.yRA.#........~~~~~.....v',
  'v..........~~~......#..A..y....~~......v',
  'v..........~~...y...#.Ƙ.............v..A',
  'v....A...........Ʋ..#....v...........Ʋ.R',
  'v........v...v....A......Ţ.v...........v',
  'A.......y...........y..y....y..ƚƚv.....v',
  'R.v.v...v......v.v......v....vƚƚƚƚ.....v',
  'v......................................v',
  'vvvvRvAvvvvvvRvAvvvvvvRvAvv.vvvRvAvvvvvv',
];

// Starkregen: die Wasserlöcher wachsen um rings Kacheln (nur über Gras und Büschel, nicht an Wege, Hütte, Auto und Start)
// (dry(x, y): diese Kacheln bleiben trocken)
function growWater(rows, rings, dry) {
  let g = rows.map((r) => [...r]);
  const at = (x, y) => g[y]?.[x];
  const nearPath = (x, y) => [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => '#XG'.includes(at(x + dx, y + dy) ?? '.')));
  for (let i = 0; i < rings; i++) {
    const next = g.map((r) => [...r]);
    for (let y = 2; y < g.length - 2; y++) {
      for (let x = 2; x < g[y].length - 2; x++) {
        if (!'.y'.includes(g[y][x]) || nearPath(x, y) || dry(x, y)) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) === '~')) next[y][x] = '~';
      }
    }
    g = next;
  }
  return g.map((r) => r.join(''));
}

// Trockenzeit: aus den Wasserlöchern wird Schlamm (≈), nur ein kleines letztes Wasserloch bleibt (keep: Mitte und Radius)
function dryUp(rows, keep) {
  return rows.map((r, y) => [...r].map((c, x) => (c === '~' && Math.hypot(x - keep.tx, y - keep.ty) > keep.r ? '≈' : c)).join(''));
}

// Eiswelt (46 x 64, siehe docs/plan-eiswelt.md; Startpunkt erzeugt mit tools/ice-map.py, danach von Hand): oben Meer mit
// zwei kleinen Inseln (Fähren über den Meeresarm), in der Mitte die Küste mit Forschungsstation und Schneemobil (offenes
// Meer rechts), rechts der Fjord vom Meer bis zum Gletscher (Bodenzone, Eisblöcke Ê an der Abbruchkante) mit Vogelfelsen
// (Ɵ, Ȟ) an den Ufern, unten die Tundra mit der Taiga (verschneite Tannen Ṗ) am Rand
const ICE_ROWS = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...~~~~~~~',
  '~~~~..........~~~~~~~~~~~~~~~~~~~~~......~~~~~',
  '~~~.............~~~~~~~~~~~~~~........ê...~~~~',
  '~~~Ɵ..ê...Ê.ê.ê.~~~~~~~~~~~~~~...Ê.ê.....Ɵ~~~~',
  '~~~.....e.......~~~~~~~~~~~~~~.ê.....e.ê..~~~~',
  '~~~~Ȟ.Ê......ê..~~~~~~~~~~~~~~...........Ȟ~~~~',
  '~~~~~....#.....~~~~~~~~~~~~~~~~.....#....~~~~~',
  '~~~~~....#...~~~~~~~~~~~~~~~~~~.....#.Ê..~~~~~',
  '~~~~~~...#...~~~~~~~~~~~~~~~~~~~~...#....~~~~~',
  '~~~~~~~..#..~~~~~~~~~~~~~~~~~~~~~~~~~...~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~Ɵ.Ȟ~.~#........~..~......~...~..~#..~..~~~~',
  '~~~......############################......~~~',
  '~~~.ê.ê............MMMMM#..............ê...~~~',
  '~~~................NɃ,,N#..................~~~',
  '~~~....Ê....Ê..ê...Nɓ,,G#...................~~~',
  '~~~................MMMMM#.................Ɵ~~~',
  '~~~..................c..#...............ê..~~~',
  '~~~.....................#....ê.............~~~',
  '~~~.....................#.Ê.........ê.....Ȟ~~~',
  '~~~.......###############..................~~~',
  '~~~..ê....#.........................ê......~~~',
  '~~~.......#..................ê.Ê...........~~~',
  '~~~.......#............Ê...Ɵ.....Ȟ.....Ɵ...~~~',
  'ÊȒ........#.............~~~~...~~~~~~...~~~~~~',
  'ÊÊ........#............Ê~~~~~~~~~~~~~~~~~~~~~~',
  'ÊÊ........#............Ê~~~~~~~~~~~~~~~~~Ɵ~~~~',
  'ÊÊ........#.............~~~~~~~Ɵ~~~~Ȟ~~~~~~~~~',
  'ȒȒ........#............Ê~~~~~~~~~~~~~~~~~~~~~~',
  'ÊÊ........#............Ê.~~~~~~~~...~~~~~~~~~~',
  'ê.........#.................Ȟ.......Ɵ....Ȟ....',
  'Ȓ.........#..................................Ȓ',
  'ȒȒ........#.....................#...........ṖÊ',
  'ÊȒ........#....ȓ.....Ȓ..........#.e.......ȓ..Ê',
  'Ȓ.....Ȓ...#.ȓ......Ɵ.........Ȓ..#............Ȓ',
  'Ṗ.........#.....................#.Ṗ.........ȒȒ',
  'ê.......Ȓ.#######################...........ṖȒ',
  'Ê...................................Ê.Ȓ.....ṖÊ',
  'êê...Ṗ........Ṗ.....ȓ........................Ṗ',
  'ȒȒ..........Ȓ.............Ȓ.....Ȓ.Ȓ......ȓ...ê',
  'Ȓ......Ṗ.......ȓ....Ȓ.......ȓ................Ê',
  'ê........ê......................ȓ.ê.....ȓ.ȓ..Ȓ',
  'ê....Ṗ.......Ṗ..Ȓ......ê..Ȓ...Ɵ.....ê.Ȓ.....ȒṖ',
  'Ṗ...........................................Êê',
  'ṖÊ.Ṗ......e..ȓ.Ṗ.............................Ṗ',
  'ṖÊ....Ṗ...................ê........ȓ..Ȓ......Ȓ',
  'Ê..........Ṗ..Ṗ.ȓ.............Ṗ..Ṗ......Ȓ.ê.ṖÊ',
  'ṖȒ..ê..................Ê.....................Ṗ',
  'êÊ....ȓ.......ȓ.............Ȓ...Ȓ.........ê.ȒṖ',
  'ÊṖ.........ȓ.....ȓ.......ȓ....ê......Ê.ȓ.....ê',
  'Ȓ.................................Ṗ......ê...Ê',
  'ê....ȓ..........Ȓ..Ṗ.........ȓ.ȓ.....Ṗ......ṖÊ',
  'Ȓ............................................Ȓ',
  'Ṗ...Ṗ......Ṗ.....Ṗ.ṖṖ...Ṗ..........Ṗ.Ṗ......ȒṖ',
  'Ê....Ṗ.Ṗ..ṖṖṖṖ..Ṗ.....ṖṖ.Ṗ.ṖṖ.......Ṗ.ṖṖ...Ṗ.Ṗ',
  'ȒṖ..ṖṖṖṖ.....Ṗ..ṖṖṖṖ..ṖṖṖ.ṖṖṖ.......ṖṖ.Ṗ.ṖṖ..Ṗ',
  'ṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖ...ṖṖṖṖṖṖṖṖṖṖṖṖ',
  'ṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖṖ.ṖṖṖṖṖṖṖṖṖṖṖṖṖ',
];

// Nacht in der Eiswelt: das Meer zwischen Festland und Inseln friert zu (man läuft hinüber); nur das offene Meer am
// Kartenrand (open Kacheln breit) und ein paar kleine Eislöcher (holes: [tx, ty] oben links, je 2 x 2 Kacheln) bleiben
// Wasser – an denen tummeln sich nachts die Pinguine. lanes: Streifen, die auch im offenen Meer am Rand zufrieren
// ({ tx0, tx1, ty0, ty1 }, z. B. der Weg von Insel B zum Durchgang oben)
function freezeSea(rows, open, holes, lanes = []) {
  const h = rows.length;
  const hole = (x, y) => holes.some(([hx, hy]) => x >= hx && x <= hx + 1 && y >= hy && y <= hy + 1);
  const lane = (x, y) => lanes.some((l) => x >= l.tx0 && x <= l.tx1 && y >= l.ty0 && y <= l.ty1);
  const inner = (x, y, w) => x >= open && y >= open && x < w - open && y < h - open;
  return rows.map((r, y) => [...r].map((c, x) => (c === '~' && (inner(x, y, r.length) || lane(x, y)) && !hole(x, y) ? 'ɨ' : c)).join(''));
}
// nachts zugefrorener Weg von Insel B (oben rechts) übers offene Meer zum Durchgang am oberen Rand
const ICE_SEA_LANE = { tx0: 36, tx1: 38, ty0: 0, ty1: 2 };
// Eislöcher: in den Meeresarmen und im Fjord, abseits der Fähr-Bahnen (dort geht man nachts hinüber); daneben bleiben immer
// mindestens zwei Kacheln Eis zum Vorbeigehen
const ICE_HOLES = [[22, 6], [14, 14], [27, 14], [26, 32], [38, 32]]; // zwischen den Inseln, in den Meeresarmen, im Fjord

export const LEVELS = {
  meadow: {
    name: tr('Wiese', 'Meadow'),
    // Schnellreise: Auto (Kachel, Bild, Größe) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 12.16, ty: 26.48, texture: 'car_zoo', frame: 0, scale: 1.26 },
    map: { x: 51.5, y: 34, icon: 'sheep' },
    rows: [
      'TTbbTTTTbbTTTTTTbTTTTTTTTbT~~TTbTTTTTbTT',
      'T..f................#......~~...|ŝŝŝŝŝŝT',
      'b.ḇḇ...........ẃ....#.ḇḇ..%~~...|ŝŝŝŝŝŝT',
      'b.......m.m..f..Tf..#.ṕ.g.%~~..ḋ|ŝŝŝŝŝŝT',
      'b..b.ṕ...T.m....ḇ.f.#ḅ.ẃ.ƅ.~~%..|ŝŝŝŝŝŝT',
      'T.....ṕ.m.m.b.......#...ƅḇ..~~..|ŝŝŝŝŝŝT',
      'T..ḅ.....m....ḋ.....#.ṕṕ..r.~~%.|ŝŝŝŝŝŝT',
      'b...................#...ẃ..%~~..|ŝŝŝŝŝŝT',
      'T.ḋ..........Ẇ......#.......~~..|ŝŝŝŝŝŝb',
      'T...%~~~~~~.....ṕ...#fg..ṕ.~~.r.-------b',
      'T.f.~~~~~~~~~.......#..ḇ..%~~.ḋ.....VVVb',
      'T.fr~~~~~~~~~%...f..#.ḋ....~~%......VẀVT',
      'T....~~~~~~..r..gẃ..#...ẃ..~~..T....VVVT',
      'T..Ẇ...%~~%...gf.fg.#.ḇḇ....~~%.-------T',
      'T.....%.~~%.f..bf...#....ṕ.%~~..|ĉĉĉĉĉĉT',
      'T...g...~~~~~~~.r...#.......~r.ḋ|ĉĉĉĉĉĉT',
      'b...ḋ..~~~~~Ŝ~~~%...#.fg....%~~.|ĉĉĉĉĉĉT',
      'T......f~~~~Ŝ~~~T..###..ẃḋ...~~%|ĉĉĉĉĉĉT',
      'T......%..ƃ...ƃ...##ẘ##.....%~~.-------b',
      'T############################EE########T',
      'T...------.#......#####.......~~%......T',
      'T...|ķķķķķ.#ŧMMMMM.###.........~~%...%.T',
      'b...|=====.#.Nap,N.ṁ#.....ṕg..%.~~~~~..T',
      'T...|ṗṗṗṗṗ.#.N,j,G###............~~~~~.T',
      'T...---....##MMMMM..#...T..ḇggg.%~~~~~.T',
      'T...b......###.c....#..........ƃ.~~~~~.T',
      'T..........##.......#.....gg....%~~~~~.T',
      'T..........##...ŵ...#......gf.r...~~~..T',
      'T.------...#...----.#............%....%b',
      'b.|ṗṗṗṗṗṗṗ.#.ķķķķķ|.#.........r........T',
      'Tg|=======.#.=====|.#...ḇḇ..........g..T',
      'T.|ṗṗṗẋṗṗṗ.#.ķķẋķķ|.#....ṕb.....g......T',
      'T.|=======.#.=====|.#..........g.......T',
      'T.|ṗṗṗṗṗṗṗ.#.ķķķķķ|.#.........g..T.ḋ...T',
      'T.---------#-------.#.......ẃẃ.........T',
      'b..................b#..f...............T',
      'b..ĥ....T..ẃ....ĥḋ..#..ḋ............ḅT.T',
      'T....ĥ...ḇḇ.ṕ.T.....#......fg.b........T',
      'T...ĥ...............#..................b',
      'TTbbTTTTTTbTTTTTbTTTTTbbbTTTTTbTTTbbbTTT',
    ],
    grass: ['grass0', 'grass1', 'grass2'],
    path: 'path',
    start: { tx: 20, ty: 20 },
    enclosures: [], // die Gehege sind im Tierpark
    // eingezäunte Felder (Sonnenblumen, Mais): dort sähe man die Tiere nicht – keine wilden Tiere, auch keine Schmetterlinge
    noWild: [{ tx0: 32, ty0: 1, tx1: 38, ty1: 9 }, { tx0: 32, ty0: 13, tx1: 38, ty1: 18 }],
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 13, ty0: 21, tx1: 17, ty1: 24, style: 'meadow' },
    chests: [
      { tx: 15, ty: 25, tools: ['net', 'lasso', 'rod'] }, // Angel: Fischschatten am Ufer (docs/plan-angeln.md)
    ],
    ambient: 'ambient_meadow', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [],
    exits: [], // in die anderen Gebiete und in den Tierpark nur mit dem Auto
    // Spawner: so viele wilde Tiere sind ungefähr gleichzeitig unterwegs; die Zahlen dahinter sind die
    // Wahrscheinlichkeiten (je größer, desto häufiger). Tiere verschwinden nach einer Weile und neue kommen.
    spawn: { population: 17, weights: { sheep: 5.5, goat: 0.2, pig: 0.15, cow: 0.15, cat: 2, frog: 1.6, butterfly: 3 } }, // Hoftiere: selten, beim Bauernhof-Event viele (siehe pickSpecies)
    // Fischreiher fliegen unabhängig vom Spawner über die Karte: alle every Sekunden einer, landChance landet
    herons: { every: [50, 110], landChance: 0.5 },
    objectKeys: { Ŝ: 'meadow_dock' }, // Holzsteg am See statt des Dschungelstegs
    bridgeStyle: 'wood', // Holzbrücke über den Bach (sonst rote Bogenbrücke wie in Asien)
    // Leben auf der Wiese (siehe MeadowLife.js): Seerosen auf den Seen, Enten (je See: Mitte, Radius in Kacheln, Anzahl);
    // Bienen fliegen um die Bienenkörbe, die Flügel der Windmühle drehen sich
    lilies: [[6, 10], [9, 11], [11, 10], [10, 16], [14, 16], [35, 24], [36, 26], [34, 23]],
    ducks: [{ tx: 8, ty: 10, r: 4, n: 3 }, { tx: 35, ty: 24, r: 3, n: 2 }],
  },

  forest: {
    name: tr('Wald', 'Forest'),
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 24.16, ty: 16.24, texture: 'car_zoo', frame: 0, scale: 1.1 },
    map: { x: 53, y: 16, icon: 'stag' },
    rows: [
      'PDDPDPPDDPDDPPDPPDPPDP#DPDPPDPPDDPPDPPDP',
      'DŔŔŔŔŔŔŔŔŔn..........m#.....P....nVVV..P',
      'DŔŔ.Ŵ.r..D.....k.D....#nm.......Ț.VĈV.kD',
      'PŔr~~~~..ƒ.....P.Dȁ...#mn..ṽn..n.r...ɌkP',
      'DŔɌ~ř~~.Ɍ...D..ĿȁD....#.Ɍ.ṽṽ...P...n...D',
      'PŔ..~~~..........nnnn.#.n.............kD',
      'DŔ...~~~...........ȚD.#.n.ḫ.P..mƒ..ȁȁ.kP',
      'PD..P.~~~........D..P.#D......ƒƒ..Dȁ..kD',
      'DP.ḩ...~~~......n.PPnP#P....Ŀ.........DD',
      'P.......~~~...Ɍ.ḫ.PPP.#.ḃḃ.......Ț.....P',
      'Pk.Ț.P..~ř~~.....P.PP.#ḃḃ.......mm..ḩ.kP',
      'Dkkk.ḃḃ..~~~....nLP...#.PMMMMM........PD',
      'PP..nḃ...~~~###########LDNap,N.#......kD',
      'Pk......k.~~~..L.Dk...#.PN,j,G##......PP',
      'DD.ṽP.Ɍ...~~~..P.Pkḩ..#.#MMMMM.#....Ɍ.PD',
      'PPṽṽ..kk..~ř~.PPn.P..n####.c...#..P...kD',
      'PkP.....k.~~~ƒƒPDP..Dȁ###......#.......P',
      'DPnPḫkDn..~~~.D....ȁȁ.###......#......DD',
      'PD......##EEE###########################',
      'Dkn.......~~~.nD.#......#..........ḩ...P',
      'DD..P....~~~..ḩ..#m..P..#.DȚ........P..D',
      'PP..DɌ..~~~......#...ḫ..#......m...Ŀ..kD',
      'Dkn.....~ř~.ƀ.ɌD.#......#.ḃP.Ɍ...ṽṽ.n..P',
      'PD..ȁȁƀ.~~~......#.PĿ.D.#ḃk...m.ṽṽ.....D',
      'PD.ȁȁ....~~~.D..D#......#..............P',
      'Dk...D...~~~~....#Pḃ..........ṽṽ.......D',
      'DPnnnnȚ..Ƅ~ř~ƀD.m#n.......n..ṽṽ..Ħ....DP',
      'PP.Pn.....~~~#####.....................P',
      'PDPnPPP....~~~..Ɍ..........P...........D',
      'D....ḩ......ř~~~............ḩ..........P',
      'P......Ŀ.....~~~~~Ƭ~~ř~~.......ȁȁ....ȚkP',
      'DPkkkkkn......~~ř~Ƭ~~~~~~.D...ȁȁ.......D',
      'Dkkk.ƒƒ.D.............~~~...........ƒƒ.D',
      'PD..Pƒ.......Pnḃ.ḫ.Ɍ...~ř~.........ƒƒ..P',
      'DD..Ț.....ṽṽ.ḃn.P..P...~~~.k...Ŀ......PD',
      'Dk.......ṽṽ...n.Ț..ȁȁ...~~~ḃ.D..n.P.kḫ.P',
      'PD....Pn....ḩ.n...mȁ.P...~ř~.LɌ.Pḃ..DkDD',
      'DD..ḃ....Dn....L....ḫ.D.ȁ.~~~...nk..kkDP',
      'Dk.....D.ḃ....nD.nDn..kḃ...~~~.....nȁkkP',
      'ɊDɊ...ẉ.ẉ......Ț...........~~~....ȁ.ḫ.DD',
      'DDn%...Ɋ.......Ț..Ț.......~~ř.........DP',
      'P.~~~~...n..Ɋ.ẉ..Ɋ.......~~~...Ț......DP',
      'DD~~~~%..%..ẉ...ẉ.......EEE...........kD',
      'PD%....~Ŝ~..n...ẉ......~~~...........Ø.P',
      'Ɋ....%~~Ŝ~ǒ......ẉ....~~~.....Ț.m......P',
      'Dk.ẉẉ~ǒ~Ŝ~~~.........~~~....m....Ø....DØ',
      'PD...%~~Ŝ~~%ẉẉẉ..ẉɊ.~~~.......ɫ...ɫ...DD',
      'D...ẉẉ%~Ŝ~........ẉ~~~.............ọ...D',
      '..ẉ.ẉnɊ..ẉ.ẉ..%~~~~~~.e.Ø...Ø..........P',
      'PD............~~~~~~..................kP',
      'Ɋ...ẉ........ŜŜŜŜŜŜŜŜ.ɫ....ɫ.........m.Ø',
      'P.....Ɋ....ẉĿ.~~~~~~.........≈≈≈≈≈....kD',
      'ɊknɊ....ẉ..ẉn..~~ǒ~%......ḫ..≈≈≈≈≈....kP',
      'DD....%......ẉẉ..........ɫ...≈≈≈≈≈Ø....D',
      'P.%.~Ŝ~%.......ẉẉ..%..............ɫm..kD',
      'Ɋk~~~Ŝ~~~......Ɋ..~~~.Ø..Ø...........ɫ.P',
      'Ɋ.~ǒ~Ŝ~~~%.%.....~~~ǒ~..ọ......Ø......DP',
      'Pk~~~Ŝ~~~..~~~~~..~~~....ɫ............kD',
      'Dk.ẉ~Ŝ~%ẉ..ŜŜŜŜŜ....%.ɫȁØm.Øḫ.m....m..kD',
      'Pk....%.ẉ.%~~~~~%.................ḫ.ɫ.kP',
      'Ɋ..........~~ǒ~~..ẉ.Ŀ........ȁ.......Ø.P',
      'ɊD..ẉẉ.....%...........Ț...............Ø',
      'DDkkɊkɊkkk...k..ɊɊkk.kPk..DPkPD.DDkk.kkP',
      'DPPɊɊDPDDPDPPDDɊPDDPPDDPPDDPØDP.DPPDDPPD',
    ],
    grass: ['fgrass0', 'fgrass1', 'fgrass2'],
    // Süden: links das Moor (Moorboden, dunkles stilles Wasser, Nebel), rechts hinter dem Fluss der Eichenhain (Laubboden);
    // die Ränder fransen aus. Der westliche Uferstreifen zwischen beiden behält den normalen Waldboden
    grounds: [
      { area: { tx0: 1, tx1: 21, ty0: 39, ty1: 62 }, soft: 3, ground: ['forest_moor0', 'forest_moor1', 'forest_moor2'], water: ['forest_moor_water'] },
      { area: { tx0: 28, tx1: 38, ty0: 39, ty1: 62 }, soft: 3, ground: ['forest_leaves0', 'forest_leaves1', 'forest_leaves2'], noMoss: true },
      { area: { tx0: 22, tx1: 38, ty0: 46, ty1: 62 }, soft: 3, ground: ['forest_leaves0', 'forest_leaves1', 'forest_leaves2'], noMoss: true },
    ],
    groundKeys: { '≈': 'forest_mud' }, // Schlamm der Wildschwein-Suhle
    boarArea: { tx0: 23, tx1: 38, ty0: 44, ty1: 61 }, // hier streifen die Wildschweine (Eichenhain, siehe Boar.js)
    noMudShore: true, // ... ohne Kiesrand
    // Frösche erscheinen und Reiher landen meist im Moor (Anteil), sonst irgendwo am Wasser
    prefer: { area: { tx0: 1, tx1: 21, ty0: 39, ty1: 62 }, frog: 0.8, heron: 0.75 },
    // Nebel über dem Moor (siehe MoorFog.js)
    moorFog: { tx0: 1, tx1: 20, ty0: 39, ty1: 62 },
    path: 'forest_path',
    start: { tx: 37, ty: 18 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 25, ty0: 11, tx1: 29, ty1: 14, style: 'forest' },
    chests: [
      { tx: 27, ty: 15, tools: ['net', 'lasso', 'trap', 'lantern', 'rod'] }, // Moorlaterne für die Elche im Nebel
      { tx: 22, ty: 48, tools: ['net', 'lasso', 'trap', 'lantern', 'rod'] }, // Kiste im Süden zwischen Moor und Eichenhain (an der Flussmündung)
    ],
    hero: 'hero_forest', // Kleidung der Spielfigur in diesem Gebiet (Pfadfinder)
    ambient: 'ambient_forest_river', // Waldgeräusche mit leisem Flussrauschen darunter (tools/prepare-sounds.js)
    // je näher man dem Moor kommt, desto mehr Moorgeräusche (siehe updateZoneAmbient in GardenScene.js)
    ambientZone: { sound: 'ambient_moor', area: { tx0: 1, tx1: 20, ty0: 39, ty1: 62 }, fade: 7 },
    toolSpots: [],
    // Durchgänge in kleine Maps aus dem Expeditions-Baukasten (siehe sideMaps.js); sonst nur mit dem Auto. Oben am Ende des
    // Wegs und rechts am Querweg auf jede Wald-Map, links aus dem Moor nur auf Moor-Maps, unten aus dem Eichenhain nur auf
    // Maps mit Eichen oder Laub
    exits: [
      { tx: 22, ty: 0, to: '@side', passage: 'north', back: { tx: 22, ty: 1 }, label: tr('Tiefer in den Wald', 'Deeper into the forest') },
      { tx: 39, ty: 18, to: '@side', passage: 'east', back: { tx: 38, ty: 18 }, label: tr('Tiefer in den Wald', 'Deeper into the forest') },
      { tx: 0, ty: 48, to: '@side', passage: 'west', back: { tx: 1, ty: 48 }, maps: ['fx_bog', 'fx_birch', 'fx_moorside'], label: tr('Tiefer ins Moor', 'Deeper into the bog') },
      { tx: 31, ty: 63, to: '@side', passage: 'south', back: { tx: 31, ty: 62 }, maps: ['fx_oakgrove', 'fx_leafwood', 'fx_gorge', 'fx_moorside'], label: tr('Tiefer in den Eichenwald', 'Deeper into the oak wood') },
    ],
    spawn: { population: 17, weights: { deer: 4.4, squirrel: 2.5, fox: 1, frog: 0.7, elk: 0.7, hedgehog: 1.2, boar: 0.9 } }, // jedes zehnte Reh ist ein Hirsch (Skin); Frösche meist an den Moortümpeln und am Fluss; Elche im Moorwasser (höchstens 2)
    // Fluss vom Wasserfall oben links bis unten rechts (fließt wie im Dschungel), mit Felsen, um die er schäumt
    // im Moor (except) läuft er in stille Tümpel aus
    flow: { frames: ['forest_flow0', 'forest_flow1', 'forest_flow2', 'forest_flow3'], ms: 300, minSize: 40, except: { tx0: 0, tx1: 21, ty0: 46, ty1: 63 } },
    roundShore: true,
    bridgeStyle: 'wood', // Holzbrücke über den Fluss
    bridgeArt: { back: 'forest_bridge', front: 'forest_bridge_front', len: 3, ox: 42, oy: 34 }, // ... als Bild (tools/forest-art.py)
    objectKeys: { Ŵ: 'forest_waterfall', Ŕ: 'forest_cliff', Ŝ: 'forest_boardwalk' }, // Wasserfall, Felskante und Holzsteg im Moor mit eigenen Bildern (Wald-Paket)
    moss: 0.14, // Anteil der Graskacheln mit einem Moospolster (siehe ForestLife.js)
    bats: { tx: 35, ty: 2 }, // Fledermäuse aus der Höhle (Wolfsnacht, siehe ForestLife.js)
    bees: 5, // einzelne Bienen fliegen von Blume zu Blume
    birds: 4, // kleine Vögel fliegen von Baum zu Baum
    herons: { every: [50, 110], landChance: 0.5 },
    // Biber (siehe Beaver.js und BeaverDam.js): so viele sitzen an den angenagten Bäumen (ƀ) am Fluss; der Damm liegt quer
    // über dem Fluss (mittlere Kachel, er reicht eine Kachel weit nach beiden Seiten entlang tx), an diesen Stellen liegen große Stöcke
    beavers: { count: 3, dam: { tx: 10, ty: 24 }, sticks: [[3, 21], [15, 24], [6, 27], [20, 22]] },
  },

  savanna: {
    name: tr('Savanne', 'Savanna'),
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 12.16, ty: 25.32, texture: 'car_zoo', frame: 0, scale: 1.15 },
    map: { x: 58, y: 63, icon: 'giraffe' },
    rows: SAVANNA_ROWS,
    grass: ['sgrass0', 'sgrass1', 'sgrass2'],
    path: 'savanna_path',
    roundShore: true, // Landecken, die ins Wasser ragen, abgerundet
    start: { tx: 2, ty: 19 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 13, ty0: 20, tx1: 17, ty1: 23, style: 'savanna' },
    chests: [
      { tx: 15, ty: 24, tools: ['net', 'lasso', 'food', 'rod'] },
    ],
    hero: 'hero_savanna', // Kleidung der Spielfigur in diesem Gebiet (Safari)
    background: '#b89a52', // Farbe außerhalb der Karte (trockenes Gras)
    ambient: 'ambient_savanna', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    ambientVolume: 0.35, // etwas leiser als in den anderen Gebieten (0.55)
    flies: true, // Fliegen am Elefantenfriedhof bzw. Mücken am Wasser, je nach Wetter (siehe SavannaLife.js)
    // Elefantenfriedhof oben rechts: dunkler, trostloser Boden mit weichem Rand, flach über dem Boden (in allen Wetterphasen;
    // Bild aus tools/savanna-placeholders.py, Mitte über dieser Kachel)
    gravePatch: { key: 'savanna_grave_patch', tx: 33, ty: 4.5 },
    toolSpots: [],
    // Durchgänge in kleine Maps aus dem Expeditions-Baukasten (siehe sideMaps.js); sonst nur mit dem Auto
    exits: [
      { tx: 10, ty: 0, to: '@side', passage: 'north', back: { tx: 10, ty: 1 }, label: tr('Tiefer in die Savanne', 'Deeper into the savanna') },
      { tx: 39, ty: 13, to: '@side', passage: 'east', back: { tx: 38, ty: 13 }, label: tr('Tiefer in die Savanne', 'Deeper into the savanna') },
      { tx: 27, ty: 39, to: '@side', passage: 'south', back: { tx: 27, ty: 38 }, label: tr('Tiefer in die Savanne', 'Deeper into the savanna') },
    ],
    // Hier leben Antilopen (Gazellen) und Zebras in Gruppen zu 2 bis 4, etwa gleich häufig, und Giraffen;
    // keine Fischreiher. Giraffen sind viel seltener und erscheinen meist an Bäumen
    // Erdmännchen kommen als Kolonie (3 bis 5), seltener als Antilopen und Zebras
    // Löwen sind selten (meist höchstens einer) und dösen immer unter einer Akazie; Krokodile tauchen
    // wie Fische in den Wasserlöchern auf, sind aber deutlich seltener
    // population zählt hier Plätze: eine Herde oder Kolonie belegt nur einen
    spawn: { population: 8, weights: { antelope: 0.6, zebra: 0.6, giraffe: 0.4, meerkat: 0.3, lion: 0.25, crocodile: 0.2 } },
    // Wetterphasen (siehe src/world/season.js): ersetzen die Angaben oben; die normalen Tiere sind dann seltener
    seasons: {
      // Starkregen: viel größere Wasserlöcher, Nilpferde, Fische (Lungenfische), Reiher (oft Schuhschnäbel),
      // mehr Krokodile (selten ein Albino-Krokodil)
      rain: {
        // trocken bleiben: Hütte und Auto, der Start und ein Streifen neben dem Gnu-Strom (Große Wanderung, siehe Gnu.js)
        rows: growWater(SAVANNA_ROWS, 2, (x, y) => (x >= 9 && x <= 20 && y >= 18 && y <= 27) || (x <= 4 && y >= 17 && y <= 21) || y - x >= 20),
        grass: ['sgrass_rain0', 'sgrass_rain1', 'sgrass_rain2'],
        ambient: 'ambient_savanna_rain', // Regen und Donner
        objectKeys: { ƚ: 'savanna_tallgrass_rain', Ƙ: 'savanna_bush_rain', v: 'savanna_shrub_rain' }, // alles grünt und blüht
        ambientVolume: 0.5,
        spawn: { population: 10, weights: { antelope: 0.3, zebra: 0.3, giraffe: 0.2, meerkat: 0.15, lion: 0.12, crocodile: 0.35, hippo: 0.45 } },
        herons: { every: [35, 70], landChance: 0.7 },
      },
      // Trockenzeit: Schlamm statt Wasser (darin die Lungenfische), ein letztes kleines Wasserloch, an dem sich Zebras und
      // Antilopen drängen; kahle Akazien mit Geiern, Warzenschweine, Hyänen (mit Knochen anlocken, siehe Hyena.js)
      dry: {
        rows: dryUp(SAVANNA_ROWS, { tx: 31, ty: 30, r: 1.6 }),
        fishIn: '≈',
        grass: ['sdry0', 'sdry1', 'sdry2'],
        objectKeys: { A: 'acacia_bare', ƚ: 'savanna_tallgrass_dry', Ƙ: 'dry_bush' }, // kahl und strohgelb
        chests: [{ tx: 15, ty: 24, tools: ['net', 'lasso', 'food', 'bone', 'rod'] }],
        spawn: { population: 9, weights: { antelope: 0.35, zebra: 0.35, giraffe: 0.15, meerkat: 0.3, lion: 0.12, warthog: 0.5 } },
        gatherAt: { tx: 31, ty: 30, r: 90 }, // dort drängen sich Zebras und Antilopen (Leine, siehe Animal.pickWander)
        vultures: { every: [30, 60] }, // so oft kreist ein Geier heran (Sekunden)
        hyenas: { every: [40, 80], near: { tx: 33, ty: 5, r: 10 } }, // so oft kichert das Hyänenrudel – nur, wenn man in der Nähe des Elefantenfriedhofs ist
      },
    },
  },

  asia: {
    name: tr('Bambuswald', 'Bamboo Forest'),
    roundShore: true, // Landecken, die ins Wasser ragen, abgerundet
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 13.16, ty: 57.54, texture: 'car_zoo', frame: 0, scale: 1.3 },
    map: { x: 78, y: 37, icon: 'panda' },
    rows: [
      'ȒȞȒȒȞȒȒȞȒȒȞȒȒȞȒȒȞȒȒȞȒȒȞȒȒȞȒȒȞȒȒȞ.ȒȞȒȒȞȒȒ',
      'Ȟ......hhh.............................Ȓ',
      'Ȓ.....hhhhh...Ɵ.............Ȓ..........Ȓ',
      'Ȓ.Ȩ..hhhhhhh.........ȓ..............Ɵ..Ȓ',
      'Ȟ.....hhhhhȞ.....Ƨ.....Ƨ.....Ƨ.........Ȓ',
      'Ȓ....Ɵ.hhh................ȓ......Ƨ....ȓȒ',
      'Ȓ.ȓ.....Ȓ..ȓ........Ʃ.........ȓ........Ȓ',
      'Ȟ...................#...Ȓ..............Ȓ',
      'Ȓ..Ȟ........Ƨ....Ƨ..#.....Ƈ.......ȓ..Ȟ.Ȓ',
      'Ȓ........Ɵ..........#.ȓ......Ƨ.........Ȓ',
      'Ȟ..................Ȓ#.....hhh......Ȓ...Ȓ',
      'Ȓ...Ƨ....Ƨ.....Ȓ....#....hhhhh.........Ȓ',
      'Ȓ......Ȩ........ȓ...#.....hhh....Ƨ.....Ȓ',
      'Ȟ...........Ȓ.....Ȓ.#..Ȟ...Ȩ...Ɵ....Ȓ..Ȓ',
      'Ȓ...Ȓ...Ȟ...........#..................Ȓ',
      'Ȓ...................#..................Ȓ',
      'J..J....q....J..q...#..Q..qq...Q..q..Q.k',
      'Q.....nqnq....q.q...#...qqq.QQ.Q..qQQQqk',
      'Q......nJ.n.Jn.J.J..#...qqQ...QQq.qQq..k',
      'J..J.J........nnn...#......Q....qqQQq..k',
      'Q..nq..n..qqn.......#...qq.qqq..q.QQqqQk',
      'Q.....q...n.J.....n.#...qqQ.qqQ.q.Q.q.Qk',
      'J.J..nJ..J...qJ..J..#..QQQQ..qqQ.QqqqQ.k',
      'Qn..........q.......#...Q....qqQQqqq.QQk',
      'Qq....JnJ...J....J..#.....qqq...QQqqq.qk',
      'J.J.q.....nq..J.....#..qqqqqqqQqqqqqQqqk',
      'Qn...nn.n...........#...qqQ.qqq.qqQQ...k',
      'Q...........Jq....q.#..QQ.Q.Q....qqQQqqk',
      'J.....n.n.n.n...n...#..................k',
      'Q.....#############################....k',
      'Q..n.n.n...q....q...#..................k',
      'J.J....n....J.....J.#....QqqqqQQ.Q.Q.qqk',
      'Qnq....q.n.....K....#..qqK.QQQQ..q....qk',
      'Q.J..J..............#...q.........QQ.Q.k',
      'J..n..q...K.........#...~~~~...........k',
      'Q........~~~~~~.....#..~~~~~~..........k',
      'Q...q...~~~~~~~~~~~~B~~~~~~~...........k',
      'J.......~~~.K.~~~~~~B~~~~~.....K.......k',
      'Q.......~~~...EEEEE.#.~~~..............k',
      'Q........~~~~~~~~~.e#..~~~..~~~........k',
      'J...........~~~~~~.l#.K~~~~~~~~~.....q.k',
      'Q........K...~~~~~~.#.~~~~~~~~~~~......k',
      'Q..............~~~~~B~~~~~~~~~~~~n.q...k',
      'J.............~~~~~~B~~~~r~~~~~~.......k',
      'Q............~~~~~..#......~~~~........k',
      'Q............~~~~~..#.........q........k',
      '.................K..#..................k',
      'Q....###############################...k',
      'Q...................#..................k',
      'J..q......r.l....q.l#l....O.........O..k',
      'Q..........rr.......#..........O........',
      'Q....r..............#.......O..........k',
      'J............rMMMMM.#l..........q.O....k',
      'Q............rNap,N.#...q..............k',
      'Q...........r.N,j,G##........O.n.......k',
      'J............#MMMMM.#............O.....k',
      'Q...........####c####..................k',
      'Q...........##.....l#l.............r...k',
      'J...........##......#...K..q..r........k',
      'Q...........#..K....#...............r..k',
      'Q..q................I..................k',
      'J..........n........#.....K....r.......k',
      'Q............K......#..................k',
      'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.kkkkkkkkk',
    ],
    grass: ['agrass0', 'agrass1', 'agrass2'],
    path: 'asia_path',
    water: ['asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water1', 'asia_water2'], // Koi-Teich, ab und zu Seerosen und Lotus
    // Hochebene im Norden (Zeilen 0 bis 15, hinter dem Bambushain; der Weg führt hinauf zur Stupa): bis Zeile full eine
    // dichte Schneedecke, darunter läuft sie über band Zeilen weich aus (siehe src/world/SnowCover.js)
    snowline: { full: 9, band: 8 },
    // Yak-Herde am Steinhaufen (Ƈ); der Salzstein liegt an einer dieser Stellen (siehe src/world/YakHerd.js)
    yaks: { count: 3, salt: [[14, 6], [3, 6], [36, 6], [31, 2], [30, 7], [10, 13], [25, 14], [37, 11], [16, 3], [5, 9]] },
    // Gebetsfahnen: Leinen von Stange zu Stange (Ƨ), auch über Eck (siehe src/world/PrayerFlags.js)
    prayerFlags: [
      [[12, 8], [17, 8], [17, 4]],
      [[23, 4], [29, 4], [29, 9]],
      [[33, 5], [33, 12]],
      [[4, 11], [9, 11]],
    ],
    start: { tx: 20, ty: 61 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 14, ty0: 52, tx1: 18, ty1: 55, style: 'asia' },
    chests: [
      { tx: 16, ty: 56, tools: ['net', 'lasso', 'koifood', 'food', 'ball'] }, // Grünfutter für die Pandas, Ball zum Anlocken des Tigers
      { tx: 19, ty: 39, tools: ['net', 'lasso', 'koifood', 'food', 'ball'] }, // Kiste auf der Insel: alle Werkzeuge von Asien
    ],
    hero: 'hero_asia', // Kleidung der Spielfigur in diesem Gebiet (Strohhut)
    ambient: 'ambient_asia', // Asien-Geräusche, leise über die Wiesengeräusche gelegt (siehe tools/prepare-sounds.js)
    background: '#3f7a35',
    toolSpots: [],
    // Durchgänge in kleine Maps aus dem Expeditions-Baukasten (siehe sideMaps.js): oben auf der Hochebene nur verschneite
    // Maps, unten die aus dem Bambuswald; sonst nur mit dem Auto
    exits: [
      { tx: 32, ty: 0, to: '@side', passage: 'north', back: { tx: 32, ty: 1 }, maps: ['ax_stupa', 'ax_ridge', 'ax_spring'], label: tr('Höher auf die Hochebene', 'Higher up the plateau') },
      { tx: 0, ty: 46, to: '@side', passage: 'west', back: { tx: 1, ty: 46 }, maps: ['ax_grove', 'ax_lanterns', 'ax_koi', 'ax_cherry', 'ax_forest', 'ax_lake'], label: tr('Tiefer in den Bambuswald', 'Deeper into the bamboo forest') },
      { tx: 39, ty: 50, to: '@side', passage: 'east', back: { tx: 38, ty: 50 }, maps: ['ax_grove', 'ax_lanterns', 'ax_koi', 'ax_cherry', 'ax_forest', 'ax_lake'], label: tr('Tiefer in den Bambuswald', 'Deeper into the bamboo forest') },
      { tx: 30, ty: 63, to: '@side', passage: 'south', back: { tx: 30, ty: 62 }, maps: ['ax_grove', 'ax_lanterns', 'ax_koi', 'ax_cherry', 'ax_forest', 'ax_lake'], label: tr('Tiefer in den Bambuswald', 'Deeper into the bamboo forest') },
    ],
    // Koi leben im Koi-Teich (nur als Schatten zu sehen, bis man sie mit Fischfutter anlockt)
    spawn: { population: 9, weights: { koi: 1, panda: 0.4, macaque: 0.7, tiger: 0.35, orangutan: 0.35, peacock: 0.8, tanuki: 0.5, snowleopard: 0.15 } }, // Pandas beim Bambus, Japanmakaken in der heißen Quelle, Tiger als Schemen im Bambuswald, Tanukis verkleidet bei den Laternen, selten ein Schneeleopard auf der Hochebene
  },

  // Dschungel: ein breiter Fluss teilt den Urwald in Nord- und Südufer. Man landet mit dem Wasserflugzeug an der kleinen
  // Insel mitten im Fluss (Fischerhütte); ans Ufer kommt man nur mit dem Kanu (siehe Boat.js), an vier Stegen mit je einer
  // Werkzeug-Kiste. Dickicht (Ď) schlägt Henrik mit der Machete weg, es wächst langsam nach (siehe Thicket.js). Oben links
  // versteckt sich hinter Dickicht ein Wasserfall, unten rechts (Südufer) eine große Lichtung, ebenfalls hinter Dickicht
  // (dort leben später die Gorillas). Wetter: Normal, Starkregen, aufsteigender Nebel (siehe season.js).
  // Tiere kommen später. Ŝ: Steg, Ŕ: Felsklippe, Ŵ: Wasserfall
  jungle: {
    name: tr('Dschungel', 'Jungle'),
    // Schnellreise: Wasserflugzeug am Inselufer (bob: schaukelt auf dem Wasser; reach: so nah muss man heran;
    // arrive: Ankunft auf der Insel statt neben dem Flugzeug)
    car: { tx: 16.4, ty: 22.6, texture: 'seaplane', frame: 0, scale: 1.2, bob: true, reach: 60, arrive: { tx: 19, ty: 22 } },
    map: { x: 30, y: 64, icon: 'macaw' },
    rows: [
      'kJkkJkkJkkJkkJkkJkkJk.JkkJkkJkkJkkJkkJkkJkkk',
      'JŔŔŔŔŔŔŔŔk.J.....nľf...nfqn..n....ľn.qnľqn.J',
      'kŔŔ.ŴnḢrĎĎJḟnJ.k.n..n..q...ḟJqJJ.qḢfľqqqn.nk',
      'kŔr~~~~ĎĎ.J...J.knľ.qkk.J..n.Jn.nqnJg.Ḣ.nqqk',
      'JŔO~~~~nn.qľ..ľ.ľ.n.kľq..f.kľn...n.kľnq.fqnJ',
      'kŔn~~~Ď.Jq.k..q..J..ľľ..Jqľ..JnJnJJľ.knk.q.k',
      'kŔḟnĎO.nnn.ľJq.qn.ĎĎĎĎĎJf.qľ.JnľĎĎĎJq...q.ľk',
      'JŔĎĎĎnq.nľľ.ľľ...ĎĎĎĎĎĎĎ.J.ľnn.ĎĎĎĎĎ.n.n...J',
      'kfĎĎ.n.ĎĎĎĎĎ.q...ĎĎĎĎĎĎĎ.J.ľnkĎĎĎĎĎĎĎḟ..n..k',
      'k.Ď...ĎĎĎĎĎĎĎ.qk.ĎĎĎĎĎĎĎ.n.nḢ.ĎĎĎĎĎĎĎ.k.nn.k',
      'J.JJq.ĎĎĎĎĎĎĎ.Ḣ.nkĎĎĎĎĎ.n..ľ..ĎĎĎĎĎĎĎJ..qnfJ',
      'k.nJJľĎĎĎĎĎĎĎľ.J...f.Jľk..Jn..qĎĎĎĎĎ..qfľ..k',
      'k...ḢqľĎĎĎĎĎn.qľ...JqkJf...nnk.nĎĎĎ#.ĎĎĎ.f.k',
      'Jqnľ.n.ľ#ľn.nkn.....ĎnḢnn.ľJ.ľḢJnf.#ĎĎĎĎĎ.ľJ',
      'kqg..n..##...n.Jn.ṀĎ~~~~~n.Ď..k..e##ĎĎĎĎĎ..k',
      'k.J.ľ...k#.ľ.J..Ḣ~~~~~~~~~~~Ṁ..f.k#qĎĎĎĎĎ.Jk',
      'Jgn..fJ..#ḟn.nĎṀ~~~~~~~~~~~~~ĎĎṀ..#..ĎĎĎJľnJ',
      'kqgkfn.ľ##ľ.JṀ~~~~~~~~~~~~~~~~~~~~Ŝ~~.Ṁ.nkJk',
      'kṀnṀĎ..e##Jn.Ṁ~~~~~.......~~~~~~~~~~~~~~~Ṁfk',
      '~~~~~Ṁnľ.#.n.Ṁ~~~~..MMMMM..~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~Ŝ~~~~~~~~..NaɃ,N.n~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~b.Nɓ,,G#.~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~..MMMMM#.~~~~Ŝ~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~....c..#.~~~~#..qn.~~~~~~~',
      '~~~~~~~~~~~~~~~~~~.f..###..~~~~##e...Ṁ.ĎĎ~~~',
      'JṀnĎk~~~~~~~Ŝ~~~~~~n..#...~~~~~##f...nľ.J.ṀJ',
      'k.kJ.ṀṀṀṀṀľ.#.~~~~~~~~Ŝ~~~~~~~~#...fn.JnJJ.k',
      'knk..ĎĎĎ...k#f.n~~~~~~~~~~~~~..#..q.n...q.fk',
      'Jľ..ĎĎĎĎĎn.e#JľľĎ~~~~~~~~~~~Ṁ.f#Jľ.nḢ.nJ.qľJ',
      'kJ.JĎĎĎĎĎḢ..#.J.ľĎṀṀ~~~~~nĎṀľk.##..n.ĎĎĎ..kk',
      'kJkľĎĎĎĎĎ...#ffJqn.ľĎnn.ľn.ḟnľľ.#qnnĎĎĎĎĎ..k',
      'J.n.ĎĎĎĎĎ.nľĎĎĎĎĎ.ľ..nn.k.nľ..ľn#nn.JĎĎĎĎJJJ',
      'kJ..ĎĎĎĎĎľľĎĎĎĎĎĎĎľ...nn...nĎĎĎĎ##JĎĎĎĎJJĎfk',
      'k...kĎĎĎ.JnĎĎĎĎĎĎĎ..qľ...ľľĎĎĎĎĎĎ#Jn..nq.ĎJk',
      'JJn...J..n.ĎĎĎĎĎĎĎḢ...n.q..ĎĎĎĎĎJĎĎ......ľĎJ',
      'k..n..k.n.k#ĎĎĎĎĎJngJ.nkJkľĎĎĎĎĎĎ.Ď.....O..k',
      'k.fJ.g...ḟ....J.J.n.ĎĎĎĎĎ.q.ĎĎĎĎĎľ..L......k',
      'J....J.J.nJkn..kJnĎĎĎĎĎĎĎĎĎ.ľq.JĎ.........ľJ',
      'kq..q.qnJqnľ...nqḟĎĎĎĎĎĎĎĎĎ.nnnĎJn.........k',
      'kJ....nkn..fľkqn.nĎĎĎĎĎĎĎĎĎ...JĎĎq.r...r...k',
      'J..ľqkḟ.J...Jn.ľJnq.ĎĎĎĎĎq..nḟnkJ..........J',
      'kk...Jľg..ḟnnn...fľ.qf.ľ..f.k...ĎJqq....qľĎk',
      'kn.J..q.nkJľ.nf.k.Jqľľk.ľnk...J.qĎĎ.q.nn.ĎĎk',
      'JJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJ.kJkkJ',
    ],
    grass: ['jgrass0', 'jgrass1', 'jgrass2'],
    path: 'jungle_path',
    water: ['water'], // ruhiges Wasser außerhalb des Flusses: das frische, blaue Becken am Wasserfall (der Fluss: siehe flow)
    // der Fluss fließt: Bilder reihum (helle Streifen wandern mit der Strömung), alle ms Millisekunden; minSize: nur
    // Wasser ab so vielen Kacheln (nicht das Becken am Wasserfall). current: Strömung (Richtung in Kacheln, Pixel pro
    // Sekunde), sie treibt das Kanu langsam flussabwärts
    flow: { frames: ['jungle_flow0', 'jungle_flow1', 'jungle_flow2', 'jungle_flow3'], ms: 280, minSize: 40 },
    roundShore: true, // Rasenecken, die in den Fluss ragen, sind abgerundet (siehe outerLandCorners)
    current: { tx: 1, ty: 0, speed: 14 },
    start: { tx: 19, ty: 22 },
    enclosures: [], // die Gehege sind im Tierpark
    hut: { tx0: 20, ty0: 19, tx1: 24, ty1: 22, style: 'jungle' }, // Fischerhütte auf der Insel
    // Kanu: liegt am Anfang am Südsteg der Insel
    boat: { tx: 22, ty: 27 },
    chests: [
      { tx: 22, ty: 23, tools: ['net', 'lasso', 'banana', 'rod', 'drum'] }, // Regal vor der Fischerhütte
      { tx: 7, ty: 18, tools: ['net', 'lasso', 'banana', 'rod', 'drum'] }, // Kisten an den Uferstegen (ein paar Schritte weg vom Steg, sonst öffnet man sie statt einzusteigen)
      { tx: 33, ty: 14, tools: ['net', 'lasso', 'banana', 'rod', 'drum'] },
      { tx: 11, ty: 28, tools: ['net', 'lasso', 'banana', 'rod', 'drum'] },
      { tx: 33, ty: 24, tools: ['net', 'lasso', 'banana', 'rod', 'drum'] },
    ],
    hero: 'hero_jungle', // Dschungel-Kleidung mit Machete
    ambient: 'ambient_jungle', // Dschungel-Geräusche (dazu rauscht oben links der Wasserfall, siehe updateWaterfallSound)
    ambientVolume: 0.7, // das ruhige Stück ohne Brüllaffen ist leiser aufgenommen
    background: '#2f5a24',
    toolSpots: [],
    // Durchgänge in kleine Maps aus dem Expeditions-Baukasten (siehe sideMaps.js): oben und unten zu Fuß, rechts auf dem
    // Fluss mit dem Kanu (die ganze Flussbreite am Rand; dahinter immer eine Fluss-Map); sonst nur mit dem Wasserflugzeug
    exits: [
      { tx: 21, ty: 0, to: '@side', passage: 'north', back: { tx: 21, ty: 1 }, label: tr('Tiefer in den Dschungel', 'Deeper into the jungle') },
      { tx: 38, ty: 43, to: '@side', passage: 'south', back: { tx: 38, ty: 42 }, label: tr('Tiefer in den Dschungel', 'Deeper into the jungle') },
      ...[19, 20, 21, 22, 23, 24].map((ty) => ({ tx: 43, ty, to: '@side', passage: 'river', canoe: true, back: { tx: 41, ty: 21 }, label: tr('Mit dem Kanu flussabwärts', 'Downriver by canoe') })),
    ],
    // Plätze (population: ein Trupp Brüllaffen, ein Ara-Paar, ein Piranha-Schwarm zählt als einer). spawn gilt bei jedem
    // Wetter, weatherSpawn ist der eigene Pool der Wetterlage (die Wetterphasen unten ersetzen nur ihn)
    spawn: { population: 3, weights: { anteater: 1, jaguar: 1, tapir: 0.7, okapi: 0.7 } }, // Ameisenbären, ein Jaguar, Tapire am Fluss und Okapis bei jedem Wetter
    weatherSpawn: { population: 4, weights: { howler: 1, macaw: 1 } }, // normales Wetter: Brüllaffen und Aras in den Uferbäumen
    // Sonne am Wasserfall (nur bei normalem Wetter, siehe WaterfallSun.js): Fläche ums Becken, in der sich höchstens
    // so viele Leguane verstecken und sonnen (eigener Pool, siehe Iguana.js)
    waterfallSun: { tx0: 1, ty0: 1, tx1: 9, ty1: 7, iguanas: 2 },
    // Wetterphasen (siehe src/world/season.js): ersetzen die Angaben oben
    seasons: {
      rain: {
        waterfallSun: null, // bei Starkregen keine Sonne (und keine Leguane)
        weatherSpawn: { population: 4, weights: { piranha: 1, toucan: 1 } }, // bei Starkregen verkriechen sich Brüllaffen und Aras; im Fluss wirbeln Piranha-Schwärme, in den Uferbäumen sitzen Tukane
        grass: ['jgrass_rain0', 'jgrass_rain1', 'jgrass_rain2'],
        ambient: 'ambient_savanna_rain', // Regen und Donner
        ambientVolume: 0.5,
      },
      // aufsteigender Nebel: man sieht nicht weit, über dem Fluss steigen Schwaden auf (siehe Weather.js)
      fog: {
        waterfallSun: null, // im Nebel auch nicht
        // Gorillas auf der Lichtung unten rechts (hinter dem Dickicht): eigener Pool, siehe Gorilla.js und DrumTool.js
        gorillas: { tx0: 34, ty0: 34, tx1: 42, ty1: 41, count: 3 },
        weatherSpawn: { population: 4, weights: { howler: 1, macaw: 1 } }, // im Nebel: Brüllaffen (selten ein Gibbon), die Aras fliegen weiter
        ambientVolume: 0.18, // im Nebel ist es stiller
      },
    },
  },

  // Eiswelt: Tag und Nacht wechseln alle 8 Minuten (siehe season.js; in der Forschungsstation kann man bis zur nächsten Phase schlafen).
  // Am Tag treiben Eisschollen als Fähren über die Meeresarme zu den Inseln (siehe Floes.js), nachts friert das Meer
  // zwischen den Inseln zu und man läuft bequem hinüber – dafür ist es so kalt, dass Henrik nach ein paar Minuten keine
  // Tiere mehr fangen kann, bis er sich in der Forschungsstation aufgewärmt hat (cold). Es schneit immer leicht (siehe Weather.js).
  ice: {
    name: tr('Eiswelt', 'Ice World'),
    // Schnellreise: Schneemobil (wie im Eiswelt-Abschnitt des Tierparks) rechts neben der Forschungsstation
    car: { tx: 27.5, ty: 21.5, texture: 'car_snow', frame: 0, scale: 1.26, arrive: { tx: 25, ty: 22 } },
    map: { x: 40, y: 17, icon: 'penguin' }, // Grönland
    rows: ICE_ROWS,
    grass: ['snow0', 'snow1', 'snow2'],
    path: 'snow_path',
    water: ['ice_water0', 'ice_water0', 'ice_water1'],
    roundShore: true, // Schneeecken, die ins Meer ragen, sind abgerundet
    start: { tx: 25, ty: 22 },
    enclosures: [], // die Gehege sind im Tierpark
    hut: { tx0: 19, ty0: 19, tx1: 23, ty1: 22, style: 'ice' }, // Forschungsstation (Metall, flaches Dach mit Teleskop; mit Bett)
    chests: [
      { tx: 21, ty: 23, tools: ['net', 'lasso', 'herring', 'sealball', 'lantern', 'warmer', 'rod'] }, // Regal vor der Station
      { tx: 8, ty: 7, tools: ['net', 'lasso', 'herring', 'sealball', 'lantern', 'warmer', 'rod'] }, // Kisten auf den beiden Inseln
      { tx: 37, ty: 7, tools: ['net', 'lasso', 'herring', 'sealball', 'lantern', 'warmer', 'rod'] },
      { tx: 34, ty: 39, tools: ['net', 'lasso', 'herring', 'sealball', 'lantern', 'warmer', 'rod'] }, // an den Vogelfelsen am Südufer des Fjords
      { tx: 10, ty: 50, tools: ['net', 'lasso', 'herring', 'sealball', 'lantern', 'warmer', 'rod'] }, // in der Tundra
    ],
    hero: 'hero_ice', // Kleidung in der Eiswelt (Parka mit Fellkapuze)
    ambient: 'ambient_ice', // pfeifender Wind
    ambientVolume: 0.4, // lauter aufgenommen: so etwa gleich laut wie der Dschungel
    stepSound: 'step_snow', // Schritte knirschen im Schnee (drinnen wie überall auf dem Flur)
    background: '#1f4f73',
    toolSpots: [],
    // Durchgänge in kleine Maps aus dem Expeditions-Baukasten (siehe sideMaps.js; Tag oder Nacht wie auf der großen Karte):
    // unten durch die Tannen in die Tundra, rechts am Südufer der Fjordmündung an die Küste, oben übers offene Meer
    // aufs Packeis (tagsüber mit der Scholle von Insel B, nachts zu Fuß über den zugefrorenen Streifen ICE_SEA_LANE);
    // sonst nur mit dem Schneemobil
    exits: [
      { tx: 32, ty: 63, to: '@side', passage: 'south', back: { tx: 32, ty: 61 }, maps: ['ix_tundra', 'ix_creek', 'ix_taiga'], label: tr('Tiefer in die Tundra', 'Deeper into the tundra') },
      { tx: 45, ty: 36, to: '@side', passage: 'east', back: { tx: 44, ty: 36 }, maps: ['ix_fjord', 'ix_birdcliff', 'ix_glacier'], label: tr('Die Küste entlang', 'Along the coast') },
      ...[36, 37, 38].map((tx) => ({ tx, ty: 0, to: '@side', passage: 'north', back: { tx: 37, ty: 3 }, maps: ['ix_packice', 'ix_walrus', 'ix_skerries'], label: tr('Hinaus aufs Packeis', 'Out onto the pack ice') })),
    ],
    snow: true, // es rieselt immer leicht Schnee (siehe Weather.js)
    // auf den beiden Inseln liegt fast immer mindestens ein Walross am Ufer (siehe updateIslands in IceCatch.js)
    walrusIslands: [{ tx0: 3, tx1: 16, ty0: 4, ty1: 12 }, { tx0: 30, tx1: 42, ty0: 3, ty1: 12 }],
    // Papageitaucher-Zug (Event, docs/plan-papageitaucher.md): Felsformationen am Rand, auf denen die Schwärme landen
    // (immer da, ohne Event leer): Westspitze Insel A, Nordwestecke und Ostküste des Festlands, Ostspitze Insel B
    puffinRocks: [[[3, 6], [4, 8]], [[3, 17], [5, 17]], [[41, 6], [41, 8]], [[42, 22], [42, 25]]],
    // Bodenzonen: Gletscher, Tundra (unten und links am Gletscher vorbei) und die Kiesstrände der Walrosse (Westküste am offenen Meer und
    // am Südufer von Insel B); Platzhalter-Bilder aus tools/ice-grounds.py und tools/ice-placeholders2.py
    grounds: [
      { area: { tx0: 13, tx1: 23, ty0: 27, ty1: 38 }, ground: ['glacier0', 'glacier1', 'glacier2'], soft: 2 }, // Gletscher am Fjordende
      { area: { tx0: 0, tx1: 45, ty0: 37, ty1: 63 }, ground: ['tundra0', 'tundra1', 'tundra2'], soft: 3 },
      { area: { tx0: 0, tx1: 19, ty0: 27, ty1: 36 }, ground: ['tundra0', 'tundra1', 'tundra2'], soft: 3 },
      { area: { tx0: 3, tx1: 7, ty0: 19, ty1: 26 }, ground: ['ice_beach0', 'ice_beach1', 'ice_beach2'], soft: 1.5 },
      { area: { tx0: 30, tx1: 41, ty0: 10, ty1: 12 }, ground: ['ice_beach0', 'ice_beach1', 'ice_beach2'], soft: 1.5 },
    ],
    // Pinguine watscheln in Gruppen am Wasser (siehe Penguin.js); nachts am offenen Meer am Kartenrand und an den Eislöchern.
    spawn: { population: 9, weights: { penguin: 1, seal: 0.6, snowhare: 0.7, arcticfox: 0.3, reindeer: 0.5, walrus: 0.45, puffin: 0.1 } }, // (Papageitaucher sehr selten: sie kommen vor allem beim Papageitaucher-Zug) Robben schwimmen am Ufer (siehe Seal.js), Schneehasen vor allem in der Tundra
    // Eisschollen (siehe Floes.js), Lage in Kacheln. ferries: tragen Henrik zwischen Festland (from) und Insel (to) hin
    // und her und liegen an beiden Ufern wait Sekunden an (travel: Sekunden für die Fahrt, shift: Versatz im Takt);
    // drift: kleine Schollen zur Zierde, die langsam über das offene Meer am Rand treiben (period: Sekunden hin und zurück)
    floes: {
      r: 1.25, // Größe der Fähren (Kacheln von der Mitte bis zum Rand)
      wait: 5,
      travel: 7,
      ferries: [
        { from: [9, 16], to: [9, 13], shift: 0 }, // Insel A (links)
        { from: [36, 16], to: [36, 12], shift: 6 }, // Insel B (rechts)
        { from: [37, 2.1], to: [37, 0.3], shift: 3 }, // von Insel B hinaus zum Durchgang am oberen Rand (dort liegt sie im Durchgang an)
      ],
      drift: [
        { from: [1, 17], to: [1, 28], r: 0.55, period: 110 },
        { from: [15, 1], to: [32, 1], r: 0.6, period: 160 },
        { from: [44, 25], to: [44, 34], r: 0.45, period: 100 }, // an der Fjordmündung
      ],
    },
    // Tag und Nacht (siehe season.js): die Angaben der Nacht ersetzen die oben
    seasons: {
      day: {},
      night: {
        rows: freezeSea(ICE_ROWS, 3, ICE_HOLES, [ICE_SEA_LANE]),
        iceHoles: ICE_HOLES, // dort erscheinen die Pinguine nachts meistens
        // nachts ruft die Schneeeule: immer genau eine, oben in einer Tanne (nicht über spawn, siehe updateOwl in IceCatch.js)
        // Schneehase und Rentier nur tagsüber (Ausgleich für Schneeeule und Eisbär, die es nur nachts gibt)
        spawn: { population: 9, weights: { penguin: 1, seal: 0.6, arcticfox: 0.3, walrus: 0.45, polarbear: 0.35 } },
        floes: null, // die Schollen sind ins Eis eingefroren
        seaIce: ['sea_ice0', 'sea_ice1', 'sea_ice2'], // helle, glatte Eisfläche (tools/sea-ice.py)
        night: true, // dunkel, Polarlicht am Himmel, warmes Licht an der Station (siehe Weather.js)
        // so viele Minuten draußen, bis Henrik zu kalt zum Fangen ist; so viele Sekunden in der Station, bis er wieder warm ist
        cold: { minutes: 3, warmSeconds: 3 },
      },
    },
  },

  // Aquarium: eigene Zone hinter der Fassade oben links im Tierpark. Eine Halle (Gebäude ohne Dach, man ist immer drin)
  // mit zwei Wassertanks an der Rückwand; darin schwimmen Zierfische (siehe TankFish.js) zwischen Pflanzen und Deko.
  aquarium: {
    name: tr('Aquarium', 'Aquarium'),
    // große Halle: links zwei Becken (Riff-Fische, Seepferdchen), oben an der Wand ein großes Becken; in der Mitte ein
    // Mosaikweg mit Platz, Delfin-Statue, Bänken und Quallen-Lampen. Rechts durch den Durchgang (mittig in der Wand) Raum 2: hinten eine
    // riesige Beckenfront (Meeresschildkröten und Rochen, dazu die Zierfische), unten rechts ein kleines Krakenbecken. Unten rechts geht
    // es in Raum 3: abgedunkelt, mitten im Raum ein großes Becken voller leuchtender Quallen, rundherum ein Weg
    // (dark: siehe drawDarkRooms)
    rows: [
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
      'NZ..................ZNZMMMMMMMMMMMMMMNZ...........ZN',
      'N...MMMMMMMMMMMMMMMM.N.N.).)..(..)(.NN.............N',
      'N...N......?.(.?.(.N.N.N.)(?..?(../)NN.###########.N',
      'N...N(.)(".((.((..(N.N.N(".)).))..?.NN.#.........#.N',
      'N...N..)..)"...)..?N.N.N...).?...(..NN.#.MMMMMMM.#.N',
      'N...MMMMMMMMMMMMMMMMŁN.N..).....)"..NN.#.N.....N.#.N',
      'N.......#############N.MMMMMMMMMMMMMMN.#.N.....N.#.N',
      'N.MMMMMM#.....#.....###..............N.#.N.....N.#.N',
      'N.N.).)N#..Ł.Ɓ#Ɓ.Ł..#################N.#.N.....N.#ƁN',
      'N.N.?..N#...#####...###.Ɓ..#...Ɓ.Ł...N.#.N..?..N.#.N',
      'N.N(...N#...#####.Ɓ.ZN....Ł#.......#ZN.#.MMMMMMM.#.N',
      'N.MMMMMM######Ś##....NŁ....#.MMMMMM#.N.#.........#.N',
      'N.MMMMMM#...#####.Ɓ..N...Ł.#.N?.))N#.N############.N',
      'N.N(..(N#...#####....N..Ɓ..#.N....N#.N#............N',
      'N.N.().N#..Ł###..Ł...N.....#.N)..?N#.N#....Ɓ..Ɓ....N',
      'N.MMMMMM#..###.......N..Ɓ..#.MMMMMM#.N#............N',
      'N.......#.###Ł.Z....ZNZ....##########N#.Z.........ZN',
      'MMMMMMMMMMXXMMMMMMMMMM......#........MMMMMMMMMMMMMMM',
      '                     NMMMMM.#..................ZN   ',
      '                     NN...N.#...................N   ',
      '                     NN(..N.#.....Ɓ......Ɓ......N   ',
      '                     NN.?.N.#...................N   ',
      '                     NN..(N.#...................N   ',
      '                     NN...N.#...................N   ',
      '                     NN...N.#..Ł......Ł......Ł..N   ',
      '                     NN.(.N.#...................N   ',
      '                     NN..?N.#...................N   ',
      '                     NN...N.#...................N   ',
      '                     NN(..N.#.MMMMMMMMMMMMMMMM..N   ',
      '                     NN...N.#.N.(.....(....?.N..N   ',
      '                     NN..(N.#.N....(....?...(N..N   ',
      '                     NN?..N.#.N..(..?....(...N..N   ',
      '                     NMMMMM.#.MMMMMMMMMMMMMMMM..N   ',
      '                     N......###################.N   ',
      '                     NZ..........Ɓ.....Ɓ.....Ɓ.ZN   ',
      '                     MMMMMMMMMMMMMMMMMMMMMMMMMMMM   ',
    ],
    grass: ['floor_aquarium'],
    path: 'aq_path',
    start: { tx: 10, ty: 16 },
    // die Wassertanks sind die Becken: gefangene Riff-Fische und Seepferdchen ziehen beim Betreten des Tierparks ein
    enclosures: [
      // Schild unten an der vorderen Scheibe (signAt auf der Glaswand, signOnGlass: ohne Pfosten)
      { id: 'tankBig', name: tr('Großes Becken', 'Big Tank'), species: ['reeffish'], world: 'reef', seed: { tx: 6, ty: 3 }, slots: [20, 20], signAt: { tx: 11.5, ty: 6 }, signOnGlass: true },
      { id: 'tank1', name: tr('Becken', 'Tank'), species: ['reeffish'], world: 'reef', seed: { tx: 3, ty: 9 }, slots: [10, 10], signAt: { tx: 7, ty: 10 }, signOnGlass: true },
      { id: 'seahorses', name: tr('Seepferdchen-Becken', 'Seahorse Tank'), species: ['seahorse'], world: 'reef', seed: { tx: 4, ty: 14 }, slots: [6, 6], signAt: { tx: 7, ty: 14.5 }, signOnGlass: true },
      { id: 'turtles', name: tr('Schildkröten- und Rochenbecken', 'Turtle and Ray Tank'), species: ['turtle', 'ray'], world: 'reef', seed: { tx: 25, ty: 5 }, quota: { turtle: [4, 4], ray: [3, 3] }, signAt: { tx: 25.5, ty: 7 }, signOnGlass: true }, // die riesige Beckenfront
      { id: 'jellyfish', name: tr('Quallenbecken', 'Jellyfish Tank'), species: ['jellyfish'], world: 'reef', unlock: 'jellyfish', seed: { tx: 44, ty: 8 }, slots: [12, 12], signAt: { tx: 44, ty: 11 }, signOnGlass: true, dark: true },
      { id: 'octopus', name: tr('Krakenbecken', 'Octopus Tank'), species: ['octopus'], world: 'reef', seed: { tx: 31, ty: 14 }, slots: [3, 3], signAt: { tx: 31.5, ty: 16 }, signOnGlass: true },
      // Süßwasserhalle (docs/plan-angeln.md): je Welt ein Becken für die Angelfische (welches: fishTank in src/world/fishing.js)
      { id: 'fwCold', name: tr('Heimische und nordische Gewässer', 'Native and Northern Waters'), species: ['fish'], world: 'meadow', seed: { tx: 24, ty: 26 }, slots: [20, 20], signAt: { tx: 26, ty: 23 }, signOnGlass: true }, // Wiese, Wald, Eiswelt: lang an der linken Wand
      { id: 'fwWarm', name: tr('Tropische Flüsse', 'Tropical Rivers'), species: ['fish'], world: 'jungle', seed: { tx: 37, ty: 31 }, slots: [20, 20], signAt: { tx: 37.5, ty: 33 }, signOnGlass: true }, // Savanne, Dschungel: lang an der unteren Wand
    ],
    // Tanks zuerst: so gehören ihre Wände und ihr Boden zum Tank, nicht zur Halle. pathFloor: Mosaik auf dem Weg in der Halle
    buildings: [
      { tx0: 22, ty0: 19, tx1: 26, ty1: 33, style: 'tank', noRoof: true, noDeco: true }, // Süßwasserhalle (ohne Riff-Zierfische): großes Becken an der linken Wand
      { tx0: 30, ty0: 29, tx1: 45, ty1: 33, style: 'tank', noRoof: true, noDeco: true }, // ... und eins unten rechts an der unteren Wand
      { tx0: 4, ty0: 2, tx1: 19, ty1: 6, style: 'tank', noRoof: true },
      { tx0: 2, ty0: 8, tx1: 7, ty1: 12, style: 'tank', noRoof: true },
      { tx0: 2, ty0: 13, tx1: 7, ty1: 16, style: 'tank', noRoof: true },
      { tx0: 23, ty0: 1, tx1: 36, ty1: 7, style: 'tank', noRoof: true }, // Raum 2: riesige Beckenfront
      { tx0: 29, ty0: 12, tx1: 34, ty1: 16, style: 'tank', noRoof: true }, // Raum 2: Krakenbecken unten rechts, frei stehend
      { tx0: 0, ty0: 0, tx1: 21, ty1: 18, style: 'aquarium', noRoof: true, pathFloor: 'aq_path', visitors: true }, // Besucher laufen auf dem Mosaikweg
      { tx0: 41, ty0: 5, tx1: 47, ty1: 11, style: 'tank', noRoof: true, noDeco: true }, // Raum 3: Quallenbecken mitten im Raum (ohne Zierfische)
      { tx0: 21, ty0: 0, tx1: 37, ty1: 18, style: 'aquarium', noRoof: true, pathFloor: 'aq_path', visitors: true }, // Raum 2 (die Wand dazwischen gehört zur Halle)
      { tx0: 37, ty0: 0, tx1: 51, ty1: 18, style: 'aquarium', noRoof: true, pathFloor: 'aq_path', visitors: true, dark: true }, // Raum 3, abgedunkelt
      { tx0: 21, ty0: 18, tx1: 48, ty1: 36, style: 'aquarium', noRoof: true, pathFloor: 'aq_path', visitors: true }, // Süßwasserhalle unter Raum 2 und 3 (zu Raum 2 hin offen: eine große Halle)
    ],
    // freischaltbar: der Durchgang in den dunklen Quallenraum öffnet sich, sobald man die erste Qualle fängt
    unlocks: [{ id: 'jellyfish', tx: 37, ty: 16, rows: ['#', '#'] }],
    chests: [],
    toolSpots: [],
    background: '#0b1a26',
    ambient: 'ambient_reef', // leise das Riff-Rauschen (wie unter Wasser)
    ambientVolume: 0.18,
    exits: [
      { tx: 10, ty: 18, to: 'park2', arrive: { tx: 2, ty: 15 }, label: tr('Tierpark', 'Zoo') },
      { tx: 11, ty: 18, to: 'park2', arrive: { tx: 2, ty: 15 }, label: tr('Tierpark', 'Zoo') },
    ],
    spawn: { population: 0, weights: {} }, // die Zierfische sind keine Tiere
  },

  // Haupthaus (siehe docs/plan-haupthaus.md): Henriks eigener Raum hinter der Tür des Haupthauses im Zentrum. Ein Raum ohne
  // Dach (man ist immer drin); alle Möbel samt Computer (Events) setzt man selbst (Bauen, Katalog „Möbel“, siehe indoor in
  // decor.js, Hauptrechner: houseComputers). Kein Auto, keine Weltkarte, keine Besucher; zurück durch die Tür unten.
  house: {
    name: tr('Haupthaus', 'Main Building'),
    rows: [
      'MMMMMMMMMMMMMMMM',
      'N..............N',
      'N..............N',
      'N..............N',
      'N..............N',
      'N..............N',
      'N..............N',
      'N..............N',
      'N..............N',
      'N..............N',
      'N..............N',
      'MMMMMMMXXMMMMMMM',
    ],
    grass: ['floor_office'],
    path: 'floor_office',
    start: { tx: 7, ty: 10 },
    buildings: [{ tx0: 0, ty0: 0, tx1: 15, ty1: 11, style: 'office', noRoof: true }],
    chests: [],
    toolSpots: [],
    background: '#3a2e24',
    ambient: 'ambient_meadow', // leise Vögel draußen
    ambientVolume: 0.08,
    exits: [
      { tx: 7, ty: 11, to: 'park', arrive: { tx: 29, ty: 17 }, label: tr('Tierpark', 'Zoo') },
      { tx: 8, ty: 11, to: 'park', arrive: { tx: 30, ty: 17 }, label: tr('Tierpark', 'Zoo') },
    ],
    spawn: { population: 0, weights: {} },
  },

  // Unterwasserwelt: ein buntes Riff vor Australien. Henrik schwimmt (schwebt über dem Meeresboden), Fischschwärme ziehen
  // umher (Deko wie im Aquarium, nicht fangbar). Hin und zurück nur mit dem U-Boot (Schnellreise); die Werkzeuge liegen im
  // Sack am Meeresboden.
  reef: {
    name: tr('Riff', 'Reef'),
    // Schnellreise: ein kleines U-Boot, das über dem Meeresboden schwebt (float: so hoch, in Pixeln)
    car: { tx: 18.16, ty: 14.5, texture: 'boat_zoo', frame: 0, scale: 1.5, float: 30 },
    map: { x: 89, y: 66, icon: 'reeffish' }, // Great Barrier Reef vor Australien (Clownfisch)
    rows: [
'ÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖ',
      'ÖÜÜÜßäôßÛôûÜûöüÖäÜôÖßüÖÖäâÖÜöÜäßâûÛÖüÖ',
      'ÖÜß.ßß...û..........û......ö.ûâ..ä..üÖ',
      'Öâßß.ßüßßßâ....§ôû.............§...üüÖ',
      'Öüößßß.ß.ßä..ü.....üä.â....Ü.Û.§ü?..öÖ',
      'Öâû..ö.ß.ß........ö.âöâ..ä.ä.ä..ô...ßÖ',
      'Öû..ßßß.../.....û.ûâö.....Û..ü°.ä..§ÖÖ',
      'Öü.......üÛ....../°ö......öä...â..ô.ûÖ',
      'Öä...ßß..ßöûôô....ö......Ûô?.ôü.û...ûÖ',
      'Öû/..ô....ûÛ......Û..ä.äûôâû.ö....ü.äÖ',
      'Öü.........ô.âä......°..ôÛöÜ..ä...ö.ÖÖ',
      'ÖÖ.../.ä...ââ...û..û.....âü..ü.ü.â°ÜäÖ',
      'Öä........ô................äôâ..ö...ÖÖ',
      'ÖÛ...û....âû..ü........ö....§....â..äÖ',
      'Öäââ.âû.....§../........û....ä.ô.°ô.âÖ',
      'Öü..öâ.....â.Ûö.........Û.......§...äÖ',
      'Öü.ôô..ö...../...........ûûö§.ôä...ûöÖ',
      'Öü.â.äôÛô...§...Ä.........äü........ûÖ',
      'Öö....ôä.......ô..........ô.........ÖÖ',
      'Öâ.......ö...äô.......ä....§........ûÖ',
      'Ööü..öâ.......ô....äü.Ü?ûöüä..û.....âÖ',
      'Öû..........öô...§.....°ô.ä..üû.ô...ÖÖ',
      'ÖÖ...................Û.ä.ö...û......ÜÖ',
      'ÖÛ..?Û.ô.ô..ä.Ü..â..û.ô......Üûö....ôÖ',
      'Öä..§.ö.Ü.....üÜ..ô.Û......ä.öüôö...ÜÖ',
      'Öß.ä.ü.Üü.û..ô..Ü........Ü.â..üüü..§äÖ',
      'Öö..öä.ûö..........ü.öû......ô°§.ö.§âÖ',
      'Öä....û.ä....?...â...û.......öä..û..ûÖ',
      'Öä.û...â...........Ûô......ô........âÖ',
      'Öä.....û..........ô......â°..û.â°...ÖÖ',
      'ÖüûÖäôäûÖöäÜüÖöûäüüüäâÖôôÜöÛöäôöûââäôÖ',
      'ÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖ',
    ],
    grass: ['reef_sand0', 'reef_sand1', 'reef_sand2'],
    path: 'reef_path',
    // Flecken anderer Böden über dem Sand (amount: ungefährer Anteil der Fläche)
    patches: [{ ground: 'reef_seagrass', amount: 0.18 }, { ground: 'reef_gravel', amount: 0.15 }, { ground: 'reef_algae', amount: 0.12 }, { ground: 'reef_dark', amount: 0.15 }],
    start: { tx: 19, ty: 16 },
    enclosures: [],
    chests: [
      { tx: 16, ty: 17, tools: ['net', 'scissors'], anchor: true }, // Werkzeug-Sack (Kescher, Schere)
    ],
    hero: 'hero_swim', // Henrik im Taucheranzug
    ambient: 'ambient_reef',
    sea: { fish: 60, fishHeight: [24, 120], fishScale: 0.6 }, // unter Wasser: Figur schwimmt, Fischschwärme, Lichtstrahlen, Bläschen
    background: '#0e3a5c',
    toolSpots: [],
    exits: [],
    // Riff-Fische: 22 Arten, alle gleich häufig (siehe ReefFish.js); eine Gruppe zählt als ein Platz.
    // Seepferdchen verstecken sich in den Korallen (siehe Seahorse.js)
    // Kraken tarnen sich am Boden (siehe Octopus.js); Meeresschildkröten sind selten und höchstens eine zugleich (im Netz, siehe Turtle.js)
    // Rochen gleiten in großen Bögen, höchstens zwei zugleich (fangen durch Mitschwimmen, siehe Ray.js)
    spawn: { population: 15, weights: { reeffish: 1, seahorse: 0.3, octopus: 0.2, turtle: 0.1, ray: 0.2 } },
  },
};

// Tierpark: alle Gehege aus allen Welten, in drei Abschnitte geteilt (jeder ein eigenes Level, damit der Aufbau auf dem
// Handy schnell geht): Zentrum mit Wiese und Wald (park), Savanne mit dem Aquarium (park2), Bambuswald mit dem Dschungel
// (park3). Zu Fuß geht es vom Zentrum oben in die Savanne und unten in den Bambuswald, sonst mit dem Auto (jeder
// Abschnitt hat eins). Gefangene Tiere ziehen beim Betreten eines Abschnitts in ihr Gehege ein, auch wenn es in einem
// anderen Abschnitt liegt (siehe moveFollowersIntoPens in GardenScene).
// Unten steht der ganze Tierpark als eine Karte (Savanne oben, Wald links, Wiese rechts, Asien unten); alle Angaben
// sind in ihren Kacheln geschrieben, parkSection() schneidet daraus die Abschnitte und rechnet die Kacheln um.
// Rechts neben dem Zentrum liegt die Eiswelt (park4, siehe docs/plan-eiswelt.md, eigene Karte PARK_ICE_ROWS): man geht
// rechts am Streichelzoo vorbei hinüber.
export const PARK_LEVELS = ['park', 'park2', 'park3', 'park4'];
export const isPark = (id) => PARK_LEVELS.includes(id);

const PARK_ROWS = [
      '         f.g.b.f.33333333333333333333333333333333333333333333333333333333333333333333333333',
      '         .b..g..T3[[[[[[[[[[[[GG[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[3',
      '         g.K.f.b.3].v....A....≠≠.ƚ......A....................v......v....................]3',
      '         f...b.g.3]..A..y.....≠≠...A.......v....ƚƚ.......A.....R..........ƚƚ..y...Ʋ......]3',
      '         .g.T..K.3]...ƚ......[GG[....y............ƚ....Ţ...........y.................y...]3',
      '         b..f.g..3]........A.]≠≠]...........A.................ƚ.........Ţ................]3',
      '         .f.g.b.T3[[[[[G[[[[[[GG[[[[[[[[[[...........y.........ƚ...............ƚ......A..]3',
      '         g.b..f..3].........].≠≠...y.....]................y.......Ʋ.............ƚ........]3',
      '         VVVVVVVV3]..Ǎ....ƭ.].≠≠..A....y.][[.............................................]3',
      '        Vbbbbbbbb3].....Ș...].≠≠≠≠≠≠≠≠≠≠≠G≠G≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠..........v]3',
      '        V.T..f.K.3]......Ʊ..].≠≠≠≠≠≠≠≠≠≠≠G≠G≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠...........]3',
      '        Vg..f.T.f3].........]............][[................................≠≠.....ƚ.....]3',
      '        Vf.b....g3].Ʈ..Ʊ..Ǎ.]....y...Ʀ...]...v.ƚ..y.A...........y...........≠≠......ƚ....]3',
      '        Vl.Kf.g..3].........]..........A.]....ƚ.......................A.....≠≠...........]3',
      '        V.g..f.b.3[[[[[[[[[[[[[[[[[[[[[[[[[[[G[[[[........................y.≠≠......A....]3',
      '        `########################################]...y..v.......ooooo.......≠≠...........]3',
      '        Vgff3...........---G---.#.v.....v...F.v.#][[[[[[[[[[[..ooooooo......≠≠..ƚ........]3',
      '        Vlfb3.......y...|.....|.#........A....v.############].ooooooooo.....≠≠....y......]3',
      '        V3333...........|..u..|.#..y.....y....v.############]..ooooooo......≠≠........Ţ..]3',
      'g.f.b.g.f.b.3...........|.....|.#........yyy....#][[[[[[[[[[[...oooo.....v..≠≠...A.......]3',
      'b..T..f.K.g.3...........|y.y..|.#...............#]..ƚ.......................≠≠.y.........]3',
      '.K..g.b..T..3........y..-------.#..R.....vA..y..#].ƚ..Ʋ...............ƚƚ....≠≠.........v.]3',
      'f.g..f..g.f.3..y........y...y..y#v...........R..#[[[[[[[[[[[[[[[[[[[[[[[[[[[GG[[[[[[[[[[[[3',
      '[[[[[[[[[[[[[[.........################################b33333333333333333333333333333333333',
      '222k2DDk222]P;^^^^^^^;.#............###--------MMMMMMM|b',
      '2D22kD222DD]P;.......;.#..y.y.v.....###|.%.....N.C...N|b',
      '2kD2222k22k]D;.P...ɫ.;.#.D.y......v.###|.~~....N....CN|b',
      '22k2k22k2D2]D;.......;.#...Av..A.A..###|.~~~...N.....N|b',
      'DkD222k2k2k]D;L...ww.;.#.......y....###|..~~...MMMGMMM|b',
      '222D2k2k2k2]P;....ww.;.#......y.....###|...%.......g..|b',
      '222k2Dk2222]n;.ɫ.....;.#b.........b.###|.....bb.......|b',
      'k2D22k2k2D2]D;......*;.#.MMMMMMMMM..###|g.....b..b....|b',
      'D22DD222222]ḩ;^^^G^^^;.#.NZ...z.sN..###|b.b....g..g..b|b',
      'kD222D22222]P..D.#.2DP]#.N...VYV.N..###|..............|b',
      '[[[[[[[[[[[[.....#.1P.]#.N.......N..###|..............|b',
      ']ḩmkP..###########..Ț.]#.NVt.....N..###|..............|b',
      ']-----|#........#..DPD]#.Ndix....N..###|....T.........|b',
      ']....k|#........#..D..]#.Ns.....ZN..###|..............|b',
      ']..Ø..|#g...ƃ...#....n]#.MMMMGGMMM.####|..@...........|b',
      '].....|#..%...f.#.ḫ1..]#bg.#####.fb####G...f......T...|b',
      '].n...|#.ooo...F#.....]#..f#####g..####G..............|X',
      '].....G#.oooo...######G################|..............|b',
      ']..ʬ..|#ƃ.ooo%..######G###############W|.........f....|b',
      '].....|#...ooo..#.....]##........######|F.............|b',
      '].m...|#.n...oo.#.P2nḩ]#.........######|..............|b',
      ']...L.|#f.....~~#.D.D.]#.........######----------------b',
      ']-----|#....g..~B.PP1D]#......n.....###.....ff.b.b...g.b',
      '].PD...#........B~2Ɍ..]#.......n.n..###.b..gf.T.....bTbb',
      ']ḫ.D.############~kP.n]#....m.m...m.########g^^^^^^^^^^b',
      ']----G--|...|-G--ȹȹ-|P]#..D.........###..f.#.;........;b',
      '].......|..P|....ww.|.]#............###g.g.#.;........;b',
      '].n....m|P..|.ƀ.%wwn|n]#......mm..q.###....#g;........;b',
      '].......|..k|m...ww.|P]#.m.P..0K.K..###g..g#.;....b...;b',
      ']...U...|P.ḫ|..Ƅwww.|P]#............###...b##G........;b',
      '].......|D1.|...www.|D]#....n.q..l..###.bb.#.G.....*..;b',
      '].k...n.|1..|%...wwƀ|P]#..n.q.......###..T.##;...w.w..;b',
      ']..D....|.P.|....ww.|.]#....ll......###..fb.#;........;b',
      ']-------|P..|----ȹȹ-|.]#...q.qq.....###b.b..#;........;b',
      ']P..DḫP.n..ḫ..PDP~~ḩ.ḫ]#...........####..f..#^^^^^^^^^^b',
      '][[[[[[[[[[[[[[[[ȸȸ[[[]################################b    555555555555555555555555555555555555',
      '            5QQooooooooooooooooooo.Q..#.QQQ............bbbbbǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧ5',
      '            TQoooooooooooooooooooo..K.I..QQ[[[[[[[[[[[[[[[[bǦľ.ľľ..n......ľŔŔŔŔŔŔŔŔŔn..ľ.Ḣ..ľ.Ǧ5',
      '            5ooQ.....q.....q.JooooVVV######]...Q..........]bǦ......nn.nľľqľŔŔŔrŴrŔŔŔ....ľľ..qľǦ5',
      '            Too.hhh.r..9......ooooVVV#ẑẑẑ.#].......Q....K.]bǦ.ľnn...ľqľnqn..ľoooooo.Ḣ.......n.Ǧ5',
      '            5oo.hhh....q...L..ooooVVV#ẑrẑl#]....K.........]bǦľ.nnn..Ǫ.ľqľǪ.ľooooooooo.ľḢ.ľ....Ǧ5',
      '            Toor.h...J........oooo####ẑẑẑ.#]..8.....Q.....]bǦ..ľJľľľ.ľ.ḟ###ooooooooooo.ľ.ľn.ľḟǦ5',
      '            5oo........q...O..oooo#ţ##.9..#]9....7.......Q]bǦľ...ľ.ľ...ľ#ľľooooooooooo.J...ḟľľǦ5',
      '            Too..9.ǧǧǧǧǧǧ.....oooo###ţ....#G..............]bǦ.ľ..ľ.....q#ľ..oooooooooonľq..n..Ǧ5',
      '            5oo....Ǧ####Ǧǧǧǧǧǧoooo#ţ##....#G..q...q....q..]bǦn.qľn.....ľ#..ľḟoooooooo...ḟľqľ..Ǧ5',
      '            Tooq...Ǧ##########EEEE#########]..............]bǦ...n.Jľ.ľ.ľ#ľ.qJ..ooooo....J....ľǦ5',
      '            5oo.H..Ǧ####Ǧǧǧǧǧǧoooo...K#.q.#[[[[[[[[[[[[[[[[bǦľľǪľľ+.ľľľ.#ľḢ.q..nqJľ..ľ..ľľ.ľľľǦ5',
      '            Too....Ǧ####Ǧ..9..oooo...l#l..#W...........bbb##G#..ḟ.ľqnǫľq#Ǫľ...qǫ.....nqḟḟ.....Ǧ5',
      '            5oo.9..ǧǧǧǧǧǧ.....ooooK...#.QQ##################G#############################...qǦ5',
      '            Too..q....J....r..oooo....#.QQ#[[[[[[[[[[[[b....Ǧḟ.ǫnǪn.....ľľ.ľ.....q..ǫľ.qn#ľ.ľ.Ǧ5',
      '            5oo.J......9...q..oooo.K..#...#]..........]b.q..Ǧ.n..ľn.JľǫJ..ľľ...ľ+.ľ...ľn.#....Ǧ5',
      '            Too....r.......J..oooo...l#l..#G..q....Q..]b....Ǧ...ľľ.ľ.ľľ...ľ.J.q...ľ...q..#.+.ľǦ5',
      '            5oo..9.....q...L..oooo....#..K#G....w...Q.]b.K..Ǧ.ľľ..ľľľ...ľľľḢ.ľnḟľľľǪ.Ḣ...#.n..Ǧ5',
      '            Too.....q.....r...oooo....#...#]..www8....]b....Ǧ.....ľľ..q.nḟľľľnnľ.ľľľ..ľ.n#ǫ..ľǦ5',
      '            5Qo[[[[[[[G[[[[[[[oooo....#...#]...ww...Q.]b....Ǧ.ľ.qľľ..ľ..nḢľľ...ḟ......ǫ.n#.ľ..Ǧ5',
      '            T.#############################].L....r...]b....Ǧ.MMMMMM.MMMMMM.MMMMMM.MMMMMM#Ḣ+.ľǦ5',
      '            5...l...l...l...l...l..#l...l..]..........]b..l.ǦľNḢľnrN.Nẅnľ.N.NľḢrnN.N...(N#ľJ..Ǧ5',
      '            T.K...q...K...q...K..Q.#.....QQ[[[[[[[[[[[[b....Ǧ.NqL.ľN.Nľ.ẅnN.NqL.ľN.N(...N#...ľǦ5',
      '            bbbbbbbbbbbbbbbbbbbbbbbXbbbbbbbbbbbbbbbbbbbb....Ǧ.Nn.qrN.NrnľẅN.NrnḟľN.N....N#Ḣǫ..Ǧ5',
      '            5.K.....l..q....l..K...#5ľ.n..q.ľ...n.q..ľ.5....Ǧ.MMMMMM.MMMMMM.MMMMMM.MMMMMM#nḟľ.Ǧ5',
      '            5###############################################G#############################.ľľ.Ǧ5',
      '            5....q..l....q..l..K....5..K.....l....l..K......Ǧ...n.ǫ..ľľľn..#.ǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǦ5',
      '            5[[[G[[[[[[[G[[[[[[[G[[[5.....q.......q.........Ǧnnn+ľJḟnǪ.ǫḢǪ.#ľǦnľľ.ľ.......ľ...Ǧ5',
      '            5]....K].......].......]5.K...............K.....Ǧ..ľ.ľľn....ľ..#ľǦ....Oľ.....ľ....Ǧ5',
      '            5]l....].......]..O....]5......l....l........K..Ǧ.ľ..qľ...n....#ľǦľ..J...JJ..nľJn.Ǧ5',
      '            5].....]...r...].......]5..q.............q......Ǧ....q...Ḣ...q.#ľǦľľ.Jľ.ľľľ.n..ľ..Ǧ5',
      '            5]q....].......].....O.]5K......K....K....K....qǦ..Jľľ.ḟľ....Jľ#.Ǧ.ľľ....ľ....ľ.ľnǦ5',
      '            5].....].Ƨ...rƧ].......]5....l........l.........Ǧ.qḢ.q..Ǫľľ.n..#ľǦ..J...ľJ..ľJJ...Ǧ5',
      '            5].K...].......].......]5.......................Ǧ...ľ.Ḣľľľľ.ľľn##G.ľľ....ľľ...O...Ǧ5',
      '            5]....q]..Ʃ....]...r...]5.q..K...l....K..q....l.Ǧqn...ľ.......ľḟqǦ....ľľ..ľ..ľ....Ǧ5',
      '            5]....l].......].......]5......q.....q..........Ǧ..ľ.n.ľqľnnnnľnqǦ..ľ...Jľ.ľľ.ľ...Ǧ5',
      '            5]..n..].......].......]5K...............K......Ǧľq.ľqnnľľľ..ľ.ľľǦ.....ľľľnnľľľ..ľǦ5',
      '            5[[[[[[[[[[[[[[[[[[[[[[[5QQ.K..QQ...QQ..K.Q.....ǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧǧ5',
      '            555555555555555555555555555555555555555555555555555555555555555555555555555555555555',
];

// Eiswelt (park4): eigene Karte, gezeichnet von tools/park-ice-map.py
const PARK_ICE_ROWS = [
  'ṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩ',
  'ṩ[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[ṩ',
  'ṩ]......Ṗ.]Ṗ.......ȓ]wwwwwwwwwwwwwwwww....]ṩ',
  'ṩ].Ȟ......].........]wwwwwwÊwwwwwwwwww....]ṩ',
  'ṩ]........].........]wwwwwwwwwwwwwwwww..Ȓ.]ṩ',
  'ṩ]...Ṗ.Ȓ..]...Ȓ.....]wwwÊwwwwwwwwwwwww....]ṩ',
  'ṩ]........].......Ṗ.]wwwwwwwwwwwwwwwww....]ṩ',
  'ṩ]..ȓ.....[[[[[[G[[[[[[[[[[[[[[[[[wwww....]ṩ',
  'ṩ]........G######################]wwww....]ṩ',
  'ṩ]Ṗ.....ȓ.]#ǩǩǩǩǩǩǩǩǩǩǩǩǩǩǩǩǩǩǩ.#]wwww.Ȓ..]ṩ',
  'ṩ[[[[[[[[[[#Ǩwwwwww.Ȓ..Ʒ......ǩǩ#]........]ṩ',
  'ṩ]Ṗ.......]#Ǩwwwwww....Ʒ..Ɵ....Ǩ#]........]ṩ',
  'ṩ]......Ṗ.]#Ǩwwwwww..ȓ.ƷȒ....Ṗ.Ǩ#G........]ṩ',
  'ṩ]...U....]#Ǩwwwwww....Ʒ.......Ǩ#].ȓ.....ȓ]ṩ',
  'ṩ]........G#Ǩwwwwww....Ʒ.......Ǩ#]........]ṩ',
  'ṩ]........]#Ǩwwwwww.Ê..G....Ȓ..Ǩ#[[[[[[[[[[ṩ',
  'ṩ].Ȓ.....ȓ]#Ǩwww.......ƷȞ.....ṖǨ#F.........ṩ',
  'ṩ[[[[[[[[[[#Ǩwww.Ê.ȓ...Ʒ.......Ǩ#..........ṩ',
  'ṩ..........#Ǩ.........ȒƷ..ȓ....Ǩ#..........ṩ',
  'ṩ..........#ǩǯǯǯǯǯǯǯǯǯǯǯF....Ṗ.Ǩ#..........ṩ',
  'ṩ..........#G##############....Ǩ#[[[[[[[[[[ṩ',
  'ṩ..........#G##############....Ǩ#]w.......]ṩ',
  'ṩ......F...#Ǩ....ȓ..##......Ṗ..Ǩ#]w.......]ṩ',
  'ṩ........W.#Ǩ.Ṗ.....##...Ȟ.....Ǩ#]w....Ȓ..]ṩ',
  'X###########Ǩ...Ȓ...####....ȓ..Ǩ#]w.......]ṩ',
  'X###########Ǩ.......####......ǩǩ#]w.......]ṩ',
  'ṩ.......#..#ǩǩǩǩǩǩǩǩGGǩǩǩǩǩǩǩǩǩ.#]w......Ṗ]ṩ',
  'ṩ.......#..######################]w.ȓ.....]ṩ',
  'ṩ[[[[[[[G[[[[[[[[[[[[[[[[[[G[[[[[[w.......]ṩ',
  'ṩ]...................]wwwww.wwwwwww.......]ṩ',
  'ṩ].........Ȓ.......ȓ.]....................]ṩ',
  'ṩ]...Ṗ...............]...............wwww.]ṩ',
  'ṩ]...................].....ȓ..Ȟ......wwww.]ṩ',
  'ṩ]...........Ṗ.......]...............wwww.]ṩ',
  'ṩ]......ȓ.......Ṗ....].............Ȓ.wwww.]ṩ',
  'ṩ]...................]..Ṗ.................]ṩ',
  'ṩ].ȓ.................]...........Ê........]ṩ',
  'ṩ[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[ṩ',
  'ṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩṩ',
];

// ground/water: Boden und Teichwasser im Gehege, passend zur Welt, aus der die Tiere kommen
// Gehege: slots = Plätze [vor, nach dem Ausbau]; basic = so sieht es vor dem Ausbau aus (Innenzaun bzw. ohne Ausstattung);
// upgrade = was der Ausbau am Hauptrechner bringt (siehe penLevel in state.js)
// Jedes Gehege liegt in dem Abschnitt, in dem sein Startpunkt (seed) liegt; freie ohne Startpunkt sagen es selbst (section)
const PARK_PENS = [
      // Safari (siehe docs/plan-safari.md): die Savannentiere leben frei in einem großen Gelände hinter dem Wildzaun. Besucher
      // fahren mit Autos auf der Piste hindurch (safariCars beim Abschnitt) oder gehen auf dem Fußweg mit Zaun bis ans
      // Wasserloch; Henrik läuft oder fährt E-Roller und geht durch das Tor am Vorplatz hinein. Die Piste führt durch den
      // Raubtierbereich: Löwen (rechts) und Hyänen mit den Geiern am Elefantenfriedhof (links), dazwischen ein Zaun. Wie im
      // ganzen Tierpark gilt immer das normale Wetter.
      // Wasserloch ohne Zaun (steht vor der Safari, damit Wasser und Ufer zum Wasserloch zählen): Nilpferde und Krokodile
      { id: 'waterhole', name: tr('Wasserloch', 'Watering Hole'), species: ['hippo', 'crocodile'], pond: true, shore: 1, signAt: { tx: 75, ty: 17 }, world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 66, ty: 17 }, quota: { hippo: [3, 4], crocodile: [2, 3] } }, // Schild an der Haltebucht der Piste
      // das offene Gelände: Tore sind nur die eigenen (gateTiles: Einfahrt, äußere Schleusentore, Tor am Vorplatz, Ausfahrt), nicht
      // die der Gehege darin. lookOver: Besucher schauen auch von Wegen außerhalb über den Zaun (Vorplatz, Fußweg).
      // noSign: keine große Tafel; signs: Schilder mit einem Teil der Tiere (spot: Kachel; am Zaun hängen sie am Zaun). Hier
      // hängt für jede Tierart ein eigenes Schild nebeneinander am Zaun des Fußwegs, zur Safari hin.
      // zones: Lieblingsorte der Tierarten (r in Kacheln); dort halten sie sich gern auf, laufen aber überall hin
      { id: 'safari', name: tr('Safari', 'Safari'), species: ['antelope', 'zebra', 'giraffe', 'gnu', 'warthog'],
        open: true, lookOver: true, gate: 'tall', gateTiles: [{ tx: 30, ty: 1 }, { tx: 31, ty: 1 }, { tx: 30, ty: 4 }, { tx: 31, ty: 4 }, { tx: 43, ty: 9 }, { tx: 43, ty: 10 }, { tx: 45, ty: 14 }, { tx: 76, ty: 22 }, { tx: 77, ty: 22 }],
        noSign: true,
        signs: ['zebra', 'gnu', 'antelope', 'giraffe', 'warthog'].map((s, i) => ({ spot: { tx: 50 + i * 2, ty: 16 }, species: [s] })),
        zones: { giraffe: { tx: 26, ty: 3, r: 8 }, zebra: { tx: 62, ty: 5, r: 11 }, gnu: { tx: 66, ty: 6, r: 11 }, antelope: { tx: 54, ty: 12, r: 10 }, warthog: { tx: 58, ty: 20, r: 8 } },
        toysAt: [{ tx: 23, ty: 4 }, { tx: 57, ty: 12 }, { tx: 67, ty: 12 }], // Heuhäuschen direkt an der Piste, bei der Haltebucht Grasebene
        world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 50, ty: 5 }, quota: { antelope: [5, 8], zebra: [5, 8], giraffe: [3, 5], gnu: [6, 9], warthog: [3, 5] } },
      { id: 'lion', name: tr('Löwengehege', 'Lion Enclosure'), species: ['lion'], gate: 'tall', signAt: { tx: 35, ty: 14 }, world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 35, ty: 12 }, slots: [3, 5] }, // die Piste fährt mitten hindurch (Schleusen im Norden und Osten); Schild am Zaun zum Vorplatz
      { id: 'hyenas', name: tr('Elefantenfriedhof', 'Elephant Graveyard'), species: ['hyena', 'vulture'], gate: 'tall', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 24, ty: 11 }, quota: { hyena: [4, 6], vulture: [3, 5] }, noSign: true, signs: [{ spot: { tx: 22, ty: 14 }, species: ['hyena'] }, { spot: { tx: 24, ty: 14 }, species: ['vulture'] }] }, // Geier sitzen auf den kahlen Akazien; je ein Schild am Zaun zum Weg
      { id: 'meerkat', name: tr('Erdmännchenbau', 'Meerkat Burrow'), species: ['meerkat'], world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 25, ty: 17 }, slots: [5, 8], upgrade: tr('Erdhügel', 'Dirt mounds'), basic: [[27, 18, ':'], [28, 19, '<']] }, // am Vorplatz
      // Wildpark (siehe docs/plan-wildpark.md): ein großer Wald hinter dem Wildzaun mit Tor und Torbogen (arches). Rehe und
      // Elche laufen darin frei herum, auch über die Wege; die übrigen Waldtiere haben eigene Gehege darin. Der Wildpark
      // selbst ist kein Gehege, sondern ein offener Bereich (open): Besucher gehen durch das große Tor (visitors), laufen
      // auf den Wegen und schauen von dort den Rehen zu; später darf man dort auch Deko setzen. Das Dickicht in basic
      // gehört zum (abgeschalteten) Gehegeausbau.
      // Teich auf der Lichtung (ohne Zaun): Fische im Wasser, Frösche am Ufer (shore). Steht vor dem Wildpark, damit Wasser
      // und Ufer zum Teich zählen und nicht zum Wildpark.
      { id: 'clearingpond', name: tr('Teich', 'Pond'), species: ['frog'], pond: true, shore: 1, signAt: { tx: 8, ty: 39 }, signKey: 'pond', world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 10, ty: 41 }, quota: { frog: [6, 9] }, upgrade: tr('Schilf am Teich', 'Reeds by the pond'), basic: [[10, 39, '.'], [13, 42, '.']] },
      { id: 'deerpark', name: tr('Wildpark', 'Wildlife Park'), species: ['deer', 'elk'], // Rehe und Elche laufen frei herum
        open: true, decor: true, gate: 'tall', gateTiles: [{ tx: 22, ty: 41 }, { tx: 22, ty: 42 }], visitors: true, toysAt: [{ tx: 9, ty: 37 }], // Schilder für Reh und Elch am Außenzaun neben dem Tor (nicht drinnen am Weg beim Futterautomaten); Futterraufe auf der Lichtung
        world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 18, ty: 41 }, quota: { deer: [6, 9], elk: [2, 3] }, upgrade: tr('Dickicht lichten', 'Clear the thicket'), basic: [[17, 36, '5'], [18, 36, 'D'], [17, 37, 'ḩ'], [18, 37, 'D'], [20, 37, 'D'], [21, 37, '5'], [17, 38, '5'], [18, 38, 'ḩ'], [19, 38, 'D'], [20, 38, 'ḩ'], [21, 38, 'k'], [17, 39, 'k'], [20, 39, 'D'], [21, 39, 'ḩ'], [17, 43, '5'], [18, 43, 'ḫ'], [19, 43, 'ḩ'], [20, 43, 'D'], [21, 43, 'k'], [17, 44, 'k'], [20, 44, '5'], [17, 45, 'k'], [19, 45, 'k'], [21, 45, 'k']] },
      // Wildschwein an der Lichtung: durchwühlter Boden, Eiche und ein großes Schlammloch zum Suhlen (siehe Boar.js)
      { id: 'boarpen', name: tr('Wildschweingehege', 'Wild Boar Enclosure'), species: ['boar'], world: 'forest', ground: ['boar_ground0', 'boar_ground1', 'boar_ground2'], seed: { tx: 3, ty: 40 }, slots: [4, 6], upgrade: tr('Dickicht lichten', 'Clear the thicket'), basic: [[2, 44, 'ḩ'], [3, 44, 'D'], [4, 44, 'ḫ'], [5, 44, 'ḫ'], [2, 45, 'k'], [3, 45, 'ḩ'], [5, 45, '5']] },
      { id: 'foxden', name: tr('Fuchsbau', 'Fox Den'), species: ['fox'], world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 3, ty: 51 }, slots: [3, 5], upgrade: tr('Dickicht lichten', 'Clear the thicket'), basic: [[3, 55, '5'], [4, 55, 'ḫ'], [5, 55, 'ḫ'], [6, 55, 'ḩ'], [7, 55, 'ḫ'], [2, 56, 'k'], [4, 56, 'ḩ'], [5, 56, 'k'], [6, 56, 'D'], [7, 56, 'ḩ']] },
      // Biber am Bach: der Bach kommt unten durch den Außenzaun, fließt durch das Gehege und weiter in den Teich auf der Lichtung
      // (die Id stammt noch vom alten Teich mit Fröschen, Fischen und Bibern, damit dessen Ausbau erhalten bleibt)
      { id: 'forestpond', name: tr('Biberbach', 'Beaver Brook'), species: ['beaver'], world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 15, ty: 51 }, slots: [3, 5], upgrade: tr('Dickicht lichten', 'Clear the thicket'), basic: [[13, 54, 'k'], [14, 54, 'k'], [15, 54, 'k'], [14, 55, 'k'], [15, 55, 'k'], [16, 55, 'ḩ'], [13, 56, 'k'], [14, 56, 'D'], [15, 56, '5'], [16, 56, 'k']] },
      { id: 'wolves', name: tr('Wolfswald', 'Wolf Woods'), species: ['wolf'], gate: 'tall', world: 'forest', unlock: 'wolves', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 6, ty: 30 }, slots: [6, 9], upgrade: tr('Heulfelsen', 'Howling rock'), basic: [[5, 28, '.']] },
      { id: 'forestaviary', name: tr('Eichhörnchen- und Igel-Voliere', 'Squirrel and Hedgehog Aviary'), species: ['squirrel', 'hedgehog'], // Igel vorerst hier
        netRoof: true, gate: 'net', world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 16, ty: 28 }, slots: [5, 8], upgrade: tr('Dickicht lichten', 'Clear the thicket'), basic: [[14, 25, '5'], [15, 25, 'ḩ'], [16, 25, 'D'], [17, 25, 'k'], [14, 26, 'ḩ'], [16, 26, 'k'], [17, 26, 'ḫ'], [14, 27, 'k'], [15, 27, '5'], [16, 27, 'k'], [17, 27, 'ḫ']] },
      // Streichelzoo (siehe docs/plan-streichelzoo.md): das Katzenhaus steht darin, Besucher gehen hinein (petting, visitors)
      { id: 'cats', name: tr('Katzenhaus', 'Cat House'), species: ['cat'], gate: 'glass', petting: true, visitors: true, world: 'meadow', seed: { tx: 50, ty: 26 }, slots: [4, 6], upgrade: tr('Zweiter Kratzbaum', 'Second cat tree'), basic: [[52, 26, ':']] },
      // Hoftiere laufen frei, Besucher gehen durchs Tor hinein und streicheln sie (Id bleibt vom alten Schafgehege)
      { id: 'pasture', name: tr('Streichelzoo', 'Petting Zoo'), species: ['sheep', 'goat', 'pig', 'cow'], open: true, petting: true, visitors: true,
        gateTiles: [{ tx: 39, ty: 39 }, { tx: 39, ty: 40 }], world: 'meadow', seed: { tx: 40, ty: 34 }, quota: { sheep: [14, 14], goat: [5, 5], pig: [4, 4], cow: [3, 3] } },
      { id: 'aviary', name: tr('Reiher-Voliere', 'Heron Aviary'), species: ['heron'], netRoof: true, gate: 'net', world: 'meadow', seed: { tx: 47, ty: 55 }, slots: [6, 9], upgrade: tr('Zweiter Flügel mit Nistkasten und Wasserstelle', 'Second wing with a nest box and a water hole'), basic: [[50, 49, ';'], [50, 50, ';'], [50, 51, ';'], [50, 52, ';'], [50, 53, ';'], [50, 54, ';'], [50, 55, ';'], [50, 56, ';'], [50, 57, ';'], [51, 54, '.'], [51, 55, '.']] }, // vor dem Ausbau: Netz zwischen den Flügeln
      { id: 'flamingos', name: tr('Flamingos', 'Flamingos'), species: ['flamingo'], netRoof: true, gate: 'net', world: 'park', unlock: 'flamingo', seed: { tx: 27, ty: 50 }, slots: [6, 9], upgrade: tr('Großer See mit Springbrunnen', 'Big lake with a fountain'), basic: [[30, 52, 'w'], [28, 51, ':'], [28, 52, '<'], [28, 53, '.'], [32, 51, '.'], [32, 52, '.'], [32, 53, '.'], [29, 50, '.'], [29, 54, '.'], [30, 50, '.'], [30, 54, '.'], [31, 50, '.'], [31, 54, '.'], [27, 49, '.'], [33, 49, '.'], [27, 55, '.'], [33, 55, '.']] },
      // Pfauen haben kein Gehege: sie laufen frei im Tierpark herum (höchstens 8, kein Ausbau)
      { id: 'peacocks', name: tr('Pfauen', 'Peacocks'), species: ['peacock'], world: 'asia', free: true, slots: [8, 8], section: 'park3' },
      { id: 'butterflies', name: tr('Schmetterlinge', 'Butterflies'), species: ['butterfly'], world: 'meadow', free: true, slots: [4, 4], section: 'park' }, // flattern frei durch den Park (die meisten in der Tropenhalle, hallbutterflies)
      { id: 'tigers', name: tr('Tigergehege', 'Tiger Enclosure'), species: ['tiger'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 49, ty: 78 }, slots: [3, 5], upgrade: tr('Badebecken mit Spielball', 'Pool with a play ball'), basic: [[47, 77, ':'], [48, 77, '<'], [47, 78, '.'], [48, 78, '.'], [46, 77, '.'], [48, 76, '.'], [49, 77, '.']] },
      { id: 'pandas', name: tr('Pandagehege', 'Panda Enclosure'), species: ['panda', 'redpanda'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 48, ty: 66 }, quota: { panda: [2, 4], redpanda: [3, 5] }, upgrade: tr('Reifenschaukel und Spielball', 'Tire swing and play ball'), basic: [[49, 66, ':'], [46, 65, '<']] }, // rote Pandas wohnen mit im (verbreiterten) Gehege
      // Affeninsel (siehe docs/plan-bambuswald.md): alle Affen leben zusammen auf einer Insel im Koi-Teich (Wassergraben statt
      // Zaun, moat). Nur die Südseite ist Land mit Zaun und Tor (dort Streicheln, Füttern, Tierfreunde). Ein Steg mit
      // Glaswänden führt über die Brücke mitten auf die Insel in den Glaspavillon, aus dem die Besucher ringsum zuschauen.
      // zones: Lieblingsorte (Makaken an der heißen Quelle, Orang-Utans bei den Urwaldbäumen, Gorillas im Süden)
      { id: 'monkeys', name: tr('Affeninsel', 'Monkey Island'), species: ['macaque', 'orangutan', 'howler', 'gorilla'], moat: true, gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 16, ty: 62 },
        quota: { macaque: [6, 6], orangutan: [5, 5], howler: [13, 13], gorilla: [5, 5] }, // (Gibbons zählen zu den Brüllaffen)
        zones: { macaque: { tx: 17, ty: 64, r: 4 }, orangutan: { tx: 26, ty: 74, r: 5 }, gorilla: { tx: 19, ty: 75, r: 5 } } },
      // Tropenhalle (siehe docs/plan-dschungel.md): der ganze Dschungel-Teil ist eine große Glashalle mit Glasdach, voller
      // Dschungelpflanzen. Durch die beiden Eingänge mit Lamellenvorhang (gate 'curtain') gehen auch die Besucher, auf dem
      // Holzsteg (Weg der Bodenzone) durch die Halle. Aras, Tukane, Ameisenbären, Tapire, Okapis und eine kleine Gruppe
      // Brüllaffen leben frei darin (open, wie im Wildpark). canopy: diese Arten bleiben oben in den Urwaldbäumen (die
      // Brüllaffen, eine zweite Gruppe neben der auf der Affeninsel). zones: Lieblingsorte (Tapire am Teich unter dem
      // Wasserfall, Okapis oben links, Ameisenbären unten links). mist: hier läuft der Sprühnebel (siehe JungleHall.js)
      { id: 'junglehall', name: tr('Tropenhalle', 'Tropical Hall'), species: ['macaw', 'toucan', 'anteater', 'tapir', 'okapi', 'howler', 'dartfrog'],
        open: true, visitors: true, gate: 'curtain', gateTiles: [{ tx: 60, ty: 71 }, { tx: 60, ty: 72 }, { tx: 60, ty: 84 }], canopy: ['howler'],
        toysAt: [{ tx: 64, ty: 89 }, { tx: 70, ty: 93 }, { tx: 78, ty: 74 }, { tx: 83, ty: 71 }, { tx: 74, ty: 68 }], // siehe PEN_TOYS
        zones: { tapir: { tx: 80, ty: 69, r: 5 }, okapi: { tx: 65, ty: 66, r: 6 }, anteater: { tx: 66, ty: 90, r: 7 } },
        world: 'jungle', ground: ['jgrass0', 'jgrass1', 'jgrass2'], seed: { tx: 63, ty: 75 },
        quota: { macaw: [9, 9], toucan: [6, 6], anteater: [5, 5], tapir: [4, 4], okapi: [4, 4], howler: [5, 5], dartfrog: [12, 12] } }, // Pfeilgiftfrösche (Leuchtnacht) krabbeln frei durch die ganze Halle
      // Jaguar hinter Glas unten rechts in der Halle (Glastür am Steg)
      { id: 'jaguars', name: tr('Jaguar-Gehege', 'Jaguar Enclosure'), species: ['jaguar'], gate: 'glass', world: 'jungle', ground: ['jgrass0', 'jgrass1', 'jgrass2'], seed: { tx: 86, ty: 90 }, slots: [4, 4] },
      // Terrarien und Piranha-Becken am unteren Steg (Glaskästen wie früher im Reptilienhaus, buildings beim Abschnitt)
      { id: 'snakes', name: tr('Schlangen-Terrarium', 'Snake Terrarium'), species: ['snake'], world: 'jungle', seed: { tx: 65, ty: 81 }, slots: [4, 4], signAt: { tx: 64.5, ty: 83.6 }, signOnGlass: true },
      { id: 'tarantulas', name: tr('Spinnen-Terrarium', 'Spider Terrarium'), species: ['tarantula'], world: 'jungle', seed: { tx: 71, ty: 81 }, slots: [4, 4], signAt: { tx: 71.5, ty: 83.6 }, signOnGlass: true },
      { id: 'iguanas', name: tr('Leguan-Terrarium', 'Iguana Terrarium'), species: ['iguana'], world: 'jungle', seed: { tx: 79, ty: 81 }, slots: [3, 3], signAt: { tx: 78.5, ty: 83.6 }, signOnGlass: true },
      { id: 'piranhas', name: tr('Piranha-Becken', 'Piranha Tank'), species: ['piranha'], world: 'jungle', seed: { tx: 85, ty: 81 }, slots: [6, 6], signAt: { tx: 85.5, ty: 83.6 }, signOnGlass: true },
      // Schmetterlinge in der Tropenhalle (2/3 aller Schmetterlinge, der Rest im Zentrum): frei, aber nur in der Halle
      // (within), sitzen gern auf den Obsttellern
      { id: 'hallbutterflies', name: tr('Schmetterlinge', 'Butterflies'), species: ['butterfly'], world: 'meadow', free: true, slots: [8, 8], section: 'park3', within: { tx0: 61, tx1: 93, ty0: 61, ty1: 95 } },
      // Bambuswald, unten links (Zeilen 83 bis 97, am Weg zum Dschungel): Tanuki-Garten mit Steinlaternen, Yak-Weide mit
      // Gebetsfahnen und Stupa, Schneeleoparden-Felsen mit Sonnenfelsen (im Tierpark ohne Schnee: alle auf Wiese)
      { id: 'tanukis', name: tr('Tanuki-Garten', 'Tanuki Garden'), species: ['tanuki'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 16, ty: 90 }, slots: [3, 5], upgrade: tr('Mehr Steinlaternen und ein Kirschbaum', 'More stone lanterns and a cherry tree'), basic: [[16, 89, ':'], [17, 91, '<'], [15, 92, '.']] },
      { id: 'yaks', name: tr('Yak-Weide', 'Yak Pasture'), species: ['yak'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 23, ty: 90 }, slots: [4, 5], upgrade: tr('Eine kleine Stupa', 'A small stupa'), basic: [[22, 93, ':'], [24, 94, '<']] },
      { id: 'snowleopards', name: tr('Schneeleoparden-Felsen', 'Snow Leopard Rocks'), species: ['snowleopard'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 31, ty: 91 }, slots: [2, 3], upgrade: tr('Ein zweiter Sonnenfelsen', 'A second sunning rock'), basic: [[33, 90, ':'], [32, 91, '<']] },
      // Koi-Teich: das Wasser rund um die Affeninsel samt der Brücke zum Glaspavillon (dort füttern die Besucher die Koi)
      { id: 'koipond', name: tr('Koi-Teich', 'Koi Pond'), seed: { tx: 31, ty: 65 }, species: ['koi'], pond: true, signAt: { tx: 34, ty: 70 }, signKey: 'koi', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], water: ['asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water1', 'asia_water2'], slots: [6, 9] },
      // Eiswelt (park4, siehe docs/plan-eiswelt.md; eigene Karte PARK_ICE_ROWS aus tools/park-ice-map.py, Kacheln dieser
      // Karte, daher section: 'park4'): die Polarhalle steht in der Mitte (Glas
      // wie die Tropenhalle, mit der großen Treppe hinunter zur Unterwasser-Scheibe), ein Rundweg führt um sie herum, außen
      // liegen die Gehege: Polarwölfe und Polarfüchse links, Schneehasen oben, Robben & Walrosse oben rechts, Eisbären
      // hinter einem Wassergraben unten rechts, Rentiere unten links. Kein Tag und keine Nacht: Eule und Eisbär sind einfach da.
      // Pinguinbecken in der Halle (Glas, Pflegertür); steht vor der Halle, damit seine Kacheln nicht zur Halle zählen
      { id: 'penguins', name: tr('Pinguinbecken', 'Penguin Pool'), species: ['penguin'], gate: 'glasslow', world: 'ice', section: 'park4', seed: { tx: 20, ty: 13 }, slots: [10, 10], signAt: { tx: 18.5, ty: 19.6 }, signOnGlass: true },
      // Polarhalle: Papageitaucher und Schneeeulen fliegen frei unter dem Glasdach (zwischen Felsen und Tannen, siehe
      // hallFlight.js); Besucher gehen durch die Glastür links oben hinein und auf dem Holzsteg bis zur Treppe; eine zweite
      // Glastür unten, wo der Steg vor der Treppe an der Wand endet, führt auf den Rundweg unten
      { id: 'polarhall', name: tr('Polarhalle', 'Polar Hall'), species: ['puffin', 'snowowl'], open: true, visitors: true, gate: 'glassdoor', gateTiles: [{ tx: 12, ty: 20 }, { tx: 12, ty: 21 }, { tx: 20, ty: 26 }, { tx: 21, ty: 26 }],
        world: 'ice', section: 'park4', seed: { tx: 27, ty: 14 }, quota: { puffin: [8, 8], snowowl: [2, 2] } },
      // Robben und Walrosse zusammen im langen Außenbecken mit Kiesstrand; unter der Halle schwimmen sie hinter der
      // großen Scheibe vorbei (siehe UnderwaterWindow.js)
      { id: 'sealpool', name: tr('Robben & Walrosse', 'Seals & Walruses'), species: ['seal', 'walrus'], gate: 'tall', world: 'ice', section: 'park4', seed: { tx: 39, ty: 6 }, quota: { seal: [5, 5], walrus: [3, 3] } },
      { id: 'arcticwolves', name: tr('Polarwölfe', 'Arctic Wolves'), species: ['arcticwolf'], gate: 'tall', world: 'ice', section: 'park4', seed: { tx: 5, ty: 6 }, slots: [5, 5] },
      { id: 'arcticfoxes', name: tr('Polarfuchsbau', 'Arctic Fox Den'), species: ['arcticfox'], gate: 'tall', world: 'ice', section: 'park4', seed: { tx: 4, ty: 12 }, slots: [4, 4] },
      { id: 'snowhares', name: tr('Schneehasen', 'Snowshoe Hares'), species: ['snowhare'], gate: 'tall', world: 'ice', section: 'park4', seed: { tx: 16, ty: 4 }, slots: [6, 6] },
      // Eisbären: Tundra mit Badebecken, vorne ein Wassergraben (das Pflegertor hat eine Lücke im Graben)
      { id: 'polarbears', name: tr('Eisbären-Anlage', 'Polar Bear Enclosure'), species: ['polarbear'], gate: 'tall', world: 'ice', section: 'park4', seed: { tx: 37, ty: 25 }, slots: [3, 3] },
      { id: 'reindeer', name: tr('Rentier-Gehege', 'Reindeer Enclosure'), species: ['reindeer'], gate: 'tall', world: 'ice', section: 'park4', seed: { tx: 12, ty: 32 }, slots: [8, 8] },
];

// freischaltbar: Gehege, die mit dem ersten Tier ihrer Art entstehen (je im Abschnitt, in dem ihre Kacheln liegen)
const PARK_UNLOCKS = [
  // der erste Wolf: am linken Kartenrand im Wald-Bereich entsteht der Wolfswald (dahinter dunkler Wald, siehe backdrops)
  { id: 'wolves', tx: 0, ty: 23, rows: ['[[[[[[[[[[[[', 'PPDPDPPPPPP]', '.DPDPPPDPPP]', '.D..PDPP.nP]', 'PPP........]', '.D...O...n.]', 'PD..Py.D..y]', 'DPP.....L..]', 'PP.R...n...]', 'Py.....m...]', 'PP.D.......]', '[[[[[[[[[G[['] },
  // das Flamingo-Gehege entsteht, sobald man den ersten Flamingo fängt (Event „Flamingo-Flug“)
  { id: 'flamingo', tx: 24, ty: 43, rows: ['#....##..###', '.....##..###', '.....##..###', '.....##.....', 'b^^^^GG^^^^^', '.;.........;', '.;.f.....g.;', '.;...www...;', '.;..wwwww..;', '.;..wwwww..;', '.;..wwwww..;', '.;...www...;', '.;.g.....f.;', '.;.........;', 'b^^^^^^^^^^^', '............'] },
];

// in welchem Abschnitt eine Kachel der ganzen Karte liegt (die Eiswelt hat ihre eigene Karte, ihre Gehege sagen section)
const sectionOf = (ty) => (ty <= 22 ? 'park2' : ty >= 60 ? 'park3' : 'park');

// Kacheln einer Angabe um (dx, dy) verschieben: tx/ty, Rechtecke (tx0 … ty1), die Dreiergruppen in basic und at: [tx, ty]
// (Richtungen wie dir bleiben, wie sie sind)
function shiftDef(v, dx, dy) {
  if (Array.isArray(v)) return v.map((x) => shiftDef(x, dx, dy));
  if (!v || typeof v !== 'object') return v;
  const out = {};
  for (const [k, x] of Object.entries(v)) {
    if (k === 'dir') out[k] = x;
    else if (['tx', 'tx0', 'tx1'].includes(k)) out[k] = x + dx;
    else if (['ty', 'ty0', 'ty1'].includes(k)) out[k] = x + dy;
    else if (k === 'basic') out[k] = x.map(([tx, ty, c]) => [tx + dx, ty + dy, c]);
    else if (k === 'at') out[k] = [x[0] + dx, x[1] + dy];
    else out[k] = shiftDef(x, dx, dy);
  }
  return out;
}

// Randzeile an einer Schnittkante (beginnt bei Spalte x0): Füller, an den Wegen (Spalten xs) ein Übergang X
const edgeRow = (x0, fill, xs) => [...fill].map((c, i) => (xs.includes(x0 + i) ? 'X' : c)).join('');

// Ein Abschnitt: Ausschnitt x0..x1, y0..y1 der ganzen Karte. edits: [tx, ty, Zeichen] ändern die Karte vorher (Randzeilen,
// zugemachte Ausgänge). Alle anderen Angaben in Kacheln der ganzen Karte, nur exits schon in Kacheln des Abschnitts
// (ihr arrive gehört zum Ziel). tiles: andere Kartentabelle als PARK_ROWS (die Eiswelt)
function parkSection(id, { x0, x1, y0, y1, edits, exits, tiles = PARK_ROWS, ...def }) {
  const rows = [...tiles];
  for (const [tx, ty, s] of edits) rows[ty] = rows[ty].slice(0, tx) + s + rows[ty].slice(tx + s.length);
  return {
    grass: ['grass0', 'grass1', 'grass2'],
    path: 'park_path',
    ambient: 'ambient_meadow',
    background: '#4f8a2f',
    toolSpots: [],
    spawn: { population: 0, weights: {} },
    ...shiftDef(
      {
        ...def,
        enclosures: PARK_PENS.filter((e) => (e.section ?? sectionOf(e.seed.ty)) === id),
        unlocks: PARK_UNLOCKS.filter((u) => sectionOf(u.ty) === id),
      },
      -x0,
      -y0,
    ),
    rows: rows.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1)),
    exits,
  };
}

// Zentrum: Haupthaus, Wiese (rechts) und Wald (links). Oben geht es in die Savanne, unten in den Bambuswald
LEVELS.park = parkSection('park', {
  x0: 0, x1: 55, y0: 22, y1: 60,
  edits: [
    [0, 22, edgeRow(0, '2'.repeat(23) + '4'.repeat(33), [32, 48])],
    [0, 60, edgeRow(0, '2'.repeat(23) + '4'.repeat(33), [38])],
    [55, 40, 'b'], // ... und auf die Wiese
    [39, 46, '################X'], // Weg rechts am Streichelzoo vorbei in die Eiswelt (park4)
    [39, 47, '################X'],
    // Haupthaus: nur noch Fassade (das Innere ist ein eigenes Level, siehe LEVELS.house); innen gesperrt und leer
    ...[32, 33, 34, 35, 36, 37].map((ty) => [26, ty, 'VVVVVVV']),
    ...[28, 29, 30].map((ty) => [34, ty, 'VV']), // Stall (stableBox) rechts hinter dem Haupthaus: gesperrt
    [51, 30, 'F'], // Futterautomat im Streichelzoo neben dem Katzenhaus
    [39, 49, 'F'], // ... und unten am Weg zwischen Flamingos und Reiher-Voliere (nicht neben dem Auto)
  ],
  name: tr('Tierpark', 'Zoo'),
  part: { name: tr('Zentrum', 'Center'), icon: 'hero' }, // Feld im Tierpark-Schild der Weltkarte
  // Torbögen über den großen Toren von Wildpark und Streichelzoo (Mitte zwischen den beiden Torkacheln), Name je nach Sprache
  arches: [{ key: 'wildpark_arch', tx: 22, ty: 41.5, label: tr('Wildpark', 'Wildlife Park') }, { key: 'wildpark_arch', tx: 39, ty: 39.5, label: tr('Streichelzoo', 'Petting Zoo') }],
  bridgeStyle: 'wood', // Holzbrücke über den Bach im Wildpark
  // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
  car: { tx: 34, ty: 44, texture: 'car_zoo', frame: 0, scale: 1.26 },
  map: { x: 20, y: 33, icon: 'hero' }, // der Tierpark ist das Zuhause der Spielfigur (in Nordamerika, dort ist Platz für das große Schild)
  start: { tx: 29, ty: 40 }, // Spielstart: auf dem Vorplatz vor dem Haupthaus
  // Randstreifen: Boden der Welt, deren Gehege dort stehen (Zäune, Füller und Zwischenräume)
  // (im Wildpark Waldweg statt Pflaster)
  grounds: [{ area: { tx0: 0, tx1: 22, ty0: 22, ty1: 60 }, ground: ['fgrass0', 'fgrass1', 'fgrass2'], path: 'forest_path' }],
  // große Bilder jenseits des Kartenrands (ganz hinten): der dunkle Wald hinter dem Wolfswald; Kachel und ihr Punkt im Bild
  backdrops: [{ key: 'wolf_forest_edge', tx: 0, ty: 29, ox: 560, oy: 400 }],
  // Katzenhaus mit Glaswänden (begehbar, Dach wird beim Betreten durchsichtig) und das Haupthaus in der Mitte (facade: nur
  // Fassade mit Tür, die Tür führt ins Level house; das Dach bleibt zu, man sieht nicht hinein)
  buildings: [{ tx0: 47, ty0: 24, tx1: 53, ty1: 28, style: 'cathouse' }, { tx0: 25, ty0: 31, tx1: 33, ty1: 38, style: 'office', facade: true }],
  // Eisstand-Event: der Eiswagen steht mitten im Park unterhalb des Hauptwegs (die Plätze oberhalb sind für feste Buden)
  iceStand: { tx: 26, ty: 44 },
  // Mavis Buden-Aufgabe: hierhin zeigt ihr Pfeil (vor dem Haupthaus links vom Weg zur Tür, weit genug weg vom Auto – dort
  // ginge sonst die Karte auf)
  boothHint: { tx: 25, ty: 40 },
  // frühere feste Bauplätze für Buden (nur noch für alte Spielstände; Buden setzt man jetzt frei, siehe src/world/shops.js)
  legacySlots: [{ id: 'center1', tx: 25, ty: 43 }, { id: 'center2', tx: 33, ty: 40 }],
  // Stall (Reittiere, E-Roller): Scheune rechts hinter dem Haupthaus (Platzhalter-Zeichnung), Tor zum Weg nach rechts unten;
  // stable ist der Platz vor dem Tor (Aktionstaste, Mavi), stableBox die gesperrten Kacheln
  stable: { tx: 36, ty: 29.5 },
  stableBox: { tx0: 34, ty0: 28, tx1: 35, ty1: 30 },
  scooterSpot: { tx: 27, ty: 39 }, // E-Roller: abgestellt an der Hauswand links neben der Tür des Haupthauses
  // Riesenrad (vorerst gestrichen – es passte nicht zur isometrischen Ansicht; der Code in src/world/FerrisWheel.js bleibt):
  // großer Bauplatz auf der Wiese über dem Haupthaus, am Weg zur Savanne (2×2 Kacheln ab tx/ty; clear: dort stehen dann
  // keine Bäume und Büsche). Zum Wiederaufnehmen diese Zeile einschalten und die Bilder in BootScene wieder laden.
  // wheelSlot: { id: 'wheel', tx: 29, ty: 25, clear: { tx0: 25, tx1: 34, ty0: 24, ty1: 29 } },
  houseDoor: { tx: 29.5, ty: 38 }, // Tür des Haupthauses (Mavis Pfeil, wenn es drinnen weitergeht)
  // Futterautomaten: von jedem Gehege höchstens etwa 20 Kacheln Fußweg (Andre, 27.11.2026)
  feeders: [{ tx: 40, ty: 43, world: 'meadow' }, { tx: 15, ty: 40, world: 'forest' }, { tx: 51, ty: 30, world: 'meadow' }, { tx: 39, ty: 49, world: 'meadow' }],
  // Themenbereiche: am großen Wegweiser in der Mitte zeigen die Bretter dorthin
  signScale: 1.25,
  sections: [
    { label: tr('Savanne', 'Savanna'), tx: 40, ty: 22 },
    { label: tr('Aquarium', 'Aquarium'), tx: 40, ty: 22, like: tr('Savanne', 'Savanna') }, // der Weg dorthin führt durch die Savanne
    { label: tr('Wald', 'Forest'), tx: 12, ty: 41 },
    { label: tr('Wiese', 'Meadow'), tx: 46, ty: 41 },
    { label: tr('Bambuswald', 'Bamboo Forest'), tx: 38, ty: 60 },
    { label: tr('Dschungel', 'Jungle'), tx: 38, ty: 60, like: tr('Bambuswald', 'Bamboo Forest') }, // der Weg dorthin führt durch den Bambuswald
    { label: tr('Eiswelt', 'Ice World'), tx: 55, ty: 46.5 },
  ],
  exits: [
    { tx: 32, ty: 0, to: 'park2', arrive: { tx: 24, ty: 22 }, label: tr('Savanne & Aquarium', 'Savanna & Aquarium') },
    { tx: 48, ty: 0, to: 'park2', arrive: { tx: 40, ty: 22 }, label: tr('Savanne & Aquarium', 'Savanna & Aquarium') },
    { tx: 38, ty: 38, to: 'park3', arrive: { tx: 26, ty: 1 }, label: tr('Bambuswald & Dschungel', 'Bamboo Forest & Jungle') },
    { tx: 29, ty: 16, to: 'house', arrive: { tx: 7, ty: 10 }, label: tr('Haupthaus', 'Main Building') }, // Tür des Haupthauses
    { tx: 30, ty: 16, to: 'house', arrive: { tx: 8, ty: 10 }, label: tr('Haupthaus', 'Main Building') },
    { tx: 55, ty: 24, to: 'park4', arrive: { tx: 1, ty: 24 }, label: tr('Eiswelt', 'Ice World') },
    { tx: 55, ty: 25, to: 'park4', arrive: { tx: 1, ty: 25 }, label: tr('Eiswelt', 'Ice World') },
  ],
});

// Savanne mit dem Aquarium (Tür in der Fassade oben links). Unten geht es zurück ins Zentrum
LEVELS.park2 = parkSection('park2', {
  x0: 8, x1: 90, y0: 0, y1: 24, // die Safari reicht weiter nach rechts als die alten Gehege
  edits: [
    [34, 0, '3'], // früher der Ausgang in die Savanne
    [8, 23, edgeRow(8, '3'.repeat(47), [32, 48])],
    [8, 24, ' '.repeat(83)], // (rechts daneben beginnt die Eiswelt)
    [33, 21, 'W'], // Wegweiser an der Kreuzung beim Auto
    [29, 2, 'F'], // Futterautomat in der Safari an der Piste, beim Tor der Hyänen
    [47, 8, 'F'], // ... und an der Piste Richtung Wasserloch
  ],
  name: tr('Tierpark: Savanne & Aquarium', 'Zoo: Savanna & Aquarium'),
  background: '#b89a52', // Farbe außerhalb der Karte (trockenes Gras)
  part: { name: tr('Savanne & Aquarium', 'Savanna & Aquarium'), icon: 'giraffe' },
  car: { tx: 37.16, ty: 19.32, texture: 'car_zoo', frame: 0, scale: 1.26 },
  start: { tx: 32, ty: 22 },
  grounds: [
    { area: { tx0: 8, tx1: 16, ty0: 0, ty1: 18 }, ground: ['grass0', 'grass1', 'grass2'] }, // Wiese ums Aquarium (vor der Savanne, die erste Fläche gilt)
    { area: { tx0: 8, tx1: 90, ty0: 0, ty1: 24 }, ground: ['sgrass0', 'sgrass1', 'sgrass2'] }, // Vorplatz und Safari
  ],
  // Fische im Pflaster: von der Wegkreuzung oben bei der Savanne bis zum Aquarium, die Nasen zeigen dorthin
  pathMarks: [31, 28, 25, 22, 19, 16, 13].map((tx) => ({ tx, ty: 15, dir: { tx: -1, ty: 0 } })),
  // am Vorplatz neben dem Tor in die Safari; in der Safari an der Piste bei den Hyänen und Richtung Wasserloch (kurze Wege)
  feeders: [{ tx: 44, ty: 16, world: 'savanna' }, { tx: 29, ty: 2, world: 'savanna' }, { tx: 47, ty: 8, world: 'savanna' }],
  // Torbogen über dem Fußweg in die Safari (der Weg geht durch den Zaun, ohne Tor)
  arches: [{ key: 'wildpark_arch', tx: 49, ty: 17.5, label: tr('Safari', 'Safari') }],
  // Besucherautos auf der Piste (siehe SafariCars.js): Einfahrt hinten, Ausfahrt vorne rechts. Das Auto-Bild gibt es nur von
  // vorne, daher fährt die Piste nur nach unten (ty wächst) und nach rechts (tx wächst), immer auf die Kamera zu.
  // route: Ecken der Fahrspur (Mitte der zwei Kacheln breiten Piste); stops: Haltebuchten (Akazienhain, Raubtiere, Grasebene, Wasserloch)
  safariCars: {
    route: [{ tx: 30.5, ty: 0.3 }, { tx: 30.5, ty: 9.5 }, { tx: 76.5, ty: 9.5 }, { tx: 76.5, ty: 23 }],
    stops: [{ tx: 30.5, ty: 2.5 }, { tx: 35.5, ty: 9.5 }, { tx: 60, ty: 9.5 }, { tx: 76.5, ty: 17 }],
  },
  // Vorplatz: links, wo früher der Krokodilteich war, bleibt Platz für ein späteres Café (Spalten 14–18, Zeilen 17–21)
  scooterSpot: { tx: 30.75, ty: 17 }, // E-Roller: neben der Ecke des Erdmännchen-Zauns, etwas zum Zaun hin (nicht auf dem Weg)
  legacySlots: [{ id: 'savanna1', tx: 34, ty: 17 }, { id: 'savanna2', tx: 38, ty: 16 }], // beim Auto: links oben an der Kreuzung und rechts oben auf der freien Sandfläche zwischen Anhänger und Weg
  sections: [
    { label: tr('Aquarium', 'Aquarium'), tx: 8, ty: 15 },
    { label: tr('Zentrum', 'Center'), tx: 32, ty: 24 },
  ],
  exits: [
    { tx: 24, ty: 23, to: 'park', arrive: { tx: 32, ty: 1 }, label: tr('Zentrum', 'Center') },
    { tx: 40, ty: 23, to: 'park', arrive: { tx: 48, ty: 1 }, label: tr('Zentrum', 'Center') },
    { tx: 0, ty: 15, to: 'aquarium', arrive: { tx: 10, ty: 16 }, label: tr('Aquarium', 'Aquarium') }, // Tür in der Fassade oben links
  ],
});

// Bambuswald und rechts daneben die Tropenhalle (Dschungel). Oben geht es zurück ins Zentrum
LEVELS.park3 = parkSection('park3', {
  x0: 12, x1: 95, y0: 59, y1: 97, // rechts die Tropenhalle (Spalten 60 bis 94, Zeilen 60 bis 96), unten links ein Kirschgarten
  edits: [
    [12, 59, edgeRow(12, '5'.repeat(44), [38])],
    [35, 82, '#'], // Weg vom Bambuswald hinunter zu Tanuki-, Yak- und Schneeleoparden-Gehege
    [41, 67, 'F'], // Futterautomat am Weg neben dem Teehaus
    [58, 73, 'F'], // ... und am Weg vor der Tropenhalle
    [32, 83, 'F'], // ... am Weg unten bei Affeninsel, Tanukis, Yaks und Schneeleoparden
    [68, 83, 'F'], // ... und hinten in der Tropenhalle (zwischen den Terrarien, Richtung Jaguar)
    [76, 71, 'F'], // ... und vorne in der Tropenhalle am Steg (bei Tapiren, Teich und Obsttisch)
  ],
  name: tr('Tierpark: Bambuswald & Dschungel', 'Zoo: Bamboo Forest & Jungle'),
  part: { name: tr('Bambuswald & Dschungel', 'Bamboo Forest & Jungle'), icon: 'panda' },
  // mit dem Auto (Schnellreise) und beim Laden kommt man am Teehaus an, auf dem Weg neben der Terrasse
  car: { tx: 37.16, ty: 78.32, texture: 'car_zoo', frame: 0, scale: 1.26, arrive: { tx: 37, ty: 65 } }, // das Auto steht im Garten am Weg zum Teich
  start: { tx: 37, ty: 65 },
  feeders: [{ tx: 41, ty: 67, world: 'asia' }, { tx: 58, ty: 73, world: 'jungle' }, { tx: 32, ty: 83, world: 'asia' }, { tx: 68, ty: 83, world: 'jungle' }, { tx: 76, ty: 71, world: 'jungle' }],
  scooterSpot: { tx: 34, ty: 77 }, // E-Roller: im Gras neben dem Auto
  legacySlots: [{ id: 'asia1', tx: 37, ty: 74 }, { id: 'asia2', tx: 40, ty: 77 }], // (frühere Bauplätze: im Garten am Weg)
  grounds: [
    { area: { tx0: 12, tx1: 35, ty0: 83, ty1: 97 }, ground: ['agrass0', 'agrass1', 'agrass2'] }, // Tanuki-, Yak- und Schneeleoparden-Gehege
    // Tropenhalle: Dschungelboden, der Weg ist ein Holzsteg, klares Teichwasser (wie der Koi-Teich)
    { area: { tx0: 60, tx1: 95, ty0: 59, ty1: 97 }, ground: ['jgrass0', 'jgrass1', 'jgrass2'], path: 'planks_jungle', water: ['asia_water0', 'asia_water0', 'asia_water1'] },
    { area: { tx0: 12, tx1: 59, ty0: 59, ty1: 82 }, ground: ['agrass0', 'agrass1', 'agrass2'] }, // Asien-Bereich (mit dem breiteren Pandagehege)
    { area: { tx0: 36, tx1: 59, ty0: 83, ty1: 97 }, ground: ['agrass0', 'agrass1', 'agrass2'] }, // Kirschgarten (früher Tapir- und Okapi-Gehege) und der Rasen vor der Halle
  ],
  prayerFlags: [[{ tx: 21, ty: 91 }, { tx: 26, ty: 91 }]], // Gebetsfahnen über der Yak-Weide (mitten im Gehege, nicht vor dem Schild)
  // große Bilder über mehreren Kacheln (die Kacheln sind V): Teehaus am Teich mit Blick auf die Affeninsel
  // (glow: Lampions, die beim Laternenabend leuchten; Pixel über dem Fußpunkt)
  props: [{ key: 'teahouse', tx: 34, ty: 62, size: 3, originY: 106 / 154, glow: [{ dx: -104, dy: -41 }, { dx: 104, dy: -45 }] }], // Bild von Andre (tools/teahouse-sprites.py)
  // Teehaus (siehe docs/plan-bambuswald.md): Besucher holen sich Tee und trinken ihn an einem der Stehtische (ţ)
  teaHouse: { tx: 34, ty: 62, size: 3, tables: [{ tx: 35, ty: 66 }, { tx: 37, ty: 67 }, { tx: 35, ty: 68 }] },
  // Seilbrücke der roten Pandas: vom Kletterbaum im Pandagehege über den Weg zum Kletterbaum am Zen-Garten
  ropeBridge: { pen: 'pandas', from: { tx: 44, ty: 66 }, to: { tx: 39, ty: 66 } },
  lanterns: true, // hier läuft der Laternenabend (Event am Hauptrechner)
  // Tropenhalle (siehe docs/plan-dschungel.md, JungleHall.js): Fläche unter dem Glasdach (samt Wänden); dort laufen
  // Sprühnebel und Glasdach-Schatten
  jungleHall: { tx0: 60, tx1: 94, ty0: 60, ty1: 96 },
  ambientZone: { sound: 'ambient_jungle', area: { tx0: 60, tx1: 94, ty0: 60, ty1: 96 }, fade: 3 }, // in der Halle: Dschungel-Geräusche
  // Glaskästen am unteren Steg der Halle (wie früher im Reptilienhaus): Schlangen, Vogelspinnen (auf einem Sockel, raise wie
  // RAISE in tools/terrarium-glass.py), Leguane, Piranhas (Wassertank)
  buildings: [
    { tx0: 62, ty0: 79, tx1: 67, ty1: 83, style: 'terrarium', noRoof: true },
    { tx0: 69, ty0: 79, tx1: 74, ty1: 83, style: 'terrarium_raised', raise: 28, noRoof: true },
    { tx0: 76, ty0: 79, tx1: 81, ty1: 83, style: 'terrarium', noRoof: true },
    { tx0: 83, ty0: 79, tx1: 88, ty1: 83, style: 'tank', noRoof: true, noDeco: true },
  ],
  // Torbogen mit Schild über dem Glasgang am Ende der Brücke (Eingang zum Glaspavillon auf der Affeninsel)
  // und über dem Haupteingang der Tropenhalle (zwei Torkacheln, Lamellenvorhang)
  arches: [{ key: 'wildpark_arch', tx: 29.5, ty: 69, label: tr('Affeninsel', 'Monkey Island') }, { key: 'wildpark_arch', tx: 60, ty: 71.5, label: tr('Tropenhalle', 'Tropical Hall') }],
  sections: [
    // kleiner Wegweiser im Bambuswald an der Abzweigung zum Dschungel (at: nur an diesem Pfosten)
    { label: tr('Tropenhalle', 'Tropical Hall'), tx: 60, ty: 72, at: [43, 71] },
    { label: tr('Zentrum', 'Center'), tx: 38, ty: 59, at: [43, 71] },
  ],
  exits: [
    { tx: 26, ty: 0, to: 'park', arrive: { tx: 38, ty: 37 }, label: tr('Zentrum', 'Center') },
  ],
});

// Eiswelt (siehe docs/plan-eiswelt.md, Karte aus tools/park-ice-map.py): rechts neben dem Zentrum, man kommt auf dem Weg
// rechts am Streichelzoo vorbei durch den Eis-Torbogen. Schneeboden, leichter Schneefall, eigener Wind-Ton; kein Tag und
// keine Nacht. Schnellreise mit dem Schneemobil (Henrik fährt nicht selbst)
LEVELS.park4 = parkSection('park4', {
  tiles: PARK_ICE_ROWS,
  x0: 0, x1: 43, y0: 0, y1: 38,
  edits: [],
  name: tr('Tierpark: Eiswelt', 'Zoo: Ice World'),
  part: { name: tr('Eiswelt', 'Ice World'), icon: 'penguin' },
  grass: ['snow0', 'snow1', 'snow2'],
  path: 'snow_path',
  water: ['ice_water0', 'ice_water0', 'ice_water1'],
  background: '#d6e4ec',
  ambient: 'ambient_ice',
  ambientVolume: 0.22, // leiser als in der Eiswelt selbst (dort pfeift der Wind)
  stepSound: 'step_snow',
  snow: true, // es rieselt leicht Schnee (siehe Weather.js)
  // Schneemobil mit Anhänger (Bild von Andre, tools/snowmobile-cut.py) auf dem Platz am Eingang; der Anhänger ragt nach
  // hinten rechts (kleinere Zeilen), dort ist bis zum Fuchsgehege Platz
  car: { tx: 4, ty: 23, texture: 'car_snow', frame: 0, scale: 1.26 },
  start: { tx: 2, ty: 24 },
  grounds: [
    // Polarhalle: Holzsteg statt Schneeweg
    { area: { tx0: 12, tx1: 31, ty0: 9, ty1: 26 }, ground: ['snow0', 'snow1', 'snow2'], path: 'planks_ice' },
    // Kiesstrand im Robbenbecken
    { area: { tx0: 38, tx1: 41, ty0: 2, ty1: 14 }, ground: ['ice_beach0', 'ice_beach1', 'ice_beach2'], soft: 1.5 },
    { area: { tx0: 34, tx1: 37, ty0: 10, ty1: 14 }, ground: ['ice_beach0', 'ice_beach1', 'ice_beach2'], soft: 1.5 },
    // Tundra bei Rentieren, Eisbären und Wölfen
    { area: { tx0: 2, tx1: 20, ty0: 29, ty1: 36 }, ground: ['tundra0', 'tundra1', 'tundra2'], soft: 2 },
    { area: { tx0: 22, tx1: 41, ty0: 30, ty1: 36 }, ground: ['tundra0', 'tundra1', 'tundra2'], soft: 2 },
    { area: { tx0: 35, tx1: 41, ty0: 21, ty1: 29 }, ground: ['tundra0', 'tundra1', 'tundra2'], soft: 1.5 },
    { area: { tx0: 2, tx1: 9, ty0: 2, ty1: 9 }, ground: ['tundra0', 'tundra1', 'tundra2'], soft: 1.5 },
  ],
  // Polarhalle: Glasdach mit Streben wie die Tropenhalle, aber ohne Sprühnebel (siehe JungleHall.js)
  polarHall: { tx0: 12, tx1: 31, ty0: 9, ty1: 26 },
  // große Treppe in der Halle hinunter zur Unterwasser-Scheibe (flach im Boden, man läuft darüber; die Kacheln sind
  // Übergänge; Platzhalter-Bild aus tools/polar-stairs.py, stairs_ice)
  props: [{ key: 'stairs_ice', tx: 22, ty: 24, size: 2, originY: 0.5, floor: true }],
  feeders: [{ tx: 7, ty: 22, world: 'ice' }, { tx: 33, ty: 16, world: 'ice' }, { tx: 24, ty: 19, world: 'ice' }], // Fisch: am Platz beim Eingang, rechts am Rundweg unter dem Robbenbecken (kurze Wege zu Robben, Walrossen und Eisbären) und in der Polarhalle am Steg vor dem Pinguinbecken
  scooterSpot: { tx: 5, ty: 26 },
  // Torbogen über dem Weg gleich hinter dem Übergang (Platzhalter: der Bogen des Wildparks, später aus Eisblöcken)
  arches: [{ key: 'wildpark_arch', tx: 1, ty: 24.5, label: tr('Eiswelt', 'Ice World') }],
  sections: [
    { label: tr('Polarhalle', 'Polar Hall'), tx: 12, ty: 20.5 }, // Glastür links oben, wo der Holzsteg an der Wand endet
    { label: tr('Zentrum', 'Center'), tx: 0, ty: 24.5 },
  ],
  exits: [
    { tx: 0, ty: 24, to: 'park', arrive: { tx: 54, ty: 24 }, label: tr('Zentrum', 'Center') },
    { tx: 0, ty: 25, to: 'park', arrive: { tx: 54, ty: 25 }, label: tr('Zentrum', 'Center') },
    ...[[22, 24], [23, 24], [22, 25], [23, 25]].map(([tx, ty]) => ({ tx, ty, to: 'polarunder', arrive: { tx: 7, ty: 7 }, label: tr('Unterwasser-Scheibe', 'Underwater Window') })),
  ],
});

// Unter der Polarhalle (park4): ein dunkler Raum, hinten eine große Glasscheibe über die ganze Breite. Dahinter schwimmen
// die Robben und Walrosse aus dem Außenbecken in ganzer Gestalt vorbei (siehe UnderwaterWindow.js). Vorne führt die
// Treppe wieder hinauf.
LEVELS.polarunder = {
  name: tr('Unterwasser-Scheibe', 'Underwater Window'),
  rows: [
    'VVVVVVVVVVVVVVVV',
    'N##############N',
    'N##############N',
    'N..ṧ.ṧ.##.ṧ.ṧ..N',
    'N......##......N',
    'Nê.....##.....êN',
    'N......##......N',
    'NÊ.....##.....ÊN',
    'N......##......N',
    'MMMMMMMXXMMMMMMM',
  ],
  grass: ['planks_ice'],
  path: 'snow_path',
  start: { tx: 7, ty: 7 },
  // Holzboden, Weg aus festgetretenem Schnee: vor der ganzen Scheibe entlang und von der Tür hinauf; davor Steinklötze zum Sitzen
  buildings: [{ tx0: 0, ty0: 0, tx1: 15, ty1: 9, style: 'ice', noRoof: true, pathFloor: 'snow_path' }],
  chests: [],
  toolSpots: [],
  background: '#0b1c2c',
  ambient: 'ambient_ice',
  ambientVolume: 0.06,
  stepSound: 'step_snow',
  // die Scheibe liegt an der hinteren Wand (Zeile ty, Spalten tx0..tx1); height: so hoch ist das Becken dahinter
  // (Welt-Pixel); pen/level: Gehege, dessen Tiere dort schwimmen
  // door: dort kommen die Besucher herein und gehen wieder
  underwater: { tx0: 1, tx1: 14, ty: 0, height: 240, pen: 'sealpool', level: 'park4', door: { tx: 7.5, ty: 8.6 } },
  exits: [
    { tx: 7, ty: 9, to: 'park4', arrive: { tx: 21, ty: 21 }, label: tr('Polarhalle', 'Polar Hall') },
    { tx: 8, ty: 9, to: 'park4', arrive: { tx: 21, ty: 21 }, label: tr('Polarhalle', 'Polar Hall') },
  ],
  spawn: { population: 0, weights: {} },
};

// Expeditionen (Camp und Maps, siehe expeditionMaps.js)
Object.assign(LEVELS, EXPEDITION_LEVELS);
