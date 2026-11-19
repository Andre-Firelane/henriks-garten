// Elch (Wald, Moor): steht wild immer im Moorwasser, bis zum Bauch darin ("elk_water": nur der obere Teil), und watet
// langsam durch seinen Tümpel. Im Moornebel sieht man von ihm nur einen dunklen Schemen (über dem Nebel gezeichnet).
// Erst im Licht der Moorlaterne (siehe LanternTool.js und lanternLights in GardenScene) wird er richtig sichtbar – und
// nur dann lässt er sich mit dem Lasso fangen. Eine abgestellte Laterne macht ihn neugierig: liegt sie nah genug an
// seinem Tümpel, watet er zu der Stelle, die ihr am nächsten ist, und schaut ins Licht.
// Gefangen, folgend und im Gehege ist er ein ganz normales Tier an Land (ganzes Bild).
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { LEVEL, MAP_W, MAP_H, charAt } from '../world/map.js';
import { drawWaterFoam, waterEdge } from './waterFoam.js';

const WATER_ORIGIN_Y = 72 / 112; // Wasserlinie (Mitte der schrägen Kante) im Bild "elk_water"
const WADE_SPEED = 9; // gemächliches Waten
const LURE_SPEED = 14; // zur Laterne etwas zügiger
const LURE_RANGE = 360; // so weit weg (Welt-Pixel, Höhe doppelt gezählt) bemerkt er eine abgestellte Laterne
const LURE_STOP = 6; // so nah an seinem Platz beim Licht bleibt er stehen
const WANDER = 2; // so viele Kacheln weit sucht er sich beim Waten das nächste Ziel
const SHADE = 0x46524d; // Farbe des Schemens im Nebel (dunkles Graugrün) ...
const SHADE_ALPHA = 0.32; // ... und wie deutlich er zu sehen ist
const SHADE_DEPTH = 99921.5; // über dem Moornebel (99920) und den aufsteigenden Schwaden
const CATCH_LIGHT = 0.6; // so hell muss es um ihn sein, damit man ihn fangen kann
const FOAM_STEP = 7; // Schaumkante: etwa alle so viele Bildpixel ein Bläschen
const CALL_EVERY = [25, 50]; // so oft grunzt er aus dem Nebel (Sekunden) ...
const CALL_VOLUME = 0.4; // ... ganz nah so laut

// Wasser im Moor (LEVEL.moorFog, sonst überall), je Tümpel durchnummeriert; einmal je Karte
function moorWater(scene) {
  if (scene._moorWater?.level === LEVEL) return scene._moorWater;
  const a = LEVEL.moorFog ?? { tx0: 0, tx1: MAP_W - 1, ty0: 0, ty1: MAP_H - 1 };
  const isWet = (tx, ty) => tx >= a.tx0 && tx <= a.tx1 && ty >= a.ty0 && ty <= a.ty1 && charAt(tx, ty) === '~';
  const pool = new Map(); // "tx,ty" -> Nummer des Tümpels
  const tiles = [];
  let n = 0;
  for (let ty = a.ty0; ty <= a.ty1; ty++) {
    for (let tx = a.tx0; tx <= a.tx1; tx++) {
      if (!isWet(tx, ty) || pool.has(tx + ',' + ty)) continue;
      const todo = [[tx, ty]];
      pool.set(tx + ',' + ty, n);
      while (todo.length) {
        const [x, y] = todo.pop();
        tiles.push({ tx: x, ty: y, pool: n });
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = x + dx + ',' + (y + dy);
          if (!pool.has(k) && isWet(x + dx, y + dy)) {
            pool.set(k, n);
            todo.push([x + dx, y + dy]);
          }
        }
      }
      n++;
    }
  }
  scene._moorWater = { level: LEVEL, tiles, pool, isWet };
  return scene._moorWater;
}

export default class Elk extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'elk');
    this.unplaced = true; // erst beim ersten Bild in einen Tümpel (die Szene setzt die Position nach dem Erzeugen)
    this.lit = 0;
    this.ghost = scene.add.image(x, y, 'elk_water', 0).setTintFill(SHADE).setDepth(SHADE_DEPTH).setAlpha(0);
    this.foam = scene.add.graphics(); // Schaum an der Wasserkante
  }

  // irgendwo im Moorwasser (lieber dort, wo ringsum Wasser ist: dann steht er nicht halb im Ufer), nicht neben einem
  // anderen Elch
  placeInWater() {
    const w = moorWater(this.scene);
    const others = this.scene.animals.filter((a) => a !== this && a.species === 'elk' && a.state === 'wild').map((a) => worldToTile(a.x, a.y));
    const free = w.tiles.filter(({ tx, ty }) => !others.some((o) => Math.abs(o.tx - tx) + Math.abs(o.ty - ty) < 6));
    const pick = free.length ? free : w.tiles;
    const deep = pick.filter(({ tx, ty }) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => w.isWet(tx + dx, ty + dy)));
    const t = Phaser.Utils.Array.GetRandom(deep.length ? deep : pick);
    if (!t) return;
    Object.assign(this, tileToWorld(t.tx, t.ty));
    this.drift = null;
  }

  // sein Tümpel
  poolId() {
    const { tx, ty } = worldToTile(this.x, this.y);
    return moorWater(this.scene).pool.get(tx + ',' + ty);
  }

  // im Tümpel die Stelle, die der Laterne am nächsten ist (oder null, wenn sie zu weit weg steht)
  lureSpot(lantern) {
    if (this.lure?.lantern === lantern) return this.lure.spot;
    const id = this.poolId();
    const best = moorWater(this.scene).tiles
      .filter((t) => t.pool === id)
      .map((t) => ({ ...tileToWorld(t.tx, t.ty) }))
      .map((p) => ({ p, d: Math.hypot(p.x - lantern.x, (p.y - lantern.y) * 2) }))
      .sort((u, v) => u.d - v.d)[0];
    const spot = best && best.d < LURE_RANGE ? best.p : null;
    this.lure = { lantern, spot };
    return spot;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.unplaced) {
      this.unplaced = false;
      this.placeInWater();
    }
    this.callFromFog(dt, player);
    // abgestellte Laterne in der Nähe: hinwaten und ins Licht schauen
    const lantern = this.scene.lantern;
    const spot = lantern && this.lureSpot(lantern);
    if (spot) {
      const dx = spot.x - this.x, dy = spot.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > LURE_STOP) {
        const step = Math.min(d, LURE_SPEED * dt);
        if (this.move((dx / d) * step, (dy / d) * step)) return true;
      }
      this.faceX = Math.sign(lantern.x - this.x) || this.faceX;
      this.faceY = Math.sign(lantern.y - this.y) || this.faceY;
      return false;
    }
    // sonst langsam durch den Tümpel waten, mit Pausen
    this.wanderTime -= dt;
    if (this.wanderTime <= 0) {
      this.pickWander();
      this.drift = null;
      if (this.dirX || this.dirY) {
        const { tx, ty } = worldToTile(this.x, this.y);
        const id = this.poolId();
        const near = moorWater(this.scene).tiles.filter((t) => t.pool === id && Math.abs(t.tx - tx) <= WANDER && Math.abs(t.ty - ty) <= WANDER);
        const t = Phaser.Utils.Array.GetRandom(near);
        this.drift = t ? tileToWorld(t.tx, t.ty) : null;
      }
    }
    if (!this.drift) return false;
    const dx = this.drift.x - this.x, dy = this.drift.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) {
      this.drift = null;
      return false;
    }
    const step = Math.min(d, WADE_SPEED * dt);
    if (!this.move((dx / d) * step, (dy / d) * step)) this.drift = null;
    return true;
  }

  // ab und zu ein tiefes Grunzen aus dem Nebel (je näher, desto lauter)
  callFromFog(dt, player) {
    this.callIn = (this.callIn ?? Phaser.Math.FloatBetween(6, CALL_EVERY[1])) - dt;
    if (this.callIn > 0) return;
    this.callIn = Phaser.Math.FloatBetween(...CALL_EVERY);
    const d = Math.hypot(player.x - this.x, (player.y - this.y) * 2);
    if (d < 700 && this.scene.cache.audio.exists('animal_elk')) this.scene.sound.play('animal_elk', { volume: CALL_VOLUME * (1 - d / 700), detune: Phaser.Math.Between(-120, 60) });
  }

  // wild nur im Moorwasser
  blocked(x, y) {
    if (this.state !== 'wild') return super.blocked(x, y);
    const { tx, ty } = worldToTile(x, y);
    return !moorWater(this.scene).isWet(tx, ty);
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.lit >= CATCH_LIGHT;
  }

  render(moving) {
    if (this.state !== 'wild') {
      this.ghost.setVisible(false);
      this.foam.clear();
      if (this.sprite.texture.key.endsWith('_water')) this.sprite.setTexture(this.baseTexture(), 0).setOrigin(0.5, this.kind.originY);
      this.sprite.setAlpha(1);
      this.shadow.setVisible(this.state !== 'trapped');
      return super.render(moving);
    }
    // im Wasser: nur der obere Teil, kein Schatten, kein Wippen
    const key = `${this.baseTexture()}_water`;
    if (this.sprite.texture.key !== key) this.sprite.stop().setFlipX(false).setTexture(key, 0).setOrigin(0.5, WATER_ORIGIN_Y);
    const f = this.kind.frames;
    const frame = this.faceY > 0 ? (this.faceX < 0 ? f.downLeft : f.downRight) : this.faceX > 0 ? f.upRight : f.upLeft;
    this.sprite.setFrame(frame).setPosition(this.x, this.y).setDepth(this.y).setAngle(0);
    this.shadow.setVisible(false);
    // im Licht der Laterne sichtbar, sonst nur der Schemen über dem Nebel
    this.lit = this.scene.lightAt?.(this.x, this.y - 16) ?? 1;
    this.sprite.setAlpha(this.lit);
    const shade = SHADE_ALPHA * (1 - this.lit) * (this.sprite.visible ? 1 : 0);
    this.ghost.setTexture(key, frame).setOrigin(0.5, WATER_ORIGIN_Y).setPosition(this.x, this.y).setScale(this.sprite.scaleX).setAlpha(shade).setVisible(shade > 0.01);
    this.drawFoam();
  }

  // schaumige Kante, wo der Körper aus dem Wasser schaut (siehe waterFoam.js)
  drawFoam() {
    if (this.lit < 0.05) return this.foam.clear();
    drawWaterFoam(this.foam, this.scene, this.sprite, waterEdge(this.scene, this.sprite, WATER_ORIGIN_Y, FOAM_STEP));
  }

  catch() {
    super.catch();
    this.sprite.setTexture(this.baseTexture(), this.kind.frames.downRight).setOrigin(0.5, this.kind.originY).setAlpha(1);
    this.ghost.setVisible(false);
    this.foam.clear();
  }

  restore(state) {
    super.restore(state);
    this.unplaced = state === 'wild';
    if (state !== 'wild') this.sprite.setTexture(this.baseTexture(), this.kind.frames.downRight).setOrigin(0.5, this.kind.originY).setAlpha(1);
  }

  destroy() {
    this.ghost.destroy();
    this.foam.destroy();
    super.destroy();
  }
}
