import { describe, it, expect } from 'vitest';
import {
  validateCommitMessage, annotateOutOfBand, deriveTrailers, formatCommitMessage,
} from '../../src/lib/commit-spec.js';

describe('validateCommitMessage', () => {
  it('accepts a spec-conformant message', () => {
    const msg = [
      'deposit(Foo): name the foo concept',
      '',
      'A body.',
      '',
      'Palace-Kind: deposit',
      'Palace-Entry: Foo',
      'Palace-Verify: verified',
      'Palace-Author: claude',
    ].join('\n');
    const r = validateCommitMessage(msg);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.parsed.kind).toBe('deposit');
  });

  it('rejects a free-prose subject', () => {
    const r = validateCommitMessage('just did some stuff');
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/not in/);
  });

  it('rejects an unknown subject kind', () => {
    const r = validateCommitMessage('checkpoint(palace): full state');
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/not a known kind/);
  });

  it('rejects an unknown Palace-Kind trailer', () => {
    const msg = 'edit(Foo): x\n\nPalace-Kind: nonsense';
    const r = validateCommitMessage(msg);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => /not a known kind/.test(e))).toBe(true);
  });

  it('rejects a bad Palace-Verify value', () => {
    const msg = 'edit(Foo): x\n\nPalace-Kind: edit\nPalace-Verify: maybe';
    const r = validateCommitMessage(msg);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => /Palace-Verify/.test(e))).toBe(true);
  });

  it('warns (not errors) on the retired "Deposit —" subject, and nudges to deposit(<id>):', () => {
    // Recognized as a deposit ceremony (so it is NOT annotated ops), but the
    // LOG-deck reader will not self-classify it — warn the author at commit time.
    const r = validateCommitMessage('Deposit — Foo — 1 new entry\n\nA body.');
    expect(r.valid).toBe(true); // still valid — a real deposit, just old-form
    expect(r.warnings.some((w) => /retired deposit subject/.test(w))).toBe(true);
    expect(r.warnings.some((w) => /deposit\(<id>\):/.test(w))).toBe(true);
  });

  it('does NOT warn about the retired form for the structured deposit(<id>): subject', () => {
    const r = validateCommitMessage('deposit(D-2026-07-02-FOO): name the foo\n\nPalace-Kind: deposit');
    expect(r.warnings.some((w) => /retired deposit subject/.test(w))).toBe(false);
  });

  it('does NOT warn when a "Deposit —" subject carries a Palace-Kind: deposit trailer', () => {
    // The trailer makes the LOG-deck reader classify it correctly, so no nudge.
    const r = validateCommitMessage('Deposit — Foo\n\nPalace-Kind: deposit\nPalace-Verify: verified');
    expect(r.warnings.some((w) => /retired deposit subject/.test(w))).toBe(false);
  });

  it('warns (not errors) when a kind disagrees', () => {
    const msg = 'edit(Foo): x\n\nPalace-Kind: deposit\nPalace-Verify: verified';
    const r = validateCommitMessage(msg);
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => /disagrees/.test(w))).toBe(true);
  });

  it('accepts the mixed kind and ops sub-scopes (Revision 2)', () => {
    expect(validateCommitMessage('mixed(audit): swept 24 entries\n\nPalace-Kind: mixed\nPalace-Verify: verified').valid).toBe(true);
    expect(validateCommitMessage('ops(stigmergy): build phase\n\nPalace-Kind: ops\nPalace-Verify: verified').valid).toBe(true);
  });

  it('accepts palace ceremony subjects (Weave / Schema Ceremony / Baton)', () => {
    expect(validateCommitMessage('Weave — 2026-06-16 — 82 links added, 9 flags closed').valid).toBe(true);
    expect(validateCommitMessage('Schema Ceremony — canon membership = frontmatter — v1.13').valid).toBe(true);
    expect(validateCommitMessage('Baton — handoff to the next Claude').valid).toBe(true);
    // ceremony kind maps through for the LOG
    expect(validateCommitMessage('Weave — 2026-06-16 — x').parsed.kind).toBe('weave');
    // a non-ceremony capitalized prose subject is still rejected
    expect(validateCommitMessage('Checkpoint — full state dump').valid).toBe(false);
  });

  it('skips leading comment lines (raw hook input)', () => {
    const msg = '# please enter a commit message\n\ndeposit(Foo): real subject\n\nPalace-Kind: deposit\nPalace-Verify: verified';
    expect(validateCommitMessage(msg).valid).toBe(true);
  });

  it('flags an empty message', () => {
    expect(validateCommitMessage('').valid).toBe(false);
    expect(validateCommitMessage('# only comments\n').valid).toBe(false);
  });
});

describe('annotateOutOfBand', () => {
  it('appends ops/couldnt/author to an unstructured commit', () => {
    const out = annotateOutOfBand('quick fix from obsidian', { author: 'loudon' });
    expect(out).toMatch(/Palace-Kind: ops/);
    expect(out).toMatch(/Palace-Verify: couldnt/);
    expect(out).toMatch(/Palace-Author: loudon/);
    expect(out).toMatch(/Palace-Annotated: commit-msg-hook/);
  });

  it('preserves existing trailers and only adds missing ones', () => {
    const msg = 'edit(Foo): x\n\nPalace-Kind: edit\nPalace-Verify: verified';
    const out = annotateOutOfBand(msg, { author: 'claude' });
    expect(out.match(/Palace-Kind:/g)).toHaveLength(1);
    expect(out.match(/Palace-Verify:/g)).toHaveLength(1);
    expect(out).toMatch(/Palace-Author: claude/);
  });

  it('is idempotent (annotating twice adds nothing new)', () => {
    const once = annotateOutOfBand('raw commit', { author: 'loudon' });
    const twice = annotateOutOfBand(once, { author: 'loudon' });
    expect(twice).toBe(once);
  });

  it('never removes content (only adds)', () => {
    const msg = 'some message\nwith two lines';
    const out = annotateOutOfBand(msg);
    expect(out).toContain('some message');
    expect(out).toContain('with two lines');
  });
});

describe('deriveTrailers', () => {
  it('derives Palace-Entry per touched knowledge md', () => {
    const t = deriveTrailers({
      paths: ['Foo.md', 'Bar.md', '_ops/stigmergy/app/x.js'],
      kind: 'edit', verify: 'verified',
    });
    expect(t).toContain('Palace-Entry: Foo');
    expect(t).toContain('Palace-Entry: Bar');
    expect(t).toContain('Palace-Kind: edit');
    expect(t).toContain('Palace-Verify: verified');
    expect(t).toContain('Palace-Author: claude');
  });

  it('derives Palace-Stage from a stage frontmatter change', () => {
    const t = deriveTrailers({
      paths: ['Foo.md'],
      mdChanges: [{ path: 'Foo.md', frontmatterChanges: [{ field: 'stage', kind: 'changed', before: 'seed', after: 'sprout' }] }],
      kind: 'edit', verify: 'verified',
    });
    expect(t).toContain('Palace-Stage: Foo: seed->sprout');
  });

  it('derives Palace-Vector when forward_vector changed', () => {
    const t = deriveTrailers({
      paths: ['Foo.md'],
      mdChanges: [{ path: 'Foo.md', frontmatterChanges: [{ field: 'forward_vector', kind: 'changed' }] }],
      kind: 'edit', verify: 'unverified',
    });
    expect(t).toContain('Palace-Vector: Foo: changed');
  });

  it('derives a born stage for a newly-added entry', () => {
    const t = deriveTrailers({
      paths: ['New.md'],
      mdChanges: [{ path: 'New.md', wasAdded: true, frontmatterChanges: [{ field: 'stage', kind: 'added', after: 'seed' }] }],
      kind: 'deposit', verify: 'verified',
    });
    expect(t).toContain('Palace-Stage: New: born->seed');
  });

  it('includes campaign and resolves when given', () => {
    const t = deriveTrailers({
      paths: ['Foo.md'], kind: 'weave', verify: 'verified',
      campaign: 'weave-2026-05-30', resolves: ['queue-7'],
    });
    expect(t).toContain('Palace-Campaign: weave-2026-05-30');
    expect(t).toContain('Palace-Resolves: queue-7');
  });

  it('honors an explicit entries override', () => {
    const t = deriveTrailers({
      paths: ['Foo.md', 'Bar.md'], explicitEntries: ['Foo'],
      kind: 'edit', verify: 'verified',
    });
    expect(t).toContain('Palace-Entry: Foo');
    expect(t).not.toContain('Palace-Entry: Bar');
  });

  it('de-dupes exact-duplicate trailer lines', () => {
    const t = deriveTrailers({
      paths: ['Foo.md', 'sub/Foo.md'],
      kind: 'edit', verify: 'verified',
    });
    expect(t.filter((l) => l === 'Palace-Entry: Foo')).toHaveLength(1);
  });
});

describe('formatCommitMessage', () => {
  it('assembles subject + body + trailers', () => {
    const msg = formatCommitMessage({
      kind: 'deposit', scope: 'Foo', summary: 'name it',
      body: 'the why', trailers: ['Palace-Kind: deposit', 'Palace-Verify: verified'],
    });
    expect(msg).toBe('deposit(Foo): name it\n\nthe why\n\nPalace-Kind: deposit\nPalace-Verify: verified\n');
  });

  it('omits the scope parens when no scope', () => {
    const msg = formatCommitMessage({ kind: 'edit', summary: 'x', trailers: ['Palace-Kind: edit'] });
    expect(msg.startsWith('edit: x\n')).toBe(true);
  });

  it('round-trips through validateCommitMessage', () => {
    const msg = formatCommitMessage({
      kind: 'edit', scope: 'Foo', summary: 'tweak',
      trailers: deriveTrailers({ paths: ['Foo.md'], kind: 'edit', verify: 'verified' }),
    });
    expect(validateCommitMessage(msg).valid).toBe(true);
  });
});
