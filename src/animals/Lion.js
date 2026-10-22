// Löwe (Savanne) – „Ochs am Berg“: döst im Schatten einer Akazie, über ihm steigen „Zzz“ auf.
// Ab und zu schaut er auf. Ist der Spieler dann in der Nähe, brüllt er (nur der Ton, kein Angriff!) und trottet zu einer
// anderen Akazie. Wer ihn erreicht, solange er schnarcht, krault ihn (Berühren) – dann läuft er mit.
// Kurz bevor er aufschaut, hören die „Zzz“ auf: das ist die Warnung.
// Im Gehege läuft er umher, legt sich zwischendurch hin und schaut sich um oder schläft (Zzz).
import Phaser from 'phaser';
import Animal, { SPRITE_SINK } from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { NEAR_TREES, isTerrainBlocked, inPen, isGate, fenceAxisAt } from '../world/map.js';
import { footTiles } from '../world/collision.js';
import { tr } from '../i18n.js';

const SLEEP_TIME = [5, 10]; // so lange schläft er am Stück
const ALERT_TIME = [2, 3]; // so lange schaut er auf
const WAKE_WARNING = 1.2; // so viele Sekunden vor dem Aufschauen hören die Zzz auf
const NOTICE_DIST = 130; // so nah darf der Spieler beim Aufschauen sein (in Kachel-Proportionen, etwa 4 Kacheln)
const ZZZ_EVERY = 0.9; // so oft steigt ein „Z“ auf
const WALK_SPEED = 1.3; // trottet etwas zügiger als beim normalen Umherlaufen
const WALK_TIMEOUT = 25; // kommt er nicht an, legt er sich trotzdem hin
const ROAR_VOLUME = 0.55;
const PEN_ROAM = [6, 12]; // im Gehege: so lange läuft er herum ...
const PEN_LIE = [5, 9]; // ... so lange liegt er und schaut ...
const PEN_SLEEP = [8, 15]; // ... und so lange schläft er
// Liegebilder: Kopf nach rechts; Fußlinie im Bild
const LIE = { lion_sleep: 48 / 52, lion_alert: 60 / 64 };

export default class Lion extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'lion');
    this.zzzTime = 0;
    this.lieDown(Phaser.Math.FloatBetween(1, SLEEP_TIME[1]));
  }

  // hinlegen und schlafen
  lieDown(time = Phaser.Math.FloatBetween(...SLEEP_TIME)) {
    this.phase = 'sleep';
    this.phaseTime = time;
  }

  // Fangen nur durch Kraulen (Berühren), und nur solange er schläft
  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'sleep';
  }

  // Der Spawner lässt ihn nicht verschwinden, während er wach ist oder unterwegs
  canDespawn() {
    return this.phase === 'sleep';
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return this.updatePen(dt, player);
    if (this.state !== 'wild') return super.updateFree(dt, player);

    this.phaseTime -= dt;
    switch (this.phase) {
      case 'sleep':
        // Zzz, solange er tief schläft (kurz vor dem Aufwachen nicht mehr)
        this.zzzTime -= dt;
        if (this.zzzTime <= 0 && this.phaseTime > WAKE_WARNING) {
          this.spawnZ();
          this.zzzTime = ZZZ_EVERY;
        }
        if (this.phaseTime <= 0) {
          this.phase = 'alert';
          this.phaseTime = Phaser.Math.FloatBetween(...ALERT_TIME);
        }
        return false;
      case 'alert':
        if (Math.hypot(player.x - this.x, (player.y - this.y) * 2) < NOTICE_DIST) {
          this.roar(player);
          return false;
        }
        if (this.phaseTime <= 0) this.lieDown();
        return false;
      default: {
        // zu einer anderen Akazie trotten
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 4 || this.phaseTime <= 0) {
          this.lieDown();
          return false;
        }
        const step = Math.min(d, this.kind.speed * WALK_SPEED * dt);
        const angle = Math.atan2(dy, dx);
        for (const turn of [0, 0.5, -0.5, 1, -1, 1.5, -1.5]) {
          if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) return true;
        }
        return false;
      }
    }
  }

  // Im Gehege: herumlaufen → hinlegen und schauen → manchmal einschlafen → wieder aufstehen
  updatePen(dt, player) {
    if (!['roam', 'alert', 'sleep'].includes(this.phase)) this.startPenPhase('roam');
    this.phaseTime -= dt;
    if (this.phase === 'sleep') {
      this.zzzTime -= dt;
      if (this.zzzTime <= 0) {
        this.spawnZ();
        this.zzzTime = ZZZ_EVERY;
      }
    }
    if (this.phaseTime <= 0) {
      if (this.phase === 'roam') this.startPenPhase(Math.random() < 0.5 ? 'sleep' : 'alert');
      else if (this.phase === 'alert' && Math.random() < 0.5) this.startPenPhase('sleep');
      else this.startPenPhase('roam');
    }
    if (this.phase !== 'roam') return false;
    return super.updateFree(dt, player);
  }

  startFeed() {
    this.phase = 'roam'; // steht auf und kommt
  }

  startPenPhase(phase) {
    this.phase = phase;
    this.phaseTime = Phaser.Math.FloatBetween(...(phase === 'roam' ? PEN_ROAM : phase === 'alert' ? PEN_LIE : PEN_SLEEP));
    if (phase === 'roam') this.pickWander();
    else this.faceX = Math.random() < 0.5 ? -1 : 1;
  }

  // Brüllen (nur der Ton, kein Angriff) und zu einer Akazie weit weg vom Spieler trotten
  roar(player) {
    const scene = this.scene;
    if (scene.cache.audio.exists('lion_roar')) scene.sound.play('lion_roar', { volume: ROAR_VOLUME });
    scene.showToast(tr('Der Löwe hat dich bemerkt und trottet davon. Schleich dich an, solange er schnarcht (Zzz)!', 'The lion noticed you and trots away. Sneak up while it snores (Zzz)!'));
    // unter den Plätzen an Bäumen die am weitesten vom Spieler entfernten
    const spots = NEAR_TREES.map((t) => {
      const p = tileToWorld(t.tx, t.ty);
      return { t, d: Math.hypot(p.x - player.x, (p.y - player.y) * 2) };
    })
      .sort((a, b) => b.d - a.d)
      .slice(0, 12);
    const pick = spots.length ? Phaser.Utils.Array.GetRandom(spots).t : null;
    this.target = pick ? tileToWorld(pick.tx, pick.ty) : { x: this.x, y: this.y };
    this.faceX = Math.sign(this.target.x - this.x) || this.faceX;
    this.faceY = Math.sign(this.target.y - this.y) || this.faceY;
    this.phase = 'walk';
    this.phaseTime = WALK_TIMEOUT;
  }

  // ein „Z“, das über dem Kopf aufsteigt und verblasst
  spawnZ() {
    const x = this.x + this.faceX * 16 + Phaser.Math.Between(-3, 3);
    const y = this.y - 24;
    const z = this.scene.add
      .text(x, y, 'z', { fontFamily: 'Trebuchet MS, Arial', fontSize: '12px', fontStyle: 'bold', color: '#ffffff', stroke: '#2b1d14', strokeThickness: 3, resolution: 4 })
      .setOrigin(0.5)
      .setDepth(100000);
    this.scene.tweens.add({
      targets: z,
      x: x + this.faceX * 8,
      y: y - 18,
      scale: 1.5,
      alpha: 0,
      duration: 1600,
      ease: 'Sine.easeOut',
      onComplete: () => z.destroy(),
    });
  }

  // Der Löwe läuft einfach durch Felsen, Büsche und Bäume hindurch; nur Wasser, Zäune und fremde Gehege halten ihn auf
  blocked(x, y) {
    if (this.state === 'following') return false;
    const tiles = footTiles(x, y, this.kind.footW, 3);
    if (tiles.some(({ tx, ty }) => isTerrainBlocked(tx, ty) || fenceAxisAt(tx, ty))) return true;
    if (this.state === 'penned') return this.enclosureFullyAt(x, y) !== this.enclosure;
    return tiles.some(({ tx, ty }) => inPen(tx, ty) || isGate(tx, ty));
  }

  catch() {
    super.catch();
    this.phase = null;
  }

  restore(state) {
    super.restore(state);
    if (state === 'wild') this.lieDown();
    if (state === 'penned') this.startPenPhase('roam');
  }

  enterPen() {
    super.enterPen();
    this.startPenPhase('roam');
  }

  render(moving) {
    const lying = (this.state === 'wild' || this.state === 'penned') && (this.phase === 'sleep' || this.phase === 'alert');
    if (!lying) {
      // stehend (beim Trotten, Folgen und im Gehege)
      if (this.sprite.texture.key !== this.lookTexture()) this.sprite.setTexture(this.lookTexture(), 0).setOrigin(0.5, this.kind.originY);
      this.sprite.setFlipX(false);
      super.render(moving);
      return;
    }
    // liegend: schlafend oder aufmerksam, Kopf in Blickrichtung
    const key = this.phase === 'sleep' ? 'lion_sleep' : 'lion_alert';
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key, 0).setOrigin(0.5, LIE[key]);
    this.sprite.setFlipX(this.faceX < 0);
    this.sprite.setPosition(this.x, this.y + SPRITE_SINK);
    this.sprite.setAngle(0);
    this.sprite.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y);
    this.shadow.setDepth(this.y - 0.5);
  }
}
