# Plan: Deko im Tierpark frei setzen

Stand: 20.11.2026, noch nicht umgesetzt.

## Ziel

Man gestaltet den Tierpark selbst, als Cozy-Mechanik vor allem für Erwachsene. Henrik kann trotzdem leicht mitmachen.
Die Herzen der Besucher bekommen über den Deko-Laden eine dauerhafte Verwendung. Bisher flossen sie fast nur in den
Gehegeausbau und in Events. Der Gehegeausbau ist seit dem 20.11.2026 abgeschaltet (`PEN_UPGRADES` in map.js, alle Gehege
gelten als ausgebaut); die Deko ersetzt ihn.

## Grundsätze

- **Nur im Tierpark**, in allen drei Abschnitten. Nicht in Aquarium und Reptilienhaus, nicht in der Wildnis.
- **Deko-Laden im Haupthaus** gegen Herzen. Dazu kommen eine Grundausstattung, besondere Teile aus Kisten und Deko der
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

1. **Deko-Taste**: Sie ist überall im Tierpark da, neben den anderen Knöpfen (am PC eine eigene Taste).
2. Sie öffnet ein Auswahlfeld im Stil der Werkzeugkiste (`openToolChest` in ui/toolChest.js) mit allen Deko-Teilen,
   die man besitzt, jeweils mit Anzahl („Laterne ×3“). Gesetzte Teile zählen nicht mit.
3. Nach der Auswahl ist Henrik im **Setzen-Modus**:
   - Auf der Kachel vor ihm erscheint eine durchsichtige Vorschau. Grün heißt „passt“, rot heißt „geht hier nicht“.
   - Mit der Aktionstaste wird das Teil gesetzt.
   - **Das Teil bleibt ausgewählt**, solange man noch welche hat. So setzt man eine Reihe schnell hintereinander.
   - Erneutes Drücken der Deko-Taste oder „Fertig“ im Auswahlfeld beendet den Modus.
4. **Aufheben**: Mit leerer Hand an einer gesetzten Deko und der Aktionstaste wandert sie sofort zurück in die
   Deko-Taste.
5. Später vielleicht: Im Setzen-Modus eine Kachel in der Nähe antippen, dann landet die Deko dort. Das wird erst nach
   dem Ausprobieren entschieden.

Der Setzen-Modus darf andere Aktionen am selben Ort nicht schlucken. Steht Henrik zum Beispiel an einem Gehegeschild,
gilt die Aktionstaste wie bisher dem Schild, und die Vorschau ist rot.

## Woher die Deko kommt

### 1. Grundausstattung

Hat jeder Spielstand von Anfang an, auch ältere beim Laden. Zum Beispiel:
- 2 Bänke
- 4 Blumenbeete (rot und gelb)
- 3 Laternen
- 2 Büsche
- 1 kleiner Baum
- 6 Wegsteine

### 2. Deko-Laden im Haupthaus

- Er steht im Haupthaus des Tierparks, neben dem Computer. Mit der Aktionstaste öffnet sich ein Auswahlfeld im Stil
  der Werkzeugkiste, jedes Teil mit Bild und Preis in Herzen. Gekaufte Teile landen sofort in der Deko-Taste.
- Im Laden gibt es die **allgemeine Deko** in beliebiger Menge: Bänke, Blumenbeete, Laternen, Büsche, Hecken, kleine
  Bäume, Wegsteine, Brunnen.
- Preise je nach Größe, zum Beispiel klein 5, mittel 15 und groß 40 Herzen. Das muss noch auf die Herzen-Einnahmen
  abgestimmt werden (Herzregen = 50; der Gehegeausbau, früher 40 Herzen und jeder weitere 10 mehr, fällt weg).
- **Gefundenes wird kaufbar:** Hat man ein Teil aus einer Kiste oder einer Expedition einmal bekommen, steht es danach
  auch im Laden. Wer zum Beispiel einmal Bambus aus der Bambuswald-Expedition hat, kann sich dann eine ganze Reihe
  kaufen und muss nicht zehnmal auf Expedition. So bleiben Kisten und Expeditionen besonders, und der Laden wächst mit.

### 3. Kisten in der Wildnis: besondere Deko

- Neue Kartenart **„Deko“** neben dem seltenen Tier, dem Bonus und dem Glücksbringer (`kind: 'deco'`, siehe luck.js).
- Darin gibt es Teile, die nicht von Anfang an im Laden stehen, zum Beispiel Pavillon, Blumenbogen, Vogelhäuschen,
  Laternenkette und goldener Brunnen.
- Eine Karte bringt 1–3 Stück, große Teile seltener und einzeln.
- Für die Welten ohne Expedition (Wiese, Eiswelt, Riff) gibt es in deren Kisten zusätzlich Deko der eigenen Welt.
  Das gilt nur, bis sie eine Expedition haben.

### 4. Expeditionen: Deko der Welt

- Neue Wegkarte **„Deko“** bei der Wahl zwischen den Maps (`KINDS` in expedition.js), mit Deko der Welt der
  Expedition.
- Die **Abschlusskiste** am Ende einer Expedition enthält immer ein Deko-Teil der Welt, gern ein großes oder seltenes.

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

1. **Setzen und Aufheben** mit Deko-Taste, Vorschau, erlaubtem Boden und Speichern, nur mit der Grundausstattung und
   vorhandenen Bildern.
2. **Deko-Laden** im Haupthaus mit Herzen-Preisen.
3. **Kollision** großer Deko mit der Erreichbarkeitsprüfung.
4. **Kisten**: Deko-Karte und besondere Deko, Gefundenes wird im Laden kaufbar.
5. **Expeditionen**: Deko-Wegkarte, Abschlusskiste, Deko der Welten.
6. **Neue Bilder** für Bank, Brunnen, Pavillon, Blumenbogen und Co.

Jeder Schritt wird auf dem Testport geprüft. Der Tablet-Server bleibt unberührt, und es wird erst nach „GO“
committet.
