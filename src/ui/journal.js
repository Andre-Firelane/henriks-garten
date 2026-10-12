// Große Übersicht (Taste I oder Tippen auf das Abzeichen oben links): welche Tiere man schon nach Hause gebracht hat
// und womit man sie fängt. Schließen mit einer beliebigen Taste oder einem Tipp.

let panel = null;
let onClose = null;

export function isJournalOpen() {
  return !!panel?.classList.contains('show');
}

// html: Inhalt der Tafel; closed: wird nach dem Schließen aufgerufen
export function openJournal(html, closed) {
  panel = document.getElementById('journal');
  panel.innerHTML = html;
  panel.classList.add('show');
  onClose = closed;
  // erst nach diesem Tastendruck auf den nächsten hören, sonst schließt die Taste I die Tafel gleich wieder
  setTimeout(() => {
    window.addEventListener('keydown', close, true);
    panel.addEventListener('click', close); // Tippen schließt, Wischen zum Scrollen nicht
  }, 0);
}

function close(e) {
  e?.preventDefault();
  e?.stopPropagation(); // die Taste soll im Spiel nichts auslösen
  window.removeEventListener('keydown', close, true);
  panel.removeEventListener('click', close);
  panel.classList.remove('show');
  const cb = onClose;
  onClose = null;
  cb?.();
}
