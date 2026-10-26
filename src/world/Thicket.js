// Dickicht im Dschungel (Zeichen Ď): versperrt den Weg. Steht Henrik davor, schlägt er es mit der Aktionstaste mit der
// Machete weg – egal, welches Werkzeug er gerade trägt (die Werkzeugleiste zeigt dann die Machete). Danach wächst es langsam wieder nach: erst ein Stumpf, dann ein junger
// Busch (beides begehbar), nach 3 Minuten ist es wieder dicht. Steht jemand darauf, wartet es, bis er weg ist.
// Der Zustand (wann welche Kachel geschlagen wurde) wird mit dem Gebiet gespeichert und wächst nach der echten Uhr weiter.
import Phaser from 'phaser';
import { tileToWorld, worldToTile } from './iso.js';
import { thicketBlock } from './map.js';

const STUMP_MS = 60 * 1000; // so lange ist nur ein Stumpf zu sehen ...
const GROWN_MS = 3 * 60 * 1000; // ... und so lange dauert es, bis es wieder dicht ist
const REACH = 20; // so weit vor Henrik (in Blickrichtung) schlägt er zu
const FOOT_SIDE = 8; // ... und so weit links und rechts davon
const COOLDOWN = 0.35; // Sekunden zwischen zwei Schlägen
const SWING_MS = 260;
const STAGE_KEY = ['thicket_cut', 'thicket_small', 'thicket'];

export default class Thicket {
  // images: Map "tx,ty" → Bild des Dickichts (beim Aufbau der Karte erzeugt); cut: gespeicherte { "tx,ty": Zeitpunkt }
  constructor(scene, images, cut = {}) {
    this.scene = scene;
    this.images = images;
    this.cut = { ...cut };
    this.cooldown = 0;
    this.checkIn = 0;
    this.target = new Map(); // Kacheln, die ein Schlag gerade treffen würde
    for (const k of Object.keys(this.cut)) if (!images.has(k)) delete this.cut[k];
    thicketBlock.at = (tx, ty) => this.stage(tx + ',' + ty) === 2;
    this.refresh();
    scene.events.once('shutdown', () => {
      if (thicketBlock.at) thicketBlock.at = null;
    });
  }

  // 0 Stumpf, 1 junger Busch, 2 dicht
  stage(k) {
    const t = this.cut[k];
    if (t == null) return 2;
    const age = Date.now() - t;
    return age < STUMP_MS ? 0 : age < GROWN_MS ? 1 : 2;
  }

  refresh() {
    for (const [k, img] of this.images) {
      const s = this.stage(k);
      if (s === 2 && this.cut[k] != null) {
        if (this.occupied(k)) continue; // erst zuwachsen, wenn niemand mehr darauf steht
        delete this.cut[k];
      }
      const key = STAGE_KEY[s];
      if (img.texture.key !== key && this.scene.textures.exists(key)) img.setTexture(key);
    }
  }

  // steht Henrik oder ein Tier auf dieser Kachel?
  occupied(k) {
    const [tx, ty] = k.split(',').map(Number);
    const on = (o) => {
      const t = worldToTile(o.x, o.y);
      return t.tx === tx && t.ty === ty;
    };
    return on(this.scene.player) || (this.scene.animals ?? []).some((a) => a.state !== 'penned' && on(a));
  }

  // gibt zurück, ob sich geändert hat, ob Henrik vor dichtem Dickicht steht (dann zeigt die Werkzeugleiste die Machete)
  update(dt) {
    this.cooldown -= dt;
    this.checkIn -= dt;
    if (this.checkIn <= 0) {
      this.checkIn = 1;
      this.refresh();
    }
    const had = this.target.size > 0;
    this.target = this.ahead();
    return had !== this.target.size > 0;
  }

  // dichtes Dickicht direkt vor Henrik (Mitte und beide Seiten seiner Füße, sonst bliebe er an den Ecken hängen)
  ahead() {
    const p = this.scene.player;
    const hit = new Map();
    if (p.boat) return hit;
    const ax = p.aimX ?? p.faceX;
    const ay = p.aimY ?? p.faceY;
    for (const side of [-1, 0, 1]) {
      const { tx, ty } = worldToTile(p.x + ax * REACH + side * FOOT_SIDE, p.y + ay * REACH * 0.8);
      const k = tx + ',' + ty;
      if (this.images.has(k) && this.stage(k) === 2) hit.set(k, { tx, ty });
    }
    return hit;
  }

  // Aktionstaste: zuschlagen
  strike() {
    if (this.cooldown > 0 || !this.target.size) return;
    this.cooldown = COOLDOWN;
    this.swing();
    for (const [k, { tx, ty }] of this.target) this.chop(k, tx, ty);
    const [first] = this.target.values();
    this.scene.thicketCut?.(first.tx, first.ty); // vielleicht schreckt ein Tier auf
    this.target = this.ahead();
  }

  chop(k, tx, ty) {
    this.cut[k] = Date.now();
    const img = this.images.get(k);
    if (this.scene.textures.exists('thicket_cut')) img.setTexture('thicket_cut');
    // Blätter fliegen
    const c = tileToWorld(tx, ty);
    for (let i = 0; i < 9; i++) {
      const leaf = this.scene.add.ellipse(c.x + Phaser.Math.Between(-10, 10), c.y - Phaser.Math.Between(4, 18), 4, 2, Phaser.Utils.Array.GetRandom([0x3f7a2a, 0x5a9a34, 0x2e5e20]), 1).setDepth(c.y + 20).setAngle(Phaser.Math.Between(0, 180));
      this.scene.tweens.add({
        targets: leaf,
        x: leaf.x + Phaser.Math.Between(-26, 26),
        y: leaf.y + Phaser.Math.Between(-16, 10),
        angle: leaf.angle + Phaser.Math.Between(-200, 200),
        alpha: 0,
        duration: Phaser.Math.Between(500, 900),
        ease: 'Quad.easeOut',
        onComplete: () => leaf.destroy(),
      });
    }
    if (this.scene.cache.audio.exists('whoosh')) this.scene.sound.play('whoosh', { volume: 0.35, detune: Phaser.Math.Between(-200, 100) });
  }

  // die Machete schwingt kurz vor Henrik von oben nach unten; das getragene Werkzeug ist so lange nicht zu sehen
  swing() {
    const scene = this.scene;
    const p = scene.player;
    const tool = scene.tool?.sprite;
    tool?.setAlpha(0);
    const side = p.faceX;
    const m = scene.add.image(p.x + side * 10, p.sprite.y - 18, 'machete').setScale(0.5).setOrigin(0.5, 0.9).setFlipX(side < 0).setDepth(p.y + (p.faceY > 0 ? 1 : -1));
    m.setAngle(-side * 70);
    scene.tweens.add({
      targets: m,
      angle: side * 60,
      duration: SWING_MS,
      ease: 'Quad.easeIn',
      onComplete: () => {
        m.destroy();
        tool?.setAlpha(1);
      },
    });
  }

  // zum Speichern
  state() {
    return { ...this.cut };
  }

  destroy() {
    thicketBlock.at = null;
  }
}
