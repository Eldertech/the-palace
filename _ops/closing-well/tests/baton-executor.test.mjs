// baton-executor.test.mjs — the regression test that was missing.
//
// `_ops/closing-well/README.md` claimed this executor was "unit-tested end to end."
// It was not: no test file referenced it, and the only verification was a manual run
// at build time (commit c4c2fdf). That gap is why the hardcoded On-pickup checklist
// could go stale for seven weeks without anything noticing — the ceremony's
// three-state lifecycle (claim → close, 2026-07-07) landed in the spec and never
// reached the script's private copy.
//
// So this tests the seam that actually broke: does a written baton carry the ONE
// canonical checklist, verbatim, with the load-bearing close beats intact?
//
// Run:  node --test _ops/closing-well/tests/*.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PALACE = resolve(HERE, '../../..');
const EXECUTOR = join(PALACE, '_ops/closing-well/baton-executor.mjs');
const FRAGMENT = join(PALACE, '_ops/Baton Ceremony/Baton Ceremony — on-pickup.md');
const HEADING = '## On pickup';

/** The checklist as it lives in its single home. */
function canonicalFooter() {
  const raw = readFileSync(FRAGMENT, 'utf8');
  return raw.slice(raw.indexOf(HEADING)).trim();
}

/**
 * Write a baton into a throwaway tree and return its text.
 *
 * `--tree` redirects where the baton + parent pointer land; `--owner` stays the real
 * palace because that is where the shared machinery lives (board-post.mjs and the
 * validator). Without `--post` the announce is only validated, never appended — this
 * test never touches the live board.
 */
function writeBatonInScratch({ entry = 'Test Entry', move = 'a one-sentence move' } = {}) {
  const tree = mkdtempSync(join(tmpdir(), 'baton-exec-'));
  try {
    writeFileSync(join(tree, `${entry}.md`), `# ${entry}\n\nA stand-in entry.\n`);
    const bodyFile = join(tree, 'body.md');
    writeFileSync(bodyFile, '## Move\nA one-sentence move.\n\n## Next move\nDo the thing.\n');

    execFileSync('node', [
      EXECUTOR,
      '--entry', entry,
      '--move', move,
      '--body-file', bodyFile,
      '--session-id', 'test',
      '--owner', PALACE,
      '--tree', tree,
      '--write',
    ], { encoding: 'utf8', stdio: 'pipe' });

    return readFileSync(join(tree, entry, `${entry} — baton.md`), 'utf8');
  } finally {
    rmSync(tree, { recursive: true, force: true });
  }
}

test('a written baton carries the canonical checklist verbatim', () => {
  const baton = writeBatonInScratch();
  const canon = canonicalFooter();
  assert.ok(baton.includes(canon),
    'the baton footer does not match _ops/Baton Ceremony/Baton Ceremony — on-pickup.md.\n'
    + 'If the checklist changed, edit the fragment — never a second copy in the executor.');
});

test('the checklist carries both lifecycle beats, not just the catch', () => {
  const baton = writeBatonInScratch();
  // The 2026-07-07 lifecycle split is the thing that went missing. Each of these is
  // a beat whose absence silently retires a card or strands work.
  for (const beat of [
    'pickup-handoff.mjs',   // claim, with lifecycle: claim — not a hand-posted pickup
    'close-handoff.mjs',    // the ONLY thing that retires a card
    '--commit',             // a close cites its evidence
    '--partial',            // complete, or re-baton the rest
    'CLAIMED',              // the card stays visible in between
  ]) {
    assert.ok(baton.includes(beat), `the written checklist is missing "${beat}"`);
  }
});

test('the pre-lifecycle instructions are gone', () => {
  const baton = writeBatonInScratch();
  const footer = baton.slice(baton.indexOf(HEADING));
  // The stale text told the catcher to mark-caught-and-delete at PICKUP. Following it
  // erases the work on a fumble and leaves the board card wrong.
  assert.ok(!/Mark it caught: remove the "Active Baton" section/.test(footer),
    'the executor is emitting the pre-2026-07-07 delete-at-pickup checklist again');
});

test('a missing fragment fails loud, never writes a footerless baton', () => {
  const tree = mkdtempSync(join(tmpdir(), 'baton-exec-nofrag-'));
  try {
    // The executor resolves the checklist relative to ITS OWN location, so a copy of
    // the script with no sibling fragment is the missing-fragment case. It must refuse
    // before writing anything — a baton without the checklist is unfinished, because
    // the catcher reads the baton and never the ceremony.
    mkdirSync(join(tree, '_ops/closing-well'), { recursive: true });
    cpSync(EXECUTOR, join(tree, '_ops/closing-well/baton-executor.mjs'));
    writeFileSync(join(tree, 'Test Entry.md'), '# Test Entry\n');
    const bodyFile = join(tree, 'body.md');
    writeFileSync(bodyFile, '## Move\nx\n');

    assert.throws(() => execFileSync('node', [
      join(tree, '_ops/closing-well/baton-executor.mjs'),
      '--entry', 'Test Entry', '--move', 'm', '--body-file', bodyFile,
      '--session-id', 'test', '--owner', PALACE, '--tree', tree, '--write',
    ], { encoding: 'utf8', stdio: 'pipe' }),
    'the executor ran with no canonical checklist available — it must refuse instead');
  } finally {
    rmSync(tree, { recursive: true, force: true });
  }
});
