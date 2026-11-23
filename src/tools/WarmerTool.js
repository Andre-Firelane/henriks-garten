// Wärmflasche (Eiswelt, liegt in den Kisten): mit der Aktionstaste legt Henrik sie einem dösenden Walross in der Nähe an –
// es wird warm (Dampf, Herzchen) und kommt mit (siehe Walrus.js und warmWalrus in GardenScene). Ist keins in der Nähe
// oder ist es wach, gibt es einen kurzen Hinweis.

export default class WarmerTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'warmer').setScale(0.36);
  }

  use() {
    this.scene.warmWalrus();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  // gefangen wird über warmWalrus (nicht beim Schwingen wie mit dem Kescher)
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
