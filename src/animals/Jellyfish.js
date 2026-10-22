// Qualle (Riff, nur beim Quallen-Event): treibt langsam mit der Strömung und pulsiert – sie zieht sich zusammen und steigt
// dabei ein Stück auf, dann entspannt sie sich und sinkt langsam. Mit dem Quallenglas fängt man sie nur beim Sinken;
// erwischt man sie beim Aufsteigen, flutscht sie davon. Anfassen brennt (siehe stingPlayer in GardenScene).
// Selten treibt eine Goldqualle mit (Skin "jellyfish2"). Im dunklen Raum des Aquariums leuchten die Quallen im Becken.
import Phaser from 'phaser';
import ReefFish from './ReefFish.js';
import { tr } from '../i18n.js';

const RISE_TIME = 0.7; // Sekunden: zusammenziehen und aufsteigen
const SINK_TIME = [1.6, 2.4]; // ... entspannen und sinken (nur dann fangbar)
const RISE = 26; // so viele Pixel steigt sie pro Puls
const HEIGHT = [18, 80]; // so hoch schwebt sie über dem Boden
const TANK_HEIGHT = [20, 100];
const DRIFT = [5, 10]; // Strömung (Pixel pro Sekunde)
const SCALE = 0.45; // Bild 64 × 96
const SLIP = 40; // so weit flutscht sie davon
export const DARK_DEPTH = 99950; // Abdunklung des dunklen Raums im Aquarium; die Quallen dort leuchten darüber

// weicher Lichtschein (weiß, nach außen durchsichtig), wird je Qualle eingefärbt; einmal erzeugt
function glowTexture(scene) {
  const key = 'jelly_glow';
  if (scene.textures.exists(key)) return key;
  const size = 64;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}

export default class Jellyfish extends ReefFish {
  constructor(scene, x, y) {
    super(scene, x, y, 0, null, 'jellyfish');
    this.variant = undefined; // nur eine Art (die Goldqualle ist ein Skin)
    this.h = Phaser.Math.FloatBetween(...HEIGHT);
    this.pulse = Math.random() * 2; // Zeit im aktuellen Puls
    this.sinkTime = Phaser.Math.FloatBetween(...SINK_TIME);
    const a = Math.random() * Math.PI * 2;
    this.drift = { x: Math.cos(a), y: Math.sin(a) * 0.5, speed: Phaser.Math.FloatBetween(...DRIFT) };
    this.glow = scene.add.image(x, y, glowTexture(scene)).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
  }

  swimFrame() {
    const f = this.kind.swimFrames;
    return this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
  }

  swimScale() {
    return SCALE;
  }

  heights() {
    return this.inTank() ? TANK_HEIGHT : HEIGHT;
  }

  shouldFlee() {
    return false;
  }

  rising() {
    return this.pulse < RISE_TIME;
  }

  // nur beim Sinken (entspannt) kann man sie mit dem Glas fangen
  canBeCaughtNow() {
    return this.state === 'wild' && !this.rising();
  }

  // im Becken des dunklen Raums: leuchtet über der Abdunklung
  dark() {
    return this.inTank() && !!this.enclosure?.dark;
  }

  // Puls: aufsteigen, dann sinken; gibt die Höhenänderung für diesen Schritt zurück
  updatePulse(dt) {
    this.pulse += dt;
    if (this.pulse >= RISE_TIME + this.sinkTime) {
      this.pulse = 0;
      this.sinkTime = Phaser.Math.FloatBetween(...SINK_TIME);
    }
    return this.rising() ? (RISE / RISE_TIME) * dt : -(RISE / this.sinkTime) * dt;
  }

  updateFree(dt, player) {
    if (this.state === 'penned') {
      this.h = Phaser.Math.Clamp(this.h + this.updatePulse(dt), ...TANK_HEIGHT);
      return super.updateFree(dt, player);
    }
    if (this.state !== 'wild') return false;
    const [h0, h1] = HEIGHT;
    this.h = Phaser.Math.Clamp(this.h + this.updatePulse(dt), h0, h1);
    // mit der Strömung treiben; am Rand umdrehen
    const k = this.drift.speed * dt * (this.rising() ? 2 : 1); // beim Zusammenziehen ein kleiner Stoß nach vorn
    if (!this.move(this.drift.x * k, this.drift.y * k)) {
      this.drift.x = -this.drift.x;
      this.drift.y = -this.drift.y;
    }
    return true;
  }

  // vom Glas erwischt, während sie aufstieg: sie flutscht davon
  slip() {
    const p = this.scene.player;
    const a = Math.atan2(this.y - p.y, this.x - p.x);
    this.scene.tweens.add({ targets: this, x: this.x + Math.cos(a) * SLIP, y: this.y + Math.sin(a) * SLIP * 0.5, h: Math.min(HEIGHT[1], this.h + 20), duration: 500, ease: 'Quad.easeOut' });
    const t = this.scene.add.text(this.x, this.y - this.h - 30, tr('flutsch!', 'whoosh!'), { fontFamily: 'Trebuchet MS, Arial', fontSize: '12px', fontStyle: 'bold', color: '#ffffff', stroke: '#1f6fb0', strokeThickness: 3, resolution: 4 }).setOrigin(0.5).setDepth(100000);
    this.scene.tweens.add({ targets: t, y: t.y - 16, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  render(moving) {
    super.render(moving);
    if (this.sprite.texture.key === this.kind.bagTexture) {
      this.glow.setAlpha(0);
      return;
    }
    // pulsieren: beim Zusammenziehen schmaler und länger
    const s = this.swimScale() * this.babyScale();
    const squeeze = this.rising() ? Math.sin((this.pulse / RISE_TIME) * Math.PI) * 0.12 : 0;
    this.sprite.setScale(s * (1 - squeeze), s * (1 + squeeze));
    const dark = this.dark();
    if (dark) this.sprite.setDepth(DARK_DEPTH + 10 + this.y * 0.001);
    this.glow
      .setPosition(this.sprite.x, this.sprite.y - 10)
      .setTint(this.skin ? 0xffc840 : 0x7ac8ff)
      .setScale(0.9 + 0.1 * Math.sin(this.phase * 2))
      .setAlpha(dark ? 0.55 + 0.25 * Math.sin(this.phase * 2) : 0)
      .setDepth(DARK_DEPTH + 9);
  }

  destroy() {
    this.glow.destroy();
    super.destroy();
  }
}
