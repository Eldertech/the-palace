// decide.js — Phase 3. The gated write path.
//
// Turns auto-grant / auto-deny verdicts into §2.2-valid RESOURCE_GRANT /
// RESOURCE_DENY messages and posts them back through the EXISTING validated
// append (orchestrator src/posting.js validateForPosting → src/append.js
// appendMessage). It does NOT invent a third write path — the board's one
// schema-enforcement boundary is load-bearing (Decisions table).
//
// Provenance integrity (Decisions table): every auto-decision is BOTH
//   from: "TRICKSTER (auto)"        (visibly distinct identity on the board)
//   payload.decided_by: "auto"      (machine-readable marker)
// so Loudon can always tell what the machine decided from what he decided.
//
// This module is only invoked in --live mode. In --shadow nothing is built or
// posted. The audition/irreversible gate has already run in evaluate(); an
// escalate verdict never reaches here.

import { appendMessage } from '../../orchestrator/src/append.js';
import { validateForPosting } from '../../orchestrator/src/posting.js';

export const AUTO_TRICKSTER_FROM = 'TRICKSTER (auto)';
export const AUTO_MODEL = 'trickster-auto-v0.1';

/**
 * Build a §2.2 RESOURCE_GRANT / RESOURCE_DENY message for one verdict.
 * @param {object} request — a parseRequest() record
 * @param {object} verdict — an evaluate() result (verb auto-grant | auto-deny)
 * @param {{ now: string }} ctx
 */
export function buildDecisionMessage(request, verdict, ctx) {
  const now = ctx.now;
  const isGrant = verdict.verb === 'auto-grant';
  const session_id = request.session_id || `trickster-auto-${(now || '').slice(0, 10) || 'session'}`;

  const health = {
    score: 'green',
    model: AUTO_MODEL,
    // Path 2 marker → validator relaxes the token/context fields (which an
    // automated decision genuinely does not have).
    _orchestrator_metadata: { dispatch_mode: 'claude-code-subagent', decided_by: 'auto' },
  };

  const common = {
    schema_version: '1.0',
    id: `auto-resp-${request.request_id}`,
    ts: now,
    session_id,
    from: AUTO_TRICKSTER_FROM,
    to: request.from || '*',
    board: 'TRICKSTER',
    re: request.request_id,
    health,
  };

  if (isGrant) {
    const opt = verdict.grantOption || null;
    return {
      ...common,
      type: 'RESOURCE_GRANT',
      payload: {
        granted: true,
        decided_by: 'auto',
        rule_id: verdict.ruleId,
        option_id: opt ? opt.id : null,
        option_label: opt ? opt.label : null,
        notes: `Auto-granted by the Automated Trickster (rule: ${verdict.ruleId}).${verdict.rationale ? ' ' + verdict.rationale : ''}`,
      },
    };
  }

  return {
    ...common,
    type: 'RESOURCE_DENY',
    payload: {
      granted: false,
      decided_by: 'auto',
      rule_id: verdict.ruleId,
      reason: verdict.denyReason || 'Auto-denied by ruleset.',
      notes: `Auto-denied by the Automated Trickster (rule: ${verdict.ruleId}).`,
    },
  };
}

/**
 * Post all auto-grant / auto-deny decisions to the board. Escalations are
 * skipped. Throws (before any further writes) if a message fails the strict
 * §2.2 + posting-discipline check — a broken decision must never reach the board.
 *
 * @param {Array<{request:object, verdict:object}>} results
 * @param {{ boardPath: string, now: string }} ctx
 * @returns {Array<object>} the messages posted
 */
export function postDecisions(results, ctx) {
  const posted = [];
  for (const { request, verdict } of results) {
    if (verdict.verb !== 'auto-grant' && verdict.verb !== 'auto-deny') continue;
    const msg = buildDecisionMessage(request, verdict, ctx);
    const check = validateForPosting(msg);
    if (!check.valid) {
      throw new Error(
        `refusing to post invalid ${verdict.verb} for ${request.request_id}: ` +
        JSON.stringify(check.errors),
      );
    }
    appendMessage(ctx.boardPath, msg);
    posted.push(msg);
  }
  return posted;
}
