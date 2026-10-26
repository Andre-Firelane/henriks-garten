// Dicker Scrollbalken rechts an allen Tafeln, die scrollen (Events, Kiste, Übersicht, Menü, Wegweiser …).
// Auf dem Handy zeigt der Browser keinen Scrollbalken – so sieht man, dass unten noch mehr kommt.
// Der Balken liegt neben der Tafel im selben Overlay (wird beim Neuaufbau mit entfernt) und lässt sich auch ziehen.

const BOXES = '.chest-box, .journal-box, .start-box, .menu-box, #sign';
const bars = new Map(); // Tafel -> Balken

export function setupScrollbars() {
  setInterval(scan, 250); // neue Tafeln finden, Inhalt und Größe ändern sich ohne Scroll-Ereignis
  window.addEventListener('resize', () => bars.forEach(place));
}

function scan() {
  for (const box of document.querySelectorAll(BOXES)) if (!bars.has(box)) attach(box);
  for (const [box, bar] of bars) {
    if (box.isConnected) place(bar, box);
    else {
      bar.remove();
      bars.delete(box);
    }
  }
}

function attach(box) {
  const bar = document.createElement('div');
  bar.className = 'scroll-track';
  bar.innerHTML = '<div class="scroll-thumb"></div>';
  if (box.id === 'sign') bar.style.zIndex = 7; // knapp über dem Wegweiser, unter Menü und Tafeln
  (box.id === 'sign' ? document.body : box.parentElement).append(bar);
  bars.set(box, bar);
  box.addEventListener('scroll', () => place(bar, box), { passive: true });

  // Balken ziehen (Maus oder Finger) scrollt die Tafel mit
  const thumb = bar.firstChild;
  let drag = null;
  thumb.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    thumb.setPointerCapture(e.pointerId);
    drag = { y: e.clientY, top: box.scrollTop };
  });
  thumb.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const free = bar.clientHeight - thumb.offsetHeight;
    box.scrollTop = drag.top + ((e.clientY - drag.y) / Math.max(1, free)) * (box.scrollHeight - box.clientHeight);
  });
  for (const ev of ['pointerup', 'pointercancel']) thumb.addEventListener(ev, () => (drag = null));
  // Klick auf den Balken soll die Tafel nicht schließen (Übersicht, Kiste: "daneben tippen")
  bar.addEventListener('click', (e) => e.stopPropagation());
  place(bar, box);
}

function place(bar, box) {
  const r = box.getBoundingClientRect();
  const more = box.scrollHeight - box.clientHeight;
  const visible = r.width > 0 && more > 2 && getComputedStyle(box).opacity > 0.5;
  bar.classList.toggle('show', visible);
  box.classList.toggle('has-scroll-track', visible); // Platz rechts für den Balken
  if (!visible) return;
  const h = r.height - 20;
  bar.style.left = `${r.right - 22}px`;
  bar.style.top = `${r.top + 10}px`;
  bar.style.height = `${h}px`;
  const th = Math.max(36, (h * box.clientHeight) / box.scrollHeight);
  const thumb = bar.firstChild;
  thumb.style.height = `${th}px`;
  thumb.style.transform = `translateY(${((h - th) * box.scrollTop) / more}px)`;
}
