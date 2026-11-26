# Plan: Papageitaucher-Zug (Event in der Eiswelt)

Stand: 26.11.2026, abgestimmt mit Andre, **gebaut** (noch nicht committet, auch die Expedition), siehe „Umsetzung“. Ersetzt die Idee „Gletscherwanderung“ (eigene Nebenkarte mit
Puffin-Bucht), die verworfen ist: Ein Event findet auf dem bestehenden Gebiet statt, wie Flamingo-Flug und Leuchtnacht.

## Entschieden

- Event in der Eiswelt: Papageitaucher kommen in Gruppen vom Meer und landen auf Felsformationen am Rand der Karte;
  dazu ziehen Schwärme zur Stimmung über die ganze Karte (nur Kulisse).
- **Während des Events ist in der Eiswelt Tag** (auch wenn sonst gerade Nacht wäre).
- **Die Felsformationen sind immer da**, ohne Event sind sie leer (ganz selten sitzt einer drauf).
- **Fangen wie bisher:** Kescher, wenn der Vogel am Fuß des Felsens steht. Im Event steht er länger (10–12 statt 5 Sekunden).
- **Ohne Event sind Papageitaucher sehr selten**, kommen aber vor.
- **Expedition:** eine eigene Papageitaucher-Map als Event-Karte (wie Gnus, rote Pandas, Wölfe).
- Polarhalle im Tierpark bleibt, wie sie ist.

## Das Event

| | |
|---|---|
| id | `puffins` |
| Name | Papageitaucher-Zug / Puffin Season |
| Gebiet | `ice` (EVENT_AREAS), dazu LEVEL_EVENT.ice für den Event-Ruf |
| Preis | 100 Herzen (neues Tier wie Flamingo, Qualle, Frosch) |
| Dauer / Pause | 5 Minuten / 5 Minuten |
| Text (Vorschlag) | „5 Minuten lang kehren die Papageitaucher zurück: Schwärme ziehen über die Eiswelt und landen auf den Felsen am Rand. Wer unten am Felsen steht, lässt sich keschern!“ |

## Felsformationen (Vorschlag, auf der Karte noch zu prüfen)

Je 2–3 Schneefelsen (Ɵ großer Felsen, Ȟ Felsgruppe, Ȓ Felsen) direkt am Wasser, daneben freie Uferkacheln zum
Landen und Keschern (Henrik muss hinkommen). Kacheln aus ICE_ROWS (46 × 63):

| Ort | Kacheln (ungefähr) | Weg dorthin |
|---|---|---|
| Nordwestecke des Festlands | tx 3–5, ty 17–18 | zu Fuß, oberhalb des Walross-Strands |
| Ostküste des Festlands | tx 42–43, ty 24–27 | zu Fuß, rechts von der Station |
| Westspitze von Insel A | tx 3–4, ty 6–8 | Scholle (am Tag fährt sie) |
| Ostspitze von Insel B | tx 41–42, ty 7–9 | Scholle; nicht am Durchgang oben (tx 36–38) |

Dazu bleiben die Vogelfelsen am Fjord (Kolonie). Die neuen Felsen stehen nicht im Weg (nur am Rand), die Kisten
mit Kescher gibt es an der Station und auf beiden Inseln schon.

## Ablauf im Event

- Alle 6–12 Sekunden fliegt eine **Gruppe von 3–5 Papageitauchern** vom Meer (Kartenrand) zu einer der Felsformationen,
  kreist kurz und landet oben auf den Felsen (Sitzplätze wie in hallFlight.js bzw. ROCKS in Puffin.js).
- Von dort fliegt ab und zu einer an den **Fuß des Felsens** (Uferkachel daneben) und steht dort **10–12 Sekunden**:
  nur jetzt mit dem Kescher fangbar (wie heute LANDED_TIME, im Event länger). Danach zurück auf den Felsen.
- Nach einer Weile fliegen die Vögel einer Formation wieder aufs Meer, neue kommen nach. Höchstens etwa 12 gleichzeitig.
- **Stimmung:** ab und zu zieht ein Schwarm (5–9 Vögel) hoch über die Karte, mit kleinen Schatten auf dem Boden; nicht
  fangbar, kein Tier (wie die Glühwürmchen nur Bild). Flug-Animation puffin_fly gibt es schon.
- Event vorbei: die Vögel fliegen aufs Meer hinaus, wilde Papageitaucher am Ufer verschwinden.

## Ohne Event

- Spawn-Gewicht der Papageitaucher in der Eiswelt von 0,6 auf etwa 0,1 („sehr selten“).
- Die Kolonie auf den Fjord-Inseln bleibt (Puffin.js), ist aber meistens leer.
- Auf den neuen Randfelsen landet ohne Event fast nie einer.

## Tag während des Events

- Läuft das Event, ist in der Eiswelt Tag (season.js: `day` statt `night`), ohne die Uhr von Tag/Nacht zu verstellen.
  Nach dem Event gilt wieder die normale Phase (also evtl. sofort Nacht, mit dem üblichen Übergang).
- Folgen: Meer offen, Schollen fahren, kein Eisbär (der kommt nur nachts), keine Kälte-Uhr.

## Expedition

- Die geplante Map `ix_birdcliff` (Vogelfelsen, siehe plan-eis-expedition.md) wird die Event-Karte für Papageitaucher:
  MAP_EVENTS `puffins: { species: 'puffin', units: 4, alone: true }`, dort immer Tag.
- Auf den normalen Expeditions-Maps mit `birdrocks` gibt es Papageitaucher dann auch nur selten.

## Noch offen

- Felsplätze auf der Karte prüfen (Screenshots), evtl. verschieben.
- Bild fürs Events-Fenster (Papageitaucher-Standbild, zwei, drei Vögel).

## Umsetzung (26.11.2026)

- **Event** `puffins` in events.js (100 Herzen, 5 + 5 Minuten, Gebiet `ice`), LEVEL_EVENT.ice (Event-Ruf), Karte im
  Events-Fenster, Start- und Endmeldung, Fang-Tipp im Tierbuch angepasst.
- **Tag:** season.js `seasonState`: läuft das Event, ist in der Eiswelt Tag (`event: true`), danach wieder die Phase nach
  der Uhr. Der Wechsel geht über den normalen Wetterwechsel (Szene neu); startet das Event nachts, heißt die Meldung
  „Die Papageitaucher kommen – in der Eiswelt wird es Tag!“.
- **Felsen** in ICE_ROWS (immer da): Ɵ (3,6) + Ȟ (4,8) Insel A, Ɵ (3,17) + Ȟ (5,17) Nordwestecke, Ɵ (41,6) + Ȟ (41,8)
  Insel B, Ɵ (42,22) + Ȟ (42,25) Ostküste; als Gruppen in `LEVEL.puffinRocks`.
- **Vögel:** Puffin.js `puffinFormations` (Felsen und Landeplätze je Formation), `arriveFromSea`, `updateEvent`: oben 4–9 s,
  dann zu 50 % an den Fuß (10–12 s fangbar), zu 15 % kurz aufs Meer, sonst sitzen bleiben; nach dem Event aufs Meer und
  fort (`gone`, die Szene entfernt sie). GardenScene.updatePuffinEvent: alle 6–12 s eine Gruppe von 3–5 zur Formation
  mit den wenigsten Vögeln, höchstens 12.
- **Schwärme:** src/world/PuffinFlocks.js, alle 7–14 s 5–9 Vögel quer durchs Bild, hoch oben, mit Schatten.
- **Ohne Event:** Spawn-Gewicht 0,1 statt 0,6.
- Getestet (Screenshots): Schwärme, Landen an der Nordwestecke samt Kescher-Symbol am Fuß, Ende des Events (Vögel fort),
  Start bei Nacht (wird Tag, danach Nacht). Nicht getestet: die anderen drei Formationen im Bild, Tablet-Leistung.
- **Noch offen:** Expedition (Event-Karte `ix_birdcliff`, seltene Papageitaucher auf den kleinen Maps) – die
  Expeditions-Maps baut gerade eine andere Sitzung.
- **Expedition (nachgetragen 26.11.2026):** Event-Karte wie Gnu-Furt, Glühwürmchen-Abend und Wolfsnacht: `ix_birdcliff` hat
  `puffins: true`, MAP_EVENTS `puffins: { species: 'puffin', units: 4, alone: true, season: 'day' }` (nur die Event-Tiere
  auf der Tierliste, immer Tag), Kartenbild im Camp „Papageitaucher-Zug“. Auf der Karte ziehen Schwärme (PuffinFlocks),
  die Vögel stehen 10–12 s am Ufer und landen öfter. Sonst sind Papageitaucher auf den kleinen Maps selten
  (speciesRules `rare: 0.25`: nur bei Glück auf einer Map, planMap in expedition.js). Getestet: Vogelfelsen mit
  Event-Tierliste (4 Papageitaucher), Kescher-Symbol am Ufer.
