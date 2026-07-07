---
title: Bayesian Granular Synthesizer
type: project
pillars:
  - creation
  - tools
  - philosophy
born: 2026-06
stage: sprout
status: active
confidence: working
energy: high
hook_quality: 9
beauty: 9
who_leads: shared
last_activated: 2026-06
activation_count: 1
links:
  - target: "[[Neural Granular Synthesis]]"
    type: connects-to
    label: grain-cloud-sibling
  - target: "[[Phase Reduction]]"
    type: couples-with
    label: coupled-grains-share-a-PRC
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
    label: grain-length-is-a-timescale-knob
  - target: "[[Loudon Live]]"
    type: connects-to
    label: candidate-stage
forward_vector: "I want to become a working RNBO grain engine where the chord a player holds is a hypothesis the cloud slowly comes to believe — MIDI as Bayesian evidence sculpting a pitch posterior in real time. I want to expose the prior itself as a paintable belief, and to take a stage at Loudon Live."
---
# Bayesian Granular Synthesizer

![[Bayesian Granular Synthesizer — hero.png]]

A granular synthesizer whose central idea is a clean cross-boundary identity: **MIDI note input acts as Bayesian evidence sculpting a real-time pitch probability distribution.** With no notes held, grains sample a uniform prior — a raw, clicky cloud with no tonal center. As notes are held, Gaussian bumps form around the target pitches, their weights and widths evolving by exponential time constants, and the posterior *sharpens* as evidence accumulates. A chord is a hypothesis the cloud slowly comes to believe.

The Bayesian-evidence framing and the pitch/grain-length coupling below are Loudon's design moves; the statistical scaffolding was supplied in dialogue and the instrument was then iterated by ear across eight audio renders.

## The mechanism

The grain cloud draws each grain's pitch from a probability distribution that is *itself* a function of what is currently being played:

- **Prior (no input):** a uniform (or broad) distribution over pitch. Grains scatter across the spectrum — a textured, aperiodic cloud, deliberately clicky.
- **Evidence (notes held):** each held MIDI note contributes a Gaussian bump in log-frequency centered on its pitch. Bump weight and standard deviation evolve by exponential time constants — fast attack as a note presses, slow relaxation as it releases — so the distribution *breathes* with the playing.
- **Posterior (the sampled distribution):** the sum of prior and evidence bumps, normalized. As more notes are held longer, the posterior concentrates: grains cluster ever more tightly on the held pitches. The standard deviation tightens to roughly $\pm 5$ cents in log-frequency at full conviction.

The creative refinement that makes it *musical* rather than merely clever: **correlate pitch-distance-from-target with grain cycle length.** Grains landing near a held note become *long and tonally pure*; grains far from any held note stay *short and clicky.* This makes the cloud a **joint distribution over pitch *and* grain length**, with the coupling strength gated by the same evidence envelope that governs pitch focus. The result: as a chord is held, the cloud doesn't just pull toward the pitches — it *resolves in character*, clicky scatter condensing into sustained tone.

## The grain spec

The grain shape settled on after eight renders:

- **Envelope:** 1-cycle Hann fade-in, $N$ sustain cycles, 1-cycle Hann fade-out.
- **Length:** $N$ scales continuously from 4 to 128 cycles by pitch proximity and evidence strength — short and clicky far from targets, long and pure near them.
- **Equal-energy normalization:** amplitude $\propto \sqrt{f / \text{cycles}}$, which kills low-frequency rumble (without it, long low grains dominate the mix).
- **Coupling fade-in** gated by the evidence envelope, to remove the discontinuity at the moment a chord is pressed.

The sigma was tightened to $\pm 5$ cents in log-frequency; the coupling fade-in was the fix for the audible click at chord-press. **V7 and V8 are the confirmed-good renders** — beautiful at full hold.

## The statistics underneath, tied to e

The session grounded the design in foundational statistics, all braided back to Euler's number through the continuous-time-updating lens from Loudon's phasor intuitions: the Central Limit Theorem (why summed grain contributions tend Gaussian), the Law of Large Numbers (why the cloud's average pitch converges on the held chord as grain count grows), Poisson processes (grain onset timing), and the exponential distribution (the time constants governing how fast evidence accumulates and decays). The exponential's appearance in *both* the grain-density statistics and the evidence envelopes is the same $e$ wearing two hats — a [[Frequency-Time Duality|timescale]] echo: grain length is itself a knob on the rhythm↔pitch continuum, since a grain short enough becomes a click and long enough becomes a tone.

## Cross-Domain Resonance

- **Coupled grains share a PRC.** If grains near a held note are allowed to weakly entrain one another's onset phase, the cloud's condensation becomes a [[Phase Reduction|Kuramoto]] synchronization — the posterior sharpening and the population locking are two views of the same convergence. The [[Phase Reduction]] entry's designable Phase Response Curve is the natural control for *how* the cloud coheres, not just *where*.
- **Sibling to neural granular work.** [[Neural Granular Synthesis]] already lives in the palace as a grain-cloud project; this is its probabilistic-control sibling — same cloud, a Bayesian steering layer instead of a learned latent one.

## Forward Vectors

- Build it as a [[Loudon Live]] stage: RNBO grain engine + MIDI-evidence posterior, V8 as the reference voicing.
- Expose the **prior itself as a paintable distribution** — the player sets the "belief" the held notes then update, so the instrument's resting character is composed, not fixed.
- Wire the optional grain-entrainment coupling and audition whether population-locking adds to the condensation or muddies it.

## Lost Branches

- The broad statistics primer (CLT, LLN, Poisson, exponential) wants a future `Statistics through Synthesis` hub rather than re-documentation here — link out when that lands.

## Artifact

Eight audio renders (V1–V8) across three code generations; **V7/V8 confirmed good.** The V8 synthesis code lives in the source chat (2026-05-08) and could not be retrieved into this deposit — when pulled, store the code in the entry's bundle `[Entry]/` and, if audio examples are wanted in the palace, render V8 and place the files there too.

---

> *"A chord is a hypothesis the cloud slowly comes to believe."* — from the source dialogue, 2026-05-08
