import { describe, test, expect } from 'vitest';
import { parseEntry, sectionProse, fingerprint } from '../../../../rich-face/parse.js';

// _ops/rich-face/parse.js — the one parser the rich face and fingerprint.mjs
// share. A section list or a fingerprint that moves here moves on every page.

const FM = '---\ntitle: Demo\ntype: hub\n---\n';
const keys = (e) => e.sections.map((s) => s.key);
const dupes = (e) => keys(e).filter((k, i, a) => a.indexOf(k) !== i);

describe('what comes before the first heading', () => {
  test('a blank line between frontmatter and the H1 opens no section of its own', () => {
    const e = parseEntry(FM + '\n# Demo\n\nSome words.\n\n## Next\n\nMore.\n');
    expect(keys(e)).toEqual(['demo', 'next']);
    expect(e.sections[0].level).toBe(1);
  });

  test('blank lines before the H1 with no frontmatter open nothing either', () => {
    const e = parseEntry('\n\n\n# Demo\n\nSome words.\n');
    expect(keys(e)).toEqual(['demo']);
  });

  test('the same words, with and without the blank line, fingerprint the same', async () => {
    const tight = parseEntry(FM + '# Demo\n\nSome words.\n');
    const loose = parseEntry(FM + '\n\n# Demo\n\nSome words.\n');
    expect(keys(loose)).toEqual(keys(tight));
    expect(await fingerprint(sectionProse(loose.sections[0]))).toBe(await fingerprint(sectionProse(tight.sections[0])));
  });

  test('real content before the H1 joins the H1\'s section — never a second section with one key', () => {
    const e = parseEntry(FM + '\n<!-- a note to the next agent -->\n\n# Demo\n\nSome words.\n\n## Next\n\nMore.\n');
    expect(keys(e)).toEqual(['demo', 'next']);
    expect(dupes(e)).toEqual([]);
    expect(e.sections[0].heading).toBe('Demo');
    expect(e.sections[0].blocks.map((b) => b.md)).toEqual(['<!-- a note to the next agent -->', 'Some words.']);
  });

  test('content before an H1 that differs from the title still joins the H1', () => {
    const e = parseEntry('---\ntitle: Something Else\n---\nA stray line.\n\n# Demo\n\nSome words.\n');
    expect(keys(e)).toEqual(['demo']);
    expect(e.sections[0].blocks).toHaveLength(2);
  });

  test('a hero above the H1 is still the page\'s hero, and opens no section', () => {
    const e = parseEntry(FM + '\n![[Demo — hero.png]]\n\n# Demo\n\nSome words.\n');
    expect(e.hero).toBe('Demo — hero.png');
    expect(keys(e)).toEqual(['demo']);
  });

  test('with no H1, opening words still get an opening section keyed to the title', () => {
    const e = parseEntry(FM + '\nOpening words.\n\n## Next\n\nMore.\n');
    expect(keys(e)).toEqual(['demo', 'next']);
    expect(e.sections[0].level).toBe(1);
    expect(e.sections[0].blocks[0].md).toBe('Opening words.');
  });

  test('with no H1 and nothing but blank lines before the first H2, there is no empty opening', () => {
    const e = parseEntry(FM + '\n\n## Next\n\nMore.\n');
    expect(keys(e)).toEqual(['next']);
  });

  test('a later H1 still opens a section of its own', () => {
    const e = parseEntry(FM + '# Demo\n\nSome words.\n\n# Second\n\nMore.\n');
    expect(keys(e)).toEqual(['demo', 'second']);
  });
});
