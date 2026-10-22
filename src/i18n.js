// Sprache des Spiels: Deutsch oder Englisch. Beim ersten Start nach der Browsersprache (Deutsch nur, wenn der Browser
// auf Deutsch steht, sonst Englisch), danach so, wie man es auf dem Startbildschirm gewählt hat.
// Umschalten lädt die Seite neu: viele Texte stehen in Konstanten, die beim Laden einmal gebaut werden.
const KEY = 'my-little-zoo-lang';

function detect() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'de' || saved === 'en') return saved;
  } catch {}
  const browser = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
  return browser.startsWith('de') ? 'de' : 'en';
}

export const lang = detect();

// Text in der gewählten Sprache: tr('Deutsch', 'English')
export const tr = (de, en) => (lang === 'de' ? de : en);

// für Datum und Uhrzeit
export const locale = tr('de-DE', 'en-GB');

export function setLang(l) {
  if (l === lang) return;
  try {
    localStorage.setItem(KEY, l);
  } catch {}
  location.reload();
}

document.documentElement.lang = lang;
