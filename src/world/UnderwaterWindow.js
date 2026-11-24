// Unterwasser-Scheibe unter der Polarhalle (Level polarunder, siehe docs/plan-eiswelt.md): hinter der hinteren Wand des
// Raums liegt das Becken der Robben und Walrosse als großer Glaskasten (wie die Becken im Aquarium). Man sieht vorne durch
// die hohe Scheibe und rechts durch die Seitenscheibe hinein, oben liegt die Wasseroberfläche; drinnen Rückwand mit
// Lichtstrahlen, Boden mit Kies und Felsen, Bläschen. Die Robben und Walrosse aus dem Außenbecken (game.levels[level])
// schwimmen in ganzer Gestalt hin und her, mal vorne an der Scheibe, mal weiter hinten (dort blasser und bläulicher).
// Bilder: Schwimm-Animation in Seitenansicht <Art>_underwater bzw. <Variante>_underwater (aus Videos, nach rechts;
// nach links gespiegelt); ohne sie gleitet das Standbild der Art.
// Besucher: VISITORS Besucher kommen durch die Tür herein, stellen sich an verschiedene Stellen vor die Scheibe, schauen
// eine Weile, wechseln ab und zu den Platz und gehen irgendwann wieder (dann kommt bald ein neuer). Nur Figuren, ohne
// Herzen (die gibt es oben an den Gehegen).
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';
import { SPECIES } from '../animals/Animal.js';
import { game } from '../state.js';
import { tr } from '../i18n.js';

const DEPTH = -99000; // hinter allem im Raum (über dem gebackenen Boden)
const BACK = 3; // so tief (Kacheln) reicht das Becken nach hinten
const BANDS = 12; // so viele Streifen hat der Farbverlauf des Wassers
const DEEP = 0x0b2c48; // Farbe am Grund ...
const SHALLOW = 0x3c8fb8; // ... und oben an der Wasseroberfläche
const FOG = 0x5f9cc0; // so färbt das Wasser weit hinten schwimmende Tiere
const AIR = 16; // so viel Luft (Pixel) ist zwischen Wasseroberfläche und Oberkante der Scheibe
const RAYS = 5;
const BUBBLES = 30;
const POST_EVERY = 2; // alle so viele Kacheln ein Pfosten im Glasrahmen
const SPEED = [0.035, 0.07]; // so schnell schwimmen sie an der Scheibe entlang (Anteil der Breite je Sekunde)
const TURN = [6, 16]; // nach so vielen Sekunden drehen sie ab und zu um
const SCALE = { seal: 0.22, walrus: 0.35 }; // (Schwimm-Animationen: so groß wie die Besucher davor passt, das Walross etwas größer als die Robbe)
const SWIMMERS = ['seal', 'walrus'];
const VISITORS = 3; // so viele Besucher stehen unten an der Scheibe
const LOOKS = 8; // Besucher-Bilder visitor1 ... visitor8 (wie im Tierpark, siehe Visitor.js)
const V_FRAMES = { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 };
const V_ORIGIN_Y = 112 / 116;
const V_SPEED = [30, 40]; // Pixel pro Sekunde
const V_LOOK = [8, 16]; // so lange schauen sie an einem Platz
const V_STAY = [2, 4]; // an so vielen Plätzen, dann gehen sie
const V_GAP = [3, 9]; // Sekunden, bis nach einem, der gegangen ist, der nächste hereinkommt

const lerpColor = (a, b, k) => {
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(a), Phaser.Display.Color.ValueToColor(b), 1, k);
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
};

export default class UnderwaterWindow {
  constructor(scene, def) {
    this.scene = scene;
    this.def = def;
    this.h = def.height;
    this.top = this.h - AIR; // Wasseroberfläche
    // Grundlinie der vorderen Scheibe: die hintere Kante der ersten begehbaren Reihe, von links nach rechts unten
    this.a = tileToWorld(def.tx0 - 0.5, def.ty + 0.5);
    this.b = tileToWorld(def.tx1 + 0.5, def.ty + 0.5);
    this.off = { x: tileToWorld(0, -1).x - tileToWorld(0, 0).x, y: tileToWorld(0, -1).y - tileToWorld(0, 0).y }; // eine Kachel nach hinten
    // Umriss des ganzen Kastens (vorne, oben, rechte Seite): nur darin wird gemalt
    const shape = scene.make.graphics({ add: false });
    shape.fillStyle(0xffffff, 1).fillPoints([this.p(0, 0, 0), this.p(1, 0, 0), this.p(1, 0, BACK), this.p(1, this.h, BACK), this.p(0, this.h, BACK), this.p(0, this.h, 0)], true);
    this.mask = shape.createGeometryMask();
    this.drawInside();
    this.fx = scene.add.graphics().setDepth(DEPTH + 5).setMask(this.mask);
    this.bubbles = Array.from({ length: BUBBLES }, () => this.newBubble(true));
    this.time = 0;
    this.swimmers = this.makeSwimmers();
    this.drawGlass();
    // Besucher: nur, wenn es etwas zu sehen gibt; die ersten stehen schon an der Scheibe
    this.visitors = [];
    if (this.swimmers.length && def.door) for (let i = 0; i < VISITORS; i++) this.visitors.push(this.newVisitor(i === 0 ? 0 : Phaser.Math.FloatBetween(0, 6), true));
  }

  // ---- Besucher ----
  // ein freier Platz vor der Scheibe (erste Reihe, nicht zu nah an den anderen)
  spotAtGlass(self) {
    const d = this.def;
    for (let tries = 0; tries < 12; tries++) {
      const p = tileToWorld(Phaser.Math.FloatBetween(d.tx0 + 0.6, d.tx1 - 0.6), d.ty + Phaser.Math.FloatBetween(1.1, 1.6));
      if (this.visitors.every((v) => v === self || !v.goal || Math.hypot(v.goal.x - p.x, v.goal.y - p.y) > 40)) return p;
    }
    return tileToWorld((d.tx0 + d.tx1) / 2, d.ty + 1.3);
  }

  newVisitor(wait, atGlass = false) {
    const door = tileToWorld(this.def.door.tx, this.def.door.ty);
    const sprite = this.scene.add.sprite(door.x, door.y, `visitor${Phaser.Math.Between(1, LOOKS)}`, V_FRAMES.upRight).setOrigin(0.5, V_ORIGIN_Y).setScale(0.5).setVisible(false);
    const v = { sprite, x: door.x, y: door.y, wait, phase: 'wait', goal: null, stays: Phaser.Math.Between(...V_STAY), speed: Phaser.Math.FloatBetween(...V_SPEED), t: Math.random() * 5 };
    if (atGlass) {
      v.goal = this.spotAtGlass(v);
      Object.assign(v, { x: v.goal.x, y: v.goal.y, phase: 'look', wait: Phaser.Math.FloatBetween(...V_LOOK) });
      sprite.setVisible(true);
    }
    return v;
  }

  updateVisitor(v, dt) {
    v.t += dt;
    if (v.phase === 'wait') {
      v.wait -= dt;
      if (v.wait > 0) return;
      v.phase = 'walk';
      v.goal = this.spotAtGlass(v);
      v.sprite.setVisible(true).setAlpha(0);
      this.scene.tweens.add({ targets: v.sprite, alpha: 1, duration: 500 });
    }
    if (v.phase === 'look') {
      // schaut durch die Scheibe (Blick nach hinten); dreht den Kopf ab und zu nach links bzw. rechts
      v.sprite.setFrame(Math.sin(v.t * 0.4) > 0.6 ? V_FRAMES.upLeft : V_FRAMES.upRight);
      v.wait -= dt;
      if (v.wait <= 0) {
        v.stays--;
        v.phase = v.stays > 0 ? 'walk' : 'leave';
        v.goal = v.stays > 0 ? this.spotAtGlass(v) : tileToWorld(this.def.door.tx, this.def.door.ty);
      }
    } else if (v.phase === 'walk' || v.phase === 'leave') {
      const dx = v.goal.x - v.x;
      const dy = v.goal.y - v.y;
      const d = Math.hypot(dx, dy);
      const step = v.speed * dt;
      if (d <= step) {
        v.x = v.goal.x;
        v.y = v.goal.y;
        if (v.phase === 'leave') {
          // durch die Tür hinaus; bald kommt ein neuer
          const i = this.visitors.indexOf(v);
          this.scene.tweens.add({ targets: v.sprite, alpha: 0, duration: 400, onComplete: () => v.sprite.destroy() });
          this.visitors[i] = this.newVisitor(Phaser.Math.FloatBetween(...V_GAP));
          return;
        }
        v.phase = 'look';
        v.wait = Phaser.Math.FloatBetween(...V_LOOK);
      } else {
        v.x += (dx / d) * step;
        v.y += (dy / d) * step;
        v.sprite.setFrame(dy > 0 ? (dx < 0 ? V_FRAMES.downLeft : V_FRAMES.downRight) : dx > 0 ? V_FRAMES.upRight : V_FRAMES.upLeft);
      }
    }
    const walking = v.phase === 'walk' || v.phase === 'leave';
    v.sprite.setPosition(v.x, v.y - (walking ? Math.abs(Math.sin(v.t * 9)) * 1.5 : 0)).setDepth(v.y);
  }

  // Punkt im Kasten: u entlang der Scheibe (0..1), h über dem Boden (Welt-Pixel), d nach hinten (Kacheln)
  p(u, h, d = 0) {
    return { x: this.a.x + (this.b.x - this.a.x) * u + this.off.x * d, y: this.a.y + (this.b.y - this.a.y) * u + this.off.y * d - h };
  }

  // Flächen: vorne/hinten (feste Tiefe d), Seite (festes u), Boden/Oberfläche (feste Höhe h)
  front(u0, u1, h0, h1, d = 0) {
    return [this.p(u0, h0, d), this.p(u1, h0, d), this.p(u1, h1, d), this.p(u0, h1, d)];
  }

  side(u, d0, d1, h0, h1) {
    return [this.p(u, h0, d0), this.p(u, h0, d1), this.p(u, h1, d1), this.p(u, h1, d0)];
  }

  flat(h, u0 = 0, u1 = 1, d0 = 0, d1 = BACK) {
    return [this.p(u0, h, d0), this.p(u1, h, d0), this.p(u1, h, d1), this.p(u0, h, d1)];
  }

  // das Innere: Rückwand und linke Wand mit Farbverlauf, Lichtstrahlen, Boden mit Kies und Felsen
  drawInside() {
    const g = this.scene.add.graphics().setDepth(DEPTH).setMask(this.mask);
    const top = this.top;
    for (let i = 0; i < BANDS; i++) {
      const h0 = (top * i) / BANDS;
      const h1 = (top * (i + 1)) / BANDS + 1;
      const k = i / (BANDS - 1);
      g.fillStyle(lerpColor(DEEP, SHALLOW, k), 1).fillPoints(this.front(0, 1, h0, h1, BACK), true); // Rückwand
      g.fillStyle(lerpColor(lerpColor(DEEP, 0x000000, 0.25), SHALLOW, k), 1).fillPoints(this.side(0, 0, BACK, h0, h1), true); // linke Wand (etwas dunkler)
    }
    // über dem Wasser: dunkle Luft im Kasten
    g.fillStyle(0x16283a, 1).fillPoints(this.front(0, 1, top, this.h, BACK), true);
    g.fillStyle(0x112030, 1).fillPoints(this.side(0, 0, BACK, top, this.h), true);
    // Lichtstrahlen auf der Rückwand, schräg von oben
    const rnd = new Phaser.Math.RandomDataGenerator(['polarunder']);
    for (let i = 0; i < RAYS; i++) {
      const u = (i + 0.5) / RAYS + rnd.realInRange(-0.05, 0.05);
      const w = rnd.realInRange(0.025, 0.05);
      g.fillStyle(0xffffff, 0.08).fillPoints([this.p(u, top, BACK), this.p(u + w, top, BACK), this.p(u + w + 0.05, 0, BACK), this.p(u + 0.05, 0, BACK)], true);
    }
    // Boden: Kies, nach hinten dunkler
    for (let i = 0; i < 6; i++) {
      g.fillStyle(lerpColor(0x8496a4, 0x4a5a68, i / 5), 1).fillPoints(this.flat(0, 0, 1, (BACK * i) / 6, (BACK * (i + 1)) / 6), true);
    }
    // Felsen auf dem Boden (von hinten nach vorne gemalt), mit etwas Licht oben drauf
    const rocks = Array.from({ length: 18 }, () => ({ u: rnd.frac(), d: rnd.realInRange(0.2, BACK - 0.2), r: rnd.between(6, 18) })).sort((p, q) => q.d - p.d);
    for (const r of rocks) {
      const c = this.p(r.u, 0, r.d);
      const shade = r.d / BACK;
      g.fillStyle(lerpColor(rnd.pick([0x56656f, 0x6c7e8b, 0x7d8f9b]), DEEP, shade * 0.5), 1).fillEllipse(c.x, c.y - r.r * 0.35, r.r * 2.2, r.r * 1.3);
      g.fillStyle(lerpColor(0xd6e6ee, DEEP, shade * 0.5), 0.8).fillEllipse(c.x - r.r * 0.3, c.y - r.r * 0.8, r.r * 1.1, r.r * 0.35);
    }
    // Wasserlinie an Rück- und linker Wand
    g.lineStyle(2, 0xbfe6f5, 0.7).strokePoints([this.p(0, top, 0), this.p(0, top, BACK), this.p(1, top, BACK)], false);
  }

  // Glas: das Wasser vorne und an der Seite leicht getönt, die Oberfläche hell, Glanz, Rahmen mit Pfosten und Kanten
  drawGlass() {
    const g = this.scene.add.graphics().setDepth(DEPTH + 15).setMask(this.mask);
    const top = this.top;
    g.fillStyle(0x8fd0ec, 0.1).fillPoints(this.front(0, 1, 0, top), true);
    g.fillStyle(0x8fd0ec, 0.16).fillPoints(this.side(1, 0, BACK, 0, top), true);
    g.fillStyle(0xbfe9f7, 0.45).fillPoints(this.flat(top), true); // Wasseroberfläche von oben
    g.lineStyle(1, 0xffffff, 0.35);
    for (let i = 1; i < 6; i++) g.strokePoints([this.p(0.05, top, (BACK * i) / 6), this.p(0.95, top, (BACK * i) / 6 - 0.1)], false); // Wellen
    g.fillStyle(0xbfe6f5, 0.85).fillPoints(this.front(0, 1, top - 2, top + 1), true); // Wasserlinie vorne
    g.fillStyle(0xbfe6f5, 0.85).fillPoints(this.side(1, 0, BACK, top - 2, top + 1), true);
    // Glanz auf der vorderen Scheibe (schräge helle Streifen)
    const n = this.def.tx1 - this.def.tx0 + 1;
    g.fillStyle(0xffffff, 0.06);
    for (let i = 0; i < n; i += POST_EVERY) {
      const u = (i + 0.3) / n;
      g.fillPoints([this.p(u, this.h, 0), this.p(u + 0.03, this.h, 0), this.p(u + 0.08, 0, 0), this.p(u + 0.05, 0, 0)], true);
    }
    // Rahmen (ohne Maske): Pfosten vorne, Kanten des Kastens, Sockel
    const f = this.scene.add.graphics().setDepth(DEPTH + 20);
    const line = (w, color, pts) => f.lineStyle(w, color, 1).strokePoints(pts, false);
    line(3, 0x8aa0b0, [this.p(1, this.h, 0), this.p(1, this.h, BACK), this.p(0, this.h, BACK), this.p(0, this.h, 0), this.p(1, this.h, 0)]); // obere Kanten
    line(3, 0x8aa0b0, [this.p(1, 0, BACK), this.p(1, this.h, BACK)]); // hintere Ecke rechts
    for (let i = 0; i <= n; i += POST_EVERY) {
      const q = this.p(i / n, 0, 0);
      f.fillStyle(0x9fb4c2, 1).fillRect(q.x - 3, q.y - this.h, 6, this.h);
      f.fillStyle(0xdbe7ee, 1).fillRect(q.x - 3, q.y - this.h, 2, this.h);
    }
    const c = this.p(1, 0, 0);
    f.fillStyle(0x9fb4c2, 1).fillRect(c.x - 3, c.y - this.h, 6, this.h); // vordere Ecke rechts
    f.fillStyle(0x6f8494, 1).fillPoints([this.p(0, -6, 0), this.p(1, -6, 0), this.p(1, 6, 0), this.p(0, 6, 0)], true); // Sockel vorne
    f.fillStyle(0x5d7182, 1).fillPoints([this.p(1, -6, 0), this.p(1, -6, BACK), this.p(1, 6, BACK), this.p(1, 6, 0)], true); // ... und rechts
  }

  newBubble(anywhere) {
    return { u: Math.random(), d: Math.random() * BACK, h: anywhere ? Phaser.Math.Between(4, this.top - 10) : 4, speed: Phaser.Math.FloatBetween(18, 34), r: Phaser.Math.FloatBetween(1, 2.6), wob: Math.random() * 6 };
  }

  // die Robben und Walrosse aus dem Außenbecken (ohne Tiere: ein kurzer Hinweis auf der Scheibe)
  makeSwimmers() {
    const saved = game.levels[this.def.level]?.animals ?? [];
    const list = saved.filter((a) => a.state === 'penned' && SWIMMERS.includes(a.species));
    if (!list.length) {
      const q = this.p(0.5, this.h * 0.55);
      this.scene.add
        .text(q.x, q.y, tr('Noch keine Robben oder Walrosse im Becken', 'No seals or walruses in the pool yet'), { fontFamily: 'Trebuchet MS, Arial', fontSize: '14px', fontStyle: 'bold', color: '#e6f4fb', stroke: '#0b2c48', strokeThickness: 4, resolution: 4 })
        .setOrigin(0.5)
        .setDepth(DEPTH + 25);
    }
    return list.map((a, i) => {
      const kind = SPECIES[a.species];
      const tex = a.skin && this.scene.textures.exists(a.skin) ? a.skin : kind.texture;
      const img = this.scene.add.sprite(0, 0, tex, kind.frames.downRight).setDepth(DEPTH + 8).setMask(this.mask);
      return {
        species: a.species,
        img,
        scale: SCALE[a.species] ?? 0.5,
        // Schwimm-Animation der Variante (seal2_underwater), sonst der Art; fehlt sie, gleitet das Standbild
        anim: [`${a.skin}_underwater`, `${a.species}_underwater`].find((k) => this.scene.anims.exists(k)) ?? null,
        u: (i + 0.5) / list.length,
        h: Phaser.Math.Between(40, this.top - 70),
        d: Phaser.Math.FloatBetween(0.3, BACK - 0.5),
        dir: Math.random() < 0.5 ? -1 : 1,
        speed: Phaser.Math.FloatBetween(...SPEED) * (a.species === 'walrus' ? 0.7 : 1),
        turnIn: Phaser.Math.FloatBetween(...TURN),
        phase: Math.random() * 6,
        goal: null,
      };
    });
  }

  update(dt) {
    this.time += dt;
    for (const v of [...this.visitors]) this.updateVisitor(v, dt);
    for (const s of this.swimmers) {
      s.turnIn -= dt;
      s.u += s.dir * s.speed * dt;
      if (s.u < 0.06 || s.u > 0.94 || s.turnIn <= 0) {
        if (s.u < 0.06) s.dir = 1;
        else if (s.u > 0.94) s.dir = -1;
        else s.dir = -s.dir;
        s.turnIn = Phaser.Math.FloatBetween(...TURN);
        s.goal = { h: Phaser.Math.Between(40, this.top - 70), d: Phaser.Math.FloatBetween(0.3, BACK - 0.5) }; // mal tiefer, mal weiter vorne
      }
      if (s.goal) {
        s.h += Phaser.Math.Clamp(s.goal.h - s.h, -14 * dt, 14 * dt);
        s.d += Phaser.Math.Clamp(s.goal.d - s.d, -0.25 * dt, 0.25 * dt);
      }
      const bob = Math.sin(this.time * 1.6 + s.phase) * 5;
      const q = this.p(s.u, s.h + bob, s.d);
      const far = s.d / BACK;
      // weiter hinten: etwas kleiner, blasser und bläulicher; die vorderen liegen vor den hinteren
      s.img.setPosition(q.x, q.y).setScale(s.scale * (1 - far * 0.18)).setTint(lerpColor(0xffffff, FOG, far * 0.75)).setDepth(DEPTH + 8 + (BACK - s.d) * 0.1);
      // Seitenansicht: nach rechts schwimmend wie gemalt, nach links gespiegelt; leicht geneigt beim Auf und Ab
      if (s.anim) {
        if (s.img.anims.currentAnim?.key !== s.anim) s.img.play(s.anim);
        s.img.setFlipX(s.dir < 0);
      } else s.img.setFrame(SPECIES[s.species].frames.downRight).setFlipX(s.dir < 0);
      s.img.setAngle(Math.cos(this.time * 1.6 + s.phase) * 6 * s.dir);
    }
    // Bläschen steigen auf und zerplatzen an der Oberfläche
    const g = this.fx;
    g.clear();
    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      b.h += b.speed * dt;
      if (b.h > this.top - 4) {
        this.bubbles[i] = this.newBubble(false);
        continue;
      }
      const q = this.p(b.u, b.h, b.d);
      g.lineStyle(1, 0xd8f0fa, 0.75 - (b.d / BACK) * 0.4).strokeCircle(q.x + Math.sin(this.time * 2 + b.wob) * 2, q.y, b.r);
    }
  }
}
