// Meeresschildkröte (Riff, selten): hat sich in einem alten Fischernetz verheddert. Sie zappelt an Ort und Stelle,
// Bläschen steigen auf. Schwimmt man mit der Schere hin und drückt dreimal die Aktionstaste, ist das Netz durchgeschnitten – dann ist
// sie frei und schwimmt dankbar hinter Henrik her (an Land im Beutel). Im Aquarium zieht sie in die riesige Beckenfront.
// Bild im Netz: "turtle_net" (gleiches Format wie "turtle"); solange es das noch nicht gibt, wird ein Netz darübergezeichnet.
import Phaser from 'phaser';
import ReefFish from './ReefFish.js';

export const CUTS_NEEDED = 3; // so oft muss man schneiden
export const CUT_DIST = 60; // so nah muss man an der Schildkröte sein
const NET_H = 16; // im Netz schwebt sie knapp über dem Boden
const TANK_HEIGHT = [24, 90]; // im Becken schwimmt sie in allen Höhen
const SCALE = 0.5; // Bild 112 × 88
const TANK_SCALE = 0.65; // in der riesigen Beckenfront etwas größer
const STRUGGLE = 5; // so weit (Grad) zappelt sie im Netz
const BUBBLES = [0.4, 1]; // Sekunden zwischen zwei Bläschen, solange sie gefangen ist

export default class Turtle extends ReefFish {
  constructor(scene, x, y) {
    super(scene, x, y, 0, null, 'turtle');
    this.variant = undefined; // nur eine Art
    this.cuts = 0;
    this.h = NET_H;
    this.bubbleIn = Phaser.Math.FloatBetween(...BUBBLES);
    this.faceX = Math.random() < 0.5 ? -1 : 1;
    this.net = scene.add.graphics(); // Netz zum Platzhalter-Bild (ohne eigenes Bild "turtle_net")
  }

  netted() {
    return this.state === 'wild';
  }

  swimFrame() {
    const f = this.kind.swimFrames;
    return this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
  }

  swimScale(tank) {
    return tank ? TANK_SCALE : SCALE;
  }

  heights() {
    return this.inTank() ? TANK_HEIGHT : [NET_H, NET_H];
  }

  shouldFlee() {
    return false;
  }

  // gefangen wird sie nur durchs Freischneiden (nicht mit dem Kescher)
  canBeCaughtNow() {
    return false;
  }

  canDespawn() {
    return this.state !== 'wild' || this.cuts === 0;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    this.phase += dt;
    this.bubbleIn -= dt;
    if (this.bubbleIn <= 0) {
      this.bubbleIn = Phaser.Math.FloatBetween(...BUBBLES);
      this.bubble();
    }
    return false; // im Netz bewegt sie sich nicht vom Fleck
  }

  bubble() {
    const x = this.x + this.faceX * 14 + Phaser.Math.Between(-4, 4);
    const y = this.y - this.h - 6;
    const b = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(2, 3.5), 0xeaf8ff, 0.9).setStrokeStyle(1.5, 0x1f6fb0).setDepth(this.y + 40);
    this.scene.tweens.add({ targets: b, y: y - Phaser.Math.Between(40, 70), x: x + Phaser.Math.Between(-6, 6), alpha: 0, duration: Phaser.Math.Between(1100, 1600), ease: 'Sine.easeOut', onComplete: () => b.destroy() });
  }

  // einmal schneiden: ein Stück Netz treibt davon; beim dritten Mal ist sie frei. Gibt zurück, ob sie jetzt frei ist
  cut() {
    if (!this.netted()) return false;
    this.cuts += 1;
    const x = this.x;
    const y = this.y - this.h;
    const piece = this.scene.add.graphics().setDepth(this.y + 30).setPosition(x, y);
    piece.lineStyle(1.5, 0xd8cfa8, 0.9);
    for (let i = -1; i <= 1; i++) piece.lineBetween(-8, i * 5, 8, i * 5 + 4).lineBetween(i * 5, -8, i * 5 + 4, 8);
    this.scene.tweens.add({ targets: piece, x: x + Phaser.Math.Between(-30, 30), y: y - Phaser.Math.Between(30, 50), angle: Phaser.Math.Between(-90, 90), alpha: 0, duration: 1400, onComplete: () => piece.destroy() });
    const snip = this.scene.add.text(x, y - 26, '✂️', { fontSize: '18px', resolution: 4 }).setOrigin(0.5).setDepth(100000);
    this.scene.tweens.add({ targets: snip, y: snip.y - 14, alpha: 0, duration: 700, onComplete: () => snip.destroy() });
    this.sprite.setAngle(this.faceX * STRUGGLE * 2); // zuckt kurz
    return this.cuts >= CUTS_NEEDED;
  }

  restore(state) {
    super.restore(state);
    this.h = state === 'penned' ? Phaser.Math.FloatBetween(...TANK_HEIGHT) : NET_H;
  }

  enterPen() {
    super.enterPen();
    this.h = Phaser.Math.FloatBetween(...TANK_HEIGHT);
  }

  render(moving) {
    const own = this.netted() && this.scene.textures.exists('turtle_net');
    super.render(moving);
    this.net.clear();
    if (!this.netted()) return;
    if (own && this.sprite.texture.key !== 'turtle_net') this.sprite.setTexture('turtle_net', this.swimFrame());
    // zappeln
    this.sprite.setAngle(Math.sin(this.phase * 9) * STRUGGLE);
    if (own) return;
    // Platzhalter: helles Netz über der Schildkröte, mit jedem Schnitt etwas weniger davon
    const { x, y } = this.sprite;
    const left = CUTS_NEEDED - this.cuts;
    this.net.setDepth(this.sprite.depth + 0.1).lineStyle(1.5, 0xd8cfa8, 0.9);
    for (let i = -3; i <= 3; i++) {
      if ((i + 3) % CUTS_NEEDED >= left) continue;
      this.net.lineBetween(x - 26, y + i * 6 - 8, x + 26, y + i * 6 + 8);
      this.net.lineBetween(x + i * 8 - 6, y - 22, x + i * 8 + 6, y + 22);
    }
  }

  catch() {
    this.net.clear();
    this.sprite.setAngle(0);
    if (this.sprite.texture.key === 'turtle_net') this.sprite.setTexture(this.kind.texture);
    super.catch();
  }

  destroy() {
    this.net.destroy();
    super.destroy();
  }
}
