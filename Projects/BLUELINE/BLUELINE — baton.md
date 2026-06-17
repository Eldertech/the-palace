---
title: "BLUELINE — baton"
born: 2026-06-16
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry BLUELINE from a finished spike into production: the M4L clock is now live-validated round-trip, so the only open work is one design propagation (markers → MIDI clips, not yet in the palace) and one adjudication (the Track II LoRA verdict). I wait to be caught Mac-side and deleted once the move is picked up."
session_thread: "Mac-side 2026-06-16 — M4L round-trip confirmed by Loudon; markers→MIDI-clips decision made; Track II LoRA trained + graded, verdict pending"
---

# Baton: BLUELINE — spike done, two closing moves before M0

## Move
The five-track spike is **fully closed.** Clock live-validated round-trip; markers→MIDI-clips articulated
*and* renamed end-to-end (verified); Track II adjudicated (honest negative — see below). **The next move
is M0 previz production.** One optional loop-back is named (Track II redo with a face-forward dataset).

> **Both prior open moves are now DONE (this session, 2026-06-16):**
> - **A — markers→clips rename in the harness: ✅** `transport_sim.py` + `clock_client.html` renamed to
>   `/transport/section` (spans); verified live (sim→relay→WS: sections flow as spans, 64/64 on-beats on
>   whole frames). Committed `e4f4292`. Relay was format-agnostic, untouched.
> - **B — Track II LoRA adjudicated: ✅ (negative result, recorded).** The r4ng3r LoRA scored *below* its
>   no-LoRA baseline on every identity metric (FLUX DINO 0.317 vs 0.475, ArcFace 0.110 vs 0.376, face%
>   75% vs 100%) — it learned a hooded costume-silhouette, not a face. **The pipeline is sound:** the
>   DreamBooth dog control hit the textbook win (LoRA DINO 0.776 vs 0.422, +0.35). Failure is the
>   *dataset*, not the machinery. Full verdict + the fix in `proofs/track-II-lora/track-II-report.md`.

## Closed since the last baton
- **Open Thread A — the M4L device: ✅ CLOSED.** The `qmetro` + self-heal fix works; Loudon has
  **tested it round-trip from live Ableton** and it runs perfectly with the editor closed. Track III is
  fully live-validated, not just simulator-validated. *(The M4L spec + Track III report still carry the
  old `Palace-Verify: unverified` / "flagged: needs Loudon's Ableton" wording — flip them as part of
  Open Move A, since both files are being edited for the clips change anyway.)*
- **Open Thread B — train the Track II LoRA: ✅ RUN (verdict pending).** Both a FLUX LoRA and an SDXL
  LoRA were trained on the `r4ng3r` ranger and rendered across 4 new scenes × 4 seeds, plus a
  DreamBooth control (`dbgrade/` — dog/duck). Grading rig built both ways: the numeric ruler
  (`grade_score_v2.py`) and a human rating page (`grade/rate.html`). **Not yet done:** run/record the
  numeric verdict, capture Loudon's `rate.html` rating, write the result into `track-II-report.md`, and
  **commit `grade/` + `dbgrade/`** (currently untracked). The bar to beat is Track V's independent-seed
  drift (embed 0.82 / color 0.17).

## Decision logged + articulated this session — markers → MIDI clips
Section/cue addressing moved **off Ableton locators (markers) and onto MIDI clips.** A locator is a
*point* (name + bar); a MIDI clip is a *named span* (name + start + length), so sections are
first-class durations — which also half-answers the Board-Schema's open `HOLD`/expansion question (a
clip *gives* you the span). **Design confirmed by Loudon:** the OSC message is
`/transport/section name start_bar length_bars` (span), and the device observes its **own host track's**
`arrangement_clips` (`this_device canonical_parent`) — placement *is* the config. **Articulated this
session** in all four docs: Production Plan, Board Record Schema (added a `SECTION` field), track-III
report, and the M4L spec (JS rewritten: `cue_points` → host-track clips; `/transport/locator` →
`/transport/section`; device marked live-validated).

## Where we are — M0 + M1 VERIFIED (2026-06-16), working in the `feature/blueline` worktree
- **M0 previz** plays the 8-shot storyboard in time with the live clock (`● transport playing`, frame
  exact, `deterministic ✓`, shot-accurate, section live). `proofs/m0-previz/m0-report.md`. **Timed greybox.**
- **M1 animatic** raises the same boards to the **comic register** — inked figures + Ben-Day halftone +
  tapered speed-lines/impact burst on the flow shots + comic caption/border, over a **blue-line draft**
  (the draft toggle: blue rough → inked, the project's namesake). Same clock/storyboard/board-record;
  self-play advances panels on the beat. Verified in-browser, no errors. `proofs/m1-animatic/m1-report.md`.
- **Staging channel added (2026-06-16):** `facing` + `eyeline` per shot → an **oriented-head blocking
  sphere + eyeline ray + body-facing wedge**, so you can read which way each character faces and what they
  look at (half the shots are eyeline beats). It's *conditioning*, not polish — facing → OpenPose head
  keypoints. New `FACING`/`EYELINE` fields in [[BLUELINE — Board Record Schema]]. Aesthetic polish stays deferred.
- **Structural disambiguation added (2026-06-16):** L/R hands + feet tagged **anatomically** (green=R / coral=L,
  ◯ open / ● grip) — the #1 render-error fixer (maps to OpenPose L/R keypoints; we *declare* L/R, not let the
  estimator guess). Plus **comic action lines** on the acting limb for the dramatic beats — distinct from the
  environmental flow field (still M3). **Next structural pass (proposed):** near/far limb ordering (DEPTH) +
  foot contact/weight. Noted in the board schema.

## Next moves
1. **M2 motion comic** — the held comic panels gain limited motion (parallax, held-pose drift, speed-lines
   animating along the field): the first place the flow field *moves* in the comic register, still ahead
   of the render-AI seam.
2. **The real M4L clip-scan device** — only `clip_scan_sim.py` exists (a stand-in); build the device-side
   one-shot scan of the host track's `arrangement_clips` (deferred/low-priority, never the transport poll
   — the qmetro lesson) so the storyboard is authored as Live clips for real.
3. **Trivial follow-up:** add an `/m1` route to `osc_ws_relay.py` (one `FileResponse`, like `/previz`) so
   M1 is driven by the *live* Ableton clock, not just self-play (the transport code is already identical).

**One named loop-back (optional, not blocking M0):** the Track II character LoRA. The pipeline is proven
(dog control +0.35); the win is reachable. To get a usable r4ng3r LoRA, rebuild the character set with
**face-forward, identity-bearing framing** (close + frontal, hood down) — not the dramatic full-body
hooded poses that taught a costume — and/or face-region-weighted training; then re-grade against the v2
ruler (`grade_score_v2.py`). Until then, **the detailed text description is the better identity anchor**
and BLUELINE can proceed on text-described characters + Track V seed-locking for same-shot coherence.

## State / receiving environment
- **RunPod:** verify pod count is 0 (terminate promptly after any render/train). Network volume
  **`blueline-models`** (`aqm8oev4b0`, 30 GB, EU-RO-1) persists the models; `palace-flux` serverless
  parked at `workersMax=0`. Key/endpoint in `RunPod Images/studio/config.json` (gitignored).
- **Track II grade dirs committed** — `proofs/track-II-lora/grade/` + `dbgrade/` (renders, contact
  sheets, v2 scores) are now in git with the verdict.
- **Relay:** restart with `_tools/ComfyUI/venv/bin/python "Projects/BLUELINE/proofs/track-III-clock/osc_ws_relay.py"`
  (needs the venv for aiohttp; only one process can hold :9001).
- **Mac:** Blender 5.1.2, local ComfyUI at `_tools/ComfyUI`. Normal git (Mac-side, lock-safe committer not needed).

## Calibrations
- **Capability-first**: prove at small scale before optimizing.
- **Each track ships a reusable tool**, not project-local scratch.
- **The spec is the interchange** (staging spec, board record) — front-ends and backends decouple through it.
- Loudon builds the Max patches himself; give **precise, testable** Max guidance.

## Load these files first
1. `BLUELINE — Production Plan.md` (the five tracks) + `BLUELINE.md` (the face).
2. The Track III docs for the clips propagation: `proofs/track-III-clock/track-III-report.md` +
   `M4L-DEVICE-SPEC.md`, and `BLUELINE — Board Record Schema.md`.
3. The Track II grade artifacts: `proofs/track-II-lora/track-II-report.md` + `grade/rating_manifest.json`
   + `grade_score_v2.py`.

## On pickup (the catcher's checklist)
1. State the move back in one sentence (propagate markers→clips + adjudicate Track II, then M0). If you
   can't, the baton wasn't caught — stop and ask Loudon.
2. This baton is committed Mac-side — that commit is its archive.
3. Mark it caught: delete this baton file (git is the archive).
4. Act on the move, holding the calibrations above.
