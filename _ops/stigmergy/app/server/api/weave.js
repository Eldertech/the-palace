// server/api/weave.js — apply a granted Weave proposal.
//
//   POST /api/weave/apply  { apply, proposalId? }  -> execute the proposal's
//   structured `apply` op against the live entry, commit it, and post a
//   `weave_applied` PROOF to the WEAVE board. The human-grant IS the approval
//   (the QUEUE "grant & apply" click), so this writes canon through the enforced
//   honest-write path. See weave-apply.js for the guarantees + undo path.

import { join } from 'node:path';
import { jsonResponse, readBody, PERSISTENT_REL } from '../http.js';
import { applyWeaveProposal } from '../weave-apply.js';

export async function weaveRoutes(ctx) {
  const { req, res, urlPath, method, palaceRoot, opts } = ctx;
  if (method !== 'POST' || urlPath !== '/api/weave/apply') return false;

  const bodyText = await readBody(req, res);
  if (bodyText === null) return true; // 413 already sent
  let body;
  try { body = JSON.parse(bodyText); } catch (e) {
    jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
    return true;
  }

  const apply = body && body.apply;
  const proposalId = typeof body?.proposalId === 'string' ? body.proposalId : null;
  // opts.boardPath lets a test point the PROOF at a temp board; the live server
  // posts to the persistent blackboard at the palace root.
  const boardPath = opts.boardPath ? opts.boardPath : join(palaceRoot, PERSISTENT_REL);

  const run = opts.applyWeaveProposalImpl || applyWeaveProposal;
  const result = await run({ palaceRoot, boardPath, apply, proposalId });
  jsonResponse(res, result.ok ? 200 : (result.status || 400), result);
  return true;
}
