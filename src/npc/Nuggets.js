// Mr. Nuggets, der Expeditionsleiter (docs/plan-npcs.md): steht in jedem Expeditions-Camp neben den Käfigen und erklärt
// bei der ersten Expedition die Mechaniken in kleinen Schritten, jeweils dann, wenn sie zum ersten Mal vorkommen:
//   camp  – Ankunft im ersten Camp: wie eine Expedition abläuft
//   cards – erste Kartenwahl (steht in der Kartenauswahl selbst, siehe cardTip; dazu feste Karten, firstRunCards)
//   wagon – erste Rückkehr mit Tieren: sie sitzen schon im Wagen (Pfeil im Wagen-Menü auf "Fertig")
//   full  – der Wagen ist zum ersten Mal voll (Pfeil im Wagen-Menü auf ein Tier, das im Camp bleibt)
//   home  – bei einem späteren Camp-Besuch: Heimfahrt jederzeit (Pfeil kurz über dem Auto, im Menü keiner)
// Dazu einmal je Welt, was dort besonders ist (BIOME_NOTES). Danach erklärt er nur auf Wunsch (antippen).
// Er bewegt sich nicht; Steh- und Wink-Animation kommen später, bis dahin ein Standbild, das leicht wippt.
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { tileToWorld } from '../world/iso.js';
import { ENCLOSURES, LEVEL, exitAt, isBlocked } from '../world/map.js';
import { RUN_LENGTH, isFinalCamp, run } from '../world/expedition.js';
import { isSpeaking, placeSpeech, say } from '../ui/speech.js';
import { saveNow } from '../save.js';

export const NAME = 'Mr. Nuggets';
const SPOT = { tx: 11, ty: 6 }; // zwischen Zelt und Käfigen (man kommt vor dem Zelt an)
const SPOT_SEARCH = 4;
const HEIGHT = 58; // Bildhöhe in der Welt (wie Mavi)
const SETTLE = 1300; // so lange nach dem Ankommen spricht er noch nicht (die Kamera blendet ein)
const TAP_DIST = 150;
const CAR_ARROW_MS = 6000; // so lange zeigt der Pfeil nach dem Heimfahrt-Hinweis aufs Auto
const STEPS = ['camp', 'cards', 'wagon', 'full', 'home'];

// womit man heimfährt (im Dschungel das Wasserflugzeug, in der Eiswelt das Schneemobil)
const vehicle = () => (LEVEL.car?.texture === 'seaplane' ? tr('mit dem Wasserflugzeug', 'by seaplane') : LEVEL.car?.texture === 'car_snow' ? tr('mit dem Schneemobil', 'by snowmobile') : tr('mit dem Auto', 'by car'));

// was in einer Welt besonders ist (einmal, bei der ersten Expedition dort)
const BIOME_NOTES = {
  savanna: () => tr('Hier gibt es manchmal eine Event-Karte: die Große Wanderung der Gnus.', 'Sometimes there is an event card here: the Great Migration of the wildebeest.'),
  jungle: () => tr('Hier gibt es manchmal eine Event-Karte: die Leuchtnacht mit bunten Fröschen.', 'Sometimes there is an event card here: the Glowing Night with colorful frogs.'),
  asia: () => tr('Hier gibt es manchmal eine Event-Karte: den Glühwürmchen-Abend mit roten Pandas.', 'Sometimes there is an event card here: the Firefly Evening with red pandas.'),
  forest: () => tr('Hier gibt es manchmal eine Event-Karte: die Wolfsnacht.', 'Sometimes there is an event card here: the Wolf Night.'),
  ice: () => tr('Hier ist es mal Tag, mal Nacht. ☀ oder 🌙 auf der Karte zeigt, welche Tiere du triffst.', 'Here it is sometimes day, sometimes night. ☀ or 🌙 on the card shows which animals you will meet.'),
};

const TEXTS = {
  camp: () => [
    tr(`Willkommen im Camp! Ich bin ${NAME}, ich leite die Expeditionen.`, `Welcome to the camp! I am ${NAME}, I lead the expeditions.`),
    LEVEL.canoe
      ? tr(`Eine Expedition führt durch ${RUN_LENGTH} kleine Gebiete. Am Kanu unten am Steg wählst du, wohin es geht.`, `An expedition leads through ${RUN_LENGTH} small areas. At the canoe by the dock you choose where to go.`)
      : tr(`Eine Expedition führt durch ${RUN_LENGTH} kleine Gebiete. Am Ausgang wählst du, wohin es geht.`, `An expedition leads through ${RUN_LENGTH} small areas. At the exit you choose where to go.`),
  ],
  wagon: () => [
    tr('Gut gemacht! Deine Tiere sitzen schon im Wagen, jede Art in ihrem Käfig.', 'Well done! Your animals are already in the wagon, each kind in its own cage.'),
    tr('Bei den Käfigen siehst du nach, wer mitkommt.', 'At the cages you can check who comes along.'),
  ],
  full: () => [tr('Der Wagen ist voll. Wer nicht hineinpasst, wird am Ende ausgewildert. Das bringt Herzen.', 'The wagon is full. Whoever does not fit is released at the end. That earns hearts.')],
  home: () => [tr(`Du kannst jederzeit ${vehicle()} heimfahren. Die Tiere im Wagen kommen mit, verlieren kannst du nichts.`, `You can go home ${vehicle()} any time. The animals in the wagon come along, you cannot lose anything.`)],
};

// Kurzfassung zum Wiederholen (antippen, "nochmal erklären")
const RECAP = () => [
  ...TEXTS.camp().slice(1),
  tr('Jede Karte zeigt, was dich dort erwartet: ein Tier, ein seltenes Tier, einen Bonus oder eine Kiste.', 'Each card shows what awaits you there: an animal, a rare animal, a bonus or a chest.'),
  tr('Gefangene Tiere kommen hier in den Wagen. Wer nicht hineinpasst, wird am Ende ausgewildert.', 'Caught animals go into the wagon here. Whoever does not fit is released at the end.'),
  ...TEXTS.home(),
];

const guide = () => (game.guide ??= { done: [], biomes: [] });
export const guideDone = (id) => guide().done.includes(id);
export function markGuide(id) {
  if (!guideDone(id)) guide().done.push(id);
}

// erste Kartenwahl überhaupt: Text und Empfehlung für die Kartenauswahl (sonst null)
export function cardTip() {
  if (guideDone('cards')) return null;
  return `<b>${NAME}:</b> ${tr('Jede Karte zeigt, was dich dort erwartet: ein Tier, einen Bonus oder eine Kiste. Nimm für den Anfang die Tierkarte!', 'Each card shows what awaits you there: an animal, a bonus or a chest. Take the animal card to start with!')}`;
}

export default class Nuggets {
  constructor(scene) {
    this.scene = scene;
    this.queue = []; // Schritte, die er bei diesem Camp-Besuch noch erklärt
    this.tips = new Set(); // Pfeile im Wagen-Menü ('wagon', 'full'), bis man es einmal geöffnet hat
    this.talkFrom = scene.time.now + SETTLE;
    this.anchored = false;
    this.place();
  }

  place() {
    const p = this.freeTile(SPOT);
    this.shadow = this.scene.add.ellipse(p.x, p.y, 26, 8, 0x14320a, 0.3).setDepth(p.y - 0.5);
    const tex = this.scene.textures.get('nuggets').getSourceImage();
    this.sprite = this.scene.add.image(p.x, p.y, 'nuggets').setOrigin(0.5, 0.97).setScale(HEIGHT / tex.height).setDepth(p.y);
    this.baseScale = this.sprite.scaleY;
    // Platzhalter für die Steh-Animation: atmet leicht
    this.scene.tweens.add({ targets: this.sprite, scaleY: this.baseScale * 1.02, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.sprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.distance() < TAP_DIST && this.tapped());
  }

  // nächste freie Kachel um t herum (kein Hindernis, kein Käfig, kein Ausgang), als Weltpunkt
  freeTile(t) {
    const inPen = (tx, ty) => ENCLOSURES.some((e) => e.tiles?.some((p) => p.tx === tx && p.ty === ty));
    for (let r = 0; r <= SPOT_SEARCH; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const tx = t.tx + dx;
          const ty = t.ty + dy;
          if (!isBlocked(tx, ty) && !exitAt(tx, ty) && !inPen(tx, ty)) return tileToWorld(tx, ty);
        }
      }
    }
    return tileToWorld(t.tx, t.ty);
  }

  distance() {
    const p = this.scene.player;
    return Math.hypot(p.x - this.sprite.x, (p.y - this.sprite.y) * 2);
  }

  onScreen() {
    return this.scene.cameras.main.worldView.contains(this.sprite.x, this.sprite.y - 30);
  }

  // Ankunft im Camp (nach dem Einsortieren in den Wagen, siehe expArriveCamp): was er diesmal erklärt.
  // arrivals: so viele Tiere kamen mit. Gibt zurück, ob er etwas sagen wird (dann keine Meldung am Rand)
  arrive(arrivals) {
    const r = run();
    if (!r || isFinalCamp()) return false; // (im Ziel-Camp kommt die Abschlusskiste)
    const g = guide();
    const q = [];
    const told = (id) => guideDone(id) || q.includes(id);
    const homeReady = guideDone('wagon') || r.step >= 2; // (der Hinweis zur Heimfahrt erst bei einem späteren Besuch)
    if (!guideDone('camp')) q.push('camp');
    if (!g.biomes.includes(r.biome)) q.push('biome');
    if (arrivals && !told('wagon')) q.push('wagon');
    if (r.stay.length && !told('full')) q.push('full');
    if (homeReady && !told('home') && !q.includes('wagon')) q.push('home');
    this.queue = q;
    return q.length > 0;
  }

  hasNews() {
    return this.queue.length > 0;
  }

  update() {
    const p = this.scene.player;
    this.sprite.setFlipX(p.x < this.sprite.x); // (das Bild schaut nach rechts)
    if (this.anchored && isSpeaking()) {
      const cam = this.scene.cameras.main;
      const z = this.scene.scale.zoom;
      const top = this.sprite.y - this.sprite.displayHeight * this.sprite.originY;
      placeSpeech((this.sprite.x - cam.worldView.x) * cam.zoom * z, (top - cam.worldView.y) * cam.zoom * z);
    }
    if (this.hasNews() && !isSpeaking() && !this.scene.leaving && this.scene.time.now >= this.talkFrom && this.onScreen()) this.talk();
  }

  speak(lines, then, opts = {}) {
    this.anchored = true;
    say(lines, (i) => {
      this.anchored = false;
      then?.(i);
    }, { name: NAME, ...opts });
  }

  // die Schritte dieses Besuchs nacheinander (jeder mit höchstens 2 Blasen)
  talk() {
    const id = this.queue.shift();
    if (!id) return;
    const r = run();
    if (id === 'biome') {
      const note = BIOME_NOTES[r?.biome]?.();
      if (r && !guide().biomes.includes(r.biome)) guide().biomes.push(r.biome);
      if (!note) return this.talk();
      return this.speak([note], () => this.next());
    }
    this.speak(TEXTS[id](), () => {
      markGuide(id);
      if (id === 'wagon' || id === 'full') this.tips.add(id);
      if (id === 'home') {
        this.scene.expPoint('car');
        this.scene.time.delayedCall(CAR_ARROW_MS, () => !this.scene.leaving && this.scene.expPoint(this.scene.expNextPoint()));
      }
      this.next();
    });
  }

  next() {
    saveNow();
    this.talkFrom = this.scene.time.now + 300;
  }

  // angetippt: offene Schritte gleich, sonst die Frage, ob er es nochmal erklären soll
  tapped() {
    if (isSpeaking()) return;
    if (this.hasNews()) return this.talk();
    this.speak([tr('Soll ich dir nochmal erklären, wie es geht?', 'Shall I explain again how it works?')], (i) => {
      if (i === 0) this.speak(RECAP());
    }, { choices: [tr('Ja', 'Yes'), tr('Nein', 'No')] });
  }

  // Wagen-Menü: Pfeil und Satz von ihm (danach nicht mehr); null, wenn es nichts zu zeigen gibt
  wagonTip(hasStay) {
    if (this.tips.has('full') && hasStay) return { point: 'stay', text: tr('Zum Tauschen tippe erst ein Tier im Wagen an, dann dieses hier.', 'To swap, first tap an animal in the wagon, then this one.') };
    if (this.tips.has('wagon')) return { point: 'done', text: tr('⭐ heißt neu im Zoo oder selten. Passt alles, tippe auf Fertig.', '⭐ means new to the zoo or rare. If all is fine, tap Done.') };
    return null;
  }

  wagonClosed() {
    this.tips.clear();
  }

  destroy() {
    this.sprite?.destroy();
    this.shadow?.destroy();
  }
}

export const GUIDE_STEPS = STEPS;
