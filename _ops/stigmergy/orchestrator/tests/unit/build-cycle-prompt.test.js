import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sliceBoardSinceCursor, filterBoardForAgent, buildCyclePrompt, findEntryFile } from '../../src/build-cycle-prompt.js';

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

describe('filterBoardForAgent', () => {
  const ME = 'My Project';
  const L = {
    toMe: JSON.stringify({ id: 'm1', type: 'RESOURCE_GRANT', from: 'TRICKSTER', to: ME, re: 'other' }),
    fromMe: JSON.stringify({ id: 'm2', type: 'RESOURCE_REQUEST', from: ME, to: 'TRICKSTER' }),
    respToMyAsk: JSON.stringify({ id: 'm3', type: 'RESOURCE_GRANT', from: 'TRICKSTER', to: 'someone-else', re: 'myask-1' }),
    nbhBroadcast: JSON.stringify({ id: 'm4', type: 'BROADCAST', from: 'Neighbor A', to: '*' }),
    strangerBroadcast: JSON.stringify({ id: 'm5', type: 'BROADCAST', from: 'Stranger', to: '*' }),
    othersRequest: JSON.stringify({ id: 'm6', type: 'RESOURCE_REQUEST', from: 'Stranger', to: 'TRICKSTER' }),
    grantToOther: JSON.stringify({ id: 'm7', type: 'RESOURCE_GRANT', from: 'TRICKSTER', to: 'someone-else' }),
    flagToAll: JSON.stringify({ id: 'm8', type: 'FLAG', from: 'Neighbor A', to: '*' }),
    flagFromStranger: JSON.stringify({ id: 'm9', type: 'FLAG', from: 'Stranger', to: '*' }),
  };
  const all = Object.values(L);

  test('keeps messages addressed to me, my own, and responses to my asks', () => {
    const kept = filterBoardForAgent(all, { agentId: ME, neighborhood: ['Neighbor A'], requestIds: ['myask-1'] });
    expect(kept).toContain(L.toMe);
    expect(kept).toContain(L.fromMe);
    expect(kept).toContain(L.respToMyAsk);
  });

  test('with a neighborhood, keeps neighbor broadcasts and drops stranger broadcasts + others\' directed traffic', () => {
    const kept = filterBoardForAgent(all, { agentId: ME, neighborhood: ['Neighbor A'], requestIds: [] });
    expect(kept).toContain(L.nbhBroadcast);
    expect(kept).toContain(L.flagToAll);            // FLAG to '*' from a neighbor counts as a neighbor broadcast
    expect(kept).not.toContain(L.strangerBroadcast);
    expect(kept).not.toContain(L.flagFromStranger);
    expect(kept).not.toContain(L.othersRequest);    // other steward's ask to TRICKSTER
    expect(kept).not.toContain(L.grantToOther);     // grant addressed to a different agent
  });

  test('with no neighborhood, falls back to keeping all broadcasts (spec-faithful)', () => {
    const kept = filterBoardForAgent(all, { agentId: ME, neighborhood: [], requestIds: [] });
    expect(kept).toContain(L.nbhBroadcast);
    expect(kept).toContain(L.strangerBroadcast);
    expect(kept).not.toContain(L.othersRequest);    // still drops directed non-broadcast traffic
    expect(kept).not.toContain(L.grantToOther);
  });

  test('preserves order and keeps unparseable lines (never hides signal)', () => {
    const lines = ['not json', L.nbhBroadcast, L.othersRequest, L.fromMe];
    const kept = filterBoardForAgent(lines, { agentId: ME, neighborhood: ['Neighbor A'] });
    expect(kept).toEqual(['not json', L.nbhBroadcast, L.fromMe]);
  });

  test('empty/absent options default safely', () => {
    expect(filterBoardForAgent([], { agentId: ME })).toEqual([]);
    // no opts at all → agentId undefined, no neighborhood → all broadcasts kept, directed dropped
    expect(filterBoardForAgent([L.nbhBroadcast, L.grantToOther])).toEqual([L.nbhBroadcast]);
  });
});

describe('buildCyclePrompt (integration)', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  function makePalace({ state, history = '', board = [], home = 'My Project', neighborhood = [], frontmatterStage = 'growing', stagingBody = null } = {}) {
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
      agent_id: home, home, session_id: 'sess-xyz', neighborhood, stewardship: { stage_at_spawn: 'growing' },
    }));
    writeFileSync(path.join(agentDir, 'state.json'), JSON.stringify(state));
    writeFileSync(path.join(agentDir, 'history.jsonl'), history);
    // Home entry + board.
    writeFileSync(path.join(root, `${home}.md`), `---\ntitle: "${home}"\nstage: ${frontmatterStage}\n---\n# ${home}\nbody text here\n`);
    // Optional bundle-local staging file (the teaching arc the steward reads).
    if (stagingBody != null) {
      mkdirSync(path.join(root, home), { recursive: true });
      writeFileSync(path.join(root, home, `${home} — Staging.md`), stagingBody);
    }
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
    expect(userTurn).toContain('since first activation');
    expect(userTurn).toContain('filtered to your neighborhood');
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

  test('board slice is relevance-filtered: neighbor broadcasts + my mail kept, stranger noise dropped', () => {
    const { agentRel } = makePalace({
      home: 'My Project',
      neighborhood: ['Neighbor A'],
      state: {
        iteration: 2,
        last_active: '2026-05-26T10:00:00Z',
        last_read_cursor: 'c0',
        pending_requests: [{ request_id: 'myask-1' }],
      },
      board: [
        { id: 'c0', type: 'BROADCAST', from: 'Neighbor A', to: '*' }, // cursor (excluded by temporal slice)
        { id: 'keep-grant', type: 'RESOURCE_GRANT', from: 'TRICKSTER', to: 'My Project', re: 'myask-1' },
        { id: 'keep-nbh', type: 'BROADCAST', from: 'Neighbor A', to: '*' },
        { id: 'drop-stranger-bcast', type: 'BROADCAST', from: 'Stranger', to: '*' },
        { id: 'drop-others-ask', type: 'RESOURCE_REQUEST', from: 'Stranger', to: 'TRICKSTER' },
        { id: 'drop-grant-other', type: 'RESOURCE_GRANT', from: 'TRICKSTER', to: 'Stranger' },
      ],
    });
    const { userTurn } = buildCyclePrompt({ palaceRoot: root, agentDir: agentRel, cycleN: 3, today: '2026-05-27' });
    expect(userTurn).toContain('keep-grant');             // grant addressed to me (and re-matches my ask)
    expect(userTurn).toContain('keep-nbh');               // neighbor broadcast
    expect(userTurn).not.toContain('drop-stranger-bcast'); // broadcast from outside the neighborhood
    expect(userTurn).not.toContain('drop-others-ask');     // another steward's ask to TRICKSTER
    expect(userTurn).not.toContain('drop-grant-other');    // grant addressed to a different agent
    expect(userTurn).toContain('other swarm traffic is omitted'); // transparency note present
  });

  test('Phase 1a — the steward stage is read LIVE from frontmatter, overriding the stored copy', () => {
    const { agentRel } = makePalace({
      // Frontmatter says mature; the stale stored copies say seed/growing. Frontmatter must win.
      frontmatterStage: 'mature',
      state: {
        iteration: 2, last_active: '2026-05-26T10:00:00Z', last_read_cursor: 'c0',
        stewardship: { stage_at_last_activation: 'seed' },
      },
    });
    const { systemPrompt } = buildCyclePrompt({ palaceRoot: root, agentDir: agentRel, cycleN: 3, today: '2026-05-27' });
    expect(systemPrompt).toContain('stage=mature');
    expect(systemPrompt).not.toContain('stage=seed');
  });

  test('Phase 1d — a bundle-local staging file is loaded into the steward context, read-only', () => {
    const { agentRel } = makePalace({
      stagingBody: '# Teaching arc\nStage 1 isolates the illusion. Stage 2 exposes the wrap seam.',
      state: { iteration: 2, last_active: '2026-05-26T10:00:00Z', last_read_cursor: 'c0' },
    });
    const { userTurn } = buildCyclePrompt({ palaceRoot: root, agentDir: agentRel, cycleN: 3, today: '2026-05-27' });
    expect(userTurn).toContain('Your staging arc — My Project — Staging');
    expect(userTurn).toContain('Stage 2 exposes the wrap seam');
    expect(userTurn).toContain('READ, do not rewrite');
    expect(userTurn).toContain('FLAG it to Loudon');
  });

  test('no staging section when the entry has no staging file', () => {
    const { agentRel } = makePalace({
      state: { iteration: 2, last_active: '2026-05-26T10:00:00Z', last_read_cursor: 'c0' },
    });
    const { userTurn } = buildCyclePrompt({ palaceRoot: root, agentDir: agentRel, cycleN: 3, today: '2026-05-27' });
    expect(userTurn).not.toContain('Your staging arc');
  });

  test('mode defaults to headless — the orchestrator output protocol is present', () => {
    const { agentRel } = makePalace({ state: { iteration: 0, last_active: null, last_read_cursor: null } });
    const { userTurn } = buildCyclePrompt({ palaceRoot: root, agentDir: agentRel, cycleN: 1, today: '2026-05-27' });
    expect(userTurn).toContain('# Output protocol');
    expect(userTurn).toContain('The orchestrator parses');
    expect(userTurn).not.toContain('Narrate every write');
  });

  test('mode "interactive" swaps the closing for the narrate-your-writes framing — same injected context', () => {
    const { agentRel } = makePalace({
      state: { iteration: 2, last_active: '2026-05-26T10:00:00Z', last_read_cursor: 'x1' },
      board: [{ id: 'x1', type: 'BROADCAST' }, { id: 'x2', type: 'BROADCAST' }],
    });
    const { userTurn } = buildCyclePrompt({
      palaceRoot: root, agentDir: agentRel, cycleN: 3, today: '2026-05-27', mode: 'interactive',
    });
    // the interactive framing replaces the headless protocol
    expect(userTurn).toContain('driven live');
    expect(userTurn).toContain('Narrate every write before you make it');
    expect(userTurn).toContain('catching Loudon up on where My Project stands');
    expect(userTurn).toContain('sess-xyz');                       // post-as-the-page guidance still names session_id
    expect(userTurn).not.toContain('# Output protocol');          // headless-only
    expect(userTurn).not.toContain('The orchestrator parses');    // headless-only
    // the CONTEXT is identical across modes — identity + board still injected
    expect(userTurn).toContain('body text here');                 // home entry inlined (identity)
    expect(userTurn).toContain('x2');                             // board slice present
    expect(userTurn).toContain('This cycle\'s mandate');          // mandate section unchanged
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
