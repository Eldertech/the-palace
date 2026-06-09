// server/api/entry-save.js — the STATE edit-form write surfaces.
//   POST /api/entry/save           — dry-run commit preview (NEVER writes)
//   POST /api/entry/trickster-save — the REAL write behind the form's Trickster
//                                    Commit button (canon included)
//
// /save composes the structured commit STIGMERGY WOULD make and returns the
// preview; with `trickster:true` it auditions a canon edit (path-safety gate
// only). /trickster-save actually writes + commits the form's hand-edited entry
// as Palace-Author: trickster + verify: unverified — the careful careful-path
// allow-list is bypassed, path-safety is not. See [[Trickster Commit]].

import { jsonResponse, readBody } from '../http.js';
import { composePreview, tricksterSaveEntry } from '../entry-save.js';

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

  // POST /api/entry/trickster-save — the trusted hand writes the form's edits
  //   straight to the entry (canon included), one gesture, no preview gate.
  //   Body: { path, frontmatter, body, summary, body_message? }.
  // Commits as Palace-Author: trickster + verify: unverified. Path-safety still
  // refuses ../ NUL / non-.md / VCS dirs. Reverting is the LOG/companion undo.
  if (urlPath === '/api/entry/trickster-save' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let parsed;
    try { parsed = JSON.parse(bodyText); } catch (e) {
      jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
      return true;
    }
    const result = await tricksterSaveEntry(palaceRoot, {
      relPath: parsed?.path,
      frontmatter: parsed?.frontmatter || {},
      body: typeof parsed?.body === 'string' ? parsed.body : '',
      summary: parsed?.summary,
      body_message: typeof parsed?.body_message === 'string' ? parsed.body_message : '',
    });
    if (!result.ok) {
      jsonResponse(res, result.status || 400, { ok: false, error: result.error, message: result.message });
      return true;
    }
    jsonResponse(res, 200, result);
    return true;
  }

  return false;
}
