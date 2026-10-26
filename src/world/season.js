// Wetterphasen nach der echten Uhr, je Gebiet ein eigener Kreislauf:
// Savanne: Normal (20 min) → Starkregen (15) → Normal (20) → Trockenzeit (15)
// Dschungel: alle 5 Minuten ein Wechsel: Normal → Starkregen → Normal → aufsteigender Nebel
// dann von vorn. Eine Runde beginnt immer mit Normal, ab dem Anker des Gebiets (beim ersten Spielen gesetzt; die Savanne
// nutzt game.seasonAnchor, die anderen game.seasonAnchors[Gebiet]).
// Das Event "Wetterwechsel" springt sofort zur nächsten Phase (skipSeason).
// Was sich in den Phasen ändert (Karte, Tiere, Boden), steht in levels.js unter <Gebiet>.seasons.
import { game } from '../state.js';
import { tr } from '../i18n.js';

const MINUTE = 60 * 1000;
const CYCLES = {
  savanna: [
    ['normal', 20 * MINUTE],
    ['rain', 15 * MINUTE],
    ['normal', 20 * MINUTE],
    ['dry', 15 * MINUTE],
  ],
  jungle: [
    ['normal', 5 * MINUTE],
    ['rain', 5 * MINUTE],
    ['normal', 5 * MINUTE],
    ['fog', 5 * MINUTE],
  ],
};
export const SEASON_LEVELS = Object.keys(CYCLES);

export const SEASON_INFO = {
  normal: { icon: '🌿', name: tr('Normal', 'Normal') },
  rain: { icon: '🌧️', name: tr('Starkregen', 'Heavy Rain') },
  dry: { icon: '☀️', name: tr('Trockenzeit', 'Dry Season') },
  fog: { icon: '🌫️', name: tr('Nebel', 'Fog') },
};

function anchor(level, now) {
  if (level === 'savanna') {
    if (!Number.isFinite(game.seasonAnchor)) game.seasonAnchor = now;
    return game.seasonAnchor;
  }
  game.seasonAnchors ??= {};
  if (!Number.isFinite(game.seasonAnchors[level])) game.seasonAnchors[level] = now;
  return game.seasonAnchors[level];
}

function setAnchor(level, t) {
  if (level === 'savanna') game.seasonAnchor = t;
  else (game.seasonAnchors ??= {})[level] = t;
}

// Phase jetzt: { id, left (ms bis zum Wechsel), next (id der nächsten Phase), index (Platz in der Runde) }
export function seasonState(level = 'savanna', now = Date.now()) {
  const cycle = CYCLES[level] ?? CYCLES.savanna;
  const round = cycle.reduce((n, [, ms]) => n + ms, 0);
  let t = (((now - anchor(level, now)) % round) + round) % round;
  for (let i = 0; i < cycle.length; i++) {
    const [id, ms] = cycle[i];
    if (t < ms) return { id, left: ms - t, next: cycle[(i + 1) % cycle.length][0], index: i };
    t -= ms;
  }
  return { id: 'normal', left: cycle[0][1], next: cycle[1][0], index: 0 };
}

export function currentSeason(level = 'savanna', now = Date.now()) {
  return seasonState(level, now).id;
}

// Event "Wetterwechsel": die nächste Phase beginnt jetzt (die Uhr läuft von dort normal weiter)
export function skipSeason(level = 'savanna', now = Date.now()) {
  setAnchor(level, anchor(level, now) - seasonState(level, now).left);
}
