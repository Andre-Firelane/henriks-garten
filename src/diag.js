// Diagnose fürs Tablet: mit ?diag in der Adresse schreibt das Spiel alle 2 Sekunden auf, wie es läuft (Bilder pro Sekunde,
// Hänger, belegter Speicher, welche Bilder wie lange zum Hochladen auf die Grafikkarte gebraucht haben, welche Pakete schon
// geladen sind) und schickt das an den Server (vite preview/dev, siehe Plugin „diag“ in vite.config.js). Der legt es als
// diag/<Zeitpunkt>.jsonl im Projekt ab. Ohne ?diag passiert hier nichts.
import { gpu } from './gpuTextures.js';

export const DIAG = new URLSearchParams(location.search).has('diag');

const EVERY = 2000;
const t0 = performance.now();
const id = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
let buffer = [];
let marks = [];
let uploads = []; // { name, ms, mb } im laufenden Abschnitt
let errors = [];

const ms = (t) => Math.round(t - t0);

// Ereignis mit Zeitpunkt (z. B. Laden beginnt, Paket fertig)
export function diagMark(name, data) {
  if (DIAG) marks.push({ t: ms(performance.now()), name, ...data });
}

// ein Bild ist auf die Grafikkarte gekommen (aus gpuTextures.js)
export function diagUpload(pixels, time, bytes) {
  if (!DIAG) return;
  const src = pixels?.src ?? pixels?.currentSrc;
  const name = src ? src.split('/').pop().split('?')[0].slice(0, 60) : pixels?.constructor?.name ?? '?';
  uploads.push({ name, ms: Math.round(time * 10) / 10, mb: Math.round((bytes / 2 ** 20) * 10) / 10 });
}

function send(final = false) {
  if (!buffer.length) return;
  const body = buffer.map((x) => JSON.stringify(x)).join('\n') + '\n';
  buffer = [];
  const url = `/__diag?id=${id}`;
  if (final && navigator.sendBeacon) navigator.sendBeacon(url, body);
  else fetch(url, { method: 'POST', body, keepalive: body.length < 60000 }).catch(() => {}); // (keepalive nur bis 64 KB)
}

export function setupDiag(game, extra = {}) {
  if (!DIAG) return;
  performance.setResourceTimingBufferSize?.(20000);
  const frame = { n: 0, last: 0, maxGap: 0, gaps100: 0, gaps250: 0 };
  const tick = (t) => {
    if (frame.last) {
      const gap = t - frame.last;
      frame.maxGap = Math.max(frame.maxGap, gap);
      if (gap > 100) frame.gaps100++;
      if (gap > 250) frame.gaps250++;
    }
    frame.last = t;
    frame.n++;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  let longMs = 0;
  let longMax = 0;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        longMs += e.duration;
        longMax = Math.max(longMax, e.duration);
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
  window.addEventListener('error', (e) => errors.push(String(e.message).slice(0, 200)));
  window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason).slice(0, 200)));

  // einmal: Gerät und Browser
  const info = () => {
    const gl = game.renderer?.gl;
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      type: 'device', t: ms(performance.now()), ua: navigator.userAgent, cores: navigator.hardwareConcurrency, memoryGB: navigator.deviceMemory,
      dpr: window.devicePixelRatio, screen: [screen.width, screen.height], canvas: [game.canvas?.width, game.canvas?.height],
      gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl ? gl.getParameter(gl.RENDERER) : 'canvas', maxTexture: gl?.getParameter(gl.MAX_TEXTURE_SIZE),
      vramBudgetMB: Math.round(gpu.budget / 2 ** 20), heapLimitMB: performance.memory ? Math.round(performance.memory.jsHeapSizeLimit / 2 ** 20) : null,
    };
  };
  game.events.once('ready', () => buffer.push(info()));
  // einmal: der Spielstand, wie er beim Öffnen der Seite im Browser lag (zum Nachstellen am PC; bleibt im Heimnetz)
  try {
    const raw = localStorage.getItem('henrik-spiel-save');
    if (raw) buffer.push({ type: 'save', t: ms(performance.now()), size: raw.length, data: JSON.parse(raw) });
  } catch {}

  let resSeen = 0;
  let lastUploads = gpu.uploads;
  let lastEvicted = gpu.evicted ?? 0;
  setInterval(() => {
    const now = performance.now();
    const scene = game.scene.getScene('Garden');
    const running = !!scene?.sys.isActive();
    const res = performance.getEntriesByType('resource');
    const fresh = res.slice(resSeen);
    resSeen = res.length;
    const sorted = uploads.sort((a, b) => b.ms - a.ms);
    buffer.push({
      type: 'tick', t: ms(now),
      fps: Math.round((frame.n * 1000) / EVERY), maxGap: Math.round(frame.maxGap), gaps100: frame.gaps100, gaps250: frame.gaps250,
      longMs: Math.round(longMs), longMax: Math.round(longMax),
      gpuMB: Math.round(gpu.bytes / 2 ** 20), uploads: gpu.uploads - lastUploads, uploadMs: Math.round(uploads.reduce((s, u) => s + u.ms, 0)),
      slowUploads: sorted.slice(0, 5), evicted: (gpu.evicted ?? 0) - lastEvicted,
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 2 ** 20) : null,
      files: fresh.length, fileMB: Math.round((fresh.reduce((s, r) => s + (r.transferSize || 0), 0) / 2 ** 20) * 10) / 10,
      fileWaitMs: fresh.length ? Math.round(Math.max(...fresh.map((r) => r.duration))) : 0,
      objects: running ? scene.children.length : null, animals: running ? scene.animals?.length ?? null : null, visitors: running ? scene.visitors?.visitors?.length ?? 0 : null,
      ...Object.fromEntries(Object.entries(extra).map(([k, f]) => [k, f()])),
      marks, errors,
    });
    marks = [];
    errors = [];
    uploads = [];
    frame.n = 0;
    frame.maxGap = 0;
    frame.gaps100 = frame.gaps250 = 0;
    longMs = longMax = 0;
    lastUploads = gpu.uploads;
    lastEvicted = gpu.evicted ?? 0;
    send();
  }, EVERY);
  // beim Schließen bzw. Wechseln in den Hintergrund: Rest sofort schicken
  document.addEventListener('visibilitychange', () => {
    diagMark(document.hidden ? 'hidden' : 'visible');
    if (document.hidden) send(true);
  });
  // sichtbarer Hinweis, dass aufgezeichnet wird
  const tag = Object.assign(document.createElement('div'), { textContent: 'DIAG', style: 'position:fixed;right:4px;bottom:4px;z-index:99;font:bold 11px monospace;color:#fff;background:#c00a;padding:1px 4px;pointer-events:none' });
  document.body.append(tag);
}
