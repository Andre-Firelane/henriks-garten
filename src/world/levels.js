// Die Level (Biome). Jede Zeile ist eine Reihe Kacheln (ty), jedes Zeichen eine Kachel (tx).
//
// Boden:   .  Gras     #  Weg     =  Acker     ~  Wasser
//          X  Übergang in ein anderes Level (siehe exits)
// Objekte:
//          T  Apfelbaum   b  Busch        r  Stein
//          f  rote Blumen g  gelbe Blumen
//          P  Tanne       D  dunkler Laubbaum   k  dichter Busch   L  umgestürzter Stamm
//          n  Farn        m  Pilze
//          -  Zaun (entlang tx)   |  Zaun (entlang ty)
//          G  Tor zum Gehege (auf Weg, öffnet sich beim Durchgehen)
//          H  Werkzeughütte (2x2 Kacheln, siehe shed)
//          o  Fischteich (hierhin bringt man gefangene Fische)   S  Schild am Fischteich
//          W  Wegweiser

export const LEVELS = {
  meadow: {
    name: 'Wiese',
    rows: [
      'TTbbTTTTbbTTTTTTbTTTTTTTTbTTTTTbTTTTTbTT',
      'T...f.......g.......#..........f......bT',
      'b.......r...........#..................T',
      'b...................#..................T',
      'b...................#..................T',
      'T...................#....--------------T',
      'T....~~~~~~~........#....|............|T',
      'b...~~~~~~~~~~~.....#....|............|T',
      'T...~~~~~~~~~~~.....#....|............|b',
      'T...~~~~~~~~~~~.....#....|............|b',
      'T...~~~~~~~~~~~.....#....|............|b',
      'T....~~~~~~~.....f..#....|............|T',
      'T...............g...#....|............|T',
      'T...................#....|............|T',
      'T..............b....#....|............|T',
      'T...g...~~~~~~~.....#....-----GGG------T',
      'b......~~~~~~~~~....#..........#.......T',
      'T......f~~~~~~~~T...#..........#..T....T',
      'T..................W#..........#.......b',
      'X######################################T',
      'T.......g...........#..........f.......T',
      'T...fffgfff.....HH###....Soooo.........T',
      'b...fggfggf....bHH###....oooooo..b.....T',
      'T...fffgfff.........#.....oooo.........T',
      'T..........r........#...........~~.....T',
      'T...b...............#.........~~~~~~~..T',
      'T...................#.........~~~~~~~..T',
      'T...................#.........~~~~~~~..T',
      'T...................#.........~~~~~~~..b',
      'b....======.....T...#...........~~.....T',
      'T....======.........#..................T',
      'T....======....g....#........f.........T',
      'T....======.........#..................T',
      'T...............f...#.............b....T',
      'T...................#..................T',
      'b.......T...........#........T.........T',
      'b...................#..................T',
      'T...g...............#............g.....T',
      'T..........f........#..................b',
      'TTbbTTTTTTbTTTTTbTTTTTbbbTTTTTbTTTbbbTTT',
    ],
    grass: ['grass0', 'grass1', 'grass2'],
    path: 'path',
    start: { tx: 20, ty: 20 },
    pen: { tx0: 26, tx1: 37, ty0: 6, ty1: 14 }, // Innenfläche des Geheges
    shed: { tx: 16, ty: 21 }, // obere Kachel der 2x2-Hütte; die offene Seite zeigt nach vorne rechts
    shedTexture: 'shed',
    ambient: 'ambient_meadow', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    // jedes Werkzeug hat einen festen Platz; hierhin kommt es auch zurück
    toolSpots: [
      { tool: 'net', tx: 18, ty: 21 },
      { tool: 'lasso', tx: 18, ty: 22 },
    ],
    // Übergänge: wer auf die Kachel tritt, kommt im Ziel-Level an der Kachel "arrive" heraus
    exits: [{ tx: 0, ty: 19, to: 'forest', arrive: { tx: 37, ty: 18 }, label: 'Wald' }],
    // Beschriftung der drei Bretter am Wegweiser (oben, Mitte, unten)
    signLabels: ['Gehege', 'Wald', 'Teich'],
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
      'Pk.......D.....k.D....knm..-----------kP',
      'PP....P........P.D....Pmn..|.........|kP',
      'P...P.......D....D......n..|.........|kP',
      'Pk...............nnnn.#.n..|.........|kP',
      'P...................D.#.n..|.........|kP',
      'PD..P....~~~~~...D....#D...|.nn.....m|kP',
      'PP......~~~~~~~.n.PPPP#P...|.........|DP',
      'P.......~~~~~~~...PPP.#....|.........|.P',
      'Pk...P..~~~~~~~..PPPP.#....|...n.....|kP',
      'Pkkk....~~~~~~~.nL....#.P..---GGG-----PP',
      'PP..n....~~~~~.########LD...nHH#......PP',
      'Pk.......n.....L.Dk...#.P....HH#......PP',
      'PD..P...k..n...P.Pk...#........#......PP',
      'PP.....kk.PD..PPDP...n#..n.Dn..#..P...kP',
      'PP......k......P.P..D.#.D......#.......P',
      'PPPPD.Dnkmn...D.......#........#......DP',
      'PD......###############################X',
      'Pkn.......DnnnnD.#......#....m........kP',
      'PD..P....PkD.....#m..P..#......Soooo..PP',
      'PP..D.....Pm.....#......#n.k...oooooo.PP',
      'PDn............D.#......#n.m....oooo..PP',
      'PD.....D.......D.#.P..D.#n......oooo..PP',
      'PD.............D.#......#n.P....oooo..PP',
      'PD...D....~....D.#P.....#.............DP',
      'PPnnnnn..~~~~~..m#n...~~~...D.kL....nDDP',
      'PP..n...~~~~~~~###...~~~~~~.DD.PDm..n.DP',
      'PDPPPPP..~~~~~..D....~~~~~~....PP.....PP',
      'P........~~~~~.......~~~~~~....P......PP',
      'P........~~~~~.......~~~~~~....P......PP',
      'PPkkkkkn..~......D...~~~~~~...n......DPP',
      'Pkkk....D.....n.......~~~...mP.D.n..PkkP',
      'PD..P........Pn............n.PP.nD..kkPP',
      'PD............n.P..P.........PP......k.P',
      'PD............n...........P..PP......k.P',
      'PD....Pn......n...m......n..LLP.PPPPDkDP',
      'PD..D...PDn....L.....PD.PD.n.P..PkkkkkDP',
      'PPkkkkkDPDDkkkkDkDDDDDkPPD.PkDPDDDDDkkPP',
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP',
    ],
    grass: ['fgrass0', 'fgrass1', 'fgrass2'],
    path: 'forest_path',
    start: { tx: 37, ty: 18 },
    pen: { tx0: 28, tx1: 36, ty0: 3, ty1: 10 },
    shed: { tx: 29, ty: 12 },
    shedTexture: 'shed_log', // rustikale Blockhütte
    ambient: 'ambient_forest', // Hintergrundgeräusch in Dauerschleife: public/assets/sounds/<Name>.mp3
    toolSpots: [
      // vor der Hütte, neben dem Weg zum Gehege
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
};
