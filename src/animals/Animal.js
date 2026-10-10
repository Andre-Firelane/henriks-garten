import Phaser from 'phaser';
import { blockedAt, footTiles } from '../world/collision.js';
import { inPen, isGate } from '../world/map.js';

// Tierarten: alle verhalten sich gleich, nur Aussehen, Tempo und Rhythmus unterscheiden sich.
// frames: Bild-Nummer im Spritesheet je Blickrichtung; originY: Fußlinie im Bild (siehe tools/prepare-characters.js)
export const SPECIES = {
  sheep: {
    texture: 'sheep',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 25, // gemütlich, deutlich langsamer als der Spieler (80)
    restChance: 0.4, // Wahrscheinlichkeit, eine Pause einzulegen statt loszulaufen
    restTime: [1, 3], // Sekunden Pause (von, bis)
    walkTime: [1.5, 3.5], // Sekunden Laufen (von, bis)
    stepRate: 9,
    hop: 1.5,
    footW: 9,
    shadowW: 30,
    catchWith: ['touch', 'lasso'], // womit man es fangen kann: 'touch' (berühren), 'net' (Kescher), 'lasso', 'trap' (Falle)
  },
  cat: {
    texture: 'cat',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 60, // flink, aber noch langsamer als der Spieler
    restChance: 0.45,
    restTime: [0.3, 1.2], // kurze Pausen ...
    walkTime: [0.3, 0.8], // ... und kurze, schnelle Sprints
    stepRate: 16,
    hop: 1.5,
    footW: 7,
    shadowW: 24,
    catchWith: ['touch', 'net'],
  },
  deer: {
    texture: 'deer',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 30,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 1.5,
    footW: 8,
    shadowW: 26,
    fleeDist: 70, // so nah darf der Spieler kommen, dann rennt es weg
    fleeSpeed: 95, // schneller als der Spieler (80)
    catchWith: ['lasso', 'trap'], // scheu: nur mit dem Lasso aus der Entfernung oder in der Falle
    trapWeight: 1.2, // wie gern es in die Falle geht
  },
  // Antilope (Savanne): wie das Reh, lebt aber in kleinen Gruppen (siehe Antelope.js); nur mit dem Lasso
  antelope: {
    texture: 'antelope',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 96 / 100,
    speed: 30,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 1.5,
    footW: 8,
    shadowW: 26,
    fleeDist: 70,
    fleeSpeed: 95,
    catchWith: ['lasso'],
  },
  // Giraffe (Savanne): viel größer als die anderen Tiere, läuft gemächlich herum; zahm wird sie nur mit Grünfutter
  // (siehe feedGiraffe in GardenScene)
  giraffe: {
    texture: 'giraffe',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 164 / 168,
    speed: 16,
    restChance: 0.6,
    restTime: [2, 6],
    walkTime: [1.5, 4],
    stepRate: 6,
    hop: 1,
    footW: 11,
    shadowW: 40,
    catchWith: ['food'],
  },
  // Hirsch: verhält sich wie das Reh, ist aber sehr selten
  stag: {
    texture: 'stag',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 108 / 112,
    speed: 30,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 1.5,
    footW: 8,
    shadowW: 30,
    fleeDist: 70, // so nah darf der Spieler kommen, dann rennt es weg
    fleeSpeed: 95, // schneller als der Spieler (80)
    catchWith: ['lasso', 'trap'], // scheu: nur mit dem Lasso aus der Entfernung oder in der Falle
    trapWeight: 1.2, // wie gern es in die Falle geht
  },
  // Eichhörnchen sitzen meist auf ihrem Baum (siehe Squirrel.js)
  squirrel: {
    texture: 'squirrel',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 56 / 60,
    speed: 45,
    restChance: 0.5,
    restTime: [0.5, 1.5],
    walkTime: [0.3, 0.8],
    stepRate: 16,
    hop: 2,
    footW: 5,
    shadowW: 16,
    catchWith: ['touch', 'net', 'trap'],
    trapWeight: 1,
  },
  // Füchse sind noch scheuer als Rehe und lassen sich nur mit der Falle fangen
  fox: {
    texture: 'fox',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 35,
    restChance: 0.5,
    restTime: [1, 3],
    walkTime: [1, 2.5],
    stepRate: 12,
    hop: 1.5,
    footW: 7,
    shadowW: 22,
    fleeDist: 130, // flieht schon viel früher als das Reh (70)
    fleeSpeed: 110,
    catchWith: ['trap'],
    trapWeight: 3, // Füchse lieben den Köder
  },
  // Frösche hüpfen im Kreis (siehe Frog.js) und leben gern am Wasser
  frog: {
    texture: 'frog',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 48 / 52,
    speed: 30, // nur im Gehege, sonst hüpft er im Kreis
    restChance: 0.5,
    restTime: [0.8, 2],
    walkTime: [0.4, 1],
    stepRate: 8,
    hop: 4,
    footW: 5,
    shadowW: 18,
    catchWith: ['touch', 'net'],
  },
  // Maulwürfe leben unter der Erde und tauchen kurz im Hügel auf (siehe Mole.js);
  // frames/originY gelten für den laufenden Maulwurf, nachdem man ihn gefangen hat
  mole: {
    texture: 'mole',
    moundTexture: 'mole_mound',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 48 / 52,
    speed: 20,
    restChance: 0.5,
    restTime: [1, 3],
    walkTime: [1, 2],
    stepRate: 10,
    hop: 1,
    footW: 6,
    shadowW: 20,
    catchWith: ['touch', 'net'],
  },
  // Fischreiher fliegen über die Karte und landen manchmal am Wasser (siehe Heron.js);
  // texture: stehend (auch beim Folgen), flyTexture: fliegend
  heron: {
    texture: 'heron',
    flyTexture: 'heron_fly',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 104 / 108,
    speed: 25,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2],
    stepRate: 7,
    hop: 1,
    footW: 7,
    shadowW: 26,
    catchWith: ['touch', 'net', 'lasso'],
  },
  // Fische leben im Wasser (siehe Fish.js); frames/originY gelten für den Beutel beim Tragen
  fish: {
    texture: 'fish',
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 },
    originY: 68 / 72,
    speed: 12, // gemütliches Schwimmen im Fischteich
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 20,
    catchWith: ['net'],
  },
};

// Kann man diese Tierart im Moment überhaupt fangen?
export function isCatchable(kind) {
  return kind.catchWith.length > 0;
}

const FOLLOW_SPEED = 100; // beim Hinterherlaufen schneller als der Spieler, damit es aufholt
export const FOLLOW_GAP = 34; // Abstand zwischen den Tieren auf der Spur des Spielers
export const CATCH_DIST = 22; // so nah muss der Spieler ran, um es zu fangen
const FOOT_H = 3;
// Die Füße stehen etwas unterhalb der Schattenmitte, sonst wirkt die Figur, als schwebe sie über dem Schatten
export const SPRITE_SINK = 3;

// Zustände: 'wild' läuft frei herum, 'following' folgt dem Spieler, 'penned' ist im Gehege, 'trapped' sitzt in der Falle
export default class Animal {
  constructor(scene, x, y, species) {
    this.scene = scene;
    this.species = species;
    this.kind = SPECIES[species];
    this.x = x;
    this.y = y;
    this.faceX = Math.random() < 0.5 ? -1 : 1;
    this.faceY = 1;
    this.state = 'wild';
    this.followGap = FOLLOW_GAP;
    this.walkTime = 0;

    this.shadow = scene.add.ellipse(x, y, this.kind.shadowW, this.kind.shadowW / 3, 0x14320a, 0.3);
    this.sprite = scene.add.sprite(x, y, this.kind.texture, this.kind.frames.downRight);
    this.sprite.setOrigin(0.5, this.kind.originY).setScale(0.5);

    this.pickWander();
    this.wanderTime *= Math.random(); // nicht alle Tiere gleichzeitig loslaufen lassen
  }

  // Entweder eine Pause einlegen oder in eine zufällige Richtung loslaufen
  pickWander() {
    const { restChance, restTime, walkTime } = this.kind;
    if (Math.random() < restChance) {
      this.dirX = 0;
      this.dirY = 0;
      this.wanderTime = Phaser.Math.FloatBetween(...restTime);
    } else {
      const angle = Math.random() * Math.PI * 2;
      this.dirX = Math.cos(angle);
      this.dirY = Math.sin(angle);
      this.wanderTime = Phaser.Math.FloatBetween(...walkTime);
    }
  }

  update(dt, player) {
    if (this.state === 'trapped') {
      // In der Falle bleibt es versteckt: welches Tier drin sitzt, ist eine Überraschung beim Abholen
      this.render(false);
      this.sprite.setVisible(false);
      this.shadow.setVisible(false);
      return;
    }
    let moving = false;
    if (this.state === 'following') {
      // Der Spur des Spielers folgen; ist sie noch zu kurz, einfach in die Nähe laufen
      const target = player.trailPoint(this.followGap);
      const tx = target ? target.x : player.x;
      const ty = target ? target.y : player.y;
      const stop = target ? 1 : this.followGap;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const d = Math.hypot(dx, dy);
      if (d > stop) {
        const step = Math.min(FOLLOW_SPEED * dt, d - stop);
        // Die Spur ist begehbar, daher ohne Kollision: so bleibt es nirgends hängen
        moving = this.move((dx / d) * step, (dy / d) * step);
      }
      if (this.arrivedHome()) this.enterPen();
    } else {
      moving = this.updateFree(dt, player);
    }

    if (moving) this.walkTime += dt * (this.fleeing ? 1.8 : 1); // auf der Flucht schnellere Schritte
    else this.walkTime = 0;
    this.render(moving);
  }

  // Verhalten, solange das Tier nicht folgt (wild oder im Gehege); gibt zurück, ob es sich bewegt
  updateFree(dt, player) {
    if (this.shouldFlee(player)) return this.flee(dt, player);
    this.wanderTime -= dt;
    if (this.wanderTime <= 0) this.pickWander();
    if (!this.dirX && !this.dirY) return false;
    const moved = this.move(this.dirX * this.kind.speed * dt, this.dirY * this.kind.speed * dt);
    if (!moved) this.pickWander(); // gegen etwas gelaufen: neue Richtung
    return moved;
  }

  // Ist ein folgendes Tier an seinem Ziel angekommen?
  arrivedHome() {
    return this.fullyInPen(this.x, this.y);
  }

  // Darf der Spawner es gerade entfernen? (Fische, Eichhörnchen und Maulwürfe nur, wenn man sie nicht sieht)
  canDespawn() {
    return true;
  }

  // Kann der Spieler es in diesem Moment fangen?
  canBeCaughtNow() {
    return this.state === 'wild';
  }

  // Bild, Blickrichtung und Wippen beim Laufen
  render(moving) {
    this.sprite.setFrame(
      this.faceY > 0
        ? this.faceX < 0 ? this.kind.frames.downLeft : this.kind.frames.downRight
        : this.faceX > 0 ? this.kind.frames.upRight : this.kind.frames.upLeft,
    );

    const phase = this.walkTime * this.kind.stepRate;
    const hop = moving ? Math.abs(Math.sin(phase)) * this.kind.hop : 0;
    this.sprite.setPosition(this.x, this.y - hop + SPRITE_SINK);
    this.sprite.setAngle(moving ? Math.sin(phase) * 2 : 0);
    this.shadow.setPosition(this.x, this.y);
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 0.5);
  }

  // Scheue Tiere fliehen, wenn der Spieler zu nah kommt, und beruhigen sich erst mit etwas mehr Abstand
  shouldFlee(player) {
    if (this.state !== 'wild' || !this.kind.fleeDist) return false;
    // Abstand in Kachel-Proportionen (Kacheln sind halb so hoch wie breit)
    const d = Math.hypot(this.x - player.x, (this.y - player.y) * 2);
    if (d < this.kind.fleeDist) this.fleeing = true;
    else if (d > this.kind.fleeDist * 1.6) {
      if (this.fleeing) this.pickWander();
      this.fleeing = false;
    }
    return this.fleeing;
  }

  // Vom Spieler weg rennen; ist der direkte Weg versperrt, schräg zur Seite ausweichen
  flee(dt, player) {
    const away = Math.atan2(this.y - player.y, this.x - player.x);
    const step = this.kind.fleeSpeed * dt;
    for (const turn of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8]) {
      const a = away + turn;
      if (this.move(Math.cos(a) * step, Math.sin(a) * step)) return true;
    }
    return false; // in die Enge getrieben
  }

  // Darf das Tier mit seinen Füßen an Position x/y stehen?
  blocked(x, y) {
    if (this.state === 'following') return false;
    if (blockedAt(x, y, this.kind.footW, FOOT_H)) return true;
    // Im Gehege bleibt es drin, wilde Tiere laufen nicht von selbst hinein
    if (this.state === 'penned') return !this.fullyInPen(x, y);
    return footTiles(x, y, this.kind.footW, FOOT_H).some(
      ({ tx, ty }) => inPen(tx, ty) || isGate(tx, ty),
    );
  }

  fullyInPen(x, y) {
    return footTiles(x, y, this.kind.footW, FOOT_H).every(({ tx, ty }) => inPen(tx, ty));
  }

  // Bewegt das Tier; gibt zurück, ob es sich bewegt hat
  move(dx, dy) {
    let moved = false;
    if (dx && !this.blocked(this.x + dx, this.y)) {
      this.x += dx;
      moved = true;
    }
    if (dy && !this.blocked(this.x, this.y + dy)) {
      this.y += dy;
      moved = true;
    }
    // Blickrichtung nur bei deutlicher Bewegung ändern, sonst flackert sie
    const len = Math.hypot(dx, dy);
    if (moved && Math.abs(dx) > len * 0.3) this.faceX = Math.sign(dx);
    if (moved && Math.abs(dy) > len * 0.3) this.faceY = Math.sign(dy);
    return moved;
  }

  catch() {
    this.state = 'following';
    this.sprite.setVisible(true);
    this.shadow.setVisible(true);
    this.popHeart();
  }

  // Aus der Welt entfernen (beim Rotieren der wilden Tiere)
  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
  }

  // In die Falle gehen: sitzt dann still im Käfig, bis der Spieler es abholt
  enterTrap(x, y) {
    this.state = 'trapped';
    this.x = x;
    this.y = y;
    this.faceY = 1;
  }

  // Zustand ohne Effekte setzen (beim Betreten eines Levels)
  restore(state) {
    this.state = state;
    if (state === 'penned') this.pickWander();
  }

  enterPen() {
    this.state = 'penned';
    this.pickWander();
    this.popHeart();
  }

  popHeart() {
    const heart = this.scene.add
      .text(this.x, this.y - Math.max(40, this.sprite.displayHeight * 0.85), '♥', { fontFamily: 'Arial', fontSize: '20px', color: '#e8483f', stroke: '#ffffff', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(100000);
    this.scene.tweens.add({
      targets: heart,
      y: heart.y - 20,
      alpha: 0,
      duration: 1200,
      ease: 'Quad.easeOut',
      onComplete: () => heart.destroy(),
    });
  }
}
