// Quallenglas (Quallen-Event im Riff): wird geschwungen wie der Kescher und fängt Quallen – aber nur, während sie
// sich entspannen und sinken. Erwischt man eine, während sie sich zusammenzieht und aufsteigt, flutscht sie davon.
import Net from './Net.js';

export default class Jar extends Net {
  constructor(scene, player) {
    super(scene, player, { id: 'jar', texture: 'jar', origin: [32 / 64, 58 / 64] });
  }

  use() {
    this.slipped = new Set(); // jede Qualle flutscht pro Schwung nur einmal davon
    super.use();
  }

  caughtBy(animals) {
    const caught = super.caughtBy(animals);
    if (this.active && this.progress >= this.catchFrom && this.progress <= this.catchTo) {
      for (const a of animals) {
        if (a.species !== 'jellyfish' || a.state !== 'wild' || caught.includes(a) || this.slipped?.has(a)) continue;
        if (this.zoneDistance(a) >= this.radius) continue;
        this.slipped.add(a);
        a.slip(); // stieg gerade auf: davon
      }
    }
    return caught;
  }
}
