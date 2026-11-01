// Trommel (Dschungel, Nebel): auf der Lichtung zum Trommel-Duell mit einem Gorilla. Trommelt Henrik in der Nähe der
// Gorillas, kommt einer und stellt sich vor ihn. Dann ROUNDS Runden: der Gorilla trommelt 1 bis 3 Mal auf seine Brust,
// Henrik trommelt genauso oft nach. Zu wenig (nach PLAYER_GAP Sekunden Pause gilt die Antwort als fertig), zu viel oder
// gar nicht (FIRST_WAIT): verloren, der Gorilla geht zurück, und erst nach RETRY Sekunden kommt wieder einer.
// Alle Runden geschafft: der Gorilla kommt mit. Die Zeiten sind zum Ausprobieren gedacht.
import Phaser from 'phaser';
import { tr } from '../i18n.js';

const ROUNDS = 3;
const BEATS = [1, 3]; // so oft trommelt der Gorilla je Runde
const GORILLA_GAP = 0.55; // Sekunden zwischen seinen Schlägen
const BEFORE_GORILLA = 1.0; // Pause, bevor er (wieder) loslegt
const FIRST_WAIT = 3.0; // so lange hat Henrik Zeit für den ersten Schlag
const PLAYER_GAP = 1.0; // so lange darf Henrik zwischen zwei Schlägen höchstens warten; danach zählt die Antwort
const ROUND_PAUSE = 1.0; // nach einer geschafften Runde
const RETRY = 10; // nach einem verlorenen Duell: so lange kommt kein Gorilla
const CALL_RANGE = 260; // so nah (Kachel-Proportionen) müssen die Gorillas sein, damit einer kommt
const STAND = 42; // so weit vor Henrik stellt er sich hin
const COME_TIMEOUT = 8; // kommt er bis dahin nicht an, gibt er auf
const LOSE_DIST = 170; // geht Henrik zu weit weg, ist das Duell vorbei
const BEAT_VOLUME = 0.9; // Schlag des Gorillas auf die Brust (Aufnahme, sounds/gorilla_beat.wav)

export default class DrumTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.sprite = scene.add.image(0, 0, 'drum').setScale(0.4);
    this.duel = null; // { g, phase: 'come' | 'gorilla' | 'player' | 'pause', round, n, done, count, time }
    this.retryAt = 0;
    this.labels = [];
  }

  now() {
    return this.scene.time.now / 1000;
  }

  // ein Schlag auf die Trommel (immer zu hören, auch ohne Gorillas)
  use() {
    const p = this.player;
    drumSound(this.scene, 'drum');
    this.bounce = 1;
    this.pop('🥁', p.x, p.sprite.y - 62 - p.handLift);
    const d = this.duel;
    if (d) {
      if (d.phase === 'player') {
        d.count++;
        d.time = 0;
        this.mark(d.count, d.n, true);
        if (d.count > d.n) this.lose(tr('Zu oft getrommelt!', 'Too many beats!'));
      }
      return;
    }
    this.call();
  }

  // trommelt Henrik in der Nähe der Gorillas, kommt einer und stellt sich vor ihn
  call() {
    const scene = this.scene;
    const p = this.player;
    if (this.now() < this.retryAt) {
      scene.showToast(tr(`🦍 Die Gorillas sind noch beleidigt – versuch es in ${Math.ceil(this.retryAt - this.now())} Sekunden noch einmal.`, `🦍 The gorillas are still sulking – try again in ${Math.ceil(this.retryAt - this.now())} seconds.`));
      return;
    }
    const near = scene.animals
      .filter((a) => a.species === 'gorilla' && a.state === 'wild' && a.mode === 'roam' && Math.hypot(a.x - p.x, (a.y - p.y) * 2) < CALL_RANGE)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const g = near[0];
    if (!g) return;
    // Platz vor Henrik, auf der Seite des Gorillas
    const ang = Math.atan2((g.y - p.y) * 2, g.x - p.x);
    g.comeTo({ x: p.x + Math.cos(ang) * STAND, y: p.y + (Math.sin(ang) * STAND) / 2 });
    this.duel = { g, phase: 'come', round: 1, time: 0 };
    scene.showToast(tr('🦍 Ein Gorilla kommt und stellt sich vor dich. Trommle genauso oft wie er auf seine Brust!', '🦍 A gorilla comes and stands in front of you. Drum exactly as often as it beats its chest!'));
  }

  update(dt) {
    const p = this.player;
    // Trommel vor dem Bauch, beim Schlag hüpft sie kurz
    this.bounce = Math.max(0, (this.bounce ?? 0) - dt * 6);
    this.sprite
      .setPosition(p.x + p.faceX * 8, p.sprite.y - 22 - p.handLift + this.bounce * 2)
      .setScale(0.4 * (1 + this.bounce * 0.1))
      .setDepth(p.y + (p.faceY > 0 ? 0.2 : -0.2));
    const d = this.duel;
    if (!d) return;
    const g = d.g;
    if (g.state !== 'wild' || !this.scene.animals.includes(g)) return this.end();
    if (Math.hypot(g.x - p.x, (g.y - p.y) * 2) > LOSE_DIST) return this.lose(tr('Du bist weggelaufen.', 'You walked away.'));
    d.time += dt;
    if (d.phase === 'come') {
      if (g.mode === 'duel') this.startRound(d.round);
      else if (d.time > COME_TIMEOUT) return this.end(true);
      return;
    }
    if (d.phase === 'pause') {
      if (d.time >= ROUND_PAUSE) this.startRound(d.round);
      return;
    }
    if (d.phase === 'gorilla') {
      // er trommelt: nach BEFORE_GORILLA, dann alle GORILLA_GAP Sekunden ein Schlag
      const due = d.done < d.n && d.time >= BEFORE_GORILLA + d.done * GORILLA_GAP;
      if (due) {
        d.done++;
        g.beat();
        if (this.scene.cache.audio.exists('gorilla_beat')) this.scene.sound.play('gorilla_beat', { volume: BEAT_VOLUME });
        else drumSound(this.scene, 'chest');
        this.mark(d.done, d.n, false);
      }
      if (d.done >= d.n && d.time >= BEFORE_GORILLA + (d.n - 1) * GORILLA_GAP + 0.35) {
        g.stopDrum();
        d.phase = 'player';
        d.count = 0;
        d.time = 0;
        this.showLabel(tr('Du bist dran!', 'Your turn!'), p.x, p.sprite.y - 80, '#fff2b0');
      }
      return;
    }
    if (d.phase === 'player') {
      if (d.count === 0 && d.time > FIRST_WAIT) return this.lose(tr('Zu langsam!', 'Too slow!'));
      if (d.count > 0 && d.time > PLAYER_GAP) {
        if (d.count < d.n) return this.lose(tr('Zu wenig getrommelt!', 'Not enough beats!'));
        // Runde geschafft
        this.showLabel('✓', g.x, g.sprite.y - 70, '#a8f07a');
        if (d.round >= ROUNDS) return this.win();
        d.round++;
        d.phase = 'pause';
        d.time = 0;
      }
    }
  }

  startRound(round) {
    const d = this.duel;
    d.round = round;
    d.phase = 'gorilla';
    d.n = Phaser.Math.Between(...BEATS);
    d.done = 0;
    d.time = 0;
    d.g.startDrum(); // richtet sich auf (BEFORE_GORILLA), dann trommelt er durchgehend; die Punkte zählen die Schläge
    this.clearLabels();
    this.showLabel(tr(`Runde ${round}/${ROUNDS}`, `Round ${round}/${ROUNDS}`), d.g.x, d.g.sprite.y - 84, '#ffffff');
  }

  // Punkte über dem Gorilla (seine Schläge) bzw. über Henrik (die eigenen)
  mark(i, n, own) {
    const who = own ? this.player : this.duel.g;
    const y = (own ? who.sprite.y - 70 : who.sprite.y - 64) - (own ? this.player.handLift : 0);
    this.showLabel('●', who.x + (i - (n + 1) / 2) * 9, y, own ? (i > n ? '#ff7a6a' : '#ffd84a') : '#ffffff', 12);
  }

  win() {
    const g = this.duel.g;
    this.end();
    this.scene.showToast(tr('🦍 Geschafft! Der Gorilla ist beeindruckt und kommt mit dir.', '🦍 You did it! The gorilla is impressed and comes with you.'));
    this.scene.catchAnimal(g);
  }

  lose(why) {
    const g = this.duel?.g;
    this.end();
    g?.leave();
    this.retryAt = this.now() + RETRY;
    this.scene.showToast(tr(`🦍 ${why} Der Gorilla geht zurück zu seiner Gruppe – in ${RETRY} Sekunden kannst du es noch einmal versuchen.`, `🦍 ${why} The gorilla goes back to its group – you can try again in ${RETRY} seconds.`));
  }

  // Duell beenden; gaveUp: der Gorilla ist nicht angekommen (dann geht er einfach zurück, ohne Wartezeit)
  end(gaveUp = false) {
    this.duel?.g.stopDrum();
    if (gaveUp) this.duel?.g.leave();
    this.duel = null;
    this.clearLabels();
  }

  showLabel(text, x, y, color, size = 14) {
    const t = this.scene.add
      .text(x, y, text, { fontFamily: 'Trebuchet MS, Arial', fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#2a1a10', strokeThickness: 4, resolution: 4 })
      .setOrigin(0.5, 1)
      .setDepth(100000);
    this.labels.push(t);
    this.scene.tweens.add({ targets: t, y: y - 6, duration: 200, ease: 'Quad.easeOut' });
    return t;
  }

  clearLabels() {
    for (const t of this.labels) t.destroy();
    this.labels = [];
  }

  // kleines Symbol, das kurz aufsteigt und verblasst
  pop(text, x, y) {
    const t = this.scene.add.text(x, y, text, { fontSize: '14px', resolution: 4 }).setOrigin(0.5, 1).setDepth(100000);
    this.scene.tweens.add({ targets: t, y: y - 16, alpha: 0, duration: 500, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  // fängt nicht im Vorbeigehen (nur das gewonnene Duell)
  caughtBy() {
    return [];
  }

  destroy() {
    if (this.duel) this.end(true);
    this.sprite.destroy();
  }
}

// Trommelschlag, mit WebAudio erzeugt: 'drum' (Henriks Trommel, heller) oder 'chest' (Gorilla-Brust, tief und dumpf)
function drumSound(scene, kind) {
  const ctx = scene.sound.context;
  if (!ctx || scene.sound.mute) return;
  const t = ctx.currentTime;
  const vol = (kind === 'chest' ? 0.9 : 0.6) * scene.sound.volume;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(kind === 'chest' ? 110 : 210, t);
  osc.frequency.exponentialRampToValueAtTime(kind === 'chest' ? 45 : 90, t + 0.18);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'chest' ? 0.32 : 0.22));
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.35);
  // dazu ein kurzes Rauschen (Fell bzw. Brust)
  const len = Math.floor(ctx.sampleRate * 0.06);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = ctx.createBufferSource();
  const ng = ctx.createGain();
  ng.gain.value = vol * (kind === 'chest' ? 0.25 : 0.35);
  noise.buffer = buf;
  noise.connect(ng).connect(ctx.destination);
  noise.start(t);
}
