// Wolfsnacht (Event im Wald): es ist dunkel, nur um Henrik leuchtet seine Laterne, der Rest liegt im Mondlicht. Wolfsrudel
// ruhen auf Lichtungen; zu ihnen führen leuchtende Pfotenspuren. Das Rudel spielt "Ochs am Berg": heulen die Wölfe (Kopf
// hoch, Augen zu), darf man sich bewegen. Hören sie auf und schauen sich um, muss man stillstehen – wer sich dann in ihrer
// Nähe bewegt, wird gesehen, und das Rudel rennt davon und sucht sich eine neue Lichtung. Wer einen Wolf erreicht und
// berührt, hat ihn gefangen; die anderen rennen davon. Während der Wolfsnacht gibt es im Wald keine anderen Tiere.
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { MAP_W, MAP_H, isBlocked, inPen } from '../world/map.js';
import { tr } from '../i18n.js';

const PACKS = 2; // so viele Rudel sind unterwegs
const PACK_SIZE = [3, 4];
const HOWL_TIME = [3, 4.5]; // so lange heulen sie (dann darf man laufen)
const WATCH_TIME = [3, 6]; // so lange schauen sie sich um (dann stillstehen!)
const WATCH_DIST = 210; // so weit sehen sie einen, der sich bewegt (Kachel-Proportionen, y doppelt)
const PACK_RADIUS = 34; // so weit verteilen sich die Wölfe um die Mitte ihrer Lichtung
const FAR_FROM_PLAYER = 9; // neue Lichtungen mindestens so viele Kacheln vom Spieler entfernt
const RUN_TIME = 1.6; // so lange rennen sie erschrocken davon, dann ziehen sie auf eine neue Lichtung
const TRACK_STEPS = 18; // so viele Pfotenabdrücke führen zur Lichtung
const TRACK_STEP = 0.75; // Abstand der Abdrücke (Kacheln)
const TRACK_SEE = 150; // so nah muss die Laterne sein, damit ein Abdruck hell leuchtet
const SCALE = 0.58; // etwas größer als die anderen Tiere (0,5)
const HOWL_VOLUME = 0.55; // beim Rudel in der Nähe; weiter weg leiser
export const NIGHT_DEPTH = 99940; // Dunkelheit über allem auf der Karte (unter den Beschriftungen)

export default class Wolf extends Animal {
  constructor(scene, x, y) {
    super(scene, x, y, 'wolf');
    this.sprite.setScale(SCALE);
    this.pack = null;
    this.spot = null;
  }

  // im Rudel: so lange es nicht erschrocken ist, kann man einen Wolf berühren
  canBeCaughtNow() {
    return this.state === 'wild' && !!this.pack && !this.pack.running;
  }

  shouldFlee() {
    return false; // fliehen regelt das Rudel
  }

  // von catchAnimal (Herde): die anderen rennen vor Schreck davon
  scatter() {
    this.pack?.spook();
  }

  updateFree(dt, player) {
    if (this.state !== 'wild' || !this.pack) return super.updateFree(dt, player);
    const p = this.pack;
    if (p.running) {
      // weg vom Spieler
      const a = Math.atan2(this.y - player.y, this.x - player.x);
      const step = this.kind.fleeSpeed * dt;
      for (const turn of [0, 0.6, -0.6, 1.2, -1.2]) if (this.move(Math.cos(a + turn) * step, Math.sin(a + turn) * step)) return true;
      return false;
    }
    // auf der Lichtung: ab und zu ein paar Schritte, beim Umschauen zum Spieler hin
    if (p.phase === 'watch') {
      this.faceX = Math.sign(player.x - this.x) || this.faceX;
      this.faceY = Math.sign(player.y - this.y) || this.faceY;
      return false;
    }
    if (p.phase === 'howl') return false;
    this.wanderTime -= dt;
    if (!this.spot || this.wanderTime <= 0) {
      const a = Math.random() * Math.PI * 2;
      this.spot = { x: p.x + Math.cos(a) * PACK_RADIUS * Math.random(), y: p.y + Math.sin(a) * PACK_RADIUS * 0.5 * Math.random() };
      this.wanderTime = Phaser.Math.FloatBetween(2, 5);
    }
    const dx = this.spot.x - this.x;
    const dy = this.spot.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return false;
    const step = Math.min(d, this.kind.speed * dt);
    return this.move((dx / d) * step, (dy / d) * step);
  }

  render(moving) {
    // heulend bzw. fressend (beim Ruhen) mit eigenem Bild (schwarzer Wolf: wolf2_howl, wolf2_eat)
    const base = this.skin ?? 'wolf';
    const pose = this.state === 'wild' && this.pack && !this.pack.running ? (this.pack.phase === 'howl' ? `${base}_howl` : this.pack.phase === 'rest' && this.eats ? `${base}_eat` : null) : null;
    super.render(moving);
    // erst danach: die Grundlage setzt sonst wieder das Laufbild
    if (pose && this.sprite.texture.key !== pose) this.sprite.setTexture(pose, this.sprite.frame.name);
    else if (!pose && this.sprite.texture.key.endsWith('_howl')) this.sprite.setTexture(this.lookTexture(), this.sprite.frame.name);
  }
}

// Ein Rudel auf seiner Lichtung: gemeinsamer Takt aus Ruhen, Heulen und Umschauen
class Pack {
  constructor(night, tile) {
    this.night = night;
    this.scene = night.scene;
    this.members = [];
    this.placeAt(tile);
  }

  placeAt(tile) {
    const c = tileToWorld(tile.tx, tile.ty);
    this.x = c.x;
    this.y = c.y;
    this.tile = tile;
    this.running = false;
    this.setPhase('rest', Phaser.Math.FloatBetween(1, 3));
    this.night.layTracks(this);
  }

  setPhase(phase, time) {
    this.phase = phase;
    this.time = time;
    this.night.showSign(this);
    if (phase === 'howl') this.night.howl(this);
  }

  // gesehen oder einer wurde gefangen: alle rennen davon und ziehen danach auf eine neue Lichtung
  spook() {
    if (this.running) return;
    this.running = true;
    this.time = RUN_TIME;
    this.night.showSign(this);
  }

  update(dt) {
    this.members = this.members.filter((w) => w.state === 'wild' && this.scene.animals.includes(w));
    this.time -= dt;
    if (this.running) {
      if (this.time > 0) return;
      // neue Lichtung, die Wölfe sind schon dort
      const tile = this.night.clearing();
      this.placeAt(tile);
      for (const w of this.members) {
        w.x = this.x + Phaser.Math.Between(-PACK_RADIUS, PACK_RADIUS) * 0.6;
        w.y = this.y + Phaser.Math.Between(-PACK_RADIUS, PACK_RADIUS) * 0.3;
        w.spot = null;
      }
      return;
    }
    // Ochs am Berg: beim Umschauen darf sich in der Nähe niemand bewegen
    if (this.phase === 'watch') {
      const p = this.scene.player;
      if (p.moving && Math.hypot(p.x - this.x, (p.y - this.y) * 2) < WATCH_DIST) {
        this.spook();
        this.scene.wolvesSawYou?.();
        return;
      }
    }
    if (this.time > 0) return;
    if (this.phase === 'howl') this.setPhase('watch', Phaser.Math.FloatBetween(...WATCH_TIME));
    else this.setPhase('howl', Phaser.Math.FloatBetween(...HOWL_TIME));
  }
}

// Steuerung der Wolfsnacht im Wald: Dunkelheit mit Laternenlicht, Rudel, Spuren, Geheul
export class WolfNight {
  constructor(scene) {
    this.scene = scene;
    this.packs = [];
    this.tracks = [];
    this.signs = new Map();
    // Dunkelheit: großes Bild mit durchsichtigem Kreis in der Mitte, folgt dem Spieler (die Laterne leuchtet)
    this.dark = scene.add.image(0, 0, nightTexture(scene)).setScale(2.2).setDepth(NIGHT_DEPTH);
    this.lantern = scene.add.image(0, 0, 'lantern').setScale(0.4).setDepth(NIGHT_DEPTH + 2);
    this.glow = scene.add.image(0, 0, glowTexture(scene)).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc860).setAlpha(0.45).setScale(1.6).setDepth(NIGHT_DEPTH + 1);
    // im Wald gibt es währenddessen keine anderen Tiere
    for (const a of [...scene.animals]) if (a.state === 'wild' && a.species !== 'wolf') scene.despawn(a);
    for (let i = 0; i < PACKS; i++) this.addPack();
  }

  // freie Kachel weit weg vom Spieler und von den anderen Rudeln, nicht im Gehege
  clearing() {
    const p = worldToTile(this.scene.player.x, this.scene.player.y);
    for (let i = 0; i < 200; i++) {
      const tx = Phaser.Math.Between(2, MAP_W - 3);
      const ty = Phaser.Math.Between(2, MAP_H - 3);
      if (isBlocked(tx, ty) || inPen(tx, ty)) continue;
      if (Math.hypot(tx - p.tx, ty - p.ty) < FAR_FROM_PLAYER) continue;
      if (this.packs.some((k) => k.tile && Math.hypot(k.tile.tx - tx, k.tile.ty - ty) < 6)) continue;
      return { tx, ty };
    }
    return { tx: Phaser.Math.Between(2, MAP_W - 3), ty: Phaser.Math.Between(2, MAP_H - 3) };
  }

  addPack() {
    const pack = new Pack(this, this.clearing());
    this.packs.push(pack);
    const n = Phaser.Math.Between(...PACK_SIZE);
    for (let i = 0; i < n; i++) {
      const w = this.scene.createAnimal('wolf', pack.x + Phaser.Math.Between(-PACK_RADIUS, PACK_RADIUS) * 0.6, pack.y + Phaser.Math.Between(-PACK_RADIUS, PACK_RADIUS) * 0.3);
      w.pack = pack;
      w.herd = pack; // beim Fangen rennen die anderen davon (siehe scatter)
      w.life = Infinity;
      w.eats = Math.random() < 0.5; // beim Ruhen frisst etwa die Hälfte
      // schwarze Wölfe kommen nur als ganzes Rudel: gewürfelt wird beim ersten, die anderen sehen genauso aus
      if (i === 0) w.rollSkin('wild');
      else w.skin = pack.members[0].skin;
      pack.members.push(w);
    }
  }

  // Pfotenspur: von der Lichtung aus in einem leicht geschwungenen Weg nach draußen (zeigt zum Rudel)
  layTracks(pack) {
    for (const t of pack.trackSprites ?? []) t.destroy();
    pack.trackSprites = [];
    let a = Math.random() * Math.PI * 2;
    let { tx, ty } = pack.tile;
    const pts = [];
    for (let i = 0; i < TRACK_STEPS; i++) {
      a += Phaser.Math.FloatBetween(-0.4, 0.4);
      const nx = tx + Math.cos(a) * TRACK_STEP;
      const ny = ty + Math.sin(a) * TRACK_STEP;
      if (isBlocked(Math.round(nx), Math.round(ny))) {
        a += Math.PI / 2;
        continue;
      }
      tx = nx;
      ty = ny;
      pts.push({ tx, ty, a });
    }
    pts.forEach(({ tx, ty, a }, i) => {
      const p = tileToWorld(tx, ty);
      // Abdrücke zeigen zur Lichtung hin (entgegen der Wegrichtung), abwechselnd links und rechts
      const side = i % 2 ? 4 : -4;
      const img = this.scene.add.image(p.x + Math.cos(a + Math.PI / 2) * side, p.y + Math.sin(a + Math.PI / 2) * side * 0.5, pawTexture(this.scene));
      img.setRotation(a + Math.PI + Math.PI / 2).setScale(0.5, 0.3).setDepth(NIGHT_DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
      pack.trackSprites.push(img);
    });
  }

  // Zeichen über dem Rudel: heulen (laufen erlaubt) bzw. Augen (stillstehen!)
  showSign(pack) {
    let t = this.signs.get(pack);
    if (!t) {
      t = this.scene.add.text(0, 0, '', { fontFamily: 'Trebuchet MS, Arial', fontSize: '13px', fontStyle: 'bold', color: '#fff8e6', stroke: '#1a2040', strokeThickness: 3, resolution: 4 }).setOrigin(0.5).setDepth(NIGHT_DEPTH + 3);
      this.signs.set(pack, t);
    }
    t.setText(pack.running ? '💨' : pack.phase === 'howl' ? tr('Auuuu ♪', 'Awooo ♪') : pack.phase === 'watch' ? '👀' : '');
  }

  // Geheul: je näher das Rudel, desto lauter
  howl(pack) {
    const scene = this.scene;
    if (!scene.cache.audio.exists('wolf_howl')) return;
    const d = Math.hypot(scene.player.x - pack.x, (scene.player.y - pack.y) * 2);
    const volume = HOWL_VOLUME * Phaser.Math.Clamp(1 - d / 900, 0.15, 1);
    scene.sound.play('wolf_howl', { volume, detune: Phaser.Math.Between(-150, 150) });
  }

  update(dt) {
    const p = this.scene.player;
    this.dark.setPosition(p.x, p.y - 20);
    const hand = { x: p.x + p.faceX * 11, y: p.sprite.y - 16 };
    this.lantern.setPosition(hand.x, hand.y);
    this.glow.setPosition(hand.x, hand.y).setAlpha(0.4 + Math.sin(this.scene.time.now / 180) * 0.04);
    for (const pack of this.packs) {
      pack.update(dt);
      this.signs.get(pack)?.setPosition(pack.x, pack.y - 52);
      // Spuren leuchten hell, wenn die Laterne nah ist, sonst nur schwach
      for (const t of pack.trackSprites) {
        const d = Math.hypot(t.x - p.x, (t.y - p.y) * 2);
        t.setAlpha(d < TRACK_SEE ? 1 - (d / TRACK_SEE) * 0.6 : 0.12);
      }
    }
    // gefangene oder leere Rudel ersetzen
    for (const pack of [...this.packs]) {
      if (pack.members.length) continue;
      for (const t of pack.trackSprites) t.destroy();
      this.signs.get(pack)?.destroy();
      this.signs.delete(pack);
      this.packs.splice(this.packs.indexOf(pack), 1);
      this.addPack();
    }
    // andere Tiere (z. B. ein Reiher, der doch noch einfliegt) gibt es in dieser Nacht nicht
    for (const a of [...this.scene.animals]) if (a.state === 'wild' && a.species !== 'wolf') this.scene.despawn(a);
  }

  // Event vorbei: es wird wieder hell, die Wölfe sind fort
  destroy() {
    for (const a of [...this.scene.animals]) if (a.species === 'wolf' && a.state === 'wild') this.scene.despawn(a);
    for (const pack of this.packs) for (const t of pack.trackSprites) t.destroy();
    for (const t of this.signs.values()) t.destroy();
    this.dark.destroy();
    this.lantern.destroy();
    this.glow.destroy();
  }
}

// Nacht: dunkles Mondlicht-Blau, in der Mitte ein weicher, heller Kreis (das Licht der Laterne)
function nightTexture(scene) {
  const key = 'night_lantern';
  if (scene.textures.exists(key)) return key;
  const size = 1024;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, 16, size / 2, size / 2, 70);
  g.addColorStop(0, 'rgba(6,12,36,0)');
  g.addColorStop(0.5, 'rgba(6,12,36,0.45)');
  g.addColorStop(1, 'rgba(6,12,36,0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}

function glowTexture(scene) {
  const key = 'lantern_glow';
  if (scene.textures.exists(key)) return key;
  const size = 64;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}

// leuchtender Pfotenabdruck (Ballen und vier Zehen), zeigt nach oben
function pawTexture(scene) {
  const key = 'wolf_paw';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 24, 24);
  const ctx = tex.getContext();
  ctx.fillStyle = 'rgba(170,230,255,0.95)';
  ctx.beginPath();
  ctx.ellipse(12, 15, 5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [x, y] of [[6, 9], [10, 6], [14, 6], [18, 9]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, 2, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  tex.refresh();
  return key;
}
