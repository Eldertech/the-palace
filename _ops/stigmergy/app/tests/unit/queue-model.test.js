import { describe, it, expect } from 'vitest';
import {
  buildQueue, reconcileQueue, partitionQueue, rankQueue, laneCounts, vantage, deriveAsk,
  synthesizeProposalAsk, synthesizeFlagAsk, cardAge, STALE_AGE_MS,
} from '../../src/lib/queue-model.js';

function reqMsg(over = {}) {
  return {
    id: 'm1', request_id: 'req-1', type: 'RESOURCE_REQUEST', from: '@Steward',
    ts: '2026-05-29T10:00:00Z', board: 'TRICKSTER',
    payload: { resource: 'GPU minutes', rationale: 'render a sim', blocking: false },
    ...over,
  };
}

function proposalMsg(over = {}) {
  return {
    id: 'vp-1', type: 'BROADCAST', from: '@weave-swarm',
    ts: '2026-06-01T10:00:00Z', board: 'WEAVE', session_id: 'weave-2026-06-01',
    payload: {
      kind: 'vector_proposal',
      proposal_type: 'promote_unsung',
      source_entry: 'Kuramoto Coupling.md',
      target_entry: 'Spinoza Conatus.md',
      proposed_change: 'promote the body wikilink [[Spinoza Conatus]] in [[Kuramoto Coupling]] to a typed connects-to link',
      rationale: 'Kuramoto Coupling references Spinoza Conatus in prose but lacks a YAML typed link.',
      stale_if: 'Kuramoto Coupling YAML adds a typed link to Spinoza Conatus',
    },
    ...over,
  };
}

function handoffMsg(over = {}) {
  return {
    id: 'h1', type: 'BROADCAST', from: '@Project Stewardship System',
    ts: '2026-05-29T09:00:00Z', board: 'GENERAL',
    payload: {
      kind: 'handoff_ready',
      entry: 'Project Stewardship System',
      handoff_path: 'Project Stewardship System/x — handoff.md',
      summary: 'mid-move on Stage C',
      stale_if: 'a commit touches Project Stewardship System after this',
    },
    ...over,
  };
}

function todoMsg(over = {}) {
  return {
    id: 'stigmergy-todo-t1', type: 'FLAG', from: 'STIGMERGY (Companion)',
    ts: '2026-06-08T12:00:00Z', board: 'FLAGS', session_id: 'companion-stigmergy',
    payload: {
      kind: 'stigmergy_todo',
      title: 'make the LOG filters clearer',
      detail: 'the filter row is hard to scan at a glance.',
      area: 'log', severity: 'minor', status: 'open',
    },
    ...over,
  };
}

describe('buildQueue — stigmergy_todo (Stage 1 to-do capture)', () => {
  it('renders a captured to-do as a queue item on the FLAGS lane', () => {
    const items = buildQueue([todoMsg()]);
    expect(items).toHaveLength(1);
    const it0 = items[0];
    expect(it0.kind).toBe('stigmergy_todo');
    expect(it0.id).toBe('stigmergy-todo-t1');
    expect(it0.ask).toBe('make the LOG filters clearer');
    expect(it0.area).toBe('log');
    expect(it0.severity).toBe('minor');
    expect(it0.board).toBe('FLAGS');
    expect(it0.stale_if).toMatch(/Palace-Resolves: stigmergy-todo-t1/);
  });

  it('is retired by a RESOURCE_GRANT/DENY answering it (re: its id)', () => {
    const grant = { id: 'g1', type: 'RESOURCE_GRANT', re: 'stigmergy-todo-t1', from: 'TRICKSTER', ts: '2026-06-08T12:05:00Z', board: 'TRICKSTER', payload: {} };
    const items = buildQueue([todoMsg(), grant]);
    expect(items.find((i) => i.kind === 'stigmergy_todo')).toBeUndefined();
  });

  it('does NOT auto-close on an entry touch (it names no palace entry)', () => {
    const items = buildQueue([todoMsg()]);
    const reconciled = reconcileQueue(items, [{ shortHash: 'abc', date: '2026-06-09T00:00:00Z', entries: ['Spinoza'], resolves: [] }]);
    expect(reconciled[0].resolved.done).toBe(false);
  });

  it('IS closed by a commit carrying Palace-Resolves: <id>', () => {
    const items = buildQueue([todoMsg()]);
    const reconciled = reconcileQueue(items, [{ shortHash: 'def', date: '2026-06-09T00:00:00Z', entries: [], resolves: ['stigmergy-todo-t1'] }]);
    expect(reconciled[0].resolved.done).toBe(true);
    expect(reconciled[0].resolved.commit).toBe('def');
  });
});

describe('buildQueue', () => {
  it('turns an unanswered RESOURCE_REQUEST into an item', () => {
    const q = buildQueue([reqMsg()]);
    expect(q).toHaveLength(1);
    expect(q[0].kind).toBe('resource_request');
    expect(q[0].id).toBe('req-1');
    expect(q[0].summary).toBe('GPU minutes');
    expect(q[0].resolved.done).toBe(false);
  });

  it('drops an answered RESOURCE_REQUEST', () => {
    const grant = { id: 'g1', type: 'RESOURCE_GRANT', re: 'req-1', board: 'TRICKSTER', ts: '2026-05-29T11:00:00Z' };
    expect(buildQueue([reqMsg(), grant])).toHaveLength(0);
  });

  it('turns a handoff_ready BROADCAST into an item with entry + stale_if', () => {
    const q = buildQueue([handoffMsg()]);
    expect(q).toHaveLength(1);
    expect(q[0].kind).toBe('handoff_ready');
    expect(q[0].id).toBe('h1');
    expect(q[0].entry).toBe('Project Stewardship System');
    expect(q[0].handoff_path).toMatch(/handoff\.md$/);
    expect(q[0].pointer).toEqual({ type: 'entry', target: 'Project Stewardship System' });
    expect(q[0].stale_if).toMatch(/commit touches/);
    // A move-less/worktree-less baton carries a null worktree, not undefined.
    expect(q[0].worktree).toBeNull();
  });

  it('carries the worktree coordinate through when the board announcement has one', () => {
    const wt = { branch: 'feature/x', dir: '../palace-feature-x', profile: 'stigmergy' };
    const q = buildQueue([handoffMsg({ payload: { ...handoffMsg().payload, worktree: wt } })]);
    expect(q[0].worktree).toEqual(wt);
  });

  it('drops a handoff_ready that has been explicitly acked as picked up', () => {
    const ack = { id: 'a1', type: 'BROADCAST', board: 'GENERAL', ts: '2026-05-29T12:00:00Z', payload: { kind: 'handoff_picked_up', handoff_id: 'h1' } };
    expect(buildQueue([handoffMsg(), ack])).toHaveLength(0);
  });

  it('ranks blocking items first, then newest', () => {
    const a = reqMsg({ id: 'a', request_id: 'a', ts: '2026-05-29T08:00:00Z', payload: { resource: 'A', blocking: false } });
    const b = reqMsg({ id: 'b', request_id: 'b', ts: '2026-05-29T07:00:00Z', payload: { resource: 'B', blocking: true } });
    const c = reqMsg({ id: 'c', request_id: 'c', ts: '2026-05-29T09:00:00Z', payload: { resource: 'C', blocking: false } });
    const q = buildQueue([a, b, c]);
    expect(q.map((i) => i.id)).toEqual(['b', 'c', 'a']); // blocking first, then newest
  });

  it('ignores non-queue messages', () => {
    const noise = { id: 'n', type: 'BROADCAST', board: 'GENERAL', ts: '2026-05-29T10:00:00Z', payload: { kind: 'enrichment_card' } };
    expect(buildQueue([noise])).toHaveLength(0);
  });

  it('returns [] for non-array', () => {
    expect(buildQueue(null)).toEqual([]);
  });

  it('turns a vector_proposal BROADCAST into an item with proposal fields + pointer to source', () => {
    const q = buildQueue([proposalMsg()]);
    expect(q).toHaveLength(1);
    expect(q[0].kind).toBe('vector_proposal');
    expect(q[0].id).toBe('vp-1');
    expect(q[0].proposal_type).toBe('promote_unsung');
    expect(q[0].source_entry).toBe('Kuramoto Coupling.md');
    expect(q[0].target_entry).toBe('Spinoza Conatus.md');
    expect(q[0].ask).toMatch(/promote.*Spinoza/i);
    expect(q[0].pointer).toEqual({ type: 'entry', target: 'Kuramoto Coupling.md' });
    expect(q[0].stale_if).toMatch(/Spinoza/);
  });

  it('drops a vector_proposal that has been answered by a RESOURCE_GRANT', () => {
    const grant = { id: 'g-vp', type: 'RESOURCE_GRANT', re: 'vp-1', board: 'WEAVE', ts: '2026-06-01T11:00:00Z' };
    expect(buildQueue([proposalMsg(), grant])).toHaveLength(0);
  });

  it('drops a vector_proposal that has been answered by a RESOURCE_DENY', () => {
    const deny = { id: 'd-vp', type: 'RESOURCE_DENY', re: 'vp-1', board: 'WEAVE', ts: '2026-06-01T11:00:00Z' };
    expect(buildQueue([proposalMsg(), deny])).toHaveLength(0);
  });

  it('synthesizes an ask when proposed_change is missing', () => {
    const q = buildQueue([proposalMsg({
      payload: {
        kind: 'vector_proposal',
        proposal_type: 'new_typed_link',
        source_entry: 'Foo.md',
        target_entry: 'Bar.md',
      },
    })]);
    expect(q[0].ask).toMatch(/add a typed link.*Foo.*Bar/i);
  });

  it('falls back to board pointer when source_entry is absent', () => {
    const q = buildQueue([proposalMsg({
      payload: {
        kind: 'vector_proposal',
        proposal_type: 'label_enrichment',
      },
    })]);
    expect(q[0].pointer).toEqual({ type: 'board', target: 'WEAVE' });
  });

  it('surfaces a structured apply op when the proposal carries one (drives grant & apply)', () => {
    const q = buildQueue([proposalMsg({
      payload: {
        kind: 'vector_proposal',
        proposal_type: 'vector_tuning',
        source_entry: 'Retrospective Delay.md',
        apply: { op: 'set-vector', entry: 'Retrospective Delay', text: 'I will keep turning latency into memory.' },
      },
    })]);
    expect(q[0].apply).toEqual({ op: 'set-vector', entry: 'Retrospective Delay', text: 'I will keep turning latency into memory.' });
  });

  it('leaves apply null for a prose-only proposal (stays manual-grant)', () => {
    expect(buildQueue([proposalMsg()])[0].apply).toBe(null);
  });

  it('leaves apply null for a malformed apply op', () => {
    const q = buildQueue([proposalMsg({
      payload: { kind: 'vector_proposal', proposal_type: 'vector_tuning', source_entry: 'X.md', apply: { op: 'set-vector', entry: 'X' } },
    })]);
    expect(q[0].apply).toBe(null);
  });
});

describe('reconcileQueue — vector_proposal', () => {
  it('resolves a vector_proposal when a commit touches its source entry AFTER it was posted', () => {
    const q = buildQueue([proposalMsg()]);
    const commits = [{
      shortHash: 'abc123', date: '2026-06-01T12:00:00Z',
      entries: ['Kuramoto Coupling.md'], resolves: [],
    }];
    const out = reconcileQueue(q, commits);
    expect(out[0].resolved.done).toBe(true);
    expect(out[0].resolved.reason).toMatch(/abc123.*Kuramoto/);
  });
  it('leaves a vector_proposal open when no commit touches its source entry', () => {
    const q = buildQueue([proposalMsg()]);
    const commits = [{
      shortHash: 'def456', date: '2026-06-01T12:00:00Z',
      entries: ['Some Other Entry.md'], resolves: [],
    }];
    const out = reconcileQueue(q, commits);
    expect(out[0].resolved.done).toBe(false);
  });
  it('resolves via explicit Palace-Resolves: <proposal-id> in a commit', () => {
    const q = buildQueue([proposalMsg()]);
    const commits = [{
      shortHash: 'aaa999', date: '2026-06-01T12:00:00Z',
      entries: [], resolves: ['vp-1'],
    }];
    const out = reconcileQueue(q, commits);
    expect(out[0].resolved.done).toBe(true);
  });
});

function flagMsg(over = {}) {
  return {
    schema_version: '1.0',
    id: 'wf-1', type: 'BROADCAST', from: 'deposit-ceremony',
    to: 'weave-ceremony',
    ts: '2026-06-05T13:45:00.000Z', board: 'WEAVE', session_id: 'deposit-BATCH01',
    health: {
      context_pct: 0, stop_reason: 'deposit', iteration: 1,
      tokens_this_call: 0, model: 'deposit', score: 'green',
    },
    payload: {
      kind: 'weave_flag',
      flag_type: 'backlink_audit',
      source_deposit_id: 'BATCH01',
      source_entries: ['Floquet Theory', 'Kuramoto Coupling'],
      target_entry: 'Phase Reduction',
      proposed_action: 'Add couples-with link from each hub to Phase Reduction with label `bridge-via-PRC`.',
      rationale: 'Phase Reduction names the bridge between the two existing hubs.',
    },
    ...over,
  };
}

describe('buildQueue — weave_flag', () => {
  it('turns a weave_flag BROADCAST into a queue item with array source_entries', () => {
    const q = buildQueue([flagMsg()]);
    expect(q).toHaveLength(1);
    const it = q[0];
    expect(it.kind).toBe('weave_flag');
    expect(it.id).toBe('wf-1');
    expect(it.flag_type).toBe('backlink_audit');
    expect(it.source_deposit_id).toBe('BATCH01');
    expect(it.source_entries).toEqual(['Floquet Theory', 'Kuramoto Coupling']);
    expect(it.target_entry).toBe('Phase Reduction');
    expect(it.ask).toMatch(/couples-with/);
    expect(it.summary).toBe(it.ask);
    // Primary entry aliasing for the pointer chip; full array for reconciler.
    expect(it.entry).toBe('Floquet Theory');
    expect(it.entries).toEqual(['Floquet Theory', 'Kuramoto Coupling']);
    expect(it.pointer).toEqual({ type: 'entry', target: 'Floquet Theory' });
    expect(it.stale_if).toMatch(/Floquet Theory|Kuramoto Coupling/);
  });

  it('drops a weave_flag answered by RESOURCE_GRANT', () => {
    const grant = {
      id: 'g-wf', type: 'RESOURCE_GRANT', re: 'wf-1', board: 'WEAVE',
      ts: '2026-06-05T14:00:00Z',
    };
    expect(buildQueue([flagMsg(), grant])).toHaveLength(0);
  });

  it('drops a weave_flag answered by RESOURCE_DENY', () => {
    const deny = {
      id: 'd-wf', type: 'RESOURCE_DENY', re: 'wf-1', board: 'WEAVE',
      ts: '2026-06-05T14:00:00Z',
    };
    expect(buildQueue([flagMsg(), deny])).toHaveLength(0);
  });

  it('synthesizes an ask from flag_type + source_entries when proposed_action is absent', () => {
    const q = buildQueue([flagMsg({
      payload: {
        kind: 'weave_flag',
        flag_type: 'mirror_link_sweep',
        source_entries: ['Foo', 'Bar'],
      },
    })]);
    expect(q[0].ask).toMatch(/sweep.*Foo.*Bar/i);
  });

  it('falls back to a board pointer when source_entries is empty', () => {
    const q = buildQueue([flagMsg({
      payload: {
        kind: 'weave_flag',
        flag_type: 'section_expansion',
        source_entries: [],
      },
    })]);
    expect(q[0].pointer).toEqual({ type: 'board', target: 'WEAVE' });
  });
});

describe('reconcileQueue — weave_flag', () => {
  it('resolves when a commit touches the FIRST source entry', () => {
    const q = buildQueue([flagMsg()]);
    const commits = [{
      shortHash: 'abc123', date: '2026-06-05T15:00:00Z',
      entries: ['Floquet Theory'], resolves: [],
    }];
    const out = reconcileQueue(q, commits);
    expect(out[0].resolved.done).toBe(true);
    expect(out[0].resolved.reason).toMatch(/abc123.*Floquet Theory/);
  });

  it('resolves when a commit touches a NON-FIRST source entry (array reconcile)', () => {
    const q = buildQueue([flagMsg()]);
    const commits = [{
      shortHash: 'def456', date: '2026-06-05T15:00:00Z',
      entries: ['Kuramoto Coupling'], resolves: [],
    }];
    const out = reconcileQueue(q, commits);
    expect(out[0].resolved.done).toBe(true);
    expect(out[0].resolved.reason).toMatch(/def456.*Kuramoto Coupling/);
  });

  it('leaves the flag open when no commit touches any of source_entries', () => {
    const q = buildQueue([flagMsg()]);
    const commits = [{
      shortHash: 'xxx', date: '2026-06-05T15:00:00Z',
      entries: ['Some Other Entry'], resolves: [],
    }];
    expect(reconcileQueue(q, commits)[0].resolved.done).toBe(false);
  });

  it('matches source_entries case-insensitively', () => {
    const q = buildQueue([flagMsg()]);
    const commits = [{
      shortHash: 'case01', date: '2026-06-05T15:00:00Z',
      entries: ['kuramoto coupling'], resolves: [],
    }];
    expect(reconcileQueue(q, commits)[0].resolved.done).toBe(true);
  });

  it('does NOT resolve when the touching commit predates the flag (honest staleness)', () => {
    const q = buildQueue([flagMsg()]);
    const commits = [{
      shortHash: 'old01', date: '2026-06-05T13:00:00Z',
      entries: ['Floquet Theory'], resolves: [],
    }];
    expect(reconcileQueue(q, commits)[0].resolved.done).toBe(false);
  });

  it('resolves via explicit Palace-Resolves: <flag-id>', () => {
    const q = buildQueue([flagMsg()]);
    const commits = [{
      shortHash: 'aaa999', date: '2026-06-05T15:00:00Z',
      entries: [], resolves: ['wf-1'],
    }];
    expect(reconcileQueue(q, commits)[0].resolved.done).toBe(true);
  });
});

describe('synthesizeFlagAsk', () => {
  it('formats backlink_audit with source list and target', () => {
    expect(synthesizeFlagAsk('backlink_audit', ['Floquet Theory', 'Kuramoto Coupling'], 'Phase Reduction'))
      .toMatch(/audit backlinks.*Floquet.*Kuramoto.*Phase Reduction/i);
  });
  it('formats missing_connection_audit', () => {
    expect(synthesizeFlagAsk('missing_connection_audit', ['Foo'], null))
      .toMatch(/audit \[\[Foo\]\] for missing connections/i);
  });
  it('formats hub_candidate', () => {
    expect(synthesizeFlagAsk('hub_candidate', ['Dissolutions'], null))
      .toMatch(/hub candidate/i);
  });
  it('falls back generically for unknown flag_type', () => {
    expect(synthesizeFlagAsk('made_up', ['Foo'], null)).toMatch(/Weave flag/i);
  });
});

describe('synthesizeProposalAsk', () => {
  it('formats a promote_unsung ask with source and target', () => {
    expect(synthesizeProposalAsk('promote_unsung', 'Foo.md', 'Bar.md'))
      .toMatch(/promote.*\[\[Foo\]\].*\[\[Bar\]\]/);
  });
  it('handles unknown proposal_type with a generic fallback', () => {
    expect(synthesizeProposalAsk('made_up_kind', 'Foo.md', null))
      .toMatch(/Weave proposal/i);
  });
});

describe('reconcileQueue', () => {
  it('resolves a handoff_ready when a commit carries Palace-Resolves: <id>', () => {
    const items = buildQueue([handoffMsg()]);
    const commits = [{ shortHash: 'abc1234', date: '2026-05-29T10:00:00Z', entries: [], resolves: ['h1'] }];
    const out = reconcileQueue(items, commits);
    expect(out[0].resolved.done).toBe(true);
    expect(out[0].resolved.commit).toBe('abc1234');
    expect(out[0].resolved.reason).toMatch(/resolved by commit/);
  });

  it('resolves a handoff_ready when a commit touches its entry AFTER it was posted', () => {
    const items = buildQueue([handoffMsg()]); // posted 09:00
    const commits = [{ shortHash: 'def5678', date: '2026-05-29T10:00:00Z', entries: ['Project Stewardship System'], resolves: [] }];
    const out = reconcileQueue(items, commits);
    expect(out[0].resolved.done).toBe(true);
    expect(out[0].resolved.commit).toBe('def5678');
    expect(out[0].resolved.reason).toMatch(/touched Project Stewardship System after/);
  });

  it('does NOT resolve when the touching commit predates the item (honest staleness)', () => {
    const items = buildQueue([handoffMsg()]); // posted 09:00
    const commits = [{ shortHash: 'old0001', date: '2026-05-29T08:00:00Z', entries: ['Project Stewardship System'], resolves: [] }];
    const out = reconcileQueue(items, commits);
    expect(out[0].resolved.done).toBe(false);
  });

  it('matches entry case-insensitively', () => {
    const items = buildQueue([handoffMsg()]);
    const commits = [{ shortHash: 'c1', date: '2026-05-29T10:00:00Z', entries: ['project stewardship system'], resolves: [] }];
    expect(reconcileQueue(items, commits)[0].resolved.done).toBe(true);
  });

  it('leaves an item open when no commit matches', () => {
    const items = buildQueue([handoffMsg()]);
    const commits = [{ shortHash: 'c1', date: '2026-05-29T10:00:00Z', entries: ['Unrelated Entry'], resolves: [] }];
    expect(reconcileQueue(items, commits)[0].resolved.done).toBe(false);
  });

  it('does not mutate the input items', () => {
    const items = buildQueue([handoffMsg()]);
    const snapshot = JSON.stringify(items);
    reconcileQueue(items, [{ shortHash: 'c1', date: '2026-05-29T10:00:00Z', entries: ['Project Stewardship System'], resolves: [] }]);
    expect(JSON.stringify(items)).toBe(snapshot);
  });

  it('handles empty commits', () => {
    const items = buildQueue([handoffMsg()]);
    expect(reconcileQueue(items, []).every((i) => !i.resolved.done)).toBe(true);
  });
});

describe('partitionQueue', () => {
  it('splits open vs resolved', () => {
    const items = buildQueue([handoffMsg(), reqMsg()]);
    const reconciled = reconcileQueue(items, [{ shortHash: 'c1', date: '2026-05-29T10:00:00Z', entries: ['Project Stewardship System'], resolves: [] }]);
    const { open, resolved } = partitionQueue(reconciled);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].kind).toBe('handoff_ready');
    expect(open).toHaveLength(1);
    expect(open[0].kind).toBe('resource_request');
  });
});

describe('laneCounts', () => {
  it('counts items per board', () => {
    const m = laneCounts(buildQueue([handoffMsg(), reqMsg()]));
    expect(m.get('GENERAL')).toBe(1);
    expect(m.get('TRICKSTER')).toBe(1);
  });
});

describe('vantage', () => {
  it('formats a time + author vantage string', () => {
    expect(vantage({ ts: '2026-05-29T09:00:00Z', from: '@X' })).toBe('announced 09:00:00Z, from @X');
  });
  it('degrades gracefully', () => {
    expect(vantage({})).toMatch(/from \?/);
  });
});

describe('deriveAsk — turn a request payload into a human ask', () => {
  it('prefers decision_topic (the asker\'s explicit question)', () => {
    expect(deriveAsk({
      decision_topic: 'Where do I start?',
      subject: 'something else',
      rationale: 'long context...',
      resource: 'directional_decision',
    })).toBe('Where do I start?');
  });

  it('falls back to decision_needed when decision_topic absent', () => {
    expect(deriveAsk({
      decision_needed: 'Approve audition?',
      rationale: 'long...',
    })).toBe('Approve audition?');
  });

  it('falls back to subject when no decision form', () => {
    expect(deriveAsk({
      subject: 'First move for the engine',
      rationale: 'context',
    })).toBe('First move for the engine');
  });

  it('falls back to first sentence of rationale', () => {
    expect(deriveAsk({
      rationale: 'Quick catch-up: I am Foo. Then more details here.',
      resource: 'sensory_audition_gate',
    })).toBe('Quick catch-up: I am Foo.');
  });

  it('caps the rationale fallback at ~200 chars', () => {
    const long = `${'A'.repeat(300)} short sentence.`;
    const r = deriveAsk({ rationale: long });
    expect(r.length).toBeLessThanOrEqual(200);
    expect(r.endsWith('...')).toBe(true);
  });

  it('falls back to the technical resource type only when nothing else exists', () => {
    expect(deriveAsk({ resource: 'sensory_audition_gate' })).toBe('sensory_audition_gate');
  });

  it('returns null on empty / non-object', () => {
    expect(deriveAsk(null)).toBe(null);
    expect(deriveAsk({})).toBe(null);
    expect(deriveAsk('not an object')).toBe(null);
  });
});

describe('buildQueue — the new ask/resourceType/rationale fields', () => {
  it('exposes ask, resourceType, rationale, recommendation, options, sessionId on resource_request items', () => {
    const msg = {
      id: 'inh-005',
      request_id: 'inh-005',
      type: 'RESOURCE_REQUEST',
      from: 'Inharmonic Wavetable Synthesis',
      ts: '2026-05-27T20:21:00-04:00',
      board: 'TRICKSTER',
      session_id: 'permanent-stewardship-inharmonic-2026-05-27',
      payload: {
        resource: 'sensory_audition_gate',
        rationale: 'Quick catch-up: I am the dual-wavetable synth.',
        decision_topic: 'Audition the dual-wavetable prototype?',
        steward_recommendation: 'ARCHITECTURE-VERIFIED',
        blocking: true,
        options: [
          { id: 'A', label: 'A — verified' },
          { id: 'B', label: 'B — tune curves' },
        ],
      },
    };
    const items = buildQueue([msg]);
    expect(items.length).toBe(1);
    const it = items[0];
    expect(it.from).toBe('Inharmonic Wavetable Synthesis');
    expect(it.ask).toBe('Audition the dual-wavetable prototype?');
    expect(it.resourceType).toBe('sensory_audition_gate');
    expect(it.rationale).toContain('dual-wavetable synth');
    expect(it.recommendation).toBe('ARCHITECTURE-VERIFIED');
    expect(it.options).toEqual([
      { id: 'A', label: 'A — verified' },
      { id: 'B', label: 'B — tune curves' },
    ]);
    expect(it.sessionId).toBe('permanent-stewardship-inharmonic-2026-05-27');
    expect(it.blocking).toBe(true);
    // Legacy `summary` still exposes the resource type for older callers.
    expect(it.summary).toBe('sensory_audition_gate');
  });

  it('handoff_ready items leave the new ask/resourceType fields undefined', () => {
    // A baton that predates the move convention (summary only): the card must
    // fall back to `summary`, so `ask` stays undefined (not fabricated).
    const msg = {
      id: 'h1', type: 'BROADCAST', from: 'Foo', ts: '2026-05-29T10:00:00Z', board: 'GENERAL',
      payload: { kind: 'handoff_ready', summary: 'hand off Foo', entry: 'Foo' },
    };
    const items = buildQueue([msg]);
    expect(items.length).toBe(1);
    expect(items[0].kind).toBe('handoff_ready');
    expect(items[0].ask).toBeUndefined();
    expect(items[0].resourceType).toBeUndefined();
  });

  it('handoff_ready surfaces move / invocation / receiving_surface and leads with move', () => {
    const msg = {
      id: 'h1', type: 'BROADCAST', from: 'Semantic Delay', ts: '2026-05-29T10:00:00Z', board: 'GENERAL',
      payload: {
        kind: 'handoff_ready',
        entry: 'Semantic Delay',
        summary: 'handoff ready: Semantic Delay',
        move: 'Wire the feedback-path saturation stage; decide pre/post filter placement.',
        invocation: 'Read Semantic Delay.md and the baton, then pick up the move.',
        receiving_surface: 'Claude Code (Mac, palace root)',
      },
    };
    const items = buildQueue([msg]);
    expect(items.length).toBe(1);
    const it = items[0];
    // The card LEADS with the move (the state) rather than the generic summary.
    expect(it.ask).toBe('Wire the feedback-path saturation stage; decide pre/post filter placement.');
    expect(it.move).toBe('Wire the feedback-path saturation stage; decide pre/post filter placement.');
    expect(it.invocation).toBe('Read Semantic Delay.md and the baton, then pick up the move.');
    expect(it.receiving_surface).toBe('Claude Code (Mac, palace root)');
  });

  it('handoff_ready leaves move / invocation / receiving_surface null when absent', () => {
    const it = buildQueue([handoffMsg()])[0];
    expect(it.move).toBeNull();
    expect(it.invocation).toBeNull();
    expect(it.receiving_surface).toBeNull();
    // No move → no fabricated ask (the card falls back to summary).
    expect(it.ask).toBeUndefined();
  });
});

describe('cardAge — the age readout on every card', () => {
  const base = Date.parse('2026-07-03T12:00:00Z');
  const at = (offsetMs) => new Date(base - offsetMs).toISOString();

  it('reads "just now" under a minute', () => {
    expect(cardAge(at(30 * 1000), base).label).toBe('just now');
  });

  it('reads minutes, hours, and days', () => {
    expect(cardAge(at(5 * 60_000), base).label).toBe('5m');
    expect(cardAge(at(3 * 3_600_000), base).label).toBe('3h');
    expect(cardAge(at(6 * 86_400_000), base).label).toBe('6d');
  });

  it('rolls up to weeks, months, and years', () => {
    expect(cardAge(at(14 * 86_400_000), base).label).toBe('2w');
    expect(cardAge(at(60 * 86_400_000), base).label).toBe('2mo');
    expect(cardAge(at(400 * 86_400_000), base).label).toBe('1y');
  });

  it('flags stale at/after 3 days, not before', () => {
    expect(cardAge(at(STALE_AGE_MS - 1000), base).stale).toBe(false);
    expect(cardAge(at(STALE_AGE_MS), base).stale).toBe(true);
    expect(cardAge(at(6 * 86_400_000), base).stale).toBe(true);
  });

  it('clamps a future ts to "just now" (never negative)', () => {
    const r = cardAge(at(-10_000), base); // ts 10s in the "future"
    expect(r.ms).toBe(0);
    expect(r.label).toBe('just now');
    expect(r.stale).toBe(false);
  });

  it('returns a null label for a bad ts', () => {
    const r = cardAge('not-a-date', base);
    expect(r.label).toBeNull();
    expect(r.stale).toBe(false);
  });
});
