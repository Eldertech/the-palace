import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildEphemeralPrompt } from '../../src/ephemeral-prompt.js';

// buildEphemeralPrompt wakes a page as ITSELF — its identity, its forward vector
// (its desire), its neighbors — per Pages as Agents. It is NOT a steward cycle.
// These tests pin both halves: the awaken framing is present, and NONE of the
// steward role leaks in (the bug Loudon caught: every enchanted page was told it
// was a permanent steward running cycle 1).

// Steward-role words that must never appear in an awaken prompt's FRAMING. The
// fixture body is controlled (no incidental matches) so a whole-prompt scan is fair.
const STEWARD_LEAK = [
  'permanent steward', 'long_duration_background', 'cycle 1', 'this cycle',
  'TRICKSTER ask', 'SPINNING UP', 'save state', 'blackboard slice', 'board slice',
  'audition gate', 'iteration 0', 'last_read_cursor', 'posting discipline',
];

describe('buildEphemeralPrompt — wakes a page as itself', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  function makePalace({ home = 'Foo', stage = 'growing', body = 'BODY-MARKER-LINE', vector = 'I will keep proving the seam.', withFrontmatter = true, withAgency = false, links = ['Neighbor A', 'Neighbor B'] } = {}) {
    root = mkdtempSync(path.join(tmpdir(), 'palace-eph-'));
    const linkBlock = links.length
      ? 'links:\n' + links.map((l) => `  - target: "[[${l}]]"\n    type: connects-to`).join('\n') + '\n'
      : '';
    const agency = withAgency ? 'agency_profile:\n  creation: "MAKE-THINGS"\n  practice: "EXAMINE-MYSELF"\n' : '';
    const fm = withFrontmatter
      ? `---\ntitle: "${home}"\nstage: ${stage}\nforward_vector: "${vector}"\n${agency}${linkBlock}---\n# ${home}\n${body}\n`
      : `# ${home}\n${body}\n`;
    writeFileSync(path.join(root, `${home}.md`), fm);
    return { home };
  }

  test('wakes with the three desires, the page identity, the vector — and no steward role', () => {
    makePalace({ withAgency: true });
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Foo' });

    expect(r.ok).toBe(true);
    expect(r.status).toBe('built');
    expect(r.stage).toBe('growing');

    // identity injected in full
    expect(r.full).toContain('You are awake');
    expect(r.full).toContain('This is you — Foo');
    expect(r.full).toContain('BODY-MARKER-LINE');

    // the three desires, in order
    const iVector = r.full.search(/forward vector is your desire/i);
    const iCitizen = r.full.search(/good citizen of the palace/i);
    const iHealthy = r.full.search(/healthy for the palace/i);
    expect(iVector).toBeGreaterThan(-1);
    expect(iCitizen).toBeGreaterThan(iVector);
    expect(iHealthy).toBeGreaterThan(iCitizen);

    // the vector is highlighted, the agency profile injected, neighbors named
    expect(r.full).toContain('I will keep proving the seam.');
    expect(r.full).toMatch(/fuller desires/i);
    expect(r.full).toContain('MAKE-THINGS');
    expect(r.full).toContain('[[Neighbor A]]');
    expect(r.full).toContain('[[Neighbor B]]');

    // NONE of the steward role leaks in
    const lower = r.full.toLowerCase();
    for (const banned of STEWARD_LEAK) expect(lower).not.toContain(banned.toLowerCase());
  });

  test('leaves NO footprint — no tmp agent dir, no registry, no files written', () => {
    makePalace();
    const beforeTmp = readdirSync(tmpdir()).filter((n) => n.startsWith('stigmergy-ephemeral-')).length;
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Foo' });
    expect(r.ok).toBe(true);
    // the builder reads the page directly — it stages nothing
    expect(existsSync(path.join(root, '_ops/agents/permanent'))).toBe(false);
    const afterTmp = readdirSync(tmpdir()).filter((n) => n.startsWith('stigmergy-ephemeral-')).length;
    expect(afterTmp).toBe(beforeTmp);
  });

  test('an optional session note from Loudon is woven in', () => {
    makePalace();
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Foo', extraMandate: 'wake and let us voice the dispersion filter' });
    expect(r.full).toMatch(/Loudon's note for this session/);
    expect(r.full).toContain('wake and let us voice the dispersion filter');
  });

  test('a page with no forward vector wakes with a listen-for-it fallback, not a blank', () => {
    makePalace({ vector: '', withFrontmatter: true });
    // write a page that genuinely lacks the field
    writeFileSync(path.join(root, 'Foo.md'), '---\ntitle: "Foo"\nstage: seed\n---\n# Foo\nBODY-MARKER-LINE\n');
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Foo' });
    expect(r.ok).toBe(true);
    expect(r.full).toMatch(/no forward vector yet/i);
  });

  test('a title with no page returns not_found', () => {
    makePalace();
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Ghost' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('not_found');
  });

  test('a frontmatter-less page (a learning material, not a canon entry) returns no_frontmatter', () => {
    makePalace({ home: 'Plain', withFrontmatter: false });
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Plain' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('no_frontmatter');
  });
});
