// server/api/entry-save.js — Phase 5 Stage A: the dry-run commit preview.
//   POST /api/entry/save
//
// NEVER writes the file and NEVER commits -- it composes the structured commit
// STIGMERGY WOULD make if armed, and returns the preview. The allow-list (in
// composePreview) refuses .git/.claude/_ops machinery and canon files; canon
// edits flow through Claude conversation under show-before-write.

import { jsonResponse, readBody } from '../http.js';
import { composePreview } from '../entry-save.js';

export async function entrySaveRoutes(ctx) {
  const { req, res, palaceRoot, urlPath, method } = ctx;

  if (urlPath === '/api/entry/save' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let parsed;
    try { parsed = JSON.parse(bodyText); } catch (e) {
      jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
      return true;
    }
    const result = composePreview({ palaceRoot, ...(parsed || {}), relPath: parsed?.path });
    if (!result.ok) {
      jsonResponse(res, result.status || 400, {
        error: result.error,
        errors: result.errors,
        warnings: result.warnings,
      });
      return true;
    }
    jsonResponse(res, 200, { ok: true, preview: result.preview });
    return true;
  }

  return false;
}
