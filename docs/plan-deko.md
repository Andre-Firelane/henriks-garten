# Plan: Deko im Tierpark frei setzen

Stand: 22.11.2026. Schritte 1–5 und 7 sind umgesetzt (Setzen und Aufheben, Deko-Laden, Kollision, Gehege gestalten, Kisten, Buden umsetzen); von Schritt 6 die Abschlusskiste.

## Ziel

Man gestaltet den Tierpark selbst, als Cozy-Mechanik vor allem für Erwachsene. Henrik kann trotzdem leicht mitmachen.
Die Herzen der Besucher bekommen über den Deko-Laden eine dauerhafte Verwendung. Bisher flossen sie fast nur in den
Gehegeausbau und in Events. Der Gehegeausbau ist seit dem 20.11.2026 abgeschaltet (`PEN_UPGRADES` in map.js, alle Gehege
gelten als ausgebaut); die Deko ersetzt ihn.

## Grundsätze

- **Nur im Tierpark**, in allen drei Abschnitten. Nicht in Aquarium und Reptilienhaus, nicht in der Wildnis.
- **Deko-Laden** (eigener Stand im Tierpark-Zentrum) gegen Herzen. Dazu kommen eine Grundausstattung, besondere Teile aus Kisten und Deko der
  Welten aus Expeditionen (siehe „Woher die Deko kommt“).
- **Kein Tragen.** Man holt nichts an einer Kiste ab und läuft nicht hin und her.
- **Raster statt pixelgenau:** Deko rastet auf Kacheln ein.

## Wo man Deko setzen darf

Gesetzt wird auf dem Kachelraster der Karte. Eine gesetzte Deko ist eine Kachel-Überschreibung im Spielstand, wie die
Durchgänge (`sideOverrides` in map.js). Zeichenreihenfolge, Verdecken und Kollision funktionieren dann wie bei jedem
Busch aus `OBJECTS`.

- **Erlaubt:** Rasen und freie Flächen im Tierpark
- **Nicht erlaubt:**
  - auf Wegen (`PATH_CHARS`)
  - in Gehegen (deren Ausstattung bleibt, wie sie ist). Offene Bereiche (`open`, z. B. der Wildpark) zählen nicht als
    Gehege: Dort darf man Deko setzen, die Lichtung ist dafür gedacht (siehe plan-wildpark.md).
  - auf Bauplätzen
  - auf **reservierten Flächen** künftiger Gehege (Wolfswald, Flamingos und jedes spätere Gehege, das per `unlocks`
    über die Karte gelegt wird). Reserviert ist das Rechteck um alle Kacheln, die sich beim Freischalten ändern. Sie
    sind nur im Setzen-Modus sichtbar (leicht orange eingefärbt), im normalen Spiel bleibt die Überraschung. Steht beim Freischalten doch Deko im Weg, wandert sie zurück in die Deko-Taste (kurzer Hinweis).
  - direkt vor Toren, Gehegeschildern, Buden, dem Futterautomaten, dem Computer und dem Auto
  - auf Kacheln, auf denen schon etwas steht

## Kollision

- **Kleine Deko** (Blumen, Laternen, Wegsteine, Pilze, Gräser) ist nicht fest. Man läuft hindurch oder dahinter. Sie
  kann nichts versperren.
- **Große Deko** (Bänke, Brunnen, Bäume, Hecken, Felsen) ist fest, mit kleiner Hitbox wie die Bäume. Beim Setzen
  prüft das Spiel per Flood-Fill, ob alle wichtigen Stellen (Tore, Schilder, Buden, Ausgänge, Futterautomat,
  Computer) von der Startstelle aus erreichbar bleiben. Wenn nicht, wird die Vorschau rot.
- Besucher laufen nur auf Wegen. Deko auf Rasen stört sie also nicht.

## Bedienung

1. **Deko-Taste**: Sie ist überall im Tierpark da, oben rechts neben „Glücksbringer“ (am PC die Taste B). Sie schaltet
   den **Setzen-Modus** direkt an und aus, ohne Auswahlfenster dazwischen.
2. Im Setzen-Modus sieht man deutlich, dass er an ist:
   - ein grüner Rahmen ums ganze Bild, die Deko-Taste leuchtet grün;
   - rechts eine feste Leiste mit allen Deko-Teilen, die man besitzt (Bild, Anzahl), „Aufheben“ und einem grünen
     „Fertig“. Am PC wählt man auch mit 1–9, 0 ist Aufheben, Esc ist Fertig. Auf Tablet und Handy beginnt die Leiste
     oben unter den Knöpfen (der Aktionsknopf bleibt frei), auf dem Handy nur Bild und Anzahl;
   - auf der Karte ist jede Kachel, auf die man bauen darf, leicht grün mit feinem Raster; die Flächen künftiger
     Gehege sind orange gestreift.
3. Auf der Kachel vor Henrik erscheint eine durchsichtige Vorschau, grün heißt „passt“, rot heißt „geht hier nicht“.
   Mit der Aktionstaste wird das Teil gesetzt, und **es bleibt ausgewählt**, solange man noch welche hat. So setzt man
   eine Reihe schnell hintereinander.
4. **Drehen**: runder Knopf links neben der Leiste (am PC R). Die Bilder gibt es nur aus einer Blickrichtung, deshalb
   wird das Teil gespiegelt; so zeigt eine Bank in die andere Schrägrichtung. Gespeichert als `flip`, beim Umstellen
   bleibt die Drehung erhalten. Echte vier Richtungen bräuchten je Teil vier Bilder.
5. **Aufheben**: nur im Setzen-Modus (sonst hebt man beim Vorbeilaufen aus Versehen etwas auf). Steht vor Henrik
   eine gesetzte Deko, leuchtet sie gelb, und die Aktionstaste (am Tablet der Aktionsknopf) legt sie zurück in die
   Deko-Taste. Danach ist sie gleich ausgewählt, so stellt man sie schnell um. Im Auswahlfeld gibt es dafür auch
   „Aufheben“ (nichts ausgewählt). Nichts geht verloren (kein Verkaufen, kein Wegwerfen). Später vielleicht „Alles
   einsammeln“ je Abschnitt.
6. **Antippen** (umgesetzt 23.11.2026, Andre: am Tablet war das Davorstellen zu fummelig): Im Setzen-Modus eine Kachel
   bis zu 2 Kacheln um Henrik herum (auch schräg, `REACH` in DecorMode.js) antippen bzw. am PC anklicken. Liegt dort
   gesetzte Deko (oder trifft man ihr Bild, z. B. die Baumkrone), wird sie aufgehoben; sonst landet das gewählte Teil
   dort (große Teile reichen von Henrik weg). Geht es nicht, blinkt die Kachel rot mit kurzem Hinweis („Hier geht das
   nicht“, „Geh näher heran“, Grund bei Buden). Auch in der linken Bildschirmhälfte: ein kurzes, ruhiges Tippen
   (unter 0,3 s) zählt dort als Tippen, nicht als Laufen. Die Vorschau vor Henrik und die Aktionstaste gibt es weiter.

Der Setzen-Modus darf andere Aktionen am selben Ort nicht schlucken. Steht Henrik zum Beispiel an einem Gehegeschild,
gilt die Aktionstaste wie bisher dem Schild, und die Vorschau ist rot.

## Woher die Deko kommt

### 1. Grundausstattung

Hat jeder Spielstand von Anfang an, auch ältere beim Laden (`STARTER` in src/world/decor.js):
- 2 Bänke
- 4 Blumenbeete (je 2 rote und gelbe)
- 3 Laternen (vorerst die Steinlaterne aus dem Bambuswald, eine eigene Parklaterne kommt mit den neuen Bildern)
- 2 Büsche
- 1 kleiner Baum
- Wegsteine kommen erst mit den neuen Bildern (Schritt 8), es gibt noch keins

### 2. Deko-Laden (umgesetzt 21.11.2026)

- Ein **eigener Marktstand** im Tierpark-Zentrum, oben am Haupthaus an der Ecke links neben dem E-Roller (Rasenstück
  links vom Weg zur Tür), auf 2×2 Kacheln, damit man sofort sieht, dass es ihn gibt. Der linke Bauplatz für Buden, der
  dort lag, ist dafür nach unten an den Hauptweg gezogen (wo der Stand zuerst stand); eine dort gebaute Bude zieht mit. Bild von Andre (Sprites/Dekoladen.webp,
  freigestellt und verkleinert mit tools/deco-stand.py); das Schild am Stand zeigt Laterne, Blumen und Bank.
- Davor zeigt die Werkzeugleiste „Deko-Laden“; Aktionstaste oder Antippen öffnet eine Tafel wie am Computer: jedes Teil
  mit Bild, Preis, „Du hast … · aufgestellt …“ und „Kaufen“. **Die Tafel bleibt beim Kaufen offen**, so kauft man
  schnell mehrere. Gekauftes liegt sofort in der Deko-Taste. Ist die Deko-Taste leer, verweist die Leiste auf den Laden.
- Im Laden gibt es die **allgemeine Deko** in beliebiger Menge (sortiert nach Preis, `cost` in src/world/decor.js):
  Blumen in fünf Farben 5, Busch 10, Bank 15, Laterne 15, Baum 25, Kirschbaum 30, Brunnen 50 Herzen. Das Sparschwein
  (Glücksbringer) macht sie billiger wie alles im Tierpark. Hecken und Wegsteine fehlen noch (keine Bilder).
- Die Preise sind ein erster Wurf; sie müssen noch auf die Herzen-Einnahmen abgestimmt werden (Herzregen = 50,
  Wunsch erfüllt = 30).
- **Gefundenes wird kaufbar:** Hat man ein Teil aus einer Kiste oder einer Expedition einmal bekommen, steht es danach
  auch im Laden (`game.decor.shop`, kommt mit Schritt 5 und 6).

### 3. Kisten in der Wildnis: besondere Deko (umgesetzt 22.11.2026)

- Neue Kartenart **„Deko“** (grün) neben dem seltenen Tier, dem Bonus und dem Glücksbringer (`kind: 'deco'` in luck.js,
  Gewicht 0,3 neben 0,45 / 0,4 / 0,15). Nicht auf Expeditionen (die bekommen eigene Deko, Schritt 6).
- **Baupläne** (Andre, 22.11.2026): Eine Deko-Karte bringt nicht das Teil, sondern seinen **Bauplan**. Ab dann steht es
  im Deko-Laden und lässt sich dort kaufen, so oft man will (`learnBlueprint` in decor.js, `game.decor.shop`). Einen
  Bauplan, den man schon hat, gibt es in keiner Kiste mehr. Gilt auch für die Abschlusskiste der Expeditionen.
- **Besondere Deko** (`special`, aus allen Kisten, vorerst aus vorhandenen Bildern): Vogelhäuschen, Ziehbrunnen,
  Bienenkorb, Trauerweide. Pavillon, Blumenbogen, Laternenkette und goldener Brunnen kommen mit neuen Bildern.
- **Deko der Welt** (`world`) in den Welten ohne Expedition, solange sie keine haben:
  Wiese: Sonnenblumen, Kürbisse, Vogelscheuche, Heuballen; Eiswelt: Eisblock, Eisstein; Riff: Koralle, Seestern.
- Ihre Bilder lädt der Tierpark mit (levelGroups in BootScene: Pakete der Deko, die man hat oder die dort steht).

### 4. Expeditionen: Deko der Welt

- Neue Wegkarte **„Deko“** bei der Wahl zwischen den Maps (`KINDS` in expedition.js), mit Deko der Welt der
  Expedition.
- **Abschlusskiste** (Andre, 22.11.2026, umgesetzt): Deko erst, wenn man alle Glücksbringer schon hat. Die Kiste zeigt
  zuerst Glücksbringer, die man noch nicht hat; ist Platz, kommt der Schatz (100 Herzen) dazu, und die übrigen Plätze
  füllen Baupläne der Deko dieser Welt auf (`finalChestDecor`): Wald: Farn, Fliegenpilze, Moosstamm, Felsbrocken;
  Savanne: Termitenhügel, Akazie, Knochen, Felsen; Bambuswald: Bambus, Sonnenstein, Hohes Gras; Dschungel: Hibiskus,
  Helikonie, Blattpflanze. Das Teil steht danach im Deko-Laden.

### Mögliche Deko je Welt (Bilder fast alle schon vorhanden)

| Welt | Deko |
|---|---|
| Wiese | Sonnenblumen, Vogelscheuche, Kürbisse, Windrad, Heuballen |
| Wald | Farne, Pilze, Baumstamm, Moos-Stein, Moorlaterne, Laubhaufen |
| Savanne | Termitenhügel, Akazie, Knochen, Felsen |
| Bambuswald | Bambus, Gebetsfahnen, Steinlaterne, Torii (klein) |
| Dschungel | Hibiskus, Farn, Palme, Totempfahl |
| Eiswelt | Schneemann, Eisblock, Iglu (klein) |
| Riff | Muscheln, Korallenstein, Anker |

Viele davon gibt es als Objekte der Wildnis-Maps schon. Neue Bilder braucht es vor allem für allgemeine Teile wie
Bank, Brunnen, Pavillon und Blumenbogen.

## Gehege gestalten (umgesetzt 22.11.2026)

Ersetzt den abgeschalteten Gehegeausbau: den eigenen Tieren ein hübsches Zuhause bauen. Henrik geht dazu ins Gehege
(durchs Tor) und setzt wie draußen auf die Kachel vor sich.

- **Gestaltbar** (`designablePen` in src/world/decor.js): alle richtigen Gehege mit Tieren. Nicht: Teiche, frei laufende
  Tiere, offene Bereiche (Safari: Jeeps; Streichelzoo: Besucher gehen hinein; der Wildpark erlaubt Deko wie draußen),
  Streichelgehege (Katzenhaus) und Gehege mit festen Spielzeug-Plätzen (`toysAt`).
- **Spielzeug wird beweglich:** Die Plätze des Spielzeugs stehen jetzt im Spielstand (`game.decor.toys`, beim ersten
  Aufbau wie bisher verteilt). Im Setzen-Modus hebt man es auf; es liegt dann als eigenes Teil in der Deko-Taste und
  passt nur in Gehege, zu denen es gehört (`PEN_TOYS`), z. B. der Wachposten nur zu den Erdmännchen. So finden die Tiere
  es weiter (sie suchen ihr Spielzeug auf den Kacheln ihres Geheges).
- **Deko im Gehege:** nur Natur (`pen: true`: Blumen, Busch, Baum, Kirschbaum), keine Bank, Laterne oder Brunnen.
  Höchstens eine je 10 Kacheln des Geheges, mindestens 2 (`penDecorMax`); ist es voll, steht „Das Gehege ist voll“.
  Später kommt die Deko der Welten dazu (Termitenhügel bei den Erdmännchen, Bambus beim roten Panda …).
- **Schutz:** nicht auf Wasser, nicht neben Tor und Schild, feste Deko darf nichts abschneiden (dieselbe
  Erreichbarkeitsprüfung wie draußen, sie läuft durch die Tore auch ins Gehege).
- **Tierfreund:** Stellt man etwas in sein Gehege, steigt über ihm ein Herz auf. Nur ein Effekt, keine Herzen fürs
  Konto (sonst lohnte sich Hin- und Herstellen).
- Das Overlay hängt vom gewählten Teil ab: mit Spielzeug sind nur die Kacheln seines Geheges grün.

## Buden umsetzen (umgesetzt 22.11.2026)

- Im Setzen-Modus leuchtet eine gebaute Bude vor Henrik gelb; die Aktionstaste hebt sie auf. Sie liegt dann in der
  Deko-Taste (ganz vorne in der Leiste) und ist gleich ausgewählt; ihr **Bauplatz ist wieder frei** (die Pflöcke stehen
  wieder da, man kann dort eine andere Bude bauen). Drehen geht auch bei Buden.
- Setzen nur **im selben Abschnitt**, nur draußen (nicht in Gehegen), **direkt am Weg** (eine Wegkachel daneben, dort
  stellen sich die Besucher an) und mit **mindestens 3 Kacheln Abstand** zu anderen Buden und zum Deko-Laden. Die Leiste
  unten sagt, was nicht passt: „Nur direkt am Weg“, „Zu nah an einer anderen Bude“, „Diese Bude steht hier schon“.
- Höchstzahl: jede Sorte einmal je Abschnitt (also höchstens 5); eine aufgehobene Bude zählt mit.
- Die Besucher berechnen Wege und Plätze vor den Buden beim Aufbau eines Abschnitts. Deshalb baut sich der Abschnitt
  nach dem Aufheben und nach dem Setzen kurz neu auf („Die Bude wird umgestellt …“), und der Setzen-Modus geht danach
  weiter. An der umgestellten Bude kauft gleich jemand ein.
- Gespeichert in `game.booths` ({ Id: { level, tx, ty, flip } } bzw. { level, stored }); eine umgestellte Bude zählt wie
  ein Bauplatz (`slotsIn` in shops.js). Passt ihr Platz nach einem Umbau nicht mehr, kommt sie in die Deko-Taste.
- Das Riesenrad bleibt fest.

## Umbau: Bauen statt Deko (Andre, 22.11.2026)

- Die Taste heißt **„Bauen“** (Bild: Eisstand, public/assets/icon_build.png). Die Leiste ist eine durchgehende Liste
  mit Zwischenüberschriften **Buden** und **Deko** (mit dem Spielzeug der Gehege) – keine Reiter, die übersieht man.
- **Grundausstattung:** ein Eisstand fürs Zentrum liegt von Anfang an in der Leiste (ältere Spielstände bekommen ihn
  einmal, wenn dort noch keiner steht). Mavis Buden-Aufgabe: „Stell eine Bude an einen Weg“.
- **Bestellen** statt Laden im Park: In der Bauen-Leiste öffnet „Bestellen“ einen Katalog – eine Liste mit
  Zwischenüberschriften Buden und Deko, keine Reiter (Preise in Herzen, die Tafel bleibt beim Bestellen offen). Henrik ist der Zoodirektor und bestellt; das Bestellte liegt sofort in
  der Leiste. Der Marktstand im Park als Laden entfällt.
- **Buden frei setzen**: Eine bestellte Bude setzt man wie Deko an einen Weg (direkt am Weg, Abstand zu anderen Buden).
  **Höchstens 3 Buden je Parkabschnitt** (`MAX_BOOTHS` in shops.js), jede Sorte einmal. Die festen Bauplätze entfallen;
  schon gebaute Buden bleiben, wo sie sind (alte Spielstände ziehen um), und lassen sich umstellen.
- **Baupläne für Buden:** Zuckerwatte und Brezeln gibt es erst mit Bauplan aus einer Kiste (`blueprint` in shops.js);
  Eisstand, Popcorn, Limonade und Blumen & Andenken sind von Anfang an bestellbar.
- **Tutorial** (Mavis Buden-Aufgabe „Stell eine Bude an einen Weg“): der nächste Knopf pulsiert und bekommt den roten
  Pfeil wie beim Tierfreund – Bauen-Taste, dann der Eisstand in der Leiste (bzw. „Bestellen“, wenn keine Bude in der
  Leiste liegt; im Katalog zeigt der Pfeil auf den Eisstand), zuletzt „Fertig“. Mavis Pfeil zeigt auf einen guten Platz
  (`boothHint` in levels.js: vor dem Haupthaus links vom Weg zur Tür, weit genug weg vom Auto). Erledigt erst, wenn eine
  Bude steht **und** die Bauen-Leiste zu ist.
- Im Setzen-Modus geht Setzen bzw. Aufheben vor dem Auto (sonst öffnete am Auto aus Versehen die Karte).
- Der **Marktstand** (Andres Bild) wird die sechste Bude **„Blumen & Andenken“** über 2×2 Kacheln: Besucher kaufen dort
  ein, das bringt Herzen. (Andre findet ihn groß – ausprobieren.)

## Speichern

```js
decor: {
  owned: { bench: 2, flowers_red: 3, lantern: 1 },     // in der Deko-Taste, noch nicht gesetzt
  shop: ['bamboo', 'pavilion'],                          // aus Kisten/Expeditionen bekommen, jetzt auch im Laden
  placed: {                                              // je Tierpark-Abschnitt
    park:  [{ id: 'bench', tx: 12, ty: 30 }],
    park2: [],
    park3: [],
  },
},
```

- Beim Laden wird jede gesetzte Deko geprüft. Steht sie durch einen späteren Umbau (zum Beispiel
  neuer Weg) an einer nicht mehr erlaubten Stelle, wandert sie zurück in die Deko-Taste.
- Alle Texte zweisprachig über `tr()`.

## Umsetzung in Schritten

1. ✔ **Setzen und Aufheben** mit Deko-Taste, Vorschau, erlaubtem Boden, reservierten Flächen und Speichern, nur mit
   der Grundausstattung und vorhandenen Bildern. Die Erreichbarkeitsprüfung für feste Deko (eigentlich Schritt 3) ist
   schon dabei, sonst könnte eine Bank einen Weg versperren.
2. ✔ **Deko-Laden** als Stand im Zentrum mit Herzen-Preisen.
3. ✔ **Kollision** großer Deko mit der Erreichbarkeitsprüfung (kam schon mit Schritt 1).
4. ✔ **Gehege gestalten**.
5. ✔ **Kisten**: Deko-Karte und besondere Deko, Gefundenes wird im Laden kaufbar.
6. **Expeditionen**: ✔ Abschlusskiste (Deko erst ohne offene Glücksbringer); offen: Deko-Wegkarte.
7. ✔ **Buden umsetzen**.
8. ✔ **Neue Bilder**: Blumenbogen, Lampionpfosten, Pavillon (2×2 Kacheln, `size: 2`), Schneemann und Anker von Andre
   (scenario-assets (7), verarbeitet mit tools/decor-sprites.py); Wegsteine (Grundausstattung, ältere Spielstände
   bekommen 6 dazu) noch Platzhalter (tools/decor-placeholders.py, zum Überarbeiten in Claude-Sprites/Deko).
   Die fünf gibt es nur als Bauplan aus Kisten, danach im Laden.
   **Vorerst nicht im Sortiment** (Andre, 22.11.2026): Parklaterne (die Laterne bleibt die Steinlaterne), Hecke und
   goldener Brunnen; ihre Platzhalter bleiben in Claude-Sprites/Deko.

Jeder Schritt wird auf dem Testport geprüft. Der Tablet-Server bleibt unberührt, und es wird erst nach „GO“
committet.
