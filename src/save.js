// Spielstand im Browser (localStorage): alle 5 Minuten, beim Levelwechsel, wenn die Seite in den Hintergrund geht
// und von Hand im Menü. Solange das Spiel zu ist, steht die Zeit still: Events, Pausen und die Herzen der Besucher
// laufen beim Laden dort weiter, wo gespeichert wurde. Das Test-Spiel speichert nie.
import { game, resetGame } from './state.js';

const KEY = 'henrik-spiel-save';
const VERSION = 1;
const AUTOSAVE_EVERY = 5 * 60 * 1000;

export const save = { testMode: false, lastSaved: null };

// Die Szene trägt hier ein, wie sie ihren Stand ablegt (gibt false zurück, wenn gerade nicht gespeichert werden kann)
export const saveHandlers = { snapshot: null };

export function readSave() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s?.version === VERSION && s.game ? s : null;
  } catch {
    return null;
  }
}

export function hasSave() {
  return !!readSave();
}

// level: in welchem Level es beim Laden weitergeht
export function writeSave(level) {
  if (save.testMode) return false;
  try {
    const now = Date.now();
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, savedAt: now, level, game }));
    save.lastSaved = now;
    return true;
  } catch {
    return false;
  }
}

// Spielstand retten, wenn er sich nicht mehr laden lässt (siehe Fehleranzeige in ui/loading.js):
// 'park': im Tierpark weiterspielen statt im zuletzt besuchten Gebiet;
// 'repair': zusätzlich alles Vorübergehende weglassen (wilde Tiere, Begleiter, Fallen). Tiere in Gehegen und Becken,
// Herzen und Ausbauten bleiben. Gibt zurück, ob es geklappt hat.
export function repairSave(mode) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s?.game) return false;
    s.level = 'park';
    if (mode === 'repair') {
      for (const lvl of Object.values(s.game.levels ?? {})) lvl.animals = (lvl.animals ?? []).filter((a) => a.state === 'penned');
      s.game.followers = [];
      s.game.traps = [];
      s.game.tool = null;
    }
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function deleteSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

// Stand übernehmen und alle Uhrzeiten um die Zeit verschieben, in der das Spiel zu war. Gibt das Level zurück.
export function loadSave() {
  const s = readSave();
  if (!s) return null;
  resetGame();
  Object.assign(game, s.game);
  const shift = Date.now() - s.savedAt;
  for (const ev of Object.values(game.events)) {
    for (const k of ['startsAt', 'endsAt', 'readyAt']) if (ev[k] != null) ev[k] += shift;
  }
  for (const lvl of Object.values(game.levels)) for (const a of lvl.animals) if (a.since) a.since += shift;
  if (Number.isFinite(game.seasonAnchor)) game.seasonAnchor += shift; // die Wetterphase läuft weiter, wo sie war
  migrateStag();
  save.lastSaved = s.savedAt;
  return s.level;
}

// Früher war der Hirsch eine eigene Tierart, jetzt ist er ein seltenes Aussehen (Skin) des Rehs
function migrateStag() {
  const fix = (a) => {
    if (a.species !== 'stag') return;
    a.species = 'deer';
    a.skin = 'stag';
  };
  for (const lvl of Object.values(game.levels)) lvl.animals.forEach(fix);
  game.followers.forEach(fix);
  if (game.heartsBy.stag) {
    game.heartsBy.deer = (game.heartsBy.deer ?? 0) + game.heartsBy.stag;
    delete game.heartsBy.stag;
  }
}

export function saveNow() {
  return !save.testMode && !!saveHandlers.snapshot?.();
}

export function setupAutosave() {
  setInterval(saveNow, AUTOSAVE_EVERY);
  // Tablet: Browser wird weggewischt oder der Bildschirm geht aus
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveNow();
  });
}
