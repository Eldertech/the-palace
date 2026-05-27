---
title: "Generative Audio Devices — handoff"
born: 2026-05-26
links:
  - target: "[[Generative Audio Devices]]"
    type: connects-to
    label: "handoff-for"
forward_vector: "I carry the in-progress implementation of T7a phase 2 across an instance boundary into a Claude Code session, waiting to be picked up and archived once the move is caught."
session_thread: "Drafted from a Cowork status-review session that audited the project, then chose T7a phase 2 as the next ~6-hour block and discovered a registry-sync drift mid-prep."
---

# Handoff: Generative Audio Devices

## Move

This handoff carries the in-progress implementation of **T7a phase 2 — perceptual parameter vocabulary**: add `regions` + `curve` to the VCV registry's param entries and intercept the emitter's non-finite-value branch so `* VCF: FREQ = dark` resolves to a concrete darker-than-default number instead of warning and falling back.

## Why this move matters

It is the declared next item on the critical path (`T7a phase 2 → T7b → T6 refactor → T10`) and it closes the "every preset sounds neutral" gate **without** waiting on the archetype system. The actual leverage: phase 1 already routes any non-numeric param value through a warning branch that falls back to the registry default — so phase 2 is not new machinery in a new place, it is *intercepting an existing seam*. That makes it small, low-risk, and verifiable by ear, while unblocking T7b (archetypes lean on region names to stay readable). Doing it in Claude Code rather than Cowork is deliberate: this is a schema commit to live palace source, and Cowork commits to this repo leave stale `.git/*.lock` files that wedge later git ops; the audition step also needs VCV Rack, which is Mac-only.

## Tried and rejected

- **Regenerating the embedded registry block from the canonical JSON (or vice-versa) to add regions in one place** — rejected. The embedded `<script id="vcv-registry">` block in `PDL Renderer.html` and the canonical `vcv_fundamental_registry.json` have **drifted**: `modules.SEQ3.outputs` has **12** entries in the HTML vs **16** in the file, plus dozens of `description`-text divergences. A wholesale regenerate would silently clobber one side. The regions must be added **additively to both files**.
- **Doing the edit + commit in Cowork** — rejected for the git-lock and Rack-audition reasons above. Hence this handoff.
- **Adding a separate normalized-value PDL syntax (`= ~0.3`) to the sampler** — cut as scope creep. Region names + numeric literals already satisfy the success criteria.
- **Seeded within-region sampling now** — deferred to T7b. Phase 2 uses a deterministic **midpoint** so the byte-identical-`.vcv` determinism guarantee holds trivially. Give the sampler an optional `pos` arg so T7b can add seeded variance later without a rewrite.

## Current state

Verified against the live files this session:

- Registry is **v2.2, 10 modules**. **No param anywhere carries a `regions` or `curve` field yet** (confirmed programmatically) — phase 2 is genuinely unstarted and is a clean additive extension.
- The emitter seam to intercept is in `PDL Renderer.html`, `emitVcvJson`, currently **lines 672–683** (will shift after edits):

```js
const num = rawVal === "" ? NaN : Number(rawVal);
if (!Number.isFinite(num)) {
  warnings.push({
    source: "emitter", lineNumber,
    content: `* ${instId}: ${entry}`,
    reason: `param "${name}" value "${rawVal}" is not a finite number (named regions are T7a phase 2 — falling back to registry default)`,
  });
  continue;
}
resolvedParams[instId][name] = num;
```

- **Gotcha that will bite immediately:** the roadmap writes `CUTOFF = dark`, but VCF's cutoff param is literally named **`FREQ`** (index 0, range `[0,1]`, default `0.5`). Decide with Loudon: use registry-accurate `FREQ`, or add perceptual **aliases** so `CUTOFF` resolves to `FREQ`. (Aliases are arguably the more humane PDL surface and worth a short dialogue.)
- `PDL Renderer.jsx` (stale pre-registry file, T5) **still exists** at the palace root despite the roadmap listing T5 as trivial cleanup — delete it as a warm-up and grep the palace for references (only `Generative Audio Devices.md` mentions it).
- The VCV Patch Generator **Specialist is still a pure stub**: no `Artifacts/Shop/VCV Patch Generator/` bundle, `test-plan.md` is a TODO, `last_tested` is empty. This job is a natural occasion to land its first recipe + first determinism test artifact.
- Working tree is on `main` and **dirty with unrelated changes** (Kuramoto `.wav`/`.report.json`, `Enrichment/server.py`, an untracked Kuramoto handoff). Commit **only** the T7a-phase-2 files; do not sweep the unrelated changes in.

## Next move

Start with the **schema edit**. For each target param below, add `regions` (named sub-ranges) and `curve` to the param object in **both** `vcv_fundamental_registry.json` **and** the embedded block in `PDL Renderer.html` (lines ~24–311), additively — do not regenerate either block. Bump the registry `version` to `2.3` and append a rationale line to `notes`. Region designs worked out this session (verify by ear at midpoints; all `curve: "linear"` — note LFO.FREQ's param space is already log-Hz, so linear-in-param is log-in-frequency, which is correct):

```
VCF.FREQ  (cutoff, [0,1], def 0.5):  closed [0,0.15]  dark [0.15,0.4]  open [0.4,0.75]  bright [0.75,1.0]
VCF.RES   ([0,1], def 0.0):          clean [0,0.2]    present [0.2,0.5]  vocal [0.5,0.8]  screaming [0.8,1.0]
ADSR.A    ([0,1], def 0.5):          instant [0,0.1]  pluck [0.1,0.3]   soft [0.3,0.6]    pad [0.6,1.0]
ADSR.D    ([0,1], def 0.5):          snappy [0,0.2]   short [0.2,0.45]  medium [0.45,0.7] long [0.7,1.0]
ADSR.S    ([0,1], def 0.5):          plucked [0,0.15] low [0.15,0.4]    held [0.4,0.75]   full [0.75,1.0]
ADSR.R    ([0,1], def 0.5):          gated [0,0.1]    short [0.1,0.35]  medium [0.35,0.65] long [0.65,0.9]  ambient [0.9,1.0]
VCO.FREQ  (semitones, [-76,76], def 0.0): sub [-48,-24]  low [-24,-12]  mid [-12,12]  high [12,36]  piercing [36,60]
LFO.FREQ  (log Hz, [-8,10], def 1.0):     imperceptible [-8,-4]  subtle [-4,0]  obvious [0,4]  audio-rate [4,10]
```

Then add a pure sampler near the emitter and rewire the seam:

```js
function sampleRegion(spec, name, pos) {
  const region = spec.regions && spec.regions[name];
  if (!region) return null;              // unknown region -> caller warns + falls back
  const [lo, hi] = region;
  const p = (pos == null) ? 0.5 : pos;   // midpoint = deterministic; pos reserved for T7b seeding
  const v = lo + (hi - lo) * p;
  const [rmin, rmax] = spec.range;
  return Math.min(rmax, Math.max(rmin, v));
}
// replace the non-finite block:
if (!Number.isFinite(num)) {
  const spec = (modReg.params || []).find(p => p.name === name);
  const sampled = (spec && spec.regions) ? sampleRegion(spec, rawVal) : null;
  if (sampled != null) { resolvedParams[instId][name] = sampled; continue; }
  warnings.push({ source: "emitter", lineNumber, content: `* ${instId}: ${entry}`,
    reason: `param "${name}" value "${rawVal}" is not a finite number or known region (known regions: ${spec && spec.regions ? Object.keys(spec.regions).join(", ") : "none"})` });
  continue;
}
```

Verify with a Node harness mirroring the existing `verify_t7a.js` pattern (duplicate the pure-JS parser+emitter): assert `* VCF: FREQ = dark` emits `0.275` (midpoint of `[0.15,0.4]`, darker than default `0.5`); assert two runs are byte-identical (determinism); assert numeric literals still pass unchanged; assert an unknown region (`FREQ = chartreuse`) still warns and falls back to default. Then on the Mac, load a patch using `FREQ = dark` / `FREQ = bright` in Rack and confirm it opens audibly darker/brighter on load.

**Success criteria (from the T7a phase 2 spec):** `* VCF: FREQ = dark` produces a `.vcv` that loads appreciably darker than default; regions documented per-param and verifiable by ear at midpoints; schema change documented.

## Calibrations from this session

- **Schema-ceremony weight is a judgment call to confirm with Loudon.** The project entry says phase 2 "needs the ceremony" and points at `SCHEMA.md`. But `SCHEMA.md`'s ceremony governs the *palace type system* (entry/link types) — this is *registry-data* schema (optional fields on a JSON data object). My read: a `version` bump to 2.3 + a `notes` rationale line is proportionate; full schema ceremony is not. Confirm before committing.
- **The HTML embedded block is newer than the canonical file by timestamp** (HTML Apr 21 vs JSON Apr 20), so the file is *not* authoritative by recency. Treat the sync direction as undecided and flag the SEQ3 12-vs-16 divergence to Loudon; resolve the SEQ3 output count against `SEQ3.cpp` source separately — it is **not** part of this move (SEQ3 isn't a T7a-phase-2 target param), just a discovered side-issue to log.
- Keep the two registry copies in sync going forward only by additive edits until a build step replaces the duplication (the standing T2 note).

## Load these files first

1. `Generative Audio Devices.md` — the **Parameter Intelligence** section and the **T7a phase 2** roadmap entry. Most load-bearing.
2. This handoff.
3. `vcv_fundamental_registry.json` — the `params` arrays (each has `range`/`default`/`unit`; none have `regions` yet).
4. `PDL Renderer.html` — `emitVcvJson` seam (~line 672, will shift) and the embedded registry block (~lines 24–311).
5. `SCHEMA.md` — to settle the ceremony-weight question above.
6. `Shop/VCV Patch Generator.md` — the Specialist stub this job's audition can begin to fill (first recipe + `last_tested`).
