// Erdmännchen (Savanne): leben in Kolonien. Ein Wächter steht aufrecht und dreht sich alle 15 Sekunden im Uhrzeigersinn;
// sein Blickfeld ist die ganze vordere Hälfte (180°). Die anderen schauen aus ihren Löchern und sehen sich um.
// Sieht der Wächter den Spieler, warnt er mit einem Pfiff, und die ganze Kolonie verschwindet. Ebenso nach dem ersten
// Fang: dann schlägt er Alarm und die übrigen verschwinden.
// Fangen: nur mit dem Kescher und nur die im Loch (nicht den Wächter).
// Im Gehege läuft es herum und gräbt sich ab und zu ein Loch, aus dem es eine Weile herausschaut.
import Phaser from 'phaser';
import Animal from './Animal.js';

const COLONY_JOIN = 70; // so nah muss ein Erdmännchen an einer Kolonie sein, um dazuzugehören
const TURN_TIME = 15; // alle so viele Sekunden dreht sich der Wächter eine Richtung weiter (im Uhrzeigersinn)
const VIEW_DIST = 140; // so weit sieht er (in Kachel-Proportionen, etwa 4 bis 5 Kacheln)
const PEEK_TIME = [2, 4]; // so lange schaut ein Erdmännchen im Loch in eine Richtung
const HOLE_ORIGIN_Y = 26 / 32; // Mitte des Erdlochs im Bild "meerkat_hole"
const ALARM_VOLUME = 0.5;
const DIG_EVERY = [8, 18]; // im Gehege: so lange läuft es herum, bevor es sich eingräbt
const DIG_TIME = [5, 10]; // ... und so lange schaut es dann aus dem Loch
// Blickrichtungen des Wächters (faceX, faceY) im Uhrzeigersinn: oben rechts, unten rechts, unten links, oben links
const CLOCKWISE = [[1, -1], [1, 1], [-1, 1], [-1, -1]];

export default class Meerkat extends Animal {
  // allAnimals: alle Tiere des Levels, darin sucht es seine Kolonie
  constructor(scene, x, y, allAnimals) {
    super(scene, x, y, 'meerkat');
    this.allAnimals = allAnimals;
    const near = allAnimals.find(
      (a) => a.colony && !a.colony.alarmed && a.state === 'wild' && Math.hypot(a.x - x, (a.y - y) * 2) < COLONY_JOIN,
    );
    this.colony = near ? near.colony : { guard: null, alarmed: false };
    if (!this.colony.guard) this.colony.guard = this; // das erste der Kolonie hält Wache
    // Wächter: zufällige Startrichtung und Startzeit, damit nicht alle Kolonien gleichzeitig drehen
    this.turnIndex = Phaser.Math.Between(0, 3);
    [this.faceX, this.faceY] = CLOCKWISE[this.turnIndex];
    this.lookTime = Phaser.Math.FloatBetween(0, TURN_TIME);
    if (!this.isGuard()) this.useHoleLook();
  }

  isGuard() {
    return this.colony.guard === this;
  }

  useHoleLook() {
    this.sprite.setTexture('meerkat_hole', this.sprite.frame.name).setOrigin(0.5, HOLE_ORIGIN_Y);
    this.shadow.setVisible(false);
  }

  useStandLook() {
    this.sprite.setTexture(this.kind.texture, this.sprite.frame.name).setOrigin(0.5, this.kind.originY);
    this.sprite.setVisible(true).setScale(this.baby ? 0.3 : 0.5);
    this.shadow.setVisible(true);
  }

  // Nur die im Loch, nicht den Wächter (Werkzeug: Kescher, siehe catchWith)
  canBeCaughtNow() {
    return this.state === 'wild' && !this.isGuard();
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return this.updatePen(dt, player);
    if (this.state !== 'wild') return super.updateFree(dt, player);

    if (this.isGuard()) {
      // Wache halten: alle TURN_TIME Sekunden eine Richtung weiter im Uhrzeigersinn drehen
      [this.faceX, this.faceY] = CLOCKWISE[this.turnIndex];
      this.lookTime -= dt;
      if (this.lookTime <= 0) {
        this.turnIndex = (this.turnIndex + 1) % CLOCKWISE.length;
        [this.faceX, this.faceY] = CLOCKWISE[this.turnIndex];
        this.lookTime = TURN_TIME;
      }
      if (this.sees(player)) this.raiseAlarm();
      return false;
    }

    // Im Loch: schaut sich ab und zu in eine andere Richtung um
    this.lookTime -= dt;
    if (this.lookTime <= 0) {
      this.faceX = Math.random() < 0.5 ? -1 : 1;
      this.faceY = Math.random() < 0.7 ? 1 : -1;
      this.lookTime = Phaser.Math.FloatBetween(...PEEK_TIME);
    }
    return false;
  }

  // Im Gehege: herumlaufen, dann eine Weile eingegraben aus dem Loch schauen
  updatePen(dt, player) {
    this.digTime = (this.digTime ?? Phaser.Math.FloatBetween(2, DIG_EVERY[1])) - dt;
    if (!this.digging) {
      if (this.digTime > 0) return super.updateFree(dt, player);
      this.digging = true;
      this.digTime = Phaser.Math.FloatBetween(...DIG_TIME);
      this.lookTime = 0;
      this.useHoleLook();
      this.dustPuff();
      return false;
    }
    if (this.digTime <= 0) {
      this.digging = false;
      this.digTime = Phaser.Math.FloatBetween(...DIG_EVERY);
      this.useStandLook();
      this.pickWander();
      return false;
    }
    // im Loch umschauen
    this.lookTime -= dt;
    if (this.lookTime <= 0) {
      this.faceX = Math.random() < 0.5 ? -1 : 1;
      this.faceY = Math.random() < 0.7 ? 1 : -1;
      this.lookTime = Phaser.Math.FloatBetween(...PEEK_TIME);
    }
    return false;
  }

  // ein paar Erdkrümel beim Eingraben
  dustPuff() {
    for (let i = 0; i < 6; i++) {
      const dot = this.scene.add.circle(this.x, this.y - 2, Phaser.Math.FloatBetween(1, 2), 0x9a6b3c, 1).setDepth(this.y + 1);
      this.scene.tweens.add({
        targets: dot,
        x: this.x + Phaser.Math.Between(-12, 12),
        y: this.y - Phaser.Math.Between(4, 12),
        alpha: 0,
        duration: Phaser.Math.Between(350, 600),
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  // Steht der Spieler im Blickfeld des Wächters? Die vordere Hälfte (180°) bis VIEW_DIST weit.
  sees(player) {
    const dx = player.x - this.x;
    const dy = (player.y - this.y) * 2; // Kachel-Proportionen
    if (Math.hypot(dx, dy) > VIEW_DIST) return false;
    return dx * this.faceX + dy * this.faceY > 0;
  }

  // Warnpfiff: die ganze Kolonie verschwindet. reason: 'seen' (Wächter hat den Spieler gesehen) oder 'catch' (eins gefangen)
  raiseAlarm(reason = 'seen') {
    const colony = this.colony;
    if (colony.alarmed) return;
    colony.alarmed = true;
    const scene = this.scene;
    if (scene.cache.audio.exists('meerkat_alarm')) scene.sound.play('meerkat_alarm', { volume: ALARM_VOLUME });
    scene.showToast(
      reason === 'catch'
        ? 'Gefangen! Aber der Wächter hat Alarm geschlagen – die anderen Erdmännchen sind weg.'
        : 'Der Wächter hat dich gesehen – alle Erdmännchen sind weg! Tipp: Schleich dich von hinten an, er sieht nur, was vor ihm ist.',
    );
    for (const a of [...this.allAnimals]) {
      if (a.colony === colony && a.state === 'wild') scene.despawn(a);
    }
  }

  startFeed() {
    if (this.digging) {
      this.digging = false;
      this.useStandLook(); // kommt aus dem Loch
    }
  }

  catch() {
    super.catch();
    this.digging = false;
    this.useStandLook();
    this.raiseAlarm('catch'); // die übrigen der Kolonie verschwinden
  }

  restore(state) {
    super.restore(state);
    if (state !== 'wild') this.useStandLook();
  }

  render(moving) {
    const inHole = this.state === 'wild' ? !this.isGuard() : this.state === 'penned' && this.digging;
    if (!inHole) {
      super.render(moving);
      return;
    }
    // Erdmännchen im Loch: schaut heraus
    const f = this.kind.frames;
    this.sprite.setFrame(
      this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft,
    );
    this.sprite.setVisible(true);
    this.sprite.setScale(this.baby ? 0.3 : 0.5);
    this.sprite.setPosition(this.x, this.y);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
  }
}
