// Tanuki (Bambuswald, im Tal bei den Steinlaternen): verkleidet sich als Steinlaterne, Busch oder Grasbüschel und steht
// dann still neben einer echten Laterne. Verraten wird er nur vom buschigen Schwanz, der seitlich herausschaut, und
// ab und zu wackelt die Verkleidung. Berührt man sie, löst sie sich in einer Rauchwolke auf: der Tanuki hopst verdutzt
// ein Stück zurück und sitzt da – berührt man ihn jetzt, ist er gefangen. Wartet man zu lange, flitzt er davon und
// verkleidet sich woanders. Eine Stelle, an der gerade einer gefangen wurde, bleibt eine Weile frei.
// Im Gehege läuft er herum und verkleidet sich ab und zu kurz als Laterne.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { LEVEL, MAP_W, MAP_H, charAt, inPen, isBlocked } from '../world/map.js';
import { isActive } from '../world/events.js';

// Verkleidungen: Bild, Fußpunkt, Anteil, wie oft, und wie weit der Schwanz neben der Mitte herausschaut
const DISGUISES = [
  { key: 'stone_lantern', originY: 58 / 64, weight: 2, tailX: 13 },
  { key: 'dark_bush', originY: 36 / 44, weight: 1, tailX: 14 },
  { key: 'tall_grass', originY: 40 / 48, weight: 1, tailX: 12 },
];
const TAIL_SCALE = 0.42; // tanuki_tail ist in doppelter Auflösung; etwas größer als am Tier, damit man ihn findet
const REVEAL_DIST = 24; // so nah muss man die Verkleidung berühren
const HOP_BACK = 30; // so weit hopst er nach dem Auffliegen zurück (weiter als die Fangweite, also noch einmal berühren)
const CATCH_DELAY = 0.5; // so lange nach dem Auffliegen lässt er sich noch nicht fangen
const DAZED_TIME = 7; // so lange sitzt er verdutzt da
const DASH_SPEED = 95; // dann flitzt er davon ...
const DASH_TIME = 1.1; // ... so lange, und verschwindet
const WIGGLE_EVERY = [3, 7]; // so oft wackelt die Verkleidung
const SPOT_REST = 90; // an einer Stelle, an der einer gefangen wurde, verkleidet sich so lange (Sekunden) keiner
const MIN_NEW_SPOT = 6; // so viele Kacheln weit weg (vom Spieler) verkleidet er sich nach der Flucht neu
const PEN_DISGUISE_EVERY = [40, 80]; // im Gehege: so oft verkleidet er sich ...
const PEN_DISGUISE_TIME = [8, 14]; // ... und so lange
const LANTERN_DISGUISE_EVERY = [10, 20]; // beim Laternenabend im Tierpark sind sie munter: viel öfter

export default class Tanuki extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'tanuki');
    this.phase = null; // wild: 'hidden' → 'dazed' → 'dash' → 'hidden'; im Gehege null bzw. 'hidden'
  }

  // freie Plätze direkt neben Steinlaternen (nicht im Gehege bzw. nur im eigenen)
  static spots(pen = null) {
    const list = [];
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        if (charAt(tx, ty) !== '.' || isBlocked(tx, ty)) continue;
        if (pen ? !pen.tileSet.has(tx + ',' + ty) : inPen(tx, ty)) continue;
        let lantern = false;
        for (let dy = -1; dy <= 1 && !lantern; dy++) for (let dx = -1; dx <= 1; dx++) if (charAt(tx + dx, ty + dy) === 'l') lantern = true;
        if (lantern) list.push({ tx, ty });
      }
    }
    return list;
  }

  // an einem freien Platz verkleiden; gibt zurück, ob einer frei war. away: Abstand zu diesem Punkt (Kacheln)
  hideSomewhere(away = null) {
    const now = this.scene.time.now;
    const recent = (this.scene.tanukiCaughtAt ?? []).filter((r) => r.until > now);
    this.scene.tanukiCaughtAt = recent;
    const taken = this.scene.animals.filter((a) => a !== this && a.species === 'tanuki' && a.spot).map((a) => a.spot);
    const free = Tanuki.spots().filter((t) => ![...taken, ...recent].some((u) => Math.abs(u.tx - t.tx) + Math.abs(u.ty - t.ty) < 3));
    const far = away ? free.filter((t) => Math.hypot(t.tx - away.tx, t.ty - away.ty) >= MIN_NEW_SPOT) : free;
    const spot = Phaser.Utils.Array.GetRandom(far.length ? far : free);
    if (!spot) return false;
    this.hideAt(spot);
    return true;
  }

  hideAt(spot, disguise = null) {
    this.spot = spot;
    const p = tileToWorld(spot.tx, spot.ty);
    this.x = p.x;
    this.y = p.y;
    this.phase = 'hidden';
    this.sprite.setAlpha(1);
    const d = disguise ?? this.pickDisguise();
    this.disguise?.destroy();
    this.tail?.destroy();
    const side = Math.random() < 0.5 ? -1 : 1;
    this.disguise = this.scene.add.image(p.x, p.y, d.key).setOrigin(0.5, d.originY).setDepth(p.y);
    // der Schwanz schaut unten seitlich hinter der Verkleidung hervor
    const tailKey = `${this.texSkin ?? 'tanuki'}_tail`;
    this.tail = this.scene.add
      .image(p.x + side * d.tailX, p.y - 3, this.scene.textures.exists(tailKey) ? tailKey : 'tanuki_tail')
      .setOrigin(side < 0 ? 0.8 : 0.2, 0.9)
      .setScale(TAIL_SCALE)
      .setFlipX(side > 0)
      .setDepth(p.y - 1);
    this.wiggleIn = Phaser.Math.FloatBetween(...WIGGLE_EVERY);
  }

  pickDisguise() {
    let r = Math.random() * DISGUISES.reduce((s, d) => s + d.weight, 0);
    return DISGUISES.find((d) => (r -= d.weight) <= 0) ?? DISGUISES[0];
  }

  // die Verkleidung wackelt kurz, der Schwanz zuckt
  wiggle() {
    this.scene.tweens.add({ targets: this.disguise, angle: { from: -4, to: 4 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => this.disguise?.setAngle(0) });
    this.scene.tweens.add({ targets: this.tail, angle: { from: 0, to: this.tail.flipX ? 18 : -18 }, duration: 160, yoyo: true, repeat: 1 });
  }

  unmask() {
    this.disguise?.destroy();
    this.tail?.destroy();
    this.disguise = null;
    this.tail = null;
  }

  // Rauchwolke, in der sich die Verkleidung auflöst
  smoke() {
    for (let i = 0; i < 12; i++) {
      const r = Phaser.Math.FloatBetween(4, 8);
      const c = this.scene.add.circle(this.x + Phaser.Math.Between(-8, 8), this.y - Phaser.Math.Between(4, 26), r, i % 3 ? 0xf2f2ee : 0xd8d8d0, 0.95).setDepth(this.y + 2);
      this.scene.tweens.add({
        targets: c,
        x: c.x + Phaser.Math.Between(-16, 16),
        y: c.y - Phaser.Math.Between(6, 18),
        scale: 1.6,
        alpha: 0,
        duration: Phaser.Math.Between(450, 750),
        ease: 'Quad.easeOut',
        onComplete: () => c.destroy(),
      });
    }
  }

  // berührt: Verkleidung weg, verdutzt ein Stück zurückhopsen
  reveal(player) {
    this.smoke();
    this.unmask();
    this.phase = 'dazed';
    this.phaseTime = DAZED_TIME;
    this.catchDelay = CATCH_DELAY;
    const a = Math.atan2(this.y - player.y, this.x - player.x);
    const to = { x: this.x + Math.cos(a) * HOP_BACK, y: this.y + Math.sin(a) * HOP_BACK * 0.5 };
    const { tx, ty } = worldToTile(to.x, to.y);
    if (isBlocked(tx, ty)) to.x = this.x - Math.cos(a) * 4; // kein Platz: nur ein kleiner Satz
    this.faceX = Math.sign(player.x - this.x) || 1;
    this.faceY = 1;
    this.hopY = 0;
    this.scene.tweens.add({ targets: this, x: to.x, y: to.y, duration: 380, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this, hopY: 10, duration: 190, yoyo: true, ease: 'Quad.easeOut' });
    this.bubble('❓', 1400, to);
  }

  // kein freier Platz zum Verkleiden: einfach sitzen bleiben (lässt sich dann fangen)
  sitDazed() {
    this.phase = 'dazed';
    this.phaseTime = DAZED_TIME;
    this.catchDelay = 0;
    this.sprite.setAlpha(1);
  }

  // nicht gefangen: davonflitzen und woanders neu verkleiden
  dash(player) {
    this.phase = 'dash';
    this.phaseTime = DASH_TIME;
    const a = Math.atan2(this.y - player.y, this.x - player.x) + Phaser.Math.FloatBetween(-0.6, 0.6);
    this.dirX = Math.cos(a);
    this.dirY = Math.sin(a) * 0.5;
    this.faceX = Math.sign(this.dirX) || 1;
    this.faceY = this.dirY > 0 ? 1 : -1;
  }

  // kleines Zeichen über dem Kopf, an der Stelle at (sonst dort, wo er gerade ist)
  bubble(text, ms, at = this) {
    const t = this.scene.add.text(at.x, at.y - 34, text, { fontSize: '16px', resolution: 4 }).setOrigin(0.5).setDepth(100000);
    this.scene.tweens.add({ targets: t, y: t.y - 8, duration: ms, onComplete: () => t.destroy() });
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'dazed' && this.catchDelay <= 0;
  }

  canDespawn() {
    return this.phase === 'hidden';
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild' && this.phase === 'dash') return false; // flitzt einfach hindurch (und ist gleich weg)
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state === 'penned') return this.updatePen(dt, player);
    if (this.phase === 'hidden') {
      this.wiggleIn -= dt;
      if (this.wiggleIn <= 0) {
        this.wiggleIn = Phaser.Math.FloatBetween(...WIGGLE_EVERY);
        this.wiggle();
      }
      if (Math.hypot(player.x - this.x, player.y - this.y) < REVEAL_DIST) this.reveal(player);
      return false;
    }
    if (this.phase === 'dazed') {
      this.catchDelay -= dt;
      this.phaseTime -= dt;
      if (this.phaseTime <= 0) this.dash(player);
      return false;
    }
    if (this.phase === 'dash') {
      this.phaseTime -= dt;
      this.x += this.dirX * DASH_SPEED * dt;
      this.y += this.dirY * DASH_SPEED * dt;
      this.sprite.setAlpha(Math.min(1, this.phaseTime / 0.4));
      if (this.phaseTime <= 0 && !this.hideSomewhere(worldToTile(player.x, player.y))) this.sitDazed();
      return true;
    }
    // (ohne Phase, z. B. gerade erst erzeugt): sofort verkleiden
    if (!this.hideSomewhere()) this.sitDazed();
    return false;
  }

  // im Gehege: herumlaufen, ab und zu kurz als Laterne verkleiden
  updatePen(dt, player) {
    if (this.phase === 'hidden') {
      this.phaseTime -= dt;
      this.wiggleIn -= dt;
      if (this.wiggleIn <= 0) {
        this.wiggleIn = Phaser.Math.FloatBetween(...WIGGLE_EVERY);
        this.wiggle();
      }
      if (this.phaseTime > 0) return false;
      this.smoke();
      this.unmask();
      this.phase = null;
      this.spot = null;
      this.pickWander();
      return false;
    }
    this.disguiseIn = (this.disguiseIn ?? Phaser.Math.FloatBetween(5, PEN_DISGUISE_EVERY[1])) - dt;
    if (this.disguiseIn <= 0) {
      this.disguiseIn = Phaser.Math.FloatBetween(...(isActive('lanterns') && LEVEL.lanterns ? LANTERN_DISGUISE_EVERY : PEN_DISGUISE_EVERY));
      const { tx, ty } = worldToTile(this.x, this.y);
      this.smoke();
      this.hideAt({ tx, ty }, DISGUISES[0]);
      this.phaseTime = Phaser.Math.FloatBetween(...PEN_DISGUISE_TIME);
      return false;
    }
    return super.updateFree(dt, player);
  }

  catch() {
    if (this.state === 'wild' && this.spot) (this.scene.tanukiCaughtAt ??= []).push({ ...this.spot, until: this.scene.time.now + SPOT_REST * 1000 });
    this.scene.tweens.killTweensOf(this);
    this.unmask();
    this.phase = null;
    this.spot = null;
    this.hopY = 0;
    this.sprite.setAlpha(1);
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.unmask();
    this.phase = null;
    this.spot = null;
  }

  enterPen() {
    super.enterPen();
    this.unmask();
    this.phase = null;
    this.spot = null;
  }

  render(moving) {
    const hidden = this.phase === 'hidden';
    this.sprite.setVisible(!hidden);
    this.shadow.setVisible(!hidden);
    super.render(moving);
    if (this.hopY) this.sprite.setY(this.sprite.y - this.hopY);
  }

  destroy() {
    this.unmask();
    super.destroy();
  }
}
