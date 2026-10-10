// Touch-Steuerung fürs Tablet: Joystick (linke Bildschirmhälfte, erscheint dort, wo der Finger aufsetzt),
// Aktionsknopf rechts unten (zeigt das getragene Werkzeug) und Neustart-Knopf oben rechts.
// Erscheint erst, wenn der Bildschirm berührt wird; am PC mit Tastatur ändert sich nichts.

const RADIUS = 55; // so weit (CSS-Pixel) lässt sich der Knopf des Joysticks ziehen
const DEADZONE = 0.15; // kleine Ausschläge zählen nicht

// Laufrichtung vom Joystick: x/y zwischen -1 und 1 (Bildschirmrichtung), 0/0 = steht
export const touch = { x: 0, y: 0 };

// Die Szene trägt hier ein, was die Knöpfe tun (wird bei jedem Levelwechsel neu gesetzt)
export const touchHandlers = { action: null, reset: null };

let ui = null;

export function setupTouchControls() {
  const zone = document.getElementById('stick-zone');
  const base = document.getElementById('stick');
  const knob = document.getElementById('stick-knob');
  const action = document.getElementById('btn-action');
  const reset = document.getElementById('btn-reset');
  ui = { action };

  // Sobald der Bildschirm berührt wird: Touch-Ansicht einschalten
  window.addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });
  // Vollbild: Chrome erlaubt es erst beim Loslassen des Fingers (touchend), nicht beim Aufsetzen.
  // Bei jedem Tippen erneut versuchen, falls das Vollbild verlassen wurde (z. B. durch die Neustart-Rückfrage).
  window.addEventListener('touchend', () => {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    document.documentElement
      .requestFullscreen({ navigationUI: 'hide' })
      .then(() => screen.orientation?.lock?.('landscape')) // im Vollbild auf quer festhalten
      .catch(() => {});
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

  reset.addEventListener('click', () => {
    if (window.confirm('Spiel wirklich neu starten? Alle gefangenen Tiere sind dann weg.')) touchHandlers.reset?.();
  });

  // Kein Kontextmenü beim langen Drücken
  window.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function isTouch() {
  return document.body.classList.contains('touch');
}

// Aktionsknopf zeigt das getragene Werkzeug (oder ist ausgegraut)
export function setTouchTool(id) {
  if (!ui) return;
  ui.action.classList.toggle('empty', !id);
  ui.action.style.backgroundImage = id ? `url(assets/${id}.png)` : '';
}
