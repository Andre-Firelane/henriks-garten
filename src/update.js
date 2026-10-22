// Neue Version: Handy und Tablet holen eine schon offene Seite oft aus dem Speicher, statt sie neu zu laden.
// Kommt die Seite wieder in den Vordergrund, fragt sie nach der aktuellen Version (version.json, beim Build geschrieben).
// Gibt es eine neuere, speichert sie den Stand und lädt neu (danach geht es auf dem Startbildschirm mit "Weiterspielen" weiter).
import { saveNow } from './save.js';
import { showLoading } from './ui/loading.js';
import { tr } from './i18n.js';

const KEY = 'my-little-zoo-reloaded-for'; // für welche Version schon neu geladen wurde (nie zweimal hintereinander)

async function check() {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return; // beim Entwickeln (npm run dev) gibt es keine version.json
    const { build } = await res.json();
    if (!build || build === __BUILD__ || sessionStorage.getItem(KEY) === build) return;
    sessionStorage.setItem(KEY, build);
    saveNow();
    showLoading(tr('Neue Version wird geladen …', 'Loading the new version …'));
    location.reload();
  } catch {}
}

export function setupUpdateCheck() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  // aus dem Zurück-Speicher des Browsers wiederhergestellt
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) check();
  });
}
