// server/api/cards.js — the Enrichment card queue (Phase 4.5).
//   GET  /api/cards          — normalized cards + validator verdicts + artifacts
//   POST /api/cards/respond  — write a response block + fire the supervisor

import { jsonResponse, readBody, readSupervisorPrompt } from '../http.js';
import { readCards, appendInboxBlock, CARD_ACTIONS } from '../cards.js';

export async function cardsRoutes(ctx) {
  const { req, res, palaceRoot, urlPath, method, actuator } = ctx;

  if (urlPath === '/api/cards' && method === 'GET') {
    try {
      const data = readCards(palaceRoot);
      jsonResponse(res, 200, { ...data, ts: new Date().toISOString() });
      return true;
    } catch (err) {
      jsonResponse(res, 500, { error: `read cards failed: ${err.message}` });
      return true;
    }
  }

  // Body: { cardId, action, note?, targetName?, purpose? }. Writes the response
  // to Enrichment/inbox.md, then fires the supervisor worker to act on it (the
  // same stub-gated primitive, so this never spawns a real claude in test).
  if (urlPath === '/api/cards/respond' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let body;
    try { body = JSON.parse(bodyText); } catch (e) {
      jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
      return true;
    }
    const { cardId, action, note, targetName, purpose } = body || {};
    if (typeof cardId !== 'string' || cardId.trim() === '') {
      jsonResponse(res, 400, { error: 'missing cardId' });
      return true;
    }
    if (!CARD_ACTIONS.includes(action)) {
      jsonResponse(res, 400, { error: `action must be one of ${CARD_ACTIONS.join('|')}` });
      return true;
    }
    const wrote = appendInboxBlock(palaceRoot, {
      cardId, action, note, targetName, purpose, ts: new Date().toISOString(),
    });
    if (!wrote.ok) { jsonResponse(res, 500, { error: wrote.msg }); return true; }

    // Fire the supervisor to drain the inbox + top up the queue. A refused fire
    // (one already running) is NOT an error -- the inbox write succeeded and the
    // live worker will pick it up.
    const supervisorPrompt = readSupervisorPrompt(palaceRoot);
    const fired = actuator.fire(supervisorPrompt);
    jsonResponse(res, 200, {
      ok: true, inbox: wrote.msg, fired: fired.fired, worker_msg: fired.msg,
      ...actuator.status(),
    });
    return true;
  }

  return false;
}
