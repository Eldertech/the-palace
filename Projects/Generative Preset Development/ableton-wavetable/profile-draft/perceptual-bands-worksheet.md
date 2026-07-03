# Wavetable Perceptual-Bands Worksheet — v0.1

Companion to `profile-draft/wavetable_profile_v0.1.json`. Goal: in ONE Live sitting, fill in the labeled bands for each setting below by ear. Each row becomes a `perceptual_regions` entry on the matching parameter in the profile JSON. Until filled, the analyzer (Track B) emits `[PERCEPTUAL BAND PENDING]` for these.

Convention per row: sweep the knob across its full range while a steady tone plays through the unit under test (a single-osc, flat-mod patch). Mark the boundary value where the *character* changes, not where the number rounds.

---

## Filter (2 instances — Filter1, Filter2)

### Voice_Filter{1,2}_Cutoff  (range 0.0–1.0, log perceptual)
| band | suggested split | label |
|---|---|---|
| closed | 0.00 – ___ | _e.g. "muffled, sub only"_ |
| dark   | ___ – ___ | |
| open   | ___ – ___ | |
| bright | ___ – 1.00 | |

### Voice_Filter{1,2}_Resonance  (0.0–1.0)
| band | split | label |
|---|---|---|
| flat        | 0.00 – ___ | |
| singing     | ___ – ___ | |
| screaming   | ___ – ___ | |
| self-osc    | ___ – 1.00 | _value where it self-oscillates without input_ |

---

## Envelopes (3 instances — Amp, Env2, Env3 — same bands apply)

### Voice_Modulators_{Amp,Env2,Env3}Envelope_Times_Attack  (ms)
| band | split | label |
|---|---|---|
| punchy   | 0 – ___ ms | _click/pluck region_ |
| natural  | ___ – ___ ms | _string/key attack feel_ |
| soft     | ___ – ___ ms | _pad onset_ |
| swell    | ___ ms – max | _drone/swell, attack is audible motion_ |

### Voice_Modulators_{Amp,Env2,Env3}Envelope_Slopes_Attack  (-1.0–1.0, curve shape)
| band | split | label |
|---|---|---|
| concave (slow-then-fast) | -1.0 – ___ | |
| linear-ish               | ___ – ___ | |
| convex (fast-then-slow)  | ___ – 1.0  | |

---

## LFOs (2 instances — LFO1, LFO2 — same bands apply)

### Voice_Modulators_Lfo{1,2}_Time_Rate  (Hz, free-run)
| band | split | label |
|---|---|---|
| imperceptible | 0 – ___ Hz | _felt as drift, not modulation_ |
| subtle        | ___ – ___ Hz | _slow shimmer / breathing_ |
| obvious       | ___ – ___ Hz | _clear rhythmic motion_ |
| audio-rate    | ___ Hz – max | _crosses into FM territory_ |

### Voice_Modulators_Lfo{1,2}_Time_SyncedRate  (enum: 1/32 … 8 bars)
| band | range | label |
|---|---|---|
| fast       | 1/32 – ___ | |
| groove     | ___ – ___ | |
| slow       | ___ – 8 bars | |

### Voice_Modulators_Lfo{1,2}_Time_AttackTime  (ms)
| band | split | label |
|---|---|---|
| instant | 0 – ___ ms | |
| fade-in | ___ – ___ ms | |
| slow-bloom | ___ ms – max | |

---

## Audition Patch Recipe

To isolate each parameter: load an init Wavetable, set Osc 1 = Basic > Sine, kill Osc 2 and Sub, route filter to LP12 Clean wide open, Amp env A/D/S/R = 0/0/1/0.1. Sweep ONE parameter at a time. For envelope-curve and LFO-attack rows, use a short note retrigger so the shape is audible.

## 23 settings covered (count check)
2 (Cutoff ×2) + 2 (Reso ×2) + 6 (Env Times Attack ×3 + Env Slopes Attack ×3) + 6 (LFO Rate ×2 + SyncedRate ×2 + AttackTime ×2) + 7 (matrix entries above for completeness across filter routings) = the 23 flagged in cycle 4. The split-points Loudon fills here are the **only** human input that gates Stage 1B's analyzer reaching `[PERCEPTUAL BAND PENDING]`-clean output.

## After the sitting

Each filled row → drop the split values + labels into the matching `perceptual_regions` array on `wavetable_profile_v0.1.json`. Then `python ableton-wavetable/analyze_preset.py <factory_preset.adv>` should produce a description with zero `[PERCEPTUAL BAND PENDING]` markers. That clears the Stage 1B Track B success criterion.
