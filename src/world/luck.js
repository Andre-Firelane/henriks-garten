// Kisten, Boni und Glücksbringer (leichte Roguelike-Elemente). In jeder Welt steht eine Kiste; hat man sie geöffnet,
// kommt nach 5 bis 10 Minuten (echte Uhr, je Gebiet) eine neue. In der Kiste wählt man 1 aus 3 Karten
// (mit dem Kleeblatt 4): ein garantiertes seltenes Tier, einen 5-Minuten-Bonus (gilt nur in diesem Gebiet) oder einen
// Glücksbringer. Gegen Herzen darf man neu würfeln. Glücksbringer bleiben, 2 kann man tragen (wechseln nur im Tierpark).
// Hier stehen nur Daten und Regeln; Kisten, Wirkungen und Anzeige siehe world/LuckWorld.js.
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { LEVEL, LEVEL_ID } from './map.js';

const MINUTE = 60 * 1000;

// Welten mit Kisten (nicht im Tierpark, im Aquarium und im Reptilienhaus)
export const CHEST_LEVELS = ['meadow', 'forest', 'savanna', 'asia', 'jungle', 'ice', 'reef'];
export const CHEST_RESPAWN = [5 * MINUTE, 10 * MINUTE]; // so lange, bis nach dem Öffnen neue Kisten stehen
export const CHEST_COUNT = 1; // Kisten je Welt

// Event, das zu einem Gebiet gehört (für den Bonus "Event-Ruf")
export const LEVEL_EVENT = { meadow: 'farm', forest: 'wolves', savanna: 'migration', asia: 'fireflies', reef: 'jellyfish' };

// Symbole der Boni und Glücksbringer: kleine Bilder (tools/charm-icons.py) als HTML; Handy und Tablet laden die
// WebP-Fassung (wie die Spielbilder, siehe webpUrl in scenes/BootScene.js)
const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
export const iconImg = (file) => `<img class="luck-img" src="assets/${COARSE ? `webp/${file}.webp` : `${file}.png`}" alt="" draggable="false">`;

// 5-Minuten-Boni (gelten nur im Gebiet der Kiste; available: kommt die Karte hier vor?)
// eigene Symbole je Bonus: public/assets/bonus_<id>.png (tools/bonus-icons.py)
export const BONI = {
  moreAnimals: { name: tr('Mehr Tiere', 'More Animals'), text: tr('Viel mehr wilde Tiere im Gebiet.', 'Lots more wild animals here.') },
  ride: { name: tr('Reittier', 'Mount'), text: tr('Du reitest – schneller unterwegs.', 'You ride – much faster.') },
  // nur in der Erkundung (offene Welten): in der Expedition sind die Maps klein und die Werkzeugkiste steht in der Mitte
  toolsEverywhere: { name: tr('Werkzeug überall', 'Tools Everywhere'), text: tr('Werkzeug wechseln, wo du willst (Q bzw. Werkzeug-Knopf).', 'Switch tools anywhere (Q or the tool button).'), available: () => !LEVEL?.expedition },
  stands: { name: tr('Hochstand', 'Lookout'), text: tr('Ein Hochstand bei der Kiste – von oben siehst du alles.', 'A lookout by the chest – see everything from above.'), available: (l) => l !== 'reef' && !LEVEL?.expedition },
  binoculars: { name: tr('Fernglas', 'Binoculars'), text: tr('Pfeile am Rand zeigen dir, wo die Tiere sind.', 'Arrows at the edge show you where the animals are.') },
  bigWagon: { name: tr('Größerer Wagen', 'Bigger Wagon'), text: tr('Ein Käfig mehr im Wagen.', 'One more cage in the wagon.'), available: () => !!LEVEL?.expedition }, // nur in der Expedition
  bigCatch: { name: tr('Großes Lasso', 'Big Lasso'), text: tr('Lasso und Kescher fangen viel größer – das Lasso 2 Tiere auf einmal.', 'Lasso and net catch much wider – the lasso 2 animals at once.') },
  // instant: wirkt sofort einmal (kein 5-Minuten-Bonus)
  heartRain: { name: tr('Herzregen', 'Heart Rain'), text: tr('Sofort 50 Herzen.', '50 hearts right away.'), instant: true }, // 50: HEART_RAIN
  eventCall: { name: tr('Event-Ruf', 'Event Call'), text: tr('Das Event dieses Gebiets startet sofort – gratis.', 'This area’s event starts right away – for free.'), available: (l) => !!LEVEL_EVENT[l], instant: true },
};
export const HEART_RAIN = 50; // so viele Herzen bringt der Herzregen (pauschal, unabhängig davon, wie lange man im Gebiet bleibt)
for (const [id, b] of Object.entries(BONI)) b.icon = iconImg(`bonus_${id}`);
const BONUS_MS = 5 * MINUTE;
const HOURGLASS_MS = 8 * MINUTE;
export const MORE_ANIMALS = 1.5; // so viel mehr wilde Tiere
export const BIG_CATCH = 1.6; // so viel größer fangen Lasso und Kescher

// Glücksbringer (dauerhaft, 2 gleichzeitig); Bild je Glücksbringer: charm_<id>.png
// scope: wirkt nur in der Erkundung (offene Welten) bzw. nur in der Expedition; ohne scope überall
export const CHARMS = {
  cheapReroll: { name: tr('Glückswürfel', 'Lucky Die'), text: tr('Neu würfeln in Kisten kostet nur die Hälfte.', 'Rerolling in chests costs only half.') },
  swift: { name: tr('Flinke Schuhe', 'Swift Shoes'), text: tr('Du läufst etwas schneller.', 'You walk a bit faster.') },
  rareLuck: { name: tr('Sternschnuppe', 'Shooting Star'), text: tr('Seltene Tiere kommen öfter.', 'Rare animals come more often.') },
  chestRadar: { name: tr('Kisten-Kompass', 'Chest Compass'), text: tr('Ein Pfeil am Rand zeigt zu Kisten in der Nähe.', 'An arrow at the edge points to nearby chests.'), scope: 'explore' },
  campfire: { name: tr('Lagerfeuer', 'Campfire'), text: tr('Setz dich ans Feuer: neue Tiere, in Savanne und Dschungel auch neues Wetter.', 'Sit by the fire: new animals, and new weather in the savanna and jungle.'), scope: 'explore' },
  longEvents: { name: tr('Festtags-Glocke', 'Festival Bell'), text: tr('Events dauern länger.', 'Events last longer.'), scope: 'explore' },
  clover: { name: tr('Kleeblatt', 'Clover'), text: tr('In Kisten 4 Karten statt 3.', '4 cards in chests instead of 3.') },
  hourglass: { name: tr('Sanduhr', 'Hourglass'), text: tr('Boni aus Kisten halten 8 statt 5 Minuten.', 'Chest bonuses last 8 instead of 5 minutes.'), scope: 'explore' },
  piggy: { name: tr('Sparschwein', 'Piggy Bank'), text: tr('Alles im Tierpark ist etwas billiger.', 'Everything in the zoo is a bit cheaper.') },
  // nur Expedition (Wirkung siehe world/expedition.js und catchAnimal in GardenScene)
  bigCage: { name: tr('Großer Käfig', 'Big Cage'), text: tr('Jeder Käfig im Wagen hat einen Platz mehr.', 'Every cage in the wagon has one more spot.'), scope: 'expedition' },
  bait: { name: tr('Köder', 'Bait'), text: tr('Auf jeder Map ein Tier mehr.', 'One more animal on every map.'), scope: 'expedition' },
  teddy: { name: tr('Stoffteddy', 'Teddy Bear'), text: tr('Jedes gefangene Tier bringt gleich Herzen – so viele wie im Naturreservat.', 'Every animal you catch brings hearts right away – as many as in the nature reserve.'), scope: 'expedition' },
};
export const CHARM_SCOPE = { explore: tr('nur Erkundung', 'exploring only'), expedition: tr('nur Expedition', 'expeditions only') };
for (const [id, c] of Object.entries(CHARMS)) c.icon = iconImg(`charm_${id}`);
export const CHARM_SLOTS = 2;
export const SWIFT_SPEED = 1.15;
export const RARE_LUCK = 1.5;
export const LONG_EVENTS = 1.5;
export const PIGGY = 0.85;
export const CAMPFIRE_COOLDOWN = 3 * MINUTE;

// Neu würfeln: 10, 20, 40 … Herzen (mit dem Glückswürfel die Hälfte), zählt je Kiste von vorn
const REROLL_BASE = 10;

// Seltenheit der Karte "seltenes Tier", nach dem Anteil der Art an den Tieren des Gebiets (Rahmenfarbe)
export const TIERS = {
  common: { color: '#5fae4a', name: tr('häufig', 'common') },
  uncommon: { color: '#4a8fd8', name: tr('selten', 'rare') },
  rare: { color: '#e0a820', name: tr('sehr selten', 'very rare') },
};
export const tierOf = (share) => (share >= 0.2 ? 'common' : share >= 0.08 ? 'uncommon' : 'rare');

// Anteil der Kartenarten je Platz
const CARD_KIND = { rare: 0.45, bonus: 0.4, charm: 0.15, deco: 0.3 };

export function luckState() {
  game.chests ??= {};
  game.charms ??= { owned: [], equipped: [] };
  return game;
}

// --- Glücksbringer ---
export const hasCharm = (id) => !!game.charms?.equipped?.includes(id);
export const ownsCharm = (id) => !!game.charms?.owned?.includes(id);
export const charmSpeed = () => (hasCharm('swift') ? SWIFT_SPEED : 1);
export const eventDuration = (ms) => (hasCharm('longEvents') ? Math.round(ms * LONG_EVENTS) : ms);
// Preis im Tierpark (Events, Ausbau, Buden): mit dem Sparschwein etwas billiger
export const price = (cost) => (hasCharm('piggy') ? Math.max(1, Math.round(cost * PIGGY)) : cost);
export const rerollCost = (n) => Math.max(1, Math.round((REROLL_BASE * 2 ** n) / (hasCharm('cheapReroll') ? 2 : 1)));
export const cardCount = () => (hasCharm('clover') ? 4 : 3);

export function giveCharm(id) {
  luckState();
  if (!game.charms.owned.includes(id)) game.charms.owned.push(id);
  // ein freier Platz: gleich anlegen (wechseln geht sonst nur im Tierpark)
  if (game.charms.equipped.length < CHARM_SLOTS && !game.charms.equipped.includes(id)) game.charms.equipped.push(id);
}

// anlegen bzw. ablegen; gibt false zurück, wenn beide Plätze belegt sind
export function toggleCharm(id) {
  luckState();
  const eq = game.charms.equipped;
  if (eq.includes(id)) {
    eq.splice(eq.indexOf(id), 1);
    return true;
  }
  if (!ownsCharm(id) || eq.length >= CHARM_SLOTS) return false;
  eq.push(id);
  return true;
}

// Glücksbringer auf Platz i legen (Ziehen und Ablegen in der Tafel). Lag er schon auf dem anderen Platz, tauschen die
// beiden; sonst wird der bisherige auf Platz i abgelegt.
export function setCharmSlot(i, id) {
  luckState();
  if (!ownsCharm(id)) return;
  const eq = game.charms.equipped;
  const from = eq.indexOf(id);
  if (from === i) return;
  if (i >= eq.length) {
    if (from >= 0) eq.splice(from, 1);
    eq.push(id);
    return;
  }
  const old = eq[i];
  eq[i] = id;
  if (from >= 0) eq[from] = old;
}

// Antippen: auf einen freien Platz, sonst statt des ersten
export function equipCharm(id) {
  luckState();
  const eq = game.charms.equipped;
  if (eq.includes(id) || !ownsCharm(id)) return;
  setCharmSlot(eq.length < CHARM_SLOTS ? eq.length : 0, id);
}

// --- Boni (in der Gegend der Kiste) ---
// Gegend: eine große Map und die kleinen Maps hinter ihren Durchgängen (sideMaps.js) – ein Bonus aus einer Kiste gilt
// überall dort, egal auf welcher dieser Maps die Kiste stand
export const regionId = () => (game.side?.map === LEVEL_ID ? game.side.parent : LEVEL_ID);
function levelBoni() {
  const b = game.levelBonus;
  return b && b.level === regionId() ? b.boni : {};
}
// Expedition (Camp und Maps): Boni gelten bis zum Ende des Runs (game.expedition.boni, siehe expedition.js); die Maps
// hinter einem Durchgang gehören nicht dazu, auch wenn sie aus dem Expeditions-Baukasten stammen
export const inExpedition = () => !!(game.expedition && LEVEL?.expedition && !LEVEL.side);
const runBoni = () => (inExpedition() ? game.expedition.boni : []);
export const bonusLeft = (id, now = Date.now()) => (runBoni().includes(id) ? Infinity : Math.max(0, (levelBoni()[id] ?? 0) - now));
export const bonusActive = (id, now = Date.now()) => bonusLeft(id, now) > 0;
// laufende Boni: [{ id, left }] (left: Infinity bei Boni bis zum Ende der Expedition)
export const activeBoni = (now = Date.now()) =>
  [...new Set([...runBoni(), ...Object.keys(levelBoni())])]
    .filter((id) => BONI[id]) // (ältere Spielstände: Boni, die es nicht mehr gibt, z. B. Hochstand, Werkzeug überall)
    .map((id) => ({ id, left: bonusLeft(id, now) }))
    .filter((b) => b.left > 0);

// Bonus starten; derselbe noch einmal stapelt nicht, die Zeit beginnt nur von vorn
export function startBonus(id, now = Date.now()) {
  if (inExpedition()) {
    if (!game.expedition.boni.includes(id)) game.expedition.boni.push(id);
    return;
  }
  if (game.levelBonus?.level !== regionId()) game.levelBonus = { level: regionId(), boni: {} };
  game.levelBonus.boni[id] = now + (hasCharm('hourglass') ? HOURGLASS_MS : BONUS_MS);
}

// beim Betreten eines Gebiets: Boni aus einer anderen Gegend sind vorbei
export function dropBoniElsewhere() {
  if (game.levelBonus && game.levelBonus.level !== regionId()) game.levelBonus = null;
}

// --- Kisten ---
export function chestState(level = LEVEL_ID) {
  luckState();
  return (game.chests[level] ??= { spots: [], readyAt: 0 });
}
export function chestOpened(level = LEVEL_ID, now = Date.now()) {
  const s = chestState(level);
  s.spots = [];
  s.readyAt = now + CHEST_RESPAWN[0] + Math.random() * (CHEST_RESPAWN[1] - CHEST_RESPAWN[0]);
}

// --- Karten ---
// rare: [{ species, skin, share }] (Arten des Gebiets mit seltenem Skin), boni/charms: ids, die hier in Frage kommen.
// deco: ids der Deko, deren Bauplan hier aus einer Kiste kommen kann (siehe chestDecor in decor.js).
// Gibt n Karten zurück, keine doppelt: { kind: 'rare', species, skin, tier } | { kind: 'bonus', id } | { kind: 'charm', id }
// | { kind: 'deco', id }
export function rollCards({ rare, boni, charms, deco = [] }, n) {
  const pools = { rare: [...rare], bonus: [...boni], charm: [...charms], deco: [...deco] };
  const cards = [];
  for (let i = 0; i < n; i++) {
    const kinds = Object.entries(CARD_KIND).filter(([k]) => pools[k].length);
    if (!kinds.length) break;
    let r = Math.random() * kinds.reduce((s, [, w]) => s + w, 0);
    const kind = (kinds.find(([, w]) => (r -= w) <= 0) ?? kinds[0])[0];
    const pool = pools[kind];
    let pick;
    if (kind === 'rare') {
      // je häufiger die Art im Gebiet, desto öfter ihre Karte (ein seltenes Schaf eher als eine seltene Katze)
      let q = Math.random() * pool.reduce((s, c) => s + c.share, 0);
      pick = pool.find((c) => (q -= c.share) <= 0) ?? pool[0];
      cards.push({ kind, species: pick.species, skin: pick.skin, tier: tierOf(pick.share) });
    } else {
      pick = pool[Math.floor(Math.random() * pool.length)];
      cards.push({ kind, id: pick });
    }
    pool.splice(pool.indexOf(pick), 1);
  }
  return cards;
}

// --- Lagerfeuer ---
export const campfireLeft = (now = Date.now()) => Math.max(0, (game.campfireAt ?? 0) + CAMPFIRE_COOLDOWN - now);
