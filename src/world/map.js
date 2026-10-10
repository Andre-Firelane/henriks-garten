// Die Karte des aktuellen Levels. Die Level selbst stehen in levels.js; setLevel() wechselt.
// Alle exportierten Werte zeigen immer auf das aktuelle Level.
import { LEVELS } from './levels.js';
import { tileToWorld, worldToTile } from './iso.js';

const GROUND = { '=': 'soil', '~': 'water', o: 'fishpond' };
const PATH_CHARS = '#GX'; // Weg, Tor und Übergang liegen auf dem Weg-Boden

// Objekte: Textur, Ankerpunkt (Kachelmitte im Bild) und ob man dagegen läuft.
// hitbox: nur ein Kreis mit diesem Radius um die Kachelmitte ist fest (z. B. der Baumstamm); ohne hitbox die ganze Kachel.
export const OBJECTS = {
  T: { key: 'tree', originY: 82 / 96, solid: true, hitbox: 12 },
  b: { key: 'bush', originY: 33 / 40, solid: true, hitbox: 13 },
  r: { key: 'rock', originY: 18 / 24, solid: true, hitbox: 12 },
  f: { key: 'flowers_red', originY: 22 / 32, solid: false },
  g: { key: 'flowers_yellow', originY: 22 / 32, solid: false },
  P: { key: 'pine', originY: 100 / 112, solid: true, hitbox: 12 },
  D: { key: 'dark_tree', originY: 90 / 104, solid: true, hitbox: 12 },
  k: { key: 'dark_bush', originY: 36 / 44, solid: true, hitbox: 14 },
  L: { key: 'log', originY: 44 / 64, solid: true },
  n: { key: 'fern', originY: 24 / 32, solid: false },
  m: { key: 'mushroom', originY: 18 / 24, solid: false },
  '-': { key: 'fence_x', originY: 44 / 64, solid: true },
  '|': { key: 'fence_y', originY: 44 / 64, solid: true },
  S: { key: 'sign_fish', originY: 54 / 56, solid: true },
  W: { key: 'signpost', originY: 60 / 64, solid: true },
};

export let LEVEL_ID;
export let LEVEL;
export let MAP_W;
export let MAP_H;
export let START;
export let PEN; // Innenfläche des Geheges
export let SHED;
export let TOOL_SPOTS;
export let EXITS;
export let GATE_TILES;
export let FISHPOND_TILES;
export let FISH_SPOTS; // Stellen, an denen wilde Fische auftauchen
export let NEAR_WATER; // freie Kacheln höchstens 2 Kacheln von einem wilden Teich entfernt (für Frösche)
export let MOLE_SPOTS; // Wiesenstellen, an denen Maulwürfe auftauchen (freies Gras, kein Gehege)
export let SQUIRREL_TREES; // Bäume, auf denen Eichhörnchen wohnen können: { tx, ty, ground: { tx, ty } }
let ROWS;

const tilesWith = (ch) => ROWS.flatMap((row, ty) => [...row].flatMap((c, tx) => (c === ch ? [{ tx, ty }] : [])));

export function setLevel(id) {
  LEVEL_ID = id;
  LEVEL = LEVELS[id];
  ROWS = LEVEL.rows;
  MAP_W = Math.max(...ROWS.map((r) => r.length));
  MAP_H = ROWS.length;
  START = LEVEL.start;
  PEN = LEVEL.pen;
  SHED = LEVEL.shed;
  TOOL_SPOTS = LEVEL.toolSpots;
  EXITS = LEVEL.exits;
  GATE_TILES = tilesWith('G');
  FISHPOND_TILES = tilesWith('o');
  // Wasser in den wilden Teichen direkt am begehbaren Ufer, damit man sie mit dem Kescher erreicht
  FISH_SPOTS = tilesWith('~').filter(({ tx, ty }) =>
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !isBlocked(tx + dx, ty + dy)),
  );
  NEAR_WATER = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (isBlocked(tx, ty) || inPen(tx, ty) || exitAt(tx, ty)) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) near = charAt(tx + dx, ty + dy) === '~';
      if (near) NEAR_WATER.push({ tx, ty });
    }
  }
  MOLE_SPOTS = tilesWith('.').filter(
    ({ tx, ty }) => tx > 1 && ty > 1 && tx < MAP_W - 2 && ty < MAP_H - 2 && !inPen(tx, ty) && !isBlocked(tx, ty),
  );
  // Bäume im Inneren mit einem freien Platz davor (bevorzugt vorne, damit man das Eichhörnchen sieht)
  SQUIRREL_TREES = [...tilesWith('P'), ...tilesWith('D'), ...tilesWith('T')].flatMap(({ tx, ty }) => {
    if (tx < 2 || ty < 2 || tx > MAP_W - 3 || ty > MAP_H - 3) return [];
    const free = [[1, 0], [0, 1], [-1, 0], [0, -1]]
      .map(([dx, dy]) => ({ tx: tx + dx, ty: ty + dy }))
      .find((t) => !isBlocked(t.tx, t.ty) && !inPen(t.tx, t.ty) && !exitAt(t.tx, t.ty));
    return free ? [{ tx, ty, ground: free }] : [];
  });
}

function charAt(tx, ty) {
  return ROWS[ty]?.[tx] ?? '.';
}

export function inPen(tx, ty) {
  return !!PEN && tx >= PEN.tx0 && tx <= PEN.tx1 && ty >= PEN.ty0 && ty <= PEN.ty1;
}

export function isGate(tx, ty) {
  return charAt(tx, ty) === 'G';
}

export function isFishpond(tx, ty) {
  return charAt(tx, ty) === 'o';
}

export function exitAt(tx, ty) {
  return EXITS.find((e) => e.tx === tx && e.ty === ty) ?? null;
}

export function groundAt(tx, ty) {
  const c = charAt(tx, ty);
  if (PATH_CHARS.includes(c)) return LEVEL.path;
  const g = GROUND[c];
  if (g === 'fishpond') return (tx + ty) % 2 ? 'fishpond0' : 'fishpond1';
  if (g) return g;
  return grassAt(tx, ty);
}

// Gras in drei Varianten, fest pro Kachel verteilt
export function grassAt(tx, ty) {
  const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  const n = h % 10;
  return LEVEL.grass[n < 6 ? 0 : n < 9 ? 1 : 2];
}

// Wasserecken, die nach außen ins Land ragen (beide angrenzenden Nachbarn sind kein Wasser derselben Art).
// Bitmaske der Rauten-Ecken: 1 oben, 2 rechts, 4 unten, 8 links. 0 heißt: nichts abrunden.
export const CORNER = { top: 1, right: 2, bottom: 4, left: 8 };
export function outerWaterCorners(tx, ty) {
  const c = charAt(tx, ty);
  if (c !== '~' && c !== 'o') return 0;
  const land = (x, y) => charAt(x, y) !== c;
  // Nachbarn an den Kanten: oben links (tx-1), oben rechts (ty-1), unten rechts (tx+1), unten links (ty+1)
  const ul = land(tx - 1, ty), ur = land(tx, ty - 1), dr = land(tx + 1, ty), dl = land(tx, ty + 1);
  return (ul && ur ? CORNER.top : 0) | (ur && dr ? CORNER.right : 0) | (dr && dl ? CORNER.bottom : 0) | (dl && ul ? CORNER.left : 0);
}

export function objectAt(tx, ty) {
  return OBJECTS[charAt(tx, ty)] ?? null;
}

// Ist genau dieser Punkt fest? Wie isBlocked, aber Bäume und Büsche sind nur um den Stamm herum fest.
export function isBlockedPoint(x, y) {
  const { tx, ty } = worldToTile(x, y);
  const hitbox = objectAt(tx, ty)?.hitbox;
  if (!hitbox) return isBlocked(tx, ty);
  const c = tileToWorld(tx, ty);
  return Math.hypot(x - c.x, (y - c.y) * 2) < hitbox; // Abstand in Kachel-Proportionen
}

export function isBlocked(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  if ('~oH'.includes(charAt(tx, ty))) return true;
  return objectAt(tx, ty)?.solid ?? false;
}

setLevel('meadow');
