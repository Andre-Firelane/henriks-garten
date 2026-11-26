# Plan: Eiswelt-Expedition (und Durchgänge der Eiswelt)

Stand: 26.11.2026, Entwurf, noch nichts gebaut; erste Punkte mit Andre abgestimmt (siehe „Entschieden“ ganz unten). Vorschläge sind als solche markiert,
offene Fragen stehen unter „Noch offen“ ganz unten. Ersetzt den kurzen Abschnitt „Expedition“ in plan-eiswelt.md
(der war vom 23.11. und passt nicht mehr zu den Fang-Mechaniken vom 24.11.).

## Ausgangslage

- Expeditionen gibt es für Savanne, Dschungel, Bambuswald und Wald (src/world/expedition.js, expeditionMaps.js). Ein Run
  hat RUN_LENGTH = 4 Maps, dazwischen das Camp mit der Wahl aus 3 Karten (Tier, seltenes Tier, Bonus, Kiste, Event),
  Wagen mit Käfigen, am Ende die Abschlusskiste. Verlieren kann man nicht.
- Die Eiswelt hat alle Tiere und Mechaniken (Schritt 1 bis 4 aus plan-eiswelt.md). Schritt 5 („Expeditionen und
  Durchgänge zum Schluss“) fehlt noch.
- Die Eiswelt kennt Tag und Nacht als „Wetter“ (`seasons: { day, night }` in levels.js). Das passt direkt in die
  Expedition: Dort würfelt jede Map ihr Wetter (planMap), hier eben **Tag oder Nacht**. Es gibt keinen Wechsel
  während einer Map.

## Grundsätze (wie in der ganzen Eiswelt)

- Keine Geschicklichkeit, Ränder sperren, man fällt nie ins Wasser.
- Jede Art fängt man auf der kleinen Map mit **derselben** Mechanik wie auf der großen Karte. Die Merkmale der Map
  (`features`) sorgen dafür, dass alles da ist, was die Mechanik braucht.
- Keine neuen anklickbaren Dinge auf den Maps außer dem, was die Mechaniken ohnehin haben (Eislöcher, Blubberstellen,
  Hasenlöcher).

## Tiere: Regeln für `SPECIES_RULES.ice`

`BIOME_SEASONS.ice = ['day', 'night']`. Was eine Mechanik auf der Map braucht, steht als `needs`.

| Tier | needs | Tag/Nacht | units | Was die Map dafür braucht |
|---|---|---|---|---|
| Pinguin | – | beide | 1–2, `plain` | Wasser (tagsüber), Eislöcher (nachts) |
| Robbe | – | beide | 1–2, `plain` | Wasser am Ufer |
| Schneehase | `tundra` | **nur Tag** | 1–2, `plain` | Tundra-Boden für den Bau mit 2–3 Löchern |
| Rentier | `tundra` | **nur Tag** | 2–3 (Herde, ein Tier = eine Einheit wie beim Yak) | genug Tundra für einen Rundweg |
| Polarfuchs | `tundra` | beide | 1 | Tundra, Felsen/Tannen für die Spur (VIA_CHARS) |
| Polarwolf | `tundra` | beide | 2–3 (ein Rudel, ein Tier = eine Einheit) | freie Tundra fürs Rudel |
| Walross | `beach` | beide | 1–2 | Kiesstrand mit Blubberstellen (tagsüber), Eislöcher (nachts) |
| Papageitaucher | `birdrocks` | **nur Tag** | 1–2 | Schneefelsen (Ɵ) direkt am Ufer |
| Eisbär | `sea` | **nur Nacht** | 1 | zugefrorenes Meer mit mindestens 2 Eislöchern |
| Schneeeule | `taiga` | **nur Nacht** | 1 | verschneite Tannen (Ṗ), in denen sie sitzt |

Änderungen gegenüber plan-eiswelt.md: Hase und Rentier nur tagsüber (wie auf der großen Karte seit 24.11.); die Eule
braucht `taiga`, weil sie nur in Tannen sitzt.

**Einzelgänger:** Eisbär und Fuchs sind höchstens einmal je Map da (wie Schneeleopard und Jaguar), planMap füllt sie
nicht auf.

## Merkmale (`features`)

| Merkmal | Inhalt der Map | Tag | Nacht |
|---|---|---|---|
| `sea` | Meer am Rand der Map | offenes Wasser, treibende Zier-Schollen | Meer zugefroren (freezeSea), 2–3 Eislöcher |
| `beach` | Kiesstrand (Bodenzone ice_beach) am Wasser | Walrosse am Strand, Blubberstellen | Walrosse an den Eislöchern |
| `birdrocks` | 3–5 Schneefelsen am Ufer, ein paar im Wasser als Kulisse | Papageitaucher | (leer) |
| `tundra` | große Tundra-Fläche (Bodenzone tundra) mit Felsen und Flechten | Hasen, Rentiere, Fuchs, Wölfe | Fuchs, Wölfe |
| `taiga` | Gruppe verschneiter Tannen (Ṗ) am Rand | – | Eule |
| `glacier` | Gletscherfläche (glacier0..2) mit Eisblöcken | nur Kulisse | nur Kulisse |

Jede Map hat Wasser und damit Pinguine und Robben als Nebentiere, auch die reinen Tundra-Maps (ein Bach oder eine
Bucht am Rand).

## Maps (Vorschlag: 9 Stück, je 28 × 28 wie die anderen)

Präfix `ix_`, gebaut mit makeRows und einer neuen Palette `ice` (Rand aus Schneefelsen, Eisblöcken und verschneiten
Tannen statt Sträuchern). Start links, Ausgang rechts (EDGE).

| Map | Name | features | Idee |
|---|---|---|---|
| ix_packice | Packeis | sea | Breites Meer oben, schmaler Schneestreifen unten. Nachts großes Eisfeld mit 3 Löchern, die Eisbär-Map. |
| ix_walrus | Walross-Bucht | beach, sea | Runde Bucht mit langem Kiesstrand. |
| ix_birdcliff | Vogelfelsen | birdrocks, sea | Felsen an einer Felsküste, Kiste in der Nähe der Felsen. |
| ix_fjord | Fjordufer | birdrocks, beach | Schmaler Fjord quer durch die Map, ohne Brücke: tagsüber Umweg ums Fjordende, nachts zugefroren als Abkürzung (wie auf der großen Karte). |
| ix_tundra | Weite Tundra | tundra | Fast nur Tundra, kleiner Tümpel. Rentier-Map. |
| ix_creek | Tundra-Bach | tundra | Bach von oben nach unten (vriver aus dem Wald, mit Steinen zum Drübergehen), nachts zugefroren. |
| ix_taiga | Taigarand | tundra, taiga | Unten dichter Tannenwald, oben Tundra. Eulen-Map. |
| ix_glacier | Gletscherzunge | glacier, sea, beach | Gletscherfläche mit Abbruchkante ans Meer, Strand daneben. |
| ix_icebergs | Eisberg-Feld | sea, birdrocks | Meer mit großen Eisblöcken (Ê) als Eisbergen, Felsen am Ufer. |

So gibt es jedes Merkmal mindestens zweimal, und jede Tierart hat mindestens zwei Maps.

**Keine Kälte auf Expeditionen (Andre, 26.11.2026).** Nacht-Maps übernehmen aus looks.night alles außer `cold`;
auch in den Durchgängen der großen Karte bleibt die Kälte, wie sie dort ist (sie kommt von der großen Karte).

**Tag und Nacht: 60 % Tag, 40 % Nacht (Andre, 26.11.2026).** planMap würfelt das Wetter bisher gleich verteilt. Neu:
Gewichte je Biom (`SEASON_WEIGHTS.ice = { day: 0.6, night: 0.4 }`), sowohl beim freien Würfeln am Anfang als auch beim
letzten Würfeln aus den noch erlaubten Wettern. Zieht eine Anker-Art (z. B. Eisbär) die Nacht fest, gilt die Nacht.
Damit es insgesamt bei etwa 60/40 bleibt, wird der Anker auf Maps mit seltenem Merkmal mit derselben Gewichtung
gewählt (eine Nacht-Art nur mit 40 %).

## Camp

- `ice_camp`, „Eis-Expedition“: wie die anderen Camps (campRows), ringsum Schneefelsen, Eisblöcke und Tannen auf
  Schneeboden; rechts zwischen zwei Fahnenstangen mit Wimpeln geht es weiter.
- Schneemobil mit Anhänger statt Auto (car_snow wie in der Eiswelt und im Tierpark); man kommt davor an.
- Lagerfeuer im Camp nur als Kulisse (es gibt keine Kälte).
- **Käfige nicht artspeziell (Andre, 26.11.2026):** Jeder Käfig nimmt jede Art, sonst könnte man bestimmte
  Kombinationen nicht mitnehmen. Es bleibt bei der Regel aller Expeditionen: ein Käfig je Art, aber welcher Käfig, ist
  egal. **Im Eis-Camp laufen alle Tiere an Land herum**, auch Robbe, Walross und Pinguin: Sie liegen, dösen und
  watscheln im Käfig wie am Strand (vorhandene Land-Bilder: Robbe am Strand, dösendes Walross, laufender Pinguin).
  Kein Wassertrog nötig, kein Schwimmen im Camp. Im Eis-Camp fällt der Trog daher weg (oder bleibt als gefrorene
  Kulisse). Wichtig beim Bauen: Robbe und Walross dürfen im Camp nicht nach Wasser suchen (sonst stehen sie
  herum oder laufen gegen das Gitter); wie im Tierpark-Gehege nur die Land-Zustände.
- Im Camp ist immer Tag (hell). Die Nacht gilt nur auf den Maps, die sie gewürfelt haben. Auf der Karte für die nächste
  Map steht deutlich ☀ oder 🌙, damit man weiß, welche Tiere es gibt.
- Hero-Kleidung hero_ice im Camp und auf allen Maps.

## Karten im Camp

- **Tierkarten** wie immer. Bei Nacht-Karten kommen nur Nacht-Tiere vor (Eisbär, Eule, dazu Fuchs, Wolf, Walross,
  Pinguin, Robbe), bei Tag-Karten nur Tag-Tiere (Hase, Rentier, Papageitaucher …).
- **Seltene Karten:** großer alter Eisbär (nur nachts), großer rosa Walrossbulle, Polarhase (nur tags), weißes Rentier
  (nur tags), schwarzer Polarwolf, dazu die vorhandenen seltenen Pinguine und Robben. Das regelt rareSkinFor schon über
  das Wetter.
- **Bonus-Karten:** die vorhandenen. „Reittier“ fällt in der Eiswelt weg (es gibt dort keins). Das **Fernglas** zeigt
  wie sonst versteckte Tiere: hier das Ende der Fuchsspur und den Platz der Eule. Fangen muss man trotzdem mit Laterne
  und Kescher.
- **Event-Karte: kommt später (Andre, 26.11.2026).** Bis dahin gibt es in der Eis-Expedition keine Event-Karten
  (rollRunCards bietet sie ohnehin nur für Maps mit Event-Kennzeichen an). Ideen dafür: Rentierwanderung nachts übers
  Eis, Polarlicht-Nacht, Orcas (nur zum Anschauen, nicht fangbar).

## Was an den Mechaniken angepasst werden muss

Auf den kleinen Maps gibt es eine feste Tierliste ohne Nachspawnen (run().left). Einige Eiswelt-Mechaniken setzen
selbst Tiere nach, das muss auf Expeditions-Maps aufhören oder sich an die Liste halten:

- **Schneeeule** (updateOwl in IceCatch.js setzt nach 30 Sekunden eine neue): nur, solange sie noch auf der Liste
  steht. Sie gehört zu den Tieren, die „auf ihre Weise kommen“ (CALLED_UNITS).
- **Walross-Inseln** (walrusIslands, Nachschub nach 45 Sekunden): gibt es auf den Maps nicht.
- **Polarwolf-Rudel** (updatePolarWolves): Rudelgröße = Einheiten auf der Liste, das Rudel liegt auf der Tundra der Map.
  Auch CALLED_UNITS (wie der Wolf im Wald).
- **Rentier-Rundweg:** auf 28 × 28 enger. Die Runde dauert dann etwa 30 statt 50 Sekunden; die Trampelspuren müssen
  ganz auf die Map passen. LOOP_SEARCH beim Bauen prüfen.
- **Eisbär:** Ring und Uhr unverändert. Die Fisch-Ablagestellen gibt es an jedem Eisloch der Map. Der Bär braucht freies
  Eis um die Löcher (mindestens 4 Kacheln).
- **Hasenbau:** 2–3 Löcher auf Tundra, nicht zu nah am Rand.
- **Walross-Blubberstellen:** werden schon aus der Lage der Walrosse gerechnet, sollten ohne Änderung gehen.
- **Werkzeugkiste der Map** (withRoute): Kescher, Lasso, Hering, Ball, Laterne, Wärmflasche (die Angel nicht).
- **Nacht-Optik:** looks.night bringt rows (zugefroren), iceHoles, seaIce, night, cold. Polarlicht und Dunkelheit kommen
  von Weather.js wie auf der großen Karte.
- **Ladepakete:** BootScene nimmt für `expedition: 'ice'` die Pakete der Eiswelt (LEVEL_GROUPS), dazu wolves und misc
  (Schneefelsen).

## Durchgänge der großen Eiswelt (danach, mit denselben Maps)

Wie im Wald und im Bambuswald (sideMaps.js): Hinter einem Durchgang wartet eine Map aus dem Expeditions-Baukasten. Die
große Karte bestimmt Tag oder Nacht.

- **Tundra (unten):** führt auf ix_tundra, ix_creek oder ix_taiga.
- **Fjordende:** auf ix_fjord, ix_birdcliff oder ix_glacier.
- **Offenes Meer (oben):** auf ix_packice oder ix_icebergs. Tagsüber bringt eine Scholle Henrik hinüber (wie die
  Fähren), nachts geht man zu Fuß übers Eis.
- Wird es auf der großen Karte Nacht, während man hinter einem Durchgang ist, bleibt die kleine Map so, wie sie war (wie
  beim Wetterwechsel in den anderen Welten).

## Reihenfolge (Vorschlag)

1. `SPECIES_RULES.ice`, `BIOME_SEASONS.ice`, Palette `ice` in makeRows (gefrorenes Wasser nachts, Eislöcher).
2. Camp und 3 Maps (Packeis, Weite Tundra, Walross-Bucht). Damit gibt es schon jede Tag- und Nacht-Mechanik einmal.
   Testen mit `?level=ice_camp`.
3. Anpassungen der Mechaniken (Eule, Wölfe, Rentier-Runde, Tiere im Camp nur an Land, 60/40 beim Würfeln).
4. Die übrigen 6 Maps.
5. Durchgänge der großen Karte.
6. Event-Karte (später, noch nicht festgelegt).
7. Wahl „Erkundung / Expedition“ auf der Weltkarte für die Eiswelt, solange `wip` mit Hinweis. Die Trophäe
   „Weltreisender“ zählt das neue Biom von selbst mit (expBiomes).

## Noch offen

- Event-Karte (kommt später).
- Bilder: Fahnenstangen am Camp-Ausgang (jetzt zwei Eisblöcke).
- Durchgänge der großen Eiswelt (Schritt 5).

## Umsetzung (26.11.2026, nicht committet)

Schritte 1 bis 4 und 7 sind gebaut und im Browser getestet (Camp, Tag- und Nacht-Maps, Tiere im Camp an Land).
Durchgänge der großen Karte (Schritt 5) und Event-Karte (Schritt 6) fehlen noch.

- **Regeln:** `SPECIES_RULES.ice`, `BIOME_SEASONS.ice`, `SEASON_WEIGHTS.ice` in speciesRules.js. planMap würfelt mit
  Gewichten erst Tag oder Nacht, dann eine seltene Art, die es dabei gibt (sonst zöge z. B. der Eisbär auf dem Packeis
  die Nacht zu oft fest). Gemessen: 60,5 % Tag. Rentiere als Herde = eine Einheit, Polarwolf-Rudel = eine Einheit.
- **Maps** (expeditionMaps.js, Abschnitt Eiswelt): makeRows kann jetzt `sea` (Meer oben), `fjord` (Meeresarm von
  rechts), `band` (Taiga-Streifen), `shoreRocks`/`islets` (Vogelfelsen am Ufer bzw. im Wasser) und `vriver.to` (Bach
  endet). `imap` baut aus den fertigen Zeilen die Nacht: Eislöcher automatisch (iceHoles: in jedem Gewässer eins, in
  großen bis zu drei, mit Eis ringsum), Wasser sonst zugefroren, auf Meer-Maps (`openSea`) bleiben die zwei obersten
  Reihen offen. Keine Kälte.
- **Camp:** ice_camp mit Schneemobil (car_snow), Ausgang zwischen zwei Eisblöcken (statt Fahnenstangen, dafür gibt es
  kein Bild), kein Wassertrog.
- **Spiel:** Polarwolf-Rudel und IceCatch laufen auf allen Eis-Maps (biomeOf); auf der Expedition kommt das Rudel nur
  mit `left.arcticwolf`, kleiner (EXP_GROUP) und zieht nach einem Fang fort. Die Eule kommt nur, solange sie auf der
  Liste steht (beide in CALLED_UNITS). Kiste: Fisch beim Eisbären, Laterne bei Fuchs und Eule (EXP_HELPERS). Kurze
  Hinweise beim Ankommen (Nacht, Eisbär, Eule, Fuchs). Bonus-Karte „Reittier“ gibt es in der Eiswelt nicht (NO_RIDE).

## Entschieden (Andre, 26.11.2026)

- Keine Kälte auf Expeditionen.
- Event kommt später.
- 60 % Tag, 40 % Nacht.
- Käfige nicht artspeziell; im Eis-Camp laufen alle Tiere an Land herum (auch Robbe, Walross, Pinguin).
