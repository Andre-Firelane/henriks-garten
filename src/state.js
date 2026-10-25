// Spielstand, der einen Levelwechsel überdauert (die Szene wird dabei neu aufgebaut)
export const game = {
  levels: {}, // pro Level: { animals: [{ species, state, x, y }], pickups: [{ tool, x, y }] }
  tool: null, // getragenes Werkzeug
  followers: [], // Tierarten, die dem Spieler gerade folgen (kommen mit ins nächste Level)
  traps: [], // ausgelegte Fallen: { id, level, x, y, timer, caught }
  nextTrapId: 1,
  hearts: 0, // Bewunderungsherzen der Besucher im Tierpark (zum Eintauschen, kommt später)
  heartsBy: {}, // Statistik: so viele Herzen hat jede Tierart (bzw. 'icecream' der Eisstand) gebracht
  parkIncome: null, // so viele Herzen bringt der Tierpark pro Minute, solange man woanders ist (beim Verlassen gemerkt)
  events: {},
  unlocked: [],
  penLevel: {}, // ausgebaute Gehege: { pasture: 1, ... } (am Hauptrechner, siehe upgradeCost)
  tutorial: false, // Mini-Tutorial beim ersten Spiel: Schritt 'car', 'tools', 'sheep' oder 'visit' (siehe showTutorial in GardenScene), danach false
  seasonAnchor: null, // Wetterphasen der Savanne: ab hier beginnt die Runde mit Normal (siehe src/world/season.js)
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
  game.events = {};
  game.unlocked = [];
  game.penLevel = {};
  game.upgrades = 0;
  game.tutorial = false;
  game.seasonAnchor = Date.now(); // ein neues Spiel beginnt in der Savanne mit der normalen Phase
}
