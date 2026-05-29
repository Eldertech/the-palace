// digest-view.js — pure helpers for rendering the Automated Trickster digest
// inside STIGMERGY. The digest itself is produced by the trickster-auto engine
// (../../trickster-auto) and written to digest-latest.json; here we only shape
// the already-computed data for the view. Kept pure (no React, no fetch) so it
// is unit-testable in the app's node vitest environment.

// The digest is served through the existing palace-file route (no new endpoint;
// see Stage E build notes). Path is palace-relative and traversal-guarded.
export const DIGEST_API_PATH =
  '/api/file?path=' + encodeURIComponent('_ops/stigmergy/trickster-auto/digest-latest.json');

/** Defensive top-line summary. Returns null if the digest is missing/!object. */
export function summarizeDigest(digest) {
  if (!digest || typeof digest !== 'object') return null;
  const c = digest.counts || {};
  return {
    mode: digest.mode || 'shadow',
    generatedAt: digest.generated_at || null,
    pending: c.pending || 0,
    escalate: c.escalate || 0,
    autoGrant: c.auto_grant || 0,
    autoDeny: c.auto_deny || 0,
  };
}

/**
 * Group ranked escalations into tier blocks, preserving rank order. Each block:
 *   { tier, label, signature, items: [escalation, ...] }
 */
export function tierGroups(digest) {
  const ranked = (digest && Array.isArray(digest.ranked_escalations)) ? digest.ranked_escalations : [];
  const groups = [];
  let current = null;
  for (const e of ranked) {
    if (!current || current.tier !== e.tier) {
      current = { tier: e.tier, label: e.tier_label, signature: e.disharmony_signature, items: [] };
      groups.push(current);
    }
    current.items.push(e);
  }
  return groups;
}

/** The proposed/actual auto-decisions list (grants + denies). */
export function autoDecisions(digest) {
  return (digest && Array.isArray(digest.auto_decisions)) ? digest.auto_decisions : [];
}

/** Whether the digest reflects shadow mode (proposals) vs live (posted). */
export function isShadow(digest) {
  return !digest || digest.mode !== 'live';
}
