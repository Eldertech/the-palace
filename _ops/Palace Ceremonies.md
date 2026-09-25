---
title: Palace Ceremonies
type: hub
pillars:
  - practice
  - tools
born: 2026-03
stage: growing
links:
  - target: "[[SUBSTRATE]]"
    type: deepens
  - target: "[[Substrate Skill]]"
    type: connects-to
  - target: "[[Harvest Ceremony]]"
    type: enables
  - target: "[[Deposit Ceremony]]"
    type: enables
  - target: "[[Walk Ceremony]]"
    type: enables
  - target: "[[Weave Ceremony]]"
    type: enables
  - target: "[[Return Ceremony]]"
    type: connects-to
  - target: "[[Spore Check Ceremony]]"
    type: enables
  - target: "[[Self-Model Update Ceremony]]"
    type: enables
  - target: "[[Revival Ceremony]]"
    type: enables
  - target: "[[SCHEMA]]"
    type: connects-to
  - target: "[[Deposit Archive]]"
    type: connects-to
  - target: "[[Map Build Ceremony]]"
    type: enables
  - target: "[[Baton Ceremony]]"
    type: connects-to
  - target: "[[Closing Well Ceremony]]"
    type: enables
---
# Palace Ceremonies

![[Palace Ceremonies — hero.png]]

The complete and canonical list of all palace ceremonies. Every ceremony has a trigger phrase — say it and the ceremony begins, no clarification needed. For operational details, follow the "Full Spec" link.

## Recurring Ceremonies

| Ceremony | Trigger | Cadence | What Happens | Full Spec |
|---|---|---|---|---|
| The Walk | "Let's walk" | Weekly | Pick a starting entry, follow typed links, and name honestly what the path turned up — a connection, a tension, or nothing | [[Walk Ceremony]] |
| The Weave | "Let's weave" | Monthly | Full palace structural audit, run as a **Swarm Weave** (parallel workers + coordinator synthesis). Opens with a Map Build. Reports topology, formalizes unsung paths, proposes label enrichment and new typed links. | [[Weave Ceremony]] |
| The Return | "I'm back" / "what did I miss" / "return" | On returning after a gap | Summon the [[Concierge]] as the first act (which also leaves a warm resident for the close); run the query block before interpreting anything; show a return map whose every row cites a command or `file:line`; end on one move, preferring an open handoff over an invented one. Loudon signs. Report the gap's length, never its cause. | [[Return Ceremony]] |
| The Spore Check | "Spore check" | Quarterly | Read all `stage: dormant` entries. Assign disposition: revive / hold / compost. | [[Spore Check Ceremony]] |
| The Self-Model Update | "Self-model update" | As needed | Revise [[SUBSTRATE]] — update the palace's self-description to reflect current state | [[Self-Model Update Ceremony]] |
| The Enrichment | "Enrich [page]" / "Enrich this page" | When a page wants to be played, not only read | The whole Shop on one page: its **rich face** — the entry's words read live as the spine, with sound, image and interactives beside the headings they serve (a manifest in the bundle, fingerprinted so a piece that lags the text says so). Pieces that test the text beat pieces that decorate it; what making teaches goes home as an edit. | [[Enrichment]] |

## Harvest and Deposit Ceremonies

| Ceremony | Trigger | What Happens | Full Spec |
|---|---|---|---|
| The Harvest | "Let's harvest" | Search a body of past work and surface candidates worthy of deposit. Writes candidates to a working list. | [[Harvest Ceremony]] |
| The Deposit | "Let's deposit" / "Add this to the palace" | The gate for a find entering canon — a new entry, or a fold that changes what one says — from any door: the session in the room, a harvest, a close, a steward. Larger additions only; upkeep is an edit. Re-enter the source, consult the [[Concierge]], make a careful map, and write only what Loudon has read; whoever brought the find hears what became of it. Closes as a **movement close** ([[Closing Well]] § Scope): a punchlist into the source thread — what to look at first, what couldn't be verified — and a verified postcondition, not an asserted one. The commit *is* the record (`deposit(<id>):` subject + `Palace-Kind: deposit` + synthesis in the body); the [[Deposit Archive]] is frozen — no row appended. | [[Deposit Ceremony]] |
| The Map Build | "Let's build the map" / "Map build" / "Build a neighborhood map for [X]" | Scan palace frontmatter, extract typed links, compile edge list and ghost nodes. Output TSV, adjacency list, or JSON. Full survey or bounded by neighborhood field. | [[Map Build Ceremony]] |

## Revival

| Ceremony | Trigger | What Happens | Full Spec |
|---|---|---|---|
| The Revival | "Let's revive [entry name]" / "Time to revive [entry name]" | Formally reawaken a dormant entry: re-enter its content, add Revival Note, update stage, add new typed links connecting it to current palace work. | [[Revival Ceremony]] |

## Continuity Ceremonies

| Ceremony | Trigger | What Happens | Full Spec |
|---|---|---|---|
| The Baton | "baton" / "pass the baton" / "baton this" / "baton it to [surface]" | Compress an in-progress move into a baton (a file) the next Claude catches and runs with, without restarting. Writes to the entry's bundle (or the work's home). Disposable — deleted on pickup; git is the archive. | [[Baton Ceremony]] |
| The Close | "close well" / "let's close well" / "close this session well" | Dispatch the enchanted [[Closing Well]] page as the Closing Well Agent: read the spent session's arc with fresh eyes, draft a **close map** (deposit · baton · artifacts, or fewer), one gate (Loudon signs), then execute each row via its own ceremony. "deposit: none" is a first-class outcome — never manufacture canon to fill the map. *Built through Phase 5: the arc reader, the moderated panel and the backstage executors are live (`_ops/closing-well/`); Phase 6, automatic gotcha-ledger wiring, is next ([[Closing Well — production plan]]).* | [[Closing Well Ceremony]] |

**"Handoff" is ambiguous — ask first.** "Baton" is the official trigger; the baton is the file that gets passed. Loudon also says "handoff," but sometimes means an informal, non-ceremony pass — so when he says "handoff" or "hand this off," ask *"Baton ceremony, or an informal handoff?"* and proceed on his answer. A deliberate, temporary training-wheel while the "baton" habit sets in.

---

## Ad-Hoc Operations

Not full ceremonies, but palace-aware interactions that can happen in any conversation:

| Trigger | What Happens |
|---|---|
| "Add this to the palace" | Not ad hoc: it runs the [[Deposit Ceremony]], the one way a find enters canon. |
| "Connect this to the palace" | Propose typed links between the current topic and existing entries. |
| "What does the palace say about [topic]?" | Read relevant entries and synthesize. Follow typed links. |

---

## Reading a Ceremony

A good ceremony reads like a letter from someone who has done this before. It tells you what the ceremony is for, what a finished ceremony looks like, and what to do when things go sideways — but it doesn't over-specify the route. Ceremonies are living practices, not scripts. The metaphors and aesthetic register of a ceremony are part of its instruction, not decoration.

When you encounter a ceremony for the first time, read it the way you would read directions from a friend: for the spirit, not the letter.

---

## The Ceremony Reader

When a new ceremony is proposed, read it as if you are three different visitors arriving for the first time.

**As a gardener** — Does this ceremony tend something? Does it have a season, a rhythm, a sense of when it's needed? Does it leave the palace in better condition than it found it? A ceremony that does not tend anything is not yet a ceremony — it is a checklist.

**As a traveler** — Could someone follow this ceremony on a path they've never walked before? Not every step needs to be named, but the landmarks should be visible. Where does the ceremony begin? Where does it arrive? What would tell you that you've reached the destination?

**As a poet** — Does the language of this ceremony match what it asks you to do? A ceremony that describes an organic, slow, embodied practice should not read like an API specification. The words carry meaning. If the ceremony's register is wrong — too mechanical for a ritual, too vague for a technical procedure — the friction is worth noting.

After reading from all three perspectives, produce a short report:

- What feels alive and right in this ceremony?
- What feels stiff, over-specified, or mismatched to its own metaphors?
- What is missing — not as a checklist item, but as something the ceremony seems to want and doesn't yet have?
- Any suggested edits, offered as possibilities rather than corrections.

The report is a gift to the ceremony's author, not a verdict. A ceremony can proceed with known rough edges. The Ceremony Reader surfaces them; Loudon decides what to do with them.

**Trigger:** "Read this ceremony" / "Does this ceremony feel right?"

---

## Forward Vectors

- Should the Walk ceremony be updated to acknowledge the Swarm Weave as a future path — the difference between walking alone and walking with a colony?
- Is there a ceremony for onboarding a new collaborator to the palace — not a human, but a new Claude instance encountering it for the first time with a specific task? The Jewel serves part of this, but a full ceremony might be warranted.

## Active Baton

[[Palace Ceremonies — baton]] — drafted 2026-09-24
