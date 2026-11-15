// Zweite Ausbaustufe der Gehege: Spielzeug und Ausstattung. Stufe 1 macht ein Gehege größer (basic in levels.js), Stufe 2
// bringt Spielzeug (hier) – das Gehege lockt dann TOY_BONUS-mal so viele Besucher an. Die Spielsachen stehen auf freien
// Kacheln im Gehege (placeToys in map.js sucht sie aus: nicht am Zaun, möglichst mittig, mit Abstand zueinander).
// Manche Tiere benutzen ihr Spielzeug (siehe die Tierklassen: Erdmännchen, Nilpferd, Warzenschwein, Katze, Panda).
import { tr } from '../i18n.js';

export const TOY_BONUS = 1.3;
export const TOY_COST = 1.5; // Stufe 2 kostet so viel mal den normalen Ausbau
export const PEN_LEVELS = 2; // höchste Stufe (mit Spielzeug)

// Spielsachen: Zeichen in der Karte (ⓐ …), Bild, Fußpunkt im Bild, fest (hitbox: nur der Kern) und Name.
// src/from: Vorlage für den Platzhalter (tools/toy-placeholders.cjs), color: umgefärbt
export const TOYS = {
  melons: { char: 'ⓐ', originY: 24 / 32, solid: false, name: tr('Wassermelonen', 'Watermelons'), from: 'pumpkins', color: '#4f9a3a' },
  lookout: { char: 'ⓑ', originY: 34 / 40, solid: true, hitbox: 6, name: tr('Wachposten', 'Lookout post'), from: 'forest_stump', color: '#a0703c' },
  scratch_post: { char: 'ⓒ', originY: 34 / 40, solid: true, hitbox: 6, name: tr('Kratzbürste', 'Scratching post'), from: 'forest_stump', color: '#7a5230' },
  cat_basket: { char: 'ⓓ', originY: 34 / 40, solid: false, name: tr('Katzenkörbchen', 'Cat basket'), from: 'hay_bale', color: '#c98a4b' },
  slide: { char: 'ⓔ', originY: 84 / 96, solid: true, hitbox: 9, name: tr('Rutsche', 'Slide'), from: 'climb_tree', color: '#d9534f' },
  sun_rock: { char: 'ⓕ', originY: 40 / 48, solid: false, name: tr('Sonnenfelsen', 'Sunning rock'), from: 'sun_rock', color: '#c9a77a' },
  prey_sack: { char: 'ⓖ', originY: 42 / 48, solid: true, hitbox: 8, name: tr('Beutesack', 'Prey sack'), from: 'beehive', color: '#a07a4a' },
  jute_ball: { char: 'ⓗ', originY: 26 / 32, solid: false, name: tr('Jute-Ball', 'Jute ball'), from: 'toy_ball', color: '#c8a165' },
  giraffe_feeder: { char: 'ⓘ', originY: 58 / 64, solid: true, hitbox: 6, name: tr('Hoher Futterkorb', 'High feeding basket'), from: 'birdhouse', color: '#8a6a3a' },
  salt_lick: { char: 'ⓙ', originY: 46 / 56, solid: true, hitbox: 10, name: tr('Salzleckstein', 'Salt lick'), from: 'boulder', color: '#ece6da' },
  bone_pile: { char: 'ⓚ', originY: 32 / 40, solid: false, name: tr('Knochenhaufen', 'Bone pile'), from: 'bone_pile', color: null },
  dead_tree: { char: 'ⓛ', originY: 116 / 128, solid: true, hitbox: 8, name: tr('Toter Baum', 'Dead tree'), from: 'acacia_bare', color: '#8f8475' },
  log_tunnel: { char: 'ⓜ', originY: 38 / 48, solid: true, hitbox: 10, name: tr('Baumstamm-Tunnel', 'Log tunnel'), from: 'forest_mossy_log', color: null },
  woodpile: { char: 'ⓝ', originY: 40 / 48, solid: true, hitbox: 10, name: tr('Holzstapel', 'Woodpile'), from: 'woodpile', color: null },
  nut_box: { char: 'ⓞ', originY: 84 / 96, solid: true, hitbox: 6, name: tr('Nusskasten', 'Nut box'), from: 'nest_box', color: '#b5793c' },
  nest_platform: { char: 'ⓟ', originY: 84 / 96, solid: true, hitbox: 6, name: tr('Nestplattform', 'Nest platform'), from: 'peacock_perch', color: '#9c7a52' },
  mud_nest: { char: 'ⓠ', originY: 44 / 56, solid: false, name: tr('Schlammnest', 'Mud nest'), from: 'den_sand', color: '#8a7158' },
  lianas: { char: 'ⓡ', originY: 84 / 96, solid: true, hitbox: 9, name: tr('Lianen', 'Lianas'), from: 'climb_tree', color: '#5f8f3a' },
  climb_ropes: { char: 'ⓢ', originY: 84 / 96, solid: true, hitbox: 9, name: tr('Kletterseile', 'Climbing ropes'), from: 'tire_swing', color: '#c9a36b' },
  swing_rings: { char: 'ⓣ', originY: 84 / 96, solid: true, hitbox: 6, name: tr('Schaukelringe', 'Swing rings'), from: 'peacock_perch', color: '#d9534f' },
  termite_mound: { char: 'ⓤ', originY: 64 / 72, solid: true, hitbox: 10, name: tr('Termitenhügel', 'Termite mound'), from: 'savanna_termite', color: null },
  tree_platform: { char: 'ⓥ', originY: 76 / 88, solid: true, hitbox: 10, name: tr('Baumplattform', 'Tree platform'), from: 'hammock', color: '#8a5a30' },
  straw_nest: { char: 'ⓦ', originY: 34 / 40, solid: false, name: tr('Strohnest', 'Straw nest'), from: 'hay_bale', color: '#e0c060' },
};
export const toyKey = (id) => `toy_${id}`;

// Spielzeug je Gehege (in dieser Reihenfolge aufgestellt; derselbe Name zweimal = zwei davon)
export const PEN_TOYS = {
  crocodile: ['sun_rock'],
  lion: ['prey_sack'],
  meerkat: ['lookout'],
  savanna: ['giraffe_feeder', 'salt_lick'],
  gnus: ['salt_lick'],
  hippos: ['melons'],
  vultures: ['dead_tree'],
  hyenas: ['bone_pile'],
  warthogs: ['scratch_post'],
  deerpark: ['salt_lick'],
  foxden: ['log_tunnel'],
  forestpond: ['woodpile'],
  wolves: ['log_tunnel'],
  forestaviary: ['nut_box'],
  cats: ['cat_basket', 'cat_basket'],
  pasture: ['scratch_post'],
  aviary: ['nest_platform'],
  flamingos: ['mud_nest', 'mud_nest'],
  orangutans: ['lianas'],
  tigers: ['jute_ball'],
  pandas: ['slide'],
  macaques: ['climb_ropes'],
  howlers: ['lianas'],
  macaws: ['swing_rings'],
  anteaters: ['termite_mound'],
  jaguars: ['tree_platform'],
  gorillas: ['straw_nest', 'climb_ropes'],
};

// Tiere, die ihr Spielzeug benutzen (Animal.updateToy): ab und zu (every, Sekunden) zum Spielzeug laufen und eine Weile
// (time) damit spielen. perch: hinaufspringen und Ausschau halten (lift: so hoch); eat: davor stehen und fressen (nicken);
// rub: sich daran reiben (wackeln); slide: hinaufklettern und herunterrutschen. Die Katzen schlafen im Körbchen (Cat.js).
export const TOY_PLAY = {
  meerkat: { toy: 'lookout', action: 'perch', lift: 18, time: [6, 12], every: [6, 14] },
  hippo: { toy: 'melons', action: 'eat', time: [5, 9], every: [10, 20] },
  warthog: { toy: 'scratch_post', action: 'rub', time: [3, 6], every: [8, 16] },
  sheep: { toy: 'scratch_post', action: 'rub', time: [2, 4], every: [15, 30] },
  panda: { toy: 'slide', action: 'slide', lift: 34, time: [4, 4], every: [10, 20] },
};

// höchste Stufe dieses Geheges (ohne Spielzeug-Eintrag nur der normale Ausbau)
export const maxPenLevel = (e) => (PEN_TOYS[e.id] ? PEN_LEVELS : 1);
// Beschreibung für die Tafel: "Wachposten" bzw. "Kratzbürste, Salzleckstein"
export const toysText = (e) => [...new Set(PEN_TOYS[e.id] ?? [])].map((id) => TOYS[id].name).join(', ');
