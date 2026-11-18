// Schneedecke über dem Boden (Angaben in levels.js: snowline = { full, band }): bis zur Zeile full liegt eine dichte
// Schneedecke auf dem Gras (nur hier und da schaut ein Büschel heraus), darunter läuft sie über band Zeilen weich aus –
// erst geschlossen, dann in Flecken, zuletzt nur noch ein paar Tupfer.
// Die Kante folgt einem welligen Rauschen in Weltkoordinaten (nicht den Kacheln), deshalb gibt es keine Rautenkanten.
// Ein Bild in geringer Auflösung (weich vergrößert), einmal beim Betreten gemalt, gleich über dem Boden und unter allem
// anderen. Auf dem Weg liegt weniger Schnee, damit man ihn noch sieht; heiße Quellen und Wasser bleiben frei.
// Außerdem hinterlässt Henrik im Schnee Fußspuren (wie in der Eiswelt), umso deutlicher, je dichter der Schnee liegt.
import { TILE_W, TILE_H, worldToTile } from './iso.js';
import { LEVEL, MAP_W, MAP_H, buildingAt, charAt } from './map.js';

const RES = 0.25; // Bildpunkte je Weltpixel (weich vergrößert)
const DEPTH = -99995; // über dem gebackenen Boden (-100000), unter Wegzeichen, Schatten und Dingen
const SNOW = [242, 246, 250];
const THIN = [214, 224, 236]; // dünner Schnee etwas bläulich
const ON_PATH = 0.45; // so viel Schnee bleibt auf dem Weg liegen
const MAX = 0.94; // dichteste Schneedecke
const TUFT = 0.22; // wo das feine Rauschen darunter liegt, schauen Grasbüschel heraus
const FREE = 'h~'; // hier liegt kein Schnee (heiße Quelle, Wasser)
// Fußspuren (wie in der Eiswelt, siehe updateSteps in Weather.js)
const STEP_GAP = 14; // alle so viele Pixel eine Fußspur
const STEP_FADE = 25000; // so lange (ms) bleibt sie zu sehen
const STEP_MIN = 0.35; // erst ab so viel Schnee
const MAX_STEPS = 60;

// weiches Rauschen zwischen 0 und 1 auf einem Gitter (Abstand cell Kacheln), dazwischen weich überblendet
function noise(x, y, cell, seed) {
  const at = (i, j) => (((i * 73856093) ^ (j * 19349663) ^ (seed * 83492791)) >>> 0) % 1000 / 1000;
  const gx = x / cell, gy = y / cell;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
  const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
  return top * (1 - sy) + bottom * sy;
}

// Weltpunkt → Kachel (gebrochen); siehe tileToWorld in iso.js
function toTile(x, y) {
  const u = (y - TILE_H / 2) / (TILE_H / 2);
  const v = x / (TILE_W / 2);
  return { tx: (u + v) / 2, ty: (u - v) / 2 };
}

// weich überblendet: liegt der Punkt auf einer Kachel ohne Schnee (Quelle, Wasser)? 0 bis 1
function freeAt(tx, ty) {
  const x0 = Math.floor(tx), y0 = Math.floor(ty);
  const fx = tx - x0, fy = ty - y0;
  const f = (x, y) => (FREE.includes(charAt(x, y)) ? 1 : 0);
  const v = (f(x0, y0) * (1 - fx) + f(x0 + 1, y0) * fx) * (1 - fy) + (f(x0, y0 + 1) * (1 - fx) + f(x0 + 1, y0 + 1) * fx) * fy;
  return Math.max(0, Math.min(1, (v - 0.25) * 2.5));
}

export default class SnowCover {
  constructor(scene) {
    this.scene = scene;
    this.steps = [];
    // Schneegrenze: ganze Breite, bis zur Zeile last
    this.line = LEVEL.snowline;
    this.last = Math.min(MAP_H - 1, this.line.full + this.line.band + 1);
    this.ranges = [{ tx0: 0, tx1: MAP_W - 1, ty0: 0, ty1: this.last }];
    // Bereich in Weltkoordinaten: alle diese Kacheln
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const r of this.ranges) {
      for (const [tx, ty] of [[r.tx0, r.ty0], [r.tx1, r.ty0], [r.tx0, r.ty1], [r.tx1, r.ty1]]) {
        const x = (tx - ty) * (TILE_W / 2);
        const y = (tx + ty) * (TILE_H / 2) + TILE_H / 2;
        x0 = Math.min(x0, x - TILE_W); x1 = Math.max(x1, x + TILE_W);
        y0 = Math.min(y0, y - TILE_H); y1 = Math.max(y1, y + TILE_H);
      }
    }
    const w = Math.ceil((x1 - x0) * RES);
    const h = Math.ceil((y1 - y0) * RES);
    const key = `snowcover_${scene.time.now}`;
    const tex = scene.textures.createCanvas(key, w, h);
    this.key = key;
    scene.events.once('shutdown', () => scene.textures.exists(key) && scene.textures.remove(key));
    const ctx = tex.getContext();
    const img = ctx.createImageData(w, h);
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const { tx, ty } = toTile(x0 + px / RES, y0 + py / RES);
        if (!this.ranges.some((r) => tx > r.tx0 - 0.5 && tx < r.tx1 + 0.5 && ty > r.ty0 - 0.5 && ty < r.ty1 + 0.5)) continue;
        const a = this.amount(tx, ty, true);
        if (a <= 0) continue;
        const thin = 1 - a;
        const shade = 1 + (noise(tx, ty, 1.3, 4) - 0.5) * 0.06; // sanfte Wellen im Schnee
        const i = (py * w + px) * 4;
        img.data[i] = (SNOW[0] * (1 - thin) + THIN[0] * thin) * shade;
        img.data[i + 1] = (SNOW[1] * (1 - thin) + THIN[1] * thin) * shade;
        img.data[i + 2] = (SNOW[2] * (1 - thin) + THIN[2] * thin) * shade;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
    this.image = scene.add.image(x0, y0, key).setOrigin(0).setScale(1 / RES).setDepth(DEPTH);
  }

  // wie dicht liegt hier Schnee (0 bis 1)? Kachel gebrochen; path: auf dem Weg weniger
  amount(tx, ty, path = false) {
    if (ty > this.last + 0.5) return 0;
    // geschlossen bis full, dann über band Zeilen auslaufend; die Kante wellig (grobes Rauschen), darin Flecken (feines)
    const { full, band } = this.line;
    const ramp = (full + band - ty) / band + (noise(tx, ty, 3, 1) - 0.5) * 0.7;
    const fine = noise(tx, ty, 0.7, 2) * 0.6 + noise(tx, ty, 0.25, 3) * 0.4;
    let a = Math.max(0, Math.min(1, (ramp + (fine - 0.5) * 0.9 - 0.5) * 2.4 + 0.5));
    // nie ganz deckend: das Gras darunter schimmert leicht durch, an einzelnen Stellen schauen Büschel heraus
    a = Math.min(a, MAX - (fine < TUFT ? (TUFT - fine) * 1.6 : 0));
    a *= 1 - freeAt(tx, ty);
    if (path && charAt(Math.round(tx), Math.round(ty)) === '#') a *= ON_PATH;
    return a;
  }

  // Fußspuren hinter Henrik, abwechselnd links und rechts
  update() {
    const p = this.scene.player;
    if (!this.lastStep) this.lastStep = { x: p.x, y: p.y, left: false };
    if (Math.hypot(p.x - this.lastStep.x, (p.y - this.lastStep.y) * 2) <= STEP_GAP) return;
    const left = !this.lastStep.left;
    this.lastStep = { x: p.x, y: p.y, left };
    const { tx, ty } = toTile(p.x, p.y);
    const a = this.amount(tx, ty, true);
    const t = worldToTile(p.x, p.y);
    if (a < STEP_MIN || buildingAt(t.tx, t.ty) || p.boat) return;
    const side = left ? -3 : 3;
    const step = this.scene.add.ellipse(p.x + side, p.y + side * 0.5, 5, 2.5, 0x7f97b0, 0.42 * a).setDepth(DEPTH + 6);
    this.scene.tweens.add({ targets: step, alpha: 0, delay: STEP_FADE * 0.6, duration: STEP_FADE * 0.4, onComplete: () => step.destroy() });
    this.steps.push(step);
    if (this.steps.length > MAX_STEPS) this.steps.shift().destroy();
  }
}
