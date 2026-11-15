// Feste Buden im Tierpark: auf freien Bauplätzen (buildSlots in levels.js) gegen Herzen gebaut. Besucher kaufen dort
// etwas (jede Sorte nur einmal, höchstens MAX_BUYS Sachen) und tragen es eine Weile in der Hand; jeder Kauf bringt Herzen.
// Gebaut ist, was in game.builds steht: { Bauplatz-Id: Buden-Art }.
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { LEVELS, PARK_LEVELS } from './levels.js';

// stand/seller/items: Bilder (Bude, Verkäufer als 72×116-Bildstreifen, Snack in der Hand); icon für Statistik und Tafel
export const SHOPS = [
  { id: 'icecream', name: tr('Eisstand', 'Ice Cream Stand'), cost: 40, hearts: 2, icon: '🍦', stand: 'icecream_stand', seller: 'icecream_seller', items: ['icecream', 'icecream2', 'icecream3'] },
  { id: 'popcorn', name: tr('Popcorn', 'Popcorn'), cost: 80, hearts: 2, icon: '🍿', stand: 'popcorn_stand', seller: 'popcorn_seller', items: ['popcorn'] },
  { id: 'lemonade', name: tr('Limonade', 'Lemonade'), cost: 100, hearts: 2, icon: '🍋', stand: 'lemonade_stand', seller: 'lemonade_seller', items: ['lemonade'] },
  { id: 'cottoncandy', name: tr('Zuckerwatte', 'Cotton Candy'), cost: 120, hearts: 3, icon: '🍭', stand: 'cottoncandy_stand', seller: 'cottoncandy_seller', items: ['cottoncandy'] },
  { id: 'pretzel', name: tr('Brezeln', 'Pretzels'), cost: 150, hearts: 3, icon: '🥨', stand: 'pretzel_stand', seller: 'pretzel_seller', items: ['pretzel'] },
];
export const shopDef = (id) => SHOPS.find((s) => s.id === id) ?? null;

// Riesenrad: ein eigener großer Bauplatz (wheelSlot in levels.js, nur im Zentrum). Besucher fahren eine Runde (Herzen),
// und es kommen mehr Besucher in den Abschnitt (WHEEL_VISITORS mehr als sonst)
export const WHEEL = { id: 'wheel', name: tr('Riesenrad', 'Ferris Wheel'), cost: 300, hearts: 3, icon: '🎡' };
export const WHEEL_VISITORS = 4;
export const RIDE_CHANCE = 0.35; // so wahrscheinlich will ein Besucher (einmal) mitfahren
export const AWAY_RIDES_PER_VISITOR_MINUTE = 0.15;
// Herzen, die nicht von Tieren kommen (Buden und Riesenrad; für die Statistik und Mavis Besucher-Aufgabe)
export const SHOP_IDS = [...SHOPS.map((s) => s.id), WHEEL.id];
// Buden-Art oder Riesenrad (Name und Symbol für die Statistik)
export const sourceDef = (id) => shopDef(id) ?? (id === WHEEL.id ? WHEEL : null);

// so viele Sachen kauft ein Besucher höchstens, und so wahrscheinlich geht er (beim Ankommen bzw. nach einem Gehege)
// zu einer Bude, deren Sorte er noch nicht hatte
export const MAX_BUYS = 2;
export const SHOP_CHANCE = 0.4;
// solange man woanders ist: so oft kauft jeder Besucher pro Minute an jeder Bude seines Abschnitts
export const AWAY_BUYS_PER_VISITOR_MINUTE = 0.25;

// Bauplätze eines Tierpark-Abschnitts (in Kacheln des Abschnitts)
export const slotsIn = (level) => LEVELS[level]?.buildSlots ?? [];
// alle Bauplätze mit ihrem Abschnitt
export const allSlots = () => PARK_LEVELS.flatMap((level) => slotsIn(level).map((s) => ({ ...s, level })));
// Buden-Art auf diesem Bauplatz (oder null)
export const builtOn = (slotId) => game.builds?.[slotId] ?? null;
// gebaute Buden eines Abschnitts: [{ slot, kind }]
export const shopsIn = (level) => slotsIn(level).filter((s) => builtOn(s.id)).map((slot) => ({ slot, kind: builtOn(slot.id) }));
// steht diese Sorte in diesem Abschnitt schon?
export const hasShop = (level, kind) => shopsIn(level).some((s) => s.kind === kind);
// Bauplatz des Riesenrads (mit seinem Abschnitt) bzw. ob es in diesem Abschnitt steht
export const wheelSlot = () => PARK_LEVELS.map((level) => LEVELS[level]?.wheelSlot && { ...LEVELS[level].wheelSlot, level }).find(Boolean) ?? null;
export const hasWheel = (level) => !!LEVELS[level]?.wheelSlot && builtOn(LEVELS[level].wheelSlot.id) === WHEEL.id;
// gibt es irgendwo einen festen Eisstand? (dann braucht es das Eiswagen-Event nicht mehr)
export const hasIceShop = () => Object.values(game.builds ?? {}).includes('icecream');
