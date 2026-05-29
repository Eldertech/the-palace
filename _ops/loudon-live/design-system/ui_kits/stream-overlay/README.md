# Stream Overlay · UI kit

A pixel-perfect mockup of what a Loudon Live stream looks like *on YouTube* — the composited view a viewer sees during a live broadcast. Recreates the OBS overlay system specified in `The Palace/Loudon Live/Loudon Live — launch kit.md` §5.

This kit is a single 1920×1080 stage; the design isn't a flow but a *scene* with togglable parts.

## Anatomy of the live scene

| Layer | Role |
|---|---|
| **Background** | Loudon's screen share (full-bleed); placeholder uses spectral-bands generator |
| **Cam frame** | Webcam, 480×360 lower-right, 6px accent border |
| **Lower-third** | "Now building · *project*" or "Tool in focus · *name*" — togglable |
| **Live tag** | ● LIVE · stream 003 · 47:12 elapsed (top-left, persistent) |
| **Topic strap** | Today · subject — small monospace eyebrow under the live tag |
| **Watermark** | LL monogram, bottom-right corner — present on every frame |
| **Chat overlay** | Optional translucent chat column on the right (off in this view; toggleable) |

## What's NOT here

- No login, no monetization surface — this is the *viewer-facing* OBS composite, not Studio.
- Chat is mocked as a static column (the toggle is real, the messages are static).
- The screen-share background is a placeholder generator-element; in production it is whatever Loudon's screen is doing live.

## File layout

- `index.html` — the live scene with one tweakable demo control (toggle chat)
- `components.jsx` — `LiveTag`, `LowerThird`, `CamFrame`, `Watermark`, `ChatColumn`, `TopicStrap`
- `styles.css` — page-level + 1920×1080 stage scaling
