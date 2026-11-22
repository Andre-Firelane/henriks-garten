// Deko im Tierpark (Plan: docs/plan-deko.md). Man setzt sie selbst auf Rasen im Tierpark; eine gesetzte Deko ist ein eigenes
// Zeichen in der Karte (wie das Spielzeug der Gehege), so funktionieren Zeichnen, Verdecken und Kollision wie bei jedem Busch.
// Gespeichert in game.decor: { owned: { bench: 2 }, shop: [], placed: { park: [{ id, tx, ty }], park2: [], park3: [] },
// toys: { Gehege-Id: [{ id, tx, ty }] } }.
// Gehege gestalten: in gestaltbaren Gehegen (designablePen) darf Natur-Deko (pen: true) stehen, höchstens penDecorMax je
// Gehege; ihr Spielzeug lässt sich aufheben und umstellen. Aufgehobenes Spielzeug liegt als 'toy:<Spielzeug>' in der
// Deko-Taste und passt nur in Gehege, zu denen es gehört (PEN_TOYS), damit die Tiere es weiter benutzen.
import { tr } from '../i18n.js';
import { game } from '../state.js';
import { TOYS, PEN_TOYS, toyKey } from './toys.js';
import { shopDef } from './shops.js';

// Deko-Teile: Zeichen in der Karte, Bild, Fußpunkt im Bild, fest (hitbox: nur der Kern) bzw. wiegt sich (sway), Name.
// big: große Deko (fest); beim Setzen prüft das Spiel, dass sie keinen Weg versperrt. pen: darf auch in Gehege (Natur).
// size: 2 = bedeckt 2×2 Kacheln (Pavillon); gespeichert wird die Kachel mit dem kleinsten tx/ty, die Szene zeichnet das Bild
// in der Mitte der Grundfläche (Fuß im Bild = Mitte der 2×2 Kacheln).
// cost: Preis im Deko-Laden (Stand im Zentrum des Tierparks); shop: steht von Anfang an im Laden (andere erst, wenn man
// sie einmal aus einer Kiste oder von einer Expedition bekommen hat, siehe game.decor.shop).
export const DECOR = {
  bench: { char: '❶', key: 'meadow_bench', originY: 38 / 48, solid: true, hitbox: 10, big: true, name: tr('Bank', 'Bench'), cost: 15, shop: true },
  flowers_red: { char: '❷', key: 'flowers_red', originY: 22 / 32, solid: false, sway: 4, name: tr('Rote Blumen', 'Red flowers'), cost: 5, shop: true, pen: true },
  flowers_yellow: { char: '❸', key: 'flowers_yellow', originY: 22 / 32, solid: false, sway: 4, name: tr('Gelbe Blumen', 'Yellow flowers'), cost: 5, shop: true, pen: true },
  flowers_blue: { char: '❹', key: 'flowers_blue', originY: 22 / 32, solid: false, sway: 4, name: tr('Blaue Blumen', 'Blue flowers'), cost: 5, shop: true, pen: true },
  flowers_purple: { char: '❺', key: 'flowers_purple', originY: 22 / 32, solid: false, sway: 4, name: tr('Lila Blumen', 'Purple flowers'), cost: 5, shop: true, pen: true },
  flowers_white: { char: '❻', key: 'flowers_white', originY: 22 / 32, solid: false, sway: 4, name: tr('Weiße Blumen', 'White flowers'), cost: 5, shop: true, pen: true },
  lantern: { char: '❼', key: 'stone_lantern', originY: 58 / 64, solid: true, hitbox: 8, big: true, name: tr('Laterne', 'Lantern'), cost: 15, shop: true },
  // (Parklaterne, Hecke und goldener Brunnen: Platzhalter gibt es, vorerst nicht im Sortiment – Andre, 22.11.2026)
  stepping_stones: { char: '⓳', key: 'stepping_stones', originY: 16 / 32, solid: false, floor: true, name: tr('Wegsteine', 'Stepping stones'), cost: 5, shop: true, pen: true },
  bush: { char: '❽', key: 'bush', originY: 33 / 40, solid: true, hitbox: 4, big: true, name: tr('Busch', 'Bush'), cost: 10, shop: true, pen: true },
  tree: { char: '❾', key: 'tree', originY: 82 / 96, solid: true, hitbox: 12, big: true, name: tr('Baum', 'Tree'), cost: 25, shop: true, pen: true },
  cherry_tree: { char: '❿', key: 'cherry_tree', originY: 82 / 96, solid: true, hitbox: 10, big: true, name: tr('Kirschbaum', 'Cherry tree'), cost: 30, shop: true, pen: true },
  fountain: { char: '➀', key: 'fountain', originY: 64 / 80, solid: true, hitbox: 12, big: true, name: tr('Brunnen', 'Fountain'), cost: 50, shop: true },
  // besondere Deko: nur aus Kisten in der Wildnis (special), danach auch im Laden
  birdhouse: { char: '➁', key: 'birdhouse', originY: 58 / 64, solid: true, hitbox: 5, big: true, name: tr('Vogelhäuschen', 'Birdhouse'), cost: 20, pen: true, special: true },
  meadow_well: { char: '➂', key: 'meadow_well', originY: 72 / 88, solid: true, hitbox: 16, big: true, name: tr('Ziehbrunnen', 'Well'), cost: 40, special: true },
  beehive: { char: '➃', key: 'beehive', originY: 42 / 48, solid: true, hitbox: 8, big: true, name: tr('Bienenkorb', 'Beehive'), cost: 20, special: true },
  willow: { char: '➄', key: 'willow', originY: 100 / 112, solid: true, hitbox: 10, big: true, name: tr('Trauerweide', 'Weeping willow'), cost: 35, pen: true, special: true },
  flower_arch: { char: '⓵', key: 'flower_arch', originY: 86 / 98, solid: false, name: tr('Blumenbogen', 'Flower arch'), cost: 30, special: true },
  lantern_post: { char: '⓶', key: 'lantern_post', originY: 64 / 66, solid: true, hitbox: 5, big: true, name: tr('Lampionpfosten', 'Lantern post'), cost: 25, special: true },
  pavilion: { char: '⓸', key: 'pavilion', originY: 124 / 176, solid: true, big: true, size: 2, name: tr('Pavillon', 'Pavilion'), cost: 60, special: true },
  // Deko einer Welt (world): aus den Kisten der Welten ohne Expedition (Wiese, Eiswelt, Riff), danach auch im Laden
  sunflowers: { char: '➅', key: 'sunflowers', originY: 72 / 84, solid: false, sway: 7, name: tr('Sonnenblumen', 'Sunflowers'), cost: 8, pen: true, world: 'meadow' },
  pumpkins: { char: '➆', key: 'pumpkins', originY: 24 / 32, solid: false, name: tr('Kürbisse', 'Pumpkins'), cost: 8, pen: true, world: 'meadow' },
  scarecrow: { char: '➇', key: 'scarecrow', originY: 80 / 88, solid: true, hitbox: 6, big: true, name: tr('Vogelscheuche', 'Scarecrow'), cost: 20, world: 'meadow' },
  hay_bale: { char: '➈', key: 'hay_bale', originY: 34 / 40, solid: true, hitbox: 14, big: true, name: tr('Heuballen', 'Hay bale'), cost: 15, pen: true, world: 'meadow' },
  ice_block: { char: '➉', key: 'ice_block', originY: 46 / 56, solid: true, hitbox: 18, big: true, name: tr('Eisblock', 'Ice block'), cost: 20, pen: true, world: 'ice' },
  snowman: { char: '⓹', key: 'snowman', originY: 55 / 57, solid: true, hitbox: 8, big: true, name: tr('Schneemann', 'Snowman'), cost: 15, pen: true, world: 'ice' },
  ice_rock: { char: '➊', key: 'ice_rock', originY: 18 / 24, solid: true, hitbox: 12, big: true, name: tr('Eisstein', 'Ice rock'), cost: 10, pen: true, world: 'ice' },
  coral: { char: '➋', key: 'coral', originY: 52 / 64, solid: false, name: tr('Koralle', 'Coral'), cost: 12, pen: true, world: 'reef' },
  anchor: { char: '⓺', key: 'anchor', originY: 61 / 67, solid: true, hitbox: 8, big: true, name: tr('Anker', 'Anchor'), cost: 15, pen: true, world: 'reef' },
  starfish: { char: '➌', key: 'reef_starfish', originY: 36 / 48, solid: false, floor: true, name: tr('Seestern', 'Starfish'), cost: 8, pen: true, world: 'reef' },
  // Deko der Welten mit Expedition: aus der Abschlusskiste, wenn man alle Glücksbringer schon hat (expFinalChest)
  fern: { char: '➍', key: 'fern', originY: 24 / 32, solid: false, sway: 5, name: tr('Farn', 'Fern'), cost: 8, pen: true, world: 'forest' },
  toadstools: { char: '➎', key: 'forest_toadstools', originY: 22 / 40, solid: false, name: tr('Fliegenpilze', 'Toadstools'), cost: 8, pen: true, world: 'forest' },
  mossy_log: { char: '➏', key: 'forest_mossy_log', originY: 38 / 48, solid: true, hitbox: 14, big: true, name: tr('Moosstamm', 'Mossy log'), cost: 20, pen: true, world: 'forest' },
  boulder: { char: '➐', key: 'forest_boulder', originY: 47 / 56, solid: true, hitbox: 18, big: true, name: tr('Felsbrocken', 'Boulder'), cost: 20, pen: true, world: 'forest' },
  termite_hill: { char: '➑', key: 'savanna_termite', originY: 64 / 72, solid: true, hitbox: 9, big: true, name: tr('Termitenhügel', 'Termite mound'), cost: 15, pen: true, world: 'savanna' },
  acacia: { char: '➒', key: 'acacia', originY: 116 / 128, solid: true, hitbox: 12, big: true, name: tr('Akazie', 'Acacia'), cost: 35, pen: true, world: 'savanna' },
  bones: { char: '➓', key: 'savanna_bones', originY: 35 / 40, solid: false, name: tr('Knochen', 'Bones'), cost: 8, pen: true, world: 'savanna' },
  savanna_rock: { char: '⓫', key: 'savanna_rock0', originY: 49 / 56, solid: true, hitbox: 14, big: true, name: tr('Felsen', 'Rock'), cost: 12, pen: true, world: 'savanna' },
  bamboo: { char: '⓬', key: 'bamboo', originY: 118 / 128, solid: true, hitbox: 10, big: true, name: tr('Bambus', 'Bamboo'), cost: 15, pen: true, world: 'asia' },
  sun_rock: { char: '⓭', key: 'sun_rock', originY: 40 / 48, solid: true, hitbox: 20, big: true, name: tr('Sonnenstein', 'Sun rock'), cost: 15, pen: true, world: 'asia' },
  tall_grass: { char: '⓮', key: 'tall_grass', originY: 40 / 48, solid: false, name: tr('Hohes Gras', 'Tall grass'), cost: 8, pen: true, world: 'asia' },
  hibiscus: { char: '⓯', key: 'hibiscus', originY: 64 / 72, solid: true, hitbox: 8, big: true, name: tr('Hibiskus', 'Hibiscus'), cost: 15, pen: true, world: 'jungle' },
  heliconia: { char: '⓰', key: 'heliconia', originY: 88 / 96, solid: true, hitbox: 6, big: true, name: tr('Helikonie', 'Heliconia'), cost: 15, pen: true, world: 'jungle' },
  jungle_plant: { char: '⓱', key: 'jungle_plant', originY: 40 / 48, solid: false, name: tr('Blattpflanze', 'Leafy plant'), cost: 8, pen: true, world: 'jungle' },
};
export const decorByChar = (c) => Object.keys(DECOR).find((id) => DECOR[id].char === c) ?? null;

// Grundausstattung: hat jeder Spielstand von Anfang an (auch ältere beim Laden)
const STARTER = { bench: 2, flowers_red: 2, flowers_yellow: 2, lantern: 3, bush: 2, tree: 1, stepping_stones: 6 };
export const newDecor = () => ({ owned: { ...STARTER }, shop: [], placed: {}, stones: true });

export function ensureDecor() {
  if (!game.decor?.owned) game.decor = newDecor();
  game.decor.placed ??= {};
  game.decor.shop ??= [];
  game.decor.toys ??= {};
  // die Wegsteine kamen später zur Grundausstattung: ältere Spielstände bekommen sie einmal dazu
  if (!game.decor.stones) {
    game.decor.stones = true;
    game.decor.owned.stepping_stones = (game.decor.owned.stepping_stones ?? 0) + STARTER.stepping_stones;
  }
  return game.decor;
}

// Spielzeug in der Deko-Taste: 'toy:lookout'
export const isToy = (id) => typeof id === 'string' && id.startsWith('toy:');
// aufgehobene Bude in der Deko-Taste: 'booth:<Id>' (siehe storedBooths in shops.js)
export const isBooth = (id) => typeof id === 'string' && id.startsWith('booth:');
// Angaben eines Teils (Deko, Spielzeug oder Bude): char, key, originY, solid, hitbox, name (Bude: scale, booth)
export function itemDef(id) {
  if (isBooth(id)) {
    const def = shopDef(game.builds?.[id.slice(6)]);
    return def ? { char: 'V', key: def.stand, originY: 100 / 128, scale: 0.7, solid: true, hitbox: 16, big: true, name: def.name, booth: id.slice(6), kind: def.id } : null;
  }
  if (!isToy(id)) return DECOR[id] ?? null;
  const toy = id.slice(4);
  const t = TOYS[toy];
  return t ? { char: t.char, key: t.key ?? toyKey(toy), originY: t.originY, solid: t.solid, hitbox: t.hitbox, big: t.solid, name: t.name, toy } : null;
}

// Gehege, die man selbst gestalten darf: richtige Gehege mit Tieren, ohne Teiche, frei laufende Tiere, offene Bereiche
// (Wildpark, Safari, Streichelzoo: dort fahren Jeeps bzw. gehen Besucher hinein; der Wildpark erlaubt Deko wie draußen),
// Streichelgehege (Katzenhaus) und Gehege mit festen Spielzeug-Plätzen
export const designablePen = (e) => !!e && !!e.species && !e.open && !e.pond && !e.free && !e.petting && !e.toysAt;
// passt dieses Spielzeug in dieses Gehege?
export const toyFits = (e, id) => designablePen(e) && (PEN_TOYS[e.id] ?? []).includes(id.slice(4));
// so viel Deko (ohne Spielzeug) passt höchstens in ein Gehege: eine je 10 Kacheln, mindestens 2
export const penDecorMax = (e) => Math.max(2, Math.floor((e.tiles?.length ?? 0) / 10));

// gesetzte Deko in diesem Tierpark-Abschnitt
export const placedIn = (level) => ensureDecor().placed[level] ?? [];

// Baupläne: Kisten bringen keine Deko, sondern ihren Bauplan – ab dann steht das Teil im Deko-Laden (game.decor.shop).
// Ein Bauplan, den man schon hat (oder ein Teil, das ohnehin im Laden steht), kommt in keiner Kiste mehr.
export const hasBlueprint = (id) => !!DECOR[id]?.shop || ensureDecor().shop.includes(id);
// Baupläne für eine Kiste in dieser Welt: die besondere Deko und, in Welten ohne Expedition (noExpedition), ihre eigene
export const chestDecor = (world, noExpedition) => Object.keys(DECOR).filter((id) => (DECOR[id].special || (noExpedition && DECOR[id].world === world)) && !hasBlueprint(id));
// Abschlusskiste einer Expedition (nur, wenn es keine Glücksbringer mehr zu holen gibt): Baupläne der Deko ihrer Welt
export const finalChestDecor = (world) => Object.keys(DECOR).filter((id) => DECOR[id].world === world && !hasBlueprint(id));

// Bauplan gefunden (Kiste): das Teil steht ab jetzt im Laden
export function learnBlueprint(id) {
  if (DECOR[id] && !hasBlueprint(id)) ensureDecor().shop.push(id);
}

// Kacheln, die eine gesetzte Deko bedeckt (size 2: 2×2 ab tx/ty)
export function decorTiles(d) {
  const n = DECOR[d.id]?.size ?? 1;
  const out = [];
  for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) out.push({ tx: d.tx + dx, ty: d.ty + dy });
  return out;
}

// Teile im Deko-Laden (Reihenfolge nach Preis): die allgemeinen und alles, was man schon einmal gefunden hat
export const shopDecor = () => Object.keys(DECOR).filter((id) => DECOR[id].shop || ensureDecor().shop.includes(id)).sort((a, b) => DECOR[a].cost - DECOR[b].cost);

// in die Deko-Taste (bzw. aus ihr heraus)
export function giveDecor(id, n = 1) {
  const d = ensureDecor();
  d.owned[id] = (d.owned[id] ?? 0) + n;
  if (d.owned[id] <= 0) delete d.owned[id];
}
