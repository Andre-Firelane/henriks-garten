// Startbildschirm: letzten Stand weiterspielen, neues Spiel beginnen oder ein Test-Spiel (speichert nie,
// der echte Spielstand bleibt unberührt). Ein neues Spiel löscht den alten Stand erst nach einer Rückfrage.
// Unten wählt man die Sprache (Deutsch oder Englisch); das lädt die Seite neu.
import { LEVELS } from '../world/levels.js';
import { resetGame } from '../state.js';
import { save, readSave, loadSave, deleteSave } from '../save.js';
import { lang, locale, setLang, tr } from '../i18n.js';
import { startSession } from '../sessions.js';

let panel = null;

function savedText(s) {
  const d = new Date(s.savedAt);
  const day = d.toLocaleDateString(locale, { day: 'numeric', month: tr('numeric', 'short') });
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return `${LEVELS[s.level]?.name ?? ''} · ${day} ${tr('um', 'at')} ${time}`;
}

// onStart(data): startet das Spiel mit diesen Daten für die Szene ({ level } beim Weiterspielen)
export function openStartScreen(onStart) {
  panel = document.getElementById('start');
  const s = readSave();
  panel.innerHTML = `<div class="start-box">
      <h1>My Little Zoo</h1>
      <button class="start-btn" data-act="continue"${s ? '' : ' disabled'}>▶ ${tr('Weiterspielen', 'Continue')}<small>${s ? savedText(s) : tr('noch kein Spielstand', 'no saved game yet')}</small></button>
      <button class="start-btn" data-act="new">✿ ${tr('Neues Spiel', 'New game')}</button>
      <div class="start-ask">
        <p>${tr('Wirklich neu anfangen? Der alte Spielstand wird gelöscht.', 'Really start over? Your saved game will be deleted.')}</p>
        <button class="start-btn small danger" data-act="new-yes">${tr('Ja, neu anfangen', 'Yes, start over')}</button>
        <button class="start-btn small" data-act="new-no">${tr('Nein', 'No')}</button>
      </div>
      <button class="start-btn test" data-act="test">🔧 ${tr('Test-Spiel', 'Test game')}<small>${tr('wird nicht gespeichert', 'will not be saved')}</small></button>
      <div class="start-lang">
        <button class="lang-btn${lang === 'de' ? ' on' : ''}" data-lang="de">Deutsch</button>
        <button class="lang-btn${lang === 'en' ? ' on' : ''}" data-lang="en">English</button>
      </div>
    </div>`;
  panel.classList.add('show');
  const start = (data) => {
    panel.classList.remove('show');
    panel.onclick = null;
    onStart(data);
  };
  panel.onclick = (e) => {
    const l = e.target.closest('.lang-btn')?.dataset.lang;
    if (l) return setLang(l);
    const act = e.target.closest('.start-btn')?.dataset.act;
    if (act === 'continue') {
      startSession('continue');
      start({ level: loadSave() });
    } else if (act === 'new' && s) panel.classList.add('asking');
    else if (act === 'new-no') panel.classList.remove('asking');
    else if (act === 'new' || act === 'new-yes') {
      deleteSave();
      resetGame();
      startSession('new');
      start({ intro: true }); // intro: einmal die Willkommens-Tafel zeigen
    } else if (act === 'test') {
      save.testMode = true;
      resetGame();
      startSession('test');
      start({ intro: true });
    }
  };
}
