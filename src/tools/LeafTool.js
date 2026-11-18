// Blätterzweig in der Hand (Dschungel): vom Futterstrauch abgebrochen (siehe world/LeafBushes.js). Mit der
// Aktionstaste füttert Henrik einen Tapir oder ein Okapi in der Nähe; was dann passiert, steuert die Szene (feedLeaves).
// Kommt nicht ins Regal: man holt ihn sich immer frisch vom Strauch.

export default class LeafTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'leaf_branch').setScale(0.36);
  }

  use() {
    this.scene.feedLeaves();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 9, p.sprite.y - 15 - p.handLift);
    this.sprite.setFlipX(p.faceX > 0);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
