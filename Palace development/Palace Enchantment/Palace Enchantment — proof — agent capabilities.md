---
title: "Palace Enchantment — proof — agent capabilities"
born: 2026-09-26
links:
  - target: "[[Palace Enchantment]]"
    type: connects-to
    label: proof-of
  - target: "[[Swarm Weave]]"
    type: connects-to
    label: bears-on
forward_vector: "I am the dated record of what Claude's multi-agent machinery actually did when we tested it — subagents, teams, dynamic workflows, messages between sessions — so enchantment and the weave get designed on tested behavior, not on the docs or on memory. I go stale fast, and that is expected: each new battery goes on top as a dated run, and a run that no longer teaches anything is trimmed, with git keeping it."
---

# Palace Enchantment — proof — agent capabilities

Enchantment and the [[Swarm Weave]] both stand on machinery that Anthropic keeps changing under them. Until this run, the palace used `SendMessage` only to resume an agent it held — the Enchantment relay in [[Palace Enchantment]] § True Multi-Agent Isolation, and the [[Concierge]]'s resume. None of what follows — subagents messaging each other, sessions passing notes, dynamic workflows — was recorded here before. Anything written about what agents *can* do has a shelf life.

So this page holds **runs**, newest first. Each run says when, on which version, what was tried, and what happened. **Read the date before you trust a line.** If the newest run is more than a month old, or `claude --version` has moved a long way, run the battery again before you design a ceremony around a capability. The recipe is at the bottom.

---

## Run 1 — 2026-09-26

**Setup.** Claude Code 2.1.280 in the desktop app, bypass mode, Opus 5.5 as the main session. The probes were Haiku; they were mechanical checks, not enchantments, which [[Palace Enchantment]] keeps off Haiku. The test session's own lead ran on Sonnet. The agent-teams flag (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) was set to `0` in `~/.claude/settings.json` just before the run. Teams were tested only inside a throwaway command-line session that switched the flag on for itself alone.

### What held

**Subagents (flag off, desktop)**
- **Resume keeps memory.** An unnamed agent, messaged again by its ID, recalled a codeword it had been given, without reading anything.
- **A named agent stays a plain subagent.** With the flag off, its 400-number answer came back whole, with its token count.
- **Siblings talk, both ways.** One agent (beta) messaged another (alpha) that had already finished; the message woke it. It answered, and that answer woke the first one. Each wake-up's final text also goes to the parent. **The parent sees a message only if its sender copies it into that final text**; here it saw the exchange only because beta quoted alpha.
- **Progress mid-task.** A background agent sent the main conversation a note and then kept working.
- **Read-only stays read-only.** A named `palace-reader` has no messaging tool.

**Messages between sessions**
- **A round trip works.** A fresh terminal session messaged us "ready," got a ping, and answered it. Each side sees the other's name and permission mode. No prompts appeared, because both sides ran in bypass and the test session was launched set to `accept`. A bypass session *holds* messages from a session that isn't in bypass until Loudon approves them.
- **Idle notice works.** A request to be told when the other session goes idle came back with a one-line status from its last turn. It waits until your own turn ends; it doesn't interrupt.
- **A subagent's message goes out under its parent's name.** The reply comes back to the parent, not to the subagent.
- **Setup needs Loudon once.** A session started in a new folder asks him to trust the folder. His first bypass confirmation wrote `"skipDangerousModePermissionPrompt": true` to his global settings, so later sessions won't ask.

**Teams (inside the test session only)**
- **Teammates message each other directly.** They did, and each teammate's final answer reached the lead as an idle notice rather than a normal result.
- **Answers get cut off.** A teammate's 1,500-number answer arrived cut at about **4,000 characters**, ending with *"[result truncated — ask the agent for the rest via SendMessage]"*, and with no token count. This is the bug behind the "spawn it unnamed" rule in [[Concierge]] § The mechanism (commit `6c58b93a`), now measured.
- **Messaging is added even to read-only teammates.** A teammate built from a definition allowing only Read and Grep reported Read, **SendMessage**, Grep, and its message went through. So a narrow tool list doesn't keep a teammate from messaging.
- **No shared task list.** That session had no task-list tools (only TaskStop), so the teams feature that sets them apart wasn't there. Teammates could coordinate only by messaging.
- **Shutdown works.** Three of four teammates approved a shutdown request; the fourth hadn't answered by report time.
- **The desktop app probably never ran teams.** This desktop session started with the flag on and never created a team folder. Two terminal sessions that morning did. That matches the transcript survey behind commit `6c58b93a` (and `_ops/concierge/README.md`): desktop sessions named the Concierge often and never failed.

**Dynamic workflows (desktop)**
- **The basics work.** Parallel agents, then a sequence, with structured results checked against a schema: two agents and a plain-code step, all correct.
- **Palace agent types work inside a workflow.** `agentType: 'palace-reader'` kept its read-only limits.
- **Workflow agents can write files and message the main conversation mid-run.** The message arrives under the agent's raw ID, not its label. They also see the same list of other sessions.
- **Workflow agents cannot spawn agents.** They have no Agent tool.
- **Cost.** Six Haiku agents used 241K tokens in 52 seconds. Every general-purpose probe cost about **45–52K tokens before doing any work**. That is the floor [[Agent Toolbox]] measured in July, much of it tool definitions (it counts ~20K as MCP schemas). The one `palace-reader` probe, a plain Haiku subagent, cost 13.6K. Agent Toolbox measured ~26.5K for that profile in July, so either the startup floor has shrunk or the model counts differently. This is one probe. Either way, an agent's tool profile, not the palace text, sets most of the cost of waking it.

### What it means for the palace

1. **Messaging comes with the version, not the flag.** Subagents see each other by name from 2.1.206, but only if `SendMessage` is in their tools. Messages between sessions need 2.1.224. Idle notices need 2.1.236 in both sessions, and only the main conversation can ask for one. The teams flag adds teammates, not messaging.
2. **The teams flag earns nothing here.** It brings the 4,000-character cut-off and a missing task list, while named subagents already talk to each other without it. *A proposal for the process conversation, not a change:* with the flag off, the rule "held by ID, never by name" ([[Concierge]] § The mechanism) could be revisited. Naming the Concierge would let agents that carry SendMessage (`palace-orchestrator`) reach it by name. But as `palace-writer` it has no SendMessage itself, so it would still answer only to the main conversation.
3. **Direct messaging has half of enchantment's inner/outer shape.** B receives only what A wrote, so the outer layer stays isolated by structure, as § True Multi-Agent Isolation asks. But the coordinator sees an outer message only if its sender copies it into its final text. And with no relay, the coordinator can only watch: no turn budgets, no reframes, no mid-dialogue fetches, no Loudon cutting in. Only the passive mode survives. Not yet tried with enchanted pages. The test is whether the coordinator's record matches what each page actually received.
4. **Workflows are the weave's `Promise.all()`, made native.** They can be watched while they run. The docs say they are resumable and can be saved and rerun; that wasn't tried here. They run 16 agents at once by default, and the first Multi-Lens Weave used ~32. They could change how [[Palace Orchestrator]] dispatches songlines. But "workers can spawn workers" (Swarm Weave Mode 2) can't happen *inside* a workflow. A worker that wants a neighbor examined has to return that request to the script, which then dispatches it.
5. **Messages are not the board.** A message dies with the conversation, and the docs name ways it can be lost outright: a held message nobody answers within five minutes is dropped, and past 100 held messages the oldest go ([cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)). Nothing on the board records the loss. Messages are for nudges while work is in flight. Anything that has to survive goes on [[STIGMERGY]] (`SCHEMA — Reference` §9). Hold this against finding 3: §9 has agents coordinate "rather than addressing each other directly." Direct messaging now makes the other way possible, and deciding between them belongs to the process conversation.

### Not yet tested

- Whether the desktop app runs teams at all with the flag on (the evidence above is indirect).
- Where the task-list tools exist, and whether a shared task list would be worth the teams flag.
- Workflow resume after a stop, saving a workflow as a `/command`, and `isolation: 'worktree'` for parallel writers.
- A workflow agent messaging *another session*, not just the main conversation.
- Two enchanted pages talking directly, per finding 3. Voices that make nothing are headed for `palace-reader` ([[ELDER]]), which has no SendMessage, so this needs a messaging-only tool profile first.

---

## How to run the battery again

Run 1 used about 15 agents and ~1M tokens, with Haiku for the probes. Everything goes in the scratchpad, nothing in the palace. Tie each test to the ceremony it could change.

- **Subagents.** Spawn an unnamed agent with a codeword, then resume it by ID and ask for the word back. Spawn a named agent and ask for a 400-number line, to check the reply arrives whole. Spawn named `alpha`, then `beta`, which messages `alpha`; let `alpha` answer `beta`. A background agent messages `"main"` and then sleeps. A named `palace-reader` lists its tools.
- **Sessions.** Launch a test session in the Terminal panel from a scratch folder: `claude --name battery-peer --model sonnet --dangerously-skip-permissions --settings '{"env":{"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS":"1"},"crossSessionInbound":"accept"}'`, with an opening prompt telling it to message you "ready." Then run a round trip, `notify_when_idle`, and a subagent's message to the test session. The terminal tool won't close a tab Loudon has typed in, so he closes it at the end.
- **Teams, inside the test session.** Named teammates message each other. Create tasks with TaskCreate, if it exists. A teammate returns a 1,500-number line (measure the cut). A read-only teammate lists its tools and tries to message. Read the team config, then send shutdown requests.
- **Workflows.** Four parallel Haiku probes (tool list; `agentType: 'palace-reader'`; message `"main"` + ListAgents; write a scratch file), then a pipeline of an agent stage into a plain-code stage.

*Run 1's raw log lived in that session's scratchpad and is gone; this page is its durable form.*
