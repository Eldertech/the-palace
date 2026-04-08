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

### 4b. Label Enrichment Aggregation
Collect all `proposed_label` values from worker reports — from unsung paths, new introductions, and link type upgrade proposals. Additionally scan all existing `connects-to`, `mirrors`, and `contradicts` links in worker reports that currently lack labels; where the worker's body analysis already names the relationship more specifically, propose that word as the label. Compile into a single label proposals list, de-duplicated. Rate limit: 15 per swarm run (scaled to palace size vs. the single-agent limit of 10). Present as a discrete batch to Loudon after unsung paths and graffiti, before new introductions. A label is a permanent commitment to a specific register — Loudon approves each one.

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

### Step 2b: Set MAX_INTRODUCTIONS per worker
Before dispatching, check each entry's `born` field from the map (nodes array). Apply:
- `born` after the last Weave date → `MAX_INTRODUCTIONS = 9`
- `born` at or before the last Weave date → `MAX_INTRODUCTIONS = 3`

New entries have never been woven and have more unclaimed connection potential — they earn the higher limit. The coordinator-level cap still applies after de-duplication.

### Step 3: Dispatch workers
Use the Agent tool with `subagent_type="Explore"`. Dispatch up to 5 workers in parallel in a single message.

**Model selection:**

| Role | Model | Notes |
|---|---|---|
| Full Swarm workers | `model: "haiku"` | Default. Parallel dispatch via Agent tool. Best unsung path coverage and label quality. |
| Coordinator synthesis | Claude Sonnet (main session) | Cross-worker convergence, judgment calls, presentation to Loudon. |
| Mode 2 single-entry (zero API cost) | `gemma4:26b` via Ollama | Pre-loaded architecture — use `_ops/swarm/build-preloaded-prompt.py`. Serialized, not suitable for full swarm. See [[Swarm Weave]] Mode 2 section. |

**Do not use smaller Gemma variants for worker tasks.** `gemma4:e4b` (8B, also tagged `gemma4:latest`) missed unsung paths entirely in validation. `gemma4:e2b` (5B) produced hallucinations. Validated 2026-04-08.

Quality comparison (validated 2026-03-31, 5-entry parallel test, Haiku vs Opus):
- Haiku matches Opus on: JSON compliance, stage assessment, missing connections, body health diagnostics
- Opus has edge on: cross-domain philosophical leaps, evocative link labels
- Haiku surprised on: granular body analysis (caught incomplete sentences), proposed link-type upgrades (e.g., `contrasts-with` for Semantic Delay ↔ Retrospective Delay)

### Step 4: Synthesize
Collect all worker JSON outputs. Apply the synthesis protocol above. Present to Loudon (the Trickster) for approval before writing any changes.

### Step 5: Apply approved changes
Edit entries, commit with: `Swarm audit — [date] — [N entries audited, key findings]`
