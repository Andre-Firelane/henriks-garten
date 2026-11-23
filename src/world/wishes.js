// Besucherwünsche (siehe docs/plan-wuensche.md): Ab und zu wünscht sich ein Besucher im Tierpark ein Tier, das es dort
// noch nicht gibt. Über ihm schwebt eine Blase mit dem Tier und einem Herz; spricht Henrik ihn an, kommt der Wunsch als
// Wunschkarte unter Mavis Aufgabe (höchstens MAX_WISHES gleichzeitig). Ist das Tier in einem Gehege und kommt Henrik
// dort vorbei, läuft der Besucher herbei, freut sich und es gibt WISH_HEARTS Herzen. Manche wünschen sich eine seltene
// Variante einer Art, die schon im Tierpark lebt (skin, z. B. den Silberfuchs): das bringt RARE_WISH_HEARTS.
// Gespeichert in game.wishes: { open: [{ species, skin, look, done }] }. Herumlaufende Wunsch-Besucher, die noch nicht
// angesprochen wurden, werden nicht gespeichert.
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { animalIcon, hasAnimalIcon } from '../ui/icons.js';
import { skinInfo } from '../animals/Animal.js';

export const MAX_WISHES = 2; // höchstens so viele angenommene Wünsche gleichzeitig
export const WISH_HEARTS = 30; // Belohnung, wenn sich der Besucher am Gehege freut
export const RARE_WISH_HEARTS = 60; // ... bei einem Wunsch nach einer seltenen Variante
export const RARE_WISH_CHANCE = 0.3; // so oft ist ein neuer Wunsch eine seltene Variante (wenn eine in Frage kommt)
export const WISH_CHANCE = 0.2; // so oft ist ein neu ankommender Besucher ein Wunsch-Besucher
export const MAX_WISH_WALKERS = 2; // so viele Wunsch-Besucher (noch nicht angesprochen) laufen höchstens gleichzeitig herum
export const WISH_TALK_DIST = 46; // so nah muss Henrik sein, um ihn anzusprechen (Kachel-Proportionen, y doppelt)
export const THANK_DIST = 300; // so nah an einem Tier der gewünschten Art im Gehege, dann kommt der Besucher herbei

// Tierart im Satz: [Akkusativ, Nominativ] auf Deutsch, dazu Englisch
const WORDS = {
  sheep: ['ein Schaf', 'Ein Schaf', 'a sheep'],
  cow: ['eine Kuh', 'Eine Kuh', 'a cow'],
  pig: ['ein Schwein', 'Ein Schwein', 'a pig'],
  goat: ['eine Ziege', 'Eine Ziege', 'a goat'],
  cat: ['eine Katze', 'Eine Katze', 'a cat'],
  frog: ['einen Frosch', 'Ein Frosch', 'a frog'],
  fish: ['einen Fisch', 'Ein Fisch', 'a fish'],
  koi: ['einen Koi', 'Ein Koi', 'a koi'],
  reeffish: ['Riff-Fische', 'Riff-Fische', 'reef fish'],
  seahorse: ['ein Seepferdchen', 'Ein Seepferdchen', 'a seahorse'],
  octopus: ['einen Kraken', 'Ein Krake', 'an octopus'],
  butterfly: ['einen Schmetterling', 'Ein Schmetterling', 'a butterfly'],
  hippo: ['ein Nilpferd', 'Ein Nilpferd', 'a hippo'],
  tapir: ['einen Tapir', 'Ein Tapir', 'a tapir'],
  boar: ['ein Wildschwein', 'Ein Wildschwein', 'a wild boar'],
  hedgehog: ['einen Igel', 'Ein Igel', 'a hedgehog'],
  elk: ['einen Elch', 'Ein Elch', 'a moose'],
  okapi: ['ein Okapi', 'Ein Okapi', 'an okapi'],
  hyena: ['eine Hyäne', 'Eine Hyäne', 'a hyena'],
  warthog: ['ein Warzenschwein', 'Ein Warzenschwein', 'a warthog'],
  vulture: ['einen Geier', 'Ein Geier', 'a vulture'],
  snowleopard: ['einen Schneeleoparden', 'Ein Schneeleopard', 'a snow leopard'],
  yak: ['einen Yak', 'Ein Yak', 'a yak'],
  tanuki: ['einen Tanuki', 'Ein Tanuki', 'a tanuki'],
  redpanda: ['einen Roten Panda', 'Ein Roter Panda', 'a red panda'],
  gnu: ['ein Gnu', 'Ein Gnu', 'a wildebeest'],
  wolf: ['einen Wolf', 'Ein Wolf', 'a wolf'],
  jellyfish: ['eine Qualle', 'Eine Qualle', 'a jellyfish'],
  ray: ['einen Rochen', 'Ein Rochen', 'a ray'],
  turtle: ['eine Meeresschildkröte', 'Eine Meeresschildkröte', 'a sea turtle'],
  deer: ['ein Reh', 'Ein Reh', 'a deer'],
  beaver: ['einen Biber', 'Ein Biber', 'a beaver'],
  fox: ['einen Fuchs', 'Ein Fuchs', 'a fox'],
  squirrel: ['ein Eichhörnchen', 'Ein Eichhörnchen', 'a squirrel'],
  antelope: ['eine Antilope', 'Eine Antilope', 'an antelope'],
  zebra: ['ein Zebra', 'Ein Zebra', 'a zebra'],
  meerkat: ['ein Erdmännchen', 'Ein Erdmännchen', 'a meerkat'],
  lion: ['einen Löwen', 'Ein Löwe', 'a lion'],
  crocodile: ['ein Krokodil', 'Ein Krokodil', 'a crocodile'],
  giraffe: ['eine Giraffe', 'Eine Giraffe', 'a giraffe'],
  gorilla: ['einen Gorilla', 'Ein Gorilla', 'a gorilla'],
  jaguar: ['einen Jaguar', 'Ein Jaguar', 'a jaguar'],
  iguana: ['einen Leguan', 'Ein Leguan', 'an iguana'],
  toucan: ['einen Tukan', 'Ein Tukan', 'a toucan'],
  macaw: ['einen Ara', 'Ein Ara', 'a macaw'],
  snake: ['eine Schlange', 'Eine Schlange', 'a snake'],
  piranha: ['einen Piranha', 'Ein Piranha', 'a piranha'],
  tarantula: ['eine Spinne', 'Eine Spinne', 'a spider'],
  seal: ['einen Seehund', 'Ein Seehund', 'a seal'],
  penguin: ['einen Pinguin', 'Ein Pinguin', 'a penguin'],
  anteater: ['einen Ameisenbären', 'Ein Ameisenbär', 'an anteater'],
  howler: ['einen Brüllaffen', 'Ein Brüllaffe', 'a howler monkey'],
  macaque: ['einen Japanmakaken', 'Ein Japanmakak', 'a macaque'],
  panda: ['einen Panda', 'Ein Panda', 'a panda'],
  peacock: ['einen Pfau', 'Ein Pfau', 'a peacock'],
  orangutan: ['einen Orang-Utan', 'Ein Orang-Utan', 'an orangutan'],
  tiger: ['einen Tiger', 'Ein Tiger', 'a tiger'],
  heron: ['einen Reiher', 'Ein Reiher', 'a heron'],
  flamingo: ['einen Flamingo', 'Ein Flamingo', 'a flamingo'],
};

// nur Arten, für die es die Sätze und ein Bild gibt
export const canWish = (species) => !!WORDS[species] && hasAnimalIcon(species);

export function ensureWishes() {
  if (!game.wishes || !Array.isArray(game.wishes.open)) game.wishes = { open: [] };
  return game.wishes;
}

export const openWishes = () => ensureWishes().open;
export const wishSlotFree = () => openWishes().length < MAX_WISHES;

export const wishHearts = (w) => (w?.skin ? RARE_WISH_HEARTS : WISH_HEARTS);
export const wishKey = (species, skin = null) => (skin ? `${species}:${skin}` : species);
// Bild in der Blase und auf der Karte: die seltene Variante mit eigenem Bild, sonst die Tierart
export const wishIcon = (species, skin, size) => animalIcon(skin && hasAnimalIcon(skin) ? skin : species, size);
// kommt diese seltene Variante als Wunsch in Frage? (eigenes Bild, nicht die häufigen Fischarten)
export const canWishSkin = (species, sk) => !!sk && !sk.common && !sk.placeholder && hasAnimalIcon(sk.id) && canWish(species);

// Name der seltenen Variante mit unbestimmtem Artikel im Nominativ ("ein Silberfuchs", "eine Goldqualle")
function rareWords(species, skin) {
  const sk = skinInfo(species, skin);
  if (!sk) return null;
  const de = `${sk.male || sk.neuter ? 'ein' : 'eine'} ${sk.name}`;
  const en = `${/^[aeiou]/i.test(sk.name) ? 'an' : 'a'} ${sk.name}`;
  return { de, en };
}
const big = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Name für die Wunschkarte (die seltene Variante bzw. die Tierart)
export function wishName(species, skin, speciesName) {
  const sk = skin && skinInfo(species, skin);
  return sk ? big(sk.name) : speciesName;
}

// "Ich würde so gern mal einen Fuchs sehen!" bzw. "Mein größter Wunsch: ein Silberfuchs!"
export function wishLine(species, skin = null) {
  const r = skin && rareWords(species, skin);
  if (r) return tr(`Mein größter Wunsch: ${r.de}!`, `My biggest wish: ${r.en}!`);
  const [acc, , en] = WORDS[species];
  return tr(`Ich würde so gern mal ${acc} sehen!`, `I’d love to see ${en}!`);
}

// "Ein Fuchs! Danke!"
export function thanksLine(species, skin = null) {
  const r = skin && rareWords(species, skin);
  if (r) return tr(`${big(r.de)}! Danke!`, `${big(r.en)}! Thank you!`);
  const [, nom, en] = WORDS[species];
  return tr(`${nom}! Danke!`, `${big(en)}! Thank you!`);
}
