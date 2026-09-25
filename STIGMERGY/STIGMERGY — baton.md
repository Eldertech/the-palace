---
title: "STIGMERGY — baton"
born: 2026-09-25
links:
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[STIGMERGY]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: STIGMERGY — hardening

## Move

Close the doors the re-check found open in STIGMERGY and its rich face: sandbox the rich face's pieces and pin its CDN scripts, stop cross-site writes to the board and the host check that runs too late, settle the review message's wire conventions, and steady the flaky regen-lane test.

## Why this move matters

STIGMERGY runs on Loudon's machine and holds his board — the palace's shared record, where TRICKSTER is his own voice. Today any web page he visits can write to it, and the rich face runs pieces with full authority over the server that serves them. None of this has been exploited; it is cheap to close now and expensive to discover later. Each finding below came from a code reviewer — reproduced on a scratch server or read in the code, never tried against the live one.

1. **The rich face runs pieces with the server's authority.** STIGMERGY sandboxes served HTML on purpose (`app/src/…/ArtifactSlot.jsx:34–43`, `sandbox="allow-scripts"`; `app/README.md` ~:86). The rich face puts its pieces in **unsandboxed, same-origin** iframes (`_ops/rich-face/rich.html` ~:247), so a piece can call `/api/entry/save`, `/api/commit/create`, `/api/launch`. It also imports `marked@12` and `mermaid@11` from jsdelivr with no exact version and no integrity check (`rich.html` ~:168, ~:274), so a CDN compromise has the same reach. Options named, not chosen: serve the rich face from its own origin (the standalone `rich-server.mjs` on :8842), or sandbox the pieces and do auto-height and one-voice-at-a-time over `postMessage`. Either way, vendor or exactly pin the two libraries.
2. **Any page can write the board.** `/api/persistent` accepts a `text/plain` POST from any origin, with full control of `type`, `from` and `board` — a "simple" cross-site request needs no preflight. Requiring `application/json` plus an `Origin` check closes it.
3. **The host check runs after the palace's routes.** Vite's DNS-rebinding guard sits behind plugin middleware, so it protects nothing under `/api` or `/rich` (live: `Host: evil.example` gets 200 on `/rich/_api/resolve` and `/api/persistent`, 403 on `/`).
4. **The review message's wire.** `human_eval` posts use a per-day `session_id` (§9 says one slug per agent, reused) and the `FLAGS` board (§9: "connections worth keeping") — both copied from `loudon-eval`. No review has ever been posted, so changing them now costs nothing. A decision for Loudon.
5. **Smaller, from the same review:** `rich.html` ~:211 keeps its own media-extension list (no ogg/m4a/flac), so `[[take.ogg]]` renders as a link; `ONLY_MEDIA_LINE` doesn't know the `[[file|label]]` shape; two `##` headings with the same text still share one section key; symlinks inside the palace are followed out of it by both `/rich/` and `/api/file` (none escape today).
6. **The regen-lane teardown race.** `tests/integration/regen-lane.test.js` › "refuses a second render while one is running" failed three times on 2026-09-25 under full-suite load (`ENOTEMPTY` in `afterEach`, ~:71) and passes alone every time. A suite that cries wolf trains its readers to ignore it.

## Cold start

COLD START — this work has not begun; no prior state, no tried-and-rejected. What already landed from the same review, so it isn't redone: the null-body crash, stream errors, body cap, Host-forwarded reviews, the parser's phantom section and door rule, the vacuous traversal test (`8d28ae7d`…`bbacfc63`).

## Next move

Start with 2 and 3 — they protect the board, the one thing every agent shares — each with a test that fails first, then the rich face's origin question (1), which wants Loudon's choice before any code. Bring 4 to him as a one-line decision. Leave 6 until the rest is green, then fix the race rather than retry it.

## Receiving environment

Claude Code on the Mac. Work in a worktree: `node _ops/worktree/new-worktree.mjs --name fix/stigmergy-hardening --profile stigmergy` (tests need `node_modules`). Changes under `_ops/stigmergy/app/server/*` only when no steward run is live (`ps -axo command | grep "You are a permanent steward" | grep -v grep` prints nothing). Loudon's STIGMERGY on :5173 serves `main`; a server change reaches it only after landing, and may need a restart — ask him first.

## Calibrations from this session

- Every fix gets a test that fails on the old code first; show the diff before it lands.
- Never POST to the live :5173 from a test or a probe — reproduce on a scratch server. A `human_eval` is Loudon's voice.
- Never run `tests/e2e/rich-content-roundtrip.spec.js` on the owner: it rewrites the shared board file.
- Other sessions are live on `main`: commit with explicit pathspecs, rebase before landing.
- Opus agents do the heavy reading; warn Loudon before a large fan-out.

## Load these files first

1. This baton, and the close commit `2ea8f12e` (the whole re-check, item by item).
2. `STIGMERGY.md` § Rich faces, and `SCHEMA — Reference.md` §9 (the wire).
3. `_ops/rich-face/rich.html`, `_ops/rich-face/rich-handler.mjs`, `_ops/stigmergy/app/server/api/rich.js`.
4. `_ops/stigmergy/app/server/http.js` (the `/api/persistent` POST, `MAX_BODY_BYTES`), the Vite config, `ArtifactSlot.jsx`.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
A pickup has two beats: **claim** it when you catch it, **close** it when the move lands. The card stays visible in between — a claim that ages with no close is how a dropped baton (a "fumble") surfaces instead of vanishing. (A parent-entry baton that was never announced on the board has no card; skip the board posts — just remove the pointer and delete the file at close, step 8.)

**Catch it — claim:**
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it may already be done before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. For a board-announced baton, `node _ops/stigmergy/pickup-handoff.mjs <id>` prints exactly this reconciliation view — every commit that touched the entry since the baton posted — and then claims the card, so run it and read the list *before* you continue. If the move is already done, superseded, or no longer wanted, STOP — do not claim it; surface to Loudon, and if it plainly landed already, close it as a reconciler (step 7). A stale baton followed silently produces drift. (The auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive step 8 relies on.
4. Claim it. For a board-announced baton (it shows in `list-handoffs`), the `pickup-handoff.mjs` from step 2 has already posted the claim (`handoff_picked_up`, `lifecycle: claim`) — the card moves to **CLAIMED (in flight)**; it does *not* leave the board. Leave the "Active Baton" pointer and the baton file in place for now — they come out at close, so a fumble mid-move never erases the work.
5. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above.

**Close it — when the move lands:**
7. Post the close. `node _ops/stigmergy/close-handoff.mjs <id | entry> --commit <hash>` retires the card — an explicit close is the *only* thing that clears it (done is never inferred). Cite the commit that landed the move: it makes the close a checkable claim, not a self-report. **Complete, or re-baton the rest:** if you finished the whole move, close plain; if you did only part, `--partial --remainder "<what's left>"` posts the leftover as a fresh `handoff_ready` so it reappears as open work. Never let "in the spirit of the original" quietly drop scope — a gap becomes a new baton, not silence.
8. Delete the baton file (git is its archive) and remove the "Active Baton" section from the parent entry. On a surface that can't delete (Cowork), remove the pointer and note "deletion pending." Steward batons are the exception — updated in place, never deleted or closed.
