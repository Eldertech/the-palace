---
title: "Palace Audit — 2026-05-28"
type: meta
pillars:
  - practice
  - tools
born: 2026-05-28
stage: seed
status: active
links:
  - target: "[[Palace To-Do]]"
    type: connects-to
    label: punch-list-home
  - target: "[[Weave Ceremony]]"
    type: connects-to
    label: editor-pass-cousin
  - target: "[[SCHEMA]]"
    type: connects-to
    label: link-vocabulary-decision
forward_vector: "I keep the recovered audit alive so a crash can't erase it again. Work me down from the top: mechanical fixes are applied, judgment calls await Loudon's triage. When my triage list is empty, I compost into git history."
---

# Palace Audit — 2026-05-28

A whole-palace editor's pass — shorten generic content, repair/prune links, correct drift, subtly reorganize. "Handyman and cleaning crew."

**Provenance.** This audit ran in a Claude Code session ("Palace audit and reorganization", transcript `a23309b0-…`) that completed all six zone audits and a full mechanical scan, then was killed — twice — by the `thinking`-block API 400 error before it could synthesize or apply anything. **Nothing was written to the palace in that session.** This file is the recovered intelligence, re-verified 2026-05-28 (case-insensitive link resolution applied). 485 real knowledge entries scanned.

**How to use this file.** Three tiers: **APPLIED** (done 2026-05-28), **TRIAGE** (judgment calls — Loudon's pace), **LEAVE** (looks like a bug, is actually intentional — do not "fix"). Loudon's standing directive for this audit: do all safe/mechanical work automatically; for the rest, if ~80% sure of approval, just do it; leave the remainder to triage.

---

## APPLIED 2026-05-28

- **Link-type normalization.** All 128 non-canonical frontmatter link types rewritten to `type: connects-to` with the original word preserved as `label:`, so no semantic register is lost and the usage data survives for a schema decision. The `emerges-from` typo (Granular Synthesis) corrected to canonical `emerged-from`. Shop label-only inline links left untouched (deliberate domain convention). See the statistics block appended to [[Palace To-Do]].
- **Known-target broken links repaired** (file exists, pure naming/rename — not forward-ghosts):
  - `[[Harvest Log]]` → `[[Harvest Ceremony]]` in `_ops/Deposit Archive.md` (Harvest Log was collapsed/renamed into the Deposit Archive + Harvest Ceremony — Context).
  - `[[The Jewel]]` → `[[JEWEL|The Jewel]]` in `Palace development/Symbiotic Skills.md` (file is `JEWEL.md`; Obsidian resolves filenames, not the `title:` field).
- **Shop stub-tag conflicts cleared:** removed `stub` from tags on `Shop/Stable Audio Open.md` and `Shop/Remotion.md` (both `status: alive`, `last_tested: 2026-05-26`).
- **CLAUDE.md directory map:** removed the stale `Harvest Queue.md / Harvest Frontier.md` lines (composted 2026-03; Loudon confirmed obsolete 2026-05-28 — the catch-up tool won't return in its old form).

### Triage pass 1 (2026-05-28, applied)
- **T3 missing status:** added `status: active` to 11 of 12 project entries. **`1 from 2` left for Loudon** — To-Do flags it dormant (line 32), conflicting with `stage: growing`; that's a real call (set stage+status to dormant, or run the spore-check).
- **T3 Shop honesty:** Midjourney `alive`→`stub` (body says "Last run: never"); ComfyUI `last_tested`/`last_gotcha` filled `2026-05-26` (verified real recipe + output PNG in body).
- **T3 stage fixes:** Floquet, Shepard Tone, Mathieu, Enrichment `sprout`→`growing` (bodies far exceed sprout ceiling). Granular Synthesis: removed the stale "this entry is a seed" prose claim (contradicted `growing` frontmatter).
- **T3 duplicate link:** Diversity of Thought — dropped the weaker provisional `couples-with [[The Shop]]`, kept `emerged-from` (the body confirms the question emerged from The Shop's design).
- **T3 type mismatch:** all 12 People entries `source`→`person` (now 25 person + 1 hub, fully consistent).
- **Forward-vector stasis:** Loudon Live "I will be…" → "I keep growing into…" (the one clear stasis case). Compressor Design, Preset Oracle, Action Potential Oscillator left as proposals (see T3 below — they already carry functioning conatus).
- **Weekly Themes stage (contradiction resolved):** the 10 named themes are ~585 words but ~95% generic template boilerplate (empty "Music to Study:" fields, default "Three tracks exploring this theme" phrases) — provably mis-staged. Re-staged `mature`→`seed`: Gamelan and Emergent Complexity, Haas Effect, Harmonic Oscillator, Impulse Response, Overtone Series, Phase Cancellation, Shepard Tone, Spectral Composition, Stochastic Synthesis, Transfer Function. The other 30 are genuinely filled — left `mature`.

### Triage pass 2 (2026-05-28, applied)
- **T2 boilerplate shorten (Loudon greenlit "boilerplate only"):** stripped the generic `Teaching Integration` + `Why This Source Matters` sections + closing boilerplate line from all 12 People person-stubs — **420 lines removed**, –35 each. Preserved Core Concepts, the unique `Connection to 4 Pillars`, Key Quotes, Recommended Reading, and `Applications to Four Pillars` (which carries per-entry flavor).
- **T1 stale-ghost repoint (Loudon greenlit):** all 4 `[[4 Pillars Weekly Structure]]` links (frontmatter ×4, retyped to `connects-to` + label `weekly-cadence`) + 2 body references repointed to `[[Loudon Live]]`, since that concept was folded into Loudon Live as its Stage 2 weekly structure. Broken-link count 15 → 11 (the remaining 11 are all intentional forward-ghosts).

**T2 calibration finding (important, governs remaining shortening).** Shortening is NOT bulk-safe: an agent's "compressible textbook content" may be an entry's stated purpose. Example — Ohm's Law's `forward_vector` *wants* to be "the palace's exemplar for cross-domain structural isomorphism," so the water/light/sound/labor block the audit flagged IS its conatus; compressing it would gut the entry. **Rule: every shortening checked against the entry's `forward_vector` — cut generic boilerplate, preserve stated conatus.** The *remaining* T2 items in §T2 below (Dispersion, Differential Equations, Mathieu "where it appears", Bridges "Technical Side" ×9, etc.) still await per-entry forward-vector checks before cutting.

**Aliases decision (Loudon asked for an assessment): do not adopt an alias system.** 0 entries use `aliases:` today. The link breakages don't need it — most are deliberate forward-ghosts; `[[Four Pillars]]`(×15)/`[[Substrate]]`(×3) already resolve case-insensitively in Obsidian; the 2–3 real title/filename divergences are best fixed at the link site with display-text piping (`[[JEWEL|The Jewel]]`). An `aliases:` field would create a parallel naming surface every future scan and agent must reconcile — the complexity Loudon wants to avoid. Keep one canonical name per entry. (Consistent with the deferred BBS/STIGMERGY findability decision in [[Palace To-Do]].)

### Triage pass 3 (2026-05-28, applied — third recovery session, driven by Loudon's inline `<!--APPROVE-->` comments)
- **T3 forward-vector (AP Oscillator):** rewrote `forward_vector` + `agency_profile.practice` to resolve the contradiction the audit flagged — the vector implied the build hadn't happened, but the body's Implementation Status confirms Stages 1–4 are built and playable. New vector is mature conatus (ancestry → current state → reach to the N-neuron population instrument → named open question → sub-vectors: Faust par() layer, H90/RNBO port). **Compressor Design & Preset Oracle left unchanged** — re-examined per T3; their "I am complete *but want to become documented*" vectors carry genuine conatus (reach toward pedagogical evidence) and "complete" is factually accurate, so rewriting would be churn. Matches pass-1's own judgment.
- **T5 link-quality demotions (all 5 approved):** Mathieu → Crystal Synthesizer `mirrors`→`connects-to` (label `bandgap-physics` kept; body calls it an "analogy"). Metaphor as Coupling Medium → Lateral Access `mirrors`→`connects-to` label `oblique-cousin` (Kuramoto mirror left intact). Mixture of Experts → Harvest Ceremony **retargeted** to `mirrors [[Weave Ceremony]]` label `load-balancing-audit` — the MoE body never discusses Harvest but calls the Weave analogy "exact … both load-balancing audits"; Harvest was unsupported. Trickster → BBS Blackboard `enables`→`connects-to` (board enables the Trickster, not vice-versa). Trickster → Palace Agent Infrastructure Spec `enables`→`connects-to` (label `seed-of` kept).
- **T1 PDL Renderer (write a stub):** created `PDL Renderer.md` (`type: project`, `status: active`) so `[[PDL Renderer]]` resolves. Typed `project` not `maker`/`specialist` — those are Shop-only (external-tool-binding) per SCHEMA §3.2; the renderer is the `first-fruit` GAD spawned. Links `emerged-from [[Generative Audio Devices]]`; points there as the canonical dev-log home rather than duplicating the T-task history.
- **T1 JEWEL casing (prefer all-caps):** verified clean — every wikilink already uses `[[JEWEL]]` / `[[JEWEL|The Jewel]]` (the one real case, Symbiotic Skills frontmatter, was fixed in pass 1). Remaining "the jewel" instances are lowercase prose, not links. Nothing to change.
- **T6 bundle naming (child-of):** added frontmatter + `parent:` + `connects-to [[Biomechanical Synthesis]]` label `child-of` to the orphan `Projects/Biomechanical Synthesis/haiku-grotesque-pedagogy.md`. Ratified convention: bundle files carry a `parent:` field + a `connects-to` link to the parent; **`child-of` is the canonical *fallback* label** — keep a richer descriptive label where one already exists (Blood Compressor's `lesson-first-deliverable` etc. preserved; the labels-carry-register principle wins over uniform `child-of`).
- **T6 / T1 Retrospective Delay stage-1:** repointed 3 broken links (`patch-spec.md` ×2, `mockup-imagery-brief.md` ×1) from `[[Retrospective Delay — Stage 1 The Witness|…]]` to the kebab filename `[[stage-1-the-witness|…]]`, preserving display text. Consistency = match the palace-wide kebab bundle-filename convention, not rename files to Title Case.
- **T2 shortening (all approved groups, aggressive per Loudon):** 24 entries cut, **~2300 net lines** removed. Rule applied: cut generic/encyclopedic/textbook/survey padding + repeated boilerplate; preserve each entry's `forward_vector` conatus, equations, synthesis hooks, generative questions. Calibrated on Dispersion (197→93) then run by Sonnet sub-agents. Notable judgment calls: **Ohm's Law** cross-domain block preserved (it *is* the conatus); **Logarithmic Scaling** kept its code/math; **State Machine** kept all 4 code blocks (flagged `<!-- FLAG -->` for a possible bundle move); **Sidechain ↔ Conversation** kept its technical mechanism (it *is* the bridge — only the Max patch cut); **Quantization** left long because the conceptual side is genuinely rich. 10 Bridges, Leverage Points 441→146 (all 12 points kept), Eno/Rubin curricula → "recommended path", etc.
- **T7 foundational currency (partial):** SUBSTRATE.md Current-State **counts** refreshed (58→90 root; ~485 total) + flagged for a full Self-Model Update (narrative not guessed). SCHEMA §6 false "Hibernation Ceremony — currently split" line removed (files don't exist). JEWEL.md v1.0 migrated to `Jewel — Context.md` (§Superseded Versions + v1.1 log row); JEWEL now carries only v1.1; frontmatter `version` 1→1.1.
- **T4 cleanup (the one safe move):** 20 consumed (`archived: true`) enrichment cards moved to `Enrichment/Archive/` (live cards 038/040–043 remain). Verified safe against `server.py` `load_cards()` (globs `card-*` direct children, filters in-memory) — no count/code impact.
- **Schema proposal prepared:** `_ops/Schema Ceremony Proposal — exemplifies + member-of.md` — full rationale + cost for ratifying the two types, for Loudon's go/no-go. NOT executed.

**Commits this session:** `b64e4f5` (passes 1–3 checkpoint), `a950c38` (T2 shortening), `de37c73` (T7 + schema proposal), `50d3448` (enrichment archive). The parallel design-system/visual-language and stigmergy workstreams were deliberately left uncommitted (not part of the audit).

### Pass 3 continued — Loudon's deferred-item rulings, executed 2026-05-28
- **Toolkit type → `meta` (DONE, `4777299`):** both `Toolkit — Audio Plugins` and `Toolkit — Synthesizers` (both inventories) retyped `concept`→`meta`; `Loudon's Toolkit` stays the hub. Family is now consistent.
- **Schema ratification of `exemplifies` + `member-of` (DONE — Schema Ceremony `83e6775`, v1.8):** 98 links re-converted `connects-to`+label → typed; SCHEMA §4 (+2 rows, +rationale, v1.8), ROSETTA, proposal doc updated. CLAUDE.md + Substrate Skill link-ontology updated **on disk** but committed with the design-system workstream (mixed files). Reciprocity: inbound-only.
- **`Crystal Audio/` → GSL bundle (DONE, `933c54f`):** moved to `Projects/Generative Sample Libraries/crystal-audio/`; updated `generate.py`/`generate_full.py` `CRYSTAL_SYNTH_PATH` + provenance strings + the GSL entry prose. (Dated build-map scripts' stale NODE_DIR entry left — harmless empty scan; flag for next map build.)
- **Remove all Hibernation (DONE, `4777299`):** dropped the ROSETTA row, Claude CLI Reference mode, Revival's `mirrors` ghost link, and 2 Palace To-Do entries; 0 `[[Hibernation Ceremony]]` links remain. Kept the historical record (Map Log, Harvest-Context "Hibernation Absorption", bear metaphor). Deposit closing-ritual phrase "hibernated"→"come to rest" (on disk, rides with design-system commit — mixed file).
- **AP Oscillator H90 comment (DONE, `4777299`):** resolved Claude→Loudon exchange removed (answer lives in the forward_vector).
- **Ceremony splits — EXPLAIN requested, not done.** See the reply to Loudon (Handoff/Weave exceed the §6 ~8KB split threshold; "split" = move history into a `— Context.md` companion, keep the operational card lean). Awaiting Loudon's go.

### Still open — the one big remaining item
- **T4 loose-artifacts migration (`Artifacts/<Entry>/` → `Projects/<Entry>/` bundles):** Loudon asked for this ASAP, but on scoping it is **bigger and more collision-prone than the punch-list implied** — flagged for a dedicated, verify-as-you-go pass (ideally fresh context, since a half-finished sweep is worse than none):
  - **22** `Artifacts/` subdirs, not ~6. Several are NOT per-entry bundles and must be excluded: `Images/` (shared assets), `Tools/` (tool guides), `4 Pillars Framework/` (holds live Bridges/People/Weekly-Theme entries), `Full Claude conversation backup/`.
  - **8 collisions** where `Projects/<Entry>/` already exists with content (`proofs/`, code, `.md`): Action Potential Oscillator, Crystal Synthesizer, Floquet, Piano String Inharmonicity, Quantum Synthesizer, Retrospective Delay, Shepard Tone Synthesizer, Shimmer Cloud — merge without overwrite.
  - ~20+ in-body path references + HTML interactives with relative `charts/`/`audio/`/`images/` assets (move as units; update every reference).
  - Moved `.md` bundle files should gain minimal frontmatter + a `child-of` parent link; the map's `EXCLUDE_DIRS` Artifacts entry will need revisiting once Artifacts empties.

---

## LEAVE — intentional, do not "fix"

The mechanical scan flags these as broken, but the palace's Trickster-move philosophy ([[Palace Map]]: "links-to-nowhere are not broken references but generative obligations; persistent ghost nodes are high-priority deposit candidates") means they are **desires the palace is tracking**, already carried in [[Palace To-Do]]'s "Entries to Write":

- `[[Hibernation Ceremony]]` (in `_ops/Revival Ceremony.md`, `mirrors`) — To-Do line 44 wants it written as Revival's dual. The crashed session's agent suggested repointing it to Deposit Ceremony; **that conflicts with Loudon's stated desire — leave the ghost.**
- `[[Resonance and Damping]]` (Differential Equations) — To-Do "Entries to Write", persistent forward-ghost.
- `[[Donella Meadows]]`-class person-pages — To-Do, first "person-as-context-injector" test case.
- `[[Synthesis Topologies]]` — To-Do forward-ghost.
- `Martin Heidegger`, `[[Actor Model]]`, `[[Ableton Extension SDK]]` — concept/source ghosts (harvest candidates, not bugs).
- `[[Toolkit — Audio Effects]]`, `[[Toolkit — Drum Machines]]`, `[[Toolkit — MIDI Controllers]]` — a planned toolkit family; unwritten members.

Also **not bugs:** 18 case-only link mismatches (`[[Four Pillars]]`, `[[Substrate]]`) resolve in Obsidian; 34 "title/filename mismatches" are mostly deliberate (UPPERCASE skeleton files `JEWEL`/`ROSETTA`/`SUBSTRATE`/`README - The Palace Guide`; bundle kebab-case filenames).

---

## TRIAGE — judgment calls (Loudon's pace)

### T1 · Ambiguous broken links (repoint vs. ghost vs. remove)
- `[[4 Pillars Weekly Structure]]` (×3: 4 Pillars Framework — Founding Conversation, Leverage Points Framework, Palace AI Partnership Philosophy, Quality Manifesto) — **reframed, not becoming an entry** (To-Do: it's "Stage 2 of Loudon Live"). These ghosts are now stale. Recommend repointing to [[Loudon Live]] or removing. <!--APPROVE-->
- `[[The Jewel]]` (in `_ops/Symbiotic Skills.md` body, distinct from the frontmatter fix) — check body wikilinks for the same JEWEL naming.<!--APPROVE, I prefer all caps JEWEL when possible, like we have done with SCHEMA, caps indicating the fundamental importance-->
- `[[PDL Renderer]]` (Generative Audio Devices) — `PDL Renderer.html` exists as an artifact but no `.md` entry. Link to artifact, or write a stub?<!--write a stub-->
- `[[Retrospective Delay — Stage 1 The Witness|…]]` (×2, in `Projects/Retrospective Delay/stage-1/` bundle) — target filename is `stage-1-the-witness.md`; link doesn't resolve. Part of the bundle-naming decision (T6).

### T2 · Shortening (every item is a judgment call — generic content crowding unique synthesis)
*Root A–L:* Dispersion (loudspeaker §2 = textbook), Differential Equations (notation + quiz outline), Latent Error (Swiss-cheese origin), Leverage Points (3× repeated "why you succeed"), Logarithmic Interface Scaling (F-stop/pH examples). <!--APPROVE-->
*Root M–Z:* Mathieu Equation ("Where it appears" survey, ~4× sprout ceiling), Ohm's Law (cross-domain analogy block), SMPTE LTC (biphase encoding mechanics), State Machine (4 full code blocks → move to bundle sketch), Playful Interface Design (tool-palette reference).<!--APPROVE-->
*Artifacts:* People stub footer (12 entries share an identical generic "Why This Source Matters" block; the per-entry "Connection to 4 Pillars" is the keeper), People dev entries (Eno/Rubin month-by-month curriculum → "Recommended path" + link to Master Plan), Bridges "Technical Side" DSP definitions (×9, ~120 lines each → 2–3 sentences + pointer).<!--APPROVE-->
*Enrichment/Shop:* Midjourney unverified "patterns to watch" block → Open Questions; Oblique Portrait "Research Directions" reading-list glosses (~50 lines → names + one-line each).<!--APPROVE-->

### T3 · Drift & metadata
- **`type: project` missing `status:` (12):** Action Potential Oscillator, Blood Compressor, Crystal Synthesizer, Meadows and an Artist's Career, Retrospective Delay, Semantic Webcam, Shepard Tone Synthesizer, Slime Mold Delay, `1 from 2`, Palace Enchantment, Symbiotic Skills, SMPTE LTC. Schema requires it — but the value (active/complete/dormant) needs a per-file call.
- **Stage vs. body mismatch:** Floquet Time-Modulated Loops (`sprout`, 958-line body → `growing`+), Shepard Tone Synthesizer (`sprout`, 12 activations → `growing`), Mathieu Equation (`sprout`, ~1500 words), Enrichment.md (`sprout`, ~360-line protocol), Granular Synthesis (frontmatter `growing` vs body "this entry is a seed").
- **Forward-vector stasis ("I will" / "I want" → conatus):** Loudon Live ("I will be…"), Compressor Design & Preset Oracle ("I am complete but want to become documented…"), Action Potential Oscillator (vector says build hasn't happened; body says Stages 1–4 shipped). See [[Entry Conatus]].
- **Type mismatches:** 12 People entries typed `source` should be `person`; Toolkit — Audio Plugins typed `concept` is really an inventory (`meta`).
- **Stage staleness:** Weekly Themes — agent flagged 10 as empty `mature` stubs, **but verification found 0 mature themes under 250 words** — the templates are verbose even when conceptually unfilled. Needs a manual eyeball before re-staging. SUBSTRATE.md "Current State" stale (lists 58 root entries; now ~85+) → Self-Model Update.
- **Shop status honesty:** Midjourney (`status: alive` but never run — set to `stub`); ComfyUI (`last_tested` empty but has dated gotchas — fill `2026-05-26`).
- **Duplicate link:** Diversity of Thought in Many-Agent Systems links `[[The Shop]]` twice (`couples-with` + `emerged-from`) — merge to one.

### T4 · Placement / clutter
- 4 Pillars Framework subtree: 5 `.html` + 1 `.json` + 1 `.py` build artifacts sitting beside palace entries; Portamento Physical Modeling has 10 `.html` iteration files. → move to entry bundles or `_ops/`.
- 18 standalone artifact `.md` files (GEMMA4_GUIDE, neural_oscillator_dev_plan, Shimmer Cloud READMEs, Floquet BUILD_SUMMARY, etc.) have no frontmatter → invisible to ceremonies. Add minimal frontmatter or acknowledge as bundle-owned. <!--if it at all makes sense move to a bundle, try to add an entry only when it is us creating new original content or connections -->
- `Crystal Audio/` is a `.wav` + `__pycache__` directory with no parent `.md` entry; `Trickster/twelve-word-summary.md` is an orphan bundle (no `Trickster.md` parent — possible harvest gap). <!--These may be a left over from developing the enrichment process, it is OK to stash them somewhere in an archive and see if we miss them at some point -->
- Enrichment: 20 `archived: true` cards sit interleaved with 5 live cards → add `Enrichment/Archive/` and move consumed cards (update supervisor-prompt queue-count logic).<!-- do some research into the enrichment process and the enrichment server, attempt to place these in a proper place based on that process, but yes, please clean up and recognize none of the enrichment stuff is critical this is a growing set of techniques and I expected some messyness in developing the process -->
- Generative Audio Devices handoff (2026-05-26) in Archive describes an unstarted T7a phase-2 move — may need re-surfacing rather than archiving. <!-- do research into the current state of Generative Audio devices, bias toward archiving, we can jump back into that project with a new roadmap -->

### T5 · Link quality — demote over-stretched `mirrors`/`enables` (PROPOSALS — awaiting Loudon's approval, 2026-05-28)
`mirrors` requires deep structural identity across domains; `enables` requires genuine causation. These five stretch that. Each is a claim about relationship *register* (the palace holds edges carry the most meaning), so none applied without sign-off. Check off to approve:

- [Approve] **Mathieu Equation → Crystal Synthesizer** (`mirrors`, label `bandgap-physics`). Mathieu tongues ≈ frequency bandgaps is a strong analogy, but Mathieu is *temporal* and the crystal is *spatial*; the entry's own body calls it an "analogy." → **`connects-to`, keep label `bandgap-physics`.** *(Counter-case: if you read Floquet↔Bloch as true structural identity, leave it `mirrors`.)*
- [ Approve]**Metaphor as Coupling Medium → Lateral Access** (`mirrors`). Thematic resonance (both = oblique approach), not deep structural identity. → **`connects-to`, label `oblique-cousin`.** The sibling `mirrors → [[Kuramoto Coupling]]` is genuine — **leave that one.**
- [ Approve] **Mixture of Experts → Harvest Ceremony** (`mirrors`). Harvest is about ingestion; the cleaner load-balancing mirror is the Weave. → **retarget to `mirrors [[Weave Ceremony]]`** (or demote to `connects-to [[Harvest Ceremony]]`).
- [ Approve] **Trickster → BBS Blackboard** (`enables`). Body says the Trickster *is* the TRICKSTER role in swarm sessions, not that it enables the board. → **`connects-to`** (or `spawned` if you read it as origin).
- [ Approve] **Trickster → Palace Agent Infrastructure Spec** (`enables`). Same reasoning. → **`connects-to`.**

### T6 · Bundle naming convention
- Blood Compressor bundle already normalized in this pass (`spawned-from` → `connects-to` + label). Decide canonical bundle link: `connects-to` + label `child-of` (SCHEMA §8) vs. preserved descriptive label. <!--child-of-->
- Retrospective Delay `stage-1/` files: filenames (`patch-spec.md`) don't match titles ("Retrospective Delay — Stage 1 Patch Spec"). Rename to `Foo — <type>.md`, or ratify the sub-bundle kebab pattern in SCHEMA §8. <!-- just make a decision to keep consistency wherever possible -->
- Biomechanical Synthesis `haiku-grotesque-pedagogy.md`: no frontmatter, no parent link. <!-- this should be in the Biomechanical synthesis bundle -->

### T7 · Foundational currency (not shortening — staleness)
- SUBSTRATE.md "Current State" → Self-Model Update Ceremony.
- SCHEMA.md §6 "currently split" list wrongly includes Hibernation Ceremony (never split — absorbed). ROSETTA.md ceremony table has a dead Hibernation row.
- JEWEL.md carries both v1.0 and v1.1 in-file → migrate v1.0 to `Jewel — Context.md`.
- Handoff Ceremony (12 KB) and Weave Ceremony (13 KB) exceed the ~8 KB ceremony split threshold.

---

## Schema decision — carried to [[Palace To-Do]]
Per Loudon (2026-05-28): non-canonical types are normalized to `connects-to` + label now, **but** the usage statistics are recorded so a schema change can be considered carefully later. `exemplifies` (×50) and `member-of` (×48) are used "many many times" — strong candidates for ratification as canonical types via a future Schema Ceremony. Do not change the schema reflexively; consider first.
