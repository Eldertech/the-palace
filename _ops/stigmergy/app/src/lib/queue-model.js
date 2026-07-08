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
//   - BROADCAST with payload.kind 'weave_flag'           → 'weave_flag'
//     (Deposit Ceremony's flags for a future Weave — backlink_audit,
//      missing_connection_audit, section_expansion, hub_candidate,
//      mirror_link_sweep, standard_reference. Carries source_entries: [string]
//      so a commit touching any one of them closes it via reconcileQueue.
//      Same RESOURCE_GRANT/RESOURCE_DENY close path as vector_proposal.)
//
// reconcileQueue() layers git resolution on top: given the LOG commits, it
// marks an item resolved when its stale_if is satisfied — the prospective →
// retrospective crossing made concrete.

import { tsCompare, tsToEpoch } from './format.js';
import { normalizeApplyOp } from './weave-apply-op.js';

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

  // Handoff lifecycle — three states, folded from board events (mirrors
  // _ops/stigmergy/handoff-model.mjs and STIGMERGY.md § Handoff Lifecycle):
  //   CLOSED  — a handoff_closed points at it, OR a LEGACY handoff_picked_up
  //             (one with no `lifecycle: "claim"` marker) does. Legacy pickups
  //             grandfather to closed: they were start-claims for work since
  //             landed, and the old UI "clear" button minted them. Dropped here.
  //   CLAIMED — a handoff_picked_up carrying `lifecycle: "claim"` points at it
  //             and nothing has closed it. Kept visible, flagged in-flight — a
  //             claim aging with no close is how a fumble surfaces.
  //   OPEN    — neither. Available to catch.
  // A lifecycle message names its handoff two ways, both honored: payload
  // handoff_id and the top-level `re`. Done is NEVER inferred from git — only an
  // explicit close (or the migration grandfather) retires a card.
  const closedHandoffs = new Set();
  const claimByHandoff = new Map();            // handoff_ready id -> its claim message
  for (const m of messages) {
    const p = m?.payload;
    if (!p || (p.kind !== 'handoff_closed' && p.kind !== 'handoff_picked_up')) continue;
    const refs = [];
    if (typeof p.handoff_id === 'string' && p.handoff_id) refs.push(p.handoff_id);
    if (typeof m.re === 'string' && m.re) refs.push(m.re);
    if (refs.length === 0) continue;
    const isClaim = p.kind === 'handoff_picked_up' && p.lifecycle === 'claim';
    for (const ref of refs) {
      if (isClaim) claimByHandoff.set(ref, m);
      else closedHandoffs.add(ref);            // handoff_closed OR a legacy pickup
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
        // `entry` aliases source_entry so reconcileQueue's entry-touch path
        // closes the proposal when the source entry is committed.
        entry: source,
        ask,
        summary: ask,
        rationale: typeof p.rationale === 'string' ? p.rationale : null,
        evidence: p.evidence ?? null,
        // A structured, mechanically-applicable change (set-vector, ...) the
        // executor can run on "grant & apply", or null when the proposal is
        // prose-only (manual grant, as before). Single source of truth for the
        // op shape lives in weave-apply-op.js — the server validates identically.
        apply: normalizeApplyOp(p.apply),
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

    if (p.kind === 'weave_flag' && !responded.has(m.id)) {
      // source_entries is an array of entry titles. We expose it as `entries`
      // on the queue item so reconcileQueue's array-aware entry-touch path
      // can close the flag when a commit touches any one of them. We also
      // populate the singular `entry` with the first title for backward-
      // compat with code that reads `item.entry` (the pointer chip, etc.).
      const sourceEntries = Array.isArray(p.source_entries)
        ? p.source_entries.filter((e) => typeof e === 'string' && e.trim() !== '')
        : [];
      const flagType = typeof p.flag_type === 'string' ? p.flag_type : 'unknown';
      const targetEntry = typeof p.target_entry === 'string' ? p.target_entry : null;
      const proposedAction = typeof p.proposed_action === 'string' ? p.proposed_action : null;
      const ask = proposedAction || synthesizeFlagAsk(flagType, sourceEntries, targetEntry);
      const primary = sourceEntries[0] || null;
      items.push({
        id: m.id,
        sourceId: m.id,
        kind: 'weave_flag',
        from: m.from,
        ts: m.ts,
        board: m.board,
        sessionId: m.session_id || null,
        flag_type: flagType,
        source_deposit_id: typeof p.source_deposit_id === 'string' ? p.source_deposit_id : null,
        source_entries: sourceEntries,
        target_entry: targetEntry,
        ask,
        summary: ask,
        rationale: typeof p.rationale === 'string' ? p.rationale : null,
        // `entry` aliases the primary source entry; `entries` carries the full
        // set for reconcileQueue's array-aware entry-touch matching.
        entry: primary,
        entries: sourceEntries,
        // An applicable change, if the flag carries one (same op shape as a
        // vector_proposal); null for the common prose-only flag.
        apply: normalizeApplyOp(p.apply),
        stale_if: typeof p.stale_if === 'string' && p.stale_if !== ''
          ? p.stale_if
          : (sourceEntries.length > 0
              ? `a commit touches any of [${sourceEntries.join(', ')}], or a RESOURCE_GRANT/DENY answers this flag`
              : 'a RESOURCE_GRANT or RESOURCE_DENY answers this flag'),
        pointer: primary ? { type: 'entry', target: primary } : { type: 'board', target: m.board },
        resolved: { done: false, reason: null, commit: null },
        blocking: p.blocking === true,
        health: m.health || null,
        raw: m,
      });
      continue;
    }

    if (p.kind === 'stigmergy_todo' && !responded.has(m.id)) {
      // A STIGMERGY-dev to-do captured by the Companion (Stage 1). Unlike a
      // weave_flag it names no palace entry — it is feedback about the terminal
      // itself — so it does not auto-close on an entry touch; it is retired by a
      // RESOURCE_GRANT/DENY answering it, or (Stage 3) a commit carrying
      // `Palace-Resolves: <id>`.
      const title = typeof p.title === 'string' && p.title.trim() ? p.title.trim() : 'untitled feedback';
      items.push({
        id: m.id,
        sourceId: m.id,
        kind: 'stigmergy_todo',
        from: m.from,
        ts: m.ts,
        board: m.board,
        sessionId: m.session_id || null,
        ask: title,
        summary: title,
        rationale: typeof p.detail === 'string' && p.detail.trim() ? p.detail.trim() : null,
        area: typeof p.area === 'string' ? p.area : 'general',
        severity: typeof p.severity === 'string' ? p.severity : 'minor',
        stale_if: typeof p.stale_if === 'string' && p.stale_if !== ''
          ? p.stale_if
          : `a RESOURCE_GRANT/DENY answers this, or a commit carries Palace-Resolves: ${m.id}`,
        pointer: { type: 'board', target: m.board },
        resolved: { done: false, reason: null, commit: null },
        blocking: false,
        health: m.health || null,
        raw: m,
      });
      continue;
    }

    if (p.kind === 'handoff_ready' && !closedHandoffs.has(m.id)) {
      const entry = typeof p.entry === 'string' ? p.entry : null;
      const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
      // `move` is the in-flight move (the state description), `invocation` is
      // how the catcher picks it up (the immediate next step), and
      // `receiving_surface` names where the baton is meant to land. All three
      // are already on the board convention (Baton Ceremony § Announcing the
      // Baton on the Board) — surfaced here so the card is pick-up-able without
      // opening the file. Older announcements predate the convention and carry
      // only `summary`; the card falls back to it.
      const move = str(p.move);
      const invocation = str(p.invocation);
      const receivingSurface = str(p.receiving_surface);
      // Lifecycle state: OPEN unless a claim points at it (CLOSED handoffs were
      // already dropped by the closedHandoffs gate above). A CLAIMED card stays
      // in the queue, flagged in-flight, until an explicit close retires it.
      const claim = claimByHandoff.get(m.id) || null;
      const state = claim ? 'claimed' : 'open';
      items.push({
        id: m.id,
        sourceId: m.id,
        kind: 'handoff_ready',
        state,
        // Who claimed it and when (for the CLAIMED badge); null when open.
        claimedBy: claim ? (claim.from || null) : null,
        claimedAt: claim ? (claim.ts || null) : null,
        from: m.from,
        ts: m.ts,
        board: m.board,
        summary: p.summary || (entry ? `handoff ready: ${entry}` : 'handoff ready'),
        // The card LEADS with the move; undefined (not null) when absent so a
        // move-less baton keeps leading with `summary` (see QueueItem HERO 2).
        ask: move || undefined,
        move,
        invocation,
        receiving_surface: receivingSurface,
        entry,
        // The worktree coordinate the baton lives in (Baton Ceremony §
        // Announcing the Baton on the Board). Carried through so the launch
        // prompt can send the catcher into the right worktree, not the root.
        worktree: (p.worktree && typeof p.worktree === 'object') ? p.worktree : null,
        handoff_path: typeof p.handoff_path === 'string' ? p.handoff_path : null,
        // A handoff closes by an explicit board event, never by a git guess —
        // so its stale_if names the lifecycle close, not a commit condition.
        stale_if: 'a handoff_closed (or grandfathered legacy pickup) retires it — done is never inferred from git',
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

    // Handoffs never git-reconcile — they close by an explicit board event
    // (handoff_closed), folded in buildQueue. Inferring "done" from a commit
    // touching the entry is the exact bug the three-state lifecycle removed
    // (STIGMERGY.md § Handoff Lifecycle): entry files are high-traffic, so a
    // commit touch does not mean this baton's move landed.
    if (item.kind === 'handoff_ready') return item;

    // (1) explicit Palace-Resolves pointer.
    const byResolve = cs.find((c) => Array.isArray(c.resolves) && c.resolves.includes(item.id));
    if (byResolve) {
      return {
        ...item,
        resolved: { done: true, reason: `resolved by commit ${byResolve.shortHash}`, commit: byResolve.shortHash },
      };
    }

    // (2) stale_if: a commit touched the item's entry after it was posted.
    // Items with `entries: [string]` (e.g. weave_flag) close when a commit
    // touches ANY of those titles; singular `entry` is also honored.
    const watchEntries = (Array.isArray(item.entries) && item.entries.length > 0)
      ? item.entries
      : (item.entry ? [item.entry] : []);
    if (watchEntries.length > 0) {
      const itemEpoch = tsToEpoch(item.ts);
      const watchLower = watchEntries.map((e) => e.toLowerCase());
      let matchedEntry = null;
      const touch = cs.find((c) => {
        if (!Array.isArray(c.entries)) return false;
        const hit = c.entries.find((e) => watchLower.includes(e.toLowerCase()));
        if (!hit) return false;
        const cEpoch = tsToEpoch(c.date);
        if (!(Number.isFinite(cEpoch) && Number.isFinite(itemEpoch) && cEpoch > itemEpoch)) {
          return false;
        }
        // Preserve the canonical-cased title from the watch list for the reason string.
        matchedEntry = watchEntries.find((w) => w.toLowerCase() === hit.toLowerCase()) || hit;
        return true;
      });
      if (touch) {
        return {
          ...item,
          resolved: {
            done: true,
            reason: `a commit (${touch.shortHash}) touched ${matchedEntry} after this was posted`,
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
    case 'promote_hub':
      return `promote ${s} to a hub (it has crossed the inbound-link threshold)`;
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

// Synthesize a human-language ask from a weave_flag's structured fields
// when the author didn't supply a `proposed_action` string. The flag_type
// enum is open; renderer falls back to "Weave flag" for unknown types.
export function synthesizeFlagAsk(flagType, sourceEntries, targetEntry) {
  const srcs = Array.isArray(sourceEntries) ? sourceEntries.filter(Boolean) : [];
  const wikilink = (s) => `[[${String(s).replace(/\.md$/, '')}]]`;
  const srcList = srcs.length > 0
    ? srcs.map(wikilink).join(srcs.length === 2 ? ' and ' : ', ')
    : 'an entry';
  const tgt = targetEntry ? wikilink(targetEntry) : null;
  switch (flagType) {
    case 'backlink_audit':
      return tgt
        ? `audit backlinks: add inbound links from ${srcList} pointing at ${tgt}`
        : `audit backlinks across ${srcList}`;
    case 'missing_connection_audit':
      return `audit ${srcList} for missing connections`;
    case 'section_expansion':
      return `expand a section in ${srcList}`;
    case 'hub_candidate':
      return `evaluate ${srcList} as a hub candidate`;
    case 'mirror_link_sweep':
      return `sweep ${srcList} for mirror / same-object links`;
    case 'standard_reference':
      return tgt
        ? `reference ${tgt} as a standard from ${srcList}`
        : `reference ${srcList} as a standard`;
    default:
      return `Weave flag on ${srcList}`;
  }
}

// Compact age of an item from its ts — a readout on EVERY card, not just
// batons: "just now" / "5m" / "3h" / "6d" / "2w" / "4mo" / "1y". `stale` flags
// an item that has sat open long enough to deserve skepticism (>= 3 days) — the
// passive backstop now that git auto-resolution is off. nowMs is injectable for
// tests; it defaults to Date.now() (fine in app runtime; never called from a
// workflow script). Returns { label, ms, stale }; label is null for a bad ts.
export const STALE_AGE_MS = 3 * 24 * 60 * 60 * 1000;
export function cardAge(ts, nowMs) {
  const then = tsToEpoch(ts);
  if (!Number.isFinite(then)) return { label: null, ms: null, stale: false };
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const ms = Math.max(0, now - then);
  const s = Math.floor(ms / 1000);
  let label;
  if (s < 60) label = 'just now';
  else {
    const m = Math.floor(s / 60);
    if (m < 60) label = `${m}m`;
    else {
      const h = Math.floor(m / 60);
      if (h < 24) label = `${h}h`;
      else {
        const d = Math.floor(h / 24);
        if (d < 7) label = `${d}d`;
        else if (d < 30) label = `${Math.floor(d / 7)}w`;
        else if (d < 365) label = `${Math.floor(d / 30)}mo`;
        else label = `${Math.floor(d / 365)}y`;
      }
    }
  }
  return { label, ms, stale: ms >= STALE_AGE_MS };
}

// A short human vantage string: "announced HH:MM:SSZ, from X".
export function vantage(item) {
  const ts = typeof item?.ts === 'string' ? item.ts : '';
  const m = ts.match(/T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})?/);
  const when = m ? `${m[1]}${m[2] || ''}` : (ts || 'unknown time');
  return `announced ${when}, from ${item?.from ?? '?'}`;
}
