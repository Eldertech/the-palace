# Automated Trickster (Stage E)

A deterministic, declarative rules engine that triages the BBS TRICKSTER inbox.
The last stage of the [[Project Stewardship System]]; the consolidation layer
named in [[Palace Conatus]] — the palace's aggregated self-advocacy was
out-running the bandwidth of the one human who reads it. This turns ~16 separate
asks into one ranked digest, auto-handles the genuinely routine, and escalates
everything else.

It is a **rules engine plus a digest writer**, not an agent that reasons about
requests. When in doubt, it escalates to the human.

## The one non-negotiable rule

**Never auto-grant a request tied to a sensory audition or any
irreversible/destructive action — those always escalate.** Hard-coded in
`src/audition-gate.js`, runs before any rule, cannot be overridden by editing
`rules.json`. Over-escalation is safe; auto-granting an audition is a contract
violation.

## Tuning shadow mode → earning `--live`

Write authority is **earned per rule**, not flipped for the whole engine. The
on-ramp is the scoreboard: `node src/cli.js --retro` replays the *current*
ruleset over the *whole board history* and scores each would-be auto-decision
against the decision Loudon actually made (his grant/deny clicks — never the
engine's own `decided_by:auto` posts). For each auto-acting rule it reports:

- **dangerous** — times the rule would have auto-granted something Loudon
  *denied*. This is the one that matters; it must be **zero**.
- **agreement %** — of the cases the rule auto-acted on, how often Loudon
  granted (exact option **or** a free-text/notes grant counts as agreement).
- **option divergence** — granted, but Loudon picked a different listed option
  than the steward recommended. Tolerated within the agreement budget, because
  `blocking:false` means the steward already proceeded and Loudon can still steer
  in the grant notes.

### The criterion (`DEFAULT_PROMOTION` in `src/retro.js`)

A rule is **eligible for `--live`** when, replayed over history:

1. **≥ 20** of Loudon's decisions exercised it (enough signal to trust), **and**
2. **0 dangerous** false-grants (never promote a rule that would grant a deny), **and**
3. **≥ 90 %** agreement on the cases it auto-acted.

When a rule clears the bar, flip *only that rule* live and keep a daily cap:
`node src/cli.js --live --budget 5`. Everything else keeps escalating. Re-run
`--retro` after each heartbeat to watch the number; a single dangerous hit drops
eligibility regardless of volume. The hard audition/irreversible gate is never
in scope for promotion — it always escalates.

> Status at last run: `grant-nonblocking-recommended-fork` — 23 decided, 0
> dangerous, 91 % agreement → **eligible**. The two divergences (gwl-steward-002,
> retrospective-delay-steward-004) were both still grants, down a different fork.

## Run it

```
node src/cli.js                 # SHADOW (default): evaluate + write digest, post NOTHING
node src/cli.js --json          # also print the digest JSON to stdout
node src/cli.js --board P.jsonl # evaluate a specific board
node src/cli.js --live          # ALSO post auto-grant/deny to the board (earned, opt-in)
node src/cli.js --live --budget 5   # cap auto-grants per day at 5
node src/cli.js --retro         # SCOREBOARD: replay the ruleset over board history vs your real clicks
node src/cli.js --retro --json  # the scoreboard as JSON
npm test                        # the full suite
npm run check:phase-0 … check:all   # per-phase verify gates
```

Shadow writes `digest-latest.{json,md}`. STIGMERGY renders it on the TRICKSTER
tab (`DigestPanel` → `/api/file?path=…/digest-latest.json`).

## How a decision is made (each step only makes the outcome safer)

1. **Hard gate** (`audition-gate.js`) — sensory audition / irreversible → escalate.
2. **Rules** (`rules.json`, in order; first match wins).
3. **Budget** (`budget.js`) — an auto-grant past the daily cap → escalate.
4. **Default** — no rule matched → escalate (novel = the human's).

## v0 ruleset (`rules.json`, Loudon-editable, no deploy)

- **auto-grant** non-blocking directional forks carrying the steward's own
  recommendation (the deterministic proxy for "advances the forward vector at low
  stakes" — the engine can't reason about prose, so it ratifies a non-blocking,
  recommended fork).
- **escalate** everything blocking, every audition, every irreversible action,
  every unmatched resource.
- **dormant** `read_palace` (grant) and `web_search`-over-budget (deny) rules
  carry vocabulary forward for resource types not yet seen on the board.

A malformed ruleset fails CLOSED — the engine refuses to run rather than loosen.

## Files

| File | Role |
|---|---|
| `src/parse.js`        | Coalescing parser — absorbs the real field-location variance (resource/blocking/options each appear top-level OR in payload; object & string option shapes). |
| `src/inbox.js`        | Rebuilds the pending set (requests with no correlated `re`). |
| `src/ruleset.js`      | Loads + validates `rules.json`; fails closed. |
| `src/audition-gate.js`| The sacred hard gate. |
| `src/evaluate.js`     | Pure `evaluate(request, ruleset, budget)`; `evaluateBatch` threads the budget. |
| `src/digest.js`       | Ranks escalations by Palace Conatus disharmony tier; renders JSON + Markdown. |
| `src/decide.js`       | Builds §2.2 grant/deny messages with `auto` provenance; posts via the orchestrator's validated append (no third write path). |
| `src/budget.js`       | Daily auto-grant cap; day-boundary reset; persisted only on `--live`. |
| `src/cli.js`          | The runner. Shadow-default; `--live` opts into posting; `--retro` scores. |
| `src/board.js`        | Reads the board via the orchestrator's `readJsonl`. |
| `src/retro.js`        | The shadow-tuning scoreboard — `scoreBoard()` replays the ruleset over history and scores each would-be auto-decision against your real clicks; reports per-rule eligibility. |

## Provenance

Every auto-decision posts as `from: "TRICKSTER (auto)"` with
`payload.decided_by: "auto"` — always visibly distinct from Loudon's own clicks,
on the board and in STIGMERGY.

## Design notes worth keeping

- **No DIRECTIVE_REQUEST.** Gap 8 was never closed by adding a type; directional
  decisions ride as `RESOURCE_REQUEST` with `resource: "directional_decision"`.
  The engine keys on the `resource` field, not the message type.
- **The all-audio-palace effect.** Synth/audio stewards mention listening in
  nearly every rationale, so a naive sensory keyword scan escalated everything.
  The gate keys on the `resource` token plus a *curated* set of phrases where the
  decision itself is sensory/gated — catching genuinely mislabeled auditions
  while leaving true design forks grantable.
