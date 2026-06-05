# ALIGNMENT-REVIEW-COMPLETE

Build contract: `Palace development/STIGMERGY — Alignment Review Build Plan.md` (on `stigmergy-v1.0-frontend-rebuild`; this implementation built off `main`).
Branch: `stigmergy-alignment-review`.
All phases verified.

## Phases

- **Phase 0 — Probe & fixture.** `tests/fixtures/digest-sample.json` mirrors the live digest shape; `tests/unit/digest-fixture.test.js` (7 tests) asserts every required top-level key plus `rule_id` + `request_id` non-empty on every escalation and auto-decision item. Live rule_id vocabulary confirmed: `HARD-GATE:audition`, `default-no-match`, `grant-nonblocking-recommended-fork`.
- **Phase 1 — Verdict model + persistence.** `src/lib/digest-verdicts.js` (pure: `PROMO_MIN=8`, `validateVerdict`, `dedupeLatest`, `matchStats`); `server/digest-verdicts.js` (`appendVerdict`, `readVerdicts`, mkdir-safe + malformed-line tolerant); `POST /api/digest/verdict` + `GET /api/digest/verdicts` in `server/middleware.js`. 22 unit tests + 8 integration tests.
- **Phase 2 — Verdict UI in DigestPanel.** `DigestPanel.jsx` extended: inline ✓ / ✗ on every row; differ reveals `options[]` as pick-buttons + a one-line note + confirm/cancel; autosaves via POST; rows re-markable (latest-wins on backend); keyboard nav `j`/`k`/`a`/`d`; defensive on verdicts-endpoint error. 4 e2e tests + 2 screenshots.
- **Phase 3 — Alignment readout header.** `matchStatsForRun(verdicts, runId)` added; `AlignmentReadout` component renders all-time + this-run rates and a per-rule table with `[READY]` only on non-audition rules at `PROMO_MIN` agrees with zero differs. View-layer defense re-asserts `HARD-GATE:audition` is never READY independent of stats. 3 unit tests + 2 e2e tests + 1 screenshot.
- **Phase 4 — Copy-for-Claude export.** `formatCopyForClaude(verdicts, {runId})` — deterministic plain-text bundle (header, runId, overall, this-run when present, per-rule sorted alphabetically, disagreements sorted by request_id, format footer). `CopyForClaudeButton` calls `navigator.clipboard.writeText` with a hidden-textarea fallback. 7 unit tests + 2 e2e tests + 1 screenshot.

## Phase 5 — skipped

Confirmed with Loudon up front: heartbeat readback deferred. The pure-read side (`readVerdicts` + `matchStats`) is in place and the heartbeat task can pick it up as a small follow-up once panel use accumulates.

## What was NOT touched (out-of-contract verified)

- `_ops/stigmergy/trickster-auto/` engine — unchanged. No `--live` flip, no `rules.json` edit, no per-rule live flag added to the engine.
- Blackboard / §2.2 messages — unchanged. Verdicts live in `_ops/stigmergy/trickster-auto/verdicts.jsonl`, never on the board.
- Audition gate sacredness — UI never offers audition as auto-grantable; stats library guards `promotionReady = false` on `HARD-GATE:audition`; view-layer re-asserts the same.
- BBS aesthetic — reused existing `Box`, phosphor variables (`--phosphor`, `--phosphor-dim`, `--ansi-bright-cyan`, `--warn`); no new palette, no Loudon Live, no emoji introduced. ✓/✗ glyphs are the only new characters and are CP437-compatible signal symbols.

## Verification gate (final)

- **Vitest suite:** 748/748 pass across 45 files (regression: no existing test broke).
- **Playwright suite for this build:** 8/8 pass in `tests/e2e/digest-verdicts.spec.js`.
- **Hermetic on disk:** each e2e test snapshots `verdicts.jsonl` before and restores after; no residue in the live alignment record. Verified absent at completion time.

## Screenshots (deliverables)

- `screenshots/alignment-review/phase-2/verdict-controls-inline.png`
- `screenshots/alignment-review/phase-2/differ-options-open.png`
- `screenshots/alignment-review/phase-3/alignment-readout-populated.png`
- `screenshots/alignment-review/phase-4/copy-button-copied.png`

## The next contract (named, not built)

Per the build plan's "promotion loop": when a rule reads `READY`, promotion stays a deliberate human act. The named follow-on contract is the engine-side small change adding a per-rule `live` flag so `trickster-auto` honors `--live` on individual rules while others stay shadow. Out of scope here.
