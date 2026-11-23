// Rentier (Eiswelt): wilde Herde wie die Antilopen (scheu, Lasso; bemerkt eines Henrik, flieht die ganze Herde, wird
// eines gefangen, rennen die anderen davon), aber die Herde bleibt nicht lange an einem Ort: alle TREK_EVERY Sekunden
// zieht sie gemeinsam an einen anderen Platz, oft quer durch die Tundra – nachts auch übers Eis. Keine Glocken: es sind
// wilde Tiere.
import Phaser from 'phaser';
import Antelope from './Antelope.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { MAP_W, MAP_H, isBlocked, inPen } from '../world/map.js';

const TREK_EVERY = [25, 45]; // so oft (Sekunden) zieht die Herde weiter ...
const TREK_DIST = [10, 20]; // ... so weit (Kacheln) ...
const TREK_SPREAD = 0.35; // ... (jedes Tier weicht etwas von der Richtung ab) ...
const TREK_ARRIVED = 50; // ... bis die Mitte der Herde so nah am Ziel ist (Kachel-Proportionen, y doppelt)
const TREK_MAX = 40; // spätestens nach so vielen Sekunden ist sie angekommen (falls etwas im Weg ist)

export default class Reindeer extends Antelope {
  constructor(scene, x, y, allAnimals) {
    super(scene, x, y, allAnimals, 'reindeer');
    this.herd.nextTrek ??= this.now() + Phaser.Math.FloatBetween(...TREK_EVERY);
  }

  // neues Ziel für die Herde: freie Kachel in passender Entfernung (Tundra bevorzugt)
  trekTarget(cx, cy) {
    const tundra = this.scene.groundTiles?.('tundra') ?? [];
    const here = worldToTile(cx, cy);
    const ok = (tx, ty) => !isBlocked(tx, ty) && !inPen(tx, ty);
    const pick = (list) => {
      const far = list.filter(({ tx, ty }) => {
        const d = Math.hypot(tx - here.tx, ty - here.ty);
        return ok(tx, ty) && d >= TREK_DIST[0] && d <= TREK_DIST[1];
      });
      return Phaser.Utils.Array.GetRandom(far);
    };
    let t = pick(tundra);
    if (!t) {
      const all = [];
      for (let i = 0; i < 400; i++) all.push({ tx: Phaser.Math.Between(2, MAP_W - 3), ty: Phaser.Math.Between(2, MAP_H - 3) });
      t = pick(all);
    }
    return t ? tileToWorld(t.tx, t.ty) : null;
  }

  pickWander() {
    if (!this.herd || this.state !== 'wild') return super.pickWander();
    const h = this.herd;
    const now = this.now();
    const all = [this, ...this.herdMates()];
    const cx = all.reduce((s, a) => s + a.x, 0) / all.length;
    const cy = all.reduce((s, a) => s + a.y, 0) / all.length;
    // Zeit zum Weiterziehen: die Herde bekommt ein gemeinsames Ziel
    if (!h.trek && now >= h.nextTrek) {
      const to = this.trekTarget(cx, cy);
      if (to) h.trek = { ...to, until: now + TREK_MAX };
      h.nextTrek = now + Phaser.Math.FloatBetween(...TREK_EVERY);
    }
    if (h.trek && (now >= h.trek.until || Math.hypot(h.trek.x - cx, (h.trek.y - cy) * 2) < TREK_ARRIVED)) h.trek = null;
    if (!h.trek) return super.pickWander();
    // unterwegs: alle in Richtung Ziel, etwas aufgefächert
    const angle = Math.atan2(h.trek.y - this.y, h.trek.x - this.x) + Phaser.Math.FloatBetween(-TREK_SPREAD, TREK_SPREAD);
    this.dirX = Math.cos(angle);
    this.dirY = Math.sin(angle);
    this.wanderTime = Phaser.Math.FloatBetween(0.6, 1.2);
  }
}
