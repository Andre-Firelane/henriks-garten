// Pflanzen wiegen sich, wenn Henrik hindurchläuft (Blumen, Schilf, Sonnenblumen, Mais, Pusteblumen: sway in map.js ist
// der Ausschlag in Grad). Sie schwingen um ihren Fuß hin und her und kommen langsam zur Ruhe. Nur ein Effekt.
import { tileToWorld, worldToTile } from './iso.js';

const REACH = 22; // so nah (Kachel-Proportionen: Höhe doppelt) muss man am Fuß der Pflanze vorbeigehen
const SPEED = 9; // Schwingung (Bogenmaß pro Sekunde)
const DECAY = 2.4; // so schnell klingt sie ab
const DONE = 2.5; // nach so vielen Sekunden steht die Pflanze wieder still
const AGAIN = 0.7; // frühestens nach so langer Zeit stößt man sie erneut an

export default class Sway {
  // plants: Map "tx,ty" -> { img, deg, obj }
  constructor(scene, plants) {
    this.scene = scene;
    this.plants = plants;
    this.active = new Set();
    this.last = null;
    this.onTouch = null; // (plant) => {}: eine Pflanze wurde angestoßen (z. B. Pusteblume, siehe MeadowLife)
  }

  update(dt) {
    const p = this.scene.player;
    const moved = this.last ? p.x - this.last.x : 0;
    const moving = this.last && Math.hypot(moved, p.y - this.last.y) > 0.01;
    this.last = { x: p.x, y: p.y };
    if (moving && this.plants.size) {
      const { tx, ty } = worldToTile(p.x, p.y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const plant = this.plants.get(`${tx + dx},${ty + dy}`);
          if (!plant || (plant.t !== undefined && plant.t < AGAIN)) continue;
          const c = tileToWorld(tx + dx, ty + dy);
          if (Math.hypot(p.x - c.x, (p.y - c.y) * 2) > REACH) continue;
          plant.t = 0;
          plant.dir = moved < 0 ? -1 : 1; // in Laufrichtung anstoßen
          this.active.add(plant);
          this.onTouch?.(plant);
        }
      }
    }
    for (const plant of this.active) {
      plant.t += dt;
      if (plant.t >= DONE) {
        plant.img.setAngle(0);
        this.active.delete(plant);
        continue;
      }
      plant.img.setAngle(plant.deg * plant.dir * Math.sin(plant.t * SPEED) * Math.exp(-plant.t * DECAY));
    }
  }
}
