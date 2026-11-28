// Durchgänge der großen Erkundungs-Maps (Savanne, Dschungel, Bambuswald, Wald, Eiswelt): an den Rändern liegen je 3 bis 4 Durchgänge (passages in
// levels.js, als Ausgänge mit to: '@side'). Dahinter wartet eine kleine Map aus dem Expeditions-Baukasten
// (expeditionMaps.js) – ohne Karten, Camp und feste Tierliste: die Tiere kommen wie auf der großen Map (dasselbe Wetter),
// nur Arten, die zur kleinen Map passen (SPECIES_RULES), und etwas weniger. Der Ausgang führt zurück zum Durchgang.
// Jeder Durchgang behält seine Map bis zum nächsten Wetterwechsel der großen Map; so lange gibt es dort auch höchstens
// einmal eine Kiste (SIDE_CHEST_CHANCE) – rein und raus würfelt nichts neu.
// Ein Durchgang mit canoe liegt auf dem Fluss: man fährt mit dem Kanu hinein (immer auf eine Fluss-Map) und kommt im
// Kanu zurück. Ein Durchgang mit maps führt nur auf diese Maps (Bambuswald: oben auf der Hochebene nur verschneite Maps;
// Wald: aus dem Moor nur Moor-Maps, aus dem Eichenhain nur Maps mit Eichen oder Laub).
// Welten ohne Wetterwechsel (Bambuswald, Wald): immer Normal, die Map hinter einem Durchgang wechselt nach SIDE_KEEP. Dort
// gilt auch das Wetter der Arten (seasons in SPECIES_RULES) nicht: es kommt, was auf der großen Map kommt (Reiher im Wald).
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { LEVELS } from './levels.js';
import { expeditionMaps } from './expeditionMaps.js';
import { currentSeason } from './season.js';
import { SPECIES_RULES } from './speciesRules.js';

export const SIDE_CHEST_CHANCE = 0.2;
const SIDE_KEEP = 20 * 60 * 1000; // Welten ohne Wetterwechsel: so lange bleibt die Map hinter einem Durchgang
const SIDE_POPULATION = 0.6; // so viele Tiere wie auf der großen Map (anteilig), die kleine Map ist kleiner
// Sondertiere, die nicht im Spawn-Pool stehen, sondern über eine Angabe der Map kommen: nur bei ihrem Wetter
const SPECIAL_CONFIGS = { gorillas: 'gorilla', herons: 'heron', vultures: 'vulture', hyenas: 'hyena', waterfallSun: 'iguana' };

// Durchgang (Ausgang mit to: '@side') betreten: welche Map dahinter liegt (fest bis zum Wetterwechsel); merkt sich, wo
// man ist (game.side) und gibt die Map zurück
export function enterPassage(parent, exit) {
  const biome = LEVELS[parent].biome ?? parent;
  const cycle = !!LEVELS[parent].seasons;
  const season = cycle ? currentSeason(parent) : 'normal'; // (ohne Wetterwechsel: currentSeason kennt das Gebiet nicht)
  const key = `${parent}:${exit.passage}`;
  game.sides ??= {};
  let rec = game.sides[key];
  if (!rec || rec.season !== season || !LEVELS[rec.map] || (rec.until && Date.now() > rec.until)) {
    const all = expeditionMaps(biome);
    const pool = exit.canoe ? all.filter((m) => LEVELS[m].features?.includes('river')) : exit.maps ? all.filter((m) => exit.maps.includes(m)) : all;
    // nicht dieselbe Map wie hinter einem anderen Durchgang dieser Welt (sofern es genug gibt)
    const used = Object.entries(game.sides).filter(([k, r]) => k !== key && k.startsWith(parent + ':') && r.season === season).map(([, r]) => r.map);
    const fresh = pool.filter((m) => !used.includes(m));
    const list = fresh.length ? fresh : pool;
    rec = game.sides[key] = { map: list[Math.floor(Math.random() * list.length)], season, chest: Math.random() < SIDE_CHEST_CHANCE, until: cycle ? null : Date.now() + SIDE_KEEP };
  }
  game.side = { parent, passage: exit.passage, key, map: rec.map, season, canoe: !!exit.canoe, back: exit.back };
  return rec.map;
}

// Ist man gerade auf der kleinen Map hinter einem Durchgang? Dann der Eintrag (sonst null)
export const sideHere = (id) => (game.side?.map === id ? game.side : null);
// ... und der Eintrag des Durchgangs (Kiste noch da?)
export const sideRecord = (id) => (sideHere(id) ? game.sides?.[game.side.key] ?? null : null);

// Angaben, die auf der kleinen Map die der Expedition ersetzen: Spawn wie auf der großen Map (beim Wetter des Besuchs),
// gefiltert nach den Merkmalen der kleinen Map; Sondertiere nur bei ihrem Wetter; Ausgänge führen zurück
export function sideOverrides(base, side) {
  const parent = LEVELS[side.parent];
  const big = { ...parent, ...(parent.seasons?.[side.season] ?? {}) };
  const rules = SPECIES_RULES[base.expedition] ?? {};
  const feats = base.features ?? [];
  const fits = (sp) => !rules[sp]?.needs || feats.includes(rules[sp].needs);
  const inSeason = (sp) => !parent.seasons || !rules[sp]?.seasons || rules[sp].seasons.includes(side.season);
  const pool = (p) => {
    if (!p) return null;
    const weights = Object.fromEntries(Object.entries(p.weights ?? {}).filter(([sp]) => fits(sp)));
    return { population: Object.keys(weights).length ? Math.max(2, Math.round(p.population * SIDE_POPULATION)) : 0, weights };
  };
  const out = {
    spawn: pool(big.spawn) ?? { population: 0, weights: {} },
    weatherSpawn: pool(big.weatherSpawn),
    home: undefined,
    side: true,
    exits: side.canoe ? riverExits(base) : (base.exits ?? []).map((e) => ({ ...e, to: '@back', label: backLabel(base.expedition) })),
  };
  // zu Fuß hereingekommen: auch gleich hinter einem wieder zurück (Ausgang am linken Rand neben dem Start, ein Stück Weg
  // dorthin), nicht nur am Ausgang auf der anderen Seite. Nicht im Dschungel: dort liegt links vom Steg der Fluss
  if (!side.canoe && !base.inlet && base.start.tx <= 3) {
    const { ty } = base.start;
    out.rows = base.rows.map((r, y) => (y === ty ? '#'.repeat(base.start.tx) + r.slice(base.start.tx) : r));
    out.exits = [...out.exits, { tx: 0, ty, to: '@back', label: backLabel(base.expedition) }];
  }
  for (const [key, sp] of Object.entries(SPECIAL_CONFIGS)) if (base[key] && !(fits(sp) && inSeason(sp))) out[key] = undefined;
  return out;
}

// mit dem Kanu hereingekommen: auch wieder mit dem Kanu hinaus – der Fluss am rechten Rand (flussabwärts, wie auf der
// großen Map) statt des Ausgangs zu Fuß
function riverExits(base) {
  const W = base.rows[0].length;
  // (nur, wo auch die Kachel davor Wasser ist: dort kommt man mit dem Kanu wirklich hin – der Fluss biegt am Rand manchmal ab)
  const water = (row, x) => row[x] === '~';
  const exits = base.rows.flatMap((row, ty) => (water(row, W - 1) && water(row, W - 2) ? [{ tx: W - 1, ty, to: '@back', canoe: true, label: tr('Mit dem Kanu zurück', 'Back by canoe') }] : []));
  return exits.length ? exits : (base.exits ?? []).map((e) => ({ ...e, to: '@back', label: backLabel(base.expedition) }));
}

const BACK = {
  jungle: () => tr('Zurück in den Dschungel', 'Back to the jungle'),
  asia: () => tr('Zurück in den Bambuswald', 'Back to the bamboo forest'),
  forest: () => tr('Zurück in den Wald', 'Back to the forest'),
  savanna: () => tr('Zurück in die Savanne', 'Back to the savanna'),
  ice: () => tr('Zurück zur Station', 'Back to the station'),
};
const backLabel = (biome) => (BACK[biome] ?? BACK.savanna)();
