// Expeditionen (Roguelike-Modus: Savanne, Dschungel, Bambuswald): ein Durchlauf (Run) ist eine Kette aus höchstens RUN_LENGTH
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
export const WAGON_CAGES = 4; // Käfige im Wagen: je einer pro Tierart
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
// Tiere, die nicht beim Betreten dastehen, sondern auf ihre Weise kommen (Geier fliegen heran, Hyänen kommen zu Knochen)
export const CALLED_UNITS = ['vulture', 'hyena', 'heron', 'gnu', 'redpanda', 'yak', 'beaver', 'wolf']; // (Gnus: aus der Großen Wanderung; rote Pandas: Glühwürmchen-Abend; Yaks: die Herde am Steinhaufen; Biber: die Kolonie am Damm; Wölfe: Rudel der Wolfsnacht)
// Anteil der Kartenarten
const KINDS = { animal: 0.45, rare: 0.15, bonus: 0.25, chest: 0.15, event: 0.12 }; // event: nur zu Maps mit Event (Gnu-Furt, Glühwürmchen-Abend, Wolfsnacht)
// Event-Karten: Kennzeichen der Map → Event und die Tiere, die es bringt (Gnu aus der Großen Wanderung, rote Pandas in
// den Kirschbäumen am Glühwürmchen-Abend, Wolfsrudel in der Wolfsnacht). alone: in dieser Nacht gibt es nur diese Tiere
// (wie bei der Wolfsnacht im Wald), das Wetter bleibt normal
export const MAP_EVENTS = { migration: { species: 'gnu', units: 1 }, fireflies: { species: 'redpanda', units: 2 }, wolfNight: { species: 'wolf', units: 2, alone: true } };
export const mapEvent = (map) => Object.keys(MAP_EVENTS).find((k) => LEVELS[map]?.[k]) ?? null;

// --- Tiere und Wetter einer Map (werden vor jeder Map neu gewürfelt) ---

export { SPECIES_RULES, BIOME_SEASONS } from './speciesRules.js';
import { SPECIES_RULES, BIOME_SEASONS } from './speciesRules.js';
const SPECIES_PER_MAP = [2, 3];
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
  const fits = (sp) => !rules[sp].needs || feats.includes(rules[sp].needs);
  const allowed = (sp) => rules[sp].seasons ?? all;
  let seasons = [...all];
  const home = {};
  const add = (sp) => {
    seasons = seasons.filter((x) => allowed(sp).includes(x));
    const [a, b] = rules[sp].units;
    home[sp] = a + Math.floor(Math.random() * (b - a + 1));
  };
  const specials = Object.keys(rules).filter((sp) => rules[sp].needs && !COMMON_FEATURES.includes(rules[sp].needs) && fits(sp));
  if (must && rules[must] && fits(must)) add(must);
  else if (specials.length && Math.random() < SPECIAL_CHANCE) add(pick(specials));
  else {
    // nur ein Wetter, bei dem überhaupt eine Art dieser Map vorkommt (sonst bliebe z. B. die Stupa-Weide bei Nebel leer)
    const possible = all.filter((x) => Object.keys(rules).some((sp) => fits(sp) && allowed(sp).includes(x)));
    seasons = [pick(possible.length ? possible : all)];
  }
  const n = SPECIES_PER_MAP[0] + Math.floor(Math.random() * (SPECIES_PER_MAP[1] - SPECIES_PER_MAP[0] + 1));
  while (Object.keys(home).length < n) {
    const pool = Object.keys(rules).filter((sp) => !home[sp] && fits(sp) && allowed(sp).some((x) => seasons.includes(x)));
    if (!pool.length) break;
    add(pick(pool));
  }
  return { home, season: pick(seasons.length ? seasons : all) };
}

export const run = () => game.expedition ?? null;
export const inRun = () => !!game.expedition;

export function startRun(biome) {
  game.expedition = {
    biome,
    step: 0, // so viele Maps sind schon gespielt (bzw. die gerade laufende mitgezählt)
    visited: [], // gespielte Maps
    boni: [], // Boni bis zum Ende des Runs
    wagon: [], // Tiere im Wagen: { species, variant, farm, skin, origin }
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
  const boni = RUN_BONI.filter((id) => !r.boni.includes(id));
  // nichts doppelt in einer Auswahl: höchstens eine Kiste, jedes Tier (auch als seltene Variante) und jeder Bonus nur
  // einmal; gibt es nicht genug verschiedene Karten, werden es weniger
  const cards = [];
  const has = (kind, key) => cards.some((c) => c.kind === kind && (c.species ?? c.id ?? null) === key);
  for (let i = 0; i < n; i++) {
    const map = maps[i % maps.length];
    const plan = planMap(map, r.biome);
    const { season } = plan;
    const home = Object.keys(plan.home).filter((sp) => !has('animal', sp));
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
      cards.push({ map, plan: { home: { [ev.species]: ev.units }, season: 'normal' }, kind }); // (nur die Tiere des Events)
    } else cards.push({ map, plan, kind }); // Kiste oder Event
  }
  return cards;
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

// Tiere im Wagen nach Käfigen: [{ species, animals }] (je Art ein Käfig, in der Reihenfolge, in der die Arten dazukamen)
export function wagonCages(wagon) {
  const cages = new Map();
  for (const a of wagon) {
    if (!cages.has(a.species)) cages.set(a.species, []);
    cages.get(a.species).push(a);
  }
  return [...cages].map(([species, animals]) => ({ species, animals }));
}

// passt dieses Tier noch in den Wagen? (in den Käfig seiner Art, oder es ist noch ein Käfig frei)
export function fitsWagon(wagon, a) {
  const cages = wagonCages(wagon);
  const own = cages.find((c) => c.species === a.species);
  return own ? own.animals.length < cageSize(a.species) : cages.length < wagonCageCount();
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
