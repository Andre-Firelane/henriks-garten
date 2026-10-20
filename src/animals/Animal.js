import Phaser from 'phaser';
import { blockedAt, footTiles } from '../world/collision.js';
import { inPen, isGate, enclosureAt, accepts, bridgeLift } from '../world/map.js';
import { worldToTile } from '../world/iso.js';
import { rareChance } from '../world/events.js';

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
    eatTexture: 'cat_eat', // beim Fressen am Futter im Tierpark
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
    eatTexture: 'deer_eat', // beim Fressen am Futter im Tierpark
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
    eatTexture: 'antelope_eat', // beim Fressen am Futter im Tierpark
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
    herd: true, // erscheint in kleinen Gruppen
  },
  // Zebra (Savanne): Herdentier wie die Antilope, etwas weniger scheu; trinkt ab und zu am Wasserloch
  // und ist dann auch durch Berühren fangbar (siehe Zebra.js)
  zebra: {
    texture: 'zebra',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 100 / 104,
    speed: 28,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1.5,
    footW: 9,
    shadowW: 28,
    fleeDist: 55, // weniger scheu als die Antilope (70)
    fleeSpeed: 88,
    catchWith: ['lasso', 'touch'], // Berühren nur beim Trinken
    herd: true,
  },
  // Erdmännchen (Savanne): Kolonie aus 3 bis 5 mit einem Wächter (siehe Meerkat.js); nur mit dem Kescher
  meerkat: {
    texture: 'meerkat',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 52 / 56,
    speed: 22,
    restChance: 0.5,
    restTime: [1, 3],
    walkTime: [1, 2],
    stepRate: 12,
    hop: 1.5,
    footW: 5,
    shadowW: 16,
    catchWith: ['net'],
    herd: true,
    groupSize: [3, 5], // so viele erscheinen zusammen (statt HERD_SIZE)
  },
  // Löwe (Savanne): döst unter Akazien, nur durch Kraulen fangbar, solange er schläft (siehe Lion.js)
  lion: {
    texture: 'lion',
    eatTexture: 'lion_eat', // beim Fressen am Futter im Tierpark
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 26,
    restChance: 0.6,
    restTime: [2, 5],
    walkTime: [1.5, 3],
    stepRate: 8,
    hop: 1.5,
    footW: 10,
    shadowW: 36,
    catchWith: ['touch'],
  },
  // Krokodil (Savanne): taucht wie der Fisch in Wasserlöchern auf; nur mit dem Lasso (siehe Crocodile.js)
  crocodile: {
    texture: 'croc', // an Land (gefangen); im Wasser "croc_water"
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 88 / 92,
    speed: 12, // gemütliches Schwimmen im Krokodilteich
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 3],
    stepRate: 7,
    hop: 1,
    footW: 6,
    shadowW: 32,
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
    eatTexture: 'stag_eat', // beim Fressen am Futter im Tierpark
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
    eatTexture: 'fox_eat', // beim Fressen am Futter im Tierpark
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
  // Japanmakak (Asien): badet in der heißen Quelle, rennt selten wild herum (dann mit dem Lasso), siehe Macaque.js
  macaque: {
    texture: 'macaque',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 68 / 72,
    speed: 30,
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 2.5],
    stepRate: 10,
    hop: 2,
    footW: 6,
    shadowW: 22,
    catchWith: ['lasso'],
  },
  // Panda (Asien): bleibt beim Bambus, sitzt und frisst; fangen mit Grünfutter (siehe Panda.js)
  panda: {
    texture: 'panda',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 18,
    restChance: 0.55,
    restTime: [2, 5],
    walkTime: [1, 3],
    stepRate: 6,
    hop: 1,
    footW: 9,
    shadowW: 34,
    catchWith: ['food'],
  },
  // Tiger (Asien): streift als Schemen durch den Bambus, mit dem Ball lockt man ihn heraus (siehe Tiger.js)
  tiger: {
    texture: 'tiger',
    eatTexture: 'tiger_eat', // beim Fressen am Futter im Tierpark
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 76 / 80,
    speed: 22,
    restChance: 0.5,
    restTime: [2, 5],
    walkTime: [1, 3],
    stepRate: 7,
    hop: 1,
    footW: 9,
    shadowW: 38,
    catchWith: ['lasso'],
  },
  // Orang-Utan (Asien): sitzt oben in den Urwaldbäumen, kommt nach dem Wink-Spiel herunter (siehe Orangutan.js)
  orangutan: {
    texture: 'orangutan',
    eatTexture: 'orangutan_eat', // sitzt und frisst (am Futter im Tierpark)
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 84 / 88,
    speed: 16,
    restChance: 0.6,
    restTime: [2, 6],
    walkTime: [1, 2.5],
    stepRate: 5,
    hop: 1,
    footW: 8,
    shadowW: 30,
    catchWith: ['touch'],
  },
  // Pfau (Asien): scheu wie das Zebra, fliegt manchmal ganz davon; beim Rad-Schlagen fangbar (siehe Peacock.js)
  peacock: {
    texture: 'peacock',
    frames: { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 },
    originY: 92 / 96,
    speed: 24,
    restChance: 0.5,
    restTime: [1.5, 4],
    walkTime: [1, 2.5],
    stepRate: 9,
    hop: 1.5,
    footW: 6,
    shadowW: 24,
    fleeDist: 55, // so scheu wie das Zebra
    fleeSpeed: 85,
    catchWith: ['touch', 'net'], // nur beim Rad-Schlagen
  },
  // Flamingo (Event „Flamingo-Flug“): verhält sich wie der Reiher; babyTexture: graues Küken beim Tierbaby-Event
  flamingo: {
    texture: 'flamingo',
    flyTexture: 'flamingo_fly',
    babyTexture: 'flamingo_baby',
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
  // Koi (Asien): unter Wasser nur bunte Schatten, mit Fischfutter lockt man sie hoch (siehe Koi.js).
  // Gefangen wie der Fisch als Beutel; texture ist eines der drei Farbmuster (koi1 bis koi3)
  koi: {
    texture: 'koi2',
    bagTexture: 'fishbag',
    frames: { downRight: 0, downLeft: 1, upLeft: 2, upRight: 3 }, // im Beutel wie beim Fisch
    originY: 68 / 72,
    speed: 14,
    restChance: 0.4,
    restTime: [1, 3],
    walkTime: [1, 3],
    stepRate: 8,
    hop: 1,
    footW: 4,
    shadowW: 20,
    catchWith: ['net'],
  },
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
const FEED_WALK_TIMEOUT = 8; // kommt ein Tier nicht ans Futter, frisst es dort, wo es gerade steht

// Zustände: 'wild' läuft frei herum, 'following' folgt dem Spieler, 'penned' ist im Gehege, 'trapped' sitzt in der Falle
// Seltene Skins: anderes Aussehen derselben Tierart. wild: Anteil draußen, baby: Anteil bei den Tierbabys.
// Im Gehege locken sie mehr Besucher an (siehe SKIN_APPEAL in world/visitors.js).
export const SKINS = {
  cat: { id: 'cat2', name: 'Glöckchen-Katze', male: false, wild: 0.12, baby: 0.03 }, // Katze 2: schwarz-weiß getigert mit Glöckchen
  antelope: { id: 'antelope2', name: 'Oryx-Antilope', male: false, wild: 0.1, baby: 0.03 }, // gilt für die ganze Herde
  fish: { id: 'fish2', name: 'Wels', male: true, wild: 0.1, baby: 0 }, // Fische bekommen keine Babys
  tiger: { id: 'tiger2', name: 'weißer Tiger', male: true, wild: 0.1, baby: 0.03 },
  peacock: { id: 'peacock2', name: 'weißer Pfau', male: true, wild: 0.1, baby: 0.03 },
  orangutan: { id: 'orangutan2', name: 'Orang-Utan mit Backenwülsten', male: true, wild: 0.1, baby: 0.03 }, // Flanschen-Männchen
  frog: { id: 'frog2', name: 'blauer Frosch', male: true, wild: 0.1, baby: 0.03 }, // blau mit bunten Punkten
};
// seltene Tierarten, die eigentlich eine Variante einer anderen sind (der Hirsch beim Reh): bleiben wie Skins
// beim Auszug ins Naturreservat bevorzugt im Gehege
export const RARE_SPECIES = ['stag'];

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
        // beim Reiten ist der Spieler schneller: dann laufen sie entsprechend schneller hinterher
        const step = Math.min(Math.max(FOLLOW_SPEED, (player.speed ?? 0) * 1.25) * dt, d - stop);
        // Die Spur ist begehbar, daher ohne Kollision: so bleibt es nirgends hängen
        moving = this.move((dx / d) * step, (dy / d) * step);
      }
      if (this.arrivedHome()) this.enterPen();
    } else if (this.feed) {
      moving = this.updateFeed(dt); // im Tierpark: zum Futter laufen und fressen
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

  // Futter im Gehege: Kann das Tier gerade zum Futter kommen? (z. B. nicht, während es auf dem Kratzbaum schläft)
  canFeed() {
    return this.state === 'penned';
  }

  // zum Futterplatz laufen und dort time Sekunden fressen; food: Mitte des Futters (dorthin schaut es)
  eatAt(spot, food, time) {
    this.startFeed();
    this.feed = { spot, food, time, phase: 'walk', timeout: FEED_WALK_TIMEOUT };
  }

  // Unterklassen beenden hier besondere Zustände (schlafen, trinken ...), bevor das Tier zum Futter läuft
  startFeed() {}

  // beim Fressen das Fress-Bild (kind.eatTexture, Kopf unten); das Schaf grast stattdessen (siehe Sheep.js)
  setEating(on) {
    // seltene Varianten ohne eigenes Fress-Bild bleiben beim Fressen in ihrem Bild
    this.eatingLook = on && !!this.kind.eatTexture && this.scene.textures.exists(this.eatTexture());
  }

  // Bild für Stehen und Laufen: beim Fressen am Futter das Fress-Bild; mit Skin dessen Bilder (z. B. cat2, cat2_eat)
  baseTexture() {
    return this.skin ?? this.kind.texture;
  }
  eatTexture() {
    return this.skin ? `${this.skin}_eat` : this.kind.eatTexture;
  }
  lookTexture() {
    return this.eatingLook ? this.eatTexture() : this.baseTexture();
  }

  // seltene Variante (Skin, Hirsch, weißer Koi): bleibt beim Auszug ins Naturreservat bevorzugt im Gehege
  isRare() {
    return !!this.skin || RARE_SPECIES.includes(this.species);
  }

  // seltener Skin würfeln: from 'wild' (draußen) oder 'baby' (Tierbaby-Event, viel seltener)
  rollSkin(from) {
    const s = SKINS[this.species];
    const chance = from === 'wild' ? rareChance(s?.wild ?? 0) : s?.[from] ?? 0; // Event "Seltene Tiere": 50 %
    this.skin = s && Math.random() < chance ? s.id : null;
  }

  updateFeed(dt) {
    const f = this.feed;
    if (f.phase === 'walk') {
      f.timeout -= dt;
      const dx = f.spot.x - this.x;
      const dy = f.spot.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 3 || f.timeout <= 0) {
        f.phase = 'eat';
        this.faceX = Math.sign(f.food.x - this.x) || this.faceX;
        this.faceY = Math.sign(f.food.y - this.y) || this.faceY;
        this.setEating(true);
        return false;
      }
      const step = Math.min(d, this.kind.speed * 1.3 * dt);
      const angle = Math.atan2(dy, dx);
      for (const turn of [0, 0.5, -0.5, 1, -1]) {
        if (this.move(Math.cos(angle + turn) * step, Math.sin(angle + turn) * step)) return true;
      }
      return false;
    }
    f.time -= dt;
    if (f.time <= 0) {
      this.feed = null;
      this.setEating(false);
      this.pickWander();
    }
    return false;
  }

  // Ist ein folgendes Tier an seinem Ziel angekommen? Nur in einem Gehege, das diese Tierart aufnimmt.
  arrivedHome() {
    const enclosure = this.enclosureFullyAt(this.x, this.y);
    if (!enclosure || !accepts(enclosure, this.species)) return false;
    this.enclosure = enclosure;
    return true;
  }

  // Darf der Spawner es gerade entfernen? (Fische, Eichhörnchen und Maulwürfe nur, wenn man sie nicht sieht)
  canDespawn() {
    return true;
  }

  // Kann der Spieler es in diesem Moment fangen?
  canBeCaughtNow() {
    return this.state === 'wild';
  }

  // ... und mit diesem Werkzeug ('touch' = Berühren)?
  canBeCaughtWith(tool) {
    return this.canBeCaughtNow() && this.kind.catchWith.includes(tool);
  }

  // Bild, Blickrichtung und Wippen beim Laufen
  render(moving) {
    // zwischen Lauf- und Fress-Bild wechseln (andere Bilder wie Schlafen setzen die Unterklassen selbst)
    if (this.kind.eatTexture || this.skin) {
      // (auch vom normalen Bild auf das des Skins; andere Bilder wie Schlafen setzen die Unterklassen selbst)
      const key = this.lookTexture();
      const looks = [this.kind.texture, this.kind.eatTexture, this.baseTexture(), this.eatTexture()];
      if (this.sprite.texture.key !== key && looks.includes(this.sprite.texture.key)) this.sprite.setTexture(key, this.sprite.frame.name);
    }
    this.sprite.setFrame(
      this.faceY > 0
        ? this.faceX < 0 ? this.kind.frames.downLeft : this.kind.frames.downRight
        : this.faceX > 0 ? this.kind.frames.upRight : this.kind.frames.upLeft,
    );

    const phase = this.walkTime * this.kind.stepRate;
    const hop = moving ? Math.abs(Math.sin(phase)) * this.kind.hop : 0;
    const lift = bridgeLift(this.x, this.y); // auf einer Bogenbrücke etwas höher
    this.sprite.setPosition(this.x, this.y - hop - lift + SPRITE_SINK);
    this.sprite.setAngle(moving ? Math.sin(phase) * 2 : 0);
    this.shadow.setPosition(this.x, this.y - lift);
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
    if (this.state === 'penned') return this.enclosureFullyAt(x, y) !== this.enclosure;
    return footTiles(x, y, this.kind.footW, FOOT_H).some(
      ({ tx, ty }) => inPen(tx, ty) || isGate(tx, ty),
    );
  }

  // Das Gehege, in dem das Tier mit allen Füßen steht (oder null)
  enclosureFullyAt(x, y) {
    const tiles = footTiles(x, y, this.kind.footW, FOOT_H);
    const enclosure = enclosureAt(tiles[0].tx, tiles[0].ty);
    return enclosure && tiles.every(({ tx, ty }) => enclosureAt(tx, ty) === enclosure) ? enclosure : null;
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
    this.feed = null; // mitten beim Fressen gefangen
    this.eatingLook = false;
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
    if (state === 'penned') {
      const { tx, ty } = worldToTile(this.x, this.y);
      this.enclosure = enclosureAt(tx, ty);
      this.pickWander();
    }
  }

  enterPen() {
    this.state = 'penned';
    this.pickWander();
    this.popHeart();
  }

  // Tierbaby (beim Event im Tierpark): dasselbe Bild, nur kleiner; wird nicht gespeichert und nicht gezählt
  makeBaby() {
    this.baby = true;
    this.sprite.setScale(0.3);
    this.shadow.setScale(0.6);
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
