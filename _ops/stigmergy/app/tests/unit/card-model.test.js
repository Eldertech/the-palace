import { describe, it, expect } from 'vitest';
import {
  detectArtifactType, isArchived, normalizeCard, sortCards, verdictTone,
} from '../../src/lib/card-model.js';

describe('detectArtifactType', () => {
  it('maps audio/image/iframe/text/file by extension', () => {
    expect(detectArtifactType('x.wav')).toBe('audio');
    expect(detectArtifactType('x.PNG')).toBe('image');
    expect(detectArtifactType('x.html')).toBe('iframe');
    expect(detectArtifactType('x.md')).toBe('text');
    expect(detectArtifactType('x.bin')).toBe('file');
    expect(detectArtifactType(null)).toBe('none');
  });
});

describe('isArchived', () => {
  it('reads truthy archived flags', () => {
    expect(isArchived({ archived: 'true' })).toBe(true);
    expect(isArchived({ archived: 'YES' })).toBe(true);
    expect(isArchived({ archived: '1' })).toBe(true);
    expect(isArchived({ archived: 'false' })).toBe(false);
    expect(isArchived({})).toBe(false);
  });
});

describe('normalizeCard', () => {
  const fm = {
    target_name: 'Particle Synthesis',
    target_path: 'Projects/Particle Synthesis.md',
    purpose: 'koan',
    fv: 'I want to ship a prototype.',
    summary: 'A koan pressing the identity claim.',
    reasoning: 'Takes the claim at face value.',
    created: '2026-05-05',
    artifact_path: 'particle-koan.md',
    artifact_type: 'text',
    validator_verdict: 'pass',
    validator_note: 'Earns its form.',
    validator_iterations: '0',
  };

  it('normalizes a full text card with an inline body', () => {
    const c = normalizeCard({ id: 'card-038', frontmatter: fm, body: 'A koan...', artifactText: 'koan text' });
    expect(c.kind).toBe('enrichment_card');
    expect(c.id).toBe('card-038');
    expect(c.target_name).toBe('Particle Synthesis');
    expect(c.artifact_type).toBe('text');
    expect(c.artifact_text).toBe('koan text');
    expect(c.artifact_url).toBe('/api/file?path=' + encodeURIComponent('Enrichment/card-038/particle-koan.md'));
    expect(c.validator_verdict).toBe('pass');
  });

  it('falls back to the resolved artifact file when frontmatter omits the path', () => {
    const c = normalizeCard({ id: 'card-040', frontmatter: { target_name: 'X' }, artifactFile: 'thing.png' });
    expect(c.artifact).toBe('thing.png');
    expect(c.artifact_type).toBe('image');
    expect(c.artifact_text).toBeNull(); // not text → no inline body
    // The URL is percent-encoded for /api/file (slashes -> %2F), as the route expects.
    expect(c.artifact_url).toBe(`/api/file?path=${encodeURIComponent('Enrichment/card-040/thing.png')}`);
  });

  it('handles a card with no artifact at all', () => {
    const c = normalizeCard({ id: 'card-x', frontmatter: { target_name: 'Y' } });
    expect(c.artifact).toBeNull();
    expect(c.artifact_type).toBe('none');
    expect(c.artifact_url).toBeNull();
  });

  it('coerces non-string frontmatter values to strings', () => {
    const c = normalizeCard({ id: 'c', frontmatter: { validator_iterations: 1 } });
    expect(c.validator_iterations).toBe('1');
  });

  it('prefers frontmatter.created, else falls back to the passed-in (folder) created', () => {
    // frontmatter wins when present
    const a = normalizeCard({ id: 'c', frontmatter: { created: '2026-05-05' }, created: '2026-01-01T00:00:00Z' });
    expect(a.created).toBe('2026-05-05');
    // fallback used when frontmatter omits it
    const b = normalizeCard({ id: 'c', frontmatter: {}, created: '2026-01-01T00:00:00Z' });
    expect(b.created).toBe('2026-01-01T00:00:00Z');
    // neither → empty string (unchanged prior behavior)
    const c = normalizeCard({ id: 'c', frontmatter: {} });
    expect(c.created).toBe('');
  });
});

describe('sortCards', () => {
  it('sorts numerically by card id', () => {
    const out = sortCards([{ id: 'card-040' }, { id: 'card-038' }, { id: 'card-041' }]);
    expect(out.map((c) => c.id)).toEqual(['card-038', 'card-040', 'card-041']);
  });
});

describe('verdictTone', () => {
  it('maps verdicts to phosphor/warn/error tones', () => {
    expect(verdictTone('pass')).toContain('--phosphor');
    expect(verdictTone('revise-then-shipped')).toContain('--warn');
    expect(verdictTone('kill')).toContain('--error');
    expect(verdictTone('')).toContain('--phosphor-dim');
  });
});
