# Build Notes — Floquet / Time-Modulated Loops

Notes from the autonomous build run for review by Loudon. Items where I had to make a judgment call the manifest didn't fully specify, or where an implementation detail deserves a second look.

## Damping in the audio implementation

The Stage 1 build manifest's testing protocol describes a clear "below threshold / at threshold / above threshold" pedagogical arc:

> Excite with a short noise burst. Output should ring at freq with whatever damping the symplectic-Euler scheme implicitly provides (ideally none; in practice, a tiny numerical drift over many seconds is acceptable).

> q = 0.05 (well below threshold), q = 0.10 (right at the n=1 tongue's edge for these dimensionless params), q = 0.30 (well above)

Without explicit damping, the n=1 tongue covers all q > 0 at canonical 2:1 pumping (Mathieu's threshold-at-zero result). So "q = 0.05 below threshold" can only be true if the system has finite damping. **I added a `damping_zeta` parameter (default 0.025, Q ≈ 33)** to `mathieu_core.audio_mathieu` and to the codebox source. With this, threshold sits near `q_depth ≈ 4·zeta ≈ 0.10`, which matches the manifest's pedagogical arc.

This is consistent with how every real audio resonator behaves — there is always some damping. But it's a deviation from a strict reading of "ideally none" in the testing protocol. Worth a sanity check from you before Stage 1 ships.

If you want zero damping, set `damping_zeta = 0` in the codebox; the threshold collapses to q = 0 and the audio demonstrations don't work as written.

## State saturation choice

The manifest specifies `tanh(x)` saturation on the OUTPUT. With unbounded state, the in-tongue regime overflows float32 within a couple of seconds at q above threshold. **I added a soft-clip on the state itself** (`x = SAT_AMP * tanh(x / SAT_AMP)` with `SAT_AMP = 8`) so the state stays bounded. This is in both the Python reference and the codebox.

This shouldn't affect the timbre meaningfully — `tanh(x)` already saturates at ±1 once x is large, so the audio output is identical either way. But the state-clip means the codebox won't produce silent NaN states or stuck float-overflow conditions in long renders.

## Interactive HTML approach

I used the pattern from `Artifacts/Action Potential Oscillator/neuron_oscillator.html` — self-contained single-file HTML, the same CSS variable system, the same font stack. Replaced the neuron-oscillator accents with the Floquet stability palette: green (stable) / orange-red (unstable) / yellow (marginal) / blue (multipliers) / purple (modulation).

Each interactive embeds its full source in a `<details>` block at the bottom (the `Source — see how this is built` pattern from the manifest). The `<details>` block is populated by a small `fetch(window.location.href)` call that re-reads the page's own script — this works when served over HTTP but may show empty when opened as a `file://` URL in some browsers due to fetch CORS restrictions. Not a blocker — the source is still in the file, just not always visible in that viewer block.

## Strutt diagram — compute time

`media-05` (the full Strutt PNG) takes about 2 minutes to compute on the build host (240 × 180 grid, 25 periods × 160 steps per point). I logged the elapsed time in the figure footer and in the script. Lower-resolution versions for the right-panel inset of `media-08` take about 8 seconds.

The interactive Strutt explorer (`media-06`) precomputes a 360 × 200 grid once on page load using a fast monodromy-matrix integrator (220 steps per period). On a modern laptop the precompute completes in 1–2 seconds; clicks after that are instant.

## media-15 (Kapitza) initial conditions

The manifest says: "At pivot frequency too low: pendulum falls. At pivot amplitude too small: pendulum falls. The 'I can balance a pencil on its tip with shaking' experience lands."

The default initial state I chose is θ₀ = 170° (5° off vertical, just barely inverted). At 25 Hz pivot frequency and 0.06 L pivot amplitude — both above the Kapitza threshold for L = 1 m, g = 9.81 — the pendulum stays balanced inverted, wobbling gently. Reduce frequency or amplitude below threshold and it falls. The "drop from inverted" button forces θ → π and zeros velocity for a clean restart.

I added a small numerical damping (10% per second on velocity) to keep the visual stable over long sessions. Without it, slow drift accumulates. Real-world swings have far more damping than this; the value is purely cosmetic.

## media-11 (Bloch ↔ Floquet duality) — empty-lattice band approximation

The crystal band structure on the left panel uses the empty-lattice approximation (folded free-electron parabolas with small gaps at the zone boundary). This is sufficient to make the visual point — bands separated by gaps — without committing to any specific real material's band structure. The Floquet panel on the right is computed honestly from a Mathieu-equation slice.

If you want the spatial side to match a specific real crystal (Si? Cu?), the band structure can be swapped. For pedagogical purposes the empty-lattice version makes the "same shape" claim more visually obvious.

## Subtle font glitches in matplotlib output

A couple of static PNGs (16, 17) emit warnings about missing subscript-i and subscript-p glyphs in the default font. The text still renders — matplotlib falls back gracefully — but the subscripts are slightly less elegant than the rest of the typography. These aren't blocking issues; they would be fixed by switching to a font with proper subscript coverage (DejaVu Sans rather than Georgia). Not worth a rebuild.

## Things I did NOT change in the entry text

- I did not touch `Projects/Floquet Time-Modulated Loops.md`. The build manifest is the contract; the prose is yours to refine.
- I did not insert any `<!-- CLAUDE → LOUDON: ... -->` comments — the only items above are decisions about implementation, not factual errors in the prose.
- The five-stage arc is sketched in the entry but only Stage 1 is built here. Stages 2–5 stay as their current sketches.

## Cross-check that the artifacts teach what the prose says

Spot-checks I ran during build:

- **media-04 vs. the Threshold paragraph**. The prose says "Below the threshold $q$, the natural damping of the system eats energy faster than the pump can put it in, and the swing eventually settles. Above the threshold, the pump puts energy in faster than damping can drain it, and the amplitude grows exponentially." The audio triple plays exactly this — silence/coloration / rising / saturated. ✓
- **media-12 vs. the sideband-derivation paragraph**. The prose claims the modulation Fourier series is the spectral envelope. The PNG's three rows (waveform → coefficients → output spectrum) make exactly that claim visually. ✓
- **media-11 vs. "Bloch in space, Floquet in time"**. The PNG is a deliberate side-by-side; the duality variables are labeled at the bottom; the bandgap-vs-tongue parallel is shaded in matching colors on each side. ✓
- **media-20 (Strutt sweep) vs. the testing protocol Step 3**. "Sweep $q$ from 0.0 to 0.5 over 10 seconds. The output should be silent (with input noise floor) at first, then *crack* into ringing oscillation at some critical $q$." The 30-second sweep does exactly this with a triangular ramp; RMS envelope shows the silence/crack/ring/decay shape. ✓

## Reference WAV pre-norm peak

The Python reference at the canonical Stage-1 parameters produces a pre-normalization peak of 0.4682. After normalization to −3 dBFS the codebox A/B harness will compare against a peak-0.708 (= 10^(−3/20)) reference. Documenting here in case the codebox version comes out at a different pre-norm peak — that would indicate a parameter or scaling mismatch.
