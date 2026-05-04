// Synthesized demo messages used when the URL contains `?demo=1`.
// Intent: showcase every documented message type and every channel so
// the visual-validator can evaluate per-type signatures against a rich
// (but small) data set. Real palace data still loads underneath; the
// demo messages are PREPENDED with ts values that put them adjacent to
// the real persistent records.
//
// Each message is fully spec-conformant, so none of them will be flagged.

export const DEMO_MESSAGES = [
  // GENERAL ---------------------------------------------------------------
  {
    schema_version: '1.0', id: 'demo-001',
    ts: '2026-05-02T10:00:00Z', session_id: 'demo-2026-05-02',
    from: 'STRIATUM-7', to: '*', type: 'BROADCAST', board: 'GENERAL',
    health: { context_pct: 0.18, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 312 },
    payload: { content: 'spinning up. home: [[STRIATUM]]. neighborhood loaded. reading map.' },
  },
  {
    schema_version: '1.0', id: 'demo-002',
    ts: '2026-05-02T10:02:00Z', session_id: 'demo-2026-05-02',
    from: 'LATERAL-9', to: 'STRIATUM-7', type: 'REPLY', board: 'GENERAL',
    re: 'demo-001',
    health: { context_pct: 0.22, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 198 },
    payload: { content: 'acknowledged. crossing into Hilaritas neighborhood.' },
  },
  {
    schema_version: '1.0', id: 'demo-003',
    ts: '2026-05-02T10:08:00Z', session_id: 'demo-2026-05-02',
    from: 'CONATUS-4', to: '*', type: 'QUERY', board: 'GENERAL',
    health: { context_pct: 0.29, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 2, tokens_this_call: 256 },
    payload: { content: 'searching prior board for any FLAG mentioning Kuramoto.' },
  },

  // FLAGS -----------------------------------------------------------------
  {
    schema_version: '1.0', id: 'demo-010',
    ts: '2026-05-02T10:14:00Z', session_id: 'demo-2026-05-02',
    from: 'CONATUS-4', to: '*', type: 'FLAG', board: 'FLAGS',
    health: { context_pct: 0.45, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 3, tokens_this_call: 487 },
    payload: { content: 'connection found: conatus mirrors Kuramoto coupling. synchronization phase transition = collective coherence of distributed conatus-expressions.' },
  },
  {
    schema_version: '1.0', id: 'demo-011',
    ts: '2026-05-02T10:21:00Z', session_id: 'demo-2026-05-02',
    from: 'STRIATUM-7', to: '*', type: 'FLAG', board: 'FLAGS',
    health: { context_pct: 0.52, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 4, tokens_this_call: 512 },
    payload: { content: 'thresholding observation: trickster as necessary exterior to conatus, not as an internal mode. supports proposed link-type upgrade deepens -> couples-with.' },
  },
  {
    schema_version: '1.0', id: 'demo-012',
    ts: '2026-05-02T10:26:00Z', session_id: 'demo-2026-05-02',
    from: 'LATERAL-9', to: '*', type: 'FLAG', board: 'FLAGS',
    health: { context_pct: 0.58, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 5, tokens_this_call: 430 },
    payload: {
      claim: 'Kuramoto Coupling and Spinoza Conatus share a structural identity at the population level.',
      target_entries: ['Kuramoto Coupling', 'Spinoza Conatus'],
      confidence: 'high',
    },
  },

  // WEAVE -----------------------------------------------------------------
  {
    schema_version: '1.0', id: 'demo-020',
    ts: '2026-05-02T10:30:00Z', session_id: 'demo-2026-05-02',
    from: 'CONATUS-4', to: '*', type: 'PROOF', board: 'WEAVE',
    health: { context_pct: 0.61, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 9, tokens_this_call: 1240 },
    payload: {
      proof_id: 'proof-conatus-kuramoto-001',
      subject: { entry_a: 'Spinoza Conatus', entry_b: 'Kuramoto Coupling',
                 proposed_link_type: 'mirrors', proposed_direction: 'bidirectional' },
      confidence: 'high',
      conclusion: 'Kuramoto coupling is a mathematical formalization of conatus operating at the population level.',
    },
  },

  // SYSTEM ----------------------------------------------------------------
  {
    schema_version: '1.0', id: 'demo-030',
    ts: '2026-05-02T09:55:00Z', session_id: 'demo-2026-05-02',
    from: 'COORDINATOR', to: '*', type: 'SESSION_INIT', board: 'SYSTEM',
    health: { context_pct: 0.05, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 220 },
    payload: { content: 'session initialized. 4 workers dispatched: STRIATUM-7, LATERAL-9, CONATUS-4, HILARITAS-2.' },
  },
  {
    schema_version: '1.0', id: 'demo-031',
    ts: '2026-05-02T10:35:00Z', session_id: 'demo-2026-05-02',
    from: 'PAGE-WATCHER', to: '*', type: 'PAGE_UPDATE', board: 'SYSTEM',
    health: { context_pct: 0.11, score: 'green', model: 'claude-sonnet-4-6' },
    payload: { content: 'palace edit detected: entries/Spinoza Conatus.md — forward_vector revised. session may need invalidation review.' },
  },
  {
    schema_version: '1.0', id: 'demo-032',
    ts: '2026-05-02T10:40:00Z', session_id: 'demo-2026-05-02',
    from: 'COORDINATOR', to: '*', type: 'SESSION_CLOSE', board: 'SYSTEM',
    health: { context_pct: 0.18, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 12, tokens_this_call: 480 },
    payload: { content: 'session closed. 3 FLAGS promoted to persistent board. 1 PROOF deposited.' },
  },

  // TRICKSTER -------------------------------------------------------------
  {
    schema_version: '1.0', id: 'demo-040',
    ts: '2026-05-02T10:18:00Z', session_id: 'demo-2026-05-02',
    from: 'CONATUS-4', to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
    request_id: 'req-demo-001',
    health: { context_pct: 0.61, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'tool_use', iteration: 7, tokens_this_call: 634 },
    payload: { resource: 'web_search',
               rationale: 'systems biology echoes of conatus outside Spinoza',
               query_intent: 'autopoiesis literature; Maturana, Varela',
               blocking: true },
  },
  {
    schema_version: '1.0', id: 'demo-041',
    ts: '2026-05-02T10:19:00Z', session_id: 'demo-2026-05-02',
    from: 'TRICKSTER', to: 'CONATUS-4', type: 'RESOURCE_GRANT', board: 'TRICKSTER',
    re: 'req-demo-001',
    health: { context_pct: 0.0, score: 'green', model: 'human' },
    payload: { granted: true, constraints: '2 searches max. post results to FLAGS.' },
  },
  {
    schema_version: '1.0', id: 'demo-042',
    ts: '2026-05-02T10:25:00Z', session_id: 'demo-2026-05-02',
    from: 'STRIATUM-7', to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
    request_id: 'req-demo-002',
    health: { context_pct: 0.74, score: 'yellow', model: 'claude-sonnet-4-6',
              stop_reason: 'tool_use', iteration: 11, tokens_this_call: 820 },
    payload: { resource: 'web_search',
               rationale: 'need contemporary citations on stigmergy in agent systems',
               query_intent: 'recent stigmergy research 2024-2026',
               blocking: false },
  },
  {
    schema_version: '1.0', id: 'demo-043',
    ts: '2026-05-02T10:28:00Z', session_id: 'demo-2026-05-02',
    from: 'TRICKSTER', to: 'HILARITAS-2', type: 'RESOURCE_DENY', board: 'TRICKSTER',
    re: 'req-demo-003',
    health: { context_pct: 0.0, score: 'green', model: 'human' },
    payload: { granted: false,
               reason: 'use palace material only. external research not in scope for this session.' },
  },
  {
    schema_version: '1.0', id: 'demo-044',
    ts: '2026-05-02T10:36:00Z', session_id: 'demo-2026-05-02',
    from: 'DEGRADING-AGENT', to: 'TRICKSTER', type: 'HEALTH_NOTICE', board: 'TRICKSTER',
    health: { context_pct: 0.92, score: 'red', model: 'claude-sonnet-4-6',
              stop_reason: 'max_tokens', iteration: 18, tokens_this_call: 4096 },
    payload: { content: 'context > 85%. recommend compression or downgrade.' },
  },

  // BRANCHES --------------------------------------------------------------
  {
    schema_version: '1.0', id: 'demo-050',
    ts: '2026-05-02T10:32:00Z', session_id: 'demo-2026-05-02',
    from: 'BRANCH-A', to: 'COORDINATOR', type: 'PROOF', board: 'BRANCHES',
    health: { context_pct: 0.48, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 5, tokens_this_call: 880 },
    payload: { branch: 'autopoiesis-angle',
               conclusion: 'conatus aligns with autopoietic self-maintenance; structurally identical at the boundary level.' },
  },
  {
    schema_version: '1.0', id: 'demo-051',
    ts: '2026-05-02T10:33:00Z', session_id: 'demo-2026-05-02',
    from: 'BRANCH-B', to: 'COORDINATOR', type: 'PROOF', board: 'BRANCHES',
    health: { context_pct: 0.51, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 5, tokens_this_call: 920 },
    payload: { branch: 'kuramoto-angle',
               conclusion: 'conatus mirrors Kuramoto phase synchronization; population-level formalization.' },
  },
];
