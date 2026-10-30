// Weltkarte für die Schnellreise (am Auto): jedes Gebiet ist mit einem typischen Tier und seinem Namen eingezeichnet.
// Tablet: aufs Gebiet tippen. Laptop: mit WASD (oder Pfeiltasten) auswählen, mit E, Enter oder Leertaste losfahren.
// Esc oder ein Tipp neben die Gebiete schließt die Karte.
import { animalIconSquare } from './icons.js';
import { CLOSE_BUTTON, isCloseClick } from './closeButton.js';
import { tr } from '../i18n.js';
import { isTouch, IS_PHONE } from './touch.js';

const MARGIN = 6; // so viel Rand um die Schilder beim Verschieben (Handy)
const HINT_SPACE = 30; // unten frei für den Hinweis
const PHONE_ZOOM = 1.2; // auf dem Handy füllt die Karte den Bildschirm und ist dazu noch so viel größer (zum Verschieben)

let panel = null;
let state = null;
let openedAt = 0;
const OPEN_GRACE = 400; // Millisekunden nach dem Öffnen, in denen Klicks nichts tun

export function isTravelMapOpen() {
  return !!panel?.classList.contains('show');
}

// places: [{ id, name, icon, x, y, status, parts }] (x/y in Prozent der Karte; status: z. B. die Wetterphase der Savanne;
// parts: [{ id, name, icon }] – das Gebiet hat mehrere Ziele, z. B. der Tierpark mit Zentrum und Reptilienhaus: dann ein
// größeres Schild mit einem Feld je Ziel, übereinander; main: das Hauptziel, sein Feld ist größer); current: Ziel, an dem man gerade ist;
// onTravel(id) wird beim Losfahren aufgerufen, onClose beim Schließen ohne Reise.
// opts: { point: Gebiet, side: 'left' (sonst rechts), hint: Text } – Mini-Tutorial: hüpfender Pfeil neben diesem Gebiet und
// der Hinweis statt der Anleitung
export function openTravelMap(places, current, onTravel, onClose, opts = {}) {
  panel = document.getElementById('travel');
  const button = (p, style = '') => `<button class="place${p.id === current ? ' here' : ''}${p.main ? ' main' : ''}" data-id="${p.id}"${style}>
        ${animalIconSquare(p.icon, 3.4)}<span>${p.name}${p.id === current ? `<small>${tr('Du bist hier', 'You are here')}</small>` : p.wip ? `<small>🚧 ${tr('in Arbeit', 'in progress')}</small>` : ''}</span>
        ${p.status ? `<span class="season-tag">${p.status}</span>` : ''}
        ${p.id === opts.point ? (opts.side === 'left' ? '<span class="tut-arrow left">▶</span>' : '<span class="tut-arrow">◀</span>') : ''}
      </button>`;
  const markers = places
    .map((p) =>
      p.parts
        ? `<div class="place-group" style="left:${p.x}%;top:${p.y}%"><span class="group-title">${p.name}</span>${p.parts.map((q) => button(q)).join('')}</div>`
        : button(p, ` style="left:${p.x}%;top:${p.y}%"`),
    )
    .join('');
  panel.innerHTML = `<div class="travel-box${IS_PHONE ? ' phone' : ''}" style="--map-zoom:${IS_PHONE ? PHONE_ZOOM : 1}">${CLOSE_BUTTON}
      <div class="travel-scroll"><div class="travel-map">${markers}</div></div>
      <p class="travel-hint${opts.hint ? ' tut' : ''}">${opts.hint ? `<span class="tut-hint">${opts.hint}</span>` : tr('Wohin soll die Reise gehen? Tippe auf ein Gebiet – oder wähle mit <b>WASD</b> und fahre mit <b>E</b> los.', 'Where do you want to go? Tap an area – or choose with <b>WASD</b> and drive off with <b>E</b>.')}</p>
    </div>`;
  panel.classList.add('show');
  openedAt = performance.now();
  // herangezoomt: so verschieben, dass alle Schilder zu sehen sind (frei bleibt unten der Hinweis). Passen sie nicht
  // alle hinein, gewinnt das Tierpark-Schild (das wichtigste, oben links): abgeschnitten wird dann unten bzw. rechts
  if (IS_PHONE) {
    const scroll = panel.querySelector('.travel-scroll');
    const s = scroll.getBoundingClientRect();
    const view = { w: scroll.clientWidth, h: scroll.clientHeight - HINT_SPACE };
    const rects = [...panel.querySelectorAll('.travel-map > .place, .travel-map > .place-group')].map((el) => el.getBoundingClientRect());
    const box = {
      left: Math.min(...rects.map((r) => r.left)) - s.left - MARGIN,
      top: Math.min(...rects.map((r) => r.top)) - s.top - MARGIN,
      right: Math.max(...rects.map((r) => r.right)) - s.left + MARGIN,
      bottom: Math.max(...rects.map((r) => r.bottom)) - s.top + MARGIN,
    };
    const fit = (lo, hi, size) => (hi - lo <= size ? (lo + hi - size) / 2 : lo); // mittig, sonst bündig am Anfang
    scroll.scrollLeft = fit(box.left, box.right, view.w);
    scroll.scrollTop = fit(box.top, box.bottom, view.h);
  }
  // Ziele zum Auswählen mit WASD: die Felder eines größeren Schilds übereinander (für die Richtung etwas versetzt)
  const flat = places.flatMap((p) => (p.parts ? p.parts.map((q, i) => ({ ...q, x: p.x, y: p.y + (i - (p.parts.length - 1) / 2) * 9 })) : [p]));
  const targets = flat.filter((p) => p.id !== current);
  // keys: die Auswahl ist zu sehen (am PC gleich, auf Tablet und Handy erst nach einem Tastendruck – dort tippt man direkt)
  // im Mini-Tutorial ist das Ziel des Pfeils vorausgewählt
  state = { places: targets, selected: Math.max(0, targets.findIndex((p) => p.id === opts.point)), keys: !isTouch(), onTravel, onClose };
  highlight();
  // erst nach diesem Tastendruck reagieren, sonst fährt die Taste E gleich los
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
  }, 0);
}

function highlight() {
  const id = state.keys ? state.places[state.selected]?.id : null;
  for (const b of panel.querySelectorAll('.place')) b.classList.toggle('selected', b.dataset.id === id);
}

// nächstes Gebiet in Richtung (dx, dy) auf der Karte
function move(dx, dy) {
  const cur = state.places[state.selected];
  let best = null;
  state.places.forEach((p, i) => {
    if (i === state.selected) return;
    const vx = p.x - cur.x;
    const vy = (p.y - cur.y) * 0.56; // Karte ist breiter als hoch
    const along = vx * dx + vy * dy;
    if (along <= 0) return;
    const score = Math.hypot(vx, vy) + Math.abs(vx * dy - vy * dx) * 1.5; // gerade Richtung bevorzugen
    if (!best || score < best.score) best = { i, score };
  });
  if (best) {
    state.selected = best.i;
    highlight();
  }
}

function onKey(e) {
  e.preventDefault();
  e.stopPropagation(); // die Taste soll im Spiel nichts auslösen
  const k = e.key.toLowerCase();
  if (!state.keys && k !== 'escape') {
    state.keys = true; // erster Tastendruck auf dem Tablet: erst einmal die Auswahl zeigen
    return highlight();
  }
  if (k === 'w' || k === 'arrowup') move(0, -1);
  else if (k === 's' || k === 'arrowdown') move(0, 1);
  else if (k === 'a' || k === 'arrowleft') move(-1, 0);
  else if (k === 'd' || k === 'arrowright') move(1, 0);
  else if (k === 'e' || k === 'enter' || k === ' ') travel(state.places[state.selected]?.id);
  else if (k === 'escape') close(true);
}

function onClick(e) {
  // auf dem Tablet kommt nach dem Antippen, das die Tafel geöffnet hat, noch ein Klick hinterher: nicht gleich wieder schließen
  if (performance.now() - openedAt < OPEN_GRACE) return;
  if (isCloseClick(e)) return close(true);
  const place = e.target.closest('.place');
  if (place && !place.classList.contains('here')) travel(place.dataset.id);
  else if (!place) close(true);
}

function travel(id) {
  if (!id) return;
  const cb = state.onTravel;
  close(false);
  cb(id);
}

function close(cancelled) {
  window.removeEventListener('keydown', onKey, true);
  panel.removeEventListener('click', onClick);
  panel.classList.remove('show');
  const cb = state.onClose;
  state = null;
  if (cancelled) cb?.();
}
