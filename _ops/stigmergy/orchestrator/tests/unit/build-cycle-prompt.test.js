import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sliceBoardSinceCursor, buildCyclePrompt, findEntryFile } from '../../src/build-cycle-prompt.js';

describe('sliceBoardSinceCursor', () => {
  const lines = [
    JSON.stringify({ id: 'a' }),
    JSON.stringify({ id: 'b' }),
    JSON.stringify({ id: 'c' }),
  ];

  test('no cursor returns the whole board', () => {
    expect(sliceBoardSinceCursor(lines, null)).toEqual(lines);
    expect(sliceBoardSinceCursor(lines, undefined)).toEqual(lines);
  });

  test('returns only lines after the cursor (cursor line excluded)', () => {
    expect(sliceBoardSinceCursor(lines, 'a')).toEqual([lines[1], lines[2]]);
    expect(sliceBoardSinceCursor(lines, 'b')).toEqual([lines[2]]);
    expect(sliceBoardSinceCursor(lines, 'c')).toEqual([]);
  });

  test('cursor not found yields an empty slice', () => {
    expect(sliceBoardSinceCursor(lines, 'zzz')).toEqual([]);
  });

  test('tolerates malformed lines while scanning for the cursor', () => {
    const withJunk = ['garbage', JSON.stringify({ id: 'a' }), JSON.stringify({ id: 'b' })];
    expect(sliceBoardSinceCursor(withJunk, 'a')).toEqual([withJunk[2]]);
  });
});

describe('buildCyclePrompt (integration)', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  function makePalace({ state, history = '', board = [], home = 'My Project' } = {}) {
    root = mkdtempSync(path.join(tmpdir(), 'palace-bcp-'));
    const agentRel = '_ops/agents/permanent/my-project';
    const agentDir = path.join(root, agentRel);
    mkdirSync(agentDir, { recursive: true });
    mkdirSync(path.join(root, '_ops/swarm/persistent'), { recursive: true });
    // Minimal skill template.
    const promptsDir = path.join(root, '.claude/skills/palace-orchestrator/prompts');
    mkdirSync(promptsDir, { recursive: true });
    writeFileSync(path.join(promptsDir, 'steward.md'), 'STEWARD SYSTEM home={{home}} cycle={{cycle_id}} stage={{stage_at_last_activation}}');
    // Steward dir files.
    writeFileSync(path.join(agentDir, 'manifest.json'), JSON.stringify({
      home, session_id: 'sess-xyz', stewardship: { stage_at_spawn: 'growing' },
    }));
    writeFileSync(path.join(agentDir, 'state.json'), JSON.stringify(state));
    writeFileSync(path.join(agentDir, 'history.jsonl'), history);
    // Home entry + board.
    writeFileSync(path.join(root, `${home}.md`), `---\ntitle: "${home}"\nstage: growing\n---\n# ${home}\nbody text here\n`);
    writeFileSync(path.join(root, '_ops/swarm/persistent/blackboard.jsonl'), board.map((m) => JSON.stringify(m)).join('\n'));
    return { agentRel, home };
  }

  test('first activation framing + full board + output protocol', () => {
    const { agentRel, home } = makePalace({
      state: { iteration: 0, last_active: null, last_read_cursor: null },
      board: [{ id: 'x1', type: 'BROADCAST' }, { id: 'x2', type: 'BROADCAST' }],
    });
    const { systemPrompt, userTurn, full } = buildCyclePrompt({ palaceRoot: root, agentDir: agentRel, cycleN: 1, today: '2026-05-27' });

    expect(systemPrompt).toContain('home=My Project');
    expect(systemPrompt).toContain('cycle=cycle-1-2026-05-27');
    expect(userTurn).toContain('first activation');
    expect(userTurn).toContain('full board, since first activation');
    expect(userTurn).toContain('x1');
    expect(userTurn).toContain('x2');
    expect(userTurn).toContain('body text here'); // home entry inlined
    expect(userTurn).toContain('"My Project"'); // from field in output protocol
    expect(userTurn).toContain('sess-xyz');     // session_id in output protocol
    expect(full).toBe(systemPrompt + '\n\n---\n\n' + userTurn);
  });

  test('resumed framing slices the board since the cursor and honors extraMandate', () => {
    const { agentRel } = makePalace({
      state: { iteration: 2, last_active: '2026-05-26T10:00:00Z', last_read_cursor: 'x1' },
      board: [{ id: 'x1', type: 'BROADCAST' }, { id: 'x2', type: 'BROADCAST' }],
    });
    const { userTurn } = buildCyclePrompt({
      palaceRoot: root, agentDir: agentRel, cycleN: 3, today: '2026-05-27', extraMandate: 'DO THE SPECIFIC THING',
    });
    expect(userTurn).toContain('You last ran at');
    expect(userTurn).toContain('since your cursor ("x1")');
    expect(userTurn).toContain('x2');
    expect(userTurn).not.toContain('"id":"x1"'); // x1 is the cursor — excluded from the slice
    expect(userTurn).toContain('DO THE SPECIFIC THING');
    // Not a git repo → page-change detection degrades to the "no commits" branch.
    expect(userTurn).toContain('No commits have touched your home entry');
  });
});

describe('findEntryFile', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  test('finds a nested entry and skips excluded dirs', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-find-'));
    mkdirSync(path.join(root, 'sub/deep'), { recursive: true });
    mkdirSync(path.join(root, '.git'), { recursive: true });
    writeFileSync(path.join(root, 'sub/deep/Target.md'), '# Target');
    writeFileSync(path.join(root, '.git/Target.md'), 'should be ignored');
    const found = findEntryFile(root, 'Target');
    expect(found).toBe(path.join(root, 'sub/deep/Target.md'));
    expect(findEntryFile(root, 'Nope')).toBeNull();
  });
});
