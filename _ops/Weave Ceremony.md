---
title: "Weave Ceremony"
type: practice
pillars: [practice, tools, philosophy]
born: 2026-03
last_activated: 2026-06-16
activation_count: 6
stage: mature
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Substrate Skill]]"
    type: connects-to
  - target: "[[Walk Ceremony]]"
    type: connects-to
  - target: "[[Spore Check Ceremony]]"
    type: connects-to
  - target: "[[Deposit Archive]]"
    type: connects-to
  - target: "[[Kuramoto Coupling]]"
    type: mirrors
  - target: "[[Weave Ceremony — Context]]"
    type: spawned
  - target: "[[Swarm Weave]]"
    type: spawned
  - target: "[[Map Build Ceremony]]"
    type: enables
    label: pre-weave
---

# Weave Ceremony

![[Weave Ceremony — hero.png]]

The palace's full-body examination. Where the Walk follows one thread, the Weave reads every thread and asks: how do they relate? What forms? What tangles? What has grown unnoticed? What has died without a marker?

For metaphor, cadence rationale, and swarm architecture history, see [[Weave Ceremony — Context]].

## Execution Method

The Weave now runs as a **Swarm Weave** — parallel workers auditing individual entries, a coordinator synthesizing results. The Swarm Weave is the canonical execution path. See [[Swarm Weave]] for the full spec and operational instructions.

The single-agent protocol below remains valid for: palaces under ~20 entries, quick topological spot-checks, or situations where Claude Code sub-agent orchestration is unavailable. For the current palace (100+ entries), execute as a Swarm Weave.

**Standard opening steps:** Before dispatching workers, do two things in order. **First, load the foundation** (Protocol Step 0) — the Weave writes typed links and may promote or create entries, all of which [[SCHEMA]] governs; a Weave run without §4 in context is operating blind to the rules it is about to apply. **Second, run a [[Map Build Ceremony]]** (`"Let's build the map"`) to produce a fresh `palace-map-full-[date].json`. Workers use this map for neighbor resolution; the coordinator uses it for topology reporting. A Weave run without a fresh map is operating on stale topology.

## Ceremony Contract

**Trigger:** "Let's weave"

**Runs in:** Claude Code with full filesystem access. The Weave reads and writes live files.

**Preconditions:**
1. Palace has at least 5 entries (fewer and the topology report has nothing to say)
2. Full filesystem read access is available
3. The foundation is loaded this session — [[SCHEMA]] (especially §4 typed-link ontology and directionality) has been read **before any link is written**. The Weave creates typed links and may promote or create entries; both are schema-governed. See Protocol Step 0.

**Postconditions:**
1. A topology report has been produced covering: total entry count, hub nodes, orphan entries, most-connected nodes, cross-pillar bridges, dormant entries, stale metadata
2a. An **unsung paths** audit has been completed: all plain-text body references to known entry titles have been surfaced and formalized as YAML frontmatter links. Any that should NOT be formalized have been flagged with a one-line reason. Unsung paths are mandatory — the prose already asserts the connection; the YAML is simply catching up.
2b. The **`weave_flag` inbox** has been read from the persistent board, and every open flag has either been acted on by the Weave or had an explicit decision recorded in the commit body.
2c. A **substrate sweep** has been completed: uncommitted edits, stashes, dangling commits, unmerged branches, and recent rewrites have been triaged per finding (recover / discard / leave). Recoveries are additive only; discards are recorded so the LOG stays honest.
2d. The **link-direction linter** (`_ops/swarm/lint-link-directions.py`) has been run against a freshly rebuilt map. It reports **no link-direction errors introduced by this Weave** — E1 reciprocal contradictions for asymmetric types, E2 hubs emitting `member-of`. Pre-existing errors the Weave chose not to resolve are listed in the commit body with a one-line reason; a silent red linter violates the LOG. This is the checkable directional postcondition that the 2026-06-05 schema-compliance miss showed the Weave needed.
2e. The **doc-drift linter** (`_ops/swarm/lint-doc-drift.py`) exits **0 on errors** (warnings reviewed). This is the prose-consistency counterpart to 2d: it catches foundational-doc drift — wrong-case refs, broken paths, dangling section pins, trigger-coverage gaps. Any warning left standing is a deliberate review-list item, not a silent miss.

2f. The **entry-naming linter** (`_ops/swarm/lint-entry-naming.py`) exits **0 on errors** (warnings reviewed). It checks entry↔filesystem naming: E1 (error) a bundle folder that matches its entry only case-insensitively (the SCHEMA §8 exact-name rule, e.g. `Modes of collaboration/` beside `Modes of Collaboration.md`); W1 (warning) a canon entry whose `title:` ≠ its filename (SCHEMA §3). Both are masked by the case-insensitive FS until a case-sensitive reader breaks. No E1 may be introduced; the W1 list is triaged (real drift corrected, deliberate names left).
3. **New introductions** have been proposed — new typed links between entries that do not yet mention each other in prose. No more than 5 per Weave. These are genuine growth events and deserve deliberate curation.
4. **Vector tuning has been invited** for entries whose `forward_vector` has visibly drifted from the entry's current content, connections, or pace. Forward vectors are meant to evolve; the Weave is a natural occasion to surface drift and propose tweaks or full overhauls.
5. Any confirmed metadata updates have been written to entry files
6. Git commit made: `Weave — [date] — [N links added, N entries promoted, N orphans flagged, N vectors tuned, N flags closed, N orphans recovered/discarded]`

**Failure mode:** If the palace is only partially readable (some files inaccessible), produce a partial topology report and note which entries were unreachable. A partial Weave is valid. Do not commit until all accessible files have been processed.

---

## Protocol

**Step 0 — Load the foundation**

Before anything else — before the map build, before dispatching a single worker — read the foundational set into context if it is not already there this session: [[CLAUDE]], [[SCHEMA]], [[FOUR PILLARS]], [[ROSETTA]], [[SUBSTRATE]], [[README - The Palace Guide]], [[JEWEL]]. The Weave is a *write* ceremony: it formalizes typed links, proposes stage transitions, and may spawn hub entries. Every one of those is governed by SCHEMA. "Read before touching" is inviolable; a Weave that proposes links before SCHEMA §4 is in context is touching before reading. Link directionality is governed by §4; the `lint-link-directions.py` postcondition (2d) is the mechanical backstop.

**Step 0b — Orientation check**

Before reading palace entries, do a quick scan for recently deposited entries that haven't yet been woven in:
- Any `.md` files in the palace root with `stage: seed` and no inbound links from other entries are likely recent deposits waiting for their first Weave
- Any entries with `activation_count: 1` and `born` in the last month deserve attention — they're new and haven't found their neighborhood yet

Note these for deeper attention in Steps 3a and 3b. Then proceed.

**Step 1: Read the full palace**

Read every `.md` file in the palace root and any subdirectories. Build an internal model of:
- All entries and their types
- All typed links (both directions)
- All stage values
- All `last_activated` dates
- All entries with no outbound typed links (orphans)
- All entries with no inbound typed links (isolated — no one points to them)

**Step 1b: Unsung Path Audit**

From the full-text read completed in Step 1, build a list of all known entry titles in the palace. Then scan every entry's body text for:

1. Plain-text mentions of a known entry title that lack `[[wikilink]]` syntax — e.g., "the Kuramoto model" where "Kuramoto Coupling" is a known entry
2. `[[wikilinks]]` in body text that do not have a corresponding YAML frontmatter link

For each finding, record:
- Which entry contains the body-text mention
- Which known entry is being referenced
- Whether the mention is in a structurally significant location (Cross-Domain Resonance heading, bold term, explicit sentence-level reference)

These are **unsung paths** — connections already stated in prose, not yet registered in the graph. They require near-zero deliberation: the intellectual work is done; only the structural registration is missing.

Collect all unsung paths and add them to the Topology Report. They are resolved in Step 3a, before any new introductions (Step 3b).

The Weave always runs with full filesystem access. No GitHub URL fallback.

**Step 1c: Read the `weave_flag` inbox**

Read `_ops/swarm/persistent/blackboard.jsonl` and filter for unresolved `weave_flag` BROADCASTs on the `WEAVE` board (the channel established by STIGMERGY — Weave Flag Item Type Build Plan). Each flag carries `flag_type`, `source_entries`, `target_entry`, `proposed_action`, `rationale`, and `source_deposit_id`. Pass each flag to the worker assigned to `source_entries[0]` as a directed prompt — *"a deposit asked you to do X — confirm, refuse, or refine."* These are the Weave's first-class inputs, not free-form discoveries; the work of seeing the connection has already happened in the deposit, and the YAML/topology just hasn't caught up.

A flag is resolved either by the Weave taking the proposed action (the commit touches an entry in `source_entries` — the existing entry-touch auto-close in `queue-model.js` retires the card) or by an explicit decision recorded in the Weave's commit body (`Declined flag msg-<id>: <reason>` — acknowledging keeps the LOG honest).

**Step 2: Produce the topology report**

Report on:
- **Total entries** by type (concept, hub, practice, source, etc.)
- **Hub nodes** — entries with ≥5 typed links. Are any that should be hubs not yet promoted?
- **Orphans** — entries with no typed links in either direction. Flag for connection or composting.
- **Isolated entries** — entries no one links to. May be genuine roots or may be forgotten.
- **Most-connected entries** — top 5 by total typed link count. These are the palace's centers of gravity.
- **Cross-pillar bridges** — entries that link entries from different pillars. These are often the most generative nodes.
- **Dormant entries** — `stage: dormant`. Have conditions changed? Any ready for revival?
- **Stale metadata** — entries missing `last_activated`, `activation_count`, or with stage that seems wrong given content.
- **Composting candidates** — entries at `stage: composting` from a prior Weave. Confirm deletion or revive.

**Step 2.5: Substrate sweep**

The Weave is the palace's full-body exam, and git is where work either lives or is lost. Before proposing changes to the graph, audit the substrate that records them. A 30-second pre-flight scan, five commands, one report block:

```bash
git status --porcelain                            # uncommitted edits
git stash list --date=iso                         # stashes, oldest first
git fsck --no-reflogs --unreachable --lost-found  # dangling commits / blobs
git branch -a --no-merged main                    # unmerged branches
git reflog --date=iso | grep -E 'reset|amend'     # recent rewrites
```

Present every finding as one row in a table with a proposed disposition. Loudon confirms one of three:

- **recover** — the work has unique value. Always *additive*: cherry-pick a dangling commit into a fresh recovery branch, write its tree to `_ops/lost-and-found/<sha>/` for review, or rebase a stash onto current HEAD. Never `git reset` away from current state to recover.
- **discard** — the work is captured elsewhere or superseded. Record the disposition in the Weave's commit body (`Discarded stash@{N} — superseded by <sha>` / `Deleted branch parked/foo — merged in <sha>`). Acknowledging the loss is what keeps the LOG honest.
- **leave** — active in-progress work, or branches still being iterated. Note in the report, no action.

The sweep is read-only until Loudon has triaged. Repairs land as part of the Weave's commit (or in their own commit if the recovery is substantial enough to deserve its own LOG card). If the working tree was dirty when the Weave started, the dirty paths are surfaced here — not silently included in the Weave commit.

**Step 3a: Formalize unsung paths**

Present all unsung paths from Step 1b to Loudon. For each:
- Name both entries
- Propose a link type and direction using the link ontology (SCHEMA §4)
- Note whether the mention is in a structurally significant location

Unsung paths are navigation hygiene, not proposals. The body text already asserts the connection; the YAML just hasn't caught up. Formalize all of them. The only exception: if a mention is passing, historical, or explicitly non-structural, note the deliberate exclusion with a one-line reason so it does not resurface in future Weaves.

**No rate limit applies here.** Every unsung path found should be formalized.

For any unsung path being formalized as a `connects-to` link, consider whether the relationship deserves a label. `connects-to` is the most under-described type — a label often carries more signal than the type itself. If the body text already names the relationship more specifically (e.g. “X *echoes* Y”, “X *feeds into* Y”), use that word as the label.

**Step 3b: Propose new introductions**

Identify pairs of entries that should be connected but are NOT already named in each other's body text — connections that emerge from reading the topology as a whole. This is the creative work of the Weave and the palace's genuine growth mechanism. For each proposal:
- Name both entries
- Name the proposed link type and direction
- Give one sentence of reasoning

**Rate limit: propose no more than 15 new introductions per Weave.** If more candidates exist, choose the ones that feel most alive right now.

Present to Loudon. Add confirmed links to the appropriate entry frontmatter.

**Step 3c: Label enrichment**

Review existing links that lack labels, prioritizing: (1) all `connects-to` links — these are the most semantically underweight; (2) `mirrors` and `contradicts` links where the nuance is high; (3) any link whose body text already names the relationship more specifically than the type does. For each candidate, propose a single-word or hyphenated label. Rate limit: no more than 10 label proposals per Weave — curation applies here too. A label is a permanent commitment to a specific register; choose deliberately.

Present all label proposals to Loudon before applying. Write confirmed labels to the appropriate entry frontmatter.

**Step 4: Propose metadata updates**

For any entries with stale or missing metadata: propose specific corrections. Show before/after for each. Apply on confirmation.

**Step 5: Flag stage transitions**

For any entries whose stage seems wrong given their content and connection density:
- `seed` entries with substantial body content and multiple links → propose `sprout` or `growing`
- `growing` entries that have been stable and well-connected for multiple Weave cycles → propose `mature`
- `mature` entries generating new entries or connections → propose `fruiting`
- Entries not activated in multiple Weave cycles with no connection to current work → propose `dormant`

Show all proposed transitions to Loudon before applying.

**Step 5b: Invite vector tuning**

Forward vectors are meant to evolve. The palace stays lively because directional desire adapts to what entries actually become. The Weave is a natural occasion to surface vector drift — gently, not exhaustively. This step is an *invitation*, not an audit.

Scan entries for vector drift. The candidates worth proposing:

- An entry whose stage has advanced since the vector was written, and the vector still describes the earlier stage's ambition (e.g. a `growing` entry whose vector reads as a `seed`-stage hope)
- An entry whose connections have shifted the center of gravity (new `couples-with` or `emerged-from` links suggest a different forward arc than the vector currently names)
- An entry whose body content already contradicts or outgrows its stated vector (the prose is doing something the vector hasn't caught up to)
- An entry whose vector reads as generic where the entry has acquired specificity, or as overspecified where the entry has broadened

For each candidate, present:
- The current `forward_vector` (verbatim)
- A one-sentence diagnosis of the drift
- A proposed tweak, refinement, or — when appropriate — a full overhaul

**Rate limit: no more than 8 vector-tuning proposals per Weave.** Tuning a vector is a real authorial decision; too many at once turns the Weave into a vector-rewriting marathon and dilutes deliberation. Choose the entries where the drift is most visible. Loudon may also volunteer vectors he wants tuned — those don't count against the limit.

Apply confirmed vector edits to entry frontmatter.

**Step 6: Note deposit candidates**

Flag any ideas currently living only in conversations or in the Palace To-Do that should be deposited. Add them to Palace To-Do if not already there.

**Step 6b: Reconcile memory**

The Weave also keeps the agent's memory store in sync with the palace, so the two don't drift (a stale MEMORY.md index line — claiming a preference the file itself had already reversed — surfaced this need on 2026-06-16). Memory lives *outside* the palace repo at `~/.claude/projects/[project]/memory/`. Run a light reflective pass — invoke the **consolidate-memory** skill, or by hand:

- Fix MEMORY.md index lines that no longer match their files.
- Merge duplicate memories; retire ones the palace now contradicts.
- Update or retire any memory citing a file, flag, convention, or count this Weave changed.

Most memories need nothing — this is reconciliation, not rewriting. Note what changed in the Weave report. Memory is a separate store: those edits are not part of the palace git commit.

**Step 6.5: Lint link directions**

After all confirmed edits are written, rebuild the map and run the linters. There is no stable un-dated builder — the builders are date-stamped (`build-map-YYYY-MM-DD.py`); run the newest:

```bash
python3 "$(ls -1 _ops/swarm/build-map-*.py | sort | tail -1)"   # newest dated map builder
python3 _ops/swarm/lint-link-directions.py                       # §4 link directionality
python3 _ops/swarm/lint-doc-drift.py                             # foundational-doc consistency
python3 _ops/swarm/lint-entry-naming.py                          # entry title↔filename, bundle-folder case
```

Routing note: session-level Weave artifacts (maps, reports) go to `_ops/swarm/sessions/[session-id]/`; per-entry artifacts go to that entry's bundle (`[Entry]/`, per [[SCHEMA]] §8).

`lint-link-directions.py` is the Weave's mechanical check on §4 directionality — it catches what a hand audit of dozens of worker-proposed links misses. It reports:
- **E1** — reciprocal contradiction (an asymmetric type used both ways between a pair). Always a bug.
- **E2** — a `hub` entry emitting `member-of`. Always a bug (members declare membership; the hub never does).
- **W1 / W2** — heuristic reviews (a ground emitting a lineage link; `member-of`/`exemplifies` toward a less-central target). Not all are bugs — `deepens`-chains legitimately trip W1.

Resolve every error this Weave introduced. Any pre-existing error left standing is named in the commit body with a one-line reason. Do not commit a Weave that *added* a directional error.

`lint-entry-naming.py` is the naming check — the mechanical backstop for the two ways an entry drifts from the filesystem, both hidden by macOS's case-insensitive volume until a case-sensitive reader (git, Linux CI, the STIGMERGY tree) trips over them:
- **E1** — a bundle folder that matches its entry only case-insensitively (`Modes of collaboration/` beside `Modes of Collaboration.md`). SCHEMA §8 matches bundles by *exact* name; the miscase silently splits the bundle. Always a bug — an **error** that gates the commit. Fix by renaming the folder (two-step `git mv` on a case-insensitive FS).
- **W1** — a canon entry whose `title:` ≠ its filename (SCHEMA §3), e.g. `Oblique Portrait.md` titled "Oblique Portrait Method". A **warning**, reviewed every Weave and corrected where it's real drift; a few are deliberate (foundational stylized names like `ROSETTA`; source entries carrying a year). Correct by editing the title to match, or — when the filename is wrong — renaming the file and repointing its `[[wikilinks]]` (canonicalize on whichever the graph already points to). Titles differing only by a filesystem-illegal character (`?`, `/`) are not flagged.

Resolve every E1 this Weave introduced (do not commit a Weave that added one); triage the W1 list, fixing real mismatches and leaving intentional ones.

**Step 7: Commit**

After all confirmed changes are written: `Weave — [date] — [N links added, N entries promoted, N orphans flagged, N vectors tuned, N flags closed, N orphans recovered/discarded]`

The commit body lists every substrate disposition (one line each) and every declined `weave_flag` with a one-line reason. The LOG is the record; silent discards violate it.

## The Topology Report Format

```
## Weave Report — [YYYY-MM-DD]

**Palace state:** [N] entries | [N] typed links | [N] orphans

**Inbox — `weave_flag` pending:** [N]
1. [flag_type] from [source_deposit_id] → [[source_entry]] (target: [[target_entry]]) — [proposed_action]

**Substrate sweep:**
- Uncommitted: [list of paths, or "clean"]
- Stashes: [count, oldest age]
- Dangling commits: [count, with one-line subject of each, or "none"]
- Unmerged branches: [count, names]
- Recent rewrites (reflog): [count in last N days]
- Dispositions: [N recover · N discard · N leave]

**Hubs:** [list entries with ≥5 links and their counts]

**Orphans:** [list entries with no typed links — disposition needed]

**Most connected:** [top 5 entries by total link count]

**Cross-pillar bridges:** [entries linking different pillar clusters]

**Dormant:** [entries at stage: dormant — revival conditions reviewed?]

**Stale metadata:** [entries missing required fields or with outdated stage]

**Unsung paths:** [N findings]
1. [[Entry A]] body mentions "[phrase]" → propose [[Entry B]] as [link-type] — [structurally significant: yes/no]

**New introductions:** [N proposals, max 5]
1. [[Entry A]] —[type]→ [[Entry B]] — [one-line rationale]

**Proposed stage transitions:** [list]

**Vector tuning proposals:** [N findings, max 8]
1. [[Entry]] — current vector: "[verbatim]" — drift: [one-sentence diagnosis] — proposed: "[new vector]"

**Deposit candidates flagged:** [list]

**Recently deposited, not yet woven:** [entries from Step 0]
```
