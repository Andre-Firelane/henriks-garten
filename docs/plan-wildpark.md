# Plan: Wildpark (neues Design für den Waldbereich im Tierpark)

Stand: 20.11.2026, umgesetzt (noch nicht committet); offen sind die Punkte unter „Noch offen“ ganz unten. Der Waldbereich ist der erste Bereich, der ein neues Gehege-Design bekommt,
noch vor der frei setzbaren Deko (siehe plan-deko.md).

## Ziel

Der Waldbereich wird ein **Wildpark**. Statt einer Reihe einzelner Gehege gibt es einen großen, eingezäunten Ort mit
Tor, in dem man spazieren geht. Er soll sich **wie ein Wald anfühlen**: deutlich mehr Bäume als heute, Wege dazwischen,
eine Lichtung in der Mitte.

## Aufbau

- **Außenzaun** um den ganzen Wildpark: der vorhandene Wildzaun (`[` `]`, wie am Wolfswald). Andre gefällt er so, es
  braucht keinen neuen Metallzaun.
- **Großes Tor** als Eingang. Darüber hängt ein Schild mit „Wildpark“ (englisch „Wildlife Park“).
- **Viele Bäume** im ganzen Park, zwischen Wegen und Gehegen. Laub- und Nadelbäume gemischt, dazu Büsche, Farn und Pilze.
- **Rehe und Elche laufen frei** im Wildpark herum, auf Wegen, zwischen Bäumen und auf der Lichtung. Elche hätten
  eigentlich ein eigenes Gehege, aus Platzgründen laufen sie aber mit den Rehen frei.
- **Die anderen Tierarten haben eigene Gehege im Park**, mit leichten Holzzäunen. So sieht es nicht nach Käfig im
  Käfig aus.
  - Wildschwein (Schlammloch, Eiche)
  - Fuchsbau
  - Eichhörnchen- und Igel-Voliere
  - Biber am Bach
- **Wolfswald bleibt, wie er ist:** am hinteren Rand, und er geht hinten in den dunklen Wald über. Sein Zaun ist Teil
  der Grenze des Wildparks.
- **Ein kleiner Bach** kommt durch den Außenzaun herein, fließt durch das Biber-Gehege und endet im Teich auf der
  Lichtung. An den Stellen, wo der Bach durch einen Zaun geht, sitzt ein Gitter im Wasser.
- **Lichtung im Zentrum:**
  - Teich mit den gefangenen Fischen, um den Teich herum hüpfen die Frösche (nicht eingezäunt)
  - Bänke
  - freie Fläche für Deko
  - Die Rehe dürfen über die Lichtung laufen und am Teich trinken.

Grobe Skizze (von oben, nicht maßstäblich):

```
            dunkler Wald (Hintergrund)
 ┌──────────────┬──────────────────────────────────┐
 │  WOLFSWALD   │  Bäume Bäume Bäume   ┌─────────┐ │
 │  (geht hinten│                      │ Voliere │ │
 │  in den Wald)│  ┌────────────┐      └─────────┘ │
 ├──────────────┘  │ Wildschwein│   Bäume          │
 │  Bäume          └────────────┘        ~~~~~~~~~~~~ Bach kommt rein
 │                   ┌──────────┐   ┌──Biber──~~~┐ │
 │ ┌───────┐  Bäume  │ LICHTUNG │~~~│  ~~~~      │ │
 │ │ Fuchs │         │  Teich   │   └────────────┘ │
 │ └───────┘         │  Bänke   │       Bäume      │
 │   Bäume           └──────────┘                  │
 │        Rehe und Elche laufen überall frei       │
 └────────────────[ TOR „Wildpark“ ]───────────────┘
                     Tafel: Rehe, Elche
```

## Schild und Ausbau

- **Tafel neben dem Tor** mit der Anzahl der Rehe und Elche (wie die Schilder an den anderen Gehegen, die auch am
  Eingang stehen). Das „Wildpark“-Schild über dem Tor ist nur der Name.
- **Ausbau wie bisher am Hauptrechner.** Der Ausbau des Wildparks bringt mehr Plätze für Rehe und Elche und eine
  Futterkrippe auf der Lichtung. So wird beim Ausbau die Lichtung sichtbar schöner.
- Die eigenen Gehege im Park (Wildschwein, Fuchs, Voliere, Biber, Wolf) behalten ihre Schilder und ihren eigenen
  Ausbau.

### Ausbaustufen ohne Innenzäune

Heute ist der Teil, der erst mit dem Ausbau dazukommt, mit einem eigenen Innenzaun abgetrennt. Die Stufen sind
sinnvoll, die extra abgezäunten Flächen sehen aber hässlich und unstimmig aus. Neu:

- **Vor dem Ausbau** ist dieser Teil mit dichtem Grün gefüllt: Bäume, Sträucher, Farn. Er sieht aus wie ein Stück
  Wald, das noch zugewachsen ist. Tiere und Henrik kommen nicht hinein.
- **Der Ausbau lichtet ihn:** Das Dickicht verschwindet, der Platz gehört zum Gehege, und die Ausstattung des Ausbaus
  kommt dazu.
- Technisch ersetzt das Dickicht den Innenzaun in `basic` (die Kacheln vor dem Ausbau). Es muss dicht genug sein, dass
  kein Tier durchläuft. Die festen Füller (`1`, `2`, `5`) blockieren schon heute.
- Zuerst im Wildpark. Gefällt es, bekommen auch die Gehege der anderen Welten Dickicht in ihrem Stil statt
  Innenzäunen (Savanne: Dornbüsche und Gras, Asien: Bambus).

## Was sich an den Gehegen ändert

| heute | im Wildpark |
|---|---|
| Hirsch- und Elchgehege (eigene Weide) | Rehe und Elche frei im ganzen Wildpark |
| Teich mit Fröschen, Fischen und Bibern (ein Gehege) | Biber-Gehege am Bach; Fische und Frösche am offenen Teich auf der Lichtung |
| Wildschwein, Fuchs, Voliere | bleiben eigene Gehege, neu im Park verteilt |
| Wolfswald | bleibt, wie er ist |

**Spielstand:** Tiere aus dem alten Teich-Gehege müssen beim Laden umziehen (Biber ins Biber-Gehege, Fische und
Frösche an den Teich auf der Lichtung). Kein Tier darf verloren gehen.

## Technische Punkte

- **Platz:** Erst in der heutigen Fläche planen (PARK_ROWS, Spalten 0–23, Zeilen 23–58, rund 860 Kacheln). Das
  Rehgehege fällt weg, die Wege um die Gehege werden zu Wegen im Park. Grobe Rechnung:

  | Teil | Kacheln (mit Zaun) |
  |---|---|
  | Wolfswald, unverändert | ~145 |
  | Voliere | ~100 |
  | Wildschwein | ~70 |
  | Biber am Bach | ~60 |
  | Fuchs | ~55 |
  | Lichtung mit Teich | ~65 |
  | Bach | ~20 |
  | Wege im Park | ~60 |
  | Außenzaun | ~110 |
  | **Rest für Bäume und frei laufende Rehe** | **~180** |

  Das ist knapp, aber machbar, wenn die Gehege ihre heutige Größe behalten. Das Dickicht vor dem Ausbau zählt zur
  Gehegefläche und bringt zusätzlich Wald ins Bild. Nur falls die Kachel-Skizze zeigt, dass es nicht passt, wird der
  Bereich vergrößert (Spalten links oder Zeilen zwischen Savanne und Asien). Das verschiebt Kachelangaben anderer
  Gehege und braucht dann eine Hilfsfunktion.
- **Wildpark als Gehege:** Der Wildpark selbst ist das Gehege der Rehe und Elche (Flood-Fill vom Startpunkt, begrenzt
  vom Außenzaun). Die Zäune der inneren Gehege grenzen ihre Flächen davon ab.
- **Frei laufende Rehe:** Sie laufen ähnlich wie die Pfauen, aber nur innerhalb des Außenzauns. Bäume und
  Gehegezäune blockieren.
- **Besucher laufen nur auf Wegen**, wie überall. Die Wege im Wildpark gehören dazu, Lichtung und Rasen nicht.
- **Wolfswald:** Der vermutete Fehler war keiner: Das Test-Skript hatte eine veraltete Fassung des Spielstand-Moduls
  erwischt. Mit dem richtigen Modul wird der Wolfswald gebaut.
- **Deko:** Laut plan-deko.md darf man in Gehegen keine Deko setzen. Für die Lichtung braucht es eine Ausnahme:
  Sie ist die erste Deko-Fläche im Wildpark.

## Kachel-Skizze (zweite Fassung, 20.11.2026, von Andre freigegeben)

Spalten 0–23 und Zeilen 23–59 von PARK_ROWS (Spalte 23 ist der Hauptweg). Zum Ansehen wurde sie vorübergehend ins
Spiel gesetzt; der Code ist wieder auf dem alten Stand. `[` `]` ist der Außenzaun (Wildzaun), `#` (Steinweg)
für die Waldwege, `B` (rote Bogenbrücke aus Asien) für die Holzbrücke. Ab dem Tor sind rund 190 freie Kacheln für die
Rehe erreichbar.

```
23 [[[[[[[[[[[[[[[[[[[[[[]#
24 PPDPDPPPPPP]P;^^^^^^^;]#
25 .DPDPPPDPPP]P;.......;]#
26 .D..PDPP.nP]D;.P...ɫ.;]#
27 PPP........]D;.......;]#
28 .D...O...n.]D;L...ww.;]#
29 PD..Py.D..y]P;....ww.;]#
30 DPP.....L..]n;.ɫ.....;]#
31 PP.R...n...]D;......*;]#
32 Py.....m...]ḩ;^^^G^^^;]#
33 PP.D.......]P..D.#.2DP]#
34 [[[[[[[[[G[[.....#.1P.]#
35 ]ḩmkP..###########..Ț.]#
36 ]|----|#........#..DPD]#
37 ]|...k|#........#..D..]#
38 ]|.Ø..|#g...ƃ...#....n]#
39 ]|....|#..%...f.#.ḫ1..]#
40 ]|n...|#.ooo....#.....]#
41 ]|....G#.oooo...######G#
42 ]|.ʬ..|#ƃ.ooo%..######G#
43 ]|....|#...ooo..#.....]#
44 ]|m...|#.n...oo.#.P2nḩ]#
45 ]|..L.|#f.....~~#.D.D.]#
46 ]|----|#....g..~B.PP1D]#
47 ].PD...#........B~2Ɍ..]#
48 ]ḫ.D.############~kP.n]#
49 ]|---G--|...|-G-----|P]#
50 ]|......|..P|....ww.|.]#
51 ]|n....m|P..|.ƀ.%wwn|n]#
52 ]|......|..k|m...ww.|P]#
53 ]|..U...|P.ḫ|..Ƅwww.|P]#
54 ]|......|D1.|...www.|D]#
55 ]|k...n.|1..|%...wwƀ|P]#
56 ]|.D....|.P.|....ww.|.]#
57 ]|------|P..|-------|.]#
58 ]P..DḫP.n..ḫ..PDP~~ḩ.ḫ]#
59 ][[[[[[[[[[[[[[[[[[[[[]#
```

- **Tor:** (22, 41) und (22, 42), zum Vorplatz vor dem Haupthaus.
- **Wege:**
  - Ein Ring um die Lichtung: Spalten 7 und 16, Zeilen 35 und 48.
  - Vom Tor führt ein breiter Weg auf den Ring, von dort gehen Abzweige zu Wolfswald und Voliere.
  - Alle fünf Gehegetore sind vom großen Tor aus über Wege erreichbar (geprüft).
- **Brücke:** Der rechte Ringweg führt bei (16, 46–47) über den Bach.
- **Wolfswald:** unverändert (Zeilen 23–34, Spalten 0–11), Tor unten auf den Ring.
- **Voliere:** oben rechts, Tor unten.
- **Wildschwein:** links am Ring, Tor zur Lichtung.
- **Fuchs und Biber:** unten am Ring, Tore oben.
- **Bach:** Er kommt unten durch den Außenzaun (17–18, 59), fließt durch das Biber-Gehege, unter der Brücke durch und
  mündet in den Fischteich (`o`) auf der Lichtung.

Was in der Skizze noch nicht stimmt:
- **Brücke für Besucher:** Besucher laufen nur auf Kacheln mit Wegboden (`groundAt(...) === LEVEL.path` in
  world/visitors.js). Eine Brücke hat Wasser als Boden, also würden sie heute nicht darüber gehen. Die Brücken-Kacheln
  müssen in ihr Wegnetz aufgenommen werden.
- **Brücken-Grafik:** Die rote Bogenbrücke passt nicht in den Wald. Es braucht eine Holzbrücke mit Geländer.
- **Schild der Rehe:** Es landet am Tor der Voliere. Das Wildpark-Gehege braucht einen festen Schildplatz am großen
  Tor (`signAt`).
- **Ecken ohne Zugang:** Ein paar Stellen hinter den Gehegen erreichen die Rehe nicht (unten links, rechts neben dem
  Biber-Gehege).
- **Wegboden:** Die Wege sind noch Steinweg. Im Wald passt ein Erdweg besser.

## Grafiken

Neu ist nur der **Torbogen** (`wildpark_arch`, Platzhalter aus tools/wildpark-placeholders.py, Vorlage in
Wald-Sprites/Neu): zwei Pfosten, schräger Querbalken, darauf eine leere schräge Tafel (isometrisch in Richtung des
Zauns). Den Namen schreibt das Spiel darauf, je nach Sprache „Wildpark“ oder „Wildlife Park“, schräg wie auf den
Wegweisern (`drawArches` und `signLabel` in GardenScene). Für das fertige Bild gilt: Fußpunkt und Tafel an derselben
Stelle lassen (siehe Kopf des Skripts), Tafel ohne Schrift.

Schon vorhanden und nur zu verwenden:
- Außenzaun: Wildzaun `[` `]`, Tor: hoher Torflügel (`gate: 'tall'`)
- Waldweg: `forest_path` (braucht eine Wegzone, damit nur der Wildpark Erdweg bekommt und der Rest des Tierparks
  Steinweg behält)
- Holzbrücke: `bridgeStyle: 'wood'` (im Abschnitt `park` gibt es sonst keine Brücke)
- Bach: Wasser `~`; wo der Bach durch einen Zaun geht, braucht es Zaunzeichen mit Wasser darunter (nur Code, kein Bild)
- Bänke: `ƃ` (meadow_bench)

Noch offen: Futterkrippe für die Lichtung (Ausbau), vielleicht `&` (hay_rack) aus dem alten Rehgehege.

## Umsetzung (20.11.2026)

- **Karte:** PARK_ROWS Spalten 0–23, Zeilen 23–59 nach der Skizze. Der gesperrte Wolfswald ist ein eingezäuntes Stück Wald,
  der Patch in PARK_UNLOCKS legt sich beim Freischalten darüber.
- **Gehege:**
  - Teich auf der Lichtung (`clearingpond`): Teich ohne Zaun mit einer Kachel Ufer (`shore`), für Frösche und Fische.
    Er steht vor dem Wildpark in PARK_PENS: Eine Kachel gehört jetzt immer nur dem zuerst genannten Gehege.
  - Wildpark (`deerpark`, Id bleibt wegen des Ausbaus): nur das große Tor (`gateTiles`), Besucher dürfen hindurch
    (`visitors`), das Schild steht neben dem Futterautomaten an der Gabelung (`signAt`, mit Pfosten).
  - Biberbach (`forestpond`, Id vom alten Teich).
  - Wildschwein, Fuchs, Voliere, Wolfswald: Ids und Plätze wie bisher.
- **Ausbau:** Vor dem Ausbau Dickicht in Wildpark, Wildschwein, Fuchs, Biberbach und Voliere (`basic`), der Ausbau
  lichtet es („Dickicht lichten“). Am Teich bringt der Ausbau Schilf.
- **Neue Kartenzeichen:** `ȸ` und `ȹ` sind Wild- bzw. Holzzaun über dem Bach.
- **Wege:** Die Bodenzone des Waldes hat `path: 'forest_path'`. Besucher laufen auf allen Wegen (`isWalkway`), auch über
  Brücken.
- **Spielstand:** `migrateWildpark` in save.js überträgt den Ausbau des alten Teichs auf den neuen. Die Tiere setzt
  GardenScene beim Laden in passende Gehege; getestet mit Reh, Elch, Fröschen, Fischen, Bibern, Wildschwein, Fuchs und
  Eichhörnchen an alten Positionen.

## Noch offen

- Echtes Bild für den Torbogen (Vorlage in Wald-Sprites/Neu, Tafel ohne Schrift).
- Futterkrippe auf der Lichtung (der Ausbau des Wildparks stellt sein Spielzeug irgendwo mittig auf).
- Dickicht in den Gehegen der anderen Welten, falls es Andre im Wald gefällt.

## Schritte

1. ~~Kachel-Skizze des Wildparks auf der echten Karte, mit Größe. Andre gibt sie frei.~~ Erledigt (zweite Fassung).
2. ~~Platzhalter-Grafiken.~~ Erledigt: Torbogen samt Code zum Zeichnen (noch ohne Eintrag in der Karte).
3. Karte umbauen: Außenzaun, Tor, Wege, Bäume, Lichtung, Bach, Gehege neu verteilen, Wolfswald übernehmen.
4. Gehege-Logik: Wildpark als Gehege der Rehe und Elche, Biber-Gehege, offener Teich mit Fischen und Fröschen, Tafel
   am Tor, Ausbau mit Futterkrippe.
5. Spielstand-Umzug der Tiere testen (Henriks Spielstand darf nichts verlieren).
6. Endgültige Grafiken einsetzen.
