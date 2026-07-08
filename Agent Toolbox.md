---
title: Agent Toolbox
type: meta
pillars:
  - tools
  - practice
born: 2026-07
stage: growing
status: canonical
links:
  - target: "[[Concierge]]"
    type: enables
    label: dispatches-with-a-profile
  - target: "[[Agent Wellbeing]]"
    type: connects-to
    label: lowers-the-baseline-the-dial-watches
  - target: "[[The Shop]]"
    type: emerged-from
    label: ported-toolbox-technique
  - target: "[[assume multi-agent]]"
    type: connects-to
    label: least-privilege
forward_vector: "I am the readable canon list of what each palace worker is allowed to touch — give an agent exactly what it needs and nothing more. I keep the tool surface small so the damage stays small and the context stays light, and I regenerate the harness config so nobody hand-edits a hidden folder."
---

# Agent Toolbox

The palace's roster of **agent profiles** — each a named worker with a declared minimal tool set, and nothing more. This is the port of [[The Shop]]'s `toolbox` technique (which pins the exact runtimes a Specialist needs) onto the *agents* the palace dispatches: give each worker what its job requires and no more.

Two things fall out of a small tool surface, and both matter:

- **Capability is blast radius.** A read-only gatherer *cannot* mutate the palace or the machine — the safety is structural, not a matter of trusting the agent's restraint. Fewer tools, less damage possible. See [[assume multi-agent]].
- **A lean surface is a light context.** Measured 2026-07-08 ([[Agent Wellbeing — proof — sensor-b-characterization]]): a general-purpose subagent carries ~46K tokens (Haiku) of floor **+ tool schemas** before any work; a read-only agent that drops the heavy MCP toolsets (Blender, Chrome, PDF, computer-use…) runs at ~16K — a **64% lighter baseline**. Those MCP schemas are pure weight for a palace worker that never calls them, and they're the biggest single load an agent carries.

## Canon is the source of truth; the harness config is generated

This list is the truth. The harness (Claude Code) reads agent definitions from `.claude/agents/*.md` — a hidden folder nobody should hand-edit. So the profiles below are **projected** into that folder by `_ops/agent-toolbox/generate.mjs`, exactly as the `_`-symlinks project spaced files for `@import` and the [[The Commons|Commons]] reads the Shop toolbox to build. Edit *here*; run the generator; the config follows. Custom agent types register at session start, so a new profile takes effect on the next session reload (confirmed 2026-07-08).

## The roster

Edit the block below to add or change a profile, then run `node _ops/agent-toolbox/generate.mjs`. Tool names are Claude Code's built-ins; **omitting a tool omits its schema** (that is the whole point — unlisted MCP toolsets never load). The escalation is monotonic: reader ⊂ writer ⊂ orchestrator.

```yaml
profiles:
  palace-reader:
    for: "Read-only palace work + web verification — the gatherer and oracle postures, and any read/search task. Cannot write a file, run a shell, or spawn an agent."
    tools: [Read, Grep, Glob, WebSearch, WebFetch]
  palace-writer:
    for: "Palace work that writes — the curator posture, deposit drafting, entry edits. Adds file writes and a shell for git + the _ops ceremony scripts."
    tools: [Read, Grep, Glob, Edit, Write, Bash, WebSearch, WebFetch]
  palace-orchestrator:
    for: "Dispatches other palace agents — songlines, stewardship cycles, fan-out. Adds agent spawning and inter-agent messaging."
    tools: [Read, Grep, Glob, Edit, Write, Bash, WebSearch, WebFetch, Task, SendMessage]
```

**Default to the smallest that fits.** Most Concierge addresses are reads → `palace-reader`. Reach for `palace-writer` only when the job actually mutates canon, and `palace-orchestrator` only when it dispatches other agents. A job that could run as a reader but is dispatched as an orchestrator is wasting both safety and ~30K of context.

## The shared charter

Every generated profile inherits the palace worker character in its system prompt: **read before you write, cite the file for every claim, hand back drafts rather than acting, speak plainly** ([[The Palace Voice]]). The tool list is the hard boundary; the charter is the soft one. The generator writes both.

## Open edges

- **Verify the spawn-tool name.** The orchestrator lists `Task` (Claude Code's canonical subagent tool); this harness surfaces it as `Agent`. First real dispatch confirms which name the config honors — adjust the block if needed.
- **Per-project toolboxes.** A Specialist that needs Blender genuinely needs Blender. Those stay [[The Shop]]'s per-project `toolbox` bundles; this roster is for *palace-graph* workers, not creative-tool Specialists. Where the two meet (an orchestrator dispatching a Shop Specialist) is an edge to watch.
- **Concierge wiring.** The `concierge` skill should spawn with `palace-reader` by default and escalate per posture. Wiring that into the skill is the next step once these profiles are proven in a live dispatch.
