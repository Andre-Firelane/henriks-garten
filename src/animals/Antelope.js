// Antilope (Savanne): verhält sich wie das Reh (scheu, flieht, fangbar nur mit dem Lasso), lebt aber in kleinen Gruppen.
// Eine Gruppe läuft gemeinsam in eine Richtung und rastet zusammen; wer sich zu weit entfernt, kehrt zur Gruppe zurück.
// Bemerkt eine Antilope den Spieler, flieht die ganze Gruppe.
import Phaser from 'phaser';
import Animal from './Animal.js';

const HERD_JOIN = 90; // so nah muss eine neue Antilope an einer Gruppe sein, um dazuzugehören
const HERD_RADIUS = 45; // weiter weg von der Gruppenmitte: zurücklaufen
const HERD_SPREAD = 0.5; // so stark (Bogenmaß) weicht jede von der gemeinsamen Laufrichtung ab
const ALARM_TIME = 1.2; // so lange (Sekunden) flieht die Gruppe mit, nachdem eine den Spieler bemerkt hat
const SCATTER_TIME = 2.5; // wird eine aus der Herde gefangen, rennen die anderen so lange weg und verschwinden dann

export default class Antelope extends Animal {
  // allAnimals: alle Tiere des Levels, darin sucht sie ihre Gruppe; species: für Herdentiere, die davon erben (Zebra)
  constructor(scene, x, y, allAnimals, species = 'antelope') {
    super(scene, x, y, species);
    this.allAnimals = allAnimals;
    // einer Gruppe in der Nähe anschließen oder eine neue gründen
    const near = allAnimals.find(
      (a) => a.herd && a.species === species && a.state === 'wild' && Math.hypot(a.x - x, (a.y - y) * 2) < HERD_JOIN,
    );
    this.herd = near ? near.herd : { heading: 0, rest: true, until: 0, alarm: 0 };
  }

  now() {
    return this.scene.time.now / 1000;
  }

  // Vor Schreck davonrennen (weil ein Tier der Herde gefangen wurde) und danach verschwinden
  scatter() {
    if (this.state === 'wild' && !this.scatterUntil) this.scatterUntil = this.now() + SCATTER_TIME;
  }

  // Läuft gerade die Flucht nach einem Fang? Dann gibt sie zurück, ob es sich bewegt hat, sonst null
  updateScatter(dt, player) {
    if (!this.scatterUntil) return null;
    if (this.now() >= this.scatterUntil) {
      this.scatterUntil = Infinity; // nur einmal verschwinden
      this.scene.despawn(this);
      return false;
    }
    this.fleeing = true;
    return this.flee(dt, player);
  }

  updateFree(dt, player) {
    const scattering = this.state === 'wild' ? this.updateScatter(dt, player) : null;
    if (scattering !== null) return scattering;
    return super.updateFree(dt, player);
  }

  herdMates() {
    return this.allAnimals.filter((a) => a !== this && a.herd === this.herd && a.state === 'wild');
  }

  // Wohin als Nächstes? Zur Gruppe zurück, sonst so wie die Gruppe (gemeinsame Richtung oder gemeinsame Pause)
  pickWander() {
    // im Gehege (und während des Aufbaus im Konstruktor) wie jedes andere Tier
    if (!this.herd || this.state !== 'wild') return super.pickWander();
    const mates = this.herdMates();
    if (mates.length) {
      const cx = mates.reduce((s, a) => s + a.x, 0) / mates.length;
      const cy = mates.reduce((s, a) => s + a.y, 0) / mates.length;
      if (Math.hypot(this.x - cx, (this.y - cy) * 2) > HERD_RADIUS) {
        const angle = Math.atan2(cy - this.y, cx - this.x);
        this.dirX = Math.cos(angle);
        this.dirY = Math.sin(angle);
        this.wanderTime = Phaser.Math.FloatBetween(0.6, 1.2);
        return;
      }
    }
    // Die Gruppe entscheidet gemeinsam: wer zuerst nach Ablauf fragt, legt fest, was alle tun
    const h = this.herd;
    const now = this.now();
    if (now >= h.until) {
      const { restChance, restTime, walkTime } = this.kind;
      h.rest = Math.random() < restChance;
      h.heading = Math.random() * Math.PI * 2;
      h.until = now + Phaser.Math.FloatBetween(...(h.rest ? restTime : walkTime));
    }
    this.wanderTime = Math.max(0.3, h.until - now);
    if (h.rest) {
      this.dirX = 0;
      this.dirY = 0;
    } else {
      const angle = h.heading + Phaser.Math.FloatBetween(-HERD_SPREAD, HERD_SPREAD);
      this.dirX = Math.cos(angle);
      this.dirY = Math.sin(angle);
    }
  }

  // Wie das Reh, aber eine Warnung gilt für die ganze Gruppe
  shouldFlee(player) {
    if (this.state !== 'wild') return false;
    const sees = super.shouldFlee(player);
    const now = this.now();
    if (sees) this.herd.alarm = now + ALARM_TIME;
    else if (now < this.herd.alarm) this.fleeing = true;
    return this.fleeing;
  }
}
