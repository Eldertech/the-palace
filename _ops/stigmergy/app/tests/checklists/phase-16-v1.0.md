# v1.0 Phase 4.5 — Enrichment consolidation · Visual Validator Checklist

Applies to screenshots in `screenshots/phase-16-v1.0/`:
- `card-queue.png` — the QUEUE deck with the absorbed Enrichment card queue (full page)
- `card-detail.png` — the first enrichment card framed (artifact + verdict + actions)

## What this phase delivers

QUEUE absorbs the Enrichment ceremony's card loop (Revision 2 §3). The card model, the validator-verdict strip, and the deposit/revise/discard response loop now live inside STIGMERGY's QUEUE deck, driven by the Phase 2.5 actuator -- the standalone Flask server (`localhost:7878`) is superseded. Cards are read from `Enrichment/card-*` folders; responding writes the `inbox.md` block and fires the supervisor worker through the actuator (the same guarded, stub-gated primitive -- real fire only when armed).

## Items to verify

Return `pass` / `fail: <reason>` / `n/a` per item with a one-line citation.

### The card queue section

1. **An `ENRICHMENT CARDS` section** renders inside the QUEUE panel, below the ranked items, separated by a `1px solid` rule. Heading in magenta (`--ansi-bright-magenta`), uppercase.
2. **A card count + refresh** show beside the heading (`N in queue`, dim; `refresh` in cyan, underlined).
3. **Each card renders as a bordered card** with a magenta `3px` left edge and a magenta `enrichment` tag, the card id (dim), and the target-entry name (phosphor).

### A card's content

4. **The purpose tag** renders in dim italic (`purpose: ...`).
5. **The summary** renders in phosphor body text, wrapping at ~78ch.
6. **The artifact renders inline** -- a text artifact in a bordered `<pre>`; an image/audio/iframe via the rich-content engine (an `<img>` / `<audio>` / sandboxed iframe). NOT an opaque file link.
7. **The validator-verdict strip** renders when present -- a `pass` (phosphor) / `revise` (amber) / `kill` (red) tag, with the validator note available on a `[+] validator note` toggle.

### Response controls

8. **deposit / revise / discard / more-like-this** controls render as bordered uppercase chips, color-coded (deposit phosphor, revise amber, discard red, more-like-this cyan).
9. **The controls are present but the screenshot shows no firing** -- this is a render capture; no modal/spinner/“fired” banner should be mid-flight (unless a prior manual action left feedback).

### Locked aesthetic (regression)

10. **No emoji**, **no rounded corners**, **no em dashes** (`--` only) anywhere in the card queue.
11. **CP437-evoked borders**: card boxes `1px solid` with a `3px` colored left edge; the `<pre>` artifact `1px solid`. No character-cell box-drawing.
12. **Phosphor palette holds** -- green primary, magenta for the enrichment accent, cyan for links, amber/red only for verdicts/discard. No SaaS blue, no sans-serif.

### The spell

13. **Does the card queue read as the Enrichment studio-visit, now inside the BBS?** A rolling queue of cards, each with its artifact and a verdict, awaiting a deposit/revise/discard call. Call out anything that feels like a separate app bolted on rather than a native QUEUE section.

## Return format

```
N. pass — <one-line citation>
N. fail: <reason> — fix: <suggested change>
N. n/a — <why not applicable>
```

End with:
- `OVERALL: pass` — every item passed (or was n/a)
- `OVERALL: fail (<count> items)` — at least one item failed
