// Großer Stock in der Hand (Wald): am Biberdamm mit der Aktionstaste ins Loch stecken (siehe BeaverDam.js und
// GardenScene.fixDam). Anderswo erinnert die Aktionstaste nur daran, wohin er gehört.
// Wird er weggelegt, ohne verbaut zu sein (anderes Werkzeug genommen), liegt er bald wieder an seinem Platz im Wald.
import { tr } from '../i18n.js';

export default class StickTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.used = false;
    this.sprite = scene.add.image(0, 0, 'forest_stick').setScale(0.55);
  }

  use() {
    this.scene.showToast(tr('🦫 Bring den Stock zum Biberdamm am Fluss und steck ihn ins Loch!', '🦫 Take the stick to the beaver dam by the river and put it into the hole!'));
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 6, p.sprite.y - 16 - p.handLift);
    this.sprite.setFlipX(p.faceX < 0);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  caughtBy() {
    return [];
  }

  destroy() {
    if (!this.used) this.scene.beaverDam?.stickDropped();
    this.sprite.destroy();
  }
}
