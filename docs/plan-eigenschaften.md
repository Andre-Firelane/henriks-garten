# Plan: Eigenschaften der Tiere

Stand: 25.11.2026. Schritte 1 bis 3 gebaut (noch nicht committet), Schritt 4 (Leben im Gehege) offen.

Abweichungen beim Bau:
- **Bürsten ohne Werkzeug** (nach Versuchen mit Bürste im Futterhaus und Bürstenständer: zu viele Dinge zum Anklicken
  nebeneinander): Aktionstaste 3× drücken, je Strich fährt die Bürste über das Tier, drei Punkte unter dem Namensschild
  füllen sich (nach 6 Sekunden ohne Strich von vorn). **Streicheln** dagegen einmal drücken, dauert dann gut eine Sekunde
  (eine Hand streicht zweimal über das Tier). Der Salzleckstein der Weide bleibt.
- Wildpark: die Schilder für Reh und Elch hängen jetzt am Außenzaun neben dem Tor (vorher drinnen beim Futterautomaten).
- **Mavis Tierfreund-Aufgabe** („benennen und streicheln“): solange noch kein Tier benannt ist, gelten alle unbenannten
  Tiere als verschmust (Tafel, Blasen), und das benannte bleibt es (traitIn in GardenScene). Danach zeigen die anderen
  ihre eigene Eigenschaft.
- Symbole: Hand, Ball, Bürste, Futterbeutel (verfressen); unter dem Namen auf der Tafel steht das Wort blasser.
- Eigenschaft steht im Spielstand am Tier (`trait` bei den gespeicherten Tieren) und an der Bindung (`bond.trait`),
  nicht als eigene Liste.
- Code: TRAITS, traitOf, canCare, feedPoints in src/world/friends.js; careFriend, petFriend, startBrushing/brushStroke,
  playBall, updateBall, updateShine, bookTraits in GardenScene; fetch/updateFetch in Animal.js.

## Ziel

Jedes Tier im Tierpark hat eine von 4 Eigenschaften. Sie bestimmt, wie man mit ihm als Tierfreund umgeht. Das bringt
Abwechslung und Persönlichkeit, ohne dass eine Eigenschaft besser ist als eine andere. Spielerisch wichtig wird sie
über die **Wahl des Tierfreunds** und das **Tierbuch**.

## Grundsätze

- **Keine neuen Animationen.** Alles entsteht im Code: Tweens, vorhandene Lauf- und Steh-Animationen, Herzen,
  Partikel, Tierrufe. Keine neuen Bilder (Ball und Bürste gibt es schon).
- **Keine Geschicklichkeit.** Alles klappt beim Drücken der Aktionstaste.
- **Alle Eigenschaften sind gleich viel wert.** Pro Runde (nach der 5-Minuten-Pause) gibt es höchstens 4 Punkte, egal
  welche Eigenschaft.
- Keine Auswirkung auf das Fangen in der Wildnis.

## Die Eigenschaften

| Eigenschaft | Bedürfnis nach der Pause | Aktion | Punkte |
|---|---|---|---|
| Verschmust | Futter + Streicheln | wie heute: Hand am Zaun | Streicheln 1, Futter 1, Lieblingsfutter 3 |
| Verspielt | Futter + Ball | Ball werfen statt streicheln | Ball 1, Futter 1, Lieblingsfutter 3 |
| Eitel | Futter + Bürsten | 3× bürsten statt streicheln | Bürsten 1, Futter 1, Lieblingsfutter 3 |
| Verfressen | nur Futter | nur füttern | Futter 2, Lieblingsfutter 4 |

- Die Bedürfnis-Blasen zeigen statt der Hand einen Ball bzw. eine Bürste. Beim verfressenen Tier gibt es nur die
  Futter-Blase.
- Die Meldungen bei „zu früh“ passen sich an („Lotta möchte gerade nicht spielen.“ / „… nicht gebürstet werden.“).
- Futter aus dem Futterautomaten ins Gehege werfen zählt wie bisher als Füttern (verfressen: 2 Punkte, ohne
  Lieblingsfutter).

## Pro Tier, sichtbar auf der Tafel

- Jedes Tier bekommt seine Eigenschaft **zufällig, sobald es in den Park kommt**, und behält sie (auch beim Umsetzen in
  ein anderes Gehege). Alle 4 gleich wahrscheinlich.
- **Erdmännchen und Ameisenbär** haben kein Futter, sie sind nie verfressen.
- Ältere Spielstände: Tiere ohne Eigenschaft bekommen beim Laden eine. Ein schon benannter Tierfreund wird
  **verschmust**, damit sich für bestehende Freunde nichts ändert.
- Auf der Tafel am Gehegeschild steht die Eigenschaft bei jedem Tier als kleines Symbol (Herz, Ball, Bürste, Napf),
  auch beim Tierfreund oben. **Das ist die Entscheidung beim Benennen.**
- Die Liste fasst gleiche Tiere heute zu einem Knopf zusammen. Künftig wird zusätzlich nach Eigenschaft getrennt
  („Schaf“ mit Ball, „Schaf“ mit Bürste). Gibt es eine Eigenschaft in diesem Gehege nicht, fehlt ihr Knopf.
- Im Spielstand: die Eigenschaft hängt an der festen Tiernummer, z. B. `traits: { 17: 'playful' }`
  (Werte: `cuddly`, `playful`, `vain`, `greedy`).

## Ball (verspielt)

- Mit leerer Hand (oder einem Werkzeug, wie beim Streicheln) am Zaun die Aktionstaste: Henrik wirft einen Ball ein
  Stück ins Gehege, er fliegt im Bogen (Tween) und rollt kurz aus.
- Das Tier läuft mit seiner normalen Lauf-Animation hin, etwas schneller als sonst. Dort hängt der Ball vor seinem Kopf
  (Lage aus Blickrichtung und Größe des Tiers berechnet, wie die Höhe des Namensschilds).
- Es bringt den Ball zum Zaun, lässt ihn fallen (der Ball verschwindet), hüpft einmal, ein Herz steigt auf.
- Man muss den Ball nicht holen. Bleibt der Ball irgendwo hängen (Weg versperrt), verschwindet er nach ein paar
  Sekunden, der Punkt zählt trotzdem.
- Im offenen Streichelzoo genauso, nur ohne Zaun: das Tier bringt den Ball zu Henrik.

## Bürste (eitel)

- Kein Werkzeug: dreimal die Aktionstaste, eine Anzeige mit drei Punkten füllt sich.
- Am Zaun die Aktionstaste: Schrubb-Bewegung wie beim vorhandenen `BrushTool.scrub`, das Tier bleibt stehen und sackt
  kurz zusammen wie beim Streicheln.
- Danach **glänzt das Fell** eine Weile (etwa bis zum Ende der Pause): ab und zu ein paar Funkel-Partikel und ein
  kurzes Aufhellen.

## Tierbuch

- Bei jeder Art 4 Felder (bei Erdmännchen und Ameisenbär 3), eins je Eigenschaft.
- Ein Feld füllt sich, sobald man einen Tierfreund dieser Art mit dieser Eigenschaft hatte (benannt). Ein späterer
  Wechsel nimmt das Feld nicht weg.
- Wie bei den Fellfarben ein Sammelziel, rein zum Vervollständigen.

## Später vielleicht

- Besucherwunsch, eine Aktion zu sehen („Ich möchte mal sehen, wie ein Tier einen Ball holt!“), erfüllt bei einem
  Tierfreund mit passender Eigenschaft. Vorerst weggelassen.

## Leben im Gehege (gefälscht)

Ab und zu (selten, damit es besonders bleibt) machen Tiere derselben Art im selben Gehege etwas zusammen, je nach
Eigenschaft. Nur Tweens und vorhandene Animationen:

- **Zwei verspielte:** Eins läuft dem anderen schnell hinterher (Lauf-Animation, mehr Tempo), dann hüpfen beide
  abwechselnd und drehen sich zueinander.
- **Zwei verschmuste:** Sie stellen sich nebeneinander, eins sackt kurz zusammen, ein Herz steigt auf.
- **Verfressene:** gehen öfter zur Futterstelle und bleiben dort stehen.
- **Eitle:** funkeln ab und zu kurz, auch ohne Bürsten.

Kein Bonus, nur zum Anschauen.

## Umsetzung in Schritten

1. **Eigenschaft je Tier, Tafel und Bedürfnisse:** Spielstand und Umzug alter Stände, Symbole und getrennte Knöpfe auf
   der Tafel, verfressen (nur Futter, mehr Punkte), Blasen und Meldungen.
2. **Ball und Bürste:** Ball werfen und holen, 3× bürsten, Glanz.
3. **Tierbuch.**
4. **Leben im Gehege.**

Jeder Schritt wird auf dem Testport geprüft (tools/screenshot.cjs). Der Tablet-Server bleibt unberührt, committet
wird erst nach „GO“. Alle Texte zweisprachig über `tr()`, im Spiel wird „Henrik“ nie genannt.
