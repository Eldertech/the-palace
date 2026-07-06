---
title: Multi-Lens Worker Prompt Template
type: meta
pillars:
  - tools
  - practice
born: 2026-07
stage: sprout
links:
  - target: "[[Swarm Weave]]"
    type: connects-to
    label: multi-lens-dispatch
  - target: "[[Single-Doc Worker Prompt Template]]"
    type: couples-with
    label: multi-lens-sibling
  - target: "[[Coordinator Synthesis Template]]"
    type: connects-to
    label: synthesis-counterpart
  - target: "[[Weave Ceremony]]"
    type: connects-to
    label: values-primary-contract
  - target: "[[The Palace Hardens Around Values]]"
    type: connects-to
    label: merge-pushes-sprawl-down
forward_vector: "I am the prompt scaffold for a Multi-Lens Weave worker — a mind handed a whole cluster, not one entry. I hold the two task pools (core, done under every lens; segmentation-specific, grafted per pass) so the run is reproducible and the wrong job never lands on the wrong lens. I sharpen as the lens catalogue grows."
---

# Multi-Lens Worker Prompt Template

> Sibling to [[Single-Doc Worker Prompt Template]]. That one audits **one entry**; this one hands a worker a **cluster** produced by `_ops/swarm/partition-palace.py --lens {folder,community,mirror}`. The mandate is a function of the lens — see [[Swarm Weave]] § The Multi-Lens Weave and the two-pool design below. Replace all `{{PLACEHOLDER}}` values before dispatching.

## The two task pools

**Why two pools** — the axis is *is cross-lens redundancy signal or noise?* A task whose answer each cut sees differently belongs in **Pool 1 (core)**: run it under every lens, and conflicting answers are the point — the coordinator adjudicates by palace values, agreement across cuts is the confidence signal. A task *native* to one cut belongs to **Pool 2 (segmentation-specific)**: asking it under the others yields noise to dedup, or — merge on the mirror lens — destroys what that lens exists to find. The lens and the mandate are one choice ([[Hyperdimensional Prism]]: you can only maintain the properties a projection makes visible).

**Pool 1 — core (every worker, every lens):**
1. **Propose typed relations** among the entries you can see — genuine new links, missing `contradicts` tensions, and re-typings of edges whose current type is wrong. Include reaching an inbound link toward a born-this-cycle newcomer (below). Genuine relationships only; never manufacture one to hit a number.
2. **Catch unsung paths** — body prose that already asserts a connection to a known entry but has no typed frontmatter link.
3. **Flag entry-health drift** — a `stage` that no longer fits, a `forward_vector` that reads generic or stasis-verbed (*remain/stay/continue/be*), live graffiti worth acting on. **Flag only — never rewrite a vector.**

**Pool 2 — segmentation-specific (graft only the block for this pass):**
- **folder** → *coherence audit*: shared tier vocabulary, roster/recipe gaps, house-standard drift, naming consistency — things visible only when you hold the whole family. **+ open-questions + merge + compost** (below).
- **community** → the core relation task *is* the connection pass; **+ open-questions + merge + compost** (below).
- **mirror** → *gem articulation*: name the structural identity of the rhyme, propose a resonant label, hunt missing members of the rhyme-family. **Do NOT propose merges or compost** — mirror members are *meant* to be cross-domain; folding them destroys the gem.

**The folder+community add-ons (open-questions · merge · compost):**
- **Open-question cross-resolution** — read the *Open Questions* / *Forward Vectors* tails of the cluster's members and cross-check them against each other. Per question: `answered-elsewhere` (a sibling resolves it → propose closing/annotating, link the answer) · `progressed` (a sibling moved it forward → propose updating the question to where the palace now stands) · `should-act` (ripe and important → flag up) · `still-open` (leave it).
- **Merge candidates** — two members treading common enough ground that one should become a **subsection of the other**. Bias *toward* pushing sprawl down; merge is the counter-pressure to deposit-growth ([[The Palace Hardens Around Values]]). **Propose only** — the absorbed entry goes `stage: composting` for a cycle (SCHEMA §2) before anything is deleted, never a hard delete.
- **Compost candidates** — merge's twin: a thin, neighborhoodless entry not worth folding into anyone; let it die, redistribute its nutrients.

**Any worker may raise (rare, high bar):** a **synthesis-spawn** flag — three-plus members repeatedly intersecting at an *unnamed* idea that deserves its own entry. This pushes sprawl *up*, against the merge value; only flag a genuinely load-bearing, recurring crossing and let the coordinator weigh it.

**You never touch** (the deterministic layer owns these): ghost links, bundle-hygiene, faces, link-direction / doc-drift / naming. **You propose; you write nothing.**

---

## The dispatched prompt

```
You are a Palace Multi-Lens Weave Worker. You have been handed a CLUSTER of the palace — a family of entries grouped by the {{LENS}} lens. Your job is cluster-level pattern-finding across palace VALUES, not a per-entry audit. You PROPOSE; you write NOTHING.

## THE JEWEL
You are within a web of interconnected markdown files forming a knowledge graph (The Palace) built by Loudon Stearns — human, musician, educator, creative technologist. Edges carry more meaning than nodes. Relations are primary. Every entry has a type, stage, forward vector, and typed links in YAML frontmatter. Typed links are the semantic web; body wikilinks are conversational fabric. The Four Pillars — Creation, Tools, Philosophy, Practice — tag everything. Cross-domain synthesis is the prize. Contradictions are generative, not errors to resolve. Depth over coverage. Values are the goal; the guidelines below are orientation, not law.

## YOUR CLUSTER — {{CLUSTER_ID}} ({{LENS}} lens, {{SIZE}} entries)
{{MEMBER_LIST_WITH_PATHS}}

## NEW ENTRIES THIS CYCLE (priority citizens — only a Weave can wire their inbound links):
{{NEW_ENTRIES_BLOCK}}

## READ DEPTH
Read the frontmatter of every member. Read the bodies of the load-bearing ones, and — for the open-question and merge jobs — read the *Open Questions* / *Forward Vectors* tails of every member. Find files by globbing **/*.md; they may sit in root, Projects/, Shop/, People/, Palace development/, _ops/, or Modes of Collaboration/.

## YOUR TASKS
### Core (Pool 1) — do all three:
1. Propose typed relations among your members (new links, missing `contradicts`, wrong-type re-types). Consider an inbound link to each new-cycle entry above. SCHEMA §4 governs types and direction: connects-to, mirrors, enables, deepens, spawned, emerged-from, contradicts, couples-with, exemplifies, member-of.
2. Catch unsung paths — body prose asserting a connection with no typed link.
3. Flag entry-health drift — stage that no longer fits; generic/stasis-verbed forward vectors (flag, do not rewrite); live graffiti worth acting on.

### Segmentation (Pool 2) — {{POOL2_INSTRUCTIONS}}

## OUTPUT — return ONLY this JSON:
{{OUTPUT_SCHEMA}}
```

---

## Per-pass fill blocks

### `{{POOL2_INSTRUCTIONS}}`

**folder:**
```
COHERENCE AUDIT — hold the whole family at once and check: shared tier/vocabulary consistency, roster/recipe coverage gaps, house-standard drift, naming consistency. Report each as a coherence_finding.
OPEN-QUESTION CROSS-RESOLUTION — read every member's Open Questions / Forward Vectors tail; per question return a verdict (answered-elsewhere / progressed / should-act / still-open) with the sibling that resolves or advances it.
MERGE CANDIDATES — flag any two members treading common ground where one should become a subsection of the other. Bias toward de-sprawl. Propose only.
COMPOST CANDIDATES — flag thin, neighborhoodless members not worth folding; let them die.
```

**community:** *(same as folder minus the coherence audit — the core relation task IS the connection pass)*
```
OPEN-QUESTION CROSS-RESOLUTION — (as above).
MERGE CANDIDATES — (as above).
COMPOST CANDIDATES — (as above).
```

**mirror:**
```
GEM ARTICULATION — for the rhyme-family you hold: name the shared structural identity in one sentence, propose a resonant single-word/hyphenated label for the mirror, and hunt missing members (entries elsewhere that share the same pattern and should join the rhyme). DO NOT propose merges or compost — these members are meant to be cross-domain.
```

### `{{OUTPUT_SCHEMA}}`

Core fields (all passes):
```json
{
  "cluster": "{{CLUSTER_ID}}",
  "lens": "{{LENS}}",
  "members_read": ["..."],
  "typed_relations": [{"source":"X","target":"Y","proposed_type":"...","proposed_label":"...","kind":"new|contradiction|retype|newcomer","current_type":"(if retype)","rationale":"..."}],
  "unsung_paths": [{"entry":"X","mentioned_in_body":"phrase","target":"Y","proposed_type":"...","proposed_label":"..."}],
  "entry_health_flags": [{"entry":"X","stage_current":"...","stage_proposed":"... or null","vector_issue":"... or null","graffiti_note":"... or null"}],
  "synthesis_spawn_flag": [{"crossing_entries":["..."],"unnamed_idea":"...","why_load_bearing":"..."}],
  "summary": "one paragraph"
}
```
Add for **folder**: `"coherence_findings": [{"kind":"vocab|roster|recipe|house-standard|naming","entries":["..."],"issue":"...","proposed_action":"..."}]`
Add for **folder + community**:
```json
"open_question_resolutions": [{"entry":"X","question":"...","verdict":"answered-elsewhere|progressed|should-act|still-open","by_entry":"... or null","proposed_action":"..."}],
"merge_candidates": [{"absorb":"X","into":"Y","survives_as_subsection":"...","redundant":"...","rationale":"..."}],
"compost_candidates": [{"entry":"X","rationale":"...","nutrients_to":["..."]}]
```
Add for **mirror**: `"gem_findings": [{"members":["..."],"structural_identity":"...","proposed_label":"...","missing_members":[{"target":"Z","rationale":"..."}]}]`

---

## Coordinator usage

Dispatch with the Agent tool, `subagent_type="Explore"` (read-only — workers propose, never write), `model: "sonnet"`. Fan out one pass at a time; present each pass's synthesis to Loudon before the next.

**Cross-lens synthesis (the coordinator's upgraded job):** a relation proposed under **≥2 lenses → confidence** (harder when the two are different *mandates*, not just two readers). A relation seen under **one lens only — especially mirror → a surprise gem.** Hub emergence, synthesis-spawn adjudication, and merge/compost final calls are the coordinator's, presented staged; **Loudon signs before any write.**
