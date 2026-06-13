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
| **Blender-MCP** (live bridge) | interactive: LLM issues commands to a *live* scene, reads state, adjusts, pulls assets | yes (LLM-in-loop) | ✅ by nature (a live `.blend`) — **not live-tested here, see below** |

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

### 3. Blender-MCP path — ⏳ assessed, not live-tested (the fork)
**Blender-MCP is not connected as an MCP server in this session, so it could not be driven live.** What
it *is*, concretely: a Blender add-on that opens a socket + an MCP server that exposes `execute_blender_code`
(run arbitrary `bpy` in the live scene), `get_scene_info`/`get_object_info` (read-back), and asset
helpers (Poly Haven / Sketchfab / Hyper3D download). Its distinguishing value over SceneCraft is the
**interactive read-back loop** (the LLM sees the scene and corrects, rather than emitting a blind batch
script) and **one-call asset import**. Its output is the same hand-editable `.blend`.

**Honest status of Loudon's prior** ("Blender-MCP wins #1, SceneCraft a close #2"): *unverified, not
upset.* The prior's core reason — "it drives the Blender scene directly, landing in the familiar
hand-editable surface" — is **true of all three paths** here, so that reason alone no longer
discriminates. Blender-MCP's *real* edge (live LLM iteration + asset pulls) is plausible but needs a
live trial to confirm. Two ways to give it one (raised to Loudon):
- **(a)** wire `blender-mcp` as an MCP server on a Claude session (a Settings → Connectors action on
  Loudon's side), then a focused session truly tests the interactive loop; or
- **(b)** I install the `blender-mcp` add-on + socket-drive a live Blender here (installs third-party
  Blender code + runs a GUI Blender; the add-on's `execute_blender_code` is an arbitrary-code capability).

---

## Comparison table (evidence-based)

| Criterion | SceneCraft (Blender-Python) | Three.js stager (bespoke) | Blender-MCP (live bridge) |
|---|---|---|---|
| **Reliability** | High — deterministic, inspectable script; no external deps | High — deterministic assembly; vendored deps | Unverified here; depends on the add-on socket + LLM loop |
| **Editability of result** | Layout-editable `.blend` (armature TODO for pose) | Same `.blend` (shared backend) + live browser pre-edit | Same `.blend`; plus live LLM edits mid-build |
| **Blender-handoff quality** | ✅ native — it *is* a `.blend` | ✅ lossless via spec interchange | ✅ native (live `.blend`) |
| **Authoring loop** | Batch (no live feedback) | Human-in-the-loop visual | LLM-in-the-loop interactive |
| **Asset import** | manual (script the import) | manual | one-call Poly Haven/Sketchfab helpers |
| **Speed** | ~8 s build (headless) | instant in browser; ~8 s to bake to `.blend` | unmeasured |
| **Cost / deps** | free, local, zero deps | free, local, vendored three.js | free, local; third-party add-on + a running Blender |
| **Best for** | known decompositions, batch/repeatable | Loudon previewing + nudging before commit | ambiguous staging needing LLM see-and-correct + assets |

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
- **Blender-MCP = evaluate next as the interactive LLM front-end** (honouring Loudon's prior). It is the
  one path whose distinguishing value (live read-back + asset pulls) is genuinely untested — give it the
  live trial via (a) or (b) above, then decide adopt/kill. **No tool is killed this round**; the paths
  are layers, not rivals, so the "loser becomes a gotcha" framing doesn't cleanly apply.
- **Specialist deposits:** none yet — frugality bar. `Shop/SceneCraft` is the strongest candidate (its
  pattern is proven), but it is currently *a way of scripting [[Shop/Blender]]*, so it may be a **recipe
  inside Shop/Blender** (like the toyxyz recipe) rather than its own Specialist. Flagged for Loudon.

**Final #4 call is Loudon's** (the Deposit Map reserves it): pick the staging primary, and choose how
Blender-MCP gets its live trial.
