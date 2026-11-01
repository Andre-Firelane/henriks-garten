// Leguan (Dschungel, nur bei normalem Wetter, nur am Wasserfall oben links): versteckt sich im Gebüsch rund ums Becken.
// Scheint die Sonne auf den Wasserfall (siehe WaterfallSun.js), kommt er kurz danach heraus und sonnt sich auf den
// Steinen bzw. am Ufer des Beckens. Dann fängt man ihn mit dem Kescher. Kommt man zu nah an ihn bzw. seinen Stein,
// plumpst er ins Wasser und ist weg. Zieht die Sonne weg, kriecht er zurück ins Versteck. Höchstens LEVEL.waterfallSun.iguanas gleichzeitig.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { LEVEL, charAt, isBlocked } from '../world/map.js';

const HIDE_IN = ['Ď', 'n', 'ľ', 'ḟ', 'f', 'q']; // Verstecke: Dickicht, Farn, Bodenpflanzen, Blumen, hohes Gras
const EMERGE = [2, 4]; // so viele Sekunden nach dem Sonnenaufgang kommt er heraus
const ON_ROCK = { O: 15, r: 9 }; // so hoch liegt er auf einem Stein (große Sonnensteine am Becken, kleine Steine)
const TOUCH = 16; // so nah (Kachel-Proportionen) heran: er plumpst ins Wasser ...
const ROCK_NEAR = 40; // ... auf dem Stein schon so nah (an den Stein kommt man nicht heran; der Kescher reicht weiter)
const PLOP_TIME = 0.55; // so lange dauert der Sprung ins Wasser
const PLOP_UP = 14; // so hoch springt er dabei
const FADE = 0.4; // so schnell (Sekunden) taucht er aus dem Versteck auf bzw. verschwindet darin
const BACK_RUSH = 1.4; // zurück ins Versteck etwas schneller

export default class Iguana extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'iguana');
    this.mode = 'hide'; // wild: 'hide' → 'out' → 'bask' → 'back' → 'hide'; oder 'plop'
    this.lift = 0;
    this.seen = 0; // 0..1 sichtbar
  }

  // Fläche um den Wasserfall (LEVEL.waterfallSun) als Kacheln
  static zoneTiles() {
    const z = LEVEL.waterfallSun;
    const list = [];
    if (!z) return list;
    for (let ty = z.ty0; ty <= z.ty1; ty++) for (let tx = z.tx0; tx <= z.tx1; tx++) list.push({ tx, ty });
    return list;
  }

  // Wasser des Beckens neben einer Kachel?
  static byPool(tx, ty) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (charAt(tx + dx, ty + dy) === '~') return true;
    return false;
  }

  // Sonnenplätze: die großen Sonnensteine am Becken (er liegt obendrauf); gibt es keine, kleine Steine und freie Uferkacheln
  static baskSpots() {
    const spots = [];
    for (const { tx, ty } of Iguana.zoneTiles()) {
      const c = charAt(tx, ty);
      if (c === '~' || !Iguana.byPool(tx, ty)) continue;
      const p = tileToWorld(tx, ty);
      if (ON_ROCK[c]) spots.push({ key: `${tx},${ty}`, x: p.x, y: p.y + 1, lift: ON_ROCK[c], rock: true, big: c === 'O' });
      else if (!isBlocked(tx, ty) || c === 'Ď') spots.push({ key: `${tx},${ty}`, x: p.x, y: p.y, lift: 0 });
    }
    const big = spots.filter((s) => s.big);
    return big.length ? big : spots;
  }

  // ein Leguan in einem Versteck am Wasserfall (unsichtbar, bis die Sonne kommt)
  static spawnHidden(scene) {
    const taken = new Set(scene.animals.filter((a) => a.species === 'iguana' && a.hide).map((a) => a.hide.key));
    const hides = Iguana.zoneTiles().filter(({ tx, ty }) => HIDE_IN.includes(charAt(tx, ty)) && !Iguana.byPool(tx, ty) && !taken.has(`${tx},${ty}`));
    const t = Phaser.Utils.Array.GetRandom(hides);
    if (!t) return [];
    const p = tileToWorld(t.tx, t.ty);
    const a = scene.createAnimal('iguana', p.x, p.y);
    a.hide = { key: `${t.tx},${t.ty}`, x: p.x, y: p.y };
    return [a];
  }

  canBeCaughtNow() {
    return this.state === 'wild' && (this.mode === 'out' || this.mode === 'bask' || this.mode === 'back') && this.seen > 0.5;
  }

  canBeCaughtWith(tool) {
    return tool === 'net' && this.canBeCaughtNow();
  }

  canDespawn() {
    return this.mode === 'hide';
  }

  shouldFlee() {
    return false;
  }

  // auf dem Weg zwischen Versteck und Sonnenplatz kriecht er durch Gebüsch und auf Steine
  blocked(x, y) {
    if (this.state === 'wild') return false;
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') {
      this.lift = 0;
      this.seen = 1;
      return super.updateFree(dt, player);
    }
    const sun = this.scene.waterfallSun;
    const shining = !!sun?.shining;
    if (this.mode === 'plop') return this.updatePlop(dt);
    // sichtbar: kommt man ihm (bzw. seinem Stein) zu nah, plumpst er ins Wasser
    const near = this.mode === 'bask' && this.spot?.rock ? ROCK_NEAR : TOUCH;
    if (this.mode !== 'hide' && Math.hypot(player.x - this.x, (player.y - this.y) * 2) < near) return this.startPlop();
    if (this.mode === 'hide') {
      this.seen = Math.max(0, this.seen - dt / FADE);
      if (!shining) {
        this.emergeIn = null;
        return false;
      }
      this.emergeIn ??= Phaser.Math.FloatBetween(...EMERGE);
      if (sun.time < this.emergeIn) return false;
      const spot = this.freeSpot();
      if (!spot) return false;
      this.spot = spot;
      this.mode = 'out';
      return false;
    }
    this.seen = Math.min(1, this.seen + dt / FADE);
    if (!shining && this.mode !== 'back') this.mode = 'back';
    if (this.mode === 'bask') return false;
    const to = this.mode === 'out' ? this.spot : this.hide;
    const speed = this.kind.speed * (this.mode === 'back' ? BACK_RUSH : 1);
    const dx = to.x - this.x;
    const dy = to.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = Math.min(d, speed * dt);
    // kurz vor dem Stein hinauf, auf dem Rückweg gleich wieder herunter
    const goal = this.mode === 'out' && d < 14 ? to.lift : 0;
    const climb = (Math.max(to.lift ?? 0, this.lift) / 0.4) * dt;
    this.lift += Phaser.Math.Clamp(goal - this.lift, -climb, climb);
    if (d < 1) {
      if (this.mode === 'out') {
        this.mode = 'bask';
        this.lift = to.lift;
        this.faceY = 1;
      } else {
        this.mode = 'hide';
        this.spot = null;
        this.emergeIn = null;
        this.lift = 0;
      }
      return false;
    }
    this.move((dx / d) * step, (dy / d) * step);
    return true;
  }

  // ein freier Sonnenplatz (nicht von einem anderen Leguan belegt), bevorzugt ein Stein in der Nähe
  freeSpot() {
    const taken = new Set(this.scene.animals.filter((a) => a !== this && a.species === 'iguana' && a.spot).map((a) => a.spot.key));
    const free = Iguana.baskSpots().filter((s) => !taken.has(s.key));
    if (!free.length) return null;
    const near = (s) => Math.hypot(s.x - this.x, s.y - this.y) - (s.rock ? 40 : 0);
    free.sort((a, b) => near(a) - near(b));
    return Phaser.Utils.Array.GetRandom(free.slice(0, 2));
  }

  // berührt: mit einem Satz ins nächste Wasser des Beckens, dann ist er weg
  startPlop() {
    let best = null;
    const { tx: hx, ty: hy } = worldToTile(this.x, this.y);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (charAt(hx + dx, hy + dy) !== '~') continue;
        const p = tileToWorld(hx + dx, hy + dy);
        const d = Math.hypot(p.x - this.x, p.y - this.y);
        if (!best || d < best.d) best = { x: p.x, y: p.y, d };
      }
    }
    this.mode = 'plop';
    this.plop = { from: { x: this.x, y: this.y, lift: this.lift }, to: best ?? this.hide, t: 0, water: !!best };
    this.faceX = Math.sign(this.plop.to.x - this.x) || this.faceX;
    return true;
  }

  updatePlop(dt) {
    const p = this.plop;
    p.t = Math.min(1, p.t + dt / PLOP_TIME);
    this.x = p.from.x + (p.to.x - p.from.x) * p.t;
    this.y = p.from.y + (p.to.y - p.from.y) * p.t;
    this.lift = p.from.lift * (1 - p.t) + Math.sin(p.t * Math.PI) * PLOP_UP;
    if (p.t >= 1 && !p.done) {
      p.done = true;
      if (p.water) this.splash();
      this.scene.despawn(this);
    }
    return true;
  }

  // Platscher: Ring auf dem Wasser und ein paar Tropfen
  splash() {
    const scene = this.scene;
    const ring = scene.add.ellipse(this.x, this.y + 2, 16, 6).setStrokeStyle(1.5, 0xffffff, 0.9).setDepth(this.y - 1);
    scene.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 600, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    for (let i = 0; i < 6; i++) {
      const d = scene.add.circle(this.x, this.y, Phaser.Math.FloatBetween(1, 2), 0xd8f2ff, 0.9).setDepth(this.y + 1);
      scene.tweens.add({ targets: d, x: this.x + Phaser.Math.Between(-12, 12), y: this.y - Phaser.Math.Between(8, 16), alpha: 0, duration: 450, ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
  }

  catch() {
    this.mode = null;
    this.spot = null;
    this.lift = 0;
    this.seen = 1;
    super.catch();
  }

  restore(state) {
    super.restore(state);
    if (state !== 'wild') this.seen = 1;
  }

  render(moving) {
    super.render(moving && this.mode !== 'plop');
    const wild = this.state === 'wild';
    const alpha = wild ? this.seen : 1;
    this.sprite.setVisible(alpha > 0).setAlpha(alpha);
    this.shadow.setVisible(alpha > 0).setAlpha(alpha);
    if (!wild || !this.lift) return;
    this.sprite.setY(this.sprite.y - this.lift);
    this.sprite.setDepth(this.y + 4); // auf dem Stein vor dem Stein gezeichnet
  }
}
