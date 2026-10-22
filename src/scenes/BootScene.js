import Phaser from 'phaser';
import { openStartScreen } from '../ui/startScreen.js';

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
  'aquarium_facade', 'hutwall_aquarium_x', 'hutwall_aquarium_y', 'post_hutwall_aquarium', 'hutwall_tank_x', 'hutwall_tank_y', 'post_hutwall_tank',
  'floor_aquarium', 'tank_floor', 'seaweed', 'coral', 'tank_rock', 'shell', 'tank_chest',
  // Unterwasserwelt (Riff)
  'reef_sand0', 'reef_sand1', 'reef_sand2', 'reef_path', 'reef_branch', 'reef_fan', 'reef_brain', 'reef_tube', 'reef_kelp',
  'reef_starfish', 'reef_anemone', 'reef_rock', 'anchor_sack', 'reef_branch2', 'reef_fan2', 'reef_brain2', 'reef_tube2',
  'reef_gravel', 'reef_seagrass', 'reef_algae', 'reef_dark',
  'aq_path', 'aq_bench', 'aq_lamp', 'aq_statue',
  'wolf_forest_edge', // dunkler Wald hinter dem Wolfswald (Tierpark)
];

// Gegenstände in doppelter Auflösung (werden halb so groß angezeigt)
const ITEMS = ['icecream', 'icecream2', 'icecream3', 'net', 'lasso', 'trap', 'hand', 'food', 'esign_pasture', 'esign_cats', 'esign_pond', 'esign_aviary', 'esign_savanna', 'esign_deerpark', 'esign_foxden', 'esign_forestaviary', 'esign_meerkat', 'esign_lion', 'esign_crocodile', 'koifood', 'esign_koi', 'esign_board', 'parkfood', 'jar', 'scissors', 'lantern'];

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
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    for (const key of [...PIXEL_ART, ...ITEMS]) this.load.image(key, `assets/${key}.png`);
    this.load.spritesheet('hero', 'assets/hero.png', HERO_FRAME);
    // Kleidung je Gebiet (siehe hero in levels.js)
    this.load.spritesheet('hero_forest', 'assets/hero_forest.png', HERO_FRAME);
    this.load.spritesheet('hero_savanna', 'assets/hero_savanna.png', HERO_FRAME);
    this.load.spritesheet('hero_asia', 'assets/hero_asia.png', HERO_FRAME);
    this.load.spritesheet('hero_swim', 'assets/hero_swim.png', HERO_FRAME); // Taucheranzug (Riff)
    this.load.spritesheet('hero_walk', 'assets/hero_walk.png', HERO_WALK_FRAME); // Laufanimation (Test, nur Wiesen-Kleidung)
    this.load.spritesheet('hero_walk_back', 'assets/hero_walk_back.png', HERO_WALK_FRAME); // dasselbe von hinten
    this.load.spritesheet('hero_idle', 'assets/hero_idle.png', HERO_WALK_FRAME); // steht, atmet und blinzelt
    this.load.spritesheet('sheep', 'assets/sheep.png', SHEEP_FRAME);
    this.load.spritesheet('sheep_eat', 'assets/sheep_eat.png', SHEEP_FRAME); // grasend, Kopf unten
    // Bauernhof-Event: Schafe sehen aus wie Kuh, Schwein oder Ziege (Platzhalter, gleiches Format wie das Schaf)
    for (const k of ['cow', 'pig', 'goat']) {
      const frame = k === 'cow' ? { frameWidth: 96, frameHeight: 88 } : SHEEP_FRAME; // die Kuh ist breiter
      this.load.spritesheet(`farm_${k}`, `assets/farm_${k}.png`, frame);
      this.load.spritesheet(`farm_${k}_eat`, `assets/farm_${k}_eat.png`, frame);
    }
    this.load.spritesheet('cat', 'assets/cat.png', CAT_FRAME);
    this.load.spritesheet('cat_eat', 'assets/cat_eat.png', CAT_FRAME); // frisst am Futter (Kopf unten)
    for (const k of ['koi1', 'koi2', 'koi3']) this.load.spritesheet(k, `assets/${k}.png`, KOI_FRAME); // drei Farbmuster
    this.load.spritesheet('icecream_seller', 'assets/icecream_seller.png', HERO_FRAME); // Eisverkäuferin (Eisstand-Event)
    for (let n = 1; n <= 8; n++) this.load.spritesheet(`visitor${n}`, `assets/visitor${n}.png`, HERO_FRAME); // Besucher im Tierpark
    for (const w of ['meadow', 'forest', 'savanna', 'asia']) this.load.spritesheet(`ride_${w}`, `assets/ride_${w}.png`, { frameWidth: 160, frameHeight: 230 }); // Reittiere
    for (const k of ['car_park', 'car_forest', 'car_savanna', 'car_asia']) this.load.spritesheet(k, `assets/${k}.png`, CAR_FRAME); // Schnellreise
    this.load.spritesheet('boat', 'assets/boat.png', CAR_FRAME); // Schnellreise in der Unterwasserwelt
    this.load.spritesheet('cat_sleep', 'assets/cat_sleep.png', CAT_SLEEP_FRAME); // eingerollt auf dem Kratzbaum
    // Katze 2 (seltener Skin)
    this.load.spritesheet('cat2', 'assets/cat2.png', CAT_FRAME);
    this.load.spritesheet('cat2_eat', 'assets/cat2_eat.png', CAT_FRAME);
    this.load.spritesheet('cat2_sleep', 'assets/cat2_sleep.png', CAT_SLEEP_FRAME);
    this.load.spritesheet('deer', 'assets/deer.png', DEER_FRAME);
    this.load.spritesheet('deer_eat', 'assets/deer_eat.png', DEER_FRAME);
    this.load.spritesheet('stag', 'assets/stag.png', STAG_FRAME);
    this.load.spritesheet('stag_eat', 'assets/stag_eat.png', STAG_FRAME);
    this.load.spritesheet('frog', 'assets/frog.png', FROG_FRAME);
    this.load.spritesheet('frog2', 'assets/frog2.png', FROG_FRAME); // seltener blauer Frosch
    this.load.spritesheet('mole', 'assets/mole.png', MOLE_FRAME);
    this.load.spritesheet('mole_mound', 'assets/mole_mound.png', MOLE_MOUND_FRAME);
    this.load.spritesheet('heron', 'assets/heron.png', HERON_FRAME);
    this.load.spritesheet('heron_fly', 'assets/heron_fly.png', HERON_FLY_FRAME);
    this.load.spritesheet('macaque', 'assets/macaque.png', { frameWidth: 72, frameHeight: 72 }); // Japanmakak (Asien)
    this.load.spritesheet('macaque_bath', 'assets/macaque_bath.png', { frameWidth: 72, frameHeight: 72 }); // badet in der heißen Quelle
    this.load.spritesheet('panda', 'assets/panda.png', { frameWidth: 88, frameHeight: 96 }); // Panda (Asien)
    this.load.spritesheet('panda_eat', 'assets/panda_eat.png', { frameWidth: 88, frameHeight: 96 }); // sitzt und frisst Bambus
    this.load.spritesheet('minifish', 'assets/minifish.png', { frameWidth: 20, frameHeight: 16 }); // Zierfische im Aquarium
    this.load.spritesheet('reeffish', 'assets/reeffish.png', { frameWidth: 96, frameHeight: 64 }); // Riff-Fische (22 Arten, siehe tools/reef-fish.cjs)
    this.load.spritesheet('seahorse', 'assets/seahorse.png', { frameWidth: 48, frameHeight: 64 }); // Seepferdchen (Riff)
    this.load.spritesheet('octopus', 'assets/octopus.png', { frameWidth: 72, frameHeight: 72 }); // Krake (Riff)
    for (const k of ['jellyfish', 'jellyfish2']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 64, frameHeight: 96 }); // Qualle und Goldqualle (Quallen-Schwarm)
    for (const k of ['wolf', 'wolf_howl', 'wolf_eat']) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: 80, frameHeight: 80 }); // Wolf (Wolfsnacht)
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
    this.load.spritesheet('fox', 'assets/fox.png', FOX_FRAME);
    this.load.spritesheet('fox_eat', 'assets/fox_eat.png', FOX_FRAME);
    this.load.spritesheet('fox_sleep', 'assets/fox_sleep.png', FOX_SLEEP_FRAME); // eingerollt vor der Höhle
    this.load.spritesheet('antelope', 'assets/antelope.png', ANTELOPE_FRAME);
    this.load.spritesheet('antelope_eat', 'assets/antelope_eat.png', ANTELOPE_FRAME);
    this.load.spritesheet('antelope2', 'assets/antelope2.png', ANTELOPE_FRAME); // Oryx (seltener Skin)
    this.load.spritesheet('antelope2_eat', 'assets/antelope2_eat.png', ANTELOPE_FRAME);
    this.load.spritesheet('zebra', 'assets/zebra.png', ZEBRA_FRAME);
    this.load.spritesheet('zebra_drink', 'assets/zebra_drink.png', ZEBRA_FRAME); // trinkt mit gesenktem Kopf
    this.load.spritesheet('meerkat', 'assets/meerkat.png', MEERKAT_FRAME);
    this.load.spritesheet('meerkat_hole', 'assets/meerkat_hole.png', MEERKAT_HOLE_FRAME); // im Erdloch
    this.load.audio('meerkat_alarm', 'assets/sounds/meerkat_alarm.wav'); // Warnpfiff des Wächters
    this.load.spritesheet('lion', 'assets/lion.png', LION_FRAME);
    this.load.spritesheet('lion_eat', 'assets/lion_eat.png', LION_FRAME);
    this.load.image('lion_sleep', 'assets/lion_sleep.png'); // liegend, schläft (Kopf nach rechts)
    this.load.image('lion_alert', 'assets/lion_alert.png'); // liegend, schaut auf
    this.load.audio('lion_roar', 'assets/sounds/lion_roar.wav');
    this.load.audio('wolf_howl', 'assets/sounds/wolf_howl.wav'); // Wolfsgeheul (siehe tools/prepare-sounds.js)
    this.load.spritesheet('croc', 'assets/croc.png', CROC_FRAME);
    this.load.spritesheet('croc_water', 'assets/croc_water.png', CROC_WATER_FRAME); // nur der Kopf schaut aus dem Wasser
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

  create() {
    // Pixel-Art scharf vergrößern; Figuren und gedrehte Gegenstände bleiben weich
    for (const key of PIXEL_ART) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const key of ['hero_walk', 'hero_walk_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 14, repeat: -1 });
    this.anims.create({ key: 'hero_idle', frames: this.anims.generateFrameNumbers('hero_idle'), frameRate: 12, repeat: -1 });
    openStartScreen((data) => this.scene.start('Garden', data));
  }
}
