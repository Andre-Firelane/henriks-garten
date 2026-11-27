// Kisten-Karten: 3 (mit dem Kleeblatt 4) Karten, eine davon nimmt man mit (gratis). Gegen Herzen kann man neu würfeln.
// Schließen gibt es nicht – eine Karte nimmt man immer. Tablet: antippen. Laptop: A/D wählen, E/Enter/Leertaste nehmen,
// R würfelt neu.
import { tr } from '../i18n.js';

let panel = null;
let state = null;
let openedAt = 0;
const OPEN_GRACE = 400; // Millisekunden nach dem Öffnen, in denen Klicks nichts tun

export function isLuckPickerOpen() {
  return !!panel?.classList.contains('show');
}

// view(): { cards: [{ icon, title, text, color, tag, point? }], cost, hearts, title?, left?, tut? } (title: Überschrift statt "Eine Kiste!";
// left: so oft darf man noch neu würfeln, ohne Angabe beliebig oft; tut: Satz aus einem Tutorial – dann ohne Neuwürfeln;
// point: roter Pfeil an dieser Karte) (wird nach dem Neuwürfeln neu geholt)
// onPick(i): Karte i genommen; onReroll(): neu würfeln (der Aufrufer zieht die Herzen ab und würfelt)
export function openLuckPicker(view, onPick, onReroll) {
  panel = document.getElementById('luck');
  state = { view, onPick, onReroll, selected: 0 };
  render();
  panel.classList.add('show');
  openedAt = performance.now();
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
    panel.addEventListener('pointerover', onHover);
  }, 0);
}

function render() {
  const v = state.view();
  state.n = v.cards.length;
  state.selected = Math.min(state.selected, state.n - 1);
  const short = v.hearts < v.cost || v.left === 0;
  const left = v.left != null ? ` (${v.left})` : '';
  panel.innerHTML = `<div class="chest-box luck-box">
      <h2>${v.title ?? tr('Eine Kiste! Such dir etwas aus:', 'A chest! Pick one:')}</h2>
      <div class="chest-items luck-cards" style="--n:${v.cards.length}">${v.cards
        .map(
          (c, i) => `<button class="chest-item luck-card" data-i="${i}" style="--luck:${c.color}">
            ${c.point ? '<span class="chest-pointer tut-pointer">▼</span>' : ''}${c.tag ? `<span class="luck-tag">${c.tag}</span>` : ''}
            <span class="luck-icon">${c.icon}</span><b>${c.title}</b><small>${c.text}</small>
          </button>`,
        )
        .join('')}</div>
      ${v.tut
        ? `<p class="chest-tut">${v.tut}</p>
      <p class="chest-hint">${tr('Tippe auf eine Karte – oder wähle mit <b>A</b>/<b>D</b> und nimm sie mit <b>E</b>.', 'Tap a card – or choose with <b>A</b>/<b>D</b> and take it with <b>E</b>.')}</p>`
        : `<button class="start-btn small luck-reroll"${short ? ' disabled' : ''}>🎲 ${tr('Neu würfeln', 'Reroll')}${left} <span class="heart">♥</span> ${v.cost}</button>
      <p class="chest-hint">${tr('Tippe auf eine Karte – oder wähle mit <b>A</b>/<b>D</b> und nimm sie mit <b>E</b>. <b>R</b> würfelt neu.', 'Tap a card – or choose with <b>A</b>/<b>D</b> and take it with <b>E</b>. <b>R</b> rerolls.')}</p>`}
    </div>`;
  highlight();
}

function highlight() {
  panel.querySelectorAll('.luck-card').forEach((b, i) => b.classList.toggle('selected', i === state.selected));
}

function reroll() {
  const v = state.view();
  if (v.hearts < v.cost || v.left === 0) return;
  state.onReroll();
  render();
}

function onKey(e) {
  e.preventDefault();
  e.stopPropagation(); // die Taste soll im Spiel nichts auslösen
  const k = e.key.toLowerCase();
  const n = state.n;
  if (k === 'r' && state.view().tut) return;
  if (k === 'a' || k === 'arrowleft' || k === 'w' || k === 'arrowup') state.selected = (state.selected + n - 1) % n;
  else if (k === 'd' || k === 'arrowright' || k === 's' || k === 'arrowdown') state.selected = (state.selected + 1) % n;
  else if (k === 'e' || k === 'enter' || k === ' ') return pick(state.selected);
  else if (k === 'r') return reroll();
  highlight();
}

function onHover(e) {
  const b = e.target.closest('.luck-card');
  if (!b || e.pointerType === 'touch') return;
  state.selected = Number(b.dataset.i);
  highlight();
}

function onClick(e) {
  if (performance.now() - openedAt < OPEN_GRACE) return;
  if (e.target.closest('.luck-reroll')) return reroll();
  const b = e.target.closest('.luck-card');
  if (b) pick(Number(b.dataset.i));
}

function pick(i) {
  const cb = state.onPick;
  close();
  cb(i);
}

function close() {
  window.removeEventListener('keydown', onKey, true);
  panel.removeEventListener('click', onClick);
  panel.removeEventListener('pointerover', onHover);
  panel.classList.remove('show');
}
