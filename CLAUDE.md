# My Little Zoo

## Testen: Screenshots direkt aus dem Spiel
Nicht von Hand durch Vorschau, Startbildschirm und Mavis Begrüßung klicken. Stattdessen:

```
node tools/screenshot.cjs [--level park] [--size pc|phone|tablet|1024x768] [--click "#btn-events"] [--key e] [--wait 1500] [--out datei.png]
```

- Startet ein Test-Spiel (speichert nie), überspringt die Vorschau, wartet bis das Spiel läuft, drückt Mavis Sprechblasen weg, klickt/drückt dann die angegebenen Dinge und macht das Bild (Standard: `tools/shots/<level>-<size>.png`, nicht im Git).
- Nutzt den Test-Port 5181; läuft dort kein Server, startet das Skript selbst einen und beendet ihn danach. Der Tablet-Server (5173) bleibt unberührt.
- Im Bash-Tool mit `dangerouslyDisableSandbox: true` aufrufen (sonst darf vite keinen Port öffnen). Immer nur einen Lauf gleichzeitig.
- Dauert etwa 25 Sekunden. Bei einem neuen Test-Spiel liegt oft noch die Steuerungs-Erklärung über dem Bild (Mitte unten).

## Ideen für später

### Expeditionen (Roguelike-Modus, großer Umbau)
Eigener Modus neben den normalen Gebieten:
- Ein Durchlauf ist eine Kette aus 3–5 kleinen, zufällig erzeugten Lichtungen.
- Nach jeder Lichtung wählt man zwischen 2 Wegen, nur mit Symbolen gekennzeichnet (Kiste, seltenes Tier, Herzen, Event).
- Am Ende gibt es eine große Belohnung (garantiertes seltenes Tier, Glücksbringer).
- Man kann nicht verlieren: Der Durchlauf endet einfach, es gibt keine Strafe.
- Optional: tägliche Expedition mit festem Seed.
- Baut auf dem Kisten- und Glücksbringer-System auf (die Auswahl „1 aus 3“, Boni).
