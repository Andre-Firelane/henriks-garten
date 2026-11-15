// Riesenrad im Tierpark (gebaut auf dem großen Bauplatz, siehe wheelSlot in levels.js und src/world/shops.js):
// das Rad dreht sich langsam, die Gondeln hängen immer gerade. Unten steigen wartende Besucher ein (ihre Figur verschwindet,
// in der Gondel sitzt ihr Oberkörper: visitorN_sit), nach einer ganzen Runde steigen sie dort wieder aus.
import { tileToWorld } from './iso.js';

const SCALE = 0.5; // die Bilder sind doppelt so groß gezeichnet
const HUB_UP = 130; // so hoch über dem Boden sitzt die Nabe (Welt-Pixel)
const RADIUS = 68; // Abstand der Gondel-Aufhänger von der Nabe
const GONDOLAS = 8;
const ROUND = 32; // Sekunden für eine Umdrehung
const COLORS = [0xff8a80, 0xffe082, 0x80d8ff, 0xb9f6ca, 0xea80fc, 0xffcc80, 0x8c9eff, 0xf48fb1];
const SEAT_UP = 53; // Oberkörper in der Gondel: so tief unter dem Aufhänger sitzt der Bildmittelpunkt (vor dem Skalieren): Kopf oben im Fenster (29 … 59 px)

export default class FerrisWheel {
  constructor(scene, slot) {
    this.scene = scene;
    const p = tileToWorld(slot.tx + 0.5, slot.ty + 0.5); // Mitte der 2×2 Kacheln
    this.x = p.x;
    this.y = p.y;
    this.hub = { x: p.x, y: p.y - HUB_UP };
    this.angle = 0;
    const d = p.y; // Tiefe: alles gehört zum selben Bauwerk an diesem Punkt
    this.wheel = scene.add.image(this.hub.x, this.hub.y, 'wheel_ring').setScale(SCALE).setDepth(d - 2);
    this.stand = scene.add.image(p.x, p.y + 6, 'wheel_stand').setOrigin(0.5, 1).setScale(SCALE).setDepth(d - 1);
    this.gondolas = [...Array(GONDOLAS).keys()].map((i) => ({
      i,
      img: scene.add.image(0, 0, 'wheel_gondola').setOrigin(0.5, 0).setScale(SCALE).setTint(COLORS[i % COLORS.length]).setDepth(d + 1),
      seat: null,
      rider: null,
      prev: null,
    }));
    this.place();
  }

  // Winkel einer Gondel (0 = rechts, π/2 = ganz unten)
  gondolaAngle(g) {
    return this.angle + (g.i / GONDOLAS) * Math.PI * 2;
  }

  place() {
    this.wheel.setRotation(this.angle);
    for (const g of this.gondolas) {
      const a = this.gondolaAngle(g);
      const x = this.hub.x + Math.cos(a) * RADIUS;
      const y = this.hub.y + Math.sin(a) * RADIUS;
      g.img.setPosition(x, y);
      g.seat?.setPosition(x, y + SEAT_UP * SCALE);
    }
  }

  update(dt) {
    this.angle = (this.angle + (dt / ROUND) * Math.PI * 2) % (Math.PI * 2);
    this.place();
    for (const g of this.gondolas) {
      // Abstand zur untersten Stellung (0 … 2π); springt er zurück, ist die Gondel gerade unten vorbeigekommen
      const phi = (((this.gondolaAngle(g) - Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const passed = g.prev !== null && phi < g.prev;
      g.prev = phi;
      if (!passed) continue;
      if (g.rider) this.unload(g);
      const next = this.scene.visitors?.nextRider();
      if (next) this.load(g, next);
    }
  }

  load(g, v) {
    g.rider = v;
    v.boardWheel(this);
    g.seat = this.scene.add.image(g.img.x, g.img.y + SEAT_UP * SCALE, `visitor${v.look}_sit`).setScale(SCALE).setDepth(g.img.depth - 0.1);
  }

  unload(g) {
    const v = g.rider;
    g.rider = null;
    g.seat?.destroy();
    g.seat = null;
    if (v && !v.gone) v.leaveWheel(this);
  }

  // Punkt unter der untersten Gondel (dort steigen sie aus)
  get exitPoint() {
    return { x: this.x, y: this.y + 4 };
  }

  // Besucher geht (Abschnitt wird verlassen): Gondel wieder frei
  drop(v) {
    for (const g of this.gondolas) if (g.rider === v) {
      g.rider = null;
      g.seat?.destroy();
      g.seat = null;
    }
  }
}
