---
title: "STIGMERGY Entry-Agent Window — Integration Plan"
born: 2026-06
links:
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: integrates-into
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: rides-the-wire
  - target: "[[The Shop]]"
    type: enables
    label: bold-asks-dispatch-to-the-maker
  - target: "[[Pages as Agents]]"
    type: exemplifies
    label: the-window-is-the-page-in-a-new-mode
  - target: "[[Merleau-Ponty]]"
    type: emerged-from
    label: prototype-page
forward_vector: "I am the integration plan for the STIGMERGY entry-agent window — the M0–M1 Companion tier shipped on a feature branch, M2 parked by choice with its revival conditions — kept as the record of what was built and what still waits."
---

# STIGMERGY Entry-Agent Window — Integration Plan

> **Status — 2026-06-08.** M0–M1 are **shipped and in use** on `feature/stigmergy-entry-agent` (the Tier-A **Companion**: discuss · honest in-place edits · graffiti · adaptive narration · post-commit undo · forward-vector editing — 11 commits past `main`, suite green). **M2 (Tier-B Maker/Shop dispatch) is parked by choice** — see §5 for the banner + revival conditions. Two small follow-ups stay available *independently of M2*: **merge-to-main** (make M1 the live STIGMERGY) and **general frontmatter editing**. Build Handoff 3 is consumed → `_ops/stigmergy/Archive/`.
>
> *Origin (kept for the record): drafted for review as a Cowork artifact (`merleau-entry-agent`); no commit was made from that session per git-lock discipline. M0–M1 were then built Mac-side.*

## 1. What we are integrating

A floating, right-pinned chat window that lives over an entry in the **STATE** deck. You point it at a passage by scrolling — the window stays fixed on the glass while the text streams past and re-flows around its left edge; the section it is reading **glows**; its titlebar shows what it is `reading:`. You talk to it conversationally, and it both *discusses* the words and *edits them in place* on loose natural instructions ("add a line at the end about li," "pin that as a graffiti note up top," "tighten this"). It is grounded in the page, the page's typed-link neighborhood, and the palace floor.

That is the **established feel**, and it is settled. This plan is about the next ambition: letting the same window field **bold, open-ended asks** — *"enrich this entry with a diagram styled with gen-AI in a cyberpunk style"* — which cannot be answered by one model in one turn. Those asks have to fan out to the **Maker** and the **Shop** Specialists, run as real worker sessions, possibly on another host, and return artifacts that land honestly in the entry. STIGMERGY already has this machinery. The work is not building a new agent runtime; it is **plugging the window into the one that exists** without violating its invariants.

The tool is **page-agnostic by design.** The agent's grounding is assembled at runtime from whatever entry, songline, or hub is open — the page's own text, its typed-link neighborhood (read from frontmatter), and the palace floor — so the same window adapts to any page edited in STIGMERGY. The prototype hardcodes one page (Merleau-Ponty) purely as a test fixture; nothing in the design is specific to it.

The whole design tension reduces to one sentence: *a single chat box must gracefully hold both a one-second in-place edit and a twenty-minute ComfyUI job dispatched to the Mac — and stay honest about the difference.*

## 2. Where it lands in the existing architecture

Mapping the window onto STIGMERGY's real parts:

- **The window is a new view inside the STATE deck**, rendered in/near `app/src/components/EntryBody.jsx`. The reflow + glow is front-end only.
- **The agent is the page operating in a new mode.** Per [[Pages as Agents]], the board `from` field is the entry's own title; Steward and Proof-Generator are *modes* a page runs in. The window introduces a **Companion / Editor mode** — the page talking to Loudon about itself and editing itself. No new identity; a new mode of an existing one. The mode's house editing standards and accumulating gotchas ("never rewrite a `forward_vector` without flagging it," "preserve typed links," "match the entry's voice") live in a small dedicated **meta-spec entry** — not a Shop Specialist, since the Shop wraps non-text media tools (decided 2026-06).
- **Bold asks ride the blackboard.** A heavy request becomes a message on `blackboard.jsonl` (§2.2 wire), which the **actuator** turns into a spawned Claude Code worker, which runs a **Maker** brief, which dispatches **Specialists**. Progress and results come back as board messages (`BROADCAST`, `PROOF`) the window reads over the existing **SSE** stream.
- **Forks return to the human node.** When the Maker hits a genuine choice (FLUX vs ComfyUI, which tier), it posts a `RESOURCE_REQUEST` with `blocking: true` and pre-built `options` to the **TRICKSTER** board — exactly the existing decision-inbox path. The window is just a second surface where that inbox can be answered.
- **Nothing is real until LOG.** An artifact or an edit is not "done" in the window; it is done when the actuator's armed-write path commits it and **reconciliation** closes the QUEUE item against git.

The key conceptual move: **the window is not a request/response chatbot bolted onto an entry. It is a blackboard client wearing an entry's face.** Cheap turns it can answer itself; expensive turns it *posts and watches*. This is the only framing that keeps the honesty discipline intact.

## 3. Two capability tiers, and the seam between them

The interaction splits cleanly into two regimes. The hard engineering is the seam.

**Tier A — conversational micro-edits (synchronous).**
Discuss; rewrite/append/prepend a paragraph; pin a graffiti note; answer questions about the passage. Small token budget, sub-second to a few seconds, no Shop tools, no other host. This is the prototype, and it can run in-browser on Haiku (`window.cowork.askClaude` in the Cowork shell, or STIGMERGY's own light inference path).

**Tier B — bold generative asks (asynchronous, swarm).**
"Enrich with a cyberpunk diagram," "make a 20-second narrated motion explainer of the body-schema idea," "find three neighbors this entry should link and draft the links." These need: the **Agent tool** (a spawned worker, *not* a raw API call — Loudon has no direct Anthropic API; see Risks), file access, the **Maker** and **Specialists**, often the **Mac host** (ComfyUI/Manim/Remotion can't run in the Cowork sandbox), and minutes of wall-clock. These cannot block a chat bubble.

**The seam.** The window must *classify intent* and route: Tier A answers inline; Tier B is acknowledged immediately, posted to **QUEUE** as a job, and then *watched*. The same text box, two fundamentally different fulfillment paths. Getting the classification, the honest "this is now a queued job" affordance, and the live progress read right **is the feature** — more than any single edit op.

A worked Tier-B trace:

1. You: *"enrich this entry with a cyberpunk diagram of the cane→schema crossing."*
2. Window (Tier A reflex, instant): posts a `RESOURCE_REQUEST`/job to the board as `from: Merleau-Ponty (Companion)`, replies in-window: *"Queued as a Maker brief — image, generative. I'll show progress here."* A QUEUE card appears.
3. **Actuator** spawns a worker; the **Maker** runs intake, names tiers (*Sketch/Study/Piece*), runs the **Host Capability Check** — diagram-of-a-system says Mermaid/Graphviz, but "cyberpunk gen-AI style" says FLUX/ComfyUI, which means **Mac host**. If the brief is genuinely ambiguous, Maker posts a `blocking` fork to TRICKSTER; the window surfaces it.
4. Specialist runs on the Mac; posts `PROOF` with the artifact path.
5. Window shows the result inline; placing it in the entry goes through **Enrichment**/**Deposit** + the armed-write path; **reconciliation** closes the QUEUE item when git proves it.

## 4. Technical tradeoffs (the core of this document)

| Decision | Option A | Option B | Recommendation |
|---|---|---|---|
| **Where the agent runs** | In-browser Haiku (`askClaude`) — fast, cheap, no tools, no file access | Actuator-spawned Claude Code worker — full tools, file/Shop access, slow to start, costlier | **Both, by tier.** A in-browser for micro-edits; B always a worker. Never a raw API path (none exists for Loudon). |
| **Chat semantics** | Synchronous request/response (block the bubble) | Asynchronous board-client (post to QUEUE, watch LOG over SSE) | **Async for Tier B.** The window becomes a blackboard reader; sync is fine only for Tier A. This preserves "nothing real until LOG." |
| **Applying an edit** | Naive in-window file write for liveness | Armed-write path + `commit-spec` + `PROOF` + reconciliation | **Optimistic preview in-window, armed write underneath.** Show the change instantly (glowing, undoable); the real write goes through the one enforced path. Never `git add -A`. |
| **Context injection scope** | Stuff page + neighborhood + floor into every prompt | Worker reads files directly from disk on demand | **Tier A injects a bounded scope (the dial: here → page → neighborhood); Tier B reads from disk.** Injection cost grows with entry size and fan-out; a worker sidesteps it. |
| **Host** | Cowork sandbox (Linux-arm64, no sudo) | Mac-resident actuator | **Mac host for any heavy Specialist** (ComfyUI/Manim/Remotion/FLUX-local). The Maker's Host Capability Check already gates this; the window must render "needs the Mac — queued" without looking broken. |
| **Wire protocol** | Extend §2.2 with new message types for the window | Reuse existing types (`RESOURCE_REQUEST` for forks, `PROOF` for artifacts, `BROADCAST` for status), add only a `mode: Companion` convention | **Reuse.** §2.2 is sacred and schema changes need ceremony. The window needs no new verbs — only a posting convention. |
| **Rendering the text** | Canvas custom-layout (the prototype's four-side reflow) | Real DOM text + `shape-outside` on a right-floated element (the right-pin model) | **DOM + `shape-outside`.** Because the window is right-pinned, text only flows left — a single float, no canvas — which keeps native selection, real `[[wikilink]]` hit-testing, and the BBS text rules. The canvas was a prototyping shortcut; production wants DOM. |
| **Concurrency** | Let the window spawn workers freely | Respect the actuator's "single global worker per lane" scar; queue beyond it | **Queue.** Multiple bold asks become multiple QUEUE cards drained per lane discipline; the window shows depth, not parallel chaos. |
| **Undo** | In-window revert (pre-commit) | `git revert` (post-commit) | **Both, by lifecycle.** Before the armed write commits, in-window undo restores instantly. After LOG, "undo" is a new reconciled commit — honest, not a silent rollback. |
| **Visual grammar** | Keep the amber/magenta prototype skin | Conform to the locked [[BBS Design System]] | **Conform, with a deliberate accent.** The chat surface should read as STIGMERGY (CSS-border CP437 weights, no character-cell ASCII rules, viewport-fill, ~78ch only on message body). An amber accent for "this is the active tool" is allowed only as a documented decision in this entry's parent, not a free reskin. |

Two tradeoffs deserve more than a table row:

**Liveness vs. the honesty spine.** The window's whole charm is immediacy — edits land *now*, glowing. But STIGMERGY's reason to exist is that *nothing is real until it lands in LOG*. These pull against each other. The resolution is **optimistic UI over an honest spine**: the window shows the edit immediately as a *pending* state (it can even mark the glow differently for "uncommitted"), while the armed-write path does the real work and reconciliation flips it to committed. The danger to avoid is a window that *feels* done while git knows nothing — that is precisely the faked-completion STIGMERGY was built to make impossible. If we cut one corner here, cut latency, never the write path.

**Intent classification is a real classifier, not a regex.** The prototype sniffs for "rewrite/tighten/graffiti." Tier-A-vs-Tier-B routing can't be keyword-matched — "add a diagram" is Tier B, "add a sentence" is Tier A, and the surface forms overlap. Per the build-order principle (§5), the first implementation runs classification on a **capable model** — accuracy first, cost later — not a cheap reflex; only after the behavior is proven do we try to push it down to a small/fast model. The safety net stays regardless: **when unsure, treat as Tier A discussion and ask**, because mistakenly queuing a Mac job is more disruptive than mistakenly answering in chat. The misclassification cost is asymmetric, so the safe default is the cheap path even when the classifier itself is expensive.

## 5. Staged build path

Mirroring the Maker's own tier ethos — cheap-and-real first, mastered last. Each stage ships something usable and de-risks the next.

**Build-order principle (decided 2026-06):** start at *maximum capability* — the most capable model, fullest context, slowest/most-expensive path — to maximize the likelihood of the behavior working at all. Prototyping here is *not* token-budget-constrained. Only once an interaction is proven do we optimize downward toward cheaper, faster, less-able models. This is distinct from the heartbeat's standing-automation optimization mandate; that governs recurring background work, this governs new-feature prototyping.

### Worktree workflow

All work in an isolated git worktree on a feature branch — never on main — so the feature can be felt and iterated before it merges.

```bash
cd "/Users/loudonstearns/Documents/The Palace"
git worktree add ../palace-entry-agent -b feature/stigmergy-entry-agent
cd ../palace-entry-agent/_ops/stigmergy
npm install            # node_modules is gitignored; workspace install hoists deps
npx vitest run         # capture the green baseline (≈1054 in app) before any change
```

Iterate on the branch; keep vitest green at every commit; commit in small slices per milestone; **never `git add -A`** (N-writer repo — stage explicit paths). If a prior Cowork commit wedged git, `rm -f .git/HEAD.lock .git/index.lock` first. Merge to main only after M0+M1 acceptance pass and Loudon has driven the window live; then `git worktree remove ../palace-entry-agent`.

### The edit toggle

The whole feature is **opt-in**: an `edit` toggle on the STATE page. **Off (default) = STATE reads exactly as today; the window does not exist.** On = the window mounts for the open entry. Toggle state lives in `App.jsx`; if it needs to cross decks, introduce the single `DeckContext` the audit (Finding 7) anticipated rather than more prop-drilling.

### Precondition — confirm the core extraction

The write path and validator location depend on audit §3. Before starting, check whether `@stigmergy/core` exists and the npm workspace is wired. If yes, import the validator / blackboard I/O / `commit-spec` from core; if no, they still live in `app/server/` and the orchestrator — build against those but do not deepen the app↔orchestrator cycle, and flag the coupling.

### Milestones

**M0 — the shell (front-end only, no agent).** Right-pinned window over `EntryBody.jsx` using **DOM + `shape-outside`** (not canvas — the right-pin means text flows only left, so one float suffices and native selection + `[[wikilink]]` hit-testing survive); width is a function of horizontal drag position; vertical drag moves it; bottom-grip sets height; scroll-past with the window fixed; nearest-section `reading:` label; the referenced-section **glow** (a restrained brightness/weight shift confirmed against [[BBS Design System]] — no neon, no cyan); grounding readout stub. No inference, no wire touched. *Acceptance:* toggle edit on entries of several shapes; reflow correct and text still selectable; wikilinks resolve; drag/resize/scroll feel right; `reading:` accurate; zero change when edit is off; vitest green.

**M1 — Tier-A Companion agent, honest writes.** Server assembles grounding at runtime from the open entry (body + frontmatter → neighbor `forward_vector`s → cached floor) via a new `server/api/entry-agent.js`, page-agnostic. The agent is the page in **Companion mode**, posting as `from: <Entry> (Companion)` — a convention, **no new §2.2 verbs** — run on a **capable model first** (a Claude-code-resident actuator worker; no direct API). Ops: discuss, `append`, `prepend`, `rewrite`, `graffiti`. Every write goes through the **enforced path** (YAML-safe emit, `commit-spec`, armed write — never `fs.write`+`git add -A`); the change shows **optimistically as pending** (distinct glow), then **reconciliation** flips QUEUE→LOG. Graffiti: HTML-comment storage, STIGMERGY-rendered visible scrawl. Narration: adaptive (quiet unless non-obvious). Undo restores pre-commit; post-LOG undo is a new reconciled commit. *Acceptance:* a conversational instruction lands in the actual entry file, committed through the enforced path, reconciled in-deck; undo works pre/post-commit; graffiti round-trips; no write bypasses the path; new tests; suite green.

**M2 — Tier-B Shop dispatch (the ambition). ⏸ PARKED 2026-06-08.** *Deferred by choice — the spec below stays whole as the brief for the eventual build, not a live move.* Held back after M1 shipped: Loudon wants to use the Tier-A Companion more before the window grows a second, heavier mouth, and the Maker/Shop dispatch workflow is itself being developed on the **TRICKSTER board** — so the dependency now runs **maker/shop-on-TRICKSTER → M2**, not the reverse. The board work will settle the real shape of brief intake, the `blocking` fork handshake, and the `PROOF`/artifact return; M2 should plug the window into *that* known shape rather than a hypothesized one. **Revival conditions (do not pick M2 up until both hold):** (a) the Companion has been used in real editing sessions long enough to know what a *bold ask* actually feels like in the box (so classification is tuned against lived examples, not guesses); (b) the brief → `blocking` fork → `PROOF` handshake has been exercised end-to-end on the TRICKSTER board. First act on revival is the **seam** — intent classification folded into the Companion worker + an honest `maker_job` card — not the heavy Specialist path.

Intended design (intact): Intent classifier on a capable model returns `{tier, op}`, with the asymmetric safe default (**Tier A when unsure**). A Tier-B ask posts a job to the board as the Companion; the **actuator** spawns a worker running a **Maker** brief (intake → tiers → **Host Capability Check** → Specialist dispatch); the window becomes a **board-reader** (QUEUE card + `BROADCAST`/`PROOF` over SSE). Heavy Specialists (ComfyUI/Manim/Remotion/FLUX-local) route to the **Mac host** — degrade gracefully, never silent-fail. Genuine Maker choices post a `blocking` `RESOURCE_REQUEST` with `options` to TRICKSTER, surfaced in-window as option chips. Returned artifacts placed via **Enrichment**/**Deposit** through the enforced path; reconciliation closes the QUEUE item. *Acceptance:* "enrich this entry with a cyberpunk diagram" runs end-to-end — classified, dispatched to a Maker brief, routed to the Mac, returned as a placed artifact — with an honest QUEUE→PROOF→LOG trail and a fork surfaced when one arises; suite green.

**M3 — polish (follow-up; downstream of M2 — parked with it).** Comparison Mode (FLUX vs ComfyUI) surfaced as an in-window side-by-side the agent can apply from; narration tuning; performance pass — and only here, the build-order optimization: try pushing the proven classifier and Tier-A agent down to smaller/faster models.

## 6. Risks and invariants that must not break

- **No direct Anthropic API.** Loudon has no raw API access; every agent must be a Claude-Code-resident worker spawned via the Agent tool / actuator. Any design that reaches for an API SDK is wrong by construction — flag and reroute. (See memory: *Loudon does not have direct Anthropic API access*.)
- **The §2.2 wire is sacred.** `RESOURCE_REQUEST`, `blocking`, `payload`, the health block stay exact. The window adds a *convention* (`mode: Companion`), not new verbs, unless a schema ceremony says otherwise.
- **One write path; append-only board; never `git add -A`.** The window writes through the actuator's enforced path only. Honor the "single global worker per lane" scar.
- **Cowork sandbox can't host heavy Specialists.** ComfyUI/Manim/Remotion/FLUX-local need the Mac (`_tools/ComfyUI` is Mac-resident). The window must degrade gracefully to "queued for the Mac," never silently fail. (See memory: *Cowork sandbox specialist limits*.)
- **Cowork commits strand git locks.** Build/commit STIGMERGY changes Mac-side; if a Cowork session must commit, use the lock-safe committer. (See memory: *Cowork git locks*.)
- **The locked BBS aesthetic and the three-deck time ordering** survive untouched. Do not reorganize STATE/QUEUE/LOG by space; do not reintroduce character-cell ASCII rules; no login screen; viewport-fill.
- **Liveness must never fake completion.** Optimistic UI is allowed; an "uncommitted" state that masquerades as committed is not.

## 7. Open decisions for Loudon

1. **Graffiti semantics** — *Resolved 2026-06:* store in the existing HTML-comment graffiti form, render as a visible scrawl in STIGMERGY at the pin point. Formalizing that rendering into the palace standard is a separate queued to-do ([[Palace To-Do]]).
2. **Edit narration** — *Resolved 2026-06:* adaptive — quiet for a clean single-paragraph change; one short line only when the change is non-obvious or broader than asked.
3. **Companion as a mode vs. a Specialist** — *Resolved 2026-06:* a *mode* of the page (Pages-as-Agents), with its house editing standards + gotchas in a small dedicated meta-spec entry. Not a Shop Specialist.
4. **Where intent classification runs** — *Resolved 2026-06:* start on a capable model (accuracy first, not the cheap reflex), prove it, then optimize down to a small/fast model later. The asymmetric safe-default (Tier A when unsure) holds throughout. See the build-order principle in §5.
5. **First development target** — *Resolved 2026-06:* [[Merleau-Ponty]] is the Stage 0/1 *dev/test* target, not a special-cased page. The feature is page-agnostic (grounding built at runtime from whatever entry is open), so "first target" names where we prove it, not what it works on.

---

*Loudon Live · Autodidact Polymaths*
