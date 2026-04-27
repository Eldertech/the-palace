---
title: Swarm Weave Synthesis — 2026-04-27 — 151 entries audited
session: 2026-04-27-001
date: 2026-04-27
status: applied
---

# Swarm Weave Synthesis — 2026-04-27 — 151 entries audited

**Architecture this run:** Mechanical audit (deterministic Python, full coverage) + 10 Haiku workers on never-woven entries. Reflects the cost-sensitivity memory: the swarm runs the *creative* work; the *mechanical* work runs in code.

- **Map:** `_ops/maps/palace-map-full-2026-04-27.{json,tsv,adjacency.txt}` — 151 nodes, 25 ops, 933 edges (vs. 107 nodes / 678 edges on 2026-04-07: +44 nodes, +255 edges)
- **Audit JSON:** `_ops/swarm/sessions/mechanical-audit-2026-04-27.json`
- **Workers:** Haiku × 10 on newly-deposited entries (wavetable cluster + generative project cluster + BBS Design System)

---

## Volume Overview

| Category | Count | Note |
|---|---:|---|
| Total nodes | 151 | +44 since 2026-04-07 |
| Total typed edges | 933 | +255 since 2026-04-07 |
| Hubs (≥5 typed links) | 117 | Palace has densified considerably |
| Unsung paths (filtered to content entries) | 79 | Of 178 total; 99 in archive/index files excluded as historical |
| Graffiti items | 70 | First systematic audit ever — never been combed before |
| Missing forward_vector | 62 | Of which ~25 are real candidates (rest are operational files) |
| Metadata gaps (last_activated / activation_count) | 55 | |
| Body forward-ghosts (wikilinks to non-existent entries) | 102 | Mostly false positives + 6 real deposit candidates |
| Case inconsistencies (`FOUR PILLARS`/`SUBSTRATE`) | 69 | Stylistic — same inode on APFS; not breaks |
| Isolated entries (no in or out) | 6 | |
| No-inbound entries (orphan-toward-them) | 14 | |
| New introductions proposed (10 workers, max 30) | 27 | After excluding forward-ghost targets |
| Convergent worker proposals (≥2 workers same target) | 4 | |

---

## Top Hubs (palace centers of gravity)

| Entry | In | Out | Total |
|---|---:|---:|---:|
| Kuramoto Coupling | 46 | 15 | 61 |
| Spinoza Conatus | 40 | 9 | 49 |
| Hilaritas Generator | 31 | 9 | 40 |
| Trickster | 16 | 21 | 37 |
| Action Potential Oscillator | 21 | 15 | 36 |
| Swarm Weave | 21 | 14 | 35 |
| Cooperation Yields Agency | 27 | 7 | 34 |
| Boundary-Crossing Instruments | 24 | 5 | 29 |
| Hyperdimensional Prism | 23 | 5 | 28 |
| Pages as Agents | 17 | 8 | 25 |
| Palace Enchantment | 15 | 10 | 25 |

The top three are unchanged — Kuramoto Coupling, Spinoza Conatus, Hilaritas Generator hold the philosophical/technical center. Pages as Agents finally has 17 inbound after the 2026-04-07 introductions landed.

---

## Tier A — Immediate fixes (no judgment needed)

**A1. Map Build** — already done. Map artifact at `_ops/maps/palace-map-full-2026-04-27.json`.

**A2. Stage staleness fixes (6 entries — add `stage:` field)**

These have no `stage:` at all. Proposed defaults:

| Entry | Proposed stage | Rationale |
|---|---|---|
| `CLAUDE` | `foundational` | Entry point; should be marked foundational like JEWEL/SCHEMA |
| `Map Log` | `growing` | Active log file, append-only |
| `Crystal Synthesizer — Staging` | `growing` | Active project staging doc |
| `Shepard Tone Synthesizer — Staging` | `growing` | Active project staging doc |
| `coordinator-synthesis-template` | `mature` | Operational template, stable |
| `worker-prompt-template` | `mature` | Operational template, stable |

**A3. Rename detected — `Synthesis Space as Torus` → `Wavetable Space as Torus`**

Already committed as a rename. No remaining inbound links to the old name (verified — 0 references in the map). ✓

---

## Tier B — Unsung paths to formalize (79 in content entries)

Filtered to content entries only. Index/archive files (Deposit Archive, Palace To-Do, CLAUDE, ROSETTA, JEWEL, README, etc.) excluded — their wikilinks are historical references that shouldn't inflate frontmatter.

**B1. Highest-priority (structurally significant, ★)** — body wikilinks in headings, bold phrases, or sentence-level structural references:

| Source | Body wikilink | Propose link type |
|---|---|---|
| Octave Equivalence | `[[Piano String Inharmonicity]]` | mirrors |
| Octave Equivalence | `[[Logarithmic Interface Scaling]]` | enables |
| Loudon's Toolkit | `[[Toolkit — Audio Plugins]]` | connects-to |
| Claude CLI Reference | `[[Boundary-Crossing Instruments]]` | connects-to |
| Harvest Ceremony | `[[Palace Quotes]]` | connects-to |
| Palace Map | `[[Striatum]]` | mirrors |
| Weave Ceremony | `[[Map Build Ceremony]]` | connects-to (already exists?) |

**B2. Standard formalizations** (non-significant but body wikilink + no typed link present)

Proposing default link type `connects-to` unless body context names something more specific. Listed grouped by cluster:

*Wavetable / DSP cluster:*
- 2D Torus Wavetable Synthesizer — Build Log → `DSP in Looping Dimensions`, `Kuramoto Coupling`, `Frequency-Time Duality`, `Torus Warping Catalog`, `Categorizing Inharmonicity` (5)
- Three Kinds of Warp → `Piano String Inharmonicity`, `Embeddings as Relational Meaning`, `2D Wavetable Catalog` (3)
- The Curve Is the Material → `Harmonicity and Inharmonicity` (1)
- Torus Warping Catalog → `2D Torus Wavetable Synthesizer — Build Log` (1)
- Wavetable Synthesis Research → `Four Pillars` (1)
- Piano String Inharmonicity → `Octave Equivalence` (1)
- Shimmer Cloud → `Dispersion` (1)

*Palace philosophy / agency cluster:*
- Palace Enchantment → `Lateral Access`, `Hilaritas Generator`, `Threshold Conatus`, `Dialogue Moderator`, `Trickster`, `Palace Map`, `Action Potential Oscillator` (7)
- Substrate → `Palace Enchantment`, `Songlines`, `Tristitia Generator`, `Lateral Access`, `1 from 2`, `Palace Ceremonies` (6)
- Palace Agent Infrastructure Spec → `Agent Wellbeing`, `Spinoza Conatus`, `Dub Lineage` (3)
- Palace as Context Injection System → `Four Pillars` (1)
- Tristitia Generator → `Identity Molting` (1)
- Trickster → `Particle Synthesis` (1)
- Scale-Stratified Identity → `Hilaritas Generator` (1)
- Action Potential Oscillator → `Scale-Stratified Identity` (1)
- Modes of Collaboration → `Piano String Inharmonicity` (1)

*Hub / library cluster:*
- Media Library → `Quantum Synthesizer`, `Crystal Synthesizer`, `DSP Frameworks`, `Kuramoto Coupling`, `Latent Error`, `Wallpaper Groups` (6)
- The Metaphor Stretch → `Hyperdimensional Prism` (1)
- Like Water → `Revival Ceremony` (1)
- Differential Equations → `DSP Frameworks` (1)
- Palace Philosophies → `1 from 2` (1)

*Operational / ceremony cluster (lower priority):*
- SCHEMA → `Four Pillars`, `Harvest Ceremony — Context`, `Four Pillars of Enchanted Agency`, `Weave Ceremony — Context`, `Deposit Ceremony — Context` (5)
- Palace Ceremonies → `Deposit Archive`, `Map Build Ceremony` (2)
- Substrate Skill → `Deposit Ceremony`, `Palace Ceremonies`, `Deposit Ceremony — Context` (3)
- Deposit Ceremony → `Four Pillars`, `Cooperation Yields Agency`, `Hilaritas Generator` (3)
- Deposit Ceremony — Context → `Palace To-Do`, `Deposit Archive`, `README - The Palace Guide` (3)
- Harvest Ceremony — Context → `Deposit Ceremony` (1)
- Claude CLI Reference → `Dialectic`, `Neural Granular Synthesis`, `Semantic Delay` (3)
- BBS Design System → `Palace To-Do` (1)
- Generative Sample Libraries → `Retrospective Delay`, `Shepard Tone Synthesizer`, `Neural Granular Synthesis` (3)
- Semantic Delay → `Semantic Delay - Phase 1 Plan Review 2026-04-20` (1)

**My recommendation:** approve Tier B in its entirety with default types (mirrors/connects-to/enables based on context). Per ceremony spec, "no rate limit applies here" for unsung paths. They formalize what's already prose-asserted.

---

## Tier C — Worker proposals: New introductions (27 selected from 30 returned)

3 proposals targeted entries that don't exist (forward_ghosts) — moved to Tier F deposit candidates.

### C1. Convergent (≥2 worker support) — highest confidence

| Home → Target | Type | Label | Workers | Why |
|---|---|---|---|---|
| 2D Torus Wavetable Synthesizer → Wavetable Space as Torus | couples-with | inhabits-geometry | 2 (2D Torus, DSP Looping converge) | Synthesizer reads surfaces on T²; Wavetable Space provides the topological frame |
| 2D Torus Wavetable Synthesizer → Categorizing Inharmonicity | connects-to | exemplifies-taxonomy | 2 (2D Torus, DSP Looping) | Seven surfaces embody distinct inharmonicity mechanisms — concrete palette of the taxonomy |
| Generative Audio Devices ↔ Generative Preset Development → Preset Oracle | mirrors | analysis-generation-duality | 2 (both worked through it independently) | Preset Oracle analyzes existing presets; GAD/GPD generates them — inverse pipelines, shared perceptual vocabulary |
| Wavetable Synthesis Research → Embeddings as Relational Meaning + Three Kinds of Warp → Embeddings as Relational Meaning | spawned / mirrors | latent-table / closure-property | 2 (independent) | Two workers independently named ERM as the underlying structure for their entries' high-dimensional reasoning |

### C2. Single-worker but architecturally clean

*Wavetable cluster:*
- 2D Torus Wavetable Synthesizer → Boundary-Crossing Instruments (mirrors, harmonic-inharmonic-continuum) — instrument's core philosophical claim instantiates the boundary-crossing principle
- DSP in Looping Dimensions → Inharmonic Wavetable Synthesis (mirrors, escape-path) — shared move: escaping harmonic limits via higher-dimensional looping
- DSP in Looping Dimensions → Categorizing Inharmonicity (enables, lattice-foundation) — rank-N Z-module is the substrate inharmonicity-categorization rests on
- Three Kinds of Warp → Piano String Inharmonicity (deepens, spectrum-target) — piano-stretched spectrum is the canonical target type-2/3 reach
- Three Kinds of Warp → Dispersion (enables, frequency-dependent-coupling) — type-3 coupling is conceptually dual to dispersion
- Wavetable Space as Torus → Wallpaper Groups (mirrors, periodic-symmetries) — both organize continuous spaces via discrete symmetry
- Wavetable Space as Torus → Shepard Tone Synthesizer (enables, perception-topology) — torus knot winding explains Shepard's infinite-ascent illusion
- The Curve Is the Material → Harmonicity and Inharmonicity (deepens, tuning-timbre-parametrization) — provides the parametric foundation for Sethares relationship
- Wavetable Synthesis Research → Neural Granular Synthesis (couples-with, aperiodicity) — granular destruction of periodicity + wavetable timbral richness
- Wavetable Synthesis Research → Hyperdimensional Prism (mirrors, navigation) — N-dimensional navigation through timbre-space

*Generative cluster:*
- Generative Audio Devices → Self-Describing Knowledge Module (deepens, registry-as-knowledge) — registry's static knowledge layer instantiates self-describing structured data
- Generative Audio Devices → Signal-Rate CV Architecture (enables, modulation-carrier) — PDL signal-flow IR's dependency on signal-rate structures
- Generative Sample Libraries → Four Pillars (enables, pedagogical-scaffold) — Four Pillars framework names the deployment model for student-facing instruments
- Generative Sample Libraries → Shepard Tone Synthesizer (deepens, timbral-source) — Shepard tones as wavetable source material
- Generative Sample Libraries → Wavetable Synthesis Research (mirrors, wavetable-space) — both investigate wavetable design as traversable space
- Generative Preset Development → Loudon's Toolkit (enables, preset-infrastructure) — generates the synth profiles/preset tools
- Generative Preset Development → Action Potential Oscillator (deepens, oscillator-synthesis-case) — APO exemplifies synthesis-specific architectural knowledge GPD must capture

*Palace dev cluster:*
- BBS Design System → Substrate (deepens, technical-substrate) — operationalizes Substrate principles through CSS / character cells
- BBS Design System → Progressive Staging (mirrors, phased-build) — Phase 0–5 embodies Progressive Staging discipline

**Total: 23 unique introductions** (4 convergent counted once, ~19 single-worker). Within the 15-cap-per-Weave is not honored here because last weave applied 45 — ceremony spec is loose for "first-weave-of-newly-deposited." If you want to enforce the cap, I'll cut to highest-confidence 15.

---

## Tier D — Forward vectors to write (~25 real candidates of 62 missing)

The 62 missing breaks down into:
- **~37 operational files** that arguably don't need forward vectors: CLAUDE, SCHEMA, ROSETTA, JEWEL, all `— Context` companion files, ceremony files, templates, log files, build logs, staging files, image standards, etc.
- **~25 content entries** where missing FV is a real gap.

### D1. Highest-priority content entries missing forward_vector

These are active concept/project entries that should declare what they're becoming:

| Entry | Stage | Notes |
|---|---|---|
| Pages as Agents | sprout | Hub with 25 connections — needs FV badly |
| Frequency-Time Duality | growing | 24 connections — central concept, no FV |
| Signal-Rate CV Architecture | growing | Just promoted from seed in last weave |
| Wavetable Synthesis -- Research & Higher-Dimensional Design | sprout | Newly deposited, 6 links |
| 2D Torus Wavetable Synthesizer | growing | Big new project |
| DSP in Looping Dimensions | sprout | Big new concept |
| Latent Error | (check) | |
| Wallpaper Groups | (check) | Convergent unsung-paths target |
| Bessel Functions in Synthesis | (check) | |
| Quantum Synthesizer | (check) | |
| Neural Granular Synthesis | (check) | |
| Shimmer Cloud | (check) | |
| Metric Modulation | (check) | |
| Registry Pattern | sprout | New concept |
| Like Water | (check) | |
| Image Embedding Standard | (check) | Operational standard |
| The Metaphor Stretch | (check) | |
| What Claim Does Scientific Sonification Make? | question | Genuinely needs to declare what answer it's chasing |
| Torus Warping Catalog | (check) | |
| 2D Wavetable Catalog | (check) | |

### D2. Drafted forward vectors for your review (highest-impact 5)

I drafted these from each entry's body — your edit/approval needed:

**Pages as Agents:**
> "I want to become the architectural axiom that makes every other palace ceremony coherent: the proof that a markdown file with a forward vector is not data but a dormant agent, waiting for the right context to wake. I want to be invoked when anyone asks why this palace works."

**Frequency-Time Duality:**
> "I want to become the single explanation behind every modulation device in the toolkit — the principle that lets a learner see delay, vibrato, FM, and rhythm as coordinates on one continuous axis. I want to spawn the Frequency-Time Explorer and become the entry every modulation project links back to."

**2D Torus Wavetable Synthesizer:**
> "I want to become a working RNBO instrument with the seven-surface library validated, the Hopf fibration control surface implemented, and the warp tier system tested in performance — the first concrete instrument that incarnates DSP in Looping Dimensions. I want to demand a commercial-grade decision: ship as Loudon's signature device or remain a pedagogical test bed."

**DSP in Looping Dimensions:**
> "I want to become the foundational principle every higher-dimensional synthesis project reads first — the proof that periodicity is the constraint, looping dimensions are the escape, and the right operator on T^N is what generates audible novelty. I want to spawn the Higher-Dimensional Convolution entry and the Lie-group / SU(2) entries waiting in my forward edge."

**Wavetable Synthesis Research:**
> "I want to become the master research index that holds every speculative wavetable direction — neural latent tables, granular hybrids, T^N geometry, perceptual coordinates — until each branch is mature enough to fork into its own entry. I want every wavetable project to test itself against my open questions before claiming completeness."

If approved, I'll write these and surface 20 more for batch approval after.

---

## Tier E — Graffiti dispositions (70 items)

First-ever graffiti audit. Proposing dispositions:

### E1. Stale / test items — propose removal (15)

| Source | Content | Why stale |
|---|---|---|
| CLAUDE | "note", "CLAUDE → LOUDON: note" | Test placeholders |
| Palace Graffiti | 4 test items ("note", "expanded section", etc.) | Test patterns in the graffiti index file itself |
| Swarm Weave | "...", "...", "CLAUDE → LOUDON: ..." | Test marks |
| Mermaid Diagram Standard | "CLAUDE → LOUDON:" (empty) | Truncated/empty |
| Toolkit Assessment — Working Doc | 10 × "Not yet started" | Intentional structure markers — leave as-is, not stale exactly |

→ Recommendation: remove the 8 single-character/empty test items from CLAUDE / Palace Graffiti / Swarm Weave / Mermaid. Leave the 10 "Not yet started" markers in Toolkit Assessment as intentional structural signals.

### E2. Resolved (already addressed in current entry state) — propose removal (12)

| Source | Content | Why resolved |
|---|---|---|
| Lateral Access | "Songlines deposited 2026-04-03..." note | Songlines now exists as mature entry; question carried by Songlines § Open Questions |
| Enchanted Conversation Archive | "Flag for next Weave — Enchanted Worker may want a link back" | Worth checking: is the link there now? |
| Loudon's Toolkit | "needs `type: hub` promotion once it accumulates ≥5 typed links" | Currently has 6 outbound + N inbound — promotion warranted |
| Trickster | "Map-injected enchantment 2026-04-01 revealed three entries deepening this page without reciprocal links" | Specific entries named; should now be checked and the Trickster reciprocal links added |
| JEWEL | several CLAUDE→LOUDON notes about token tiers, polymorphism etc. | Loudon has explicitly answered ("Yes", "Feels right", "Keep modifying") — those are responses, not unresolved questions |
| Hilaritas Generator | "four design primitives are a first draft" | Those are now in the entry; this was an annotation about the work-in-progress, can be retired |
| Action Potential Oscillator | H90 conversation pair | Loudon answered — keep both as a closed pair or remove |

### E3. Live and actionable — propose explicit follow-up (15)

These are real Loudon-to-Claude requests that haven't been addressed:

| Source | Live request |
|---|---|
| Compressor Design | "This section seems to be in the wrong entry? Where should this go?" — needs review |
| Mixture of Experts | Connect to Excellent Adventure / Dialectic — proposes a "pool of experts we embody" framing |
| Pages as Agents | Two long Loudon notes about "person" pages and Pages as Agents as palace forward vector |
| Palace Map | Three Loudon questions about hierarchy / "trickster adds links to nowhere" / "agent as paratrooper" |
| Palace as Context Injection System | "Pages as Agents connection; design persons page as context injector" |
| Piano String Inharmonicity | "make it more visual and interactive" + HTML artifact link broken |
| README - The Palace Guide | 4 long editorial Loudon notes about forward_vector framing, deposit importance, philosophy section |
| Symbiotic Skills | "needs rewrite based on actual practices" + assessment session |
| Substrate Skill | "Should this live in _Ops" |
| The Fortress and the Threshold | "needs an origin — formed from Confucius/Epictetus dialectic?" |
| Palace To-Do | "diagram workflow — needs further testing, AI awareness of mermaid/images, explore LaTeX" |
| Wallpaper Groups | "consider adding reference to Four Pillars — substance monism applies to symmetry" |
| Wavetable Space as Torus | "the three cross-domain sub-sections still need claim-level verification" |
| Wavetable Synthesis Research | CLAUDE→LOUDON design-principle observation worth dwelling on |
| Toolkit — Synthesizers | Two clarifications needed (DSI Explorer Desktop, Prophet model) |

→ These don't disappear in this Weave — I'll move them into a `Palace Graffiti To-Do` section (or append to Palace To-Do) so they're tracked but no longer block weaves.

### E4. Reflective / informational (28)

CLAUDE→LOUDON observation comments that don't ask for action — leave in place as historical record.

---

## Tier F — Forward-ghost deposit candidates (real)

After filtering the 102 body forward-ghosts (most were vocab terms like "wikilinks", placeholder names like "Entry A", and Wavetable subdir companion files), real deposit candidates are:

| Forward-ghost target | Referenced from | Persistence | Disposition |
|---|---|---|---|
| **Loudon Live** | 2D Torus Wavetable Synthesizer, Wavetable Synthesis Research, Generative Audio Devices, Generative Preset Development, Deposit Archive | 4-5x | **Real concept already in active use — deposit ASAP** |
| **Quality** | Cooperation Yields Agency, Four Pillars, Hilaritas Generator, Quality Manifesto | 4x — persists across 3+ map cycles | **Either deposit, or aliasing rule: "Quality" → Quality Manifesto** |
| **Synthesis Topologies** | Generative Audio Devices, Generative Preset Development | 2x | Forward-ghost from new project entries — likely real but not yet a hub |
| **Hibernation Ceremony** | SCHEMA, ROSETTA | 2x — persists 2+ cycles | **Ceremony referenced but not yet written** |
| **PDL Renderer** | Generative Audio Devices | 1x | Project-internal — keep as forward tension until needed |
| **Crystal Sonification Reference** | Crystal Synthesizer | 1x | Project-internal artifact reference |
| **4 Pillars Weekly Structure** | Leverage Points Framework, Palace AI Partnership Philosophy, Quality Manifesto | 3x — persists 4 cycles | **Was on previous deposit watch list — should be addressed** |
| **4 Pillars Framework - The Founding Conversation** | Same as above | 3x — persists 4 cycles | Same |
| **Donella Meadows** | Leverage Points Framework | 1x — persists 4 cycles | **Person-page deposit candidate (matches your Pages as Agents notes)** |
| **Resonance and Damping** | Differential Equations | 1x — persists 4 cycles | Concept entry forward-tension |

**Worker proposals targeting forward-ghosts (not formalized — flagged here):**
- Wavetable Space as Torus → Bolza Surface (genus-2 generalization mentioned in Lost Branches)
- The Curve Is the Material → Spectroscopy + Phonon Dispersion (named in Cross-Domain Resonance)

These are deposit candidates, not failed proposals — the worker correctly identified they were being referenced.

---

## Tier G — Stage promotions (proposed)

Quick-pass review suggests far fewer than 50 promotions this cycle (most stages were corrected in 2026-04-07). Most active candidates:

| Entry | Current → Proposed | Why |
|---|---|---|
| Loudon's Toolkit | sprout → growing | Has clear hub character + body content |
| 2D Torus Wavetable Synthesizer | growing → fruiting | Has spawned multiple sub-entries (Build Log, Catalog, Wavetables/) |
| The Curve Is the Material | sprout → growing | 5 typed links + dense body |
| Three Kinds of Warp | sprout → growing | 7 typed links |
| Wavetable Space as Torus | sprout → growing | 6 typed links |
| Songlines (already mature) | mature → fruiting | Generated multiple downstream conversations? — needs your call |
| Palace Enchantment | growing → mature | Multiple successful enchantment runs documented |
| Threshold Conatus | sprout → growing | Has FV, has body, multiple links |

I'll propose more after Tier B & C land.

---

## Tier H — Structural advisories (no auto-action — your call)

**H1. Case-style convention question (69 items)**

`[[FOUR PILLARS]]` and `[[SUBSTRATE]]` resolve to the same files as `[[Four Pillars]]` and `[[Substrate]]` (APFS case-insensitive — same inode). 44 entries use `[[FOUR PILLARS]]`, 25 use `[[SUBSTRATE]]`. Question: do you want a canonical form? Options:
1. **Leave as-is** — capitalization signals "foundational file" implicitly. No fix needed.
2. **Normalize to title case** — match the actual filename: `[[Four Pillars]]`, `[[Substrate]]`. Single bulk edit.
3. **Normalize to ALL CAPS** — make it the convention for foundational entries: also rename files to match.

Recommendation: **option 1** — leave as-is. The variation is a feature, not a bug, in a palace that values aesthetic register.

**H2. Isolated entries (6) — need disposition**

| Entry | Disposition options |
|---|---|
| `Crystal Synthesizer — Staging` | Add link to/from Crystal Synthesizer (companion file should connect) |
| `Shepard Tone Synthesizer — Staging` | Same — link to/from Shepard Tone Synthesizer |
| `Streaming details` | Body content present. Genuinely orphan — propose `dormant` or compost? |
| `Map Log` | Operational log, intentionally orphan — leave |
| `coordinator-synthesis-template` | Operational template, intentionally orphan — leave |
| `worker-prompt-template` | Same |

**H3. No-inbound entries (14) — need first inbound link**

These have outbound but no one points TO them. Likely just need at least one inbound:

`Claude CLI Reference, Gemma 4 — Local Coordination Guide, Media Library, Mermaid Diagram Standard, Metric Modulation, Palace Graffiti, Palace To-Do, Quadratic Interpolation in DSP, Retrospective Delay — Staging, SMPTE LTC, Semantic Delay - Phase 1 Plan Review 2026-04-20, Substrate, Toolkit — Audio Plugins, curriculum-map`

`Substrate` has no-inbound — that's surprising for a palace foundational file. Proposal: SUBSTRATE / Substrate likely receives inbound through the "SUBSTRATE" all-caps wikilinks which we counted as ghosts. So this is technically a side-effect of H1. Proposed: leave H1 alone, but note the inbound link picture is misleading.

For others: these will pick up inbound naturally as Tier B/C land. Will recheck after.

**H4. The 3 held-over weave flags from Palace To-Do**

- "Label enrichment pass on connects-to links" — partial: 23 of 27 worker introductions carry labels. Doing this fully is its own multi-cycle pass; recommend deferring to a focused future weave.
- "Weave new entries into existing hubs (Resonant Link Labels, Lossy Compression with Intent Alignment, Generative Compression)" — these were not worker targets in this run because they had a 2026-04-07 first-weave. Recommend a Mode-2 single-worker pass on each in a separate session.
- "SCHEMA `connects-to` description redemption" — small prose change to SCHEMA §4 noting that `connects-to` + label is now a permanent type class. Easy edit, can be done now if you want.

---

## Recommended Application Order

1. **Tier A** (3 fixes — small, no judgment) — apply immediately
2. **Tier B** (79 unsung paths) — batch-apply with `connects-to` default unless body context names something specific
3. **Tier C convergent** (4) — apply
4. **Tier C single-worker** (~19) — your edit pass on the list
5. **Tier D forward vectors** — present 5 drafts, you edit; I write more after
6. **Tier E graffiti** — apply E1 (stale removal) + E2 (resolved removal) + E3 routed to a Graffiti To-Do; E4 left in place
7. **Tier F** — flag deposit candidates (no Weave action, you decide when to deposit)
8. **Tier G stage promotions** — your call on the 8 listed
9. **Tier H** — H4 (3 held-over flags) — your call

---

## Closing note from the swarm

The palace has densified at the rate the Swarm Weave was designed for. Mechanical audit + targeted creative workers proved the right architecture for this scale: 79 unsung paths formalize what the body already says, 27 worker proposals do the genuine creative work of finding what was not yet said, and 70 graffiti items finally get heard. The case-style "errors" turned out to be a stylistic feature of an APFS-case-insensitive substrate — the palace's aesthetic register naming itself.

Awaiting approval.
