# Plan: Mehr Sammeln (Farbvarianten und Charakterzüge)

Ziel: Jeder Fang soll zählen. Mehr Varianten pro Tierart, ohne neue Bilder und ohne größeren Download.

## Teil 1: Farbvarianten durch gezieltes Umfärben

### Technik
- Kein `setTint` (das färbt alles und macht es verwaschen), sondern gezieltes Umfärben einzelner Bereiche.
- Gefärbt wird nur, was hell und fast farblos ist (beim Schaf die Wolle). Gesicht, Ohren, Beine, Hörner,
  Flecken, Halsband, Glocke und Konturen sind kräftiger gefärbt oder dunkler und bleiben original.
- Die Helligkeit jedes Wollpixels wird auf eine neue Farbskala (Schatten- bis Lichtfarbe) übertragen.
  So bleibt die Fellstruktur erhalten.
- Ein Spritesheet wird als Ganzes umgefärbt, alle Animationen sind sofort dabei (getestet: Standbild,
  Laufen, Fressen, Widder).
- Erzeugt wird beim Spielen im Browser (Canvas), erst wenn eine Variante zum ersten Mal gebraucht wird.
  Dadurch kommt **kein Byte Download dazu**. Dieselbe Erzeugung liefert das Bild fürs Tierbuch und die Kisten-Karte.
- Testskript (Python, gleiche Rechnung): `scratchpad/sheep/recolor4.py`, wird im Spiel als JS nachgebaut.
  Maske: Helligkeit (V) über ca. 0,48–0,64 weich ein, Sättigung (HSV) über 0,24–0,30 weich aus.
- Tiere, bei denen Fell und Gesicht denselben Ton haben (Fuchs, Löwe …), brauchen später eine gemalte
  Maske (ein Graustufenbild pro Sheet). Erst mal nur Tiere, bei denen die automatische Maske passt.

### Regeln
- **Nur natürliche Farben**, die es bei der Tierart wirklich gibt. Kein Rosa, Mint, Blau usw.
- Varianten laufen über die vorhandenen `share`-Gewichte in `SKINS` (wie bei den Fischen).
  Häufige Farben bekommen `common: true` (keine Meldung „seltenes …“).

### Seltenheitstabelle Schaf (Vorschlag)
Absteigende Wahrscheinlichkeiten statt gleich seltener Farben. So gibt es ein klares Ziel ganz oben.
Der gefleckte Widder bleibt wie heute bei ca. 10 % (Andre: seltener wäre zu selten),
die farbigen Widder kommen zusätzlich dazu. Als „selten“ gelten nur die Widder (Meldung, Wünsche, Event).

| Variante                  | Anteil | Meldung „selten“ |
|---------------------------|-------:|------------------|
| Weißes Schaf              | 42 %   | nein             |
| Graues Schaf              | 16 %   | nein             |
| Braunes Schaf (Moorit)    | 11 %   | nein             |
| Schoko-Schaf              | 7 %    | nein             |
| Schwarzes Schaf           | 5 %    | nein             |
| Gefleckter Widder (weiß)  | 10 %   | ja               |
| Grauer Widder             | 4 %    | ja               |
| Brauner Widder            | 3 %    | ja               |
| Schwarzer Widder          | 2 %    | ja (seltenstes)  |

Farbskalen aus dem Test (Schatten → Licht):
Grau (124,122,126)→(204,202,204), Moorit (128,80,52)→(204,156,116),
Schoko (80,54,40)→(152,114,88), Schwarz (44,40,44)→(116,110,114).

### Welche Arten bekommen Fellfarben?
Grundregel: Die seltene Variante muss klar erkennbar bleiben.

- **Gruppe A: Die seltene Variante hat eine andere Gestalt** (Widder mit Hörnern, Hirsch mit Geweih, langhaarige
  Katze, gefleckter Yak). Hier dürfen beide Stufen Farben bekommen, die Seltenheit erkennt man weiter an der Gestalt.
  Kandidaten: Schaf (gebaut), Reh/Hirsch, Katze, Yak (nur der helle gefleckte Yak, das dunkle Fell geht technisch nicht),
  Giraffe (Savanne: Fleckenfarbe hell/rotbraun wie bei der Netzgiraffe; die Schoko-Giraffe hat gar keine Flecken und bleibt
  erkennbar), Schlange (Dschungel: echte Farbformen der Kornnatter wie Amel, Anery, Snow, Karamell; die seltene grüne
  Baumschlange ist eine andere Form), Vogelspinne (Dschungel: braun, rotbraun, grau, kobaltblau wie die echte
  Kobaltblaue Vogelspinne; die Spinne ist fast einfarbig, daher wird sie ganz umgefärbt, nur die Augen bleiben; die
  seltene Goldene Vogelspinne hat eine andere Gestalt). Kein Gnu (zu speziell), kein Tapir.
- **Gruppe B: Die seltene Variante unterscheidet sich nur durch die Farbe** (Schwarzmähnen-Löwe, schwarzer Wolf,
  rotbrauner Elch, Silberfuchs). Wenn hier die normale Art Farben bekommt, verwässert das die seltene Variante.
  Also entweder gar nichts ändern oder höchstens eine Farbleiter, an deren Ende die bisherige seltene Farbe steht.
  Keine zweite Ausbaustufe.
- **Ohne Farben:** Tiere, deren Farbe ihr Merkmal ist (blauer Frosch, Ara, Tukan), und dunkles Fell (Yak, Brüllaffe,
  Gibbon, Wildschwein; die Konturen sind dort genauso dunkel wie das Fell).
- Flecken oder Muster lassen sich nicht erzeugen, die würden beim Laufen von Bild zu Bild springen. Sie gibt es nur
  mit eigenen Bildern.

### Seltenheitstabellen weiterer Arten (Vorschlag, Testbilder abgestimmt)
Die bisherige seltene Variante behält ungefähr ihren heutigen Anteil, die gefärbten seltenen kommen dazu.
Als „selten“ gilt nur die bisherige seltene Gestalt und ihre Farben.

| Katze | Anteil | | Reh / Hirsch | Anteil |
|---|---:|---|---|---:|
| rot getigert | 40 % | | Reh braun | 56 % |
| grau getigert | 16 % | | Reh dunkelbraun | 16 % |
| braun getigert | 12 % | | Reh hellbraun | 10 % |
| creme | 6 % | | Reh schwarz | 4 % |
| schwarz | 4 % | | **Hirsch** braun | 10 % |
| **Langhaarkatze** weiß | 12 % | | **Hirsch** dunkelbraun | 2 % |
| **Langhaarkatze** creme | 4 % | | **Hirsch** hellbraun | 1,5 % |
| **Langhaarkatze** blaugrau | 3 % | | **Hirsch** schwarz | 0,5 % |
| **Langhaarkatze** rot | 2 % | | | |
| **Langhaarkatze** schwarz | 1 % | | | |

| Giraffe | Anteil | | Yak | Anteil | | Schlange | Anteil |
|---|---:|---|---|---:|---|---|---:|
| Giraffe | 70 % | | Yak (dunkel, keine Farben) | 82 % | | orange | 55 % |
| Netzgiraffe | 20 % | | **gefleckter Yak** | 10 % | | Anery (grau) | 17 % |
| **Schoko-Giraffe** | 10 % | | **goldener Yak** | 4 % | | Karamell | 13 % |
| | | | **brauner Yak** | 2,5 % | | **grüne Baumschlange** | 15 % |
| | | | **grauer Yak** | 1,5 % | | | |

| Spinne (nach dem Tausch) | Anteil |
|---|---:|
| Spinne gold | 40 % |
| Spinne grün | 16 % |
| Spinne rotbraun | 12 % |
| Spinne braun | 10 % |
| Spinne hellgelb-weiß | 7 % |
| **Vogelspinne** schwarz | 8 % |
| **Vogelspinne** braun | 3 % |
| **Vogelspinne** rotbraun | 2 % |
| **Vogelspinne** grau | 1,2 % |
| **Vogelspinne** kobaltblau | 0,8 % |

Gestrichen nach den Testbildern: weißes Reh/weißer Hirsch, helle und weiße Giraffe, Schlange Snow und Amel.
Beim Einbau: sehr dunkle Stellen (Augen, Nase, Hufe) bleiben immer original.

### Offen / später
- Tierbuch: Silhouetten aller Varianten einer Art („3 von 9“), Sets mit Belohnung (z. B. alle Schaffarben → Deko).
- Babys erben mit einer gewissen Chance die Farbe eines Elternteils.
- Weitere Arten mit natürlichen Farben: Ziege, Huhn, Kaninchen, Kuh, Schwein, Pferd/Pony, Koi …
- Besucherwünsche nach seltenen Farben (wie die 60-Herzen-Wünsche).

## Teil 2: Charakterzüge (eigene Sitzung)

Jedes Tier bekommt beim Fangen zufällig einen Charakterzug. Er ist kein Wert, den man beobachten muss,
sondern löst sichtbare Aktionen mit Besuchern aus. Keine neuen Tier-Animationen, keine Geschicklichkeit.
Anzeige: kleines Symbol neben dem Namen und im Tierbuch.

| Charakterzug | Was passiert |
|--------------|--------------|
| Fotogen      | Ein Besucher bleibt stehen, das Tier posiert (stehen bleiben, zum Besucher drehen), der Besucher fotografiert mit kleinem Blitzlicht. |
| Schmusig     | Das Tier kommt zum Zaun und lässt sich von Besuchern streicheln (Herzchen). |
| Verspielt    | Das Tier macht vor einem Besucher einen Purzelbaum (Sprung mit Drehung des Bildes, keine neue Animation). |
| Verfressen   | Besucher füttern das Tier am Zaun. |

Offene Fragen: Gibt eine Aktion ein Herz extra? Wie oft (Abstand pro Tier)? Gibt es Wünsche nach Charakterzügen?
