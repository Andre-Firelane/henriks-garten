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
  // Wolfsnacht: ein einzelnes Heulen (das erste der Aufnahme) und ein kurzes Knurren beim Fangen
  ['Sounds/Wolf heult.mp3', 'public/assets/sounds/wolf_howl.wav', 0.1, 5.1, 0.8],
  ['Sounds/Wolf.mp3', 'public/assets/sounds/animal_wolf.wav', 1.7, 1.3, 0.8],
  // Gnu: das erste Grunzen der Aufnahme (beim Fangen und ab und zu aus der Herde)
  ['Sounds/Gnu.mp3', 'public/assets/sounds/animal_gnu.wav', 0.6, 0.8, 0.8],
  // Savanne, Trockenzeit: Hyänen-Kichern (lockt zum Knochenstreuen, siehe Hyena.js) und kurz beim Fangen; Geier-Krächzen
  ['Sounds/Hyäne.mp3', 'public/assets/sounds/hyena_laugh.wav', 0.4, 3.6, 0.8],
  ['Sounds/Hyäne.mp3', 'public/assets/sounds/animal_hyena.wav', 0.4, 1.1, 0.8],
  ['Sounds/Geier.mp3', 'public/assets/sounds/animal_vulture.wav', 0.85, 1.35, 0.8],
  ['Sounds/Nilpferd.mp3', 'public/assets/sounds/animal_hippo.wav', 1.0, 1.6, 0.8], // Nilpferd-Grunzen (Starkregen)
  // Schritt drinnen (Haupthaus, Hütten, Aquarium): der erste Schritt aus der Aufnahme im Flur
  ['Sounds/Footsteps In Hallway Sound Effect.mp3', 'public/assets/sounds/step_indoor.wav', 0.66, 0.3, 0.8],
  // Tierrufe beim Fangen (der Name hinter "animal_" ist die Tierart)
  ['Sounds/schaf.wav', 'public/assets/sounds/animal_sheep.wav', 0.85, 0.85, 0.8],
  ['Sounds/katze.wav', 'public/assets/sounds/animal_cat.wav', 0.05, 0.75, 0.8],
  ['Sounds/eichhörnchen.wav', 'public/assets/sounds/animal_squirrel.wav', 0, 1.15, 0.8],
  ['Sounds/frosch.mp3', 'public/assets/sounds/animal_frog.mp3'],
  ['Sounds/Fisch.mp3', 'public/assets/sounds/animal_fish.wav', 1.15, 0.9, 0.8], // nur der erste Platscher
  // Bauernhof-Event: die Schafe sehen aus und klingen wie Kühe, Schweine und Ziegen (je der erste Ruf)
  ['Sounds/Kuh.mp3', 'public/assets/sounds/animal_cow.wav', 0.36, 2.4, 0.8],
  ['Sounds/Schwein.mp3', 'public/assets/sounds/animal_pig.wav', 0.2, 1.45, 0.8],
  ['Sounds/Ziege.mp3', 'public/assets/sounds/animal_goat.wav', 0.24, 0.85, 0.8],
  ['Sounds/Affe.mp3', 'public/assets/sounds/animal_macaque.wav', 0, 1.0, 0.8], // erste kurze Rufe
  ['Sounds/Panda.mp3', 'public/assets/sounds/animal_panda.wav', 0.7, 1.3, 0.8], // erster Laut
  ['Sounds/Flamingo.mp3', 'public/assets/sounds/animal_flamingo.wav', 0.18, 1.25, 0.8], // erster Ruf
  ['Sounds/Zebra.mp3', 'public/assets/sounds/animal_zebra.wav', 0.15, 1.45, 0.8], // erstes Wiehern, ohne den Knack am Anfang
  ['Sounds/Pfau.mp3', 'public/assets/sounds/animal_peacock.wav', 1.25, 2.45, 0.8], // erster Ruf (davor Stille)
  // Warnruf des Erdmännchen-Wächters (die ersten Rufe, ohne Knack und Stille davor)
  ['Sounds/Erdmännchen Alarm.mp3', 'public/assets/sounds/meerkat_alarm.wav', 2.5, 1.6, 0.8],
  // Brüllen des Löwen, wenn er den Spieler bemerkt (ohne den Knack am Anfang)
  ['Sounds/Löwe.mp3', 'public/assets/sounds/lion_roar.wav', 0.15, 1.9, 0.8],
  // Schwung beim Einsetzen eines Werkzeugs
  ['Sounds/whoosh.wav', 'public/assets/sounds/whoosh.wav', 0, 0.2, 0.8],
  // Auto springt an und fährt los (Schnellreise)
  ['Sounds/Auto.mp3', 'public/assets/sounds/car.wav', 0, 4.5, 0.8],
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
// ONLY=Teil des Dateinamens: nur diese Geräusche neu erzeugen (z. B. ONLY=step_indoor node tools/prepare-sounds.js)
const ONLY = process.env.ONLY;
for (const [src, dest, start, seconds, peak] of SOUNDS) {
  if (ONLY && !dest.includes(ONLY)) continue;
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

// Asien: ein Stück aus dem (einstündigen) Asien-Ambient, genau so lang wie das Wiesen-Ambient und als nahtlose
// Schleife (das Ende wird in den Anfang übergeblendet), leiser darübergelegt über die Wiesengeräusche.
// Weil beide gleich lang sind, liegen ihre Schleifenstellen übereinander.
const ASIA_MIX = { src: 'Sounds/Asien Ambient.mp3', base: 'public/assets/sounds/ambient_meadow.mp3', dest: 'public/assets/sounds/ambient_asia.mp3', fade: 3, gainDb: -18 };
if (!ONLY || ASIA_MIX.dest.includes(ONLY)) {
  const { src, base, dest, fade, gainDb } = ASIA_MIX;
  const len = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', base]).toString().trim());
  const end = len + fade;
  const filter =
    `[0:a]atrim=0:${end},asetpts=PTS-STARTPTS,asplit[a1][a2];` +
    `[a1]atrim=${fade}:${end},asetpts=PTS-STARTPTS[tail];[a2]atrim=0:${fade},asetpts=PTS-STARTPTS[head];` +
    `[tail][head]acrossfade=d=${fade}:c1=tri:c2=tri,volume=${gainDb}dB[asia];` +
    '[asia][1:a]amix=inputs=2:normalize=0:duration=shortest[out]';
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-i', base, '-filter_complex', filter, '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '128k', dest]);
  console.log(`${dest}: ${len.toFixed(2)} s, Asien über Wiese gemischt`);
}

// Schleifen aus einem Stück der Aufnahme: from bis to ausschneiden, das Ende geht weich in den Anfang über (wie beim
// Asien-Ambient). Riff: am Anfang und Ende ein- bzw. ausgeblendet – das fällt weg. Wald bei Nacht (Wolfsnacht): die
// Aufnahme ist eine Stunde lang, davon reichen 45 Sekunden aus der Mitte
const LOOPS = [
  { src: 'Sounds/Riff Ambient.mp3', dest: 'public/assets/sounds/ambient_reef.mp3', from: 0.8, to: 23.4, fade: 1 },
  { src: 'Sounds/Wald Nacht.mp3', dest: 'public/assets/sounds/ambient_forest_night.mp3', from: 600, to: 647, fade: 2 },
  // Große Wanderung (Savanne): Hufgetrappel der Gnu-Herde; am Anfang eine Sekunde Stille
  { src: 'Sounds/Gnu Event.mp3', dest: 'public/assets/sounds/ambient_migration.mp3', from: 1.3, to: 35.9, fade: 1.5 },
  { src: 'Sounds/Regen.mp3', dest: 'public/assets/sounds/ambient_savanna_rain.mp3', from: 0.5, to: 29.8, fade: 1.5 }, // Savanne bei Starkregen
];
for (const { src, dest, from, to, fade } of LOOPS) {
  if (ONLY && !dest.includes(ONLY)) continue;
  const filter =
    `[0:a]atrim=${from}:${to},asetpts=PTS-STARTPTS,asplit[a1][a2];` +
    `[a1]atrim=${fade},asetpts=PTS-STARTPTS[tail];[a2]atrim=0:${fade},asetpts=PTS-STARTPTS[head];` +
    `[tail][head]acrossfade=d=${fade}:c1=tri:c2=tri[out]`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-filter_complex', filter, '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '128k', dest]);
  console.log(`${dest}: ${(to - from - fade).toFixed(2)} s, Ränder weg, als Schleife überblendet`);
}
