// Moorlaterne (Wald, liegt in der Kiste der Hütte): in der Hand leuchtet sie warm und vertreibt rings um Henrik den
// Moornebel (siehe lanternLights in GardenScene und MoorFog.js). Mit der Aktionstaste stellt man sie vor sich ab (die
// Szene stellt sie hin, siehe placeLantern): dort leuchtet sie weiter und lockt die Elche aus dem Nebel ins Licht
// (siehe Elk.js) – und Henrik hat gleich das Lasso in der Hand. Es gibt nur eine: nimmt man sie wieder aus der Kiste,
// verschwindet die abgestellte.
import Phaser from 'phaser';
import { glowTexture } from '../world/Fireflies.js';

export const LANTERN_GLOW = 0xffc060; // warmes Licht
export const GLOW_DEPTH = 99925; // über dem Moornebel (99920), unter Wetter und Dunkelheit

export default class LanternTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'lantern').setScale(0.42);
    this.glow = scene.add.image(0, 0, glowTexture(scene)).setBlendMode(Phaser.BlendModes.ADD).setTint(LANTERN_GLOW).setScale(1.1);
  }

  use() {
    this.scene.placeLantern();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 11, p.sprite.y - 16 - p.handLift);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
    const flicker = Math.sin(this.scene.time.now / 130) * 0.05 + Math.sin(this.scene.time.now / 47) * 0.03;
    this.glow.setPosition(this.sprite.x, this.sprite.y - 2).setDepth(GLOW_DEPTH).setAlpha(0.65 + flicker);
  }

  // mit der Laterne fängt man nicht
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
    this.glow.destroy();
  }
}
