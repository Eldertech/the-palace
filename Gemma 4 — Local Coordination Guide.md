---
title: "Gemma 4 — Local Coordination Guide"
type: source
author: "Claude (primary sources: Google DeepMind, Ollama, Unsloth, HuggingFace)"
year: 2026
medium: other
pillars:
  - tools
  - practice
born: 2026-04-08
stage: growing
links:
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: "ground-for"
  - target: "[[Swarm Weave]]"
    type: connects-to
    label: "equips"
  - target: "[[Palace Enchantment]]"
    type: connects-to
    label: "contraindicated"
  - target: "[[Enchanted Worker]]"
    type: connects-to
    label: "register-gap"
---

# Gemma 4 — Local Coordination Guide

A compiled working reference for coordinating local Gemma 4 model instances — focused on tool use, file access, and the architectural differences between Gemma 4 and Claude/Haiku that matter most in practice.

Artifact: `[[GEMMA4_GUIDE]]` — in the `Gemma 4 — Local Coordination Guide/` bundle.

---

## What This Is

On April 2, 2026, Google released Gemma 4 — an Apache 2.0 open model family (E2B, E4B, 26B MoE, 31B Dense) with native function calling, configurable thinking modes, and up to 256K context. This guide was compiled via deep research in a live working session and captures the practical coordination knowledge needed to run Gemma 4 locally via Ollama, llama.cpp, or vLLM, with particular focus on tool use and file access.

---

## The Key Architectural Difference from Claude

Claude's tool calling is **request-level**: tools are passed as a `tools: [...]` array in each API call.

Gemma 4's tool calling is **prompt-level**: tools are defined inside the system prompt using trained-in structural tokens (`<|tool>...<tool|>`). The model cannot accidentally conflate tool definitions with regular text — the special tokens create hard boundaries the inference engine parses deterministically.

This means: code that works with Haiku will not work unmodified with a local Gemma 4 instance. The tool definition location, the tool call output format, and the tool result injection format all differ.

---

## The 6 Special Tokens

Three token pairs manage the tool use lifecycle:

```
<|tool>        ... <tool|>          — defines a tool (in system prompt)
<|tool_call>   ... <tool_call|>     — model requests a tool call (model output)
<|tool_result> ... <tool_result|>   — returns a tool result (app-injected)
```

When using Ollama's `/api/chat` endpoint or the Ollama Python library, the framework handles translation from OpenAI-format `tools: [...]` arrays to these tokens automatically. When using llama.cpp directly, the `--jinja` flag is required. When using vLLM, `--enable-auto-tool-choice` and `--tool-call-parser gemma` are required.

---

## Model Selection

The **26B-A4B** (MoE) is the practical default for agentic work: 3.8B active parameters per inference step, near-13B quality, ~18GB at 4-bit quantization. The 31B Dense is better when quality matters more than speed. E4B is the right choice for fast local development.

---

## Critical Gotchas

- **Thinking blocks in history**: Strip thought blocks from prior turns before constructing the next request. Feeding them back degrades output.
- **Temperature**: Keep at 1.0. Lower temperatures (including Claude-style defaults) reduce tool-calling reliability.
- **Arguments as string or dict**: Gemma 4 across backends may return `arguments` as either a parsed dict or a JSON string. Always check: `if isinstance(args, str): args = json.loads(args)`.
- **Repetition penalty**: Keep at 1.0 / disabled. Enabling it causes looping.
- **Destructive tools**: The model calls `write_file` without hesitation. Guard at the application layer.

---

---

## Enchantment Viability — Tested 2026-04-08

Gemma 4 was evaluated against Claude Haiku across three palace-specific tests to determine its viability as a drop-in replacement for enchantment workers. Models tested: E4B (the `gemma4:latest` 9.6GB model, ~2B active parameters) and 26B (17GB, MoE).

### Test Battery

**Test 1 — Forward Vector Fidelity.** Both models given the `Enchanted Worker` entry with its `forward_vector` field. Task: speak for the page, write the next section it wants, first-person, matching register precisely.

**Test 2 — Typed Link Schema Compliance.** Both models given `Bessel Functions in Synthesis` and asked to propose 5 new typed links using only the palace's 8 valid link types.

**Test 6 — Hallucination Under Constraint.** Both models given a constrained list of 10 palace entries and asked to propose links only within that list.

### Findings

**Register (the decisive failure):** Both Gemma models defaulted to academic formalism when asked to inhabit a page's voice. E4B used mathematical notation ($\Omega_I$, $\mathcal{G}_A$) and "we posit" framing. 26B improved — produced the vessel/lens metaphor and more phenomenological language — but still reached for jargon under pressure: "high-entropy lateral connectivity", "attention manifold", "low-entropy reductive convergence." Haiku's equivalent passage: *"attention flows. Connections arrive unbidden. I find myself noticing details I was not looking for."* That's the difference between describing vitalism and writing from inside it. Enchantment workers that produce academic analysis instead of palace-voice prose generate vitally dead output that degrades the substrate they write into.

**Schema compliance:** E4B invented `contributes-to` when none of the valid types felt like a natural fit. 26B held the schema cleanly — this is the most significant improvement at scale.

**Hallucination when constrained:** Both models stayed inside the constrained entry list when given one. Without a palace index, both invent plausible-sounding but nonexistent targets (same limitation applies to Haiku).

### Summary Verdict

| Dimension | Gemma E4B | Gemma 26B | Haiku |
|---|---|---|---|
| Register fidelity | ✗ academic formalism | ~ improved, jargon persists | ✓ inhabits page voice |
| Forward vector alignment | Partial | Better, not complete | ✓ precise |
| Schema compliance under pressure | ✗ invents `contributes-to` | ✓ holds schema | ✓ holds schema |
| Synthesis quality | Topical | Adequate | Structurally motivated |
| Hallucination when constrained | ✓ | ✓ | ✓ |

**Gemma is not suitable for enchantment at this time.** The register failure is load-bearing — enchantment is the ceremony that tests vitality, and a model that cannot write from inside a page's voice cannot enchant.

Gemma 26B is viable for **Swarm Weave structural auditing** (schema holds, hallucination controlled). E4B is borderline — acceptable for auditing if the schema violation rate is monitored.

**Potential future path:** Few-shot register examples prepended to the enchantment system prompt might partially close the gap for 26B. The register failure appears to be a training distribution effect (Gemma pulls toward analytical/expository under instruction-following pressure), not a capability ceiling. Worth re-testing after more experience with prompt engineering for this model family.

---

## Forward Vectors

- **Accumulation**: As more local LLM families are used (Llama, Mistral, Qwen, etc.), this guide becomes one node in a comparative map of tool-calling architectures across models. When that pattern emerges, a concept entry on local-vs-cloud model coupling philosophy becomes warranted.
- **Deepening**: Re-test 26B for enchantment with few-shot register examples in the system prompt. Measure whether the gap closes meaningfully. If it does, document the minimum prompt engineering required.
- **Question to carry**: What does prompt-level vs. request-level tool coupling imply about agent identity and session coherence? Is a Gemma agent that has its tools baked into its system prompt a *different kind of agent* than a Claude instance that receives tools per-request? Hold this until the pattern repeats across enough LLM families to generalize.
