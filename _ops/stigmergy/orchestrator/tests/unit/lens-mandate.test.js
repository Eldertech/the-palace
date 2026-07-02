import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateMessage } from '@stigmergy/core/schema';
import { buildLensMandate, LENS_BOARD, LENS_CONFIRM_THRESHOLD } from '../../src/lens-mandate.js';

// Pull the `const message = { ... };` object literal out of the mandate's
// embedded ```javascript code fence and construct it for real, filling in the
// placeholders a woken agent would fill in. This is a regression guard for
// exactly the bug an independent review caught: the example silently omitted
// `_orchestrator_metadata.dispatch_mode`, which made the real validator reject
// it as an incomplete Path-1 (live-API) message — every future lensing
// session would have followed the instructions verbatim and failed to ever
// reach WEAVE. Asserting on the STRING (as the other tests do) can't catch
// this; only running the actual object through the actual validator can.
function extractExampleMessage(promptText) {
  const match = promptText.match(/const message = (\{[\s\S]*?\n\};)/);
  if (!match) throw new Error('could not find the embedded `const message = {...}` example in the mandate');
  const literal = match[1].slice(0, -1) // drop the trailing `;`
    .replace(/<a fresh id>/g, 'test-id')
    .replace(/<your session id>/g, 'test-session')
    .replace(/<your model id>/g, 'claude-opus-4-8')
    .replace(/<the specific passage you read>/g, 'a passage')
    .replace(/<1-5>/g, '4')
    .replace(/<your attempt 1, or the corrected attempt 2 if attempt 1 failed the check>/g, 'a reading')
    .replace(/<how the self-check went — including "attempt 1 failed, here is why" if it did>/g, 'checked out')
    .replace(/'link' \| 'deposit' \| 'none'/g, "'link'")
    .replace(/<what it would be>/g, 'a candidate edge');
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal});`)();
}

// buildLensMandate wakes GLASS as itself (reusing buildEphemeralPrompt) and
// asks it to read SUBJECT through its own apparatus, per [[The Lens]]. These
// tests pin: both pages' identities are present, the two-attempt fidelity
// procedure is intact, the report goes to the board (never a direct write),
// and the not-found/no-frontmatter/same-page edges behave.

describe('buildLensMandate — read SUBJECT through GLASS', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  function makePage(root, { home, stage = 'growing', body = 'BODY-MARKER', vector = 'I strive.', withFrontmatter = true } = {}) {
    const fm = withFrontmatter
      ? `---\ntitle: "${home}"\nstage: ${stage}\nforward_vector: "${vector}"\n---\n# ${home}\n${body}\n`
      : `# ${home}\n${body}\n`;
    writeFileSync(path.join(root, `${home}.md`), fm);
  }

  function makePalace() {
    root = mkdtempSync(path.join(tmpdir(), 'palace-lens-'));
    makePage(root, { home: 'Glass Page', vector: 'I want to see everything through my own apparatus.' });
    makePage(root, { home: 'Subject Page', body: 'SUBJECT-MARKER-TEXT' });
    return root;
  }

  test('wakes the glass as itself, injects the subject text, carries the two-attempt procedure', () => {
    makePalace();
    const r = buildLensMandate({ palaceRoot: root, glassTitle: 'Glass Page', subjectTitle: 'Subject Page' });

    expect(r.ok).toBe(true);
    expect(r.status).toBe('built');
    expect(r.glass).toBe('Glass Page');
    expect(r.subject).toBe('Subject Page');

    // glass wakes as itself (the underlying awaken framing is intact)
    expect(r.full).toContain('You are awake');
    expect(r.full).toContain('This is you — Glass Page');
    expect(r.full).toContain('I want to see everything through my own apparatus.');

    // subject is injected as content to read, not as a second identity
    expect(r.full).toContain('SUBJECT-MARKER-TEXT');
    expect(r.full).toMatch(/read a passage of another page through your own conceptual apparatus/i);

    // the two-attempt fidelity discipline survives
    expect(r.full).toMatch(/Attempt 1 — the read/);
    expect(r.full).toMatch(/Attempt 2 — the fidelity self-check/);
    expect(r.full).toMatch(/A lensing that finds nothing is a valid, honest result/i);

    // the three payoff types
    expect(r.full).toContain('**link**');
    expect(r.full).toContain('**deposit**');
    expect(r.full).toContain('**none**');

    // reports to the board, never writes the candidate directly
    expect(r.full).toContain(`board: '${LENS_BOARD}'`);
    expect(r.full).toMatch(/do not edit either page's frontmatter or add the link yourself/i);
    expect(r.full).toContain(`${LENS_CONFIRM_THRESHOLD} or higher`);
  });

  test('the embedded example blackboard message actually passes the real strict validator', () => {
    makePalace();
    const r = buildLensMandate({ palaceRoot: root, glassTitle: 'Glass Page', subjectTitle: 'Subject Page' });
    const example = extractExampleMessage(r.full);
    example.ts = new Date().toISOString(); // the mandate computes this at post-time; fill it in for the check
    const result = validateMessage(example);
    expect(result.valid, `example message failed validation: ${JSON.stringify(result.errors)}`).toBe(true);
  });

  test('an optional note from Loudon rides after the procedure, not instead of it', () => {
    makePalace();
    const r = buildLensMandate({ palaceRoot: root, glassTitle: 'Glass Page', subjectTitle: 'Subject Page', loudonNote: 'focus on the third section' });
    expect(r.full).toMatch(/Loudon's extra note for this lensing/);
    expect(r.full).toContain('focus on the third section');
    expect(r.full).toMatch(/Attempt 1 — the read/); // procedure still present
  });

  test('glass and subject cannot be the same page', () => {
    makePalace();
    const r = buildLensMandate({ palaceRoot: root, glassTitle: 'Glass Page', subjectTitle: 'Glass Page' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('same_page');
  });

  test('an unknown subject returns subject_not_found', () => {
    makePalace();
    const r = buildLensMandate({ palaceRoot: root, glassTitle: 'Glass Page', subjectTitle: 'Ghost Page' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('subject_not_found');
  });

  test('a frontmatter-less subject (a learning material, not a canon entry) returns subject_no_frontmatter', () => {
    makePalace();
    makePage(root, { home: 'Plain Material', withFrontmatter: false });
    const r = buildLensMandate({ palaceRoot: root, glassTitle: 'Glass Page', subjectTitle: 'Plain Material' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('subject_no_frontmatter');
  });

  test('an unknown glass propagates buildEphemeralPrompt\'s not_found', () => {
    makePalace();
    const r = buildLensMandate({ palaceRoot: root, glassTitle: 'Ghost Glass', subjectTitle: 'Subject Page' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('not_found');
    expect(r.glass).toBe('Ghost Glass');
  });
});
