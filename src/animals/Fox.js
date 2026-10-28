// Fuchs: draußen wie jedes andere scheue Tier. Im Fuchsbau trottet er ab und zu zu seiner Erdhöhle,
// rollt sich davor zusammen und schläft eine Weile (Zzz).
import Phaser from 'phaser';
import Animal, { SPRITE_SINK } from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { objectAt } from '../world/map.js';

const ROAM_TIME = [10, 20]; // so lange läuft er im Gehege herum ...
const SLEEP_TIME = [12, 22]; // ... und so lange schläft er
const WALK_TIMEOUT = 10; // kommt er nicht zur Höhle, schläft er eben dort, wo er ist
const ZZZ_EVERY = 1.2;
const SLEEP_ORIGIN_Y = 41 / 44; // Bild "fox_sleep"
// Plätze vor der Höhle zum Schlafen (der erste freie wird genommen; vorne bevorzugt)
const DEN_SPOTS = [[0, 24], [-26, 14], [26, 14], [-30, 4], [30, 4]];
const SPOT_GAP = 16; // so viel Platz braucht ein schlafender Fuchs

export default class Fox extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'fox');
  }

  // Schlafplatz vor der Höhle im eigenen Gehege (oder null)
  denSpot() {
    const a = this.enclosure?.area;
    if (!a) return null;
    for (const { tx, ty } of this.enclosure.tiles) {
      { // nur Kacheln, die wirklich zum Gehege gehören (auch bei L-Formen)
        if (objectAt(tx, ty)?.key !== 'den') continue;
        const p = tileToWorld(tx, ty);
        // Plätze, an denen schon ein anderer Fuchs schläft oder hinwill, sind belegt
        const others = this.scene.animals
          .filter((a) => a !== this && a.species === 'fox' && (a.sleeping || a.bed))
          .map((a) => a.bed ?? { x: a.x, y: a.y });
        const spot = DEN_SPOTS.find(
          ([dx, dy]) =>
            !this.blocked(p.x + dx, p.y + dy) && others.every((o) => Math.hypot(o.x - p.x - dx, o.y - p.y - dy) > SPOT_GAP),
        );
        if (spot) return { x: p.x + spot[0], y: p.y + spot[1], denX: p.x };
      }
    }
    return null;
  }

  updateFree(dt, player) {
    if (this.state !== 'penned') return super.updateFree(dt, player);
    this.penTime = (this.penTime ?? Phaser.Math.FloatBetween(3, ROAM_TIME[1])) - dt;

    if (this.sleeping) {
      this.zzzTime -= dt;
      if (this.zzzTime <= 0) {
        this.spawnZ();
        this.zzzTime = ZZZ_EVERY;
      }
      if (this.penTime <= 0) {
        this.sleeping = false;
        this.penTime = Phaser.Math.FloatBetween(...ROAM_TIME);
        this.pickWander();
      }
      return false;
    }

    if (!this.bed) {
      if (this.penTime > 0) return super.updateFree(dt, player);
      this.bed = this.denSpot() ?? { x: this.x, y: this.y };
      this.penTime = WALK_TIMEOUT;
    }

    // zur Höhle trotten
    const dx = this.bed.x - this.x;
    const dy = this.bed.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 4 || this.penTime <= 0) {
      this.sleeping = true;
      this.zzzTime = ZZZ_EVERY;
      this.penTime = Phaser.Math.FloatBetween(...SLEEP_TIME);
      // Kopf von der Höhle weg, also zum Spieler hin
      this.faceY = 1;
      if (this.bed.denX !== undefined) this.faceX = Math.sign(this.x - this.bed.denX) || this.faceX;
      this.bed = null;
      return false;
    }
    const step = Math.min(d, this.kind.speed * dt);
    return this.move((dx / d) * step, (dy / d) * step);
  }

  spawnZ() {
    const x = this.x + this.faceX * 8;
    const y = this.y - 16;
    const z = this.scene.add
      .text(x, y, 'z', { fontFamily: 'Trebuchet MS, Arial', fontSize: '10px', fontStyle: 'bold', color: '#ffffff', stroke: '#2b1d14', strokeThickness: 3, resolution: 4 })
      .setOrigin(0.5)
      .setDepth(100000);
    this.scene.tweens.add({
      targets: z,
      x: x + this.faceX * 6,
      y: y - 14,
      scale: 1.4,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.easeOut',
      onComplete: () => z.destroy(),
    });
  }

  startFeed() {
    this.sleeping = false; // wacht auf und kommt
    this.bed = null;
  }

  catch() {
    this.sleeping = false;
    this.bed = null;
    super.catch();
  }

  restore(state) {
    this.sleeping = false;
    this.bed = null;
    this.penTime = undefined;
    super.restore(state);
  }

  render(moving) {
    if (!(this.state === 'penned' && this.sleeping)) {
      // nach dem Schlafen zurück aufs normale Bild (die Laufanimation setzt ihr Bild selbst)
      const key = this.sprite.texture.key;
      if (key !== this.lookTexture() && !Object.values(this.kind.anims).includes(key)) this.sprite.setTexture(this.lookTexture(), 0).setOrigin(0.5, this.kind.originY);
      super.render(moving);
      return;
    }
    // eingerollt
    if (this.sprite.texture.key !== 'fox_sleep') {
      this.sprite.stop().setFlipX(false);
      this.sprite.setTexture('fox_sleep', 0).setOrigin(0.5, SLEEP_ORIGIN_Y);
    }
    const f = this.kind.frames;
    this.sprite.setFrame(this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft);
    this.sprite.setPosition(this.x, this.y + SPRITE_SINK);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y);
    this.shadow.setDepth(this.y - 0.5);
  }
}
