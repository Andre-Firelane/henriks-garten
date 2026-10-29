// Ladeanzeige: beim Spielstart (Bilder und Töne laden, Balken füllt sich) und solange ein Gebiet aufgebaut wird
// (Spiel starten, Gehege ausbauen, Gebiet wechseln – dort läuft der Balken, weil sich der Aufbau nicht messen lässt).
// Die Tafel steht schon in index.html und ist beim Öffnen der Seite gleich zu sehen.
// Geht beim Laden etwas schief, bleibt sie nicht einfach stehen: sie zeigt den Fehler und bietet an, im Tierpark
// weiterzuspielen bzw. den Spielstand zu reparieren (siehe repairSave).
import { repairSave } from '../save.js';
import { tr } from '../i18n.js';

const panel = () => document.getElementById('loading');

// Text und Fortschritt (0 bis 1); ohne Fortschritt ein laufender Balken
export function showLoading(text, progress = null) {
  const el = panel();
  if (!el) return;
  el.querySelector('.loading-text').textContent = text;
  el.classList.toggle('busy', progress === null);
  if (progress !== null) setLoadingProgress(progress);
  el.classList.add('show');
}

// Hintergrund von Lade- und Startbildschirm: Bildschirmfoto dieser Welt (gibt es keins, bleibt das bisherige)
const BACKGROUNDS = ['park', 'meadow', 'forest', 'savanna', 'asia', 'jungle', 'reef', 'aquarium'];
export function setLoadingBackground(level) {
  if (level === 'park2' || level === 'park3') level = 'park'; // die Abschnitte des Tierparks
  if (BACKGROUNDS.includes(level)) document.documentElement.style.setProperty('--bg', `url(assets/bg/bg_${level}.jpg)`);
}

export function setLoadingProgress(p) {
  const bar = panel()?.querySelector('.loading-fill');
  if (bar) bar.style.width = `${Math.round(Math.min(1, Math.max(0, p)) * 100)}%`;
}

export function hideLoading() {
  panel()?.classList.remove('show');
}

// Fehler, während die Ladeanzeige zu sehen ist: Meldung mit Ausweg statt ewigem Laden
export function setupLoadingErrors() {
  const onError = (message) => {
    const el = panel();
    if (!el?.classList.contains('show') || el.classList.contains('failed')) return;
    el.classList.add('failed');
    el.classList.remove('busy');
    el.querySelector('.loading-text').textContent = tr('Hoppla – beim Laden ist etwas schiefgegangen.', 'Oops – something went wrong while loading.');
    const box = el.querySelector('.loading-box');
    box.insertAdjacentHTML(
      'beforeend',
      `<p class="loading-error">${String(message).replace(/[<>&]/g, '')}</p>
       <button class="start-btn" data-fix="park">${tr('Im Tierpark weiterspielen', 'Continue in the zoo')}</button>
       <button class="start-btn" data-fix="repair">${tr('Spielstand reparieren', 'Repair saved game')}<small>${tr('Tiere in Gehegen und Becken, Herzen und Ausbauten bleiben', 'Animals in enclosures and tanks, hearts and upgrades stay')}</small></button>`,
    );
    box.onclick = (e) => {
      const fix = e.target.closest('[data-fix]')?.dataset.fix;
      if (!fix) return;
      repairSave(fix);
      location.reload();
    };
  };
  window.addEventListener('error', (e) => onError(e.message || e.error));
  window.addEventListener('unhandledrejection', (e) => onError(e.reason?.message ?? e.reason));
}

// erst die Anzeige zeichnen lassen, dann die (lange, blockierende) Arbeit: sonst sieht man sie nie
export function afterPaint(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}
