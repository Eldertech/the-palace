// Unit: findLabelCandidates — the mechanical detection half of label_enrichment
// (typed links with a §4 type but no label, both ends resolvable entries).

import { describe, test, expect } from 'vitest';
import { findLabelCandidates } from '../../src/lib/label-candidates.js';

// walkEntryRecords-shape record: { path, title, type, links:[{target,type,label}] }
const link = (target, type, label = null) => ({ target, type, label });
const rec = (path, links, extra = {}) => ({ path, title: path.replace(/\.md$/, ''), type: 'concept', links, ...extra });

describe('findLabelCandidates', () => {
  test('finds label-less typed links whose target resolves; skips labeled / off-palace / self', () => {
    const records = [
      rec('A.md', [
        link('B', 'mirrors'),           // label-less, B resolves -> candidate
        link('C', 'deepens', 'grounds'), // already labeled -> skip
        link('Ghost', 'connects-to'),   // off-palace target -> skip
        link('A', 'mirrors'),           // self-link -> skip
      ]),
      rec('B.md', []),
      rec('C.md', []),
    ];
    const out = findLabelCandidates(records);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ source: 'A.md', target: 'B.md', type: 'mirrors' });
  });

  test('excludes non-§1 source entries (machinery / bundle frontmatter)', () => {
    const records = [
      rec('Prompt.md', [link('B', 'mirrors')], { type: 'agent-prompt' }),
      rec('Bundle.md', [link('B', 'mirrors')], { type: null }),
      rec('Real.md', [link('B', 'mirrors')]),
      rec('B.md', []),
    ];
    expect(findLabelCandidates(records).map((c) => c.source)).toEqual(['Real.md']);
  });

  test('stable order by (source, target, type)', () => {
    const records = [
      rec('Z.md', [link('B', 'mirrors')]),
      rec('A.md', [link('C', 'deepens'), link('B', 'mirrors')]),
      rec('B.md', []), rec('C.md', []),
    ];
    const out = findLabelCandidates(records).map((c) => `${c.source}->${c.target}`);
    expect(out).toEqual(['A.md->B.md', 'A.md->C.md', 'Z.md->B.md']);
  });
});
