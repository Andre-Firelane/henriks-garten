// Der Kescher: der Spieler trägt ihn sichtbar und kann ihn nach vorne schwingen.
// Ein Schwung fängt Tiere in einem größeren Bereich direkt vor dem Spieler (nur Arten mit 'net' in catchWith).
import ZoneTool from './ZoneTool.js';

const REST_ANGLE = -15; // Haltung beim Tragen (über der Schulter)
const SWING_ANGLE = 95; // so weit schwingt er nach vorne

export default class Net extends ZoneTool {
  // id/texture/origin: für Werkzeuge, die genauso geschwungen werden (Quallenglas)
  constructor(scene, player, { id = 'net', texture = 'net', origin = [6 / 64, 58 / 64] } = {}) {
    super(scene, player, { id, reach: 42, radius: 36, duration: 0.35, catchFrom: 0, catchTo: 0.7 });
    this.sprite = scene.add.image(0, 0, texture).setOrigin(...origin);
  }

  use() {
    if (super.use()) this.showSwoosh();
  }

  draw() {
    const p = this.player;
    let angle = REST_ANGLE;
    if (this.active) {
      const t = this.progress;
      // schnell nach vorne, etwas langsamer zurück
      const out = t < 0.4 ? Math.sin((t / 0.4) * (Math.PI / 2)) : Math.cos(((t - 0.4) / 0.6) * (Math.PI / 2));
      angle = REST_ANGLE + SWING_ANGLE * out;
    }

    // Negative Skalierung spiegelt um den Griff, so zeigt der Kescher immer in Blickrichtung
    const h = this.hand();
    this.sprite.setPosition(h.x, h.y);
    this.sprite.setScale(0.5 * p.faceX, 0.5);
    this.sprite.setAngle(angle * p.faceX);
    // Von vorne gesehen vor dem Körper, von hinten gesehen dahinter
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.2 : -0.2));
  }

  destroy() {
    this.sprite.destroy();
  }

  showSwoosh() {
    const c = this.zone;
    const swoosh = this.scene.add
      .ellipse(c.x, c.y, this.radius * 2, this.radius, 0xffffff, 0.25)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setDepth(c.y);
    this.scene.tweens.add({
      targets: swoosh,
      alpha: 0,
      scale: 1.25,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => swoosh.destroy(),
    });
  }
}
