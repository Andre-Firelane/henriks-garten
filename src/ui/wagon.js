// Wagen im Expeditions-Camp: oben die Käfige (je Käfig eine Tierart, eine Art auch in mehreren, mit ein paar Plätzen; vom Spiel vorbelegt), darunter
// die Tiere, die im Camp bleiben würden. Antippen tauscht: ein Tier im Wagen kommt heraus, ein Tier aus dem Camp in den
// Käfig seiner Art (oder einen freien). Über jedem Tier zeigt ein
// Zeichen, was im Zoo mit ihm passiert: Stern (neu im Zoo oder seltene Variante), Haus (freier Gehege-Platz),
// Baum (das Gehege ist voll – es käme ins Naturreservat). Esc oder ✕ schließt. Heim geht es mit dem Auto im Camp
// (Rückfrage: openConfirm).
import { CLOSE_BUTTON, isCloseClick } from './closeButton.js';
import { tr } from '../i18n.js';

let panel = null;
let state = null;
let openedAt = 0;
const OPEN_GRACE = 400;

const BADGE = { star: '⭐', house: '🏠', tree: '🌳' };

export function isWagonOpen() {
  return !!panel?.classList.contains('show');
}

// view(): { cages: [{ cap, animals: [{ icon, badge }] } | null], stay: [{ icon, badge }], note, tip? }
// tip: { point: 'done' | 'stay', text } – Tutorial (Mr. Nuggets): roter Pfeil am Fertig-Knopf bzw. am ersten Tier, das im
// Camp bleibt, dazu sein Satz
// handlers: { tap(where, i, j), close() } – where 'cage' (Käfig i, Tier j) oder 'stay' (Tier i)
export function openWagon(view, handlers) {
  panel = document.getElementById('wagon');
  state = { view, handlers };
  render();
  panel.classList.add('show');
  openedAt = performance.now();
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
  }, 0);
}

const POINTER = '<span class="chest-pointer tut-pointer">▼</span>';

function animal(a, where, i, j = 0, point = false) {
  return `<button class="wagon-animal" data-where="${where}" data-i="${i}" data-j="${j}">${point ? POINTER : ''}${a.icon}<span class="wagon-badge">${BADGE[a.badge] ?? ''}</span></button>`;
}

// Rückfrage (z. B. am Auto: Expedition beenden?): html, Knöpfe yesText / noText; handlers: { yes(), close() }
export function openConfirm(html, yesText, noText, handlers) {
  panel = document.getElementById('wagon');
  state = { confirm: true, handlers };
  panel.innerHTML = `<div class="chest-box wagon-box">${CLOSE_BUTTON}${html}
      <div class="wagon-btns"><button class="start-btn small wagon-yes">${yesText}</button><button class="start-btn small wagon-no">${noText}</button></div>
    </div>`;
  panel.classList.add('show');
  openedAt = performance.now();
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
  }, 0);
}

// Auswahl mit großen Knöpfen (z. B. Weltkarte: Erkundung oder Expedition): choices [{ label, text, icon?, disabled?, point? }] (disabled: ausgegraut, nicht wählbar – z. B. noch gesperrt; point: roter Tutorial-Pfeil darüber); onPick(i), onClose()
export function openChoice(html, choices, onPick, onClose) {
  panel = document.getElementById('wagon');
  state = { choice: true, handlers: { pick: onPick, close: onClose } };
  panel.innerHTML = `<div class="chest-box wagon-box">${CLOSE_BUTTON}${html}
      <div class="chest-items choice-items">${choices.map((c, i) => `<button class="chest-item choice-item${c.disabled ? ' locked' : ''}" data-c="${i}"${c.disabled ? ' disabled' : ''}>${c.point ? POINTER : ''}${c.icon ? `<span class="luck-icon">${c.icon}</span>` : ''}<b>${c.label}</b><small>${c.text}</small></button>`).join('')}</div>
    </div>`;
  panel.classList.add('show');
  openedAt = performance.now();
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
  }, 0);
}

function render() {
  const v = state.view();
  // Käfig: seine Tiere, dazu gestrichelt die noch freien Plätze; ein leerer Käfig ist für eine neue Art frei
  const cages = v.cages
    .map((c, i) => `<div class="wagon-cage${c ? ' full' : ''}">${c
      ? c.animals.map((a, j) => animal(a, 'cage', i, j)).join('') + '<span class="wagon-free"></span>'.repeat(Math.max(0, c.cap - c.animals.length))
      : `<small>${tr('frei', 'empty')}</small>`}</div>`)
    .join('');
  const stay = v.stay.length
    ? `<h3>${tr('Bleibt im Camp', 'Stays at camp')}</h3><div class="wagon-stay">${v.stay.map((a, i) => animal(a, 'stay', i, 0, v.tip?.point === 'stay' && i === 0)).join('')}</div>`
    : '';
  panel.innerHTML = `<div class="chest-box wagon-box">${CLOSE_BUTTON}
      <h2>${tr('Wagen', 'Wagon')} <small>${v.cages.filter(Boolean).length} / ${v.cages.length} ${tr('Käfige', 'cages')}</small></h2>
      <div class="wagon-cages">${cages}</div>
      ${stay}
      ${v.note ? `<p class="chest-hint">${v.note}</p>` : ''}
      ${v.tip ? `<p class="chest-tut"><b>Mr. Nuggets:</b> ${v.tip.text}</p>` : ''}
      <p class="chest-hint wagon-legend">⭐ ${tr('neu im Zoo oder selten', 'new to the zoo or rare')} · 🏠 ${tr('freier Gehege-Platz', 'free enclosure spot')} · 🌳 ${tr('Gehege voll', 'enclosure full')}</p>
      <div class="wagon-btns"><button class="start-btn small wagon-done">${tr('Fertig', 'Done')}${v.tip?.point === 'done' ? POINTER : ''}</button></div>
    </div>`;
}

function onKey(e) {
  if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    e.stopPropagation();
    close();
  }
}

function onClick(e) {
  if (performance.now() - openedAt < OPEN_GRACE) return;
  if (isCloseClick(e) || e.target.closest('.wagon-done') || e.target === panel) return close();
  if (state.choice) {
    const c = e.target.closest('.choice-item');
    if (c && !c.disabled) {
      shut();
      state.handlers.pick(Number(c.dataset.c));
    }
    return;
  }
  if (state.confirm) {
    const yes = e.target.closest('.wagon-yes');
    if (yes || e.target.closest('.wagon-no')) {
      shut();
      (yes ? state.handlers.yes : state.handlers.close)();
    }
    return;
  }
  const b = e.target.closest('.wagon-animal');
  if (!b) return;
  state.handlers.tap(b.dataset.where, Number(b.dataset.i), Number(b.dataset.j));
  render();
}

function shut() {
  panel.classList.remove('show');
  window.removeEventListener('keydown', onKey, true);
  panel.removeEventListener('click', onClick);
}

function close() {
  shut();
  state.handlers.close();
}
