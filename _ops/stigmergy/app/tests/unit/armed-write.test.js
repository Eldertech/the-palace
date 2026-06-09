// Unit tests for the pure pieces of the armed-write path: the verbatim
// frontmatter split and the edit-op applier (append / prepend / rewrite, with
// the exactly-once-or-refuse discipline that keeps the Companion honest).

import { describe, it, expect } from 'vitest';
import { splitRawFrontmatter, applyOp } from '../../server/armed-write.js';

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
