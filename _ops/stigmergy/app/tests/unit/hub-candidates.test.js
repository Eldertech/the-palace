// Unit: findHubCandidates — concept entries over the inbound typed-link
// threshold. Pure over entry records, so no fs is needed.

import { describe, test, expect } from 'vitest';
import { findHubCandidates, inboundDegree } from '../../src/lib/hub-candidates.js';

const rec = (path, type, targets = []) => ({
  path, title: path.replace(/\.md$/, ''), type, links: targets.map((t) => ({ target: t })),
});

// Center (concept) is pointed at by A–F (6); AlreadyHub is pointed at by G–K (5)
// but is type:hub; Lonely (concept) has no inbound; Person (type person) has 6
// inbound but is not a concept.
function fixture() {
  return [
    rec('Center.md', 'concept'),
    ...['A', 'B', 'C', 'D', 'E', 'F'].map((n) => rec(`${n}.md`, 'concept', ['Center'])),
    rec('Lonely.md', 'concept'),
    rec('AlreadyHub.md', 'hub'),
    ...['G', 'H', 'I', 'J', 'K'].map((n) => rec(`${n}.md`, 'concept', ['AlreadyHub'])),
    rec('Person.md', 'person'),
    ...['L', 'M', 'N', 'O', 'P', 'Q'].map((n) => rec(`${n}.md`, 'concept', ['Person'])),
  ];
}

describe('inboundDegree', () => {
  test('counts distinct sources, excludes self-links and off-palace targets', () => {
    const records = [
      rec('Center.md', 'concept', ['Center', 'Ghost']),  // self-link + off-palace, both ignored
      rec('A.md', 'concept', ['Center']),
      rec('B.md', 'concept', ['Center', 'Center']),       // same source twice → counts once
    ];
    const deg = inboundDegree(records);
    expect(deg.get('Center.md')).toBe(2);  // A + B (not Center itself, not Ghost)
  });
});

describe('findHubCandidates', () => {
  test('returns concept entries at/over threshold, most-connected first', () => {
    const out = findHubCandidates(fixture(), { threshold: 5 });
    expect(out).toEqual([{ path: 'Center.md', title: 'Center', inbound_degree: 6 }]);
  });

  test('excludes already-hub and non-concept entries even when over threshold', () => {
    const out = findHubCandidates(fixture(), { threshold: 5 });
    const paths = out.map((c) => c.path);
    expect(paths).not.toContain('AlreadyHub.md'); // type hub
    expect(paths).not.toContain('Person.md');     // type person
  });

  test('threshold is honored', () => {
    expect(findHubCandidates(fixture(), { threshold: 7 })).toEqual([]); // Center is only 6
    expect(findHubCandidates(fixture(), { threshold: 6 }).map((c) => c.path)).toEqual(['Center.md']);
  });

  test('lonely concept (no inbound) is never a candidate', () => {
    const out = findHubCandidates(fixture(), { threshold: 1 });
    expect(out.map((c) => c.path)).not.toContain('Lonely.md');
  });
});
