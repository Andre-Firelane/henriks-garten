# Plan: Freundschaft mit Tieren im Tierpark

Stand: 20.11.2026, noch nicht umgesetzt.

## Ziel

Eine Cozy-Mechanik, mit der man sich an ein einzelnes Tier bindet, für Kinder und Erwachsene. Man gibt einem Tier im
Gehege einen Namen, streichelt es und füttert es mit seinem Lieblingsfutter. So steigt die Bindung über mehrere Stufen.

## Grundsätze

- **Keine neuen Animationen.** Alle Reaktionen entstehen im Code: Tweens auf Position, Skalierung und Spiegelung,
  dazu Herzen als Partikel, der vorhandene Herzregen und die vorhandenen Tierrufe. Pro Tierart kommt nur ein Eintrag
  in der Tierliste dazu (passende Futtersorten, eventuell die Höhe des Namensschilds).
- **Keine zweite Währung.** Die Bindung belohnt sich selbst und bringt über die Besucher mehr normale Herzen.
- **Keine Geschenke** von Tieren.
- **Keine Geschicklichkeit.** Alles klappt beim Drücken der Aktionstaste.
- Nur Tiere in den Gehegen des Tierparks (Aquarium und Reptilienhaus vorerst nicht).

## Benennen

- **1 benanntes Tier pro Gehege.** Damit wird es nicht zu voll.
- Das geschieht am **Gehegeschild**, nicht am Tier. Steht Henrik am Schild, erscheint die Tafel (`updateSign` in
  GardenScene). Mit der Aktionstaste öffnet man dort heute den Gehegeausbau. Neu kommt dort ein zweiter Knopf
  dazu: **„Freund benennen“**.
- Ablauf:
  1. Ein Tier auswählen. Gleiche Tiere stehen nur einmal in der Liste („Schaf“, „Gefleckter Widder“). Welches Schaf es
     wird, ist egal. Seltene Varianten lassen sich so gezielt wählen.
  2. Einen Namen eingeben oder auf den **Würfel** tippen, der passende Namen vorschlägt (Liste je Tierart, Deutsch und
     Englisch). Das ist wichtig fürs Tablet, weil Henrik nicht gut tippen kann.
  3. Der Name steht ab jetzt **dauerhaft über dem Tier**, in kleiner, ruhiger Schrift mit den Bindungsherzen daneben.
     Er steht auch oben auf der Tafel am Gehegeschild.
- **Umbenennen** geht jederzeit am Schild, die Bindung bleibt.
- **Ein anderes Tier wählen** geht nach einer Rückfrage. Die Bindung des alten Tiers bleibt gespeichert und gilt wieder,
  wenn man es später erneut wählt.

## Streicheln und Füttern

Beides passiert am Zaun mit der Aktionstaste, je nachdem, was Henrik in der Hand hat:

| In der Hand | Wirkung |
|---|---|
| nichts, benanntes Tier in der Nähe | streicheln |
| Futter aus dem Futterhaus | benanntes Tier aus der Hand füttern |
| Futtersack aus dem Futterautomaten | wie bisher ins Gehege werfen, alle fressen (`feedPen`) |

Ab Bindungsstufe 2 kommt das Tier von selbst zum Zaun, man muss es also kaum suchen.

### Reaktionen (nur Code)

| Moment | Was passiert |
|---|---|
| Streicheln | Henrik streckt die Hand hin und wackelt damit (wie beim Bürsten, siehe `BrushTool.scrub`). Das Tier bleibt stehen, dreht sich zu ihm, sackt kurz zusammen (breiter und flacher), ein Herz steigt auf. |
| Passendes Futter | ein kleiner Hüpfer und ein Herz |
| Lieblingsfutter | 2–3 Freudenhüpfer, der Herzregen und der Tierruf |
| Zufrieden (höhere Stufe) | Die Steh-Animation läuft etwas langsamer |

### Pause statt Tageslimit

- **20 Minuten Pause**, getrennt für Streicheln und Füttern.
- Die Pause läuft in echter Zeit (`Date.now()`) und steht im Spielstand. Sie läuft also auch weiter, wenn das Spiel
  geschlossen ist, und neu laden setzt sie nicht zurück.
- Kommt man zu früh, dreht sich das Tier kurz weg, und es erscheint eine Meldung. Es gibt keine Bindung, aber auch
  keinen Abzug:
  - Streicheln: „Lotta möchte gerade nicht gestreichelt werden. Versuch es später noch einmal.“
  - Füttern: „Lotta ist satt. Versuch es später noch einmal.“
- **Keine Restzeit anzeigen.** Stattdessen steht auf der Tafel am Gehegeschild „Lotta freut sich über Besuch“,
  sobald beides wieder geht.

## Futterhaus

- Der vorhandene **Futterautomat** im Tierpark wird zum Futterhaus. Dort liegt alles fertig: Man wählt eine Sorte und
  hat sie in der Hand. Es gibt nichts zu sammeln und keinen Vorrat. Der Futtersack zum Werfen bleibt zusätzlich.
- Die Sorten gibt es fast alle schon in der Wildnis: Grünfutter, Eicheln, Bananen, Blätter, Knochen, Hering und
  Fischfutter. Dazu kommen ein, zwei neue (zum Beispiel Möhren und Beeren).
- **Das Angebot wächst:** Eine Sorte liegt erst dann im Futterhaus, wenn man sie draußen einmal benutzt hat (zum
  Beispiel Eicheln von der Eiche geschüttelt). Das verbindet Wildnis und Tierpark, ohne dass man Futter durch die
  Welten trägt.
- Was zum benannten Tier gar nicht passt, ist im Futterhaus ausgegraut. Henrik kann also nichts Unpassendes
  verfüttern.

## Lieblingsfutter

- Jede Tierart hat **2–3 passende Sorten** (zum Beispiel das Schaf Grünfutter, Möhren und Beeren).
- Beim Benennen bekommt das Tier **zufällig eine davon** als Lieblingsfutter. Das Ausprobieren lohnt sich also.
- Ist es entdeckt, steht es auf der Tafel am Gehegeschild und später im Tierbuch.

## Bindung

| Aktion | Punkte |
|---|---|
| Streicheln | 1 |
| Passendes Futter | 1 |
| Lieblingsfutter | 3 |

| Stufe | ab Punkten | Belohnung |
|---|---|---|
| 1 | 0 | Name über dem Tier |
| 2 | 4 | kommt zum Zaun, wenn Henrik in der Nähe ist |
| 3 | 12 | Besucher nennen den Namen in ihrer Sprechblase („Guck mal, da ist Lotta!“) und geben mehr Herzen |
| 4 | 24 | folgt Henrik ein Stück am Zaun entlang, wenn er vorbeigeht |
| 5 | 40 | goldenes Namensschild, Eintrag im Tierbuch („Lotta, seit 20. November bei dir, mag Eicheln“) |

Alle 20 Minuten gibt es höchstens 4 Punkte. Stufe 2 erreicht man also schon beim ersten Besuch, Stufe 5 nach etwa
10 Besuchen.

## Technik

- Bisher speichert das Spiel Arten, keine einzelnen Tiere. Jedes Tier im Tierpark braucht deshalb eine **feste
  Nummer im Spielstand**. Ältere Spielstände bekommen diese Nummern beim Laden (wie `splitPark` in save.js).
- Neuer Teil im Spielstand, zum Beispiel:
  ```js
  friends: {
    pasture: { animalId: 17 },            // benanntes Tier je Gehege
  },
  bonds: {
    17: { name: 'Lotta', points: 13, favorite: 'acorn', favoriteKnown: true,
          pettedAt: 0, fedAt: 0, since: '2026-11-20' },
  },
  feedUnlocked: ['greens', 'acorn'],      // Sorten im Futterhaus
  ```
- Was passiert, wenn das benannte Tier das Gehege verlässt (zum Beispiel entlaufene Pandas, Tier zurückgegeben),
  muss beim Umsetzen geklärt werden. Die Bindung bleibt am Tier hängen.
- Alle Texte zweisprachig über `tr()`.

## Umsetzung in zwei Schritten

1. **Benennen, Namensschild, Streicheln, Pause und Stufen.** Dazu feste Nummern für die Tiere und Umzug alter Spielstände.
2. **Futterhaus und Lieblingsfutter.** Futterhaus am Futterautomaten, wachsendes Angebot, Füttern aus der Hand.

Jeder Schritt wird auf dem Testport geprüft. Der Tablet-Server bleibt unberührt, und es wird erst nach „GO“
committet.
