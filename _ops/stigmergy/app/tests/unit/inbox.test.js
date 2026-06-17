import { describe, test, expect } from 'vitest';
import { buildInbox } from '../../src/lib/inbox.js';

const REQ = (request_id, ts = '2026-04-01T15:00:00Z', extras = {}) => ({
  schema_version: '1.0', id: `msg-${request_id}`, ts,
  session_id: 's', from: 'Spinoza Conatus', to: 'TRICKSTER',
  type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
  request_id,
  health: { context_pct: 0.61, score: 'green', model: 'a' },
  payload: { resource: 'web_search', rationale: 'r', blocking: true },
  ...extras,
});

const GRANT = (re, ts = '2026-04-01T15:01:00Z', extras = {}) => ({
  schema_version: '1.0', id: `grant-${re}`, ts,
  session_id: 's', from: 'TRICKSTER', to: 'Spinoza Conatus',
  type: 'RESOURCE_GRANT', board: 'TRICKSTER',
  re,
  health: { context_pct: 0.0, score: 'green', model: 'human' },
  payload: { granted: true },
  ...extras,
});

const DENY = (re, ts = '2026-04-01T15:01:00Z', extras = {}) => ({
  schema_version: '1.0', id: `deny-${re}`, ts,
  session_id: 's', from: 'TRICKSTER', to: 'Spinoza Conatus',
  type: 'RESOURCE_DENY', board: 'TRICKSTER',
  re,
  health: { context_pct: 0.0, score: 'green', model: 'human' },
  payload: { granted: false, reason: 'no' },
  ...extras,
});

describe('buildInbox', () => {
  test('empty input returns empty list', () => {
    expect(buildInbox([]).pending_requests).toEqual([]);
    expect(buildInbox(null).pending_requests).toEqual([]);
  });

  test('a paired RESOURCE_REQUEST is NOT in the inbox', () => {
    const r = buildInbox([REQ('r-1'), GRANT('r-1')]);
    expect(r.pending_requests).toEqual([]);
  });

  test('an unpaired RESOURCE_REQUEST IS in the inbox', () => {
    const r = buildInbox([REQ('r-1')]);
    expect(r.pending_requests).toHaveLength(1);
    expect(r.pending_requests[0].request_id).toBe('r-1');
  });

  test('a RESOURCE_DENY counts as a response (paired)', () => {
    const r = buildInbox([REQ('r-1'), DENY('r-1')]);
    expect(r.pending_requests).toEqual([]);
  });

  test('multiple responses to the same request: still treated as paired', () => {
    // Edge case from Infrastructure Spec §2.6 — should not double-count.
    const r = buildInbox([REQ('r-1'), GRANT('r-1'), GRANT('r-1')]);
    expect(r.pending_requests).toEqual([]);
  });

  test('only TRICKSTER-board messages are considered', () => {
    const r = buildInbox([
      { ...REQ('r-1'), board: 'GENERAL' },         // wrong board → ignored
      REQ('r-2'),                                   // TRICKSTER → counted
    ]);
    expect(r.pending_requests).toHaveLength(1);
    expect(r.pending_requests[0].request_id).toBe('r-2');
  });

  test('non-RESOURCE_REQUEST types do not appear', () => {
    const r = buildInbox([
      { ...REQ('r-1'), type: 'BROADCAST' },
      REQ('r-2'),
    ]);
    expect(r.pending_requests.map((p) => p.request_id)).toEqual(['r-2']);
  });

  test('shape per Infrastructure Spec §2.6: required fields present', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z')]);
    const item = r.pending_requests[0];
    expect(item.request_id).toBe('r-1');
    expect(item.from).toBe('Spinoza Conatus');
    expect(item.ts).toBe('2026-04-01T15:00:00Z');
    expect(item.resource).toBe('web_search');
    expect(item.rationale).toBe('r');
    expect(item.blocking).toBe(true);
    expect(item.agent_health).toBe('green');
    expect(item.agent_context_pct).toBe(0.61);
    expect(item.agent_status).toBe('suspended_on_this_thread');
    expect(Array.isArray(item.response_options)).toBe(true);
    expect(item.response_options.length).toBeGreaterThanOrEqual(4);
  });

  test('Phase 4 fields: _message_id and _session_id are present on each pending item', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z')]);
    const item = r.pending_requests[0];
    // _message_id is the source message's own id (msg-r-1 from the REQ helper).
    expect(item._message_id).toBe('msg-r-1');
    // _session_id comes from the source message.
    expect(item._session_id).toBe('s');
  });

  test('agent_status "continuing" when blocking is false', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z',
      { payload: { resource: 'web_search', rationale: 'r', blocking: false } })]);
    expect(r.pending_requests[0].agent_status).toBe('continuing');
    expect(r.pending_requests[0].blocking).toBe(false);
  });

  test('inbox is sorted by ts descending (newest first)', () => {
    const r = buildInbox([
      REQ('r-late', '2026-04-01T16:00:00Z'),
      REQ('r-early', '2026-04-01T14:00:00Z'),
      REQ('r-mid', '2026-04-01T15:00:00Z'),
    ]);
    expect(r.pending_requests.map((p) => p.request_id))
      .toEqual(['r-late', 'r-mid', 'r-early']);
  });

  test('inbox newest-first is chronological, not lexical (mixed timezones)', () => {
    // r-eastern is 19:30-04:00 = 23:30Z — chronologically AFTER r-utc (23:00Z),
    // even though it sorts BEFORE lexically ("19" < "23").
    const r = buildInbox([
      REQ('r-utc', '2026-04-01T23:00:00Z'),
      REQ('r-eastern', '2026-04-01T19:30:00-04:00'),
    ]);
    expect(r.pending_requests.map((p) => p.request_id))
      .toEqual(['r-eastern', 'r-utc']);
  });

  test('does not throw on messages with missing fields', () => {
    expect(() => buildInbox([{}, null, { board: 'TRICKSTER' }])).not.toThrow();
  });
});

describe('buildInbox — asker-defined payload.options[] (Infrastructure Spec §2.6)', () => {
  test('absent options[] yields options: null on the item', () => {
    const r = buildInbox([REQ('r-1')]);
    expect(r.pending_requests[0].options).toBeNull();
  });

  test('canonical object form {id, label} is preserved', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'audition', rationale: 'r', blocking: true,
        options: [
          { id: 'APPROVE', label: 'APPROVE — ship it' },
          { id: 'ADJUST', label: 'ADJUST — re-voice and re-audition' },
        ],
      },
    })]);
    expect(r.pending_requests[0].options).toEqual([
      { id: 'APPROVE', label: 'APPROVE — ship it' },
      { id: 'ADJUST', label: 'ADJUST — re-voice and re-audition' },
    ]);
  });

  test('canonical form preserves the optional next field', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'audition', rationale: 'r', blocking: true,
        options: [
          { id: 'ADJUST', label: 'ADJUST', next: 'What should I change?' },
        ],
      },
    })]);
    expect(r.pending_requests[0].options).toEqual([
      { id: 'ADJUST', label: 'ADJUST', next: 'What should I change?' },
    ]);
  });

  test('lenient string form: ID derived from leading token before em-dash', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'audition', rationale: 'r', blocking: true,
        options: [
          'APPROVE — pitch reads and timbre is good; greenlight the full batch.',
          'ADJUST — name what is off and I re-audition.',
          'REJECT — wrong choice; suggest a different framing.',
        ],
      },
    })]);
    expect(r.pending_requests[0].options).toEqual([
      { id: 'APPROVE', label: 'APPROVE — pitch reads and timbre is good; greenlight the full batch.' },
      { id: 'ADJUST', label: 'ADJUST — name what is off and I re-audition.' },
      { id: 'REJECT', label: 'REJECT — wrong choice; suggest a different framing.' },
    ]);
  });

  test('lenient string form: hyphenated leading tokens stay intact', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'audition', rationale: 'r', blocking: true,
        options: [
          'accept — sweep reads as intentional; proceed',
          'tweak-model — motion is there but partials need reshaping',
          'try-carry-phase — too tame; build a carry_phase_through variant',
        ],
      },
    })]);
    expect(r.pending_requests[0].options.map((o) => o.id)).toEqual([
      'accept', 'tweak-model', 'try-carry-phase',
    ]);
  });

  test('lenient string form: ASCII hyphen separator works', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'x', rationale: 'r', blocking: true,
        options: ['yes - do it'],
      },
    })]);
    expect(r.pending_requests[0].options[0].id).toBe('yes');
  });

  test('lenient string form: colon separator works', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'x', rationale: 'r', blocking: true,
        options: ['proceed: full keyboard batch'],
      },
    })]);
    expect(r.pending_requests[0].options[0].id).toBe('proceed');
  });

  test('lenient string form: no separator falls back to truncated string as id', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'x', rationale: 'r', blocking: true,
        options: ['just one bare option with no separator'],
      },
    })]);
    expect(r.pending_requests[0].options[0].id).toBe('just one bare option with no sep');
    expect(r.pending_requests[0].options[0].label).toBe('just one bare option with no separator');
  });

  test('mixed shapes: object and string entries in one array both parse', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'x', rationale: 'r', blocking: true,
        options: [
          { id: 'A', label: 'A — canonical' },
          'B — lenient string',
        ],
      },
    })]);
    expect(r.pending_requests[0].options).toEqual([
      { id: 'A', label: 'A — canonical' },
      { id: 'B', label: 'B — lenient string' },
    ]);
  });

  test('malformed entries are dropped, valid ones survive', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'x', rationale: 'r', blocking: true,
        options: [
          null,
          { id: '', label: 'empty id' },
          { id: 'A', label: '' },
          [],
          '',
          'C — survivor',
          { id: 'D', label: 'survivor object' },
        ],
      },
    })]);
    expect(r.pending_requests[0].options).toEqual([
      { id: 'C', label: 'C — survivor' },
      { id: 'D', label: 'survivor object' },
    ]);
  });

  test('all entries malformed: options is null (not empty array)', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'x', rationale: 'r', blocking: true,
        options: [null, '', { id: '' }],
      },
    })]);
    expect(r.pending_requests[0].options).toBeNull();
  });

  test('top-level options[] is accepted as a fallback when payload.options is missing', () => {
    // Drift observed in the wild (cycle-11 GSL batch run, 2026-05-27):
    // a steward placed options at the top level instead of inside payload.
    // The validator accepts (it does not enforce payload shape), so the UI
    // must tolerate this rather than silently fall through to the generic
    // response-options template.
    const r = buildInbox([{
      ...REQ('r-1', '2026-04-01T15:00:00Z'),
      options: [
        { id: 'A', label: 'A — first' },
        { id: 'B', label: 'B — second' },
      ],
    }]);
    expect(r.pending_requests[0].options).toEqual([
      { id: 'A', label: 'A — first' },
      { id: 'B', label: 'B — second' },
    ]);
  });

  test('payload.options wins over top-level options when both are present', () => {
    const r = buildInbox([{
      ...REQ('r-1', '2026-04-01T15:00:00Z', {
        payload: {
          resource: 'x', rationale: 'r', blocking: true,
          options: [{ id: 'CANONICAL', label: 'CANONICAL — payload location' }],
        },
      }),
      options: [{ id: 'DRIFTED', label: 'DRIFTED — top-level location' }],
    }]);
    expect(r.pending_requests[0].options).toEqual([
      { id: 'CANONICAL', label: 'CANONICAL — payload location' },
    ]);
  });

  test('top-level options fallback also tolerates lenient string entries', () => {
    const r = buildInbox([{
      ...REQ('r-1', '2026-04-01T15:00:00Z'),
      options: ['APPROVE — ship it', 'REJECT — try again'],
    }]);
    expect(r.pending_requests[0].options).toEqual([
      { id: 'APPROVE', label: 'APPROVE — ship it' },
      { id: 'REJECT', label: 'REJECT — try again' },
    ]);
  });
});

describe('buildInbox — inline artifacts from the wire (payload.artifacts)', () => {
  test('absent artifacts yields an empty array (never null/undefined)', () => {
    const item = buildInbox([REQ('r-1')]).pending_requests[0];
    expect(item.artifacts).toEqual([]);
  });

  test('payload.artifacts[] flows onto the item as {path, caption}', () => {
    const item = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'human_ear_check', rationale: 'r', blocking: true,
        artifacts: [
          { path: 'Projects/Crystal Synthesizer/dispersion-filter/01_dry_click.wav', caption: '01 dry click' },
          { path: 'Projects/Crystal Synthesizer/dispersion-filter/02_dispersed_click.wav' },
        ],
      },
    })]).pending_requests[0];
    expect(item.artifacts).toEqual([
      { path: 'Projects/Crystal Synthesizer/dispersion-filter/01_dry_click.wav', caption: '01 dry click' },
      { path: 'Projects/Crystal Synthesizer/dispersion-filter/02_dispersed_click.wav', caption: null },
    ]);
  });

  test('legacy payload.artifact_path (string) is normalized to a single-entry array', () => {
    const item = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z', {
      payload: {
        resource: 'audition', rationale: 'r', blocking: true,
        artifact_path: 'Projects/Slime Mold Delay/slime-mold-webaudio-bench.html',
      },
    })]).pending_requests[0];
    expect(item.artifacts).toEqual([
      { path: 'Projects/Slime Mold Delay/slime-mold-webaudio-bench.html', caption: null },
    ]);
  });
});
