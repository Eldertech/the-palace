# @stigmergy/core

The STIGMERGY coordination substrate — the one home for the contract every
STIGMERGY package shares.

In the palace, *relations are primary* — edges carry more meaning than nodes. The
§2.2 protocol is STIGMERGY's most important edge: `app`, `orchestrator`, and
`trickster-auto` all speak it. Before this package existed, that edge lived buried
*inside* one node (the app's `server/` folder), so the orchestrator had to reach
backward into the app for the validator — a circular dependency across two npm
packages (audit §1). `@stigmergy/core` gives the edge a node of its own.

## Entry points

| Import | Owns |
|---|---|
| `@stigmergy/core/schema` | The strict §2.2 wire validator (`validateMessage`). |
| `@stigmergy/core/blackboard` | Append-only JSONL read/append (`readJsonl`, `appendMessage`). |

The strict server validator lives here; the **lenient** render-side validator
(`app/src/lib/schema.js`, which returns `_warnings` for UI feedback) stays in the
app — that gate-vs-feedback divergence is intentional (audit §6).

## Rules

- **The §2.2 wire schema is sacred.** Protocol terms move here verbatim; validators
  and agent code across all packages depend on the exact shape.
- **The blackboard is append-only; git is ground truth.** One write path.

See `_ops/stigmergy/STIGMERGY Audit — 2026-06-06.md` §3 for the full extraction plan.

*Loudon Live · Autodidact Polymaths*
