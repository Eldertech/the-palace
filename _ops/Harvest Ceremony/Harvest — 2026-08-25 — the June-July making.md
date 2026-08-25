---
title: Harvest — 2026-08-25 — the June-July making
born: 2026-08-25
links:
  - target: "[[Harvest Ceremony]]"
    type: connects-to
    label: harvest-of
  - target: "[[GenAI Camera]]"
    type: connects-to
    label: harvested-from
  - target: "[[BLUELINE]]"
    type: connects-to
    label: harvested-from
forward_vector: "I hold the deposit candidates found in June and July's making — the craft principles that got captured inside project bundles but never lifted into concepts anyone outside the project would find. I end when each candidate has been deposited, merged into an existing entry, or declined with a reason."
---

# Harvest — 2026-08-25 — the June–July making

The palace spent June and July making things: [[GenAI Camera]], [[BLUELINE]], the Figure Rig, the
People rebuilt as citizens, [[The Commons]]. The craft knowledge was captured well — the GenAI Camera
gotcha list is the palace working exactly as designed, catching findings at the resolution they were
learned.

What this harvest looks for is the next step up: principles that are **general but filed as
tool-specific**. A finding that lives only inside a project's gotcha list is retrievable by someone
already in that project, and invisible to everyone else. The Four Pillars say cross-domain synthesis
is the prize; a principle that never leaves its bundle never gets to pay out.

Five candidates, ranked by how far they travel.

---

## 1. Impose it at generation, don't recover it after ⭐

**Where it lives now:** [[GenAI Camera]] § Gotchas, recipe *"Scale must be imposed at generation,
every approach"*.

**The finding.** Placement and scale must be imposed at the moment of generation, not recovered
afterward. A standalone txt2img figure fills the frame regardless of the pose skeleton's size, so any
after-the-fact cutout faithfully cuts out a giant. The palace learned this **three separate times** —
via segment, via the inpaint region, via rich-first — before naming it. The sharpest line in the whole
bundle: *"the nude mask had secretly been doing the placement all along."* A step you thought was
cosmetic was carrying a constraint, and you only find out when you remove it.

**Why it travels.** This is not about ControlNet. It is the general shape of a class of mistake: a
constraint that must be present *while* a thing is made cannot be added to the finished thing. Mixing
— commit the space at the source, don't fix it in mastering. Teaching — a session's pedagogical target
shapes what gets built, it can't be narrated on afterward. Writing — structure is imposed in the
outline, not recovered in the edit. Code — an invariant enforced at construction beats one asserted
downstream.

**Candidate links:** `deepens` [[ControlNet as Topology]] · `mirrors` [[The Curve Is the Material]] ·
`connects-to` [[Adopt the Craft, Author the Seam]] · `exemplifies` [[FOUR PILLARS]]. Note the
three-independent-rediscoveries pattern also makes it a case of [[Search Before You Build]] — the
palace kept re-deriving its own finding.

## 2. Rich first, stylize last ⭐

**Where it lives now:** five project files — [[GenAI Camera]], [[BLUELINE]], [[Frame Designer]],
[[Line-Art Layer Decomposition]], [[Animate the Background]] — and **no owning entry**. Five
independent uses is well past the palace's own recurring-use bar.

**The finding.** Render rich (shaded, full information), do the operation that needs structure, then
stylize last. The root cause named in the bundle: *"we stylized too early — pen-flow ink has no edges
for a clean cut."* Stylization is lossy, and every downstream operation that needs the discarded
information silently degrades.

**Why it travels.** It is an ordering principle about **which operations consume information**.
Photography shoots flat and grades later. Mixing edits before printing effects. Code refactors before
it optimizes. In each case the irreversible, information-destroying step goes last, because everything
that needs the information has to happen while it still exists. This is arguably the most portable
single thing in the June–July work, and it is currently homeless.

**Candidate links:** `mirrors` [[Found ↔ Made]] · `connects-to` [[The Curve Is the Material]] ·
`enables` [[BLUELINE]] · `couples-with` candidate 1 above (both are about ordering constraints against
information loss).

## 3. The model's prior is part of the interface ⭐

**Where it lives now:** [[GenAI Camera]] § Gotchas, recipe *"The OpenPose plate MUST use the real
`controlnet_aux` draw"*.

**The finding.** A hand-rolled thin stick figure is *semantically correct* — the joints are in the
right places — and the pose barely takes, because the xinsir OpenPose ControlNet is trained on thick,
tapered, filled limbs. A thin plate reads out-of-distribution. It does not error. It silently
underperforms, and the failure looks like a weak parameter rather than a wrong input. Worse, it
produced a **false conclusion**: the earlier "pose frees clothing" result was partly the img2img init
carrying the stance while the thin pose contributed almost nothing.

**Why it travels.** This is the sharpest thing in the arc and it generalizes to every learned system.
A semantically valid input that sits outside the training distribution fails *quietly*, and quiet
failure corrupts the experiment you ran on top of it. It reframes what "correct input" means when the
consumer is a model rather than a parser: correctness is distributional, not logical. It bears directly
on prompting, LoRA training, embeddings, and any palace work that conditions a generative model — which
is now most of it.

**Also note:** the correct draw already existed in BLUELINE's `draw_openpose.py`. The bundle calls it
*"a search-first miss"* — a live instance of [[Search Before You Build]] costing real cycles and a wrong
conclusion, which strengthens that entry with a second worked example.

**Candidate links:** `deepens` [[ControlNet as Topology]] · `connects-to` [[Search Before You Build]] ·
`connects-to` [[Latent Error]] · `mirrors` [[Embeddings as Relational Meaning]].

## 4. The correctness knob that turned out to be an expressive dial

**Where it lives now:** [[GenAI Camera]] § Gotchas, *"Figure depth strength is a costume↔form dial"*.

**The finding.** Depth conditioning strength was treated as a correctness parameter — how well does the
figure match its silhouette. The sweeps showed it is an **expressive** dial: 0.0–0.15 gives full
garment and loose form, ~0.30–0.45 is the sweet spot where real body form and costume both read, 0.60+
locks the nude and the costume retreats to cape and crown. The bundle's own line: *"an expressive dial,
not just a correctness knob."* And the ~0.30 sweet spot **generalizes across garment types** — flowing
robes and bulky fur/armor both find it.

**Why it travels.** The move — discovering that a parameter you were tuning for correctness is actually
a parameter you should be *composing with* — is a recurring aesthetic-technical event. It is the same
recognition as a filter cutoff being a timbre control rather than a fix, or compression ratio being
character rather than level management. Worth naming as a general recognition; the specific 0.30 value
stays in the bundle where it belongs.

**Candidate links:** `mirrors` [[The Curve Is the Material]] · `deepens` [[ControlNet as Topology]] ·
`connects-to` [[Playful Interface Design]].

## 5. Keep the compromised record, labeled

**Where it lives now:** commit `edit(genai-camera-scroll-honesty)` and a `caveat` field on
[[The Scroll]] frames.

**The finding.** When sweeps were invalidated by the thin-pose bug, the frames were **kept on the
scroll and labeled** rather than deleted. The superseded render_018/019 sweeps are still there, marked.

**Why it might already be covered.** This is close to [[Closing Well]]'s *verify to your best ability*
and its rule about naming what you could not verify. The distinguishing move here is different though:
not "flag what you didn't check" but "keep the wrong result visible, labeled, because the record of
being wrong is worth more than a clean surface." Probably a paragraph inside [[Closing Well]] or
[[The Scroll]] rather than its own entry — **recommend merging, not depositing.**

---

## Two observations about the palace, from doing this harvest

**The `breakthrough` type has quietly retired.** Nine breakthroughs exist, none since June, and the
early-2026 clustering makes it look like a drought. It isn't — July produced [[The Palace Speaks]],
[[The Multilinear Self]], [[The Blindspot Is the Surprise Fuel]], [[The Palace Hardens Around Values]],
[[ControlNet as Topology]] and more, all typed `concept` or `practice`. So insight did not stop; the
*type* stopped being used. Either the bar rose deliberately — which is defensible and should be written
down — or `breakthrough` is now dead vocabulary carried in [[SCHEMA]] §1. Worth one decision.

**The craft-to-concept lift is the palace's real bottleneck, not capture.** Capture is excellent:
findings land with numbers, file paths, and honest caveats, at the resolution they were learned. What
does not reliably happen is the second move — asking of a finding, *what is this a case of?* Every
candidate above was sitting in plain sight inside a well-written bundle. Consider making that question
an explicit beat of the [[Deposit Ceremony]] for project-bundle findings: after recording the gotcha,
ask once whether it is an instance of something, and either name the parent or say no.
