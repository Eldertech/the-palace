// catchup-overrides.js — headline/ground backfill for legacy Trickster requests.
//
// Voice rule 6 (added 2026-06-05) instructs every steward to write three sizes
// of the same ask: headline, ground, and rationale. Requests posted BEFORE that
// rule existed don't carry headline+ground. The inbox falls back to these
// overrides so the catchup-first card layout still renders for legacy items
// rather than dumping the rationale full-width with a sad "no catchup" pill.
//
// The map is keyed by request_id. Each entry carries the same prose Claude
// wrote for the standalone trickster.html page (committed at 6925781). As
// stewards start emitting headline+ground natively, this file ratchets down
// toward empty — when nothing in the active inbox needs it, delete the file
// and the import in inbox.js.
//
// Do NOT use this file as a long-term home for catchup prose. It exists
// precisely because the wire schema was extended after these requests were
// already on disk. Native payload.headline / payload.ground always wins.

export const CATCHUP_OVERRIDES = {
  // ── The original four-card batch (filed 2026-06-05) ─────────────────
  'torus-steward-008': {
    headline: 'Slot 16\'s still the open seventh. Which method authors it — and was last cycle\'s stray "sd" a real go-ahead?',
    ground: 'still working · six surfaces use 2 of 5 methods · steward leans KURAMOTO-BLOOM',
  },
  'semantic-webcam-006': {
    headline: 'The concept entry\'s drafted but it needs a title before I write a character. Which name?',
    ground: 'still working · the four ASCII portraits are the evidence · steward has no lean',
  },
  'meadows-career-steward-011': {
    headline: 'Six interview questions, mapped to Meadows levels 6–11. How do you want to answer them?',
    ground: 'still working · delay · balancing · reinforcing · info-flow · buffer · structure',
  },
  'blood-compressor-007': {
    headline: 'Radio play\'s fully written, nothing rendered. Render the 12-second seed first, or commit to the full batch?',
    ground: 'still working · 17 cues / ~20 min full vs 4 cues / ~5 min seed · steward leans RENDER-SEED',
  },

  // ── The current eight (queued but unanswered) ──────────────────────
  'retrospective-delay-steward-009': {
    headline: 'The Witness Diagram is built. Want the other three sandbox-buildable assets next, or judge the one you have first?',
    ground: 'still working · 1 of 5 assets built · steward leans BUILD-THE-SANDBOX-FOUR',
  },
  'semantic-delay-steward-007': {
    headline: 'Build the Stage 2 standalone against the stub (playable soonest), wire the real voice-swap model (needs Mac), or build the spirit registry (silent but useful)?',
    ground: 'still working · contract pinned, 19/19 tests green · steward leans BUILD-INSTRUMENT-FIRST',
  },
  'slime-mold-delay-steward-007': {
    headline: 'Do you only place food (pure spectator), paint faint attractants (gentle nudge), or skip the control question and build the source-to-sink graph first?',
    ground: 'still working · the chemical field grows but is not yet a delay · no lean',
  },
  'gsl-steward-028': {
    headline: 'Twelve drones, one per pitch class. Does each one read as a single fused tone? Ship the 128-region instrument, tweak the Gaussian, or reject the recipe?',
    ground: 'paused on your ears · all 12 drones rendered · no lean — you decide',
  },
  'shepard-steward-013': {
    headline: 'Stage 2 design fork: discrete steps (legible) or continuous glide (uncanny)? Hide the wrap seam or briefly expose it?',
    ground: 'still working · Stage 1 ear-check pending · steward leans STEP-AND-SHOW',
  },
  'gwl-steward-018': {
    headline: 'When the wavetable Position knob turns on the Shepard wavetable, what should it do — slide a bright zone, widen a cloud, rake a comb, or leave Shepard parked and finish the Surge writer?',
    ground: 'still working · Shepard build parked on this · steward leans SHEPARD-CENTROID-FREQ',
  },
  'shepard-steward-012': {
    headline: 'Re-render a fresh Stage 1 drone for inline ear-check, resurface the original render, approve from description alone, or hold?',
    ground: 'still working · Stage 1 ear-check gating Stage 2 · no clear lean — your call',
  },
  'preset-steward-007': {
    headline: 'Drop the .adv in Ableton, play a held note. Does it load and sound darker than factory? Yes → start perceptual labeling. No → fix the writer first.',
    ground: 'paused on your Ableton · 30-second drag-and-play test · steward leans PERCEPTUAL-BY-EAR',
  },
};
