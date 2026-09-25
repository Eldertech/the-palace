# rich-face — the renderer behind [[Enrichment]]

An entry's **rich face**: the entry's own words as the spine, read live from its `.md`, with the
sound, image and interactive pieces [[Enrichment]] made or gathered laid beside the headings they
serve. The ceremony (when and how to enrich a page) is `Enrichment.md`; this folder is the machinery.

## Open one

- With STIGMERGY running: `http://localhost:5173/rich/?entry=Kuramoto%20Coupling`
- Standalone: `node _ops/rich-face/rich-server.mjs` → `http://127.0.0.1:8842/?entry=Kuramoto%20Coupling`
  (or the `rich-face` launch config). Reviews still post to STIGMERGY (`--app`, default :5173).

Any entry opens. `&review=0` hides the review layer.

## Files

| file | what it does |
|---|---|
| `parse.js` | entry → sections → prose blocks and figures; the section fingerprint. Shared by the page and `fingerprint.mjs`, so a stamp and a check can't disagree. |
| `rich.html` | the renderer — reads the `.md` every few seconds, lays prose + figures + manifest pieces, marks drift, carries the review dock. All its URLs are relative, so it works at `/` and at `/rich/`. |
| `rich-handler.mjs` | the request handler: renderer + palace files (byte ranges), `_api/resolve`, `_api/find`, `_api/media`, `_api/review` → STIGMERGY `POST /api/persistent` as a `human_eval`. Mounted by STIGMERGY (`app/server/api/rich.js`) and by `rich-server.mjs`. |
| `rich-server.mjs` | the standalone server |
| `palace-find.mjs` | find an entry or a media file by name, Obsidian-style |
| `fingerprint.mjs` | section fingerprints and drift; `--stamp [section…]` records the "still true" verdict |
| `manifests/` | a workshop home for a manifest before its entry is placed; a manifest in the entry's bundle wins |

## The manifest — `[Entry]/[Entry] — rich.json`

Self-describing like any bundle file (`title`, `born`, `links`, `forward_vector`), then:

```json
{ "entry": "…", "tier": "sketch|study|piece", "made": "YYYY-MM-DD", "round": 1,
  "page": { "bed": { "file": "…wav", "volume": 0.14 } },
  "sections": [ { "heading": "In Our Instruments", "made_against": "<12 hex>", "made": "…", "stamped": "…",
      "pieces": [ { "file": "…", "origin": "made|gathered", "by": "…", "title": "…", "caption": "…",
                    "near": "<a phrase in a paragraph | a figure's filename>", "place": "margin|band", "height": 640 } ] } ] }
```

Bare filenames resolve in the bundle, then vault-wide by name; `/…` is palace-absolute. `near` anchors
a piece right after that paragraph or figure; otherwise it goes at the section's end. Audio, images and
text pieces default to the margin; video, interactives and diagrams to the band.

## The parser's rules

- `# Title` opens the first section; each `##` opens the next. Deeper headings stay inside.
  Blank lines before the first heading open nothing; anything else there joins the H1's section
  (with no H1, it opens a section keyed to the title). No two sections ever share a key that way.
- A figure is a blockquote holding media (its prose is the caption), a paragraph that is only an embed
  (an italic line right after it is the caption), or a ```` ```mermaid ```` fence.
- The **door** — any line linking `/rich/?entry=` — belongs to the plain view only: the rich face drops
  that line (the words around it stay; it is never a caption) and it never counts toward a fingerprint.
  Inside a code fence it is only text.
- A section's fingerprint is SHA-256 (first 12 hex) of its prose blocks, whitespace-collapsed. Figures'
  captions don't count — they travel with their media.

## Making pieces — the gotchas

- **One file, no build.** A piece is a single self-contained HTML (fonts from Google, everything else
  inline) so it plays inside the rich face and opened on its own. Worklet DSP goes in as a Blob URL,
  stereo in both places, a compressor after it ([[Web Audio Worklet]]).
- **Fixed canvas heights.** A canvas that takes its height from its own panel feeds back through the
  iframe's auto-fit and grows without end (Kuramoto's pieces passed 9,000 px).
- **One voice at a time.** Post `{type:'rich:play'}` to the parent when sound starts; stop on
  `{type:'rich:hush'}`. The page hushes every other video, strip and piece.
- **Test the claim headless.** Pull the worklet source out of the page and run it in Node against the
  equation the section states before trusting what the page shows. `check-kuramoto-pieces.mjs` is the worked example:
  `node _ops/rich-face/check-kuramoto-pieces.mjs` re-checks every claim Kuramoto's pieces make.
- **A line that links the rich face is the door**, not prose — the parser skips it, or adding it would drift its own section (Kuramoto, 2026-09-24).
- **Prefix the renderer's own classes.** An entry's diagram can define the same names — Kuramoto's Mermaid defines `drift`.
- **Name and header.** `[Entry] — rich — <what>.html`, with a leading comment carrying title, born,
  the parent link and a forward vector; `.md` pieces carry minimal frontmatter (the renderer strips it).
