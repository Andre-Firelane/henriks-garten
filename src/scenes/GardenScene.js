import Phaser from 'phaser';
import { TILE_W, TILE_H, tileToWorld, worldToTile } from '../world/iso.js';
import {
  LEVEL,
  LEVEL_ID,
  MAP_W,
  MAP_H,
  START,
  ENCLOSURES,
  TOOL_SPOTS,
  SHED,
  EXITS,
  FISHPOND_TILES,
  NEAR_WATER,
  NEAR_TREES,
  setLevel,
  groundAt,
  grassAt,
  outerWaterCorners,
  objectAt,
  fenceAxisAt,
  isBlocked,
  exitAt,
  inPen,
  nearEnclosure,
  accepts,
} from '../world/map.js';
import { LEVELS } from '../world/levels.js';
import { game, resetGame } from '../state.js';
import Player from '../player/Player.js';
import Animal, { SPECIES, CATCH_DIST, FOLLOW_GAP, isCatchable } from '../animals/Animal.js';
import Fish from '../animals/Fish.js';
import Squirrel from '../animals/Squirrel.js';
import Frog from '../animals/Frog.js';
import Mole from '../animals/Mole.js';
import Heron from '../animals/Heron.js';
import Antelope from '../animals/Antelope.js';
import Zebra from '../animals/Zebra.js';
import Meerkat from '../animals/Meerkat.js';
import Lion from '../animals/Lion.js';
import Crocodile from '../animals/Crocodile.js';
import { blockedAt } from '../world/collision.js';
import Pickup from '../world/Pickup.js';
import { roundedTexture } from '../world/roundedTiles.js';
import Net from '../tools/Net.js';
import Lasso from '../tools/Lasso.js';
import TrapTool from '../tools/TrapTool.js';
import FoodTool from '../tools/FoodTool.js';
import Trap from '../world/Trap.js';
import { animalIcon, animalIcons } from '../ui/icons.js';
import { touchHandlers, setTouchTool } from '../ui/touch.js';
import { openJournal, isJournalOpen } from '../ui/journal.js';

// Ganzzahliger Zoom hält die Pixel-Art scharf: etwa 360 Welt-Pixel Bildhöhe
const VIEW_H = 360;
// Reihenfolge der Tierarten in der Anzeige
const ALL_SPECIES = ['sheep', 'cat', 'deer', 'stag', 'fish', 'frog', 'mole', 'heron', 'squirrel', 'fox', 'antelope', 'zebra', 'meerkat', 'lion', 'crocodile', 'giraffe'];
const GATE_OPEN_DIST = 44; // so nah muss man ans Tor, damit es aufgeht
const GATE_CLOSE_DELAY = 0.5; // Sekunden, bis es nach dem Durchgehen wieder erscheint
const SIGN_DIST = 50; // so nah muss man an den Wegweiser, damit er etwas anzeigt
const WRONG_HOME_HINT = 6; // Sekunden zwischen zwei Hinweisen "falsches Gehege"

// Für die Übersicht: womit man fängt (Bild, Name) und besondere Tipps je Tierart
const CATCH_TOOLS = {
  touch: ['hand', 'Berühren'],
  net: ['net', 'Kescher'],
  lasso: ['lasso', 'Lasso'],
  trap: ['trap', 'Falle'],
  food: ['food', 'Grünfutter'],
};
const CATCH_TIPS = {
  fish: 'Nur wenn er nach den Luftblasen auftaucht.',
  mole: 'Nur wenn er aus seinem Hügel schaut.',
  squirrel: 'Nur wenn es vom Baum herunterkommt – halte etwas Abstand.',
  heron: 'Nur wenn er am Wasser gelandet ist.',
  deer: 'Scheu: aus der Ferne mit dem Lasso.',
  stag: 'Selten und scheu: aus der Ferne mit dem Lasso.',
  fox: 'Nur mit der Falle.',
  antelope: 'Lebt in Herden – fängst du eine, rennen die anderen weg.',
  zebra: 'Beim Trinken am Wasserloch flieht es nicht, dann kannst du es auch berühren.',
  meerkat: 'Schleich dich von hinten an – der Wächter sieht nur, was vor ihm ist.',
  lion: 'Kraulen, solange er schnarcht (Zzz). Hören die Zzz auf, bleib stehen und warte weit weg!',
  crocodile: 'Wie beim Fisch: warte auf die Luftblasen im Wasserloch und wirf das Lasso, wenn der Kopf auftaucht.',
  giraffe: 'Füttere sie mit Grünfutter, dann folgt sie dir vielleicht.',
};

// Für die Schilder an den Gehegetoren: Name und was man an der Fußspur erkennt (zum Lernen)
const ANIMAL_INFO = {
  sheep: ['Schaf', 'Paarhufer: Jeder Fuß hat zwei Hufhälften.'],
  mole: ['Maulwurf', 'Breite Grabhände mit fünf kräftigen Krallen.'],
  cat: ['Katze', 'Vier Zehen und ein großer Ballen. Die Krallen bleiben beim Laufen eingezogen.'],
  frog: ['Frosch', 'Lange, dünne Finger mit runden Haftscheiben an den Spitzen.'],
  fish: ['Fisch', 'Hat keine Füße – Fische schwimmen mit ihren Flossen.'],
  deer: ['Reh', 'Paarhufer: zwei schmale Hufhälften, vorne spitz.'],
  stag: ['Hirsch', 'Wie beim Reh, nur viel größer – dahinter sieht man oft zwei kleine Afterklauen.'],
  fox: ['Fuchs', 'Vier Zehen mit Krallen und ein kleiner Ballen – fast wie beim Hund, nur schmaler.'],
  squirrel: ['Eichhörnchen', 'Lange, dünne Finger mit spitzen Krallen – perfekt zum Klettern.'],
  antelope: ['Antilope', 'Paarhufer: zwei schmale, spitze Hufhälften – gut zum schnellen Rennen.'],
  zebra: ['Zebra', 'Unpaarhufer wie das Pferd: ein einziger runder Huf statt zwei Hälften.'],
  meerkat: ['Erdmännchen', 'Vier Zehen mit langen Grabkrallen – damit buddeln sie ihre Höhlen.'],
  lion: ['Löwe', 'Wie eine riesige Katzenpfote: großer Ballen, vier Zehen, keine Krallenspuren.'],
  crocodile: ['Krokodil', 'Fünf gespreizte Zehen mit Krallen – und dazwischen die Schleifspur vom Schwanz.'],
  giraffe: ['Giraffe', 'Riesige Paarhufe, fast so groß wie ein Teller, mit zwei runden Hälften.'],
  heron: ['Fischreiher', 'Drei lange Zehen nach vorne und eine nach hinten.'],
};

// Falle: wie lange es dauert, bis ein Tier hineingeht, und aus welcher Umgebung Tiere kommen
const TRAP_TIME = [20, 180]; // Sekunden (zufällig)
const TRAP_RETRY = [10, 30]; // war kein Tier in der Nähe, nach so vielen Sekunden erneut versuchen
const TRAP_RADIUS = 360; // etwa 8 Kacheln
const TRAP_PICKUP_DIST = 24;
const HAND_DIST = 18; // so nah muss man an den "Hände frei"-Platz (wie bei Werkzeugen)
const TRAP_REARM_DIST = 90; // so weit muss man sich von einer ausgelegten Falle entfernen, bevor man sie wieder aufheben kann
const MARKER_MARGIN = 34; // Abstand der Fallen-Hinweise vom Bildschirmrand (CSS-Pixel)

// Spawner: wilde Tiere leben eine Weile, dann verschwinden sie, und neue kommen nach (siehe spawn in levels.js)
const LIFETIME = [90, 240]; // Sekunden, die ein wildes Tier bleibt (zufällig)
const SPAWN_INTERVAL = [5, 12]; // so oft schaut der Spawner, ob Tiere fehlen
const FROG_NEAR_WATER = 0.75; // Anteil der Frösche, die am Wasser erscheinen
const GIRAFFE_NEAR_TREES = 0.85; // Anteil der Giraffen, die in der Nähe eines Baums erscheinen
const HERD_SIZE = [2, 4]; // so viele Antilopen erscheinen zusammen
const FEED_DIST = 60; // so nah muss man an einer Giraffe stehen, um sie zu füttern
const FEED_CHANCE = 1 / 3; // so wahrscheinlich läuft sie einem nach dem Füttern hinterher
const DESPAWN_DIST = 300;
const ANIMAL_VOLUME = 0.45; // Lautstärke der Tierrufe beim Fangen
const WHOOSH_VOLUME = 0.35; // Lautstärke des Schwungs beim Einsetzen eines Werkzeugs
const TRAP_VOLUME = 0.5; // Lautstärke, wenn die Falle zuschnappt
const AMBIENT_VOLUME = 0.55; // Lautstärke der Hintergrundgeräusche (z. B. Wald)
const AMBIENT_FADE = 1500; // Millisekunden zum Einblenden

// Das laufende Hintergrundgeräusch überdauert Levelwechsel (die Szene startet dabei neu)
let ambient = null; // nur so weit weg vom Spieler verschwinden Tiere (nicht vor seinen Augen)

// Reihenfolge der Tierarten im Zähler: alle fangbaren, die in irgendeinem Level vorkommen
const SPECIES_ORDER = ALL_SPECIES.filter(
  (s) =>
    isCatchable(SPECIES[s]) &&
    Object.values(LEVELS).some((level) => level.spawn.weights[s] || (s === 'heron' && level.herons)),
);

// Werkzeuge: wie sie erzeugt werden und was die Anzeige dazu sagt. Man trägt immer nur eins.
const ACTION_KEY = 'E';
const TOOLS = {
  net: {
    create: (scene, player) => new Net(scene, player),
    name: 'Kescher',
    hint: `Damit fängst du ${animalIcons(['cat', 'fish', 'frog', 'mole', 'squirrel', 'heron', 'meerkat'])}`,
  },
  lasso: {
    create: (scene, player) => new Lasso(scene, player),
    name: 'Lasso',
    hint: `Damit fängst du ${animalIcons(['deer', 'stag', 'antelope', 'zebra', 'crocodile', 'sheep', 'heron'])} aus der Ferne`,
  },
  trap: {
    create: (scene, player) => new TrapTool(scene, player),
    name: 'Falle',
    hint: 'Leg sie aus und warte, bis ein Tier hineingeht',
  },
  food: {
    create: (scene, player) => new FoodTool(scene, player),
    name: 'Grünfutter',
    hint: `Geh nah an eine ${animalIcon('giraffe')} heran und füttere sie`,
  },
};

export default class GardenScene extends Phaser.Scene {
  constructor() {
    super('Garden');
  }

  // data.level: welches Level; data.arrive: Ankunftskachel nach einem Übergang
  create(data = {}) {
    // Startlevel lässt sich zum Ausprobieren auch über die Adresse wählen, z. B. ?level=forest
    const urlLevel = new URLSearchParams(location.search).get('level');
    setLevel(data.level ?? (LEVELS[urlLevel] ? urlLevel : 'meadow'));
    this.leaving = false;
    this.signs = [];

    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const { x, y } = tileToWorld(tx, ty);
        // Boden liegt immer ganz unten. Wasserecken, die ins Land ragen, werden abgerundet; darunter Gras.
        const corners = outerWaterCorners(tx, ty);
        if (corners) {
          this.add.image(x, y, grassAt(tx, ty)).setDepth(-100001);
          this.add.image(x, y, roundedTexture(this, groundAt(tx, ty), corners)).setDepth(-100000);
        } else {
          this.add.image(x, y, groundAt(tx, ty)).setDepth(-100000);
        }

        const obj = objectAt(tx, ty);
        if (obj?.fence) this.addFence(tx, ty, obj);
        else if (obj) this.add.image(x, y, obj.key).setOrigin(0.5, obj.originY).setDepth(y);
        if (obj?.key === 'signpost') {
          this.signs.push({ x, y });
          this.labelSignpost(x, y);
        }
      }
    }

    // Tore der Gehege: jedes verschwindet kurz, solange jemand hindurchgeht
    this.gateGroups = ENCLOSURES.filter((e) => e.gates.length).map((e) => ({
      sprites: e.gates.map(({ tx, ty, vertical }, i) => {
        const { x, y } = tileToWorld(tx, ty);
        let style = e.gate && e.gate !== 'wood' ? `gate_${e.gate}_` : 'gate_';
        if (e.gate === 'glass' && i === Math.floor(e.gates.length / 2)) style = 'gate_glassflap_'; // Katzenklappe in der Mitte
        const img = this.add.image(x, y, style + (vertical ? 'y' : 'x'));
        // Kachelmitte liegt 20 Pixel über dem unteren Bildrand (bei hohen Toren wie dem Wildzaun-Tor ebenso)
        return img.setOrigin(0.5, (img.height - 20) / img.height).setDepth(y);
      }),
      open: false,
      closeTimer: 0,
    }));
    // Schilder mit den Fußspuren der erlaubten Tiere, am Zaun neben dem Tor
    this.enclosureSigns = ENCLOSURES.filter((e) => e.sign).map((e) => {
      const { x, y } = tileToWorld(e.sign.tx, e.sign.ty);
      // immer vor dem Tor (und dem Zaun) zeichnen, damit nichts das Schild verdeckt
      const front = Math.max(y, ...e.gates.map((g) => tileToWorld(g.tx, g.ty).y)) + 2;
      this.add.image(x, y - 20, `esign_${e.signKey ?? e.id}`).setScale(0.5).setDepth(front);
      return { x, y, enclosure: e };
    });
    this.wrongHomeTimer = 0;
    // Netzdach über Gehegen wie der Voliere
    for (const e of ENCLOSURES) if (e.netRoof) this.drawNetRoof(e.area);
    this.shownSign = null; // welches Schild die Tafel gerade zeigt

    // Werkzeughütte: Bild sitzt mit der Mitte seiner Grundfläche auf der gemeinsamen Ecke der 4 Kacheln
    if (SHED) {
      const shedCenter = tileToWorld(SHED.tx + 1, SHED.ty + 1);
      this.add
        .image(shedCenter.x, shedCenter.y - TILE_H / 2, LEVEL.shedTexture)
        .setOrigin(72 / 144, 90 / 128)
        .setDepth(shedCenter.y - TILE_H / 2);
    }

    // Beschriftung über den Übergängen in andere Level
    for (const exit of EXITS) {
      const { x, y } = tileToWorld(exit.tx, exit.ty);
      this.add
        .text(x, y - 34, `${exit.label} ▸`, {
          fontFamily: 'Trebuchet MS, Arial',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#fff8e6',
          backgroundColor: '#3c2814cc',
          padding: { x: 5, y: 2 },
          resolution: 4,
        })
        .setOrigin(0.5)
        .setDepth(100000);
    }

    const arrive = data.arrive ?? START;
    const start = tileToWorld(arrive.tx, arrive.ty);
    this.player = new Player(this, start.x, start.y, LEVEL.hero ?? 'hero'); // Kleidung passend zum Gebiet

    // Werkzeuge am Boden: gespeicherter Stand oder die Startplätze des Levels
    const saved = game.levels[LEVEL_ID];
    const pickupList =
      saved?.pickups ??
      TOOL_SPOTS.filter((s) => s.tool !== 'empty').map(({ tool, tx, ty }) => ({ tool, ...tileToWorld(tx, ty) }));
    this.pickups = pickupList.map(({ tool, x, y }) => new Pickup(this, x, y, tool, tool));
    // "Hände frei"-Plätze: bleiben immer liegen; wer darüber läuft, legt sein Werkzeug zurück an dessen Platz
    this.handSpots = TOOL_SPOTS.filter((s) => s.tool === 'empty').map(({ tx, ty }) => {
      const p = tileToWorld(tx, ty);
      return new Pickup(this, p.x, p.y, 'hand', 'empty');
    });

    // Das getragene Werkzeug kommt mit
    this.tool = null;
    this.toolId = null;
    if (game.tool) {
      this.tool = TOOLS[game.tool].create(this, this.player);
      this.toolId = game.tool;
    }

    // Tiere: gespeicherter Stand oder neu verteilen
    this.animals = [];
    if (saved) {
      for (const s of saved.animals) {
        const a = this.createAnimal(s.species, s.x, s.y);
        a.restore(s.state);
        a.life = s.life ?? Phaser.Math.FloatBetween(...LIFETIME);
      }
    } else {
      this.spawnAnimals(arrive);
    }
    this.spawnTimer = Phaser.Math.FloatBetween(...SPAWN_INTERVAL);
    this.heronTimer = LEVEL.herons ? Phaser.Math.FloatBetween(5, LEVEL.herons.every[0]) : Infinity;

    // Ausgelegte Fallen in diesem Level (gefangene Tiere stehen schon als 'trapped' in der Tierliste)
    this.traps = new Map();
    for (const t of game.traps) {
      if (t.level !== LEVEL_ID) continue;
      const trap = new Trap(this, t.x, t.y);
      if (t.caught) trap.showCaught();
      this.traps.set(t.id, trap);
    }

    // Tiere, die dem Spieler aus dem letzten Level gefolgt sind
    this.followers = [];
    for (const species of game.followers) {
      const a = this.createAnimal(species, start.x, start.y);
      a.restore('following');
      this.followers.push(a);
    }
    game.followers = [];

    this.hud = document.getElementById('hud');
    this.toolbar = document.getElementById('tools');
    this.toast = document.getElementById('toast');
    this.signPanel = document.getElementById('sign');
    this.markerBox = document.getElementById('markers');
    this.markerBox.innerHTML = '';
    this.markers = new Map(); // Fallen-ID → Hinweis am Bildschirmrand
    this.signPanel.classList.remove('show');
    this.updateHud();
    this.updateToolbar();
    if (data.level) {
      const back = data.returned ? `<br><small>${data.returned} liegt wieder in der Hütte im anderen Gebiet</small>` : '';
      this.showToast(`${LEVEL.name}${back}`);
    }

    const cam = this.cameras.main;
    cam.setBackgroundColor(LEVEL.background ?? '#4f8a2f'); // Farbe außerhalb der Karte
    this.fitZoom();
    this.scale.on('resize', this.fitZoom, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitZoom, this));
    if (data.level) cam.fadeIn(300); // nach einem Levelwechsel sanft einblenden
    this.startAmbient();

    // ESC (oder der Neustart-Knopf auf dem Tablet) setzt das ganze Spiel zurück
    const restart = () => {
      resetGame();
      this.scene.restart({});
    };
    this.input.keyboard.on('keydown-ESC', restart);
    // Werkzeug einsetzen (wenn man eins hat): E, Enter oder der Aktionsknopf auf dem Tablet
    const useTool = () => {
      const tool = this.tool;
      if (this.leaving || !tool || tool.active) return; // läuft schon ein Schwung, zählt der Druck nicht
      tool.use();
      if (this.cache.audio.exists('whoosh')) this.sound.play('whoosh', { volume: WHOOSH_VOLUME });
    };
    this.input.keyboard.on(`keydown-${ACTION_KEY}`, useTool);
    this.input.keyboard.on('keydown-ENTER', useTool);
    // Übersicht über Tiere und Werkzeuge (Taste I oder Tippen auf das Abzeichen oben links)
    this.input.keyboard.on('keydown-I', () => this.showJournal());
    this.hud.onclick = () => this.showJournal(); // ganzer Tipp, damit derselbe Tipp die Tafel nicht gleich wieder schließt
    touchHandlers.action = useTool;
    touchHandlers.reset = restart;
    cam.setBounds(
      -MAP_H * (TILE_W / 2) - TILE_W,
      -TILE_H * 3,
      (MAP_W + MAP_H) * (TILE_W / 2) + TILE_W * 2,
      (MAP_W + MAP_H) * (TILE_H / 2) + TILE_H * 4,
    );
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
  }

  // Zaunstück zeichnen: nur die Hälften, die zu einem Nachbarzaun (oder Tor) führen. So ragt an Ecken
  // nichts über, und dort steht ein Eckpfosten.
  addFence(tx, ty, obj) {
    const { kind, axis } = obj.fence;
    const { x, y } = tileToWorld(tx, ty);
    // Verbindung in Richtung dx/dy entlang der Achse a: der Nachbar ist ein Zaun oder Tor, und einer von beiden läuft in diese Richtung
    const joins = (dx, dy, a) => {
      const other = fenceAxisAt(tx + dx, ty + dy);
      return !!other && (axis === a || other === a);
    };
    const xl = joins(-1, 0, 'x');
    const xr = joins(1, 0, 'x');
    const yu = joins(0, -1, 'y');
    const yd = joins(0, 1, 'y');
    const prefix = obj.key.slice(0, -2); // z. B. fence, mesh, net, chain
    const piece = (a, crop) => {
      const img = this.add.image(x, y, `${prefix}_${a}`).setOrigin(0.5, obj.originY).setDepth(y);
      if (crop === 'left') img.setCrop(0, 0, 34, img.height);
      if (crop === 'right') img.setCrop(30, 0, 34, img.height);
    };
    // entlang tx: links geht es zu tx-1, rechts zu tx+1; entlang ty (gespiegelt): rechts zu ty-1, links zu ty+1
    if (xl && xr) piece('x');
    else if (xl) piece('x', 'left');
    else if (xr) piece('x', 'right');
    if (yu && yd) piece('y');
    else if (yu) piece('y', 'right');
    else if (yd) piece('y', 'left');
    if (!xl && !xr && !yu && !yd) piece(axis); // einzelnes Stück
    if ((xl || xr) && (yu || yd)) this.add.image(x, y, `post_${kind}`).setOrigin(0.5, obj.originY).setDepth(y + 0.01);
  }

  // Namen auf die drei Bretter des Wegweisers schreiben (Brettmitten siehe signpost() in make-sprites.js)
  labelSignpost(x, y) {
    const boards = [[13, -47], [-13, -33], [13, -19]];
    (LEVEL.signLabels ?? []).forEach((text, i) => {
      const [dx, dy] = boards[i];
      this.add
        .text(x + dx, y + dy, text, {
          fontFamily: 'Trebuchet MS, Arial',
          fontSize: text.length > 6 ? '6px' : '7px', // längere Namen etwas kleiner, damit sie aufs Brett passen
          fontStyle: 'bold',
          color: '#3a2414',
          resolution: 8,
        })
        .setOrigin(0.5)
        .setDepth(y + 0.1);
    });
  }

  createAnimal(species, x, y) {
    const a =
      species === 'fish'
        ? new Fish(this, this.animals)
        : species === 'crocodile'
          ? new Crocodile(this, this.animals)
        : species === 'squirrel'
          ? new Squirrel(this, this.animals)
          : species === 'frog'
            ? new Frog(this, x, y)
            : species === 'mole'
              ? new Mole(this, this.animals)
              : species === 'heron'
                ? new Heron(this, x, y)
                : species === 'antelope'
                  ? new Antelope(this, x, y, this.animals)
                  : species === 'zebra'
                    ? new Zebra(this, x, y, this.animals)
                    : species === 'meerkat'
                      ? new Meerkat(this, x, y, this.animals)
                      : species === 'lion'
                        ? new Lion(this, x, y)
                  : new Animal(this, x, y, species);
    a.x = x;
    a.y = y;
    this.animals.push(a);
    return a;
  }

  // Erste Tiere beim Betreten eines neuen Levels: nicht zu nah an der Ankunft, nicht auf Werkzeugen,
  // nicht aufeinander. Ihre Lebenszeit ist gestaffelt, damit sie nicht alle gleichzeitig verschwinden.
  spawnAnimals(arrive) {
    const taken = [arrive, ...TOOL_SPOTS];
    for (let n = 0; n < LEVEL.spawn.population; ) {
      const group = this.spawnOne(taken);
      const life = Phaser.Math.FloatBetween(20, LIFETIME[1]);
      for (const a of group) a.life = life; // eine Gruppe verschwindet gemeinsam
      n += group.length;
    }
  }

  // Tierart nach den Wahrscheinlichkeiten des Levels auswürfeln
  pickSpecies() {
    const entries = Object.entries(LEVEL.spawn.weights);
    let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
    return (entries.find(([, w]) => (r -= w) <= 0) ?? entries[0])[0];
  }

  // Ein zufälliges wildes Tier erzeugen. Fische, Eichhörnchen und Maulwürfe suchen sich ihre Plätze selbst
  // (Wasser, Baum, Wiese), alle anderen kommen auf eine freie Kachel mit Abstand zu "taken" (siehe randomFreeTile).
  // Gibt die neuen Tiere zurück (meist eins, Antilopen kommen in kleinen Gruppen).
  spawnOne(taken, fadeIn = false) {
    const species = this.pickSpecies();
    const group = [];
    if (species === 'fish' || species === 'crocodile' || species === 'squirrel' || species === 'mole') {
      const a = this.createAnimal(species, 0, 0);
      if (species === 'squirrel') a.restore('wild'); // setzt es auf seinen Baum
      group.push(a);
    } else {
      // Frösche meistens nah am Wasser, Giraffen meistens nah an Bäumen
      const tile =
        (species === 'frog' && Math.random() < FROG_NEAR_WATER && this.tileFrom(NEAR_WATER, taken)) ||
        (species === 'giraffe' && Math.random() < GIRAFFE_NEAR_TREES && this.tileFrom(NEAR_TREES, taken)) ||
        (species === 'lion' && this.tileFrom(NEAR_TREES, taken)) || // Löwen dösen immer im Schatten eines Baums
        this.randomFreeTile(taken);
      taken.push(tile);
      const p = tileToWorld(tile.tx, tile.ty);
      group.push(this.createAnimal(species, p.x, p.y));
      // Antilopen: noch 1 bis 3 weitere dicht daneben
      if (SPECIES[species].herd) {
        const more = Phaser.Math.Between(...(SPECIES[species].groupSize ?? HERD_SIZE)) - 1;
        for (let i = 0; i < more; i++) {
          const spot = this.freeSpotNear(p.x, p.y, 28);
          if (spot) group.push(this.createAnimal(species, spot.x, spot.y));
        }
      }
    }
    const life = Phaser.Math.FloatBetween(...LIFETIME);
    for (const a of group) {
      a.life = life;
      if (fadeIn) {
        a.sprite.setAlpha(0);
        this.tweens.add({ targets: a.sprite, alpha: 1, duration: 800 });
      }
    }
    return group;
  }

  // Freier Punkt höchstens r Pixel von x/y entfernt (nicht im Gehege, nicht auf Hindernissen), oder null
  freeSpotNear(x, y, r) {
    for (let i = 0; i < 20; i++) {
      const sx = x + Phaser.Math.FloatBetween(-r, r);
      const sy = y + Phaser.Math.FloatBetween(-r / 2, r / 2);
      const { tx, ty } = worldToTile(sx, sy);
      if (isBlocked(tx, ty) || nearEnclosure(tx, ty)) continue;
      if (!blockedAt(sx, sy, 12, 5)) return { x: sx, y: sy };
    }
    return null;
  }

  // Freie Kachel aus der Liste (z. B. am Wasser oder an Bäumen) mit Abstand zu "taken" (gleiche Regel wie randomFreeTile), oder null
  tileFrom(list, taken) {
    const free = list.filter(
      ({ tx, ty }) => !taken.some((t, i) => Math.max(Math.abs(t.tx - tx), Math.abs(t.ty - ty)) < (i === 0 ? 5 : 2)),
    );
    return free.length ? Phaser.Utils.Array.GetRandom(free) : null;
  }

  // Wilde Tiere rotieren: abgelaufene verschwinden (nicht in der Nähe des Spielers, Fische nur abgetaucht,
  // Eichhörnchen nur oben im Baum), und fehlen Tiere, kommt ab und zu ein neues dazu.
  updateSpawner(dt) {
    const p = this.player;
    for (const a of [...this.animals]) {
      if (a.state !== 'wild') continue;
      a.life -= dt;
      if (a.life > 0) continue;
      const far = Math.hypot(a.x - p.x, (a.y - p.y) * 2) > DESPAWN_DIST;
      if (far && a.canDespawn()) this.despawn(a);
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = Phaser.Math.FloatBetween(...SPAWN_INTERVAL);
    const wild = this.animals.filter((a) => a.state === 'wild' && a.species !== 'heron').length;
    if (wild < LEVEL.spawn.population) this.spawnOne([worldToTile(p.x, p.y), ...TOOL_SPOTS], true);
  }

  // Fischreiher: alle paar Sekunden fliegt einer über die Karte; manche landen an einer Uferstelle
  updateHerons(dt) {
    // weggeflogene Reiher entfernen
    for (const a of [...this.animals]) {
      if (!a.gone) continue;
      this.animals.splice(this.animals.indexOf(a), 1);
      a.destroy();
    }
    this.heronTimer -= dt;
    if (this.heronTimer > 0) return;
    const { every, landChance } = LEVEL.herons;
    this.heronTimer = Phaser.Math.FloatBetween(...every);

    const angle = Math.random() * Math.PI * 2;
    const from = this.mapEdgePoint(angle);
    const land = Math.random() < landChance && NEAR_WATER.length > 0;
    let to;
    if (land) {
      const t = Phaser.Utils.Array.GetRandom(NEAR_WATER);
      to = tileToWorld(t.tx, t.ty);
    } else {
      to = this.mapEdgePoint(angle + Math.PI + Phaser.Math.FloatBetween(-0.6, 0.6)); // quer hinüber
    }
    const heron = this.createAnimal('heron', from.x, from.y);
    heron.startFlight(from, to, land);
  }

  // Punkt außerhalb der Karte in Richtung angle (von der Kartenmitte aus gesehen)
  mapEdgePoint(angle) {
    const c = tileToWorld(MAP_W / 2, MAP_H / 2);
    const r = (MAP_W + MAP_H) * (TILE_W / 2) * 0.6;
    return { x: c.x + Math.cos(angle) * r, y: c.y + (Math.sin(angle) * r) / 2 };
  }

  // Wohin ein gelandeter Reiher wieder wegfliegt: vom Rand der Karte, weg von seiner Position
  heronExitPoint(x, y) {
    const c = tileToWorld(MAP_W / 2, MAP_H / 2);
    const away = Math.atan2((y - c.y) * 2, x - c.x);
    return this.mapEdgePoint(away + Phaser.Math.FloatBetween(-0.8, 0.8));
  }

  despawn(a) {
    // dieselbe Liste behalten: Fische und Eichhörnchen schauen darin nach freien Plätzen
    this.animals.splice(this.animals.indexOf(a), 1);
    this.tweens.add({ targets: a.sprite, alpha: 0, duration: 800, onComplete: () => a.destroy() });
  }

  fitZoom() {
    this.cameras.main.setZoom(Math.max(1, Math.round(this.scale.height / VIEW_H)));
  }

  // Zufällige freie Kachel außerhalb des Geheges mit Abstand zu den Kacheln in "taken"
  randomFreeTile(taken) {
    for (;;) {
      const tx = Phaser.Math.Between(1, MAP_W - 2);
      const ty = Phaser.Math.Between(1, MAP_H - 2);
      if (isBlocked(tx, ty)) continue;
      if (nearEnclosure(tx, ty)) continue;
      const p = tileToWorld(tx, ty);
      if (blockedAt(p.x, p.y, 12, 5)) continue;
      const tooClose = taken.some((t, i) => Math.max(Math.abs(t.tx - tx), Math.abs(t.ty - ty)) < (i === 0 ? 5 : 2));
      if (!tooClose) return { tx, ty };
    }
  }

  // Wie viele Tiere jeder Art sind zuhause (im Gehege bzw. Fischteich), über alle Level?
  homeCounts() {
    const counts = {};
    const add = (species, state) => {
      if (state === 'penned') counts[species] = (counts[species] ?? 0) + 1;
    };
    for (const a of this.animals) add(a.species, a.state);
    for (const [id, saved] of Object.entries(game.levels)) {
      if (id !== LEVEL_ID) for (const s of saved.animals) add(s.species, s.state);
    }
    return counts;
  }

  // Abzeichen oben links: Gebiet und wie viele Tiere schon zuhause sind; die Einzelheiten zeigt die Übersicht (I)
  updateHud() {
    const total = Object.values(this.homeCounts()).reduce((s, n) => s + n, 0);
    this.hud.innerHTML = `${LEVEL.name} · 🐾 <b>${total}</b><span class="key">I</span>`;
  }

  // Große Übersicht: alle Tierarten mit Anzahl zuhause, Lebensraum und womit man sie fängt, dazu die Werkzeuge
  showJournal() {
    if (isJournalOpen() || this.leaving) return;
    const home = this.homeCounts();
    const toolImg = (t) => `<img class="tool-img" src="assets/${CATCH_TOOLS[t][0]}.png" alt="">`;
    const cards = SPECIES_ORDER.map((s) => {
      const [name] = ANIMAL_INFO[s] ?? [s];
      const places = Object.values(LEVELS)
        .filter((l) => l.spawn.weights[s] || (s === 'heron' && l.herons))
        .map((l) => l.name);
      const tools = SPECIES[s].catchWith.map((t) => `<span class="catch">${toolImg(t)}${CATCH_TOOLS[t][1]}</span>`).join('');
      const n = home[s] ?? 0;
      return `<div class="card${n ? ' has' : ''}">
        <div class="head">${animalIcon(s, 3.2)}<div><b>${name}</b><span class="home">Zuhause: <span class="num">${n}</span></span></div></div>
        <div class="where">${places.join(', ')}</div>
        <div class="tools">${tools}</div>
        <div class="tip">${CATCH_TIPS[s] ?? ''}</div>
      </div>`;
    });
    const toolRows = Object.keys(CATCH_TOOLS).map((t) => {
      const animals = SPECIES_ORDER.filter((s) => SPECIES[s].catchWith.includes(t));
      return `<div class="tool-row">${toolImg(t)}<b>${CATCH_TOOLS[t][1]}</b><span>${animalIcons(animals, 2.2)}</span></div>`;
    });
    const total = Object.values(home).reduce((s, x) => s + x, 0);
    const html = `<div class="journal-box">
      <h2>Tierbuch · <span class="num">${total}</span> Tiere zuhause</h2>
      <div class="cards">${cards.join('')}</div>
      <h3>Womit fängst du was?</h3>
      <div class="tool-list">${toolRows.join('')}</div>
      <p class="close-hint">Beliebige Taste oder Tippen zum Schließen</p>
    </div>`;
    this.scene.pause();
    openJournal(html, () => this.scene.resume());
  }

  updateToolbar() {
    const id = this.toolId;
    setTouchTool(id);
    this.toolbar.innerHTML = id
      ? `<div class="tool"><img src="assets/${id}.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${TOOLS[id].name}</span></div>`
      : '';
  }

  // text darf HTML enthalten (z. B. Tierbilder)
  showToast(text) {
    this.toast.innerHTML = text;
    this.toast.classList.remove('show');
    void this.toast.offsetWidth; // Animation neu starten
    this.toast.classList.add('show');
  }

  // Jedes Werkzeug hat einen festen Platz an der Hütte (toolSpots im Level). Gibt es mehrere gleiche
  // (die zwei Fallen), kommt es auf den ersten freien davon.
  returnTool(id) {
    const spots = TOOL_SPOTS.filter((s) => s.tool === id).map(({ tx, ty }) => tileToWorld(tx, ty));
    const home = spots.find((s) => !this.pickups.some((p) => !p.collected && Math.hypot(p.x - s.x, p.y - s.y) < 8)) ?? spots[0];
    // erst aufhebbar, wenn der Spieler einmal weggegangen ist (er steht evtl. gerade daneben)
    if (home) this.pickups.push(new Pickup(this, home.x, home.y, id, id, false));
  }

  // Werkzeug aufnehmen; ein getragenes kommt zurück auf seinen Platz an der Hütte (Tausch)
  takeTool(pickup) {
    this.equipTool(pickup.tool);
  }

  // Hände frei: das getragene Werkzeug kommt zurück an seinen Platz an der Hütte
  dropTool() {
    const id = this.toolId;
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.returnTool(id);
    this.updateToolbar();
  }

  // Werkzeug in die Hand nehmen (ein getragenes kommt zurück an die Hütte)
  equipTool(id) {
    if (this.tool) {
      this.tool.destroy();
      this.returnTool(this.toolId);
    }
    this.tool = TOOLS[id].create(this, this.player);
    this.toolId = id;
    this.updateToolbar();
  }

  // Getragene Falle vor dem Spieler auslegen
  // Grünfutter an die nächste Giraffe verfüttern: das Futter ist weg (liegt gleich wieder an der Hütte),
  // und mit etwas Glück (FEED_CHANCE) läuft sie einem danach hinterher
  feedGiraffe() {
    const p = this.player;
    const giraffe = this.animals
      .filter((a) => a.species === 'giraffe' && a.canBeCaughtNow())
      .map((a) => ({ a, d: Math.hypot(a.x - p.x, (a.y - p.y) * 2) }))
      .filter(({ d }) => d < FEED_DIST)
      .sort((u, v) => u.d - v.d)[0]?.a;
    if (!giraffe) {
      this.showToast(`Geh näher an eine ${animalIcon('giraffe')} heran, um sie zu füttern.`);
      return;
    }
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.returnTool('food');
    this.updateToolbar();
    giraffe.faceX = Math.sign(p.x - giraffe.x) || giraffe.faceX; // schaut zum Spieler
    this.munchLeaves(giraffe);
    if (Math.random() < FEED_CHANCE) {
      this.catchAnimal(giraffe);
      this.showToast(`${animalIcon('giraffe', 3.2)} Die Giraffe mag dich! Sie läuft dir jetzt hinterher.`);
    } else {
      this.showToast(`${animalIcon('giraffe', 3.2)} Mmh, lecker! Aber sie bleibt lieber hier. Neues Grünfutter liegt an der Hütte.`);
    }
  }

  // Ein paar grüne Blätter rieseln vom Maul der Giraffe
  munchLeaves(animal) {
    const top = animal.y - animal.sprite.displayHeight * 0.8;
    for (let i = 0; i < 8; i++) {
      const leaf = this.add
        .ellipse(animal.x + animal.faceX * 10 + Phaser.Math.Between(-6, 6), top + Phaser.Math.Between(-4, 4), 4, 2.5, i % 2 ? 0x66932f : 0x9cc850)
        .setDepth(100000);
      this.tweens.add({
        targets: leaf,
        y: leaf.y + Phaser.Math.Between(18, 34),
        x: leaf.x + Phaser.Math.Between(-10, 10),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1100),
        ease: 'Quad.easeIn',
        onComplete: () => leaf.destroy(),
      });
    }
  }

  placeTrap() {
    const p = this.player;
    let x = p.x + p.faceX * 20;
    let y = p.y + p.faceY * 10;
    const { tx, ty } = worldToTile(x, y);
    if (isBlocked(tx, ty)) {
      x = p.x;
      y = p.y;
    }
    const t = { id: game.nextTrapId++, level: LEVEL_ID, x, y, timer: Phaser.Math.FloatBetween(...TRAP_TIME), caught: false, armed: false };
    game.traps.push(t);
    this.traps.set(t.id, new Trap(this, x, y));
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.updateToolbar();
    this.showToast('Falle ausgelegt! Jetzt heißt es abwarten …');
  }

  // Jede ausgelegte Falle wartet für sich (auch, wenn man im anderen Level ist). Läuft ihre Zeit ab,
  // geht ein Tier aus der Umgebung hinein: je näher und je lieber es Köder mag (trapWeight), desto wahrscheinlicher.
  updateTraps(dt) {
    for (const t of [...game.traps]) {
      if (t.caught) this.collectTrap(t);
      else if (!this.pickUpTrap(t)) this.waitTrap(t, dt);
    }
  }

  // Leere ausgelegte Falle wieder aufheben, wenn man darüber läuft (erst, nachdem man sich einmal entfernt hat)
  pickUpTrap(t) {
    if (t.level !== LEVEL_ID) return false;
    const d = Math.hypot(this.player.x - t.x, (this.player.y - t.y) * 2);
    if (!t.armed) {
      if (d > TRAP_REARM_DIST) t.armed = true;
      return false;
    }
    if (d >= TRAP_PICKUP_DIST * 2) return false;
    this.traps.get(t.id)?.destroy();
    this.traps.delete(t.id);
    game.traps = game.traps.filter((g) => g !== t);
    this.equipTool('trap');
    return true;
  }

  // Hinweise am Bildschirmrand: ein Kreis in Richtung jeder ausgelegten Falle, die gerade nicht zu sehen ist.
  // Fallen im anderen Gebiet zeigen blass zum Übergang dorthin. Sitzt ein Tier drin, leuchtet der Hinweis.
  updateTrapMarkers() {
    const cam = this.cameras.main;
    const view = cam.worldView;
    const W = this.scale.width;
    const H = this.scale.height;
    const top = Math.max(MARKER_MARGIN, this.hud.getBoundingClientRect().bottom + 26);
    for (const t of game.traps) {
      let target = t;
      if (t.level !== LEVEL_ID) {
        // direkter Übergang dorthin, sonst der Weg über die Wiese (sie verbindet alle Gebiete)
        const exit = EXITS.find((e) => e.to === t.level) ?? EXITS.find((e) => e.to === 'meadow');
        if (!exit) continue;
        target = tileToWorld(exit.tx, exit.ty);
      }
      // Bildschirmposition (etwas oberhalb des Fußpunkts, wo man die Falle sieht)
      const sx = (target.x - view.x) * cam.zoom;
      const sy = (target.y - 8 - view.y) * cam.zoom;
      const onScreen = sx > 0 && sx < W && sy > 0 && sy < H;
      let el = this.markers.get(t.id);
      if (onScreen) {
        el?.classList.remove('show');
        continue;
      }
      if (!el) {
        el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = '<span class="pointer"></span>';
        this.markerBox.appendChild(el);
        this.markers.set(t.id, el);
      }
      // vom Bildschirmmittelpunkt in Richtung Falle bis an den Rand (oben unterhalb der Anzeigeleiste)
      const dx = sx - W / 2 || 1e-6;
      const dy = sy - H / 2 || 1e-6;
      const kx = (dx > 0 ? W - MARKER_MARGIN - W / 2 : MARKER_MARGIN - W / 2) / dx;
      const ky = (dy > 0 ? H - MARKER_MARGIN - H / 2 : top - H / 2) / dy;
      const k = Math.min(kx, ky);
      el.style.left = `${W / 2 + dx * k}px`;
      el.style.top = `${H / 2 + dy * k}px`;
      el.querySelector('.pointer').style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      el.classList.add('show');
      el.classList.toggle('caught', t.caught);
      el.classList.toggle('elsewhere', t.level !== LEVEL_ID);
    }
    // Hinweise zu Fallen, die es nicht mehr gibt, entfernen
    for (const [id, el] of this.markers) {
      if (game.traps.some((t) => t.id === id)) continue;
      el.remove();
      this.markers.delete(id);
    }
  }

  waitTrap(t, dt) {
    t.timer -= dt;
    if (t.timer > 0) return;
    const here = t.level === LEVEL_ID;
    const list = here ? this.animals : (game.levels[t.level]?.animals ?? []);
    const candidates = list.flatMap((a) => {
      const kind = SPECIES[a.species];
      if (a.state !== 'wild' || !kind.catchWith.includes('trap')) return [];
      const d = Math.hypot(a.x - t.x, (a.y - t.y) * 2);
      return d < TRAP_RADIUS ? [{ a, w: kind.trapWeight * (1 - d / TRAP_RADIUS) ** 2 }] : [];
    });
    if (!candidates.length) {
      t.timer = Phaser.Math.FloatBetween(...TRAP_RETRY);
      return;
    }
    let r = Math.random() * candidates.reduce((s, c) => s + c.w, 0);
    const { a } = candidates.find((c) => (r -= c.w) <= 0) ?? candidates[0];
    if (here) {
      a.enterTrap(t.x, t.y);
      this.traps.get(t.id).showCaught();
    } else {
      Object.assign(a, { state: 'trapped', x: t.x, y: t.y }); // gespeicherter Stand des anderen Levels
    }
    t.caught = true;
    // Schnapp-Geräusch, auch wenn die Falle gerade nicht zu sehen ist (sie meldet sich ja auch mit einem Hinweis)
    if (this.cache.audio.exists('trap')) this.sound.play('trap', { volume: TRAP_VOLUME });
    const where = here ? '' : ` (${LEVELS[t.level].name})`;
    this.showToast(`Etwas ist in die Falle gegangen!${where} Geh hin und schau nach …`);
  }

  // Tier abholen, wenn der Spieler an der vollen Falle ist: es folgt ihm, die Falle kehrt zur Hütte zurück
  collectTrap(t) {
    const trap = this.traps.get(t.id);
    if (!trap || Math.hypot(this.player.x - t.x, (this.player.y - t.y) * 2) >= TRAP_PICKUP_DIST * 2) return;
    // das Tier, das in genau dieser Falle sitzt
    const animal = this.animals
      .filter((a) => a.state === 'trapped')
      .sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))[0];
    if (animal) this.catchAnimal(animal);
    const surprise = animal ? `${animalIcon(animal.species, 3.2)} war in der Falle! ` : '';
    trap.destroy();
    this.traps.delete(t.id);
    game.traps = game.traps.filter((g) => g !== t);
    this.returnTool('trap');
    this.showToast(`${surprise}Die Falle liegt wieder an der Hütte.`);
  }

  // Ein wildes Tier fangen: es stellt sich hinten in die Reihe
  catchAnimal(animal) {
    animal.catch();
    this.followers.push(animal);
    // Herdentiere: die anderen der Herde rennen vor Schreck davon und verschwinden
    if (animal.herd) {
      const mates = this.animals.filter((a) => a !== animal && a.herd === animal.herd && a.state === 'wild' && a.scatter);
      for (const a of mates) a.scatter();
      if (mates.length) this.showToast(`Die anderen ${animalIcon(animal.species)} sind vor Schreck davongerannt!`);
    }
    // kurzer Tierruf (falls es für diese Art einen gibt)
    const sound = `animal_${animal.species}`;
    if (this.cache.audio.exists(sound)) this.sound.play(sound, { volume: ANIMAL_VOLUME });
  }

  // Hintergrundgeräusch des Levels starten; ein anderes (oder in einem Level ohne) sofort beenden.
  // Die Dateien sind groß: sie werden erst beim Betreten des Levels im Hintergrund geladen, damit das Spiel schnell startet.
  startAmbient() {
    const key = LEVEL.ambient;
    if (ambient && ambient.key !== key) {
      ambient.destroy();
      ambient = null;
    }
    if (!key || ambient) return;
    if (!this.cache.audio.exists(key)) {
      this.load.audio(key, `assets/sounds/${key}.mp3`);
      this.load.once('complete', () => {
        if (this.sys.isActive() && LEVEL.ambient === key) this.startAmbient();
      });
      this.load.start();
      return;
    }
    ambient = this.sound.add(key, { loop: true, volume: 0 });
    ambient.play();
    // Lautstärke je Gebiet (ambientVolume in levels.js), sonst die normale
    this.tweens.add({ targets: ambient, volume: LEVEL.ambientVolume ?? AMBIENT_VOLUME, duration: AMBIENT_FADE });
  }

  // Level verlassen: Stand merken, folgende Tiere mitnehmen. Jedes Level hat seine eigenen Werkzeuge:
  // ein getragenes kommt nicht mit, sondern zurück an seinen Platz an der Hütte (sonst gäbe es es doppelt).
  leaveLevel(exit) {
    this.leaving = true;
    let returned = null;
    if (this.toolId) {
      returned = TOOLS[this.toolId].name;
      this.returnTool(this.toolId);
      this.tool.destroy();
      this.tool = null;
      this.toolId = null;
    }
    game.levels[LEVEL_ID] = {
      animals: this.animals
        .filter((a) => a.state !== 'following' && !(a.species === 'heron' && a.state === 'wild')) // wilde Reiher fliegen weiter
        .map((a) => ({ species: a.species, state: a.state, x: a.x, y: a.y, life: a.life })),
      pickups: this.pickups.filter((p) => !p.collected).map((p) => ({ tool: p.tool, x: p.x, y: p.y })),
    };
    game.followers = this.followers.map((a) => a.species);
    game.tool = null;
    // Hintergrundgeräusch ausblenden, wenn das nächste Level ein anderes hat
    if (ambient && LEVELS[exit.to].ambient !== ambient.key) this.tweens.add({ targets: ambient, volume: 0, duration: 240 });
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.restart({ level: exit.to, arrive: exit.arrive, returned }),
    );
  }

  // Wegweiser: zeigt mit Pfeilen, in welcher Richtung was liegt
  signEntries(sign) {
    const entries = [];
    for (const exit of EXITS) {
      const species = ALL_SPECIES.filter((s) => LEVELS[exit.to].spawn.weights[s]);
      entries.push([tileToWorld(exit.tx, exit.ty), `${exit.label} – ${animalIcons(species)}`]);
    }
    for (const { area: a, name, species } of ENCLOSURES) {
      entries.push([
        tileToWorld((a.tx0 + a.tx1) / 2, (a.ty0 + a.ty1) / 2),
        species ? `${name} – ${animalIcons(species)}` : `${name} – alle Tiere außer ${animalIcon('fish')}`,
      ]);
    }
    // eigener Fischteich nur, wenn er nicht schon in einem Gehege liegt
    const mid = FISHPOND_TILES[Math.floor(FISHPOND_TILES.length / 2)];
    if (mid && !inPen(mid.tx, mid.ty)) entries.push([tileToWorld(mid.tx, mid.ty), `Fischteich – für ${animalIcon('fish')}`]);
    if (SHED) entries.push([tileToWorld(SHED.tx + 1, SHED.ty + 1), 'Werkzeughütte – Kescher und Lasso']);

    const arrows = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
    return entries.map(([p, text]) => {
      const i = Math.round(Math.atan2(p.y - sign.y, p.x - sign.x) / (Math.PI / 4));
      return `<div><span class="arrow">${arrows[(i + 8) % 8]}</span>${text}</div>`;
    });
  }

  // Seilnetz über einem Gehege, auf Höhe der Netzstangen. Es liegt über allem, was im Gehege ist,
  // aber hinter allem, was davor steht.
  drawNetRoof({ tx0, tx1, ty0, ty1 }) {
    const H = 32; // Höhe der Netzstangen
    const g = this.add.graphics().setDepth(tileToWorld(tx1 + 0.5, ty1 + 0.5).y + 1);
    const at = (tx, ty) => {
      const p = tileToWorld(tx, ty);
      return [p.x, p.y - H];
    };
    g.lineStyle(1, 0xd8c89a, 0.55);
    for (let t = tx0 - 0.5; t <= tx1 + 0.5; t += 0.5) g.lineBetween(...at(t, ty0 - 0.5), ...at(t, ty1 + 0.5));
    for (let t = ty0 - 0.5; t <= ty1 + 0.5; t += 0.5) g.lineBetween(...at(tx0 - 0.5, t), ...at(tx1 + 0.5, t));
    // Knoten an den Kreuzungen
    g.fillStyle(0x8a7a5a, 0.6);
    for (let a = tx0 - 0.5; a <= tx1 + 0.5; a += 0.5) for (let c = ty0 - 0.5; c <= ty1 + 0.5; c += 0.5) g.fillRect(...at(a, c), 1, 1);
  }

  // Tafel unten rechts: am Wegweiser die Richtungen, an einem Gehege-Schild die erlaubten Tiere mit ihren Fußspuren
  updateSign() {
    const p = this.player;
    const near = (s) => Math.hypot(p.x - s.x, (p.y - s.y) * 2) < SIGN_DIST;
    const sign = this.signs.find(near) ?? this.enclosureSigns.find(near) ?? null;
    if (sign === this.shownSign) return;
    this.shownSign = sign;
    if (!sign) {
      this.signPanel.classList.remove('show');
      return;
    }
    this.signPanel.innerHTML = sign.enclosure
      ? this.enclosureInfo(sign.enclosure)
      : `<b>Wegweiser · ${LEVEL.name}</b>${this.signEntries(sign).join('')}`;
    this.signPanel.classList.add('show');
  }

  enclosureInfo(enclosure) {
    const rows = enclosure.species.map((s) => {
      const [name, text] = ANIMAL_INFO[s] ?? [s, ''];
      return `<div class="print-row"><img class="print" src="assets/print_${s}.png" alt="">${animalIcon(s)}<span><b>${name}</b>${text}</span></div>`;
    });
    return `<b>${enclosure.name} · Hier wohnen:</b>${rows.join('')}`;
  }

  // Läuft man mit einem Tier in ein Gehege, das nicht zu ihm passt: kurzer Hinweis
  checkWrongHome(dt) {
    this.wrongHomeTimer -= dt;
    if (this.wrongHomeTimer > 0) return;
    for (const a of this.followers) {
      const enclosure = a.enclosureFullyAt(a.x, a.y);
      if (!enclosure || accepts(enclosure, a.species)) continue;
      this.showToast(
        `${animalIcon(a.species, 3)} wohnt nicht hier! Hier (${enclosure.name}) dürfen nur ${animalIcons(enclosure.species)} hinein. Schau aufs Schild am Tor!`,
      );
      this.wrongHomeTimer = WRONG_HOME_HINT;
      return;
    }
  }

  // Spieler und folgende Tiere öffnen das Tor; ist der Eingang frei, schließt es sich wieder
  updateGate(dt) {
    const walkers = [this.player, ...this.followers];
    for (const group of this.gateGroups) {
      // Abstand in Kachel-Proportionen (Kacheln sind halb so hoch wie breit)
      const near = walkers.some((w) => group.sprites.some((g) => Math.hypot(w.x - g.x, (w.y - g.y) * 2) < GATE_OPEN_DIST));
      if (near) {
        group.closeTimer = GATE_CLOSE_DELAY;
        if (!group.open) this.setGateOpen(group, true);
      } else if (group.open) {
        group.closeTimer -= dt;
        if (group.closeTimer <= 0) this.setGateOpen(group, false);
      }
    }
  }

  setGateOpen(group, open) {
    group.open = open;
    this.tweens.killTweensOf(group.sprites);
    this.tweens.add({ targets: group.sprites, alpha: open ? 0 : 1, duration: open ? 150 : 300 });
  }

  update(_time, delta) {
    if (this.leaving) return;
    // Begrenzen, damit nach einem Tab-Wechsel kein Riesensprung passiert
    const dt = Math.min(delta, 50) / 1000;
    this.player.update(dt);

    // Übergang in ein anderes Level?
    const { tx, ty } = worldToTile(this.player.x, this.player.y);
    const exit = exitAt(tx, ty);
    if (exit) {
      this.leaveLevel(exit);
      return;
    }

    for (const p of [...this.pickups]) if (p.checkCollect(this.player)) this.takeTool(p);
    if (this.tool && this.handSpots.some((h) => Math.hypot(this.player.x - h.x, this.player.y - h.y) < HAND_DIST)) this.dropTool();
    this.pickups = this.pickups.filter((p) => !p.collected);
    this.tool?.update(dt);

    // Wilde Tiere fangen, die der Spieler berührt oder mit einem Werkzeug erwischt
    for (const a of this.animals) {
      if (a.canBeCaughtWith('touch') && Math.hypot(this.player.x - a.x, this.player.y - a.y) < CATCH_DIST) this.catchAnimal(a);
    }
    if (this.tool) for (const a of this.tool.caughtBy(this.animals)) this.catchAnimal(a);
    this.followers.forEach((s, i) => (s.followGap = FOLLOW_GAP * (i + 1)));

    for (const a of this.animals) a.update(dt, this.player);
    this.updateTraps(dt);
    this.updateTrapMarkers();
    this.updateSpawner(dt);
    this.updateHerons(dt);
    this.updateGate(dt);
    this.updateSign();
    this.checkWrongHome(dt);

    // Tiere, die zuhause angekommen sind, folgen nicht mehr
    const before = this.followers.length;
    this.followers = this.followers.filter((s) => s.state === 'following');
    if (this.followers.length !== before) this.updateHud();
  }
}
