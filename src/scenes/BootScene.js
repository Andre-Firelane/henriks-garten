import Phaser from 'phaser';
import { openStartScreen } from '../ui/startScreen.js';
import { afterPaint, hideLoading, setLoadingProgress, showLoading } from '../ui/loading.js';
import { tr } from '../i18n.js';
import { HD, HD_DIR, hdFactor, shrinkTexture } from '../world/hd.js';

// Pixel-Art-Grafiken aus tools/make-sprites.js
const PIXEL_ART = [
  'grass0', 'grass1', 'grass2', 'path', 'soil', 'water',
  'tree', 'bush', 'rock', 'flowers_red', 'flowers_yellow', 'fence_x', 'fence_y', 'gate_x', 'sign_fish', 'fishpond0', 'fishpond1',
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
  'post_hutwall_terrarium', 'floor_reptiles', 'terrarium_floor', 'aquarium_facade', 'hutwall_aquarium_x', 'hutwall_aquarium_y', 'post_hutwall_aquarium', 'hutwall_tank_x', 'hutwall_tank_y', 'post_hutwall_tank',
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
  'hut_desk_jungle', 'hut_chair_jungle', 'hut_plant_jungle', 'hut_shelf_jungle', 'planks_jungle',
];

// Test: neu gemalte Grafiken statt der Pixel-Art aus tools/make-sprites.js (Schlüssel -> Dateiname; leeren = alte Grafik)
// pine_new: Pine2.png ohne den Schnee am Fuß
const TEST_ART = {};

// Gegenstände in doppelter Auflösung (werden halb so groß angezeigt)
const ITEMS = ['icecream', 'icecream2', 'icecream3', 'net', 'lasso', 'trap', 'hand', 'food', 'esign_pasture', 'esign_cats', 'esign_pond', 'esign_aviary', 'esign_savanna', 'esign_deerpark', 'esign_foxden', 'esign_forestaviary', 'esign_meerkat', 'esign_lion', 'esign_crocodile', 'koifood', 'esign_koi', 'esign_board', 'parkfood', 'jar', 'scissors', 'lantern', 'bone', 'jar_glow', 'machete', 'banana', 'canoe_icon'];

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
  antelope_walk: [72, 100, 10],
  antelope_walk_back: [72, 100, 18],
  antelope_idle: [72, 100, 40],
  antelope_idle_back: [72, 100, 40],
  antelope2_walk: [72, 100, 32],
  antelope2_walk_back: [72, 100, 10],
  antelope2_idle: [72, 100, 20],
  antelope2_idle_back: [72, 100, 12],
  zebra_walk: [80, 104, 10],
  zebra_walk_back: [80, 104, 10],
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
  hyena_walk: [80, 80, 12],
  hyena_walk_back: [80, 80, 10],
  hyena_idle: [80, 80, 26],
  hyena_idle_back: [80, 80, 20],
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
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  // überarbeitete Bilder in hoher Auflösung (siehe world/hd.js); nicht bei einem Test-Bild und nicht ohne WebGL
  useHd(key) {
    return HD.includes(key) && !TEST_ART[key] && this.game.renderer.type === Phaser.WEBGL;
  }

  // Erst nur das Menü (Startbildschirm, ist HTML); die Bilder und Töne lädt das Spiel, sobald man dort etwas gewählt hat
  create() {
    hideLoading();
    openStartScreen((data) => {
      showLoading(tr('Das Spiel wird geladen …', 'Loading the game …'), 0);
      this.load.on('progress', setLoadingProgress);
      this.load.once('complete', () => {
        this.setupAssets();
        // das erste Gebiet aufzubauen dauert einen Moment: solange die Ladeanzeige
        showLoading(tr('Das Spiel startet …', 'Starting the game …'));
        afterPaint(() => this.scene.start('Garden', data));
      });
      this.queueAssets();
      this.load.start();
    });
  }

  queueAssets() {
    for (const key of [...PIXEL_ART, ...ITEMS]) this.load.image(key, `assets/${TEST_ART[key] ?? (this.useHd(key) ? `${HD_DIR}/${key}` : key)}.png`);
    this.load.spritesheet('hero', 'assets/hero.png', HERO_FRAME);
    // Kleidung je Gebiet (siehe hero in levels.js)
    this.load.spritesheet('hero_forest', 'assets/hero_forest.png', HERO_FRAME);
    this.load.spritesheet('hero_savanna', 'assets/hero_savanna.png', HERO_FRAME);
    this.load.spritesheet('hero_asia', 'assets/hero_asia.png', HERO_FRAME);
    this.load.spritesheet('hero_jungle', 'assets/hero_jungle.png', HERO_FRAME);
    this.load.spritesheet('hero_swim', 'assets/hero_swim.png', HERO_FRAME); // Taucheranzug (Riff)
    this.load.spritesheet('hero_walk', 'assets/hero_walk.png', HERO_WALK_FRAME); // Laufanimation (Test, nur Wiesen-Kleidung)
    this.load.spritesheet('hero_walk_back', 'assets/hero_walk_back.png', HERO_WALK_FRAME); // dasselbe von hinten
    this.load.spritesheet('hero_idle', 'assets/hero_idle.png', HERO_WALK_FRAME); // steht, atmet und blinzelt
    this.load.spritesheet('hero_forest_walk', 'assets/hero_forest_walk.png', HERO_WALK_FRAME); // Wald-Kleidung läuft (Test)
    this.load.spritesheet('hero_forest_walk_back', 'assets/hero_forest_walk_back.png', HERO_WALK_FRAME);
    this.load.spritesheet('hero_forest_idle', 'assets/hero_forest_idle.png', HERO_WALK_FRAME);
    this.load.spritesheet('hero_forest_idle_back', 'assets/hero_forest_idle_back.png', HERO_WALK_FRAME);
    for (const k of ['walk', 'walk_back', 'idle', 'idle_back']) this.load.spritesheet(`hero_savanna_${k}`, `assets/hero_savanna_${k}.png`, HERO_WALK_FRAME); // Safari-Kleidung
    this.load.spritesheet('sheep', 'assets/sheep.png', SHEEP_FRAME);
    this.load.spritesheet('sheep_eat', 'assets/sheep_eat.png', SHEEP_FRAME); // grasend, Kopf unten
    // Lauf- und Stehanimation (Test), von vorne und hinten
    for (const key of ['sheep_walk', 'sheep_walk_back', 'sheep_idle', 'sheep_idle_back']) this.load.spritesheet(key, `assets/${key}.png`, SHEEP_FRAME);
    // Bauernhof-Event: Schafe sehen aus wie Kuh, Schwein oder Ziege (Platzhalter, gleiches Format wie das Schaf)
    for (const k of ['cow', 'pig', 'goat']) {
      const frame = k === 'cow' ? { frameWidth: 96, frameHeight: 88 } : SHEEP_FRAME; // die Kuh ist breiter
      this.load.spritesheet(`farm_${k}`, `assets/farm_${k}.png`, frame);
      this.load.spritesheet(`farm_${k}_eat`, `assets/farm_${k}_eat.png`, frame);
    }
    this.load.spritesheet('cat', 'assets/cat.png', CAT_FRAME);
    // Lauf- und Stehanimation (Test), von vorne und hinten
    for (const key of ['cat_walk', 'cat_walk_back', 'cat_idle', 'cat_idle_back']) this.load.spritesheet(key, `assets/${key}.png`, CAT_FRAME);
    this.load.spritesheet('cat_eat', 'assets/cat_eat.png', CAT_FRAME); // frisst am Futter (Kopf unten)
    for (const k of ['koi1', 'koi2', 'koi3']) this.load.spritesheet(k, `assets/${k}.png`, KOI_FRAME); // drei Farbmuster
    this.load.spritesheet('icecream_seller', 'assets/icecream_seller.png', HERO_FRAME); // Eisverkäuferin (Eisstand-Event)
    for (let n = 1; n <= 8; n++) this.load.spritesheet(`visitor${n}`, `assets/visitor${n}.png`, HERO_FRAME); // Besucher im Tierpark
    for (const w of ['meadow', 'forest', 'savanna', 'asia']) this.load.spritesheet(`ride_${w}`, `assets/ride_${w}.png`, { frameWidth: 160, frameHeight: 230 }); // Reittiere
    // Esel, Pferd und Elefant laufen und stehen (Test)
    for (const w of ['meadow', 'forest']) {
      for (const k of ['walk', 'walk_back', 'idle', 'idle_back']) this.load.spritesheet(`ride_${w}_${k}`, `assets/ride_${w}_${k}.png`, { frameWidth: 160, frameHeight: 230 });
    }
    // Elefant: die Steh-Bögen sind in zwei Reihen umgebrochen, darum mit Anzahl der Bilder (sonst leere Felder)
    for (const [k, count] of [['walk', 14], ['walk_back', 26], ['idle', 20], ['idle_back', 21]]) {
      this.load.spritesheet(`ride_savanna_${k}`, `assets/ride_savanna_${k}.png`, { frameWidth: 160, frameHeight: 230, endFrame: count - 1 });
    }
    for (const k of ['car_park', 'car_forest', 'car_savanna', 'car_asia']) this.load.spritesheet(k, `assets/${k}.png`, CAR_FRAME); // Schnellreise
    this.load.spritesheet('boat', 'assets/boat.png', CAR_FRAME); // Schnellreise in der Unterwasserwelt
    this.load.spritesheet('seaplane', 'assets/seaplane.png', CAR_FRAME); // Schnellreise im Dschungel (Wasserflugzeug)
    // Kanu (Dschungel): leer und mit Henrik darin, je 4 Ansichten
    for (const k of ['canoe', 'canoe_hero']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 144, frameHeight: 152 });
    const wf = this.useHd('waterfall') ? hdFactor('waterfall') : 1; // große Fassung: Bilder 4-mal (Handy 2-mal) so groß, danach verkleinert (shrinkTexture)
    this.load.spritesheet('waterfall', `assets/${wf > 1 ? `${HD_DIR}/` : ''}waterfall.png`, { frameWidth: 128 * wf, frameHeight: 160 * wf }); // Wasserfall im Dschungel (3 Bilder)
    this.load.spritesheet('cat_sleep', 'assets/cat_sleep.png', CAT_SLEEP_FRAME); // eingerollt auf dem Kratzbaum
    // Katze 2 (seltener Skin)
    this.load.spritesheet('cat2', 'assets/cat2.png', CAT_FRAME);
    for (const key of ['cat2_walk', 'cat2_walk_back', 'cat2_idle', 'cat2_idle_back']) this.load.spritesheet(key, `assets/${key}.png`, CAT_FRAME); // läuft und steht (Test)
    this.load.spritesheet('cat2_eat', 'assets/cat2_eat.png', CAT_FRAME);
    this.load.spritesheet('cat2_sleep', 'assets/cat2_sleep.png', { frameWidth: 88, frameHeight: 60 }); // Perserkatze liegt breiter
    this.load.spritesheet('deer', 'assets/deer.png', DEER_FRAME);
    this.load.spritesheet('deer_eat', 'assets/deer_eat.png', DEER_FRAME);
    this.load.spritesheet('deer_walk', 'assets/deer_walk.png', DEER_FRAME); // Laufanimation von vorne (Test)
    this.load.spritesheet('deer_walk_back', 'assets/deer_walk_back.png', DEER_FRAME); // dasselbe von hinten
    this.load.spritesheet('deer_idle', 'assets/deer_idle.png', DEER_FRAME); // steht (Test)
    this.load.spritesheet('deer_idle_back', 'assets/deer_idle_back.png', DEER_FRAME);
    this.load.spritesheet('stag', 'assets/stag.png', STAG_FRAME);
    this.load.spritesheet('stag_idle', 'assets/stag_idle.png', STAG_FRAME); // Hirsch steht (Test)
    this.load.spritesheet('stag_idle_back', 'assets/stag_idle_back.png', STAG_FRAME);
    this.load.spritesheet('stag_eat', 'assets/stag_eat.png', STAG_FRAME);
    this.load.spritesheet('frog', 'assets/frog.png', FROG_FRAME);
    this.load.spritesheet('frog_hop', 'assets/frog_hop.png', { frameWidth: 56, frameHeight: 78 }); // Sprung (Test, siehe Frog.js)
    this.load.spritesheet('frog_hop_back', 'assets/frog_hop_back.png', { frameWidth: 56, frameHeight: 78 }); // dasselbe von hinten
    this.load.spritesheet('frog_idle', 'assets/frog_idle.png', { frameWidth: 56, frameHeight: 78 }); // sitzt (Test)
    this.load.spritesheet('frog2_hop', 'assets/frog2_hop.png', { frameWidth: 56, frameHeight: 78 }); // blauer Frosch hüpft (Test)
    this.load.spritesheet('frog2_hop_back', 'assets/frog2_hop_back.png', { frameWidth: 56, frameHeight: 78 });
    this.load.spritesheet('frog_idle_back', 'assets/frog_idle_back.png', { frameWidth: 56, frameHeight: 78 });
    this.load.spritesheet('frog2', 'assets/frog2.png', FROG_FRAME); // seltener blauer Frosch
    this.load.spritesheet('mole', 'assets/mole.png', MOLE_FRAME);
    this.load.spritesheet('mole_mound', 'assets/mole_mound.png', MOLE_MOUND_FRAME);
    this.load.spritesheet('heron', 'assets/heron.png', HERON_FRAME);
    this.load.spritesheet('heron_fly', 'assets/heron_fly.png', HERON_FLY_FRAME);
    this.load.spritesheet('heron_flap', 'assets/heron_flap.png', { frameWidth: 96, frameHeight: 96 }); // Flügelschlag (Test)
    this.load.spritesheet('heron_idle', 'assets/heron_idle.png', HERON_FRAME); // steht (Test)
    this.load.spritesheet('heron_idle_back', 'assets/heron_idle_back.png', HERON_FRAME);
    this.load.spritesheet('heron_flap_back', 'assets/heron_flap_back.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('macaque', 'assets/macaque.png', { frameWidth: 72, frameHeight: 72 }); // Japanmakak (Asien)
    // Brüllaffe (Dschungel): laufend, springend (von Krone zu Krone) und mit der Banane
    for (const k of ['howler', 'howler_jump', 'howler_eat', 'gibbon', 'gibbon_jump', 'gibbon_eat']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 88, frameHeight: 88 }); // ... und der Gibbon (bei Nebel)
    // Schlange und Vogelspinne (Dschungel, Reptilienhaus), dazu ihre seltenen Farben
    // Ara (Dschungel) und der seltene blau-gelbe Ara: sitzend und fliegend
    for (const k of ['macaw', 'macaw2']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 64, frameHeight: 80 });
    for (const k of ['macaw_fly', 'macaw2_fly']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 88, frameHeight: 80 });
    for (const k of ['snake', 'snake2']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 72, frameHeight: 72 });
    for (const k of ['tarantula', 'tarantula2']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('macaque_bath', 'assets/macaque_bath.png', { frameWidth: 72, frameHeight: 72 }); // badet in der heißen Quelle
    this.load.spritesheet('panda', 'assets/panda.png', { frameWidth: 88, frameHeight: 96 }); // Panda (Asien)
    for (const k of ['redpanda', 'redpanda_sit']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 72, frameHeight: 72 }); // roter Panda (Glühwürmchen-Abend), laufend und sitzend
    this.load.image('redpanda_tree', 'assets/redpanda_tree.png'); // ... oben im Kirschbaum
    this.load.spritesheet('panda_eat', 'assets/panda_eat.png', { frameWidth: 88, frameHeight: 96 }); // sitzt und frisst Bambus
    this.load.spritesheet('minifish', 'assets/minifish.png', { frameWidth: 20, frameHeight: 16 }); // Zierfische im Aquarium
    this.load.spritesheet('butterfly', 'assets/butterfly.png', { frameWidth: 64, frameHeight: 64 }); // Schmetterlinge (12 Farben, Platzhalter aus tools/butterfly-sprites.cjs)
    this.load.spritesheet('reeffish', 'assets/reeffish.png', { frameWidth: 96, frameHeight: 64 }); // Riff-Fische (22 Arten, siehe tools/reef-fish.cjs)
    this.load.spritesheet('seahorse', 'assets/seahorse.png', { frameWidth: 48, frameHeight: 64 }); // Seepferdchen (Riff)
    this.load.spritesheet('octopus', 'assets/octopus.png', { frameWidth: 72, frameHeight: 72 }); // Krake (Riff)
    for (const k of ['jellyfish', 'jellyfish2']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 64, frameHeight: 96 }); // Qualle und Goldqualle (Quallen-Schwarm)
    this.load.spritesheet('gnu', 'assets/gnu.png', { frameWidth: 88, frameHeight: 96 }); // Gnu (Große Wanderung)
    for (const k of ['wolf', 'wolf_howl', 'wolf_eat', 'wolf2', 'wolf2_howl', 'wolf2_eat']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 80, frameHeight: 80 }); // Wolf und schwarzer Wolf (Wolfsnacht)
    for (const k of ['ray', 'ray2']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 112, frameHeight: 80 }); // Rochen und Mantarochen (Riff)
    this.load.spritesheet('turtle', 'assets/turtle.png', { frameWidth: 112, frameHeight: 88 }); // Meeresschildkröte (Riff); im Netz: turtle_net (kommt noch)
    // Pfau (Asien) und der weiße Pfau (seltene Variante); _wheel: schlägt ein Rad
    for (const k of ['peacock', 'peacock_wheel', 'peacock2', 'peacock2_wheel']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 96, frameHeight: 96 });
    // Orang-Utan (Asien) und das Flanschen-Männchen (seltene Variante); _eat: sitzt und frisst; _tree: oben in der Baumkrone
    this.load.spritesheet('orangutan_eat', 'assets/orangutan_eat.png', { frameWidth: 88, frameHeight: 88 });
    this.load.spritesheet('orangutan2_eat', 'assets/orangutan2_eat.png', { frameWidth: 88, frameHeight: 88 });
    for (const k of ['orangutan', 'orangutan2']) {
      this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 88, frameHeight: 88 });
      this.load.image(`${k}_tree`, `assets/${k}_tree.png`);
    }
    // Tiger (Asien) und der weiße Tiger (seltene Variante); _peek: neugieriges Gesicht im Bambus
    for (const k of ['tiger_eat', 'tiger2_eat']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 96, frameHeight: 80 });
    for (const k of ['tiger', 'tiger2']) {
      this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 96, frameHeight: 80 });
      this.load.image(`${k}_peek`, `assets/${k}_peek.png`);
    }
    this.load.spritesheet('flamingo', 'assets/flamingo.png', HERON_FRAME); // Flamingo-Flug (Event)
    this.load.spritesheet('flamingo_fly', 'assets/flamingo_fly.png', { frameWidth: 104, frameHeight: 100 });
    this.load.spritesheet('flamingo_baby', 'assets/flamingo_baby.png', HERON_FRAME); // Küken (Tierbabys)
    this.load.spritesheet('fish', 'assets/fish.png', FISH_FRAME);
    this.load.spritesheet('fish2', 'assets/fish2.png', FISH_FRAME); // Wels (seltener Skin)
    this.load.spritesheet('fishbag', 'assets/fishbag.png', FISHBAG_FRAME);
    this.load.spritesheet('squirrel', 'assets/squirrel.png', SQUIRREL_FRAME);
    this.load.spritesheet('squirrel_run', 'assets/squirrel_run.png', { frameWidth: 64, frameHeight: 60 }); // rennt (Test)
    this.load.spritesheet('squirrel_idle', 'assets/squirrel_idle.png', { frameWidth: 64, frameHeight: 60 }); // sitzt (Test)
    this.load.spritesheet('fox', 'assets/fox.png', FOX_FRAME);
    this.load.spritesheet('fox_eat', 'assets/fox_eat.png', FOX_FRAME);
    this.load.spritesheet('fox_walk', 'assets/fox_walk.png', FOX_FRAME); // Laufanimation von vorne (Test)
    this.load.spritesheet('fox_walk_back', 'assets/fox_walk_back.png', FOX_FRAME); // dasselbe von hinten
    this.load.spritesheet('fox_idle', 'assets/fox_idle.png', FOX_FRAME); // steht (Test)
    this.load.spritesheet('fox_idle_back', 'assets/fox_idle_back.png', FOX_FRAME); // dasselbe von hinten
    this.load.spritesheet('fox_sleep', 'assets/fox_sleep.png', FOX_SLEEP_FRAME); // eingerollt vor der Höhle
    this.load.spritesheet('antelope', 'assets/antelope.png', ANTELOPE_FRAME);
    this.load.spritesheet('antelope_eat', 'assets/antelope_eat.png', ANTELOPE_FRAME);
    this.load.spritesheet('antelope2', 'assets/antelope2.png', ANTELOPE_FRAME); // Oryx (seltener Skin)
    this.load.spritesheet('antelope2_eat', 'assets/antelope2_eat.png', ANTELOPE_FRAME);
    this.load.spritesheet('zebra', 'assets/zebra.png', ZEBRA_FRAME);
    this.load.spritesheet('zebra_drink', 'assets/zebra_drink.png', ZEBRA_FRAME); // trinkt mit gesenktem Kopf
    // Schoko-Zebra (seltener Skin, umgefärbt mit tools/recolor.js)
    this.load.spritesheet('zebra2', 'assets/zebra2.png', ZEBRA_FRAME);
    this.load.spritesheet('zebra2_drink', 'assets/zebra2_drink.png', ZEBRA_FRAME);
    for (const [key, [frameWidth, frameHeight, count]] of Object.entries(SAVANNA_ANIMS)) this.load.spritesheet(key, `assets/${key}.png`, { frameWidth, frameHeight, endFrame: count - 1 });
    this.load.spritesheet('meerkat', 'assets/meerkat.png', MEERKAT_FRAME);
    this.load.spritesheet('meerkat_hole', 'assets/meerkat_hole.png', MEERKAT_HOLE_FRAME); // im Erdloch
    this.load.audio('meerkat_alarm', 'assets/sounds/meerkat_alarm.wav'); // Warnpfiff des Wächters
    this.load.spritesheet('lion', 'assets/lion.png', LION_FRAME);
    this.load.spritesheet('lion_eat', 'assets/lion_eat.png', LION_FRAME);
    this.load.image('lion_sleep', 'assets/lion_sleep.png'); // liegend, schläft (Kopf nach rechts)
    this.load.image('lion_alert', 'assets/lion_alert.png'); // liegend, schaut auf
    // Schwarzmähnen-Löwe (seltener Skin): dieselben vier Bilder
    this.load.spritesheet('lion2', 'assets/lion2.png', LION_FRAME);
    this.load.spritesheet('lion2_eat', 'assets/lion2_eat.png', LION_FRAME);
    this.load.image('lion2_sleep', 'assets/lion2_sleep.png');
    this.load.image('lion2_alert', 'assets/lion2_alert.png');
    this.load.audio('lion_roar', 'assets/sounds/lion_roar.wav');
    this.load.audio('wolf_howl', 'assets/sounds/wolf_howl.wav'); // Wolfsgeheul (siehe tools/prepare-sounds.js)
    this.load.spritesheet('croc', 'assets/croc.png', CROC_FRAME);
    this.load.spritesheet('croc_water', 'assets/croc_water.png', CROC_WATER_FRAME); // nur der Kopf schaut aus dem Wasser
    // Savanne in den Wetterphasen: Skins (Schuhschnabel, Albino-Krokodil, Lungenfisch) und neue Tiere
    this.load.spritesheet('shoebill', 'assets/shoebill.png', HERON_FRAME);
    this.load.spritesheet('shoebill_fly', 'assets/shoebill_fly.png', HERON_FLY_FRAME);
    this.load.spritesheet('croc_albino', 'assets/croc_albino.png', CROC_FRAME);
    this.load.spritesheet('croc_albino_water', 'assets/croc_albino_water.png', CROC_WATER_FRAME); // Platzhalter (umgefärbt)
    this.load.spritesheet('lungfish', 'assets/lungfish.png', FISH_FRAME);
    this.load.spritesheet('lungfish_mud', 'assets/lungfish_mud.png', FISH_FRAME); // steckt im Schlamm (Trockenzeit, Platzhalter)
    this.load.spritesheet('hippo', 'assets/hippo.png', { frameWidth: 96, frameHeight: 88 }); // Nilpferd (Starkregen)
    this.load.spritesheet('hippo_water', 'assets/hippo_water.png', { frameWidth: 64, frameHeight: 44 }); // ... schwimmend: obere Kopfhälfte
    for (const k of ['hyena', 'hyena_eat']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 80, frameHeight: 80 }); // Hyäne (Trockenzeit)
    this.load.spritesheet('warthog', 'assets/warthog.png', { frameWidth: 80, frameHeight: 88 }); // Warzenschwein (Trockenzeit)
    this.load.image('warthog_hole', 'assets/warthog_hole.png'); // sein Erdloch (Platzhalter)
    this.load.spritesheet('vulture', 'assets/vulture.png', HERON_FRAME); // Geier (Trockenzeit)
    this.load.spritesheet('vulture_fly', 'assets/vulture_fly.png', HERON_FLY_FRAME);
    this.load.image('bone_pile', `assets/${this.useHd('bone_pile') ? `${HD_DIR}/` : ''}bone_pile.png`); // gestreute Knochen (lockt die Hyänen an)
    this.load.audio('hyena_laugh', 'assets/sounds/hyena_laugh.wav');
    this.load.audio('tree_rustle', 'assets/sounds/tree_rustle.wav'); // Rascheln in der Baumkrone (Brüllaffen, Dschungel)
    this.load.spritesheet('giraffe', 'assets/giraffe.png', GIRAFFE_FRAME);
    this.load.spritesheet('giraffe_eat', 'assets/giraffe_eat.png', GIRAFFE_EAT_FRAME); // frisst mit gestrecktem Hals an einer Akazie
    this.load.audio('step', 'assets/sounds/step.wav'); // Schritt-Geräusch (siehe tools/prepare-sounds.js)
    this.load.audio('step_indoor', 'assets/sounds/step_indoor.wav'); // ... drinnen (Haupthaus, Hütten, Aquarium)
    this.load.audio('whoosh', 'assets/sounds/whoosh.wav'); // beim Einsetzen eines Werkzeugs
    this.load.audio('trap', 'assets/sounds/trap.wav'); // Falle schnappt zu
    this.load.audio('car', 'assets/sounds/car.wav'); // Auto fährt los (Schnellreise)
    // Tierrufe beim Fangen; Tierarten ohne Eintrag bleiben still
    for (const [species, file] of Object.entries(ANIMAL_SOUNDS)) this.load.audio(`animal_${species}`, `assets/sounds/${file}`);
  }

  // nach dem Laden: Bilder vorbereiten, Animationen anlegen
  setupAssets() {
    // Pixel-Art scharf vergrößern; Figuren und gedrehte Gegenstände bleiben weich
    for (const key of PIXEL_ART) if (!this.useHd(key)) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const key of HD) if (this.useHd(key)) shrinkTexture(this.textures.get(key), hdFactor(key)); // große Bilder in alter Größe anzeigen
    // Bilder pro Sekunde so, dass ein Doppelschritt etwa 0,7 Sekunden dauert (vorne 10 Bilder, hinten 13)
    this.anims.create({ key: 'hero_walk', frames: this.anims.generateFrameNumbers('hero_walk'), frameRate: 14, repeat: -1 });
    this.anims.create({ key: 'hero_walk_back', frames: this.anims.generateFrameNumbers('hero_walk_back'), frameRate: 14, repeat: -1 });
    this.anims.create({ key: 'hero_idle', frames: this.anims.generateFrameNumbers('hero_idle'), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'hero_forest_walk', frames: this.anims.generateFrameNumbers('hero_forest_walk'), frameRate: 14, repeat: -1 });
    // von hinten mehr Bilder pro Doppelschritt (etwa 16), daher schneller abspielen
    this.anims.create({ key: 'hero_forest_walk_back', frames: this.anims.generateFrameNumbers('hero_forest_walk_back'), frameRate: 20, repeat: -1 });
    this.anims.create({ key: 'hero_forest_idle', frames: this.anims.generateFrameNumbers('hero_forest_idle'), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'hero_forest_idle_back', frames: this.anims.generateFrameNumbers('hero_forest_idle_back'), frameRate: 12, repeat: -1 });
    // Safari-Kleidung: etwas langsamere Schritte als die Wald-Kleidung (ihre Vorlagen haben mehr Bilder pro Schritt)
    for (const [key, frameRate] of [['hero_savanna_walk', 11], ['hero_savanna_walk_back', 12], ['hero_savanna_idle', 10], ['hero_savanna_idle_back', 12]]) {
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate, repeat: -1 });
    }
    for (const key of ['deer_walk', 'deer_walk_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'squirrel_run', frames: this.anims.generateFrameNumbers('squirrel_run'), frameRate: 16, repeat: -1 });
    this.anims.create({ key: 'fox_walk', frames: this.anims.generateFrameNumbers('fox_walk'), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'fox_walk_back', frames: this.anims.generateFrameNumbers('fox_walk_back'), frameRate: 16, repeat: -1 }); // mehr Bilder pro Schritt
    for (const key of ['fox_idle', 'fox_idle_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    // Frosch im Gehege und beim Folgen: Sprung an Sprung (ducken, Flug, landen); in der Wildnis steuert Frog.js die Bilder
    this.anims.create({ key: 'frog_hop', frames: this.anims.generateFrameNumbers('frog_hop', { start: 3, end: 18 }), frameRate: 22, repeat: -1 });
    this.anims.create({ key: 'frog2_hop', frames: this.anims.generateFrameNumbers('frog2_hop', { start: 5, end: 17 }), frameRate: 18, repeat: -1 });
    this.anims.create({ key: 'frog2_hop_back', frames: this.anims.generateFrameNumbers('frog2_hop_back', { start: 10, end: 28 }), frameRate: 26, repeat: -1 });
    for (const key of ['frog_idle', 'frog_idle_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'frog_hop_back', frames: this.anims.generateFrameNumbers('frog_hop_back', { start: 3, end: 17 }), frameRate: 21, repeat: -1 });
    this.anims.create({ key: 'squirrel_idle', frames: this.anims.generateFrameNumbers('squirrel_idle'), frameRate: 10, repeat: -1 });
    for (const key of ['ride_meadow_walk', 'ride_meadow_walk_back', 'ride_forest_walk']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    // Pferd von hinten: mehrere Schritte in 31 Bildern, etwas schneller, damit es nicht langsamer trabt als von vorne
    this.anims.create({ key: 'ride_forest_walk_back', frames: this.anims.generateFrameNumbers('ride_forest_walk_back'), frameRate: 14, repeat: -1 });
    for (const key of ['ride_savanna_walk', 'ride_savanna_walk_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 16, repeat: -1 });
    for (const key of ['ride_meadow_idle', 'ride_meadow_idle_back', 'ride_forest_idle', 'ride_forest_idle_back', 'ride_savanna_idle', 'ride_savanna_idle_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['cat2_walk', 'cat2_walk_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    for (const key of ['cat_walk', 'cat_walk_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    for (const key of ['cat_idle', 'cat_idle_back', 'cat2_idle', 'cat2_idle_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['sheep_walk', 'sheep_walk_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    for (const key of ['sheep_idle', 'sheep_idle_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['heron_idle', 'heron_idle_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['heron_flap', 'heron_flap_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 12, repeat: -1 });
    for (const key of ['stag_idle', 'stag_idle_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    for (const key of ['deer_idle', 'deer_idle_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 10, repeat: -1 });
    // Savannentiere: Laufen und Fliegen 12 Bilder pro Sekunde (das Lauftempo passt Animal.render an), sonst 10
    // Giraffe: lange Beine, gemächliches Tempo – langsamere Schritte, sonst trippelt sie. Geier: ein Flügelschlag hat nur
    // 5 Bilder, schnell abgespielt flackert er
    const SAVANNA_RATE = { giraffe_walk: 7, giraffe_walk_back: 7, vulture_flap: 7, vulture_flap_back: 7 };
    for (const [key, [, , , feetY]] of Object.entries(SAVANNA_ANIMS)) if (feetY) this.textures.get(key).customData.feetY = feetY;
    for (const key of Object.keys(SAVANNA_ANIMS)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: SAVANNA_RATE[key] ?? (key.includes('_walk') || key.includes('_flap') ? 12 : 10), repeat: -1 });
  }
}
