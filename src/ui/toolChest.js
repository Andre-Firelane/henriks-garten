// Werkzeug-Kiste in der Hütte: großes Auswahlfeld mit allen Werkzeugen dieses Gebiets und "Hände frei".
// Tablet: antippen. Laptop: mit A/D (oder Pfeiltasten) wählen, mit E, Enter oder Leertaste nehmen. Esc schließt.

let panel = null;
let state = null;
let openedAt = 0;
const OPEN_GRACE = 400; // Millisekunden nach dem Öffnen, in denen Klicks nichts tun

export function isToolChestOpen() {
  return !!panel?.classList.contains('show');
}

// items: [{ id, name, image }] (id null = Hände frei); current: getragenes Werkzeug; onPick(id) beim Auswählen
export function openToolChest(items, current, onPick, onClose) {
  panel = document.getElementById('chest');
  panel.innerHTML = `<div class="chest-box">
      <h2>Was möchtest du mitnehmen?</h2>
      <div class="chest-items">${items
        .map(
          (it, i) => `<button class="chest-item${it.id === current ? ' carried' : ''}" data-i="${i}">
            <img src="assets/${it.image}.png" alt=""><span>${it.name}</span>${it.id === current ? '<small>in der Hand</small>' : ''}
          </button>`,
        )
        .join('')}</div>
      <p class="chest-hint">Tippe auf ein Werkzeug – oder wähle mit <b>A</b>/<b>D</b> und nimm es mit <b>E</b>.</p>
    </div>`;
  panel.classList.add('show');
  openedAt = performance.now();
  const start = Math.max(0, items.findIndex((it) => it.id !== current));
  state = { items, selected: start, onPick, onClose };
  highlight();
  // erst nach diesem Tastendruck reagieren, sonst nimmt die Taste E gleich etwas heraus
  setTimeout(() => {
    window.addEventListener('keydown', onKey, true);
    panel.addEventListener('click', onClick);
  }, 0);
}

function highlight() {
  panel.querySelectorAll('.chest-item').forEach((b, i) => b.classList.toggle('selected', i === state.selected));
}

function onKey(e) {
  e.preventDefault();
  e.stopPropagation(); // die Taste soll im Spiel nichts auslösen
  const k = e.key.toLowerCase();
  const n = state.items.length;
  if (k === 'a' || k === 'arrowleft' || k === 'w' || k === 'arrowup') state.selected = (state.selected + n - 1) % n;
  else if (k === 'd' || k === 'arrowright' || k === 's' || k === 'arrowdown') state.selected = (state.selected + 1) % n;
  else if (k === 'e' || k === 'enter' || k === ' ') return pick(state.selected);
  else if (k === 'escape') return close(true);
  highlight();
}

function onClick(e) {
  // auf dem Tablet kommt nach dem Antippen, das die Tafel geöffnet hat, noch ein Klick hinterher: nicht gleich wieder schließen
  if (performance.now() - openedAt < OPEN_GRACE) return;
  const b = e.target.closest('.chest-item');
  if (b) pick(Number(b.dataset.i));
  else close(true);
}

function pick(i) {
  const cb = state.onPick;
  const id = state.items[i].id;
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
