// Grundlage für Werkzeuge, die vor dem Spieler einen Fangbereich erzeugen (Kescher, Lasso).
// Ein Einsatz dauert "duration" Sekunden; im Zeitfenster catchFrom..catchTo (Anteil 0..1) fängt er Tiere,
// deren Art dieses Werkzeug in catchWith stehen hat. Die Fangzone reicht vom Spieler bis zur Zone vor ihm,
// damit auch Tiere direkt vor den Füßen gefangen werden.

export default class ZoneTool {
  // maxCatch: höchstens so viele Tiere pro Einsatz (z. B. 1 beim Lasso); ohne Angabe beliebig viele
  constructor(scene, player, { id, reach, radius, duration, catchFrom, catchTo, maxCatch = Infinity }) {
    this.scene = scene;
    this.player = player;
    this.id = id;
    this.reach = reach; // Abstand der Fangzone vor dem Spieler
    this.radius = radius; // Größe der Fangzone (normaler Fangradius: 22)
    this.duration = duration;
    this.catchFrom = catchFrom;
    this.catchTo = catchTo;
    this.maxCatch = maxCatch;
    this.caughtCount = 0; // so viele hat der laufende Einsatz schon gefangen
    this.time = -1; // < 0: gerade nicht im Einsatz
    this.zone = null; // Fangzone des laufenden Einsatzes
  }

  get active() {
    return this.time >= 0;
  }

  // Fortschritt des laufenden Einsatzes von 0 bis 1
  get progress() {
    return this.time / this.duration;
  }

  // Startet einen Einsatz (wenn nicht schon einer läuft). Gibt zurück, ob er gestartet wurde.
  use() {
    if (this.active) return false;
    this.time = 0;
    this.zone = this.zoneAhead();
    this.zoneStart = { x: this.player.x, y: this.player.y };
    this.caughtCount = 0;
    return true;
  }

  // Mitte der Fangzone vor dem Spieler (die Blickrichtung ist immer schräg, daher halbe Höhe)
  zoneAhead() {
    const p = this.player;
    return { x: p.x + p.faceX * this.reach, y: p.y + (p.faceY * this.reach) / 2 };
  }

  // Hand des Spielers (in Blickrichtung)
  hand() {
    const p = this.player;
    return { x: p.x + p.faceX * 8, y: p.sprite.y - 20 };
  }

  // Tiere, die der laufende Einsatz gerade erwischt
  caughtBy(animals) {
    if (!this.active || this.progress < this.catchFrom || this.progress > this.catchTo) return [];
    if (this.caughtCount >= this.maxCatch) return [];
    const caught = animals
      .filter((a) => a.canBeCaughtWith(this.id) && this.zoneDistance(a) < this.radius)
      .sort((a, b) => this.zoneDistance(a) - this.zoneDistance(b)) // die nächsten zuerst
      .slice(0, this.maxCatch - this.caughtCount);
    this.caughtCount += caught.length;
    return caught;
  }

  // Abstand eines Tiers zur Strecke Spieler → Zonenmitte (in Kachel-Proportionen, y doppelt gewichtet)
  zoneDistance(a) {
    const s = this.zoneStart;
    const c = this.zone;
    const ax = a.x - s.x, ay = (a.y - s.y) * 2;
    const bx = c.x - s.x, by = (c.y - s.y) * 2;
    const t = Math.max(0, Math.min(1, (ax * bx + ay * by) / (bx * bx + by * by || 1)));
    return Math.hypot(ax - bx * t, ay - by * t);
  }

  update(dt) {
    if (this.active) {
      this.time += dt;
      if (this.time >= this.duration) this.time = -1;
    }
    this.draw();
  }

  // Werden von den einzelnen Werkzeugen überschrieben
  draw() {}

  destroy() {}
}
