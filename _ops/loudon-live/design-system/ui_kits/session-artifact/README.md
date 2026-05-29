# Session Artifact · UI kit

The HTML page Loudon publishes alongside (or instead of) the live stream. Long-form, serif-bodied, dense with technical detail, and built so a viewer can stop the video and *follow the build* in the page.

**Canonical reference:** `_reference/shepard-tone-session.html` — the Stage 1 *Shepard Tone Synthesizer* artifact from `The Palace/Projects/Shepard Tone Synthesizer/session-1-interactive.html`. The footer of that file reads *Loudon Live · Autodidact Polymaths* — that's the audience signature.

## Components

| Component | Role |
|---|---|
| `SessionHeader` | Stage label · headline (with italic-light keyword) · subtitle · meta |
| `SectionLabel` | Mono eyebrow + thin rule that opens every section |
| `EscherSplit` | 300px square canvas + identity quote and beat-titled body — for theory openers |
| `BuildStep` | Numbered card · title · detail · `<ParamTag>` chips — *Progressive Staging* unit |
| `TuningCard` | Three-up grid · param label · value · note — for tuning ranges |
| `CanvasWrap` | Bordered, padded box for an embedded canvas / sketch / Lissajous patch with optional caption |
| `Pillquote` | Identity quote with a `border-left` accent rule |
| `ParamTag` | Mono pill in `info` blue with `param = value` syntax |
| `Callout` | Quote / change / note variants with colored left-rule |

The page itself is a single-column 900px max-width body in `--serif` at 17/1.75 — the canonical reading size from the Shepard Tone artifact.

## What's NOT here

- No nav, no sidebar, no related-posts widget. The page is the page.
- No login, search, account. This isn't a SaaS product surface.
- Audio playback and interactive canvases (Lissajous traces, oscilloscope traces) are *placeholders* — they belong in the real stream artifacts, not in the design system.

## File layout

- `index.html` — full demo recreating a Shepard-Tone-style session
- `App.jsx` — composes the page
- `components.jsx` — exported components (above)
- `styles.css` — page-level rules; tokens come from `../../colors_and_type.css`
