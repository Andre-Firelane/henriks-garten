// Bilder in höherer Auflösung (public/assets/hd/, aus tools/hd-sprites.py): sie werden so groß angezeigt wie die
// alten Pixel-Sprites, behalten beim Heranzoomen aber ihre Details. Dazu bekommt jedes Bild seine alte Größe
// (Breite, Höhe, Fußpunkt bleiben gleich), zeigt aber das ganze große Bild.
export const HD_SCALE = 4;

export const HD = [
  // Wald
  'fgrass0', 'fgrass1', 'fgrass2', 'forest_path', 'planks_forest', 'pine', 'dark_tree', 'dark_bush', 'log', 'fern', 'mushroom',
  'hutwall_forest_x', 'hutwall_forest_y', 'post_hutwall_forest', 'gate_door_forest_x', 'gate_door_forest_y', 'hutroof_forest',
  'hut_desk_forest', 'hut_chair_forest', 'hut_plant_forest', 'hut_shelf_forest', 'trap',
  // Wiese
  'grass0', 'grass1', 'grass2', 'path', 'soil', 'water', 'planks', 'tree', 'bush', 'rock', 'flowers_red', 'flowers_yellow', 'signpost_post',
  'hutwall_meadow_x', 'hutwall_meadow_y', 'post_hutwall_meadow', 'gate_door_meadow_x', 'gate_door_meadow_y', 'hutroof_meadow',
  'hut_desk_meadow', 'hut_chair_meadow', 'hut_plant_meadow', 'hut_shelf_meadow',
  // Tierpark (auch in Asien, Savanne und Dschungel)
  'acacia', 'acacia_bare', 'agrass0', 'agrass1', 'agrass2', 'aquarium_facade', 'asia_water0', 'asia_water1', 'asia_water2', 'bamboo',
  'boulder', 'build_planks', 'build_stakes', 'cat_tree', 'chain_x', 'chain_y', 'cherry_tree', 'climb_tree', 'den', 'den_sand', 'dry_bush',
  'feeder', 'fence_x', 'fence_y', 'fishpond0', 'fishpond1', 'floor_office', 'fountain', 'gate_chain_x', 'gate_chain_y',
  'gate_door_office_x', 'gate_door_office_y', 'gate_glass_x', 'gate_glass_y', 'gate_glassflap_x', 'gate_glassflap_y', 'gate_net_x',
  'gate_net_y', 'gate_tall_x', 'gate_tall_y', 'gate_x', 'gate_y', 'hammock', 'hay_rack', 'hay_shelter', 'heliconia', 'hibiscus',
  'hotspring', 'hutroof_cathouse', 'hutroof_office', 'hutwall_cathouse_x', 'hutwall_cathouse_y', 'hutwall_office_x', 'hutwall_office_y',
  'icecream', 'icecream2', 'icecream3', 'icecream_stand', 'jgrass0', 'jgrass1', 'jgrass2', 'jgrass_rain0', 'jgrass_rain1', 'jgrass_rain2',
  'jungle_plant', 'jungle_tree', 'lion_rock', 'mesh_x', 'mesh_y', 'nest_box', 'net_x', 'net_y', 'office_armchair', 'office_chair',
  'office_desk', 'office_plant_monstera', 'office_plant_strelitzia', 'office_rug', 'office_sofa', 'office_table', 'park_path', 'parkfood',
  'peacock_perch', 'reeds', 'reptile_facade', 'sgrass0', 'sgrass1', 'sgrass2', 'stone_lantern', 'sun_rock', 'tall_grass', 'tall_x',
  'tall_y', 'tire_swing', 'torii', 'toy_ball', 'tuft',
  // Savanne
  'bone', 'bone_pile', 'food', 'gate_door_savanna_x', 'gate_door_savanna_y', 'hut_chair_savanna', 'hut_desk_savanna', 'hut_plant_savanna',
  'hut_shelf_savanna', 'hutroof_savanna', 'hutwall_savanna_x', 'hutwall_savanna_y', 'mud', 'planks_savanna', 'savanna_path',
  'sdry0', 'sdry1', 'sdry2', 'sgrass_rain0', 'sgrass_rain1', 'sgrass_rain2',
  // Bambuswald
  'asia_path', 'planks_asia', 'gate_door_asia_x', 'gate_door_asia_y', 'hutwall_asia_x', 'hutwall_asia_y', 'hutroof_asia', 'hut_chair_asia',
  'hut_chest_small', 'hut_desk_asia', 'hut_plant_asia', 'hut_shelf_asia', 'jar', 'jar_glow', 'koifood',
  // Riff
  'anchor_sack', 'reef_algae', 'reef_anemone', 'reef_brain', 'reef_brain2', 'reef_branch', 'reef_branch2', 'reef_dark', 'reef_fan',
  'reef_fan2', 'reef_gravel', 'reef_kelp', 'reef_path', 'reef_rock', 'reef_sand0', 'reef_sand1', 'reef_sand2', 'reef_seagrass',
  'reef_starfish', 'reef_tube', 'reef_tube2', 'scissors', 'shell', 'tank_rock',
  // Dschungel (waterfall ist ein Bildstreifen, siehe BootScene)
  'banana', 'cliff', 'gate_door_jungle_x', 'gate_door_jungle_y', 'hut_chair_jungle', 'hut_desk_jungle', 'hut_plant_jungle',
  'hut_shelf_jungle', 'hutroof_jungle', 'hutwall_jungle_x', 'hutwall_jungle_y', 'jungle_dock', 'jungle_path', 'machete', 'mangrove',
  'planks_jungle', 'thicket', 'thicket_cut', 'thicket_small', 'waterfall',
  // Aquarium
  'aq_bench', 'aq_lamp', 'aq_path', 'aq_statue', 'coral', 'floor_aquarium', 'hutwall_aquarium_x', 'hutwall_aquarium_y', 'hutwall_tank_x',
  'hutwall_tank_y',
  // Reptilienhaus
  'floor_reptiles', 'terrarium_floor', 'hutwall_reptiles_x', 'hutwall_reptiles_y', 'post_hutwall_reptiles', 'hutwall_terrarium_x',
  'hutwall_terrarium_y', 'post_hutwall_terrarium', 'spider_web',
];

// sehr große Bilder (Dächer, Gebäude) sind nur 2- bzw. 1-mal so groß, sonst zu viel Speicher
const SCALE = { hutroof_cathouse: 2, hutroof_office: 2, hutroof_savanna: 2, hutroof_asia: 2, hutroof_jungle: 2, aquarium_facade: 1, reptile_facade: 1 };
export const hdFactor = (key) => SCALE[key] ?? HD_SCALE;

// Bilder einer großen Textur auf die kleine Größe bringen; die Bildkoordinaten (UV) zeigen weiter auf das ganze Bild.
// Das gilt nur für WebGL (der Canvas-Renderer, falls es kein WebGL gibt, würde nur einen Ausschnitt zeigen)
export function shrinkTexture(texture, f = HD_SCALE) {
  for (const frame of Object.values(texture.frames)) {
    const { u0, v0, u1, v1 } = frame;
    frame.setSize(frame.cutWidth / f, frame.cutHeight / f, frame.cutX / f, frame.cutY / f);
    Object.assign(frame, { u0, v0, u1, v1 });
    // Ausschnitte (setCrop, z. B. halbe Zäune) rechnet Phaser mit der großen Bildbreite: die UVs auf das ganze Bild strecken
    const setCropUVs = frame.setCropUVs;
    frame.setCropUVs = function (crop, ...args) {
      setCropUVs.call(this, crop, ...args);
      crop.u0 *= f;
      crop.v0 *= f;
      crop.u1 *= f;
      crop.v1 *= f;
      return crop;
    };
  }
  texture.customData.hd = f;
}

export const hdScale = (scene, key) => scene.textures.get(key).customData.hd ?? 1;

// Deckkraft eines Pixels (in alter Größe gemessen) – wie textures.getPixelAlpha, aber auch für große Bilder
let pixelCtx;
export function pixelAlpha(scene, x, y, key, frameName) {
  const f = hdScale(scene, key);
  if (f === 1) return scene.textures.getPixelAlpha(x, y, key, frameName);
  const frame = scene.textures.getFrame(key, frameName);
  if (!frame || x < 0 || y < 0 || x >= frame.cutWidth || y >= frame.cutHeight) return null;
  pixelCtx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  pixelCtx.clearRect(0, 0, 1, 1);
  pixelCtx.drawImage(frame.source.image, Math.floor((frame.cutX + x) * f), Math.floor((frame.cutY + y) * f), 1, 1, 0, 0, 1, 1);
  return pixelCtx.getImageData(0, 0, 1, 1).data[3];
}
