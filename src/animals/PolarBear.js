// Eisbär (Eiswelt, nur nachts; siehe spawn in levels.js unter ice.seasons.night): streift über das zugefrorene Meer und
// hält Abstand zu Henrik (langsamer als er, aber so kommt man nicht an ihn heran). Fangen (docs/plan-eiswelt.md): einen
// selbst geangelten großen Fisch an ein Eisloch legen (placeBearFish in IceCatch.js). Der Bär trottet hin, frisst ihn
// (polarbear_wait) und legt sich danach satt hin und döst (polarbear_sleep, bis es das Bild gibt das sitzende mit 💤).
// Jetzt zählt der Wind (IceCatch.js): Weht er von Henrik zum Bären, schnuppert der Bär erst (fangbar), dann steht er auf,
// trottet ein Stück von Henrik weg und legt sich dort wieder hin. Kommt Henrik von der anderen Seite, reicht Berühren.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { worldToTile, tileToWorld } from '../world/iso.js';
import { MAP_W, MAP_H, charAt } from '../world/map.js';

const SIZE = 0.5; // (das Bild ist in voller Größe gezeichnet, 1,35-fach wie früher bei 0,75: so bleibt es scharf)
const BABY_SIZE = 0.27;
const TO_BAIT_SPEED = 1.6; // so viel schneller als sonst trottet er zum Fisch
const ARRIVED = 10; // so nah am Fisch: angekommen
const EAT_TIME = 4; // so lange frisst er
const SLEEP_TIME = 180; // so lange döst er danach (dann streift er wieder umher)
const SNORE_EVERY = 2.6; // so oft steigt beim Dösen ein 💤 auf
const SMELL_DIST = 320; // so weit riecht er Henrik mit dem Wind (Kachel-Proportionen, y doppelt)
const SNIFF_TIME = 2.5; // so lange schnuppert er, bevor er aufsteht
const WARY_DIST = 230; // steht Henrik so nah am Fisch, traut sich der Bär nicht heran ...
const WARY_STOP = 260; // ... und wartet so weit vom Fisch, bis Henrik weggeht
const SHIFT_DIST = 190; // so weit trottet er danach weg, bevor er sich wieder hinlegt
const GROWL_DIST = 600; // so weit hört man ihn brummen ...
const GROWL_VOLUME = 0.55; // ... ganz nah so laut
const SHIFT_MAX = 8; // spätestens nach so vielen Sekunden legt er sich wieder hin (falls etwas im Weg ist)

export default class PolarBear extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'polarbear');
    this.sprite.setScale(SIZE);
    this.mode = 'roam'; // 'roam' → 'bait' → 'eat' → 'sleep' ⇄ 'sniff' → 'shift' → 'sleep' … → 'roam'
    this.modeTime = 0;
    this.sleepLeft = 0;
    this.sniff = 0;
    this.snoreIn = 0;
  }

  get resting() {
    return this.mode === 'sleep' || this.mode === 'sniff';
  }

  // offenes Wasser (Eislöcher) oder Kartenrand?
  water(x, y) {
    const { tx, ty } = worldToTile(x, y);
    return tx < 1 || ty < 1 || tx > MAP_W - 2 || ty > MAP_H - 2 || charAt(tx, ty) === '~';
  }

  // wild geht er überall durch (Felsen, Bäume, Schollen …), nur nicht ins Wasser und nicht aus der Karte: so bleibt er
  // nirgends hängen
  blocked(x, y) {
    if (this.state === 'wild') return this.water(x, y);
    return super.blocked(x, y);
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.resting;
  }

  canDespawn() {
    return this.mode === 'roam' && this.scene.bearBait?.bear !== this;
  }

  shouldFlee(player) {
    if (this.mode !== 'roam') return false;
    return super.shouldFlee(player);
  }

  // Weg um das Wasser herum (Breitensuche über die Kacheln, nur über Kacheln ohne Wasser): Liste von Kachel-Mitten bis
  // kurz vor das Ziel, oder null, wenn es keinen gibt
  findPath(gx, gy) {
    const s = worldToTile(this.x, this.y);
    const g = worldToTile(gx, gy);
    if (s.tx === g.tx && s.ty === g.ty) return [];
    const key = (x, y) => y * MAP_W + x;
    const from = new Map([[key(s.tx, s.ty), -1]]);
    const queue = [[s.tx, s.ty]];
    const free = (x, y) => x >= 1 && y >= 1 && x <= MAP_W - 2 && y <= MAP_H - 2 && charAt(x, y) !== '~';
    for (let i = 0; i < queue.length && i < 4000; i++) {
      const [x, y] = queue[i];
      if (x === g.tx && y === g.ty) {
        const path = [];
        for (let k = key(x, y); k !== -1; k = from.get(k)) path.unshift(tileToWorld(k % MAP_W, Math.floor(k / MAP_W)));
        path.shift(); // die eigene Kachel
        path.pop(); // die Ziel-Kachel: dort geht es direkt zum Ziel
        return path;
      }
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const k = key(nx, ny);
        // die Ziel-Kachel darf auch Wasser sein (Fisch direkt am Loch)
        if (from.has(k) || (!free(nx, ny) && !(nx === g.tx && ny === g.ty))) continue;
        from.set(k, key(x, y));
        queue.push([nx, ny]);
      }
    }
    return null;
  }

  // auf den Weg zum Fisch bzw. weg: um Eislöcher herum (findPath); kommt er trotzdem nicht voran, geht er einfach
  // geradeaus hinüber – er darf nie hängenbleiben
  walkTo(tx, ty, speed, dt) {
    const d = Math.hypot(tx - this.x, ty - this.y);
    if (d < 1) return d;
    // Weg neu suchen, wenn sich das Ziel ändert oder alle 2 Sekunden
    this.pathAge = (this.pathAge ?? 99) + dt;
    if (!this.path || this.pathFor?.x !== tx || this.pathFor?.y !== ty || this.pathAge > 2) {
      if (this.pathFor?.x !== tx || this.pathFor?.y !== ty) this.bestD = Infinity; // neues Ziel
      this.path = this.findPath(tx, ty) ?? [];
      this.pathFor = { x: tx, y: ty };
      this.pathAge = 0;
    }
    while (this.path.length && Math.hypot(this.path[0].x - this.x, this.path[0].y - this.y) < 6) this.path.shift();
    const goal = this.path[0] ?? { x: tx, y: ty };
    const dx = goal.x - this.x;
    const dy = goal.y - this.y;
    const gd = Math.hypot(dx, dy) || 1;
    const step = Math.min(gd, speed * dt);
    this.faceX = dx < 0 ? -1 : 1;
    this.faceY = dy < 0 ? -1 : 1;
    // Fortschritt prüfen: kommt er 1,5 Sekunden lang nicht näher ans Ziel, geht er 1 Sekunde lang einfach geradeaus
    if (this.pushLeft > 0) this.pushLeft -= dt;
    else if (this.move((dx / gd) * step, (dy / gd) * step)) {
      if (d < (this.bestD ?? Infinity) - 4) {
        this.bestD = d;
        this.stuckFor = 0;
      } else if ((this.stuckFor = (this.stuckFor ?? 0) + dt) > 1.5) {
        this.pushLeft = 1;
        this.stuckFor = 0;
        this.bestD = Infinity;
      }
      return d;
    }
    this.x += (dx / gd) * step;
    this.y += (dy / gd) * step;
    return d;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    const scene = this.scene;
    if (this.mode === 'eat') {
      this.modeTime -= dt;
      if (this.modeTime <= 0) {
        this.mode = 'sleep';
        this.sleepLeft = SLEEP_TIME;
        this.waryShown = false;
        scene.bearAsleep?.(this);
      }
      return false;
    }
    if (this.resting || this.mode === 'shift') {
      this.sleepLeft -= dt;
      if (this.sleepLeft <= 0) {
        this.mode = 'roam'; // ausgeschlafen: streift wieder umher
        return false;
      }
    }
    if (this.resting) {
      this.snoreIn -= dt;
      if (this.mode === 'sleep' && this.snoreIn <= 0) {
        this.snoreIn = SNORE_EVERY;
        const t = scene.add.text(this.x + 22, this.y - 54, '💤', { fontSize: '14px', resolution: 4 }).setOrigin(0.5).setDepth(100000).setAlpha(0.9);
        scene.tweens.add({ targets: t, y: t.y - 14, x: t.x + 6, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
      }
      // riecht er Henrik? (der Wind weht von Henrik zu ihm)
      const smells = scene.iceCatch?.smells(player, this, SMELL_DIST);
      if (smells) {
        if (this.mode === 'sleep') {
          this.mode = 'sniff';
          this.showSniff();
        }
        this.sniff += dt;
        if (this.sniff >= SNIFF_TIME) this.startShift(player);
      } else {
        this.sniff = Math.max(0, this.sniff - dt);
        if (this.mode === 'sniff' && this.sniff <= 0) this.mode = 'sleep';
      }
      return false;
    }
    if (this.mode === 'shift') {
      this.modeTime -= dt;
      const d = this.walkTo(this.shiftTo.x, this.shiftTo.y, this.kind.speed * TO_BAIT_SPEED, dt);
      if (d < ARRIVED || this.modeTime <= 0) {
        this.mode = 'sleep';
        this.sniff = 0;
      }
      return true;
    }
    // liegt ein Fisch am Eisloch und holt ihn noch kein anderer: hin
    const bait = scene.bearBait;
    if (bait && (!bait.bear || bait.bear === this || !scene.animals.includes(bait.bear))) {
      bait.bear = this;
      this.mode = 'bait';
      // steht Henrik am Fisch, traut er sich nicht heran: wartet in einigem Abstand und schaut herüber
      const henrikAtBait = Math.hypot(player.x - bait.x, (player.y - bait.y) * 2) < WARY_DIST;
      const toBait = Math.hypot(this.x - bait.x, (this.y - bait.y) * 2);
      if (henrikAtBait && toBait < WARY_STOP) {
        this.faceX = player.x < this.x ? -1 : 1;
        this.faceY = player.y < this.y ? -1 : 1;
        if (!this.waryShown) {
          this.waryShown = true;
          scene.bearWary?.(this);
        }
        return false;
      }
      const d = this.walkTo(bait.x, bait.y, this.kind.speed * TO_BAIT_SPEED, dt);
      if (d < ARRIVED) {
        this.mode = 'eat';
        this.modeTime = EAT_TIME;
        this.growl(player);
        this.faceX = bait.hole.x < this.x ? -1 : 1;
        this.faceY = 1;
        scene.bearArrived?.(this);
        return false;
      }
      return true;
    }
    if (this.mode === 'bait') this.mode = 'roam'; // Fisch weg (z. B. Tag geworden)
    return super.updateFree(dt, player);
  }

  // gerochen: aufstehen und ein Stück von Henrik weg trotten, dort wieder hinlegen
  startShift(player) {
    // weg von Henrik, auf eine Stelle, die kein Wasser ist (sonst ein anderer Winkel)
    const away = Math.atan2(this.y - player.y, this.x - player.x);
    this.shiftTo = null;
    for (const turn of [0, 0.5, -0.5, 1, -1, 1.5, -1.5]) {
      const a = away + turn + Phaser.Math.FloatBetween(-0.2, 0.2);
      const to = { x: this.x + Math.cos(a) * SHIFT_DIST, y: this.y + (Math.sin(a) * SHIFT_DIST) / 2 };
      if (!this.water(to.x, to.y)) {
        this.shiftTo = to;
        break;
      }
    }
    this.shiftTo ??= { x: this.x, y: this.y };
    this.mode = 'shift';
    this.modeTime = SHIFT_MAX;
    this.sniff = 0;
    this.growl(player);
    this.scene.bearSmelled?.(this);
  }

  // Brummen (animal_polarbear), je näher Henrik ist, desto lauter
  growl(player) {
    const scene = this.scene;
    const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
    if (d > GROWL_DIST || !scene.cache.audio.exists('animal_polarbear')) return;
    scene.sound.play('animal_polarbear', { volume: GROWL_VOLUME * (0.3 + 0.7 * (1 - d / GROWL_DIST)), detune: Phaser.Math.Between(-80, 80) });
  }

  // schnuppert: kleines "?" über dem Kopf
  showSniff() {
    const t = this.scene.add.text(this.x + 16 * this.faceX, this.y - 66, '?', { fontFamily: 'Trebuchet MS, Arial', fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#33465c', strokeThickness: 4, resolution: 4 }).setOrigin(0.5).setDepth(100000);
    this.scene.tweens.add({ targets: t, y: t.y - 10, alpha: { from: 1, to: 0 }, duration: 1400, onComplete: () => t.destroy() });
  }

  catch() {
    this.mode = 'roam';
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.mode = 'roam';
  }

  render(moving) {
    super.render(moving);
    this.sprite.setScale(this.baby ? BABY_SIZE : SIZE);
    const f = this.kind.frames;
    const frame = this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
    const wild = this.state === 'wild';
    // liegt: eigenes Bild, falls es das schon gibt (sonst sitzend wie beim Fressen); schnuppert: sitzt auf
    const sleepKey = this.scene.textures.exists('polarbear_sleep') ? 'polarbear_sleep' : 'polarbear_wait';
    const key = wild && this.mode === 'sleep' ? sleepKey : wild && (this.mode === 'eat' || this.mode === 'sniff') ? 'polarbear_wait' : null;
    if (key) this.sprite.setTexture(key, frame).setFlipX(false);
    else if (this.sprite.texture.key !== 'polarbear') this.sprite.setTexture('polarbear', frame);
  }
}
