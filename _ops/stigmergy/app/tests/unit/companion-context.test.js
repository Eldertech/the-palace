// Unit tests for the Companion context resolver — the pure function that turns
// "where the user is" (deck + URL selection) into the grounding descriptor the
// window/adapter/lane all dispatch on.

import { describe, it, expect } from 'vitest';
import { resolveContext, contextKey, contextLabel, isEntryContext } from '../../src/lib/companion-context.js';

describe('resolveContext', () => {
  it('grounds in the open entry on STATE', () => {
    expect(resolveContext({ deck: 'STATE', entryPath: 'Spinoza.md' }))
      .toEqual({ kind: 'entry', path: 'Spinoza.md' });
  });

  it('falls back to app_feedback on STATE with no entry open', () => {
    expect(resolveContext({ deck: 'STATE', entryPath: null }))
      .toEqual({ kind: 'app_feedback', deck: 'STATE' });
  });

  it('grounds in STIGMERGY (app_feedback) on every other deck with no selection', () => {
    for (const deck of ['LOG', 'TRICKSTER', 'QUEUE', 'STEWARDS']) {
      expect(resolveContext({ deck })).toEqual({ kind: 'app_feedback', deck });
    }
  });

  it('grounds in the pending decision on TRICKSTER when a request is current', () => {
    const req = { request_id: 'req-1', project: 'Waveguide Synthesizer', ask: 'pick a model', options: [] };
    const ctx = resolveContext({ deck: 'TRICKSTER', tricksterRequest: req });
    expect(ctx.kind).toBe('trickster_request');
    expect(ctx.project).toBe('Waveguide Synthesizer');
    expect(ctx.request_id).toBe('req-1');
  });

  it('falls back to app_feedback on TRICKSTER when no request is pending', () => {
    expect(resolveContext({ deck: 'TRICKSTER', tricksterRequest: null }))
      .toEqual({ kind: 'app_feedback', deck: 'TRICKSTER' });
  });

  it('is SSR-safe with no args', () => {
    expect(resolveContext()).toEqual({ kind: 'app_feedback', deck: null });
  });
});

describe('contextKey', () => {
  it('is stable + distinct per grounding', () => {
    expect(contextKey({ kind: 'entry', path: 'A.md' })).toBe('entry:A.md');
    expect(contextKey({ kind: 'entry', path: 'B.md' })).toBe('entry:B.md');
    expect(contextKey({ kind: 'app_feedback', deck: 'LOG' })).toBe('app:LOG');
    expect(contextKey(null)).toBe('none');
  });
});

describe('contextLabel + isEntryContext', () => {
  it('labels each kind for the readout', () => {
    expect(contextLabel({ kind: 'entry', title: 'Spinoza', path: 'Spinoza.md' })).toBe('Spinoza');
    expect(contextLabel({ kind: 'app_feedback', deck: 'LOG' })).toBe('STIGMERGY · log');
    expect(contextLabel({ kind: 'trickster_request', project: 'Waveguide Synthesizer' })).toBe('Waveguide Synthesizer');
  });

  it('marks only the entry kind as editable-in-place', () => {
    expect(isEntryContext({ kind: 'entry', path: 'A.md' })).toBe(true);
    expect(isEntryContext({ kind: 'app_feedback', deck: 'LOG' })).toBe(false);
    expect(isEntryContext(null)).toBe(false);
  });
});
