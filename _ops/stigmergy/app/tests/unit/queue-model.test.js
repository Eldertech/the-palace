import { describe, it, expect } from 'vitest';
import {
  buildQueue, reconcileQueue, partitionQueue, rankQueue, laneCounts, vantage, deriveAsk,
  synthesizeProposalAsk,
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
});
