// Diagnose (?diag, siehe diag.js): das Test-Spiel startet mit vollem Zentrum des Tierparks, damit sich auch ohne eigenen
// Spielstand messen lässt, wie das Tablet mit vielen Tieren zurechtkommt. Jedes Gehege im Zentrum bekommt so viele Tiere,
// wie es ohne Ausbau fasst; einige Schafe, Katzen und Rehe haben eine Fellfarbe (die wird im Spiel umgefärbt, wie bei
// einem echten Stand). Tutorial übersprungen, alle Gebiete offen, Wolfswald und Flamingos freigeschaltet.
import { game } from './state.js';
import { LEVELS } from './world/levels.js';
import { skipStory } from './story/story.js';

const COATS = { sheep: ['sheep_grey', 'sheep_moorit', 'sheep_black'], cat: ['cat_grey', 'cat_black'], deer: ['deer_dark', 'deer_light'] };

export function fillParkForDiag() {
  game.unlocked = [...new Set([...(game.unlocked ?? []), 'wolves', 'flamingo'])];
  const animals = [];
  const count = {};
  const add = (species) => {
    const n = (count[species] = (count[species] ?? 0) + 1);
    const coats = COATS[species];
    const skin = coats && n % 3 === 0 ? coats[(n / 3 - 1) % coats.length] : null; // jedes dritte Tier mit Fellfarbe
    animals.push({ species, skin, uid: game.nextAnimalId++, state: 'penned', x: 0, y: 0, since: Date.now() }); // (Platz sucht das Spiel)
  };
  for (const e of LEVELS.park.enclosures) {
    if (e.quota) for (const [species, [n]] of Object.entries(e.quota)) for (let i = 0; i < n; i++) add(species);
    else for (let i = 0; i < (e.slots?.[0] ?? 0); i++) add(e.species[i % e.species.length]);
  }
  game.levels.park = { animals, pickups: [] };
  const species = [...new Set(animals.map((a) => a.species))];
  game.caughtSpecies = [...new Set([...game.caughtSpecies, ...species])];
  game.seenSpecies = [...new Set([...game.seenSpecies, ...species])];
  game.skinsCaught = [...new Set([...(game.skinsCaught ?? []), ...animals.map((a) => a.skin).filter(Boolean)])];
  game.hearts = 500;
  skipStory();
}
