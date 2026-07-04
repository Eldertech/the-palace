# The close map — format + gate (Phase 4)

The **close map** is the one artifact a `close well` produces: a typed list of
everything the session should inscribe into the palace, each row a species with its
own home and lifecycle. The [[Closing Well Agent]] drafts it; **Loudon signs it**.
This file is the format spec and the template the map-drafting pass fills. The design
rationale lives in [[Closing Well]] § The close map; this is its operational shape.

## The three species (never crossed)

| species | what it is | home | lifecycle | compression |
|---|---|---|---|---|
| **deposit** (memory) | synthesis that became true | entry body + typed links | permanent — woven, maintained as truth | complete but not inflated |
| **baton** (message) | the in-flight move | bundle file / board | disposable — deleted on catch | lossy on purpose |
| **artifact** (evidence) | proofs, HTML explainers, machinery | the entry's bundle, indexed | durable, non-canon | as-built |

The axis under the map: *does this want to be re-encountered by the organism, or
consumed and forgotten?* A deposit is what the palace **keeps**; a baton is what it
**hands off**. A deposit writes into the *graph* (canon); a baton writes into the
*repo* but stays out of the graph and is deleted on pickup.

## The `status` column is load-bearing

*(Gotcha #1, forced by the first pilot.)* A deposit can land **mid-session**, so the
map is not a to-do list of pending things — it is the **full ledger** of what the
session inscribed, including what is already done. Every row carries a status:

| status | meaning |
|---|---|
| `landed` | already committed this session — shown so the ledger is complete, not because it's owed |
| `candidate` | proposed; awaits Loudon's sign to be written |
| `in-flight` | partially done; names what remains |
| `provisional` | drafted **without** the human reading (interview `UNFILLED`); a canon call that is Loudon's to make — awaits him, cannot be signed as-is |
| `none` | a species deliberately empty — *"deposit: none"* is a row, not an omission |

Without the column an already-landed deposit reads as still-owed. With it, `landed`
rows show the session was productive without any of them being *owed*.

## "deposit: none" is first-class — and common

*(Gotcha #6.)* A close's real work is often the **drift the exciting work left
behind, not new canon** — a stale status banner, a session-log append. The flashy
output frequently landed *mid-flight*. **A close that goes looking for a deposit to
make has misunderstood itself.** The map must be able to say, honestly, *deposit:
none pending beyond cleanup* — and that is a complete, healthy close. The map's
existence must never pressure a deposit into being; that manufactured-canon reflex is
the tristitia failure the whole practice guards.

## The map template

```markdown
## Close map — <session id / short name>   ·   drafted <date>

**One-line arc:** <what the session set out to do → what it became>

**Human reading:** answered   ·OR·   UNFILLED — provisional draft, not signable

**What mattered most (distilled):** <1–2 sentences — Loudon's + the working Claude's read of what, if anything, is canon, and the next move. If UNFILLED, say so and give only the AI readings' view.>

| # | species | status | what | home | evidence / notes |
|---|---------|--------|------|------|------------------|
| 1 | deposit | none | — (no synthesis became canon-worthy this session) | — | — |
| 2 | baton | candidate | <the in-flight move for the next Claude> | `<Entry>/<Entry> — baton.md` + board | <why it's owed> |
| 3 | artifact | landed | <what shipped> | `<Entry>/<bundle path>` | commit `<sha>` |

**Next move:** <the one thing the next session picks up, one line>

**Sign:** Loudon ⟶ ☐ approve   ☐ revise (say which rows)
```

**When the human reading is `UNFILLED`**, the map is provisional: canon-dependent rows
carry status `provisional`, and the `Sign` line is replaced by —

```markdown
**Questions for Loudon** (his reading settles these; then the map becomes signable):
1. <the canon call — is <X> a deposit, or already-home / not-canon?>
2. <the next-move / baton call>
3. <any other gap only he can fill, from the pass-1 "gaps" list>
```

A provisional map is a complete, honest output of a close run with no human present —
not a lesser map. It is never executed; it waits for the interview, then re-drafts.

Rows are ordered species-first (deposit, baton, artifact) then by status. Keep the
map short — a close map is a *ledger*, not a report. If a species is empty, it still
gets one `none` row so the reader sees it was considered.

## How it renders as the single gate

The close map **is** the show-before-write gate. The Agent drafts; nothing is written
until Loudon signs. One gate, not one-per-row:

1. The map is shown in full (this template, filled).
2. Loudon signs — `approve`, or `revise` naming the rows to change.
3. On `approve`, each `candidate` / `in-flight` row executes through its **own**
   existing ceremony (deposit → [[Deposit Ceremony]]; baton → [[Baton Ceremony]];
   artifact → bundle + index) — *that wiring is Phase 5, not Phase 4*.
4. `landed` and `none` rows execute nothing — they are ledger, not work.

**Failure mode:** an unsigned map is a draft, not a completed close. Never execute an
unsigned map; never manufacture a canon row to fill the map. A close without a
signature has not happened. **And never fabricate the human reading** — a close run with
no live interview produces a `provisional` map with a Questions block, not a map padded
with guesses attributed to Loudon. Inventing his judgment is a forgery, not a draft; it
is the confabulation-of-the-human-channel failure (the trap the autonomous Phase-4 run
walked into and this rule closes).

## What Phase 4 builds vs. defers

- **Built (Phase 4):** this format; the interview loop that feeds it (gap list →
  Loudon → distilled answers); the map-drafting enchantment pass
  (`prompts/closing-well-agent-map.md`); the single gate (draft + sign).
- **Deferred (Phase 5):** the **executors** — turning a signed `candidate` row into
  an actual deposit commit / baton file / board post. Until Phase 5, a signed map is
  executed *by hand* through the existing ceremonies, and the map says so.
