// server/api/digest.js — alignment-review (digest verdict) endpoints.
//   POST /api/digest/verdict   — append one verdict record (append-only)
//   GET  /api/digest/verdicts  — { verdicts, stats } for the panel

import { jsonResponse, readBody } from '../http.js';
import { appendVerdict, readVerdicts } from '../digest-verdicts.js';
import { validateVerdict, matchStats } from '../../src/lib/digest-verdicts.js';

export async function digestRoutes(ctx) {
  const { req, res, palaceRoot, urlPath, method } = ctx;

  // Append-only; re-marking the same (run_generated_at, request_id) appends a
  // new line and dedupeLatest collapses to latest at read time. Out-of-contract
  // for the engine: does NOT touch trickster-auto, does NOT post to the board.
  if (urlPath === '/api/digest/verdict' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let record;
    try { record = JSON.parse(bodyText); } catch (e) {
      jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
      return true;
    }
    const v = validateVerdict(record);
    if (!v.valid) { jsonResponse(res, 400, { errors: v.errors }); return true; }
    try {
      const line = await appendVerdict(palaceRoot, record);
      jsonResponse(res, 200, { ok: true, line });
      return true;
    } catch (err) {
      jsonResponse(res, 500, { error: `verdict write failed: ${err.message}` });
      return true;
    }
  }

  if (urlPath === '/api/digest/verdicts' && method === 'GET') {
    try {
      const verdicts = readVerdicts(palaceRoot);
      const stats = matchStats(verdicts);
      jsonResponse(res, 200, { verdicts, stats });
      return true;
    } catch (err) {
      jsonResponse(res, 500, { error: `verdict read failed: ${err.message}` });
      return true;
    }
  }

  return false;
}
