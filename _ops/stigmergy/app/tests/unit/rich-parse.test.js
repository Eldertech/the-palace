import { describe, test, expect } from 'vitest';
import { parseEntry, sectionProse, fingerprint, mediaRefs } from '../../../../rich-face/parse.js';

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

describe('the door — a line linking the rich face — is dropped by the line', () => {
  const DOOR = '*Also as a [rich face ↗](http://localhost:5173/rich/?entry=Demo) — this page with its sound.*';
  const prose = (e, i = 0) => e.sections[i].blocks.filter((b) => b.type === 'prose').map((b) => b.md);

  test('the words around a door line in the same paragraph stay', () => {
    const e = parseEntry('# Demo\n\nReal words here.\n' + DOOR + '\nMore words.\n');
    expect(prose(e)).toEqual(['Real words here.\nMore words.']);
  });

  test('a door on its own paragraph leaves nothing behind (Kuramoto\'s shape)', () => {
    const e = parseEntry(FM + '# Demo\n\n![[Demo — hero.png]]\n\n' + DOOR + '\n\nThe first real paragraph.\n');
    expect(e.hero).toBe('Demo — hero.png');
    expect(prose(e)).toEqual(['The first real paragraph.']);
  });

  test('a door paragraph right after a figure is not its caption', () => {
    const e = parseEntry('# Demo\n\n![[pic.png]]\n\n' + DOOR + '\n');
    const fig = e.sections[0].blocks.find((b) => b.type === 'figure');
    expect(fig.caption).toBe('');
  });

  test('a door line under an embed in the same paragraph is not its caption', () => {
    const e = parseEntry('# Demo\n\n![[pic.png]]\n' + DOOR + '\n');
    const fig = e.sections[0].blocks.find((b) => b.type === 'figure');
    expect(fig).toBeTruthy();
    expect(fig.caption).toBe('');
    expect(prose(e)).toEqual([]);
  });

  test('a door line inside a blockquote figure is not part of its caption', () => {
    const e = parseEntry('# Demo\n\n> ![[pic.png]]\n> ' + DOOR + '\n> the real caption\n');
    expect(e.sections[0].blocks[0].caption).toBe('the real caption');
  });

  test('a door above a first H2, with no H1, opens no empty section', () => {
    const e = parseEntry(FM + DOOR + '\n\n## Next\n\nMore.\n');
    expect(keys(e)).toEqual(['next']);
  });

  test('adding a door anywhere in a section leaves its fingerprint alone', async () => {
    const plain = '# Demo\n\nOne paragraph,\nstill going.\n\nAnother.\n';
    const before = await fingerprint(sectionProse(parseEntry(plain).sections[0]));
    for (const withDoor of [
      '# Demo\n\n' + DOOR + '\n\nOne paragraph,\nstill going.\n\nAnother.\n',
      '# Demo\n\nOne paragraph,\n' + DOOR + '\nstill going.\n\nAnother.\n',
      '# Demo\n\nOne paragraph,\nstill going.\n\nAnother.\n' + DOOR + '\n',
    ]) expect(await fingerprint(sectionProse(parseEntry(withDoor).sections[0]))).toBe(before);
  });

  test('inside a code fence a door-shaped line is just text, and the fence stays', () => {
    const e = parseEntry('# Demo\n\n```md\n[rich face](/rich/?entry=Demo)\n```\n');
    expect(prose(e)).toEqual(['```md\n[rich face](/rich/?entry=Demo)\n```']);
  });
});

describe('media references', () => {
  test('a stray % in a link does not fail the page', () => {
    expect(() => mediaRefs('[the chart](growth-100%.png)')).not.toThrow();
    expect(mediaRefs('[the chart](growth-100%.png)')[0].name).toBe('growth-100%.png');
    expect(() => parseEntry('# Demo\n\n> [the chart](growth-100%.png)\n> a caption\n')).not.toThrow();
  });

  test('a well-formed escape still decodes', () => {
    expect(mediaRefs('[a take](my%20take.wav)')[0].name).toBe('my take.wav');
  });

  // Every extension mediaRefs accepts, a link line of it in a blockquote figure
  // is media, not caption.
  test.each(['mp4', 'webm', 'mov', 'wav', 'mp3', 'ogg', 'm4a', 'flac', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'html', 'htm'])(
    'a [label](file.%s) line is media, not caption', (ext) => {
      expect(mediaRefs(`[listen](take.${ext})`)).toHaveLength(1);
      const e = parseEntry(`# Demo\n\n> [listen](take.${ext})\n> the caption\n`);
      expect(e.sections[0].blocks[0]).toMatchObject({ type: 'figure', caption: 'the caption' });
    });
});
