// Netlify Function unter /api/session: zählt Spielrunden samt Spieldauer und zeigt die Liste (siehe handle.mjs).
// Gespeichert wird in Netlify Blobs (Speicher "sessions"), ohne Cookies und ohne IP-Adressen.
// Bei Netlify einzutragen: Umgebungsvariable SESSIONS_KEY (der geheime Schlüssel zum Anschauen der Liste).
import { getStore } from '@netlify/blobs';
import { handle } from './handle.mjs';

export default async (req) => handle(req, getStore({ name: 'sessions', consistency: 'strong' }), process.env.SESSIONS_KEY);

export const config = { path: '/api/session' };
