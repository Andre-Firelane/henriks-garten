// Kanu im Dschungel: liegt an einem Steg (Ŝ). Steht Henrik am Steg daneben, steigt er mit der Aktionstaste ein und
// paddelt über den Fluss (das Kanu fährt nur auf Wasser, siehe isBoatBlockedPoint); an einem anderen Steg steigt er
// wieder aus, das Kanu bleibt dort liegen. Tiere, die ihm folgen, sitzen solange unsichtbar mit im Boot (siehe GardenScene).
// Wo das Kanu liegt und ob Henrik darin sitzt, steht in game.boat (überdauert Wetterwechsel und Gebietswechsel).
import { game } from '../state.js';
import { tileToWorld, worldToTile } from './iso.js';
import { LEVEL, LEVEL_ID, charAt } from './map.js';
import { pixelAlpha } from './hd.js';

const BOARD_DIST = 40; // so nah muss man (auf dem Steg) am Kanu stehen, um einzusteigen
const LAND_DIST = 12; // so nah muss das Kanu an einem Steg sein, um auszusteigen (direkt dran, sonst steigt man beim Fangen aus Versehen aus)
const BOB = 1.2; // so weit schaukelt es auf dem Wasser
const PADDLE_VOLUME = 0.45; // Paddeln (Kanu.mp3), solange Henrik im Kanu fährt
const PADDLE_EASE = 5; // so schnell wird es lauter bzw. leiser
const CANOE_ORIGIN_Y = 148 / 152; // Fuß des Bilds (Unterkante des Rumpfs) ...
const CANOE_DOWN = 14; // ... liegt so weit unter Henriks Platz, damit das Boot um ihn herum liegt
// Bilder der Kanus (leer und mit Henrik darin) je Blickrichtung wie bei der Spielfigur
const FRAME = { downRight: 0, downLeft: 1, upRight: 2, upLeft: 3 };
// Henrik paddelt (Videos): beim Fahren nach unten bzw. oben, nach links gespiegelt; im Stillstand das Standbild
const PADDLE_ANIMS = { down: 'canoe_paddle_anim', up: 'canoe_paddle_anim_back' };
// Piranha-Box hinten im Kanu, sobald ein Piranha mitfährt: Versatz [x, y] vom Kanu (Unterkante der Box, nach rechts
// blickend; nach links gespiegelt) je Bild, damit sie im Heck auf dem Bootsboden steht, und Größe
const BOX_AT = { down: [-20, -36], up: [-14, -13], paddleDown: [-12, -32], paddleUp: [-14, -16] };
const BOX_SCALE = 0.22;
const GHOST_DEPTH = 99000; // die Kontur liegt über allem auf der Karte (unter Nacht, Wetter und Beschriftungen) ...
const GHOST_ALPHA = 0.55; // ... und scheint so durch Bäume und Pflanzen, die das Kanu verdecken (nur, wenn es verdeckt ist)
const GHOST_CHECK = 0.15; // so oft (Sekunden) wird geprüft, ob etwas das Kanu verdeckt

export default class Boat {
  constructor(scene) {
    this.scene = scene;
    const start = tileToWorld(LEVEL.boat.tx, LEVEL.boat.ty);
    if (game.boat?.level !== LEVEL_ID) game.boat = { level: LEVEL_ID, x: start.x, y: start.y, riding: false };
    this.state = game.boat;
    this.state.frame ??= FRAME.downRight;
    this.img = scene.add.sprite(this.state.x, this.state.y, 'canoe', this.state.frame).setOrigin(0.5, CANOE_ORIGIN_Y).setScale(0.5);
    this.ghost = scene.add.sprite(this.state.x, this.state.y, outlineTexture(scene, 'canoe'), this.state.frame).setOrigin(0.5, CANOE_ORIGIN_Y).setScale(0.5).setDepth(GHOST_DEPTH).setAlpha(0);
    this.hidden = false; // verdeckt gerade etwas das Kanu?
    this.checkIn = 0;
    outlineTexture(scene, 'canoe_hero');
    // auch für die Paddel-Animationen (gleich beim Start, sonst ruckelt es beim ersten Paddeln)
    for (const anim of Object.values(PADDLE_ANIMS)) {
      const tex = scene.anims.get(anim)?.frames[0]?.textureKey;
      if (tex) outlineTexture(scene, tex);
    }
    this.time = 0;
    this.paddle = null; // Geräusch beim Paddeln (wird beim ersten Mal nachgeladen)
    scene.events.once('shutdown', () => this.paddle?.destroy());
    this.box = scene.add.image(0, 0, 'piranha_box').setOrigin(0.5, 1).setScale(BOX_SCALE).setVisible(false);
    this.near = null; // 'board' (einsteigen möglich), { dock } (aussteigen möglich) oder null
    if (this.state.riding) {
      const p = scene.player;
      p.x = this.state.x;
      p.y = this.state.y;
      p.trail = [{ x: p.x, y: p.y }];
      p.setBoat(true);
    }
  }

  get riding() {
    return this.state.riding;
  }

  update(dt) {
    this.time += dt;
    const p = this.scene.player;
    if (this.state.riding) {
      this.state.x = p.x;
      this.state.y = p.y;
    }
    // Blickrichtung wie bei der Spielfigur; im Kanu sitzt Henrik (eigenes Bild statt Figur und leerem Kanu)
    if (this.state.riding) {
      this.state.frame = p.faceY > 0 ? (p.faceX < 0 ? FRAME.downLeft : FRAME.downRight) : p.faceX > 0 ? FRAME.upRight : FRAME.upLeft;
    }
    const key = this.state.riding ? 'canoe_hero' : 'canoe';
    const bob = Math.sin(this.time * 2.2) * BOB;
    const tilt = this.state.riding && p.moving ? Math.sin(this.time * 6) * 1.5 : 0; // paddelt
    const anim = this.state.riding && p.moving ? (p.faceY > 0 ? PADDLE_ANIMS.down : PADDLE_ANIMS.up) : null;
    if (anim && this.scene.anims.exists(anim)) {
      if (!this.img.anims.isPlaying || this.img.anims.currentAnim?.key !== anim) this.img.play(anim);
      this.img.setFlipX(p.faceX < 0);
    } else {
      this.img.stop();
      this.img.setFlipX(false).setTexture(key, this.state.frame);
    }
    this.img
      .setPosition(this.state.x, this.state.y + CANOE_DOWN + bob)
      .setAngle(anim ? 0 : tilt)
      .setDepth(this.state.y + (this.state.riding ? 0 : -0.3));
    // Kontur: genau das gerade gezeigte Bild (beim Paddeln das Bild der Animation, gespiegelt wie das Kanu)
    this.ghost
      .setTexture(outlineTexture(this.scene, this.img.texture.key), this.img.frame.name)
      .setOrigin(this.img.originX, this.img.originY)
      .setFlipX(this.img.flipX)
      .setPosition(this.img.x, this.img.y)
      .setAngle(this.img.angle);
    this.checkIn -= dt;
    if (this.checkIn <= 0) {
      this.checkIn = GHOST_CHECK;
      this.hidden = this.covered();
    }
    const target = this.hidden ? GHOST_ALPHA : 0;
    this.ghost.setAlpha(this.ghost.alpha + (target - this.ghost.alpha) * Math.min(1, dt * 8));
    // gefangene Piranhas fahren in einer Box hinten im Kanu mit (sie selbst sind dann nicht zu sehen, siehe Piranha.js)
    const piranhas = this.state.riding && this.scene.followers?.some((a) => a.species === 'piranha');
    this.box.setVisible(!!piranhas);
    if (piranhas) {
      const down = p.faceY > 0;
      const [bx, by] = BOX_AT[anim ? (down ? 'paddleDown' : 'paddleUp') : down ? 'down' : 'up'];
      this.box
        .setPosition(this.img.x + p.faceX * bx, this.img.y + by)
        .setFlipX(p.faceX < 0)
        .setAngle(this.img.angle)
        .setDepth(this.img.depth + 0.05); // im Boot (Henrik und Kanu sind ein Bild: die Box liegt obenauf)
    }
    // das getragene Werkzeug (z. B. der Kescher) hält Henrik auch im Kanu in der Hand: vor dem Boot gezeichnet
    if (this.state.riding) this.scene.tool?.sprite?.setDepth(this.img.depth + 0.2);
    if (this.state.riding) p.boatBob = bob;
    this.updatePaddle(dt, this.state.riding && p.moving);
    // Aktion in der Nähe?
    let near = null;
    if (this.state.riding) {
      const dock = this.dockNear(p.x, p.y);
      if (dock) near = { dock };
    } else {
      const { tx, ty } = worldToTile(p.x, p.y);
      if (charAt(tx, ty) === 'Ŝ' && Math.hypot(p.x - this.state.x, (p.y - this.state.y) * 2) < BOARD_DIST * 1.6) near = 'board';
    }
    const changed = (near === 'board') !== (this.near === 'board') || !!near?.dock !== !!this.near?.dock;
    this.near = near;
    return changed;
  }

  // Liegt ein Baum, Busch o. Ä. über dem Kanu? Ein paar Punkte des Kanus werden gegen die sichtbaren Pixel der Bilder
  // davor geprüft (nicht nur ihr Rechteck, das ist bei Bäumen viel größer als der Baum)
  covered() {
    const b = this.img.getBounds();
    const pts = [];
    for (const fx of [0.3, 0.5, 0.7]) for (const fy of [0.4, 0.6, 0.8]) pts.push([b.x + b.width * fx, b.y + b.height * fy]);
    return this.scene.cullables.some((o) => {
      if (!o.visible || o.depth <= this.img.depth || o.depth >= GHOST_DEPTH || !o.frame) return false;
      const ob = o.getBounds();
      if (ob.right < b.x || ob.x > b.right || ob.bottom < b.y || ob.y > b.bottom) return false;
      return pts.some(([px, py]) => {
        if (px < ob.x || px > ob.right || py < ob.y || py > ob.bottom) return false;
        let lx = (px - ob.x) / Math.abs(o.scaleX);
        const ly = (py - ob.y) / Math.abs(o.scaleY);
        if (o.flipX) lx = o.frame.width - lx;
        return (pixelAlpha(this.scene, Math.floor(lx), Math.floor(ly), o.texture.key, o.frame.name) ?? 0) > 128;
      });
    });
  }

  // Paddeln: hörbar, solange Henrik im Kanu fährt, sonst leise ausblenden
  updatePaddle(dt, on) {
    const scene = this.scene;
    const key = 'canoe_paddle';
    if (!scene.cache.audio.exists(key)) {
      if (on && !this.paddleLoading) {
        this.paddleLoading = true;
        scene.load.audio(key, `assets/sounds/${key}.mp3`);
        scene.load.start();
      }
      return;
    }
    if (!this.paddle) {
      if (!on) return;
      this.paddle = scene.sound.add(key, { loop: true, volume: 0 });
      this.paddle.play();
    }
    const target = on ? PADDLE_VOLUME : 0;
    const v = this.paddle.volume + (target - this.paddle.volume) * Math.min(1, dt * PADDLE_EASE);
    this.paddle.setVolume(v < 0.005 ? 0 : v);
  }

  // nächste Stegkachel, an der man aussteigen kann
  dockNear(x, y) {
    const { tx, ty } = worldToTile(x, y);
    let best = null;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (charAt(tx + dx, ty + dy) !== 'Ŝ') continue;
        const c = tileToWorld(tx + dx, ty + dy);
        const d = Math.hypot(x - c.x, (y - c.y) * 2) - 32;
        if (d < LAND_DIST * 1.6 && (!best || d < best.d)) best = { tx: tx + dx, ty: ty + dy, d, ...c };
      }
    }
    return best;
  }

  board() {
    const p = this.scene.player;
    this.state.riding = true;
    p.x = this.state.x;
    p.y = this.state.y;
    p.trail = [{ x: p.x, y: p.y }];
    p.setBoat(true);
  }

  land() {
    const dock = this.near?.dock;
    if (!dock) return;
    const p = this.scene.player;
    this.state.riding = false;
    p.setBoat(false);
    p.x = dock.x;
    p.y = dock.y;
    p.trail = [{ x: p.x, y: p.y }];
  }
}

// Kontur eines Bilds (heller Rand außen um alles Sichtbare), einmal erzeugt und gemerkt; mit denselben Einzelbildern
// wie das Spritesheet (auch die Bildstreifen der Animationen)
function outlineTexture(scene, key) {
  const out = `${key}_outline`;
  if (scene.textures.exists(out)) return out;
  const sheet = scene.textures.get(key);
  const src = sheet.getSourceImage();
  const w = src.width;
  const h = src.height;
  const tex = scene.textures.createCanvas(out, w, h);
  const ctx = tex.getContext();
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img.data[(y * w + x) * 4 + 3]);
  const res = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (a(x, y) > 100) continue;
      if (a(x - 1, y) > 100 || a(x + 1, y) > 100 || a(x, y - 1) > 100 || a(x, y + 1) > 100 || a(x - 2, y) > 100 || a(x + 2, y) > 100) {
        const i = (y * w + x) * 4;
        res.data[i] = 255;
        res.data[i + 1] = 244;
        res.data[i + 2] = 200;
        res.data[i + 3] = 255;
      }
    }
  }
  ctx.clearRect(0, 0, w, h);
  ctx.putImageData(res, 0, 0);
  for (const name of sheet.getFrameNames()) {
    const f = sheet.get(name);
    tex.add(name, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight);
  }
  tex.refresh();
  return out;
}
