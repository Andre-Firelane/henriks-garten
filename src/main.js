import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GardenScene from './scenes/GardenScene.js';
import { setupTouchControls } from './ui/touch.js';
import { setupUpdateCheck } from './update.js';

setupTouchControls();
setupUpdateCheck();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#4f8a2f',
  roundPixels: true,
  powerPreference: 'high-performance', // auf dem Tablet die schnellere Grafik nutzen
  scale: {
    mode: Phaser.Scale.RESIZE,
  },
  scene: [BootScene, GardenScene],
});
