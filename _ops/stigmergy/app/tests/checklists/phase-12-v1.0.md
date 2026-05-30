# v1.0 Phase 2 — LOG read · Visual Validator Checklist

Applies to screenshots in `screenshots/phase-12-v1.0/`:
- `log-stream.png` — the LOG deck on load (commit stream + filters + uncommitted banner)
- `log-commit-diff.png` — a commit's palace-aware diff (frontmatter field changes)
- `log-filtered.png` — the stream filtered to one entry/kind

## What this phase delivers

LOG — the retrospective deck, a git explorer that reads the live palace history. Honest by construction: git is the work's record, not a projection. It renders:

- **Commit stream as semantic cards** — newest first, each card showing the parsed `kind(scope)`, the summary, author, date, a one-glance diffstat (`Nf +A -D`), and structured trailers (verify, campaign, resolves). Color-coded by kind down the left border.
- **Pre-spec tolerance** — most palace history predates the commit spec, so kind is *inferred* from touched paths when no `Palace-Kind` trailer or spec-form subject is present; inferred kinds are dimmed and suffixed `?`.
- **Palace-aware diff** — clicking a commit opens a diff that renders frontmatter changes as FIELD-level changes (`stage: seed -> sprout`, `+2 links`, `forward_vector changed` with before/after), the body as a "body changed" flag, and media additions inline via the rich-content engine. Not a raw text diff.
- **Filters** — by kind (chips with counts), author (chips), pillar (joined against the entries catalog), entry (click a chip), free text, and time (since).
- **Campaign threads** — commits sharing a `Palace-Campaign` trailer collapse into one expandable thread.
- **Uncommitted-work banner** — the working-tree delta at the top; the invisible-dive hazard made visible.

## Items to verify

Return `pass` / `fail: <reason>` / `n/a` per item with a one-line citation.

### LOG chrome

1. **LOG banner** reads `log -- the git record` with a `past -- what happened` subtitle and an `N/M commits` count. No em dashes (`--` only).
2. **Deck tab `[L] LOG` is the active/inverted tab** while this deck is shown (black-on-phosphor), STATE/QUEUE dim.
3. **Uncommitted banner present.** Either a dim `working tree clean` line OR a `3px double` amber-bordered banner listing staged/unstaged/untracked counts. (During an active build the dirty banner is expected.)

### Commit stream

4. **Commit cards render newest-first**, each in a bordered card with a colored left edge keyed to its kind.
5. **Each card shows a kind badge** (`ops`, `deposit`, `weave`, `schema`, `enrich`, `edit`, `handoff`, `steward`, `mixed`, or an `other`), the summary text, and a diffstat (`Nf`, `+adds` in phosphor, `-dels` in red).
6. **Inferred kinds are visually distinguished** — dimmer, suffixed `?`, with a tooltip explaining "inferred from touched paths (pre-spec commit)". Trailer/subject-declared kinds are full-strength.
7. **The short hash renders in cyan** and is clickable (opens the diff). Author and date render in dim mono.
8. **Structured trailers render when present** — a `verified`/`unverified`/`couldnt` tag (green/amber/red), a `campaign: <slug>` chip (amber), a `resolves: <id>` note.
9. **Entry chips render under a card** (dashed-border, lowercase), and clicking one filters the stream to that entry. Big sweeps (>10 entries) collapse to `+N more`.

### Filters

10. **Kind filter chips** appear in a row labeled `kind`, each colored by kind with a count, e.g. `OPS (12)`. Clicking one inverts it and narrows the stream; clicking again clears.
11. **Author filter chips** appear in a row labeled `author` with counts (e.g. `Loudon Stearns (40)`, `Claude (...)`).
12. **Pillar filter chips** appear in a row labeled `pillar` (creation/tools/philosophy/practice). They join touched paths against the entries catalog.
13. **A `find` text input** narrows by subject/hash/entry. A `since` date input narrows by time. A `clear all` control appears when any filter is active.

### Palace-aware diff (the audition surface)

14. **Clicking a commit opens its diff view** with a `[B] back to log` control and the full hash shown.
15. **The diff header** shows the kind badge, summary (large), author/date/file-count/±lines, the commit body (if any) in a left-bordered pre block, and entry chips.
16. **Frontmatter changes render field-level**, NOT as raw text. A changed scalar shows `~ field: before -> after`; an add shows `+ field added: value`; a remove shows `- field removed`; `+N links` / `-N links` for link-set changes; `forward_vector changed` shows the before (red) and after (phosphor) quotes.
17. **Body changes render as a flag** (`body changed (prose diff in obsidian / git)`), not an inline text diff (deferred).
18. **Media additions render inline** — a changed/added image/audio/video file in a bundle renders via the rich-content engine (an `<img>`/`<audio>`/iframe), not as an opaque path. (May be `n/a` if the captured commit touched no media.)
19. **Non-md files render as compact rows** (path + `+A -D`, `(binary)` where applicable).

### Locked aesthetic (regression)

20. **No emoji**, **no rounded corners**, **no em dashes** (`--` only) anywhere in the LOG deck or diff view.
21. **CP437-evoked borders**: the commit-diff `COMMIT` box uses `3px double`; cards and file-diff rows use `1px solid`/`1px dashed`. No character-cell box-drawing.
22. **Phosphor palette holds** — green primary, cyan for hashes/links, amber for campaign/unverified, red for deletions/errors. No SaaS blue, no sans-serif.

### The spell

23. **Does the LOG read as a phosphor BBS terminal that has learned to render git as a legible activity log?** A `git log` a human can actually parse — kinds as event types, entries as subjects, the diff as field-level change. Call out anything that feels modern/SaaS.

## Return format

```
N. pass — <one-line citation>
N. fail: <reason> — fix: <suggested change>
N. n/a — <why not applicable>
```

End with:
- `OVERALL: pass` — every item passed (or was n/a)
- `OVERALL: fail (<count> items)` — at least one item failed
