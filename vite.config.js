import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Kennung dieses Builds: steckt im Spiel (__BUILD__) und in dist/version.json. Ist die Seite auf dem Tablet noch
// offen, vergleicht sie beides und lädt neu, wenn es eine neuere Version gibt (siehe src/update.js).
const BUILD = String(Date.now());

function diagMiddleware(req, res) {
  const id = (new URL(req.url, 'http://x').searchParams.get('id') ?? 'unbekannt').replace(/[^\w-]/g, '').slice(0, 40);
  if (req.method !== 'POST' || !id) {
    res.statusCode = 405;
    return res.end();
  }
  let body = '';
  req.on('data', (c) => {
    body += c;
    if (body.length > 20e6) req.destroy(); // (mehr kommt nie, auch nicht mit dem Spielstand)
  });
  req.on('end', () => {
    fs.mkdirSync('diag', { recursive: true });
    fs.appendFileSync(path.join('diag', `${id}.jsonl`), body);
    res.statusCode = 204;
    res.end();
  });
}

export default defineConfig({
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [
    {
      // Handy und Tablet laden die WebP-Fassungen der Bilder (public/assets/webp, aus tools/make-webp.py): fehlt eine, abbrechen;
      // ist eine älter als ihr PNG, warnen (nach dem Auschecken bei Netlify stimmen die Zeitstempel nicht)
      name: 'webp-check',
      buildStart() {
        const missing = [];
        const stale = [];
        for (const sub of ['', 'hd', 'hd2']) {
          const dir = path.join('public/assets', sub);
          for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.png'))) {
            const webp = path.join('public/assets/webp', sub, name.replace(/\.png$/, '.webp'));
            if (!fs.existsSync(webp)) missing.push(path.join(sub, name));
            else if (fs.statSync(webp).mtimeMs < fs.statSync(path.join(dir, name)).mtimeMs) stale.push(path.join(sub, name));
          }
        }
        if (stale.length) this.warn(`WebP älter als das PNG (python tools/make-webp.py .): ${stale.join(', ')}`);
        if (missing.length) this.error(`WebP fehlt für Handy und Tablet – bitte python tools/make-webp.py . laufen lassen: ${missing.join(', ')}`);
      },
    },
    {
      // Diagnose vom Tablet (?diag, siehe src/diag.js): Messwerte kommen per POST /__diag?id=… und landen in diag/<id>.jsonl
      name: 'diag',
      configureServer(server) {
        server.middlewares.use('/__diag', diagMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use('/__diag', diagMiddleware);
      },
    },
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
