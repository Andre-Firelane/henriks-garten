// Fischfutter in der Hand: mit der Aktionstaste streut man es am Ufer ins Wasser. Koi in der Nähe kommen dann
// herbei und schnappen an der Oberfläche (siehe feedKoi in GardenScene). Das Futter geht nicht aus.

export default class KoiFoodTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'koifood').setScale(0.3);
  }

  use() {
    this.scene.feedKoi();
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
