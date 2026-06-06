// server/api/persistent.js — the persistent blackboard endpoints.
//   GET  /api/persistent/stream  — SSE live feed
//   GET  /api/persistent         — full read
//   POST /api/persistent         — append one §2.2-conformant message

import { resolve } from 'node:path';
import { jsonResponse, readBody, handlePost, readPersistent, PERSISTENT_REL } from '../http.js';
import { setupSseStream } from '../sse.js';

export async function persistentRoutes(ctx) {
  const { req, res, palaceRoot, urlPath, method } = ctx;

  if (urlPath === '/api/persistent/stream' && method === 'GET') {
    setupSseStream(req, res, resolve(palaceRoot, PERSISTENT_REL));
    return true; // response owned by SSE handler
  }

  if (urlPath === '/api/persistent' && method === 'GET') {
    const data = readPersistent(palaceRoot);
    if (!data) {
      jsonResponse(res, 404, {
        error: 'persistent blackboard not found',
        expected_at: resolve(palaceRoot, PERSISTENT_REL),
      });
      return true;
    }
    jsonResponse(res, 200, data);
    return true;
  }

  if (urlPath === '/api/persistent' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    await handlePost(bodyText, resolve(palaceRoot, PERSISTENT_REL), res);
    return true;
  }

  return false;
}
