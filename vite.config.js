import { defineConfig } from 'vite';

export default defineConfig({
  // im WLAN erreichbar machen, damit man auf dem Tablet spielen kann (Adresse zeigt der Server beim Start)
  server: { host: true, port: 5173 },
  preview: { host: true, port: 5173 },
});
