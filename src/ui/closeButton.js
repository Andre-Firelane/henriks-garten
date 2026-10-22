// Kleines Schließen-Symbol oben rechts in allen Tafeln (Events, Kiste, Weltkarte, Menü, Übersicht) – auf kleinen
// Bildschirmen füllt die Tafel oft alles aus, dann gibt es kein "daneben tippen" zum Schließen.
import { tr } from '../i18n.js';

export const CLOSE_BUTTON = `<button class="ov-close" aria-label="${tr('Schließen', 'Close')}">✕</button>`;

// Wurde das Schließen-Symbol angetippt?
export function isCloseClick(e) {
  return !!e.target.closest?.('.ov-close');
}
