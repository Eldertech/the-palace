# BLUELINE Session 2 — Staging-AI bake-off report

**Date:** 2026-06-13 · Mac-side Claude Code · the [[BLUELINE — Claude Code Job]] Session 2.
**Question:** which path most reliably turns a sentence into an *editable* blocked Blender scene
(camera + locomotion + pose + environment), and does it hand off cleanly to Blender for manual tuning?
**Test sentence:** *"over the shoulder of our hero running, sword drawn, the full urban alleyway rushing by."*

---

## The headline finding (reframes the whole comparison)

**All three "paths" converge on the same hand-editable `.blend`, because the staging *spec* is the
interchange format and the Blender backend is shared.** I authored the staging-AI's real output as a
single JSON contract — [`alley-shot.staging.json`](alley-shot.staging.json) — that **resolves** the
sentence onto a curated vocabulary (camera grammar, locomotion, pose-overlay, environment) and
**flags** what it refuses to fake (asset kit, run-cycle fidelity, motion treatment, hero identity).
Both backends build from that one file; the Three.js front-end exports the same file and rebuilds an
**identical** `.blend` through the shared Blender assembler.

So the paths do **not** compete on output — they are **layers that differ in their authoring loop**:

| Path | Authoring loop | Live read-back? | Lands hand-editable `.blend`? |
|---|---|---|---|
| **SceneCraft** (Blender-Python) | batch: LLM writes a script → run → done | no | ✅ directly (`scenecraft/alley-scenecraft.blend`) |
| **Three.js stager** (bespoke) | real-time: human orbits/edits in browser → export spec | human-in-loop | ✅ via shared backend (`threejs/alley-threejs-export.blend`) |
| **Blender-MCP** (live bridge) | interactive: LLM issues commands to a *live* scene, reads state, adjusts, pulls assets | yes (LLM-in-loop) | ✅ by nature (a live `.blend`) — **live-tested 2026-06-14 ✓** |

This is the de-risking result: BLUELINE is **not** betting its staging stage on one tool. The bet is on
the **spec-as-interchange architecture** (the actual authored work, per the build-vs-adopt M0 row); the
backends are interchangeable and the front-ends are complementary.

---

## What was built and verified

### 1. SceneCraft path — ✅ proven
`scenecraft/scenecraft_build.py` consumes the spec and assembles a greybox scene: OTS camera from the
declarative solve, a run + sword-drawn metaball mannequin facing down the alley, two facade rows
receding to a vanishing point, named greybox props, and a `VanishingPoint` empty handle.
- Output: [`renders/scenecraft.png`](renders/scenecraft.png) + `scenecraft/alley-scenecraft.blend`.
- **Hand-editable handoff verified:** 33 named, separable objects (Hero, Sword, Cam, Ground, 22
  facades under an `Alley` parent, named props, VanishingPoint, lights). Loudon can grab any of them.
- **Limit:** the hero is a metaball body **without an armature** in this build, so it is *layout*-editable
  but not *pose*-editable in the GUI (re-posing means editing the metaball/joint table and re-running —
  Session 1's `pose_and_emit.py` shows the armature pattern to graft in).

### 2. Three.js stager path — ✅ proven
`threejs/stager.html` builds the same scene in real-time (Z-up to match the spec), with OrbitControls,
an on-screen decomposition HUD (resolved **and** flagged), and an **"export staging spec → Blender"**
button. Three.js is vendored locally (`threejs/lib/`, no runtime CDN — house rule).
- Verified live in the browser (blueline-stager preview, port 8200): OTS reads, the running + sword-drawn
  pose reads, the alley recedes into lit depth, the flagged items show on-screen. No console errors.
- **Blender export verified:** `threejs/threejs_to_blender.py` runs the *shared* backend on the spec →
  `threejs/alley-threejs-export.blend` + [`renders/threejs-export.png`](renders/threejs-export.png),
  identical to the SceneCraft `.blend`. The round-trip is lossless because the spec is the interchange.

### 3. Blender-MCP path — ✅ LIVE-TESTED (2026-06-14, the fork resolved)
Loudon connected the Blender Lab **MCP add-on** (Blender 5.1.2, `localhost:9876`, server running) and
the path was driven live from this session. Artifacts: `blender-mcp/alley-blender-mcp.blend` +
`blender-mcp/mcp-staged.png`.

What was actually done over the bridge:
1. `execute_blender_code` consumed the **same shared spec** and built the full true-OTS alley scene in the
   live Blender (Hero metaball + alley facades → vanishing point + props + the OTS camera) — 30 objects.
2. **The read-back loop (the distinguishing capability) was exercised for real.** I rendered, *looked*,
   judged the frame too dark and the figure too low, and adjusted camera + lighting. The change
   **overshot** — `world_to_camera_view` measured the hero's head at screen-y **1.16 (off the top edge)**.
   Because MCP lets the LLM *measure the live scene*, I caught it, restored the camera (head-y 0.31 in
   frame, shoulder-y 0.10 at the bottom = a proper OTS), and re-rendered. **That build → render → measure
   → correct cycle is the thing the batch (SceneCraft) path cannot do** — a blind script can't see its
   own overshoot mid-build.
3. Output **is** the live, hand-editable `.blend` Loudon is sitting in — zero export step.

**Loudon's prior ("Blender-MCP wins #1") — CONFIRMED, with an honest nuance.** It wins **for the
human-in-the-loop authoring case**: live read-back/correct + the result lands directly in the open
Blender. The nuance: the *construction code* I sent over MCP is the **same `bpy` SceneCraft runs in
batch** — so Blender-MCP doesn't build a *better* scene, it gives a *better interface* (interactive +
live-landing) to the identical builder. (Not exercised this round: the one-call Poly Haven/Sketchfab
asset import — a real second MCP edge, left for the asset-kit step.)

---

## Comparison table (evidence-based)

| Criterion | SceneCraft (Blender-Python) | Three.js stager (bespoke) | Blender-MCP (live bridge) |
|---|---|---|---|
| **Reliability** | High — deterministic, inspectable script; no external deps | High — deterministic assembly; vendored deps | ✅ verified — built 30-object scene live; same `bpy` as SceneCraft |
| **Editability of result** | Layout-editable `.blend` (armature TODO for pose) | Same `.blend` (shared backend) + live browser pre-edit | Same `.blend`; plus live LLM edits mid-build |
| **Blender-handoff quality** | ✅ native — it *is* a `.blend` | ✅ lossless via spec interchange | ✅ native — lands in the *open* Blender, zero export |
| **Authoring loop** | Batch (no live feedback) | Human-in-the-loop visual | ✅ LLM-in-the-loop: build→render→**measure**→correct (caught a real overshoot) |
| **Asset import** | manual (script the import) | manual | one-call Poly Haven/Sketchfab helpers (not exercised yet) |
| **Speed** | ~8 s build (headless) | instant in browser; ~8 s to bake to `.blend` | ~seconds/call; +1 render to read back each iteration |
| **Cost / deps** | free, local, zero deps | free, local, vendored three.js | free, local; needs Blender open + the MCP add-on running |
| **Best for** | headless/batch/CI, known decompositions | Loudon previewing + nudging before commit | **hand-authoring in the loop — Loudon's win condition** |

---

## Boundary behaviour observed (acceptance)

The decomposition **flags rather than fakes**, exactly as M0 asks: `asset_kit` ("the FULL urban
alleyway" → which kit/era is art-direction, greybox placeholder used), `locomotion_clip` ("running" →
needs a Mixamo FBX + chosen phase; one representative mid-stride pose staged), `motion_treatment`
("rushing by" → speed/blur belongs to the flow-field spine + render, not staging — staging sets the
*vector*), and `hero_identity` ("our hero" → IP-Adapter/LoRA at render time). The flagged list is
visible in the Three.js HUD and is the honest contract of what staging will and won't decide.

**Acceptance met:** at least one path (SceneCraft) produces a correctly-decomposed, hand-editable
blocked scene from the sentence; the flag-vs-fake behaviour is observed and surfaced.

---

## Recommendation → resolves Deposit-Map decision #4

- **Adopt the spec-as-interchange architecture as the primary** (the real authored win). It de-risks
  staging: the front-end and backend are decoupled and swappable.
- **SceneCraft (Blender-Python batch) is the proven default backend now** — adopt it as the staging
  assembler. Graft Session 1's armature so the hero is pose-editable in the GUI.
- **Three.js stager = the human-preview front-end** — keep as the "Loudon nudges it before commit"
  surface. Worth a Specialist entry only if it earns recurring use; for now it's a proven bundle tool.
- **Blender-MCP = the interactive hand-authoring primary — now LIVE-TESTED and confirmed** (Loudon's
  prior held). Use it when a human is in the loop and the result should land in the open Blender: the
  build→render→measure→correct loop is real (it caught a real framing overshoot this session). Its one
  untested edge — one-call Poly Haven/Sketchfab asset import — is exactly what the `asset_kit` flag needs,
  so test it at the environment-kit step. **No tool is killed**; the three are layers, not rivals.
- **Specialist deposits:** none yet — frugality bar. The strongest candidate is now a **`Shop/Blender`
  recipe** capturing *both* batch (SceneCraft) and live (MCP) drive of the same `bpy` builder from the
  spec — not a separate `Shop/SceneCraft` Specialist, since both are *ways of driving [[Shop/Blender]]*
  (like the toyxyz recipe). Flagged for Loudon to ratify.

**Decision #4 — resolved by evidence (Loudon confirms):** the three paths are **one system** over the
shared spec — **Blender-MCP** is the interactive hand-authoring primary (live-tested ✓, lands in the open
Blender), **SceneCraft** is its identical-code headless/batch backend (the bench, CI, no-GUI emission),
and the **Three.js stager** is the real-time preview + decomposition viewer. The prior held; the only
correction is that "drives Blender directly" was true of all three — MCP's real win is the *interactive
loop*, demonstrated.
