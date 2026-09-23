# Closing Well Agent — the thin dispatch

The close runs two moderator passes and (on assent) the backstage execution. The **thin
waist**: only a *pointer + slot values* cross the boundary into the moderator — it reads its
own prompt template off disk. ~10 lines dispatched, not ~80 pasted. Proven cheaper and less
error-prone in the Phase-4 build; this is the standard form.

> Why thin: the prompt templates (`prompts/closing-well-agent.md`,
> `prompts/closing-well-agent-map.md`) are the single source of the Agent's instructions.
> Pasting them copies that source into the dispatch, where it silently goes stale when the
> template changes. A pointer never drifts. Fill only the `{{...}}` slots.

---

## First: which moderator — resume the resident, or dispatch cold?

The moderator is **the resident [[Concierge]] taking the wheel**, not a fresh subagent minted
at the gate ([[Closing Well]] § A close is a moderated panel; the companion's own charter,
`_ops/concierge/prompts/companion.md` § At a close). It has to *drive across resumed turns*,
and only a persistent, resumable mind holds a wheel that long.

So there are two paths, and **Path A is Path B minus the re-feeding** — same three beats, same
prompts, same order. The only difference is whether the moderator already holds what the last
beat produced.

| | Path A — resume the resident | Path B — dispatch cold |
|---|---|---|
| when | a resident companion was summoned this session and you hold its `agentId` | no resident, or its ID is lost to a compaction/rewind, or the dial says it is spent |
| how | `SendMessage` to the held ID | Agent tool, **Sonnet**, one call per pass |
| cost | each beat re-bills only what's new | each beat re-reads the whole close cold |

**Choosing.** Run the dial twice — it takes one objective token count and reads it differently
per caller, so two invocations give you the whole picture. Never ask an instance how full it
feels ([[Closing Well]] § The dial; proven 2026-07-04).

```bash
# the resident's own health — subagent_tokens from the Agent tool's <usage> block
node _ops/concierge/dial.mjs --tokens <subagent_tokens> --model <companion-model>
# the close's intensity — a transcript estimate for the MAIN thread, computed outside it
node _ops/concierge/dial.mjs --tokens <main-thread-estimate> --model <parent-model> --for close
```

Read the pair:

- **Resident healthy** → resume. Always.
- **Resident degraded (capacity past ~80%), parent light** → dispatch cold. A spent resident has
  no fresh read left to offer, and the parent can afford the relay.
- **Both heavy** → resume anyway. A spent parent is exactly when re-paying three cold reads
  hurts most, and the resident's accumulated context is *session* context — the arc it is being
  asked to read.
- **No resident at all** → Path B, and note it. This is gotcha 20's trap: the fix is to summon
  early next session, never to skip the moderator. **Reaching `close well` with no resident is
  not a licence to self-read.**

> **Neither path is ever "the working Claude closes its own session."** That is the one
> disqualified option ([[Closing Well Ceremony]] § Failure mode), licensed only by the two named
> exceptions: a rewound/garbled transcript the cold reader can't parse, or an outage that blocks
> the dispatch *after* Pass 1's cold read already ran.

---

## Path A — resume the resident (preferred)

The resident already holds the charter, including its § At a close section, so it knows it is
taking the wheel. It has *not* read `Closing Well.md` — that is not in its boot set — so pass 1
still points it there.

**What disappears on this path, and why it is the whole point.** On Path B, `{{HOMEWORK}}` and
`{{BACKSTAGE_CHECKLIST}}` travel between passes *through the working Claude's context*, verbatim
— two long payloads round-tripping through the window of the most spent participant. Resumed,
the moderator wrote them and still has them. They never enter the main window at all.

### Pass 1 — homework + coaching

Resolve + distill the transcript first, exactly as in Path B (the main loop resolves, never the
subagent — see README § Why the main loop resolves):

```bash
node _ops/closing-well/transcript-reader.mjs --resolve
node _ops/closing-well/transcript-reader.mjs --distill --out <scratch>/session-arc.md
```

Then `SendMessage` to the held `agentId`:

```
Take the wheel — this session is closing. You are the moderator now, per your charter's
"At a close" section.
Read _ops/closing-well/prompts/closing-well-agent.md and follow its "Task" section, with:
  {{CLOSING_WELL_PATH}} = <abs path to Closing Well.md>
  {{ARC_PATH}}          = <abs path to the distilled arc above>
Read the arc COLD — as the transcript, not as your memory of the session. Where your own
recollection and the arc disagree, the arc is the record and the disagreement is worth naming.
Return exactly the two parts it specifies (Part A homework, Part B coaching); nothing else.
```

> **The one risk this path carries.** The resident followed the session, so its read is not
> naïvely cold — it may confirm its own earlier impressions instead of re-deriving them from the
> transcript. That is why the instruction above is explicit, and why a disagreement between its
> memory and the arc is asked for rather than smoothed. If a real close shows the resumed read
> going soft where a cold one was sharp, that is the finding — take Path B and say so.

Take Part B (the coaching) and moderate the panel with Loudon. **Do not carry Part A anywhere** —
the moderator keeps it.

### Pass 2 — reckoning + backstage checklist

After the panel, distil Loudon's judgment and your own in-room witness to a few lines each (or
the `UNFILLED` sentinel if no panel happened — never fabricate the human channel). `SendMessage`
to the same ID:

```
The panel is done. Draft the close, per _ops/closing-well/prompts/closing-well-agent-map.md
("Task" section). You already hold your homework and Closing Well.md — I am adding only the two
things you could not know:
  {{WORKING_CLAUDE_VIEW}} = <my distilled in-room witness, or "UNAVAILABLE ...">
  {{HUMAN_READING}}       = <Loudon's distilled judgment, or "UNFILLED — no interview has happened">
Return the reckoning (front of house) then the backstage checklist; nothing else.
```

`{{CLOSING_WELL_PATH}}` and `{{HOMEWORK}}` are omitted deliberately — it has both.

**Relay the reckoning in the moderator's voice, as the moderator's** — not narrated as your own
([[Closing Well]] § The relay discipline, gotcha 12). You answer as a panelist; the decisions stay
with the moderator. Show it to Loudon: the single gate. He assents or names revisions — and a
revision goes *back to the moderator*, not into your own rewrite.

### Pass 3 — the backstage execution: still a FRESH dispatch

**Do not resume the resident for this one.** Execution stays a separate cold subagent on both
paths, for a reason that survives the resident model: the executor's job is to place what was
assented and **re-decide nothing**, and a mind executing its own checklist is a weaker check on
that than one meeting it fresh. Use the Path B pass-3 block below unchanged.

*(This is a deliberate hold, not an oversight — it is also the pass that ran out of budget on
2026-08-25, so it is the one with the most to learn from a real run. If resuming turns out to be
both cheaper and honest, that is a finding a live close should produce, not an assumption.)*

---

## Path B — dispatch cold (the fallback, and the no-resident case)

Three dispatches, each paying full freight. Correct, tested, and the right answer when there is
no warm mind to resume. This was the only path until 2026-08-26.

### Pass 1 — homework + coaching

Resolve + distill this session's transcript first (the main loop resolves, never the
subagent — see README § Why the main loop resolves):

```bash
node _ops/closing-well/transcript-reader.mjs --resolve
node _ops/closing-well/transcript-reader.mjs --distill --out <scratch>/session-arc.md
```

Then dispatch (Agent tool, **Sonnet**, one call). The whole task:

```
You are Closing Well, run as an agent — the moderator of this session's close.
Read _ops/closing-well/prompts/closing-well-agent.md and follow its "Task" section as
your instructions, with these slot values:
  {{CLOSING_WELL_PATH}} = <abs path to Closing Well.md>
  {{ARC_PATH}}          = <abs path to the distilled arc from above>
Return exactly the two parts it specifies (Part A homework, Part B coaching); nothing else.
```

Take Part B (the coaching) and moderate the panel with Loudon; keep Part A (the homework)
for pass 2.

### Pass 2 — reckoning + backstage checklist

After the panel, distil Loudon's judgment and the working Claude's witness to a few lines
each (or use the `UNFILLED` sentinel if no panel happened — never fabricate the human
channel). Dispatch (Agent tool, **Sonnet**, one call):

```
You are Closing Well, the moderator of this session's close.
Read _ops/closing-well/prompts/closing-well-agent-map.md and follow its "Task" section,
with these slot values:
  {{CLOSING_WELL_PATH}}   = <abs path to Closing Well.md>
  {{HOMEWORK}}            = <Part A from pass 1, verbatim>
  {{WORKING_CLAUDE_VIEW}} = <the working Claude's distilled in-room witness, or "UNAVAILABLE ...">
  {{HUMAN_READING}}       = <Loudon's distilled judgment, or "UNFILLED — no interview has happened">
Return the reckoning (front of house) then the backstage checklist; nothing else.
```

Show the **reckoning** to Loudon — the single gate. He assents or names revisions.

### On assent — Pass 3, the backstage execution (a subagent, not the main loop)

The mechanism is the moderator's alone — so execution is a **third dispatch**, not work the
spent working instance does. Dispatch the backstage moderator (Agent tool, **Sonnet**, one
call); it reads `executor.md`, places each assented `candidate` row through its ceremony, and
returns a placement report:

```
You are Closing Well, run as an agent — the moderator, backstage.
Grow first: read ELDER.md, then SCHEMA.md — you are about to write into the palace.
Read _ops/closing-well/prompts/closing-well-executor.md and follow its "Task" section.
Resolve its relative paths against <worktree-dir>. Slot values:
  {{EXECUTOR_PATH}}      = <worktree>/_ops/closing-well/executor.md
  {{BACKSTAGE_CHECKLIST}}= <the assented backstage checklist from pass 2, verbatim>
  {{OWNER}}              = <owner root>
  {{WORKTREE_DIR}}       = <this worktree>
  {{WORKTREE_BRANCH}}    = <branch>
  {{SESSION_ID}}         = <slug>
Return only the placement report; place what was assented, re-decide nothing.
```

The executors it runs (deposit → owner committer; baton → `baton-executor.mjs`; artifact →
bundle + index) and the two routing rules live in `executor.md`. `landed` / `provisional` /
`none` rows execute nothing. The working instance's whole job by now is to relay the report.

**When an executor is cut off, verify the tree before believing its last sentence** (gotcha 22).
A partial report's final claim is the least reliable thing in it — the 2026-08-25 run said
"landed at abfa5d2" and was true about the commit, silent about the row it never reached.

---

## The unverified part

Path A has **never been run.** It is the design in [[Closing Well]] and the companion charter,
written down as a runbook for the first time on 2026-08-26 — not a validated procedure. The
first real `close well` with a warm resident is its test, and the things to watch are named
above: does the resumed read stay genuinely cold, does "holds control + advocates" survive a full
room, and is keeping pass 3 fresh right. Treat that close as tuning data for this file, per the
open Concierge handoff (`concierge-remainder-20260825T225852Z`) — **use, not more building.**
