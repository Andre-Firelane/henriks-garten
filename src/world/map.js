// Die Karte des aktuellen Levels. Die Level selbst stehen in levels.js; setLevel() wechselt.
// Alle exportierten Werte zeigen immer auf das aktuelle Level.
import { LEVELS } from './levels.js';
import { game } from '../state.js';
import { TILE_W, TILE_H, tileToWorld, worldToTile } from './iso.js';

// w: Teich in der Voliere (sieht aus wie Wasser, ist aber kein wilder Teich mit Fischen); ',' Holzboden;
// h: heiße Quelle (Asien); B, E: Bogenbrücke über den Teich (darunter Wasser)
const GROUND = { '=': 'soil', '~': 'water', o: 'fishpond', w: 'water', ',': 'planks', h: 'hotspring', B: 'water', E: 'water' };
const PATH_CHARS = '#GXI';
// Boden in den Hütten je Gebiet (sonst Holzdielen)
const HUT_FLOOR = { forest: 'planks_forest', savanna: 'planks_savanna', asia: 'planks_asia', office: 'floor_office' }; // Weg, Tor, Übergang und das Tor über dem Weg (Torii) liegen auf dem Weg-Boden

// Objekte: Textur, Ankerpunkt (Kachelmitte im Bild) und ob man dagegen läuft.
// hitbox: nur ein Kreis mit diesem Radius um die Kachelmitte ist fest (z. B. der Baumstamm); ohne hitbox die ganze Kachel.
export const OBJECTS = {
  T: { key: 'tree', originY: 82 / 96, solid: true, hitbox: 12 },
  b: { key: 'bush', originY: 33 / 40, solid: true, hitbox: 4 }, // Büsche und Sträucher: nur ein kleiner Kern ist fest, sonst bleibt man hängen
  r: { key: 'rock', originY: 18 / 24, solid: true, hitbox: 12 },
  f: { key: 'flowers_red', originY: 22 / 32, solid: false },
  g: { key: 'flowers_yellow', originY: 22 / 32, solid: false },
  P: { key: 'pine', originY: 100 / 112, solid: true, hitbox: 12 },
  D: { key: 'dark_tree', originY: 90 / 104, solid: true, hitbox: 12 },
  k: { key: 'dark_bush', originY: 36 / 44, solid: true, hitbox: 4 },
  L: { key: 'log', originY: 44 / 64, solid: true },
  n: { key: 'fern', originY: 24 / 32, solid: false },
  m: { key: 'mushroom', originY: 18 / 24, solid: false },
  // Zäune: fence = Zaunart und Richtung (x = entlang tx, y = entlang ty), siehe addFence in GardenScene
  '-': { key: 'fence_x', originY: 44 / 64, solid: true, fence: { kind: 'wood', axis: 'x' } },
  '|': { key: 'fence_y', originY: 44 / 64, solid: true, fence: { kind: 'wood', axis: 'y' } },
  S: { key: 'sign_fish', originY: 54 / 56, solid: true },
  W: { key: 'signpost_post', originY: 60 / 64, solid: true }, // Wegweiser: die schrägen Bretter zeichnet die Szene (drawSignBoards)
  // Savanne
  A: { key: 'acacia', originY: 116 / 128, solid: true, hitbox: 12 },
  R: { key: 'boulder', originY: 46 / 56, solid: true, hitbox: 18 },
  v: { key: 'dry_bush', originY: 33 / 40, solid: true, hitbox: 4 },
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
  4: { key: 'bush', originY: 33 / 40, solid: true }, // niedrige Füller rechts neben den Gehegen, damit man hineinsieht
  5: { key: 'dark_bush', originY: 36 / 44, solid: true },
  6: { key: 'bamboo', originY: 118 / 128, solid: true }, // Bambus als Füller (Asien)
  // Erdhöhle im Fuchsbau
  U: { key: 'den', originY: 44 / 56, solid: true, hitbox: 16 },
  // Erdmännchenbau (Savanne, sandfarben)
  u: { key: 'den_sand', originY: 44 / 56, solid: true, hitbox: 16 },
  // begehbare Hütte: Wände wie Zäune (Bild je Stil, siehe addFence). Einrichtung passend zum Gebiet
  // (styled: Bild <key>_<Stil der Hütte>): Schreibtisch, Stuhl, Zimmerpflanze und Wandregal mit den Werkzeugen
  M: { key: 'hutwall_x', originY: 60 / 80, solid: true, fence: { kind: 'hut', axis: 'x' } },
  N: { key: 'hutwall_y', originY: 60 / 80, solid: true, fence: { kind: 'hut', axis: 'y' } },
  p: { key: 'hut_desk', styled: true, originY: 44 / 64, solid: true, hitbox: 14 },
  j: { key: 'hut_chair', styled: true, originY: 44 / 64, solid: true, hitbox: 8 },
  a: { key: 'hut_plant', styled: true, originY: 60 / 80, solid: true, hitbox: 10 },
  // Regal an der Wand: nicht fest (die Wand dahinter hält auf), weiter hinten gezeichnet, damit man davor steht
  c: { key: 'hut_shelf', styled: true, originY: 80 / 96, solid: false, depthShift: -14, chest: true },
  // kleine Werkzeug-Kiste (Teichinsel in Asien): steht neben der Bogenbrücke und wird vor deren Geländer gezeichnet
  e: { key: 'hut_chest_small', originY: 44 / 64, solid: true, hitbox: 10, chest: true, depthShift: 30 },
  // Haupthaus im Tierpark: großer Schreibtisch über drei Kacheln (Y in der Mitte, V daneben: unsichtbar, aber fest)
  // und Bürostuhl dahinter
  Y: { key: 'office_desk', originY: 72 / 96, solid: true, computer: true }, // Hauptrechner: hier startet man Events
  V: { invisible: true, solid: true },
  z: { key: 'office_chair', originY: 44 / 64, solid: true, hitbox: 8 },
  // Zimmerpflanzen (corner: rücken im Bild in die Ecke zwischen den Wänden) und Sitzecke: Sofa über zwei Kacheln
  // (d vorne, V dahinter), Couchtisch, Sessel und Teppich (floor: liegt flach auf dem Boden)
  Z: { key: 'office_plant_monstera', originY: 84 / 96, solid: true, hitbox: 8, corner: true },
  s: { key: 'office_plant_strelitzia', originY: 84 / 96, solid: true, hitbox: 8, corner: true },
  d: { key: 'office_sofa', originY: 68 / 80, solid: true },
  i: { key: 'office_table', originY: 52 / 60, solid: true, hitbox: 12 },
  x: { key: 'office_armchair', originY: 52 / 60, solid: true, hitbox: 12 },
  t: { key: 'office_rug', originY: 30 / 84, solid: false, floor: true },
  F: { key: 'feeder', originY: 52 / 64, solid: true, hitbox: 10, feeder: true }, // Futterautomat im Tierpark
  // Asien
  Q: { key: 'bamboo', originY: 118 / 128, solid: true, hitbox: 10 },
  q: { key: 'tall_grass', originY: 40 / 48, solid: false }, // hohes Gras: man geht hindurch (Versteck)
  J: { key: 'jungle_tree', originY: 150 / 160, solid: true, hitbox: 14 },
  K: { key: 'cherry_tree', originY: 82 / 96, solid: true, hitbox: 10 },
  O: { key: 'sun_rock', originY: 40 / 48, solid: true, hitbox: 20 },
  l: { key: 'stone_lantern', originY: 50 / 56, solid: true, hitbox: 8 },
  I: { key: 'torii', originY: 100 / 128, solid: false }, // rotes Tor über dem Weg
  // Bogenbrücken: B entlang ty, E entlang tx; gezeichnet werden sie am Stück (siehe drawBridges in GardenScene)
  B: { solid: false, bridge: 'y' },
  E: { solid: false, bridge: 'x' },
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
export let TOOL_SPOTS;
export let EXITS;
export let GATE_TILES; // { tx, ty, vertical }: vertical = Tor in einem Zaun entlang ty
export let FISHPOND_TILES;
export let FISH_SPOTS; // Stellen, an denen wilde Fische auftauchen
export let KOI_WATER; // Wasser des wilden Koi-Teichs (alle Kacheln, nicht im Gehege)
export let NEAR_WATER; // freie Kacheln höchstens 2 Kacheln von einem wilden Teich entfernt (für Frösche)
export let NEAR_TREES; // freie Kacheln höchstens 2 Kacheln von einem Baum entfernt (für Giraffen)
export let SHORE_TILES; // Uferplätze an wilden Teichen zum Trinken: { tx, ty, water: { tx, ty } } (für Zebras)
export let PEN_SHORE_TILES; // dasselbe an den Teichen in Gehegen (Zebras im Gehege)
// Grundfläche des Autos (Schnellreise): Strecke vom Vorderrad links unten bis zum Anhänger rechts oben (Welt-Pixel)
export let CAR_BODY = null;
const CAR_HALF_WIDTH = 13; // so weit neben dieser Strecke ist es noch fest
export let BRIDGES; // Bogenbrücken: { axis: 'x' | 'y', at: feste Spalte bzw. Zeile, from, to: erste und letzte Kachel }
export let MOLE_SPOTS; // Wiesenstellen, an denen Maulwürfe auftauchen (freies Gras, kein Gehege)
export let SQUIRREL_TREES; // Bäume, auf denen Eichhörnchen wohnen können: { tx, ty, ground: { tx, ty } }
let ROWS;

const tilesWith = (ch) => ROWS.flatMap((row, ty) => [...row].flatMap((c, tx) => (c === ch ? [{ tx, ty }] : [])));

export function setLevel(id) {
  LEVEL_ID = id;
  LEVEL = LEVELS[id];
  ROWS = LEVEL.rows;
  // freigeschaltete Teile (z. B. das Flamingo-Gehege) über die Karte legen: { id, tx, ty, rows }
  for (const u of LEVEL.unlocks ?? []) {
    if (!game.unlocked.includes(u.id)) continue;
    ROWS = ROWS.map((row, y) => {
      const patch = u.rows[y - u.ty];
      return patch === undefined ? row : row.slice(0, u.tx) + patch + row.slice(u.tx + patch.length);
    });
  }
  MAP_W = Math.max(...ROWS.map((r) => r.length));
  MAP_H = ROWS.length;
  START = LEVEL.start;
  TOOL_SPOTS = LEVEL.toolSpots;
  EXITS = LEVEL.exits;
  const car = LEVEL.car;
  const c = car && tileToWorld(car.tx, car.ty);
  const k = car?.scale ?? 1; // größere Autos haben eine längere Grundfläche
  CAR_BODY = c ? { ax: c.x - 44 * k, ay: c.y - 4 * k, bx: c.x + 48 * k, by: c.y - 24 * k } : null;
  const beyondGate = (tx, ty, dy) => {
    while (charAt(tx, ty) === 'G') ty += dy;
    return charAt(tx, ty);
  };
  GATE_TILES = tilesWith('G').map((t) => ({
    ...t,
    vertical: '|!;}]N'.includes(beyondGate(t.tx, t.ty - 1, -1)) || '|!;}]N'.includes(beyondGate(t.tx, t.ty + 1, 1)),
  }));
  // Ältere Level haben noch ein einziges Gehege (pen) für alle Tiere
  const all = LEVEL.enclosures ?? (LEVEL.pen ? [{ id: 'pen', name: 'Gehege', area: LEVEL.pen, species: null }] : []);
  const list = all.filter((e) => !e.unlock || game.unlocked.includes(e.unlock)); // noch nicht gebaute Gehege fehlen
  ENCLOSURES = list.map((e) => {
    // Kacheln der Innenfläche: entweder ein Rechteck (area) oder alles, was vom Startpunkt (seed) aus erreichbar ist,
    // ohne über Zaun, Wand oder Tor zu gehen. So sind auch L-Formen und unregelmäßige Gehege möglich.
    const tiles = e.seed ? floodPen(e.seed) : rectTiles(e.area);
    const tileSet = new Set(tiles.map(({ tx, ty }) => tx + ',' + ty));
    const a = e.area ?? {
      tx0: Math.min(...tiles.map((t) => t.tx)),
      tx1: Math.max(...tiles.map((t) => t.tx)),
      ty0: Math.min(...tiles.map((t) => t.ty)),
      ty1: Math.max(...tiles.map((t) => t.ty)),
    };
    // Tore liegen im Zaun direkt neben der Innenfläche
    const gates = GATE_TILES.filter(({ tx, ty }) =>
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => tileSet.has(tx + dx + ',' + (ty + dy))),
    );
    // Schild hängt am Zaunstück direkt vor dem ersten Torflügel (signSide: 'right' = hinter dem letzten)
    const right = e.signSide === 'right';
    const g = right ? gates[gates.length - 1] : gates[0];
    const d = right ? 1 : -1;
    const sign = e.species && g ? (g.vertical ? { tx: g.tx, ty: g.ty + d } : { tx: g.tx + d, ty: g.ty }) : null;
    return { ...e, area: a, tiles, tileSet, gates, sign };
  });
  FISHPOND_TILES = tilesWith('o');
  // Wasser in den wilden Teichen direkt am begehbaren Ufer, damit man sie mit dem Kescher erreicht
  KOI_WATER = tilesWith('~').filter(({ tx, ty }) => !inPen(tx, ty));
  FISH_SPOTS = tilesWith('~').filter(({ tx, ty }) =>
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !isBlocked(tx + dx, ty + dy)),
  );
  NEAR_WATER = freeTilesNear('~');
  NEAR_TREES = freeTilesNear('ATPD');
  // Brücken: zusammenhängende Kacheln derselben Brückenart in einer Linie
  BRIDGES = [];
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const c = charAt(tx, ty);
      if (c === 'B' && charAt(tx, ty - 1) !== 'B') {
        let end = ty;
        while (charAt(tx, end + 1) === 'B') end++;
        BRIDGES.push({ axis: 'y', at: tx, from: ty, to: end });
      }
      if (c === 'E' && charAt(tx - 1, ty) !== 'E') {
        let end = tx;
        while (charAt(end + 1, ty) === 'E') end++;
        BRIDGES.push({ axis: 'x', at: ty, from: tx, to: end });
      }
    }
  }
  SHORE_TILES = [];
  PEN_SHORE_TILES = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      if (isBlocked(tx, ty) || exitAt(tx, ty)) continue;
      const pen = inPen(tx, ty);
      const w = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => charAt(tx + dx, ty + dy) === (pen ? 'w' : '~'));
      if (w) (pen ? PEN_SHORE_TILES : SHORE_TILES).push({ tx, ty, water: { tx: tx + w[0], ty: ty + w[1] } });
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

export function charAt(tx, ty) {
  return ROWS[ty]?.[tx] ?? '.';
}

// Das Gehege, zu dessen Innenfläche diese Kachel gehört (oder null)
export function enclosureAt(tx, ty) {
  const key = tx + ',' + ty;
  return ENCLOSURES.find((e) => e.tileSet.has(key)) ?? null;
}

function rectTiles(a) {
  const tiles = [];
  for (let ty = a.ty0; ty <= a.ty1; ty++) for (let tx = a.tx0; tx <= a.tx1; tx++) tiles.push({ tx, ty });
  return tiles;
}

// alle Kacheln, die man vom Startpunkt aus erreicht, ohne Zaun, Wand oder Tor zu überqueren
function floodPen(seed) {
  const seen = new Set([seed.tx + ',' + seed.ty]);
  const tiles = [];
  const todo = [seed];
  while (todo.length) {
    const t = todo.pop();
    tiles.push(t);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { tx: t.tx + dx, ty: t.ty + dy };
      const key = n.tx + ',' + n.ty;
      if (seen.has(key) || n.tx < 0 || n.ty < 0 || n.tx >= MAP_W || n.ty >= MAP_H) continue;
      const c = charAt(n.tx, n.ty);
      if (c === 'G' || OBJECTS[c]?.fence) continue;
      seen.add(key);
      todo.push(n);
      if (tiles.length > 600) throw new Error(`Gehege bei ${seed.tx},${seed.ty} ist nicht geschlossen`);
    }
  }
  return tiles;
}

// Liegt die Kachel in irgendeinem Gehege?
export function inPen(tx, ty) {
  return !!enclosureAt(tx, ty);
}

// Kachel in einem Gehege oder direkt daneben (dort sollen keine wilden Tiere erscheinen)
export function nearEnclosure(tx, ty) {
  if (inHut(tx, ty, 1)) return true; // auch an und in der Hütte erscheinen keine wilden Tiere
  for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) if (enclosureAt(tx - dx, ty - dy)) return true;
  return false;
}

// Begehbare Gebäude des Levels: die Hütte und weitere (z. B. das Katzenhäuschen im Tierpark)
export function buildings() {
  return [LEVEL.hut, ...(LEVEL.buildings ?? [])].filter(Boolean);
}

// Das Gebäude, in dem diese Kachel liegt (samt Wänden), mit margin Kacheln Rand drumherum
export function buildingAt(tx, ty, margin = 0) {
  return buildings().find((h) => tx >= h.tx0 - margin && tx <= h.tx1 + margin && ty >= h.ty0 - margin && ty <= h.ty1 + margin) ?? null;
}

// Liegt die Kachel in der Hütte bzw. einem Gebäude (samt Wänden)?
export function inHut(tx, ty, margin = 0) {
  return !!buildingAt(tx, ty, margin);
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
  const house = buildingAt(tx, ty);
  if (house) return HUT_FLOOR[house.style] ?? 'planks'; // die ganze Hütte hat Holzboden, auch unter Wänden und Tür
  if (PATH_CHARS.includes(c)) return LEVEL.path;
  // ein Wegweiser mitten auf dem Weg (rundum Weg) steht auf Pflaster statt auf einer einzelnen Graskachel
  if (c === 'W' && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => PATH_CHARS.includes(charAt(tx + dx, ty + dy)))) return LEVEL.path;
  const g = GROUND[c];
  // eigenes Teichwasser des Gehege bzw. Gebiets (z. B. Koi-Teich mit Seerosen), fest pro Kachel verteilt
  const water = enclosureAt(tx, ty)?.water ?? LEVEL.water;
  if (g === 'fishpond' && !water) return (tx + ty) % 2 ? 'fishpond0' : 'fishpond1';
  if ((g === 'water' || g === 'fishpond') && water) return water[(((tx * 73856093) ^ (ty * 19349663)) >>> 0) % water.length];
  if (g) return g;
  return grassAt(tx, ty);
}

// Gras in drei Varianten, fest pro Kachel verteilt
export function grassAt(tx, ty) {
  const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  const n = h % 10;
  // im Tierpark hat jedes Gehege und jeder Randstreifen den Boden seiner Welt
  const zone = LEVEL.grounds?.find(({ area: a }) => tx >= a.tx0 && tx <= a.tx1 && ty >= a.ty0 && ty <= a.ty1);
  const grass = enclosureAt(tx, ty)?.ground ?? zone?.ground ?? LEVEL.grass;
  return grass[n < 6 ? 0 : n < 9 ? 1 : 2];
}

// Wasserecken, die nach außen ins Land ragen (beide angrenzenden Nachbarn sind kein Wasser derselben Art).
// Bitmaske der Rauten-Ecken: 1 oben, 2 rechts, 4 unten, 8 links. 0 heißt: nichts abrunden.
export const CORNER = { top: 1, right: 2, bottom: 4, left: 8 };
export function outerWaterCorners(tx, ty) {
  const c = charAt(tx, ty);
  if (!'~owh'.includes(c)) return 0;
  // unter der Brücke geht das Wasser weiter
  const land = (x, y) => charAt(x, y) !== c && !(c === '~' && 'BE'.includes(charAt(x, y)));
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

// Höhe des Brückenbogens (Höchststand) je nach Länge der Brücke
export function bridgeArch(b) {
  return Math.min(14, 3 + (b.to - b.from + 1) * 2.5);
}

// So hoch steht man an dieser Stelle auf einer Bogenbrücke (0 = nicht auf einer Brücke)
export function bridgeLift(x, y) {
  if (!BRIDGES?.length) return 0;
  const a = x / (TILE_W / 2);
  const b = y / (TILE_H / 2);
  const txf = (a + b) / 2;
  const tyf = (b - a) / 2;
  for (const br of BRIDGES) {
    const [along, cross] = br.axis === 'y' ? [tyf, txf] : [txf, tyf];
    if (cross < br.at || cross >= br.at + 1 || along < br.from || along >= br.to + 1) continue;
    const t = (along - br.from) / (br.to + 1 - br.from);
    return Math.sin(Math.PI * t) * bridgeArch(br);
  }
  return 0;
}

export function objectAt(tx, ty) {
  return OBJECTS[charAt(tx, ty)] ?? null;
}

// Ist genau dieser Punkt fest? Wie isBlocked, aber Bäume und Büsche sind nur um den Stamm herum fest.
// wade: durch Wasser waten (Wasserbüffel beim Reittier-Event in Asien)
export function isBlockedPoint(x, y, wade = false) {
  if (CAR_BODY && nearSegment(x, y, CAR_BODY) < CAR_HALF_WIDTH) return true;
  const { tx, ty } = worldToTile(x, y);
  if (wade && charAt(tx, ty) === '~') return false;
  const hitbox = objectAt(tx, ty)?.hitbox;
  if (!hitbox) return isBlocked(tx, ty);
  const c = tileToWorld(tx, ty);
  return Math.hypot(x - c.x, (y - c.y) * 2) < hitbox; // Abstand in Kachel-Proportionen
}

// Abstand eines Punkts von der Strecke a–b
function nearSegment(x, y, { ax, ay, bx, by }) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
}

// Nur Gelände sperrt (Kartenrand, Wasser, Hütte), keine Objekte wie Felsen, Büsche oder Bäume
export function isTerrainBlocked(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  return '~owHh '.includes(charAt(tx, ty));
}

export function isBlocked(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  if ('~owH '.includes(charAt(tx, ty))) return true; // Leerzeichen: außerhalb der Karte (nichts zu sehen, z. B. neben dem Tierpark)
  return objectAt(tx, ty)?.solid ?? false;
}

setLevel('park');
