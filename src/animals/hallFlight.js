// Vögel, die im Tierpark frei durch eine Halle fliegen (Papageitaucher und Schneeeulen in der Polarhalle, siehe
// docs/plan-eiswelt.md): sie sitzen oben auf den Felsen und Tannen ihres Geheges und fliegen ab und zu im Bogen zu
// einem anderen freien Platz. Nur gelenkt wird hier; das Bild (sitzend bzw. fliegend, höher gezeichnet) setzt die
// Tierart selbst aus animal.hallUp und animal.hallFlying().
import Phaser from 'phaser';
import { tileToWorld } from '../world/iso.js';
import { charAt } from '../world/map.js';

// Sitzplätze je Objekt: [Versatz nach rechts, Höhe über dem Fußpunkt] (Welt-Pixel)
const SEATS = {
  Ɵ: [[14, 36], [-12, 30]], // großer Schneefelsen
  Ȟ: [[6, 30], [-14, 22]], // Felsgruppe
  Ȓ: [[0, 14]], // Felsen
  Ê: [[0, 18]], // Eisblock
  Ṗ: [[-4, 46], [8, 38]], // verschneite Tanne
};
const SIT = [6, 16]; // so lange sitzt ein Vogel (Sekunden) ...
const SPEED = 75; // ... so schnell fliegt er (Welt-Pixel je Sekunde) ...
const ARC = 46; // ... und so hoch steigt er unterwegs zusätzlich

// alle Sitzplätze im Gehege des Tiers (jedes Mal neu: die Liste ist kurz)
function seatsOf(animal) {
  const e = animal.enclosure;
  if (!e) return [];
  const seats = [];
  for (const { tx, ty } of e.tiles) {
    const spots = SEATS[charAt(tx, ty)];
    if (!spots) continue;
    const p = tileToWorld(tx, ty);
    spots.forEach(([dx, up], i) => seats.push({ key: `${tx},${ty},${i}`, x: p.x + dx, y: p.y + 2, up }));
  }
  return seats;
}

function freeSeats(animal, seats) {
  const taken = new Set(animal.scene.animals.filter((a) => a !== animal && a.hallSeat).map((a) => a.hallSeat.key));
  return seats.filter((s) => !taken.has(s.key));
}

// ein Schritt: gibt zurück, ob er sich gerade bewegt (fliegt). Ohne Sitzplätze läuft er wie sonst (fallback)
export function updateHallFlight(animal, dt, fallback) {
  const seats = seatsOf(animal);
  if (!seats.length) {
    animal.hallSeat = null;
    animal.hallUp = 0;
    return fallback();
  }
  const f = animal.hallFlight;
  if (!f) {
    // noch kein Platz (gerade eingezogen, geladen): gleich auf einen freien setzen
    if (!animal.hallSeat || !seats.some((s) => s.key === animal.hallSeat.key)) {
      const free = freeSeats(animal, seats);
      animal.hallSeat = Phaser.Utils.Array.GetRandom(free.length ? free : seats);
    }
    animal.x = animal.hallSeat.x;
    animal.y = animal.hallSeat.y;
    animal.hallUp = animal.hallSeat.up;
    animal.faceY = 1;
    animal.hallSit = (animal.hallSit ?? Phaser.Math.FloatBetween(1, SIT[1])) - dt;
    if (animal.hallSit > 0) return false;
    animal.hallSit = Phaser.Math.FloatBetween(...SIT);
    const to = Phaser.Utils.Array.GetRandom(freeSeats(animal, seats).filter((s) => Math.hypot(s.x - animal.x, s.y - animal.y) > 30));
    if (!to) return false;
    const from = animal.hallSeat;
    animal.hallSeat = to; // gleich reservieren, damit kein anderer dorthin fliegt
    animal.hallFlight = { from: { x: from.x, y: from.y, up: from.up }, to, done: 0, total: Math.max(1, Math.hypot(to.x - from.x, to.y - from.y)) };
    return false;
  }
  f.done = Math.min(f.total, f.done + SPEED * dt);
  const k = f.done / f.total;
  animal.x = f.from.x + (f.to.x - f.from.x) * k;
  animal.y = f.from.y + (f.to.y - f.from.y) * k;
  animal.hallUp = f.from.up + (f.to.up - f.from.up) * k + Math.sin(k * Math.PI) * ARC;
  animal.faceX = Math.sign(f.to.x - f.from.x) || animal.faceX;
  animal.faceY = Math.sign(f.to.y - f.from.y) || animal.faceY;
  if (k >= 1) {
    animal.hallFlight = null;
    animal.faceY = 1;
  }
  return true;
}

// fliegt er gerade frei durch die Halle?
export const inHall = (animal) => animal.state === 'penned' && !!animal.enclosure?.open;

// beim Auszug, Fang, Laden: alles vergessen
export function resetHallFlight(animal) {
  animal.hallFlight = null;
  animal.hallSeat = null;
  animal.hallUp = 0;
  animal.hallSit = null;
}
