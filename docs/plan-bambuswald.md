# Plan: Bambuswald (neues Design für den Asien-Teil von `park3`)

Stand: 22.11.2026, Ideensammlung abgestimmt, noch nicht umgesetzt. Nach Wildpark (plan-wildpark.md), Safari
(plan-safari.md) und Streichelzoo (plan-streichelzoo.md) ist der Bambuswald der vierte Bereich mit neuem Design.
Offene Fragen stehen unter „Noch offen“ ganz unten.

## Ziel

Jeder umgebaute Abschnitt hat ein eigenes Erlebnis: im Wildpark laufen die Tiere frei, durch die Safari fährt man,
im Streichelzoo fasst man die Tiere an. Der Bambuswald wird ein **Japanischer Garten**: ruhig, zum Zuschauen.

Herzstück ist ein großer Teich mit der **Affeninsel** in der Mitte und dem **Teehaus** am Ufer mit Blick auf die Insel.

## Grundsätze

- **Kein Wetter, keine Tageszeiten, keine Jahreszeiten.** Wie im ganzen Tierpark. Einzige Ausnahme ist das
  kaufbare Event „Laternenabend“ (siehe unten), das nur diesen Abschnitt für eine Weile abdunkelt.
- **Kirschbäume blühen immer.**
- **Besucher setzen sich nicht.** Es gibt keine Sitz-Sprites. Wo Besucher verweilen, stehen sie (Stehtische,
  Glaspavillon).
- **Keine Geschicklichkeit.** Henrik kann nicht ins Wasser fallen, die Ufer sperren.
- **Kein Gehegeausbau** (wie bei der Safari): Alles wird gleich in voller Größe gebaut.

## Affeninsel

- **Alle Affen leben auf der Insel:** Japanmakaken, Orang-Utans, Brüllaffen (mit Gibbons als seltener Variante) und
  Gorillas (bestätigt am 22.11.2026). Sie kommen aus der Affenquelle, dem Orang-Utan-Gehege, dem Affen-Gehege im Dschungel und dem
  Gorilla-Gehege. Je Art gilt eine eigene Obergrenze (`quota`), ungefähr wie die bisherigen Plätze.
- **Lage:** dort, wo heute Affenquelle und Orang-Utan-Gehege liegen (links im Bambuswald). Der Koi-Teich wird zum
  großen Teich rund um die Insel.
- **Wassergraben statt Zaun** auf den meisten Seiten. Der Graben ist Deko, die Affen kommen nie hinüber, Henrik und
  die Besucher auch nicht.
- **Landseite mit Tor:** An einer Stelle gibt es keinen Graben, sondern einen Übergang mit normalem Zaun und Tor.
  Dort gelten Streicheln, Füttern und Tierfreunde wie an jedem Gehege.
- **Auf der Insel:** Kletterbäume, Seile, Hängematte und Schlafnest (Orang-Utans), Lianen, Felsen, die **heiße
  Quelle** der Makaken (sie baden darin wie bisher) und ein Badeufer.
- **Glaspavillon in der Mitte:** Ein Durchgang (Brücke oder Damm, an beiden Seiten verglast oder umzäunt) führt vom
  Weg mitten auf die Insel. Dort ist ein kleiner Bereich, rundum mit Glasscheiben umschlossen. Besucher gehen
  hinein, schauen eine Weile, bekommen Herzen und gehen wieder, ähnlich wie im Streichelzoo. So sieht man die Affen
  von nah, obwohl die Insel groß ist. Henrik darf auch hinein.
- Neue Bilder: Glasscheiben (von oben, waagerecht und senkrecht, Ecken), evtl. Kletterseile und Insel-Ufer.

## Teehaus

- Steht am Teichufer mit Blick auf die Insel, auf der Fläche, die durch den Umzug der Orang-Utans frei wird.
- **Stehtische** vor dem Teehaus: Besucher gehen hin, stehen eine Weile mit Tee an einem Tisch und geben dann Herzen.
- **Zen-Garten** daneben: geharkter Kies mit Steinen, als Teil des Teehauses (evtl. auch als Deko-Bauplan).

## Koi füttern

- Besucher bleiben auf der Brücke über den Teich stehen und füttern die Koi.
- Die Koi sammeln sich unter der Brücke, es gibt Herzen (wie das Streicheln im Streichelzoo).

## Rote Pandas über dem Weg

- Eine **Seilbrücke** führt aus dem Pandagehege über den Hauptweg zu einem einzelnen **Baum mit Plattform** auf der
  anderen Seite. Brücke und Baum gehören zum Pandagehege, es bleibt ein einziges Gehege.
- Nur die Roten Pandas klettern darauf hin und her, die großen Pandas bleiben unten.
- Besucher und Henrik laufen unter der Brücke hindurch.
- Zu prüfen: ob ein Gehege so einen schmalen Ausläufer schon kann oder ob die Brücke eine Sonderregel braucht.

## Event „Laternenabend“

- Kaufbar für Herzen wie das Bauernhof-Event.
- Für eine Weile wird **nur der Bambuswald** dunkel, die Steinlaternen und das Teehaus leuchten, Glühwürmchen
  kommen (gibt es schon im Spiel), die Tanukis werden aktiv.
- Danach ist wieder alles wie vorher.

## Was bleibt

- Pandagehege (mit Roten Pandas), Tigergehege, Tanuki-Garten, Yak-Weide, Schneeleoparden-Felsen, freilaufende Pfauen.
- Im Dschungel: Ara- und Tukan-Voliere, Ameisenbären, Jaguare, Tapire und Okapis, Reptilienhaus.

## Alte Spielstände

- Tiere aus `macaques`, `orangutans`, `howlers` und `gorillas` ziehen auf die Insel um (Namen und Freundschaft
  bleiben erhalten).
- Spielzeug aus diesen Gehegen (z. B. Lianen, Strohnest in toys.js) geht auf die Insel über oder wird zurückgegeben.
- Deko des Spielers auf Flächen, die neu bebaut werden, kommt zurück ins Inventar.

## Noch offen

- Was kommt auf die frei werdenden Flächen im Dschungel (Affen-Gehege und Gorilla-Gehege)? Wird später beim
  Umbau des Dschungels geklärt. Bis dahin verschwinden die beiden Gehege einfach (Zaun, Tor, Schild und Spielzeug
  weg), die Fläche wird normaler Dschungelboden.
- Genaue Lage und Größe von Insel, Teich, Teehaus und Glaspavillon (Skizze vor der Umsetzung).
- Wie lange dauert der Laternenabend, und was kostet er?
- Später geplant: mehr Durchmischung, z. B. Reptilienhaus und Aquarium zusammenfassen.
