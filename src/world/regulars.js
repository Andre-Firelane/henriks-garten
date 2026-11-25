// Stammgäste (siehe docs/plan-wuensche.md): Wer sich über einen erfüllten Wunsch gefreut hat, wird Stammgast. Er bekommt
// einen Namen, über seinem Kopf steht immer ein Schild mit Stern und Namen (wie beim Tierfreund), er kommt regelmäßig
// wieder in den Tierpark, grüßt, wenn man in seine Nähe kommt, und gibt doppelt so viele Herzen.
// Gespeichert in game.regulars: [{ id, name, look, since }]
import { game } from '../state.js';
import { tr } from '../i18n.js';

export const REGULAR_HEARTS = 2; // so viel mal so viele Herzen wie ein normaler Besucher
export const REGULAR_CHANCE = 0.3; // so oft ist ein neu ankommender Besucher ein Stammgast (wenn einer gerade nicht da ist)
export const REGULAR_AWAY = 60; // Sekunden: so lange bleibt ein Stammgast mindestens weg, bevor er wiederkommt
export const GREET_DIST = 90; // so nah muss Henrik kommen, damit er grüßt (Kachel-Proportionen, y doppelt)
export const GREET_PAUSE = 90; // Sekunden, bevor derselbe Stammgast wieder grüßt

// Besucher-Bilder 1, 2, 5, 8 sind Mädchen, 3, 4, 6, 7 Jungen
const GIRL_LOOKS = new Set([1, 2, 5, 8]);
const GIRLS = ['Lena', 'Mia', 'Emma', 'Hanna', 'Lina', 'Clara', 'Ella', 'Marie', 'Nele', 'Ida', 'Frieda', 'Paula', 'Greta', 'Luisa', 'Anna', 'Maja', 'Romy', 'Pia', 'Leni', 'Zoe'];
const BOYS = ['Paul', 'Ben', 'Jonas', 'Felix', 'Leo', 'Emil', 'Noah', 'Finn', 'Max', 'Anton', 'Theo', 'Oskar', 'Jakob', 'Moritz', 'Luis', 'Karl', 'Tom', 'Milo', 'Ole', 'Jan'];

export function ensureRegulars() {
  if (!Array.isArray(game.regulars)) game.regulars = [];
  return game.regulars;
}

// neuer Stammgast mit diesem Aussehen: ein Name, den noch kein anderer Stammgast hat
export function addRegular(look) {
  const list = ensureRegulars();
  const pool = GIRL_LOOKS.has(look) ? GIRLS : BOYS;
  const used = new Set(list.map((r) => r.name));
  const free = pool.filter((n) => !used.has(n));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const name = pick(free.length ? free : pool); // (erst nach 20 Stammgästen gleichen Aussehens doppelt)
  const id = list.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  const r = { id, name, look, since: Date.now() };
  list.push(r);
  return r;
}

export function greetLine() {
  const lines = [
    ['Hallo!', 'Hi there!'],
    ['Hallo! Ich bin wieder da!', 'Hello! I’m back!'],
    ['Hi! Schön hier!', 'Hi! Love it here!'],
    ['Hey! Toller Zoo!', 'Hey! Great zoo!'],
  ];
  const [de, en] = lines[Math.floor(Math.random() * lines.length)];
  return tr(de, en);
}

export function welcomeLine() {
  return tr('Ich komme jetzt öfter!', 'I’ll come back often!');
}
