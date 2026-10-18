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
];

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

// wie lange sich die Zeit von "from" bis "to" mit dem laufenden Event überschneidet (Millisekunden)
export function activeOverlap(id, from, to) {
  const s = game.events[id];
  if (!s) return 0;
  return Math.max(0, Math.min(to, s.endsAt) - Math.max(from, s.startsAt ?? 0));
}

// "4:12"
export function formatTime(ms) {
  const sec = Math.ceil(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

// Tierbabys: in jedem Gehege auf je 2 größere Tiere einer Familie ein Baby. Reh und Hirsch sind eine Familie,
// ihr Baby ist ein Rehkitz. Kleine Tiere, Vögel und Wassertiere bekommen keine Babys.
const BABY_OF = { sheep: 'sheep', deer: 'deer', stag: 'deer', antelope: 'antelope', zebra: 'zebra', giraffe: 'giraffe', lion: 'lion', fox: 'fox' };

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
