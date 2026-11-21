# Plan: Besucherwünsche im Tierpark

Stand: 21.11.2026, umgesetzt (Schritte 1 und 2, noch nicht committet; Code in src/world/wishes.js, Visitor.js, GardenScene.js). Angepasst: Wunsch-Besucher laufen frei herum, Tierbild mit Herz,
mehrere gleichzeitig unterwegs, höchstens 2 angenommene Wünsche, 30 Herzen. Die Blase bleibt bis zum Schluss über dem
Besucher (auch nach dem Ansprechen und beim großen Moment), als Erkennungszeichen.

## Ziel

Ab und zu wünscht sich ein Besucher ein Tier, das es im Tierpark noch nicht gibt. Man fängt es in der Wildnis und
bringt es ins Gehege. Kommt man danach zum Gehege, erlebt man mit, wie sich der Besucher freut. Das schafft ein
kleines Ziel, das Wildnis und Tierpark verbindet.

Bewusst **ohne Stammgäste**: keine Namen, keine wiederkehrenden Figuren.

## Grundsätze

- Keine neuen Bilder und Animationen. Es werden die 8 vorhandenen Besucher-Aussehen genutzt, die Freude entsteht im
  Code (Tweens, Herzregen, Sprechblase).
- Der Moment der Freude passiert, **wenn Henrik dabei ist**, nicht irgendwann im Hintergrund.
- **Höchstens 2 angenommene Wünsche gleichzeitig.** Es dürfen aber mehrere Wunsch-Besucher herumlaufen.

## Ablauf

### 1. Wunsch annehmen

- Ab und zu ist ein Besucher im Tierpark ein Wunsch-Besucher. Er kommt wie jeder Besucher an einem Ausgang an
  (Visitor.js) und **läuft ganz normal herum**. Man kann jederzeit zu ihm gehen und ihn ansprechen.
- Über ihm schwebt eine Blase mit dem **normalen Tierbild und einem Herz-Symbol** dazu.
- Henrik spricht ihn mit der Aktionstaste an. Der Besucher sagt dann zum Beispiel: „Ich würde so gern mal einen
  Fuchs sehen!“
- Der Wunsch kommt als **Wunschkarte** zu den Aufgaben, wie Mavis Aufgaben-Karte: „Ein Besucher wünscht sich einen
  Fuchs“, mit dem Hinweis aus dem Tierbuch, wo das Tier lebt.
- Danach geht der Besucher weiter, die Blase bleibt als Erkennungszeichen (ansprechen kann man ihn nicht mehr). Sein
  Aussehen wird gemerkt.
- Sind schon 2 Wünsche angenommen, zeigen Wunsch-Besucher keine Blase mehr, bis wieder ein Platz frei ist.
- Spricht man ihn nicht an, geht er irgendwann wie jeder Besucher. Es kommen neue nach.

### 2. Wunsch erfüllen

- Der Wunsch ist erfüllt, sobald das gewünschte Tier in einem Gehege ist, egal in welchem Tierpark-Abschnitt.
- Auf der Wunschkarte steht dann: „Erfüllt! Schau beim Fuchsgehege vorbei.“

### 3. Der große Moment

- Kommt Henrik in die Nähe dieses Geheges, erscheint der Besucher **knapp außerhalb des Bildes auf dem nächsten Weg**,
  mit dem gemerkten Aussehen. Man sieht ihn ein paar Sekunden herbeilaufen.
- Er geht zum Zaun und freut sich: mehrere Freudensprünge (Tween), Herzregen und die Sprechblase
  „Ein Fuchs! Danke!“.
- **Belohnung:** 30 Herzen.
- Danach schaut er noch eine Weile und geht dann wie ein normaler Besucher.
- Die Wunschkarte verschwindet.

### 4. Neuer Wunsch

- Kein langer Cooldown: Neue Wunsch-Besucher kommen laufend mit den normalen Besuchern (zum Beispiel jeder
  fünfte bis zehnte Besucher), solange weniger als 2 Wünsche angenommen sind.
- Zwei Wunsch-Besucher gleichzeitig wünschen sich nie dasselbe Tier, und keins, das schon angenommen ist.

## Welche Wünsche

- Nur Tiere, die **noch nicht im Tierpark** sind. Sonst wäre der Wunsch sofort erfüllt.
- Nur Tiere aus Welten, die schon freigeschaltet sind.
- Nur Tiere, für die es im Tierpark ein Gehege gibt.
- **Vorerst nur Tierarten**: keine seltenen Varianten, keine Deko. Beides ist später denkbar.
- Keine Event-Tiere (Flamingo, Qualle, Wolf, Gnu, Roter Panda), weil man sie nur während eines Events fangen kann.

## Speichern

```js
wishes: {
  open: [{ species: 'fox', look: 3, done: false }],   // höchstens 2 angenommene Wünsche
},
```

- Herumlaufende Wunsch-Besucher, die noch nicht angesprochen wurden, werden nicht gespeichert.

- Alle Texte zweisprachig über `tr()`.

## Umsetzung in Schritten

1. Wunsch-Besucher mit Gedankenblase, Ansprechen, Wunschkarte und Speichern
2. Erfüllung erkennen, Besucher beim Gehege erscheinen lassen, Freude und Herzen

Jeder Schritt wird auf dem Testport geprüft. Der Tablet-Server bleibt unberührt, und es wird erst nach „GO“
committet.
