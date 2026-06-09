# Review Layer — drop-in kit

A toggle-able per-moment commenting surface for early-version artifacts. Mount it on a first build so Loudon can leave section-level feedback **in context**, then export it as the next round's brief. Flip it off to ship clean.

Concept and rationale: [[Review Layer]]. This kit is **one method** — the DOM-anchored one (inline pins + docked panel) — and it is *not* the definition of the layer. New review methods are wanted, not this one reused: for slides, video, generated images, sound, or anything else, inventing a fresh anchoring is the point. This file only covers HTML artifacts with stable DOM.

## Use

Include or paste `review-layer.js`, then call `mountReviewLayer` once after the DOM exists:

```html
<script src="review-layer.js"></script>
<script>
  mountReviewLayer({
    project: 'wavetable-scanner',   // names the storage key + export filenames
    round: 1,                       // bump each revision pass
    review: true,                   // set false (or omit) to ship clean — mounts nothing
    moments: [
      { id:'concept', label:'Concept & framing',    tag:'text',    sel:'.lead' },
      { id:'visual',  label:'Visual design',        tag:'design',  sel:'.topline' },
      { id:'phase',   label:'The disorder section',  tag:'control', sel:'#controls' },
      { id:'sound',   label:'Overall sound & mix',   tag:'sound' },   // no sel → panel-only
    ],
  });
</script>
```

Each moment becomes one autosaving note (localStorage, namespaced per project+round). A moment with a `sel` also gets an inline `◇/◆` pin appended to that element (`◆` once it has a note). Toggle the panel with the `◇ Review` tab.

## Export — and where it's headed

- **Copy for Claude** — a markdown digest of the non-empty notes. Best when the next round wants a readable brief.
- **Download .json** — structured, one record per moment (`{id, label, tag, note}`). Best when you want **individual responses** Claude can act on one at a time (the oblique-harvest pattern).
- **Download .md** — the markdown digest as a file (clipboard fallback for `file://`).

These are a **stopgap**. The direction worth building is posting responses straight to [[STIGMERGY]] (the palace blackboard) so the loop closes with no copy-paste and no chat round-trip — at which point clipboard/download become the fallback for artifacts running outside the palace. This kit is also one half of a loop shared with [[Enrichment]] (it *collects*; enrichment *sends*) — whatever posting mechanism lands here should serve both.

## Granularity — the one rule that matters

**One moment per natural unit of the medium, not one per control.** A handful of moments you can review in a couple of minutes. The failure mode (learned from `Artifacts/Murmuration Synth/Murmuration.html`, which carried one moment per slider) is a review surface heavier than the artifact. Group related controls into a single moment — "the disorder/phase section", not six sliders.

## Anchoring rules

- Pin only **stable** elements. Never put a `sel` on a node whose `innerHTML` is rewritten each frame (a canvas HUD, a live readout) — the pin gets wiped. Those moments are panel-only (omit `sel`).
- `review: false` mounts nothing and injects no styles — the clean shipped state. No separate killswitch needed.

## Styling

Reads Loudon Live design tokens (`--accent`, `--bg`, `--fg-1/2/3`, `--border`, `--border-soft`, `--bg-elev-1/2`, `--mono`, `--sans`, `--r-sm`) with safe fallbacks, so it inherits the active skin and also works outside the system. Glyphs `◇ ◆`, no emoji.

---

*Origin: mechanism from Murmuration (2026-05-31); per-item granularity + JSON export from the oblique harvest (`_ops/Harvest Ceremony/Archive/oblique-harvest-final.html`). See [[Review Layer]].*
