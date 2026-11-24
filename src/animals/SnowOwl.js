// Schneeeule (Eiswelt, nur nachts; immer genau eine, siehe updateOwl in IceCatch.js): sitzt oben in einer verschneiten
// Tanne der Taiga – zu sehen ist sie nicht, nur zu hören. Ab und zu ruft sie ("Huu – hu-hu-huu"):
// je näher Henrik ist, desto lauter. Weiter weg erscheint bei jedem Ruf ein kleines "Huu ♪" neben Henrik, auf der Seite,
// aus der es kommt (zeigt die Richtung, auch für das Spielen ohne Ton); ist er nah, ruft sie öfter und das "Huu ♪"
// steigt genau an ihrem Platz auf (neben einem Felsen, Eisblock oder einer Tanne). Beim ersten Ruf eine kurze Meldung. Stellt Henrik die Laterne in ihrer Nähe ab, sieht man
// sie im Licht – dann fängt man sie mit dem Kescher oder durch Berühren (wie beim Hyänen-Hörspiel und der Elch-Laterne).
// Folgt sie Henrik, fliegt sie (snowowl_fly, nur die Vorderansicht, siehe tools/static-sheet.py).
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { MAP_W, MAP_H, charAt, inPen, isBlocked } from '../world/map.js';
import { tr } from '../i18n.js';
import { inHall, resetHallFlight, updateHallFlight } from './hallFlight.js';

const LIGHT_DIST = 110; // so nah (Kachel-Proportionen, y doppelt) muss die abgestellte Laterne stehen
const CALL_EVERY = [9, 16]; // so oft ruft sie (Sekunden)
const HEAR = 650; // so weit hört man sie (Kachel-Proportionen, y doppelt) ...
const NEAR = 300; // ... und so nah steigt an ihrem Platz ein "Huu ♪" auf (weiter weg zeigt eins neben Henrik die Richtung)
const CALL_NEAR = [4, 7]; // so oft ruft sie, wenn Henrik nah ist
const HINT_R = 46; // so weit neben Henrik erscheint das Richtungs-"Huu ♪"
const CALL_VOLUME = 0.6;
const PINE = 'Ṗ'; // in solchen verschneiten Tannen sitzt sie ...
const PERCH_UP = 46; // ... so hoch in den Zweigen (Welt-Pixel über dem Fuß der Tanne)
const SPOT_AWAY = 8; // so weit (Kacheln) weg von Henrik sucht sie sich einen Platz
const FLY_LIFT = 14; // so hoch fliegt sie, wenn sie Henrik folgt
const FLY_BOB = 3; // ... und so stark schwingt sie dabei auf und ab

export default class SnowOwl extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'snowowl');
    this.spot = null;
    this.lit = false;
    this.callIn = Phaser.Math.FloatBetween(2, 6);
  }

  // Platz oben in einer verschneiten Tanne der Taiga, an die Henrik herankommt (eine freie Kachel daneben), weg von ihm
  perchSomewhere(away) {
    const free = (tx, ty) => !isBlocked(tx, ty) && !inPen(tx, ty);
    const list = [];
    for (let ty = 2; ty < MAP_H - 2; ty++) {
      for (let tx = 2; tx < MAP_W - 2; tx++) {
        if (charAt(tx, ty) !== PINE || (away && Math.hypot(tx - away.tx, ty - away.ty) < SPOT_AWAY)) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => free(tx + dx, ty + dy))) list.push({ tx, ty });
      }
    }
    const spot = Phaser.Utils.Array.GetRandom(list);
    if (!spot) return false;
    this.spot = spot;
    const p = tileToWorld(spot.tx, spot.ty);
    this.x = p.x;
    this.y = p.y;
    this.faceX = Math.random() < 0.5 ? -1 : 1;
    this.faceY = 1;
    return true;
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.lit;
  }

  canDespawn() {
    return !this.lit;
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild') return false;
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (inHall(this)) return updateHallFlight(this, dt, () => super.updateFree(dt, player)); // Polarhalle im Tierpark
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (!this.spot && !this.perchSomewhere(worldToTile(player.x, player.y))) return false;
    const l = this.scene.lantern;
    this.lit = !!l && Math.hypot(l.x - this.x, (l.y - this.y) * 2) < LIGHT_DIST;
    if (this.lit && l) this.faceX = l.x < this.x ? -1 : 1;
    this.faceY = 1;
    if (!this.lit) {
      this.callIn -= dt;
      if (this.callIn <= 0) {
        const near = Math.hypot(player.x - this.x, (player.y - this.y) * 2) < NEAR;
        this.callIn = Phaser.Math.FloatBetween(...(near ? CALL_NEAR : CALL_EVERY));
        this.hoot(player);
      }
    }
    return false;
  }

  // Ruf: lauter, je näher Henrik ist; nah dran steigt an ihrem Platz ein "Huu ♪" auf; beim ersten Mal eine Meldung
  hoot(player) {
    const scene = this.scene;
    const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
    if (d > HEAR) return;
    if (scene.cache.audio.exists('animal_snowowl')) scene.sound.play('animal_snowowl', { volume: CALL_VOLUME * Phaser.Math.Clamp(1 - d / HEAR, 0.12, 1), detune: Phaser.Math.Between(-80, 80) });
    const style = { fontFamily: 'Trebuchet MS, Arial', fontSize: '12px', fontStyle: 'bold', color: '#fff8e6', stroke: '#1a2040', strokeThickness: 3, resolution: 4 };
    if (d < NEAR) {
      // nah: genau an ihrem Platz
      const t = scene.add.text(this.x, this.y - 30 - PERCH_UP, tr('Huu ♪', 'Hoo ♪'), style).setOrigin(0.5).setDepth(100000).setAlpha(0);
      scene.tweens.add({ targets: t, alpha: { from: 0, to: 0.9 }, y: t.y - 16, duration: 900, yoyo: true, hold: 600, onComplete: () => t.destroy() });
    } else {
      // weiter weg: neben Henrik, in ihrer Richtung (leiser, je weiter weg)
      const a = Math.atan2(this.y - player.y, this.x - player.x);
      const t = scene.add.text(player.x + Math.cos(a) * HINT_R, player.y - 30 + Math.sin(a) * HINT_R * 0.6, tr('Huu ♪', 'Hoo ♪'), style).setOrigin(0.5).setDepth(100000).setAlpha(0);
      const k = Phaser.Math.Clamp(1 - d / HEAR, 0.35, 1);
      scene.tweens.add({ targets: t, alpha: { from: 0, to: 0.85 * k }, x: t.x + Math.cos(a) * 14, y: t.y + Math.sin(a) * 8, duration: 900, yoyo: true, hold: 400, onComplete: () => t.destroy() });
    }
    if (!scene.owlHeard) {
      scene.owlHeard = true;
      scene.showToast(tr('🦉 Eine Schneeeule ruft! Geh dem „Huu“ nach – steigt es direkt auf, stell dort die Laterne ab.', '🦉 A snowy owl is calling! Follow the “Hoo” – where it rises right up, put the lantern down.'));
    }
  }

  catch() {
    this.spot = null;
    this.lit = false;
    this.sprite.setAlpha(1);
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.spot = null;
    resetHallFlight(this);
  }

  enterPen() {
    super.enterPen();
    this.spot = null;
  }

  render(moving) {
    super.render(moving);
    if (this.state === 'wild') {
      // nur im Laternenlicht zu sehen, oben in der Tanne (vor den Zweigen)
      this.sprite.setVisible(this.lit);
      this.shadow.setVisible(false);
      if (this.sprite.texture.key !== 'snowowl') this.sprite.setTexture('snowowl', this.faceX < 0 ? 1 : 0);
      if (this.spot) this.sprite.setY(this.y - PERCH_UP).setDepth(this.y + 2);
      return;
    }
    // in der Polarhalle: oben auf einem Felsen bzw. einer Tanne, im Flug zum nächsten Platz (Vorderansicht)
    if (inHall(this) && this.hallUp) {
      const f = this.kind.frames;
      const flying = !!this.hallFlight && this.scene.textures.exists('snowowl_fly');
      if (flying) this.sprite.setTexture('snowowl_fly', this.faceX < 0 ? 1 : 0).setFlipX(false);
      else this.sprite.setTexture('snowowl', this.faceX < 0 ? f.downLeft : f.downRight).setFlipX(false);
      this.sprite.setY(this.sprite.y - this.hallUp).setDepth(this.y + 60);
      this.shadow.setVisible(!!this.hallFlight);
      return;
    }
    // folgt sie Henrik und ist unterwegs: fliegen (nur Vorderansicht, nach links bzw. rechts)
    const fly = this.state === 'following' && moving && this.scene.textures.exists('snowowl_fly');
    if (fly) {
      this.sprite.setTexture('snowowl_fly', this.faceX < 0 ? 1 : 0).setFlipX(false);
      this.sprite.setY(this.sprite.y - FLY_LIFT - Math.sin(this.scene.time.now / 160) * FLY_BOB);
    } else if (this.sprite.texture.key === 'snowowl_fly') {
      const f = this.kind.frames;
      this.sprite.setTexture('snowowl', this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft);
    }
  }
}
