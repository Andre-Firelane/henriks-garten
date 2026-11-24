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
import { shopDef, SHOPS, MAX_BOOTHS, boothCount, hasShop, orderBooth } from './shops.js';
import { FURNITURE_ART } from './furnitureArt.js';

// Deko-Teile: Zeichen in der Karte, Bild, Fußpunkt im Bild, fest (hitbox: nur der Kern) bzw. wiegt sich (sway), Name.
// big: große Deko (fest); beim Setzen prüft das Spiel, dass sie keinen Weg versperrt. pen: darf auch in Gehege (Natur).
// size: 2 = bedeckt 2×2 Kacheln (Pavillon); gespeichert wird die Kachel mit dem kleinsten tx/ty, die Szene zeichnet das Bild
// in der Mitte der Grundfläche (Fuß im Bild = Mitte der 2×2 Kacheln).
// cost: Preis im Katalog („Bestellen“ in der Bauen-Leiste); shop: steht von Anfang an im Katalog (andere erst, wenn man
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

// Möbel fürs Haupthaus (indoor: nur dort bestellbar und setzbar, die Deko oben nur draußen; Plan: docs/plan-haupthaus.md).
// style: Gruppe im Katalog (Büro und die Hütten-Stile der Welten); Bilder aus den Hütten (hut_<Teil>_<Stil>) und dem
// früheren Büro im Haupthaus. size 2: Sofa, Teppich, Regal, Bett bedecken 2×2 Kacheln.
export const FURNITURE_STYLES = [
  { id: 'trophies', name: tr('Trophäen zeigen', 'Show trophies') },
  { id: 'office', name: tr('Büro', 'Office') },
  { id: 'meadow', name: tr('Wiese', 'Meadow') },
  { id: 'forest', name: tr('Wald', 'Forest') },
  { id: 'savanna', name: tr('Savanne', 'Savanna') },
  { id: 'asia', name: tr('Bambuswald', 'Bamboo Forest') },
  { id: 'jungle', name: tr('Dschungel', 'Jungle') },
  { id: 'ice', name: tr('Eiswelt', 'Ice World') },
];
const FURNITURE_CHARS = [...'⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂⒃⒄⒅⒆⒇⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒱⒲⒳⒴⒵ⒶⒷⒸⒹⒺ'];
// Bilder aus tools/furniture-sprites.py (FURNITURE_ART: Grundfläche, Ansichten, Fußpunkt). showcase: so viele Trophäen
// passen darauf (Plätze je Ansicht in FURNITURE_ART); welche darauf stehen, steht an der gesetzten Deko (trophies: [Ids]).
// computer: dort startet man Events (wie früher am festen Hauptrechner)
const furniture = {
  trophy_plinth: { name: tr('Sockel', 'Plinth'), cost: 60, style: 'trophies', showcase: 1 },
  trophy_shelf: { name: tr('Wandregal', 'Wall shelf'), cost: 120, style: 'trophies', showcase: 4 },
  trophy_case: { name: tr('Vitrine', 'Display case'), cost: 150, style: 'trophies', showcase: 2 },
  computer_desk: { name: tr('Computer', 'Computer'), cost: 200, style: 'office', computer: true },
  office_sofa: { name: tr('Sofa', 'Sofa'), cost: 150, style: 'office' },
  office_armchair: { name: tr('Sessel', 'Armchair'), cost: 80, style: 'office' },
  office_table: { name: tr('Tisch', 'Table'), cost: 50, style: 'office' },
  office_chair: { name: tr('Bürostuhl', 'Office chair'), cost: 30, style: 'office' },
  office_rug: { name: tr('Teppich', 'Rug'), cost: 100, style: 'office', floor: true },
  office_monstera: { name: tr('Monstera', 'Monstera'), cost: 30, style: 'office' },
  office_strelitzia: { name: tr('Strelitzie', 'Bird of paradise'), cost: 30, style: 'office' },
};
for (const { id: style } of FURNITURE_STYLES.slice(2)) {
  furniture[`desk_${style}`] = { name: tr('Schreibtisch', 'Desk'), cost: 100, style };
  furniture[`chair_${style}`] = { name: tr('Stuhl', 'Chair'), cost: 30, style };
  furniture[`shelf_${style}`] = { name: tr('Regal', 'Shelf'), cost: 120, style };
  furniture[`plant_${style}`] = { name: tr('Pflanze', 'Plant'), cost: 20, style };
}
furniture.bed_savanna = { name: tr('Himmelbett', 'Canopy bed'), cost: 250, style: 'savanna' };
furniture.bed_jungle = { name: tr('Hängematte', 'Hammock'), cost: 250, style: 'jungle' };
furniture.bed_ice = { name: tr('Stockbett', 'Bunk bed'), cost: 300, style: 'ice' };
// große Stücke: Aquarium (Kopien der seltensten Angelfische schwimmen darin, siehe GardenScene.drawTankFish) und je Gebiet
// eins (Brunnen plätschert, der Ara ruft ab und zu)
furniture.aquarium = { name: tr('Aquarium', 'Aquarium'), cost: 400, style: 'office', tank: true };
furniture.stove_meadow = { name: tr('Kachelofen', 'Tiled stove'), cost: 350, style: 'meadow' };
furniture.fireplace_forest = { name: tr('Kamin', 'Fireplace'), cost: 400, style: 'forest' };
furniture.drums_savanna = { name: tr('Trommelecke', 'Drum corner'), cost: 300, style: 'savanna' };
furniture.fountain_asia = { name: tr('Zimmerbrunnen', 'Indoor fountain'), cost: 300, style: 'asia', splash: true };
furniture.tree_jungle = { name: tr('Baum mit Ara', 'Tree with macaw'), cost: 350, style: 'jungle', parrot: true };
furniture.igloo_ice = { name: tr('Iglu-Leseecke', 'Igloo reading nook'), cost: 400, style: 'ice' };
// Teppiche je Stil (liegen unten wie der Büro-Teppich; Bilder aus Sprites/Möbel/Teppiche.webp)
for (const style of ['meadow', 'forest', 'savanna', 'asia', 'ice']) furniture[`rug_${style}`] = { name: tr('Teppich', 'Rug'), cost: 100, style, floor: true };
Object.entries(furniture).forEach(([id, f], i) => {
  const art = FURNITURE_ART[id];
  const a = art.art[0];
  DECOR[id] = {
    ...f, char: FURNITURE_CHARS[i], indoor: true, shop: true, key: `fn_${id}_0`, originY: a.oy / a.h,
    solid: !f.floor, floor: !!f.floor, big: !f.floor, foot: art.size, views: art.views,
    hitbox: art.size[0] * art.size[1] === 1 ? 12 : undefined,
  };
});
// Ansicht einer gesetzten Deko (Möbel: 0–3, ältere Stände hatten flip); Möbel mit weniger Ansichten zählen reihum
export const decorRot = (d) => (DECOR[d.id]?.indoor ? (d.rot ?? (d.flip ? 1 : 0)) % (DECOR[d.id].views ?? 1) : 0);
// Grundfläche [entlang tx, entlang ty] in dieser Ansicht (bei 1 und 3 gedreht); draußen size × size
export function footprint(id, rot = 0) {
  const def = DECOR[id];
  if (!def?.foot) return [def?.size ?? 1, def?.size ?? 1];
  const [w, d] = def.foot;
  return rot % 2 ? [d, w] : [w, d];
}
// Bild eines Möbels in dieser Ansicht: Schlüssel, Größe, Fußpunkt (originX, originY), Trophäen-Plätze
export function furnitureLook(id, rot = 0) {
  const art = FURNITURE_ART[id];
  const a = art?.art[rot % art.art.length];
  if (!a) return null;
  const key = `fn_${id}_${rot % art.art.length}`;
  // front: vordere Ebene (Glas, Kanten) über Plaketten und Fischen; swim/anchor: Schwimmraum im Aquarium
  return { key, frontKey: a.front ? key + '_f' : null, originX: a.ox / a.w, originY: a.oy / a.h, slots: a.slots ?? [], swim: a.swim, anchor: a.anchor };
}
// Grundausstattung des Haupthauses (neue Spielstände): der Computer steht schon (Events), dazu 4 Möbel in der
// Bauen-Leiste zum selbst Aufstellen (beim ersten Besuch blinkt die Bauen-Taste)
const HOUSE_KIT = { office_sofa: 1, office_armchair: 1, office_table: 1, office_monstera: 1 };
// ältere Spielstände (vor dem Computer-Möbel): der Computer am Platz des früheren festen Hauptrechners, mit Bürostuhl
const HOUSE_COMPUTER = [
  { id: 'computer_desk', tx: 5, ty: 1, rot: 1 },
  { id: 'office_chair', tx: 6, ty: 2, rot: 3 },
];
// Mitte der gesetzten Computer im Haupthaus (Kachel, auch halbe): dort startet man Events
export const houseComputers = () =>
  (game.decor?.placed?.house ?? []).filter((d) => DECOR[d.id]?.computer).map((d) => {
    const [w, h] = footprint(d.id, decorRot(d));
    return { tx: d.tx + (w - 1) / 2, ty: d.ty + (h - 1) / 2 };
  });

// Teppiche im Haupthaus liegen immer ganz unten und belegen keine Kacheln: Möbel können darauf stehen, ein Teppich
// passt auch unter schon gesetzte Möbel (nur nicht zwei Teppiche übereinander). Bild-Schlüssel mit 'rug:' davor
export const isRug = (id) => !!DECOR[id]?.indoor && !!DECOR[id]?.floor;
export const decorKey = (d) => (isRug(d.id) ? `rug:${d.tx},${d.ty}` : `${d.tx},${d.ty}`);
// weitere Kacheln eines großen Teils: fest (V), bei Bodenteilen (Teppich) begehbar
export const FLOOR_FILL = '⒰';
export const fillChar = (id) => (DECOR[id]?.floor ? FLOOR_FILL : 'V');

export const decorByChar = (c) => Object.keys(DECOR).find((id) => DECOR[id].char === c) ?? null;

// Grundausstattung: hat jeder Spielstand von Anfang an (auch ältere beim Laden)
const STARTER = { bench: 2, flowers_red: 2, flowers_yellow: 2, lantern: 3, bush: 2, tree: 1, stepping_stones: 6 };
export const newDecor = () => ({ owned: { ...STARTER }, shop: [], placed: {}, stones: true });

export function ensureDecor() {
  if (!game.decor?.owned) game.decor = newDecor();
  game.decor.placed ??= {};
  game.decor.shop ??= [];
  game.decor.toys ??= {};
  // Grundausstattung: ein Eisstand fürs Zentrum (liegt in der Bauen-Leiste; ältere Spielstände bekommen ihn einmal, wenn
  // dort noch keiner steht)
  if (!game.decor.starterBooth && game.builds) {
    game.decor.starterBooth = true;
    if (!hasShop('park', 'icecream') && boothCount('park') < MAX_BOOTHS) orderBooth('park', 'icecream');
  }
  // Haupthaus mit eigenem Raum: Computer aufgestellt, 4 Möbel in der Bauen-Leiste (Spielstände, die schon Startmöbel
  // haben – houseStart –, behalten ihre)
  if (!game.decor.houseStart) {
    game.decor.houseStart = true;
    game.decor.houseComputer = true;
    game.decor.placed.house = [...(game.decor.placed.house ?? []), { ...HOUSE_COMPUTER[0] }];
    for (const [id, n] of Object.entries(HOUSE_KIT)) giveDecor(id, n);
  }
  // der Hauptrechner ist ein Möbel geworden (2026-11-24): wer keinen hat, bekommt ihn mit Stuhl an den alten Platz;
  // Möbel mit flip (vorher gespiegelt) haben jetzt eine Ansicht (rot)
  if (!game.decor.houseComputer) {
    game.decor.houseComputer = true;
    const placed = (game.decor.placed.house ??= []);
    for (const d of placed) {
      if (DECOR[d.id]?.indoor && d.flip) d.rot = 1;
      if (DECOR[d.id]?.indoor) delete d.flip;
    }
    if (!placed.some((d) => DECOR[d.id]?.computer) && !game.decor.owned.computer_desk) placed.push(...HOUSE_COMPUTER.map((d) => ({ ...d })));
  }
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
    return def ? { char: 'V', key: def.stand, originY: def.originY ?? 100 / 128, scale: def.scale ?? 0.7, solid: true, hitbox: 16, big: true, name: def.name, booth: id.slice(6), kind: def.id, size: def.size } : null;
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

// Baupläne: Kisten bringen keine Deko, sondern ihren Bauplan – ab dann steht das Teil im Katalog (game.decor.shop).
// Ein Bauplan, den man schon hat (oder ein Teil, das ohnehin im Laden steht), kommt in keiner Kiste mehr.
export const hasBlueprint = (id) => !!DECOR[id]?.shop || ensureDecor().shop.includes(id);
// Baupläne der Buden, die es erst aus Kisten gibt (blueprint in shops.js) und die man noch nicht hat: 'stand:<Art>'
export const boothBlueprints = () => SHOPS.filter((d) => d.blueprint).map((d) => 'stand:' + d.id).filter((id) => !hasBlueprint(id));
// Baupläne für eine Kiste in dieser Welt: die besondere Deko und, in Welten ohne Expedition (noExpedition), ihre eigene
export const chestDecor = (world, noExpedition) => Object.keys(DECOR).filter((id) => (DECOR[id].special || (noExpedition && DECOR[id].world === world)) && !hasBlueprint(id));
// Abschlusskiste einer Expedition (nur, wenn es keine Glücksbringer mehr zu holen gibt): Baupläne der Deko ihrer Welt
export const finalChestDecor = (world) => Object.keys(DECOR).filter((id) => DECOR[id].world === world && !hasBlueprint(id));

// Bauplan gefunden (Kiste): das Teil steht ab jetzt im Katalog (Buden: 'stand:<Art>')
export function learnBlueprint(id) {
  if ((DECOR[id] || id.startsWith('stand:')) && !hasBlueprint(id)) ensureDecor().shop.push(id);
}

// Kacheln, die eine gesetzte Deko bedeckt (size 2: 2×2 ab tx/ty; Möbel: ihre Grundfläche in ihrer Ansicht)
export function decorTiles(d) {
  const [w, h] = footprint(d.id, decorRot(d));
  const out = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.push({ tx: d.tx + dx, ty: d.ty + dy });
  return out;
}

// Teile im Katalog (Reihenfolge nach Preis): die allgemeinen und alles, was man schon einmal gefunden hat; draußen nur
// Deko, im Haupthaus nur Möbel (indoor)
export const shopDecor = (indoor = false) => Object.keys(DECOR).filter((id) => !!DECOR[id].indoor === indoor && (DECOR[id].shop || ensureDecor().shop.includes(id))).sort((a, b) => DECOR[a].cost - DECOR[b].cost);

// in die Deko-Taste (bzw. aus ihr heraus)
export function giveDecor(id, n = 1) {
  const d = ensureDecor();
  d.owned[id] = (d.owned[id] ?? 0) + n;
  if (d.owned[id] <= 0) delete d.owned[id];
}
