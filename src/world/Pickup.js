// Ein Gegenstand, der auf dem Boden liegt und eingesammelt wird, wenn der Spieler darüber läuft
const PICKUP_DIST = 18;

export default class Pickup {
  // armed = false: erst aufhebbar, nachdem der Spieler sich einmal entfernt hat (z. B. nach dem Ablegen)
  constructor(scene, x, y, texture, tool, armed = true) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.tool = tool;
    this.collected = false;
    this.armed = armed;

    this.shadow = scene.add.ellipse(x, y, 26, 8, 0x14320a, 0.3).setDepth(y - 0.5);
    this.sprite = scene.add.image(x, y - 6, texture).setOrigin(0.5).setScale(0.5).setAngle(-20).setDepth(y);
    // Leichtes Schweben, damit man sieht, dass man es aufheben kann
    scene.tweens.add({
      targets: this.sprite,
      y: y - 10,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // Gibt true zurück, wenn der Spieler es gerade eingesammelt hat
  checkCollect(player) {
    const d = Math.hypot(player.x - this.x, player.y - this.y);
    if (!this.armed) {
      if (d > PICKUP_DIST * 1.8) this.armed = true;
      return false;
    }
    if (this.collected || d > PICKUP_DIST) return false;
    this.collected = true;
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
    this.shadow.destroy();
    return true;
  }
}
