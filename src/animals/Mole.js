// Maulwurf: wie ein Fisch, nur an Land. Unter der Erde ist er unsichtbar; an einer zufälligen Wiesenstelle
// fliegen erst Erdkrümel, dann schiebt er sich mit seinem Hügel heraus und bleibt kurz oben.
// Nur dann kann man ihn fangen. Gefangen läuft er zu Fuß hinter dem Spieler her (Bild "mole").
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { MOLE_SPOTS } from '../world/map.js';

const MOUND_ORIGIN_Y = 48 / 52;
const HIDDEN_TIME = [3, 8]; // so lange ist nichts zu sehen
const DIG_TIME = [1, 3]; // so lange fliegen Erdkrümel, bevor er auftaucht
const UP_TIME = [2, 4]; // so lange bleibt er oben
const RISE_TIME = 0.3; // Herausschieben und Verschwinden
const AWAY_FROM_PLAYER = 60; // taucht nicht direkt unter dem Spieler auf

// Phasen: hidden → digging → rising → up → sinking → hidden
const SURFACED = ['rising', 'up', 'sinking'];

export default class Mole extends Animal {
  // allAnimals: damit nicht zwei Maulwürfe an derselben Stelle auftauchen
  constructor(scene, allAnimals) {
    super(scene, 0, 0, 'mole');
    this.allAnimals = allAnimals;
    this.useMoundLook();
    this.setPhase('hidden', Phaser.Math.FloatBetween(0.5, 5));
  }

  useMoundLook() {
    this.sprite.setTexture(this.kind.moundTexture, 0).setOrigin(0.5, MOUND_ORIGIN_Y);
    this.shadow.setVisible(false);
  }

  useWalkLook() {
    this.sprite.setTexture(this.kind.texture, this.kind.frames.downRight).setOrigin(0.5, this.kind.originY);
    this.sprite.setVisible(true).setScale(0.5);
    this.shadow.setVisible(true);
  }

  setPhase(phase, time) {
    this.phase = phase;
    this.phaseTime = time;
    this.phaseLength = time;
  }

  pickSpot(player) {
    const used = this.allAnimals.filter((a) => a !== this && a.spot && a.phase !== 'hidden').map((a) => a.spot);
    const free = MOLE_SPOTS.filter((s) => {
      if (used.includes(s)) return false;
      const p = tileToWorld(s.tx, s.ty);
      return Math.hypot(p.x - player.x, (p.y - player.y) * 2) > AWAY_FROM_PLAYER;
    });
    this.spot = Phaser.Utils.Array.GetRandom(free.length ? free : MOLE_SPOTS);
    const p = tileToWorld(this.spot.tx, this.spot.ty);
    this.x = p.x + Phaser.Math.Between(-8, 8);
    this.y = p.y + Phaser.Math.Between(-3, 3);
    // schaut in eine zufällige Richtung
    this.faceX = Math.random() < 0.5 ? -1 : 1;
    this.faceY = Math.random() < 0.7 ? 1 : -1;
  }

  canBeCaughtNow() {
    return this.state === 'wild' && SURFACED.includes(this.phase);
  }

  canDespawn() {
    return this.phase === 'hidden';
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return super.updateFree(dt, player); // läuft im Gehege herum
    this.phaseTime -= dt;
    if (this.phase === 'digging') {
      this.dirtTimer -= dt;
      if (this.dirtTimer <= 0) {
        this.spawnDirt();
        this.dirtTimer = Phaser.Math.FloatBetween(0.15, 0.35);
      }
    }
    if (this.phaseTime > 0) return false;

    switch (this.phase) {
      case 'hidden':
        this.pickSpot(player);
        this.dirtTimer = 0;
        this.setPhase('digging', Phaser.Math.FloatBetween(...DIG_TIME));
        break;
      case 'digging':
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

  catch() {
    super.catch();
    this.useWalkLook();
  }

  restore(state) {
    super.restore(state);
    if (state !== 'wild') this.useWalkLook();
  }

  render(moving) {
    if (this.state !== 'wild') {
      super.render(moving);
      return;
    }
    const f = this.kind.frames;
    this.sprite.setFrame(
      this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft,
    );
    // beim Auftauchen von unten herausschieben, beim Abtauchen wieder hinein
    let grow = 1;
    if (this.phase === 'rising') grow = 1 - this.phaseTime / this.phaseLength;
    if (this.phase === 'sinking') grow = this.phaseTime / this.phaseLength;
    this.sprite.setVisible(SURFACED.includes(this.phase));
    this.sprite.setScale(0.5, 0.5 * Math.max(0.1, grow));
    this.sprite.setPosition(this.x, this.y);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
  }

  // Erdkrümel, die hochspritzen und zurückfallen
  spawnDirt() {
    const x = this.x + Phaser.Math.Between(-8, 8);
    const y = this.y + Phaser.Math.Between(-2, 2);
    const crumb = this.scene.add
      .circle(x, y, Phaser.Math.FloatBetween(1.5, 2.5), Math.random() < 0.5 ? 0x6b4224 : 0x8a5a30)
      .setDepth(y + 1);
    this.scene.tweens.add({
      targets: crumb,
      x: x + Phaser.Math.Between(-6, 6),
      y: { value: y - Phaser.Math.Between(6, 12), duration: 250, yoyo: true, ease: 'Quad.easeOut' },
      alpha: { value: 0, delay: 300, duration: 250 },
      duration: 550,
      onComplete: () => crumb.destroy(),
    });
  }
}
