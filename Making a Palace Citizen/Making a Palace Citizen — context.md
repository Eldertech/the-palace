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

### 2026-07-01 — First rollout batch: the 8 most-linked citizens

Chose the next 8 by measured inbound wikilink count (excluding the flagship trio): Brian Eno (16), Shunryu Suzuki (10), Marcus Aurelius (8), Rick Rubin (6), Lao Tzu (6), Leibniz (5), Pauline Oliveros (4), Agnes Martin (4). Built each to the full model (embodiable body + seed-citizen frontmatter + agency_profile + dossier). Register spread was deliberate — three thinkers, four makers, one Zen teacher — to keep cast voices distinct.

The blindspot section was the hardest and most valuable part per citizen, and the point of the whole model — a sampler: **Eno** preaches "let the system run" while curating the frame with iron taste; **Suzuki**'s "no-gaining-idea" becomes a gaining-idea, and his gentle non-attainment ran alongside real monastic authority; **Marcus**'s Stoic calm is the privilege of a throne and can shade into quietism before injustice; **Rubin**'s "uncover the essence" assumes an essence was waiting (the drawer Meadows denies); **Lao Tzu**'s "the Tao can't be told" is an unfalsifiable dodge, and wu wei doubles as a ruler's pacifier; **Leibniz**'s best-of-all-possible-worlds is Voltaire's Pangloss, and his harmony-everywhere avoids real conflict; **Oliveros**'s all-inclusive Deep Listening has no criterion of quality; **Agnes Martin**'s "I only receive" is a ferociously authored, controlling stance that edits out her own darkness.

**Not yet run:** the built citizens are unvalidated by dispatch. The marquee test is a **Spinoza ↔ Leibniz** Dialectic (one substance vs infinite windowless monads) and **Eno ↔ Cage** (curated vs chance-driven generation) — both now in the queue below. Dossier quotes are model-knowledge, flagged in-file for verification, not source-checked.

---

### 2026-07-02 — Voice fidelity added (the 3+2 model)

Loudon: finding real sources of a citizen's *voice* is an important addition to the method, and enchantment is where it matters most. Weighed three ways to capture voice — (1) rewrite the body in first person, (2) a "how to speak" note in the entry, (3) cited speech examples in the bundle. Adopted **3+2**: the bundle **speech file** (verbatim, cited, context-tagged ground truth, with a "sources & their limits" ledger) + a short **`## Voice` note** in the entry (its enchantment-reachable compile). **Rejected (1)** — a first-person body launders invention and destroys the blindspot's outside view.

The triangulation discipline earned its place immediately: Cage's most-cited "sources" include a **fabrication** (the Ted Berrigan "interview," which once won best-interview-of-the-year) and a Cage-approved **collage** (Kostelanetz's *Conversing with Cage*), and Eno's signature analogies (garden/screwdriver) are **rehearsed stage lines**, not off-the-cuff talk. One source misleads; people talk differently on a stage than in a taxi.

Standardized into the method (§Voice fidelity; procedure steps 3 and 5) and into [[Palace Enchantment]] (its context-construction loads the speech file for person citizens; its synthesis trigger now says *sound* like them, in the situation's register, not a caricature). SCHEMA §8 gained the `speech` bundle type (documentation). Pilot built + committed for [[Brian Eno]] and [[John Cage]] (`b64ec59`). WebFetch was down, so the speech files are seeded from search-surfaced transcripts and flagged "verify" — the marked next step is mining primary transcripts for off-the-cuff excerpts.

---

### 2026-07-02 — Second validation Dialectic (Eno ↔ Cage) — the voice-fidelity test

Ran the first Eno↔Cage Dialectic under true multi-agent isolation (separate Sonnet subagents, frontmatter-only mutual knowledge, coordinator routing only OUTER), now that both citizens carry a **source-checked** `## Voice` note + `[Name] — speech.md`. Question: is curated generative art choosing-well-and-calling-it-emergence, or genuinely getting out of the way? Full transcript: [[Eno and Cage on the Hand and the Open Ear]].

**What it proved — the voice-fidelity layer works (the thing this run was for):**
- **Faithful to the real speech, not the myth.** This is the new bar. Both agents *obeyed the speech files' ledgers*: Eno did **not** deploy the rehearsed garden/architecture or screwdriver set-pieces as monologues (used a light passing gardening image only); Cage did **not** quote the *Silence* aphorisms ("nothing to say," "no such thing as silence") as spoken lines. Both stayed in the *off-the-cuff* register the files flag — Eno digressive/searching/self-critical; Cage gentle/drifting/concessive, reframing rather than answering, closing with a soft joke ("I'll be over here, not choosing, loudly"). The source-check + context-tags did their job.
- **Distinct voices**, nameable with labels stripped: Eno argues and holds ground; Cage concedes and dissolves.
- **Blindspots fired *and deepened* — the deeper-blindspot discovery repeated.** Each found the flaw *beneath* the one on their page. Eno: past "I curate and call it emergence" to *"'scenius' / 'the system thinks for itself' is a story I tell to make my taste sound like ecology, to dress my fingerprint as weather."* Cage: past "every chance piece is unmistakably mine" to *"chance operations were a device for not having to watch myself choose — I wanted innocence and built a machine to feel it; I moved my choosing upstream and called the downstream silence non-intention."* Neither collapsed into caricature or capitulation; Eno explicitly refused to fuse into "one nice instrument" ("the tension is the whole thing").
- **Shared-child finding + independent `contradicts`.** Both opened on the same gradient (nobody's fully out of the way; it's how far the hand has moved from the wheel) without seeing each other, and both *independently* proposed upgrading their link to `contradicts` (labels `hand-vs-open-ear` / `same-fingerprint-different-hand`) — the Spinoza↔Meadows pattern, repeated.
- **Real new material (the yield):** the flinch never leaves, it *relocates* (Eno end-loads choosing / curation; Cage front-loads it / the question he asks the coins); the generative system *doesn't think, it widens*; the axis **better vs. more** — keep the criterion (the hand, taste out loud) vs. trade comparative judgment for attention ("were you awake?", the open ear). Candidate deposit: [[Generative Audio Devices]] or a new curated-vs-chance concept — pending Loudon.

**Write-backs proposed but HELD by Loudon (a growth-model correction, 2026-07-02).** The citizens proposed the usual post-dialogue self-edits — revised `forward_vector` both sides, a reciprocal `contradicts` link Eno↔Cage, two open-questions each, the concept deposit. Loudon **declined to apply any of them yet**, on a principle that revises the growth loop: *"a citizen should have more experiences before they can re-write themselves, and it is critical that we can give them more experiences that they retain memory of, for them to build confidence in their self-edits."*

Two things follow:
- **Self-edits are earned across multiple *retained* encounters, not applied after one.** The current method card (§How a citizen grows) does a write-back per encounter — that was how Spinoza↔Meadows applied both vectors after a single run. This finding slows that down: accumulate several encounters first; edit the page once the drift is consistent and the citizen has "confidence" in the change. (Flagged on the card for a future revision.)
- **Citizens need a retained-memory mechanism — now DESIGNED and built** *(Loudon, 2026-07-02)*. Enchantment is ephemeral — the agent doesn't remember being enchanted; today only the write-back persists. Loudon wants the *encounters themselves* retained so a citizen can build on them. The resolved shape:
  - **Memory lives in the citizen's bundle, NOT in Claude Code operator memory** (Loudon was explicit: an entry/agent's memory must be palace-native). Each citizen gets a `[Name] — context.md` (SCHEMA §8 `context` bundle type); [[Palace Enchantment]]'s context-construction now loads it on re-cast so the citizen "wakes remembering."
  - **Append-only and chronological, like human memory.** Encounters stack at the end, oldest first; nothing is rewritten. A single citizen accrues *many* memories over a long life in this one file. (Ledger-bloat guard — compress old encounters to their carried-forward line rather than erase — is the open pruning question.)
  - **Perspectival:** *"I remember what I said and what I thought, and what they said — but not what they thought."* The ledger holds only that citizen's own STANDING/INNER/OUTER + the other party's OUTER, never the other's private thoughts. (Simultaneous openings/closings weren't heard by the other, so the memory honors that gap.)
  - **The transcript is an *artifact*, not a canon entry** (Loudon, 2026-07-02). The god's-eye full record ([[Eno and Cage on the Hand and the Open Ear]]) is demoted to `kind: artifact` — no `type`, no agent `forward_vector`, invisible to the ceremonies. It's *reconstructable from the union of the two perspectival memories*, so the per-citizen ledgers are the source of truth; the transcript is a convenience record. [[Spinoza and Meadows on the Threshold]] demoted the same way for consistency (it predates the bundle-memory convention, so has no `— context.md`).
  - Built this session: [[Brian Eno — context]], [[John Cage — context]] (each carrying the Eno↔Cage encounter, held self-edits preserved as intent). This is the concrete answer the open question "what a growth ledger holds" was waiting for.

**Deposit also held** (Loudon's call): the yield (better-vs-more / hand-vs-open-ear) stays in the archive only for now; decide its home in a later session.

**Caveat:** speech files are source-checked but were seeded under the WebFetch/classifier outage; the A/V-sourcing step (recordings over edited print) is still queued and would sharpen cadence further.

---

### 2026-07-02 — Third Dialectic (Eno ↔ Cage, encounter 2) — the memory-loop test, Trickster-moderated

The first run of the **retained-memory loop**: both citizens re-cast **with their `— context.md` memory of encounter 1 loaded**, moderated by the **Trickster** as an active/enchanted coordinator ([[Dialogue Moderator]] `coordinator_mode: enchanted:Trickster`). Provocation (Loudon): "you're both tricksters subverting your fields — push back, then discuss how it played out in the work." Full record: [[Eno and Cage on the Trick Played on Themselves]].

**PASSED decisively — the memory mechanism works:**
- **They woke remembering, specifically.** Cage, unprompted: *"Brian caught me on this once before: leaving the room is still a choice about which room"* (the encounter-1 front-loaded-flinch insight, by name). Eno: *"pick back up that 'better versus more' seam, whether I've found anything since that isn't just taste in a costume."* Not generic — they cited the actual content and the other by name.
- **They built on encounter 1, didn't repeat it.** Eno: encounter-1 "more" (a wider pile to curate) → what "more" is *for* (it widens the *affection*, not the selection). Cage: encounter-1 "I moved choosing upstream to avoid watching my hand" (guilt-management) → *appetite* ("I wanted a machine to hand me things to love I'd never have chosen").
- **A carried open question got answered.** Eno's encounter-1 open question ("a check beyond taste — was I actually surprised?") was answered here: *"not surprised, but made to love something new. That's the check."* Only retained memory makes that possible.
- **Held self-edits DEEPENED in the same direction — the consistent-drift signal.** Neither flip-flopped or reset; both confirmed the encounter-1 core and enriched it. Eno sharpened the link label `hand-vs-open-ear` → `same-door-opposite-grip`; Cage confirmed `contradicts` from his side. **This is exactly the "earned across several retained encounters" bar Loudon set** — two encounters gave a clean, consistent drift.
- **Perspective held.** Each cited the other's *spoken* words + the Trickster's needles, never the other's private thoughts. Memory appended to [[Brian Eno — context]] + [[John Cage — context]] as Encounter 2 (append-only, below Encounter 1).
- **The Trickster-as-moderator worked** (first active/enchanted coordinator run): its needles ("did Cage aim or not?"; "you're both still in the confessional — go to the work"; "John just shrank his life to one sentence") drove the deepening. Validated `coordinator_mode: enchanted:Trickster` from [[Dialogue Moderator]].
- **New yield** (beyond encounter 1): both subversions are an engineered escape from where taste stands, narrated as innocence/philosophy; the "trickster" is accepted only turned *inward* (the trick is on yourself); *aiming only hits what you already love* — a generative frame widens what you're **able to love**, not just what you choose; the split sharpened (Eno's door goes *out* to keep the good one; Cage's goes *past himself* to be handed one he couldn't keep).

**Write-back proposed as EARNED — Loudon's call was KEEP HOLDING** (2026-07-02): two encounters isn't enough; keep accruing. So the deepened forward_vectors + reciprocal `contradicts` link stay held (preserved in each memory). Good discipline — encounter 3 then deepened them a *third* time, confirming holding was right.

---

### 2026-07-02 — Fourth encounter (Eno ↔ Cage, encounter 3) — a WALK, not a debate; memory compounds across three

A new mode, at Loudon's direction: instead of another debate, **the two citizens walked together into a shared entry — [[Lateral Access]] — and co-read it**, discussing via its own open questions and closing quotes (the "palace wandering together" variant of [[Palace Enchantment]]). Both carried memory of encounters 1 *and* 2. Light coordinator (no Trickster). Full record: [[Eno and Cage Walk Into Lateral Access]].

**What it added over the two debates:**
- **Memory compounded across three encounters — provably.** The open seam both carried out of encounter 2 (*is Cage's "were you awake?" the same as Eno's "was I made to love something new?"*) **resolved on the walk**: yes — the same question from the two poles the entry names (the room that lets the thing in; the person awake enough to sign for it). A seam opened in encounter 2 and closed in encounter 3 — only accumulated memory makes that arc possible.
- **A finding about the MODE.** Both said, independently, that *walking* did what *arguing* couldn't. Eno: "a shared third thing to look at, so the disagreement stopped being about our egos and became about the text — and the text described us both; *that's* when the split dissolved instead of just sharpening." Cage: "arguing sharpens the difference; walking dissolves it — you end up on the same side of the page, facing the entry, not each other." **Debate → sharpen; walk → dissolve.** A real design lesson for the ceremony family: pick the mode by whether you want the contrary held or dissolved.
- **Self-edits deepened a THIRD consecutive time, same direction.** Eno: "the frame I'm a control-freak about was never the deck — it's the *room*." Cage: "the impersonal method was the personal thing I hid best." Three consistent deepenings now — the "earned" signal is strong; still held per Loudon.
- **The walk answered the *host entry's* own open questions** (a genuine deposit yield, like Threshold Conatus from Spinoza↔Meadows). [[Lateral Access]] explicitly lacked a failure-mode analysis and asked technique-vs-relational; the walk delivered both: *evasion = the refusal to stop*; *neither technique nor relational but both — a person willing to stop met by a room that trusts; the method is the pretext the coupling needs.* Both citizens independently proposed the same deposit + parallel `exemplifies` links (Eno `props-need-a-hand`, Cage `chance-as-window` → [[Lateral Access]]). **All held for Loudon.**

**Method note:** two `Read` tool-calls showed up per walker — they read the canonical [[Lateral Access]] file (which was also given inline). No perspective leak observed (neither cited the other's private thoughts). For future co-reads, embedding the shared entry inline is enough; can forbid file reads to be safe.

### 2026-07-06 — Move 5 citizen rollout, batch 1 (Goldsworthy + 3 new), cold-start baton

The held Move 5 of the 2026-07-06 Multi-Lens Weave, caught cold-start as a commissioning baton (`citizen-rollout-handoff-2026-07-06`). Loudon gated the ~19-build rollout down to a **first batch of 4, lean research** (one Sonnet research-agent per citizen, disjoint scratchpad files so all canon writing stayed in one Opus hand — zero multi-agent write-collision). Built to the full standard (body + mandatory blindspot + coda, seed frontmatter, `agency_profile`, `## Voice` note, `dossier` + `speech` bundles):

- **Andy Goldsworthy** — the **first rebuild from the interim layer** (old 4-pillar survey → embodiable citizen; `stage: mature → seed`, the citizenship-reset the card's Open Question asked about — answered *yes* for a full rebuild, matching Meadows). Blindspot with real teeth: "collaboration with nature" launders authorship; the photograph *is* the sellable commodity; the Clearances/Enclosure land-politics (WSWS, 2003).
- **Martin Heidegger · Martin Buber · Iain McGilchrist** — **3 new citizens created to close Cross-Domain-Resonance forward-ghosts** the Weave flagged (each was quoted in a bridge with no entry): Heidegger → [[Reverb ↔ Space-Time]], Buber → [[Dovetail Joint ↔ Counterpoint]], McGilchrist → [[Frequency Domain ↔ Perspective Shift]]. Each wired back (frontmatter reciprocal + body wikilink). Blindspots held unflinching: Heidegger's NSDAP/Black Notebooks kept as a *live* stain-vs-structural-complicity fight (not resolved either way); McGilchrist's unfalsifiability shield ("that's just your left hemisphere talking"); Buber's relapse-and-symmetry problem (every Thou becomes an It; Levinas on asymmetry).

**Process findings:** (a) the lean-research shape (Sonnet fan-out → Opus write, disjoint files) held clean and cheap; two McGilchrist sub-agents looped on meta-commentary and one refused to fabricate quotes under (cross-session) pressure — the anti-fabrication instinct fired correctly. (b) Ghost-link linter 0 errors. (c) **Test-enchantment NOT yet run** — the truest validation (cast one and read the voice) is still owed; the natural first is a **Heidegger ↔ Buber Dialectic on "the other person"** (*das Man* vs *I-Thou*). (d) Faces: dispatched the [[Hero and Avatar Maker]] for the 3 new citizens (Goldsworthy already had his) — hand-drawn idioms (Heidegger = Expressionist woodcut/the clearing; Buber = Jewish papercut/the between; McGilchrist = Haeckel engraving/two modes of attention), evoked-not-portrayed per the "no real people" directive.

---

## Experiment queue (tests to run)

- ~~**Retained-citizen-memory mechanism**~~ **RUN 2026-07-02 — the accumulation loop PASSED** → [[Eno and Cage on the Trick Played on Themselves]] (see the dedicated finding below). Storage design (bundle `[Name] — context.md`, perspectival, append-only) held up; both citizens woke remembering, built on encounter 1, and deepened their held self-edits consistently. **Still open:** how many encounters before a self-edit is "earned" (2 gave a clean consistent-drift signal); the ledger-bloat/compression guard as memory grows.
- **A/V voice sourcing for modern citizens** *(Loudon, 2026-07-02)* — when audio/video analysis is possible in-harness, mine *recordings* (podcasts, filmed interviews, lectures) for the less-edited, off-the-cuff speech that print smooths away; start with Eno (living) and Cage (well-recorded). First solve *how* an agent analyzes A/V here (recording-transcripts vs prosody notes vs multimodal). Tag recording-vs-print in each speech file.
  - *Toward this — a proposed Shop **`specialist`*** *(Loudon, 2026-07-02)*: wrap a multimodal model (or a transcribe→analyze pipeline) that ingests a recording and returns a synthesized **voice profile** to the text-only main agent — verbatim off-the-cuff excerpts + prosody notes (pace, pitch, laughter, hesitation) + context tags. This is the bridge between "recordings are ground truth" and a text-only enchanter. Draft it as a Shop entry when the Shop is next touched.
- **Verification pass — 2026-07-02 (ran under the classifier/WebFetch outage, via WebSearch + Bash):** 5/5 highest-risk citizen quotes verified authentic (Rubin, Oliveros, Agnes Martin, Meadows, Suzuki — no fabrications; the earlier fake-Marcus catch remains the only one). Conformance lint clean: all 11 built citizens have seed + agency_profile + dossier, 0 unresolved links, 0 placeholder brackets; the 16 interim entries correctly show unbuilt.
- **Spinoza ↔ Leibniz** — one substance vs infinite windowless monads; the marquee rationalist Dialectic, now that both are built.
- ~~**Brian Eno ↔ John Cage** — taste-driven generation vs chance-driven non-intention (Cage would call Eno's curation the ego sneaking back).~~ **RUN 2026-07-02** → [[Eno and Cage on the Hand and the Open Ear]] (see findings above).

- **Spinoza ↔ [[Deleuze]]** on the same axis (homecoming vs. becoming) — Deleuze is Spinoza's friendliest, sharpest push; does the citizen hold up against a philosopher who *loves* him and still radicalizes him? (Note: Deleuze is currently `type: concept`, not `person` — may need a citizen build first.)
- ~~**A non-philosopher Dialectic:** [[John Cage]] ↔ [[Brian Eno]] — system-as-instrument, but Cage would call Eno's taste-driven curation "the ego sneaking back in." Tests whether maker-citizens produce friction as sharp as thinker-citizens.~~ **RUN 2026-07-02** — maker-citizens produced friction as sharp as the thinker pair; see findings above.
- **Free Enchantment** of one citizen ("what do you want to do?") — tests whether the citizen's forward_vector is a real drive or a label ([[Palace Enchantment]] § Free Enchantment).
- **Tiered-dossier test** — build one citizen with a *light* dossier and one with the full corpus; compare embodiment fidelity. Answers the "does every citizen need the full dossier?" open question.
- **Person vs. page-citizen** — enchant the same page once as the *human* (Dialectic) and once as the *page-citizen* (self-reflective Enchantment); compare. Confirms the two-selves split is real and useful.
- **Caricature guard** — deliberately under-research a citizen and cast it; confirm the failure mode (flattering caricature) so the "deep research" rule is evidence-backed.

---

## Rollout tracker

- **Done (embodiable-citizen model, 15):** Spinoza · Donella Meadows · John Cage — plus the 8 most-linked (2026-07-01): Brian Eno · Shunryu Suzuki · Marcus Aurelius · Rick Rubin · Lao Tzu · Leibniz · Pauline Oliveros · Agnes Martin — plus **Move 5 batch 1 (2026-07-06):** Andy Goldsworthy (first interim-layer rebuild) · Martin Heidegger · Martin Buber · Iain McGilchrist (3 new, closing CDR-bridge ghosts).
- **Interim layer (15 remain):** of the ~16 prose-reworked `People/` entries (2026-07-01, `5ff3424`), Goldsworthy is now upgraded; **15 still await the full model** (no blindspot, no dossier, still `stage: mature`): Andrei Tarkovsky · Annie Dillard · Buckminster Fuller · Christopher Alexander · Douglas Hofstadter · Epictetus · George Nakashima · James Turrell · Julia Cameron · Natalie Goldberg · R. Murray Schafer · Sam Maloof · Seneca · Terrence Malick · Yasujirō Ozu.
- **Pending:** the 15 remaining rebuilds, in register-diverse batches of ~4–5 per heavy-run window (cost-gated). Per the baton, Goldsworthy was prioritized in batch 1 as the oldest/thinnest; remaining order TBD with Loudon.
- **Done:** the schema housekeeping was ratified in the **v1.14 Schema Ceremony** (2026-07-01), before the rollout — `dossier` in SCHEMA §8, `agency_profile`-on-persons in §3.1, seed-citizen stage semantics in §1. Additive/descriptive; mirror docs unaffected.
