// Spielrunden zählen, ohne Cookies: beim Start einer Runde und danach immer wieder mit der bisherigen Spieldauer eine
// kurze Meldung an die Netlify Function (netlify/functions/session). Die Kennung der Runde ist zufällig und wird nirgends
// gespeichert – so lässt sich niemand wiedererkennen. Gezählt wird nur die Zeit, in der das Spiel zu sehen ist.
import { lang } from './i18n.js';

const API = '/api/session';
const UPDATE_EVERY = 2 * 60 * 1000; // so oft geht die Spieldauer zwischendurch raus (falls der Browser die Seite einfach wegwirft)

let session = null; // { id, played: bisher gespielte Millisekunden, visibleSince }

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

function update(beacon) {
  if (session) send({ type: 'update', id: session.id, seconds: Math.round(played() / 1000) }, beacon);
}

// neue Runde vom Startbildschirm aus; kind: 'continue', 'new' oder 'test'
export function startSession(kind) {
  session = { id: randomId(), played: 0, visibleSince: document.visibilityState === 'visible' ? Date.now() : null };
  send({ type: 'start', id: session.id, kind, lang, device: device() });
}

export function setupSessions() {
  document.addEventListener('visibilitychange', () => {
    if (!session) return;
    if (document.visibilityState === 'hidden') {
      session.played = played();
      session.visibleSince = null;
      update(true);
    } else session.visibleSince ??= Date.now();
  });
  window.addEventListener('pagehide', () => update(true)); // Seite zu oder neu geladen (z. B. "Zum Startbildschirm")
  setInterval(() => {
    if (document.visibilityState === 'visible') update(false);
  }, UPDATE_EVERY);
}
