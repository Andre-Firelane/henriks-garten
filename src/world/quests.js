// Starter-Aufgaben: die ersten beiden gehen mit dem Mini-Tutorial (Schafe, erstes Event), danach führen sie durch die
// Fangarten und zu den Event-Tieren.
// Jede bringt einmal Herzen. Angezeigt werden sie unter dem Zähler oben links (die nächste offene) und im Tierbuch (alle).
import { game } from '../state.js';
import { tr } from '../i18n.js';

// id, Text, Belohnung (Herzen)
export const QUESTS = [
  { id: 'sheep', text: tr('Bring 3 Schafe in deinen Tierpark', 'Bring 3 sheep to your zoo'), reward: 10 },
  { id: 'icecream', text: tr('Starte am Computer im Haupthaus den Eisstand', 'Start the ice cream stand at the computer in the main building'), reward: 10 },
  { id: 'net', text: tr('Fang ein Tier mit dem Kescher', 'Catch an animal with the net'), reward: 10 },
  { id: 'lasso', text: tr('Fang ein Tier mit dem Lasso', 'Catch an animal with the lasso'), reward: 15 },
  { id: 'trap', text: tr('Stell im Wald eine Falle auf und fang ein Tier damit', 'Set a trap in the forest and catch an animal with it'), reward: 15 },
  { id: 'food', text: tr('Locke eine Giraffe oder einen Panda mit Grünfutter', 'Lure a giraffe or a panda with leafy greens'), reward: 15 },
  { id: 'eventAnimal', text: tr('Starte am Computer ein Event mit neuen Tieren und fang eins (z. B. einen Flamingo)', 'Start an event with new animals at the computer and catch one (e.g. a flamingo)'), reward: 30 },
  { id: 'rare', text: tr('Manche Tiere gibt es in seltener Variante ✨ – fang eine!', 'Some animals come in a rare variant ✨ – catch one!'), reward: 30 },
];
export const QUEST_IDS = QUESTS.map((q) => q.id);

export function questDone(id) {
  return game.quests.done.includes(id);
}

// die nächste offene Aufgabe (oder null, wenn alle erledigt sind)
export function nextQuest() {
  return QUESTS.find((q) => !questDone(q.id)) ?? null;
}

// Aufgabe abhaken; gibt sie zurück, wenn sie gerade erst erledigt wurde (sonst null)
export function completeQuest(id) {
  if (questDone(id)) return null;
  game.quests.done.push(id);
  return QUESTS.find((q) => q.id === id);
}
