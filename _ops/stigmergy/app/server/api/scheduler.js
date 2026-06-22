// server/api/scheduler.js — the heartbeat scheduler watch-and-steer endpoints.
//   GET  /api/scheduler/status  — truthful launchd/heartbeat state (no launchctl)
//   POST /api/scheduler/pause   { paused } — toggle the global .paused flag-file
//
// Watch is a pure filesystem read (server/scheduler.js); steer writes ONE file.
// STIGMERGY never shells out to launchctl — install/load stays the operator's
// act. Both impls are injectable via opts for the route tests.

import { jsonResponse, readBody } from '../http.js';
import { readSchedulerStatus, setSchedulerPaused } from '../scheduler.js';

export async function schedulerRoutes(ctx) {
  const { req, res, palaceRoot, urlPath, method, opts } = ctx;

  if (urlPath === '/api/scheduler/status' && method === 'GET') {
    try {
      const run = opts.schedulerStatusImpl || readSchedulerStatus;
      // opts.launchAgentsDir lets a test point the install check at a temp dir
      // instead of the real ~/Library/LaunchAgents.
      const result = run({ palaceRoot, launchAgentsDir: opts.launchAgentsDir });
      jsonResponse(res, result && result.ok === false ? (result.status || 500) : 200, result);
      return true;
    } catch (err) {
      jsonResponse(res, 500, { ok: false, error: `scheduler status failed: ${err.message}` });
      return true;
    }
  }

  if (urlPath === '/api/scheduler/pause' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let body = {};
    if (bodyText.trim() !== '') {
      try { body = JSON.parse(bodyText); } catch (e) {
        jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
        return true;
      }
    }
    if (typeof body.paused !== 'boolean') {
      jsonResponse(res, 400, { error: 'missing or non-boolean "paused"' });
      return true;
    }
    try {
      const run = opts.schedulerPauseImpl || setSchedulerPaused;
      const result = run({ palaceRoot, paused: body.paused });
      jsonResponse(res, result.ok ? 200 : (result.status || 500), result);
      return true;
    } catch (err) {
      jsonResponse(res, 500, { ok: false, error: `scheduler pause failed: ${err.message}` });
      return true;
    }
  }

  return false;
}
