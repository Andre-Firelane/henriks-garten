# Plan: Angeln in allen Welten (Überraschungsfang)

Stand: 24.11.2026, abgestimmt im Brainstorming mit Andre. **Gebaut (noch nicht committet):** Bilder, Pools, Angel vom
Ufer, Schatten (kleine Fische oft als Schwarm), Fischeimer, Süßwasserhalle, Herzen, Umzug alter Spielstände. **Offen:**
Tierbuch (klein/groß je Art), Trophäen, Eimer-Bild (gezeichneter Platzhalter).

Umsetzung: src/world/fishing.js (Arten, Pools, Seltenheit), src/world/FishShadows.js, src/world/FishBucket.js,
src/animals/AngelFish.js, src/tools/RodTool.js (useShore), Süßwasserhalle in levels.js (aquarium, zwei große Becken: fwCold für
Wiese, Wald, Eiswelt und fwWarm für Savanne, Dschungel), migrateFishing in src/save.js, Bilder aus tools/freshwater-fish.py und tools/fish-wag.cjs. Erster Schritt: Fischarten je Gebiet und
Wetter, Seltenheit, klein/groß. Offene Fragen stehen unter „Noch offen“ ganz unten.

## Ausgangslage

Es gibt vier Fischsysteme:

| System | Wo | Bleibt? |
|---|---|---|
| Standardfisch (`fish` mit Skins): taucht im Teich auf, Kescher, Beutel folgt Henrik | Wiese, Wald, Savanne | **wird ersetzt** |
| Kois | Asien | bleibt genau so |
| Riff-Fische | Riff | bleibt genau so |
| Piranhas: Schwarm, Angel vom Kanu, Box im Boot | Dschungel (Starkregen) | bleibt genau so |

Vorhandene Fischbilder (SKINS.fish in Animal.js): Karpfen, Schleie, Rotauge, Barsch, der orange Fisch (Wiese),
Forelle, Äsche, Hecht, Wels, Stör (Wald), Lungenfisch (Savanne). Diese Bilder zeigen die Fische schräg von vorn
(auftauchen, springen) und taugen nicht als Seitenansicht. **Alle 30 Arten brauchen neue Bilder**, siehe „Bildtabelle“.

## Grundsätze

- **Kleine Fische oft als Schwarm** (Wunsch von Andre): 2–4 Schatten kreisen gemeinsam wie die Piranhas, jeder Biss holt
  einen heraus, der Rest bleibt. Große Fische sind immer allein.

- **Man weiß nicht, was anbeißt.** Im Wasser sieht man nur Schatten, die Art zeigt sich erst beim Herausholen.
- **Keine Geschicklichkeit.** Die Pose zuckt, „!“ erscheint, man hat einige Sekunden Zeit. Zu früh drücken macht
  nichts, zu spät heißt nur: Der Fisch ist weg, die Pose dümpelt weiter bis zum nächsten Biss. Kein Köderverlust.
- **Kein Müll.** Es beißt immer ein Fisch.
- **Nur Seitenansicht.** Fische schauen nicht mehr aus dem Wasser.
- **Fischeimer statt Beutel.** Der Eimer hängt an Henrik, aus ihm schauen die Schwanzflossen (eine pro Fisch).
- **Die Fische leben in der neuen Süßwasserhalle im Aquarium**, ein Becken je Welt.
- **Nicht betroffen:** Kois, Piranhas, Riff, Krokodil und Flusspferd (das sind keine Fische, sie bleiben genau so).
- **Kescher bleibt wichtig** (Schmetterling, Igel, Erdmännchen, Aras, Riff …), er fängt nur keine Fische mehr.

## Seltenheit

Drei Stufen, als Gewicht im Pool des Gewässers:

| Stufe | Gewicht | Gefühl |
|---|---|---|
| häufig | 6 | beißt fast jedes zweite Mal |
| selten | 2 | ab und zu |
| sehr selten | 0,5 | ein echtes Highlight |

## Klein und groß

- Jeder Fang ist **klein** oder **groß**. Groß ist bei jeder Art möglich, Chance **20 %**.
- Der Schatten im Wasser verrät es vorher: Ein großer Schatten heißt großer Fisch, aber nicht welche Art.
- Große Fische schwimmen im Becken sichtbar größer (etwa 1,4-fach).
- Im Tierbuch hat jede Art zwei Häkchen, „klein gefangen“ und „groß gefangen“. Später passt dazu eine Trophäe
  (z. B. „Alle Fische einer Welt in groß“).

## Fischarten je Gebiet und Wetter

✔ = Art gibt es schon im Spiel, **neu** = neue Art. Bilder brauchen alle (siehe Bildtabelle).

### Wiese (kein Wetter: Unterschied nach Gewässer)

| Gewässer | häufig | selten | sehr selten |
|---|---|---|---|
| Teich | Karpfen ✔, Schleie ✔ | Rotauge ✔ | Goldfisch (der orange Fisch) ✔ |
| Bach | Barsch ✔, Rotauge ✔ | Döbel **neu** | Aal **neu** |

### Wald (kein Wetter: Unterschied nach Gewässer)

| Gewässer | häufig | selten | sehr selten |
|---|---|---|---|
| Fluss | Forelle ✔, Äsche ✔ | Hecht ✔, Wels ✔ | Stör ✔ |
| Moortümpel | Karausche **neu** | Schlammpeitzger **neu** | Hecht ✔ |

### Savanne (Wetterphasen)

| Phase | häufig | selten | sehr selten |
|---|---|---|---|
| Normal (Wasserlöcher) | Roter Buntbarsch **neu** | Lungenfisch ✔, Raubwels **neu** | Tigerfisch **neu** |
| Starkregen (große Wasserlöcher, beißen schneller) | Roter Buntbarsch **neu**, Lungenfisch ✔ | Tigerfisch **neu** | Nilbarsch **neu** |
| Trockenzeit (nur das letzte Wasserloch, beißen langsamer) | Lungenfisch ✔ | Roter Buntbarsch **neu** | Raubwels **neu** |

Der Lungenfisch schaut in der Trockenzeit nicht mehr aus dem Schlamm, er wird wie alle anderen geangelt.

### Dschungel (Wetterphasen, Fluss vom Kanu oder vom Ufer)

| Phase | häufig | selten | sehr selten |
|---|---|---|---|
| Normal | Pfauenaugenbarsch **neu** | Pacu **neu** | Arowana **neu** |
| Starkregen | Pfauenaugenbarsch **neu** | Pacu **neu** | Arapaima **neu** |
| Nebel | Pacu **neu** | Zitteraal **neu** | Arowana **neu** |

Bei Starkregen bleiben die Piranha-Schwärme wie bisher. Wer genau am Schwarm auswirft, fängt einen Piranha, sonst
gilt der Pool oben.

### Eiswelt (Tag und Nacht)

| Phase | häufig | selten | sehr selten |
|---|---|---|---|
| Tag (Küste, Fjord, vom Ufer) | Saibling **neu**, Dorsch **neu** | Lachs **neu** | Seehase **neu** |
| Nacht (am Eisloch) | Polardorsch **neu** | Heilbutt **neu** | Seehase **neu** |

Eisangeln am Eisloch nutzt die Eislöcher der Nacht (ICE_HOLES).

### Asien, Riff

Kein Angeln: Asien hat die Kois, das Riff bleibt, wie es ist.

### Expeditionen

Dieselben Pools wie im Gebiet, aber die Seltenheit ist heruntergesetzt: Seltene und sehr seltene Fische beißen dort
deutlich öfter (Vorschlag: Gewichte selten 4, sehr selten 2). Das ist ein Anreiz, auf Expedition zu gehen.

Seit 24.11.2026 (gebaut): Fische gehören nicht mehr zur Tierliste der Expeditions-Maps (keine Tierkarte, kein Zähler),
sie schwimmen einfach als Schatten in jedem Gewässer, und die Angel liegt in jeder Kiste einer Map mit Fischschatten.
Gefangene Fische belegen keinen Platz im Wagen: Im nächsten Camp schwimmen sie gleich in der Süßwasserhalle
(expFishHome in GardenScene). Der Bambuswald hat keinen Fisch-Pool (dort gibt es die Kois), dort wird nicht geangelt.

## Entschieden

- **Eimer ohne Grenze.** Es passen beliebig viele Fische hinein.
- **Wiese und Wald haben keine Phasen.** Der Pool hängt dort nur vom Gewässer ab.
- **Herzen nach Seltenheit**, nicht nach Größe. Groß ist nur zum Sammeln (Tierbuch, Trophäe).
- **Herzen in etwa wie die Riff-Fische** (Anziehung `reeffish: 0.5` in visitors.js, weil im Aquarium viele Fische
  schwimmen). Anziehung je Seltenheit: häufig 0,5, selten 1, sehr selten 2. Beim Auswildern (releaseHearts) bringt das
  2 Herzen für häufig und selten, 3 für sehr selten.

## Bildtabelle

30 Arten (Wiese 7, Wald 7, Savanne 5, Dschungel 5, Eiswelt 6). Hecht und Rotauge kommen in zwei Gewässern vor, haben
aber nur ein Bild.

**Für alle Bilder gleich:**
- Seitenansicht (Richtung egal, das Spiel spiegelt), schwimmend, ganzer Fisch im Bild
- im Stil von `Sprites/Piranha.png`: Cartoon, dunkle Umrisslinie, weiche Schattierung, freundlich (keine bösen Augen,
  nur der Piranha darf grimmig sein)
- freigestellt (transparenter Hintergrund), keine Wasserlinie, kein Boden, höchstens ein paar Bläschen
- **ein Bild pro Art**: groß und klein sind dasselbe Bild, nur skaliert; die wackelnde Schwanzflosse macht
  `tools/fish-wag.cjs`
- Breite zu Höhe etwa 3 : 2 (Raster 96 × 64 wie die Riff-Fische); lange Fische (Aal, Hecht …) füllen die Breite, sind dann
  eben flacher

| Nr | Art | Englisch | Welt / Gewässer | Seltenheit | So sieht er aus |
|---|---|---|---|---|---|
| 1 | Karpfen | common carp | Wiese, Teich | häufig | hoher Rücken, große goldbraune Schuppen wie ein Netz, kleine Barteln am Maul, rötlich-braune Flossen |
| 2 | Schleie | tench | Wiese, Teich | häufig | olivgrün mit goldenem Schimmer, sehr kleine Schuppen, kleine rote Augen, runde Flossen, dicker Schwanzstiel |
| 3 | Rotauge | roach | Wiese, Teich + Bach | selten / häufig | schlank, silbern, Rücken blaugrün, auffällig **rotes Auge**, rötliche Bauch- und Afterflossen |
| 4 | Goldfisch | goldfish | Wiese, Teich | sehr selten | leuchtend orange-gold, rundlicher Körper, einfache Schwanzflosse (kein Schleierschwanz) |
| 5 | Barsch | perch | Wiese, Bach | häufig | grün-golden mit 5–7 dunklen **Querstreifen**, stachelige Rückenflosse mit schwarzem Fleck, orangerote Bauchflossen |
| 6 | Döbel | chub | Wiese, Bach | selten | silbrig-bronze, großer Kopf mit breitem Maul, Schuppen dunkel umrandet (Netzmuster), orange Bauchflossen |
| 7 | Aal | eel | Wiese, Bach | sehr selten | lang wie eine Schlange, Rücken dunkel oliv, Bauch gelblich, Flossensaum läuft um das ganze Hinterende |
| 8 | Forelle | brown trout | Wald, Fluss | häufig | olivbraun, **schwarze und rote Punkte** mit hellem Hof, kleine Fettflosse hinter der Rückenflosse |
| 9 | Äsche | grayling | Wald, Fluss | häufig | silbergrau, **riesige Rückenflosse wie ein Segel** (violett mit roten Punkten), kleines Maul |
| 10 | Hecht | pike | Wald, Fluss + Moor | selten / sehr selten | lang gestreckt, **Entenschnabel-Maul**, grün mit hellgelben Flecken, Rückenflosse weit hinten |
| 11 | Wels | wels catfish | Wald, Fluss | selten | riesiger flacher Kopf, breites Maul, **zwei lange und vier kurze Barteln**, dunkelgrau-oliv marmoriert, kleine Augen, lange Afterflosse |
| 12 | Stör | sturgeon | Wald, Fluss | sehr selten | graubraun, spitze Schaufelschnauze mit Barteln darunter, **Reihen von Knochenplatten**, Schwanz wie beim Hai (oben länger) |
| 13 | Karausche | crucian carp | Wald, Moor | häufig | klein, sehr hoher runder Körper, goldbronze, **keine Barteln** |
| 14 | Schlammpeitzger | weatherfish | Wald, Moor | selten | lang und dünn, braun mit dunklen **Längsstreifen**, viele kleine Barteln am Maul |
| 15 | Roter Buntbarsch | jewel cichlid | Savanne | häufig | leuchtend rot, **blaue Glitzerpunkte**, dunkler Fleck an der Seite, hohe Rückenflosse |
| 16 | Lungenfisch | African lungfish | Savanne | selten / häufig | aalartig lang, graubraun mit dunklen Flecken, **fadenartige dünne Flossen** (wie Spaghetti), kleine Augen |
| 17 | Raubwels | sharptooth catfish | Savanne | selten / sehr selten | lang, flacher breiter Kopf, **acht Barteln**, grau-oliv marmoriert, sehr lange Rücken- und Afterflosse |
| 18 | Tigerfisch | tigerfish | Savanne | sehr selten / selten | silbern mit dunklen **Längsstreifen**, orangerote Schwanz- und Bauchflossen, **große sichtbare Zähne** |
| 19 | Nilbarsch | Nile perch | Savanne, nur Starkregen | sehr selten | sehr massig, silbrig-blau, Buckel hinter dem Kopf, **gelber Ring ums Auge**, zwei Rückenflossen |
| 20 | Pfauenaugenbarsch | peacock bass | Dschungel | häufig | gelbgrün, drei dunkle Querbalken, **schwarzer Augenfleck mit Goldring** auf der Schwanzwurzel, orangerote Flossen |
| 21 | Pacu | pacu | Dschungel | selten / häufig | rund wie ein Piranha, aber freundlich, silbergrau mit orangem Bauch, **Zähne wie Menschenzähne** (lustig) |
| 22 | Arowana | silver arowana | Dschungel, normal + Nebel | sehr selten | lang, große **silberne Schuppen**, schräg nach oben zeigendes Maul mit **zwei Kinnbarteln**, lange Rücken- und Afterflosse nach hinten |
| 23 | Arapaima | arapaima | Dschungel, nur Starkregen | sehr selten | riesig und lang, vorn grau-oliv, hinten **scharlachrote Schuppenränder**, flacher Kopf |
| 24 | Zitteraal | electric eel | Dschungel, nur Nebel | selten | lang, dunkel graubraun, **orangegelbe Kehle**, Flossensaum über die ganze Unterseite, winzige Augen, ein paar kleine Funken |
| 25 | Saibling | Arctic char | Eiswelt, Tag | häufig | Rücken oliv, **Bauch leuchtend orangerot**, helle Punkte, Bauchflossen mit weißem Vorderrand |
| 26 | Dorsch | Atlantic cod | Eiswelt, Tag | häufig | olivbraun gesprenkelt, **heller Strich an der Seite**, Bartel am Kinn, drei Rückenflossen |
| 27 | Lachs | Atlantic salmon | Eiswelt, Tag | selten | silbern glänzend, kleine **schwarze x-förmige Punkte** auf dem Rücken, kräftiger Schwanz |
| 28 | Seehase | lumpsucker | Eiswelt, Tag + Nacht | sehr selten | **fast kugelrund**, blaugrün mit Reihen kleiner Höcker, winzige Flossen, sehr niedlich |
| 29 | Polardorsch | polar cod | Eiswelt, Nacht | häufig | klein und schlank, silbergrau, Rücken dunkler, kleine Kinnbartel, gegabelter Schwanz |
| 30 | Heilbutt | halibut | Eiswelt, Nacht | selten | Plattfisch: **flach, beide Augen auf einer Seite** (oben), braun-oliv gesprenkelt, Flossensaum rundherum |

### Vorhandene Quellbilder (24.11.2026)

`Sprites/Fische neu 1.webp` (Wiese, Wald), `Sprites/Fische neu 2.webp` (Savanne) und `Sprites/Fische neu 3.webp`
(Dschungel, Eiswelt): alle 30 Arten, 1024 × 572, weißer Hintergrund mit Namen darunter.

- Die Fische schauen **nach rechts** (das Spiel spiegelt sie für die Gegenrichtung, die Richtung ist also egal).
- Beim Ausschneiden: Hintergrund und Namen weg, ein Bild je Art.
- Gibt es eine Art mehrmals, nehmen wir das erste Bild (Roter Buntbarsch, Lungenfisch, Raubwels, Nilbarsch, Zitteraal,
  Lachs, Heilbutt).
- Nicht gebraucht: „Moortümpel“ (Blatt 1), „Auleraal“ (eine Regenbogenforelle) und „Bollsen“ (ein zweiter Dorsch, beide
  Blatt 3).
- Der Seehase ist orangerot statt blaugrün (wie die Männchen zur Laichzeit). Das passt.

## Süßwasserhalle (Überblick, Einzelheiten später)

Neuer Raum im Aquarium mit je einem Becken pro Welt: Heimische Gewässer (Wiese und Wald), Afrika (Savanne),
Amazonas (Dschungel), Nordmeer (Eiswelt, Kaltwasserbecken). Die Fische schwimmen dort von der Seite wie die
Riff-Fische. Die Fische aus dem Waldteich (`clearingpond`) ziehen beim Laden alter Spielstände in die Halle, der Teich
bleibt den Fröschen.

## Spätere Schritte

1. Pools, Seltenheit, klein/groß (dieser Plan)
2. Angel für alle Gewässer (vom Ufer), Schatten mit Größe, entschärfte Bisse
3. Fischeimer an Henrik
4. Süßwasserhalle im Aquarium, Umzug alter Spielstände
5. Tierbuch (klein/groß), Trophäen
6. Bilder aller 30 Arten (Bildtabelle; bis dahin Platzhalter aus vorhandenen Bildern)

## Noch offen

- nichts
