// Tierpfleger füttern die Tiere (docs/plan-gehege-leben.md, Schritt 4; statt Mavi, Andre 28.11.2026): in den
// Parkabschnitten (nicht im Aquarium und den Häusern) kommt alle KEEPER_EVERY Sekunden abwechselnd die Tierpflegerin oder
// der Tierpfleger mit dem Futtereimer über einen Ausgang herein, geht über die Wege und durchs Tor in ein Gehege, schüttet
// dort Futter aus (die Tiere kommen herbei und fressen, wie beim Füttern mit dem Futter aus dem Futterhaus) und geht
// wieder hinaus. Von Anfang an, auch während Mavis Tutorial.
// Laufen ohne eigene Animation wie die Besucher (Standbild in vier Ansichten, leichtes Wippen); den Eimer halten sie
// schon im Bild (keeper1.png, keeper2.png). Besucher füttern nicht mehr, nur noch die Tierpfleger.
import Phaser from 'phaser';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { ENCLOSURES, LEVEL_ID, isBlocked, isBlockedPoint } from '../world/map.js';
import { isPark } from '../world/levels.js';
import { SPRITE_SINK } from '../animals/Animal.js';

const KEEPER_EVERY = [60, 120]; // Sekunden zwischen zwei Fütterungen
const FIRST_IN = [15, 40]; // ... die erste nach dem Betreten des Abschnitts
const SPEED = 62; // Pixel pro Sekunde (flotter als die Besucher: sie haben zu tun)
const FEED_TIME = 3.5; // so lange stehen sie im Gehege und schütten aus
// so viele Kacheln hinter dem Tor bleiben sie stehen: in großen Gehegen (Streichelzoo, Wildpark) weiter drinnen, damit
// die Tiere ihnen entgegenkommen und hinterherlaufen (Wurzel der Fläche mal INSIDE_K, zwischen INSIDE_MIN und INSIDE_MAX)
const INSIDE_MIN = 2;
const INSIDE_MAX = 9;
const INSIDE_K = 0.45;
const LURE_EVERY = 0.7; // Sekunden: so oft schauen die Tiere im Gehege neu, wo der Pfleger mit dem Eimer ist ...
const LURE_R = 320; // ... und so weit weg (Pixel, y doppelt) bemerken sie ihn
const LURE_NEAR = 34; // ... so nah kommen sie heran, dann stehen sie und schauen ihn an
const KEEPERS = ['keeper1', 'keeper2']; // Tierpflegerin, Tierpfleger (wechseln sich ab)
const FRAMES = { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 };
const key = (tx, ty) => tx + ',' + ty;
let nextKeeper = 0; // wer als Nächstes kommt (über die Gebiete hinweg)

export class KeeperFeeder {
  constructor(scene, crowd, noFeed) {
    this.scene = scene;
    this.crowd = crowd;
    this.noFeed = noFeed; // Arten, die kein Futter bekommen (wie beim Füttern durch Henrik)
    this.timer = Phaser.Math.FloatBetween(...FIRST_IN);
    this.walker = null;
  }

  update(dt) {
    if (this.walker) return this.step(dt);
    if (!isPark(LEVEL_ID) || this.scene.leaving) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = Phaser.Math.FloatBetween(...KEEPER_EVERY);
    this.start();
  }

  // Gehege, in denen gerade Tiere fressen können und die ein Tor haben (auch der Streichelzoo; Teiche nicht)
  pens() {
    return ENCLOSURES.filter((e) => !e.pond && !e.free && e.gates?.length && this.scene.animals.some((a) => a.enclosure === e && !this.noFeed.includes(a.species) && a.canFeed()));
  }

  start() {
    const grid = this.crowd.grid;
    const exits = Phaser.Utils.Array.Shuffle([...grid.exits]);
    if (!exits.length) return;
    for (const e of Phaser.Utils.Array.Shuffle(this.pens())) {
      const inside = new Set(e.tiles.filter(({ tx, ty }) => !isBlocked(tx, ty) && !isBlockedPoint(tileToWorld(tx, ty).x, tileToWorld(tx, ty).y)).map((t) => key(t.tx, t.ty)));
      const gates = new Set(e.gates.map((g) => key(g.tx, g.ty)));
      const walk = new Set([...grid.walk, ...gates, ...inside]);
      // vom nächstgelegenen Ausgang: durchs Tor, dann je nach Größe des Geheges ein Stück hinein (Tiefe ab dem Tor; ist
      // es dafür zu klein, etwas weniger weit)
      const want = Math.max(INSIDE_MIN, Math.min(INSIDE_MAX, Math.round(Math.sqrt(inside.size) * INSIDE_K)));
      let best = null;
      for (let deep = want; deep >= 1 && !best; deep--) {
        for (const from of exits) {
          const route = this.route(walk, from, (tx, ty, depth) => inside.has(key(tx, ty)) && depth >= deep, gates);
          if (route?.length && (!best || route.length < best.route.length)) best = { from, route };
        }
      }
      if (!best) continue;
      this.walker = this.makeWalker(best.from);
      Object.assign(this.walker, { pen: e, walk, inside, phase: 'in', lure: 0 });
      this.setRoute(best.route);
      return;
    }
  }

  // Breitensuche über walk; goal(tx, ty, depth): depth zählt die Schritte seit dem ersten Tor (davor 0)
  route(walk, from, goal, gates = null) {
    const start = key(from.tx, from.ty);
    const prev = new Map([[start, null]]);
    const depth = new Map([[start, 0]]);
    const queue = [from];
    for (let i = 0; i < queue.length; i++) {
      const t = queue[i];
      const k0 = key(t.tx, t.ty);
      if (i > 0 && goal(t.tx, t.ty, depth.get(k0))) {
        const out = [];
        for (let k = k0; k !== start; k = prev.get(k)) {
          const [tx, ty] = k.split(',').map(Number);
          out.unshift({ tx, ty });
        }
        return out;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { tx: t.tx + dx, ty: t.ty + dy };
        const k = key(n.tx, n.ty);
        if (prev.has(k) || !walk.has(k)) continue;
        prev.set(k, k0);
        const d = depth.get(k0);
        depth.set(k, d > 0 || gates?.has(k) ? d + 1 : 0);
        queue.push(n);
      }
    }
    return null;
  }

  makeWalker(from) {
    const p = tileToWorld(from.tx, from.ty);
    const s = this.scene;
    const look = KEEPERS[nextKeeper++ % KEEPERS.length];
    const w = { x: p.x, y: p.y, faceX: 1, faceY: 1, t: 0, route: [] };
    w.shadow = s.add.ellipse(p.x, p.y, 24, 8, 0x14320a, 0.3);
    w.sprite = s.add.sprite(p.x, p.y, look, FRAMES.downRight).setOrigin(0.5, 112 / 116).setScale(0.5);
    for (const o of [w.sprite, w.shadow]) {
      o.setAlpha(0);
      s.tweens.add({ targets: o, alpha: 1, duration: 500 });
    }
    return w;
  }

  setRoute(tiles) {
    this.walker.route = tiles.map((t) => tileToWorld(t.tx, t.ty));
  }

  step(dt) {
    const w = this.walker;
    w.t += dt;
    let moving = false;
    if (w.phase === 'feed') {
      w.timer -= dt;
      if (w.timer <= 0) this.leave();
    } else {
      const target = w.route[0];
      if (!target) return this.arrived();
      const dx = target.x - w.x;
      const dy = target.y - w.y;
      const d = Math.hypot(dx, dy);
      const s = SPEED * dt;
      if (d <= s) {
        w.x = target.x;
        w.y = target.y;
        w.route.shift();
      } else {
        w.x += (dx / d) * s;
        w.y += (dy / d) * s;
      }
      if (Math.abs(dx) > 0.5) w.faceX = Math.sign(dx);
      if (Math.abs(dy) > 0.5) w.faceY = Math.sign(dy);
      moving = true;
      // im Gehege: die Tiere sehen den Eimer und kommen ihm entgegen bzw. laufen hinterher
      if (w.phase === 'in') {
        w.lure -= dt;
        const t = worldToTile(w.x, w.y);
        if (w.lure <= 0 && w.inside.has(key(t.tx, t.ty))) {
          w.lure = LURE_EVERY;
          this.lure(w);
        }
      }
    }
    this.render(moving);
  }

  // Tiere des Geheges in der Nähe laufen zum Pfleger (nur, wer gerade frei herumläuft: nicht schlafend, spielend,
  // fressend, gestreichelt ...); ganz nah stehen sie und schauen zu ihm
  lure(w) {
    for (const a of this.scene.animals) {
      if (a.enclosure !== w.pen || !a.canFeed() || this.noFeed.includes(a.species) || !a.sprite?.visible) continue;
      if (a.feed || a.play || a.sleeping || a.napping || a.petted || a.visit || a.fetch || a.companion || a.penMoment || a.tree || a.jumping) continue;
      const dx = w.x - a.x;
      const dy = w.y - a.y;
      const d = Math.hypot(dx, dy * 2);
      if (d > LURE_R) continue;
      if (d < LURE_NEAR) {
        a.dirX = 0;
        a.dirY = 0;
        a.faceX = Math.sign(dx) || a.faceX;
        a.faceY = Math.sign(dy) || a.faceY;
      } else {
        const n = Math.hypot(dx, dy);
        a.dirX = dx / n;
        a.dirY = dy / n;
      }
      a.wanderTime = LURE_EVERY + 0.3;
    }
  }

  arrived() {
    const w = this.walker;
    if (w.phase !== 'in') return this.finish(); // wieder am Ausgang
    // im Gehege: Futter vor sich ausschütten, die Tiere kommen; dabei kurz in die Knie (Eimer ausleeren)
    w.phase = 'feed';
    w.timer = FEED_TIME;
    const food = { x: w.x + w.faceX * 16, y: w.y + w.faceY * 8 };
    this.scene.feedEnclosure(w.pen, w, food, true);
    w.bow = 0;
    this.scene.tweens.add({ targets: w, bow: 1, duration: 350, yoyo: true, hold: 700 });
  }

  leave() {
    const w = this.walker;
    w.phase = 'out';
    const exits = new Set(this.crowd.grid.exits.map((t) => key(t.tx, t.ty)));
    const route = this.route(w.walk, worldToTile(w.x, w.y), (tx, ty) => exits.has(key(tx, ty)));
    if (!route) return this.finish();
    this.setRoute(route);
  }

  finish() {
    const w = this.walker;
    this.walker = null;
    if (!w) return;
    const parts = [w.sprite, w.shadow];
    this.scene.tweens.add({ targets: parts, alpha: 0, duration: 400, onComplete: () => parts.forEach((o) => o.destroy()) });
  }

  render(moving) {
    const w = this.walker;
    if (!w) return;
    w.sprite.setFrame(w.faceY > 0 ? (w.faceX < 0 ? FRAMES.downLeft : FRAMES.downRight) : w.faceX > 0 ? FRAMES.upRight : FRAMES.upLeft);
    const phase = w.t * 9;
    const hop = moving ? Math.abs(Math.sin(phase)) * 2 : 0;
    const bow = w.bow ?? 0; // beim Ausschütten leicht vorgebeugt
    w.sprite.setPosition(w.x, w.y - hop + SPRITE_SINK).setAngle(moving ? Math.sin(phase) * 2 : bow * 8 * w.faceX).setDepth(w.y);
    w.shadow.setPosition(w.x, w.y).setDepth(w.y - 0.5);
  }
}
