// server/api/weave.js — the Weave's write surface (proposals in, applies out).
//
//   POST /api/weave/apply        { apply, proposalId? }  -> execute a granted
//     proposal's structured `apply` op against the live entry, commit it, and
//     post a `weave_applied` PROOF. The human-grant IS the approval (the QUEUE
//     "grant & apply" click). See weave-apply.js for the guarantees + undo path.
//
//   POST /api/weave/emit-unsung  { dryRun?, limit? }     -> run the unsung-path
//     audit and surface honest counts; with dryRun:false, seed promote_unsung
//     proposals onto the WEAVE board. The UI counterpart to the CLI runner —
//     the audit from the terminal, not a shell. See weave-emit.js. DRY-RUN by
//     default: a write happens ONLY on an explicit dryRun:false.

import { join } from 'node:path';
import { jsonResponse, readBody, PERSISTENT_REL } from '../http.js';
import { applyWeaveProposal } from '../weave-apply.js';
import { runUnsungEmission, runHubEmission, runVectorTuningEmission, runStageEmission, runLabelEmission } from '../weave-emit.js';

export async function weaveRoutes(ctx) {
  const { urlPath, method } = ctx;
  if (method !== 'POST') return false;
  if (urlPath === '/api/weave/apply') return handleApply(ctx);
  if (urlPath === '/api/weave/emit-unsung') return handleEmitUnsung(ctx);
  if (urlPath === '/api/weave/emit-hub') return handleEmitHub(ctx);
  if (urlPath === '/api/weave/emit-vector-tuning') return handleEmitVectorTuning(ctx);
  if (urlPath === '/api/weave/emit-stage') return handleEmitStage(ctx);
  if (urlPath === '/api/weave/emit-label') return handleEmitLabel(ctx);
  return false;
}

// Parse the POST body as JSON, owning the response on malformed input. Returns
// the parsed object, or null when the body was bad / oversized (response sent).
async function readJsonBody(req, res, { allowEmpty = false } = {}) {
  const bodyText = await readBody(req, res);
  if (bodyText === null) return null; // 413 already sent
  if (allowEmpty && bodyText.trim() === '') return {};
  try { return JSON.parse(bodyText); } catch (e) {
    jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
    return null;
  }
}

async function handleApply(ctx) {
  const { req, res, palaceRoot, opts } = ctx;
  const body = await readJsonBody(req, res);
  if (body === null) return true;

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

async function handleEmitUnsung(ctx) {
  const { req, res, palaceRoot, opts } = ctx;
  // The body is optional: a bare POST runs a dry-run audit with the defaults.
  const body = await readJsonBody(req, res, { allowEmpty: true });
  if (body === null) return true;

  // DRY-RUN unless the caller explicitly asks to post. A write needs intent.
  const dryRun = body.dryRun !== false;
  const limit = Number.isFinite(body.limit) ? body.limit : 8;
  const boardPath = opts.boardPath ? opts.boardPath : join(palaceRoot, PERSISTENT_REL);

  const run = opts.runUnsungEmissionImpl || runUnsungEmission;
  const result = await run({ palaceRoot, boardPath, dryRun, limit });
  jsonResponse(res, result.ok ? 200 : (result.status || 400), result);
  return true;
}

async function handleEmitHub(ctx) {
  const { req, res, palaceRoot, opts } = ctx;
  const body = await readJsonBody(req, res, { allowEmpty: true });
  if (body === null) return true;

  const dryRun = body.dryRun !== false; // DRY-RUN unless explicitly asked to post
  const limit = Number.isFinite(body.limit) ? body.limit : 8;
  const threshold = Number.isFinite(body.threshold) ? body.threshold : 5;
  const boardPath = opts.boardPath ? opts.boardPath : join(palaceRoot, PERSISTENT_REL);

  const run = opts.runHubEmissionImpl || runHubEmission;
  const result = await run({ palaceRoot, boardPath, dryRun, limit, threshold });
  jsonResponse(res, result.ok ? 200 : (result.status || 400), result);
  return true;
}

async function handleEmitVectorTuning(ctx) {
  const { req, res, palaceRoot, opts } = ctx;
  const body = await readJsonBody(req, res, { allowEmpty: true });
  if (body === null) return true;

  // DRY-RUN unless explicitly asked to generate + post. The dry run is a cheap
  // scan (no model call); the live run generates per candidate, so the default
  // matters more here than for the detection audits.
  const dryRun = body.dryRun !== false;
  const limit = Number.isFinite(body.limit) ? body.limit : 3;
  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;
  const boardPath = opts.boardPath ? opts.boardPath : join(palaceRoot, PERSISTENT_REL);

  const run = opts.runVectorTuningEmissionImpl || runVectorTuningEmission;
  const result = await run({ palaceRoot, boardPath, dryRun, limit, model });
  jsonResponse(res, result.ok ? 200 : (result.status || 400), result);
  return true;
}

async function handleEmitStage(ctx) {
  const { req, res, palaceRoot, opts } = ctx;
  const body = await readJsonBody(req, res, { allowEmpty: true });
  if (body === null) return true;

  const dryRun = body.dryRun !== false; // DRY-RUN unless explicitly asked to post
  const limit = Number.isFinite(body.limit) ? body.limit : 8;
  const boardPath = opts.boardPath ? opts.boardPath : join(palaceRoot, PERSISTENT_REL);

  const run = opts.runStageEmissionImpl || runStageEmission;
  const result = await run({ palaceRoot, boardPath, dryRun, limit });
  jsonResponse(res, result.ok ? 200 : (result.status || 400), result);
  return true;
}

async function handleEmitLabel(ctx) {
  const { req, res, palaceRoot, opts } = ctx;
  const body = await readJsonBody(req, res, { allowEmpty: true });
  if (body === null) return true;

  // DRY-RUN unless explicitly asked to generate + post. Like vector-tuning, the
  // dry run is a cheap scan; the live run generates a label per candidate.
  const dryRun = body.dryRun !== false;
  const limit = Number.isFinite(body.limit) ? body.limit : 3;
  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;
  const boardPath = opts.boardPath ? opts.boardPath : join(palaceRoot, PERSISTENT_REL);

  const run = opts.runLabelEmissionImpl || runLabelEmission;
  const result = await run({ palaceRoot, boardPath, dryRun, limit, model });
  jsonResponse(res, result.ok ? 200 : (result.status || 400), result);
  return true;
}
