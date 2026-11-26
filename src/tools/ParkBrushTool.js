// Bürste aus dem Tierpark (hängt am Futterautomaten, siehe openFeeder in GardenScene): damit bürstet Henrik eitle
// Tierfreunde, Strich für Strich von verschiedenen Seiten (siehe startBrushing). Kommt nicht ins Regal und bleibt in der
// Hand, bis man etwas anderes nimmt. Bild: eigener Name PARK_BRUSH (die Yak-Bürste 'brush' ist ein großes HD-Bild)
export default class ParkBrushTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    scene.withParkBrush(() => this.sprite.active && this.sprite.setTexture('park_brush').setScale(22 / this.sprite.width).setVisible(true));
  }

  use() {
    this.scene.useParkBrush();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 9, p.sprite.y - 14 - p.handLift);
    this.sprite.setFlipX(p.faceX < 0);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
