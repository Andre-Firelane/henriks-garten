// Pfeilgiftfrosch (Dschungel, nur bei der Leuchtnacht, docs/plan-leuchtnacht.md): krabbelt in kleinen Sprüngen in der Nähe
// seines Platzes am Wasser herum und flieht nicht. Er leuchtet ein bisschen in seiner Farbe: ein weicher Lichthof, in der
// Nacht über der Dunkelheit (so findet man ihn), bei Tag (Tropenhalle im Tierpark) nur ein leichter Schimmer unter ihm.
// Giftig: fangen nur mit dem Froschglas (catchWith 'frogjar'); Farben über coats.js (Grundbild blau).
//
// Bewegung wie beim grünen Frosch (Frog.js): In den Videos bleibt der Frosch auf der Stelle, er streckt die Hinterbeine
// (Absprung) und zieht sie wieder an. Darum läuft er nicht gleichmäßig, sondern macht Schritte: ein Schritt ist ein
// Durchlauf der Lauf-Animation, vorwärts geht es nur in den Bildern, in denen er sich abstößt (push); beim Anziehen und
// Sitzen steht er. So rutscht er nicht über den Boden. Beim Folgen läuft er wie die anderen Tiere (er muss mithalten).
import Phaser from 'phaser';
import Animal from './Animal.js';
import { NIGHT_DEPTH } from './Wolf.js';
import { glowTexture } from '../world/Fireflies.js';

const LEASH = 46; // so weit krabbelt er wild von seinem Platz weg (Welt-Pixel, Höhe doppelt gezählt)
const NIGHT_GLOW = 0.75; // Helligkeit des Lichthofs in der Nacht ...
const DAY_GLOW = 0.22; // ... und bei Tag
// Farbe des Lichthofs je Aussehen (Lichtfarbe der Farbskala in coats.js)
const GLOW_COLORS = { dartfrog: 0x4c9cff, dartfrog_yellow: 0xffe24a, dartfrog_green: 0x78ec78, dartfrog_orange: 0xff9a30, dartfrog_red: 0xff5a44 };
// Schritt: Bilder der Lauf-Animation je Blickrichtung, davon die zum Abstoßen (von, bis; gemessen an der Breite der
// Figur in dartfrog_walk.png bzw. _back.png: dort strecken sich die Hinterbeine)
const STEP = { down: { n: 32, push: [9, 20] }, up: { n: 39, push: [10, 18] } };
const STEP_FPS = 36; // so schnell läuft ein Schritt ab (wie die Animation, siehe VIDEO_RATE in BootScene.js)
const STEP_LEN = 15; // so weit kommt er mit einem Schritt (Welt-Pixel)
const STEPS = [1, 3]; // so viele Schritte hintereinander, dann sitzt er wieder (restTime in Animal.js)

export default class DartFrog extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'dartfrog');
    this.leash = { x, y, r: LEASH };
    this.glow = scene.add.image(x, y, glowTexture(scene)).setBlendMode(Phaser.BlendModes.ADD).setScale(0.75, 0.5).setAlpha(0);
    this.glowPhase = Math.random() * 10;
    this.glowTime = 0;
    this.step = null; // laufender Schritt: { t, view, dx, dy, done }
    this.stepsLeft = 0;
  }

  // wild und im Gehege: Schritte statt gleichmäßigem Laufen
  updateFree(dt, player) {
    if (this.step) return this.updateStep(dt);
    if (this.stepsLeft > 0) return this.startStep();
    this.wanderTime -= dt;
    if (this.wanderTime > 0) return false;
    this.pickWander();
    if (!this.dirX && !this.dirY) return false; // Pause
    this.stepsLeft = Phaser.Math.Between(...STEPS);
    return this.startStep();
  }

  // nächster Schritt in Richtung dirX/dirY; ist dort etwas im Weg, eine andere Richtung (sonst sitzen bleiben)
  startStep() {
    this.stepsLeft--;
    for (const turn of [0, 0.7, -0.7, 1.6, -1.6]) {
      const a = Math.atan2(this.dirY, this.dirX) + turn;
      const dx = Math.cos(a) * STEP_LEN;
      const dy = Math.sin(a) * STEP_LEN * 0.5; // Kacheln sind halb so hoch wie breit
      if (this.blocked(this.x + dx, this.y + dy)) continue;
      this.dirX = Math.cos(a);
      this.dirY = Math.sin(a);
      if (Math.abs(dx) > 0.5) this.faceX = Math.sign(dx);
      if (Math.abs(dy) > 0.3) this.faceY = Math.sign(dy);
      this.step = { t: 0, view: this.faceY > 0 ? 'down' : 'up', dx, dy, done: 0 };
      return false;
    }
    this.stepsLeft = 0;
    this.wanderTime = Phaser.Math.FloatBetween(...this.kind.restTime);
    return false;
  }

  // Schritt fortsetzen: nur in den Abstoß-Bildern vorwärts (sanft beschleunigt und abgebremst)
  updateStep(dt) {
    const s = this.step;
    s.t += dt;
    const { n, push } = STEP[s.view];
    const f = s.t * STEP_FPS;
    const k = Phaser.Math.Easing.Sine.InOut(Phaser.Math.Clamp((f - push[0]) / (push[1] + 1 - push[0]), 0, 1));
    const want = k - s.done;
    if (want > 0) {
      const ox = this.x;
      const oy = this.y;
      const fx = this.faceX;
      const fy = this.faceY;
      this.move(s.dx * want, s.dy * want);
      this.faceX = fx; // Blickrichtung bleibt die des Schritts
      this.faceY = fy;
      if (this.x === ox && this.y === oy) s.done = 1; // gegen etwas gestoßen: nur noch zu Ende anziehen
      else s.done = k;
    }
    if (f >= n) {
      this.step = null;
      if (this.stepsLeft <= 0) this.wanderTime = Phaser.Math.FloatBetween(...this.kind.restTime);
    }
    return false; // das Bild setzt render selbst (stepFrame)
  }

  // Bild des laufenden Schritts: [Bogen, Bild], oder null (dann wie die anderen Tiere: Stehen bzw. Laufen beim Folgen)
  stepFrame() {
    const s = this.step;
    if (!s || this.state === 'following') return null;
    const anims = this.animSet();
    const key = s.view === 'down' ? anims?.walkDown : anims?.walkUp; // (Fellfarbe: deren Bogen, gleicher Name wie die Animation)
    if (!key || !this.scene.textures.exists(key)) return null;
    return [key, Math.min(STEP[s.view].n - 1, Math.floor(s.t * STEP_FPS))];
  }

  render(moving) {
    const frame = this.stepFrame();
    if (!frame) return super.render(moving);
    const [key, i] = frame;
    this.sprite.stop();
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
    this.sprite.setFrame(i).setFlipX(this.faceX < 0);
    this.sprite.setOrigin(0.5, 56 / 60); // Fußlinie der Lauf-Bögen (wie in Animal.render)
    this.placeSprite(false);
  }

  // gefangen, ins Gehege: ein angefangener Schritt zählt nicht mehr
  catch() {
    this.step = null;
    this.stepsLeft = 0;
    super.catch();
  }

  enterPen() {
    this.step = null;
    this.stepsLeft = 0;
    super.enterPen();
  }

  update(dt, player) {
    super.update(dt, player);
    this.glowTime += dt;
    const night = this.scene.glowNight;
    const dark = night && this.state !== 'penned' ? night.level : 0;
    const pulse = 0.8 + Math.sin(this.glowTime * 1.6 + this.glowPhase) * 0.2;
    const shown = this.sprite.visible;
    this.glow
      .setVisible(shown)
      .setTint(GLOW_COLORS[this.skin ?? 'dartfrog'] ?? GLOW_COLORS.dartfrog)
      .setPosition(this.sprite.x, this.sprite.y - 7)
      .setAlpha((DAY_GLOW + (NIGHT_GLOW - DAY_GLOW) * dark) * pulse * (this.baby ? 0.6 : 1))
      // in der Nacht über der Dunkelheit, bei Tag direkt unter dem Frosch
      .setDepth(dark > 0 ? NIGHT_DEPTH + 2 : this.sprite.depth - 0.2);
    // in der Nacht leuchtet er selbst ein bisschen: über der Dunkelheit gezeichnet, nur etwas abgedunkelt
    if (dark > 0.3) {
      const v = Math.round(255 * (1 - 0.3 * dark));
      this.sprite.setDepth(NIGHT_DEPTH + 3).setTint(Phaser.Display.Color.GetColor(v, v, Math.min(255, v + 20)));
      this.litUp = true;
    } else if (this.litUp) {
      this.sprite.clearTint();
      this.litUp = false;
    }
  }

  destroy() {
    this.glow.destroy();
    super.destroy();
  }
}
