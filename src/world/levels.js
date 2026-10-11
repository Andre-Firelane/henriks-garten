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

export const LEVELS = {
  meadow: {
    name: 'Wiese',
    rows: [
      'TTbbTTTTbbTTTTTTbTTTTTTTTbTTTTTbTTTTTbTT',
      'T.--------._______....{{{{{{{{^^^^^^^^^T',
      'b.|......|.!,,,,,!....}......};.......;T',
      'b.|.f....|.!C,,,C!....}.oooo.};...www.;T',
      'b.|....g.|.!,,,,,!....}.oooo.};...www.;T',
      'T.|......|.!,,,,,!....}......};.......;T',
      'T.--GGG---.__GGG__....{{GGG{{{^^GGGGG^^T',
      'b.#####################################T',
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
      'TTbbTTTTTTbTTTTTbTTTTTbbbTTTTTbTTTbbbTTT',
    ],
    grass: ['grass0', 'grass1', 'grass2'],
    path: 'path',
    start: { tx: 20, ty: 20 },
    // Gehege: jedes nimmt nur bestimmte Tierarten auf (area = Innenfläche); am Tor hängt ein Schild mit ihren Fußspuren.
    // gate: Art des Tors (wood = Holztor, glass = Glastür, chain = Maschendraht, net = Netz)
    enclosures: [
      { id: 'pasture', name: 'Weide', area: { tx0: 3, tx1: 8, ty0: 2, ty1: 5 }, species: ['sheep', 'mole'] },
      { id: 'cats', name: 'Katzenhaus', area: { tx0: 12, tx1: 16, ty0: 2, ty1: 5 }, species: ['cat'], gate: 'glass' },
      { id: 'pond', name: 'Teich', area: { tx0: 23, tx1: 28, ty0: 2, ty1: 5 }, species: ['frog', 'fish'], gate: 'chain' },
      { id: 'aviary', name: 'Voliere', area: { tx0: 31, tx1: 37, ty0: 2, ty1: 5 }, species: ['heron'], netRoof: true, gate: 'net' },
    ],
    shed: { tx: 16, ty: 21 }, // obere Kachel der 2x2-Hütte; die offene Seite zeigt nach vorne rechts
    shedTexture: 'shed',
    ambient: 'ambient_meadow', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    // jedes Werkzeug hat einen festen Platz; hierhin kommt es auch zurück
    toolSpots: [
      { tool: 'net', tx: 18, ty: 21 },
      { tool: 'lasso', tx: 18, ty: 22 },
      { tool: 'empty', tx: 18, ty: 23 }, // "Hände frei": hier legt man das getragene Werkzeug ab
    ],
    // Übergänge: wer auf die Kachel tritt, kommt im Ziel-Level an der Kachel "arrive" heraus
    exits: [
      { tx: 0, ty: 19, to: 'forest', arrive: { tx: 37, ty: 18 }, label: 'Wald' },
      { tx: 39, ty: 19, to: 'savanna', arrive: { tx: 1, ty: 19 }, label: 'Savanne' },
    ],
    // Beschriftung der drei Bretter am Wegweiser (oben, Mitte, unten)
    signLabels: ['Gehege', 'Wald', 'Savanne'],
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
      'PkPPPPPDkPDP..DDkPPPPPPDkkkDDkPPDDDDkPkP',
      'Pk.......D.....k.D....knm..-------D...kP',
      'PP....P........P.D....Pmn..|.....|..k.kP',
      'P...P.......D....D......n..|.....|.n..kP',
      'Pk...............nnnn.#.n..|.n...-----kP',
      'P...................D.#.n..|.....|...|kP',
      'PD..P....~~~~~...D....#D...|.....|...|kP',
      'PP......~~~~~~~.n.PPPP#P...|...m.|.U.|DP',
      'P.......~~~~~~~...PPP.#....|.....|...|.P',
      'Pk...P..~~~~~~~..PPPP.#....|.....|...|kP',
      'Pkkk....~~~~~~~.nL....#.P..---GGG--G--PP',
      'PP..n....~~~~~.########LD...nHH#......PP',
      'Pk.......n.....L.Dk...#.P....HH#......PP',
      'PD..P...k..n...P.Pk...#........#......PP',
      'PP.....kk.PD..PPDP...n#..n.Dn..#..P...kP',
      'PP......k......P.P..D.#.D......#.......P',
      'PPPPD.Dnkmn...D.......#........#......DP',
      'PD......###############################X',
      'Pkn.......DnnnnD.#......#....{{{GGG{{{.P',
      'PD..P....PkD.....#m..P..#.D..}.......}.P',
      'PP..D.....Pm.....#......#....}..ooo..}kP',
      'PDn............D.#......#..P.}..ooo..}.P',
      'PD.....D.......D.#.P..D.#.k..}.......}.P',
      'PD.............D.#......#....{{{{{{{{{.P',
      'PD...D....~....D.#P.....############...P',
      'PPnnnnn..~~~~~..m#n...~~~.n.^^^GGGGG^^DP',
      'PP..n...~~~~~~~###...~~~~...;........;.P',
      'PDPPPPP..~~~~~..D....~~~~..P;........;.P',
      'P........~~~~~.......~~~~...;.P......;.P',
      'P........~~~~~.......~~~~...;...www..;kP',
      'PPkkkkkn..~......D...~~~~.D.;...www..;.P',
      'Pkkk....D.....n.......~~~...;......P.;.P',
      'PD..P........Pn.............;........;.P',
      'PD............n.P..P.......k^^^^^^^^^^PP',
      'PD............n..............D..n...k..P',
      'PD....Pn......n...m......n..LLP.PPPPDkDP',
      'PD..D...PDn....L.....PD.PD.n.P..PkkkkkDP',
      'PPkkkkkDPDDkkkkDkDDDDDkPPD.PkDPDDDDDkkPP',
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP',
    ],
    grass: ['fgrass0', 'fgrass1', 'fgrass2'],
    path: 'forest_path',
    start: { tx: 37, ty: 18 },
    // Gehege des Waldes; signKey: welches Torschild (sonst esign_<id>)
    enclosures: [
      { id: 'deerpark', name: 'Hirschgehege', area: { tx0: 28, tx1: 32, ty0: 3, ty1: 10 }, species: ['deer', 'stag'], signSide: 'right' }, // links vom Tor steht die Hütte
      { id: 'foxden', name: 'Fuchsbau', area: { tx0: 34, tx1: 36, ty0: 6, ty1: 10 }, species: ['fox'] },
      { id: 'forestpond', name: 'Teich', area: { tx0: 30, tx1: 36, ty0: 20, ty1: 23 }, species: ['frog', 'fish'], gate: 'chain', signKey: 'pond' },
      { id: 'forestaviary', name: 'Voliere', area: { tx0: 29, tx1: 36, ty0: 27, ty1: 33 }, species: ['squirrel', 'heron'], netRoof: true, gate: 'net' },
    ],
    shed: { tx: 29, ty: 12 },
    shedTexture: 'shed_log', // rustikale Blockhütte
    hero: 'hero_forest', // Kleidung der Spielfigur in diesem Gebiet (Pfadfinder)
    ambient: 'ambient_forest', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [
      // vor der Hütte, neben dem Weg zum Gehege
      { tool: 'empty', tx: 28, ty: 14 }, // "Hände frei": hier legt man das getragene Werkzeug ab
      { tool: 'net', tx: 29, ty: 14 },
      { tool: 'lasso', tx: 30, ty: 14 },
      // die beiden Fallen eine Reihe tiefer, damit man zwischen ihnen und Kescher/Lasso durchlaufen kann
      { tool: 'trap', tx: 29, ty: 16 },
      { tool: 'trap', tx: 30, ty: 16 },
    ],
    exits: [{ tx: 39, ty: 18, to: 'meadow', arrive: { tx: 1, ty: 19 }, label: 'Wiese' }],
    spawn: { population: 12, weights: { deer: 4, squirrel: 2.5, fish: 2.5, frog: 1.6, fox: 1, stag: 0.4 } },
    herons: { every: [50, 110], landChance: 0.5 },
  },

  savanna: {
    name: 'Savanne',
    rows: [
      'AvvvvvvRvAvvvvvvRvAvvvvvvRvAvvvvvvRvAvvv',
      'R......................................v',
      'v.y.....v..y.....y.....[[[[[[[[[[[[[[[.v',
      'v.....v.......y.------.].............].v',
      'v.........y..v..|....|.].........A...]yv',
      'v...............|.u..|.]..A..........].v',
      'v.v..........v..|....|y]......A...y..].A',
      'v.....~~.~~.....|....|.].............].R',
      'v....~~~~~~....y---GG-.].y...........].v',
      'A.....~~~~~~y.......#..]...A.......A.].v',
      'R..v.~~~~~~..y......#y.].......y.....].v',
      'v.......~~......Ry.y#..].............].v',
      'v......y.....vy...y.#..[[[[[GGGGG[[[[[.v',
      'v....y.....y........#.........#......y.v',
      'v.v.......v.........#.........#........v',
      'v................R..#.........#....y...A',
      'v.................y.#.y.......#....A...R',
      'v.yv....A..R........#...A.....#........v',
      'A...................#.........#........v',
      'X##############################...R....v',
      'v...............HH..#..................v',
      'v...............HH..#.y.....y.R........v',
      'v...y.y.............#............y.....v',
      'v...R........A......#...............R..v',
      'v.......v...........#..........y.......A',
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
    start: { tx: 2, ty: 19 },
    // ein großes Gehege für Antilopen, Zebras und Giraffen: hoher Wildzaun, großes Tor, ein paar Akazien
    enclosures: [
      { id: 'meerkat', name: 'Erdmännchenbau', area: { tx0: 17, tx1: 20, ty0: 4, ty1: 7 }, species: ['meerkat'] },
      { id: 'savanna', name: 'Savannengehege', area: { tx0: 24, tx1: 36, ty0: 3, ty1: 11 }, species: ['antelope', 'zebra', 'giraffe'], gate: 'tall' },
    ],
    shed: { tx: 16, ty: 20 },
    shedTexture: 'shed_tent', // Ranger-Zelt
    hero: 'hero_savanna', // Kleidung der Spielfigur in diesem Gebiet (Safari)
    background: '#b89a52', // Farbe außerhalb der Karte (trockenes Gras)
    ambient: 'ambient_savanna', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [
      { tool: 'net', tx: 18, ty: 20 },
      { tool: 'lasso', tx: 18, ty: 21 },
      { tool: 'empty', tx: 18, ty: 22 }, // "Hände frei": hier legt man das getragene Werkzeug ab
      { tool: 'food', tx: 19, ty: 20 }, // Grünfutter für die Giraffen
    ],
    exits: [{ tx: 0, ty: 19, to: 'meadow', arrive: { tx: 38, ty: 19 }, label: 'Wiese' }],
    // Hier leben Antilopen (Gazellen) und Zebras in Gruppen zu 2 bis 4, etwa gleich häufig, und Giraffen;
    // keine Fischreiher. Giraffen sind viel seltener und erscheinen meist an Bäumen
    // Erdmännchen kommen als Kolonie (3 bis 5), seltener als Antilopen und Zebras
    spawn: { population: 13, weights: { antelope: 0.6, zebra: 0.6, giraffe: 0.4, meerkat: 0.3 } },
  },
};
