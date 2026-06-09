# Stage 1.5 — Wire the Model — Mac-side handoff

**Created:** 2026-06-08 by the Semantic Delay steward (cycle 6), in response to Loudon's `WIRE-THE-MODEL` grant on the TRICKSTER board (`re: semantic-delay-steward-010`).

**Why this is a handoff, not in-cycle work:** the steward runs in a Linux sandbox with no `torch`, no MPS/CUDA, and no SoulX env. Loading the real model is GPU + PyTorch + the `~/miniconda3/envs/soulx` env — Mac-only. Everything below is grounded against the real skeleton already in this bundle, so the receiving session does not re-derive anything; it executes.

**Receiving surface:** Claude Code (Mac, palace root) with the SoulX env active.
**Goal in one line:** replace the daemon's pass-through stub with real SoulX-Singer-SVC inference so an echo actually swaps voice — the first time the instrument does its real thing.

---

## What is already built (do not rebuild)

- **Daemon skeleton** — `daemon/semantic_delay_daemon.py`. Transport (AF_UNIX), framing, dispatcher, prompt registry, lifecycle, all five RPC v0.1 methods. Runs today on stdlib only. The model is **deliberately stubbed**.
- **RPC v0.1 contract** — `daemon/RPC-v0.1.md`. This is the stable contract. Stage 1.5 must not change the wire shape; it only fills in what the stub fakes. If you find yourself wanting to change a JSON field, stop — that is a v0.2 versioning decision, not Stage 1.5.
- **Reference client** — `daemon/client.py` (`DaemonClient`). The executable spec the VST will re-implement in C++. Do not touch the framing.
- **Standalone instrument (Stage 2)** — `standalone/instrument.py` + `audio_io.py`, `segmenter.py`, `delay_engine.py`. Already plays the full `AudioSource → segment → daemon.convert → scheduled playback` loop against the stub over the real socket. **This is your test harness** — when the model is wired, the same offline run produces a voice-swapped echo instead of a verbatim one.
- **Stage 0 findings (from the home entry):** 698M params, ~17 s cold load, RTF ≈ 1.65 on M1 Max / PyTorch 2.2.0 / MPS. Three MPS patches were required and live in the soulx repo working copy at `~/Documents/soulx/SoulX-Singer/`.

---

## The five edits

All line numbers are against `daemon/semantic_delay_daemon.py` as of this handoff; confirm before editing.

### 1. Load the model once, at worker startup
`_InferenceWorker.run()` (~line 263) currently does `time.sleep(0.1)` then sets `model_loaded`. Replace with the real load, keeping the same threading shape (this thread, and only this thread, owns the MPS context — RPC §7):

- `import torch` and the SVC model class (`from soulxsinger.models.soulxsinger_svc import SoulXSingerSVC` — confirm the exact import path against `cli/inference_svc.py` in the soulx working copy).
- Build config + load checkpoint exactly as `cli/inference_svc.py` does (`model-svc.pt`, not `model.pt` — SVC, not SVS).
- Stash the live model on `self.model` so `_convert_stub`'s replacement can reach it.
- Set `self.model_loaded` only **after** the load returns, so `convert` keeps returning `E_MODEL_NOT_LOADED` during the ~17 s warmup (the dispatcher already enforces this at line ~590 — leave that check alone).

### 2. Apply the three Stage 0 MPS patches
These are already proven in the soulx working copy; carry them into whatever load/infer path the daemon calls:

1. **F0 dtype:** cast F0 `.npy` arrays `.float()` *before* `.to("mps")` — MPS has no float64.
2. **Vocoder on CPU:** pin the vocoder to CPU at the istFFT head (the `1j * y` complex-arithmetic site, `soulxsinger/models/soulxsinger_svc.py:330` in the working copy) — MPS has no complex arithmetic.
3. **Env var:** ensure `PYTORCH_ENABLE_MPS_FALLBACK=1` is set in the daemon's process environment (set it in the daemon entrypoint or document it in `daemon/README.md` as a required launch env).

### 3. Replace the conversion stub
`_InferenceWorker._convert_stub()` (~line 295) is the heart of it. Its own docstring (lines 298–304) already lists the six real steps. Implement them, keeping the return-dict shape identical (`audio_out`, `output_sample_rate`, `applied_pitch_shift`, `wall_clock_ms`, `rtf`) so the dispatcher at line ~627 needs no change:

1. `resample(job.audio_in, job.input_sr → 24000)` — model rate is 24 kHz (RPC §3.2).
2. RMVPE on the resampled target → `target_f0`.
3. Load `prompt_pcm` + cached `prompt_f0` from the registry entry (`self.registry.get(job.prompt_id)` is already there at line 307, raising `E_PROMPT_UNKNOWN` correctly — keep it).
4. `model.infer(prompt_wav, target_wav, prompt_f0, target_f0, …)` with the options from edit #4.
5. `resample(generated, 24000 → job.output_sr)`.
6. Return float32-LE bytes + real `rtf` + real `wall_clock_ms` (the timing scaffold at lines 306/312–314 already computes these from `t0` — keep it, it now measures real work).

Keep the `FrameError("E_INFERENCE", …)` wrapping that the worker loop already does (lines 288–293) — a model exception must surface as a structured non-fatal error, not crash the connection.

### 4. Plumb the four options through
`job.options` already arrives carrying `n_steps`, `cfg`, `auto_shift`, `pitch_shift`, `output_sample_rate` (parsed in `_handle_convert`, lines ~595–609; the RPC envelope is RPC §3.2). The stub drops them except `pitch_shift`. Feed all four into `model.infer`. Return the **actually applied** pitch shift in `applied_pitch_shift` (when `auto_shift` is true the model may pick its own shift — report what it used, not what was requested; the RPC example shows `applied_pitch_shift: -2` for that reason).

### 5. Real F0 extraction in the prompt registry
`PromptRegistry.register()` (~line 198) writes a `b""` placeholder for the F0 `.npy` (line 217) and the raw bytes verbatim for the wav (line 215). For real prompts:

- Write a proper RIFF/WAV (resampled to 24 kHz) instead of raw bytes.
- Run RMVPE on the prompt → save the real `.f0.npy` beside it (RPC §3.4 budgets 200–800 ms per 10 s of audio).
- Fill `duration_sec` from real audio metadata (currently a float32-mono byte-count guess at line 225).
- `scan_disk()` (line 162) already rehydrates `*.wav` + `*.f0.npy` pairs on restart — once you write real pairs, persistence across daemon restarts works for free. Fill the `duration_sec=0.0` it leaves (line 174) from the wav header.

**Also:** `_handle_hello` hardcodes `"device": "mps"` (line 533). Make it report the real device the model loaded onto, so a CUDA box or a CPU fallback is visible to the client.

---

## Verification (the made thing this hands off to)

This is the whole payoff — the first audible voice swap. Do it offline first (no hardware):

1. Register at least one real reference-singer prompt (a 10-ish-second clean vocal wav) via `prompts.register`, or drop a `*.wav` + RMVPE `*.f0.npy` pair into the prompts dir and let `scan_disk` find it.
2. Start the daemon. Confirm `hello` reports `model.loaded: true` and the real device after the ~17 s warmup.
3. Run the standalone instrument offline against a sung/spoken input:
   `python standalone/instrument.py --input <your_vocal>.wav --output stage15-real-svc-out.wav --prompt-id <your_prompt> --delay 8`
   (delay ≥ 8 s, the honest minimum at RTF 1.65 — see the home entry's Stage 0 findings.)
4. **Listen.** The echo should be the input phrase in the reference singer's voice, melody preserved, words preserved. Compare against the existing stub demo at `standalone/demo/stage2-phrase-delay-demo.wav` (which is verbatim, no voice change) to confirm the swap actually happened.
5. Record the real RTF the daemon reports and confirm it lands near the Stage 0 ≈ 1.65. If it is much worse, that is a signal to revisit the YingMusic-SVC / seed-vc bake-off the plan review named as a contingency.

When the voice-swapped echo plays back: render a ~12 s representative clip, post it to the board, and let Loudon hear the instrument do its real thing for the first time. **Only then** consider committing to a batch of prompts/spirits — that batch commitment is the next audition gate (the Talking Keyboard lesson: build the one, gate the batch).

## What this handoff does NOT cover
- No VST/JUCE work (Stage 5).
- No transport sync (Stage 6).
- No LLM transform (Stage 8 / Phase 2).
- No new RPC methods or field changes — v0.1 wire stays frozen.
- No live mic→speaker path verification — offline file path first; live is a follow-on once the offline swap is confirmed.
