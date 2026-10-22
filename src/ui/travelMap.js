// Weltkarte für die Schnellreise (am Auto): jedes Gebiet ist mit einem typischen Tier und seinem Namen eingezeichnet.
// Tablet: aufs Gebiet tippen. Laptop: mit WASD (oder Pfeiltasten) auswählen, mit E, Enter oder Leertaste losfahren.
// Esc oder ein Tipp neben die Gebiete schließt die Karte.
import { animalIconSquare } from './icons.js';
import { CLOSE_BUTTON, isCloseClick } from './closeButton.js';

let panel = null;
let state = null;
let openedAt = 0;
const OPEN_GRACE = 400; // Millisekunden nach dem Öffnen, in denen Klicks nichts tun

export function isTravelMapOpen() {
  return !!panel?.classList.contains('show');
}

// places: [{ id, name, icon, x, y }] (x/y in Prozent der Karte); current: Gebiet, in dem man gerade ist;
// onTravel(id) wird beim Losfahren aufgerufen, onClose beim Schließen ohne Reise
export function openTravelMap(places, current, onTravel, onClose) {
  panel = document.getElementById('travel');
  const markers = places
    .map(
      (p) => `<button class="place${p.id === current ? ' here' : ''}" data-id="${p.id}" style="left:${p.x}%;top:${p.y}%">
        ${animalIconSquare(p.icon, 3.4)}<span>${p.name}${p.id === current ? '<small>Du bist hier</small>' : ''}</span>
      </button>`,
    )
    .join('');
  panel.innerHTML = `<div class="travel-box">${CLOSE_BUTTON}
      <div class="travel-map">${markers}</div>
      <p class="travel-hint">Wohin soll die Reise gehen? Tippe auf ein Gebiet – oder wähle mit <b>WASD</b> und fahre mit <b>E</b> los.</p>
    </div>`;
  panel.classList.add('show');
  openedAt = performance.now();
  const targets = places.filter((p) => p.id !== current);
  state = { places: targets, selected: 0, onTravel, onClose };
  highlight();
  // erst nach diesem Tastendruck reagieren, sonst fährt die Taste E gleich los
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
  }, 0);
}

function highlight() {
  const id = state.places[state.selected]?.id;
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
