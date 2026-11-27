// Expeditionen (Roguelike-Modus: Savanne, Dschungel, Bambuswald, Wald, Eiswelt): ein Durchlauf (Run) ist eine Kette aus höchstens RUN_LENGTH
// kleinen Maps, dazwischen das Camp. Vor jeder Map wählt man 1 aus 3 Karten (wie in einer Kiste): jede Karte zeigt die
// nächste Map und was dort dazukommt (sicher diese Tierart, eine seltene Variante, ein Bonus bis zum Ende des Runs oder eine
// Kiste). Auf der Map lebt eine feste Tierliste (kein Nachspawnen), oben zählt sie herunter. Gefangene laufen hinterher; im
// Camp kommen sie in den Wagen (WAGON_CAGES Käfige, je einer pro Art mit cageSize Plätzen) – was ohnehin ins
// Naturreservat käme, wird gleich ausgewildert.
// Verlieren kann man nicht: Heimfahrt aus jedem Camp. Hier stehen nur Zustand und Regeln; Ablauf siehe GardenScene
// (exp…-Methoden), Maps siehe expeditionMaps.js.
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { LEVELS } from './levels.js';
import { expeditionMaps, campOf } from './expeditionMaps.js';
import { rareSkinFor } from '../animals/Animal.js';
import { hasCharm } from './luck.js';

export const RUN_LENGTH = 4; // so viele Maps hat ein Run höchstens
export const WAGON_CAGES = 4; // Käfige im Wagen: je Käfig nur eine Tierart (eine Art darf auch mehrere Käfige füllen)
export const CAGE_SIZE = 3; // so viele Tiere einer Art passen in einen Käfig ...
const BIG_CAGE = { fish: 5, reeffish: 5, koi: 5, piranha: 5, seahorse: 5 }; // ... Fische und andere kleine Wassertiere: Tank mit mehr Plätzen
// mit dem Bonus "Mehr Tiere" ein Platz mehr in jedem Käfig, mit "Größerer Wagen" ein Käfig mehr
const runHas = (id) => !!run()?.boni.includes(id);
// (Glücksbringer Großer Käfig: noch ein Platz mehr)
export const isWaterAnimal = (species) => species in BIG_CAGE; // schwimmt im Camp im Becken, nicht im Käfig
export const cageSize = (species) => (BIG_CAGE[species] ?? CAGE_SIZE) + (runHas('moreAnimals') ? 1 : 0) + (hasCharm('bigCage') ? 1 : 0);
export const wagonCageCount = () => WAGON_CAGES + (runHas('bigWagon') ? 1 : 0);
export const MORE_UNITS = 1; // Bonus "Mehr Tiere": so viele Tiere mehr je Art auf jeder Map (gilt ab sofort, auch auf der laufenden)
// Boni, die es als Karte gibt (vorhandene Kisten-Boni; sie gelten bis zum Ende des Runs)
export const RUN_BONI = ['moreAnimals', 'ride', 'binoculars', 'bigCatch', 'bigWagon', 'heartRain'];
const NO_RIDE = ['ice']; // in diesen Welten gibt es kein Reittier: keine Bonus-Karte "Reittier"
// Tiere, die nicht beim Betreten dastehen, sondern auf ihre Weise kommen (Geier fliegen heran, Hyänen kommen zu Knochen)
export const CALLED_UNITS = ['vulture', 'hyena', 'heron', 'gnu', 'redpanda', 'yak', 'beaver', 'wolf', 'arcticwolf', 'snowowl', 'dartfrog']; // (Pfeilgiftfrösche: kommen mit der Leuchtnacht; Gnus: aus der Großen Wanderung; rote Pandas: Glühwürmchen-Abend; Yaks: die Herde am Steinhaufen; Biber: die Kolonie am Damm; Wölfe: Rudel der Wolfsnacht; Polarwölfe: ihr Rudel in der Tundra; Schneeeule: setzt sich selbst in eine Tanne)
// Anteil der Kartenarten
const KINDS = { animal: 0.45, rare: 0.2, bonus: 0.25, chest: 0.15, event: 0.12 }; // event: nur zu Maps mit Event (Gnu-Furt, Glühwürmchen-Abend, Wolfsnacht)
// Event-Karten: Kennzeichen der Map → Event und die Tiere, die es bringt (Gnus aus der Großen Wanderung, rote Pandas in
// den Kirschbäumen am Glühwürmchen-Abend, Wolfsrudel in der Wolfsnacht). Immer mindestens 4 (Gnus, Pandas bzw. Rudel);
// alone: auf der Map gibt es dann nur diese Tiere, das Wetter bleibt normal (season: bzw. dieses, z. B. Tag in der Eiswelt).
// Eiswelt: Papageitaucher-Zug auf den Vogelfelsen (docs/plan-papageitaucher.md)
export const MAP_EVENTS = { migration: { species: 'gnu', units: 4, alone: true }, fireflies: { species: 'redpanda', units: 4, alone: true }, wolfNight: { species: 'wolf', units: 4, alone: true }, puffins: { species: 'puffin', units: 4, alone: true, season: 'day' }, glowNight: { species: 'dartfrog', units: 4, alone: true } };
export const mapEvent = (map) => Object.keys(MAP_EVENTS).find((k) => LEVELS[map]?.[k]) ?? null;

// --- Tiere und Wetter einer Map (werden vor jeder Map neu gewürfelt) ---

export { SPECIES_RULES, BIOME_SEASONS } from './speciesRules.js';
import { SPECIES_RULES, BIOME_SEASONS, SEASON_WEIGHTS } from './speciesRules.js';
const SPECIES_PER_MAP = [2, 3];
const MIN_UNITS = 4; // so viele Tiere (Fang-Einheiten) hat jede Map mindestens
// Seltene Merkmale (Wasserfall, Lichtung, Fluss, Dickicht, Elefantenfriedhof): auf ihren Maps kommt meist (SPECIAL_CHANCE)
// eine Art, die es braucht; Wasser hat jede Savannen-Map, das zählt nicht als selten
const SPECIAL_CHANCE = 0.6;
const COMMON_FEATURES = ['water', 'meadow']; // (meadow: grüne Maps im Bambuswald, für den Pfau)

// Tiere und Wetter für eine Map auswürfeln. Erst ein Anker: auf Maps mit seltenem Merkmal meist eine Art dafür (ihr
// Wetter gilt dann), sonst ein gleichmäßig gewürfeltes Wetter; dann weitere Arten, die auf die Map passen und mit dem
// bisher möglichen Wetter zusammengehen; zuletzt eins der Wetter, das alle erlauben. must: diese Art soll sicher dabei sein.
// Gibt { home: { Art: Einheiten }, season } zurück
export function planMap(map, biome, must = null) {
  const rules = SPECIES_RULES[biome] ?? {};
  const all = BIOME_SEASONS[biome] ?? ['normal'];
  const feats = LEVELS[map]?.features ?? [];
  // seltene Arten (rare in speciesRules.js, z. B. der Papageitaucher) dürfen nur bei Glück auf diese Map (außer als must)
  // eventOnly (Papageitaucher): nur über ihre Event-Karte, nie im normalen Würfeln
  const unlucky = new Set(Object.keys(rules).filter((sp) => sp !== must && (rules[sp].eventOnly || (rules[sp].rare && Math.random() >= rules[sp].rare))));
  const fits = (sp) => !unlucky.has(sp) && (!rules[sp].needs || feats.includes(rules[sp].needs));
  const allowed = (sp) => rules[sp].seasons ?? all;
  let seasons = [...all];
  const home = {};
  const add = (sp) => {
    seasons = seasons.filter((x) => allowed(sp).includes(x));
    const [a, b] = rules[sp].units;
    home[sp] = a + Math.floor(Math.random() * (b - a + 1));
  };
  const weights = SEASON_WEIGHTS[biome];
  // Wetter auswürfeln (mit Gewichten, z. B. Eiswelt: öfter Tag als Nacht)
  const pickSeason = (list) => {
    if (!weights) return pick(list);
    let x = Math.random() * list.reduce((s, k) => s + (weights[k] ?? 1), 0);
    return list.find((k) => (x -= weights[k] ?? 1) <= 0) ?? list[0];
  };
  const specials = Object.keys(rules).filter((sp) => rules[sp].needs && !COMMON_FEATURES.includes(rules[sp].needs) && fits(sp));
  // nur ein Wetter, bei dem überhaupt eine Art dieser Map vorkommt (sonst bliebe z. B. die Stupa-Weide bei Nebel leer)
  const possible = all.filter((x) => Object.keys(rules).some((sp) => fits(sp) && allowed(sp).includes(x)));
  // mit Gewichten (Eiswelt): erst das Wetter, dann – wenn es eine gibt – eine seltene Art, die es dabei gibt (sonst zöge
  // z. B. der Eisbär auf dem Packeis die Nacht viel zu oft fest)
  const w = weights && !(must && rules[must] && fits(must)) ? pickSeason(possible.length ? possible : all) : null;
  const anchors = w ? specials.filter((sp) => allowed(sp).includes(w)) : specials;
  if (must && rules[must] && fits(must)) add(must);
  else if (anchors.length && Math.random() < SPECIAL_CHANCE) add(pick(anchors));
  if (w) seasons = [w];
  else if (!Object.keys(home).length) seasons = [pickSeason(possible.length ? possible : all)];
  const n = SPECIES_PER_MAP[0] + Math.floor(Math.random() * (SPECIES_PER_MAP[1] - SPECIES_PER_MAP[0] + 1));
  while (Object.keys(home).length < n) {
    const pool = Object.keys(rules).filter((sp) => !home[sp] && fits(sp) && allowed(sp).some((x) => seasons.includes(x)));
    if (!pool.length) break;
    add(pick(pool));
  }
  // mindestens MIN_UNITS Tiere: erst Arten bis zu ihrer Höchstzahl auffüllen, dann noch eine passende Art dazu, zuletzt von
  // den Arten mehr, die es öfter gibt (nicht die Einzelgänger wie Schneeleopard oder Jaguar, außer es geht nicht anders)
  const total = () => Object.values(home).reduce((sum, k) => sum + k, 0);
  while (total() < MIN_UNITS) {
    const below = Object.keys(home).filter((sp) => home[sp] < rules[sp].units[1]);
    if (below.length) {
      home[pick(below)]++;
      continue;
    }
    const pool = Object.keys(rules).filter((sp) => !home[sp] && fits(sp) && allowed(sp).some((x) => seasons.includes(x)));
    if (pool.length) {
      add(pick(pool));
      continue;
    }
    const many = Object.keys(home).filter((sp) => rules[sp].units[1] > 1);
    const list = many.length ? many : Object.keys(home);
    if (!list.length) break;
    home[pick(list)]++;
  }
  return { home, season: pickSeason(seasons.length ? seasons : all) };
}

export const run = () => game.expedition ?? null;
export const inRun = () => !!game.expedition;

export function startRun(biome) {
  game.expedition = {
    biome,
    step: 0, // so viele Maps sind schon gespielt (bzw. die gerade laufende mitgezählt)
    counted: 0, // so viele davon zählen schon in der Statistik (siehe expArriveCamp)
    visited: [], // gespielte Maps
    boni: [], // Boni bis zum Ende des Runs
    wagon: [], // Tiere im Wagen: { species, variant, skin, origin }
    stay: [], // Tiere im Camp, die (noch) nicht im Wagen sind
    left: {}, // laufende Map: so viele Fang-Einheiten je Art sind noch frei
    map: null, // laufende Map
    home: {}, // ... ihre gewürfelte Tierliste (fest für diesen Besuch)
    season: 'normal', // ... und ihr gewürfeltes Wetter
    chestMap: null, // auf dieser Map steht eine Kiste (Kistenkarte)
    finalChest: false, // Abschlusskiste nach der letzten Map schon geöffnet?
    event: null, // auf dieser Map läuft das Event der Event-Karte (Große Wanderung)
  };
  return game.expedition;
}

export function endRun() {
  game.expedition = null;
}

export const isFinalCamp = () => (run()?.step ?? 0) >= RUN_LENGTH;
export const campLevel = () => (run() ? campOf(run().biome) : null);

// --- Karten vor der nächsten Map ---

// Karte: { map, plan: { home, season }, kind: 'animal' | 'rare' | 'bonus' | 'chest' | 'event', species?, skin?, id? }
// Jede Karte würfelt für ihre Map eigene Tiere und eigenes Wetter (planMap)
export function rollRunCards(n) {
  const r = run();
  const all = expeditionMaps(r.biome);
  // nur Maps, die in diesem Run noch nicht dran waren (gibt es weniger als Karten, zeigen mehrere Karten dieselbe Map);
  // sind alle schon gespielt, wieder alle – nur nie die gerade gespielte
  const last = r.visited.at(-1);
  let pool = all.filter((m) => !r.visited.includes(m));
  if (!pool.length) pool = all.filter((m) => m !== last);
  if (!pool.length) pool = all;
  const maps = shuffle(pool);
  const boni = RUN_BONI.filter((id) => !r.boni.includes(id) && !(id === 'ride' && NO_RIDE.includes(r.biome)));
  // nichts doppelt in einer Auswahl: höchstens eine Kiste, jedes Tier (auch als seltene Variante) und jeder Bonus nur
  // einmal; gibt es nicht genug verschiedene Karten, werden es weniger
  const cards = [];
  const has = (kind, key) => cards.some((c) => c.kind === kind && (c.species ?? c.id ?? null) === key);
  for (let i = 0; i < n; i++) {
    const map = maps[i % maps.length];
    const plan = planMap(map, r.biome);
    const { season } = plan;
    // (Standardtiere – plain in speciesRules.js – bekommen keine Tierkarte, nur seltene Karten: eine Map mit nur
    // Standardtieren lockt dann mit Bonus, Kiste oder seltener Variante)
    const home = Object.keys(plan.home).filter((sp) => !has('animal', sp) && !SPECIES_RULES[r.biome]?.[sp]?.plain);
    const rares = Object.keys(plan.home).filter((sp) => rareSkinFor(sp, r.biome, season) && !has('rare', sp));
    const freeBoni = boni.filter((id) => !has('bonus', id));
    const event = !!mapEvent(map) && !has('event', null);
    const kinds = Object.entries(KINDS).filter(([k]) => (k === 'rare' ? rares.length : k === 'bonus' ? freeBoni.length : k === 'animal' ? home.length : k === 'event' ? event : !has('chest', null)));
    if (!kinds.length) break;
    let x = Math.random() * kinds.reduce((sum, [, w]) => sum + w, 0);
    const kind = (kinds.find(([, w]) => (x -= w) <= 0) ?? kinds[0])[0];
    if (kind === 'animal') cards.push({ map, plan, kind, species: pick(home) });
    else if (kind === 'rare') {
      const species = pick(rares);
      cards.push({ map, plan, kind, species, skin: rareSkinFor(species, r.biome, season).id });
    } else if (kind === 'bonus') cards.push({ map, plan, kind, id: pick(freeBoni) });
    else if (kind === 'event' && MAP_EVENTS[mapEvent(map)].alone) {
      const ev = MAP_EVENTS[mapEvent(map)];
      cards.push({ map, plan: { home: { [ev.species]: ev.units }, season: ev.season ?? 'normal' }, kind }); // (nur die Tiere des Events)
    } else cards.push({ map, plan, kind }); // Kiste oder Event
  }
  return cards;
}

// Allererste Kartenwahl (Tutorial von Mr. Nuggets, src/npc/Nuggets.js): fest eine Tierkarte mit einer leicht zu fangenden
// Art (kein Event, keine Nacht), eine Bonus-Karte und eine Kiste, jede auf einer anderen Map. Die Tierkarte liegt vorn
// (er empfiehlt sie). null, wenn es in dieser Welt keine passende Map gibt (dann wie sonst gewürfelt)
const FIRST_ANIMALS = { savanna: ['giraffe'], jungle: ['tapir', 'jaguar'], asia: ['panda', 'peacock'], forest: ['hedgehog', 'boar'], ice: ['walrus', 'arcticfox'] };
const FIRST_BONUS = 'moreAnimals';
export function firstRunCards() {
  const r = run();
  const rules = SPECIES_RULES[r.biome] ?? {};
  const maps = shuffle(expeditionMaps(r.biome));
  const fitsMap = (sp, m) => !!rules[sp] && (!rules[sp].needs || (LEVELS[m]?.features ?? []).includes(rules[sp].needs));
  const species = (FIRST_ANIMALS[r.biome] ?? []).find((sp) => maps.some((m) => fitsMap(sp, m)));
  if (!species) return null;
  const first = maps.find((m) => fitsMap(species, m));
  const rest = maps.filter((m) => m !== first);
  const other = (i) => rest[i % Math.max(1, rest.length)] ?? first;
  return [
    { map: first, plan: planMap(first, r.biome, species), kind: 'animal', species },
    { map: other(0), plan: planMap(other(0), r.biome), kind: 'bonus', id: FIRST_BONUS },
    { map: other(1), plan: planMap(other(1), r.biome), kind: 'chest' },
  ];
}

// Karte gewählt: die nächste Map vorbereiten (Tierliste, Bonus, Kiste, seltenes Tier). Gibt die Map zurück.
export function takeRunCard(card) {
  const r = run();
  if (card.kind === 'bonus' && card.id !== 'heartRain' && !r.boni.includes(card.id)) r.boni.push(card.id);
  const plan = card.plan ?? planMap(card.map, r.biome);
  r.home = { ...plan.home };
  r.season = plan.season;
  const left = { ...plan.home };
  if (card.kind === 'animal' || card.kind === 'rare') left[card.species] = (left[card.species] ?? 0) + 1;
  if (r.boni.includes('moreAnimals')) addMore(left);
  if (hasCharm('bait')) addOne(left); // Glücksbringer Köder: ein Tier mehr (stapelt mit dem Bonus)
  r.left = left;
  r.map = card.map;
  r.step++;
  r.visited.push(card.map);
  r.chestMap = card.kind === 'chest' ? card.map : null;
  // Event-Karte: auf der Map zieht die Große Wanderung vorbei (ein Gnu ist zu fangen) bzw. es wird Glühwürmchen-Abend
  // (rote Pandas in den Kirschbäumen)
  r.event = card.kind === 'event' ? card.map : null;
  const ev = r.event && MAP_EVENTS[mapEvent(r.event)];
  if (ev && !ev.alone) left[ev.species] = (left[ev.species] ?? 0) + ev.units; // (alone: stehen schon in der Tierliste der Karte)
  // seltene Variante: das erste Tier dieser Art auf der Map wird sie (Versprechen wie aus der Kiste, siehe Animal.rollSkin)
  game.rarePromise = card.kind === 'rare' ? { level: card.map, species: card.species, skin: card.skin } : null;
  return card.map;
}

// --- Map ---

// Bonus "Mehr Tiere" mitten auf einer Map bekommen (Kiste): gleich ein Tier mehr
export function moreUnitsNow() {
  const l = run()?.left;
  if (l) addMore(l);
}

// von jeder Art der Map MORE_UNITS Tiere mehr (bei 2 bis 3 Arten also 2 bis 3 Tiere mehr – man soll es merken)
function addMore(left) {
  for (const s of Object.keys(left)) left[s] += MORE_UNITS;
}

// ein Tier mehr, von einer zufälligen Art der Map
function addOne(left) {
  const species = Object.keys(left);
  if (species.length) left[pick(species)] += 1;
}

export const unitsLeft = () => Object.values(run()?.left ?? {}).reduce((s, n) => s + n, 0);

// eine Fang-Einheit dieser Art gefangen
export function caughtUnit(species) {
  const l = run()?.left;
  if (l && l[species] > 0) l[species]--;
}

// eine Einheit kommt dazu (z. B. seltenes Tier aus einer Kiste auf der Map)
export function addUnit(species) {
  const l = run()?.left;
  if (l) l[species] = (l[species] ?? 0) + 1;
}

// --- Wagen ---

// Tiere im Camp ordnen: welche in den Wagen kommen (vorbelegt), welche dableiben, welche gleich ins Naturreservat gehen.
// place(a): 'star' (neue Art im Zoo oder seltene Variante), 'house' (bekommt einen freien Gehege-Platz) oder 'tree'
// (käme ins Naturreservat); room(a) sagt, wie viel Platz noch frei ist – siehe expSort in GardenScene.
// Gibt { wagon, stay, release } zurück; Reihenfolge: Sterne, dann Häuser, ältere zuerst.
export function sortWagon(animals, place) {
  const rated = animals.map((a, i) => ({ a, i, p: place(a) }));
  const release = rated.filter((r) => r.p === 'tree').map((r) => r.a);
  const keep = rated.filter((r) => r.p !== 'tree').sort((u, v) => (u.p === 'star' ? 0 : 1) - (v.p === 'star' ? 0 : 1) || u.i - v.i);
  const wagon = [];
  const stay = [];
  for (const { a } of keep) (fitsWagon(wagon, a) ? wagon : stay).push(a);
  return { wagon, stay, release };
}

// Tiere im Wagen nach Käfigen: [{ species, animals }] (in jedem Käfig nur eine Art, in der Reihenfolge, in der die Arten
// dazukamen; sind es mehr als cageSize, kommen sie auf mehrere Käfige, z. B. 6 Pinguine auf 2 Käfige)
export function wagonCages(wagon) {
  const bySpecies = new Map();
  for (const a of wagon) {
    if (!bySpecies.has(a.species)) bySpecies.set(a.species, []);
    bySpecies.get(a.species).push(a);
  }
  const cages = [];
  for (const [species, animals] of bySpecies) {
    const size = cageSize(species);
    for (let i = 0; i < animals.length; i += size) cages.push({ species, animals: animals.slice(i, i + size) });
  }
  return cages;
}

// passt dieses Tier noch in den Wagen? (in einen nicht vollen Käfig seiner Art, oder es ist noch ein Käfig frei)
export function fitsWagon(wagon, a) {
  const cages = wagonCages(wagon);
  if (cages.some((c) => c.species === a.species && c.animals.length < cageSize(a.species))) return true;
  return cages.length < wagonCageCount();
}

// --- Texte ---

export const runBonusTag = () => tr('bis Expeditionsende', 'until the expedition ends');
export const mapName = (id) => LEVELS[id]?.name ?? id;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
