// Bauen-Taste und Setzen-Modus im Tierpark (Plan: docs/plan-deko.md, Daten: src/world/decor.js und shops.js). Die Leiste
// ist eine durchgehende Liste mit Zwischenüberschriften (Buden, Deko mit dem Spielzeug der Gehege); „Bestellen“ öffnet den
// Katalog (GardenScene.openCatalog).
// Die Deko-Taste (bzw. B) schaltet den Setzen-Modus an und aus. Solange er an ist: rechts eine Leiste mit allen Deko-Teilen,
// die man besitzt, „Aufheben“ und „Fertig“ (am PC auch 1–9, 0 = Aufheben, Esc = Fertig); ein grüner Rahmen ums Bild; auf
// der Karte sind alle Kacheln, auf die man bauen darf, leicht grün (Flächen künftiger Gehege orange). Auf der Kachel vor
// Henrik zeigt eine durchsichtige Vorschau, ob das Teil dort passt (grün) oder nicht (rot); die Aktionstaste setzt es, und
// es bleibt ausgewählt, solange man noch welche hat. Steht vor ihm eine gesetzte Deko, hebt die Aktionstaste sie auf (sie
// wandert zurück in die Deko-Taste und ist gleich ausgewählt, so stellt man sie schnell um). Nur im Tierpark.
// Gehege gestalten: in gestaltbaren Gehegen Natur-Deko setzen (begrenzt) und das Spielzeug umstellen; aufgehobenes
// Spielzeug passt nur in Gehege, zu denen es gehört. Der Tierfreund des Geheges freut sich (Herz, nur ein Effekt).
// Drehen (Knopf links neben der Leiste, am PC R): das Teil gespiegelt setzen, so zeigt z. B. eine Bank in die andere
// Schrägrichtung (die Bilder gibt es nur aus einer Blickrichtung). Gespeichert als flip an der Deko bzw. am Spielzeug.
// Buden umstellen: eine gebaute Bude aufheben und an einen anderen Platz direkt am Weg setzen (im selben Abschnitt, mit
// Abstand zu anderen Buden). Danach baut sich der Abschnitt kurz neu auf (die Besucher berechnen ihre Wege und Plätze
// vor den Buden beim Aufbau), und der Setzen-Modus geht weiter.
import { tr } from '../i18n.js';
import { game } from '../state.js';
import { tileToWorld, worldToTile, TILE_W, TILE_H } from './iso.js';
import { isPark } from './levels.js';
import { LEVEL, LEVEL_ID, ENCLOSURES, EXITS, GATE_TILES, CAR_BODIES, MAP_W, MAP_H, OBJECTS, charAt, isBlocked, buildingAt, nearSegment, reservedAt, reservedTiles, anyPenAt, setTileChar } from './map.js';
import { countPark } from '../sessions.js';
import { DECOR, FLOOR_FILL, decorKey, isRug, fillChar, ensureDecor, giveDecor, placedIn, isToy, isBooth, itemDef, designablePen, toyFits, penDecorMax, decorTiles, footprint, furnitureLook } from './decor.js';
import { isEventsOpen } from '../ui/eventsPanel.js';
import { boothTiles, builtOn, pickUpBooth, placeBooth, shopsIn, slotsIn, storedBooths } from './shops.js';
import { isFriend } from './friends.js';
import { isTouch } from '../ui/touch.js';
import { activeId as storyActiveId } from '../story/story.js';

const OK = 0x5fd05a;
const NO = 0xe0503c;
const PICK = 0xffd84a;
const RESERVED = 0xffa040;
const FREE = 0x9dff8a; // Kacheln, auf die man bauen darf
const KEEP_CLEAR = 6; // so viel Platz (Welt-Pixel, Höhe doppelt) bleibt um eine feste Deko frei zu Henrik und den Tieren
const BOOTH_GAP = 3; // so viele Kacheln liegen mindestens zwischen zwei Buden (sonst teilen sie sich die Plätze davor)
const ROOM = 'house'; // Haupthaus: dort nur Möbel (indoor in decor.js), draußen nur Deko

// Hinweis: mit einem Teil in der Hand auf etwas Gesetztes gezeigt (aufheben geht nur mit der Hand)
// Ziehen mit dem Finger: so weit (CSS-Pixel) über dem Finger liegt das mitgeführte Teil (sonst verdeckt ihn der Finger),
// und ab so viel Bewegung zählt es als Ziehen statt Antippen
const LIFT = 36;
const DRAG_PX = 12;
// Finger so lange (ms) ruhig auf einem gesetzten Teil: es hebt sich und hängt am Finger (Tablet und Handy, mit und ohne Hand)
const HOLD_MS = 350;

const TAKEN = () => (isTouch() ? tr('Gedrückt halten zum Verschieben', 'Hold to move') : tr('Zum Aufheben erst die Hand wählen', 'Choose the hand to pick up'));

// Blickrichtung der Spielfigur (faceX, faceY: schräg im Bild) → Nachbarkachel
const AHEAD = { '1,1': [1, 0], '-1,1': [0, 1], '1,-1': [0, -1], '-1,-1': [-1, 0] };

export default class DecorMode {
  constructor(scene) {
    this.scene = scene;
    this.on = false;
    this.sel = null; // ausgewähltes Deko-Teil (null: nichts in der Hand)
    this.picking = false; // Hand gewählt: nur dann hebt die Aktionstaste bzw. ein Klick Gesetztes auf (nie mit einem Teil in der Hand)
    this.state = null; // { tx, ty, kind: 'place' | 'no' | 'pick' | 'none', entry }
    this.key = '';
    this.marks = null;
    this.ghost = null;
    this.lit = null; // hervorgehobene Deko (zum Aufheben)
    this.reserved = null;
    this.keepOut = null;
    this.free = null; // Overlay: Kacheln, auf die man bauen darf
    this.onKey = (e) => this.keyDown(e);
    this.drag = null; // Finger zieht gerade ein Teil übers Bild: { cx, cy, moved, carried, bar }
    this.barDrag = null; // Finger liegt auf einem Teil der Leiste (wird zum Ziehen, sobald er die Leiste verlässt)
    this.onBarMove = (e) => this.barMove(e);
    this.onBarUp = (e) => this.barUp(e);
    window.addEventListener('pointermove', this.onBarMove);
    window.addEventListener('pointerup', this.onBarUp);
    window.addEventListener('pointercancel', this.onBarUp);
    this.bar = document.getElementById('decor-bar');
    this.frame = document.getElementById('decor-frame');
    this.flip = false; // gespiegelt setzen
    this.rot = 0; // Möbel im Haupthaus: Ansicht 0–3 (statt Spiegeln, siehe tools/furniture-sprites.py)
    this.bar.classList.remove('show');
    this.frame.classList.remove('show');
    // gespeicherte Drehung der gesetzten Deko und des Spielzeugs (die Karte zeichnet sie ungedreht)
    for (const d of [...placedIn(LEVEL_ID), ...Object.values(ensureDecor().toys).flat()]) if (d.flip && !DECOR[d.id]?.indoor) scene.decorImages.get(`${d.tx},${d.ty}`)?.setFlipX(true);
    scene.events.once('shutdown', () => {
      window.removeEventListener('keydown', this.onKey, true);
      window.removeEventListener('pointermove', this.onBarMove);
      window.removeEventListener('pointerup', this.onBarUp);
      window.removeEventListener('pointercancel', this.onBarUp);
      this.bar.classList.remove('show');
      this.frame.classList.remove('show');
    });
  }

  get enabled() {
    return isPark(LEVEL_ID) || LEVEL_ID === ROOM;
  }

  // Deko-Taste: Setzen-Modus an bzw. aus
  toggle() {
    if (!this.enabled) return;
    if (this.on) this.stop();
    else this.start(this.entries()[0] ?? null);
  }

  // Teile, die man gerade hat: Buden dieses Abschnitts (bestellt bzw. aufgehoben) bzw. Deko (wie in DECOR, danach
  // Spielzeug); ohne Angabe beides, Buden zuerst
  booths() {
    if (LEVEL_ID === ROOM) return [];
    return storedBooths(LEVEL_ID).map((b) => 'booth:' + b.id).filter((id) => itemDef(id));
  }

  decos() {
    const owned = ensureDecor().owned;
    if (LEVEL_ID === ROOM) return Object.keys(DECOR).filter((id) => DECOR[id].indoor && owned[id] > 0);
    return [...Object.keys(DECOR).filter((id) => !DECOR[id].indoor), ...Object.keys(owned).filter(isToy).sort()].filter((id) => owned[id] > 0 && itemDef(id));
  }

  entries() {
    return [...this.booths(), ...this.decos()];
  }

  // so viele hat man von diesem Teil (eine aufgehobene Bude: 1)
  count(id) {
    if (isBooth(id)) return storedBooths(LEVEL_ID).some((b) => 'booth:' + b.id === id) ? 1 : 0;
    return ensureDecor().owned[id] ?? 0;
  }

  // Leiste rechts: Teile mit Anzahl, Aufheben, Fertig (Tasten 1–9, 0, Esc am PC)
  renderBar() {
    // eine durchgehende Liste: Zwischenüberschrift Buden bzw. Deko (nur, wenn dort etwas liegt), dann Aufheben; die
    // Zifferntasten zählen über die ganze Liste
    // ein Teil, das der Finger gerade aus der Leiste zieht, bleibt (unsichtbar) in der Seite, bis er loslässt: sonst
    // landet das Ende der Berührung an einem gelöschten Element, Phaser bekommt es nie mit und nimmt danach keine
    // Finger mehr an
    const held = this.barDrag?.el;
    if (held && this.bar.contains(held)) {
      held.style.display = 'none';
      document.body.appendChild(held);
    }
    let i = 0;
    const item = (id) => `<button class="decor-item${id === this.sel ? ' sel' : ''}" data-id="${id}">
        ${i < 9 ? `<span class="key">${++i}</span>` : ''}<span class="n">${this.count(id)}</span>
        <img src="assets/${itemDef(id).key}.png" alt=""><span class="name">${itemDef(id).name}</span></button>`;
    const section = (title, ids) => (ids.length ? `<div class="decor-head">${title}</div>${ids.map(item).join('')}` : '');
    // (die Hand zuerst: sonst liegt sie am Tablet ganz unten in der Liste, und man muss erst hinscrollen)
    const items = `<button class="decor-item${this.picking ? ' sel' : ''}" data-id="@pick"><span class="key">0</span>
        <img src="assets/hand.png" alt=""><span class="name">${tr('Aufheben', 'Pick up')}</span></button>`
      + section(tr('Buden', 'Stands'), this.booths()) + section(LEVEL_ID === ROOM ? tr('Möbel', 'Furniture') : tr('Deko', 'Decor'), this.decos());
    const none = LEVEL_ID === ROOM ? tr('Möbel gibt es unter „Bestellen“.', 'Order furniture below.') : tr('Buden und Deko gibt es unter „Bestellen“.', 'Order stands and decor below.');
    const empty = this.entries().length ? '' : `<div class="decor-empty">${none}</div>`;
    this.bar.innerHTML = `<button class="decor-turn${this.canTurn() ? '' : ' off'}${this.sel && this.turned() ? ' on' : ''}" data-id="@turn"><span class="turn-icon">↻</span>${tr('Drehen', 'Turn')}<span class="key">R</span></button>
      <div class="decor-title">${tr('Bauen', 'Build')}</div>
      ${empty}<div class="decor-items">${items}</div>
      <button class="decor-order" data-id="@order">${tr('Bestellen', 'Order')}</button>
      <button class="decor-done" data-id="@done">${tr('Fertig', 'Done')}<span class="key">Esc</span></button>`;
    this.bar.querySelectorAll('[data-id]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        if (performance.now() < (this.noClickUntil ?? 0)) return; // (gerade aus der Leiste aufs Bild gezogen)
        this.choose(el.dataset.id);
      };
      // Tablet und Handy: ein Teil aus der Leiste aufs Bild ziehen (kurz antippen wählt es nur aus)
      if (el.classList.contains('decor-item') && !el.dataset.id.startsWith('@')) {
        el.onpointerdown = (e) => {
          if (e.pointerType === 'mouse' || this.barDrag) return;
          const list = this.bar.querySelector('.decor-items');
          const row = getComputedStyle(list).flexDirection === 'row'; // Handy: Leiste quer unten, sonst hochkant rechts
          this.barDrag = { el, id: el.dataset.id, pid: e.pointerId, x0: e.clientX, y0: e.clientY, list, row, scroll0: row ? list.scrollLeft : list.scrollTop, mode: null };
        };
      }
    });
    this.scene.updateBuildHint?.();
  }

  choose(id) {
    id ??= '@pick';
    if (id === '@done') return this.stop();
    if (id === '@turn') return this.turn();
    if (id === '@order') return this.scene.openCatalog();
    this.sel = id === '@pick' ? null : id;
    this.picking = id === '@pick';
    this.loadArt();
    this.key = '';
    this.drawFree(); // (was wo passt, hängt vom Teil ab: Spielzeug nur in sein Gehege)
    this.renderBar();
    this.update();
  }

  // Tasten im Setzen-Modus: 1–9 Teil wählen, 0 Aufheben, Esc Fertig
  keyDown(e) {
    if (!this.on || e.repeat || isEventsOpen()) return; // (Katalog offen: die Tasten gehören ihm, Esc schließt nur ihn)
    if (e.key === 'Escape') {
      e.preventDefault();
      this.escAt = e.timeStamp; // die Szene öffnet bei diesem Druck nicht das Menü
      this.stop();
      return;
    }
    if (e.key === '0') return this.choose('@pick');
    if (e.key === 'r' || e.key === 'R') return this.turn();
    const n = Number(e.key);
    const list = this.entries();
    if (n >= 1 && n <= 9 && list[n - 1]) this.choose(list[n - 1]);
  }

  // pick: Hand gewählt (ohne Angabe: wenn es nichts zu setzen gibt)
  start(id, pick = undefined) {
    this.sel = id && this.count(id) > 0 ? id : null;
    this.picking = !this.sel && (pick ?? true);
    this.loadArt();
    if (!this.on) {
      this.on = true;
      if (LEVEL_ID === ROOM) game.houseBuildSeen = true; // (Haupthaus: die Bauen-Taste blinkt nicht mehr)
      game.buildOpen = true; // (Mavis Buden-Aufgabe: erst nach „Fertig“ erledigt)
      this.keepOut = this.keepOutTiles();
      this.drawReserved();
      this.drawFree();
      document.getElementById('btn-decor')?.classList.add('on');
      this.bar.classList.add('show');
      this.frame.classList.add('show');
      window.addEventListener('keydown', this.onKey, true);
    }
    this.renderBar();
    this.key = '';
    this.update();
    this.scene.updateShowcaseHints?.(); // (im Setzen-Modus keine Trophäen-Hinweise)
  }

  stop() {
    if (!this.on) return;
    this.on = false;
    this.hover = null;
    if (this.drag?.grab) this.putBack(this.drag.grab); // (gerade ein Teil am Finger: zurück an seinen Platz)
    this.drag = null;
    clearTimeout(this.holdTimer);
    this.barDrag = null;
    this.sel = null;
    this.state = null;
    this.key = '';
    this.clearPreview();
    this.reserved?.destroy();
    this.reserved = null;
    this.free?.destroy();
    this.free = null;
    document.getElementById('btn-decor')?.classList.remove('on');
    this.bar.classList.remove('show');
    this.frame.classList.remove('show');
    window.removeEventListener('keydown', this.onKey, true);
    game.buildOpen = false;
    this.scene.updateBuildHint?.();
    this.scene.updateShowcaseHints?.();
    this.scene.mavi?.check(); // (Buden-Aufgabe: jetzt erledigt, wenn eine Bude steht)
    this.scene.saveGame();
    this.scene.updateToolbar();
  }

  // jedes Bild: Kachel vor Henrik prüfen und die Vorschau zeichnen (nur wenn sich etwas geändert hat)
  // Maus am PC: die Vorschau folgt dem Mauszeiger (Weltpunkt; null: wieder die Kachel vor Henrik). Läuft Henrik los,
  // gilt wieder die Kachel vor ihm, bis die Maus sich bewegt
  hoverAt(w) {
    this.hover = w;
    if (this.on) this.update();
  }

  update() {
    if (!this.on) return;
    const p = this.scene.player;
    if (this.hover && p.moving && !this.drag) this.hover = null; // (beim Ziehen mit dem Finger bleibt die Vorschau am Finger)
    // Tablet und Handy: keine Vorschau vor der Figur (sonst fummelt man mit dem Joystick, statt zu tippen oder zu ziehen);
    // sie erscheint nur unter dem Finger
    if (isTouch() && !this.hover) {
      const key = `touch,${this.sel},${this.picking},${this.count(this.sel)}`;
      if (key === this.key) return;
      this.key = key;
      this.state = { kind: 'none' };
      this.drawPreview();
      this.scene.updateToolbar();
      return;
    }
    const here = worldToTile(p.x, p.y);
    const [dx, dy] = this.hover ? [0, 0] : AHEAD[`${p.faceX},${p.faceY}`] ?? [0, 1]; // (Maus: große Teile wachsen von der Kachel unter dem Zeiger nach hinten)
    const { tx, ty } = this.hover ? worldToTile(this.hover.x, this.hover.y) : { tx: here.tx + dx, ty: here.ty + dy };
    this.dir = [dx, dy];
    const busy = !this.hover && this.scene.decorBusy(); // (die Maus setzt auch neben dem Computer, der Futterkiste …)
    const key = `${tx},${ty},${this.sel},${busy},${this.count(this.sel)},${this.rot},${!!this.hover}`;
    if (key === this.key) return;
    this.key = key;
    const entry = this.picking ? this.entryAt(tx, ty) ?? (this.hover ? this.entryUnder(this.hover.x, this.hover.y) : null) : null;
    const taken = !this.picking && !!this.sel && !isRug(this.sel) && this.occupied(tx, ty); // (mit einem Teil in der Hand: dort steht schon etwas; Teppiche dürfen darunter)
    let kind = 'none';
    let full = false;
    if (busy) kind = 'no';
    else if (entry) kind = 'pick'; // (nur mit der Hand)
    else if (this.sel) {
      kind = this.canPlace(tx, ty, this.sel) ? 'place' : 'no';
      const pen = anyPenAt(tx, ty);
      full = kind === 'no' && !isToy(this.sel) && designablePen(pen) && !!DECOR[this.sel]?.pen && this.penDecor(pen) >= penDecorMax(pen);
    }
    const why = kind === 'no' && !busy && taken ? TAKEN() : kind === 'no' && !busy && isBooth(this.sel) ? this.boothProblem(tx, ty, this.sel) : null;
    this.state = { tx, ty, kind, entry, full, why, block: this.sel && kind !== 'pick' ? this.block(tx, ty, this.sel) : null };
    this.drawPreview();
    this.scene.updateToolbar();
  }

  // Bild des gewählten Teils noch nicht geladen (Deko aus einer anderen Welt)? Kurz laden, dann die Vorschau neu
  loadArt() {
    const key = this.sel && itemDef(this.sel)?.key;
    if (key && !this.scene.textures.exists(key)) this.scene.ensureDecorArt(key, () => {
      this.key = '';
      this.update();
    });
  }

  // Möbel (indoor) drehen sich durch ihre Ansichten, alles andere wird gespiegelt
  indoor(id = this.sel) {
    return !!DECOR[id]?.indoor;
  }

  turnable(id = this.sel) {
    return !this.indoor(id) || (DECOR[id]?.views ?? 1) > 1;
  }

  // zuletzt gesetztes bzw. verschobenes Teil, das noch dort steht und sich drehen lässt (Touch: nach dem Ziehen ist
  // nichts mehr in der Hand – „Drehen“ dreht dann dieses Teil an Ort und Stelle), sonst null
  lastEntry() {
    const lp = this.lastPlaced;
    if (!lp) return null;
    const entry = this.entryAt(lp.tx, lp.ty);
    return entry && !entry.booth && entry.id === lp.id && entry.item.tx === lp.tx && entry.item.ty === lp.ty && this.turnable(entry.id) ? entry : null;
  }

  canTurn() {
    return this.sel ? this.turnable() : !!this.lastEntry();
  }

  turned() {
    return this.indoor() ? this.rot > 0 : this.flip;
  }

  // Drehen: Möbel in die nächste Ansicht (eine Vierteldrehung), anderes Teil gespiegelt (bzw. wieder normal) setzen
  turn() {
    if (!this.sel) return this.turnLast();
    if (!this.turnable()) return;
    if (this.indoor()) this.rot = (this.rot + 1) % DECOR[this.sel].views;
    else this.flip = !this.flip;
    this.key = '';
    this.renderBar();
    this.update();
  }

  // das zuletzt gesetzte Teil an Ort und Stelle drehen (aufheben, drehen, an dieselbe Stelle; passt es gedreht nicht,
  // bleibt es, wie es war). Danach ist wieder gewählt, was vorher gewählt war
  turnLast() {
    const entry = this.lastEntry();
    if (!entry) return;
    const back = { sel: this.sel, picking: this.picking, flip: this.flip, rot: this.rot };
    const at = { tx: entry.item.tx, ty: entry.item.ty };
    this.pickUp(entry);
    const was = { flip: this.flip, rot: this.rot };
    if (this.indoor()) this.rot = (this.rot + 1) % DECOR[this.sel].views;
    else this.flip = !this.flip;
    this.dir = [0, 0];
    // (nur der Platz zählt, nicht Henrik oder Tiere daneben: es steht ja schon dort)
    const fits = this.block(at.tx, at.ty, this.sel).tiles.every((t) => this.freeTile(t.tx, t.ty, this.sel));
    if (!fits) {
      Object.assign(this, was);
      this.tapNo(at.tx, at.ty, tr('Gedreht passt es hier nicht', 'It does not fit here turned'));
    }
    this.place(at.tx, at.ty, this.sel);
    this.restore(back);
  }

  // Aktionstaste im Setzen-Modus (die Aktionen am Ort – Schild, Futterhaus … – kommen vorher dran); true: erledigt
  act() {
    if (!this.on || !this.state) return false;
    const { tx, ty, kind, entry } = this.state;
    if (kind === 'place') this.place(tx, ty, this.sel);
    else if (kind === 'pick') this.pickUp(entry);
    else if (kind === 'no' && this.ghost) this.scene.tweens.add({ targets: this.ghost, x: this.ghost.x + 3, duration: 50, yoyo: true, repeat: 2 });
    else if (kind === 'none' && isTouch()) this.scene.showToast(this.sel ? tr('Aufs Bild tippen oder hinziehen', 'Tap the spot or drag it there') : tr('Teil antippen oder gedrückt halten und ziehen', 'Tap an item, or hold and drag it'));
    return true;
  }

  // Antippen, Anklicken bzw. Loslassen nach dem Ziehen (Weltpunkt): gesetzte Deko aufheben bzw. das gewählte Teil dorthin
  // setzen – überall im Bild, ohne Reichweite um Henrik. Getroffen zählt die Kachel unter dem Finger oder das Bild einer
  // gesetzten Deko (z. B. die Krone eines Baums). Große Teile (2×2) wachsen wie die Vorschau unter dem Zeiger nach hinten.
  // Geht es nicht, blinkt die Kachel rot mit kurzem Hinweis. true: gesetzt
  tap(wx, wy) {
    if (!this.on) return false;
    const { tx, ty } = worldToTile(wx, wy);
    if (!this.picking) {
      if (!this.sel) return this.tapNo(tx, ty, this.entryAt(tx, ty) || this.entryUnder(wx, wy) ? TAKEN() : tr('Wähl ein Teil oder die Hand', 'Pick an item or the hand'));
      if (this.occupied(tx, ty) && !isRug(this.sel)) return this.tapNo(tx, ty, TAKEN()); // mit einem Teil in der Hand wird nichts aufgehoben (ein Teppich darf unter Möbel)
    }
    const entry = this.picking ? this.entryAt(tx, ty) ?? this.entryUnder(wx, wy) : null;
    if (entry) return this.pickUp(entry);
    if (!this.sel) return this.tapNo(tx, ty, null);
    this.dir = [0, 0]; // (wie die Vorschau unter dem Zeiger)
    if (this.canPlace(tx, ty, this.sel)) {
      this.place(tx, ty, this.sel);
      return true;
    }
    const pen = anyPenAt(tx, ty);
    const full = !isToy(this.sel) && designablePen(pen) && !!DECOR[this.sel]?.pen && this.penDecor(pen) >= penDecorMax(pen);
    const why = (isBooth(this.sel) && this.boothProblem(tx, ty, this.sel)) || (full ? tr('Das Gehege ist voll', 'The enclosure is full') : tr('Hier geht das nicht', 'Not here'));
    this.key = ''; // (update() rechnet die Richtung vor Henrik neu)
    this.tapNo(tx, ty, why);
  }

  // Bildschirmpunkt (CSS-Pixel) → Weltpunkt
  toWorld(cx, cy) {
    const r = this.scene.game.canvas.getBoundingClientRect();
    const { width, height } = this.scene.scale;
    return this.scene.cameras.main.getWorldPoint(((cx - r.left) * width) / r.width, ((cy - r.top) * height) / r.height);
  }

  // Ziehen mit dem Finger (Tablet und Handy, rechte Bildhälfte): mit einem Teil in der Hand folgt die Vorschau dem Finger,
  // beim Loslassen landet es dort; mit der Hand greift der Finger eine gesetzte Deko und trägt sie mit (eine Bude wird nur
  // aufgehoben, der Abschnitt baut sich dafür neu auf). Kurz angetippt wie bisher: setzen bzw. aufheben.
  // Ohne Reichweite um Henrik (wie die Maus): man sieht ja nur das Bild um ihn herum
  // Finger ruhig auf einem gesetzten Teil (auch ohne Hand, auch mit einem anderen Teil in der Hand): siehe grab
  dragStart(cx, cy) {
    if (!this.on) return;
    clearTimeout(this.holdTimer);
    const w = this.toWorld(cx, cy);
    const { tx, ty } = worldToTile(w.x, w.y);
    this.drag = null;
    if (this.picking) {
      const entry = this.entryAt(tx, ty) ?? this.entryUnder(w.x, w.y);
      if (!entry) return this.tapNo(tx, ty, null);
      this.pickUp(entry);
      if (entry.booth) return;
      this.drag = { x0: cx, y0: cy, moved: false, carried: true };
    } else {
      const under = this.entryAt(tx, ty) ?? this.entryUnder(w.x, w.y);
      if (!this.sel && !under) return this.tapNo(tx, ty, tr('Wähl ein Teil oder die Hand', 'Pick an item or the hand'));
      const d = (this.drag = { x0: cx, y0: cy, moved: false, carried: false });
      if (under) this.holdTimer = setTimeout(() => this.drag === d && !d.moved && this.grab(cx, cy), HOLD_MS);
    }
    if (this.sel) this.hoverAt(w);
  }

  // Finger lange auf einem gesetzten Teil (rechte Bildhälfte über dragStart, Joystick-Hälfte über touchHandlers.hold):
  // aufheben und mit dem Finger tragen; beim Loslassen landet es dort (geht es nicht, zurück an seinen Platz; in die
  // Leiste gezogen bleibt es dort). Danach ist wieder gewählt, was vorher gewählt war. Eine Bude wird nur aufgehoben (der
  // Abschnitt baut sich neu auf). true: gegriffen
  grab(cx, cy) {
    if (!this.on) return false;
    const w = this.toWorld(cx, cy);
    const { tx, ty } = worldToTile(w.x, w.y);
    const entry = this.entryAt(tx, ty) ?? this.entryUnder(w.x, w.y);
    if (!entry) return false;
    const back = { sel: this.sel, picking: this.picking, flip: this.flip, rot: this.rot };
    const from = { tx: entry.item.tx ?? entry.tx, ty: entry.item.ty ?? entry.ty, id: entry.id };
    navigator.vibrate?.(25);
    this.pickUp(entry);
    if (entry.booth) {
      this.drag = null;
      return true;
    }
    this.drag = { x0: cx, y0: cy, moved: false, carried: true, grab: { from, back } };
    this.hoverAt(this.toWorld(cx, cy - LIFT)); // (hebt sich ein Stück über den Finger)
    return true;
  }

  // gegriffenes Teil zurück an seinen alten Platz (mit seiner Drehung, die hat pickUp übernommen)
  putBack(g) {
    if (!(this.count(g.from.id) > 0)) return;
    this.sel = g.from.id;
    this.dir = [0, 0]; // (gespeichert ab der kleinsten Kachel, wie die Vorschau unter dem Zeiger)
    this.place(g.from.tx, g.from.ty, g.from.id);
  }

  // nach dem Verschieben: wieder das, was vorher gewählt war
  restore(back) {
    if (back.picking) return this.choose('@pick');
    const keep = back.sel && this.count(back.sel) > 0;
    this.sel = keep ? back.sel : null;
    this.picking = false;
    if (keep) {
      this.flip = back.flip;
      this.rot = back.rot;
    }
    this.loadArt();
    this.drawFree();
    this.renderBar();
    this.key = '';
    this.update();
  }

  dragMove(cx, cy) {
    const d = this.drag;
    if (!d || !this.on) return;
    if (!d.moved && Math.hypot(cx - d.x0, cy - d.y0) < DRAG_PX) return;
    d.moved = true;
    clearTimeout(this.holdTimer); // (losgezogen, bevor es sich hob: kein Greifen)
    if (this.sel) this.hoverAt(this.toWorld(cx, cy - LIFT));
  }

  dragEnd(cx, cy) {
    const d = this.drag;
    this.drag = null;
    clearTimeout(this.holdTimer);
    if (!d || !this.on) return;
    if (d.grab) {
      if (!this.inBar({ clientX: cx, clientY: cy })) {
        const w = this.toWorld(cx, cy - LIFT);
        const { tx, ty } = worldToTile(w.x, w.y);
        this.dir = [0, 0];
        if (!d.moved) this.putBack(d.grab); // nur gehalten: bleibt, wo es war
        else if (this.canPlace(tx, ty, this.sel)) this.place(tx, ty, this.sel);
        else {
          this.tapNo(tx, ty, tr('Hier geht das nicht', 'Not here'));
          this.putBack(d.grab);
        }
      }
      this.hover = null;
      if (this.on) this.restore(d.grab.back);
      return;
    }
    if (!this.sel) {
      if (d.moved) return;
      const w = this.toWorld(cx, cy);
      return this.tap(w.x, w.y); // (nichts gewählt, kurz auf ein Teil getippt: Hinweis)
    }
    if (!d.moved && d.carried) {
      this.hoverAt(null); // nur angetippt: aufgehoben, jetzt in der Hand
      return;
    }
    const w = this.toWorld(cx, cy - (d.moved ? LIFT : 0));
    const placed = this.tap(w.x, w.y);
    if (placed && d.carried && !this.sel?.startsWith('booth:')) this.choose('@pick'); // umgestellt: wieder die Hand (gleich das Nächste greifen)
    if (this.on) this.hoverAt(null);
  }

  // Leiste: Finger auf einem Teil. Längs der Leiste bewegt scrollt sie (die Teile haben touch-action: none, sonst
  // schnappt sich der Browser schräge Bewegungen fürs Scrollen), quer dazu (zum Bild hin) oder aus der Leiste hinaus wird
  // das Teil ausgewählt und mitgezogen
  barMove(e) {
    const b = this.barDrag;
    if (!b || e.pointerId !== b.pid || !this.on) return;
    const along = b.row ? e.clientX - b.x0 : e.clientY - b.y0;
    const across = b.row ? e.clientY - b.y0 : e.clientX - b.x0;
    if (!b.mode) {
      if (Math.hypot(along, across) < DRAG_PX) return;
      b.mode = Math.abs(along) > Math.abs(across) ? 'scroll' : 'drag';
    }
    if (b.mode === 'scroll') {
      if (this.inBar(e)) {
        b.list[b.row ? 'scrollLeft' : 'scrollTop'] = b.scroll0 - along;
        return;
      }
      b.list[b.row ? 'scrollLeft' : 'scrollTop'] = b.scroll0; // (schräg hinausgezogen: doch ziehen, Leiste wie vorher)
      b.mode = 'drag';
    }
    if (!this.drag) {
      if (this.sel !== b.id || this.picking) this.choose(b.id);
      this.drag = { x0: b.x0, y0: b.y0, moved: true, carried: false, bar: true };
    }
    this.hoverAt(this.toWorld(e.clientX, e.clientY - LIFT));
  }

  inBar(e) {
    const r = this.bar.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  barUp(e) {
    const b = this.barDrag;
    if (!b || e.pointerId !== b.pid) return;
    this.barDrag = null;
    setTimeout(() => !this.bar.contains(b.el) && b.el.remove()); // (nach dem Ende der Berührung, siehe renderBar)
    if (!b.mode) return; // nur angetippt: das Klicken wählt es aus
    this.noClickUntil = performance.now() + 400;
    if (b.mode === 'scroll') return;
    const back = e.type === 'pointercancel' || this.inBar(e);
    if (back) { // zurück in die Leiste gezogen: nichts setzen
      this.drag = null;
      this.hoverAt(null);
      return;
    }
    this.dragEnd(e.clientX, e.clientY);
  }

  // gesetzte Deko (bzw. Spielzeug), deren Bild an diesem Weltpunkt liegt – vorderste zuerst
  entryUnder(wx, wy) {
    const hits = [...this.scene.decorImages.entries()].filter(([, img]) => img.active && img.getBounds().contains(wx, wy));
    hits.sort((a, b) => b[1].depth - a[1].depth);
    for (const [k] of hits) {
      const [tx, ty] = k.replace('rug:', '').split(',').map(Number);
      const e = k.startsWith('rug:') ? this.rugEntry(tx, ty) : this.entryAt(tx, ty);
      if (e) return e;
    }
    return null;
  }

  // Antippen ging nicht: Kachel kurz rot, Hinweis unten (kurz, fürs Handy)
  tapNo(tx, ty, text) {
    const c = tileToWorld(tx, ty);
    const g = this.scene.add.graphics().setDepth(-99988);
    g.fillStyle(NO, 0.45);
    g.lineStyle(2, NO, 0.95);
    g.fillPoints(diamond(c.x, c.y), true);
    g.strokePoints(diamond(c.x, c.y), true);
    this.scene.tweens.add({ targets: g, alpha: 0, delay: 250, duration: 350, onComplete: () => g.destroy() });
    if (text) this.scene.showToast(text);
  }

  // Werkzeugleiste im Setzen-Modus: { image, label }
  toolbar() {
    if (!this.on || !this.state) return null;
    const { kind, entry, full, why } = this.state;
    const img = (id) => `assets/${itemDef(id).key}.png`;
    const name = (id) => itemDef(id).name;
    if (kind === 'none' && isTouch()) {
      if (this.sel) return { image: img(this.sel), label: tr('Aufs Bild tippen oder hinziehen', 'Tap the spot or drag it there') };
      return { image: 'assets/hand.png', label: tr('Teil antippen oder ziehen', 'Tap or drag an item') };
    }
    if (kind === 'pick') return { image: img(entry.id), label: tr(`${name(entry.id)} aufheben`, `Pick up ${name(entry.id)}`) };
    if (kind === 'place') return { image: img(this.sel), label: tr(`${name(this.sel)} setzen (${this.count(this.sel)})`, `Place ${name(this.sel)} (${this.count(this.sel)})`) };
    if (kind === 'no' && why) return { image: img(this.sel), label: why };
    if (kind === 'no' && full) return { image: img(this.sel), label: tr('Das Gehege ist voll', 'The enclosure is full') };
    if (kind === 'no' && this.sel) return { image: img(this.sel), label: tr('Hier geht das nicht', 'Not here') };
    if (!this.picking) return { image: 'assets/hand.png', label: tr('Wähl ein Teil oder die Hand', 'Pick an item or the hand') };
    return { image: 'assets/hand.png', label: tr('Zum Aufheben davorstellen', 'Stand in front to pick up') };
  }

  // Kacheln, die dieses Teil vor Henrik bedecken würde: eine, bei großer Deko (size 2) die 2×2 Kacheln, die von der
  // Kachel vor ihm aus nach hinten (weg von Henrik) und zur Seite reichen. { tx, ty } = kleinstes tx/ty, tiles
  block(tx, ty, id) {
    const n = (!isToy(id) && (isBooth(id) ? itemDef(id)?.size : DECOR[id]?.size)) || 1;
    const [w, h] = this.indoor(id) ? footprint(id, this.rot % (DECOR[id].views ?? 1)) : [n, n]; // (Möbel: Grundfläche in ihrer Ansicht)
    if (w === 1 && h === 1) return { tx, ty, tiles: [{ tx, ty }] };
    const [dx, dy] = this.dir ?? [0, 1];
    const tiles = [];
    for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) tiles.push({ tx: tx + (dx ? dx * a : a), ty: ty + (dy ? dy * b : b) });
    return { tx: Math.min(...tiles.map((t) => t.tx)), ty: Math.min(...tiles.map((t) => t.ty)), tiles };
  }

  // gesetzte Deko, umstellbares Spielzeug oder eine gebaute Bude an dieser Kachel: { id, tx, ty, list, item } (list: wo es
  // gespeichert ist; Bude: booth = ihr Bauplatz bzw. ihre Id)
  entryAt(tx, ty) {
    const slot = slotsIn(LEVEL_ID).find((s) => boothTiles(s).some((t) => t.tx === tx && t.ty === ty));
    if (slot) return { id: 'booth:' + slot.id, tx, ty, booth: slot.id, item: slot };
    const placed = game.decor.placed[LEVEL_ID] ?? [];
    const on = (p) => decorTiles(p).some((t) => t.tx === tx && t.ty === ty); // (große Deko: jede ihrer Kacheln)
    const d = placed.find((p) => on(p) && !isRug(p.id)) ?? placed.find(on); // (auf einem Teppich: erst das Möbel darauf)
    if (d) return { id: d.id, tx, ty, list: placed, item: d };
    const pen = anyPenAt(tx, ty);
    const toys = designablePen(pen) ? game.decor.toys?.[pen.id] ?? [] : [];
    const t = toys.find((p) => p.tx === tx && p.ty === ty);
    return t ? { id: 'toy:' + t.id, tx, ty, list: toys, item: t } : null;
  }

  // steht hier etwas (ein Teppich allein zählt nicht: darauf darf man stellen)?
  occupied(tx, ty) {
    const e = this.entryAt(tx, ty);
    return !!e && !isRug(e.id);
  }

  // der Teppich, der an dieser Stelle beginnt (sein Bild wurde angeklickt)
  rugEntry(tx, ty) {
    const placed = game.decor.placed[LEVEL_ID] ?? [];
    const d = placed.find((p) => isRug(p.id) && p.tx === tx && p.ty === ty);
    return d ? { id: d.id, tx, ty, list: placed, item: d } : null;
  }

  // so viel Deko (ohne Spielzeug) steht schon in diesem Gehege
  penDecor(pen) {
    return placedIn(LEVEL_ID).filter((d) => pen.tileSet.has(d.tx + ',' + d.ty)).length;
  }

  place(tx, ty, id) {
    const def = itemDef(id);
    if (isBooth(id)) {
      // Bude: an den neuen Platz, dann den Abschnitt neu aufbauen (gleich kauft dort jemand ein)
      const b = this.block(tx, ty, id);
      placeBooth(def.booth, LEVEL_ID, b.tx, b.ty, this.flip);
      // (danach nichts in der Hand, auch nicht die Hand). Mavis Buden-Aufgabe: die Bauen-Leiste bleibt nach dem Neuaufbau
      // zu, dann ist die Aufgabe gleich erledigt und Mavi wieder ansprechbar (statt erst „Fertig“ suchen zu müssen)
      const tut = storyActiveId() === 'stands' && game.story.heard;
      this.scene.rebuildForDecor(tut ? null : { sel: null, pick: false }, def.booth);
      return;
    }
    giveDecor(id, -1);
    countPark('decor'); // für die Statistik
    const pen = anyPenAt(tx, ty);
    const flip = (!this.indoor(id) && this.flip) || undefined; // (nur speichern, wenn gedreht)
    const rot = (this.indoor(id) && this.rot % (DECOR[id].views ?? 1)) || undefined; // Möbel: Ansicht
    const block = this.block(tx, ty, id); // (große Deko: 2×2 Kacheln, gespeichert ab der kleinsten)
    const item = isToy(id) ? null : { id, tx: block.tx, ty: block.ty, flip, rot };
    if (isToy(id)) (game.decor.toys[pen.id] ??= []).push({ id: def.toy, tx, ty, flip });
    else (game.decor.placed[LEVEL_ID] ??= []).push(item);
    // (Teppich im Haupthaus: kein Zeichen in der Karte, er liegt unter allem)
    if (!isRug(id)) for (const t of block.tiles) setTileChar(t.tx, t.ty, t.tx === block.tx && t.ty === block.ty ? def.char : fillChar(id));
    // der Tierfreund des Geheges freut sich (nur ein Effekt, keine Herzen: sonst lohnte sich Hin- und Herstellen)
    if (designablePen(pen)) for (const a of this.scene.animals ?? []) if (a.enclosure?.id === pen.id && a.sprite && isFriend(a)) this.scene.friendHeart(a);
    this.lastPlaced = isToy(id) ? { tx, ty, id } : { tx: block.tx, ty: block.ty, id }; // (für „Drehen“ ohne Teil in der Hand)
    const img = this.scene.drawDecor(block.tx, block.ty, isRug(id) ? item : null);
    if (!this.indoor(id)) img?.setFlipX(this.flip);
    if (img) {
      const s = img.scale;
      img.setScale(s * 0.6);
      this.scene.tweens.add({ targets: img, scale: s, duration: 220, ease: 'Back.easeOut' });
    }
    if (!(game.decor.owned[id] > 0)) this.sel = null; // keins mehr: nichts in der Hand (aufheben erst nach Wahl der Hand, sonst hebt der nächste Klick es gleich wieder auf)
    this.drawFree();
    this.renderBar();
    this.key = '';
    this.update();
  }

  pickUp(entry) {
    if (entry.booth) {
      // Bude: in die Deko-Taste (ihr Bauplatz wird frei), Abschnitt neu aufbauen, sie ist dann gleich ausgewählt
      const id = pickUpBooth(LEVEL_ID, entry.booth);
      if (id) this.scene.rebuildForDecor({ sel: 'booth:' + id, flip: !!entry.item.flip });
      return;
    }
    const i = entry.list.indexOf(entry.item);
    if (i < 0) return;
    entry.list.splice(i, 1);
    giveDecor(entry.id, 1);
    const tiles = isToy(entry.id) ? [{ tx: entry.tx, ty: entry.ty }] : decorTiles(entry.item);
    if (!isRug(entry.id)) for (const t of tiles) setTileChar(t.tx, t.ty, '.'); // (Teppich: die Kacheln gehören evtl. Möbeln darauf)
    this.lit = null;
    this.scene.removeDecor(entry.item.tx, entry.item.ty, isRug(entry.id) ? decorKey(entry.item) : null);
    this.picking = false;
    this.sel = entry.id; // gleich wieder ausgewählt: so stellt man sie schnell um (mit ihrer Drehung)
    this.flip = !!entry.item.flip;
    this.rot = entry.item.rot ?? 0;
    this.drawFree();
    this.renderBar();
    this.key = '';
    this.update();
  }

  // Darf dieses Teil auf diese Kachel?
  canPlace(tx, ty, id) {
    const def = itemDef(id);
    const block = this.block(tx, ty, id);
    if (!def || !block.tiles.every((t) => this.freeTile(t.tx, t.ty, id))) return false;
    const n = def.size ?? 1;
    const bw = Math.max(...block.tiles.map((t) => t.tx)) - block.tx + 1;
    const bh = Math.max(...block.tiles.map((t) => t.ty)) - block.ty + 1;
    const c = tileToWorld(block.tx + (bw - 1) / 2, block.ty + (bh - 1) / 2);
    const mavi = this.scene.mavi?.sprite;
    if (mavi && Math.hypot(mavi.x - c.x, (mavi.y - c.y) * 2) < TILE_W) return false;
    if (!def.solid) return true;
    // feste Deko: nicht auf Henrik oder einem Tier, und sie darf nichts absperren
    const clear = (def.hitbox ?? (TILE_W / 2) * n) + KEEP_CLEAR;
    const p = this.scene.player;
    if (Math.hypot(p.x - c.x, (p.y - c.y) * 2) < clear) return false;
    for (const a of this.scene.animals ?? []) {
      const s = a.sprite;
      if (s && Math.hypot(s.x - c.x, (s.y - c.y) * 2) < clear) return false;
    }
    return !this.cutsOff(block.tiles, def.char);
  }

  // Darf dieses Teil hier überhaupt stehen (ohne das, was sich bewegt: Henrik, Tiere, Mavi)? Das zeigt auch das Overlay
  // (id null: nur Aufheben – dann die Flächen draußen)
  freeTile(tx, ty, id = null) {
    // Teppich (Haupthaus): auch unter Möbel, nur nicht auf einen anderen Teppich, an die Wand oder vor die Tür
    if (isRug(id)) {
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
      const c = charAt(tx, ty);
      const room = c === '.' || c === FLOOR_FILL || c === 'V' || !!OBJECTS[c]?.decor; // (V: weitere Kachel eines großen Möbels)
      const rug = placedIn(LEVEL_ID).some((d) => isRug(d.id) && decorTiles(d).some((t) => t.tx === tx && t.ty === ty));
      return room && !rug && !this.keepOut.has(tx + ',' + ty);
    }
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false; // (außerhalb der Karte gilt charAt als Rasen: dort verschwände es)
    if (charAt(tx, ty) !== '.') return false; // nur Rasen (kein Weg, kein Wasser, nichts darauf)
    // Haupthaus: nur Möbel, überall im Raum (ohne Teil: die Fläche fürs Overlay)
    if (LEVEL_ID === ROOM) return (!id || !!DECOR[id]?.indoor) && !this.keepOut.has(tx + ',' + ty);
    if (buildingAt(tx, ty, 1)) return false; // nicht in und direkt an Gebäuden
    if (reservedAt(tx, ty)) return false; // Fläche eines künftigen Geheges
    if (this.keepOut.has(tx + ',' + ty)) return false; // vor Toren, Schildern, Buden, Futterhaus, Ausgängen …
    const pen = anyPenAt(tx, ty);
    if (isBooth(id)) {
      if (pen || this.boothProblem(tx, ty, id)) return false; // Bude: nur draußen, direkt am Weg, mit Abstand
    } else if (isToy(id)) {
      if (!toyFits(pen, id)) return false; // Spielzeug nur in sein Gehege
    } else if (pen && !pen.decor) {
      // Gehege gestalten: nur Natur-Deko, und nicht zu viel
      if (!designablePen(pen) || !DECOR[id]?.pen || this.penDecor(pen) >= penDecorMax(pen)) return false;
    }
    const c = tileToWorld(tx, ty);
    return !CAR_BODIES.some((b) => nearSegment(c.x, c.y, b) < b.hw + TILE_W / 2); // am Auto
  }

  // Bude: warum geht sie hier nicht? (null: passt) – sie braucht eine Wegkachel direkt daneben (dort stellen sich die
  // Besucher an), Abstand zu anderen Buden, und jede Sorte gibt es einmal je Abschnitt
  boothProblem(tx, ty, id) {
    const def = itemDef(id);
    if (shopsIn(LEVEL_ID).some((s) => s.kind === def.kind && s.slot.id !== def.booth)) return tr('Diese Bude steht hier schon', 'This stand is already here');
    const tiles = this.block(tx, ty, id).tiles; // (große Bude: alle 2×2 Kacheln)
    const path = tiles.some((t) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].some(([dx, dy]) => charAt(t.tx + dx, t.ty + dy) === '#'));
    if (!path) return tr('Nur direkt am Weg', 'Only right next to a path');
    const near = (o) => tiles.some((t) => Math.max(Math.abs(o.tx - t.tx), Math.abs(o.ty - t.ty)) < BOOTH_GAP);
    if (slotsIn(LEVEL_ID).some((s) => s.id !== def.booth && boothTiles(s).some(near))) return tr('Zu nah an einer anderen Bude', 'Too close to another stand');
    return null;
  }

  // Overlay: alle Kacheln, auf die man bauen darf, leicht grün mit feinem Rand (so sieht man das Raster)
  drawFree() {
    this.free?.destroy();
    const g = this.scene.add.graphics().setDepth(-99989.6);
    g.fillStyle(FREE, 0.26);
    g.lineStyle(1, 0xffffff, 0.38);
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        if (!this.freeTile(tx, ty, this.sel)) continue;
        const { x, y } = tileToWorld(tx, ty);
        const d = diamond(x, y);
        g.fillPoints(d, true);
        g.strokePoints(d, true);
      }
    }
    this.free = g;
  }

  // Sperrt eine feste Deko hier etwas ab? Von Henrik aus erreichbare Kacheln zählen, ohne und mit ihr: fällt mehr weg als
  // die eine Kachel, wäre ein Stück der Karte abgeschnitten
  cutsOff(tiles, char) {
    const from = worldToTile(this.scene.player.x, this.scene.player.y);
    const before = this.reachable(from);
    for (const t of tiles) setTileChar(t.tx, t.ty, char);
    const after = this.reachable(from);
    for (const t of tiles) setTileChar(t.tx, t.ty, '.');
    return after < before - tiles.length;
  }

  reachable(from) {
    const seen = new Set([from.tx + ',' + from.ty]);
    const todo = [from];
    while (todo.length) {
      const t = todo.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = t.tx + dx;
        const ny = t.ty + dy;
        const k = nx + ',' + ny;
        if (seen.has(k) || nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H || isBlocked(nx, ny)) continue;
        seen.add(k);
        todo.push({ tx: nx, ty: ny });
      }
    }
    return seen.size;
  }

  // Kacheln, auf denen nichts stehen darf: rund um Tore, Schilder, Bauplätze, Futterhaus, Computer, Kisten, den E-Roller
  // und den Start; vor Ausgängen etwas mehr
  keepOutTiles() {
    const out = new Set();
    const around = (t, r = 1) => {
      if (!t) return;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) out.add(Math.round(t.tx) + dx + ',' + (Math.round(t.ty) + dy));
    };
    GATE_TILES.forEach((t) => around(t));
    for (const e of ENCLOSURES) {
      around(e.sign);
      (e.signs ?? []).forEach((s) => around(s.spot));
    }
    (this.scene.enclosureSigns ?? []).forEach((s) => around(worldToTile(s.x, s.y)));
    [...(LEVEL.feeders ?? []), ...(LEVEL.computers ?? []), ...(LEVEL.chests ?? [])].forEach((t) => around(t));
    slotsIn(LEVEL_ID).flatMap(boothTiles).forEach((t) => around(t)); // Buden
    [LEVEL.scooterSpot, LEVEL.start].forEach((t) => around(t)); // (der Eiswagen-Platz iceStand ist frei: das Event gibt es nicht mehr)
    EXITS.forEach((t) => around(t, 2));
    const w = LEVEL.wheelSlot;
    if (w) for (let ty = w.clear.ty0 - 1; ty <= w.clear.ty1 + 1; ty++) for (let tx = w.clear.tx0 - 1; tx <= w.clear.tx1 + 1; tx++) out.add(tx + ',' + ty);
    return out;
  }

  // Flächen künftiger Gehege: leicht eingefärbt, solange der Setzen-Modus an ist
  drawReserved() {
    this.reserved?.destroy();
    const tiles = reservedTiles();
    if (!tiles.length) return;
    const g = this.scene.add.graphics().setDepth(-99989.5);
    // orange mit schrägen Streifen, damit man es deutlich vom grünen „hier darf man bauen“ unterscheidet
    g.fillStyle(RESERVED, 0.2);
    g.lineStyle(2, RESERVED, 0.55);
    for (const { tx, ty } of tiles) {
      const { x, y } = tileToWorld(tx, ty);
      g.fillPoints(diamond(x, y), true);
      g.lineBetween(x - TILE_W / 4, y + TILE_H / 4, x + TILE_W / 4, y - TILE_H / 4);
    }
    this.reserved = g;
  }

  clearPreview() {
    this.marks?.destroy();
    this.marks = null;
    this.ghost?.destroy();
    this.ghost = null;
    this.ghostFront?.destroy();
    this.ghostFront = null;
    this.lit?.clearTint();
    this.lit = null;
  }

  drawPreview() {
    this.clearPreview();
    const s = this.state;
    if (!s || s.kind === 'none') return;
    const color = s.kind === 'place' ? OK : s.kind === 'pick' ? PICK : NO;
    const g = this.scene.add.graphics().setDepth(-99989);
    g.fillStyle(color, 0.35);
    g.lineStyle(2, color, 0.9);
    // Rauten: die Kachel vor Henrik bzw. alle Kacheln einer großen Deko (beim Aufheben: die der gesetzten)
    const tiles = s.kind === 'pick' ? (s.entry.item && !isToy(s.entry.id) && !s.entry.booth ? decorTiles(s.entry.item) : [s]) : s.block?.tiles ?? [s];
    for (const t of tiles) {
      const c = tileToWorld(t.tx, t.ty);
      g.fillPoints(diamond(c.x, c.y), true);
      g.strokePoints(diamond(c.x, c.y), true);
    }
    this.marks = g;
    if (s.kind === 'pick') {
      this.lit = this.scene.decorImages.get(s.entry.item && !isToy(s.entry.id) && !s.entry.booth ? decorKey(s.entry.item) : `${s.entry.item?.tx ?? s.tx},${s.entry.item?.ty ?? s.ty}`) ?? null;
      this.lit?.setTint(0xfff2a0);
      return;
    }
    if (!this.sel) return;
    const def = itemDef(this.sel);
    const obj = OBJECTS[def.char];
    const look = isBooth(this.sel) ? def : this.indoor() ? furnitureLook(this.sel, this.rot) : obj; // (Bude: eigenes Bild und eigene Größe; Möbel: Ansicht)
    const b = s.block ?? { tx: s.tx, ty: s.ty, tiles: [s] };
    // in der Mitte der Grundfläche
    const bw = Math.max(...b.tiles.map((t) => t.tx)) - b.tx + 1;
    const bh = Math.max(...b.tiles.map((t) => t.ty)) - b.ty + 1;
    const { x, y } = tileToWorld(b.tx + (bw - 1) / 2, b.ty + (bh - 1) / 2);
    this.ghost = this.scene.add.image(x, y, look.key).setOrigin(look.originX ?? 0.5, look.originY).setScale(def.scale ?? 1).setAlpha(0.6).setDepth(y + 1).setFlipX(!this.indoor() && this.flip);
    if (look.frontKey) this.ghostFront = this.scene.add.image(x, y, look.frontKey).setOrigin(look.originX, look.originY).setAlpha(0.6).setDepth(y + 1.01);
    if (s.kind === 'no') {
      this.ghost.setTint(0xff8070);
      this.ghostFront?.setTint(0xff8070);
    }
  }
}

// Raute einer Kachel um ihre Mitte
function diamond(x, y) {
  return [
    { x, y: y - TILE_H / 2 },
    { x: x + TILE_W / 2, y },
    { x, y: y + TILE_H / 2 },
    { x: x - TILE_W / 2, y },
  ];
}
