---
title: State Machine
type: concept
pillars:
  - tools
  - practice
  - philosophy
born: 2026-03
stage: sprout
confidence: working
energy: high
links:
  - target: "[[Action Potential Oscillator]]"
    type: enables
  - target: "[[DSP Frameworks]]"
    type: connects-to
  - target: "[[Signal-Rate CV Architecture]]"
    type: connects-to
  - target: "[[ROSETTA]]"
    type: mirrors
  - target: "[[Progressive Staging]]"
    type: couples-with
---

# State Machine

A system that is always in exactly one state, transitions between states based on conditions, and can perform different actions depending on which state it's in. The concept is universal — it appears in hardware design, software architecture, game logic, UI flows, biological systems, and signal processing. Any process that has distinct phases with rules for moving between them is a state machine, whether or not its creator calls it one.

The [[Action Potential Oscillator]] is a state machine with four states: charge, spike rise, spike fall, and refractory recovery. A neuron is a state machine. A compressor's envelope follower is a state machine (attack vs. release). An ADSR envelope is a state machine. Recognizing the pattern is the first step; knowing how to implement it cleanly across different paradigms is the craft.

## The Core Pattern

Every state machine implementation, regardless of language or paradigm, must solve four problems:

**1. State memory.** Something must remember which state the system is currently in. In Gen~ this is a `History` object. In JavaScript it's a variable. In Python it's an attribute. In hardware it's a register. The implementation differs; the need is identical.

**2. Transition logic.** Each state has conditions under which it exits and rules for which state comes next. The conditions can be simple (a counter exceeds a threshold) or compound (voltage exceeds threshold AND the channel is not inactivated). Transition logic is where bugs live — an ambiguous or unreachable transition is the most common state machine failure.

**3. State-specific behavior.** Each state runs different math or logic. In the oscillator: Phase 0 runs an exponential charge equation; Phase 1 runs a spike rise equation; Phase 2 runs a spike fall equation; Phase 3 runs a damped spring model. The behaviors are mutually exclusive — only one runs per sample.

**4. Transition actions.** Things that happen exactly once at the moment of transition, not during the state itself. In the oscillator: when Phase 2 ends, the system latches `V_start_actual = V` — capturing the exact voltage for use in the next cycle's drive calculation. Transition actions are distinct from state behaviors. Confusing the two is the second most common state machine failure.

## Best Practices

**Name every state.** Even in languages that use numeric flags, define the names. `phase == 0` means nothing to a future reader; `phase == CHARGE` means everything. In Gen~ modules where you can't define constants, use comments religiously.

**Make transitions explicit.** Every state should have clearly documented exit conditions. If a state has no exit condition, it's a terminal state — and that should be deliberate, not accidental. If two states can both transition to a third, document both paths.

**Guard every input.** State machines are sensitive to edge cases. A frequency of 0, a time constant of 0, a negative duration — any of these can produce division by zero, infinite loops, or undefined transitions. Guard inputs with `max()`, `clamp()`, or conditionals *before* they enter the state logic, not inside it. This is especially important in [[Signal-Rate CV Architecture]] where inputs change every sample.

**Test at boundaries.** The interesting behavior of a state machine lives at its transitions. Test with values that force the system through all possible transition paths, especially short durations that compress states into a single sample.

**Avoid state proliferation.** If a state machine has more than 6–8 states, it usually means the problem has substates that should be handled with a second variable, not by multiplying primary states. The oscillator uses 4 states with auxiliary variables (`timer`, `V`, `velocity`) rather than encoding timing into additional states.

**One state variable, strict progression.** When states form a cycle (as in the oscillator), a single integer phase variable that increments and wraps is cleaner than a web of arbitrary transitions. The cycle is: 0 → 1 → 2 → 3 → 0. No state can skip ahead or jump backward. This constraint is both a simplification and a safety rail.

## Boxes and Lines: The Gen~ Module Approach

In a visual dataflow environment like Max/MSP Gen~, there are no `if` statements. Every signal path computes every sample. A state machine must be implemented by **computing all branches in parallel and selecting the correct output**.

The pattern:

```
[compute Phase 0 result]──┐
[compute Phase 1 result]──┤
[compute Phase 2 result]──┼──[switch selects by flag]──▶ output
[compute Phase 3 result]──┘
```

Each branch computes its result regardless of whether it's active. The `switch` object (or a chain of `switch` objects) selects which branch's output passes through, based on a `History phase` flag.

Gen~ `switch` inlet order: `switch(condition, value_if_true, value_if_false)`. Condition is the first inlet. This is the opposite of most programming languages' ternary operator and a persistent source of bugs. Verify it every time.

**Transition flags** follow the same pattern. Each transition condition (e.g., "timer exceeded spike_rise_samps") is computed continuously, but the transition action only fires when the condition is true AND the system is in the correct source state. A flag like `phase_0_to_1 = (phase == 0) * (V >= 1.0)` is computed every sample. Only when it's nonzero does the transition happen.

**Strengths of the visual approach:**

- Every computation is visible simultaneously — nothing is hidden inside a branch
- Signal flow is explicit; data dependencies are literally wires
- Students can probe any wire with a `number~` to see per-sample values
- The parallel-compute-then-select pattern is itself an important DSP concept

**The threshold:** This approach works well for 3 states. At 4 states it becomes manageable but dense — the [[Action Potential Oscillator]] Stage 3 was built this way with 3 states and it worked. At 5+ states, the parallel computation and switch cascades become unwieldy: too many wires crossing, too many objects, too hard to read or debug. When the visual representation of the state machine is harder to parse than its equivalent code, it's time to move to a textual language.

## The Textual Transition: Codebox, JavaScript, Python, Faust

When a state machine outgrows boxes and lines, a textual language provides `if/else` branching — only the active state's code runs. The same four-state oscillator that required dozens of parallel objects in Gen~ modules becomes a single `if/else if` chain in codebox:

```
// Gen~ codebox — the active branch runs, others are skipped
if (phase == 0) {
    // charge: exponential approach toward threshold
    V = V + (drive - V / leak_tau) * one_over_sr;
    if (V >= 1.0) {
        phase = 1;
        timer = 0;
    }
} else if (phase == 1) {
    // spike rise
    ...
} else if (phase == 2) {
    // spike fall
    ...
} else {
    // refractory recovery
    ...
}
```

In JavaScript (Web Audio `AudioWorkletProcessor.process()`), the same pattern applies but with class-level state:

```javascript
// state persists across process() calls
if (this.phase === 0) {
    this.v += (drive - this.v / leakTau) * dt;
    if (this.v >= 1.0) {
        this.phase = 1;
        this.timer = 0;
    }
}
```

In Python (offline rendering or NumPy per-sample loop), state is an instance attribute:

```python
# per-sample update
if self.phase == 0:
    self.v += (drive - self.v / leak_tau) * dt
    if self.v >= 1.0:
        self.phase = 1
        self.timer = 0
```

In Faust, the functional paradigm requires a different approach — state is threaded through recursive `letrec` or `~` feedback:

```
// Faust — state carried as feedback signals
phase, V, timer = neuron(freq, leak_tau, ...)
    with {
        // transition logic expressed as conditional signal selection
        next_phase = ba.if(phase==0 & V>=1.0, 1,
                     ba.if(phase==1 & timer>=rise_samps, 2,
                     ...));
    };
```

**The pattern is identical across all four languages.** State memory, transition conditions, state-specific behavior, transition actions. Only the syntax and the mechanism for persistent state differ. This is what makes the state machine a [[ROSETTA]] concept — learn it in one language, recognize it in all of them.

## When to Cross the Line

The transition from visual to textual is not about preference. It's about a measurable threshold:

**Stay visual when:**

- The state count is ≤ 3
- Students need to see all branches simultaneously
- Probing individual signals with `number~` is part of the learning
- The visual layout fits on one screen without scrolling

**Move to text when:**

- The state count reaches 4+
- Transition actions are coupled (one transition sets multiple variables)
- The parallel-compute overhead becomes wasteful or confusing
- Debugging requires reading logic flow, not tracing wires

In the [[Action Potential Oscillator]], Stage 3 (3 states) was built in Gen~ modules. Stage 4 (4 states) moved to codebox. That boundary was the right place — and the transition itself became a teaching moment: the students see the same math work both ways, and they experience firsthand why textual representation wins at a certain complexity threshold.

## Cross-Domain Resonance

The state machine pattern crosses every domain in the palace:

- **Neurobiology**: the action potential itself is a state machine — resting → depolarizing → repolarizing → refractory. Ion channel gating variables (m, h, n in Hodgkin-Huxley) are state machines nested inside the larger state machine.
- **Music**: ADSR envelopes, arpeggiator patterns, sequencer logic, compressor attack/release modes. Most audio processes that behave differently over time are state machines.
- **UI/UX**: dialog flows, form validation, game screens. The states are visible to the user.
- **[[DSP Frameworks]]**: choosing a framework partly determines how naturally state machines can be expressed — Faust's functional approach requires threading state through feedback; Gen~ codebox allows imperative branching; JUCE/C++ gives full object-oriented state encapsulation.

## Open Questions

- At what population size does a field of coupled state machines (e.g., a neuron population) need a fundamentally different implementation strategy? Per-neuron if/else chains don't vectorize well — is there a matrix formulation where all neurons' states advance in parallel without branching?
- The visual state machine (Gen~ modules) has pedagogical virtues that code doesn't: you can see all branches at once, you can probe any wire. Is there a hybrid visualization — a codebox that can render its branches as a flowchart — that would combine the best of both?
- Faust's functional state threading is philosophically different from imperative if/else. Does that difference produce different musical results when the state machine is the oscillator itself, or is it purely a notation difference?
