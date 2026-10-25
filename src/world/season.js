// Wetterphasen der Savanne nach der echten Uhr: Normal (20 min) → Starkregen (15) → Normal (20) → Trockenzeit (15),
// dann von vorn. Eine Runde beginnt immer mit Normal, ab game.seasonAnchor (beim ersten Spielen gesetzt).
// Das Event "Savannen-Wetterwechsel" springt sofort zur nächsten Phase (skipSeason).
// Was sich in den Phasen ändert (Karte, Tiere, Boden), steht in levels.js unter savanna.seasons.
import { game } from '../state.js';
import { tr } from '../i18n.js';

const MINUTE = 60 * 1000;
const CYCLE = [
  ['normal', 20 * MINUTE],
  ['rain', 15 * MINUTE],
  ['normal', 20 * MINUTE],
  ['dry', 15 * MINUTE],
];
const ROUND = CYCLE.reduce((n, [, ms]) => n + ms, 0);

export const SEASON_INFO = {
  normal: { icon: '🌿', name: tr('Normal', 'Normal') },
  rain: { icon: '🌧️', name: tr('Starkregen', 'Heavy Rain') },
  dry: { icon: '☀️', name: tr('Trockenzeit', 'Dry Season') },
};

function anchor(now) {
  if (!Number.isFinite(game.seasonAnchor)) game.seasonAnchor = now;
  return game.seasonAnchor;
}

// Phase jetzt: { id, left (ms bis zum Wechsel), next (id der nächsten Phase), index (Platz in der Runde) }
export function seasonState(now = Date.now()) {
  let t = (((now - anchor(now)) % ROUND) + ROUND) % ROUND;
  for (let i = 0; i < CYCLE.length; i++) {
    const [id, ms] = CYCLE[i];
    if (t < ms) return { id, left: ms - t, next: CYCLE[(i + 1) % CYCLE.length][0], index: i };
    t -= ms;
  }
  return { id: 'normal', left: CYCLE[0][1], next: 'rain', index: 0 };
}

export function currentSeason(now = Date.now()) {
  return seasonState(now).id;
}

// Event "Savannen-Wetterwechsel": die nächste Phase beginnt jetzt (die Uhr läuft von dort normal weiter)
export function skipSeason(now = Date.now()) {
  game.seasonAnchor = anchor(now) - seasonState(now).left;
}
