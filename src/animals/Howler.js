// Brüllaffe (Dschungel): lebt in kleinen Trupps oben in den Urwaldbäumen. Sehen kann man ihn dort nicht – nur ab und zu
// springt einer von Krone zu Krone: die Kronen rascheln, und er brüllt laut. Man muss sich also merken, wo er gerade sitzt.
// Legt man eine Banane unten an seinen Baum, klettert er herunter und frisst sie – dann fängt man ihn mit dem Lasso.
// Danach (oder wenn man zu langsam ist) klettert er wieder hinauf.
// Der Gibbon (nur bei Nebel) verhält sich genauso, nur mit eigenen Bildern und einem höheren Ruf (species 'gibbon').
import Phaser from 'phaser';
import Animal from './Animal.js';
import { tileToWorld } from '../world/iso.js';
import { JUNGLE_TREES } from '../world/map.js';

const CROWN_UP = 104; // Höhe der Baumkrone über dem Fuß des Urwaldbaums (Bild "jungle_tree")
const TROOP_SIZE = [3, 4]; // so viele sind in einem Trupp
const TROOP_RANGE = 5; // so viele Kacheln weit auseinander sitzen die Affen eines Trupps beim Erscheinen höchstens
const JUMP_RANGE = 6; // so weit (Kacheln) springt einer höchstens ...
const TROOP_SPREAD = 8; // ... und so weit darf er sich vom Rest des Trupps entfernen
const JUMP_EVERY = [9, 18]; // so oft springt jeder Affe auf einen anderen Baum (Sekunden)
const JUMP_MS = 1400; // so lange dauert ein Sprung
const JUMP_ARC = 44; // so hoch ist der Bogen dabei
const JUMP_DEPTH = 98990; // im Sprung vor allen Bäumen (unter Wetter und Nacht), damit man ihn sieht
export const LURE_DIST = 60; // so nah muss die Banane am Fuß seines Baums liegen
const CLIMB_MS = 1200; // so lange klettert er herunter bzw. hinauf
const EAT_TIME = 10; // so lange frisst er unten die Banane – in der Zeit fängt man ihn mit dem Lasso
const CALL_VOLUME = 0.7; // Brüllen ganz nah ...
const CALL_HEAR = 300; // ... und so weit (Welt-Pixel, etwa 9 Kacheln) hört man es noch – nur in der Nähe

export default class Howler extends Animal {
  constructor(scene, x, y, species = 'howler') {
    super(scene, x, y, species);
    this.phase = null; // wild: 'tree' → ('jump' → 'tree') bzw. 'down' → 'eat' → 'up' → 'tree'
    this.lift = 0; // so hoch über dem Boden ist er gerade zu sehen (Sprung, Klettern)
  }

  // einen Trupp in nahe beieinander stehende, freie Urwaldbäume setzen; gibt die Affen zurück
  static spawnTroop(scene, species = 'howler') {
    const taken = Howler.takenTrees(scene);
    const free = JUNGLE_TREES.filter((t) => !taken.has(t.tx + ',' + t.ty));
    const first = Phaser.Utils.Array.GetRandom(free);
    if (!first) return [];
    const near = Phaser.Utils.Array.Shuffle(free.filter((t) => t !== first && Math.hypot(t.tx - first.tx, t.ty - first.ty) <= TROOP_RANGE));
    const trees = [first, ...near].slice(0, Phaser.Math.Between(...TROOP_SIZE));
    const troop = { members: [] };
    return trees.map((tree) => {
      const a = scene.createAnimal(species, 0, 0);
      a.troop = troop;
      troop.members.push(a);
      a.sitIn(tree);
      a.jumpIn = Phaser.Math.FloatBetween(3, JUMP_EVERY[1]);
      return a;
    });
  }

  // Bäume, auf denen schon ein Brüllaffe sitzt (oder gleich landet)
  static takenTrees(scene, except = null) {
    return new Set(scene.animals.filter((a) => a !== except && a instanceof Howler && a.tree).map((a) => a.tree.tx + ',' + a.tree.ty));
  }

  sitIn(tree) {
    this.tree = tree;
    Object.assign(this, tileToWorld(tree.tx, tree.ty));
    this.y += 3; // knapp vor dem Stamm
    this.phase = 'tree';
    this.lift = CROWN_UP;
  }

  inTree() {
    return this.state === 'wild' && (this.phase === 'tree' || this.phase === 'jump');
  }

  canBeCaughtNow() {
    return this.state === 'wild' && this.phase === 'eat';
  }

  canDespawn() {
    return this.phase === 'tree';
  }

  shouldFlee() {
    return false;
  }

  blocked(x, y) {
    if (this.state === 'wild') return false; // er bewegt sich nur zwischen Baum und Banane
    return super.blocked(x, y);
  }

  updateFree(dt, player) {
    if (this.state !== 'wild') return super.updateFree(dt, player);
    if (this.phase === 'tree') {
      // Banane unten an seinem Baum? Dann kommt er herunter
      const banana = this.scene.pickups.find((p) => p.tool === 'banana' && !p.collected && !p.claimed && Math.hypot(p.x - this.x, (p.y - this.y) * 2) < LURE_DIST);
      if (banana) return this.climbDown(banana), false;
      this.jumpIn -= dt;
      if (this.jumpIn <= 0) this.jump();
      return false;
    }
    if (this.phase === 'eat') {
      this.phaseTime -= dt;
      this.faceX = Math.sign(player.x - this.x) || this.faceX;
      if (this.phaseTime <= 0) this.climbUp();
    }
    return false;
  }

  // auf einen freien Baum in der Nähe des Trupps springen: beide Kronen rascheln, er brüllt
  jump() {
    this.jumpIn = Phaser.Math.FloatBetween(...JUMP_EVERY);
    const taken = Howler.takenTrees(this.scene, this);
    const mates = this.troop?.members.filter((a) => a !== this && a.state === 'wild' && a.tree) ?? [];
    const center = mates.length ? { tx: mates.reduce((s, a) => s + a.tree.tx, 0) / mates.length, ty: mates.reduce((s, a) => s + a.tree.ty, 0) / mates.length } : this.tree;
    const options = JUNGLE_TREES.filter(
      (t) => !taken.has(t.tx + ',' + t.ty) && (t.tx !== this.tree.tx || t.ty !== this.tree.ty) && Math.hypot(t.tx - this.tree.tx, t.ty - this.tree.ty) <= JUMP_RANGE && Math.hypot(t.tx - center.tx, t.ty - center.ty) <= TROOP_SPREAD,
    );
    const next = Phaser.Utils.Array.GetRandom(options);
    if (!next) return; // kein freier Baum in Sprungweite: er bleibt still sitzen
    this.call();
    this.scene.rustleCrown?.(this.tree);
    const from = { x: this.x, y: this.y };
    const to = tileToWorld(next.tx, next.ty);
    to.y += 3;
    this.tree = next; // schon reserviert, damit kein anderer dorthin springt
    this.phase = 'jump';
    this.faceX = Math.sign(to.x - from.x) || this.faceX;
    this.faceY = Math.sign(to.y - from.y) || this.faceY;
    const k = { t: 0 };
    this.scene.tweens.add({
      targets: k,
      t: 1,
      duration: JUMP_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.x = from.x + (to.x - from.x) * k.t;
        this.y = from.y + (to.y - from.y) * k.t;
        this.lift = CROWN_UP + Math.sin(Math.PI * k.t) * JUMP_ARC;
      },
      onComplete: () => {
        if (this.state !== 'wild' || this.phase !== 'jump') return;
        this.sitIn(next);
        this.scene.rustleCrown?.(next);
      },
    });
  }

  // Brüllen: laut, weiter weg leiser (eigener Laut, falls es einen gibt, sonst der Affenruf viel tiefer)
  call() {
    const p = this.scene.player;
    const k = Math.max(0, 1 - Math.hypot(p.x - this.x, (p.y - this.y) * 2) / CALL_HEAR);
    if (k <= 0) return;
    const audio = this.scene.cache.audio;
    const volume = CALL_VOLUME * k * k; // weiter weg schnell leiser
    if (audio.exists(`animal_${this.species}`)) this.scene.sound.play(`animal_${this.species}`, { volume, detune: Phaser.Math.Between(-100, 100) });
    else if (this.species === 'gibbon' && audio.exists('animal_howler')) this.scene.sound.play('animal_howler', { volume, detune: 700 + Phaser.Math.Between(-100, 100) }); // Gibbon: höher, bis er einen eigenen Ruf hat
    else if (audio.exists('animal_macaque')) this.scene.sound.play('animal_macaque', { volume, detune: -1100 + Phaser.Math.Between(-100, 100) });
  }

  // am Stamm herunterklettern und zur Banane laufen (die gehört dann ihm)
  climbDown(banana) {
    banana.claimed = true;
    this.phase = 'down';
    this.call();
    this.scene.rustleCrown?.(this.tree);
    this.scene.tweens.add({
      targets: this,
      lift: 0,
      duration: CLIMB_MS,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.state !== 'wild') return;
        this.faceX = Math.sign(banana.x - this.x) || this.faceX;
        this.faceY = Math.sign(banana.y - this.y) || 1;
        this.scene.tweens.add({
          targets: this,
          x: banana.x - this.faceX * 8,
          y: banana.y,
          duration: 500,
          onComplete: () => {
            if (this.state !== 'wild') return;
            this.scene.eatBanana?.(banana);
            this.setEating(true);
            this.phase = 'eat';
            this.phaseTime = EAT_TIME;
          },
        });
      },
    });
  }

  climbUp() {
    this.phase = 'up';
    this.setEating(false);
    const p = tileToWorld(this.tree.tx, this.tree.ty);
    this.scene.tweens.add({ targets: this, x: p.x, y: p.y + 3, duration: 500 });
    this.scene.tweens.add({
      targets: this,
      lift: CROWN_UP,
      delay: 500,
      duration: CLIMB_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.state === 'wild') this.sitIn(this.tree);
      },
    });
  }

  render(moving) {
    // oben im Baum sieht man ihn nicht (nur beim Springen)
    const hidden = this.state === 'wild' && this.phase === 'tree';
    this.sprite.setVisible(!hidden);
    this.shadow.setVisible(!hidden && this.lift < CROWN_UP * 0.5);
    // im Sprung das Sprungbild (Arme nach vorn)
    const key = this.phase === 'jump' && this.scene.textures.exists(`${this.species}_jump`) ? `${this.species}_jump` : this.lookTexture();
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key, this.sprite.frame.name);
    super.render(moving && !this.lift);
    if (this.lift) {
      this.sprite.setY(this.sprite.y - this.lift);
      if (this.phase === 'jump') this.sprite.setDepth(JUMP_DEPTH); // vor den Kronen
    }
  }

  catch() {
    this.scene.tweens.killTweensOf(this);
    this.troop?.members.splice(this.troop.members.indexOf(this), 1);
    this.troop = null;
    this.phase = null;
    this.tree = null;
    this.lift = 0;
    this.setEating(false);
    super.catch();
  }

  restore(state) {
    super.restore(state);
    this.phase = null;
    this.tree = null;
    this.lift = 0;
  }
}
