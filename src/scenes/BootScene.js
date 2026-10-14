import Phaser from 'phaser';

// Pixel-Art-Grafiken aus tools/make-sprites.js
const PIXEL_ART = [
  'grass0', 'grass1', 'grass2', 'path', 'soil', 'water',
  'tree', 'bush', 'rock', 'flowers_red', 'flowers_yellow', 'fence_x', 'fence_y', 'gate_x', 'shed', 'sign_fish', 'fishpond0', 'fishpond1',
  'fgrass0', 'fgrass1', 'fgrass2', 'forest_path', 'pine', 'dark_tree', 'dark_bush', 'log', 'fern', 'mushroom',
  'signpost', 'shed_log',
  'sgrass0', 'sgrass1', 'sgrass2', 'savanna_path', 'acacia', 'boulder', 'dry_bush', 'tuft', 'shed_tent',
  'planks', 'cat_tree', 'mesh_x', 'mesh_y', 'gate_y', 'net_x', 'net_y',
  'chain_x', 'chain_y', 'post_wood', 'post_mesh', 'post_net', 'post_chain',
  'gate_chain_x', 'gate_chain_y', 'gate_glass_x', 'gate_glass_y', 'gate_glassflap_x', 'gate_glassflap_y', 'gate_net_x', 'gate_net_y',
  'tall_x', 'tall_y', 'post_tall', 'gate_tall_x', 'gate_tall_y', 'den', 'den_sand',
  // Asien
  'agrass0', 'agrass1', 'agrass2', 'asia_path', 'asia_water0', 'asia_water1', 'asia_water2', 'hotspring',
  'bamboo', 'tall_grass', 'jungle_tree', 'cherry_tree',
  'sun_rock', 'stone_lantern', 'torii', 'shed_pagoda',
];

// Gegenstände in doppelter Auflösung (werden halb so groß angezeigt)
const ITEMS = ['net', 'lasso', 'trap', 'hand', 'food', 'esign_pasture', 'esign_cats', 'esign_pond', 'esign_aviary', 'esign_savanna', 'esign_deerpark', 'esign_foxden', 'esign_forestaviary', 'esign_meerkat', 'esign_lion', 'esign_crocodile', 'koifood', 'esign_koi'];

// Muss zu tools/prepare-characters.js passen
const HERO_FRAME = { frameWidth: 72, frameHeight: 116 };
const HERO_WALK_FRAME = { frameWidth: 88, frameHeight: 116 };
const SHEEP_FRAME = { frameWidth: 80, frameHeight: 88 };
const CAT_FRAME = { frameWidth: 72, frameHeight: 80 };
const KOI_FRAME = { frameWidth: 88, frameHeight: 52 };
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
  fish: 'animal_fish.wav',
  koi: 'animal_fish.wav', // derselbe Platscher wie beim Fisch
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
    this.load.spritesheet('hero_walk', 'assets/hero_walk.png', HERO_WALK_FRAME); // Laufanimation (Test, nur Wiesen-Kleidung)
    this.load.spritesheet('hero_walk_back', 'assets/hero_walk_back.png', HERO_WALK_FRAME); // dasselbe von hinten
    this.load.spritesheet('hero_idle', 'assets/hero_idle.png', HERO_WALK_FRAME); // steht, atmet und blinzelt
    this.load.spritesheet('sheep', 'assets/sheep.png', SHEEP_FRAME);
    this.load.spritesheet('sheep_eat', 'assets/sheep_eat.png', SHEEP_FRAME); // grasend, Kopf unten
    this.load.spritesheet('cat', 'assets/cat.png', CAT_FRAME);
    for (const k of ['koi1', 'koi2', 'koi3']) this.load.spritesheet(k, `assets/${k}.png`, KOI_FRAME); // drei Farbmuster
    this.load.spritesheet('cat_sleep', 'assets/cat_sleep.png', CAT_SLEEP_FRAME); // eingerollt auf dem Kratzbaum
    this.load.spritesheet('deer', 'assets/deer.png', DEER_FRAME);
    this.load.spritesheet('stag', 'assets/stag.png', STAG_FRAME);
    this.load.spritesheet('frog', 'assets/frog.png', FROG_FRAME);
    this.load.spritesheet('mole', 'assets/mole.png', MOLE_FRAME);
    this.load.spritesheet('mole_mound', 'assets/mole_mound.png', MOLE_MOUND_FRAME);
    this.load.spritesheet('heron', 'assets/heron.png', HERON_FRAME);
    this.load.spritesheet('heron_fly', 'assets/heron_fly.png', HERON_FLY_FRAME);
    this.load.spritesheet('fish', 'assets/fish.png', FISH_FRAME);
    this.load.spritesheet('fishbag', 'assets/fishbag.png', FISHBAG_FRAME);
    this.load.spritesheet('squirrel', 'assets/squirrel.png', SQUIRREL_FRAME);
    this.load.spritesheet('fox', 'assets/fox.png', FOX_FRAME);
    this.load.spritesheet('fox_sleep', 'assets/fox_sleep.png', FOX_SLEEP_FRAME); // eingerollt vor der Höhle
    this.load.spritesheet('antelope', 'assets/antelope.png', ANTELOPE_FRAME);
    this.load.spritesheet('zebra', 'assets/zebra.png', ZEBRA_FRAME);
    this.load.spritesheet('zebra_drink', 'assets/zebra_drink.png', ZEBRA_FRAME); // trinkt mit gesenktem Kopf
    this.load.spritesheet('meerkat', 'assets/meerkat.png', MEERKAT_FRAME);
    this.load.spritesheet('meerkat_hole', 'assets/meerkat_hole.png', MEERKAT_HOLE_FRAME); // im Erdloch
    this.load.audio('meerkat_alarm', 'assets/sounds/meerkat_alarm.wav'); // Warnpfiff des Wächters
    this.load.spritesheet('lion', 'assets/lion.png', LION_FRAME);
    this.load.image('lion_sleep', 'assets/lion_sleep.png'); // liegend, schläft (Kopf nach rechts)
    this.load.image('lion_alert', 'assets/lion_alert.png'); // liegend, schaut auf
    this.load.audio('lion_roar', 'assets/sounds/lion_roar.wav');
    this.load.spritesheet('croc', 'assets/croc.png', CROC_FRAME);
    this.load.spritesheet('croc_water', 'assets/croc_water.png', CROC_WATER_FRAME); // nur der Kopf schaut aus dem Wasser
    this.load.spritesheet('giraffe', 'assets/giraffe.png', GIRAFFE_FRAME);
    this.load.spritesheet('giraffe_eat', 'assets/giraffe_eat.png', GIRAFFE_EAT_FRAME); // frisst mit gestrecktem Hals an einer Akazie
    this.load.audio('step', 'assets/sounds/step.wav'); // Schritt-Geräusch (siehe tools/prepare-sounds.js)
    this.load.audio('whoosh', 'assets/sounds/whoosh.wav'); // beim Einsetzen eines Werkzeugs
    this.load.audio('trap', 'assets/sounds/trap.wav'); // Falle schnappt zu
    // Tierrufe beim Fangen; Tierarten ohne Eintrag bleiben still
    for (const [species, file] of Object.entries(ANIMAL_SOUNDS)) this.load.audio(`animal_${species}`, `assets/sounds/${file}`);
  }

  create() {
    // Pixel-Art scharf vergrößern; Figuren und gedrehte Gegenstände bleiben weich
    for (const key of PIXEL_ART) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const key of ['hero_walk', 'hero_walk_back']) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: 14, repeat: -1 });
    this.anims.create({ key: 'hero_idle', frames: this.anims.generateFrameNumbers('hero_idle'), frameRate: 12, repeat: -1 });
    this.scene.start('Garden');
  }
}
