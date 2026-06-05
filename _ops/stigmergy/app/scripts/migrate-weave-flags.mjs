// One-shot migration: move the 11 backlogged Weave-flag items from
// _ops/Palace To-Do.md onto _ops/swarm/persistent/blackboard.jsonl as
// §2.2-conformant BROADCAST messages with payload.kind === 'weave_flag'.
//
// Idempotent: refuses to run if any weave_flag already exists on the board.
// Validates every message via server/validator.js before appending.
// Direct file write -- migration is one-shot, no HTTP round-trip needed.
//
// Build plan: Palace development/STIGMERGY — Weave Flag Item Type Build Plan.md

import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMessage } from '../server/validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PALACE_ROOT = resolve(__dirname, '../../../..');
const BLACKBOARD = resolve(PALACE_ROOT, '_ops/swarm/persistent/blackboard.jsonl');

const SESSION_ID = 'migration-weave-flag-v1.0';
const FROM = 'deposit-ceremony';
const TO = 'weave-ceremony';
const BASE_TS = '2026-06-05T14:00:00Z';

function tsWithOffset(seconds) {
  const base = new Date(Date.parse(BASE_TS) + seconds * 1000);
  return base.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

const HEALTH = {
  context_pct: 0,
  stop_reason: 'deposit-migration',
  iteration: 1,
  tokens_this_call: 0,
  model: 'deposit-ceremony',
  score: 'green',
};

const FLAGS = [
  {
    n: 1,
    source_deposit_id: 'SPONT4',
    flag_type: 'section_expansion',
    source_entries: ['Resonant Link Labels', 'Lossy Compression with Intent Alignment', 'Generative Compression'],
    target_entry: null,
    proposed_action:
      'Run a full label enrichment pass across all existing links, prioritizing `connects-to` links.',
    rationale:
      'Step 3c is now live in the Weave Ceremony. On next Weave: run a full label enrichment pass across all existing links, prioritizing `connects-to` links. The three new entries from this session ([[Resonant Link Labels]], [[Lossy Compression with Intent Alignment]], [[Generative Compression]]) already carry labels and model the vocabulary. Use them as reference.',
  },
  {
    n: 2,
    source_deposit_id: 'SPONT4',
    flag_type: 'missing_connection_audit',
    source_entries: ['Resonant Link Labels', 'Lossy Compression with Intent Alignment', 'Generative Compression'],
    target_entry: null,
    proposed_action:
      'Weave three new entries into existing hub nodes; candidate connections to investigate: [[Hilaritas Generator]], [[Endosymbiosis]], [[Four Pillars]], [[Pages as Agents]].',
    rationale:
      'Three new entries need their first Weave pass: [[Resonant Link Labels]], [[Lossy Compression with Intent Alignment]], [[Generative Compression]]. Candidate connections: [[Hilaritas Generator]] (shares a mechanism with lossy compression), [[Endosymbiosis]] (the deposit ceremony already mirrors it — does the new framing of deposit-as-model-training deepen this?), [[Four Pillars]] (Generative Compression touches all four pillars and may want a hub-level link), [[Pages as Agents]] (if every entry is a dormant agent, latent-variable encoding is the mechanism of activation — may want a `mirrors` or `enables` link).',
  },
  {
    n: 3,
    source_deposit_id: 'D004',
    flag_type: 'missing_connection_audit',
    source_entries: [
      'Inharmonic Wavetable Synthesis',
      'Wavetable Space as Torus',
      'Wavetable Synthesis -- Research & Higher-Dimensional Design',
      'Boundary-Crossing Instruments',
      'Categorizing Inharmonicity',
    ],
    target_entry: '2D Torus Wavetable Synthesizer',
    proposed_action:
      'Audit five entries for missing typed links to [[2D Torus Wavetable Synthesizer]] and [[DSP in Looping Dimensions]]; propose `mirrors` / `deepens` / `connects-to` candidates with labels; let Loudon approve before formalizing.',
    rationale:
      'Five entries were flagged at deposit time as candidates for typed links to [[2D Torus Wavetable Synthesizer]] and [[DSP in Looping Dimensions]] but held for the Weave rather than silently added: [[Inharmonic Wavetable Synthesis]], [[Wavetable Space as Torus]], [[Wavetable Synthesis -- Research & Higher-Dimensional Design]], [[Boundary-Crossing Instruments]], [[Categorizing Inharmonicity]]. Run Weave Step 3 (unsung paths) on each.',
  },
  {
    n: 4,
    source_deposit_id: 'D-CW-01',
    flag_type: 'section_expansion',
    source_entries: ['Maker'],
    target_entry: null,
    proposed_action:
      "Expand [[Maker]]'s Delivery section to model the punchlist-as-handoff move without contradicting Maker's single-step intent.",
    rationale:
      "The [[Closing Well]] deposit found that single-step Delivery is in productive tension with the Closing Punchlist practice. Maker's Delivery section needs expansion to model the punchlist-as-handoff move without contradicting Maker's single-step intent.",
  },
  {
    n: 5,
    source_deposit_id: 'D-CW-01',
    flag_type: 'standard_reference',
    source_entries: ['The Shop'],
    target_entry: 'Closing Well',
    proposed_action:
      'Add `connects-to` link from [[The Shop]] to [[Closing Well]] in YAML, plus body reference naming Closing Well as a Shop-wide standard.',
    rationale:
      'Every Shop tier inherits the verify-to-best-ability + dual-channel + punchlist disciplines. Closing Well functions as a standard from The Shop and the link should make that explicit.',
  },
  {
    n: 6,
    source_deposit_id: 'D-CW-01',
    flag_type: 'section_expansion',
    source_entries: [
      'Kokoro',
      'Midjourney',
      'ComfyUI',
      'Manim CE',
      'Whisper',
      'ffmpeg',
      'Remotion',
      'p5.js',
      'Mermaid',
      'Matplotlib',
      'Stable Audio Open',
      'RNBO codebox~ smith',
      'VCV Patch Generator',
      'Tone.js',
    ],
    target_entry: 'Closing Well',
    proposed_action:
      "Audit the 14 Specialist entries and add a Self-Check § Punchlist subsection to each, scoped to that Specialist's failure modes.",
    rationale:
      "The Closing Well Closing Punchlist applies to each Specialist's deliverables, not only to Maker output. Audit the 14 Specialist entries (Kokoro, Midjourney, ComfyUI, Manim CE, Whisper, ffmpeg, Remotion, p5.js, Mermaid, Matplotlib, Stable Audio Open, RNBO codebox~ smith, VCV Patch Generator, Tone.js) and add a Self-Check § Punchlist subsection to each.",
  },
  {
    n: 7,
    source_deposit_id: 'D-CW-01',
    flag_type: 'section_expansion',
    source_entries: ['Substrate Skill'],
    target_entry: 'Closing Well',
    proposed_action:
      'Grow a generic Closing Punchlist scaffold in [[Substrate Skill]] that any palace AI can adopt at session close, parameterizable per Specialist / ceremony.',
    rationale:
      'Substrate Skill should ship a generic Closing Punchlist scaffold that any palace AI can adopt at session close, parameterizable per Specialist / ceremony. Reduces per-entry reinvention.',
  },
  {
    n: 8,
    source_deposit_id: 'D-2026-05-27-OE',
    flag_type: 'missing_connection_audit',
    source_entries: ['Enrichment', 'Brian Eno', 'BBS Blackboard', 'Synthesis ↔ Emergence'],
    target_entry: 'Oblique Enrichment',
    proposed_action:
      'Audit four converging agent-surface entries for missing typed links to [[Oblique Enrichment]] and [[Semantic Webcam]].',
    rationale:
      'Four entries were flagged at deposit time as candidates for typed links but held apart on purpose to avoid premature convergence: [[Enrichment]], [[Brian Eno]], [[BBS Blackboard]], [[Synthesis ↔ Emergence]]. Run Weave Step 3 (unsung paths) on each; the deposit author flagged these as "converging agent-surface threads" — the Weave can decide whether convergence is ready, or hold them apart for another cycle.',
  },
  {
    n: 9,
    source_deposit_id: 'BATCH01',
    flag_type: 'backlink_audit',
    source_entries: ['Floquet Theory', 'Kuramoto Coupling'],
    target_entry: 'Phase Reduction',
    proposed_action:
      'Add `couples-with` link from each hub to [[Phase Reduction]] with label `bridge-via-PRC`.',
    rationale:
      'The new Phase Reduction entry names the bridge between the two existing hubs (PRC as Floquet eigenvector data; Kuramoto as the phase-reduced shadow of a population of limit cycles). Phase Reduction already links outward; the inbound links from both hubs are held for the Weave. Recommended types: `couples-with` from each hub, with labels (e.g. `bridge-via-PRC`).',
  },
  {
    n: 10,
    source_deposit_id: 'BATCH01',
    flag_type: 'mirror_link_sweep',
    source_entries: [
      'Dispersion Table',
      'Exponential Decay Curvature',
      'Linear Predictive Coding',
      'Chebyshev is Fourier',
      'Volterra Kernels and the Torus',
      'Phase Reduction',
      'Rank-N Lattice Analysis',
      'Bayesian Granular Synthesizer',
      'Infeasible DSP Now Shippable',
    ],
    target_entry: null,
    proposed_action:
      'Sweep the BATCH01 dissolution cluster for missing `mirrors` / `couples-with` links; propose labels (`same-object`, `scan-vs-input-read`, `analysis-is-synthesis-read-backward`, etc.).',
    rationale:
      'Nearly every BATCH01 entry is a *dissolution* — wavetable↔waveguide, envelope↔waveform, synthesis↔processing, Chebyshev↔Fourier, Floquet↔Kuramoto, analysis↔synthesis. The cluster should produce a dense web of `mirrors` / `couples-with` links among its 9 members. Each entry already carries seed mirror-links to its closest neighbors; the Weave should propose the missing edges and choose labels.',
  },
  {
    n: 11,
    source_deposit_id: 'BATCH01',
    flag_type: 'hub_candidate',
    source_entries: [
      'Dispersion Table',
      'Exponential Decay Curvature',
      'Linear Predictive Coding',
      'Chebyshev is Fourier',
      'Volterra Kernels and the Torus',
      'Phase Reduction',
      'Rank-N Lattice Analysis',
      'Bayesian Granular Synthesizer',
      'Infeasible DSP Now Shippable',
    ],
    target_entry: null,
    proposed_action:
      'Evaluate whether the BATCH01 cluster sustains a dense mirror-web; if so, the pattern may earn a hub entry. Candidate titles: **Dissolutions** or **One Object, Two Doorways**. Hold until the Weave confirms; do not preempt.',
    rationale:
      'The BATCH01 README named the recurring pattern: *two things taught as separate turning out to be one object seen from two doorways.* If a Weave confirms the cluster sustains a dense mirror-web, the pattern may earn a hub entry.',
  },
];

function paddedN(n) { return String(n).padStart(2, '0'); }

function buildMessage(item) {
  return {
    schema_version: '1.0',
    id: `msg-wf-migration-${paddedN(item.n)}`,
    ts: tsWithOffset(item.n),
    session_id: SESSION_ID,
    from: FROM,
    to: TO,
    type: 'BROADCAST',
    board: 'WEAVE',
    health: { ...HEALTH },
    payload: {
      kind: 'weave_flag',
      flag_type: item.flag_type,
      source_deposit_id: item.source_deposit_id,
      source_entries: item.source_entries,
      ...(item.target_entry ? { target_entry: item.target_entry } : {}),
      proposed_action: item.proposed_action,
      rationale: item.rationale,
    },
  };
}

function main() {
  if (FLAGS.length !== 11) {
    console.error(`expected 11 flags in scope; got ${FLAGS.length}. aborting.`);
    process.exit(2);
  }

  if (!existsSync(BLACKBOARD)) {
    console.error(`blackboard not found: ${BLACKBOARD}`);
    process.exit(2);
  }

  // Idempotency: bail if any weave_flag already exists on the board.
  const existing = readFileSync(BLACKBOARD, 'utf8').split('\n').filter(Boolean);
  let existingFlagCount = 0;
  for (const line of existing) {
    try {
      const m = JSON.parse(line);
      if (m?.payload?.kind === 'weave_flag') existingFlagCount += 1;
    } catch { /* skip malformed; same forgiveness as the GET path */ }
  }
  if (existingFlagCount > 0) {
    console.error(`refusing to run: ${existingFlagCount} weave_flag message(s) already on the board.`);
    console.error('this migration is one-shot. exit non-zero so the caller knows to skip.');
    process.exit(3);
  }

  // Build, validate, append. Fail closed on any validator error.
  const built = FLAGS.map(buildMessage);
  for (const m of built) {
    const result = validateMessage(m);
    if (!result.valid) {
      console.error(`§2.2 validation FAILED for ${m.id}:`);
      for (const err of result.errors) {
        console.error(`  ${err.path}: ${err.message}`);
      }
      process.exit(4);
    }
  }

  // All valid -- append in order.
  const linesBefore = existing.length;
  for (const m of built) {
    appendFileSync(BLACKBOARD, JSON.stringify(m) + '\n', 'utf8');
  }
  const linesAfter = readFileSync(BLACKBOARD, 'utf8').split('\n').filter(Boolean).length;
  const delta = linesAfter - linesBefore;

  if (delta !== 11) {
    console.error(`line-count check FAILED: expected +11, got +${delta}. aborting.`);
    process.exit(5);
  }

  console.log(`migrated ${built.length} weave_flag messages onto ${BLACKBOARD.replace(PALACE_ROOT + '/', '')}`);
  for (const m of built) {
    console.log(`  ${m.id}  ${m.payload.flag_type.padEnd(28)}  src=${m.payload.source_deposit_id}`);
  }
  console.log(`line count: ${linesBefore} -> ${linesAfter} (+${delta})`);
}

main();
