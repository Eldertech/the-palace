# v1.0 Phase 1 — STATE read · Visual Validator Checklist

Applies to screenshots in `screenshots/phase-11-v1.0/`:
- `state-deck-pulse.png` — the STATE deck on first load (PULSE index of real palace entries)
- `state-deck-entry-reader.png` — an entry opened (Kuramoto Coupling)
- `state-deck-bundle-media.png` — the bundle panel with inline media
- `state-deck-typed-links.png` — the typed-link panel
- `log-deck-stub.png` — the LOG deck stub (Phase 2 placeholder)

## What this phase delivers

The three-deck navigation (`STATE / QUEUE / LOG = present / future / past`) is wired in as the top-level chrome, and **STATE — the read surface for entries themselves** — is fully built:

- A YAML-as-header rendering for every entry (title, type badge, stage glyph, pillar chips, forward-vector hero quote, metadata row).
- A typed-link panel (frontmatter `links`) **separate from** body wikilinks (SCHEMA §4 made visible).
- A bundle-aware navigator (SCHEMA §8) with media artifacts rendered inline via the existing v0.3 rich-content engine.
- A **PULSE vitality lens** as the default index — entries sorted by recency / activation_count / stage / has-handoff, not alphabetically.

QUEUE is preserved as a shim around the existing v0.4 board view (Phase 4 will reframe it). LOG is a stub announcing Phase 2.

## Items to verify

Return `pass` / `fail: <reason>` / `n/a` per item, with a one-line citation.

### Deck navigation (the spine)

1. **Three deck tabs visible**, side-by-side at the top of the chrome: `[S] STATE / [Q] QUEUE / [L] LOG`. Each carries a subtitle in dim phosphor: `PRESENT -- WHAT IS` / `FUTURE -- WHAT IS WAITING` / `PAST -- WHAT HAPPENED`. No em dashes — `--` only.
2. **Active deck is inverted** (black text on phosphor-green fill), mirroring the `ChannelTabs` inversion idiom. Non-active decks are dim phosphor on transparent.
3. **STATE is the default** on a fresh `/` load. The STATE banner reads `state -- the palace as it stands`. The deck name `STATE` is also inverted in the bottom command bar.
4. **Deck subtitles use `--` consistently** (no em dashes / no en dashes). Palace standing rule: no em dashes in copy.

### PULSE — the vitality lens (default index)

5. **PULSE list renders real palace entries.** The header text reads `PULSE -- vitality lens (N/N entries)` where N is the live palace entry count (≥ 100 against the real palace). The list is inside a `3px double` border (the primary container weight).
6. **Sort order is vitality, not alphabet.** The top entries should be those with high `activation_count`, recent `last_activated`, and high-energy stages (fruiting/growing/sprout/mature). Foundational metas may surface mid-list, not bottom.
7. **Each row shows: pulse meter, type, title, stage, last-activity.** The pulse meter is 5 ASCII dots (`*` filled / `.` empty), in monospace. The type is a single uppercase word in a per-type accent color. The stage is lowercase, dim. Activity is `YYYY-MM` or `YYYY-MM-DD`.
8. **Bundle and handoff markers are surfaced on the row.** Entries with sibling folders (Kuramoto Coupling, Project Stewardship System) show `[+bundle]`. Entries with an `## Active Handoff` block show `[handoff]` (warn-amber).
9. **The filter input narrows the list.** Typing `kuramoto` collapses the visible rows to entries whose title/type/path matches; clearing restores the full list.

### Entry reader — frontmatter header (YAML as header, not code fence)

10. **Title renders as a VT323 banner** (large, uppercase, phosphor-white glow), per the existing Banner primitive. The filename is *not* the title — the YAML `title` field is.
11. **Type badge + stage glyph + status badge + pillar chips** sit on one row beneath the title. Pillar chips use per-pillar accent colors (cyan/magenta/yellow/phosphor-bright); each pillar chip has a `1px solid` border in its accent color.
12. **Stage glyph is a 7-position lifecycle indicator.** `seed > sprout > growing > mature > fruiting > dormant > composting`. The current stage is `*` (filled, phosphor-white, glowing). Earlier stages are `o`; later stages are `.`. Arrows between positions are `>` for traversed, `-` for not. `foundational` shows as a single inert chip with no lifecycle row (per SCHEMA §2).
13. **Forward vector is the hero.** Rendered inside a `3px double` border with `phosphor-deep` fill, captioned `FORWARD VECTOR -- THE ENTRY'S CONATUS` in dim 10px. The quote uses italic phosphor with glow. Quotes around the value: `"..."`.
14. **Metadata row** (born / last_activated / activation_count / confidence / energy / who_leads / version) renders as compact `label value` pairs in dim phosphor + phosphor. Empty / zero / null values are omitted (no `(null)` placeholders).

### Entry reader — body (the conversational fabric)

15. **Body renders as Obsidian-shaped markdown.** Headings (`# ## ###`) use the VT323 display font. Paragraphs cap at `78ch`. Code fences render as dim `<pre>` blocks with `phosphor-deep` fill and a `1px solid` border. Lists (`-` and `1.`) render with phosphor bullets. Blockquotes (`>`) render with a left double-border.
16. **HTML comments are hidden.** `<!-- note -->` and `<!-- CLAUDE → LOUDON: note -->` do not appear in the rendered body.
17. **Body wikilinks** (`[[X]]`) render in `link` cyan with a dashed underline when **resolved** against the live palace index (`data-resolved="true"`); they render in `phosphor-dim` with a dotted underline when **unresolved** (with a `??` title hint).
18. **Bare URLs** (`https://`, `obsidian://`, `computer://`, `file://`) and markdown `[text](url)` links render as cyan dashed-underline `<a>` tags.

### Entry reader — typed-link panel (the semantic web)

19. **Typed links render in a distinct panel**, separate from the body. Header reads `TYPED LINKS (N)` with `1px solid` border weight (nested register).
20. **Each row shows: type, label, target.** Type in uppercase with per-type accent color (mirrors/enables/deepens/spawned/emerged-from/contradicts/couples-with/exemplifies/member-of/connects-to). Label in italic dim phosphor with parens (`(rhymes-with)`) or `--` when absent. Target with `-> ` prefix when known, `?? ` when unresolved.
21. **Links are grouped by type**, in SCHEMA §4 order. Known targets are clickable; clicking navigates to that entry.

### Entry reader — bundle panel (SCHEMA §8 made visible)

22. **Bundle panel only appears when the entry has a sibling folder.** Header reads `BUNDLE  <dir>  (N files)`. Hidden files (`.DS_Store`, `__pycache__`, `Archive/`) are excluded.
23. **Media (image / audio / video / html) renders inline** via the existing `ArtifactSlot` — images via `<img>`, audio via `<audio controls>`, html via sandboxed iframes. Non-media files render as a row with kind badge + filename link + size.
24. **Kuramoto Coupling's bundle shows multiple media artifacts** — at least one image (`.png`) and one video (`.mp4`) — visible in the entry reader, not as opaque file links.

### LOG deck stub (the placeholder)

25. **LOG deck mounts when L is pressed.** Banner reads `log -- the git record`. A bordered `COMING NEXT -- V1.0 PHASE 2` box lists the planned content (commit stream, palace-aware diff, filters, uncommitted banner). No fake data, no misleading affordances.

### Locked aesthetic (regression check)

26. **No emoji anywhere** in the STATE chrome, the entry reader, the PULSE list, or the LOG stub. ASCII glyphs only.
27. **No rounded corners**: every box, button, and chip has `border-radius: 0`.
28. **No em dashes in any STATE/LOG/PULSE copy.** Use `--` per the standing rule.
29. **CP437-evoked CSS borders**: primary containers use `3px double var(--phosphor-dim)`; nested cards / rules use `1px solid var(--phosphor-dim)`. No character-cell box-drawing (`╔═╗`) mixed in within the same screen.
30. **Page fills the viewport.** Only the message-body register caps at `78ch`. PULSE rows, the entry-reader header, and the bundle panel all expand to the viewport width.

### The spell (smell test)

31. **Does the whole STATE screen read as a 1988 phosphor BBS terminal that has been taught to render structured knowledge?** Anything that feels modern/SaaS — soft shadow, sans-serif fragment, blue link, oversized whitespace — is a fail. The validator's eye for "wrongness" is the most valuable signal.

## Return format

```
N. pass — <one-line citation>
N. fail: <reason> — fix: <suggested change>
N. n/a — <why not applicable>
```

End with:
- `OVERALL: pass` — every item passed (or was n/a)
- `OVERALL: fail (<count> items)` — at least one item failed
