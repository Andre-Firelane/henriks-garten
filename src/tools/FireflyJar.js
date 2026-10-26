// Glühwürmchen-Abend im Bambuswald (siehe world/Fireflies.js):
// - FireflyJar: das leere Glas wird geschwungen wie der Kescher und fängt die Glühwürmchen in der Fangzone; mit jedem
//   leuchtet es heller. Mit JAR_FULL im Glas macht die Szene daraus das leuchtende Glas (siehe addJarFlies).
// - GlowJar: das leuchtende Glas in der Hand; mit der Aktionstaste stellt man es vor sich ab (die Szene legt es hin,
//   siehe placeGlowJar). Vor einem Kirschbaum lockt es den roten Panda herunter (siehe RedPanda.js).
import Phaser from 'phaser';
import Net from './Net.js';
import { glowTexture } from '../world/Fireflies.js';
import { NIGHT_DEPTH } from '../animals/Wolf.js';

export const JAR_FULL = 3; // so viele Glühwürmchen braucht das Glas, dann leuchtet es

export default class FireflyJar extends Net {
  constructor(scene, player) {
    super(scene, player, { id: 'fireflyjar', texture: 'jar', origin: [32 / 64, 58 / 64] });
    this.glow = scene.add.image(0, 0, glowTexture(scene)).setBlendMode(Phaser.BlendModes.ADD).setTint(0xd8ff70).setScale(0.5);
  }

  // statt Tieren: die Glühwürmchen in der Fangzone
  caughtBy() {
    const ev = this.scene.fireflies;
    if (!ev || !this.active || this.progress < this.catchFrom || this.progress > this.catchTo) return [];
    const n = ev.catchWhere((f) => this.zoneDistance(f) < this.radius);
    if (n) this.scene.addJarFlies(n);
    return [];
  }

  draw() {
    super.draw();
    const n = this.scene.jarFlies ?? 0;
    this.glow.setPosition(this.sprite.x, this.sprite.y - 12).setDepth(NIGHT_DEPTH + 2) // leuchtet über der Dämmerung
      .setAlpha(n ? 0.25 + (n / JAR_FULL) * 0.5 : 0).setVisible(this.sprite.visible);
  }

  destroy() {
    this.glow.destroy();
    super.destroy();
  }
}

export class GlowJar {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'jar_glow').setScale(0.3);
    this.glow = scene.add.image(0, 0, glowTexture(scene)).setBlendMode(Phaser.BlendModes.ADD).setTint(0xe8ff80).setScale(0.8);
  }

  use() {
    this.scene.placeGlowJar();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
    this.glow.setPosition(this.sprite.x, this.sprite.y).setDepth(NIGHT_DEPTH + 2).setAlpha(0.6 + Math.sin(this.scene.time.now / 200) * 0.1);
  }

  // mit dem Glas fängt man nicht direkt
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
    this.glow.destroy();
  }
}
