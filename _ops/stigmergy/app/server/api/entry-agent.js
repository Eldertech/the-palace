// server/api/entry-agent.js — the entry-agent ("Companion") endpoints.
//
// M1a (this slice): GET /api/entry-agent/ground?path=<rel>
//   Read-only. Assembles the open entry's grounding — the page, its typed-link
//   neighborhood (each neighbor's stage + forward_vector), and the palace floor
//   — so the window's grounding readout is honest rather than a stub. No worker,
//   no writes, no wire touched.
//
// Later slices add the conversational turn (worker dispatch) and honest edits
// (the enforced write path). They will join this same family.

import { jsonResponse, readBody } from '../http.js';
import { assembleGrounding } from '../../src/lib/entry-grounding.js';

export async function entryAgentRoutes(ctx) {
  const { req, res, palaceRoot, urlPath, query, method, companionLane } = ctx;

  if (urlPath === '/api/entry-agent/ground' && method === 'GET') {
    const rel = query.get('path');
    if (!rel) {
      jsonResponse(res, 400, { error: 'missing ?path' });
      return true;
    }
    const grounding = assembleGrounding(palaceRoot, rel);
    if (!grounding) {
      jsonResponse(res, 404, { error: 'entry not found or excluded', path: rel });
      return true;
    }
    jsonResponse(res, 200, { ok: true, grounding, ts: new Date().toISOString() });
    return true;
  }

  // POST /api/entry-agent/turn — fire one Companion turn (M1b: discuss-only).
  //   Body: { path, message, history? }
  // Fires the actuator worker and returns immediately with the turn_id; the
  // reply arrives later on the board (companion_reply BROADCAST) over SSE.
  // Refused (409) while a turn is already running (scar #4).
  if (urlPath === '/api/entry-agent/turn' && method === 'POST') {
    if (!companionLane) {
      jsonResponse(res, 500, { error: 'companion lane unavailable' });
      return true;
    }
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let body;
    try { body = JSON.parse(bodyText); } catch (e) {
      jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
      return true;
    }
    const result = companionLane.turn({
      path: body?.path,
      message: body?.message,
      history: Array.isArray(body?.history) ? body.history : [],
    });
    if (!result.fired) {
      const status = result.busy ? 409 : 400;
      jsonResponse(res, status, result);
      return true;
    }
    jsonResponse(res, 200, result);
    return true;
  }

  return false;
}
