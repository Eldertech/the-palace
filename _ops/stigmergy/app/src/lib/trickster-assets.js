// trickster-assets.js — per-project inline asset registry for the deck.
//
// LEGACY FALLBACK as of the inline-assets wire-through (2026-06-06). The card
// now renders artifacts declared on the wire (payload.artifacts → item.artifacts,
// via ArtifactSlot) FIRST; this registry only fills in when a request carries no
// payload artifacts. It ratchets toward empty the way catchup-overrides.js does:
// move `audition` / `artifacts` rows to the wire as stewards declare them, and
// drop the row once its request self-serves. The one slot that STAYS here is
// `schematic` — authored diagrams are not steward-rendered files, so the card
// renders them regardless of payload.
//
// Maps a pending request to the evidence its decision needs: an audio audition
// to hear, an embedded prototype to see, a file to download and try. The card
// renders these inline so Loudon can audition without leaving the page — the
// "make it as easy as possible to give the information" payoff.
//
// Paths are PALACE-RELATIVE (resolved against PALACE_ROOT by the middleware),
// so everything flows through the shared media infrastructure:
//   - auditions   → AuditionStrip → PhosphorAudio, src = fileUrl(path)
//                   (/api/file streams it; the open-native chip /api/open's it
//                   into the DAW)
//   - artifacts   → ArtifactSlot (the canonical media card): html→sandboxed
//                   iframe, image→<img>, anything else→open-in-native-app
// Using palace-relative paths (not the /trickster-assets static URL) is what
// makes the open-native / open-external chips actually resolve a real file.
//
// Keying: each entry is either an exact request_id or a request_id PREFIX
// (trailing '-'). assetsFor() tries an exact match first, then the longest
// matching prefix, so a stable-per-steward asset set (the 12 Shepard drones,
// the inharmonic passes) attaches to every cycle of that steward, while a
// cycle-specific asset (the dark-cutoff .adv) stays pinned to its exact request.
//
// What's deliberately NOT here: the generic STIGMERGY screenshots the
// standalone page sprinkled across cards. They're decoration, not evidence.
// The schematicSvg slot is reserved for Phase 4 (schematics-as-components).
//
// Asset slot shapes (all optional):
//   schematic: '<name>'              — a <Schematic> diagram (see schematics/)
//   audition: { kind:'audio-sequence', title, blurb, tracks:[{tag,label,path}] }
//   artifacts: [{ path, caption }]   — rendered by ArtifactSlot (iframe/img/file)

const PUB = '_ops/stigmergy/app/public/trickster-assets';

const REGISTRY = {
  // ── Audio auditions (stable per steward → prefix-keyed) ──────────────────
  'inharmonic-wavetable-synthesis-steward-': {
    audition: {
      kind: 'audio-sequence',
      title: 'the five-pass Faust audition',
      blurb: 'one per material model · do the curves read as distinct physical materials?',
      tracks: [
        { tag: '1', label: 'flat harmonic baseline', path: `${PUB}/audio/inharmonic/pass1-flat-harmonic-baseline.wav` },
        { tag: '2', label: 'piano stretch', path: `${PUB}/audio/inharmonic/pass2-piano-stretch.wav` },
        { tag: '3', label: 'Bessel bell', path: `${PUB}/audio/inharmonic/pass3-bessel-bell.wav` },
        { tag: '4', label: 'stochastic vocal fracture', path: `${PUB}/audio/inharmonic/pass4-stochastic-vocal-fracture.wav` },
        { tag: '5', label: 'inverse impossible material', path: `${PUB}/audio/inharmonic/pass5-inverse-impossible-material.wav` },
      ],
    },
  },

  'portamento-steward-': {
    audition: {
      kind: 'audio-sequence',
      title: 'the twelve portamento examples',
      blurb: 'four per damping regime · listen for the glide character',
      tracks: [
        { tag: '01', label: 'overdamped', path: `${PUB}/audio/portamento/01-overdamped.wav` },
        { tag: '02', label: 'overdamped', path: `${PUB}/audio/portamento/02-overdamped.wav` },
        { tag: '03', label: 'overdamped', path: `${PUB}/audio/portamento/03-overdamped.wav` },
        { tag: '04', label: 'overdamped', path: `${PUB}/audio/portamento/04-overdamped.wav` },
        { tag: '05', label: 'critically damped', path: `${PUB}/audio/portamento/05-critically-damped.wav` },
        { tag: '06', label: 'critically damped', path: `${PUB}/audio/portamento/06-critically-damped.wav` },
        { tag: '07', label: 'critically damped', path: `${PUB}/audio/portamento/07-critically-damped.wav` },
        { tag: '08', label: 'critically damped', path: `${PUB}/audio/portamento/08-critically-damped.wav` },
        { tag: '09', label: 'underdamped', path: `${PUB}/audio/portamento/09-underdamped.wav` },
        { tag: '10', label: 'underdamped', path: `${PUB}/audio/portamento/10-underdamped.wav` },
        { tag: '11', label: 'underdamped', path: `${PUB}/audio/portamento/11-underdamped.wav` },
        { tag: '12', label: 'underdamped', path: `${PUB}/audio/portamento/12-underdamped.wav` },
      ],
    },
  },

  // The GSL 12-drone SFZ library — one drone per chromatic pitch class. Both
  // gsl-steward cycles that shipped it point here; the ear-check question is
  // "does each read as ONE pitch class?".
  'gsl-steward-': {
    schematic: 'gsl-keyboard',
    audition: {
      kind: 'audio-sequence',
      title: 'play the twelve drones',
      blurb: 'one per pitch class · listen for a single tone, not a stack',
      tracks: [
        { tag: 'C',  label: 'shepard drone C',  path: `${PUB}/audio/gsl-shepard/shepard_C.wav` },
        { tag: 'C♯', label: 'shepard drone C♯', path: `${PUB}/audio/gsl-shepard/shepard_Cs.wav` },
        { tag: 'D',  label: 'shepard drone D',  path: `${PUB}/audio/gsl-shepard/shepard_D.wav` },
        { tag: 'D♯', label: 'shepard drone D♯', path: `${PUB}/audio/gsl-shepard/shepard_Ds.wav` },
        { tag: 'E',  label: 'shepard drone E',  path: `${PUB}/audio/gsl-shepard/shepard_E.wav` },
        { tag: 'F',  label: 'shepard drone F',  path: `${PUB}/audio/gsl-shepard/shepard_F.wav` },
        { tag: 'F♯', label: 'shepard drone F♯', path: `${PUB}/audio/gsl-shepard/shepard_Fs.wav` },
        { tag: 'G',  label: 'shepard drone G',  path: `${PUB}/audio/gsl-shepard/shepard_G.wav` },
        { tag: 'G♯', label: 'shepard drone G♯', path: `${PUB}/audio/gsl-shepard/shepard_Gs.wav` },
        { tag: 'A',  label: 'shepard drone A',  path: `${PUB}/audio/gsl-shepard/shepard_A.wav` },
        { tag: 'A♯', label: 'shepard drone A♯', path: `${PUB}/audio/gsl-shepard/shepard_As.wav` },
        { tag: 'B',  label: 'shepard drone B',  path: `${PUB}/audio/gsl-shepard/shepard_B.wav` },
      ],
    },
  },

  // ── Schematic-only entries (visual evidence, no audio/embed) ─────────────
  // A schematic draws ONE decision fork — the candidate behaviours of a single
  // cycle's question — so schematics are ALWAYS exact-keyed to the cycle(s)
  // whose fork they depict, never prefix-keyed. (Prefix keys are reserved for
  // stable per-steward LIBRARIES — the 12 drones, the 5 Faust passes, the
  // slime-mold prototype — which genuinely apply to every cycle of a steward.)
  //
  // The trap a prefix springs: a steward's question evolves cycle to cycle.
  // gwl asked "what does Position DO?" at 015/018, then moved on to "the table
  // is BUILT — does the sweep read as one note?" at 021. A 'gwl-steward-'
  // prefix kept stapling the Position diagram onto 021, where it's stale
  // evidence for a settled question. Exact keys pin each diagram to the fork it
  // actually answers and let it fall off the deck once that fork is past.
  'gwl-steward-015': { schematic: 'gwl-position' },
  'gwl-steward-018': { schematic: 'gwl-position' },
  'semantic-delay-steward-004': { schematic: 'semantic-stage2' },
  'semantic-delay-steward-007': { schematic: 'semantic-stage2' },
  'shepard-steward-008': { schematic: 'shepard-stage1-drone' },
  'shepard-steward-012': { schematic: 'shepard-stage1-drone' },

  // Preserved schematics, exact-keyed to their origin requests (not currently
  // pending). Extracted from trickster.html before its deletion so the art
  // survives as reusable components.
  'shepard-steward-013': { schematic: 'shepard-stage2-staircase' },
  'slime-mold-delay-steward-007': { schematic: 'slime-tubes' },

  // ── Embedded prototypes → rendered by ArtifactSlot as sandboxed iframes ──
  // (both HTML files are self-contained: no relative refs, no same-origin APIs,
  // so /api/file + allow-scripts-only is safe.) The descriptive title rides in
  // the caption; ArtifactSlot's open-external chip opens it in the browser.
  'slime-mold-delay-steward-': {
    artifacts: [
      { path: `${PUB}/slime-mold/index.html`, caption: 'the live slime mold field — Stage 2 visual prototype' },
    ],
  },

  // The Witness Diagram was built for retrospective-delay-steward-009 — pinned
  // exact (later cycles ask different things).
  'retrospective-delay-steward-009': {
    schematic: 'retro-five-asset-brief',
    artifacts: [
      { path: `${PUB}/witness/witness-diagram.html`, caption: 'Asset 1 — the Witness Diagram' },
    ],
  },

  // ── Downloadable artifact → ArtifactSlot renders the .adv as an open-in-
  // native-app (Ableton) file; the caption carries the try-it instructions.
  // Pinned exact to preset-steward-007's write-path test.
  'preset-steward-007': {
    schematic: 'preset-cutoff',
    artifacts: [
      {
        path: `${PUB}/preset/Aqueous Pad - dark cutoff.adv`,
        caption: 'open in Ableton (or drop it in your User Library) and play a held note — recognizably Aqueous Pad but darker (cutoff pulled 714 Hz → 200 Hz). About 30 seconds.',
      },
    ],
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
