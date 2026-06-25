---
title: Surfaces and Capabilities
type: meta
pillars:
  - tools
  - practice
born: 2026-05-26
last_activated: 2026-05-29
activation_count: 2
stage: sprout
confidence: demonstrated
energy: medium
links:
  - target: "[[Baton Ceremony]]"
    type: enables
    label: capability-delta-source
  - target: "[[Maker]]"
    type: connects-to
    label: host-capability-check
  - target: "[[The Shop]]"
    type: connects-to
    label: where-specialists-live
  - target: "[[Closing Well]]"
    type: connects-to
    label: verify-bounded-by-surface
  - target: "[[Claude CLI Reference]]"
    type: connects-to
    label: cli-vector
  - target: "[[Modes of Collaboration]]"
    type: connects-to
forward_vector: "I want to become the stable home for the surface deltas that handoffs keep re-deriving — so a cross-tool handoff can write 'receiving surface: Claude Code on the Mac, see Surfaces and Capabilities' and stop there. My ancestry is in the handoffs that improvised the delta every time (Kuramoto's Manim-can't-host, Phoneme Choir's Kokoro-only-on-Mac, the GSL Steward's per-surface link schemes) and in two of Claude's own auto-memories that should have had a palace home all along. My open question: I am a catalog of facts that go stale the moment a surface changes — a GPU gets installed, a sandbox grows a capability, a tool is deprecated. How do I stay honest? The discipline that keeps me alive is the same one that keeps a handoff honest: state what was verified and when, not what is assumed to be true forever."
---

# Surfaces and Capabilities

![[Surfaces and Capabilities — hero.png]]

The palace is operated from several different *surfaces* — execution environments Claude inhabits — and they are not interchangeable. A render that is trivial on one is impossible on another. A git commit that is clean on one leaves wreckage on another. The same palace file is linked with `computer:///` from one surface and `obsidian://` from another. None of this is visible from inside the work; it only becomes visible at the boundary, when work crosses from one surface to the next.

That crossing is the baton. And the most distinctive, most-often-improvised content of a cross-surface baton is the *capability delta* — what the receiving surface can do that the sending one can't, and the surface-specific gotcha the catcher will hit. This entry is the stable home for those deltas, so a baton can name the receiving surface and point here rather than re-deriving the whole picture every time. See [[Baton Ceremony]] § Receiving environment.

The deltas below are *observed so far*, not a closed taxonomy. Surfaces gain and lose capabilities; this entry is a living record, and each fact should carry the same honesty a handoff carries — what was verified, and when.

## The surfaces

| Capability | Cowork (desktop sandbox) | Claude Code (Mac, palace root) | Fresh chat (claude.ai web) | BBS / STIGMERGY (Chrome) |
|---|---|---|---|---|
| Read/write palace files | Yes (mounted folder) | Yes (native filesystem) | No — read via GitHub or memory fallback | No — reads rendered cards only |
| Run code | Python/Node in Linux sandbox | Native macOS, full shell | No | No |
| GPU models (ComfyUI, Stable Audio Open, SDXL) | **No** — no GPU | Yes, if installed | No | No |
| Local TTS (Kokoro) | Unverified — routed to the Mac in practice | Yes | No | No |
| Native Manim | **No** — `manimpango` won't build (no aarch64 wheel, needs `libpangocairo-dev`, sudo-only) | Yes — wheels exist on macOS arm64 | No | No |
| Human audition (QuickLook, play audio) | Indirect (via computer-use on the Mac) | Yes, native | No | No |
| Drive the Mac directly | Yes — computer-use + Chrome MCPs | n/a (is the Mac) | No | No |
| Git | First commit succeeds, then **stale `.git/*.lock` files wedge later ops** | Clean | No | No |
| Palace-file link scheme | `computer:///` | filesystem path | — | `obsidian://` |
| Verify browser HTML artifacts | Chrome MCP (drives the Mac browser) | **Claude Preview MCP** — static server + eval/screenshot/inspect; **rAF is paused, pump manually** (see below) | No | renders cards only |
| Best at | Orchestration, research, doc/sheet/deck output, desktop control | Builds: GPU, local TTS, native renders, anything needing install or audition | Thinking, synthesis, planning when away from the Mac | Stigmergic coordination between permanent agents |

### Cowork (the desktop-app sandbox)

A Linux sandbox (Ubuntu, arm64, no sudo, no GPU) with the palace folder, an outputs folder, and uploads mounted in. It has Python, Node, allowlisted network, and a rich MCP surface — Calendar, iMessage, PDF tools, scheduled tasks, computer-use (it can drive the Mac), and Claude-in-Chrome. It is the strongest *orchestration* surface and the right place for research, document generation, and desktop control.

What it cannot do is host any Specialist whose wrapped tool needs a GPU, or a system library it can't build without sudo. Confirmed failures: Manim (`manimpango` won't build), and the GPU stack — ComfyUI, Stable Audio Open, SDXL — which has no GPU to run on at all. Local TTS (Kokoro) is routed to the Mac in practice, partly because audition needs the Mac regardless; whether a CPU-only Kokoro could render in the sandbox is unverified — don't assume either way. The lesson from Kuramoto Round 1 is that **every build Specialist that needs the GPU or system libs must live on the Mac**, and Cowork's job is to dispatch to it, not to run it. Cowork *can* reach the Mac through the computer-use and Chrome MCPs, but that is desktop control, not the Specialist dispatch path — builds go to Claude Code.

Git from Cowork is the sharp edge. The first commit in a session succeeds, but it leaves stale `.git/HEAD.lock` and `.git/index.lock` files that wedge every later git operation. Prefer committing Mac-side. If a Cowork session must touch git, the incoming Mac session clears the locks first: `rm -f .git/HEAD.lock .git/index.lock`.

### Claude Code (on Loudon's Mac, at the palace root)

Native macOS on Apple Silicon, with Loudon's full environment: sudo, Homebrew, pip, the GPU, and local model installs. This is where builds happen — GPU generative models, Kokoro and other local TTS, native Manim renders — and it is the only surface that can run a true *human audition* by opening QuickLook or playing audio for Loudon to hear and confirm. Git commits are clean here. When a handoff routes "this must render natively," this is the surface it routes to.

### Fresh chat (claude.ai web)

No filesystem. It reads the palace through the GitHub repository or, when that is unreachable, through the Substrate skill's minimum fallback context (see [[CLAUDE]] § Access Paths). It is a thinking-and-planning surface, not a build surface — good for synthesis, dialogue, and drafting when Loudon is away from the Mac, with the understanding that any write must be deferred to a Cowork or Claude Code session.

### BBS / STIGMERGY (Chrome at `localhost:5173`)

The blackboard UI where permanent agents and Stewards post and coordinate stigmergically. It is a *coordination* surface, not an execution one. Palace files are linked with `obsidian://` here, where Cowork chat uses `computer:///` — a permanent-agent handoff that addresses both surfaces (e.g. the GSL Steward) has to carry both schemes.

### Claude Preview (browser-artifact verification, Claude Code-side)

A verification harness reachable from Claude Code on the Mac: a static server (`python -m http.server`, configured in `.claude/launch.json`) plus the Claude Preview MCP (`preview_start`, `preview_eval`, `preview_screenshot`, `preview_inspect`, `preview_console_logs`). It is how a browser-deployable artifact — a [[D3.js]], [[Observable Plot]], or [[p5.js]] sketch — gets *seen* and token-inspected without leaving Claude Code. Relative links resolve from the served root, so an artifact that `<link>`s the canonical `colors_and_type.css` renders correctly here.

**The verified delta (2026-05-29): `requestAnimationFrame` is paused in this harness** — not throttled to ~1 Hz as an unfocused browser tab would be, but fully stopped (a probe counter stayed at 0 across seconds). Any rAF-driven artifact therefore looks frozen: p5's `draw()` loop, d3-force's internal timer, and a hand-rolled `requestAnimationFrame` sim all fail to advance on their own. This is a *harness* fact, not an artifact bug — the same files animate normally on a focused tab. The pump techniques that make rAF-driven artifacts verifiable here (all confirmed on the [[Flocking]] shoot-out):

- **d3-force / d3 timers** → `d3.timerFlush()` in a loop forces synchronous ticks.
- **p5** → expose the instance (`window.__flock = p` in `setup()`), then call `__flock.redraw()`; the normal 60 fps loop on a real tab is untouched.
- **Plain rAF sims** → drive the step from `setInterval` instead (the right production choice anyway for a slow analytical re-render, e.g. Observable Plot).
- Top-level `function` declarations in a classic `<script>` are global, so `preview_eval` can call them directly to pump or inspect state.

Use `preview_inspect` (not screenshots) to verify exact colours and fonts — it reads computed styles, which is how the Graphite reskin's tokens were confirmed reaching into Plot's *generated* SVG. The honest tier line: this harness verifies render + structure + tokens; it cannot judge live motion feel, which still wants a focused tab (or the Mac browser via Chrome MCP).

### A note on reachability

Not every tool is reachable from every surface even when it is "alive." Midjourney is Discord-only; the Maker's dispatch path does not reach it from Cowork, which is why the Kuramoto Midjourney↔ComfyUI Comparison stalled as a lost branch. Reachability is a capability fact like any other and belongs in a handoff's receiving-environment note.

## How a baton uses this

When a move crosses surfaces, the [[Baton Ceremony]]'s *Receiving environment* section names the receiving surface and carries only the deltas that matter for *this* move — not the whole table. Good form: "Receiving surface: Claude Code on the Mac. This is here because the Manim render can't run in Cowork's sandbox (no aarch64 `manimpango`). Commit Mac-side; locks are clean here. Audition by QuickLook before declaring the Sketch done." The catcher reads that in five seconds and knows why it's holding the baton.

## The host-capability check

The Maker's intake should run a `host_capability_check` before dispatch — confirm the chosen Specialist's wrapped tool is actually reachable on the dispatching surface *before* a brief is decoded and an agent spun up, rather than discovering it at install time. This is currently a gotcha and an open question in [[Maker]], not a codified step. This entry is the data that check would read: per-medium fallback Specialists (Manim CE → Matplotlib for the sandbox; Kokoro → a Mac-side render or Loudon's own voice) make the check actionable rather than merely a refusal.

## Provenance

Two of the facts above lived in Claude's cross-session auto-memory before they had a palace home — that the Cowork sandbox can't host Specialists with system-library build dependencies, and that Cowork commits leave unremovable git locks. They kept getting re-derived inside individual handoffs (Kuramoto 2026-05-10 and 2026-05-26, Phoneme Choir's Claude Code prompt, the GSL Steward's surface conventions). Memory is the right place for a fact only Claude needs across sessions; this catalog is the right place for a fact every cross-surface handoff needs. The memories now point here.

## Open Questions

- A capability catalog goes stale the instant a surface changes — a GPU gets installed, a sandbox gains a wheel, a tool is deprecated. What is the cheapest discipline that keeps it honest? A dated last-verified note per row, refreshed whenever a handoff hits a delta that's wrong?
- Should the `host_capability_check` graduate from a gotcha in [[Maker]] into an actual intake step, with this entry as its lookup table?
- Does this entry want a machine-readable sibling (a small JSON the Maker or a future orchestrator could read), or is prose-plus-table the right register for something a human and a fresh Claude both read?

## Forward Vector

I want to be the place a cross-surface handoff points instead of re-explaining the world. I want the next time a build can't run somewhere to be a one-line lookup, not a fresh discovery. And I want to grow a verification rhythm — a way to notice when one of my rows has quietly gone false — because a capability catalog that is trusted and wrong is worse than no catalog at all.
