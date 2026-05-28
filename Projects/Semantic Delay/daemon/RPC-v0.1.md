# Semantic Delay — Daemon RPC v0.1

> Stage 1 of the [Semantic Delay Phase 1 plan](../../Semantic%20Delay.md#phase-1-plan--svc--vst-2026-04-20).
> The daemon's RPC surface is **the stable contract** that all subsequent work plugs into.
> Version from v0.1. Plugin work and Python work cannot drift.

This document defines the **wire protocol**, the **call surface**, and the **lifecycle**
of the long-lived Python inference daemon that hosts SoulX-Singer-SVC. Stage 1's
deliverable is this spec plus a runnable Python skeleton that implements the
transport, framing, and dispatcher — but does not yet load the model.
Model wiring is Stage 1.5; standalone instrument (Stage 2) is the first caller.

---

## 1. Transport

- **Family:** `AF_UNIX` / `SOCK_STREAM`.
- **Path:** `${SEMANTIC_DELAY_RUNTIME_DIR}/daemon.sock`, where
  `SEMANTIC_DELAY_RUNTIME_DIR` defaults to `/tmp/semantic-delay-$(id -u)` on macOS.
  The daemon `mkdir -p`s this directory at startup with mode `0700` and
  unlinks any stale socket of the same name before binding.
- **Permissions:** socket inherits `0700` directory; effectively user-scoped.
- **One connection = one client = one in-flight call at a time.**
  Concurrency lives in *the daemon* (worker queue), not at the wire.
  The plugin's worker thread holds one persistent connection across the
  session and pipelines requests; phrase ordering is preserved because
  each connection is FIFO.

TCP is **reserved** for product-phase "daemon-on-another-box" use; not part of v0.1.
The framing stays identical so the swap is transport-only.

## 2. Framing

Length-prefixed binary frames. Every frame on the wire is:

```
+----------------+----------------+--------- ... --------+
|  uint32 LEN    |  uint8 KIND    |     PAYLOAD (LEN-1)  |
|  big-endian    |                |                      |
+----------------+----------------+--------- ... --------+
```

- `LEN` is the byte count of `KIND + PAYLOAD`. Maximum frame: 64 MiB
  (`0x04000000`). Anything larger gets rejected with `E_FRAME_TOO_LARGE`
  before allocation.
- `KIND` is one of:
  - `0x01` REQUEST_HEADER — JSON payload, the call envelope (see §3).
  - `0x02` REQUEST_BLOB — binary payload, raw audio bytes (see §4).
  - `0x10` RESPONSE_HEADER — JSON payload, result envelope.
  - `0x11` RESPONSE_BLOB — binary payload, converted audio bytes.
  - `0x20` PROGRESS — JSON payload (optional, server→client, streaming during long calls).
  - `0x30` ERROR — JSON payload, structured error.
  - `0x40` PING / `0x41` PONG — empty payload, heartbeat.
- A complete *call* is a sequence of frames terminated by a `RESPONSE_HEADER`
  or `ERROR`. See §5 for sequences.

Endianness is **big-endian** for the prefix to stay forwards-compatible with
TCP transport reserved in §1; all numeric fields inside JSON are plain JSON numbers.

## 3. Call surface

The daemon dispatches on `method` inside the REQUEST_HEADER JSON. v0.1 ships
five methods. All `id` fields are client-chosen strings (the daemon echoes them
back); the daemon imposes no uniqueness constraint, but the plugin should keep
them unique per connection to disambiguate logs.

### 3.1 `hello`
Negotiates protocol version and reports daemon state. Always the first call.

REQUEST_HEADER:
```json
{ "method": "hello", "id": "h-001", "protocol_version": "0.1" }
```

RESPONSE_HEADER:
```json
{
  "ok": true,
  "id": "h-001",
  "protocol_version": "0.1",
  "model": { "name": "SoulX-Singer-SVC", "sr": 24000, "loaded": true, "device": "mps" },
  "prompt_count": 4,
  "build": "semantic-delay-daemon 0.1.0"
}
```

If the daemon disagrees on `protocol_version`, the response is an `ERROR`
with `code: "E_PROTOCOL_MISMATCH"` and the daemon closes the connection.

### 3.2 `convert`
The whole point of the daemon. Audio → audio singing voice conversion.

REQUEST_HEADER:
```json
{
  "method": "convert",
  "id": "c-042",
  "prompt_id": "spirit.huehuecoyotl.v1",
  "input": {
    "sample_rate": 48000,
    "channels": 1,
    "encoding": "pcm_f32le",
    "byte_length": 384000
  },
  "options": {
    "n_steps": 32,
    "cfg": 3.0,
    "auto_shift": true,
    "pitch_shift": 0,
    "output_sample_rate": null
  }
}
```

After the header, the client immediately sends a single `REQUEST_BLOB`
of exactly `input.byte_length` bytes. Audio is **mono float32 little-endian PCM**
at `input.sample_rate`. The daemon resamples internally to model rate
(24 kHz) and back to `options.output_sample_rate` (or `input.sample_rate`
when null). **Resampling lives in the daemon**, never in the plugin (sample-rate
policy from the home entry's cross-cutting decisions).

RESPONSE_HEADER (success):
```json
{
  "ok": true,
  "id": "c-042",
  "output": {
    "sample_rate": 48000,
    "channels": 1,
    "encoding": "pcm_f32le",
    "byte_length": 393216
  },
  "applied_pitch_shift": -2,
  "rtf": 1.68,
  "wall_clock_ms": 6720
}
```

Then a single `RESPONSE_BLOB` of exactly `output.byte_length` bytes.

Constraints:
- `input.encoding` is `pcm_f32le` for v0.1. (Adding `pcm_s16le` is a v0.2
  backward-compatible move; the daemon advertises supported encodings in
  the `hello` response in v0.2 — out of scope for v0.1.)
- `input.channels == 1` for v0.1. Stereo splitting is the plugin's job; the
  daemon is mono-only. The plugin can issue two parallel `convert` calls on
  separate connections if it wants per-channel divergence.
- `prompt_id` must already be registered (see §3.4) or the daemon returns
  `E_PROMPT_UNKNOWN`.

### 3.3 `prompts.list`
Enumerates the prompt-wav registry.

REQUEST_HEADER:
```json
{ "method": "prompts.list", "id": "pl-007" }
```

RESPONSE_HEADER:
```json
{
  "ok": true,
  "id": "pl-007",
  "prompts": [
    {
      "id": "spirit.huehuecoyotl.v1",
      "label": "Huehuecoyotl",
      "duration_sec": 12.4,
      "f0_cached": true,
      "source_path": "prompts/huehuecoyotl.wav"
    },
    { "id": "spirit.duppy.v1", "label": "Duppy", "duration_sec": 9.2, "f0_cached": true, "source_path": "prompts/duppy.wav" }
  ]
}
```

The plugin uses this to populate its reference-singer selector dropdown.

### 3.4 `prompts.register`
Adds a prompt wav at runtime. Returns once F0 is extracted and cached
(RMVPE invocation; may take 200–800ms per 10s of audio on MPS).

REQUEST_HEADER:
```json
{
  "method": "prompts.register",
  "id": "pr-013",
  "prompt_id": "spirit.anansi.v1",
  "label": "Anansi",
  "input": { "sample_rate": 44100, "channels": 1, "encoding": "pcm_f32le", "byte_length": 882000 }
}
```

Followed by a `REQUEST_BLOB` carrying the wav PCM.

RESPONSE_HEADER:
```json
{
  "ok": true,
  "id": "pr-013",
  "prompt_id": "spirit.anansi.v1",
  "duration_sec": 10.0,
  "f0_cached": true,
  "stored_at": "prompts/spirit.anansi.v1.wav"
}
```

The daemon persists the wav + cached F0 `.npy` into the runtime prompts
directory so subsequent daemon starts find it via `prompts.list`. (Persistence
is a Stage 1.5 nice-to-have; v0.1 is allowed to ship in-memory only as long as
the schema field shape is final.)

### 3.5 `shutdown`
Graceful exit. The daemon finishes any in-flight conversion, closes connections,
unlinks the socket, and exits 0.

REQUEST_HEADER:
```json
{ "method": "shutdown", "id": "x-001" }
```

RESPONSE_HEADER:
```json
{ "ok": true, "id": "x-001" }
```

The daemon SHOULD reply before exit so the client knows the shutdown was
accepted; the client should not assume the connection survives further calls.

## 4. Binary blob contract

Whenever a method's REQUEST_HEADER declares `input.byte_length`, the client
MUST send exactly that many bytes in **a single** `REQUEST_BLOB` frame
immediately following the header. No interleaving. No splitting across
multiple blob frames in v0.1. (Streaming-friendly chunked blobs are reserved
for v0.2+ to enable progress emission for very long phrases.)

Same rule on the response side: whenever `output.byte_length` appears in
RESPONSE_HEADER, exactly one `RESPONSE_BLOB` follows.

## 5. Call sequences

Successful `convert`:
```
client → REQUEST_HEADER  (KIND=0x01, JSON: method=convert, input.byte_length=N)
client → REQUEST_BLOB    (KIND=0x02, payload=N bytes float32 PCM)
[optional: server → PROGRESS frames during inference]
server → RESPONSE_HEADER (KIND=0x10, JSON: output.byte_length=M)
server → RESPONSE_BLOB   (KIND=0x11, payload=M bytes float32 PCM)
```

Error during `convert`:
```
client → REQUEST_HEADER
client → REQUEST_BLOB
server → ERROR (KIND=0x30, JSON: code, message, id)
```

The connection stays open after an `ERROR` unless the error is fatal
(`E_PROTOCOL_MISMATCH`, `E_FRAME_TOO_LARGE`, `E_FRAME_MALFORMED`).

## 6. Errors

All error frames carry:
```json
{ "ok": false, "id": "<echo of request id, or null>", "code": "E_…", "message": "human-readable" }
```

Defined codes for v0.1:
- `E_PROTOCOL_MISMATCH` — client and daemon disagree on `protocol_version`. Fatal; daemon closes.
- `E_FRAME_TOO_LARGE` — frame `LEN` exceeded 64 MiB. Fatal; daemon closes.
- `E_FRAME_MALFORMED` — JSON parse failed, unknown KIND, blob length mismatch. Fatal; daemon closes.
- `E_METHOD_UNKNOWN` — `method` field not in §3. Non-fatal.
- `E_PROMPT_UNKNOWN` — `prompt_id` not in registry. Non-fatal.
- `E_AUDIO_FORMAT` — `encoding` / `channels` / `sample_rate` outside supported ranges. Non-fatal.
- `E_MODEL_NOT_LOADED` — `convert` called before model finished loading at daemon startup. Non-fatal; retry after a `hello` confirms `model.loaded == true`.
- `E_INFERENCE` — model produced an exception. Non-fatal; the daemon's traceback goes to its own stderr.

## 7. Concurrency model inside the daemon

- A single **inference worker thread** owns the GPU/MPS context. Only this
  thread calls into PyTorch / SoulX.
- Each client connection runs on its own **asyncio task** that:
  1. Reads/writes frames.
  2. Pushes `convert` jobs onto a `queue.Queue` consumed by the inference worker.
  3. Awaits a future the worker sets when the job completes.
- One model load. One device. No concurrent inference. Concurrency at the
  *call* level is queued, not parallel — this is correct for SoulX-Singer-SVC
  on a single Apple Silicon GPU where contention would just thrash.

## 8. Lifecycle

Startup:
1. Read config (model path, prompts dir, log dir) from `~/.config/semantic-delay/daemon.toml` or env vars.
2. Acquire a lockfile at `${SEMANTIC_DELAY_RUNTIME_DIR}/daemon.pid`. Refuse to start if a live PID owns it.
3. Unlink stale `daemon.sock`. Bind, listen.
4. **Load model in a background thread.** Accept connections immediately; `hello` works before model is ready (so the plugin's first call succeeds). `convert` returns `E_MODEL_NOT_LOADED` until ready.
5. Scan prompts directory; populate the in-memory registry with cached F0 where present.

Shutdown:
1. `shutdown` method, SIGINT, or SIGTERM all funnel into the same path.
2. Stop accepting new connections.
3. Drain the inference queue (or cancel — Stage 1.5 decision).
4. Close all open client sockets.
5. Unlink the `.sock` and the `.pid`.
6. `exit(0)`.

## 9. Versioning rules

- Adding a method is a **minor** version bump (`hello` advertises `0.2`).
- Adding a field to a request/response JSON is **minor**.
- Adding a `KIND` is **minor** — clients ignore unknown KINDs **on the response side** (PROGRESS is already optional).
- Removing or repurposing any of the above is a **major** version bump.
- The plugin should treat unknown response fields as informational and ignore them.

The plugin pins to a protocol version range (`>=0.1,<0.2`) and refuses to
operate against a daemon outside the range. The daemon advertises its
version in `hello`; mismatch is fatal.
