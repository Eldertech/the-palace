// trickster-assets.js — per-project inline asset registry for the deck.
//
// Maps a pending request to the evidence its decision needs: an audio audition
// to hear, an embedded prototype to see, a file to download and try. The card
// renders these inline (AuditionStrip / Embed / ActionPanel) so Loudon can
// audition without leaving the page — the Phase-3 "make it as easy as possible
// to give the information" payoff.
//
// Keying: each entry is either an exact request_id or a request_id PREFIX
// (trailing '-'). assetsFor() tries an exact match first, then the longest
// matching prefix, so a stable-per-steward asset set (the 12 Shepard drones,
// the inharmonic passes) attaches to every cycle of that steward, while a
// cycle-specific asset (the dark-cutoff .adv, built for preset-steward-007's
// 30-second load test) stays pinned to its exact request.
//
// What's deliberately NOT here: the generic STIGMERGY screenshots the
// standalone page sprinkled across cards. They're decoration, not evidence —
// they don't help a decision, so they'd just push the question off-screen.
// The schematicSvg slot is reserved for Phase 4 (schematics-as-components).
//
// Asset slot shapes (all optional):
//   audition: { kind:'audio-sequence', title, blurb, tracks:[{tag,label,src}] }
//   embed:    { kind:'iframe', src, title, tall }
//   action:   { kind:'download', hint, src, buttonLabel }

const A = '/trickster-assets';

const REGISTRY = {
  // ── Audio auditions (stable per steward → prefix-keyed) ──────────────────
  'inharmonic-wavetable-synthesis-steward-': {
    audition: {
      kind: 'audio-sequence',
      title: 'the five-pass Faust audition',
      blurb: 'one per material model · do the curves read as distinct physical materials?',
      tracks: [
        { tag: '1', label: 'flat harmonic baseline', src: `${A}/audio/inharmonic/pass1-flat-harmonic-baseline.wav` },
        { tag: '2', label: 'piano stretch', src: `${A}/audio/inharmonic/pass2-piano-stretch.wav` },
        { tag: '3', label: 'Bessel bell', src: `${A}/audio/inharmonic/pass3-bessel-bell.wav` },
        { tag: '4', label: 'stochastic vocal fracture', src: `${A}/audio/inharmonic/pass4-stochastic-vocal-fracture.wav` },
        { tag: '5', label: 'inverse impossible material', src: `${A}/audio/inharmonic/pass5-inverse-impossible-material.wav` },
      ],
    },
  },

  'portamento-steward-': {
    audition: {
      kind: 'audio-sequence',
      title: 'the twelve portamento examples',
      blurb: 'four per damping regime · listen for the glide character',
      tracks: [
        { tag: '01', label: 'overdamped', src: `${A}/audio/portamento/01-overdamped.wav` },
        { tag: '02', label: 'overdamped', src: `${A}/audio/portamento/02-overdamped.wav` },
        { tag: '03', label: 'overdamped', src: `${A}/audio/portamento/03-overdamped.wav` },
        { tag: '04', label: 'overdamped', src: `${A}/audio/portamento/04-overdamped.wav` },
        { tag: '05', label: 'critically damped', src: `${A}/audio/portamento/05-critically-damped.wav` },
        { tag: '06', label: 'critically damped', src: `${A}/audio/portamento/06-critically-damped.wav` },
        { tag: '07', label: 'critically damped', src: `${A}/audio/portamento/07-critically-damped.wav` },
        { tag: '08', label: 'critically damped', src: `${A}/audio/portamento/08-critically-damped.wav` },
        { tag: '09', label: 'underdamped', src: `${A}/audio/portamento/09-underdamped.wav` },
        { tag: '10', label: 'underdamped', src: `${A}/audio/portamento/10-underdamped.wav` },
        { tag: '11', label: 'underdamped', src: `${A}/audio/portamento/11-underdamped.wav` },
        { tag: '12', label: 'underdamped', src: `${A}/audio/portamento/12-underdamped.wav` },
      ],
    },
  },

  // The GSL 12-drone SFZ library — one drone per chromatic pitch class. Both
  // the gsl-steward cycles that shipped it (the 128-region instrument) point
  // here; the ear-check question is "does each read as ONE pitch class?".
  'gsl-steward-': {
    audition: {
      kind: 'audio-sequence',
      title: 'play the twelve drones',
      blurb: 'one per pitch class · listen for a single tone, not a stack',
      tracks: [
        { tag: 'C',  label: 'shepard drone C',  src: `${A}/audio/gsl-shepard/shepard_C.wav` },
        { tag: 'C♯', label: 'shepard drone C♯', src: `${A}/audio/gsl-shepard/shepard_Cs.wav` },
        { tag: 'D',  label: 'shepard drone D',  src: `${A}/audio/gsl-shepard/shepard_D.wav` },
        { tag: 'D♯', label: 'shepard drone D♯', src: `${A}/audio/gsl-shepard/shepard_Ds.wav` },
        { tag: 'E',  label: 'shepard drone E',  src: `${A}/audio/gsl-shepard/shepard_E.wav` },
        { tag: 'F',  label: 'shepard drone F',  src: `${A}/audio/gsl-shepard/shepard_F.wav` },
        { tag: 'F♯', label: 'shepard drone F♯', src: `${A}/audio/gsl-shepard/shepard_Fs.wav` },
        { tag: 'G',  label: 'shepard drone G',  src: `${A}/audio/gsl-shepard/shepard_G.wav` },
        { tag: 'G♯', label: 'shepard drone G♯', src: `${A}/audio/gsl-shepard/shepard_Gs.wav` },
        { tag: 'A',  label: 'shepard drone A',  src: `${A}/audio/gsl-shepard/shepard_A.wav` },
        { tag: 'A♯', label: 'shepard drone A♯', src: `${A}/audio/gsl-shepard/shepard_As.wav` },
        { tag: 'B',  label: 'shepard drone B',  src: `${A}/audio/gsl-shepard/shepard_B.wav` },
      ],
    },
  },

  // ── Embedded prototypes (the visual evidence) ────────────────────────────
  // The slime-mold visual prototype is stable across the delay-steward cycles
  // that built and extended it.
  'slime-mold-delay-steward-': {
    embed: {
      kind: 'iframe',
      src: `${A}/slime-mold/index.html`,
      title: 'the live slime mold field (visual prototype)',
      tall: true,
    },
  },

  // The Witness Diagram was built for retrospective-delay-steward-009 — pin it
  // to that exact request, not the prefix (later cycles ask different things).
  'retrospective-delay-steward-009': {
    embed: {
      kind: 'iframe',
      src: `${A}/witness/witness-diagram.html`,
      title: 'Asset 1 — the Witness Diagram',
      tall: false,
    },
  },

  // ── Downloadable artifact (the thing to actually try) ────────────────────
  // The dark-cutoff .adv is specific to preset-steward-007's write-path test;
  // exact-keyed so it never attaches to a different preset cycle.
  'preset-steward-007': {
    action: {
      kind: 'download',
      hint: 'drop this in your Ableton User Library, load it on a Wavetable instance, play a held note: it should be recognizably Aqueous Pad but distinctly darker (cutoff pulled 714 Hz → 200 Hz). About 30 seconds.',
      src: `${A}/preset/Aqueous Pad - dark cutoff.adv`,
      buttonLabel: '↓ download .adv',
    },
  },
};

// All prefix keys (trailing '-'), longest first, so the most specific prefix
// wins when several would match.
const PREFIXES = Object.keys(REGISTRY)
  .filter((k) => k.endsWith('-'))
  .sort((a, b) => b.length - a.length);

/**
 * Look up the inline assets for a request. Exact request_id match first, then
 * the longest matching prefix, then null.
 *
 * @param {string} requestId
 * @returns {object|null} the asset entry, or null if none
 */
export function assetsFor(requestId) {
  if (typeof requestId !== 'string' || requestId === '') return null;
  if (Object.prototype.hasOwnProperty.call(REGISTRY, requestId)) return REGISTRY[requestId];
  for (const prefix of PREFIXES) {
    if (requestId.startsWith(prefix)) return REGISTRY[prefix];
  }
  return null;
}

// Exposed for tests.
export const _REGISTRY_FOR_TESTING = REGISTRY;
