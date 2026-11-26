# Plan: Reittiere und E-Roller

Stand: 2026-11-24, gebaut (noch nicht committet).

## Ziel

Mehr Möglichkeiten, Herzen auszugeben, ohne Inhalte zu sperren: Reittiere sind Bequemlichkeit, kein Zugang.

## Regeln

- **Leihen**: 50 Herzen, 10 Minuten, in allen Welten (das frühere Event `ride`, mit Pause danach). Wie bisher mit
  Werkzeugwechsel überall (Q bzw. Werkzeug-Knopf).
- **Kaufen**: 500 Herzen je Gebiet, für immer. In diesem Gebiet reitet man dann immer, aber **nur schneller**: Werkzeug
  wechselt man wie sonst am Regal (sonst wäre der Kisten-Bonus „Werkzeug überall“ dort wertlos).
  - Esel (Wiese), Pferd (Wald), Elefant (Savanne), Wasserbüffel (Bambuswald), Maultier (Dschungel), Seabob (Riff),
    Hundeschlitten (Eiswelt, auch auf den Eis-Expeditionen). Bild aus Sprites/Hundeschlitten.webp mit
    tools/dogsled-cut.py: Fußpunkt unter Henrik statt mittig (die Hunde laufen voraus), Schatten im Bild, keine Schritte.
    Animationen aus den Videos mit tools/dogsled-anim.py (Laufen vorne 12, hinten 20 Bilder; Stehen je 8, vor und zurück).
  - Hat man das Reittier eines Gebiets gekauft, kommt dort die Kisten-Karte „Reittier“ nicht mehr.
- **E-Roller**: 300 Herzen, einmal freischalten. Er steht wie bisher vor dem Haupthaus; vorher öffnet die Aktionstaste
  am Roller den Reiter Reittiere. Gilt auch für ältere Spielstände (es gibt noch keine feste Spielerschaft).
- Preise über `price()`, also mit dem Sparschwein billiger.

## Wo man kauft

- **Reiter „Reittiere“** in der Events-Tafel (Events-Knopf oben, Q wechselt den Reiter). Das Event „Reittier“ steht
  nicht mehr bei den Events.
- **Stall** rechts neben der Tür des Haupthauses (`LEVEL.stable`, Kachel 33/40): öffnet direkt den Reiter Reittiere.
  Vorerst ein Schild mit dem Roller als Platzhalter, **ein Stall-Bild fehlt noch**.
- **Tutorial**: neue Aufgabe `stable` nach der Bude (Mavi steht am Stall, erledigt, sobald man den Stall öffnet,
  20 Herzen). Wer die Bude schon gebaut hat, überspringt sie (`DONE_WITH` in story.js).

## Code

- `src/world/mounts.js`: Reittiere, Preise, Kaufen; `game.mounts` (Gebiete), `game.scooter`.
- GardenScene: `mountOffers`, `buyMountOffer`, `rideOn` / `rentedRide`, `drawStable`, Roller-Sperre in `getOnScooter`.
- `src/ui/eventsPanel.js`: Reiter `mounts`.

## Offen

- Stall-Bild (statt Schild), evtl. mit den gekauften Tieren davor.
- **Entschieden (2026-11-24): Aufsitzen am Ankunftsort.** Das gekaufte Reittier steht beim Betreten des Gebiets am
  Ankunftsort (Auto bzw. Spawnpunkt) bereit, man steigt mit der Aktionstaste auf. Einmal aufgestiegen, kann man im
  Gebiet nicht mehr absteigen (bis man es verlässt). Dafür liefert Andre Idle-Animationen der Reittiere ohne Reiter;
  bis dahin reitet man mit gekauftem Reittier im Gebiet von Anfang an.
- Preise bestätigt: Leihen 50, Reittier 500 je Gebiet, Roller 300.
