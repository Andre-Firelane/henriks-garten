// Steuerungs-Hinweis direkt nach dem ersten Gespräch mit Mavi (statt einer Tafel zu Spielbeginn): der Bildschirm wird
// leicht abgedunkelt und zeigt, wie man läuft und etwas benutzt.
// Tablet/Handy: die linke Hälfte ist hervorgehoben, darin drei Zustände des Joysticks (aufsetzen, ziehen, in jede Richtung),
// die nacheinander aufleuchten; der Aktionsknopf unten rechts liegt über der Abdunkelung, mit pulsierendem Ring und Text.
// PC: die Tasten W A S D leuchten nacheinander auf, daneben die Taste E.
// Das Spiel läuft weiter (die Tafel fängt keine Tipps ab); sobald man ein Stück gelaufen ist, blendet sie sich aus.
import { tr } from '../i18n.js';
import { touch, isTouch } from './touch.js';

const WALK_TO_CLOSE = 1200; // so lange (ms) nach dem ersten Schritt bleibt der Hinweis noch stehen …
const MIN_SHOW = 4500; // … insgesamt aber mindestens so lange (damit man auch die Aktionstaste liest)
const MOVE_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

let el = null;
let cleanup = null;

// ein Joystick wie im Spiel; dx/dy: Ausschlag des Knopfs (-1 … 1), arrow: Pfeil in Zugrichtung
const stick = (dx, dy, label, arrow) => `<div class="wh-step">
    <div class="wh-stick">
      ${arrow ? `<svg class="wh-arrow" viewBox="-50 -50 100 100" style="transform: rotate(${Math.atan2(dy, dx)}rad)"><path d="M6 0 H40 M30 -10 L40 0 L30 10" /></svg>` : ''}
      <div class="wh-knob" style="transform: translate(${dx * 26}px, ${dy * 26}px)"><span class="wh-finger"></span></div>
    </div>
    <span class="wh-label">${label}</span>
  </div>`;

export function showWalkHint() {
  closeWalkHint();
  const mobile = isTouch() || matchMedia('(pointer: coarse)').matches;
  el = document.createElement('div');
  el.id = 'walk-hint';
  el.className = mobile ? 'mobile' : 'desktop';
  const use = tr('Werkzeug benutzen, ins Auto steigen, Regal öffnen …', 'use your tool, get into the car, open the shelf …');
  el.innerHTML = mobile
    ? `<div class="wh-half">
        <div class="wh-box">
          <b class="wh-title">${tr('Laufen', 'Walk')}</b>
          <div class="wh-steps">
            ${stick(0, 0, tr('Finger aufsetzen', 'Put a finger down'))}
            ${stick(1, 0, tr('ziehen', 'drag'), true)}
            ${stick(-0.7, -0.7, tr('in jede Richtung', 'any direction'), true)}
          </div>
          <p class="wh-text">${tr('Irgendwo auf der linken Hälfte – je weiter du ziehst, desto schneller.', 'Anywhere on the left half – the further you drag, the faster you go.')}</p>
        </div>
      </div>
      <div class="wh-ring"></div>
      <div class="wh-box wh-action">
        <b class="wh-title">${tr('Aktionsknopf', 'Action button')}</b>
        <p class="wh-text">${use}</p>
      </div>`
    : `<div class="wh-box">
        <div class="wh-groups">
          <div class="wh-group">
            <b class="wh-title">${tr('Laufen', 'Walk')}</b>
            <div class="wh-keys">
              <kbd class="k-w">W</kbd>
              <kbd class="k-a">A</kbd><kbd class="k-s">S</kbd><kbd class="k-d">D</kbd>
            </div>
            <p class="wh-text">${tr('oder Pfeiltasten', 'or arrow keys')}</p>
          </div>
          <div class="wh-group">
            <b class="wh-title">${tr('Benutzen', 'Use')}</b>
            <div class="wh-keys one"><kbd class="k-e">E</kbd></div>
            <p class="wh-text">${tr('oder Enter / Linksklick', 'or Enter / left click')}<br>${use}</p>
          </div>
        </div>
      </div>`;
  document.getElementById('stick-zone').before(el); // unter dem echten Joystick, damit der beim Ausprobieren obenauf liegt
  document.body.classList.add('walk-hint'); // hebt den Aktionsknopf über die Abdunkelung
  requestAnimationFrame(() => el?.classList.add('show'));
  const shown = performance.now();

  // erster Schritt (Taste oder Joystick): kurz darauf ausblenden
  let timer = null;
  let frame = 0;
  const walked = () => {
    if (!timer) timer = setTimeout(closeWalkHint, Math.max(WALK_TO_CLOSE, MIN_SHOW - (performance.now() - shown)));
  };
  const onKey = (e) => {
    if (MOVE_KEYS.includes(e.key.toLowerCase())) walked();
  };
  const poll = () => {
    if (touch.x || touch.y) walked();
    frame = requestAnimationFrame(poll);
  };
  window.addEventListener('keydown', onKey);
  frame = requestAnimationFrame(poll);
  cleanup = () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    window.removeEventListener('keydown', onKey);
  };
}

export function closeWalkHint() {
  cleanup?.();
  cleanup = null;
  document.body.classList.remove('walk-hint');
  if (!el) return;
  const old = el;
  el = null;
  old.classList.remove('show');
  setTimeout(() => old.remove(), 400);
}
