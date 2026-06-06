// server/api/worker.js — the Enrichment actuator (fire a `claude -p` worker).
//   GET  /api/worker       — actuator status (running / last fire)
//   POST /api/worker/fire  — fire a worker on the supervisor prompt

import { jsonResponse, readBody } from '../http.js';

export async function workerRoutes(ctx) {
  const { req, res, urlPath, method, actuator, opts } = ctx;

  // `stubbed` tells a test whether THIS server fires the harmless stub vs a real
  // claude -- so a fire-through e2e/capture can refuse to run against a
  // real-worker server (never spawning a real autonomous agent by accident).
  if (urlPath === '/api/worker' && method === 'GET') {
    jsonResponse(res, 200, {
      ...actuator.status(),
      stubbed: !!process.env.STIGMERGY_STUB_WORKER || !!opts.actuator,
      ts: new Date().toISOString(),
    });
    return true;
  }

  // Body: { prompt }. Refuses (409) when a worker is already alive (scar #4:
  // single global worker). The board becomes an actuator here.
  if (urlPath === '/api/worker/fire' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let body;
    try { body = JSON.parse(bodyText); } catch (e) {
      jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
      return true;
    }
    const prompt = body && typeof body.prompt === 'string' ? body.prompt : '';
    if (prompt.trim() === '') {
      jsonResponse(res, 400, { error: 'missing or empty prompt' });
      return true;
    }
    const result = actuator.fire(prompt);
    if (!result.fired) {
      // Refused because one is alive -> 409 Conflict; otherwise 500.
      const status = /already running/.test(result.msg) ? 409 : 500;
      jsonResponse(res, status, { ...result, ...actuator.status() });
      return true;
    }
    jsonResponse(res, 200, { ...result, ...actuator.status() });
    return true;
  }

  return false;
}
