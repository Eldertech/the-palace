// Unit tests for the pure pieces of the armed-write path: the verbatim
// frontmatter split and the edit-op applier (append / prepend / rewrite, with
// the exactly-once-or-refuse discipline that keeps the Companion honest).

import { describe, it, expect } from 'vitest';
import { splitRawFrontmatter, applyOp, setForwardVector, addLinkToFrontmatter } from '../../server/armed-write.js';

describe('splitRawFrontmatter', () => {
  it('splits frontmatter from body, fences kept verbatim', () => {
    const text = '---\ntitle: X\nstage: seed\n---\n# Body\n\nhello.\n';
    const { fmBlock, body } = splitRawFrontmatter(text);
    expect(fmBlock).toBe('---\ntitle: X\nstage: seed\n---\n');
    expect(body).toBe('# Body\n\nhello.\n');
    // round-trip: fmBlock + body reconstructs the file exactly
    expect(fmBlock + body).toBe(text);
  });
  it('returns empty fmBlock when there is no frontmatter', () => {
    const { fmBlock, body } = splitRawFrontmatter('# Just a body\n');
    expect(fmBlock).toBe('');
    expect(body).toBe('# Just a body\n');
  });
});

describe('applyOp', () => {
  const body = '# Body\n\nThe lived body is the seat of perception.\n';

  it('append adds a trailing paragraph', () => {
    const r = applyOp(body, { op: 'append', text: 'A closing line about li.' });
    expect(r.ok).toBe(true);
    expect(r.body).toMatch(/seat of perception\.\n\nA closing line about li\.\n$/);
  });

  it('prepend adds a leading paragraph', () => {
    const r = applyOp(body, { op: 'prepend', text: 'An opening frame.' });
    expect(r.ok).toBe(true);
    expect(r.body.startsWith('An opening frame.\n\n# Body')).toBe(true);
  });

  it('rewrite replaces one exact occurrence', () => {
    const r = applyOp(body, { op: 'rewrite', find: 'seat of perception', replace: 'medium of perception' });
    expect(r.ok).toBe(true);
    expect(r.body).toMatch(/medium of perception/);
    expect(r.body).not.toMatch(/seat of perception/);
  });

  it('rewrite refuses when find is absent', () => {
    const r = applyOp(body, { op: 'rewrite', find: 'not in the text', replace: 'x' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not present/);
  });

  it('rewrite refuses when find is ambiguous (appears twice)', () => {
    const r = applyOp('the the the', { op: 'rewrite', find: 'the', replace: 'a' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ambiguous/);
  });

  it('refuses empty append text and unknown ops', () => {
    expect(applyOp(body, { op: 'append', text: '   ' }).ok).toBe(false);
    expect(applyOp(body, { op: 'frobnicate' }).ok).toBe(false);
    expect(applyOp(body, null).ok).toBe(false);
  });

  it('graffiti pins a canonical HTML-comment scrawl at the top by default', () => {
    const r = applyOp(body, { op: 'graffiti', text: 'come back to the li thread' });
    expect(r.ok).toBe(true);
    expect(r.body.startsWith('<!-- graffiti: come back to the li thread -->\n\n# Body')).toBe(true);
  });

  it('graffiti pins at the point right after a unique find anchor', () => {
    const r = applyOp(body, { op: 'graffiti', text: 'verify this', find: 'seat of perception' });
    expect(r.ok).toBe(true);
    // the mark lands after the line carrying the anchor, not at the top
    expect(r.body).toMatch(/seat of perception\.\n\n<!-- graffiti: verify this -->/);
    expect(r.body.startsWith('<!--')).toBe(false);
  });

  it('graffiti strips a worker-supplied comment fence or leading "graffiti:"', () => {
    const r = applyOp(body, { op: 'graffiti', text: '<!-- graffiti: already wrapped -->' });
    expect(r.ok).toBe(true);
    expect(r.body.startsWith('<!-- graffiti: already wrapped -->\n\n')).toBe(true);
    // no double-wrapping
    expect(r.body).not.toMatch(/graffiti: <!--/);
    expect(r.body).not.toMatch(/already wrapped -->\s*-->/);
  });

  it('graffiti refuses empty text, a "-->" injection, and a missing/ambiguous anchor', () => {
    expect(applyOp(body, { op: 'graffiti', text: '   ' }).ok).toBe(false);
    expect(applyOp(body, { op: 'graffiti', text: 'breaks --> out' }).ok).toBe(false);
    expect(applyOp(body, { op: 'graffiti', text: 'x', find: 'absent' }).ok).toBe(false);
    expect(applyOp('the the', { op: 'graffiti', text: 'x', find: 'the' }).ok).toBe(false);
  });
});

describe('setForwardVector', () => {
  const fm = '---\ntitle: X\ntype: concept\nstage: seed\nforward_vector: "I want to grow."\n---\n';

  it('replaces only the forward_vector line, leaving every other line byte-identical', () => {
    const r = setForwardVector(fm, 'I will keep teaching what I become.');
    expect(r.ok).toBe(true);
    expect(r.fmBlock).toMatch(/forward_vector: "I will keep teaching what I become\."/);
    expect(r.oldValue).toBe('I want to grow.');
    // the other lines are untouched (no field re-order, no restyle)
    expect(r.fmBlock).toMatch(/title: X\ntype: concept\nstage: seed/);
    // exactly one forward_vector line
    expect((r.fmBlock.match(/^forward_vector:/gm) || []).length).toBe(1);
  });

  it('quotes and escapes a value with quotes/colons (round-trips as a string)', () => {
    const r = setForwardVector(fm, 'I hold the "tension": relations over nodes.');
    expect(r.ok).toBe(true);
    expect(r.fmBlock).toMatch(/forward_vector: "I hold the \\"tension\\": relations over nodes\."/);
  });

  it('inserts the field before the closing fence when it is absent', () => {
    const noVec = '---\ntitle: X\ntype: concept\n---\n';
    const r = setForwardVector(noVec, 'I appear now.');
    expect(r.ok).toBe(true);
    expect(r.oldValue).toBe(null);
    expect(r.fmBlock).toMatch(/type: concept\nforward_vector: "I appear now\."\n---\n/);
  });

  it('refuses empty text, a multi-line value, and a block-scalar vector', () => {
    expect(setForwardVector(fm, '   ').ok).toBe(false);
    expect(setForwardVector(fm, 'line one\nline two').ok).toBe(false);
    expect(setForwardVector('---\nforward_vector: |\n  multi\n  line\n---\n', 'x').ok).toBe(false);
    expect(setForwardVector('', 'x').ok).toBe(false);
  });
});

describe('addLinkToFrontmatter', () => {
  const withLinks =
    '---\ntitle: X\ntype: concept\nlinks:\n  - target: "[[Alpha]]"\n    type: mirrors\n    label: echoes\nstage: seed\n---\n';

  it('appends a new block item after the last existing link, before the next field', () => {
    const r = addLinkToFrontmatter(withLinks, { target: 'Beta', type: 'connects-to', label: 'rhymes-with' });
    expect(r.ok).toBe(true);
    expect(r.fmBlock).toContain('  - target: "[[Beta]]"\n    type: connects-to\n    label: rhymes-with\n');
    // inserted inside the links block, BEFORE the trailing `stage:` field
    expect(r.fmBlock.indexOf('[[Beta]]')).toBeLessThan(r.fmBlock.indexOf('stage: seed'));
    // the pre-existing Alpha item is untouched (churn-free)
    expect(r.fmBlock).toContain('  - target: "[[Alpha]]"\n    type: mirrors\n    label: echoes');
    expect(r.linkChange).toEqual({ target: 'Beta', type: 'connects-to', label: 'rhymes-with' });
  });

  it('omits the label line when no label is given', () => {
    const r = addLinkToFrontmatter(withLinks, { target: '[[Gamma]]', type: 'deepens' });
    expect(r.ok).toBe(true);
    expect(r.fmBlock).toContain('  - target: "[[Gamma]]"\n    type: deepens\n');
    expect(r.fmBlock).not.toMatch(/\[\[Gamma\]\][\s\S]*?label:/);
    expect(r.linkChange).toEqual({ target: 'Gamma', type: 'deepens' });
  });

  it('accepts a bare title OR a [[wikilink]] target, emitting the quoted wikilink either way', () => {
    expect(addLinkToFrontmatter(withLinks, { target: 'Delta', type: 'enables' }).fmBlock).toContain('target: "[[Delta]]"');
    expect(addLinkToFrontmatter(withLinks, { target: '[[Delta]]', type: 'enables' }).fmBlock).toContain('target: "[[Delta]]"');
  });

  it('refuses a duplicate (same target + type), regardless of title vs [[wikilink]] / case', () => {
    expect(addLinkToFrontmatter(withLinks, { target: 'Alpha', type: 'mirrors' }).ok).toBe(false);
    expect(addLinkToFrontmatter(withLinks, { target: '[[Alpha]]', type: 'mirrors' }).ok).toBe(false);
    expect(addLinkToFrontmatter(withLinks, { target: 'alpha', type: 'mirrors' }).ok).toBe(false);
  });

  it('allows the same target with a DIFFERENT type (not a duplicate)', () => {
    const r = addLinkToFrontmatter(withLinks, { target: 'Alpha', type: 'couples-with' });
    expect(r.ok).toBe(true);
    expect(r.fmBlock).toContain('  - target: "[[Alpha]]"\n    type: couples-with');
  });

  it('creates a links: block when the field is absent, before the closing fence', () => {
    const noLinks = '---\ntitle: X\ntype: concept\nstage: seed\n---\n';
    const r = addLinkToFrontmatter(noLinks, { target: 'Omega', type: 'member-of' });
    expect(r.ok).toBe(true);
    expect(r.fmBlock).toMatch(/stage: seed\nlinks:\n  - target: "\[\[Omega\]\]"\n    type: member-of\n---\n/);
  });

  it('replaces an inline `links: []` with the block form', () => {
    const empty = '---\ntitle: X\nlinks: []\nstage: seed\n---\n';
    const r = addLinkToFrontmatter(empty, { target: 'Iota', type: 'exemplifies' });
    expect(r.ok).toBe(true);
    expect(r.fmBlock).toContain('links:\n  - target: "[[Iota]]"\n    type: exemplifies');
    expect(r.fmBlock).not.toMatch(/links:\s*\[\]/);
  });

  it('appends to a links block that is the last field (no trailing field)', () => {
    const tail = '---\ntitle: X\nlinks:\n  - target: "[[Alpha]]"\n    type: mirrors\n---\n';
    const r = addLinkToFrontmatter(tail, { target: 'Beta', type: 'connects-to' });
    expect(r.ok).toBe(true);
    expect(r.fmBlock).toMatch(/type: mirrors\n  - target: "\[\[Beta\]\]"\n    type: connects-to\n---\n/);
  });

  it('matches non-canonical (zero-indent) item indentation', () => {
    const zero = '---\ntitle: X\nlinks:\n- target: "[[Alpha]]"\n  type: mirrors\n---\n';
    const r = addLinkToFrontmatter(zero, { target: 'Beta', type: 'connects-to' });
    expect(r.ok).toBe(true);
    expect(r.fmBlock).toContain('\n- target: "[[Beta]]"\n  type: connects-to\n');
  });

  it('refuses empty target / empty type / no frontmatter', () => {
    expect(addLinkToFrontmatter(withLinks, { target: '   ', type: 'mirrors' }).ok).toBe(false);
    expect(addLinkToFrontmatter(withLinks, { target: 'Z', type: '  ' }).ok).toBe(false);
    expect(addLinkToFrontmatter('', { target: 'Z', type: 'mirrors' }).ok).toBe(false);
  });

  it('leaves every non-links line byte-identical (churn-free)', () => {
    const r = addLinkToFrontmatter(withLinks, { target: 'Beta', type: 'connects-to' });
    expect(r.fmBlock).toContain('title: X\ntype: concept\n');
    expect(r.fmBlock).toContain('stage: seed\n---\n');
  });
});
