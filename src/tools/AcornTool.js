// Eicheln (Wald): Henrik schüttelt sie aus einer der großen Eichen (siehe shakeOak in GardenScene) und trägt sie dann in
// der Hand. Mit der Aktionstaste legt er sie vor sich ab (die Szene legt sie hin, siehe placeAcorns): neben einem
// Laubhaufen locken sie den Igel heraus (Hedgehog.js) – dann hat Henrik gleich den Kescher –, sonst trotten die
// Wildschweine herbei und fressen (Boar.js) – dann hat er gleich das Lasso.

export default class AcornTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'acorns').setScale(0.3);
  }

  use() {
    this.scene.placeAcorns();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  // mit den Eicheln fängt man nicht direkt
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
