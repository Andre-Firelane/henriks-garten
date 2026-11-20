# Plan: Streichelzoo (neues Design für den Wiesenbereich im Tierpark)

Stand: 21.11.2026, umgesetzt (noch nicht committet), siehe „Umsetzung“ unten. Dritter Bereich mit neuem Design nach dem
Wildpark (plan-wildpark.md) und der Safari (plan-safari.md).

## Ziel

Der Wiesenbereich wird ein **Streichelzoo**. Die heutige Weide ist der Streichelzoo: ein offener, eingezäunter Bereich
wie der Wildpark, in dem die Tiere frei herumlaufen. **Besucher gehen hinein und streicheln die Tiere.** Das bringt
Herzen.

## Tiere

- **Schafe** wie bisher.
- **Kuh, Ziege und Schwein** als neue, eigene Tierarten. Die Bilder und Animationen gibt es schon (Bauernhof-Event,
  `farm_cow`, `farm_goat`, `farm_pig`). Babys sind wie bei allen Tieren die kleinere Ausgabe der Eltern.
- **Katzen:** Das Katzenhaus liegt mitten im Streichelzoo. Die Tür ist offen, Besucher gehen auch hinein und streicheln
  die Katzen.
- **Schmetterlinge** flattern wie bisher frei durch den Park. Daran ändert sich nichts.
- **Maulwürfe fliegen ganz aus dem Spiel** (siehe „Alte Spielstände“).
- **Reiher:** Die Reiher-Voliere bleibt, wo sie ist, im Wiesenbereich neben dem Streichelzoo (nicht darin). Andre hat
  das so entschieden.

Grobe Skizze (von oben, nicht maßstäblich):

```
 ┌───────────────────────────────────────────┐
 │  ┌────────────┐                           │
 │  │ KATZENHAUS │   Schafe, Ziegen          │
 │  │ (Tür offen)│        laufen frei        │
 │  └────────────┘                           │
 │        Heu-Unterstand        Kühe         │
 │                                           │
 │   Schweine     ≈≈ Matschloch ≈≈           │
 │                                           │
 └─────────────[ TOR „Streichelzoo“ ]────────┘
                 Tafel: alle Tiere
```

## Wie das Streicheln aussieht

- Ein Besucher geht durchs Tor hinein und sucht sich ein Tier aus, das gerade steht oder grast.
- Er stellt sich neben das Tier. Das Tier bleibt kurz stehen und dreht sich zu ihm.
- Ein paar Sekunden lang wird gestreichelt, dabei steigen Herzen auf. Dann geht der Besucher weiter, zum nächsten
  Tier oder wieder hinaus.
- Gestreichelt wird nur von selbst. Henrik muss nichts tun, es gibt keine Geschicklichkeit und kein Timing.
- **Wie viele Herzen?** Ein gestreicheltes Tier bringt mehr als ein Tier, das man nur anschaut, weil Schafe und Kühe
  sonst wenig anziehen (`APPEAL` in world/visitors.js: Schaf 1, Katze 1,2). Vorschlag: Streicheln zählt doppelt.
- Besucher laufen im Streichelzoo auch über Gras, nicht nur auf Wegen, sonst kommen sie nicht an die Tiere heran.
  Das ist neu, im Wildpark bleiben sie auf den Wegen.
- Es streicheln höchstens so viele Besucher gleichzeitig, wie Tiere da sind. Jedes Tier hat zur selben Zeit nur einen
  Besucher.

## Ausbau

Entfällt: Der Gehegeausbau ist seit dem Wildpark abgeschaltet (`PEN_UPGRADES = false`), alle Gehege gelten als
ausgebaut. Der Streichelzoo hat gleich alle Plätze und seine Ausstattung (Heu-Unterstand, Heuballen, Kratzpfahl,
Salzleckstein). Die Id `pasture` bleibt trotzdem, damit alte Spielstände passen.

## Draußen auf der Wiese (die Welt zum Fangen)

- Kühe, Ziegen und Schweine leben jetzt auch draußen auf der Wiese, aber nur selten (Gewichte 0,15 bis 0,2, Schaf 5,5).
  Man fängt sie wie Schafe (Berühren oder Lasso). Solange Mavis Aufgaben auf der Wiese laufen, kommen ohne Event gar
  keine (dort soll man Schafe, Katzen usw. fangen).
- Das Bauernhof-Event kostet jetzt 50 statt 100 Herzen, weil es die Hoftiere auch ohne Event gibt.
- **Bauernhof-Event:** Früher verkleideten sich dabei die Schafe. Jetzt kommen während des Events statt neuer Schafe
  reihum Kühe, Schweine und Ziegen auf die Wiese. Mavis Schaf-Aufgabe bekommt weiter echte Schafe.
- Maulwürfe und Maulwurfshügel gibt es nicht mehr.

## Alte Spielstände

Neue Umzugsfunktion in `save.js` (Merker `game.pettingZoo`, wie `migrateWildpark`):

- **Maulwürfe:** Aus allen Gehegen, den Begleitern, den Fallen und den gespeicherten freien Tieren aller Welten
  entfernen. Aus `caughtSpecies`, `seenSpecies`, `caughtIn`, `catches`, `tipsSeen` und `bookNew` streichen.
  `rarePromise` mit Maulwurf wird gelöscht, `heartsBy.mole` auch (die Herzen selbst bleiben). Das Tierbuch zeigt den
  Maulwurf nicht mehr, der Fortschritt (x von y) rechnet ohne ihn.
- **Verkleidete Schafe:** Wer beim Bauernhof-Event eine Kuh, Ziege oder ein Schwein gefangen hat, hat heute ein Schaf
  mit `farm: 'cow'` usw. Diese Tiere werden zu echten Kühen, Ziegen und Schweinen (im Gehege, bei den Begleitern und
  im Wagen einer laufenden Expedition). Die Arten zählen dann als gefangen. Ihre Herzen bleiben in der Statistik beim
  Schaf (welche Herzen von welchem Tier kamen, lässt sich nicht mehr trennen).
- Getestet: Ein alter Spielstand mit 3 Maulwürfen im Gehege, einem Maulwurf draußen und als Begleiter, verkleideten
  Schafen im Gehege und als Begleiter lädt ohne Fehler. Die Maulwürfe sind weg, aus den verkleideten Schafen sind Kuh,
  Schwein und Ziegen im Streichelzoo geworden, das Tierbuch zählt 59 Arten.

## Umsetzung (21.11.2026)

- **Karte (PARK_ROWS):** Zaun um Weide und Katzenhaus (Spalten 39 bis 54, Zeilen 24 bis 45). Der alte Innenzaun und die
  Wegstücke um das Katzenhaus sind jetzt Wiese. Der Teich mit Schilf liegt im Streichelzoo. Eingang ist das alte
  Tor am Hauptweg (39,39 und 39,40, eine Kachel über dem alten Weidetor, damit der Torbogen nicht den Wegweiser verdeckt) mit dem Torbogen des Wildparks und der Schrift „Streichelzoo“. Der
  Futterautomat steht innen neben dem Tor (40,43).
- **Gehege:** `pasture` ist offen (`open`), mit `petting` und `visitors`. Plätze: Schaf 14, Ziege 5, Schwein 4, Kuh 3.
  Das Katzenhaus (`cats`) bekommt auch `petting` und `visitors`, Besucher gehen durch die Glastür hinein.
- **Tierarten:** `cow`, `pig`, `goat` in SPECIES (Animal.js), sie benutzen die Schaf-Klasse (Sheep.js, grasen).
  Sie laden mit einem eigenen Paket `farm` (BootScene), das Wiese und Tierpark immer mitladen. Spielzeug: Ziege und
  Schwein am Kratzpfahl, die Kuh am Salzleckstein.
- **Streicheln (Visitor.js):** Das Wegnetz der Besucher bekommt im Streichelzoo alle freien Kacheln dazu. Der Besucher
  geht zum Tor, sucht sich dort eins der nächsten freien Tiere aus (nicht beim Fressen, Spielen oder oben auf dem
  Kratzbaum) und geht hin. Das Tier bleibt stehen (`petted`) und schaut ihn an. Er streichelt 4 bis 6,5 Sekunden
  (wiegt sich dabei), nach der Hälfte kommt ein Herz (mit Baby beim Tierbaby-Event mehr). Nach 2 Tieren geht er weiter.
  Besucher öffnen die Tore des Streichelzoos und des Katzenhauses.
- **Entfernt:** Mole.js, die Maulwurf-Art, ihr Bild-Laden und die Maulwurfplätze in map.js. Die Bilddateien
  `mole.png` und `mole_mound.png` liegen noch in public/assets.

## Noch offen

1. **Weitere Tiere** wie Kaninchen, Hühner, Esel oder Ponys bräuchten neue Bilder. Später.
2. **Henrik und das Streicheln:** Henrik streichelt nicht selbst (die Bürste gibt es schon für Tiere im Gehege).
3. **Eigenes Bild für den Torbogen:** vorerst der Torbogen des Wildparks mit anderer Schrift.
4. **Matschloch für die Schweine** (gibt es beim Wildschwein schon als Bild) wäre ein schönes Extra.
