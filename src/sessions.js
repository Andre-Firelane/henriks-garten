// Spielrunden zählen, ohne Cookies: beim Start einer Runde und danach immer wieder mit der bisherigen Spieldauer eine
// kurze Meldung an die Netlify Function (netlify/functions/session). Die Kennung der Runde ist zufällig und wird nirgends
// gespeichert – so lässt sich niemand wiedererkennen. Gezählt wird nur die Zeit, in der das Spiel zu sehen ist.
// Dazu kommt, welche Tiere in der Runde gefangen und welche Events gestartet wurden (nur die Anzahl je Art), und welche
// Tafeln im Tierpark gezeigt bzw. was dort gewählt wurde (promos). Außerdem, wie lange das Laden gedauert hat (bzw. nach
// wie vielen Sekunden jemand beim Laden aufgegeben hat) und wie weit man in Mavis Geschichte kam.
// Die Spieldauer zählt erst ab dem Ende des Ladens.
import { lang } from './i18n.js';
import { game } from './state.js';

const API = '/api/session';
const UPDATE_EVERY = 2 * 60 * 1000; // so oft geht die Spieldauer zwischendurch raus (falls der Browser die Seite einfach wegwirft)

let session = null; // { id, startedAt, loadedAt, played: bisher gespielte Millisekunden, visibleSince, catches: { Tierart: Anzahl }, events: { Event: Anzahl }, promos: { Tafel: Anzahl } }

function device() {
  const ua = navigator.userAgent;
  // iPads melden sich wie ein Mac, haben aber einen Touchscreen
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'phone';
  return 'pc';
}

function randomId() {
  return crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

function played() {
  return session.played + (session.visibleSince ? Date.now() - session.visibleSince : 0);
}

// beacon: auch dann zustellen, wenn die Seite gerade geschlossen wird
function send(body, beacon = false) {
  if (import.meta.env.DEV || location.hostname === 'localhost' || /^192\.168\./.test(location.hostname)) return; // nur die echte Seite zählt
  const json = JSON.stringify(body);
  try {
    if (beacon && navigator.sendBeacon) navigator.sendBeacon(API, new Blob([json], { type: 'application/json' }));
    else fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: true }).catch(() => {});
  } catch {}
}

// wie weit: 0 noch beim Laden, danach die Aufgabe in Mavis Geschichte (1 = Begrüßung, siehe src/story/steps.js;
// eins mehr als die letzte: alle geschafft)
// Fassung des Tutorials, zu der die Zahl in step gehört (die Liste der Spielrunden beschriftet ältere anders); bei jeder
// Änderung an der Reihenfolge oder Zahl der Aufgaben in src/story/steps.js eins hochzählen, ebenso in handle.mjs
const TUTORIAL_VERSION = 4;

function progress() {
  if (!session.loadedAt) return 0;
  return game.story.step + 1;
}

function update(beacon) {
  if (!session) return;
  const load = Math.round(((session.loadedAt ?? Date.now()) - session.startedAt) / 1000);
  send({ type: 'update', id: session.id, seconds: Math.round(played() / 1000), load, loaded: !!session.loadedAt, step: progress(), tut: TUTORIAL_VERSION, catches: session.catches, events: session.events, promos: session.promos }, beacon);
}

function count(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

// für die Statistik: ein Tier gefangen (Bauernhof-Schafe zählen als Kuh, Schwein oder Ziege) bzw. ein Event gestartet
export function countCatch(species) {
  if (session) count(session.catches, species);
}

export function countEvent(id) {
  if (session) count(session.events, id);
}

// Tafeln im Tierpark: 'gift' gezeigt, 'giftbabies'/'giftride' gewählt; 'worlds' gezeigt, 'worldsmap' bis zum Ende durchgeblättert;
// 'surprise': Überraschungs-Flamingos in einer Welt
export function countPromo(id) {
  if (session) count(session.promos, id);
}

// neue Runde vom Startbildschirm aus; kind: 'continue', 'new' oder 'test'. Die Spieldauer läuft erst ab sessionLoaded
export function startSession(kind) {
  session = { id: randomId(), startedAt: Date.now(), loadedAt: null, played: 0, visibleSince: null, catches: {}, events: {}, promos: {} };
  send({ type: 'start', id: session.id, kind, lang, device: device() });
}

// das Spiel steht (erstes Gebiet aufgebaut): Ladezeit merken und gleich melden; danach läuft die Spieldauer
export function sessionLoaded() {
  if (!session || session.loadedAt) return;
  session.loadedAt = Date.now();
  if (document.visibilityState === 'visible') session.visibleSince = session.loadedAt;
  update(false);
}

export function setupSessions() {
  document.addEventListener('visibilitychange', () => {
    if (!session) return;
    if (document.visibilityState === 'hidden') {
      session.played = played();
      session.visibleSince = null;
      update(true);
    } else if (session.loadedAt) session.visibleSince ??= Date.now();
  });
  window.addEventListener('pagehide', () => update(true)); // Seite zu oder neu geladen (z. B. "Zum Startbildschirm")
  setInterval(() => {
    if (document.visibilityState === 'visible') update(false);
  }, UPDATE_EVERY);
}
