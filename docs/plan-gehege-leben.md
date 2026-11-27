# Plan: Leben im Gehege

Stand: 27.11.2026. Schritt 1 gebaut (noch nicht committet). Ersetzt und erweitert Schritt 4 aus docs/plan-eigenschaften.md.

Schritt 1 beim Bau (src/animals/penLife.js, eingehängt in Animal.pickWander und Animal.update):
- Lieblingsplätze werden aus der Karte gesucht: freie Kachel am Wasser (`w`, `~`) und neben Bäumen, Felsen, Büschen,
  Spielzeug; je Gehege 1 Wasser- und bis zu 3 Schattenplätze. Am Wasser trinkt es (Kopf nickt, Ringe auf dem Wasser),
  danach schüttelt es sich manchmal.
- Herde: das älteste Tier der Art im Gehege führt, die anderen ziehen kurz nach ihm los oder bleiben stehen; zu weit
  weg laufen sie zu ihm (schräg an Hindernissen vorbei), und das Leittier wartet auf Nachzügler. Gilt auch in Gehegen
  mit Lieblingsort der Art (zones, Safari); dort entscheidet das Leittier wie bisher. **Nicht im Streichelzoo** (petting): dort verteilen sich
  die Tiere, weil Besucher zu ihnen gehen; Lieblingsplätze dort seltener (15 %) und weiter gestreut.
- Tierbabys bleiben dicht bei einem Erwachsenen.
- Ruhephase je Gehege alle 3–6 Minuten für 35–60 s: zum Schatten und ruhen, keine Momente.
- Momente (nur sichtbar, alle 25–70 s je Tier): hüpfen, rennen (Staub), schütteln (nur im Stehen); welche Art was darf,
  steht in HOP, RUN, SHAKE. Nicht, solange das Tier etwas Eigenes macht (BUSY: schlafen, grasen, klettern …).
- Schlafen: Fuchs, Polarfuchs, Katze, Löwe, Eisbär, Walross schlafen schon mit eigenem Bild (deren Klassen).
- Schläfchen (gebaut 27.11.2026, penLife.js NAP): Reh/Hirsch, Schaf/Widder, Antilope, Zebra, Okapi, Pinguin, Rentier,
  Tanuki, Wolf legen sich nach 1,2 s Stillstand hin – in der Ruhephase immer (bis zu deren Ende), am Schattenplatz sonst
  zu 40 % (10–18 s). Liegendes Standbild <Bild>_sleep (tools/sleep-sheets.py), darüber steigen abwechselnd Z und z auf.
  Futter, Spielzeug, Besucher, Henrik wecken es; Streichelzoo-Besucher lassen Schlafende in Ruhe. Fellfarben von Schaf
  und Reh färben das Schlafbild mit um. Varianten ohne eigenes Bild (Oryx, Schoko-Zebra, Streifen-Okapi, Felsenpinguin,
  weißes Rentier, Fuchs-Tanuki, schwarzer Wolf, Polarwolf) ruhen weiter im Stehen.

## Ziel

Tiere sollen im Gehege nicht nur herumstehen und zufällig laufen, sondern darin leben: Sie haben Lieblingsplätze,
Herdentiere ziehen gemeinsam, verspielte jagen sich, verschmuste schmusen, und Mavi füllt ab und zu die Tröge auf.
Wichtig ist das **Zufällige**: Man soll beim Herumlaufen auf solche Momente stoßen, es gibt keine festen Zeiten und
keine Ankündigung.

## Grundsätze

- **Kaum neue Bilder.** Fast alles entsteht im Code: Tweens auf den vorhandenen Bildern, vorhandene Lauf-, Steh- und
  Fress-Bilder, kleine Partikel. So wirkt es für alle Arten, Varianten und Fellfarben (Umfärben bleibt gleich).
- **Ausnahmen mit neuen Bildern:** Schlafbilder (wie beim Fuchs) und Mavi mit Eimer (siehe unten).
- **Keine neuen Klickflächen** im Park, keine Geschicklichkeit, kein Bonus: nur zum Anschauen.
- **Keine Zufriedenheits-Anzeige** über das Verhalten (zu kompliziert, vorerst nicht).
- **Tablet:** Verhalten nur für Tiere auf dem Bildschirm oder knapp daneben berechnen, einfache Zustände mit Zeitgebern,
  keine Wegsuche in jedem Bild.

## 1. Bewegungen aus Tweens

| Verhalten | Umsetzung |
|---|---|
| Fressen | vorhandenes Fress-Bild (`eatTexture`), sonst kurzes Nicken (kleines Auf und Ab), ein paar Krümel |
| Freudensprung | Bild hüpft, Schatten bleibt am Boden, Staubwölkchen bei der Landung |
| Schütteln | schnelles Hin und Her, Wassertropfen (nach der Wasserstelle) |
| Rennen | Lauf-Animation schneller, mehr Tempo, Staub hinter dem Tier |
| Nasenstupser | zwei Tiere drehen sich zueinander, gehen kurz aufeinander zu, ein Herz |
| Pinguin rutscht | Bild gedreht, gleitet ein Stück übers Eis |

**Schlafen nicht über Tweens** (umgekippte Standbilder sehen komisch aus). Schlafen nur mit eigenem Schlafbild
`<art>_sleep`. Vorhanden: fox, fox2, arcticfox, cat, cat2, lion, lion2, polarbear, walrus. Weitere Arten bekommen
Schlafen, sobald Andre Bilder liefert. Arten ohne Schlafbild ruhen im Stehen (Steh-Bild, seltener laufen).

## 2. Das Gehege als Ort

- **Lieblingsplätze:** Jedes Gehege bekommt 3–4 unsichtbare Punkte: Wasserstelle, Schatten, Felsen/Ausguck, Trog
  (Futterstelle). Tiere wählen ihr nächstes Ziel meist unter diesen Punkten (mit etwas Streuung), nicht völlig zufällig.
  Punkte möglichst aus der Karte ableiten (Wasser, Bäume, Futterautomat), sonst je Gehege von Hand eintragen.
- **Ruhephasen:** Ab und zu (zufällig, je Gehege) gibt es eine ruhige Phase: Die meisten gehen zum Schatten und ruhen
  bzw. schlafen, danach wird es wieder lebhafter.
- **Herden** (z. B. Zebra, Antilope, Gnu, Rentier, Schaf, Ziege, Reh, Elch): Ein Leittier wählt das Ziel, die anderen
  folgen mit lockerem Abstand und halten ungefähr gleichzeitig an. Tierbabys bleiben dicht bei einem Erwachsenen.
- Keine eigene Einzelgänger-Regel (fällt kaum auf).

## 3. Eigenschaften im Gehege

Ab und zu, selten genug, dass es besonders bleibt. Nur Tiere derselben Art im selben Gehege.

- **Verspielt:** Fangen: eins rennt weg, das andere hinterher, dann wird getauscht; am Ende Freudensprünge, beide
  drehen sich zueinander. Liegt ein Ball im Gehege, stupst es ihn auch mal allein an.
- **Verschmust:** Schmusen im Stehen: zwei stellen sich dicht nebeneinander, drehen sich zueinander, Nasenstupser, ein
  Herz steigt auf. Mit Schlafbild auch nebeneinander schlafen.
- **Eitel:** stellt sich an den Zaun, wo Besucher stehen, dreht sich einmal, funkelt kurz. Oder steht an der
  Wasserstelle.
- **Verfressen:** geht öfter zum Trog und bleibt dort, ist beim Auffüllen als Erstes da und drängelt die anderen etwas
  zur Seite; bettelt am Zaun, wenn man vorbeigeht.

## 4. Mavi füllt die Tröge auf (Ausnahme von der NPC-Regel)

Normalerweise bewegen sich NPCs nicht. **Mavi ist dafür die einzige Ausnahme:** Sie läuft mit einem Eimer in der Hand
zu einem Trog und füllt ihn auf.

- **Erst nach dem Tutorial.** Danach kann man ohnehin nicht mehr mit ihr sprechen, unterwegs also auch nicht.
- **Gebiet:** immer das Parkgebiet, in dem man gerade ist, außer im Aquarium.
- **Laufen ohne eigene Animation**, so wie die Parkbesucher laufen (Visitor.js): ihr Standbild wandert über die Wege,
  mit Eimer in der Hand. Neue Bilder für sie vorerst keine (höchstens den Eimer als kleines Bild dazu).
- Zufällig, ohne Ankündigung, kein Ereignis zu festen Zeiten; etwa alle 3–5 Minuten ein Gehege.
- Die Tiere sehen sie schon von weitem: heben den Kopf, drehen sich zu ihr, rennen zur Futterstelle (verfressene
  zuerst) und fressen dort.
- **Futterstellen:** Gehege mit Heuhäuschen (das große Spielzeug mit mehreren Plätzen, z. B. Safari) nutzen dieses.
  Gehege ohne Heu bekommen einen **Trog nahe am Zaun-Tor**. Trog mit 3 Bildern: voll, halb, leer; leert sich langsam,
  wenn Tiere daran fressen. Keine neue Klickfläche.
- Danach geht sie zurück an ihren Platz.

## 5. Kleine Dinge

- Fußspuren im Schnee, die langsam verblassen.
- Wasserringe beim Trinken an der Wasserstelle.
- Gras/Büsche wackeln, wenn ein Tier durchläuft.
- Blickrichtung: Tiere schauen manchmal zu einem selbst oder zu einem Besucher.
- Tierrufe gibt es schon.

## Häufigkeit

Pro Gehege alle paar Minuten ein besonderer Moment (Fangen, Schmusen, eitel am Zaun …), Mavi etwa alle 3–5 Minuten.

In Gebieten, in denen Mavi sonst nicht steht, kommt sie vom Eingang des Gebiets herein und geht danach dorthin zurück.

## Umsetzung in Schritten

1. **Lieblingsplätze, Herden, Ruhephasen** und die Grundbewegungen aus Tweens (Fressen, Hüpfen, Schütteln, Rennen).
   Schlafen für die Arten mit Schlafbild.
2. **Eigenschaften im Gehege** (Fangen, Schmusen im Stehen, eitel am Zaun, verfressen am Trog).
3. **Futterstellen:** Heuhäuschen nutzen, Tröge am Tor für Gehege ohne Heu, Füllstand, Tiere rennen hin.
4. **Mavi mit Eimer** (läuft wie die Besucher, erst nach dem Tutorial, nicht im Aquarium).
5. **Kleine Dinge** (Spuren, Wasserringe, Gras, Blickrichtung).

Jeder Schritt wird auf dem Testport geprüft (tools/screenshot.cjs). Der Tablet-Server bleibt unberührt, committet
wird erst nach „GO“. Alle Texte zweisprachig über `tr()`, im Spiel wird „Henrik“ nie genannt.
