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
    car: { tx: 12.16, ty: 26.48, texture: 'car_park', frame: 0, scale: 1.26 },
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
      'T.......g..#........#..................T',
      'T...fffgfff#.MMMMM..#..................T',
      'b...fggfggf#.Nap,N..#......g......~~~..T',
      'T...fffgfff#.N,j,G###............~~~~~.T',
      'T..........##MMMMM..#...T........~~~~~.T',
      'T...b......###.c....#............~~~~~.T',
      'T..........##.......#............~~~~~.T',
      'T..........##.......#.......f.....~~~..T',
      'T..........#........#..................b',
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
      { tx: 15, ty: 25, tools: ['net', 'lasso'] },
    ],
    ambient: 'ambient_meadow', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [],
    // Übergänge: wer auf die Kachel tritt, kommt im Ziel-Level an der Kachel "arrive" heraus
    exits: [
      { tx: 20, ty: 0, to: 'park', arrive: { tx: 37, ty: 42 }, label: 'Tierpark' },
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
    car: { tx: 24.16, ty: 16.24, texture: 'car_forest', frame: 1, scale: 1.1 },
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
      'PP..n....~~~~~.########LDNap,N.#......PP',
      'Pk.......n.....L.Dk...#.PN,j,G##......PP',
      'PD..P...k..n...P.Pk...#.#MMMMM.#......PP',
      'PP.....kk.PD..PPDP...n####.c...#..P...kP',
      'PP......k......P.P..D.###......#.......P',
      'PPPPD.Dnkmn...D.......###......#......DP',
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
      { tx: 27, ty: 15, tools: ['net', 'lasso', 'trap'] },
    ],
    hero: 'hero_forest', // Kleidung der Spielfigur in diesem Gebiet (Pfadfinder)
    ambient: 'ambient_forest', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [],
    exits: [
      { tx: 22, ty: 0, to: 'park', arrive: { tx: 37, ty: 42 }, label: 'Tierpark' },
      { tx: 39, ty: 18, to: 'meadow', arrive: { tx: 1, ty: 19 }, label: 'Wiese' },
    ],
    spawn: { population: 12, weights: { deer: 4, squirrel: 2.5, fish: 2.5, frog: 1.6, fox: 1, stag: 0.4 } },
    herons: { every: [50, 110], landChance: 0.5 },
  },

  savanna: {
    name: 'Savanne',
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 12.16, ty: 25.32, texture: 'car_savanna', frame: 0, scale: 1.15 },
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
      'v..........#.MMMMM..#..................v',
      'v..........#.Nap,N..#...v.....R........v',
      'v...y.y....#.N,j,G###.....A......y.....v',
      'v...R......##MMMMM..#...............R..v',
      'v.......v..###.c....#...v..A...y.......A',
      'v..........##....yy.#..................R',
      'v..y.......##.......#..................v',
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
      { tx: 15, ty: 24, tools: ['net', 'lasso', 'food'] },
    ],
    hero: 'hero_savanna', // Kleidung der Spielfigur in diesem Gebiet (Safari)
    background: '#b89a52', // Farbe außerhalb der Karte (trockenes Gras)
    ambient: 'ambient_savanna', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    ambientVolume: 0.35, // etwas leiser als in den anderen Gebieten (0.55)
    toolSpots: [],
    exits: [
      { tx: 20, ty: 0, to: 'park', arrive: { tx: 37, ty: 42 }, label: 'Tierpark' },
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
    car: { tx: 13.16, ty: 41.54, texture: 'car_asia', frame: 1, scale: 1.3 },
    map: { x: 78, y: 37, icon: 'koi' },
    rows: [
      'JQQJQQJQQJQQJQQJQQJQXJQQJQQJQQJQQJQQJQQk',
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
      'Q...........##..q..l#l..........hhhr...k',
      'J...........##......#...K..q..rhhhhh...k',
      'Q...........#..K....#..........hhhhhr..k',
      'Q..q................I...........hhh....k',
      'J..........n........#.....K....r.......k',
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
      { tx: 16, ty: 40, tools: ['net', 'lasso', 'koifood', 'food', 'ball'] }, // Grünfutter für die Pandas, Ball zum Anlocken des Tigers
      { tx: 19, ty: 23, tools: ['net', 'koifood'] },
    ],
    hero: 'hero_asia', // Kleidung der Spielfigur in diesem Gebiet (Strohhut)
    ambient: 'ambient_asia', // Asien-Geräusche, leise über die Wiesengeräusche gelegt (siehe tools/prepare-sounds.js)
    background: '#3f7a35',
    toolSpots: [],
    // Eingang im Süden: unten am Hauptweg, unter dem roten Tor hindurch
    exits: [
      { tx: 20, ty: 0, to: 'park', arrive: { tx: 37, ty: 42 }, label: 'Tierpark' },
      { tx: 20, ty: 47, to: 'meadow', arrive: { tx: 20, ty: 38 }, label: 'Wiese' },
    ],
    // Koi leben im Koi-Teich (nur als Schatten zu sehen, bis man sie mit Fischfutter anlockt)
    spawn: { population: 9, weights: { koi: 1, panda: 0.4, macaque: 0.7, tiger: 0.35, orangutan: 0.35, peacock: 0.8 } }, // Pandas beim Bambus, Japanmakaken in der heißen Quelle, Tiger als Schemen im Bambuswald
  },

  // Tierpark: alle Gehege aus allen Welten. Gefangene Tiere ziehen beim Betreten automatisch in ihr Gehege ein
  // (siehe moveFollowersIntoPens in GardenScene). Erreichbar oben aus jeder Welt.
  park: {
    name: 'Tierpark',
    // Schnellreise: Auto (Kachel, Bild) und Lage auf der Weltkarte (in Prozent)
    car: { tx: 34, ty: 44, texture: 'car_park', frame: 1, scale: 1.26 },
    map: { x: 42, y: 32, icon: 'hero' }, // der Tierpark ist das Zuhause der Spielfigur
    // jede Welt hat ihre eigene Seite: Savanne oben, Wald links, Wiese rechts, Asien unten. Die Gehege sind in den
    // Rand eingelassen, ihre Tore zeigen zum Rundweg; der Ausgang in eine Welt liegt mitten in deren Seite.
    rows: [
      '                                 3X3333333333333333333  ',
      '                                 3#[[[[[[[[[[[[[[[[[[3  ',
      '                                 3#].y..............]3  ',
      '                                 3#]..A..yyy....A...]3  ',
      '                                 3#].@...www........]3  ',
      '                         333333333#]....wwww........]333',
      '                         3A..A....#[[[[[[[[[y.......]..3',
      '                         3.yv.....#########].yyA.y..].y3',
      '                         3[[[[[[[[[[....v.#]..y.....]..3',
      '                         3]........]....A.#].......y]..3',
      '                 333333333].A.y....]......#G..y..y..]..3',
      '                 3.....v..].....$..G#.y.A.#G........]y.3',
      '                 3....y...]........G#.v...#].....A..]vy3',
      '                 3.y...y..]...y..y.]#vy.A.#]........].A3',
      '            333333..y.....[[[[[[[[[[#F....#[[[[[[[[[[..3',
      '            3v...#####################################y3',
      '            3v{{{GG{{{..---G---.#.v.....v...y.v.#.v..vy3',
      '            3.}......}..|.....|.#....A...A....v.#...R..3',
      '            3.}.oooo.}..|..u..|.#..y.....y....v.#..vy..3',
      '            3.}.oooo.}..|.....|.#........yyy..A.#y..A..3',
      '            3.}y.ooo.}..|y.y..|.#..............y#...y..3',
      '            3.}......}..-------.#..R.....vy..y..#....A.3',
      '            3.{{{{{{{{..y...y..y#v...........R..#v....v3',
      '22222222222222222222222################################b',
      '           2.^^^^^^^^^^#............###.{{{{{.#MMMMMMM.b',
      '           2.;.n......;#..y.y.v.....###{{%..{{#N.C...N.b',
      '           2.;.P...ww.;#.D.y......v.###}.oo..G#N....CN.b',
      '           2k;.....ww.G#...Av..A.A..###}.ooo.}#N.....N.b',
      '           2.;...m....G#.......y....###}..oo.}#MMMGMMM.b',
      '           2.;....^^^^^#......y.....###{{..%{{#####g...b',
      '           2.;.P..;..kk#b.........b.###b{{{{{bb...####.b',
      '           2.;....;....#.MMMMMMMMM..###.g.....b..b...##b',
      '           2.;*...;....#.NZ.....sN..###Fb.b....g..g..b#b',
      '      222222m;..P.;....#.N...z...N..###-------------..#b',
      '      2mk....^^^^^^kkn.#.N..VYV..N..###|...........|.b#b',
      '      2.################.NVt.....N..###|...........|.b#b',
      '      2.------GG---.km.#.Ndix....N..###|....T......---#b',
      '      2k|.........|k.n.#.Ns.....ZN..###|.............|#b',
      '      2.|....D....----k#.MMMMGGMMM.####|..@..........|#b',
      '      2.|............|m#bg.#####.fb####|...f......T..|#b',
      '      2.|.P..........|.#..f#####g..####G.............|#X',
      '      2.|.m......D.&n|k#############W##G.............|.b',
      '      2.|n...........|.################|.........f...|.b',
      '      2.|...D........|.##........######---...........|.b',
      ' 222222.----...m.....|k#.........######..|...........|.b',
      ' 2mm...nkmn-----------F#.........######g.-------------.b',
      ' X######################......n.....###.....ff.b.b...g.b',
      ' 2.---G---k#.{{{{{{..m.#.......n.n..###.b..gf.T.....bTbb',
      ' 2--n....--#{{%...{{mD.#....m.m...m.########g.....bff..b',
      ' 2|..n....|#}..oo..}...#..D.........###..f.#.^^^^^.....b',
      ' 2|.mU.n..|#}.oooom}.n.#............###g.g.#.;.*.;.....b',
      ' 2|n......|#G.oooo.}...#......mm..q.###....#g;.w.;....bb',
      ' 2--.....--#}mnooo.}...#.m.P..0K.K..###g..g#.;...;b....b',
      ' 2.-------m#{{...%{{kkn#............###...b##G...^^^^^.b',
      ' 2222222.k.#.{{{{{{.k..#....n.q..l..###.bb.#.G.......;fb',
      '       2m..#.......kn..#..n.q.......###..T.##;...w...;.b',
      '       2mm.#.mn....k...#....ll......###..fb.#;.......;.b',
      '       2.n.#############...q.qq.....###b.b..#^^^^^^^^^.b',
      '       2.k.n..k......nk#...........####..f..#..b...f...b',
      '22222222222222222222222################################b',
      '            5..................q......#................b',
      '            T..6^^^^^^......K..r......I.K..[[[[[[[[[[[[b',
      '            5.6^^....^^^K.............#....]...Q......]b',
      '            T.^^.9.....;......#########...[[.......Q..]b',
      '            5.;......q.^^l...##.......##..].....K.....]b',
      '            T.;..hhhh...;...##..KlK.l..##.]...8.....Q.]b',
      '            5.;.r.hhh...G####.K....q.q.K##[[.....7....]b',
      '            T.^^...h....G..#..l..q..ll...##G..........]b',
      '            5..^^......^^..#.lqooooooo.rq.#G..q...q...]b',
      '            T.K.^^^^^^^^.q.#..ooooooooo...#[[.........]b',
      '            5....l....q.r..###EEEEEEEEEE###.[[[[[..[[[[b',
      '            T..rll.qq.q....#.q.oooooooo.l.#.....[[[[...b',
      '            5..............##..q...ooor...#............b',
      '            T.[[[[[[[[[[[...##K.r.K..l..l##.[[[[[[[[[[[b',
      '            5[[.........[[...##...q.K..K##.[[.........]b',
      '            T]..J...9....[[...##.......####G..q....Q..]b',
      '            5].........9..G#############...G....w...Q.]b',
      '            T]L....H......G........#.......]..www8....]b',
      '            5]....9.......]........#.......]...ww...Q.]b',
      '            T]..9.....J...]....K...#.......].L....r...]b',
      '            5].......q...[[....r...#.....q.[[.........]b',
      '            T[[[[[[[[[[[[[....q..l.#.r......[[[[[[[[[[[b',
      '            bbbbbbbbbbbbbbbbbbbbbbbXbbbbbbbbbbbbbbbbbbbb',
    ],
    grass: ['grass0', 'grass1', 'grass2'],
    path: 'park_path',
    start: { tx: 29, ty: 40 }, // Spielstart: auf dem Vorplatz vor dem Haupthaus (aus den Welten kommt man am Wegweiser an)
    // ground/water: Boden und Teichwasser im Gehege, passend zur Welt, aus der die Tiere kommen
    // Gehege: slots = Plätze [vor, nach dem Ausbau]; basic = so sieht es vor dem Ausbau aus (Innenzaun bzw. ohne Ausstattung);
    // upgrade = was der Ausbau am Hauptrechner bringt (siehe penLevel in state.js)
    enclosures: [
      { id: 'crocodile', name: 'Krokodilteich', species: ['crocodile'], gate: 'chain', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 15, ty: 17 }, slots: [2, 3], upgrade: 'Größerer Teich', basic: [[17, 20, ':'], [18, 20, '<'], [19, 20, '.']] },
      { id: 'lion', name: 'Löwengehege', species: ['lion'], gate: 'tall', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 27, ty: 9 }, slots: [3, 5], upgrade: 'Großer Löwenfelsen', basic: [[32, 11, ':']] },
      { id: 'meerkat', name: 'Erdmännchenbau', species: ['meerkat'], world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 25, ty: 17 }, slots: [5, 8], upgrade: 'Erdhügel', basic: [[27, 18, ':'], [28, 19, '<']] },
      { id: 'savanna', name: 'Savannengehege', species: ['antelope', 'zebra', 'giraffe'], gate: 'tall', world: 'savanna', ground: ['sgrass0', 'sgrass1', 'sgrass2'], seed: { tx: 45, ty: 2 }, quota: { antelope: [5, 8], zebra: [5, 8], giraffe: [3, 5] }, upgrade: 'Mehr Steppe mit Heu-Unterstand', basic: [[37, 4, ':'], [38, 3, '<'], [39, 2, ']'], [39, 3, ']'], [39, 4, ']'], [39, 5, ']']] },
      { id: 'deerpark', name: 'Hirschgehege', species: ['deer', 'stag'], world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 9, ty: 37 }, slots: [6, 9], upgrade: 'Mehr Wald mit Futterkrippe', basic: [[19, 41, ':'], [17, 41, '<'], [16, 37, '|'], [16, 38, '|'], [16, 39, '|'], [16, 40, '|'], [16, 41, '|'], [16, 42, '|'], [16, 43, '|'], [16, 44, '|']] },
      { id: 'foxden', name: 'Fuchsbau', species: ['fox'], world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 5, ty: 48 }, slots: [3, 5], upgrade: 'Fuchshöhle', basic: [[5, 50, ':']] },
      { id: 'forestpond', name: 'Teich', species: ['frog', 'fish'], gate: 'chain', signKey: 'pond', world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 14, ty: 48 }, quota: { frog: [4, 6], fish: [4, 6] }, upgrade: 'Größerer Teich mit Schilf, Pilzen und Farn', basic: [[14, 48, ':'], [17, 53, '<'], [18, 50, '.'], [13, 52, '.'], [14, 52, '.'], [15, 49, '.'], [16, 49, '.']] },
      { id: 'forestaviary', name: 'Voliere', species: ['squirrel', 'heron'], netRoof: true, gate: 'net', world: 'forest', ground: ['fgrass0', 'fgrass1', 'fgrass2'], seed: { tx: 14, ty: 25 }, quota: { squirrel: [4, 6], heron: [3, 5] }, upgrade: 'Zweiter Flügel mit Nistkasten', basic: [[14, 32, ':'], [16, 33, '<'], [14, 30, '^'], [15, 30, '^'], [16, 30, '^'], [17, 30, '^']] },
      { id: 'pond', name: 'Teich', species: ['frog', 'fish'], gate: 'chain', world: 'meadow', seed: { tx: 41, ty: 25 }, quota: { frog: [4, 6], fish: [4, 6] }, upgrade: 'Größerer Teich mit Schilf', basic: [[41, 25, ':'], [43, 29, '<'], [42, 28, '.'], [43, 28, '.']] },
      { id: 'cats', name: 'Katzenhaus', species: ['cat'], gate: 'glass', world: 'meadow', seed: { tx: 50, ty: 26 }, slots: [4, 6], upgrade: 'Zweiter Kratzbaum', basic: [[52, 26, ':']] },
      { id: 'pasture', name: 'Weide', species: ['sheep', 'mole'], world: 'meadow', seed: { tx: 40, ty: 34 }, quota: { sheep: [10, 14], mole: [3, 5] }, upgrade: 'Mehr Weide mit Heu-Unterstand', basic: [[42, 38, ':'], [41, 39, '<'], [49, 34, '|'], [49, 35, '|'], [49, 36, '|'], [49, 37, '|'], [49, 38, '|'], [49, 39, '|'], [49, 40, '|'], [49, 41, '|'], [49, 42, '|'], [49, 43, '|'], [49, 44, '|']] },
      { id: 'aviary', name: 'Voliere', species: ['heron'], netRoof: true, gate: 'net', world: 'meadow', seed: { tx: 47, ty: 55 }, slots: [4, 6], upgrade: 'Zweiter Flügel mit Nistkasten und Wasserstelle', basic: [[47, 50, ':'], [47, 51, '<'], [46, 53, '^'], [47, 53, '^'], [48, 53, '^']] },
      { id: 'flamingos', name: 'Flamingos', species: ['flamingo'], netRoof: true, gate: 'net', world: 'park', unlock: 'flamingo', seed: { tx: 27, ty: 50 }, slots: [6, 9], upgrade: 'Großer See mit Springbrunnen', basic: [[30, 52, 'w'], [28, 51, ':'], [28, 52, '<'], [28, 53, '.'], [32, 51, '.'], [32, 52, '.'], [32, 53, '.'], [29, 50, '.'], [29, 54, '.'], [30, 50, '.'], [30, 54, '.'], [31, 50, '.'], [31, 54, '.'], [27, 49, '.'], [33, 49, '.'], [27, 55, '.'], [33, 55, '.']] },
      // Pfauen haben kein Gehege: sie laufen frei im Tierpark herum (höchstens 8, kein Ausbau)
      { id: 'peacocks', name: 'Pfauen', species: ['peacock'], world: 'asia', free: true, slots: [8, 8] },
      { id: 'orangutans', name: 'Orang-Utan-Gehege', species: ['orangutan'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 20, ty: 77 }, slots: [3, 5], upgrade: 'Hängematte mit Schlafnest', basic: [[19, 77, ':']] },
      { id: 'tigers', name: 'Tigergehege', species: ['tiger'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 49, ty: 78 }, slots: [3, 5], upgrade: 'Badebecken mit Spielball', basic: [[47, 77, ':'], [48, 77, '<'], [47, 78, '.'], [48, 78, '.'], [46, 77, '.'], [48, 76, '.'], [49, 77, '.']] },
      { id: 'pandas', name: 'Pandagehege', species: ['panda'], gate: 'tall', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 48, ty: 66 }, slots: [2, 4], upgrade: 'Reifenschaukel und Spielball', basic: [[49, 66, ':'], [46, 65, '<']] },
      { id: 'macaques', name: 'Affenquelle', species: ['macaque'], netRoof: true, gate: 'net', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], seed: { tx: 19, ty: 64 }, slots: [4, 6], upgrade: 'Großer Badesee', basic: [[20, 65, ':'], [20, 66, '<'], [17, 65, '.'], [19, 67, '.']] },
      { id: 'koipond', name: 'Koi-Teich', seed: { tx: 30, ty: 69 }, species: ['koi'], pond: true, signAt: { tx: 33, ty: 75 }, signKey: 'koi', world: 'asia', ground: ['agrass0', 'agrass1', 'agrass2'], water: ['asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water1', 'asia_water2'], slots: [6, 9], upgrade: 'Steinlaternen und Kirschbäume', basic: [[29, 68, ':'], [40, 71, '<'], [36, 74, '.'], [32, 65, '.']] },
    ],
    // Randstreifen: Boden der Welt, deren Gehege dort stehen (Zäune, Füller und Zwischenräume)
    grounds: [
      { area: { tx0: 12, tx1: 55, ty0: 0, ty1: 22 }, ground: ['sgrass0', 'sgrass1', 'sgrass2'] },
      { area: { tx0: 0, tx1: 22, ty0: 23, ty1: 59 }, ground: ['fgrass0', 'fgrass1', 'fgrass2'] },
      { area: { tx0: 12, tx1: 55, ty0: 60, ty1: 82 }, ground: ['agrass0', 'agrass1', 'agrass2'] }, // Asien-Bereich
    ],
    // Katzenhaus mit Glaswänden (begehbar, Dach wird beim Betreten durchsichtig) und das Haupthaus in der Mitte
    buildings: [{ tx0: 47, ty0: 24, tx1: 53, ty1: 28, style: 'cathouse' }, { tx0: 25, ty0: 31, tx1: 33, ty1: 38, style: 'office' }],
    // freischaltbar: das Flamingo-Gehege entsteht, sobald man den ersten Flamingo fängt (Event „Flamingo-Flug“)
    unlocks: [
      { id: 'flamingo', tx: 24, ty: 43, rows: ['#....##..###', '.....##..###', '.....##..###', '.....##.....', 'b^^^^GG^^^^^', '.;.........;', '.;.f.....g.;', '.;...www...;', '.;..wwwww..;', '.;..wwwww..;', '.;..wwwww..;', '.;...www...;', '.;.g.....f.;', '.;.........;', 'b^^^^^^^^^^^', '............'] },
    ],
    iceStand: { tx: 25, ty: 40 }, // Eisstand-Event: der Eiswagen steht mitten im Park vor dem Haupthaus, links am Vorplatz
    computers: [{ tx: 29, ty: 34 }], // Hauptrechner im Haupthaus (Events)
    feeders: [{ tx: 39, ty: 32, world: 'meadow' }, { tx: 37, ty: 14, world: 'savanna' }, { tx: 22, ty: 45, world: 'forest' }],
    toolSpots: [],
    ambient: 'ambient_meadow',
    background: '#4f8a2f',
    // Themenbereiche: am großen Wegweiser in der Mitte zeigen die Bretter dorthin
    signScale: 1.25,
    sections: [
      { label: 'Savanne', tx: 38, ty: 18 },
      { label: 'Wald', tx: 12, ty: 46 },
      { label: 'Wiese', tx: 46, ty: 41 },
      { label: 'Asien', tx: 38, ty: 61 },
    ],
    exits: [
      { tx: 34, ty: 0, to: 'savanna', arrive: { tx: 20, ty: 1 }, label: 'Savanne' },
      { tx: 1, ty: 46, to: 'forest', arrive: { tx: 22, ty: 1 }, label: 'Wald' },
      { tx: 55, ty: 40, to: 'meadow', arrive: { tx: 20, ty: 1 }, label: 'Wiese' },
      { tx: 35, ty: 82, to: 'asia', arrive: { tx: 20, ty: 1 }, label: 'Asien' },
    ],
    spawn: { population: 0, weights: {} },
  },
};
