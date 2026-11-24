# Plan: Haupthaus (Einrichten und Trophäen)

Stand: 2026-11-24, Schritte 1–6 aus Abschnitt 6 gebaut (nicht committet). Eigene Bilder fehlen noch (Abschnitt 7).

## Ziel

Das Haupthaus hat seit dem Events-Knopf keine eigene Aufgabe mehr. Es wird zu Henriks eigenem Raum:
**einrichten** (Herzen ausgeben, kreativ sein) und **Trophäen zeigen** (Stolz auf das Erreichte).

## 1. Einrichten

- Möbel werden wie die Deko draußen **bestellt** (Katalog, Herzen) und im Haus **frei gesetzt** (DecorMode).
  Draußen-Deko und Haus-Möbel sind getrennte Kataloge: Möbel nur drinnen, Deko nur draußen.
- **Stile** nach den Welten, dafür gibt es schon Bilder aus den Hütten: Wiese, Wald, Savanne, Bambuswald, Dschungel,
  Eiswelt (je Schreibtisch, Stuhl, Regal, Pflanze, teils Bett), dazu das Büro (Sofa, Sessel, Tisch, Teppich, Pflanzen).
- Später neue Bilder: Aquarium, Lampen, Bilderrahmen, Teppiche je Stil.
- **Aquarium**: zeigt Fische, die man schon gefangen hat (als Möbelstück mit Leben).
- Preise: kleine Teile 20–50, große 100–300.
- Der Hauptrechner bleibt stehen (Events gehen auch dort).

## 2. Meilensteine (Erfolgssystem)

Grundlage für die Trophäen: ein kleines Erfolgssystem.

- `src/world/trophies.js`: Liste `{ id, name, group, check(game) }`, erreicht in `game.trophies = { id: Zeitpunkt }`.
- Geprüft wird bei passenden Anlässen (Fang, Abgeben, Freundschaftsstufe, Wunsch erfüllt, Expedition beendet, Kauf).
- Erreicht: kurze Meldung (kurz, siehe Regel für Popups), die Trophäe steht danach im Haupthaus.
- Übersicht: ein Reiter im Tierbuch („Trophäen“), noch nicht erreichte als Schatten.
- Ältere Spielstände: beim Laden einmal alles prüfen, ohne Meldungen.

## 3. Trophäen (abgestimmt 2026-11-24)

Jede Trophäe hat ein **eigenes Bild**; ähnliche Trophäen teilen sich ein Motiv in Stufen (Bronze/Silber/Gold).
Nicht dabei: erster Tierfreund und erstes Tierbaby (beides kommt schon im Tutorial vor, das Tierbaby ist nur ein Event).

**Tierbuch**
- Je Welt alle Arten gefangen: Wiese, Wald, Savanne, Bambuswald, Dschungel, Riff, Eiswelt (7)
- Alle Arten gefangen (Gold)

**Fellfarben**
- Erste seltene Fellfarbe (Bronze), 10 seltene Fellfarben (Silber)
- Alle Fellfarben einer Art (je Art mit Fellfarben eine Trophäe)

**Tierfreunde**
- Ein Tierfreund auf der höchsten Stufe
- 10 Tierfreunde

**Tierpark**
- Alle Gehege eines Abschnitts voll (je Abschnitt: Zentrum, Savanne, Bambuswald)

**Besucher**
- 10 Wünsche erfüllt (Silber), 50 Wünsche erfüllt (Gold)
- 1.000 Herzen (Silber), 10.000 Herzen gesammelt (Gold), insgesamt, nicht Kontostand

**Unterwegs**
- Erste Expedition beendet (Bronze), 10 Expeditionen (Silber), alle Expeditionen einmal gespielt (Gold)
- Jedes Event einmal gestartet
- Alle Reittiere gekauft

**Mavi**
- Alle Aufgaben geschafft

Erreichte Trophäen zählen auch in der Statistik (sessions.js).

## 4. Zeigen

- Verdiente Trophäen **kauft man nicht**. Kaufen kann man, **worauf** man sie zeigt: Vitrine, Wandregal, Sockel
  (je Stil). Jeder Platz nimmt eine bzw. mehrere Trophäen auf, man wählt selbst, welche.
- Ohne gekauften Platz: die Trophäen stehen im Tierbuch (nichts geht verloren).

## 5. Umsetzung (entschieden 2026-11-24)

- **Eigener Innenraum**: Die Tür des Haupthauses im Park führt in ein eigenes Level `house` („Haupthaus“), wie Aquarium
  und Reptilienhaus. Größer als heute (Vorschlag 14 × 10 Kacheln), Boden `floor_office`, Wände wie im Büro. Die Parkkarte
  bleibt sonst unberührt; zurück geht es durch die Tür vor den Vorplatz.
- **Trophäen**: Vitrinen, Wandregale und Sockel werden gekauft und gesetzt; davor die Aktionstaste wählt, welche
  erreichten Trophäen darauf stehen (`game.house.shelves = { Möbel-Id: [Trophäen-Ids] }`).
- **Möbel**: eigener Katalog „Möbel“ (nur im Haus bestellbar und setzbar), Bauen-Knopf auch im Haus. Startmöbel: die
  heutigen Büromöbel (Schreibtisch mit Computer fest, Sofa, Sessel, Tisch, Teppich, Pflanzen umstellbar).
  Stile aus den Hütten-Bildern: Wiese, Wald, Savanne, Bambuswald, Dschungel, Eiswelt.

### Was mitzieht (Liste für die Umsetzung)

- **Computer**: steht dann im Innenraum. Mavis Aufgaben `babies` und `event` stehen bei `{ level: 'park', spot:
  'computer' }` → auf `{ level: 'house', spot: 'computer' }` umstellen (und `also` vor dem Haus, damit man sie findet).
- **Geschenk-Tafel** (`giftReady`: nur im Zentrum `park`) und Buden-Hinweis (`LEVEL_ID === 'park'`) prüfen.
- **Events-Knopf** (nur im Tierpark/Aquarium/Reptilienhaus, `home`): auch im Haus zeigen.
- **Roller**: im Haus steigt man ab (wie heute in Gebäuden), der Roller bleibt vor der Tür.
- **Haus im Park**: Die Fassade spiegelt, man sieht nicht hinein (geklärt 2026-11-24). Die heutigen Möbel im
  Park-Haus und das Durchsichtigwerden des Dachs beim Betreten entfallen: Im Park ist das Haus nur noch Fassade mit
  Tür (Ausgang ins Level `house`), die Kacheln innen werden gesperrt bzw. leer.
- **Bauen**: `DecorMode` sperrt heute alles in und an Gebäuden (`buildingAt(tx, ty, 1)`); im Haus-Level stattdessen
  nur Möbel zulassen, draußen weiter nur Deko.
- **Speicherstand**: `game.house = { owned, placed, shelves }` (wie `game.decor`), Startmöbel für neue und alte Stände.
- **Weltkarte/Auto**: das Haus ist kein Reiseziel (nur zu Fuß durch die Tür).

### Reihenfolge

1. Level `house` mit Tür hin und zurück, Computer umziehen, Mavi-Spots anpassen.
2. Möbel-Katalog und Setzen im Haus (DecorMode für Innenräume).
3. Vitrinen mit Trophäen-Auswahl.
4. Eigene Bilder: Trophäen, neue Möbel, Fassade.

## 6. Umsetzung (gebaut 2026-11-24, nicht committet)

- **Level `house`** (`src/world/levels.js`): Raum 14 × 10 (Karte 16 × 12), Gebäude `style: 'office'`, `noRoof`, Boden
  `floor_office`; hinten fest der Schreibtisch mit dem Hauptrechner (`computers`) und dem Bürostuhl. Ausgang unten (7–8/11)
  zurück vor die Tür (Park 29–30/17). Kein Auto, keine Besucher, leise Vogelstimmen. Ladepaket `farm`.
- **Park-Haus als Fassade**: `facade: true` am Gebäude (Dach bleibt zu, kein Durchsichtigwerden), Innenkacheln per `edits`
  mit `V` gesperrt, die alten Möbelzeichen sind weg; die Tür (29–30/38 der ganzen Karte) ist ein Ausgang ins Level `house`.
  `houseDoor` im Park für Mavis Pfeil.
- **Mavi**: `babies` und `event` stehen bei `{ level: 'park', spot: 'door' }` (vor der Tür) und `also: { level: 'house',
  spot: 'computer' }`. Im Zentrum zeigt der Pfeil zur Tür, im Haus zum Computer. `officeOpen`/`inOffice` entfallen.
- **Sonst**: Events-Knopf auch im Haus; ins Haus zu Fuß (`scooterRiding` aus, der Roller bleibt an seinem Platz);
  aus dem Haus zurück zählt nicht als Rückkehr aus einer Welt (`ROOM` in GardenScene).
- **Möbel** (`src/world/decor.js`): Möbel sind Deko mit `indoor: true` (eigene Zeichen ⑴ …), Stil-Gruppen
  `FURNITURE_STYLES` (Trophäen, Büro, Wiese, Wald, Savanne, Bambuswald, Dschungel, Eiswelt). Gespeichert wie die Deko in
  `game.decor` (`owned`, `placed.house`, je Möbel `rot`) statt einem eigenen `game.house`. Preise 20–300.
- **Bilder** (2026-11-24 neu, Andres alte Bilder ersetzt): `tools/furniture-sprites.py` zeichnet alle Möbel als
  isometrische Körper in 4-facher Auflösung (`fn_<id>_<Ansicht>`, Paket `house`), je Richtung ein eigenes Bild mit
  gleichem Licht (Stühle, Sofas, Schreibtische, Regale, Betten: 4 Ansichten; Hängematte, Teppich: 2; Pflanzen, runder
  Tisch, Sockel, Vitrine: 1). Fußpunkt genau in der Bildmitte; Größe, Fußpunkt und Trophäen-Plätze stehen in
  `src/world/furnitureArt.js`. Grundflächen: Sofa, Schreibtische, Regale 1 × 2, Betten 2 × 1, Teppich 2 × 2, sonst 1 × 1;
  „Drehen“ geht im Haus eine Vierteldrehung weiter (die Grundfläche dreht mit), draußen wird weiter gespiegelt.
- **Computer**: ein Möbel (`computer_desk`, `computer: true`); Events dort, wo er steht (`houseComputers`).
- **Grundausstattung** (neue Spielstände): der Computer steht schon, dazu 4 Möbel in der Bauen-Leiste (`HOUSE_KIT`: Sofa,
  Sessel, Tisch, Monstera). Ältere Stände behalten ihre aufgestellten Möbel bzw. bekommen einmal Computer mit Bürostuhl am
  alten Platz (`game.decor.houseComputer`). Beim ersten Besuch blinkt die Bauen-Taste, bis man sie drückt
  (`game.houseBuildSeen`).
- **Trophäen-Möbel**: Sockel (1 Trophäe, 60), Wandregal (4, 120), Vitrine (3, 150). Davor (nicht im Setzen-Modus) öffnet
  die Aktionstaste die Auswahl der erreichten Trophäen; gespeichert an der gesetzten Deko (`trophies: [Ids]`). Eine
  Trophäe steht nur an einem Platz; ist das Möbel voll, macht die zuerst gewählte Platz. Wandregal von hinten: keine
  Plaketten. Hebt man das Möbel auf, ist die Auswahl weg (die Trophäen bleiben im Tierbuch).
- **Vitrine/Wandregal** in zwei Ebenen (`fn_<id>_<Ansicht>_f` = Glas, Pfosten, Kanten über den Plaketten), Vitrine eine
  Trophäe je Etage. Hinweis: hat man eine erreichte Trophäe, die noch nirgends steht, blinkt über jedem Trophäen-Möbel mit
  freiem Platz ein rotes Dreieck (`updateShowcaseHints`). Cheat T: nächste Trophäe freischalten.
- **Große Stücke** (je 300–400 Herzen, im Katalog ihrer Gruppe): Aquarium bis zum Boden (Büro; Kopien der bis zu 5
  seltensten Angelfische aus allen Becken, die echten bleiben, `drawTankFish`), Kachelofen mit Ofenbank und Strickkorb
  (Wiese), Feldstein-Kamin mit Geweih (Wald), Trommelecke mit Fell und Kissen (Savanne), Zimmerbrunnen mit Bambusrohr
  (Bambuswald, plätschert: leises Flussrauschen je nach Abstand), Zimmerbaum mit Ara auf der Stange (Dschungel, ruft ab
  und zu), Iglu-Leseecke (Eiswelt).
- Bauen-Regeln: Aufheben nur mit gewählter Hand (nie mit einem Teil in der Hand). Teppiche liegen immer unten und
  belegen keine Kacheln (`isRug`, Bild-Schlüssel `rug:tx,ty`): Möbel stehen darauf, ein Teppich passt auch unter
  stehende Möbel (nicht zwei Teppiche übereinander); die Hand hebt zuerst das Möbel obendrauf auf.
- **Bauen mit der Maus** (PC): im Setzen-Modus folgt die Vorschau dem Mauszeiger, ein Klick setzt bzw. hebt auf, ohne
  Reichweite um Henrik (gilt auch draußen); läuft Henrik los, gilt wieder die Kachel vor ihm. Tablet: Antippen wie bisher
  (2 Kacheln um Henrik). Der Katalog springt nach dem Bestellen nicht mehr nach oben.
- Test: `node tools/screenshot.cjs --level house`; laufen mit `--key w:350` (Taste halten).

## 7. Offen

- Eigene Bilder: Trophäen (statt Plaketten), Fassade des Haupthauses.
- Neue Möbel: Aquarium mit gefangenen Fischen, Lampen, Bilderrahmen, Teppiche je Stil.
- Die Hütten in den Welten zeigen noch die alten Möbelbilder (hut_*).
- Im Katalog stehen die Möbel auf dem Gras-und-Himmel-Hintergrund der Deko.

## Offene Fragen

- Wie groß ist das Haus innen, reicht der Platz zum Einrichten, oder wird der Raum größer?
