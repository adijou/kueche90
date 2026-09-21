import type { Config } from '@netlify/functions';
import { json, ready } from '../lib/generation';
import { settings } from '../lib/environment';
export default async (request: Request) =>
  request.method === 'GET'
    ? json({ ready: ready(settings()) })
    : json({ error: 'Nur GET ist erlaubt.' }, 405);
export const config: Config = { path: '/api/status' };
