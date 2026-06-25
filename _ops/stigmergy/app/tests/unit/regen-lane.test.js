// Unit tests for the regen-lane pure helpers: the board-message builders (which
// must validate against the STRICT §2.2 schema), the render-result extractor,
// and the summary. The fire/reap side-effects are covered by the integration
// test (which runs regen_one.py --mock against a temp git palace).

import { describe, it, expect } from 'vitest';
import { validateMessage } from '@stigmergy/core/schema';
import {
  slugify, regenSummary, extractRenderResult,
  buildRegenStartedMessage, buildRegenDoneMessage, buildRegenFailedMessage,
} from '../../server/regen-lane.js';

const TS = '2026-06-25T12:00:00Z';
const base = { title: 'Kuramoto Coupling', entryPath: 'Kuramoto Coupling.md', turnId: 'companion-kuramoto-1', ts: TS };

describe('regenSummary', () => {
  it('names what was remade', () => {
    expect(regenSummary('hero')).toMatch(/regenerate hero via companion/);
    expect(regenSummary('icon')).toMatch(/regenerate avatar via companion/);
    expect(regenSummary('both')).toMatch(/regenerate hero \+ icon via companion/);
  });
});

describe('regen board-message builders', () => {
  it('started is a valid §2.2 BROADCAST from the Maker, carrying the turn + target', () => {
    const m = buildRegenStartedMessage({ ...base, target: 'hero', idiom: 'Bauhaus woodcut', note: 'brighter' });
    expect(validateMessage(m).valid).toBe(true);
    expect(m.type).toBe('BROADCAST');
    expect(m.board).toBe('GENERAL');
    expect(m.from).toBe('Hero and Avatar Maker');
    expect(m.payload.kind).toBe('companion_regen_started');
    expect(m.payload.turn_id).toBe(base.turnId);     // window correlates by turn id
    expect(m.payload.target).toBe('hero');
    expect(m.payload.idiom).toBe('Bauhaus woodcut');
  });

  it('done is a valid §2.2 PROOF carrying the commit + the placed image paths', () => {
    const m = buildRegenDoneMessage({
      ...base, target: 'both', commit: 'abc1234',
      heroRel: 'Kuramoto Coupling/Kuramoto Coupling — hero.png',
      iconRel: 'Kuramoto Coupling/Kuramoto Coupling — icon.png', idiom: 'Klee gouache',
    });
    expect(validateMessage(m).valid).toBe(true);
    expect(m.type).toBe('PROOF');
    expect(m.payload.kind).toBe('companion_regen_done');
    expect(m.payload.commit).toBe('abc1234');
    expect(m.payload.status).toBe('committed');
    expect(m.payload.hero_rel).toMatch(/— hero\.png$/);
    expect(m.payload.icon_rel).toMatch(/— icon\.png$/);
  });

  it('failed is a valid §2.2 BROADCAST carrying the error', () => {
    const m = buildRegenFailedMessage({ ...base, target: 'icon', error: 'render timed out' });
    expect(validateMessage(m).valid).toBe(true);
    expect(m.payload.kind).toBe('companion_regen_failed');
    expect(m.payload.error).toBe('render timed out');
  });

  it('uses stub health (model + score only) — these posts are hand-written by Node', () => {
    const m = buildRegenStartedMessage({ ...base, target: 'both' });
    expect(m.health.score).toBe('green');
    expect(typeof m.health.model).toBe('string');
    expect(m.health._orchestrator_metadata.dispatch_mode).toBe('hand-authored');
  });
});

describe('extractRenderResult', () => {
  it('parses a clean one-line result', () => {
    const r = extractRenderResult('{"ok":true,"target":"both","stage":["a.png"]}');
    expect(r.ok).toBe(true);
    expect(r.stage).toEqual(['a.png']);
  });

  it('finds the LAST result object past stray log lines', () => {
    const raw = 'some log\n{"ok":false}\nmore noise\n{"ok":true,"target":"hero","stage":["h.png"]}\n';
    const r = extractRenderResult(raw);
    expect(r.ok).toBe(true);
    expect(r.target).toBe('hero');
  });

  it('returns null on garbage / no result object', () => {
    expect(extractRenderResult('no json here')).toBeNull();
    expect(extractRenderResult('')).toBeNull();
    expect(extractRenderResult('{"reply":"not a render result"}')).toBeNull();
  });
});

describe('slugify', () => {
  it('kebabs a title', () => {
    expect(slugify('Kuramoto Coupling')).toBe('kuramoto-coupling');
    expect(slugify('')).toBe('entry');
  });
});
