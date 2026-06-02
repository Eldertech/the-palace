// queue-model.js — the unified QUEUE item model (Phase 4, the QUEUE reframe).
//
// QUEUE is the prospective deck: it holds ONLY open, future-facing items, and
// items are closed by git events. A board that never claims past facts cannot
// lie about them (Two Batons / Drift and Consolidation).
//
// Every item is HONEST about its own staleness:
//   - it asserts an act at a time from a vantage ("announced at T, from X")
//   - it names its stale_if git-condition (the commit that would retire it)
//   - it points to live state (a STATE entry / its LOG history)
//   - it never declares present truth
//
// Items come from board messages:
//   - RESOURCE_REQUEST without a matching GRANT/DENY    → 'resource_request'
//   - BROADCAST with payload.kind 'handoff_ready'        → 'handoff_ready'
//   - BROADCAST with payload.kind 'vector_proposal'      → 'vector_proposal'
//     (Weave swarm's proposals — promote-unsung, new-typed-link, label-
//      enrichment, stage-transition, vector-tuning. Render as cards in
//      QUEUE; resolve via the existing RESOURCE_GRANT/RESOURCE_DENY flow
//      referencing the proposal's message id.)
//
// reconcileQueue() layers git resolution on top: given the LOG commits, it
// marks an item resolved when its stale_if is satisfied — the prospective →
// retrospective crossing made concrete.

import { tsCompare, tsToEpoch } from './format.js';

// ── Build the open queue from board messages ─────────────────────────────────

// A handoff_ready is resolved (already closed) when a later message carries a
// Palace-Resolves-style pointer; but on the board side the durable resolver is
// git (reconcileQueue). Here we only drop handoff_ready items that have an
// explicit board-level "consumed" acknowledgement (a BROADCAST whose payload
// references the handoff id as picked-up), which is rare; git is the main path.
export function buildQueue(messages) {
  if (!Array.isArray(messages)) return [];
  const items = [];

  // Resource requests + vector proposals are both answered by RESOURCE_GRANT
  // / RESOURCE_DENY messages that carry `re: <message_id>`. One shared set
  // covers both (the dedup is by the answered message's id).
  const responded = new Set();
  for (const m of messages) {
    if ((m?.type === 'RESOURCE_GRANT' || m?.type === 'RESOURCE_DENY') && m.re) {
      responded.add(m.re);
    }
  }

  // handoff_ready ids that a later message explicitly acknowledges as picked up.
  const ackedHandoffs = new Set();
  for (const m of messages) {
    const p = m?.payload;
    if (p && p.kind === 'handoff_picked_up' && typeof p.handoff_id === 'string') {
      ackedHandoffs.add(p.handoff_id);
    }
  }

  for (const m of messages) {
    if (!m || typeof m !== 'object') continue;
    const p = m.payload || {};

    if (m.type === 'RESOURCE_REQUEST' && !responded.has(m.request_id)) {
      items.push({
        id: m.request_id ?? m.id,
        sourceId: m.id,
        kind: 'resource_request',
        from: m.from,
        ts: m.ts,
        board: m.board,
        sessionId: m.session_id || null,
        // Keep `summary` for legacy callers (the technical resource type).
        summary: p.resource || p.rationale || 'resource request',
        // `ask` is the human-language question the card LEADS with.
        // Prefer the explicit decision form, then subject, then a first-
        // sentence trim of the rationale, falling back to resource type.
        ask: deriveAsk(p),
        // `resourceType` is the technical label (e.g. "sensory_audition_gate")
        // -- demoted to dim metadata in the card.
        resourceType: typeof p.resource === 'string' ? p.resource : null,
        rationale: typeof p.rationale === 'string' ? p.rationale : null,
        recommendation: typeof p.steward_recommendation === 'string' ? p.steward_recommendation : null,
        // Asker-designed a/b/c options (already normalized upstream).
        options: Array.isArray(p.options) ? p.options : null,
        entry: typeof p.entry === 'string' ? p.entry : null,
        stale_if: 'a RESOURCE_GRANT or RESOURCE_DENY answers this request',
        pointer: { type: 'board', target: 'TRICKSTER' },
        resolved: { done: false, reason: null, commit: null },
        blocking: p.blocking === true,
        health: m.health || null,
        raw: m,
      });
      continue;
    }

    if (p.kind === 'vector_proposal' && !responded.has(m.id)) {
      const proposalType = typeof p.proposal_type === 'string' ? p.proposal_type : 'unknown';
      const source = typeof p.source_entry === 'string' ? p.source_entry : null;
      const target = typeof p.target_entry === 'string' ? p.target_entry : null;
      const proposed = typeof p.proposed_change === 'string' ? p.proposed_change : null;
      // The card LEADS with proposed_change; if absent, synthesize a
      // human-language ask from the proposal_type + source/target.
      const ask = proposed || synthesizeProposalAsk(proposalType, source, target);
      items.push({
        id: m.id,
        sourceId: m.id,
        kind: 'vector_proposal',
        from: m.from,
        ts: m.ts,
        board: m.board,
        sessionId: m.session_id || null,
        proposal_type: proposalType,
        source_entry: source,
        target_entry: target,
        ask,
        summary: ask,
        rationale: typeof p.rationale === 'string' ? p.rationale : null,
        evidence: p.evidence ?? null,
        // No grant/deny yet -- by the same logic as resource_request: a
        // committed edit to the source entry would coarsely close it, but
        // the canonical resolution is a RESOURCE_GRANT/DENY referencing
        // this message id. The reconciler covers the entry-touch path.
        stale_if: typeof p.stale_if === 'string' && p.stale_if !== ''
          ? p.stale_if
          : (source
              ? `a RESOURCE_GRANT/DENY answers this proposal, or a commit touches ${source}`
              : 'a RESOURCE_GRANT or RESOURCE_DENY answers this proposal'),
        pointer: source ? { type: 'entry', target: source } : { type: 'board', target: m.board },
        resolved: { done: false, reason: null, commit: null },
        blocking: p.blocking === true,
        health: m.health || null,
        raw: m,
      });
      continue;
    }

    if (p.kind === 'handoff_ready' && !ackedHandoffs.has(m.id)) {
      const entry = typeof p.entry === 'string' ? p.entry : null;
      items.push({
        id: m.id,
        sourceId: m.id,
        kind: 'handoff_ready',
        from: m.from,
        ts: m.ts,
        board: m.board,
        summary: p.summary || (entry ? `handoff ready: ${entry}` : 'handoff ready'),
        entry,
        handoff_path: typeof p.handoff_path === 'string' ? p.handoff_path : null,
        // The git condition that retires it (mirrors the board convention).
        stale_if: p.stale_if
          || (entry ? `a commit touches ${entry} after this was posted` : 'a resolving commit lands'),
        pointer: entry ? { type: 'entry', target: entry } : { type: 'board', target: m.board },
        resolved: { done: false, reason: null, commit: null },
        blocking: false,
        health: m.health || null,
        raw: m,
      });
      continue;
    }
  }

  return rankQueue(items);
}

// Ranking: blocking first, then newest-first (chronological, tz-safe).
export function rankQueue(items) {
  return [...items].sort((a, b) => {
    if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
    return tsCompare(b.ts, a.ts);
  });
}

// ── Git reconciliation: close items whose stale_if git-condition is met ───────
//
// `commits` is the LOG shape from /api/log: each { shortHash, date, entries:
// [...], resolves: [...] }. An item resolves when:
//   (1) a commit carries Palace-Resolves: <item.id>           (explicit), OR
//   (2) the item names an entry and a commit touched that entry
//       with a commit date AFTER the item's ts                (stale_if).
// Returns a NEW item array; never mutates inputs. Resolution is advisory:
// the item greys with "looks done -- clear it?", it is not silently removed
// (the human confirms, per the spec).
export function reconcileQueue(items, commits) {
  if (!Array.isArray(items)) return [];
  const cs = Array.isArray(commits) ? commits : [];

  return items.map((item) => {
    if (item.resolved?.done) return item;

    // (1) explicit Palace-Resolves pointer.
    const byResolve = cs.find((c) => Array.isArray(c.resolves) && c.resolves.includes(item.id));
    if (byResolve) {
      return {
        ...item,
        resolved: { done: true, reason: `resolved by commit ${byResolve.shortHash}`, commit: byResolve.shortHash },
      };
    }

    // (2) stale_if: a commit touched the item's entry after it was posted.
    if (item.entry) {
      const itemEpoch = tsToEpoch(item.ts);
      const touch = cs.find((c) => {
        if (!Array.isArray(c.entries)) return false;
        if (!c.entries.some((e) => e.toLowerCase() === item.entry.toLowerCase())) return false;
        const cEpoch = tsToEpoch(c.date);
        // Only commits strictly AFTER the item's vantage retire it.
        return Number.isFinite(cEpoch) && Number.isFinite(itemEpoch) && cEpoch > itemEpoch;
      });
      if (touch) {
        return {
          ...item,
          resolved: {
            done: true,
            reason: `a commit (${touch.shortHash}) touched ${item.entry} after this was posted`,
            commit: touch.shortHash,
          },
        };
      }
    }

    return item;
  });
}

// Convenience: split a reconciled list into open vs resolved, preserving rank.
export function partitionQueue(items) {
  const open = [];
  const resolved = [];
  for (const it of items ?? []) {
    (it.resolved?.done ? resolved : open).push(it);
  }
  return { open, resolved };
}

// Per-board lane counts (the six boards become lanes/filters, not tabs).
export function laneCounts(items) {
  const out = new Map();
  for (const it of items ?? []) {
    const b = it.board || 'GENERAL';
    out.set(b, (out.get(b) ?? 0) + 1);
  }
  return out;
}

// Derive a human-language "ask" from a request payload. Preference order:
//   1. decision_topic / decision_needed -- the asker's explicit question
//   2. subject                          -- a short one-liner
//   3. first sentence of rationale      -- trimmed at the first period or 200 chars
//   4. the technical resource type      -- absolute fallback
// Returns a non-empty string or null.
export function deriveAsk(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const pick = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
  const fromExplicit = pick(payload.decision_topic)
    || pick(payload.decision_needed)
    || pick(payload.subject);
  if (fromExplicit) return fromExplicit;
  const rationale = pick(payload.rationale);
  if (rationale) {
    // Trim to first sentence (period followed by space or end), cap at 200.
    const match = rationale.match(/^(.+?[.?!])(\s|$)/);
    const head = match ? match[1] : rationale;
    return head.length > 200 ? `${head.slice(0, 197)}...` : head;
  }
  return pick(payload.resource);
}

// Synthesize a human-language ask from a vector_proposal's structured
// fields when the proposer didn't supply a `proposed_change` string.
export function synthesizeProposalAsk(proposalType, source, target) {
  const s = source ? `[[${source.replace(/\.md$/, '')}]]` : 'an entry';
  const t = target ? `[[${target.replace(/\.md$/, '')}]]` : 'another entry';
  switch (proposalType) {
    case 'promote_unsung':
      return `promote the body wikilink ${s} → ${t} to a typed link`;
    case 'new_typed_link':
      return `add a typed link ${s} → ${t}`;
    case 'label_enrichment':
      return `add a resonant link label to a link from ${s}`;
    case 'stage_transition':
      return `propose a stage transition for ${s}`;
    case 'vector_tuning':
      return `propose a forward-vector revision for ${s}`;
    default:
      return `Weave proposal on ${s}`;
  }
}

// A short human vantage string: "announced HH:MM:SSZ, from X".
export function vantage(item) {
  const ts = typeof item?.ts === 'string' ? item.ts : '';
  const m = ts.match(/T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})?/);
  const when = m ? `${m[1]}${m[2] || ''}` : (ts || 'unknown time');
  return `announced ${when}, from ${item?.from ?? '?'}`;
}
