// Futtersträucher (Dschungel, überall wo Tapire oder Okapis leben): dunkelgrüne Büsche mit frischen, hellen Zweigen.
// Mit der Aktionstaste bricht Henrik einen Blätterzweig ab (das getragene Werkzeug steckt er so lange ein, wie beim
// großen Stock für den Biberdamm). Mit dem Zweig füttert er einen Tapir oder ein Okapi, das dann mitläuft
// (GardenScene.feedLeaves). Der Strauch ist danach kahl und wächst nach einer Weile nach.
// Bilder: tools/leaf-bush.py. Man läuft durch die Sträucher hindurch (nur Deko, kein Hindernis).
import Phaser from 'phaser';
import { tileToWorld } from './iso.js';

const ORIGIN = [0.5, 62 / 72]; // Fuß des Strauchs im Bild
const TAKE_DIST = 34; // so nah muss man am Strauch stehen, um einen Zweig abzubrechen
const REGROW = [25, 40]; // so lange (Sekunden), bis ein kahler Strauch wieder frische Zweige hat

export default class LeafBushes {
  constructor(scene, tiles) {
    this.scene = scene;
    this.bushes = tiles.map(({ tx, ty }) => {
      const p = tileToWorld(tx, ty);
      const img = scene.add.image(p.x, p.y + 4, 'leaf_bush').setOrigin(...ORIGIN).setDepth(p.y + 4);
      return { x: p.x, y: p.y + 4, img, full: true, grow: 0 };
    });
  }

  // Strauch mit Zweigen in Reichweite (oder null)
  near(p) {
    return this.bushes.find((b) => b.full && Math.hypot(p.x - b.x, (p.y - b.y) * 2) < TAKE_DIST) ?? null;
  }

  // nächster Strauch mit Zweigen (für die Hinweisblase), höchstens so weit weg
  closest(p, max) {
    let best = null;
    let bestD = max;
    for (const b of this.bushes) {
      if (!b.full) continue;
      const d = Math.hypot(p.x - b.x, (p.y - b.y) * 2);
      if (d < bestD) {
        best = b;
        bestD = d;
      }
    }
    return best;
  }

  // Zweig abbrechen: der Strauch ist kahl und wächst nach
  take(bush) {
    bush.full = false;
    bush.grow = Phaser.Math.FloatBetween(...REGROW);
    bush.img.setTexture('leaf_bush_bare');
    this.scene.tweens.add({ targets: bush.img, scaleX: 1.08, scaleY: 0.94, duration: 90, yoyo: true });
  }

  update(dt) {
    for (const b of this.bushes) {
      if (b.full) continue;
      b.grow -= dt;
      if (b.grow > 0) continue;
      b.full = true;
      b.img.setTexture('leaf_bush');
      b.img.setScale(0.8);
      this.scene.tweens.add({ targets: b.img, scale: 1, duration: 400, ease: 'Back.easeOut' });
    }
  }
}
