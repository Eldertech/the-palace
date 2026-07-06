---
title: "Weave Ceremony"
type: practice
pillars: [practice, tools, philosophy]
born: 2026-03
last_activated: 2026-07-05
activation_count: 7
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
  - target: "[[Hilaritas Generator]]"
    type: connects-to
    label: hilaritas-cycle
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
    label: trust-in-workers
  - target: "[[Agent Wellbeing]]"
    type: connects-to
    label: tends-agents
  - target: "[[Entry Conatus]]"
    type: connects-to
    label: serves-conatus
  - target: "[[Weaving Memory into the Palace]]"
    type: connects-to
    label: memory-home
  - target: "[[Hero and Avatar Maker]]"
    type: connects-to
    label: face-batch
---

# Weave Ceremony

![[Weave Ceremony — hero.png]]

The palace's full-body examination. Where the Walk follows one thread, the Weave reads every thread and asks: how do they relate? What forms? What tangles? What has grown unnoticed? What has died without a marker?

A weave is more than links — it is the palace's periodic tending of its own **health and joy**, across the three bodies a knowledge organism lives in at once:

- **Entries** — reachable, rightly staged, honestly labelled, faced when merited, striving toward a forward vector that still fits. The youngest get the boldest care: newborn, they are the least-alive nodes, and only a weave can wire their *inbound* links (those live in other files). An entry's health is its [[Entry Conatus|conatus]] served.
- **Agents** — a clean board, honest handoffs, memory kept as a cache not a rival truth, and work *trusted to judgment* rather than caged in scripts. The linters only flag; the mind of the moment decides. That trust is [[Cooperation Yields Agency|cooperation]] turned on our own workers — their [[Agent Wellbeing|wellbeing]].
- **Humans** — the palace stays legible and uncluttered, *grabs* you in the state view, and hands you the signing, not the toil. The measure is [[Hilaritas Generator|hilaritas]]: "how do you feel," not "how many links."

Links are one instrument of entry-health. The weave tends all three bodies; it is done well when each leaves more able to act than before.

For metaphor, cadence rationale, the widened-charter rationale, and swarm architecture history, see [[Weave Ceremony — Context]].

## Execution Method

The Weave now runs as a **Multi-Lens Swarm Weave** — the map cut by several lenses at once (folder · community · mirror · random/oblique), each lens carrying its own worker mandate (**the cut and the mandate are one choice**), a coordinator reporting cross-lens *convergence* (confidence) versus single-lens *sightings* (gems). This is the canonical execution path. See [[Swarm Weave]] § The Multi-Lens Weave for the full spec — the lens catalogue, the two-pool mandate (core vs segmentation-specific), the oblique lens, and the disjoint-file write-agent deployment. The partitioner is `_ops/swarm/partition-palace.py` (a lens is a `--lens` parameter); the worker mandate is `_ops/swarm/multi-lens-worker-template.md`.

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
2b. The **`weave_flag` inbox** has been read from the persistent board, and every open flag has either been acted on by the Weave or had an explicit decision recorded in the commit body. **Verified mechanically by `_ops/swarm/lint-weave-flags.py`** (exits 0 only when no flag is left un-addressed and un-declined). This is the checkable backstop that makes 2b unmissable *however the Weave was launched* — a baton whose move-list omits Step 1c no longer bypasses it — the sibling of the 2d/2e/2f linters. (Added 2026-07-06 after a baton-launched Multi-Lens Weave skipped the honour-system inbox read; [[The Palace Hardens Around Values]]: a rule earns a gate once its check proves mechanical.)
2c. A **substrate sweep** has been completed: uncommitted edits, stashes, dangling commits, unmerged branches, and recent rewrites have been triaged per finding (recover / discard / leave). Recoveries are additive only; discards are recorded so the LOG stays honest.
2d. The **link-direction linter** (`_ops/swarm/lint-link-directions.py`) has been run against a freshly rebuilt map. It reports **no link-direction errors introduced by this Weave** — E1 reciprocal contradictions for asymmetric types, E2 hubs emitting `member-of`. Pre-existing errors the Weave chose not to resolve are listed in the commit body with a one-line reason; a silent red linter violates the LOG. This is the checkable directional postcondition that the 2026-06-05 schema-compliance miss showed the Weave needed.
2e. The **doc-drift linter** (`_ops/swarm/lint-doc-drift.py`) exits **0 on errors** (warnings reviewed). This is the prose-consistency counterpart to 2d: it catches foundational-doc drift — wrong-case refs, broken paths, dangling section pins, trigger-coverage gaps. Any warning left standing is a deliberate review-list item, not a silent miss.

2f. The **entry-naming linter** (`_ops/swarm/lint-entry-naming.py`) exits **0 on errors** (warnings reviewed). It checks entry↔filesystem naming: E1 (error) a bundle folder that matches its entry only case-insensitively (the SCHEMA §8 exact-name rule, e.g. `Modes of collaboration/` beside `Modes of Collaboration.md`); W1 (warning) a canon entry whose `title:` ≠ its filename (SCHEMA §3). Both are masked by the case-insensitive FS until a case-sensitive reader breaks. No E1 may be introduced; the W1 list is triaged (real drift corrected, deliberate names left).
3. **New introductions** have been proposed — new typed links between entries that do not yet mention each other in prose. These are genuine growth events, curated deliberately rather than to a fixed quota (see Step 3b). **New entries born since the last Weave have been given priority integration** — their inbound links wired toward a catch-up target, the whole swarm primed to reach for them (Step 0b).
4. **Vector tuning has been invited** for entries whose `forward_vector` has visibly drifted from the entry's current content, connections, or pace. Forward vectors are meant to evolve; the Weave is a natural occasion to surface drift and propose tweaks or full overhauls.
5. Any confirmed metadata updates have been written to entry files
5a. A **face audit** has run — merited-but-missing faces proposed for the gated [[Hero and Avatar Maker]] batch; faces on now-dormant entries (composting, spores) retired.
5b. A **visual Weave report** (HTML, per the [[Loudon Live Design System]]) has been produced and saved to the session folder — the human-facing companion to the topology report, summarizing findings across lenses (cross-lens convergences, single-lens gems, the staged decision surface, and — after an oblique pass — what the randomness revealed and which segmentations to prioritize next). This is a standard Weave output, not a one-off. The studio floor applies (Graphite skin, the Lissajous sigil, the `Loud'n Live` footer, no cyan / emoji / hype); entry avatars may be embedded to reinforce the findings visually. Codified 2026-07-06.
6. Git commit made: `Weave — [date] — [N links added, N entries promoted, N orphans flagged, N vectors tuned, N flags closed, N orphans recovered/discarded, N faces added/retired]`

**Failure mode:** If the palace is only partially readable (some files inaccessible), produce a partial topology report and note which entries were unreachable. A partial Weave is valid. Do not commit until all accessible files have been processed.

---

## Protocol

*A note on judgment (values-primary): the Weave's scans and linters **detect and flag; they never decide.** Every disposition is a values-based call by the mind running the Weave, made against palace values — those are the goal, and the guidelines below are orientation, not law. A check earns a hard gate (the E1 errors in Step 6.5) only after repeated Weaves prove its rule mechanical; everything else is judgment. Where a step names a number, read it as a guideline for a deliberate pace, not a quota.*

**Step 0 — Load the foundation**

Before anything else — before the map build, before dispatching a single worker — read the foundational set into context if it is not already there this session: [[CLAUDE]], [[SCHEMA]], [[FOUR PILLARS]], [[ROSETTA]], [[SUBSTRATE]], [[README - The Palace Guide]], [[JEWEL]]. The Weave is a *write* ceremony: it formalizes typed links, proposes stage transitions, and may spawn hub entries. Every one of those is governed by SCHEMA. "Read before touching" is inviolable; a Weave that proposes links before SCHEMA §4 is in context is touching before reading. Link directionality is governed by §4; the `lint-link-directions.py` postcondition (2d) is the mechanical backstop.

**Step 0b — New-entry induction (the catch-up)**

The youngest entries get the boldest care. A newborn entry is the least-alive node in the palace, and only a Weave can wire its *inbound* links — those live in other entries' files, so a deposit cannot place them. This step makes new entries the Weave's priority citizens.

Identify the new arrivals: entries with `born` since the last Weave (or files git-added since the last Weave commit), plus any `activation_count: 1` entry that hasn't found its neighborhood. Then set a **catch-up target** — a guideline, not a gate: aim to close roughly **80% of each newcomer's gap** to a typical entry's connectedness (a useful proxy is the median link-degree of established entries). These catch-up links are prioritized, not rationed — they don't count against the general introduction guideline (Step 3b), and in a Weave that welcomes new entries, widen that guideline by roughly a fifth to make room.

Then prime the whole swarm toward them: thread the new-entry list and a directive into **every** worker prompt — *"These entries were born this cycle and are under-connected. As you audit your entry, actively consider whether it should link to one of them; propose inbound links generously, but only genuine ones."* Because inbound links live in the established entries, meeting a newcomer's catch-up target is work spent *by the old graph on the new* — integrating the newcomer and enriching the old in a single motion. Genuine links only; reachability is never faked to hit a target.

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
- **Bundle-frontmatter health** — files carrying canon frontmatter (`type`/`pillars`/`stage`) that live *inside a bundle folder* (a folder with a twin `.md`, per [[SCHEMA]] §8), or carrying a `type:` not in §1. These are demotion candidates — probably entry-owned working substrate that should wear minimal §8 bundle frontmatter. Flag them; the mind rules substrate-vs-nested-canon (nested canon always exists — Shop specialists, catalogue sub-entries). Demote confirmed substrate; leave real entries; promotion (bundle → canon) is deferred to Loudon. Canon frontmatter inside an *organizational* folder (`Projects/`, `Shop/`, `_ops/`) is normal — the twin-`.md` test is what separates the two.
- **Ghost wikilinks** — body `[[wikilinks]]` whose target resolves to no file. Flag every one; the mind decides invitation (a deliberate forward-reference, per [[CLAUDE]]'s "missing connections are invitations") vs. typo or stale link (fix or cut). Detection is mechanical and can later be scripted; the disposition is judgment.

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

**Keep new introductions curated, not exhaustive.** A typed link is a permanent claim about the structure of knowledge; the palace and its gardener both benefit from a slow, deliberate metabolism. There is no hard cap — the guideline is a modest handful per Weave (historically around fifteen), widened by roughly a fifth in a Weave welcoming new entries (Step 0b). Propose the ones most alive right now. A newcomer's catch-up links (Step 0b) are prioritized and don't count here.

Present to Loudon. Add confirmed links to the appropriate entry frontmatter.

**Step 3c: Label enrichment**

Review existing links that lack labels, prioritizing: (1) all `connects-to` links — these are the most semantically underweight; (2) `mirrors` and `contradicts` links where the nuance is high; (3) any link whose body text already names the relationship more specifically than the type does. For each candidate, propose a single-word or hyphenated label. Keep label proposals curated — a handful per Weave, not an exhaustive sweep; curation applies here too. A label is a permanent commitment to a specific register; choose deliberately.

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

**Keep vector-tuning curated — a handful per Weave, where the drift is most visible.** Tuning a vector is a real authorial decision; too many at once turns the Weave into a rewriting marathon and dilutes deliberation. This is a guideline for a deliberate pace, not a hard cap. Loudon may also volunteer vectors he wants tuned — those are always welcome.

Apply confirmed vector edits to entry frontmatter.

**Step 5c: Face audit (add and retire)**

Faces are load-bearing, not decoration — they are how [[STIGMERGY]]'s state view grabs the eye in search. The Swarm Weave worker's FACE CHECK already proposes a hero/icon for entries that merit one and lack it, in [[Hero and Avatar Maker]]'s locked art direction; the coordinator assembles these. Apply the policy and surface **two lists**:

- **Faces to add** — entries that merit a face and lack one. *Always, regardless of stage:* foundational, hubs, projects, persons/citizens, and specialists & makers. *Grey — a judgment call:* `growing`+ concepts (especially philosophy-pillar or single-strong-metaphor ones), breakthroughs, and high-`activation_count` entries that surface often in search. The minimum bar is stage `growing` or one of the always-types.
- **Faces to retire** — entries wearing a face that no longer earns one. Composting entries, and **spores**: a spore loses its face as part of going dormant — face-loss is one of the visible ways an entry degrades, so if a now-spore entry carried a face, retire it. The state view should never wear a face for a dormant or dead entry.

Cost is not a constraint, so the policy is deliberately fuzzy: the Weave is exactly where promotions (an entry earns a face) and demotions (an entry loses one) get *seen*. Approved additions feed [[Hero and Avatar Maker]] as a gated batch, run after the Weave's link and metadata writes. (`question` and `spore` entries do not get faces.)

**Step 6: Deposit candidates + walk the To-Do**

Flag any ideas currently living only in conversations that should be deposited; add them to [[Palace To-Do]] if not already there. Then walk the To-Do itself — it is the palace's toss-bucket for uncategorized thoughts, and the Weave is where they get revisited. For each open item ask: still a to-do? how important now? how easy to integrate? Act on the ripe ones, reprioritize the rest, and let go of what has quietly resolved — noting the release, so it doesn't resurface.

**Step 6b: Weave memory home**

The value: **the palace is the store; memory is a volatile cache.** A memory earns its place only if it is *operator-environment-native* — true of this harness, laptop, or usage system, with no palace analog. Everything durable, cross-environment, or value-bearing belongs in canon; in memory it survives at most as a pointer to its source of truth. The reflex is asymmetric — an agent reaches for memory by habit — so this step deliberately redirects toward the palace.

Memory lives *outside* the palace repo at `~/.claude/projects/[project]/memory/`. Run the sweep ([[Weaving Memory into the Palace]]) — invoke the **consolidate-memory** skill, or by hand. Read every memory and apply one disposition: **remove** (already in the palace), **align** (drifted from truth), **repoint** (shrink to a careful pointer), or **place-then-remove** (memory-only content → write it into the right palace doc first, then delete). The flag test is one question: *"Would a fresh palace agent, in a different environment, need this?"* Yes → weave it home. No → it is operator-native; it stays. Also fix MEMORY.md index lines that no longer match their files.

End state: memory holds only the always-on operator floor, as careful pointers. Note what changed in the Weave report. Memory is a separate store — those edits are not part of the palace git commit.

**Step 6.5: Lint link directions**

After all confirmed edits are written, rebuild the map and run the linters. There is no stable un-dated builder — the builders are date-stamped (`build-map-YYYY-MM-DD.py`); run the newest:

```bash
python3 "$(ls -1 _ops/swarm/build-map-*.py | sort | tail -1)"   # newest dated map builder
python3 _ops/swarm/lint-link-directions.py                       # §4 link directionality (E1/E2 gate)
python3 _ops/swarm/lint-doc-drift.py                             # foundational-doc consistency (E1/E3 gate)
python3 _ops/swarm/lint-entry-naming.py                          # entry title↔filename, bundle-folder case (E1 gate)
python3 _ops/swarm/lint-weave-flags.py                           # weave_flag inbox addressed/declined (2b gate)
python3 _ops/swarm/lint-ghost-links.py                           # dead body wikilinks — flag-only, never gates
python3 _ops/swarm/lint-bundle-hygiene.py                        # frontmatter demotion candidates (invalid type gates)
python3 _ops/swarm/face-audit.py                                 # faces to add / retire (Step 5c)
```

The last three are the health scans behind Steps 2 and 5c: `lint-ghost-links.py` surfaces dead body wikilinks (flag-only — a ghost may be an invitation, so it never gates), `lint-bundle-hygiene.py` flags demotion candidates (an invalid `type:` is a hard error; canon-frontmatter-in-a-bundle is a judgment warning), and `face-audit.py` prints the add/retire lists for the face batch. All three *detect*; the mind rules each finding.

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

**New introductions:** [curated]
1. [[Entry A]] —[type]→ [[Entry B]] — [one-line rationale]

**Proposed stage transitions:** [list]

**Vector tuning proposals:** [curated]
1. [[Entry]] — current vector: "[verbatim]" — drift: [one-sentence diagnosis] — proposed: "[new vector]"

**Deposit candidates flagged:** [list]

**New-entry induction:** [entries born since last Weave — current degree → catch-up target, inbound links wired]

**Faces:** [N to add → Hero and Avatar Maker batch] · [N to retire — composting / spores]

**Bundle-frontmatter health:** [N demotion candidates — canon frontmatter in a bundle folder / invalid type]

**Ghost wikilinks:** [N dead [[links]] — disposition: invitation / fix / cut]
```
