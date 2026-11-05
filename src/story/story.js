// Stand der Geschichte mit Mavi (game.story) und die Sperren der Gebiete. Die Aufgaben selbst stehen in steps.js,
// was Mavi dazu sagt und tut, in src/npc/Mavi.js.
import { game } from '../state.js';
import { STEPS, seaCatches } from './steps.js';

// Gebiete, die erst eine Aufgabe freischaltet (alles andere ist immer offen; das Aquarium hängt an park2)
const LOCKABLE = ['meadow', 'forest', 'savanna', 'reef', 'asia', 'jungle', 'ice', 'park2', 'park3', 'reptiles'];

export function newStory(locks = true) {
  return { step: 0, done: [], unlocked: [], heard: false, readyShown: false, locks, flags: {} };
}

export function activeStep() {
  return STEPS[game.story.step] ?? null;
}

export function activeId() {
  return activeStep()?.id ?? null;
}

// ist die Geschichte schon bei (oder hinter) dieser Aufgabe?
export function storyAt(id) {
  const i = STEPS.findIndex((s) => s.id === id);
  return game.story.step >= i;
}

export function isUnlocked(level) {
  if (!game.story.locks) return true;
  const id = level === 'aquarium' ? 'park2' : level;
  return !LOCKABLE.includes(id) || game.story.unlocked.includes(id);
}

// laut Spielstand erledigt? (Aufgaben ohne done sind reine Gespräche: nie von selbst)
export function stepDone(step) {
  return !!step?.done?.(game);
}

// aktive Aufgabe abhaken und zur nächsten; gibt die erledigte zurück
export function completeStep() {
  const s = activeStep();
  if (!s) return null;
  game.story.done.push(s.id);
  for (const id of s.unlocks ?? []) if (!game.story.unlocked.includes(id)) game.story.unlocked.push(id);
  game.story.step++;
  game.story.heard = false;
  game.story.readyShown = false;
  return s;
}

// Fang zählen (für die Aufgaben; zählt auch Fänge, bevor die Aufgabe dran ist)
export function countStoryCatch(species) {
  game.catches[species] = (game.catches[species] ?? 0) + 1;
}

// Spielstände von vor Mavi: nichts ist gesperrt, die Fänge werden aus Tierbuch und Gehegen geschätzt, und die
// Geschichte springt still zur ersten Aufgabe, die laut Spielstand noch offen ist (das Abschiedsgespräch bleibt)
export function migrateStory() {
  game.story = newStory(false);
  const catches = {};
  for (const s of game.caughtSpecies) catches[s] = 1;
  const home = {};
  for (const lvl of Object.values(game.levels)) for (const a of lvl.animals ?? []) if (a.state === 'penned' && !a.baby) home[a.species] = (home[a.species] ?? 0) + 1;
  for (const [s, n] of Object.entries(home)) catches[s] = Math.max(catches[s] ?? 0, n);
  game.catches = catches;
  if (seaCatches(game) > 0) game.story.flags.aquarium = true; // das Aquarium kennt man dann schon
  while (game.story.step < STEPS.length - 1) {
    const s = activeStep();
    if (s.done && !stepDone(s)) break;
    completeStep();
  }
}
