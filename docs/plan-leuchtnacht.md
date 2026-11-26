# Plan: Leuchtnacht im Dschungel (Event mit Pfeilgiftfröschen)

Stand: 26.11.2026, **gebaut** (noch nicht committet), siehe „Umsetzung“ unten. Abgestimmt mit Andre: Event „Leuchtnacht“ im Dschungel, Pfeilgiftfrösche in bunten
Farben, die Frösche leuchten ein bisschen, im Tierpark hüpfen sie frei durch die Tropenhalle. Alles andere sind
Vorschläge (siehe „Noch offen“ unten).

## Was schon fertig ist

- **Bild:** `Sprites/Pfeilgiftfrosch.webp` (von Andre, blau mit dunklen Flecken), freigestellt mit
  `tools/dartfrog-cut.py` → `Sprites/Pfeilgiftfrosch.png` (weißer Hintergrund und blaugrauer Bodenschatten entfernt).
- **Spritesheet:** `public/assets/dartfrog.png`, 4 Ansichten à 56 × 52 wie `frog.png` (unten-rechts, unten-links,
  oben-rechts, oben-links), Fußlinie 48, sitzend 38 px hoch (etwas kleiner als der grüne Frosch mit 44).
  Neu bauen: `ONLY=dartfrog.png node tools/prepare-characters.js`.
- **Farben getestet** (Vorschau mit derselben Rechnung wie coats.js): Maske „alles Kräftige“ (Sättigung ab ca. 0,3),
  also Körper, dunkle Flecken und Kontur; die weißen Lichtpunkte in den Augen bleiben. Die Helligkeit geht auf eine
  Skala von fast schwarz bis zur Leuchtfarbe, so werden die Flecken schwarz und der Körper bunt.
  Noch keine Hüpf-Animation (wie anfangs beim blauen Frosch): bis dahin hüpft er mit dem Sitzbild (Frog.js hebt ihn an).

## Grundsätze

- Kein Geschick nötig, keine neuen anklickbaren Dinge (siehe Memory „Few interactive objects“).
- Pfeilgiftfrösche gibt es **nur** während des Events, wie Flamingo, Qualle und roter Panda.
- Kurze Meldungen (Handy), der lange Tipp steht im Tierbuch.

## Das Event

| | |
|---|---|
| id | `glownight` |
| Name | Leuchtnacht / Glowing Night |
| Gebiet | `jungle` (EVENT_AREAS), auf der Weltkarte leuchtet das Dschungel-Schild |
| Preis | 100 Herzen (wie die anderen Events mit neuem Tier) |
| Dauer / Pause | 5 Minuten / 5 Minuten |
| Text | „5 Minuten lang ist Nacht im Dschungel: Pilze und Blätter leuchten, bunte Pfeilgiftfrösche sitzen am Wasser. Sie sind giftig – fang sie mit dem Glas!“ |

**Stimmung** (eigene Klasse `GlowNight`, gebaut wie `FireflyEvening` in Fireflies.js: eine Überlagerung über der
laufenden Map, nichts wird neu geladen):
- Dunkles Nachtblau-Grün über der Map (NIGHT_DEPTH), dunkler als die Dämmerung im Bambuswald.
- Leuchtende Pilze und Blätter: kleine türkis-grüne Lichtflecken am Boden unter Büschen, an Baumstämmen und am
  Flussufer, die langsam pulsieren. Nur Bild, nicht anklickbar.
- Am Wasser ein paar Glühpunkte auf der Oberfläche, sonst bleibt der Dschungel, wie er ist.
- Die anderen Dschungeltiere bleiben da (keine Wetteränderung).

## Die Frösche

- **Wo:** 8 gleichzeitig, am Flussufer, an den Futtersträuchern und im Dickicht (Bodenkacheln neben Wasser oder
  Büschen). Ein gefangener Frosch kommt nach ein paar Sekunden woanders neu hinzu.
- **Bewegung:** wie der grüne Frosch (Frog.js): hüpft auf einem kleinen Kreis um seinen Platz und dreht vor Wasser
  oder Hindernissen um. Neue Art `dartfrog` als Unterklasse oder eigener Eintrag in HOP_SHEETS.
- **Leuchten:** ein weicher Lichthof in der Farbe des Frosches (additiv gemischt, Bild zur Laufzeit aus der
  Silhouette erzeugt, kein extra Download), pulsiert langsam. In der Nacht findet man sie daran; bei Tageslicht
  (Tropenhalle) nur ein ganz leichter Schimmer.
- **Fangen:** Pfeilgiftfrösche sind giftig, darum nicht mit der Hand. Beim Event liegt ein **Glas** im Sack (wie das
  Quallenglas im Riff). Damit über den Frosch schwingen, dann ist er gefangen. Anders als bei der Qualle gibt es
  keinen falschen Moment, jeder Schwung über einem Frosch fängt ihn.
  Läuft man ohne Glas hin: kurze Meldung „Giftig! Nimm das Glas.“ (ohne Strafe, wie bei der Qualle).
- **Tierbuch:** neue Art mit Tipp (lang) und CATCH_TIPS_SHORT (kurz), dazu ein Satz zur echten Art: Die Farben warnen
  Feinde, und im Zoo sind sie ungiftig, weil das Gift aus ihrem Futter in freier Natur kommt.

## Farben (über coats.js, wie Schaf, Katze, Spinne)

Ein Bild, im Spiel umgefärbt (`G.dartfrog`, Maske Sättigung ab ca. 0,3). Getestete Farbskalen [Schatten, Licht]:

| id | Name | Skala | Anteil (Vorschlag) |
|---|---|---|---|
| `dartfrog` (Grundbild) | blauer Pfeilgiftfrosch | unverändert | 30 |
| `dartfrog_yellow` | gelber Pfeilgiftfrosch | [24,20,10] → [255,226,60] | 25 |
| `dartfrog_green` | grüner Pfeilgiftfrosch | [10,30,18] → [120,236,120] | 20 |
| `dartfrog_orange` | orangener Pfeilgiftfrosch | [40,14,4] → [255,150,40] | 15 |
| `dartfrog_red` | Erdbeerfröschchen (rot) | [40,6,8] → [255,80,56] | 10 (selten) |

Alle Farben gibt es bei echten Pfeilgiftfröschen. Der gelbe Bauch wirkt in der Vorschau noch etwas oliv, das stimme
ich im Spiel noch ab. Der Lichthof nimmt die Lichtfarbe der Skala.

## Im Tierpark: frei in der Tropenhalle

- Gefangene Pfeilgiftfrösche kommen in die Tropenhalle (park3, JungleHall.js) und hüpfen dort **frei** herum, wie die
  Vögel in der Polarhalle frei fliegen (hallFlight.js). Neu: `hallHop`, das sie von Platz zu Platz in der Halle
  hüpfen lässt (Boden neben Pflanzen und Wasser, nicht auf den Wegen, keine Terrarien).
- Leichter Schimmer, beim Sprühnebel hüpfen sie öfter (Frösche mögen Regen).
- Kein Futter am Gehege (wie beim grünen Frosch, NO_PEN_FEED).

## Bauschritte

1. Event in events.js (+ EVENT_AREAS, EVENT_SPECIES, Symbol, Start-Meldung) und Glas im Sack beim Event.
2. `GlowNight`: Nacht, leuchtende Pilze und Blätter.
3. Art `dartfrog`: Laden (BootScene), Animal.js-Eintrag, Hüpfen, Lichthof, Fangen nur mit dem Glas, Tierbuch.
4. Farben in coats.js.
5. Tropenhalle: freies Hüpfen in der Halle.
6. **Erledigt 26.11.2026:** `dartfrog_walk` (32 Bilder, Loop 27–58), `dartfrog_walk_back` (39, Loop 48–86),
   `dartfrog_idle`, `dartfrog_idle_back` (je 49, ganzes Video, jedes 2. Bild), 56 × 60, Fußlinie 56, Maßstab 0,113
   (sitzend so groß wie dartfrog.png). Der Frosch krabbelt in den Videos eher als zu hüpfen: Er bewegt sich also wie
   die anderen Tiere mit Lauf-Animation, nicht mit den Sprung-Bildern aus Frog.js. Alle Farben im Test umgefärbt
   (Vorschau tools/shots/dartfrog_anim_colors.png), sie sehen bei Laufen und Stehen gleich aus.
   Ursprünglicher Plan: Andre macht sie aus den Einzelansichten `Tiersprites Test/Pfeilgiftfrosch_vorne.png` und
   `_hinten.png` (freigestellt, volle Größe, exportiert 26.11.2026). Daraus Spritesheets wie beim grünen Frosch
   (`dartfrog_hop`, `dartfrog_hop_back`, evtl. `dartfrog_idle`), die dann in alle Farben umgefärbt werden (in
   coats.js als weitere Bilder der Gruppe, SHEETS.dartfrog).

## Noch offen

- Preis 100 Herzen und 8 Frösche gleichzeitig: passt das?
- Soll das Erdbeerfröschchen die seltene Farbe sein? Als echte Besonderheit ginge ein eigenes Bild (rot mit blauen
  Beinen), das kann die Farb-Technik nicht.
- Leuchtnacht auch als Event-Karte in der Dschungel-Expedition?

## Umsetzung (26.11.2026)

- **Event:** `glownight` in events.js (100 Herzen, 5 + 5 Minuten, nur `jungle`), Event-Ruf aus der Kiste (LEVEL_EVENT),
  Karte im Events-Fenster (eventsPanel.js), Start- und Endmeldung, Abendgeräusche (ambient_forest_night).
- **Nacht:** `src/world/GlowNight.js`: Nachtblau (Deckkraft 0,72), 120 Pilzgruppen neben Pflanzen, aber nie hinter
  Bäumen oder Büschen (sonst schienen sie auf den Kronen zu liegen).
- **Frösche:** `src/animals/DartFrog.js`, Art `dartfrog` in Animal.js (krabbelt langsam an der Leine, flieht nicht).
  In der Nacht wird der Frosch über der Dunkelheit gezeichnet (leicht abgedunkelt) und hat einen Lichthof in seiner
  Farbe; tagsüber nur ein schwacher Schimmer. `GardenScene.updateGlowNight`: 8 gleichzeitig, beim Ankommen alle,
  danach alle 4–8 Sekunden einer nach. Plätze am Wasser, vor denen nichts Hohes steht (`dartFrogTiles`), nicht am
  Wasserflugzeug. Nach dem Event verschwinden die wilden Frösche, das Froschglas kommt aus der Hand.
- **Fangen:** Werkzeug `frogjar` (Froschglas, geschwungen wie der Kescher), liegt während der Leuchtnacht in allen
  Kisten des Dschungels. Ohne Glas nah heran: Meldung „Giftig! Nimm das Froschglas aus der Kiste.“ (höchstens alle 15 s).
- **Farben:** coats.js `G.dartfrog` / `COATS.dartfrog` wie oben; Blau baseShare 30, Rot ist die seltene Farbe.
- **Tierpark:** `dartfrog` im offenen Gehege `junglehall` (Kontingent 12), krabbeln frei durch die Halle. Erster Fang:
  Meldung „Erster Pfeilgiftfrosch! Er hüpft frei in der Tropenhalle herum.“
- **Sonst:** Tierbuch-Tipp (lang und kurz), Fußspur-Text, Besucher-Anziehung 3, Wünsche, Futter (Fischfutter), Ruf wie der
  Frosch, Icon.
- Getestet mit tools/screenshot.cjs: Nacht und Pilze, Lichthof, Giftig-Hinweis, Fangen mit dem Glas, alle Farben in der
  Halle, Event-Karte. Nicht getestet: Ende des Events, Speichern und Laden mit Fröschen in der Halle, Tablet-Leistung
  (120 Pilzgruppen, je bis zu 4 Bilder).
- **Bewegung (Nachtrag):** Der Frosch macht Schritte wie der grüne Frosch, statt gleichmäßig zu laufen. Ein Schritt ist ein
  Durchlauf der Lauf-Animation (36 Bilder/s), vorwärts nur beim Abstoßen (vorne Bild 9–20, hinten 10–18, gemessen an
  der Breite der Figur), sonst steht er; 1–3 Schritte, dann Pause. Beim Folgen läuft er normal mit.
- **Expedition (26.11.2026):** Event-Karte „Leuchtnacht“ auf der Flussbiegung `jx_bend` (`glowNight: true`), MAP_EVENTS
  `glowNight: { species: 'dartfrog', units: 4, alone: true }`: nur Pfeilgiftfrösche auf der Tierliste, Froschglas kommt
  über die Tierliste in die Kiste (expTools). Frösche kommen über updateGlowNight (CALLED_UNITS), so viele wie frei sind.
  Kartenbild im Camp. Plätze für Frösche und Pilze: nichts Hohes bis 4 Kacheln davor (FRONT/isTall in GlowNight.js,
  Wasser zählt nicht), sonst lagen sie auf den Kronen der Urwaldbäume.
