// Menü (Knopf oben rechts oder Esc): weiterspielen, von Hand speichern, zurück zum Startbildschirm.
// Das Spiel pausiert so lange. Esc schließt das Menü wieder.
import { save } from '../save.js';
import { CLOSE_BUTTON, isCloseClick } from './closeButton.js';
import { locale, tr } from '../i18n.js';

let panel = null;
let state = null;
let openedAt = 0;
const OPEN_GRACE = 400; // Millisekunden nach dem Öffnen, in denen Klicks nichts tun

export function isMenuOpen() {
  return !!panel?.classList.contains('show');
}

function savedLine() {
  if (save.testMode) return tr('Test-Spiel – wird nicht gespeichert', 'Test game – not saved');
  if (!save.lastSaved) return tr('Noch nicht gespeichert', 'Not saved yet');
  const time = new Date(save.lastSaved).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return tr(`Zuletzt gespeichert: ${time} Uhr`, `Last saved: ${time}`);
}

function render() {
  panel.innerHTML = `<div class="chest-box menu-box">${CLOSE_BUTTON}
      <img class="menu-logo" src="assets/logo.png" alt="My Little Zoo">
      <h2>${tr('Menü', 'Menu')}</h2>
      <button class="start-btn" data-act="resume">▶ ${tr('Weiterspielen', 'Resume')}</button>
      <button class="start-btn" data-act="save"${save.testMode ? ' disabled' : ''}>💾 ${tr('Speichern', 'Save')}</button>
      <button class="start-btn" data-act="title">⌂ ${tr('Zum Startbildschirm', 'Title screen')}</button>
      <p class="menu-saved">${savedLine()}</p>
    </div>`;
}

// onSave(): speichert, gibt true zurück, wenn es geklappt hat; onTitle(): zurück zum Startbildschirm; onClose(): Menü zu
export function openMenu(onSave, onTitle, onClose) {
  panel = document.getElementById('menu');
  state = { onSave, onTitle, onClose };
  render();
  panel.classList.add('show');
  openedAt = performance.now();
  // erst nach diesem Tastendruck reagieren, sonst schließt Esc das Menü gleich wieder
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
  }, 0);
}

function onKey(e) {
  e.preventDefault();
  e.stopPropagation(); // die Taste soll im Spiel nichts auslösen
  if (e.key === 'Escape') close();
}

function onClick(e) {
  if (performance.now() - openedAt < OPEN_GRACE) return;
  if (isCloseClick(e)) return close();
  const b = e.target.closest('.start-btn');
  const act = b?.dataset.act;
  if (!e.target.closest('.menu-box')) return close(); // neben die Tafel tippen schließt
  if (!b) return;
  if (act === 'resume') close();
  else if (act === 'save' && !b.disabled) {
    const ok = state.onSave();
    render();
    panel.querySelector('.menu-saved').textContent = ok ? tr('Gespeichert ✓', 'Saved ✓') : tr('Speichern hat nicht geklappt', 'Saving did not work');
  } else if (act === 'title') {
    const cb = state.onTitle;
    close();
    cb();
  }
}

function close() {
  window.removeEventListener('keydown', onKey, true);
  panel.removeEventListener('click', onClick);
  panel.classList.remove('show');
  const cb = state?.onClose;
  state = null;
  cb?.();
}
