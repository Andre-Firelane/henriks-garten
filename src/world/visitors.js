// Besucher im Tierpark: wie sehr die Tiere Besucher anlocken, das Wegnetz, auf dem sie laufen, und die Plätze
// vor den Gehegen, an denen sie stehen bleiben und schauen.
import { ENCLOSURES, EXITS, GATE_TILES, LEVEL, MAP_H, MAP_W, buildings, groundAt, isBlockedPoint } from './map.js';
import { tileToWorld } from './iso.js';

// Anziehung je Tierart: seltene Tiere (kleines Gewicht in spawn.weights der Welten) und schwer zu fangende
// (nur mit Lasso, Falle oder Futter) locken mehr Besucher an als häufige, die man einfach berührt
export const APPEAL = {
  sheep: 1,
  cat: 1.2,
  frog: 1.2,
  fish: 1.2,
  mole: 1.5,
  squirrel: 1.5,
  deer: 2,
  koi: 2,
  heron: 2.5,
  fox: 3,
  antelope: 3,
  zebra: 3,
  meerkat: 3.5,
  stag: 4,
  giraffe: 4,
  lion: 5,
  crocodile: 5,
};

const MAX_VISITORS = 12;
// Tierbaby-Event: Babys sind besonders süß. Es kommen nicht mehr Besucher als sonst, aber sie gehen lieber zu den
// Gehegen mit Babys (BABY_APPEAL zählt bei der Wahl mit), und wer dort stehen bleibt, gibt 6 Herzen statt 1.
// Mit einigen Tierpaaren bringt das Event so deutlich mehr ein, als es kostet (50 Herzen).
export const BABY_APPEAL = 3;
export const BABY_HEARTS = 6;

const appeal = (a) => (a.baby ? BABY_APPEAL : APPEAL[a.species] ?? 1);

// Summe der Anziehung aller Tiere in den Gehegen (bzw. in einem Gehege), Babys mitgezählt
export function parkScore(animals) {
  return animals.reduce((s, a) => s + (a.state === 'penned' ? appeal(a) : 0), 0);
}
export function penScore(animals, e) {
  return animals.reduce((s, a) => s + (a.state === 'penned' && a.enclosure === e ? appeal(a) : 0), 0);
}

// Wie viele Besucher gleichzeitig da sein dürfen: 2 Schafe locken einen an, ein voller Park ein Dutzend
export function maxVisitors(score) {
  if (score <= 0) return 0;
  return Math.max(1, Math.min(MAX_VISITORS, Math.round(score / 4)));
}

// Sekunden bis zum nächsten neuen Besucher: bei 2 Schafen etwa eine Minute, im vollen Park wenige Sekunden
export function arrivalInterval(score) {
  return Math.max(6, 90 / (1 + score / 6));
}

// Herzen, während der Spieler nicht im Tierpark ist: so viele Besucher, wie die Tiere anlocken, geben zusammen
// etwa ein halbes Herz pro Besucher und Minute. Gezählt wird höchstens eine Stunde, damit die Zahl nicht zu groß wird.
const AWAY_HEARTS_PER_VISITOR_MINUTE = 0.5;
const AWAY_MAX_MINUTES = 60;
// eventMs: so lange lief in der Zeit das Tierbaby-Event, babies: so viele Babys hätte es gegeben
export function awayHearts(score, ms, eventMs = 0, babies = 0) {
  const minutes = Math.min(AWAY_MAX_MINUTES, Math.max(0, ms) / 60000);
  const eventMinutes = babies ? Math.min(minutes, Math.max(0, eventMs) / 60000) : 0;
  const normal = (minutes - eventMinutes) * maxVisitors(score) * AWAY_HEARTS_PER_VISITOR_MINUTE;
  const event = eventMinutes * maxVisitors(score + babies * BABY_APPEAL) * AWAY_HEARTS_PER_VISITOR_MINUTE * BABY_HEARTS;
  return Math.floor(normal + event);
}

const key = (tx, ty) => tx + ',' + ty;

// Wegnetz: alle begehbaren Wegkacheln, ohne Gehegetore und Gebäudetüren (dort gehen nur Tiere bzw. der Spieler durch)
export function buildPathGrid() {
  const doors = new Set(GATE_TILES.map((g) => key(g.tx, g.ty)));
  const inBuilding = (tx, ty) => buildings().some((h) => tx >= h.tx0 && tx <= h.tx1 && ty >= h.ty0 && ty <= h.ty1);
  const walk = new Set();
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      if (groundAt(tx, ty) !== LEVEL.path || doors.has(key(tx, ty)) || inBuilding(tx, ty)) continue;
      const p = tileToWorld(tx, ty);
      if (isBlockedPoint(p.x, p.y)) continue; // Wegweiser, Auto, Futterautomat ...
      walk.add(key(tx, ty));
    }
  }
  const exits = EXITS.map(({ tx, ty }) => ({ tx, ty })).filter((t) => walk.has(key(t.tx, t.ty)));
  // Aussichtsplätze: Wegkacheln höchstens 2 Kacheln von der Innenfläche des Geheges (also direkt am Zaun),
  // sonst höchstens 3; je Kachel steht nur ein Besucher
  const spots = new Map();
  for (const e of ENCLOSURES) {
    for (const r of [2, 3]) {
      const list = [];
      for (const k of walk) {
        const [tx, ty] = k.split(',').map(Number);
        let near = null;
        for (let dy = -r; dy <= r && !near; dy++) for (let dx = -r; dx <= r && !near; dx++) if (e.tileSet.has(key(tx + dx, ty + dy))) near = { tx: tx + dx, ty: ty + dy };
        if (near) list.push({ tx, ty, look: near, taken: null });
      }
      if (list.length) {
        // zum Hinschauen: die nächste Gehegekachel
        for (const s of list) {
          let best = null;
          for (const t of e.tiles) {
            const d = Math.hypot(t.tx - s.tx, t.ty - s.ty);
            if (!best || d < best.d) best = { d, t };
          }
          s.look = best.t;
        }
        spots.set(e, list);
        break;
      }
    }
  }
  return { walk, exits, spots };
}

// kürzester Weg über das Wegnetz (Breitensuche); goal(tx, ty) sagt, ob eine Kachel ein Ziel ist.
// Ergebnis: Kacheln vom Start (ausschließlich) bis zum Ziel, oder null
export function findRoute(grid, from, goal) {
  const start = key(from.tx, from.ty);
  const prev = new Map([[start, null]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const t = queue[i];
    if (goal(t.tx, t.ty) && i > 0) {
      const route = [];
      for (let k = key(t.tx, t.ty); k !== start; k = prev.get(k)) {
        const [tx, ty] = k.split(',').map(Number);
        route.unshift({ tx, ty });
      }
      return route;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { tx: t.tx + dx, ty: t.ty + dy };
      const k = key(n.tx, n.ty);
      if (prev.has(k) || !grid.walk.has(k)) continue;
      prev.set(k, key(t.tx, t.ty));
      queue.push(n);
    }
  }
  // schon am Ziel
  return goal(from.tx, from.ty) ? [] : null;
}
