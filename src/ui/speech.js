// Sprechblasen für Mavi: über ihrem Kopf (say) oder klein am Bildschirmrand mit ihrem Gesicht (sayToast), wenn sie
// gerade nicht zu sehen ist. Der Text erscheint Buchstabe für Buchstabe; Antippen (irgendwo) oder eine beliebige Taste
// zeigt ihn ganz bzw. die nächste Seite (unten in der Blase steht, wie es weitergeht). Solange die Blase offen ist, läuft
// die Spielfigur nicht.
import { tr } from '../i18n.js';
import { isTouch } from './touch.js';

const CHARS_PER_SECOND = 45;
const TOAST_TIME = 6500; // so lange bleibt die kleine Blase am Rand (Millisekunden)

let bubble = null;
let catcher = null;
let toastEl = null;
let state = null; // { pages, page, shown, timer, onDone }
let toastTimer = null;

function ensure() {
  if (bubble) return;
  catcher = document.createElement('div');
  catcher.id = 'speech-catch';
  bubble = document.createElement('div');
  bubble.id = 'speech';
  toastEl = document.createElement('div');
  toastEl.id = 'speech-toast';
  document.body.append(catcher, bubble, toastEl);
  const next = (e) => {
    e.stopPropagation();
    e.preventDefault();
    speechNext();
  };
  catcher.addEventListener('pointerdown', next);
  // jede Taste blättert weiter (vor dem Spiel abgefangen, damit E nicht gleich noch ein Werkzeug benutzt)
  window.addEventListener(
    'keydown',
    (e) => {
      if (!state || e.repeat || ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      speechNext();
    },
    true,
  );
  bubble.addEventListener('pointerdown', next);
  toastEl.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    hideToast();
  });
}

export function isSpeaking() {
  return !!state;
}

// pages: Texte (je eine Seite); onDone nach der letzten
export function say(pages, onDone = null) {
  ensure();
  hideToast();
  clearInterval(state?.timer);
  state = { pages, page: 0, shown: 0, timer: null, onDone };
  bubble.classList.add('show');
  catcher.classList.add('show');
  showPage();
}

function showPage() {
  const text = state.pages[state.page];
  state.shown = 0;
  const last = state.page === state.pages.length - 1;
  const hint = isTouch()
    ? tr(last ? 'Antippen zum Schließen' : 'Zum Weiterlesen antippen', last ? 'Tap to close' : 'Tap to continue')
    : tr(last ? 'Schließen mit beliebiger Taste' : 'Weiter mit beliebiger Taste', last ? 'Press any key to close' : 'Press any key to continue');
  bubble.innerHTML = `<b class="speech-name">Mavi</b><span class="speech-text"></span><span class="speech-more">${hint} ${last ? '' : '▶'}</span>`;
  const el = bubble.querySelector('.speech-text');
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.shown = Math.min(text.length, state.shown + 1);
    el.textContent = text.slice(0, state.shown);
    if (state.shown >= text.length) {
      clearInterval(state.timer);
      bubble.classList.add('done');
    }
  }, 1000 / CHARS_PER_SECOND);
  bubble.classList.remove('done');
}

// Antippen bzw. Aktionstaste: erst den ganzen Text, dann die nächste Seite, nach der letzten schließen
export function speechNext() {
  if (!state) return;
  const text = state.pages[state.page];
  if (state.shown < text.length) {
    clearInterval(state.timer);
    state.shown = text.length;
    bubble.querySelector('.speech-text').textContent = text;
    bubble.classList.add('done');
    return;
  }
  if (state.page < state.pages.length - 1) {
    state.page++;
    showPage();
    return;
  }
  const done = state.onDone;
  closeSpeech();
  done?.();
}

export function closeSpeech() {
  if (!state) return;
  clearInterval(state.timer);
  state = null;
  bubble.classList.remove('show');
  catcher.classList.remove('show');
}

// Blase über dem Kopf: Bildschirmpunkt (Pixel), auf den die Spitze zeigt
export function placeSpeech(x, y) {
  if (!state) return;
  // nicht über den Rand hinaus (die Spitze bleibt über dem Kopf, die Blase rückt zur Seite)
  const w = bubble.offsetWidth;
  const left = Math.max(8 + w / 2, Math.min(window.innerWidth - 8 - w / 2, x));
  bubble.style.left = `${left}px`;
  bubble.style.top = `${Math.max(bubble.offsetHeight + 8, y)}px`;
  bubble.style.setProperty('--tail', `${x - left}px`);
}

// kleine Blase am Rand mit Mavis Gesicht (sie ist gerade nicht zu sehen); geht von selbst wieder weg
export function sayToast(text) {
  ensure();
  toastEl.innerHTML = `<span class="speech-face"></span><span><b class="speech-name">Mavi</b>${text}</span>`;
  toastEl.classList.remove('show');
  void toastEl.offsetWidth; // Animation neu starten
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, TOAST_TIME);
}

function hideToast() {
  clearTimeout(toastTimer);
  toastEl?.classList.remove('show');
}
