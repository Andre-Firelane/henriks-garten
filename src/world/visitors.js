// Besucher im Tierpark: wie sehr die Tiere Besucher anlocken, das Wegnetz, auf dem sie laufen, und die Plätze
// vor den Gehegen, an denen sie stehen bleiben und schauen.
import { ENCLOSURES, EXITS, GATE_TILES, LEVEL, MAP_H, MAP_W, buildings, groundAt, isBlockedPoint, penQuotas, quotaKey } from './map.js';
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
  meerkat: 4.5,
  giraffe: 4,
  flamingo: 4,
  panda: 5,
  tiger: 5,
  orangutan: 5,
  peacock: 3,
  butterfly: 1.5,
  macaque: 4,
  howler: 5, // laut und lustig
  gibbon: 5,
  snake: 3,
  macaw: 6, // bunt und laut
  tarantula: 3,
  lion: 6,
  crocodile: 6,
  reeffish: 0.5, // leicht zu fangen, und im Aquarium schwimmen bis zu 30 davon (sonst bringen sie mehr Besucher als seltene Tiere)
  seahorse: 3,
  octopus: 4.5,
  turtle: 6,
  jellyfish: 3,
  ray: 5,
  wolf: 5,
  gnu: 3.5,
  hippo: 5,
  redpanda: 5,
  hyena: 4,
  warthog: 3,
  vulture: 3.5,
};

const MAX_VISITORS = 16; // im Tierpark (bei so vielen Gehegen brächten neue Tiere sonst kaum noch etwas)
// Häuser mit eigener Halle haben weniger Platz für Besucher: das Reptilienhaus mit zwei kleinen Terrarien nur wenige
export const HOUSE_VISITORS = { aquarium: 8, reptiles: 4 };
// Tierbaby-Event: Babys sind besonders süß. Es kommen nicht mehr Besucher als sonst, aber sie gehen lieber zu den
// Gehegen mit Babys (BABY_APPEAL zählt bei der Wahl mit), und wer dort stehen bleibt, gibt zusätzlich im Schnitt
// 2,5 Herzen (abwechselnd 2 oder 3). Mit einigen Tierpaaren bringt das Event so mehr ein, als es kostet (50 Herzen).
export const BABY_APPEAL = 3;
export const BABY_BONUS = 2.5;

// seltene Skins locken mehr Besucher an als die normale Art (Katze 2: mehr als doppelt so viel wie eine Katze, Oryx 1,5-mal)
export const SKIN_APPEAL = { stag: 4, wolf2: 7, lion2: 8, zebra2: 4.5, cat2: 3, antelope2: 4.5, koi3: 3, fish2: 3, frog2: 3, tiger2: 7, orangutan2: 7, peacock2: 6, jellyfish2: 7, ray2: 8, lungfish: 2, shoebill: 6, croc_albino: 8 }; // koi3: weißer Koi mit rotem Punkt

// (geht auch mit gespeicherten Tieren eines anderen Levels: braucht nur species, skin, variant, baby)
export const appeal = (a) => (a.baby ? BABY_APPEAL : SKIN_APPEAL[a.skin ?? a.variant] ?? APPEAL[a.species] ?? 1);

// Für die Statistik: welche Tierart ein Herz an diesem Gehege gebracht hat – zufällig, je nach Anziehung
// (seltene Tiere und Babys öfter)
export function heartSpecies(animals, e) {
  const list = animals.filter((a) => a.state === 'penned' && a.enclosure === e);
  let r = Math.random() * list.reduce((s, a) => s + appeal(a), 0);
  for (const a of list) if ((r -= appeal(a)) <= 0) return a.species;
  return list[0]?.species ?? null;
}

// Herzen nach Anziehung auf die Tierarten im Park verteilen (für die Herzen der Abwesenheit): { Art: Anzahl }
export function splitHearts(animals, n) {
  const by = {};
  for (const a of animals) if (a.state === 'penned') by[a.species] = (by[a.species] ?? 0) + appeal(a);
  const total = Object.values(by).reduce((s, x) => s + x, 0);
  const out = {};
  let given = 0;
  const sorted = Object.entries(by).sort((u, v) => v[1] - u[1]);
  for (const [s, w] of sorted) {
    out[s] = Math.floor((n * w) / total);
    given += out[s];
  }
  if (sorted.length) out[sorted[0][0]] += n - given; // Rest an die beliebteste Art
  return out;
}

// volle Gehege (alle Plätze belegt, Stern am Schild) sind besonders anziehend
export const FULL_BONUS = 1.5;
// key: nur die Tiere dieses Kontingents (Tierart, siehe quotaKey), null: alle im Gehege
export function penCount(animals, e, key = null) {
  return animals.filter((a) => a.state === 'penned' && a.enclosure === e && !a.baby && (key === null || quotaKey(a.species) === key)).length;
}
// voll: alle Kontingente des Geheges belegt
export function isFull(animals, e) {
  const q = penQuotas(e);
  return q.length > 0 && q.every(({ key, cap }) => penCount(animals, e, key) >= cap);
}

// Summe der Anziehung aller Tiere in den Gehegen (bzw. in einem Gehege), Babys mitgezählt
export function parkScore(animals) {
  return ENCLOSURES.reduce((s, e) => s + penScore(animals, e), 0);
}
export function penScore(animals, e) {
  const sum = animals.reduce((s, a) => s + (a.state === 'penned' && a.enclosure === e ? appeal(a) : 0), 0);
  return isFull(animals, e) ? sum * FULL_BONUS : sum;
}

// Naturreservat: ein überzähliges Tier bringt beim Auswildern 2, 3 oder 4 Herzen, je nach Seltenheit
export function releaseHearts(species, skin = null) {
  const v = SKIN_APPEAL[skin] ?? APPEAL[species] ?? 1;
  return v <= 1.5 ? 2 : v <= 3 ? 3 : 4;
}

// Wie viele Besucher gleichzeitig da sein dürfen: 2 Schafe locken einen an, ein voller Park ein Dutzend
export function maxVisitors(score, cap = MAX_VISITORS) {
  if (score <= 0) return 0;
  return Math.max(1, Math.min(cap, Math.round(score / 4)));
}

// Sekunden bis zum nächsten neuen Besucher: bei 2 Schafen etwa eine Minute, im vollen Park wenige Sekunden
export function arrivalInterval(score) {
  return Math.max(6, 90 / (1 + score / 6));
}

// Herzen, während der Spieler woanders ist (Tierpark und Aquarium, laufend): so viele Besucher, wie die Tiere anlocken,
// geben zusammen etwa ein halbes Herz pro Besucher und Minute (siehe parkIncome und aquariumIncome in GardenScene)
export const AWAY_HEARTS_PER_VISITOR_MINUTE = 0.5;

// Eisstand-Event: so viele Eis holen sich die Besucher pro Minute, während man nicht im Tierpark ist
export const AWAY_ICE_PER_VISITOR_MINUTE = 0.5; // 0,25 Eis pro Besucher und Minute, je 2 Herzen

const key = (tx, ty) => tx + ',' + ty;

// Wegnetz: alle begehbaren Wegkacheln, ohne Gehegetore und Gebäudetüren (dort gehen nur Tiere bzw. der Spieler durch).
// Gebäude nur, wenn Besucher hinein dürfen (visitors: true, z. B. die Aquarium-Halle)
export function buildPathGrid() {
  const doors = new Set(GATE_TILES.map((g) => key(g.tx, g.ty)));
  const inBuilding = (tx, ty) => buildings().some((h) => !h.visitors && tx >= h.tx0 && tx <= h.tx1 && ty >= h.ty0 && ty <= h.ty1);
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
  // Aussichtsplätze: Wegkacheln höchstens 2 Kacheln von der Innenfläche des Geheges (also direkt am Zaun); gibt es dort
  // weniger als MIN_SPOTS (z. B. bei runden Gehegen etwas abseits vom Weg), auch weiter weg bis 5 Kacheln.
  // Je Kachel steht nur ein Besucher
  const MIN_SPOTS = 6;
  const spots = new Map();
  for (const e of ENCLOSURES) {
    let fewest = null;
    for (const r of [2, 3, 4, 5]) {
      const list = [];
      for (const k of walk) {
        const [tx, ty] = k.split(',').map(Number);
        let near = null;
        for (let dy = -r; dy <= r && !near; dy++) for (let dx = -r; dx <= r && !near; dx++) if (e.tileSet.has(key(tx + dx, ty + dy))) near = { tx: tx + dx, ty: ty + dy };
        if (near) list.push({ tx, ty, look: near, taken: null });
      }
      if (list.length < MIN_SPOTS && r < 5) {
        if (list.length && (!fewest || list.length > fewest.length)) fewest = list;
        continue;
      }
      if (!list.length && fewest) list.push(...fewest);
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
  // Eisstand: Plätze auf dem Weg direkt am Wagen (dort warten die Besucher auf ihr Eis)
  let ice = [];
  const stand = LEVEL.iceStand;
  if (stand) {
    for (const k of walk) {
      const [tx, ty] = k.split(',').map(Number);
      const d = Math.max(Math.abs(tx - stand.tx), Math.abs(ty - stand.ty));
      if (d >= 1 && d <= 2) ice.push({ tx, ty, d: Math.hypot(tx - stand.tx, ty - stand.ty), taken: null });
    }
    ice = ice.sort((a, b) => a.d - b.d).slice(0, 5);
  }
  return { walk, exits, spots, ice };
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
