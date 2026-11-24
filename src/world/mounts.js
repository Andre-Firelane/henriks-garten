// Reittiere und E-Roller (Plan: docs/plan-reittiere.md). Ein Reittier leiht man für 10 Minuten (das Event 'ride' in
// events.js: in allen Welten, mit Werkzeugwechsel überall) oder kauft es dauerhaft für ein Gebiet: dort reitet man dann
// immer, aber nur schneller (Werkzeug wechselt man wie sonst am Regal). Den E-Roller im Tierpark schaltet man einmal frei.
// Kaufen: im Stall vor dem Haupthaus oder im Reiter "Reittiere" der Events-Tafel.
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { price } from './luck.js';

// Gebiete mit eigenem Reittier (Bilder ride_<Gebiet>, siehe RIDES in GardenScene; die Eiswelt hat noch keins)
// name: das Reittier (Esel, Pferd, Elefant, Wasserbüffel, Maultier, Seabob – wie auf den Bildern); article: der/die/das
export const MOUNTS = {
  meadow: { article: 'der', name: tr('Esel', 'Donkey'), area: tr('Wiese', 'Meadow'), where: tr('auf der Wiese', 'on the meadow') },
  forest: { article: 'das', name: tr('Pferd', 'Horse'), area: tr('Wald', 'Forest'), where: tr('im Wald', 'in the forest') },
  savanna: { article: 'der', name: tr('Elefant', 'Elephant'), area: tr('Savanne', 'Savanna'), where: tr('in der Savanne', 'in the savanna') },
  asia: { article: 'der', name: tr('Wasserbüffel', 'Water Buffalo'), area: tr('Bambuswald', 'Bamboo Forest'), where: tr('im Bambuswald', 'in the bamboo forest') },
  jungle: { article: 'das', name: tr('Maultier', 'Mule'), area: tr('Dschungel', 'Jungle'), where: tr('im Dschungel', 'in the jungle') },
  reef: { article: 'der', name: tr('Seabob', 'Seabob'), area: tr('Riff', 'Reef'), where: tr('im Riff', 'on the reef') },
};
export const MOUNT_COST = 500; // dauerhaft, je Gebiet
export const SCOOTER_COST = 300; // E-Roller im Tierpark

export const ownsMount = (area) => !!game.mounts?.includes(area);
export const ownsScooter = () => !!game.scooter;

export function buyMount(area) {
  const cost = price(MOUNT_COST);
  if (!MOUNTS[area] || ownsMount(area) || game.hearts < cost) return false;
  game.hearts -= cost;
  (game.mounts ??= []).push(area);
  return true;
}

export function buyScooter() {
  const cost = price(SCOOTER_COST);
  if (ownsScooter() || game.hearts < cost) return false;
  game.hearts -= cost;
  game.scooter = true;
  return true;
}
