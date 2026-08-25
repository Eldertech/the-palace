# Automated Trickster (Stage E) — invocation surface

The Automated Trickster is a deterministic, declarative rules engine that triages
the BBS TRICKSTER inbox so routine decisions clear without Loudon and only the
novel or high-stakes ones reach him — as one ranked digest, never a flood. It is
the last stage of the [[Project Stewardship System]] and sits beside this
orchestrator skill. Code: `_ops/stigmergy/trickster-auto/` (module README there).

It is **not** an agent that reasons about requests. It matches each pending
`RESOURCE_REQUEST` against `rules.json`, takes one of three verbs —
**auto-grant / auto-deny / escalate** (default: escalate) — and writes a ranked
digest of everything escalated. The digest renders inside STIGMERGY on the
TRICKSTER board (`DigestPanel`, fed by `digest-latest.json`).

## The one non-negotiable rule

**Never auto-grant a request tied to a sensory audition or any
irreversible/destructive action. Those always escalate.** This is a hard-coded
gate (`src/audition-gate.js`), not a `rules.json` rule — no ruleset edit can open
a path around it. If you are ever unsure whether something is sensory or
destructive, it escalates. Over-escalation is safe; an auto-grant of an audition
is a contract violation.

## How to run it

Shadow is the default and the safe on-ramp — it reads the board, evaluates every
pending request, writes the digest, and **posts nothing**:

```
node _ops/stigmergy/trickster-auto/src/cli.js            # shadow over the live board
node _ops/stigmergy/trickster-auto/src/cli.js --json     # also print the digest JSON
node _ops/stigmergy/trickster-auto/src/cli.js --board <path.jsonl>   # a specific board
```

This is the **dry-run**: nothing reaches the board; the digest at
`_ops/stigmergy/trickster-auto/digest-latest.{json,md}` is the only output.
Open STIGMERGY (`cd _ops/stigmergy/app && npm run dev` → the TRICKSTER tab) to
read it ranked.

Write authority is **earned**, not assumed. Only after the shadow proposals match
what Loudon would have decided does he opt into posting:

```
node _ops/stigmergy/trickster-auto/src/cli.js --live              # ALSO post grants/denies
node _ops/stigmergy/trickster-auto/src/cli.js --live --budget 5   # cap auto-grants/day at 5
```

In `--live`, auto-grant/auto-deny are posted as §2.2 `RESOURCE_GRANT` /
`RESOURCE_DENY` through the orchestrator's existing validated append (no third
write path), correlated via top-level `re`, stamped `from: "TRICKSTER (auto)"`
and `payload.decided_by: "auto"` so the machine's decisions are always visibly
distinct from Loudon's own clicks.

## Editing the rules

`rules.json` is yours to edit without a deploy. The v0 ruleset auto-grants only
**non-blocking directional forks that carry the steward's own recommendation**;
everything blocking, every audition, every irreversible action, and every
unmatched resource escalates. Dormant `read_palace` (grant) and
`web_search`-over-budget (deny) rules carry the vocabulary forward for resource
types that don't appear on the board yet. A malformed ruleset fails CLOSED (the
engine refuses to run) rather than loosening.

## Pairing with the weekly batch (Q4 = both)

It runs **standalone** (above) and **after each scheduled weekly batch**. The
weekly batch (`scheduled-weekly-batch.prompt.md`) ends by invoking it in shadow
mode, so a Monday run produces the per-cycle BBS asks AND a single ranked digest
of them for Loudon to triage in STIGMERGY. Keep it shadow until Loudon flips it
to `--live`.

## When to invoke

- Loudon says "run the automated trickster", "triage the inbox", "what's the
  digest", "consolidate the trickster board".
- Automatically at the end of the weekly steward batch.

Decline / escalate to Loudon when: the live board contains message shapes the
parser warns on, or any path would auto-grant an audition or irreversible action
(that's a stop condition, not a bug to work around).
