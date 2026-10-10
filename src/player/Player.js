import { blockedAt } from '../world/collision.js';
import { touch } from '../ui/touch.js';

// Bilder im Spritesheet "hero": Blickrichtung je nach Laufrichtung
const FRAME = { downLeft: 1, downRight: 0, upRight: 2, upLeft: 3 };

const SPEED = 80; // Welt-Pixel pro Sekunde
const STEP_RATE = 11; // Schritte pro Sekunde (Hüpf-Tempo)
const HOP = 2.5; // wie hoch er beim Laufen wippt
const FOOT_W = 7; // halbe Breite der Füße für die Kollision
const FOOT_H = 3;
const TRAIL_STEP = 2; // Abstand der Spurpunkte
const TRAIL_MAX = 400;
const STEP_VOLUME = 0.065; // Lautstärke der Schritte
const STEP_INTERVAL = 0.35; // Sekunden zwischen zwei Schritt-Geräuschen
const STEP_DETUNE = 150; // Tonhöhe schwankt um so viele Cent, damit nicht jeder Schritt gleich klingt

export default class Player {
  // texture: Spritesheet der Figur (je Gebiet andere Kleidung)
  constructor(scene, x, y, texture = 'hero') {
    this.x = x;
    this.y = y;
    this.faceX = -1;
    this.faceY = 1;
    this.walkTime = 0;
    this.scene = scene;
    this.stepTimer = 0; // Zeit bis zum nächsten Schritt-Geräusch
    // Spur der letzten Positionen, neueste zuletzt: daran laufen gefangene Tiere entlang
    this.trail = [{ x, y }];

    this.shadow = scene.add.ellipse(x, y, 26, 9, 0x14320a, 0.3);
    this.sprite = scene.add.sprite(x, y, texture, FRAME.downLeft);
    this.sprite.setOrigin(0.5, 112 / 116).setScale(0.5);

    this.keys = scene.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT');
  }

  update(dt) {
    const k = this.keys;
    let vx = 0;
    let vy = 0;
    if (k.A.isDown || k.LEFT.isDown) vx -= 1;
    if (k.D.isDown || k.RIGHT.isDown) vx += 1;
    if (k.W.isDown || k.UP.isDown) vy -= 1;
    if (k.S.isDown || k.DOWN.isDown) vy += 1;
    // ohne Tastendruck: Joystick auf dem Tablet (stufenlos, kleiner Ausschlag = langsamer)
    if (!vx && !vy) {
      vx = touch.x;
      vy = touch.y;
    }

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      // Die Figur hat nur schräge Ansichten: die jeweils andere Achse merken wir uns
      const len = Math.hypot(vx, vy);
      if (Math.abs(vx) > len * 0.25) this.faceX = Math.sign(vx);
      if (Math.abs(vy) > len * 0.25) this.faceY = Math.sign(vy);

      // Tasten: immer volles Tempo (auch schräg); Joystick: Tempo je nach Ausschlag
      const step = (SPEED * dt * Math.min(1, len)) / len;
      // Achsen getrennt prüfen, damit man an Hindernissen entlanggleitet
      const nx = this.x + vx * step;
      if (!blockedAt(nx, this.y, FOOT_W, FOOT_H)) this.x = nx;
      const ny = this.y + vy * step;
      if (!blockedAt(this.x, ny, FOOT_W, FOOT_H)) this.y = ny;

      this.walkTime += dt;
      this.recordTrail();
      // Schritt-Geräusch im eigenen Takt (das erste gleich beim Loslaufen)
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = STEP_INTERVAL;
        this.playStep();
      }
    } else {
      this.walkTime = 0;
      this.stepTimer = 0;
    }

    this.sprite.setFrame(
      this.faceY > 0
        ? this.faceX < 0 ? FRAME.downLeft : FRAME.downRight
        : this.faceX > 0 ? FRAME.upRight : FRAME.upLeft,
    );

    // Laufen andeuten: leichtes Hüpfen und Wippen
    const phase = this.walkTime * STEP_RATE;
    const hop = moving ? Math.abs(Math.sin(phase)) * HOP : 0;
    this.sprite.setPosition(this.x, this.y - hop);
    this.sprite.setAngle(moving ? Math.sin(phase) * 3 : 0);
    this.shadow.setPosition(this.x, this.y);
    this.shadow.setScale(1 - hop * 0.04);

    // Wer weiter unten steht, wird weiter vorne gezeichnet
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 0.5);
  }

  playStep() {
    if (!this.scene.cache.audio.exists('step')) return;
    this.scene.sound.play('step', {
      volume: STEP_VOLUME * (0.8 + Math.random() * 0.4),
      detune: (Math.random() * 2 - 1) * STEP_DETUNE,
    });
  }

  recordTrail() {
    const last = this.trail[this.trail.length - 1];
    if (Math.hypot(this.x - last.x, this.y - last.y) < TRAIL_STEP) return;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > TRAIL_MAX) this.trail.shift();
  }

  // Punkt auf der Spur, der "gap" Pixel Wegstrecke hinter dem Spieler liegt (oder null, falls die Spur zu kurz ist)
  trailPoint(gap) {
    let dist = 0;
    let prev = { x: this.x, y: this.y };
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      dist += Math.hypot(prev.x - p.x, prev.y - p.y);
      if (dist >= gap) return p;
      prev = p;
    }
    return null;
  }
}
