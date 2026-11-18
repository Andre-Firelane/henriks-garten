// Bürste in der Hand (Bambuswald, Hochebene): bekommt Henrik, sobald er den Salzstein auf den Steinhaufen gelegt hat.
// Mit der Aktionstaste bürstet er das Yak, das am Salzstein leckt (siehe GardenScene.brushYak); nach dreimal Bürsten
// kommt es mit. Kommt nicht ins Regal; ist das Yak gefangen oder zurück bei der Herde, steckt Henrik sie wieder ein.
import { tr } from '../i18n.js';

export default class BrushTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'brush').setScale(0.34);
  }

  use() {
    this.scene.brushYak();
  }

  // kurz hin und her schrubben
  scrub() {
    this.scene.tweens.add({ targets: this, wiggle: { from: -5, to: 5 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => (this.wiggle = 0) });
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * (8 + (this.wiggle ?? 0)), p.sprite.y - 14 - p.handLift);
    this.sprite.setFlipX(p.faceX < 0);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  caughtBy() {
    return [];
  }

  destroy() {
    this.scene.tweens.killTweensOf(this);
    this.sprite.destroy();
  }
}
