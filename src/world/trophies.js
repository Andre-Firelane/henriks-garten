// Trophäen (Erfolge, Plan: docs/plan-haupthaus.md). Jede Trophäe prüft den Spielstand (check); erreicht steht sie in
// game.trophies = { id: Zeitpunkt }. Geprüft wird regelmäßig in GardenScene (checkTrophies), beim ersten Mal nach dem
// Laden ohne Meldung. Was der Spielstand dafür sonst nicht kennt, zählt er eigens mit: game.wishesDone, game.heartsEarned,
// game.expDone ({ Biom: Anzahl beendeter Expeditionen }), game.skinsCaught (gefangene Aussehen) und game.fullSections
// (Tierpark-Abschnitte, in denen einmal alle Gehege voll waren).
// Bilder: je Trophäe ein eigenes (trophy_<id>.png) fehlen noch; bis dahin eine Plakette in Bronze/Silber/Gold mit Symbol.
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { LEVELS } from './levels.js';
import { STEPS } from '../story/steps.js';
import { SKINS } from '../animals/Animal.js';
import { COATS } from '../animals/coats.js';
import { EVENTS } from './events.js';
import { MOUNTS } from './mounts.js';
import { FRIEND_LEVELS, friendLevel } from './friends.js';

const WORLDS = [
  ['meadow', tr('Wiese', 'Meadow'), 'sheep'],
  ['forest', tr('Wald', 'Forest'), 'deer'],
  ['savanna', tr('Savanne', 'Savanna'), 'giraffe'],
  ['asia', tr('Bambuswald', 'Bamboo Forest'), 'panda'],
  ['jungle', tr('Dschungel', 'Jungle'), 'toucan'],
  ['reef', tr('Riff', 'Reef'), 'turtle'],
  ['ice', tr('Eiswelt', 'Ice World'), 'polarbear'],
];
const SECTIONS = [
  ['park', tr('Zentrum', 'Center'), 'sheep'],
  ['park2', tr('Savanne', 'Savanna'), 'lion'],
  ['park3', tr('Bambuswald', 'Bamboo Forest'), 'panda'],
  ['park4', tr('Eiswelt', 'Ice World'), 'polarbear'],
];

const caught = (sp) => game.caughtSpecies?.includes(sp);
// Arten je Welt und alle Arten: dieselben Listen wie im Tierbuch (setzt GardenScene über setTrophySpecies, samt den
// Tieren, die nur bei einem Event kommen)
let speciesLists = { all: [], of: () => [] };
// (die Listen je Welt ändern sich im Spiel nicht: einmal ausrechnen, die Prüfung läuft alle paar Sekunden)
export function setTrophySpecies(all, of) {
  const memo = new Map();
  speciesLists = { all, of: (w) => (memo.has(w) ? memo.get(w) : memo.set(w, of(w)).get(w)) };
}
const worldSpecies = (w) => speciesLists.of(w);
const allSpecies = () => speciesLists.all;
const skinsOf = (sp) => [SKINS[sp] ?? []].flat();
const rareSkins = () => (game.skinsCaught ?? []).filter((id) => Object.keys(SKINS).some((sp) => skinsOf(sp).some((s) => s.id === id && !s.common)));
const expBiomes = () => [...new Set(Object.values(LEVELS).map((l) => l.expedition).filter(Boolean))];
const expCount = () => Object.values(game.expDone ?? {}).reduce((n, k) => n + k, 0);
const bondsNamed = () => Object.values(game.bonds ?? {}).filter((b) => b.name);
const count = (list, f) => list.filter(f).length;
const eventIds = () => EVENTS.map((e) => e.id).filter((id) => id !== 'ride');

// tier: 'bronze' | 'silver' | 'gold'; icon: Tierart fürs Bildchen (animal) oder ein Zeichen (mark)
export const TROPHIES = [
  ...WORLDS.map(([w, name, animal]) => ({
    id: `world_${w}`, group: 'book', tier: 'silver', animal,
    name: tr(`Alle Tiere: ${name}`, `All animals: ${name}`),
    text: tr('Jede Tierart dieser Welt gefangen.', 'Caught every kind of animal in this world.'),
    progress: () => [count(worldSpecies(w), caught), worldSpecies(w).length],
    check: () => worldSpecies(w).length > 0 && worldSpecies(w).every(caught),
  })),
  { id: 'world_all', group: 'book', tier: 'gold', mark: '★', name: tr('Alle Tiere der Welt', 'Every animal'), text: tr('Jede Tierart im Spiel gefangen.', 'Caught every kind of animal in the game.'), progress: () => [count(allSpecies(), caught), allSpecies().length], check: () => allSpecies().length > 0 && allSpecies().every(caught) },
  { id: 'rare_1', group: 'coats', tier: 'bronze', animal: 'cat2', name: tr('Etwas Seltenes', 'Something rare'), text: tr('Ein seltenes Tier gefangen.', 'Caught a rare animal.'), progress: () => [Math.min(1, rareSkins().length), 1], check: () => rareSkins().length >= 1 },
  { id: 'rare_10', group: 'coats', tier: 'silver', animal: 'tiger2', name: tr('Sammler', 'Collector'), text: tr('10 verschiedene seltene Tiere gefangen.', 'Caught 10 different rare animals.'), progress: () => [Math.min(10, rareSkins().length), 10], check: () => rareSkins().length >= 10 },
  ...Object.keys(COATS).map((sp) => ({
    id: `coats_${sp}`, group: 'coats', tier: 'gold', animal: sp,
    name: tr('Alle Fellfarben', 'All coats'),
    text: tr('Jedes Aussehen dieser Tierart gefangen.', 'Caught every look of this animal.'),
    progress: () => [count(skinsOf(sp), (k) => game.skinsCaught?.includes(k.id)) + (caught(sp) ? 1 : 0), skinsOf(sp).length + 1], // (+1: das Grundbild)
    check: () => caught(sp) && skinsOf(sp).every((s) => game.skinsCaught?.includes(s.id)),
  })),
  { id: 'friend_max', group: 'friends', tier: 'gold', mark: '♥', name: tr('Beste Freunde', 'Best friends'), text: tr('Ein bester Freund (Stufe 4).', 'A best friend (level 4).'), progress: () => [Math.max(0, ...Object.values(game.bonds ?? {}).map((b) => friendLevel(b))), FRIEND_LEVELS.length], check: () => Object.values(game.bonds ?? {}).some((b) => friendLevel(b) >= FRIEND_LEVELS.length) },
  { id: 'friend_10', group: 'friends', tier: 'silver', mark: '♥', name: tr('10 Tierfreunde', '10 animal friends'), text: tr('10 Tieren einen Namen gegeben.', 'Named 10 animals.'), progress: () => [Math.min(10, bondsNamed().length), 10], check: () => bondsNamed().length >= 10 },
  ...SECTIONS.map(([s, name, animal]) => ({
    id: `full_${s}`, group: 'park', tier: 'gold', animal,
    name: tr(`Volles Haus: ${name}`, `Full house: ${name}`),
    text: tr('Alle Gehege dieses Abschnitts voll.', 'Every enclosure in this area full.'),
    progress: () => game.sectionFill?.[s] ?? [0, 0], // (zuletzt im Abschnitt gezählt; 0 / 0: noch nicht dort gewesen)
    check: () => !!game.fullSections?.includes(s),
  })),
  { id: 'wishes_10', group: 'visitors', tier: 'silver', mark: '✿', name: tr('Wunscherfüller', 'Wish granter'), text: tr('10 Besucherwünsche erfüllt.', 'Granted 10 visitor wishes.'), progress: () => [Math.min(10, game.wishesDone ?? 0), 10], check: () => (game.wishesDone ?? 0) >= 10 },
  { id: 'wishes_50', group: 'visitors', tier: 'gold', mark: '✿', name: tr('Wunschzauberer', 'Wish wizard'), text: tr('50 Besucherwünsche erfüllt.', 'Granted 50 visitor wishes.'), progress: () => [Math.min(50, game.wishesDone ?? 0), 50], check: () => (game.wishesDone ?? 0) >= 50 },
  { id: 'hearts_1000', group: 'visitors', tier: 'silver', mark: '♥', name: tr('1.000 Herzen', '1,000 hearts'), text: tr('Insgesamt 1.000 Herzen gesammelt.', 'Collected 1,000 hearts in total.'), progress: () => [Math.min(1000, game.heartsEarned ?? 0), 1000], check: () => (game.heartsEarned ?? 0) >= 1000 },
  { id: 'hearts_10000', group: 'visitors', tier: 'gold', mark: '♥', name: tr('10.000 Herzen', '10,000 hearts'), text: tr('Insgesamt 10.000 Herzen gesammelt.', 'Collected 10,000 hearts in total.'), progress: () => [Math.min(10000, game.heartsEarned ?? 0), 10000], check: () => (game.heartsEarned ?? 0) >= 10000 },
  { id: 'exp_1', group: 'travel', tier: 'bronze', mark: '⚑', name: tr('Erste Expedition', 'First expedition'), text: tr('Eine Expedition bis zum Ziel geschafft.', 'Finished an expedition.'), progress: () => [Math.min(1, expCount()), 1], check: () => expCount() >= 1 },
  { id: 'exp_10', group: 'travel', tier: 'silver', mark: '⚑', name: tr('Entdecker', 'Explorer'), text: tr('10 Expeditionen geschafft.', 'Finished 10 expeditions.'), progress: () => [Math.min(10, expCount()), 10], check: () => expCount() >= 10 },
  { id: 'exp_all', group: 'travel', tier: 'gold', mark: '⚑', name: tr('Weltreisender', 'Globetrotter'), text: tr('Jede Expedition einmal geschafft.', 'Finished every expedition once.'), progress: () => [count(expBiomes(), (b) => game.expDone?.[b] > 0), expBiomes().length], check: () => expBiomes().every((b) => game.expDone?.[b] > 0) },
  { id: 'events_all', group: 'travel', tier: 'gold', mark: '✦', name: tr('Festmeister', 'Party master'), text: tr('Jedes Event einmal gestartet.', 'Started every event once.'), progress: () => [count(eventIds(), (id) => game.events?.[id]), eventIds().length], check: () => eventIds().every((id) => game.events?.[id]) },
  { id: 'mounts_all', group: 'travel', tier: 'gold', mark: '♞', name: tr('Großer Stall', 'Big stable'), text: tr('Alle Reittiere gekauft.', 'Bought every mount.'), progress: () => [count(Object.keys(MOUNTS), (a) => game.mounts?.includes(a)), Object.keys(MOUNTS).length], check: () => Object.keys(MOUNTS).every((a) => game.mounts?.includes(a)) },
  { id: 'story', group: 'mavi', tier: 'gold', mark: '★', name: tr('Tierparkdirektor', 'Zoo director'), text: tr('Alle Aufgaben von Mavi geschafft.', 'Finished all of Mavi’s tasks.'), progress: () => [game.story?.id === null ? STEPS.length : game.story?.step ?? 0, STEPS.length], check: () => game.story?.id === null },
];

export const TROPHY_GROUPS = {
  book: tr('Tierbuch', 'Animal Book'),
  coats: tr('Fellfarben', 'Coats'),
  friends: tr('Tierfreunde', 'Animal friends'),
  park: tr('Tierpark', 'Zoo'),
  visitors: tr('Besucher', 'Visitors'),
  travel: tr('Unterwegs', 'On the road'),
  mavi: 'Mavi',
};

export const hasTrophy = (id) => !!game.trophies?.[id];

// prüft alle noch nicht erreichten Trophäen; gibt die neu erreichten zurück
export function checkTrophies(now = Date.now()) {
  game.trophies ??= {};
  const fresh = [];
  for (const t of TROPHIES) {
    if (game.trophies[t.id]) continue;
    let ok = false;
    try {
      ok = t.check();
    } catch {}
    if (ok) {
      game.trophies[t.id] = now;
      fresh.push(t);
    }
  }
  return fresh;
}

// --- mitzählen (für Trophäen, die der Spielstand sonst nicht kennt) ---
export function noteSkin(skin) {
  if (!skin) return;
  game.skinsCaught ??= [];
  if (!game.skinsCaught.includes(skin)) game.skinsCaught.push(skin);
}
export function noteHearts(n) {
  if (n > 0) game.heartsEarned = (game.heartsEarned ?? 0) + n;
}
export function noteWish() {
  game.wishesDone = (game.wishesDone ?? 0) + 1;
}
export function noteExpedition(biome) {
  game.expDone ??= {};
  game.expDone[biome] = (game.expDone[biome] ?? 0) + 1;
}
// Fortschritt einer Trophäe: [erreicht, Ziel] (erreichte Trophäen: voll)
export function trophyProgress(t) {
  let p = [0, 1];
  try {
    p = t.progress?.() ?? p;
  } catch {}
  return hasTrophy(t.id) ? [p[1] || 1, p[1] || 1] : p;
}

// Tierpark-Abschnitt: volle Gehege / Gehege (für den Fortschritt von "Volles Haus")
export function noteSectionFill(section, full, total) {
  game.sectionFill ??= {};
  game.sectionFill[section] = [full, total];
}
export function noteSectionFull(section) {
  game.fullSections ??= [];
  if (!game.fullSections.includes(section)) game.fullSections.push(section);
}

// ältere Spielstände: was sich schon ablesen lässt (Aussehen der Tiere im Park und unterwegs, Herzen der Besucher)
export function migrateTrophyStats() {
  if (!Array.isArray(game.skinsCaught)) {
    game.skinsCaught = [];
    for (const lvl of Object.values(game.levels ?? {})) for (const a of lvl.animals ?? []) noteSkin(a.skin);
    for (const a of game.followers ?? []) noteSkin(a.skin);
  }
  if (game.heartsEarned == null) game.heartsEarned = Object.values(game.heartsBy ?? {}).reduce((n, k) => n + k, 0);
  game.wishesDone ??= 0;
  game.expDone ??= {};
  game.fullSections ??= [];
  game.trophies ??= {};
}

// Bildchen (Platzhalter bis zu den eigenen Bildern): Plakette in der Farbe der Stufe mit Tier oder Zeichen
export function trophyBadge(t, animalIcon, got = true) {
  const inner = t.animal ? animalIcon(t.animal, 2.6) : `<span class="tr-mark">${t.mark ?? '★'}</span>`;
  return `<span class="tr-badge ${t.tier}${got ? '' : ' locked'}">${inner}</span>`;
}
