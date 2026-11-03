// Große Tafeln: openJournal für einfache Tafeln (Willkommen, Steuerung; schließen mit einer beliebigen Taste oder einem Tipp)
// und openBook für das Tierbuch mit Reitern (siehe unten).

import { CLOSE_BUTTON, isCloseClick } from './closeButton.js';

let panel = null;
let onClose = null;

export function isJournalOpen() {
  return !!panel?.classList.contains('show');
}

// html: Inhalt der Tafel; closed: wird nach dem Schließen aufgerufen
export function openJournal(html, closed) {
  panel = document.getElementById('journal');
  panel.innerHTML = html;
  panel.querySelector('.journal-box')?.insertAdjacentHTML('afterbegin', CLOSE_BUTTON); // (jeder Tipp schließt ohnehin)
  panel.classList.add('show');
  onClose = closed;
  // erst nach diesem Tastendruck auf den nächsten hören, sonst schließt die Taste I die Tafel gleich wieder
  setTimeout(() => {
    window.addEventListener('keydown', close, true);
    panel.addEventListener('click', close); // Tippen schließt, Wischen zum Scrollen nicht
  }, 0);
}

function close(e) {
  e?.preventDefault();
  e?.stopPropagation(); // die Taste soll im Spiel nichts auslösen
  window.removeEventListener('keydown', close, true);
  panel.removeEventListener('click', close);
  panel.classList.remove('show');
  const cb = onClose;
  onClose = null;
  cb?.();
}

// Tierbuch mit Reitern (Taste I oder der Knopf oben links). tabs: [{ id, label, html() }], start: Id des ersten Reiters.
// Antippen wechselt den Reiter bzw. den Filter (Knöpfe mit data-filter, Karten mit data-worlds); schließen mit ✕, Esc, I
// oder neben die Tafel tippen. Tastatur: A/D oder Pfeile wechseln den Reiter, 1–9 springen hin.
// onTab(id): beim Wechsel (zum Merken des letzten Reiters)
let book = null;
const OPEN_GRACE = 400; // Millisekunden nach dem Öffnen, in denen Klicks nichts tun (Tablet: Klick nach dem Antippen)

export function openBook(tabs, start, closed, onTab) {
  panel = document.getElementById('journal');
  book = { tabs, current: Math.max(0, tabs.findIndex((t) => t.id === start)), filter: 'all', onTab, openedAt: performance.now() };
  panel.innerHTML = `<div class="journal-box book-box">${CLOSE_BUTTON}<div class="book-tabs"></div><div class="book-page"></div></div>`;
  showTab();
  panel.classList.add('show');
  onClose = closed;
  setTimeout(() => {
    window.addEventListener('keydown', onBookKey, true);
    panel.addEventListener('click', onBookClick);
  }, 0);
}

function showTab() {
  const { tabs, current } = book;
  panel.querySelector('.book-tabs').innerHTML = tabs.map((t, i) => `<button class="book-tab${i === current ? ' on' : ''}" data-tab="${i}">${t.label}</button>`).join('');
  panel.querySelector('.book-page').innerHTML = tabs[current].html();
  panel.querySelector('.book-box').scrollTop = 0;
  book.onTab?.(tabs[current].id);
  applyFilter();
}

function applyFilter() {
  const f = book.filter;
  panel.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('on', b.dataset.filter === f));
  panel.querySelectorAll('[data-worlds]').forEach((c) => {
    c.hidden = f !== 'all' && !c.dataset.worlds.split(' ').includes(f);
  });
}

function onBookKey(e) {
  e.preventDefault();
  e.stopPropagation(); // die Taste soll im Spiel nichts auslösen
  const k = e.key.toLowerCase();
  const n = book.tabs.length;
  if (k === 'escape' || k === 'i') return closeBook();
  if (k === 'a' || k === 'arrowleft') book.current = (book.current + n - 1) % n;
  else if (k === 'd' || k === 'arrowright' || k === 'tab') book.current = (book.current + 1) % n;
  else if (k >= '1' && k <= String(n)) book.current = Number(k) - 1;
  else if (k === 'w' || k === 'arrowup') return panel.querySelector('.book-box').scrollBy({ top: -120 });
  else if (k === 's' || k === 'arrowdown') return panel.querySelector('.book-box').scrollBy({ top: 120 });
  else return;
  showTab();
}

function onBookClick(e) {
  if (performance.now() - book.openedAt < OPEN_GRACE) return;
  if (isCloseClick(e) || !e.target.closest('.book-box')) return closeBook();
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    book.current = Number(tab.dataset.tab);
    return showTab();
  }
  const filter = e.target.closest('[data-filter]');
  if (filter) {
    book.filter = filter.dataset.filter;
    applyFilter();
  }
}

function closeBook() {
  window.removeEventListener('keydown', onBookKey, true);
  panel.removeEventListener('click', onBookClick);
  panel.classList.remove('show');
  book = null;
  const cb = onClose;
  onClose = null;
  cb?.();
}
