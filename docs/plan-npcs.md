# Plan: NPCs, die Spielmechaniken erklären

Stand: 20.11.2026, noch nicht umgesetzt.

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

## 1. Expeditions-Führerin

- Sie **steht im ersten Camp** jeder Expedition und an keinem anderen Ort.
- **Erste Expedition überhaupt:** Sie spricht Henrik an, sobald er im ersten Camp ankommt, und erklärt in 2–3 Blasen:
  - Man reist über mehrere kleine Maps, und vor jeder Map wählt man eine Karte.
  - Gefangene Tiere kommen im Camp in den Wagen.
  - Verlieren kann man nicht, man kann jederzeit heimfahren.
- **Erste Expedition in einer neuen Welt:** Sie erklärt kurz, was es dort Besonderes gibt, zum Beispiel die Event-Karte
  (Wolfsnacht im Wald, Glühwürmchen-Abend im Bambuswald).
- **Sonst:** Sie steht da und erklärt nur auf Wunsch.
- Was erst später im Ablauf vorkommt (Wagen beim zweiten Camp, Abschlusskiste), erklärt sie nicht. Dafür reicht
  bei Bedarf ein kurzer Hinweis wie bisher.
- **Aussehen:** noch offen (zum Beispiel Rangerin mit Hut und Rucksack).

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
