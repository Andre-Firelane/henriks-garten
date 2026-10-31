// Wetter in der Savanne (siehe season.js), von der Szene erzeugt (GardenScene.create) und jedes Bild aufgerufen:
// Starkregen: Regenstriche vor allem, der Himmel etwas dunkler, ab und zu ein Blitz, Pfützen auf den Wegen und
//             Fußspuren im Matsch, die nach einer Weile verblassen.
// Trockenzeit: Staubteufel – kleine Wirbel, die über die Karte wandern und Henrik ein Stück wegschubsen.
// Nebel (Dschungel): ein milchiger Schleier, weiter weg von Henrik wird es immer dichter; über dem Fluss und dem
//             Wasserfallbecken steigen langsam Nebelschwaden auf.
import Phaser from 'phaser';
import { glowTexture } from './Fireflies.js';
import { tileToWorld, worldToTile } from './iso.js';
import { MAP_W, MAP_H, charAt, isBlocked, isBlockedPoint } from './map.js';

const DROPS = 150; // so viele Regenstriche sind gleichzeitig zu sehen
const DARK = 0.2; // so dunkel ist der Himmel bei Starkregen
const DARK_DEPTH = 99930; // unter Nacht und Dunkelheit (siehe GardenScene), über allem anderen
const LIGHTNING_EVERY = [12, 30]; // Sekunden zwischen zwei Blitzen
const PUDDLE_CHANCE = 0.3; // so viele Wegkacheln haben eine Pfütze
const STEP_GAP = 14; // alle so viele Pixel eine Fußspur
const STEP_FADE = 9000; // so lange (ms) bleibt sie zu sehen
const MAX_STEPS = 60;
const DEVILS = 2; // so viele Staubteufel wandern gleichzeitig
const DEVIL_SPEED = 26;
const DEVIL_PUSH = 80; // so stark schubst er (Pixel pro Sekunde) ...
const DEVIL_REACH = 30; // ... wen er so nah erwischt
const FOG_VEIL = 0.22; // milchiger Schleier über allem
const FOG_CLEAR = 1.6; // so groß ist der klare Bereich um Henrik (Maßstab des Verlaufsbilds)
const FOG_PUFFS = 45; // so viele Schwaden steigen gleichzeitig auf
const FOG_NEAR = 700; // nur über Wasser in dieser Entfernung (Welt-Pixel) von Henrik
const FOG_RISE = 9; // so schnell steigen sie (Pixel pro Sekunde)

export default class Weather {
  constructor(scene, season) {
    this.scene = scene;
    this.season = season;
    if (season === 'rain') this.startRain();
    if (season === 'dry') this.startDry();
    if (season === 'fog') this.startFog();
  }

  startFog() {
    const scene = this.scene;
    const cam = scene.cameras.main;
    this.veil = scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width * 4, cam.height * 4, 0xe4ebe6, FOG_VEIL).setScrollFactor(0).setDepth(DARK_DEPTH);
    this.haze = scene.add.image(scene.player.x, scene.player.y, fogTexture(scene)).setScale(FOG_CLEAR).setDepth(DARK_DEPTH + 1);
    this.water = [];
    for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) if (charAt(tx, ty) === '~') this.water.push({ tx, ty });
    this.puffTex = glowTexture(scene);
    this.puffs = Array.from({ length: FOG_PUFFS }, () => this.newPuff(Math.random()));
  }

  // eine Nebelschwade über einer Wasserkachel in Henriks Nähe; age: wie weit sie schon aufgestiegen ist (0..1)
  newPuff(age = 0) {
    const p = this.scene.player;
    let t = null;
    for (let i = 0; i < 12 && this.water.length; i++) {
      const c = Phaser.Utils.Array.GetRandom(this.water);
      const w = tileToWorld(c.tx, c.ty);
      if (Math.hypot(w.x - p.x, (w.y - p.y) * 2) < FOG_NEAR) {
        t = w;
        break;
      }
    }
    t ??= { x: p.x + Phaser.Math.Between(-300, 300), y: p.y + Phaser.Math.Between(-150, 150) };
    const life = Phaser.Math.FloatBetween(7, 12);
    // erst unsichtbar: sonst ist sie ein Bild lang voll deckend zu sehen (weißes Aufblitzen), bis updateFog sie einblendet
    const img = this.scene.add.image(t.x, t.y, this.puffTex).setTint(0xf4f8f4).setDepth(DARK_DEPTH - 1).setAlpha(0);
    return { img, x: t.x + Phaser.Math.Between(-16, 16), y: t.y, life, age: age * life, drift: Phaser.Math.FloatBetween(-5, 5), size: Phaser.Math.FloatBetween(1.6, 2.8) };
  }

  startRain() {
    const scene = this.scene;
    const cam = scene.cameras.main;
    this.dark = scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width * 4, cam.height * 4, 0x1e2a3a, DARK).setScrollFactor(0).setDepth(DARK_DEPTH);
    this.flash = scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width * 4, cam.height * 4, 0xffffff, 0).setScrollFactor(0).setDepth(DARK_DEPTH + 2);
    this.rain = scene.add.graphics().setScrollFactor(0).setDepth(DARK_DEPTH + 1);
    this.drops = Array.from({ length: DROPS }, () => this.newDrop(true));
    this.lightningIn = Phaser.Math.FloatBetween(4, LIGHTNING_EVERY[1]);
    // Pfützen auf einigen Wegkacheln (fest pro Kachel verteilt)
    const tex = puddleTexture(scene);
    for (let ty = 1; ty < MAP_H - 1; ty++) {
      for (let tx = 1; tx < MAP_W - 1; tx++) {
        if (charAt(tx, ty) !== '#' || (((tx * 73856093) ^ (ty * 19349663)) >>> 0) % 100 >= PUDDLE_CHANCE * 100) continue;
        const p = tileToWorld(tx, ty);
        scene.add.image(p.x + Phaser.Math.Between(-8, 8), p.y + Phaser.Math.Between(-3, 3), tex).setScale(Phaser.Math.FloatBetween(0.6, 1)).setDepth(-99990);
      }
    }
    this.steps = [];
    this.lastStep = null;
  }

  // ein Regenstrich irgendwo im sichtbaren Bereich (Bildschirm-Koordinaten, der Zoom ist herausgerechnet)
  newDrop(anywhere) {
    const cam = this.scene.cameras.main;
    const vw = cam.width / cam.zoom;
    const vh = cam.height / cam.zoom;
    return {
      x: cam.width / 2 + Phaser.Math.FloatBetween(-vw / 2, vw / 2 + 60),
      y: cam.height / 2 + (anywhere ? Phaser.Math.FloatBetween(-vh / 2, vh / 2) : -vh / 2 - Phaser.Math.FloatBetween(0, 40)),
      len: Phaser.Math.FloatBetween(7, 13),
      speed: Phaser.Math.FloatBetween(380, 520),
    };
  }

  startDry() {
    const tex = devilTexture(this.scene);
    this.devils = Array.from({ length: DEVILS }, () => {
      const p = this.freePoint();
      const img = this.scene.add.image(p.x, p.y, tex).setOrigin(0.5, 0.95).setAlpha(0.75);
      return { img, x: p.x, y: p.y, target: this.freePoint(), phase: Math.random() * 10 };
    });
  }

  // freier Punkt auf der Karte (nicht am Rand)
  freePoint() {
    for (let i = 0; i < 40; i++) {
      const tx = Phaser.Math.Between(3, MAP_W - 4);
      const ty = Phaser.Math.Between(3, MAP_H - 4);
      if (!isBlocked(tx, ty)) return tileToWorld(tx, ty);
    }
    return tileToWorld(MAP_W / 2, MAP_H / 2);
  }

  update(dt) {
    if (this.season === 'rain') this.updateRain(dt);
    if (this.season === 'dry') this.updateDry(dt);
    if (this.season === 'fog') this.updateFog(dt);
  }

  updateFog(dt) {
    const p = this.scene.player;
    this.haze.setPosition(p.x, p.y - 10);
    for (let i = 0; i < this.puffs.length; i++) {
      const f = this.puffs[i];
      f.age += dt;
      if (f.age >= f.life) {
        f.img.destroy();
        this.puffs[i] = this.newPuff(0);
        continue;
      }
      const t = f.age / f.life;
      f.img
        .setPosition(f.x + f.drift * f.age, f.y - FOG_RISE * f.age)
        .setScale(f.size * (0.6 + t * 0.8), f.size * (0.35 + t * 0.4))
        .setAlpha(Math.sin(Math.PI * t) * 0.55);
    }
  }

  updateRain(dt) {
    const cam = this.scene.cameras.main;
    const vh = cam.height / cam.zoom;
    const g = this.rain;
    g.clear();
    g.lineStyle(1, 0xd4e4ff, 0.55);
    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i];
      d.y += d.speed * dt;
      d.x -= d.speed * 0.22 * dt;
      if (d.y > cam.height / 2 + vh / 2 + 20) this.drops[i] = this.newDrop(false);
      g.lineBetween(d.x, d.y, d.x + d.len * 0.22, d.y - d.len);
    }
    // Blitz: zweimal kurz hell
    this.lightningIn -= dt;
    if (this.lightningIn <= 0) {
      this.lightningIn = Phaser.Math.FloatBetween(...LIGHTNING_EVERY);
      this.scene.tweens.chain({
        targets: this.flash,
        tweens: [
          { alpha: 0.55, duration: 60 },
          { alpha: 0.1, duration: 90 },
          { alpha: 0.4, duration: 50 },
          { alpha: 0, duration: 400 },
        ],
      });
    }
    // Fußspuren im Matsch (nicht auf dem Weg und nicht im Wasser)
    const p = this.scene.player;
    if (!this.lastStep) this.lastStep = { x: p.x, y: p.y, left: false };
    if (Math.hypot(p.x - this.lastStep.x, (p.y - this.lastStep.y) * 2) > STEP_GAP) {
      const { tx, ty } = worldToTile(p.x, p.y);
      const c = charAt(tx, ty);
      const left = !this.lastStep.left;
      this.lastStep = { x: p.x, y: p.y, left };
      if (c !== '#' && c !== '~' && c !== 'G' && c !== 'X') {
        const side = left ? -3 : 3;
        const step = this.scene.add.ellipse(p.x + side, p.y + side * 0.5, 5, 2.5, 0x3a2a18, 0.45).setDepth(-99989);
        this.scene.tweens.add({ targets: step, alpha: 0, delay: STEP_FADE * 0.6, duration: STEP_FADE * 0.4, onComplete: () => step.destroy() });
        this.steps.push(step);
        if (this.steps.length > MAX_STEPS) this.steps.shift().destroy();
      }
    }
  }

  updateDry(dt) {
    const p = this.scene.player;
    for (const d of this.devils) {
      d.phase += dt;
      const dx = d.target.x - d.x;
      const dy = d.target.y - d.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) d.target = this.freePoint();
      else {
        d.x += (dx / dist) * DEVIL_SPEED * dt + Math.sin(d.phase * 2.3) * 12 * dt;
        d.y += (dy / dist) * DEVIL_SPEED * dt + Math.cos(d.phase * 1.7) * 6 * dt;
      }
      // dreht sich: schmaler und breiter, leicht schräg
      d.img.setPosition(d.x, d.y).setScale(0.8 + Math.sin(d.phase * 9) * 0.12, 1).setAngle(Math.sin(d.phase * 3) * 6).setDepth(d.y + 10);
      // wen er erwischt, den schubst er weg
      const ax = p.x - d.x;
      const ay = (p.y - d.y) * 2;
      const near = Math.hypot(ax, ay);
      if (near < DEVIL_REACH && near > 0.1) {
        const nx = p.x + (ax / near) * DEVIL_PUSH * dt;
        const ny = p.y + ((ay / near) * DEVIL_PUSH * dt) / 2;
        if (!isBlockedPoint(nx, ny)) {
          p.x = nx;
          p.y = ny;
        }
      }
    }
  }
}

// flache, hellblaue Pfütze
function puddleTexture(scene) {
  const key = 'rain_puddle';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 40, 20);
  const ctx = tex.getContext();
  ctx.fillStyle = 'rgba(120, 160, 200, 0.55)';
  ctx.beginPath();
  ctx.ellipse(20, 10, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(230, 240, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(16, 8, 8, 3, 0, Math.PI, Math.PI * 1.8);
  ctx.stroke();
  tex.refresh();
  return key;
}

// Staubteufel: ein sandfarbener Wirbel, unten schmal, oben breit
function devilTexture(scene) {
  const key = 'dust_devil';
  if (scene.textures.exists(key)) return key;
  const W = 48;
  const H = 72;
  const tex = scene.textures.createCanvas(key, W, H);
  const ctx = tex.getContext();
  for (let i = 0; i < 9; i++) {
    const y = H - 6 - i * 7.5;
    const r = 4 + i * 2.3;
    ctx.fillStyle = `rgba(206, 176, 124, ${0.32 - i * 0.02})`;
    ctx.beginPath();
    ctx.ellipse(W / 2 + Math.sin(i * 1.3) * 3, y, r, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(150, 118, 72, ${0.35 - i * 0.025})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  tex.refresh();
  return key;
}

// Nebel um Henrik: in der Mitte klar, nach außen immer dichter (wie die Dunkelheit der Wolfsnacht, nur weiß)
function fogTexture(scene) {
  const key = 'fog_haze';
  if (scene.textures.exists(key)) return key;
  const size = 1024;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(232, 238, 234, 0)');
  g.addColorStop(0.35, 'rgba(232, 238, 234, 0.45)');
  g.addColorStop(0.7, 'rgba(232, 238, 234, 0.8)');
  g.addColorStop(1, 'rgba(232, 238, 234, 0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}
