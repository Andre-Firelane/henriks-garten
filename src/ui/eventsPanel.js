// Events am Hauptrechner im Haupthaus: Kacheln mit allen Events, ihren Herzkosten und ihrem Zustand (startbar, läuft,
// Pause mit Countdown). Tablet: antippen. Laptop: mit A/D wählen, mit E, Enter oder Leertaste starten. Esc schließt.
import { formatTime } from '../world/events.js';

let panel = null;
let state = null;
let openedAt = 0;
let timer = null;
const OPEN_GRACE = 400; // Millisekunden nach dem Öffnen, in denen Klicks nichts tun

export function isEventsOpen() {
  return !!panel?.classList.contains('show');
}

// Vorschaubilder aus den vorhandenen Sprites: [Bild, Breite, Höhe eines Frames, Frame, Größe, links, unten]
const THUMBS = {
  babies: [
    ['sheep', 80, 88, 0, 0.62, 6, 10],
    ['sheep', 80, 88, 1, 0.36, 50, 8],
    ['deer', 72, 96, 1, 0.6, 96, 12],
    ['deer', 72, 96, 0, 0.34, 78, 6],
  ],
  flamingo: [
    ['flamingo_fly', 104, 100, 0, 0.62, 10, 26],
    ['flamingo', 88, 108, 1, 0.6, 96, 6],
    ['flamingo', 88, 108, 0, 0.5, 66, 2],
  ],
  icecream: [
    ['icecream_stand', 128, 128, 0, 0.78, 40, -6],
    ['icecream_seller', 72, 116, 0, 0.62, 6, 2],
    ['icecream', 24, 36, 0, 0.9, 140, 40],
  ],
  farm: [
    ['farm_cow', 80, 88, 0, 0.75, 2, 4],
    ['farm_goat', 80, 88, 1, 0.65, 108, 6],
    ['farm_pig', 80, 88, 0, 0.6, 62, 0],
  ],
  ride: [
    ['ride_meadow', 160, 230, 0, 0.38, 2, 0],
    ['ride_savanna', 160, 230, 1, 0.4, 92, 0],
  ],
};

function thumb(id) {
  const parts = (THUMBS[id] ?? [])
    .map(([img, w, h, frame, k, left, bottom]) => {
      const style = `width:${w}px;height:${h}px;left:${left}px;bottom:${bottom}px;transform:scale(${k});`
        + `background:url(assets/${img}.png) -${frame * w}px 0 / ${w * 4}px ${h}px no-repeat;`;
      return `<span class="ev-sprite" style="${style}"></span>`;
    })
    .join('');
  const love = id === 'babies' ? '<span class="ev-love" style="left:40px;top:6px">♥</span><span class="ev-love" style="left:120px;top:16px">♥</span><span class="ev-love small" style="left:72px;top:30px">♥</span>' : '';
  return `<div class="ev-thumb">${parts}${love}</div>`;
}

// getInfo(): [{ id, name, text, cost, state: 'ready'|'active'|'cooldown', left, blocked }] (blocked: warum man es nicht
// starten kann, sonst null) und das Herzkonto; onStart(id) startet ein Event
export function openEvents(getInfo, onStart, onClose) {
  panel = document.getElementById('events');
  state = { getInfo, onStart, onClose, selected: 0 };
  render();
  panel.classList.add('show');
  openedAt = performance.now();
  timer = setInterval(tick, 500); // Countdown weiterzählen
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
    panel.addEventListener('pointerover', onHover);
  }, 0);
}

function status(ev) {
  if (ev.state === 'active') return `<span class="ev-status on">läuft noch ${formatTime(ev.left)}</span>`;
  if (ev.state === 'cooldown') return `<span class="ev-status wait">wieder in ${formatTime(ev.left)}</span>`;
  if (ev.blocked) return `<span class="ev-status wait">${ev.blocked}</span>`;
  return '<span class="ev-status go">Starten</span>';
}

// ganze Tafel aufbauen
function render() {
  const { events, hearts } = state.getInfo();
  state.events = events;
  panel.innerHTML = `<div class="chest-box ev-box">
      <h2>Events</h2>
      <p class="ev-hearts">Dein Konto: <span class="heart">♥</span> <b>${hearts}</b></p>
      <div class="chest-items">${events
        .map(
          (ev, i) => `<button class="chest-item ev-item" data-i="${i}">
            ${thumb(ev.id)}<span class="ev-name">${ev.name}</span><small>${ev.text}</small>
            <span class="ev-cost"><span class="heart">♥</span> ${ev.cost}</span><span class="ev-state"></span>
          </button>`,
        )
        .join('')}</div>
      <p class="chest-hint">Tippe auf ein Event – oder wähle mit <b>A</b>/<b>D</b> und starte es mit <b>E</b>.</p>
    </div>`;
  tick();
}

// nur Zustand, Countdown und Auswahl auffrischen (die Knöpfe bleiben dieselben, damit kein Antippen verloren geht)
function tick() {
  const { events, hearts } = state.getInfo();
  state.events = events;
  panel.querySelector('.ev-hearts b').textContent = hearts;
  panel.querySelectorAll('.ev-item').forEach((b, i) => {
    const ev = events[i];
    b.classList.toggle('off', !(ev.state === 'ready' && !ev.blocked));
    b.classList.toggle('selected', i === state.selected);
    b.querySelector('.ev-cost').classList.toggle('short', hearts < ev.cost && ev.state === 'ready');
    const html = status(ev);
    const box = b.querySelector('.ev-state');
    if (box.innerHTML !== html) box.innerHTML = html;
  });
}

function onKey(e) {
  e.preventDefault();
  e.stopPropagation(); // die Taste soll im Spiel nichts auslösen
  const k = e.key.toLowerCase();
  const n = state.events.length;
  if (k === 'a' || k === 'arrowleft' || k === 'w' || k === 'arrowup') state.selected = (state.selected + n - 1) % n;
  else if (k === 'd' || k === 'arrowright' || k === 's' || k === 'arrowdown') state.selected = (state.selected + 1) % n;
  else if (k === 'e' || k === 'enter' || k === ' ') return start(state.selected);
  else if (k === 'escape') return close(true);
  tick();
}

// Maus über einer Kachel: sie wird die Auswahl (so ist immer nur eine hervorgehoben, auch zusammen mit A/D)
function onHover(e) {
  const b = e.target.closest('.ev-item');
  if (!b || e.pointerType === 'touch') return;
  state.selected = Number(b.dataset.i);
  tick();
}

function onClick(e) {
  // auf dem Tablet kommt nach dem Antippen, das die Tafel geöffnet hat, noch ein Klick hinterher
  if (performance.now() - openedAt < OPEN_GRACE) return;
  const b = e.target.closest('.ev-item');
  if (b) start(Number(b.dataset.i));
  else close(true);
}

function start(i) {
  const ev = state.events[i];
  if (!ev || ev.state !== 'ready' || ev.blocked) return; // gesperrte Kachel: nichts tun
  const cb = state.onStart;
  close(false);
  cb(ev.id);
}

function close(cancelled) {
  clearInterval(timer);
  window.removeEventListener('keydown', onKey, true);
  panel.removeEventListener('click', onClick);
  panel.removeEventListener('pointerover', onHover);
  panel.classList.remove('show');
  const cb = state.onClose;
  state = null;
  if (cancelled) cb?.();
}
