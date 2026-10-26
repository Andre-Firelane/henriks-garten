// Große Wanderung (Event in der Savanne): durch die untere linke Ecke zieht ein riesiger Strom aus Gnus – vor allem eine
// Staubwolke, darin dunkle Gnu-Schatten, alles in Bewegung. Durch den Strom kommt niemand hindurch, und je näher man ihm
// ist, desto mehr wackelt der Boden (der Bildschirm bebt leicht). Ab und zu löst sich oben ein Gnu am rechten Rand des
// Stroms und läuft die ganze Strecke mit der Herde nach unten – solange fängt man es mit dem Lasso.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { worldToTile } from '../world/iso.js';
import { eventBlock, isBlocked, MAP_W, MAP_H } from '../world/map.js';

// Der Strom ist ein Band quer durch die Ecke: Kacheln mit ty - tx zwischen 24 und 30, auf dem Bildschirm ein senkrechter
// Streifen (x zwischen X0 und X1). Er fließt von oben (linker Kartenrand) nach unten (unterer Kartenrand).
const X0 = -30 * 32;
const X1 = -24 * 32;
const Y_TOP = 300; // dort kommen Staub und Gnus herein (über dem Kartenrand) ...
const Y_BOTTOM = 1000; // ... und dort verschwinden sie (unter dem Kartenrand)
const FLOW = 46; // so schnell zieht der Strom (Pixel pro Sekunde)
const DUST = 46; // so viele Staubwolken sind gleichzeitig unterwegs
const SHADOWS = 26; // ... und so viele Gnu-Schatten
const SHAKE_NEAR = 300; // ab diesem Abstand zum Strom bebt der Bildschirm, ...
const SHAKE_PX = 2; // ... ganz nah um so viele Bildschirmpixel (vor allem auf und ab, wie ein Grollen im Boden)
const STRAY_EVERY = [6, 11]; // so oft löst sich ein Gnu aus dem Strom
const STRAY_MAX = 2; // so viele sind höchstens gleichzeitig draußen
const STRAY_SPEED = 30; // seitlich (vom Strom weg und wieder hin) ...
const STRAY_FLOW = FLOW * 1.1; // ... und dabei schnell mit der Herde nach unten
const STRAY_TOP = 360; // dort (oben im Strom, knapp unter dem Kartenrand) tauchen sie auf
const STRAY_WIDTH = 50; // so weit entfernen sie sich höchstens vom Strom (sie tauchen mitten in der Herde auf)
const CALL_EVERY = [4, 8]; // so oft grunzt ein Gnu aus der Herde (Sekunden), ...
const CALL_VOLUME = 0.5; // ... ganz nah so laut, weiter weg leiser

const inStream = (x) => x > X0 && x < X1;

export default class Gnu extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'gnu');
    this.stray = null; // { time, back } – ausgerissen aus dem Strom (Event); sonst ein normales Gnu (z. B. im Gehege)
  }

  // ein ausgerissenes Gnu läuft mitten in der Herde und knapp daneben (der Strom sperrt nur den Spieler und andere Tiere)
  blocked(x, y) {
    if (!this.stray || this.state !== 'wild') return super.blocked(x, y);
    const { tx, ty } = worldToTile(x, y);
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
    const at = eventBlock.at;
    eventBlock.at = null;
    try {
      return super.blocked(x, y);
    } finally {
      eventBlock.at = at;
    }
  }

  // noch beim Untertauchen erwischt: wieder ganz sichtbar
  catch() {
    this.scene.tweens.killTweensOf([this.sprite, this.shadow]);
    this.sprite.setAlpha(1);
    this.shadow.setAlpha(1);
    super.catch();
  }

  // ausgerissen: über dem Staub, damit man es in der Herde sieht
  render(moving) {
    super.render(moving);
    if (this.stray && this.state === 'wild') {
      this.sprite.setDepth(this.y + 150);
      this.shadow.setDepth(this.y + 149.5);
    }
  }

  updateFree(dt, player) {
    const s = this.stray;
    if (this.state !== 'wild' || !s) return super.updateFree(dt, player);
    if (s.back) {
      // taucht in der Staubwolke unter: verblasst und ist fort
      if (!s.gone) {
        s.gone = true;
        this.scene.tweens.add({ targets: [this.sprite, this.shadow], alpha: 0, duration: 600, onComplete: () => this.state === 'wild' && this.scene.despawn(this) });
      }
      return this.move(0, STRAY_FLOW * dt);
    }
    // draußen: läuft schnell mit der Herde nach unten, dabei nur knapp neben dem Strom ein wenig hin und her
    s.turn -= dt;
    if (s.turn <= 0) {
      s.turn = Phaser.Math.FloatBetween(0.6, 1.2);
      s.dir = this.x > X1 + STRAY_WIDTH ? -1 : this.x < X1 - 90 ? 1 : Phaser.Math.FloatBetween(-1, 1); // am rechten Rand bleiben
    }
    // die ganze Strecke mit der Herde: an einem Hindernis seitlich ausweichen, erst unten wieder in den Staub
    if (!this.move(s.dir * STRAY_SPEED * dt, STRAY_FLOW * dt)) {
      s.dir = -s.dir;
      if (!this.move(0, STRAY_FLOW * dt) && !this.move(s.dir * STRAY_SPEED * dt, 0)) s.back = true; // ganz eingeklemmt: zurück in die Herde
    }
    if (this.y > Y_BOTTOM - 120) s.back = true;
    return true;
  }
}

// Steuerung der Großen Wanderung in der Savanne
export class Migration {
  constructor(scene) {
    this.scene = scene;
    eventBlock.at = (x) => inStream(x);
    const tex = dustTexture(scene);
    this.dust = Array.from({ length: DUST }, () => this.makeDust(tex, Phaser.Math.Between(Y_TOP, Y_BOTTOM)));
    this.shadows = Array.from({ length: SHADOWS }, () => this.makeShadow(Phaser.Math.Between(Y_TOP, Y_BOTTOM)));
    this.strayIn = Phaser.Math.FloatBetween(1, STRAY_EVERY[1]);
    this.shakeIn = 0;
    this.callIn = Phaser.Math.FloatBetween(1, CALL_EVERY[0]);
    // wer im Strom steht, kommt heraus: Tiere verschwinden, der Spieler kommt auf die rechte Seite
    for (const a of [...scene.animals]) if (a.state === 'wild' && inStream(a.x)) scene.despawn(a);
    const p = scene.player;
    if (p.x < X1 + 10) p.x = X1 + 30;
  }

  makeDust(tex, y) {
    const img = this.scene.add.image(Phaser.Math.Between(X0 - 30, X1 + 30), y, tex).setScale(Phaser.Math.FloatBetween(1.6, 3)).setAlpha(Phaser.Math.FloatBetween(0.45, 0.7));
    img.drift = Phaser.Math.FloatBetween(-6, 6);
    img.speed = FLOW * Phaser.Math.FloatBetween(0.8, 1.2);
    return img;
  }

  makeShadow(y) {
    const img = this.scene.add.sprite(Phaser.Math.Between(X0 + 10, X1 - 10), y, 'gnu', Phaser.Math.Between(0, 1)).setOrigin(0.5, 92 / 96).setScale(0.5).setTint(0x3a3024).setAlpha(Phaser.Math.FloatBetween(0.35, 0.6));
    img.speed = FLOW * Phaser.Math.FloatBetween(0.9, 1.15);
    img.phase = Math.random() * 10;
    return img;
  }

  // ein Gnu taucht mitten in der Herde auf einer freien Kachel auf (das Lasso reicht vom Rand bis dorthin)
  addStray() {
    const scene = this.scene;
    for (let i = 0; i < 30; i++) {
      // immer oben im Strom (gleich unter dem Kartenrand), damit man genug Zeit hat, es zu fangen; nur wenn dort nichts frei
      // ist, ein Stück weiter unten
      const y = Phaser.Math.Between(STRAY_TOP, STRAY_TOP + 40 + i * 8);
      const x = Phaser.Math.Between(X1 - 80, X1 - 15); // am rechten Rand der Herde (dort reicht das Lasso hin)
      const { tx, ty } = worldToTile(x, y);
      if (tx < 1 || ty < 1 || tx > MAP_W - 2 || ty > MAP_H - 2 || isBlocked(tx, ty)) continue;
      const g = scene.createAnimal('gnu', x, y);
      g.stray = { back: false, turn: 0, dir: 0 };
      g.life = Infinity;
      g.rollSkin('wild');
      g.sprite.setAlpha(0);
      scene.tweens.add({ targets: g.sprite, alpha: 1, duration: 400 });
      return;
    }
  }

  update(dt) {
    const scene = this.scene;
    for (const d of this.dust) {
      d.y += d.speed * dt;
      d.x += d.drift * dt;
      if (d.y > Y_BOTTOM) {
        d.y = Y_TOP;
        d.x = Phaser.Math.Between(X0 - 30, X1 + 30);
      }
      d.setDepth(d.y + 120); // der Staub liegt über den Gnu-Schatten und hüllt Bäume und Steine im Strom ein
    }
    for (const g of this.shadows) {
      g.phase += dt;
      g.y += g.speed * dt;
      if (g.y > Y_BOTTOM) {
        g.y = Y_TOP;
        g.x = Phaser.Math.Between(X0 + 10, X1 - 10);
      }
      g.setFrame(Math.sin(g.phase * 0.5) > 0 ? 0 : 1); // mal nach links, mal nach rechts versetzt
      g.setAngle(Math.sin(g.phase * 9) * 3).setDepth(g.y + 90);
    }
    // Gnus lösen sich ab und zu
    const strays = scene.animals.filter((a) => a.species === 'gnu' && a.state === 'wild' && a.stray);
    this.strayIn -= dt;
    if (this.strayIn <= 0) {
      this.strayIn = Phaser.Math.FloatBetween(...STRAY_EVERY);
      if (strays.length < STRAY_MAX) this.addStray();
    }
    // Grunzen aus der Herde: je näher am Strom, desto lauter
    this.callIn -= dt;
    if (this.callIn <= 0) {
      this.callIn = Phaser.Math.FloatBetween(...CALL_EVERY);
      const d = Math.max(0, scene.player.x - X1);
      if (d < 900 && scene.cache.audio.exists('animal_gnu')) scene.sound.play('animal_gnu', { volume: CALL_VOLUME * Phaser.Math.Clamp(1 - d / 900, 0.15, 1), detune: Phaser.Math.Between(-200, 200) });
    }
    // Beben: je näher am Strom, desto stärker
    this.shakeIn -= dt;
    if (this.shakeIn <= 0) {
      this.shakeIn = 0.25;
      const p = scene.player;
      const d = Math.max(0, Math.min(Math.abs(p.x - X0), Math.abs(p.x - X1)) - (inStream(p.x) ? 999 : 0));
      if (d < SHAKE_NEAR) {
        // Phaser rechnet die Stärke mal Bildschirmgröße und Zoom – hier umgekehrt, damit es überall gleich wenig wackelt
        const cam = scene.cameras.main;
        const px = SHAKE_PX * (1 - d / SHAKE_NEAR);
        cam.shake(300, new Phaser.Math.Vector2((px * 0.3) / (cam.width * cam.zoom), px / (cam.height * cam.zoom)), true);
      }
    }
  }

  // Event vorbei: der Strom ist weitergezogen
  destroy() {
    eventBlock.at = null;
    const scene = this.scene;
    scene.tweens.add({ targets: [...this.dust, ...this.shadows], alpha: 0, duration: 1500, onComplete: () => {} });
    scene.time.delayedCall(1600, () => [...this.dust, ...this.shadows].forEach((o) => o.destroy()));
    for (const a of [...scene.animals]) if (a.species === 'gnu' && a.state === 'wild' && a.stray) scene.despawn(a);
  }
}

// weiche, sandfarbene Staubwolke
function dustTexture(scene) {
  const key = 'migration_dust';
  if (scene.textures.exists(key)) return key;
  const size = 64;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(214,186,138,0.95)');
  g.addColorStop(0.55, 'rgba(200,168,118,0.55)');
  g.addColorStop(1, 'rgba(190,158,108,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}
