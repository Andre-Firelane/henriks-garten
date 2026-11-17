// Glücksbringer-Tafel (Knopf "Glücksbringer" oben rechts oder Taste G): alle Glücksbringer, noch nicht gefundene als
// Schatten. Oben die 2 Plätze. Im Tierpark:
// - antippen: legt ihn auf einen freien Platz, sonst statt des ersten; einen getragenen antippen legt ihn ab
// - ziehen und auf einen Platz fallen lassen (Maus und Finger); zwei Plätze lassen sich so tauschen, einen Platz
//   irgendwo anders hin ziehen legt ihn ab
// In den Welten nur ansehen. Esc, G oder ✕ schließt.
import { CLOSE_BUTTON, isCloseClick } from './closeButton.js';
import { tr } from '../i18n.js';
import { game } from '../state.js';
import { CHARMS, CHARM_SCOPE, CHARM_SLOTS, equipCharm, luckState, ownsCharm, setCharmSlot, toggleCharm } from '../world/luck.js';

let panel = null;
let state = null;
let openedAt = 0;
const OPEN_GRACE = 400;
const DRAG_START = 8; // so viele Pixel, bis aus dem Antippen ein Ziehen wird

export function isCharmsOpen() {
  return !!panel?.classList.contains('show');
}

// canChange: im Tierpark (sonst nur ansehen); onClose(): Tafel zu
export function openCharms(canChange, onClose) {
  luckState();
  panel = document.getElementById('charms');
  state = { canChange, onClose, note: null, drag: null };
  render();
  panel.classList.add('show');
  openedAt = performance.now();
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
    panel.addEventListener('pointerdown', onDown);
  }, 0);
}

function render() {
  const eq = game.charms.equipped;
  const slots = Array.from({ length: CHARM_SLOTS }, (_, i) => {
    const c = CHARMS[eq[i]];
    return `<div class="charm-slot${c ? ' full' : ''}" data-slot="${i}"${c ? ` data-id="${eq[i]}"` : ''}>${c ? `<span class="luck-icon">${c.icon}</span><b>${c.name}</b>` : `<small>${tr('frei', 'empty')}</small>`}</div>`;
  }).join('');
  const found = Object.keys(CHARMS).filter(ownsCharm).length;
  panel.innerHTML = `<div class="chest-box charms-box">${CLOSE_BUTTON}
      <h2>${tr('Glücksbringer', 'Lucky Charms')} <small>${found} / ${Object.keys(CHARMS).length}</small></h2>
      <div class="charm-slots">${slots}</div>
      <p class="chest-hint">${state.note ?? (state.canChange
        ? tr('Tippe einen Glücksbringer an oder zieh ihn auf einen Platz. Du kannst 2 tragen.', 'Tap a charm or drag it onto a slot. You can wear 2.')
        : tr('Wechseln kannst du sie nur im Tierpark.', 'You can only switch them in the zoo.'))}</p>
      <div class="chest-items charm-list">${Object.entries(CHARMS)
        .map(([id, c]) => ownsCharm(id)
          ? `<button class="chest-item charm${eq.includes(id) ? ' worn' : ''}" data-id="${id}"><span class="luck-icon">${c.icon}</span><b>${c.name}</b><small>${c.text}</small>${c.scope ? `<small class="charm-scope">${CHARM_SCOPE[c.scope]}</small>` : ''}${eq.includes(id) ? `<span class="luck-tag">${tr('angelegt', 'worn')}</span>` : ''}</button>`
          : `<div class="chest-item charm unknown"><span class="luck-icon">${c.icon}</span><b>?</b><small>${tr('Noch nicht gefunden – vielleicht in einer Kiste?', 'Not found yet – maybe in a chest?')}</small></div>`)
        .join('')}</div>
    </div>`;
}

function onKey(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape' || e.key.toLowerCase() === 'g') close();
}

// nur Schließen (✕ oder neben die Tafel); Antippen und Ziehen der Glücksbringer laufen über die Pointer-Events
function onClick(e) {
  if (performance.now() - openedAt < OPEN_GRACE) return;
  if (isCloseClick(e) || !e.target.closest('.charms-box')) close();
}

function onDown(e) {
  if (performance.now() - openedAt < OPEN_GRACE || state.drag) return;
  const el = e.target.closest('.charm[data-id], .charm-slot[data-id]');
  if (!el) return;
  e.preventDefault();
  state.drag = { id: el.dataset.id, fromSlot: el.dataset.slot != null ? Number(el.dataset.slot) : null, x: e.clientX, y: e.clientY, ghost: null, pointer: e.pointerId };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
}

function onMove(e) {
  const d = state?.drag;
  if (!d || e.pointerId !== d.pointer) return;
  if (!d.ghost) {
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_START) return;
    if (!state.canChange) return; // in den Welten: kein Ziehen
    d.ghost = document.createElement('div');
    d.ghost.className = 'charm-ghost';
    d.ghost.innerHTML = CHARMS[d.id].icon; // Bild (img)
    document.body.appendChild(d.ghost);
  }
  d.ghost.style.left = `${e.clientX}px`;
  d.ghost.style.top = `${e.clientY}px`;
  const over = slotAt(e.clientX, e.clientY);
  panel.querySelectorAll('.charm-slot').forEach((s) => s.classList.toggle('over', s === over));
}

function onUp(e) {
  const d = state?.drag;
  if (!d || e.pointerId !== d.pointer) return;
  endDrag();
  if (!state.canChange) {
    state.note = tr('🏠 Wechseln kannst du die Glücksbringer nur im Tierpark.', '🏠 You can only switch charms in the zoo.');
  } else if (d.ghost) {
    const slot = slotAt(e.clientX, e.clientY);
    if (slot) setCharmSlot(Number(slot.dataset.slot), d.id);
    else if (d.fromSlot != null) toggleCharm(d.id); // vom Platz weggezogen: ablegen
    state.note = null;
  } else if (game.charms.equipped.includes(d.id)) {
    toggleCharm(d.id); // einen getragenen antippen: ablegen
    state.note = null;
  } else {
    equipCharm(d.id); // antippen: freier Platz, sonst statt des ersten
    state.note = null;
  }
  render();
}

function onCancel() {
  endDrag();
  render();
}

function endDrag() {
  state.drag?.ghost?.remove();
  state.drag = null;
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onCancel);
}

function slotAt(x, y) {
  return document.elementFromPoint(x, y)?.closest?.('.charm-slot') ?? null;
}

function close() {
  if (state?.drag) endDrag();
  window.removeEventListener('keydown', onKey, true);
  panel.removeEventListener('click', onClick);
  panel.removeEventListener('pointerdown', onDown);
  panel.classList.remove('show');
  const cb = state?.onClose;
  state = null;
  cb?.();
}
