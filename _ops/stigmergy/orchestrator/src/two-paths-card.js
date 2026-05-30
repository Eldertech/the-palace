// two-paths-card.js — Stage F, Phase 3: emit the rich-content `choice` card.
//
// Two Paths PRODUCES a choice card; it does NOT build a comparison surface. The
// rich-content v0.4 `choice` type (app/src/lib/richcontent.js choiceFromPayload +
// components/ChoiceBlock.jsx) already renders two options side-by-side, each with
// its inline artifact, and posts a §2.2 choice_response REPLY on pick. This
// module packages a finished reconciliation object into that card and nothing
// more.
//
// The card lands on the TRICKSTER board (Loudon's call, 2026-05-29 — keep every
// "Loudon must choose" surface in one place). `from` is the steward page so the
// choice_response REPLY (buildChoiceResponse sets to:card.from, re:card.id)
// routes back to the fork; `payload.request_id` lets Phase 4 map the winning
// option id → its branch worktree.

import { appendMessage } from './append.js';
import { validateForPosting } from './posting.js';

export const TWO_PATHS_CARD_BOARD = 'TRICKSTER';

// Path-2 health stub written by the orchestrator for engine-emitted messages.
// Full block so it validates under both Path-1 and Path-2 rules.
function healthStub() {
  return {
    context_pct: 0,
    stop_reason: 'two_paths_ready',
    iteration: 1,
    tokens_this_call: 0,
    model: 'loudon-two-paths',
    score: 'green',
    _orchestrator_metadata: { dispatch_mode: 'claude-code-subagent' },
  };
}

/**
 * Build a §2.2 `choice` card from a ready reconciliation object.
 *
 * @param {object} opts
 * @param {object} opts.reconciliation — from reconcileTwoPaths(); must be ready_for_choice
 * @param {{request_id, from, headline}} opts.fork — the originating fork
 * @param {string} [opts.prompt] — overrides the default chooser prompt
 * @param {string} [opts.id] — message id (inject for determinism; else generated)
 * @param {string} [opts.ts] — ISO 8601 w/ tz (inject for determinism; else now)
 * @param {string} [opts.session_id]
 * @returns {object} the choice card message (a complete §2.2 envelope)
 */
export function buildTwoPathsChoiceCard({ reconciliation, fork, prompt, id, ts, session_id }) {
  if (!reconciliation || !reconciliation.ready_for_choice) {
    throw new Error('buildTwoPathsChoiceCard: reconciliation is not ready_for_choice — do not emit a card for an incomplete or fell-back fork');
  }
  const built = reconciliation.built || [];
  if (built.length !== 2) {
    throw new Error(`buildTwoPathsChoiceCard: expected exactly 2 built branches, got ${built.length}`);
  }

  const request_id = reconciliation.request_id;
  const options = built.map((b) => ({
    id: b.option_id,
    label: b.label || b.option_id,
    artifact_path: b.artifact_path,
    caption: b.summary || null,
  }));

  const cardId = id || `two-paths-${request_id}-${genSuffix()}`;
  const cardTs = ts || new Date().toISOString();

  return {
    schema_version: '1.0',
    id: cardId,
    ts: cardTs,
    session_id: session_id || `two-paths-${request_id}`,
    from: fork.from,                 // the steward page → response routes back to it
    to: 'TRICKSTER',
    type: 'BROADCAST',
    board: TWO_PATHS_CARD_BOARD,
    health: healthStub(),
    payload: {
      kind: 'choice',
      choice_mode: 'pick',           // Two Paths is always a single pick, never rank
      request_id,                    // Phase 4 maps choice → branch worktree by (request_id, option_id)
      prompt: prompt || `Two paths were built for "${fork.headline}". Both are finished — pick the one that reads best.`,
      content: 'Each option carries its branch deliverable. Picking merges that branch; the other is kept as an alternative.',
      options,
    },
  };
}

function genSuffix() {
  // Non-deterministic by design for live posts; tests inject `id` for determinism.
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Build AND post the card to the board via the validated append. Validates with
 * the canonical posting discipline first; throws (without writing) on any §2.2
 * or discipline error. Live-path helper — tests can pass a temp boardPath.
 *
 * @returns {{ card: object, posted: boolean }}
 */
export function emitTwoPathsChoiceCard({ reconciliation, fork, boardPath, prompt, id, ts, session_id }) {
  const card = buildTwoPathsChoiceCard({ reconciliation, fork, prompt, id, ts, session_id });
  const check = validateForPosting(card);
  if (!check.valid) {
    const detail = check.errors.map((e) => `${e.path || '(root)'}: ${e.message}`).join('; ');
    throw new Error(`two-paths choice card failed §2.2/posting validation: ${detail}`);
  }
  appendMessage(boardPath, card);
  return { card, posted: true };
}
