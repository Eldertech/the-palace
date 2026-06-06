// server/api/stewards.js — permanent-steward lane endpoints.
//   GET  /api/stewards            — registered stewards + grant state + worker
//   POST /api/steward/advance     — advance ONE steward by a cycle
//   POST /api/stewards/advance-all — advance every ready steward

import { jsonResponse, readBody } from '../http.js';

export async function stewardsRoutes(ctx) {
  const { req, res, urlPath, method, stewardLane, opts } = ctx;

  // Each row carries grants_waiting (TRICKSTER grants the steward hasn't yet
  // consumed) plus the steward-lane worker status.
  if (urlPath === '/api/stewards' && method === 'GET') {
    try {
      jsonResponse(res, 200, {
        stewards: stewardLane.list(),
        worker: stewardLane.status(),
        stubbed: !!process.env.STIGMERGY_STUB_WORKER || !!opts.stewardLane,
        ts: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      jsonResponse(res, 500, { error: `read stewards failed: ${err.message}` });
      return true;
    }
  }

  // Body: { name }. Fires the steward-lane worker; the reap consumes its
  // pending grants. Refuses (409) when a steward cycle is already alive.
  if (urlPath === '/api/steward/advance' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let body;
    try { body = JSON.parse(bodyText); } catch (e) {
      jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
      return true;
    }
    const name = body && typeof body.name === 'string' ? body.name.trim() : '';
    if (name === '') { jsonResponse(res, 400, { error: 'missing or empty name' }); return true; }
    const result = stewardLane.advance({ name });
    if (!result.ok) {
      // unknown steward -> 404; busy -> 409; anything else -> 500.
      const status = result.found === false ? 404 : (result.busy ? 409 : 500);
      jsonResponse(res, status, { ...result, ...stewardLane.status() });
      return true;
    }
    jsonResponse(res, 200, { ...result, ...stewardLane.status() });
    return true;
  }

  // Body: { names? }. Defaults to all stewards with grants_waiting > 0. Fires
  // them serially (one worker per lane); the reap drains the queue.
  if (urlPath === '/api/stewards/advance-all' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let body = {};
    if (bodyText.trim() !== '') {
      try { body = JSON.parse(bodyText); } catch (e) {
        jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
        return true;
      }
    }
    const names = Array.isArray(body.names) ? body.names : undefined;
    const result = stewardLane.advanceAll({ names });
    if (!result.ok && result.busy) {
      jsonResponse(res, 409, { ...result });
      return true;
    }
    jsonResponse(res, 200, { ...result });
    return true;
  }

  return false;
}
