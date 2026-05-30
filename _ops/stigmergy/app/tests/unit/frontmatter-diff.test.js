import { describe, it, expect } from 'vitest';
import { diffFrontmatter, diffEntryText, changeLabel } from '../../src/lib/frontmatter-diff.js';

describe('diffFrontmatter', () => {
  it('detects a scalar change with stage prioritized first', () => {
    const changes = diffFrontmatter(
      { title: 'X', stage: 'seed', energy: 'low' },
      { title: 'X', stage: 'sprout', energy: 'high' },
    );
    expect(changes[0].field).toBe('stage');
    expect(changes[0].kind).toBe('changed');
    expect(changes[0].before).toBe('seed');
    expect(changes[0].after).toBe('sprout');
    expect(changes.find((c) => c.field === 'energy')).toBeTruthy();
  });

  it('detects added and removed fields', () => {
    const changes = diffFrontmatter(
      { title: 'X', confidence: 'working' },
      { title: 'X', status: 'active' },
    );
    expect(changes.find((c) => c.field === 'status')?.kind).toBe('added');
    expect(changes.find((c) => c.field === 'confidence')?.kind).toBe('removed');
  });

  it('treats links as a set (reorder = no change)', () => {
    const a = { links: [{ target: '[[A]]', type: 'mirrors' }, { target: '[[B]]', type: 'deepens' }] };
    const b = { links: [{ target: '[[B]]', type: 'deepens' }, { target: '[[A]]', type: 'mirrors' }] };
    expect(diffFrontmatter(a, b)).toEqual([]);
  });

  it('reports added/removed links', () => {
    const a = { links: [{ target: '[[A]]', type: 'mirrors' }] };
    const b = { links: [{ target: '[[A]]', type: 'mirrors' }, { target: '[[C]]', type: 'enables' }] };
    const changes = diffFrontmatter(a, b);
    const lc = changes.find((c) => c.field === 'links');
    expect(lc.addedLinks).toHaveLength(1);
    expect(lc.addedLinks[0].target).toBe('C');
    expect(lc.removedLinks).toHaveLength(0);
  });

  it('treats pillars as a set', () => {
    const changes = diffFrontmatter(
      { pillars: ['tools', 'creation'] },
      { pillars: ['creation', 'tools', 'philosophy'] },
    );
    const pc = changes.find((c) => c.field === 'pillars');
    expect(pc.addedPillars).toEqual(['philosophy']);
    expect(pc.removedPillars).toEqual([]);
  });

  it('diffs nested objects (agency_profile) by value', () => {
    const changes = diffFrontmatter(
      { agency_profile: { tools: 'a' } },
      { agency_profile: { tools: 'b' } },
    );
    expect(changes.find((c) => c.field === 'agency_profile')?.kind).toBe('changed');
  });
});

describe('diffEntryText', () => {
  it('separates frontmatter changes from body changes', () => {
    const before = '---\ntitle: X\nstage: seed\n---\nbody one\n';
    const after = '---\ntitle: X\nstage: sprout\n---\nbody two\n';
    const d = diffEntryText(before, after);
    expect(d.frontmatterChanges[0].field).toBe('stage');
    expect(d.bodyChanged).toBe(true);
  });

  it('detects body-only change', () => {
    const before = '---\ntitle: X\n---\nold body\n';
    const after = '---\ntitle: X\n---\nnew body\n';
    const d = diffEntryText(before, after);
    expect(d.frontmatterChanges).toEqual([]);
    expect(d.bodyChanged).toBe(true);
  });

  it('detects frontmatter-only change', () => {
    const before = '---\ntitle: X\nstage: seed\n---\nsame body\n';
    const after = '---\ntitle: X\nstage: growing\n---\nsame body\n';
    const d = diffEntryText(before, after);
    expect(d.frontmatterChanges).toHaveLength(1);
    expect(d.bodyChanged).toBe(false);
  });

  it('handles a file added from nothing', () => {
    const d = diffEntryText('', '---\ntitle: New\nstage: seed\n---\nbody\n');
    expect(d.hadFrontmatter).toBe(false);
    expect(d.hasFrontmatter).toBe(true);
    expect(d.frontmatterChanges.length).toBeGreaterThan(0);
  });
});

describe('changeLabel', () => {
  it('labels a stage transition', () => {
    expect(changeLabel({ field: 'stage', kind: 'changed', before: 'seed', after: 'sprout' }))
      .toBe('stage: seed -> sprout');
  });
  it('labels forward_vector as just "changed"', () => {
    expect(changeLabel({ field: 'forward_vector', kind: 'changed', before: 'a', after: 'b' }))
      .toBe('forward_vector changed');
  });
  it('labels link adds/removes', () => {
    expect(changeLabel({ field: 'links', addedLinks: [{}, {}], removedLinks: [{}] }))
      .toBe('+2 links -1 links');
  });
  it('labels an added field', () => {
    expect(changeLabel({ field: 'status', kind: 'added', after: 'active' }))
      .toBe('status added: active');
  });
  it('labels a removed field', () => {
    expect(changeLabel({ field: 'confidence', kind: 'removed' }))
      .toBe('confidence removed');
  });
});
