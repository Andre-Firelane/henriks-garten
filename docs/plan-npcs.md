# Plan: NPCs, die Spielmechaniken erklären

Stand: 27.11.2026, noch nicht umgesetzt. Abschnitt 1 (Expeditionsleiter) mit Andre abgestimmt.

## Grundsätze

- **Keine Geschichten.** Keine Vorgeschichte, keine Gefühle, kein Drama. NPCs erklären nur, wie etwas geht.
- **NPCs bewegen sich nicht.** Sie stehen an einem festen Ort. Sie haben nur ein Standbild und die Animationen Stehen
  und Winken, wie Mavi (`mavi_idle`, `mavi_wave`).
- **Höchstens 2–3 Sprechblasen am Stück**, genau dann, wenn man es braucht.
- **Jede Erklärung kommt nur einmal von selbst.** Danach erklärt der NPC nur auf Wunsch: Wer ihn anspricht, wird
  gefragt „Soll ich dir nochmal erklären, wie es geht?“
- **Jeder NPC gehört zu einem Ort und einer Mechanik.**
- **Höchstens zwei neue NPCs**, damit die Welt nicht zu voll wird.
- Technik wie bei Mavi (src/npc/Mavi.js): spricht einen an, wenn man in die Nähe kommt und es etwas Neues gibt,
  Sprechblasen mit Seiten (ui/speech.js), winkt, wenn sie etwas zu sagen hat. Alle Texte zweisprachig über `tr()`.

## 1. Expeditionsleiter Mr. Nuggets (Andre, 27.11.2026)

Ein älterer Herr mit Tropenhelm, Monokel, weißem Bart, Rucksack und einer Karte in der Hand
(Sprites/Expeditionsleiter.webp). Er heißt in beiden Sprachen **Mr. Nuggets**.

### Wo er steht

- **In jedem Camp, bei jedem Besuch** (auch zwischen den Maps), in allen Welten. Sonst nirgends, nicht auf den Maps.
- Fester Platz **neben dem Wagen**: Dort passiert im Camp das Wichtigste, und dort ist man bei den meisten Erklärungen
  ohnehin.
- Dieselbe Figur im selben Outfit in allen Welten, auch in der Eiswelt (Andre, 27.11.2026: erstmal so).

### Tutorial der ersten Expedition

Kein langes Tutorial am Anfang, sondern kurze Schritte über die erste Expedition verteilt. Jeder Schritt kommt genau
dann, wenn sein Auslöser zum ersten Mal eintritt, mit höchstens 2–3 Blasen. Er winkt, solange ein Schritt offen ist.

| # | Auslöser | Inhalt (Kern) |
|---|---|---|
| 1 | Ankunft im ersten Camp | Eine Expedition führt durch mehrere kleine Gebiete. Am Ausgang wählst du, wohin es als Nächstes geht. |
| 2 | Erste Kartenwahl | Jede Karte zeigt, was dich dort erwartet: ein Tier, ein seltenes Tier, einen Bonus oder eine Kiste. **Empfehlung:** „Nimm für den Anfang die Tierkarte.“ |
| 3 | Erste Rückkehr ins Camp mit gefangenen Tieren | Bring deine Tiere zum Wagen. Jede Art bekommt einen eigenen Käfig. |
| 4 | Ein Käfig oder der Wagen ist zum ersten Mal voll | Wer nicht in den Wagen passt, wird am Ende ausgewildert. Das bringt Herzen. |
| 5 | Zweiter Camp-Besuch | Du kannst jederzeit mit dem Auto heimfahren. Verlieren kannst du nichts. |

- Schritt 2 erscheint als Blase über der Kartenauswahl (er selbst steht ja beim Wagen).

### Pfeile, auch in den Menüs (Andre, 27.11.2026)

Wie bei der Tierfreund-Aufgabe von Mavi: im Bild ein Pfeil über dem Ziel (wie Mavis `arrow`), in den Menüs der
`TUT_POINTER` am Knopf, den man drücken soll (wie im Schild-Menü, GardenScene `friendTutorial`). Der Pfeil bleibt, bis
der Schritt erledigt ist, und verschwindet dann.

| # | Pfeil im Bild | Pfeil im Menü |
|---|---|---|
| 1 | über dem Camp-Ausgang | – |
| 2 | – | Kartenauswahl: an der empfohlenen Tierkarte |
| 3 | über dem Wagen, solange Tiere hinterherlaufen | Wagen-Menü (ui/wagon.js): am ersten freien Käfig bzw. am Knopf zum Einladen |
| 4 | – | Wagen-Menü: am vollen Käfig, mit Hinweis auf das Antippen zum Tauschen |
| 5 | kurz über dem Auto | keiner: auf „Heimfahren“ zeigen wir nicht, sonst fährt man aus Versehen heim |

- Erst wenn das Menü offen ist, kommt der Pfeil darin. Der Pfeil im Bild verschwindet, solange das Menü offen ist.
- Beim Wiederholen auf Wunsch („nochmal erklären“) gibt es keine Pfeile, nur die Blasen.
- Was nur auf den Maps passiert (Zähler oben, Abschlusskiste), bleibt bei den kurzen Hinweisen wie bisher.
- Wird ein Schritt übersprungen (z. B. ohne Fang zurück ins Camp), kommt er beim nächsten passenden Anlass.

### Feste Karten bei der ersten Wahl (Andre, 27.11.2026: ja)

- Bei der allerersten Kartenwahl überhaupt liegen genau **eine Tierkarte, eine Bonus-Karte und eine Kiste** aus,
  damit man die Auswahl sieht und nicht zufällig dreimal dasselbe bekommt.
- Die Tierkarte zeigt eine **leicht zu fangende Art** der Welt (keine, die ein Event, die Nacht oder ein seltenes
  Merkmal braucht). Zu dieser Karte rät er in Schritt 2. So gibt es gleich am Anfang ein klares erstes Ziel.
- Keine seltene Karte und keine Event-Karte bei dieser ersten Wahl.

### Später

- **Erste Expedition in einer neuen Welt:** eine Blase dazu, was dort anders ist (Event-Karte wie Wolfsnacht oder
  Glühwürmchen-Abend; in der Eiswelt Tag und Nacht, ☀/🌙 auf den Karten).
- **Sonst:** Er steht da und winkt nicht. Spricht man ihn an: „Soll ich dir nochmal erklären, wie es geht?“ Bei Ja
  kommen die Schritte 1–5 hintereinander, kurz gefasst.

### Bilder

- Vorhanden: Standbild Sprites/Expeditionsleiter.webp (752 × 1394, weißer Hintergrund, muss noch freigestellt werden).
- Steh- und Wink-Animation wie bei Mavi (`mavi_idle`, `mavi_wave`) kommen später (Andre, 27.11.2026). Bis dahin
  das Standbild mit leichtem Wippen.

### Umsetzung (27.11.2026, nicht committet)

- **src/npc/Nuggets.js:** Figur (public/assets/nuggets.png, freigestellt aus Sprites/Expeditionsleiter.webp, wird mit
  den ersten Bildern geladen), Platz bei Kachel (11, 6) zwischen Zelt und Käfigen, atmet leicht als Platzhalter.
- **Schritte** in `game.guide.done` ('camp', 'cards', 'wagon', 'full', 'home'), Welten in `game.guide.biomes`. Alte
  Spielstände mit beendeter Expedition gelten als fertig (save.js), bekommen nur noch die Hinweise neuer Welten.
- **Ablauf beim Camp-Besuch** (arrive, aus expArriveCamp): camp → Welt-Hinweis → wagon (wenn Tiere mitkamen) → full
  (wenn jemand im Camp bleibt) → home (ab dem zweiten Camp oder nach wagon, nie im selben Besuch wie wagon). Solange er
  etwas sagt, fällt die bisherige Meldung am Rand weg. Im Ziel-Camp spricht er nicht von selbst (Abschlusskiste).
- **Wagen-Schritt im Text angepasst:** Die Tiere sitzen beim Ankommen schon in den Käfigen (wird automatisch
  einsortiert), man muss sie nicht hinbringen. Im Wagen-Menü zeigt der Pfeil auf „Fertig“ (wagon) bzw. auf das erste
  Tier, das im Camp bleibt (full).
- **Kartenwahl:** firstRunCards in expedition.js (Tier vorn, Bonus „Mehr Tiere“, Kiste; leichte Arten je Welt in
  FIRST_ANIMALS), Pfeil auf der Tierkarte, sein Satz darunter, kein Neu-Würfeln.
- **Sprechblasen** (ui/speech.js) können jetzt einen anderen Namen und Ja/Nein-Knöpfe (antippen: „nochmal erklären?“).
- Nebenbei: der Pfeil aufs Auto im Camp zeigte bisher aufs Lagerfeuer, jetzt über dem Autobild.

## 2. Eventuell: Verkäufer im Deko-Laden

- Steht im Haupthaus am Deko-Laden (siehe plan-deko.md).
- Beim ersten Besuch erklärt er: Hier kauft man Deko mit Herzen, gekauft landet sie in der Deko-Taste, mit der man sie
  im Tierpark setzt.
- Ob es ihn wirklich braucht, entscheiden wir, wenn der Deko-Laden gebaut wird. Sonst reicht ein kurzer Hinweis beim
  ersten Öffnen.

## Kein eigener NPC

- **Freundschaft und Futterhaus:** erklärt Mavi, sie ist ohnehin im Tierpark.
- **Besucherwünsche:** Der Besucher mit dem Wunsch erklärt sich selbst.

## Bilder

Je NPC: ein Standbild, eine Steh- und eine Wink-Animation. Keine Lauf-Animation.
