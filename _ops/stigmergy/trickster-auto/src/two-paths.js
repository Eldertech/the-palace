// two-paths.js — Stage F, Phase 0: candidate selection for "Two Paths".
//
// Two Paths is the decide-after-doing mode: for a fork the steward cannot
// resolve alone or whose options are sensory, the orchestrator runs BOTH options
// to a finished deliverable and lets Loudon pick from completed work. This module
// is the SELECTION layer — it reads the Stage E evaluator output and decides,
// per escalation, whether the fork is eligible and which two concrete options are
// the paths to build. It does NOT dispatch, render, or merge.
//
// Eligibility (Loudon's calls, 2026-05-29):
//   TRIGGER — two categories only:
//     (a) rec=n  — the steward gave options but NO recommendation (genuinely
//                  torn); it escalated by default rather than carrying a pick.
//     (b) sensory — the fork is sensory (audition gate fired: gateKind ===
//                  'audition'); its paths produce a sensory deliverable.
//   SHAPE — build-both only. A fork whose options are a VERDICT on a single
//     already-rendered deliverable (approve / adjust / reject) is NOT two things
//     to build — it stays single-path Stage E triage. We detect a verdict fork
//     as "an approve-class option AND a reject-class option both present" and
//     exclude it. Everything else with ≥2 concrete (non-meta) options is eligible.
//
// Like the audition gate, the keyword classes below are a TUNABLE safety net, not
// request reasoning. Bias: over-EXCLUDE (a missed candidate merely escalates the
// normal Stage E way) over over-INCLUDE (forking 2× compute on a fork that isn't
// really two buildable paths). Loudon validates the eligible set in shadow.

// ── Option classification ─────────────────────────────────────────────────────

// Meta options: "let me decide / defer / redirect / hold" — not a thing to build.
// Matched on the FIRST id token, plus the YOU-* family (YOU-DEFINE, YOU-DECIDE).
export const META_FIRST_TOKENS = new Set([
  'YOU', 'DEFER', 'HOLD', 'REDIRECT', 'WAIT', 'SKIP', 'NONE', 'OTHER', 'LATER', 'PAUSE',
]);

// Approve-class: a verdict that ACCEPTS the existing deliverable.
export const APPROVE_TOKENS = new Set([
  'APPROVE', 'ACCEPT', 'GREENLIGHT', 'SHIP', 'COMMIT', 'CONFIRM', 'PROCEED',
  'GRANT', 'KEEP', 'YES', 'GO', 'VERIFIED', 'VERIFY', 'OK',
]);

// Reject-class: a verdict that REFUSES the existing deliverable.
export const REJECT_TOKENS = new Set([
  'REJECT', 'NO', 'SCRAP', 'ABANDON', 'DROP', 'KILL', 'WRONG', 'COULDNT',
  'CANT', 'BROKEN', 'FAIL', 'RESTART', 'DISCARD',
]);

/** Split an option id into uppercased tokens on -, _, and whitespace. */
function idTokens(id) {
  if (typeof id !== 'string') return [];
  return id.toUpperCase().split(/[-_\s]+/).filter(Boolean);
}

/**
 * Classify a single option by its id (label is not consulted — the id is the
 * machine-stable signal, mirroring how the audition gate judges the option's
 * identity, not the surrounding prose).
 * @returns {'meta'|'approve'|'reject'|'concrete'}
 */
export function classifyOption(option) {
  const id = option && typeof option === 'object' ? option.id : option;
  const tokens = idTokens(id);
  if (tokens.length === 0) return 'concrete';

  if (META_FIRST_TOKENS.has(tokens[0])) return 'meta';
  // The full set is scanned for verdict tokens — "ARCHITECTURE-VERIFIED" ends in
  // an approve token; "COULDNT-RUN-IT" begins with a reject token.
  if (tokens.some((t) => REJECT_TOKENS.has(t))) return 'reject';
  if (tokens.some((t) => APPROVE_TOKENS.has(t))) return 'approve';
  return 'concrete';
}

// ── Category ───────────────────────────────────────────────────────────────────

/**
 * Which trigger category (if any) this escalation belongs to.
 * @returns {'sensory'|'rec_n'|null}
 */
export function triggerCategory(request, verdict) {
  const sensory = verdict && verdict.hardGate === true && verdict.gateKind === 'audition';
  if (sensory) return 'sensory';
  const escalated = verdict && verdict.verb === 'escalate';
  const hasOptions = Array.isArray(request && request.options) && request.options.length > 0;
  const noRec = !(request && request.steward_recommendation);
  if (escalated && hasOptions && noRec) return 'rec_n';
  return null;
}

// ── Selection ────────────────────────────────────────────────────────────────

/**
 * Decide whether a single evaluated escalation is a Two Paths candidate and, if
 * so, which two options are the paths to build.
 *
 * @param {{request: object, verdict: object}} entry — one evaluateAll() result.
 * @returns {{
 *   eligible: boolean,
 *   category: 'sensory'|'rec_n'|null,
 *   shape: 'build-both'|null,
 *   options: Array<{id:string,label:string}>,   // exactly 2 when eligible, else []
 *   reason: string,
 *   borderline: boolean,                          // selected an approve/audition option as a path
 * }}
 */
export function selectTwoPaths(entry) {
  const request = (entry && entry.request) || {};
  const verdict = (entry && entry.verdict) || {};

  const category = triggerCategory(request, verdict);
  if (!category) {
    return { eligible: false, category: null, shape: null, options: [], reason: 'not a Two Paths trigger (needs a sensory gate or a rec=n directional fork)', borderline: false };
  }

  const options = Array.isArray(request.options) ? request.options : [];
  const classes = options.map((o) => ({ opt: o, cls: classifyOption(o) }));

  const hasApprove = classes.some((c) => c.cls === 'approve');
  const hasReject = classes.some((c) => c.cls === 'reject');
  if (hasApprove && hasReject) {
    return { eligible: false, category, shape: null, options: [], reason: 'verdict fork (approve/adjust/reject on one existing deliverable) — not two things to build; stays single-path triage', borderline: false };
  }

  // Selection pool, in priority order:
  //   1. pure concrete (not meta, not a verdict token) — the genuine builds.
  //   2. fall back to any non-meta option — the "greenlight variant A vs B" case,
  //      where every option is approve-flavoured but each names a distinct build.
  const pure = classes.filter((c) => c.cls === 'concrete').map((c) => c.opt);
  const nonMeta = classes.filter((c) => c.cls !== 'meta').map((c) => c.opt);
  const pool = pure.length >= 2 ? pure : nonMeta;

  if (pool.length < 2) {
    return { eligible: false, category, shape: null, options: [], reason: `only ${pool.length} concrete option(s) after excluding meta — too few to build two paths`, borderline: false };
  }

  // The two paths: the steward's first two concrete alternatives, in declared
  // order. "Two most distinct" is approximated by declared order (stewards tend
  // to list their genuine alternatives first, meta options last); distinctness is
  // not computed semantically here.
  const picked = pool.slice(0, 2).map((o) => ({ id: o.id, label: o.label }));
  const borderline = pure.length < 2; // had to dip into approve/audition-flavoured options

  return {
    eligible: true,
    category,
    shape: 'build-both',
    options: picked,
    reason: category === 'sensory'
      ? 'sensory fork with ≥2 buildable paths — build both, audition comparatively'
      : 'rec=n directional fork (steward torn, no recommendation) with ≥2 buildable paths',
    borderline,
  };
}
