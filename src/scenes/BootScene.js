import Phaser from 'phaser';

// Pixel-Art-Grafiken aus tools/make-sprites.js
const PIXEL_ART = [
  'grass0', 'grass1', 'grass2', 'path', 'soil', 'water',
  'tree', 'bush', 'rock', 'flowers_red', 'flowers_yellow', 'fence_x', 'fence_y', 'gate_x', 'shed', 'sign_fish', 'fishpond0', 'fishpond1',
  'fgrass0', 'fgrass1', 'fgrass2', 'forest_path', 'pine', 'dark_tree', 'dark_bush', 'log', 'fern', 'mushroom',
  'signpost', 'shed_log',
  'sgrass0', 'sgrass1', 'sgrass2', 'savanna_path', 'acacia', 'boulder', 'dry_bush', 'tuft', 'shed_tent',
];

// Gegenstände in doppelter Auflösung (werden halb so groß angezeigt)
const ITEMS = ['net', 'lasso', 'trap', 'hand'];

// Muss zu tools/prepare-characters.js passen
const HERO_FRAME = { frameWidth: 72, frameHeight: 116 };
const SHEEP_FRAME = { frameWidth: 80, frameHeight: 88 };
const CAT_FRAME = { frameWidth: 72, frameHeight: 80 };
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
const ANTELOPE_FRAME = { frameWidth: 72, frameHeight: 100 };
const GIRAFFE_FRAME = { frameWidth: 104, frameHeight: 168 };
const ANIMAL_SOUNDS = {
  sheep: 'animal_sheep.wav',
  cat: 'animal_cat.wav',
  squirrel: 'animal_squirrel.wav',
  frog: 'animal_frog.mp3',
  fish: 'animal_fish.wav',
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    for (const key of [...PIXEL_ART, ...ITEMS]) this.load.image(key, `assets/${key}.png`);
    this.load.spritesheet('hero', 'assets/hero.png', HERO_FRAME);
    this.load.spritesheet('sheep', 'assets/sheep.png', SHEEP_FRAME);
    this.load.spritesheet('cat', 'assets/cat.png', CAT_FRAME);
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
    this.load.spritesheet('antelope', 'assets/antelope.png', ANTELOPE_FRAME);
    this.load.spritesheet('giraffe', 'assets/giraffe.png', GIRAFFE_FRAME);
    this.load.audio('step', 'assets/sounds/step.wav'); // Schritt-Geräusch (siehe tools/prepare-sounds.js)
    this.load.audio('whoosh', 'assets/sounds/whoosh.wav'); // beim Einsetzen eines Werkzeugs
    this.load.audio('trap', 'assets/sounds/trap.wav'); // Falle schnappt zu
    // Tierrufe beim Fangen; Tierarten ohne Eintrag bleiben still
    for (const [species, file] of Object.entries(ANIMAL_SOUNDS)) this.load.audio(`animal_${species}`, `assets/sounds/${file}`);
  }

  create() {
    // Pixel-Art scharf vergrößern; Figuren und gedrehte Gegenstände bleiben weich
    for (const key of PIXEL_ART) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.scene.start('Garden');
  }
}
