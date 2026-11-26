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

Seltene Varianten: siehe „Seltene Varianten (Andre, 25.11.2026)“ unten.

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

**Veraltet, neuer Plan in docs/plan-eis-expedition.md (26.11.2026).** Der Stand unten ist vom 23.11.2026.

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
- **Papageitaucher-Zug** (abgestimmt 26.11.2026): siehe docs/plan-papageitaucher.md.
- Weitere Ideen, noch nicht abgestimmt: Polarlicht-Nacht (stärkeres Polarlicht, Tiere zeigen sich öfter), große
  Rentierwanderung über das Eis, Rückkehr der Papageitaucher am Morgen.

## Eiswelt im Tierpark (abgestimmt mit Andre, 24.11.2026; gebaut 24.11.2026, siehe „Umsetzung Tierpark“)

Ein eigener Parkabschnitt (`park4`, eigenes Level wie park2/park3; das eigene Gelände aus plan-eigenes-gelaende.md
rückt dann auf `park5`) mit Schneeboden.

```
 Streichelzoo │ Eistor ══►  ┌──────────── Eiswelt ─────────────┐
              │             │  Polarhalle  ║  Robben & Walross  │
              │             │  (Pinguine,  ║  (Außenbecken mit  │
              │             │   Vögel)     ║   Kiesstrand)      │
              │             │      ══ Rundweg ══                │
              │             │  Eisbären-Anlage   Rentier-Gehege │
              │             │  Wölfe · Füchse · Hasen           │
              │             │  Iglu-Bude · heiße Schokolade     │
              └─────────────┴───────────────────────────────────┘
                 ║ = Glaswand: von der Halle unter Wasser ins Robbenbecken
```

- **Eingang beim Streichelzoo:** Ein Weg führt rechts am Streichelzoo vorbei (nicht hindurch) zum Kartenrand, wo früher
  der Ausgang auf die Wiese war (Kachel 55/40 im Zentrum). Dort steht ein Torbogen aus Eisblöcken mit dem Schild
  „Eiswelt“ (wie die Bögen von Wildpark und Streichelzoo), dahinter beginnt der Schnee.
- **Polarhalle** (Gegenstück zur Tropenhalle: Glaswände, das Dach wird beim Betreten durchsichtig): Pinguin-Becken mit
  Felsen. **Papageitaucher und Schneeeule fliegen frei durch die Halle.** Nicht alles ist in der Halle, es gibt auch
  Außenbereiche.
- **Robben & Walross zusammen** in einem Außenbecken mit Kiesstrand: Sie liegen am Ufer, dösen und schwimmen an der
  Oberfläche (vorhandene Bilder). Eine Seite des Beckens ist die Glaswand der Polarhalle: Von drinnen schaut man unter
  Wasser ins Becken (statt eines Tunnels, der in der Schrägansicht nicht zu lesen wäre; Vorbild ist das große Becken im
  Aquarium). Dort schwimmen Robben und Walrosse in ganzer Gestalt.
- **Eisbären-Anlage** draußen: Tundra und Wasser hinter einem Graben, **ohne** Unterwasserfenster.
- **Rentiere** draußen in einem großen Gehege (nicht frei zwischen den Besuchern).
- **Polarwolf, Polarfuchs (mit Bau), Schneehase:** eigene Außengehege.
- Kein Tag-Nacht-Wechsel im Zoo: Eule und Bär sind einfach da. Leichter Schneefall und eigener Ambient-Ton.
- Futterautomat mit Fisch; Buden: heiße Schokolade, Iglu.
- **Schnellreise mit dem Schneemobil** statt des Autos (nur Schnellreise, Henrik fährt nicht selbst).
- Gefangene Eiswelt-Tiere, die bis jetzt im Park ausgewildert wurden, ziehen beim Betreten in ihre neuen Gehege.
- Besucherwünsche, Besucher-Anziehung (`APPEAL`) und Futter der neuen Arten kommen mit den Gehegen.

**Bilder von Andre:** Schneemobil-Sprite; Schwimm-Animationen unter Wasser (Seitenansicht, als Video mit wiederholbarem
Zyklus, Spritesheet mit tools/find-loop.py, andere Richtung gespiegelt) für **Robbe und Walross**. Pinguin und Eisbär
bekommen keine Unterwasser-Animation.

## Umsetzung Tierpark (24.11.2026, nicht committet)

- **Aufbau (Andre, 24.11.2026):** Polarhalle in der Mitte, ein geschwungener Rundweg mit Knicken um sie herum, außen die
  Gehege in unregelmäßigen Formen (L-Formen): Polarwölfe und Polarfüchse links, Schneehasen oben, Robben & Walrosse
  oben rechts (langes Becken mit Kiesstrand), Eisbären unten rechts hinter einem Wassergraben, Rentiere unten links,
  Platz mit Futterautomat und Schneemobil am Eingang. tools/park-ice-map.py zeichnet den Abschnitt (Gehege als Flächen,
  die Zäune ergeben sich daraus) in seine eigene Kartentabelle PARK_ICE_ROWS.
- **Vergrößert (Andre, 25.11.2026):** 44 × 39 statt 40 × 35 Kacheln, eigene Kartentabelle statt eines Ausschnitts von
  PARK_ROWS. Polarhalle innen 18 × 16 statt 12 × 11 (Pinguinbecken 10 × 9), alle Gehege größer, der Rundweg nur noch
  1 Kachel breit (der Weg vom Eingang bleibt 2 breit). Deko und Buden dort kommen in alten Spielständen zurück in die
  Bauen-Leiste (migrateIcePark in save.js).
- **Eingang:** Weg unterhalb des Streichelzoos (Zeilen 46/47) zum rechten Rand des Zentrums, nicht bei 55/40 (dort liegt
  der Zaun direkt am Rand). Torbogen „Eiswelt“ gleich dahinter, vorerst der Bogen des Wildparks. Offen ist park4, sobald
  die Eiswelt offen ist (isUnlocked).
- **Polarhalle:** Glasfassade ohne Holz (hohe klare Scheiben in schmalen hellen Metallrahmen, Glastür mit zwei Flügeln;
  das Pinguinbecken innen mit niedrigem Glas derselben Art; tools/glass-facade.py), Glasdach mit Streben wie die
  Tropenhalle (JungleHall mit mist: false). Links ein großes
  Pinguinbecken hinter Glas, davor der Holzsteg. Papageitaucher und Schneeeulen fliegen frei zwischen Felsen und Tannen
  (src/animals/hallFlight.js). Unten rechts die große Treppe (Platzhalter tools/polar-stairs.py) hinunter.
- **Unterwasser-Scheibe (Level polarunder):** ein Raum unter der Halle. Hinten steht über die ganze Breite das Becken als
  großer Glaskasten wie im Aquarium (3 Kacheln tief): vorne die hohe Scheibe mit Pfosten, rechts die Seitenscheibe, oben
  die Wasseroberfläche, drinnen Rückwand mit Lichtstrahlen und Kiesboden mit Felsen, Bläschen
  (src/world/UnderwaterWindow.js). Robben und Walrosse aus dem Außenbecken schwimmen darin hin und her, mal vorne an
  der Scheibe, mal weiter hinten (dort kleiner, blasser, bläulicher). Bis die Videos da sind, gleiten die Standbilder;
  mit einer Animation <Art>_underwater (Seitenansicht) spielt sie diese, nach links gespiegelt. Ohne Tiere steht ein
  kurzer Hinweis auf der Scheibe. Im Raum: Weg aus festgetretenem Schnee vor der ganzen Scheibe und von der Tür hinauf,
  Steinklötze zum Sitzen (Andre: Stein statt Holzbänken), Eisblöcke in den Ecken. Drei Besucher kommen durch die Tür,
  stellen sich an verschiedene Stellen vor die Scheibe, schauen, wechseln den Platz und gehen wieder (nur Figuren,
  ohne Herzen). Treppe und Sitzsteine sind HD-Platzhalter (tools/polar-stairs.py, tools/stone-seat-ice.py: 8-fach
  gezeichnet, Fassungen für hd/ und hd2/).
- **Außenbecken:** Robben wechseln zwischen Schwimmen (Kopf im Wasser) und Strand, Walrosse dösen immer wieder (💤).
- Polarwölfe vorerst Kopie der Waldwölfe (so gewollt). Schneefall, leiser Wind-Ton, Schritte im Schnee; kein Tag und
  keine Nacht. Besucher-Anziehung, Futter (Futterhaus) und Wunsch-Sätze der neuen Arten; Trophäe „voller Abschnitt“
  und Tierbaby-Event auch hier.
- **Schneemobil** mit Anhänger (Andres Bild, freigestellt mit tools/snowmobile-cut.py, Lage und Größe wie das Zoo-Auto)
  auf dem Platz am Eingang; der Fuchsbau ist unten kürzer, damit der Anhänger nicht in ein Gehege ragt.
- **Noch offen:** Buden heiße Schokolade und Iglu (brauchen Bilder), Torbogen aus Eisblöcken, echtes
  Bild der Treppe.

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
- **Seltene Varianten:** später (geplant 25.11.2026, siehe unten).
- **Sprites:** Andre hat sie geliefert (Sprites/: Eisbär, Walross schläft, Papageientaucher + fliegt, Polarfuchs,
  Polarwolf + heult, Schneeeule + fliegt, Schneehase; public/assets/: Rentier, Walross). Von der fliegenden
  Schneeeule wird nur die Vorderansicht verwendet (die anderen Ansichten passen nicht zusammen).

## Fangen mit mehr Schritten (24.11.2026)

Bisher war es oft nur: Werkzeug holen, hingehen, fertig. Jetzt braucht jeder Fang ein paar Schritte, aber keine
Geschicklichkeit (kein Reaktionstest, nichts geht verloren).

- **Schneehase: Bau mit mehreren Löchern.** Jeder Hase hat einen Bau mit 2 bis 3 Löchern, die unterirdisch verbunden
  sind. Er hoppelt in der Nähe herum. Kommt Henrik näher, flitzt er in das nächste Loch und kommt nach einer Weile aus
  einem anderen wieder heraus (am liebsten aus einem, das weit von Henrik weg ist). Steht Henrik an einem offenen Loch,
  schiebt er es mit der Aktionstaste zu (Schneehaufen). Das letzte Loch bleibt immer offen. Ist nur noch eines offen,
  muss der Hase dort heraus: Er schaut erst ein paar Sekunden schnuppernd heraus, auch wenn Henrik danebensteht. Dann
  fängt man ihn mit der Hand oder dem Kescher. Fängt man ihn draußen, geht das auch. Unsichtbarkeit (Tarnung) gibt es
  nicht.
- **Walross: wecken, Muscheln holen, füttern.** Die Wärmflasche weckt ein dösendes Walross. Es ist dann hungrig und
  zeigt eine Muschel in der Sprechblase (eine Zeit lang, dann döst es wieder ein). Im flachen Wasser neben den Walrossen
  blubbert es an ein paar Stellen. Über jeder Stelle schwebt ein Kescher-Zeichen, aber nur, solange ein hungriges Walross in der Nähe wartet (Andre, 24.11.2026: sonst lenkt es ab). Ein Kescher-Schwung dort bringt eine Muschel. Mit 2 Muscheln füttert Henrik das
  hungrige Walross (Aktionstaste), dann kommt es mit. Die Muscheln kann man auch vorher sammeln. Ein Walross, das
  schläft, frisst nicht.
- **Eisbär: Fisch ans Eisloch, mit dem Wind anschleichen.** Neben jedem Eisloch ist eine kleine Ablagestelle, darüber
  schwebt eine Hinweisblase mit dem Fisch (wie der Salzstein bei den Yaks). Henrik legt dort den Fisch aus der Kiste ab
  (Aktionstaste mit dem Fisch in der Hand, oder hinwerfen). Andre wollte ausdrücklich den Fisch aus der Kiste, nicht den
  geangelten. Die Plätze gibt es nur, solange ein wilder Eisbär unterwegs ist (nach dem Fang verschwinden sie). Der Bär trottet hin, frisst (brummt) und legt sich danach satt hin und döst. Es weht Wind, man sieht ihn
  an Schneefahnen und am Schnee, der in dieselbe Richtung treibt. Die Richtung wechselt selten. Steht Henrik so, dass
  der Wind von ihm zum Bären weht, schnuppert der Bär erst (Warnung, „?“), steht dann brummend auf, trottet ein Stück
  von Henrik weg und legt sich dort wieder hin. Kommt Henrik von der anderen Seite oder von der Seite, reicht Berühren.
  Bilder in voller Größe (152 × 148, Platz für die Rückansicht), schlafend: polarbear_sleep (Andre, 24.11.2026).
- **Walrosse auf den Inseln:** Auf beiden Inseln liegt fast immer mindestens ein Walross am Ufer (walrusIslands in
  levels.js); fehlt eins 45 Sekunden lang, kommt ein neues, nur außer Sicht.
- **Hasen hinter Bäumen:** Löcher und Hase bekommen eine Kontur, die durch Bäume scheint (wie beim Kanu).
- **Schneeeule:** nachts sitzt immer genau eine oben in einer verschneiten Tanne der Taiga (nicht mehr über spawn; ist sie
  gefangen, kommt nach 30 Sekunden eine neue). Laterne unter die Tanne.
- **Schneeeule finden:** Weiter weg zeigt ein kleines „Huu ♪“ neben Henrik die Richtung, nah steigt es genau an ihrem
  Platz auf und sie ruft öfter. Die Laterne darf etwas weiter weg stehen (110). Ruf: Andres Aufnahme.
- **Töne (Andre, 24.11.2026):** animal_polarbear, animal_snowowl, animal_reindeer (mp3).
- **Umsetzung:** SnowHare.js (Bau, Löcher als gezeichnete Platzhalter), Walrus.js (Hunger), PolarBear.js (fressen,
  dösen, schnuppern, weiterziehen), Reindeer.js (Rundweg, Trampelspuren als ein Bild je Herde), IceCatch.js
  (Aktionstaste und Leiste: Loch zuschieben, Walross füttern, Fisch ans Eisloch; Blubberstellen, Muscheln, Wind und
  Schneefahnen). Die Muscheln gelten nur, solange Henrik in der Eiswelt ist.
- **Rentiere: im Kreis auf ihrem Pfad.** Die Herde läuft ständig auf einem festen Rundweg durch die Tundra, schneller
  als Henrik und groß (eine Runde dauert etwa 50 Sekunden). Hinterherlaufen bringt nichts, so wie beim Jaguar. Den
  Pfad erkennt man an Trampelspuren im Schnee, die im Kreis verlaufen, mit Lücken (kurze Stücke, gut fürs Tablet). Man stellt sich an den Pfad und wartet still. Wer stillsteht, wird nicht bemerkt, und die
  Herde trabt dicht vorbei: Dann das Lasso. Läuft Henrik auf die Herde zu, schreckt sie auf, weicht aus und läuft
  danach wieder auf ihrem Pfad weiter. Kein Leittier, kein Nachzügler, kein Leckstein.

- **Schneehase und Rentier nur tagsüber (Andre, 24.11.2026):** als Ausgleich zu Schneeeule und Eisbär, die es nur nachts gibt.

## Eisbär ohne Wind (Andre, 24.11.2026)

Die Windrichtung hat niemand verstanden; Wind und Schneefahnen sind ganz weg (die Schneeflocken treiben wieder nur
leicht von rechts). Neu:

- Fisch aus der Kiste ans Eisloch, ein Stück weggehen (steht Henrik am Fisch, wartet der Bär in einigem Abstand).
- Der Bär frisst eine Weile (18 Sekunden). Ein gestrichelter Ring auf dem Eis zeigt, wie weit Henrik weg bleiben muss,
  eine kleine Uhr neben dem Bären, wie lange er noch frisst.
- Geht Henrik in den Ring, wird der Ring rot, der Bär steht auf, schaut herüber, brummt („!“), und die Uhr bleibt stehen.
  Keine Strafe: Geht Henrik wieder hinaus, frisst er weiter.
- Satt schläft er ein (💤, 3 Minuten). Jetzt hingehen und streicheln (berühren) fängt ihn.

- **Polarfuchs und Polarwolf animiert (Andre, 24.11.2026), bis es eigene Videos gibt:** Der Polarfuchs ist der Silberfuchs,
  aufgehellt (tools/arctic-fox.py, auch das Schlafbild: im Gehege schläft er wie der Fuchs). Der Polarwolf zeigt die
  Bilder des grauen Wolfs, selten den schwarzen Wolf (eigene Variante „schwarzer Polarwolf“); die Wolfsbilder sind ein
  eigenes Paket (wolves), das Wald und Eiswelt laden.

## Seltene Varianten (Andre, 25.11.2026, gebaut 25.11.2026, nicht committet)

Manche Arten gibt es in normaler Größe und selten als großes Exemplar. Nur zwei Stufen (normal und groß), keine
Streuung der Größe und keine Gewichtsangabe. Groß kommt mit etwa **10 %** vor (wie der gefleckte Widder) und gilt als
„selten“ (Meldung, Wünsche, Event).

| Art | Seltene Variante | Unterschied |
|---|---|---|
| Eisbär | großer, alter Eisbär | etwa 1,25-mal so groß, Fell gelblich (alte Männchen sind wirklich gelblich) |
| Schneehase | großes Exemplar (Vorschlag Name: Polarhase, der echte Polarhase ist deutlich größer) | etwa 1,25-mal so groß, gleiche Bilder; Vorschlag: etwas langsamer hoppeln |
| Walross | großer Walrossbulle | etwa 1,25-mal so groß, **von Anfang an rosa** (Walrosse werden wirklich rosa, wenn sie warm sind; alte Bullen sind rosa-braun) |
| Rentier | weißes Rentier mit großem Geweih (reindeer2) | eigenes Bild (Rentier2.webp), Animationen als Videos wie beim Rentier |
| Pinguin, Robbe | haben schon seltene Varianten | bleibt |
| Polarfuchs, Schneeeule, Papageitaucher | keine seltene Variante | bleibt so |

- **Größe:** Skalierung je Variante. Schatten, Berührfläche, Abstand in der Folge-Reihe und Platz im Gehege wachsen mit.
  Etwa 1,25 bis 1,3: weniger sieht man neben einem normalen Tier kaum, mehr sieht im Gehege komisch aus.
- **Fangen:** wie beim normalen Tier, keine zusätzliche Geschicklichkeit. Beim großen Eisbär ist der Abstandsring
  entsprechend größer.
- **Rote Nase beim Rentier:** verworfen (keine natürliche Farbe, jeder denkt an Rudolph).
- **Rentier2 (Andre, 25.11.2026):** Sprites/Rentier2.webp ist ein **weißes Rentier mit großem Geweih** (weiß und großes
  Geweih in einem). Freigestellt nach „Tiersprites Test/views/reindeer2_v0–3“, Standbild public/assets/reindeer2.png
  (92 × 128 wie reindeer, Körper gleich groß, nur das Geweih größer; Aufruf in tools/static-sheet.py). Im Spiel
  eingebaut (25.11.2026, nicht committet) als seltene Variante „weißes Rentier“ (wild 10 %, Animal.js), vorerst nur als
  Standbild: Es trabt ohne Animation mit der Herde. Lauf-, Steh- und Rennanimation folgen (Videos wie beim Rentier,
  dann skinAnims beim Rentier eintragen).

### Umsetzung (25.11.2026)

- **Größe:** Skin mit `big` (1,25), Animal.sizeK; der Skin-Setter skaliert Bild und Schatten, Walross und Eisbär rechnen
  sizeK in ihrem render ein, das Unterwasserfenster auch. Tierbabys sind nie groß (baby 0).
- **Walross und Eisbär:** Fellfarben in coats.js (walrus2, polarbear2, wild 0.1), alle Bilder samt Schlafen, Fressen,
  Warten und Unterwasser werden beim Spielen umgefärbt, kein Download. Bis die Bilder fertig sind (beim Eisbär 8 Bilder,
  auf dem Tablet einige Sekunden), zeigt das Tier die Grundfarbe, aber schon groß. Walross.js und PolarBear.js nehmen
  für Schlaf-, Warte- und Fressbilder den Namen der Variante.
- **Schatten (Andre, 25.11.2026):** Walross und Eisbär hatten zu breite Schatten, die vor dem Körper lagen. Jetzt so breit
  wie der Körper (shadowW 48 bzw. 50) und hinter der Fußlinie unter dem Bauch: Walross 9 Pixel, Eisbär stehend 3,
  schlafend 11 (dort 1,15-mal so lang). Sie wachsen mit sizeK, beim dösenden Walross mit SLEEP_GROW.
- **Großer Eisbär:** Ring und Uhr beim Fressen sind um sizeK größer bzw. höher (PolarBear.keepAway).
- **Polarhase:** snowhare2 mit den Bildern des Schneehasen (tex: 'snowhare'); animSet nimmt dann die Animationen der Art.
  Langsamer hoppeln: nicht gebaut.
- Namen: rosa Walrossbulle (seit 26.11.2026 normal groß, nur rosa), großer alter Eisbär, Polarhase, weißes Rentier. Besucher-Anziehung in visitors.js.
- Kisten-Karte: keine eigenen großen Kartenbilder nötig (Andre, 25.11.2026). Eisbär und Walross erkennt man an der
  Farbe, beim Polarhasen reicht der Name auf der Karte.

### Einfärben (getestet 25.11.2026)

Getestet als Nachbau von recolorPart (src/animals/coats.js) in Python: scratchpad `ice/recolor.py` und `ice/bear2.py`
(Testbilder walrus.png, bear2.png). Am Spielcode ist noch nichts geändert.

- **Walross rosa:** Die automatische Maske „hell und farblos“ passt nicht, das Walross ist mittelhell und leicht braun.
  Eigene Maske: Helligkeit (V) über 0,20–0,30 weich ein (Konturen und Augen bleiben), sehr hell (V 0,72–0,80) und
  farblos (S unter 0,12–0,20) weich aus (Stoßzähne und Barthaare bleiben weiß). Helligkeitsbereich aus dem Standbild
  (Luma ca. 68–176). Farbskala „Lachs“ (132,70,64) → (232,160,146), Ausweichen: „rosa-braun“ (118,72,70) → (212,158,148),
  zu kräftig war (142,66,74) → (240,156,160). Klappt auf Standbild, Rückansicht, Laufen und Schlafen.
- **Eisbär gelblich:** Maske `light` (wie Schaf/weiße Katze). Farbskala (176,156,116) → (250,238,200), etwas heller:
  (176,164,132) → (250,242,218). **Wichtig:** Das Laufbild ist schon im Original dunkler und gräulicher als das Standbild
  (Luma 142–242 statt 158–250). Mit einem Helligkeitsbereich aus dem Standbild wird der laufende Bär braun. Darum braucht
  der Eisbär einen eigenen Bereich je Bild (coats.js rechnet bisher einen Bereich je Gruppe aus dem Standbild).
- Das Wasserbild des Walrosses (walrus_underwater) ist noch nicht getestet.

## Noch offen

- Ist die Kälte (3 Minuten) zu knapp, wenn nachts mehr Tiere unterwegs sind? Andre: „wird sich zeigen“.
- Echte Bilder für Tundra-Boden, Gletscher, Kiesstrand, verschneite Tanne und Schneehöhle (jetzt Platzhalter aus
  tools/ice-grounds.py und tools/ice-placeholders2.py). Die Vogelfelsen sind die Schneefelsen aus dem Bambuswald.
- Wasserflugzeug: beim Teststart direkt in der Eiswelt fehlt sein Bild (es liegt im Dschungel-Paket).
- Eisbär tagsüber in der Schneehöhle (Hügel mit Atemwölkchen) fehlt noch; 
  Polarwolf-Geheul in der Eiswelt.
