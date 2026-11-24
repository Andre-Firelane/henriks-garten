// Angel (Dschungel, Regenzeit): Piranhas vom Kanu aus fangen. Aktionstaste nah an einem Piranha-Schwarm: die Schnur
// fliegt zum Schwarm, die rot-weiße Pose dümpelt. Nach einer Weile beißt einer an – die Pose zuckt unter, "!" darüber.
// Jetzt schnell noch einmal drücken: ein Piranha hängt dran (einer pro Biss). Zu früh oder zu spät: Köder weg.
// Aus einem Schwarm fängt man höchstens PER_SCHOOL, danach taucht der Rest ab (ein neuer Schwarm kommt woanders).
// Angeln vom Ufer (docs/plan-angeln.md): nah an einem Fischschatten (FishShadows.js) auswerfen. Beißt einer an, hat man
// Zeit (FISH_BITE); zu früh drücken macht nichts, zu spät heißt nur: er ist weg, die Pose dümpelt weiter bis zum nächsten
// Biss. Welche Art es ist, zeigt sich erst beim Herausholen (rollFish), die Größe sieht man am Schatten.
import Phaser from 'phaser';
import { tr } from '../i18n.js';
import { BIG_SCALE, biteWait, fishFrame, fishKind, rollFish } from '../world/fishing.js';
import { worldToTile } from '../world/iso.js';

const REACH = 90; // so nah (Welt-Pixel) muss der Schwarm am Kanu sein
const WAIT = [1.5, 4]; // so lange dümpelt die Pose, bis einer anbeißt
const BITE = 0.9; // so lange hat man Zeit zum Anschlagen
const CAST_TIME = 0.35; // so lange fliegt die Schnur
const LOSE_DIST = 140; // fährt das Kanu weiter weg, reißt die Schnur ab
const PER_SCHOOL = 2; // so viele Piranhas lassen sich aus einem Schwarm angeln, dann taucht der Rest ab
const FISH_REACH = 110; // so weit wirft man vom Ufer nach einem Fischschatten aus
const FISH_BITE = 3.5; // so lange darf man sich mit dem Herausholen Zeit lassen
const FISH_LOSE = 170; // läuft man weiter weg, holt man die Schnur ein

// Bild eines Angelfischs als <img> (aus dem Spritesheet freshfish ausgeschnitten, je Art einmal)
const fishPics = {};
function fishImageHtml(scene, skin) {
  if (!fishPics[skin]) {
    const tex = scene.textures.get('freshfish');
    const fr = tex.get(fishFrame(skin) * 2);
    const c = document.createElement('canvas');
    c.width = fr.cutWidth;
    c.height = fr.cutHeight;
    c.getContext('2d').drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
    fishPics[skin] = c.toDataURL();
  }
  return `<img src="${fishPics[skin]}" alt="" style="width:120px;height:80px">`;
}

export default class RodTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'rod').setOrigin(6 / 64, 58 / 64).setScale(0.5);
    this.line = scene.add.graphics();
    this.bobber = scene.add.container(0, 0).setVisible(false);
    this.bobber.add([scene.add.circle(0, 0, 2.6, 0xe8423a).setStrokeStyle(1, 0x2b1d14), scene.add.circle(0, 2.4, 2.2, 0xffffff).setStrokeStyle(1, 0x2b1d14)]);
    this.alert = scene.add.text(0, 0, '!', { fontFamily: 'Trebuchet MS, Arial', fontSize: '18px', fontStyle: 'bold', color: '#ffd84a', stroke: '#3a2414', strokeThickness: 4, resolution: 4 }).setOrigin(0.5, 1).setVisible(false);
    this.state = null; // null | { phase: 'cast' | 'wait' | 'bite', time, school, x, y }
  }

  // Spitze der Rute (dort hängt die Schnur)
  tip() {
    const p = this.player;
    return { x: p.x + p.faceX * 20, y: p.sprite.y - 40 - p.handLift };
  }

  // nächster Piranha-Schwarm in Reichweite des Kanus
  nearSchool() {
    const p = this.player;
    let best = null;
    for (const a of this.scene.animals) {
      if (a.species !== 'piranha' || a.state !== 'wild' || !a.school?.members.length) continue;
      const d = Math.hypot(a.school.x - p.x, (a.school.y - p.y) * 2);
      if (d < REACH && (!best || d < best.d)) best = { s: a.school, d };
    }
    return best?.s ?? null;
  }

  use() {
    const scene = this.scene;
    if (this.state?.shadow) return this.useShore();
    // vom Kanu aus an einem Piranha-Schwarm wie bisher, sonst nach einem Fischschatten
    if (!(scene.boat?.riding && this.nearSchool()) && scene.fishShadows?.list.length) return this.useShore();
    if (!scene.boat?.riding) {
      scene.showToast(tr('🎣 Angle vom Kanu aus – dort, wo im Fluss die dunklen Schatten wirbeln.', '🎣 Fish from the canoe – where the dark shadows swirl in the river.'));
      return;
    }
    const st = this.state;
    if (st?.phase === 'bite') return this.land();
    if (st) return this.lose(tr('🎣 Zu früh! Der Köder ist weg – wirf noch einmal aus.', '🎣 Too early! The bait is gone – cast again.'));
    const school = this.nearSchool();
    if (!school) {
      scene.showToast(tr('🎣 Hier beißt nichts. Fahr näher an die wirbelnden Schatten im Fluss.', '🎣 Nothing bites here. Paddle closer to the swirling shadows in the river.'));
      return;
    }
    this.state = { phase: 'cast', time: CAST_TIME, school, x: school.x, y: school.y };
  }

  // Fischschatten: auswerfen, herausholen (zu früh drücken macht nichts)
  useShore() {
    const scene = this.scene;
    const st = this.state;
    if (st?.phase === 'bite') return this.landFish();
    if (st) return;
    const p = this.player;
    const f = scene.fishShadows.nearest(p.x, p.y, FISH_REACH);
    if (!f) {
      scene.showToast(tr('🎣 Geh näher an einen Fischschatten im Wasser.', '🎣 Get closer to a fish shadow in the water.'));
      return;
    }
    f.hooked = true;
    this.state = { phase: 'cast', time: CAST_TIME, shadow: f, x: f.x, y: f.y };
  }

  // Herausholen: jetzt zeigt sich, welcher Fisch es ist
  landFish() {
    const scene = this.scene;
    const f = this.state.shadow;
    this.state.shadow = null; // (reset gibt die Stelle sonst frei, take macht das selbst)
    this.reset();
    const { tx, ty } = worldToTile(f.x, f.y);
    const skin = rollFish(tx, ty);
    scene.fishShadows.take(f); // im Schwarm bleibt der Rest
    this.splash(f.x, f.y);
    const a = scene.createAnimal('fish', f.x, f.y, f.big ? 1 : 0);
    a.skin = skin;
    a.restore('wild');
    scene.catchAnimal(a);
    if (a.state !== 'following') {
      scene.despawn(a);
      return;
    }
    // der Fisch fliegt aus dem Wasser zu Henrik, darüber sein Name
    const p = this.player;
    const img = scene.add.image(f.x, f.y, 'freshfish', fishFrame(skin) * 2 + (p.x < f.x ? 1 : 0)).setScale(0.2 * (f.big ? BIG_SCALE : 1)).setDepth(100000);
    scene.tweens.add({ targets: img, x: p.x, y: p.sprite.y - 30, duration: 520, ease: 'Quad.easeOut', onComplete: () => scene.tweens.add({ targets: img, alpha: 0, scale: 0.08, delay: 350, duration: 250, onComplete: () => img.destroy() }) });
    const k = fishKind(skin);
    const size = f.big ? tr(k.male ? 'Großer ' : 'Große ', 'Big ') : '';
    const name = f.big ? k.name : k.name.charAt(0).toUpperCase() + k.name.slice(1);
    // Erfolgstafel wie bei einem erfüllten Wunsch, mit dem Bild des Fischs (nachdem er bei Henrik angekommen ist)
    scene.time.delayedCall(450, () => {
      const box = document.getElementById('success');
      if (!box) return;
      box.innerHTML = `<b>${size}${name}!</b><span>${fishImageHtml(scene, skin)}</span>`;
      box.classList.remove('show');
      void box.offsetWidth; // Animation neu starten
      box.classList.add('show');
    });
  }

  // Anschlagen im richtigen Moment: einer aus dem Schwarm hängt dran
  land() {
    const scene = this.scene;
    const school = this.state.school;
    const fish = school.members.find((a) => a.state === 'wild');
    this.reset();
    if (!fish) return;
    this.splash(fish.x, fish.y);
    scene.catchAnimal(fish);
    school.caught = (school.caught ?? 0) + 1;
    if (school.caught < PER_SCHOOL) return;
    // der Rest des Schwarms taucht ab
    for (const a of school.members.filter((m) => m.state === 'wild')) scene.despawn(a);
    school.members.length = 0;
  }

  lose(text) {
    if (this.state) this.splash(this.state.x, this.state.y);
    this.reset();
    this.scene.showToast(text);
  }

  reset() {
    if (this.state?.shadow) this.state.shadow.hooked = false;
    this.state = null;
    this.bobber.setVisible(false);
    this.alert.setVisible(false);
    this.line.clear();
  }

  splash(x, y) {
    for (let i = 0; i < 6; i++) {
      const d = this.scene.add.circle(x, y, Phaser.Math.FloatBetween(1, 2), 0xd8f2ff, 0.9).setDepth(y + 1);
      this.scene.tweens.add({ targets: d, x: x + Phaser.Math.Between(-10, 10), y: y - Phaser.Math.Between(6, 14), alpha: 0, duration: 450, ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
  }

  update(dt) {
    const p = this.player;
    const t = this.tip();
    // Rute schräg in der Hand, Spitze in Blickrichtung
    const h = { x: p.x + p.faceX * 6, y: p.sprite.y - 14 - p.handLift };
    this.sprite.setPosition(h.x, h.y).setScale(0.5 * p.faceX, 0.5).setDepth(p.y + (p.faceY > 0 ? 0.2 : -0.2));
    const st = this.state;
    if (!st) return;
    if (st.shadow) return this.updateShore(dt, t);
    if (!this.scene.boat?.riding || Math.hypot(st.x - p.x, (st.y - p.y) * 2) > LOSE_DIST) return this.lose(tr('🎣 Die Schnur ist gerissen – du bist zu weit weggefahren.', '🎣 The line snapped – you paddled too far away.'));
    // ist der Schwarm weg (gefangen, verschwunden), gibt es nichts mehr zu angeln
    if (!st.school.members.some((a) => a.state === 'wild')) return this.reset();
    st.time -= dt;
    let bx = st.x;
    let by = st.y;
    let dip = 0;
    if (st.phase === 'cast') {
      const k = 1 - Math.max(0, st.time) / CAST_TIME;
      bx = t.x + (st.x - t.x) * k;
      by = t.y + (st.y - t.y) * k - Math.sin(k * Math.PI) * 18;
      if (st.time <= 0) {
        st.phase = 'wait';
        st.time = Phaser.Math.FloatBetween(...WAIT);
        this.splash(st.x, st.y);
      }
    } else if (st.phase === 'wait') {
      dip = Math.sin(this.scene.time.now / 300) * 0.8; // dümpelt
      if (st.time <= 0) {
        st.phase = 'bite';
        st.time = BITE;
        this.splash(st.x, st.y);
      }
    } else if (st.phase === 'bite') {
      dip = 3 + Math.sin(this.scene.time.now / 45) * 1.5; // zuckt unter
      if (st.time <= 0) return this.lose(tr('🎣 Zu spät! Der Piranha hat den Köder geklaut – wirf noch einmal aus.', '🎣 Too late! The piranha stole the bait – cast again.'));
    }
    this.bobber.setPosition(bx, by + dip).setDepth(by + 0.5).setVisible(true);
    this.alert.setPosition(bx, by - 10).setDepth(100000).setVisible(st.phase === 'bite');
    this.line.clear().setDepth(Math.max(p.y, by) + 0.4).lineStyle(1, 0xe8eef2, 0.9).lineBetween(t.x, t.y, bx, by + dip - 2);
  }

  // Pose am Fischschatten: dümpelt, zuckt beim Biss; zu spät: er ist weg, die Pose dümpelt weiter bis zum nächsten Biss
  updateShore(dt, t) {
    const st = this.state;
    const p = this.player;
    const f = st.shadow;
    if (f.gone || Math.hypot(f.x - p.x, (f.y - p.y) * 2) > FISH_LOSE) return this.reset();
    st.time -= dt;
    let bx = f.x;
    let by = f.y;
    let dip = 0;
    if (st.phase === 'cast') {
      const k = 1 - Math.max(0, st.time) / CAST_TIME;
      bx = t.x + (f.x - t.x) * k;
      by = t.y + (f.y - t.y) * k - Math.sin(k * Math.PI) * 18;
      if (st.time <= 0) {
        st.phase = 'wait';
        st.time = Phaser.Math.FloatBetween(...biteWait());
        this.splash(f.x, f.y);
      }
    } else if (st.phase === 'wait') {
      dip = Math.sin(this.scene.time.now / 300) * 0.8;
      if (st.time <= 0) {
        st.phase = 'bite';
        st.time = FISH_BITE;
        this.splash(f.x, f.y);
      }
    } else if (st.phase === 'bite') {
      dip = 3 + Math.sin(this.scene.time.now / 45) * 1.5;
      if (st.time <= 0) {
        st.phase = 'wait';
        st.time = Phaser.Math.FloatBetween(...biteWait());
        this.splash(f.x, f.y);
      }
    }
    this.bobber.setPosition(bx, by + dip).setDepth(by + 0.5).setVisible(true);
    this.alert.setPosition(bx, by - 10).setDepth(100000).setVisible(st.phase === 'bite');
    this.line.clear().setDepth(Math.max(p.y, by) + 0.4).lineStyle(1, 0xe8eef2, 0.9).lineBetween(t.x, t.y, bx, by + dip - 2);
  }

  // Die Angel fängt nicht im Vorbeigehen (nur beim Anschlagen, siehe land)
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
    this.line.destroy();
    this.bobber.destroy();
    this.alert.destroy();
  }
}
