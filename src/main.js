import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GardenScene from './scenes/GardenScene.js';
import { setupTouchControls } from './ui/touch.js';
import { setupUpdateCheck } from './update.js';
import { setupSessions } from './sessions.js';
import { setupLoadingErrors } from './ui/loading.js';
import { setupScrollbars } from './ui/scrollbar.js';
import { gpu, watchGpuTextures } from './gpuTextures.js';

setupTouchControls();
setupUpdateCheck();
setupSessions();
setupScrollbars(); // dicker Scrollbalken an allen Tafeln (auf dem Handy sonst unsichtbar)
setupLoadingErrors(); // statt ewig zu laden: Fehler zeigen und Ausweg anbieten

// in der vollen Auflösung des Displays zeichnen (sonst vergrößert der Browser das Bild und es wird unscharf);
// höchstens doppelt, damit das Tablet nicht zu viele Pixel malen muss
// zum Ausprobieren auf dem Tablet: ?dpr=1.5 (weniger Pixel) und ?fps (Bilder pro Sekunde oben links)
const params = new URLSearchParams(location.search);
const DPR = Math.min(window.devicePixelRatio || 1, Number(params.get('dpr')) || 2);
const parent = document.getElementById('game');
const size = () => [Math.round(parent.clientWidth * DPR), Math.round(parent.clientHeight * DPR)];

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#4f8a2f',
  roundPixels: true,
  powerPreference: 'high-performance', // auf dem Tablet die schnellere Grafik nutzen
  scale: {
    mode: Phaser.Scale.NONE,
    width: size()[0],
    height: size()[1],
    zoom: 1 / DPR, // Spielfläche in Display-Pixeln, auf der Seite so groß wie das Fenster
  },
  scene: [BootScene, GardenScene],
});
watchGpuTextures(game); // Bilder erst beim Malen auf die Grafikkarte (sonst friert das Tablet ein)
window.addEventListener('resize', () => game.scale.resize(...size()));
if (params.has('fps')) {
  const box = Object.assign(document.createElement('div'), { style: 'position:fixed;left:4px;bottom:4px;z-index:99;max-width:60vw;font:bold 14px monospace;color:#fff;background:#000a;padding:2px 6px;pointer-events:none' });
  document.body.append(box);
  // zur Fehlersuche auf dem Tablet: verlorene Grafik (WebGL-Kontext), Fehler beim Hochladen, letzter Absturz
  const diag = { lost: 0, restored: 0, error: '' };
  window.addEventListener('error', (e) => (diag.error = e.message));
  window.addEventListener('unhandledrejection', (e) => (diag.error = String(e.reason)));
  game.events.once(Phaser.Core.Events.READY, () => {
    game.canvas.addEventListener('webglcontextlost', () => diag.lost++);
    game.canvas.addEventListener('webglcontextrestored', () => diag.restored++);
  });
  setInterval(() => {
    const gl = game.renderer?.gl;
    box.textContent = `${Math.round(game.loop.actualFps)} fps · ${game.canvas.width}×${game.canvas.height} · ${Math.round(gpu.bytes / 2 ** 20)} MB` +
      ` · ${gl ? `WebGL max ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}` : 'Canvas'} · hoch ${gpu.uploads} · GL-Fehler ${gpu.errors}` +
      ` · verloren ${diag.lost}/${diag.restored}${diag.error ? ` · ${diag.error}` : ''}`;
  }, 500);
}
