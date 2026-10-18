// Futter aus dem Futterautomaten im Tierpark: mit der Aktionstaste am Zaun ins Gehege werfen. Die Tiere dort
// kommen herbei und fressen (siehe feedPen in GardenScene). Nach einem Wurf ist der Sack leer.

export default class ParkFoodTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'parkfood').setScale(0.3);
  }

  use() {
    this.scene.feedPen();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
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
