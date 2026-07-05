---
title: Tier-1 Warp Snippets — Codebox Drafts
born: 2026-05-27
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: emerged-from
    label: pre-stages-warps
  - target: "[[Torus Warping Catalog]]"
    type: connects-to
    label: implements-tier-1
  - target: "[[README — RNBO Prototype]]"
    type: connects-to
    label: extends
forward_vector: "I am the codebox drafts for the Tier-1 warps — half-formed snippets staged for the RNBO prototype — waiting to graduate into tested warp code in the Torus Warping Catalog."
---
# Tier-1 Warp Snippets — Codebox Drafts

Companion to [[torus_2d_lookup.codebox]] and [[Torus Warping Catalog]]. These are the per-sample Tier-1 warps that need **no precomputation infrastructure** — they slot into the existing codebox as drop-in additions. Each is a few lines of math; the architectural cost is exactly the parameters they expose and the order they apply in.

These drafts are not yet committed into `torus_2d_lookup.codebox`. Drop them in **only after** the bare-prototype A/B against `2d.wave~` passes the difference-monitor test described in [[Verification Prep Checklist]]. The verification is what proves the lookup is correct; the warps modify *what gets looked up*, so a warp-bug-on-top-of-a-lookup-bug is unreadable.

## Warp order matters

All three warps act on phase-space — they transform (φ₁, φ₂) before the bilinear lookup. They do not commute (catalog §1, §6, §12). The recommended application order is **bend → shear → self-displacement**, matching front-panel-to-deep-architecture order. Reversing them is also valid but produces audibly different timbres; the order itself becomes a hidden design parameter.

```
phi1, phi2  --bend(b1,b2)-->  phi1', phi2'
            --shear(s,shape)-> phi1'', phi2''
            --displace(eps)--> phi1''', phi2'''
            --lookup2D()----> output sample
```

Each warp has a neutral position (b=0, s=0, ε=0) that recovers the bare prototype exactly. That gives the user a graceful path: turn everything to zero, listen, then enable warps one at a time.

---

## 1. Per-axis phase bend (catalog #1)

**What it does**: smoothly bends each phasor's input via a monotone nonlinear function. Redistributes amplitude along single rows or columns of the lattice; lattice positions do not move. Subtle brightening/darkening per axis at moderate bend; sync-like hardness at extreme bend.

**Parameters added**:
- `bendX ∈ [-1, 1]` — bend amount on the X (φ₁) axis. Zero = identity.
- `bendY ∈ [-1, 1]` — bend amount on the Y (φ₂) axis. Zero = identity.

**Bend function**: `tanh` rescaled to map [0, 1) → [0, 1) monotonically. The classic continuous bend in synthesis. At `b=0`, this reduces to the identity within machine precision. At `b → ±1`, it approaches a piecewise-linear knee.

### Codebox snippet (drop-in)

Add to the parameter declarations near the top of the file:

```javascript
// --- Phase bend (warp #1) ---
@param({ min: -1.0, max: 1.0 }) bendX = 0.0;
@param({ min: -1.0, max: 1.0 }) bendY = 0.0;
```

Add this helper function above `lookup2D`:

```javascript
// Per-axis phase bend. b ∈ [-1, 1]; 0 = identity.
// Maps [0,1) → [0,1) monotonically via a tanh-shaped knee.
// At b=0, output ≈ input within numerical noise.
// At b > 0, the knee compresses the lower half (more time spent near 0).
// At b < 0, the knee compresses the upper half (more time spent near 1).
function bend(phi, b) {
    if (b == 0.0) return phi;
    // Map phi [0,1) to a centered-tanh argument, apply, remap.
    let k = 4.0 * b;                       // shape strength
    let u = 2.0 * phi - 1.0;               // [0,1) -> [-1,1)
    let v = tanh(k * u) / tanh(k);         // bend, normalized so v(±1) = ±1
    return 0.5 * (v + 1.0);                // remap to [0,1)
}
```

Modify the per-sample tick (replacing the existing `lookup2D(phi1, phi2)` call):

```javascript
let p1_bent = bend(phi1, bendX);
let p2_bent = bend(phi2, bendY);
let y = lookup2D(p1_bent, p2_bent);
```

### Audition protocol

- Set `bendX = 0`, `bendY = 0`. Confirm sound is identical to the bare prototype (this is a unit test — non-zero difference here means the helper has a sign error).
- Set `baseHz = 220`, `ratio = 1.5`, then sweep `bendX` from 0 to 1. The closed orbit should remain perfectly periodic (lattice positions don't move) but timbre should brighten/darken along the X axis.
- Repeat at `ratio = 1.500625`. The shimmer rate stays the same; only the harmonic weighting changes.

### Compositional notes

- Phase bend **commutes** with anything separable per-axis (other bends, axis-only filters). It **does not** commute with shear (#6) or self-displacement (#12).
- Phase bend on its own does not generate inharmonicity. It is the "control players already expect to find" — important for ergonomics, not for the central design fact.

---

## 6. Variable-rate phase shear (catalog #6)

**What it does**: shears φ₂ by an amount that depends on φ₁ — a nonlinear phase-space warp with no 1D analog. Generates rich sidebands around each existing partial; sonically related to FM but with the surface as carrier instead of a sinusoid.

**Parameters added**:
- `shearAmount ∈ [-1, 1]` — strength of the shear. Zero = identity.
- `shearShape ∈ {0, 1, 2, 3}` — which shape function s(φ₁) drives the schedule. Listed below.

**Why a shape selector**: catalog §6 calls out that the *shape* of s(φ₁) is itself a 1D design surface. Four built-in shapes cover the useful first-cut design space; a future iteration could expose s(φ₁) as a small buffer or front-panel curve.

### Codebox snippet (drop-in)

Add to the parameter declarations:

```javascript
// --- Variable-rate phase shear (warp #6) ---
@param({ min: -1.0, max: 1.0 }) shearAmount = 0.0;
@param({ min: 0,    max: 3   }) shearShape  = 0;   // 0=sine, 1=triangle, 2=ramp, 3=square
```

Add this helper function above `lookup2D` (placed after `bend` if both warps are present):

```javascript
// Shear schedule s(phi1). 2π-periodic over phi1 ∈ [0, 1).
// shape selects which 1D function drives the schedule.
function shearSchedule(phi, shape) {
    let twopi = 6.283185307179586;
    if (shape == 0) {
        // Sinusoidal — smoothest, narrowest sideband distribution.
        return sin(twopi * phi);
    } else if (shape == 1) {
        // Triangle — sharper corners, wider sidebands.
        let p = phi - floor(phi);
        return 4.0 * abs(p - 0.5) - 1.0;   // peak ±1
    } else if (shape == 2) {
        // Sawtooth ramp — DC-offset shear; one strong sideband cluster.
        let p = phi - floor(phi);
        return 2.0 * p - 1.0;
    } else {
        // Square — hard switching between two shear values; spreads spectrum widest.
        let p = phi - floor(phi);
        return p < 0.5 ? 1.0 : -1.0;
    }
}

// Apply variable-rate shear: phi2' = phi2 + amount · s(phi1) · phi1
// At amount = 0, this is identity.
function variableShear(phi1, phi2, amount, shape) {
    if (amount == 0.0) return phi2;
    let s = shearSchedule(phi1, shape);
    let phi2new = phi2 + amount * s * phi1;
    return phi2new - floor(phi2new);       // wrap to [0, 1)
}
```

Modify the per-sample tick (cumulative with the bend warp; assume `p1_bent` and `p2_bent` are already computed):

```javascript
let p2_sheared = variableShear(p1_bent, p2_bent, shearAmount, shearShape);
let y = lookup2D(p1_bent, p2_sheared);
```

### Audition protocol

- `shearAmount = 0`, any shape. Output identical to whatever the input warp produced (unit test).
- `baseHz = 220`, `ratio = 1.5`, `shearAmount` sweeping 0 → 0.5 at `shape = 0` (sine). Listen for sideband forests appearing around each partial of the closed-orbit harmonic comb. The orbit stops closing.
- Same with `shape = 1, 2, 3`. The sideband geometry changes per shape — square should sound brassiest, sine smoothest.
- `ratio = 1.500625` (irrational), `shearAmount = 0.2`. The shimmer thickens; the warp interacts with the Kronecker flow nontrivially.

### Compositional notes

- Variable-rate shear **does not commute** with anything except identity. Order with bend matters: bend-then-shear and shear-then-bend produce different sounds.
- This is one of the warps with no Serum analog. The shear's amount depends on the *other axis* — a gesture that requires a second axis to exist at all.
- Catalog §6 names this as a path to FM-like spectral expansion with surface-shaped carriers. Worth ear-comparing against a true FM patch.

---

## 12. Self-displacement (catalog #12)

**What it does**: the surface modulates its own sampling via a displacement field derived from the surface itself. Fractal-like sideband halos around every partial, anchored to surface geometry. The most surface-dependent warp in the catalog — Penrose self-displaces differently than Membrane.

**Parameters added**:
- `displaceAmount ∈ [0, 0.1]` — displacement strength ε. Zero = identity. **Range is narrower than other warps**: ε > 0.1 risks the displaced trajectory landing arbitrarily far from the original, which produces near-noise output.
- `displaceMode ∈ {0, 1}` — choice of displacement field. 0 = raw gradient (biases toward extrema). 1 = rotated gradient (area-preserving, stirs without compressing).

**Why the gradient choice**: catalog §12 calls out both options as natural choices with qualitatively different sonic results. Mode 0 is "stronger but more lopsided"; mode 1 is "subtler but more even".

### Codebox snippet (drop-in)

Add to the parameter declarations:

```javascript
// --- Self-displacement (warp #12) ---
@param({ min: 0.0, max: 0.1 }) displaceAmount = 0.0;
@param({ min: 0,   max: 1   }) displaceMode   = 0;   // 0=grad, 1=rotated-grad (area-preserving)
```

Add this helper function above the per-sample tick (placed after `variableShear` if all three warps are present). Crucially, this **performs two extra surface lookups per sample** to numerically compute the gradient — about 8 extra `peek` calls.

```javascript
// Compute surface gradient at (p1, p2) via centered finite differences,
// using a single-sample step on the 1024×1024 grid.
// Returns (gx, gy) — partials of W with respect to (phi1, phi2).
function surfaceGradient(p1, p2) {
    let step = 1.0 / 1024.0;
    let p1m = p1 - step; if (p1m < 0.0) p1m = p1m + 1.0;
    let p1p = p1 + step; if (p1p >= 1.0) p1p = p1p - 1.0;
    let p2m = p2 - step; if (p2m < 0.0) p2m = p2m + 1.0;
    let p2p = p2 + step; if (p2p >= 1.0) p2p = p2p - 1.0;
    let gx = (lookup2D(p1p, p2) - lookup2D(p1m, p2)) * 512.0;   // 1/(2·step)
    let gy = (lookup2D(p1, p2p) - lookup2D(p1, p2m)) * 512.0;
    return [gx, gy];
}

// Apply self-displacement: (phi1, phi2) → (phi1 + ε·D1, phi2 + ε·D2)
// At amount = 0, returns (p1, p2) unchanged.
function selfDisplace(p1, p2, amount, mode) {
    if (amount == 0.0) return [p1, p2];
    let g = surfaceGradient(p1, p2);
    let d1; let d2;
    if (mode == 0) {
        d1 = g[0];           // raw gradient
        d2 = g[1];
    } else {
        d1 =  g[1];          // rotated gradient (divergence-free)
        d2 = -g[0];
    }
    let p1new = p1 + amount * d1;
    let p2new = p2 + amount * d2;
    p1new = p1new - floor(p1new);
    p2new = p2new - floor(p2new);
    return [p1new, p2new];
}
```

Modify the per-sample tick (cumulative; assume `p1_bent`, `p2_sheared` are computed):

```javascript
let displaced = selfDisplace(p1_bent, p2_sheared, displaceAmount, displaceMode);
let y = lookup2D(displaced[0], displaced[1]);
```

### Audition protocol

- `displaceAmount = 0`, any mode. Output identical to whatever the upstream warps produced (unit test).
- `baseHz = 220`, `ratio = 1.5`, `displaceAmount` sweeping 0 → 0.05. The closed-orbit comb develops sideband halos. Mode 0 (raw gradient) should sound denser and more lopsided; mode 1 (rotated) should sound smoother and more even.
- Repeat at `ratio = 1.500625`. The shimmer thickens into a cloud — what catalog §12 calls "fractal-like halos anchored to the lattice".
- **Try with different surfaces.** This warp is the most surface-dependent in the catalog. Penrose, Membrane, and Theta should each self-displace into qualitatively different sound-worlds. The catalog claim is testable here: load each in turn, set the same parameters, listen for character difference.

### Cost notes

- Self-displacement adds **8 extra `peek` calls per sample** for the gradient (4 lookups × 2 directions). On a single voice at 48 kHz that's ~400k peeks/s — well within budget. Polyphonic voices stack the cost linearly.
- Alternative: precompute the gradient field as a second 1024×1024 buffer and lookup directly. That cuts the per-sample cost to 2 bilinear lookups, but adds a precomputation step and a second buffer per surface. Defer until profiling says it's needed.
- ε range capped at 0.1 because displacement is in **normalized phase units** (a full torus turn = 1.0). At ε = 0.1, an extremum of the surface can shift the lookup position by up to ~10% of the surface dimension, which is already at the edge of "still recognizable as the original surface". Above 0.1 the warp ceases to be a perturbation and starts being a recipe for noise.

### Compositional notes

- Self-displacement is the warp catalog §12 calls "deeply entangled with the specific surface". Two different surfaces produce two different vector fields, which produce two different sound-worlds. This is the warp that most directly proves the surface-as-voice claim.
- Does not commute with anything. Always apply last in the chain — earlier warps' bent/sheared coordinates feed into the gradient lookup, so the gradient is taken on the warped surface, not the raw one. That is the intended behavior.

---

## Combined codebox draft (all three warps active)

The full per-sample tick after all three warps are folded in:

```javascript
// Advance phase accumulators (unchanged from base prototype).
let f1 = baseHz;
let f2 = baseHz * ratio;
phi1 = phi1 + f1 / samplerate;
phi2 = phi2 + f2 / samplerate;
if (phi1 >= 1.0) phi1 = phi1 - floor(phi1);
if (phi2 >= 1.0) phi2 = phi2 - floor(phi2);

// Warp chain: bend → shear → displace.
let p1_bent    = bend(phi1, bendX);
let p2_bent    = bend(phi2, bendY);
let p2_sheared = variableShear(p1_bent, p2_bent, shearAmount, shearShape);
let displaced  = selfDisplace(p1_bent, p2_sheared, displaceAmount, displaceMode);

// Lookup the surface at the warped coordinates.
let y = lookup2D(displaced[0], displaced[1]);
out1 = y * gain;
```

Six new parameters expose the front panel: `bendX`, `bendY`, `shearAmount`, `shearShape`, `displaceAmount`, `displaceMode`. At all zeros the instrument is the bare prototype — a single torus surface with two phasors and a ratio knob.

## What this does *not* yet do

These three warps are deliberately the cheap-and-fast subset of the catalog. They do not give you:

- **Coefficient-space rearrangement** (#2 shear, #3/4 diffusion, #5 rotation, #7 spectral masks) — these need the lookup-table-and-crossfade infrastructure (catalog §Forward).
- **Surface-to-surface morphing** — this is a separate architectural commit; needs the catalog's interpolation infrastructure plus a decision on how to handle different symmetry classes.
- **Modulation routing** — every parameter above is currently a static knob. The next architectural move after warps audition is exposing each warp parameter to LFO/envelope modulation.

The Tier-1 warps are the first proof that the warp catalog implementation plan in the home entry is sound. Once these three audition cleanly, the lookup-table-and-crossfade tool earns its build slot, and the bulk of the catalog unlocks in one pass.

## Open questions surfaced by the drafts

- **Should phase bend default to `tanh`-shaped, or expose the bend function family** (tanh, piecewise-linear, rational/sync-like) as another parameter? Catalog §1 lists all three as common choices.
- **Should the shear schedule s(φ₁) eventually be hand-drawable** rather than parameter-selected? Catalog §6 names "hand-drawn" as a deep option.
- **Is the per-sample gradient computation in self-displacement worth optimizing to a precomputed gradient buffer** from day one, or wait for polyphony profiling? Memory cost is one extra 1024×1024 buffer per surface (about 4 MB each).
- **What's the right default warp order in the UI**? The snippet defaults to bend → shear → displace, which matches catalog tier ordering. But user-controlled order (drag-and-drop chain) is the more flexible design.
