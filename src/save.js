// Spielstand im Browser (localStorage): alle 5 Minuten, beim Levelwechsel, wenn die Seite in den Hintergrund geht
// und von Hand im Menü. Solange das Spiel zu ist, steht die Zeit still: Events, Pausen und die Herzen der Besucher
// laufen beim Laden dort weiter, wo gespeichert wurde. Das Test-Spiel speichert nie.
import { game, resetGame } from './state.js';
import { tileToWorld, worldToTile } from './world/iso.js';
import { migrateStory, syncStory } from './story/story.js';
import { SHOP_IDS } from './world/shops.js';

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
  for (const k of Object.keys(game.seasonAnchors ?? {})) game.seasonAnchors[k] += shift;
  // Kisten, Boni und Lagerfeuer: die Uhr läuft weiter, wo sie war (ältere Spielstände haben noch keine)
  game.chests ??= {};
  for (const c of Object.values(game.chests)) if (c.readyAt) c.readyAt += shift;
  if (!game.charms?.owned) game.charms = { owned: [], equipped: [] };
  for (const k of Object.keys(game.levelBonus?.boni ?? {})) game.levelBonus.boni[k] += shift;
  if (game.campfireAt) game.campfireAt += shift;
  delete game.events.icecream; // das Eiswagen-Event gibt es nicht mehr (feste Eisstände als Bude schon)
  migrateSkinSpecies();
  if (!s.game.parkSplit) splitPark();
  if (!s.game.caughtSpecies) migrateCaught();
  if (!Array.isArray(game.bookNew)) game.bookNew = [];
  if (!s.game.seenSpecies) game.seenSpecies = [...game.caughtSpecies]; // gefangene hat man natürlich auch schon gesehen
  if (!s.game.story) migrateStory(); // Spielstand von vor Mavi: alles bleibt offen
  syncStory();
  delete game.tutorial; // (aus älteren Spielständen)
  delete game.quests;
  save.lastSaved = s.savedAt;
  return s.level;
}

// Früher war der Tierpark eine einzige Karte, jetzt sind es drei Abschnitte (park, park2, park3; siehe levels.js): die
// gespeicherten Tiere und Werkzeuge ziehen nach der Zeile ihrer Kachel in ihren Abschnitt und bekommen dessen Koordinaten
// (Versatz der Ausschnitte wie in levels.js). Die Herzen der Abwesenheit kommen ab dem nächsten Besuch je Abschnitt.
function splitPark() {
  game.parkSplit = true;
  game.parkIncome = null;
  const old = game.levels.park;
  if (!old) return;
  const cut = { park: [0, 22], park2: [8, 0], park3: [12, 59] };
  const sectionOf = (ty) => (ty <= 22 ? 'park2' : ty >= 60 ? 'park3' : 'park');
  const levels = { park: { animals: [], pickups: [] }, park2: { animals: [], pickups: [] }, park3: { animals: [], pickups: [] } };
  const move = (list, item) => {
    const id = sectionOf(worldToTile(item.x, item.y).ty);
    const o = tileToWorld(0, 0);
    const d = tileToWorld(-cut[id][0], -cut[id][1]);
    levels[id][list].push({ ...item, x: item.x + d.x - o.x, y: item.y + d.y - o.y });
  };
  for (const a of old.animals ?? []) move('animals', a);
  for (const p of old.pickups ?? []) move('pickups', p);
  Object.assign(game.levels, levels);
}

// Spielstände von vor dem Tierbuch-Fortschritt: gefangene Arten aus den Gehegen, Begleitern und der Herz-Statistik
// ablesen
function migrateCaught() {
  const species = new Set(Object.keys(game.heartsBy).filter((s) => !SHOP_IDS.includes(s)));
  for (const lvl of Object.values(game.levels)) for (const a of lvl.animals) if (a.state === 'penned') species.add(a.species);
  for (const a of game.followers) species.add(a.species);
  game.caughtSpecies = [...species];
}

// Früher eigene Tierarten, jetzt seltene Aussehen (Skins) einer anderen Art: der Hirsch beim Reh, der Gibbon beim
// Brüllaffen. Tiere, Herz-Statistik und Tierbuch-Listen ziehen zur Art um
const SKIN_SPECIES = { stag: 'deer', gibbon: 'howler' };
function migrateSkinSpecies() {
  const fix = (a) => {
    const to = SKIN_SPECIES[a.species];
    if (!to) return;
    a.skin = a.species;
    a.species = to;
  };
  for (const lvl of Object.values(game.levels)) lvl.animals.forEach(fix);
  game.followers.forEach(fix);
  for (const [from, to] of Object.entries(SKIN_SPECIES)) {
    if (game.heartsBy[from]) {
      game.heartsBy[to] = (game.heartsBy[to] ?? 0) + game.heartsBy[from];
      delete game.heartsBy[from];
    }
    const swap = (list) => (list ? [...new Set(list.map((s) => (s === from ? to : s)))] : list);
    game.caughtSpecies = swap(game.caughtSpecies);
    game.seenSpecies = swap(game.seenSpecies);
    for (const k of Object.keys(game.caughtIn ?? {})) game.caughtIn[k] = swap(game.caughtIn[k]);
    if (Array.isArray(game.bookNew)) game.bookNew = [...new Set(game.bookNew.map((e) => e.replace(new RegExp(`:${from}$`), `:${to}`)))];
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
