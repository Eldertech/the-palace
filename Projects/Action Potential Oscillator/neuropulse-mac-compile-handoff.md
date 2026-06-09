# NeuroPulse — Mac-side compile handoff

**From:** Action Potential Oscillator steward, cycle 4 (2026-06-08)
**To:** A Claude Code session on Loudon's Mac (palace root), or Loudon at a terminal
**Why this exists:** The steward sandbox is Linux-arm64 with no working Faust compiler
(libfaust-wasm crashes even on `process = _;`). So the three structural fixes below
are **manual-review only** — they have not been confirmed by a real compiler. This note
is the one thing that closes that gap: run one compile on the Mac.

## What changed this cycle

`Projects/Action Potential Oscillator/neuropulse.dsp` got three fixes, all one root cause
(the population layer never truly deinterleaved its 2N outputs):

1. **Single coupled state recursion.** The per-neuron state machine used to define
   `V`, `phase`, `timer`, `vel` as four separate `x = x_step ~ _;` loops — and worse,
   re-declared `phase ~ _`, `timer ~ _`, `vel ~ _` *inside* `V_step`'s `with{}`, creating
   brand-new state machines divorced from the outer ones. Replaced with one coupled
   feedback over the 4-tuple: `state(V_prev,phase_prev,timer_prev,vel_prev) = (...)`,
   closed by `sm = state ~ (_,_,_,_);` and projected with `sm : (_,!,!,!)` etc.

2. **True deinterleave via `route()`.** `par(i,N,neuron(...))` emits `V0,s0,V1,s1,…`
   interleaved. The old `deinterleave_2N = par(i,N,_),par(i,N,_)` just split the lines
   in half. Now: `route(2*N, 2*N, par(i,N,(2*i+1,i+1)), par(i,N,(2*i+2,N+i+1)))`
   sends V_i to slot i and s_i to slot N+i, giving a real `[V bus | spike bus]`.

3. **One-channel mean-field feedback.** `neuropulse = body ~ _ : (!,_)` where `body`
   returns `(mean_of_spike_bus, audio_out)` after `ro.cross(2)`, so `~` feeds exactly
   one channel (the coupling) back and audio leaves cleanly.

A signal-flow picture of the corrected graph is in the bundle:
`neuropulse-signalflow-fixed.svg`.

## The one job: compile it

```bash
cd "/Users/loudonstearns/Documents/The Palace/Projects/Action Potential Oscillator"

# fastest correctness check — just type-check / generate C++:
faust neuropulse.dsp -o /tmp/neuropulse.cpp && echo "COMPILES"

# or a runnable target to actually hear it:
faust2caqt neuropulse.dsp      # macOS CoreAudio + Qt UI
# (faust2jaqt / faust2juce / RNBO import are all fine alternatives)
```

## Things I could not verify and that I'd watch first if it errors

- **`route()` index arithmetic.** Channels are 1-based in `route()`. I used
  `(2*i+1, i+1)` for V and `(2*i+2, N+i+1)` for spike. If the V and spike buses come
  out swapped or shifted by one, this is the line to inspect.
- **`sm : (_,!,!,!)` projection sharing.** I rely on Faust's CSE to instantiate the
  `state ~ (_,_,_,_)` recursion once even though `sm` is referenced four times. If the
  compiler complains about recursion or duplicates it, bind the recursion explicitly
  and split with `ro.interleave`/cuts instead.
- **`ro.cross(2)` / `si.bus(N)` names.** Standard in `stdfaust.lib`, but if the import
  surface differs, they're in `routes.lib` (`ro.`) and `signals.lib` (`si.`).
- **`select4(int(phase_prev), …)`** assumes phase stays in 0..3. It does by construction
  (the transition table only ever emits 0..3), but a cold-start sample reads phase=0,
  which is correct (charge).

## If it compiles

Render a 20–30s sweep of `K` from 0 → 1 (slow triangle LFO, ~0.05 Hz) at default
heterogeneity and listen for the synchronization transition somewhere in K ∈ [0.05, 0.3].
That's the audible payoff — incoherent crowd snapping into a phase-locked drone. Drop the
WAV back in the bundle and ping the Action Potential Oscillator steward; the next cycle
can gate the full N-sweep batch off that one audition.
