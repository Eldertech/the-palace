---
title: Crystal Synthesizer — spec — Loudon Live sessions
born: 2026-09-25
links:
  - target: "[[Crystal Synthesizer]]"
    type: connects-to
    label: sessions-for
  - target: "[[Progressive Staging]]"
    type: couples-with
    label: pedagogical-method
  - target: "[[Bessel Functions in Synthesis]]"
    type: connects-to
  - target: "[[Loudon Live]]"
    type: connects-to
forward_vector: I hold the Loudon Live session design for each move in Crystal Synthesizer's plan — what gets built on stream, what the framing asks, what the reflecting surface asks back — so whoever builds a move can teach it without re-deriving the session. The plan itself lives in the scroll; I hold only what a session needs.
---

# Crystal Synthesizer — spec — Loudon Live sessions

The session designs for the moves in the plan on [[Crystal Synthesizer — scroll]]. The plan says what comes next and why; this says how each move is taught on [[Loudon Live]]. Only the first move has a full session design so far. The others carry the scope and development notes written when the arc was planned, and each gets its full design when it comes up. Loudon's decisions about how sessions run (the Gen~-in-RNBO build, the hypothesis-testing frame, the 70/30 making-to-framing ratio, the audience) are in the scroll's Standing Orders.

---

## Make a playable crystal in Max
*The first move · a session of about 75–90 minutes*

### Session arc

**Framing (about 20 min), led by the HTML**

Open `Projects/Crystal Synthesizer/session-1-interactive.html` on stream. Three beats:

1. *The optical fact* — a rotating crystal dispersing white light. "Crystals don't create color — they reveal what's already there. The geometry determines which frequencies go where."
2. *The pivot question* — "If we move from light to sound, what would a crystal do?" Show the basic math: THz phonon modes scaled into audio Hz. The dispersion curve's shape before anyone builds anything.
3. *The hypotheses* — all seven Bravais lattice systems, each prediction labeled **hypothesis**. "Let's build the instrument and find out if we're right."

The HTML asks; it doesn't explain. Participants arrive at the patch with a question.

**Making (about 55 min), Gen~ inside Max**

Build sequence:
1. One cubic mode — a single partial, scaled into audio. Check that sound flows.
2. The full cubic partial bank — three to six partials, ratio-locked by crystal symmetry. Test the hypothesis: does cubic sound thick and bright?
3. Swap to hexagonal — different ratios, different character. Compare directly.
4. Swap to triclinic — scattered, inharmonic partials. Does it feel chaotic?
5. Add an ADSR envelope to gate the output. Now it's playable.
6. Try all seven lattice systems — the same pitch through each. Take notes.

*What participants build:* a working monophonic Max synthesizer whose timbre is set by crystal physics, not by design choice.

### Hilaritas checklist
- [x] **A real thing to make** — a working Gen~ partial bank with a different timbre per lattice system, and real resistance in getting the frequency scaling right
- [x] **A tool that extends** — Gen~ inside Max, at or just past the edge of most producers' current reach
- [x] **A cross-domain moment** — the moment a different lattice system sounds meaningfully different. "The geometry of the unit cell is audible."
- [x] **A reflecting surface** — below

### Reflecting surface
> *"You built an instrument whose timbre was chosen by physics, not by you. Did the cubic hypothesis hold? And — where in your music-making do you currently make choices that could be handed to a system like this? Would you want to?"*

### Prerequisites

Participants need basic Max/MSP fluency, some exposure to additive synthesis, and Gen~ installed. No earlier Loudon Live session is required.

*AI catch-up prompt:*
> "I'm learning to build synthesizers in Max/MSP using Gen~. Explain what Gen~ is, how it differs from regular Max patching, and walk me through building a simple additive oscillator bank with 4 partials at fixed frequency ratios. Assume I know Max basics but haven't used Gen~ before."

### Materials
- [`session-1-interactive.html`](session-1-interactive.html) — the HTML framing piece
- [`session-1-implementation.md`](session-1-implementation.md) — Gen~ patch architecture, pseudocode, mode ratio tables
- [`proofs-menu.html`](proofs-menu.html) — every prediction already heard as a render, for the "were we right?" moment

---

## Take it on the road
*The second move · a session of about 75–90 minutes · scope only, not yet designed*

Take the playable crystal from the first move and make it polyphonic (voice allocation in Max), wrap it in RNBO, export it as an Eventide H90 preset, and introduce the Faust path.

**Cross-domain moment.** RNBO → H90 → Faust mirrors the crystal insight itself: the same underlying structure, several material projections. "One structure, many projections," made explicit in the toolchain.

**Hilaritas checklist (draft)**
- [ ] A real thing to make — a polyphonic instrument that runs on hardware
- [ ] A tool that extends — RNBO export, likely new ground for most of the audience
- [ ] A cross-domain moment — the portability path as a structural parallel to crystal symmetry
- [ ] A reflecting surface — to be written when this session is designed

---

## Let the crystal ring
*The third move · scope only, not yet designed · needs the second move first*

Each phonon mode becomes a resonant filter with a physics-derived Q (from the mode's lifetime). A broadband impulse excites it, and the modes ring down with their own decay times. This is the first move where decay is a primary parameter rather than an afterthought.

The interface starts in earnest here, and the performance gesture becomes urgent: what physical action "strikes" the crystal? How does the performer control direction, excitation pattern, and which crystal?

**Notes for development**
- Deriving Q from the anharmonic decay rate — read [[Bessel Functions in Synthesis]] first.
- This is the first place the entry's "3D rotating wireframe" visual becomes buildable.

---

## Build the prism in time
*The fourth move · scope only, not yet designed · needs the third move first*

A frequency-dependent delay derived from the real phonon dispersion relation. Each frequency travels through the "crystal" at its own speed, separating in time the way a prism separates in space. It is not a metaphor: it is the same physics in a different material.

A full VST with an interface that shows the crystal — the optical-sonic bridge made visible, with the rotating wireframe as the main surface.

**Notes for development**
- The dispersion filter is the move closest to the optical-sonic bridge, and the most teachable version of "same physics, different material."
- Its interface is the largest of any move; it wants its own design session before development begins.

---

## Hear a real mineral (stretch)
*The fifth move · a concept, not yet planned*

The full physical simulation: real crystallographic data (the Crystallography Open Database, or ICSD), the actual phonon mode structure of a chosen mineral, and full anharmonic coupling between modes. The instrument imports a real crystal and plays the sound that crystal would make. The first move asked "what do we think a crystal would sound like?"; this one answers "exactly this."

**Notes for development**
- The Crystallography Open Database is open access and machine-readable, so it is a viable source.
- It closes the hypothesis arc: the predictions made in the first move are confirmed or corrected by ground-truth data here.
- It may need a physics collaborator or a deeper literature review.
- Interface: a mineral selector (by name, by space group, by optical property) feeding a view of the actual crystal structure.

---

## Questions the moves should answer

From the entry, carried across the sessions:

- How do you hear a phonon dispersion curve directly? Is the dispersion relation itself a timbre parameter? *(the ringing and prism moves)*
- Can anharmonic mode coupling become real-time modulation? *(the ringing move)*
- Do crystals with strong optical birefringence also show strong acoustic anisotropy? *(an empirical test from the first move on)*
- The triclinic prediction is the least certain. What do we actually hear? *(the first move — the labradorite render has begun to answer it)*
- What is the performance gesture? *(the ringing move)*
