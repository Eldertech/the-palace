# Phase 17 (v1.0 Phase 5 Stage A — STATE write, dry-run) — visual checklist

The visual-validator subagent reads this file alongside the captures in
`screenshots/phase-17-v1.0/` and answers each item with **pass / fail / n/a**
plus one line of justification.

## What we are auditing

A dry-run STATE editor: open an existing entry, edit its frontmatter through
SCHEMA-bound forms and its body in a markdown textarea with `[[wikilink]]`
autocomplete, and on Save see exactly the structured commit STIGMERGY WOULD
make — subject + derived `Palace-*` trailers + unified diff. **No file is
written; no commit is made.** Stage A is the gated foundation that Stage B
(armed writes through a `git worktree`) will inherit unchanged.

## Captures

| File | What it should show |
|---|---|
| `state-edit-form.png` | The editor open on Kuramoto Coupling: body textarea on the left with the actual markdown body; right rail with the frontmatter form — `title`, `type` picker, `stage` 7-chip stepper, `pillars` chips, `born`, `forward_vector`, optional `links` editor. The `[B] cancel` / `[E] edit` chrome and the "Stage A · dry run only" banner are present. The `editing · Kuramoto Coupling · clean` marker reads honestly. |
| `state-edit-preview.png` | After clicking Save with a stage change: the preview panel shows the structured commit subject (`edit(Kuramoto Coupling): …`), the derived `Palace-*` trailers (`Palace-Kind: edit`, `Palace-Entry: Kuramoto Coupling`, `Palace-Stage: Kuramoto Coupling: mature->fruiting`, `Palace-Verify: verified`, `Palace-Author: loudon`), and a unified diff with `-stage: mature` / `+stage: fruiting` highlighted. No write banner; the editor stays in "preview" mode. |

## Items to verify

### Form widgets bind to SCHEMA (the §7 self-description guarantee)

- [ ] `type` is a picker offering all 12 SCHEMA §1 enum values (concept, hub, project, breakthrough, source, meta, practice, person, question, spore, specialist, maker).
- [ ] `stage` renders as a 7-segment lifecycle stepper (seed → sprout → growing → mature → fruiting → dormant → composting). The current stage is visibly selected.
- [ ] `pillars` renders as multi-select chips with the four SCHEMA §3 pillars (creation, tools, philosophy, practice). The entry's existing pillars are visibly active.
- [ ] `forward_vector` is a textarea with a conatus hint (striving verbs over stasis).
- [ ] `links` is a repeatable row editor: each row has `target`, a `type` dropdown bound to the 10 SCHEMA §4 link types, and a `label` field.

### The dry-run promise

- [ ] The chrome reads "Stage A · dry run only" and "Save shows the structured commit STIGMERGY would make. Nothing is written."
- [ ] No "saved" / "committed" / "wrote file" affordance appears anywhere in the editor.
- [ ] The Save button reads `save · preview commit` (not `save · commit`).

### The structured commit preview

- [ ] Subject line is rendered prominently, in `edit(<entry>): <summary>` format.
- [ ] Palace-* trailers are listed as plain monospace lines (no form, no editing — these are derived, not authored).
- [ ] The trailer set includes `Palace-Kind`, `Palace-Entry`, the appropriate `Palace-Stage` for a stage transition, `Palace-Verify`, and `Palace-Author`.
- [ ] The unified diff renders with green `+` lines, red `-` lines, dim `---`/`+++` headers, and a `@@` hunk line — palace-LOG-deck colorways.
- [ ] The diff's first line carries the entry's palace-relative path (not a temp-dir path).

### Dirty tracking + validation

- [ ] On open, the `editing · <title> · clean` marker is shown.
- [ ] After changing the stage chip, the marker switches to `editing · <title> · ● unsaved`.
- [ ] The Save button is disabled until both (a) the form is dirty and (b) the summary field is non-empty.

### Allow-list (the hard guardrail)

- [ ] An "edit" button appears on ordinary entries (Kuramoto Coupling, Shop/Three.js, Projects/Foo).
- [ ] On canon files (CLAUDE.md, SCHEMA.md, SUBSTRATE.md, ROSETTA.md, FOUR PILLARS.md, _ops/*Ceremony*.md), the "edit" button is disabled / dimmed and a tooltip names the reason.

### BBS aesthetic discipline

- [ ] Phosphor-on-black is preserved throughout the editor surface.
- [ ] All chrome uses VT323 / IBM Plex Mono / JetBrains Mono — no system fonts leak in.
- [ ] No emoji, no color outside the locked phosphor / warn / error / ok palette.
- [ ] `[B] cancel` and `[E] edit` hotkey chips match the rest of STIGMERGY's chrome.

## Out of scope for this gate

- Stage B armed writes (`STIGMERGY_ARM_WRITE=1`) — designed, not built. Worktree integration deferred.
- Bundle file editing — SCHEMA §8 bundle files (handoffs, contexts) have minimal YAML; a lighter editor comes later.
- Body markdown live preview — Stage A uses a plain textarea + wikilink popup; CodeMirror or similar deferred.
- Topology Lens — that is Phase 5.5.
- Reconciliation (the QUEUE↔LOG spine close) — that is Phase 6.

If anything fails, the visual-validator writes a short rationale and the gate is treated as **fail**; iterate until pass.
