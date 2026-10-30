// Riff-Fische (Riff): bunte Fische in Seitenansicht, 22 Arten (variant = Nummer der Art im Spritesheet "reeffish"),
// alle gleich häufig. Sie schweben in wechselnder Höhe über dem Meeresboden, oft in kleinen Gruppen derselben Art
// (herd: die Gruppe folgt gemeinsam ihrem Anführer). Kommt man zu nah, flüchten sie – etwas langsamer als der Taucher,
// mit dem Kescher erwischt man sie trotzdem.
// Gefangen schwimmen sie unter Wasser hinter Henrik her; an Land (Tierpark) trägt er sie im Beutel. Im Aquarium ziehen
// sie in die Wassertanks und schwimmen dort zwischen Rückwand und vorderer Glasscheibe.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { LEVEL, MAP_W, MAP_H, charAt } from '../world/map.js';
import { worldToTile, tileToWorld } from '../world/iso.js';

export const REEF_KINDS = 22; // so viele Arten hat das Spritesheet (je zwei Bilder: nach rechts, nach links)
const SCALE = 0.4; // Größe draußen im Riff (Bild 96 × 64)
const TANK_SCALE = 0.34; // ... und im Wassertank
const HEIGHT = [14, 46]; // so hoch schweben sie im Riff über dem Boden
const TANK_HEIGHT = [16, 96]; // ... und im Tank (das Wasser reicht bis 112)
const FOLLOW_HEIGHT = 22; // hinter dem Taucher etwa auf seiner Höhe
const SPEED = [8, 15]; // gemütliches Schwimmen (Pixel pro Sekunde)
const ROAM = 4; // so viele Kacheln weit sucht sich ein Fisch sein nächstes Ziel
const SCHOOL_GAP = 18; // so weit schwimmen Gruppenfische um ihren Anführer herum
const BOB = 1.5; // leichtes Auf und Ab
const BABY_SCALE = 0.55; // Tierbabys (Event) sind so viel kleiner
const FLEE_CHANCE = 2 / 3; // kommt man nah, schwimmt eine Gruppe nur mit dieser Wahrscheinlichkeit davon ...
const FLEE_ROLL = 4; // ... und würfelt nach so vielen Sekunden neu, wenn man in der Nähe bleibt
// Schwanzflosse wackelt (tools/fish-wag.cjs): je Bild WAG_FRAMES Bilder; Flossenschläge pro Sekunde je nach Tempo
const SWIM_SHEETS = { reeffish: 'reeffish_swim' };
const WAG_FRAMES = 4;
const WAG_RATE = [1.6, 4]; // gemütlich bzw. auf der Flucht

export default class ReefFish extends Animal {
  // variant: Art (0 bis REEF_KINDS - 1), sonst zufällig; herd: Gruppe, zu der er gehört (oder null);
  // species: für Meerestiere, die davon erben (Seepferdchen)
  constructor(scene, x, y, variant, herd = null, species = 'reeffish') {
    super(scene, x, y, species);
    this.variant = Number.isInteger(variant) ? variant : Phaser.Math.Between(0, REEF_KINDS - 1);
    this.herd = herd ?? { leader: this };
    this.h = Phaser.Math.FloatBetween(...HEIGHT);
    this.offset = { x: Phaser.Math.FloatBetween(-SCHOOL_GAP, SCHOOL_GAP), y: Phaser.Math.FloatBetween(-SCHOOL_GAP / 2, SCHOOL_GAP / 2), h: Phaser.Math.FloatBetween(-8, 8) };
    this.phase = Math.random() * 10;
    this.target = null;
    this.speed = Phaser.Math.FloatBetween(...SPEED);
    this.shadow.setAlpha(0.35);
  }

  // Bild beim Schwimmen (Seitenansicht nach rechts bzw. links) und Größe draußen bzw. im Tank
  swimFrame() {
    return this.variant * 2 + (this.faceX > 0 ? 0 : 1);
  }

  swimScale(tank) {
    return tank ? TANK_SCALE : SCALE;
  }

  // Tierbaby (Event): kleiner als die Eltern
  babyScale() {
    return this.baby ? BABY_SCALE : 1;
  }

  inTank() {
    return this.state === 'penned';
  }

  heights() {
    return this.inTank() ? TANK_HEIGHT : HEIGHT;
  }

  // Ziel in der Nähe: im Riff irgendwo im Wasser (nicht am Rand), im Tank irgendwo im Becken
  pickTarget() {
    if (this.inTank()) {
      const t = Phaser.Utils.Array.GetRandom(this.enclosure?.tiles ?? []);
      const p = t ? tileToWorld(t.tx + Phaser.Math.FloatBetween(-0.3, 0.3), t.ty + Phaser.Math.FloatBetween(-0.3, 0.3)) : { x: this.x, y: this.y };
      this.target = p;
    } else {
      const { tx, ty } = worldToTile(this.x, this.y);
      const ntx = Phaser.Math.Clamp(tx + Phaser.Math.Between(-ROAM, ROAM), 2, MAP_W - 3);
      const nty = Phaser.Math.Clamp(ty + Phaser.Math.Between(-ROAM, ROAM), 2, MAP_H - 3);
      this.target = tileToWorld(ntx, nty);
    }
    this.targetH = Phaser.Math.FloatBetween(...this.heights());
    this.speed = Phaser.Math.FloatBetween(...SPEED);
  }

  // im Riff: über alles hinweg (Fische schwimmen über die Korallen), aber nicht über den Rand hinaus
  inWater(x, y) {
    const { tx, ty } = worldToTile(x, y);
    return tx >= 1 && ty >= 1 && tx <= MAP_W - 2 && ty <= MAP_H - 2 && charAt(tx, ty) !== ' ';
  }

  blocked(x, y) {
    if (this.state === 'following') return false;
    if (this.inTank()) {
      const { tx, ty } = worldToTile(x, y);
      return !this.enclosure?.tileSet.has(tx + ',' + ty);
    }
    return !this.inWater(x, y);
  }

  // Gruppenfische schwimmen ihrem Anführer hinterher; ist der weg (gefangen, verschwunden), führt dieser hier
  leader() {
    const l = this.herd.leader;
    if (l === this) return null;
    if (l.state !== 'wild' || !this.scene.animals.includes(l)) {
      this.herd.leader = this;
      return null;
    }
    return l;
  }

  // Erschrecken: nicht immer – die ganze Gruppe entscheidet gemeinsam, ob sie davonschwimmt (FLEE_CHANCE)
  shouldFlee(player) {
    if (this.state !== 'wild' || !this.kind.fleeDist) return false;
    const d = Math.hypot(this.x - player.x, (this.y - player.y) * 2);
    const h = this.herd;
    const now = this.scene.time.now;
    if (d < this.kind.fleeDist) {
      if (!(now < h.rollUntil)) {
        h.willFlee = Math.random() < FLEE_CHANCE;
        h.rollUntil = now + FLEE_ROLL * 1000;
      }
      this.fleeing = h.willFlee;
    } else if (d > this.kind.fleeDist * 1.6) {
      if (this.fleeing) this.pickTarget();
      this.fleeing = false;
    }
    return this.fleeing;
  }

  updateFree(dt, player) {
    this.phase += dt;
    if (this.state === 'wild' && this.shouldFlee(player)) {
      this.h += (Phaser.Math.Clamp(this.h + 6, ...HEIGHT) - this.h) * Math.min(1, dt * 2);
      return this.flee(dt, player);
    }
    const lead = this.state === 'wild' ? this.leader() : null;
    let goal;
    let goalH;
    if (lead) {
      goal = { x: lead.x + this.offset.x, y: lead.y + this.offset.y };
      goalH = Phaser.Math.Clamp(lead.h + this.offset.h, ...HEIGHT);
    } else {
      if (!this.target || Math.hypot(this.target.x - this.x, this.target.y - this.y) < 3) this.pickTarget();
      goal = this.target;
      goalH = this.targetH;
    }
    this.h += (goalH - this.h) * Math.min(1, dt * 0.6);
    const dx = goal.x - this.x;
    const dy = goal.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return false;
    const speed = lead ? Math.min(this.speed * 2, d * 2) : this.speed; // Gruppenfische holen auf
    const step = Math.min(d, speed * dt);
    const moved = this.move((dx / d) * step, (dy / d) * step);
    if (!moved && !lead) this.pickTarget();
    return moved;
  }

  // gefangene Fische folgen nicht in ein Gehege hinein: sie ziehen im Aquarium in die Tanks (siehe moveFollowersIntoPens)
  arrivedHome() {
    return false;
  }

  restore(state) {
    super.restore(state);
    this.target = null;
    if (state === 'penned') this.h = Phaser.Math.FloatBetween(...TANK_HEIGHT);
  }

  enterPen() {
    super.enterPen();
    this.target = null;
    this.h = Phaser.Math.FloatBetween(...TANK_HEIGHT);
  }

  // unter Wasser als Fisch (schwimmend, mit kleinem Schatten am Boden), an Land im Beutel
  render(moving) {
    const bag = this.state === 'following' && !LEVEL.sea;
    if (bag) {
      if (this.sprite.texture.key !== this.kind.bagTexture) this.sprite.setTexture(this.kind.bagTexture, 0).setOrigin(0.5, this.kind.originY).setScale(0.5);
      this.shadow.setVisible(true).setScale(1).setAlpha(1);
      super.render(moving);
      return;
    }
    if (this.state === 'following') this.h += (FOLLOW_HEIGHT - this.h) * 0.05;
    const tank = this.inTank();
    const base = this.skin ?? this.kind.texture; // seltene Variante mit eigenem Bild (Goldqualle)
    const wag = SWIM_SHEETS[base] && this.scene.textures.exists(SWIM_SHEETS[base]);
    const look = wag ? SWIM_SHEETS[base] : base;
    if (this.sprite.texture.key !== look) this.sprite.setTexture(look).setOrigin(0.5, 0.5);
    this.sprite.setScale(this.swimScale(tank) * this.babyScale()).setAngle(0);
    if (wag) {
      // Flossenschlag: schneller, wenn er schneller schwimmt (jeder Fisch in eigenem Takt)
      const rate = Phaser.Math.Linear(WAG_RATE[0], WAG_RATE[1], Phaser.Math.Clamp((this.moveSpeed ?? 0) / 40, 0, 1));
      this.wagT = (this.wagT ?? Math.random()) + (this.scene.game.loop.delta / 1000) * rate;
      this.sprite.setFrame(this.swimFrame() * WAG_FRAMES + (Math.floor(this.wagT * WAG_FRAMES) % WAG_FRAMES));
    } else this.sprite.setFrame(this.swimFrame());
    const bob = Math.sin(this.phase * 2.2 + this.offset.x) * BOB;
    this.sprite.setPosition(this.x, this.y - this.h + bob);
    // im Tank zwischen Rückwand und vorderer Glasscheibe einsortiert (wie die Zierfische, siehe drawTanks)
    this.sprite.setDepth(this.y + (tank ? 0.5 : 0));
    this.shadow.setVisible(!tank).setPosition(this.x, this.y).setScale(0.55 - this.h * 0.004).setDepth(this.y - 0.5);
  }
}
