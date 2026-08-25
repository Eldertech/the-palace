#!/usr/bin/env node
// commit-msg hook logic (the tolerant backstop).
//
// Invoked by git as `commit-msg <path-to-message-file>`. The installed hook in
// .git/hooks/commit-msg is a thin shim that calls this with node, so the logic
// stays tracked and testable here.
//
// Contract (STIGMERGY v1.0 §The Commit Specification, "tolerate-and-flag"):
//   - A spec-conformant message passes through untouched.
//   - An out-of-band message (Obsidian's git integration, a raw CLI commit)
//     is NOT rejected. It is annotated in place with honest trailers
//     (Palace-Kind: ops, Palace-Verify: couldnt, Palace-Author, Palace-Annotated)
//     so the LOG still renders it truthfully.
//   - It NEVER hard-blocks. The only non-zero exit is an internal error
//     (can't read the file), and even then we exit 0 to avoid wedging a commit
//     (respecting "never wedge Loudon's Obsidian or CLI commit").
//
// Author resolution is best-effort: git's configured email maps loudon's
// address to `loudon`; anything else falls back to the configured name.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validateCommitMessage, annotateOutOfBand } from '../src/lib/commit-spec.js';

function gitConfig(key) {
  try {
    return execFileSync('git', ['config', key], { encoding: 'utf8' }).trim();
  } catch (_) {
    return '';
  }
}

function resolveAuthor() {
  const email = gitConfig('user.email').toLowerCase();
  if (email === 'loudon@gmail.com') return 'loudon';
  const name = gitConfig('user.name');
  return name ? name.toLowerCase().split(/\s+/)[0] : null;
}

export function runHook(msgPath, { author = null } = {}) {
  let text;
  try {
    text = readFileSync(msgPath, 'utf8');
  } catch (e) {
    // Can't read the message file -- do not block the commit.
    process.stderr.write(`[palace commit-msg] could not read ${msgPath}: ${e.message}\n`);
    return 0;
  }

  const { valid, errors, warnings } = validateCommitMessage(text);
  if (valid) {
    // Conformant -- pass through. Surface warnings but never block.
    for (const w of warnings) process.stderr.write(`[palace commit-msg] note: ${w}\n`);
    return 0;
  }

  // Out-of-band -- annotate in place, do not reject.
  const annotated = annotateOutOfBand(text, { author: author ?? resolveAuthor() });
  try {
    writeFileSync(msgPath, annotated, 'utf8');
    process.stderr.write('[palace commit-msg] non-spec commit annotated (ops/couldnt) -- not blocked.\n');
    // Say WHY. The reason was computed and then discarded, so a well-formed
    // deposit demoted to ops/couldnt by one bad trailer looked identical to a
    // raw Obsidian commit. The most common cause is prose in Palace-Verify,
    // which is an enum (verified|unverified|couldnt), not a sentence.
    for (const e of errors || []) process.stderr.write(`[palace commit-msg]   why: ${e}\n`);
    for (const w of warnings || []) process.stderr.write(`[palace commit-msg]   note: ${w}\n`);
  } catch (e) {
    process.stderr.write(`[palace commit-msg] could not annotate ${msgPath}: ${e.message} -- passing through.\n`);
  }
  return 0;
}

// CLI entry: `node commit-msg-hook.mjs <msgfile>`.
const invokedDirectly = process.argv[1] && process.argv[1].endsWith('commit-msg-hook.mjs');
if (invokedDirectly) {
  const msgPath = process.argv[2];
  if (!msgPath) {
    process.stderr.write('usage: commit-msg-hook.mjs <message-file>\n');
    process.exit(0); // never wedge
  }
  process.exit(runHook(msgPath));
}
