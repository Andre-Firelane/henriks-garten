// Sonne am Wasserfall (Dschungel, nur bei normalem Wetter): ab und zu reißt die Wolkendecke auf, warmes Licht fällt auf
// den Wasserfall und die Steine davor, im Sprühnebel steht ein kleiner Regenbogen. Kurz danach kommen die Leguane aus
// ihren Verstecken und sonnen sich (siehe Iguana.js). Ist man nah dran, kommt eine Meldung; ist man weiter weg in der
// nördlichen Hälfte unterwegs, schimmert der Regenbogen am Bildschirmrand in Richtung Wasserfall.
import Phaser from 'phaser';
import { tr } from '../i18n.js';
import { MAP_H } from './map.js';
import { worldToTile } from './iso.js';

const EVERY = [60, 120]; // Sekunden zwischen zwei Sonnenmomenten
const FIRST = [20, 40]; // der erste kommt etwas früher
const SHINE = [15, 25]; // so lange scheint die Sonne
const FADE_IN = 1.5; // Sekunden, bis das Licht ganz da ist ...
const FADE_OUT = 2.5; // ... und bis es wieder weg ist
const NEAR = 420; // so nah (Welt-Pixel, Kachel-Proportionen) am Wasserfall: Meldung beim Sonnenmoment
const LIGHT_AT = { x: -40, y: 20 }; // Mitte des Scheins vom Fuß des Wasserfalls aus (zwischen Wasserfall und Sonnensteinen)
const LIGHT_ALPHA = 0.32; // warmer Schein über Wasserfall und Steinen
const BEAM_ALPHA = 0.18; // Sonnenstrahlen
const RAINBOW_ALPHA = 0.55;
const RAINBOW_W = 110; // Breite des Regenbogens (Welt-Pixel)
const RAINBOW_UP = 34; // so hoch über dem Fuß des Wasserfalls steht er im Sprühnebel
const EDGE_SIZE = 260; // Schimmer am Bildschirmrand (CSS-Pixel)
const EDGE_ALPHA = 0.75;

export default class WaterfallSun {
  // fall: { x, y, img } der Wasserfall (Fuß)
  constructor(scene, fall) {
    this.scene = scene;
    this.fall = fall;
    this.shining = false; // scheint gerade die Sonne?
    this.time = 0; // Sekunden seit Beginn des Sonnenmoments
    this.wait = Phaser.Math.FloatBetween(...FIRST);
    this.level = 0; // 0..1: wie hell es gerade ist (Ein- und Ausblenden)
    const depth = fall.y + 100; // vor dem Wasserfall und den Sonnensteinen am Becken (die Sonne scheint auch auf sie)
    this.light = scene.add.image(fall.x + LIGHT_AT.x, fall.y + LIGHT_AT.y, glow(scene)).setTint(0xffe2a0).setScale(6, 4.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth).setAlpha(0);
    this.beams = [-50, -10, 30].map((dx, i) =>
      scene.add.image(fall.x + dx, fall.y - 170, beam(scene)).setOrigin(0.5, 0).setAngle(-28).setScale(0.7 + i * 0.15, 1.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth).setAlpha(0),
    );
    this.rainbow = scene.add.image(fall.x, fall.y - RAINBOW_UP, rainbow(scene)).setOrigin(0.5, 1).setDisplaySize(RAINBOW_W, RAINBOW_W / 2).setDepth(fall.y + 31).setAlpha(0);
    // Schimmer am Bildschirmrand: ein Regenbogen-Ring, halb außerhalb des Bildschirms (über dem Spiel, unter den Anzeigen)
    this.edge = document.createElement('div');
    Object.assign(this.edge.style, {
      position: 'fixed', width: `${EDGE_SIZE}px`, height: `${EDGE_SIZE}px`, marginLeft: `${-EDGE_SIZE / 2}px`, marginTop: `${-EDGE_SIZE / 2}px`,
      borderRadius: '50%', pointerEvents: 'none', opacity: '0', zIndex: '4', filter: 'blur(6px)',
      background: 'radial-gradient(circle, rgba(255,255,255,0) 44%, rgba(255,90,90,0.55) 50%, rgba(255,200,70,0.55) 55%, rgba(120,220,110,0.55) 60%, rgba(90,160,255,0.55) 65%, rgba(170,110,255,0.5) 70%, rgba(170,110,255,0) 76%)',
    });
    document.body.appendChild(this.edge);
    scene.events.once('shutdown', () => this.edge.remove());
  }

  update(dt) {
    if (this.shining) {
      this.time += dt;
      if (this.time >= this.duration) this.shining = false;
    } else {
      this.wait -= dt;
      if (this.wait <= 0) this.start();
    }
    const target = this.shining ? 1 : 0;
    this.level = Phaser.Math.Clamp(this.level + (target > this.level ? dt / FADE_IN : -dt / FADE_OUT), 0, 1);
    const k = this.level * this.level * (3 - 2 * this.level);
    const t = this.scene.time.now / 1000;
    this.light.setAlpha(LIGHT_ALPHA * k * (0.92 + Math.sin(t * 1.3) * 0.08));
    this.beams.forEach((b, i) => b.setAlpha(BEAM_ALPHA * k * (0.75 + Math.sin(t * 0.9 + i * 2) * 0.25)));
    this.rainbow.setAlpha(RAINBOW_ALPHA * k * (0.85 + Math.sin(t * 2.1) * 0.15));
    this.updateEdge(k, t);
  }

  start() {
    this.shining = true;
    this.time = 0;
    this.duration = Phaser.Math.FloatBetween(...SHINE);
    this.wait = Phaser.Math.FloatBetween(...EVERY);
    const p = this.scene.player;
    if (Math.hypot(p.x - this.fall.x, (p.y - this.fall.y) * 2) < NEAR) {
      this.scene.showToast(tr('☀️ Die Sonne scheint auf den Wasserfall …', '☀️ The sun is shining on the waterfall …'));
    }
  }

  // weiter weg in der nördlichen Hälfte: Regenbogen-Schimmer am Bildschirmrand, dort wo der Wasserfall liegt
  updateEdge(k, t) {
    const cam = this.scene.cameras.main;
    const view = cam.worldView;
    const p = this.scene.player;
    const north = worldToTile(p.x, p.y).ty < MAP_H / 2;
    const target = { x: this.fall.x, y: this.fall.y - 60 };
    if (!k || !north || view.contains(target.x, target.y)) {
      this.edge.style.opacity = '0';
      return;
    }
    // Richtung von der Bildmitte zum Wasserfall, auf den Bildschirmrand gebracht
    const rect = this.scene.game.canvas.getBoundingClientRect();
    const dx = target.x - view.centerX;
    const dy = target.y - view.centerY;
    const s = Math.min(Math.abs(view.width / 2 / (dx || 1e-6)), Math.abs(view.height / 2 / (dy || 1e-6)));
    const x = rect.left + rect.width / 2 + (dx * s * rect.width) / view.width;
    const y = rect.top + rect.height / 2 + (dy * s * rect.height) / view.height;
    this.edge.style.left = `${x}px`;
    this.edge.style.top = `${y}px`;
    this.edge.style.opacity = String(EDGE_ALPHA * k * (0.7 + Math.sin(t * 2.4) * 0.3));
  }
}

// weicher, runder Schein (einmal erzeugt)
function glow(scene) {
  const key = 'sun_glow';
  if (scene.textures.exists(key)) return key;
  const c = scene.textures.createCanvas(key, 64, 64);
  const ctx = c.getContext();
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  c.refresh();
  return key;
}

// Sonnenstrahl: oben hell, nach unten und zu den Seiten auslaufend
function beam(scene) {
  const key = 'sun_beam';
  if (scene.textures.exists(key)) return key;
  const c = scene.textures.createCanvas(key, 40, 200);
  const ctx = c.getContext();
  const v = ctx.createLinearGradient(0, 0, 0, 200);
  v.addColorStop(0, 'rgba(255,240,190,0.9)');
  v.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 40, 200);
  ctx.globalCompositeOperation = 'destination-in';
  const h = ctx.createLinearGradient(0, 0, 40, 0);
  h.addColorStop(0, 'rgba(0,0,0,0)');
  h.addColorStop(0.5, 'rgba(0,0,0,1)');
  h.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = h;
  ctx.fillRect(0, 0, 40, 200);
  c.refresh();
  return key;
}

// kleiner Regenbogen: Halbkreis aus Farbbändern, an den Enden ausgeblendet
function rainbow(scene) {
  const key = 'waterfall_rainbow';
  if (scene.textures.exists(key)) return key;
  const W = 220;
  const H = 110;
  const c = scene.textures.createCanvas(key, W, H);
  const ctx = c.getContext();
  const colors = ['#ff4b4b', '#ff9a3c', '#ffe14a', '#5fd36a', '#4aa8ff', '#6a5cff', '#b06bff'];
  const band = 4;
  colors.forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(W / 2, H, H - 6 - i * band, Math.PI, 0);
    ctx.strokeStyle = col;
    ctx.lineWidth = band + 0.5;
    ctx.stroke();
  });
  // zu den Enden hin (unten) im Sprühnebel verschwinden
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createLinearGradient(0, 0, 0, H);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.55, 'rgba(0,0,0,0.8)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);
  c.refresh();
  return key;
}
