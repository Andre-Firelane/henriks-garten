// Banane (Dschungel): Henrik trägt sie in der Hand und legt sie mit der Aktionstaste vor sich auf den Boden. Liegt sie
// unten an dem Baum, in dem gerade ein Brüllaffe sitzt, klettert er herunter und frisst sie (siehe Howler.js).
// Was beim Ablegen passiert, steuert die Szene (placeBanana).

export default class BananaTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'banana').setScale(0.3);
  }

  use() {
    this.scene.placeBanana();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  // mit der Banane fängt man nicht direkt
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
