# Plan: Tropenhalle (neues Design für den Dschungel-Teil von `park3`)

Stand: 23.11.2026, umgesetzt (noch nicht committet); was anders wurde als geplant, steht unter „Umsetzung“. Nach Wildpark (plan-wildpark.md), Safari (plan-safari.md),
Streichelzoo (plan-streichelzoo.md) und Bambuswald (plan-bambuswald.md) ist der Dschungel der fünfte und letzte
Bereich mit neuem Design. Offene Fragen stehen unter „Noch offen“ ganz unten.

## Ziel

Jeder umgebaute Abschnitt hat ein eigenes Erlebnis: Im Wildpark laufen die Tiere frei, durch die Safari fährt man,
im Streichelzoo fasst man die Tiere an, im Bambuswald schaut man in Ruhe zu. Im Dschungel ist man **mittendrin**:
Alles liegt in einer großen **Tropenhalle**, in der das Klima des Regenwalds nachgestellt ist. Drinnen ist alles
mit Dschungelpflanzen überwuchert, Vögel, Schmetterlinge und der Ameisenbär sind frei unterwegs.

## Grundsätze

- **Kein Gehegeausbau** (wie bei Safari und Bambuswald): Alles wird gleich in voller Größe gebaut.
- **Besucher setzen sich nicht.** Sie bleiben stehen: an Scheiben, Terrarien und Obsttellern.
- **Keine Geschicklichkeit.** Henrik kann nicht ins Wasser fallen, die Ufer sperren.
- **Kein Wetter.** Der Sprühnebel (siehe unten) ist die Beregnungsanlage der Halle, also Technik, kein Wetter.
- **Kein Puppenkasten** (von Andre gestrichen, 23.11.2026).

## Die Halle

- **Glasdach:** Von oben gesehen ist es durchsichtig, man sieht also immer ins Innere. Gezeichnet werden nur die
  Stahlstreben (feine Linien bzw. Schatten auf dem Boden) und ein paar schräge Lichtstrahlen. Ein Dach, das beim
  Hineingehen ausgeblendet wird, braucht es nicht.
- **Glaswände mit Rahmen** rundherum. Das sind dieselben Glasscheiben-Bilder wie beim Glaspavillon auf der Affeninsel
  (waagerecht, senkrecht, Ecken), dazu evtl. ein Stahlrahmen.
- **Eingang als Schleuse** mit einem Lamellenvorhang aus Plastikstreifen, damit die Schmetterlinge drinbleiben.
  Henrik und die Besucher gehen einfach hindurch, die Streifen wackeln.
- **Boden:** Ein **Holzsteg** (Bohlen) als Weg, der sich durch die Halle schlängelt. Rechts und links wachsen
  Riesenblätter, Farne, Bromelien, Lianen und Urwaldbäume. Die Pflanzen sind dichter als auf der Dschungel-Map.
- **Fluss mit Wasserfall** an der hinteren Wand, mit einer Holzbrücke darüber.

## Tiere

- **Aras und Tukane fliegen frei** durch die ganze Halle (`free: true` wie Pfauen und Schmetterlinge). Die
  Ara- und Tukan-Voliere mit Netzdach fällt weg. Die Obergrenzen bleiben (Aras 4–9, Tukane 3–6). Die Vögel sitzen auf
  Urwaldbäumen und Sitzstangen über dem Steg und fliegen ab und zu quer durch die Halle.
- **Ameisenbär frei:** Er läuft wie die Hirsche im Wildpark auf dem Boden der Halle herum, frisst an Termitenhügeln
  und Urwaldbäumen und tappt auch mal über den Steg. Besucher bleiben dann stehen und schauen. Das
  Ameisenbär-Gehege fällt weg.
- **Jaguar hinter Glas:** Ein Gehege mit einer großen Scheibe zum Steg, dahinter Kletterbäume. Er liegt gern auf einem
  Ast direkt an der Scheibe. Die anderen Seiten sind Felswand oder dichter Bewuchs.
- **Tapir und Okapi** am Fluss mit Badeteich, abgegrenzt durch Wasser und einen niedrigen Holzzaun mit Tor
  (Streicheln, Füttern und Tierfreunde wie an jedem Gehege).
- **Terrarien in der Halle:** Schlange, Leguan und Vogelspinne bekommen Glasterrarien direkt am Steg (die vorhandenen
  Bilder aus tools/terrarium-glass.py). Das **Reptilienhaus fällt weg**: die Map `reptiles` und die Tür in der Fassade
  im Dschungel-Bereich. Tiere, die schon dort leben, ziehen in die Halle um.
- **Piranhas:** Das Piranha-Becken wird ein Stück Fluss mit einer Glasscheibe zum Steg.
- **Schmetterlinge:** **2/3 der Schmetterlinge** aus dem bestehenden Schmetterlings-Gehege flattern in der Halle, 1/3
  bleibt im Park bei den Blumen. Es bleibt ein einziges Gehege, das nur zwei Bereiche hat.

## Schmetterlinge in der Halle

- **Obstteller** auf Pfosten (halbe Orangen, Bananenstücke), dazu tropische Blüten: Dort setzen sich die
  Schmetterlinge hin. Besucher bleiben stehen und schauen wie bei den Pfauen, meist gibt es ein Herz.
- **Schmetterling landet auf einem Besucher:** Ab und zu setzt sich einer auf Kopf oder Schulter eines Besuchers. Der
  Besucher bleibt stehen, freut sich und gibt Herzen. Es ist ein reiner Effekt, Henrik muss nichts tun.

## Sprühnebel

- Etwa alle **4 Minuten** geht die Beregnungsanlage für etwa **30 Sekunden** an: Feiner Nebel sinkt von der Decke, die
  Blätter glitzern, Wassertropfen fallen von den Riesenblättern.
- Die Tiere reagieren darauf: Die Aras plustern sich und baden, die Schmetterlinge setzen sich hin, der Ameisenbär
  bleibt stehen.
- Besucher in der Halle staunen und geben ein Herz mehr (wie beim Laternenabend).
- **Ohne Neuladen der Map:** Der Nebel ist eine Überlagerung über der laufenden Map wie der Laternenabend
  (FireflyEvening) und wird ein- und ausgeblendet. Eine leise Zisch-Geräuschspur läuft kurz über den Dschungel-Ambient.
- Der Nebel gibt es nur in der Halle. Außerhalb sieht und hört man nichts davon.

## Neue Bilder

- Glasscheiben und Stahlrahmen (z. T. von der Affeninsel), Stahlstreben bzw. Dachschatten, Lichtstrahlen
- Lamellenvorhang (Schleuse)
- Holzsteg (Bohlen, gerade, Kurven, Brücke)
- Obstteller auf einem Pfosten, tropische Blüten
- Scheibe für Jaguar und Piranhas, Sitzstangen für Aras und Tukane
- Nebel und Tropfen (evtl. als Partikel ohne eigenes Bild)

## Entschieden (23.11.2026)

- **Alles in der Halle:** Die Halle nimmt den ganzen Dschungel-Teil von `park3` ein.
- **Deko und Buden**, die heute im Dschungel-Teil stehen, werden erstattet.
- **Kein NPC** in der Halle. Der Nebel erklärt sich von selbst.
- **Affen in der Halle:** Die Affeninsel behält alle Affenarten. Die Halle bekommt zusätzlich ein **zweites Gehege für
  Brüllaffen** (mit Gibbons als seltener Variante, wie bisher), so wie die Rifffische im Aquarium in zwei Becken leben
  (`tankBig` und `tank1`). Eine kleine Gruppe von **4–6 Tieren**, frei (`free: true` wie Aras und Tukane): Sie bleiben
  oben in Baumkronen und Lianen über dem Steg und kommen nie auf den Boden. Kein Tor, kein Streicheln oder Füttern.

## Noch offen

- Nichts. Der Plan ist fertig zum Bauen.

## Umsetzung (23.11.2026)

- **Tapir und Okapi laufen auch frei** (Wunsch von Andre beim Bauen): Das Tapir-Gehege fällt weg. Ein einziges offenes
  Gehege `junglehall` (wie der Wildpark, `open` und `visitors`) beherbergt Aras, Tukane, Ameisenbären, Tapire, Okapis und
  die Brüllaffen. Lieblingsorte (`zones`): Tapire am Teich, Okapis oben links, Ameisenbären unten links.
- **Lage:** Die Halle liegt auf den Spalten 60 bis 94 und den Zeilen 60 bis 96 von `park3`. Links davon bleibt das
  Pandagehege, wie es ist. Davor liegt ein Rasenstreifen, unten links (früher Tapir-Gehege) ein Kirschgarten mit
  Steinlaternen, Platz für Deko und Buden.
- **Eingänge:** Oben ist ein zwei Kacheln breiter Haupteingang mit Torbogen und Schild „Tropenhalle“ (Bild vom
  Wildpark-Bogen), unten ein schmaler. Beide haben einen Lamellenvorhang (`gate: 'curtain'`).
- **Holzsteg:** Der Weg in der Halle ist der Holzboden der Dschungel-Hütte (`planks_jungle`, Weg der Bodenzone).
- **Wasserfall und Teich** an der Rückwand, klares Wasser mit Seerosen (wie der Koi-Teich). Die Tapire baden darin.
  Eine Brücke gibt es nicht, ein Aussichtssteg führt ans Ufer.
- **Glaskästen:** Die Terrarien und das Piranha-Becken sind dieselben Glaskästen wie im Reptilienhaus (`buildings` im
  Abschnitt) und stehen nebeneinander am unteren Steg. Die Piranhas schwimmen im Wassertank, nicht in einem Stück Fluss.
- **Jaguar** unten rechts hinter Glaswänden, mit Glastür am Steg (ohne Katzenklappe; die gibt es nur beim Katzenhaus).
- **Brüllaffen (`canopy`):** Sie sitzen sichtbar oben in den Urwaldbäumen der Halle und springen ab und zu auf einen
  anderen Baum, manchmal mit Brüllen. Zum Futter der Besucher und zu Henrik kommen sie nicht herunter, gestreichelt
  werden können sie nicht. Neue Brüllaffen ziehen dorthin, wo Platz ist (Halle 5, Affeninsel 13).
- **Gehegewahl allgemein:** Gibt es für eine Art mehrere Gehege, zieht ein Tier zuerst in eins mit freiem Platz
  (`pickPen`, `parkPenFor` mit Zählung). Das betrifft die Brüllaffen und die Schmetterlinge.
- **Schmetterlinge:** Im Zentrum sind es höchstens 4, in der Halle 8 (`hallbutterflies` mit `within`). Sie setzen
  sich auf die Obstteller und ab und zu auf einen Besucher, der gerade vor einem Gehege steht. Er bleibt dann stehen und
  gibt 2 Herzen.
- **Großer Strauch mit riesigen Blättern** (Wunsch von Andre beim Bauen, Zeichen `Ǫ`, Bild `jungle_shrub` aus der
  kleinen Bodenpflanze) steht verteilt in der Halle.
- **Spielzeug** an festen Plätzen (`toysAt`): zwei Termitenhügel, Schaukelringe, Melonen und ein Salzleckstein am Teich.
- **Glasdach:** Feine Stahlstreben hoch oben, nur über der Grundfläche der Halle, dazu ihr Schatten am Boden und
  pulsierende Lichtstrahlen (`src/world/JungleHall.js`).
- **Sprühnebel:** Etwa alle 4 Minuten (der erste nach 25 bis 60 Sekunden) sprüht es 30 Sekunden. Es gibt einen weißen
  Schleier, Tropfen und glitzernde Blätter, dazu leise das Wasserfall-Rauschen, nur in der Halle hörbar. Die
  Schmetterlinge setzen sich hin, Aras und Tukane schütteln sich, die Besucher geben ein Herz mehr. Die Map wird dabei
  nicht neu geladen.
- **Geräusche:** In der Halle hört man den Dschungel (`ambientZone`), draußen den Bambuswald.
- **Alte Spielstände** (`migrateJungleHall` in save.js): Die Tierfreunde aus Voliere, Ameisenbär- und Tapir-Gehege
  ziehen mit. Die Tiere des Reptilienhauses kommen in die Glaskästen der Halle, 2/3 der Schmetterlinge in die Halle (der
  Tierfreund bleibt im Zentrum). Deko und Buden im umgebauten Teil kommen zurück in die Bauen-Leiste. Wer im
  Reptilienhaus gespeichert hat, ist beim Laden im Bambuswald.
- **Neue Bilder** (Platzhalter, `tools/junglehall-placeholders.py`, Kopien in `Claude-Sprites/Dschungel und
  Bambuswald`): Lamellenvorhang (`gate_curtain_x/y`) und großer Strauch (`jungle_shrub`). Den Obstteller (`fruit_plate`)
  hat Andre gezeichnet (`tools/fruit-plate.py` stellt ihn frei und setzt ihn ein).
