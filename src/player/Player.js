import { blockedAt } from '../world/collision.js';
import { touch } from '../ui/touch.js';
import { SPRITE_SINK } from '../animals/Animal.js';
import { bridgeLift, buildingAt, charAt } from '../world/map.js';
import { worldToTile } from '../world/iso.js';

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
const ANIMATED_HERO = false; // Lauf- und Stehanimation der Figur (Test, vorerst aus; true = an)
// Reittier (Event): 30 % schneller, ruhigeres Wippen, Fußpunkt im Bild; die Kollision bleibt so klein wie zu Fuß
const RIDE_SPEED = 1.3;
const RIDE_ORIGIN_Y = 224 / 230;
const RIDE_HOP = 1.5;
const RIDE_STEP_RATE = 10;
const RIDE_STEP_INTERVAL = Math.PI / RIDE_STEP_RATE; // ein Hufschritt pro Wippen
const RIDE_STEP_DETUNE = -350; // Hufe klingen tiefer als Schritte
const WADE_SINK = 14; // so tief steht der Wasserbüffel im Wasser (bis zum halben Bauch); darunter wird er abgeschnitten
const WADE_EASE = 6; // so schnell sinkt er ein bzw. taucht wieder auf
const WADE_SPEED = 0.6; // im Wasser watet er langsamer
// so viel höher als zu Fuß hält Henrik auf dem Reittier seine Hände (dort sitzen die Werkzeuge)
const HAND_LIFT = { ride_meadow: 19, ride_forest: 23, ride_savanna: 46, ride_asia: 31 };
const RIDE_SHADOW_UP = 5; // Schatten unter der Mitte der Hufe statt unter dem vordersten Huf
// Schwimmen (Unterwasserwelt): Henrik schwebt über dem Meeresboden, wippt langsam auf und ab und neigt sich in Schwimmrichtung
const SWIM_LIFT = 16; // so hoch über dem Boden
const SWIM_BOB = 2.5; // so weit wippt er auf und ab
const SWIM_BOB_RATE = 1.8; // ... so schnell
const SWIM_TILT = 8; // so weit neigt er sich beim Schwimmen (Grad)
const SWIM_SPEED = 0.75; // unter Wasser langsamer als zu Fuß

export default class Player {
  // texture: Spritesheet der Figur (je Gebiet andere Kleidung); swim: schwimmt statt zu laufen (Unterwasserwelt)
  constructor(scene, x, y, texture = 'hero', { swim = false } = {}) {
    this.x = x;
    this.y = y;
    this.faceX = -1;
    this.faceY = 1;
    this.walkTime = 0;
    this.scene = scene;
    this.texture = texture;
    this.swim = swim;
    // Lauf- und Stehanimation (Test): gibt es bisher nur in der Wiesen-Kleidung
    this.canWalkAnim = ANIMATED_HERO && texture === 'hero' && ['hero_walk', 'hero_walk_back', 'hero_idle'].every((key) => scene.anims.exists(key));
    this.stepTimer = 0; // Zeit bis zum nächsten Schritt-Geräusch
    // Spur der letzten Positionen, neueste zuletzt: daran laufen gefangene Tiere entlang
    this.trail = [{ x, y }];

    this.shadow = scene.add.ellipse(x, y, 26, 9, 0x14320a, 0.3);
    this.sprite = scene.add.sprite(x, y, texture, FRAME.downLeft);
    this.sprite.setOrigin(0.5, 112 / 116).setScale(0.5);
    this.mount = null; // Reittier-Bild (z. B. ride_meadow) oder null
    this.speed = swim ? SPEED * SWIM_SPEED : SPEED;
    this.handLift = 0; // Werkzeuge: so viel höher als zu Fuß
    this.sink = 0; // so tief steht der Wasserbüffel gerade im Wasser
    // heller Ring auf dem Wasser um den watenden Büffel: die hintere Hälfte hinter ihm, die vordere davor
    this.ripples = [Math.PI, 0].map((from) => {
      const g = scene.add.graphics().lineStyle(1.5, 0xe8f6ff, 0.6).setVisible(false);
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const a = from + (Math.PI * i) / 16;
        pts.push({ x: Math.cos(a) * 24, y: Math.sin(a) * 6 });
      }
      return g.strokePoints(pts);
    });

    this.keys = scene.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT');
  }

  // auf ein Reittier steigen (Bild des Reittiers mit Henrik darauf) bzw. absteigen (null)
  setMount(key) {
    if (key === this.mount) return;
    this.mount = key;
    this.speed = key ? SPEED * RIDE_SPEED : SPEED;
    this.wade = key === 'ride_asia'; // der Wasserbüffel darf ins Wasser
    this.trample = key === 'ride_savanna'; // der Elefant läuft über kleine Büsche
    this.sprite.setTexture(key ?? this.texture, this.sprite.frame.name).setOrigin(0.5, key ? RIDE_ORIGIN_Y : 112 / 116);
    this.shadow.setSize(key ? 46 : 26, key ? 11 : 9);
    this.handLift = HAND_LIFT[key] ?? 0;
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
    const len = Math.hypot(vx, vy);
    if (moving) {
      // Die Figur hat nur schräge Ansichten: die jeweils andere Achse merken wir uns
      // genaue Laufrichtung (auch gerade oder dazwischen) für Würfe wie das Lasso
      this.aimX = vx / len;
      this.aimY = vy / len;
      if (Math.abs(vx) > len * 0.25) this.faceX = Math.sign(vx);
      if (Math.abs(vy) > len * 0.25) this.faceY = Math.sign(vy);

      // Tasten: immer volles Tempo (auch schräg); Joystick: Tempo je nach Ausschlag
      const { tx: wx, ty: wy } = worldToTile(this.x, this.y);
      const wading = this.wade && charAt(wx, wy) === '~';
      const step = (this.speed * (wading ? WADE_SPEED : 1) * dt * Math.min(1, len)) / len;
      // Achsen getrennt prüfen, damit man an Hindernissen entlanggleitet
      const nx = this.x + vx * step;
      if (!blockedAt(nx, this.y, FOOT_W, FOOT_H, this.wade, this.trample)) this.x = nx;
      const ny = this.y + vy * step;
      if (!blockedAt(this.x, ny, FOOT_W, FOOT_H, this.wade, this.trample)) this.y = ny;

      this.walkTime += dt;
      this.recordTrail();
      // Schritt-Geräusch im eigenen Takt (das erste gleich beim Loslaufen)
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.mount ? RIDE_STEP_INTERVAL : STEP_INTERVAL;
        this.playStep();
      }
    } else {
      this.walkTime = 0;
      this.stepTimer = 0;
    }

    // Echte Animationen von vorne bzw. hinten (nach links gespiegelt), sonst Standbild mit Hüpfen
    const animated = this.canWalkAnim && !this.mount;
    if (animated) {
      this.sprite.setFlipX(this.faceX < 0);
      if (moving) {
        this.sprite.play(this.faceY > 0 ? 'hero_walk' : 'hero_walk_back', true);
        this.sprite.anims.timeScale = Math.min(1, len); // Joystick wenig ausgelenkt: kleinere Schritte
      } else if (this.faceY > 0) {
        this.sprite.play('hero_idle', true);
        this.sprite.anims.timeScale = 1;
      } else {
        // Stehen von hinten gibt es noch nicht: erstes Bild der Rückansicht
        this.sprite.stop();
        this.sprite.setTexture('hero_walk_back', 0);
      }
    } else {
      this.sprite.stop();
      this.sprite.setFlipX(false);
      this.sprite.setTexture(
        this.mount ?? this.texture,
        this.faceY > 0
          ? this.faceX < 0 ? FRAME.downLeft : FRAME.downRight
          : this.faceX > 0 ? FRAME.upRight : FRAME.upLeft,
      );
    }

    // Laufen andeuten: leichtes Hüpfen und Wippen (die Laufanimation bewegt sich selbst)
    const phase = this.walkTime * (this.mount ? RIDE_STEP_RATE : STEP_RATE);
    const hop = moving && !animated && !this.swim ? Math.abs(Math.sin(phase)) * (this.mount ? RIDE_HOP : HOP) : 0;
    const float = this.swim ? SWIM_LIFT + Math.sin((this.scene.time.now / 1000) * SWIM_BOB_RATE) * SWIM_BOB : 0;
    const lift = bridgeLift(this.x, this.y); // auf einer Bogenbrücke etwas höher
    const { tx, ty } = worldToTile(this.x, this.y);
    const target = this.wade && charAt(tx, ty) === '~' ? WADE_SINK : 0; // im Wasser steht der Büffel tiefer
    this.sink += (target - this.sink) * Math.min(1, dt * WADE_EASE);
    if (this.sink < 0.3) this.sink = 0;
    const sink = this.sink;
    this.sprite.setPosition(this.x, this.y - hop - float - lift + SPRITE_SINK + sink);
    // was unter der Wasserlinie liegt, abschneiden (im Bild gerechnet, Maßstab 0,5)
    if (sink) {
      const f = this.sprite.frame;
      const visible = f.height * this.sprite.originY - (sink - hop) / this.sprite.scaleY;
      this.sprite.setCrop(0, 0, f.width, Math.max(0, visible));
    } else if (this.sprite.isCropped) this.sprite.setCrop();
    this.ripples.forEach((g, i) =>
      g
        .setVisible(sink > 2)
        .setPosition(this.x, this.y + SPRITE_SINK - 1)
        .setScale(1 + Math.sin(this.scene.time.now / 300) * 0.06, 1)
        .setAlpha(Math.min(1, sink / WADE_SINK))
        .setDepth(this.y + (i ? 0.1 : -0.2)), // hinten hinter, vorne vor dem Büffel
    );
    if (this.swim) this.sprite.setAngle(moving ? this.faceX * SWIM_TILT * Math.min(1, len) : 0);
    else this.sprite.setAngle(moving && !animated ? Math.sin(phase) * (this.mount ? 1.5 : 3) : 0);
    this.shadow.setPosition(this.x, this.y - lift - (this.mount ? RIDE_SHADOW_UP : 0)).setVisible(!sink); // im Wasser kein Schatten
    this.shadow.setScale(this.swim ? 0.8 - (float - SWIM_LIFT) * 0.03 : 1 - hop * 0.04); // schwimmend: kleinerer Schatten, der mitwippt

    // Wer weiter unten steht, wird weiter vorne gezeichnet
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 0.5);
  }

  playStep() {
    if (this.swim) return; // unter Wasser keine Schritte
    // drinnen (Haupthaus, Hütten, Aquarium) klingen die Schritte wie auf einem Flur, draußen wie auf Gras
    const { tx, ty } = worldToTile(this.x, this.y);
    const key = !this.mount && buildingAt(tx, ty) && this.scene.cache.audio.exists('step_indoor') ? 'step_indoor' : 'step';
    if (!this.scene.cache.audio.exists(key)) return;
    this.scene.sound.play(key, {
      volume: STEP_VOLUME * (0.8 + Math.random() * 0.4),
      detune: (this.mount ? RIDE_STEP_DETUNE : 0) + (Math.random() * 2 - 1) * STEP_DETUNE,
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
