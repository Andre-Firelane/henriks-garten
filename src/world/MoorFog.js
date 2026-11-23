// Nebel über dem Moor (Süden des Walds, LEVEL.moorFog: Rechteck in Kacheln). Kein gleichmäßiger Schleier, sondern:
// - liegende Schwaden: über den Tümpeln dicht, über dem Land nur dünn (je nachdem, wie viel Wasser ringsum ist), zum
//   Rand des Moors hin immer dünner; sie wabern langsam hin und her.
// - Nebelbänke: eine langsam wandernde Dichte-Karte macht den Nebel stellenweise dicker und dünner, sodass mal eine
//   Bank über das Moor zieht und mal eine Lücke aufgeht.
// - aufsteigende Schwaden: über dem Wasser in Henriks Nähe steigen immer wieder einzelne Fahnen auf, werden größer
//   und verblassen.
// Der Nebel liegt über allem auf der Karte (auch über Bäumen und Tieren). Um Henrik lichtet er sich ein wenig (clear),
// damit man sich selbst noch sieht; im Licht der Moorlaterne (in der Hand oder abgestellt, siehe lanternLights in
// GardenScene) verschwindet er in einem großen Kreis fast ganz. Er ist immer da (kein Wetter).
import Phaser from 'phaser';
import { glowTexture } from './Fireflies.js';
import { tileToWorld } from './iso.js';
import { LEVEL, charAt } from './map.js';

const DEPTH = 99920; // über allem auf der Karte, unter Wetter und Dunkelheit
const TINT = 0xeef2ee;
const ALPHA_WATER = 0.36; // Deckkraft einer liegenden Schwade über dem Wasser ...
const ALPHA_LAND = 0.12; // ... und über dem Land
const PUFF_SCALE = [3, 4.6]; // Größe einer liegenden Schwade (mal 64 Pixel), flach gedrückt
const JITTER = 14; // so weit (Pixel) liegt sie neben der Kachelmitte
const EDGE = 3; // so viele Kacheln vom Rand des Moors bis zum vollen Nebel
const DRIFT = 12; // so weit (Pixel) wabert eine Schwade hin und her
const BANKS = [0.3, 1.45]; // Nebelbänke: so stark schwankt die Dichte (dünnste Lücke, dickste Bank)
// Am Tablet weniger Schwaden: jede ist ein großes, halb durchsichtiges Bild, und über jeder Moorkachel liegt eine; der
// Grafikchip müsste den Bildschirm sonst viele Male übermalen (ruckelt). Dort nur jede vierte Kachel (jede zweite in
// beiden Richtungen), dafür größer und dichter, und halb so viele aufsteigende
const TOUCH = matchMedia('(pointer: coarse)').matches;
const STRIDE = TOUCH ? 2 : 1;
const TOUCH_SIZE = TOUCH ? 1.45 : 1; // so viel größer ...
const TOUCH_ALPHA = TOUCH ? 1.7 : 1; // ... und dichter ist dann eine liegende Schwade
const RISERS = TOUCH ? 13 : 26; // so viele aufsteigende Schwaden gleichzeitig
const RISE_NEAR = 650; // nur über Wasser in dieser Entfernung (Welt-Pixel) von Henrik
const RISE = [7, 13]; // so schnell steigen sie (Pixel pro Sekunde)
const RISE_LIFE = [6, 11]; // so lange (Sekunden)
const RISE_ALPHA = 0.3;
const CLEAR = 70; // so weit um Henrik ist der Nebel ganz dünn ...
const CLEAR_FADE = 120; // ... und wird über diese Strecke wieder dicht
const THIN = 0.2; // so viel Nebel bleibt in Henriks Nähe übrig
export const LANTERN_R = 140; // so weit (Welt-Pixel, Höhe doppelt gezählt) leuchtet die Moorlaterne den Nebel ganz weg ...
export const LANTERN_FADE = 70; // ... und über diese Strecke wird er wieder dicht
const LANTERN_THIN = 0.08; // so viel Nebel bleibt im Laternenlicht übrig

// Helligkeit der Moorlaterne an einem Punkt (0 dunkel, 1 im vollen Licht); lights: [{ x, y }]
export function lanternLight(lights, x, y) {
  let best = 0;
  for (const l of lights) {
    const d = Math.hypot(x - l.x, (y - l.y) * 2);
    best = Math.max(best, 1 - Math.min(1, Math.max(0, (d - LANTERN_R) / LANTERN_FADE)));
  }
  return best;
}

const isWater = (tx, ty) => '~Ŝǒ'.includes(charAt(tx, ty) ?? ' ');

// Nebelbänke: weiche, langsam wandernde Dichte (0..1) an einem Weltpunkt
function bank(x, y, t) {
  const v = Math.sin(x * 0.0042 + t * 0.07) * Math.sin(y * 0.0095 - t * 0.05) * 0.5
    + Math.sin((x + y * 1.7) * 0.0031 + t * 0.11) * 0.35
    + Math.sin((x - y * 2.3) * 0.0057 - t * 0.09) * 0.15;
  return 0.5 + v * 0.5;
}

export default class MoorFog {
  constructor(scene, area = LEVEL.moorFog) {
    this.scene = scene;
    this.area = area;
    this.clear = CLEAR; // die Moorlaterne kann ihn vergrößern
    this.time = 0;
    this.lights = [];
    this.tex = glowTexture(scene);
    this.puffs = [];
    this.water = [];
    for (let ty = area.ty0; ty <= area.ty1; ty++) {
      for (let tx = area.tx0; tx <= area.tx1; tx++) {
        // Wasseranteil ringsum (3×3): so dicht liegt hier der Nebel
        let wet = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) wet += isWater(tx + dx, ty + dy) ? 1 : 0;
        wet /= 9;
        if (isWater(tx, ty)) this.water.push({ tx, ty });
        if ((tx - area.tx0) % STRIDE || (ty - area.ty0) % STRIDE) continue; // (am Tablet nur jede vierte Kachel)
        const edge = Math.min(1, (Math.min(tx - area.tx0, area.tx1 - tx, ty - area.ty0, area.ty1 - ty) + 1) / EDGE);
        const base = (ALPHA_LAND + (ALPHA_WATER - ALPHA_LAND) * Math.min(1, wet * 1.6)) * edge * TOUCH_ALPHA;
        const p = tileToWorld(tx, ty);
        const x = p.x + Phaser.Math.Between(-JITTER, JITTER), y = p.y - 10 + Phaser.Math.Between(-JITTER / 2, JITTER / 2);
        const s = Phaser.Math.FloatBetween(...PUFF_SCALE) * TOUCH_SIZE;
        const img = scene.add.image(x, y, this.tex).setScale(s * Phaser.Math.FloatBetween(1, 1.4), s * 0.45).setTint(TINT).setDepth(DEPTH).setAlpha(0);
        this.puffs.push({ img, x, y, base, phase: Math.random() * 10, speed: Phaser.Math.FloatBetween(0.12, 0.28) });
      }
    }
    this.risers = Array.from({ length: this.water.length ? RISERS : 0 }, () => this.newRiser(Math.random()));
  }

  // aufsteigende Schwade über einer Wasserkachel in Henriks Nähe; age: wie weit sie schon ist (0..1)
  newRiser(age = 0) {
    const pl = this.scene.player;
    let t = null;
    for (let i = 0; i < 12; i++) {
      const c = Phaser.Utils.Array.GetRandom(this.water);
      const w = tileToWorld(c.tx, c.ty);
      if (Math.hypot(w.x - pl.x, (w.y - pl.y) * 2) < RISE_NEAR) {
        t = w;
        break;
      }
    }
    const life = Phaser.Math.FloatBetween(...RISE_LIFE);
    const img = this.scene.add.image(0, 0, this.tex).setTint(TINT).setDepth(DEPTH + 1).setAlpha(0);
    if (!t) return { img, idle: true, age: 0, life: 1 };
    return { img, x: t.x + Phaser.Math.Between(-20, 20), y: t.y, age: age * life, life, rise: Phaser.Math.FloatBetween(...RISE), drift: Phaser.Math.FloatBetween(-6, 6), size: Phaser.Math.FloatBetween(1.2, 2.2) };
  }

  // so dünn ist der Nebel an dieser Stelle wegen Henrik und der Laterne (fast nichts im Licht, 1 weit weg)
  nearHenrik(x, y) {
    const pl = this.scene.player;
    const d = Math.hypot(x - pl.x, (y - pl.y) * 2);
    const own = THIN + (1 - THIN) * Phaser.Math.Clamp((d - this.clear) / CLEAR_FADE, 0, 1);
    const lit = lanternLight(this.lights, x, y);
    return Math.min(own, 1 - lit * (1 - LANTERN_THIN));
  }

  update(dt) {
    this.time += dt;
    this.lights = this.scene.lanternLights?.() ?? [];
    const cam = this.scene.cameras.main.worldView;
    const inView = (x, y) => x > cam.x - 220 && x < cam.right + 220 && y > cam.y - 140 && y < cam.bottom + 140;
    for (const f of this.puffs) {
      if (!inView(f.x, f.y)) {
        f.img.setVisible(false);
        continue;
      }
      const t = this.time * f.speed + f.phase;
      const x = f.x + Math.sin(t) * DRIFT;
      const y = f.y + Math.cos(t * 0.7) * DRIFT * 0.4;
      const banks = BANKS[0] + (BANKS[1] - BANKS[0]) * bank(x, y, this.time);
      f.img.setVisible(true).setPosition(x, y).setAlpha(Math.min(0.9, f.base * banks * this.nearHenrik(x, y)));
    }
    for (let i = 0; i < this.risers.length; i++) {
      const r = this.risers[i];
      r.age += dt;
      if (r.idle || r.age >= r.life) {
        if (r.idle && r.age < 1) continue; // gerade kein Wasser in der Nähe: später nochmal versuchen
        r.img.destroy();
        this.risers[i] = this.newRiser();
        continue;
      }
      const k = r.age / r.life;
      const x = r.x + r.drift * k * 2, y = r.y - r.rise * r.age;
      if (!inView(x, y)) {
        r.img.setVisible(false);
        continue;
      }
      const fade = Math.min(1, k * 4) * Math.min(1, (1 - k) * 2.5); // sanft auftauchen und verblassen
      r.img.setVisible(true).setPosition(x, y).setScale(r.size * (0.7 + k * 0.9), r.size * (0.5 + k * 0.4)).setAlpha(RISE_ALPHA * fade * this.nearHenrik(x, y));
    }
  }

  destroy() {
    for (const f of this.puffs) f.img.destroy();
    for (const r of this.risers) r.img.destroy();
    this.puffs = [];
    this.risers = [];
  }
}
