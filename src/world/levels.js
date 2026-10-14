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
//          H  Werkzeughütte (2x2 Kacheln, siehe shed)
//          o  Fischteich (hierhin bringt man gefangene Fische)   S  Schild am Fischteich
//          W  Wegweiser
//          1  Laubbaum   2  Tanne   3  trockener Strauch   (dichte Füller im Gehege-Streifen hinter dem oberen Kartenrand)
//          Q  Bambus     q  hohes Gras (Versteck)   J  Dschungelbaum   K  Kirschbaum   O  Sonnenfelsen
//          l  Steinlaterne   I  rotes Tor (Torii) über dem Weg   h  heiße Quelle   B  Brücke über den Teich
//          4  Busch      5  dichter Busch   6  Bambus (Füller)   (niedrige Füller rechts neben den Gehegen, damit sie die Tiere nicht verdecken)

export const LEVELS = {
  meadow: {
    name: 'Wiese',
    rows: [
      'TTbbTTTTbbTTTTTTbTTTTTTTTbTTTTTbTTTTTbTT',
      '11--------4_______4{{{{{{{{4^^^^^^^^^441',
      '11|......|4!,,,,,!4}......}4;.......;441',
      '11|.f....|4!C,,,C!4}.oooo.}4;...www.;441',
      '11|....g.|4!,,,,,!4}.oooo.}4;...www.;441',
      '11|......|4!,,,,,!4}......}4;.......;441',
      '11--GGG---4__GGG__4{{GGG{{{4^^GGGGG^^441',
      'T######################################T',
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
      'T...fffgfff.....HH###..................T',
      'b...fggfggf....bHH###......g......~~~..T',
      'T...fffgfff.........#............~~~~~.T',
      'T..........r........#...T........~~~~~.T',
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
    start: { tx: 20, ty: 27 },
    // Gehege: jedes nimmt nur bestimmte Tierarten auf (area = Innenfläche); am Tor hängt ein Schild mit ihren Fußspuren.
    // gate: Art des Tors (wood = Holztor, glass = Glastür, chain = Maschendraht, net = Netz)
    enclosures: [
      { id: 'pasture', name: 'Weide', area: { tx0: 3, tx1: 8, ty0: 2, ty1: 5 }, species: ['sheep', 'mole'] },
      { id: 'cats', name: 'Katzenhaus', area: { tx0: 12, tx1: 16, ty0: 2, ty1: 5 }, species: ['cat'], gate: 'glass' },
      { id: 'pond', name: 'Teich', area: { tx0: 20, tx1: 25, ty0: 2, ty1: 5 }, species: ['frog', 'fish'], gate: 'chain' },
      { id: 'aviary', name: 'Voliere', area: { tx0: 29, tx1: 35, ty0: 2, ty1: 5 }, species: ['heron'], netRoof: true, gate: 'net' },
    ],
    shed: { tx: 16, ty: 28 }, // obere Kachel der 2x2-Hütte; die offene Seite zeigt nach vorne rechts
    shedTexture: 'shed',
    ambient: 'ambient_meadow', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    // jedes Werkzeug hat einen festen Platz; hierhin kommt es auch zurück
    toolSpots: [
      { tool: 'net', tx: 18, ty: 28 },
      { tool: 'lasso', tx: 18, ty: 29 },
      { tool: 'empty', tx: 18, ty: 30 }, // "Hände frei": hier legt man das getragene Werkzeug ab
    ],
    // Übergänge: wer auf die Kachel tritt, kommt im Ziel-Level an der Kachel "arrive" heraus
    exits: [
      { tx: 0, ty: 26, to: 'forest', arrive: { tx: 37, ty: 29 }, label: 'Wald' },
      { tx: 39, ty: 26, to: 'savanna', arrive: { tx: 1, ty: 31 }, label: 'Savanne' },
      { tx: 20, ty: 46, to: 'asia', arrive: { tx: 20, ty: 53 }, label: 'Asien' },
    ],
    // Beschriftung der drei Bretter am Wegweiser (oben, Mitte, unten)
    signLabels: ['Gehege', 'Wald', 'Savanne', 'Asien'],
    // Spawner: so viele wilde Tiere sind ungefähr gleichzeitig unterwegs; die Zahlen dahinter sind die
    // Wahrscheinlichkeiten (je größer, desto häufiger). Tiere verschwinden nach einer Weile und neue kommen.
    spawn: { population: 14, weights: { sheep: 6, cat: 2, fish: 2, frog: 1.6, mole: 0.6 } },
    // Fischreiher fliegen unabhängig vom Spawner über die Karte: alle every Sekunden einer, landChance landet
    herons: { every: [50, 110], landChance: 0.5 },
  },

  forest: {
    name: 'Wald',
    rows: [
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP',
      '222-------552222222222222222222222222222',
      '222|.....|55222222222222222^^^^^^^^^^552',
      '222|.....|55222222222222222;........;552',
      '222|.n...|5-----55222222222;........;552',
      '222|.....|5|...|5{{{{{{{{{5;.P......;552',
      '222|.....|5|...|5}.......}5;...www..;552',
      '222|...m.|5|.U.|5}..ooo..}5;...www..;552',
      '222|.....|5|...|5}..ooo..}5;......P.;552',
      '222|.....|5|...|5}.......}5;........;552',
      '222--GGG--5--G--5{{{GGG{{{5^^GGGGG^^^552',
      'P######################################P',
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
      'Pkkk....~~~~~~~.nL....#.P.............PP',
      'PP..n....~~~~~.########LD...nHH#......PP',
      'Pk.......n.....L.Dk...#.P....HH#......PP',
      'PD..P...k..n...P.Pk...#........#......PP',
      'PP.....kk.PD..PPDP...n#..n.Dn..#..P...kP',
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
    start: { tx: 37, ty: 29 },
    // Gehege des Waldes; signKey: welches Torschild (sonst esign_<id>)
    enclosures: [
      { id: 'deerpark', name: 'Hirschgehege', area: { tx0: 4, tx1: 8, ty0: 2, ty1: 9 }, species: ['deer', 'stag'] },
      { id: 'foxden', name: 'Fuchsbau', area: { tx0: 12, tx1: 14, ty0: 5, ty1: 9 }, species: ['fox'] },
      { id: 'forestpond', name: 'Teich', area: { tx0: 18, tx1: 24, ty0: 6, ty1: 9 }, species: ['frog', 'fish'], gate: 'chain', signKey: 'pond' },
      { id: 'forestaviary', name: 'Voliere', area: { tx0: 28, tx1: 35, ty0: 3, ty1: 9 }, species: ['squirrel', 'heron'], netRoof: true, gate: 'net' },
    ],
    shed: { tx: 29, ty: 23 },
    shedTexture: 'shed_log', // rustikale Blockhütte
    hero: 'hero_forest', // Kleidung der Spielfigur in diesem Gebiet (Pfadfinder)
    ambient: 'ambient_forest', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [
      // vor der Hütte, neben dem Weg zum Gehege
      { tool: 'empty', tx: 28, ty: 25 }, // "Hände frei": hier legt man das getragene Werkzeug ab
      { tool: 'net', tx: 29, ty: 25 },
      { tool: 'lasso', tx: 30, ty: 25 },
      // die beiden Fallen eine Reihe tiefer, damit man zwischen ihnen und Kescher/Lasso durchlaufen kann
      { tool: 'trap', tx: 29, ty: 27 },
      { tool: 'trap', tx: 30, ty: 27 },
    ],
    exits: [{ tx: 39, ty: 29, to: 'meadow', arrive: { tx: 1, ty: 26 }, label: 'Wiese' }],
    spawn: { population: 12, weights: { deer: 4, squirrel: 2.5, fish: 2.5, frog: 1.6, fox: 1, stag: 0.4 } },
    herons: { every: [50, 110], landChance: 0.5 },
  },

  savanna: {
    name: 'Savanne',
    rows: [
      'AvvvvvvRvAvvvvvvRvAvvvvvvRvAvvvvvvRvAvvv',
      '3333333333333333333333333[[[[[[[[[[[[[[3',
      '3333333333333333333333333]............]3',
      '3333333333333333333333333].........A..]3',
      '3333333333333333333333333]..A.........]3',
      '3333333333333333333333333]......A...y.]3',
      '3{{{{{{{{3[[[[[[[3------3].....wwww...]3',
      '3}......}3].....]3|....|3].y..wwwww...]3',
      '3}.oooo.}3].A...]3|.u..|3]...A.www...A]3',
      '3}.oooo.}3]...R.]3|....|3].......y....]3',
      '3}......}3].....]3|....|3]............]3',
      '3{{GGG{{{3[[GGG[[3--GG--3[[[[GGGGG[[[[[3',
      'R######################################v',
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
      'v...............HH..#..................v',
      'v...............HH..#...v.....R........v',
      'v...y.y.............#.....A......y.....v',
      'v...R........A......#...............R..v',
      'v.......v...........#...v..A...y.......A',
      'v................yy.#..................R',
      'v..y...........R....#..................v',
      'A....A..~~...y...v..#..R...........y...v',
      'R......~~~~~..y.....#........~~~~~.A...v',
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
    start: { tx: 2, ty: 31 },
    // ein großes Gehege für Antilopen, Zebras und Giraffen: hoher Wildzaun, großes Tor, ein paar Akazien
    enclosures: [
      { id: 'crocodile', name: 'Krokodilteich', area: { tx0: 2, tx1: 7, ty0: 7, ty1: 10 }, species: ['crocodile'], gate: 'chain' },
      { id: 'lion', name: 'Löwengehege', area: { tx0: 11, tx1: 15, ty0: 7, ty1: 10 }, species: ['lion'], gate: 'tall' },
      { id: 'meerkat', name: 'Erdmännchenbau', area: { tx0: 19, tx1: 22, ty0: 7, ty1: 10 }, species: ['meerkat'] },
      { id: 'savanna', name: 'Savannengehege', area: { tx0: 26, tx1: 37, ty0: 2, ty1: 10 }, species: ['antelope', 'zebra', 'giraffe'], gate: 'tall' },
    ],
    shed: { tx: 16, ty: 32 },
    shedTexture: 'shed_tent', // Ranger-Zelt
    hero: 'hero_savanna', // Kleidung der Spielfigur in diesem Gebiet (Safari)
    background: '#b89a52', // Farbe außerhalb der Karte (trockenes Gras)
    ambient: 'ambient_savanna', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    ambientVolume: 0.35, // etwas leiser als in den anderen Gebieten (0.55)
    toolSpots: [
      // alle nebeneinander an der offenen Zeltseite, davor eine freie Spur zum Weg
      { tool: 'net', tx: 18, ty: 32 },
      { tool: 'lasso', tx: 18, ty: 33 },
      { tool: 'food', tx: 18, ty: 34 }, // Grünfutter für die Giraffen
      { tool: 'empty', tx: 18, ty: 35 }, // "Hände frei": hier legt man das getragene Werkzeug ab
    ],
    exits: [{ tx: 0, ty: 31, to: 'meadow', arrive: { tx: 38, ty: 26 }, label: 'Wiese' }],
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
    rows: [
      'JQQJQQJQQJQQJQQJQQJQQJQQJQQJQQJQQJQQJQQk',
      '666666666666666-----------55666666666666',
      '666666666666666|K.ooooo.l|55666666666666',
      '666666666666666|.ooooooo.|55666666666666',
      '666666666666666|..ooooo..|55666666666666',
      '666666666666666|l.......K|55666666666666',
      '666666666666666----GGG----55666666666666',
      'Q.............#############............k',
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
      'Q........~~~~~~~~~..#..~~~..~~~........k',
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
      'J.....hhhhhhhr......#l..........q.O....k',
      'Q......hhhhh.r..HH###...q..............k',
      'Q.......hhh.r...HH###........O.n.......k',
      'J...................#............O.....k',
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
    start: { tx: 20, ty: 52 },
    // Koi-Teich: Holzzaun, Teich mit Kirschbaum und Laterne; hier tauchen die Koi von selbst regelmäßig auf
    enclosures: [{ id: 'koipond', name: 'Koi-Teich', area: { tx0: 16, tx1: 24, ty0: 2, ty1: 5 }, species: ['koi'], signKey: 'koi' }],
    shed: { tx: 16, ty: 44 },
    shedTexture: 'shed_pagoda', // Pagode
    hero: 'hero_asia', // Kleidung der Spielfigur in diesem Gebiet (Strohhut)
    ambient: 'ambient_asia', // Asien-Geräusche, leise über die Wiesengeräusche gelegt (siehe tools/prepare-sounds.js)
    background: '#3f7a35',
    toolSpots: [
      { tool: 'net', tx: 18, ty: 44 },
      { tool: 'lasso', tx: 18, ty: 45 },
      { tool: 'koifood', tx: 18, ty: 46 }, // Fischfutter für die Koi
      { tool: 'empty', tx: 18, ty: 47 }, // "Hände frei": hier legt man das getragene Werkzeug ab
      // auf der Insel mitten im Koi-Teich: Kescher und Fischfutter nebeneinander, damit man nach dem Füttern
      // gleich zum Kescher greifen kann (man trägt ja immer nur eins)
      { tool: 'net', tx: 21, ty: 30 },
      { tool: 'koifood', tx: 22, ty: 30 },
    ],
    // Eingang im Süden: unten am Hauptweg, unter dem roten Tor hindurch
    exits: [{ tx: 20, ty: 54, to: 'meadow', arrive: { tx: 20, ty: 45 }, label: 'Wiese' }],
    // Koi leben im Koi-Teich (nur als Schatten zu sehen, bis man sie mit Fischfutter anlockt)
    spawn: { population: 5, weights: { koi: 1 } },
  },
};
