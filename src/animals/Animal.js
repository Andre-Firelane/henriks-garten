import Phaser from 'phaser';
import { blockedAt, footTiles } from '../world/collision.js';
import { inPen, isGate, homeAt, accepts, bridgeLift, raiseAt, objectAt, biomeOf, LEVEL, LEVEL_ID } from '../world/map.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { TOY_PLAY, TOYS } from '../world/toys.js';
import { rareChance } from '../world/events.js';
import { tr } from '../i18n.js';
import { game } from '../state.js';
import { COATS, coatAnims, coatReady, ensureCoat } from './coats.js';

// Tierarten: alle verhalten sich gleich, nur Aussehen, Tempo und Rhythmus unterscheiden sich.
// frames: Bild-Nummer im Spritesheet je Blickrichtung; originY: Fußlinie im Bild (siehe tools/prepare-characters.js)
export const SPECIES = {
  sheep: {
    texture: 'sheep',
    // Test; nach links gespiegelt. Beim Grasen und als Bauernhof-Tier die Standbilder (siehe Sheep.js)
    anims: { walkDown: 'sheep_walk', walkUp: 'sheep_walk_back', idleDown: 'sheep_idle', idleUp: 'sheep_idle_back' },
    skinAnims: { sheep2: { walkDown: 'sheep2_walk', walkUp: 'sheep2_walk_back', idleDown: 'sheep2_idle', idleUp: 'sheep2_idle_back' } }, // gefleckter Widder (Fellfarben: coats.js)
    baseShare: 42, // weißes Schaf: Anteil an den Fängen neben den Fellfarben und Widdern (share in SKINS.sheep)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 25, // gemütlich, deutlich langsamer als der Spieler (80)
    restChance: 0.4, // Wahrscheinlichkeit, eine Pause einzulegen statt loszulaufen
    restTime: [1, 3], // Sekunden Pause (von, bis)
    walkTime: [1.5, 3.5], // Sekunden Laufen (von, bis)
    stepRate: 9,
    hop: 1.5,
    footW: 9,
    shadowW: 30,
    catchWith: ['touch', 'lasso'], // womit man es fangen kann: 'touch' (berühren), 'net' (Kescher), 'lasso', 'trap' (Falle)
  },
  // Hoftiere der Wiese und des Streichelzoos: grasen wie das Schaf (Sheep.js), Fress-Bild ist farm_<Art>_eat.
  // Früher nur Verkleidungen der Schafe beim Bauernhof-Event (alte Spielstände ziehen um, siehe migratePettingZoo)
  cow: {
    texture: 'farm_cow',
    anims: { walkDown: 'farm_cow_walk', walkUp: 'farm_cow_walk_back', idleDown: 'farm_cow_idle', idleUp: 'farm_cow_idle_back' },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 20, // gemächlich
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1.5, 3],
    stepRate: 8,
    hop: 1,
    footW: 11,
    shadowW: 36,
    catchWith: ['touch', 'lasso'],
  },
  pig: {
    texture: 'farm_pig',
    anims: { walkDown: 'farm_pig_walk', walkUp: 'farm_pig_walk_back' }, // steht im Standbild
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 26,
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 3],
    stepRate: 10,
    hop: 1.5,
    footW: 9,
    shadowW: 30,
    catchWith: ['touch', 'lasso'],
  },
  goat: {
    texture: 'farm_goat',
    anims: { walkDown: 'farm_goat_walk', walkUp: 'farm_goat_walk_back', idleDown: 'farm_goat_idle', idleUp: 'farm_goat_idle_back' },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 32, // etwas flinker als das Schaf
    restChance: 0.4,
    restTime: [0.8, 2.5],
    walkTime: [1, 2.5],
    stepRate: 11,
    hop: 2,
    footW: 8,
    shadowW: 28,
    catchWith: ['touch', 'lasso'],
  },
  cat: {
    texture: 'cat',
    eatTexture: 'cat_eat', // beim Fressen am Futter im Tierpark
    // Test; nach links gespiegelt (nicht beim Fressen und Schlafen)
    anims: { walkDown: 'cat_walk', walkUp: 'cat_walk_back', idleDown: 'cat_idle', idleUp: 'cat_idle_back' },
    skinAnims: { cat2: { walkDown: 'cat2_walk', walkUp: 'cat2_walk_back', idleDown: 'cat2_idle', idleUp: 'cat2_idle_back' } }, // Glöckchen-Katze (Fellfarben: coats.js)
    baseShare: 40, // rot getigert: Anteil an den Fängen neben Fellfarben und Glöckchen-Katzen (share in SKINS.cat)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 60, // flink, aber noch langsamer als der Spieler
    restChance: 0.45,
    restTime: [0.3, 1.2], // kurze Pausen ...
    walkTime: [0.3, 0.8], // ... und kurze, schnelle Sprints
    stepRate: 16,
    hop: 1.5,
    footW: 7,
    shadowW: 24,
    catchWith: ['touch', 'net'],
  },
  deer: {
    texture: 'deer',
    eatTexture: 'deer_eat', // beim Fressen am Futter im Tierpark
    // Animationen nach rechts (Test; nach links gespiegelt, nicht beim Fressen)
    anims: { walkDown: 'deer_walk', walkUp: 'deer_walk_back', idleDown: 'deer_idle', idleUp: 'deer_idle_back' },
    skinAnims: { stag: { walkDown: 'stag_walk', walkUp: 'stag_walk_back', idleDown: 'stag_idle', idleUp: 'stag_idle_back' } }, // Hirsch läuft und steht
    baseShare: 56, // braunes Reh: Anteil an den Fängen neben Fellfarben und Hirschen (share in SKINS.deer)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 30,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 1.5,
    footW: 8,
    shadowW: 26,
    fleeDist: 70, // so nah darf der Spieler kommen, dann rennt es weg
    fleeSpeed: 95, // schneller als der Spieler (80)
    catchWith: ['lasso', 'trap'], // scheu: nur mit dem Lasso aus der Entfernung oder in der Falle
    trapWeight: 1.2, // wie gern es in die Falle geht
  },
  // Antilope (Savanne): wie das Reh, lebt aber in kleinen Gruppen (siehe Antelope.js); nur mit dem Lasso
  antelope: {
    texture: 'antelope',
    anims: { walkDown: 'antelope_walk', walkUp: 'antelope_walk_back', idleDown: 'antelope_idle', idleUp: 'antelope_idle_back' }, // Savanne
    skinAnims: { antelope2: { walkDown: 'antelope2_walk', walkUp: 'antelope2_walk_back', idleDown: 'antelope2_idle', idleUp: 'antelope2_idle_back' } },
    eatTexture: 'antelope_eat', // beim Fressen am Futter im Tierpark
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 96 / 100,
    speed: 30,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 1.5,
    footW: 8,
    shadowW: 26,
    fleeDist: 70,
    fleeSpeed: 95,
    catchWith: ['lasso'],
    herd: true, // erscheint in kleinen Gruppen
  },
  // Zebra (Savanne): Herdentier wie die Antilope, etwas weniger scheu; trinkt ab und zu am Wasserloch
  // und ist dann auch durch Berühren fangbar (siehe Zebra.js)
  zebra: {
    texture: 'zebra',
    anims: { walkDown: 'zebra_walk', walkUp: 'zebra_walk_back', idleDown: 'zebra_idle', idleUp: 'zebra_idle_back' }, // Savanne
    skinAnims: { zebra2: { walkDown: 'zebra2_walk', walkUp: 'zebra2_walk_back', idleDown: 'zebra2_idle', idleUp: 'zebra2_idle_back' } },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 100 / 104,
    speed: 28,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1.5,
    footW: 9,
    shadowW: 28,
    fleeDist: 55, // weniger scheu als die Antilope (70)
    fleeSpeed: 88,
    catchWith: ['lasso', 'touch'], // Berühren nur beim Trinken
    herd: true,
  },
  // Erdmännchen (Savanne): Kolonie aus 3 bis 5 mit einem Wächter (siehe Meerkat.js); nur mit dem Kescher
  meerkat: {
    texture: 'meerkat',
    anims: { walkDown: 'meerkat_walk', walkUp: 'meerkat_walk_back', idleDown: 'meerkat_idle', idleUp: 'meerkat_idle_back' }, // Savanne
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 52 / 56,
    speed: 22,
    restChance: 0.5,
    restTime: [1, 3],
    walkTime: [1, 2],
    stepRate: 12,
    hop: 1.5,
    footW: 5,
    shadowW: 16,
    catchWith: ['net'],
    herd: true,
    groupSize: [3, 5], // so viele erscheinen zusammen (statt HERD_SIZE)
  },
  // Löwe (Savanne): döst unter Akazien, nur durch Kraulen fangbar, solange er schläft (siehe Lion.js)
  lion: {
    texture: 'lion',
    anims: { walkDown: 'lion_walk', walkUp: 'lion_walk_back', idleDown: 'lion_idle', idleUp: 'lion_idle_back' }, // Savanne
    skinAnims: { lion2: { walkDown: 'lion2_walk', walkUp: 'lion2_walk_back', idleDown: 'lion2_idle', idleUp: 'lion2_idle_back' } },
    eatTexture: 'lion_eat', // beim Fressen am Futter im Tierpark
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 26,
    restChance: 0.6,
    restTime: [2, 5],
    walkTime: [1.5, 3],
    stepRate: 8,
    hop: 1.5,
    footW: 10,
    shadowW: 36,
    catchWith: ['touch'],
  },
  // Krokodil (Savanne): taucht wie der Fisch in Wasserlöchern auf; nur mit dem Lasso (siehe Crocodile.js)
  crocodile: {
    texture: 'croc', // an Land (gefangen); im Wasser "croc_water"
    // Savanne; Laufen auch nach oben mit der Animation von vorne
    anims: { walkDown: 'croc_walk', walkUp: 'croc_walk', idleDown: 'croc_idle', idleUp: 'croc_idle_back' },
    skinAnims: { croc_albino: { walkDown: 'croc_albino_walk', walkUp: 'croc_albino_walk', idleDown: 'croc_albino_idle', idleUp: 'croc_albino_idle_back' } },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 88 / 92,
    speed: 12, // gemütliches Schwimmen im Krokodilteich
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 3],
    stepRate: 7,
    hop: 1,
    footW: 6,
    shadowW: 32,
    catchWith: ['lasso'],
  },
  // Giraffe (Savanne): viel größer als die anderen Tiere, läuft gemächlich herum; zahm wird sie nur mit Grünfutter
  // (siehe feedGiraffe in GardenScene)
  giraffe: {
    texture: 'giraffe',
    anims: { walkDown: 'giraffe_walk', walkUp: 'giraffe_walk_back', idleDown: 'giraffe_idle', idleUp: 'giraffe_idle_back' }, // Savanne
    skinAnims: { giraffe2: { walkDown: 'giraffe2_walk', walkUp: 'giraffe2_walk_back', idleDown: 'giraffe2_idle', idleUp: 'giraffe2_idle_back' } }, // Schoko-Giraffe
    baseShare: 70, // neben Netzgiraffe und Schoko-Giraffe (share in SKINS.giraffe)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 164 / 168,
    speed: 16,
    restChance: 0.6,
    restTime: [2, 6],
    walkTime: [1.5, 4],
    stepRate: 6,
    hop: 1,
    footW: 11,
    shadowW: 40,
    catchWith: ['food'],
  },

  // Eichhörnchen sitzen meist auf ihrem Baum (siehe Squirrel.js)
  squirrel: {
    texture: 'squirrel',
    // Test: rennt in Seitenansicht (auch beim Klettern) und sitzt (im Baum und am Boden); nach links gespiegelt
    anims: { walkDown: 'squirrel_run', walkUp: 'squirrel_run', idleDown: 'squirrel_idle', idleUp: 'squirrel_idle' },
    skinAnims: { squirrel2: { walkDown: 'squirrel2_run', walkUp: 'squirrel2_run', idleDown: 'squirrel2_idle', idleUp: 'squirrel2_idle_back' } }, // Streifenhörnchen
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 56 / 60,
    speed: 45,
    restChance: 0.5,
    restTime: [0.5, 1.5],
    walkTime: [0.3, 0.8],
    stepRate: 16,
    hop: 2,
    footW: 5,
    shadowW: 16,
    catchWith: ['touch', 'net', 'trap'],
    trapWeight: 1,
  },
  // Füchse sind noch scheuer als Rehe und lassen sich nur mit der Falle fangen
  fox: {
    texture: 'fox',
    eatTexture: 'fox_eat', // beim Fressen am Futter im Tierpark
    anims: { walkDown: 'fox_walk', walkUp: 'fox_walk_back', idleDown: 'fox_idle', idleUp: 'fox_idle_back' }, // Test; nach links gespiegelt
    skinAnims: { fox2: { walkDown: 'fox2_walk', walkUp: 'fox2_walk_back', idleDown: 'fox2_idle', idleUp: 'fox2_idle_back' } }, // Silberfuchs
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 35,
    restChance: 0.5,
    restTime: [1, 3],
    walkTime: [1, 2.5],
    stepRate: 12,
    hop: 1.5,
    footW: 7,
    shadowW: 22,
    fleeDist: 130, // flieht schon viel früher als das Reh (70)
    fleeSpeed: 110,
    catchWith: ['trap'],
    trapWeight: 3, // Füchse lieben den Köder
  },
  // Biber (Wald, am Fluss): nagt an den Bäumen, kommt nur freiwillig mit, wenn man den Damm repariert (siehe Beaver.js)
  beaver: {
    texture: 'beaver',
    // Videos; beim Stehen knabbert er an einem Holzstück (von vorne und hinten dieselbe Animation)
    anims: { walkDown: 'beaver_walk', walkUp: 'beaver_walk_back', idleDown: 'beaver_gnaw', idleUp: 'beaver_gnaw' },
    skinAnims: { beaver2: { walkDown: 'beaver2_walk', walkUp: 'beaver2_walk_back', idleDown: 'beaver2_gnaw', idleUp: 'beaver2_gnaw' } }, // Nutria
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 56 / 60,
    speed: 22,
    restChance: 0.55,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 1,
    footW: 8,
    shadowW: 24,
    catchWith: ['dam'],
  },
  // Gnu (Savanne, nur bei der Großen Wanderung): läuft aus dem Strom der Herde heraus und wieder hinein (siehe Gnu.js)
  gnu: {
    texture: 'gnu',
    anims: { walkDown: 'gnu_walk', walkUp: 'gnu_walk_back', idleDown: 'gnu_idle', idleUp: 'gnu_idle_back' }, // Savanne
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 28,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1.5,
    footW: 9,
    shadowW: 30,
    catchWith: ['lasso'],
  },
  // Wolf (Wald, nur in der Wolfsnacht): lebt im Rudel, Ochs am Berg beim Heulen (siehe Wolf.js)
  wolf: {
    texture: 'wolf',
    eatTexture: 'wolf_eat', // beim Fressen am Futter im Tierpark
    // Videos; Heulen und Fressen bleiben Standbilder (siehe Wolf.js)
    anims: { walkDown: 'wolf_walk', walkUp: 'wolf_walk_back', idleDown: 'wolf_idle', idleUp: 'wolf_idle_back' },
    skinAnims: { wolf2: { walkDown: 'wolf2_walk', walkUp: 'wolf2_walk_back', idleDown: 'wolf2_idle', idleUp: 'wolf2_idle_back' } },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 22,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 1.5,
    footW: 8,
    shadowW: 34,
    fleeSpeed: 120, // erschrocken rennt das Rudel davon
    catchWith: ['touch'],
  },
  // Frösche hüpfen im Kreis (siehe Frog.js) und leben gern am Wasser
  frog: {
    texture: 'frog',
    // Test: hüpft und sitzt (nach links gespiegelt); siehe Frog.js
    anims: { walkDown: 'frog_hop', walkUp: 'frog_hop_back', idleDown: 'frog_idle', idleUp: 'frog_idle_back' },
    skinAnims: { frog2: { walkDown: 'frog2_hop', walkUp: 'frog2_hop_back' } }, // blauer Frosch (sitzt noch ohne Animation)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 48 / 52,
    speed: 30, // nur im Gehege, sonst hüpft er im Kreis
    restChance: 0.5,
    restTime: [0.8, 2],
    walkTime: [0.4, 1],
    stepRate: 8,
    hop: 4,
    footW: 5,
    shadowW: 18,
    catchWith: ['touch', 'net'],
  },
  // Fischreiher fliegen über die Karte und landen manchmal am Wasser (siehe Heron.js);
  // texture: stehend (auch beim Folgen), flyTexture: fliegend
  heron: {
    texture: 'heron',
    flyTexture: 'heron_fly',
    flyAnims: { down: 'heron_flap', up: 'heron_flap_back' }, // Flügelschlag (Test; nach links gespiegelt)
    skinFlyAnims: { shoebill: { down: 'shoebill_flap', up: 'shoebill_flap_back' }, heron2: { down: 'heron2_flap', up: 'heron2_flap_back' } },
    followFlies: true, // fliegt gefangen hinter dem Spieler her (wie Flamingo und Geier)
    penStands: true, // im Gehege: steht nur oder fliegt (läuft nicht herum, auch nicht zum Futter; siehe Heron.js)
    anims: { idleDown: 'heron_idle', idleUp: 'heron_idle_back' }, // steht (Test); beim Staksen das Standbild
    skinAnims: { shoebill: { idleDown: 'shoebill_idle', idleUp: 'shoebill_idle_back' }, heron2: { idleDown: 'heron2_idle', idleUp: 'heron2_idle_back' } }, // Schuhschnabel bzw. Storch steht
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 104 / 108,
    speed: 25,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2],
    stepRate: 7,
    hop: 1,
    footW: 7,
    shadowW: 26,
    catchWith: ['touch', 'net', 'lasso'],
  },
  // Roter Panda (Bambuswald, nur beim Glühwürmchen-Abend): sitzt im Kirschbaum, das leuchtende Glas lockt ihn herunter
  // (siehe RedPanda.js); im Pandagehege zusammen mit den Pandas
  redpanda: {
    texture: 'redpanda',
    eatTexture: 'redpanda_sit', // sitzt (unten am leuchtenden Glas)
    anims: { walkDown: 'redpanda_walk', walkUp: 'redpanda_walk' }, // Video, nur von vorne (auch nach oben)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 26,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1.5,
    footW: 7,
    shadowW: 24,
    catchWith: ['touch'],
  },
  // Tanuki (Bambuswald, im Tal bei den Steinlaternen): verkleidet sich als Laterne, Busch oder Grasbüschel; berührt man
  // die Verkleidung, sitzt er verdutzt da und lässt sich durch Berühren fangen (siehe Tanuki.js)
  tanuki: {
    texture: 'tanuki',
    anims: { walkDown: 'tanuki_walk', walkUp: 'tanuki_walk_back', idleDown: 'tanuki_idle', idleUp: 'tanuki_idle_back' }, // Videos; Fuchs-Tanuki (tanuki2) weiter als Standbild
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 28,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 1.5,
    footW: 7,
    shadowW: 26,
    catchWith: ['touch'],
  },
  // Yak (Bambuswald, Hochebene): grast in der Herde am Steinhaufen; mit dem Salzstein gelockt und dreimal gebürstet,
  // kommt es mit (siehe Yak.js und world/YakHerd.js).
  yak: {
    texture: 'yak',
    anims: { walkDown: 'yak_walk', walkUp: 'yak_walk_back', idleDown: 'yak_idle', idleUp: 'yak_idle_back' }, // Videos; gefleckter Yak (yak2) weiter als Standbild
    baseShare: 82, // neben dem gefleckten Yak und seinen Fellfarben (share in SKINS.yak)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 100 / 104,
    speed: 12,
    restChance: 0.65,
    restTime: [3, 7],
    walkTime: [1.5, 3],
    stepRate: 6,
    hop: 1,
    footW: 14,
    shadowW: 54,
    catchWith: [],
  },
  // Schneeleopard (Bambuswald, Hochebene; selten): döst auf einem großen Felsen, zu dem seine Pfotenspuren führen; mit
  // dem Lasso gefangen (siehe SnowLeopard.js).
  snowleopard: {
    texture: 'snowleopard',
    anims: { walkDown: 'snowleopard_walk', walkUp: 'snowleopard_walk_back', idleDown: 'snowleopard_idle', idleUp: 'snowleopard_idle_back' }, // Videos
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 26,
    restChance: 0.55,
    restTime: [2, 5],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1,
    footW: 9,
    shadowW: 32,
    catchWith: ['lasso'],
  },
  // Savanne, Wetterphasen (siehe src/world/season.js)
  // Nilpferd (Starkregen): schwimmt im Wasserloch, grast ab und zu am Ufer; nur an Land fangbar (siehe Hippo.js)
  hippo: {
    texture: 'hippo',
    anims: { walkDown: 'hippo_walk', walkUp: 'hippo_walk_back', idleDown: 'hippo_idle', idleUp: 'hippo_idle_back' }, // Savanne
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 14,
    restChance: 0.55,
    restTime: [2, 5],
    walkTime: [1, 2.5],
    stepRate: 6,
    hop: 1,
    footW: 14,
    shadowW: 58,
    fleeDist: 75, // kommt man näher, trottet es zurück ins Wasser ...
    fleeSpeed: 40, // ... langsamer als Henrik
    catchWith: ['lasso'],
  },
  // Geier (Trockenzeit): kreist über der Savanne und landet oben auf einer kahlen Akazie (siehe Vulture.js)
  vulture: {
    texture: 'vulture',
    anims: { idleDown: 'vulture_idle', idleUp: 'vulture_idle_back' }, // steht
    flyAnims: { down: 'vulture_flap', up: 'vulture_flap_back' }, // Flügelschlag (nach links gespiegelt)
    followFlies: true,
    flyTexture: 'vulture_fly',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 104 / 108,
    speed: 20,
    restChance: 0.6,
    restTime: [2, 5],
    walkTime: [1, 2],
    stepRate: 6,
    hop: 1,
    footW: 7,
    shadowW: 26,
    catchWith: ['net'],
  },
  // Hyäne (Trockenzeit): versteckt, kichert; mit Knochen angelockt frisst sie, dann mit dem Lasso (siehe Hyena.js)
  hyena: {
    texture: 'hyena',
    anims: { walkDown: 'hyena_walk', walkUp: 'hyena_walk_back', idleDown: 'hyena_idle', idleUp: 'hyena_idle_back' }, // Savanne
    eatTexture: 'hyena_eat',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 30,
    restChance: 0.4,
    restTime: [1.5, 3],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1.5,
    footW: 9,
    shadowW: 30,
    catchWith: ['lasso'],
  },
  // Warzenschwein (Trockenzeit): flitzt ins Erdloch, sobald man näher kommt; man lauert davor (siehe Warthog.js)
  warthog: {
    texture: 'warthog',
    anims: { walkDown: 'warthog_walk', walkUp: 'warthog_walk_back', idleDown: 'warthog_idle', idleUp: 'warthog_idle_back' }, // Savanne
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 18,
    restChance: 0.5,
    restTime: [1.5, 3],
    walkTime: [0.8, 1.8],
    stepRate: 10,
    hop: 1.5,
    footW: 9,
    shadowW: 30,
    fleeSpeed: 95, // flitzt ins Loch
    catchWith: ['lasso'],
  },
  // Ara (Dschungel): paarweise in den Uferbäumen, im Tiefflug übers Wasser mit dem Kescher zu fangen (siehe Macaw.js)
  // Tukan (Dschungel, nur bei Starkregen): wie der Ara, aber allein (siehe Macaw.js)
  toucan: {
    texture: 'toucan',
    // Videos: sitzt (vorne und hinten); fliegt mit Flügelschlag
    anims: { idleDown: 'toucan_idle', idleUp: 'toucan_idle_back' },
    flyAnims: { down: 'toucan_flap', up: 'toucan_flap_back' },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 18,
    restChance: 0.5,
    restTime: [1, 4],
    walkTime: [1, 2],
    stepRate: 9,
    hop: 2,
    footW: 5,
    shadowW: 18,
    catchWith: ['net'],
  },
  macaw: {
    texture: 'macaw',
    // Videos: sitzt (nur vorne, auch mit Blick nach oben); fliegt mit Flügelschlag (siehe Macaw.js)
    anims: { idleDown: 'macaw_idle', idleUp: 'macaw_idle' },
    skinAnims: { macaw2: { idleDown: 'macaw2_idle', idleUp: 'macaw2_idle' } },
    flyAnims: { down: 'macaw_flap', up: 'macaw_flap_back' },
    skinFlyAnims: { macaw2: { down: 'macaw2_flap', up: 'macaw2_flap_back' } },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 18,
    restChance: 0.5,
    restTime: [1, 4],
    walkTime: [1, 2],
    stepRate: 9,
    hop: 2,
    footW: 5,
    shadowW: 18,
    catchWith: ['net'],
  },
  // Schlange und Vogelspinne (Dschungel): verstecken sich im Dickicht, fliehen beim Wegschlagen ins nächste (siehe Critter.js)
  snake: {
    texture: 'snake',
    anims: { walkDown: 'snake_walk', walkUp: 'snake_walk_back', idleDown: 'snake_idle', idleUp: 'snake_idle' }, // Videos
    skinAnims: { snake2: { walkDown: 'snake2_walk', walkUp: 'snake2_walk_back', idleDown: 'snake2_idle', idleUp: 'snake2_idle' } },
    baseShare: 55, // orange: neben den Farben und der grünen Baumschlange (share in SKINS.snake)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 14,
    fleeSpeed: 52, // langsamer als Henrik, aber das Dickicht ist nah
    restChance: 0.6,
    restTime: [2, 5],
    walkTime: [1, 3],
    stepRate: 6,
    hop: 0,
    footW: 6,
    shadowW: 26,
    catchWith: ['net'],
  },
  tarantula: {
    // Spinne: die dünnbeinige goldene (Bilder tarantula2); die pelzige Vogelspinne (Bilder tarantula) ist die seltene
    // Gestalt, als Fellfarbe tarantula_fur (coats.js; alte Spielstände: migrateSpiders in save.js)
    texture: 'tarantula2',
    anims: { walkDown: 'tarantula2_walk', walkUp: 'tarantula2_walk_back' }, // Videos; im Stehen das Standbild
    baseShare: 40, // gold: neben den anderen Farben und den Vogelspinnen (alle in coats.js)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 60 / 64,
    speed: 12,
    fleeSpeed: 48,
    restChance: 0.6,
    restTime: [2, 5],
    walkTime: [1, 2],
    stepRate: 14,
    hop: 0,
    footW: 6,
    shadowW: 20,
    catchWith: ['net'],
  },
  // Leguan (Dschungel, normales Wetter, nur am Wasserfall): sonnt sich, wenn die Sonne auf den Wasserfall scheint; nur mit
  // dem Kescher, berührt plumpst er ins Wasser (siehe Iguana.js). Nur Seitenansichten: nach oben wie nach unten
  iguana: {
    texture: 'iguana',
    anims: { walkDown: 'iguana_walk', walkUp: 'iguana_walk', idleDown: 'iguana_idle', idleUp: 'iguana_idle' }, // Videos
    skinAnims: { iguana2: { walkDown: 'iguana2_walk', walkUp: 'iguana2_walk', idleDown: 'iguana2_idle', idleUp: 'iguana2_idle' } },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 52 / 56,
    speed: 16,
    restChance: 0.6,
    restTime: [2, 5],
    walkTime: [1, 2],
    stepRate: 12,
    hop: 0.5,
    footW: 6,
    shadowW: 26,
    catchWith: ['net'],
    thicket: true,
  },
  // Jaguar (Dschungel, bei jedem Wetter; selten als Panther): schläft im Baum (nur der Schwanz hängt heraus), rennt ab und
  // zu auf seiner festen Route zu einem anderen Baum; nur mit dem Lasso (siehe Jaguar.js)
  jaguar: {
    texture: 'jaguar',
    anims: { walkDown: 'jaguar_walk', walkUp: 'jaguar_walk_back', idleDown: 'jaguar_idle', idleUp: 'jaguar_idle' }, // Videos (Stehen nur von vorne)
    skinAnims: { panther: { walkDown: 'panther_walk', walkUp: 'panther_walk_back', idleDown: 'panther_idle', idleUp: 'panther_idle_back' } },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 26,
    animMax: 1.3, // beim Rennen (siehe Jaguar.js) liefe die Animation sonst viel zu schnell
    restChance: 0.5,
    restTime: [2, 5],
    walkTime: [1.5, 3],
    stepRate: 10,
    hop: 1,
    footW: 9,
    shadowW: 34,
    catchWith: ['lasso'],
  },
  // Gorilla (Dschungel, nur bei Nebel, auf der Lichtung): nur durch ein gewonnenes Trommel-Duell (siehe Gorilla.js, DrumTool.js)
  gorilla: {
    texture: 'gorilla',
    anims: { walkDown: 'gorilla_walk', walkUp: 'gorilla_walk_back', idleDown: 'gorilla_idle', idleUp: 'gorilla_idle_back' }, // Videos
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 14,
    restChance: 0.6,
    restTime: [2, 5],
    walkTime: [1.5, 3],
    stepRate: 6,
    hop: 1,
    footW: 11,
    shadowW: 46,
    catchWith: ['drum'],
  },
  // Pinguin (Eiswelt): watschelt in kleinen Gruppen am Wasser entlang; kommt man zu nah, springt er ins Wasser und ist
  // weg (siehe Penguin.js). Aus etwas Abstand fängt man ihn mit dem Lasso
  penguin: {
    texture: 'penguin',
    anims: { walkDown: 'penguin_walk', walkUp: 'penguin_walk_back', idleDown: 'penguin_idle', idleUp: 'penguin_idle_back' }, // Videos
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 14, // gemütliches Watscheln
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 11,
    hop: 1,
    footW: 7,
    shadowW: 26,
    catchWith: ['lasso'],
    herd: true,
    groupSize: [2, 4],
  },
  // Robbe (Eiswelt): schwimmt am Ufer, taucht auf und wünscht sich einen Fisch oder einen Ball – wer ihr genau das
  // zuwirft, fängt sie (siehe Seal.js und TreatTool.js)
  seal: {
    texture: 'seal_lie', // an Land (gefangen, im Gehege); im Wasser zeichnet Seal.js das Bild "seal"
    anims: { walkDown: 'seal_walk', walkUp: 'seal_walk_back' }, // Videos; im Stehen liegt sie (Standbild)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 16,
    restChance: 0.3,
    restTime: [1, 3],
    walkTime: [1, 2],
    stepRate: 6,
    hop: 1,
    footW: 8,
    shadowW: 30,
    catchWith: ['herring', 'sealball'],
  },
  // --- neue Eiswelt-Tiere (docs/plan-eiswelt.md); Standbilder mit 4 Ansichten (tools/static-sheet.py) ---
  // Schneehase: wie die Katze, nur etwas schneller (Hand oder Kescher)
  snowhare: {
    texture: 'snowhare',
    scale: 0.68, // etwas größer gezeichnet als die anderen Tiere (0,5)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 56 / 60,
    speed: 70, // flinker als die Katze (60), noch langsamer als Henrik (80)
    restChance: 0.45,
    restTime: [0.3, 1.2],
    walkTime: [0.3, 0.8],
    stepRate: 18,
    hop: 3,
    footW: 7,
    shadowW: 24,
    catchWith: ['touch', 'net'],
  },
  // Polarfuchs: unsichtbar, nur seine Spuren; am Ende der Spur die Laterne abstellen, dann leuchten seine Augen ->
  // Kescher (siehe ArcticFox.js)
  arcticfox: {
    texture: 'arcticfox',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 32,
    restChance: 0.5,
    restTime: [1, 3],
    walkTime: [1, 2.5],
    stepRate: 12,
    hop: 1.5,
    footW: 7,
    shadowW: 22,
    catchWith: ['net'],
  },
  // Polarwolf: wie der Wolf in der Wolfsnacht ("Ochs am Berg"), aber ohne Spuren und zu jeder Tageszeit (siehe Wolf.js)
  arcticwolf: {
    texture: 'arcticwolf',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 22,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 1.5,
    footW: 8,
    shadowW: 34,
    fleeSpeed: 120,
    catchWith: ['touch'],
  },
  // Schneeeule (nur nachts): man hört sie nur; im Licht der abgestellten Laterne wird sie sichtbar -> Kescher oder Hand
  // (siehe SnowOwl.js)
  snowowl: {
    texture: 'snowowl',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 60 / 64,
    speed: 20,
    restChance: 0.8,
    restTime: [3, 7],
    walkTime: [0.5, 1],
    stepRate: 8,
    hop: 1,
    footW: 6,
    shadowW: 22,
    catchWith: ['net', 'touch'],
  },
  // Rentier: wilde Herde wie die Antilopen (Lasso, die ganze Herde flieht), wechselt aber öfter den Platz (siehe Reindeer.js)
  reindeer: {
    texture: 'reindeer',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 108 / 112,
    speed: 24,
    restChance: 0.55,
    restTime: [2, 5],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1.5,
    footW: 9,
    shadowW: 30,
    fleeDist: 80,
    fleeSpeed: 100,
    catchWith: ['lasso'],
    herd: true,
    groupSize: [3, 5],
  },
  // Walross: am Strand und an der Eiskante, döst immer wieder; ein dösendes Walross mit der Wärmflasche wärmen, dann
  // kommt es mit (siehe Walrus.js)
  walrus: {
    texture: 'walrus',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 96 / 100,
    speed: 10,
    restChance: 0.6,
    restTime: [3, 6],
    walkTime: [1, 2],
    stepRate: 5,
    hop: 1,
    footW: 17,
    shadowW: 64, // (wird größer gezeichnet, siehe SIZE in Walrus.js)
    catchWith: ['warmer'],
  },
  // Eisbär (nachts auf dem Eis): Hering ans Eisloch legen, er setzt sich davor und lauert; dann einen Fisch zuwerfen ->
  // er folgt (siehe PolarBear.js)
  polarbear: {
    texture: 'polarbear',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 100 / 104,
    speed: 20,
    restChance: 0.5,
    restTime: [2, 4],
    walkTime: [1.5, 3],
    stepRate: 8,
    hop: 1,
    footW: 18,
    shadowW: 66, // (wird größer gezeichnet, siehe SIZE in PolarBear.js)
    fleeDist: 110,
    fleeSpeed: 60,
    catchWith: ['herring'],
  },
  // Papageitaucher (nur tagsüber): Kolonie auf den Vogelfelsen am Fjord; wer gerade am Ufer landet -> Kescher
  // (siehe Puffin.js)
  puffin: {
    texture: 'puffin',
    scale: 0.65, // etwas größer gezeichnet als die anderen Tiere (0,5)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 48 / 52,
    speed: 14,
    restChance: 0.6,
    restTime: [1.5, 4],
    walkTime: [0.5, 1.5],
    stepRate: 12,
    hop: 1,
    footW: 6,
    shadowW: 20,
    catchWith: ['net'],
    herd: true, // eine kleine Kolonie
    groupSize: [3, 5],
  },
  // Ameisenbär (Dschungel, bei jedem Wetter): scheu wie das Zebra, nur mit dem Lasso; frisst er aufgerichtet Ameisen am
  // Baum, auch durch Berühren (siehe Anteater.js). Läuft durch Dickicht hindurch (thicket)
  anteater: {
    texture: 'anteater',
    anims: { walkDown: 'anteater_walk', walkUp: 'anteater_walk_back', idleDown: 'anteater_idle', idleUp: 'anteater_idle_back' }, // Videos
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 22,
    restChance: 0.4,
    restTime: [1.5, 4],
    walkTime: [1.5, 3],
    stepRate: 9,
    hop: 1,
    footW: 8,
    shadowW: 34,
    fleeDist: 60,
    fleeSpeed: 86, // etwas schneller als Henrik (80)
    catchWith: ['lasso', 'touch'], // Berühren nur beim Fressen am Baum
    thicket: true,
  },
  // Tapir (Dschungel): wie das Nilpferd im Fluss, nur länger an Land (siehe Tapir.js); mit einem Blätterzweig vom
  // Futterstrauch gefüttert, läuft er mit (siehe LeafBushes.js).
  tapir: {
    texture: 'tapir',
    anims: { walkDown: 'tapir_walk', walkUp: 'tapir_walk_back', idleDown: 'tapir_idle', idleUp: 'tapir_idle_back' }, // Videos (an Land; im Wasser das Standbild tapir_water); Schabrackentapir weiter als Standbild
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 16,
    restChance: 0.55,
    restTime: [2, 5],
    walkTime: [1, 2.5],
    stepRate: 7,
    hop: 1,
    footW: 12,
    shadowW: 40,
    fleeDist: 70, // ohne Zweig in der Hand: kommt man näher, trottet er zurück ins Wasser ...
    fleeSpeed: 40, // ... langsamer als Henrik
    catchWith: ['leaves'],
  },
  // Elch (Wald, Moor): steht wild immer im Moorwasser, im Nebel nur als Schemen zu sehen; im Licht der Moorlaterne wird er
  // sichtbar und lässt sich mit dem Lasso fangen (siehe Elk.js)
  elk: {
    texture: 'elk',
    anims: { walkDown: 'elk_walk', walkUp: 'elk_walk_back', idleDown: 'elk_idle', idleUp: 'elk_idle_back' }, // Videos (gefangen, folgend, im Gehege; wild im Moorwasser das Standbild elk_water)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 124 / 128,
    speed: 18,
    animMax: 1.4, // folgt er Henrik, läuft er viel schneller als sein Grundtempo – die Beine sollen trotzdem nicht wirbeln
    restChance: 0.55,
    restTime: [2, 5],
    walkTime: [1.5, 3],
    stepRate: 6,
    hop: 1,
    footW: 12,
    shadowW: 46,
    catchWith: ['lasso'],
  },
  // Igel (Wald): sitzt versteckt in einem Laubhaufen, der ab und zu raschelt; Nüsse daneben locken ihn heraus, dann mit
  // dem Kescher oder durch Berühren (siehe Hedgehog.js)
  hedgehog: {
    texture: 'hedgehog',
    anims: { walkDown: 'hedgehog_walk', walkUp: 'hedgehog_walk_back', idleDown: 'hedgehog_idle', idleUp: 'hedgehog_idle_back' }, // Videos; Apfel-Igel (hedgehog2) weiter als Standbild
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 60 / 64,
    speed: 14,
    restChance: 0.5,
    restTime: [1, 3],
    walkTime: [1, 2],
    stepRate: 14,
    hop: 0.6,
    footW: 6,
    shadowW: 22,
    catchWith: ['net', 'touch'],
  },
  // Wildschwein (Wald, Eichenhain): scheu, suhlt sich im Schlamm; frisst es hingelegte Eicheln, fängt man es mit dem Lasso
  // (siehe Boar.js).
  boar: {
    texture: 'boar',
    anims: { walkDown: 'boar_walk', walkUp: 'boar_walk_back', idleDown: 'boar_idle', idleUp: 'boar_idle_back' }, // Videos; schlammig: boar_mud_* (siehe Boar.js animSet)
    skinAnims: { boar2: { walkDown: 'boar_walk', walkUp: 'boar_walk_back', idleDown: 'boar_idle', idleUp: 'boar_idle_back' } }, // die Bache sieht genauso aus
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 20,
    restChance: 0.45,
    restTime: [1.5, 4],
    walkTime: [1.5, 3],
    stepRate: 9,
    hop: 1,
    footW: 10,
    shadowW: 38,
    fleeDist: 110, // weiter als das Lasso reicht: man fängt es nur beim Fressen
    fleeSpeed: 72,
    catchWith: ['lasso'],
  },
  // Okapi (Dschungel): scheu, rennt beim ersten Mal weg, wird mit jedem Mal mutiger (siehe Okapi.js); mit einem
  // Blätterzweig gefüttert, läuft es mit.
  okapi: {
    texture: 'okapi',
    anims: { walkDown: 'okapi_walk', walkUp: 'okapi_walk_back', idleDown: 'okapi_idle', idleUp: 'okapi_idle_back' }, // Videos; Streifen-Okapi (okapi2) weiter als Standbild
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 100 / 104,
    speed: 24,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1.5,
    footW: 9,
    shadowW: 30,
    fleeDist: 80,
    fleeSpeed: 92, // etwas schneller als Henrik (80), bleibt aber bald stehen
    catchWith: ['leaves'],
    thicket: true, // läuft durchs Dickicht
  },
  // Brüllaffe (Dschungel): sitzt unsichtbar oben in den Urwaldbäumen, kommt für eine Banane herunter (siehe Howler.js)
  howler: {
    texture: 'howler',
    anims: { walkDown: 'howler_walk', walkUp: 'howler_walk_back', idleDown: 'howler_idle', idleUp: 'howler_idle' }, // Videos; Springen: Standbild
    skinAnims: { gibbon: { walkDown: 'gibbon_walk', walkUp: 'gibbon_walk_back', idleDown: 'gibbon_idle', idleUp: 'gibbon_idle_back' } }, // Gibbon (seltene Variante)
    eatTexture: 'howler_eat', // sitzt und frisst die Banane
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 30,
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 2,
    footW: 6,
    shadowW: 22,
    catchWith: ['lasso'],
  },
  // Japanmakak (Asien): badet in der heißen Quelle, rennt selten wild herum (dann mit dem Lasso), siehe Macaque.js
  macaque: {
    texture: 'macaque',
    // Video; im Stehen (und oben im Baum) sitzt er (Einzelbilder); Baden: Standbild
    anims: { walkDown: 'macaque_walk', walkUp: 'macaque_walk_back', idleDown: 'macaque_sit', idleUp: 'macaque_sit_back' },
    skinAnims: { macaque2: { walkDown: 'macaque2_walk', walkUp: 'macaque2_walk_back', idleDown: 'macaque2_idle', idleUp: 'macaque2_idle_back' } }, // Goldstumpfnase
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 30,
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 2,
    footW: 6,
    shadowW: 22,
    catchWith: ['lasso'],
  },
  // Panda (Asien): bleibt beim Bambus, sitzt und frisst; fangen mit Grünfutter (siehe Panda.js)
  panda: {
    texture: 'panda',
    // Video; im Stehen sitzt und frisst er (idle = fressen, siehe Panda.js), bisher nur von vorne
    anims: { walkDown: 'panda_walk', walkUp: 'panda_walk_back', idleDown: 'panda_idle' },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 18,
    restChance: 0.55,
    restTime: [2, 5],
    walkTime: [1, 3],
    stepRate: 6,
    hop: 1,
    footW: 9,
    shadowW: 34,
    catchWith: ['food'],
  },
  // Tiger (Asien): streift als Schemen durch den Bambus, mit dem Ball lockt man ihn heraus (siehe Tiger.js)
  tiger: {
    texture: 'tiger',
    eatTexture: 'tiger_eat', // beim Fressen am Futter im Tierpark
    anims: { walkDown: 'tiger_walk', walkUp: 'tiger_walk_back', idleDown: 'tiger_idle', idleUp: 'tiger_idle_back' }, // Video
    skinAnims: { tiger2: { walkDown: 'tiger2_walk', walkUp: 'tiger2_walk_back', idleDown: 'tiger2_idle', idleUp: 'tiger2_idle_back' } },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 22,
    restChance: 0.5,
    restTime: [2, 5],
    walkTime: [1, 3],
    stepRate: 7,
    hop: 1,
    footW: 9,
    shadowW: 38,
    catchWith: ['lasso'],
  },
  // Orang-Utan (Asien): sitzt oben in den Urwaldbäumen, kommt nach dem Wink-Spiel herunter (siehe Orangutan.js)
  orangutan: {
    texture: 'orangutan',
    eatTexture: 'orangutan_eat', // sitzt und frisst (am Futter im Tierpark)
    // Video; sitzt und frisst (auch oben im Baum und mit Blick nach oben); wave: winkt im Baum (siehe Orangutan.js)
    anims: { walkDown: 'orangutan_walk', walkUp: 'orangutan_walk_back', idleDown: 'orangutan_idle', idleUp: 'orangutan_idle', wave: 'orangutan_wave' },
    skinAnims: { orangutan2: { walkDown: 'orangutan2_walk', walkUp: 'orangutan2_walk_back', idleDown: 'orangutan2_idle', idleUp: 'orangutan2_idle', wave: 'orangutan2_wave' } },
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 16,
    restChance: 0.6,
    restTime: [2, 6],
    walkTime: [1, 2.5],
    stepRate: 5,
    hop: 1,
    footW: 8,
    shadowW: 30,
    catchWith: ['touch'],
  },
  // Pfau (Asien): scheu wie das Zebra, fliegt manchmal ganz davon; beim Rad-Schlagen fangbar (siehe Peacock.js)
  // Schmetterling (Wiese): flattert in 12 Farben herum und setzt sich auf Blumen (siehe Butterfly.js)
  butterfly: {
    texture: 'butterfly',
    frames: { downRight: 0, downLeft: 0, upRight: 0, upLeft: 0 },
    originY: 0.5,
    speed: 24,
    restChance: 0,
    restTime: [1, 2],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 0,
    footW: 2,
    shadowW: 10,
    fleeDist: 50, // im Flug scheu, ...
    fleeSpeed: 42, // ... aber langsamer als Henrik
    catchWith: ['net'],
  },
  peacock: {
    texture: 'peacock',
    anims: { walkDown: 'peacock_walk', walkUp: 'peacock_walk_back' }, // Video; Stehen und Rad: Standbilder
    skinAnims: { peacock2: { walkDown: 'peacock2_walk' } }, // weißer Pfau: bisher nur von vorne
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 24,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1.5,
    footW: 6,
    shadowW: 24,
    fleeDist: 55, // so scheu wie das Zebra
    fleeSpeed: 85,
    catchWith: ['touch', 'net'], // nur beim Rad-Schlagen
  },
  // Flamingo (Event „Flamingo-Flug“): verhält sich wie der Reiher; babyTexture: graues Küken beim Tierbaby-Event
  flamingo: {
    texture: 'flamingo',
    flyTexture: 'flamingo_fly',
    babyTexture: 'flamingo_baby',
    anims: { idleDown: 'flamingo_idle', idleUp: 'flamingo_idle_back' }, // steht (Küken: Standbild)
    flyAnims: { down: 'flamingo_flap', up: 'flamingo_flap_back' }, // Flügelschlag (nach links gespiegelt)
    followFlies: true,
    penStands: true,
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 104 / 108,
    speed: 25,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2],
    stepRate: 7,
    hop: 1,
    footW: 7,
    shadowW: 26,
    catchWith: ['touch', 'net', 'lasso'],
  },
  // Fische leben im Wasser (siehe Fish.js); frames/originY gelten für den Beutel beim Tragen
  // Koi (Asien): unter Wasser nur bunte Schatten, mit Fischfutter lockt man sie hoch (siehe Koi.js).
  // Gefangen wie der Fisch als Beutel; texture ist eines der drei Farbmuster (koi1 bis koi3)
  koi: {
    texture: 'koi2',
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 }, // im Beutel wie beim Fisch
    originY: 68 / 72,
    speed: 14,
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 20,
    catchWith: ['net'],
  },
  // Riff-Fische (Riff): 22 Arten in Seitenansicht, schweben über dem Meeresboden und flüchten (siehe ReefFish.js);
  // frames/originY gelten für den Beutel, in dem Henrik sie an Land trägt
  reeffish: {
    texture: 'reeffish',
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 },
    originY: 68 / 72,
    speed: 14,
    restChance: 0,
    restTime: [1, 2],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 22,
    fleeDist: 70, // kommt man näher, flüchten sie ...
    fleeSpeed: 45, // ... deutlich langsamer als der Taucher (60): mit dem Kescher holt man sie ein
    catchWith: ['net'],
  },
  // Piranha (Dschungel, Regenzeit): Schwärme im Fluss, nur mit der Angel vom Kanu aus (siehe Piranha.js, RodTool.js);
  // schwimmt wie die Riff-Fische, gefangen in der Transportbox
  piranha: {
    texture: 'piranha',
    bagTexture: 'piranha_box',
    frames: { downRight: 0, downLeft: 0, upLeft: 0, upRight: 0 },
    originY: 72 / 76,
    speed: 14,
    restChance: 0,
    restTime: [1, 2],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 22,
    catchWith: ['rod'],
  },
  // Seepferdchen (Riff): verstecken sich in Korallen und schauen nur kurz heraus (siehe Seahorse.js);
  // swimFrames: Bilder im Spritesheet "seahorse", frames/originY gelten für den Beutel an Land
  seahorse: {
    texture: 'seahorse',
    anims: { walkDown: 'seahorse_swim', walkUp: 'seahorse_swim_back' }, // schwimmt (auch im Stillhalten), siehe ReefFish.render
    swimFrames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 },
    originY: 68 / 72,
    speed: 8,
    restChance: 0,
    restTime: [1, 2],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 14,
    catchWith: ['net'],
  },
  // Krake (Riff): getarnt fast unsichtbar, flieht beim Näherkommen und verschwindet in Tinte (siehe Octopus.js);
  // swimFrames: Bilder im Spritesheet "octopus", frames/originY gelten für den Beutel an Land
  octopus: {
    texture: 'octopus',
    anims: { walkDown: 'octopus_swim', walkUp: 'octopus_swim' }, // nur von vorne
    skinAnims: { octopus2: { walkDown: 'octopus2_swim', walkUp: 'octopus2_swim' } }, // Kalmar: ebenfalls nur von vorne
    swimFrames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 },
    originY: 68 / 72,
    speed: 6,
    restChance: 0,
    restTime: [1, 2],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 26,
    fleeSpeed: 26, // viel langsamer als der Taucher (60) – aber sie hat nur ein paar Sekunden, dann ist sie in der Tinte weg
    catchWith: ['net'],
  },
  // Meeresschildkröte (Riff, selten): im Fischernetz verheddert, man schneidet sie frei (siehe Turtle.js);
  // swimFrames: Bilder im Spritesheet "turtle", frames/originY gelten für den Beutel an Land
  turtle: {
    texture: 'turtle',
    anims: { walkDown: 'turtle_swim', walkUp: 'turtle_swim_back' }, // im Netz das Standbild (siehe ReefFish.swimAnim)
    swimFrames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 },
    originY: 68 / 72,
    speed: 8,
    restChance: 0,
    restTime: [1, 2],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 34,
    catchWith: ['scissors'], // mit der Schere freischneiden (dreimal die Aktionstaste)
  },
  // Qualle (Riff, nur beim Quallen-Schwarm): pulsiert, mit dem Quallenglas nur beim Sinken fangbar (siehe Jellyfish.js);
  // swimFrames: Bilder im Spritesheet "jellyfish", frames/originY gelten für den Beutel an Land
  jellyfish: {
    texture: 'jellyfish',
    anims: { walkDown: 'jellyfish_swim', walkUp: 'jellyfish_swim_back' },
    skinAnims: { jellyfish2: { walkDown: 'jellyfish2_swim', walkUp: 'jellyfish2_swim_back' } }, // Goldqualle
    swimFrames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 },
    originY: 68 / 72,
    speed: 6,
    restChance: 0,
    restTime: [1, 2],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 18,
    catchWith: ['jar'],
  },
  // Rochen (Riff): fangen durch Mitschwimmen (siehe Ray.js); swimFrames: Bilder im Spritesheet "ray",
  // frames/originY gelten für den Beutel an Land
  ray: {
    texture: 'ray',
    anims: { walkDown: 'ray_swim', walkUp: 'ray_swim_back' },
    skinAnims: { ray2: { walkDown: 'ray2_swim', walkUp: 'ray2_swim_back' } }, // Mantarochen
    swimFrames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 },
    originY: 68 / 72,
    speed: 10,
    restChance: 0,
    restTime: [1, 2],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 36,
    catchWith: ['swim'], // mitschwimmen, bis er einem vertraut
  },
  fish: {
    texture: 'fish',
    baseLevels: ['meadow'], // der orange Fisch (ohne Skin) kommt nur auf der Wiese vor, sonst die Arten in SKINS.fish
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 },
    originY: 68 / 72,
    speed: 12, // gemütliches Schwimmen im Fischteich
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 20,
    catchWith: ['net'],
  },
};

// Kann man diese Tierart im Moment überhaupt fangen?
export function isCatchable(kind) {
  return kind.catchWith.length > 0;
}

const FOLLOW_SPEED = 100; // beim Hinterherlaufen schneller als der Spieler, damit es aufholt
const FOLLOW_SLACK = 0.5; // so viele Pixel darf es beim Folgen hinter seinem Platz zurückbleiben, ohne nachzurücken
const ZONE_TILE = 45; // eine Kachel im Maß der Leine (Abstand mit doppeltem y, wie in pickWander)
const TOY_SPOTS = [[-18, 9], [18, 9], [0, 13], [-18, -9], [18, -9]]; // freier Platz vor einem Spielzeug (von dort springt, frisst, klettert es)
// ... und rund um ein großes mit mehreren Plätzen (Heuhäuschen), in zufälliger Reihenfolge besetzt
const SEAT_RING = [[-28, 10], [28, 10], [0, 18], [-28, -10], [28, -10], [-44, 2], [44, 2], [-14, 20], [14, 20]];
const ZONE_PULL = 0.7; // so oft läuft ein Tier außerhalb seines Lieblingsorts dorthin zurück (sonst irgendwohin)
export const FOLLOW_GAP = 34; // Abstand zwischen den Tieren auf der Spur des Spielers
export const CATCH_DIST = 22; // so nah muss der Spieler ran, um es zu fangen
const FOOT_H = 3;
// Die Füße stehen etwas unterhalb der Schattenmitte, sonst wirkt die Figur, als schwebe sie über dem Schatten
export const SPRITE_SINK = 3;
const FEED_WALK_TIMEOUT = 8; // kommt ein Tier nicht ans Futter, frisst es dort, wo es gerade steht

// Zustände: 'wild' läuft frei herum, 'following' folgt dem Spieler, 'penned' ist im Gehege, 'trapped' sitzt in der Falle
// Seltene Skins: anderes Aussehen derselben Tierart. wild: Anteil draußen, baby: Anteil bei den Tierbabys.
// Im Gehege locken sie mehr Besucher an (siehe SKIN_APPEAL in world/visitors.js).
// Eine Art kann auch mehrere Skins haben (Liste); level/seasons: gilt nur dort bzw. in diesen Wetterphasen der Savanne
// (wild dann auch je Phase: { rain: 0.6, dry: 1 }); common: so häufig, dass es keine Meldung „seltene …“ gibt.
// upJump (Fische): oben im Wasser das Sprung-Bild statt der Seitenansicht (siehe Fish.js render)
// share statt wild: alle Skins mit share (und das Grundbild, wo kind.baseLevels es erlaubt) teilen sich die Fänge nach diesem Gewicht.
export const SKINS = {
  // Katze, Reh, Giraffe, Yak, Schlange, Spinne: wie beim Schaf teilen sich Grundbild (kind.baseShare), seltene Gestalt und
  // die Fellfarben aus coats.js die Fänge (share)
  cat: [{ id: 'cat2', name: tr('Glöckchen-Katze', 'bell cat'), male: false, share: 12, baby: 0.03 }], // weiße Langhaarkatze mit Glöckchen
  deer: [{ id: 'stag', name: tr('Hirsch', 'stag'), male: true, share: 10, baby: 0 }], // ein Rehkitz ist nie ein Hirsch
  antelope: { id: 'antelope2', name: tr('Oryx-Antilope', 'oryx antelope'), male: false, wild: 0.1, baby: 0.03 }, // gilt für die ganze Herde
  // Fischarten je Gebiet, alle gleich häufig (share, siehe rollSkin; der orange Fisch nur auf der Wiese, SPECIES.fish.baseLevels).
  // Savanne: immer der Lungenfisch (in der Trockenzeit steckt er im Schlamm). Fische bekommen keine Babys.
  fish: [
    { id: 'fish_carp', name: tr('Karpfen', 'carp'), male: true, level: 'meadow', share: 1, baby: 0, common: true, upJump: true },
    { id: 'fish_tench', name: tr('Schleie', 'tench'), male: false, level: 'meadow', share: 1, baby: 0, common: true, upJump: true },
    { id: 'fish_roach', name: tr('Rotauge', 'roach'), male: false, level: 'meadow', share: 1, baby: 0, common: true, upJump: true },
    { id: 'fish_perch', name: tr('Barsch', 'perch'), male: true, level: 'meadow', share: 1, baby: 0, common: true, upJump: true },
    { id: 'fish_trout', name: tr('Forelle', 'trout'), male: false, level: 'forest', share: 1, baby: 0, common: true },
    { id: 'fish_grayling', name: tr('Äsche', 'grayling'), male: false, level: 'forest', share: 1, baby: 0, common: true, upJump: true },
    { id: 'fish_pike', name: tr('Hecht', 'pike'), male: true, level: 'forest', share: 1, baby: 0, common: true, upJump: true },
    { id: 'fish2', name: tr('Wels', 'catfish'), male: true, level: 'forest', share: 1, baby: 0, common: true, upJump: true },
    { id: 'fish_sturgeon', name: tr('Stör', 'sturgeon'), male: true, level: 'forest', share: 1, baby: 0, common: true, upJump: true },
    { id: 'lungfish', name: tr('Lungenfisch', 'lungfish'), male: true, level: 'savanna', share: 1, baby: 0, common: true },
  ],
  heron: [
    { id: 'shoebill', name: tr('Schuhschnabel', 'shoebill'), male: true, level: 'savanna', seasons: ['rain'], wild: 1, baby: 0, common: true }, // in der Savanne bei Starkregen immer ein Schuhschnabel
    { id: 'heron2', name: tr('Storch', 'stork'), male: true, wild: 0.1, baby: 0.03 },
  ],
  crocodile: { id: 'croc_albino', name: tr('Albino-Krokodil', 'albino crocodile'), male: false, level: 'savanna', seasons: ['rain'], wild: 0.12, baby: 0 },
  tiger: { id: 'tiger2', name: tr('weißer Tiger', 'white tiger'), male: true, wild: 0.1, baby: 0.03 },
  peacock: { id: 'peacock2', name: tr('weißer Pfau', 'white peacock'), male: true, wild: 0.1, baby: 0.03 },
  orangutan: { id: 'orangutan2', name: tr('Orang-Utan mit Backenwülsten', 'orangutan with cheek pads'), male: true, wild: 0.1, baby: 0.03 }, // Flanschen-Männchen
  frog: { id: 'frog2', name: tr('blauer Frosch', 'blue frog'), male: true, wild: 0.1, baby: 0.03 }, // blau mit bunten Punkten
  jellyfish: { id: 'jellyfish2', name: tr('Goldqualle', 'golden jellyfish'), male: false, wild: 0.08, baby: 0 }, // golden, mit Ranken auf dem Schirm
  wolf: { id: 'wolf2', name: tr('schwarzer Wolf', 'black wolf'), male: true, wild: 0.1, baby: 0.03 }, // gilt für das ganze Rudel
  lion: { id: 'lion2', name: tr('Schwarzmähnen-Löwe', 'black-maned lion'), male: true, wild: 0.1, baby: 0 }, // ein Löwenbaby hat noch keine Mähne
  zebra: { id: 'zebra2', name: tr('Schoko-Zebra', 'chocolate zebra'), male: false, wild: 0.1, baby: 0.03 }, // gilt für die ganze Herde
  iguana: { id: 'iguana2', name: tr('Blauer Leguan', 'blue iguana'), male: true, wild: 0.12, baby: 0.03 }, // türkis mit orangem Kamm
  jaguar: { id: 'panther', name: tr('Panther', 'black panther'), male: true, wild: 0.1, baby: 0.03 }, // schwarzer Jaguar
  macaw: { id: 'macaw2', name: tr('Blau-gelber Ara', 'blue-and-yellow macaw'), male: true, wild: 0.15, baby: 0.03 }, // gilt für das ganze Paar
  snake: [{ id: 'snake2', name: tr('grüne Baumschlange', 'green tree snake'), male: false, share: 15, baby: 0 }],
  ray: { id: 'ray2', name: tr('Mantarochen', 'manta ray'), male: true, wild: 0.12, baby: 0 }, // groß, dunkel, mit heller Unterseite
  // Schafe: Fellfarben und Widder teilen sich die Fänge (share; das weiße Schaf: SPECIES.sheep.baseShare); weitere Farben in coats.js
  sheep: [{ id: 'sheep2', name: tr('gefleckter Widder', 'spotted ram'), male: true, share: 10, baby: 0.03 }],
  fox: { id: 'fox2', name: tr('Silberfuchs', 'silver fox'), male: true, wild: 0.1, baby: 0.03 },
  squirrel: { id: 'squirrel2', name: tr('Streifenhörnchen', 'chipmunk'), male: false, neuter: true, wild: 0.1, baby: 0.03 },
  beaver: { id: 'beaver2', name: tr('Nutria', 'nutria'), male: false, wild: 0.1, baby: 0.03 },
  macaque: { id: 'macaque2', name: tr('Goldstumpfnase', 'golden snub-nosed monkey'), male: false, wild: 0.1, baby: 0.03 },
  giraffe: [{ id: 'giraffe2', name: tr('Schoko-Giraffe', 'chocolate giraffe'), male: false, share: 10, baby: 0.03 }], // ohne Flecken
  panda: { id: 'panda2', name: tr('Panda ohne Augenflecken', 'panda without eye patches'), male: true, wild: 0.1, baby: 0.03 },
  // seltene Varianten, bisher nur als Standbilder (Sprites/<Tier>2.webp, tools/rare-static.py); Animationen kommen noch
  anteater: { id: 'anteater2', name: tr('Tamandua', 'tamandua'), male: true, wild: 0.1, baby: 0.03 },
  meerkat: { id: 'meerkat2', name: tr('Fuchsmanguste', 'yellow mongoose'), male: false, wild: 0.1, baby: 0.03 }, // gilt für die ganze Kolonie
  vulture: { id: 'vulture2', name: tr('Ohrengeier', 'lappet-faced vulture'), male: true, wild: 0.1, baby: 0.03 },
  gorilla: { id: 'gorilla2', name: tr('Albino-Gorilla', 'albino gorilla'), male: true, wild: 0.1, baby: 0.03 },
  hyena: { id: 'hyena2', name: tr('Streifenhyäne', 'striped hyena'), male: false, wild: 0.1, baby: 0.03 },
  hippo: { id: 'hippo2', name: tr('Zwergflusspferd', 'pygmy hippo'), male: false, neuter: true, wild: 0.1, baby: 0.03 },
  warthog: { id: 'warthog2', name: tr('Pinselohrschwein', 'red river hog'), male: false, neuter: true, wild: 0.1, baby: 0.03 },
  toucan: { id: 'toucan2', name: tr('Fischertukan', 'keel-billed toucan'), male: true, wild: 0.1, baby: 0.03 },
  penguin: { id: 'penguin2', name: tr('Felsenpinguin', 'rockhopper penguin'), male: true, wild: 0.1, baby: 0.03 }, // gilt für die ganze Gruppe
  seal: { id: 'seal2', name: tr('Sattelrobbe', 'harp seal'), male: false, wild: 0.1, baby: 0.03 }, // im Wasser: seal2_water
  seahorse: { id: 'seahorse2', name: tr('Fetzenfisch', 'leafy seadragon'), male: true, wild: 0.1, baby: 0.03 },
  turtle: { id: 'turtle2', name: tr('Karettschildkröte', 'hawksbill turtle'), male: false, wild: 0.1, baby: 0 },
  octopus: { id: 'octopus2', name: tr('Kalmar', 'squid'), male: true, wild: 0.1, baby: 0.03 },
  tapir: { id: 'tapir2', name: tr('Schabrackentapir', 'Malayan tapir'), male: true, wild: 0.1, baby: 0.03 },
  okapi: { id: 'okapi2', name: tr('Streifen-Okapi', 'striped okapi'), male: false, neuter: true, wild: 0.1, baby: 0.03 },
  elk: { id: 'elk2', name: tr('Rotbrauner Elch', 'chestnut moose'), male: true, wild: 0.1, baby: 0.03 }, // rotbraunes Fell (der normale Elch ist grau)
  hedgehog: { id: 'hedgehog2', name: tr('Apfel-Igel', 'apple hedgehog'), male: true, wild: 0.1, baby: 0.03 }, // trägt einen Apfel auf den Stacheln
  boar: { id: 'boar2', name: tr('Bache mit Frischlingen', 'wild sow with piglets'), male: false, wild: 0.12, baby: 0.03 }, // dasselbe Bild, dazu laufen Frischlinge hinterher (Boar.js)
  tanuki: { id: 'tanuki2', name: tr('Fuchs-Tanuki', 'fox tanuki'), male: true, wild: 0.1, baby: 0.03 },
  yak: [{ id: 'yak2', name: tr('Gefleckter Yak', 'spotted yak'), male: true, share: 10, baby: 0.03 }],
  howler: { id: 'gibbon', name: tr('Gibbon', 'gibbon'), male: true, wild: 0.1, baby: 0.03 }, // früher eine eigene Art (nur bei Nebel), siehe migrateSkinSpecies in save.js
};

// Platzhalter für seltene Skins, solange es noch kein eigenes Bild gibt: dasselbe Bild, nur eingefärbt (tint, siehe
// set skin). id endet auf _r (danach richten sich Anziehung und Auswildern in world/visitors.js). neuter: "das" (Ein seltenes …).
// Kommt das echte Bild, wird der Eintrag oben ein normaler Skin (ohne tint) und hier gestrichen.
const TINT = { gold: 0xffd25a, rose: 0xff9ecb, sky: 0x9cc8ff, lilac: 0xc9a8ff };
// dieselbe Färbung ungefähr als CSS-Filter (Tierbild auf der Kisten-Karte)
const TINT_CSS = {
  [TINT.gold]: 'sepia(0.9) saturate(2.2) brightness(1.05)',
  [TINT.rose]: 'sepia(0.8) saturate(2.5) hue-rotate(290deg)',
  [TINT.sky]: 'sepia(0.8) saturate(2.5) hue-rotate(170deg)',
  [TINT.lilac]: 'sepia(0.8) saturate(2.5) hue-rotate(220deg)',
};
// Fellfarben (umgefärbte Bilder, coats.js) als Skins dazu, mit den Animationen ihrer Vorlage
for (const [species, coats] of Object.entries(COATS)) {
  const kind = SPECIES[species];
  for (const coat of coats) {
    const { g, ramp, ...skin } = coat;
    SKINS[species] = [...[SKINS[species] ?? []].flat(), { ...skin, coat: true }];
    const anims = coatAnims(coat, kind);
    if (anims) (kind.skinAnims ??= {})[coat.id] = anims;
  }
}

const PLACEHOLDER_SKINS = {};
for (const [species, [tint, name, g]] of Object.entries(PLACEHOLDER_SKINS)) {
  if (SKINS[species]) continue;
  SKINS[species] = { id: `${species}_r`, name, male: g === 'm', neuter: g === 'n', wild: 0.1, baby: 0.03, tint, css: TINT_CSS[tint], placeholder: true };
}

// seltener Skin dieser Art, der hier und jetzt vorkommen kann (für die Kisten-Karte "seltenes Tier"), oder null
export function rareSkinHere(species) {
  return skinsHere(species).find((s) => !s.common) ?? null;
}

// seltener Skin dieser Art in einem Biom und Wetter (Expeditionen: für die Karten vor der nächsten Map), oder null
export function rareSkinFor(species, biome, season) {
  return [SKINS[species] ?? []].flat().find((s) => !s.common && (!s.level || s.level === biome) && (!s.seasons || s.seasons.includes(season))) ?? null;
}

// Abspieltempo der Laufanimation: beim normalen Gehtempo (kind.speed) 1, schneller beim Wegrennen und Hinterherlaufen.
// Nicht ganz proportional (Hoch 0,6), sonst trippeln die Beine bei hohem Tempo zu hektisch: dreifaches Tempo -> knapp doppelt so schnell
// max: schneller nicht (kind.animMax, z. B. der Jaguar beim Rennen, sonst wirbeln die Beine)
function walkAnimSpeed(speed, normal, max = 2.2) {
  return Phaser.Math.Clamp(Math.pow((speed ?? normal) / normal, 0.6), 0.7, max);
}

// Skins dieser Art, die hier und jetzt vorkommen können (Gebiet und Wetterphase)
function skinsHere(species) {
  return [SKINS[species] ?? []].flat().filter((s) => (!s.level || s.level === biomeOf()) && (!s.seasons || s.seasons.includes(LEVEL.season)));
}

// Angaben zu einem Skin (Name, männlich ...), oder null
export function skinInfo(species, id) {
  return [SKINS[species] ?? []].flat().find((s) => s.id === id) ?? null;
}

export default class Animal {
  constructor(scene, x, y, species) {
    this.scene = scene;
    this.species = species;
    this.kind = SPECIES[species];
    this.x = x;
    this.y = y;
    this.faceX = Math.random() < 0.5 ? -1 : 1;
    this.faceY = 1;
    this.state = 'wild';
    this.followGap = FOLLOW_GAP;
    this.walkTime = 0;

    this.shadow = scene.add.ellipse(x, y, this.kind.shadowW, this.kind.shadowW / 3, 0x14320a, 0.3);
    this.sprite = scene.add.sprite(x, y, this.kind.texture, this.kind.frames.downRight);
    this.sprite.setOrigin(0.5, this.kind.originY).setScale(this.kind.scale ?? 0.5); // kind.scale: größer bzw. kleiner gezeichnet (sonst 0,5)

    this.pickWander();
    this.wanderTime *= Math.random(); // nicht alle Tiere gleichzeitig loslaufen lassen
  }

  // Entweder eine Pause einlegen oder in eine zufällige Richtung loslaufen
  pickWander() {
    const { restChance, restTime, walkTime } = this.kind;
    if (Math.random() < restChance) {
      this.dirX = 0;
      this.dirY = 0;
      this.wanderTime = Phaser.Math.FloatBetween(...restTime);
    } else {
      // an der Leine (z. B. Zebras am letzten Wasserloch in der Trockenzeit): zu weit weg, dann zurück.
      // Im Gehege mit Lieblingsorten (zones, z. B. Giraffen im Akazienhain der Safari): meistens zurück, ab und zu nicht
      const l = this.state === 'wild' ? this.leash : this.state === 'penned' ? this.zoneLeash() : null;
      const away = l && Math.hypot(this.x - l.x, (this.y - l.y) * 2) > l.r && (!l.loose || Math.random() < ZONE_PULL);
      const angle = away ? Math.atan2(l.y - this.y, l.x - this.x) + Phaser.Math.FloatBetween(-0.5, 0.5) : Math.random() * Math.PI * 2;
      this.dirX = Math.cos(angle);
      this.dirY = Math.sin(angle);
      this.wanderTime = Phaser.Math.FloatBetween(...walkTime);
    }
  }

  // Lieblingsort im Gehege (zones in levels.js, Mitte und Radius in Kacheln) als Leine in Welt-Pixeln, oder null
  zoneLeash() {
    const z = this.enclosure?.zones?.[this.species];
    if (!z) return null;
    const p = tileToWorld(z.tx, z.ty);
    return { x: p.x, y: p.y, r: z.r * ZONE_TILE, loose: true };
  }

  update(dt, player) {
    if (this.state === 'trapped') {
      // In der Falle bleibt es versteckt: welches Tier drin sitzt, ist eine Überraschung beim Abholen
      this.render(false);
      this.sprite.setVisible(false);
      this.shadow.setVisible(false);
      return;
    }
    let moving = false;
    const x0 = this.x;
    const y0 = this.y;
    if (this.state === 'following') {
      // Der Spur des Spielers folgen; ist sie noch zu kurz, einfach in die Nähe laufen
      const target = player.trailPoint(this.followGap);
      const tx = target ? target.x : player.x;
      const ty = target ? target.y : player.y;
      const stop = target ? 1 : this.followGap;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const d = Math.hypot(dx, dy);
      // mit etwas Spielraum: sonst rückt es nach dem Ankommen (Rundung) in jedem Bild ein winziges Stück nach
      // und gilt als laufend, obwohl es steht (Laufanimation statt Stehen)
      if (d > stop + FOLLOW_SLACK) {
        // beim Reiten ist der Spieler schneller: dann laufen sie entsprechend schneller hinterher
        const step = Math.min(Math.max(FOLLOW_SPEED, (player.speed ?? 0) * 1.25) * dt, d - stop);
        // Die Spur ist begehbar, daher ohne Kollision: so bleibt es nirgends hängen
        moving = this.move((dx / d) * step, (dy / d) * step);
      }
      if (this.arrivedHome()) this.enterPen();
    } else if (this.petted) {
      this.petStill(); // Streichelzoo: ein Besucher streichelt es (siehe Visitor.js), es bleibt stehen
    } else if (this.feed) {
      moving = this.updateFeed(dt); // im Tierpark: zum Futter laufen und fressen
    } else if (this.visit) {
      if (this.play) this.endToy(); // spielt bzw. frisst es gerade an der Raufe: erst aufhören (sonst läuft es mit dem Fress-Bild los)
      moving = this.updateVisit(dt, player); // Tierfreund: zum Zaun, an dem Henrik steht (siehe src/world/friends.js)
    } else {
      const play = this.updateToy(dt); // im Gehege mit Spielzeug (zweite Ausbaustufe): ab und zu damit spielen
      moving = play ?? this.updateFree(dt, player);
    }

    if (moving) this.walkTime += dt * (this.fleeing ? 1.8 : 1); // auf der Flucht schnellere Schritte
    else this.walkTime = 0;
    // tatsächliches Tempo (geglättet): danach richtet sich die Geschwindigkeit der Laufanimation
    const v = dt > 0 ? Math.hypot(this.x - x0, this.y - y0) / dt : 0;
    this.moveSpeed = (this.moveSpeed ?? v) + (v - (this.moveSpeed ?? v)) * Math.min(1, dt * 8);
    this.render(moving);
  }

  // Streichelzoo: stehen bleiben und zum Besucher schauen, der es streichelt (petted)
  petStill() {
    const v = this.petted;
    if (Math.abs(v.x - this.x) > 1) this.faceX = v.x < this.x ? -1 : 1;
    this.faceY = v.y < this.y ? -1 : 1;
  }

  // Verhalten, solange das Tier nicht folgt (wild oder im Gehege); gibt zurück, ob es sich bewegt
  updateFree(dt, player) {
    if (this.shouldFlee(player)) return this.flee(dt, player);
    this.wanderTime -= dt;
    if (this.wanderTime <= 0) this.pickWander();
    if (!this.dirX && !this.dirY) return false;
    const moved = this.move(this.dirX * this.kind.speed * dt, this.dirY * this.kind.speed * dt);
    if (!moved) this.pickWander(); // gegen etwas gelaufen: neue Richtung
    return moved;
  }

  // Spielzeug im Gehege (siehe TOY_PLAY in src/world/toys.js): gibt zurück, ob es sich dabei bewegt – oder null, wenn es
  // gerade nicht spielt (dann läuft es wie sonst herum)
  updateToy(dt) {
    const how = TOY_PLAY[this.species];
    if (!how || this.state !== 'penned' || !this.enclosure?.tiles || this.baby) return null;
    if (!this.play) {
      if (this.digging || this.sit?.phase === 'walk' || this.grazing || this.sleeping || this.jumping || this.tree) return null; // ist gerade mit etwas anderem beschäftigt
      this.toyWait = (this.toyWait ?? Phaser.Math.FloatBetween(2, how.every[1])) - dt;
      if (this.toyWait > 0) return null;
      this.toyWait = Phaser.Math.FloatBetween(...how.every);
      // jedes Spielzeug hat einen Platz, große (seats, z. B. das Heuhäuschen der Safari) mehrere rundherum
      const seats = TOYS[how.toy]?.seats ?? 1;
      const others = this.scene.animals.filter((a) => a !== this && a.play);
      const used = (key) => others.filter((a) => a.play.key === key);
      const toys = this.enclosure.tiles
        .filter(({ tx, ty }) => objectAt(tx, ty)?.toy === how.toy && used(`${tx},${ty}`).length < seats)
        .map(({ tx, ty }) => ({ key: `${tx},${ty}`, ...tileToWorld(tx, ty) }))
        .sort((p, q) => Math.hypot(p.x - this.x, p.y - this.y) - Math.hypot(q.x - this.x, q.y - this.y));
      for (const t of toys) {
        // freier Platz vor dem Spielzeug (von dort springt, frisst, klettert es)
        const ring = seats > 1 ? Phaser.Utils.Array.Shuffle([...SEAT_RING]) : TOY_SPOTS;
        const near = used(t.key).map((a) => a.play.spot);
        const spot = ring
          .map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy }))
          .find((p) => !this.blocked(p.x, p.y) && !near.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 10));
        if (spot) {
          // Zeit zum Hinlaufen: nach Entfernung und Tempo (langsame Tiere wie der Panda brauchen länger)
          const time = Math.min(45, (Math.hypot(spot.x - this.x, spot.y - this.y) / this.kind.speed) * 2.5 + 4);
          this.play = { ...t, spot, phase: 'walk', time };
          this.sit = null; // sitzt der Panda am Bambus: steht auf und geht spielen
          break;
        }
      }
      if (!this.play) return null;
    }
    const p = this.play;
    if (p.phase === 'leave') return false; // springt gerade wieder herunter (Tween)
    p.time -= dt;
    if (p.phase === 'walk') {
      const dx = p.spot.x - this.x;
      const dy = p.spot.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) {
        p.phase = 'play';
        p.time = p.total = Phaser.Math.FloatBetween(...how.time);
        this.faceX = Math.sign(p.x - this.x) || this.faceX;
        this.faceY = Math.sign(p.y - this.y) || this.faceY;
        this.startToy(how, p);
        return false;
      }
      // hinlaufen; steht etwas im Weg, schräg daran vorbei (wie zum Bambus)
      const step = Math.min(d, this.kind.speed * dt);
      const angle = Math.atan2(dy, dx);
      const moved = p.time > 0 && [0, 0.5, -0.5, 1, -1, 1.5, -1.5].some((turn) => this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step));
      if (!moved) {
        this.play = null; // kommt nicht hin: später wieder
        return null;
      }
      return true;
    }
    const k = 1 - Math.max(0, p.time) / p.total; // 0 … 1 im Spiel
    const moving = this.playToy(how, p, k);
    if (p.time <= 0) this.stopToy(how, p);
    return moving;
  }

  startToy(how, p) {
    if (how.action === 'perch') {
      // hinauf aufs Spielzeug (knapp davor, damit es über ihm gezeichnet wird)
      this.scene.tweens.add({ targets: this, x: p.x, y: p.y + 1, toyLift: how.lift, duration: 280, ease: 'Quad.easeOut' });
    }
    if (how.action === 'eat') this.setEating(true);
    if (how.action === 'slide') p.from = { x: this.x, y: this.y };
  }

  // jedes Bild beim Spielen; gibt zurück, ob es sich bewegt (Laufbild)
  playToy(how, p, k) {
    if (how.action === 'perch') {
      this.faceY = 1; // oben: schaut nach vorne in die Runde
      return false;
    }
    if (how.action === 'eat') {
      if (!this.eatingLook) this.toyAngle = Math.sin(k * p.total * 6) * 3; // ohne Fress-Bild: nicken
      return false;
    }
    if (how.action === 'rub') {
      this.toyAngle = Math.sin(k * p.total * 14) * 7; // am Pfosten hin und her reiben
      return false;
    }
    if (how.action === 'slide') {
      // klettert hinauf (an der Leiter), sitzt kurz oben, rutscht auf der anderen Seite herunter
      const top = { x: p.x - 4, y: p.y + 1 };
      const end = { x: p.x + (p.x - p.from.x) * 1.2, y: p.y + (p.y - p.from.y) * 1.2 };
      if (k < 0.45) {
        const u = k / 0.45;
        this.x = p.from.x + (top.x - p.from.x) * u;
        this.y = p.from.y + (top.y - p.from.y) * u;
        this.toyLift = how.lift * u;
        return true;
      }
      if (k < 0.6) {
        this.toyLift = how.lift;
        this.faceY = 1;
        return false;
      }
      const u = (k - 0.6) / 0.4;
      this.x = top.x + (end.x - top.x) * u;
      this.y = top.y + (end.y - top.y) * u;
      this.toyLift = how.lift * (1 - u) * (1 - u * 0.3);
      this.faceX = Math.sign(end.x - top.x) || this.faceX;
      this.faceY = Math.sign(end.y - top.y) || this.faceY;
      return false;
    }
    return false;
  }

  stopToy(how, p) {
    if (how.action === 'perch') {
      p.phase = 'leave';
      this.scene.tweens.add({ targets: this, x: p.spot.x, y: p.spot.y, toyLift: 0, duration: 280, ease: 'Quad.easeIn', onComplete: () => this.endToy() });
      return;
    }
    if (how.action === 'slide' && this.blocked(this.x, this.y)) {
      this.x = p.spot.x; // unten angekommen, aber an einer festen Stelle: zurück an den Start
      this.y = p.spot.y;
    }
    this.endToy();
  }

  // beim Speichern: oben auf dem Spielzeug (Wachposten, Rutsche) zählt der Platz davor, sonst steckt es nach dem Laden darin fest
  savedSpot() {
    return this.play && this.play.phase !== 'walk' ? { x: this.play.spot.x, y: this.play.spot.y } : { x: this.x, y: this.y };
  }

  // Spielen beenden (auch mittendrin, z. B. wenn gefüttert wird)
  endToy() {
    if (!this.play) return;
    if (this.play.phase === 'leave' || this.toyLift) this.scene.tweens.killTweensOf(this);
    if (this.play.phase !== 'walk' && this.toyLift && this.play.spot) {
      this.x = this.play.spot.x;
      this.y = this.play.spot.y;
    }
    this.play = null;
    this.toyLift = 0;
    this.toyAngle = 0;
    if (TOY_PLAY[this.species]?.action === 'eat') this.setEating(false);
  }

  // Futter im Gehege: Kann das Tier gerade zum Futter kommen? (z. B. nicht, während es auf dem Kratzbaum schläft)
  canFeed() {
    return this.state === 'penned';
  }

  // zum Futterplatz laufen und dort time Sekunden fressen; food: Mitte des Futters (dorthin schaut es)
  eatAt(spot, food, time) {
    this.endToy(); // spielt es gerade: aufhören
    this.startFeed();
    this.feed = { spot, food, time, phase: 'walk', timeout: FEED_WALK_TIMEOUT };
  }

  // Unterklassen beenden hier besondere Zustände (schlafen, trinken ...), bevor das Tier zum Futter läuft
  startFeed() {}

  // beim Fressen das Fress-Bild (kind.eatTexture, Kopf unten); das Schaf grast stattdessen (siehe Sheep.js)
  setEating(on) {
    // seltene Varianten ohne eigenes Fress-Bild bleiben beim Fressen in ihrem Bild
    this.eatingLook = on && !!this.kind.eatTexture && this.scene.textures.exists(this.eatTexture());
  }

  // Bild für Stehen und Laufen: beim Fressen am Futter das Fress-Bild; mit Skin dessen Bilder (z. B. cat2, cat2_eat)
  baseTexture() {
    return this.texSkin ?? this.kind.texture;
  }
  eatTexture() {
    return this.texSkin ? `${this.texSkin}_eat` : this.kind.eatTexture;
  }

  // Skin setzen: Platzhalter-Skins (tint) färben das normale Bild ein, das bleibt auch bei jedem Bildwechsel
  get skin() {
    return this._skin ?? null;
  }
  set skin(id) {
    this._skin = id ?? null;
    if (id && skinInfo(this.species, id)?.coat) ensureCoat(this.scene, id); // Fellfarbe: Bilder erst jetzt umfärben
    const tint = id ? skinInfo(this.species, id)?.tint : null;
    if (tint) {
      this.sprite?.setTint(tint);
      this.skinTinted = true;
    } else if (this.skinTinted) {
      this.sprite?.clearTint();
      this.skinTinted = false;
    }
  }
  // Skin mit eigenem Bild (Platzhalter-Skins nutzen das normale Bild der Art), oder null
  get texSkin() {
    const id = this._skin;
    const info = id ? skinInfo(this.species, id) : null;
    if (info?.coat && !coatReady(this.scene, id)) {
      // Fellfarbe, deren Bilder noch umgefärbt werden (in kleinen Stücken, coats.js): bis dahin die Grundfarbe
      ensureCoat(this.scene, id);
      return null;
    }
    return info && !info.placeholder ? id : null;
  }
  lookTexture() {
    return this.eatingLook ? this.eatTexture() : this.baseTexture();
  }

  // seltene Variante (Skin wie der Hirsch, weißer Koi): bleibt beim Auszug ins Naturreservat bevorzugt im Gehege
  isRare() {
    return !!this.skin && !skinInfo(this.species, this.skin)?.common;
  }

  // seltener Skin würfeln: from 'wild' (draußen) oder 'baby' (Tierbaby-Event, viel seltener).
  // keep: darf ein Versprechen aus der Kiste einlösen (game.rarePromise, siehe CALLED in world/LuckWorld.js); nicht z. B.
  // ein Reiher, der nur über die Karte hinwegfliegt
  rollSkin(from, keep = true) {
    this.skin = null;
    const promise = game.rarePromise;
    if (from === 'wild' && keep && promise?.level === LEVEL_ID && promise.species === this.species) {
      game.rarePromise = null;
      this.skin = promise.skin;
      this.promised = true; // beim Betreten des Gebiets gibt es die Kisten-Verwaltung noch nicht: sie sucht es dann selbst
      this.scene.luck?.promiseKept(this);
      return;
    }
    const here = skinsHere(this.species);
    const shared = here.filter((s) => s.share);
    if (from === 'wild' && shared.length) {
      // nach Anteilen verteilt (z. B. Fischarten je Gebiet, Fellfarben der Schafe): Grundbild nur, wo es vorkommt.
      // Seltene Anteile (nicht common) zählen beim Event „Seltene Tiere“ und mit der Sternschnuppe mehr (rareChance)
      const base = this.kind.baseLevels && !this.kind.baseLevels.includes(biomeOf()) ? 0 : this.kind.baseShare ?? (this.kind.baseLevels ? 1 : 0);
      const total = base + shared.reduce((n, s) => n + s.share, 0);
      const rareShare = shared.reduce((n, s) => n + (s.common ? 0 : s.share), 0);
      const p = rareShare / total;
      const q = Math.min(0.9, rareChance(p));
      const boost = p > 0 && p < 1 ? (q / (1 - q)) / (p / (1 - p)) : 1; // Verhältnis selten : häufig
      const weight = (s) => (s.common ? s.share : s.share * boost);
      let r = Math.random() * (base + shared.reduce((n, s) => n + weight(s), 0)) - base;
      if (r < 0) return;
      for (const s of shared) {
        r -= weight(s);
        if (r < 0) {
          this.skin = s.id;
          return;
        }
      }
      this.skin = shared.at(-1).id;
      return;
    }
    for (const s of here) {
      const wild = typeof s.wild === 'object' ? s.wild[LEVEL.season] ?? 0 : s.wild ?? 0;
      const chance = from === 'wild' ? (s.common ? wild : rareChance(wild)) : s[from] ?? 0; // Event "Seltene Tiere": 50 %
      if (Math.random() < chance) {
        this.skin = s.id;
        return;
      }
    }
  }

  updateFeed(dt) {
    const f = this.feed;
    if (f.phase === 'walk') {
      f.timeout -= dt;
      const dx = f.spot.x - this.x;
      const dy = f.spot.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 3 || f.timeout <= 0) {
        f.phase = 'eat';
        this.faceX = Math.sign(f.food.x - this.x) || this.faceX;
        this.faceY = Math.sign(f.food.y - this.y) || this.faceY;
        this.setEating(true);
        return false;
      }
      const step = Math.min(d, this.kind.speed * 1.3 * dt);
      const angle = Math.atan2(dy, dx);
      for (const turn of [0, 0.5, -0.5, 1, -1]) {
        if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) return true;
      }
      return false;
    }
    f.time -= dt;
    if (f.time <= 0) {
      this.feed = null;
      this.setEating(false);
      this.pickWander();
    }
    return false;
  }

  // Tierfreund (ab Stufe 2): zum Platz am Zaun laufen, der Henrik am nächsten ist (visit.spot setzt die Szene), dort stehen
  // bleiben und zu ihm schauen. Kommt es nicht weiter (Hindernis), bleibt es eben stehen, wo es ist
  updateVisit(dt, player) {
    const v = this.visit;
    const dx = v.spot.x - this.x;
    const dy = v.spot.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d > 4 && !v.stuck) {
      const step = Math.min(d, this.kind.speed * 1.2 * dt);
      const angle = Math.atan2(dy, dx);
      for (const turn of [0, 0.5, -0.5, 1, -1]) {
        if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) return true;
      }
      v.stuck = true;
    }
    if (Math.abs(player.x - this.x) > 2) this.faceX = player.x < this.x ? -1 : 1;
    this.faceY = player.y < this.y ? -1 : 1;
    return false;
  }

  // Ist ein folgendes Tier an seinem Ziel angekommen? Nur in einem Gehege, das diese Tierart aufnimmt.
  arrivedHome() {
    const enclosure = this.enclosureFullyAt(this.x, this.y);
    if (!enclosure || !accepts(enclosure, this.species)) return false;
    this.enclosure = enclosure;
    return true;
  }

  // Darf der Spawner es gerade entfernen? (Fische und Eichhörnchen nur, wenn man sie nicht sieht)
  canDespawn() {
    return true;
  }

  // Kann der Spieler es in diesem Moment fangen?
  canBeCaughtNow() {
    return this.state === 'wild';
  }

  // ... und mit diesem Werkzeug ('touch' = Berühren)?
  canBeCaughtWith(tool) {
    return this.canBeCaughtNow() && this.kind.catchWith.includes(tool);
  }

  // Bild, Blickrichtung und Wippen beim Laufen
  render(moving) {
    // Aussehen gewechselt, während schon ein Bild bzw. eine Animation läuft (z. B. ist die Fellfarbe eben fertig
    // umgefärbt, siehe coats.js; bis dahin zeigte es die Grundfarbe): aufs neue Bild umschalten, die passende Animation
    // startet dann gleich unten
    const look = this.texSkin;
    if (look !== this.shownLook) {
      if (this.shownLook !== undefined && this.sprite) this.sprite.stop().setFlipX(false).setTexture(this.lookTexture(), 0).setOrigin(0.5, this.kind.originY);
      this.shownLook = look;
    }
    // Animationen (kind.anims, mit Skin kind.skinAnims): ersetzen Standbilder und Wippen. Fehlt eine Animation für
    // die Richtung (z. B. walkUp oder idleUp), zeigt es dort das Standbild
    const anims = this.animSet();
    if (anims) {
      const animKeys = Object.values(anims);
      const key = this.animKey(moving);
      const usable = !!key && !this.eatingLook && this.scene.anims.exists(key);
      if (usable && (this.sprite.texture.key === this.baseTexture() || animKeys.includes(this.sprite.texture.key))) {
        if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== key) {
          // Stehen: an zufälliger Stelle beginnen, damit nicht alle Tiere im Gleichtakt blinzeln
          const idle = key === anims.idleDown || key === anims.idleUp;
          const startFrame = idle ? Math.floor(Math.random() * this.scene.anims.get(key).frames.length) : 0;
          this.sprite.play({ key, startFrame });
          // höhere Bilder: Fußlinie bleibt gleich weit über dem unteren Rand, außer der Bogen nennt seine eigene
          // (Krokodil läuft: der Schwanz hängt unter die Füße)
          const feetY = this.sprite.texture.customData.feetY;
          const below = this.scene.textures.getFrame(this.baseTexture(), 0).height * (1 - this.kind.originY);
          this.sprite.setOrigin(0.5, feetY ? feetY / this.sprite.frame.height : 1 - below / this.sprite.frame.height);
        }
        this.sprite.anims.timeScale = moving ? walkAnimSpeed(this.moveSpeed, this.kind.speed, this.kind.animMax) : 1;
        this.sprite.setFlipX(this.faceX < 0);
        this.placeSprite(false);
        return;
      }
      if (animKeys.includes(this.sprite.texture.key)) {
        this.sprite.stop();
        this.sprite.setFlipX(false);
        this.sprite.setTexture(this.lookTexture(), 0).setOrigin(0.5, this.kind.originY);
      }
    }

    // zwischen Lauf- und Fress-Bild wechseln (andere Bilder wie Schlafen setzen die Unterklassen selbst)
    if (this.kind.eatTexture || this.texSkin) {
      // (auch vom normalen Bild auf das des Skins; andere Bilder wie Schlafen setzen die Unterklassen selbst)
      const key = this.lookTexture();
      const looks = [this.kind.texture, this.kind.eatTexture, this.baseTexture(), this.eatTexture()];
      if (this.sprite.texture.key !== key && looks.includes(this.sprite.texture.key)) this.sprite.setTexture(key, this.sprite.frame.name);
    }
    this.sprite.setFrame(
      this.faceY > 0
        ? this.faceX < 0 ? this.kind.frames.downLeft : this.kind.frames.downRight
        : this.faceX > 0 ? this.kind.frames.upRight : this.kind.frames.upLeft,
    );
    this.placeSprite(moving);
  }

  // ein Bild der Unterklasse zeigen (Standbild, Fressen, Baden …). useLook lässt eine laufende Animation weiterlaufen
  // (ob eine läuft, entscheidet Animal.render); showStill hält sie an, für Bilder, die keine Animation sind
  useLook(key, originY = this.kind.originY) {
    const cur = this.sprite.texture.key;
    if (cur === key || Object.values(this.animSet() ?? {}).includes(cur)) return;
    this.showStill(key, originY);
  }
  showStill(key, originY = this.kind.originY) {
    if (this.sprite.texture.key === key) return;
    this.sprite.stop();
    this.sprite.setFlipX(false);
    this.sprite.setTexture(key, 0).setOrigin(0.5, originY);
  }

  // Animationen dieses Tiers: kind.anims, mit Skin die des Skins (kind.skinAnims) oder keine
  animSet() {
    return this.texSkin ? this.kind.skinAnims?.[this.texSkin] ?? null : this.kind.anims ?? null;
  }

  // welche der Animationen (animSet) gerade läuft, oder keine (dann Standbild)
  animKey(moving) {
    const anims = this.animSet();
    if (!anims) return null; // ohne Animationen (z. B. eine Variante nur mit Standbild)
    const down = this.faceY > 0;
    if (moving) return down ? anims.walkDown : anims.walkUp;
    return down ? anims.idleDown : anims.idleUp;
  }

  // Position, Wippen beim Laufen (wobble) und Zeichenreihenfolge
  placeSprite(wobble) {
    const phase = this.walkTime * this.kind.stepRate;
    const hop = wobble ? Math.abs(Math.sin(phase)) * this.kind.hop : 0;
    // auf einer Bogenbrücke etwas höher; im Terrarium auf einem Sockel um dessen Höhe
    const lift = bridgeLift(this.x, this.y) + (this.state === 'penned' ? raiseAt(...Object.values(worldToTile(this.x, this.y))) : 0);
    const toy = this.toyLift ?? 0; // auf dem Spielzeug (Wachposten, Rutsche): höher, der Schatten bleibt am Boden
    const jump = this.jumpLift ?? 0; // Freudenhüpfer eines Tierfreunds (siehe friendHop in GardenScene)
    this.sprite.setPosition(this.x, this.y - hop - lift - toy - jump + SPRITE_SINK);
    this.sprite.setAngle(wobble ? Math.sin(phase) * 2 : this.toyAngle ?? 0);
    this.shadow.setPosition(this.x, this.y - lift);
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 0.5);
  }

  // Scheue Tiere fliehen, wenn der Spieler zu nah kommt, und beruhigen sich erst mit etwas mehr Abstand
  shouldFlee(player) {
    if (this.state !== 'wild' || !this.kind.fleeDist) return false;
    // Abstand in Kachel-Proportionen (Kacheln sind halb so hoch wie breit)
    const d = Math.hypot(this.x - player.x, (this.y - player.y) * 2);
    if (d < this.kind.fleeDist) this.fleeing = true;
    else if (d > this.kind.fleeDist * 1.6) {
      if (this.fleeing) this.pickWander();
      this.fleeing = false;
    }
    return this.fleeing;
  }

  // Vom Spieler weg rennen; ist der direkte Weg versperrt, schräg zur Seite ausweichen
  flee(dt, player) {
    const away = Math.atan2(this.y - player.y, this.x - player.x);
    const step = this.kind.fleeSpeed * dt;
    for (const turn of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8]) {
      const a = away + turn;
      if (this.move(Math.cos(a) * step, Math.sin(a) * step)) return true;
    }
    return false; // in die Enge getrieben
  }

  // Darf das Tier mit seinen Füßen an Position x/y stehen?
  blocked(x, y) {
    if (this.state === 'following') return false;
    if (blockedAt(x, y, this.kind.footW, FOOT_H, false, false, this.kind.thicket)) return true;
    // Im Gehege bleibt es drin, wilde Tiere laufen nicht von selbst hinein
    if (this.state === 'penned') return this.enclosureFullyAt(x, y) !== this.enclosure;
    return footTiles(x, y, this.kind.footW, FOOT_H).some(
      ({ tx, ty }) => inPen(tx, ty) || isGate(tx, ty),
    );
  }

  // Das Gehege, in dem das Tier mit allen Füßen steht (oder null)
  enclosureFullyAt(x, y) {
    const tiles = footTiles(x, y, this.kind.footW, FOOT_H);
    const enclosure = homeAt(tiles[0].tx, tiles[0].ty); // (auch offene Bereiche wie der Wildpark)
    return enclosure && tiles.every(({ tx, ty }) => homeAt(tx, ty) === enclosure) ? enclosure : null;
  }

  // Bewegt das Tier; gibt zurück, ob es sich bewegt hat
  move(dx, dy) {
    let moved = false;
    if (dx && !this.blocked(this.x + dx, this.y)) {
      this.x += dx;
      moved = true;
    }
    if (dy && !this.blocked(this.x, this.y + dy)) {
      this.y += dy;
      moved = true;
    }
    // Blickrichtung nur bei deutlicher Bewegung ändern, sonst flackert sie
    const len = Math.hypot(dx, dy);
    if (moved && Math.abs(dx) > len * 0.3) this.faceX = Math.sign(dx);
    if (moved && Math.abs(dy) > len * 0.3) this.faceY = Math.sign(dy);
    return moved;
  }

  // Platscher: Ring auf dem Wasser und ein paar Tropfen (Leguan und Pinguin springen ins Wasser)
  splash() {
    const scene = this.scene;
    const ring = scene.add.ellipse(this.x, this.y + 2, 16, 6).setStrokeStyle(1.5, 0xffffff, 0.9).setDepth(this.y - 1);
    scene.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 600, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    for (let i = 0; i < 6; i++) {
      const d = scene.add.circle(this.x, this.y, Phaser.Math.FloatBetween(1, 2), 0xd8f2ff, 0.9).setDepth(this.y + 1);
      scene.tweens.add({ targets: d, x: this.x + Phaser.Math.Between(-12, 12), y: this.y - Phaser.Math.Between(8, 16), alpha: 0, duration: 450, ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
  }

  catch() {
    this.state = 'following';
    this.feed = null; // mitten beim Fressen gefangen
    this.eatingLook = false;
    this.sprite.setVisible(true);
    this.shadow.setVisible(true);
    this.popHeart();
  }

  // Aus der Welt entfernen (beim Rotieren der wilden Tiere)
  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }

  // In die Falle gehen: sitzt dann still im Käfig, bis der Spieler es abholt
  enterTrap(x, y) {
    this.state = 'trapped';
    this.x = x;
    this.y = y;
    this.faceY = 1;
  }

  // Zustand ohne Effekte setzen (beim Betreten eines Levels)
  restore(state) {
    this.state = state;
    if (state === 'penned') {
      const { tx, ty } = worldToTile(this.x, this.y);
      this.enclosure = homeAt(tx, ty);
      this.pickWander();
    }
  }

  enterPen() {
    this.state = 'penned';
    this.pickWander();
    this.popHeart();
  }

  // Tierbaby (beim Event im Tierpark): dasselbe Bild, nur kleiner; wird nicht gespeichert und nicht gezählt
  makeBaby() {
    this.baby = true;
    this.sprite.setScale(0.3 * ((this.kind.scale ?? 0.5) / 0.5));
    this.shadow.setScale(0.6);
  }

  popHeart() {
    const heart = this.scene.add
      .text(this.x, this.y - Math.max(40, this.sprite.displayHeight * 0.85), '♥', { fontFamily: 'Arial', fontSize: '20px', color: '#e8483f', stroke: '#ffffff', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(100000);
    this.scene.tweens.add({
      targets: heart,
      y: heart.y - 20,
      alpha: 0,
      duration: 1200,
      ease: 'Quad.easeOut',
      onComplete: () => heart.destroy(),
    });
  }
}
