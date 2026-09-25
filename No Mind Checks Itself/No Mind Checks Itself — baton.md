---
title: "No Mind Checks Itself — baton"
born: 2026-09-25
links:
  - target: "[[No Mind Checks Itself]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[No Mind Checks Itself]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

## Move

Re-check, cold, all of the Enrichment 2.x rework done 2026-09-23 → 25 — every commit, board post and
live surface below — and report each item PASS or FAIL with its evidence.

## Why

The rework replaced a palace ceremony end to end: the Enrichment card queue, its headless worker, its
critic and STIGMERGY's actuator lane are gone; the **rich face** (`/rich/?entry=<Entry>`) and
Enrichment 2.1 replace them. It touched canon, STIGMERGY's server and front end, SCHEMA's bundle
vocabulary, the Closing Well executor, and the board. It was done in one long session that ran across
a rate-limit night, by an instance that also judged its own work — which is the thing [[No Mind Checks
Itself]] says not to trust. Loudon asked for a thorough, fresh check because this is palace operations.
You are that check. Be skeptical; name disagreements plainly; don't smooth anything over.

## Current state

Everything is on the owner's `main`. The work, oldest first (`git show --stat <hash>` for each):

| hash | what |
|---|---|
| `0b3195bc` | `_ops/rich-face/` (renderer, handler, parser, fingerprint tool); STIGMERGY mounts it at `/rich/`; the card queue removed from STIGMERGY |
| `70be6952` | Enrichment 2.0 — the ceremony rewritten; card queue, validator, supervisor prompt, Enrichment baton deleted; Oblique Enrichment composting; ~15 canon references updated |
| `033e1774` | Kuramoto Coupling's rich face: 4 made pieces + `Kuramoto Coupling — rich.json`; door line; the stubbornness paragraph |
| `69da9635` | STIGMERGY's actuator lane retired (`/api/worker/fire` ran `claude -p` on any prompt); leftovers swept |
| `d1e8c7d5` | the Concierge's after-write fixes (opening read, overclaims, link types) |
| `94fc61aa` | the live-board validator test honours the board's own RETRACTs |
| `001e41c8` | the legacy `enrichment_card` message tag retired |
| `754f329f` → `14453461` | the stubbornness paragraph cut, then restored after Loudon read it |
| `9b76e3ae` | the Round-1 Kuramoto handoff retired |
| `e0eebfa9`, `a561e6fd`, `494901a1` | three batons: Enrichment (review notes → work), Kuramoto (sort inline media), Language as a Tonal Medium (build its rich face) |
| `3c2cf2ff` | Closing Well tuning, item 12b annotated |
| `d4ac41f3` | Enrichment 2.1 — Loudon's placement rule; step 6 split by size |
| `ce4eb6ab` | Closing Well 1.1 — the "prepared row" path; tuning item 30 |
| `bbcea429` | `_ops/rich-face/check-kuramoto-pieces.mjs` — the headless physics check |

On the board: three `handoff_ready` (`enrichment-handoff-2026-09-25`, `kuramoto-coupling-handoff-2026-09-25`,
`language-as-a-tonal-medium-handoff-2026-09-25`) and two WEAVE flags (`commons-the-palace-1790345897392`
→ Drift and Consolidation, `commons-the-palace-1790345904679` → The Scroll).

## Tried & rejected

Nothing to reject — this is the first independent check. The author's own checks (listed in the
commits' bodies) are claims for you to re-run, not results to trust.

## Next move — the checklist

Report every numbered item as **PASS** or **FAIL**, with the command output or `file:line` you saw.

**A · Machine checks** (from your worktree unless noted; expected result after the arrow)

1. `cd _ops/stigmergy/app && npx vitest run` → every test file passes (132 files / 1,730 tests when written; more is fine, any failure is not).
2. `npx vite build --outDir /tmp/<you>/stig-dist --emptyOutDir` → builds. Build outside the repo.
3. `npx vitest run tests/integration/rich-middleware.test.js` → 9/9 (routes, byte ranges, traversal refused, `/richer` not owned).
4. From the palace root: `node _ops/rich-face/check-kuramoto-pieces.mjs` → 13 PASS, "all claims hold". It runs each piece's own worklet code.
5. `node _ops/rich-face/fingerprint.mjs "Kuramoto Coupling"` → four sections "in step", no "lost" line.
6. From the palace root, each of `python3 _ops/swarm/lint-doc-drift.py`, `lint-ghost-links.py`, `lint-bundle-hygiene.py`, `lint-entry-naming.py`, `lint-link-directions.py` → **0 errors**. Warnings existed before; if one looks new, compare against `git worktree add /tmp/<you>/base c6839973` (the pre-work base).
7. `node _ops/stigmergy/list-handoffs.mjs` → the three batons above OPEN, plus this one.
8. Nothing still points at what was removed:
   `grep -rn -e "api/cards" -e "card-validator" -e "supervisor-prompt" -e "enrichment_card" -e "ActuatorPanel" -e "api/worker" --include=*.md --include=*.js --include=*.jsx --include=*.mjs . | grep -v -e node_modules -e "swarm/persistent" -e "/Archive/"`
   → only lines that describe the retirement (commit-history notes, the phase-list comment in `check-phase.js`). Anything that still *uses* them is a FAIL.

**B · Live checks** (against the owner's STIGMERGY on :5173 — start it with the `stigmergy` launch config if it isn't running)

9. Open `http://localhost:5173/rich/?entry=Kuramoto%20Coupling` → it renders; the browser console is clean; the header ledger reads "10 carried by the text · 2 gathered · 4 made"; no `◐` mark anywhere; the door line ("Also as a rich face") does **not** appear on the rich face.
10. Each of the three interactives (waveform locking, ensemble, stubbornness) starts on a click, and starting one silences any other that is playing.
11. `curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'Content-Type: application/json' -d '{"prompt":"x"}' http://localhost:5173/api/worker/fire` → `404`. The QUEUE deck (`/?deck=QUEUE`) shows no "enrichment cards" section and no actuator panel.
12. **Drift, on a scratch copy — never on the real entry.** `_ops/scratch/` is git-ignored:
    ```bash
    cp "Kuramoto Coupling.md" "_ops/scratch/Rich Check.md"
    mkdir -p "_ops/scratch/Rich Check"
    cp "Kuramoto Coupling/Kuramoto Coupling — rich.json" "_ops/scratch/Rich Check/Rich Check — rich.json"
    ```
    Open `/rich/?entry=Rich%20Check` → same page, no marks. Then, in `_ops/scratch/Rich Check.md`:
    - reword one sentence under `## In Our Instruments` → within ~3 s, without reloading, the ensemble piece shows "◐ made against an earlier version of this section" and the section header "may lag the text";
    - `node _ops/rich-face/fingerprint.mjs "Rich Check" --stamp "In Our Instruments"` → the mark clears within ~3 s;
    - rename `## Asymmetric Coupling: The Stubbornness Parameter` to `## Asymmetric Coupling` → a "shape changed" banner; re-lay → the stubbornness piece sits under "Lost its place" and says "probably a rename";
    - clean up: `rm -rf "_ops/scratch/Rich Check.md" "_ops/scratch/Rich Check"`.
13. The review dock: type a note in one section's ◇ → it turns ◆ and the dock counts it. **Do not press Send** — it posts a `human_eval` from TRICKSTER, which is Loudon's voice on the live board. Clear the note.

**C · Read-through** (the part only judgment can do). For each file, read its diff (`git show <hash> -- "<file>"`) and check four things: it states what *is*, not what was; it doesn't overclaim (e.g. nothing may say review notes are read or acted on — they aren't yet); its typed links fit SCHEMA §4 (types and direction); it reads in the palace voice (CLAUDE.md § The Palace Voice).

14. `Enrichment.md` (the whole card: steps 0–7, drift, postcondition, links) and `Enrichment/Enrichment — tuning.md` (items 1–5).
15. `Kuramoto Coupling.md` (door line under the hero; the "Stubbornness sets the destination" paragraph) and `Kuramoto Coupling/Kuramoto Coupling — rich.json` (captions true to the pieces; `made_against` stamps).
16. The mirrors: `CLAUDE.md` trigger row for Enrichment, `ROSETTA.md` Enrichment row, `_ops/Palace Ceremonies.md` Enrichment row, `SCHEMA — Reference.md` §8 (`enrichment` and `rich` rows), `SCHEMA — Context.md` (bundle-type additions paragraph), `SUBSTRATE.md`, `STIGMERGY.md` (Rich faces section), `_ops/Substrate Skill.md`.
17. The references: `Review Layer.md`, `Entry Conatus.md`, `Modes of Collaboration/Philosopher Visits the Entry.md`, `Projects/Semantic Webcam.md` (a live steward reads its forward vector — was only the retired-server clause removed?), `Shop/Hero and Avatar Maker.md`, `Palace development/Swarm Weave.md`, `_ops/loudon-live/design-system/ui_kits/review-layer/README.md`, `_ops/stigmergy/design-system/README.md`, `_ops/orchestrator/prompts/shared.md` (the steward example).
18. `Oblique Enrichment.md` — `stage: composting` and the `<!-- COMPOSTING … -->` note name where its nutrients went; `Language as a Tonal Medium/Language as a Tonal Medium — sketch — rich-face-plan.md`.
19. Closing Well: `Closing Well.md` (version 1.1), `Closing Well/Closing Well — tuning.md` (item 30, the 12b note), `_ops/closing-well/executor.md` § keep → deposit ("One path between the two"), `_ops/closing-well/dispatch.md` Pass 3 relay.

**D · Code review**

20. `_ops/rich-face/rich-handler.mjs`: path traversal refused (`inside()`); the standalone server binds 127.0.0.1; `/rich/<path>` serves any palace file — confirm that's no wider than STIGMERGY's existing `/api/file`; the review message validates (`health.model: loudon-trickster`).
21. `_ops/rich-face/parse.js` (figure rules, the door rule, the fingerprint), `rich.html` (drift, lost zone, one-voice-at-a-time), `_ops/stigmergy/app/server/api/rich.js` (the mount).
22. The STIGMERGY diffs in `0b3195bc`, `69da9635`, `001e41c8`: dead code left behind, a broken import, a test that now asserts nothing.

## Deliberate — don't "fix" these without Loudon

- `tests/e2e/rich-content-roundtrip.spec.js` was **not run** and must not be run on the owner: it rewrites the shared board file and restores it, which can erase another agent's post.
- The **sound** is unverified — no agent can hear it. That is Loudon's listen. The Kuramoto commit is `Palace-Verify: unverified` for that reason.
- Kuramoto's text still embeds its media; sorting it is its own baton (`kuramoto-coupling-handoff-2026-09-25`).
- Review notes are not consumed yet; that is the Enrichment baton.
- `enrich(` now prefixes both hero/icon commits and rich faces — raised, not decided.
- Oblique Enrichment stays until the next Weave confirms deletion.
- Cards 041–043 were let go by Loudon; they're recoverable from `c6839973` if ever wanted.

## Calibrations

- Work in your own worktree: `node _ops/worktree/new-worktree.mjs --name recheck/enrichment --profile stigmergy` (the tests need `node_modules`). Live checks hit the owner's STIGMERGY, which serves `main`.
- **Fix only the mechanical** — a broken link, a wrong path, a typo — with explicit-path commits. Anything that changes what a canon page *says*: show Loudon first ([[Enrichment]] step 6; the [[Deposit Ceremony]] map for bigger changes).
- No edits under `_ops/stigmergy/app/server/*` while a steward run is live (`ps -axo command | grep "You are a permanent steward"`).
- Report to Loudon as one table: item, PASS/FAIL, evidence. Then close this baton: `node _ops/stigmergy/close-handoff.mjs <this id> --commit <your last hash>` (`--partial` if something is left).

## Load these files first

`Enrichment.md` · `_ops/rich-face/README.md` · this baton · [[No Mind Checks Itself]] (why a fresh check) · `SCHEMA — Reference.md` §4 and §8.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
A pickup has two beats: **claim** it when you catch it, **close** it when the move lands. The card stays visible in between — a claim that ages with no close is how a dropped baton (a "fumble") surfaces instead of vanishing. (A parent-entry baton that was never announced on the board has no card; skip the board posts — just remove the pointer and delete the file at close, step 8.)

**Catch it — claim:**
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it may already be done before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. For a board-announced baton, `node _ops/stigmergy/pickup-handoff.mjs <id>` prints exactly this reconciliation view — every commit that touched the entry since the baton posted — and then claims the card, so run it and read the list *before* you continue. If the move is already done, superseded, or no longer wanted, STOP — do not claim it; surface to Loudon, and if it plainly landed already, close it as a reconciler (step 7). A stale baton followed silently produces drift. (The auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive step 8 relies on.
4. Claim it. For a board-announced baton (it shows in `list-handoffs`), the `pickup-handoff.mjs` from step 2 has already posted the claim (`handoff_picked_up`, `lifecycle: claim`) — the card moves to **CLAIMED (in flight)**; it does *not* leave the board. Leave the "Active Baton" pointer and the baton file in place for now — they come out at close, so a fumble mid-move never erases the work.
5. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above.

**Close it — when the move lands:**
7. Post the close. `node _ops/stigmergy/close-handoff.mjs <id | entry> --commit <hash>` retires the card — an explicit close is the *only* thing that clears it (done is never inferred). Cite the commit that landed the move: it makes the close a checkable claim, not a self-report. **Complete, or re-baton the rest:** if you finished the whole move, close plain; if you did only part, `--partial --remainder "<what's left>"` posts the leftover as a fresh `handoff_ready` so it reappears as open work. Never let "in the spirit of the original" quietly drop scope — a gap becomes a new baton, not silence.
8. Delete the baton file (git is its archive) and remove the "Active Baton" section from the parent entry. On a surface that can't delete (Cowork), remove the pointer and note "deletion pending." Steward batons are the exception — updated in place, never deleted or closed.
