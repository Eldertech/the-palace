// health.js — build the SCHEMA §9 message-level `health` block.
//
// Path 2 (claude-code-subagent dispatch) is what this orchestrator does, and
// it does not have the input_tokens breakdown the Path-1 design originally
// assumed. The Agent tool returns total_tokens (input+output combined) and
// per-turn cache stats — useful for cost telemetry but not for the strict
// per-call usage figure context_pct needs.
//
// Per the Palace Orchestrator entry (Definitions of record → dual-path
// health), Path 2 stamps a minimal stub: { score: "green", model,
// _orchestrator_metadata }. The validator
// recognises the dispatch_mode marker and relaxes the other field
// requirements. The score is a sentinel — real escalation (yellow/red)
// requires Path 1's authoritative input_tokens-from-API metric.
//
// If a future runtime exposes input_tokens directly, swap buildHealthBlock
// for a Path-1 implementation and the validator will start requiring the
// full set again. The stub keeps the surface contract intact.

const DISPATCH_MODE = 'claude-code-subagent';

/**
 * Score thresholds are kept for the day Path 1 lands. They are unused by the
 * Path 2 stub (which always stamps "green").
 *
 * @param {object} input
 * @param {number} input.context_pct
 * @param {number} [input.duplicate_flags]
 * @param {number} [input.posting_discipline_violations]
 * @param {number} [input.max_tokens_hits]
 * @returns {'green'|'yellow'|'red'}
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
 * Build the Path 2 stub `health` block.
 *
 * Required:  usage.model
 * Optional:  usage.note   (free-text reason / context for this dispatch)
 *
 * All other usage fields the caller passes (total_tokens, iteration, etc.)
 * are ignored — they were heuristics, not authoritative signal, and stamping
 * approximate numbers as if they were authoritative is exactly the trap
 * Path 2 mode exists to avoid.
 *
 * @param {object} usage
 * @returns {object} §2.2-conformant Path-2 health block
 */
export function buildHealthBlock(usage) {
  if (!usage || typeof usage !== 'object') {
    throw new Error('buildHealthBlock requires a usage object');
  }
  if (typeof usage.model !== 'string' || usage.model.trim() === '') {
    throw new Error('buildHealthBlock: usage.model must be a non-empty string');
  }

  const note = typeof usage.note === 'string' && usage.note.trim() !== ''
    ? usage.note
    : 'Path 2 (claude-code-subagent) dispatch — token-level metrics not authoritatively tracked; see the Palace Orchestrator entry (Definitions of record).';

  return {
    score: 'green',
    model: usage.model,
    _orchestrator_metadata: {
      dispatch_mode: DISPATCH_MODE,
      note,
    },
  };
}
