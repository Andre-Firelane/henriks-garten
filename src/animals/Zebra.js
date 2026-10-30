// Zebra (Savanne): lebt in Herden wie die Antilope, ist aber etwas weniger scheu.
// Ab und zu zieht die ganze Herde zu einem Wasserloch und trinkt dort mit gesenktem Kopf.
// Beim Trinken flieht es nicht und lässt sich sogar durch Berühren fangen; sonst geht es nur mit dem Lasso.
// Im Gehege geht jedes Zebra für sich ab und zu an das Wasserloch dort.
import Phaser from 'phaser';
import Antelope from './Antelope.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { SHORE_TILES, PEN_SHORE_TILES } from '../world/map.js';

const DRINK_EVERY = [25, 45]; // Sekunden zwischen zwei Gängen zum Wasserloch
const DRINK_TIME = [6, 10]; // so lange trinkt die Herde, sobald das erste Zebra am Wasser ist
const WALK_TIMEOUT = 30; // wer bis dahin nicht am Wasser ist, gibt auf
const WALK_SPEED = 1.5; // zum Wasser etwas zügiger als beim Grasen
const SPOTS = 8; // Uferplätze rund um die gewählte Stelle
const PEN_DRINK_EVERY = [15, 30]; // im Gehege: Sekunden zwischen zwei Gängen zum Wasserloch
const PEN_CLOSE = 28; // so nah am Uferplatz darf es auch hängen bleiben und trotzdem trinken ...
const PEN_WATER_REACH = 46; // ... aber nur, wenn das Wasser so nah ist (Abstand zur Mitte der Wasserkachel, etwa eine Kachel)
const PEN_GIVE_UP = 2; // so lange hängt es fest, ohne trinken zu können, dann versucht es es später an anderer Stelle
// Maul beim Trinken (gesenkter Kopf), von den Füßen aus gemessen, beim Blick nach rechts (zebra_drinking, halbe Größe)
const DRINK_MOUTH = { front: [10.7, -2.7], back: [11.5, -8.2] };
const DRINK_REACH = 0.55; // dorthin soll das Maul: Anteil des Wegs vom Zebra zur Mitte der Wasserkachel
const DRINK_LEAN_MAX = 20; // höchstens so weit rückt das Bild zum Wasser

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
    // nach einem Fang aus der Herde: Trinken abbrechen und davonrennen
    const scattering = this.state === 'wild' ? this.updateScatter(dt, player) : null;
    if (scattering !== null) {
      this.drinking = false;
      return scattering;
    }
    if (this.state === 'penned') return this.updatePenDrink(dt, player);
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

  // Im Gehege: allein zu einem freien Uferplatz am Wasserloch im eigenen Gehege gehen und dort trinken
  updatePenDrink(dt, player) {
    const now = this.now();
    if (this.penDrinkAt === undefined) this.penDrinkAt = now + Phaser.Math.FloatBetween(3, PEN_DRINK_EVERY[1]);
    if (!this.penDrink && now >= this.penDrinkAt) this.startPenDrink(now);
    const t = this.penDrink;
    if (!t) return super.updateFree(dt, player);
    if (now >= t.endAt) {
      this.penDrink = null;
      this.drinking = false;
      this.penDrinkAt = now + Phaser.Math.FloatBetween(...PEN_DRINK_EVERY);
      return super.updateFree(dt, player);
    }
    if (this.drinking) return false;
    if (t.stuck > PEN_GIVE_UP) {
      this.penDrink = null;
      this.penDrinkAt = now + Phaser.Math.FloatBetween(...PEN_DRINK_EVERY);
      return super.updateFree(dt, player);
    }
    const dx = t.spot.x - this.x;
    const dy = t.spot.y - this.y;
    const d = Math.hypot(dx, dy);
    // angekommen – oder kurz vor dem Ufer hängen geblieben: dann trinkt es eben von dort, aber nur mit dem Wasser
    // in Reichweite (sonst trinkt es im Sand); hängt es weiter weg fest, gibt es auf
    const nearWater = Math.hypot(t.spot.wx - this.x, (t.spot.wy - this.y) * 2) < PEN_WATER_REACH;
    if (d < 3 || (t.stuck > 0.5 && d < PEN_CLOSE && nearWater)) {
      this.drinking = true;
      this.faceX = Math.sign(t.spot.wx - this.x) || this.faceX;
      this.faceY = Math.sign(t.spot.wy - this.y) || this.faceY;
      t.endAt = now + Phaser.Math.FloatBetween(...DRINK_TIME);
      return false;
    }
    const step = Math.min(d, this.kind.speed * dt);
    const angle = Math.atan2(dy, dx);
    const x0 = this.x;
    const y0 = this.y;
    let moved = false;
    for (const turn of [0, 0.5, -0.5, 1, -1]) {
      if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) {
        moved = true;
        break;
      }
    }
    // kaum vorangekommen (z. B. am Ufer entlanggerutscht)?
    t.stuck = Math.hypot(this.x - x0, this.y - y0) < step * 0.3 ? (t.stuck ?? 0) + dt : 0;
    return moved;
  }

  startPenDrink(now) {
    const a = this.enclosure?.area;
    // Uferplätze in diesem Gehege, die gerade kein anderes Zebra belegt
    const taken = this.allAnimals.filter((z) => z !== this && z.penDrink).map((z) => z.penDrink.tile);
    const tiles = a
      ? PEN_SHORE_TILES.filter((s) => this.enclosure.tileSet.has(s.tx + ',' + s.ty) && !taken.includes(s))
      : [];
    if (!tiles.length) {
      this.penDrinkAt = now + Phaser.Math.FloatBetween(...PEN_DRINK_EVERY);
      return;
    }
    // einer der nächsten Uferplätze, damit der Weg frei ist
    const { tx, ty } = worldToTile(this.x, this.y);
    tiles.sort((p, q) => Math.hypot(p.tx - tx, p.ty - ty) - Math.hypot(q.tx - tx, q.ty - ty));
    const tile = Phaser.Utils.Array.GetRandom(tiles.slice(0, 3));
    const p = tileToWorld(tile.tx, tile.ty);
    const w = tileToWorld(tile.water.tx, tile.water.ty);
    const spot = { x: p.x + (w.x - p.x) * 0.15, y: p.y + (w.y - p.y) * 0.15, wx: w.x, wy: w.y };
    this.penDrink = { tile, spot, endAt: now + WALK_TIMEOUT };
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

  startFeed() {
    this.penDrink = null;
    this.drinking = false;
  }

  catch() {
    this.penDrink = null;
    this.drinking = false;
    this.drinkSpot = null;
    super.catch();
  }

  // Beim Trinken das Bild mit gesenktem Kopf
  // beim Fressen am Futter mit gesenktem Kopf wie beim Trinken
  setEating(on) {
    this.eatingLook = on;
  }

  // Beim Trinken ein Stück zum Wasser rücken (nur das Bild, der Platz bleibt auf dem Ufer), damit das Maul im Wasser ist:
  // das Maul soll knapp hinter der Uferkante liegen (DRINK_REACH des Wegs zur Mitte der Wasserkachel)
  leanToWater() {
    const spot = this.drinkSpot ?? this.penDrink?.spot;
    if (!spot) return; // z. B. am Futter
    const k = this.sprite.scaleX / 0.5; // Tierbabys sind kleiner
    const [mx, my] = this.faceY > 0 ? DRINK_MOUTH.front : DRINK_MOUTH.back;
    let lx = (spot.wx - this.x) * DRINK_REACH - mx * k * (this.faceX < 0 ? -1 : 1);
    let ly = (spot.wy - this.y) * DRINK_REACH - my * k;
    const len = Math.hypot(lx, ly);
    if (len > DRINK_LEAN_MAX) {
      lx *= DRINK_LEAN_MAX / len;
      ly *= DRINK_LEAN_MAX / len;
    }
    this.sprite.x += lx;
    this.sprite.y += ly;
    this.shadow.x += lx;
    this.shadow.y += ly;
  }

  render(moving) {
    const down = (this.drinking && (this.state === 'wild' || this.state === 'penned')) || this.eatingLook;
    // Trinken als Animation (zebra_drinking, mit Skin zebra2_drinking; nach links gespiegelt)
    const drinkAnim = `${this.skin ?? 'zebra'}_drinking${this.faceY > 0 ? '' : '_back'}`;
    if (down && this.scene.anims.exists(drinkAnim)) {
      if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== drinkAnim) {
        this.sprite.play(drinkAnim); // beugt sich hinunter, trinkt, richtet sich auf (und wieder von vorn)
      }
      this.sprite.anims.timeScale = 1;
      this.sprite.setFlipX(this.faceX < 0);
      this.placeSprite(false);
      this.leanToWater();
      return;
    }
    if (this.sprite.texture.key.includes('_drinking')) this.sprite.stop().setFlipX(false).setTexture(this.baseTexture(), 0);
    const key = down ? `${this.skin ?? 'zebra'}_drink` : this.baseTexture(); // mit Skin: zebra2, zebra2_drink
    const onAnim = Object.values(this.animSet() ?? {}).includes(this.sprite.texture.key); // Animation setzt ihr Bild selbst
    if (this.sprite.texture.key !== key && (down || !onAnim)) {
      if (onAnim) this.sprite.stop().setFlipX(false);
      this.sprite.setTexture(key, onAnim ? 0 : this.sprite.frame.name);
    }
    super.render(moving);
  }
}
