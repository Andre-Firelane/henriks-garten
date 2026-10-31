import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GardenScene from './scenes/GardenScene.js';
import { setupTouchControls } from './ui/touch.js';
import { setupUpdateCheck } from './update.js';
import { setupSessions } from './sessions.js';
import { setupLoadingErrors } from './ui/loading.js';
import { setupScrollbars } from './ui/scrollbar.js';

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
window.addEventListener('resize', () => game.scale.resize(...size()));
if (params.has('fps')) {
  const box = Object.assign(document.createElement('div'), { style: 'position:fixed;left:4px;bottom:4px;z-index:99;font:bold 14px monospace;color:#fff;background:#000a;padding:2px 6px;pointer-events:none' });
  document.body.append(box);
  setInterval(() => (box.textContent = `${Math.round(game.loop.actualFps)} fps · ${game.canvas.width}×${game.canvas.height}`), 500);
}
