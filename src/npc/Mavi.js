// Mavi die Tierpflegerin: steht dort, wo die aktive Aufgabe ihrer Geschichte stattfindet (at in src/story/steps.js),
// spricht einen an, sobald man in ihre Nähe kommt und sie etwas Neues zu sagen hat, und hakt die Aufgaben ab.
// Ob eine Aufgabe erledigt ist, prüft sie laufend am Spielstand – auch das, was man schon vorher geschafft hat.
// Ein roter Pfeil zeigt, wohin es als Nächstes geht (zu ihr, zum Computer, zum Gehegeschild oder zum Auto). Soll man
// als Nächstes mit ihr sprechen, winkt sie ab und zu.
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { tileToWorld, worldToTile } from '../world/iso.js';
import { ENCLOSURES, LEVEL, LEVEL_ID, START, exitAt, isBlocked, nearEnclosure } from '../world/map.js';
import { LEVELS, isPark } from '../world/levels.js';
import { seaReady } from '../story/steps.js';
import { activeStep, completeStep, stepDone } from '../story/story.js';
import { closeSpeech, isSpeaking, placeSpeech, say, sayToast } from '../ui/speech.js';
import { showWalkHint } from '../ui/walkHint.js';
import { saveNow } from '../save.js';

const FRAMES = { downRight: 0, downLeft: 1 }; // Standbild (mavi.png), falls die Videos fehlen
const TALK_DIST = 100; // so nah muss man kommen, damit sie von selbst anfängt zu sprechen
const TAP_DIST = 140; // ... bzw. damit Antippen ein Gespräch startet
const CHECK_EVERY = 0.5; // Sekunden zwischen zwei Blicken in den Spielstand
const SPOT_SEARCH = 5; // so weit (Kacheln) sucht sie um ihren Platz herum eine freie Stelle
const ARROW_GAP = 4; // Abstand des Pfeils über dem Ziel
const WAVE_EVERY = [3, 6]; // Sekunden zwischen zweimal Winken (wenn man als Nächstes mit ihr sprechen soll)
const VISITORS_AT_PEN = 2; // so viele Besucher stehen bei der Besucher-Aufgabe am Gehege
const SETTLE = 1200; // so lange nach dem Aufbau des Gebiets fängt sie noch nicht von selbst an (die Kamera blendet ein)

// Aufgaben, die im Tierpark erledigt werden (egal, in welchem Abschnitt Mavi steht)
const PARK_TASKS = ['visitors', 'icecream', 'event', 'upgrade'];
// Aufgaben, bei denen der Pfeil auf etwas zeigt, wenn man dort ist
const POINT = { icecream: 'computer', event: 'computer', upgrade: 'sign' };

export default class Mavi {
  constructor(scene) {
    this.scene = scene;
    this.sprite = null;
    this.shadow = null;
    this.arrow = null;
    this.arrowAt = null;
    this.checkTimer = 0;
    this.waveTimer = 1;
    this.talkFrom = scene.time.now + SETTLE;
    this.anchored = false; // die offene Blase gehört zu ihr (hängt über ihrem Kopf)
    // im Aquarium angekommen, nachdem man im Riff Meerestiere gefangen hat: Mavi zeigt es einem
    if (LEVEL_ID === 'aquarium' && activeStep()?.id === 'reef' && seaReady(game)) {
      game.story.flags.aquarium = true;
      game.story.heard = true; // drinnen nur noch der Abschluss (auch wenn man draußen an ihr vorbeigelaufen ist)
    }
    this.place(false);
    // dort, wo die Aufgabe stattfindet, ohne Mavi (z. B. im Riff): einmal ihr Satz dazu am Rand
    const step = activeStep();
    if (step?.waiting && !this.sprite && !game.story.waitingSaid && this.taskLevel(step) === LEVEL_ID) {
      game.story.waitingSaid = true;
      scene.time.delayedCall(SETTLE, () => sayToast(step.waiting));
    }
  }

  // Platz der aktiven Aufgabe in diesem Gebiet (oder null, wenn sie woanders ist); ohne Aufgabe steht sie vor dem Haupthaus
  spot() {
    if (this.near) return this.near; // kommt gerade zu einem herüber (Abschluss des Gehege-Ausbaus)
    const step = activeStep();
    const at = !step ? { level: 'park', spot: 'start' } : [step.at, step.also].find((a) => a?.level === LEVEL_ID);
    if (!at || at.level !== LEVEL_ID) return null;
    let t = null;
    if (at.spot === 'start') t = { tx: START.tx + 1, ty: START.ty + 1 };
    else if (at.spot === 'feeder' && LEVEL.feeders?.length) return this.freeTile(LEVEL.feeders[0], true); // mitten zwischen den Gehegen, auf dem Weg
    else if (at.spot === 'car' && LEVEL.car) return this.freeTile({ tx: Math.round(LEVEL.car.tx) - 2, ty: Math.round(LEVEL.car.ty) + 1 }, true); // neben dem Auto (dort kommt man an)
    else if (at.spot === 'hut' && LEVEL.hut) t = { tx: LEVEL.hut.tx1 + 1, ty: LEVEL.hut.ty1 + 1 };
    else if (at.spot === 'computer' && LEVEL.computers?.length) t = { tx: LEVEL.computers[0].tx + 1, ty: LEVEL.computers[0].ty + 1 };
    else if (at.spot === 'sign') {
      // vor dem Schild auf dem Weg, nicht auf dem Zaun: nächste Kachel mit Abstand zu allen Gehegen
      const s = this.scene.sheepSign();
      if (s) return this.freeTile(worldToTile(s.x, s.y), true);
    } else if (at.spot === 'aquarium') t = { tx: 4, ty: 15 }; // auf dem Weg neben der Ankunft vor der Tür
    else if (at.spot === 'entry') t = { tx: 9, ty: 16 }; // im Aquarium gleich neben der Tür (nicht hinter den Quallen-Lampen)
    t ??= { tx: START.tx + 2, ty: START.ty + 1 };
    return this.freeTile(t);
  }

  // nächste freie Kachel (kein Hindernis, kein Gehege, kein Übergang) um t herum, als Weltpunkt; clear: auch nicht direkt
  // neben einem Gehege (Zaun)
  freeTile(t, clear = false) {
    const inPen = (tx, ty) => ENCLOSURES.some((e) => e.tiles?.some((p) => p.tx === tx && p.ty === ty));
    for (let r = 0; r <= SPOT_SEARCH; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const tx = Math.round(t.tx) + dx;
          const ty = Math.round(t.ty) + dy;
          if (!isBlocked(tx, ty) && !exitAt(tx, ty) && !inPen(tx, ty) && !(clear && nearEnclosure(tx, ty))) return tileToWorld(tx, ty);
        }
      }
    }
    return tileToWorld(t.tx, t.ty);
  }

  // an ihren Platz (fade: sanft aus- und wieder einblenden, wenn sie wechselt)
  place(fade = true) {
    const p = this.spot();
    const old = [this.sprite, this.shadow].filter(Boolean);
    if (p && this.sprite && Math.hypot(p.x - this.sprite.x, p.y - this.sprite.y) < 4) return;
    this.sprite = null;
    this.shadow = null;
    if (old.length) this.scene.tweens.add({ targets: old, alpha: 0, duration: fade ? 400 : 0, onComplete: () => old.forEach((o) => o.destroy()) });
    if (!p) return;
    this.shadow = this.scene.add.ellipse(p.x, p.y, 24, 8, 0x14320a, 0.3).setDepth(p.y - 0.5);
    this.sprite = this.scene.add.sprite(p.x, p.y, 'mavi', FRAMES.downLeft).setOrigin(0.5, 112 / 116).setScale(0.5).setDepth(p.y);
    // Stehen (blinzelt) und Winken als Video, Blick nach unten-links (nach rechts gespiegelt); fehlen sie, das Standbild
    this.animated = this.scene.anims.exists('mavi_idle') && this.scene.anims.exists('mavi_wave');
    if (this.animated) {
      this.sprite.play('mavi_idle');
      this.sprite.on('animationcomplete-mavi_wave', () => this.sprite.play('mavi_idle'));
    }
    this.sprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.distance() < TAP_DIST && this.talk(true));
    if (fade) {
      for (const o of [this.sprite, this.shadow]) {
        const a = o.alpha;
        o.setAlpha(0);
        this.scene.tweens.add({ targets: o, alpha: a, duration: 500, delay: 300 });
      }
    }
  }

  distance() {
    const p = this.scene.player;
    return this.sprite ? Math.hypot(p.x - this.sprite.x, (p.y - this.sprite.y) * 2) : Infinity;
  }

  onScreen() {
    return !!this.sprite && this.scene.cameras.main.worldView.contains(this.sprite.x, this.sprite.y - 30);
  }

  // hat sie etwas Neues zu sagen? (dann spricht sie einen in der Nähe von selbst an)
  hasNews() {
    if (this.pending && this.sprite) return true; // Abschluss-Satz wartet auf einen
    const step = activeStep();
    if (!step || !this.sprite) return false;
    if (!game.story.heard) return !step.introWhen || step.introWhen(game); // (bis dahin nur waiting, wenn man sie antippt)
    return !!step.talk && stepDone(step);
  }

  update(dt) {
    const p = this.scene.player;
    p.frozen = isSpeaking();
    if (this.sprite) {
      // schaut zum Spieler (immer nach vorne, nur links oder rechts)
      const right = p.x >= this.sprite.x;
      if (this.animated) this.sprite.setFlipX(right);
      else this.sprite.setFrame(right ? FRAMES.downRight : FRAMES.downLeft);
      // soll man als Nächstes mit ihr sprechen: ab und zu winken
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.waveTimer = WAVE_EVERY[0] + Math.random() * (WAVE_EVERY[1] - WAVE_EVERY[0]);
        if (this.animated && this.hasNews() && !isSpeaking() && this.sprite.anims.currentAnim?.key !== 'mavi_wave') this.sprite.play('mavi_wave');
      }
      if (this.anchored && isSpeaking()) {
        const cam = this.scene.cameras.main;
        const z = this.scene.scale.zoom;
        const top = this.sprite.y - this.sprite.displayHeight * this.sprite.originY;
        placeSpeech((this.sprite.x - cam.worldView.x) * cam.zoom * z, (top - cam.worldView.y) * cam.zoom * z);
      }
      if (!isSpeaking() && this.hasNews() && this.distance() < TALK_DIST && !this.scene.leaving && this.scene.time.now >= this.talkFrom && this.onScreen()) this.talk();
    }
    this.checkTimer -= dt;
    if (this.checkTimer <= 0) {
      this.checkTimer = CHECK_EVERY;
      this.check();
      // Besucher-Aufgabe: am Gehege, an dem Mavi steht, schauen immer ein paar Besucher zu
      const sign = activeStep()?.id === 'visitors' && LEVEL_ID === 'park' && this.scene.sheepSign();
      if (sign) for (let i = 0; i < VISITORS_AT_PEN; i++) this.scene.visitors?.ensureAt(sign.enclosure, i + 1);
      this.updateArrow();
    }
  }

  // Blase über ihr (wenn sie zu sehen ist), sonst klein am Rand
  speak(lines, then = null) {
    if (!lines?.length) return then?.();
    if (this.onScreen()) {
      this.anchored = true;
      say(lines, () => {
        this.anchored = false;
        then?.();
      });
    } else {
      sayToast(lines.join(' '));
      then?.();
    }
  }

  // Gespräch: Vorstellung der Aufgabe, Abschluss einer Gesprächs-Aufgabe oder eine Erinnerung (force: angetippt)
  talk(force = false) {
    if (isSpeaking()) return;
    if (this.pending) return this.sayOutro();
    const step = activeStep();
    if (!step) {
      if (force) this.speak([tr('Schön, dass du da bist! Halt die Augen nach seltenen Tieren offen.', 'Nice to see you! Keep an eye out for rare animals.')]);
      return;
    }
    if (!game.story.heard) {
      if (!step.talk && stepDone(step)) return this.complete(); // schon erledigt: gleich "hast du ja schon"
      if (step.introWhen && !step.introWhen(game)) {
        game.story.waitingSaid = true;
        return this.speak([step.waiting]);
      }
      return this.speak(step.intro, () => {
        game.story.heard = true;
        if (step.talk && (!step.done || stepDone(step))) this.complete();
        else this.check();
        this.updateArrow();
      });
    }
    if (step.talk && (!step.done || stepDone(step))) return this.complete();
    if (force) this.speak([step.waiting ?? step.goal]);
  }

  // Spielstand ansehen: erledigte Aufgaben abhaken (Gesprächs-Aufgaben nur ankündigen, abgehakt wird bei ihr)
  check() {
    const step = activeStep();
    if (!step || this.pending || isSpeaking() || this.scene.leaving || this.scene.time.now < this.talkFrom) return;
    if (!step.talk && stepDone(step)) return this.complete();
    // Gesprächs-Aufgabe geschafft (bzw. readyWhen erfüllt, z. B. genug Meerestiere): einmal Bescheid sagen
    const ready = step.readyWhen ? step.readyWhen(game) : step.talk && stepDone(step) && game.story.heard;
    if (!ready || game.story.readyShown) return;
    game.story.readyShown = true;
    if (!(this.sprite && this.distance() < TALK_DIST) && step.ready) sayToast(step.ready);
    this.scene.updateQuestCard();
  }

  // aktive Aufgabe geschafft: Belohnung, Feier, ihr Satz dazu – danach steht sie bei der nächsten (die vielleicht auch
  // schon erledigt ist: dann gleich weiter)
  complete() {
    const heard = game.story.heard;
    const s = completeStep();
    if (!s) return;
    game.story.waitingSaid = false;
    this.scene.markNew(`quest:${s.id}`);
    if (s.reward) {
      this.scene.addHearts(s.reward);
      this.scene.storySuccess(s); // (die Begrüßung ist keine richtige Aufgabe: ohne Feier)
    }
    this.scene.updateQuestCard();
    saveNow();
    this.pending = [...(heard || s.talk ? [] : s.already ?? []), ...(s.outro ?? [])];
    this.walkHint = s.id === 'welcome'; // nach der Begrüßung: zeigen, wie man läuft
    // Gehege ausgebaut (meist nach dem Neuaufbau des Tierparks, irgendwo am ausgebauten Gehege oder am Computer): Mavi kommt
    // zu einem herüber und lobt einen dort, statt nur am Rand zu sprechen und gleich zur Savanne weiterzuziehen
    if (s.id === 'upgrade' && isPark(LEVEL_ID) && this.pending.length) {
      const p = worldToTile(this.scene.player.x, this.scene.player.y);
      this.near = this.freeTile({ tx: p.tx + 1, ty: p.ty - 1 }); // rechts neben einem (nicht davor)
      this.place();
      this.talkFrom = this.scene.time.now + 800; // erst sprechen, wenn sie eingeblendet ist
      this.scene.time.delayedCall(800, () => this.pending && !isSpeaking() && this.sayOutro());
      return this.updateArrow();
    }
    // ist sie zu sehen, aber nicht gleich neben einem (z. B. nach dem Neuaufbau beim Gehege-Ausbau): ihr Satz wartet, bis man
    // bei ihr ist (sie winkt so lange); sonst sagt sie ihn gleich (ist sie nicht zu sehen: am Rand)
    if (this.sprite && this.pending.length && this.onScreen() && this.distance() >= TALK_DIST * 2) return this.updateArrow();
    this.sayOutro();
  }

  // Abschluss-Satz der eben geschafften Aufgabe, danach geht sie zum Platz der nächsten
  sayOutro() {
    const lines = this.pending ?? [];
    this.pending = null;
    this.speak(lines, () => {
      this.near = null;
      if (this.walkHint) {
        this.walkHint = false;
        this.scene.time.delayedCall(250, () => !this.scene.leaving && showWalkHint());
      }
      this.place();
      this.updateArrow();
      this.scene.time.delayedCall(600, () => this.check());
    });
  }

  // wo es mit der aktiven Aufgabe weitergeht: erst zu Mavi (Vorstellung noch nicht gehört bzw. Gesprächs-Aufgabe), sonst
  // dorthin, wo sie erledigt wird
  taskLevel(step) {
    const meet = (!game.story.heard && (!step.introWhen || step.introWhen(game))) || (step.talk && (!step.done || stepDone(step)));
    if (meet) return step.also?.level === LEVEL_ID ? LEVEL_ID : step.at.level;
    if (step.id === 'reef') return seaReady(game) ? 'park2' : 'reef';
    if (PARK_TASKS.includes(step.id)) return isPark(LEVEL_ID) ? LEVEL_ID : 'park';
    return step.at.level;
  }

  // roter Pfeil: zu Mavi (wenn sie etwas zu sagen hat), sonst zum Ziel der Aufgabe hier oder zum Auto, wenn es woanders weitergeht
  updateArrow() {
    const step = activeStep();
    let target = null;
    if (step && !isSpeaking()) {
      const goal = this.taskLevel(step);
      if (this.hasNews()) target = this.inOffice() && !this.officeOpen() ? this.scene.officeDoor : { x: this.sprite.x, y: this.sprite.y - this.sprite.displayHeight * this.sprite.originY - ARROW_GAP };
      else if (goal !== LEVEL_ID) target = this.carPoint();
      else if (POINT[step.id] === 'computer' && game.story.heard) target = this.computerPoint();
      else if (this.needsNet(step)) target = this.scene.chestPoint(); // Wiesen-Aufgabe: zum Regal, dort liegt der Kescher
      else if (POINT[step.id] === 'sign' && game.story.heard) {
        const s = this.scene.sheepSign();
        if (s) target = { x: s.x, y: s.y - 52 };
      }
    }
    if (target && this.arrowAt && Math.hypot(target.x - this.arrowAt.x, target.y - this.arrowAt.y) < 2) return;
    this.arrow?.destroy();
    this.arrow = null;
    this.arrowAt = target;
    if (!target) return;
    this.arrow = this.scene.add
      .text(target.x, target.y, '▼', { fontFamily: 'Arial', fontSize: '22px', color: '#e8483f', stroke: '#ffffff', strokeThickness: 4, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(100001);
    this.scene.tweens.add({ targets: this.arrow, y: this.arrow.y - 8, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Wiesen-Aufgabe: fehlen noch Schmetterlinge und hat man den Kescher nicht in der Hand, zeigt der Pfeil aufs Regal
  needsNet(step = activeStep()) {
    return step?.id === 'meadow' && game.story.heard && LEVEL_ID === 'meadow' && this.scene.toolId !== 'net' && (game.catches.butterfly ?? 0) < 3;
  }

  // oberer Rand des Autobilds (in Häusern ohne Auto: kein Pfeil)
  carPoint() {
    const car = this.scene.car;
    return car ? { x: car.img.x, y: car.img.getBounds().top + 4 } : null;
  }

  // Computer im Haupthaus: von außen zur Eingangstür (das Dach verdeckt ihn), drinnen zum Computer
  computerPoint() {
    const pc = this.scene.computerSprite;
    if (!pc) return null;
    return this.officeOpen() ? { x: pc.x, y: pc.y - pc.displayHeight * pc.originY + 4 } : this.scene.officeDoor;
  }

  // ist man im Haupthaus (oder gibt es keine Tür, zu der der Pfeil zeigen könnte)?
  officeOpen() {
    const office = this.scene.houses?.find((house) => house.h.style === 'office');
    return !!office?.inside || !this.scene.officeDoor;
  }

  // steht Mavi im Haupthaus (am Computer)?
  inOffice() {
    const at = activeStep()?.at;
    return at?.level === LEVEL_ID && at.spot === 'computer';
  }

  // Weltkarte: Pfeil zu dem Gebiet, in dem es weitergeht, und der Hinweis dazu
  mapHint() {
    const lockedHint = tr('Dieses Gebiet zeigt dir Mavi bald!', 'Mavi will show you this area soon!');
    const step = activeStep();
    if (!step) return { lockedHint };
    const goal = this.taskLevel(step);
    if (goal === LEVEL_ID || !LEVELS[goal]?.car) return { lockedHint };
    const name = isPark(goal) ? LEVELS[goal].part.name : LEVELS[goal].name;
    return { point: goal, side: isPark(goal) ? 'left' : undefined, hint: tr(`Weiter geht’s: <b>${name}</b>!`, `Next stop: <b>${name}</b>!`), lockedHint };
  }

  destroy() {
    closeSpeech();
    this.arrow?.destroy();
  }
}
