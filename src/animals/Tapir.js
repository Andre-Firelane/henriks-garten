// Tapir (Dschungel): lebt wie das Nilpferd im Fluss (von ihm sieht man dort nur Kopf und Rücken, "tapir_water"),
// bleibt aber viel länger an Land und grast am Ufer. Kommt Henrik mit leeren Händen oder einem Werkzeug näher, trottet
// er zurück ins Wasser. Im Wasser ganze Breite, die Wasserkante schräg im Iso-Winkel (wie beim Elch). Hält Henrik einen Blätterzweig vom Futterstrauch (siehe LeafBushes.js), bleibt er stehen –
// dann füttert man ihn, und er läuft mit (GardenScene.feedLeaves). Im Gehege wechselt er wie das Nilpferd zwischen
// Teich und Ufer, ist aber länger an Land.
import Phaser from 'phaser';
import Hippo from './Hippo.js';
import { tileToWorld } from '../world/iso.js';
import { SHORE_TILES } from '../world/map.js';

const WATER_TIME = [8, 14]; // so lange treibt er im Fluss ...
const LAND_TIME = [35, 55]; // ... und so lange grast er am Ufer (das Nilpferd: 14 bis 22)
const LAND_MIN = 3; // so lange bleibt er mindestens an Land, auch wenn man ihm ohne Zweig nahe kommt
const TAPIR_SCALE = 0.56; // kleiner als das Nilpferd (0.65)
const PEN_SWIM = [8, 14]; // im Gehege: so lange badet er ...
const PEN_LAND = [25, 40]; // ... und so lange läuft er am Ufer herum

export default class Tapir extends Hippo {
  constructor(scene, allAnimals) {
    super(scene, allAnimals, 'tapir');
  }

  times() {
    return { water: WATER_TIME, land: LAND_TIME, landMin: LAND_MIN, scale: TAPIR_SCALE };
  }

  // im Fluss nah am Ufer (der Dschungel-Fluss ist breit: von der Mitte aus fände er kein Ufer zum Grasen)
  placeInWater() {
    const s = Phaser.Utils.Array.GetRandom(SHORE_TILES);
    if (!s) return super.placeInWater();
    const p = tileToWorld(s.water.tx, s.water.ty);
    this.x = p.x;
    this.y = p.y;
    this.drift = null;
  }

  // Wasser-Bild höher als beim Nilpferd: die schräge Kante (tools/static-sheet.py --schraeg) reicht vorne tiefer hinab
  waterOriginY() {
    return 40 / 64;
  }

  penTimes() {
    return { swim: PEN_SWIM, land: PEN_LAND };
  }

  // mit einem Blätterzweig in der Hand bleibt er stehen (er riecht die frischen Blätter)
  shouldFlee(player) {
    if (this.scene.toolId === 'leaves') {
      this.fleeing = false;
      return false;
    }
    return super.shouldFlee(player);
  }

  // an Land kann man ihn füttern, egal wie nah am Wasser
  canBeCaughtNow() {
    return this.state === 'wild' && this.mode === 'land';
  }
}
