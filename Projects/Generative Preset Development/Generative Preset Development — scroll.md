---
title: "Generative Preset Development — scroll"
born: 2026-09-23
links:
  - target: "[[Generative Preset Development]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Generative Preset Development's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Generative Preset Development — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Generative Preset Development]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-25T20:42:54-04:00 from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — the project is steered by the **Plan** and **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** cycle 5 · last ran 2026-06-23 (94 days ago)
- **Plan:** agreed 2026-09-25 (today) · 0 made things since
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-06-23 (94 days ago) — Shipped a perceptual-bands worksheet that turns the pending ear-pass into fill-in-the-blanks for the 23 flagged Wavetable settings. (`preset-steward-011`)
- **Last commit touching this project:** 2026-09-23 `c666210b` — ops(scrolls): backfill 36 project scrolls; retire the 20 plan.md read-models
- **Signal:** steady
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

Project recap: Generative Preset Development builds Synth Profiles (parameter vocab + perceptual regions + modulation map + format I/O) so an LLM can author/analyze/modify presets for a fixed-architecture synth from abstract prompts. We are in Stage 1B (Ableton Wavetable). The profile JSON is built; the analyzer (Track B) and writer (Track A) exist. Cycle 4 flagged 23 settings whose perceptual bands are unknown — cutoffs, resonances, envelope attack times/curves, LFO rates — and asked Loudon (preset-steward-010) which method to use to label them. That request is still open.

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

_Nothing decided on the board yet._

<!-- scroll:now:end -->

## Plan

<!-- scroll:plan:start -->
**Where this is going.** Presets for synthesizers whose architecture is fixed (Ableton Wavetable, Vital, Serum2 and others), made from a plain musical prompt, read back in a synthesist's words, and reshaped on request. Each synth gets a Synth Profile: its preset format, every parameter with named regions of what it sounds like, and its modulation map, which is to a fixed synth what the module vocabulary is to [[Generative Audio Devices]]. Each synth is its own deliverable. On 2026-05-27 Loudon put Ableton Wavetable ahead of Vital, since it is installed and pairs with the wavetable libraries, so Wavetable came first. Its format is cracked and a structural profile is on disk. The write path works: on 2026-06-05 Loudon confirmed that a factory Aqueous Pad with its cutoff pulled down loads in Live and sounds darker. An analyzer now describes a preset in plain synth language, leaving a marker wherever a feel-word hasn't yet been earned by ear.

**The moves ahead**

1. **Label Wavetable by ear.** One sitting in Live to fill the 23 blanks in `ableton-wavetable/profile-draft/perceptual-bands-worksheet.md`: where a cutoff turns from dark to open, where an attack stops being punchy, and so on. Loudon chose this next step on 2026-06-09, and the worksheet carries the recipe for the audition patch. It gives the profile its feel-words, so the analyzer's markers clear and generation stops sounding neutral.
2. **Make Wavetable presets from a prompt, and reshape them.** Generation runs prompt to archetype to seeded parameter values to a loadable preset; modification takes an existing preset and a direction like "darker and more menacing." It passes when "a pad that sounds like light through deep water" yields three presets audibly distinct from each other and from the factory defaults, each recognizably that pad. A bonus is the analyzer describing a known factory preset the way a skilled synthesist would.
3. **Do the same for Vital.** Its presets are plain JSON and the synth is open source, so this profile is the easiest to build. Same three tracks, same prompt test.
4. **Take on Serum2.** Audit the community `serum-preset-packager` tooling, build the profile from a preset collection, and map the modulation system, which Serum2 widened well beyond the original with chaos generators, more LFO types and new morphing modes.
5. **Add Surge XT and Dexed.** Surge XT's Python bindings let its profile be built by asking the synth itself. Dexed brings FM, which needs its own vocabulary (operator ratios, feedback, the algorithm as the architecture) and has the richest research to build on.
6. **Build the Profile Generalizer.** Once three or more profiles exist, draft a new one semi-automatically from a preset collection and the synth, with a person labelling the feel-words by ear, and settle the profile into a shareable format.
7. **Meet Generative Audio Devices.** Make a synth profile a target the patch language can emit to, beside the VCV vocabulary, so one description plays out on many synths. Not before both projects have proven their own pipelines, which for this one means through Surge XT and Dexed.
<!-- scroll:plan:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="plan-2026-09-25T20-42-54-04-00" -->
### 2026-09-25 — Plan agreed: carried over from the entry's multi-stage plan

Carried over on 2026-09-25 from the Multi-Stage Plan in [[Generative Preset Development]], when plans moved into scrolls (SCHEMA v1.25). The reconnaissance is done for Wavetable, so it was dropped as a move. Wavetable now comes before Vital, as Loudon chose on the board on 2026-05-27 (grant on preset-steward-002), and the Wavetable work is split into the ear pass he chose on 2026-06-09 (grant on preset-steward-010) and the generation that follows it. Stage numbers were replaced by names; the two Python starter snippets were dropped; the convergence diagram stays in the entry as rationale.
<sub>`plan-2026-09-25T20-42-54-04-00` · plan agreed · agreed 2026-09-25T20:42:54-04:00 · carried over by an elder on Loudon's word</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="preset-steward-011" -->
### 2026-06-23 — cycle 5 — Shipped a perceptual-bands worksheet that turns the pending ear-pass into fill-in-the-blanks for the 23 flagged Wavetable settings.
> still working · preset-steward-010 still gates Stage 1B · this is prep so the eventual sitting is one cup of coffee, not an afternoon

Project recap: Generative Preset Development builds Synth Profiles (parameter vocab + perceptual regions + modulation map + format I/O) so an LLM can author/analyze/modify presets for a fixed-architecture synth from abstract prompts. We are in Stage 1B (Ableton Wavetable). The profile JSON is built; the analyzer (Track B) and writer (Track A) exist. Cycle 4 flagged 23 settings whose perceptual bands are unknown — cutoffs, resonances, envelope attack times/curves, LFO rates — and asked Loudon (preset-steward-010) which method to use to label them. That request is still open.

This cycle I did not re-ask. I shipped the worksheet that makes the answer cheap regardless of the path he picks: a single markdown file laying out every flagged parameter with empty named bands and a one-paragraph audition-patch recipe so any sitting collapses to clicking through, listening, and writing in three to four split-points per row. The 23-count is verified against the cycle-4 flag list.

Deliverable: `ableton-wavetable/profile-draft/perceptual-bands-worksheet.md`. Once filled, the splits drop straight into `wavetable_profile_v0.1.json`'s `perceptual_regions` fields and the Track B analyzer's `[PERCEPTUAL BAND PENDING]` markers should clear.

No new ask — preset-steward-010 is the live fork; this just lowers its cost.

**Artifacts:**
- [the worksheet — fill the blanks in one Live sitting](Projects/Generative Preset Development/ableton-wavetable/profile-draft/perceptual-bands-worksheet.md)
<sub>`preset-steward-011` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
