# Stage E — Automated Trickster — BUILD COMPLETE

Built 2026-05-29 from [[Stage E — Automated Trickster — handoff]] as an
autonomous build contract. All six phases (0–5) shipped and self-verified; the
STIGMERGY digest view (Q2) shipped and is e2e-verified. Default mode is
**shadow** — write authority is Loudon's to enable.

## The move

A deterministic rules engine that triages the BBS TRICKSTER inbox so routine
decisions clear without Loudon and only novel/high-stakes ones reach him — as one
ranked digest, never a flood. The consolidation layer [[Palace Conatus]] called
for: the palace's aggregated self-advocacy was out-running its human's bandwidth.

## What shipped

| Phase | Deliverable | Verify gate | Status |
|---|---|---|---|
| 0 | Probe + coalescing parser + fixtures | parser reads every pending request on the live board | ✅ |
| 1 | `rules.json` + hard audition gate + pure `evaluate()` | auto-grant / auto-deny / escalate / unmatched→escalate / audition-always-escalates / budget-exhausted→escalate | ✅ |
| 2 | Digest writer (ranked by Palace Conatus disharmony) | deterministic render from a fixture; ranking stable | ✅ |
| 3 | Gated write path (`--shadow` default, `--live` opt-in) | round-trip: §2.2-valid grant, correct `re`, `decided_by:auto`, STIGMERGY treats as answered | ✅ |
| 4 | Daily auto-grant budget | flip at threshold; clean daily reset | ✅ |
| 5 | Standalone CLI + post-batch pairing + skill doc | dry-run documented in the skill | ✅ |
| Q2 | STIGMERGY `DigestPanel` on the TRICKSTER tab | 13 e2e specs pass incl. boot-no-console-errors | ✅ |

**Tests:** 71 (trickster-auto) · 339 (app, was 332 — +7, no regression) · 130
(orchestrator, untouched).

## Decisions made this session

- **Q1 (Loudon delegated → decided here):** v0 auto-grants only **non-blocking
  directional forks carrying the steward's own recommendation**; everything
  blocking, every audition, every irreversible action, every unmatched resource
  escalates. The strawman's "advances forward_vector + cost threshold" was
  translated to the deterministic proxies the engine can actually check
  (non-blocking + has recommendation + within budget) — because Stage E is a
  rules engine, not a reasoner. Rationale: shadow posts nothing, so auto-grant
  rules are zero-risk until `--live`, and they are the only thing that produces a
  match-rate signal worth reviewing; a digest-only ruleset would make every
  shadow proposal "escalate" and teach nothing.
- **Q2:** digest renders as a STIGMERGY view (`DigestPanel`), fed by
  `digest-latest.json` via the existing `/api/file` route — no new endpoint.
- **Q4:** both — standalone CLI and auto-invoked (shadow) after the weekly batch.

## Ground truth from Phase 0 (probed, not assumed)

- No `DIRECTIVE_REQUEST` type exists; directional decisions ride as
  `RESOURCE_REQUEST` with `resource: "directional_decision"` (answers Q5).
- `request_id` and `re` are always top-level (Gap 9 resolved toward the §2.5
  split; the orchestrator already enforces it).
- `resource`, `blocking`, and `options` each vary top-level vs payload — the
  parser coalesces all three. Option shapes: object `{id,label[,next]}` and
  lenient string (id derived from the leading token).
- All 6 audition-flavoured requests carry a `resource` containing "audition" and
  are `blocking:true`. Zero irreversible/destructive requests on the board — that
  half of the gate is present but dormant.
- Live inbox at build time: 16 pending → shadow split **3 auto-grant / 13
  escalate** (3 grants are genuine non-sensory design/roadmap/sequencing forks;
  the mislabeled-audition cases like apo-004 "sensory deliverable that needs a
  gate" correctly escalate).

## The non-negotiable, honored

The audition/irreversible gate is hard-coded (`src/audition-gate.js`), runs
before any rule, and cannot be overridden by editing `rules.json`. A live
round-trip on a throwaway copy of the real board posted 3 directional grants and
**zero auditions**.

## What Loudon does next

1. Run `node src/cli.js` (shadow) and read the digest on the STIGMERGY TRICKSTER
   tab. Compare its 3 proposed grants + ranking to what he'd have decided.
2. Tune `rules.json` if the split is wrong (it's editable, no deploy).
3. When the shadow match rate satisfies him, run `--live` (optionally `--budget
   N`) to let it post. The weekly batch stays shadow until he flips it.

## Not built, on purpose (thin path)

- No v0.2 cadence/lifecycle apparatus; no registered cron. The weekly task stays
  staged-not-created, same as the orchestrator's.
- No auto-deny of within-budget external reach (dormant rule only).
- The engine never reasons about a request's prose — it ratifies or escalates.
