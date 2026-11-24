// Fangen mit mehr Schritten in der Eiswelt (docs/plan-eiswelt.md, „Fangen mit mehr Schritten“). Hier liegt, was die
// Szene dafür braucht:
// - Schneehase: offenes Loch seines Baus mit der Aktionstaste zuschieben (SnowHare.js).
// - Walross: Blubberstellen im flachen Wasser neben den Walrossen; ein Kescher-Schwung dort bringt eine Muschel
//   (netSwing). Mit MUSSELS_NEEDED Muscheln füttert Henrik ein hungriges Walross (Walrus.js), dann kommt es mit.
// - Eisbär: neben jedem Eisloch eine kleine Ablagestelle, darüber eine Hinweisblase mit dem Fisch (wie der Salzstein
//   über dem Steinhaufen der Yaks). Mit dem Fisch aus der Kiste in der Hand legt Henrik ihn dort ab (oder wirft ihn
//   hin, dropBearBait in GardenScene); der Eisbär kommt (PolarBear.js). Dazu der Wind: Schneefahnen treiben übers
//   Bild, die Richtung wechselt selten; smells() sagt, ob der Bär Henrik riecht.
import Phaser from 'phaser';
import { tr } from '../i18n.js';
import { tileToWorld, worldToTile } from './iso.js';
import { LEVEL, charAt, isBlocked } from './map.js';

export const MUSSELS_NEEDED = 2;
const MUSSELS_MAX = 9; // mehr trägt Henrik nicht
const HOLE_REACH = 34; // so nah (Kachel-Proportionen, y doppelt) muss Henrik an einem Hasenloch stehen
const FEED_REACH = 80; // ... am hungrigen Walross
const BAIT_REACH = 80; // ... an der Ablagestelle neben einem Eisloch
const BAIT_THROW = 75; // ein geworfener Fisch, der so nah an einer Ablagestelle landet, bleibt dort liegen
const BAIT_HINT_DIST = 300; // so nah: über der nächsten Ablagestelle schwebt die Hinweisblase
const BAIT_HINT_UP = 22; // so hoch über der Stelle
const SPOT_RES = 3; // Bild der Ablagestelle so viel feiner gezeichnet
const SPOTS_PER_WALRUS = 3; // so viele Blubberstellen hält es um jedes wilde Walross bereit
const SPOT_NEAR = 8; // ... im Umkreis von so vielen Kacheln
const SPOT_SEARCH = 8; // neue Stellen: Wasser höchstens so weit vom Walross (nachts an den Eislöchern)
const SPOT_GAP = 2; // Abstand zwischen zwei Stellen (Kacheln)
const SPOTS_MAX = 10;
const BUBBLE_EVERY = 0.45; // so oft blubbert eine Stelle
const BUBBLE_VIEW = 700; // nur so nah an Henrik werden Blasen gezeichnet
const NET_SIGN_UP = 20; // so hoch über der Blubberstelle schwebt das Kescher-Zeichen
const NET_HIT = 44; // so nah (Kachel-Proportionen) an der Mitte des Kescher-Schwungs muss die Stelle sein
const ISLAND_CHECK = 4; // so oft (Sekunden) schaut es nach, ob auf jeder Insel ein Walross liegt ...
const ISLAND_REFILL = 45; // ... ist keins mehr da (gefangen, weggeschwommen), kommt nach so vielen Sekunden ein neues ...
const ISLAND_HIDDEN = 420; // ... aber nur, wo Henrik es nicht gerade sieht (Abstand in Welt-Pixeln)
const ISLAND_LIFE = 600; // so lange (Sekunden) bleibt es mindestens
const OWL_REFILL = 30; // nachts sitzt immer eine Schneeeule in einer Tanne: ist sie gefangen, kommt nach so vielen Sekunden eine neue
const WIND_CHANGE = [240, 360]; // so oft (Sekunden) dreht der Wind
const WIND_TURN = 3; // so lange (Sekunden) dauert das Drehen
const STREAKS = 14; // so viele Schneefahnen sind gleichzeitig unterwegs
const STREAK_SPEED = 190; // Welt-Pixel pro Sekunde
const STREAK_DEPTH = 99990; // über der Welt, unter Texten und Sprechblasen
const SMELL_ANGLE = 0.55; // cos des Winkels: so genau muss der Wind von Henrik zum Bären wehen (etwa 55 Grad)

function ensureTextures(scene) {
  if (scene.textures.exists('wind_streak')) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // weiche Linie, in der Mitte am hellsten
  for (let i = 0; i < 20; i++) g.fillStyle(0xffffff, Math.sin((i / 19) * Math.PI) * 0.9).fillRect(i * 2, 1, 2, 1.4);
  g.generateTexture('wind_streak', 40, 4);
  g.destroy();
}

export default class IceCatch {
  constructor(scene) {
    this.scene = scene;
    this.mussels = 0;
    this.spots = []; // Blubberstellen { x, y, tx, ty, bubbleIn }
    this.spotCheckIn = 0;
    ensureTextures(scene);
    const a = Phaser.Math.Between(0, 7) * (Math.PI / 4);
    this.wind = { angle: a, from: a, to: a, turn: 0, changeIn: Phaser.Math.FloatBetween(...WIND_CHANGE) };
    this.streaks = [];
    for (let i = 0; i < STREAKS; i++) {
      const img = scene.add.image(0, 0, 'wind_streak').setDepth(STREAK_DEPTH).setAlpha(0);
      this.streaks.push({ img, life: 0, age: Math.random() * 2, max: 1 });
    }
    this.near = null;
    this.islandCheckIn = 0;
    this.islands = (LEVEL.walrusIslands ?? []).map((r) => ({ ...r, emptyFor: ISLAND_REFILL })); // beim Ankommen gleich eins
  }

  get windX() {
    return Math.cos(this.wind.angle);
  }

  get windY() {
    return Math.sin(this.wind.angle);
  }

  // riecht der Bär Henrik? Der Wind weht ungefähr von Henrik zum Bären, und Henrik ist nah genug
  smells(player, bear, dist) {
    const vx = bear.x - player.x;
    const vy = bear.y - player.y;
    if (Math.hypot(vx, vy * 2) > dist) return false;
    const len = Math.hypot(vx, vy);
    if (len < 1) return true;
    return (vx * this.windX + vy * this.windY) / len > SMELL_ANGLE;
  }

  update(dt) {
    this.updateWind(dt);
    this.updateIslands(dt);
    this.updateOwl(dt);
    this.updateSpots(dt);
    this.updateBaitHint();
    const near = this.findNear();
    const key = near ? `${near.kind}:${near.kind === 'feed' ? this.mussels : ''}` : '';
    if (near?.target !== this.near?.target || key !== this.nearKey) {
      this.near = near;
      this.nearKey = key;
      this.scene.updateToolbar();
    }
  }

  // --- Wind und Schneefahnen ---

  updateWind(dt) {
    const w = this.wind;
    w.changeIn -= dt;
    if (w.changeIn <= 0) {
      w.changeIn = Phaser.Math.FloatBetween(...WIND_CHANGE);
      w.from = w.angle;
      w.to = w.angle + (Math.random() < 0.5 ? 1 : -1) * Phaser.Math.Between(1, 3) * (Math.PI / 4);
      w.turn = WIND_TURN;
    }
    if (w.turn > 0) {
      w.turn = Math.max(0, w.turn - dt);
      w.angle = Phaser.Math.Linear(w.to, w.from, w.turn / WIND_TURN);
    }
    const view = this.scene.cameras.main.worldView;
    for (const s of this.streaks) {
      s.age += dt;
      if (s.age >= s.max) {
        // neue Fahne irgendwo im Bild (etwas gegen den Wind versetzt, damit sie ins Bild treibt)
        s.age = 0;
        s.max = Phaser.Math.FloatBetween(0.9, 1.8);
        s.x = view.x + Math.random() * view.width - this.windX * 120;
        s.y = view.y + Math.random() * view.height - this.windY * 120;
        s.alpha = Phaser.Math.FloatBetween(0.25, 0.5);
        s.img.setScale(Phaser.Math.FloatBetween(0.6, 1.2), 1);
      }
      s.x += this.windX * STREAK_SPEED * dt;
      s.y += this.windY * STREAK_SPEED * dt;
      const t = s.age / s.max;
      s.img.setPosition(s.x, s.y).setRotation(this.wind.angle).setAlpha(Math.sin(t * Math.PI) * s.alpha);
    }
  }

  // --- Walrosse auf den Inseln ---

  // auf jeder Insel liegt fast immer ein Walross am Ufer: fehlt eins eine Weile, kommt ein neues (nicht vor Henriks Augen)
  updateIslands(dt) {
    this.islandCheckIn -= dt;
    if (this.islandCheckIn > 0) return;
    this.islandCheckIn = ISLAND_CHECK;
    const scene = this.scene;
    const p = scene.player;
    for (const isl of this.islands) {
      const inside = (tx, ty) => tx >= isl.tx0 && tx <= isl.tx1 && ty >= isl.ty0 && ty <= isl.ty1;
      const has = this.walruses().some((a) => {
        const t = worldToTile(a.x, a.y);
        return inside(t.tx, t.ty);
      });
      if (has) {
        isl.emptyFor = 0;
        continue;
      }
      isl.emptyFor += ISLAND_CHECK;
      if (isl.emptyFor < ISLAND_REFILL) continue;
      // freie Uferkachel der Insel (am Wasser oder am Meereis), außer Sicht
      const shore = [];
      for (let ty = isl.ty0; ty <= isl.ty1; ty++) {
        for (let tx = isl.tx0; tx <= isl.tx1; tx++) {
          if (isBlocked(tx, ty) || charAt(tx, ty) !== '.') continue;
          if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => '~ɨ'.includes(charAt(tx + dx, ty + dy)))) continue;
          const w = tileToWorld(tx, ty);
          if (Math.hypot(w.x - p.x, w.y - p.y) > ISLAND_HIDDEN) shore.push(w);
        }
      }
      const at = Phaser.Utils.Array.GetRandom(shore);
      if (!at) continue;
      const [a] = scene.finishSpawn([scene.createAnimal('walrus', at.x, at.y)], true); // (seltene Variante, Einblenden)
      a.life = ISLAND_LIFE;
      isl.emptyFor = 0;
    }
  }

  // --- Schneeeule: nachts immer genau eine (sie sucht sich selbst eine Tanne weit weg von Henrik, siehe SnowOwl.js) ---

  updateOwl(dt) {
    const scene = this.scene;
    const owls = scene.animals.filter((a) => a.species === 'snowowl' && a.state === 'wild');
    if (!LEVEL.night) {
      for (const o of owls) if (!o.lit) scene.despawn(o); // am Tag gibt es keine
      this.owlEmptyFor = OWL_REFILL; // (in der nächsten Nacht gleich eine)
      return;
    }
    if (owls.length) {
      this.owlEmptyFor = 0;
      return;
    }
    this.owlEmptyFor = (this.owlEmptyFor ?? OWL_REFILL) + dt;
    if (this.owlEmptyFor < OWL_REFILL) return;
    const p = scene.player;
    const [owl] = scene.finishSpawn([scene.createAnimal('snowowl', p.x, p.y)], false);
    owl.life = Infinity; // bleibt die ganze Nacht
    this.owlEmptyFor = 0;
  }

  // --- Blubberstellen und Muscheln ---

  walruses() {
    return this.scene.animals.filter((a) => a.species === 'walrus' && a.state === 'wild');
  }

  // Wasser, an das man vom Ufer herankommt
  static shallow(tx, ty) {
    if (charAt(tx, ty) !== '~') return false;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !isBlocked(tx + dx, ty + dy));
  }

  updateSpots(dt) {
    this.spotCheckIn -= dt;
    if (this.spotCheckIn <= 0) {
      this.spotCheckIn = 1;
      const walruses = this.walruses().map((a) => ({ a, t: worldToTile(a.x, a.y) }));
      // Stellen ohne Walross in der Nähe verschwinden
      this.spots = this.spots.filter((s) => {
        const keep = walruses.some(({ t }) => Math.hypot(t.tx - s.tx, t.ty - s.ty) < SPOT_NEAR + 2);
        if (!keep) s.sign.destroy();
        return keep;
      });
      for (const { t } of walruses) {
        let have = this.spots.filter((s) => Math.hypot(t.tx - s.tx, t.ty - s.ty) < SPOT_NEAR).length;
        for (let i = 0; i < 30 && have < SPOTS_PER_WALRUS && this.spots.length < SPOTS_MAX; i++) {
          const tx = t.tx + Phaser.Math.Between(-SPOT_SEARCH, SPOT_SEARCH);
          const ty = t.ty + Phaser.Math.Between(-SPOT_SEARCH, SPOT_SEARCH);
          if (!IceCatch.shallow(tx, ty) || this.spots.some((s) => Math.hypot(s.tx - tx, s.ty - ty) < SPOT_GAP)) continue;
          const p = tileToWorld(tx, ty);
          this.spots.push({ x: p.x, y: p.y, tx, ty, bubbleIn: Math.random() * BUBBLE_EVERY, sign: this.netSign(p.x, p.y) });
          have++;
        }
      }
    }
    const p = this.scene.player;
    const bob = Math.sin(this.scene.time.now / 400) * 1.5;
    for (const s of this.spots) {
      s.sign.y = s.y - NET_SIGN_UP + bob;
      s.bubbleIn -= dt;
      if (s.bubbleIn > 0) continue;
      s.bubbleIn = BUBBLE_EVERY * Phaser.Math.FloatBetween(0.7, 1.3);
      if (Math.hypot(s.x - p.x, s.y - p.y) < BUBBLE_VIEW) this.bubble(s);
    }
  }

  // kleines Schild mit dem Kescher über einer Blubberstelle (zeigt: hier mit dem Kescher fischen)
  netSign(x, y) {
    const scene = this.scene;
    const g = scene.add.graphics();
    g.fillStyle(0x5a4632, 0.35).fillRoundedRect(-8.5, -7.5, 17, 17, 4);
    g.fillStyle(0xfffaf0, 0.95).fillRoundedRect(-8.5, -8.5, 17, 17, 4);
    g.lineStyle(1, 0x8a6e4e, 1).strokeRoundedRect(-8.5, -8.5, 17, 17, 4);
    g.fillStyle(0xfffaf0, 0.95).fillTriangle(-3, 8.2, 3, 8.2, 0, 11.5);
    const icon = scene.add.image(0, 0, 'net').setDisplaySize(13, 13);
    return scene.add.container(x, y - NET_SIGN_UP, [g, icon]).setDepth(99990);
  }

  bubble(s) {
    const scene = this.scene;
    const b = scene.add.circle(s.x + Phaser.Math.Between(-7, 7), s.y + Phaser.Math.Between(-3, 3), Phaser.Math.FloatBetween(1.4, 2.6)).setStrokeStyle(1, 0xffffff, 0.95).setDepth(s.y + 1);
    scene.tweens.add({ targets: b, y: b.y - Phaser.Math.Between(4, 9), alpha: 0, duration: 650, onComplete: () => b.destroy() });
    if (Math.random() < 0.3) {
      const ring = scene.add.ellipse(s.x, s.y, 10, 4).setStrokeStyle(1, 0xffffff, 0.6).setDepth(s.y);
      scene.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
    }
  }

  // ein Kescher-Schwung: trifft er eine Blubberstelle, holt Henrik eine Muschel heraus
  netSwing(zone) {
    if (!zone) return;
    const s = this.spots.find((o) => Math.hypot(o.x - zone.x, (o.y - zone.y) * 2) < NET_HIT);
    if (!s) return;
    const scene = this.scene;
    this.spots.splice(this.spots.indexOf(s), 1);
    s.sign.destroy();
    for (let i = 0; i < 5; i++) this.bubble(s);
    if (this.mussels >= MUSSELS_MAX) {
      scene.showToast(tr('🐚 Du hast schon genug Muscheln.', '🐚 You already have enough mussels.'));
      return;
    }
    this.mussels++;
    const shell = scene.add.text(s.x, s.y - 6, '🐚', { fontSize: '14px', resolution: 4 }).setOrigin(0.5).setDepth(100000);
    scene.tweens.add({ targets: shell, x: scene.player.x, y: scene.player.sprite.y - 30, duration: 500, ease: 'Quad.easeOut', onComplete: () => scene.tweens.add({ targets: shell, alpha: 0, duration: 250, onComplete: () => shell.destroy() }) });
    scene.showToast(`🐚 ${Math.min(this.mussels, MUSSELS_NEEDED)} / ${MUSSELS_NEEDED}${this.mussels > MUSSELS_NEEDED ? ` (+${this.mussels - MUSSELS_NEEDED})` : ''}`);
    this.updateKey();
  }

  updateKey() {
    this.nearKey = null; // Leiste neu zeichnen (z. B. neue Zahl der Muscheln)
  }

  // --- Was die Aktionstaste gerade tut ---

  findNear() {
    const scene = this.scene;
    const p = scene.player;
    const d = (o) => Math.hypot(o.x - p.x, (o.y - p.y) * 2);
    // hungriges Walross füttern
    const walrus = this.walruses().filter((a) => a.hungry > 0 && d(a) < FEED_REACH).sort((a, b) => d(a) - d(b))[0];
    if (walrus) return { kind: 'feed', target: walrus };
    // Hasenloch zuschieben
    let best = null;
    for (const a of scene.animals) {
      if (a.species !== 'snowhare' || a.state !== 'wild' || !a.holes) continue;
      for (const h of a.holes) if (a.canClose(h) && d(h) < HOLE_REACH && (!best || d(h) < d(best.target))) best = { kind: 'hole', target: h, hare: a };
    }
    if (best) return best;
    // Fisch an die Ablagestelle neben einem Eisloch legen (Fisch aus der Kiste in der Hand)
    if (!scene.bearBait && !this.bearBusy() && scene.toolId === 'herring') {
      const spot = this.baitSpots().find((o) => d(o) < BAIT_REACH);
      if (spot) return { kind: 'bait', target: spot };
    }
    return null;
  }

  // --- Ablagestellen an den Eislöchern (nur nachts, dann gibt es Eislöcher) ---

  baitSpots() {
    const holes = LEVEL.iceHoles ?? null;
    if (holes !== this.spotHoles) {
      this.spotHoles = holes;
      for (const o of this.bait ?? []) o.img.destroy();
      this.bait = (holes ?? []).map(([hx, hy]) => this.makeBaitSpot(hx, hy)).filter(Boolean);
      this.spotsOn = undefined;
    }
    // die Plätze gibt es nur, solange ein wilder Eisbär unterwegs ist (nach dem Fang verschwinden sie, bis wieder einer kommt)
    const on = this.scene.animals.some((a) => a.species === 'polarbear' && a.state === 'wild');
    if (on !== this.spotsOn) {
      this.spotsOn = on;
      for (const o of this.bait) o.img.setVisible(on);
      if (!on) this.scene.removeBearBait?.(); // (ein Fisch, der noch dort lag, verschwindet mit)
    }
    return on ? this.bait : [];
  }

  // neben dem Loch auf dem Eis: ein plattgedrückter Fleck mit ein paar Steinchen (Platzhalter, gezeichnet)
  makeBaitSpot(hx, hy) {
    const scene = this.scene;
    const hole = tileToWorld(hx + 0.5, hy + 0.5);
    const n = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].find(([dx, dy]) => !isBlocked(hx + dx, hy + dy));
    if (!n) return null;
    const t = tileToWorld(hx + n[0] + 0.5, hy + n[1] + 0.5);
    const x = t.x + (hole.x - t.x) * 0.3;
    const y = t.y + (hole.y - t.y) * 0.3;
    if (!scene.textures.exists('bait_spot')) {
      const k = SPOT_RES;
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xa9bed3, 0.55).fillEllipse(16 * k, 8 * k, 28 * k, 12 * k);
      g.fillStyle(0xd4e2ef, 0.8).fillEllipse(16 * k, 7.5 * k, 20 * k, 8 * k);
      for (const [px, py] of [[5, 9], [27, 8], [10, 13], [23, 3.5]]) {
        g.fillStyle(0x6f7f8f, 1).fillEllipse(px * k, py * k, 3.4 * k, 2.2 * k);
        g.fillStyle(0x9aabbb, 1).fillEllipse((px - 0.4) * k, (py - 0.5) * k, 1.6 * k, 1 * k);
      }
      g.generateTexture('bait_spot', 32 * k, 16 * k);
      g.destroy();
    }
    const img = scene.add.image(x, y, 'bait_spot').setScale(1 / SPOT_RES).setDepth(-99989);
    return { x, y, hole, img };
  }

  // frisst oder döst gerade ein Eisbär (nach einem Köder)? Dann braucht es keinen neuen Fisch
  bearBusy() {
    return this.scene.animals.some((a) => a.species === 'polarbear' && a.state === 'wild' && a.mode && a.mode !== 'roam');
  }

  // geworfener Fisch: landet er nah an einer Ablagestelle, bleibt er dort liegen
  spotNear(x, y) {
    return this.baitSpots().find((o) => Math.hypot(o.x - x, (o.y - y) * 2) < BAIT_THROW) ?? null;
  }

  // Hinweisblase mit dem Fisch über der nächsten Ablagestelle (solange dort keiner liegt), wie bei den Yaks
  updateBaitHint() {
    const scene = this.scene;
    const el = scene.bearHintEl;
    if (!el) return;
    const p = scene.player;
    let what = null;
    if (!scene.bearBait && !this.bearBusy() && !scene.leaving) {
      let best = BAIT_HINT_DIST;
      for (const o of this.baitSpots()) {
        const d = Math.hypot(o.x - p.x, (o.y - p.y) * 2);
        if (d < best) {
          best = d;
          what = o;
        }
      }
    }
    if (what !== this.hintFor) {
      this.hintFor = what;
      if (what) {
        el.innerHTML = '<img src="assets/herring.png" alt="">';
        el.onclick = (e) => {
          e.stopPropagation();
          scene.showCatchTip('polarbear');
        };
      }
      el.classList.toggle('show', !!what);
    }
    if (!what) return;
    const cam = scene.cameras.main;
    const z = scene.scale.zoom;
    el.style.left = `${(what.x - cam.worldView.x) * cam.zoom * z}px`;
    el.style.top = `${(what.y - BAIT_HINT_UP - cam.worldView.y) * cam.zoom * z}px`;
  }

  // für die Werkzeugleiste: Bild und Text (oder null)
  toolbar() {
    const n = this.near;
    if (!n) return null;
    const tex = this.scene.textures;
    if (n.kind === 'hole') return { img: tex.getBase64('hare_hole_closed'), text: tr('Loch zuschieben', 'Fill in the hole') };
    if (n.kind === 'feed') return { img: tex.getBase64('walrus', 0), text: `${tr('Walross füttern', 'Feed the walrus')} 🐚 ${Math.min(this.mussels, MUSSELS_NEEDED)} / ${MUSSELS_NEEDED}` };
    if (n.kind === 'bait') return { img: 'assets/herring.png', text: tr('Fisch ans Eisloch legen', 'Put the fish by the ice hole') };
    return null;
  }

  // Aktionstaste: gibt zurück, ob sie hier etwas getan hat
  act() {
    const n = this.near;
    if (!n) return false;
    if (n.kind === 'hole') {
      if (n.hare.closeHole(n.target)) {
        const scene = this.scene;
        if (scene.cache.audio.exists('step_snow')) scene.sound.play('step_snow', { volume: 0.5 });
        if (n.hare.openHoles().length === 1) scene.showToast(tr('Nur noch ein Loch offen – dort muss der Hase heraus!', 'Only one hole left – the hare has to come out there!'));
      }
      this.near = null;
      return true;
    }
    if (n.kind === 'feed') return this.feedWalrus(n.target);
    if (n.kind === 'bait') return this.placeBearFish(n.target);
    return false;
  }

  feedWalrus(w) {
    const scene = this.scene;
    if (this.mussels < MUSSELS_NEEDED) {
      scene.showToast(tr(`🐚 Es will ${MUSSELS_NEEDED} Muscheln. Kescher sie, wo es im Wasser blubbert.`, `🐚 It wants ${MUSSELS_NEEDED} mussels. Net them where the water bubbles.`));
      return true;
    }
    if (scene.tooCold()) return true;
    this.mussels -= MUSSELS_NEEDED;
    w.hungry = 0;
    this.near = null;
    scene.catchAnimal(w);
    return true;
  }

  // Fisch an die Ablagestelle: der Eisbär trottet hin (PolarBear.js)
  placeBearFish(spot) {
    const scene = this.scene;
    const img = scene.add.image(spot.x, spot.y - 1, 'herring').setScale(0.3).setDepth(spot.y);
    scene.tweens.add({ targets: img, y: { from: spot.y - 9, to: spot.y - 1 }, duration: 260, ease: 'Bounce.easeOut' });
    scene.bearBait = { x: spot.x, y: spot.y, hole: spot.hole, img, bear: null };
    scene.showToast(tr('🐟 Der Fisch liegt am Eisloch. Ein Eisbär riecht ihn bestimmt.', '🐟 The fish lies by the ice hole. A polar bear is sure to smell it.'));
    this.near = null;
    return true;
  }

  destroy() {
    for (const o of this.bait ?? []) o.img.destroy();
    this.bait = [];
    this.scene.bearHintEl?.classList.remove('show');
    for (const s of this.streaks) s.img.destroy();
    this.streaks = [];
    for (const s of this.spots) s.sign.destroy();
    this.spots = [];
  }
}
