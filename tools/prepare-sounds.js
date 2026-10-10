// Bereitet Geräusche aus "Sounds/" fürs Spiel auf: schneidet den passenden Ausschnitt heraus, blendet sanft
// ein und aus, rechnet sehr hohe Abtastraten herunter und gleicht die Lautstärke an.
// Ergebnis landet in public/assets/sounds/. MP3-Dateien ohne Ausschnitt werden unverändert kopiert;
// soll aus einer MP3 ein Stück herausgeschnitten werden, wird sie mit ffmpeg entpackt (muss installiert sein).
// Aufruf: npm run sounds
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SOUNDS = [
  // Quelle, Ziel, Start und Länge des Ausschnitts in Sekunden, Spitzenpegel (0..1)
  ['Sounds/535220__spycrah__grass-step-left.wav', 'public/assets/sounds/step.wav', 0, 0.3, 0.8],
  // Tierrufe beim Fangen (der Name hinter "animal_" ist die Tierart)
  ['Sounds/schaf.wav', 'public/assets/sounds/animal_sheep.wav', 0.85, 0.85, 0.8],
  ['Sounds/katze.wav', 'public/assets/sounds/animal_cat.wav', 0.05, 0.75, 0.8],
  ['Sounds/eichhörnchen.wav', 'public/assets/sounds/animal_squirrel.wav', 0, 1.15, 0.8],
  ['Sounds/frosch.mp3', 'public/assets/sounds/animal_frog.mp3'],
  ['Sounds/Fisch.mp3', 'public/assets/sounds/animal_fish.wav', 1.15, 0.9, 0.8], // nur der erste Platscher
  // Schwung beim Einsetzen eines Werkzeugs
  ['Sounds/whoosh.wav', 'public/assets/sounds/whoosh.wav', 0, 0.2, 0.8],
  // Falle schnappt zu, wenn ein Tier hineingeht
  ['Sounds/Falle.wav', 'public/assets/sounds/trap.wav', 0, 0.5, 0.8],
  // Hintergrundgeräusche der Level (laufen in Dauerschleife, siehe ambient in levels.js)
  ['Sounds/Wald Ambient.mp3', 'public/assets/sounds/ambient_forest.mp3'],
  ['Sounds/WIese Ambient.mp3', 'public/assets/sounds/ambient_meadow.mp3'],
  ['Sounds/Savanne Ambient.mp3', 'public/assets/sounds/ambient_savanna.mp3'],
];
const MAX_RATE = 48000; // höhere Abtastraten werden heruntergerechnet

function readWav(file) {
  const b = fs.readFileSync(file);
  let o = 12;
  let fmt = null;
  let data = null;
  while (o + 8 <= b.length) {
    const id = b.toString('ascii', o, o + 4);
    const len = b.readUInt32LE(o + 4);
    if (id === 'fmt ') fmt = { tag: b.readUInt16LE(o + 8), channels: b.readUInt16LE(o + 10), rate: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) };
    if (id === 'data') data = b.subarray(o + 8, o + 8 + len);
    o += 8 + len + (len % 2);
  }
  if (!fmt) throw new Error(`${file}: kein WAV-Format gefunden`);
  // in Mono-Gleitkommazahlen umwandeln (16/24/32 Bit Ganzzahl oder 32 Bit Gleitkomma)
  const bytes = fmt.bits / 8;
  const read =
    fmt.tag === 3 ? (p) => data.readFloatLE(p)
    : fmt.bits === 16 ? (p) => data.readInt16LE(p) / 32768
    : fmt.bits === 24 ? (p) => data.readIntLE(p, 3) / 8388608
    : (p) => data.readInt32LE(p) / 2147483648;
  const frames = Math.floor(data.length / (bytes * fmt.channels));
  let samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < fmt.channels; c++) sum += read((i * fmt.channels + c) * bytes);
    samples[i] = sum / fmt.channels;
  }
  // sehr hohe Abtastraten (z. B. 192 kHz) durch Mitteln herunterrechnen
  let rate = fmt.rate;
  const k = Math.ceil(rate / MAX_RATE);
  if (k > 1) {
    const out = new Float32Array(Math.floor(frames / k));
    for (let i = 0; i < out.length; i++) {
      let sum = 0;
      for (let j = 0; j < k; j++) sum += samples[i * k + j];
      out[i] = sum / k;
    }
    samples = out;
    rate = Math.round(rate / k);
  }
  return { rate, samples };
}

// MP3 mit ffmpeg in eine vorübergehende WAV-Datei entpacken
function mp3ToWav(file) {
  const tmp = path.join(os.tmpdir(), `sound-${process.pid}.wav`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-c:a', 'pcm_s16le', tmp]);
  return tmp;
}

function writeWav(file, rate, samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + samples.length * 2, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); // PCM
  b.writeUInt16LE(1, 22); // mono
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  fs.writeFileSync(file, b);
}

fs.mkdirSync('public/assets/sounds', { recursive: true });
for (const [src, dest, start, seconds, peak] of SOUNDS) {
  if (/\.mp3$/i.test(src) && start === undefined) {
    fs.copyFileSync(src, dest);
    console.log(`${dest}: kopiert`);
    continue;
  }
  const { rate, samples } = readWav(/\.mp3$/i.test(src) ? mp3ToWav(src) : src);
  const from = Math.round(start * rate);
  const out = samples.slice(from, Math.min(samples.length, from + Math.round(seconds * rate)));
  // kurz einblenden und die letzten 40 % sanft ausblenden, damit es nicht knackt
  const fadeIn = Math.min(out.length, Math.round(0.01 * rate));
  for (let i = 0; i < fadeIn; i++) out[i] *= i / fadeIn;
  const fadeFrom = Math.floor(out.length * 0.6);
  for (let i = fadeFrom; i < out.length; i++) out[i] *= 1 - (i - fadeFrom) / (out.length - fadeFrom);
  const max = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  for (let i = 0; i < out.length; i++) out[i] *= peak / max;
  writeWav(dest, rate, out);
  console.log(`${dest}: ${(out.length / rate).toFixed(2)} s, verstärkt x${(peak / max).toFixed(1)}`);
}
