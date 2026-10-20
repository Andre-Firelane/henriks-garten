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
  EXITS,
  FISHPOND_TILES,
  NEAR_WATER,
  NEAR_TREES,
  NEAR_BAMBOO,
  TIGER_ZONE,
  NEAR_PATH,
  NEAR_PATH_TILES,
  JUNGLE_TREES,
  HOT_SPRING_TILES,
  setLevel,
  groundAt,
  grassAt,
  outerWaterCorners,
  objectAt,
  charAt,
  fenceAxisAt,
  isBlocked,
  isBlockedPoint,
  isFishpond,
  exitAt,
  inPen,
  nearEnclosure,
  accepts,
  BRIDGES,
  KOI_WATER,
  buildings,
  buildingAt,
  CAR_BODY,
  GATE_TILES,
  enclosureAt,
  penCapacity,
  penQuotas,
  hasSlots,
  quotaKey,
  isUpgraded,
  upgradeCost,
  bridgeArch,
} from '../world/map.js';
import { LEVELS } from '../world/levels.js';
import { game, resetGame } from '../state.js';
import Player from '../player/Player.js';
import Animal, { SPECIES, CATCH_DIST, FOLLOW_GAP, isCatchable, SKINS } from '../animals/Animal.js';
import Fish from '../animals/Fish.js';
import Squirrel from '../animals/Squirrel.js';
import Frog from '../animals/Frog.js';
import Mole from '../animals/Mole.js';
import Heron from '../animals/Heron.js';
import Antelope from '../animals/Antelope.js';
import Zebra from '../animals/Zebra.js';
import Meerkat from '../animals/Meerkat.js';
import Lion from '../animals/Lion.js';
import Giraffe from '../animals/Giraffe.js';
import Panda from '../animals/Panda.js';
import Tiger from '../animals/Tiger.js';
import Peacock from '../animals/Peacock.js';
import Orangutan, { WAVE_DIST } from '../animals/Orangutan.js';
import Macaque from '../animals/Macaque.js';
import Cat from '../animals/Cat.js';
import Fox from '../animals/Fox.js';
import Sheep from '../animals/Sheep.js';
import Koi from '../animals/Koi.js';
import KoiFoodTool from '../tools/KoiFoodTool.js';
import ParkFoodTool from '../tools/ParkFoodTool.js';
import { VisitorCrowd } from '../visitors/Visitor.js';
import { AWAY_ICE_PER_VISITOR_MINUTE, awayHearts, maxVisitors, parkScore, splitHearts, penCount, isFull, releaseHearts } from '../world/visitors.js';
import { EVENTS, RARE_EVENT_CHANCE, activeOverlap, babyPlan, eventState, formatTime, isActive, startEvent } from '../world/events.js';
import { isEventsOpen, openEvents } from '../ui/eventsPanel.js';
import Crocodile from '../animals/Crocodile.js';
import { blockedAt } from '../world/collision.js';
import Pickup from '../world/Pickup.js';
import { roundedTexture } from '../world/roundedTiles.js';
import Net from '../tools/Net.js';
import Lasso from '../tools/Lasso.js';
import TrapTool from '../tools/TrapTool.js';
import FoodTool from '../tools/FoodTool.js';
import BallTool from '../tools/BallTool.js';
import Trap from '../world/Trap.js';
import { animalIcon, animalIcons } from '../ui/icons.js';
import { touchHandlers, setTouchTool } from '../ui/touch.js';
import { openJournal, isJournalOpen } from '../ui/journal.js';
import { openTravelMap, isTravelMapOpen } from '../ui/travelMap.js';
import { openToolChest, isToolChestOpen } from '../ui/toolChest.js';

// Ganzzahliger Zoom hält die Pixel-Art scharf: etwa 360 Welt-Pixel Bildhöhe
const VIEW_H = 360;
// Reihenfolge der Tierarten in der Anzeige
const ALL_SPECIES = ['peacock', 'orangutan', 'tiger', 'sheep', 'cat', 'deer', 'stag', 'fish', 'koi', 'frog', 'mole', 'heron', 'flamingo', 'squirrel', 'fox', 'antelope', 'zebra', 'meerkat', 'lion', 'crocodile', 'giraffe', 'panda', 'macaque'];
const GATE_OPEN_DIST = 44; // so nah muss man ans Tor, damit es aufgeht
const GATE_CLOSE_DELAY = 0.5; // Sekunden, bis es nach dem Durchgehen wieder erscheint
const SIGN_DIST = 50; // so nah muss man an den Wegweiser, damit er etwas anzeigt
const WRONG_HOME_HINT = 6; // Sekunden zwischen zwei Hinweisen "falsches Gehege"
const SIGN_INNER_W = 38; // helle Tafel des Torschilds (Welt-Pixel), darauf die Tierbilder
const SIGN_ICON_H = 22;

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
  koi: 'Streu am Ufer Fischfutter ins Wasser – dann kommen sie hoch und schnappen. Schnell keschern!',
  mole: 'Nur wenn er aus seinem Hügel schaut.',
  squirrel: 'Nur wenn es vom Baum herunterkommt – halte etwas Abstand.',
  heron: 'Nur wenn er am Wasser gelandet ist.',
  flamingo: 'Nur beim Flamingo-Flug – und nur, wenn er gelandet ist.',
  deer: 'Scheu: aus der Ferne mit dem Lasso.',
  stag: 'Selten und scheu: aus der Ferne mit dem Lasso.',
  fox: 'Nur mit der Falle.',
  antelope: 'Lebt in Herden – fängst du eine, rennen die anderen weg.',
  zebra: 'Beim Trinken am Wasserloch flieht es nicht, dann kannst du es auch berühren.',
  meerkat: 'Schleich dich von hinten an – der Wächter sieht nur, was vor ihm ist.',
  lion: 'Kraulen, solange er schnarcht (Zzz). Hören die Zzz auf, bleib stehen und warte weit weg!',
  crocodile: 'Wie beim Fisch: warte auf die Luftblasen im Wasserloch und wirf das Lasso, wenn der Kopf auftaucht.',
  giraffe: 'Füttere sie mit Grünfutter, dann folgt sie dir vielleicht.',
  panda: 'Mit Grünfutter folgt er dir – aber mach einen Bogen um Bambus und hohes Gras!',
  peacock: 'Scheu – kommst du zu nah, rennt er weg oder fliegt sogar davon. Warte, bis er ein Rad schlägt: dann kannst du ihn berühren oder keschern.',
  orangutan: 'Sitzt oben im Urwaldbaum. Stell dich ohne Werkzeug darunter und warte, bis er winkt – dann schnell zurückwinken! Dreimal geschafft, kommt er herunter.',
  tiger: 'Streift als dunkler Schatten durch den Bambus. Roll den Ball hin, geh ein Stück weg und halt Abstand, wenn er neugierig schaut. Er spielt nur kurz und flitzt dann los – schnell das Lasso!',
  macaque: 'Aus der heißen Quelle kriegst du ihn nicht. Warte, bis er herausspringt – dann schnell das Lasso!',
};

// freilaufende Tiere im Tierpark (Pfauen): so viele dürfen es höchstens sein (für die Übersicht), sonst null
const freeCap = (species) => (LEVELS.park.enclosures ?? []).find((e) => e.free && e.species?.includes(species))?.slots[0] ?? null;

// Für die Schilder an den Gehegetoren: Name und was man an der Fußspur erkennt (zum Lernen)
const ANIMAL_INFO = {
  sheep: ['Schaf', 'Paarhufer: Jeder Fuß hat zwei Hufhälften.'],
  mole: ['Maulwurf', 'Breite Grabhände mit fünf kräftigen Krallen.'],
  cat: ['Katze', 'Vier Zehen und ein großer Ballen. Die Krallen bleiben beim Laufen eingezogen.'],
  frog: ['Frosch', 'Lange, dünne Finger mit runden Haftscheiben an den Spitzen.'],
  fish: ['Fisch', 'Hat keine Füße – Fische schwimmen mit ihren Flossen.'],
  koi: ['Koi', 'Hat keine Füße – Koi schwimmen mit ihren Flossen. Am Maul haben sie zwei Barteln.'],
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
  macaque: ['Japanmakak', 'Kleine Hände und Füße mit fünf langen Fingern – fast wie bei uns.'],
  panda: ['Panda', 'Breite Tatzen mit fünf Zehen und einem sechsten „Daumen“ zum Bambushalten.'],
  peacock: ['Pfau', 'Drei lange Zehen nach vorne und eine nach hinten – wie beim Huhn, nur größer.'],
  orangutan: ['Orang-Utan', 'Lange Hände und Füße mit einem Daumen auch am Fuß – damit hält er sich an Ästen fest.'],
  tiger: ['Tiger', 'Riesige Katzenpfote: vier Zehen und ein breiter Ballen. Die Krallen bleiben eingezogen.'],
  heron: ['Fischreiher', 'Drei lange Zehen nach vorne und eine nach hinten.'],
  flamingo: ['Flamingo', 'Drei Zehen nach vorne mit Schwimmhäuten dazwischen.'],
};

// Falle: wie lange es dauert, bis ein Tier hineingeht, und aus welcher Umgebung Tiere kommen
const TRAP_TIME = [10, 90]; // Sekunden (zufällig)
const TRAP_RETRY = [10, 30]; // war kein Tier in der Nähe, nach so vielen Sekunden erneut versuchen
const TRAP_RADIUS = 360; // etwa 8 Kacheln
const TRAP_PICKUP_DIST = 24;
const HAND_DIST = 18; // so nah muss man an den "Hände frei"-Platz (wie bei Werkzeugen)
const CHEST_DIST = 40; // so nah muss man an der Werkzeug-Kiste stehen (auch am Futterautomaten)
const PEN_FEED_DIST = 80; // so nah vor dem Spieler muss ein Gehege sein, um Futter hineinzuwerfen
const FEED_TIME = [8, 12]; // so lange fressen die Tiere
const FEED_GAP = 22; // so viel Abstand halten die Tiere beim Fressen voneinander
// Diese Tiere kommen nicht zum Futter (Wasser- und Flugtiere)
const NO_PEN_FEED = ['fish', 'koi', 'crocodile', 'heron', 'flamingo', 'frog'];
const HUT_ROOF_ALPHA = 0.12; // so durchsichtig wird das Dach, wenn man in der Hütte ist
const HUT_FRONT_ALPHA = 0.3; // ... und die vorderen Wände
const ROOF_ALPHA = { cathouse: 0.55 };
// obere Ecke der Grundfläche im Dachbild, falls nicht wie bei den Hütten (siehe officeRoofAnchor in tools/make-sprites.js)
const ROOF_ANCHOR = { office: [283, 90] }; // Glasdach: auch von außen halb durchsichtig, damit man die Katzen sieht
const CAR_DIST = 72; // so nah muss man am Auto stehen, um mit der Aktionstaste die Weltkarte zu öffnen
const TOOL_SWITCH_LOCK = 2500; // Millisekunden nach dem Aufheben, in denen man nicht gleich wieder tauscht oder ablegt
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
const KOI_FEED_DIST = 50; // so nah muss Wasser vor dem Spieler sein, um Fischfutter zu streuen
const KOI_CALLED = 3; // höchstens so viele wilde Koi kommen zum Futter (die nächsten)
const KOI_CALL_DIST = 170; // nur Koi in diesem Umkreis (Welt-Pixel, etwa 5 Kacheln) riechen das Futter
const KOI_FEED_PAUSE = 1500; // Millisekunden bis zum nächsten Streuen
const KOI_FOOD_FLOAT = 15000; // Millisekunden, die das Futter auf dem Wasser treibt
const DESPAWN_DIST = 300;
const ANIMAL_VOLUME = 0.45; // Lautstärke der Tierrufe beim Fangen
// Tierpark-Atmosphäre: ab und zu ruft ein Tier aus dem Gehege, an dem man gerade steht (leiser als beim Fangen)
const PEN_CALL_EVERY = [4, 8]; // Sekunden zwischen zwei Rufen
const PEN_CALL_DIST = 190; // so nah muss man am Gehege sein (in Kachel-Proportionen, etwa 6 Kacheln)
const PEN_CALL_VOLUME = 0.16; // ganz nah; weiter weg leiser
// welcher Ruf zu welcher Tierart gehört (sonst animal_<Art>, falls es den gibt)
const PEN_CALLS = { lion: 'lion_roar', stag: null, deer: null };
// Tierarten ohne eigenen Ton nehmen diesen (beim Fangen und als Ruf aus dem Gehege)
const CALL_FALLBACK = { tiger: 'lion_roar' };
const WHOOSH_VOLUME = 0.35; // Lautstärke des Schwungs beim Einsetzen eines Werkzeugs
const TRAP_VOLUME = 0.5; // Lautstärke, wenn die Falle zuschnappt
const CAR_VOLUME = 0.6; // Lautstärke des Autos bei der Schnellreise
const AMBIENT_VOLUME = 0.55; // Lautstärke der Hintergrundgeräusche (z. B. Wald)
const AMBIENT_FADE = 1500; // Millisekunden zum Einblenden

// Das laufende Hintergrundgeräusch überdauert Levelwechsel (die Szene startet dabei neu)
let ambient = null; // nur so weit weg vom Spieler verschwinden Tiere (nicht vor seinen Augen)

// Reihenfolge der Tierarten im Zähler: alle fangbaren, die in irgendeinem Level vorkommen
const SPECIES_ORDER = ALL_SPECIES.filter(
  (s) =>
    isCatchable(SPECIES[s]) &&
    s === 'flamingo' || Object.values(LEVELS).some((level) => level.spawn.weights[s] || (s === 'heron' && level.herons)),
);

// Werkzeuge: wie sie erzeugt werden und was die Anzeige dazu sagt. Man trägt immer nur eins.
const ACTION_KEY = 'E';
// Reittier-Event: Henrik reitet in jeder Welt ein anderes Tier (nicht im Tierpark)
// Flamingo-Flug (Event): in diesen Welten fliegen Flamingos ein, etwa neunmal so oft wie Reiher
const FLAMINGO_WORLDS = ['meadow', 'forest', 'savanna'];
const PEACOCK_CALL_EVERY = [20, 40]; // so oft schallt der Ruf eines wilden Pfaus durchs ganze Gebiet (Sekunden)
const PEACOCK_CALL_VOLUME = 0.35;
const MAX_ORANGUTANS = 2; // so viele Orang-Utans sitzen höchstens gleichzeitig in den Urwaldbäumen
const MAX_TIGERS = 2; // so viele Tiger streifen höchstens gleichzeitig durch den Bambus
const TIGER_LURE_DIST = 150; // so nah muss man mit dem Ball an einem Tiger-Schemen stehen (aber nicht zu nah, siehe Tiger.js)
const BALL_ROLL = [56, 44, 32]; // so weit rollt der Ball auf den Tiger zu (der erste freie Platz)
const BALL_KEEP = 20000; // so lange bleibt der Ball liegen, wenn der Tiger nicht mehr spielt (Millisekunden)
const MAX_MACAQUES = 6; // so viele Japanmakaken baden höchstens in den wilden Quellen (sie verteilen sich)
const FLAMINGO_EVERY = [6, 12]; // Sekunden zwischen zwei Flamingos (Reiher: 50–110)
const FLAMINGO_LAND = 0.6; // so oft landen sie (am Wasser)
const RIDES = { meadow: 'ride_meadow', forest: 'ride_forest', savanna: 'ride_savanna', asia: 'ride_asia' };
const TOOLS = {
  net: {
    create: (scene, player) => new Net(scene, player),
    name: 'Kescher',
    catches: ['cat', 'fish', 'koi', 'frog', 'mole', 'squirrel', 'heron', 'meerkat', 'peacock'],
    hint: (list) => `Damit fängst du ${animalIcons(list)}`,
  },
  lasso: {
    create: (scene, player) => new Lasso(scene, player),
    name: 'Lasso',
    catches: ['deer', 'stag', 'antelope', 'zebra', 'crocodile', 'sheep', 'heron', 'tiger'],
    hint: (list) => `Damit fängst du ${animalIcons(list)} aus der Ferne`,
  },
  trap: {
    create: (scene, player) => new TrapTool(scene, player),
    name: 'Falle',
    hint: 'Leg sie aus und warte, bis ein Tier hineingeht',
  },
  parkfood: {
    create: (scene, player) => new ParkFoodTool(scene, player),
    name: 'Futter',
    hint: 'Wirf es am Zaun ins Gehege – dann kommen die Tiere zum Fressen',
  },
  koifood: {
    create: (scene, player) => new KoiFoodTool(scene, player),
    name: 'Fischfutter',
    hint: `Streu es am Ufer ins Wasser – dann kommen die ${animalIcon('koi')} hoch`,
  },
  ball: {
    create: (scene, player) => new BallTool(scene, player),
    name: 'Ball',
    hint: `Stell dich damit still vor einen Schatten im Bambus – dann wird der ${animalIcon('tiger')} neugierig. Danach hast du gleich das Lasso`,
  },
  food: {
    create: (scene, player) => new FoodTool(scene, player),
    name: 'Grünfutter',
    catches: ['giraffe', 'panda'],
    hint: (list) => `Geh nah an ${list.map((s) => animalIcon(s)).join(' oder ')} heran und füttere sie`,
  },
};

export default class GardenScene extends Phaser.Scene {
  constructor() {
    super('Garden');
  }

  // data.level: welches Level; data.arrive: Ankunftskachel nach einem Übergang
  create(data = {}) {
    // Startlevel lässt sich zum Ausprobieren auch über die Adresse wählen, z. B. ?level=forest (sonst geht es im Tierpark vor dem Haupthaus los)
    const urlLevel = new URLSearchParams(location.search).get('level');
    setLevel(data.level ?? (LEVELS[urlLevel] ? urlLevel : 'park'));
    this.leaving = false;
    this.signs = [];
    this.houseFront = new Map(); // je Gebäude die vorderen Wände (werden durchsichtig, wenn man drin ist)

    const ground = []; // Bodenkacheln [x, y, Bild]: werden unten in wenige große Flächen gemalt (schneller auf dem Tablet)
    const firstStatic = this.children.list.length; // ab hier: feste Dinge der Karte (werden außerhalb des Bildes ausgeblendet)
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        if (charAt(tx, ty) === ' ') continue; // außerhalb der Karte: nichts (die Karte muss nicht rechteckig sein)
        const { x, y } = tileToWorld(tx, ty);
        // Boden liegt immer ganz unten. Wasserecken, die ins Land ragen, werden abgerundet; darunter Gras.
        const corners = outerWaterCorners(tx, ty);
        if (corners) {
          ground.push([x, y, grassAt(tx, ty)]);
          ground.push([x, y, roundedTexture(this, groundAt(tx, ty), corners)]);
        } else {
          ground.push([x, y, groundAt(tx, ty)]);
        }

        const obj = objectAt(tx, ty);
        if (obj?.bridge) continue; // Brücken werden unten am Stück gezeichnet
        if (obj?.fence) {
          const imgs = this.addFence(tx, ty, obj);
          // vordere Hüttenwände (zur Kamera hin) werden durchsichtig, wenn man drin ist
          const h = obj.fence.kind === 'hut' ? buildingAt(tx, ty) : null;
          if (h && (ty === h.ty1 || tx === h.tx1)) {
            if (!this.houseFront.has(h)) this.houseFront.set(h, []);
            this.houseFront.get(h).push(...imgs);
          }
        }
        else if (obj?.invisible) {
          // nur fest, nichts zu sehen (z. B. die Seiten des großen Schreibtischs)
        } else if (obj?.key === 'signpost_post') {
          this.signs.push({ x, y });
          this.drawSignBoards(x, y, tx, ty);
        } else if (obj) {
          const key = obj.styled ? `${obj.key}_${buildingAt(tx, ty, 1)?.style}` : obj.key; // Einrichtung passend zur Hütte (auch außen an der Wand)
          // depthShift nur in Hütten (z. B. die Kiste vor der Rückwand); draußen gilt die normale Tiefe, sonst steht sie vor der Spielfigur
          const shift = buildingAt(tx, ty) || obj.styled ? obj.depthShift ?? 0 : 0;
          const img = this.add.image(x, y, key).setOrigin(0.5, obj.originY).setDepth(obj.floor ? -99990 : y + shift);
          if (obj.chest && obj.styled && !buildingAt(tx, ty)) {
            // Regal außen vor der Hütte: ein Stück vor die Wand gerückt, damit der Dachüberstand Kescher und Lasso nicht verdeckt
            img.setPosition(x - 19, y + 10).setDepth(y - 4);
          }
          if (obj.corner) {
            // in die Ecke rücken: ein Stück zu den Wänden hin, die neben der Kachel stehen
            const wall = (dx, dy) => objectAt(tx + dx, ty + dy)?.fence?.kind === 'hut';
            const du = wall(1, 0) ? 1 : wall(-1, 0) ? -1 : 0;
            const dv = wall(0, 1) ? 1 : wall(0, -1) ? -1 : 0;
            img.setPosition(x + (du - dv) * 32 * 0.35, y + (du + dv) * 16 * 0.35);
          }
          // Antippen geht nur, wenn man direkt daneben steht (wie mit der Aktionstaste)
          if (obj.chest) {
            img.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
              const chest = this.chestAt(tx, ty);
              if (chest && this.nearChest === chest) this.openChest(chest);
              else this.tooFar();
            });
          }
          if (obj.computer) img.setInteractive({ useHandCursor: true }).on('pointerdown', () => (this.nearComputer ? this.openEventsPanel() : this.tooFar()));
        }
      }
    }

    this.cullables = this.children.list.slice(firstStatic).filter((o) => o.type === 'Image' || o.type === 'Text');
    this.cullView = null;
    this.bakeGround(ground);

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
    // Gebäude (Hütte, Katzenhäuschen ...): Tür (geht auf wie ein Gehegetor) und Dach über dem ganzen Raum.
    // Ist das Gebäude zugleich ein Gehege, gehört die Tür zum Gehege (z. B. die Glastür des Katzenhäuschens).
    this.houses = [];
    for (const h of buildings()) {
      const front = this.houseFront.get(h) ?? [];
      const penGates = ENCLOSURES.flatMap((e) => e.gates);
      const doors = GATE_TILES.filter(({ tx, ty }) => tx >= h.tx0 && tx <= h.tx1 && ty >= h.ty0 && ty <= h.ty1 && !penGates.some((g) => g.tx === tx && g.ty === ty));
      const group = {
        sprites: doors.map(({ tx, ty, vertical }) => {
          const { x, y } = tileToWorld(tx, ty);
          const img = this.add.image(x, y, `gate_door_${h.style}_${vertical ? 'y' : 'x'}`);
          return img.setOrigin(0.5, (img.height - 20) / img.height).setDepth(y);
        }),
        open: false,
        closeTimer: 0,
      };
      this.gateGroups.push(group);
      front.push(...group.sprites);
      // obere Ecke der Grundfläche liegt im Dachbild bei ROOF_ANCHOR (Hütten: 184, 100)
      const top = tileToWorld(h.tx0, h.ty0);
      const bottom = tileToWorld(h.tx1, h.ty1);
      const [ax, ay] = ROOF_ANCHOR[h.style] ?? [184, 100];
      const roof = this.add.image(top.x, top.y - TILE_H / 2, `hutroof_${h.style}`);
      roof.setOrigin(ax / roof.width, ay / roof.height).setDepth(bottom.y + TILE_H / 2 + 1);
      roof.setAlpha(ROOF_ALPHA[h.style] ?? 1);
      this.houses.push({ h, roof, front, inside: false });
    }

    // Schilder mit den Bildern der erlaubten Tiere, am Zaun neben dem Tor
    this.enclosureSigns = ENCLOSURES.filter((e) => e.sign).map((e) => {
      const { x, y } = tileToWorld(e.sign.tx, e.sign.ty);
      // immer vor dem Tor (und dem Zaun) zeichnen, damit nichts das Schild verdeckt
      let front = Math.max(y, ...e.gates.map((g) => tileToWorld(g.tx, g.ty).y)) + 2;
      // signOnRoof: das Schild sitzt oben auf dem Dach des Gebäudes (z. B. Katzenhaus), damit man es von weitem sieht
      const house = e.signOnRoof ? buildingAt(e.tiles[0].tx, e.tiles[0].ty) : null;
      let sx = x, sy = y;
      // Tor in einer Hauswand (Katzenhaus): das Schild hängt an der Wand neben der Tür, vor dem (durchsichtigen) Dach
      const wall = !house && e.gates[0] && buildingAt(e.gates[0].tx, e.gates[0].ty);
      if (wall) front = tileToWorld(wall.tx1, wall.ty1).y + TILE_H + 2;
      if (house) {
        const c = tileToWorld((house.tx0 + house.tx1) / 2, (house.ty0 + house.ty1) / 2);
        sx = c.x;
        sy = c.y - 78; // über dem First
        front = tileToWorld(house.tx1, house.ty1).y + TILE_H + 2; // vor dem Dach
      }
      // ohne Zaun (Teich ohne Zaun): das Schild steht auf einem eigenen Holzpfosten
      if (!e.gates.length && !house) {
        this.add.rectangle(sx, sy - 6, 3, 18, 0x8a5a30).setStrokeStyle(1, 0x3c2814).setDepth(front - 0.1);
      }
      const board = this.add.image(sx, sy - 20, 'esign_board').setScale(0.5).setDepth(front);
      // im Tierpark: Schild antippen öffnet den Ausbau dieses Geheges (nur wenn man davorsteht)
      if (hasSlots(e)) board.setInteractive({ useHandCursor: true }).on('pointerdown', () => (this.penAtSign() === e ? this.openEventsPanel(e.id) : this.tooFar()));
      // Tierbilder nebeneinander auf der hellen Tafel (38×22 Pixel, Mitte etwas unter der Bildmitte)
      const list = e.species ?? [];
      const step = SIGN_INNER_W / list.length;
      list.forEach((s, i) => {
        const icon = this.add.image(sx - SIGN_INNER_W / 2 + step * (i + 0.5), sy - 18, SPECIES[s].texture, s === 'fish' ? 1 : 0);
        icon.setScale(Math.min(SIGN_ICON_H / icon.height, (step - 2) / icon.width)).setDepth(front + 0.1);
      });
      // Plätze: "4 / 6", voll mit Stern; in gemeinsamen Gehegen eine kleine Zeile je Tierart mit ihrem Bild
      const counts = penQuotas(e).map(({ key }, i) => {
        const text = this.add.text(sx + (key ? 9 : 0), sy + 2 + i * (key ? 15 : 0), '', { fontFamily: 'Trebuchet MS, Arial', fontSize: key ? '9px' : '10px', fontStyle: 'bold', color: '#fff8e6', backgroundColor: '#3c2814cc', padding: { x: key ? 3 : 4, y: 1 }, resolution: 4 }).setOrigin(0.5, 0).setDepth(front + 0.2);
        const icon = key ? this.add.image(sx, text.y + 5, SPECIES[key].texture, key === 'fish' ? 1 : 0) : null;
        icon?.setScale(Math.min(15 / icon.height, 17 / icon.width)).setDepth(front + 0.3);
        return { key, text, icon };
      });
      return { x, y, enclosure: e, counts };
    });
    this.updatePenSigns();
    this.wrongHomeTimer = 0;
    // Netzdach über Gehegen wie der Voliere
    for (const e of ENCLOSURES) if (e.netRoof) this.drawNetRoof(e);
    this.shownSign = null; // welches Schild die Tafel gerade zeigt


    // Auto für die Schnellreise: antippen oder daneben die Aktionstaste drücken öffnet die Weltkarte
    this.car = null;
    if (LEVEL.car) {
      const { x, y } = tileToWorld(LEVEL.car.tx, LEVEL.car.ty);
      const k = LEVEL.car.scale ?? 1; // alle Autos etwa gleich groß (siehe car.scale in levels.js)
      const img = this.add.sprite(x, y + 4, LEVEL.car.texture, LEVEL.car.frame).setOrigin(0.5, 136 / 140).setScale(0.5 * k).setDepth(y);
      img.setInteractive({ useHandCursor: true }).on('pointerdown', () => (this.nearCar ? this.openCarMap() : this.tooFar()));
      const label = this.add
        .text(x, y - 76 * k, 'Schnellreise ▸', { fontFamily: 'Trebuchet MS, Arial', fontSize: '11px', fontStyle: 'bold', color: '#fff8e6', backgroundColor: '#3c2814cc', padding: { x: 5, y: 2 }, resolution: 4 })
        .setOrigin(0.5)
        .setDepth(100000)
        .setVisible(false);
      this.car = { x, y, label, img, k };
    }
    this.nearCar = false;

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
        const a = this.createAnimal(s.species, s.x, s.y, s.variant);
        a.farm = s.farm ?? null; // Bauernhof-Event: gefangene Kuh, Schwein oder Ziege bleibt es
        a.skin = s.skin ?? null; // seltener Skin (Katze 2)
        a.penSince = s.since ?? 0;
        a.restore(s.state);
        a.life = s.life ?? Phaser.Math.FloatBetween(...LIFETIME);
      }
    } else {
      this.spawnAnimals(arrive);
    }
    this.spawnTimer = Phaser.Math.FloatBetween(...SPAWN_INTERVAL);
    this.heronTimer = LEVEL.herons ? Phaser.Math.FloatBetween(5, LEVEL.herons.every[0]) : Infinity;
    this.flamingoTimer = Phaser.Math.FloatBetween(2, FLAMINGO_EVERY[0]);

    // Ausgelegte Fallen in diesem Level (gefangene Tiere stehen schon als 'trapped' in der Tierliste)
    this.traps = new Map();
    for (const t of game.traps) {
      if (t.level !== LEVEL_ID) continue;
      const trap = new Trap(this, t.x, t.y);
      if (t.caught) trap.showCaught();
      this.traps.set(t.id, trap);
    }

    // Tiere im Gehege, die nicht (mehr) ganz in dessen Innenfläche stehen (z. B. nach einem Ausbau): neu hineinsetzen
    for (const a of this.animals) {
      // freilaufende außerhalb ihres Bereichs (z. B. nach einer Änderung der Karte): neu verteilen
      if (a.enclosure?.free) {
        const { tx, ty } = worldToTile(a.x, a.y);
        if (!NEAR_PATH.has(tx + ',' + ty)) this.placeInPen(a, a.enclosure, true);
        continue;
      }
      // (auch: Gehege, das diese Art nicht mehr aufnimmt – z. B. nach dem Zusammenlegen von Teichen und Volieren)
      const fits = a.enclosure && accepts(a.enclosure, a.species);
      if (a.state !== 'penned' || (fits && a.enclosureFullyAt(a.x, a.y) === a.enclosure)) continue;
      const e = (fits && a.enclosure) || ENCLOSURES.find((f) => accepts(f, a.species));
      if (e) this.placeInPen(a, e, true);
    }

    // Tiere, die dem Spieler aus dem letzten Level gefolgt sind
    this.followers = [];
    for (const { species, variant, origin, farm, skin } of game.followers) {
      const a = this.createAnimal(species, start.x, start.y, variant);
      a.farm = farm ?? null;
      a.skin = skin ?? null;
      a.restore('following');
      a.origin = origin;
      this.followers.push(a);
    }
    game.followers = [];
    // Herzen, die die Besucher dagelassen haben, während der Spieler woanders war (nach den Tieren, die schon da waren)
    let away = 0;
    if (LEVEL_ID === 'park' && game.parkLeftAt) {
      const now = Date.now();
      const babies = babyPlan(this.animals.filter((a) => a.state === 'penned')).length;
      away = awayHearts(parkScore(this.animals), now - game.parkLeftAt, activeOverlap('babies', game.parkLeftAt, now), babies);
      for (const [s, n] of Object.entries(splitHearts(this.animals, away))) game.heartsBy[s] = (game.heartsBy[s] ?? 0) + n;
      // Eisstand: auch während man weg war, haben sich Besucher Eis geholt
      const iceMin = Math.min(60, activeOverlap('icecream', game.parkLeftAt, now) / 60000);
      const ice = Math.floor(iceMin * maxVisitors(parkScore(this.animals)) * AWAY_ICE_PER_VISITOR_MINUTE);
      if (ice) game.heartsBy.icecream = (game.heartsBy.icecream ?? 0) + ice;
      away += ice;
      game.hearts += away;
      game.parkLeftAt = null;
    }
    const moved = LEVEL_ID === 'park' ? this.moveFollowersIntoPens() : ''; // im Tierpark ziehen sie gleich ein
    // Tierbabys, solange das Event läuft (vor den Besuchern, die Babys locken sie an)
    this.babiesOn = false;
    if (LEVEL_ID === 'park' && isActive('babies')) this.spawnBabies(false);
    // Besucher im Tierpark (wie viele, hängt von den Tieren in den Gehegen ab)
    this.visitors = LEVEL_ID === 'park' ? new VisitorCrowd(this) : null;
    this.eventTimer = 0;
    this.eventBanner = document.getElementById('event-banner');

    this.hud = document.getElementById('hud');
    this.updateEventBanner();
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
      const back = data.returned ? `<br><small>${data.returned} ist wieder im Regal im anderen Gebiet</small>` : '';
      if (data.upgraded) {
        this.time.delayedCall(350, () => this.showToast(`🏗️ ${data.upgraded} ausgebaut! Mehr Platz und neue Ausstattung.`));
      }
      const hearts = away ? `<br><span style="color:#ff8fb8">♥</span> ${away} Bewunderungsherz${away === 1 ? '' : 'en'} haben die Besucher dagelassen, während du weg warst.` : '';
      this.showToast(`${LEVEL.name}${back}${moved}${hearts}`);
    }

    const cam = this.cameras.main;
    cam.setBackgroundColor(LEVEL.background ?? '#4f8a2f'); // Farbe außerhalb der Karte
    this.fitZoom();
    this.scale.on('resize', this.fitZoom, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitZoom, this));
    if (data.level) cam.fadeIn(300); // nach einem Levelwechsel sanft einblenden
    this.startAmbient();
    this.startSteam();
    this.drawBridges();

    // ESC (oder der Neustart-Knopf auf dem Tablet) setzt das ganze Spiel zurück
    const restart = () => {
      resetGame();
      this.scene.restart({});
    };
    this.input.keyboard.on('keydown-ESC', restart);
    // Werkzeug einsetzen (wenn man eins hat): E, Enter oder der Aktionsknopf auf dem Tablet
    const useTool = () => {
      if (this.nearFeeder && !this.leaving && this.toolId !== 'parkfood') {
        this.equipTool('parkfood'); // am Futterautomaten: Futter holen
        this.showToast('Futter genommen! Wirf es am Zaun ins Gehege – dann kommen die Tiere.');
        return;
      }
      if (this.nearComputer && !this.leaving) {
        this.openEventsPanel(); // am Hauptrechner: Events
        return;
      }
      if (this.nearChest && !this.leaving) {
        this.openChest(this.nearChest); // an der Kiste: Werkzeug auswählen
        return;
      }
      const pen = this.penAtSign();
      if (pen && !this.tool && !this.leaving) {
        this.openEventsPanel(pen.id); // am Gehegeschild: Ausbau dieses Geheges
        return;
      }
      if (this.nearCar && !this.leaving) {
        this.openCarMap(); // am Auto: Weltkarte statt Werkzeug
        return;
      }
      if (this.nearOrangutan && !this.tool && !this.leaving) {
        this.waveAt(this.nearOrangutan); // unter dem Orang-Utan: zurückwinken
        return;
      }
      const tool = this.tool;
      if (this.leaving || !tool || tool.active) return; // läuft schon ein Schwung, zählt der Druck nicht
      tool.use();
      if (this.cache.audio.exists('whoosh')) this.sound.play('whoosh', { volume: WHOOSH_VOLUME });
    };
    this.input.keyboard.on(`keydown-${ACTION_KEY}`, useTool);
    this.input.keyboard.on('keydown-ENTER', useTool);
    // Übersicht über Tiere und Werkzeuge (Taste I oder Tippen auf das Abzeichen oben links)
    this.input.keyboard.on('keydown-I', () => this.showJournal());
    // beim Reiten: Werkzeug wechseln (Q bzw. der Werkzeug-Knopf auf dem Tablet) – überall, ohne zur Hütte zu gehen
    this.input.keyboard.on('keydown-Q', () => this.openRideChest());
    // Cheat zum Testen: L gibt 50 Bewunderungsherzen
    this.input.keyboard.on('keydown-L', () => {
      this.addHearts(50);
      this.showToast('Cheat: <span class="heart">♥</span> +50');
    });
    document.getElementById('btn-swap').onclick = (e) => {
      e.stopPropagation();
      this.openRideChest();
    };
    this.riding = false;
    this.updateMount();
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

  // Bogenbrücken: Bohlen als geschwungenes Band über dem Wasser, rote Geländer an beiden Seiten.
  // Das hintere Geländer liegt hinter, das vordere vor allem, was auf der Brücke steht.
  drawBridges() {
    const STEP = 0.125; // in Kacheln
    for (const br of BRIDGES) {
      const arch = bridgeArch(br);
      const len = br.to + 1 - br.from;
      // Punkt auf der Brücke: u entlang (in Kacheln ab Brückenanfang), v quer (0 = hinten, 1 = vorne), h über dem Deck
      const pt = (u, v, h = 0) => {
        const along = br.from + u;
        const cross = br.at + v;
        const [txf, tyf] = br.axis === 'y' ? [cross, along] : [along, cross];
        const lift = Math.sin((Math.PI * u) / len) * arch;
        return { x: (txf - tyf) * (TILE_W / 2), y: (txf + tyf) * (TILE_H / 2) - lift - h };
      };
      const deck = this.add.graphics().setDepth(-99998);
      for (let u = 0, i = 0; u < len - 1e-6; u += STEP, i++) {
        const quad = [pt(u, 0), pt(u + STEP, 0), pt(u + STEP, 1), pt(u, 1)];
        deck.fillStyle(i % 2 ? 0x9c5a38 : 0xb06640, 1);
        deck.fillPoints(quad, true);
        deck.lineStyle(1, 0x6e3a22, 1);
        deck.lineBetween(quad[0].x, quad[0].y, quad[3].x, quad[3].y);
      }
      // Seitenkante des Decks (vorne), damit der Bogen Dicke bekommt
      for (let u = 0; u < len - 1e-6; u += STEP) {
        const a = pt(u, 1), b = pt(u + STEP, 1);
        deck.fillStyle(0x6e3a22, 1);
        deck.fillPoints([a, b, { x: b.x, y: b.y + 3 }, { x: a.x, y: a.y + 3 }], true);
      }
      const ys = [pt(0, 0).y, pt(len, 1).y, pt(0, 1).y, pt(len, 0).y];
      const rail = (v, depth) => {
        const g = this.add.graphics().setDepth(depth);
        const line = (h, w, col) => {
          g.lineStyle(w, col, 1);
          g.beginPath();
          for (let u = 0; u <= len + 1e-6; u += STEP) {
            const p = pt(u, v, h);
            if (u === 0) g.moveTo(p.x, p.y);
            else g.lineTo(p.x, p.y);
          }
          g.strokePath();
        };
        // Pfosten
        for (let u = 0; u <= len + 1e-6; u += 0.5) {
          const a = pt(u, v, 0), b = pt(u, v, 13);
          g.lineStyle(4, 0x2b1d14, 1).lineBetween(a.x, a.y, b.x, b.y - 1);
          g.lineStyle(2, 0x9c2e20, 1).lineBetween(a.x, a.y, b.x, b.y);
          g.fillStyle(0xe8b84a, 1).fillRect(b.x - 1, b.y - 1, 3, 2);
        }
        line(12, 4, 0x2b1d14); // Handlauf mit dunkler Kontur
        line(12, 2, 0xd64a32);
        line(6, 3, 0x2b1d14); // Mittellatte
        line(6, 1.5, 0xc8402c);
      };
      rail(0, Math.min(...ys) - 24);
      rail(1, Math.max(...ys) + 24);
    }
  }

  // Dampf über heißen Quellen: kleine Wölkchen steigen auf und verblassen
  startSteam() {
    const hot = [];
    for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) if (groundAt(tx, ty) === 'hotspring') hot.push(tileToWorld(tx, ty));
    if (!hot.length) return;
    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        const p = Phaser.Utils.Array.GetRandom(hot);
        const x = p.x + Phaser.Math.Between(-20, 20);
        const y = p.y + Phaser.Math.Between(-6, 6);
        const puff = this.add.circle(x, y, Phaser.Math.FloatBetween(4, 7), 0xffffff, 0.35).setDepth(y + 40);
        this.tweens.add({
          targets: puff,
          x: x + Phaser.Math.Between(-8, 8),
          y: y - Phaser.Math.Between(26, 44),
          scale: 2.2,
          alpha: 0,
          duration: Phaser.Math.Between(1400, 2200),
          ease: 'Sine.easeOut',
          onComplete: () => puff.destroy(),
        });
      },
    });
  }

  // Zaunstück zeichnen: nur die Hälften, die zu einem Nachbarzaun (oder Tor) führen. So ragt an Ecken
  // nichts über, und dort steht ein Eckpfosten.
  addFence(tx, ty, obj) {
    const { kind, axis } = obj.fence;
    const { x, y } = tileToWorld(tx, ty);
    // Verbindung in Richtung dx/dy entlang der Achse a: der Nachbar ist ein Zaun oder Tor, und einer von beiden läuft in diese
    // Richtung. Ein Nachbar derselben Zaunart wird immer verbunden: so schließen auch Stufen in frei geformten Gehegen.
    const joins = (dx, dy, a) => {
      const other = fenceAxisAt(tx + dx, ty + dy);
      return !!other && (axis === a || other === a || objectAt(tx + dx, ty + dy)?.fence?.kind === kind);
    };
    const xl = joins(-1, 0, 'x');
    const xr = joins(1, 0, 'x');
    const yu = joins(0, -1, 'y');
    const yd = joins(0, 1, 'y');
    const hut = kind === 'hut' ? `hutwall_${buildingAt(tx, ty).style}` : null; // Wand im Stil des Gebäudes
    const prefix = hut ?? obj.key.slice(0, -2); // z. B. fence, mesh, net, chain
    const imgs = [];
    // Gebäudewände können verschieden hoch sein: die Kachelmitte liegt immer 20 Pixel über dem unteren Bildrand
    const originY = (img) => (hut ? (img.height - 20) / img.height : obj.originY);
    const piece = (a, crop) => {
      const img = this.add.image(x, y, `${prefix}_${a}`);
      img.setOrigin(0.5, originY(img)).setDepth(y);
      if (crop === 'left') img.setCrop(0, 0, 34, img.height);
      if (crop === 'right') img.setCrop(30, 0, 34, img.height);
      imgs.push(img);
    };
    // entlang tx: links geht es zu tx-1, rechts zu tx+1; entlang ty (gespiegelt): rechts zu ty-1, links zu ty+1
    if (xl && xr) piece('x');
    else if (xl) piece('x', 'left');
    else if (xr) piece('x', 'right');
    if (yu && yd) piece('y');
    else if (yu) piece('y', 'right');
    else if (yd) piece('y', 'left');
    if (!xl && !xr && !yu && !yd) piece(axis); // einzelnes Stück
    if ((xl || xr) && (yu || yd)) {
      const post = this.add.image(x, y, `post_${hut ?? kind}`);
      imgs.push(post.setOrigin(0.5, originY(post)).setDepth(y + 0.01));
    }
    return imgs;
  }

  // Wegweiser mit schrägen Brettern: jedes Ziel bekommt ein Brett, das entlang einer der vier Wegrichtungen zeigt
  // (schräg wie die Wege) – in die Richtung, in die man vom Schild aus losgeht. Ziele sind die Bereiche des Levels
  // (sections, z. B. im Tierpark) oder sonst seine Ausgänge. signScale macht einen Wegweiser größer.
  drawSignBoards(x, y, tx, ty) {
    const k = LEVEL.signScale ?? 1;
    this.add.image(x, y, 'signpost_post').setOrigin(0.5, 60 / 64).setScale(k).setDepth(y);
    // Richtungen auf dem Bildschirm: entlang ty nach oben rechts bzw. unten links, entlang tx nach unten rechts bzw. oben links
    const DIRS = { 'ty-': [2, -1], 'tx-': [-2, -1], 'tx+': [2, 1], 'ty+': [-2, 1] };
    const targets = (LEVEL.sections ?? EXITS.map(({ label, tx, ty }) => ({ label, tx, ty }))).filter((s) => !s.unlock || game.unlocked.includes(s.unlock));
    const boards = targets.map((s) => {
      const dtx = s.tx - tx;
      const dty = s.ty - ty;
      const key = Math.abs(dtx) >= Math.abs(dty) ? (dtx > 0 ? 'tx+' : 'tx-') : dty > 0 ? 'ty+' : 'ty-';
      const [dx, dy] = DIRS[key];
      const n = Math.hypot(dx, dy);
      return { label: s.label, ux: dx / n, uy: dy / n };
    });
    boards.sort((a, b) => a.uy - b.uy); // nach oben zeigende Bretter oben am Pfosten
    const HEIGHTS = [52, 41, 30, 19];
    boards.forEach((b, i) => {
      const h = (HEIGHTS[i] ?? 19) * k;
      const text = this.add
        .text(0, 0, b.label, { fontFamily: 'Trebuchet MS, Arial', fontSize: `${Math.round(7 * k)}px`, fontStyle: 'bold', color: '#3a2414', resolution: 8 })
        .setOrigin(0.5);
      const L = text.width + 8 * k; // Brettlänge passend zum Namen
      const half = 5 * k; // halbe Brettbreite
      const bx = x + b.ux * 2;
      const by = y - h;
      const along = (t, off) => ({ x: bx + b.ux * t, y: by + b.uy * t + off });
      const pts = [along(0, -half), along(L, -half), along(L + half, 0), along(L, half), along(0, half)];
      const depth = y + (b.uy < 0 ? -0.2 : 0.2); // nach hinten zeigende Bretter hinter, nach vorne zeigende vor dem Pfosten
      const g = this.add.graphics().setDepth(depth);
      g.fillStyle(0xe0b57a, 1).fillPoints(pts, true);
      g.lineStyle(1, 0xf2d4a0, 1).lineBetween(pts[0].x, pts[0].y + 1, pts[1].x, pts[1].y + 1);
      g.lineStyle(1, 0x2b1d14, 1).strokePoints(pts, true);
      const mid = along(L / 2, 0);
      // schräge Schrift entlang des Bretts, immer von links nach rechts lesbar
      let angle = Math.atan2(b.uy, b.ux);
      if (b.ux < 0) angle += Math.PI;
      text.setPosition(mid.x, mid.y).setRotation(angle).setDepth(depth + 0.01);
    });
  }

  // variant: Farbmuster (nur Koi), sonst zufällig
  createAnimal(species, x, y, variant) {
    const a =
      species === 'fish'
        ? new Fish(this, this.animals)
        : species === 'koi'
          ? new Koi(this, this.animals, variant)
        : species === 'crocodile'
          ? new Crocodile(this, this.animals)
        : species === 'squirrel'
          ? new Squirrel(this, this.animals)
          : species === 'frog'
            ? new Frog(this, x, y)
            : species === 'mole'
              ? new Mole(this, this.animals)
              : species === 'heron' || species === 'flamingo'
                ? new Heron(this, x, y, species)
                : species === 'antelope'
                  ? new Antelope(this, x, y, this.animals)
                  : species === 'zebra'
                    ? new Zebra(this, x, y, this.animals)
                    : species === 'meerkat'
                      ? new Meerkat(this, x, y, this.animals)
                      : species === 'lion'
                        ? new Lion(this, x, y)
                        : species === 'macaque'
                          ? new Macaque(this, x, y)
                        : species === 'panda'
                          ? new Panda(this, x, y)
                        : species === 'tiger'
                          ? new Tiger(this, x, y)
                        : species === 'orangutan'
                          ? new Orangutan(this, x, y)
                        : species === 'peacock'
                          ? new Peacock(this, x, y)
                        : species === 'giraffe'
                          ? new Giraffe(this, x, y)
                          : species === 'cat'
                            ? new Cat(this, x, y, this.animals)
                            : species === 'fox'
                              ? new Fox(this, x, y)
                              : species === 'sheep'
                                ? new Sheep(this, x, y)
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
      n += 1; // eine Herde oder Kolonie zählt als ein Platz
    }
  }

  // Tierart nach den Wahrscheinlichkeiten des Levels auswürfeln
  pickSpecies() {
    const entries = Object.entries(LEVEL.spawn.weights);
    let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
    const species = (entries.find(([, w]) => (r -= w) <= 0) ?? entries[0])[0];
    // Event "Seltene Tiere": jedes zweite Reh ist ein Hirsch
    if ((species === 'deer' || species === 'stag') && LEVEL.spawn.weights.stag && isActive('rare')) return Math.random() < RARE_EVENT_CHANCE ? 'stag' : 'deer';
    return species;
  }

  // Ein zufälliges wildes Tier erzeugen. Fische, Eichhörnchen und Maulwürfe suchen sich ihre Plätze selbst
  // (Wasser, Baum, Wiese), alle anderen kommen auf eine freie Kachel mit Abstand zu "taken" (siehe randomFreeTile).
  // Gibt die neuen Tiere zurück (meist eins, Antilopen kommen in kleinen Gruppen).
  spawnOne(taken, fadeIn = false) {
    const species = this.pickSpecies();
    const group = [];
    // Japanmakaken sitzen gleich in der heißen Quelle (höchstens MAX_MACAQUES, sonst wird es dort zu voll)
    if (species === 'macaque') {
      const wild = this.animals.filter((a) => a.species === 'macaque' && a.state === 'wild').length;
      if (wild < MAX_MACAQUES && HOT_SPRING_TILES.some((t) => !enclosureAt(t.tx, t.ty))) {
        const a = this.createAnimal('macaque', 0, 0);
        a.placeInSpring();
        group.push(a);
      }
      return group;
    }
    // Orang-Utans sitzen oben in den Urwaldbäumen (höchstens MAX_ORANGUTANS gleichzeitig)
    if (species === 'orangutan') {
      const wild = this.animals.filter((a) => a.species === 'orangutan' && a.state === 'wild').length;
      if (wild < MAX_ORANGUTANS && JUNGLE_TREES.length) {
        const a = this.createAnimal('orangutan', 0, 0);
        a.placeInTree();
        group.push(a);
      }
      return this.finishSpawn(group, fadeIn);
    }
    // Tiger streifen als Schemen durch den Bambus (höchstens MAX_TIGERS gleichzeitig)
    if (species === 'tiger') {
      const wild = this.animals.filter((a) => a.species === 'tiger' && a.state === 'wild').length;
      if (wild < MAX_TIGERS && TIGER_ZONE.length) {
        const a = this.createAnimal('tiger', 0, 0);
        a.placeInZone();
        group.push(a);
      }
      return this.finishSpawn(group, fadeIn);
    }
    if (species === 'fish' || species === 'koi' || species === 'crocodile' || species === 'squirrel' || species === 'mole') {
      const a = this.createAnimal(species, 0, 0);
      if (species === 'squirrel') a.restore('wild'); // setzt es auf seinen Baum
      if (species === 'koi') a.placeRandom(); // irgendwo in den Koi-Teich
      group.push(a);
    } else {
      // Frösche meistens nah am Wasser, Giraffen meistens nah an Bäumen
      const tile =
        (species === 'frog' && Math.random() < FROG_NEAR_WATER && this.tileFrom(NEAR_WATER, taken)) ||
        (species === 'giraffe' && Math.random() < GIRAFFE_NEAR_TREES && this.tileFrom(NEAR_TREES, taken)) ||
        (species === 'panda' && this.tileFrom(NEAR_BAMBOO, taken)) || // Pandas immer beim Bambus
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
    return this.finishSpawn(group, fadeIn);
  }

  // Lebenszeit, seltene Variante und Einblenden für frisch erzeugte wilde Tiere
  finishSpawn(group, fadeIn) {
    const life = Phaser.Math.FloatBetween(...LIFETIME);
    group[0]?.rollSkin('wild'); // selten z. B. Katze 2; eine Herde sieht ganz gleich aus (Oryx)
    for (const a of group) {
      a.life = life;
      a.skin = group[0].skin;
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
  // Wie viele Plätze sind belegt? Eine Herde oder Kolonie zählt als einer, damit seltene Einzeltiere
  // (Giraffe, Löwe ...) neben den großen Gruppen noch eine Chance haben. Fischreiher zählen nicht.
  wildUnits() {
    const units = new Set();
    for (const a of this.animals) {
      if (a.state === 'wild' && a.species !== 'heron') units.add(a.herd ?? a.colony ?? a);
    }
    return units.size;
  }

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
    if (this.wildUnits() < LEVEL.spawn.population) this.spawnOne([worldToTile(p.x, p.y), ...TOOL_SPOTS], true);
  }

  // Fischreiher: alle paar Sekunden fliegt einer über die Karte; manche landen an einer Uferstelle
  updateHerons(dt) {
    // weggeflogene Reiher entfernen
    for (const a of [...this.animals]) {
      if (!a.gone) continue;
      this.animals.splice(this.animals.indexOf(a), 1);
      a.destroy();
    }
    // Flamingo-Flug: Flamingos fliegen ein wie Reiher, nur öfter
    if (isActive('flamingo') && FLAMINGO_WORLDS.includes(LEVEL_ID)) {
      this.flamingoTimer -= dt;
      if (this.flamingoTimer <= 0) {
        this.flamingoTimer = Phaser.Math.FloatBetween(...FLAMINGO_EVERY);
        this.flyIn('flamingo', FLAMINGO_LAND);
      }
    }
    this.heronTimer -= dt;
    if (this.heronTimer > 0) return;
    const { every, landChance } = LEVEL.herons;
    this.heronTimer = Phaser.Math.FloatBetween(...every);
    this.flyIn('heron', landChance);
  }

  // ein Vogel fliegt über die Karte; manche landen an einer Uferstelle
  flyIn(species, landChance) {
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
    const bird = this.createAnimal(species, from.x, from.y);
    bird.startFlight(from, to, land);
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

  // Ruf eines Tiers (beim Bauernhof-Event muhen, grunzen und meckern die Schafe)
  callOf(a) {
    const key = a.farm ? `animal_${a.farm}` : `animal_${a.species}`;
    // ohne eigenen Ton: ein ähnlicher (der Tiger brüllt wie der Löwe)
    return this.cache.audio.exists(key) ? key : CALL_FALLBACK[a.species] ?? key;
  }

  // Tierpark: ab und zu ein Ruf aus dem nächsten Gehege mit Tieren, die einen Ruf haben
  updatePenCalls(dt) {
    if (LEVEL_ID !== 'park') return;
    this.penCallTimer = (this.penCallTimer ?? Phaser.Math.FloatBetween(2, PEN_CALL_EVERY[0])) - dt;
    if (this.penCallTimer > 0) return;
    this.penCallTimer = Phaser.Math.FloatBetween(...PEN_CALL_EVERY);
    const p = this.player;
    const callers = this.animals
      .filter((a) => a.state === 'penned')
      .map((a) => ({ a, key: a.species in PEN_CALLS ? PEN_CALLS[a.species] : this.callOf(a) }))
      .filter(({ key }) => key && this.cache.audio.exists(key))
      .map((c) => ({ ...c, d: Math.hypot(c.a.x - p.x, (c.a.y - p.y) * 2) }))
      .filter(({ d }) => d < PEN_CALL_DIST);
    if (!callers.length) return;
    // eher die Tiere ganz in der Nähe, aber nicht immer dasselbe
    callers.sort((u, v) => u.d - v.d);
    const { key, d } = callers[Math.floor(Math.random() * Math.min(3, callers.length))];
    const near = 1 - d / PEN_CALL_DIST;
    this.sound.play(key, { volume: PEN_CALL_VOLUME * (0.35 + 0.65 * near), detune: Phaser.Math.Between(-120, 120) });
  }

  // Antippen aus der Ferne: erst hingehen
  tooFar() {
    if (!this.leaving) this.showToast('Geh erst direkt daneben.');
  }

  // Boden einmal in große Flächen (je 1024 x 1024 Pixel) malen statt tausender einzelner Kacheln, die sonst in jedem Bild
  // neu gezeichnet würden
  bakeGround(list) {
    const CHUNK = 1024;
    const PAD = 4; // die Flächen überlappen ein wenig, damit an den Nahtstellen keine feine Linie durchscheint
    const minX = Math.min(...list.map(([x]) => x)) - TILE_W / 2;
    const minY = Math.min(...list.map(([, y]) => y)) - TILE_H / 2;
    const chunks = new Map();
    const chunk = (i, j) => {
      const k = i + ',' + j;
      if (!chunks.has(k)) {
        const rt = this.add.renderTexture(minX + i * CHUNK - PAD, minY + j * CHUNK - PAD, CHUNK + 2 * PAD, CHUNK + 2 * PAD);
        rt.setOrigin(0).setDepth(-100000 + (i + j) * 0.001);
        rt.texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // scharfe Kanten, keine weichgezeichneten Ränder
        chunks.set(k, rt);
      }
      return chunks.get(k);
    };
    for (const [x, y, key] of list) {
      // eine Kachel kann über den Rand einer Fläche (samt Überlappung) reichen: dann in alle betroffenen malen
      const i0 = Math.floor((x - TILE_W / 2 - PAD - minX) / CHUNK), i1 = Math.floor((x + TILE_W / 2 + PAD - minX) / CHUNK);
      const j0 = Math.floor((y - TILE_H / 2 - PAD - minY) / CHUNK), j1 = Math.floor((y + TILE_H / 2 + PAD - minY) / CHUNK);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const rt = chunk(i, j);
        rt.stamp(key, undefined, x - rt.x, y - rt.y);
      }
    }
  }

  // feste Dinge (Bäume, Zäune, Büsche ...) außerhalb des Bildausschnitts ausblenden, damit sie nicht gezeichnet werden.
  // Nur neu rechnen, wenn sich die Kamera bewegt hat. Bilder ragen vom Fußpunkt nach oben, daher unten mehr Rand
  cullStatic() {
    const v = this.cameras.main.worldView;
    const last = this.cullView;
    if (last && Math.abs(last.x - v.x) < 16 && Math.abs(last.y - v.y) < 16 && last.width === v.width) return;
    this.cullView = { x: v.x, y: v.y, width: v.width };
    const x0 = v.x - 200, x1 = v.right + 200, y0 = v.y - 60, y1 = v.bottom + 320;
    for (const o of this.cullables) o.setVisible(o.x > x0 && o.x < x1 && o.y > y0 && o.y < y1);
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
    for (const a of this.animals) if (!a.baby) add(a.species, a.state);
    for (const [id, saved] of Object.entries(game.levels)) {
      if (id !== LEVEL_ID) for (const s of saved.animals) add(s.species, s.state);
    }
    return counts;
  }

  // Abzeichen oben links: Gebiet und wie viele Tiere schon zuhause sind; die Einzelheiten zeigt die Übersicht (I)
  updateHud() {
    const total = Object.values(this.homeCounts()).reduce((s, n) => s + n, 0);
    this.hud.innerHTML = `${LEVEL.name} · 🐾 <b>${total}</b> · <span class="hearts">♥ <b>${game.hearts}</b></span><span class="key">I</span>`;
  }

  // Events am Hauptrechner: Tafel mit allen Events, ihren Kosten und ihrem Zustand; das Spiel pausiert so lange
  // focus: Gehege-Id – dann nur der Ausbau dieses Geheges (am Gehegeschild)
  openEventsPanel(focus = null) {
    if (this.leaving || isEventsOpen() || isToolChestOpen() || isTravelMapOpen() || isJournalOpen()) return;
    this.scene.pause();
    openEvents(
      () => ({
        hearts: game.hearts,
        events: [...EVENTS].sort((a, b) => a.cost - b.cost).map((ev) => ({ ...ev, ...eventState(ev.id), blocked: this.eventBlocked(ev) })),
        pens: this.penUpgrades(),
      }),
      (tab, id) => {
        this.scene.resume();
        if (tab === 'pens') return this.upgradePen(id);
        startEvent(id);
        this.updateHud();
        if (id === 'icecream') this.showToast('🍦 Der Eiswagen ist da! Die Besucher holen sich Eis – jedes bringt zwei Herzen.');
        if (id === 'farm') this.showToast('🐄 Bauernhof! Auf der Wiese werden aus den Schafen Kühe, Schweine und Ziegen – fang sie ein!');
        if (id === 'rare') this.showToast('✨ Seltene Tiere! 5 Minuten lang ist in den Welten jedes zweite neue Tier eine seltene Variante.');
        if (id === 'flamingo') this.showToast('🦩 Flamingo-Flug! In Wiese, Wald und Savanne fliegen jetzt Flamingos.');
        if (id === 'ride') this.showToast('🐴 Dein Reittier wartet in den Welten! Dort sitzt du 10 Minuten lang im Sattel.');
        if (id === 'babies') {
          this.spawnBabies(true);
          this.visitors?.updateScore();
          this.showToast('<span class="heart">♥</span> Tierbabys! Die Besucher strömen herbei.');
        }
        this.updateEventBanner();
      },
      () => this.scene.resume(),
      focus ? { tab: 'pens', only: focus } : {},
    );
  }

  // Reittier: in den Welten aufsitzen (in Gebäuden steigt Henrik ab), im Tierpark zu Fuß
  updateMount() {
    const key = isActive('ride') ? RIDES[LEVEL_ID] ?? null : null;
    const { tx, ty } = worldToTile(this.player.x, this.player.y);
    const mount = key && !buildingAt(tx, ty) ? key : null;
    if (mount && !this.player.mount && !this.riding) {
      this.showToast('🐴 Du reitest! Schneller unterwegs – Werkzeug wechseln mit Q bzw. dem Werkzeug-Knopf.');
    }
    this.riding = !!key;
    this.player.setMount(mount);
    document.body.classList.toggle('riding', !!key);
  }

  // Werkzeug wechseln vom Reittier aus: dieselbe Auswahl wie am Regal dieser Welt
  openRideChest() {
    if (!this.riding) return;
    const chest = (LEVEL.chests ?? [])[0];
    if (chest) this.openChest(chest);
  }

  // Gehegeausbau: alle Gehege mit Plätzen; noch nicht ausgebaute zuerst
  penUpgrades() {
    const cost = upgradeCost();
    return ENCLOSURES.filter((e) => hasSlots(e) && !e.free)
      .map((e) => {
        const done = isUpgraded(e);
        return {
          id: e.id,
          name: e.name,
          species: e.species ?? [],
          cost,
          done,
          text: done ? `${penCapacity(e, 1)} Plätze · ${e.upgrade}` : `${penCapacity(e, 0)} → ${penCapacity(e, 1)} Plätze · ${e.upgrade}`,
          blocked: done ? null : game.hearts < cost ? 'zu wenig Herzen' : null,
        };
      })
      .sort((u, v) => u.done - v.done);
  }

  // Gehege ausbauen: Herzen abziehen, Stand speichern und den Tierpark mit dem größeren Gehege neu aufbauen
  upgradePen(id) {
    const e = ENCLOSURES.find((f) => f.id === id);
    const cost = upgradeCost();
    if (!e || isUpgraded(e) || game.hearts < cost) return;
    game.hearts -= cost;
    game.upgrades += 1;
    game.penLevel[id] = 1;
    this.saveLevelState();
    const arrive = worldToTile(this.player.x, this.player.y);
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ level: LEVEL_ID, arrive, upgraded: e.name }));
  }

  // warum ein Event gerade nicht startbar ist (sonst null)
  eventBlocked(ev) {
    if (ev.id === 'babies' && !babyPlan(this.animals.filter((a) => a.state === 'penned')).length) return 'braucht 2 gleiche größere Tiere in einem Gehege';
    if (game.hearts < ev.cost) return 'zu wenig Herzen';
    return null;
  }

  // Tierbabys: in jedem Gehege auf je 2 größere Tiere ein kleines, neben einem der Eltern
  spawnBabies(pop) {
    for (const { enclosure, species, parent } of babyPlan(this.animals.filter((a) => a.state === 'penned'))) {
      const a = this.createAnimal(species, parent.x, parent.y);
      a.farm = parent.farm ?? null; // Kalb, Ferkel oder Zicklein
      a.rollSkin('baby'); // seltene Skins bei Babys nur ganz selten
      a.makeBaby();
      // an die nächste Stelle im Gehege, an der es ganz hineinpasst (nicht halb im Zaun, wenn die Eltern am Rand stehen)
      const spots = enclosure.tiles
        .map((t) => tileToWorld(t.tx, t.ty))
        .filter((p) => !isBlockedPoint(p.x, p.y) && a.enclosureFullyAt(p.x, p.y) === enclosure)
        .sort((p, q) => Math.hypot(p.x - parent.x, p.y - parent.y) - Math.hypot(q.x - parent.x, q.y - parent.y));
      const spot = spots[Phaser.Math.Between(0, Math.min(2, spots.length - 1))];
      if (spot) {
        a.x = spot.x + Phaser.Math.Between(-6, 6);
        a.y = spot.y + Phaser.Math.Between(-3, 3);
      }
      a.restore('penned');
      a.enclosure = enclosure;
      if (pop) a.popHeart();
    }
    this.babiesOn = true;
  }

  removeBabies() {
    for (const a of this.animals.filter((b) => b.baby)) {
      this.animals.splice(this.animals.indexOf(a), 1);
      this.tweens.add({ targets: [a.sprite, a.shadow], alpha: 0, duration: 800, onComplete: () => a.destroy() });
    }
    this.babiesOn = false;
  }

  // Start und Ende der Events (auch wenn man zwischendurch woanders war) und die Restzeit oben
  // Eisstand-Event: Eiswagen mit Eisverkäuferin mitten im Park, solange es läuft
  updateIceStand() {
    const on = LEVEL_ID === 'park' && !!LEVEL.iceStand && isActive('icecream');
    if (on && !this.iceStand) {
      const { x, y } = tileToWorld(LEVEL.iceStand.tx, LEVEL.iceStand.ty);
      const cart = this.add.image(x, y, 'icecream_stand').setOrigin(0.5, 100 / 128).setScale(0.7).setDepth(y);
      const seller = this.add.sprite(x + 8, y - 10, 'icecream_seller', 1).setOrigin(0.5, 112 / 116).setScale(0.5).setDepth(y - 6);
      this.iceStand = [cart, seller];
      for (const o of this.iceStand) {
        o.setAlpha(0);
        this.tweens.add({ targets: o, alpha: 1, duration: 600 });
      }
    }
    if (!on && this.iceStand) {
      const parts = this.iceStand;
      this.iceStand = null;
      this.tweens.add({ targets: parts, alpha: 0, duration: 600, onComplete: () => parts.forEach((o) => o.destroy()) });
    }
  }

  updateEvents() {
    this.updatePenSigns();
    this.updateIceStand();
    if (this.riding && !isActive('ride')) this.showToast('Das Reittier ist zurück im Stall.');
    this.updateMount();
    const on = isActive('babies');
    if (LEVEL_ID === 'park' && on && !this.babiesOn) this.spawnBabies(false);
    if (LEVEL_ID === 'park' && !on && this.babiesOn) {
      this.removeBabies();
      this.visitors?.updateScore();
      this.showToast('Das Tierbaby-Event ist vorbei – die Kleinen schlafen jetzt.');
    }
    this.updateEventBanner();
  }

  // Gehege, an dessen Schild man gerade steht (nur im Tierpark, nur Gehege mit Plätzen)
  // ... oder in dem man gerade drin steht
  penAtSign() {
    if (LEVEL_ID !== 'park') return null;
    const { tx, ty } = worldToTile(this.player.x, this.player.y);
    const e = this.shownSign?.enclosure ?? enclosureAt(tx, ty);
    return e && hasSlots(e) && !e.free ? e : null;
  }

  // Erfolg: ein Gehege ist voll – kleine Meldung mit Tierbild und Stern
  showPenFull(e) {
    const box = document.getElementById('success');
    box.innerHTML = e.free
      ? `<div class="success-star">⭐</div><div>${animalIcons(e.species ?? [], 3.4)}</div><b>Alle ${penCapacity(e)} ${e.name} sind da!</b><small>Sie laufen frei durch den Park – die Besucher sind begeistert.</small>`
      : `<div class="success-star">⭐</div><div>${animalIcons(e.species ?? [], 3.4)}</div><b>${e.name} ist voll!</b><small>Alle ${penCapacity(e)} Plätze belegt – die Besucher sind begeistert.</small>`;
    box.classList.remove('show');
    void box.offsetWidth; // Animation neu starten
    box.classList.add('show');
  }

  // Platz-Zähler an den Gehegeschildern
  updatePenSigns() {
    if (!this.animals) return; // beim Aufbau sind die Tiere noch nicht da (danach jede halbe Sekunde)
    for (const { enclosure: e, counts } of this.enclosureSigns ?? []) {
      const quotas = penQuotas(e);
      for (const c of counts) {
        const cap = quotas.find((q) => q.key === c.key)?.cap ?? 0;
        const n = penCount(this.animals, e, c.key);
        const full = n >= cap;
        const text = `${n} / ${cap}${full ? ' ⭐' : ''}`;
        if (c.text.text === text) continue;
        c.text.setText(text).setColor(full ? '#ffd966' : '#fff8e6');
        c.icon?.setX(c.text.x - c.text.width / 2 - 8); // Tierbild links neben der Zahl
      }
    }
  }

  updateEventBanner() {
    const icons = { babies: '🍼', ride: '🐴', flamingo: '🦩', farm: '🐄', icecream: '🍦', rare: '✨' };
    const lines = EVENTS.map((ev) => ({ ev, s: eventState(ev.id) }))
      .filter(({ s }) => s.state === 'active')
      .map(({ ev, s }) => `${icons[ev.id] ?? '★'} ${ev.name} · noch ${formatTime(s.left)}`);
    this.eventBanner.classList.toggle('show', lines.length > 0);
    if (lines.length) {
      this.eventBanner.innerHTML = lines.join('<br>');
      // direkt unter den Zähler oben links (auf dem Tablet ist er größer und kann umbrechen)
      this.eventBanner.style.top = `${Math.round(this.hud.getBoundingClientRect().bottom + 6)}px`;
    }
  }

  // Bewunderungsherzen der Besucher aufs Konto; der Zähler oben hüpft kurz
  // source: Tierart (oder 'icecream') für die Statistik in der Übersicht; ohne Quelle (Cheat) zählt es dort nicht
  addHearts(n, source = null) {
    game.hearts += n;
    if (source) game.heartsBy[source] = (game.heartsBy[source] ?? 0) + n;
    this.updateHud();
    const el = this.hud.querySelector('.hearts');
    if (el) {
      el.classList.remove('pulse');
      void el.offsetWidth; // Animation neu starten
      el.classList.add('pulse');
    }
  }

  // Große Übersicht: alle Tierarten mit Anzahl zuhause, Lebensraum und womit man sie fängt, dazu die Werkzeuge
  showJournal() {
    if (isJournalOpen() || this.leaving) return;
    const home = this.homeCounts();
    const toolImg = (t) => `<img class="tool-img" src="assets/${CATCH_TOOLS[t][0]}.png" alt="">`;
    const cards = SPECIES_ORDER.map((s) => {
      const [name] = ANIMAL_INFO[s] ?? [s];
      const places = Object.values(LEVELS)
        .filter((l) => l.spawn.weights[s] || (s === 'heron' && l.herons) || (s === 'flamingo' && FLAMINGO_WORLDS.includes(l === LEVELS.meadow ? 'meadow' : l === LEVELS.forest ? 'forest' : l === LEVELS.savanna ? 'savanna' : '')))
        .map((l) => l.name);
      const tools = SPECIES[s].catchWith.map((t) => `<span class="catch">${toolImg(t)}${CATCH_TOOLS[t][1]}</span>`).join('');
      const n = home[s] ?? 0;
      return `<div class="card${n ? ' has' : ''}">
        <div class="head">${animalIcon(s, 3.2)}<div><b>${name}</b><span class="home">Zuhause: <span class="num">${n}${freeCap(s) ? ` / ${freeCap(s)}` : ''}</span></span></div></div>
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
    // Statistik: Herzen je Tierart (und vom Eisstand), die meisten zuerst
    const hearts = Object.entries(game.heartsBy).filter(([, n]) => n > 0).sort((u, v) => v[1] - u[1]);
    const top = hearts[0]?.[1] ?? 1;
    const heartRows = hearts.map(([s, n]) => {
      const icon = s === 'icecream' ? '<span class="hs-ice">🍦</span>' : animalIcon(s, 2.2);
      const name = s === 'icecream' ? 'Eisstand' : (ANIMAL_INFO[s] ?? [s])[0];
      return `<div class="hs-row">${icon}<b>${name}</b><span class="hs-bar"><span style="width:${Math.max(3, (100 * n) / top)}%"></span></span><span class="hs-num"><span class="heart">♥</span> ${n}</span></div>`;
    });
    const heartSum = hearts.reduce((s, [, n]) => s + n, 0);
    const heartHtml = hearts.length
      ? `<h3>Herzen von den Besuchern · <span class="heart">♥</span> ${heartSum}</h3><div class="hs-list">${heartRows.join('')}</div>`
      : '<h3>Herzen von den Besuchern</h3><p class="hs-empty">Noch keine – bring Tiere in den Tierpark, dann kommen Besucher.</p>';
    const html = `<div class="journal-box">
      <h2>Tierbuch · <span class="num">${total}</span> Tiere zuhause</h2>
      <div class="cards">${cards.join('')}</div>
      ${heartHtml}
      <h3>Womit fängst du was?</h3>
      <div class="tool-list">${toolRows.join('')}</div>
      <p class="close-hint">Beliebige Taste oder Tippen zum Schließen</p>
    </div>`;
    this.scene.pause();
    openJournal(html, () => this.scene.resume());
  }

  updateToolbar() {
    if (this.nearFeeder && this.toolId !== 'parkfood') {
      setTouchTool(null, 'assets/feeder.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/feeder.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>Futter holen</span></div>`;
      return;
    }
    const pen = !this.tool && this.penAtSign();
    if (pen) {
      const done = isUpgraded(pen);
      setTouchTool(null, 'assets/esign_board.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/esign_board.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${done ? 'Gehege ansehen' : 'Gehege ausbauen'}</span></div>`;
      return;
    }
    if (this.nearComputer) {
      setTouchTool(null, 'assets/office_desk.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/office_desk.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>Computer benutzen</span></div>`;
      return;
    }
    if (this.nearChest) {
      // in der Hütte das Werkzeug-Regal, sonst (z. B. auf der Teichinsel) eine kleine Kiste
      const house = buildingAt(this.nearChest.tx, this.nearChest.ty, 1); // Regal in oder an der Hütte
      const img = house ? `assets/hut_shelf_${house.style}.png` : 'assets/hut_chest_small.png';
      setTouchTool(null, img);
      this.toolbar.innerHTML = `<div class="tool"><img src="${img}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${house ? 'Regal' : 'Kiste'} öffnen</span></div>`;
      return;
    }
    if (this.nearOrangutan && !this.tool) {
      setTouchTool(null, 'assets/orangutan_tree.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/orangutan_tree.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>Zurückwinken 👋</span></div>`;
      return;
    }
    if (this.nearCar) {
      // am Auto zeigt die Aktionstaste die Schnellreise
      setTouchTool(null, 'assets/worldmap.jpg');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/worldmap.jpg" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>Schnellreise</span></div>`;
      return;
    }
    const id = this.toolId;
    setTouchTool(id);
    this.toolbar.innerHTML = id
      ? `<div class="tool"><img src="assets/${id}.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${TOOLS[id].name}</span></div>`
      : '';
  }

  // Hinweis zum Werkzeug: bei Kescher, Lasso und Futter nur die Tiere, die es in diesem Gebiet gibt
  toolHint(id) {
    const t = TOOLS[id];
    if (!t.catches) return t.hint;
    const here = (s) => !!LEVEL.spawn.weights[s] || (s === 'heron' && !!LEVEL.herons);
    const list = t.catches.filter(here);
    return list.length ? t.hint(list) : '';
  }

  // text darf HTML enthalten (z. B. Tierbilder)
  showToast(text) {
    this.toast.innerHTML = text;
    this.toast.classList.remove('show');
    void this.toast.offsetWidth; // Animation neu starten
    this.toast.classList.add('show');
  }

  // Werkzeuge kommen zurück in die Kiste (dort gibt es beliebig viele). Nur Werkzeuge mit einem festen Platz
  // am Boden (toolSpots im Level) werden dort wieder hingelegt. Gibt es mehrere gleiche
  // (die zwei Fallen), kommt es auf den ersten freien davon.
  returnTool(id) {
    const spots = TOOL_SPOTS.filter((s) => s.tool === id).map(({ tx, ty }) => tileToWorld(tx, ty));
    const home = spots.find((s) => !this.pickups.some((p) => !p.collected && Math.hypot(p.x - s.x, p.y - s.y) < 8)) ?? spots[0];
    // erst aufhebbar, wenn der Spieler einmal weggegangen ist (er steht evtl. gerade daneben)
    if (home) this.pickups.push(new Pickup(this, home.x, home.y, id, id, false));
  }

  // Werkzeug aufnehmen; ein getragenes kommt zurück auf seinen Platz an der Hütte (Tausch)
  takeTool(pickup) {
    const tiger = this.animals.find((a) => a.ballPickup === pickup);
    if (tiger) {
      tiger.ballPickup = null;
      tiger.goBack();
    }
    this.equipTool(pickup.tool);
    this.toolLockUntil = this.time.now + TOOL_SWITCH_LOCK;
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
    const near = this.animals
      .filter((a) => (a.species === 'giraffe' || a.species === 'panda') && (a.canBeCaughtNow() || a.isSnacking?.()))
      .map((a) => ({ a, d: Math.hypot(a.x - p.x, (a.y - p.y) * 2) }))
      .filter(({ d }) => d < FEED_DIST)
      .sort((u, v) => u.d - v.d)[0]?.a;
    if (!near) {
      this.showToast(`Geh näher an eine ${animalIcon('giraffe')} oder einen ${animalIcon('panda')} heran, um zu füttern.`);
      return;
    }
    if (near.species === 'panda') return this.feedPanda(near);
    const giraffe = near;
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
      this.showToast(`${animalIcon('giraffe', 3.2)} Mmh, lecker! Aber sie bleibt lieber hier. Neues Grünfutter gibt es im Regal in der Hütte.`);
    }
  }

  // Panda mit Grünfutter: folgt sofort – außer er frisst gerade Bambus (dann erst nach einer kurzen Pause).
  // Das Grünfutter bleibt dabei in der Hand
  feedPanda(panda) {
    if (panda.isSnacking()) {
      this.showToast(`${animalIcon('panda', 3.2)} Er frisst noch Bambus … in ${Math.ceil(panda.snackLock)} Sekunden mag er wieder Grünfutter.`);
      return;
    }
    // in Asien verbraucht sich das Grünfutter nicht: es bleibt in der Hand (für den nächsten Panda)
    this.munchLeaves(panda);
    this.catchAnimal(panda);
    this.showToast(`${animalIcon('panda', 3.2)} Der Panda folgt dir! Mach einen Bogen um Bambus und hohes Gras – da kann er nicht widerstehen.`);
  }

  // Kachel in einem Gehege?
  isPenTile(tx, ty) {
    return !!enclosureAt(tx, ty);
  }

  // Japanmakak taucht in der Quelle ab, wenn man ihn herausfischen will: Blubberblasen und ein Hinweis
  macaqueDives(m) {
    for (let i = 0; i < 6; i++) {
      const b = this.add.circle(m.x + Phaser.Math.Between(-8, 8), m.y + Phaser.Math.Between(-3, 3), Phaser.Math.FloatBetween(1.5, 3)).setStrokeStyle(1, 0xffffff, 0.9).setDepth(m.y + 1);
      this.tweens.add({ targets: b, y: b.y - Phaser.Math.Between(6, 14), alpha: 0, delay: i * 120, duration: 700, onComplete: () => b.destroy() });
    }
    const now = this.time.now;
    if (now - (this.macaqueToastAt ?? -1e9) > 8000) {
      this.macaqueToastAt = now;
      this.showToast('Blubb! Der Affe ist abgetaucht. Aus der heißen Quelle kriegst du ihn nicht – warte, bis er herausspringt.');
    }
  }

  // Panda in der Schlange sieht Bambus: er verlässt sie, setzt sich hin und frisst
  pandaSnack(panda, target) {
    const i = this.followers.indexOf(panda);
    if (i < 0) return;
    this.followers.splice(i, 1);
    panda.snack(target);
    this.updateHud();
    this.showToast(`${animalIcon('panda', 3.2)} Oh nein – Bambus! Der Panda frisst jetzt erst mal. Gleich kannst du ihn wieder mit Grünfutter locken.`);
  }

  // Fischfutter am Ufer ins Wasser streuen: die Koi in der Nähe (wild oder im Gehege) kommen herbei und schnappen
  feedKoi() {
    const now = this.time.now;
    if (now < (this.koiFedAt ?? -Infinity) + KOI_FEED_PAUSE) return;
    const p = this.player;
    const aim = { x: p.x + p.faceX * 24, y: p.y + p.faceY * 12 };
    // Wasser direkt vor dem Spieler: wilder Koi-Teich oder Teich in einem Koi-Gehege
    const water = [
      ...KOI_WATER,
      ...FISHPOND_TILES.filter(({ tx, ty }) => ENCLOSURES.some((e) => e.species?.includes('koi') && enclosureAt(tx, ty) === e)),
    ]
      .map((t) => tileToWorld(t.tx, t.ty))
      .map((w) => ({ ...w, d: Math.hypot(w.x - aim.x, (w.y - aim.y) * 2) }))
      .sort((u, v) => u.d - v.d)[0];
    if (!water || water.d > KOI_FEED_DIST) {
      this.showToast(`Geh ans Ufer und streu das Futter ins Wasser – dann kommen die ${animalIcon('koi')}.`);
      return;
    }
    // das Futter landet mitten auf der Wasserkachel vor dem Ufer, damit man die Koi gut sieht
    const spot = { x: water.x, y: water.y };
    // die nächsten wilden Koi in der Nähe und alle Koi im Gehege, an dessen Teich man steht
    const dist = (a) => Math.hypot(a.x - spot.x, a.y - spot.y);
    const wild = this.animals
      .filter((a) => a.species === 'koi' && a.state === 'wild' && a.phase !== 'up' && dist(a) < KOI_CALL_DIST)
      .sort((u, v) => dist(u) - dist(v));
    const penned = this.animals.filter((a) => a.species === 'koi' && a.state === 'penned' && dist(a) < KOI_CALL_DIST);
    const koi = [...wild.slice(0, KOI_CALLED), ...penned];
    // kein Koi in der Nähe: das Futter nicht verschwenden
    if (!koi.length) {
      this.showToast(`Hier ist gerade kein ${animalIcon('koi')} in der Nähe. Stell dich ans Ufer, wo du bunte Schatten im Wasser siehst.`);
      return;
    }
    this.koiFedAt = now;
    // das Futter ist verbraucht (wie beim Grünfutter), neues liegt wieder an seinem Platz; gleich den Kescher in der Hand
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.returnTool('koifood');
    this.equipTool('net');
    this.scatterFood(p, spot);
    for (const a of koi) a.call(spot);
    this.showToast(`Die ${animalIcon('koi')} kommen! Du hast jetzt den Kescher in der Hand – sie fressen eine Weile.`);
  }

  // Futter am Zaun ins Gehege werfen: die Tiere dort kommen herbei und fressen, jedes an seinem eigenen Platz
  feedPen() {
    const p = this.player;
    const aim = { x: p.x + p.faceX * 30, y: p.y + p.faceY * 15 };
    // nächste Gehegekachel vor dem Spieler (nur Gehege mit Landtieren)
    let best = null;
    for (const e of ENCLOSURES) {
      if (!e.species?.some((s) => !NO_PEN_FEED.includes(s))) continue;
      for (const t of e.tiles) {
        if (isBlocked(t.tx, t.ty)) continue;
        const w = tileToWorld(t.tx, t.ty);
        const d = Math.hypot(w.x - aim.x, (w.y - aim.y) * 2);
        if (!best || d < best.d) best = { e, t, w, d };
      }
    }
    if (!best || best.d > PEN_FEED_DIST) {
      this.showToast('Stell dich an den Zaun eines Geheges und wirf das Futter hinein.');
      return;
    }
    const e = best.e;
    // Futter ist verbraucht (wie beim Fischfutter), neues gibt es am Automaten
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.updateToolbar();
    const eaters = this.feedEnclosure(e, p, best.w, true);
    this.showToast(eaters ? `Die Tiere im Gehege ${e.name} kommen zum Fressen!` : `Lecker Futter im Gehege ${e.name} … aber gerade frisst niemand davon.`);
  }

  // Futter von "from" aus ins Gehege werfen (Spieler oder Besucher): die Tiere dort kommen herbei und fressen, jedes an
  // seinem eigenen Platz. food: wohin es fliegt (sonst die Gehegekachel am nächsten bei "from"); always: auch werfen,
  // wenn gerade niemand frisst. Ergebnis: wie viele Tiere kommen
  feedEnclosure(e, from, food = null, always = false) {
    if (!food) {
      let best = null;
      for (const t of e.tiles) {
        if (isBlocked(t.tx, t.ty)) continue;
        const w = tileToWorld(t.tx, t.ty);
        const d = Math.hypot(w.x - from.x, (w.y - from.y) * 2);
        if (!best || d < best.d) best = { w, d };
      }
      if (!best) return 0;
      food = best.w;
    }
    const eaters = this.animals.filter((a) => a.enclosure === e && !NO_PEN_FEED.includes(a.species) && a.canFeed());
    if (!eaters.length && !always) return 0;
    this.scatterFood(from, food);
    if (!eaters.length) return 0;
    // Futterplätze: freie Stellen im Gehege rund ums Futter, mit Abstand zueinander (nichts überlagert sich)
    const spots = [];
    const candidates = [];
    for (const t of e.tiles) {
      if (isBlocked(t.tx, t.ty)) continue;
      const c = tileToWorld(t.tx, t.ty);
      for (const [ox, oy] of [[0, 0], [-14, -5], [14, 5], [14, -5], [-14, 5]]) candidates.push({ x: c.x + ox, y: c.y + oy });
    }
    candidates.sort((u, v) => Math.hypot(u.x - food.x, (u.y - food.y) * 2) - Math.hypot(v.x - food.x, (v.y - food.y) * 2));
    for (const c of candidates) {
      if (spots.length >= eaters.length) break;
      if (Math.hypot(c.x - food.x, (c.y - food.y) * 2) < 12) continue; // nicht mitten aufs Futter
      if (spots.every((s) => Math.hypot(s.x - c.x, (s.y - c.y) * 2) >= FEED_GAP * 1.4)) spots.push(c);
    }
    // jedes Tier zum nächsten noch freien Platz
    const free = [...spots];
    for (const a of [...eaters].sort((u, v) => Math.hypot(u.x - food.x, u.y - food.y) - Math.hypot(v.x - food.x, v.y - food.y))) {
      if (!free.length) break;
      free.sort((u, v) => Math.hypot(u.x - a.x, u.y - a.y) - Math.hypot(v.x - a.x, v.y - a.y));
      a.eatAt(free.shift(), food, Phaser.Math.FloatBetween(...FEED_TIME));
    }
    return eaters.length;
  }

  // bunte Futterflocken fliegen in einem Bogen aufs Wasser, dann kleine Ringe
  scatterFood(from, spot) {
    const colors = [0xf08a2c, 0xe8483f, 0xf2c84a];
    for (let i = 0; i < 12; i++) {
      const tx = spot.x + Phaser.Math.Between(-14, 14);
      const ty = spot.y + Phaser.Math.Between(-5, 5);
      const flake = this.add.rectangle(from.x, from.y - 18, 2, 2, colors[i % 3]).setDepth(100000);
      this.tweens.add({ targets: flake, x: tx, duration: 450 + i * 25, ease: 'Linear' });
      this.tweens.add({
        targets: flake,
        y: { value: from.y - 34, duration: 200 + i * 12, ease: 'Quad.easeOut', yoyo: false },
        onComplete: () =>
          this.tweens.add({
            targets: flake,
            y: ty,
            duration: 260 + i * 13,
            ease: 'Quad.easeIn',
            onComplete: () => {
              flake.setDepth(-99998.5);
              // das Futter treibt so lange auf dem Wasser, wie die Koi daran schnappen
              this.tweens.add({ targets: flake, alpha: 0, delay: KOI_FOOD_FLOAT, duration: 1500, onComplete: () => flake.destroy() });
              if (i % 4 === 0) {
                const ring = this.add.ellipse(tx, ty, 8, 3).setStrokeStyle(1, 0xffffff, 0.8).setDepth(-99998.5);
                this.tweens.add({ targets: ring, scale: 2.5, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
              }
            },
          }),
      });
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
    // Hinweise auf ausgelegte Fallen nur im Wald (dort gibt es die Falle); woanders keine
    const traps = LEVEL_ID === 'forest' ? game.traps : [];
    for (const t of traps) {
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
    // Hinweise zu Fallen, die es nicht mehr gibt (oder außerhalb des Waldes), entfernen
    for (const [id, el] of this.markers) {
      if (traps.some((t) => t.id === id)) continue;
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
    this.showToast(`${surprise}Die Falle ist wieder im Regal.`);
  }

  // Kiste an dieser Kachel (aus LEVEL.chests)
  chestAt(tx, ty) {
    return (LEVEL.chests ?? []).find((c) => c.tx === tx && c.ty === ty) ?? null;
  }

  // Werkzeug-Kiste öffnen: Werkzeuge dieses Gebiets und "Hände frei"; das Spiel pausiert so lange
  openChest(chest) {
    if (!chest || this.leaving || isToolChestOpen() || isTravelMapOpen() || isJournalOpen()) return;
    const items = [...chest.tools.map((id) => ({ id, name: TOOLS[id].name, image: id })), { id: null, name: 'Hände frei', image: 'hand' }];
    this.scene.pause();
    openToolChest(
      items,
      this.toolId,
      (id) => {
        this.scene.resume();
        if (id === this.toolId) return;
        if (id) {
          this.equipTool(id); // das getragene Werkzeug kommt zurück in die Kiste
          this.showToast(`${TOOLS[id].name} genommen. ${this.toolHint(id)}`);
        } else if (this.tool) this.dropTool();
      },
      () => this.scene.resume(),
    );
  }

  // Weltkarte öffnen (am Auto): das Spiel pausiert, bis man losfährt oder die Karte schließt
  openCarMap() {
    if (this.leaving || isTravelMapOpen() || isJournalOpen()) return;
    const places = Object.entries(LEVELS)
      .filter(([, l]) => l.car && l.map)
      .map(([id, l]) => ({ id, name: l.name, icon: l.map.icon, x: l.map.x, y: l.map.y }));
    this.scene.pause();
    openTravelMap(
      places,
      LEVEL_ID,
      (id) => {
        this.scene.resume();
        this.travelTo(id);
      },
      () => this.scene.resume(),
    );
  }

  // Schnellreise: wie ein Gebietswechsel (Tiere kommen mit), Ankunft vor dem Auto im Zielgebiet
  travelTo(id) {
    if (this.cache.audio.exists('car')) this.sound.play('car', { volume: CAR_VOLUME }); // Motor springt an
    const car = LEVELS[id].car;
    this.leaveLevel({ to: id, arrive: { tx: car.tx + 1, ty: car.ty + 1 }, label: LEVELS[id].name });
  }

  // Tierpark: alle Tiere, die einem folgen, ziehen sofort in ihr Gehege ein – bevorzugt in das ihrer Herkunftswelt.
  // Gibt den Zusatz für die Meldung beim Ankommen zurück.
  moveFollowersIntoPens() {
    const moved = [];
    const fullBefore = new Set(ENCLOSURES.filter((e) => isFull(this.animals, e)));
    for (const a of [...this.followers]) {
      const fitting = ENCLOSURES.filter((e) => accepts(e, a.species));
      const e = fitting.find((f) => f.world === a.origin) ?? fitting[0];
      if (!e) continue;
      this.placeInPen(a, e);
      this.followers.splice(this.followers.indexOf(a), 1);
      moved.push(a.species);
      this.releaseExtra(e);
    }
    const nowFull = ENCLOSURES.filter((e) => isFull(this.animals, e) && !fullBefore.has(e));
    nowFull.forEach((e, i) => this.time.delayedCall(1400 + i * 3200, () => this.showPenFull(e)));
    let text = moved.length ? `<br>${animalIcons(moved, 2.6)}<br>${moved.length === 1 ? 'Dein Tier ist in sein Gehege gezogen.' : 'Deine Tiere sind in ihre Gehege gezogen.'}` : '';
    if (this.released?.length) {
      const hearts = this.released.reduce((s, r) => s + r.hearts, 0);
      const n = this.released.length;
      text += `<br>🌳 ${animalIcons(this.released.map((r) => r.species), 2.2)} ${n === 1 ? 'wurde' : 'wurden'} im Naturreservat ausgewildert · <span class="heart">♥</span> ${hearts}`;
      this.released = [];
    }
    return text;
  }

  // Gehege voll: das älteste Tier wird im Naturreservat ausgewildert (bringt ein paar Herzen). Seltene Varianten bleiben; sonst zuerst das
  // Aussehen bzw. die Art, von der es am meisten gibt (Schaf, Kuh, Zebra, Giraffe ...), damit die Mischung ausgewogen bleibt
  releaseExtra(e) {
    this.released ??= [];
    // jedes Kontingent für sich: ein neues Zebra kann nur ein Zebra verdrängen, nie eine Giraffe
    for (const { key, cap } of penQuotas(e)) while (penCount(this.animals, e, key) > cap) {
      const inside = this.animals.filter((a) => a.state === 'penned' && a.enclosure === e && !a.baby && (key === null || quotaKey(a.species) === key));
      const looks = {};
      // seltene Varianten bleiben bevorzugt: zuerst zieht ein normales Tier aus, dann ein Bauernhof-Tier, zuletzt ein Skin
      const rarity = (a) => (a.isRare() ? 2 : a.farm ? 1 : 0);
      const least = Math.min(...inside.map(rarity));
      const pool = inside.filter((a) => rarity(a) === least);
      const look = (a) => a.farm ?? a.skin ?? a.variant ?? a.species;
      // in gemeinsamen Gehegen (Zebra und Giraffe, Reh und Hirsch ...) zieht die Art aus, von der es am meisten gibt;
      // bei Gleichstand die, die gerade dazugekommen ist – so verdrängt ein neues Zebra keine Giraffe
      const newest = {};
      for (const a of pool) {
        looks[look(a)] = (looks[look(a)] ?? 0) + 1;
        newest[look(a)] = Math.max(newest[look(a)] ?? 0, a.penSince ?? 0);
      }
      const most = Object.entries(looks).sort((u, v) => v[1] - u[1] || newest[v[0]] - newest[u[0]])[0][0];
      const victim = pool.filter((a) => look(a) === most).sort((u, v) => (u.penSince ?? 0) - (v.penSince ?? 0))[0];
      const hearts = releaseHearts(victim.species, victim.skin ?? victim.variant);
      this.addHearts(hearts, victim.species);
      this.released.push({ species: victim.species, hearts });
      this.animals.splice(this.animals.indexOf(victim), 1);
      this.tweens.add({ targets: [victim.sprite, victim.shadow], alpha: 0, duration: 900, onComplete: () => victim.destroy() });
    }
  }

  // Ist das Gehege für diese Tierart im Tierpark schon voll (samt den Tieren, die gerade mitlaufen)? (für den Hinweis)
  parkPenFull(species, origin) {
    const pens = (LEVELS.park.enclosures ?? []).filter((e) => (!e.species || e.species.includes(species)) && (!e.unlock || game.unlocked.includes(e.unlock)));
    const e = pens.find((f) => f.world === origin) ?? pens[0];
    if (!e || !hasSlots(e)) return false;
    // nur das Kontingent dieser Tierart (in gemeinsamen Gehegen)
    const key = e.quota ? quotaKey(species) : null;
    const cap = penQuotas(e).find((x) => x.key === key)?.cap ?? Infinity;
    const saved = game.levels.park?.animals ?? [];
    const accepts2 = (s) => (key ? quotaKey(s) === key : !e.species || e.species.includes(s));
    const inPen = saved.filter((a) => a.state === 'penned' && accepts2(a.species)).length;
    const coming = this.followers.filter((a) => accepts2(a.species)).length;
    return inPen + coming >= cap;
  }

  // Ein Tier an eine freie Stelle in diesem Gehege setzen (Wassertiere in dessen Teich) und einziehen lassen
  // quiet: ohne Herz (z. B. beim Umsetzen nach einem Ausbau)
  placeInPen(animal, e, quiet = false) {
    // freilaufend (Pfauen): irgendwo im Park in der Nähe eines Wegs loslassen, damit sie sich verteilen
    if (e.free) {
      const t = Phaser.Utils.Array.GetRandom(NEAR_PATH_TILES);
      const spot = t ? tileToWorld(t.tx, t.ty) : { x: this.player.x, y: this.player.y };
      animal.x = spot.x;
      animal.y = spot.y;
      if (quiet) {
        animal.restore('penned');
      } else {
        animal.penSince = Date.now();
        animal.enterPen();
      }
      animal.enclosure = e;
      return;
    }
    const a = e.area;
    const water = ['fish', 'koi', 'crocodile'].includes(animal.species);
    const tiles = [];
    for (const { tx, ty } of e.tiles) if (water ? isFishpond(tx, ty) : !isBlocked(tx, ty)) tiles.push({ tx, ty });
    const t = Phaser.Utils.Array.GetRandom(tiles) ?? { tx: a.tx0, ty: a.ty0 };
    const p = tileToWorld(t.tx, t.ty);
    animal.x = p.x + Phaser.Math.Between(-6, 6);
    animal.y = p.y + Phaser.Math.Between(-3, 3);
    animal.enclosure = e;
    if (quiet) {
      animal.restore('penned');
      animal.enclosure = e;
      return;
    }
    animal.penSince = Date.now();
    animal.enterPen();
  }

  // Ruf eines wilden Pfaus: schallt ab und zu durchs ganze Gebiet (überall gleich laut)
  updatePeacockCall(dt) {
    this.peacockCallTimer = (this.peacockCallTimer ?? Phaser.Math.FloatBetween(5, PEACOCK_CALL_EVERY[1])) - dt;
    if (this.peacockCallTimer > 0) return;
    this.peacockCallTimer = Phaser.Math.FloatBetween(...PEACOCK_CALL_EVERY);
    if (!this.animals.some((a) => a.species === 'peacock' && (a.state === 'wild' || a.enclosure?.free))) return;
    if (this.cache.audio.exists('animal_peacock')) this.sound.play('animal_peacock', { volume: PEACOCK_CALL_VOLUME, detune: Phaser.Math.Between(-80, 80) });
  }

  peacockFlew() {
    this.showToast(`${animalIcon('peacock', 3.2)} Zu nah – der Pfau ist davongeflogen! Warte, bis einer ein Rad schlägt.`);
  }

  // Orang-Utan: der Spieler winkt zurück (👋 über Henrik); was es bewirkt, entscheidet der Orang-Utan
  waveAt(o) {
    const p = this.player;
    const hand = this.add.text(p.x - p.faceX * 12, p.sprite.y - 44, '👋', { fontSize: '16px', resolution: 4 }).setOrigin(0.5).setDepth(100000);
    this.tweens.add({ targets: hand, angle: { from: -20, to: 20 }, duration: 150, yoyo: true, repeat: 2, onComplete: () => hand.destroy() });
    const result = o.playerWaves();
    if (result === 'happy') this.showToast(`${animalIcon('orangutan', 3.2)} Er freut sich! ${'😊'.repeat(o.waves)} Warte, bis er wieder winkt.`);
  }

  orangutanMissed(o, reason) {
    this.showToast(
      reason === 'early'
        ? `${animalIcon('orangutan', 3.2)} Zu früh! Warte, bis er zuerst winkt. Jetzt ist er auf einen anderen Baum gesprungen.`
        : `${animalIcon('orangutan', 3.2)} Zu langsam! Er ist auf einen anderen Baum gesprungen. Wink gleich zurück, wenn er winkt.`,
    );
  }

  orangutanDown() {
    this.showToast(`${animalIcon('orangutan', 3.2)} Dreimal zurückgewinkt! Er klettert herunter – geh hin und streichel ihn.`);
  }

  // Ball (Asien): vor einem Tiger-Schemen im Bambus hinrollen – der Tiger wird neugierig und kommt heraus.
  // auto: der Spieler stand mit dem Ball still (dann ohne Hinweis, wenn kein Tiger in der Nähe ist)
  rollBall(auto) {
    const p = this.player;
    const near = this.animals
      .filter((a) => a.species === 'tiger' && a.isProwling())
      .map((a) => ({ a, d: Math.hypot(a.x - p.x, (a.y - p.y) * 2) }))
      .sort((u, v) => u.d - v.d)[0];
    if (!near || near.d > TIGER_LURE_DIST) {
      if (!auto) this.showToast(`Halte Ausschau nach einem dunklen Schatten im Bambus – und stell dich mit dem Ball davor.`);
      return;
    }
    // der Ball rollt ein Stück auf den Tiger zu (bis vor den Bambus)
    const t = near.a;
    const angle = Math.atan2(t.y - p.y, t.x - p.x);
    const spot = BALL_ROLL.map((r) => ({ x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r * 0.5 })).find((s) => !blockedAt(s.x, s.y, 6, 3)) ?? { x: p.x + p.faceX * 14, y: p.y + 4 };
    // der Ball bleibt am Boden liegen (beim Drüberlaufen hebt man ihn wieder auf); er rollt aus der Hand dorthin
    const ball = new Pickup(this, spot.x, spot.y, 'toy_ball', 'ball', false);
    ball.temporary = true; // wird nicht gespeichert
    ball.sprite.setX(p.x);
    this.tweens.add({ targets: ball.sprite, x: spot.x, angle: 340, duration: 700, ease: 'Quad.easeOut' });
    this.pickups.push(ball);
    // gleich das Lasso in der Hand
    if (this.toolId === 'ball') {
      this.tool.destroy();
      this.tool = null;
      this.toolId = null;
    }
    this.equipTool('lasso');
    t.lure(spot);
    t.ballPickup = ball;
    this.showToast(`${animalIcon('tiger', 3.2)} Der Ball rollt zum Bambus. Jetzt geh ein Stück weg – dann wird der Tiger aufmerksam. Du hast das Lasso in der Hand.`);
  }

  // der Tiger ist herausgekommen und spielt am Ball
  tigerOut() {
    this.showToast(`${animalIcon('tiger', 3.2)} Der Tiger spielt mit dem Ball – gleich rennt er wieder los. Schnell das Lasso!`);
  }

  // nach dem Wurf weggegangen: der Tiger schaut neugierig aus dem Bambus
  tigerCurious() {
    this.showToast(`${animalIcon('tiger', 3.2)} Da schaut jemand neugierig aus dem Bambus … nicht näher kommen!`);
  }

  // zu nah herangekommen (shy) oder nicht weggegangen: der Tiger bleibt im Bambus; den Ball kann man noch aufheben
  tigerShy(t, shy) {
    this.expireBall(t);
    this.showToast(
      shy
        ? `${animalIcon('tiger', 3.2)} Zu nah! Der Tiger ist erschrocken. Halt Abstand, wenn er neugierig schaut.`
        : `${animalIcon('tiger', 3.2)} Der Tiger hat das Interesse verloren. Nach dem Werfen musst du ein Stück weggehen.`,
    );
  }

  // zurück im Bambus: der Ball liegt noch eine Weile da
  tigerBack(t) {
    this.expireBall(t);
  }

  // Der Tiger spielt nicht mehr mit dem Ball: noch BALL_KEEP lang aufhebbar, dann ist er weg (neuen aus dem Regal holen)
  expireBall(t) {
    const ball = t.ballPickup;
    t.ballPickup = null;
    if (!ball || ball.collected) return;
    this.time.delayedCall(BALL_KEEP, () => {
      if (ball.collected) return;
      ball.collected = true;
      this.tweens.killTweensOf(ball.sprite);
      this.tweens.add({ targets: [ball.sprite, ball.shadow], alpha: 0, duration: 800, onComplete: () => (ball.sprite.destroy(), ball.shadow.destroy()) });
    });
  }

  // Ein wildes Tier fangen: es stellt sich hinten in die Reihe
  catchAnimal(animal) {
    // schon weg oder schon gefangen (z. B. Erdmännchen: nach dem ersten Fang verschwindet der Rest der Kolonie, auch die,
    // die im selben Kescherschwung mit erwischt wurden) – so fängt man wirklich nur eins
    // (Tiere aus der Falle sind 'trapped' und dürfen natürlich mit)
    if (animal.state === 'following' || animal.state === 'penned' || !this.animals.includes(animal)) return;
    animal.origin ??= LEVEL_ID;
    // der erste Flamingo: im Tierpark entsteht das Flamingo-Gehege
    if (animal.species === 'flamingo' && !game.unlocked.includes('flamingo')) {
      game.unlocked.push('flamingo');
      this.time.delayedCall(1200, () => this.showToast(`${animalIcon('flamingo', 3.2)} Dein erster Flamingo! Im Tierpark wurde gegenüber vom Haupthaus ein Flamingo-Gehege gebaut.`));
    } // aus welcher Welt es kommt: im Tierpark zieht es in das Gehege dieser Welt
    // Gehege im Tierpark schon voll? Dann vorher Bescheid sagen (es zieht dann eins ins Naturreservat)
    const full = LEVEL_ID !== 'park' && this.parkPenFull(animal.species, animal.origin);
    animal.catch();
    this.followers.push(animal);
    if (animal.species === 'tiger') this.expireBall(animal); // der Ball bleibt noch eine Weile liegen
    const rare = animal.skin && SKINS[animal.species];
    if (rare) this.showToast(`✨ ${rare.male ? 'Ein seltener' : 'Eine seltene'} ${rare.name}! Im Tierpark lockt ${rare.male ? 'er' : 'sie'} besonders viele Besucher an.`);
    if (full) {
      const tag = this.add.text(animal.x, animal.y - 40, '🌳', { fontSize: '18px' }).setOrigin(0.5).setDepth(100000);
      this.tweens.add({ targets: tag, y: tag.y - 18, alpha: 0, delay: 600, duration: 1400, onComplete: () => tag.destroy() });
      this.time.delayedCall(900, () => this.showToast(`🌳 Das Gehege für ${animalIcon(animal.species, 3)} ist schon voll – beim Abgeben zieht ein Tier ins Naturreservat.`));
    }
    // Herdentiere: die anderen der Herde rennen vor Schreck davon und verschwinden
    if (animal.herd) {
      const mates = this.animals.filter((a) => a !== animal && a.herd === animal.herd && a.state === 'wild' && a.scatter);
      for (const a of mates) a.scatter();
      if (mates.length) this.showToast(`Die anderen ${animalIcon(animal.species)} sind vor Schreck davongerannt!`);
    }
    // kurzer Tierruf (falls es für diese Art einen gibt)
    const sound = this.callOf(animal);
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
    if (LEVEL_ID === 'park') game.parkLeftAt = Date.now(); // ab jetzt zählen die Herzen der Abwesenheit
    this.saveLevelState();
    // Hintergrundgeräusch ausblenden, wenn das nächste Level ein anderes hat
    if (ambient && LEVELS[exit.to].ambient !== ambient.key) this.tweens.add({ targets: ambient, volume: 0, duration: 240 });
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.restart({ level: exit.to, arrive: exit.arrive, returned }),
    );
  }

  // Tiere, liegende Werkzeuge und Begleiter dieses Levels merken (beim Verlassen bzw. Neuaufbau)
  saveLevelState() {
    game.levels[LEVEL_ID] = {
      animals: this.animals
        .filter((a) => a.state !== 'following' && !a.baby && !((a.species === 'heron' || a.species === 'flamingo') && a.state === 'wild')) // wilde Reiher fliegen weiter, Babys gibt es nur beim Event
        .map((a) => ({ species: a.species, variant: a.variant, farm: a.farm ?? null, skin: a.skin ?? null, since: a.penSince ?? 0, state: a.state, x: a.x, y: a.y, life: a.life })),
      pickups: this.pickups.filter((p) => !p.collected && !p.temporary).map((p) => ({ tool: p.tool, x: p.x, y: p.y })),
    };
    game.followers = this.followers.map((a) => ({ species: a.species, variant: a.variant, farm: a.farm ?? null, skin: a.skin ?? null, origin: a.origin }));
    game.tool = this.toolId; // beim Neuaufbau bleibt das Werkzeug in der Hand (beim Verlassen ist es schon zurückgelegt)
  }

  // Wegweiser: zeigt mit Pfeilen, in welcher Richtung was liegt
  signEntries(sign) {
    const entries = [];
    for (const exit of EXITS) {
      const species = ALL_SPECIES.filter((s) => LEVELS[exit.to].spawn.weights[s]);
      entries.push([tileToWorld(exit.tx, exit.ty), species.length ? `${exit.label} – ${animalIcons(species)}` : exit.label]);
    }
    for (const { area: a, name, species, world } of ENCLOSURES) {
      const where = world ? `${LEVELS[world].name}: ` : ''; // im Tierpark: zu welcher Welt das Gehege gehört
      entries.push([
        tileToWorld((a.tx0 + a.tx1) / 2, (a.ty0 + a.ty1) / 2),
        species ? `${where}${name} – ${animalIcons(species)}` : `${name} – alle Tiere außer ${animalIcon('fish')}`,
      ]);
    }
    // eigener Fischteich nur, wenn er nicht schon in einem Gehege liegt
    const mid = FISHPOND_TILES[Math.floor(FISHPOND_TILES.length / 2)];
    if (mid && !inPen(mid.tx, mid.ty)) entries.push([tileToWorld(mid.tx, mid.ty), `Fischteich – für ${animalIcon('fish')}`]);
    const h = LEVEL.hut;
    if (h) entries.push([tileToWorld((h.tx0 + h.tx1) / 2, (h.ty0 + h.ty1) / 2), 'Hütte – Werkzeuge im Regal']);

    const arrows = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
    return entries.map(([p, text]) => {
      const i = Math.round(Math.atan2(p.y - sign.y, p.x - sign.x) / (Math.PI / 4));
      return `<div><span class="arrow">${arrows[(i + 8) % 8]}</span>${text}</div>`;
    });
  }

  // Seilnetz über einem Gehege, auf Höhe der Netzstangen. Es liegt über allem, was im Gehege ist,
  // aber hinter allem, was davor steht.
  drawNetRoof(e) {
    const H = 32; // Höhe der Netzstangen
    // Netzfelder (halbe Kacheln): jede Innenkachel, dazu die halbe Kachel bis zur Zaunmitte daneben
    const cells = new Set();
    const add = (a, b) => cells.add(a + ',' + b); // Feld a, b reicht von a/2 bis a/2 + 0.5 (Kachel-Koordinaten)
    for (const { tx, ty } of e.tiles) {
      for (const [da, db] of [[0, 0], [1, 0], [0, 1], [1, 1]]) add(2 * tx - 1 + da, 2 * ty - 1 + db);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        if (e.tileSet.has(tx + dx + ',' + (ty + dy))) continue;
        // halbe Kachel Richtung Zaun
        const ca = dx > 0 ? [2 * tx + 1] : dx < 0 ? [2 * tx - 2] : [2 * tx - 1, 2 * tx];
        const cb = dy > 0 ? [2 * ty + 1] : dy < 0 ? [2 * ty - 2] : [2 * ty - 1, 2 * ty];
        for (const a of ca) for (const b of cb) add(a, b);
      }
    }
    // Ecke eines Netzfelds: (a/2, b/2) in Kachel-Koordinaten (Kachelmitte = ganze Zahl), auf Höhe der Netzstangen
    const corner = (a, b) => {
      const p = tileToWorld(a / 2, b / 2);
      return [p.x, p.y - H];
    };
    const maxY = Math.max(...e.tiles.map(({ tx, ty }) => tileToWorld(tx, ty).y));
    const g = this.add.graphics().setDepth(maxY + TILE_H + 1);
    g.lineStyle(1, 0xd8c89a, 0.55);
    const drawn = new Set();
    const edge = (a0, b0, a1, b1) => {
      const key = [a0, b0, a1, b1].join(',');
      if (drawn.has(key)) return;
      drawn.add(key);
      g.lineBetween(...corner(a0, b0), ...corner(a1, b1));
    };
    g.fillStyle(0x8a7a5a, 0.6);
    for (const key of cells) {
      const [a, b] = key.split(',').map(Number);
      edge(a, b, a + 1, b);
      edge(a, b, a, b + 1);
      edge(a + 1, b, a + 1, b + 1);
      edge(a, b + 1, a + 1, b + 1);
      g.fillRect(...corner(a, b), 1, 1);
    }
  }

  // Tafel unten rechts: am Wegweiser die Richtungen, an einem Gehege-Schild die erlaubten Tiere mit ihren Fußspuren
  updateSign() {
    const p = this.player;
    const near = (s) => Math.hypot(p.x - s.x, (p.y - s.y) * 2) < SIGN_DIST;
    const sign = this.signs.find(near) ?? this.enclosureSigns.find(near) ?? null;
    if (sign === this.shownSign) return;
    this.shownSign = sign;
    this.updateToolbar(); // am Gehegeschild: "Gehege ausbauen"
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
    const places = penQuotas(enclosure)
      .map(({ key, cap }) => `${key ? animalIcon(key) + ' ' : ''}<b>${penCount(this.animals, enclosure, key)} / ${cap}</b>`)
      .join(' · ');
    const slots = hasSlots(enclosure)
      ? `<div class="pen-slots">Plätze: ${places}${isFull(this.animals, enclosure) ? ' ⭐' : ''}${isUpgraded(enclosure) ? ' · ausgebaut' : ` · Ausbau: ${enclosure.upgrade} (${ACTION_KEY} oder Schild antippen)`}</div>`
      : '';
    return `<b>${enclosure.name} · Hier wohnen:</b>${rows.join('')}${slots}`;
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

    // Auto und Anhänger stehen schräg: als Tiefe gilt die Grundlinie dort, wo die Spielfigur gerade ist.
    // So steht man vor dem Anhänger davor und hinter dem Auto dahinter.
    if (this.car && CAR_BODY) {
      const b = CAR_BODY;
      const t = Phaser.Math.Clamp((this.player.x - b.ax) / (b.bx - b.ax), 0, 1);
      this.car.img.setDepth(b.ay + (b.by - b.ay) * t);
    }
    // am Futterautomaten: die Aktionstaste gibt Futter
    const feeder = (LEVEL.feeders ?? []).find((c) => {
      const p = tileToWorld(c.tx, c.ty);
      return Math.hypot(this.player.x - p.x, (this.player.y - p.y) * 2) < CHEST_DIST * 1.6;
    }) ?? null;
    if (feeder !== this.nearFeeder) {
      this.nearFeeder = feeder;
      this.updateToolbar();
    }
    // am Hauptrechner: die Aktionstaste zeigt die Events
    const computer = (LEVEL.computers ?? []).some((c) => {
      const p = tileToWorld(c.tx, c.ty);
      return Math.hypot(this.player.x - p.x, (this.player.y - p.y) * 2) < CHEST_DIST * 1.6;
    });
    if (computer !== this.nearComputer) {
      this.nearComputer = computer;
      this.updateToolbar();
    }
    // an einer Kiste: die Aktionstaste öffnet sie
    const chest = (LEVEL.chests ?? []).find((c) => {
      const p = tileToWorld(c.tx, c.ty);
      return Math.hypot(this.player.x - p.x, (this.player.y - p.y) * 2) < CHEST_DIST * 1.6;
    }) ?? null;
    if (chest !== this.nearChest) {
      this.nearChest = chest;
      this.updateToolbar();
    }
    // in einem Gebäude: Dach und vordere Wände durchsichtig, damit man das Innere sieht
    const { tx: px, ty: py } = worldToTile(this.player.x, this.player.y);
    for (const house of this.houses) {
      const h = house.h;
      const inside = px >= h.tx0 && px <= h.tx1 && py >= h.ty0 && py <= h.ty1 && !(px === h.tx0 || py === h.ty0); // samt Tür
      if (inside !== house.inside) {
        house.inside = inside;
        this.tweens.add({ targets: house.roof, alpha: inside ? HUT_ROOF_ALPHA : (ROOF_ALPHA[h.style] ?? 1), duration: 250 });
        this.tweens.add({ targets: house.front, alpha: inside ? HUT_FRONT_ALPHA : 1, duration: 250 });
      }
    }
    // am Auto: Schild zeigen, die Aktionstaste wird zur Schnellreise (das Auto ist breit, daher seitlich weiter)
    const near = !!this.car && Math.hypot((this.player.x - this.car.x) / (1.6 * this.car.k), (this.player.y - this.car.y) * 2) < CAR_DIST;
    if (near !== this.nearCar) {
      this.nearCar = near;
      this.car.label.setVisible(near);
      this.updateToolbar();
    }
    // am Gehegeschild oder im Gehege: die Werkzeugleiste zeigt "Gehege ausbauen"
    const penHere = this.penAtSign();
    if (penHere !== this.penHere) {
      this.penHere = penHere;
      this.updateToolbar();
    }
    // unter einem Orang-Utan im Baum: die Aktionstaste winkt
    const p0 = this.player;
    const orang = this.animals.find((a) => a.species === 'orangutan' && a.inTree?.() && Math.hypot(a.x - p0.x, (a.y - p0.y) * 2) < WAVE_DIST) ?? null;
    if (orang !== this.nearOrangutan) {
      this.nearOrangutan = orang;
      this.updateToolbar();
    }
    // kurz nach dem Aufheben kein Tausch: sonst wechselt man aus Versehen, wenn man über die Werkzeuge daneben läuft
    if (this.time.now >= (this.toolLockUntil ?? 0)) {
      for (const p of [...this.pickups]) if (p.checkCollect(this.player)) this.takeTool(p);
      if (this.tool && this.handSpots.some((h) => Math.hypot(this.player.x - h.x, this.player.y - h.y) < HAND_DIST)) this.dropTool();
    }
    this.pickups = this.pickups.filter((p) => !p.collected);
    this.tool?.update(dt);

    // Wilde Tiere fangen, die der Spieler berührt oder mit einem Werkzeug erwischt
    for (const a of this.animals) {
      if (a.canBeCaughtWith('touch') && Math.hypot(this.player.x - a.x, this.player.y - a.y) < CATCH_DIST) this.catchAnimal(a);
    }
    if (this.tool) for (const a of this.tool.caughtBy(this.animals)) this.catchAnimal(a);
    this.followers.forEach((s, i) => (s.followGap = FOLLOW_GAP * (i + 1)));

    for (const a of this.animals) a.update(dt, this.player);
    this.visitors?.update(dt);
    this.updatePenCalls(dt);
    this.updatePeacockCall(dt);
    this.cullStatic();
    if (this.riding) this.updateMount(); // in Gebäuden ab-, draußen wieder aufsteigen
    this.eventTimer -= dt;
    if (this.eventTimer <= 0) {
      this.eventTimer = 0.5;
      this.updateEvents();
    }
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
