// server/router.js — the dispatch order for the api/ endpoint families.
//
// Each family is `(ctx) => Promise<boolean>`: it returns true once it has owned
// the response for a matching route, false to let the next family try. No two
// families share a path prefix, so the order is for readability, not correctness
// — except sessions, whose dynamic /api/sessions/:id matcher is kept last so the
// exact routes win first.

import { persistentRoutes } from './api/persistent.js';
import { filesRoutes } from './api/files.js';
import { entriesRoutes } from './api/entries.js';
import { logRoutes } from './api/log.js';
import { workerRoutes } from './api/worker.js';
import { stewardsRoutes } from './api/stewards.js';
import { cardsRoutes } from './api/cards.js';
import { digestRoutes } from './api/digest.js';
import { entrySaveRoutes } from './api/entry-save.js';
import { entryAgentRoutes } from './api/entry-agent.js';
import { launchRoutes } from './api/launch.js';
import { lensRoutes } from './api/lens.js';
import { weaveRoutes } from './api/weave.js';
import { schedulerRoutes } from './api/scheduler.js';
import { sessionsRoutes } from './api/sessions.js';

const FAMILIES = [
  persistentRoutes,
  filesRoutes,
  entriesRoutes,
  logRoutes,
  workerRoutes,
  stewardsRoutes,
  cardsRoutes,
  digestRoutes,
  entrySaveRoutes,
  entryAgentRoutes,
  launchRoutes,
  lensRoutes,
  weaveRoutes,
  schedulerRoutes,
  sessionsRoutes,
];

/**
 * Try each endpoint family in order against the request context.
 * @param {object} ctx — { req, res, palaceRoot, urlPath, query, method, actuator, stewardLane, opts }
 * @returns {Promise<boolean>} true if a family owned the response.
 */
export async function dispatch(ctx) {
  for (const family of FAMILIES) {
    if (await family(ctx)) return true;
  }
  return false;
}
