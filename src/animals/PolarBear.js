// Eisbär (Eiswelt, nur nachts; siehe spawn in levels.js unter ice.seasons.night): streift über das zugefrorene Meer und
// hält Abstand zu Henrik (langsamer als er, aber so kommt man nicht an ihn heran). Fangen (docs/plan-eiswelt.md): einen
// selbst geangelten großen Fisch an ein Eisloch legen (placeBearFish in IceCatch.js). Der Bär trottet hin, frisst ihn
// (polarbear_wait) eine Weile. Dabei will er seine Ruhe: Ein Ring auf dem Eis zeigt, wie weit Henrik wegbleiben muss.
// Kommt Henrik näher, hört er auf zu fressen, steht auf, schaut herüber und brummt; erst wenn Henrik wieder weg ist,
// frisst er weiter (eine Uhr über dem Kopf zeigt, wie lange noch). Satt legt er sich hin und schläft (polarbear_sleep,
// 💤): Jetzt hingehen und streicheln (berühren) fängt ihn.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { worldToTile, tileToWorld } from '../world/iso.js';
import { MAP_W, MAP_H, charAt } from '../world/map.js';

const SIZE = 0.5; // (das Bild ist in voller Größe gezeichnet, 1,35-fach wie früher bei 0,75: so bleibt es scharf)
const BABY_SIZE = 0.27;
const SHADOW_UP = 3; // der Schatten liegt so weit hinter der Fußlinie ...
const SLEEP_SHADOW_UP = 11; // ... liegend weiter, unter dem Bauch (die Pfoten liegen ganz vorne)
const SLEEP_SHADOW = 1.15; // liegend ist er länger als stehend
const TO_BAIT_SPEED = 1.6; // so viel schneller als sonst trottet er zum Fisch
const ARRIVED = 10; // so nah am Fisch: angekommen
const EAT_TIME = 18; // so lange frisst er (Sekunden, die Zeit läuft nur, solange Henrik weg bleibt)
const KEEP_AWAY = 220; // beim Fressen muss Henrik so weit weg bleiben (Kachel-Proportionen, y doppelt; der Ring)
const RING_DEPTH = -99988; // der Ring liegt auf dem Eis (über der Ablagestelle)
const CLOCK_UP = 62; // so hoch über den Füßen die Uhr ...
const CLOCK_SIDE = 44; // ... und so weit neben der Mitte (über dem Kopf schwebt schon die Hand)
const GROWL_AGAIN = 3; // frühestens nach so vielen Sekunden brummt er wieder
const SLEEP_TIME = 180; // so lange schläft er danach (dann streift er wieder umher)
const SNORE_EVERY = 2.6; // so oft steigt beim Schlafen ein 💤 auf
const WARY_DIST = 230; // steht Henrik so nah am Fisch, traut sich der Bär nicht heran ...
const WARY_STOP = 260; // ... und wartet so weit vom Fisch, bis Henrik weggeht
const GROWL_DIST = 600; // so weit hört man ihn brummen ...
const GROWL_VOLUME = 0.55; // ... ganz nah so laut

export default class PolarBear extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'polarbear');
    this.sprite.setScale(SIZE);
    this.mode = 'roam'; // 'roam' → 'bait' → 'eat' → 'sleep' → 'roam'
    this.modeTime = 0;
    this.sleepLeft = 0;
    this.snoreIn = 0;
    this.disturbed = false; // beim Fressen: Henrik ist zu nah
    this.growlIn = 0;
  }

  get resting() {
    return this.mode === 'sleep';
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
      this.updateEat(dt, player);
      return false;
    }
    if (this.resting) {
      this.sleepLeft -= dt;
      if (this.sleepLeft <= 0) {
        this.mode = 'roam'; // ausgeschlafen: streift wieder umher
        return false;
      }
      this.snoreIn -= dt;
      if (this.snoreIn <= 0) {
        this.snoreIn = SNORE_EVERY;
        const t = scene.add.text(this.x + 22, this.y - 54, '💤', { fontSize: '14px', resolution: 4 }).setOrigin(0.5).setDepth(100000).setAlpha(0.9);
        scene.tweens.add({ targets: t, y: t.y - 14, x: t.x + 6, alpha: 0, duration: 1800, onComplete: () => t.destroy() });
      }
      return false;
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
        this.disturbed = false;
        this.growlIn = 0;
        this.eatFaceX = bait.hole.x < this.x ? -1 : 1;
        this.faceX = this.eatFaceX;
        this.faceY = 1;
        this.showEatMarks();
        scene.bearArrived?.(this);
        return false;
      }
      return true;
    }
    if (this.mode === 'bait') this.mode = 'roam'; // Fisch weg (z. B. Tag geworden)
    return super.updateFree(dt, player);
  }

  // frisst: die Zeit läuft nur, solange Henrik draußen vor dem Ring bleibt; ist er zu nah, steht er auf, schaut und brummt
  updateEat(dt, player) {
    const near = Math.hypot(player.x - this.x, (player.y - this.y) * 2) < this.keepAway;
    this.growlIn -= dt;
    if (near) {
      this.faceX = player.x < this.x ? -1 : 1;
      this.faceY = player.y < this.y ? -1 : 1;
      if (!this.disturbed && this.growlIn <= 0) {
        this.growlIn = GROWL_AGAIN;
        this.growl(player);
        this.showAlert();
        this.scene.bearDisturbed?.(this);
      }
    } else {
      if (this.disturbed) {
        this.faceX = this.eatFaceX ?? this.faceX;
        this.faceY = 1;
      }
      this.modeTime -= dt;
    }
    this.disturbed = near;
    this.drawEatMarks();
    if (this.modeTime <= 0) {
      this.hideEatMarks();
      this.mode = 'sleep';
      this.sleepLeft = SLEEP_TIME;
      this.snoreIn = 0.6;
      this.waryShown = false;
      this.scene.bearAsleep?.(this);
    }
  }

  // Ring auf dem Eis (so weit muss Henrik weg bleiben) und Uhr über dem Kopf (so lange frisst er noch)
  showEatMarks() {
    this.hideEatMarks();
    this.ring = this.scene.add.graphics().setDepth(RING_DEPTH);
    this.clock = this.scene.add.graphics().setDepth(100000);
    this.marksFor = null;
  }

  drawEatMarks() {
    if (!this.ring) return;
    // den Ring nur neu zeichnen, wenn er die Farbe wechselt (rot, solange Henrik drinnen ist)
    if (this.marksFor !== this.disturbed) {
      this.marksFor = this.disturbed;
      const col = this.disturbed ? 0xe0684a : 0x5b88b0; // ruhig: blaugrau (weiß sähe man auf dem Schnee nicht)
      const r = this.ring.clear();
      r.fillStyle(col, this.disturbed ? 0.12 : 0.06).fillEllipse(0, 0, this.keepAway * 2, this.keepAway);
      // gestrichelter Rand
      const n = 36;
      r.lineStyle(3, col, this.disturbed ? 0.85 : 0.7);
      for (let i = 0; i < n; i += 2) {
        const a0 = (i / n) * Math.PI * 2;
        const a1 = ((i + 1) / n) * Math.PI * 2;
        r.beginPath();
        r.moveTo(Math.cos(a0) * this.keepAway, Math.sin(a0) * this.keepAway * 0.5);
        for (let k = 1; k <= 4; k++) {
          const a = a0 + ((a1 - a0) * k) / 4;
          r.lineTo(Math.cos(a) * this.keepAway, Math.sin(a) * this.keepAway * 0.5);
        }
        r.strokePath();
      }
    }
    this.ring.setPosition(this.x, this.y);
    // Uhr: am Anfang voll, beim Fressen wird sie leer
    const left = Phaser.Math.Clamp(this.modeTime / EAT_TIME, 0, 1);
    const c = this.clock.clear().setPosition(this.x - CLOCK_SIDE * this.sizeK * (this.eatFaceX ?? 1), this.y - CLOCK_UP * this.sizeK);
    c.fillStyle(0x33465c, 0.35).fillCircle(0, 1, 10);
    c.fillStyle(0xfffaf0, 0.95).fillCircle(0, 0, 10);
    if (left > 0.01) {
      c.fillStyle(this.disturbed ? 0xe0684a : 0x6fa8d8, 1);
      c.slice(0, 0, 8, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2, false);
      c.fillPath();
    }
    c.lineStyle(1.5, 0x33465c, 0.8).strokeCircle(0, 0, 10);
  }

  hideEatMarks() {
    this.ring?.destroy();
    this.clock?.destroy();
    this.ring = null;
    this.clock = null;
  }

  // gestört: kleines "!" über dem Kopf
  showAlert() {
    const t = this.scene.add.text(this.x + 18 * this.faceX, this.y - 70, '!', { fontFamily: 'Trebuchet MS, Arial', fontSize: '20px', fontStyle: 'bold', color: '#ffffff', stroke: '#a8442c', strokeThickness: 4, resolution: 4 }).setOrigin(0.5).setDepth(100001);
    this.scene.tweens.add({ targets: t, y: t.y - 10, alpha: { from: 1, to: 0 }, duration: 1400, onComplete: () => t.destroy() });
  }

  // Brummen (animal_polarbear), je näher Henrik ist, desto lauter
  growl(player) {
    const scene = this.scene;
    const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
    if (d > GROWL_DIST || !scene.cache.audio.exists('animal_polarbear')) return;
    scene.sound.play('animal_polarbear', { volume: GROWL_VOLUME * (0.3 + 0.7 * (1 - d / GROWL_DIST)), detune: Phaser.Math.Between(-80, 80) });
  }

  catch() {
    this.hideEatMarks();
    this.mode = 'roam';
    super.catch();
  }

  destroy() {
    this.hideEatMarks();
    super.destroy();
  }

  restore(state) {
    super.restore(state);
    this.hideEatMarks();
    this.mode = 'roam';
  }

  // frisst er ungestört am Eisloch: Fress-Animation (liegt und knabbert am Fisch); schläft: Standbild
  animKey(moving) {
    if (this.state === 'wild' && this.mode === 'sleep') return null;
    if (this.state === 'wild' && this.mode === 'eat' && !this.disturbed) {
      const eat = `${this.base}_eat`; // (großer Eisbär: polarbear2_eat)
      return this.scene.anims.exists(eat) ? eat : null;
    }
    return super.animKey(moving);
  }

  // so weit muss Henrik beim Fressen weg bleiben (der Ring); beim großen Eisbär entsprechend weiter
  get keepAway() {
    return KEEP_AWAY * this.sizeK;
  }

  // Grundname der Bilder: polarbear, beim großen Eisbär polarbear2 (sobald umgefärbt, siehe coats.js)
  get base() {
    return this.texSkin ?? 'polarbear';
  }

  render(moving) {
    super.render(moving);
    this.sprite.setScale(this.baby ? BABY_SIZE : SIZE * this.sizeK);
    const f = this.kind.frames;
    const frame = this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
    const wild = this.state === 'wild';
    const base = this.base;
    // schläft: eigenes Bild, falls es das schon gibt (sonst sitzend wie beim Fressen); frisst: Animation (ohne sie
    // sitzt er); gestört: steht
    const sleepKey = this.scene.textures.exists(`${base}_sleep`) ? `${base}_sleep` : `${base}_wait`;
    const eating = wild && this.mode === 'eat' && !this.disturbed && !this.scene.anims.exists(`${base}_eat`);
    const key = wild && this.mode === 'sleep' ? sleepKey : eating ? `${base}_wait` : null;
    if (key) this.sprite.setTexture(key, frame).setFlipX(false);
    else if (/_(sleep|wait)$/.test(this.sprite.texture.key)) this.sprite.setTexture(base, frame);
    // Schatten: wächst mit dem Bild (großer Eisbär, Tierbaby); schlafend länger und weiter hinten unter dem Bauch
    const k = this.baby ? BABY_SIZE / SIZE : this.sizeK;
    const lying = this.sprite.texture.key.endsWith('_sleep');
    this.shadow.setScale(k * (lying ? SLEEP_SHADOW : 1), k).setPosition(this.shadow.x, this.shadow.y - (lying ? SLEEP_SHADOW_UP : SHADOW_UP) * k);
  }
}
