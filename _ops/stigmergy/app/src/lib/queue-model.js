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
//   - RESOURCE_REQUEST without a matching GRANT/DENY  → 'resource_request'
//   - BROADCAST with payload.kind 'handoff_ready'      → 'handoff_ready'
//   (proposals + audition gates are later item types; the shape is open.)
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

  // Resource requests: unanswered ones become queue items.
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
        summary: p.resource || p.rationale || 'resource request',
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

// A short human vantage string: "announced HH:MM:SSZ, from X".
export function vantage(item) {
  const ts = typeof item?.ts === 'string' ? item.ts : '';
  const m = ts.match(/T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})?/);
  const when = m ? `${m[1]}${m[2] || ''}` : (ts || 'unknown time');
  return `announced ${when}, from ${item?.from ?? '?'}`;
}
