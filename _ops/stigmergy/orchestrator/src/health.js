// health.js — construct an approximate health block from Agent-tool usage data.
//
// The Agent tool returns `total_tokens` and `duration_ms` but does NOT split
// usage into input_tokens / output_tokens the way the raw Anthropic SDK does.
// So `context_pct` is approximated as total_tokens / MODEL_CONTEXT_LIMITS,
// which slightly overshoots the strict §3.3 definition. Every health block
// produced by this module carries `_orchestrator_metadata.dispatch_mode:
// "claude-code-subagent"` as a flag so future readers know the score is
// approximate (parallels Stage A's `_pilot_metadata.hand_run` provenance).

export const MODEL_CONTEXT_LIMITS = {
  'claude-opus-4-7': 200000,
  'claude-opus-4-7[1m]': 1000000,
  'claude-opus-4-6': 200000,
  'claude-sonnet-4-6': 200000,
  'claude-sonnet-4-5': 200000,
  'claude-haiku-4-5-20251001': 200000,
  'claude-haiku-4-5': 200000,
  'sonnet': 200000,
  'opus': 200000,
  'haiku': 200000,
};

const DISPATCH_MODE = 'claude-code-subagent';

/**
 * Compute the §3.3 score (`green` | `yellow` | `red`) from a context_pct value
 * and discipline counters.
 */
export function scoreFor({ context_pct, duplicate_flags = 0, posting_discipline_violations = 0, max_tokens_hits = 0 }) {
  if (context_pct > 0.85 || duplicate_flags >= 2 || posting_discipline_violations >= 2 || max_tokens_hits >= 2) {
    return 'red';
  }
  if (context_pct >= 0.70 || duplicate_flags >= 1 || posting_discipline_violations >= 1 || max_tokens_hits >= 1) {
    return 'yellow';
  }
  return 'green';
}

/**
 * Build the §2.2 message-level `health` block from Agent-tool usage.
 *
 * The Agent tool yields, at minimum: `{ total_tokens, duration_ms, model }`
 * (the runtime adapter is responsible for collecting these). When the call
 * returns a `stop_reason` (e.g. `end_turn`, `max_tokens`, `tool_use`) it is
 * forwarded; otherwise the orchestrator-skill workflow infers `end_turn`.
 *
 * @param {object} usage
 * @param {number} usage.total_tokens — input + output combined
 * @param {string} usage.model — model identifier (must exist in MODEL_CONTEXT_LIMITS)
 * @param {string} [usage.stop_reason] — if known; defaults to "end_turn"
 * @param {number} [usage.iteration] — agent's current cycle number
 * @param {number} [usage.duplicate_flags]
 * @param {number} [usage.posting_discipline_violations]
 * @param {number} [usage.max_tokens_hits]
 */
export function buildHealthBlock(usage) {
  if (!usage || typeof usage !== 'object') {
    throw new Error('buildHealthBlock requires a usage object');
  }
  const total = usage.total_tokens;
  if (typeof total !== 'number' || total < 0 || !Number.isFinite(total)) {
    throw new Error(`buildHealthBlock: usage.total_tokens must be a non-negative finite number, got ${total}`);
  }
  if (typeof usage.model !== 'string' || usage.model.trim() === '') {
    throw new Error('buildHealthBlock: usage.model must be a non-empty string');
  }

  const limit = MODEL_CONTEXT_LIMITS[usage.model] ?? 200000;
  const context_pct = Math.max(0, Math.min(1, total / limit));
  const stop_reason = usage.stop_reason ?? 'end_turn';
  const iteration = Number.isInteger(usage.iteration) && usage.iteration >= 1 ? usage.iteration : 1;
  const duplicate_flags = usage.duplicate_flags ?? 0;
  const posting_discipline_violations = usage.posting_discipline_violations ?? 0;
  const max_tokens_hits = usage.max_tokens_hits ?? 0;

  const score = scoreFor({ context_pct, duplicate_flags, posting_discipline_violations, max_tokens_hits });

  return {
    context_pct,
    stop_reason,
    iteration,
    tokens_this_call: total,
    model: usage.model,
    score,
    _orchestrator_metadata: {
      dispatch_mode: DISPATCH_MODE,
      context_pct_provenance: 'approximated_from_total_tokens',
      note: 'Agent tool returns total_tokens (input+output combined); strict §3.3 expects input_tokens. context_pct is upper-bounded by this approximation.',
    },
  };
}
