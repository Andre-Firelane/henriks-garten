// Spielrunden: Meldungen des Spiels annehmen (POST) und die Liste zeigen (GET mit Schlüssel).
// Getrennt von session.mjs, damit es sich ohne Netlify testen lässt (store: Netlify Blobs oder ein Ersatz).
// Die Tierbilder kommen aus den Spritesheets des Spiels (src/ui/icons.js, Bilder unter /assets).
//
// POST { type: 'start', id, kind, lang, device }  neue Runde
// POST { type: 'update', id, seconds, catches, events }  Spieldauer bisher (kommt mehrmals, die letzte zählt) und
//                                                  gefangene Tiere bzw. gestartete Events der Runde: { Art: Anzahl }
// GET  ?key=<SESSIONS_KEY>                         Tabelle; &format=csv für Excel
import { animalIcon } from '../../../src/ui/icons.js';

const KINDS = { continue: 'Weiterspielen', new: 'Neues Spiel', test: 'Test-Spiel' };
const DEVICES = { tablet: 'Tablet', phone: 'Handy', pc: 'PC' };
const LANGS = ['de', 'en'];
const ID = /^[\w-]{8,40}$/;
const MAX_SECONDS = 24 * 60 * 60;
const KEY = /^[a-z0-9]{1,20}$/;
// Events mit Symbol und Namen (Ids wie in src/world/events.js)
const EVENTS = {
  babies: ['🍼', 'Tierbabys'],
  ride: ['🐎', 'Reittier'],
  flamingo: ['🦩', 'Flamingo-Flug'],
  farm: ['🐄', 'Bauernhof'],
  rare: ['✨', 'Seltene Tiere'],
  jellyfish: ['🪼', 'Quallen-Schwarm'],
  migration: ['🐃', 'Große Wanderung'],
  wolves: ['🐺', 'Wolfsnacht'],
  fireflies: ['🏮', 'Glühwürmchen-Abend'],
  weather: ['🌦️', 'Wetterwechsel'],
  icecream: ['🍦', 'Eisstand'],
};

export async function handle(req, store, secret) {
  if (req.method === 'POST') return record(req, store);
  if (req.method === 'GET') return show(req, store, secret);
  return new Response(null, { status: 405 });
}

// { Art: Anzahl } aus einer Meldung übernehmen: nur vernünftige Schlüssel und Zahlen, je Art zählt die größte gemeldete Zahl
function merge(old, sent) {
  const out = { ...old };
  if (!sent || typeof sent !== 'object') return out;
  for (const [k, v] of Object.entries(sent).slice(0, 80)) {
    const n = Math.round(Number(v));
    if (KEY.test(k) && Number.isFinite(n) && n > 0) out[k] = Math.max(out[k] ?? 0, Math.min(n, 9999));
  }
  return out;
}

async function record(req, store) {
  const text = await req.text();
  if (text.length > 4000) return new Response(null, { status: 413 });
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!ID.test(msg?.id ?? '')) return new Response(null, { status: 400 });
  if (msg.type === 'start') {
    if (!KINDS[msg.kind] || !DEVICES[msg.device] || !LANGS.includes(msg.lang)) return new Response(null, { status: 400 });
    if (await store.get(msg.id, { type: 'json' })) return new Response(null, { status: 204 }); // schon da
    await store.setJSON(msg.id, { start: new Date().toISOString(), kind: msg.kind, lang: msg.lang, device: msg.device, seconds: 0 });
    return new Response(null, { status: 204 });
  }
  if (msg.type === 'update') {
    const s = await store.get(msg.id, { type: 'json' });
    const seconds = Math.round(Number(msg.seconds));
    if (!s || !Number.isFinite(seconds)) return new Response(null, { status: 404 });
    s.seconds = Math.max(s.seconds, Math.min(seconds, MAX_SECONDS));
    s.catches = merge(s.catches, msg.catches);
    s.events = merge(s.events, msg.events);
    s.last = new Date().toISOString();
    await store.setJSON(msg.id, s);
    return new Response(null, { status: 204 });
  }
  return new Response(null, { status: 400 });
}

const berlin = (iso, opts) => new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', ...opts });
const minutes = (sec) => (sec < 60 ? `${sec} s` : `${Math.round(sec / 60)} min`);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const sorted = (map) => Object.entries(map ?? {}).sort((a, b) => b[1] - a[1]); // die meisten zuerst
const total = (map) => Object.values(map).reduce((n, k) => n + k, 0);
function sum(maps) {
  const out = {};
  for (const m of maps) for (const [k, n] of Object.entries(m)) out[k] = (out[k] ?? 0) + n;
  return out;
}

// kleines Tierbild (oder der Name, falls es keins gibt) bzw. Event-Symbol, jeweils mit Anzahl
function catchTag(species, n) {
  let icon;
  try {
    icon = animalIcon(species, 2);
  } catch {
    icon = esc(species);
  }
  return `<span class="tag" title="${esc(species)}">${icon}<b>${n}</b></span>`;
}
const eventTag = (id, n) => `<span class="tag" title="${esc(EVENTS[id]?.[1] ?? id)}">${EVENTS[id]?.[0] ?? esc(id)}<b>${n}</b></span>`;
const tags = (map, tag) => sorted(map).map(([k, n]) => tag(k, n)).join('') || '<span class="none">–</span>';

async function show(req, store, secret) {
  const url = new URL(req.url);
  if (!secret) return new Response('SESSIONS_KEY ist bei Netlify nicht eingetragen.', { status: 500 });
  if (url.searchParams.get('key') !== secret) return new Response('Kein Zugriff.', { status: 403 });
  const { blobs } = await store.list();
  const all = (await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))).filter(Boolean);
  all.sort((a, b) => (a.start < b.start ? 1 : -1)); // neueste zuerst
  const rows = all.map((s) => ({
    day: berlin(s.start, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: berlin(s.start, { hour: '2-digit', minute: '2-digit' }),
    device: DEVICES[s.device] ?? s.device,
    lang: s.lang,
    kind: KINDS[s.kind] ?? s.kind,
    seconds: s.seconds,
    catches: s.catches ?? {},
    events: s.events ?? {},
  }));

  if (url.searchParams.get('format') === 'csv') {
    const list = (map) => sorted(map).map(([k, n]) => `${k} ${n}`).join(', ');
    const lines = [
      'Datum;Uhrzeit;Gerät;Sprache;Art;Spieldauer (Minuten);Gefangen;Events',
      ...rows.map((r) => [r.day, r.time, r.device, r.lang, r.kind, (r.seconds / 60).toFixed(1).replace('.', ','), list(r.catches), list(r.events)].join(';')),
    ];
    return new Response('﻿' + lines.join('\r\n'), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="spielrunden.csv"' },
    });
  }

  const real = rows.filter((r) => r.kind !== KINDS.test);
  const played = real.reduce((n, r) => n + r.seconds, 0);
  const caught = sum(real.map((r) => r.catches));
  const started = sum(real.map((r) => r.events));
  // <base href="/">: die Tierbilder liegen unter /assets (wie im Spiel), die Seite selbst unter /api/session
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<base href="/">
<title>Spielrunden · My Little Zoo</title>
<style>
  body { margin: 0; padding: 16px; font: 15px/1.4 "Trebuchet MS", Arial, sans-serif; color: #2b1d14; background: #f4dcae; }
  h1 { margin: 0 0 8px; font-size: 22px; } p { margin: 0 0 12px; }
  h2 { margin: 16px 0 6px; font-size: 17px; }
  .box { max-width: 1100px; padding: 8px 10px; background: #fff8e6; border-radius: 8px; }
  .wrap { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; max-width: 1100px; background: #fff8e6; }
  th, td { padding: 5px 10px; border-bottom: 1px solid #e0c08a; text-align: left; white-space: nowrap; vertical-align: middle; }
  th { background: #6b4224; color: #fff8e6; } td.num { text-align: right; } tr.test { color: #8a7a6a; }
  td.tags { white-space: normal; min-width: 160px; font-size: 13px; }
  .tag { display: inline-flex; align-items: flex-end; gap: 2px; margin: 2px 10px 2px 0; }
  .tag b { font-size: 0.85em; }
  .animal { display: inline-block; background-repeat: no-repeat; }
  .none { color: #8a7a6a; }
  a { color: #6b4224; }
</style></head><body>
<h1>Spielrunden · My Little Zoo</h1>
<p><b>${real.length}</b> Runden (ohne Test-Spiele) · gesamt <b>${minutes(played)}</b> gespielt ·
<a href="/api/session?key=${encodeURIComponent(secret)}&amp;format=csv">als CSV für Excel</a></p>
<h2>Gefangene Tiere (${total(caught)})</h2>
<div class="box">${tags(caught, catchTag)}</div>
<h2>Gestartete Events (${total(started)})</h2>
<div class="box">${tags(started, eventTag)}</div>
<h2>Runden</h2>
<div class="wrap"><table><tr><th>Datum</th><th>Uhrzeit</th><th>Gerät</th><th>Sprache</th><th>Art</th><th>Spieldauer</th><th>Gefangen</th><th>Events</th></tr>
${rows.map((r) => `<tr${r.kind === KINDS.test ? ' class="test"' : ''}><td>${esc(r.day)}</td><td>${esc(r.time)}</td><td>${esc(r.device)}</td><td>${esc(r.lang)}</td><td>${esc(r.kind)}</td><td class="num">${minutes(r.seconds)}</td><td class="tags">${tags(r.catches, catchTag)}</td><td class="tags">${tags(r.events, eventTag)}</td></tr>`).join('\n')}
</table></div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
