// Events im Tierpark: am Hauptrechner im Haupthaus gegen Bewunderungsherzen eintauschen. Die Zeit läuft mit der echten
// Uhr, ein Event läuft also auch weiter, wenn man den Park verlässt.
import { game } from '../state.js';

const MINUTE = 60 * 1000;

export const EVENTS = [
  {
    id: 'babies',
    name: 'Tierbabys',
    text: '5 Minuten lang bekommen die Tiere Nachwuchs. Die Besucher lieben das!',
    cost: 50,
    duration: 5 * MINUTE,
    cooldown: 5 * MINUTE, // danach so lange Pause, bevor man es wieder starten kann
  },
  {
    id: 'ride',
    name: 'Reittier',
    text: '10 Minuten reitest du in den Welten: schneller unterwegs und überall Werkzeug wechseln.',
    cost: 50,
    duration: 10 * MINUTE,
    cooldown: 5 * MINUTE,
  },
  {
    id: 'flamingo',
    name: 'Flamingo-Flug',
    text: '5 Minuten lang fliegen Flamingos über Wiese, Wald und Savanne. Fang einen für den Tierpark!',
    cost: 100,
    duration: 5 * MINUTE,
    cooldown: 5 * MINUTE,
  },
  {
    id: 'farm',
    name: 'Bauernhof',
    text: '5 Minuten lang sind die Schafe auf der Wiese Kühe, Schweine und Ziegen. Gefangene bleiben es!',
    cost: 100,
    duration: 5 * MINUTE,
    cooldown: 5 * MINUTE,
  },
  {
    id: 'rare',
    name: 'Seltene Tiere',
    text: '5 Minuten lang ist draußen jedes zweite neue Tier eine seltene Variante: Glöckchen-Katze, Oryx, Wels, Hirsch ...',
    cost: 200,
    duration: 5 * MINUTE,
    cooldown: 5 * MINUTE,
  },
  {
    id: 'jellyfish',
    name: 'Quallen-Schwarm',
    text: '5 Minuten lang treiben Quallen durchs Riff. Fang sie mit dem Quallenglas aus dem Sack – aber nicht anfassen, sie brennen!',
    cost: 100,
    duration: 5 * MINUTE,
    cooldown: 5 * MINUTE,
  },
  {
    id: 'wolves',
    name: 'Wolfsnacht',
    text: '5 Minuten lang ist es im Wald Nacht. Folge mit der Laterne den leuchtenden Spuren zu den Wolfsrudeln. Wenn sie heulen, darfst du laufen – sonst bleib stehen!',
    cost: 100,
    duration: 5 * MINUTE,
    cooldown: 5 * MINUTE,
  },
  {
    id: 'icecream',
    name: 'Eisstand',
    text: '8 Minuten lang steht mitten im Park ein Eiswagen. Jedes Eis, das sich ein Besucher holt, bringt zwei Herzen.',
    cost: 30,
    duration: 8 * MINUTE,
    cooldown: 5 * MINUTE,
  },
];

// Event "Seltene Tiere": so oft ist ein neues wildes Tier eine seltene Variante (sonst etwa 10 %)
export const RARE_EVENT_CHANCE = 0.5;
export function rareChance(normal) {
  return isActive('rare') ? Math.max(normal, RARE_EVENT_CHANCE) : normal;
}

// Zustand eines Events: 'ready' (startbar), 'active' (läuft, left = Restzeit) oder 'cooldown' (left = bis wieder startbar)
export function eventState(id, now = Date.now()) {
  const s = game.events[id];
  if (s && now < s.endsAt) return { state: 'active', left: s.endsAt - now };
  if (s && now < s.readyAt) return { state: 'cooldown', left: s.readyAt - now };
  return { state: 'ready', left: 0 };
}

export function isActive(id, now = Date.now()) {
  return eventState(id, now).state === 'active';
}

// Herzen abziehen und das Event starten
export function startEvent(id, now = Date.now()) {
  const ev = EVENTS.find((e) => e.id === id);
  game.hearts -= ev.cost;
  game.events[id] = { startsAt: now, endsAt: now + ev.duration, readyAt: now + ev.duration + ev.cooldown };
}

// "4:12"
export function formatTime(ms) {
  const sec = Math.ceil(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

// Tierbabys: in jedem Gehege auf je 2 größere Tiere einer Familie ein Baby. Reh und Hirsch sind eine Familie,
// ihr Baby ist ein Rehkitz. Auch Flamingos (graue Küken), Katzen, Erdmännchen, Eichhörnchen, Frösche und Wölfe bekommen Babys,
// im Aquarium Seepferdchen, Schildkröten, Rochen, Kraken und Quallen; Maulwürfe, Reiher, Fische und Koi nicht.
const BABY_OF = { macaque: 'macaque', panda: 'panda', tiger: 'tiger', orangutan: 'orangutan', peacock: 'peacock', flamingo: 'flamingo', cat: 'cat', sheep: 'sheep', deer: 'deer', stag: 'deer', antelope: 'antelope', zebra: 'zebra', giraffe: 'giraffe', lion: 'lion', fox: 'fox', meerkat: 'meerkat', squirrel: 'squirrel', frog: 'frog', wolf: 'wolf',
  // im Aquarium (Fische und Koi bekommen keine Babys)
  seahorse: 'seahorse', turtle: 'turtle', ray: 'ray', octopus: 'octopus', jellyfish: 'jellyfish' };

// Familie für die Tierbabys (oder null, wenn diese Art keine bekommt)
export function babyFamily(species) {
  return BABY_OF[species] ?? null;
}

// animals: [{ species, enclosure, ... }] (nur Tiere in Gehegen, ohne Babys). Ergebnis: [{ enclosure, species, parent }]
export function babyPlan(animals) {
  const groups = new Map();
  for (const a of animals) {
    const family = BABY_OF[a.species];
    if (!family || !a.enclosure || a.baby) continue;
    const k = a.enclosure.id + ':' + family;
    if (!groups.has(k)) groups.set(k, { enclosure: a.enclosure, species: family, parents: [] });
    groups.get(k).parents.push(a);
  }
  const plan = [];
  for (const g of groups.values()) {
    for (let i = 0; i + 1 < g.parents.length; i += 2) plan.push({ enclosure: g.enclosure, species: g.species, parent: g.parents[i] });
  }
  return plan;
}
