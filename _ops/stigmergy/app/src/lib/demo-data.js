// Synthesized demo messages used when the URL contains `?demo=1`.
// Intent: showcase every documented message type and every channel so
// the visual-validator can evaluate per-type signatures against a rich
// (but small) data set. Real palace data still loads underneath; the
// demo messages are PREPENDED with ts values that put them adjacent to
// the real persistent records.
//
// Most demo messages are fully spec-conformant. Two near the end are
// intentionally non-conformant (`demo-flagged-1`, `demo-no-health`) so
// the v0.1 e2e suite can still verify the lenient render path that
// shows red borders for warning-flagged messages and the [no health]
// placeholder for messages without a health block. The original
// trickster-artifact entries that exercised these paths were deleted
// from the persistent board on 2026-05-04, so the demo set carries
// the regression coverage going forward.

export const DEMO_MESSAGES = [
  // GENERAL ---------------------------------------------------------------
  {
    schema_version: '1.0', id: 'demo-001',
    ts: '2026-05-02T10:00:00Z', session_id: 'demo-2026-05-02',
    from: 'Action Potential Oscillator', to: '*', type: 'BROADCAST', board: 'GENERAL',
    health: { context_pct: 0.18, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 312 },
    payload: { content: 'spinning up. home: [[Action Potential Oscillator]]. neighborhood loaded. reading map.' },
  },
  {
    schema_version: '1.0', id: 'demo-002',
    ts: '2026-05-02T10:02:00Z', session_id: 'demo-2026-05-02',
    from: 'Lateral Access', to: 'Action Potential Oscillator', type: 'REPLY', board: 'GENERAL',
    re: 'demo-001',
    health: { context_pct: 0.22, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 198 },
    payload: { content: 'acknowledged. crossing into Hilaritas neighborhood.' },
  },
  {
    schema_version: '1.0', id: 'demo-003',
    ts: '2026-05-02T10:08:00Z', session_id: 'demo-2026-05-02',
    from: 'Spinoza Conatus', to: '*', type: 'QUERY', board: 'GENERAL',
    health: { context_pct: 0.29, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 2, tokens_this_call: 256 },
    payload: { content: 'searching prior board for any FLAG mentioning Kuramoto.' },
  },

  // ENRICHMENT CARDS (v0.3 rich content) ----------------------------------
  // Ordinary BROADCASTs carrying the artifact convention. `from` is the
  // target page's title (page-as-agent identity), not an invented handle.
  // Artifacts are real palace files so GET /api/file serves them in ?demo=1.
  {
    // Single artifact via artifact_path (string).
    schema_version: '1.0', id: 'demo-art-1',
    ts: '2026-05-02T10:09:00Z', session_id: 'demo-2026-05-02',
    from: 'Kuramoto Coupling', to: '*', type: 'BROADCAST', board: 'GENERAL',
    health: { context_pct: 0.31, score: 'green', model: 'claude-opus-4-7',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 410 },
    payload: {
      kind: 'enrichment_card',
      content: 'fireflies synchronizing — the canonical image of phase coupling in the wild.',
      artifact_path: 'Kuramoto Coupling/fireflies-pond.png',
    },
  },
  {
    // Multi-artifact set via artifacts[] with captions.
    schema_version: '1.0', id: 'demo-art-2',
    ts: '2026-05-02T10:10:00Z', session_id: 'demo-2026-05-02',
    from: 'Kuramoto Coupling', to: '*', type: 'BROADCAST', board: 'GENERAL',
    health: { context_pct: 0.34, score: 'green', model: 'claude-opus-4-7',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 980 },
    payload: {
      kind: 'enrichment_card',
      content: 'a coherent set: the still, the sound, and the playable model.',
      artifacts: [
        { path: 'Kuramoto Coupling/_title-card.png', caption: 'title card — the lesson opens here.' },
        { path: 'Kuramoto Coupling/opening-bed.wav', caption: 'opening bed — the sonic field the narration sits over.' },
        { path: 'Kuramoto Coupling/two-phasors-coupling-explorer.html', caption: 'interactive: drag coupling strength and watch two phasors lock.' },
      ],
    },
  },

  // RICH CONTENT v0.4 — equation / table / choice -------------------------
  {
    // Dual-channel math: symbolic + worded, operators kept in both forms.
    schema_version: '1.0', id: 'demo-eqn',
    ts: '2026-05-02T10:11:00Z', session_id: 'demo-2026-05-02',
    from: 'Kuramoto Coupling', to: '*', type: 'BROADCAST', board: 'GENERAL',
    health: { context_pct: 0.36, score: 'green', model: 'claude-opus-4-7',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 520 },
    payload: {
      content: 'the model, rendered twice — symbols for the eye, words for the ear.',
      equations: [
        {
          label: 'Kuramoto model — phase dynamics',
          symbolic: 'dθᵢ/dt = ωᵢ + (K/N)·Σⱼ sin(θⱼ − θᵢ)',
          worded: 'd(phaseᵢ)/dt = natural_freqᵢ + (coupling/N)·Σⱼ sin(phaseⱼ − phaseᵢ)',
          where: [
            { sym: 'θᵢ', def: 'phase of oscillator i' },
            { sym: 'ωᵢ', def: 'its natural frequency' },
            { sym: 'K', def: 'coupling strength' },
            { sym: 'N', def: 'number of oscillators' },
          ],
        },
        {
          label: 'order parameter',
          symbolic: 'r·e^(iψ) = (1/N)·Σⱼ e^(iθⱼ)',
          worded: 'coherence·e^(i·mean_phase) = (1/N)·Σⱼ e^(i·phaseⱼ)',
          where: [
            { sym: 'r', def: 'coherence, 0 (incoherent) .. 1 (locked)' },
            { sym: 'ψ', def: 'mean phase of the population' },
          ],
        },
      ],
    },
  },
  {
    // Structured comparison grid (what PROOF JSON wanted to be).
    schema_version: '1.0', id: 'demo-table',
    ts: '2026-05-02T10:12:00Z', session_id: 'demo-2026-05-02',
    from: 'Kuramoto Coupling', to: '*', type: 'BROADCAST', board: 'GENERAL',
    health: { context_pct: 0.38, score: 'green', model: 'claude-opus-4-7',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 360 },
    payload: {
      content: 'sweeping coupling K against the order parameter.',
      table: {
        caption: 'K-sweep · fixed N=64 · 220 Hz',
        columns: ['K', 'R (order param)', 'lock time', 'audible?'],
        rows: [
          ['0.0', '0.02', '—', 'no — wash'],
          ['0.5', '0.41', '~8 s', 'faint beating'],
          ['1.0', '0.88', '~3 s', 'clear pulse'],
          ['1.5', '0.99', '~1 s', 'locked drone'],
        ],
      },
    },
  },
  {
    // A/B choice over audio artifacts — the audition the Stewards keep asking for.
    schema_version: '1.0', id: 'demo-choice',
    ts: '2026-05-02T10:13:00Z', session_id: 'demo-2026-05-02',
    from: 'Action Potential Oscillator', to: 'TRICKSTER', type: 'BROADCAST', board: 'GENERAL',
    health: { context_pct: 0.4, score: 'green', model: 'claude-opus-4-7',
              stop_reason: 'end_turn', iteration: 1, tokens_this_call: 610 },
    payload: {
      kind: 'choice',
      choice_mode: 'pick',
      prompt: 'which K-sweep audition reads the synchronization transition best?',
      content: 'pick one and I will build the full render batch around it.',
      options: [
        { id: 'OPENING-BED', label: 'opening bed (ambient field)',
          artifact_path: 'Kuramoto Coupling/opening-bed.wav',
          caption: 'the field before coupling — your baseline.' },
        { id: 'ARRIVING', label: 'synchronization arriving',
          artifact_path: 'Kuramoto Coupling/synchronization-arriving.wav',
          caption: 'the moment lock emerges.' },
        { id: 'INTRO', label: 'intro narration over bed',
          artifact_path: 'Kuramoto Coupling/intro-narration.wav',
          caption: 'narration + bed, for the lesson open.' },
      ],
    },
  },

  // FLAGS -----------------------------------------------------------------
  {
    schema_version: '1.0', id: 'demo-010',
    ts: '2026-05-02T10:14:00Z', session_id: 'demo-2026-05-02',
    from: 'Spinoza Conatus', to: '*', type: 'FLAG', board: 'FLAGS',
    health: { context_pct: 0.45, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 3, tokens_this_call: 487 },
    payload: { content: 'connection found: conatus mirrors Kuramoto coupling. synchronization phase transition = collective coherence of distributed conatus-expressions.' },
  },
  {
    schema_version: '1.0', id: 'demo-011',
    ts: '2026-05-02T10:21:00Z', session_id: 'demo-2026-05-02',
    from: 'Action Potential Oscillator', to: '*', type: 'FLAG', board: 'FLAGS',
    health: { context_pct: 0.52, score: 'green', model: 'claude-sonnet-4-6',
              stop_reason: 'end_turn', iteration: 4, tokens_this_call: 512 },
    payload: { content: 'thresholding observation: trickster as necessary exterior to conatus, not as an internal mode. supports proposed link-type upgrade deepens -> couples-with.' },
  },
  {
    schema_version: '1.0', id: 'demo-012',
    ts: '2026-05-02T10:26:00Z', session_id: 'demo-2026-05-02',
    from: 'Lateral Access', to: '*', type: 'FLAG', board: 'FLAGS',
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
    from: 'Spinoza Conatus', to: '*', type: 'PROOF', board: 'WEAVE',
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
    payload: { content: 'session initialized. 4 workers dispatched: Action Potential Oscillator, Lateral Access, Spinoza Conatus, Hilaritas Generator.' },
  },
  {
    schema_version: '1.0', id: 'demo-031',
    ts: '2026-05-02T10:35:00Z', session_id: 'demo-2026-05-02',
    from: 'COORDINATOR', to: '*', type: 'PAGE_UPDATE', board: 'SYSTEM',
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
    from: 'Spinoza Conatus', to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
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
    from: 'TRICKSTER', to: 'Spinoza Conatus', type: 'RESOURCE_GRANT', board: 'TRICKSTER',
    re: 'req-demo-001',
    health: { context_pct: 0.0, score: 'green', model: 'human' },
    payload: { granted: true, constraints: '2 searches max. post results to FLAGS.' },
  },
  {
    schema_version: '1.0', id: 'demo-042',
    ts: '2026-05-02T10:25:00Z', session_id: 'demo-2026-05-02',
    from: 'Action Potential Oscillator', to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
    request_id: 'req-demo-002',
    health: { context_pct: 0.74, score: 'yellow', model: 'claude-sonnet-4-6',
              stop_reason: 'tool_use', iteration: 11, tokens_this_call: 820 },
    payload: { resource: 'web_search',
               rationale: 'need contemporary citations on stigmergy in agent systems',
               query_intent: 'recent stigmergy research 2024-2026',
               blocking: false },
  },
  {
    // A rich, catchup-first decision in the v2.0 card shape: a real project
    // name (resolves → cyan STATE link + [obs] chip), a blocking pause (→ the
    // quiet "waiting on you"), an orientation that grounds the question's terms
    // ("stage 2"), the question sitting on its options, and a marked lean
    // (APPROVE carries "(recommended)" → the dim `rec` on its own button). This
    // is the flagship surface the redesign rebuilt; demo mode should show it.
    schema_version: '1.0', id: 'demo-045',
    ts: '2026-05-02T11:05:00Z', session_id: 'demo-2026-05-02',
    from: 'Kuramoto Coupling', to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
    request_id: 'kuramoto-steward-014',
    health: { context_pct: 0.38, score: 'green', model: 'claude-opus-4-8',
              stop_reason: 'tool_use', iteration: 9, tokens_this_call: 712 },
    payload: {
      resource: 'directional_decision',
      headline: 'Approve stage 2 — add the dual-axis coupling sweep?',
      ground: 'Stage 1 (a single-axis coupling sweep) is rendered and the phase lock reads cleanly. Stage 2 layers a pitch glide on top — busier, but it shows coupling holding under motion.',
      rationale: 'Stage 1 already demonstrates phase lock cleanly on its own, so stage 2 is enrichment, not a fix. The dual-axis version is more musically alive but the lock is harder to hear; worth building only if the lesson wants the harder case. See [[Kuramoto Coupling]].',
      query_intent: 'decide whether to extend the teaching arc to the dual-axis case',
      blocking: true,
      options: [
        { id: 'APPROVE', label: 'APPROVE — build stage 2 (recommended)' },
        { id: 'HOLD', label: 'HOLD — ship stage 1 alone for now' },
        { id: 'REWORK', label: 'REWORK — simplify stage 1 first' },
      ],
    },
  },
  {
    // A SESSION REQUEST (payload.kind: 'interactive_session') — the steward is
    // not parking a yes/no decision; it has hit a critical, exploratory moment
    // and is asking to be *launched* into a live session Loudon can watch and
    // steer. The card foregrounds a primary "launch interactive session" CTA +
    // a "wants a live session" badge; the options stay as the decline/defer
    // path. This is the read half of the steward request-interactive loop.
    schema_version: '1.0', id: 'demo-046',
    ts: '2026-05-02T11:30:00Z', session_id: 'demo-2026-05-02',
    from: 'Crystal Synthesizer', to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
    request_id: 'crystal-synthesizer-steward-019',
    health: { context_pct: 0.44, score: 'green', model: 'claude-opus-4-8',
              stop_reason: 'tool_use', iteration: 6, tokens_this_call: 690 },
    payload: {
      kind: 'interactive_session',
      resource: 'interactive_session',
      headline: 'Can we voice the dispersion filter together, live? I have three timbres and the pick is taste, not a spec.',
      ground: 'still working · three dispersion voicings rendered · no clear winner — this wants your ear in real time',
      rationale: "I'm tuning the dispersion filter that gives the Crystal Synthesizer its glassy ring, and I've rendered three voicings — a bright struck one, a hollow bowed one, and a darker one with longer tails. Picking between them isn't a yes/no I can park on a button; it's the kind of taste call that gets made by listening, nudging a coefficient, and listening again, together. Rather than file three audition clips and wait a cycle on each round, I'd like you to open a session so we can dial it in live — I'll drive the renders, you steer by ear, and we settle the voice in one sitting. If now's a bad time, say not-now and I'll keep refining headless and raise it again when it's riper. See [[Crystal Synthesizer]].",
      query_intent: 'dial in the dispersion-filter voice in a live session instead of a one-shot decision',
      blocking: false,
      options: [
        { id: 'NOT-NOW', label: 'NOT-NOW — keep going headless; raise it again when it is riper' },
        { id: 'STEER', label: 'STEER — no session needed; here is the direction (note)' },
      ],
    },
  },
  {
    schema_version: '1.0', id: 'demo-043',
    ts: '2026-05-02T10:28:00Z', session_id: 'demo-2026-05-02',
    from: 'TRICKSTER', to: 'Hilaritas Generator', type: 'RESOURCE_DENY', board: 'TRICKSTER',
    re: 'req-demo-003',
    health: { context_pct: 0.0, score: 'green', model: 'human' },
    payload: { granted: false,
               reason: 'use palace material only. external research not in scope for this session.' },
  },
  {
    schema_version: '1.0', id: 'demo-044',
    ts: '2026-05-02T10:36:00Z', session_id: 'demo-2026-05-02',
    from: 'Retrospective Delay', to: 'TRICKSTER', type: 'HEALTH_NOTICE', board: 'TRICKSTER',
    health: { context_pct: 0.92, score: 'red', model: 'claude-sonnet-4-6',
              stop_reason: 'max_tokens', iteration: 18, tokens_this_call: 4096 },
    payload: { content: 'context > 85%. recommend compression or downgrade.' },
  },
  {
    // Stage F — Two Paths: a steward's fork run down BOTH options to a finished
    // deliverable; Loudon picks from completed work. This is the EXACT shape
    // orchestrator/src/two-paths-card.js buildTwoPathsChoiceCard() emits — a
    // rich-content `choice` card (pick mode, two options each carrying its branch
    // artifact) landing on TRICKSTER. Picking posts a choice_response REPLY that
    // Phase 4 (two-paths-merge.js) merges on. Reuses two of the demo audition
    // artifacts so the comparison is a real audio audition.
    schema_version: '1.0', id: 'demo-two-paths',
    ts: '2026-05-02T10:30:00Z', session_id: 'demo-2026-05-02',
    from: 'Action Potential Oscillator', to: 'TRICKSTER', type: 'BROADCAST', board: 'TRICKSTER',
    health: { context_pct: 0, stop_reason: 'two_paths_ready', iteration: 1, tokens_this_call: 0,
              model: 'loudon-two-paths', score: 'green',
              _orchestrator_metadata: { dispatch_mode: 'claude-code-subagent' } },
    payload: {
      kind: 'choice',
      choice_mode: 'pick',
      request_id: 'apo-steward-004',
      prompt: 'Two paths were built for "Is the Kuramoto coupling audible?". Both are finished — pick the one that reads best.',
      content: 'Each option carries its branch deliverable. Picking merges that branch; the other is kept as an alternative.',
      options: [
        { id: 'K-SWEEP', label: 'K-SWEEP — single-axis coupling sweep',
          artifact_path: 'Kuramoto Coupling/synchronization-arriving.wav',
          caption: '30s render, K linear 0→1; the lock emerges cleanly.' },
        { id: 'DUAL-SWEEP', label: 'DUAL-SWEEP — coupling + pitch glide',
          artifact_path: 'Kuramoto Coupling/opening-bed.wav',
          caption: 'two axes at once; busier, lock is harder to hear.' },
      ],
    },
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

  // Regression fixtures for the v0.1 lenient-render paths (red border on
  // warnings, [no health] placeholder on missing health). Both live on
  // FLAGS so the e2e suite can find them via the FLAGS tab.
  {
    // Intentionally missing schema_version + session_id + health — the
    // v0.1 lenient validator at src/lib/schema.js attaches _warnings to
    // this message and MessageList renders the red border accordingly.
    id: 'demo-flagged-1',
    ts: '2026-04-30',
    from: 'TRICKSTER-ARTIFACT', to: '*', type: 'FLAG', board: 'FLAGS',
    payload: { content: 'archival snapshot — pre-2026-05-04 cleanup. lacks schema_version, session_id, health.' },
  },
  {
    schema_version: '1.0', id: 'demo-no-health',
    ts: '2026-05-02T10:34:00Z', session_id: 'demo-2026-05-02',
    from: 'Action Potential Oscillator', to: '*', type: 'BROADCAST', board: 'FLAGS',
    // No health field — exercises the [no health] placeholder rendering.
    payload: { content: 'reporting from striatum. health-block intentionally omitted on this demo entry.' },
  },
  {
    // Phase 4 (QUEUE): a handoff_ready whose entry HAS later commits in the
    // real palace git history -- so QUEUE's git reconciliation marks it "looks
    // done" against live git, proving the prospective->retrospective crossing.
    id: 'demo-handoff-resolved',
    schema_version: '1.0',
    ts: '2026-01-01T00:00:00Z',
    session_id: 'demo-session',
    from: '@Two Batons, One Board',
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: { context_pct: 0, stop_reason: 'handoff', iteration: 1, tokens_this_call: 0, model: 'demo', score: 'green' },
    payload: {
      kind: 'handoff_ready',
      entry: 'Two Batons, One Board',
      handoff_path: 'Two Batons, One Board/x -- handoff.md',
      summary: 'demo: mid-move handed off (auto-resolves against real git)',
      stale_if: 'a commit touches Two Batons, One Board after 2026-01-01',
    },
  },
  {
    // Phase 4 (QUEUE): a handoff_ready whose entry has NO resolving commit, so
    // it stays open -- the honest "still waiting" state.
    id: 'demo-handoff-open',
    schema_version: '1.0',
    ts: '2026-05-29T09:00:00Z',
    session_id: 'demo-session',
    from: '@Nonexistent Demo Entry ZZZ',
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: { context_pct: 0, stop_reason: 'handoff', iteration: 1, tokens_this_call: 0, model: 'demo', score: 'green' },
    payload: {
      kind: 'handoff_ready',
      entry: 'Nonexistent Demo Entry ZZZ',
      handoff_path: 'Nonexistent Demo Entry ZZZ/x -- handoff.md',
      summary: 'demo: open handoff, awaiting pickup',
      stale_if: 'a commit touches Nonexistent Demo Entry ZZZ after this',
    },
  },
  {
    // Phase 5.5 (QUEUE): a Weave vector_proposal -- the Topology Lens
    // surfaces structural findings; the swarm posts them here; the human
    // grants or denies in QUEUE. This one proposes promoting a body
    // wikilink to a typed link (the most common follow-up after the lens
    // shows N unsung paths).
    id: 'demo-vector-proposal-1',
    schema_version: '1.0',
    ts: '2026-05-30T14:00:00Z',
    session_id: 'demo-weave-2026-05-30',
    from: '@weave-swarm',
    to: '*',
    type: 'BROADCAST',
    board: 'WEAVE',
    health: { context_pct: 0, stop_reason: 'proposal', iteration: 1, tokens_this_call: 0, model: 'demo', score: 'green' },
    payload: {
      kind: 'vector_proposal',
      proposal_type: 'promote_unsung',
      source_entry: 'Kuramoto Coupling.md',
      target_entry: 'Spinoza Conatus.md',
      proposed_change:
        'promote the body wikilink [[Spinoza Conatus]] in [[Kuramoto Coupling]] to a typed connects-to link',
      rationale:
        'Kuramoto Coupling references Spinoza Conatus in three body passages but has no YAML typed link. The Topology Lens flagged this as an unsung path on 2026-05-30.',
      stale_if: 'a Kuramoto Coupling commit adds a typed link to Spinoza Conatus',
    },
  },
  {
    // vector_proposal carrying a structured `apply` op (Increment 1): a
    // vector-tuning proposal the executor can RUN on "grant & apply" — it edits
    // the entry's forward_vector through the enforced honest-write path, commits
    // as kind `weave`, and posts a weave_applied PROOF. source/apply point at a
    // demo-only entry so a stray click in the showcase 404s safely instead of
    // editing a real entry; the executable path is proven in weave-apply.test.js.
    id: 'demo-vector-proposal-2',
    schema_version: '1.0',
    // Older than demo-vector-proposal-1 (14:00) so the promote-unsung card stays
    // first in the newest-first ranking — keeping the existing `.first()`-based
    // queue-deck specs stable while this sibling demonstrates grant & apply.
    ts: '2026-05-30T13:30:00Z',
    session_id: 'demo-weave-2026-05-30',
    from: '@weave-swarm',
    to: '*',
    type: 'BROADCAST',
    board: 'WEAVE',
    health: { context_pct: 0, stop_reason: 'proposal', iteration: 1, tokens_this_call: 0, model: 'demo', score: 'green' },
    payload: {
      kind: 'vector_proposal',
      proposal_type: 'vector_tuning',
      source_entry: 'Retrospective Delay (demo).md',
      proposed_change:
        'tune the Retrospective Delay forward_vector to name its teaching aim, not just its mechanism',
      rationale:
        'The current vector states what the delay does; the Weave proposes one that states what it wants to teach — closer to a conatus (per the forward-vector discipline). Grant & apply writes it through the honest-write path; the commit + a weave_applied PROOF are the record, and undo is a git revert away.',
      apply: {
        op: 'set-vector',
        entry: 'Retrospective Delay (demo)',
        text: 'I will keep turning latency into memory — teaching delay as the felt shape of the past holding the present.',
      },
      stale_if: 'a RESOURCE_GRANT/DENY answers this proposal, or a commit tunes Retrospective Delay',
    },
  },
  {
    // weave_flag v1.0: a deposit-ceremony flag asking the next Weave to
    // audit a backlink target. Sibling to vector_proposal -- renders as a
    // WEAVE FLAG card in QUEUE, closes via RESOURCE_GRANT/RESOURCE_DENY or
    // a commit touching any of source_entries. The OPEN demo: a target
    // that has NO resolving commit, so it stays open in the queue.
    id: 'demo-weave-flag-1',
    schema_version: '1.0',
    ts: '2026-06-05T13:45:00Z',
    session_id: 'demo-deposit-BATCH01',
    from: 'deposit-ceremony',
    to: 'weave-ceremony',
    type: 'BROADCAST',
    board: 'WEAVE',
    health: { context_pct: 0, stop_reason: 'deposit', iteration: 1, tokens_this_call: 0, model: 'demo', score: 'green' },
    payload: {
      kind: 'weave_flag',
      flag_type: 'backlink_audit',
      source_deposit_id: 'DEMO-BATCH01',
      source_entries: ['Floquet Theory (demo nonexistent)', 'Kuramoto Coupling (demo nonexistent)'],
      target_entry: 'Phase Reduction (demo nonexistent)',
      proposed_action: 'Add couples-with link from each hub to Phase Reduction with label `bridge-via-PRC`.',
      rationale: 'Phase Reduction names the bridge between the two existing hubs (PRC as Floquet eigenvector data; Kuramoto as the phase-reduced shadow of a population of limit cycles). Both hubs deserve inbound links.',
    },
  },
];
