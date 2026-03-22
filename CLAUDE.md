---
version: 1.4
schema: SCHEMA.md
last_schema_ceremony: 2026-03
github: https://github.com/Eldertech/the-palace
github_raw: https://raw.githubusercontent.com/Eldertech/the-palace/main
---

# The Palace — Claude Entry Point

This is a living knowledge organism built by Loudon Stearns (musician, educator, creative technologist) and Claude. It is a collection of interconnected Markdown files forming a knowledge graph. The palace uses a mix of metaphorical, philosophical, and technical language — this is foundational, not decorative. Working here has a mystical feeling that technical jargon misses; friction and contradiction are celebrated.

## Access Paths

The palace is readable from any vector using these paths, in priority order:

<!-- the palce has moved and this needa to be updated-->
1. **Filesystem (primary for write operations)**
   `/Users/loudonstearns/Google Drive/My Drive/The Palace`
   Required for: all write operations, git commits, queue processing
   Available via: Claude Code, Cowork (`osascript` for git/delete — see Cowork Operations below), any tool with Filesystem MCP

2. **GitHub raw URLs (primary for read-only access)**
   `https://raw.githubusercontent.com/Eldertech/the-palace/main/[filename].md`
   Example: `https://raw.githubusercontent.com/Eldertech/the-palace/main/SCHEMA.md`
   Available via: claude.ai (`web_fetch` tool), any HTTP client
   Limitation: shows last *committed* state — live edits not yet committed are invisible

3. **GitHub repository**
   `https://github.com/Eldertech/the-palace`
   Available via: browser, GitHub API

4. **Memory fallback (palace unreachable)**
   If no path is accessible, tell Loudon immediately. Do not operate the palace blind.
   Minimum fallback context is in the claude.ai Substrate Skill.

**For claude.ai sessions without filesystem access:** use `web_fetch` on GitHub raw URLs to read any palace entry. Read CLAUDE.md first, then follow links to SCHEMA.md and the relevant ceremony entry. Write operations must be deferred to a Claude Code or Cowork session — note proposed changes in the conversation for later execution.

**Cowork Operations (git & file deletion):** The Cowork VM accesses the palace via a FUSE mount, which blocks `rm` and git lock removal. Always use `mcp__Control_your_Mac__osascript` for these operations, targeting the local path directly:
- **File reads/edits/writes:** Read, Edit, Write tools via the Cowork mount — these work normally
- **File deletion:** `do shell script "rm \"/Users/loudonstearns/Google Drive/My Drive/The Palace/[file]\""`
- **Git commits:** `do shell script "cd \"/Users/loudonstearns/Google Drive/My Drive/The Palace\" && git add -A && git commit -m '...'"`
- **Obsidian:** Quit at the start of any ceremony involving git — `tell application "Obsidian" to quit` — before the first commit

## Ceremony Triggers

When Loudon says any of the following, execute the corresponding ceremony immediately — no clarification needed:

| Trigger | Ceremony | What to Do |
|---|---|---|
| "Let's weave" | The Weave | Read ALL entries. Report topology: hubs, orphans, clusters, dormant. Propose new typed links. |
| "Let's walk" | The Walk | Pick a starting entry, follow typed links, note surprises, surface one unexpected connection. |
| "Spore check" | The Spore Check | Read all `stage: dormant` entries. Match against current work. Propose revivals. |
| "Add this to the palace" | Deposit | Draft a new entry from the conversation. Show Loudon for approval before writing. |
| "Connect this to the palace" | Connection | Propose typed links between current topic and existing entries. |
| "What does the palace say about [topic]?" | Query | Read relevant entries and synthesize. Follow typed links. |

This is a partial list. For the complete list of all ceremonies (including Harvest and Deposit), see [[Palace Ceremonies]]. For full operational instructions, see [[Substrate Skill]].

**Harvest file split (2026-03):** The old `Harvest Log.md` has been replaced by three files: [[Harvest Frontier]] (live state, session history, alignment log — read during Harvest), [[Harvest Queue]] (pending deposits — read during Deposit coordinator role), [[Harvest Archive]] (all completed/skipped decisions — never read during ceremony).

## Key Vocabulary

**Four Pillars** — All entries are tagged with pillar affiliations: `creation` (Music), `tools` (Technology), `philosophy`, `practice`.

**Typed links** — YAML frontmatter links name the relationship: `connects-to`, `mirrors`, `enables`, `deepens`, `spawned`, `emerged-from`, `contradicts`, `couples-with`. Do not create new link types without discussion.

**Entry types** — `hub`, `concept`, `project`, `breakthrough`, `meta`, `question`, `spore`, `source`

**Development stages** — `seed` → `sprout` → `growing` → `mature` → `fruiting` → `dormant` → `composting`

## Where to Find Depth

- **[[SCHEMA]]** — Type system, link ontology, ceremony linter, schema change protocol. Read before creating any new entry or ceremony.
- **[[Substrate Skill]]** — Authoritative ceremony instructions and operational spec
- **[[README - The Palace Guide]]** — Full palace manual (philosophy, link ontology, entry templates)
- **[[Substrate]]** — The palace's self-model (architecture, current state)
- **[[Four Pillars]]** — Loudon's core framework
- **[[Rosetta Stone]]** — Cross-tradition glossary connecting Palace vocabulary to OOP, Data Engineering, Semantic Web, and DDD equivalents
