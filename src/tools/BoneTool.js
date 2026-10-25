// Knochen in der Hand (Savanne in der Trockenzeit): mit der Aktionstaste vor sich auf den Boden streuen. Kichern die
// Hyänen gerade, kommen sie zum Fressen (siehe HyenaPack in Hyena.js); was dann passiert, steuert die Szene (dropBones).

export default class BoneTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'bone').setScale(0.3);
  }

  use() {
    this.scene.dropBones();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  // mit Knochen fängt man nicht direkt
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
