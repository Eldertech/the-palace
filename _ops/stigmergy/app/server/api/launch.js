// server/api/launch.js — open an interactive Claude Code session in a terminal.
//   POST /api/launch  { prompt }  -> stage a launcher + osascript Terminal.app
//
// The human-driven counterpart to /api/worker/fire (headless `claude -p`): this
// hands the prompt to a real TUI the user watches + steers. macOS-only; a
// non-darwin host gets a 501 so the client falls back to "copy prompt".

import { jsonResponse, readBody } from '../http.js';
import { launchInteractive } from '../launch.js';

export async function launchRoutes(ctx) {
  const { req, res, urlPath, method, palaceRoot, opts } = ctx;
  if (urlPath !== '/api/launch' || method !== 'POST') return false;

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

  // opts.launchImpl lets a test intercept the spawn without opening a Terminal;
  // opts.launchOpts threads platform/spawnImpl/tmpDir into the real impl.
  const launch = opts.launchImpl || launchInteractive;
  const result = launch(prompt, { palaceRoot, ...(opts.launchOpts || {}) });

  if (!result.launched) {
    // not-on-macOS -> 501 (client falls back to copy); any other failure -> 500.
    jsonResponse(res, result.supported === false ? 501 : 500, result);
    return true;
  }
  jsonResponse(res, 200, result);
  return true;
}
