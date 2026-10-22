// Ladeanzeige: beim Spielstart (Bilder und Töne laden, Balken füllt sich) und solange ein Gebiet aufgebaut wird
// (Spiel starten, Gehege ausbauen, Gebiet wechseln – dort läuft der Balken, weil sich der Aufbau nicht messen lässt).
// Die Tafel steht schon in index.html und ist beim Öffnen der Seite gleich zu sehen.

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

export function setLoadingProgress(p) {
  const bar = panel()?.querySelector('.loading-fill');
  if (bar) bar.style.width = `${Math.round(Math.min(1, Math.max(0, p)) * 100)}%`;
}

export function hideLoading() {
  panel()?.classList.remove('show');
}

// erst die Anzeige zeichnen lassen, dann die (lange, blockierende) Arbeit: sonst sieht man sie nie
export function afterPaint(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}
