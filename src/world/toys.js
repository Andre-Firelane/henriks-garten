// Spielzeug und Deko der Gehege: kommt mit dem Gehegeausbau (zusammen mit mehr Platz und der Ausstattung aus basic in
// levels.js). Ein ausgebautes Gehege lockt TOY_BONUS-mal so viele Besucher an. Die Spielsachen stehen auf freien Kacheln im
// Gehege (placeToys in map.js sucht sie aus: nicht am Zaun, möglichst mittig, mit Abstand zueinander).
// Manche Tiere benutzen ihr Spielzeug (siehe TOY_PLAY: Erdmännchen, Nilpferd, Warzenschwein, Schaf, Panda; Katzen in Cat.js).
import { tr } from '../i18n.js';

export const TOY_BONUS = 1.3;

// Spielsachen: Zeichen in der Karte (ⓐ …), Bild, Fußpunkt im Bild, fest (hitbox: nur der Kern) und Name.
// from/color: Vorlage für den Platzhalter (tools/toy-placeholders.cjs) – ein vorhandenes Bild, umgefärbt (color) oder
// kopiert (null); from 'draw': dort einfach gezeichnet
export const TOYS = {
  melons: { char: 'ⓐ', originY: 24 / 32, solid: false, name: tr('Wassermelonen', 'Watermelons'), from: 'pumpkins', color: '#4f9a3a' },
  lookout: { char: 'ⓑ', originY: 34 / 40, solid: true, hitbox: 6, name: tr('Wachposten', 'Lookout post'), from: 'forest_stump', color: '#a0703c' },
  scratch_post: { char: 'ⓒ', originY: 44 / 48, solid: true, hitbox: 6, name: tr('Kratzbürste', 'Scratching brush'), from: 'draw', color: null },
  cat_basket: { char: 'ⓓ', originY: 26 / 32, solid: false, name: tr('Katzenkörbchen', 'Cat basket'), from: 'draw', color: null },
  slide: { char: 'ⓔ', originY: 76 / 80, solid: true, hitbox: 9, name: tr('Rutsche', 'Slide'), from: 'draw', color: null },
  sun_rock: { char: 'ⓕ', originY: 40 / 48, solid: false, name: tr('Sonnenfelsen', 'Sunning rock'), from: 'sun_rock', color: '#c9a77a' },
  prey_sack: { char: 'ⓖ', originY: 42 / 48, solid: true, hitbox: 8, name: tr('Beutesack', 'Prey sack'), from: 'beehive', color: '#a07a4a' },
  jute_ball: { char: 'ⓗ', originY: 26 / 32, solid: false, name: tr('Jute-Ball', 'Jute ball'), from: 'toy_ball', color: '#c8a165' },
  giraffe_feeder: { char: 'ⓘ', originY: 58 / 64, solid: true, hitbox: 6, name: tr('Hoher Futterkorb', 'High feeding basket'), from: 'birdhouse', color: '#8a6a3a' },
  salt_lick: { char: 'ⓙ', originY: 44 / 48, solid: true, hitbox: 6, name: tr('Salzleckstein', 'Salt lick'), from: 'draw', color: null },
  bone_pile: { char: 'ⓚ', originY: 32 / 40, solid: false, name: tr('Knochenhaufen', 'Bone pile'), from: 'bone_pile', color: null },
  dead_tree: { char: 'ⓛ', originY: 116 / 128, solid: true, hitbox: 8, name: tr('Toter Baum', 'Dead tree'), from: 'acacia_bare', color: '#8f8475' },
  log_tunnel: { char: 'ⓜ', originY: 38 / 48, solid: true, hitbox: 10, name: tr('Baumstamm-Tunnel', 'Log tunnel'), from: 'forest_mossy_log', color: null },
  woodpile: { char: 'ⓝ', originY: 40 / 48, solid: true, hitbox: 10, name: tr('Holzstapel', 'Woodpile'), from: 'woodpile', color: null },
  nut_box: { char: 'ⓞ', originY: 84 / 96, solid: true, hitbox: 6, name: tr('Nusskasten', 'Nut box'), from: 'nest_box', color: '#b5793c' },
  nest_platform: { char: 'ⓟ', originY: 84 / 96, solid: true, hitbox: 6, name: tr('Nestplattform', 'Nest platform'), from: 'peacock_perch', color: '#9c7a52' },
  mud_nest: { char: 'ⓠ', originY: 44 / 56, solid: false, name: tr('Schlammnest', 'Mud nest'), from: 'den_sand', color: '#8a7158' },
  lianas: { char: 'ⓡ', originY: 92 / 96, solid: true, hitbox: 8, name: tr('Lianen', 'Lianas'), from: 'draw', color: null },
  climb_ropes: { char: 'ⓢ', originY: 76 / 80, solid: true, hitbox: 9, name: tr('Kletterseile', 'Climbing ropes'), from: 'draw', color: null },
  swing_rings: { char: 'ⓣ', originY: 76 / 80, solid: true, hitbox: 6, name: tr('Schaukelringe', 'Swing rings'), from: 'draw', color: null },
  termite_mound: { char: 'ⓤ', originY: 64 / 72, solid: true, hitbox: 10, name: tr('Termitenhügel', 'Termite mound'), from: 'savanna_termite', color: null },
  tree_platform: { char: 'ⓥ', originY: 76 / 88, solid: true, hitbox: 10, name: tr('Baumplattform', 'Tree platform'), from: 'hammock', color: '#8a5a30' },
  straw_nest: { char: 'ⓦ', originY: 26 / 32, solid: false, name: tr('Strohnest', 'Straw nest'), from: 'draw', color: null },
  yarn_ball: { char: 'ⓧ', originY: 20 / 24, solid: false, name: tr('Wollknäuel', 'Ball of yarn'), from: 'draw', color: null },
  hay_bale: { char: 'ⓨ', originY: 36 / 40, solid: true, hitbox: 10, name: tr('Heuballen', 'Hay bale'), from: 'draw', color: null },
  feeding_rack: { char: 'ⓩ', originY: 52 / 64, solid: true, hitbox: 10, name: tr('Futterraufe', 'Feeding rack'), from: 'hay_rack', color: null },
  // key: vorhandenes Bild statt eines eigenen toy_…-Bilds; seats: so viele Tiere fressen dort zugleich (sie versammeln sich darum)
  hay_house: { char: 'Ⓗ', key: 'hay_shelter', originY: 96 / 112, solid: true, hitbox: 14, name: tr('Heuhäuschen', 'Hay hut'), seats: 5 },
};
export const toyKey = (id) => `toy_${id}`;

// Spielzeug je Gehege (in dieser Reihenfolge aufgestellt, so viele, wie Platz haben; derselbe Name zweimal = zwei davon)
export const PEN_TOYS = {
  lion: ['prey_sack', 'bone_pile'],
  meerkat: ['lookout', 'lookout'],
  safari: ['giraffe_feeder', 'hay_house', 'hay_bale'], // Safari: feste Plätze (toysAt in levels.js): im Akazienhain, das Heuhäuschen an der Piste bei der Grasebene, im Süden
  hyenas: ['bone_pile', 'bone_pile'], // Elefantenfriedhof
  deerpark: ['feeding_rack'], // Wildpark: nur die Futterraufe auf der Lichtung (ein Salzleckstein sah dort komisch aus)
  boarpen: ['scratch_post', 'mud_nest'],
  foxden: ['log_tunnel', 'jute_ball'],
  forestpond: ['woodpile', 'log_tunnel'],
  wolves: ['log_tunnel', 'bone_pile'],
  forestaviary: ['nut_box', 'nut_box'],
  cats: ['yarn_ball', 'cat_basket', 'yarn_ball'],
  pasture: ['hay_bale', 'scratch_post', 'salt_lick'],
  aviary: ['nest_platform', 'nest_platform'],
  flamingos: ['mud_nest', 'mud_nest', 'mud_nest'],
  orangutans: ['lianas', 'straw_nest'],
  tigers: ['jute_ball', 'prey_sack'],
  pandas: ['slide', 'jute_ball'],
  macaques: ['climb_ropes', 'jute_ball'],
  howlers: ['lianas', 'lianas'],
  macaws: ['swing_rings', 'swing_rings'],
  anteaters: ['termite_mound', 'termite_mound'],
  jaguars: ['tree_platform', 'jute_ball'],
  gorillas: ['straw_nest', 'climb_ropes'],
  tapirs: ['melons', 'salt_lick'],
  tanukis: ['yarn_ball', 'straw_nest'],
  yaks: ['salt_lick', 'hay_bale'],
  snowleopards: ['jute_ball', 'prey_sack'],
};

// Tiere, die ihr Spielzeug benutzen (Animal.updateToy): ab und zu (every, Sekunden) zum Spielzeug laufen und eine Weile
// (time) damit spielen. perch: hinaufspringen und Ausschau halten (lift: so hoch); eat: davor stehen und fressen (nicken);
// rub: sich daran reiben (wackeln); slide: hinaufklettern und herunterrutschen. Die Katzen schlafen im Körbchen (Cat.js).
export const TOY_PLAY = {
  meerkat: { toy: 'lookout', action: 'perch', lift: 18, time: [6, 12], every: [6, 14] },
  hippo: { toy: 'melons', action: 'eat', time: [5, 9], every: [10, 20] },
  tapir: { toy: 'melons', action: 'eat', time: [5, 9], every: [12, 24] },
  okapi: { toy: 'salt_lick', action: 'eat', time: [4, 8], every: [10, 20] },
  yak: { toy: 'salt_lick', action: 'eat', time: [5, 9], every: [12, 24] },
  warthog: { toy: 'scratch_post', action: 'rub', time: [3, 6], every: [8, 16] },
  boar: { toy: 'scratch_post', action: 'rub', time: [3, 6], every: [8, 16] }, // Wildschwein scheuert sich wie das Warzenschwein
  sheep: { toy: 'scratch_post', action: 'rub', time: [2, 4], every: [15, 30] },
  goat: { toy: 'scratch_post', action: 'rub', time: [2, 4], every: [15, 30] }, // Streichelzoo: Ziege und Schwein scheuern sich, die Kuh leckt am Salzstein
  pig: { toy: 'scratch_post', action: 'rub', time: [3, 5], every: [12, 24] },
  cow: { toy: 'salt_lick', action: 'eat', time: [5, 9], every: [12, 24] },
  panda: { toy: 'slide', action: 'slide', lift: 46, time: [4, 4], every: [10, 20] },
  // Safari: am Heuhäuschen an der Piste versammeln sich Zebras, Gnus und Antilopen zum Fressen
  zebra: { toy: 'hay_house', action: 'eat', time: [8, 16], every: [15, 35] },
  gnu: { toy: 'hay_house', action: 'eat', time: [8, 16], every: [15, 35] },
  antelope: { toy: 'hay_house', action: 'eat', time: [6, 12], every: [20, 40] },
};

// Beschreibung für die Tafel: "Wollknäuel, Katzenkörbchen"
export const toysText = (e) => [...new Set(PEN_TOYS[e.id] ?? [])].map((id) => TOYS[id].name).join(', ');
