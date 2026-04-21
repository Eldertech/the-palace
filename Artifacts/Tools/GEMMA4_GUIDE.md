# Gemma 4 — Claude's Working Guide
## Coordinating Local Gemma 4 Instances, Tool Use & File Access

> Research compiled April 8, 2026. Gemma 4 released April 2, 2026.
> This is a live reference — architecture details and APIs may evolve rapidly.

---

## 1. Model Family Overview

| Model | Type | Active Params | Context | RAM (4-bit) | Best For |
|---|---|---|---|---|---|
| E2B | Dense (Edge) | 2B effective | 128K | ~5 GB | Mobile, phones, audio agents |
| E4B | Dense (Edge) | 4B effective | 128K | ~8 GB | Laptops, on-device agents |
| 26B-A4B | MoE | 3.8B active | 256K | ~18 GB | Speed/quality balance — sweet spot |
| 31B | Dense | 31B | 256K | ~20 GB | Max quality, fine-tuning base |

**The 26B-A4B is the practical default for agentic work.** It activates only 3.8B parameters during inference — near 4B model *speed* at near-13B *quality*. The 31B is better for complex multi-step reasoning tasks where quality matters more than tokens/sec.

---

## 2. Critical Differences vs. Claude / Haiku

These are the gaps most likely to cause breakage when porting Claude-style tool calling to a local Gemma instance.

### 2a. Tool / Function Calling Architecture

| Feature | Claude (Haiku/Sonnet) | Gemma 4 |
|---|---|---|
| Tool definition location | `tools` array in API request | JSON inside `<\|tool>...<tool\|>` tokens in the **system prompt** |
| Tool call format | JSON `tool_use` content block with `type`, `id`, `name`, `input` | `<\|tool_call>...<tool_call\|>` token block with `name` + `arguments` |
| Tool result injection | `tool_result` content block with matching `tool_use_id` | `<\|tool_result>...<tool_result\|>` token block or `role: tool` message |
| "No tool call" signal | Model produces `text` block | `tool_calls` array is empty/absent; model produces `content` string |
| Parallel tool calls | Supported, reliable | Supported but reliability drops above 3 parallel calls |

**Claude's tool calling is request-level; Gemma 4's is prompt-level.** With Haiku you pass a `tools: [...]` array in every API call. With Gemma 4 via llama.cpp/Ollama/vLLM, tools are embedded in the system prompt using the 6 special tokens.

When using Gemma 4 through Ollama or vLLM with an OpenAI-compat endpoint, the framework translates OpenAI-format `tools: [...]` requests into the correct Gemma 4 special token format automatically — but only works reliably when using the native `/api/chat` endpoint (Ollama), or when `--enable-auto-tool-choice` is set (vLLM) / `--jinja` flag (llama.cpp).

### 2b. System Prompt

- **Gemma 3 and earlier**: System prompt handling was implicit or required formatting tricks.
- **Gemma 4**: Introduces **native system role support**. Use a standard `{"role": "system", "content": "..."}` message exactly as you would with Claude.
- **Tool definitions go inside the system prompt** using `<|tool>` tokens (see Section 4).
- **Thinking control also lives in the system prompt** via `<|think|>` token.

### 2c. Chat Template / Turn Format

Gemma 4 uses `<start_of_turn>` / `<end_of_turn>` tokens internally:

```
<start_of_turn>system
[system content including tool definitions]
<end_of_turn>
<start_of_turn>user
[user message]
<end_of_turn>
<start_of_turn>model
[model response, possibly including <|tool_call>...<tool_call|>]
<end_of_turn>
```

**Ollama handles this template automatically.** Do not manually inject `<start_of_turn>` when using Ollama's `/api/chat`. If using llama.cpp directly, use the `--jinja` flag to activate proper template rendering.

### 2d. Thinking Mode

Claude's extended thinking is request-level. Gemma 4's is **system-prompt-level**:

- **Enable**: Add `<|think|>` as the *first token* of the system prompt content
- **Disable**: Simply don't include it
- When enabled, model outputs a reasoning block before the final answer
- **Critical**: For multi-turn conversations, do NOT feed prior thought blocks back into context. Strip them before constructing the next turn's history. Feeding thought blocks back causes degraded behavior.
- Larger models (26B/31B) may still emit an empty thought block even when thinking is disabled — parse and discard safely

### 2e. Sampling Configuration

Gemma 4 has recommended defaults that differ from typical Claude usage:

```
temperature: 1.0
top_p: 0.95
top_k: 64
repetition_penalty: 1.0  (keep disabled / at 1.0 — enabling it causes looping)
```

Do NOT use Claude-style conservative temperatures (e.g., 0.7). Gemma 4 was tuned at 1.0. Lower temperatures reduce tool-calling reliability.

---

## 3. Serving Options (Local)

### Ollama (Recommended Starting Point)

```bash
# Requires Ollama v0.20.0+
ollama pull gemma4:26b      # 26B MoE — sweet spot
ollama pull gemma4:e4b      # 4B edge — fast, good for dev/testing
ollama pull gemma4:31b      # Full quality
ollama pull gemma4           # Defaults to e4b

# Serve with network access
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Ollama exposes two relevant endpoints:
- `http://localhost:11434/api/chat` — native Gemma 4 format, **preferred for tool calling**
- `http://localhost:11434/v1/chat/completions` — OpenAI-compat, works with OpenAI SDK

For tool calling, the **native `/api/chat` endpoint is more reliable**. Use the native URL, not `/v1`, when configuring agent frameworks.

### llama.cpp (Lower-level Control)

```bash
./llama.cpp/llama-server \
  --model gemma-4-26B-A4B-it-UD-Q4_K_XL.gguf \
  --mmproj mmproj-BF16.gguf \
  --temp 1.0 \
  --top-p 0.95 \
  --top-k 64 \
  --jinja \                          # REQUIRED for correct tool calling
  --port 8080 \
  --host 0.0.0.0 \
  --chat-template-kwargs '{"enable_thinking":false}'
```

### vLLM (High Throughput)

```bash
python -m vllm.entrypoints.openai.api_server \
  --model google/gemma-4-26B-A4B-it \
  --enable-auto-tool-choice \        # REQUIRED for tool calling
  --tool-call-parser gemma
```

---

## 4. Tool Use Deep Dive

### 4a. The 6 Special Tokens

Gemma 4 uses three token *pairs* that form hard boundaries the inference engine parses deterministically:

```
<|tool>        ... <tool|>          — defines a tool (in system prompt)
<|tool_call>   ... <tool_call|>     — model requests a tool call (model output)
<|tool_result> ... <tool_result|>   — returns a tool result (injected by app)
```

These are trained-in structural tokens, not prompt engineering conventions. Placing them in wrong positions confuses the model.

### 4b. Full Tool Definition Format (System Prompt — Raw)

```
<start_of_turn>system
You are a helpful assistant with access to tools.

<|tool>
{
  "name": "read_file",
  "description": "Read the contents of a file at the given path",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Absolute or relative path to the file"
      }
    },
    "required": ["path"]
  }
}
<tool|>

<|tool>
{
  "name": "write_file",
  "description": "Write content to a file, creating it if it does not exist",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {"type": "string", "description": "Path to write to"},
      "content": {"type": "string", "description": "Content to write"},
      "mode": {
        "type": "string",
        "enum": ["overwrite", "append"],
        "description": "Write mode, defaults to overwrite"
      }
    },
    "required": ["path", "content"]
  }
}
<tool|>
<end_of_turn>
```

### 4c. What a Tool Call Looks Like (Model Output)

When Gemma 4 wants to call a tool, its turn includes:

```
<|tool_call>
{
  "name": "read_file",
  "arguments": {
    "path": "/Users/loudonstearns/Documents/The Palace/CLAUDE.md"
  }
}
<tool_call|>
```

### 4d. Injecting Tool Results Back

Raw format:

```
<start_of_turn>tool
<|tool_result>
{"content": "# The Palace\n\nEntry point document...", "success": true}
<tool_result|>
<end_of_turn>
```

Via Ollama/OpenAI-compat format:

```python
messages.append({
    "role": "tool",
    "content": json.dumps({"content": file_content, "success": True}),
    "tool_call_id": tool_call["id"]   # optional in Ollama native format
})
```

### 4e. Via Ollama Python Library (Cleanest Interface)

Ollama's Python library accepts raw Python functions in the `tools` parameter and auto-generates JSON schema from type hints and docstrings:

```python
import ollama
import json

def read_file(path: str) -> str:
    """Read the contents of a file. Returns file content as string."""
    try:
        with open(path, 'r') as f:
            return f.read()
    except Exception as e:
        return json.dumps({"error": str(e)})

def write_file(path: str, content: str, mode: str = "overwrite") -> str:
    """Write content to a file, creating it if needed. Returns success status."""
    try:
        write_mode = 'a' if mode == 'append' else 'w'
        with open(path, write_mode) as f:
            f.write(content)
        return json.dumps({"success": True, "path": path})
    except Exception as e:
        return json.dumps({"error": str(e)})

def list_directory(path: str, recursive: bool = False) -> str:
    """List files and subdirectories at a path."""
    import os
    try:
        if recursive:
            result = []
            for root, dirs, files in os.walk(path):
                for f in files:
                    result.append(os.path.join(root, f))
        else:
            result = os.listdir(path)
        return json.dumps({"files": sorted(result)})
    except Exception as e:
        return json.dumps({"error": str(e)})

TOOL_MAP = {
    "read_file": read_file,
    "write_file": write_file,
    "list_directory": list_directory,
}

def run_file_agent(user_message: str, max_steps: int = 10) -> str:
    messages = [
        {"role": "system", "content": "You are a file system agent. Use tools to read, write, and list files."},
        {"role": "user", "content": user_message}
    ]

    for step in range(max_steps):
        response = ollama.chat(
            model='gemma4:26b',
            messages=messages,
            tools=[read_file, write_file, list_directory]
        )

        messages.append(response.message)

        if response.message.tool_calls:
            for tool_call in response.message.tool_calls:
                fn = TOOL_MAP.get(tool_call.function.name)
                args = tool_call.function.arguments
                if isinstance(args, str):
                    args = json.loads(args)  # Gemma sometimes returns args as string

                if fn:
                    result = fn(**args)
                else:
                    result = json.dumps({"error": f"Unknown tool: {tool_call.function.name}"})

                messages.append({
                    "role": "tool",
                    "content": result
                })
        else:
            return response.message.content

    return "Max steps reached"
```

---

## 5. File Access Tool Patterns

Minimal Palace-compatible toolkit:

```python
# Core file tools
def read_file(path: str) -> str:
    """Read the contents of a file. Returns file content as string."""

def write_file(path: str, content: str) -> str:
    """Write content to a file, creating it if needed."""

def append_to_file(path: str, content: str) -> str:
    """Append content to an existing file."""

def list_directory(path: str) -> str:
    """List files and subdirectories at a path."""

def file_exists(path: str) -> str:
    """Check if a file or directory exists."""

def move_file(source: str, destination: str) -> str:
    """Move or rename a file."""
```

### File Access Gotchas

1. **Validate paths before execution.** Gemma 4 may hallucinate plausible-looking paths. Always check existence before reads.
2. **JSON-encode all results.** Structured responses reduce model confusion on the next turn.
3. **Chunk large files.** For files that would approach context limits, add `start_line`/`end_line` params and read in chunks.
4. **Guard destructive operations.** The model calls `write_file` without hesitation if instructed. Build confirmation logic at the application layer.
5. **Arguments may be string or dict.** Always check: `if isinstance(args, str): args = json.loads(args)`.

---

## 6. Multi-Step Agent Loop (Reference Implementation)

```python
import json
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "gemma4:26b"

def agent_loop(user_message: str, tools: list, executor: dict, max_steps: int = 10) -> str:
    messages = [
        {"role": "system", "content": "You are a capable agent. Use tools to accomplish tasks."},
        {"role": "user", "content": user_message}
    ]

    for step in range(max_steps):
        payload = {
            "model": MODEL,
            "messages": messages,
            "tools": tools,
            "stream": False
        }

        resp = requests.post(OLLAMA_URL, json=payload).json()
        assistant_message = resp["message"]
        messages.append(assistant_message)

        tool_calls = assistant_message.get("tool_calls", [])

        if not tool_calls:
            return assistant_message["content"]

        for call in tool_calls:
            fn_name = call["function"]["name"]
            fn_args = call["function"]["arguments"]

            if isinstance(fn_args, str):
                fn_args = json.loads(fn_args)

            fn = executor.get(fn_name)
            if fn:
                try:
                    result = fn(**fn_args)
                except Exception as e:
                    result = json.dumps({"error": str(e), "tool": fn_name})
            else:
                result = json.dumps({"error": f"Unknown tool: {fn_name}"})

            messages.append({
                "role": "tool",
                "content": result if isinstance(result, str) else json.dumps(result)
            })

    return "Agent reached max steps without completing task"
```

---

## 7. MCP Integration

Gemma 4's function calling maps directly to MCP's tool use protocol.

```bash
# Serve Gemma 4 with OpenAI-compatible API via llama.cpp
llama-server -m gemma-4-26B-A4B-it-Q4_K_M.gguf \
  --port 8080 \
  --host 0.0.0.0 \
  --jinja                 # Required for tool calling

# MCP clients connect to: http://localhost:8080/v1/chat/completions
# Pass tool definitions via standard OpenAI tools parameter
```

Use the native Ollama API URL (`http://localhost:11434`) for frameworks like OpenClaw — not the `/v1` endpoint — for more reliable tool call parsing.

---

## 8. Inference Parameters (Recommended Defaults)

```python
{
    "temperature": 1.0,
    "top_p": 0.95,
    "top_k": 64,
    "repetition_penalty": 1.0,   # Keep at 1.0 — enabling causes looping
    "max_tokens": 1024,
}
```

---

## 9. Thinking Mode Integration

```python
# Enable via system prompt token
system_prompt = "<|think|>\n\nYou are a careful file system agent..."

# Via Ollama options
response = ollama.chat(
    model='gemma4:26b',
    messages=messages,
    options={"think": True}
)

# Via llama-server at launch
# --chat-template-kwargs '{"enable_thinking":true}'
```

Enable for: complex multi-step planning, research agents, multi-tool orchestration.
Disable for: simple lookups, single-tool calls, latency-sensitive paths.

---

## 10. Quantization Selection Guide

| Hardware | Recommended Quant | Notes |
|---|---|---|
| Apple Silicon 16GB | E4B 8-bit or 26B Q4_K_M | Unified memory helps |
| Apple Silicon 24GB+ | 26B UD-Q4_K_XL | Comfortable |
| NVIDIA RTX 12GB VRAM | 26B Q4_K_M | Tight fit |
| NVIDIA RTX 16-24GB | 26B or 31B Q4_K_M | Comfortable |
| CPU only | E2B 8-bit | Expect 1-3 tokens/sec |

---

## 11. Known Failure Modes

1. **Path hallucination**: Model may call read_file with plausible but nonexistent paths. Validate before executing.
2. **Parallel call degradation**: Reliability drops above 3 simultaneous tool calls. Design sequential pipelines.
3. **Too many tools**: Keep under 10-15 tool definitions per system prompt.
4. **Thinking block contamination**: If prior thought blocks are fed back into context, output quality degrades. Strip them from history.
5. **Empty thought block**: Even with thinking disabled, 26B/31B may emit `<|think|><|/think|>`. Parse and discard.
6. **Arguments as string vs. dict**: Always check type: `if isinstance(args, str): args = json.loads(args)`

---

## 12. Claude vs. Gemma 4 Tool Call Lifecycle

```
CLAUDE (Haiku)                          GEMMA 4 (local via Ollama)
──────────────────────────────────────  ──────────────────────────────────────
1. API call with tools: [...] array     1. System prompt contains <|tool>...
2. Model returns tool_use content block 2. Model returns <|tool_call>...
   {type, id, name, input}                 {name, arguments}
3. App injects tool_result block        3. App injects role: "tool" message
   with matching tool_use_id               (tool_call_id optional in Ollama)
4. Model returns text or more tool_use  4. Model returns text or more <|tool_call>
```

**Adapting Claude-style code to Gemma 4 via Ollama:**
- `type: "tool_use"` blocks → `tool_calls` array items
- `tool_use_id` matching → optional in Ollama native format
- `type: "tool_result"` → `role: "tool"` message
- `tools: [...]` in API call → auto-converted by Ollama from OpenAI format

---

*Sources: Google Gemma 4 official docs (ai.google.dev), Ollama docs, Unsloth docs, HuggingFace Gemma 4 blog, lushbinary.com agent guide, avenchat.com Ollama guide. Research date: April 8, 2026.*
