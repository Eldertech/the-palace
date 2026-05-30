// digest.js — Phase 2. The palace's voice, speaking once, in priority order.
//
// Consolidates everything the evaluator ESCALATED into a single ranked digest,
// ordered by how far out of phase each request is — using the disharmony
// vocabulary of [[Palace Conatus]]. This is the consolidation that is the whole
// point of Stage E: not seventeen pings, but one ranked view (Palace Conatus §
// "When It Cannot Self-Correct, It Tells Loudon").
//
// PURE given its inputs (the caller supplies generatedAt; no clock here) so the
// digest renders deterministically from a fixed board — required by the Phase 2
// verify gate.
//
// Ranking tiers (decision table: "blocking auditions first, then stalls, then
// routine forks"), each tied to a Palace Conatus disharmony signature:
//   1  blocking audition       — stranded conatus + sensory gate: a fruiting
//                                deliverable stalled on the human's ear.
//   2  blocking stall          — a steward suspended on a decision it cannot
//                                make alone (resource starvation of attention).
//   3  non-blocking audition   — sensory verification pending; needs an ear,
//                                but the steward is not suspended.
//   4  routine directional fork— the steward re-finding its forward vector;
//                                the vector is the engine that keeps it speaking.
// Within a tier: oldest ts first (longest out of phase), then request_id.

import { selectTwoPaths } from './two-paths.js';

const TIER_META = {
  1: { key: 'blocking_audition', label: 'Blocking audition', signature: 'stranded conatus + sensory gate — a deliverable is fruiting but stalled on your ear' },
  2: { key: 'blocking_stall', label: 'Blocking stall', signature: 'stalled thread — a steward is suspended on a decision it cannot make alone' },
  3: { key: 'nonblocking_audition', label: 'Audition (non-blocking)', signature: 'sensory verification pending — needs an ear, but the steward is not suspended' },
  4: { key: 'routine_fork', label: 'Routine directional fork', signature: 'routine fork — a steward re-finding its forward vector' },
};

function tierOf(request, verdict) {
  const isAudition = verdict.hardGate === true && verdict.gateKind === 'audition';
  const blocking = request.blocking === true;
  if (isAudition && blocking) return 1;
  if (!isAudition && blocking) return 2;
  if (isAudition && !blocking) return 3;
  return 4;
}

/** One-line headline from the most human field available. */
function headlineOf(request) {
  const pick = request.decision_topic || request.subject
    || (request.rationale ? request.rationale.split(/(?<=[.!?])\s/)[0] : null)
    || request.resource
    || '(no description)';
  const s = String(pick).trim().replace(/\s+/g, ' ');
  return s.length > 160 ? `${s.slice(0, 157)}…` : s;
}

function optionsSummary(request) {
  return (request.options || []).map((o) => o.id).filter(Boolean);
}

// Stable sort comparator within the ranked list.
function compareEscalations(a, b) {
  if (a.tier !== b.tier) return a.tier - b.tier;
  // oldest first (string ISO compare is chronological for same-format ts)
  const at = a.age_ts || '';
  const bt = b.age_ts || '';
  if (at !== bt) return at < bt ? -1 : 1;
  return (a.request_id || '').localeCompare(b.request_id || '');
}

/**
 * Build the digest data object from evaluator results.
 *
 * @param {Array<{request: object, verdict: object}>} results — from evaluateAll
 * @param {{ mode?: string, generatedAt?: string, board?: string }} [meta]
 */
export function buildDigest(results, meta = {}) {
  const escalations = [];
  const autoDecisions = [];
  const counts = { pending: results.length, escalate: 0, auto_grant: 0, auto_deny: 0, two_paths_eligible: 0 };

  for (const { request, verdict } of results) {
    if (verdict.verb === 'escalate') {
      counts.escalate += 1;
      const tier = tierOf(request, verdict);
      // Stage F: is this escalation a Two Paths candidate (run both options to a
      // finished deliverable and let Loudon pick), and which two options?
      const tp = selectTwoPaths({ request, verdict });
      if (tp.eligible) counts.two_paths_eligible += 1;
      escalations.push({
        tier,
        tier_key: TIER_META[tier].key,
        tier_label: TIER_META[tier].label,
        disharmony_signature: TIER_META[tier].signature,
        request_id: request.request_id,
        from: request.from,
        resource: request.resource,
        blocking: request.blocking === true,
        gate_kind: verdict.hardGate ? verdict.gateKind : null,
        gate_signal: verdict.gateSignal || null,
        rule_id: verdict.ruleId,
        headline: headlineOf(request),
        options: optionsSummary(request),
        rationale: verdict.rationale,
        age_ts: request.ts,
        two_paths: {
          eligible: tp.eligible,
          category: tp.category,
          shape: tp.shape,
          options: tp.options,
          borderline: tp.borderline,
          reason: tp.reason,
        },
      });
    } else if (verdict.verb === 'auto-grant') {
      counts.auto_grant += 1;
      autoDecisions.push({
        request_id: request.request_id, from: request.from, resource: request.resource,
        verb: 'auto-grant', rule_id: verdict.ruleId,
        option_id: verdict.grantOption ? verdict.grantOption.id : null,
        option_label: verdict.grantOption ? verdict.grantOption.label : null,
        rationale: verdict.rationale,
      });
    } else if (verdict.verb === 'auto-deny') {
      counts.auto_deny += 1;
      autoDecisions.push({
        request_id: request.request_id, from: request.from, resource: request.resource,
        verb: 'auto-deny', rule_id: verdict.ruleId, deny_reason: verdict.denyReason,
        rationale: verdict.rationale,
      });
    }
  }

  escalations.sort(compareEscalations);
  const ranked_escalations = escalations.map((e, i) => ({ rank: i + 1, ...e }));

  return {
    schema: 'trickster-auto-digest/0.1',
    generated_at: meta.generatedAt || null,
    mode: meta.mode || 'shadow',
    board: meta.board || null,
    counts,
    ranked_escalations,
    auto_decisions: autoDecisions,
  };
}

/** Render the digest as human-readable Markdown (Loudon Live plain-text feel). */
export function renderDigestMarkdown(digest) {
  const L = [];
  L.push('# Automated Trickster — Escalation Digest');
  L.push('');
  L.push(`Mode: \`${digest.mode}\`${digest.mode === 'shadow' ? '  (proposals only — nothing was posted to the board)' : '  (decisions were posted to the board)'}`);
  if (digest.generated_at) L.push(`Generated: ${digest.generated_at}`);
  if (digest.board) L.push(`Board: \`${digest.board}\``);
  L.push('');
  const c = digest.counts;
  const tpReady = c.two_paths_eligible ? ` · ${c.two_paths_eligible} **Two Paths–ready**` : '';
  L.push(`**${c.pending} pending** → ${c.escalate} for you, ${c.auto_grant} auto-grant${digest.mode === 'shadow' ? ' (proposed)' : ''}, ${c.auto_deny} auto-deny${digest.mode === 'shadow' ? ' (proposed)' : ''}${tpReady}.`);
  L.push('');
  L.push('---');
  L.push('');
  L.push('## For you — ranked by how far out of phase');
  L.push('');
  if (digest.ranked_escalations.length === 0) {
    L.push('_Nothing escalated. The palace is in phase._');
  } else {
    let lastTier = null;
    for (const e of digest.ranked_escalations) {
      if (e.tier !== lastTier) {
        if (lastTier !== null) L.push(''); // blank line before each new tier header
        L.push(`### ${e.tier}. ${e.tier_label}`);
        L.push(`_${e.disharmony_signature}_`);
        L.push('');
        lastTier = e.tier;
      }
      const blk = e.blocking ? ' · **blocking**' : '';
      const opts = e.options.length ? `  ·  options: ${e.options.join(' / ')}` : '';
      L.push(`- **#${e.rank}** [${e.from}] ${e.headline}${blk}`);
      L.push(`  \`${e.request_id}\` · ${e.resource}${opts}`);
      if (e.two_paths && e.two_paths.eligible) {
        const ab = e.two_paths.options.map((o) => o.id).join('  vs  ');
        const flag = e.two_paths.borderline ? ' _(borderline)_' : '';
        L.push(`  ↳ **Two Paths** (${e.two_paths.category}): build both → ${ab}${flag}`);
      }
    }
  }
  L.push('');
  L.push('---');
  L.push('');
  const verb = digest.mode === 'shadow' ? 'Would auto-handle (proposed)' : 'Auto-handled';
  L.push(`## ${verb}`);
  L.push('');
  if (digest.auto_decisions.length === 0) {
    L.push('_None._');
  } else {
    for (const d of digest.auto_decisions) {
      if (d.verb === 'auto-grant') {
        L.push(`- **grant** [${d.from}] \`${d.request_id}\` → \`${d.option_id}\``);
      } else {
        L.push(`- **deny** [${d.from}] \`${d.request_id}\` — ${d.deny_reason}`);
      }
    }
  }
  L.push('');
  L.push('---');
  L.push('Loudon Live · Autodidact Polymaths');
  L.push('');
  return L.join('\n');
}
