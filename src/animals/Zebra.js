// Zebra (Savanne): lebt in Herden wie die Antilope, ist aber etwas weniger scheu.
// Ab und zu zieht die ganze Herde zu einem Wasserloch und trinkt dort mit gesenktem Kopf.
// Beim Trinken flieht es nicht und lässt sich sogar durch Berühren fangen; sonst geht es nur mit dem Lasso.
import Phaser from 'phaser';
import Antelope from './Antelope.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { SHORE_TILES } from '../world/map.js';

const DRINK_EVERY = [25, 45]; // Sekunden zwischen zwei Gängen zum Wasserloch
const DRINK_TIME = [6, 10]; // so lange trinkt die Herde, sobald das erste Zebra am Wasser ist
const WALK_TIMEOUT = 30; // wer bis dahin nicht am Wasser ist, gibt auf
const WALK_SPEED = 1.5; // zum Wasser etwas zügiger als beim Grasen
const SPOTS = 8; // Uferplätze rund um die gewählte Stelle

export default class Zebra extends Antelope {
  constructor(scene, x, y, allAnimals) {
    super(scene, x, y, allAnimals, 'zebra');
    // die Herde merkt sich, wann sie das nächste Mal trinken geht
    if (this.herd.nextDrink === undefined) this.herd.nextDrink = this.now() + Phaser.Math.FloatBetween(8, DRINK_EVERY[1]);
    this.drinking = false;
    this.drinkSpot = null;
  }

  // Beim Trinken auch durch Berühren fangbar
  canBeCaughtWith(tool) {
    if (tool === 'touch') return this.state === 'wild' && this.drinking;
    return super.canBeCaughtWith(tool);
  }

  // Beim Trinken flieht es nicht, auch wenn die Herde gewarnt wurde
  shouldFlee(player) {
    if (this.drinking) {
      this.fleeing = false;
      return false;
    }
    return super.shouldFlee(player);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') {
      this.drinking = false;
      return super.updateFree(dt, player);
    }
    const h = this.herd;
    const now = this.now();
    if (!h.drink && now >= h.nextDrink && now >= h.alarm && SHORE_TILES.length) this.startDrinkTrip(now);
    if (h.drink && now >= h.drink.endAt) this.endDrink(now);
    if (!h.drink) {
      this.drinking = false;
      this.drinkSpot = null;
      return super.updateFree(dt, player);
    }
    if (this.drinking) return false;

    // auf dem Weg zum Wasser: wer den Spieler bemerkt, flieht (kommt danach aber wieder)
    if (super.shouldFlee(player)) return this.flee(dt, player);
    const spot = this.claimSpot();
    if (!spot) return super.updateFree(dt, player); // kein Platz mehr frei: einfach in der Nähe grasen
    const dx = spot.x - this.x;
    const dy = spot.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) {
      this.drinking = true;
      // zum Wasser schauen
      this.faceX = Math.sign(spot.wx - this.x) || this.faceX;
      this.faceY = Math.sign(spot.wy - this.y) || this.faceY;
      // das erste Zebra am Wasser legt fest, wie lange die Herde trinkt
      if (!h.drink.started) {
        h.drink.started = true;
        h.drink.endAt = now + Phaser.Math.FloatBetween(...DRINK_TIME);
      }
      return false;
    }
    const step = Math.min(d, this.kind.speed * WALK_SPEED * dt);
    const angle = Math.atan2(dy, dx);
    for (const turn of [0, 0.5, -0.5, 1, -1]) {
      if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) return true;
    }
    return false;
  }

  // Die Herde geht zum nächstgelegenen Wasserloch; jedes Zebra bekommt dort einen eigenen Platz am Ufer
  startDrinkTrip(now) {
    const { tx: hx, ty: hy } = worldToTile(this.x, this.y);
    const nearest = [...SHORE_TILES].sort((p, q) => Math.hypot(p.tx - hx, p.ty - hy) - Math.hypot(q.tx - hx, q.ty - hy));
    const target = Phaser.Utils.Array.GetRandom(nearest.slice(0, 4)); // etwas Abwechslung am selben Wasserloch
    const spots = SHORE_TILES.map((s) => ({ s, d: Math.hypot(s.tx - target.tx, s.ty - target.ty) }))
      .filter(({ d }) => d <= 4)
      .sort((a, b) => a.d - b.d)
      .slice(0, SPOTS)
      .map(({ s }) => {
        const p = tileToWorld(s.tx, s.ty);
        const w = tileToWorld(s.water.tx, s.water.ty);
        // ein Stück zum Wasser hin, aber noch auf dem Ufer
        return { x: p.x + (w.x - p.x) * 0.15, y: p.y + (w.y - p.y) * 0.15, wx: w.x, wy: w.y };
      });
    this.herd.drink = { spots, started: false, endAt: now + WALK_TIMEOUT };
  }

  claimSpot() {
    if (this.drinkSpot) return this.drinkSpot;
    const taken = this.herdMates().map((a) => a.drinkSpot);
    this.drinkSpot = this.herd.drink.spots.find((s) => !taken.includes(s)) ?? null;
    return this.drinkSpot;
  }

  endDrink(now) {
    const h = this.herd;
    h.drink = null;
    h.nextDrink = now + Phaser.Math.FloatBetween(...DRINK_EVERY);
    h.until = 0; // gleich neu entscheiden, wohin es geht
    this.drinking = false;
    this.drinkSpot = null;
  }

  catch() {
    this.drinking = false;
    this.drinkSpot = null;
    super.catch();
  }

  // Beim Trinken das Bild mit gesenktem Kopf
  render(moving) {
    const key = this.drinking && this.state === 'wild' ? 'zebra_drink' : this.kind.texture;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key, this.sprite.frame.name);
    super.render(moving);
  }
}
