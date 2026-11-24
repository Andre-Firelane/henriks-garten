# Plan: Haupthaus (Einrichten und Trophäen)

Stand: 2026-11-24, Plan. Die Trophäenliste ist ein Vorschlag und muss noch abgestimmt werden.

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

## 6. Start für die neue Sitzung

Stand 2026-11-24 (nicht committet, auf Andres GO warten): Reittiere, Roller, Stall, Mavi-Aufgabe `stable`, Trophäen
(`src/world/trophies.js`, Tierbuch-Reiter mit Fortschritt, Statistik) sind gebaut. Das Haupthaus noch nicht.

Vorgehen (je Schritt testen, Screenshots mit `node tools/screenshot.cjs`, nur ein Test gleichzeitig):

1. **Level `house` anlegen** (`src/world/levels.js`, wie `aquarium`): Zeilen für einen Raum ca. 14 × 10, Gebäude
   `style: 'office'`, `noRoof: true`, Boden `floor_office`; Ausgang unten zur Tür des Park-Hauses (`to: 'park'`,
   `arrive` vor der Tür ca. 29/40); Startpunkt hinter der Tür. Kein Auto, keine Weltkarte, keine Besucher.
2. **Park-Haus zur Fassade machen**: Kacheln 26–32/32–37 leeren und sperren, Tür (29–30/38) als Ausgang ins Level
   `house`; Dach nicht mehr durchsichtig. `computers` aus dem Park entfernen.
3. **Computer und Startmöbel** im Haus: `computers` im Level `house`; Startmöbel wie heute (Schreibtisch mit Computer
   fest; Sofa, Sessel, Tisch, Teppich, 2 Pflanzen) zunächst als Kartenzeichen.
4. **Alles, was am Haus hängt, nachziehen** (Liste in Abschnitt 5): Mavi `babies`/`event` → `{ level: 'house', spot:
   'computer' }` (`also` vor der Tür), `giftReady`, Events-Knopf (`home`), Roller (absteigen vor der Tür),
   `isPark`-Abfragen prüfen (das Haus zählt nicht als Tierpark-Abschnitt für Besucher/Gehege), Spielstand
   (`game.levels.house`), Ladepakete in BootScene.
5. **Möbel-Katalog**: in `decor.js` Möbel mit `indoor: true` (Hütten-Bilder je Stil + Büromöbel), Katalog im Haus nur
   Möbel, draußen nur Deko; `DecorMode` im Haus innerhalb des Raums erlauben. Startmöbel werden setzbare Möbel.
6. **Vitrinen**: Vitrine, Wandregal, Sockel (Platzhalter-Bilder) im Möbel-Katalog; davor Aktionstaste → Auswahl der
   erreichten Trophäen (`game.house.shelves`), die Plaketten (`trophyBadge`) erscheinen darauf.
7. Plan, Gedächtnis, Commit erst nach GO.

## Offene Fragen

- Wie groß ist das Haus innen, reicht der Platz zum Einrichten, oder wird der Raum größer?
