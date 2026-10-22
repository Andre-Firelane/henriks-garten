// Spielrunden: Meldungen des Spiels annehmen (POST) und die Liste zeigen (GET mit Schlüssel).
// Getrennt von session.mjs, damit es sich ohne Netlify testen lässt (store: Netlify Blobs oder ein Ersatz).
//
// POST { type: 'start', id, kind, lang, device }  neue Runde
// POST { type: 'update', id, seconds }            Spieldauer bisher (kommt mehrmals, die letzte zählt)
// GET  ?key=<SESSIONS_KEY>                         Tabelle; &format=csv für Excel

const KINDS = { continue: 'Weiterspielen', new: 'Neues Spiel', test: 'Test-Spiel' };
const DEVICES = { tablet: 'Tablet', phone: 'Handy', pc: 'PC' };
const LANGS = ['de', 'en'];
const ID = /^[\w-]{8,40}$/;
const MAX_SECONDS = 24 * 60 * 60;

export async function handle(req, store, secret) {
  if (req.method === 'POST') return record(req, store);
  if (req.method === 'GET') return show(req, store, secret);
  return new Response(null, { status: 405 });
}

async function record(req, store) {
  const text = await req.text();
  if (text.length > 1000) return new Response(null, { status: 413 });
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
    s.last = new Date().toISOString();
    await store.setJSON(msg.id, s);
    return new Response(null, { status: 204 });
  }
  return new Response(null, { status: 400 });
}

const berlin = (iso, opts) => new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', ...opts });
const minutes = (sec) => (sec < 60 ? `${sec} s` : `${Math.round(sec / 60)} min`);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

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
  }));

  if (url.searchParams.get('format') === 'csv') {
    const lines = ['Datum;Uhrzeit;Gerät;Sprache;Art;Spieldauer (Minuten)', ...rows.map((r) => [r.day, r.time, r.device, r.lang, r.kind, (r.seconds / 60).toFixed(1).replace('.', ',')].join(';'))];
    return new Response('﻿' + lines.join('\r\n'), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="spielrunden.csv"' },
    });
  }

  const real = rows.filter((r) => r.kind !== KINDS.test);
  const total = real.reduce((n, r) => n + r.seconds, 0);
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spielrunden · My Little Zoo</title>
<style>
  body { margin: 0; padding: 16px; font: 15px/1.4 "Trebuchet MS", Arial, sans-serif; color: #2b1d14; background: #f4dcae; }
  h1 { margin: 0 0 8px; font-size: 22px; } p { margin: 0 0 12px; }
  table { border-collapse: collapse; width: 100%; max-width: 760px; background: #fff8e6; }
  th, td { padding: 5px 10px; border-bottom: 1px solid #e0c08a; text-align: left; white-space: nowrap; }
  th { background: #6b4224; color: #fff8e6; } td.num { text-align: right; } tr.test { color: #8a7a6a; }
  a { color: #6b4224; }
</style></head><body>
<h1>Spielrunden · My Little Zoo</h1>
<p><b>${real.length}</b> Runden (ohne Test-Spiele) · gesamt <b>${minutes(total)}</b> gespielt ·
<a href="?key=${encodeURIComponent(secret)}&amp;format=csv">als CSV für Excel</a></p>
<table><tr><th>Datum</th><th>Uhrzeit</th><th>Gerät</th><th>Sprache</th><th>Art</th><th>Spieldauer</th></tr>
${rows.map((r) => `<tr${r.kind === KINDS.test ? ' class="test"' : ''}><td>${esc(r.day)}</td><td>${esc(r.time)}</td><td>${esc(r.device)}</td><td>${esc(r.lang)}</td><td>${esc(r.kind)}</td><td class="num">${minutes(r.seconds)}</td></tr>`).join('\n')}
</table></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
