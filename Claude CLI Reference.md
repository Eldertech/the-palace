---
title: Claude CLI Reference
type: meta
pillars:
  - tools
  - practice
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: growing
confidence: demonstrated
energy: medium
hook_quality: 5
beauty: 4
who_leads: loudon
links:
  - target: "[[SUBSTRATE]]"
    type: enables
  - target: "[[Modes of Collaboration]]"
    type: connects-to
  - target: "[[Palace Ceremonies]]"
    type: enables
  - target: "[[Pages as Agents]]"
    type: connects-to
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
    label: tool-as-bridge
  - target: "[[Dialectic]]"
    type: connects-to
  - target: "[[Neural Granular Synthesis]]"
    type: connects-to
  - target: "[[Semantic Delay]]"
    type: connects-to
---

# Claude CLI Reference

![[Claude CLI Reference — hero.png]]

A working reference of the most useful Claude CLI commands for palace work and synthesis tool development. This is not a complete manual — see the official Anthropic Claude CLI documentation for full specs. This is a practitioner's cheat sheet.

## Conversation Management

**`/compact`** — Compress the conversation history. Summarizes earlier turns while preserving awareness of current topic. Essential for long sessions that approach the context window limit. Claude reads the entire conversation, creates a summary, and replaces the old turns with a single summary block.

**`/clear`** — Hard reset conversation history. Starts with a clean slate. Useful when a conversation has drifted or when you want to isolate a new task.

**`Ctrl+C`** — Interrupt a running tool invocation or generation. The current operation stops; Claude reports what it was doing when interrupted.

## Context and Memory

**`/memory`** — Inspect or manage Claude's persistent memory across sessions. Shows all saved memory entries. Each memory entry is a key-value pair that Claude can read at the start of any conversation. Useful for carrying state across unrelated sessions (e.g., "today's date," "current palace entry count").

```
/memory add key "value"
/memory list
/memory delete key
```

**`/files`** — List all files Claude has access to in the current session (e.g., files mounted via Cowork or passed as arguments).

**`#` prefix on a message** — Adds a note to Claude's memory. Useful for marking a specific insight to carry forward:

```
# Add to memory: Palace has 24 entries as of 2026-03-24
```

## Model Control

**`--model claude-opus-4-5`** / **`--model claude-sonnet-4-5`** — Specify which model to use at invocation:

```
claude --model claude-opus-4-5 "deep analysis task"
claude --model claude-sonnet-4-5 "quick summary"
```

**`/model`** — Switch models mid-conversation without losing context:

```
/model claude-sonnet-4-5
```

Useful for moving from exploration (fast model) to final synthesis (more capable model).

## Tool and Agent Patterns

**`--print` flag** — Non-interactive output mode. Claude processes your input, generates a response, and exits immediately without waiting for follow-up. Useful for scripting and batch operations:

```
claude --print "summarize this file" < input.txt > output.txt
```

**`--output-format json`** — Structured output as JSON. Claude formats its response as valid JSON, making it easier to pipe to other tools:

```
claude --output-format json "extract names from this list" | jq '.names[]'
```

**Piping** — Pass content via stdin:

```
cat file.txt | claude "analyze this for patterns"
cat conversation.md | claude "what did we decide about timecode?"
```

Combine with `--print` for pipeline integration:

```
find . -name "*.md" | xargs cat | claude --print --output-format json "index all topics"
```

## Palace-Specific Workflows

**Starting a palace session:**

1. Read CLAUDE.md first (it loads the entire metastructure).
2. Confirm access path (filesystem is primary for writes; GitHub for reads when offline).
3. State your intention before any write operation.
4. Use `/memory` to mark the session type (e.g., `# Session: Deposit SMPTE LTC entry`).

**Long deposit sessions:**

Use `/compact` before starting each new entry to free context space. Example:

```
# Deposit session for H045–H050

/memory add session-type "deposit"
/memory add entries-completed "[[Semantic Delay]], [[Neural Granular Synthesis]]"

[... deposit work for 3–4 entries ...]

/compact

[... continue with remaining entries ...]
```

**Multi-model palace work:**

- Use `claude-sonnet-4-5` for quick walks, reads, and assembly tasks.
- Use `claude-opus-4-5` for weave, spore checks, and synthesis across 20+ entries.

**Ceremony invocation:**

Prefix your message with a note to trigger the ceremony system:

```
# Ceremony: The Walk from [[Boundary-Crossing Instruments]]
```

The system will recognize the ceremony type from your message content and apply the right protocol.

## Modes of Collaboration

Loudon wants to learn more fun ways to interact — the CLI is one of many. See [[Modes of Collaboration]] for the fuller picture of how we work together. Other modes include:

- **[[Dialectic]]** — Competing philosophies as people in genuine dialogue — the joint search for truth.
- **The Excellent Adventure** — Historical dialogue as learning technique.
- **Ceremony modes** — Deposit, Harvest, Weave, Walk, Spore Check.
- **Slow synthesis** — Systems thinking over multiple sessions.

The CLI is the command-line vector for all of these. It does not replace the web interface (claude.ai) or Cowork; it extends the palette.

## Troubleshooting

**Context window exceeded:** Use `/compact` or split into multiple sessions.

**Model too slow:** Try `--model claude-sonnet-4-5` for faster iteration.

**File access denied:** Check `/files` to see what's mounted. May need to re-mount with Cowork.

**Memory lost between sessions:** Memory is persistent within an authentication session. If you switch browsers or clear credentials, memory resets.

---

*Last updated: 2026-03-24. See the official Anthropic Claude documentation for complete CLI reference and latest features.*
