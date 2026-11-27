import Phaser from 'phaser';
import { blockedAt } from '../world/collision.js';
import { charAt, objectAt } from '../world/map.js';
import { tileToWorld } from '../world/iso.js';

// Leben im Gehege (docs/plan-gehege-leben.md, Schritt 1): Lieblingsplätze, Herden, Ruhephasen und kleine Momente
// (hüpfen, rennen, schütteln, trinken). Nur Tweens und vorhandene Bilder, kein Bonus, nur zum Anschauen.
// Animal.pickWander fragt zuerst penWander, Animal.update zuerst updateLife.
// Der laufende Moment steht in a.penMoment – nicht a.life: das ist die Lebenszeit wilder Tiere (GardenScene.updateSpawner).

// Herdentiere: folgen im Gehege einem Leittier (zusätzlich zu kind.herd)
const HERD = new Set(['sheep', 'goat', 'cow', 'deer', 'antelope', 'zebra', 'gnu', 'yak', 'reindeer', 'elk', 'flamingo']);
// welche Momente zu welcher Art passen (große, schwere Tiere hüpfen nicht)
const HOP = new Set(['sheep', 'goat', 'pig', 'cow', 'deer', 'antelope', 'zebra', 'meerkat', 'fox', 'arcticfox', 'redpanda', 'tanuki', 'snowhare', 'penguin', 'hedgehog', 'warthog', 'boar', 'cat', 'okapi', 'tapir', 'reindeer']);
const RUN = new Set(['sheep', 'goat', 'pig', 'cow', 'deer', 'antelope', 'zebra', 'fox', 'arcticfox', 'redpanda', 'tanuki', 'snowhare', 'warthog', 'boar', 'hyena', 'reindeer', 'elk', 'okapi', 'cat', 'meerkat', 'lion', 'tiger', 'jaguar', 'snowleopard']);
const SHAKE = new Set(['sheep', 'goat', 'pig', 'cow', 'deer', 'antelope', 'zebra', 'fox', 'arcticfox', 'redpanda', 'tanuki', 'warthog', 'boar', 'hyena', 'reindeer', 'elk', 'okapi', 'cat', 'lion', 'tiger', 'jaguar', 'snowleopard', 'yak', 'hippo', 'polarbear', 'walrus', 'seal', 'gorilla', 'panda', 'penguin', 'tapir', 'arcticwolf', 'wolf']);

// Zustände der Unterklassen, in denen das Tier gerade etwas Eigenes macht (dann keine Momente)
const BUSY = ['digging', 'sit', 'grazing', 'sleeping', 'jumping', 'tree', 'eating', 'drinking', 'dozing', 'perched', 'flying', 'penFlight', 'penClimb', 'penDrink', 'penPile', 'mudSpot', 'lick', 'noseBall', 'fly', 'trip', 'jump', 'plop', 'running', 'scared', 'toPerch', 'bed'];

const HERD_R = 70; // so weit (Kachelmaß, y doppelt) darf sich ein Herdentier vom Leittier entfernen
const BABY_R = 34; // Tierbaby bleibt dicht bei einem Erwachsenen
const SPOT_CHANCE = 0.5; // so oft geht ein Tier zu einem Lieblingsplatz statt irgendwohin
const SPOT_REST = 1.8; // am Lieblingsplatz so viel länger stehen
const MOMENT_WAIT = [25, 70]; // Sekunden (nur sichtbar und in Ruhe gezählt) bis zum nächsten Moment
const QUIET_EVERY = [180, 360]; // Ruhephase im Gehege ungefähr so oft (Sekunden) ...
const QUIET_TIME = [35, 60]; // ... und so lang
const SPOTS_TTL = 30; // Lieblingsplätze so lange merken (Deko kann sich ändern)

// Schläfchen: diese Arten legen sich beim Ausruhen hin (Standbild <Bild>_sleep aus tools/sleep-sheets.py), über ihnen
// steigen „ZzZz“ auf. Andere Arten mit eigenem Schlafen (Fuchs, Katze, Löwe, Walross, Eisbär) machen das selbst.
// Varianten ohne eigenes Schlafbild (z. B. Oryx, schwarzer Wolf) bleiben stehen
const NAP = new Set(['deer', 'sheep', 'antelope', 'zebra', 'okapi', 'penguin', 'reindeer', 'tanuki', 'wolf']);
const NAP_AFTER = 1.2; // so lange (Sekunden) still stehen, dann hinlegen ...
const NAP_SHADE = 0.4; // ... in der Ruhephase immer, am Schattenplatz sonst mit dieser Wahrscheinlichkeit
const NAP_TIME = [10, 18]; // Sekunden (in der Ruhephase bis zu deren Ende)
const ZZZ_EVERY = 0.9; // so oft steigt ein Buchstabe auf (Z und z abwechselnd)

let nextId = 1;
const pens = new WeakMap(); // Gehege -> { spots, spotsAt, quietFrom, quietUntil }

function now(scene) {
  return scene.time.now / 1000;
}

function penState(scene, e) {
  let s = pens.get(e);
  if (!s) {
    const t = now(scene);
    s = { spots: null, spotsAt: -1e9, quietFrom: t + Phaser.Math.FloatBetween(60, 240), quietUntil: 0 };
    pens.set(e, s);
  }
  return s;
}

// Ruhephase in diesem Gehege? (die meisten stehen dann am Schatten und ruhen)
export function isQuiet(a) {
  const e = a.enclosure;
  if (!e) return false;
  const s = penState(a.scene, e);
  const t = now(a.scene);
  if (t >= s.quietFrom) {
    s.quietUntil = t + Phaser.Math.FloatBetween(...QUIET_TIME);
    s.quietFrom = s.quietUntil + Phaser.Math.FloatBetween(...QUIET_EVERY);
  }
  return t < s.quietUntil;
}

// Lieblingsplätze: freie Kacheln am Wasser ('water') und neben Bäumen, Felsen, Büschen, Spielzeug ('shade'),
// je Art höchstens zwei, möglichst weit auseinander
function spotsOf(scene, e) {
  const s = penState(scene, e);
  if (s.spots && now(scene) - s.spotsAt < SPOTS_TTL) return s.spots;
  const water = [];
  const shade = [];
  const free = (x, y) => !blockedAt(x, y, 14, 3);
  for (const { tx, ty } of e.tiles ?? []) {
    if (objectAt(tx, ty) || 'w~'.includes(charAt(tx, ty))) continue;
    const p = tileToWorld(tx, ty);
    if (!free(p.x, p.y)) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ c: charAt(tx + dx, ty + dy), o: objectAt(tx + dx, ty + dy) }));
    const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => 'w~'.includes(charAt(tx + dx, ty + dy)));
    if (wet) {
      const q = tileToWorld(tx + wet[0], ty + wet[1]);
      water.push({ ...p, type: 'water', wx: q.x, wy: q.y }); // (wx, wy: Mitte der Wasserkachel, dorthin trinkt es)
    }
    else if (near.some((n) => n.o && !n.o.fence && (n.o.solid || n.o.toy))) shade.push({ ...p, type: 'shade' });
  }
  const pick = (list, n) => {
    const out = [];
    for (const p of Phaser.Utils.Array.Shuffle([...list])) {
      if (out.length >= n) break;
      if (out.every((q) => Math.hypot(q.x - p.x, (q.y - p.y) * 2) > 90)) out.push(p);
    }
    return out;
  };
  s.spots = [...pick(water, 1), ...pick(shade, 3)];
  s.spotsAt = now(scene);
  return s.spots;
}

// im Streichelzoo (petting) keine Herde: dort sollen sich die Tiere für die Besucher gut verteilen
function inHerd(a) {
  return (!!a.kind.herd || HERD.has(a.species)) && !a.enclosure?.petting;
}

// Leittier der Herde: das älteste erwachsene Tier derselben Art im selben Gehege
function leaderOf(a) {
  let best = null;
  for (const b of a.scene.animals ?? []) {
    if (b.species !== a.species || b.state !== 'penned' || b.enclosure !== a.enclosure || b.baby) continue;
    b.lifeId ??= nextId++;
    if (!best || b.lifeId < best.lifeId) best = b;
  }
  return best;
}

// nächstes erwachsenes Tier derselben Art (für Tierbabys)
function parentOf(a) {
  let best = null;
  let bd = Infinity;
  for (const b of a.scene.animals ?? []) {
    if (b === a || b.species !== a.species || b.state !== 'penned' || b.enclosure !== a.enclosure || b.baby) continue;
    const d = Math.hypot(b.x - a.x, (b.y - a.y) * 2);
    if (d < bd) [best, bd] = [b, d];
  }
  return best;
}

function goToward(a, x, y, maxTime) {
  const d = Math.hypot(x - a.x, y - a.y);
  const direct = Math.atan2(y - a.y, x - a.x);
  // steht etwas im Weg (Baum, Teich): etwas schräger daran vorbei
  const probe = Math.min(d, 24);
  const turn = [0, 0.5, -0.5, 1, -1, 1.5, -1.5].find((t) => !a.blocked(a.x + Math.cos(direct + t) * probe, a.y + Math.sin(direct + t) * probe)) ?? 0;
  const angle = direct + turn;
  a.dirX = Math.cos(angle);
  a.dirY = Math.sin(angle);
  a.wanderTime = Math.max(0.3, Math.min(maxTime, d / a.kind.speed));
}

function rest(a, time) {
  a.dirX = 0;
  a.dirY = 0;
  a.wanderTime = time;
}

// Wohin als Nächstes im Gehege? Gibt true zurück, wenn es entschieden hat (sonst läuft es wie bisher irgendwohin).
// Hat die Art im Gehege einen eigenen Lieblingsort (zones in levels.js, z. B. Giraffen im Akazienhain), entscheidet das
// Einzel- bzw. Leittier wie bisher; die Herde folgt trotzdem.
export function penWander(a) {
  if (a.state !== 'penned' || !a.enclosure?.tiles) return false;
  a.lifeId ??= nextId++;
  const { restTime } = a.kind;
  // gerade erst entschieden und schon wieder gefragt: es ist gegen etwas gelaufen, dann irgendwohin (wie bisher)
  const t = now(a.scene);
  const stuck = t - (a.pickAt ?? -1) < 0.4;
  a.pickAt = t;
  if (stuck) {
    a.spotGoal = null;
    return false;
  }
  // Tierbaby: bleibt dicht bei einem Erwachsenen und macht, was es macht
  if (a.baby) {
    const p = parentOf(a);
    if (!p) return false;
    if (Math.hypot(p.x - a.x, (p.y - a.y) * 2) > BABY_R) goToward(a, p.x, p.y, 1.2);
    else if (!p.dirX && !p.dirY) rest(a, Phaser.Math.FloatBetween(0.6, 1.5));
    else return false;
    return true;
  }
  // Herde: Leittier entscheidet, die anderen folgen mit lockerem Abstand
  if (inHerd(a)) {
    const lead = leaderOf(a);
    if (lead && lead !== a) {
      a.herdSeen = lead.herdTick;
      const d = Math.hypot(lead.x - a.x, (lead.y - a.y) * 2);
      if (d > HERD_R) {
        goToward(a, lead.x + Phaser.Math.Between(-20, 20), lead.y + Phaser.Math.Between(-10, 10), 2.5);
      } else if (!lead.dirX && !lead.dirY) {
        rest(a, Math.max(0.5, lead.wanderTime + Phaser.Math.FloatBetween(-0.3, 1.2)));
      } else {
        const angle = Math.atan2(lead.dirY, lead.dirX) + Phaser.Math.FloatBetween(-0.35, 0.35);
        a.dirX = Math.cos(angle);
        a.dirY = Math.sin(angle);
        a.wanderTime = Math.max(0.4, lead.wanderTime + Phaser.Math.FloatBetween(-0.4, 0.3));
      }
      return true;
    }
  }
  if (inHerd(a)) {
    a.herdTick = (a.herdTick ?? 0) + 1; // Leittier: die Herde zieht kurz danach nach (siehe updateLife)
    // Nachzügler weit weg: kurz warten, bis die Herde aufgeschlossen hat
    const far = (a.scene.animals ?? []).some((b) => b !== a && b.species === a.species && b.state === 'penned' && b.enclosure === a.enclosure && !b.baby && Math.hypot(b.x - a.x, (b.y - a.y) * 2) > HERD_R * 1.6);
    if (far && !a.spotGoal && Math.random() < 0.7) {
      rest(a, Phaser.Math.FloatBetween(2, 4));
      return true;
    }
  }
  if (a.enclosure.zones?.[a.species]) return false;
  return ownWander(a, restTime);
}

// Einzeltier oder Leittier: Lieblingsplatz, Ruhephase, sonst wie bisher
function ownWander(a, restTime) {
  const quiet = isQuiet(a);
  // am Lieblingsplatz angekommen: länger dort bleiben (am Wasser trinkt es, siehe updateLife)
  const goal = a.spotGoal;
  if (goal) {
    a.spotGoal = null;
    if (Math.hypot(goal.x - a.x, (goal.y - a.y) * 2) < 30) {
      a.atSpot = goal;
      if (goal.wx !== undefined) {
        a.faceX = Math.sign(goal.wx - a.x) || a.faceX;
        a.faceY = Math.sign(goal.wy - a.y) || a.faceY;
      }
      rest(a, Phaser.Math.FloatBetween(...restTime) * (quiet ? SPOT_REST * 2 : SPOT_REST));
      return true;
    }
  }
  const was = a.atSpot;
  a.atSpot = null;
  a.lifeAngle = 0;
  if (was?.type === 'water' && SHAKE.has(a.species) && Math.random() < 0.35) a.lifeShakeSoon = true;
  const spots = spotsOf(a.scene, a.enclosure);
  if (quiet) {
    // Ruhephase: zum Schatten und dort ruhen, sonst einfach stehen bleiben
    const shade = spots.filter((p) => p.type === 'shade');
    const p = shade.length ? shade.reduce((m, q) => (Math.hypot(q.x - a.x, q.y - a.y) < Math.hypot(m.x - a.x, m.y - a.y) ? q : m)) : null;
    if (p && Math.hypot(p.x - a.x, (p.y - a.y) * 2) > 30 && Math.random() < 0.85) {
      a.spotGoal = p;
      goToward(a, p.x, p.y, 10);
    } else rest(a, Phaser.Math.FloatBetween(...restTime) * 2.5);
    return true;
  }
  // Streichelzoo: seltener zu den Plätzen und dort weiter gestreut, damit sich alle für die Besucher verteilen
  const petting = !!a.enclosure.petting;
  if (spots.length && Math.random() < (petting ? 0.15 : SPOT_CHANCE)) {
    const others = spots.filter((p) => p !== was);
    const p = Phaser.Utils.Array.GetRandom(others.length ? others : spots);
    const r = petting ? 40 : 10;
    const loose = { x: p.x + Phaser.Math.Between(-r, r), y: p.y + Phaser.Math.Between(-r / 2, r / 2), type: p.type };
    a.spotGoal = p.type === 'water' ? { ...p } : a.blocked(loose.x, loose.y) ? { ...p } : loose;
    goToward(a, a.spotGoal.x, a.spotGoal.y, 10);
    return true;
  }
  return false;
}

// Ist das Tier frei für einen Moment? (im Gehege, macht nichts Eigenes, zeigt sein normales Bild; es darf dabei laufen)
function isFree(a) {
  if (a.state !== 'penned' || a.feed || a.visit || a.fetch || a.play || a.petted || a.companion || a.toyLift) return false;
  if (BUSY.some((k) => a[k])) return false;
  const tex = a.sprite.texture.key;
  return tex === a.baseTexture() || Object.values(a.animSet() ?? {}).includes(tex);
}

function onScreen(a) {
  const v = a.scene.cameras.main.worldView;
  return a.x > v.x - 40 && a.x < v.right + 40 && a.y > v.y - 40 && a.y < v.bottom + 60;
}

// jedes Bild: gibt zurück, ob es sich bewegt (rennt), oder null, wenn es gerade nichts Besonderes macht
export function updateLife(a, dt) {
  if (a.state !== 'penned') {
    if (a.penMoment) endLife(a);
    return null;
  }
  // Herde: hat das Leittier neu entschieden, zieht das Tier kurz danach nach
  if (inHerd(a) && !a.baby && a.herdSeen !== undefined && !a.spotGoal) {
    // Leittier höchstens einmal pro Sekunde suchen (Tablet)
    const t = now(a.scene);
    if (!a.leadAt || t - a.leadAt > 1) [a.lead, a.leadAt] = [leaderOf(a), t];
    const lead = a.lead;
    if (lead && lead !== a && lead.herdTick !== a.herdSeen) {
      a.herdSeen = lead.herdTick;
      a.wanderTime = Math.min(a.wanderTime, Phaser.Math.FloatBetween(0.2, 1.0));
    }
  }
  if (a.penMoment?.type === 'run') return updateRun(a, dt);
  if (a.penMoment) return null; // hüpft oder schüttelt sich gerade (Tween), steht dabei
  const nap = updateNap(a, dt);
  if (nap !== null) return nap;
  if (!onScreen(a) || !isFree(a)) return null;
  // am Wasser: trinken (Kopf nickt), dabei ab und zu ein Ring auf dem Wasser
  if (a.atSpot?.type === 'water') {
    a.drinkTime = (a.drinkTime ?? 0) + dt;
    a.lifeAngle = Math.sin(a.drinkTime * 5) * 3;
    a.ringWait = (a.ringWait ?? 1) - dt;
    if (a.ringWait <= 0) {
      a.ringWait = Phaser.Math.FloatBetween(1.2, 2.4);
      ripple(a);
    }
    return null;
  }
  if (a.lifeAngle) a.lifeAngle = 0;
  if (a.lifeShakeSoon && (a.moveSpeed ?? 0) < 3) {
    a.lifeShakeSoon = false;
    shake(a);
    return null;
  }
  a.lifeWait = (a.lifeWait ?? Phaser.Math.FloatBetween(5, MOMENT_WAIT[1])) - dt;
  if (a.lifeWait > 0 || isQuiet(a)) return null;
  a.lifeWait = Phaser.Math.FloatBetween(...MOMENT_WAIT);
  const still = (a.moveSpeed ?? 0) < 3; // schütteln nur im Stehen
  const can = [];
  if (HOP.has(a.species)) can.push('hop');
  if (RUN.has(a.species) && !a.baby) can.push('run', 'run');
  if (SHAKE.has(a.species) && still) can.push('shake');
  const what = can.length ? Phaser.Utils.Array.GetRandom(can) : null;
  if (what === 'hop') hop(a, Phaser.Math.Between(1, 3));
  else if (what === 'shake') shake(a);
  else if (what === 'run') startRun(a);
  return null;
}

// ---- Schläfchen ----
// Bild zum Schlafen (mit Fellfarbe deren umgefärbtes, siehe coats.js) oder null, wenn es keins gibt
export function napKey(a) {
  if (!NAP.has(a.species)) return null;
  const key = `${a.baseTexture()}_sleep`;
  return a.scene.textures.exists(key) ? key : null;
}

// darf es (weiter) schlafen? Alles, was es anspricht (Futter, Besucher, Henrik, Spielzeug), weckt es
export function napOk(a) {
  if (a.state !== 'penned' || a.feed || a.visit || a.fetch || a.play || a.petted || a.companion || a.toyLift || a.penMoment || a.phase) return false;
  return !BUSY.some((k) => a[k]) && !!napKey(a);
}

// gibt false zurück, solange es schläft (dann läuft sonst nichts), sonst null
function updateNap(a, dt) {
  if (a.napping) {
    a.napTime -= dt;
    if (!napOk(a) || a.napTime <= 0) {
      wakeUp(a);
      a.pickWander();
      return null;
    }
    a.zzzIn = (a.zzzIn ?? 0) - dt;
    if (a.zzzIn <= 0 && onScreen(a)) {
      a.zzzIn = ZZZ_EVERY;
      a.zzzBig = !a.zzzBig;
      zzz(a, a.zzzBig);
    }
    return false;
  }
  // steht es eine Weile still (Ruhephase oder Schattenplatz): hinlegen
  if (a.dirX || a.dirY || (a.moveSpeed ?? 0) >= 3 || a.atSpot?.type === 'water' || !NAP.has(a.species) || !isFree(a)) {
    a.stillFor = 0;
    a.napAsked = false;
    return null;
  }
  a.stillFor = (a.stillFor ?? 0) + dt;
  if (a.stillFor < NAP_AFTER || a.napAsked) return null;
  a.napAsked = true; // je Pause nur einmal fragen
  const quiet = isQuiet(a);
  if (!quiet && !(a.atSpot?.type === 'shade' && Math.random() < NAP_SHADE)) return null;
  if (!napOk(a)) return null;
  const left = quiet ? penState(a.scene, a.enclosure).quietUntil - now(a.scene) : 0;
  a.napping = true;
  a.napTime = Math.max(Phaser.Math.FloatBetween(...NAP_TIME), left + Phaser.Math.FloatBetween(0, 5));
  a.zzzIn = Phaser.Math.FloatBetween(0.3, 1);
  a.lifeAngle = 0;
  return false;
}

export function wakeUp(a) {
  a.napping = false;
  a.stillFor = 0;
}

// ein Z steigt über dem Kopf auf und verblasst (abwechselnd groß und klein: ZzZz)
function zzz(a, big) {
  const h = (a.sprite.displayHeight ?? 30) * a.sprite.originY * 0.72;
  const x = a.x + a.faceX * 6 + (big ? 0 : a.faceX * 4);
  const y = a.y - h;
  const z = a.scene.add
    .text(x, y, big ? 'Z' : 'z', { fontFamily: 'Trebuchet MS, Arial', fontSize: big ? '12px' : '10px', fontStyle: 'bold', color: '#ffffff', stroke: '#2b1d14', strokeThickness: 3, resolution: 4 })
    .setOrigin(0.5)
    .setDepth(100000);
  a.scene.tweens.add({
    targets: z,
    x: x + a.faceX * 8,
    y: y - 16,
    scale: 1.4,
    alpha: 0,
    duration: 1800,
    ease: 'Sine.easeOut',
    onComplete: () => z.destroy(),
  });
}

function endLife(a) {
  a.penMoment = null;
  a.lifeAngle = 0;
  a.jumpLift = 0;
}

// Freudensprung: kleine Hüpfer (jumpLift, siehe placeSprite), Staub bei der Landung
export function hop(a, n = 1, onDone) {
  a.penMoment = { type: 'hop' };
  a.jumpLift = 0;
  const h = Math.min(10, 4 + (a.sprite.displayHeight ?? 30) * 0.12);
  a.scene.tweens.add({
    targets: a,
    jumpLift: h,
    duration: 170,
    yoyo: true,
    repeat: n - 1,
    ease: 'Sine.easeOut',
    onRepeat: () => dust(a, 3),
    onComplete: () => {
      dust(a, 4);
      endLife(a);
      onDone?.();
    },
  });
}

// sich schütteln: schnelles Hin und Her, ein paar Tropfen
export function shake(a) {
  a.penMoment = { type: 'shake' };
  const o = { k: 0 };
  a.scene.tweens.add({
    targets: o,
    k: 1,
    duration: 650,
    onUpdate: () => (a.lifeAngle = Math.sin(o.k * Math.PI * 9) * 9 * (1 - o.k * 0.6)),
    onComplete: () => endLife(a),
  });
  const top = a.y - Math.max(12, (a.sprite.displayHeight ?? 30) * 0.5);
  for (let i = 0; i < 7; i++) {
    const d = a.scene.add.circle(a.x + Phaser.Math.Between(-8, 8), top, Phaser.Math.FloatBetween(1, 1.8), 0xd8f2ff, 0.9).setDepth(a.y + 1);
    a.scene.tweens.add({
      targets: d,
      x: d.x + Phaser.Math.Between(-18, 18),
      y: top + Phaser.Math.Between(-10, 6),
      alpha: 0,
      delay: Phaser.Math.Between(0, 250),
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => d.destroy(),
    });
  }
}

// Rennen: ein kurzer Spurt in eine Richtung, an Hindernissen schräg daran vorbei, am Ende manchmal ein Hüpfer
function startRun(a) {
  a.penMoment = { type: 'run', time: Phaser.Math.FloatBetween(1.2, 2.2), angle: Math.random() * Math.PI * 2, dust: 0 };
}

function updateRun(a, dt) {
  const r = a.penMoment;
  r.time -= dt;
  if (r.time <= 0) {
    endLife(a);
    if (HOP.has(a.species) && Math.random() < 0.5) hop(a, 1);
    a.pickWander();
    return false;
  }
  const step = Math.max(a.kind.speed * 2.6, 55) * dt;
  for (const turn of [0, 0.6, -0.6, 1.3, -1.3, 2.2, -2.2, Math.PI]) {
    if (a.move(Math.cos(r.angle + turn) * step, Math.sin(r.angle + turn) * step)) {
      r.angle += turn * 0.6;
      r.dust -= dt;
      if (r.dust <= 0) {
        r.dust = 0.12;
        dust(a, 1);
      }
      return true;
    }
  }
  endLife(a);
  return false;
}

// Staubwölkchen an den Füßen
export function dust(a, n) {
  const scene = a.scene;
  for (let i = 0; i < n; i++) {
    const c = scene.add.circle(a.x + Phaser.Math.Between(-6, 6), a.y + Phaser.Math.Between(-1, 2), Phaser.Math.FloatBetween(2, 3.5), 0xe8dcc0, 0.6).setDepth(a.y - 0.4);
    scene.tweens.add({ targets: c, y: c.y - Phaser.Math.Between(2, 6), scale: 1.8, alpha: 0, duration: 450, ease: 'Quad.easeOut', onComplete: () => c.destroy() });
  }
}

// Ring auf dem Wasser vor dem trinkenden Tier
function ripple(a) {
  const s = a.atSpot;
  const x = s?.wx !== undefined ? a.x + (s.wx - a.x) * 0.45 : a.x + a.faceX * 10;
  const y = s?.wy !== undefined ? a.y + (s.wy - a.y) * 0.45 : a.y + a.faceY * 5;
  const ring = a.scene.add.ellipse(x, y, 8, 3).setStrokeStyle(1, 0xffffff, 0.7).setDepth(a.y - 1);
  a.scene.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
}
