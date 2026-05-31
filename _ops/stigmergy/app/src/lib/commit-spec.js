// Commit Specification — the WRITE side (Phase 3).
//
// commit-parse.js reads commits (for the LOG deck). This module writes and
// validates them, shared by two consumers:
//   - scripts/palace-commit.mjs  -- the structured producer (derives trailers
//     from the staged diff, formats the message, commits)
//   - scripts/commit-msg-hook.mjs -- the tolerant backstop (validates every
//     commit; annotates out-of-band ones rather than blocking)
//
// Everything here is pure (no git, no fs) so it is unit-testable against
// fixture strings. The git/fs glue lives in the scripts.
//
// Format (STIGMERGY v1.0 §The Commit Specification + Revision 2):
//   <kind>(<scope>): <summary>
//
//   <optional body>
//
//   Palace-Kind: <kind>            # kind enum + `mixed`
//   Palace-Entry: <Title>          # repeatable
//   Palace-Stage: <Entry>: a->b    # optional, repeatable
//   Palace-Vector: <Entry>: changed
//   Palace-Resolves: <queue-id>    # optional
//   Palace-Campaign: <slug>        # Revision 2: groups a multi-commit campaign
//   Palace-Verify: verified | unverified | couldnt
//   Palace-Author: claude | loudon | steward:<Entry>

import { KNOWN_KINDS, parseSubject, parseTrailers, derivedEntriesFromPaths } from './commit-parse.js';

export const VERIFY_VALUES = ['verified', 'unverified', 'couldnt'];

// ── Validation (the commit-msg hook's brain) ─────────────────────────────────
//
// Returns { valid, errors: [...], warnings: [...], parsed }. `valid` is true
// when the message is spec-conformant. The HOOK never hard-blocks on !valid --
// it annotates instead (see annotateOutOfBand). validity drives whether
// annotation is needed, not whether the commit is allowed.
export function validateCommitMessage(text) {
  const errors = [];
  const warnings = [];
  const raw = typeof text === 'string' ? text : '';
  // First non-comment line is the subject (git strips comment lines, but the
  // hook sees the raw file, so skip leading comments + blanks defensively).
  const lines = raw.split(/\r?\n/);
  let subjectLine = '';
  let subjectIdx = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    if (l.trim() === '' || l.startsWith('#')) continue;
    subjectLine = l;
    subjectIdx = i;
    break;
  }
  if (subjectIdx === -1) {
    return { valid: false, errors: ['empty commit message'], warnings, parsed: null };
  }

  const subj = parseSubject(subjectLine);
  const body = lines.slice(subjectIdx + 1).join('\n');
  const trailers = parseTrailers(body);

  // Subject must be the spec form with a known kind.
  if (!subj.declared) {
    errors.push(
      subj.subjectToken
        ? `subject kind "${subj.subjectToken}" is not a known kind (${KNOWN_KINDS.join('|')})`
        : 'subject is not in "<kind>(<scope>): <summary>" form',
    );
  }

  // A Palace-Kind trailer, if present, must be a known kind and should agree
  // with the subject kind.
  if (trailers.kind) {
    if (!KNOWN_KINDS.includes(trailers.kind)) {
      errors.push(`Palace-Kind "${trailers.kind}" is not a known kind`);
    } else if (subj.declared && subj.kind !== trailers.kind) {
      warnings.push(`subject kind "${subj.kind}" disagrees with Palace-Kind "${trailers.kind}"`);
    }
  } else {
    warnings.push('no Palace-Kind trailer (derivable, but recommended)');
  }

  // Palace-Verify, if present, must be one of the allowed values.
  if (trailers.verify && !VERIFY_VALUES.includes(trailers.verify)) {
    errors.push(`Palace-Verify "${trailers.verify}" must be one of ${VERIFY_VALUES.join('|')}`);
  } else if (!trailers.verify) {
    warnings.push('no Palace-Verify trailer (the Closing Well honesty call)');
  }

  const subjLen = subjectLine.length;
  if (subjLen > 72) warnings.push(`subject is ${subjLen} chars (> 72; keep it scannable)`);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed: { subject: subjectLine, kind: subj.kind, scope: subj.scope, summary: subj.summary, trailers },
  };
}

// ── Out-of-band annotation (the tolerate-and-flag path) ──────────────────────
//
// For a commit made outside palace-commit (Obsidian's git integration, a raw
// CLI commit) whose message is not spec-conformant, the hook does NOT reject.
// It appends honest trailers so the LOG still renders it truthfully:
//   Palace-Kind: ops        (a safe catch-all -- it is *some* change)
//   Palace-Verify: couldnt  (we could not verify an unstructured commit)
//   Palace-Author: <author> (best-effort; passed in by the hook)
// Existing trailers are preserved; we only add the ones that are missing.
// Never wedge: this function only ever ADDS lines.
export function annotateOutOfBand(text, { author = null } = {}) {
  const raw = typeof text === 'string' ? text : '';
  const { parsed } = validateCommitMessage(raw);
  const existing = parsed?.trailers?.raw ?? {};

  const additions = [];
  if (!('Palace-Kind' in existing)) additions.push('Palace-Kind: ops');
  if (!('Palace-Verify' in existing)) additions.push('Palace-Verify: couldnt');
  if (author && !('Palace-Author' in existing)) additions.push(`Palace-Author: ${author}`);
  // A marker so the LOG can show "annotated by the hook" honestly.
  if (!('Palace-Annotated' in existing)) additions.push('Palace-Annotated: commit-msg-hook');

  if (additions.length === 0) return raw;

  // Append as a trailer block. Ensure exactly one blank line precedes it if the
  // message does not already end with a trailer-ish block.
  const trimmed = raw.replace(/\s+$/, '');
  const needsBlank = !/\n\n[A-Za-z][A-Za-z0-9-]*:.*$/.test(trimmed);
  const sep = needsBlank ? '\n\n' : '\n';
  return `${trimmed}${sep}${additions.join('\n')}\n`;
}

// ── Trailer derivation (palace-commit's brain) ───────────────────────────────
//
// Given the staged diff, derive the trailers the author should NOT have to
// type. `mdChanges` is an array of { path, frontmatterChanges, bodyChanged,
// wasAdded } (the shape server/git.js already produces per file). The author
// supplies kind, summary, verify, optional scope/body/campaign/resolves.
//
// Returns the full trailer set as an ordered array of "Key: Value" strings.
export function deriveTrailers({
  paths = [],
  mdChanges = [],
  kind,
  verify,
  author = 'claude',
  campaign = null,
  resolves = [],
  explicitEntries = null,
}) {
  const out = [];
  if (kind) out.push(`Palace-Kind: ${kind}`);

  // Entries: explicit override, else Palace-Entry per touched knowledge .md.
  const entries = explicitEntries ?? derivedEntriesFromPaths(paths);
  for (const e of entries) out.push(`Palace-Entry: ${e}`);

  // Stage transitions + vector moves from the frontmatter diffs.
  for (const fd of mdChanges) {
    const entry = basenameNoMd(fd.path);
    for (const c of fd.frontmatterChanges ?? []) {
      if (c.field === 'stage' && c.kind === 'changed') {
        out.push(`Palace-Stage: ${entry}: ${c.before}->${c.after}`);
      }
      if (c.field === 'forward_vector') {
        out.push(`Palace-Vector: ${entry}: changed`);
      }
    }
    // A newly-added entry's stage reads as a "born" transition.
    if (fd.wasAdded) {
      const stageAdd = (fd.frontmatterChanges ?? []).find((c) => c.field === 'stage' && c.kind === 'added');
      if (stageAdd) out.push(`Palace-Stage: ${entry}: born->${stageAdd.after}`);
    }
  }

  for (const r of resolves) out.push(`Palace-Resolves: ${r}`);
  if (campaign) out.push(`Palace-Campaign: ${campaign}`);
  if (verify) out.push(`Palace-Verify: ${verify}`);
  if (author) out.push(`Palace-Author: ${author}`);

  // De-dupe while preserving order (a stage + vector on the same entry can
  // legitimately repeat across files; exact-duplicate lines are noise).
  const seen = new Set();
  return out.filter((line) => (seen.has(line) ? false : (seen.add(line), true)));
}

// Assemble a full commit message from parts.
export function formatCommitMessage({ kind, scope, summary, body = '', trailers = [] }) {
  const subject = scope ? `${kind}(${scope}): ${summary}` : `${kind}: ${summary}`;
  const parts = [subject];
  if (body && body.trim() !== '') parts.push('', body.trim());
  if (trailers.length > 0) parts.push('', trailers.join('\n'));
  return parts.join('\n') + '\n';
}

function basenameNoMd(p) {
  if (typeof p !== 'string') return '';
  return p.slice(p.lastIndexOf('/') + 1).replace(/\.md$/, '');
}
