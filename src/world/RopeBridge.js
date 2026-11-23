// Seilbrücke der roten Pandas (Bambuswald im Tierpark, siehe docs/plan-bambuswald.md): vom Kletterbaum im Pandagehege
// führt eine Hängebrücke über den Weg zu einem Kletterbaum am Zen-Garten. Brücke und Baum gehören zum Pandagehege
// (es bleibt ein Gehege); nur die roten Pandas gehen ab und zu hinüber, sitzen eine Weile oben im Baum und kommen
// zurück. Besucher und Henrik laufen unten durch. LEVEL.ropeBridge = { pen, from, to } (Kacheln der beiden Bäume).
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';
import { ENCLOSURES, isBlocked } from './map.js';
import { isFriend } from './friends.js';

const UP = 50; // so hoch über dem Fuß der Kletterbäume hängt die Brücke
const SAG = 12; // so weit hängt sie in der Mitte durch
const HALF = 5; // halbe Breite der Brücke (Pixel, quer zur Brücke)
const RAIL = 11; // Höhe des Handlaufs über den Brettern
const EVERY = [25, 50]; // so oft geht ein roter Panda hinüber (Sekunden)
const FIRST = [6, 15]; // der erste nach dem Betreten
const NEAR = 6; // nur Pandas, die höchstens so viele Kacheln vom Baum im Gehege entfernt sind
const CLIMB_MS = 900;
const CROSS_MS = 4200;
const SIT = [7, 13]; // so lange sitzt er drüben oben im Baum (Sekunden)

export default class RopeBridge {
  constructor(scene, def) {
    this.scene = scene;
    this.def = def;
    this.a = tileToWorld(def.from.tx, def.from.ty);
    this.b = tileToWorld(def.to.tx, def.to.ty);
    this.depth = Math.max(this.a.y, this.b.y) + 8; // über allem, was unter der Brücke läuft
    this.panda = null;
    this.wait = Phaser.Math.FloatBetween(...FIRST);
    this.draw();
  }

  // Punkt auf der Brücke (t: 0 am Baum im Gehege, 1 drüben): Bodenpunkt darunter und Höhe darüber
  point(t) {
    return { x: this.a.x + (this.b.x - this.a.x) * t, y: this.a.y + (this.b.y - this.a.y) * t, lift: UP - SAG * Math.sin(Math.PI * t) };
  }

  draw() {
    const g = this.scene.add.graphics().setDepth(this.depth);
    // quer zur Brücke (auf dem Bildschirm): senkrecht zur Richtung von a nach b, flach wie der Boden
    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const n = Math.hypot(dx, dy);
    const qx = (dy / n) * HALF * 2;
    const qy = (-dx / n) * HALF;
    const at = (t, side, up = 0) => {
      const p = this.point(t);
      return { x: p.x + qx * side, y: p.y - p.lift + qy * side - up };
    };
    const STEPS = 18;
    // Bretter
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const l = at(t, -1);
      const r = at(t, 1);
      g.lineStyle(4, 0x3c2412, 1).lineBetween(l.x, l.y + 1, r.x, r.y + 1);
      g.lineStyle(2.5, 0xb07a44, 1).lineBetween(l.x, l.y, r.x, r.y);
    }
    // Seile unten und Handläufe, dazwischen senkrechte Schnüre
    for (const side of [-1, 1]) {
      for (const up of [0, RAIL]) {
        g.lineStyle(up ? 1.6 : 1.2, 0x5a3a1c, 1).beginPath();
        for (let i = 0; i <= STEPS; i++) {
          const p = at(i / STEPS, side, up);
          if (i === 0) g.moveTo(p.x, p.y);
          else g.lineTo(p.x, p.y);
        }
        g.strokePath();
      }
      for (let i = 1; i < STEPS; i += 3) {
        const lo = at(i / STEPS, side);
        const hi = at(i / STEPS, side, RAIL);
        g.lineStyle(1, 0x5a3a1c, 0.9).lineBetween(lo.x, lo.y, hi.x, hi.y);
      }
    }
    this.graphics = g;
  }

  update(dt) {
    const p = this.panda;
    if (p && (!p.sprite?.active || p.state !== 'penned' || p.bridge !== this)) this.panda = null;
    if (this.panda) return;
    this.wait -= dt;
    if (this.wait > 0) return;
    this.wait = Phaser.Math.FloatBetween(...EVERY);
    const pen = ENCLOSURES.find((e) => e.id === this.def.pen);
    if (!pen) return;
    const dist = (a) => Math.hypot(a.x - this.a.x, a.y - this.a.y);
    const panda = this.scene.animals
      .filter((a) => a.species === 'redpanda' && a.state === 'penned' && a.enclosure === pen && !a.phase && !a.tree && !a.feed && !a.play && !a.visit && !a.petted && !a.baby && !isFriend(a))
      .filter((a) => dist(a) < NEAR * 40)
      .sort((u, v) => dist(u) - dist(v))[0];
    if (panda) this.cross(panda);
  }

  // hinüber, oben sitzen, zurück
  cross(p) {
    this.panda = p;
    p.bridge = this;
    const tweens = this.scene.tweens;
    const foot = this.footSpot();
    const trunk = { x: this.a.x, y: this.a.y + 3 }; // knapp vor dem Stamm
    const walk = Math.min(5000, (Math.hypot(foot.x - p.x, foot.y - p.y) / p.kind.speed) * 1000);
    const go = (from, to, done) => {
      const c = { t: from };
      p.bridgeMoving = true;
      tweens.add({
        targets: c,
        t: to,
        duration: CROSS_MS,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          if (p.bridge !== this) return;
          const q = this.point(c.t);
          p.faceX = Math.sign((this.b.x - this.a.x) * (to - from)) || p.faceX;
          p.faceY = Math.sign((this.b.y - this.a.y) * (to - from)) || p.faceY;
          p.x = q.x;
          p.y = q.y;
          p.climbY = q.lift + 2;
        },
        onComplete: () => {
          p.bridgeMoving = false;
          if (p.bridge === this) done();
        },
      });
    };
    p.bridgeMoving = true;
    p.faceX = Math.sign(foot.x - p.x) || p.faceX;
    p.faceY = Math.sign(foot.y - p.y) || p.faceY;
    tweens.add({
      targets: p,
      x: foot.x,
      y: foot.y,
      duration: walk,
      onComplete: () => {
        if (p.bridge !== this) return;
        p.bridgeMoving = false;
        tweens.add({
          targets: p,
          x: trunk.x,
          y: trunk.y,
          climbY: UP + 2,
          duration: CLIMB_MS,
          ease: 'Quad.easeOut',
          onComplete: () =>
            p.bridge === this &&
            go(0, 1, () => {
              // drüben oben im Baum: eine Weile sitzen und schauen, dann zurück
              p.faceY = 1;
              this.scene.time.delayedCall(Phaser.Math.FloatBetween(...SIT) * 1000, () => {
                if (p.bridge !== this) return;
                go(1, 0, () =>
                  tweens.add({
                    targets: p,
                    x: foot.x,
                    y: foot.y,
                    climbY: 0,
                    duration: CLIMB_MS,
                    ease: 'Quad.easeIn',
                    onComplete: () => this.release(p),
                  }),
                );
              });
            }),
        });
      },
    });
  }

  // fertig (oder abgebrochen, z. B. gefangen oder gespeichert): wieder normal im Gehege, unten am Baum
  release(p) {
    if (p.bridge !== this) return;
    this.scene.tweens.killTweensOf(p);
    p.bridge = null;
    p.bridgeMoving = false;
    p.climbY = 0;
    Object.assign(p, this.footSpot());
    if (this.panda === p) this.panda = null;
    p.pickWander?.();
  }

  // freier Platz neben dem Baum im Gehege (von dort klettert er hinauf; dorthin beim Speichern und nach dem Abbruch)
  footSpot() {
    const pen = ENCLOSURES.find((e) => e.id === this.def.pen);
    const { tx, ty } = this.def.from;
    const t = [[1, 0], [0, 1], [0, -1], [-1, 0]].map(([dx, dy]) => ({ tx: tx + dx, ty: ty + dy })).find((n) => !isBlocked(n.tx, n.ty) && pen?.tileSet.has(n.tx + ',' + n.ty));
    return t ? tileToWorld(t.tx, t.ty) : { x: this.a.x, y: this.a.y + 20 };
  }

  destroy() {
    if (this.panda) this.release(this.panda);
    this.graphics?.destroy();
  }
}
