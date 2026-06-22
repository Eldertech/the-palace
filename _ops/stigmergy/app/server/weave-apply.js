// weave-apply.js — the executor that APPLIES a granted Weave proposal.
//
// The QUEUE already displays + grants `vector_proposal` / `weave_flag`, but a
// grant was a dead-end: nothing made the proposed change. This closes the loop.
// When a proposal carries a structured `payload.apply` op (see weave-apply-op.js)
// and the operator clicks "grant & apply", this writes the change to the LIVE
// entry through the Companion's enforced honest-write path (armedWriteEntry) and
// posts a `weave_applied` PROOF to the WEAVE board carrying the commit hash.
//
// Guarantees inherited from armedWriteEntry / commitSelected: YAML-safe (only
// the forward_vector line is touched), explicit-pathspec commit (never
// `git add -A`), stale locks cleared, and an honest undo (git revert) available.
// `trickster: true` lets it write a canon entry — the operator's grant IS the
// standing consent, the same rationale as the Trickster commit; the edit is
// branded Palace-Author: weave so the provenance stays visible in the LOG.

import { relative } from 'node:path';
import { armedWriteEntry } from './armed-write.js';
import { findEntryFile } from '../../orchestrator/src/entry-paths.js';
import { appendMessage } from '@stigmergy/core/blackboard';
import { validateMessage } from '@stigmergy/core/schema';
import { normalizeApplyOp, describeApplyOp } from '../src/lib/weave-apply-op.js';

/**
 * Build the §2.2 PROOF a weave-applied edit posts once committed. The commit
 * hash is the proof the change is real. Pure; validated before append.
 */
export function buildWeaveAppliedProof({ entry, op, commit, subject, vectorChange, linkChange, typeChange, stageChange, labelChange, proposalId = null, model, ts, id }) {
  const stamp = ts || new Date().toISOString();
  return {
    schema_version: '1.0',
    id: id || `weave-applied-${commit || 'pending'}`,
    ts: stamp,
    session_id: 'weave-executor',
    from: 'Weave Executor',
    to: '*',
    type: 'PROOF',
    board: 'WEAVE',
    // Thread the PROOF to the proposal it applied, for traceability in the LOG.
    ...(proposalId ? { re: proposalId } : {}),
    health: {
      score: 'green',
      context_pct: 0,
      stop_reason: 'human_decision',
      iteration: 1,
      tokens_this_call: 0,
      model: model || 'loudon-trickster',
    },
    payload: {
      kind: 'weave_applied',
      entry,
      op: op.op,
      commit,
      summary: subject || describeApplyOp(op),
      status: 'committed',
      ...(proposalId ? { proposal_id: proposalId } : {}),
      // A forward-vector change is never silent — carry from->to (the standing
      // rule). Present only for ops that move the vector.
      ...(vectorChange ? { vector_change: vectorChange } : {}),
      // The typed link that was added, for an add-link op.
      ...(linkChange ? { link_change: linkChange } : {}),
      // The type change (from->to), for a set-type op (e.g. concept->hub). Never
      // silent — same standing rule as vector_change.
      ...(typeChange ? { type_change: typeChange } : {}),
      // The stage change (from->to), for a set-stage op (e.g. seed->growing).
      // Never silent — same standing rule.
      ...(stageChange ? { stage_change: stageChange } : {}),
      // The label added to an existing link, for a set-label op ({target,type,label}).
      ...(labelChange ? { label_change: labelChange } : {}),
      author: 'weave',
    },
  };
}

// Default board append: validate against §2.2, then append (the only sanctioned
// write path; a shell write is blocked by the classifier). Returns whether it
// landed so the caller can report an honest "applied but PROOF not posted".
function defaultAppend(boardPath) {
  return (msg) => {
    if (!boardPath) return false;
    if (!validateMessage(msg).valid) return false;
    appendMessage(boardPath, msg);
    return true;
  };
}

/**
 * Apply one granted Weave proposal's `apply` op to its entry and commit it,
 * then post a `weave_applied` PROOF. Never throws; returns a structured result.
 *
 * @param {object} args
 * @param {string} args.palaceRoot
 * @param {string} [args.boardPath] — the persistent blackboard to post the PROOF to
 * @param {*} args.apply            — the proposal's payload.apply (validated here)
 * @param {string} [args.proposalId]— the proposal message id (threaded onto the PROOF)
 * @param {string} [args.author]    — Palace-Author (default 'weave')
 * @param {string} [args.model]
 * @param {string} [args.ts]
 * @param {string} [args.id]
 * @param {Function} [args.appendImpl]     — test seam for the board append
 * @param {Function} [args.armedWriteImpl] — test seam for the write+commit
 * @returns {Promise<{ok, status?, error?, commit?, subject?, entry?, op?, vectorChange?, proofPosted?, proof?}>}
 */
export async function applyWeaveProposal({
  palaceRoot, boardPath, apply, proposalId = null,
  author = 'weave', model, ts, id, appendImpl, armedWriteImpl,
}) {
  if (!palaceRoot) return { ok: false, status: 500, error: 'no palace root configured' };

  const op = normalizeApplyOp(apply);
  if (!op) return { ok: false, status: 422, error: 'this proposal carries no applicable change' };

  // Resolve the entry title to a palace-relative path (flat Obsidian namespace).
  const abs = findEntryFile(palaceRoot, op.entry);
  if (!abs) return { ok: false, status: 404, error: `entry not found: ${op.entry}` };
  const relPath = relative(palaceRoot, abs);

  // Map the apply op onto an armed-write op.
  const writeOp = op.op === 'set-vector'
    ? { op: 'set-vector', text: op.text }
    : op.op === 'add-link'
      ? { op: 'add-link', target: op.target, type: op.type, ...(op.label ? { label: op.label } : {}) }
      : op.op === 'set-type'
        ? { op: 'set-type', type: op.type }
        : op.op === 'set-stage'
          ? { op: 'set-stage', stage: op.stage }
          : op.op === 'set-label'
            ? { op: 'set-label', target: op.target, type: op.type, label: op.label }
            : null;
  if (!writeOp) return { ok: false, status: 422, error: `cannot apply op "${op.op}" yet` };

  const write = armedWriteImpl || armedWriteEntry;
  const result = await write({
    repoRoot: palaceRoot,
    relPath,
    op: writeOp,
    kind: 'weave',
    summary: `weave-applied: ${describeApplyOp(op)}`,
    verify: 'verified',
    author,
    trickster: true, // the grant is the consent; canon writable, path-safety kept
  });
  if (!result.ok) {
    return { ok: false, status: result.status || 422, error: result.error || 'apply failed', message: result.message };
  }

  const proof = buildWeaveAppliedProof({
    entry: op.entry, op, commit: result.shortHash, subject: result.subject,
    vectorChange: result.vectorChange, linkChange: result.linkChange, typeChange: result.typeChange, stageChange: result.stageChange, labelChange: result.labelChange, proposalId, model, ts, id,
  });
  let proofPosted = false;
  try { proofPosted = (appendImpl || defaultAppend(boardPath))(proof); } catch { proofPosted = false; }

  return {
    ok: true,
    commit: result.shortHash,
    subject: result.subject,
    entry: op.entry,
    op: op.op,
    vectorChange: result.vectorChange || null,
    linkChange: result.linkChange || null,
    typeChange: result.typeChange || null,
    stageChange: result.stageChange || null,
    labelChange: result.labelChange || null,
    proofPosted,
    proof,
  };
}
