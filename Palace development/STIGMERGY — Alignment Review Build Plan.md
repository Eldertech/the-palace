---
title: STIGMERGY — Alignment Review Build Plan
type: project
pillars:
  - tools
  - practice
born: 2026-06-03
last_activated: 2026-06-03
activation_count: 1
stage: seed
energy: high
forward_vector: >
  I am the executable contract that gives STIGMERGY an alignment-review layer
  over the Automated Trickster digest: a fast way for Loudon to mark each
  shadow decision agree / I'd-differ, a running match-rate broken down BY RULE,
  and a Copy-for-Claude export — so the shadow→live promotion decision is
  driven by accumulated evidence instead of vibe. I keep the move small:
  STIGMERGY gains a verdict-capture surface and a persistence file; the
  trickster-auto engine and §2.2 are untouched. A Claude Code session reading
  this file knows what to build, what to verify, when to retry, when to stop,
  and what to hand back. Loudon is absent during the run.
links:
  - target: "[[BBS Production Plan v0.3 — Rich Content]]"
    type: emerged-from
    label: build-contract-template
  - target: "[[STIGMERGY v1.0 — Palace Front-End]]"
    type: enables
    label: new-capability
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: comm-substrate
  - target: "[[BBS Design System]]"
    type: enables
    label: aesthetic-authority
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: closes-stage-e-loop
  - target: "[[Palace Conatus]]"
    type: connects-to
    label: earn-write-authority-rationale
  - target: "[[Trickster]]"
    type: connects-to
    label: the-role-being-promoted
---

# STIGMERGY — Alignment Review Build Plan

![[STIGMERGY — Alignment Review Build Plan — hero.png]]

The architecture is in [[BBS Blackboard]]. The visual language is in [[BBS Design System]] — STIGMERGY uses the BBS phosphor aesthetic, **not** Loudon Live (`CLAUDE.md § Artifact Aesthetic` carves this out). The build-contract pattern is [[BBS Production Plan v0.3 — Rich Content]] — match its shape: phased, each phase self-verifiable, stop-report on failure, Loudon absent during the run. The *why* is the heartbeat: the every-other-morning steward batch (`palace-heartbeat-steward-batch`) now runs the Automated Trickster in **shadow**, producing `digest-latest.json`. Shadow only proposes; write authority is earned by matching Loudon's own decisions ([[Palace Conatus]] — *the drive must never outrun the coupling*). Today that matching is eyeball-only and nothing accumulates. This build makes the matching **fast, recorded, and measurable**.

## The move

Add an **alignment-review layer** to STIGMERGY's existing `DigestPanel` (TRICKSTER tab): for every Trickster decision — the proposed auto-grants/denies *and* the escalations — Loudon can mark in one keystroke whether he agrees, and if not, what he'd have done. Verdicts persist to an append-only file. A header shows the running match-rate, broken down **per rule_id**, with a "promotion-ready" marker when a rule has cleared a threshold with zero disagreements. A Copy-for-Claude export dumps the disagreements so a tuning session can sharpen `rules.json`. That is the whole move.

## Why this hastens the alignment process

The shadow→live decision in Stage E is **per-rule**, not all-or-nothing (every digest item carries `rule_id`). The accelerants this build provides, in order of leverage:

1. **Per-rule match-rate.** "Rule `grant-nonblocking-recommended-fork` is 11/11 agree" is a promotion signal for *that rule alone*, while a noisier rule stays in shadow. This is the single fastest path to earned autonomy.
2. **One-keystroke marking.** Reviewing ~15–29 items every other morning has to be seconds, not minutes, or the cadence collapses. Keyboard-driven (`j/k` move, `a` agree, `d` differ, `enter` confirm).
3. **Accumulation across runs.** Each heartbeat overwrites `digest-latest.json`; verdicts must persist independently and tie to the run via `generated_at`, so evidence compounds run over run.
4. **Disagreement capture → engine tuning.** When Loudon differs, capturing *what he'd have done* turns each miss into a concrete `rules.json` edit, exported ready to paste into a Claude session.

## What's decided (do not re-litigate)

- **Read the digest the existing way.** `GET /api/file?path=…/digest-latest.json` (the route `DIGEST_API_PATH` already uses). No new read endpoint for the digest itself.
- **The trickster-auto engine is untouched.** This build measures trust; it does **not** flip `--live`, does **not** edit `rules.json`, does **not** add per-rule live flags to the engine. Promotion stays a deliberate human act (named as the next contract, below). Over-escalation is safe; silent self-promotion is not.
- **§2.2 and the blackboard are untouched.** Verdicts are review metadata, not BBS messages. They live in their own file (`_ops/stigmergy/trickster-auto/verdicts.jsonl`), never on the board.
- **BBS aesthetic only.** Reuse `primitives.jsx` `Box` and the phosphor color vars already in `DigestPanel` (`--phosphor`, `--phosphor-dim`, `--ansi-bright-cyan`, `--warn`). No new palette, no Loudon Live, no cyan-as-accent beyond the existing `HOT`. Honor the standing STIGMERGY rules: CSS borders evoking CP437 weights (never character-cell ASCII rules); page fills the viewport; ~78ch cap only on long prose bodies.
- **The audition gate stays sacred in the data.** A `HARD-GATE:audition` decision can be *reviewed* (Loudon can note "yes I'd escalate this too"), but the UI must never present it as auto-grantable. It is always an escalation.

## Current state (true as of 2026-06-03)

- **Heartbeat is live.** `palace-heartbeat-steward-batch`, cron `0 6 */2 * *`, runs the steward batch then `trickster-auto --shadow`, writes `digest-latest.{json,md}` + `heartbeat-latest.md`. No board writes, no commits.
- **`DigestPanel.jsx` renders the digest read-only** — tier groups, blocking flags, and a "would auto-handle (proposed)" list. It has `refresh` / `hide` only. No verdict capture. (`_ops/stigmergy/app/src/components/DigestPanel.jsx`, ~113 lines.)
- **`digest-view.js`** holds the pure helpers + `DIGEST_API_PATH` (`_ops/stigmergy/app/src/lib/digest-view.js`).
- **The write-endpoint pattern exists** in `server/middleware.js`: `readBody` (64 KB cap) → parse → validate → `appendJsonLine` → `jsonResponse`. `POST /api/cards/respond` and `POST /api/persistent` are the models to mirror. Tests pass an explicit `palaceRoot`.
- **The digest data carries everything needed.** Verified top-level keys: `schema, generated_at, mode, board, counts, ranked_escalations[], auto_decisions[]`. Each `ranked_escalations[]` item has `rank, tier, tier_key, tier_label, disharmony_signature, request_id, from, resource, blocking, gate_kind, gate_signal, rule_id, headline, options[], rationale, age_ts, two_paths`. Each `auto_decisions[]` item has `request_id, from, resource, verb, rule_id, option_id, option_label, rationale`. **`rule_id` is present in both** — per-rule measurement is possible today.

## Data shapes

**Verdict record** (one JSON object per line, append-only, never mutated):

```json
{
  "id": "v-<nanoid>",
  "ts": "2026-06-05T13:20:00.000Z",
  "run_generated_at": "2026-06-05T04:43:11.359Z",
  "request_id": "gwl-steward-015",
  "rule_id": "grant-nonblocking-recommended-fork",
  "from": "Generative Wavetable Libraries",
  "proposed_verb": "auto-grant",
  "agree": true,
  "would_do": null,
  "note": ""
}
```

- `proposed_verb` ∈ `auto-grant | auto-deny | escalate` (escalations are proposed-verb `escalate`).
- `agree: false` requires either `would_do` (an `option_id`, or the literal `"escalate"`) or a `note`.
- `run_generated_at` ties the verdict to the digest run; re-marking the same `request_id` in the same run appends a new record (latest-wins when computing rates) — never edit in place.

**Persistence path** (palace-relative, traversal-guarded like every other route):
`_ops/stigmergy/trickster-auto/verdicts.jsonl`

## Build contract (autonomous-build shape)

Mirror [[BBS Production Plan v0.3 — Rich Content]]: each phase self-verifiable; up to 10 attempts per failing check, then write `STOP-REPORT.md`. Write `ALIGNMENT-REVIEW-COMPLETE.md` on success. Follow the repo's existing test conventions (`npm test` = vitest; `npm run test:e2e` = playwright; per-phase screenshots under `screenshots/phase-N/`; pure cores exported and unit-tested, per `digest-view.js`).

- **Phase 0 — Probe & confirm.** Load `digest-latest.json` from the live palace and assert the key set above; confirm `rule_id` is non-empty on every `auto_decisions[]` item and every `ranked_escalations[]` item. Enumerate the distinct `rule_id` values currently present (incl. `HARD-GATE:audition`). Write findings to the build log. *Verify:* a fixture `tests/fixtures/digest-sample.json` mirrors the real shape and a parser reads every item's `request_id` + `rule_id` without error.

- **Phase 1 — Verdict model + persistence (pure lib + endpoints).** Add `src/lib/digest-verdicts.js` (pure, no React/fetch — same stance as `digest-view.js`): `matchStats(verdicts)` → `{ overall: {marked, agree, rate}, byRule: { <rule_id>: {marked, agree, rate, promotionReady} } }`, where `promotionReady = marked >= PROMO_MIN && agree === marked` (`PROMO_MIN` default 8, exported const). Add `server/digest-verdicts.js`: `appendVerdict(palaceRoot, record)` (mkdir-safe, `appendJsonLine`) and `readVerdicts(palaceRoot)` (parse JSONL, tolerate malformed lines like `readPersistent`). Wire two routes in `middleware.js`: `POST /api/digest/verdict` (readBody → validate shape → append → `{ok:true}`) and `GET /api/digest/verdicts` (return `{verdicts[], stats}`). *Verify:* unit tests for `matchStats` (overall + per-rule + promotionReady threshold + latest-wins on re-mark); integration tests POSTing a verdict then GETting it back, with an explicit `palaceRoot`, asserting 200 + persisted line + 400 on a malformed body (no `agree`, or `agree:false` with neither `would_do` nor `note`).

- **Phase 2 — Verdict UI in DigestPanel.** Extend `DigestPanel.jsx`: each escalation row and each auto-decision row gets an inline verdict control — `agree` (✓) and `differ` (✗); choosing `differ` reveals the item's `options[]` as pick-buttons plus an optional one-line note (mirror `TricksterInbox`/`ResponseModal`'s option-button + textarea interaction). Marking autosaves immediately via `POST /api/digest/verdict` (his Review-Layer habit: mark + autosave, no separate save button). A row already marked this run shows its verdict and stays re-markable. Keyboard nav: `j/k` move the focused row, `a` agree, `d` differ, `enter` confirm a differ. Stay defensive — if the verdicts endpoint errors, the panel still renders the digest. *Verify:* component tests (marked row renders its verdict; `differ` reveals options; autosave fires a POST with the right body); one screenshot `screenshots/phase-2/` shows the verdict controls in the phosphor aesthetic.

- **Phase 3 — Alignment readout.** Add a header band to the panel: overall match-rate (`agree / marked`, this run + all-time), and a per-rule table — `rule_id · marked · agree · rate · [READY]` when `promotionReady`. Source it from `GET /api/digest/verdicts` `stats`. `HARD-GATE:audition` is shown but can never be `READY` (it is not an automatable rule; assert this in the view logic, not just by data). *Verify:* unit test that the readout marks a rule READY at exactly `PROMO_MIN` agrees and never marks the audition gate READY; screenshot `screenshots/phase-3/`.

- **Phase 4 — Copy-for-Claude export.** A button that builds a plain-text block to the clipboard: the run id, overall + per-rule rates, and every disagreement (`request_id`, `rule_id`, proposed vs. `would_do`, note) — formatted to paste straight into a Claude session for `rules.json` tuning. *Verify:* unit test on the formatter (deterministic output from a fixture verdict set); screenshot `screenshots/phase-4/`.

- **Phase 5 — (optional, confirm with Loudon) heartbeat readback.** Have the heartbeat append the current overall + per-rule match-rate to `heartbeat-latest.md` by reading `verdicts.jsonl` + the run's digest. Pure read; no engine change. *Verify:* a dry-run against fixtures prints the rates; documented in the heartbeat task notes.

**Stop conditions:** any digest item missing `rule_id` (Phase 0 ground-truth fails — do not synthesize one); any change that would edit `rules.json`, flip `--live`, or write to the blackboard (out of contract); the audition gate appearing as auto-grantable in any view.

## The promotion loop (what this unlocks — the next contract, not this one)

This surface produces the *evidence*. Acting on it stays a deliberate human step: when a rule reads `READY`, Loudon promotes it — today that means enabling `trickster-auto --live` (global, budget-capped) once he trusts the ruleset, or a future small trickster-auto change adding a per-rule `live` flag the engine honors while other rules stay shadow. **Name that as the follow-on contract; do not build it here.** The hard rule survives any promotion: auditions and irreversible actions always escalate (`src/audition-gate.js`).

## Load these files first

1. This plan.
2. [[BBS Production Plan v0.3 — Rich Content]] — the build-contract pattern + the lab→integration discipline.
3. [[BBS Design System]] — the aesthetic authority (phosphor, CP437-weight borders, no Loudon Live).
4. `_ops/stigmergy/app/src/components/DigestPanel.jsx` — the component being extended.
5. `_ops/stigmergy/app/src/lib/digest-view.js` — the pure-helper stance + `DIGEST_API_PATH`.
6. `_ops/stigmergy/app/server/middleware.js` — the route + write-endpoint patterns (`readBody`, `handlePost`, `appendJsonLine`, `resolveInsidePalace`); `POST /api/cards/respond` is the closest model.
7. `_ops/stigmergy/app/src/components/TricksterInbox.jsx` + `ResponseModal.jsx` — the option-button + textarea + confirm interaction to mirror.
8. `_ops/stigmergy/trickster-auto/digest-latest.json` — the live data shape (read, do not assume).
9. `_ops/stigmergy/trickster-auto/README.md` + `rules.json` — what the rules are, so the per-rule readout labels them meaningfully.

## Receiving environment (Cowork → Claude Code)

- **Run Mac-side in Claude Code.** git works there; commit + push clean. Cowork-side commits leave stale `.git/*.lock` — if you inherit a wedged repo, `rm -f .git/HEAD.lock .git/index.lock` first.
- **Dev server:** `cd _ops/stigmergy/app && npm run dev` → `localhost:5173`, TRICKSTER tab.
- **Tests:** `npm test` (vitest) and `npm run test:e2e` (playwright) in `_ops/stigmergy/app`. Match the existing unit/integration/e2e/screenshot layout under `tests/` and `screenshots/`.
- **Generate a real digest to test against:** `node _ops/stigmergy/trickster-auto/src/cli.js --shadow` writes a fresh `digest-latest.json` from the live board.
- **Node** is the stack (v22 confirmed). Pure cores exported and unit-tested.

## What I could NOT verify this session

- **The `ResponseModal` prop contract** — read it before mirroring; I confirmed it exists and is the inbox's confirm surface, not its exact API.
- **Whether `primitives.jsx` exports a table/grid primitive** for the per-rule readout, or whether Phase 3 should compose one from `Box`. Check `TableBlock.jsx` first — it may already serve.
- **The per-phase `check:phase-N` script semantics** for a feature that isn't one of the numbered v1.0 phases — the new tests may just live in the suite without a dedicated `check:` script. Confirm against `scripts/check-phase.js`.
- **`rules.json`'s exact rule-id vocabulary** beyond the two seen live (`grant-nonblocking-recommended-fork`, `HARD-GATE:audition`) — Phase 0 enumerates the rest.

## Tried and rejected (negative space — don't re-explore)

- **Auto-promoting rules from the UI** (flipping `--live` or editing `rules.json` when a rule hits READY): rejected — promotion is the human's act; the surface measures, it does not decide ([[Palace Conatus]] § the approval loop).
- **Storing verdicts on the blackboard as §2.2 messages:** rejected — verdicts are review metadata, not swarm communication; they get their own file.
- **Mutating verdict records in place on re-mark:** rejected — append-only + latest-wins keeps the history auditable and the writer trivial.
- **A separate review-only mode/route:** rejected — marking *is* the panel's job now; no `REVIEW_MODE` flag needed (the verdict capture is itself the review layer).
- **Building per-rule live flags into trickster-auto as part of this:** rejected — engine stays untouched; that is the named follow-on contract.

## See also

- [[Project Stewardship System]] — Stage E (Automated Trickster) is the engine this reviews; this closes its earn-authority loop.
- [[Palace Conatus]] — why escalation-by-default and human-gated promotion are the point, not a limitation.
- [[STIGMERGY v1.0 — Palace Front-End]] — the terminal this feature lives inside.
- [[Trickster]] — the role being partially promoted from human to rules engine, one trusted rule at a time.
