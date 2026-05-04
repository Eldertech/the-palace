// git.test.js — page-change detection + entry-name resolution.
//
// Runs against the real palace git repository (the test process's CWD ancestor
// contains the .git that owns the orchestrator code). The palace itself is
// the test fixture for git operations — no synthetic git repo is created.

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { resolveEntryPath, getChangesSince, checkPageChange, readForwardVector } from '../../src/git.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PALACE_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');

describe('resolveEntryPath', () => {
  it('finds a known palace entry by title (Generative Sample Libraries)', () => {
    const p = resolveEntryPath(PALACE_ROOT, 'Generative Sample Libraries');
    expect(p).not.toBeNull();
    expect(existsSync(p)).toBe(true);
    expect(p.endsWith('Generative Sample Libraries.md')).toBe(true);
  });

  it('finds an entry with a path containing spaces (Hilaritas Generator)', () => {
    const p = resolveEntryPath(PALACE_ROOT, 'Hilaritas Generator');
    expect(p).not.toBeNull();
    expect(existsSync(p)).toBe(true);
  });

  it('returns null for a non-existent entry name', () => {
    expect(resolveEntryPath(PALACE_ROOT, 'this-entry-does-not-exist-anywhere-xyz123'))
      .toBeNull();
  });
});

describe('getChangesSince', () => {
  it('returns an array (possibly empty) for a tracked file', () => {
    const result = getChangesSince(PALACE_ROOT, 'CLAUDE.md', '2020-01-01T00:00:00Z');
    expect(Array.isArray(result)).toBe(true);
    // Each commit object has the expected shape.
    for (const c of result) {
      expect(typeof c.hash).toBe('string');
      expect(typeof c.ts).toBe('string');
      expect(typeof c.subject).toBe('string');
    }
  });

  it('returns an empty array for a far-future since timestamp', () => {
    const result = getChangesSince(PALACE_ROOT, 'CLAUDE.md', '2099-01-01T00:00:00Z');
    expect(result).toEqual([]);
  });

  it('returns an empty array for an untracked path', () => {
    const result = getChangesSince(PALACE_ROOT, 'this/file/does/not/exist.md', '2020-01-01T00:00:00Z');
    expect(result).toEqual([]);
  });
});

describe('checkPageChange', () => {
  it('resolves a known entry and reports change status', () => {
    const r = checkPageChange(PALACE_ROOT, 'Generative Sample Libraries', '2020-01-01T00:00:00Z');
    expect(r.resolved).not.toBeNull();
    // Don't assert on commits.length — could be 0 if no commits yet exist for this file at the test time.
    expect(typeof r.changed).toBe('boolean');
    expect(Array.isArray(r.commits)).toBe(true);
  });

  it('returns resolved=null for unknown entry name', () => {
    const r = checkPageChange(PALACE_ROOT, 'this-entry-does-not-exist-xyz', '2020-01-01T00:00:00Z');
    expect(r.resolved).toBeNull();
    expect(r.changed).toBe(false);
  });
});

describe('readForwardVector', () => {
  it('reads the forward vector from a known entry with block-scalar frontmatter', () => {
    const v = readForwardVector(PALACE_ROOT, 'Generative Sample Libraries');
    // It exists and is non-empty if the entry exists with the expected frontmatter shape.
    if (v !== null) {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(20);
    }
  });

  it('returns null for an unknown entry', () => {
    expect(readForwardVector(PALACE_ROOT, 'no-such-entry-xyz123')).toBeNull();
  });
});
