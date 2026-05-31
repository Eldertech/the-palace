// Server-side composer for POST /api/entry/save (Phase 5 Stage A: dry-run).
//
// Pure pipeline:
//   1. allow-list the path
//   2. emit YAML from the proposed frontmatter, assemble proposed file
//   3. read current HEAD blob for the path (or empty if new)
//   4. diff via frontmatter-diff (palace-aware: field-level)
//   5. derive Palace-* trailers via commit-spec.deriveTrailers
//   6. format the structured commit subject + body + trailers
//   7. generate a unified diff string for the preview panel
//
// Returns { ok, preview: { subject, trailers[], message, udiff, frontmatterChanges, bodyChanged } }.
// On allow-list refusal returns { ok: false, status: 403, error: <reason> }.
// On validation failure returns { ok: false, status: 422, errors: [...] }.
//
// Stage B will reuse this exact same composer and merely add the git side
// effects after the preview is approved by the user.

import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { checkAllowList, validateFrontmatter } from '../src/lib/entry-edit.js';
import { emitEntryFile } from '../src/lib/yaml-emit.js';
import { diffEntryText } from '../src/lib/frontmatter-diff.js';
import { deriveTrailers, formatCommitMessage } from '../src/lib/commit-spec.js';

const KNOWN_KINDS = new Set([
  'deposit', 'edit', 'enrich', 'handoff', 'steward', 'weave', 'schema', 'ops', 'merge', 'mixed',
]);
const VERIFY_VALUES = new Set(['verified', 'unverified', 'couldnt']);

// Compose a dry-run preview for a proposed entry save.
//
// inputs:
//   palaceRoot     -- absolute path to the palace root
//   relPath        -- entry path relative to palace root
//   frontmatter    -- proposed frontmatter object
//   body           -- proposed body string
//   kind           -- commit kind (defaults to 'edit' when omitted; 'deposit' for new)
//   summary        -- subject summary (required)
//   verify         -- 'verified' | 'unverified' | 'couldnt' (required)
//   scope          -- optional subject scope; defaults to the entry basename
//   body_message   -- optional commit body text (the "why")
//   author         -- 'claude' | 'loudon' | 'steward:<Entry>' (default 'loudon')
export function composePreview(opts) {
  const {
    palaceRoot,
    relPath,
    frontmatter = {},
    body = '',
    kind: kindIn,
    summary,
    verify,
    scope: scopeIn,
    body_message = '',
    author = 'loudon',
  } = opts || {};

  if (!palaceRoot) {
    return { ok: false, status: 500, error: 'palaceRoot not configured' };
  }

  const allow = checkAllowList(relPath);
  if (!allow.allowed) {
    return { ok: false, status: 403, error: allow.reason };
  }

  if (!summary || typeof summary !== 'string' || summary.trim() === '') {
    return { ok: false, status: 422, errors: ['summary is required'] };
  }
  if (!verify || !VERIFY_VALUES.has(verify)) {
    return {
      ok: false, status: 422,
      errors: [`verify must be one of: ${[...VERIFY_VALUES].join(', ')}`],
    };
  }

  // Frontmatter validation (SCHEMA enforcement).
  const validation = validateFrontmatter(frontmatter);
  if (!validation.valid) {
    return { ok: false, status: 422, errors: validation.errors, warnings: validation.warnings };
  }

  // Read the current file (HEAD blob preferred; falls back to working-tree
  // file; empty string if it's a new entry).
  const beforeText = readCurrentEntry(palaceRoot, relPath);
  const afterText = emitEntryFile(frontmatter, body);

  if (beforeText === afterText) {
    return {
      ok: false, status: 422,
      errors: ['nothing changed — proposed file is byte-identical to current'],
    };
  }

  // Palace-aware diff (field-level frontmatter, body-changed flag).
  const fmDiff = diffEntryText(beforeText, afterText);

  // Derive Palace-* trailers (kind, entries, stages, vectors, verify, author).
  const isAdd = beforeText === '';
  const kind = kindIn || (isAdd ? 'deposit' : 'edit');
  if (!KNOWN_KINDS.has(kind)) {
    return { ok: false, status: 422, errors: [`kind "${kind}" is not in the spec enum`] };
  }

  const mdChanges = [{
    path: relPath,
    frontmatterChanges: fmDiff.frontmatterChanges,
    bodyChanged: fmDiff.bodyChanged,
    wasAdded: isAdd,
  }];
  const trailerLines = deriveTrailers({
    paths: [relPath],
    mdChanges,
    kind,
    verify,
    author,
  });

  const scope = scopeIn || basenameNoMd(relPath);
  const message = formatCommitMessage({
    kind,
    scope,
    summary,
    body: body_message,
    trailers: trailerLines,
  });

  const subject = scope ? `${kind}(${scope}): ${summary}` : `${kind}: ${summary}`;
  const udiff = makeUnifiedDiff(relPath, beforeText, afterText);

  return {
    ok: true,
    preview: {
      subject,
      trailers: trailerLines,
      message,
      udiff,
      frontmatterChanges: fmDiff.frontmatterChanges,
      bodyChanged: fmDiff.bodyChanged,
      wasAdded: isAdd,
      warnings: validation.warnings,
    },
  };
}

// Read the entry file as it is in the working tree (the safe, no-git baseline).
// HEAD blob comparison adds little here -- the form's "before" should match
// what the user just opened in the editor. Returns '' if the file does not
// exist (new-entry deposit case).
export function readCurrentEntry(palaceRoot, relPath) {
  const abs = resolve(palaceRoot, relPath);
  if (!existsSync(abs)) return '';
  try {
    return readFileSync(abs, 'utf8');
  } catch (_) {
    return '';
  }
}

// Generate a unified diff for the preview panel. Uses `git diff --no-index`
// so we get the same diff format the LOG deck renders -- consistency across
// the three decks.
//
// Pure-ish: writes both texts to a temp dir, runs `git diff --no-index`,
// returns its stdout (`git diff --no-index` exits 1 on differences -- treat
// that as the success case).
export function makeUnifiedDiff(relPath, before, after) {
  try {
    const dir = mkdtempSync(join(tmpdir(), 'palace-preview-'));
    const beforeFile = join(dir, 'before');
    const afterFile = join(dir, 'after');
    writeFileSync(beforeFile, before, 'utf8');
    writeFileSync(afterFile, after, 'utf8');
    let out = '';
    try {
      out = execFileSync(
        'git',
        ['diff', '--no-index', '--no-color', '--', beforeFile, afterFile],
        { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
      );
    } catch (e) {
      // exit 1 = files differ (the normal preview case). stdout is in e.stdout.
      out = (e && e.stdout) ? e.stdout : '';
    } finally {
      try { rmSync(dir, { recursive: true, force: true }); } catch (_) { /* ignore */ }
    }
    return rewriteDiffPaths(out, relPath);
  } catch (_) {
    // Fall back to a minimal hand-rolled diff stub on git failure.
    return `--- a/${relPath}\n+++ b/${relPath}\n[diff unavailable]\n`;
  }
}

// Replace the temp-file paths in the diff header with the real palace-relative
// path so the preview reads like a regular palace diff.
function rewriteDiffPaths(diff, relPath) {
  return diff
    .replace(/^diff --git a\/.+ b\/.+$/m, `diff --git a/${relPath} b/${relPath}`)
    .replace(/^--- a\/.+$/m, `--- a/${relPath}`)
    .replace(/^\+\+\+ b\/.+$/m, `+++ b/${relPath}`)
    .replace(/^--- \/dev\/null$/m, `--- /dev/null`);
}

function basenameNoMd(p) {
  if (typeof p !== 'string') return '';
  const slash = p.lastIndexOf('/');
  const base = slash === -1 ? p : p.slice(slash + 1);
  return base.replace(/\.md$/, '');
}

