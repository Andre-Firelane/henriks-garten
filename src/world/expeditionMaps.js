// Expeditionen (Test, nur Savanne): Camp und kleine feste Maps. Sie stehen wie die anderen Gebiete in LEVELS (siehe Ende
// von levels.js), haben aber das Kennzeichen expedition: '<Biom>' – Tiere, Gehege, Bilder und Ladepakete richten sich dann
// nach dem Biom (biomeOf in map.js). Tiere und Wetter sind nicht fest: vor jeder Map werden sie neu gewürfelt (planMap in
// expedition.js), passend zu den Merkmalen der Map (features: 'water', 'graveyard', 'thicket', 'waterfall', 'river',
// 'clearing'). Das Wetter ändert nur Aussehen und Geräusche (looks, siehe setLevel in map.js).
// Regeln (Karten, Tierliste, Wagen) siehe expedition.js.
//
// Die gewürfelte Tierliste (home) sagt, wie viele Fang-Einheiten jeder Art auf der Map leben (eine Herde, Kolonie oder ein
// Hyänenrudel zählt als eine). Es kommen keine neuen nach; fehlt eine (weggelaufen), taucht sie wieder auf.
// Übergänge: '@camp' führt zurück ins Camp, '@next' aus dem Camp weiter (vorher kommen die Karten).
import { tr } from '../i18n.js';

// Optik der Savanne je Wetter (wie in levels.js unter savanna bzw. savanna.seasons)
const SAVANNA = {
  hero: 'hero_savanna',
  background: '#b89a52',
  ambient: 'ambient_savanna',
  ambientVolume: 0.35,
  path: 'savanna_path',
  flies: true,
  enclosures: [],
  toolSpots: [],
};
const LOOK = {
  normal: { grass: ['sgrass0', 'sgrass1', 'sgrass2'] },
  dry: {
    grass: ['sdry0', 'sdry1', 'sdry2'],
    objectKeys: { A: 'acacia_bare', ƚ: 'savanna_tallgrass_dry', Ƙ: 'dry_bush' },
    fishIn: '≈',
  },
  rain: {
    grass: ['sgrass_rain0', 'sgrass_rain1', 'sgrass_rain2'],
    objectKeys: { ƚ: 'savanna_tallgrass_rain', Ƙ: 'savanna_bush_rain', v: 'savanna_shrub_rain' },
    ambient: 'ambient_savanna_rain',
    ambientVolume: 0.5,
  },
};

// Dschungel (Expedition): Grundlage und Optik je Wetter (wie in levels.js unter jungle bzw. jungle.seasons)
const JUNGLE = {
  hero: 'hero_jungle',
  background: '#2f5a24',
  ambient: 'ambient_jungle',
  ambientVolume: 0.7,
  path: 'jungle_path',
  water: ['water'],
  // alles Wasser grünlich und fließend wie der Fluss im offenen Dschungel (auch kleine Gewässer: minSize 1)
  flow: { frames: ['jungle_flow0', 'jungle_flow1', 'jungle_flow2', 'jungle_flow3'], ms: 280, minSize: 1 },
  roundShore: true,
  enclosures: [],
  toolSpots: [],
};
const LOOK_J = {
  normal: { grass: ['jgrass0', 'jgrass1', 'jgrass2'] },
  rain: { grass: ['jgrass_rain0', 'jgrass_rain1', 'jgrass_rain2'], ambient: 'ambient_savanna_rain', ambientVolume: 0.5 },
  fog: { grass: ['jgrass0', 'jgrass1', 'jgrass2'], ambientVolume: 0.18 },
};
const jmap = (def) => withRoute({ ...JUNGLE, ...LOOK_J.normal, looks: LOOK_J, expedition: 'jungle', ...def });
// Dschungel-Maps: Start auf dem Steg am Fluss-Einlauf (man kommt mit dem Kanu), Ausgang rechts
const EDGE_J = {
  start: { tx: 4, ty: 13 },
  inlet: { from: { tx: -1.5, ty: 13 }, to: { tx: 2, ty: 13 } }, // Kanu: von dort über den Fluss bis an den Steg
  exits: [{ tx: 27, ty: 13, to: '@camp', label: tr('Weiter zum nächsten Camp', 'On to the next camp') }],
};

// Felskante mit Wasserfall und Becken oben links (wie im offenen Dschungel); dazu die Sonnen-Fläche der Leguane
const WATERFALL_STAMP = {
  tx: 0,
  ty: 0,
  rows: [
    'kJkkJkkJkkJk',
    'JŔŔŔŔŔŔŔŔk..',
    'kŔŔ.ŴnḢrĎĎJ.', // (Sonnenfelsen wie im offenen Dschungel als normale Steine: der Sonnenfelsen gehört zum Bambuswald-Paket)
    'kŔr~~~~ĎĎ.J.',
    'JŔr~~~~nn.q.',
    'kŔn~~~Ď.Jq..',
    'kŔḟnĎr.nnn..',
    'JŔĎĎĎnq.nľľ.',
    'k...........',
  ],
};
const WATERFALL_SUN = { tx0: 1, ty0: 1, tx1: 9, ty1: 7, iguanas: 2 };
// Lichtungen der Gorillas (freie Rechtecke mit Dickicht-Rand, siehe makeRows clearing und Gorilla.js)
const CLEARING_A = { tx0: 15, ty0: 16, tx1: 22, ty1: 22 };
const CLEARING_B = { tx0: 12, ty0: 7, tx1: 19, ty1: 12 };
const CLEARING_C = { tx0: 14, ty0: 17, tx1: 21, ty1: 23 };

// Fluss-Maps (Aras, Tukane): man fängt sie nur im Tiefflug über dem Wasser – am besten vom Kanu aus. Fluss in den Zeilen
// 15 bis 18, Steg in Spalte 6; das Kanu gleitet von links heran und bleibt danach fahrbar (boat, wie im offenen Dschungel)
const RIVER_J = { ty0: 15, ty1: 18, dockX: 6 };
const EDGE_JR = {
  start: { tx: 6, ty: 14 },
  inlet: { from: { tx: -1.5, ty: 16 }, to: { tx: 6, ty: 16 } },
  boat: { tx: 6, ty: 16 },
  current: { tx: 1, ty: 0, speed: 10 }, // der Fluss treibt das Kanu langsam nach rechts
  exits: [{ tx: 27, ty: 6, to: '@camp', label: tr('Weiter zum nächsten Camp', 'On to the next camp') }], // weit weg vom Fluss: der Ausgang ist eindeutig zu Fuß
};

// Start links, Ausgang rechts (gleich für alle Maps aus makeRows)
const EDGE = { start: { tx: 2, ty: 13 }, exits: [{ tx: 27, ty: 13, to: '@camp', label: tr('Weiter zum nächsten Camp', 'On to the next camp') }] };

// Zeilen einer 28 × 28-Map aus wenigen Angaben, mit festem Zufall (seed: jedes Mal dieselbe Map):
// ponds/muds: Ellipsen [Mitte tx, Mitte ty, Halbachse x, Halbachse y] aus Wasser (~) bzw. Schlamm (≈); scatter: so viele
// von jedem Zeichen verstreut; grass: so viele Flecken hohes Gras; keepFree(x, y): dort nichts hinstellen.
// Rand aus Sträuchern mit ein paar Akazien und Felsbrocken; Start (links) und Ausgang (rechts) bleiben frei
// palette: Rand und Hohes-Gras-Zeichen je Welt (PALETTE); inlet: Fluss-Einlauf links mit Steg (Dschungel: man kommt
// mit dem Kanu an, siehe expArriveByCanoe in GardenScene)
const PALETTE = {
  savanna: { edge: 'v', edgeMix: [['A', 0.6], ['R', 1]], edgeChance: 0.14, grass: 'ƚ' },
  jungle: { edge: 'k', edgeMix: [['J', 0.7], ['Ṁ', 1]], edgeChance: 0.45, grass: 'q' },
  asia: { edge: 'k', edgeMix: [['Q', 0.7], ['K', 0.85], ['r', 1]], edgeChance: 0.4, grass: 'q' },
  plateau: { edge: 'Ȓ', edgeMix: [['Ȟ', 0.6], ['ȓ', 1]], edgeChance: 0.3, grass: 'q' }, // verschneite Felsen (Hochebene)
  forest: { edge: 'D', edgeMix: [['P', 0.5], ['k', 0.85], ['Ɍ', 1]], edgeChance: 0.5, grass: 'n' }, // Wald: Laubbäume, Tannen, Büsche; Farn statt hohem Gras
  moor: { edge: 'Ɋ', edgeMix: [['P', 0.4], ['k', 0.8], ['D', 1]], edgeChance: 0.5, grass: 'ẉ' }, // Moor: Birken am Rand, Wollgras
};
// river: Fluss quer durch die Map (Zeilen ty0 bis ty1, ganze Breite); clearing: freie Lichtung (Rechteck) mit Dickicht-Rand
// (Lücken bleiben); stamp: festes Kartenstück { tx, ty, rows } (z. B. Wasserfall mit Felskante); shoreTrees: so viele
// Urwaldbäume direkt am Wasser (Aras und Tukane sitzen nur in Uferbäumen, höchstens 3 Kacheln vom Wasser)
// riverInlet: Fluss quer durch die Map (Zeilen ty0 bis ty1), man kommt mit dem Kanu von links und legt an einem Steg in
// Spalte dockX an (der Steg ragt vom Ufer oben in den Fluss); docks: weitere Stege [[tx, ty], ...] zum Aus- und Einsteigen
// (Bambuswald) springs: Ellipsen aus heißer Quelle (h); groves: so viele Bambushaine (Q, am Rand hohes Gras);
// snowRows: bis zu dieser Zeile ist der Rand aus verschneiten Felsen (Hochebene, PALETTE.plateau)
// (Wald) vriver: Bach von oben nach unten { x, bridgeY, damY, rocks } (siehe unten); bogTrees: so viele Moorbäume (ǒ) im
// Wasser; walks: Holzstege [[tx, ty0, ty1], ...] entlang ty; gnawed: so viele angenagte Bäume (ƀ) direkt am Wasser;
// lodge: Biberburg (Ƅ) am Ufer, möglichst nah an [tx, ty]
function makeRows({ seed, ponds = [], muds = [], scatter = {}, grass = 0, keepFree = () => false, palette = 'savanna', inlet = false, thickets = 0, river = null, clearing = null, stamp = null, shoreTrees = 0, riverInlet = null, docks = [], masses = 0, creeks = 0, mangroves = 0, exitY = 13, springs = [], groves = 0, snowRows = -1, vriver = null, bogTrees = 0, walks = [], gnawed = 0, lodge = null }) {
  const P0 = PALETTE[palette];
  const PS = PALETTE.plateau;
  const N = 28;
  const P = P0;
  let st = seed >>> 0;
  const rnd = () => {
    st = (st + 0x6d2b79f5) >>> 0;
    let t = st;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pal = (y) => (y <= snowRows ? PS : P0); // Rand: oben verschneit (Hochebene), darunter wie die Welt
  const g = Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => (x === 0 || y === 0 || x === N - 1 || y === N - 1 ? pal(y).edge : '.')));
  // (gleiche Zufallsfolge wie früher: die Savannen- und Dschungel-Maps bleiben, wie sie sind)
  for (let i = 0; i < 4 * N; i++) if (rnd() < P0.edgeChance) {
    const k = Math.floor(rnd() * 4);
    const t = Math.floor(rnd() * N);
    const [x, y] = [[t, 0], [t, N - 1], [0, t], [N - 1, t]][k];
    const r = rnd();
    g[y][x] = pal(y).edgeMix.find(([, w]) => r < w)[0];
  }
  const ellipse = ([cx, cy, rx, ry], c) => {
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) g[y][x] = c;
  };
  for (const m of muds) ellipse(m, '≈');
  for (const p of ponds) ellipse(p, '~');
  for (const s of springs) ellipse(s, 'h');
  if (river) for (let y = river.ty0; y <= river.ty1; y++) for (let x = 0; x < N; x++) g[y][x] = '~';
  // Bach von oben nach unten (Wald): 3 Kacheln breit (ab Spalte x), leicht geschwungen; an der Brücke (bridgeY) und am
  // Biberdamm (damY) genau gerade, damit Brückenbild und Damm passen. Die Brücke (E) liegt quer darüber, rocks: so viele
  // Felsen im Bach (ř, Schaum drumherum)
  const fixedRows = vriver ? [vriver.bridgeY, vriver.damY].filter((y) => y != null) : [];
  const nearFixed = (y, d = 1) => fixedRows.some((f) => Math.abs(y - f) <= d);
  if (vriver) {
    const ph = rnd() * 6.3;
    const bank = [];
    for (let y = 0; y < N; y++) {
      bank[y] = vriver.x + (nearFixed(y) ? 0 : Math.round(1.2 * Math.sin(y * 0.3 + ph))); // je Zeile höchstens eine Kachel versetzt
      for (let x = bank[y]; x < bank[y] + 3; x++) g[y][x] = '~';
    }
    if (vriver.bridgeY != null) for (let x = vriver.x; x < vriver.x + 3; x++) g[vriver.bridgeY][x] = 'E';
    for (let i = 0, tries = 0; i < (vriver.rocks ?? 0) && tries < 50; tries++) {
      const y = 3 + Math.floor(rnd() * (N - 6));
      if (nearFixed(y, 2) || g[y - 1][bank[y] + 1] === 'ř' || g[y + 1][bank[y] + 1] === 'ř') continue;
      g[y][bank[y] + 1] = 'ř';
      i++;
    }
  }
  // Moorbäume: ragen aus dem Wasser (ringsum meist Wasser), nicht dicht beieinander
  for (let i = 0, tries = 0; i < bogTrees && tries < 300; tries++) {
    const x = 2 + Math.floor(rnd() * (N - 4));
    const y = 2 + Math.floor(rnd() * (N - 4));
    if (g[y][x] !== '~') continue;
    const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => g[y + dy][x + dx] === '~').length;
    if (wet < 2 || [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => g[y + dy][x + dx] === 'ǒ'))) continue;
    g[y][x] = 'ǒ';
    i++;
  }
  for (const [x, y0, y1] of walks) for (let y = y0; y <= y1; y++) if ('~.'.includes(g[y][x])) g[y][x] = 'Ŝ';
  // Ufer für die Biber: freie Kacheln direkt am Wasser (nicht an Brücke und Damm, nicht am Start oder Ausgang)
  const bankTiles = () => {
    const list = [];
    for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) {
      if (g[y][x] !== '.' || nearFixed(y, 2) || x <= 5 || x >= N - 6) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy][x + dx] === '~')) list.push([x, y]);
    }
    return list;
  };
  if (lodge) {
    const [lx, ly] = bankTiles().sort((a, b) => Math.hypot(a[0] - lodge[0], a[1] - lodge[1]) - Math.hypot(b[0] - lodge[0], b[1] - lodge[1]))[0] ?? [];
    if (lx != null) g[ly][lx] = 'Ƅ';
  }
  for (let i = 0, tries = 0; i < gnawed && tries < 200; tries++) {
    const list = bankTiles();
    if (!list.length) break;
    const [x, y] = list[Math.floor(rnd() * list.length)];
    if ([-2, -1, 0, 1, 2].some((dy) => [-2, -1, 0, 1, 2].some((dx) => 'ƀƄ'.includes(g[y + dy]?.[x + dx])))) continue; // verteilt
    g[y][x] = 'ƀ';
    i++;
  }
  // Fluss mit Kurven: Ober- und Unterkante schwingen je Spalte (zwei Sinuswellen, je Map anders); am Einlauf bis
  // hinter den Steg bleibt er gerade (dort gleitet das Kanu herein)
  const bank = [];
  if (riverInlet) {
    const { ty0, ty1, dockX } = riverInlet;
    const ph = rnd() * 6.3;
    const ph2 = rnd() * 6.3;
    for (let x = 0; x < N; x++) {
      const k = Math.min(1, Math.max(0, (x - dockX - 1) / 4)); // sanft einsetzen
      const mid = k * (2.4 * Math.sin(x * 0.23 + ph) + 0.6 * Math.sin(x * 0.52 + ph2)); // flach genug: je Spalte höchstens eine Kachel
      const wide = k * Math.round(1.1 * Math.sin(x * 0.37 + ph2));
      const top = Math.round(ty0 + mid - wide / 2);
      const bot = Math.round(ty1 + mid + wide / 2);
      bank[x] = { top, bot };
      for (let y = top; y <= bot; y++) g[y][x] = '~';
    }
    g[ty0 - 1][dockX] = 'Ŝ';
    g[ty0][dockX] = 'Ŝ';
    // Stege an den Ufern: [x, 'n'|'s'] – Nordufer: Landkachel und erste Wasserkachel, Südufer ebenso
    for (const [x, side] of docks) {
      const { top, bot } = bank[x];
      if (side === 'n') {
        g[top - 1][x] = 'Ŝ';
        g[top][x] = 'Ŝ';
      } else {
        g[bot][x] = 'Ŝ';
        g[bot + 1][x] = 'Ŝ';
      }
    }
  } else for (const [x, y] of docks) g[y][x] = 'Ŝ';
  if (stamp) stamp.rows.forEach((r, dy) => [...r].forEach((c, dx) => (g[stamp.ty + dy][stamp.tx + dx] = c)));
  const inClearing = (x, y) => clearing && x >= clearing.tx0 && x <= clearing.tx1 && y >= clearing.ty0 && y <= clearing.ty1;
  // Fluss-Einlauf links (Zeilen 12 bis 14, bis Spalte 4), darin ein Steg (Spalten 3 und 4, Zeile 13) zum Ufer
  if (inlet) {
    for (let y = 12; y <= 14; y++) for (let x = 0; x <= 4; x++) g[y][x] = '~';
    g[13][3] = 'Ŝ';
    g[13][4] = 'Ŝ';
  }
  // am Start (mit Fluss-Einlauf: größer, damit kein Baum vor dem Steg steht) und am Ausgang bleibt es frei
  // (vor dem Steg – zur Kamera hin – noch weiter frei, sonst steht ein Baum zwischen Kamera und Henrik)
  const nearStart = (x, y) => (riverInlet ? x <= riverInlet.dockX + 5 && y >= riverInlet.ty0 - 5 && y < riverInlet.ty0 : inlet ? x <= 11 && y >= 10 && y <= 17 : x <= 4 && Math.abs(y - 13) <= 2);
  const nearEnd = (x, y) => nearStart(x, y) || (x >= N - 6 && y >= exitY - 2 && y <= exitY + 4); // vor dem Ausgang (zur Kamera hin) mehr frei
  const free = (x, y) => g[y][x] === '.' && !nearEnd(x, y) && !keepFree(x, y) && !inClearing(x, y);
  const spot = () => {
    for (let i = 0; i < 200; i++) {
      const x = 2 + Math.floor(rnd() * (N - 4));
      const y = 2 + Math.floor(rnd() * (N - 4));
      // große Dinge nicht direkt ans Wasser (Ufer bleibt begehbar)
      if (free(x, y) && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => '~≈'.includes(g[y + dy][x + dx]))) return [x, y];
    }
    return null;
  };
  // Bäche (Dschungel): kurze, gewundene Wasserläufe (2 Kacheln breit), wie die Kanäle im offenen Dschungel
  // würde etwas Hohes auf (x, y) Wasser verdecken? (Wasser dahinter, also bis 2 Kacheln nach links oder oben)
  const hidesWater = (x, y) => [0, 1, 2].some((a) => [0, 1, 2].some((b) => (a || b) && g[y - b]?.[x - a] === '~'));
  const HIGH = 'JṀḢQKƟȞPDØɊǒĦ';
  for (let i = 0; i < creeks; i++) {
    const s = spot();
    if (!s) continue;
    let [x, y] = s;
    let dir = Math.floor(rnd() * 4);
    const len = 6 + Math.floor(rnd() * 6);
    for (let n = 0; n < len; n++) {
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const cx = x + dx;
        const cy = y + dy;
        if (cx > 2 && cy > 2 && cx < N - 3 && cy < N - 3 && free(cx, cy)) g[cy][cx] = '~';
      }
      if (rnd() < 0.35) dir = (dir + (rnd() < 0.5 ? 1 : 3)) % 4;
      const [dx, dy] = [[1, 0], [0, 1], [-1, 0], [0, -1]][dir];
      x = Math.max(3, Math.min(N - 5, x + dx));
      y = Math.max(3, Math.min(N - 5, y + dy));
    }
  }
  // Mangroven direkt am Ufer (Stelzwurzeln)
  if (mangroves) {
    const shore = [];
    for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) if (free(x, y) && !hidesWater(x, y) && [[1, 0], [0, 1]].some(([dx, dy]) => g[y + dy][x + dx] === '~') && ![[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => g[y + dy][x + dx] === 'Ŝ')) shore.push([x, y]); // (nicht neben Stegen)
    for (let i = 0; i < mangroves && shore.length; i++) {
      const [x, y] = shore.splice(Math.floor(rnd() * shore.length), 1)[0];
      if ([-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => g[y + dy][x + dx] === 'Ṁ'))) { i--; continue; } // einzeln, keine Hecke
      g[y][x] = 'Ṁ';
    }
  }
  for (let i = 0; i < grass; i++) {
    const s = spot();
    if (!s) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0]]) if (rnd() < 0.85 && free(s[0] + dx, s[1] + dy)) g[s[1] + dy][s[0] + dx] = P.grass;
  }
  // Uferbäume: freie Kacheln 1 bis 2 Kacheln neben Wasser (nicht über der Map-Mitte: dort zählt es für Aras nicht)
  if (shoreTrees) {
    const shore = [];
    for (let y = 9; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      if (!free(x, y)) continue;
      let d = 9;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (g[y + dy]?.[x + dx] === '~' && y + dy > 8) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
      if (d >= 1 && d <= 2) shore.push([x, y]);
    }
    // zwei Drittel am hinteren Ufer (verdecken das Wasser nicht), der Rest egal wo
    const back = shore.filter(([x, y]) => !hidesWater(x, y));
    for (let i = 0; i < shoreTrees; i++) {
      const list = i < (shoreTrees * 2) / 3 && back.length ? back : shore;
      if (!list.length) break;
      const [x, y] = list[Math.floor(rnd() * list.length)];
      for (const l of [back, shore]) { const j = l.findIndex(([a, b]) => a === x && b === y); if (j >= 0) l.splice(j, 1); }
      g[y][x] = 'J';
    }
  }
  // Lichtung: Rand aus Dickicht (mit Lücken), innen bleibt frei
  if (clearing) {
    const { tx0, ty0, tx1, ty1 } = clearing;
    for (let y = ty0 - 1; y <= ty1 + 1; y++) for (let x = tx0 - 1; x <= tx1 + 1; x++) {
      if (inClearing(x, y) || g[y]?.[x] !== '.' || nearEnd(x, y)) continue;
      if (rnd() < 0.7) g[y][x] = 'Ď';
    }
  }
  // Dickicht-Massen (Dschungel, wie im offenen Dschungel): große, unregelmäßige Flächen Dickicht (5 bis 16 Kacheln),
  // gewachsen von einer Kachel aus; darin ab und zu ein Busch oder Urwaldbaum
  for (let i = 0; i < masses; i++) {
    const s = spot();
    if (!s) continue;
    const size = 5 + Math.floor(rnd() * 12);
    const cells = [s];
    g[s[1]][s[0]] = 'Ď';
    for (let n = 1, tries = 0; n < size && tries < 80; tries++) {
      const [cx, cy] = cells[Math.floor(rnd() * cells.length)];
      const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rnd() * 4)];
      const x = cx + dx;
      const y = cy + dy;
      if (x < 1 || y < 1 || x > N - 2 || y > N - 2 || !free(x, y)) continue;
      g[y][x] = rnd() < 0.08 ? 'k' : rnd() < 0.05 ? 'J' : 'Ď';
      cells.push([x, y]);
      n++;
    }
  }
  // Dickicht-Inseln (Dschungel): je ein paar Kacheln Ď beieinander
  for (let i = 0; i < thickets; i++) {
    const s = spot();
    if (!s) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [2, 1]]) if (rnd() < 0.75 && free(s[0] + dx, s[1] + dy)) g[s[1] + dy][s[0] + dx] = 'Ď';
  }
  // Bambushaine (Bambuswald): unregelmäßige Flächen Bambus (6 bis 15 Kacheln), am Rand und dazwischen hohes Gras –
  // dort sitzen die Pandas, und die Tiger streifen hindurch
  for (let i = 0; i < groves; i++) {
    const s = spot();
    if (!s) continue;
    const size = 6 + Math.floor(rnd() * 10);
    const cells = [s];
    g[s[1]][s[0]] = 'Q';
    for (let n = 1, tries = 0; n < size && tries < 80; tries++) {
      const [cx, cy] = cells[Math.floor(rnd() * cells.length)];
      const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rnd() * 4)];
      const x = cx + dx;
      const y = cy + dy;
      if (x < 2 || y < 2 || x > N - 3 || y > N - 3 || !free(x, y) || hidesWater(x, y)) continue;
      g[y][x] = rnd() < 0.25 ? 'q' : 'Q';
      cells.push([x, y]);
      n++;
    }
    for (const [cx, cy] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (rnd() < 0.3 && free(cx + dx, cy + dy)) g[cy + dy][cx + dx] = 'q';
  }
  for (const [c, n] of Object.entries(scatter)) {
    for (let i = 0; i < n; i++) {
      let s = spot();
      for (let t = 0; s && HIGH.includes(c) && hidesWater(s[0], s[1]) && t < 20; t++) s = spot(); // nichts Hohes vor Wasser
      if (s && !(HIGH.includes(c) && hidesWater(s[0], s[1]))) g[s[1]][s[0]] = c;
    }
  }
  if (!inlet) g[13][0] = pal(13).edge;
  g[exitY][N - 1] = 'X';
  return g.map((r) => r.join(''));
}
// (Reiher fliegen nur heran, wenn welche auf der Tierliste stehen, siehe expWants in GardenScene)
const map = (def) => withRoute({ ...SAVANNA, ...LOOK.normal, looks: LOOK, expedition: 'savanna', ...(def.camp ? {} : { herons: { every: [5, 10], landChance: 1 } }), ...def });

// Teich in eine gezeichnete Map legen: Ellipse [Mitte tx, Mitte ty, Halbachse x, Halbachse y]; nur auf freiem Boden
function withPond(rows, [cx, cy, rx, ry]) {
  return rows.map((row, y) => [...row].map((c, x) => ('.yƚ'.includes(c) && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 ? '~' : c)).join(''));
}

// Maps (mit tools): ein durchgehender Weg vom Start zum Ausgang (um Wasser und Hindernisse herum, möglichst wenige Knicke)
// und die Werkzeugkiste am Weg, möglichst in der Mitte der Map (sonst läuft man zu viel)
const ROUTE_FREE = '.yƚqnľfgȓmḃƒȁṽẉọ'; // darüber darf der Weg (Gras, Büschel, hohes Gras, Farn, Bodenpflanzen, Blumen, Geröll; Wald: Pilze, Blumen, Wollgras)
const ROUTE_OVER = 'E'; // ... und über Brücken (die bleiben, wie sie sind)
const TURN = 3; // so viel teurer ist ein Knick als ein gerades Stück
const SHORE_COST = 4; // nicht am Wasser entlang (sonst ist unklar, ob man laufen oder fahren soll)
const THICKET_COST = 6; // durch Dickicht nur, wenn es sonst einen großen Umweg gäbe (der Weg schneidet es dann frei)
const TALL = 'AǍRƲƦŢuJkṀḢḟĎQKƟȞȨƩPDØɊǒḩḫɌƀĦ'; // hohe Dinge (Bäume, Felsen, Termitenhügel, Baue, Bambus, Stupa): davor wird die Kiste verdeckt
// steht vor der Kachel (zur Kamera hin, bis 2 Kacheln) etwas Hohes, das die Kiste verdecken würde?
// Ein Objekt auf (x + i, y + j) steht vor der Kachel (x, y), wenn i + j > 0; es verdeckt sie, wenn es schmal genug
// daneben steht (|i − j| ≤ 1, eine Kachel sind 32 Pixel zur Seite) und hoch genug ist (i + j Kacheln sind (i + j) · 16
// Pixel tiefer im Bild). REACH: bis zu welcher Summe i + j das Objekt (Krone) eine Kiste noch verdeckt
const REACH = { q: 2, J: 9, A: 8, Ǎ: 8, Ʋ: 8, Ṁ: 6, Ḣ: 5, Ʀ: 5, Ţ: 4, ḟ: 4, Q: 6, K: 5, Ɵ: 6, Ȟ: 4, Ȩ: 4, Ʃ: 3, P: 7, D: 7, Ø: 8, Ɋ: 6, ǒ: 7, ḩ: 3, ḫ: 3, Ɍ: 3, ƀ: 5, Ħ: 8 };
export const coveredAt = (get, x, y) => {
  for (let i = -1; i <= 9; i++) for (let j = -1; j <= 9; j++) {
    if (i + j <= 0 || Math.abs(i - j) > 1) continue;
    const c = get(x + i, y + j) ?? '';
    if ((TALL.includes(c) || c === 'q') && i + j <= (REACH[c] ?? 2)) return true; // (auch hohes Gras direkt davor)
  }
  return false;
};
const hiddenAt = (g, x, y) => coveredAt((a, b) => g[b]?.[a], x, y);
function withRoute(def) {
  if (!def.tools) return def;
  const g = def.rows.map((r) => [...r].map((c) => (c === '#' || c === 'e' ? '.' : c)));
  const H = g.length;
  const W = g[0].length;
  const { tx: sx, ty: sy } = def.start;
  const { tx: ex, ty: ey } = def.exits[0];
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const ok = (x, y) => (x === ex && y === ey) || (x > 0 && y > 0 && x < W - 1 && y < H - 1 && (ROUTE_FREE.includes(g[y][x]) || ROUTE_OVER.includes(g[y][x]) || g[y][x] === 'Ď'));
  // Dijkstra über (Kachel, Richtung)
  const key = (x, y, d) => (y * W + x) * 4 + d;
  const dist = new Map();
  const from = new Map();
  let open = [];
  for (let d = 0; d < 4; d++) {
    dist.set(key(sx, sy, d), 0);
    open.push([0, sx, sy, d]);
  }
  let end = null;
  while (open.length) {
    open.sort((p, q) => p[0] - q[0]);
    const [c, x, y, d] = open.shift();
    if (c > dist.get(key(x, y, d))) continue;
    if (x === ex && y === ey) {
      end = key(x, y, d);
      break;
    }
    DIRS.forEach(([dx, dy], nd) => {
      const nx = x + dx;
      const ny = y + dy;
      if (!ok(nx, ny)) return;
      const shore = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a, b]) => g[ny + b]?.[nx + a] === '~');
      const nc = c + 1 + (nd === d ? 0 : TURN) + (g[ny][nx] === 'Ď' ? THICKET_COST : 0) + (shore ? SHORE_COST : 0);
      const k = key(nx, ny, nd);
      if (nc >= (dist.get(k) ?? Infinity)) return;
      dist.set(k, nc);
      from.set(k, key(x, y, d));
      open.push([nc, nx, ny, nd]);
    });
  }
  const path = [];
  for (let k = end; k != null; k = from.get(k)) path.push({ x: Math.floor(k / 4) % W, y: Math.floor(Math.floor(k / 4) / W) });
  for (const { x, y } of path) if (ROUTE_FREE.includes(g[y][x]) || g[y][x] === 'Ď') g[y][x] = '#'; // (Steg und Ausgang bleiben)
  // Kiste: freie Kachel direkt am Weg, so nah wie möglich an der Mitte
  const onPath = new Set(path.map(({ x, y }) => `${x},${y}`));
  let best = null;
  for (const { x, y } of path) {
    for (const [dx, dy] of DIRS) {
      const cx = x + dx;
      const cy = y + dy;
      if (onPath.has(`${cx},${cy}`) || !ok(cx, cy) || g[cy][cx] === 'Ď' || ROUTE_OVER.includes(g[cy][cx]) || (cx === ex && cy === ey) || hiddenAt(g, cx, cy)) continue;
      const dd = Math.hypot(cx - W / 2, cy - H / 2);
      if (!best || dd < best.dd) best = { x: cx, y: cy, dd };
    }
  }
  if (best) g[best.y][best.x] = 'e';
  return { ...def, rows: g.map((r) => r.join('')), chests: best ? [{ tx: best.x, ty: best.y, tools: def.tools }] : [] };
}
const BACK = (tx, ty) => [{ tx, ty, to: '@camp', label: tr('Weiter zum nächsten Camp', 'On to the next camp') }];

// Ausgang auf der gegenüberliegenden Seite (rechts, letzte Spalte); links am Start kein Übergang mehr (den Weg legt withRoute)
function eastExit(rows, ty) {
  return rows.map((r, y) => {
    if (y !== ty) return r;
    const c = [...r];
    c[0] = 'v';
    c[c.length - 1] = 'X';
    return c.join('');
  });
}

const BIG_WAGON = (game) => !!game.expedition?.boni?.includes('bigWagon'); // fünfter Käfig im Camp

// Käfige im Camp (je einer pro Tierart): je 3 × 3 Kacheln innen (Gitterwand), oben links die Startkachel; unten rechts
// ein Wassertrog (Krokodil, Nilpferd, Fische)
const CAGES = [[3, 3], [7, 3], [3, 7], [7, 7]];

// kleines Camp: links die 4 Käfige (2 × 2) und darunter das Sammelgehege, daneben Platz für den fünften Käfig (Bonus
// "Größerer Wagen", siehe runPatches), rechts das Zelt (man kommt davor an),
// die Tafel in der südlichen Ecke (dahinter ist frei: sie verdeckt nichts), ein kurzer Weg zum Ausgang, unten das Auto
function campRows() {
  const W = 18;
  const H = 20;
  const g = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (y === 0 || y === H - 1 || x === 0 || x === W - 1 ? 'v' : '.')));
  const put = (x, y, c) => (g[y][x] = c);
  for (const [x, y] of [[0, 0], [W - 1, 0], [0, H - 1], [8, 0], [0, 7], [16, 2], [15, 1]]) put(x, y, 'A'); // zwei hinter dem Zelt; keine vor der Tafel und den Gehegen
  for (const [x, y] of [[4, 0], [14, 0], [W - 1, 4], [5, H - 1]]) put(x, y, 'R');
  // Käfige: Gitterwände in den Zeilen 2, 6, 10 (entlang tx) und den Spalten 2, 6, 10 (entlang ty)
  for (const y of [2, 6, 10]) for (let x = 2; x <= 10; x++) put(x, y, '_');
  for (const x of [2, 6, 10]) for (const y of [3, 4, 5, 7, 8, 9]) put(x, y, '!');
  for (const [x, y] of CAGES) put(x + 2, y + 2, 'o'); // Wassertrog
  // Sammelgehege (Holzzaun) für die Tiere, die nicht in den Wagen passen
  for (const y of [12, 16]) for (let x = 2; x <= 7; x++) put(x, y, '-');
  for (const x of [2, 7]) for (const y of [13, 14, 15]) put(x, y, '|');
  // Zelt (3 × 3, fest), Tafel in der südlichen Ecke, Weg vom Zelteingang zum Ausgang rechts
  for (let y = 3; y <= 5; y++) for (let x = 13; x <= 15; x++) put(x, y, 'V');
  put(16, 17, 'V');
  for (const [x, y] of [[14, 8], [14, 9], [15, 9], [16, 9]]) put(x, y, '#');
  put(W - 1, 9, 'X');
  for (const [x, y] of [[13, 1], [1, 11], [5, 18], [11, 18]]) put(x, y, 'y');
  return g.map((r) => r.join(''));
}

// vorderer Waldrand des Dschungel-Camps: niedrige, gemischte Pflanzen (Büsche, Hibiskus, Farne, Bodenpflanzen, Blumen)
const FRONT_PLANTS = ['k', 'ḟ', 'n', 'k', 'ľ', 'k', 'f', 'n', 'k', 'ḟ', 'g', 'ľ', 'k'];

// Dschungel-Camp: wie das der Savanne, aber ringsum dichter Urwald (zwei Reihen) und unten ein Flussarm mit Steg
function jungleCampRows() {
  const W = 18;
  const H = 22;
  const g = Array.from({ length: H }, () => Array.from({ length: W }, () => '.'));
  const put = (x, y, c) => (g[y][x] = c);
  // Urwald-Ring: hinten (oben und links im Bild) hohe Urwaldbäume und Büsche, vorn (unten und rechts) nur niedrige Büsche,
  // sonst verdecken die Bäume Fluss, Kanu, Wasserflugzeug und Tafel
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ring = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (ring > 1) continue;
    const front = x >= W - 2 || y >= H - 2;
    put(x, y, front ? FRONT_PLANTS[(x * 7 + y * 11 + ring * 5) % FRONT_PLANTS.length] : ring === 0 ? ((x + y) % 2 ? 'J' : 'k') : (x * 3 + y) % 4 === 0 ? 'J' : 'k');
  }
  // Flussarm unten (Zeilen 17 bis 19), quer durch den Wald; Steg zum Kanu
  for (let y = 17; y <= 19; y++) for (let x = 0; x < W; x++) put(x, y, '~');
  put(13, 17, 'Ŝ');
  put(13, 18, 'Ŝ');
  // Käfige (wie in der Savanne)
  for (const y of [2, 6, 10]) for (let x = 2; x <= 10; x++) put(x, y, '_');
  for (const x of [2, 6, 10]) for (const y of [3, 4, 5, 7, 8, 9]) put(x, y, '!');
  for (const [x, y] of CAGES) put(x + 2, y + 2, 'o');
  // Sammelgehege
  for (const y of [12, 16]) for (let x = 2; x <= 7; x++) put(x, y, '-');
  for (const x of [2, 7]) for (const y of [13, 14, 15]) put(x, y, '|');
  // Zelt, Tafel, Weg vom Zelt zum Steg
  for (let y = 3; y <= 5; y++) for (let x = 13; x <= 15; x++) put(x, y, 'V');
  put(15, 15, 'V');
  for (const [x, y] of [[14, 8], [14, 9], [14, 10], [14, 11], [14, 12], [14, 13], [13, 14], [14, 14], [13, 15], [13, 16]]) put(x, y, '#');
  // etwas Grün in der Lichtung
  for (const [x, y] of [[12, 2], [3, 11], [9, 11], [16, 9], [11, 14], [12, 12]]) if (g[y][x] === '.') put(x, y, 'n');
  for (const [x, y] of [[15, 7], [11, 1], [8, 15]]) if (g[y][x] === '.') put(x, y, 'ľ');
  return g.map((r) => r.join(''));
}

// --- Bambuswald (Expedition) ---

// Grundlage und Optik je Wetter (wie der Bambuswald in levels.js). Schneefall: überall Schnee (die Schneedecke, siehe
// SnowCover.js) und fallende Flocken; Nebel: der Schleier aus Weather.js
const ASIA = {
  hero: 'hero_asia',
  background: '#3f7a35',
  ambient: 'ambient_asia',
  path: 'asia_path',
  water: ['asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water0', 'asia_water1', 'asia_water2'],
  enclosures: [],
  toolSpots: [],
};
const SNOW_BG = '#dfe7ee'; // hinter verschneiten Maps (statt Grün)
const LOOK_A = {
  normal: { grass: ['agrass0', 'agrass1', 'agrass2'] },
  snow: { grass: ['agrass0', 'agrass1', 'agrass2'], snow: true, snowline: { full: 40, band: 1 }, background: SNOW_BG },
  fog: { grass: ['agrass0', 'agrass1', 'agrass2'], ambientVolume: 0.5 },
};
// Start links, Ausgang rechts (wie EDGE); auf dem Weg steht ein rotes Tor (Torii)
const amap = (def) => withTorii(withRoute({ ...ASIA, ...LOOK_A.normal, looks: LOOK_A, expedition: 'asia', ...EDGE, ...def }));
// Das Tor passt nur über ein Wegstück entlang ty (wie im Bambuswald): das erste solche Stück vom Start aus, nicht
// direkt am Start oder Ausgang
function withTorii(def) {
  if (def.camp || !def.tools) return def;
  const g = def.rows.map((r) => [...r]);
  const along = (x, y) => g[y][x] === '#' && g[y - 1]?.[x] === '#' && g[y + 1]?.[x] === '#' && g[y][x - 1] !== '#' && g[y][x + 1] !== '#';
  const spots = [];
  for (let y = 2; y < g.length - 2; y++) for (let x = 3; x < g[0].length - 3; x++) if (along(x, y)) spots.push([x, y]);
  spots.sort((a, b) => Math.hypot(a[0] - def.start.tx, a[1] - def.start.ty) - Math.hypot(b[0] - def.start.tx, b[1] - def.start.ty));
  if (spots[0]) g[spots[0][1]][spots[0][0]] = 'I';
  return { ...def, rows: g.map((r) => r.join('')) };
}
// Yak-Herde am Steinhaufen (Ƈ): Salzstein-Stellen von selbst, freie Wiese 3 bis 8 Kacheln um den Steinhaufen
function yaksAt(rows) {
  let cairn = null;
  rows.forEach((r, ty) => [...r].forEach((c, tx) => c === 'Ƈ' && (cairn = { tx, ty })));
  const spots = [];
  rows.forEach((r, ty) => [...r].forEach((c, tx) => {
    const d = Math.max(Math.abs(tx - cairn.tx), Math.abs(ty - cairn.ty));
    if (c === '.' && d >= 3 && d <= 8 && tx > 1 && ty > 1 && tx < 26 && ty < 26) spots.push([tx, ty]);
  }));
  // gleichmäßig verteilt höchstens 10 davon
  const step = Math.max(1, Math.floor(spots.length / 10));
  return { count: 3, salt: spots.filter((_, i) => i % step === 0).slice(0, 10) };
}
// Hochebene: Gebetsfahnen, Stupa und Steinhaufen (Kartenstück; die Leinen der Fahnen siehe STUPA_FLAGS)
const STUPA_STAMP = {
  tx: 9,
  ty: 3,
  rows: [
    'Ƨ.......Ƨ',
    '.........',
    '..Ʃ......',
    '.........',
    '......Ƈ..',
    '.........',
    'Ƨ.......Ƨ',
  ],
};
const STUPA_FLAGS = [[[9, 3], [17, 3]], [[9, 9], [17, 9]], [[17, 3], [17, 9]]];
const inStamp = (s) => (x, y) => x >= s.tx - 1 && x <= s.tx + s.rows[0].length && y >= s.ty - 1 && y <= s.ty + s.rows.length;
// Felsengrat: Steinhaufen mit Gebetsfahne unten rechts (die großen Felsen verstreut, siehe scatter)
const RIDGE_STAMP = { tx: 16, ty: 17, rows: ['Ƨ.....', '......', '..Ƈ...', '......', '.....Ƨ'] };
const RIDGE_FLAGS = [[[16, 17], [21, 21]]];

// Bambuswald-Camp: wie das der Savanne, ringsum Büsche, Bambus und Kirschbäume; rechts zwischen Steinlaternen geht es weiter
function asiaCampRows() {
  const sub = { v: 'k', A: 'K', R: 'r' };
  const g = campRows().map((r) => [...r].map((c) => sub[c] ?? c));
  for (const [x, y] of [[0, 3], [0, 9], [3, 0], [11, 0], [0, 15], [10, 0]]) g[y][x] = 'Q'; // Bambus hinten (oben und links)
  for (const [x, y] of [[16, 8], [16, 10], [12, 7]]) g[y][x] = 'l'; // Steinlaternen am Weg
  return g.map((r) => r.join(''));
}

const ASIA_LEVELS = {
  asia_camp: amap({
    name: tr('Bambuswald-Expedition', 'Bamboo Forest Expedition'),
    camp: true,
    car: { tx: 15.6, ty: 12, texture: 'car_zoo', frame: 0, scale: 1.1, arrive: { tx: 14, ty: 7 } },
    map: { x: 78, y: 37, icon: 'panda' },
    unlockWith: 'asia',
    rows: asiaCampRows(),
    start: { tx: 14, ty: 7 },
    campfire: { tx: 12, ty: 9 },
    tent: { tx: 14, ty: 4 },
    board: { tx: 16, ty: 17 },
    enclosures: [
      ...CAGES.map(([tx, ty], i) => ({ id: `cage${i}`, name: tr('Käfig', 'Cage'), species: null, seed: { tx, ty }, cage: i })),
      { id: 'corral', name: tr('Sammelgehege', 'Holding pen'), species: null, seed: { tx: 4, ty: 14 }, corral: true },
      { id: 'cage4', name: tr('Käfig', 'Cage'), species: null, seed: { tx: 9, ty: 13 }, cage: 4, when: BIG_WAGON },
    ],
    runPatches: [{ tx: 8, ty: 12, rows: ['_____', '!...!', '!...!', '!..o!', '_____'], when: BIG_WAGON }],
    cageAreas: [{ tx0: 1, ty0: 1, tx1: 11, ty1: 11 }, { tx0: 7, ty0: 11, tx1: 13, ty1: 17 }],
    cageCenter: { tx: 8, ty: 8 },
    exits: [{ tx: 17, ty: 9, to: '@next', label: tr('Tiefer in den Bambuswald', 'Deeper into the bamboo forest') }],
    campHint: tr('⛺ Willkommen im Bambuswald-Camp! Rechts zwischen den Steinlaternen geht es tiefer in den Bambuswald – die Tafel am Zelt zeigt deinen Weg.', '⛺ Welcome to the bamboo forest camp! Between the stone lanterns on the right you go deeper into the bamboo forest – the board by the tent shows your route.'),
    spawn: { population: 0, weights: {} },
  }),

  // Bambushain: dichte Bambushaine mit hohem Gras – Pandas sitzen und fressen, Tiger streifen als Schemen hindurch
  ax_grove: amap({
    name: tr('Bambushain', 'Bamboo Grove'),
    features: ['bamboo', 'meadow'],
    rows: makeRows({ seed: 301, palette: 'asia', groves: 9, scatter: { K: 3, r: 4, k: 6, n: 18, f: 6, y: 22 }, grass: 5 }),
    tools: ['net', 'lasso'],
  }),

  // Heiße Quelle: oben am verschneiten Hang dampfen drei Quellen (Japanmakaken), dazwischen große Felsen (Schneeleopard)
  ax_spring: amap({
    name: tr('Heiße Quelle', 'Hot Spring'),
    features: ['hotspring', 'rocks'],
    rows: makeRows({ seed: 313, palette: 'asia', snowRows: 14, springs: [[8, 6, 3, 1.8], [19, 5, 2.6, 1.5], [21, 20, 2.6, 1.6]], scatter: { Ɵ: 3, Ȓ: 7, ȓ: 8, Ȩ: 2, r: 3, k: 5, y: 18, n: 8 }, grass: 3 }),
    snowline: { full: 9, band: 8 },
    tools: ['net', 'lasso'],
  }),

  // Laternental: viele Steinlaternen zwischen Büschen und Kirschbäumen – dort stehen die Tanukis verkleidet
  ax_lanterns: amap({
    name: tr('Laternental', 'Lantern Valley'),
    features: ['lanterns', 'meadow'],
    rows: makeRows({ seed: 331, palette: 'asia', groves: 2, scatter: { l: 16, K: 5, k: 10, r: 3, n: 12, f: 6, g: 4, y: 20 }, grass: 4 }),
    tools: ['net', 'lasso'],
  }),

  // Koi-Garten: großer Teich mit Koi (Fischfutter), Kirschbäume und Laternen ringsum; mit der Event-Karte wird es
  // Glühwürmchen-Abend – dann sitzen rote Pandas in den Kirschbäumen
  ax_koi: amap({
    name: tr('Koi-Garten', 'Koi Garden'),
    features: ['pond', 'cherry', 'lanterns', 'meadow'],
    rows: makeRows({ seed: 347, palette: 'asia', ponds: [[15, 7, 5.5, 3], [8, 21, 3, 1.8]], groves: 2, scatter: { K: 8, l: 8, k: 6, r: 3, n: 10, f: 8, g: 4, y: 16 }, grass: 3 }),
    tools: ['net', 'lasso'],
    fireflies: true,
  }),

  // Kirschblütenhang: viele Kirschbäume, ein paar Laternen und Bambus; zweiter Ort für den Glühwürmchen-Abend
  ax_cherry: amap({
    name: tr('Kirschblütenhang', 'Cherry Blossom Slope'),
    features: ['cherry', 'lanterns', 'bamboo', 'meadow'],
    rows: makeRows({ seed: 359, palette: 'asia', groves: 3, scatter: { K: 16, l: 7, k: 6, r: 2, n: 10, f: 10, g: 6, y: 16 }, grass: 3 }),
    tools: ['net', 'lasso'],
    fireflies: true,
  }),

  // Stupa-Weide: verschneite Hochebene mit Stupa und Gebetsfahnen – die Yak-Herde grast am Steinhaufen (Salzstein, Bürste)
  ax_stupa: (() => {
    const rows = makeRows({ seed: 373, palette: 'plateau', snowRows: 30, stamp: STUPA_STAMP, keepFree: inStamp(STUPA_STAMP), scatter: { Ȓ: 9, ȓ: 12, Ȩ: 3, Ȟ: 2, y: 22, q: 0 }, grass: 3 });
    return amap({
      name: tr('Stupa-Weide', 'Stupa Pasture'),
      features: ['plateau'],
      rows,
      snowline: { full: 16, band: 10 },
      background: SNOW_BG,
      yaks: yaksAt(rows),
      prayerFlags: STUPA_FLAGS,
      tools: ['net', 'lasso'],
    });
  })(),

  // Felsengrat: große verschneite Felsen – auf einem döst der Schneeleopard, seine Pfotenspuren führen hin; unten rechts
  // ein Steinhaufen für die Yaks
  ax_ridge: (() => {
    const rows = makeRows({ seed: 389, palette: 'plateau', snowRows: 30, stamp: RIDGE_STAMP, keepFree: inStamp(RIDGE_STAMP), scatter: { Ɵ: 5, Ȓ: 10, ȓ: 12, Ȩ: 3, Ȟ: 3, y: 18 }, grass: 2 });
    return amap({
      name: tr('Felsengrat', 'Rocky Ridge'),
      features: ['rocks', 'plateau'],
      rows,
      snowline: { full: 40, band: 1 },
      background: SNOW_BG,
      yaks: yaksAt(rows),
      prayerFlags: RIDGE_FLAGS,
      tools: ['net', 'lasso'],
    });
  })(),

  // Urwaldrand: hohe Urwaldbäume gehen in Bambus über – oben in den Kronen sitzen Orang-Utans, im Bambus der Tiger
  ax_forest: amap({
    name: tr('Urwaldrand', 'Forest Edge'),
    features: ['forest', 'bamboo', 'meadow'],
    rows: makeRows({ seed: 401, palette: 'asia', groves: 5, ponds: [[20, 21, 2.6, 1.6]], scatter: { J: 14, k: 10, K: 2, r: 3, n: 22, f: 6, y: 16 }, grass: 4 }),
    tools: ['net', 'lasso'],
  }),

  // Bergsee: unten ein großer See (Koi), oben am verschneiten Hang zwei heiße Quellen (Japanmakaken)
  ax_lake: amap({
    name: tr('Bergsee', 'Mountain Lake'),
    features: ['pond', 'hotspring', 'meadow'],
    rows: makeRows({ seed: 419, palette: 'asia', snowRows: 9, ponds: [[16, 20, 6, 3.2]], springs: [[7, 5, 2.6, 1.5], [20, 5, 2.4, 1.4]], scatter: { Ȓ: 4, ȓ: 6, K: 3, l: 3, k: 6, r: 3, n: 10, f: 4, y: 18 }, grass: 3 }),
    snowline: { full: 5, band: 7 },
    tools: ['net', 'lasso'],
  }),
};

// --- Wald (Expedition) ---

// Grundlage und Optik je Wetter (wie der Wald in levels.js). Regen: Regengeräusch, Nebel: der Schleier aus Weather.js
const FOREST = {
  hero: 'hero_forest',
  ambient: 'ambient_forest_river',
  path: 'forest_path',
  groundKeys: { '≈': 'forest_mud' }, // Schlamm der Wildschwein-Suhle
  noMudShore: true,
  roundShore: true,
  bridgeStyle: 'wood',
  bridgeArt: { back: 'forest_bridge', front: 'forest_bridge_front', len: 3, ox: 42, oy: 34 },
  objectKeys: { Ŵ: 'forest_waterfall', Ŕ: 'forest_cliff', Ŝ: 'forest_boardwalk' },
  moss: 0.14,
  bees: 3,
  birds: 3,
  enclosures: [],
  toolSpots: [],
};
const FGRASS = { grass: ['fgrass0', 'fgrass1', 'fgrass2'] };
const LOOK_F = {
  normal: FGRASS,
  rain: { ...FGRASS, ambient: 'ambient_savanna_rain', ambientVolume: 0.5 },
  fog: { ...FGRASS, ambientVolume: 0.3 },
};
const fmap = (def) => withRoute({ ...FOREST, ...LOOK_F.normal, looks: LOOK_F, expedition: 'forest', ...EDGE, ...def });
// Bach, der fließt (wie der Fluss im Wald); stilles Moorwasser fließt nicht
const FLOW_F = { frames: ['forest_flow0', 'forest_flow1', 'forest_flow2', 'forest_flow3'], ms: 300, minSize: 40 };
const WHOLE = { tx0: -4, tx1: 31, ty0: -4, ty1: 31 }; // (über den Rand hinaus: der weiche Übergang liegt dann außerhalb)
const INSIDE = { tx0: 1, tx1: 26, ty0: 1, ty1: 26 };
// Böden (grounds in levels.js): Moorboden mit dunklem, stillem Wasser bzw. Laubboden
const MOOR_GROUND = (area) => ({ area, soft: 3, ground: ['forest_moor0', 'forest_moor1', 'forest_moor2'], water: ['forest_moor_water'] });
const LEAF_GROUND = (area) => ({ area, soft: 3, ground: ['forest_leaves0', 'forest_leaves1', 'forest_leaves2'], noMoss: true });
// Moor: Nebel darüber (MoorFog.js, dort stehen die Elche), Moorgeräusche, Frösche und Reiher bevorzugt dort
const moor = (area) => ({ moorFog: area, prefer: { area, frog: 0.8, heron: 0.75 }, ambientZone: { sound: 'ambient_moor', area, fade: 7 } });
const HERONS_F = { herons: { every: [5, 10], landChance: 1 } };

// Biberdamm: große Stöcke auf freiem Boden 2 bis 4 Kacheln vom Wasser, verteilt (der Damm selbst: dam, siehe BeaverDam.js)
function sticksAt(rows, n = 4) {
  const water = (x, y, d) => {
    for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (rows[y + dy]?.[x + dx] === '~') return true;
    return false;
  };
  const list = [];
  for (let y = 3; y < rows.length - 3; y++) for (let x = 6; x < rows[0].length - 6; x++) {
    if (rows[y][x] !== '.' || water(x, y, 1) || !water(x, y, 4)) continue;
    if (list.every(([a, b]) => Math.abs(a - x) + Math.abs(b - y) >= 7)) list.push([x, y]);
  }
  return list.slice(0, n);
}

// Wald-Camp: wie das der Savanne, ringsum Laubbäume, Tannen und Büsche; rechts zwischen zwei Baumstümpfen geht es weiter
function forestCampRows() {
  const sub = { v: 'k', A: 'D', R: 'Ɍ', y: 'n' };
  const g = campRows().map((r) => [...r].map((c) => sub[c] ?? c));
  for (const [x, y] of [[0, 3], [0, 9], [3, 0], [11, 0], [0, 15], [10, 0]]) g[y][x] = 'P'; // Tannen hinten (oben und links)
  for (const [x, y] of [[16, 8], [16, 10]]) g[y][x] = 'Ț'; // Baumstümpfe am Weg
  for (const [x, y] of [[12, 1], [1, 5], [9, 1]]) if (g[y][x] === '.') g[y][x] = 'm';
  return g.map((r) => r.join(''));
}

const FOREST_LEVELS = {
  forest_camp: fmap({
    name: tr('Wald-Expedition', 'Forest Expedition'),
    camp: true,
    car: { tx: 15.6, ty: 12, texture: 'car_zoo', frame: 0, scale: 1.1, arrive: { tx: 14, ty: 7 } },
    map: { x: 53, y: 16, icon: 'stag' },
    unlockWith: 'forest',
    rows: forestCampRows(),
    start: { tx: 14, ty: 7 },
    campfire: { tx: 12, ty: 9 },
    tent: { tx: 14, ty: 4 },
    board: { tx: 16, ty: 17 },
    enclosures: [
      ...CAGES.map(([tx, ty], i) => ({ id: `cage${i}`, name: tr('Käfig', 'Cage'), species: null, seed: { tx, ty }, cage: i })),
      { id: 'corral', name: tr('Sammelgehege', 'Holding pen'), species: null, seed: { tx: 4, ty: 14 }, corral: true },
      { id: 'cage4', name: tr('Käfig', 'Cage'), species: null, seed: { tx: 9, ty: 13 }, cage: 4, when: BIG_WAGON },
    ],
    runPatches: [{ tx: 8, ty: 12, rows: ['_____', '!...!', '!...!', '!..o!', '_____'], when: BIG_WAGON }],
    cageAreas: [{ tx0: 1, ty0: 1, tx1: 11, ty1: 11 }, { tx0: 7, ty0: 11, tx1: 13, ty1: 17 }],
    cageCenter: { tx: 8, ty: 8 },
    exits: [{ tx: 17, ty: 9, to: '@next', label: tr('Tiefer in den Wald', 'Deeper into the forest') }],
    campHint: tr('⛺ Willkommen im Wald-Camp! Rechts zwischen den Baumstümpfen geht es tiefer in den Wald – die Tafel am Zelt zeigt deinen Weg.', '⛺ Welcome to the forest camp! Between the tree stumps on the right you go deeper into the forest – the board by the tent shows your route.'),
    spawn: { population: 0, weights: {} },
  }),

  // Laubwald: Laubbäume, Farne, Pilze; in den Laubhaufen verstecken sich Igel (Eicheln aus den Eichen locken sie heraus),
  // ein kleiner Tümpel für die Frösche
  fx_leafwood: fmap({
    name: tr('Laubwald', 'Broadleaf Wood'),
    features: ['leaves', 'water'],
    rows: makeRows({ seed: 501, palette: 'forest', ponds: [[21, 21, 2.2, 1.4]], scatter: { D: 18, P: 5, Ɋ: 2, Ø: 3, ɫ: 8, k: 7, Ț: 3, Ŀ: 2, ḫ: 3, ḩ: 2, n: 26, m: 8, ḃ: 6, ȁ: 6, ṽ: 4, ọ: 2 }, grass: 4 }),
    boarArea: INSIDE, // (an den Eichen Eicheln schütteln)
    tools: ['net', 'lasso'],
  }),

  // Eichenhain: viele große Eichen auf Laubboden, eine Suhle – Wildschweine wühlen nach Eicheln, Igel in den Laubhaufen
  fx_oakgrove: fmap({
    name: tr('Eichenhain', 'Oak Grove'),
    features: ['oaks', 'leaves'],
    rows: makeRows({ seed: 503, palette: 'forest', muds: [[19, 20, 3, 1.8]], scatter: { Ø: 12, ɫ: 7, D: 4, k: 5, Ț: 3, Ŀ: 2, ḫ: 3, n: 10, m: 6, ọ: 4, ȁ: 4 }, grass: 2 }),
    grounds: [LEAF_GROUND(WHOLE)],
    boarArea: INSIDE,
    tools: ['net', 'lasso'],
  }),

  // Hochmoor: große, stille Moortümpel mit alten Moorbäumen, ein Holzsteg; Nebel liegt darüber – im Moorwasser stehen
  // Elche (nur im Licht der Laterne zu sehen), Frösche, Reiher
  fx_bog: fmap({
    name: tr('Hochmoor', 'Raised Bog'),
    features: ['moor', 'water'],
    rows: makeRows({ seed: 505, palette: 'moor', ponds: [[8, 6, 4, 2.4], [19, 8, 3.5, 2.2], [9, 21, 3.5, 2.2], [20, 21, 4.5, 2.6]], bogTrees: 5, walks: [[20, 18, 24]], scatter: { Ɋ: 8, P: 3, '%': 10, ẉ: 20, k: 4, Ț: 2, Ɍ: 2, m: 4 }, grass: 4 }),
    grounds: [MOOR_GROUND(WHOLE)],
    ...moor(INSIDE),
    ...HERONS_F,
    tools: ['net', 'lasso'],
  }),

  // Birkenbruch: lichter Birkenwald im Moor, viel Wollgras, kleine Tümpel
  fx_birch: fmap({
    name: tr('Birkenbruch', 'Birch Fen'),
    features: ['moor', 'water'],
    rows: makeRows({ seed: 507, palette: 'moor', ponds: [[7, 7, 2.6, 1.6], [16, 5, 2.4, 1.5], [21, 16, 2.8, 1.8], [10, 20, 3, 1.8], [19, 23, 2.4, 1.4]], bogTrees: 3, scatter: { Ɋ: 18, P: 3, D: 2, ẉ: 26, '%': 6, k: 4, Ŀ: 2, Ț: 2, m: 5, ọ: 2 }, grass: 5 }),
    grounds: [MOOR_GROUND(WHOLE)],
    ...moor(INSIDE),
    ...HERONS_F,
    tools: ['net', 'lasso'],
  }),

  // Forellenbach: ein Bach fließt von oben nach unten durch den Wald (Holzbrücke, Felsen im Wasser) – Forellen mit der
  // Angel, Reiher am Ufer
  fx_trout: fmap({
    name: tr('Forellenbach', 'Trout Stream'),
    features: ['river', 'water'],
    rows: makeRows({ seed: 509, palette: 'forest', vriver: { x: 12, bridgeY: 13, rocks: 4 }, scatter: { D: 14, P: 8, Ɋ: 2, k: 6, Ɍ: 5, Ț: 2, Ŀ: 2, ḫ: 2, ḩ: 2, n: 24, m: 4, ḃ: 4, ƒ: 4, ȁ: 4 }, grass: 3 }),
    flow: FLOW_F,
    ...HERONS_F,
    tools: ['net', 'lasso'],
  }),

  // Biberteich: der Bach ist zu einem Teich gestaut, am Ufer die Biberburg und angenagte Bäume; im Damm ist ein Loch –
  // steckt man einen großen Stock hinein, kommt ein Biber mit (BeaverDam.js)
  fx_beaver: (() => {
    const DAM = { tx: 13, ty: 17 }; // mittlere Dammkachel (der Bach ist dort gerade: Spalten 12 bis 14)
    const rows = makeRows({ seed: 511, palette: 'forest', ponds: [[13, 11, 4.5, 3]], vriver: { x: 12, bridgeY: 23, damY: DAM.ty, rocks: 1 }, lodge: [16, 9], gnawed: 5, scatter: { D: 12, P: 6, k: 5, Ț: 5, Ŀ: 3, Ɍ: 2, ḫ: 2, n: 20, m: 4, ȁ: 4, ṽ: 3 }, grass: 3 });
    return fmap({
      name: tr('Biberteich', 'Beaver Pond'),
      features: ['river', 'dam', 'water'],
      rows,
      flow: FLOW_F,
      beavers: { count: 2, dam: DAM, sticks: sticksAt(rows) },
      ...HERONS_F,
      tools: ['net', 'lasso'],
    });
  })(),

  // Waldwiese: offene Wiese voller Blumen mit einem Hochstand, ringsum Wald – Rehe und Füchse; mit der Event-Karte wird es
  // Wolfsnacht (Rudel auf der Wiese, siehe Wolf.js)
  fx_meadow: fmap({
    name: tr('Waldwiese', 'Forest Meadow'),
    features: ['water'],
    rows: makeRows({ seed: 513, palette: 'forest', ponds: [[20, 6, 2.4, 1.5]], scatter: { D: 7, P: 4, Ɋ: 2, k: 4, ḫ: 2, ḩ: 2, Ħ: 1, Ț: 2, ḃ: 12, ƒ: 8, ȁ: 10, ṽ: 8, n: 10, m: 4 }, grass: 2 }),
    wolfNight: true,
    tools: ['net', 'lasso'],
  }),

  // Felsenschlucht: bemooste Felsbrocken, oben eine Höhle, Eichen und Laubhaufen (Igel); zweiter Ort für die Wolfsnacht
  fx_gorge: (() => {
    const CAVE = { tx: 12, ty: 1, rows: ['VVV', 'VĈV'] };
    return fmap({
      name: tr('Felsenschlucht', 'Rocky Gorge'),
      features: ['leaves'],
      rows: makeRows({ seed: 515, palette: 'forest', stamp: CAVE, keepFree: inStamp(CAVE), scatter: { Ɍ: 16, D: 8, P: 6, Ø: 3, ɫ: 6, k: 5, Ț: 2, Ŀ: 3, ḫ: 2, n: 22, m: 6, ƒ: 4, ọ: 3 }, grass: 3 }),
      boarArea: INSIDE,
      bats: { tx: 13, ty: 2 }, // Fledermäuse aus der Höhle (Wolfsnacht)
      wolfNight: true,
      tools: ['net', 'lasso'],
    });
  })(),

  // Moorrand: links Moor mit Tümpeln und Birken (Elche), rechts Eichen auf Laubboden mit Suhle (Wildschweine)
  fx_moorside: fmap({
    name: tr('Moorrand', 'Bog Edge'),
    features: ['moor', 'oaks', 'water'],
    rows: makeRows({ seed: 517, palette: 'forest', ponds: [[6, 7, 3, 2], [8, 20, 3.5, 2.2]], bogTrees: 3, muds: [[20, 21, 2.6, 1.6]], scatter: { Ø: 7, ɫ: 4, Ɋ: 6, P: 3, D: 3, '%': 6, ẉ: 12, k: 4, Ț: 2, n: 8, m: 4, ọ: 2 }, grass: 2 }),
    grounds: [MOOR_GROUND({ tx0: -4, tx1: 12, ty0: -4, ty1: 31 }), LEAF_GROUND({ tx0: 15, tx1: 31, ty0: -4, ty1: 31 })],
    ...moor({ tx0: 1, tx1: 12, ty0: 1, ty1: 26 }),
    boarArea: { tx0: 14, tx1: 26, ty0: 2, ty1: 25 },
    ...HERONS_F,
    tools: ['net', 'lasso'],
  }),
};

export const EXPEDITION_LEVELS = {
  ...ASIA_LEVELS,
  ...FOREST_LEVELS,
  // Camp (provisorisch, zieht mit: nach jeder Map steht es weiter vorn): Zelt mit der Fortschritts-Tafel, Lagerfeuer,
  // das Auto (Jeep mit Anhänger: Expedition beenden) und der Wagen als 6 kleine Gitterkäfige (je ein Tier, siehe CAGES);
  // wer nicht mehr hineinpasst, wartet im Sammelgehege. Man kommt vor dem Zelt an, rechts daneben geht es weiter
  savanna_camp: map({
    name: tr('Savannen-Expedition', 'Savanna Expedition'),
    camp: true,
    car: { tx: 15.6, ty: 12, texture: 'car_zoo', frame: 0, scale: 1.1, arrive: { tx: 14, ty: 7 } }, // mit dem Auto: Ankunft vor dem Zelt
    map: { x: 62, y: 50, icon: 'lion' },
    unlockWith: 'savanna', // auf der Weltkarte erst, wenn die Savanne offen ist
    rows: campRows(),
    start: { tx: 14, ty: 7 }, // vor dem Zelteingang
    campfire: { tx: 12, ty: 9 },
    tent: { tx: 14, ty: 4 }, // Mitte des Zelts (3 × 3 Kacheln, fest)
    board: { tx: 16, ty: 17 }, // Fortschritts-Tafel in der südlichen Ecke
    enclosures: [
      ...CAGES.map(([tx, ty], i) => ({ id: `cage${i}`, name: tr('Käfig', 'Cage'), species: null, seed: { tx, ty }, cage: i })),
      { id: 'corral', name: tr('Sammelgehege', 'Holding pen'), species: null, seed: { tx: 4, ty: 14 }, corral: true },
      { id: 'cage4', name: tr('Käfig', 'Cage'), species: null, seed: { tx: 9, ty: 13 }, cage: 4, when: BIG_WAGON },
    ],
    // fünfter Käfig neben dem Sammelgehege, nur mit dem Bonus "Größerer Wagen"
    runPatches: [{ tx: 8, ty: 12, rows: ['_____', '!...!', '!...!', '!..o!', '_____'], when: BIG_WAGON }],
    cageAreas: [{ tx0: 1, ty0: 1, tx1: 11, ty1: 11 }, { tx0: 7, ty0: 11, tx1: 13, ty1: 17 }], // hier öffnet die Aktionstaste den Wagen
    cageCenter: { tx: 8, ty: 8 }, // Pfeil über dem untersten Käfig (vom Zelt aus im Bild; weiter oben sieht man ihn nicht)
    exits: [{ tx: 17, ty: 9, to: '@next', label: tr('Tiefer in die Savanne', 'Deeper into the savanna') }],
    spawn: { population: 0, weights: {} },
  }),

  // Dschungel-Camp: Lichtung, ringsum dichter Urwald; unten fließt ein Flussarm – dort liegen das Kanu (weiter, siehe
  // canoe) und das Wasserflugzeug (Expedition beenden). Käfige, Zelt, Tafel wie in der Savanne
  jungle_camp: jmap({
    name: tr('Dschungel-Expedition', 'Jungle Expedition'),
    camp: true,
    car: { tx: 16.4, ty: 18.1, texture: 'seaplane', frame: 0, scale: 1.2, bob: true, reach: 60, arrive: { tx: 14, ty: 7 } }, // rechts neben dem Steg: vom Ufer aus erreichbar
    map: { x: 30, y: 64, icon: 'macaw' },
    unlockWith: 'jungle',
    rows: jungleCampRows(),
    start: { tx: 14, ty: 7 },
    campfire: { tx: 12, ty: 9 },
    tent: { tx: 14, ty: 4 },
    board: { tx: 15, ty: 15 },
    canoe: { tx: 12.2, ty: 18.6, board: { tx: 13, ty: 18 } }, // Kanu links am Steg (rechts liegt das Wasserflugzeug); board: dort steht man zum Einsteigen
    enclosures: [
      ...CAGES.map(([tx, ty], i) => ({ id: `cage${i}`, name: tr('Käfig', 'Cage'), species: null, seed: { tx, ty }, cage: i })),
      { id: 'corral', name: tr('Sammelgehege', 'Holding pen'), species: null, seed: { tx: 4, ty: 14 }, corral: true },
      { id: 'cage4', name: tr('Käfig', 'Cage'), species: null, seed: { tx: 9, ty: 13 }, cage: 4, when: BIG_WAGON },
    ],
    runPatches: [{ tx: 8, ty: 12, rows: ['_____', '!...!', '!...!', '!..o!', '_____'], when: BIG_WAGON }],
    cageAreas: [{ tx0: 1, ty0: 1, tx1: 11, ty1: 11 }, { tx0: 7, ty0: 11, tx1: 12, ty1: 16 }],
    cageCenter: { tx: 8, ty: 8 },
    exits: [],
    campHint: tr('⛺ Willkommen im Dschungel-Camp! Unten am Steg liegt das Kanu – damit geht es tiefer in den Dschungel. Die Tafel zeigt deinen Weg.', '⛺ Welcome to the jungle camp! The canoe is down at the dock – it takes you deeper into the jungle. The board shows your route.'),
    spawn: { population: 0, weights: {} },
  }),

  // Urwaldriesen: dichter Wald aus großen Urwaldbäumen – oben schläft der Jaguar, Brüllaffen-Trupps sitzen in den Kronen
  jx_giants: jmap({
    name: tr('Urwaldriesen', 'Jungle Giants'),
    features: ['thicket'],
    rows: makeRows({ seed: 101, creeks: 2, mangroves: 8, palette: 'jungle', inlet: true, masses: 7, thickets: 4, scatter: { J: 50, k: 22, Ḣ: 8, ḟ: 6, n: 50, ľ: 30, f: 10, g: 3, r: 2 }, grass: 7 }),
    ...EDGE_J,
    tools: ['net', 'lasso', 'banana'],
  }),

  // Dickicht: viele Dickicht-Inseln; Schlangen und Vogelspinnen verstecken sich darin – wo eine sitzt, raschelt es
  // (siehe expRustle in GardenScene); freischlagen, dann fängt man sie mit dem Kescher
  jx_thicket: jmap({
    name: tr('Dickicht', 'Thicket'),
    features: ['thicket'],
    rows: makeRows({ seed: 113, creeks: 1, mangroves: 5, palette: 'jungle', inlet: true, masses: 6, thickets: 9, scatter: { J: 26, k: 18, Ḣ: 7, ḟ: 5, n: 45, ľ: 28, f: 8, r: 2 }, grass: 6 }),
    ...EDGE_J,
    tools: ['net', 'lasso'],
  }),

  // Wasserfall: oben links die Felskante mit Wasserfall und Becken (wie im offenen Dschungel); wenn die Sonne kommt,
  // sonnen sich dort Leguane (versteckt in Farn und Pflanzen, siehe WaterfallSun.js); Brüllaffen in den Kronen
  jx_waterfall: jmap({
    name: tr('Wasserfall', 'Waterfall'),
    features: ['waterfall'],
    rows: makeRows({
      seed: 127,
      palette: 'jungle',
      inlet: true,
      stamp: WATERFALL_STAMP,
      ponds: [[20, 21, 3.5, 2]], // Teich unten
      shoreTrees: 3,
      creeks: 1,
      mangroves: 7,
      masses: 6,
      thickets: 2,
      scatter: { J: 28, k: 18, Ḣ: 7, ḟ: 6, n: 44, ľ: 28, f: 10, r: 2 },
      grass: 6,
    }),
    ...EDGE_J,
    tools: ['net', 'lasso', 'banana'],
    flow: { ...JUNGLE.flow, except: { tx0: 0, ty0: 0, tx1: 9, ty1: 7 } }, // das Becken am Wasserfall bleibt blau
    waterfallSun: WATERFALL_SUN, // Sonne am Wasserfall: dort verstecken sich die Leguane
  }),

  // Ameisenbär-Lichtung: offene Lichtung mit Farnen, unten ein Teich; am Rand schläft ein Jaguar in einem Urwaldbaum
  jx_clearing: jmap({
    name: tr('Teich-Lichtung', 'Pond Clearing'),
    features: ['clearing'],
    rows: makeRows({ seed: 139, creeks: 1, mangroves: 7, palette: 'jungle', inlet: true, ponds: [[18, 21, 4, 2.4], [6, 5, 2, 1.3]], shoreTrees: 3, masses: 5, thickets: 2, clearing: CLEARING_B, scatter: { J: 26, k: 16, r: 4, Ḣ: 6, ḟ: 5, n: 46, ľ: 30, f: 12, g: 6 }, grass: 8 }),
    ...EDGE_J,
    tools: ['net', 'lasso', 'banana'],
    gorillas: { ...CLEARING_B, count: 2 }, // Lichtung der Gorillas (siehe Gorilla.js)
  }),

  // Piranha-Fluss (Starkregen): man kommt mit dem Kanu über den Fluss, der quer durch die Map fließt – Piranha-Schwärme
  // (mit der Angel), Tukane in den Uferbäumen auf beiden Seiten; fangen im Tiefflug über dem Wasser, am besten vom Kanu aus
  jx_river: jmap({
    name: tr('Breiter Fluss', 'Wide River'),
    features: ['river'],
    rows: makeRows({ seed: 151, creeks: 1, mangroves: 9, palette: 'jungle', riverInlet: RIVER_J, exitY: 6, docks: [[15, 's'], [22, 'n']], shoreTrees: 8, masses: 6, thickets: 2, scatter: { J: 18, k: 22, Ḣ: 7, ḟ: 5, n: 42, ľ: 26, f: 8, r: 2 }, grass: 6 }),
    ...EDGE_JR,
    tools: ['rod', 'net', 'banana'],
  }),

  // Ara-Fluss: wie der Piranha-Fluss, aber bei Sonne – Ara-Paare in den Uferbäumen fliegen ab und zu ans andere Ufer, im
  // Tiefflug übers Wasser (mit dem Kescher vom Kanu aus); dazu ein Brüllaffen-Trupp
  jx_macaw: jmap({
    name: tr('Mangroven-Fluss', 'Mangrove River'),
    features: ['river'],
    rows: makeRows({ seed: 173, creeks: 1, mangroves: 9, palette: 'jungle', riverInlet: RIVER_J, exitY: 6, docks: [[14, 's'], [21, 'n']], shoreTrees: 8, masses: 6, thickets: 2, scatter: { J: 18, k: 22, Ḣ: 8, ḟ: 6, n: 42, ľ: 26, f: 10, g: 3 }, grass: 6 }),
    ...EDGE_JR,
    tools: ['net', 'lasso', 'banana'],
  }),

  // Nebellichtung (Nebel): in der Mitte eine Lichtung hinter Dickicht – dort leben die Gorillas (mit der Trommel rufen);
  // Brüllaffen in den Bäumen (im Nebel selten ein Gibbon)
  jx_fog: jmap({
    name: tr('Verborgene Lichtung', 'Hidden Clearing'),
    features: ['clearing'],
    rows: makeRows({ seed: 163, creeks: 1, mangroves: 6, palette: 'jungle', inlet: true, masses: 6, thickets: 2, clearing: CLEARING_A, scatter: { J: 32, k: 18, Ḣ: 7, ḟ: 5, n: 40, ľ: 26, f: 8, r: 2 }, grass: 6 }),
    ...EDGE_J,
    tools: ['drum', 'lasso', 'banana'],
    gorillas: { ...CLEARING_A, count: 2 }, // Lichtung der Gorillas (siehe Gorilla.js)
  }),

  // Felsenbecken: zweiter Wasserfall (Leguane), dazu viele Dickicht-Inseln (Schlangen, Vogelspinnen)
  jx_rockpool: jmap({
    name: tr('Felsenbecken', 'Rock Pool'),
    features: ['waterfall', 'thicket'],
    rows: makeRows({ seed: 211, palette: 'jungle', inlet: true, stamp: WATERFALL_STAMP, ponds: [[19, 20, 3, 1.8]], shoreTrees: 3, creeks: 1, mangroves: 6, masses: 5, thickets: 5, scatter: { J: 24, k: 18, Ḣ: 7, ḟ: 6, n: 44, ľ: 28, f: 10, r: 3 }, grass: 6 }),
    ...EDGE_J,
    tools: ['net', 'lasso'],
    flow: { ...JUNGLE.flow, except: { tx0: 0, ty0: 0, tx1: 9, ty1: 7 } },
    waterfallSun: WATERFALL_SUN,
  }),

  // Farnlichtung: dritte Lichtung (Gorillas), ringsum hohe Urwaldbäume
  jx_fernglade: jmap({
    name: tr('Farnlichtung', 'Fern Glade'),
    features: ['clearing'],
    rows: makeRows({ seed: 223, creeks: 2, mangroves: 7, palette: 'jungle', inlet: true, masses: 6, thickets: 2, clearing: CLEARING_C, scatter: { J: 34, k: 18, Ḣ: 7, ḟ: 9, n: 42, ľ: 26, f: 8, g: 3 }, grass: 6 }),
    ...EDGE_J,
    tools: ['net', 'lasso'],
    gorillas: { ...CLEARING_C, count: 2 },
  }),

  // Flussbiegung: dritter Fluss mit Kanu (Aras, Tukane, Piranhas), am Ufer ein paar Dickicht-Inseln
  jx_bend: jmap({
    name: tr('Flussbiegung', 'River Bend'),
    features: ['river', 'thicket'],
    rows: makeRows({ seed: 239, creeks: 1, mangroves: 8, palette: 'jungle', riverInlet: RIVER_J, exitY: 6, docks: [[13, 's'], [20, 'n']], shoreTrees: 8, masses: 5, thickets: 4, scatter: { J: 18, k: 20, Ḣ: 7, ḟ: 5, n: 42, ľ: 26, f: 8, r: 2 }, grass: 6 }),
    ...EDGE_JR,
    tools: ['net', 'lasso'],
  }),

  // Akazienhain: viele Akazien – Giraffen fressen an ihnen, Löwen dösen in ihrem Schatten
  sx_acacia: map({
    name: tr('Akazienhain', 'Acacia Grove'),
    features: ['water'],
    rows: eastExit(withPond([
      'AvvvRvvvvAvvvvvRvvvvAvvvvRvA',
      'v...y......A.....y.....A...v',
      'v..A....y......ƚƚ.........Ʋv',
      'v.......ƚƚ...........y.....v',
      'R..y...ƚƚƚ....A.......Ţ....v',
      'v............y.............R',
      'v.A....Ƙ...........A....y..v',
      'v..........y...............v',
      'v....A.........ƚƚ...Ʀ......v',
      'v.y..........ƚƚƚƚ..........v',
      'A.........A..........y..A..v',
      'v...ƚƚ..........y..........v',
      'v..ƚƚƚ...y..........A......v',
      'X######.......A.......y....A',
      'v.e...#...y............ƚƚ..v',
      'v.....#.............ƚƚƚ....v',
      'R...y.....A.....y..........v',
      'v..............Ƙ.......A...v',
      'v.A......y.................R',
      'v.......ƚƚ.....A....y......v',
      'v......ƚƚƚ..............y..v',
      'A...y..........ƚƚ....A.....v',
      'v.........A...ƚƚƚ..........v',
      'v..Ţ...............y...Ʀ...v',
      'v.......y.....A............A',
      'v..A...............y.......v',
      'v.........y.....A..........v',
      'AvvvRvvvvAvvvvRvvvvvAvvvRvvA',
    ], [9, 6, 2.5, 1.5]), 13), // Teich oben links
    start: { tx: 2, ty: 13 },
    tools: ['net', 'lasso', 'food'], // Werkzeugkiste am Weg in der Mitte (withRoute)
    exits: BACK(27, 13),
  }),

  // Wasserloch: ein großer Teich (Krokodile), ringsum trinken Zebras und Antilopen
  sx_waterhole: map({
    name: tr('Wasserloch', 'Waterhole'),
    features: ['water'],
    rows: eastExit([
      'AvvvRvvvvAvvvvvRvvvvAvvvvRvA',
      'v....y..........y.......A..v',
      'v..A......ƚƚ...........y...v',
      'v........ƚƚƚ......Ƙ........v',
      'R...y.................ƚƚ...v',
      'v.........................yR',
      'v.....Ƙ......y.....A.......v',
      'v..y......~~~~~............v',
      'v........~~~~~~~~...y......v',
      'v.......~~~~~~~~~~.........v',
      'A......~~~~~~~~~~~~....Ţ...v',
      'v......~~~~~~~~~~~~~.......v',
      'v..y...~~~~~~~~~~~~~...y...v',
      'X######.~~~~~~~~~~~~.......A',
      'v.e....#~~~~~~~~~~~........v',
      'v......#.~~~~~~~~~...ƚƚ....v',
      'R...y..#..~~~~~~~....ƚƚƚ...v',
      'v..........~~~~............v',
      'v.A..............y.....A...v',
      'v.......ƚƚ.................R',
      'v......ƚƚƚ.....Ƙ.....y.....v',
      'A...y......................v',
      'v.........A.......~~~......v',
      'v..Ţ.............~~~~~.....v',
      'v.......y.........~~~...y..A',
      'v..A......................yv',
      'v.........y.....A..........v',
      'AvvvRvvvvAvvvvRvvvvvAvvvRvvA',
    ], 13),
    start: { tx: 2, ty: 13 },
    tools: ['net', 'lasso', 'food'], // Werkzeugkiste am Weg in der Mitte (withRoute)
    exits: BACK(27, 13),
  }),

  // Elefantenfriedhof: eigener Ort, nur hier gibt es Hyänen (mit Knochen anlocken) und Geier (auf den kahlen Akazien).
  // Trockenzeit: dunkler Boden, Schädel und Knochen
  sx_graveyard: map({
    name: tr('Elefantenfriedhof', 'Elephant Graveyard'),
    features: ['graveyard', 'water'],
    rows: eastExit(withPond([
      'AvvvRvvvvAvvvvvRvvvvAvvvvRvA',
      'v....y..........y.......A..v',
      'v..A.......Ʋ...........y...v',
      'v........ƚƚ.......Ʋ........v',
      'R...y.........A.......Ʋ....v',
      'v.....Ʋ...................yR',
      'v..........Ʊ....Ș..........v',
      'v..y....A.......Ʊ....A.....v',
      'v.........Ʈ..........Ʋ.....v',
      'v.....Ʊ.......Ș.....Ʊ......v',
      'A..........ƭ...........y...v',
      'v....Ș.........Ʊ....Ʈ......v',
      'v..y......A..........ƭ.....v',
      'X######......Ș......Ʊ......A',
      'v.e...#...Ʊ.......A........v',
      'v.....#.......Ʈ......Ș.....v',
      'R...y.....Ʊ......Ʊ.........v',
      'v.........ƭ....Ș.......Ʋ...v',
      'v.A................y.......R',
      'v.......Ʋ.......Ʊ..........v',
      'v.............A.......y....v',
      'A...y.....Ʋ................v',
      'v...............ƚƚ...A.....v',
      'v..Ʋ.....A......ƚƚƚ........v',
      'v.......y..............y...A',
      'v..A.........Ʋ.............v',
      'v.........y.....A..........v',
      'AvvvRvvvvAvvvvRvvvvvAvvvRvvA',
    ], [5, 20, 2.2, 1.3]), 13), // kleines Wasserloch unten links
    start: { tx: 2, ty: 13 },
    tools: ['net', 'lasso', 'bone'], // Werkzeugkiste am Weg in der Mitte (withRoute)
    exits: BACK(27, 13),
    gravePatch: { key: 'savanna_grave_patch_soft', tx: 14, ty: 11 }, // weich auslaufend (das Original endet rechts am Kartenrand der Savanne)
    vultures: { every: [12, 25] },
    hyenas: { every: [15, 30], near: { tx: 14, ty: 13, r: 40 } },
  }),

  // --- weitere Maps (Zeilen aus makeRows: fester Zufall, also jedes Mal gleich) ---

  // Erdmännchen-Ebene: offene Ebene mit Erdmännchenbauten, dazwischen Antilopen
  sx_meerkats: map({
    name: tr('Weite Ebene', 'Wide Plain'),
    features: ['water'],
    rows: makeRows({ seed: 11, ponds: [[20, 20, 3, 1.8]], scatter: { u: 7, Ţ: 2, A: 5, Ʋ: 4, Ƙ: 3, y: 26 }, grass: 4 }),
    ...EDGE,
    tools: ['net', 'lasso', 'food'],
  }),

  // Termitensteppe: viele Termitenhügel, Zebras und Giraffen ziehen dazwischen umher
  sx_termites: map({
    name: tr('Termitensteppe', 'Termite Steppe'),
    features: ['water'],
    rows: makeRows({ seed: 23, ponds: [[8, 21, 3, 1.8]], scatter: { Ţ: 11, A: 7, Ƙ: 4, Ʋ: 2, y: 20 }, grass: 5 }),
    ...EDGE,
    tools: ['net', 'lasso', 'food'],
  }),

  // Gnu-Furt: ein Bach oben, unten links ein freier Streifen – dort zieht mit der Event-Karte die Große Wanderung vorbei
  sx_gnuford: map({
    name: tr('Gnu-Furt', 'Wildebeest Ford'),
    features: ['water'],
    rows: makeRows({ seed: 37, ponds: [[17, 5, 6, 2.2]], scatter: { A: 6, Ţ: 2, Ʋ: 3, Ƙ: 3, y: 18 }, grass: 3, keepFree: (x, y) => y - x >= 9 }),
    ...EDGE,
    tools: ['net', 'lasso', 'food'],
    // Große Wanderung (Event-Karte): Streifen ty − tx zwischen 13 und 19 (unten links), siehe animals/Gnu.js
    migration: { from: 13, to: 19 },
  }),

  // Überflutete Senke (Starkregen): zwei große Wasserflächen mit Nilpferden, Krokodilen und Lungenfischen
  sx_flood: map({
    name: tr('Überflutete Senke', 'Flooded Hollow'),
    features: ['water'],
    rows: makeRows({ seed: 41, ponds: [[9, 6, 5, 3], [18, 20, 6, 3.5]], scatter: { A: 5, Ƙ: 4, Ʋ: 2, y: 14 }, grass: 6 }),
    ...EDGE,
    tools: ['net', 'lasso', 'food'],
  }),

  // Reiher-Sumpf (Starkregen): viele kleine Tümpel – dort landen Schuhschnäbel, im größten liegt ein Nilpferd
  sx_swamp: map({
    name: tr('Tümpel-Sumpf', 'Pond Swamp'),
    features: ['water'],
    rows: makeRows({ seed: 53, ponds: [[7, 5, 3, 2], [19, 6, 3.5, 2.2], [8, 21, 3, 2], [20, 21, 4.5, 2.6], [14, 9, 2, 1.4]], scatter: { A: 4, Ƙ: 3, y: 14 }, grass: 8 }),
    ...EDGE,
    tools: ['net', 'lasso', 'food'],
    herons: { every: [5, 10], landChance: 1 },
  }),

  // Letztes Wasserloch (Trockenzeit): Schlamm ringsum, in der Mitte ein kleines Wasserloch; Zebras und Antilopen drängen
  // sich daran, Warzenschweine wühlen im Schlamm
  sx_lastwater: map({
    name: tr('Letztes Wasserloch', 'Last Waterhole'),
    features: ['water'],
    rows: makeRows({ seed: 67, muds: [[14, 20, 6, 3.5]], ponds: [[14, 20, 1.6, 1.1]], scatter: { A: 6, Ʋ: 3, Ƙ: 3, y: 16 }, grass: 3 }),
    ...EDGE,
    tools: ['net', 'lasso', 'food'],
    gatherAt: { tx: 14, ty: 20, r: 110 }, // dort drängen sich Zebras und Antilopen (wie in der Trockenzeit der Savanne)
  }),

  // Kahle Ebene: Felsen, kahle Akazien, Erdmännchenbauten und verstreute Knochen (zweiter Ort für Hyänen und Geier), ein
  // kleines Wasserloch
  sx_barren: map({
    name: tr('Kahle Ebene', 'Barren Plain'),
    features: ['graveyard', 'water'],
    rows: makeRows({ seed: 79, ponds: [[21, 6, 2.2, 1.4]], scatter: { Ʋ: 8, A: 5, u: 5, Ʀ: 1, Ƙ: 2, y: 18, Ʊ: 5, Ș: 3, Ʈ: 2, ƭ: 2 }, grass: 2 }),
    ...EDGE,
    tools: ['net', 'lasso', 'food'],
    vultures: { every: [12, 25] },
    hyenas: { every: [15, 30], near: { tx: 14, ty: 13, r: 40 } },
  }),
};

// alle Maps eines Bioms (ohne Camp)
export const expeditionMaps = (biome) => Object.entries(EXPEDITION_LEVELS).filter(([, l]) => l.expedition === biome && !l.camp).map(([id]) => id);
export const campOf = (biome) => Object.entries(EXPEDITION_LEVELS).find(([, l]) => l.expedition === biome && l.camp)?.[0] ?? null;
