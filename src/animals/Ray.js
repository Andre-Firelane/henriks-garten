// Rochen (Riff): gleitet in großen Bögen über den Sand. Fangen geht nur durch Mitschwimmen: Wer neben ihm herschwimmt –
// nicht zu nah, nicht zu weit –, füllt über ihm eine Herzchen-Leiste. Zu nah: er erschrickt, schlägt einen schnellen
// Haken und die Leiste sinkt. Zu weit weg: sie leert sich langsam. Ist sie voll, vertraut er einem und schwimmt hinterher.
// Selten ist es ein Mantarochen (Skin "ray2"). Im Aquarium zieht er mit den Schildkröten in die riesige Beckenfront.
import Phaser from 'phaser';
import ReefFish from './ReefFish.js';

const GLIDE = 28; // so schnell gleitet er (der Taucher schwimmt 60)
const DART = 95; // ... und so schnell schießt er erschrocken davon
const DART_TIME = 0.9; // Sekunden
const TURN = [0.15, 0.45]; // Kurvenstärke (Bogenmaß pro Sekunde) – große Bögen
const TURN_TIME = [3, 7]; // so lange fliegt er eine Kurve, dann eine andere
const NEAR = 42; // näher darf man nicht kommen (Kachel-Proportionen, y doppelt)
const FAR = 120; // ... weiter weg zählt das Mitschwimmen nicht
const TRUST_TIME = 6; // so viele Sekunden muss man im richtigen Abstand mitschwimmen
const SCARE_LOSS = 0.3; // so viel der Leiste geht beim Erschrecken verloren
const FADE = 0.12; // so viel Leiste pro Sekunde, wenn man zu weit weg ist
const H = 12; // Höhe über dem Boden
const TANK_HEIGHT = [16, 70];
const SCALE = 0.68; // Bild 112 × 80; Rochen sind groß
const BAR_W = 34; // Herzchen-Leiste (Pixel)

export default class Ray extends ReefFish {
  constructor(scene, x, y) {
    super(scene, x, y, 0, null, 'ray');
    this.variant = undefined; // nur eine Art (der Mantarochen ist ein Skin)
    this.h = H;
    this.heading = Math.random() * Math.PI * 2;
    this.newCurve();
    this.trust = 0;
    this.dart = 0;
    this.bar = scene.add.graphics();
  }

  newCurve() {
    this.turn = Phaser.Math.FloatBetween(...TURN) * (Math.random() < 0.5 ? -1 : 1);
    this.curveTime = Phaser.Math.FloatBetween(...TURN_TIME);
  }

  swimFrame() {
    const f = this.kind.swimFrames;
    return this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
  }

  swimScale() {
    return SCALE;
  }

  heights() {
    return this.inTank() ? TANK_HEIGHT : [H, H];
  }

  shouldFlee() {
    return false;
  }

  // gefangen wird er nur durchs Mitschwimmen
  canBeCaughtNow() {
    return false;
  }

  canDespawn() {
    return this.state !== 'wild' || this.trust === 0;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    this.phase += dt;
    const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
    if (this.dart > 0) {
      this.dart -= dt;
    } else if (d < NEAR) {
      // erschrocken: schneller Haken weg vom Taucher
      this.dart = DART_TIME;
      this.heading = Math.atan2((this.y - player.y) * 2, this.x - player.x) + Phaser.Math.FloatBetween(-0.5, 0.5);
      this.trust = Math.max(0, this.trust - SCARE_LOSS);
    } else if (d < FAR) {
      this.trust = Math.min(1, this.trust + dt / TRUST_TIME);
      if (this.trust >= 1) {
        this.scene.rayTrusts?.(this);
        return false;
      }
    } else {
      this.trust = Math.max(0, this.trust - FADE * dt);
    }
    // große Bögen; am Rand umdrehen
    this.curveTime -= dt;
    if (this.curveTime <= 0) this.newCurve();
    this.heading += this.turn * dt;
    const speed = this.dart > 0 ? DART : GLIDE;
    const dx = Math.cos(this.heading) * speed * dt;
    const dy = Math.sin(this.heading) * speed * dt * 0.5;
    if (!this.move(dx, dy)) {
      this.heading += Math.PI * Phaser.Math.FloatBetween(0.7, 1.3);
      return false;
    }
    return true;
  }

  render(moving) {
    super.render(moving);
    // Flügelschlag: sanftes Auf und Ab der Flügel (Bild wird etwas flacher und wieder höher)
    if (this.sprite.texture.key !== this.kind.bagTexture) {
      const s = this.swimScale();
      this.sprite.setScale(s, s * (1 + Math.sin(this.phase * 3) * 0.08));
    }
    this.bar.clear();
    if (this.state !== 'wild' || this.trust <= 0) return;
    // Herzchen-Leiste über dem Rochen
    const x = this.sprite.x - BAR_W / 2;
    const y = this.sprite.y - 36;
    this.bar.setDepth(100000);
    this.bar.fillStyle(0x3c2814, 0.75).fillRoundedRect(x - 2, y - 2, BAR_W + 4, 8, 3);
    this.bar.fillStyle(0xff6fa8, 1).fillRoundedRect(x, y, Math.max(2, BAR_W * this.trust), 4, 2);
  }

  catch() {
    this.bar.clear();
    super.catch();
  }

  destroy() {
    this.bar.destroy();
    super.destroy();
  }
}
