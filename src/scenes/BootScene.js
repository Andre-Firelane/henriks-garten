import Phaser from 'phaser';
import { openStartScreen } from '../ui/startScreen.js';
import { openFeatureTour, tourSeen } from '../ui/featureTour.js';
import { afterPaint, hideLoading, setLoadingProgress, showLoading } from '../ui/loading.js';
import { tr } from '../i18n.js';
import { HD, HD_DIR, hdFactor, shrinkTexture } from '../world/hd.js';
import { game } from '../state.js';
import { isActive } from '../world/events.js';

// Handy und Tablet (Touch): WebP-Fassung statt PNG (etwa ein Viertel so groß, siehe tools/make-webp.py); der PC lädt PNG
const USE_WEBP = matchMedia('(pointer: coarse)').matches;
const webpUrl = (url) => (USE_WEBP && /^assets\/(hd2?\/)?[^/]+\.png$/.test(url) ? url.replace(/^assets\//, 'assets/webp/').replace(/\.png$/, '.webp') : url);

// Laden in Paketen, damit das Spiel vor allem am Handy schnell losgeht: erst nur, was Tierpark und Wiese brauchen
// (FIRST_*), dazu die Pakete des Startgebiets; danach lädt im Hintergrund Welt für Welt der Rest (GROUP_ORDER). Fährt man
// in ein Gebiet, dessen Pakete noch fehlen, rücken sie nach vorn und das Spiel wartet mit der Ladeanzeige nur auf sie
// (levelGroups, whenGroupsLoaded). Events mit Tieren aus einem Paket warten ebenso (EVENT_GROUPS).
// Bilder der Tiere in Tierpark und Wiese (von Reh, Fuchs und Eichhörnchen nur das Grundbild, das der Tierpark zeigt),
// Spielfigur in Wiesen-Kleidung, Besucher, Auto
const FIRST_SHEETS = /^(hero|hero_walk|hero_walk_back|hero_idle|(sheep|cat|cat2|frog|frog2|mole|heron|fish|fish2|butterfly)(_.+)?|deer|fox|squirrel|fishbag|koi\d|visitor\d|icecream_seller|mavi|mavi_idle|mavi_wave|car_zoo)$/;
const FIRST_SOUNDS = ['step', 'step_indoor', 'whoosh', 'trap', 'car', 'animal_sheep', 'animal_cat', 'animal_frog', 'animal_fish', 'animal_koi'];
// Pakete je Welt: Tierarten (auch für ihre Gehege im Tierpark), weitere Bilder und Töne (keys, Anfang des Namens; Töne
// der Tiere als Name der Tierart) und Pixel-Art (art). Pixel-Art ohne Paket steht in Tierpark oder Wiese und kommt gleich
// mit (z. B. Grasbüschel, Akazie, Kirschbaum und Steinlaterne als Deko im Tierpark); alles andere ohne Paket (Bauernhof,
// Reittier der Wiese ...) kommt ins Paket misc
const GROUPS = {
  forest: { species: ['deer', 'fox', 'squirrel', 'wolf'], keys: /^(deer|stag|fox|squirrel|wolf|hero_forest|ride_forest)/ },
  savanna: {
    species: ['antelope', 'zebra', 'giraffe', 'lion', 'crocodile', 'meerkat', 'hippo', 'gnu', 'hyena', 'warthog', 'vulture', 'flamingo', 'lungfish', 'shoebill'],
    keys: /^(antelope|zebra|giraffe|lion|croc|meerkat|hippo|gnu|hyena|warthog|vulture|flamingo|lungfish|shoebill|hero_savanna|ride_savanna|bone_pile)/,
    art: /savanna|^sgrass|^sdry|^(acacia_bare|mud|den_sand|boulder)$/,
  },
  asia: {
    species: ['panda', 'redpanda', 'macaque', 'tiger', 'orangutan', 'peacock'],
    keys: /^(panda|redpanda|macaque|tiger|orangutan|peacock|hero_asia|ride_asia)/,
    art: /asia|^agrass|^(hotspring|bamboo|hammock|peacock_perch|sun_rock|torii)$/,
  },
  jungle: {
    species: ['macaw', 'toucan', 'iguana', 'jaguar', 'gorilla', 'howler', 'gibbon', 'anteater', 'snake', 'tarantula', 'piranha'],
    keys: /^(macaw|toucan|iguana|jaguar|panther|gorilla|howler|gibbon|anteater|snake|tarantula|piranha|canoe|waterfall|seaplane|hero_jungle|ride_jungle|tree_rustle)/,
    art: /jungle|reptile|terrarium|^jgrass|^thicket|^(cliff|mangrove|heliconia|hibiscus|spider_web)$/,
  },
  reef: {
    species: ['reeffish', 'seahorse', 'octopus', 'turtle', 'ray', 'jellyfish'],
    keys: /^(reeffish|seahorse|octopus|turtle|ray|jellyfish|minifish|boat_zoo|hero_swim|ride_reef)/,
    art: /reef|aquarium|tank|^aq_|^(anchor_sack|seaweed|coral|shell)$/,
  },
  ice: {
    species: ['penguin', 'seal'],
    keys: /^(hero_ice|penguin|seal|step_snow)/,
    art: /snow|_ice|^ice_/,
  },
};
// in dieser Reihenfolge laden die Pakete im Hintergrund (etwa der Weg durchs Spiel)
const GROUP_ORDER = ['misc', 'forest', 'savanna', 'asia', 'jungle', 'reef', 'ice'];
// Pakete je Gebiet (dazu kommen die der Tiere, die dort stehen oder einem folgen, siehe levelGroups)
const LEVEL_GROUPS = { park: [], meadow: [], forest: ['forest'], savanna: ['savanna'], asia: ['asia'], jungle: ['jungle'], reptiles: ['jungle'], aquarium: ['reef'], reef: ['reef'], ice: ['ice'], park2: ['savanna', 'reef'], park3: ['asia', 'jungle'] };
// Events mit Bildern aus einem Paket (Flamingos fliegen auch über Wiese und Wald; Bauernhof und Reittier auf der Wiese)
export const EVENT_GROUPS = { flamingo: ['savanna'], farm: ['misc'], ride: ['misc'] };
const SPECIES_GROUP = Object.fromEntries(Object.entries(GROUPS).flatMap(([group, { species = [] }]) => species.map((s) => [s, group])));
const REST_DELAY = 2000; // so lange nach dem Spielstart, bis der Hintergrund lädt (erst einmal das Bild aufbauen)

const loaded = new Set(); // fertig geladene Pakete
let queue = []; // Pakete, die noch laden, in dieser Reihenfolge
let current = null; // Paket, das gerade lädt
let currentProgress = 0;
let startBackground = null; // startet den Hintergrund sofort (falls jemand wartet, bevor er von selbst losgeht)
const waiting = []; // { groups, resolve, onProgress }

export const groupsLoaded = (groups) => groups.every((g) => loaded.has(g));

// Pakete, die ein Gebiet braucht: seine eigenen und die der Tiere, die dort stehen bzw. einem folgen (Gehege im Tierpark)
export function levelGroups(level) {
  const groups = new Set(LEVEL_GROUPS[level] ?? GROUP_ORDER);
  for (const a of [...(game.levels[level]?.animals ?? []), ...game.followers]) {
    const group = a.farm ? 'misc' : SPECIES_GROUP[a.species];
    if (group) groups.add(group);
  }
  for (const [id, gs] of Object.entries(EVENT_GROUPS)) if (isActive(id)) gs.forEach((g) => groups.add(g));
  return [...groups];
}

function progressOf(groups) {
  const open = groups.filter((g) => !loaded.has(g));
  return (groups.length - open.length + (open.includes(current) ? currentProgress : 0)) / groups.length;
}

function notify() {
  for (const w of [...waiting]) {
    if (!groupsLoaded(w.groups)) w.onProgress(progressOf(w.groups));
    else {
      waiting.splice(waiting.indexOf(w), 1);
      w.resolve();
    }
  }
}

// wartet, bis diese Pakete geladen sind (sie rücken dafür nach vorn); onProgress(0..1) solange
export function whenGroupsLoaded(groups, onProgress = () => {}) {
  if (groupsLoaded(groups)) return Promise.resolve();
  queue = [...queue.filter((g) => groups.includes(g)), ...queue.filter((g) => !groups.includes(g))];
  onProgress(progressOf(groups));
  startBackground?.();
  return new Promise((resolve) => waiting.push({ groups, resolve, onProgress }));
}

// Paket eines Bilds bzw. Tons (sound); misc, wenn es in keinem steht
function groupOf(key, sound = false) {
  const name = sound && key.startsWith('animal_') ? key.slice(7) : key;
  const art = PIXEL_ART.includes(name);
  for (const [group, def] of Object.entries(GROUPS)) if ((art ? def.art : def.keys)?.test(name)) return group;
  return 'misc';
}

const isFirstAsset = (key, sound) => (sound ? FIRST_SOUNDS.includes(key) : ITEMS.includes(key) || FIRST_SHEETS.test(key) || (PIXEL_ART.includes(key) && groupOf(key) === 'misc'));

// Pixel-Art-Grafiken aus tools/make-sprites.js
const PIXEL_ART = [
  'grass0', 'grass1', 'grass2', 'path', 'soil', 'water',
  'tree', 'bush', 'rock', 'flowers_red', 'flowers_yellow', 'fence_x', 'fence_y', 'gate_x', 'sign_fish', 'fishpond0', 'fishpond1',
  // Wiese (Platzhalter aus tools/meadow-placeholders.py): Weide, Felder, Blumen, Hof, Windmühle, Steg, Seerosen, Enten, Bienen
  'willow', 'sunflowers', 'corn', 'pumpkins', 'cabbages', 'scarecrow', 'flowers_blue', 'flowers_purple', 'flowers_white',
  'dandelion', 'dandelion_blown', 'beehive', 'birdhouse', 'meadow_well', 'meadow_bench', 'woodpile', 'mailbox', 'clothesline',
  'hay_bale', 'windmill', 'windmill_sails', 'meadow_dock', 'lily_pads', 'duck', 'duck_fly0', 'duck_fly1', 'bee',
  'fgrass0', 'fgrass1', 'fgrass2', 'forest_path', 'pine', 'dark_tree', 'dark_bush', 'log', 'fern', 'mushroom',
  'sgrass0', 'sgrass1', 'sgrass2', 'savanna_path', 'acacia', 'boulder', 'dry_bush', 'tuft',
  'planks', 'cat_tree', 'mesh_x', 'mesh_y', 'gate_y', 'net_x', 'net_y',
  'chain_x', 'chain_y', 'post_wood', 'post_mesh', 'post_net', 'post_chain',
  'gate_chain_x', 'gate_chain_y', 'gate_glass_x', 'gate_glass_y', 'gate_glassflap_x', 'gate_glassflap_y', 'gate_net_x', 'gate_net_y',
  'tall_x', 'tall_y', 'post_tall', 'gate_tall_x', 'gate_tall_y', 'den', 'den_sand',
  // Asien
  'agrass0', 'agrass1', 'agrass2', 'asia_path', 'asia_water0', 'asia_water1', 'asia_water2', 'hotspring',
  'bamboo', 'tall_grass', 'jungle_tree', 'cherry_tree', 'hammock', 'peacock_perch',
  'sun_rock', 'stone_lantern', 'torii',
  // Tierpark
  'park_path', 'signpost_post',
  // begehbare Hütten
  'hutwall_meadow_x', 'hutwall_meadow_y', 'post_hutwall_meadow', 'gate_door_meadow_x', 'gate_door_meadow_y', 'hutroof_meadow',
  'hutwall_forest_x', 'hutwall_forest_y', 'post_hutwall_forest', 'gate_door_forest_x', 'gate_door_forest_y', 'hutroof_forest',
  'hutwall_savanna_x', 'hutwall_savanna_y', 'post_hutwall_savanna', 'gate_door_savanna_x', 'gate_door_savanna_y', 'hutroof_savanna',
  'hutwall_asia_x', 'hutwall_asia_y', 'post_hutwall_asia', 'gate_door_asia_x', 'gate_door_asia_y', 'hutroof_asia',
  'hutwall_cathouse_x', 'hutwall_cathouse_y', 'post_hutwall_cathouse', 'hutroof_cathouse',
  'hut_chest_small', 'feeder',
  // Einrichtung der Hütten je Gebiet und ihr Boden
  'hut_desk_meadow', 'hut_chair_meadow', 'hut_plant_meadow', 'hut_shelf_meadow', 'hut_desk_forest', 'hut_chair_forest', 'hut_plant_forest', 'hut_shelf_forest', 'hut_desk_savanna', 'hut_chair_savanna', 'hut_plant_savanna', 'hut_shelf_savanna', 'hut_desk_asia', 'hut_chair_asia', 'hut_plant_asia', 'hut_shelf_asia',
  'planks_forest', 'planks_savanna', 'planks_asia',
  // Haupthaus im Tierpark
  'hutwall_office_x', 'hutwall_office_y', 'post_hutwall_office', 'gate_door_office_x', 'gate_door_office_y', 'hutroof_office',
  'floor_office', 'office_desk', 'office_chair', 'office_plant_monstera', 'office_plant_strelitzia',
  'office_sofa', 'office_table', 'office_armchair', 'office_rug',
  'icecream_stand', // Eisstand-Event
  'tire_swing', 'toy_ball', // Spielzeug im Pandagehege
  'climb_tree', // Kletterbaum im Affengehege
  'hay_shelter', 'hay_rack', 'reeds', 'fountain', 'nest_box', 'lion_rock', // Ausstattung ausgebauter Gehege
  'build_stakes', 'build_planks', // Baustelle vor dem Ausbau
  // Aquarium: Fassade im Tierpark, Halle und Wassertanks, Böden, Deko im Tank
  'reptile_facade', 'hutwall_reptiles_x', 'hutwall_reptiles_y', 'post_hutwall_reptiles', 'hutwall_terrarium_x', 'hutwall_terrarium_y',
  'post_hutwall_terrarium', 'hutwall_terrarium_raised_x', 'hutwall_terrarium_raised_y', 'post_hutwall_terrarium_raised', 'hutwall_terrarium_raised_back_x', 'hutwall_terrarium_raised_back_y', 'post_hutwall_terrarium_raised_back',
  'floor_reptiles', 'terrarium_floor', 'aquarium_facade', 'hutwall_aquarium_x', 'hutwall_aquarium_y', 'post_hutwall_aquarium', 'hutwall_tank_x', 'hutwall_tank_y', 'post_hutwall_tank',
  'floor_aquarium', 'tank_floor', 'seaweed', 'coral', 'tank_rock', 'shell', 'tank_chest',
  // Unterwasserwelt (Riff)
  'reef_sand0', 'reef_sand1', 'reef_sand2', 'reef_path', 'reef_branch', 'reef_fan', 'reef_brain', 'reef_tube', 'reef_kelp',
  'reef_starfish', 'reef_anemone', 'reef_rock', 'anchor_sack', 'reef_branch2', 'reef_fan2', 'reef_brain2', 'reef_tube2',
  'reef_gravel', 'reef_seagrass', 'reef_algae', 'reef_dark',
  'aq_path', 'aq_bench', 'aq_lamp', 'aq_statue',
  'wolf_forest_edge', // dunkler Wald hinter dem Wolfswald (Tierpark)
  // Savanne in den Wetterphasen (Platzhalter aus tools/season-placeholders.cjs): Boden bei Starkregen, trockener Boden,
  // Schlamm im ausgetrockneten Wasserloch, kahle Akazie
  'sgrass_rain0', 'sgrass_rain1', 'sgrass_rain2', 'sdry0', 'sdry1', 'sdry2', 'mud', 'acacia_bare',
  // Dschungel (Platzhalter aus tools/jungle-placeholders.cjs): Boden, Fluss, Steg, Dickicht, Felsklippe, Fischerhütte
  'jgrass0', 'jgrass1', 'jgrass2', 'jgrass_rain0', 'jgrass_rain1', 'jgrass_rain2', 'jungle_path', 'jungle_water0', 'jungle_water1', 'jungle_dock',
  'thicket', 'thicket_small', 'thicket_cut', 'cliff', 'jungle_flow0', 'jungle_flow1', 'jungle_flow2', 'jungle_flow3',
  'mangrove', 'heliconia', 'hibiscus', 'jungle_plant', 'spider_web',
  'hutwall_jungle_x', 'hutwall_jungle_y', 'post_hutwall_jungle', 'gate_door_jungle_x', 'gate_door_jungle_y', 'hutroof_jungle',
  'hut_desk_jungle', 'hut_chair_jungle', 'hut_plant_jungle', 'hut_shelf_jungle', 'hut_bed_savanna', 'hut_bed_jungle', 'hut_bed_savanna_sleep', 'hut_bed_jungle_sleep', 'planks_jungle',
  // Eiswelt (Platzhalter aus tools/ice-placeholders.cjs): Schnee, Polarmeer, zugefrorenes Meer, Eisfelsen, Forschungsstation
  'snow0', 'snow1', 'snow2', 'snow_path', 'ice_water0', 'ice_water1', 'sea_ice0', 'sea_ice1', 'sea_ice2', 'ice_rock', 'ice_block',
  'hutwall_ice_x', 'hutwall_ice_y', 'post_hutwall_ice', 'gate_door_ice_x', 'gate_door_ice_y', 'hutroof_ice', 'planks_ice',
  'hut_desk_ice', 'hut_chair_ice', 'hut_shelf_ice', 'hut_bed_ice', 'hut_bed_ice_sleep',
];

// Test: neu gemalte Grafiken statt der Pixel-Art aus tools/make-sprites.js (Schlüssel -> Dateiname; leeren = alte Grafik)
// pine_new: Pine2.png ohne den Schnee am Fuß
const TEST_ART = {};

// Gegenstände in doppelter Auflösung (werden halb so groß angezeigt)
const ITEMS = ['icecream', 'icecream2', 'icecream3', 'net', 'lasso', 'trap', 'hand', 'food', 'esign_pasture', 'esign_cats', 'esign_pond', 'esign_aviary', 'esign_savanna', 'esign_deerpark', 'esign_foxden', 'esign_forestaviary', 'esign_meerkat', 'esign_lion', 'esign_crocodile', 'koifood', 'esign_koi', 'esign_board', 'parkfood', 'jar', 'scissors', 'lantern', 'bone', 'jar_glow', 'machete', 'banana', 'canoe_icon', 'rod', 'drum', 'herring', 'ball'];

// Muss zu tools/prepare-characters.js passen
const HERO_FRAME = { frameWidth: 72, frameHeight: 116 };
const HERO_WALK_FRAME = { frameWidth: 88, frameHeight: 116 };
const SHEEP_FRAME = { frameWidth: 80, frameHeight: 88 };
const CAT_FRAME = { frameWidth: 72, frameHeight: 80 };
const KOI_FRAME = { frameWidth: 88, frameHeight: 52 };
const CAR_FRAME = { frameWidth: 240, frameHeight: 140 };
const CAT_SLEEP_FRAME = { frameWidth: 56, frameHeight: 60 };
const DEER_FRAME = { frameWidth: 72, frameHeight: 96 };
const STAG_FRAME = { frameWidth: 80, frameHeight: 112 };
const FROG_FRAME = { frameWidth: 56, frameHeight: 52 };
const MOLE_FRAME = { frameWidth: 56, frameHeight: 52 };
const MOLE_MOUND_FRAME = { frameWidth: 64, frameHeight: 52 };
const HERON_FRAME = { frameWidth: 88, frameHeight: 108 };
const HERON_FLY_FRAME = { frameWidth: 96, frameHeight: 92 };
const FISH_FRAME = { frameWidth: 84, frameHeight: 64 };
const FISHBAG_FRAME = { frameWidth: 64, frameHeight: 76 };
const SQUIRREL_FRAME = { frameWidth: 56, frameHeight: 60 };
const FOX_FRAME = { frameWidth: 72, frameHeight: 72 };
const FOX_SLEEP_FRAME = { frameWidth: 56, frameHeight: 44 };
const ANTELOPE_FRAME = { frameWidth: 72, frameHeight: 100 };
// Savannentiere: Laufen, Stehen, Trinken, Fressen, Fliegen (tools/prepare-characters.js), je Bogen [Breite, Höhe, Anzahl Bilder]
// (breite Bögen sind in zwei Reihen umgebrochen: ohne Anzahl kämen die leeren Felder am Ende als Bilder dazu);
// optional die Fußlinie, wenn darunter noch etwas hängt (Schwanz des Krokodils), sonst 4 Pixel über dem unteren Rand
const SAVANNA_ANIMS = {
  antelope_walk_back: [72, 100, 18],
  antelope_idle: [72, 100, 40],
  antelope_idle_back: [72, 100, 40],
  antelope2_walk: [72, 100, 32],
  antelope2_walk_back: [72, 100, 10],
  antelope2_idle: [72, 100, 20],
  antelope2_idle_back: [72, 100, 12],
  zebra_idle: [80, 104, 40],
  zebra_idle_back: [80, 104, 40],
  zebra2_walk: [80, 104, 10],
  zebra2_walk_back: [80, 104, 10],
  zebra2_idle: [80, 104, 40],
  zebra2_idle_back: [80, 104, 40],
  giraffe_walk: [106, 168, 11],
  giraffe_walk_back: [104, 168, 10],
  giraffe_idle: [114, 168, 20],
  giraffe_idle_back: [128, 168, 39],
  lion_walk: [74, 96, 10],
  lion_walk_back: [72, 96, 10],
  lion_idle: [78, 96, 21],
  lion_idle_back: [74, 96, 20],
  lion2_walk: [74, 96, 12],
  lion2_walk_back: [72, 96, 10],
  lion2_idle: [82, 96, 18],
  lion2_idle_back: [72, 96, 40],
  meerkat_walk: [40, 56, 10],
  meerkat_walk_back: [40, 56, 12],
  meerkat_idle: [40, 56, 20],
  meerkat_idle_back: [40, 56, 40],
  croc_walk: [72, 104, 10, 88],
  croc_walk_back: [112, 156, 40, 120],
  croc_idle: [72, 92, 40],
  croc_idle_back: [72, 92, 40],
  croc_albino_walk: [86, 104, 11, 88],
  croc_albino_walk_back: [76, 104, 12, 88],
  croc_albino_idle: [78, 92, 40],
  croc_albino_idle_back: [72, 92, 15],
  hippo_walk: [96, 88, 14],
  hippo_walk_back: [96, 88, 11],
  hippo_idle: [96, 88, 37],
  hippo_idle_back: [96, 88, 15],
  gnu_walk: [88, 96, 15],
  gnu_walk_back: [88, 96, 15],
  gnu_idle: [88, 96, 40],
  gnu_idle_back: [88, 96, 40],
  vulture_idle: [88, 108, 38],
  vulture_idle_back: [88, 108, 32],
  shoebill_idle: [88, 108, 40],
  shoebill_idle_back: [88, 108, 40],
  // Warzenschwein, Flamingo
  warthog_walk: [80, 88, 10],
  warthog_walk_back: [80, 88, 33],
  warthog_idle: [80, 88, 35],
  warthog_idle_back: [80, 88, 20],
  flamingo_idle: [88, 108, 36],
  flamingo_idle_back: [88, 108, 38],
  flamingo_flap: [104, 100, 16],
  flamingo_flap_back: [104, 100, 41],
  // trinken, fressen, fliegen
  zebra_drinking: [80, 104, 38],
  zebra_drinking_back: [80, 104, 39],
  zebra2_drinking: [80, 104, 38],
  zebra2_drinking_back: [80, 104, 39],
  giraffe_eating: [108, 180, 21],
  giraffe_eating_back: [106, 180, 10],
  vulture_flap: [126, 108, 40],
  vulture_flap_back: [96, 100, 37],
  shoebill_flap: [96, 92, 40],
  shoebill_flap_back: [96, 92, 40],
};

// Animationen aus Videos (tools/prepare-characters.js), je Bogen [Breite, Höhe, Anzahl Bilder]. Sie laufen mit 24 Bildern
// pro Sekunde wie im Video; Stehen (_idle) vor und zurück, weil die Videos nicht nahtlos im Kreis laufen. Ein Bild
// (Anzahl 1) ist ein Standbild, das wie eine Animation eingesetzt wird (Japanmakak sitzt)
// Stücke der Trommel-Animation des Gorillas: [erstes Bild, letztes Bild, Wiederholungen (-1: endlos)]. Das Aufrichten
// dauert 1 Sekunde, so lange wie die Pause vor seinem ersten Schlag (siehe DrumTool.js)
const GORILLA_DRUM = { gorilla_drum_in: [0, 23, 0], gorilla_drum_loop: [24, 92, -1], gorilla_drum_out: [93, 101, 0] };
const VIDEO_ANIMS = {
  // Mavi die Tierpflegerin: steht (blinzelt) bzw. winkt
  mavi_idle: [88, 116, 36],
  mavi_wave: [88, 116, 107],
  antelope_walk: [72, 100, 24],
  // Wolf und schwarzer Wolf (Wolfsnacht); Dschungel-Kleidung der Spielfigur
  wolf_walk: [80, 80, 26],
  wolf_walk_back: [80, 80, 61],
  wolf_idle: [80, 80, 107],
  wolf_idle_back: [80, 80, 107],
  wolf2_walk: [80, 80, 25],
  wolf2_walk_back: [80, 80, 27],
  wolf2_idle: [80, 80, 107],
  wolf2_idle_back: [80, 80, 107],
  hero_jungle_walk: [88, 116, 25],
  hero_jungle_walk_back: [88, 116, 24],
  hero_jungle_idle: [88, 116, 53],
  hero_jungle_idle_back: [88, 116, 84],
  hero_ice_walk: [88, 145, 24], // Eiswelt (Parka): höher wegen der Kapuze, Fußlinie im selben Verhältnis (140 / 145)
  hero_ice_walk_back: [88, 145, 22],
  hero_ice_idle: [104, 145, 80],
  hero_ice_idle_back: [104, 145, 84],
  penguin_walk: [72, 80, 24], // Pinguin (Eiswelt)
  penguin_walk_back: [72, 80, 12],
  penguin_idle: [72, 80, 24],
  penguin_idle_back: [72, 80, 26],
  seal_walk: [96, 80, 20], // Robbe robbt an Land (Eiswelt)
  seal_walk_back: [96, 72, 44],
  seal_swim_idle: [72, 88, 25], // ... und wippt aufgetaucht im Wasser, während sie Henrik anschaut
  // Bauernhof-Event: Kuh, Schwein, Ziege
  farm_cow_walk: [96, 88, 106],
  farm_cow_walk_back: [96, 88, 64],
  farm_cow_idle: [96, 88, 107],
  farm_cow_idle_back: [96, 88, 107],
  farm_pig_walk: [80, 88, 26],
  farm_pig_walk_back: [80, 88, 27],
  farm_goat_walk: [80, 88, 59],
  farm_goat_walk_back: [80, 88, 24],
  farm_goat_idle: [80, 88, 51],
  farm_goat_idle_back: [80, 88, 107],
  // Dschungel-Tiere
  macaw_idle: [64, 80, 107],
  macaw2_idle: [64, 80, 107],
  macaw_flap: [104, 96, 87],
  toucan_idle: [64, 80, 107],
  toucan_idle_back: [64, 80, 107],
  toucan_flap: [104, 96, 107],
  toucan_flap_back: [104, 96, 29],
  macaw_flap_back: [104, 96, 24],
  macaw2_flap: [104, 96, 39],
  macaw2_flap_back: [104, 96, 104],
  snake_walk: [96, 72, 107],
  snake_walk_back: [96, 72, 94],
  snake_idle: [72, 72, 51],
  snake2_walk: [96, 72, 107],
  snake2_walk_back: [96, 72, 107],
  snake2_idle: [72, 72, 107],
  tarantula_walk: [64, 64, 24],
  tarantula_walk_back: [64, 64, 24],
  tarantula2_walk: [64, 64, 24],
  tarantula2_walk_back: [64, 64, 86],
  howler_walk: [88, 88, 26],
  howler_walk_back: [88, 88, 34],
  howler_idle: [88, 88, 107],
  gibbon_walk: [88, 88, 25],
  gibbon_walk_back: [88, 88, 34],
  gibbon_idle: [88, 88, 68],
  gibbon_idle_back: [88, 88, 107],
  anteater_walk: [104, 72, 24],
  iguana_walk: [96, 56, 85],
  iguana_idle: [96, 56, 107],
  iguana2_walk: [96, 56, 29],
  iguana2_idle: [96, 56, 37],
  jaguar_walk: [104, 96, 107],
  jaguar_walk_back: [104, 96, 107],
  jaguar_idle: [104, 96, 85],
  gorilla_walk: [104, 96, 107],
  gorilla_walk_back: [104, 96, 42],
  gorilla_idle: [104, 96, 107],
  gorilla_idle_back: [104, 96, 107],
  gorilla_drum: [104, 96, 102], // trommelt auf die Brust: aufrichten, trommeln, zurück (siehe GORILLA_DRUM)
  panther_walk: [104, 96, 24],
  panther_walk_back: [104, 96, 107],
  panther_idle: [104, 96, 35],
  panther_idle_back: [104, 96, 24],
  jaguar_tail_idle: [48, 48, 85], // der Schwanz, der aus der Baumkrone hängt (tools/jaguar-tail.py)
  panther_tail_idle: [48, 48, 85],
  anteater_walk_back: [104, 72, 25],
  anteater_idle: [104, 72, 107],
  anteater_idle_back: [104, 72, 103],
  canoe_paddle_anim: [160, 152, 29],
  canoe_paddle_anim_back: [160, 152, 49],
  // Reittiere Maultier (Dschungel) und Seabob (Riff)
  ride_jungle_walk: [160, 230, 26],
  ride_jungle_walk_back: [160, 230, 40],
  ride_jungle_idle: [160, 230, 49],
  ride_jungle_idle_back: [160, 230, 51],
  ride_reef_walk: [160, 230, 32],
  ride_reef_walk_back: [160, 230, 31],
  ride_reef_idle: [160, 230, 90],
  ride_reef_idle_back: [160, 230, 50],
  // Riff-Tiere schwimmen (auch im Stillhalten)
  ray_swim: [112, 80, 50],
  ray_swim_back: [112, 80, 47],
  ray2_swim: [112, 80, 50],
  ray2_swim_back: [112, 80, 47],
  seahorse_swim: [48, 64, 103],
  seahorse_swim_back: [48, 64, 35],
  turtle_swim: [112, 88, 102],
  turtle_swim_back: [112, 88, 48],
  octopus_swim: [88, 72, 55],
  jellyfish_swim: [72, 96, 42],
  jellyfish_swim_back: [72, 96, 61],
  jellyfish2_swim: [72, 96, 45],
  jellyfish2_swim_back: [72, 96, 60],
  // Spielfigur taucht (Riff), für Schwimmen und Stillhalten
  hero_swim_anim: [88, 116, 50],
  hero_swim_anim_back: [88, 116, 65],
  // Spielfigur und Wasserbüffel im Bambuswald
  hero_asia_walk: [88, 116, 44],
  hero_asia_walk_back: [88, 116, 25],
  hero_asia_idle: [88, 116, 59],
  hero_asia_idle_back: [88, 116, 49],
  ride_asia_walk: [160, 230, 27],
  ride_asia_walk_back: [160, 230, 21],
  ride_asia_idle: [160, 230, 51],
  ride_asia_idle_back: [160, 230, 51],
  zebra_walk: [80, 104, 24],
  zebra_walk_back: [80, 104, 25],
  hyena_walk: [80, 80, 24],
  hyena_walk_back: [80, 80, 25],
  hyena_idle: [80, 80, 49],
  hyena_idle_back: [80, 80, 47],
  panda_walk: [88, 96, 26],
  panda_walk_back: [88, 96, 25],
  panda_idle: [88, 96, 94],
  redpanda_walk: [72, 72, 30],
  tiger_walk: [120, 104, 32],
  tiger_walk_back: [120, 104, 27],
  tiger_idle: [120, 104, 34],
  tiger_idle_back: [120, 104, 47],
  tiger2_walk: [120, 104, 30],
  tiger2_walk_back: [120, 104, 24],
  tiger2_idle: [120, 104, 48],
  tiger2_idle_back: [120, 104, 24],
  peacock_walk: [96, 96, 30],
  peacock_walk_back: [96, 96, 73],
  peacock2_walk: [96, 96, 32],
  macaque_walk: [72, 72, 30],
  macaque_sit: [72, 72, 1],
  macaque_sit_back: [72, 72, 1],
  macaque_walk_back: [72, 72, 24],
  orangutan_walk: [96, 96, 34],
  orangutan_jump: [112, 96, 40], // Bilder einzeln gezeigt, passend zum Sprung (siehe Orangutan.js)
  orangutan2_jump: [112, 96, 39],
  orangutan_walk_back: [96, 96, 44],
  orangutan_idle: [96, 96, 76],
  orangutan_wave: [112, 96, 81],
  orangutan2_walk: [96, 96, 26],
  orangutan2_walk_back: [96, 96, 46],
  orangutan2_idle: [96, 96, 93],
  orangutan2_wave: [112, 96, 48],
};

const ZEBRA_FRAME = { frameWidth: 80, frameHeight: 104 };
const MEERKAT_FRAME = { frameWidth: 40, frameHeight: 56 };
const MEERKAT_HOLE_FRAME = { frameWidth: 48, frameHeight: 32 };
const LION_FRAME = { frameWidth: 72, frameHeight: 96 };
const CROC_FRAME = { frameWidth: 72, frameHeight: 92 };
const CROC_WATER_FRAME = { frameWidth: 64, frameHeight: 44 };
const GIRAFFE_FRAME = { frameWidth: 104, frameHeight: 168 };
const GIRAFFE_EAT_FRAME = { frameWidth: 96, frameHeight: 180 };
const ANIMAL_SOUNDS = {
  sheep: 'animal_sheep.wav',
  cat: 'animal_cat.wav',
  squirrel: 'animal_squirrel.wav',
  frog: 'animal_frog.mp3',
  zebra: 'animal_zebra.wav',
  flamingo: 'animal_flamingo.wav',
  panda: 'animal_panda.wav',
  macaque: 'animal_macaque.wav',
  peacock: 'animal_peacock.wav', // schallt ab und zu durchs ganze Gebiet
  cow: 'animal_cow.wav', // Bauernhof-Event
  pig: 'animal_pig.wav',
  goat: 'animal_goat.wav',
  fish: 'animal_fish.wav',
  koi: 'animal_fish.wav', // derselbe Platscher wie beim Fisch
  wolf: 'animal_wolf.wav', // Knurren beim Fangen
  gnu: 'animal_gnu.wav', // Grunzen (beim Fangen und aus der Herde)
  hyena: 'animal_hyena.wav', // kurzes Kichern beim Fangen
  vulture: 'animal_vulture.wav', // Krächzen
  hippo: 'animal_hippo.wav', // Grunzen (auch ab und zu aus dem Wasserloch)
  howler: 'animal_howler.wav', // Brüllen (beim Springen von Baum zu Baum und beim Fangen)
  gibbon: 'animal_gibbon.wav', // Rufe (beim Springen von Baum zu Baum und beim Fangen)
  macaw: 'animal_macaw.wav', // Krächzen (beim Losfliegen und beim Fangen)
  toucan: 'animal_toucan.wav', // Tukan-Ruf (beim Losfliegen und beim Fangen)
  penguin: 'animal_penguin.wav', // Ruf (beim Fangen und ab und zu aus der Gruppe)
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
    this.prepared = new Set(); // Bilder, die setupAssets schon vorbereitet hat
  }

  // überarbeitete Bilder in hoher Auflösung (siehe world/hd.js); nicht bei einem Test-Bild und nicht ohne WebGL
  useHd(key) {
    return HD.includes(key) && !TEST_ART[key] && this.game.renderer.type === Phaser.WEBGL;
  }

  // Erst nur das Menü (Startbildschirm, ist HTML); die Bilder und Töne lädt das Spiel, sobald man dort etwas gewählt hat
  create() {
    hideLoading();
    const menu = () => openStartScreen((data) => {
      // Startgebiet: gespeichert, zum Ausprobieren über die Adresse (?level=forest) oder der Tierpark
      const startGroups = levelGroups(data.level ?? new URLSearchParams(location.search).get('level') ?? 'park');
      showLoading(tr('Das Spiel wird geladen …', 'Loading the game …'), 0);
      this.load.on('progress', setLoadingProgress);
      this.load.once('complete', () => {
        this.load.off('progress', setLoadingProgress);
        this.setupAssets();
        // das erste Gebiet aufzubauen dauert einen Moment: solange die Ladeanzeige
        showLoading(tr('Das Spiel startet …', 'Starting the game …'));
        afterPaint(() => {
          // die Boot-Szene läuft weiter (ohne Bild), damit sie den Rest im Hintergrund laden kann
          this.scene.launch('Garden', data);
          startGroups.forEach((g) => loaded.add(g));
          queue = GROUP_ORDER.filter((g) => !loaded.has(g));
          const timer = this.time.delayedCall(REST_DELAY, () => this.loadNext());
          startBackground = () => {
            timer.remove();
            this.loadNext();
          };
        });
      });
      this.queueAssets((key, sound) => isFirstAsset(key, sound) || startGroups.includes(groupOf(key, sound)));
      this.load.start();
    });
    if (tourSeen()) menu();
    else openFeatureTour(menu); // allererster Start: erst die kleine Vorschau
  }

  // nächstes Paket im Hintergrund laden, danach das übernächste usw.
  loadNext() {
    startBackground = null;
    if (current || !queue.length) return;
    current = queue.shift();
    currentProgress = 0;
    const onProgress = (p) => {
      currentProgress = p;
      notify();
    };
    this.load.on('progress', onProgress);
    this.load.once('complete', () => {
      this.load.off('progress', onProgress);
      this.setupAssets();
      loaded.add(current);
      current = null;
      notify();
      this.loadNext();
    });
    this.queueAssets((key, sound) => !isFirstAsset(key, sound) && groupOf(key, sound) === current);
    this.load.start();
  }

  // alle Bilder und Töne in die Warteschlange des Laders, für die want(key, sound) zutrifft
  queueAssets(want) {
    const load = {
      image: (key, url, ...args) => want(key) && this.load.image(key, webpUrl(url), ...args),
      spritesheet: (key, url, ...args) => want(key) && this.load.spritesheet(key, webpUrl(url), ...args),
      audio: (key, ...args) => want(key, true) && this.load.audio(key, ...args),
    };
    for (const key of [...PIXEL_ART, ...ITEMS]) load.image(key, `assets/${TEST_ART[key] ?? (this.useHd(key) ? `${HD_DIR}/${key}` : key)}.png`);
    load.spritesheet('hero', 'assets/hero.png', HERO_FRAME);
    // Kleidung je Gebiet (siehe hero in levels.js)
    load.spritesheet('hero_forest', 'assets/hero_forest.png', HERO_FRAME);
    load.spritesheet('hero_savanna', 'assets/hero_savanna.png', HERO_FRAME);
    load.spritesheet('hero_asia', 'assets/hero_asia.png', HERO_FRAME);
    load.spritesheet('hero_jungle', 'assets/hero_jungle.png', HERO_FRAME);
    load.spritesheet('hero_ice', 'assets/hero_ice.png', HERO_FRAME); // Eiswelt (Parka)
    load.spritesheet('hero_swim', 'assets/hero_swim.png', HERO_FRAME); // Taucheranzug (Riff)
    load.spritesheet('hero_walk', 'assets/hero_walk.png', HERO_WALK_FRAME); // Laufanimation (Test, nur Wiesen-Kleidung)
    load.spritesheet('hero_walk_back', 'assets/hero_walk_back.png', HERO_WALK_FRAME); // dasselbe von hinten
    load.spritesheet('hero_idle', 'assets/hero_idle.png', HERO_WALK_FRAME); // steht, atmet und blinzelt
    load.spritesheet('hero_forest_walk', 'assets/hero_forest_walk.png', HERO_WALK_FRAME); // Wald-Kleidung läuft (Test)
    load.spritesheet('hero_forest_walk_back', 'assets/hero_forest_walk_back.png', HERO_WALK_FRAME);
    load.spritesheet('hero_forest_idle', 'assets/hero_forest_idle.png', HERO_WALK_FRAME);
    load.spritesheet('hero_forest_idle_back', 'assets/hero_forest_idle_back.png', HERO_WALK_FRAME);
    for (const k of ['walk', 'walk_back', 'idle', 'idle_back']) load.spritesheet(`hero_savanna_${k}`, `assets/hero_savanna_${k}.png`, HERO_WALK_FRAME); // Safari-Kleidung
    load.spritesheet('sheep', 'assets/sheep.png', SHEEP_FRAME);
    load.spritesheet('sheep_eat', 'assets/sheep_eat.png', SHEEP_FRAME); // grasend, Kopf unten
    // Lauf- und Stehanimation (Test), von vorne und hinten
    for (const key of ['sheep_walk', 'sheep_walk_back', 'sheep_idle', 'sheep_idle_back']) load.spritesheet(key, `assets/${key}.png`, SHEEP_FRAME);
    // Bauernhof-Event: Schafe sehen aus wie Kuh, Schwein oder Ziege (Platzhalter, gleiches Format wie das Schaf)
    for (const k of ['cow', 'pig', 'goat']) {
      const frame = k === 'cow' ? { frameWidth: 96, frameHeight: 88 } : SHEEP_FRAME; // die Kuh ist breiter
      load.spritesheet(`farm_${k}`, `assets/farm_${k}.png`, frame);
      load.spritesheet(`farm_${k}_eat`, `assets/farm_${k}_eat.png`, frame);
    }
    load.spritesheet('cat', 'assets/cat.png', CAT_FRAME);
    // Lauf- und Stehanimation (Test), von vorne und hinten
    for (const key of ['cat_walk', 'cat_walk_back', 'cat_idle', 'cat_idle_back']) load.spritesheet(key, `assets/${key}.png`, CAT_FRAME);
    load.spritesheet('cat_eat', 'assets/cat_eat.png', CAT_FRAME); // frisst am Futter (Kopf unten)
    for (const k of ['koi1', 'koi2', 'koi3']) load.spritesheet(k, `assets/${k}.png`, KOI_FRAME); // drei Farbmuster
    load.spritesheet('icecream_seller', 'assets/icecream_seller.png', HERO_FRAME); // Eisverkäuferin (Eisstand-Event)
    load.spritesheet('mavi', 'assets/mavi.png', HERO_FRAME); // Mavi die Tierpflegerin (führt durch die Geschichte)
    for (let n = 1; n <= 8; n++) load.spritesheet(`visitor${n}`, `assets/visitor${n}.png`, HERO_FRAME); // Besucher im Tierpark
    for (const w of ['meadow', 'forest', 'savanna', 'asia', 'jungle', 'reef']) load.spritesheet(`ride_${w}`, `assets/ride_${w}.png`, { frameWidth: 160, frameHeight: 230 }); // Reittiere
    // Esel, Pferd und Elefant laufen und stehen (Test)
    for (const w of ['meadow', 'forest']) {
      for (const k of ['walk', 'walk_back', 'idle', 'idle_back']) load.spritesheet(`ride_${w}_${k}`, `assets/ride_${w}_${k}.png`, { frameWidth: 160, frameHeight: 230 });
    }
    // Elefant: die Steh-Bögen sind in zwei Reihen umgebrochen, darum mit Anzahl der Bilder (sonst leere Felder)
    for (const [k, count] of [['walk', 14], ['walk_back', 26], ['idle', 20], ['idle_back', 21]]) {
      load.spritesheet(`ride_savanna_${k}`, `assets/ride_savanna_${k}.png`, { frameWidth: 160, frameHeight: 230, endFrame: count - 1 });
    }
    load.spritesheet('car_zoo', 'assets/car_zoo.png', CAR_FRAME); // Zooauto (Schnellreise, in allen Gebieten)
    const bz = this.useHd('boat_zoo') ? hdFactor('boat_zoo') : 1; // Zoo-U-Boot (Schnellreise in der Unterwasserwelt), groß wie der Wasserfall
    load.spritesheet('boat_zoo', `assets/${bz > 1 ? `${HD_DIR}/` : ''}boat_zoo.png`, { frameWidth: 240 * bz, frameHeight: 160 * bz });
    load.spritesheet('seaplane', 'assets/seaplane.png', CAR_FRAME); // Schnellreise im Dschungel (Wasserflugzeug)
    // Kanu (Dschungel): leer und mit Henrik darin, je 4 Ansichten
    for (const k of ['canoe', 'canoe_hero']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 144, frameHeight: 152 });
    const wf = this.useHd('waterfall') ? hdFactor('waterfall') : 1; // große Fassung: Bilder 4-mal (Handy 2-mal) so groß, danach verkleinert (shrinkTexture)
    load.spritesheet('waterfall', `assets/${wf > 1 ? `${HD_DIR}/` : ''}waterfall.png`, { frameWidth: 128 * wf, frameHeight: 160 * wf }); // Wasserfall im Dschungel (3 Bilder)
    load.spritesheet('cat_sleep', 'assets/cat_sleep.png', CAT_SLEEP_FRAME); // eingerollt auf dem Kratzbaum
    // Katze 2 (seltener Skin)
    load.spritesheet('cat2', 'assets/cat2.png', CAT_FRAME);
    for (const key of ['cat2_walk', 'cat2_walk_back', 'cat2_idle', 'cat2_idle_back']) load.spritesheet(key, `assets/${key}.png`, CAT_FRAME); // läuft und steht (Test)
    load.spritesheet('cat2_eat', 'assets/cat2_eat.png', CAT_FRAME);
    load.spritesheet('cat2_sleep', 'assets/cat2_sleep.png', { frameWidth: 88, frameHeight: 60 }); // Perserkatze liegt breiter
    load.spritesheet('deer', 'assets/deer.png', DEER_FRAME);
    load.spritesheet('deer_eat', 'assets/deer_eat.png', DEER_FRAME);
    load.spritesheet('deer_walk', 'assets/deer_walk.png', DEER_FRAME); // Laufanimation von vorne (Test)
    load.spritesheet('deer_walk_back', 'assets/deer_walk_back.png', DEER_FRAME); // dasselbe von hinten
    load.spritesheet('deer_idle', 'assets/deer_idle.png', DEER_FRAME); // steht (Test)
    load.spritesheet('deer_idle_back', 'assets/deer_idle_back.png', DEER_FRAME);
    load.spritesheet('stag', 'assets/stag.png', STAG_FRAME);
    load.spritesheet('stag_idle', 'assets/stag_idle.png', STAG_FRAME); // Hirsch steht (Test)
    load.spritesheet('stag_idle_back', 'assets/stag_idle_back.png', STAG_FRAME);
    load.spritesheet('stag_walk', 'assets/stag_walk.png', STAG_FRAME); // Hirsch läuft
    load.spritesheet('stag_walk_back', 'assets/stag_walk_back.png', STAG_FRAME);
    load.spritesheet('stag_eat', 'assets/stag_eat.png', STAG_FRAME);
    load.spritesheet('frog', 'assets/frog.png', FROG_FRAME);
    load.spritesheet('frog_hop', 'assets/frog_hop.png', { frameWidth: 56, frameHeight: 78 }); // Sprung (Test, siehe Frog.js)
    load.spritesheet('frog_hop_back', 'assets/frog_hop_back.png', { frameWidth: 56, frameHeight: 78 }); // dasselbe von hinten
    load.spritesheet('frog_idle', 'assets/frog_idle.png', { frameWidth: 56, frameHeight: 78 }); // sitzt (Test)
    load.spritesheet('frog2_hop', 'assets/frog2_hop.png', { frameWidth: 56, frameHeight: 78 }); // blauer Frosch hüpft (Test)
    load.spritesheet('frog2_hop_back', 'assets/frog2_hop_back.png', { frameWidth: 56, frameHeight: 78 });
    load.spritesheet('frog_idle_back', 'assets/frog_idle_back.png', { frameWidth: 56, frameHeight: 78 });
    load.spritesheet('frog2', 'assets/frog2.png', FROG_FRAME); // seltener blauer Frosch
    load.spritesheet('mole', 'assets/mole.png', MOLE_FRAME);
    load.spritesheet('mole_mound', 'assets/mole_mound.png', MOLE_MOUND_FRAME);
    load.spritesheet('heron', 'assets/heron.png', HERON_FRAME);
    load.spritesheet('heron_fly', 'assets/heron_fly.png', HERON_FLY_FRAME);
    load.spritesheet('heron_flap', 'assets/heron_flap.png', { frameWidth: 96, frameHeight: 96 }); // Flügelschlag (Test)
    load.spritesheet('heron_idle', 'assets/heron_idle.png', HERON_FRAME); // steht (Test)
    load.spritesheet('heron_idle_back', 'assets/heron_idle_back.png', HERON_FRAME);
    load.spritesheet('heron_flap_back', 'assets/heron_flap_back.png', { frameWidth: 96, frameHeight: 96 });
    load.spritesheet('macaque', 'assets/macaque.png', { frameWidth: 72, frameHeight: 72 }); // Japanmakak (Asien)
    // Brüllaffe (Dschungel): laufend, springend (von Krone zu Krone) und mit der Banane
    // Ameisenbär (Dschungel): Standbilder und aufgerichtet am Baum beim Ameisen-Schlecken
    load.spritesheet('anteater', 'assets/anteater.png', { frameWidth: 104, frameHeight: 72 });
    load.spritesheet('penguin', 'assets/penguin.png', { frameWidth: 72, frameHeight: 80 }); // Pinguin (Eiswelt)
    load.spritesheet('seal', 'assets/seal.png', { frameWidth: 72, frameHeight: 88 }); // Robbe (Eiswelt) im Wasser, mit Wasserring
    load.spritesheet('seal_lie', 'assets/seal_lie.png', { frameWidth: 96, frameHeight: 72 }); // ... an Land (liegt)
    load.spritesheet('anteater_eat', 'assets/anteater_eat.png', { frameWidth: 88, frameHeight: 80 });
    for (const k of ['iguana', 'iguana2']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 96, frameHeight: 56 }); // Leguan und der seltene blaue
    load.audio('gorilla_beat', 'assets/sounds/gorilla_beat.wav'); // Schlag auf die Brust
    load.spritesheet('gorilla', 'assets/gorilla.png', { frameWidth: 104, frameHeight: 96 }); // Gorilla (Nebel, Lichtung)
    for (const k of ['jaguar', 'panther']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 104, frameHeight: 96 }); // Jaguar und Panther (seltene Variante)
    for (const k of ['howler', 'howler_jump', 'howler_eat', 'gibbon', 'gibbon_jump', 'gibbon_eat']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 88, frameHeight: 88 }); // ... und der Gibbon (bei Nebel)
    // Schlange und Vogelspinne (Dschungel, Reptilienhaus), dazu ihre seltenen Farben
    // Ara (Dschungel) und der seltene blau-gelbe Ara: sitzend und fliegend
    for (const k of ['macaw', 'macaw2', 'toucan']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 64, frameHeight: 80 });
    for (const k of ['macaw_fly', 'macaw2_fly', 'toucan_fly']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 88, frameHeight: 80 });
    for (const k of ['snake', 'snake2']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 72, frameHeight: 72 });
    for (const k of ['tarantula', 'tarantula2']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 64, frameHeight: 64 });
    load.spritesheet('macaque_bath', 'assets/macaque_bath.png', { frameWidth: 72, frameHeight: 72 }); // badet in der heißen Quelle
    load.spritesheet('panda', 'assets/panda.png', { frameWidth: 88, frameHeight: 96 }); // Panda (Asien)
    for (const k of ['redpanda', 'redpanda_sit']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 72, frameHeight: 72 }); // roter Panda (Glühwürmchen-Abend), laufend und sitzend
    load.image('redpanda_tree', 'assets/redpanda_tree.png'); // ... oben im Kirschbaum
    load.spritesheet('panda_eat', 'assets/panda_eat.png', { frameWidth: 88, frameHeight: 96 }); // sitzt und frisst Bambus
    load.spritesheet('minifish', 'assets/minifish.png', { frameWidth: 20, frameHeight: 16 }); // Zierfische im Aquarium
    load.spritesheet('minifish_swim', 'assets/minifish_swim.png', { frameWidth: 20, frameHeight: 16 }); // ... mit wackelnder Schwanzflosse (tools/fish-wag.cjs)
    load.spritesheet('butterfly', 'assets/butterfly.png', { frameWidth: 64, frameHeight: 64 }); // Schmetterlinge (12 Farben, Platzhalter aus tools/butterfly-sprites.cjs)
    load.spritesheet('reeffish', 'assets/reeffish.png', { frameWidth: 96, frameHeight: 64 }); // Riff-Fische (22 Arten, siehe tools/reef-fish.cjs)
    // Piranha (Dschungel, Regenzeit): schwimmt wie die Riff-Fische; gefangen in der Transportbox
    load.spritesheet('piranha', 'assets/piranha.png', { frameWidth: 96, frameHeight: 64 });
    load.spritesheet('piranha_swim', 'assets/piranha_swim.png', { frameWidth: 96, frameHeight: 64 });
    load.spritesheet('piranha_box', 'assets/piranha_box.png', { frameWidth: 64, frameHeight: 76 });
    load.spritesheet('reeffish_swim', 'assets/reeffish_swim.png', { frameWidth: 96, frameHeight: 64 }); // ... mit wackelnder Schwanzflosse (tools/fish-wag.cjs)
    load.spritesheet('seahorse', 'assets/seahorse.png', { frameWidth: 48, frameHeight: 64 }); // Seepferdchen (Riff)
    load.spritesheet('octopus', 'assets/octopus.png', { frameWidth: 72, frameHeight: 72 }); // Krake (Riff)
    for (const k of ['jellyfish', 'jellyfish2']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 64, frameHeight: 96 }); // Qualle und Goldqualle (Quallen-Schwarm)
    load.spritesheet('gnu', 'assets/gnu.png', { frameWidth: 88, frameHeight: 96 }); // Gnu (Große Wanderung)
    for (const k of ['wolf', 'wolf_howl', 'wolf_eat', 'wolf2', 'wolf2_howl', 'wolf2_eat']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 80, frameHeight: 80 }); // Wolf und schwarzer Wolf (Wolfsnacht)
    for (const k of ['ray', 'ray2']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 112, frameHeight: 80 }); // Rochen und Mantarochen (Riff)
    load.spritesheet('turtle', 'assets/turtle.png', { frameWidth: 112, frameHeight: 88 }); // Meeresschildkröte (Riff); im Netz: turtle_net (kommt noch)
    // Pfau (Asien) und der weiße Pfau (seltene Variante); _wheel: schlägt ein Rad
    for (const k of ['peacock', 'peacock_wheel', 'peacock2', 'peacock2_wheel']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 96, frameHeight: 96 });
    // Orang-Utan (Asien) und das Flanschen-Männchen (seltene Variante); _eat: sitzt und frisst; _tree: oben in der Baumkrone
    load.spritesheet('orangutan_eat', 'assets/orangutan_eat.png', { frameWidth: 88, frameHeight: 88 });
    load.spritesheet('orangutan2_eat', 'assets/orangutan2_eat.png', { frameWidth: 88, frameHeight: 88 });
    for (const k of ['orangutan', 'orangutan2']) {
      load.spritesheet(k, `assets/${k}.png`, { frameWidth: 88, frameHeight: 88 });
      load.image(`${k}_tree`, `assets/${k}_tree.png`);
    }
    // Tiger (Asien) und der weiße Tiger (seltene Variante); _peek: neugieriges Gesicht im Bambus
    for (const k of ['tiger_eat', 'tiger2_eat']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 120, frameHeight: 104 });
    for (const k of ['tiger', 'tiger2']) {
      load.spritesheet(k, `assets/${k}.png`, { frameWidth: 120, frameHeight: 104 });
      load.image(`${k}_peek`, `assets/${k}_peek.png`);
    }
    load.spritesheet('flamingo', 'assets/flamingo.png', HERON_FRAME); // Flamingo-Flug (Event)
    load.spritesheet('flamingo_fly', 'assets/flamingo_fly.png', { frameWidth: 104, frameHeight: 100 });
    load.spritesheet('flamingo_baby', 'assets/flamingo_baby.png', HERON_FRAME); // Küken (Tierbabys)
    load.spritesheet('fish', 'assets/fish.png', FISH_FRAME);
    load.spritesheet('fish2', 'assets/fish2.png', FISH_FRAME); // Wels (seltener Skin)
    load.spritesheet('fishbag', 'assets/fishbag.png', FISHBAG_FRAME);
    load.spritesheet('squirrel', 'assets/squirrel.png', SQUIRREL_FRAME);
    load.spritesheet('squirrel_run', 'assets/squirrel_run.png', { frameWidth: 64, frameHeight: 60 }); // rennt (Test)
    load.spritesheet('squirrel_idle', 'assets/squirrel_idle.png', { frameWidth: 64, frameHeight: 60 }); // sitzt (Test)
    load.spritesheet('fox', 'assets/fox.png', FOX_FRAME);
    load.spritesheet('fox_eat', 'assets/fox_eat.png', FOX_FRAME);
    load.spritesheet('fox_walk', 'assets/fox_walk.png', FOX_FRAME); // Laufanimation von vorne (Test)
    load.spritesheet('fox_walk_back', 'assets/fox_walk_back.png', FOX_FRAME); // dasselbe von hinten
    load.spritesheet('fox_idle', 'assets/fox_idle.png', FOX_FRAME); // steht (Test)
    load.spritesheet('fox_idle_back', 'assets/fox_idle_back.png', FOX_FRAME); // dasselbe von hinten
    load.spritesheet('fox_sleep', 'assets/fox_sleep.png', FOX_SLEEP_FRAME); // eingerollt vor der Höhle
    load.spritesheet('antelope', 'assets/antelope.png', ANTELOPE_FRAME);
    load.spritesheet('antelope_eat', 'assets/antelope_eat.png', ANTELOPE_FRAME);
    load.spritesheet('antelope2', 'assets/antelope2.png', ANTELOPE_FRAME); // Oryx (seltener Skin)
    load.spritesheet('antelope2_eat', 'assets/antelope2_eat.png', ANTELOPE_FRAME);
    load.spritesheet('zebra', 'assets/zebra.png', ZEBRA_FRAME);
    load.spritesheet('zebra_drink', 'assets/zebra_drink.png', ZEBRA_FRAME); // trinkt mit gesenktem Kopf
    // Schoko-Zebra (seltener Skin, umgefärbt mit tools/recolor.js)
    load.spritesheet('zebra2', 'assets/zebra2.png', ZEBRA_FRAME);
    load.spritesheet('zebra2_drink', 'assets/zebra2_drink.png', ZEBRA_FRAME);
    for (const [key, [frameWidth, frameHeight, count]] of Object.entries(SAVANNA_ANIMS)) load.spritesheet(key, `assets/${key}.png`, { frameWidth, frameHeight, endFrame: count - 1 });
    for (const [key, [frameWidth, frameHeight, count]] of Object.entries(VIDEO_ANIMS)) load.spritesheet(key, `assets/${key}.png`, { frameWidth, frameHeight, endFrame: count - 1 });
    load.spritesheet('meerkat', 'assets/meerkat.png', MEERKAT_FRAME);
    load.spritesheet('meerkat_hole', 'assets/meerkat_hole.png', MEERKAT_HOLE_FRAME); // im Erdloch
    load.audio('meerkat_alarm', 'assets/sounds/meerkat_alarm.wav'); // Warnpfiff des Wächters
    load.spritesheet('lion', 'assets/lion.png', LION_FRAME);
    load.spritesheet('lion_eat', 'assets/lion_eat.png', LION_FRAME);
    load.image('lion_sleep', 'assets/lion_sleep.png'); // liegend, schläft (Kopf nach rechts)
    load.image('lion_alert', 'assets/lion_alert.png'); // liegend, schaut auf
    // Schwarzmähnen-Löwe (seltener Skin): dieselben vier Bilder
    load.spritesheet('lion2', 'assets/lion2.png', LION_FRAME);
    load.spritesheet('lion2_eat', 'assets/lion2_eat.png', LION_FRAME);
    load.image('lion2_sleep', 'assets/lion2_sleep.png');
    load.image('lion2_alert', 'assets/lion2_alert.png');
    load.audio('lion_roar', 'assets/sounds/lion_roar.wav');
    load.audio('wolf_howl', 'assets/sounds/wolf_howl.wav'); // Wolfsgeheul (siehe tools/prepare-sounds.js)
    load.spritesheet('croc', 'assets/croc.png', CROC_FRAME);
    load.spritesheet('croc_water', 'assets/croc_water.png', CROC_WATER_FRAME); // nur der Kopf schaut aus dem Wasser
    // Savanne in den Wetterphasen: Skins (Schuhschnabel, Albino-Krokodil, Lungenfisch) und neue Tiere
    load.spritesheet('shoebill', 'assets/shoebill.png', HERON_FRAME);
    load.spritesheet('shoebill_fly', 'assets/shoebill_fly.png', HERON_FLY_FRAME);
    load.spritesheet('croc_albino', 'assets/croc_albino.png', CROC_FRAME);
    load.spritesheet('croc_albino_water', 'assets/croc_albino_water.png', CROC_WATER_FRAME); // Platzhalter (umgefärbt)
    load.spritesheet('lungfish', 'assets/lungfish.png', FISH_FRAME);
    load.spritesheet('lungfish_mud', 'assets/lungfish_mud.png', FISH_FRAME); // steckt im Schlamm (Trockenzeit, Platzhalter)
    load.spritesheet('hippo', 'assets/hippo.png', { frameWidth: 96, frameHeight: 88 }); // Nilpferd (Starkregen)
    load.spritesheet('hippo_water', 'assets/hippo_water.png', { frameWidth: 64, frameHeight: 44 }); // ... schwimmend: obere Kopfhälfte
    for (const k of ['hyena', 'hyena_eat']) load.spritesheet(k, `assets/${k}.png`, { frameWidth: 80, frameHeight: 80 }); // Hyäne (Trockenzeit)
    load.spritesheet('warthog', 'assets/warthog.png', { frameWidth: 80, frameHeight: 88 }); // Warzenschwein (Trockenzeit)
    load.image('warthog_hole', 'assets/warthog_hole.png'); // sein Erdloch (Platzhalter)
    load.spritesheet('vulture', 'assets/vulture.png', HERON_FRAME); // Geier (Trockenzeit)
    load.spritesheet('vulture_fly', 'assets/vulture_fly.png', HERON_FLY_FRAME);
    load.image('bone_pile', `assets/${this.useHd('bone_pile') ? `${HD_DIR}/` : ''}bone_pile.png`); // gestreute Knochen (lockt die Hyänen an)
    load.audio('hyena_laugh', 'assets/sounds/hyena_laugh.wav');
    load.audio('tree_rustle', 'assets/sounds/tree_rustle.wav'); // Rascheln in der Baumkrone (Brüllaffen, Dschungel)
    load.spritesheet('giraffe', 'assets/giraffe.png', GIRAFFE_FRAME);
    load.spritesheet('giraffe_eat', 'assets/giraffe_eat.png', GIRAFFE_EAT_FRAME); // frisst mit gestrecktem Hals an einer Akazie
    load.audio('step', 'assets/sounds/step.wav'); // Schritt-Geräusch (siehe tools/prepare-sounds.js)
    load.audio('step_indoor', 'assets/sounds/step_indoor.wav'); // ... drinnen (Haupthaus, Hütten, Aquarium)
    load.audio('step_snow', 'assets/sounds/step_snow.wav'); // ... im Schnee (Eiswelt, stepSound in levels.js)
    load.audio('whoosh', 'assets/sounds/whoosh.wav'); // beim Einsetzen eines Werkzeugs
    load.audio('trap', 'assets/sounds/trap.wav'); // Falle schnappt zu
    load.audio('car', 'assets/sounds/car.wav'); // Auto fährt los (Schnellreise)
    // Tierrufe beim Fangen; Tierarten ohne Eintrag bleiben still
    for (const [species, file] of Object.entries(ANIMAL_SOUNDS)) load.audio(`animal_${species}`, `assets/sounds/${file}`);
  }

  // nach dem Laden: Bilder vorbereiten, Animationen anlegen. Läuft nach jedem Ladeschritt (siehe loadRest): nur für die
  // Bilder, die schon da sind, und jedes nur einmal
  setupAssets() {
    const fresh = (key) => this.textures.exists(key) && !this.prepared.has(key);
    // Pixel-Art scharf vergrößern; Figuren und gedrehte Gegenstände bleiben weich
    for (const key of PIXEL_ART) if (!this.useHd(key) && fresh(key)) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const key of HD) if (this.useHd(key) && fresh(key)) shrinkTexture(this.textures.get(key), hdFactor(key)); // große Bilder in alter Größe anzeigen
    for (const key of this.textures.getTextureKeys()) this.prepared.add(key);
    // Animationen nur für geladene Bilder und nur einmal
    const anims = {
      generateFrameNumbers: (key, config) => (this.textures.exists(key) ? this.anims.generateFrameNumbers(key, config) : null),
      create: (config) => config.frames && !this.anims.exists(config.key) && this.anims.create(config),
    };
    // Bilder pro Sekunde so, dass ein Doppelschritt etwa 0,7 Sekunden dauert (vorne 10 Bilder, hinten 13)
    anims.create({ key: 'hero_walk', frames: anims.generateFrameNumbers('hero_walk'), frameRate: 14, repeat: -1 });
    anims.create({ key: 'hero_walk_back', frames: anims.generateFrameNumbers('hero_walk_back'), frameRate: 14, repeat: -1 });
    anims.create({ key: 'hero_idle', frames: anims.generateFrameNumbers('hero_idle'), frameRate: 12, repeat: -1 });
    anims.create({ key: 'mavi_idle', frames: anims.generateFrameNumbers('mavi_idle'), frameRate: 16, repeat: -1, yoyo: true }); // vor und zurück (nur Bilder mit offenen Augen)
    anims.create({ key: 'mavi_wave', frames: anims.generateFrameNumbers('mavi_wave'), frameRate: 24 }); // einmal winken
    anims.create({ key: 'hero_forest_walk', frames: anims.generateFrameNumbers('hero_forest_walk'), frameRate: 14, repeat: -1 });
    // von hinten mehr Bilder pro Doppelschritt (etwa 16), daher schneller abspielen
    anims.create({ key: 'hero_forest_walk_back', frames: anims.generateFrameNumbers('hero_forest_walk_back'), frameRate: 20, repeat: -1 });
    anims.create({ key: 'hero_forest_idle', frames: anims.generateFrameNumbers('hero_forest_idle'), frameRate: 10, repeat: -1 });
    anims.create({ key: 'hero_forest_idle_back', frames: anims.generateFrameNumbers('hero_forest_idle_back'), frameRate: 12, repeat: -1 });
    // Safari-Kleidung: etwas langsamere Schritte als die Wald-Kleidung (ihre Vorlagen haben mehr Bilder pro Schritt)
    for (const [key, frameRate] of [['hero_savanna_walk', 11], ['hero_savanna_walk_back', 12], ['hero_savanna_idle', 10], ['hero_savanna_idle_back', 12]]) {
      anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate, repeat: -1 });
    }
    for (const key of ['deer_walk', 'deer_walk_back', 'stag_walk', 'stag_walk_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    anims.create({ key: 'squirrel_run', frames: anims.generateFrameNumbers('squirrel_run'), frameRate: 16, repeat: -1 });
    anims.create({ key: 'fox_walk', frames: anims.generateFrameNumbers('fox_walk'), frameRate: 12, repeat: -1 });
    anims.create({ key: 'fox_walk_back', frames: anims.generateFrameNumbers('fox_walk_back'), frameRate: 16, repeat: -1 }); // mehr Bilder pro Schritt
    for (const key of ['fox_idle', 'fox_idle_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    // Frosch im Gehege und beim Folgen: Sprung an Sprung (ducken, Flug, landen); in der Wildnis steuert Frog.js die Bilder
    anims.create({ key: 'frog_hop', frames: anims.generateFrameNumbers('frog_hop', { start: 3, end: 18 }), frameRate: 22, repeat: -1 });
    anims.create({ key: 'frog2_hop', frames: anims.generateFrameNumbers('frog2_hop', { start: 5, end: 17 }), frameRate: 18, repeat: -1 });
    anims.create({ key: 'frog2_hop_back', frames: anims.generateFrameNumbers('frog2_hop_back', { start: 10, end: 28 }), frameRate: 26, repeat: -1 });
    for (const key of ['frog_idle', 'frog_idle_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    anims.create({ key: 'frog_hop_back', frames: anims.generateFrameNumbers('frog_hop_back', { start: 3, end: 17 }), frameRate: 21, repeat: -1 });
    anims.create({ key: 'squirrel_idle', frames: anims.generateFrameNumbers('squirrel_idle'), frameRate: 10, repeat: -1 });
    for (const key of ['ride_meadow_walk', 'ride_meadow_walk_back', 'ride_forest_walk']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    // Pferd von hinten: mehrere Schritte in 31 Bildern, etwas schneller, damit es nicht langsamer trabt als von vorne
    anims.create({ key: 'ride_forest_walk_back', frames: anims.generateFrameNumbers('ride_forest_walk_back'), frameRate: 14, repeat: -1 });
    for (const key of ['ride_savanna_walk', 'ride_savanna_walk_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 16, repeat: -1 });
    for (const key of ['ride_meadow_idle', 'ride_meadow_idle_back', 'ride_forest_idle', 'ride_forest_idle_back', 'ride_savanna_idle', 'ride_savanna_idle_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['cat2_walk', 'cat2_walk_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    for (const key of ['cat_walk', 'cat_walk_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    for (const key of ['cat_idle', 'cat_idle_back', 'cat2_idle', 'cat2_idle_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['sheep_walk', 'sheep_walk_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    for (const key of ['sheep_idle', 'sheep_idle_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['heron_idle', 'heron_idle_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['heron_flap', 'heron_flap_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    for (const key of ['stag_idle', 'stag_idle_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['deer_idle', 'deer_idle_back']) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    // Savannentiere: Laufen und Fliegen 12 Bilder pro Sekunde (das Lauftempo passt Animal.render an), sonst 10
    // Giraffe: lange Beine, gemächliches Tempo – langsamere Schritte, sonst trippelt sie. Geier: ein Flügelschlag hat nur
    // 5 Bilder, schnell abgespielt flackert er
    // Gnu: rennt mit der Herde fast doppelt so schnell wie sein Gehtempo (die Animation wird dafür schneller), daher langsamer angesetzt
    const SAVANNA_RATE = { giraffe_walk: 7, giraffe_walk_back: 7, vulture_flap: 7, vulture_flap_back: 7, gnu_walk: 7, gnu_walk_back: 7 };
    for (const [key, [, , , feetY]] of Object.entries(SAVANNA_ANIMS)) if (feetY && this.textures.exists(key)) this.textures.get(key).customData.feetY = feetY;
    for (const key of Object.keys(SAVANNA_ANIMS)) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: SAVANNA_RATE[key] ?? (key.includes('_walk') || key.includes('_flap') ? 12 : 10), repeat: -1 });
    // schneller als im Video: der Wasserbüffel läuft sonst zu gemächlich für das Reittier-Tempo
    // Eiswelt: Henrik macht schnellere Schritte, sonst gleitet er vor dem hellen Schnee sichtbar über den Boden
    const VIDEO_RATE = { ride_asia_walk: 31, ride_asia_walk_back: 31, hero_ice_walk: 30, hero_ice_walk_back: 30 };
    for (const key of Object.keys(VIDEO_ANIMS)) anims.create({ key, frames: anims.generateFrameNumbers(key), frameRate: VIDEO_RATE[key] ?? 24, repeat: -1, yoyo: key.includes('_idle') });
    // Gorilla beim Trommel-Duell: dasselbe Video in drei Stücken (aufrichten, durchgehend trommeln, zurück)
    for (const [key, [start, end, repeat]] of Object.entries(GORILLA_DRUM)) {
      anims.create({ key, frames: anims.generateFrameNumbers('gorilla_drum', { start, end }), frameRate: 24, repeat });
    }
  }
}
