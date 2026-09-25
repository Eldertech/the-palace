import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  MARK, ORDERS_PLACEHOLDER, computeNow, renderNow, renderMakingSection, isMakingMessage,
  existingEntryIds, updateScrollText, readZone, readStandingOrders, readStall,
  readConsolidationCycle, materializeScroll, scrollPathFor,
} from '../../src/scroll-file.js';
import { resolveBundleDir } from '../../src/entry-paths.js';

const HOME = 'Shepard Tone Synthesizer';

function msg(over) {
  return {
    schema_version: '1.0', id: 'x', ts: '2026-06-06T14:00:00-04:00', session_id: 's',
    from: HOME, to: '*', type: 'BROADCAST', board: 'GENERAL', payload: {}, ...over,
  };
}

const BOARD = [
  msg({ id: 'shep-001', ts: '2026-05-27T15:40:00-04:00', payload: { kind: 'spawn', subject: 'SPINNING UP', content: 'SPINNING UP. HOME: Shepard.' } }),
  msg({ id: 'shep-002', ts: '2026-05-27T15:42:00-04:00', to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER', request_id: 'shep-002',
    payload: { resource: 'directional_decision', blocking: false, headline: 'Stage 1: illusion or ascent first?', rationale: 'Catch-up — Shepard tones are the endless staircase. Nothing shipped yet.\n\nTwo paths.', options: [{ id: 'ILLUSION', label: 'ILLUSION' }, { id: 'ASCENT', label: 'ASCENT' }] } }),
  msg({ id: 'resp-1', ts: '2026-05-27T19:05:49Z', from: 'TRICKSTER', to: HOME, type: 'RESOURCE_GRANT', board: 'TRICKSTER', re: 'shep-002', payload: { granted: true, option_id: 'ILLUSION' } }),
  msg({ id: 'shep-003', ts: '2026-06-06T14:05:00-04:00', payload: { kind: 'shipped_artifact', headline: 'Twelve drones rendered', ground: 'shipped · steward leans STAIRCASE next', content: 'Catch-up — Shepard is the endless staircase; Stage 1 is the twelve drones.\n\nRendered all twelve.', artifacts: [{ path: 'Projects/Shepard Tone Synthesizer/drones/c.wav', caption: 'the C drone' }], left_rough: 'no crossfade yet' } }),
  msg({ id: 'shep-004', ts: '2026-06-06T14:08:00-04:00', to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER', request_id: 'shep-004',
    payload: { resource: 'audition_verification', blocking: true, headline: 'Do the drones fuse?', rationale: 'Listen.', options: [{ id: 'APPROVE', label: 'APPROVE' }] } }),
];

const STATE = { iteration: 6, last_active: '2026-06-06T18:10:00Z', last_read_cursor: 'shep-004', health: { score: 'green' } };

const HISTORY = [
  { event: 'CYCLE_5_SPAWN', ts: '2026-05-27T15:40:00Z' },
  { event: 'TOOL_CALL', ts: '2026-05-27T15:40:00Z', args: { message_id: 'shep-002' } },
  { event: 'CYCLE_COMPLETE', ts: '2026-05-27T15:45:00Z', iteration: 5, posted_messages: ['shep-001', 'shep-002'] },
  { event: 'CYCLE_6_SPAWN', ts: '2026-06-06T18:00:00Z' },
  { event: 'TOOL_CALL', ts: '2026-06-06T18:00:00Z', args: { message_id: 'shep-003' } },
  { event: 'CYCLE_COMPLETE', ts: '2026-06-06T18:10:00Z', iteration: 6, posted_messages: ['shep-003', 'shep-004'] },
];

describe('isMakingMessage', () => {
  test('spawn announcements never count; shipped kinds, PROOFs and artifact-bearing asks do', () => {
    expect(isMakingMessage(BOARD[0])).toBe(false);
    expect(isMakingMessage(BOARD[3])).toBe(true);
    expect(isMakingMessage(msg({ type: 'PROOF', payload: { content: 'x' } }))).toBe(true);
    expect(isMakingMessage(msg({ type: 'RESOURCE_REQUEST', payload: { artifacts: [{ path: 'a.wav' }] } }))).toBe(true);
    expect(isMakingMessage(msg({ payload: { content: 'just prose' } }))).toBe(false);
  });
});

describe('computeNow + renderNow', () => {
  const meta = { stage: 'growing', data: { status: 'active' } };
  const entryText = '## Under Active Stewardship\n- **As of last consolidation:** cycle 4 (2026-06-01)';

  test('reads open asks, unconsumed answers, drift and the catch-up paragraph from the board', () => {
    const now = computeNow({ home: HOME, board: BOARD, state: STATE, history: HISTORY, meta, entryText, tsNow: '2026-06-10T00:00:00Z' });
    expect(now.open.map((r) => r.request_id)).toEqual(['shep-004']);
    expect(now.open[0].blocking).toBe(true);
    expect(now.answered_unconsumed).toEqual([]);          // resp-1 landed before last_active
    expect(now.last_shipped.id).toBe('shep-003');
    expect(now.drift).toEqual({ cycles: 2, decisions: 1, consolidated_at: 4 });
    expect(now.stands).toMatch(/^Shepard is the endless staircase/); // "Catch-up —" prefix stripped
    expect(now.stall.stalled).toBe(false);
  });

  test('an answer filed AFTER the steward last ran counts as ready-to-advance without any cycle', () => {
    const board = [...BOARD, msg({ id: 'resp-2', ts: '2026-08-26T02:56:05Z', from: 'TRICKSTER', to: HOME, type: 'RESOURCE_GRANT', board: 'TRICKSTER', re: 'shep-004', payload: { granted: true, option_id: 'APPROVE' } })];
    const now = computeNow({ home: HOME, board, state: STATE, history: HISTORY, meta, entryText, tsNow: '2026-09-01T00:00:00Z' });
    expect(now.open).toEqual([]);
    expect(now.answered_unconsumed.map((r) => r.request_id)).toEqual(['shep-004']);
    const text = renderNow(now, { home: HOME });
    expect(text).toContain('**Ready to advance:** 1 answer filed since the steward last ran');
    expect(text).toContain('**Waiting on you:** nothing');
  });

  test('renders the stall signal when the last cycles were barren', () => {
    const hist = [...HISTORY,
      { event: 'CYCLE_COMPLETE', ts: '2026-08-26T02:35:07Z', iteration: 7, posted_messages: [] },
      { event: 'CYCLE_COMPLETE', ts: '2026-09-21T02:35:07Z', iteration: 8, posted_messages: [] }];
    const now = computeNow({ home: HOME, board: BOARD, state: { ...STATE, iteration: 8 }, history: hist, meta, entryText, tsNow: '2026-09-23T00:00:00Z' });
    expect(now.stall).toEqual({ barren_streak: 2, stalled: true, last_cycle_barren: true });
    expect(renderNow(now, { home: HOME })).toContain('**STALLED**');
  });

  test('one barren cycle warns but does not call it stalled; a lane flag does', () => {
    const one = [...HISTORY, { event: 'CYCLE_COMPLETE', ts: '2026-08-26T02:35:07Z', iteration: 7, posted_messages: [] }];
    expect(readStall(one, {})).toEqual({ barren_streak: 1, stalled: false, last_cycle_barren: true });
    expect(readStall(one, { health: { stalled: true } }).stalled).toBe(true);
  });

  test('a reviewed STALL_CLEARED ends the backward count', () => {
    const cut = [...HISTORY,
      { event: 'CYCLE_COMPLETE', ts: '2026-09-25T02:37:00Z', iteration: 10, posted_messages: [] },
      { event: 'CYCLE_COMPLETE', ts: '2026-09-25T02:40:22Z', iteration: 11, posted_messages: [] },
      { event: 'STALL_CLEARED', ts: '2026-09-25T23:40:00Z', note: 'both cycles hit the session limit' }];
    expect(readStall(cut, {})).toEqual({ barren_streak: 0, stalled: false, last_cycle_barren: false });
    // A barren cycle after the clearance counts again from there.
    const again = [...cut, { event: 'CYCLE_COMPLETE', ts: '2026-09-26T06:00:00Z', iteration: 12, posted_messages: [] }];
    expect(readStall(again, {}).barren_streak).toBe(1);
  });

  test('an unstewarded project renders honestly: no steward, no cycles, vector pointer', () => {
    const now = computeNow({ home: 'BLUELINE', board: [], state: null, history: [], meta: { stage: 'growing', data: { status: 'active' } }, entryText: '', tsNow: '2026-09-23T00:00:00Z', bundleMedia: [{ path: 'a.png' }] });
    expect(now.stewarded).toBe(false);
    const text = renderNow(now, { home: 'BLUELINE' });
    expect(text).toContain('**Steward:** none');
    expect(text).toContain('the bundle holds 1 media file');
    expect(text).toContain('[[BLUELINE]]');
    expect(text).not.toContain('Ready to advance');
  });

  test('readConsolidationCycle tolerates bold markers and case', () => {
    expect(readConsolidationCycle('**As of last consolidation:** cycle 17 (2026-06-23)')).toBe(17);
    expect(readConsolidationCycle('as of last consolidation: Cycle 3')).toBe(3);
    expect(readConsolidationCycle('nothing here')).toBeNull();
  });
});

describe('renderMakingSection', () => {
  test('carries headline, ground, body, artifacts, left-rough and the id marker', () => {
    const s = renderMakingSection(BOARD[3], { cycle: 6 });
    expect(s).toContain('<!-- scroll:entry id="shep-003" -->');
    expect(s).toContain('### 2026-06-06 — cycle 6 — Twelve drones rendered');
    expect(s).toContain('> shipped · steward leans STAIRCASE next');
    expect(s).toContain('[the C drone](Projects/Shepard Tone Synthesizer/drones/c.wav)');
    expect(s).toContain('_Left rough:_ no crossfade yet');
    expect(s).toContain('<!-- /scroll:entry -->');
  });

  test('renders a payload table as a markdown grid', () => {
    const s = renderMakingSection(msg({ id: 't', payload: { kind: 'shipped_artifact', headline: 'sweep', table: { caption: 'K-sweep', columns: ['K', 'R'], rows: [['0', '0.02'], ['1.5', '0.99']] } } }));
    expect(s).toContain('| K | R |');
    expect(s).toContain('| 1.5 | 0.99 |');
  });
});

describe('zone editing', () => {
  const skeleton = [
    'head', MARK.nowStart, 'OLD NOW', MARK.nowEnd, '', '## Standing Orders', '', MARK.ordersStart, 'prefer beryl', MARK.ordersEnd, '',
    '## The making', '', MARK.makingStart, '<!-- scroll:entry id="a" -->\n### old\n<!-- /scroll:entry -->', MARK.makingEnd, '',
  ].join('\n');

  test('updateScrollText replaces only the NOW zone and prepends new sections; orders and old sections are byte-preserved', () => {
    const r = updateScrollText(skeleton, { nowText: 'NEW NOW', newSections: ['<!-- scroll:entry id="b" -->\n### new\n<!-- /scroll:entry -->'] });
    expect(r.applied).toBe(true);
    expect(r.text).toContain(`${MARK.nowStart}\nNEW NOW\n${MARK.nowEnd}`);
    expect(r.text).not.toContain('OLD NOW');
    expect(r.text).toContain('prefer beryl');
    expect(r.text.indexOf('id="b"')).toBeLessThan(r.text.indexOf('id="a"')); // newest first
    expect(existingEntryIds(r.text)).toEqual(new Set(['a', 'b']));
  });

  test('a hand-made scroll without markers is left alone', () => {
    const r = updateScrollText('# my own scroll\nno markers', { nowText: 'x', newSections: [] });
    expect(r.applied).toBe(false);
    expect(r.reason).toBe('now-markers-missing');
  });

  test('readZone / readStandingOrders (placeholder reads as empty)', () => {
    expect(readZone(skeleton, MARK.ordersStart, MARK.ordersEnd)).toBe('prefer beryl');
    expect(readStandingOrders(skeleton)).toBe('prefer beryl');
    const placeholder = skeleton.replace('prefer beryl', ORDERS_PLACEHOLDER);
    expect(readStandingOrders(placeholder)).toBe('');
    expect(readStandingOrders('nothing')).toBe('');
  });
});

describe('materializeScroll', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  function palace() {
    root = mkdtempSync(path.join(tmpdir(), 'palace-scroll-'));
    mkdirSync(path.join(root, 'Projects'), { recursive: true });
    writeFileSync(path.join(root, 'Projects', `${HOME}.md`), '---\ntitle: "Shepard Tone Synthesizer"\ntype: project\nstatus: active\nstage: growing\n---\n# x\n\n**As of last consolidation:** cycle 4');
    const agentDir = path.join(root, '_ops/agents/permanent/shepard');
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(path.join(agentDir, 'state.json'), JSON.stringify(STATE));
    writeFileSync(path.join(agentDir, 'history.jsonl'), HISTORY.map((e) => JSON.stringify(e)).join('\n') + '\n');
    mkdirSync(path.join(root, '_ops/swarm/persistent'), { recursive: true });
    writeFileSync(path.join(root, '_ops/swarm/persistent/blackboard.jsonl'), BOARD.map((m) => JSON.stringify(m)).join('\n') + '\n');
    return agentDir;
  }

  test('creates the scroll in the bundle with all three zones, then re-materializes idempotently', () => {
    const agentDir = palace();
    const r1 = materializeScroll({ palaceRoot: root, home: HOME, agentDir, tsNow: '2026-06-10T00:00:00Z' });
    expect(r1.written).toBe(true);
    expect(r1.created).toBe(true);
    expect(r1.added_sections).toBe(1);
    expect(r1.scrollPath).toBe(path.join(root, 'Projects', HOME, `${HOME} — scroll.md`));
    const t1 = readFileSync(r1.scrollPath, 'utf8');
    expect(t1).toContain('title: "Shepard Tone Synthesizer — scroll"');
    expect(t1).toContain('label: scroll-for');
    expect(t1).toContain(MARK.ordersStart);
    expect(t1).toContain('id="shep-003"');
    // hand-write standing orders, then regenerate: orders survive, no duplicate section
    const edited = t1.replace(ORDERS_PLACEHOLDER, 'Never ask me about crossfades again. Prefer the illusion.');
    writeFileSync(r1.scrollPath, edited);
    const r2 = materializeScroll({ palaceRoot: root, home: HOME, agentDir, tsNow: '2026-06-11T00:00:00Z' });
    expect(r2.created).toBe(false);
    expect(r2.added_sections).toBe(0);
    const t2 = readFileSync(r2.scrollPath, 'utf8');
    expect(t2).toContain('Never ask me about crossfades again.');
    expect(t2).toContain('Regenerated 2026-06-11T00:00:00Z');
    expect((t2.match(/id="shep-003"/g) || []).length).toBe(1);
    expect(readStandingOrders(t2)).toBe('Never ask me about crossfades again. Prefer the illusion.');
  });

  test('an unstewarded project gets a scroll backfilled from its bundle media', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-scroll-'));
    mkdirSync(path.join(root, 'Projects', 'Murmuration'), { recursive: true });
    writeFileSync(path.join(root, 'Projects', 'Murmuration.md'), '---\ntype: project\nstatus: active\nstage: growing\n---\n# m');
    writeFileSync(path.join(root, 'Projects', 'Murmuration', 'flock.png'), 'png');
    writeFileSync(path.join(root, 'Projects', 'Murmuration', 'Murmuration — hero.png'), 'png');
    const r = materializeScroll({ palaceRoot: root, home: 'Murmuration', board: [], tsNow: '2026-09-23T00:00:00Z' });
    const t = readFileSync(r.scrollPath, 'utf8');
    expect(t).toContain('**Steward:** none');
    expect(t).toContain('backfilled from the bundle');
    expect(t).toContain('[flock.png](Projects/Murmuration/flock.png)');
    expect(t).not.toContain('hero.png');
  });

  test('entry-inside-bundle layout (BLUELINE) resolves the holding folder as the bundle', () => {
    root = mkdtempSync(path.join(tmpdir(), 'palace-scroll-'));
    mkdirSync(path.join(root, 'Projects', 'BLUELINE'), { recursive: true });
    writeFileSync(path.join(root, 'Projects', 'BLUELINE', 'BLUELINE.md'), '---\ntype: project\nstatus: active\nstage: growing\n---\n# b');
    expect(resolveBundleDir(root, 'BLUELINE').bundleDir).toBe(path.join(root, 'Projects', 'BLUELINE'));
    expect(scrollPathFor(root, 'BLUELINE')).toBe(path.join('Projects', 'BLUELINE', 'BLUELINE — scroll.md'));
    const r = materializeScroll({ palaceRoot: root, home: 'BLUELINE', board: [], tsNow: '2026-09-23T00:00:00Z' });
    expect(existsSync(path.join(root, 'Projects', 'BLUELINE', 'BLUELINE — scroll.md'))).toBe(true);
    expect(existsSync(path.join(root, 'Projects', 'BLUELINE', 'BLUELINE'))).toBe(false);
    expect(r.written).toBe(true);
  });

  test('returns written:false for a missing entry and for dry runs', () => {
    palace();
    expect(materializeScroll({ palaceRoot: root, home: 'Ghost' })).toEqual({ written: false, reason: 'entry-file-not-found' });
    const r = materializeScroll({ palaceRoot: root, home: HOME, board: BOARD, dryRun: true, tsNow: '2026-06-10T00:00:00Z' });
    expect(r.written).toBe(false);
    expect(existsSync(r.scrollPath)).toBe(false);
  });
});

describe('payloadProse — messages with no canonical prose still read on the trail', () => {
  test('BLUELINE-style result payloads render their own fields; path arrays become artifacts', async () => {
    const { payloadProse, payloadPathArtifacts } = await import('../../src/scroll-file.js');
    const p = { kind: 'result', entry: 'BLUELINE', move: 'M3.7 test', verdict: 'seed-lock wins', design_rule: 'flow field = spine', next: 'Track II', proof: ['Projects/BLUELINE/proofs/a.md', 'Projects/BLUELINE/proofs/b.png'], cost_usd_cumulative: 3.2, worktree: 'wt' };
    const prose = payloadProse(p);
    expect(prose).toContain('**move:** M3.7 test');
    expect(prose).toContain('**design rule:** flow field = spine');
    expect(prose).not.toContain('worktree');
    expect(prose).not.toContain('proof');
    expect(payloadPathArtifacts(p)).toEqual([{ path: 'Projects/BLUELINE/proofs/a.md', caption: null }, { path: 'Projects/BLUELINE/proofs/b.png', caption: null }]);
    const s = renderMakingSection(msg({ id: 'r1', payload: p }));
    expect(s).toContain('### 2026-06-06 — M3.7 test');
    expect(s).toContain('[b.png](Projects/BLUELINE/proofs/b.png)');
    expect(payloadProse({ content: 'canon wins' , move: 'x' })).toBe('canon wins');
    expect(payloadProse(null)).toBe('');
  });
});
