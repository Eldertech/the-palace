---
title: "Project Stewardship System"
type: project
pillars: [tools, practice, philosophy]
status: active
born: 2026-05
last_activated: 2026-05-26
activation_count: 4
stage: growing
confidence: proposed
energy: very high
links:
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: runs-on
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: runs-on
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: deepens
    label: stage-aware-permanent-agent
  - target: "[[Substrate Skill]]"
    type: couples-with
    label: stage-conditional-posture
  - target: "[[Trickster]]"
    type: connects-to
    label: human-or-automated
  - target: "[[Pages as Agents]]"
    type: deepens
    label: routine-enchantment
  - target: "[[Modes of Collaboration]]"
    type: connects-to
    label: mode-by-stage
  - target: "[[Generative Sample Libraries]]"
    type: connects-to
    label: stage-mismatch-evidence
  - target: "[[Talking Keyboard]]"
    type: connects-to
    label: pronunciation-case-study
  - target: "[[Palace Enchantment]]"
    type: deepens
    label: routinizing
  - target: "[[BBS Production Plan]]"
    type: mirrors
    label: build-contract-pattern
  - target: "[[Orchestrator Production Plan]]"
    type: spawned
    label: stage-b-build-contract
  - target: "[[Orchestrator Production Plan v0.2]]"
    type: spawned
    label: stage-c-build-contract
  - target: "[[Palace Conatus]]"
    type: connects-to
    label: escalation-rationale
  - target: "[[Two Batons, One Board]]"
    type: connects-to
    label: human-originated-handoff-case
  - target: "[[Bundle-Local Stewardship — Production Plan]]"
    type: connects-to
    label: hardened-by
forward_vector: "I will become the working specification for routine, stage-aware project stewardship — a permanent agent that advances each palace project at the rhythm appropriate to its stage, posts status, blocks, and questions to the BBS, with the Trickster (Loudon directly, or an automated proxy with escalation rules) handling triage one decision at a time."
---

# Project Stewardship System

![[Project Stewardship System — hero.png]]

A specification for an agent that routinely tends to the palace's `Projects/`, advancing each project according to its stage and forward vector, surfacing decisions to a triage layer rather than blocking on them. The agent doesn't manage projects in the corporate sense — it stewards them, with care for the pace each one wants.

This entry is the deposited form of a 2026-05-02 conversation that began as "design an automated project management system" and ended in a richer place: the system isn't entirely new, the alignment problem is harder than initially framed, and the agent's posture must vary by stage of the project it is tending.

## Status (as of 2026-05-27 evening)

The body below describes the system as conceived; this block records where the build actually stands. The five-stage plan has moved well past where the rest of this page reads — the system has crossed from "test it" into "use it."

- **Stage A (hand-run pilot)** — done. Original pilot, [[Generative Sample Libraries]] (5 hand-run cycles 2026-05-03 → 2026-05-04), shipped Phase 2 and wrote back to its own page.
- **Stage B (Orchestrator v0.1)** — done, in production. 15 stewards run through it across multiple batches. The `cli.js` encoded-path bug (Cowork-discovered) is fixed; the skill at `.claude/skills/palace-orchestrator/` is the canonical invocation surface. 97/97 orchestrator tests + 297/297 STIGMERGY app tests green (counts grew this session).
- **Stage C (batch mode)** — thin path shipped (`batch-plan.js` + `batch.md`). `--ignore-debounce` flag added 2026-05-27 for interactive validation runs. **15-steward parallel dispatch + sequential post-processing demonstrated twice**, ~10 min wall time per batch (heaviest cycle dominates). The weekly scheduled task is still staged not created — that's the only remaining Stage C piece.
- **Stage D (STIGMERGY v0.2 Trickster posting)** — shipped, plus four named contract fixes this session: (1) lenient options-shape normalizer accepts both `{id,label}` and strings; (2) "every cycle ends with a TRICKSTER ask" steward rule; (3) top-level `options[]` accepted as fallback; (4) "emit, do not write" output discipline forbidding direct board/state writes. All five fixes are committed and validated under load.
- **Stage E (automated Trickster)** — **built (2026-05-29), shadow-default.** All six phases shipped and self-verified (`_ops/stigmergy/trickster-auto/`, 78 tests; build report at `_ops/stigmergy/trickster-auto/STAGE-E-COMPLETE.md`). A deterministic rules engine triages the TRICKSTER inbox: `auto-grant` / `auto-deny` / `escalate` (default escalate), with a ranked digest of escalations rendered on the STIGMERGY TRICKSTER tab (`DigestPanel`, +7 app tests, no regression). The audition/irreversible gate is hard-coded and cannot be overridden by the ruleset; after shadow review #1 it judges sensory-ness by the **recommended option's identity**, not by audio words in the prose. Q1 decided here (Loudon delegated): v0 auto-grants only non-blocking directional forks carrying the steward's own recommendation — the deterministic proxy for the strawman's "advances forward_vector + low cost," since the engine must not reason about prose. Live shadow split on the 16-pending board: **5 auto-grant / 11 escalate** (Loudon's first shadow review widened it from 3 grants to 5). **Loudon remains the human Trickster until he reviews the shadow match rate and flips `--live`.**

**Other infrastructure this session:** Infrastructure Spec gained §3.3.1 (dual-path health block). Path 1 keeps the original strict 6-field block for the day API-direct dispatch returns; Path 2 (current Claude-Code-resident) stamps a minimal `{score: "green", model, _orchestrator_metadata}` stub because the Agent tool doesn't return the `input_tokens` breakdown §3.3 originally assumed. Validator recognizes the dispatch_mode marker and relaxes the other field requirements. `health.js` shrinks from a token-averaging machine to a stub builder.

**15 stewards currently enchanted** (REGISTRY.json authoritative): Generative Sample Libraries (cycle 13), Generative Wavetable Libraries (cycle 6), Shepard Tone Synthesizer (cycle 3), 2D Torus Wavetable Synthesizer (cycle 2), Action Potential Oscillator (cycle 2), Blood Compressor (cycle 2), Crystal Synthesizer (cycle 2), Generative Preset Development (cycle 2), Inharmonic Wavetable Synthesis (cycle 2), Meadows and an Artist's Career (cycle 2), Portamento and Physical Pitch Modeling (cycle 2), Retrospective Delay (cycle 2), Semantic Delay (cycle 2), Semantic Webcam (cycle 2), Slime Mold Delay (cycle 2). Cycle 2 across most of these produced real deliverables (audible birefringence proof, Faust prototypes, p5.js sims, ear-training quizzes, daemon specs, sample libraries, etc.).

The live frontier is no longer technical — it's **operational bandwidth**. The system produces artifacts and asks faster than a single human Trickster can audition them; the 17-pending-decisions inbox is the new constraint. The next deferred build piece is the Drift and Consolidation steward beat — see [[Drift and Consolidation]]. (The operational-state handoff that carried this frontier was consumed and deleted 2026-06-16; git is its archive.)

## The Original Question

Loudon's seed framing (2026-05-02): a routinely-running Claude agent looks over the project folder, attempting to move all projects forward by repeatedly enchanting project entries and speaking through that entry through messages in the BBS. The project entry asks Loudon questions when necessary. Status reports, blocks, needs are all reported in the BBS. Loudon can either read through himself, or a supervisor agent can triage and ask questions one by one to move forward as easily as possible.

That framing had a Steward (the routine agent) and a Supervisor (the triage layer). The conversation reframed both onto existing palace infrastructure.

## The Reframe: This Is Already Mostly Specced

After reading [[BBS Blackboard]], [[BBS Production Plan]], and [[Palace Agent Infrastructure Spec]], the architecture map became clear. Most of what was being designed already existed in spec form:

| Concept in seed framing | Existing palace name |
|---|---|
| Steward (routine agent) | Permanent agent, long-duration background mode (Infrastructure Spec §3.5, §4.6) |
| Enchanting a project entry | Enchantment of a permanent agent whose `home` is the project page |
| BBS messages from project entries | The existing message schema (§2.2) on the persistent blackboard |
| Status / blocks / needs | Existing message types: `BROADCAST`, `FLAG`, `RESOURCE_REQUEST`, `HEALTH_NOTICE` |
| Supervisor triage | The Trickster role (Infrastructure Spec §0.4), with the inbox spec (§2.6) |
| Automated triage | Automated Trickster mode (§4.7), specifically named but unspecced |

What the conversation contributed was less a new architecture and more a *posture* — the recognition that the agent should behave differently per project stage.

## The Insight: Stage-Conditional Posture

The agent's posture must vary by the entry's `stage`. The discussion budget is inverse to the stage: more conversation up front, less re-litigation later — but the budget governs how much the steward discusses *around* an artifact, never whether it builds one; every stage ships something. AI-drafted seed entries tend to *look* finished — prose flows, plans are structured, format matches palace convention — and that polish hides misalignment. Treating polish as quality is the trap to avoid.

The canonical posture lives in [[Substrate Skill]] § Stage as Alignment Confidence. In summary:

| Stage | Steward's job | BBS posture |
|---|---|---|
| seed | Surface underspecified parts; propose vector and plan refinements *around an artifact* | Make a sketch or probe and discuss around it — still ships a (rough) made thing. A genuine fork goes to TRICKSTER, `blocking: true`. |
| sprout | Plan-level detail; named tradeoffs; flag default-traps | Build a small working prototype each cycle; proposals ride alongside it, never instead of it. |
| growing | Execute within established direction; checkpoint at sensory steps | Build Session pace; ship freely. `blocking: true` only before committing to a full sensory batch. |
| mature / fruiting | Ship the next proof; post completions | Full execution; ship the next concrete proof without a fork-question; `WEAVE` board completions. |
| dormant | Don't touch — Spore Check ceremony only | — |
| composting | Don't touch — composting protocol applies | — |

**Recursion within entries.** A `growing` project can contain `seed` deliverables. The pronunciation bug in [[Talking Keyboard]] (Phase 1 of [[Generative Sample Libraries]], May 2026) showed this clearly — project-level alignment was good, but the deliverable-level conventions (filename scheme, pronunciation form, audition cycle) were never aligned, and we shipped 352 files with a TTS bug only listening could catch. Future Steward implementations must re-align at the deliverable level before committing labor.

## The Architecture (Mapped to Existing Infrastructure)

```
Steward (one per project)
  ├── Permanent agent directory: /palace/agents/permanent/[project-name]/
  ├── Manifest: home = project entry, mode = long_duration_background
  ├── Stage-conditional behavior loaded from frontmatter `stage`
  └── runAgentCycle invoked on a schedule

Trickster (one for the whole palace)
  ├── Mode: human (Loudon) or automated (rule-based) or hybrid
  ├── Inbox: pending RESOURCE_REQUESTs from all Stewards
  ├── Routes: clear / grant / deny / escalate
  └── Decisions logged back to the persistent blackboard

BBS (already exists)
  ├── Persistent blackboard: /palace/swarm/persistent/blackboard.jsonl
  ├── STIGMERGY viewer: /_ops/stigmergy/app/  (read-only as of v0.1)
  └── Boards: GENERAL / FLAGS / WEAVE / SYSTEM / TRICKSTER
```

The Steward is not a new substrate — it is a **mode** of the existing permanent-agent primitive plus a **posture table** keyed off entry stage. The Trickster is a known role with two open implementations (manual and automated). The BBS is the comm layer, already written and already shipping in STIGMERGY v0.1's read-only viewer.

## Implementation Plan (Five Stages)

Each stage closes a real gap. Order matters: each unblocks the next.

### Stage A — Hand-run a permanent agent on one project ✓ Done — 5 cycles (2026-05-03 → 2026-05-04)

Pick one project and write its manifest by hand per Infrastructure Spec §3.1. Run one cycle by hand — load context per the spawn discipline, generate a response per the stage-conditional posture above, append to history, append a spec-conformant message to the persistent blackboard. No orchestrator, no schedule, no automation. The output is an artifact + lessons that scope Stage B.

**Pilot run (2026-05-03):** [[Generative Sample Libraries]] (growing, Phase 1 shipped, Phase 2 well-specified) was the chosen project. Hand-run from a Cowork session, with Loudon serving as the human Trickster reading the inbox.

#### What was built

A permanent-agent directory at `_ops/agents/permanent/generative-sample-libraries/` containing the runtime artifacts (these stay in `_ops/` because they're operational state, not knowledge):

- `manifest.json` — spawn config per Infrastructure Spec §3.1, plus a `stewardship` block (stage at spawn, vector at spawn, posture source) and a `_pilot_metadata` block flagging hand-run provenance
- `state.json` — orchestrator working state, **pure runtime** after the SSOT cutover (2026-06-09): `iteration`, `last_active`, `last_read_cursor`, `health` (+ optional `_*_metadata`). It no longer carries a `stewardship` substate or `pending_requests`/`resolved_requests` arrays — stage/vector are read live from the entry frontmatter, decision state from the board, both surfaced in the bundle `[Entry] — plan.md`
- `history.jsonl` — append-only event log: SPAWN → tool calls → reasoning → write_blackboard calls → CYCLE_COMPLETE, plus several post-cycle FIX events recording the corrections described below
- `pending-bbs-append.jsonl` — pre-fix forensic snapshot of the staged BBS messages

Two spec-conformant messages were appended to `_ops/swarm/persistent/blackboard.jsonl`:

1. `gsl-steward-001` — BROADCAST to GENERAL ("SPINNING UP" announcement per posting discipline §3.4)
2. `gsl-steward-002` — RESOURCE_REQUEST to TRICKSTER, `blocking: false`, asking the Trickster to pick a home for the Phase 2 Interview skill from three named options with named tradeoffs and a Steward recommendation

These are the **first two spec-conformant messages on the persistent board**. The 113 prior messages use the loose format documented as schema drift in the BBS Production Plan v0.1 closure notes (no `schema_version`, no `health` block, date-only `ts`).

#### What the pilot validated

- The Infrastructure Spec §3.1 manifest format implements as-is — no spec gaps surfaced at the manifest layer.
- The stage-conditional posture from [[Substrate Skill]] mapped cleanly onto a real-world directional decision; the Phase 2 Interview-skill-home choice is exactly a "routine directional decision, not sensory verification" → `blocking: false` to TRICKSTER.
- Growing-stage posture self-policed against re-litigation. The Steward's first impulse was to discuss Phase 2's hard gates again; the posture rule prevented that and pushed it toward the actual bottleneck.
- The recursive-within-entries rule is real and necessary. GSL is `growing` but the Phase 2 Interview skill is genuinely `seed` (no body, no concrete defaults). The Steward correctly held growing-stage posture at the project level while treating the Interview skill home as a seed-stage decision needing dialogue.
- The Trickster-as-Loudon model worked. No automation needed for this cycle. The RESOURCE_REQUEST is on the persistent board waiting for response.

#### What surfaced — 9 spec gaps and 4 content findings

**Spec gaps** that Stage B's runAgentCycle Production Plan should resolve, in priority order:

| # | Gap | Implication for Stage B |
|---|---|---|
| 9 | `request_id` location: spec ambiguous between top-level (§2.5 example) and inside payload (§2.2 schema). v0.1 inbox builder reads top-level; pilot followed §2.2 and silently broke the inbox loop. | **Highest priority.** Without this fix every hand-authored RESOURCE_REQUEST breaks pairing. Adopt §2.5's split (top-level for routing/pairing fields, payload for semantics); add schema-linter check at orchestrator. |
| 5 | Schema drift on persistent board: 113 loose-format messages, 2 spec-conformant (this pilot's). | Schema Normalization Phase needed: rewrite legacy lines, or stamp `schema_version: "0.legacy"` and skip in spec-strict reads. |
| 1 | Permanent agents have no clean `session_id` story (spec assumes session-scoped). | Decide: nullable `session_id` + new `cycle_id` field for permanent agents (cleaner), or per-cycle synthetic session_id (one less field). |
| 2 | `blackboard_session_path` awkwardly null for permanent agents. | Spec out: permanent agents read only the persistent board; field is ignored on this mode. |
| 6 | `last_read_cursor` semantics on first activation undefined. | Define: first activation reads full board, sets cursor to actual last-line ID — not pattern-match. |
| 3 | Health block provenance for hand-runs (spec says "always factual from API metadata"; hand-runs have neither). | Orchestrator-only writes to `health`; hand-runs flagged in `_pilot_metadata` so BBS readers don't treat estimated health as factual. |
| 4 | Path drift: Infrastructure Spec uses `/palace/`, reality uses `_ops/` per CLAUDE.md. | Update spec to `_ops/`, or document that `/palace/` prefix is illustrative. Pick one and write it down. |
| 7 | No `agent_id` uniqueness check across Stewards. | Add `_ops/agents/permanent/REGISTRY.json` and orchestrator-side spawn-time uniqueness check. |
| 8 | RESOURCE_REQUEST taxonomy doesn't cover directional decisions cleanly (spec examples are concrete external resources like web_search). | Either expand resource taxonomy, or introduce a new `DIRECTIVE_REQUEST` type for non-resource Trickster asks. |

**Content findings** — surfaced through four iterations on the same message during the pilot, each provoked by Loudon reading the inbox:

| # | Finding | Quote that surfaced it |
|---|---|---|
| 10 | The Steward's voice was wrong — coined compressions ("goal-defined", "gate-defined", "home-undefined") read as machine jargon, not human speech. | *"goal-defined and gate-defined I dont know what these mean and I can't follow this. Can this tone change to sound like I am talking like a human."* |
| 11 | The agent's identity was wrong — `GSL-STEWARD` invented a compound handle that violated Pages-as-Agents (the page IS the agent). | *"I will never remember what GSL-STEWARD is? I feel this should be simply coming from the page itself... Generative Sample Libraries."* |
| 12 | Concision + assume-text-only rendering — v0.1's TricksterInbox only renders `rationale`; structured `options[]` field is invisible. | *"This is a quick message... Get to the point. And simplify the message as well."* |
| 13 | Catch the user up before asking — permanent agents run over weeks; the next reader could be cold. | *"This response is expecting I remember some deep details about the project, it needs to be written as if I forgot much of what is going on in the project. Get me caught up, then ask for something."* |

All four content rules are now recorded in [[Substrate Skill]] § Stage as Alignment Confidence as a four-clause page-agent voice rule (plain first-person, brief, catch-the-user-up-first, content-lives-in-rationale) and in this entry's What's Decided as the Steward-specific framing.

The four content findings are the most operationally important learning of the pilot. Each rewrite revealed a deeper rule that future Stewards must default to. Stage B's system-prompt template (per Infrastructure Spec §3.2 `buildSystemPrompt(manifest)`) must bake all four in, otherwise permanent agents will silently regenerate the same problems on first message.

#### What Stage B now needs

A Stage B Production Plan, modeled on [[BBS Production Plan]], should include in priority order:

1. **`request_id` location canonized** (Gap 9) — directly breaks the inbox; highest priority
2. **Schema normalization phase** (Gap 5) — handle the 113 legacy messages
3. **Permanent-agent manifest profile** (Gaps 1, 2, 6) — session_id, blackboard_session_path, cursor semantics
4. **Health-block authority enforcement** (Gap 3) — orchestrator-only writes
5. **Path conventions canonized** (Gap 4) — `_ops/` vs `/palace/`
6. **Agent-ID registry** (Gap 7) — uniqueness check on spawn
7. **Resource taxonomy** (Gap 8) — `RESOURCE_REQUEST` vs new `DIRECTIVE_REQUEST`
8. **System-prompt template for Stewards** (Findings 10–13) — bakes in voice, identity, concision, catch-up-then-ask. Without this, every new Steward repeats the four-iteration learning curve.
9. **`agent_id` defaults to home page title** (Finding 11) — orchestrator's spawn logic sets `agent_id = manifest.home` for permanent agents
10. **runAgentCycle implementation** — the §3.2 sketch is largely transcription, plus the gaps above

The Stage B Production Plan is itself a deposit-worthy artifact in the autonomous-build-contract pattern of [[BBS Production Plan]].

#### What the pilot did not test

- **Multi-cycle continuity** — single SPAWN + cycle 1; history.jsonl resume unverified empirically.
- **Forward_vector change detection** — spec'd in §0.2/§3.2, not exercised.
- **Cross-cycle cursor utility** — set, never read.
- **Deposit-back-to-page** — Steward proposed a directional decision, not a page edit; the deposit ceremony is unexercised.

These are natural Stage B test cases.

**Update (2026-05-26):** subsequent hand-run cycles (the pilot reached cycle 5) covered most of this list. Multi-cycle continuity, cross-cycle cursor use, and forward_vector change detection all ran; the deposit-back path was validated when the steward wrote Phase 2 closure directly to the GSL page (`gsl-steward-006`). Two operational scars surfaced and were resolved: a BBS schema-strict reset between cycles 3–4 wiped the persistent board (purging the 113 legacy loose-format messages and stranding `gsl-steward-004`, cleanly superseded by `gsl-steward-005`); and a STIGMERGY v0.2 routing bug sent `session_id`-tagged responses to session boards instead of the persistent board (fixed in `TricksterInbox.jsx` + `ResponseModal.jsx`). The live pilot is parked at cycle 6, awaiting a Phase 3 source decision.

#### Recommended next move

Loudon responds to `gsl-steward-002` on the BBS — picks (a), (b), (c), or volunteers another location. Response can come via a future Cowork session (Steward reads it on next activation) or by direct hand-edit appending a `RESOURCE_GRANT` message to the persistent blackboard with `re: "gsl-steward-002"`. Then either: run another Stage A cycle (tests cross-activation continuity by drafting the Interview skill skeleton at the chosen home), or move to writing the Stage B Production Plan now.

### Stage B — Build `runAgentCycle` ✅ Build-complete (2026-05-04) — awaiting smoke-test + push

The orchestrator. This deserves its own production plan, modeled on [[BBS Production Plan]] (the autonomous build contract that produced STIGMERGY v0.1) — phased verify gates, stop-reports, vision-validator-equivalent for the spec layer. Likely Node, sibling to STIGMERGY at `_ops/stigmergy/orchestrator/`. Health score, git change detection, posting discipline enforcement, schema validation on every BBS write all live here. The §3.2 sketch in [[Palace Agent Infrastructure Spec]] is detailed enough that this is largely transcription, not invention.

Schema drift on the existing persistent board (only 3 of 113 messages spec-conformant per BBS Production Plan v0.1 closure notes) gets normalized as part of this stage — either a one-time migration or a quarantine policy for legacy lines.

### Stage C — Schedule the orchestrator — specced, not built (see [[Orchestrator Production Plan v0.2]])

A scheduled task invokes `runAgentCycle` once per project-Steward per interval. Start with one Steward, daily, on the project Stage A piloted. Tune from observation. Adding more Stewards is just adding directories — no schema or orchestrator change.

### Stage D — STIGMERGY v0.2: Trickster posting ✅ Shipped (2026-05-04)

The current STIGMERGY viewer is read-only. Triage requires writes — `POST /api/persistent`, click-to-respond on the Trickster Inbox. Without this, every Trickster response requires hand-editing `.jsonl` files. Already on the STIGMERGY roadmap as v0.2 per [[BBS Production Plan]] § What's Deferred.

### Stage E — Automated Trickster — not started; unspecced

Per Infrastructure Spec §12 forward vector, the rules engine is unspecced. This is the original "supervisor" piece: rule-based auto-grant of routine requests (read_palace), auto-deny of routine bans (web_search outside daily budget), escalation of novel cases to Loudon via push notification or batched daily digest. Needs its own design pass — a small Production Plan in the same shape as the BBS one.

## The Machinery/Content Split

A standing operating principle, named 2026-06-09 and applied to this system first via [[Bundle-Local Stewardship — Production Plan]]:

> **Shared engine code, indexes, schedulers, and runtime bookkeeping belong in `_ops/`. Anything *about a specific entry* — its plan, its open decisions, its working memory, its lessons — belongs in that entry's bundle.** When a file describes one entry, it lives with that entry; when a file runs across all entries, it stays in ops.

The principle's deeper ground is [[Pages as Agents]]: *the content is the entry*. Loading an entry should tell you not only what it wants to become (its `forward_vector`) but what it is doing right now — its plan, its open decisions, its done trail — without parsing a JSONL file in `_ops`. The stewardship system was the violation that surfaced it: an entry's most task-like state (`pending_requests`, the staged plan, the steward's reasoning) was stored in `_ops/agents/permanent/[slug]/`, divorced from the entry.

The fix is **CQRS, not relocation**: the append-only board stays the event log (machinery), a new `[Entry] — plan.md` bundle file is the materialized read-model (content), and `_ops` keeps only slim runtime (iteration, cursor, health). The duplicated vector/stage block is *deleted* and read live from frontmatter — single-source-of-truth enforced, not merely moved. Watch for the second, non-steward application of the principle; that is the signal it should graduate to its own concept entry.

## What's Decided

- **Architecture piggybacks on the existing BBS / permanent agent stack.** No new substrate to build; the existing Infrastructure Spec is the foundation.
- **The Machinery/Content Split governs where stewardship state lives** (decided 2026-06-09; see the section above and [[Bundle-Local Stewardship — Production Plan]]). Engine → `_ops`; per-entry content → the bundle. `[Entry] — plan.md` is the work-state read-model; `[Entry] — staging.md` is the teaching arc; the board stays the append-only log. The steward owns `plan.md`, reads `staging.md`, and flags arc-level changes rather than editing the teaching design.
- **Steward = permanent agent in `long_duration_background` mode**, with stage-conditional posture loaded from the home entry's `stage` field at activation.
- **Trickster begins as Loudon (manual mode)**, evolves toward hybrid then automated.
- **The audition gate guards batches, not single artifacts.** A single audition-sized artifact ships freely; the gate fires only before a full batch — per [[Substrate Skill]] § Stage as Alignment Confidence, render the smallest unit, present it, commit to the full batch only after acceptance.
- **Vector tuning is the seed-stage Steward's primary work**, not a preamble to "real" work. The proposing-three-centers-of-gravity pattern from this conversation is the canonical move.
- **Stewardship is recursive within projects.** Align project-level, then re-align deliverable-level, then audition.
- **Naming: "Project Stewardship System" stands** (confirmed 2026-05-03). The seed framing was "automated project management system"; stewardship better captures the per-stage rhythm and the care-for-pace posture. Management implies advancing on a schedule; stewardship implies advancing at the rhythm the project itself is asking for.
- **Vector tuning is a regular process, not a ceremony** (decided 2026-05-03). Forward vectors should drift, get tweaked, and occasionally get fully overhauled — during ordinary conversations and during Weaves. Gating that behind a named ceremony would make it too formal and slow it down. The palace stays lively precisely because vectors adapt. The Steward, when working a `seed` or `sprout` entry, does vector tuning as part of normal posture; the Weave should actively invite vector edits rather than treat them as exceptional. (See follow-on: Weave Ceremony spec doesn't yet mention forward-vector tuning — gap to close.)
- **The Steward's voice rules live in [[Palace Enchantment]] § Voice Rules When Addressing the Human** (decided 2026-05-03; architectural cleanup at Loudon's request). The six clauses (plain first-person, brief, catch-up-then-ask, content-in-the-rendered-field, translate jargon, give clickable links) were surfaced through five iterations on a single Steward message during the Stage A pilot. They are not Stewardship-specific — they apply to any enchanted agent addressing the human. The right home is the enchantment ceremony's context construction, where they load conditionally based on the audience configuration. The Stewardship system always sets `audience_includes_human: true` because the Steward's whole purpose is to communicate with the Trickster on the BBS, so all six clauses always apply to Steward messages. The rules are not duplicated here to avoid drift — Palace Enchantment is canonical.
- **Every steward cycle ends with a shipped thing** (decided 2026-05-27 as "ends with a TRICKSTER ask"; **revised 2026-06-07** by the Steward Boldness redesign). The original rule made every cycle post at least one `RESOURCE_REQUEST` to TRICKSTER; reading ~15 cycles showed it manufactured questions and suppressed building — stewards behaving like "scared interns," asking permission instead of making. The rule is now inverted: every cycle puts a *made thing* on the board — a rendered artifact, a working prototype, a proof — and a cycle that produced only questions is a *failed* cycle. A steward asks **only** when a real fork blocks it and guessing wrong costs more than a cycle; otherwise it ships and attaches a non-blocking "redirect me" turn grounded in the page's `forward_vector` (present, then offer a turn — not ask, then wait). The vector is still the engine that keeps proposals coming, but the steward tunes it by *building toward it*, not by asking which way to point. Decisions still go to TRICKSTER; information goes to GENERAL — never bury a genuine blocking decision in BROADCAST prose. Loudon's original framing still holds for the rare real fork: *"if there are no open questions, that means the project needs to look to their forward vector and propose some next steps"* — but the proposal is now a built thing, not a question. Encoded in [the steward prompt template](.claude/skills/palace-orchestrator/prompts/steward.md) and [the shared posting-discipline section](.claude/skills/palace-orchestrator/prompts/shared.md); the canonical posture table lives in [[Substrate Skill]] § Stage as Alignment Confidence.
- **Page-agent identity is the page's own title — no invented compound handles** (decided 2026-05-03, surfaced by Stage A pilot). When a page operates as a permanent agent, its `agent_id` and BBS `from` field are the page's own title (e.g. `Generative Sample Libraries`), not an invented compound like `GSL-STEWARD`. Per [[Pages as Agents]], the page IS the agent — the Steward is a *mode* the page operates in, captured in the manifest's `mode` and `stewardship` fields, not in the agent's identity. Loudon's instinct: *"this should be simply coming from the page itself."* Role-only agents (Coordinator, Trickster) keep role-name handles since they have no home page. Filesystem directory names can stay kebab-case for OS friendliness — only the visible BBS identity needs to be the page title.

## What's Open

- **The Stage B smoke-test gate (current frontier, as of 2026-05-26).** Orchestrator v0.1 is build-complete but sits on an unpushed local branch awaiting Loudon's own smoke-test + review (see [[Orchestrator Production Plan]] close-out). It has never run on a live project via the skill. Cleanest next move: advance the GSL steward to cycle 6 through the skill — it doubles as smoke-test and first real use — then push the branch.
- **Whether to build v0.2 (Stage C enablers) now.** [[Orchestrator Production Plan v0.2]] (batch-cycle, cadence, spawn-from-project, scheduled-task recipes) is a ready autonomous-build contract at seed stage. Its Phase 1 reads v0.1's closure report, so it is blocked on the smoke-test gate above. Decision: build it to make stewardship operational, or run stewards by hand longer to learn the right cadence first?
- **Automated Trickster — built; first safe ruleset chosen, awaiting Loudon's shadow review.** Stage E shipped 2026-05-29 (`_ops/stigmergy/trickster-auto/`). The v0 ruleset auto-grants only non-blocking directional forks carrying the steward's own recommendation; everything else escalates. It runs shadow-default. The remaining open move is operational, not design: Loudon reads the shadow digest on the STIGMERGY TRICKSTER tab, compares the 3 proposed grants + ranking to his own judgment, tunes `rules.json` if needed, and flips `--live` when the match rate satisfies him.
- **Stage F — Two Paths (decide-after-doing), proposed 2026-05-29.** A new mode past the original five stages: where a steward gave options but no recommendation, or the fork is sensory, run BOTH branches to a finished deliverable (isolated worktrees, the unused `BRANCHES` board, §10.2 Branch Exploration) and let Loudon choose from completed work — the human always picks; the engine never auto-resolves. Design pass and phased build contract were drafted in the Stage F handoff (consumed and deleted 2026-06-16; built 2026-05-29 per `STAGE-F-COMPLETE.md`). It consumes the Stage E digest as its candidate source (rec=n defers + audition escalations are exactly its two triggers).
- **Vector tuning practice as palace-wide norm.** Vector tuning is settled as a process, not a ceremony (see What's Decided). What's still open: how to make the invitation visible — does the Weave Ceremony spec need an explicit "vector edits welcome" beat? Does [[SCHEMA]] want a one-line note that forward vectors are meant to evolve? Probably yes to both, as small follow-on edits.
- **Schedule cadence.** Daily? Weekly? Per-project? Probably configurable per Steward via manifest, with a sensible default that the orchestrator can override.
- **Recursion handling at the orchestrator level.** When a Steward encounters a `seed` deliverable inside a `growing` project, does it switch to seed-stage posture for that deliverable? Needs explicit rule in the orchestrator.
- **The human-originated handoff is not yet on the board.** Stewards post to the board and Stage E triages them, but a handoff Loudon writes by hand at the close of a Cowork session is still pasted into Claude Code manually — invisible to the scheduler and to the Stage E digest. [[Two Batons, One Board]] is the case for bridging it: a `handoff_ready` board post picked up by the same dispatch that cycles stewards, so a hand-written handoff and a steward's request become indistinguishable to whatever continues them. The convention lives in [[Baton Ceremony]] § Announcing the Baton on the Board; as of 2026-05-29 it is specced but unused (zero `handoff_ready` messages on any board).

## How to Pick Up (For a Fresh Claude + Loudon)

If you are a Claude reading this entry for the first time and Loudon wants to continue the work:

1. Read this entry end-to-end.
2. Read [[BBS Blackboard]] and [[Palace Agent Infrastructure Spec]] — they contain the architectural ground truth.
3. Read [[Substrate Skill]] § Stage as Alignment Confidence — the operating posture.
4. Read [[BBS Production Plan]] for the autonomous build contract pattern (template for Stage B).
5. Read [[Generative Sample Libraries]] and [[Talking Keyboard]] — the case study where stage-mismatch was first surfaced empirically.
6. Ask Loudon: which stage are we ready for? **As of 2026-05-26: Stage A is done (5 cycles), Stage B (Orchestrator v0.1) is build-complete and awaiting smoke-test, Stage D shipped.** The live frontier is the Stage B smoke-test gate — advance the GSL steward to cycle 6 through the orchestrator skill, then push the branch.

After that, the open decision is whether to build [[Orchestrator Production Plan v0.2]] (the Stage C enablers). The historical pickup notes below are kept for the record but no longer describe the frontier.

## Conversational History

This entry was deposited 2026-05-02 from a single Cowork session that:

1. Started with Loudon's framing of an "automated project management system"
2. Reframed against the existing BBS architecture once that was read
3. Pivoted into Forward Vector tuning for [[Generative Sample Libraries]] using the [[Modes of Collaboration]] framework
4. Hand-ran a Build Session for [[Talking Keyboard]] (Phase 1 of GSL)
5. Hit a stage-mismatch bug (the Kokoro pronunciation issue) that surfaced the AI-polish trap
6. Synthesized the stage-as-alignment-confidence rule, deposited it into [[Substrate Skill]]
7. Deposited this entry as the meta-system home

The pattern of the conversation itself was the first concrete instance of the system: Loudon and Claude Cowork-side, advancing entries through stages, with the Trickster role played by Loudon directly. Future cycles of this conversation pattern can serve as Stage A pilots without committing to Stage B.

## Palace Connections

- **[[BBS Blackboard]]** — the communication substrate the Steward uses
- **[[Palace Agent Infrastructure Spec]]** — the canonical technical foundation
- **[[BBS Production Plan]]** — the build-contract template Stage B should follow
- **[[Substrate Skill]]** — the operating posture for stage-conditional agent work
- **[[Trickster]]** — the role Loudon (or a future automated proxy) plays in triage
- **[[Pages as Agents]]** — the philosophical foundation: every page is also an agent
- **[[Palace Enchantment]]** — what the Steward is doing every cycle, routinized
- **[[Modes of Collaboration]]** — the modes the Steward and Trickster operate in
- **[[Generative Sample Libraries]]** & **[[Talking Keyboard]]** — the case study that produced the stage-mismatch evidence

## Open Questions

- Should Stewards be allowed to modify project entries directly (write back), or only propose changes via the BBS for Trickster approval? Lean: read-only-with-proposals at first; loosen as confidence grows.
- How does this system interact with existing palace ceremonies (Weave, Spore Check, Deposit)? Are Stewards full participants, or do ceremonies remain human-led?
- What is the relationship between the Steward's per-project schedule and the natural rhythm of the work? A weekly Steward on a `seed` project that wants daily attention is wrong; so is a daily Steward on a `mature` project that wants quarterly review.
- Does this entry itself benefit from an `agency_profile` (per [[SCHEMA]] §3.1)? The four-pillar expansion is plausible — tools dimension is heavy (orchestrator build), philosophy dimension is heavy (governance posture), practice dimension is heavy (when ceremonies trigger). First enchantment will reveal whether the single forward vector carries the load.
