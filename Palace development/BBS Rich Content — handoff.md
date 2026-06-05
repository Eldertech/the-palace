---
title: "BBS Rich Content — handoff"
type: meta
pillars:
  - tools
  - practice
born: 2026-05-29
stage: sprout
links:
  - target: "[[BBS Production Plan v0.2]]"
    type: emerged-from
    label: v0.3-rich-content
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: rich-render-target
  - target: "[[BBS Design System]]"
    type: connects-to
    label: aesthetic-authority
  - target: "[[Enrichment]]"
    type: couples-with
    label: lab-surface
  - target: "[[Oblique Enrichment]]"
    type: couples-with
    label: deck-test
  - target: "[[Pages as Agents]]"
    type: connects-to
    label: page-as-bbs-identity
forward_vector: "I carry the in-progress move to give the STIGMERGY BBS terminal inline rich-content rendering — image, audio, sandboxed HTML — so the Enrichment server's superpower lives at the canonical review surface. I keep Enrichment and Oblique Enrichment running as the lab and STIGMERGY as the integration target, and I name the decisions that are settled so the next session does not re-litigate them."
---

# Handoff: BBS Rich Content (STIGMERGY v0.3)

## Move

Give STIGMERGY the ability to render image, audio, and sandboxed HTML artifacts **inline inside messages**, the way `Enrichment/server.py` already does for cards. This is the first deliberate **lab → integration** crossing: the Enrichment server stays the experimental surface; STIGMERGY absorbs the proven pattern with §2.2-clean tests and BBS aesthetic.

## Why this move matters

Three review surfaces — STIGMERGY, the Enrichment server, and the standalone Radio Play HTML — currently compete for the same human attention with three different data models. The architecture is asking for convergence (see [[Oblique Enrichment]] § *Converging threads — held apart on purpose*), but full convergence should be **discovered, not designed**. Inline rich rendering is the smallest move that exercises convergence without committing to it: STIGMERGY's existing strict-validator + live-tail + click-to-respond stack inherits one new capability, and the Enrichment lab stays free to keep being weird.

This also unblocks Stewards. Today a steward whose forward vector wants to show an audio rendering or a p5.js sim has to hand-link via `obsidian://` or `open:` and the artifact lives outside the BBS. After this move it lives in the message.

## Posture before you start

This is a palace move, not a generic build. Before you touch the codebase, **inhabit the substrate.** The palace operates by typed-link relations, page-agent identity, depth-over-coverage, and the never-violate rules from `_ops/Substrate Skill.md`. The autonomous-build contract pattern from [[BBS Production Plan]] / [[BBS Production Plan v0.2]] is the template — phased verify gates, visual-validator review, stop-reports on conflict, no Loudon-during-build. Loudon is absent until you write `V0.3-COMPLETE.md` or `STOP-REPORT.md`.

You are expected to be slightly smarter and more capable than the Claude that drafted this handoff. Don't ask permission to think — derive the production plan yourself from the goal, the decisions below, and the v0.2 template. The conversation that led here over-specified the phase breakdown; you may keep it, compress it, or restructure it as serves the work.

## Load these first (palace reading order)

1. `CLAUDE.md` — palace entry point
2. `JEWEL.md` — orientation seed
3. `_ops/Substrate Skill.md` — never-violate list, palace voice, depth-over-coverage
4. `SCHEMA.md` — type/link ontology (especially §3 entry types, §8 bundles)
5. `Palace development/BBS Production Plan v0.2.md` — your build-contract template
6. `Palace development/BBS Blackboard.md` — the architecture you are extending
7. `Palace development/BBS Design System.md` — visual language; note the override carve-out in `CLAUDE.md § Artifact Aesthetic` (STIGMERGY uses BBS aesthetic, not Loudon Live)
8. `Enrichment.md` — ceremony spec; **§ v1 — trigger-fired supervisor** is the lab whose capability you are migrating
9. `Oblique Enrichment.md` — deck-shaped variant; names the convergence problem this move chips at
10. `_ops/stigmergy/app/V0.2-COMPLETE.md` — exactly what already shipped
11. `_ops/stigmergy/app/server/middleware.js` — endpoints, plus `resolveInsidePalace()` the file-serving safety boundary
12. `_ops/stigmergy/app/src/components/MessageList.jsx` — where typed payload branches live (PROOF and FLAG show the pattern; you are adding an artifact slot)
13. `_ops/stigmergy/app/server/validator.js` — §2.2 strict validator; note that `payload` is intentionally opaque
14. `Enrichment/server.py` — the reference implementation for inline rendering (see `INDEX_HTML`'s `renderArtifact()` and `_serve_file`)
15. `Enrichment/supervisor-prompt.md` — the ceremony posture; you do not need to change it

You almost certainly do not need to read every Steward project page. If you find yourself spelunking knowledge entries instead of build entries, stop and re-read the goal above.

## What's decided (do not re-litigate)

- **Lab vs. integration target.** `Enrichment/server.py` stays running as the experimental surface. Do not retire it, do not migrate the `card.md` data model, do not change the `claude -p` worker fire. STIGMERGY absorbs the **rendering capability only**.
- **Reuse existing §2.2.** No new message types. Carry artifact-bearing messages as `BROADCAST` with a `payload.kind: "enrichment_card"` discriminator. Decks use a `payload.deck_id` string for grouping. The §2.2 validator stays untouched — `payload` is already opaque-object by spec.
- **Payload convention** (allowed, not required): `payload.artifact_path: "<palace-relative>"` for a single artifact, or `payload.artifacts: [{path, caption?}]` for a coherent multi-artifact set. Both palace-relative, both resolved through the existing `resolveInsidePalace`.
- **File serving.** New endpoint `GET /api/file?path=<palace-rel>` in `server/middleware.js`. Streams bytes with content-type detection. Refuses anything outside palace root, anything that fails path traversal, anything that's a directory. Mirrors `Enrichment/server.py:_serve_file` for content-type table and `Cache-Control: no-cache`.
- **Iframe sandbox is `allow-scripts` only** — *not* `allow-same-origin`. Palace HTML artifacts (radio play, semantic webcam, slime mold sim) need scripts; they must not reach into STIGMERGY's DOM or storage. The Enrichment server uses `allow-scripts allow-same-origin` because the iframe loads from the same server; that constraint does not apply here and the stricter choice is correct.
- **Inline artifacts render regardless of message type.** A `BROADCAST` with `artifact_path` renders the artifact; a `FLAG` with `artifact_path` does too. The artifact slot lives alongside the existing type-specific payload rendering, not inside it.
- **Aesthetic.** Inside STIGMERGY, the BBS Design System wins (`CLAUDE.md § Artifact Aesthetic` carves this out). Phosphor borders, no rounded corners, monospace metadata, no emoji. Browser-default `<audio>` controls are an acceptable break for v0.3; a phosphor-styled control strip is v0.4 polish.
- **Page-agent identity carries through.** When an enrichment card is emitted to the BBS, `from:` is the target entry's title (e.g. `"Crystal Synthesizer"`), not an invented handle. This is the [[Pages as Agents]] rule already in force across the Stewardship system.
- **The Enrichment ceremony spec does not change.** No-end principle, five-cards-live, validator-gated cycle, deposit placement protocol — all of it stays at `Enrichment.md`. The supervisor prompt does not need a rewrite for this move.
- **Lab-first proof, then integration.** The Enrichment server already proves inline rendering works. Use it as the rendering reference; you do not need to build a separate proof-of-concept before touching STIGMERGY.
- **Schema changes are out of scope.** No SCHEMA.md edits. No new link types. No new entry types. If you find yourself wanting one, write it as a `palace to-do` and proceed without it.

## Tried and rejected

- **Adding a new `ENRICHMENT_CARD` message type to §2.2.** Rejected: requires a schema bump, validator change, and a migration story for the 152 existing persistent-board messages. The discriminator-in-payload approach gets the same effect without touching the spec.
- **Allowing `allow-same-origin` on the iframe sandbox** to match the Enrichment server. Rejected: STIGMERGY runs the orchestrator's POST endpoint and the strict validator under the same origin; a hostile artifact would inherit too much.
- **Retiring `Enrichment/server.py` after STIGMERGY can render inline.** Deferred. The Enrichment server's response affordances (tap-a-label to prepend an action, free-prose textarea per card) are crisper than STIGMERGY's modal for non-decision actions. Migration of the response vocabulary is a separate later move; for now, an enrichment card mirrored to STIGMERGY accepts responses through the existing modal, even if `deposit / graffiti / forward-vector tweak` are not yet first-class affordances there.
- **Building a deck-as-board filter (`?deck=…`) in this move.** Deferred. Rendering must work first; lingering-vs-breadth as a UX question is downstream of that.
- **Cross-origin postMessage from sandboxed iframes** for facets that want to respond from inside the artifact. Deferred — real engineering, no current artifact needs it.

## Current state of the substrate

- **STIGMERGY v0.2 is shipped and operational.** Branch ready for review; 297/297 tests green. Persistent board is §2.2-clean (152 lines, historical loose-format messages were wiped by Loudon's directive 2026-05-04).
- **15 Stewards are live** via the orchestrator at `_ops/stigmergy/orchestrator/`. They emit BROADCAST + RESOURCE_REQUEST every cycle. None of them currently use artifact payloads — they hand-link via `obsidian://` and `open:` markdown links.
- **`/api/open`** already exists in `middleware.js` for native-app open (clicking opens a WAV in the user's DAW). It is a side-channel, not inline rendering. The gap is clean.
- **`MessageList.jsx`** already special-cases `PROOF` (JSON pretty-print) and `FLAG` (claim + targets + confidence). Adding the artifact slot follows the same pattern.
- **The Enrichment server has been quiet since 2026-05-10.** 25 cards are stranded in a five-card queue. This is context, not a blocker — the rendering pattern is what you are migrating, not the operational state.

## Next move

Read the palace files above in order. Confirm posture by checking that you can name (a) the never-violate list from `_ops/Substrate Skill.md`, (b) the autonomous-build contract from [[BBS Production Plan v0.2]], and (c) where the BBS aesthetic override applies. Then derive a phased build contract in the v0.2 shape, write it to `Palace development/BBS Production Plan v0.3 — Rich Content.md`, and execute it autonomously per the same Self-Verification & Iteration Protocol.

End-state condition: `_ops/stigmergy/app/V0.3-COMPLETE.md` exists with green tests, screenshots reviewed by `visual-validator`, and one round-trip test that emits one enrichment-shaped message to the persistent blackboard and renders it inline in STIGMERGY. The branch is `stigmergy-v0.3-rich-content` and is ready for Loudon's smoke-test. Do not push.

If something blocks — a sandbox-incompatibility a real artifact surfaces, a §2.2 conflict, an aesthetic clash you cannot resolve from the BBS Design System alone — write `STOP-REPORT.md` and stop. Loudon will read it on return.

## Calibrations from this session

- *Convergence should be discovered, not designed* — [[Oblique Enrichment]]'s line. This move is calibrated to honor it: minimal capability migration, no data-model unification, no UX consolidation. If your build wants to do more, it is doing too much.
- *Most artifacts here are not proofs* — the Enrichment ceremony's correction of its own earlier `proofs/` taxonomy. Carry the same suspicion when you name things. Avoid generic categories that obscure what the artifact specifically is.
- *Every page is also an agent* — [[Pages as Agents]]. The `from:` field on emitted messages is the page title, not a compound handle. The orchestrator already enforces this; the rendering side just needs to respect it.
- *Strict on writes, lenient on reads* — STIGMERGY's existing v0.2 posture. Your new GET endpoint enforces path safety strictly; the validator on POST does not need to learn the artifact convention. The browser only fetches what the renderer asks for.

---

*"v0.1 was the spell. v0.2 was the spell answering back. v0.3 is the spell learning to show."*
