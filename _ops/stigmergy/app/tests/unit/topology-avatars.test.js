import { describe, it, expect } from 'vitest';
import {
  buildIconByPath, attachIcons, avatarRadiusFor, avatarCount, AVATAR_RADIUS,
} from '../../src/lib/topology-avatars.js';

describe('buildIconByPath', () => {
  it('keys entries by path, keeping only those with icon art', () => {
    const entries = [
      { path: 'A.md', icon: 'A/A — icon.png' },
      { path: 'B.md', icon: null },
      { path: 'C.md' },                       // no icon field
      { path: 'D.md', icon: '   ' },          // blank → skipped
      { path: 'E.md', icon: 'E/E — icon.png' },
    ];
    const m = buildIconByPath(entries);
    expect(m.get('A.md')).toBe('A/A — icon.png');
    expect(m.get('E.md')).toBe('E/E — icon.png');
    expect(m.has('B.md')).toBe(false);
    expect(m.has('C.md')).toBe(false);
    expect(m.has('D.md')).toBe(false);
    expect(m.size).toBe(2);
  });

  it('tolerates null/undefined input', () => {
    expect(buildIconByPath(null).size).toBe(0);
    expect(buildIconByPath(undefined).size).toBe(0);
  });
});

describe('attachIcons', () => {
  it('stamps node.icon from the lookup, null when absent', () => {
    const nodes = [
      { id: 'a', path: 'A.md' },
      { id: 'b', path: 'B.md' },
      { id: 'x', path: undefined },
    ];
    const m = new Map([['A.md', 'A/A — icon.png']]);
    const out = attachIcons(nodes, m);
    expect(out).toBe(nodes); // mutates in place
    expect(nodes[0].icon).toBe('A/A — icon.png');
    expect(nodes[1].icon).toBeNull();
    expect(nodes[2].icon).toBeNull();
  });

  it('tolerates a non-Map lookup and empty nodes', () => {
    expect(() => attachIcons(null, null)).not.toThrow();
    const nodes = [{ id: 'a', path: 'A.md' }];
    attachIcons(nodes, undefined);
    expect(nodes[0].icon).toBeNull();
  });
});

describe('avatarRadiusFor', () => {
  it('returns the per-role avatar radius', () => {
    expect(avatarRadiusFor('hub')).toBe(AVATAR_RADIUS.hub);
    expect(avatarRadiusFor('orphan')).toBe(AVATAR_RADIUS.orphan);
    expect(avatarRadiusFor('default')).toBe(AVATAR_RADIUS.default);
  });
  it('falls back to the default radius for unknown roles', () => {
    expect(avatarRadiusFor('mystery')).toBe(AVATAR_RADIUS.default);
    expect(avatarRadiusFor(undefined)).toBe(AVATAR_RADIUS.default);
  });
  it('makes hubs the largest and orphans no larger than default', () => {
    expect(AVATAR_RADIUS.hub).toBeGreaterThan(AVATAR_RADIUS.default);
    expect(AVATAR_RADIUS.orphan).toBeLessThanOrEqual(AVATAR_RADIUS.default);
  });
});

describe('avatarCount', () => {
  it('counts nodes carrying icon art', () => {
    expect(avatarCount([{ icon: 'a' }, { icon: null }, { icon: 'b' }, {}])).toBe(2);
    expect(avatarCount([])).toBe(0);
    expect(avatarCount(null)).toBe(0);
  });
});
