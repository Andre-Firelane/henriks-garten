// Angelfisch (docs/plan-angeln.md): wird nur mit der Angel gefangen (RodTool, Schatten: FishShadows.js) und lebt nie wild als
// Tier. Gefangen sitzt er im Fischeimer an Henrik (FishBucket.js, das Tier selbst bleibt unsichtbar bei Henrik), im Tierpark
// zieht er in die Süßwasserhalle des Aquariums und schwimmt dort wie die Riff-Fische von der Seite mit wackelnder Schwanzflosse.
// skin: Fischart (SKINS.fish, src/world/fishing.js), variant: 1 groß, 0 klein.
import ReefFish from './ReefFish.js';
import { BIG_SCALE, fishFrame } from '../world/fishing.js';

const TANK_SCALE = 0.17; // Bild 192 × 128 (doppelte Auflösung): so groß wie die Riff-Fische (96 × 64 bei 0,34)
const WAG_FRAMES = 4; // je Bild so viele Bilder mit wackelnder Schwanzflosse (tools/fish-wag.cjs)
const WAG_RATE = [1.6, 4];

export default class AngelFish extends ReefFish {
  constructor(scene, x, y, variant) {
    super(scene, x, y, 0, null, 'fish');
    this.variant = variant === 1 ? 1 : 0;
    this.shadow.setVisible(false);
  }

  big() {
    return this.variant === 1;
  }

  // im Eimer (sitzt unsichtbar bei Henrik, siehe followGap in GardenScene); im Expeditions-Camp im Beutel im Käfig
  inBucket() {
    return this.state === 'following' && !this.campBag;
  }

  swimFrame() {
    return fishFrame(this.skin) * 2 + (this.faceX > 0 ? 0 : 1);
  }

  canBeCaughtNow() {
    return false;
  }

  shouldFlee() {
    return false;
  }

  render(moving) {
    if (this.campBag) return super.render(moving); // Beutel (ReefFish)
    if (this.inBucket()) {
      this.sprite.setVisible(false);
      this.shadow.setVisible(false);
      return;
    }
    const look = this.scene.textures.exists('freshfish_swim') ? 'freshfish_swim' : 'freshfish';
    if (this.sprite.texture.key !== look) this.sprite.stop().setTexture(look).setOrigin(0.5, 0.5).setFlipX(false);
    const rate = WAG_RATE[0] + (WAG_RATE[1] - WAG_RATE[0]) * Math.min(1, (this.moveSpeed ?? 0) / 40);
    this.wagT = (this.wagT ?? Math.random()) + (this.scene.game.loop.delta / 1000) * rate;
    const frame = look === 'freshfish_swim' ? this.swimFrame() * WAG_FRAMES + (Math.floor(this.wagT * WAG_FRAMES) % WAG_FRAMES) : this.swimFrame();
    this.sprite.setFrame(frame).setVisible(true).setAngle(0);
    this.sprite.setScale(TANK_SCALE * (this.big() ? BIG_SCALE : 1) * this.babyScale());
    const bob = Math.sin(this.phase * 2.2 + this.offset.x) * 1.5;
    this.sprite.setPosition(this.x, this.y - this.h + bob);
    this.sprite.setDepth(this.y + 0.5); // zwischen Rückwand und vorderer Glasscheibe (wie die Riff-Fische)
    this.shadow.setVisible(false);
  }
}
