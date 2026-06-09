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
      // Context-aware (Stage 0): the front-end sends a resolved context
      // descriptor; a bare `path` is still accepted as the entry kind.
      context: body?.context && typeof body.context === 'object' ? body.context : null,
      path: body?.path,
      message: body?.message,
      history: Array.isArray(body?.history) ? body.history : [],
      focus: typeof body?.focus === 'string' ? body.focus : null,
    });
    if (!result.fired) {
      const status = result.busy ? 409 : 400;
      jsonResponse(res, status, result);
      return true;
    }
    jsonResponse(res, 200, result);
    return true;
  }

  // POST /api/entry-agent/apply — commit an APPROVED proposed edit to the live
  //   entry. Body: { path, op, turnId? }
  // Show-before-editing: the worker proposed this op and Loudon approved it
  // (clicked or typed). Writes + commits through the enforced path to the live
  // palace and posts a committed PROOF (read back over SSE). 400 when the op no
  // longer applies (a stale proposal) or is refused by the allow-list.
  if (urlPath === '/api/entry-agent/apply' && method === 'POST') {
    if (!companionLane || typeof companionLane.apply !== 'function') {
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
    const result = await companionLane.apply({
      path: typeof body?.path === 'string' ? body.path : null,
      op: body?.op,
      turnId: typeof body?.turnId === 'string' ? body.turnId : null,
    });
    jsonResponse(res, result.ok ? 200 : 400, result);
    return true;
  }

  // POST /api/entry-agent/undo — revert a committed Companion edit.
  //   Body: { path?, commit, turnId? }
  // Creates a new inverse commit in the live palace and posts a revert PROOF on
  // the same turn (read back over SSE). Honest, not a silent rollback. 400 on a
  // bad/missing commit or a revert that cannot apply cleanly.
  if (urlPath === '/api/entry-agent/undo' && method === 'POST') {
    if (!companionLane || typeof companionLane.undo !== 'function') {
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
    const result = await companionLane.undo({
      path: typeof body?.path === 'string' ? body.path : null,
      commit: body?.commit,
      turnId: typeof body?.turnId === 'string' ? body.turnId : null,
    });
    jsonResponse(res, result.ok ? 200 : 400, result);
    return true;
  }

  return false;
}
