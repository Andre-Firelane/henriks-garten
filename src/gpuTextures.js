import Phaser from 'phaser';

// Phaser legt jedes geladene Bild sofort auf die Grafikkarte. Alle Gebiete zusammen sind ausgepackt über 600 MB, daran
// erstickt das Tablet (das Spiel friert nach ein paar Schritten ganz ein). Darum kommt ein Bild erst auf die
// Grafikkarte, wenn es zum ersten Mal gemalt wird, und wenn zu viel belegt ist, fliegen die am längsten nicht mehr
// gemalten wieder herunter (das Bild selbst bleibt geladen und kommt beim nächsten Malen wieder hoch).
// Zum Ausprobieren: ?vram=300 setzt die Grenze in MB, ?fps zeigt den belegten Speicher

const Wrapper = Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper;
const Renderer = Phaser.Renderer.WebGL.WebGLRenderer;
const MB = 1024 * 1024;
const KEEP_MS = 3000; // was eben noch gemalt wurde, bleibt auf jeden Fall

const touch = matchMedia('(pointer: coarse)').matches;
const params = new URLSearchParams(location.search);
const vram = Number(params.get('vram'));
const diagnose = params.has('fps');
export const gpu = { bytes: 0, budget: (vram || (touch ? 256 : 1536)) * MB, uploads: 0, errors: 0 };

const uploaded = new Set();
let now = 0;

const isImage = (p) => p instanceof HTMLImageElement || (typeof ImageBitmap !== 'undefined' && p instanceof ImageBitmap);

function upload(w) {
  const gl = w.gl;
  const unit = gl.getParameter(gl.ACTIVE_TEXTURE); // Phaser wählt die Einheit, bevor es die Textur abfragt
  w._tex = gl.createTexture();
  w._processTexture();
  gl.activeTexture(unit);
  gpu.uploads++;
  if (diagnose && gl.getError() !== gl.NO_ERROR) gpu.errors++; // (nur mit ?fps: getError bremst)
  w._bytes = w.pixels.width * w.pixels.height * 4;
  uploaded.add(w);
  gpu.bytes += w._bytes;
}

function forget(w) {
  if (uploaded.delete(w)) gpu.bytes -= w._bytes;
  w._tex = null;
}

// die WebGL-Textur eines Bildes erst beim ersten Abfragen (also beim Malen) anlegen
Object.defineProperty(Wrapper.prototype, 'webGLTexture', {
  configurable: true,
  get() {
    if (this._lazy) {
      this._used = now;
      if (!this._tex && this.gl && !this.gl.isContextLost()) upload(this);
    }
    return this._tex ?? null;
  },
  set(v) {
    this._tex = v;
  },
});

const createResource = Wrapper.prototype.createResource;
Wrapper.prototype.createResource = function () {
  if (!isImage(this.pixels)) {
    this._lazy = false;
    createResource.call(this);
    return;
  }
  // auch nach einem verlorenen WebGL-Kontext: die alte Textur gilt nicht mehr, beim nächsten Malen neu
  this._lazy = true;
  forget(this);
};

const destroy = Wrapper.prototype.destroy;
Wrapper.prototype.destroy = function () {
  if (!this._lazy) {
    destroy.call(this);
    return;
  }
  if (this._tex && !this.gl.isContextLost()) this.gl.deleteTexture(this._tex);
  forget(this);
  this.pixels = null;
  this.gl = null;
};

// Phaser setzt den Namen für Debug-Werkzeuge gleich nach dem Anlegen: das darf das Bild nicht schon hochladen
Object.defineProperty(Wrapper.prototype, 'spectorMetadata', {
  configurable: true,
  get() {
    return this.__SPECTOR_Metadata;
  },
  set(v) {
    this.__SPECTOR_Metadata = v;
  },
});

// scharfe Pixel-Art (NEAREST) usw.: noch nicht hochgeladen nur merken, beim Hochladen gilt es dann
const setTextureFilter = Renderer.prototype.setTextureFilter;
Renderer.prototype.setTextureFilter = function (texture, filter) {
  if (!texture._lazy || texture._tex) return setTextureFilter.call(this, texture, filter);
  texture.minFilter = texture.magFilter = filter === 0 ? this.gl.LINEAR : this.gl.NEAREST;
  return this;
};

// zu viel belegt: die am längsten nicht gemalten Bilder herunternehmen (bis auf 80 %, damit es nicht ständig passiert)
function evict(renderer) {
  if (gpu.bytes <= gpu.budget) return;
  const old = [...uploaded].filter((w) => now - w._used > KEEP_MS).sort((a, b) => a._used - b._used);
  if (!old.length) return;
  const gl = renderer.gl;
  for (const w of old) {
    if (gpu.bytes <= gpu.budget * 0.8) break;
    if (!gl.isContextLost()) gl.deleteTexture(w._tex);
    forget(w);
  }
  // die Pipelines merken sich, was gebunden ist: sonst binden sie eine gelöschte Textur nicht neu
  renderer.pipelines.pipelines.each((key, pipeline) => {
    pipeline.activeTextures.length = 0;
  });
}

// (der Renderer entsteht erst beim Hochfahren des Spiels, darum hier noch nicht nach ihm fragen)
export function watchGpuTextures(game) {
  game.events.on(Phaser.Core.Events.PRE_STEP, (time) => {
    now = time;
  });
  // zwischen Update und Malen: da ist gerade nichts gebunden, was noch gebraucht wird
  game.events.on(Phaser.Core.Events.POST_STEP, () => {
    if (game.renderer.type === Phaser.WEBGL) evict(game.renderer);
  });
}
