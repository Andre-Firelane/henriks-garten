// Kleine Vorschau beim allerersten Start: ein paar Bildschirmfotos mit kurzem Text zu dem, was man im Spiel macht.
// Mit dem großen Knopf (oder Enter, Leertaste, Pfeil rechts) blättert man weiter; danach kommt der Startbildschirm.
// Ob man sie schon gesehen (oder übersprungen) hat, merkt sich der Browser – dann erscheint sie nie wieder.
// Dieselbe Tafel zeigt im Spiel auch andere Bilderstrecken (openShowcase, z. B. die anderen Welten).
import { tr } from '../i18n.js';

const SEEN_KEY = 'my-little-zoo-tour';

// je Seite: Bild (unter public/assets), Überschrift, Text
const PAGES = [
  ['tour/tour_1', tr('Fang Tiere!', 'Catch animals!'), tr(
    'Jedes Tier fängst du anders: mit Kescher, Lasso oder Falle, mit Futter gelockt oder ganz leise angeschlichen.',
    'Every animal is caught differently: with a net, lasso or trap, lured with food or sneaked up on very quietly.',
  )],
  ['tour/tour_2', tr('Reise in ferne Welten', 'Travel to faraway worlds'), tr(
    'Wiese, Wald, Savanne, Bambuswald, Dschungel und Riff – überall warten andere Tiere auf dich.',
    'Meadow, forest, savanna, bamboo forest, jungle and reef – different animals are waiting for you everywhere.',
  )],
  ['tour/tour_3', tr('Bau deinen Tierpark aus', 'Build up your zoo'), tr(
    'Bring die Tiere in deine Gehege und schau zu, wie die Besucher sie lieben und dir Herzen schenken.',
    'Bring the animals to your enclosures and watch the visitors love them and give you hearts.',
  )],
  ['tour/tour_4', tr('Starte spannende Events', 'Start exciting events'), tr(
    'Mit deinen Herzen löst du Events aus – zum Beispiel die Wolfsnacht: Folge mit der Laterne den leuchtenden Spuren zu den Wölfen!',
    'Use your hearts to start events – like the Wolf Night: follow the glowing tracks to the wolves with your lantern!',
  )],
];

export function tourSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch (e) {
    return true; // ohne Speicher lieber gar nicht zeigen als bei jedem Start
  }
}

// onDone(): nach der letzten Seite oder beim Überspringen
export function openFeatureTour(onDone) {
  openShowcase(PAGES, {
    onDone: () => {
      try {
        localStorage.setItem(SEEN_KEY, '1');
      } catch (e) {}
      onDone();
    },
  });
}

let open = false;
export function isShowcaseOpen() {
  return open;
}

// Bilderstrecke zum Durchblättern. pages: [[Bild unter public/assets ohne .jpg, Überschrift, Text], ...]
// lastLabel: Aufschrift des Knopfs auf der letzten Seite; ingame: halbdurchsichtig über dem Spiel statt Ladebild dahinter
// onDone(finished): finished = bis zum letzten Knopf durchgeblättert (sonst übersprungen)
export function openShowcase(pages, { lastLabel = tr('Los geht’s!', 'Let’s go!'), ingame = false, onDone }) {
  const panel = document.getElementById('tour');
  let page = 0;
  open = true;
  const show = () => {
    const [img, title, text] = pages[page];
    const last = page === pages.length - 1;
    panel.innerHTML = `<div class="tour-box">
        <img class="tour-img" src="assets/${img}.jpg" alt="">
        <div class="tour-text">
          <h2>${title}</h2>
          <p>${text}</p>
          <div class="tour-dots">${pages.map((_, i) => `<span${i === page ? ' class="on"' : ''}></span>`).join('')}</div>
          <button class="start-btn tour-next">${last ? lastLabel : `${tr('Weiter', 'Next')} ▶`}</button>
          ${last ? '' : `<button class="imprint-link tour-skip">${tr('Überspringen', 'Skip')}</button>`}
        </div>
      </div>`;
    if (!last) new Image().src = `assets/${pages[page + 1][0]}.jpg`; // nächstes Bild schon mal laden
  };
  const close = (finished) => {
    open = false;
    panel.classList.remove('show', 'ingame');
    panel.onclick = null;
    window.removeEventListener('keydown', onKey, true);
    onDone(finished);
  };
  const next = () => {
    if (page === pages.length - 1) return close(true);
    page++;
    show();
  };
  const onKey = (e) => {
    e.stopPropagation(); // die Taste soll im Spiel nichts auslösen
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(false);
    }
  };
  panel.onclick = (e) => {
    if (e.target.closest('.tour-next')) next();
    else if (e.target.closest('.tour-skip')) close(false);
  };
  window.addEventListener('keydown', onKey, true);
  show();
  panel.classList.toggle('ingame', ingame);
  panel.classList.add('show');
}
