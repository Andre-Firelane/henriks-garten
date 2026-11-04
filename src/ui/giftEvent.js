// Geschenk-Tafel beim zweiten Zurückkommen in den Tierpark: zwei Events mit großem Bild zur Wahl (Tierbabys oder
// Reittier), das gewählte startet sofort und kostet nichts. Wer schließt, verzichtet – die Tafel kommt nicht wieder.
// Gleiche Optik wie die Vorschau (featureTour.js, #tour); die Bilder liegen unter public/assets/promo.
import { tr } from '../i18n.js';

const CHOICES = [
  ['babies', tr('Tierbabys', 'Animal Babies'), tr('5 Minuten lang bekommen deine Tiere Nachwuchs – die Besucher lieben es!', 'For 5 minutes your animals have babies – the visitors love it!')],
  ['ride', tr('Reittier', 'Mount'), tr('10 Minuten reitest du durch die Welten: schneller unterwegs und überall Werkzeug wechseln.', 'Ride through the worlds for 10 minutes: move faster and switch tools anywhere.')],
];

let open = false;
export function isGiftOpen() {
  return open;
}

// onPick(id) nach der Wahl, onClose() beim Verzichten
export function openGiftEvent(onPick, onClose) {
  const panel = document.getElementById('tour');
  open = true;
  panel.innerHTML = `<div class="tour-box gift-box">
      <div class="tour-text">
        <h2>${tr('Ein Geschenk für dich!', 'A gift for you!')}</h2>
        <p>${tr('Such dir ein Event aus – dieses Mal ist es gratis.', 'Pick an event – this time it is free.')}</p>
      </div>
      <div class="gift-cards">
        ${CHOICES.map(([id, title, text]) => `<div class="gift-card">
          <img class="tour-img" src="assets/promo/gift_${id}.jpg" alt="">
          <h3>${title}</h3>
          <p>${text}</p>
          <button class="start-btn gift-pick" data-id="${id}">${tr('Gratis starten', 'Start for free')}</button>
        </div>`).join('')}
      </div>
      <button class="imprint-link gift-skip">${tr('Nein danke', 'No thanks')}</button>
    </div>`;
  const close = () => {
    open = false;
    panel.classList.remove('show', 'ingame');
    panel.onclick = null;
    window.removeEventListener('keydown', onKey, true);
  };
  const onKey = (e) => {
    e.stopPropagation(); // die Taste soll im Spiel nichts auslösen
    if (e.key !== 'Escape') return;
    e.preventDefault();
    close();
    onClose();
  };
  panel.onclick = (e) => {
    const id = e.target.closest('.gift-pick')?.dataset.id;
    if (id) {
      close();
      onPick(id);
    } else if (e.target.closest('.gift-skip')) {
      close();
      onClose();
    }
  };
  window.addEventListener('keydown', onKey, true);
  panel.classList.add('show', 'ingame');
  panel.querySelector('.gift-pick')?.focus();
}
