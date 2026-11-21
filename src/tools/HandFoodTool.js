// Futter aus dem Futterhaus (siehe FEED_SORTS in src/world/friends.js): Henrik trägt es in der Hand und füttert damit
// seinen Tierfreund am Zaun aus der Hand (feedFriend in GardenScene). Danach ist es weg, neues gibt es im Futterhaus.

export default class HandFoodTool {
  constructor(scene, player, sort, image) {
    this.scene = scene;
    this.player = player;
    this.sort = sort;
    this.sprite = scene.add.image(0, 0, image).setScale(0.3);
    // Bild noch nicht geladen (z. B. der Blätterzweig, der sonst nur im Dschungel gebraucht wird): jetzt nachladen
    if (!scene.textures.exists(image)) {
      this.sprite.setVisible(false);
      scene.load.image(image, `assets/${image}.png`);
      scene.load.once('complete', () => this.sprite.active && this.sprite.setTexture(image).setVisible(true));
      scene.load.start();
    }
  }

  use() {
    this.scene.feedFriend(null, this.sort);
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
    this.sprite.setFlipX(p.faceX < 0);
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
