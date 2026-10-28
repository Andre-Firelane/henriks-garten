// Die Falle in der Hand: der Spieler trägt sie an der Seite und legt sie mit der Aktionstaste vor sich ab.
// Was danach passiert (Warten, Tier geht hinein, Abholen), steuert die Szene (siehe placeTrap in GardenScene).

export default class TrapTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'trap');
    this.sprite.setScale(19 / this.sprite.width); // klein an der Seite (die ausgelegte Falle ist viel größer)
  }

  use() {
    this.scene.placeTrap();
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 12 - p.handLift);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  // Die Falle fängt nicht direkt beim Einsetzen
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
