# Plan: Eiswelt (neue Tiere, größere Karte, Expedition, Eiswelt im Tierpark)

Stand: 23.11.2026, abgestimmt im Brainstorming mit Andre, noch nichts gebaut. Offene Fragen stehen unter „Noch offen“
ganz unten.

## Ausgangslage

Die Eiswelt (`ice` in levels.js) ist als `wip` markiert. Es gibt das Festland mit der Forschungsstation, vier große
Inseln mit Schollen-Fähren, den Wechsel von Tag und Nacht alle 8 Minuten (nachts friert das Meer zu, Polarlicht,
Kälte nach 3 Minuten) und nur zwei Tierarten: Pinguin (Lasso aus Abstand) und Robbe (wünscht sich Hering oder Ball).
Im Tierpark gibt es noch keinen Eis-Bereich, für die Expedition keine Eis-Regeln.

## Grundsätze

- **Keine Geschicklichkeit.** Ränder sperren, Henrik fällt nie ins Wasser, nichts muss genau getimt werden.
- **Keine Tierkinder in der Wildnis.** Deshalb gibt es keinen Moschusochsen mit Kälbern und keine Eisbärmutter mit Jungen.
- **Wilde Tiere.** Keine Glocken an den Rentieren, nichts, was nach Haustier aussieht.
- **Jede Art hat ihre eigene Mechanik.** Kein zweites „einfach füttern“.
- **Die normale Karte enthält alle Teile**, die es auf den Expeditions-Maps gibt (Merkmale als Zutaten wie im Wald).
- **Keine große Höhe.** Das Spiel hat wenig Vertikalität: Klippen werden durch große Felsen ersetzt.

## Tiere

| Tier | Wann | Mechanik |
|---|---|---|
| Pinguin | immer | wie bisher: Lasso aus Abstand, sonst springt er ins Wasser |
| Robbe | immer | wie bisher: wünscht sich Hering oder Ball |
| **Eisbär** | nachts | Tagsüber schläft er in einer Schneehöhle (Hügel mit Atemwölkchen, nicht fangbar). Nachts läuft er über das zugefrorene Meer. Legt Henrik einen Hering an ein Eisloch, setzt sich der Bär davor und lauert. Wirft man ihm dann einen Fisch zu, folgt er. |
| **Walross** | immer | Schwimmt, kommt an den Strand oder an die Eiskante und döst regelmäßig (💤). Wärmt Henrik ein dösendes Walross mit der **Wärmflasche** (neues Werkzeug), kommt es mit. |
| **Rentier** | immer | Wilde Herde wie die Antilopen: scheu, Lasso, bemerkt eines Henrik, flieht die ganze Herde. Anders als die Antilopen trabt die Herde öfter zu einem neuen Platz, nachts auch über das Eis. |
| **Papageitaucher** | tagsüber | Kolonie auf den Vogelfelsen am Fjord (siehe unten). Die Vögel fliegen aufs Meer und kommen mit Fisch im Schnabel zurück. Wer gerade auf einem Felsen am Ufer landet, lässt sich mit dem Kescher fangen. Nachts sind sie auf dem Meer und nicht da. |
| **Polarfuchs** | immer | Man sieht ihn nicht, nur seine Fußspuren. Sie führen irgendwohin und enden. Stellt Henrik dort die Laterne ab, leuchten zwei Augen auf, dann Kescher. Spuren wie beim Schneeleoparden, Laterne wie beim Elch. |
| **Schneeeule** | nachts | Man hört sie nur, wie die Hyänen (dazu eine kurze Meldung für das Spielen ohne Ton). Stellt Henrik die Laterne ab, wird sie sichtbar. Fang mit dem Kescher oder durch Berühren. |
| **Polarwolf** | immer | Mechanik vom Wolf („Ochs am Berg“: beim Heulen bewegen, beim Umschauen stillstehen, Berühren fängt), aber ohne Fußspuren. Das Rudel liegt in der Tundra. |
| **Schneehase** | immer | Standardtier wie die Katze, nur etwas schneller. |
| Orca | Event | Nicht fangbar, siehe „Events“. |

Seltene Varianten folgen später, Vorschläge: weißes Rentier, Blaufuchs.

## Die Karte

Die Breite bleibt bei 46 Kacheln, die Höhe wächst auf etwa 64 (wie der Bambuswald). Statt vier großer Inseln
gibt es nur noch zwei kleine.

```
 ~~~~~~~~~~~~~~~~ offenes Meer (Rand, friert nie zu) ~~~~~~~~~~~~~~~~
 ~~  [Insel A]      ~~~~~~~~~~~~~~~~~~~~~~~      [Insel B]        ~~
 ~~  Pinguine,      ~~  Meeresarm, nachts  ~~    Walross-Strand,  ~~
 ~~  Eisloch        ~~  zugefroren         ~~    Eisloch          ~~
 ~~      ⇅ Scholle  ~~~~~~~~~~~~~~~~~~~~~~~~~  ⇅ Scholle          ~~
 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ...... Küste: Strand mit Walrossen ......  Station  ......  ✈ Flugzeug
 ..........................................................  ~~~~~~~~
 ......  Tundra  ................  ~~~~~ Fjord ~~~~~  Vogel-   ~~~~~~
 ......  Rentiere, Hasen,  .......  ~~~ ●  ●  ●  ~~~  felsen   ~~~~~
 ......  Fuchs, Wolf, Eule ........  ~~~~~~~~~~~~~~~  ●  ●    ~~~~
 ...........................................  ~~~~~~~~~~~~  ~~~~~~
 ......  Felsen, Flechten  ....................  ÊÊÊ Gletscher ÊÊÊ
 ═══ Durchgang Tundra ═══                        ═══ Durchgang Fjord ═══
```

- **Oben, Meer mit zwei Inseln:** Für jede Insel gibt es eine Schollen-Fähre wie bisher. Nachts friert der Meeresarm zu.
  Es gibt etwa 4 Eislöcher (an ihnen lauert der Eisbär). Insel A hat die Pinguine, Insel B den zweiten Walross-Strand.
- **Mitte, Küste:** Hier sind die Forschungsstation, das Wasserflugzeug und der Walross-Strand. Die Küste ist breit
  begehbar, man muss nicht ständig Fähre fahren.
- **Fjord (rechts):** Er schneidet von der Küste ins Land. An seinen Ufern und im flachen Wasser stehen
  **Vogelfelsen**: große, verschneite Felsbrocken (Vorbild: der Schneefelsen `Ɵ` des Schneeleoparden bzw. der
  Löwenfelsen) statt einer hohen Klippe. Die Papageitaucher sitzen oben drauf und in Nischen. Die Felsen direkt am
  Ufer erreicht man, die im Wasser sind nur Kulisse. Am Ende des Fjords bildet eine **Gletscherwand** aus großen
  Eisblöcken (`Ê`) die feste Grenze. Nachts friert der Fjord zu und wird zur Abkürzung in die Tundra.
- **Gletscher (umgesetzt anders als oben gezeichnet):** keine Wand, sondern eine begehbare Eisfläche am Fjordende
  (Bodenzone glacier0..2, wie das Meereis nachts, nur bläulicher und mit Spalten), an der Abbruchkante zum Wasser ein
  paar Eisblöcke. Der Weg in die Tundra führt westlich daran vorbei.
- **Taiga:** Am unteren Rand stehen dichte verschneite Tannen (Ṗ, snow_pine), ein paar auch einzeln in der Tundra.
  (Streng genommen ist die Tundra baumlos und die Tannen gehören zur Taiga; im Spiel liegt die Taiga am Rand.)
- **Unten, Tundra:** weite Fläche mit Felsen und Flechten. Hier leben die Rentierherde, die Hasen, der Fuchs (Spuren),
  das Polarwolf-Rudel und nachts die Eule.
- **Durchgänge:** In der Tundra führt einer auf Tundra-Maps, am Fjordende einer auf Fjord-Maps mit Vogelfelsen, am
  offenen Meer einer auf Packeis-Maps (tagsüber mit einer hinaustreibenden Scholle, nachts zu Fuß übers Eis).
- **Umzug alter Spielstände:** Wer auf einer weggefallenen Insel steht, kommt an der Station heraus.
- **Bilder:** Tundra-Boden, Vogelfelsen, Gletscherwand, Strand und Schneehöhle fehlen noch, zuerst mit Platzhaltern
  (wie beim Moor).

## Expedition

Statt Wetter würfelt jede Map **Tag oder Nacht**. Nachts sind Meer und Fjord zugefroren (Packeis), und die
Kälte gilt wie auf der großen Karte. Merkmale (`features`) und Regeln (`SPECIES_RULES.ice`):

| Tier | needs | Tag/Nacht |
|---|---|---|
| Pinguin | (keins) | beide, `plain` |
| Robbe | (keins) | beide, `plain` |
| Schneehase | `tundra` | beide, `plain` |
| Eisbär | `sea` | nur Nacht (Packeis) |
| Walross | `beach` | beide |
| Papageitaucher | `birdrocks` | nur Tag |
| Rentier | `tundra` | beide |
| Polarfuchs | `tundra` | beide |
| Polarwolf | `tundra` | beide |
| Schneeeule | (keins) | nur Nacht |

Ideen für Maps: Packeis, Tundra, Vogelfelsen, Walross-Strand, Gletscherzunge, Fjord, Eisberg-Feld, Tundra mit Bach.
Event-Karte: **Orcas** (offenes Meer, siehe unten).

## Events

- **Orcas ziehen vorbei** (Eiswelt und Event-Karte der Expedition): Eine Orca-Gruppe schwimmt durchs offene Meer am
  Rand, die Robben retten sich auf Schollen. Es ist nur zum Anschauen, die Orcas sind nicht fangbar, eventuell
  bekommen sie einen Eintrag im Tierbuch.
- Weitere Ideen, noch nicht abgestimmt: Polarlicht-Nacht (stärkeres Polarlicht, Tiere zeigen sich öfter), große
  Rentierwanderung über das Eis, Rückkehr der Papageitaucher am Morgen.

## Eiswelt im Tierpark (Vorschlag, noch nicht abgestimmt)

Ein großer eigener Abschnitt mit Schneeboden:

- **Pinguin-Bucht:** Felsen, Becken und eine Rutsche ins Wasser, Besucher am Geländer.
- **Eisbären-Anlage:** Tundra und Wasser hinter einem Graben, dazu ein Unterwasser-Fenster.
- **Robben- und Walross-Becken:** gemeinsames Becken mit Felsstrand.
- **Rentier-Tundra:** Die Rentiere laufen frei zwischen den Besuchern wie die Hirsche im Wildpark.
- **Vogelfelsen-Voliere** (Netzdach): Papageitaucher, Schneeeule.
- **Polarfuchs-Bau, Polarwolf-Gehege, Schneehasen.**
- Kein Tag-Nacht-Wechsel im Tierpark (kein Wetter im Zoo), höchstens Polarlicht als Deko. Buden: heiße Schokolade,
  Iglu.

## Reihenfolge (Andre, 23.11.2026)

1. Umbau der Karte (zwei Inseln, Küste, Fjord mit Vogelfelsen, Tundra)
2. Die neuen Tiere
3. Gehege im Tierpark
4. Seltene Varianten
5. Expeditionen und Durchgänge zum Schluss

## Umsetzung (Stand 23.11.2026, nicht committet)

Schritt 1 (Karte) und Schritt 2 (Tiere) sind gebaut und im Browser getestet.

- **Karte:** tools/ice-map.py erzeugt ICE_ROWS (46 × 64). Platzhalter-Böden aus tools/ice-grounds.py (Tundra,
  Kiesstrand) und tools/ice-placeholders2.py (Gletscher, verschneite Tanne Ṗ). Die Schneefelsen des Bambuswalds liegen
  jetzt im Paket misc (Bambuswald und Eiswelt). Weiche Übergänge auch zwischen zwei Bodenzonen (groundBlend.js: die zuerst
  genannte Zone liegt oben). Alte Spielstände: migrateIceMap in save.js.
- **Schneehase** (snowhare): Standardtier, Hand oder Kescher, meist in der Tundra.
- **Polarfuchs** (ArcticFox.js): unsichtbar, Pfotenspur bis zum Versteck; abgestellte Laterne in der Nähe: schwach
  sichtbar, leuchtende Augen, Kescher. Die Laterne liegt in den Kisten; nach dem Abstellen hat Henrik in der Eiswelt den
  Kescher in der Hand (sonst das Lasso).
- **Polarwolf** (arcticwolf): WolfNight aus Wolf.js mit Optionen (keine Dunkelheit, keine Spuren, andere Tiere bleiben,
  Rudel nur in der Tundra), ein Rudel, Tag und Nacht (updatePolarWolves in GardenScene). Das Geheul ist noch stumm
  (wolf_howl liegt im Wald-Paket), nur das „Auuuu ♪“-Zeichen.
- **Schneeeule** (SnowOwl.js): nur nachts, sitzt neben Felsen/Tannen, ruft (Platzhalter-Ton aus tools/owl-hoot.py),
  nah dran steigt „Huu ♪“ auf, beim ersten Ruf eine Meldung; im Licht der abgestellten Laterne sichtbar: Kescher oder Hand.
  Folgt sie Henrik, fliegt sie (Vorderansicht).
- **Rentier** (Reindeer.js): Herde wie die Antilopen, zieht alle 25–45 Sekunden gemeinsam 10–20 Kacheln weiter.
- **Walross** (Walrus.js): größer gezeichnet, Kiesstrand (am Tag) bzw. Eislöcher (nachts); wechselt zwischen wach und
  dösend; Wärmflasche (WarmerTool.js, Platzhalter-Bild aus tools/warmer-icon.py, liegt in den Kisten) an ein dösendes
  Walross: Dampf und Herzchen, dann folgt es.
- **Eisbär** (PolarBear.js): nur nachts auf dem zugefrorenen Meer, größer gezeichnet, hält Abstand. Ein Fisch, der
  neben einem Eisloch landet, bleibt als Köder liegen (dropBearBait); der Bär trottet hin und lauert (polarbear_wait);
  ein zweiter Fisch fängt ihn. Tagsüber gibt es (noch) keinen Bären in der Schneehöhle.
- **Papageitaucher** (Puffin.js): nur tagsüber, Kolonie oben auf den Vogelfelsen; fliegt aufs Meer und zurück, landet
  am Ufer neben dem Felsen und ist dann 6 Sekunden mit dem Kescher fangbar.
- Gefangene neue Tiere werden im Tierpark ausgewildert, bis es ihre Gehege gibt (Schritt 3). Besucherwünsche,
  Besucher-Anziehung und Futter der neuen Arten kommen mit den Gehegen.

## Entschieden (23.11.2026)

- **Eiswelt im Tierpark:** später, kommt erst nach der Eiswelt selbst.
- **Wärmflasche:** liegt in den Kisten wie Hering und Ball.
- **Seltene Varianten:** später.
- **Sprites:** Andre hat sie geliefert (Sprites/: Eisbär, Walross schläft, Papageientaucher + fliegt, Polarfuchs,
  Polarwolf + heult, Schneeeule + fliegt, Schneehase; public/assets/: Rentier, Walross). Von der fliegenden
  Schneeeule wird nur die Vorderansicht verwendet (die anderen Ansichten passen nicht zusammen).

## Noch offen

- Ist die Kälte (3 Minuten) zu knapp, wenn nachts mehr Tiere unterwegs sind? Andre: „wird sich zeigen“.
- Echte Bilder für Tundra-Boden, Gletscher, Kiesstrand, verschneite Tanne und Schneehöhle (jetzt Platzhalter aus
  tools/ice-grounds.py und tools/ice-placeholders2.py). Die Vogelfelsen sind die Schneefelsen aus dem Bambuswald.
- Wasserflugzeug: beim Teststart direkt in der Eiswelt fehlt sein Bild (es liegt im Dschungel-Paket).
- Eisbär tagsüber in der Schneehöhle (Hügel mit Atemwölkchen) fehlt noch; echter Eulenruf statt Platzhalter;
  Polarwolf-Geheul in der Eiswelt.
