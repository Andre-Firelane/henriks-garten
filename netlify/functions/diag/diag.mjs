// Netlify Function unter /__diag: Diagnose vom Tablet (?diag in der Adresse, siehe src/diag.js), auch auf der echten Seite.
// POST ?id=<Zeitpunkt>  ein Stück Messwerte (JSON-Zeilen; beim Start einmal mit dem Spielstand) – wird als eigener
//                       Eintrag im Speicher "diag" (Netlify Blobs) abgelegt: <id>/<Zeit>-<Zufall>
// GET  ?key=<SESSIONS_KEY>           Liste der Aufzeichnungen (neueste zuerst)
// GET  ?key=<SESSIONS_KEY>&id=<id>   eine Aufzeichnung als .jsonl (alle Stücke der Reihe nach)
// Lokal (vite preview/dev) nimmt stattdessen das Plugin „diag“ in vite.config.js die Daten an.
import { getStore } from '@netlify/blobs';

const ID = /^[\w-]{8,40}$/;
const MAX = 8e6; // (der Spielstand ist der größte Teil)

export default async (req) => {
  const store = getStore({ name: 'diag', consistency: 'strong' });
  const url = new URL(req.url);
  const id = url.searchParams.get('id') ?? '';
  if (req.method === 'POST') {
    if (!ID.test(id)) return new Response(null, { status: 400 });
    const body = await req.text();
    if (!body || body.length > MAX) return new Response(null, { status: 413 });
    await store.set(`${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, body);
    return new Response(null, { status: 204 });
  }
  const key = process.env.SESSIONS_KEY;
  if (req.method !== 'GET' || !key || url.searchParams.get('key') !== key) return new Response('Nicht erlaubt', { status: 403 });
  const { blobs } = await store.list({ prefix: ID.test(id) ? `${id}/` : undefined });
  if (!ID.test(id)) {
    const ids = [...new Set(blobs.map((b) => b.key.split('/')[0]))].sort().reverse();
    return new Response(ids.map((i) => `${i}  ${url.origin}/__diag?key=${encodeURIComponent(key)}&id=${i}`).join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const parts = [];
  for (const b of blobs.sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true }))) parts.push(await store.get(b.key));
  return new Response(parts.join(''), { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Content-Disposition': `attachment; filename="${id}.jsonl"` } });
};

export const config = { path: '/__diag' };
