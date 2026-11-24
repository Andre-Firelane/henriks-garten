// Fischeimer (docs/plan-angeln.md): Gefangene Angelfische laufen nicht hinterher, sie sitzen im Eimer, den Henrik an der Seite
// trägt. Aus dem Eimer schauen die Schwanzflossen heraus (eine je Fisch, höchstens SHOW, in den Farben der Arten). Ohne
// Fisch ist kein Eimer da. Gezeichnet (Platzhalter), kein Bild.
import { fishFrame } from './fishing.js';

const SHOW = 5; // so viele Fische schauen höchstens heraus (der Eimer hat keine Grenze)
const FISH_SCALE = 0.075; // Bild 192 × 128
const W = 13; // Eimer oben (Pixel)
const W_BOTTOM = 10;
const H = 11;

export default class FishBucket {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.box = scene.add.container(0, 0).setVisible(false);
    this.fish = scene.add.container(0, 0);
    this.body = scene.add.graphics();
    this.drawBucket();
    this.box.add([this.fish, this.body]);
    this.key = '';
  }

  drawBucket() {
    const g = this.body;
    const top = -H;
    g.clear();
    // Henkel
    g.lineStyle(1.2, 0x5b6670, 1).beginPath().arc(0, top + 1, W / 2 + 0.5, Math.PI, 0, false).strokePath();
    // Eimer: nach unten etwas schmaler, Blech mit hellem Streifen und dunklem Rand
    g.fillStyle(0x9aa8b3, 1).fillPoints([{ x: -W / 2, y: top }, { x: W / 2, y: top }, { x: W_BOTTOM / 2, y: 0 }, { x: -W_BOTTOM / 2, y: 0 }], true);
    g.fillStyle(0xc9d4dc, 1).fillRect(-W / 2 + 2.5, top + 1.5, 2, H - 3);
    g.lineStyle(1, 0x3f4a52, 1).strokePoints([{ x: -W / 2, y: top }, { x: W / 2, y: top }, { x: W_BOTTOM / 2, y: 0 }, { x: -W_BOTTOM / 2, y: 0 }], true);
    g.fillStyle(0x6f7d88, 1).fillRect(-W / 2, top, W, 1.6); // Rand oben
    g.fillStyle(0x3a6f8f, 1).fillRect(-W / 2 + 1, top + 1.6, W - 2, 1.2); // Wasser
  }

  // Fische im Eimer: kopfüber, nur die Schwanzflosse schaut über den Rand
  drawFish(list) {
    this.fish.removeAll(true);
    list.slice(0, SHOW).forEach((a, i) => {
      const x = (i - (Math.min(list.length, SHOW) - 1) / 2) * 2.6;
      const img = this.scene.add.image(x, -H + 2, 'freshfish', fishFrame(a.skin) * 2).setScale(FISH_SCALE).setAngle(i % 2 ? 98 : 82).setOrigin(0.82, 0.5);
      this.fish.add(img);
    });
  }

  update() {
    const p = this.player;
    const list = this.scene.followers.filter((a) => a.inBucket?.());
    const key = list.map((a) => a.skin).join(',');
    if (key !== this.key) {
      this.key = key;
      this.drawFish(list);
    }
    // im Kanu liegen die Fische mit im Boot
    const show = list.length > 0 && !p.boat;
    this.box.setVisible(show);
    if (!show) return;
    // an der Seite, die vom Blick weg zeigt (in der Hand auf der anderen Seite ist das Werkzeug)
    const side = -(p.faceX || 1);
    this.box.setPosition(p.x + side * 9, p.sprite.y - 6 - (p.handLift ?? 0));
    this.box.setDepth(p.y + (p.faceY > 0 ? 0.25 : -0.25));
  }

  destroy() {
    this.box.destroy();
  }
}
