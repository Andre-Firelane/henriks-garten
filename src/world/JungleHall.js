// Tropenhalle im Tierpark (park3, siehe docs/plan-dschungel.md): der Dschungel-Teil liegt unter einem Glasdach. Von oben
// sieht man durch das Glas hindurch, gezeichnet werden nur die Stahlstreben (hoch über allem, dazu ihr Schatten auf dem
// Boden) und ein paar schräge Lichtstrahlen.
// Sprühnebel: alle paar Minuten geht die Beregnungsanlage an. Feiner Nebel sinkt von der Decke, Tropfen fallen, die
// Blätter glitzern; die Schmetterlinge setzen sich hin, die Aras schütteln sich, und die Besucher in der Halle geben ein
// Herz mehr (siehe Visitor.js). Es ist eine Überlagerung über der laufenden Map (wie der Laternenabend), nichts wird neu
// geladen. Kein Wetter: nur in der Halle zu sehen und zu hören.
import Phaser from 'phaser';
import { tileToWorld, worldToTile } from './iso.js';
import { charAt } from './map.js';

const ROOF_H = 150; // so hoch liegt das Glasdach über dem Boden (Welt-Pixel)
const ROOF_STEP = 4; // alle so viele Kacheln eine Strebe
const ROOF_DEPTH = 98500; // über Bäumen und Tieren, unter Wetter, Nacht und Beschriftungen
const SHADOW_DEPTH = -99950; // flach auf dem Boden (über dem gebackenen Boden)
const SHADOW_SHIFT = { x: 14, y: 7 }; // Schatten etwas versetzt (die Sonne steht schräg)
const RAYS = 7; // so viele Lichtstrahlen
const MIST_EVERY = [200, 280]; // Sekunden zwischen zwei Nebeln ...
const MIST_FIRST = [25, 60]; // ... der erste kommt bald nach dem Ankommen
const MIST_TIME = 30; // so lange sprüht es
const MIST_FADE = 4; // ein- und ausblenden (Sekunden)
const MIST_ALPHA = 0.16; // weißer Schleier über der Halle
const DROPS = 110; // fallende Tropfen
const DROP_SPEED = [55, 85];
const MIST_SOUND = 'ambient_waterfall'; // leises Rauschen (das Wasserfall-Geräusch, viel leiser)
const MIST_VOLUME = 0.22;
const GLITTER_EVERY = 0.12; // so oft glitzert ein Blatt

export default class JungleHall {
  constructor(scene, area) {
    this.scene = scene;
    this.area = area;
    this.level = 0; // 0: kein Nebel, 1: voller Nebel
    this.mistTime = 0;
    this.nextMist = Phaser.Math.FloatBetween(...MIST_FIRST);
    // Dach und Lichtstrahlen nur über der Grundfläche der Halle zeigen (sonst ragen die hohen Streben über die Wand hinaus)
    const shape = scene.make.graphics({ add: false });
    shape.fillStyle(0xffffff, 1);
    shape.fillPoints([tileToWorld(area.tx0 - 0.5, area.ty0 - 0.5), tileToWorld(area.tx1 + 0.5, area.ty0 - 0.5), tileToWorld(area.tx1 + 0.5, area.ty1 + 0.5), tileToWorld(area.tx0 - 0.5, area.ty1 + 0.5)], true);
    this.mask = shape.createGeometryMask();
    this.drawRoof();
    this.drawRays();
    this.fog = scene.add.graphics().setDepth(ROOF_DEPTH - 200).setVisible(false).setMask(this.mask);
    this.dropGfx = scene.add.graphics().setDepth(ROOF_DEPTH - 100).setVisible(false);
    this.drops = Array.from({ length: DROPS }, () => this.newDrop(true));
    this.glitterIn = 0;
    this.plants = [];
    for (let ty = area.ty0; ty <= area.ty1; ty++) for (let tx = area.tx0; tx <= area.tx1; tx++) if ('ľJḢḟnǪ'.includes(charAt(tx, ty))) this.plants.push({ tx, ty, c: charAt(tx, ty) });
    scene.events.once('shutdown', () => {
      this.sound?.destroy();
      this.sound = null;
    });
  }

  // Ecke der Halle (in Kacheln, Kanten auf halben Kacheln)
  corner(tx, ty) {
    return tileToWorld(tx, ty);
  }

  // Stahlstreben des Glasdachs: ein Gitter entlang beider Kachelrichtungen, hoch über der Halle, und ihr Schatten am Boden
  drawRoof() {
    const a = this.area;
    const x0 = a.tx0 - 0.5, x1 = a.tx1 + 0.5, y0 = a.ty0 - 0.5, y1 = a.ty1 + 0.5;
    const roof = this.scene.add.graphics().setDepth(ROOF_DEPTH).setMask(this.mask);
    const shade = this.scene.add.graphics().setDepth(SHADOW_DEPTH);
    const line = (g, p, q, lift, dx, dy) => g.lineBetween(p.x + dx, p.y - lift + dy, q.x + dx, q.y - lift + dy);
    const both = (p, q, main) => {
      roof.lineStyle(main ? 3 : 1.5, 0xe6eef0, main ? 0.32 : 0.22);
      line(roof, p, q, ROOF_H, 0, 0);
      shade.lineStyle(main ? 5 : 3, 0x000000, main ? 0.09 : 0.06);
      line(shade, p, q, 0, SHADOW_SHIFT.x, SHADOW_SHIFT.y);
    };
    for (let tx = x0; tx <= x1 + 0.01; tx += ROOF_STEP) both(this.corner(tx, y0), this.corner(tx, y1), tx === x0);
    both(this.corner(x1, y0), this.corner(x1, y1), true);
    for (let ty = y0; ty <= y1 + 0.01; ty += ROOF_STEP) both(this.corner(x0, ty), this.corner(x1, ty), ty === y0);
    both(this.corner(x0, y1), this.corner(x1, y1), true);
    // Firstlinie in der Mitte (etwas kräftiger)
    const mid = (y0 + y1) / 2;
    both(this.corner(x0, mid), this.corner(x1, mid), true);
  }

  // schräge Lichtstrahlen durchs Glasdach (pulsieren langsam)
  drawRays() {
    const a = this.area;
    this.rays = [];
    for (let i = 0; i < RAYS; i++) {
      const p = tileToWorld(Phaser.Math.FloatBetween(a.tx0 + 3, a.tx1 - 3), Phaser.Math.FloatBetween(a.ty0 + 3, a.ty1 - 3));
      const w = Phaser.Math.FloatBetween(14, 26);
      const g = this.scene.add.graphics().setDepth(ROOF_DEPTH - 300).setBlendMode(Phaser.BlendModes.ADD).setMask(this.mask);
      g.fillStyle(0xfff6d8, 1);
      g.fillPoints([
        { x: p.x - 30, y: p.y - ROOF_H },
        { x: p.x - 30 + w, y: p.y - ROOF_H },
        { x: p.x + w * 1.6, y: p.y },
        { x: p.x - w * 0.4, y: p.y },
      ], true);
      g.setAlpha(0.05);
      this.scene.tweens.add({ targets: g, alpha: 0.11, duration: Phaser.Math.Between(3000, 6000), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 3000), ease: 'Sine.easeInOut' });
      this.rays.push(g);
    }
  }

  // ein Tropfen irgendwo in der Halle, oben unter dem Dach (anywhere: auf beliebiger Höhe)
  newDrop(anywhere) {
    const a = this.area;
    const p = tileToWorld(Phaser.Math.FloatBetween(a.tx0, a.tx1), Phaser.Math.FloatBetween(a.ty0, a.ty1));
    return { x: p.x, y: p.y, h: anywhere ? Phaser.Math.FloatBetween(0, ROOF_H) : ROOF_H, speed: Phaser.Math.FloatBetween(...DROP_SPEED) };
  }

  // sprüht es gerade (genug, dass es die Besucher merken)?
  get misty() {
    return this.level > 0.5;
  }

  // steht Henrik in der Halle?
  playerInside() {
    const { tx, ty } = worldToTile(this.scene.player.x, this.scene.player.y);
    const a = this.area;
    return tx >= a.tx0 && tx <= a.tx1 && ty >= a.ty0 && ty <= a.ty1;
  }

  update(dt) {
    // Ablauf: warten → sprühen (ein- und ausblenden)
    if (this.mistTime > 0) {
      this.mistTime -= dt;
      const t = MIST_TIME - this.mistTime;
      this.level = Phaser.Math.Clamp(Math.min(t / MIST_FADE, this.mistTime / MIST_FADE), 0, 1);
      if (this.mistTime <= 0) {
        this.level = 0;
        this.nextMist = Phaser.Math.FloatBetween(...MIST_EVERY);
      }
    } else {
      this.nextMist -= dt;
      if (this.nextMist <= 0) this.startMist();
    }
    this.updateSound();
    const on = this.level > 0;
    this.fog.setVisible(on);
    this.dropGfx.setVisible(on);
    if (!on) return;
    // Schleier über der Halle
    const a = this.area;
    const x0 = a.tx0 + 0.5, x1 = a.tx1 - 0.5, y0 = a.ty0 + 0.5, y1 = a.ty1 - 0.5;
    this.fog.clear();
    this.fog.fillStyle(0xffffff, MIST_ALPHA * this.level);
    this.fog.fillPoints([tileToWorld(x0, y0), tileToWorld(x1, y0), tileToWorld(x1, y1), tileToWorld(x0, y1)].map((p) => ({ x: p.x, y: p.y - 60 })), true);
    // Tropfen
    const g = this.dropGfx;
    g.clear();
    g.lineStyle(1, 0xffffff, 0.55 * this.level);
    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i];
      d.h -= d.speed * dt;
      if (d.h <= 0) {
        this.drops[i] = this.newDrop(false);
        continue;
      }
      g.lineBetween(d.x, d.y - d.h, d.x, d.y - d.h + 4);
    }
    // glitzernde Blätter
    this.glitterIn -= dt;
    if (this.glitterIn <= 0 && this.plants.length) {
      this.glitterIn = GLITTER_EVERY / Math.max(0.2, this.level);
      this.glitter(Phaser.Utils.Array.GetRandom(this.plants));
    }
  }

  // ein Wassertropfen glitzert kurz auf einer Pflanze
  glitter(t) {
    const s = this.scene;
    if (!s.textures.exists('luck_sparkle')) return;
    const p = tileToWorld(t.tx, t.ty);
    const up = t.c === 'J' ? Phaser.Math.Between(60, 130) : t.c === 'Ḣ' || t.c === 'ḟ' || t.c === 'Ǫ' ? Phaser.Math.Between(20, 50) : Phaser.Math.Between(6, 22);
    const img = s.add.image(p.x + Phaser.Math.Between(-14, 14), p.y - up, 'luck_sparkle').setScale(0.18).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(ROOF_DEPTH - 150);
    s.tweens.add({ targets: img, alpha: 0.9, scale: 0.3, duration: 260, yoyo: true, onComplete: () => img.destroy() });
  }

  // die Beregnungsanlage geht an: die Tiere der Halle reagieren
  startMist() {
    this.mistTime = MIST_TIME;
    const hall = this.area;
    const inside = (a) => {
      const { tx, ty } = worldToTile(a.x, a.y);
      return tx >= hall.tx0 && tx <= hall.tx1 && ty >= hall.ty0 && ty <= hall.ty1;
    };
    for (const a of this.scene.animals) {
      if (a.state !== 'penned' || !inside(a)) continue;
      // Schmetterlinge suchen sich gleich eine Blüte bzw. einen Obstteller
      if (a.species === 'butterfly' && a.mode === 'fly') a.modeTime = 0;
      // Aras und Tukane schütteln sich (die Federn werden nass)
      // (über toyAngle, das Animal.placeSprite jedes Bild übernimmt)
      if (a.species === 'macaw' || a.species === 'toucan') {
        this.scene.time.delayedCall(Phaser.Math.Between(1500, 6000), () => {
          if (!a.sprite?.active) return;
          this.scene.tweens.add({ targets: a, toyAngle: { from: -9, to: 9 }, duration: 90, yoyo: true, repeat: 4, onComplete: () => (a.toyAngle = null) });
        });
      }
    }
  }

  // leises Rauschen, nur in der Halle zu hören (lädt beim ersten Mal nach)
  updateSound() {
    const s = this.scene;
    const want = this.level * (this.playerInside() ? 1 : 0);
    if (!want && !this.sound) return;
    if (!s.cache.audio.exists(MIST_SOUND)) {
      if (this.loading) return;
      this.loading = true;
      s.load.audio(MIST_SOUND, `assets/sounds/${MIST_SOUND}.mp3`);
      s.load.start();
      return;
    }
    if (!this.sound) {
      this.sound = s.sound.add(MIST_SOUND, { loop: true, volume: 0 });
      this.sound.play();
      this.vol = 0;
    }
    this.vol += (want - this.vol) * Math.min(1, s.game.loop.delta / 600);
    this.sound.setVolume(MIST_VOLUME * this.vol);
  }
}
