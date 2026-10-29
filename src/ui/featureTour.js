// Kleine Vorschau beim allerersten Start: ein paar Bildschirmfotos mit kurzem Text zu dem, was man im Spiel macht.
// Mit dem großen Knopf (oder Enter, Leertaste, Pfeil rechts) blättert man weiter; danach kommt der Startbildschirm.
// Ob man sie schon gesehen (oder übersprungen) hat, merkt sich der Browser – dann erscheint sie nie wieder.
import { tr } from '../i18n.js';

const SEEN_KEY = 'my-little-zoo-tour';

// je Seite: Bild (public/assets/tour), Überschrift, Text
const PAGES = [
  ['tour_1', tr('Fang Tiere!', 'Catch animals!'), tr(
    'Jedes Tier fängst du anders: mit Kescher, Lasso oder Falle, mit Futter gelockt oder ganz leise angeschlichen.',
    'Every animal is caught differently: with a net, lasso or trap, lured with food or sneaked up on very quietly.',
  )],
  ['tour_2', tr('Reise in ferne Welten', 'Travel to faraway worlds'), tr(
    'Wiese, Wald, Savanne, Bambuswald, Dschungel und Riff – überall warten andere Tiere auf dich.',
    'Meadow, forest, savanna, bamboo forest, jungle and reef – different animals are waiting for you everywhere.',
  )],
  ['tour_3', tr('Bau deinen Tierpark aus', 'Build up your zoo'), tr(
    'Bring die Tiere in deine Gehege und schau zu, wie die Besucher sie lieben und dir Herzen schenken.',
    'Bring the animals to your enclosures and watch the visitors love them and give you hearts.',
  )],
  ['tour_4', tr('Starte spannende Events', 'Start exciting events'), tr(
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
  const panel = document.getElementById('tour');
  let page = 0;
  const show = () => {
    const [img, title, text] = PAGES[page];
    const last = page === PAGES.length - 1;
    panel.innerHTML = `<div class="tour-box">
        <img class="tour-img" src="assets/tour/${img}.jpg" alt="">
        <div class="tour-text">
          <h2>${title}</h2>
          <p>${text}</p>
          <div class="tour-dots">${PAGES.map((_, i) => `<span${i === page ? ' class="on"' : ''}></span>`).join('')}</div>
          <button class="start-btn tour-next">${last ? tr('Los geht’s!', 'Let’s go!') : `${tr('Weiter', 'Next')} ▶`}</button>
          ${last ? '' : `<button class="imprint-link tour-skip">${tr('Überspringen', 'Skip')}</button>`}
        </div>
      </div>`;
    if (!last) new Image().src = `assets/tour/${PAGES[page + 1][0]}.jpg`; // nächstes Bild schon mal laden
  };
  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch (e) {}
    panel.classList.remove('show');
    panel.onclick = null;
    window.removeEventListener('keydown', onKey, true);
    onDone();
  };
  const next = () => {
    if (page === PAGES.length - 1) return close();
    page++;
    show();
  };
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'Escape') close();
  };
  panel.onclick = (e) => {
    if (e.target.closest('.tour-next')) next();
    else if (e.target.closest('.tour-skip')) close();
  };
  window.addEventListener('keydown', onKey, true);
  show();
  panel.classList.add('show');
}
