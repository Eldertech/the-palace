// companion-context.js — resolve the Companion's grounding context from where
// the user is (the active deck + the current URL selection). Pure + SSR-safe.
//
// One companion, many faces. The window used to be bound to a single open entry
// in STATE; lifting it App-level means its grounding must follow the user across
// decks. This module is the single source of truth for "what is the companion
// grounded in right now," expressed as a small descriptor the adapter sends, the
// endpoint forwards, and the lane dispatches grounding + prompt + allowed-actions
// on:
//
//   { kind:'entry',             path }              // STATE — discuss/edit the entry
//   { kind:'app_feedback',      deck }              // any deck — STIGMERGY dev feedback
//   { kind:'trickster_request', request_id, entry_path? }  // TRICKSTER (Stage 2)
//   { kind:'commit',            sha }               // LOG (Stage 3)
//   { kind:'uncommitted' }                          // LOG (Stage 3)
//
// Stage 0 wires the plumbing and implements `entry` (unchanged) + `app_feedback`
// (a generic STIGMERGY-as-collaborator discuss). The commit / trickster_request
// kinds are added in their stages — this resolver grows one branch at a time.

export function resolveContext({ deck, entryPath, commitSha, tricksterRequests } = {}) {
  if (deck === 'STATE' && entryPath) {
    return { kind: 'entry', path: entryPath };
  }
  if (deck === 'TRICKSTER' && Array.isArray(tricksterRequests) && tricksterRequests.length > 0) {
    // The pending decisions in front of Loudon. The window scroll-spies the card
    // it floats over and answers AS that project (the page IS the agent) — so it
    // carries the whole list and picks the nearest one live. Read-only Q&A.
    return { kind: 'trickster_request', requests: tricksterRequests };
  }
  // Stage 3 (LOG) adds its branch above this line. Until then, every other
  // surface grounds the companion in STIGMERGY itself — a development
  // collaborator the user can talk to from anywhere.
  return { kind: 'app_feedback', deck: deck || null };
}

// A stable string key for a context. The window uses it to reset the
// conversation and re-key its effects when the grounding changes (one entry to
// another, one deck to another) — the generalization of the old `path` key.
export function contextKey(ctx) {
  if (!ctx || typeof ctx !== 'object') return 'none';
  switch (ctx.kind) {
    case 'entry': return `entry:${ctx.path || ''}`;
    case 'commit': return `commit:${ctx.sha || ''}`;
    case 'uncommitted': return 'uncommitted';
    // The list-context (the live deck) keys to a stable 'trickster' so scrolling
    // between cards re-grounds the answer WITHOUT resetting the conversation; a
    // single-request context (the wire shape) keys to its id.
    case 'trickster_request': return ctx.request_id ? `trickster:${ctx.request_id}` : 'trickster';
    case 'app_feedback': return `app:${ctx.deck || ''}`;
    default: return ctx.kind || 'none';
  }
}

// A short human label naming what the companion is grounded in, for the
// titlebar / footer readout per kind.
export function contextLabel(ctx) {
  if (!ctx || typeof ctx !== 'object') return 'STIGMERGY';
  switch (ctx.kind) {
    case 'entry': return ctx.title || ctx.path || 'this entry';
    case 'commit': return ctx.sha ? `commit ${ctx.sha.slice(0, 7)}` : 'a commit';
    case 'uncommitted': return 'uncommitted work';
    case 'trickster_request': return ctx.project || ctx.entry || 'a pending decision';
    case 'app_feedback': return `STIGMERGY · ${ctx.deck ? String(ctx.deck).toLowerCase() : 'app'}`;
    default: return 'STIGMERGY';
  }
}

// Is this a context the companion can edit in place (entry body / forward
// vector)? Only the entry kind, for now. The window uses this to decide whether
// to run the entry-only surfaces (scroll-spy glow, "discuss this" pin).
export function isEntryContext(ctx) {
  return !!ctx && ctx.kind === 'entry';
}
