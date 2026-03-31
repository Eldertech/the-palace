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

### Deferred to Next Session
- [items too large or uncertain for this session]
```

---

## Running a Swarm in Claude Code

### Step 1: Choose entries
```bash
python3 _ops/swarm/extract-neighborhood.py --list
```

### Step 2: Generate worker prompts
```bash
python3 _ops/swarm/extract-neighborhood.py "Entry Name" --template
```

### Step 3: Dispatch workers
Use the Agent tool with `subagent_type="Explore"`. Dispatch up to 5 workers in parallel in a single message.

**Model selection:** Default to `model: "haiku"` for all routine swarm workers. Haiku produces comparable audit quality at ~50-80x lower cost than Opus. Reserve Opus for:
- The coordinator synthesis step (cross-worker convergence, judgment calls)
- Individual deep-dive audits on philosophically complex entries
- Sessions where link-type upgrade reasoning needs to be especially rigorous

Quality comparison (validated 2026-03-31, 5-entry parallel test):
- Haiku matches Opus on: JSON compliance, stage assessment, missing connections, body health diagnostics
- Opus has edge on: cross-domain philosophical leaps, evocative link labels
- Haiku surprised on: granular body analysis (caught incomplete sentences), proposed link-type upgrades (e.g., `contrasts-with` for Semantic Delay ↔ Retrospective Delay)

### Step 4: Synthesize
Collect all worker JSON outputs. Apply the synthesis protocol above. Present to Loudon (the Trickster) for approval before writing any changes.

### Step 5: Apply approved changes
Edit entries, commit with: `Swarm audit — [date] — [N entries audited, key findings]`
