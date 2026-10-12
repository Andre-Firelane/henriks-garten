// Die Karte des aktuellen Levels. Die Level selbst stehen in levels.js; setLevel() wechselt.
// Alle exportierten Werte zeigen immer auf das aktuelle Level.
import { LEVELS } from './levels.js';
import { tileToWorld, worldToTile } from './iso.js';

// w: Teich in der Voliere (sieht aus wie Wasser, ist aber kein wilder Teich mit Fischen); ',' Holzboden
const GROUND = { '=': 'soil', '~': 'water', o: 'fishpond', w: 'water', ',': 'planks' };
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
  // Zäune: fence = Zaunart und Richtung (x = entlang tx, y = entlang ty), siehe addFence in GardenScene
  '-': { key: 'fence_x', originY: 44 / 64, solid: true, fence: { kind: 'wood', axis: 'x' } },
  '|': { key: 'fence_y', originY: 44 / 64, solid: true, fence: { kind: 'wood', axis: 'y' } },
  S: { key: 'sign_fish', originY: 54 / 56, solid: true },
  W: { key: 'signpost', originY: 60 / 64, solid: true },
  // Savanne
  A: { key: 'acacia', originY: 87 / 96, solid: true, hitbox: 12 },
  R: { key: 'boulder', originY: 46 / 56, solid: true, hitbox: 18 },
  v: { key: 'dry_bush', originY: 33 / 40, solid: true, hitbox: 8 },
  y: { key: 'tuft', originY: 18 / 24, solid: false },
  // Gehege: Kratzbaum, hoher Gitterzaun der Voliere (entlang tx bzw. ty)
  C: { key: 'cat_tree', originY: 73 / 80, solid: true, hitbox: 10 },
  _: { key: 'mesh_x', originY: 44 / 64, solid: true, fence: { kind: 'mesh', axis: 'x' } },
  '!': { key: 'mesh_y', originY: 44 / 64, solid: true, fence: { kind: 'mesh', axis: 'y' } },
  // Netz der Voliere (entlang tx bzw. ty)
  '^': { key: 'net_x', originY: 44 / 64, solid: true, fence: { kind: 'net', axis: 'x' } },
  ';': { key: 'net_y', originY: 44 / 64, solid: true, fence: { kind: 'net', axis: 'y' } },
  // dichter Maschendraht (Teich)
  '{': { key: 'chain_x', originY: 44 / 64, solid: true, fence: { kind: 'chain', axis: 'x' } },
  '}': { key: 'chain_y', originY: 44 / 64, solid: true, fence: { kind: 'chain', axis: 'y' } },
  // Füller im Gehege-Streifen hinter dem Kartenrand: sperren die ganze Kachel (ohne hitbox), damit niemand
  // zwischen den Gehegen hinter den Rand gelangt
  1: { key: 'tree', originY: 82 / 96, solid: true },
  2: { key: 'pine', originY: 100 / 112, solid: true },
  3: { key: 'dry_bush', originY: 33 / 40, solid: true },
  // Erdhöhle im Fuchsbau
  U: { key: 'den', originY: 44 / 56, solid: true, hitbox: 16 },
  // Erdmännchenbau (Savanne, sandfarben)
  u: { key: 'den_sand', originY: 44 / 56, solid: true, hitbox: 16 },
  // hoher Wildzaun (Savanne), Bild 80 Pixel hoch
  '[': { key: 'tall_x', originY: 60 / 80, solid: true, fence: { kind: 'tall', axis: 'x' } },
  ']': { key: 'tall_y', originY: 60 / 80, solid: true, fence: { kind: 'tall', axis: 'y' } },
};

export let LEVEL_ID;
export let LEVEL;
export let MAP_W;
export let MAP_H;
export let START;
// Gehege: { id, name, area (Innenfläche), species (erlaubte Tierarten, null = alle), gates, sign (Schild-Kachel) }
export let ENCLOSURES;
export let SHED;
export let TOOL_SPOTS;
export let EXITS;
export let GATE_TILES; // { tx, ty, vertical }: vertical = Tor in einem Zaun entlang ty
export let FISHPOND_TILES;
export let FISH_SPOTS; // Stellen, an denen wilde Fische auftauchen
export let NEAR_WATER; // freie Kacheln höchstens 2 Kacheln von einem wilden Teich entfernt (für Frösche)
export let NEAR_TREES; // freie Kacheln höchstens 2 Kacheln von einem Baum entfernt (für Giraffen)
export let SHORE_TILES; // Uferplätze an wilden Teichen zum Trinken: { tx, ty, water: { tx, ty } } (für Zebras)
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
  SHED = LEVEL.shed;
  TOOL_SPOTS = LEVEL.toolSpots;
  EXITS = LEVEL.exits;
  GATE_TILES = tilesWith('G').map((t) => ({ ...t, vertical: '|!;}]'.includes(charAt(t.tx, t.ty - 1)) || '|!;}]'.includes(charAt(t.tx, t.ty + 1)) }));
  // Ältere Level haben noch ein einziges Gehege (pen) für alle Tiere
  const list = LEVEL.enclosures ?? (LEVEL.pen ? [{ id: 'pen', name: 'Gehege', area: LEVEL.pen, species: null }] : []);
  ENCLOSURES = list.map((e) => {
    const a = e.area;
    // Tore liegen im Zaun rund um die Innenfläche
    const gates = GATE_TILES.filter(({ tx, ty }) => tx >= a.tx0 - 1 && tx <= a.tx1 + 1 && ty >= a.ty0 - 1 && ty <= a.ty1 + 1);
    // Schild hängt am Zaunstück direkt vor dem ersten Torflügel (signSide: 'right' = hinter dem letzten)
    const right = e.signSide === 'right';
    const g = right ? gates[gates.length - 1] : gates[0];
    const d = right ? 1 : -1;
    const sign = e.species && g ? (g.vertical ? { tx: g.tx, ty: g.ty + d } : { tx: g.tx + d, ty: g.ty }) : null;
    return { ...e, gates, sign };
  });
  FISHPOND_TILES = tilesWith('o');
  // Wasser in den wilden Teichen direkt am begehbaren Ufer, damit man sie mit dem Kescher erreicht
  FISH_SPOTS = tilesWith('~').filter(({ tx, ty }) =>
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !isBlocked(tx + dx, ty + dy)),
  );
  NEAR_WATER = freeTilesNear('~');
  NEAR_TREES = freeTilesNear('ATPD');
  SHORE_TILES = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (isBlocked(tx, ty) || inPen(tx, ty) || exitAt(tx, ty)) continue;
      const w = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => charAt(tx + dx, ty + dy) === '~');
      if (w) SHORE_TILES.push({ tx, ty, water: { tx: tx + w[0], ty: ty + w[1] } });
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

// Freie Kacheln im Inneren (nicht im Gehege, kein Übergang), höchstens 2 Kacheln von einem der Zeichen entfernt
function freeTilesNear(chars) {
  const tiles = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (isBlocked(tx, ty) || inPen(tx, ty) || exitAt(tx, ty)) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) near = chars.includes(charAt(tx + dx, ty + dy));
      if (near) tiles.push({ tx, ty });
    }
  }
  return tiles;
}

function charAt(tx, ty) {
  return ROWS[ty]?.[tx] ?? '.';
}

// Das Gehege, zu dessen Innenfläche diese Kachel gehört (oder null)
export function enclosureAt(tx, ty) {
  return ENCLOSURES.find(({ area: a }) => tx >= a.tx0 && tx <= a.tx1 && ty >= a.ty0 && ty <= a.ty1) ?? null;
}

// Liegt die Kachel in irgendeinem Gehege?
export function inPen(tx, ty) {
  return !!enclosureAt(tx, ty);
}

// Kachel in einem Gehege oder direkt daneben (dort sollen keine wilden Tiere erscheinen)
export function nearEnclosure(tx, ty) {
  return ENCLOSURES.some(({ area: a }) => tx >= a.tx0 - 1 && tx <= a.tx1 + 1 && ty >= a.ty0 - 1 && ty <= a.ty1 + 2);
}

// Darf diese Tierart in dieses Gehege?
export function accepts(enclosure, species) {
  return !enclosure.species || enclosure.species.includes(species);
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
  if (!'~ow'.includes(c)) return 0;
  const land = (x, y) => charAt(x, y) !== c;
  // Nachbarn an den Kanten: oben links (tx-1), oben rechts (ty-1), unten rechts (tx+1), unten links (ty+1)
  const ul = land(tx - 1, ty), ur = land(tx, ty - 1), dr = land(tx + 1, ty), dl = land(tx, ty + 1);
  return (ul && ur ? CORNER.top : 0) | (ur && dr ? CORNER.right : 0) | (dr && dl ? CORNER.bottom : 0) | (dl && ul ? CORNER.left : 0);
}

// Richtung eines Zaunstücks oder Tors an dieser Kachel ('x', 'y') oder null
export function fenceAxisAt(tx, ty) {
  const fence = objectAt(tx, ty)?.fence;
  if (fence) return fence.axis;
  const gate = GATE_TILES.find((g) => g.tx === tx && g.ty === ty);
  return gate ? (gate.vertical ? 'y' : 'x') : null;
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

// Nur Gelände sperrt (Kartenrand, Wasser, Hütte), keine Objekte wie Felsen, Büsche oder Bäume
export function isTerrainBlocked(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  return '~owH'.includes(charAt(tx, ty));
}

export function isBlocked(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  if ('~owH'.includes(charAt(tx, ty))) return true;
  return objectAt(tx, ty)?.solid ?? false;
}

setLevel('meadow');
