// Feste Buden im Tierpark: auf freien Bauplätzen (buildSlots in levels.js) gegen Herzen gebaut. Besucher kaufen dort
// etwas (jede Sorte nur einmal, höchstens MAX_BUYS Sachen) und tragen es eine Weile in der Hand; jeder Kauf bringt Herzen.
// Gebaut ist, was in game.builds steht: { Bauplatz-Id: Buden-Art }.
// Buden (Umbau 22.11.2026, docs/plan-deko.md): man bestellt sie im Katalog der Bauen-Taste und setzt sie frei an einen Weg.
// game.booths: { Id: { level, tx, ty, flip } } bzw. { level, stored: true }, solange sie in der Bauen-Leiste liegt;
// game.builds: { Id: Buden-Art }. Höchstens MAX_BOOTHS je Parkabschnitt, jede Sorte einmal. Die früheren festen Bauplätze
// (legacySlots in levels.js) gibt es nicht mehr; dort gebaute Buden ziehen beim Laden nach game.booths um.
// blueprint: diese Bude gibt es erst mit Bauplan aus einer Kiste (game.decor.shop: 'stand:<Art>').
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { LEVELS, PARK_LEVELS } from './levels.js';

// stand/seller/items: Bilder (Bude, Verkäufer als 72×116-Bildstreifen, Snack in der Hand); icon für Statistik und Tafel
export const SHOPS = [
  { id: 'icecream', name: tr('Eisstand', 'Ice Cream Stand'), cost: 40, hearts: 2, icon: '🍦', stand: 'icecream_stand', seller: 'icecream_seller', items: ['icecream', 'icecream2', 'icecream3'] },
  { id: 'popcorn', name: tr('Popcorn', 'Popcorn'), cost: 80, hearts: 2, icon: '🍿', stand: 'popcorn_stand', seller: 'popcorn_seller', items: ['popcorn'] },
  { id: 'lemonade', name: tr('Limonade', 'Lemonade'), cost: 100, hearts: 2, icon: '🍋', stand: 'lemonade_stand', seller: 'lemonade_seller', items: ['lemonade'] },
  { id: 'cottoncandy', name: tr('Zuckerwatte', 'Cotton Candy'), cost: 120, hearts: 3, icon: '🍭', stand: 'cottoncandy_stand', seller: 'cottoncandy_seller', items: ['cottoncandy'], blueprint: true },
  { id: 'pretzel', name: tr('Brezeln', 'Pretzels'), cost: 150, hearts: 3, icon: '🥨', stand: 'pretzel_stand', seller: 'pretzel_seller', items: ['pretzel'], blueprint: true },
  // Marktstand (Andres Bild, tools/deco-stand.py): 2×2 Kacheln, ohne Verkäufer-Figur und ohne Snack in der Hand
  { id: 'souvenir', name: tr('Blumen & Andenken', 'Flowers & Souvenirs'), cost: 120, hearts: 3, icon: '🌸', stand: 'deco_stand', seller: null, items: [], size: 2, originY: 0.778, scale: 1 },
];
export const MAX_BOOTHS = 3; // so viele Buden höchstens je Parkabschnitt
export const shopDef = (id) => SHOPS.find((s) => s.id === id) ?? null;

// Riesenrad: ein eigener großer Bauplatz (wheelSlot in levels.js, nur im Zentrum). Besucher fahren eine Runde (Herzen),
// und es kommen mehr Besucher in den Abschnitt (WHEEL_VISITORS mehr als sonst)
export const WHEEL = { id: 'wheel', name: tr('Riesenrad', 'Ferris Wheel'), cost: 300, hearts: 3, icon: '🎡' };
export const WHEEL_VISITORS = 4;
export const RIDE_CHANCE = 0.35; // so wahrscheinlich will ein Besucher (einmal) mitfahren
export const AWAY_RIDES_PER_VISITOR_MINUTE = 0.15;
// Teehaus im Bambuswald (teaHouse in levels.js, fest gebaut): Besucher holen sich Tee und trinken ihn an einem Stehtisch
// (TEA_TIME Sekunden, die Tasse in der Hand), danach gibt es Herzen
export const TEA = { id: 'tea', name: tr('Teehaus', 'Tea House'), hearts: 3, icon: '🍵', items: ['tea_cup'] };
export const TEA_CHANCE = 0.35; // so wahrscheinlich geht ein Besucher (einmal) ins Teehaus
export const TEA_TIME = [9, 14];
// Herzen, die nicht von Tieren kommen (Buden, Teehaus und Riesenrad; für die Statistik und Mavis Besucher-Aufgabe)
export const SHOP_IDS = [...SHOPS.map((s) => s.id), TEA.id, WHEEL.id];
// Buden-Art, Teehaus oder Riesenrad (Name und Symbol für die Statistik)
export const sourceDef = (id) => shopDef(id) ?? (id === TEA.id ? TEA : id === WHEEL.id ? WHEEL : null);

// so viele Sachen kauft ein Besucher höchstens, und so wahrscheinlich geht er (beim Ankommen bzw. nach einem Gehege)
// zu einer Bude, deren Sorte er noch nicht hatte
export const MAX_BUYS = 2;
export const SHOP_CHANCE = 0.4;
// solange man woanders ist: so oft kauft jeder Besucher pro Minute an jeder Bude seines Abschnitts
export const AWAY_BUYS_PER_VISITOR_MINUTE = 0.25;

// aufgestellte Buden eines Tierpark-Abschnitts (in Kacheln des Abschnitts); size: 2 = 2×2 Kacheln ab tx/ty
export const slotsIn = (level) =>
  Object.entries(game.booths ?? {})
    .filter(([id, b]) => b.level === level && !b.stored && game.builds?.[id])
    .map(([id, b]) => ({ id, tx: b.tx, ty: b.ty, flip: b.flip, legacy: b.legacy, size: shopDef(game.builds[id])?.size ?? 1 }));
// Kacheln einer aufgestellten Bude
export function boothTiles(s) {
  const out = [];
  for (let dy = 0; dy < (s.size ?? 1); dy++) for (let dx = 0; dx < (s.size ?? 1); dx++) out.push({ tx: s.tx + dx, ty: s.ty + dy });
  return out;
}
// so viele Buden hat dieser Abschnitt (aufgestellte und die in der Leiste)
export const boothCount = (level) => slotsIn(level).length + storedBooths(level).length;
// Bauplan einer Bude (blueprint: erst aus einer Kiste)
export const boothKnown = (kind) => !shopDef(kind)?.blueprint || !!game.decor?.shop?.includes('stand:' + kind);
// Bude bestellen: liegt dann in der Bauen-Leiste dieses Abschnitts; gibt ihre Id zurück
export function orderBooth(level, kind) {
  game.booths ??= {};
  let n = 1;
  while (game.booths['booth' + n] || game.builds['booth' + n]) n++;
  const id = 'booth' + n;
  game.builds[id] = kind;
  game.booths[id] = { level, stored: true };
  return id;
}
// alte Spielstände: Buden auf den früheren festen Bauplätzen ziehen nach game.booths (sie bleiben, wo sie sind)
export function migrateLegacySlots() {
  game.booths ??= {};
  for (const level of PARK_LEVELS) {
    for (const s of LEVELS[level]?.legacySlots ?? []) {
      if (game.builds?.[s.id] && !game.booths[s.id]) game.booths[s.id] = { level, tx: s.tx, ty: s.ty, legacy: true };
    }
  }
}
// aufgehobene Buden dieses Abschnitts (liegen in der Deko-Taste): [{ id, kind }]
export const storedBooths = (level) => Object.entries(game.booths ?? {}).filter(([id, b]) => b.level === level && b.stored && builtOn(id)).map(([id]) => ({ id, kind: builtOn(id) }));

// Bude aufheben: in die Bauen-Leiste; gibt ihre Id zurück
export function pickUpBooth(level, slotId) {
  if (!builtOn(slotId)) return null;
  game.booths ??= {};
  game.booths[slotId] = { level, stored: true };
  return slotId;
}

// Bude an diese Kachel stellen
export function placeBooth(id, level, tx, ty, flip = false) {
  game.booths[id] = { level, tx, ty, ...(flip ? { flip: true } : {}) };
}
// alle Bauplätze mit ihrem Abschnitt
export const allSlots = () => PARK_LEVELS.flatMap((level) => slotsIn(level).map((s) => ({ ...s, level })));
// Buden-Art auf diesem Bauplatz (oder null)
export const builtOn = (slotId) => game.builds?.[slotId] ?? null;
// gebaute Buden eines Abschnitts: [{ slot, kind }]
export const shopsIn = (level) => slotsIn(level).filter((s) => builtOn(s.id)).map((slot) => ({ slot, kind: builtOn(slot.id) }));
// steht diese Sorte in diesem Abschnitt schon?
export const hasShop = (level, kind) => shopsIn(level).some((s) => s.kind === kind) || storedBooths(level).some((s) => s.kind === kind);
// Bauplatz des Riesenrads (mit seinem Abschnitt) bzw. ob es in diesem Abschnitt steht
export const wheelSlot = () => PARK_LEVELS.map((level) => LEVELS[level]?.wheelSlot && { ...LEVELS[level].wheelSlot, level }).find(Boolean) ?? null;
export const hasWheel = (level) => !!LEVELS[level]?.wheelSlot && builtOn(LEVELS[level].wheelSlot.id) === WHEEL.id;
// gibt es irgendwo einen festen Eisstand? (dann braucht es das Eiswagen-Event nicht mehr)
export const hasIceShop = () => Object.values(game.builds ?? {}).includes('icecream');
