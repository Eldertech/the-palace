---
title: "Making a Palace Citizen — context"
born: 2026-07-01
links:
  - target: "[[Making a Palace Citizen]]"
    type: connects-to
    label: the-lab-for
forward_vector: "I am the lab beside the method — the running log where every made citizen is a test. I hold findings, the experiment queue, and the rollout tracker so the stable method card doesn't churn. My end-state is to accumulate enough evidence that the method's open questions resolve one by one into the card."
---

# Making a Palace Citizen — context

The workbench for [[Making a Palace Citizen]]. The card holds the stable method; this holds the *thinking and the experiments*. Append findings dated; keep the card clean.

---

## Findings log

### 2026-07-01 — The model designed

Reframed `person` entries from reference articles into **source material for embodiment**, after reading the machinery that consumes them ([[Palace Enchantment]], [[Dialectic]], [[Excellent Adventure]], [[Philosopher Visits the Entry]]). Settled the three-layer shape with Loudon: **body = the embodiable human · frontmatter = the newborn page-citizen (seed + behavioral forward_vector + agency_profile) · bundle = a research dossier.** Key insight: the **blindspot section is the surprise fuel** — the one ingredient all prior person entries lacked, and the thing that makes an embodied voice argue instead of flatter.

Decisions locked: body = person / frontmatter = page-citizen; person entries are newborn citizens (`stage: seed`) that grow; `dossier` is a new bundle type; `agency_profile` gets its first use on `person` entries.

### 2026-07-01 — Three prototypes built

[[Spinoza]] (flagship, metaphysician), [[Donella Meadows]] (systems scientist), [[John Cage]] (composer — the non-philosopher stress test). Max register spread on purpose: 1632 / 1941 / 1912; grave / warm / playful; philosopher / scientist / maker. Each got an embodiable body, a growing-citizen frontmatter, and a dossier. Committed `cf91e0b`.

### 2026-07-01 — First validation Dialectic (Spinoza ↔ Meadows)

Ran the first Dialectic between two *made* citizens under true multi-agent isolation (separate agents, frontmatter-only mutual knowledge, coordinator routing only OUTER messages), Sonnet both sides. Question: *when a thing strives, does it persist or transform?* Full transcript: [[Spinoza and Meadows on the Threshold]].

**What it proved (the method works):**
- **Distinct voices.** Spinoza's geometric gravity never blurred into Meadows's homely systems-warmth. Nameable with the labels stripped.
- **Real surprise.** Moves neither a summary nor the coordinator would produce (water→steam; *water falls, steam rises — same H₂O, opposite goal*; "no self in the drawer"; the co-built "threshold where conservation and transformation stop being opposites").
- **Blindspots fired.** Spinoza caught himself mid-argument in his *written* blindspot ("my oldest sin — dressing intuition as proof"). The dossier's "where they can't see" section did exactly its job.
- **Deeper-blindspot discovery.** Each found a flaw *beneath* the one on their page — Spinoza: his metaphysics assumes essence pre-exists; Meadows: her leverage ladder presupposes a conserved identity ("more Spinozist than I admit"). Only a real encounter produces this.
- **Growth loop closed.** Both proposed `forward_vector` revisions (applied) and *independently* proposed upgrading their link to `contradicts` / `homecoming-vs-becoming`. Deposited the yield into [[Threshold Conatus]] (`a22c3f7`).

**Caveat:** dossier quotes are from model knowledge, flagged in-file as "verify wording," not source-checked. Voices are faithful embodiments of the *pages*, not verbatim historical reconstructions.

---

## Experiment queue (tests to run)

- **Spinoza ↔ [[Deleuze]]** on the same axis (homecoming vs. becoming) — Deleuze is Spinoza's friendliest, sharpest push; does the citizen hold up against a philosopher who *loves* him and still radicalizes him? (Note: Deleuze is currently `type: concept`, not `person` — may need a citizen build first.)
- **A non-philosopher Dialectic:** [[John Cage]] ↔ [[Brian Eno]] — system-as-instrument, but Cage would call Eno's taste-driven curation "the ego sneaking back in." Tests whether maker-citizens produce friction as sharp as thinker-citizens.
- **Free Enchantment** of one citizen ("what do you want to do?") — tests whether the citizen's forward_vector is a real drive or a label ([[Palace Enchantment]] § Free Enchantment).
- **Tiered-dossier test** — build one citizen with a *light* dossier and one with the full corpus; compare embodiment fidelity. Answers the "does every citizen need the full dossier?" open question.
- **Person vs. page-citizen** — enchant the same page once as the *human* (Dialectic) and once as the *page-citizen* (self-reflective Enchantment); compare. Confirms the two-selves split is real and useful.
- **Caricature guard** — deliberately under-research a citizen and cast it; confirm the failure mode (flattering caricature) so the "deep research" rule is evidence-backed.

---

## Rollout tracker

- **Done (embodiable-citizen model):** Spinoza · Donella Meadows · John Cage.
- **Interim layer:** the other ~24 `People/` entries were prose-reworked from course-handout style on 2026-07-01 (`5ff3424`) — readable and link-woven, but *not yet* embodiable citizens (no blindspot section, no dossier, still `stage: mature`).
- **Pending:** upgrade the ~24 to the full model — Loudon running tests first, then batches (register-diverse, worst-gaps-first). Order and depth TBD per the Open Questions in the card.
- **Done:** the schema housekeeping was ratified in the **v1.14 Schema Ceremony** (2026-07-01), before the rollout — `dossier` in SCHEMA §8, `agency_profile`-on-persons in §3.1, seed-citizen stage semantics in §1. Additive/descriptive; mirror docs unaffected.
