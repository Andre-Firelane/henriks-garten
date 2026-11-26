// Freundschaft mit einzelnen Tieren im Tierpark (siehe docs/plan-freundschaft.md, Schritt 1: Benennen, Namensschild,
// Streicheln, Pause und Stufen). Je Tierart und Gehege kann ein Tier Henriks Freund sein; man benennt es an der Tafel
// des Gehegeschilds. Die Bindung hängt am Tier (feste Nummer uid), nicht am Gehege: wählt man ein anderes Tier, bleibt
// sie gespeichert und gilt wieder, wenn man das alte später erneut wählt.
//
// Im Spielstand:
//   game.friends: { 'pasture:sheep': 17 }                 benanntes Tier je Gehege und Tierart (uid)
//   game.bonds:   { 17: { name, species, points, pettedAt, fedAt, since, favorite, favoriteKnown } }
//   game.feedUnlocked: ['greens', 'acorns']                  Sorten im Futterhaus
//   game.nextAnimalId                                      nächste freie Nummer
import { game } from '../state.js';
import { tr } from '../i18n.js';

// Punkte, ab denen eine Stufe gilt (Stufe 1 bis 4). 1: Name über dem Tier; 2: kommt zum Zaun und läuft dort mit;
// 3: die Besucher kennen es (Herz mehr), goldenes Namensschild, Eintrag im Tierbuch; 4: kann der beste Freund werden und
// folgt Henrik dann durch seinen Tierpark-Abschnitt. Stufe 4 dauert doppelt so lange wie Stufe 3 (12 statt 6 Punkte).
// Bester Freund ist immer nur einer (bond.best): der erste auf Stufe 4, danach wechselt man ihn am Tier („mitnehmen“)
export const FRIEND_LEVELS = [0, 4, 10, 22];
export const BEST_LEVEL = 4;
export const GOLD_LEVEL = 3;
export const PET_POINTS = 1;
// Pause nach dem Streicheln (echte Zeit: läuft auch weiter, wenn das Spiel zu ist, und neu laden setzt sie nicht zurück)
export const PET_PAUSE = 5 * 60 * 1000;
// verschmust: Schmusen ist schnell gemacht und geht öfter (Ball und Bürste machen mehr Arbeit, bringen dafür Besucherherzen)
export const CUDDLE_PAUSE = 2 * 60 * 1000;

// Stufe eines Tierfreunds (bond aus game.bonds, oder seine Punkte)
export function friendLevel(bond) {
  const points = typeof bond === 'number' ? bond : bond?.points ?? 0;
  let level = 1;
  FRIEND_LEVELS.forEach((p, i) => points >= p && (level = i + 1));
  return level;
}

// der beste Freund (folgt Henrik), oder null
export const bestFriendBond = () => Object.values(game.bonds ?? {}).find((b) => b.best) ?? null;

// kann dieser Freund (Stufe 4) gerade zum besten Freund werden? (ist es noch nicht)
export const canBeBest = (bond) => !!bond && !bond.best && friendLevel(bond) >= BEST_LEVEL;

// zum besten Freund machen (der bisherige ist es dann nicht mehr)
export function makeBest(bond) {
  for (const b of Object.values(game.bonds ?? {})) b.best = false;
  bond.best = true;
}

// nach neuen Punkten: gibt es noch keinen besten Freund, wird der erste auf Stufe 4 es (gibt true zurück, wenn gerade)
export function claimBest(bond) {
  if (bond.best || bestFriendBond() || friendLevel(bond) < BEST_LEVEL) return false;
  bond.best = true;
  return true;
}

// Schlüssel für game.friends
export const friendKey = (enclosure, species) => `${enclosure.id}:${species}`;

export function ensureFriendState() {
  game.friends ??= {};
  game.bonds ??= {};
  game.nextAnimalId ??= 1;
  game.namings ??= Object.keys(game.bonds).length; // (ältere Spielstände: jeder bisherige Freund zählt als ein Benennen)
  for (const b of Object.values(game.bonds)) b.trait ??= 'cuddly'; // (ältere Tierfreunde: verschmust, wie bisher)
  // (ältere Spielstände: hat schon ein Tier genug Punkte für Stufe 4, wird das mit den meisten der beste Freund)
  if (!bestFriendBond()) {
    const top = Object.values(game.bonds).sort((p, q) => q.points - p.points)[0];
    if (top) claimBest(top);
  }
}

// Benennen: das erste Mal ist frei, danach kostet jedes Benennen (neuer Freund oder neuer Name) NAME_STEP Herzen mehr
export const NAME_STEP = 10;
export function nameCost() {
  ensureFriendState();
  return game.namings * NAME_STEP;
}

// feste Nummer eines Tiers (bekommt es erst, wenn man es braucht: beim Benennen)
export function animalUid(a) {
  ensureFriendState();
  a.uid ??= game.nextAnimalId++;
  return a.uid;
}

export const bondOf = (a) => (a?.uid != null ? game.bonds?.[a.uid] ?? null : null);

// Ist dieses Tier gerade der Freund in seinem Gehege?
// ist dieses Tier (feste Nummer) irgendwo Henriks Freund? (für gespeicherte Tiere ohne Gehege, z. B. im Aquarium)
export const isFriendUid = (uid) => uid != null && Object.values(game.friends ?? {}).includes(uid);

export function isFriend(a) {
  return a?.uid != null && !!a.enclosure && game.friends?.[friendKey(a.enclosure, a.species)] === a.uid && !!game.bonds?.[a.uid];
}

export function canPet(bond, now = Date.now()) {
  return now - (bond.pettedAt ?? 0) >= ((bond.trait ?? 'cuddly') === 'cuddly' ? CUDDLE_PAUSE : PET_PAUSE);
}

// ---- Eigenschaften (siehe docs/plan-eigenschaften.md) ----
// Jedes Tier im Tierpark hat eine: sie bestimmt, was es als Tierfreund außer Futter möchte. Verschmust: streicheln,
// verspielt: Ball, eitel: bürsten (Bürste hängt am Futterautomaten), verfressen: nur Futter, das bringt dafür mehr Punkte.
// icon: Bild auf der Tafel und in der Bedürfnis-Blase
export const TRAITS = {
  cuddly: { icon: 'hand', name: tr('verschmust', 'cuddly') },
  playful: { icon: 'ball', name: tr('verspielt', 'playful') },
  vain: { icon: 'brush', name: tr('eitel', 'vain') },
  greedy: { icon: 'parkfood', name: tr('verfressen', 'greedy') }, // Futterbeutel
};
export const TRAIT_IDS = Object.keys(TRAITS);
// verfressen: nur füttern, dafür so viele Punkte wie sonst Futter und Streicheln zusammen
export const GREEDY_FEED_POINTS = 2;
export const GREEDY_FAVORITE_POINTS = 4;

// Eigenschaften, die diese Art haben kann (ohne Futter, z. B. Erdmännchen: nie verfressen)
export const traitsFor = (species) => TRAIT_IDS.filter((t) => t !== 'greedy' || (SPECIES_FOOD[species] ?? []).length > 0);

// Eigenschaft eines Tiers: einmal zufällig, dann bleibt sie (steht am Tier im Spielstand). Ein Tierfreund hat die seiner
// Bindung (ältere Freunde: verschmust)
export function traitOf(a) {
  const bond = bondOf(a);
  if (bond?.trait) return (a.trait = bond.trait);
  if (!a.trait || !traitsFor(a.species).includes(a.trait)) {
    const list = traitsFor(a.species);
    a.trait = list[Math.floor(Math.random() * list.length)];
  }
  return a.trait;
}

export const traitOfBond = (bond) => bond?.trait ?? 'cuddly';
export const isGreedy = (bond) => traitOfBond(bond) === 'greedy';
// Streicheln, Ball bzw. Bürsten geht gerade (verfressene wollen das nie)
export const canCare = (bond, now = Date.now()) => !isGreedy(bond) && canPet(bond, now);
// Punkte fürs Füttern (passend bzw. Lieblingsfutter)
export const feedPoints = (bond, favorite) => (isGreedy(bond) ? (favorite ? GREEDY_FAVORITE_POINTS : GREEDY_FEED_POINTS) : favorite ? FAVORITE_POINTS : FEED_POINTS);

// Tierbuch: welche Eigenschaften man bei dieser Art schon als Tierfreund hatte
export const traitsBefriended = (species) => new Set(Object.values(game.bonds ?? {}).filter((b) => b.species === species).map(traitOfBond));

// Namen für den Würfel: je Sprache eine Liste, dazu ein paar passende je Tierart
const NAMES = tr(
  ['Lotta', 'Bruno', 'Fiete', 'Mia', 'Kalle', 'Smilla', 'Paul', 'Emmi', 'Juri', 'Lilli', 'Oskar', 'Frieda', 'Momo', 'Pünktchen', 'Wuschel', 'Krümel', 'Hugo', 'Ella', 'Theo', 'Nala', 'Rudi', 'Polly', 'Socke', 'Kiki', 'Benni', 'Luna', 'Pepe', 'Tilda', 'Fips', 'Mats', 'Ida', 'Karlchen', 'Motte', 'Bommel', 'Lucky', 'Zora'],
  ['Lottie', 'Bruno', 'Finn', 'Mia', 'Charlie', 'Daisy', 'Paul', 'Emmy', 'Jules', 'Lily', 'Oscar', 'Freddie', 'Momo', 'Dotty', 'Fluffy', 'Cookie', 'Hugo', 'Ella', 'Theo', 'Nala', 'Rudy', 'Polly', 'Socks', 'Kiki', 'Benny', 'Luna', 'Pepe', 'Tilly', 'Pip', 'Max', 'Ivy', 'Biscuit', 'Moth', 'Bobble', 'Lucky', 'Zara'],
);
const SPECIES_NAMES = {
  sheep: tr(['Wolke', 'Flocke', 'Lämmchen'], ['Cloud', 'Snowflake', 'Woolly']),
  cow: tr(['Berta', 'Liesel', 'Milka'], ['Bertha', 'Buttercup', 'Moo']),
  pig: tr(['Rosalie', 'Schnuffel', 'Trüffel'], ['Rosie', 'Snuffles', 'Truffle']),
  goat: tr(['Meckie', 'Heidi', 'Zicke'], ['Billy', 'Heidi', 'Clover']),
  cat: tr(['Mieze', 'Tiger', 'Schnurri'], ['Kitty', 'Tiger', 'Purrcy']),
  wolf: tr(['Luna', 'Akela', 'Grauwind'], ['Luna', 'Akela', 'Greywind']),
  panda: tr(['Bao', 'Mei', 'Bambus'], ['Bao', 'Mei', 'Bamboo']),
  lion: tr(['Simba', 'Leo', 'Mähne'], ['Leo', 'Sunny', 'Mane']),
  giraffe: tr(['Hals', 'Lilo', 'Fleckchen'], ['Stretch', 'Lilo', 'Patch']),
  fox: tr(['Rotfell', 'Flinki'], ['Rusty', 'Swifty']),
  hedgehog: tr(['Stachel', 'Igor'], ['Spike', 'Prickles']),
  flamingo: tr(['Rosa', 'Flamme'], ['Pinky', 'Flame']),
};

// zufälliger Name, der in diesem Spiel noch nicht vergeben ist (und nicht der gerade angezeigte)
export function randomName(species, current = '') {
  const used = new Set(Object.values(game.bonds ?? {}).map((b) => b.name));
  const pool = [...(SPECIES_NAMES[species] ?? []), ...NAMES].filter((n) => n !== current);
  const free = pool.filter((n) => !used.has(n));
  const list = free.length ? free : pool;
  return list[Math.floor(Math.random() * list.length)];
}

// Herzen der Bindung als Text (eins je Stufe)
export const levelHearts = (level) => '♥'.repeat(level);

// Was die neue Stufe bringt (Meldung beim Aufstieg)
export function levelText(name, level) {
  return [
    null,
    null,
    tr(`${name} kommt jetzt zum Zaun, wenn du in der Nähe bist, und läuft dir dort hinterher.`, `${name} now comes to the fence when you are nearby and follows you along it.`),
    tr(`Die Besucher kennen ${name} jetzt und freuen sich besonders. Dazu gibt es ein goldenes Namensschild und einen Eintrag im Tierbuch.`, `The visitors know ${name} now and are extra happy. Plus a golden name tag and an entry in the animal book.`),
    tr(`${name} kann jetzt dein bester Freund werden und folgt dir dann überall in diesem Teil des Tierparks. Bester Freund ist immer nur einer, du kannst ihn am Tier wechseln.`, `${name} can now become your best friend and will then follow you everywhere in this part of the zoo. There is only one best friend at a time; you can switch at the animal.`),
  ][level];
}

// ---- Schritt 2: Futterhaus und Lieblingsfutter ----

// Futter aus dem Futterhaus (am Futterautomaten im Tierpark). tool: das Werkzeug draußen, mit dem man die Sorte kennenlernt
// (erst danach liegt sie im Futterhaus); image: Bild (wie das Werkzeug)
export const FEED_SORTS = {
  greens: { tool: 'food', image: 'food', name: tr('Grünfutter', 'Leafy greens') },
  leaves: { tool: 'leaves', image: 'leaf_branch', name: tr('Blätterzweig', 'Leafy branch') },
  acorns: { tool: 'acorns', image: 'acorns', name: tr('Eicheln', 'Acorns') },
  banana: { tool: 'banana', image: 'banana', name: tr('Bananen', 'Bananas') },
  bone: { tool: 'bone', image: 'bone', name: tr('Knochen', 'Bones') },
  herring: { tool: 'herring', image: 'herring', name: tr('Fisch', 'Fish') },
  fishfood: { tool: 'koifood', image: 'koifood', name: tr('Fischfutter', 'Fish food') },
};
// dieselben Sorten auch draußen schon kennengelernt: so viele Tiere bringen eine Sorte ins Futterhaus (für ältere Spielstände)
const SORT_FROM_CAUGHT = { greens: ['giraffe', 'panda'], leaves: ['tapir', 'okapi'], acorns: ['hedgehog', 'boar'], banana: ['howler'], bone: ['hyena'], herring: ['seal'], fishfood: ['koi'] };

// was jede Tierart frisst (2–3 Sorten; eine davon wird beim Benennen zufällig ihr Lieblingsfutter). Fehlt eine Art, kann
// man ihren Freund nur streicheln
export const SPECIES_FOOD = {
  sheep: ['greens', 'leaves'], cow: ['greens', 'leaves'], goat: ['greens', 'leaves'], pig: ['acorns', 'banana', 'greens'],
  cat: ['herring'], deer: ['greens', 'acorns', 'leaves'], elk: ['leaves', 'greens'], boar: ['acorns', 'banana'],
  hedgehog: ['acorns'], fox: ['bone', 'herring'], beaver: ['leaves', 'greens'], wolf: ['bone', 'herring'], squirrel: ['acorns'],
  frog: ['fishfood'], dartfrog: ['fishfood'], fish: ['fishfood'], koi: ['fishfood'], heron: ['herring', 'fishfood'], flamingo: ['fishfood'],
  lion: ['bone'], tiger: ['bone'], jaguar: ['bone', 'herring'], snowleopard: ['bone'], hyena: ['bone'], vulture: ['bone'],
  crocodile: ['herring', 'bone'], hippo: ['greens', 'leaves'], giraffe: ['leaves', 'greens'], zebra: ['greens'],
  antelope: ['greens', 'leaves'], gnu: ['greens'], warthog: ['greens', 'acorns'], panda: ['greens', 'leaves'],
  redpanda: ['leaves', 'banana'], tanuki: ['acorns', 'banana', 'herring'], yak: ['greens', 'leaves'],
  macaque: ['banana', 'acorns'], howler: ['banana', 'leaves'], orangutan: ['banana', 'leaves'], gorilla: ['banana', 'leaves'],
  macaw: ['banana'], toucan: ['banana'], tapir: ['leaves', 'banana', 'greens'], okapi: ['leaves', 'greens'],
  penguin: ['herring'], seal: ['herring'], walrus: ['herring'], polarbear: ['herring', 'bone'], puffin: ['herring'],
  arcticfox: ['bone', 'herring'], arcticwolf: ['bone', 'herring'], snowowl: ['bone'], snowhare: ['greens', 'leaves'],
  reindeer: ['greens', 'leaves'],
};
export const FEED_POINTS = 1;
export const FAVORITE_POINTS = 3;
export const FEED_PAUSE = PET_PAUSE;

export function canFeed(bond, now = Date.now()) {
  return now - (bond.fedAt ?? 0) >= FEED_PAUSE;
}

// Lieblingsfutter eines Tierfreunds (beim Benennen zufällig, ältere Freunde bekommen es beim ersten Bedarf)
export function favoriteOf(bond) {
  const list = SPECIES_FOOD[bond.species];
  if (!list) return null;
  if (!list.includes(bond.favorite)) bond.favorite = list[Math.floor(Math.random() * list.length)];
  return bond.favorite;
}

// Sorten im Futterhaus: erst, wenn man sie draußen einmal in der Hand hatte (game.feedUnlocked)
export function ensureFeedState(caught = []) {
  if (Array.isArray(game.feedUnlocked)) return;
  game.feedUnlocked = Object.keys(SORT_FROM_CAUGHT).filter((k) => SORT_FROM_CAUGHT[k].some((s) => caught.includes(s)));
}
export function unlockFeedFor(toolId) {
  const sort = Object.keys(FEED_SORTS).find((k) => FEED_SORTS[k].tool === toolId);
  if (!sort || game.feedUnlocked?.includes(sort)) return null;
  (game.feedUnlocked ??= []).push(sort);
  return sort;
}

// Sorten, die irgendein Tierfreund frisst (die anderen sind im Futterhaus ausgegraut)
export function wantedSorts() {
  const out = new Set();
  for (const uid of Object.values(game.friends ?? {})) for (const s of SPECIES_FOOD[game.bonds?.[uid]?.species] ?? []) out.add(s);
  return out;
}

// Fortschritt zur nächsten Stufe: { level, max, need (Punkte bis dahin), frac (0–1; auf der höchsten Stufe 1) }
export function levelProgress(bond) {
  const points = bond.points ?? 0;
  const level = friendLevel(bond);
  const max = FRIEND_LEVELS.length;
  if (level >= max) return { level, max, need: 0, frac: 1 };
  const from = FRIEND_LEVELS[level - 1];
  const to = FRIEND_LEVELS[level];
  return { level, max, need: to - points, frac: (points - from) / (to - from) };
}
