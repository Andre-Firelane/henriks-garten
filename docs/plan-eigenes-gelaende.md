# Plan: Eigenes Gelände

Stand: 2026-11-24, nur Plan, Umsetzung in einer eigenen Sitzung.

## Ziel

Ein großer Ort, an dem man Herzen ausgeben kann, ohne dass Neulingen etwas fehlt. Der normale Tierpark bleibt, wie er ist
(alle Gehege sind von Anfang an da). Das eigene Gelände kommt **dazu**: ein ruhiger Bereich, den man selbst gestaltet.

## Grundregeln

- **Eigener, abgegrenzter Bereich**, ein eigenes Level wie `park2`/`park3` (z. B. `park4` / „Mein Gelände“). Die
  bestehenden Parkabschnitte werden nicht angefasst, nur ein Durchgang bzw. ein Wegweiser und das Auto führen hin.
- **Keine Besucher.** Das Gelände ist ruhig: keine Besucher, keine Buden, keine Herzen von dort.
- **Feste Grundrisse.** Auf dem Gelände liegen leere Bauplätze mit festem Umriss (Zaunlinie, Größe, Tor). Man baut
  nichts frei, sondern besetzt einen Bauplatz.
- **Tierart beim Bauen wählen.** Am Bauplatz öffnet sich eine Tafel: „Hier baue ich ein Gehege für …“. Angeboten werden
  die Gehege-Gruppen aus dem Tierpark, z. B. *Streichelzoo (Schafe, Kühe, Schweine, Ziegen)*, *Pandas & Rote Pandas*,
  *Tiger*. Ein Gehegetyp muss also nicht eigens gewählt werden: Boden, Wasser, Ausstattung und Zaun kommen von der
  gewählten Gruppe (dieselben Angaben wie das Vorbild im Park: `ground`, `water`, Ausstattung aus `PARK_PENS`).
- **Nur Arten, die man schon hat**: Angeboten werden Gruppen, von denen man mindestens eine Art gefangen hat.
- **Steigende Preise**: jeder weitere Bauplatz kostet mehr (Vorschlag 300 → 600 → 1000 → 1500 …, mit Sparschwein billiger
  über `price()`).
- **Kein Umziehen, kein Umwidmen**, solange Tiere darin sind. Ein leeres eigenes Gehege darf man abreißen bzw. neu
  belegen (Vorschlag: kostenlos, Herzen gibt es keine zurück).

## Wie die Tiere hinkommen (Überlauf)

Heute: Ist ein Gehege im Park voll, zieht beim Abgeben ein Tier ins Naturreservat (`releaseHearts`, Hinweis 🌳 beim
Fangen, siehe `catchAnimal` und `moveFollowersIntoPens` in GardenScene).

Neu:
1. Ein gefangenes Tier zieht wie bisher zuerst in sein Gehege im Park.
2. Ist das voll und gibt es auf dem eigenen Gelände ein Gehege für diese Art mit freiem Platz, zieht es **dort** ein.
3. Erst wenn auch das voll ist (oder es keins gibt), geht es wie bisher ins Naturreservat.

- Hinweis beim Fangen anpassen: „Das Gehege ist voll – es zieht auf dein Gelände.“ statt Naturreservat.
- Gibt es noch kein passendes eigenes Gehege, einmalig der kurze Hinweis „Auf deinem Gelände ist noch Platz.“
- Seltene Fellfarben ziehen genauso mit.
- Tiere werden nie zwischen Park und Gelände verschoben, auch nicht automatisch, wenn im Park wieder Platz wird.

## Was auf dem Gelände geht

- Tiere ansehen, streicheln, füttern, Tierfreunde und Namen wie im Park (Bedürfnis-Blasen, siehe plan-freundschaft.md).
- Gestalten mit dem bestehenden **Bauen** (Katalog, Baupläne, freies Setzen, siehe plan-deko.md), aber ohne Buden.
- Futterautomat(en) wie im Park.
- Keine Events auf dem Gelände (Tierbabys vorerst nicht; später überlegen).

## Offene Fragen für die Umsetzung

- Wie viele Bauplätze, wie groß, und wo liegt das Gelände (eigener Abschnitt mit Auto-Schnellreise, oder Durchgang aus
  dem Zentrum)?
- Gibt es verschiedene Größen der Grundrisse (klein/groß), und darf jede Gruppe auf jede Größe?
- Aquarium-Becken und Terrarien (Reptilienhaus, Tropenhalle) auf dem Gelände: vorerst **nicht**, nur Außengehege.
  Später evtl. ein eigenes kleines Haus mit Becken.
- Zählen Tiere auf dem Gelände für Tierbuch/Erfolge mit? (Vorschlag: ja, für Fänge sowieso; „Gehege voll“-Erfolg nur im
  Park.)
- Speicherstand: eigene Gehege als Liste `game.ownPens = [{ slot, group }]`, die Tiere wie bisher mit ihrem Gehege.

## Reihenfolge

1. Level mit leeren Bauplätzen (Karte, Zugang, Auto).
2. Bauplatz-Tafel: Gruppe wählen, Gehege entsteht nach dem Vorbild im Park.
3. Überlauf beim Abgeben + Hinweise.
4. Bauen/Deko auf dem Gelände freischalten.
