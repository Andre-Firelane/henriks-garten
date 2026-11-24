// Spielstand im Browser (localStorage): alle 5 Minuten, beim Levelwechsel, wenn die Seite in den Hintergrund geht
// und von Hand im Menü. Solange das Spiel zu ist, steht die Zeit still: Events, Pausen und die Herzen der Besucher
// laufen beim Laden dort weiter, wo gespeichert wurde. Das Test-Spiel speichert nie.
import { migrateTrophyStats } from './world/trophies.js';
import { game, resetGame } from './state.js';
import { tileToWorld, worldToTile } from './world/iso.js';
import { migrateStory, syncStory } from './story/story.js';
import { SHOP_IDS, migrateLegacySlots } from './world/shops.js';
import { DECOR, giveDecor } from './world/decor.js';
import { LEVELS } from './world/levels.js';
import { fishKind, fishTank } from './world/fishing.js';

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
  if (!s.game.trophies) { game.skinsCaught = null; game.heartsEarned = null; } // (ältere Spielstände: aus dem Stand ablesen)
  migrateTrophyStats();
  if (!Array.isArray(game.mounts)) game.mounts = []; // (ältere Spielstände: noch keine gekauften Reittiere)
  game.scooter = !!game.scooter; // der E-Roller ist jetzt freizuschalten, auch in älteren Spielständen
  if (!game.scooter) game.scooterRiding = false;
  delete game.events.icecream; // das Eiswagen-Event gibt es nicht mehr (feste Eisstände als Bude schon)
  migrateSkinSpecies();
  if (!s.game.parkSplit) splitPark();
  if (!s.game.wildpark) migrateWildpark();
  if (!s.game.caughtSpecies) migrateCaught();
  if (!Array.isArray(game.bookNew)) game.bookNew = [];
  if (!s.game.seenSpecies) game.seenSpecies = [...game.caughtSpecies]; // gefangene hat man natürlich auch schon gesehen
  if (!s.game.story) migrateStory(); // Spielstand von vor Mavi: alles bleibt offen
  if (!s.game.pettingZoo) migratePettingZoo();
  migrateLegacySlots(); // Buden auf den früheren festen Bauplätzen: bleiben stehen, jetzt frei umstellbar
  if (!Array.isArray(s.game.feedUnlocked)) game.feedUnlocked = null; // Futterhaus: Sorten aus den gefangenen Tieren ableiten (ensureFeedState in src/world/friends.js)
  if (!s.game.friends) game.friends = {}; // (ältere Spielstände: noch keine Tierfreunde)
  if (!s.game.bonds) game.bonds = {};
  if (!s.game.nextAnimalId) game.nextAnimalId = 1;
  if (s.game.namings == null) game.namings = Object.keys(game.bonds).length; // jeder bisherige Freund zählt als ein Benennen
  if (!Array.isArray(game.wishes?.open)) game.wishes = { open: [] }; // (ältere Spielstände: noch keine Besucherwünsche)
  if (!s.game.monkeyIsland) migrateMonkeyIsland();
  if (!s.game.jungleHall) migrateJungleHall();
  if (!s.game.spiderSwap) migrateSpiders();
  if (!s.game.iceMap2) migrateIceMap();
  if (!s.game.fishing) migrateFishing();
  syncStory();
  delete game.tutorial; // (aus älteren Spielständen)
  delete game.quests;
  save.lastSaved = s.savedAt;
  return s.level === 'reptiles' ? 'park3' : s.level; // (das Reptilienhaus gibt es nicht mehr, siehe migrateJungleHall)
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

// Früher lebten Frösche, Fische und Biber in einem gemeinsamen Teich (Gehege forestpond), jetzt ist forestpond der
// Biberbach und Fische und Frösche haben den Teich auf der Lichtung (clearingpond, siehe Wildpark in levels.js). War der
// alte Teich ausgebaut, gilt das auch für den neuen, damit beim Umzug kein Tier über die Plätze fällt. Die Tiere selbst
// ziehen beim Betreten des Tierparks in ihr neues Gehege (Tiere, die nicht mehr passen, setzt GardenScene neu ein).
function migrateWildpark() {
  game.wildpark = true;
  if (game.penLevel.forestpond && !game.penLevel.clearingpond) game.penLevel.clearingpond = game.penLevel.forestpond;
}

// Streichelzoo (siehe docs/plan-streichelzoo.md): Maulwürfe gibt es nicht mehr, sie verschwinden aus Gehegen, Begleitern,
// Expedition und allen Listen. Schafe, die beim alten Bauernhof-Event als Kuh, Schwein oder Ziege gefangen wurden
// (farm), sind jetzt echte Kühe, Schweine und Ziegen
export const FARM_SPECIES = ['cow', 'pig', 'goat'];
const GONE_SPECIES = ['mole'];
export function farmToSpecies(d) {
  if (d && FARM_SPECIES.includes(d.farm)) d.species = d.farm;
  if (d) delete d.farm;
  return d;
}
function migratePettingZoo() {
  game.pettingZoo = true;
  const keep = (list) => (list ?? []).filter((a) => !GONE_SPECIES.includes(a.species)).map(farmToSpecies);
  const farmed = new Set();
  const note = (list) => list.forEach((a) => FARM_SPECIES.includes(a.farm) && farmed.add(a.farm));
  for (const lvl of Object.values(game.levels)) {
    note(lvl.animals ?? []);
    lvl.animals = keep(lvl.animals);
  }
  note(game.followers);
  game.followers = keep(game.followers);
  const exp = game.expedition;
  if (exp) {
    note([...(exp.wagon ?? []), ...(exp.stay ?? [])]);
    exp.wagon = keep(exp.wagon);
    exp.stay = keep(exp.stay);
    for (const s of GONE_SPECIES) delete exp.left?.[s];
    for (const s of GONE_SPECIES) delete exp.home?.[s];
  }
  for (const s of FARM_SPECIES) if (game.catches?.[s]) farmed.add(s); // gefangen, aber vielleicht schon ausgewildert
  const drop = (list) => (list ? list.filter((s) => !GONE_SPECIES.includes(s)) : list);
  game.caughtSpecies = [...new Set([...drop(game.caughtSpecies), ...farmed])];
  game.seenSpecies = [...new Set([...drop(game.seenSpecies ?? []), ...farmed])];
  game.tipsSeen = drop(game.tipsSeen);
  for (const k of Object.keys(game.caughtIn ?? {})) game.caughtIn[k] = drop(game.caughtIn[k]);
  game.caughtIn ??= {};
  if (farmed.size) game.caughtIn.meadow = [...new Set([...(game.caughtIn.meadow ?? []), ...farmed])];
  if (Array.isArray(game.bookNew)) game.bookNew = game.bookNew.filter((e) => !GONE_SPECIES.some((s) => e.endsWith(`:${s}`)));
  for (const s of GONE_SPECIES) {
    delete game.catches?.[s];
    delete game.heartsBy?.[s];
  }
  if (GONE_SPECIES.includes(game.rarePromise?.species)) game.rarePromise = null;
}

// Bambuswald (siehe docs/plan-bambuswald.md): Affenquelle, Orang-Utan-Gehege, Affen-Gehege und Gorilla-Gehege gibt es
// nicht mehr, alle Affen leben auf der Affeninsel (monkeys). Die Tierfreunde ziehen mit (Name und Freundschaft bleiben),
// das Spielzeug der alten Gehege fällt weg (die Insel hat ihr eigenes). Die Tiere selbst setzt GardenScene beim Betreten
// des Bambuswalds auf die Insel (Tiere, deren Gehege es nicht mehr gibt, kommen in ein passendes).
const MONKEY_PENS = ['macaques', 'orangutans', 'howlers', 'gorillas'];
function migrateMonkeyIsland() {
  game.monkeyIsland = true;
  for (const [k, uid] of Object.entries(game.friends ?? {})) {
    const [pen, species] = k.split(':');
    if (!MONKEY_PENS.includes(pen)) continue;
    delete game.friends[k];
    game.friends[`monkeys:${species}`] ??= uid;
  }
  for (const pen of MONKEY_PENS) {
    delete game.decor?.toys?.[pen];
    delete game.penLevel?.[pen];
  }
}

// Tropenhalle (siehe docs/plan-dschungel.md): Ara-Voliere, Ameisenbär- und Tapir-Gehege gibt es nicht mehr, ihre Tiere
// leben frei in der Halle (junglehall); die Tierfreunde ziehen mit. Das Reptilienhaus ist weg: seine Tiere ziehen in die
// Terrarien und das Piranha-Becken der Halle (pending: GardenScene setzt sie beim nächsten Besuch ein, wie bei
// sendToSection). 2/3 der Schmetterlinge aus dem Zentrum flattern jetzt in der Halle (der Tierfreund bleibt im Zentrum).
// Deko und Buden im umgebauten Teil (Halle und der Garten unten links) kommen zurück in die Bauen-Leiste.
const JUNGLE_PENS = ['macaws', 'anteaters', 'tapirs'];
function migrateJungleHall() {
  game.jungleHall = true;
  for (const [k, uid] of Object.entries(game.friends ?? {})) {
    const [pen, species] = k.split(':');
    if (!JUNGLE_PENS.includes(pen)) continue;
    delete game.friends[k];
    game.friends[`junglehall:${species}`] ??= uid;
  }
  for (const pen of [...JUNGLE_PENS, 'jaguars']) {
    delete game.decor?.toys?.[pen];
    delete game.penLevel?.[pen];
  }
  const park3 = (game.levels.park3 ??= { animals: [], pickups: [] });
  // Reptilienhaus → Terrarien der Halle
  for (const a of game.levels.reptiles?.animals ?? []) {
    if (a.state === 'penned') park3.animals.push({ ...a, pending: true, origin: 'jungle' });
  }
  delete game.levels.reptiles;
  // Schmetterlinge: zwei Drittel in die Halle
  const park = game.levels.park;
  if (park?.animals) {
    const friend = game.friends?.['butterflies:butterfly'];
    const flies = park.animals.filter((a) => a.species === 'butterfly' && a.state === 'penned' && (friend == null || a.uid !== friend));
    const all = park.animals.filter((a) => a.species === 'butterfly' && a.state === 'penned').length;
    for (const a of flies.slice(0, Math.round((all * 2) / 3))) {
      park.animals.splice(park.animals.indexOf(a), 1);
      park3.animals.push({ ...a, pending: true, origin: 'meadow' });
    }
  }
  // umgebaut (Kacheln im Abschnitt park3): die Halle, der Rasen davor und der Garten unten links (früher Tapir- und Okapi-Gehege)
  const rebuilt = (tx, ty) => (tx >= 48 && tx <= 83 && ty >= 0 && ty <= 38) || (tx >= 44 && tx <= 47 && ty >= 13 && ty <= 38) || (tx >= 24 && tx <= 43 && ty >= 24 && ty <= 38);
  const placed = game.decor?.placed?.park3;
  if (placed) {
    game.decor.placed.park3 = placed.filter((d) => {
      if (!rebuilt(d.tx, d.ty)) return true;
      if (DECOR[d.id]) giveDecor(d.id);
      return false;
    });
  }
  for (const [id, b] of Object.entries(game.booths ?? {})) {
    if (b.level !== 'park3' || b.stored) continue;
    if ([[0, 0], [1, 0], [0, 1], [1, 1]].some(([dx, dy]) => rebuilt(b.tx + dx, b.ty + dy))) game.booths[id] = { level: 'park3', stored: true };
  }
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
const PLACEHOLDER_DONE = {
  sheep_r: 'sheep2', fox_r: 'fox2', squirrel_r: 'squirrel2', macaque_r: 'macaque2', octopus_r: 'octopus2',
  meerkat_r: 'meerkat2', hippo_r: 'hippo2', warthog_r: 'warthog2', anteater_r: 'anteater2', toucan_r: 'toucan2',
  penguin_r: 'penguin2', seal_r: 'seal2', seahorse_r: 'seahorse2', turtle_r: 'turtle2',
};
function migrateSkinSpecies() {
  const fix = (a) => {
    const to = SKIN_SPECIES[a.species];
    if (!to) return;
    a.skin = a.species;
    a.species = to;
  };
  for (const lvl of Object.values(game.levels)) lvl.animals.forEach(fix);
  game.followers.forEach(fix);
  // eingefärbte Platzhalter-Skins, die inzwischen ein eigenes Bild haben, werden zu diesem Skin
  const real = (a) => {
    if (a.skin && PLACEHOLDER_DONE[a.skin]) a.skin = PLACEHOLDER_DONE[a.skin];
  };
  for (const lvl of Object.values(game.levels)) lvl.animals.forEach(real);
  game.followers.forEach(real);
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

// Früher war die pelzige Vogelspinne die normale Spinne und die goldene die seltene; jetzt ist es umgekehrt (die pelzige
// ist die Fellfarbe tarantula_fur, animals/coats.js). Jede gespeicherte Spinne behält ihr Aussehen
// Die Eiswelt hat eine neue Karte (zwei Inseln, Fjord, Tundra; docs/plan-eiswelt.md): die wilden Tiere der alten Karte
// stünden jetzt womöglich im Wasser, sie kommen beim nächsten Besuch neu; liegengelassene Werkzeuge liegen dann vor der
// Forschungsstation
function migrateIceMap() {
  game.iceMap2 = true;
  const lvl = game.levels.ice;
  if (!lvl) return;
  const o = tileToWorld(21, 24);
  lvl.animals = (lvl.animals ?? []).filter((a) => a.state !== 'wild');
  lvl.pickups = (lvl.pickups ?? []).map((p) => ({ ...p, x: o.x, y: o.y }));
}

// Angeln (docs/plan-angeln.md): Fische leben nicht mehr im Teich auf der Lichtung (clearingpond), sondern in der
// Süßwasserhalle des Aquariums, je Welt in einem eigenen Becken (fishTank). Jeder gespeicherte Fisch zieht dorthin und
// behält seine Art; der orange Fisch ohne Art ist jetzt der Goldfisch, alle bisherigen Fische sind klein (variant 0).
// Tierfreunde ziehen mit (Name und Freundschaft bleiben). Passen nicht alle ins Becken, werden die übrigen ausgewildert
// und bringen je 2 Herzen (Tierfreunde nie). Wilde Fische gibt es nicht mehr (nur noch Schatten zum Angeln).
const RELEASE_HEARTS = 2;
function migrateFishing() {
  game.fishing = true;
  const fix = (a) => {
    if (a?.species !== 'fish') return;
    a.skin = fishKind(a.skin).id;
    a.variant = a.variant === 1 ? 1 : 0;
  };
  game.followers.forEach(fix);
  for (const list of [game.expedition?.wagon, game.expedition?.stay]) (list ?? []).forEach(fix);
  if (game.rarePromise?.species === 'fish') game.rarePromise = null;
  // Fisch-Tierfreunde: alter Schlüssel (Gehege:fish) -> uid
  const friendUids = new Set();
  for (const [k, uid] of Object.entries(game.friends ?? {})) {
    if (!k.endsWith(':fish')) continue;
    friendUids.add(uid);
    delete game.friends[k];
  }
  const aq = LEVELS.aquarium;
  const tanks = Object.fromEntries(
    aq.enclosures.filter((e) => e.species?.includes('fish')).map((e) => {
      const b = aq.buildings.find((h) => h.style === 'tank' && e.seed.tx >= h.tx0 && e.seed.tx <= h.tx1 && e.seed.ty >= h.ty0 && e.seed.ty <= h.ty1);
      return [e.id, { e, b }];
    }),
  );
  const home = (game.levels.aquarium ??= { animals: [], pickups: [] });
  home.animals ??= [];
  const count = (id) => home.animals.filter((s) => s.species === 'fish' && s.state === 'penned' && s.tank === id).length;
  for (const [id, lvl] of Object.entries(game.levels)) {
    if (!Array.isArray(lvl.animals)) continue;
    const keep = [];
    for (const a of lvl.animals) {
      if (a.species !== 'fish' || (id === 'aquarium' && a.state === 'penned')) {
        keep.push(a);
        continue;
      }
      if (a.state !== 'penned') continue; // wild (oder sonst unterwegs): verschwindet
      fix(a);
      const t = tanks[fishTank(a.skin)];
      const friend = a.uid != null && friendUids.has(a.uid);
      if (!t || (!friend && count(t.e.id) >= t.e.slots[0])) {
        game.hearts = (game.hearts ?? 0) + RELEASE_HEARTS;
        continue;
      }
      const p = tileToWorld(t.b.tx0 + 1 + Math.random() * (t.b.tx1 - t.b.tx0 - 2), t.b.ty0 + 1 + Math.random() * (t.b.ty1 - t.b.ty0 - 2));
      home.animals.push({ ...a, x: p.x, y: p.y, state: 'penned', tank: t.e.id, pending: undefined, origin: a.origin ?? fishKind(a.skin).world });
      if (friend) game.friends[`${t.e.id}:fish`] ??= a.uid;
    }
    if (id !== 'aquarium') lvl.animals = keep;
  }
  for (const a of home.animals) delete a.tank;
}

function migrateSpiders() {
  game.spiderSwap = true;
  const swap = (a) => {
    if (a?.species !== 'tarantula') return;
    a.skin = a.skin === 'tarantula2' ? null : 'tarantula_fur';
  };
  for (const lvl of Object.values(game.levels)) lvl.animals.forEach(swap);
  game.followers.forEach(swap);
  for (const list of [game.expedition?.wagon, game.expedition?.stay]) (list ?? []).forEach(swap);
  if (game.rarePromise?.species === 'tarantula') game.rarePromise = null;
  if (Array.isArray(game.wishes?.open)) game.wishes.open = game.wishes.open.filter((w) => !(w.species === 'tarantula' && w.skin));
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
