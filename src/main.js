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
const DPR = Math.min(window.devicePixelRatio || 1, 2);
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
