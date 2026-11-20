# Plan: Besucherwünsche im Tierpark

Stand: 20.11.2026, noch nicht umgesetzt.

## Ziel

Ab und zu wünscht sich ein Besucher ein Tier, das es im Tierpark noch nicht gibt. Man fängt es in der Wildnis und
bringt es ins Gehege. Kommt man danach zum Gehege, erlebt man mit, wie sich der Besucher freut. Das schafft ein
kleines Ziel, das Wildnis und Tierpark verbindet.

Bewusst **ohne Stammgäste**: keine Namen, keine wiederkehrenden Figuren.

## Grundsätze

- Keine neuen Bilder und Animationen. Es werden die 8 vorhandenen Besucher-Aussehen genutzt, die Freude entsteht im
  Code (Tweens, Herzregen, Sprechblase).
- Der Moment der Freude passiert, **wenn Henrik dabei ist**, nicht irgendwann im Hintergrund.
- Höchstens 2 offene Wünsche gleichzeitig.

## Ablauf

### 1. Wunsch annehmen

- Ab und zu kommt im Tierpark ein Besucher mit Wunsch an. Er kommt wie jeder Besucher an einem Ausgang an
  (Visitor.js), bleibt dann aber auf dem nächsten Weg stehen und **wandert nicht herum**, damit man ihn nicht suchen
  muss.
- Über ihm schwebt eine Gedankenblase mit dem Tier als Schattenbild.
- Henrik spricht ihn mit der Aktionstaste an. Der Besucher sagt dann zum Beispiel: „Ich würde so gern mal einen
  Fuchs sehen!“
- Der Wunsch kommt als **Wunschkarte** zu den Aufgaben, wie Mavis Aufgaben-Karte: „Ein Besucher wünscht sich einen
  Fuchs“, mit dem Hinweis aus dem Tierbuch, wo das Tier lebt.
- Danach geht der Besucher wie ein normaler Besucher weiter. Sein Aussehen wird gemerkt.
- Spricht man ihn nicht an, bleibt er stehen, bis man den Abschnitt verlässt. Er kommt dann beim nächsten Mal wieder.

### 2. Wunsch erfüllen

- Der Wunsch ist erfüllt, sobald das gewünschte Tier in einem Gehege ist, egal in welchem Tierpark-Abschnitt.
- Auf der Wunschkarte steht dann: „Erfüllt! Schau beim Fuchsgehege vorbei.“

### 3. Der große Moment

- Kommt Henrik in die Nähe dieses Geheges, erscheint der Besucher **knapp außerhalb des Bildes auf dem nächsten Weg**,
  mit dem gemerkten Aussehen. Man sieht ihn ein paar Sekunden herbeilaufen.
- Er geht zum Zaun und freut sich: mehrere Freudensprünge (Tween), Herzregen und die Sprechblase
  „Ein Fuchs! Danke!“.
- **Belohnung:** 20 Herzen.
- Danach schaut er noch eine Weile und geht dann wie ein normaler Besucher.
- Die Wunschkarte verschwindet.

### 4. Neuer Wunsch

- Ein neuer Wunsch-Besucher kommt nach etwa 15–30 Minuten (echte Zeit), wenn weniger als 2 Wünsche offen sind.

## Welche Wünsche

- Nur Tiere, die **noch nicht im Tierpark** sind. Sonst wäre der Wunsch sofort erfüllt.
- Nur Tiere aus Welten, die schon freigeschaltet sind.
- Nur Tiere, für die es im Tierpark ein Gehege gibt.
- **Vorerst nur Tierarten**: keine seltenen Varianten, keine Deko. Beides ist später denkbar.

## Speichern

```js
wishes: {
  open: [{ species: 'fox', look: 3, done: false }],
  nextAt: 0,   // ab dann darf ein neuer Wunsch-Besucher kommen
},
```

- Alle Texte zweisprachig über `tr()`.

## Umsetzung in Schritten

1. Wunsch-Besucher mit Gedankenblase, Ansprechen, Wunschkarte und Speichern
2. Erfüllung erkennen, Besucher beim Gehege erscheinen lassen, Freude und Herzen

Jeder Schritt wird auf dem Testport geprüft. Der Tablet-Server bleibt unberührt, und es wird erst nach „GO“
committet.
