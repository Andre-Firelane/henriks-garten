// Wildschwein (Wald, Eichenhain): streift scheu durch den Eichenhain – kommt Henrik zu nah, rennt es weg. Ab und zu trottet
// es zur Suhle (≈), wälzt sich im Schlamm und ist danach eine Weile schlammig ("boar_mud"). Liegen Eicheln in der Nähe
// (aus der Eiche geschüttelt und hingelegt, siehe AcornTool.js), trottet es hin und wühlt danach; solange es frisst,
// achtet es nicht auf Henrik – nur dann fängt man es mit dem Lasso.
// Im Gehege suhlt es sich im Schlammloch (ʬ, siehe updatePen).
// Seltene Variante (Skin boar2, dasselbe Bild): eine Bache mit Frischlingen, die ihr in einer Reihe hinterherlaufen – auch
// wenn man sie fängt und ins Gehege bringt. Die Frischlinge sind nur Begleiter (keine eigenen Tiere, nicht gezählt).
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { LEVEL, MAP_W, MAP_H, charAt, enclosureAt } from '../world/map.js';

const LURE_RANGE = 320; // so weit weg (Welt-Pixel, Höhe doppelt gezählt) riecht es hingelegte Eicheln
const TROT_SPEED = 40; // zu den Eicheln bzw. zur Suhle
const EAT_TIME = [9, 13]; // so lange wühlt es nach den Eicheln
const WALLOW_EVERY = [35, 70]; // so oft geht es sich suhlen (Sekunden) ...
const WALLOW_TIME = [6, 9]; // ... so lange wälzt es sich ...
const MUDDY_TIME = [90, 150]; // ... und so lange bleibt es danach schlammig
const WALLOW_RANGE = 420; // so nah muss die Suhle sein
const ROAM = 200; // so weit streift es von seinem Platz weg
const PIGLETS = [3, 4]; // so viele Frischlinge laufen der Bache hinterher ...
const PIGLET_GAP = 13; // ... mit so viel Abstand (Pixel entlang ihres Wegs)
const MUD_COLORS = [0x5e4128, 0x77543a, 0x4a321e];
const PEN_MUD_SPREAD = 34; // so weit um die Mitte des Schlammlochs im Gehege suhlt es sich
// schlammig: eigene Videos (von hinten nur Laufen, im Stehen dann das Standbild boar_mud)
const MUD_ANIMS = { walkDown: 'boar_mud_walk', walkUp: 'boar_mud_walk_back', idleDown: 'boar_mud_idle' };
const STILLS = ['boar', 'boar2', 'boar_mud', 'boar2_mud']; // Standbilder (alles andere mit "boar" vorne sind Animationen)
const PIGLET_HOLD = 250; // so lange (ms) nach dem letzten Schritt zeigt ein Frischling noch das Laufen (sonst flackert es)

// Suhle (alle Schlammkacheln der Karte und die Schlammlöcher in den Gehegen, einmal je Szene)
function mudTiles(scene) {
  if (scene._mudTiles?.level === LEVEL) return scene._mudTiles.list;
  const list = [];
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) if (charAt(tx, ty) === '≈' || charAt(tx, ty) === 'ʬ') list.push({ ...tileToWorld(tx, ty), pen: enclosureAt(tx, ty) });
  scene._mudTiles = { level: LEVEL, list };
  return list;
}

export default class Boar extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'boar');
    this.phase = 'roam';
    this.wallowIn = Phaser.Math.FloatBetween(10, WALLOW_EVERY[1]);
    this.muddyUntil = 0;
    this.trail = []; // ihr Weg der letzten Schritte (für die Frischlinge)
  }

  get muddy() {
    return this.scene.time.now < this.muddyUntil;
  }

  // schlammig nach dem Suhlen (Bache: dasselbe Bild)
  baseTexture() {
    const base = super.baseTexture();
    return this.muddy ? `${base}_mud` : base;
  }

  // schlammig: die Schlamm-Videos (auch die Bache)
  animSet() {
    const set = super.animSet();
    return set && this.muddy ? MUD_ANIMS : set;
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'eat';
  }

  canDespawn() {
    return this.phase === 'roam';
  }

  shouldFlee(player) {
    if (this.phase !== 'roam') return false; // beim Fressen und Suhlen achtet es nicht auf Henrik
    return super.shouldFlee(player);
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return this.updatePen(dt, player);
    if (this.state !== 'wild') return super.updateFree(dt, player);
    this.leash ??= { x: this.x, y: this.y, r: ROAM };
    if (this.phase === 'roam') {
      // Eicheln in der Nähe? Hin und wühlen
      const acorns = this.scene.pickups.find((p) => p.tool === 'acorns' && !p.collected && !p.claimed && !p.forHedgehog && Math.hypot(p.x - this.x, (p.y - this.y) * 2) < LURE_RANGE);
      if (acorns) {
        acorns.claimed = true;
        this.acorns = acorns;
        this.phase = 'toAcorns';
        this.fleeing = false;
        return false;
      }
      // ab und zu zur Suhle
      this.wallowIn -= dt;
      if (this.wallowIn <= 0) {
        this.wallowIn = Phaser.Math.FloatBetween(...WALLOW_EVERY);
        const near = mudTiles(this.scene).filter((m) => !m.pen && Math.hypot(m.x - this.x, (m.y - this.y) * 2) < WALLOW_RANGE);
        if (near.length && !this.fleeing) {
          this.mudSpot = Phaser.Utils.Array.GetRandom(near);
          this.phase = 'toWallow';
          return false;
        }
      }
      return super.updateFree(dt, player);
    }
    if (this.phase === 'toAcorns') {
      if (this.acorns.collected) return this.backToRoam(); // Henrik hat sie wieder aufgehoben
      const spot = { x: this.acorns.x - Math.sign(this.acorns.x - this.x || 1) * 14, y: this.acorns.y };
      if (this.trotTo(spot, dt)) return true;
      this.phase = 'eat';
      this.phaseTime = Phaser.Math.FloatBetween(...EAT_TIME);
      this.faceX = Math.sign(this.acorns.x - this.x) || this.faceX;
      return false;
    }
    if (this.phase === 'eat') {
      this.phaseTime -= dt;
      this.eatBob = (this.eatBob ?? 0) + dt;
      if (this.phaseTime > 0 && !this.acorns.collected) return false;
      if (!this.acorns.collected) this.scene.eatAcorns?.(this.acorns);
      return this.backToRoam();
    }
    if (this.phase === 'toWallow') {
      if (this.trotTo(this.mudSpot, dt)) return true;
      this.phase = 'wallow';
      this.phaseTime = Phaser.Math.FloatBetween(...WALLOW_TIME);
      return false;
    }
    if (this.phase === 'wallow') {
      this.phaseTime -= dt;
      this.wallowT = (this.wallowT ?? 0) + dt;
      this.splashIn = (this.splashIn ?? 0) - dt;
      if (this.splashIn <= 0) {
        this.splashIn = 0.35;
        this.mudSplash();
      }
      this.muddyUntil = this.scene.time.now + Phaser.Math.FloatBetween(...MUDDY_TIME) * 1000;
      if (this.phaseTime > 0) return false;
      return this.backToRoam();
    }
    return false;
  }

  // im Gehege: herumlaufen wie jedes Tier, ab und zu ins Schlammloch und suhlen
  updatePen(dt, player) {
    if (this.phase === 'toWallow') {
      if (this.trotTo(this.mudSpot, dt)) return true;
      this.phase = 'wallow';
      this.phaseTime = Phaser.Math.FloatBetween(...WALLOW_TIME);
      return false;
    }
    if (this.phase === 'wallow') {
      this.phaseTime -= dt;
      this.wallowT = (this.wallowT ?? 0) + dt;
      this.splashIn = (this.splashIn ?? 0) - dt;
      if (this.splashIn <= 0) {
        this.splashIn = 0.35;
        this.mudSplash();
      }
      this.muddyUntil = this.scene.time.now + Phaser.Math.FloatBetween(...MUDDY_TIME) * 1000;
      if (this.phaseTime > 0) return false;
      this.phase = 'roam';
      this.pickWander();
      return false;
    }
    this.wallowIn -= dt;
    if (this.wallowIn <= 0) {
      this.wallowIn = Phaser.Math.FloatBetween(...WALLOW_EVERY);
      const mine = mudTiles(this.scene).filter((m) => m.pen && m.pen === this.enclosure);
      if (mine.length) {
        const m = Phaser.Utils.Array.GetRandom(mine);
        this.mudSpot = { x: m.x + Phaser.Math.Between(-PEN_MUD_SPREAD, PEN_MUD_SPREAD), y: m.y + Phaser.Math.Between(-PEN_MUD_SPREAD / 2, PEN_MUD_SPREAD / 2) }; // das Schlammloch ist groß
        this.phase = 'toWallow';
        return false;
      }
    }
    return super.updateFree(dt, player);
  }

  backToRoam() {
    this.phase = 'roam';
    this.acorns = null;
    this.leash = { x: this.x, y: this.y, r: ROAM };
    this.pickWander();
    return false;
  }

  // geradewegs hin (die Wege im Eichenhain sind frei genug); false, wenn angekommen
  trotTo(p, dt) {
    const dx = p.x - this.x, dy = p.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 3) return false;
    const step = Math.min(d, TROT_SPEED * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    if (Math.abs(dx) > d * 0.3) this.faceX = Math.sign(dx);
    if (Math.abs(dy) > d * 0.3) this.faceY = Math.sign(dy);
    return true;
  }

  // Schlammspritzer beim Wälzen
  mudSplash() {
    const scene = this.scene;
    for (let i = 0; i < 3; i++) {
      const d = scene.add.ellipse(this.x + Phaser.Math.Between(-12, 12), this.y - Phaser.Math.Between(4, 12), Phaser.Math.FloatBetween(2, 3.5), Phaser.Math.FloatBetween(1.5, 2.5), Phaser.Utils.Array.GetRandom(MUD_COLORS)).setDepth(this.y + 1);
      scene.tweens.add({ targets: d, x: d.x + Phaser.Math.Between(-16, 16), y: d.y - Phaser.Math.Between(6, 14), duration: 260, ease: 'Quad.easeOut', onComplete: () => scene.tweens.add({ targets: d, y: d.y + 12, alpha: 0, duration: 360, ease: 'Quad.easeIn', onComplete: () => d.destroy() }) });
    }
  }

  render(moving) {
    // schlammig oder sauber: das passende Bild (Animal.render wechselt nur zwischen Skin und Fressen). Läuft noch eine
    // Animation des anderen Zustands (gerade sauber bzw. schlammig geworden), zurück aufs Standbild: Animal.render
    // startet dann die passende
    const key = this.baseTexture();
    const tex = this.sprite.texture.key;
    if (STILLS.includes(tex)) {
      if (tex !== key) this.sprite.setTexture(key, this.sprite.frame.name);
    } else if (tex.startsWith('boar') && !Object.values(this.animSet() ?? {}).includes(tex)) {
      this.sprite.stop().setFlipX(false).setTexture(key, 0).setOrigin(0.5, this.kind.originY);
    }
    super.render(moving);
    if (this.state === 'wild' && this.phase === 'eat') this.sprite.setAngle(Math.sin((this.eatBob ?? 0) * 8) * 3 * this.faceX); // wühlt
    if (this.state !== 'following' && this.phase === 'wallow') this.sprite.setAngle(Math.sin(this.wallowT * 5) * 12); // wälzt sich
    this.updatePiglets();
  }

  // Frischlinge der Bache: laufen ihr auf ihrem Weg hinterher, einer hinter dem anderen
  updatePiglets() {
    if (this.texSkin !== 'boar2') return;
    if (!this.piglets) {
      this.piglets = Array.from({ length: Phaser.Math.Between(...PIGLETS) }, () => ({
        sprite: this.scene.add.sprite(this.x, this.y, 'piglet', 0).setOrigin(0.5, 37 / 40).setScale(0.5),
        shadow: this.scene.add.ellipse(this.x, this.y, 14, 5, 0x14320a, 0.3),
        x: this.x, y: this.y, faceX: this.faceX, faceY: this.faceY, walk: Math.random() * 6,
      }));
      this.trail = [];
    }
    const last = this.trail[0];
    if (!last || Math.hypot(last.x - this.x, last.y - this.y) > 2) this.trail.unshift({ x: this.x, y: this.y });
    const need = Math.ceil(((this.piglets.length + 1) * PIGLET_GAP) / 2) + 4;
    if (this.trail.length > need) this.trail.length = need;
    const visible = this.sprite.visible;
    this.piglets.forEach((pg, i) => {
      const at = this.trail[Math.min(this.trail.length - 1, Math.round(((i + 1) * PIGLET_GAP) / 2))] ?? { x: this.x, y: this.y };
      const dx = at.x - pg.x, dy = at.y - pg.y;
      const moved = Math.hypot(dx, dy) > 0.3;
      if (moved) {
        if (Math.abs(dx) > 0.2) pg.faceX = Math.sign(dx);
        if (Math.abs(dy) > 0.2) pg.faceY = Math.sign(dy);
        pg.walk += 0.4;
      }
      pg.x = at.x;
      pg.y = at.y;
      // Videos: Laufen bzw. Stehen, nach links gespiegelt (sonst die Standbilder mit Wippen)
      const now = this.scene.time.now;
      if (moved) pg.lastMove = now;
      const walking = now - (pg.lastMove ?? -Infinity) < PIGLET_HOLD;
      const key = `piglet_${walking ? 'walk' : 'idle'}${pg.faceY > 0 ? '' : '_back'}`;
      if (this.scene.anims.exists(key)) {
        if (!pg.sprite.anims.isPlaying || pg.sprite.anims.currentAnim?.key !== key) {
          // Stehen an zufälliger Stelle beginnen, damit nicht alle Frischlinge im Gleichtakt schnuppern
          pg.sprite.play({ key, startFrame: walking ? 0 : Phaser.Math.Between(0, this.scene.anims.get(key).frames.length - 1) });
        }
        pg.sprite.setFlipX(pg.faceX < 0).setPosition(pg.x, pg.y).setDepth(pg.y).setVisible(visible);
        pg.shadow.setPosition(pg.x, pg.y).setDepth(pg.y - 0.5).setVisible(visible);
        return;
      }
      const frame = pg.faceY > 0 ? (pg.faceX < 0 ? 1 : 0) : pg.faceX > 0 ? 2 : 3;
      const hop = moved ? Math.abs(Math.sin(pg.walk)) * 1.2 : 0;
      pg.sprite.setFrame(frame).setPosition(pg.x, pg.y - hop).setDepth(pg.y).setVisible(visible);
      pg.shadow.setPosition(pg.x, pg.y).setDepth(pg.y - 0.5).setVisible(visible);
    });
  }

  catch() {
    super.catch();
    this.phase = 'roam';
    this.leash = null;
  }

  enterPen() {
    super.enterPen();
    this.phase = 'roam';
  }

  restore(state) {
    super.restore(state);
    this.phase = 'roam';
    this.leash = null;
  }

  destroy() {
    for (const pg of this.piglets ?? []) {
      pg.sprite.destroy();
      pg.shadow.destroy();
    }
    super.destroy();
  }
}
