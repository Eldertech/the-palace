import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderPlanMarkdown, materializePlan, findStagingTitle } from '../../src/plan-file.js';

// A Shepard-shaped state: two open decisions, one resolved.
const SAMPLE_STATE = {
  iteration: 6,
  pending_requests: [
    {
      request_id: 'shepard-steward-018', resource: 'audition_verification', blocking: true,
      posted_at: '2026-06-06T14:08:30-04:00',
      options: ['APPROVE-STAGE-2', 'ADJUST-WINDOW', 'ADJUST-WRAP', 'REJECT-PROTOTYPE'],
    },
    {
      request_id: 'shepard-steward-019', resource: 'directional_decision', blocking: false,
      posted_at: '2026-06-06T14:09:00-04:00',
      options: ['DRAFT-NOW', 'DRAFT-AFTER-AUDITION', 'MERGE-INTO-EXISTING'],
    },
  ],
  resolved_requests: [
    {
      request_id: 'shepard-steward-003', resource: 'directional_decision',
      decision_topic: 'What is Stage 1 — the simplest possible Shepard tone?',
      blocking: false, posted_at: '2026-05-27T15:42:00-04:00',
      options: ['MINIMUM-ILLUSION', 'MINIMUM-ASCENT'],
      steward_recommendation: 'MINIMUM-ILLUSION isolates the illusion first.',
      resolved_at: '2026-05-27T19:05:49.217Z', resolved_by: 'resp-x',
      outcome: 'GRANTED — option_id=MINIMUM-ILLUSION',
    },
  ],
};

describe('renderPlanMarkdown', () => {
  test('emits §8-minimal frontmatter with a plan-for link to the parent', () => {
    const md = renderPlanMarkdown({ home: 'Shepard Tone Synthesizer', state: SAMPLE_STATE, stage: 'growing', today: '2026-06-09' });
    expect(md).toContain('title: "Shepard Tone Synthesizer — plan"');
    expect(md).toContain('born: 2026-06-09');
    expect(md).toContain('target: "[[Shepard Tone Synthesizer]]"');
    expect(md).toContain('label: plan-for');
  });

  test('points to the forward_vector, never copies it (single-source-of-truth)', () => {
    const vectorText = 'I want to become a fully staged teaching instrument';
    const md = renderPlanMarkdown({ home: 'Shepard Tone Synthesizer', state: SAMPLE_STATE, stage: 'growing', today: '2026-06-09' });
    expect(md).toContain('see [[Shepard Tone Synthesizer]] frontmatter `forward_vector`');
    expect(md).not.toContain(vectorText);
  });

  test('renders open and resolved decisions with their request_ids and outcomes', () => {
    const md = renderPlanMarkdown({ home: 'Shepard Tone Synthesizer', state: SAMPLE_STATE, stage: 'growing', today: '2026-06-09' });
    expect(md).toContain('## Open Decisions');
    expect(md).toContain('`shepard-steward-018`');
    expect(md).toContain('**blocking**');
    expect(md).toContain('APPROVE-STAGE-2 · ADJUST-WINDOW');
    expect(md).toContain('## Resolved Decisions');
    expect(md).toContain('`shepard-steward-003`');
    expect(md).toContain('GRANTED — option_id=MINIMUM-ILLUSION');
  });

  test('shows empty-state placeholders when there are no decisions', () => {
    const md = renderPlanMarkdown({ home: 'Empty', state: { pending_requests: [], resolved_requests: [] }, stage: 'seed', today: '2026-06-09' });
    expect(md).toContain('_None open._');
    expect(md).toContain('_None yet._');
  });

  test('explicit board-derived pending/resolved override the legacy state arrays (SSOT path)', () => {
    // state still lists 018 + 019 as pending; the board-derived view says 018 is
    // resolved and nothing is open — the explicit view must win.
    const md = renderPlanMarkdown({
      home: 'Shepard Tone Synthesizer', state: SAMPLE_STATE, stage: 'growing', today: '2026-06-09',
      pending: [],
      resolved: [{
        request_id: 'shepard-steward-018', resource: 'audition_verification',
        outcome: 'GRANTED — option_id=APPROVE-STAGE-2',
        resolved_at: '2026-06-06T18:00:00Z', resolved_by: 'grant-x',
      }],
    });
    expect(md).toContain('_None open._');                 // explicit pending=[] wins over state's two pending
    expect(md).toContain('`shepard-steward-018`');         // the board-derived resolved entry renders
    expect(md).toContain('option_id=APPROVE-STAGE-2');
    expect(md).not.toContain('shepard-steward-019');       // state's pending arrays are ignored
  });

  test('includes the staging pointer in the Plan section when a staging file exists', () => {
    const md = renderPlanMarkdown({ home: 'Shepard Tone Synthesizer', state: SAMPLE_STATE, stage: 'growing', today: '2026-06-09', stagingTitle: 'Shepard Tone Synthesizer — Staging' });
    expect(md).toContain('Teaching arc:');
    expect(md).toContain('[[Shepard Tone Synthesizer — Staging]]');
  });

  test('builds the Done trail from a history file', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'palace-plan-'));
    try {
      const hist = path.join(root, 'history.jsonl');
      writeFileSync(hist, [
        JSON.stringify({ event: 'AGENT_REASONING', ts: '2026-06-06T16:00:00Z', summary: 'rendered Stage 2 seed' }),
        JSON.stringify({ event: 'CYCLE_COMPLETE', ts: '2026-06-06T16:05:00Z', iteration: 6, posted_messages: ['shepard-steward-018'] }),
      ].join('\n'));
      const md = renderPlanMarkdown({ home: 'Shepard Tone Synthesizer', state: SAMPLE_STATE, stage: 'growing', today: '2026-06-09', historyPath: hist });
      expect(md).toContain('## Done');
      expect(md).toContain('rendered Stage 2 seed');
      expect(md).toContain('posted: shepard-steward-018');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('findStagingTitle', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  test('matches the staging file case-insensitively and returns the wikilink title', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-plan-'));
    const bundle = path.join(root, 'Shepard Tone Synthesizer');
    mkdirSync(bundle, { recursive: true });
    writeFileSync(path.join(bundle, 'Shepard Tone Synthesizer — Staging.md'), '# arc');
    expect(findStagingTitle(bundle, 'Shepard Tone Synthesizer')).toBe('Shepard Tone Synthesizer — Staging');
  });

  test('returns null when no staging file and when the dir is absent', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-plan-'));
    const bundle = path.join(root, 'Bundle');
    mkdirSync(bundle, { recursive: true });
    expect(findStagingTitle(bundle, 'Bundle')).toBeNull();
    expect(findStagingTitle(path.join(root, 'missing'), 'X')).toBeNull();
  });
});

describe('materializePlan', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  function palaceWithEntry({ entryDir = 'Projects', home = 'Shepard Tone Synthesizer' } = {}) {
    root = mkdtempSync(path.join(tmpdir(), 'palace-plan-'));
    mkdirSync(path.join(root, entryDir), { recursive: true });
    writeFileSync(path.join(root, entryDir, `${home}.md`), '---\nstage: growing\n---\n# x');
    return { home };
  }

  test('writes plan.md into the entry bundle and reports where it landed', () => {
    const { home } = palaceWithEntry();
    const res = materializePlan({ palaceRoot: root, home, state: SAMPLE_STATE, stage: 'growing', tsNow: '2026-06-09T10:00:00Z', iteration: 6 });
    expect(res.written).toBe(true);
    expect(res.planPath).toBe(path.join(root, 'Projects', home, `${home} — plan.md`));
    expect(existsSync(res.planPath)).toBe(true);
    expect(readFileSync(res.planPath, 'utf8')).toContain('shepard-steward-018');
  });

  test('creates the bundle folder if it does not exist yet', () => {
    const { home } = palaceWithEntry();
    expect(existsSync(path.join(root, 'Projects', home))).toBe(false);
    const res = materializePlan({ palaceRoot: root, home, state: SAMPLE_STATE, stage: 'growing', tsNow: '2026-06-09T10:00:00Z' });
    expect(existsSync(path.join(root, 'Projects', home))).toBe(true);
    expect(res.written).toBe(true);
  });

  test('preserves born across re-materialization', () => {
    const { home } = palaceWithEntry();
    materializePlan({ palaceRoot: root, home, state: SAMPLE_STATE, stage: 'growing', today: '2026-06-01', tsNow: '2026-06-01T10:00:00Z' });
    const res2 = materializePlan({ palaceRoot: root, home, state: SAMPLE_STATE, stage: 'growing', today: '2026-06-09', tsNow: '2026-06-09T10:00:00Z' });
    expect(readFileSync(res2.planPath, 'utf8')).toContain('born: 2026-06-01');
  });

  test('detects an existing staging file and threads its title into the plan', () => {
    const { home } = palaceWithEntry();
    const bundle = path.join(root, 'Projects', home);
    mkdirSync(bundle, { recursive: true });
    writeFileSync(path.join(bundle, `${home} — Staging.md`), '# arc');
    const res = materializePlan({ palaceRoot: root, home, state: SAMPLE_STATE, stage: 'growing', tsNow: '2026-06-09T10:00:00Z' });
    expect(res.stagingTitle).toBe(`${home} — Staging`);
    expect(readFileSync(res.planPath, 'utf8')).toContain(`[[${home} — Staging]]`);
  });

  test('returns written:false (never throws) when the entry file is absent', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-plan-'));
    const res = materializePlan({ palaceRoot: root, home: 'Ghost', state: SAMPLE_STATE, stage: 'seed', tsNow: '2026-06-09T10:00:00Z' });
    expect(res.written).toBe(false);
    expect(res.reason).toBe('entry-file-not-found');
  });
});
