// Touch-Steuerung fürs Tablet: Joystick (linke Bildschirmhälfte, erscheint dort, wo der Finger aufsetzt),
// Aktionsknopf rechts unten (zeigt das getragene Werkzeug) und Menü-Knopf oben rechts.
// Erscheint erst, wenn der Bildschirm berührt wird; am PC mit Tastatur ändert sich nichts.

const RADIUS = 55; // so weit (CSS-Pixel) lässt sich der Knopf des Joysticks ziehen
const DEADZONE = 0.15; // kleine Ausschläge zählen nicht

// Laufrichtung vom Joystick: x/y zwischen -1 und 1 (Bildschirmrichtung), 0/0 = steht
export const touch = { x: 0, y: 0 };

// Symbole des Vollbild-Knopfs: Ecken nach außen (Vollbild an) bzw. nach innen (Vollbild aus)
const ICON = (d) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON_EXPAND = ICON('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>');
const ICON_SHRINK = ICON('<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/>');

// Die Szene trägt hier ein, was die Knöpfe tun (wird bei jedem Levelwechsel neu gesetzt)
export const touchHandlers = { action: null, menu: null };

let ui = null;

export function setupTouchControls() {
  const zone = document.getElementById('stick-zone');
  const base = document.getElementById('stick');
  const knob = document.getElementById('stick-knob');
  const action = document.getElementById('btn-action');
  const menu = document.getElementById('btn-menu');
  ui = { action };

  // Sobald der Bildschirm berührt wird: Touch-Ansicht einschalten
  window.addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });
  // Vollbild: Chrome erlaubt es erst beim Loslassen des Fingers (touchend), nicht beim Aufsetzen.
  // Bei jedem Tippen erneut versuchen, falls das Vollbild verlassen wurde – außer man hat es mit dem Knopf selbst beendet.
  // Der Knopf oben rechts schaltet um: Vollbild an bzw. wieder aus.
  const root = document.documentElement;
  const request = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root);
  const isFull = () => !!(document.fullscreenElement ?? document.webkitFullscreenElement);
  let leftOnPurpose = false; // mit dem Knopf beendet: dann nicht bei jedem Tippen wieder ins Vollbild
  const enterFullscreen = () => {
    if (isFull() || !request || leftOnPurpose) return;
    Promise.resolve(request({ navigationUI: 'hide' }))
      .then(() => screen.orientation?.lock?.('landscape')) // im Vollbild auf quer festhalten
      .catch(() => {});
  };
  if (!request) document.body.classList.add('no-fullscreen'); // z. B. iPhone: dort geht es nicht
  const button = document.getElementById('btn-full');
  const markFull = () => {
    document.body.classList.toggle('fullscreen', isFull());
    button.innerHTML = isFull() ? ICON_SHRINK : ICON_EXPAND;
    button.setAttribute('aria-label', isFull() ? 'Vollbild beenden' : 'Vollbild');
  };
  markFull();
  document.addEventListener('fullscreenchange', markFull);
  document.addEventListener('webkitfullscreenchange', markFull);
  window.addEventListener('touchend', enterFullscreen);
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isFull()) {
      leftOnPurpose = true;
      (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document);
    } else {
      leftOnPurpose = false;
      enterFullscreen();
    }
  });

  let stickId = null;
  let origin = null;
  const move = (e) => {
    let dx = e.clientX - origin.x;
    let dy = e.clientY - origin.y;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const mag = Math.min(1, d / RADIUS);
    if (mag < DEADZONE) {
      touch.x = 0;
      touch.y = 0;
    } else {
      touch.x = dx / RADIUS;
      touch.y = dy / RADIUS;
    }
  };
  const release = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    touch.x = 0;
    touch.y = 0;
    base.classList.remove('show');
    knob.style.transform = '';
  };

  zone.addEventListener('pointerdown', (e) => {
    if (stickId !== null) return;
    stickId = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    origin = { x: e.clientX, y: e.clientY };
    base.style.left = `${origin.x}px`;
    base.style.top = `${origin.y}px`;
    base.classList.add('show');
    move(e);
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId === stickId) move(e);
  });
  zone.addEventListener('pointerup', release);
  zone.addEventListener('pointercancel', release);

  action.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    action.classList.add('pressed');
    touchHandlers.action?.();
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) action.addEventListener(ev, () => action.classList.remove('pressed'));

  menu.addEventListener('click', (e) => {
    e.stopPropagation();
    touchHandlers.menu?.();
  });

  // Kein Kontextmenü beim langen Drücken
  window.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function isTouch() {
  return document.body.classList.contains('touch');
}

// Aktionsknopf zeigt das getragene Werkzeug (oder ist ausgegraut)
// id: Werkzeug (Bild assets/<id>.png); image: anderes Bild, z. B. die Weltkarte am Auto
export function setTouchTool(id, image) {
  if (!ui) return;
  const src = image ?? (id ? `assets/${id}.png` : null);
  ui.action.classList.toggle('empty', !src);
  ui.action.style.backgroundImage = src ? `url(${src})` : '';
}
