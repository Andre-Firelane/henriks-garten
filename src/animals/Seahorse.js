// Seepferdchen (Riff): verstecken sich in den Korallen – wie die Fische in den Teichen der Oberwelt. Ab und zu steigen an
// einer Koralle Bläschen auf, dann schaut ein Seepferdchen heraus, verschwindet aber recht schnell wieder darin und taucht
// später an einer anderen Koralle auf. Nur solange es draußen ist, kann man es mit dem Kescher fangen.
// Gefangen schwimmt es wie die Riff-Fische hinter Henrik her (an Land im Beutel) und zieht ins Seepferdchen-Becken.
import Phaser from 'phaser';
import ReefFish from './ReefFish.js';
import { LEVEL_ID, MAP_W, MAP_H, objectAt, isBlocked } from '../world/map.js';
import { tileToWorld } from '../world/iso.js';

const HIDDEN_TIME = [4, 10]; // so lange ist nichts zu sehen
const BUBBLE_TIME = [2, 3]; // so lange blubbert es an der Koralle, bevor es herausschaut
const OUT_TIME = [7.6, 9]; // so lange bleibt es draußen
const SLIDE_TIME = 0.35; // Heraus- bzw. Hineinschwimmen
const PEEK_OUT = 0.55; // so weit (Anteil der Strecke zur freien Nachbarkachel) kommt es aus der Koralle heraus
const BUBBLE_FRONT = 80; // Bläschen vor den Korallen davor zeichnen (sonst steigen sie unsichtbar in deren Kronen auf)
const PEEK_HEIGHT = 14; // so hoch schwebt es dabei über dem Boden
const SCALE = 0.5; // Bild 48 × 64

// Verstecke: Korallen (nicht die Felsen am Rand) mit einer freien Nachbarkachel, je Level einmal gesucht
let spotsLevel = null;
let spots = [];
function hidingSpots() {
  if (spotsLevel === LEVEL_ID) return spots;
  spotsLevel = LEVEL_ID;
  spots = [];
  for (let ty = 1; ty < MAP_H - 1; ty++) {
    for (let tx = 1; tx < MAP_W - 1; tx++) {
      const key = objectAt(tx, ty)?.key ?? '';
      if (!key.startsWith('reef_') || key === 'reef_rock' || key === 'reef_kelp') continue;
      const free = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !isBlocked(tx + dx, ty + dy));
      if (free.length) spots.push({ tx, ty, free });
    }
  }
  return spots;
}

export default class Seahorse extends ReefFish {
  constructor(scene, x, y) {
    super(scene, x, y, 0, null, 'seahorse');
    this.variant = undefined; // nur eine Art
    this.setPhase('hidden', Phaser.Math.FloatBetween(0.5, HIDDEN_TIME[1]));
  }

  setPhase(phase, time) {
    this.wildPhase = phase;
    this.phaseTime = time;
    this.phaseLength = time;
  }

  swimFrame() {
    const f = this.kind.swimFrames;
    return this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
  }

  swimScale() {
    return SCALE;
  }

  canDespawn() {
    return this.state !== 'wild' || this.wildPhase === 'hidden';
  }

  canBeCaughtNow() {
    return this.state === 'wild' && (this.wildPhase === 'out' || this.wildPhase === 'up');
  }

  shouldFlee() {
    return false;
  }

  // eine Koralle aussuchen, an der gerade kein anderes Seepferdchen ist; es schaut zur freien Seite heraus
  pickSpot() {
    const list = hidingSpots();
    const used = this.scene.animals.filter((a) => a !== this && a.species === 'seahorse' && a.spot).map((a) => a.spot);
    const free = list.filter((s) => !used.includes(s));
    this.spot = Phaser.Utils.Array.GetRandom(free.length ? free : list) ?? null;
    if (!this.spot) return;
    const [dx, dy] = Phaser.Utils.Array.GetRandom(this.spot.free);
    this.home = tileToWorld(this.spot.tx, this.spot.ty);
    this.peek = tileToWorld(this.spot.tx + dx * PEEK_OUT, this.spot.ty + dy * PEEK_OUT);
    this.x = this.peek.x;
    this.y = this.peek.y;
    this.faceX = Math.sign(this.peek.x - this.home.x) || 1;
    this.faceY = 1;
    this.h = PEEK_HEIGHT;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    this.phaseTime -= dt;
    if (this.wildPhase === 'bubbling') {
      this.bubbleTimer -= dt;
      if (this.bubbleTimer <= 0) {
        this.bubble();
        this.bubbleTimer = Phaser.Math.FloatBetween(0.1, 0.2);
      }
    }
    if (this.phaseTime > 0) return false;
    switch (this.wildPhase) {
      case 'hidden':
        this.pickSpot();
        this.bubbleTimer = 0;
        if (this.spot) this.setPhase('bubbling', Phaser.Math.FloatBetween(...BUBBLE_TIME));
        else this.setPhase('hidden', HIDDEN_TIME[1]);
        break;
      case 'bubbling':
        this.setPhase('out', SLIDE_TIME);
        break;
      case 'out':
        this.setPhase('up', Phaser.Math.FloatBetween(...OUT_TIME));
        break;
      case 'up':
        this.setPhase('in', SLIDE_TIME);
        break;
      default:
        this.spot = null;
        this.setPhase('hidden', Phaser.Math.FloatBetween(...HIDDEN_TIME));
    }
    return false;
  }

  // Bläschen an der Koralle (gut sichtbar, vor der Koralle): gleich schaut hier ein Seepferdchen heraus
  bubble() {
    const x = this.home.x + (this.peek.x - this.home.x) * 0.5 + Phaser.Math.Between(-10, 10);
    const y = this.home.y + (this.peek.y - this.home.y) * 0.5 - Phaser.Math.Between(4, 16);
    const b = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(2.5, 4.5), 0xeaf8ff, 0.95).setStrokeStyle(1.5, 0x1f6fb0).setDepth(this.peek.y + BUBBLE_FRONT);
    this.scene.tweens.add({ targets: b, y: y - Phaser.Math.Between(40, 70), x: x + Phaser.Math.Between(-6, 6), scale: 1.4, alpha: 0, duration: Phaser.Math.Between(1100, 1600), ease: 'Sine.easeOut', onComplete: () => b.destroy() });
  }

  render(moving) {
    if (this.state !== 'wild') return super.render(moving);
    const shown = ['out', 'up', 'in'].includes(this.wildPhase) && this.spot;
    this.sprite.setVisible(!!shown);
    this.shadow.setVisible(false);
    if (!shown) return;
    // beim Heraus- und Hineinschwimmen gleitet es zwischen Koralle und Platz davor
    const t = this.wildPhase === 'out' ? 1 - this.phaseTime / this.phaseLength : this.wildPhase === 'in' ? this.phaseTime / this.phaseLength : 1;
    this.x = this.home.x + (this.peek.x - this.home.x) * t;
    this.y = this.home.y + (this.peek.y - this.home.y) * t;
    super.render(false);
    this.sprite.setAlpha(Math.min(1, t * 1.5));
    this.shadow.setVisible(false);
  }

  catch() {
    this.sprite.setAlpha(1);
    this.spot = null;
    super.catch();
  }
}
