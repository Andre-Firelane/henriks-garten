import { defineConfig } from 'vite';

// Kennung dieses Builds: steckt im Spiel (__BUILD__) und in dist/version.json. Ist die Seite auf dem Tablet noch
// offen, vergleicht sie beides und lädt neu, wenn es eine neuere Version gibt (siehe src/update.js).
const BUILD = String(Date.now());

export default defineConfig({
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [
    {
      name: 'version-json',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD }) });
      },
    },
  ],
  // im WLAN erreichbar machen, damit man auf dem Tablet spielen kann (Adresse zeigt der Server beim Start)
  server: { host: true, port: 5173 },
  // no-cache: der Browser fragt jedes Mal nach, ob sich etwas geändert hat (sonst nimmt er gern die alte Seite)
  preview: { host: true, port: 5173, headers: { 'Cache-Control': 'no-cache' } },
});
