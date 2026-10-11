// Erdmännchen (Savanne): leben in Kolonien. Ein Wächter steht aufrecht und dreht sich alle 15 Sekunden im Uhrzeigersinn;
// sein Blickfeld ist die ganze vordere Hälfte (180°). Die anderen buddeln in ihren Löchern und tauchen auf und ab.
// Sieht der Wächter den Spieler, warnt er mit einem Pfiff, und die ganze Kolonie verschwindet.
// Fangen: nur mit dem Kescher und nur die buddelnden, solange sie oben sind (nicht den Wächter).
import Phaser from 'phaser';
import Animal from './Animal.js';

const COLONY_JOIN = 70; // so nah muss ein Erdmännchen an einer Kolonie sein, um dazuzugehören
const TURN_TIME = 15; // alle so viele Sekunden dreht sich der Wächter eine Richtung weiter (im Uhrzeigersinn)
const VIEW_DIST = 140; // so weit sieht er (in Kachel-Proportionen, etwa 4 bis 5 Kacheln)
const HIDDEN_TIME = [1.5, 4]; // so lange ist ein buddelndes Erdmännchen unten
const UP_TIME = [2.5, 5]; // so lange schaut es aus dem Loch
const RISE_TIME = 0.3; // Auftauchen und Abtauchen
const HOLE_ORIGIN_Y = 26 / 32; // Mitte des Erdlochs im Bild "meerkat_hole"
const ALARM_VOLUME = 0.5;
const SURFACED = ['rising', 'up', 'sinking'];
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
    if (!this.isGuard()) {
      this.useHoleLook();
      this.setPhase('hidden', Phaser.Math.FloatBetween(0.3, HIDDEN_TIME[1]));
    }
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
    this.sprite.setVisible(true).setScale(0.5);
    this.shadow.setVisible(true);
  }

  setPhase(phase, time) {
    this.phase = phase;
    this.phaseTime = time;
    this.phaseLength = time;
  }

  // Nur buddelnde, die gerade oben sind, und nur mit dem Kescher
  canBeCaughtNow() {
    return this.state === 'wild' && !this.isGuard() && SURFACED.includes(this.phase);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player); // im Gehege läuft es herum

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

    // Buddeln: wie beim Maulwurf auf- und abtauchen
    this.phaseTime -= dt;
    if (this.phaseTime > 0) return false;
    switch (this.phase) {
      case 'hidden':
        this.faceX = Math.random() < 0.5 ? -1 : 1;
        this.faceY = Math.random() < 0.7 ? 1 : -1;
        this.setPhase('rising', RISE_TIME);
        break;
      case 'rising':
        this.setPhase('up', Phaser.Math.FloatBetween(...UP_TIME));
        break;
      case 'up':
        this.setPhase('sinking', RISE_TIME);
        break;
      default:
        this.setPhase('hidden', Phaser.Math.FloatBetween(...HIDDEN_TIME));
    }
    return false;
  }

  // Steht der Spieler im Blickfeld des Wächters? Die vordere Hälfte (180°) bis VIEW_DIST weit.
  sees(player) {
    const dx = player.x - this.x;
    const dy = (player.y - this.y) * 2; // Kachel-Proportionen
    if (Math.hypot(dx, dy) > VIEW_DIST) return false;
    return dx * this.faceX + dy * this.faceY > 0;
  }

  // Warnpfiff: die ganze Kolonie verschwindet
  raiseAlarm() {
    const colony = this.colony;
    if (colony.alarmed) return;
    colony.alarmed = true;
    const scene = this.scene;
    if (scene.cache.audio.exists('meerkat_alarm')) scene.sound.play('meerkat_alarm', { volume: ALARM_VOLUME });
    scene.showToast('Der Wächter hat dich gesehen – alle Erdmännchen sind weg! Tipp: Schleich dich von hinten an, er sieht nur, was vor ihm ist.');
    for (const a of [...this.allAnimals]) {
      if (a.colony === colony && a.state === 'wild') scene.despawn(a);
    }
  }

  catch() {
    super.catch();
    this.useStandLook();
  }

  restore(state) {
    super.restore(state);
    if (state !== 'wild') this.useStandLook();
  }

  render(moving) {
    if (this.state !== 'wild' || this.isGuard()) {
      super.render(moving);
      return;
    }
    // buddelndes Erdmännchen im Loch: schiebt sich heraus und verschwindet wieder
    const f = this.kind.frames;
    this.sprite.setFrame(
      this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft,
    );
    let grow = 1;
    if (this.phase === 'rising') grow = 1 - this.phaseTime / this.phaseLength;
    if (this.phase === 'sinking') grow = this.phaseTime / this.phaseLength;
    this.sprite.setVisible(SURFACED.includes(this.phase));
    this.sprite.setScale(0.5, 0.5 * Math.max(0.1, grow));
    this.sprite.setPosition(this.x, this.y);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
  }
}
