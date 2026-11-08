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

// Savanne in der normalen Phase; Starkregen und Trockenzeit leiten ihre Karten daraus ab (siehe savanna.seasons)
const SAVANNA_ROWS = [
  'AvvvvvvRvAvvvvvvRvAvvvvvvRƲǍƲƲƲƲƲƲRƲǍƲƲƲ',
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
  'v....y.....y........#..........Ʋ.......v',
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
  'vvvvRvAvvvvvvRvAvvvvvvRvAvvvvvvRvAvvvvvv',
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

// Eiswelt: Festland in der Mitte mit der Forschungsstation, vier Inseln, die ihre Ecken bis an den Kartenrand füllen
// (dazwischen 4 Kacheln breite Meeresarme), an den Seiten des Festlands offenes Meer (dort liegt das Wasserflugzeug). Erzeugt mit einem kleinen Skript, danach von Hand
const ICE_ROWS = [
  'Ê..Ê..êêêêÊêê~~~~~~~~~~~~~~~~~~~~~.Êêê.êê.ê.ê.',
  'ê......ê....~~~~~~~~~~~~~~~~~~~~~~....Ê......ê',
  'Ê.......ê...~~~~~~~~~~~~~~~~~~~~~~...Ê.......Ê',
  'ê...........~~~~~...~~~~~~~~~~~~~~...........Ê',
  'ê...........~~~~~...~~~~~~~~~~~~~~...Ê..Ê....ê',
  '....ê........~~~~~~.........~~~~~~...........ê',
  'êê..Êê...ê...~~~~~~.........~~~~~~...........Ê',
  'Ê.ê..........~~~~............~~~~~..........Êê',
  'Ê............~~~~...ê........~~~~~...........ê',
  'ê............~~~~#........ê.ê~~~~~...........ê',
  'Ê......ê.....~~~~#.........ê.~~~~~....e......Ê',
  '...Ê...Ê..e..~~~~#...........~~~~~êê.....ê..êê',
  'ê~~Ê......~~~~~~~#..........~~~~~~.........~~Ê',
  '~~~~~~~~~~~~~~~~~#........ê.~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~########....~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~.....#....~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~.....#....~~~~~~~~~~~~~~~~~',
  '~~~.......~~....~~......#......~~...#...~~~~~~',
  '~~~.......~~....~~......#......~~...#......~~~',
  '~~~................MMMMM#...........#......~~~',
  '~~~................NɃ,,N#...........#......~~~',
  '~~~................Nɓ,,G##################.~~~',
  '~~~................MMMMM#..................~~~',
  '~~~..................c..#.ê..ê.............~~~',
  '~~~.ê.........ê.........#......Ê...........~~~',
  '~~~..ê........ê..Ê....ê.#..................~~~',
  '~~~.....................#.................Ê~~~',
  '~~~.....................#.................~~~~',
  '~~~~~~...####################.~~.........Ê~~~~',
  '~~~~~~~~~~~~~~~~~...........#~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~...........#~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~.......ê.#~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~.........#~~~~~~~~~~~~~~~~~',
  'ê...........~~~~~.ê.........#~~~~~~~..Ê.......',
  'ê.......ê...~~~~~...ê.......#~~~~............ê',
  'êÊ...ê.....e~~~~~...........#~~~~...........êÊ',
  'Ê.ê...ê.....~~~~~...........#~~~~.....êê.....ê',
  '..........ê.~~~~~............~~~~............ê',
  'ê......ê....Ê~~~~........Êê..~~~~..e.........ê',
  'ê.Ê..........~~~~~~.........ê~~~~..........ê.Ê',
  'ê............~~~~~~..........~~~~~....ê......Ê',
  'ê......ê....Ê~~~~...........ê~~~~~............',
  '.....ê...Ê.ê.~~~~...~~...~~..~~~~~........Ê..ê',
  '......Ê.ê...~~~~~~~~~~~~~~~~~~~~~~...........Ê',
  '....ê.......~~~~~~~~~~~~~~~~~~~~~~...........Ê',
  'ÊêêÊ.ê...ê..Ê~~~~~~~~~~~~~~~~~~~~~êÊÊ.ÊÊêêÊêÊê',
];

// Nacht in der Eiswelt: das Meer zwischen Festland und Inseln friert zu (man läuft hinüber); nur das offene Meer am
// Kartenrand (open Kacheln breit) und ein paar kleine Eislöcher (holes: [tx, ty] oben links, je 2 x 2 Kacheln) bleiben
// Wasser – an denen tummeln sich nachts die Pinguine
function freezeSea(rows, open, holes) {
  const h = rows.length;
  const hole = (x, y) => holes.some(([hx, hy]) => x >= hx && x <= hx + 1 && y >= hy && y <= hy + 1);
  return rows.map((r, y) => [...r].map((c, x) => (c === '~' && x >= open && y >= open && x < r.length - open && y < h - open && !hole(x, y) ? 'ɨ' : c)).join(''));
}
// Eislöcher: in jedem Meeresarm eins, abseits der Fähr-Bahnen (dort geht man nachts hinüber); daneben bleiben immer
// mindestens zwei Kacheln Eis zum Vorbeigehen
const ICE_HOLES = [[13, 4], [5, 14], [30, 5], [40, 14], [30, 40], [39, 30], [13, 39], [4, 30]];

export const LEVELS = {
  meadow: {
    name: tr('Wiese', 'Meadow'),
    // Schnellreise: Auto (Kachel, Bild, Größe) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 12.16, ty: 26.48, texture: 'car_zoo', frame: 0, scale: 1.26 },
    map: { x: 51.5, y: 34, icon: 'sheep' },
    rows: [
      'TTbbTTTTbbTTTTTTbTTTTTTTTbT~~TTbTTTTTbTT',
      'T..f................#......~~....ŝŝŝŝŝŝT',
      'b.ḇḇ...........ẃ....#.ḇḇ..%~~....ŝŝŝŝŝŝT',
      'b.......m.m..f..Tf..#.ṕ.g.%~~..ḋ.ŝŝŝŝŝŝT',
      'b..b.ṕ...T.m....ḇ.f.#ḅ.ẃ.ƅ.~~%...ŝŝŝŝŝŝT',
      'T.....ṕ.m.m.b.......#...ƅḇ..~~...ŝŝŝŝŝŝT',
      'T..ḅ.....m....ḋ.....#.ṕṕ..r.~~%..ŝŝŝŝŝŝT',
      'b...................#...ẃ..%~~...ŝŝŝŝŝŝT',
      'T.ḋ..........Ẇ......#.......~~...ŝŝŝŝŝŝb',
      'T...%~~~~~~.....ṕ...#fg..ṕ.~~.r........b',
      'T.f.~~~~~~~~~.......#..ḇ..%~~.ḋ.....VVVb',
      'T.fr~~~~~~~~~%...f..#.ḋ....~~%......VẀVT',
      'T....~~~~~~..r..gẃ..#...ẃ..~~..T....VVVT',
      'T..Ẇ...%~~%...gf.fg.#.ḇḇ....~~%........T',
      'T.....%.~~%.f..bf...#....ṕ.%~~...ĉĉĉĉĉĉT',
      'T...g...~~~~~~~.r...#.......~r.ḋ.ĉĉĉĉĉĉT',
      'b...ḋ..~~~~~Ŝ~~~%...#.fg....%~~..ĉĉĉĉĉĉT',
      'T......f~~~~Ŝ~~~T..###..ẃḋ...~~%.ĉĉĉĉĉĉT',
      'T......%..ƃ...ƃ...##ẘ##.....%~~........b',
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
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 13, ty0: 21, tx1: 17, ty1: 24, style: 'meadow' },
    chests: [
      { tx: 15, ty: 25, tools: ['net', 'lasso'] },
    ],
    ambient: 'ambient_meadow', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [],
    exits: [], // in die anderen Gebiete und in den Tierpark nur mit dem Auto
    // Spawner: so viele wilde Tiere sind ungefähr gleichzeitig unterwegs; die Zahlen dahinter sind die
    // Wahrscheinlichkeiten (je größer, desto häufiger). Tiere verschwinden nach einer Weile und neue kommen.
    spawn: { population: 17, weights: { sheep: 6, cat: 2, fish: 2, frog: 1.6, mole: 0.6, butterfly: 3 } },
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
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP',
      'PŔŔŔŔŔŔŔŔŔn..........m#.....P....nVVV..P',
      'PŔŔ.Ŵ.r..D.....k.D....#nm.......Ț.VĈV.kP',
      'PŔr~~~~..ƒ.....P.Dȁ...#mn..ṽn..n.r...ɌkP',
      'PŔɌ~ř~~.Ɍ...D..ĿȁD....#.Ɍ.ṽṽ...P...n...P',
      'PŔ..~~~..........nnnn.#.n.............kP',
      'PŔ...~~~...........ȚD.#.n.ḫ.P..mƒ..ȁȁ.kP',
      'PD..P.~~~........D....#D......ƒƒ..Dȁ..kP',
      'PP.ḩ...~~~......n.PPPP#P....Ŀ.........DP',
      'P.......~~~...Ɍ.ḫ.PPP.#.ḃḃ.......Ț.....P',
      'Pk.Ț.P..~ř~~.....PPPP.#ḃḃ.......mm..ḩ.kP',
      'Pkkk.ḃḃ..~~~....nL....#.PMMMMM........PP',
      'PP..nḃ...~~~###########LDNap,N.#......PP',
      'Pk......k.~~~..L.Dk...#.PN,j,G##......PP',
      'PD.ṽP.Ɍ...~~~..P.Pkḩ..#.#MMMMM.#....Ɍ.PP',
      'PPṽṽ..kk..~ř~.PPDP...n####.c...#..P...kP',
      'PP......k.~~~ƒƒP.P..Dȁ###......#.......P',
      'PPPPḫkDn..~~~.D....ȁȁ.###......#......DP',
      'PD......##EEE##########################P',
      'Pkn.......~~~.nD.#......#..........ḩ...P',
      'PD..P....~~~..ḩ..#m..P..#.DȚ........P..P',
      'PP..DɌ..~~~......#...ḫ..#......m...Ŀ..kP',
      'PDn.....~ř~.ƀ.ɌD.#......#.ḃP.Ɍ...ṽṽ.n..P',
      'PD..ȁȁƀ.~~~......#.PĿ.D.#ḃk...m.ṽṽ.....P',
      'PD.ȁȁ....~~~.D..D#......#..............P',
      'PD...D...~~~~....#Pḃ..........ṽṽ.......P',
      'PPnnnnȚ..Ƅ~ř~ƀD.m#n.......n..ṽṽ..Ħ....DP',
      'PP..n.....~~~#####.....................P',
      'PDPPPPP....~~~..Ɍ..........P...........P',
      'P....ḩ......ř~~~............ḩ..........P',
      'P......Ŀ.....~~~~~Ƭ~~ř~~.......ȁȁ....ȚkP',
      'PPkkkkkn......~~ř~Ƭ~~~~~~.D...ȁȁ.......P',
      'Pkkk.ƒƒ.D.............~~~...........ƒƒ.P',
      'PD..Pƒ.......Pnḃ.ḫ.Ɍ...~ř~.........ƒƒ..P',
      'PD..Ț.....ṽṽ.ḃn.P..P...~~~.k...Ŀ......PP',
      'PD.......ṽṽ...n.Ț..ȁȁ...~~~ḃ.D..n...kḫ.P',
      'PD....Pn....ḩ.n...mȁ.....~ř~.LɌ.PPPPDkDP',
      'PD..D...PDn....L....ḫPD.P.~~~...PkkkkkDP',
      'PPkkkkkDPDDkkkkDkDDDDDkPPD.~~~.DDDDDkkPP',
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPP~~PPPPPPPPPP',
    ],
    grass: ['fgrass0', 'fgrass1', 'fgrass2'],
    path: 'forest_path',
    start: { tx: 37, ty: 18 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 25, ty0: 11, tx1: 29, ty1: 14, style: 'forest' },
    chests: [
      { tx: 27, ty: 15, tools: ['net', 'lasso', 'trap'] },
    ],
    hero: 'hero_forest', // Kleidung der Spielfigur in diesem Gebiet (Pfadfinder)
    ambient: 'ambient_forest_river', // Waldgeräusche mit leisem Flussrauschen darunter (tools/prepare-sounds.js)
    toolSpots: [],
    exits: [], // nur mit dem Auto
    spawn: { population: 12, weights: { deer: 4.4, squirrel: 2.5, fish: 2.5, fox: 1 } }, // jedes zehnte Reh ist ein Hirsch (Skin); keine Frösche im Wald
    // Fluss vom Wasserfall oben links bis unten rechts (fließt wie im Dschungel), mit Felsen, um die er schäumt
    flow: { frames: ['forest_flow0', 'forest_flow1', 'forest_flow2', 'forest_flow3'], ms: 300, minSize: 40 },
    roundShore: true,
    bridgeStyle: 'wood', // Holzbrücke über den Fluss
    bridgeArt: { back: 'forest_bridge', front: 'forest_bridge_front', len: 3, ox: 42, oy: 34 }, // ... als Bild (tools/forest-art.py)
    objectKeys: { Ŵ: 'forest_waterfall', Ŕ: 'forest_cliff' }, // Wasserfall und Felskante mit eigenen Bildern (Wald-Paket)
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
    start: { tx: 2, ty: 19 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 13, ty0: 20, tx1: 17, ty1: 23, style: 'savanna' },
    chests: [
      { tx: 15, ty: 24, tools: ['net', 'lasso', 'food'] },
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
    exits: [], // nur mit dem Auto
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
        spawn: { population: 10, weights: { antelope: 0.3, zebra: 0.3, giraffe: 0.2, meerkat: 0.15, lion: 0.12, crocodile: 0.35, fish: 0.7, hippo: 0.45 } },
        herons: { every: [35, 70], landChance: 0.7 },
      },
      // Trockenzeit: Schlamm statt Wasser (darin die Lungenfische), ein letztes kleines Wasserloch, an dem sich Zebras und
      // Antilopen drängen; kahle Akazien mit Geiern, Warzenschweine, Hyänen (mit Knochen anlocken, siehe Hyena.js)
      dry: {
        rows: dryUp(SAVANNA_ROWS, { tx: 31, ty: 30, r: 1.6 }),
        fishIn: '≈',
        grass: ['sdry0', 'sdry1', 'sdry2'],
        objectKeys: { A: 'acacia_bare', ƚ: 'savanna_tallgrass_dry', Ƙ: 'dry_bush' }, // kahl und strohgelb
        chests: [{ tx: 15, ty: 24, tools: ['net', 'lasso', 'food', 'bone'] }],
        spawn: { population: 9, weights: { antelope: 0.35, zebra: 0.35, giraffe: 0.15, meerkat: 0.3, lion: 0.12, fish: 0.5, warthog: 0.5 } },
        gatherAt: { tx: 31, ty: 30, r: 90 }, // dort drängen sich Zebras und Antilopen (Leine, siehe Animal.pickWander)
        vultures: { every: [30, 60] }, // so oft kreist ein Geier heran (Sekunden)
        hyenas: { every: [40, 80], near: { tx: 33, ty: 5, r: 10 } }, // so oft kichert das Hyänenrudel – nur, wenn man in der Nähe des Elefantenfriedhofs ist
      },
    },
  },

  asia: {
    name: tr('Bambuswald', 'Bamboo Forest'),
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 13.16, ty: 41.54, texture: 'car_zoo', frame: 0, scale: 1.3 },
    map: { x: 78, y: 37, icon: 'panda' },
    rows: [
      'JQQJQQJQQJQQJQQJQQJQQJQQJQQJQQJQQJQQJQQk',
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
      'J................K..#..................k',
      'Q....###############################...k',
      'Q...................#..................k',
      'J..q......r.l....q.l#l....O.........O..k',
      'Q.......hhhrr.......#..........O.......k',
      'Q....r.hhhhh........#.......O..........k',
      'J.....hhhhhhhrMMMMM.#l..........q.O....k',
      'Q......hhhhh.rNap,N.#...q..............k',
      'Q.......hhh.r.N,j,G##........O.n.......k',
      'J............#MMMMM.#............O.....k',
      'Q...........####c####..................k',
      'Q...........##.....l#l..........hhhr...k',
      'J...........##......#...K..q..rhhhhh...k',
      'Q...........#..K....#..........hhhhhr..k',
      'Q..q................I...........hhh....k',
      'J..........n........#.....K....r.......k',
      'Q............K......#..................k',
      'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    ],
    grass: ['agrass0', 'agrass1', 'agrass2'],
    path: 'asia_path',
    water: ['asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water1', 'asia_water2'], // Koi-Teich, ab und zu Seerosen und Lotus
    start: { tx: 20, ty: 45 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 14, ty0: 36, tx1: 18, ty1: 39, style: 'asia' },
    chests: [
      { tx: 16, ty: 40, tools: ['net', 'lasso', 'koifood', 'food', 'ball'] }, // Grünfutter für die Pandas, Ball zum Anlocken des Tigers
      { tx: 19, ty: 23, tools: ['net', 'lasso', 'koifood', 'food', 'ball'] }, // Kiste auf der Insel: alle Werkzeuge von Asien
    ],
    hero: 'hero_asia', // Kleidung der Spielfigur in diesem Gebiet (Strohhut)
    ambient: 'ambient_asia', // Asien-Geräusche, leise über die Wiesengeräusche gelegt (siehe tools/prepare-sounds.js)
    background: '#3f7a35',
    toolSpots: [],
    exits: [], // nur mit dem Auto
    // Koi leben im Koi-Teich (nur als Schatten zu sehen, bis man sie mit Fischfutter anlockt)
    spawn: { population: 9, weights: { koi: 1, panda: 0.4, macaque: 0.7, tiger: 0.35, orangutan: 0.35, peacock: 0.8 } }, // Pandas beim Bambus, Japanmakaken in der heißen Quelle, Tiger als Schemen im Bambuswald
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
      'kJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkk',
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
      'JJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJkkJ',
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
    exits: [], // hin und zurück nur mit dem Wasserflugzeug
    // Plätze (population: ein Trupp Brüllaffen, ein Ara-Paar, ein Piranha-Schwarm zählt als einer). spawn gilt bei jedem
    // Wetter, weatherSpawn ist der eigene Pool der Wetterlage (die Wetterphasen unten ersetzen nur ihn)
    spawn: { population: 2, weights: { anteater: 1, jaguar: 1 } }, // Ameisenbären und ein Jaguar bei jedem Wetter
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
        weatherSpawn: { population: 4, weights: { gibbon: 1, macaw: 1 } }, // im Nebel: Gibbons statt Brüllaffen, die Aras fliegen weiter
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
    wip: true, // noch nicht fertig: Hinweis beim Ankommen und auf der Weltkarte
    // Schnellreise: Wasserflugzeug im offenen Meer rechts vom Festland (wie im Dschungel)
    car: { tx: 44, ty: 21.5, texture: 'seaplane', frame: 0, scale: 1.2, bob: true, reach: 60, arrive: { tx: 41, ty: 21 } },
    map: { x: 40, y: 17, icon: 'penguin' }, // Grönland
    rows: ICE_ROWS,
    grass: ['snow0', 'snow1', 'snow2'],
    path: 'snow_path',
    water: ['ice_water0', 'ice_water0', 'ice_water1'],
    roundShore: true, // Schneeecken, die ins Meer ragen, sind abgerundet
    start: { tx: 41, ty: 21 },
    enclosures: [], // die Gehege sind im Tierpark
    hut: { tx0: 19, ty0: 19, tx1: 23, ty1: 22, style: 'ice' }, // Forschungsstation (Metall, flaches Dach mit Teleskop; mit Bett)
    chests: [
      { tx: 21, ty: 23, tools: ['net', 'lasso', 'herring', 'sealball'] }, // Regal vor der Station
      { tx: 10, ty: 11, tools: ['net', 'lasso', 'herring', 'sealball'] }, // Kisten auf den vier Inseln
      { tx: 38, ty: 10, tools: ['net', 'lasso', 'herring', 'sealball'] },
      { tx: 35, ty: 38, tools: ['net', 'lasso', 'herring', 'sealball'] },
      { tx: 11, ty: 35, tools: ['net', 'lasso', 'herring', 'sealball'] },
    ],
    hero: 'hero_ice', // Kleidung in der Eiswelt (Parka mit Fellkapuze)
    ambient: 'ambient_ice', // pfeifender Wind
    ambientVolume: 0.4, // lauter aufgenommen: so etwa gleich laut wie der Dschungel
    stepSound: 'step_snow', // Schritte knirschen im Schnee (drinnen wie überall auf dem Flur)
    background: '#1f4f73',
    toolSpots: [],
    exits: [], // hin und zurück nur mit dem Wasserflugzeug
    snow: true, // es rieselt immer leicht Schnee (siehe Weather.js)
    // Pinguine watscheln in Gruppen am Wasser (siehe Penguin.js); nachts am offenen Meer am Kartenrand und an den Eislöchern.
    spawn: { population: 6, weights: { penguin: 1, seal: 0.6 } }, // Robben schwimmen am Ufer (siehe Seal.js)
    // Eisschollen (siehe Floes.js), Lage in Kacheln. ferries: tragen Henrik zwischen Festland (from) und Insel (to) hin
    // und her und liegen an beiden Ufern wait Sekunden an (travel: Sekunden für die Fahrt, shift: Versatz im Takt);
    // drift: kleine Schollen zur Zierde, die langsam über das offene Meer am Rand treiben (period: Sekunden hin und zurück)
    floes: {
      r: 1.25, // Größe der Fähren (Kacheln von der Mitte bis zum Rand)
      wait: 5,
      travel: 7,
      ferries: [
        { from: [16, 9], to: [13, 9], shift: 0 },
        { from: [36, 16], to: [36, 13], shift: 6 },
        { from: [29, 36], to: [32, 36], shift: 12 },
        { from: [9, 29], to: [9, 32], shift: 18 },
      ],
      drift: [
        { from: [1, 14], to: [1, 31], r: 0.55, period: 150 },
        { from: [15, 1], to: [32, 1], r: 0.6, period: 160 },
        { from: [14, 44], to: [32, 44], r: 0.5, period: 140 },
        { from: [44, 25], to: [44, 32], r: 0.45, period: 90 },
      ],
    },
    // Tag und Nacht (siehe season.js): die Angaben der Nacht ersetzen die oben
    seasons: {
      day: {},
      night: {
        rows: freezeSea(ICE_ROWS, 3, ICE_HOLES),
        iceHoles: ICE_HOLES, // dort erscheinen die Pinguine nachts meistens
        floes: null, // die Schollen sind ins Eis eingefroren
        seaIce: ['sea_ice0', 'sea_ice1', 'sea_ice2'], // helle, glatte Eisfläche (tools/sea-ice.py)
        night: true, // dunkel, Polarlicht am Himmel, warmes Licht an der Station (siehe Weather.js)
        // so viele Minuten draußen, bis Henrik zu kalt zum Fangen ist; so viele Sekunden in der Station, bis er wieder warm ist
        cold: { minutes: 3, warmSeconds: 3 },
      },
    },
  },

  // Reptilienhaus: eigene, enge Halle hinter der Fassade im Dschungel-Bereich des Tierparks (wie das Aquarium), voller
  // Dschungelpflanzen. Große Glasterrarien voller Pflanzen (tools/terrarium-glass.py): links die Schlangen, rechts die
  // Vogelspinnen (auf einem Sockel, mit Netzen ẅ), unten links das Piranha-Becken, unten rechts das Leguan-Terrarium
  // (Ast und Steine zum Sonnen). Gefangene ziehen beim Betreten des Tierparks hier ein
  // (siehe sendToHouse in GardenScene)
  reptiles: {
    name: tr('Reptilienhaus', 'Reptile House'),
    rows: [
      'MMMMMMMMMMMMMMMMMM',
      'Nľ.ḟ..ľ....ľ..Ḣ.ľN',
      'N.MMMMMM..MMMMMM.N',
      'N.NḢľnrN..Nẅnľ.N.N',
      'N.NqL.ľN..Nľ.ẅnN.N',
      'N.Nn.qrN..NrnľẅN.N',
      'N.MMMMMM..MMMMMM.N',
      'Nľ.n....ľ.....n.ľN',
      'N................N',
      'N.ľ............ľ.N',
      'N.##############.N',
      'N.MMMMMM##MMMMMM.N',
      'N.N...(N##NľḢrnN.N',
      'N.N(...N##NqL.ľN.N',
      'N.N....N##NrnḟľN.N',
      'N.MMMMMM##MMMMMM.N',
      'NḢ..ľ...##....ľ.ľN',
      'MMMMMMMMXXMMMMMMMM',
    ],
    grass: ['floor_reptiles'],
    path: 'asia_path',
    start: { tx: 8, ty: 16 },
    enclosures: [
      // Piranha-Becken unten links (Wasserbecken wie im Aquarium, ohne Zierfische, mit zwei Seegras-Büscheln)
      { id: 'piranhas', name: tr('Piranha-Becken', 'Piranha Tank'), species: ['piranha'], world: 'jungle', seed: { tx: 4, ty: 13 }, slots: [6, 6], signAt: { tx: 4.5, ty: 15.6 }, signOnGlass: true },
      { id: 'snakes', name: tr('Schlangen-Terrarium', 'Snake Terrarium'), species: ['snake'], world: 'jungle', seed: { tx: 5, ty: 4 }, slots: [4, 4], signAt: { tx: 4.5, ty: 6.6 }, signOnGlass: true },
      { id: 'iguanas', name: tr('Leguan-Terrarium', 'Iguana Terrarium'), species: ['iguana'], world: 'jungle', seed: { tx: 12, ty: 12 }, slots: [3, 3], signAt: { tx: 12.5, ty: 15.6 }, signOnGlass: true },
      { id: 'tarantulas', name: tr('Vogelspinnen-Terrarium', 'Tarantula Terrarium'), species: ['tarantula'], world: 'jungle', seed: { tx: 12, ty: 4 }, slots: [4, 4], signAt: { tx: 12.5, ty: 6.6 }, signOnGlass: true },
    ],
    // Terrarien zuerst (ihre Wände und ihr Boden gehören zum Terrarium), dann die Halle
    buildings: [
      { tx0: 2, ty0: 2, tx1: 7, ty1: 6, style: 'terrarium', noRoof: true },
      { tx0: 10, ty0: 2, tx1: 15, ty1: 6, style: 'terrarium_raised', raise: 28, noRoof: true }, // Vogelspinnen auf einem Sockel (raise wie RAISE in tools/terrarium-glass.py)
      { tx0: 2, ty0: 11, tx1: 7, ty1: 15, style: 'tank', noRoof: true, noDeco: true }, // Piranha-Becken
      { tx0: 10, ty0: 11, tx1: 15, ty1: 15, style: 'terrarium', noRoof: true }, // Leguan-Terrarium
      { tx0: 0, ty0: 0, tx1: 17, ty1: 17, style: 'reptiles', noRoof: true, pathFloor: 'asia_path', visitors: true },
    ],
    chests: [],
    toolSpots: [],
    background: '#1e1a12',
    ambient: 'ambient_jungle', // ganz leise der Dschungel (warm und feucht)
    ambientVolume: 0.15,
    exits: [
      { tx: 8, ty: 17, to: 'park3', arrive: { tx: 74, ty: 13 }, label: tr('Tierpark', 'Zoo') },
      { tx: 9, ty: 17, to: 'park3', arrive: { tx: 74, ty: 13 }, label: tr('Tierpark', 'Zoo') },
    ],
    spawn: { population: 0, weights: {} },
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
      'MMMMMMMMMMXXMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
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
    ],
    // Tanks zuerst: so gehören ihre Wände und ihr Boden zum Tank, nicht zur Halle. pathFloor: Mosaik auf dem Weg in der Halle
    buildings: [
      { tx0: 4, ty0: 2, tx1: 19, ty1: 6, style: 'tank', noRoof: true },
      { tx0: 2, ty0: 8, tx1: 7, ty1: 12, style: 'tank', noRoof: true },
      { tx0: 2, ty0: 13, tx1: 7, ty1: 16, style: 'tank', noRoof: true },
      { tx0: 23, ty0: 1, tx1: 36, ty1: 7, style: 'tank', noRoof: true }, // Raum 2: riesige Beckenfront
      { tx0: 29, ty0: 12, tx1: 34, ty1: 16, style: 'tank', noRoof: true }, // Raum 2: Krakenbecken unten rechts, frei stehend
      { tx0: 0, ty0: 0, tx1: 21, ty1: 18, style: 'aquarium', noRoof: true, pathFloor: 'aq_path', visitors: true }, // Besucher laufen auf dem Mosaikweg
      { tx0: 41, ty0: 5, tx1: 47, ty1: 11, style: 'tank', noRoof: true, noDeco: true }, // Raum 3: Quallenbecken mitten im Raum (ohne Zierfische)
      { tx0: 21, ty0: 0, tx1: 37, ty1: 18, style: 'aquarium', noRoof: true, pathFloor: 'aq_path', visitors: true }, // Raum 2 (die Wand dazwischen gehört zur Halle)
      { tx0: 37, ty0: 0, tx1: 51, ty1: 18, style: 'aquarium', noRoof: true, pathFloor: 'aq_path', visitors: true, dark: true }, // Raum 3, abgedunkelt
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
export const PARK_LEVELS = ['park', 'park2', 'park3'];
export const isPark = (id) => PARK_LEVELS.includes(id);

const PARK_ROWS = [
      '         f.g.b.f.                3X33333333333333333333333333333333333333333333                 ',
      '         .b..g..T                3#[[[[[[[[[[[[[[[[[[3....y....v....y....A....3                 ',
      '         g.K.f.b.                3#].y..............]3...v...A....y.....v...y.3                 ',
      '         f...b.g.                3#]..A..yyy....A.@.]3..{{{{{{{{{{{{A......R..3                 ',
      '         .g.T..K.                3#].....www........]3..}..........}...y......3                 ',
      '         b..f.g..        333333333#]....wwww........]33.}.%ooooo...}..v....y..3                 ',
      '         .f.g.b.T        3A..A....#[[[[[[[[[y.......]...}.ooooooo..}......y.v.3                 ',
      '         g.b..f..        3.yv.....#########].yyA.y..].y.}oooooooo%.}......A...3                 ',
      '         VVVVVVVV        3[[[[[[[[[[....v.#]..y.....]...}.ooooooo..}........y.3                 ',
      '        Vbbbbbbbb3       3]........]....A.#].......y]...}.oooo%oo..}..........3                 ',
      '        V.T..f.K.333333333].A.y....]......#G..y..y..]...}..oo..oo..}......R...3                 ',
      '        Vg..f.T.f3.....v..].....$..G#.y.A.#G........]y..}..........}..........3                 ',
      '        Vf.b....g3....y...]........G#.v...#].....A..]vy.{{{{{G{{{{{{.......v..3                 ',
      '        Vl.Kf.g..3.y...y..]...y..y.]#vy.A.#]........].A.....v#....A.......A...3                 ',
      '        V.g..f.b.3..y.....[[[[[[[[[[#F....#[[[[[[[[[[....y..v#.........v....y.3                 ',
      '        `#####################################################################3                 ',
      '        Vgff3v{{{GG{{{..---G---.#.v.....v...y.v.#.v..vy...v.....y...R.....y.v.3                 ',
      '        Vlfb3.}......}..|.....|.#....A...A....v.#...R...A........y.........A..3                 ',
      '        V3333.}.oooo.}..|..u..|.#..y.....y....v.#..vy.............v...........3                 ',
      'g.f.b.g.f.b.3.}.oooo.}..|.....|.#........yyy..A.#y..A....v.......A..........y.3                 ',
      'b..T..f.K.g.3.}y.ooo.}..|y.y..|.#..............y#...y.............R...........3                 ',
      '.K..g.b..T..3.}......}..-------.#..R.....vy..y..#....A..y........v.........A..3                 ',
      'f.g..f..g.f.3.{{{{{{{{..y...y..y#v...........R..#v....v...........y...........3                 ',
      '22222222222222222222222################################b.R.........A.......v..3                 ',
      '222k2DDk2222.^^^^^^^^^^#............###.......#MMMMMMM.b33333333333333333333333                 ',
      '2D22kD222DD2.;.n......;#..y.y.v.....###..%....#N.C...N.b                                        ',
      '2kD2222k22k2.;.P...ww.;#.D.y......v.###..~~...#N....CN.b                                        ',
      '22k2k22k2D22k;.....ww.G#...Av..A.A..###..~~~..#N.....N.b                                        ',
      'DkD222k2k2k2.;...m....G#.......y....###...~~..#MMMGMMM.b                                        ',
      '222D2k2k2k22.;....^^^^^#......y.....###....%..#####g...b                                        ',
      '222k2Dk22222.;.P..;..kk#b.........b.###b.....bb...####.b                                        ',
      'k2D22k2k2D22.;....;....#.MMMMMMMMM..###.g.....b..b...##b                                        ',
      'D22DD2222222.;*...;....#.NZ...z.sN..###Fb.b....g..g..b#b                                        ',
      'kD222D222222m;..P.;....#.N...VYV.N..###---------------#b                                        ',
      'D2222D2mk....^^^^^^kkn.#.N.......N..###|.............|#b                                        ',
      'k2D2222.################.NVt.....N..###|.............|#b                                        ',
      '2kk2kk2.------GG------.#.Ndix....N..###|....T........|#b                                        ',
      '222D222k|..........k.|.#.Ns.....ZN..###|.............|#b                                        ',
      'D2D2kD2.|....D.......|k#.MMMMGGMMM.####|..@..........|#b                                        ',
      '22k2DD2.|.&..........|m#bg.#####.fb####|...f......T..|#b                                        ',
      '2kkk222.|.P..........|.#..f#####g..####G.............|#X                                        ',
      '2222kD2.|.m......D..n|k#############W##G.............|.b                                        ',
      '2222kk2.|n...........|.################|.........f...|.b                                        ',
      '22kDD22.|...D........|.##........######|.............|.b                                        ',
      '2222222.|......m.....|k#.........######|.............|.b                                        ',
      ' 2mm...n--------------F#.........######---------------.b                                        ',
      ' X######################......n.....###.....ff.b.b...g.b                                        ',
      ' 2----G----#{{{{{{{{{{.#.......n.n..###.b..gf.T.....bTbb                                        ',
      ' 2|.n.....|#}.%.....m}.#....m.m...m.########g^^^^^^^^^^b                                        ',
      ' 2|..n....|#}..oo...ƀ}.#..D.........###..f.#.;........;b                                        ',
      ' 2|.mU.n..|#}.oooom..}.#............###g.g.#.;........;b                                        ',
      ' 2|n......|#G.ooooƄ..}.#......mm..q.###....#g;........;b                                        ',
      ' 2|.......|#}mnooo..ƀ}.#.m.P..0K.K..###g..g#.;....b...;b                                        ',
      ' 2---------#}....%..k}n#............###...b##G........;b                                        ',
      ' 2222222.k.#}........}.#....n.q..l..###.bb.#.G.....*..;b                                        ',
      '       2m..#}......kn}.#..n.q.......###..T.##;...w.w..;b                                        ',
      '       2mm.#{{{{{{{{{{.#....ll......###..fb.#;........;b                                        ',
      '       2.n.#############...q.qq.....###b.b..#;........;b                                        ',
      '       2.k.n..k......nk#...........####..f..#^^^^^^^^^^b                                        ',
      '22222222222222222222222################################b    55555555555555555555               5',
      '            5..................q......#................bbbbb5J[[[[[[[[[[[[[[[Jḟ.               5',
      '            T.^^^^^^^^^^^...K..r......I.K..[[[[[[[[[[[[[[[[b5ľ]n...........ľ]Jľ.               5',
      '            5.;.........;.............#....]...Q..........]b5ľ]..J......J...]..ľ               5',
      '            T.;..9......;.....#########....].......Q....K.]b5.].......ľ.....]qq.               5',
      '            5.;......q..;l...##.......##...]....K.........]b5J]...n......ľ..]J.q               5',
      '            T.;..hhhh...;...##..KlK.l..##..]..8.....Q.....]b5ľ].....J.......]nḢ.               5',
      '            5.;.r.hhh...G####.K....q.q.K##.].....7.......Q]b5ľ]...........J.]ľ..               5',
      '            T.;....h....G..#..l..q..ll...##G..............]b5.].J......n....].Ḣľ               5',
      '            5.;.........;..#.lqooooooo.rq.#G..q...q....q..]b5.]....q.....ḟ..].J.               5',
      '            T.^^^^^^^^^^^q.#..ooooooooo...#]..............]b5.[[[[[[[G[[[[[[[.ľ.               5',
      '            5....l....q.r..###EEEEEEEEEE###[[[[[[[[[[[[[[[[b5........#.......ľ.ľ      Ř        5',
      '            T..rll.qq.q....#.q.oooooooo.l.#W...........bbbbb5........#..............l.#.l......5',
      '            5..............##..q...ooor...###################################################..5',
      '            T[[[[[[[[[[[[[[.##K.r.K..l..l##[[[[[[[[[[[[b...#....#...............#....W.........5',
      '            5]............]..##...q.K..K##.]..........]bnn.#.^^^G^^^^^^^^^^^^^^.#.[[[[[G[[[[[[[5',
      '            T]..J...9.....]...##.......####G..q....Q..]b...#.;.......+......ľ.;.#.]...........]5',
      '            5].........9..G#############...G....w...Q.]bnḟ.#.;.............+..;.#.]J......ľ...]5',
      '            T]L....H......G........#.......]..www8....]b...#.;.......+........;.#.]......ľ....]5',
      '            5]....9.......]........#.......]...ww...Q.]bJ..#.;+...........J...;.#.].....n...J.]5',
      '            T]..9.....J...]....K...#.......].L....r...]b...#.;.....ľ..J..+....;.#.]..J....ľ...]5',
      '            5].......q....]....r...#.....q.]..........]bJ..#.;.........ľ.....ľ;.#.].......q.ľ.]5',
      '            T[[[[[[[[[[[[[[...q..l.#.r.....[[[[[[[[[[[[bľ..#.^^^^^^^^^^^^^^^^^^ľ#.[[[[[[[[[[[[[5',
      '            bbbbbbbbbbbbbbbbbbbbbbbXbbbbbbbbbbbbbbbbbbbb...#....................#..............5',
      '                                                       5ľ.n#...ľ...q......ľ...n.#.q....ľ...n...5',
      '                                                       5.#####################################.5',
      '                                                       5.q...ľ...n......ľ...q....ľ....n...q.ľ..5',
      '                                                       5.[[[[[[[[G[[[[[[[[[..[[[[[[[[G[[[[[[[[[5',
      '                                                       5.]..ľ.......n.....]..]..n.....ľ...q...]5',
      '                                                       5.]...J..q.....J...]..]...J.........J..]5',
      '                                                       5.].n.....r.....ľ..]..].q....L.....n...]5',
      '                                                       5.]....ľ........J..]..]......ľ.....J...]5',
      '                                                       5.]..J........n.q..]..]..ľ........q....]5',
      '                                                       5.].....q..ľ.......]..]....J..n........]5',
      '                                                       5.].ľ...J......J...]..].n...L........ľ.]5',
      '                                                       5.]......n.....ľ...]..]......q.....J...]5',
      '                                                       5.]..q.....ľ.......]..]..ľ.....n.......]5',
      '                                                       5.[[[[[[[[[[[[[[[[[[..[[[[[[[[[[[[[[[[[[5',
      '                                                       55555555555555555555555555555555555555555',
];

// ground/water: Boden und Teichwasser im Gehege, passend zur Welt, aus der die Tiere kommen
// Gehege: slots = Plätze [vor, nach dem Ausbau]; basic = so sieht es vor dem Ausbau aus (Innenzaun bzw. ohne Ausstattung);
// upgrade = was der Ausbau am Hauptrechner bringt (siehe penLevel in state.js)
// Jedes Gehege liegt in dem Abschnitt, in dem sein Startpunkt (seed) liegt; freie ohne Startpunkt sagen es selbst (section)
const PARK_PENS = [
      { id: 'crocodile', name: tr('Krokodilteich', 'Crocodile Pond'), species: ['crocodile'], gate: 'chain', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 15, ty: 17 }, slots: [2, 3], upgrade: tr('Größerer Teich', 'Bigger pond'), basic: [[17, 20, ':'], [18, 20, '<'], [19, 20, '.']] },
      { id: 'lion', name: tr('Löwengehege', 'Lion Enclosure'), species: ['lion'], gate: 'tall', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 27, ty: 9 }, slots: [3, 5], upgrade: tr('Großer Löwenfelsen', 'Big lion rock'), basic: [[32, 11, ':']] },
      { id: 'meerkat', name: tr('Erdmännchenbau', 'Meerkat Burrow'), species: ['meerkat'], world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 25, ty: 17 }, slots: [5, 8], upgrade: tr('Erdhügel', 'Dirt mounds'), basic: [[27, 18, ':'], [28, 19, '<']] },
      { id: 'savanna', name: tr('Savannengehege', 'Savanna Enclosure'), species: ['antelope', 'zebra', 'giraffe'], gate: 'tall', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 45, ty: 2 }, quota: { antelope: [5, 8], zebra: [5, 8], giraffe: [3, 5] }, upgrade: tr('Mehr Steppe mit Heu-Unterstand', 'More grassland with a hay shelter'), basic: [[46, 2, ']'], [46, 3, ']'], [46, 4, ']'], [46, 5, '['], [47, 5, '['], [48, 5, '['], [49, 5, '['], [50, 5, '['], [51, 5, '['], [50, 3, '.']] },
      { id: 'gnus', name: tr('Gnu-Steppe', 'Wildebeest Plains'), species: ['gnu'], gate: 'tall', world: 'savanna', unlock: 'gnu', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 26, ty: 3 }, slots: [6, 9], upgrade: tr('Heuraufe', 'Hay rack'), basic: [[31, 2, '.']] },
      // Savanne, Wetterphasen (rechts am Weg der Savanne; das Nilpferdbecken steht von Anfang an, die anderen entstehen
      // jeweils mit dem ersten Tier, siehe unlocks)
      { id: 'hippos', name: tr('Nilpferdbecken', 'Hippo Pool'), species: ['hippo'], gate: 'chain', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 57, ty: 4 }, slots: [3, 4], upgrade: tr('Größeres Becken mit Schilf', 'Bigger pool with reeds'), basic: [[65, 3, 'v'], [66, 3, '.'], [67, 3, '.'], [64, 4, '}'], [67, 4, '.'], [58, 5, '.'], [62, 5, '.'], [63, 5, '.'], [64, 5, '}'], [67, 5, '.'], [63, 6, '.'], [64, 6, '}'], [65, 6, 'y'], [67, 6, 'A'], [63, 7, '.'], [64, 7, '}'], [65, 7, '.'], [67, 7, '.'], [63, 8, '.'], [64, 8, '}'], [65, 8, 'R'], [67, 8, '.'], [62, 9, '.'], [63, 9, '.'], [64, 9, '}'], [66, 9, 'v'], [67, 9, '.'], [63, 10, '.'], [64, 10, '}'], [65, 10, 'A'], [67, 10, '.'], [64, 11, '}'], [66, 11, 'y'], [67, 11, '.'], [65, 12, 'v'], [66, 12, '.'], [67, 12, '.']] },
      { id: 'vultures', name: tr('Geier-Voliere', 'Vulture Aviary'), species: ['vulture'], netRoof: true, gate: 'net', world: 'savanna', unlock: 'vulture', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 69, ty: 7 }, slots: [3, 5], upgrade: tr('Zweiter Baum', 'Second tree'), basic: [[72, 10, '.']] },
      { id: 'hyenas', name: tr('Hyänengehege', 'Hyena Enclosure'), species: ['hyena'], gate: 'tall', world: 'savanna', unlock: 'hyena', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 59, ty: 18 }, slots: [4, 6], upgrade: tr('Mehr Platz mit Felsenhöhle', 'More room with a rock den'), basic: [[56, 17, '.'], [57, 17, '.'], [56, 18, '.'], [57, 18, '.'], [58, 18, ']'], [56, 19, '.'], [57, 19, '.'], [58, 19, ']'], [56, 20, '.'], [57, 20, '.'], [58, 20, ']'], [56, 21, '.'], [57, 21, '.'], [58, 21, ']'], [56, 22, '.'], [57, 22, '.'], [58, 22, ']'], [56, 23, '.'], [57, 23, '.'], [63, 19, '.']] },
      { id: 'warthogs', name: tr('Warzenschwein-Gehege', 'Warthog Enclosure'), species: ['warthog'], gate: 'tall', world: 'savanna', unlock: 'warthog', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 69, ty: 18 }, slots: [3, 5], upgrade: tr('Zweites Erdloch', 'Second burrow'), basic: [[72, 21, '.']] },
      { id: 'deerpark', name: tr('Hirschgehege', 'Deer Park'), species: ['deer'], world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 16, ty: 40 }, slots: [6, 9], upgrade: tr('Mehr Wald mit Futterkrippe', 'More forest with a feeding rack'), basic: [[12, 37, '|'], [12, 38, '|'], [12, 39, '|'], [12, 40, '|'], [12, 41, '|'], [12, 42, '|'], [12, 43, '|'], [12, 44, '|'], [10, 39, '.']] },
      { id: 'foxden', name: tr('Fuchsbau', 'Fox Den'), species: ['fox'], world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 5, ty: 48 }, slots: [3, 5], upgrade: tr('Fuchshöhle', 'Fox cave'), basic: [[5, 50, ':']] },
      { id: 'forestpond', name: tr('Teich', 'Pond'), species: ['frog', 'fish', 'beaver'], gate: 'chain', signKey: 'pond', world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 14, ty: 48 }, quota: { frog: [6, 9], fish: [6, 9], beaver: [3, 5] }, upgrade: tr('Mehr Platz für die Biber und ein größerer Teich mit Schilf, Pilzen und Farn', 'More room for the beavers and a bigger pond with reeds, mushrooms and ferns'), basic: [[18, 50, '.'], [13, 52, '.'], [14, 52, '.'], [15, 49, '.'], [16, 49, '.'], [12, 54, '{'], [13, 54, '{'], [14, 54, '{'], [15, 54, '{'], [16, 54, '{'], [17, 54, '{'], [18, 54, '{'], [19, 54, '{'], [20, 54, '{'], [21, 54, '{']] }, // vor dem Ausbau: Innenzaun in Zeile 54 (der Ausbau bringt zwei Reihen mehr für die Biber)
      { id: 'wolves', name: tr('Wolfswald', 'Wolf Woods'), species: ['wolf'], gate: 'tall', world: 'forest', unlock: 'wolves', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 6, ty: 30 }, slots: [6, 9], upgrade: tr('Heulfelsen', 'Howling rock'), basic: [[5, 28, '.']] },
      { id: 'forestaviary', name: tr('Eichhörnchen-Voliere', 'Squirrel Aviary'), species: ['squirrel'], netRoof: true, gate: 'net', world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 14, ty: 25 }, slots: [5, 8], upgrade: tr('Zweiter Flügel mit Nistkasten', 'Second wing with a nest box'), basic: [[14, 32, ':'], [16, 33, '<'], [14, 30, '^'], [15, 30, '^'], [16, 30, '^'], [17, 30, '^']] },
      { id: 'cats', name: tr('Katzenhaus', 'Cat House'), species: ['cat'], gate: 'glass', world: 'meadow', seed: { tx: 50, ty: 26 }, slots: [4, 6], upgrade: tr('Zweiter Kratzbaum', 'Second cat tree'), basic: [[52, 26, ':']] },
      { id: 'pasture', name: tr('Weide', 'Pasture'), species: ['sheep', 'mole'], world: 'meadow', seed: { tx: 40, ty: 34 }, quota: { sheep: [10, 14], mole: [3, 5] }, upgrade: tr('Mehr Weide mit Heu-Unterstand', 'More pasture with a hay shelter'), basic: [[42, 38, ':'], [41, 39, '<'], [49, 34, '|'], [49, 35, '|'], [49, 36, '|'], [49, 37, '|'], [49, 38, '|'], [49, 39, '|'], [49, 40, '|'], [49, 41, '|'], [49, 42, '|'], [49, 43, '|'], [49, 44, '|']] },
      { id: 'aviary', name: tr('Reiher-Voliere', 'Heron Aviary'), species: ['heron'], netRoof: true, gate: 'net', world: 'meadow', seed: { tx: 47, ty: 55 }, slots: [6, 9], upgrade: tr('Zweiter Flügel mit Nistkasten und Wasserstelle', 'Second wing with a nest box and a water hole'), basic: [[50, 49, ';'], [50, 50, ';'], [50, 51, ';'], [50, 52, ';'], [50, 53, ';'], [50, 54, ';'], [50, 55, ';'], [50, 56, ';'], [50, 57, ';'], [51, 54, '.'], [51, 55, '.']] }, // vor dem Ausbau: Netz zwischen den Flügeln
      { id: 'flamingos', name: tr('Flamingos', 'Flamingos'), species: ['flamingo'], netRoof: true, gate: 'net', world: 'park', unlock: 'flamingo', seed: { tx: 27, ty: 50 }, slots: [6, 9], upgrade: tr('Großer See mit Springbrunnen', 'Big lake with a fountain'), basic: [[30, 52, 'w'], [28, 51, ':'], [28, 52, '<'], [28, 53, '.'], [32, 51, '.'], [32, 52, '.'], [32, 53, '.'], [29, 50, '.'], [29, 54, '.'], [30, 50, '.'], [30, 54, '.'], [31, 50, '.'], [31, 54, '.'], [27, 49, '.'], [33, 49, '.'], [27, 55, '.'], [33, 55, '.']] },
      // Pfauen haben kein Gehege: sie laufen frei im Tierpark herum (höchstens 8, kein Ausbau)
      { id: 'peacocks', name: tr('Pfauen', 'Peacocks'), species: ['peacock'], world: 'asia', free: true, slots: [8, 8], section: 'park3' },
      { id: 'butterflies', name: tr('Schmetterlinge', 'Butterflies'), species: ['butterfly'], world: 'meadow', free: true, slots: [10, 10], section: 'park' }, // flattern frei durch den Park
      { id: 'orangutans', name: tr('Orang-Utan-Gehege', 'Orangutan Enclosure'), species: ['orangutan'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 20, ty: 77 }, slots: [3, 5], upgrade: tr('Hängematte mit Schlafnest', 'Hammock with a sleeping nest'), basic: [[19, 77, ':']] },
      { id: 'tigers', name: tr('Tigergehege', 'Tiger Enclosure'), species: ['tiger'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 49, ty: 78 }, slots: [3, 5], upgrade: tr('Badebecken mit Spielball', 'Pool with a play ball'), basic: [[47, 77, ':'], [48, 77, '<'], [47, 78, '.'], [48, 78, '.'], [46, 77, '.'], [48, 76, '.'], [49, 77, '.']] },
      { id: 'pandas', name: tr('Pandagehege', 'Panda Enclosure'), species: ['panda', 'redpanda'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 48, ty: 66 }, quota: { panda: [2, 4], redpanda: [3, 5] }, upgrade: tr('Reifenschaukel und Spielball', 'Tire swing and play ball'), basic: [[49, 66, ':'], [46, 65, '<']] }, // rote Pandas wohnen mit im (verbreiterten) Gehege
      { id: 'macaques', name: tr('Affenquelle', 'Monkey Spring'), species: ['macaque'], netRoof: true, gate: 'net', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 19, ty: 64 }, slots: [4, 6], upgrade: tr('Großer Badesee', 'Big bathing lake'), basic: [[20, 65, ':'], [20, 66, '<'], [17, 65, '.'], [19, 67, '.']] },
      // Dschungel (rechts neben dem Bambuswald): Gehege links, rechts das Reptilienhaus
      { id: 'howlers', name: tr('Affen-Gehege', 'Monkey Enclosure'), species: ['howler', 'gibbon'], gate: 'tall', world: 'jungle', ground: ['jgrass0', 'jgrass1', 'jgrass2'], seed: { tx: 69, ty: 64 }, quota: { howler: [4, 7], gibbon: [3, 6] }, upgrade: tr('Größeres Gehege mit zwei Urwaldbäumen', 'Bigger enclosure with two jungle trees'), basic: [[71, 61, ']'], [71, 62, ']'], [71, 63, ']'], [71, 64, ']'], [71, 65, ']'], [71, 66, ']'], [71, 67, ']'], [71, 68, ']'], [74, 66, ':']] }, // Brüllaffen und Gibbons zusammen; vor dem Ausbau Innenzaun in Spalte 71
      // große Voliere mit vielen Sitzplätzen (Urwaldbäume J, Sitzstangen +): die Aras sitzen nur dort und fliegen hin und her
      { id: 'macaws', name: tr('Ara- und Tukan-Voliere', 'Macaw and Toucan Aviary'), species: ['macaw', 'toucan'], netRoof: true, gate: 'net', world: 'jungle', ground: ['jgrass0', 'jgrass1', 'jgrass2'], seed: { tx: 66, ty: 77 }, quota: { macaw: [4, 9], toucan: [3, 6] }, upgrade: tr('Größere Voliere mit Urwaldbaum und mehr Sitzstangen', 'Bigger aviary with a jungle tree and more perches'), basic: [[71, 75, ';'], [71, 76, ';'], [71, 77, ';'], [71, 78, ';'], [71, 79, ';'], [71, 80, ';'], [74, 78, ':'], [75, 76, ':'], [73, 79, ':']] }, // vor dem Ausbau Innennetz in Spalte 71
      { id: 'anteaters', name: tr('Ameisenbär-Gehege', 'Anteater Enclosure'), species: ['anteater'], gate: 'tall', world: 'jungle', ground: ['jgrass0', 'jgrass1', 'jgrass2'], seed: { tx: 86, ty: 77 }, slots: [4, 6], upgrade: tr('Größeres Gehege mit zweitem Ameisenbaum', 'Bigger enclosure with a second ant tree'), basic: [[89, 75, ']'], [89, 76, ']'], [89, 77, ']'], [89, 78, ']'], [89, 79, ']'], [89, 80, ']'], [92, 78, '.']] }, // rechts neben der Ara-Voliere; frisst Ameisen an den Urwaldbäumen; vor dem Ausbau Innenzaun in Spalte 89
      { id: 'jaguars', name: tr('Jaguar-Gehege', 'Jaguar Enclosure'), species: ['jaguar'], gate: 'tall', world: 'jungle', ground: ['jgrass0', 'jgrass1', 'jgrass2'], seed: { tx: 61, ty: 91 }, slots: [2, 4], upgrade: tr('Größeres Gehege mit mehr Kletterbäumen', 'Bigger enclosure with more climbing trees'), basic: [[66, 87, ']'], [66, 88, ']'], [66, 89, ']'], [66, 90, ']'], [66, 91, ']'], [66, 92, ']'], [66, 93, ']'], [66, 94, ']'], [66, 95, ']']] }, // unten links im Dschungel-Teil; vor dem Ausbau Innenzaun in Spalte 66
      { id: 'gorillas', name: tr('Gorilla-Gehege', 'Gorilla Enclosure'), species: ['gorilla'], gate: 'tall', world: 'jungle', ground: ['jgrass0', 'jgrass1', 'jgrass2'], seed: { tx: 81, ty: 91 }, slots: [3, 5], upgrade: tr('Größeres Gehege mit Kletterbäumen und Baumstämmen', 'Bigger enclosure with climbing trees and logs'), basic: [[87, 87, ']'], [87, 88, ']'], [87, 89, ']'], [87, 90, ']'], [87, 91, ']'], [87, 92, ']'], [87, 93, ']'], [87, 94, ']'], [87, 95, ']']] }, // unten rechts im Dschungel-Teil; vor dem Ausbau Innenzaun in Spalte 87
      { id: 'koipond', name: tr('Koi-Teich', 'Koi Pond'), seed: { tx: 30, ty: 69 }, species: ['koi'], pond: true, signAt: { tx: 33, ty: 75 }, signKey: 'koi', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], water: ['asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water1', 'asia_water2'], slots: [6, 9], upgrade: tr('Steinlaternen und Kirschbäume', 'Stone lanterns and cherry trees'), basic: [[29, 68, ':'], [40, 71, '<'], [36, 74, '.'], [32, 65, '.']] },
];

// freischaltbar: Gehege, die mit dem ersten Tier ihrer Art entstehen (je im Abschnitt, in dem ihre Kacheln liegen)
const PARK_UNLOCKS = [
  // die ersten Tiere der Wetterphasen der Savanne: ihre Gehege entstehen rechts am Savannen-Weg
  { id: 'vulture', tx: 68, ty: 6, rows: ['^^^^^^^', ';.....;', ';.Ǎ...;', ';.....;', ';...Ǎ.;', ';.....;', ';.....;', '^^^G^^^', '...#...'] }, // Ǎ: kahle Akazien zum Sitzen
  { id: 'hyena', tx: 56, ty: 16, rows: ['..v..#..y', '[[[[[G[[[', '].......]', ']......v]', ']....R..]', '].y.....]', '].......]', '[[[[[[[[['] }, // nach dem Ausbau zwei Spalten breiter (siehe basic)
  { id: 'warthog', tx: 68, ty: 16, rows: ['R..#..y', '[[[G[[[', '].....]', '].u...]', '].....]', ']...u.]', '].....]', '[[[[[[['] },
  // das erste Gnu: nördlich vom Löwengehege, am oberen Kartenrand, entsteht die Gnu-Steppe
  { id: 'gnu', tx: 20, ty: 0, rows: ['[[[[[[[[[[[[[[', ']..A.....y...]', '].....y....&.]', '].y..........G', ']......A.....]', ']..y.....v...]', '[[[[[[[[[[[[[['] },
  // der erste Wolf: am linken Kartenrand im Wald-Bereich entsteht der Wolfswald (dahinter dunkler Wald, siehe backdrops)
  { id: 'wolves', tx: 0, ty: 23, rows: ['[[[[[[[[[[[[', 'PPDPDPPPPPP]', '.DPDPPPDPPP]', '.D..PDPP.nP]', 'PPP........]', '.D...O...n.]', 'PD..Py.D..y]', 'DPP.....L..]', 'PP.R...n...]', 'Py.....m...]', 'PP.D.......]', '[[[[[[[[[G[['] },
  // das Flamingo-Gehege entsteht, sobald man den ersten Flamingo fängt (Event „Flamingo-Flug“)
  { id: 'flamingo', tx: 24, ty: 43, rows: ['#....##..###', '.....##..###', '.....##..###', '.....##.....', 'b^^^^GG^^^^^', '.;.........;', '.;.f.....g.;', '.;...www...;', '.;..wwwww..;', '.;..wwwww..;', '.;..wwwww..;', '.;...www...;', '.;.g.....f.;', '.;.........;', 'b^^^^^^^^^^^', '............'] },
];

// in welchem Abschnitt eine Zeile der ganzen Karte liegt
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
// (ihr arrive gehört zum Ziel)
function parkSection(id, { x0, x1, y0, y1, edits, exits, ...def }) {
  const rows = [...PARK_ROWS];
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
    [1, 46, '2'], // früher der Ausgang in den Wald
    [55, 40, 'b'], // ... und auf die Wiese
  ],
  name: tr('Tierpark', 'Zoo'),
  part: { name: tr('Zentrum', 'Center'), icon: 'hero' }, // Feld im Tierpark-Schild der Weltkarte
  // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
  car: { tx: 34, ty: 44, texture: 'car_zoo', frame: 0, scale: 1.26 },
  map: { x: 20, y: 33, icon: 'hero' }, // der Tierpark ist das Zuhause der Spielfigur (in Nordamerika, dort ist Platz für das große Schild)
  start: { tx: 29, ty: 40 }, // Spielstart: auf dem Vorplatz vor dem Haupthaus
  // Randstreifen: Boden der Welt, deren Gehege dort stehen (Zäune, Füller und Zwischenräume)
  grounds: [{ area: { tx0: 0, tx1: 22, ty0: 22, ty1: 60 }, ground: ['fgrass0', 'fgrass1', 'fgrass2'] }],
  // große Bilder jenseits des Kartenrands (ganz hinten): der dunkle Wald hinter dem Wolfswald; Kachel und ihr Punkt im Bild
  backdrops: [{ key: 'wolf_forest_edge', tx: 0, ty: 29, ox: 560, oy: 400 }],
  // Katzenhaus mit Glaswänden (begehbar, Dach wird beim Betreten durchsichtig) und das Haupthaus in der Mitte
  buildings: [{ tx0: 47, ty0: 24, tx1: 53, ty1: 28, style: 'cathouse' }, { tx0: 25, ty0: 31, tx1: 33, ty1: 38, style: 'office' }],
  iceStand: { tx: 25, ty: 40 }, // Eisstand-Event: der Eiswagen steht mitten im Park vor dem Haupthaus, links am Vorplatz
  computers: [{ tx: 30, ty: 33 }], // Hauptrechner im Haupthaus (Events)
  feeders: [{ tx: 39, ty: 32, world: 'meadow' }, { tx: 22, ty: 45, world: 'forest' }],
  // Themenbereiche: am großen Wegweiser in der Mitte zeigen die Bretter dorthin
  signScale: 1.25,
  sections: [
    { label: tr('Savanne', 'Savanna'), tx: 40, ty: 22 },
    { label: tr('Aquarium', 'Aquarium'), tx: 40, ty: 22, like: tr('Savanne', 'Savanna') }, // der Weg dorthin führt durch die Savanne
    { label: tr('Wald', 'Forest'), tx: 12, ty: 46 },
    { label: tr('Wiese', 'Meadow'), tx: 46, ty: 41 },
    { label: tr('Bambuswald', 'Bamboo Forest'), tx: 38, ty: 60 },
    { label: tr('Dschungel', 'Jungle'), tx: 38, ty: 60, like: tr('Bambuswald', 'Bamboo Forest') }, // der Weg dorthin führt durch den Bambuswald
  ],
  exits: [
    { tx: 32, ty: 0, to: 'park2', arrive: { tx: 24, ty: 22 }, label: tr('Savanne & Aquarium', 'Savanna & Aquarium') },
    { tx: 48, ty: 0, to: 'park2', arrive: { tx: 40, ty: 22 }, label: tr('Savanne & Aquarium', 'Savanna & Aquarium') },
    { tx: 38, ty: 38, to: 'park3', arrive: { tx: 26, ty: 1 }, label: tr('Bambuswald & Dschungel', 'Bamboo Forest & Jungle') },
  ],
});

// Savanne mit dem Aquarium (Tür in der Fassade oben links). Unten geht es zurück ins Zentrum
LEVELS.park2 = parkSection('park2', {
  x0: 8, x1: 78, y0: 0, y1: 24,
  edits: [
    [34, 0, '3'], // früher der Ausgang in die Savanne
    [8, 23, edgeRow(8, '3'.repeat(47), [32, 48])],
    [8, 24, ' '.repeat(47)],
    [33, 21, 'W'], // Wegweiser an der Kreuzung beim Auto
  ],
  name: tr('Tierpark: Savanne & Aquarium', 'Zoo: Savanna & Aquarium'),
  background: '#b89a52', // Farbe außerhalb der Karte (trockenes Gras)
  part: { name: tr('Savanne & Aquarium', 'Savanna & Aquarium'), icon: 'giraffe' },
  car: { tx: 37.16, ty: 19.32, texture: 'car_zoo', frame: 0, scale: 1.26 },
  start: { tx: 32, ty: 22 },
  grounds: [
    { area: { tx0: 8, tx1: 16, ty0: 0, ty1: 18 }, ground: ['grass0', 'grass1', 'grass2'] }, // Wiese ums Aquarium (vor der Savanne, die erste Fläche gilt)
    { area: { tx0: 8, tx1: 78, ty0: 0, ty1: 24 }, ground: ['sgrass0', 'sgrass1', 'sgrass2'] }, // mit den Gehegen der Wetterphasen rechts
  ],
  // Fische im Pflaster: von der Wegkreuzung oben bei der Savanne bis zum Aquarium, die Nasen zeigen dorthin
  pathMarks: [31, 28, 25, 22, 19, 16, 13].map((tx) => ({ tx, ty: 15, dir: { tx: -1, ty: 0 } })),
  feeders: [{ tx: 37, ty: 14, world: 'savanna' }],
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

// Bambuswald und rechts daneben der Dschungel mit dem Reptilienhaus. Oben geht es zurück ins Zentrum
LEVELS.park3 = parkSection('park3', {
  x0: 12, x1: 95, y0: 59, y1: 97, // unten im Dschungel-Teil: Jaguar- und Gorilla-Gehege (Zeilen 83 bis 97)
  edits: [
    [12, 59, edgeRow(12, '5'.repeat(44), [38])],
    [35, 82, 'b'], // früher der Ausgang in den Bambuswald
  ],
  name: tr('Tierpark: Bambuswald & Dschungel', 'Zoo: Bamboo Forest & Jungle'),
  part: { name: tr('Bambuswald & Dschungel', 'Bamboo Forest & Jungle'), icon: 'panda' },
  car: { tx: 38.16, ty: 78.32, texture: 'car_zoo', frame: 0, scale: 1.26 },
  start: { tx: 38, ty: 60 },
  grounds: [
    { area: { tx0: 60, tx1: 95, ty0: 59, ty1: 97 }, ground: ['jgrass0', 'jgrass1', 'jgrass2'] }, // Dschungel-Bereich (rechts neben Asien)
    { area: { tx0: 56, tx1: 59, ty0: 72, ty1: 97 }, ground: ['jgrass0', 'jgrass1', 'jgrass2'] },
    { area: { tx0: 12, tx1: 59, ty0: 59, ty1: 82 }, ground: ['agrass0', 'agrass1', 'agrass2'] }, // Asien-Bereich (mit dem breiteren Pandagehege)
  ],
  sections: [
    // kleiner Wegweiser im Bambuswald an der Abzweigung zum Dschungel (at: nur an diesem Pfosten)
    { label: tr('Dschungel', 'Jungle'), tx: 70, ty: 72, at: [43, 71] },
    { label: tr('Zentrum', 'Center'), tx: 38, ty: 59, at: [43, 71] },
    // kleiner Wegweiser beim Reptilienhaus: zurück zum Zentrum
    { label: tr('Zentrum', 'Center'), tx: 38, ty: 59, at: [85, 73] },
  ],
  exits: [
    { tx: 26, ty: 0, to: 'park', arrive: { tx: 38, ty: 37 }, label: tr('Zentrum', 'Center') },
    { tx: 74, ty: 11, to: 'reptiles', arrive: { tx: 8, ty: 16 }, label: tr('Reptilienhaus', 'Reptile House') }, // Tür in der Fassade im Dschungel-Bereich
  ],
});
