// server/api/projects.js — the PROJECTS deck endpoints.
//   GET /api/projects                  — every type:project entry as a row (+ worker status)
//   GET /api/projects/scroll?home=     — one project's scroll, Now zone regenerated live
//                                        (&write=1 also persists the regeneration)
//   PUT /api/projects/orders           — { home, orders } → write Standing Orders

import { jsonResponse, readBody } from '../http.js';
import { buildProjectRows, readScroll, writeStandingOrders } from '../projects.js';

export async function projectsRoutes(ctx) {
  const { req, res, palaceRoot, urlPath, query, method, stewardLane } = ctx;

  if (urlPath === '/api/projects' && method === 'GET') {
    try {
      jsonResponse(res, 200, {
        projects: buildProjectRows({ palaceRoot, stewardLane }),
        worker: stewardLane ? stewardLane.status() : null,
        ts: new Date().toISOString(),
      });
    } catch (err) {
      jsonResponse(res, 500, { error: `read projects failed: ${err.message}` });
    }
    return true;
  }

  if (urlPath === '/api/projects/scroll' && method === 'GET') {
    const home = (query.get('home') || '').trim();
    if (!home) { jsonResponse(res, 400, { error: 'missing ?home' }); return true; }
    try {
      const r = readScroll({ palaceRoot, home, write: query.get('write') === '1' });
      if (!r) { jsonResponse(res, 404, { error: 'project not found', home }); return true; }
      jsonResponse(res, 200, r);
    } catch (err) {
      jsonResponse(res, 500, { error: `read scroll failed: ${err.message}` });
    }
    return true;
  }

  if (urlPath === '/api/projects/orders' && (method === 'PUT' || method === 'POST')) {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true;
    let body;
    try { body = JSON.parse(bodyText); } catch (e) {
      jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
      return true;
    }
    const home = body && typeof body.home === 'string' ? body.home.trim() : '';
    if (!home) { jsonResponse(res, 400, { error: 'missing home' }); return true; }
    if (body.orders != null && typeof body.orders !== 'string') { jsonResponse(res, 400, { error: 'orders must be a string' }); return true; }
    try {
      const r = writeStandingOrders({ palaceRoot, home, orders: body.orders || '' });
      if (r && r.error) { jsonResponse(res, r.error === 'entry-file-not-found' ? 404 : 422, r); return true; }
      jsonResponse(res, 200, r);
    } catch (err) {
      jsonResponse(res, 500, { error: `write orders failed: ${err.message}` });
    }
    return true;
  }

  return false;
}
