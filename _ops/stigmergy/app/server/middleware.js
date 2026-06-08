// Stigmergy data adapter middleware — the Vite dev-server plugin factory.
//
// A thin seam: it builds the two long-lived worker lanes (server/workers.js) and
// delegates every request to the api/ endpoint families via server/router.js.
// The handlers live in server/api/*.js; shared HTTP + data-read helpers in
// server/http.js; the SSE stream lifecycle in server/sse.js. (This module was an
// 858-line megamodule before the audit §4 decomposition.)
//
// Endpoints served (see server/api/ for the handlers):
//   GET  /api/persistent[/stream]   GET/POST /api/persistent
//   GET  /api/sessions   GET/POST /api/sessions/:id[/stream]
//   GET  /api/open  /api/file  /api/entries  /api/unsung-paths  /api/topology  /api/entry
//   GET  /api/log  /api/commit  /api/uncommitted   POST /api/commit/create
//   GET  /api/worker   POST /api/worker/fire
//   GET  /api/stewards   POST /api/steward/advance  /api/stewards/advance-all
//   GET  /api/cards   POST /api/cards/respond
//   POST /api/digest/verdict   GET /api/digest/verdicts   POST /api/entry/save
//
// The palace root is derived from PALACE_ROOT if set, else from a default path.
// Tests pass an explicit `palaceRoot` to avoid env-var coupling, and may inject
// opts.actuator / opts.stewardLane so the test path never spawns a real worker.

import { buildWorkers } from './workers.js';
import { dispatch } from './router.js';

// Re-exported from http.js so direct importers keep working (middleware.test.js).
export { resolveInsidePalace, contentTypeFor, readPersistent, listSessions, readSession } from './http.js';

export function blackboardMiddleware(palaceRoot, opts = {}) {
  // The two long-lived worker lanes (Enrichment actuator + steward lane). See
  // workers.js for the scar #4 single-global-worker rule and the
  // STIGMERGY_STUB_WORKER gate. Tests inject opts.actuator / opts.stewardLane.
  const { actuator, stewardLane, companionLane } = buildWorkers(palaceRoot, opts);

  return {
    name: 'stigmergy-blackboard-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Strip query string for routing; keep it (in ctx.query) for the handlers.
        const rawUrl = req.url || '';
        const [urlPath, queryString] = rawUrl.split('?');
        const query = new URLSearchParams(queryString || '');
        const method = (req.method || 'GET').toUpperCase();

        const ctx = { req, res, palaceRoot, urlPath, query, method, actuator, stewardLane, companionLane, opts };
        if (await dispatch(ctx)) return; // a family owned the response
        next(); // not an /api route we handle — let Vite serve the app
      });
    },
  };
}
