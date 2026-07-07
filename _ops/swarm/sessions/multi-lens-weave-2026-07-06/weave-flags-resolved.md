# Weave-flag resolution ledger — 2026-07-06 full-send weave-apply

The append-only board never deletes flags; the STIGMERGY queue-model greys a
`weave_flag` only when a commit carries `Palace-Resolves: <id>` (or a commit
touches its *source* entry after posting). The full-send weave-apply this session
applied/closed the flags below but the commits carried no such trailer — so the
board kept showing them open. This commit's `Palace-Resolves:` trailers retire the
35 genuinely-resolved flags (advisory grey — Loudon confirms the clear); the 11
deferred flags are deliberately left open.

## Resolved (35) — greyed by this commit's trailers

**COORDINATOR 2026-06-16 (8):** type-drift (0 `type: theme` entries) · haiku-sweep (live templates cut) · stewardship-handoffs (none present) · baton-maturity (Baton Ceremony already `stage: mature`) · orientation (informational) · rescued-canon (People/ migration done) · theme-ghosts (0 named ghosts) · artifacts-refs (1 repoint + 7 SCHEMA §8 realignments).

**Radio Play gotchas 2026-06-19 (4):** kokoro · ffmpeg · manim · sa3 — recipes landed at the 2026-06-19 deposit (body-mention present).

**Steer 2026-06-23 (1):** steer-backlinks (BLUELINE already links Steer the Generator).

**Frame Designer 2026-06-22 (3):** designer-split, sub-foremen, stage-realization — resolved by convention (Frame Designer declares its Maker/Shop/BLUELINE edges; the hub computes inbound, roster not hand-listed).

**The Multilinear Self 2026-07-02 (3):** →Trickster (applied couples-with) · →Hyperdimensional Prism (applied mirrors) · →Autodidact Polymaths (directed `deepens`; no reverse edge by schema).

**The Remembering Page 2026-07-03 (5):** →Pages as Agents (directed, no reverse) · →Pheromone Trail (applied couples-with) · →Threshold Conatus (directed, no reverse) · →Modes of Collaboration (The Shared Walk mode named) · →Making a Palace Citizen (applied spawned reciprocal).

**The Palace Practices on Itself 2026-07-03 (2):** →The Commons (applied worked-instance backrefs ×3) · productive_tension (Loudon chose to leave in-body — decided).

**The Aftermath Frame 2026-07-03 (3):** →Flow Field is the Spine (applied spawned) · →Graphic Storytelling (directed exemplifies, no reverse) · →BLUELINE (applied connects-to).

**The Palace Speaks / Skills 2026-07-04 (5):** →Agent Wellbeing (second register) · →Palace as Context Injection (contradicts) · →Closing Well (agency_profile) · →Pages as Agents / Skills (directed, no reverse) · →Concierge (rewind fold).

**Swarm Weave 2026-07-05 (1):** doc-drift (done by 9910360).

## Left OPEN (11) — deliberately not resolved

- **memory-recon** (item 11 — only partly exercised; folds into a close).
- **Radio Play** — none (all 4 resolved above).
- **cowork_litter_sweep** (11be93de) — not touched this session; not mine.
- **Shop/BLUELINE shelf:** Board Record schema field (12400dd0) · Taste Breeder specialist (steer-taste-breeder) · Hand-Drawn ×3 · Block It ×2 — one focused session.
- **Palace Enchantment** cross-ref (e4538455) — deferred content fold.
- **toolbox recursion** (634a2386) — deferred dev.

**Gotcha for [[Closing Well — gotchas]]:** a weave-apply that doesn't carry
`Palace-Resolves:` trailers (or touch the flag's *source* entry) leaves the board
showing resolved flags as open — the graph is fixed but the board never hears. Emit
the trailer per flag, or the next session re-triages done work.
