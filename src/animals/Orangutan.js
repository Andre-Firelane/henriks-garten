// Orang-Utan (Asien): sitzt oben in den Urwaldbäumen – man sieht nur Kopf und Arme im Laub, fangen kann man ihn dort
// nicht. Steht man ohne Werkzeug unter seinem Baum, winkt er ab und zu (👋). Wer innerhalb einer Sekunde zurückwinkt
// (Aktionstaste), macht ihm Freude (😊). Wer zu spät oder zu früh winkt, verpasst es: er springt auf einen anderen Baum,
// und das Spiel beginnt von vorn. Nach dreimal Zurückwinken klettert er herunter und setzt sich – dann kann man ihn
// streicheln (berühren). Nach einer Weile klettert er wieder hinauf.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { JUNGLE_TREES } from '../world/map.js';

const SIT_TIME = [2.5, 5]; // so lange sitzt er still (solange man in der Nähe ist), bevor er winkt
const WAVE_WINDOW = 1; // so schnell muss man zurückwinken
export const WAVE_DIST = 120; // so nah muss man am Baum stehen, damit er winkt und das Winken sieht
const WAVES_NEEDED = 3; // so oft muss man zurückwinken, dann kommt er herunter
const DOWN_TIME = 15; // so lange sitzt er unten, dann klettert er wieder hinauf
const JUMP_RANGE = 5; // so viele Kacheln weit springt er höchstens zum nächsten Baum
const CROWN_UP = 104; // Höhe der Baumkrone über dem Fuß des Urwaldbaums (Bild "jungle_tree")
const SWING_MS = 900; // so lange schwingt er von Krone zu Krone
const SWING_ARC = 36; // so hoch ist der Bogen dabei
const CALL_VOLUME = 0.5;

export default class Orangutan extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'orangutan');
    this.phase = 'tree';
    this.phaseTime = Phaser.Math.FloatBetween(...SIT_TIME);
    this.waves = 0;
  }

  // in einen Baum setzen (ohne Angabe: irgendeinen); andere Orang-Utans sitzen nicht im selben
  placeInTree(tree) {
    const taken = this.scene.animals.filter((a) => a !== this && a.species === 'orangutan' && a.tree).map((a) => a.tree);
    const free = JUNGLE_TREES.filter((t) => !taken.some((u) => u.tx === t.tx && u.ty === t.ty));
    tree ??= Phaser.Utils.Array.GetRandom(free.length ? free : JUNGLE_TREES);
    if (!tree) return;
    this.tree = tree;
    Object.assign(this, tileToWorld(tree.tx, tree.ty));
    this.phase = 'tree';
    this.phaseTime = Phaser.Math.FloatBetween(...SIT_TIME);
    this.showInTree();
  }

  showInTree() {
    const key = `${this.baseTexture()}_tree`;
    this.peek ??= this.scene.add.image(0, 0, key).setOrigin(0.5, 40 / 64).setScale(0.6);
    this.peek.setTexture(key).setPosition(this.x, this.y - CROWN_UP).setDepth(this.y + 2).setVisible(true).setFlipX(Math.random() < 0.5);
  }

  inTree() {
    return this.state === 'wild' && (this.phase === 'tree' || this.phase === 'wave');
  }

  // oben zu sehen: im Baum oder auf dem Weg zum nächsten
  aloft() {
    return this.inTree() || (this.state === 'wild' && this.phase === 'swing');
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'down';
  }

  canDespawn() {
    return this.state === 'wild' && this.phase === 'tree';
  }

  shouldFlee() {
    return false;
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    const near = Math.hypot(player.x - this.x, (player.y - this.y) * 2) < WAVE_DIST;
    if (this.phase === 'swing') return false; // schwingt gerade zum nächsten Baum
    if (this.phase === 'tree') {
      // er winkt nur, wenn jemand ohne Werkzeug unten steht
      if (near && !this.scene.tool) this.phaseTime -= dt;
      if (this.phaseTime <= 0) this.startWave();
      return false;
    }
    this.phaseTime -= dt;
    if (this.phase === 'wave') {
      if (this.phaseTime <= 0) this.miss('late');
      return false;
    }
    // unten: sitzt und schaut zum Spieler, dann klettert er wieder hinauf
    this.faceX = Math.sign(player.x - this.x) || this.faceX;
    this.faceY = Math.sign(player.y - this.y) || this.faceY;
    if (this.phaseTime <= 0) {
      this.waves = 0;
      this.placeInTree(this.tree);
      this.scene.orangutanUp?.(this);
    }
    return false;
  }

  startWave() {
    this.phase = 'wave';
    this.phaseTime = WAVE_WINDOW;
    this.bubble(this.x + 14, this.y - CROWN_UP - 26, '👋', WAVE_WINDOW * 1000, 24);
  }

  // der Spieler winkt (Aktionstaste unter dem Baum): gibt zurück, was passiert ist
  playerWaves() {
    if (this.phase === 'wave') {
      this.waves += 1;
      this.bubble(this.x, this.y - CROWN_UP - 30, '😊', 1200);
      if (this.waves >= WAVES_NEEDED) {
        this.comeDown();
        return 'down';
      }
      this.phase = 'tree';
      this.phaseTime = Phaser.Math.FloatBetween(...SIT_TIME);
      return 'happy';
    }
    if (this.phase === 'tree') {
      this.miss('early');
      return 'early';
    }
    return null;
  }

  // verpasst: er schwingt sich auf einen anderen Baum in der Nähe, das Spiel beginnt von vorn
  miss(reason) {
    this.waves = 0;
    if (!this.tree) return this.placeInTree();
    const taken = this.scene.animals.filter((a) => a !== this && a.species === 'orangutan' && a.tree).map((a) => a.tree);
    const others = JUNGLE_TREES.filter(
      (t) => (t.tx !== this.tree.tx || t.ty !== this.tree.ty) && Math.hypot(t.tx - this.tree.tx, t.ty - this.tree.ty) <= JUMP_RANGE && !taken.includes(t),
    );
    const next = Phaser.Utils.Array.GetRandom(others);
    this.scene.orangutanMissed?.(this, reason);
    if (next) this.swingTo(next);
  }

  // in einem Bogen von Krone zu Krone schwingen (mit Rascheln und Ruf)
  swingTo(tree) {
    this.rustle();
    this.call();
    const from = { x: this.x, y: this.y };
    const to = tileToWorld(tree.tx, tree.ty);
    this.tree = tree; // schon reserviert, damit kein anderer dorthin springt
    this.phase = 'swing';
    this.peek?.setFlipX(to.x < from.x);
    const k = { t: 0 };
    this.scene.tweens.add({
      targets: k,
      t: 1,
      duration: SWING_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!this.peek?.active) return;
        const x = from.x + (to.x - from.x) * k.t;
        const y = from.y + (to.y - from.y) * k.t - CROWN_UP - Math.sin(Math.PI * k.t) * SWING_ARC;
        this.peek.setPosition(x, y).setDepth(Math.max(from.y, to.y) + 2).setAngle(Math.sin(Math.PI * 2 * k.t) * 15);
      },
      onComplete: () => {
        if (this.state !== 'wild' || this.phase !== 'swing') return;
        Object.assign(this, to);
        this.peek?.setAngle(0);
        this.phase = 'tree';
        this.phaseTime = Phaser.Math.FloatBetween(...SIT_TIME);
        this.showInTree();
        this.rustle();
      },
    });
  }

  // Ruf beim Schwingen: eigener Laut, falls es einen gibt, sonst der Affenruf tiefer (klingt größer) und ein Wusch
  call() {
    const sound = this.scene.sound;
    const audio = this.scene.cache.audio;
    if (audio.exists('animal_orangutan')) sound.play('animal_orangutan', { volume: CALL_VOLUME });
    else if (audio.exists('animal_macaque')) sound.play('animal_macaque', { volume: CALL_VOLUME, detune: -700 });
    if (audio.exists('whoosh')) sound.play('whoosh', { volume: CALL_VOLUME * 0.6, detune: -300 });
  }

  // herunterklettern und sich vor den Baum setzen (zum Spieler hin)
  comeDown() {
    this.peek?.setVisible(false);
    const p = this.scene.player;
    const a = Math.atan2(p.y - this.y, p.x - this.x);
    const ahead = { x: this.x + Math.cos(a) * 24, y: this.y + Math.sin(a) * 12 };
    const spot = !this.blocked(ahead.x, ahead.y) ? ahead : this.scene.freeSpotNear(ahead.x, ahead.y, 24) ?? ahead;
    this.x = spot.x;
    this.y = spot.y;
    this.phase = 'down';
    this.phaseTime = DOWN_TIME;
    this.scene.orangutanDown?.(this);
  }

  // ein paar Blätter rieseln aus der Krone
  rustle() {
    if (!this.tree) return;
    for (let i = 0; i < 6; i++) {
      const leaf = this.scene.add
        .ellipse(this.x + Phaser.Math.Between(-20, 20), this.y - CROWN_UP + Phaser.Math.Between(-10, 10), 5, 3, 0x3f8a3c)
        .setDepth(this.y + 3);
      this.scene.tweens.add({
        targets: leaf,
        y: leaf.y + Phaser.Math.Between(30, 60),
        x: leaf.x + Phaser.Math.Between(-12, 12),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1100),
        onComplete: () => leaf.destroy(),
      });
    }
  }

  // kleines Zeichen über dem Kopf (👋 oder 😊), das nach ms verschwindet
  bubble(x, y, text, ms, size = 16) {
    const t = this.scene.add.text(x, y, text, { fontSize: `${size}px`, resolution: 4 }).setOrigin(0.5).setDepth(100000);
    this.scene.tweens.add({ targets: t, y: y - 8, duration: ms, onComplete: () => t.destroy() });
  }

  render(moving) {
    super.render(moving);
    const up = this.aloft();
    this.sprite.setVisible(!up);
    this.shadow.setVisible(!up);
    this.peek?.setVisible(up);
    const key = `${this.baseTexture()}_tree`; // seltene Variante: wird erst nach dem Erzeugen ausgewürfelt
    if (this.peek && this.peek.texture.key !== key) this.peek.setTexture(key);
  }

  catch() {
    this.peek?.setVisible(false);
    this.tree = null;
    this.phase = null;
    super.catch();
  }

  restore(state) {
    super.restore(state);
    if (state === 'wild') {
      // zurück in den nächsten Baum (beim Betreten des Levels)
      const tree = [...JUNGLE_TREES].sort((p, q) => {
        const a = tileToWorld(p.tx, p.ty), b = tileToWorld(q.tx, q.ty);
        return Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y);
      })[0];
      this.placeInTree(tree);
    } else {
      this.phase = null;
      this.tree = null;
      this.peek?.setVisible(false);
    }
  }

  destroy() {
    this.peek?.destroy();
    super.destroy();
  }
}
