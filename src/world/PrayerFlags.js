// Gebetsfahnen auf der Hochebene im Bambuswald (Angaben in levels.js: prayerFlags): Leinen zwischen den Stangen (Ƨ), auch
// über mehrere Stangen und über Eck. Dicht an dicht hängen kleine Fähnchen in den fünf Farben (blau, weiß, rot, grün,
// gelb) und flattern leicht im Wind. Nur Deko.
// Jede Leine wird in kurze Stücke geteilt, jedes mit eigener Tiefe (nach der Lage am Boden darunter): so steht Henrik
// davor oder dahinter, je nachdem, auf welcher Seite der Leine er läuft.
import { tileToWorld } from './iso.js';
import { LEVEL } from './map.js';

const POLE_TOP = 52; // so hoch über dem Fuß der Stange hängt die Leine
const SAG = 0.12; // so weit hängt die Leine in der Mitte durch (Anteil der Länge)
const FLAG_GAP = 5; // Abstand der Fähnchen (Pixel)
const FLAG_W = 4;
const FLAG_H = 6;
const PIECE = 24; // Länge eines Stücks (Pixel) mit eigener Tiefe
const COLORS = [0x3a6fd0, 0xf4f4ee, 0xd83a2e, 0x3aa04a, 0xf0c83a];
const SHADE = [0x2c55a0, 0xc8c8be, 0xa82a20, 0x2a7a38, 0xc09a28]; // untere Kante der Fähnchen
const ROPE = 0x5a4a3a;
const FLUTTER_MS = 160;

export default class PrayerFlags {
  constructor(scene) {
    this.scene = scene;
    this.pieces = [];
    // Stangen als [tx, ty] oder { tx, ty } (im Tierpark: so verschiebt sie parkSection in die Kacheln des Abschnitts)
    const at = (p) => (Array.isArray(p) ? tileToWorld(...p) : tileToWorld(p.tx, p.ty));
    for (const chain of LEVEL.prayerFlags ?? []) {
      for (let i = 0; i + 1 < chain.length; i++) this.addLine(at(chain[i]), at(chain[i + 1]));
    }
    if (!this.pieces.length) return;
    this.t = 0;
    this.draw();
    scene.time.addEvent({ delay: FLUTTER_MS, loop: true, callback: () => { this.t += FLUTTER_MS / 1000; this.draw(); } });
  }

  // Leine von Stange a nach Stange b (Fußpunkte): Punkte entlang der durchhängenden Kurve, in Stücke geteilt
  addLine(a, b) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const at = (t) => ({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t - POLE_TOP + Math.sin(Math.PI * t) * len * SAG,
      ground: a.y + (b.y - a.y) * t, // Boden darunter (für die Tiefe)
    });
    const n = Math.max(1, Math.round(len / PIECE));
    const flags = Math.floor(len / FLAG_GAP);
    for (let k = 0; k < n; k++) {
      const t0 = k / n;
      const t1 = (k + 1) / n;
      const g = this.scene.add.graphics();
      g.setDepth(at((t0 + t1) / 2).ground + 2);
      const marks = [];
      for (let f = 1; f < flags; f++) {
        const t = f / flags;
        if (t >= t0 && t < t1) marks.push({ t, color: (this.flagCount ?? 0) + f });
      }
      this.pieces.push({ g, at, t0, t1, marks });
    }
    this.flagCount = (this.flagCount ?? 0) + flags;
  }

  draw() {
    for (const { g, at, t0, t1, marks } of this.pieces) {
      g.clear();
      g.lineStyle(1, ROPE, 1);
      g.beginPath();
      const steps = 4;
      for (let s = 0; s <= steps; s++) {
        const p = at(t0 + ((t1 - t0) * s) / steps);
        if (s === 0) g.moveTo(p.x, p.y);
        else g.lineTo(p.x, p.y);
      }
      g.strokePath();
      for (const { t, color } of marks) {
        const p = at(t);
        const c = color % COLORS.length;
        // Flattern: die untere Kante schwingt ein wenig zur Seite
        const sway = Math.round(Math.sin(this.t * 3 + color * 1.7));
        const x = Math.round(p.x - FLAG_W / 2);
        const y = Math.round(p.y);
        g.fillStyle(COLORS[c], 1);
        g.fillRect(x, y, FLAG_W, FLAG_H - 2);
        g.fillRect(x + sway, y + FLAG_H - 2, FLAG_W, 2);
        g.fillStyle(SHADE[c], 1);
        g.fillRect(x + sway, y + FLAG_H - 1, FLAG_W, 1);
      }
    }
  }
}
