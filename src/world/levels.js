// Die Level (Biome). Jede Zeile ist eine Reihe Kacheln (ty), jedes Zeichen eine Kachel (tx).
//
// Boden:   .  Gras     #  Weg     =  Acker     ~  Wasser
//          X  Übergang in ein anderes Level (siehe exits)
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
//          o  Fischteich (hierhin bringt man gefangene Fische)   S  Schild am Fischteich
//          W  Wegweiser
//          1  Laubbaum   2  Tanne   3  trockener Strauch   (dichte Füller im Gehege-Streifen hinter dem oberen Kartenrand)
//          Q  Bambus     q  hohes Gras (Versteck)   J  Dschungelbaum   K  Kirschbaum   O  Sonnenfelsen
//          l  Steinlaterne   I  rotes Tor (Torii) über dem Weg   h  heiße Quelle   B  Brücke über den Teich
//          4  Busch      5  dichter Busch   6  Bambus (Füller)   (niedrige Füller rechts neben den Gehegen, damit sie die Tiere nicht verdecken)

export const LEVELS = {
  meadow: {
    name: 'Wiese',
    // Schnellreise: Auto (Kachel, Bild, Größe) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 12, ty: 27, texture: 'car_park', frame: 0, scale: 1.26 },
    map: { x: 51.5, y: 34, icon: 'sheep' },
    rows: [
      'TTbbTTTTbbTTTTTTbTTTXTTTTbTTTTTbTTTTTbTT',
      'T...................#..................T',
      'b...................#............T.....T',
      'b............f..T...#..................T',
      'b..b.....T..........#.g.....f.....b....T',
      'T...........b.......#......f...f.......T',
      'T...................#........b.........T',
      'b...................#..................T',
      'T...................#..................b',
      'T....~~~~~~.........#..........g.......b',
      'T...~~~~~~~~~.......#................b.b',
      'T...~~~~~~~~~....f..#....T.............T',
      'T....~~~~~~.....g...#..................T',
      'T...................#.............T....T',
      'T...........f..b....#..f...............T',
      'T...g...~~~~~~~.....#..................T',
      'b......~~~~~~~~~....#........b.........T',
      'T......f~~~~~~~~T...#..................T',
      'T..................W#..................b',
      'X######################################X',
      'T.......g...........#..................T',
      'T...fffgfff..MMMMM..#..................T',
      'b...fggfggf..Ns,pN..#......g......~~~..T',
      'T...fffgfff..Nc,,G###............~~~~~.T',
      'T..........r.MMMMM..#...T........~~~~~.T',
      'T...b...............#............~~~~~.T',
      'T...................#............~~~~~.T',
      'T...................#.......f.....~~~..T',
      'T...................#..................b',
      'b....======.....T...#.........r........T',
      'T....======.........#...............g..T',
      'T....======....g....#.....b............T',
      'T....======.........#..................T',
      'T...............f...#............T.....T',
      'T...................#..................T',
      'b.......T...........#..f...............T',
      'b...................#................T.T',
      'T...g...............#.........b........T',
      'T..........f........#..................b',
      'TTbbTTTTTTbTTTTTbTTTXTbbbTTTTTbTTTbbbTTT',
    ],
    grass: ['grass0', 'grass1', 'grass2'],
    path: 'path',
    start: { tx: 20, ty: 20 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 13, ty0: 21, tx1: 17, ty1: 24, style: 'meadow' },
    chests: [
      { tx: 14, ty: 23, tools: ['net', 'lasso'] },
    ],
    ambient: 'ambient_meadow', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [],
    // Übergänge: wer auf die Kachel tritt, kommt im Ziel-Level an der Kachel "arrive" heraus
    exits: [
      { tx: 20, ty: 0, to: 'park', arrive: { tx: 25, ty: 31 }, label: 'Tierpark' },
      { tx: 0, ty: 19, to: 'forest', arrive: { tx: 37, ty: 18 }, label: 'Wald' },
      { tx: 39, ty: 19, to: 'savanna', arrive: { tx: 1, ty: 19 }, label: 'Savanne' },
      { tx: 20, ty: 39, to: 'asia', arrive: { tx: 20, ty: 46 }, label: 'Asien' },
    ],
    // Spawner: so viele wilde Tiere sind ungefähr gleichzeitig unterwegs; die Zahlen dahinter sind die
    // Wahrscheinlichkeiten (je größer, desto häufiger). Tiere verschwinden nach einer Weile und neue kommen.
    spawn: { population: 14, weights: { sheep: 6, cat: 2, fish: 2, frog: 1.6, mole: 0.6 } },
    // Fischreiher fliegen unabhängig vom Spawner über die Karte: alle every Sekunden einer, landChance landet
    herons: { every: [50, 110], landChance: 0.5 },
  },

  forest: {
    name: 'Wald',
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 30, ty: 20, texture: 'car_forest', frame: 1, scale: 1.1 },
    map: { x: 53, y: 16, icon: 'stag' },
    rows: [
      'PPPPPPPPPPPPPPPPPPPPPPXPPPPPPPPPPPPPPPPP',
      'P...P.....n..........m#.....P....n.....P',
      'Pk.......D.....k.D....#nm.........D...kP',
      'PP....P........P.D....#mn...n..n....k.kP',
      'P...P.......D....D....#.n......P...n..kP',
      'Pk...............nnnn.#.n.............kP',
      'P...................D.#.n...P..m......kP',
      'PD..P....~~~~~...D....#D..........D...kP',
      'PP......~~~~~~~.n.PPPP#P..............DP',
      'P.......~~~~~~~...PPP.#................P',
      'Pk...P..~~~~~~~..PPPP.#.........mm....kP',
      'Pkkk....~~~~~~~.nL....#.PMMMMM........PP',
      'PP..n....~~~~~.########LDNs,pN.#......PP',
      'Pk.......n.....L.Dk...#.PNc,,G##......PP',
      'PD..P...k..n...P.Pk...#..MMMMM.#......PP',
      'PP.....kk.PD..PPDP...n#........#..P...kP',
      'PP......k......P.P..D.#.D......#.......P',
      'PPPPD.Dnkmn...D.......#........#......DP',
      'PD......###############################X',
      'Pkn.......DnnnnD.#......#..............P',
      'PD..P....PkD.....#m..P..#.D.........P..P',
      'PP..D.....Pm.....#......#......m......kP',
      'PDn............D.#......#..P........n..P',
      'PD.....D.......D.#.P..D.#.k...m........P',
      'PD.............D.#......#.......n......P',
      'PD...D....~....D.#P....................P',
      'PPnnnnn..~~~~~..m#n...~~~.n....D....m.DP',
      'PP..n...~~~~~~~###...~~~~.........k....P',
      'PDPPPPP..~~~~~..D....~~~~..P...........P',
      'P........~~~~~.......~~~~..............P',
      'P........~~~~~.......~~~~....P........kP',
      'PPkkkkkn..~......D...~~~~.D............P',
      'Pkkk....D.....n.......~~~..........n...P',
      'PD..P........Pn........................P',
      'PD............n.P..P.......k...k......PP',
      'PD............n..............D..n...k..P',
      'PD....Pn......n...m......n..LLP.PPPPDkDP',
      'PD..D...PDn....L.....PD.PD.n.P..PkkkkkDP',
      'PPkkkkkDPDDkkkkDkDDDDDkPPD.PkDPDDDDDkkPP',
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP',
    ],
    grass: ['fgrass0', 'fgrass1', 'fgrass2'],
    path: 'forest_path',
    start: { tx: 37, ty: 18 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 25, ty0: 11, tx1: 29, ty1: 14, style: 'forest' },
    chests: [
      { tx: 26, ty: 13, tools: ['net', 'lasso', 'trap'] },
    ],
    hero: 'hero_forest', // Kleidung der Spielfigur in diesem Gebiet (Pfadfinder)
    ambient: 'ambient_forest', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [],
    exits: [
      { tx: 22, ty: 0, to: 'park', arrive: { tx: 25, ty: 31 }, label: 'Tierpark' },
      { tx: 39, ty: 18, to: 'meadow', arrive: { tx: 1, ty: 19 }, label: 'Wiese' },
    ],
    spawn: { population: 12, weights: { deer: 4, squirrel: 2.5, fish: 2.5, frog: 1.6, fox: 1, stag: 0.4 } },
    herons: { every: [50, 110], landChance: 0.5 },
  },

  savanna: {
    name: 'Savanne',
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 14, ty: 26, texture: 'car_savanna', frame: 0, scale: 1.15 },
    map: { x: 58, y: 63, icon: 'giraffe' },
    rows: [
      'AvvvvvvRvAvvvvvvRvAvXvvvvRvAvvvvvvRvAvvv',
      'R...................#..................v',
      'v.y.....v..y.....y..#...........yv...v.v',
      'v.....v.......y..y..#..................v',
      'v.........y..v......#....y..v......y..yv',
      'v...............y.v.#............v.....v',
      'v.v..........v......#.y............y...A',
      'v.....~~.~~........y#..................R',
      'v....~~~~~~....y....#..................v',
      'A.....~~~~~~y.......#.....v............v',
      'R..v.~~~~~~..y......#y.v...............v',
      'v.......~~......Ry.y#......v..v..A...y.v',
      'v......y.....vy...y.#..................v',
      'v....y.....y........#..................v',
      'v.v.......v.........#..................v',
      'v................R..#................y.A',
      'v.................y.#.y................R',
      'v.yv....A..R........#...A........y.....v',
      'A...................#.............y.yA.v',
      'X##############################........v',
      'v............MMMMM..#..................v',
      'v............Ns,pN..#...v.....R........v',
      'v...y.y......Nc,,G###.....A......y.....v',
      'v...R........MMMMM..#...............R..v',
      'v.......v...........#...v..A...y.......A',
      'v................yy.#..................R',
      'v..y................#..................v',
      'A....A..~~.......v..#..R...........y...v',
      'R......~~~~~........#........~~~~~.A...v',
      'v......~~~~~........#.......~~~~~~..y..v',
      'v......~~~~~........#..v...~~~~~~~~.y..v',
      'v...R..~~~~~y.A..R..#........~~~~~.....v',
      'v.......~~~.........#..A..y....~~......v',
      'v.......~~......y...#...............v..A',
      'v....A..............#....v...........y.R',
      'v........v...v....A........v...........v',
      'A.......y...........y..y....y....v.....v',
      'R.v.v...v......v.v......v....v.........v',
      'v......................................v',
      'vvvvRvAvvvvvvRvAvvvvvvRvAvvvvvvRvAvvvvvv',
    ],
    grass: ['sgrass0', 'sgrass1', 'sgrass2'],
    path: 'savanna_path',
    start: { tx: 2, ty: 19 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 13, ty0: 20, tx1: 17, ty1: 23, style: 'savanna' },
    chests: [
      { tx: 14, ty: 22, tools: ['net', 'lasso', 'food'] },
    ],
    hero: 'hero_savanna', // Kleidung der Spielfigur in diesem Gebiet (Safari)
    background: '#b89a52', // Farbe außerhalb der Karte (trockenes Gras)
    ambient: 'ambient_savanna', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    ambientVolume: 0.35, // etwas leiser als in den anderen Gebieten (0.55)
    toolSpots: [],
    exits: [
      { tx: 20, ty: 0, to: 'park', arrive: { tx: 25, ty: 31 }, label: 'Tierpark' },
      { tx: 0, ty: 19, to: 'meadow', arrive: { tx: 38, ty: 19 }, label: 'Wiese' },
    ],
    // Hier leben Antilopen (Gazellen) und Zebras in Gruppen zu 2 bis 4, etwa gleich häufig, und Giraffen;
    // keine Fischreiher. Giraffen sind viel seltener und erscheinen meist an Bäumen
    // Erdmännchen kommen als Kolonie (3 bis 5), seltener als Antilopen und Zebras
    // Löwen sind selten (meist höchstens einer) und dösen immer unter einer Akazie; Krokodile tauchen
    // wie Fische in den Wasserlöchern auf, sind aber deutlich seltener
    // population zählt hier Plätze: eine Herde oder Kolonie belegt nur einen
    spawn: { population: 8, weights: { antelope: 0.6, zebra: 0.6, giraffe: 0.4, meerkat: 0.3, lion: 0.25, crocodile: 0.2 } },
  },

  asia: {
    name: 'Asien',
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 11, ty: 42, texture: 'car_asia', frame: 1, scale: 1.3 },
    map: { x: 78, y: 37, icon: 'koi' },
    rows: [
      'JQQJQQJQQJQQJQQJQQJQXJQQJQQJQQJQQJQQJQQk',
      'Q.....nqnq....q.q...#...qqq.QQ.Q..QQQQqk',
      'Q......nJ.n.Jn.J.J..#...qqQ..QQQq.QQq.Qk',
      'J..J.J........nnn...#..Q...QQ...qqQQq.Qk',
      'Q..nq..n..qqn.......#...qq.Qqq.Qq.QQqqQk',
      'Q.....q...n.J.....n.#..QqqQ.qqQ.q.Q.q.Qk',
      'J.J..nJ..J...qJ..J..#..QQQQQ.qqQ.QqqQQQk',
      'Qn..........q.......#...Q.QQ.qqQQQqq.QQk',
      'Qq....JnJ...J....J..#.....qqqQ.QQQqqq.qk',
      'J.J.q.....nq..J.....#..QqqqqqqQqqqqqQqqk',
      'Qn...nn.n...........#...qqQQqqq.qqQQ...k',
      'Q...........Jq....q.#..QQ.Q.Q....qQQQQqk',
      'J.....n.n.n.n...n...#..................k',
      'Q.....#############################....k',
      'Q..n.n.n...q....q...#..................k',
      'J.J....n....J.....J.#..Q.QqqqqQQ.Q.Q.qqk',
      'Qnq....q.n.....K....#..qqKQQQQQ..q....qk',
      'Q.J..J..............#...q.........QQ.QQk',
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
      'Q......hhhhh.rNs,pN.#...q..............k',
      'Q.......hhh.r.Nc,,G##........O.n.......k',
      'J.............MMMMM.#............O.....k',
      'Q............q......#..................k',
      'Q...............q..l#l..........q......k',
      'J...................#...K..q...q.......k',
      'Q..............K....#..................k',
      'Q..q................I...........q......k',
      'J..........n........#.....K............k',
      'Q............K......#..................k',
      'kkkkkkkkkkkkkkkkkkkkXkkkkkkkkkkkkkkkkkkk',
    ],
    grass: ['agrass0', 'agrass1', 'agrass2'],
    path: 'asia_path',
    water: ['asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water1', 'asia_water2'], // Koi-Teich, ab und zu Seerosen und Lotus
    start: { tx: 20, ty: 45 },
    enclosures: [], // die Gehege sind im Tierpark
    // begehbare Hütte (Wände, Tür zum Weg, Dach wird beim Betreten durchsichtig); die Werkzeuge liegen in der Kiste
    hut: { tx0: 14, ty0: 36, tx1: 18, ty1: 39, style: 'asia' },
    chests: [
      { tx: 15, ty: 38, tools: ['net', 'lasso', 'koifood'] },
      { tx: 19, ty: 23, tools: ['net', 'koifood'] },
    ],
    hero: 'hero_asia', // Kleidung der Spielfigur in diesem Gebiet (Strohhut)
    ambient: 'ambient_asia', // Asien-Geräusche, leise über die Wiesengeräusche gelegt (siehe tools/prepare-sounds.js)
    background: '#3f7a35',
    toolSpots: [],
    // Eingang im Süden: unten am Hauptweg, unter dem roten Tor hindurch
    exits: [
      { tx: 20, ty: 0, to: 'park', arrive: { tx: 25, ty: 31 }, label: 'Tierpark' },
      { tx: 20, ty: 47, to: 'meadow', arrive: { tx: 20, ty: 38 }, label: 'Wiese' },
    ],
    // Koi leben im Koi-Teich (nur als Schatten zu sehen, bis man sie mit Fischfutter anlockt)
    spawn: { population: 5, weights: { koi: 1 } },
  },

  // Tierpark: alle Gehege aus allen Welten. Gefangene Tiere ziehen beim Betreten automatisch in ihr Gehege ein
  // (siehe moveFollowersIntoPens in GardenScene). Erreichbar oben aus jeder Welt.
  park: {
    name: 'Tierpark',
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 22, ty: 33, texture: 'car_park', frame: 1, scale: 1.26 },
    map: { x: 42, y: 32, icon: 'hero' }, // der Tierpark ist das Zuhause der Spielfigur
    // jede Welt hat ihre eigene Seite: Savanne oben, Wald links, Wiese rechts, Asien unten. Die Gehege sind in den
    // Rand eingelassen, ihre Tore zeigen zum Rundweg; der Ausgang in eine Welt liegt mitten in deren Seite.
    rows: [
      'TTTTTTTTTTTTTTTTTTTXTTTTTTTTTTTTTTTTTTTTTTTb',
      'T333333333333333333#33333333[[[[[[[[[[[[[[3b',
      'T333333333333333333#33333333]............]3b',
      'T333333333333333333#33333333].........A..]3b',
      'T333333333333333333#33333333]..A.........]3b',
      'T333333333333333333#33333333]......A...y.]3b',
      'T3{{{{{{{{3[[[[[[[3#3------3].....wwww...]3b',
      'T3}......}3].....]3#3|....|3].y..wwwww...]3b',
      'T3}.oooo.}3].A...]3#3|.u..|3]...A.www...A]3b',
      'T3}.oooo.}3]...R.]3#3|....|3].......y....]3b',
      'T3}......}3].....]3#3|....|3]............]3b',
      'T3{{GGG{{{3[[GGG[[3#3--GG--3[[[[GGGGG[[[[[3b',
      'T|--------|##########################|----|b',
      'T|........|#............###.........#|....|b',
      'T|..n.....G#..y.y.v.....##..v.y...v.#G..f.|b',
      'T|........G#.D.y......v.##..........#G....|b',
      'T|.....m..G#...Av..A.A..##..y....b..#G....|b',
      'T|........|#.......y....##.......T..#|.g..|b',
      'T|--------|#......y.....##.v...bf...#|....|b',
      'T2222222222#.........y..##......g.f.#|----|b',
      'T222|-----|#.D.n...v....##......fgf.#444444b',
      'T222|.....|#.....m.n....##..........#!____!b',
      'T222|..U..G#....D.......##...fg.....#!,,C,!b',
      'T222|.....|#..P.....m...##..f.....b.#G,,,,!b',
      'T222|-----|#............##.b....f...#G,,,,!b',
      'T2222222222#....n.......##.......g..#G,,,,!b',
      'X###########.D...mP.....##.......g..#!,,C,!b',
      'T2222222222#......D..########.b.f...#!____!b',
      'T2222}{{{{}#.DD..D...########.......#444444b',
      'T2222}....}#.........########......########X',
      'T2222}....}#############W############444444b',
      'T2222}.oo.G##########################}{{{{}b',
      'T2222}.oo.G##........########.......#}....}b',
      'T2222}.oo.G#.........########....fb.#G.oo.}b',
      'T2222}....}#.........########..f....#G.oo.}b',
      'T2222}....}#......n.....##........b.#G.oo.}b',
      'T2222}{{{{}#.......n.n..##..ggbf.g..#}.oo.}b',
      'T2222222222#....m.m...m.##....g.....#}....}b',
      'T2;^^^^^^^;#..D.........##..g...T...#}{{{{}b',
      'T2;.......;#............##..g.......#444444b',
      'T2;..P....G#......mm..q.##..b..g....#;^^^^;b',
      'T2;.......G#.m.P...K.K..##.l..fgg.b.#;....;b',
      'T2;...ww..G#............##...K....g.#G....;b',
      'T2;...ww..G#....n.q..l..##.l........#G....;b',
      'T2;...ww..G#..n.q.......##..........#G.ww.;b',
      'T2;.....P.;#....ll......##...K.lK.f.#G.ww.;b',
      'T2;.......;#...q.qq.....##...q.l....#G.ww.;b',
      'T2;^^^^^^^;#...........###..........#;....;b',
      'T2222222222##########################;^^^^;b',
      'T55555555555555----GGG----5#555555555555555b',
      'T55555555555555|l.......K|5#555555555555555b',
      'T55555555555555|..ooooo..|5#555555555555555b',
      'T55555555555555|.ooooooo.|5#555555555555555b',
      'T55555555555555|K.ooooo.l|5#555555555555555b',
      'T55555555555555-----------5#555555555555555b',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbXbbbbbbbbbbbbbbbb',
    ],
    grass: ['grass0', 'grass1', 'grass2'],
    path: 'park_path',
    start: { tx: 25, ty: 31 }, // direkt vor dem großen Wegweiser (dort kommt man auch aus allen Welten an)
    // ground/water: Boden und Teichwasser im Gehege, passend zur Welt, aus der die Tiere kommen
    enclosures: [
      { id: 'crocodile', name: 'Krokodilteich', area: { tx0: 3, tx1: 8, ty0: 7, ty1: 10 }, species: ['crocodile'], gate: 'chain', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'] },
      { id: 'lion', name: 'Löwengehege', area: { tx0: 12, tx1: 16, ty0: 7, ty1: 10 }, species: ['lion'], gate: 'tall', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'] },
      { id: 'meerkat', name: 'Erdmännchenbau', area: { tx0: 22, tx1: 25, ty0: 7, ty1: 10 }, species: ['meerkat'], world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'] },
      { id: 'savanna', name: 'Savannengehege', area: { tx0: 29, tx1: 40, ty0: 2, ty1: 10 }, species: ['antelope', 'zebra', 'giraffe'], gate: 'tall', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'] },
      { id: 'deerpark', name: 'Hirschgehege', area: { tx0: 2, tx1: 9, ty0: 13, ty1: 17 }, species: ['deer', 'stag'], world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'] },
      { id: 'foxden', name: 'Fuchsbau', area: { tx0: 5, tx1: 9, ty0: 21, ty1: 23 }, species: ['fox'], world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'] },
      { id: 'forestpond', name: 'Teich', area: { tx0: 6, tx1: 9, ty0: 29, ty1: 35 }, species: ['frog', 'fish'], gate: 'chain', signKey: 'pond', world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'] },
      { id: 'forestaviary', name: 'Voliere', area: { tx0: 3, tx1: 9, ty0: 39, ty1: 46 }, species: ['squirrel', 'heron'], netRoof: true, gate: 'net', world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'] },
      { id: 'pasture', name: 'Weide', area: { tx0: 38, tx1: 41, ty0: 13, ty1: 18 }, species: ['sheep', 'mole'], world: 'meadow' },
      { id: 'cats', name: 'Katzenhaus', area: { tx0: 38, tx1: 41, ty0: 22, ty1: 26 }, species: ['cat'], gate: 'glass', world: 'meadow' },
      { id: 'pond', name: 'Teich', area: { tx0: 38, tx1: 41, ty0: 32, ty1: 37 }, species: ['frog', 'fish'], gate: 'chain', world: 'meadow' },
      { id: 'aviary', name: 'Voliere', area: { tx0: 38, tx1: 41, ty0: 41, ty1: 47 }, species: ['heron'], netRoof: true, gate: 'net', world: 'meadow' },
      { id: 'koipond', name: 'Koi-Teich', area: { tx0: 16, tx1: 24, ty0: 50, ty1: 53 }, species: ['koi'], signKey: 'koi', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], water: ['asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water1', 'asia_water2'] },
    ],
    // Randstreifen: Boden der Welt, deren Gehege dort stehen (Zäune, Füller und Zwischenräume)
    grounds: [
      { area: { tx0: 1, tx1: 42, ty0: 1, ty1: 11 }, ground: ['sgrass0', 'sgrass1', 'sgrass2'] },
      { area: { tx0: 1, tx1: 10, ty0: 12, ty1: 48 }, ground: ['fgrass0', 'fgrass1', 'fgrass2'] },
      { area: { tx0: 1, tx1: 42, ty0: 49, ty1: 54 }, ground: ['agrass0', 'agrass1', 'agrass2'] },
    ],
    toolSpots: [],
    ambient: 'ambient_meadow',
    background: '#4f8a2f',
    // Themenbereiche: am großen Wegweiser in der Mitte zeigen die Bretter dorthin
    signScale: 1.6,
    sections: [
      { label: 'Savanne', tx: 19, ty: 8 },
      { label: 'Wald', tx: 7, ty: 28 },
      { label: 'Wiese', tx: 40, ty: 30 },
      { label: 'Asien', tx: 20, ty: 52 },
    ],
    exits: [
      { tx: 19, ty: 0, to: 'savanna', arrive: { tx: 20, ty: 1 }, label: 'Savanne' },
      { tx: 0, ty: 26, to: 'forest', arrive: { tx: 22, ty: 1 }, label: 'Wald' },
      { tx: 43, ty: 29, to: 'meadow', arrive: { tx: 20, ty: 1 }, label: 'Wiese' },
      { tx: 27, ty: 55, to: 'asia', arrive: { tx: 20, ty: 1 }, label: 'Asien' },
    ],
    spawn: { population: 0, weights: {} },
  },
};
