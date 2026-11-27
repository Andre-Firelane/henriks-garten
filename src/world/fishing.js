// Angeln (docs/plan-angeln.md): In Wiese, Wald, Savanne, Dschungel und Eiswelt ziehen Fischschatten am Ufer entlang. Mit der
// Angel wirft man nach einem Schatten aus; welche Art anbeißt, zeigt sich erst beim Herausholen (Pool je Gebiet und
// Gewässer bzw. Wetterphase). Nur die Größe verrät der Schatten vorher (klein oder groß).
// Gefangen ist es ein Tier der Art 'fish': skin = Fischart (Ids aus SKINS.fish), variant = 1 für groß, 0 für klein.
// Im Tierpark ziehen die Fische in die Süßwasserhalle des Aquariums, je Welt in ein eigenes Becken (tank).
import { tr } from '../i18n.js';
import { LEVEL, biomeOf } from './map.js';
import { registerSheetIcon } from '../ui/icons.js';

// Seltenheit: Gewicht im Pool; in Expeditionen kommen Seltene öfter (EXPEDITION_WEIGHT)
export const RARITY = { common: 6, rare: 2, epic: 0.5 };
const EXPEDITION_WEIGHT = { common: 6, rare: 4, epic: 2 };
// Anziehung im Tierpark je Seltenheit (Riff-Fische: 0,5, siehe visitors.js)
export const RARITY_APPEAL = { common: 0.5, rare: 1, epic: 2 };
export const BIG_CHANCE = 0.2; // so oft ist ein Fisch groß
export const BIG_SCALE = 1.4; // so viel größer schwimmt ein großer Fisch

// Becken in der Süßwasserhalle (Gehege-Id in levels.js, aquarium): kaltes Wasser (Wiese, Wald, Eiswelt) und warmes (Savanne, Dschungel)
const TANK = { meadow: 'fwCold', forest: 'fwCold', ice: 'fwCold', savanna: 'fwWarm', jungle: 'fwWarm' };

// Alle Angelfische in der Reihenfolge des Spritesheets freshfish (tools/freshwater-fish.py). id: Skin-Id (alte Ids der
// früheren Fischarten bleiben, damit gespeicherte Fische ihre Art behalten); world: Herkunft (Becken); rarity: die
// beste Seltenheit, mit der die Art irgendwo anbeißt (für die Herzen)
export const FRESH_FISH = [
  { id: 'fish_carp', name: tr('Karpfen', 'carp'), male: true, world: 'meadow', rarity: 'common' },
  { id: 'fish_tench', name: tr('Schleie', 'tench'), male: false, world: 'meadow', rarity: 'common' },
  { id: 'fish_roach', name: tr('Rotauge', 'roach'), male: false, world: 'meadow', rarity: 'common' },
  { id: 'fish_gold', name: tr('Goldfisch', 'goldfish'), male: true, world: 'meadow', rarity: 'epic' },
  { id: 'fish_perch', name: tr('Barsch', 'perch'), male: true, world: 'meadow', rarity: 'common' },
  { id: 'fish_chub', name: tr('Döbel', 'chub'), male: true, world: 'meadow', rarity: 'rare' },
  { id: 'fish_eel', name: tr('Aal', 'eel'), male: true, world: 'meadow', rarity: 'epic' },
  { id: 'fish_trout', name: tr('Forelle', 'trout'), male: false, world: 'forest', rarity: 'common' },
  { id: 'fish_grayling', name: tr('Äsche', 'grayling'), male: false, world: 'forest', rarity: 'common' },
  { id: 'fish_pike', name: tr('Hecht', 'pike'), male: true, world: 'forest', rarity: 'rare' },
  { id: 'fish2', name: tr('Wels', 'catfish'), male: true, world: 'forest', rarity: 'rare' },
  { id: 'fish_sturgeon', name: tr('Stör', 'sturgeon'), male: true, world: 'forest', rarity: 'epic' },
  { id: 'fish_crucian', name: tr('Karausche', 'crucian carp'), male: false, world: 'forest', rarity: 'common' },
  { id: 'fish_loach', name: tr('Schlammpeitzger', 'weatherfish'), male: true, world: 'forest', rarity: 'rare' },
  { id: 'fish_jewel', name: tr('Roter Buntbarsch', 'jewel cichlid'), male: true, world: 'savanna', rarity: 'common' },
  { id: 'lungfish', name: tr('Lungenfisch', 'lungfish'), male: true, world: 'savanna', rarity: 'common' },
  { id: 'fish_sharptooth', name: tr('Raubwels', 'sharptooth catfish'), male: true, world: 'savanna', rarity: 'rare' },
  { id: 'fish_nileperch', name: tr('Nilbarsch', 'Nile perch'), male: true, world: 'savanna', rarity: 'epic' },
  { id: 'fish_tigerfish', name: tr('Tigerfisch', 'tigerfish'), male: true, world: 'savanna', rarity: 'rare' },
  { id: 'fish_peacockbass', name: tr('Pfauenaugenbarsch', 'peacock bass'), male: true, world: 'jungle', rarity: 'common' },
  { id: 'fish_pacu', name: tr('Pacu', 'pacu'), male: true, world: 'jungle', rarity: 'common' },
  { id: 'fish_arowana', name: tr('Arowana', 'arowana'), male: true, world: 'jungle', rarity: 'epic' },
  { id: 'fish_arapaima', name: tr('Arapaima', 'arapaima'), male: true, world: 'jungle', rarity: 'epic' },
  { id: 'fish_electriceel', name: tr('Zitteraal', 'electric eel'), male: true, world: 'jungle', rarity: 'rare' },
  { id: 'fish_char', name: tr('Saibling', 'Arctic char'), male: true, world: 'ice', rarity: 'common' },
  { id: 'fish_cod', name: tr('Dorsch', 'cod'), male: true, world: 'ice', rarity: 'common' },
  { id: 'fish_salmon', name: tr('Lachs', 'salmon'), male: true, world: 'ice', rarity: 'rare' },
  { id: 'fish_lumpsucker', name: tr('Seehase', 'lumpsucker'), male: true, world: 'ice', rarity: 'epic' },
  { id: 'fish_halibut', name: tr('Heilbutt', 'halibut'), male: true, world: 'ice', rarity: 'rare' },
  { id: 'fish_polarcod', name: tr('Polardorsch', 'polar cod'), male: true, world: 'ice', rarity: 'common' },
];
const BY_ID = Object.fromEntries(FRESH_FISH.map((f, i) => [f.id, { ...f, index: i }]));
// Bild jeder Fischart (Tafeln, Tierbuch): ihr eigenes Bild aus freshfish.png (192 × 128, 20 Bilder je Zeile, 3 Zeilen; je
// Art zwei Bilder, das erste schwimmt nach links) statt des allgemeinen Fischbilds
FRESH_FISH.forEach((f, i) => registerSheetIcon(f.id, [192, 128, 20, (i * 2) % 20, 'freshfish', 3, Math.floor((i * 2) / 20)]));
const GOLDFISH = 'fish_gold';

// Fischart eines Skins (ohne Skin: der orange Fisch früherer Spielstände = Goldfisch)
export const fishKind = (skin) => BY_ID[skin] ?? BY_ID[GOLDFISH];
export const fishFrame = (skin) => fishKind(skin).index;
export const fishTank = (skin) => TANK[fishKind(skin).world];
export const isBigFish = (a) => a?.species === 'fish' && a.variant === 1;
// Wer bleibt im vollen Becken (je höher, desto lieber): sehr selten vor selten vor häufig, bei gleicher Seltenheit groß vor
// klein. Ist das Becken voll, zieht einer mit dem niedrigsten Rang aus (siehe releaseExtra und sendToHouse in GardenScene)
const RANK = { common: 0, rare: 2, epic: 4 };
export const fishRank = (skin, variant) => RANK[fishKind(skin).rarity] + (variant === 1 ? 1 : 0);

// Pools: [Art-Kurzname, Seltenheit]. Wiese und Wald nach Gewässer (area: Kacheln dieses Gewässers, sonst das letzte),
// Savanne, Dschungel und Eiswelt nach Wetterphase
const c = 'common', r = 'rare', e = 'epic';
const POOLS = {
  meadow: {
    waters: [
      { id: 'pond', areas: [{ tx0: 0, tx1: 19, ty0: 0, ty1: 40 }, { tx0: 31, tx1: 39, ty0: 22, ty1: 30 }], fish: [['fish_carp', c], ['fish_tench', c], ['fish_roach', r], ['fish_gold', e]] },
      { id: 'brook', fish: [['fish_perch', c], ['fish_roach', c], ['fish_chub', r], ['fish_eel', e]] },
    ],
  },
  forest: {
    waters: [
      { id: 'moor', areas: [{ tx0: 1, tx1: 21, ty0: 39, ty1: 62 }], fish: [['fish_crucian', c], ['fish_loach', r], ['fish_pike', e]] },
      { id: 'river', fish: [['fish_trout', c], ['fish_grayling', c], ['fish_pike', r], ['fish2', r], ['fish_sturgeon', e]] },
    ],
  },
  savanna: {
    seasons: {
      normal: [['fish_jewel', c], ['lungfish', r], ['fish_sharptooth', r], ['fish_tigerfish', e]],
      rain: [['fish_jewel', c], ['lungfish', c], ['fish_tigerfish', r], ['fish_nileperch', e]],
      dry: [['lungfish', c], ['fish_jewel', r], ['fish_sharptooth', e]],
    },
  },
  jungle: {
    seasons: {
      normal: [['fish_peacockbass', c], ['fish_pacu', r], ['fish_arowana', e]],
      rain: [['fish_peacockbass', c], ['fish_pacu', r], ['fish_arapaima', e]],
      fog: [['fish_pacu', c], ['fish_electriceel', r], ['fish_arowana', e]],
    },
  },
  ice: {
    seasons: {
      day: [['fish_char', c], ['fish_cod', c], ['fish_salmon', r], ['fish_lumpsucker', e]],
      night: [['fish_polarcod', c], ['fish_halibut', r], ['fish_lumpsucker', e]],
    },
  },
};

// Wie schnell sie anbeißen (Sekunden, bis die Pose zuckt) je Wetterphase
const BITE_WAIT = { rain: [1, 3], dry: [4, 7] };
const BITE_WAIT_NORMAL = [2, 5];
export const biteWait = () => BITE_WAIT[LEVEL.season] ?? BITE_WAIT_NORMAL;

// Gibt es hier etwas zu angeln?
export const canFishHere = () => !!POOLS[biomeOf()];

// Pool an dieser Kachel (Gewässer bzw. Wetterphase), Liste [Art, Seltenheit]
function poolAt(tx, ty) {
  const p = POOLS[biomeOf()];
  if (!p) return [];
  if (p.seasons) return p.seasons[LEVEL.season] ?? Object.values(p.seasons)[0];
  // Expeditions-Maps haben andere Kacheln: dort das allgemeine Gewässer (das letzte)
  const inside = (a) => !LEVEL.expedition && tx >= a.tx0 && tx <= a.tx1 && ty >= a.ty0 && ty <= a.ty1;
  return (p.waters.find((w) => w.areas?.some(inside)) ?? p.waters.at(-1)).fish;
}

// Fischart für einen Biss an dieser Kachel auswürfeln: { skin, rarity } (rarity: wie selten er an dieser Stelle ist)
export function rollFish(tx, ty) {
  const pool = poolAt(tx, ty);
  const weights = LEVEL.expedition ? EXPEDITION_WEIGHT : RARITY;
  let n = Math.random() * pool.reduce((s, [, rar]) => s + weights[rar], 0);
  for (const [id, rar] of pool) if ((n -= weights[rar]) <= 0) return { skin: id, rarity: rar };
  const last = pool.at(-1);
  return last ? { skin: last[0], rarity: last[1] } : { skin: GOLDFISH, rarity: 'epic' };
}

// Anzeige der Seltenheit in der Fang-Meldung (Rahmenfarbe und Schild)
export const RARITY_LOOK = {
  common: { name: tr('Häufig', 'Common'), color: '#5fa63c', dark: '#3f7a24', glow: 'rgba(120, 200, 90, 0.6)' },
  rare: { name: tr('Selten', 'Rare'), color: '#3b8fe0', dark: '#2560a8', glow: 'rgba(90, 160, 255, 0.75)' },
  epic: { name: tr('Sehr selten', 'Very rare'), color: '#a24fe0', dark: '#6c2ca3', glow: 'rgba(200, 120, 255, 0.95)' },
};
