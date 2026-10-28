// Die ausgelegte Falle in der Welt. Ein gefangenes Tier sitzt an derselben Stelle und wird
// hinter den Gitterstäben gezeichnet.

export default class Trap {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.sprite = scene.add.image(x, y, 'trap').setOrigin(0.5, 52 / 56).setDepth(y + 0.2);
    this.sprite.setScale(64 / this.sprite.width); // 64 Pixel breit (doppelt so groß wie früher), egal wie groß das Bild ist
    this.alert = null;
  }

  // Zeigen, dass etwas drin ist: Falle wackelt, darüber ein Ausrufezeichen
  showCaught() {
    this.scene.tweens.add({
      targets: this.sprite,
      angle: { from: -4, to: 4 },
      duration: 160,
      yoyo: true,
      repeat: -1,
      repeatDelay: 900,
    });
    this.alert = this.scene.add
      .text(this.x, this.y - 62, '!', {
        fontFamily: 'Trebuchet MS, Arial',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffd84a',
        stroke: '#3a2414',
        strokeThickness: 4,
        resolution: 4,
      })
      .setOrigin(0.5)
      .setDepth(100000);
    this.scene.tweens.add({ targets: this.alert, y: this.y - 46, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
    if (this.alert) {
      this.scene.tweens.killTweensOf(this.alert);
      this.alert.destroy();
    }
  }
}
