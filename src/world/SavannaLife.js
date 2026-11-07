// Leben in der Savanne: der dunkle Boden des Elefantenfriedhofs (gravePatch in levels.js), Termiten an den Termitenhügeln
// (krabbeln am Hügel und laufen auf einer Termitenstraße) und Insektenschwärme (flies) je Wetterphase – normal ein paar
// Fliegen am Elefantenfriedhof, in der Trockenzeit mehr und auch über dem Schlamm, bei Starkregen Mückenschwärme über dem
// Wasser. Kleine Punkte, die um ihre Stelle kreisen bzw. krabbeln. Nur Deko.
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';
import { LEVEL, MAP_W, MAP_H, charAt } from './map.js';

const GRAVE = 'ȘƭƮƱ'; // Elefantenfriedhof
const PATCH_DEPTH = -99996; // flach auf dem Boden, unter allem, was steht
const KIND = {
  fly: { n: [7, 11], color: 0x1c1a16, size: 0.9, height: [8, 22], radius: [6, 16], speed: [3, 6] },
  mosquito: { n: [10, 16], color: 0x55524a, size: 0.7, height: [14, 34], radius: [10, 24], speed: [2, 4] },
};
const SWARMS = { normal: { grave: 2, mud: 0, water: 0 }, dry: { grave: 3, mud: 3, water: 0 }, rain: { grave: 0, mud: 0, water: 4 } };
// Termiten an den Termitenhügeln (Ţ)
const TERMITE_COLOR = 0x2a1a10;
const TERMITE_SIZE = 0.7;
const ROAD_TERMITES = 16; // so viele laufen auf der Termitenstraße (abwechselnd hinaus und zurück)
const ROAD_SPEED = 0.06; // Anteil der Straße pro Sekunde
const TRAIL_LEN = 1.8; // so lang ist die Straße (Kacheln)
const CLIMBERS = 8; // so viele krabbeln am Hügel hoch und runter
const CLIMB_HEIGHT = 34; // so hoch klettern sie (Pixel über dem Fuß)
const MOUND_HALF_WIDTH = 9; // halbe Breite des Hügels am Fuß

export default class SavannaLife {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    const g = LEVEL.gravePatch;
    if (g) {
      const p = tileToWorld(g.tx, g.ty);
      scene.add.image(p.x, p.y, g.key).setDepth(PATCH_DEPTH);
    }
    const plan = SWARMS[LEVEL.season] ?? SWARMS.normal;
    const tiles = (test) => {
      const out = [];
      for (let ty = 1; ty < MAP_H - 1; ty++) for (let tx = 1; tx < MAP_W - 1; tx++) if (test(charAt(tx, ty), tx, ty)) out.push({ tx, ty });
      return Phaser.Utils.Array.Shuffle(out);
    };
    // am Wasser: nur Uferkacheln (Wasser mit Land daneben), damit die Mücken nicht mitten auf dem See schwirren
    const shore = (c, tx, ty) => c === '~' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => charAt(tx + dx, ty + dy) !== '~');
    const spots = [
      ...tiles((c) => GRAVE.includes(c)).slice(0, plan.grave).map((t) => ({ ...t, kind: 'fly' })),
      ...tiles((c) => c === '≈').slice(0, plan.mud).map((t) => ({ ...t, kind: 'fly' })),
      ...tiles(shore).slice(0, plan.water).map((t) => ({ ...t, kind: 'mosquito' })),
    ];
    this.bugs = spots.flatMap(({ tx, ty, kind }) => {
      const k = KIND[kind];
      const c = tileToWorld(tx, ty);
      return Array.from({ length: Phaser.Math.Between(...k.n) }, () => ({
        dot: scene.add.circle(c.x, c.y, k.size, k.color, 0.9).setDepth(c.y + 40),
        cx: c.x,
        cy: c.y,
        r: Phaser.Math.FloatBetween(...k.radius),
        h: Phaser.Math.FloatBetween(...k.height),
        speed: Phaser.Math.FloatBetween(...k.speed) * (Math.random() < 0.5 ? -1 : 1),
        phase: Math.random() * 10,
      }));
    });
    this.mounds = tiles((c) => c === 'Ţ').map(({ tx, ty }) => this.termiteMound(tx, ty));
  }

  // Termiten an einem Termitenhügel: ein paar krabbeln am Hügel hoch und runter, und vom Fuß führt eine Termitenstraße ein
  // Stück hinaus (zwei Spuren: hinaus und zurück), in eine Richtung, in der freier Boden liegt
  termiteMound(tx, ty) {
    const free = (x, y) => '.yƚ'.includes(charAt(x, y));
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]].filter(([dx, dy]) => free(tx + dx, ty + dy) && free(tx + 2 * dx, ty + 2 * dy));
    const [dx, dy] = dirs[((tx * 31 + ty * 17) >>> 0) % Math.max(1, dirs.length)] ?? [0, 1];
    const foot = tileToWorld(tx, ty);
    const end = tileToWorld(tx + dx * TRAIL_LEN, ty + dy * TRAIL_LEN);
    const len = Math.hypot(end.x - foot.x, end.y - foot.y) || 1;
    const nx = -(end.y - foot.y) / len, ny = (end.x - foot.x) / len; // quer zur Straße
    const bend = Phaser.Math.FloatBetween(-12, 12);
    const ctrl = { x: (foot.x + end.x) / 2 + nx * bend, y: (foot.y + end.y) / 2 + ny * bend * 0.5 };
    const dot = () => this.scene.add.circle(foot.x, foot.y, TERMITE_SIZE, TERMITE_COLOR, 0.95);
    return {
      foot,
      end,
      ctrl,
      nx,
      ny,
      road: Array.from({ length: ROAD_TERMITES }, (_, i) => ({ dot: dot(), u: i / ROAD_TERMITES + Math.random() * 0.04, out: i % 2 === 0 })),
      climbers: Array.from({ length: CLIMBERS }, () => ({ dot: dot(), side: Math.random() < 0.5 ? -1 : 1, speed: Phaser.Math.FloatBetween(0.5, 1), phase: Math.random() * 10 })),
    };
  }

  updateMound(m, dt) {
    const at = (u) => {
      const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
      return { x: a * m.foot.x + b * m.ctrl.x + c * m.end.x, y: a * m.foot.y + b * m.ctrl.y + c * m.end.y };
    };
    for (const t of m.road) {
      t.u = (t.u + dt * ROAD_SPEED) % 1;
      const u = t.out ? t.u : 1 - t.u; // die eine Spur hinaus, die andere zurück
      const p = at(u);
      const lane = t.out ? 1.2 : -1.2;
      const wiggle = Math.sin((this.time + t.u * 40) * 9) * 0.4;
      t.dot.setPosition(p.x + m.nx * (lane + wiggle), p.y + m.ny * (lane + wiggle) * 0.5).setDepth(p.y);
    }
    for (const c of m.climbers) {
      const k = 0.5 + 0.5 * Math.sin(this.time * c.speed + c.phase); // 0 am Fuß, 1 oben
      const h = k * CLIMB_HEIGHT;
      const x = m.foot.x + c.side * (MOUND_HALF_WIDTH * (1 - k * 0.7)) + Math.sin(this.time * 3 + c.phase) * 1.2;
      c.dot.setPosition(x, m.foot.y - h).setDepth(m.foot.y + 1);
    }
  }

  update(dt) {
    this.time += dt;
    const view = this.scene.cameras.main.worldView;
    for (const m of this.mounds) if (view.contains(m.foot.x, m.foot.y - 20)) this.updateMound(m, dt);
    for (const b of this.bugs) {
      if (!view.contains(b.cx, b.cy - 20)) continue; // nur, was man sieht
      const t = this.time * b.speed + b.phase;
      const x = b.cx + Math.cos(t) * b.r + Math.sin(t * 2.7) * 3;
      const y = b.cy + Math.sin(t) * b.r * 0.5 - b.h + Math.cos(t * 3.1) * 2;
      b.dot.setPosition(x, y);
    }
  }
}
