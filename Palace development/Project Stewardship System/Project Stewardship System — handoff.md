---
title: "Project Stewardship System — handoff"
born: 2026-05-27
links:
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: handoff-for
forward_vector: "I carry the in-progress move on stewardship across the Cowork → Claude Code boundary. I am a steward-genre handoff: updated in place, not consumed on pickup."
session_thread: "Cowork stewardship session, 2026-05-27"
---

# Handoff: Project Stewardship System  (Cowork → Claude Code)

## Move
Operationalize stewardship — turn the just-deposited [[Drift and Consolidation]] design into steward *behavior*, clear the two live blocking auditions, and decide the scheduling/automation frontier — picking up in Claude Code where the Cowork session left off.

## Why this move matters
The system is live and proven: two stewards (GSL, GWL) have run real cycles, made decisions, and built audio. What's left is mostly *implementing decisions already made* plus *human audition*. The reason for crossing surfaces: Cowork's git locks made every commit a fight; Claude Code commits/pushes cleanly and can invoke the orchestrator skill natively.

## Current state (true right now)
- Two enchanted stewards in `_ops/agents/permanent/`: `generative-sample-libraries` (GSL — cycle 8, growing) and `generative-wavetable-libraries` (GWL — cycle 3, growing). `REGISTRY.json` lists both at the correct path.
- **Both are PARKED on a blocking audition** awaiting Loudon's ears:
  - GWL `gwl-steward-006` — the Crystal Bravais wavetable at `Projects/Generative Wavetable Libraries/crystal-bravais/crystal_bravais_ableton.wav` (accept / tweak-model / try-carry-phase; recommends accept).
  - GSL `gsl-steward-012` — the 8-file Crystal instrument at `Projects/Generative Sample Libraries/crystal-instrument/` (APPROVE / ADJUST / REJECT; recommends approve).
- Orchestrator v0.1 complete; the `cli.js` encoded-path bug is fixed (`fileURLToPath`) — this repaired both `REGISTRY.json` location and `check-page` change-detection. Thin Stage C built: `_ops/stigmergy/orchestrator/src/batch-plan.js` + `.claude/skills/palace-orchestrator/batch.md`. 93 orchestrator unit tests + 239 STIGMERGY app tests green.
- BBS: `/api/open` clickable-files endpoint built (`server/middleware.js`) + `open:` scheme in the renderer (`format.js` `hrefFor`); the steward prompt teaches it.
- Knowledge consolidated this session: [[Project Stewardship System]] refreshed to real state; [[Drift and Consolidation]] deposited (D-CW-02); GSL + GWL carry "## Under Active Stewardship" disclosure footers.
- **4 commits on `main`, LOCAL ONLY (not pushed):** `970a0b6`, `8dbd6c6`, `b18e23d`, `1b5d2e3`. This handoff + its entry pointer are uncommitted. Unrelated in-flight changes (Kuramoto WAVs, `server.py`, standards docs) are also uncommitted — leave those for Loudon.

## Next move (do first)
1. **Commit this handoff + the Active Handoff pointer, then `git push`** the four local commits (Cowork could not push).
2. **Answer the two auditions** (Loudon listens — `npm run dev` in `_ops/stigmergy/app`, open localhost:5173, or play the WAVs directly). On accept/approve:
   - GWL cycle 4 → the CLM/Serum binary writer, **gated on a known-good reference Serum WAV existing on the Mac** (the steward is holding on this).
   - GSL cycle 9 → render the full keyboard batch + promote the Interview skill out of draft.

## Then (deferred implementation — decisions made, code not yet written)
- `steward.md` / `permanent.md`: add the drift beat from [[Drift and Consolidation]] — continuously track drift; at milestones *recommend* the consolidating page edits; place the "Under Active Stewardship" footer at enchant and prune it at consolidation.
- Decide + create the weekly batch scheduled task (staged prompt: `_ops/stigmergy/orchestrator/scheduled-weekly-batch.prompt.md`).
- Optional: migrate the older `_ops/sample-libraries/` builds (talking-keyboard, phoneme-choir, electronic-hihat) into project bundles (convention is set).
- A Weave to fold the consolidation beat into [[Project Stewardship System]] + [[Substrate Skill]].

## Tried and rejected (negative space — don't re-explore)
- **v0.2 orchestrator** (cadence enums / digest writer / retire-pause-resume lifecycle): deliberately NOT built. Loudon chose the thin Stage C (a loop + cron) over the apparatus. Don't resurrect v0.2 without a felt need.
- **Auto-spawning the whole folder**: rejected. "Enchant one project at a time" is a deliberate manual act; batch only loops what's already enchanted.
- **`file://` links** for openable files: rejected (Chrome blocks them) — hence `/api/open`.
- **Zero-drift entries** (entry mirrors the log): rejected. The entry is the slow considered layer; bounded, *disclosed* drift is the design (that's the whole point of [[Drift and Consolidation]]).

## Receiving environment (Cowork → Claude Code)
Picking this up in Claude Code on Loudon's Mac. Capability delta vs. the Cowork session that wrote this:
- **git works normally** — no `.git/*.lock` fight. The Cowork "mv the lock aside" workaround does NOT apply; just commit/push. (Main reason for the handoff.)
- **The orchestrator is a Claude Code skill** at `.claude/skills/palace-orchestrator/` — invoke it natively ("advance the GWL steward", "run my steward batch") instead of hand-executing the workflow as Cowork had to.
- **Tests run normally** — `npm test` in `_ops/stigmergy/orchestrator` and `_ops/stigmergy/app`. The `@rollup/rollup-linux-arm64-gnu` install was a Cowork-sandbox-only fix; on the Mac npm resolves the darwin binary.
- **STIGMERGY runs for real** — `npm run dev` → localhost:5173 → clicking an `open:` link actually opens the file; the two auditions can be heard.
See [[Surfaces and Capabilities]].

## Calibrations from this session
- Stewards **propose, never write the page unattended** — except a milestone deposit-back (GSL cycle 5 is the precedent).
- Build artifacts live in the project's bundle (`Projects/<Project>/…`), heavy renders gitignored; agent runtime state stays in `_ops/`.
- A steward message's id goes in `id`; a RESOURCE_REQUEST repeats it in top-level `request_id`. The subagent sometimes omits `id` (prompt now warns; watch for it).
- Append BBS messages in order — the first message of a session must be the SPINNING UP broadcast (the §2.2 validator enforces it).
- `_ops/scratch/` holds relocated junk Cowork couldn't delete (gitignored) — ignore it.

## Load these files first
1. [[Project Stewardship System]] — the umbrella (now current).
2. [[Drift and Consolidation]] — the just-deposited design the next moves implement.
3. `_ops/agents/permanent/generative-sample-libraries/state.json` and `_ops/agents/permanent/generative-wavetable-libraries/state.json` — the two stewards' live state (pending auditions, batons, drift notes).
4. `.claude/skills/palace-orchestrator/SKILL.md` (+ `permanent.md`, `batch.md`) — the orchestrator workflow.
5. `_ops/swarm/persistent/blackboard.jsonl` — the live BBS log.

## Resumption protocol (incoming Claude)
1. Read this handoff, then [[Project Stewardship System]] and [[Drift and Consolidation]].
2. State the move back in one sentence; if you can't, ask Loudon rather than improvising.
3. Confirm the receiving-environment deltas hold (git push works; skill invokes).
4. **Do NOT archive this handoff** — it is the steward genre, updated in place. Update its "Current state" / "Next move" as the work advances.
5. Then act: commit+push, then the two auditions.
