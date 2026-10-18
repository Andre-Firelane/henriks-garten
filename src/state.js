// Spielstand, der einen Levelwechsel überdauert (die Szene wird dabei neu aufgebaut)
export const game = {
  levels: {}, // pro Level: { animals: [{ species, state, x, y }], pickups: [{ tool, x, y }] }
  tool: null, // getragenes Werkzeug
  followers: [], // Tierarten, die dem Spieler gerade folgen (kommen mit ins nächste Level)
  traps: [], // ausgelegte Fallen: { id, level, x, y, timer, caught }
  nextTrapId: 1,
  hearts: 0, // Bewunderungsherzen der Besucher im Tierpark (zum Eintauschen, kommt später)
  heartsBy: {}, // Statistik: so viele Herzen hat jede Tierart (bzw. 'icecream' der Eisstand) gebracht
  parkLeftAt: null, // wann der Spieler den Tierpark zuletzt verlassen hat (für die Herzen, die in der Zeit dazukommen)
  events: {},
  unlocked: [],
  penLevel: {}, // ausgebaute Gehege: { pasture: 1, ... } (am Hauptrechner, siehe upgradeCost)
  upgrades: 0, // so oft wurde schon ausgebaut (jeder Ausbau kostet 10 Herzen mehr) // freigeschaltete Teile des Tierparks (z. B. 'flamingo': Flamingo-Gehege nach dem ersten Flamingo) // gestartete Events (siehe src/world/events.js): { babies: { startsAt, endsAt, readyAt } }
};

export function resetGame() {
  game.levels = {};
  game.tool = null;
  game.followers = [];
  game.traps = [];
  game.hearts = 0;
  game.heartsBy = {};
  game.parkLeftAt = null;
  game.events = {};
  game.unlocked = [];
  game.penLevel = {};
  game.upgrades = 0;
}
