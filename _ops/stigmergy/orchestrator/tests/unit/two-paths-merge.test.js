// Stage F Phase 4 verify gate: a choice_response selecting option A merges A's
// diff into the working branch, preserves B's branch, and leaves the tree clean.
// The human's pick is the ONLY trigger — no pick ⇒ no merge.

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { findWinningPick, resolveOutcome, mergeWinner, loserNote, preserveLoserOnPage, ALT_BLOCK_START } from '../../src/two-paths-merge.js';
import { buildChoiceResponse } from '../../../app/src/lib/richcontent.js';

const REQ = 'apo-steward-004';
const card = {
  schema_version: '1.0', id: 'two-paths-apo-card', ts: '2026-05-29T16:30:00-04:00',
  session_id: 's', from: 'Action Potential Oscillator', to: 'TRICKSTER', type: 'BROADCAST', board: 'TRICKSTER',
  health: { score: 'green', model: 'm' },
  payload: {
    kind: 'choice', choice_mode: 'pick', request_id: REQ,
    options: [
      { id: 'K-SWEEP', label: 'k', artifact_path: 'k.wav' },
      { id: 'DUAL-SWEEP', label: 'd', artifact_path: 'dual.wav' },
    ],
  },
};

describe('findWinningPick + resolveOutcome (pure)', () => {
  test('no choice_response → null outcome (no pick ⇒ no merge)', () => {
    expect(findWinningPick([], 'two-paths-apo-card')).toBeNull();
    expect(resolveOutcome({ card, messages: [] })).toBeNull();
  });

  test('a real pick resolves winner/loser to their branches', () => {
    const reply = buildChoiceResponse({ card, choice: 'K-SWEEP' });
    const outcome = resolveOutcome({ card, messages: [reply] });
    expect(outcome.winner).toEqual({ option_id: 'K-SWEEP', branch: 'two-paths/apo-steward-004/k-sweep' });
    expect(outcome.loser).toEqual({ option_id: 'DUAL-SWEEP', branch: 'two-paths/apo-steward-004/dual-sweep' });
    expect(loserNote(outcome)).toMatch(/DUAL-SWEEP.*alternative/);
  });

  test('a pick naming an option not on the card is ignored', () => {
    const reply = buildChoiceResponse({ card, choice: 'NONSENSE' });
    expect(resolveOutcome({ card, messages: [reply] })).toBeNull();
  });
});

describe('mergeWinner — round-trip on a throwaway repo', () => {
  let repo;
  const g = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();

  beforeAll(() => {
    repo = mkdtempSync(path.join(tmpdir(), 'tp-merge-'));
    g('init', '-q', '-b', 'main');
    g('config', 'user.email', 'test@example.com');
    g('config', 'user.name', 'Test');
    g('config', 'commit.gpgsign', 'false');
    writeFileSync(path.join(repo, 'README.md'), '# base\n');
    g('add', '-A'); g('commit', '-q', '-m', 'base');

    // Branch A — K-SWEEP — adds k.wav.txt
    g('checkout', '-q', '-b', 'two-paths/apo-steward-004/k-sweep');
    writeFileSync(path.join(repo, 'k.wav.txt'), 'k sweep render\n');
    g('add', '-A'); g('commit', '-q', '-m', 'k-sweep deliverable');

    // Branch B — DUAL-SWEEP — adds dual.wav.txt
    g('checkout', '-q', 'main');
    g('checkout', '-q', '-b', 'two-paths/apo-steward-004/dual-sweep');
    writeFileSync(path.join(repo, 'dual.wav.txt'), 'dual sweep render\n');
    g('add', '-A'); g('commit', '-q', '-m', 'dual-sweep deliverable');

    g('checkout', '-q', 'main'); // back to the working branch
  });
  afterAll(() => { if (repo) rmSync(repo, { recursive: true, force: true }); repo = null; });

  test('dry run changes nothing', () => {
    const reply = buildChoiceResponse({ card, choice: 'K-SWEEP' });
    const outcome = resolveOutcome({ card, messages: [reply] });
    const plan = mergeWinner({ repoRoot: repo, outcome }); // execute defaults false
    expect(plan.dry_run).toBe(true);
    expect(plan.executed).toBe(false);
    expect(existsSync(path.join(repo, 'k.wav.txt'))).toBe(false); // not merged yet
    expect(g('status', '--porcelain')).toBe('');
  });

  test('execute merges the winner (A), preserves the loser (B), leaves a clean tree', () => {
    const reply = buildChoiceResponse({ card, choice: 'K-SWEEP' });
    const outcome = resolveOutcome({ card, messages: [reply] });
    const res = mergeWinner({ repoRoot: repo, outcome, execute: true });

    expect(res.executed).toBe(true);
    // winner's file is now on main
    expect(existsSync(path.join(repo, 'k.wav.txt'))).toBe(true);
    expect(readFileSync(path.join(repo, 'k.wav.txt'), 'utf8')).toMatch(/k sweep render/);
    // loser's file is NOT on main
    expect(existsSync(path.join(repo, 'dual.wav.txt'))).toBe(false);
    // loser branch preserved
    expect(res.preserved_branch_exists).toBe(true);
    expect(g('rev-parse', '--verify', 'two-paths/apo-steward-004/dual-sweep')).toBeTruthy();
    // clean tree
    expect(g('status', '--porcelain')).toBe('');
    // the merge commit carries the pick rationale
    expect(g('log', '-1', '--pretty=%s')).toMatch(/merge K-SWEEP/);
  });

  test('refuses to merge without a resolved outcome (the gate)', () => {
    expect(() => mergeWinner({ repoRoot: repo, outcome: null, execute: true })).toThrow(/never merges without a human choice_response/);
  });
});

describe('preserveLoserOnPage — idempotent, render-invisible note', () => {
  let dir;
  afterAll(() => { if (dir) rmSync(dir, { recursive: true, force: true }); dir = null; });

  test('dry run changes nothing; execute appends once inside an HTML-comment block', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'tp-page-'));
    const entry = path.join(dir, 'Action Potential Oscillator.md');
    writeFileSync(entry, '---\ntitle: "Action Potential Oscillator"\n---\n# body\n');
    const outcome = { request_id: REQ, winner: { option_id: 'K-SWEEP', branch: 'b/k' }, loser: { option_id: 'DUAL-SWEEP', branch: 'b/d' } };
    const note = loserNote(outcome);

    expect(preserveLoserOnPage({ entryPath: entry, note }).dry_run).toBe(true);
    expect(readFileSync(entry, 'utf8')).not.toContain(ALT_BLOCK_START);

    preserveLoserOnPage({ entryPath: entry, note, execute: true });
    let text = readFileSync(entry, 'utf8');
    expect(text).toContain(ALT_BLOCK_START);
    expect(text).toContain(note);
    expect(text).toContain('# body'); // original content preserved

    // idempotent — re-applying the same note does not duplicate it
    preserveLoserOnPage({ entryPath: entry, note, execute: true });
    text = readFileSync(entry, 'utf8');
    expect(text.split(note).length - 1).toBe(1);
  });
});
