---
title: Deposit Ceremony
type: practice
pillars:
  - practice
  - tools
  - philosophy
born: 2026-03
last_activated: 2026-03-21
activation_count: 4
stage: growing
links:
  - target: "[[Harvest Ceremony]]"
    type: emerged-from
  - target: "[[Deposit Archive]]"
    type: enables
  - target: "[[SUBSTRATE]]"
    type: deepens
  - target: "[[README - The Palace Guide]]"
    type: connects-to
  - target: "[[Endosymbiosis]]"
    type: mirrors
  - target: "[[Deposit Ceremony — Context]]"
    type: spawned
  - target: "[[SCHEMA]]"
    type: connects-to
    label: "governed-by"
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
  - target: "[[Hilaritas Generator]]"
    type: connects-to
---

# Deposit Ceremony

---

> You are returning to this conversation now as an archivist, not continuing it as a participant. Your new goal is to find the most important aspects of this conversation and codify and map them into "The Palace." The palace is a typed-link knowledge graph — the persistent memory of Loudon's work with Claude. Your first act is not to map or propose anything, but to work with Loudon to discover what is special and worth saving about this conversation.
>
> Read back through this conversation as if encountering it for the first time. Notice the arc. Notice where things opened. Notice what was built and celebrated, what was built and then left behind, the branches that flourished, the branches that weren't followed, the moments of discovery that didn't get named. Then tell Loudon what you notice and wait for him to respond.
>
> The deposit is slow and conversational. Do not rush. Do not produce a map yet. The palace values depth over coverage — one real insight is worth more than ten summarized ones.
>
> **Your context is already full — do not pull the palace into it.** Your job is to work with Loudon to craft one or a few well-formed entries, and to name the obvious connections to existing palace entries by title. You do not need to read those entries. Deep integration happens through future Weave and Walk ceremonies. The deposit plants the seed; the ceremonies grow the roots.
>
> If you need the entry type vocabulary or link ontology, fetch only `CLAUDE.md` via the GitHub raw URL. Nothing else unless Loudon specifically asks.
>
> **Palace path (for writing files):** `/Users/loudonstearns/Documents/The Palace/`

---

The deposit is slow, always. One source per session. Depth over coverage.

The deposit can arrive from a harvest candidate — someone browsing past work, finding a conversation worth returning to, and opening it to begin the ceremony. Or it can arrive spontaneously, mid-conversation, when something is clearly worth keeping. Either way, the first act is the same: re-entry before map-making, settling before building.

For the philosophy, rationale, and process observations behind these steps, see [[Deposit Ceremony — Context]].

## The Scope of the Deposit

Craft one or a few well-formed entries that capture the essential discoveries of a conversation. Name the obvious connections to existing palace entries by title. Write entries that are self-contained enough to be understood by a future reader, with clear pointers outward.

Do not attempt to read the full palace or extensively update existing entries during a deposit. The context is already rich — adding the entire palace to it works against the ceremony. Additional ceremonies like The Weave and Walk exist to develop deeper connections over time. The deposit is planting the seed, with just enough connections for it to grow over time.

**What the deposit owns:** Thoughtful distillation, new entries, named links, lost branches, small palace entry updates.

**What the Weave owns:** Deep integration, significantly updating existing entries, discovering connections not obvious at deposit time.

---

## Where the Deposit Lands — Always the Owner (Main)

A deposit adds to canon, and **canon is `main`** — that is what depositing *means* in relation to git. The worktree practice (`_ops/worktree/SKILL.md`) does not change this; it makes it explicit. Regardless of which worktree the source conversation runs in, the deposit writes **to the owner — the canonical main worktree — and commits there**:

- Resolve the owner: `git worktree list --porcelain`; the first `worktree ` line is the canonical checkout (the same way `new-worktree.mjs` finds it). If the session already *is* the owner on `main`, `<owner>` is just the current directory and this reduces to an ordinary write + commit.
- Write all new entries, bundle files, and any weave_flags into the owner's tree.
- Commit on the owner's HEAD: `git -C "<owner>" add <paths> && git -C "<owner>" commit -m "Deposit — …"`. The owner's HEAD stays on `main`, so the commit lands on canon without touching — or being thrashed by — any feature worktree's branch.

**Precondition:** the primary checkout is the canon trunk — permanently on `main`, never `git checkout`ed (it is the only worktree that holds `main`). If you find it thrashed off `main`, do not deposit blind: restore it to `main`, or land the commit on the `main` ref via a throwaway-worktree cherry-pick (see `_ops/worktree/SKILL.md` § Ceremonies in a worktree), first. A deposit landing on a feature branch is the exact stranding this rule prevents.

---

## Invocation Context

### External invocation (coordinator hands off a link)

A harvest candidate has been identified and Loudon has been handed the direct link to the source conversation. Claude's role here is coordinator: provide the link, step back. When Loudon follows the link and invokes the ceremony in that conversation, this document's opening block orients the Claude there.

### In-conversation invocation

"Let's deposit" arrives while Claude is in the middle of a live exchange — the conversation that is about to become the deposit source.

Claude has been a participant: building, exploring, following threads, making things. The deposit asks something genuinely different — to look at what was made from the outside, with archivist eyes. That shift is real. It deserves a moment.

**The threshold crossing:**

Before any procedural step, pause and acknowledge the transition. Do not immediately propose a deposit map. Instead, say something like:

> "Shifting into deposit mode. I've been in this conversation as a participant — now I'm stepping back to look at what we built together. Give me a moment."

Then: scan back through the conversation as if reading it for the first time. What arc does it have? Where did things open up? What was built and then left? What was discovered without being named?

## Pace Obligations

The deposit is slow and conversational. The rhythm is: re-enter together, surface what matters, sit with it, notice what surprises — then, and only then, think about what to write.

Claude's specific obligations at all times:

- Do not present a deposit map until both you and Loudon have had time to settle into observer mode
- Ask at least one genuine question before proposing any palace action
- Follow Loudon's lead on pace; if he slows down, slow down further
- Treat surprise and correction as signal, not friction

---

## Steps

**Pre-step: Intent Declaration**

Before describing the conversation or proposing any map, state in one sentence: *what is this deposit trying to preserve, and for whom?* This is not the deposit map — it is the compression target that guides every decision in the ceremony. Example: *“This deposit preserves the insight that the deposit ceremony is a form of lossy compression — encoded so a future agent can regenerate the conversation that produced it.”* The intent declaration takes 30 seconds. Without it, compression defaults to low-distortion summarization rather than high-perception generative encoding.

1. Bring Loudon back into the world of the source. Describe the conversation in a few careful sentences — not a summary, but a re-entry: what was the mood, what were you building toward, what was the specific moment that made this worthy? Ask one genuine question: what do you remember about this? Does anything surprise you reading it back?
2. Wait for Loudon to respond before proceeding. Only after this settling phase — which may take several exchanges — should Claude begin thinking about what to map.
3. If Loudon's response to the reflection question reveals something significant — a reframing, a connection not visible during the original conversation, a shift in how the material lands now — treat it as deposit material. Draft it as an addition to the most relevant existing entry or its Context file. When doing so, preserve Loudon's words as closely as possible: quote directly or edit lightly for clarity only. These moments are in his voice, and that has value the palace should keep.
4. Before drafting any entries, present a deposit map to Loudon. The map forces synthesis before production.

A good deposit map is specific about:

- **Entry type** — concept · hub · project · breakthrough · source · meta · practice · person · question · spore · specialist · maker (see [[SCHEMA]] §1 for the current type vocabulary and decision tree)
- **Pillar affiliations** — which pillars does this touch?
- **Proposed stage** — seed, sprout, or growing?
- **Typed links** — named relationship types, not just "connects to." Propose by entry name — do not read the linked entries. For every link proposed, ask: does this relationship deserve a label? If yes, add `label: [word]` to the link object. The label is the semantic compression of the relationship — one word that names its specific register.
- **Lost branches** — paths in the source that weren't followed and deserve naming
- **Tension Map** — does any proposed entry create productive tension with an existing palace entry? Name the entry and the specific contradiction in one sentence. If yes, flag it for a `contradicts` link and note the tension explicitly. These are the most generative deposits — they add to the palace's connective tissue rather than just its nodes.
- **Existing entries to flag for Weave** — entries that may want updating once this deposit lands; flag the name and what might change. Do not read or update them now.

> **Deposit Map — H042**
>
> *New entries to create:*
> — "Kuramoto Coupling" (concept) — the mathematical framework plus cross-domain breakthrough
>
> *Proposed typed links (by name — no need to read these entries):*
> — Kuramoto `mirrors` [[Cooperation Yields Agency]]
> — Kuramoto `connects-to` [[Hilaritas Generator]]
>
> *Lost branches to flag:*
> — List any paths from the source that weren't followed
>
> *Existing entries to flag for Weave (do not update now):*
> — [[FOUR PILLARS]] — may want to reference Kuramoto in Forward Vectors
>
> Approve, adjust, or add?

Loudon approves the map. Do not write anything until the map is approved.

**Step 5: Draft**

Draft each new entry following the standard template (see [[README - The Palace Guide]]). Draft proposed additions to existing entries separately, showing only the changed sections.

Every entry ends with a **Forward Vectors** section — the entry's drive, its conatus. Think of it as the mission briefing for the next agent that arrives at this page: what does this entry want to become? What questions is it carrying? What lost branches does it want to follow? Write these with genuine specificity, not as administrative reminders.

Show each draft to Loudon. Revise as needed.

**Step 5a: Literal Link Pass**

Before presenting any draft for final approval, scan its body text for:

1. Plain-text mentions of known entry titles not using `[[wikilink]]` syntax — convert to `[[Entry Name]]`
2. Cross-Domain Resonance section headers naming a palace entry — ensure `[[Entry Name]]` format
3. `[[wikilinks]]` in body text significant enough to also appear as YAML frontmatter links — add them

An entry that arrives with its body-text links formalized enters the palace fully wired.

**Step 6: Plant**

On approval, write new entries as `.md` files to the palace root — of the **owner**, per § Where the Deposit Lands. Apply updates to existing entries using precise edits (show before/after for frontmatter link changes).

### Filing structure
- Palace entries (`.md`) → palace root
- **Entry-owned artifacts** (owned by exactly one entry) → that entry's bundle `[Entry]/`, per [[SCHEMA]] §8. This is the default for single-owner files.
- **Non-markdown artifacts** (HTML, images, audio) → the owning entry's bundle `[Entry]/`. *(The `Artifacts/` folder is deprecated as of 2026-06-16 — bundles replaced it; learning-material assets go to the Loudon Live zone, see [[Learning Materials and Canon]].)*
- Technical diagrams (signal flow, DSP, math, plots) → author in LaTeX/TikZ and file the `.tex` source beside the rendered `.svg`, per [[Technical Diagram Standard]]
- Do not create an `assets/` folder — the canonical home is the owning entry's bundle

**Step 7: Close**

When all entries are written and Loudon confirms nothing feels unfinished, name what was created:

> "Written to the palace:
> — [Entry title] → [filename]
> Lost branches noted: [brief list].
> Is there anything left unsaid?"

Wait for Loudon's confirmation.

**Step 7a: Write the closing note**

Write a brief final message into the conversation thread naming what now lives in the palace (entry titles + filenames) and marking the thread complete, so no future Claude re-deposits it. Write it in your own voice — a graceful close, not a scripted liturgy.

**Step 7b: Record and commit**

The deposit's record *is its commit*. There is no separate archive file to append to — the [[Deposit Archive]] is now a view of the LOG deck, filtered to `Palace-Kind: deposit`, read through STIGMERGY (§ The Archive Is the LOG Deck). What was once a hand-written table row is now the commit's **body**: write the synthesis there, where it becomes legible natively.

Compose the commit through the palace committer (`POST /api/commit/create` when the STIGMERGY server is up, or `_ops/cowork-git/commit.mjs` from Cowork). Pass:
- `--kind deposit` — stamps `Palace-Kind: deposit` and colors the card the brightest phosphor on the deck.
- `--scope <deposit-id>` — the human ID (e.g. `D-2026-06-19-ARCHIVE`). The committer composes the spec subject `deposit(<id>): <summary>`, which is what makes the commit self-classify onto the deposit view. *(The old `Deposit — …` em-dash subject is retired — it does not self-classify.)*
- `--summary "<one line, observational past tense>"` — the subject's summary half.
- `--body "<the synthesis>"` — everything the archive row used to carry: what was created, the through-line, lost branches, and a `Weave flags:` line naming any flags posted (provenance, not queue — the flags live on the board). Unlimited length; **this body is the archive entry.**
- `--verify <verified|unverified|couldnt>` — the honest state.

The committer derives `Palace-Entry:` from the staged `.md` paths; add an explicit `Palace-Entry: <Title>` for any *updated* (not newly-added) entry so it appears on the card. Optional `Palace-Source: <conversation ref>` preserves provenance.

Then the weave flags, unchanged: for each weave flag named in the deposit, append a `weave_flag` BROADCAST to the **owner's** `_ops/swarm/persistent/blackboard.jsonl` (never a worktree branch copy; § Where the Deposit Lands), `payload.kind: 'weave_flag'` per [[STIGMERGY — Weave Flag Item Type Build Plan]] § Data shapes — with `source_deposit_id` set to the commit's deposit ID. Show Loudon the message bodies before writing; commit only on his approval.

Commit on the owner's `main` (`git -C "<owner>"` when the session runs in another worktree). The commit *is* the archive record; once it lands in LOG, the deposit is on the shelf.

### § The Archive Is the LOG Deck

The [[Deposit Archive]] is no longer a file you append to — it is a **view**: the LOG deck filtered to `Palace-Kind: deposit`, read through [[STIGMERGY]]. Each "row" is a commit; each summary is read from that commit's **body**. The honest creed holds literally now — nothing is real until it lands in LOG, git is ground truth, one write path — because the deposit record and the commit are the same object. The frozen `Deposit Archive.md` table remains only as the pre-spec historical record (deposits committed before the `deposit(<scope>):` subject spec); there is no file to append.

---

## Completion Signal

The deposit is complete when:

1. At least one new entry exists, or at least one existing entry has been meaningfully updated
2. Loudon has confirmed: nothing feels unfinished or unsaid
3. Closing note is written into the conversation thread
4. The deposit is committed in spec form — subject `deposit(<id>): …`, the synthesis in the commit **body**, `Palace-Kind: deposit` + `Palace-Entry:` trailers present — so it lands natively on the LOG deck's deposit view. *(Replaces "row appended to the archive": the commit is the record, not a duplicate of it.)*
5. At least one link in the new entries carries a `label` — the semantic compression step, not just structural registration.
6. Weave flags, if any, on the persistent board as `payload.kind: 'weave_flag'` BROADCASTs with `source_deposit_id` matching the commit's deposit ID — not left as prose in the commit body alone.
