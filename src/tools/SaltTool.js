// Salzstein in der Hand (Bambuswald, Hochebene): am Steinhaufen bei der Yak-Herde mit der Aktionstaste ablegen (siehe
// world/YakHerd.js und GardenScene.putSalt). Anderswo erinnert die Aktionstaste nur daran, wohin er gehört.
// Wird er weggelegt, ohne abgelegt zu sein (anderes Werkzeug genommen), liegt er bald wieder an seinem Platz.
// Kommt nicht ins Regal: man findet ihn auf der Hochebene.
import { tr } from '../i18n.js';

export default class SaltTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.used = false;
    this.sprite = scene.add.image(0, 0, 'salttool').setScale(0.3);
  }

  use() {
    this.scene.showToast(tr('🧂 Leg den Salzstein auf den Steinhaufen bei den Yaks!', '🧂 Put the salt lick on the cairn near the yaks!'));
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 7, p.sprite.y - 15 - p.handLift);
    this.sprite.setFlipX(p.faceX < 0);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  caughtBy() {
    return [];
  }

  destroy() {
    if (!this.used) this.scene.yakHerd?.saltDropped();
    this.sprite.destroy();
  }
}
