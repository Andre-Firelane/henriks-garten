// Grünfutter in der Hand: der Spieler trägt das Bündel an der Seite und füttert damit mit der Aktionstaste
// eine Giraffe in der Nähe. Was dann passiert (Futter weg, vielleicht folgt sie), steuert die Szene (feedGiraffe).

export default class FoodTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'food').setScale(0.3);
  }

  use() {
    this.scene.feedGiraffe();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  // Mit Futter fängt man nicht direkt
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
