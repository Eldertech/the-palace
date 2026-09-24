---
title: "Weave 2026-09-24 — PLAN"
born: 2026-09-23
links:
  - target: "[[Weave Ceremony]]"
    type: connects-to
    label: this-run
  - target: "[[Swarm Weave]]"
    type: connects-to
    label: architecture
forward_vector: "I am the plan for the September weave, written the night before, so the mind that runs it in the morning starts from understanding instead of rebuilding it. RESUME.md replaces me once the run starts; I'm done when the weave's commit lands."
---

# Weave 2026-09-24: the plan

Written 2026-09-23 by the elder session and reviewed the same night by an independent Fable reader, whose seven must-fixes are folded in. The contract is still [[Weave Ceremony]] (`_ops/Weave Ceremony.md`). This plan adds how *this* weave serves the palace's values more deeply. Where it departs from the contract, it says so (§ Departures).

**Inputs, kept beside this plan:**
- `carry-forward.md`: flags the linter hides, July holds, the composting ten, batons.
- `newcomers.md`: who the palace can't reach, preliminary.

## Why, and what for

It's been 79 days since the last weave (2026-07-06) on a monthly cadence, with 219 commits in between.

- **25 entries born since July are under the inbound target**, and **20 entries have no inbound link in the graph** (17 for the walk, 3 already composting), plus 5 `_ops/` files wearing entry frontmatter that nothing points to. Measured by the fixed script on a map with ceremonies woven in; see `newcomers.md`.
- **The flag inbox is larger than the linter reports.** It says 8 open. It misses real asks, and it counts a flag done when a file is merely touched.
- **Ten entries have been composting since July.** Their one cycle is up.
- **July's held list is waiting**, including about 20 missing contradictions.
- **The voice-drift linter has never run inside a weave.**

The goal is to leave **entries, agents and Loudon** more able to act. Entries should be reachable and honestly staged. Agents should get a board that tells the truth and a trail the next weave can follow. Loudon should get the signing, not the toil, and a palace that feels more alive, not just tidier. *Hilaritas is a change*, so Loudon's felt sense is read at the start and at the end.

## The six adjustments

1. **The Bridge lens.** Tool entries paired with thought entries, using [[The Lens]]'s reading contract.
2. **A walk for the newcomers and the unreachable.** This wakes [[Walk That Weaves]].
3. **A two-pile signing**, with sampling so that one yes is honest.
4. **The board tells the truth.** Payloads get read, trailers get written, touches get verified.
5. **Pheromone trails on the board.** Held findings become flags the next weave reads first. No schema change.
6. **Cross-cycle convergence.** Workers stay blind to July's held list. Anything they find again independently counts as confidence that has survived time.

## Budget

The June run parked on usage limits. Its write-back landed in pieces by 06-30, but the summary commit never did. So every phase here ends at a checkpoint on disk, written into `RESUME.md`.

| | Workers (Sonnet) | Rough tokens |
|---|---|---|
| **Core**: lifecycle walk (8) · folder (~7, now including `_ops/`) · community (~8) · bridge (10) | ~33 | ~2.8M |
| **Full**: + mirror (~6) · stratified oblique (12) | ~51 | ~4M+ |

These are extrapolated from July and June (June measured 58–62k tokens per single-entry worker), not measured. Check `/usage` before Phase 2.

**Recommendation: Core.** **Dispatch the lifecycle walk first.** If window 1 gets cut short, the weave's headline value has still landed.

**Dispatch** goes through the Workflow tool. Worker JSON lands in files rather than the coordinator's context, outputs are checked against a schema, and `resumeFromRunId` returns finished workers from cache. That needs Loudon to say *"use a workflow"* and to raise **Dynamic workflow size** in `/config`. The fallback is background `palace-reader` Sonnet agents in waves of about 8.

---

## Phase 0: Prep (no agents, ~45 min, can run tonight or first thing)

Everything here is tooling or reading. Nothing writes canon.

**0.1 Worktree.** Run `node _ops/worktree/new-worktree.mjs --name weave/2026-09-24 --profile docs` and work there. Main has 92 dirty paths (GSL steward work, not ours). Check the branch before and after every commit. **This session folder has to be in the worktree:** commit it on main first (explicit pathspec), or the worktree won't have the plan. **The board is the exception:** every post to `_ops/swarm/persistent/blackboard.jsonl` happens on main after the merge. Append-only JSONL files with diverging tails conflict on merge.

**0.2 Foundation.** Read [[ELDER]], then [[SCHEMA]], then [[SCHEMA — Reference]] (§3, §4, §8, §9, read at the pen), then the whole Step 0 set: [[ROSETTA]], [[SUBSTRATE]], [[README - The Palace Guide]]. Then the ceremony doc. Summon the Concierge at the open, visibly.

**0.3–0.4 Tools: BUILT 2026-09-23** (branch `weave-prep/2026-09-24-tools`, merged to main; tested on a scratch map). In the morning, just run them:

```bash
python3 _ops/swarm/build-map-2026-09-24.py                                   # today's map, into _ops/maps/
python3 _ops/swarm/new-entry-catchup.py --since-last-weave                   # report: newcomers, unreachable, _ops hygiene list
python3 _ops/swarm/new-entry-catchup.py --since-last-weave --json > targets.json
python3 _ops/swarm/new-entry-catchup.py --since-last-weave --block > new-entries-block.md   # the {{NEW_ENTRIES}} paste
python3 _ops/swarm/partition-palace.py --lens lifecycle --targets targets.json --out partitions/lifecycle.json
python3 _ops/swarm/partition-palace.py --lens folder --out partitions/folder.json
python3 _ops/swarm/partition-palace.py --lens community --demote-hubs 12 --out partitions/community.json
python3 _ops/swarm/partition-palace.py --lens bridge --out partitions/bridge.json
# Full only: --lens mirror / --lens stratified
python3 _ops/swarm/lint-weave-flags.py --board "<main>/_ops/swarm/persistent/blackboard.jsonl"   # from the worktree: read main's live board
```

What each change does, and why:
- **`build-map-2026-09-24.py`.** Takes `--date` (default today) and `--out-dir`. The retired `breakthrough` type is gone. **Ceremony cards are nodes** (Loudon, 2026-09-23: ceremonies should be woven), carrying `ops_card: true`. Result: 351 nodes, 34 of them ceremony cards, 0 error ghosts, 0 new link-direction errors.
- **`new-entry-catchup.py`.** Measures inbound only. The cohort is git-added *or* born since the last weave, *and* under target. It lists the unreachable, and lists unreachable `_ops/` files separately for **bundle-hygiene review**, since they're handoffs and logs wearing entry frontmatter. The `--block` paste says only "currently N inbound". `Coordinator Synthesis Template.md` is updated to match.
- **`lint-weave-flags.py`.** Uses the board's own rule: exact file name, source entries only. A trailer, decline or id mention resolves a flag. A touch is shown as **TOUCHED-UNVERIFIED** for a hand check. The older payload shape is readable. `--strict` previews a trailer-only rule; `--board PATH`. Tonight's count: 65 flags, 34 explicit, **22 touched-unverified, 9 open** (31 under `--strict`). The hidden Palace Enchantment flag is correctly open again.
- **`partition-palace.py`**, three new lenses:
  - **`lifecycle`**: rooms of 5 targets, community-coherent (the DSP family in one room, the philosophers in another). Each target carries 1-hop plus up to 12 2-hop candidates, and hubs are never walked through. That's 47–70 files in reach per room. **Workers read candidates' frontmatter only, and bodies only for targets.**
  - **`bridge`**: excludes resting entries and ceremony cards. By default it seats the whole smaller side: 10 rooms of 6+6, all 59 thought-side entries, 60 of 103 tool-side (the least-paired first). **No room contains an already-linked pair.**
  - **`stratified`**: ceilings proportional to community size; 0 relaxations.

**0.5 Baselines.** Run every Step 6.5 linter once and save the output to `baseline-linters.txt`. The closing run shows what this weave introduced.

**0.6 Inputs on disk:**
- `substrate-sweep.md`: the five git commands, one row per finding, with a proposed recover / discard / leave.
- `flag-inbox.md`: every open flag, read **from the board payload** and checked against its file, including the "touched, unverified" ones and everything in `carry-forward.md`. For each: act / route to the worker holding its source entry (Step 1c) / decline with reason.
- `composting.md`: the ten, each with its current inbound links and a proposed delete or revive.
- `newcomers.md`, regenerated by the fixed script, plus the 5 unreachable `_ops/` files for the bundle-hygiene decision (demote or link).
- `july-held.md`: July's held and unlanded items as a flat list. **Never shown to workers.**
- `partitions/*.json`.

**Checkpoint 0.** Write `RESUME.md`.

## Phase 1: Loudon at the open (~10 min)

1. **"How do you feel about the palace right now?"** Record the answer. It's the *before* reading.
2. Substrate sweep dispositions. The sweep stays read-only until he rules.
3. Flag dispositions, including the proposed declines.
4. Core or Full, and the Workflow go-ahead.

## Phase 2: The fan-out (workers propose, write nothing)

Use `_ops/swarm/Multi-Lens Worker Prompt Template.md`, filled per lens, with these changes:

- **Every prompt gets:** the newcomer and unreachable block ("currently N inbound"); **"a null is a valid answer; no quotas"**; and the flags routed to that worker's entries, as *"a deposit asked you to do X: confirm, refuse, or refine."*
- **An optional `deep_pattern` field** on relations and gems. It names which of the eight recurring patterns a find instances (*scope-what-is-yours · the-boundary-is-the-finding · constraint-enables · fill-vs-honor-the-gap · decouple-maker-from-critic · receptivity-is-authored · category-crosses-at-a-rate · show-vs-hide-the-seam*), or none, or a new one. This gathers the Deep-Structure lens's tags as a byproduct.
- **Lifecycle, the walk.** Read each target's full body, but only the frontmatter of the walk candidates (`--limit` about 40 lines). *"For each target, walk its neighbours outward along typed links. At each stop ask: would this entry's reader want to be sent to the target? If yes, propose an INBOUND link, placed in the neighbour's frontmatter, with type and direction per SCHEMA §4. For a target no one points to, propose link, merge, or compost. Also report whether each target's stage, vector and face still fit. Follow edges; don't survey."*
- **Bridge**, adopting [[The Lens]]'s contract (`The Lens.md:83-99`, `:146`). *"You hold tool-side and thought-side entries built in separate sessions, in separate vocabularies, by one mind. Look for a tool that re-derives a philosophy, or a philosophy that names what a tool does. For each find: quote the line from BOTH pages that carries it; name the shared structure in one sentence; run the fidelity test (swap in a different partner; if your reading doesn't change, the find is fake); score the spark 1–5; classify it as link, deposit, or none. Null is valid and expected in most pairings. Never propose merges."* The coordinator drops sparks of 3 or below unless another lens saw the same thing.
- **Folder.** Subdivide `(root)`. It's a pile, not a family.

**Order:** lifecycle (8 rooms) → folder (~7) → community (~8) → bridge (10), then mirror and stratified if running Full. Output goes to `workers/<lens>/<cluster>.json`.

**Checkpoint 2.** Record the workflow run ID and which clusters came back.

## Phase 3: Synthesis (the main session; reads JSON, never entry bodies)

Follow `_ops/swarm/Coordinator Synthesis Template.md`, plus:

- **Confidence, ranked:**
  1. cross-cycle (a match against `july-held.md`, surfaced blind)
  2. cross-lens (especially under different mandates)
  3. single-lens gems
  A link a worker proposed *and* the GNN predicted (`_ops/swarm/experiments/palace-gnn-2026-08-26/ghosts-clean.json`) gains a notch. The GNN never proposes on its own.
- **Conflicts get shown, not resolved.**
- **Hub emergence.** An entry pointed at by **three or more workers not assigned to it** ([[Swarm Weave]] § The Coordinator), or in the top decile for inbound. The ceremony's "≥5" was set when the palace had about 30 entries; the median is now 6. Self-Describing Knowledge Module is in by its flag.
- **Diff against July.** What July found, and what became of each: landed, held, or dropped.
- **The report** (`report.html`). Read `_ops/loudon-live/design-system/SKILL.md` first: Graphite skin, the Lissajous sigil, the `Loud'n Live` footer; no cyan, no emoji, no hype. **Newcomers get one card each: "who now points at you,"** with their avatars. That's the part of the weave most likely to make the palace feel more alive.
- **Before Loudon sees Pile B**, the Concierge (curator posture) reads it cold. For each item: is it already in the palace, and do its type and direction hold?

**Checkpoint 3.** `synthesis.md` and `report.html` saved.

## Phase 4: Loudon signs

**Pile A: one yes for the batch, sampled.** It holds only moves where the judgment was already made elsewhere:
- unsung paths
- walk-proposed inbound links that a second lens or the Concierge also backed
- flag actions from deposits Loudon already signed
- missing required fields, stub tags, roster rebuilds
- ghost-link typos
- linter E1 fixes
- `connects-to` labels the body already names

The ceremony asks for links, labels and metadata to be *presented*. A batch presented for one yes honours that; July did the same (`synthesis-report.md:144`). **So that the yes is honest:** Loudon reads ten items picked at random. If one is wrong, the pile goes back through the Concierge before anything is written.

**Pile B: needs his eye.** Each item is a permanent claim or a loss. Yield order when there's too much:
1. **The composting ten.** Fixed; *outside* any cap. SCHEMA §2 makes them this cycle's obligation.
2. Hub promotions and demotions; stage moves to or from dormant.
3. `contradicts`.
4. Retypes, including No Mind Checks Itself → Bring In a Bigger Mind.
5. Vector overhauls.
6. Synthesis-spawns, weighed against merges so sprawl stays flat or goes down.
7. Canon edits to the ceremony. Step 1c's "a touch retires a flag" against gotcha 19; the "≥5 typed links" hub bar. (*Ceremonies become nodes, decided by Loudon 2026-09-23; the ceremony doc and [[Swarm Weave]] should say so, as a Pile A doc edit.*)
8. Waking Walk That Weaves.

Past about 25 items after the composting block, everything from 3 down is ranked and the tail is **held**. Held items become trails (Phase 6), not a longer queue.

**At the end:** ask again, *"How do you feel about the palace now?"* Both answers go in the report.

**Checkpoint 4.** `decisions.json` (yes / no / held for each item).

## Phase 5: Writes (a new window if needed)

- **Mechanical (Pile A).** An applier modelled on June's `unsung_apply.py`, **with its root derived from `__file__`** (June's is hardcoded to main at line 10, and its dirty-file guard reads main's `git status`). Run `--dry-run` first and review the diff.
- **Composting.** For each deletion, the applier repoints or cuts every inbound link, as an explicit step, then deletes. Each revive gets a stage and a sentence of why.
- **Authorship (folds, merges, prose, stale open questions).** Write-agents, one per disjoint file set. They never commit and return drafts. The coordinator reviews every draft, and the Concierge checks placement after writing.
- **Direction.** Read every directed link aloud as `source → type → target` before writing it. If it's contestable, use `connects-to` with a label.

## Phase 6: Agents and humans

- **Flags.** Each closed flag carries `Palace-Resolves: <id>` (gotcha 19). Each declined one gets `Declined flag <id>: <reason>` in the commit body. **Gate:** the fixed `lint-weave-flags.py` exits 0, run *before* any trail is posted.
- **Memory.** The Step 6b sweep (not part of the palace commit).
- **To-Do.** Walk `_ops/Palace To-Do.md`: act, reprioritise, or release, and note each release.
- **Faces.** `face-audit.py` produces the add and retire lists, plus the Found ↔ Made debt. RunPod costs money, so this is **its own yes**: one frame first, then park the endpoint.
- **Offer, don't do:** deleting `REMAINING-DEPOSITS-handoff.md`; correcting `findings.md:146`.

## Phase 7: Close

1. Rebuild the map. Run every Step 6.5 linter and diff against the baseline. No new E1 or E2 errors. Pre-existing errors are named in the commit body.
2. Finalise `report.html`.
3. Commit in the worktree with explicit pathspecs: `Weave — 2026-09-24 — [N links added, N entries promoted, N orphans flagged, N vectors tuned, N flags closed, N orphans recovered/discarded, N faces added/retired]`. The body carries dispositions, declines and trailers. Merge to main.
4. **On main, after the merge, post to the board:**
   - **Pheromone trails.** Held Pile B items and strong single sightings, as `weave_flag`s carrying lens, spark and `expires_after: 2 weaves`. The expiry is *advisory*; nothing reads it yet. Teaching the linter to honour it is next weave's job. It's the staleness guard the May A/B experiment asked for (`findings.md:136-158`), and it keeps trails from crowding out lateral search ([[Pheromone Trail]]).
   - The `demote-bundle` baton.

   These are deliberately open, and the commit body says so.
5. **Close well.** The Concierge becomes the moderator.

---

## Departures from the contract, named

- **All Core lenses fan out together.** The template says one pass at a time, presented between passes (`Multi-Lens Worker Prompt Template.md:140`). The cross-lens and cross-cycle signals need every pass in hand, and a single signing sitting spares Loudon four.
- **Hub emergence** uses the worker-convergence signal, not "≥5 typed links".
- **Faces render after the commit, on their own yes.**
- **Not this weave:** a `worker_trace` frontmatter field. A new multi-entry field needs a Schema Ceremony (`SCHEMA — Reference.md:94`). If entry-resident memory is wanted later, the no-ceremony route is a `trace` bundle file, as [[The Remembering Page]] does. Offer it to Loudon as a question.

## What this plan couldn't verify

- The token estimates.
- The side sizes for the Bridge lens.
- Whether the Workflow size limit can be raised on this account.
- The unchecked September flags.
- Whether `newcomers.md` matches the fixed script. It was counted by a different method, on purpose, so that a disagreement shows up.
