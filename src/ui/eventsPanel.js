// Hauptrechner im Haupthaus: zwei Reiter – "Events" (gegen Herzen starten; Kosten, läuft, Pause mit Countdown) und
// "Gehege" (gegen Herzen ausbauen: mehr Plätze und neue Ausstattung). Tablet: Reiter und Kacheln antippen.
// Laptop: Q/Tab wechselt den Reiter, A/D wählt, E/Enter/Leertaste bestätigt, Esc schließt.
import { formatTime } from '../world/events.js';
import { animalIcons } from './icons.js';
import { CLOSE_BUTTON, isCloseClick } from './closeButton.js';
import { tr } from '../i18n.js';

let panel = null;
let state = null;
let openedAt = 0;
let timer = null;
const OPEN_GRACE = 400; // Millisekunden nach dem Öffnen, in denen Klicks nichts tun
const TABS = [
  ['events', 'Events'],
  ['pens', tr('Gehege ausbauen', 'Upgrade enclosures')],
];

export function isEventsOpen() {
  return !!panel?.classList.contains('show');
}

// Vorschaubilder aus den vorhandenen Sprites: [Bild, Breite, Höhe eines Frames, Frame, Größe, links, unten, Anzahl Frames (4)]
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
    ['icecream_seller', 72, 116, 0, 0.8, 22, 0],
    ['icecream', 24, 36, 0, 2, 108, 4, 1],
  ],
  farm: [
    ['farm_cow', 96, 88, 0, 0.7, 0, 4],
    ['farm_goat', 80, 88, 1, 0.65, 108, 6],
    ['farm_pig', 80, 88, 0, 0.6, 62, 0],
  ],
  rare: [
    ['antelope2', 72, 100, 0, 0.6, 0, 4],
    ['cat2', 72, 80, 1, 0.6, 96, 6],
    ['frog2', 56, 52, 0, 0.7, 66, 0],
  ],
  migration: [
    ['gnu', 88, 96, 0, 0.7, 6, 2],
    ['gnu', 88, 96, 1, 0.55, 104, 10],
    ['gnu', 88, 96, 0, 0.45, 62, 18],
  ],
  wolves: [
    ['wolf_howl', 80, 80, 0, 0.75, 14, 0],
    ['wolf', 80, 80, 1, 0.7, 104, 2],
    ['wolf_howl', 80, 80, 1, 0.55, 66, 14],
  ],
  jellyfish: [
    ['jellyfish', 64, 96, 0, 0.75, 14, 0],
    ['jellyfish2', 64, 96, 0, 0.6, 84, 8],
    ['jellyfish', 64, 96, 2, 0.5, 132, 14],
  ],
  // Wetterwechsel: Wettersymbole statt Tieren ([Zeichen, Schriftgröße in px, links, unten])
  fireflies: [
    ['emoji', '🏮', 32, 8, 10],
    ['emoji', '✨', 30, 66, 34],
    ['redpanda', 72, 72, 0, 0.7, 98, 2],
  ],
  weather: [
    ['emoji', '☀️', 34, 8, 14],
    ['emoji', '🌧️', 40, 58, 22],
    ['emoji', '🌿', 30, 116, 8],
  ],
  ride: [
    ['ride_meadow', 160, 230, 0, 0.38, 2, 0],
    ['ride_savanna', 160, 230, 1, 0.4, 92, 0],
  ],
};

function thumb(item) {
  if (item.species) return `<div class="ev-thumb pen-thumb">${animalIcons(item.species, 3.4)}</div>`; // Gehege: seine Tiere
  const parts = (THUMBS[item.id] ?? [])
    .map(([img, w, h, frame, k, left, bottom, frames = 4]) => {
      // Wettersymbol: ['emoji', Zeichen, Schriftgröße, links, unten]
      if (img === 'emoji') return `<span class="ev-sprite" style="left:${frame}px;bottom:${k}px;font-size:${h}px;line-height:1">${w}</span>`;
      const style = `width:${w}px;height:${h}px;left:${left}px;bottom:${bottom}px;transform:scale(${k});`
        + `background:url(assets/${img}.png) -${frame * w}px 0 / ${w * frames}px ${h}px no-repeat;`;
      return `<span class="ev-sprite" style="${style}"></span>`;
    })
    .join('');
  const love = item.id === 'babies' ? '<span class="ev-love" style="left:40px;top:6px">♥</span><span class="ev-love" style="left:120px;top:16px">♥</span><span class="ev-love small" style="left:72px;top:30px">♥</span>' : '';
  return `<div class="ev-thumb">${parts}${love}</div>`;
}

// getInfo(): { hearts, events: [...], pens: [...] }. Ein Event: { id, name, text, cost, state, left, blocked };
// ein Gehege: { id, name, text, cost, species, done, blocked }. onPick(tab, id) startet bzw. baut aus.
// opts: { tab: 'pens', only: Gehege-Id } zeigt nur den Ausbau dieses einen Geheges, ohne Reiter (am Gehegeschild)
export function openEvents(getInfo, onPick, onClose, opts = {}) {
  panel = document.getElementById('events');
  state = { getInfo, onPick, onClose, tab: opts.tab ?? 'events', only: opts.only ?? null, selected: 0 };
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

// was die Kachel unten anzeigt und ob man sie wählen kann
function status(item) {
  if (state.tab === 'pens') {
    if (item.done) return [`<span class="ev-status on">${tr('ausgebaut', 'upgraded')} ✓</span>`, false];
    if (item.blocked) return [`<span class="ev-status wait">${item.blocked}</span>`, false];
    return [`<span class="ev-status go">${tr('Ausbauen', 'Upgrade')}</span>`, true];
  }
  if (item.state === 'active') return [`<span class="ev-status on">${tr(`läuft noch ${formatTime(item.left)}`, `running · ${formatTime(item.left)} left`)}</span>`, false];
  if (item.state === 'cooldown') return [`<span class="ev-status wait">${tr('wieder in', 'again in')} ${formatTime(item.left)}</span>`, false];
  if (item.blocked) return [`<span class="ev-status wait">${item.blocked}</span>`, false];
  return [`<span class="ev-status go">${tr('Starten', 'Start')}</span>`, true];
}

function items() {
  const info = state.getInfo();
  const list = state.only ? info[state.tab].filter((it) => it.id === state.only) : info[state.tab];
  return { hearts: info.hearts, list };
}

// ganze Tafel aufbauen (auch beim Wechsel des Reiters)
function render() {
  const { hearts, list } = items();
  state.list = list;
  state.selected = Math.min(state.selected, Math.max(0, list.length - 1));
  const tabs = state.only
    ? `<span class="ev-tab on">${TABS.find(([id]) => id === state.tab)[1]}</span>` // nur dieses Gehege: keine Reiter
    : TABS.map(([id, label]) => `<button class="ev-tab${id === state.tab ? ' on' : ''}" data-tab="${id}">${label}</button>`).join('');
  const hint = state.tab === 'pens'
    ? tr('Ein ausgebautes Gehege hat mehr Plätze und neue Ausstattung.', 'An upgraded enclosure has more spaces and new equipment.')
    : tr('Tippe auf ein Event – oder wähle mit <b>A</b>/<b>D</b> und starte es mit <b>E</b>.', 'Tap an event – or choose with <b>A</b>/<b>D</b> and start it with <b>E</b>.');
  panel.innerHTML = `<div class="chest-box ev-box">${CLOSE_BUTTON}
      <div class="ev-tabs">${tabs}</div>
      <p class="ev-hearts">${tr('Dein Konto', 'Your hearts')}: <span class="heart">♥</span> <b>${hearts}</b></p>
      <div class="chest-items">${list
        .map(
          (it, i) => `<button class="chest-item ev-item" data-i="${i}">
            ${thumb(it)}<span class="ev-name">${it.name}</span><small>${it.text}</small>
            ${it.done ? '' : `<span class="ev-cost"><span class="heart">♥</span> ${it.cost}</span>`}<span class="ev-state"></span>
          </button>`,
        )
        .join('')}</div>
      <p class="chest-hint">${hint}${state.only ? tr(' <b>Esc</b> schließt.', ' <b>Esc</b> closes.') : tr(' <b>Q</b> wechselt zwischen Events und Gehegen.', ' <b>Q</b> switches between events and enclosures.')}</p>
    </div>`;
  tick();
}

// nur Zustand, Countdown und Auswahl auffrischen (die Knöpfe bleiben dieselben, damit kein Antippen verloren geht)
function tick() {
  const { hearts, list } = items();
  state.list = list;
  panel.querySelector('.ev-hearts b').textContent = hearts;
  panel.querySelectorAll('.ev-item').forEach((b, i) => {
    const it = list[i];
    if (!it) return;
    const [html, can] = status(it);
    b.classList.toggle('off', !can);
    b.classList.toggle('selected', i === state.selected);
    b.querySelector('.ev-cost')?.classList.toggle('short', hearts < it.cost && !it.done);
    const box = b.querySelector('.ev-state');
    if (box.innerHTML !== html) box.innerHTML = html;
  });
}

function switchTab(tab) {
  state.tab = tab ?? (state.tab === 'events' ? 'pens' : 'events');
  state.selected = 0;
  render();
}

function onKey(e) {
  e.preventDefault();
  e.stopPropagation(); // die Taste soll im Spiel nichts auslösen
  const k = e.key.toLowerCase();
  const n = state.list.length;
  if ((k === 'q' || k === 'tab') && !state.only) return switchTab();
  if (k === 'a' || k === 'arrowleft' || k === 'w' || k === 'arrowup') state.selected = (state.selected + n - 1) % n;
  else if (k === 'd' || k === 'arrowright' || k === 's' || k === 'arrowdown') state.selected = (state.selected + 1) % n;
  else if (k === 'e' || k === 'enter' || k === ' ') return pick(state.selected);
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
  if (isCloseClick(e)) return close(true);
  const t = e.target.closest('.ev-tab');
  if (t) return state.only ? undefined : switchTab(t.dataset.tab);
  const b = e.target.closest('.ev-item');
  if (b) pick(Number(b.dataset.i));
  else if (!e.target.closest('.ev-box')) close(true); // Tipp neben die Tafel schließt
}

function pick(i) {
  const it = state.list[i];
  if (!it || !status(it)[1]) return; // gesperrte Kachel: nichts tun
  const { onPick, tab } = state;
  close(false);
  onPick(tab, it.id);
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
