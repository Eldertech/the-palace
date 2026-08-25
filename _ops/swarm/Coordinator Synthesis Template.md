---
title: Coordinator Synthesis Template
type: meta
pillars:
  - tools
  - practice
born: 2026-04
stage: growing
links:
  - target: "[[Swarm Weave]]"
    type: connects-to
    label: synthesis-protocol
  - target: "[[Weave Ceremony]]"
    type: connects-to
    label: coordinator-phase
forward_vector: "I am the template a coordinator (human or agent) follows after dispatching workers and collecting their JSON audit reports. I keep the synthesis protocol consistent across Weave cycles; when the protocol evolves, I update."
---

# Coordinator Synthesis Template

> After dispatching workers and collecting their JSON audit reports, the coordinator (human or agent) uses this template to synthesize findings.

---

## Synthesis Protocol

Given N worker audit reports, the coordinator:

### 1. Cross-Worker Convergence Detection
Scan all reports for:
- **Same target proposed by 2+ workers** → HIGH CONFIDENCE finding
- **Same missing connection** → the gap is real, not an artifact of one worker's context
- **Same stage recommendation** → consensus on entry maturity

### 2. Cross-Worker Contradiction Detection
- **Different link types proposed for same pair** → productive tension, may be worth preserving
- **Conflicting stage assessments of shared neighbors** → investigate

### 3. Emergent Cross-Worker Connections
- Worker A proposes `Entry X → Entry Y`
- Worker B's home IS Entry Y and confirms the connection from the other direction
- This bidirectional confirmation is the strongest signal the swarm produces

### 3b. Health scans + catch-up + face batch
Run the deterministic scans against the fresh tree/map and fold their findings into the presentation — they *detect*; you and Loudon rule each finding (values-primary):
```bash
python3 _ops/swarm/new-entry-catchup.py --since <last-weave-YYYY-MM> --block   # {{NEW_ENTRIES}} + per-worker MAX_INTRODUCTIONS
python3 _ops/swarm/lint-ghost-links.py      # dead body wikilinks — invitation / fix / cut
python3 _ops/swarm/lint-bundle-hygiene.py   # frontmatter demotion candidates (invalid type gates)
python3 _ops/swarm/face-audit.py            # faces to add (definite / grey) and retire
```
`new-entry-catchup.py` computes M, each newcomer's 0.8×M target + deficit, and the lifted MAX_INTRODUCTIONS — paste its `--block` output into every worker's `{{NEW_ENTRIES}}` (Step 2b). Aggregate the workers' `new_entry_links` (did the newcomers reach target?) and `hero_avatar_request` proposals. The **face batch**: definite adds → prompts in [[Hero and Avatar Maker]]'s art direction → `Shop/Hero and Avatar Maker/make_faces.py` (the gated render Loudon approves); retires → remove the face files. Bundle-hygiene and ghost findings are demotion / link judgments Loudon rules per finding.

### 4b. Label Enrichment Aggregation
Collect all `proposed_label` values from worker reports — from unsung paths, new introductions, and link type upgrade proposals. Additionally scan all existing `connects-to`, `mirrors`, and `contradicts` links in worker reports that currently lack labels; where the worker's body analysis already names the relationship more specifically, propose that word as the label. Compile into a single label proposals list, de-duplicated. Keep it curated — a handful per swarm run, scaled to palace size; a guideline for pace, not a quota. Present as a discrete batch to Loudon after unsung paths and graffiti, before new introductions. A label is a permanent commitment to a specific register — Loudon approves each one.

### 4. Priority Sorting
Rank findings by:
1. Broken links / ghost nodes (fix immediately)
2. High-confidence convergent findings
3. Emergent cross-worker connections
4. Single-worker findings with strong rationale
5. Speculative proposals (single worker, weak rationale)

### 5. Output Format

```markdown
## Swarm Synthesis — [date] — [N] entries audited

### Convergent Findings (high confidence)
- [finding]: flagged by [Worker A], [Worker B]. [rationale]

### Cross-Worker Discoveries
- [Worker A] proposed X ↔ Y; [Worker B] confirmed from Y's perspective.

### Broken Links / Ghost Nodes
- [entry]: [[Ghost Node]] — does not exist. Action: [create/remove/redirect]

### New-Entry Induction
- [[Newcomer]] — degree N → catch-up target ~0.8×M; inbound links wired this cycle: [list]

### Faces — Add / Retire
- add (definite): [[Entry]] → render batch · add (grey): [[Entry]] (judgment) · retire: [[Entry]] (spore / composting)

### Bundle-Frontmatter Health
- [[File]] — canon frontmatter in a bundle folder / invalid type → demote? (Loudon rules)

### Proposed Actions (sorted by impact)
| # | Action | Entries | Confidence |
|---|--------|---------|------------|
| 1 | ... | ... | high/medium/low |

### Label Proposals (existing links enriched, max 15)
- [[Entry A]] —[type]→ [[Entry B]]: proposed label `word` — [one-line rationale]

### Deferred to Next Session
- [items too large or uncertain for this session]
```

**Presentation order to Loudon:** unsung paths → graffiti action queue → forward vector proposals → label proposals → new introductions. Labels come before new introductions: they are enrichment of existing structure, not new growth, and carry less deliberation cost.

---

## Running a Swarm in Claude Code

### Step 0: Build a fresh palace map
Before choosing entries, run the [[Map Build Ceremony]]:
```bash
python3 _ops/swarm/extract-neighborhood.py --build-map
```
Or trigger manually: `"Let's build the map"`. This produces `_ops/maps/palace-map-full-[date].json`. Use this file for worker neighbor resolution and coordinator topology reporting. Do not proceed with a map older than the last Deposit.

### Step 1: Choose entries
```bash
python3 _ops/swarm/extract-neighborhood.py --list
```

### Step 2: Generate worker prompts
```bash
python3 _ops/swarm/extract-neighborhood.py "Entry Name" --template
```

### Step 2b: New-entry induction — set the catch-up (Weave Ceremony Step 0b)
Before dispatching, compute two things from the fresh map:
- **The new-entry list** — entries whose `born` is after the last Weave date (or files git-added since the last Weave commit). These are the cycle's priority citizens.
- **M** — the median link-degree across established entries. Each new entry gets a **catch-up target** of ~0.8 × M (a guideline, not a gate); its allotment is the deficit to reach it, and it is *not* rate-limited.

Then prime the whole swarm toward them: fill `{{NEW_ENTRIES}}` in **every** worker prompt with the new-entry list, so each worker considers linking its own entry to the newcomers — inbound links live in the established entries, which is the only place they can be placed. Set per-worker `MAX_INTRODUCTIONS` as a soft guideline: a newcomer's own worker gets a generous handful; established workers a modest one, widened ~20% this cycle to fund the catch-up. These are pacing guidelines, not quotas (Weave Ceremony's values-primary note). Because a newcomer's target is met *by* established entries reaching for it, the catch-up enriches the old graph in the same motion.

### Step 3: Dispatch workers
Use the Agent tool with `subagent_type="Explore"`. Dispatch up to 5 workers in parallel in a single message.

**Model selection:**

| Role | Model | Notes |
|---|---|---|
| Full Swarm workers | `model: "sonnet"` | Default. Parallel dispatch via Agent tool. The palace assumes Sonnet-level intelligence and higher as its baseline (standing decision 2026-06-16); workers inherit the session model. Use Opus for the most judgment-heavy creative passes. |
| Coordinator synthesis | Main session (Sonnet/Opus) | Cross-worker convergence, judgment calls, presentation to Loudon. |
| Mode 2 single-entry (zero API cost) | `gemma4:26b` via Ollama | Pre-loaded architecture — use `_ops/swarm/build-preloaded-prompt.py`. Serialized, not suitable for full swarm. See [[Swarm Weave]] Mode 2 section. |

**Local-model floor (for the zero-API Mode 2 path only).** The smaller Gemma variants are unfit for worker tasks: `gemma4:e4b` (8B, also tagged `gemma4:latest`) missed unsung paths entirely; `gemma4:e2b` (5B) hallucinated (validated 2026-04-08). This floor governs the *local* fallback, not the cloud baseline — see [[Gemma 4 — Local Coordination Guide]].

<!-- The historical Haiku-vs-Opus quality table (2026-03-31) was cut in the 2026-06-16 weave: the palace no longer dispatches Haiku workers, so the comparison is no longer load-bearing. Git holds it. -->

### Step 4: Synthesize
Collect all worker JSON outputs. Apply the synthesis protocol above. Present to Loudon (the Trickster) for approval before writing any changes.

### Step 5: Apply approved changes
Edit entries, commit with: `Swarm audit — [date] — [N entries audited, key findings]`
