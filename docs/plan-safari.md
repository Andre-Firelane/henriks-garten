# Plan: Safari (neues Design für den Savannen-Abschnitt im Tierpark)

Stand: 20.11.2026, umgesetzt (noch nicht committet). Nach dem Wildpark (siehe plan-wildpark.md) ist die Savanne der
zweite Bereich mit neuem Gehege-Design. Was bei der Umsetzung anders wurde als geplant, steht unter „Umsetzung“ ganz
unten, offene Fragen unter „Noch offen“.

## Ziel

Der Savannen-Abschnitt (`park2`) wird eine **Safari**. Statt einer Reihe einzelner Gehege gibt es ein großes, offenes
Gelände, in dem die Tiere frei leben. Besucher fahren mit Autos auf einer festen Route hindurch oder gehen auf einem
umzäunten Fußweg mitten durchs Gelände.

Der Wildpark ist das Vorbild: ein offener Bereich (`open: true`) mit Tor, Tafel und frei laufenden Tieren. Die Safari
ist die große Version davon.

## Grundsätze

- **Henrik fährt nie selbst Auto.** Die Autos gehören den Besuchern. Henrik läuft oder fährt E-Roller, auch durch
  das Gelände und durch die Gehege. Seit dem 20.11.2026 steigt er in Gehegen nicht mehr automatisch vom Roller ab,
  nur noch in Gebäuden (`updateScooter` in GardenScene).
- **Henrik läuft durch fahrende Autos hindurch.** Sie halten ihn nicht auf, und er muss ihnen nicht ausweichen.
  Keine Geschicklichkeit.
- **Keine Wetterphasen.** Wie im ganzen Tierpark gilt immer das normale Wetter. Die Tiere, die es in der Wildnis nur
  bei Regen oder in der Trockenzeit gibt, bekommen ihre Kulisse fest im Gelände (siehe „Tiere“).
- **Kein Gehegeausbau.** Der Ausbau ist abgeschaltet (`PEN_UPGRADES` in map.js). Die Safari wird gleich in voller
  Größe gebaut, es gibt also auch kein Dickicht für spätere Stufen.

## Aufbau

- **Außenzaun** um das ganze Gelände: der hohe Wildzaun der Savanne.
- **Safari-Station am Eingang:** Dort beginnt alles. Sie liegt unten beim Hauptweg aus dem Zentrum, beim Auto und
  beim E-Roller. Zur Station gehören:
  - großes Tor mit Torbogen „Safari“ (englisch „Safari“), wie der Torbogen am Wildpark
  - Parkplatz, auf dem die Besucherautos starten und ankommen
  - große Tafel mit allen Safaritieren (siehe „Schilder“)
  - Futterautomat
  - freie Fläche für Deko, ähnlich wie die Lichtung im Wildpark
  - **freigehaltener Platz für ein Café** (etwa 5 × 5 Kacheln). Vorerst gibt es kein Café, der Platz bleibt Rasen
    und darf auch keine Deko bekommen, damit er später frei ist.
  - Erdmännchenbau als kleines Gehege direkt an der Station
- **Autoroute:** ein Rundkurs durchs Gelände, 2 Kacheln breit, Sandpiste. Start und Ziel ist der Parkplatz. Die Route
  führt am Wasserloch und an den Akazien vorbei und fährt durch den Raubtierbereich.
- **Fußweg:** 1–2 Kacheln breit, mit Zaun auf beiden Seiten. Er führt von der Station mitten ins Gelände bis zu einem
  Aussichtspunkt am Wasserloch und zurück. Wo er die Autoroute kreuzt, gibt es eine Kreuzung mit Zebrastreifen
  (Deko, keine Ampel, kein Warten).
- **Raubtierbereich** innerhalb des Geländes, mit eigenem Zaun und **Doppeltor** an der Autoroute. Das Auto fährt
  hindurch, der Fußweg führt außen herum. Darin liegen zwei Teile mit einem Zaun dazwischen:
  - **Löwenfelsen** für die Löwen (großer Fels `Ʀ`, Schatten unter Akazien)
  - **Elefantenfriedhof** für die Hyänen (Knochen `Ș` `ƭ` `Ʈ` `Ʊ`, kahle Akazien `Ǎ`, dunkler Boden `gravePatch`)
- **Wasserloch** im offenen Gelände, ohne Zaun, wie der Teich auf der Lichtung im Wildpark. Darin leben Nilpferde und
  Krokodile.
- **4 Haltebuchten** an der Autoroute: Wasserloch, Akazienhain, Raubtierbereich, Grasebene. Jede ist eine kleine
  Ausbuchtung mit eigener Tafel. Am Fußweg ist der Aussichtspunkt die Haltebucht.

Grobe Skizze (von oben, nicht maßstäblich; rechts ist der Abschnitt um 12 Spalten breiter als heute):

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │  Akazien  ══════════ Autoroute ══════════════════╗     Grasebene       │
 │   ╔═══════╝                                       ║   Zebras, Gnus     │
 │   ║   Giraffen         ┌─────── Raubtierbereich ──╨──┐                 │
 │   ║                    │ Löwenfelsen │ Elefanten-    │   Warzenschweine│
 │   ║  [Halt]            │             │ friedhof      │                 │
 │   ║                    └─────────────┴──────╥────────┘   [Halt]        │
 │   ║       ~~~~~~~~~~                        ║                          │
 │   ║     ~~ Wasserloch ~~  ◄── Aussichtspunkt║                          │
 │   ║       ~~~~~~~~~~        Fußweg ║        ║                          │
 │   ╚═══════════[Halt]═══════════════╬════════╝                          │
 ├────────────────────────[ TOR „Safari“ ]────────────────────────────────┤
 │ Aquarium │  Safari-Station: Parkplatz, Tafel, Futterautomat, Deko,     │
 │          │  Erdmännchenbau, Auto, E-Roller                             │
 └──────────┴────── Ausgänge ins Zentrum ─────────────────────────────────┘
```

## Tiere

Die Plätze bleiben so, wie sie heute in den ausgebauten Gehegen sind.

| Tier | Heute | In der Safari | Plätze |
|---|---|---|---|
| Antilope, Zebra, Giraffe | Savannengehege | frei im Gelände | 8 / 8 / 5 |
| Gnu | Gnu-Steppe | frei im Gelände | 9 |
| Warzenschwein | eigenes Gehege | frei im Gelände | 5 |
| Nilpferd | Nilpferdbecken | Wasserloch | 4 |
| Krokodil | Krokodilteich | Wasserloch, nur im Wasser und am Ufer | 3 |
| Löwe | Löwengehege | Löwenfelsen im Raubtierbereich | 5 |
| Hyäne | Hyänengehege | Elefantenfriedhof im Raubtierbereich | 6 |
| Geier | Geier-Voliere | frei fliegend, sitzen auf den kahlen Akazien am Friedhof | 5 |
| Erdmännchen | Erdmännchenbau | bleibt ein kleines Gehege, an der Safari-Station | 8 |

Rund 42 Tiere laufen frei im Gelände oder liegen im Wasserloch. Dazu kommen 11 im Raubtierbereich und 5 Geier.

### Lieblingszonen

Die Tiere laufen frei, halten sich aber gern in ihrer Zone auf. So passen die Tafeln an den Haltebuchten, und Henrik
findet die Tiere:

| Zone | Tiere |
|---|---|
| Akazienhain | Giraffen |
| Grasebene | Zebras, Gnus, Antilopen |
| rund ums Wasserloch | Antilopen und Zebras zum Trinken, Warzenschweine im Schlamm am Rand |
| Wasserloch | Nilpferde, Krokodile |

Technisch ist das eine Leine wie `gatherAt` in der Trockenzeit der Wildnis (`Animal.pickWander`): Ein Tier wählt
öfter Ziele in seiner Zone, darf aber überall hin.

### Geier

- Frei wie die Pfauen (`free: true`). Sie verlassen die Safari nicht.
- Sie sitzen nur auf den kahlen Akazien am Elefantenfriedhof, so wie die Aras nur auf ihren Sitzplätzen sitzen.
- Ab und zu fliegt einer auf, kreist über der Safari und landet wieder. Das Kreisen gibt es schon in der Trockenzeit
  der Wildnis (`vultures.every`).

### Das erste Tier einer Art

Heute entsteht die Gnu-Steppe, die Geier-Voliere, das Hyänen- und das Warzenschwein-Gehege erst mit dem ersten Tier
(`PARK_UNLOCKS`). In der Safari steht alles von Anfang an. Die Zonen sind dann einfach leer, bis das erste Tier
einzieht. Der Elefantenfriedhof liegt also anfangs leer da, das passt zu ihm.

## Autos

- Die Besucherautos nutzen das vorhandene Auto-Bild (`car_zoo`) in 2–3 Farbtönen, damit nicht lauter gleiche Autos
  fahren.
- Sie starten am Parkplatz, fahren den Rundkurs langsam ab, halten an jeder Haltebucht kurz an und parken wieder.
- **Tiere auf der Straße:** Steht ein Tier vor dem Auto, wartet das Auto, bis es weitergeht. Zebras, die über die
  Piste trotten, gehören zum Safari-Gefühl. Die Tiere weichen den Autos nicht aus.
- Henrik und die Autos kollidieren nicht.
- Höchstens 2–3 Autos gleichzeitig (siehe „Technische Punkte“, Leistung).
- Die Fußgänger gehen wie bisher über `visitors.js`, nur auf dem Fußweg.

## Schilder

- **Große Tafel an der Safari-Station** mit allen Safaritieren und ihrer Anzahl, wie die Tafel hinter dem Tor des
  Wildparks. Das „Safari“-Schild über dem Tor ist nur der Name.
- **Kleine Tafeln an den Haltebuchten** mit den Tieren der Zone (zum Beispiel am Wasserloch: Nilpferde, Krokodile,
  Antilopen, Zebras).
- **Löwenfelsen und Elefantenfriedhof** haben eigene Tafeln an ihrer Haltebucht, wie heute die Gehegeschilder.
- **Erdmännchenbau** behält sein Gehegeschild.

Technisch gibt es heute ein Schild pro Bereich (`signAt`). Für die Haltebuchten braucht ein offener Bereich mehrere
Tafeln mit je einer Auswahl an Tierarten (zum Beispiel `signs: [{ at, species }]`).

## Deko

Die Deko kommt mit dem Deko-Plan (siehe plan-deko.md). In der Safari gelten zwei Arten von Flächen:

- **Offenes Gelände:** nur Natur-Deko (Felsen, Akazien, Termitenhügel, hohes Gras, Baumstämme). Das gibt es fast alles
  schon (`ƚ` `Ƙ` `Ʀ` `Ţ` `Ʋ`). Laternen und Bänke mitten zwischen den Zebras würden die Illusion stören. Der
  Flood-Fill-Check ist hier besonders wichtig, damit kein Tier eingesperrt und keine Autoroute versperrt wird.
- **Safari-Station, Haltebuchten und Fußweg:** Deko für Menschen (Bänke, Laternen, Blumen).
- Nie auf der Autoroute und nie im Wasserloch.

## Freundschaft

Die Benennung aus plan-freundschaft.md wird für offene Bereiche angepasst (gilt genauso für Rehe und Elche im
Wildpark):

- **Ein benannter Freund pro Tierart** statt einer pro Gehege.
- **Benennen an der Tafel der passenden Haltebucht** oder an der großen Tafel an der Station.
- Der **Name über dem Tier** hat hier einen echten Nutzen: Man findet seinen Freund in der Herde wieder.
- Ab Bindungsstufe 2 kommt der Freund von selbst, wenn Henrik in der Nähe ist. Im offenen Gelände kann Henrik direkt
  zu ihm gehen. Im Raubtierbereich, an Wasserloch und Erdmännchenbau gilt es wie an jedem Gehege.

## Platz

Gemessen per Flood-Fill auf der Karte, den Bedarf geschätzt:

- **Heute** belegen die Savannen-Gehege rund **450 Kacheln** Innenfläche. Der Abschnitt hat rund **1.380 Kacheln**
  (Spalten 17–78, Zeilen 0–22), davon sind etwa 150 fest belegt (Hauptweg, Zugang zum Aquarium, Auto, Ausgänge,
  Bauplätze).
- Im heutigen Savannengehege hat ein Tier nur etwa 6 Kacheln. Für ein offenes Gefühl werden **15–20 Kacheln pro Tier**
  angesetzt.

| Teil | Kacheln (grob) |
|---|---|
| Offenes Gelände für ~42 Tiere, mit Wasserloch | 650–750 |
| Autoroute als Rundkurs, 2 breit, mit Parkplatz | ~200 |
| Fußweg mit Zaun | ~100 |
| Raubtierbereich (Löwenfelsen und Friedhof) | 130–150 |
| Haltebuchten | ~25 |
| Safari-Station mit Deko-Fläche | ~90 |
| Platz für ein späteres Café | ~25 |
| Erdmännchenbau | ~35 |
| Außenzaun | ~120 |
| **zusammen** | **~1.375–1.495** |

Krokodil-, Nilpferd-, Warzenschwein-Gehege und Voliere fallen weg. Mit den fest belegten Kacheln fehlen also etwa
**175–275 Kacheln**.

**Lösung:** Der Abschnitt wird nach rechts verbreitert. Er endet heute bei Spalte 78, rechts daneben ist nichts.
12 Spalten mehr über 23 Zeilen ergeben rund 280 Kacheln. Dafür ändern sich `x1` in `parkSection('park2', …)` und
die Zeilen 0–22 in `PARK_ROWS`.

Der **Hauptweg in Zeile 15** läuft heute quer durch den ganzen Abschnitt. Er wird zur Safari-Station: Der Weg vom
Aquarium und aus dem Zentrum endet an der Station, das Gelände liegt nördlich davon am Stück.

## Spielstand

Beim Laden ziehen die Tiere um, keines darf verloren gehen:

| alte Gehege | neu |
|---|---|
| `savanna`, `gnus`, `warthogs` | Safari (offener Bereich) |
| `hippos`, `crocodile` | Wasserloch |
| `lion` | Löwenfelsen |
| `hyenas` | Elefantenfriedhof |
| `vultures` | Geier (frei) |
| `meerkat` | Erdmännchenbau (bleibt) |

Freischaltungen aus `PARK_UNLOCKS` (`gnu`, `vulture`, `hyena`, `warthog`) werden für die Savanne nicht mehr
gebraucht. Sie dürfen im Spielstand stehen bleiben, die Karte beachtet sie nur nicht mehr.

## Technische Punkte

- **Leistung auf dem Tablet:** ~58 Tiere, 2–3 Autos und Fußgänger in einem Abschnitt sind deutlich mehr als im
  Wildpark. Deshalb zuerst ein **Platzhalter-Test**: grobe Karte mit Zaun, Route und allen Tieren, ohne neue Grafik,
  auf dem Tablet ansehen. Ruckelt es, gibt es weniger Plätze oder weniger Autos.
- **Offener Bereich:** wie der Wildpark (`open: true`, `quota`, `gateTiles`, `visitors`). Das Wasserloch ist ein
  Teich-Bereich wie `clearingpond` (`pond: true`, `shore`), damit Nilpferde und Krokodile im Wasser bleiben.
- **Autoroute:** eigener Bodentyp (Sandpiste, `savanna_path` passt vielleicht schon). Die Autos fahren eine feste
  Kachelfolge ab und brauchen kein Pathfinding.
- **Doppeltor:** zwei Tore hintereinander auf der Route. Sie öffnen sich, wenn ein Auto kommt, und schließen dahinter
  (nur Optik, für Henrik gilt das Tor wie jedes Gehegetor).

## Reihenfolge

1. Platzhalter-Karte mit Verbreiterung, Zaun, Route und allen Tieren; Leistung auf dem Tablet prüfen.
2. Gelände fertig gestalten: Wasserloch, Akazienhain, Raubtierbereich, Station, Fußweg.
3. Spielstand-Umzug.
4. Lieblingszonen.
5. Besucherautos.
6. Geier frei fliegend.
7. Tafeln an Station und Haltebuchten.
8. Torbogen „Safari“ in beiden Sprachen, wie am Wildpark.

## Noch offen

- Wo genau liegen die 4 Haltebuchten? Das entscheidet sich beim Platzhalter-Test (Schritt 1).
- Kommt später ein Café an die Station? Der Platz ist freigehalten.
- Bekommen später auch Asien und der Dschungel offene Bereiche? Noch nicht entschieden.

## Umsetzung (20.11.2026)

So ist es gebaut (Karte: Zeilen 0–24 in `PARK_ROWS`, Abschnitt `park2` bis Spalte 90; Gehege `waterhole`, `safari`,
`lion`, `hyenas`, `meerkat` in `PARK_PENS`; Autos in `src/world/SafariCars.js`). Abweichungen vom Plan:

- **Durchfahrt statt Rundkurs:** Gebaut mit dem Bild `car_zoo`, das es nur von vorne gibt. Die Autos kommen hinten durch
  die Einfahrt (oben links), fahren nur nach unten links und unten rechts (auf die Kamera zu) und verlassen die Safari
  vorne rechts durch die Ausfahrt. Es gibt keinen Parkplatz an der Station. Mit dem Safariauto (vorne und hinten) ginge
  auch der Rundkurs mit Start und Ziel an der Station.
- **Safariauto:** aus `Sprites/Safariauto.webp`, freigestellt mit `tools/safari-jeep-cut.py` zu `safari_jeep_front` und
  `safari_jeep_back` (Paket savanna). Die Durchfahrt nutzt bisher nur die Ansicht von vorne; `SafariCars.js` wählt die
  Ansicht aber schon nach der Fahrtrichtung, ein Rundkurs bräuchte nur eine neue Route.
- **Raubtierbereich:** links an der Station. Die Piste fährt durch das Löwengehege (Schleusen im Norden und Osten, je zwei
  Tore). Die Hyänen sind daneben im **Elefantenfriedhof** (eigenes Gehege mit Tor zur Safari).
- **Geier:** Sie fliegen nicht frei, sondern wohnen mit im Elefantenfriedhof (`quota`) und fliegen dort auf die kahlen
  Akazien. Das Kreisen über der Safari fehlt noch.
- **Haltebuchten:** Die Autos halten an vier Stellen (Akazienhain, Löwen, Grasebene, Wasserloch). Die Piste ist dort nicht
  verbreitert und es gibt dort keine Tafeln.
- **Schilder:** Statt einer großen Tafel hängt für jede Tierart der Safari ein eigenes Schild nebeneinander am Zaun des
  Fußwegs (`noSign`, `signs`). Löwen, Hyänen und Geier haben ihre Schilder vorne am Zaun zum Weg am Vorplatz (Hyänen und
  Geier je eines), das Wasserloch an der Piste.
- **Autos** so groß wie das Auto zur Schnellreise, mittig auf der Piste.
- **Heuhäuschen** (Bild `hay_shelter`) an der Piste bei der Haltebucht Grasebene statt eines Salzlecksteins: Zebras, Gnus
  und Antilopen gehen ab und zu hin und fressen, bis zu 5 zugleich (`seats` in toys.js). Dazu Futterkorb (Akazienhain) und Heuballen.
- **Wasserloch** mit 1 Kachel Ufer (bei 2 Kacheln wäre ein Stück Safari abgeschnitten gewesen).
- **Henrik** geht durch ein Tor am Vorplatz in die Safari. Den Fußweg nutzen nur die Besucher; über ihm steht der Torbogen.
- **Herzen:** Besucher schauen vom Vorplatz und vom Fußweg über den Zaun (`lookOver`). Die Autos bringen selbst keine Herzen.
- **Umzug:** kein eigener Code nötig. Tiere, die nach dem Laden nicht mehr in ihr Gehege passen, setzt das Spiel schon
  heute ins passende (getestet mit allen 66 Savannentieren).
- Die Meldungen beim ersten Geier, der ersten Hyäne, dem ersten Warzenschwein und dem ersten Gnu („… ist ein Gehege
  entstanden“) sind entfernt, weil alles von Anfang an da ist.

