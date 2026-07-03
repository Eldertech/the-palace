import { describe, it, expect } from 'vitest';
import {
  parseLogMeta, parseNumstat, parsePorcelain,
  parseWorktreePorcelain, parseAheadBehind,
  FIELD_SEP, RECORD_SEP,
} from '../../src/lib/git-log-parse.js';

describe('parseLogMeta', () => {
  it('parses a single record', () => {
    const raw = ['abc123', 'Loudon', 'l@x.com', '2026-05-30T12:00:00-04:00', 'ops(x): do', 'body line']
      .join(FIELD_SEP) + RECORD_SEP;
    const out = parseLogMeta(raw);
    expect(out).toHaveLength(1);
    expect(out[0].hash).toBe('abc123');
    expect(out[0].shortHash).toBe('abc123');
    expect(out[0].authorName).toBe('Loudon');
    expect(out[0].subject).toBe('ops(x): do');
    expect(out[0].body).toBe('body line');
  });

  it('parses multiple records and multi-line bodies', () => {
    const r1 = ['h1', 'A', 'a@x', '2026-05-30T12:00:00Z', 's1', 'line1\nline2\nPalace-Kind: ops']
      .join(FIELD_SEP);
    const r2 = ['h2', 'B', 'b@x', '2026-05-29T12:00:00Z', 's2', '']
      .join(FIELD_SEP);
    const raw = r1 + RECORD_SEP + '\n' + r2 + RECORD_SEP;
    const out = parseLogMeta(raw);
    expect(out).toHaveLength(2);
    expect(out[0].body).toBe('line1\nline2\nPalace-Kind: ops');
    expect(out[1].subject).toBe('s2');
    expect(out[1].body).toBe('');
  });

  it('returns [] on empty', () => {
    expect(parseLogMeta('')).toEqual([]);
    expect(parseLogMeta(null)).toEqual([]);
  });
});

describe('parseNumstat', () => {
  it('parses files with adds/deletes and a binary', () => {
    const raw = [
      'h1',
      '10\t2\tFoo.md',
      '5\t0\tBar.md',
      '-\t-\timage.png',
    ].join('\n');
    const map = parseNumstat(RECORD_SEP + raw);
    const stat = map.get('h1');
    expect(stat.files).toHaveLength(3);
    expect(stat.added).toBe(15);
    expect(stat.deleted).toBe(2);
    expect(stat.files[2]).toEqual({ path: 'image.png', added: 0, deleted: 0, binary: true });
  });

  it('handles multiple commits', () => {
    const raw =
      RECORD_SEP + ['h1', '1\t1\tA.md'].join('\n') +
      RECORD_SEP + ['h2', '2\t0\tB.md'].join('\n');
    const map = parseNumstat(raw);
    expect(map.get('h1').added).toBe(1);
    expect(map.get('h2').added).toBe(2);
  });

  it('resolves a brace-rename path to the new path', () => {
    const raw = RECORD_SEP + ['h1', '0\t0\tsrc/{old => new}/file.md'].join('\n');
    const map = parseNumstat(raw);
    expect(map.get('h1').files[0].path).toBe('src/new/file.md');
  });

  it('resolves a plain-rename path to the new path', () => {
    const raw = RECORD_SEP + ['h1', '0\t0\told.md => new.md'].join('\n');
    const map = parseNumstat(raw);
    expect(map.get('h1').files[0].path).toBe('new.md');
  });

  it('returns empty map on empty', () => {
    expect(parseNumstat('').size).toBe(0);
  });
});

describe('parsePorcelain', () => {
  it('classifies staged, unstaged, untracked', () => {
    const raw = [
      'M  staged-only.md',
      ' M unstaged-only.md',
      'MM both.md',
      '?? untracked.md',
      'A  added.md',
    ].join('\n');
    const out = parsePorcelain(raw);
    expect(out.staged.map((s) => s.path)).toEqual(['staged-only.md', 'both.md', 'added.md']);
    expect(out.unstaged.map((s) => s.path)).toEqual(['unstaged-only.md', 'both.md']);
    expect(out.untracked.map((s) => s.path)).toEqual(['untracked.md']);
  });

  it('returns empty structure for a clean tree', () => {
    const out = parsePorcelain('');
    expect(out.staged).toEqual([]);
    expect(out.unstaged).toEqual([]);
    expect(out.untracked).toEqual([]);
  });

  it('dequotes a C-style quoted spaced path (untracked + modified)', () => {
    // git wraps paths with spaces/commas in double quotes in porcelain v1.
    const raw = [
      '?? "Brand New.md"',
      ' M "Palace development/Two Batons, One Board.md"',
    ].join('\n');
    const out = parsePorcelain(raw);
    expect(out.untracked.map((u) => u.path)).toContain('Brand New.md');
    expect(out.unstaged.map((u) => u.path)).toContain('Palace development/Two Batons, One Board.md');
  });

  it('dequotes octal UTF-8 escapes in a path', () => {
    // git escapes non-ASCII bytes as \NNN octal; "café.md" -> "caf\303\251.md".
    const out = parsePorcelain('?? "caf\\303\\251.md"');
    expect(out.untracked[0].path).toBe('café.md');
  });
});

describe('parseWorktreePorcelain', () => {
  it('parses two branch-attached worktrees', () => {
    const raw = [
      'worktree /Users/x/The Palace',
      'HEAD 1f9293e2742e215e69ee058588af851a6ccd5225',
      'branch refs/heads/main',
      '',
      'worktree /Users/x/palace-feature-log-git-state',
      'HEAD eb7cd970768762e68f564daf6134b45b40859de1',
      'branch refs/heads/feature/log-git-state',
      '',
    ].join('\n');
    const out = parseWorktreePorcelain(raw);
    expect(out).toHaveLength(2);
    expect(out[0].branch).toBe('main');
    expect(out[0].shortHead).toBe('1f9293e');
    expect(out[0].detached).toBe(false);
    expect(out[1].branch).toBe('feature/log-git-state'); // slashes preserved
    expect(out[1].head).toBe('eb7cd970768762e68f564daf6134b45b40859de1');
  });

  it('marks a detached worktree', () => {
    const raw = [
      'worktree /Users/x/palace-live',
      'HEAD e7c1a90aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'detached',
      '',
    ].join('\n');
    const [wt] = parseWorktreePorcelain(raw);
    expect(wt.detached).toBe(true);
    expect(wt.branch).toBeNull();
  });

  it('captures locked and prunable with reasons', () => {
    const raw = [
      'worktree /Users/x/palace-old',
      'HEAD 3c4d5e6aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'branch refs/heads/feature/blueline-text-anchor',
      'locked on removable media',
      'prunable gitdir file points to non-existent location',
      '',
    ].join('\n');
    const [wt] = parseWorktreePorcelain(raw);
    expect(wt.locked).toBe(true);
    expect(wt.lockedReason).toBe('on removable media');
    expect(wt.prunable).toBe(true);
    expect(wt.prunableReason).toBe('gitdir file points to non-existent location');
  });

  it('flags a bare main repo and returns [] on empty', () => {
    const [wt] = parseWorktreePorcelain('worktree /repo.git\nbare\n');
    expect(wt.bare).toBe(true);
    expect(parseWorktreePorcelain('')).toEqual([]);
    expect(parseWorktreePorcelain(null)).toEqual([]);
  });
});

describe('parseAheadBehind', () => {
  it('reads left=behind, right=ahead from base...branch', () => {
    // `git rev-list --left-right --count main...feature` => "3\t0" here means
    // the branch is 3 behind main and 0 ahead.
    expect(parseAheadBehind('3\t0')).toEqual({ behind: 3, ahead: 0 });
    expect(parseAheadBehind('0\t5\n')).toEqual({ behind: 0, ahead: 5 });
  });

  it('returns null when unparseable (no upstream / fatal)', () => {
    expect(parseAheadBehind("fatal: no upstream configured for branch 'x'")).toBeNull();
    expect(parseAheadBehind('')).toBeNull();
    expect(parseAheadBehind(null)).toBeNull();
  });
});
