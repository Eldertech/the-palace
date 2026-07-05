---
title: "BLUELINE — Specialists and Seams"
born: 2026-06-17
forward_vector: "I answer the question the Production Pipeline's forward vector raised — how many Specialists does BLUELINE actually need, what does each one do, and where are the seams between them — by showing that the pipeline's stages are MOSTLY the Shop's existing Specialists, that the seams are the board-record handoffs (two of them genuinely hard), and that Loudon is the Producer/auteur above the foreman, not the Director-stage inside it."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: specialist-structure-for
  - target: "[[BLUELINE — Production Pipeline]]"
    type: deepens
    label: answers-its-forward-vector
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: the-inter-specialist-contract
  - target: "[[The Shop]]"
    type: connects-to
    label: reuses-the-roster
  - target: "[[Shop/Maker]]"
    type: connects-to
    label: dispatched-as-a-recipe
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: exemplifies
    label: the-seams-are-the-only-new-work
  - target: "[[Trickster (Loudon)]]"
    type: connects-to
    label: loudon-is-producer-not-director
---

# BLUELINE — Specialists and Seams

> **Historical (2026-07-03).** Its central question — how many Specialists does BLUELINE need — is now
> answered by live entries: **[[Shop/Figure Rig]]** (figure & pose), **[[Shop/Lettering]]** (text), and
> **[[Frame Designer]]** (the Maker's per-medium foreman that dispatches them). The seam analysis
> (Seam A solved-by-design, Seam B the frontier) is still current and lives on in
> [[BLUELINE — Production Pipeline]]. Kept for the reasoning; the roster it predicted is real now.
>
> The [[BLUELINE — Production Pipeline]] forward vector asks for "each stage to grow its own role-Specialist
> (Director / Board artist / DP-layout / Render-AI / Editor) under a BLUELINE [[Maker]]-style foreman, so the
> team is real and not a metaphor." This doc answers it — and the answer is **smaller and more reused** than
> "one new Specialist per stage." The convergence Loudon sensed is real: the pipeline stages are *mostly the
> Shop's existing Specialists*, the seams between them are the **board-record handoffs**, and only **two**
> seams are genuinely new work.

## The thesis in one line

**A Specialist is a tool-citizen; a pipeline stage is a job.** Most BLUELINE stages are *jobs that an
existing Shop Specialist already does* — so BLUELINE needs **~3 new Specialists, not 7**, and its "Maker" is
a **gated recipe** under the existing [[Shop/Maker]], not a rival foreman. The board record is the typed
Job Contract that flows between them, exactly as the Shop Maker's Job Contract flows between Shop Specialists.

## The stage → Specialist map

| # | Pipeline stage / role | Maps to | New or reuse | Hand-off to next stage |
|---|---|---|---|---|
| 0 | Locked track | the **M4L clock** (Track III) | **plumbing** (infra, not a creative Specialist) | `(bar,beat)→frame` clock stamped onto every record |
| 1 | **Director** (treatment / beat map) | the **staging brain** — language → intent → staging-spec | **NEW (thin)**; *taste is Loudon's* | concept → a partial board record |
| 2 | **Board artist** (storyboard / ekonte) | the **comic renderer** (the M0–M2 animatic player — BLUELINE's *own* opinionated vocabulary) | **NEW** (the bias *is* the product) | the board record (comic register) |
| 3 | **Editor** (animatic / story reel) | the **beat-lock player** (Track III clock + the comic renderer) | **tooling** (a use of #0+#2, not its own citizen) | beat-locked board record |
| — | **▶ SEAM A — board → layout (2D → 3D)** | one record, two fidelities | **the only-new handoff** | — |
| 4 | **DP / layout** (blocking, conditioning passes) | **[[Shop/Blender]]** | **REUSE** | POSE/DEPTH/EDGE/NORMAL passes |
| — | **▶ SEAM B — layout → render (staging → conditioning)** | [[Blocked, Not Prompted]] | **the frontier (real R&D)** | — |
| 5 | **Render-AI** (the paint) | **[[Shop/ComfyUI]]** + **[[Shop/FLUX (Hugging Face)]]** + **[[Shop/LoRA Trainer]]** (+ PuLID) | **REUSE** | rendered frames |
| 6 | **FX** (the motion spine) | the **flow-field** ([[The Flow Field is the Spine]]; Go-with-the-Flow / warped noise) | **NEW** (or a ComfyUI recipe — see below) | dense motion conditioning across registers |
| 7 | **Editor** (the cut / online) | **[[Shop/ffmpeg]]** | **REUSE** | the beat-muxed film |

## How many Specialists, actually?

**Three genuinely new tool-citizens**, plus one piece of plumbing — far fewer than the seven stages:

1. **The Staging-AI** (Director + Board artist *brain*) — language → the staging-spec → a partial board
   record. This is BLUELINE's own; nothing in the Shop turns a sentence into a typed staging spec over a
   *curated* vocabulary. (Stages 1 and 2 share one brain; the *renderer* is separate — see #2.)
2. **The Comic Renderer** (Board artist + Editor *hands*) — the M0–M2 animatic player: the inked register,
   the staging vocabulary, the motion comic. This is the **opinionated vocabulary** — the bias that *is* the
   product. It will likely earn a `Shop/` Specialist entry of its own once it stabilizes, because it is a
   reusable tool (a comic-register player for any beat-locked storyboard — already noted as a palace ship).
3. **The Flow-Field / FX** — one authored field at three resolutions. *Open whether it is a Specialist or a
   Recipe inside [[Shop/ComfyUI]]*: the [[BLUELINE — Deposit Map]] already set the precedent that the toyxyz
   conditioning rig is a **recipe inside [[Shop/Blender]]**, not its own Specialist, "because it's a way of
   *using* Blender." By the same test, the flow-field is likely a **recipe** (a way of using ComfyUI's
   warped-noise / Go-with-the-Flow nodes) unless it grows a tool of its own — call it a Specialist only when
   it earns one.

Everything else **reuses the Shop**: Blender (DP/layout), ComfyUI+FLUX+LoRA (render), ffmpeg (the cut). The
**clock** is Track III plumbing (a clock device + relay), not a creative Specialist — though it could be
wrapped as a `Shop/` *plumbing*-medium Specialist if the Shop wants it in the Roster. The **Editor/animatic**
(stage 3) is *tooling assembled from #0 + #2*, not its own citizen.

> The discipline that keeps the count honest: **a stage earns a Specialist entry only when it binds a
> versioned external tool, exposes a typed dispatch surface, and accumulates gotchas across jobs**
> ([[SCHEMA]] §3.2). "Director" doesn't (yet) — it is a prompt-role over an LLM; it stays a *job the
> Staging-AI runs*, not a Specialist, until it has its own tool and its own accumulating wisdom.

## The seams ARE the contract

Every arrow in the table above is a **board-record handoff** — the [[BLUELINE — Board Record Schema]] is the
typed Job Contract between role-Specialists, the exact analogue of the Shop Maker's Job Contract between Shop
Specialists (its "who reads/writes which fields" table *is* the inter-stage wire). Most handoffs are clean —
one stage writes fields, the next reads them. **Two are hard, and those two are the only genuinely new
engineering in the whole pipeline** ([[Adopt the Craft, Author the Seam]]):

- **Seam A · board → layout (2D → 3D):** a *handoff solved by design* — one record rendered at two
  fidelities (comic = cheap, Blender grey-box = exact); depth round-trips back. A discipline, not a research
  risk. (The Blender render gallery, `proofs/blender-gallery/`, stress-tests exactly this seam.)
- **Seam B · layout → render (staging → conditioning):** *the frontier* — turning exact blocking into exact
  OpenPose/ControlNet keypoints a diffusion model obeys. This is [[Blocked, Not Prompted]]; the real R&D.

So "where are the natural seams?" — they are the board-record field boundaries, and the two that need
authored work are A and B. The convergence is exact: the pipeline's seams, the Shop's Job-Contract handoffs,
and "author only the seams" are **the same idea seen from three angles.**

## Do we need a BLUELINE Maker?

**Probably not a second `maker`-type entity — at least not yet.** The Shop already has one foreman
([[Shop/Maker]]) for the whole Shop, and it already knows how to **gate one Specialist's output as another's
input** — the 2026-05-30 "Narrated Beats" recipe (Kokoro → Whisper word-times it → Manim renders on the
timestamped word → ffmpeg muxes) is *structurally a pipeline*. BLUELINE's seven-stage gated sequence is the
same shape at larger scale.

So the minimal, honest structure is: **BLUELINE is a Maker *recipe*** — a named, gated dispatch sequence the
existing Shop Maker runs, with the board record as the contract and Seams A/B as the gated handoffs. We get
the "real team" the forward vector wants *without* minting a rival foreman.

**When would BLUELINE earn its own foreman?** When it accumulates house standards, comparison modes, and a
standing roster that the *general* Shop Maker shouldn't carry — i.e. the same threshold the Shop itself flags
as open ("does the singular Maker hold past ~15 Specialists, or split into per-medium Designers?"). Recommend:
**start as a recipe; promote to a thin BLUELINE foreman only when it earns one** — the rung discipline applied
to org structure.

## Who is Loudon?

**Loudon is the Producer and the auteur — not the Director-stage.** Three consistent framings already exist
in the palace, and they all put him *above* the foreman, never inside the pipeline:

1. **`who_leads: loudon`** on every BLUELINE doc — he sets direction.
2. **Producer** — the human layer *above* the Maker. The Shop names this explicitly: "*the Trickster
   (Loudon) plays the Producer role*" for cross-medium, multi-day briefs ([[Shop/Maker]] Open Questions;
   [[The Shop]]). The Shop even *rejected* "Director" as the orchestrator name (its Lost Branches:
   '"Director" as the layer name — replaced by "Maker"').
3. **[[Trickster (Loudon)|TRICKSTER]]** — the wire-level/swarm name for the human-decision node who can
   reach into any running stage and change it ([[SCHEMA]] §9: posts `RESOURCE_GRANT`/`RESOURCE_DENY`).

So **"Director" in the pipeline is an AI *stage-role*** that drafts a treatment/beat-board — it is *not*
Loudon's title; reusing it for him would collide with the stage and contradict the Shop's own naming.

But the deeper answer is the auteur point, and it matters more than the org chart: **BLUELINE's thesis is
"the bias is the product"** ([[BLUELINE]]). The opinionated vocabulary, the point of view, the taste — that
is *Loudon's*. The AI "Director" stage doesn't *originate* the directorial vision; it *encodes Loudon's
vision* into a treatment the downstream stages can execute. So:

> **Loudon = the Producer (org position) who is also the auteur (taste source).** He greenlights, sets the
> bias, and interrupts as TRICKSTER. The pipeline's **"Director" is the AI role that drafts from his
> intent** — the hand, not the eye. Adopt **Producer** as his title (consistent with the Shop), keep
> **Director** for the AI stage, and remember the taste is his regardless of the label.

This also answers a quiet design question: it tells the Staging-AI (Director-stage) what its job *is* — not
"have taste," but "**apply Loudon's curated vocabulary faithfully**, and flag what it can't, rather than
inventing its own look." The bias lives in the vocabulary Loudon authors; the Director-stage is its loyal
executor. (This is [[Cooperation Yields Agency]] in the pipeline: shared intent + complementary capability,
not the AI substituting its taste for his.)

## Open questions

- **Director-stage: prompt-role or eventual Specialist?** It stays a job the Staging-AI runs until it binds a
  tool and accumulates gotchas. Watch whether "drafting a treatment from Loudon's vocabulary" grows enough
  working wisdom to earn an entry.
- **Flow-field: Specialist or ComfyUI recipe?** Decide by the toyxyz test — a *way of using* an existing tool
  is a recipe; a new tool-citizen is a Specialist.
- **Recipe vs. foreman for BLUELINE itself** — promote only when house standards + a standing roster exceed
  what the general Shop Maker should carry.
- **Does the Comic Renderer become `Shop/Comic Renderer`?** It is already flagged as a palace ship (a
  comic-register player for any beat-locked storyboard); when it stabilizes it likely earns a `Shop/` entry,
  at which point BLUELINE *reuses* it like Blender — the reuse-count grows, the new-count shrinks further.
