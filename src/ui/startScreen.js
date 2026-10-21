// Startbildschirm: letzten Stand weiterspielen, neues Spiel beginnen oder ein Test-Spiel (speichert nie,
// der echte Spielstand bleibt unberührt). Ein neues Spiel löscht den alten Stand erst nach einer Rückfrage.
import { LEVELS } from '../world/levels.js';
import { resetGame } from '../state.js';
import { save, readSave, loadSave, deleteSave } from '../save.js';

let panel = null;

function savedText(s) {
  const d = new Date(s.savedAt);
  const day = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `${LEVELS[s.level]?.name ?? ''} · ${day} um ${time}`;
}

// onStart(data): startet das Spiel mit diesen Daten für die Szene ({ level } beim Weiterspielen)
export function openStartScreen(onStart) {
  panel = document.getElementById('start');
  const s = readSave();
  panel.innerHTML = `<div class="start-box">
      <h1>Henriks Garten</h1>
      <button class="start-btn" data-act="continue"${s ? '' : ' disabled'}>▶ Weiterspielen<small>${s ? savedText(s) : 'noch kein Spielstand'}</small></button>
      <button class="start-btn" data-act="new">✿ Neues Spiel</button>
      <div class="start-ask">
        <p>Wirklich neu anfangen? Der alte Spielstand wird gelöscht.</p>
        <button class="start-btn small danger" data-act="new-yes">Ja, neu anfangen</button>
        <button class="start-btn small" data-act="new-no">Nein</button>
      </div>
      <button class="start-btn test" data-act="test">🔧 Test-Spiel<small>wird nicht gespeichert</small></button>
    </div>`;
  panel.classList.add('show');
  const start = (data) => {
    panel.classList.remove('show');
    panel.onclick = null;
    onStart(data);
  };
  panel.onclick = (e) => {
    const act = e.target.closest('.start-btn')?.dataset.act;
    if (act === 'continue') start({ level: loadSave() });
    else if (act === 'new' && s) panel.classList.add('asking');
    else if (act === 'new-no') panel.classList.remove('asking');
    else if (act === 'new' || act === 'new-yes') {
      deleteSave();
      resetGame();
      start({});
    } else if (act === 'test') {
      save.testMode = true;
      resetGame();
      start({});
    }
  };
}
