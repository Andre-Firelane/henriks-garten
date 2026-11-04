// Spielstand, der einen Levelwechsel überdauert (die Szene wird dabei neu aufgebaut)
export const game = {
  levels: {}, // pro Level: { animals: [{ species, state, x, y }], pickups: [{ tool, x, y }] }
  tool: null, // getragenes Werkzeug
  followers: [], // Tierarten, die dem Spieler gerade folgen (kommen mit ins nächste Level)
  traps: [], // ausgelegte Fallen: { id, level, x, y, timer, caught }
  nextTrapId: 1,
  hearts: 0, // Bewunderungsherzen der Besucher im Tierpark (zum Eintauschen, kommt später)
  heartsBy: {}, // Statistik: so viele Herzen hat jede Tierart (bzw. 'icecream' der Eisstand) gebracht
  parkIncome: null, // so viele Herzen bringt jeder Tierpark-Abschnitt pro Minute, solange man woanders ist: { park: {...}, ... } (beim Verlassen gemerkt)
  parkSplit: true, // der Tierpark ist in drei Abschnitte geteilt (ältere Spielstände ziehen beim Laden um, siehe splitPark in save.js)
  events: {},
  unlocked: [],
  penLevel: {}, // ausgebaute Gehege: { pasture: 1, ... } (am Hauptrechner, siehe upgradeCost)
  tutorial: false, // Mini-Tutorial beim ersten Spiel: Schritt 'car', 'tools', 'sheep' oder 'visit' (siehe showTutorial in GardenScene), danach false
  seasonAnchor: null, // Wetterphasen der Savanne: ab hier beginnt die Runde mit Normal (siehe src/world/season.js)
  seasonAnchors: {}, // ... und die der anderen Gebiete mit Wetter (Dschungel): { jungle: Zeitpunkt }
  boat: null, // Kanu im Dschungel: { x, y, riding } (wo es liegt bzw. ob Henrik darin sitzt)
  caughtSpecies: [], // Tierarten, die man schon einmal gefangen hat (Regal und Tierbuch zeigen die anderen als Schatten)
  seenSpecies: [], // Tierarten, denen man draußen schon begegnet ist (erst dann steht ihr Fang-Tipp im Tierbuch)
  tipsSeen: [], // Tierarten, zu denen der Fang-Tipp nach Fehlversuchen schon von selbst kam
  quests: { done: [] }, // Starter-Aufgaben (siehe src/world/quests.js)
  parkReturns: 0, // so oft ist man aus einer Welt zurück in den Tierpark gekommen (für die Tafeln in promos)
  promos: [], // schon gezeigte Tafeln im Tierpark: 'gift' (geschenktes Event), 'worlds' (die anderen Welten)
  bookNew: [], // Neues im Tierbuch (roter Punkt am Knopf, leuchtet beim Öffnen auf): 'caught:fox', 'seen:fox', 'quest:net'
  upgrades: 0, // so oft wurde schon ausgebaut (jeder Ausbau kostet 10 Herzen mehr) // freigeschaltete Teile des Tierparks (z. B. 'flamingo': Flamingo-Gehege nach dem ersten Flamingo) // gestartete Events (siehe src/world/events.js): { babies: { startsAt, endsAt, readyAt } }
};

export function resetGame() {
  game.levels = {};
  game.tool = null;
  game.followers = [];
  game.traps = [];
  game.hearts = 0;
  game.heartsBy = {};
  game.parkIncome = null;
  game.parkSplit = true;
  game.events = {};
  game.unlocked = [];
  game.penLevel = {};
  game.upgrades = 0;
  game.tutorial = false;
  game.seasonAnchor = Date.now(); // ein neues Spiel beginnt in der Savanne mit der normalen Phase
  game.seasonAnchors = {};
  game.boat = null;
  game.caughtSpecies = [];
  game.seenSpecies = [];
  game.tipsSeen = [];
  game.quests = { done: [] };
  game.bookNew = [];
  game.parkReturns = 0;
  game.promos = [];
}
