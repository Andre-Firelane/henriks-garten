// Schere (Riff, aus dem Sack am Anker): der Spieler trägt sie in der Hand. Mit der Aktionstaste schneidet er an einer
// Meeresschildkröte im Fischernetz ein Stück Netz durch (dreimal, dann ist sie frei; siehe cutNet in GardenScene).

export default class ScissorsTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'scissors').setScale(0.35);
  }

  use() {
    if (this.scene.nearTurtle) this.scene.cutNet(this.scene.nearTurtle);
    else this.scene.showToast('✂️ Schwimm mit der Schere nah an eine Meeresschildkröte im Netz.');
  }

  update() {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
    this.sprite.setFlipX(p.faceX > 0);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
  }

  // Mit der Schere fängt man nicht direkt
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
